import { useEffect, useState } from "react";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import menImg from "@/assets/showcase-men.jpg";
import womenImg from "@/assets/showcase-women.jpg";

type Gender = "men" | "women";

const DATA: Record<
  Gender,
  {
    img: string;
    body: string;
    ratio: string;
    fit: string;
    tip: string;
    items: { name: string; store: string; price: string }[];
  }
> = {
  men: {
    img: menImg,
    body: "מלבן מחויט",
    ratio: "1.18",
    fit: "Tailored Slim",
    tip: "שילוב גוונים כהים לפגישות עסקים יוצר נוכחות חזקה ומתוחכמת.",
    items: [
      { name: "בלייזר מחויט כהה", store: "ZARA", price: "₪549" },
      { name: "חולצה מכופתרת פרימיום", store: "COS", price: "₪199" },
      { name: "נעלי עור יוקרתיות", store: "חנות בוטיק", price: "₪620" },
    ],
  },
  women: {
    img: womenImg,
    body: "שעון חול",
    ratio: "1.32",
    fit: "Wide-Leg Elegant",
    tip: "הגזרה הרחבה של המכנס מאזנת את קו המותן ומעניקה מראה ארוך ואלגנטי.",
    items: [
      { name: "ג'קט מעצבים נקי", store: "ZARA", price: "₪499" },
      { name: "מכנס מחויט רחב", store: "Massimo Dutti", price: "₪329" },
      { name: "נעלי עקב יוקרתיות", store: "המשביר", price: "₪459" },
    ],
  },
};

export function StyleShowcase() {
  const [gender, setGender] = useState<Gender>("men");
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const seq = () => {
      setPhase(0);
      setTimeout(() => setPhase(1), 1400);
      setTimeout(() => setPhase(2), 4000);
    };
    seq();
    const loop = setInterval(seq, 8400);
    return () => clearInterval(loop);
  }, [gender]);

  const d = DATA[gender];

  return (
    <section id="showcase" className="relative mx-auto max-w-7xl px-4 py-28">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          הדגמת AI חיה
        </span>
        <h2 className="mt-5 text-4xl font-medium tracking-tight text-white sm:text-5xl">
          ראו את הסטייליסט בפעולה
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          העלאה · סריקת מבנה גוף · לוק שלם עם קישורי קנייה.
        </p>

        <div className="mx-auto mt-7 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md">
          {(["men", "women"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-full px-5 py-2 text-xs font-medium transition ${
                gender === g
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {g === "men" ? "סטיילינג לגבר" : "סטיילינג לאישה"}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial 2-column layout — image left, AI panel right */}
      <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-[1.05fr_1fr]">
        {/* MODEL IMAGE — luxury hero */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
          <img
            src={d.img}
            alt={gender === "men" ? "סטייל לגבר" : "סטייל לאישה"}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full max-h-[640px] w-full object-cover transition-opacity duration-700"
          />
          {/* soft gradient masks */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

          {/* AI scanning laser */}
          {phase >= 1 && phase < 2 && (
            <div
              className="pointer-events-none absolute inset-x-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(180,220,255,0.85), transparent)",
                boxShadow:
                  "0 0 22px rgba(180,220,255,0.7), 0 0 60px rgba(180,220,255,0.35)",
                animation: "scan-laser 2.4s ease-in-out infinite",
              }}
            />
          )}

          {/* (landmark dots removed for a cleaner look) */}


          {/* top badge */}
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] text-white/90 backdrop-blur-md">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                phase >= 1 ? "bg-emerald-400" : "bg-white/40"
              }`}
              style={{ animation: phase >= 1 ? "pulse-glow 1.6s ease-in-out infinite" : undefined }}
            />
            {phase === 0 && "מעלה תמונה…"}
            {phase === 1 && "סורק 33 נקודות גוף"}
            {phase >= 2 && "הניתוח הושלם"}
          </div>

          {/* bottom analysis chip */}
          <div
            className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 backdrop-blur-md transition-all duration-500"
            style={{
              opacity: phase >= 2 ? 1 : 0.55,
              transform: phase >= 2 ? "translateY(0)" : "translateY(6px)",
            }}
          >
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <Metric label="מבנה גוף" value={d.body} />
              <Metric label="יחס כתפיים-מותן" value={d.ratio} />
              <Metric label="גזרה מומלצת" value={d.fit} />
            </div>
          </div>
        </div>

        {/* AI PANEL — wardrobe + tip */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-[#e8d5a8]">
              <Sparkles className="h-3.5 w-3.5" />
              לוק מותאם אישית · {d.body}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              שלושה פריטים שנבחרו על-ידי ה-AI במיוחד עבור הגזרה שלך.
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {d.items.map((it, i) => (
              <div
                key={it.name}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3.5 transition hover:border-white/25 hover:bg-white/[0.05]"
                style={{
                  opacity: phase >= 2 ? 1 : 0.35,
                  transform: phase >= 2 ? "translateY(0)" : "translateY(6px)",
                  transition: `all 0.5s ${i * 0.12 + 0.1}s`,
                }}
              >
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02]">
                  <Check className="h-4 w-4 text-emerald-400/90" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div className="truncate text-sm font-medium text-white">
                    {it.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {it.store}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums text-white">
                  {it.price}
                </div>
                <a
                  href="#"
                  aria-label="לקנייה"
                  className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white/8 text-white transition group-hover:bg-white group-hover:text-black"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-[12.5px] leading-relaxed text-muted-foreground backdrop-blur-md">
            <span className="font-semibold text-white">טיפ סטיילינג · </span>
            {d.tip}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
        {label}
      </div>
      <div className="mt-0.5 text-[12px] font-medium text-white">{value}</div>
    </div>
  );
}
