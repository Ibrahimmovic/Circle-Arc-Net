"use client";

import { useEffect, useRef } from "react";

/** Subtle monochrome particle field — institutional, not playful. */
export function HomeHeroAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const nodes = Array.from({ length: 48 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0004 + (i % 5) * 0.00015,
    }));

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const t = frame * 0.016;
      for (const n of nodes) {
        const px = n.x * w + Math.sin(t * 0.4 + n.phase) * 6;
        const py = n.y * h + Math.cos(t * 0.35 + n.phase) * 4;
        const alpha = 0.08 + Math.sin(t + n.phase) * 0.04;
        ctx.beginPath();
        ctx.arc(px, py, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const ax = a.x * w;
          const ay = a.y * h;
          const bx = b.x * w;
          const by = b.y * h;
          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < 120) {
            ctx.globalAlpha = (1 - dist / 120) * 0.35;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="home-hero-atmosphere"
      aria-hidden
    />
  );
}
