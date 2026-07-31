import React, { useEffect, useRef } from 'react';

export interface PlasmaProps {
  color?: string;
  speed?: number;
  direction?: 'forward' | 'reverse' | 'pingpong';
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  renderScale?: number;
  maxDpr?: number;
  targetFps?: number;
  iterations?: number;
}

const VERT = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uScale;
uniform float uOpacity;
uniform vec3 uColor;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform int uIterations;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  uv *= 3.0 / max(uScale, 0.0001);

  vec2 p = uv;
  float t = uTime;

  // Mouse warp
  vec2 m = (uMouse - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y) * 3.0;
  p += (p - m) * 0.08 * uMouseActive / (0.2 + dot(p - m, p - m));

  float v = 0.0;
  vec2 q = p;
  for (int i = 0; i < 64; i++) {
    if (i >= uIterations) break;
    float fi = float(i);
    q += vec2(
      sin(q.y * 1.3 + t * 0.35 + fi * 0.07),
      cos(q.x * 1.1 - t * 0.28 + fi * 0.05)
    ) * (0.09 / (1.0 + fi * 0.12));
    v += sin(q.x * 1.7 + t * 0.4) * cos(q.y * 1.9 - t * 0.33) / (1.0 + fi * 0.55);
  }

  float glow = 0.5 + 0.5 * sin(v * 3.1416 + t * 0.2);
  float depth = smoothstep(0.0, 1.0, glow);

  vec3 base = uColor * (0.25 + 0.95 * depth);
  vec3 shade = mix(uColor * 0.12, base, depth);
  // soft highlight veins
  shade += uColor * pow(depth, 6.0) * 0.55;

  float vignette = smoothstep(2.6, 0.2, length(uv * 0.8));

  gl_FragColor = vec4(shade * vignette, uOpacity);
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
};

const Plasma: React.FC<PlasmaProps> = ({
  color = '#97cfa1',
  speed = 1.1,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = false,
  renderScale = 0.55,
  maxDpr = 1.5,
  targetFps = 60,
  iterations = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uScale = gl.getUniformLocation(program, 'uScale');
    const uOpacity = gl.getUniformLocation(program, 'uOpacity');
    const uColor = gl.getUniformLocation(program, 'uColor');
    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uMouseActive = gl.getUniformLocation(program, 'uMouseActive');
    const uIterations = gl.getUniformLocation(program, 'uIterations');

    const rgb = hexToRgb(color);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(1, Math.floor(window.innerWidth * dpr * renderScale));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr * renderScale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      mouseRef.current = {
        x: e.clientX * dpr * renderScale,
        y: (window.innerHeight - e.clientY) * dpr * renderScale,
        active: 1,
      };
    };
    if (mouseInteractive) window.addEventListener('mousemove', onMove, { passive: true });

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const frameInterval = 1000 / Math.max(1, targetFps);
    let acc = 0;

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const delta = now - last;
      last = now;
      acc += delta;
      if (acc < frameInterval) return;
      acc = 0;

      const dirMul =
        direction === 'reverse' ? -1 : direction === 'pingpong' ? Math.sin(elapsed * 0.0003) : 1;
      elapsed += delta;

      resize();
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, (elapsed / 1000) * speed * dirMul);
      gl.uniform1f(uScale, scale);
      gl.uniform1f(uOpacity, opacity);
      gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2]);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(uMouseActive, mouseInteractive ? mouseRef.current.active : 0);
      gl.uniform1i(uIterations, Math.min(64, Math.max(1, Math.round(iterations))));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive, renderScale, maxDpr, targetFps, iterations]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-full w-full pointer-events-none"
    />
  );
};

export default Plasma;
