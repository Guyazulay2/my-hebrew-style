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

    // 3D grid of dots projected to 2D
    const cols = 60;
    const rows = 38;
    const spacing = 38;
    const start = performance.now();

    // perspective projection helpers
    const project = (x: number, y: number, z: number) => {
      const cx = width / 2;
      const cy = height / 2 + height * 0.12;
      // tilt around X axis (looking slightly down)
      const tilt = -0.55;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const yT = y * cosT - z * sinT;
      const zT = y * sinT + z * cosT;
      const focal = 900;
      const scale = focal / (focal + zT + 600);
      return {
        sx: cx + x * scale,
        sy: cy + yT * scale,
        scale,
        depth: zT,
      };
    };

    const draw = (t: number) => {
      const time = (t - start) * 0.00018; // ultra slow
      // clear with subtle trail for softness
      ctx.clearRect(0, 0, width, height);

      // ambient top glow
      const grad = ctx.createRadialGradient(
        width / 2,
        -height * 0.1,
        50,
        width / 2,
        -height * 0.1,
        height * 0.9
      );
      grad.addColorStop(0, "rgba(245, 200, 120, 0.18)");
      grad.addColorStop(0.4, "rgba(245, 200, 120, 0.05)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const halfC = (cols - 1) / 2;
      const halfR = (rows - 1) / 2;

      const points: { sx: number; sy: number; scale: number; depth: number }[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c - halfC) * spacing;
          const z = (r - halfR) * spacing;
          // overlapping sine waves — gentle ocean
          const d = Math.sqrt(x * x + z * z) * 0.006;
          const wave =
            Math.sin(d * 2.0 + time * 1.2) * 18 +
            Math.sin(x * 0.012 + time * 0.9) * 10 +
            Math.cos(z * 0.014 - time * 1.1) * 10;
          const p = project(x, wave, z);
          points.push(p);
        }
      }

      // draw connecting lines (subtle)
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const p = points[i];
          if (c < cols - 1) {
            const p2 = points[i + 1];
            const a = Math.min(p.scale, p2.scale);
            ctx.strokeStyle = `rgba(220, 200, 170, ${a * 0.08})`;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
          if (r < rows - 1) {
            const p2 = points[i + cols];
            const a = Math.min(p.scale, p2.scale);
            ctx.strokeStyle = `rgba(220, 200, 170, ${a * 0.08})`;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }
      }

      // draw dots
      for (const p of points) {
        const size = Math.max(0.4, p.scale * 1.8);
        const alpha = Math.min(1, p.scale * 1.1);
        ctx.fillStyle = `rgba(240, 220, 180, ${alpha * 0.85})`;
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

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 ambient-light" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, var(--background) 95%)",
        }}
      />
    </div>
  );
}
