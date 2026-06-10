import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Upload,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import uploadImg from "@/assets/process-upload.jpg";
import scanImg from "@/assets/process-scan.jpg";
import resultImg from "@/assets/process-result.jpg";

const PHASES = [
  { n: 1, title: "העלאת תמונה", sub: "תמונת ייחוס מאובטחת" },
  { n: 2, title: "סריקת AI", sub: "ניתוח 33 נקודות גוף" },
  { n: 3, title: "הלוק שלך", sub: "פריטים אמיתיים עם קישורי קנייה" },
];

const ITEMS = [
  { name: "בלייזר מחויט", store: "ZARA", price: "₪549" },
  { name: "חולצה לבנה פרימיום", store: "COS", price: "₪229" },
  { name: "מכנס מחויט", store: "Massimo Dutti", price: "₪389" },
  { name: "נעלי עור אוקספורד", store: "Boutique", price: "₪620" },
];

export function AIProcessShowcase() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % 3), 4200);
    return () => clearInterval(id);
  }, []);

  const images = [uploadImg, scanImg, resultImg];

  return (
    <section id="how" className="relative mx-auto max-w-6xl px-4 py-28">
      <div className="mb-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          הצצה לתהליך
        </span>
        <h2 className="mt-5 text-4xl font-medium tracking-tight text-white sm:text-5xl">
          איך זה עובד
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          שלוש פאזות. פחות מדקה. לוק שלם עם קישורי קנייה אמיתיים.
        </p>
      </div>

      {/* Cinematic stage */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          {/* LEFT — visual stage */}
          <div className="relative aspect-[4/5] overflow-hidden bg-black lg:aspect-auto lg:min-h-[560px]">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                width={768}
                height={1024}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out"
                style={{
                  opacity: phase === i ? 1 : 0,
                  filter: "grayscale(1) contrast(1.05)",
                  transform: phase === i ? "scale(1.02)" : "scale(1.08)",
                  transition: "opacity 1.2s ease, transform 6s ease-out",
                }}
              />
            ))}

            {/* atmospheric gradients */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/40" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

            {/* PHASE 1 — upload frame */}
            {phase === 0 && (
              <div
                className="pointer-events-none absolute inset-[14%] rounded-2xl border border-white/30"
                style={{ animation: "fade-up 0.6s both" }}
              >
                <div className="absolute -top-3 left-4 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
                  Uploading
                </div>
                <Corner pos="tl" />
                <Corner pos="tr" />
                <Corner pos="bl" />
                <Corner pos="br" />
              </div>
            )}

            {/* PHASE 2 — scan laser */}
            {phase === 1 && (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 h-[2px]"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(255,255,255,0.95), transparent)",
                    boxShadow:
                      "0 0 24px rgba(255,255,255,0.6), 0 0 80px rgba(255,255,255,0.25)",
                    animation: "scan-laser 2.6s ease-in-out infinite",
                  }}
                />
                <svg
                  viewBox="0 0 100 125"
                  preserveAspectRatio="xMidYMid slice"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  style={{ animation: "fade-up 0.7s 0.2s both" }}
                >
                  {[
                    [50, 12], [44, 22], [56, 22], [50, 36],
                    [42, 50], [58, 50], [50, 64], [46, 86], [54, 86],
                  ].map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="2.2" fill="rgba(255,255,255,0.12)" />
                      <circle cx={x} cy={y} r="0.7" fill="white" />
                    </g>
                  ))}
                </svg>
              </>
            )}

            {/* PHASE 3 — result chip */}
            {phase === 2 && (
              <div
                className="pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[11px] text-white backdrop-blur-md"
                style={{ animation: "fade-up 0.6s both" }}
              >
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                לוק מוכן · 4 פריטים
              </div>
            )}

            {/* Phase pill — bottom */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">
                  שלב {PHASES[phase].n} מתוך 3
                </div>
                <div className="mt-1 text-xl font-medium text-white">
                  {PHASES[phase].title}
                </div>
                <div className="text-xs text-white/65">{PHASES[phase].sub}</div>
              </div>

              {/* timeline dots */}
              <div className="flex items-center gap-1.5">
                {PHASES.map((_, i) => (
                  <span
                    key={i}
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: phase === i ? 28 : 10,
                      background:
                        phase === i ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — phase-aware panel */}
          <div className="flex flex-col gap-5 p-7 sm:p-10">
            <div className="flex flex-col gap-3">
              {PHASES.map((p, i) => (
                <button
                  key={p.n}
                  onClick={() => setPhase(i)}
                  className={`group flex items-center gap-4 rounded-2xl border p-4 text-right transition ${
                    phase === i
                      ? "border-white/25 bg-white/[0.05]"
                      : "border-white/8 bg-white/[0.015] hover:border-white/15"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-xs font-medium transition ${
                      phase === i
                        ? "bg-white text-black"
                        : "bg-white/[0.06] text-white/70"
                    }`}
                  >
                    {phase > i ? <Check className="h-4 w-4" /> : p.n}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">{p.sub}</div>
                  </div>
                  {phase === i && (
                    <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>

            {/* contextual content */}
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              {phase === 0 && (
                <div className="flex items-center gap-3" style={{ animation: "fade-up 0.5s both" }}>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06]">
                    <Upload className="h-5 w-5 text-white/80" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">portrait_full.jpg</div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full w-full origin-left scale-x-100 rounded-full bg-white" style={{ animation: "fade-up 1.4s both" }} />
                    </div>
                    <div className="mt-1.5 text-[11px] text-emerald-400">הועלה בהצלחה · מאובטח</div>
                  </div>
                </div>
              )}

              {phase === 1 && (
                <div className="space-y-3" style={{ animation: "fade-up 0.5s both" }}>
                  <Row label="מבנה גוף" value="משולש הפוך" />
                  <Row label="יחס כתפיים · מותן" value="1.32" />
                  <Row label="גזרה מומלצת" value="Tailored Slim" />
                </div>
              )}

              {phase === 2 && (
                <div className="space-y-2" style={{ animation: "fade-up 0.5s both" }}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-xs text-white/70">לוק עסקי · ערב</div>
                    <a href="#" className="inline-flex items-center gap-1 text-[11px] text-white/80 hover:text-white">
                      פתח לוק <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {ITEMS.map((it, i) => (
                    <div
                      key={it.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5"
                      style={{ animation: `fade-up 0.5s ${i * 0.08}s both` }}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white">{it.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">{it.store}</div>
                      </div>
                      <div className="text-sm font-medium tabular-nums text-white">
                        {it.price}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-none last:pb-0">
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute h-5 w-5 border-white/80";
  const map = {
    tl: "top-0 left-0 border-t-2 border-l-2 -translate-x-px -translate-y-px",
    tr: "top-0 right-0 border-t-2 border-r-2 translate-x-px -translate-y-px",
    bl: "bottom-0 left-0 border-b-2 border-l-2 -translate-x-px translate-y-px",
    br: "bottom-0 right-0 border-b-2 border-r-2 translate-x-px translate-y-px",
  };
  return <span className={`${base} ${map[pos]}`} />;
}

export function HeroCTA() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
      className="group relative inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-7 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/[0.1]"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.05), 0 0 30px -5px rgba(255,255,255,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
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
