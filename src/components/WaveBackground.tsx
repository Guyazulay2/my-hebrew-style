import { useEffect, useRef } from "react";

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

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const spacing = 44;
    const start = performance.now();

    // perspective projection — flat ground plane tilted away
    const project = (x: number, y: number, z: number) => {
      const cx = width / 2;
      const cy = height * 0.66;
      const tilt = -1.08;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const yT = y * cosT - z * sinT;
      const zT = y * sinT + z * cosT;
      const focal = 1200;
      const denom = focal + zT + 400;
      const scale = focal / Math.max(denom, 50);
      return { sx: cx + x * scale, sy: cy + yT * scale, scale };
    };

    const draw = (t: number) => {
      const time = (t - start) * 0.00006; // ultra slow, hypnotic
      ctx.clearRect(0, 0, width, height);

      const halfW = width * 1.5;
      const cols = Math.ceil((halfW * 2) / spacing);
      const rows = 80;
      const xStart = -halfW;
      const zStart = -spacing * 6;

      const points: { sx: number; sy: number; scale: number }[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = xStart + c * spacing;
          const z = zStart + r * spacing;
          // gentle wide horizontal dunes
          const wave =
            Math.sin(x * 0.0045 + time * 0.9) * 9 +
            Math.cos(z * 0.006 - time * 1.1) * 10 +
            Math.sin((x + z) * 0.0035 + time * 0.7) * 6;
          points.push(project(x, wave, z));
        }
      }

      // subtle white connecting lines
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const p = points[i];
          if (p.sy < -50 || p.sy > height + 50) continue;
          if (c < cols - 1) {
            const p2 = points[i + 1];
            const a = Math.min(p.scale, p2.scale);
            ctx.strokeStyle = `rgba(255,255,255,${a * 0.045})`;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
          if (r < rows - 1) {
            const p2 = points[i + cols];
            const a = Math.min(p.scale, p2.scale);
            ctx.strokeStyle = `rgba(255,255,255,${a * 0.045})`;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }
      }

      // clean white dots
      for (const p of points) {
        if (p.sy < -20 || p.sy > height + 20) continue;
        const size = Math.max(0.3, p.scale * 1.3);
        const alpha = Math.min(0.55, p.scale * 0.65);
        ctx.fillStyle = `rgba(240,240,245,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // generate dust particles
  const dust = Array.from({ length: 22 }).map((_, i) => ({
    left: 30 + Math.random() * 40,
    delay: Math.random() * 12,
    duration: 14 + Math.random() * 12,
    size: 1 + Math.random() * 2.5,
    opacity: 0.3 + Math.random() * 0.5,
    key: i,
  }));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "#000" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Top-center spotlight glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]"
        style={{
          background:
            "radial-gradient(ellipse 55% 65% at 50% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 35%, transparent 70%)",
        }}
      />

      {/* Volumetric god rays — soft vertical light beams */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div
          className="relative h-[95vh] w-[70vw]"
          style={{ transform: "translateY(-5%)" }}
        >
          <Ray left="35%" w="2px" o={0.18} skew={-3} />
          <Ray left="42%" w="3px" o={0.12} skew={-1.5} />
          <Ray left="50%" w="2px" o={0.22} skew={0} />
          <Ray left="58%" w="3px" o={0.14} skew={1.5} />
          <Ray left="65%" w="2px" o={0.18} skew={3} />
          {/* broad volumetric cone */}
          <div
            className="absolute left-1/2 top-0 h-full -translate-x-1/2"
            style={{
              width: "65%",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 55%, transparent 90%)",
              filter: "blur(40px)",
              clipPath: "polygon(40% 0, 60% 0, 95% 100%, 5% 100%)",
            }}
          />
        </div>
      </div>

      {/* Floating dust particles */}
      <div className="pointer-events-none absolute inset-0">
        {dust.map((d) => (
          <span
            key={d.key}
            className="absolute rounded-full bg-white"
            style={{
              left: `${d.left}%`,
              top: "-5%",
              width: `${d.size}px`,
              height: `${d.size}px`,
              opacity: d.opacity,
              filter: "blur(0.5px)",
              animation: `dust-fall ${d.duration}s linear ${d.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Bottom fade to deep black */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.85) 95%, #000 100%)",
        }}
      />
    </div>
  );
}

function Ray({
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
        transform: `skewX(${skew}deg)`,
        background: `linear-gradient(to bottom, rgba(255,255,255,${o}) 0%, rgba(255,255,255,${o * 0.4}) 40%, transparent 85%)`,
        filter: "blur(2px)",
      }}
    />
  );
}
