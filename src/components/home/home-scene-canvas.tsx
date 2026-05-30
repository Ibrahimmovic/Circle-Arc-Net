"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
};

function drawCoin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotY: number,
  label: string,
  face: [string, string],
  edge: string,
) {
  const depth = Math.cos(rotY);
  const thickness = radius * 0.22 * Math.abs(depth);
  const squash = 0.35 + Math.abs(depth) * 0.65;

  ctx.save();
  ctx.translate(cx, cy);

  if (depth < 0) {
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.ellipse(0, thickness * 0.4, radius, radius * squash * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const grad = ctx.createRadialGradient(-radius * 0.25, -radius * 0.35, 0, 0, 0, radius * 1.2);
  grad.addColorStop(0, face[0]);
  grad.addColorStop(0.55, face[1]);
  grad.addColorStop(1, "#0a0618");

  ctx.shadowColor = face[0];
  ctx.shadowBlur = 28 * Math.abs(depth);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.92, radius * squash * 0.92, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `800 ${radius * 0.38}px var(--font-outfit, system-ui)`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 1);

  if (depth >= 0) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = edge;
    ctx.beginPath();
    ctx.ellipse(0, thickness * 0.55, radius * 0.98, radius * squash * 0.88, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  yBase: number,
) {
  const x1 = w * 0.22;
  const x2 = w * 0.78;
  const midX = w * 0.5;
  const arcY = yBase - h * 0.12;

  const grad = ctx.createLinearGradient(x1, arcY, x2, arcY);
  grad.addColorStop(0, "rgba(99,102,241,0.05)");
  grad.addColorStop(0.5, "rgba(129,140,248,0.85)");
  grad.addColorStop(1, "rgba(6,182,212,0.05)");

  ctx.save();
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -t * 40;
  ctx.beginPath();
  ctx.moveTo(x1, yBase);
  ctx.quadraticCurveTo(midX, arcY, x2, yBase);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 5; i++) {
    const p = ((t * 0.35 + i * 0.18) % 1);
    const px = x1 + (x2 - x1) * p;
    const py = yBase + (arcY - yBase) * 4 * p * (1 - p);
    const g = ctx.createRadialGradient(px, py, 0, px, py, 10);
    g.addColorStop(0, "rgba(165,180,252,1)");
    g.addColorStop(1, "rgba(99,102,241,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const horizon = h * 0.72;
  ctx.save();
  ctx.strokeStyle = "rgba(99,102,241,0.08)";
  ctx.lineWidth = 1;

  for (let i = -20; i <= 20; i++) {
    const x = w / 2 + i * 42 + Math.sin(t * 0.2 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(w / 2 + i * 120, h + 20);
    ctx.stroke();
  }
  for (let j = 0; j < 14; j++) {
    const y = horizon + j * 22 + (t * 18) % 22;
    const spread = 1 + j * 0.12;
    ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.55 * spread, y);
    ctx.lineTo(w / 2 + w * 0.55 * spread, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  t: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.15);
  ctx.strokeStyle = "rgba(129,140,248,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(6,182,212,0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.72, r * 0.28, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function HomeSceneCanvas({ compact }: { compact?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const particles: Particle[] = Array.from({ length: compact ? 80 : 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0003,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.5 ? 240 : 190,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      t += 0.016;

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#000000");
      bg.addColorStop(0.45, "#05020f");
      bg.addColorStop(1, "#0a0520");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const orb1 = ctx.createRadialGradient(w * 0.15, h * 0.2, 0, w * 0.15, h * 0.2, w * 0.35);
      orb1.addColorStop(0, "rgba(99,102,241,0.22)");
      orb1.addColorStop(1, "transparent");
      ctx.fillStyle = orb1;
      ctx.fillRect(0, 0, w, h);

      const orb2 = ctx.createRadialGradient(w * 0.85, h * 0.35, 0, w * 0.85, h * 0.35, w * 0.3);
      orb2.addColorStop(0, "rgba(6,182,212,0.12)");
      orb2.addColorStop(1, "transparent");
      ctx.fillStyle = orb2;
      ctx.fillRect(0, 0, w, h);

      drawGrid(ctx, w, h, t);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const coinY = compact ? h * 0.42 : h * 0.48;
      const coinR = compact ? Math.min(w * 0.07, 38) : Math.min(w * 0.085, 52);
      const rot = t * 0.9;

      drawRing(ctx, w * 0.5, coinY, Math.min(w * 0.28, 180), t);
      drawBridge(ctx, w, h, t, coinY + coinR * 0.15);

      drawCoin(
        ctx,
        w * 0.28,
        coinY,
        coinR,
        rot,
        "USDC",
        ["#38bdf8", "#0284c7"],
        "#0c4a6e",
      );
      drawCoin(
        ctx,
        w * 0.72,
        coinY,
        coinR,
        rot + Math.PI * 0.65,
        "ETH",
        ["#c4b5fd", "#7c3aed"],
        "#4c1d95",
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [compact]);

  return (
    <canvas
      ref={ref}
      className="home-scene-canvas absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
