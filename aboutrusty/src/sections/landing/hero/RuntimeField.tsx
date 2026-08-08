import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface RuntimeFieldHandle {
  /** Drive the field toward a reel phase. Float values interpolate between states. */
  setPhase: (phase: number) => void;
}

interface RuntimeFieldProps {
  reduceMotion?: boolean;
  className?: string;
}

type RGB = [number, number, number];

interface FieldNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  seed: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smoothstep = (min: number, max: number, value: number) => {
  const t = clamp((value - min) / Math.max(0.0001, max - min));
  return t * t * (3 - 2 * t);
};
const fract = (value: number) => value - Math.floor(value);
const noise = (value: number) => fract(Math.sin(value * 12.9898 + 78.233) * 43758.5453);

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** Read an ink-theme HSL token (e.g. "--primary" -> "16 100% 60%") as RGB for canvas. */
function readTokenRgb(name: string, fallback: RGB): RGB {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const match = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!match) return fallback;
  return hslToRgb(Number(match[1]), Number(match[2]) / 100, Number(match[3]) / 100);
}

const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/**
 * Canvas particle field behind the runtime reel — a React port of the reference's
 * runtimeField: nodes drift toward per-phase arrangements, link with faint edges,
 * and are disturbed by the pointer. Palette is derived from the ink-theme tokens
 * (rust / rust-soft / signal green / paper — no blue, no purple).
 */
export const RuntimeField = forwardRef<RuntimeFieldHandle, RuntimeFieldProps>(
  function RuntimeField({ reduceMotion = false, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const phaseRef = useRef(0);
    const flashRef = useRef(0);
    const lastNearestRef = useRef(0);
    const drawStaticRef = useRef<() => void>(() => {});

    useImperativeHandle(
      ref,
      () => ({
        setPhase: (phase: number) => {
          phaseRef.current = clamp(phase, 0, 5);
          const nearest = Math.round(phaseRef.current);
          if (nearest === 5 && lastNearestRef.current !== 5) flashRef.current = 1;
          lastNearestRef.current = nearest;
          if (reduceMotion) drawStaticRef.current();
        },
      }),
      [reduceMotion],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Explicitly-typed aliases: hoisted function declarations below reset
      // control-flow narrowing, so capture non-null types up front.
      const cv: HTMLCanvasElement = canvas;
      const cx: CanvasRenderingContext2D = ctx;

      // Palette from semantic tokens: rust, rust-soft, signal green, paper.
      const primary = readTokenRgb("--primary", [255, 107, 53]);
      const rustSoft = readTokenRgb("--accent-foreground", [255, 154, 115]);
      const success = readTokenRgb("--success", [146, 231, 192]);
      const paper = readTokenRgb("--foreground", [237, 240, 236]);
      const colors: RGB[] = [
        primary,
        rustSoft,
        mixRgb(success, paper, 0.35),
        success,
        rustSoft,
        paper,
      ];

      let width = 1;
      let height = 1;
      let raf = 0;
      let nodes: FieldNode[] = [];
      const pointer = { x: -1000, y: -1000, active: false };

      const small = () => width < 700;
      const nodeCount = () => (small() ? 56 : 84);

      function targetForState(index: number, phase: number) {
        const count = nodes.length || nodeCount();
        const centerX = width * (small() ? 0.62 : 0.66);
        const centerY = height * (small() ? 0.34 : 0.43);
        const spread = Math.min(width, height);
        const angle = index * 2.399963;
        const randomA = noise(index + 1);
        const randomB = noise(index + 91);
        const t = index / Math.max(1, count - 1);

        if (phase === 0) {
          const radius = Math.sqrt(randomA) * spread * (small() ? 0.31 : 0.36);
          return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius * 0.88 };
        }
        if (phase === 1) {
          const group = index % 5;
          const groupAngle = -1.55 + group * 0.78;
          const groupRadius = spread * 0.2;
          const gx = centerX + Math.cos(groupAngle) * groupRadius;
          const gy = centerY + Math.sin(groupAngle) * groupRadius * 0.82;
          const localRadius = 18 + randomA * 52;
          return { x: gx + Math.cos(angle) * localRadius, y: gy + Math.sin(angle) * localRadius };
        }
        if (phase === 2) {
          const branch = index % 3;
          const row = Math.floor(index / 3);
          const rows = Math.ceil(count / 3);
          return {
            x: centerX + (branch - 1) * spread * 0.21 + (randomA - 0.5) * 32,
            y: centerY - spread * 0.27 + (row / rows) * spread * 0.54 + (randomB - 0.5) * 12,
          };
        }
        if (phase === 3) {
          return { x: centerX - spread * 0.37 + t * spread * 0.74, y: centerY + (randomA - 0.5) * 16 };
        }
        if (phase === 4) {
          const funnelY = centerY - spread * 0.34 + t * spread * 0.68;
          const funnelWidth = (1 - Math.abs(t - 0.5) * 1.55) * spread * 0.25;
          return { x: centerX + (randomA - 0.5) * Math.max(24, funnelWidth), y: funnelY };
        }
        const ring = index % 2;
        const ringRadius = spread * (ring ? 0.31 : 0.2);
        return { x: centerX + Math.cos(angle) * ringRadius, y: centerY + Math.sin(angle) * ringRadius * 0.72 };
      }

      function targetFor(index: number, phaseValue: number) {
        const fromPhase = Math.floor(clamp(phaseValue, 0, colors.length - 1));
        const toPhase = Math.min(colors.length - 1, fromPhase + 1);
        const mix = smoothstep(0, 1, phaseValue - fromPhase);
        const from = targetForState(index, fromPhase);
        const to = targetForState(index, toPhase);
        return { x: from.x + (to.x - from.x) * mix, y: from.y + (to.y - from.y) * mix };
      }

      function rebuild() {
        const bounds = cv.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.round(width * dpr);
        cv.height = Math.round(height * dpr);
        cx.setTransform(dpr, 0, 0, dpr, 0, 0);
        nodes = Array.from({ length: nodeCount() }, (_, index) => {
          const target = targetFor(index, phaseRef.current);
          return {
            x: target.x + (noise(index + 400) - 0.5) * 180,
            y: target.y + (noise(index + 700) - 0.5) * 180,
            vx: 0,
            vy: 0,
            size: index % 17 === 0 ? 2.8 : 0.8 + noise(index + 40) * 1.5,
            seed: noise(index + 300),
          };
        });
      }

      function updateNode(node: FieldNode, index: number, time: number) {
        const target = targetFor(index, phaseRef.current);
        const drift = reduceMotion ? 0 : 5;
        const targetX = target.x + Math.cos(time * 0.00035 + node.seed * 8) * drift;
        const targetY = target.y + Math.sin(time * 0.0003 + node.seed * 10) * drift;

        if (reduceMotion) {
          node.x = targetX;
          node.y = targetY;
          node.vx = 0;
          node.vy = 0;
          return;
        }

        node.vx += (targetX - node.x) * 0.014;
        node.vy += (targetY - node.y) * 0.014;

        if (pointer.active) {
          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const radius = small() ? 90 : 145;
          if (distance < radius) {
            const force = (1 - distance / radius) * 2.7;
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        }

        node.vx *= 0.89;
        node.vy *= 0.89;
        node.x += node.vx;
        node.y += node.vy;
      }

      function draw(time = 0) {
        cx.clearRect(0, 0, width, height);
        const phase = clamp(phaseRef.current, 0, colors.length - 1);
        const fromIndex = Math.floor(phase);
        const toIndex = Math.min(colors.length - 1, fromIndex + 1);
        const palette = mixRgb(colors[fromIndex], colors[toIndex], smoothstep(0, 1, phase - fromIndex));

        const glow = cx.createRadialGradient(
          width * 0.66,
          height * 0.42,
          0,
          width * 0.66,
          height * 0.42,
          Math.min(width, height) * 0.52,
        );
        glow.addColorStop(0, rgba(palette, 0.075));
        glow.addColorStop(0.56, rgba(palette, 0.018));
        glow.addColorStop(1, "rgba(0,0,0,0)");
        cx.fillStyle = glow;
        cx.fillRect(0, 0, width, height);

        nodes.forEach((node, index) => updateNode(node, index, time));

        const maxDistance = small() ? 72 : 96;
        const liveEdges: [FieldNode, FieldNode][] = [];
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > maxDistance) continue;
            cx.beginPath();
            cx.moveTo(nodes[i].x, nodes[i].y);
            cx.lineTo(nodes[j].x, nodes[j].y);
            cx.strokeStyle = rgba(palette, (1 - distance / maxDistance) * 0.2);
            cx.lineWidth = 0.7;
            cx.stroke();
            if (liveEdges.length < 14 && (i + j) % 9 === 0) liveEdges.push([nodes[i], nodes[j]]);
          }
        }

        liveEdges.forEach((edge, index) => {
          const progress = reduceMotion ? 0.5 : (time * 0.00012 + index * 0.13) % 1;
          const x = edge[0].x + (edge[1].x - edge[0].x) * progress;
          const y = edge[0].y + (edge[1].y - edge[0].y) * progress;
          cx.beginPath();
          cx.arc(x, y, 1.7, 0, Math.PI * 2);
          cx.fillStyle = rgba(palette, 0.9);
          cx.shadowBlur = 10;
          cx.shadowColor = rgba(palette, 0.8);
          cx.fill();
          cx.shadowBlur = 0;
        });

        nodes.forEach((node, index) => {
          const bright = index % 17 === 0;
          cx.beginPath();
          cx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          cx.fillStyle = bright ? rgba(paper, 0.95) : rgba(palette, 0.4 + node.seed * 0.55);
          if (bright) {
            cx.shadowBlur = 16;
            cx.shadowColor = rgba(palette, 0.8);
          }
          cx.fill();
          cx.shadowBlur = 0;
        });

        if (flashRef.current > 0.01) {
          cx.fillStyle = rgba(success, flashRef.current * 0.12);
          cx.fillRect(0, 0, width, height);
          flashRef.current = reduceMotion ? 0 : flashRef.current * 0.92;
        }
      }

      function loop(time: number) {
        draw(time);
        raf = window.requestAnimationFrame(loop);
      }

      const startMotion = () => {
        window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(loop);
      };

      const onVisibility = () => {
        if (reduceMotion) return;
        if (document.hidden) window.cancelAnimationFrame(raf);
        else startMotion();
      };

      const onPointerMove = (event: PointerEvent) => {
        const bounds = cv.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
        pointer.active = event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      };
      const onPointerLeave = () => {
        pointer.active = false;
      };

      const resizeObserver = new ResizeObserver(() => {
        rebuild();
        if (reduceMotion) draw(performance.now());
      });
      resizeObserver.observe(canvas);

      drawStaticRef.current = () => draw(performance.now());

      rebuild();
      if (reduceMotion) {
        draw(performance.now());
      } else {
        startMotion();
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerleave", onPointerLeave);
        document.addEventListener("visibilitychange", onVisibility);
      }

      return () => {
        window.cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        drawStaticRef.current = () => {};
      };
    }, [reduceMotion]);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 z-0 h-full w-full ${className ?? ""}`}
      />
    );
  },
);
