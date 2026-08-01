import React, { useEffect, useRef } from 'react';

interface ParticlesProps {
  count?: number;
  color?: string;
  opacity?: number;
}

/**
 * Lightweight ambient particle field + soft energy waves rendered on Canvas 2D.
 * Sits above the Plasma shader background and below the app content.
 */
const Particles: React.FC<ParticlesProps> = ({ count = 55, color = '151, 207, 161', opacity = 0.55 }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0;
    let H = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const parts = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.6 + Math.random() * 2.1,
      vy: -(0.06 + Math.random() * 0.28),
      vx: (Math.random() - 0.5) * 0.12,
      a: 0.15 + Math.random() * 0.5,
      p: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const interval = 1000 / 40;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      acc += dt;
      if (acc < interval) return;
      acc = 0;

      ctx.clearRect(0, 0, W, H);

      // soft green energy waves
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const y = H * (0.3 + i * 0.22) + Math.sin(now / (2600 + i * 800)) * 30;
        const g = ctx.createLinearGradient(0, y - 90, 0, y + 90);
        g.addColorStop(0, `rgba(${color}, 0)`);
        g.addColorStop(0.5, `rgba(${color}, ${0.045 * opacity})`);
        g.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, y - 90, W, 180);
      }

      for (const p of parts) {
        if (!reduce) {
          p.y += p.vy;
          p.x += p.vx + Math.sin(now / 2400 + p.p) * 0.12;
          if (p.y < -10) {
            p.y = H + 10;
            p.x = Math.random() * W;
          }
          if (p.x < -10) p.x = W + 10;
          if (p.x > W + 10) p.x = -10;
        }
        const twinkle = 0.6 + 0.4 * Math.sin(now / 900 + p.p);
        ctx.fillStyle = `rgba(${color}, ${p.a * twinkle * opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, color, opacity]);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none" />;
};

export default Particles;
