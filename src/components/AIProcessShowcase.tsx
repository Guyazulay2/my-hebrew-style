import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Upload,
  Sparkles,
  ScanLine,
  Shirt,
  Store,
  ExternalLink,
} from "lucide-react";

const ITEMS = [
  { name: "בלייזר", store: "ZARA", price: "₪399" },
  { name: "חולצה", store: "COS", price: "₪129" },
  { name: "מכנס", store: "Zara", price: "₪199" },
  { name: "נעליים", store: "S.Madden", price: "₪389" },
];

export function AIProcessShowcase() {
  const [phase, setPhase] = useState(0); // 0..3
  const [scan, setScan] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % 4);
      setScan(0);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== 1) return;
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(94, n + 3);
      setScan(n);
      if (n >= 94) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <section id="how" className="relative mx-auto max-w-7xl px-4 py-24">
      <div className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          הצצה לתהליך
        </span>
        <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          איך זה עובד
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          שלוש פאזות. פחות מדקה. לוק שלם עם קישורי קנייה אמיתיים.
        </p>
      </div>

      <div className="glass-strong rounded-3xl p-4 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* PHASE 1 — UPLOAD */}
          <div className="glass rounded-2xl p-5">
            <PhaseHeader n={1} title="העלאת תמונה" active={phase >= 0} />
            <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[#f0d8a8]/30 to-[#b88a3f]/20">
                  <Upload className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-sm font-medium">גוף_שלם.jpg</div>
                  <div className="text-xs text-muted-foreground">
                    תמונת ייחוס · 1.2MB
                  </div>
                </div>
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#f0d8a8] to-[#b88a3f] transition-all duration-700"
                  style={{ width: phase >= 0 ? "100%" : "0%" }}
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                הועלה בהצלחה · מאובטח
              </div>
            </div>
          </div>

          {/* PHASE 2 — SCAN */}
          <div className="glass rounded-2xl p-5">
            <PhaseHeader n={2} title="סריקת AI" active={phase >= 1} />
            <div className="mt-5 space-y-3">
              <ScanRow
                icon={<ScanLine className="h-4 w-4" />}
                label="סורק 33 נקודות גוף"
                done={phase >= 1 && scan >= 94}
                value={phase >= 1 ? `${scan}%` : "ממתין"}
              />
              <div className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-emerald-300/90">
                <div className="text-muted-foreground"># body_analysis.log</div>
                <div>{phase >= 1 ? "› מבנה גוף: משולש הפוך" : "› ממתין…"}</div>
                <div>
                  {phase >= 1
                    ? "› יחס כתפיים-מותניים: 1.32"
                    : ""}
                </div>
                <div>
                  {phase >= 1 ? "› גזרה מומלצת: מחויטת" : ""}
                </div>
              </div>
              <ScanRow
                icon={<Store className="h-4 w-4" />}
                label="מאתר פריטים בחנויות"
                done={phase >= 2}
                value={phase >= 2 ? "נמצאו 24" : "סורק…"}
                loading={phase === 1}
              />
            </div>
          </div>

          {/* PHASE 3 — RESULT */}
          <div className="glass rounded-2xl p-5">
            <PhaseHeader n={3} title="התוצאה" active={phase >= 2} />
            <div
              className={`mt-5 transition-all duration-700 ${
                phase >= 2 ? "opacity-100" : "opacity-30"
              }`}
            >
              <div className="rounded-xl border border-white/10 bg-gradient-to-bl from-white/[0.06] to-transparent p-4">
                <div className="flex items-center gap-2 text-xs text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  לוק מוכן
                </div>
                <div className="mt-1 text-sm font-semibold leading-snug">
                  הלוק שלך לפגישת עבודה בתל אביב מוכן
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {ITEMS.map((it, i) => (
                  <div
                    key={it.name}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition hover:border-accent/40"
                    style={{ animation: phase >= 2 ? `fade-up 0.5s ${i * 0.1}s both` : undefined }}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                      <Shirt className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{it.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {it.store}
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {it.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhaseHeader({
  n,
  title,
  active,
}: {
  n: number;
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
            active
              ? "bg-gradient-to-br from-[#f0d8a8] to-[#b88a3f] text-black"
              : "bg-white/5 text-muted-foreground"
          }`}
        >
          {n}
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      {active && (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
          פעיל
        </span>
      )}
    </div>
  );
}

function ScanRow({
  icon,
  label,
  value,
  done,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  done?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 text-sm">{label}</div>
      <div
        className={`text-xs font-medium tabular-nums ${
          done ? "text-emerald-400" : "text-muted-foreground"
        }`}
      >
        {loading ? <span className="animate-pulse">סורק…</span> : done ? "הושלם · " + value : value}
      </div>
    </div>
  );
}

export function HeroCTA() {
  return (
    <a
      href="/app"
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-7 py-3.5 text-sm font-semibold text-black shadow-[0_8px_40px_-8px_rgba(240,200,140,0.6)] transition hover:shadow-[0_12px_50px_-8px_rgba(240,200,140,0.9)]"
    >
      <span>להתחיל בחינם</span>
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </a>
  );
}

export function ExternalLinkIcon() {
  return <ExternalLink className="h-3.5 w-3.5" />;
}
