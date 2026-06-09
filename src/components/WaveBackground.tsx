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
      spacing = computeSpacing();
    };


    // density scales with viewport so the dune looks identical on mobile + desktop
    const computeSpacing = () => {
      const w = window.innerWidth;
      if (w < 480) return 14;
      if (w < 900) return 18;
      return 22;
    };
    let spacing = computeSpacing();
    resize();
    window.addEventListener("resize", resize);
    const start = performance.now();


    // flat ground plane, tilted away from camera
    const project = (x: number, y: number, z: number) => {
      const cx = width / 2;
      const cy = height * 0.62;
      const tilt = -1.12;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const yT = y * cosT - z * sinT;
      const zT = y * sinT + z * cosT;
      const focal = 1400;
      const denom = focal + zT + 500;
      const scale = focal / Math.max(denom, 60);
      return { sx: cx + x * scale, sy: cy + yT * scale, scale };
    };


    const draw = (t: number) => {
      // ultra-slow, barely moving
      const time = (t - start) * 0.00002;
      ctx.clearRect(0, 0, width, height);

      const halfW = width * 1.6;
      const cols = Math.ceil((halfW * 2) / spacing);
      const rows = 140;
      const xStart = -halfW;
      const zStart = -spacing * 4;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = xStart + c * spacing;
          const z = zStart + r * spacing;
          // smooth wide horizontal dunes (multi-octave)
          const wave =
            Math.sin(x * 0.0032 + time * 0.8) * 14 +
            Math.cos(z * 0.0048 - time * 0.6) * 11 +
            Math.sin((x * 0.6 + z) * 0.0022 + time * 0.5) * 8 +
            Math.cos((x - z * 0.4) * 0.0018 - time * 0.4) * 6;

          const p = project(x, wave, z);
          if (p.sy < -10 || p.sy > height + 10) continue;
          if (p.sx < -10 || p.sx > width + 10) continue;

          const s = p.scale;
          const size = Math.max(0.35, s * 0.95);
          // very faded, soft white
          const alpha = Math.min(0.32, s * 0.42);
          ctx.fillStyle = `rgba(230,232,238,${alpha})`;
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

  const dust = Array.from({ length: 18 }).map((_, i) => ({
    left: 25 + Math.random() * 50,
    delay: Math.random() * 14,
    duration: 18 + Math.random() * 14,
    size: 1 + Math.random() * 2,
    opacity: 0.2 + Math.random() * 0.35,
    key: i,
  }));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "#000" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Broad ambient atmospheric glow — top-center, slightly biased left */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[90vh]"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 48% -15%, rgba(255,255,255,0.14), rgba(255,255,255,0.04) 40%, transparent 75%)",
        }}
      />

      {/* Soft secondary glow top-left */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 30% -5%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      {/* Smoky, diffused crepuscular rays — soft, static, no flicker */}
      <div className="pointer-events-none absolute inset-0 flex justify-center overflow-hidden">
        <div className="relative h-[100vh] w-[100vw] max-w-[1400px]">
          <SoftRay left="34%" w="180px" o={0.04} skew={-3} />
          <SoftRay left="44%" w="140px" o={0.055} skew={-1.2} />
          <SoftRay left="50%" w="220px" o={0.07} skew={0} />
          <SoftRay left="56%" w="140px" o={0.05} skew={1.2} />
          <SoftRay left="64%" w="180px" o={0.04} skew={3} />
        </div>
      </div>


      {/* Floating dust */}
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
              filter: "blur(0.6px)",
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
            "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 92%, #000 100%)",
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
        transform: `skewX(${skew}deg)`,
        background: `linear-gradient(to bottom, rgba(255,255,255,${o}) 0%, rgba(255,255,255,${o * 0.5}) 35%, transparent 80%)`,
        filter: "blur(28px)",
        mixBlendMode: "screen",
      }}
    />
  );
}
