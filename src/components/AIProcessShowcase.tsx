import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Upload,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import uploadImg from "@/assets/process-upload.jpg";
import scanImg from "@/assets/process-scan.jpg";
import resultImg from "@/assets/process-result.jpg";

const PHASES = [
  { n: 1, title: "העלאת תמונה", sub: "תמונת ייחוס מאובטחת" },
  { n: 2, title: "ניתוח AI", sub: "זיהוי גזרה, פרופורציה וטון" },
  { n: 3, title: "הלוק שלך", sub: "פריטים אמיתיים עם קישורי קנייה" },
];

const ITEMS = [
  { name: "בלייזר מחויט", store: "ZARA", price: "₪549" },
  { name: "חולצה לבנה פרימיום", store: "COS", price: "₪229" },
  { name: "מכנס מחויט", store: "Massimo Dutti", price: "₪389" },
  { name: "נעלי עור אוקספורד", store: "Boutique", price: "₪620" },
];

const PHASE_MS = 4800;

export function AIProcessShowcase() {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 within current phase
  const startRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / PHASE_MS, 1);
      setProgress(t);
      if (elapsed >= PHASE_MS) {
        startRef.current = now;
        setPhase((p) => (p + 1) % 3);
        setProgress(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const images = [uploadImg, scanImg, resultImg];
  const pct = Math.round(progress * 100);

  // iris aperture amount (closes on scan, opens on result)
  const iris =
    phase === 0
      ? 6 + progress * 4 // gentle breathing
      : phase === 1
        ? 18 - progress * 14 // closes inward
        : 4 + progress * 2; // fully open

  return (
    <section id="how" className="relative mx-auto max-w-6xl px-4 py-28">
      <div className="mb-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-[#e7c98a]" />
          הצצה לתהליך
        </span>
        <h2
          className="mt-5 text-4xl font-medium tracking-tight sm:text-5xl"
          style={{
            backgroundImage:
              "linear-gradient(180deg,#ffffff 0%,#fbf3e2 55%,#e7c98a 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          איך זה עובד
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          שלוש פאזות. פחות מדקה. לוק שלם עם קישורי קנייה אמיתיים.
        </p>
      </div>

      {/* Cinematic stage */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/55 backdrop-blur-xl">
        {/* gold hairline accent */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(231,201,138,0.55), transparent)",
          }}
        />

        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT — cinematic visual stage */}
          <div className="relative aspect-[4/5] overflow-hidden bg-black lg:aspect-auto lg:min-h-[600px]">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                width={832}
                height={1024}
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: phase === i ? 1 : 0,
                  filter: "grayscale(1) contrast(1.06) brightness(0.95)",
                  transform:
                    phase === i
                      ? `scale(${1.02 + progress * 0.02})`
                      : "scale(1.1)",
                  transition:
                    "opacity 1100ms cubic-bezier(.4,0,.2,1), transform 5000ms ease-out, filter 800ms ease",
                }}
              />
            ))}

            {/* film vignette */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-black/35" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
              }}
            />

            {/* IRIS APERTURE BRACKETS — replaces dots, signature animation */}
            <div
              className="pointer-events-none absolute"
              style={{
                inset: `${iris}%`,
                transition: "inset 1.2s cubic-bezier(.4,0,.2,1)",
              }}
            >
              <ApertureBracket pos="tl" />
              <ApertureBracket pos="tr" />
              <ApertureBracket pos="bl" />
              <ApertureBracket pos="br" />
              {/* center crosshair only during scan */}
              {phase === 1 && (
                <>
                  <span
                    className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-[#e7c98a]/70"
                    style={{ animation: "pulse-glow 1.4s ease-in-out infinite" }}
                  />
                  <span
                    className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-[#e7c98a]/70"
                    style={{ animation: "pulse-glow 1.4s ease-in-out infinite" }}
                  />
                </>
              )}
            </div>

            {/* SOFT SPOTLIGHT SWEEP during scan — different from upper laser */}
            {phase === 1 && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(220px 320px at ${20 + progress * 60}% ${30 + Math.sin(progress * Math.PI * 2) * 8}%, rgba(231,201,138,0.18), transparent 70%)`,
                  transition: "background 80ms linear",
                  mixBlendMode: "screen",
                }}
              />
            )}

            {/* TOP HUD — phase status pill */}
            <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-md">
              {phase === 0 && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-[#e7c98a]" />
                  מעלה תמונה
                </>
              )}
              {phase === 1 && (
                <>
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#e7c98a]"
                    style={{ animation: "pulse-glow 1.2s ease-in-out infinite" }}
                  />
                  סורק · {pct}%
                </>
              )}
              {phase === 2 && (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  לוק מוכן · 4 פריטים
                </>
              )}
            </div>

            {/* BOTTOM — phase title + ultra-thin progress bar */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#e7c98a]/80">
                    שלב {PHASES[phase].n} מתוך 3
                  </div>
                  <div className="mt-1 text-xl font-medium text-white">
                    {PHASES[phase].title}
                  </div>
                  <div className="text-xs text-white/65">{PHASES[phase].sub}</div>
                </div>
                <div className="tabular-nums text-[11px] text-white/55">
                  {String(pct).padStart(2, "0")}%
                </div>
              </div>

              {/* segmented progress bar — 3 segments, fills sequentially */}
              <div className="mt-4 flex items-center gap-1.5">
                {PHASES.map((_, i) => {
                  const fill =
                    i < phase ? 1 : i === phase ? progress : 0;
                  return (
                    <div
                      key={i}
                      className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/10"
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          width: `${fill * 100}%`,
                          background:
                            "linear-gradient(90deg, #ffffff 0%, #fbf3e2 60%, #e7c98a 100%)",
                          boxShadow:
                            "0 0 12px rgba(231,201,138,0.5)",
                          transition: "width 120ms linear",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — phase-aware panel */}
          <div className="flex flex-col gap-5 border-t border-white/8 p-7 sm:p-10 lg:border-l lg:border-t-0">
            {/* phase content stage */}
            <div className="relative min-h-[300px]">
              {phase === 0 && <UploadStage progress={progress} />}
              {phase === 1 && <AnalyzeStage progress={progress} />}
              {phase === 2 && <ResultStage progress={progress} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── stages ───────── */

function UploadStage({ progress }: { progress: number }) {
  const pct = Math.round(Math.min(progress * 1.4, 1) * 100);
  return (
    <div className="space-y-5" style={{ animation: "fade-up 0.5s both" }}>
      <StageHeader
        kicker="שלב 1"
        title="העלאת תמונה"
        body="הקובץ נסרק לאימות, מוצפן ונשמר בענן מאובטח."
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06]">
            <Upload className="h-5 w-5 text-[#e7c98a]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">
              portrait_full.jpg
            </div>
            <div className="text-[11px] text-muted-foreground">
              2.4 MB · JPEG · 4032×3024
            </div>
          </div>
          <div className="tabular-nums text-xs text-white/70">{pct}%</div>
        </div>

        <div className="relative mt-4 h-[3px] overflow-hidden rounded-full bg-white/8">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, #ffffff, #fbf3e2 60%, #e7c98a)",
              transition: "width 120ms linear",
            }}
          />
          {/* shimmer */}
          <div
            className="absolute inset-y-0 w-1/3"
            style={{
              left: `${-30 + progress * 130}%`,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              filter: "blur(2px)",
            }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400/90">
          <Check className="h-3.5 w-3.5" />
          {pct >= 100 ? "הועלה בהצלחה · מאובטח end-to-end" : "מעלה בהצפנה…"}
        </div>
      </div>
    </div>
  );
}

function AnalyzeStage({ progress }: { progress: number }) {
  const rows = [
    { label: "מבנה גוף", value: "משולש הפוך", at: 0.15 },
    { label: "יחס כתפיים · מותן", value: "1.32", at: 0.35 },
    { label: "טון עור", value: "ניטרלי-חם", at: 0.55 },
    { label: "פלטת צבעים", value: "Earth · Charcoal", at: 0.75 },
    { label: "גזרה מומלצת", value: "Tailored Slim", at: 0.92 },
  ];
  return (
    <div className="space-y-5" style={{ animation: "fade-up 0.5s both" }}>
      <StageHeader
        kicker="שלב 2"
        title="ניתוח AI"
        body="זיהוי 33 נקודות גוף וניתוח אסתטי בזמן אמת."
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="space-y-3">
          {rows.map((r, i) => {
            const done = progress >= r.at;
            return (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 last:border-none last:pb-0"
                style={{
                  opacity: done ? 1 : 0.4,
                  transform: done ? "translateX(0)" : "translateX(8px)",
                  transition: `all 500ms cubic-bezier(.4,0,.2,1) ${i * 40}ms`,
                }}
              >
                <span className="text-[11px] uppercase tracking-wider text-white/55">
                  {r.label}
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-white">
                  {done ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#e7c98a]" />
                  )}
                  {done ? r.value : "מחשב…"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ResultStage({ progress }: { progress: number }) {
  return (
    <div className="space-y-5" style={{ animation: "fade-up 0.5s both" }}>
      <StageHeader
        kicker="שלב 3"
        title="הלוק שלך"
        body="ארבעה פריטים אמיתיים מחנויות בישראל · קישורי קנייה ישירים."
      />

      <div className="space-y-2.5">
        {ITEMS.map((it, i) => {
          const delay = i * 0.14;
          const local = Math.max(0, Math.min(1, (progress - delay) / 0.35));
          return (
            <div
              key={it.name}
              className="relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-3"
              style={{
                opacity: local,
                transform: `translateX(${(1 - local) * 24}px)`,
                transition: "opacity 380ms ease, transform 480ms cubic-bezier(.4,0,.2,1)",
              }}
            >
              {/* gold shimmer sweep */}
              <div
                className="pointer-events-none absolute inset-y-0 w-1/2"
                style={{
                  left: `${-60 + local * 160}%`,
                  background:
                    "linear-gradient(90deg, transparent, rgba(231,201,138,0.18), transparent)",
                  filter: "blur(6px)",
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-white">{it.name}</div>
                <div className="text-[10.5px] text-muted-foreground">
                  {it.store}
                </div>
              </div>
              <div className="text-sm font-medium tabular-nums text-white">
                {it.price}
              </div>
              <a
                href="#"
                aria-label="לקנייה"
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white/8 text-white transition hover:bg-white hover:text-black"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StageHeader({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-[#e7c98a]/85">
        {kicker}
      </div>
      <div className="mt-1 text-2xl font-medium text-white">{title}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
        {body}
      </div>
    </div>
  );
}

function ApertureBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-6 w-6";
  const map = {
    tl: "top-0 left-0 border-t border-l border-[#e7c98a]/70",
    tr: "top-0 right-0 border-t border-r border-[#e7c98a]/70",
    bl: "bottom-0 left-0 border-b border-l border-[#e7c98a]/70",
    br: "bottom-0 right-0 border-b border-r border-[#e7c98a]/70",
  };
  return <span className={`${base} ${map[pos]}`} />;
}

export function HeroCTA() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
      className="group relative inline-flex items-center gap-2 rounded-full border border-[#e7c98a]/40 bg-white/[0.06] px-7 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-[#e7c98a]/70 hover:bg-white/[0.1]"
      style={{
        boxShadow:
          "0 0 0 1px rgba(231,201,138,0.08), 0 0 30px -5px rgba(231,201,138,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      <span>להתחיל בחינם</span>
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
    </button>
  );
}

export function ExternalLinkIcon() {
  return <ExternalLink className="h-3.5 w-3.5" />;
}
