import { useCallback, useRef } from 'react';

/**
 * Subtle mouse parallax / tilt for glass cards.
 * Sets --mx/--my for the hover light and applies a 3D tilt transform.
 */
export function useParallaxTilt(max = 6) {
  const raf = useRef<number | null>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max}deg) rotateY(${
          (px - 0.5) * max
        }deg) translateY(-8px) scale(1.015)`;
      });
    },
    [max]
  );

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    e.currentTarget.style.transform = '';
  }, []);

  return { onMouseMove, onMouseLeave };
}
