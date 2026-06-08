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

    // Wide, flat horizontal terrain (dunes) — sits in lower/middle screen
    const spacing = 42;
    const start = performance.now();

    // perspective projection — flat ground plane tilted away from camera
    const project = (x: number, y: number, z: number) => {
      const cx = width / 2;
      const cy = height * 0.62; // horizon sits a bit below middle
      // strong forward tilt so plane looks flat / horizontal
      const tilt = -1.05;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const yT = y * cosT - z * sinT;
      const zT = y * sinT + z * cosT;
      const focal = 1100;
      const denom = focal + zT + 400;
      const scale = focal / Math.max(denom, 50);
      return {
        sx: cx + x * scale,
        sy: cy + yT * scale,
        scale,
        depth: zT,
      };
    };

    const draw = (t: number) => {
      const time = (t - start) * 0.00012; // ultra slow
      ctx.clearRect(0, 0, width, height);

      // soft ambient top-center spot glow
      const grad = ctx.createRadialGradient(
        width / 2,
        -height * 0.05,
        20,
        width / 2,
        -height * 0.05,
        height * 0.85
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.10)");
      grad.addColorStop(0.35, "rgba(255, 255, 255, 0.03)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // grid covers a wide, deep flat area
      const halfW = width * 1.4;
      const cols = Math.ceil((halfW * 2) / spacing);
      const rows = 70; // deep
      const xStart = -halfW;
      const zStart = -spacing * 6;

      const points: { sx: number; sy: number; scale: number }[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = xStart + c * spacing;
          const z = zStart + r * spacing;
          // gentle overlapping low-amplitude waves (sand dunes)
          const wave =
            Math.sin(x * 0.0055 + time * 0.9) * 8 +
            Math.cos(z * 0.007 - time * 1.1) * 9 +
            Math.sin((x + z) * 0.004 + time * 0.7) * 6;
          points.push(project(x, wave, z));
        }
      }

      // connecting lines — very subtle white
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const p = points[i];
          if (p.sy < -50 || p.sy > height + 50) continue;
          if (c < cols - 1) {
            const p2 = points[i + 1];
            const a = Math.min(p.scale, p2.scale);
            ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.05})`;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
          if (r < rows - 1) {
            const p2 = points[i + cols];
            const a = Math.min(p.scale, p2.scale);
            ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.05})`;
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.stroke();
          }
        }
      }

      // dots — subtle white/light-gray
      for (const p of points) {
        if (p.sy < -20 || p.sy > height + 20) continue;
        const size = Math.max(0.3, p.scale * 1.4);
        const alpha = Math.min(0.6, p.scale * 0.7);
        ctx.fillStyle = `rgba(235, 235, 240, ${alpha})`;
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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(255,255,255,0.07), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 40%, var(--background) 100%)",
        }}
      />
    </div>
  );
}

