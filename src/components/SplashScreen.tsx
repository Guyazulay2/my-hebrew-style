import { useEffect, useState } from "react";

export function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    // in → hold
    const t1 = setTimeout(() => setPhase("hold"), 600);
    // hold → out
    const t2 = setTimeout(() => setPhase("out"), 2000);
    // out → done (unmount)
    const t3 = setTimeout(() => setPhase("done"), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[oklch(0.10_0.005_270)]"
      style={{
        transition: "opacity 0.65s cubic-bezier(0.4,0,0.2,1)",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Ambient glow behind logo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(240,200,140,0.12) 0%, transparent 70%)",
          transition: "opacity 0.6s",
          opacity: phase === "hold" ? 1 : 0,
        }}
      />

      {/* Outer ring — slow spin */}
      <div
        className="absolute h-40 w-40 rounded-full border border-[#f0d8a8]/10"
        style={{
          animation: "splash-ring-spin 8s linear infinite",
          transform: "rotate(0deg)",
        }}
      />
      <div
        className="absolute h-56 w-56 rounded-full border border-[#f0d8a8]/[0.06]"
        style={{ animation: "splash-ring-spin 14s linear infinite reverse" }}
      />

      {/* Logo mark */}
      <div
        style={{
          transition: "opacity 0.5s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "scale(0.7)" : "scale(1)",
        }}
        className="relative flex flex-col items-center gap-5"
      >
        {/* "M" badge */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-2xl blur-2xl"
            style={{
              background: "linear-gradient(135deg,#f0d8a8,#b88a3f)",
              opacity: 0.5,
              transition: "opacity 0.6s",
            }}
          />
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-black"
            style={{
              background: "linear-gradient(135deg,#f0d8a8,#e8c089,#b88a3f)",
              boxShadow: "0 0 40px rgba(240,200,140,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            M
          </div>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-2xl font-bold tracking-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            My Stylist
          </span>
          <span className="text-xs tracking-widest text-[#f0d8a8]/60 uppercase">
            AI Fashion · Israel
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-[1px] w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f0d8a8] to-[#b88a3f]"
            style={{
              transition: "width 1.3s cubic-bezier(0.4,0,0.2,1)",
              width: phase === "hold" ? "100%" : "0%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splash-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
