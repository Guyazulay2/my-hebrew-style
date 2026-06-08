import { useEffect, useState } from "react";
import { Check, ExternalLink, Sparkles, Upload } from "lucide-react";

type Gender = "men" | "women";

const DATA: Record<
  Gender,
  {
    file: string;
    size: string;
    scanLines: string[];
    body: string;
    tip: string;
    items: { name: string; store: string; price: string }[];
    gradient: string;
  }
> = {
  men: {
    file: "גוף_שלם_גבר.jpg",
    size: "1.4MB",
    scanLines: [
      "מנתח מבנה גוף... הושלם (ביטחון 96%)",
      "מבנה גוף זוהה: מלבן מחויט",
      "התאמת פרופורציות כתפיים ✓",
    ],
    body: "מלבן מחויט",
    tip: "שילוב גוונים כהים לפגישות עסקים יוצר נוכחות חזקה ומתוחכמת.",
    items: [
      { name: "בלייזר מחויט כהה", store: "ZARA", price: "₪549" },
      { name: "חולצה מכופתרת פרימיום", store: "COS", price: "₪199" },
      { name: "נעלי עור יוקרתיות", store: "חנות בוטיק", price: "₪620" },
    ],
    gradient: "linear-gradient(135deg,#1a1f2e 0%,#3a2f25 50%,#1a1a22 100%)",
  },
  women: {
    file: "סטייל_אישה_תל_אביב.jpg",
    size: "1.1MB",
    scanLines: [
      "סורק 33 נקודות גוף... מנתח גווני עור וצבעים",
      "מבנה גוף זוהה: שעון חול",
      "התאמת גזרות מחמיאות ✓",
    ],
    body: "שעון חול",
    tip: "הגזרה הרחבה של המכנס מאזנת בצורה מושלמת את קו המותן ומעניקה מראה ארוך ואלגנטי.",
    items: [
      { name: "ג'קט מעצבים נקי", store: "ZARA", price: "₪499" },
      { name: "מכנס מחויט רחב", store: "Massimo Dutti", price: "₪329" },
      { name: "נעלי עקב יוקרתיות", store: "המשביר / בוטיק", price: "₪459" },
    ],
    gradient: "linear-gradient(135deg,#2a1f2a 0%,#3a2c3a 50%,#1a1520 100%)",
  },
};

export function StyleShowcase() {
  const [gender, setGender] = useState<Gender>("men");
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1600);
    const t2 = setTimeout(() => setPhase(2), 4400);
    const loop = setInterval(() => {
      setPhase(0);
      setTimeout(() => setPhase(1), 1600);
      setTimeout(() => setPhase(2), 4400);
    }, 8800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(loop);
    };
  }, [gender]);

  const d = DATA[gender];

  return (
    <section id="showcase" className="relative mx-auto max-w-7xl px-4 py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          הדגמת AI חיה
        </span>
        <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          ראו את הסטייליסט בפעולה
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          העלאה · סריקת מבנה גוף · לוק שלם עם קישורי קנייה.
        </p>

        {/* Gender toggle */}
        <div className="mx-auto mt-7 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
          {(["men", "women"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                gender === g
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {g === "men" ? "סטיילינג לגבר" : "סטיילינג לאישה"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-12 grid gap-5 rounded-3xl border border-white/10 p-5 lg:grid-cols-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,25,0.55), rgba(10,10,12,0.65))",
          backdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        {/* PHASE 1: UPLOAD */}
        <div
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <PhaseTag n="01" title="מעלים תמונה" active />
          <div
            className="relative mt-4 aspect-[4/5] overflow-hidden rounded-xl border border-white/10"
            style={{ background: d.gradient }}
          >
            <div
              className="absolute inset-0 opacity-90 transition-opacity duration-700"
              style={{
                background:
                  gender === "men"
                    ? "radial-gradient(ellipse at 50% 30%, rgba(180,160,140,0.25), transparent 60%), linear-gradient(180deg, #1c1d28 0%, #0e0e15 100%)"
                    : "radial-gradient(ellipse at 50% 30%, rgba(220,180,200,0.22), transparent 60%), linear-gradient(180deg, #221820 0%, #0f0e15 100%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-80">
              {gender === "men" ? "🕴️" : "👗"}
            </div>
            <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#f0d8a8]/30 to-[#b88a3f]/20">
                  <Upload className="h-3.5 w-3.5 text-[#f0d8a8]" />
                </div>
                <div className="flex-1 text-right text-[11px]">
                  <div className="truncate font-medium text-white">{d.file}</div>
                  <div className="text-muted-foreground">
                    מעלה תמונה · {d.size}…
                  </div>
                </div>
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full bg-gradient-to-l from-[#f0d8a8] to-[#b88a3f]" />
              </div>
            </div>
          </div>
        </div>

        {/* PHASE 2: SCAN */}
        <div
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <PhaseTag n="02" title="ה-AI סורק ומבין" active={phase >= 1} />
          <div
            className="relative mt-4 aspect-[4/5] overflow-hidden rounded-xl border border-white/10"
            style={{ background: d.gradient }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-60">
              {gender === "men" ? "🕴️" : "👗"}
            </div>
            {/* scan laser */}
            {phase >= 1 && (
              <div
                className="absolute inset-x-0 h-[3px]"
                style={{
                  background:
                    "linear-gradient(to bottom, transparent, rgba(120,220,255,0.9), transparent)",
                  boxShadow:
                    "0 0 24px rgba(120,220,255,0.85), 0 0 60px rgba(120,220,255,0.5)",
                  animation: "scan-laser 2.4s ease-in-out infinite",
                }}
              />
            )}
            {/* triangle body markers */}
            {phase >= 1 && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 125"
                style={{ animation: "fade-up 0.6s 0.4s both" }}
              >
                <polygon
                  points="35,25 65,25 50,55"
                  fill="none"
                  stroke="rgba(120,220,255,0.7)"
                  strokeWidth="0.6"
                  strokeDasharray="2 1.5"
                />
                {[
                  [35, 25],
                  [65, 25],
                  [50, 55],
                  [42, 70],
                  [58, 70],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="0.9" fill="#7fdcff" />
                ))}
              </svg>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/55 p-3 font-mono text-[10.5px] leading-relaxed">
            <div className="text-muted-foreground"># ai_scan.log</div>
            {d.scanLines.map((line, i) => (
              <div
                key={line}
                className="text-emerald-300/90"
                style={{
                  opacity: phase >= 1 ? 1 : 0,
                  transform: phase >= 1 ? "translateY(0)" : "translateY(4px)",
                  transition: `all 0.4s ${i * 0.4 + 0.2}s`,
                }}
              >
                › {line}
              </div>
            ))}
          </div>
        </div>

        {/* PHASE 3: RESULT */}
        <div
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <PhaseTag n="03" title="מקבלים לוק לקנייה" active={phase >= 2} />
          <div
            className={`mt-4 transition-all duration-700 ${
              phase >= 2 ? "opacity-100 translate-y-0" : "opacity-30 translate-y-2"
            }`}
          >
            <div
              className="rounded-xl border border-white/15 p-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(240,216,168,0.12), rgba(184,138,63,0.04))",
              }}
            >
              <div className="flex items-center gap-2 text-xs text-[#f0d8a8]">
                <Sparkles className="h-3.5 w-3.5" />
                לוק מוכן · מבנה גוף {d.body}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {d.items.map((it, i) => (
                <div
                  key={it.name}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-white/25 hover:bg-white/[0.06]"
                  style={{
                    animation: phase >= 2 ? `fade-up 0.5s ${i * 0.12}s both` : undefined,
                  }}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-white/15 to-white/[0.02] text-lg">
                    {i === 0 ? "🧥" : i === 1 ? "👔" : "👞"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">
                      {it.name}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {it.store}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-white">
                    {it.price}
                  </div>
                  <a
                    href="#"
                    aria-label="לקנייה"
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-black"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>

            <div
              className="mt-3 rounded-xl border border-white/10 p-3 text-[11.5px] leading-relaxed text-muted-foreground"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <span className="font-semibold text-white">טיפ סטיילינג · </span>
              {d.tip}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseTag({
  n,
  title,
  active,
}: {
  n: string;
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider transition ${
            active
              ? "bg-gradient-to-br from-[#f0d8a8] to-[#b88a3f] text-black"
              : "bg-white/5 text-muted-foreground"
          }`}
        >
          {n}
        </span>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      {active && (
        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
          חי
        </span>
      )}
    </div>
  );
}
