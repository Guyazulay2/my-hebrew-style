import { useEffect, useRef } from "react";

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
