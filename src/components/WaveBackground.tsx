import { useEffect, useMemo, useRef } from "react";

const SPARKLES: { left: string; top: string; size: number; dur: number; delay: number }[] = Array.from({ length: 60 }).map((_, i) => {
  const seed = (n: number) => ((Math.sin(i * 9.13 + n) + 1) / 2);
  return {
    left: `${seed(1) * 100}%`,
    top: `${30 + seed(2) * 50}%`,
    size: 1 + seed(3) * 2.5,
    dur: 3 + seed(4) * 5,
    delay: seed(5) * 6,
  };
});

/**
 * Strat-style background:
 *  - Deep black canvas
 *  - Bright spotlight glow from top-center
 *  - Soft secondary glow top-left
 *  - A flowing 3D "dotted wave" surface that peaks on the right side
 *    and fades toward the left, viewed from a low camera angle
 *  - Faint crepuscular rays beneath the spotlight
 */
export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const computeSpacing = () => {
      const w = window.innerWidth;
      if (w < 480) return 10;
      if (w < 900) return 12;
      return 14;
    };
    let spacing = computeSpacing();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spacing = computeSpacing();
    };
    resize();
    window.addEventListener("resize", resize);
    const start = performance.now();

    // Low-angle camera projection
    const project = (x: number, y: number, z: number) => {
      const cx = width / 2;
      const cy = height * 0.58;
      const tilt = -1.18; // strong tilt, almost horizon view
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const yT = y * cosT - z * sinT;
      const zT = y * sinT + z * cosT;
      const focal = 1500;
      const denom = focal + zT + 600;
      const scale = focal / Math.max(denom, 60);
      return { sx: cx + x * scale, sy: cy + yT * scale, scale, zT };
    };

    const draw = (t: number) => {
      const time = (t - start) * 0.00018; // gentle drift
      ctx.clearRect(0, 0, width, height);

      const halfW = width * 1.8;
      const cols = Math.ceil((halfW * 2) / spacing);
      const rows = 160;
      const xStart = -halfW;
      const zStart = -spacing * 6;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = xStart + c * spacing;
          const z = zStart + r * spacing;

          // amplitude envelope: weak on the LEFT, strong on the RIGHT
          // (matches Strat: a flowing wave that crests on the right)
          const nx = x / (width * 0.9); // -1..+1 across viewport
          const env = Math.max(0, Math.min(1, (nx + 0.4) / 1.4));
          const envBoost = 0.25 + env * env * 1.4;

          const wave =
            (Math.sin(x * 0.0042 + z * 0.0026 + time * 1.2) * 22 +
              Math.cos(z * 0.0058 - time * 0.9) * 14 +
              Math.sin((x * 0.7 + z * 1.1) * 0.0024 + time * 0.7) * 10 +
              Math.cos((x - z * 0.5) * 0.0016 - time * 0.5) * 6) *
            envBoost;

          const p = project(x, wave, z);
          if (p.sy < -20 || p.sy > height + 20) continue;
          if (p.sx < -20 || p.sx > width + 20) continue;

          const s = p.scale;
          const size = Math.max(0.3, s * 0.85);

          // brightness: density envelope (right side) + crest highlight
          const crest = Math.max(0, (wave / 30) * 0.6 + 0.4);
          let alpha = Math.min(0.55, s * 0.55 * (0.25 + env) * crest);
          // fade leftmost dots almost completely
          if (env < 0.2) alpha *= env / 0.2;
          if (alpha < 0.015) continue;

          ctx.fillStyle = `rgba(232,236,244,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#050505" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Bright top-center spotlight (the signature Strat glow) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[85vh]"
        style={{
          background:
            "radial-gradient(ellipse 38% 60% at 50% -8%, rgba(255,255,255,0.32), rgba(255,255,255,0.10) 35%, transparent 70%)",
        }}
      />

      {/* Wider ambient halo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% -20%, rgba(255,255,255,0.10), transparent 65%)",
        }}
      />

      {/* Soft secondary glow top-left */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 45% at 22% 8%, rgba(255,255,255,0.07), transparent 60%)",
        }}
      />

      {/* Crepuscular rays falling from the spotlight */}
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <div className="relative h-[100vh] w-[100vw] max-w-[1600px]">
          <SoftRay left="42%" w="160px" o={0.05} skew={-4} />
          <SoftRay left="48%" w="200px" o={0.08} skew={-1.5} />
          <SoftRay left="50%" w="260px" o={0.11} skew={0} />
          <SoftRay left="52%" w="200px" o={0.08} skew={1.5} />
          <SoftRay left="58%" w="160px" o={0.05} skew={4} />
        </div>
      </div>

      {/* Luminous golden ribbon — sweeping arc behind subject */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Warm gold gradient, brighter toward center */}
            <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(180,140,70,0)" />
              <stop offset="12%" stopColor="rgba(198,156,86,0.45)" />
              <stop offset="32%" stopColor="rgba(231,201,138,0.85)" />
              <stop offset="50%" stopColor="rgba(255,240,205,1)" />
              <stop offset="68%" stopColor="rgba(231,201,138,0.85)" />
              <stop offset="88%" stopColor="rgba(198,156,86,0.45)" />
              <stop offset="100%" stopColor="rgba(180,140,70,0)" />
            </linearGradient>

            {/* Massive bloom for the outer halo */}
            <filter id="bloomHuge" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="38" />
            </filter>
            <filter id="bloomBig" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <filter id="bloomMed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="bloomCore" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          <g style={{ animation: "ribbon-breathe 14s ease-in-out infinite", transformOrigin: "center" }}>
            {/* Outer huge bloom */}
            <path
              d="M -80 760 Q 380 360 820 470 Q 1240 580 1700 320"
              stroke="url(#goldRibbon)"
              strokeWidth="120"
              strokeLinecap="round"
              fill="none"
              filter="url(#bloomHuge)"
              opacity="0.55"
            />
            {/* Mid halo */}
            <path
              d="M -60 740 Q 380 360 820 470 Q 1240 580 1690 330"
              stroke="url(#goldRibbon)"
              strokeWidth="60"
              strokeLinecap="round"
              fill="none"
              filter="url(#bloomBig)"
              opacity="0.85"
            />
            {/* Inner glow */}
            <path
              d="M -40 720 Q 380 360 820 470 Q 1240 580 1680 340"
              stroke="url(#goldRibbon)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              filter="url(#bloomMed)"
              opacity="0.95"
            />
            {/* Hot core line */}
            <path
              d="M -30 715 Q 380 360 820 470 Q 1240 580 1675 345"
              stroke="url(#goldRibbon)"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
              filter="url(#bloomCore)"
              opacity="1"
            />
          </g>
        </svg>

        {/* Center spotlight bloom that the ribbon passes through */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 32% 26% at 50% 52%, rgba(255,240,205,0.18), rgba(231,201,138,0.08) 40%, transparent 70%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Gold sparkle dust scattered along the arc */}
        <div className="absolute inset-0">
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background:
                  "radial-gradient(circle, rgba(255,245,215,1) 0%, rgba(231,201,138,0.55) 45%, transparent 75%)",
                boxShadow: "0 0 8px rgba(231,201,138,0.7)",
                animation: `sparkle-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      </div>


      <style>{`
        @keyframes arc-drift-l {
          0%, 100% { transform: translate(0, 0); opacity: 0.85; }
          50% { transform: translate(8px, -6px); opacity: 1; }
        }
        @keyframes arc-drift-r {
          0%, 100% { transform: translate(0, 0); opacity: 0.9; }
          50% { transform: translate(-10px, -8px); opacity: 1; }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Bottom vignette into deep black */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 55%, rgba(0,0,0,0.75) 92%, #000 100%)",
        }}
      />
      {/* Side vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 60%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}

function SoftRay({
  left,
  w,
  o,
  skew,
}: {
  left: string;
  w: string;
  o: number;
  skew: number;
}) {
  return (
    <div
      className="absolute top-0 h-full"
      style={{
        left,
        width: w,
        transform: `translate(-50%, 0) skewX(${skew}deg)`,
        background: `linear-gradient(to bottom, rgba(255,255,255,${o}) 0%, rgba(255,255,255,${o * 0.4}) 45%, transparent 85%)`,
        filter: "blur(48px)",
        willChange: "transform",
      }}
    />
  );
}
