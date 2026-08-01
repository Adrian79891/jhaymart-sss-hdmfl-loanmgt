import React, { useEffect, useRef, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const LOGO_SRC = '/lovable-uploads/5759f407-e51d-4223-97b8-5049d0cfc448.png';
const DURATION = 3800;

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
}

/**
 * Realtime cinematic splash: the company logo rises out of a reflective
 * water surface with ripples, droplets, volumetric fog and a green bloom.
 * Rendered entirely with Canvas 2D — no video asset required.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    window.setTimeout(onFinish, 800);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const logo = new Image();
    logo.src = LOGO_SRC;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
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

    const droplets: Droplet[] = [];
    const ripples: { t: number; strength: number }[] = [{ t: 0, strength: 1 }];
    const start = performance.now();
    let raf = 0;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION);
      const rise = easeOut(Math.min(1, elapsed / 2600));
      const waterY = H * 0.62;

      // --- background: deep graphite with emerald volumetric light ---
      const bg = ctx.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.5, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#0b2a1d');
      bg.addColorStop(0.45, '#071a13');
      bg.addColorStop(1, '#030806');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // volumetric light shaft
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const shaft = ctx.createLinearGradient(W / 2, 0, W / 2, waterY);
      shaft.addColorStop(0, 'rgba(120, 230, 165, 0.16)');
      shaft.addColorStop(1, 'rgba(120, 230, 165, 0)');
      ctx.fillStyle = shaft;
      ctx.beginPath();
      ctx.moveTo(W / 2 - W * 0.10, 0);
      ctx.lineTo(W / 2 + W * 0.10, 0);
      ctx.lineTo(W / 2 + W * 0.30, waterY);
      ctx.lineTo(W / 2 - W * 0.30, waterY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- logo geometry ---
      const size = Math.min(W, H) * 0.30;
      const restY = waterY - size * 0.72;
      const logoY = waterY + size * 0.55 - (waterY + size * 0.55 - restY) * rise;
      const zoom = 1 + 0.06 * rise;
      const logoW = size * zoom;
      const logoH = logo.height ? (logo.height / logo.width) * logoW : logoW * 0.6;
      const logoX = W / 2 - logoW / 2;

      // bloom behind logo
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const bloom = ctx.createRadialGradient(W / 2, logoY + logoH / 2, 10, W / 2, logoY + logoH / 2, size * 1.5);
      bloom.addColorStop(0, `rgba(120, 235, 170, ${0.30 * rise})`);
      bloom.addColorStop(1, 'rgba(120, 235, 170, 0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      const drawLogo = () => {
        if (!logo.complete || !logo.naturalWidth) return;
        ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      };

      // --- water surface ---
      const waterGrad = ctx.createLinearGradient(0, waterY, 0, H);
      waterGrad.addColorStop(0, 'rgba(18, 62, 46, 0.95)');
      waterGrad.addColorStop(1, 'rgba(3, 12, 9, 1)');

      // reflection (mirrored, wavy, clipped below waterline)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, waterY, W, H - waterY);
      ctx.clip();
      ctx.globalAlpha = 0.28;
      if (logo.complete && logo.naturalWidth) {
        const slices = 44;
        const sliceH = logoH / slices;
        for (let i = 0; i < slices; i++) {
          const srcY = (i / slices) * logo.naturalHeight;
          const wob = Math.sin(elapsed / 320 + i * 0.55) * (2 + i * 0.22);
          const dy = waterY + (waterY - (logoY + logoH - i * sliceH));
          ctx.drawImage(
            logo,
            0,
            srcY,
            logo.naturalWidth,
            logo.naturalHeight / slices,
            logoX + wob,
            dy,
            logoW,
            sliceH + 1
          );
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = waterGrad;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, waterY, W, H - waterY);
      ctx.restore();

      // logo above the water
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, waterY + 1);
      ctx.clip();
      ctx.shadowColor = 'rgba(120, 235, 170, 0.55)';
      ctx.shadowBlur = 40;
      drawLogo();
      ctx.restore();

      // --- ripples on the surface ---
      if (elapsed < 2600 && Math.random() < 0.06) ripples.push({ t: 0, strength: 0.5 });
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.t += 0.008;
        if (r.t > 1) {
          ripples.splice(i, 1);
          continue;
        }
        const rx = size * (0.35 + r.t * 2.4);
        const ry = rx * 0.16;
        ctx.strokeStyle = `rgba(160, 245, 200, ${(1 - r.t) * 0.35 * r.strength})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(W / 2, waterY + 6, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // surface highlight line
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const line = ctx.createLinearGradient(0, waterY - 2, 0, waterY + 6);
      line.addColorStop(0, 'rgba(180, 255, 215, 0.35)');
      line.addColorStop(1, 'rgba(180, 255, 215, 0)');
      ctx.fillStyle = line;
      ctx.fillRect(0, waterY - 2, W, 8);
      ctx.restore();

      // --- droplets ---
      if (elapsed < 2400 && Math.random() < 0.5) {
        const spread = size * 0.55;
        droplets.push({
          x: W / 2 + (Math.random() - 0.5) * spread * 2,
          y: waterY,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -(1.8 + Math.random() * 3.4),
          r: 1 + Math.random() * 2.6,
          life: 1,
        });
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.09;
        if (d.y > waterY) {
          droplets.splice(i, 1);
          ripples.push({ t: 0, strength: 0.25 });
          continue;
        }
        ctx.fillStyle = `rgba(200, 255, 225, ${0.55 * d.life})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- soft fog ---
      ctx.save();
      const fog = ctx.createLinearGradient(0, waterY - size * 0.5, 0, waterY + size * 0.3);
      fog.addColorStop(0, 'rgba(140, 210, 175, 0)');
      fog.addColorStop(0.5, `rgba(140, 210, 175, ${0.10 + 0.04 * Math.sin(elapsed / 700)})`);
      fog.addColorStop(1, 'rgba(140, 210, 175, 0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, waterY - size * 0.5, W, size * 0.8);
      ctx.restore();

      // vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      if (t >= 1) finish();
    };

    raf = requestAnimationFrame(render);
    const safety = window.setTimeout(finish, DURATION + 2500);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#030806] transition-opacity duration-700 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-16 flex flex-col items-center gap-4">
        <p className="text-xs uppercase tracking-[0.5em] text-emerald-200/70 font-display">
          Jhaymarts Loan System
        </p>
        <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-[sweep_1.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
