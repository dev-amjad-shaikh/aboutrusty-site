import { useEffect, useRef } from "react";

/**
 * HeroCanvas — full-bleed animated background for the dark hero.
 * Layers per frame: ambient glows → drifting grid → light sweep →
 * node field → edges → routed pulses. Vignette + film grain sit on
 * top of the canvas as DOM overlays, behind the content.
 *
 * Palette: bg #0a0c0e · accent #FE6B35 · light #E2E8E6
 * DPR capped at 2 · rAF with delta clamped to 0.05s ·
 * one static frame under prefers-reduced-motion.
 */

interface FieldNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hot: boolean;
  charge: number;
}

interface Pulse {
  path: number[];
  seg: number;
  dist: number;
  speed: number;
}

interface TrailSeg {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  age: number;
}

const LINK = 172;
const MAX_PULSES = 8;
const TRAIL_LIFE = 1.35;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let t = 0;
    let nodes: FieldNode[] = [];
    let pulses: Pulse[] = [];
    let trails: TrailSeg[] = [];
    let nextSpawn = 0.8;

    const makeNode = (): FieldNode => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: rand(-4.5, 4.5),
      vy: rand(-4.5, 4.5),
      r: rand(0.9, 2.1),
      hot: Math.random() < 0.09,
      charge: 0,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(
        Math.min(150, Math.max(38, ((W * H) / 23000) * 1.8))
      );
      if (target !== nodes.length) {
        nodes = Array.from({ length: target }, makeNode);
      }
    };

    const spawnPulse = () => {
      const start = Math.floor(Math.random() * nodes.length);
      const hops = 3 + Math.floor(Math.random() * 4); // 3–6
      const path = [start];
      let current = start;
      for (let h = 0; h < hops; h++) {
        const from = nodes[current];
        const candidates: number[] = [];
        for (let i = 0; i < nodes.length; i++) {
          if (path.includes(i)) continue;
          const dx = nodes[i].x - from.x;
          const dy = nodes[i].y - from.y;
          if (Math.hypot(dx, dy) < LINK) candidates.push(i);
        }
        if (candidates.length === 0) break;
        current = candidates[Math.floor(Math.random() * candidates.length)];
        path.push(current);
      }
      if (path.length < 2) return;
      pulses.push({ path, seg: 0, dist: 0, speed: rand(220, 390) });
    };

    const paint = () => {
      /* ---- background ---- */
      ctx.fillStyle = "#0a0c0e";
      ctx.fillRect(0, 0, W, H);

      /* ---- ambient glows ---- */
      const breathe = (0.78 + 0.22 * Math.sin(t * 0.22)) * 0.8;
      const gx = W * 0.85 + Math.sin(t * 0.11) * W * 0.045;
      const gy = 0 + Math.cos(t * 0.09) * H * 0.06;
      const gr = 0.66 * Math.max(W, H);
      let g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, `rgba(254,107,53,${(0.155 * breathe).toFixed(4)})`);
      g.addColorStop(0.5, `rgba(254,107,53,${(0.045 * breathe).toFixed(4)})`);
      g.addColorStop(1, "rgba(254,107,53,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const cr = 0.55 * Math.max(W, H);
      g = ctx.createRadialGradient(W * 0.06, H * 0.94, 0, W * 0.06, H * 0.94, cr);
      g.addColorStop(0, "rgba(140,170,190,0.045)");
      g.addColorStop(1, "rgba(140,170,190,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      /* ---- grid (drifting, wraps by cell size) ---- */
      const cell = 74;
      const ox = (t * 3.5) % cell;
      const oy = (t * 2) % cell;
      for (let x = -cell + ox, i = Math.round((x - ox) / cell); x < W + cell; x += cell, i++) {
        const major = ((i % 4) + 4) % 4 === 0;
        ctx.strokeStyle = `rgba(226,232,230,${major ? 0.045 : 0.022})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = -cell + oy, i = Math.round((y - oy) / cell); y < H + cell; y += cell, i++) {
        const major = ((i % 4) + 4) % 4 === 0;
        ctx.strokeStyle = `rgba(226,232,230,${major ? 0.045 : 0.022})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      /* ---- light sweep (diagonal band, 17s cycle) ---- */
      const sweepX = ((t % 17) / 17) * (W + 760) - 380;
      ctx.save();
      ctx.transform(1, 0.3, 0, 1, 0, 0); // u = x + 0.3y
      const band = ctx.createLinearGradient(sweepX - 380, 0, sweepX + 380, 0);
      band.addColorStop(0, "rgba(254,107,53,0)");
      band.addColorStop(0.5, "rgba(254,107,53,0.05)");
      band.addColorStop(1, "rgba(254,107,53,0)");
      ctx.fillStyle = band;
      ctx.fillRect(-0.3 * H - 100, -100, W + 0.3 * H + 200, H + 200);
      ctx.restore();

      /* ---- edges ---- */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d >= LINK) continue;
          const charged = Math.max(a.charge, b.charge);
          if (charged > 0.02) {
            const alpha = (1 - d / LINK) * (0.09 + charged * 0.42);
            ctx.strokeStyle = `rgba(254,107,53,${alpha.toFixed(4)})`;
          } else {
            const alpha = (1 - d / LINK) * 0.075;
            ctx.strokeStyle = `rgba(214,224,228,${alpha.toFixed(4)})`;
          }
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      /* ---- pulse trails (fading accent segments) ---- */
      for (const seg of trails) {
        const alpha = 0.45 * Math.pow(1 - seg.age / TRAIL_LIFE, 2);
        ctx.strokeStyle = `rgba(254,107,53,${alpha.toFixed(4)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(seg.ax, seg.ay);
        ctx.lineTo(seg.bx, seg.by);
        ctx.stroke();
      }

      /* ---- nodes (halos first, then dots) ---- */
      for (const n of nodes) {
        if (n.charge > 0.01) {
          const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 3 + n.charge * 8);
          halo.addColorStop(0, `rgba(254,107,53,${(0.11 * n.charge).toFixed(4)})`);
          halo.addColorStop(1, "rgba(254,107,53,0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3 + n.charge * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        const prox = Math.max(0, 1 - Math.abs(n.x + 0.3 * n.y - sweepX) / 210);
        const alpha = (n.hot ? 0.42 : 0.28) + n.charge * 0.5 + prox * 0.3;
        ctx.fillStyle = n.hot
          ? `rgba(254,107,53,${alpha.toFixed(4)})`
          : `rgba(226,232,230,${alpha.toFixed(4)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ---- routed pulses ---- */
      for (const p of pulses) {
        const a = nodes[p.path[p.seg]];
        const b = nodes[p.path[p.seg + 1]];
        const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const f = Math.min(1, p.dist / segLen);
        const hx = a.x + (b.x - a.x) * f;
        const hy = a.y + (b.y - a.y) * f;
        // partial current segment
        ctx.strokeStyle = "rgba(254,107,53,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        // head
        const head = ctx.createRadialGradient(hx, hy, 0, hx, hy, 11);
        head.addColorStop(0, "rgba(255,204,176,0.95)");
        head.addColorStop(0.45, "rgba(254,107,53,0.5)");
        head.addColorStop(1, "rgba(254,107,53,0)");
        ctx.fillStyle = head;
        ctx.beginPath();
        ctx.arc(hx, hy, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (dt: number) => {
      // node drift + charge decay
      for (const n of nodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -30) n.x = W + 30;
        if (n.x > W + 30) n.x = -30;
        if (n.y < -30) n.y = H + 30;
        if (n.y > H + 30) n.y = -30;
        if (n.charge > 0) n.charge = Math.max(0, n.charge - 0.7 * dt);
      }

      // spawn
      if (pulses.length < MAX_PULSES && t >= nextSpawn) {
        spawnPulse();
        nextSpawn = t + (0.6 + Math.random() * 1.5) / 2.5;
      }

      // advance pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        let a = nodes[p.path[p.seg]];
        let b = nodes[p.path[p.seg + 1]];
        let segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        p.dist += p.speed * dt;
        while (p.dist >= segLen) {
          trails.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, age: 0 });
          b.charge = 1;
          p.dist -= segLen;
          p.seg += 1;
          if (p.seg >= p.path.length - 1) {
            pulses.splice(i, 1);
            break;
          }
          a = nodes[p.path[p.seg]];
          b = nodes[p.path[p.seg + 1]];
          segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        }
      }

      // age trails
      for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].age += dt;
        if (trails[i].age >= TRAIL_LIFE) trails.splice(i, 1);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      t += dt;
      step(dt);
      paint();
      raf = window.requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !reduceMotion) {
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      }
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) paint();
    });
    observer.observe(canvas);
    resize();

    if (reduceMotion) {
      paint(); // one full static frame
    } else {
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {/* vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 44%, transparent 30%, rgba(6,7,8,0.62) 100%)",
        }}
      />
      {/* animated film grain */}
      <style>{`
        @keyframes hero-grain {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-2%, 1%); }
          40% { transform: translate(1%, -2%); }
          60% { transform: translate(-1%, 2%); }
          80% { transform: translate(2%, -1%); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[5%] opacity-[0.13] mix-blend-overlay animate-[hero-grain_0.8s_steps(1,end)_infinite] motion-reduce:animate-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
