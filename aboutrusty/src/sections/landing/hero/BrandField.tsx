import { useEffect, useRef } from "react";

/**
 * BrandField — a calm ambient constellation behind the brand intro.
 * Sparse slow-drifting particles with faint proximity links, a gentle
 * pointer response, and occasional rust embers. Deliberately subtler
 * than the reel's RuntimeField: this is a backdrop, not a demo.
 *
 * - DPR-aware resize via ResizeObserver
 * - rAF paused when the tab is hidden
 * - Static single frame under prefers-reduced-motion
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  ember: boolean;
}

const COUNT = 56;
const LINK_DIST = 120;
const POINTER_DIST = 150;

export function BrandField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let particles: Particle[] = [];
    const pointer = { x: -9999, y: -9999 };

    const seed = () => {
      particles = Array.from({ length: COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 0.9 + Math.random() * 1.3,
        ember: i % 12 === 0,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // faint links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.085;
            ctx.strokeStyle = `rgba(237, 240, 236, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // particles
      for (const p of particles) {
        if (p.ember) {
          ctx.fillStyle = "rgba(255, 107, 53, 0.75)";
          ctx.shadowColor = "rgba(255, 107, 53, 0.55)";
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = "rgba(237, 240, 236, 0.42)";
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const tick = () => {
      for (const p of particles) {
        // gentle pointer repulsion
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < POINTER_DIST && d > 0.001) {
          const force = ((POINTER_DIST - d) / POINTER_DIST) * 0.028;
          p.vx += (dx / d) * force;
          p.vy += (dy / d) * force;
        }
        // damped drift, capped speed
        p.vx *= 0.985;
        p.vy *= 0.985;
        const speed = Math.hypot(p.vx, p.vy);
        const max = 0.3;
        if (speed > max) {
          p.vx = (p.vx / speed) * max;
          p.vy = (p.vy / speed) * max;
        }
        p.x += p.vx;
        p.y += p.vy;
        // wrap edges with a margin
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
      }
      draw();
      raf = window.requestAnimationFrame(tick);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !reduceMotion) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw();
    });
    observer.observe(canvas);
    resize();

    if (reduceMotion) {
      draw(); // one static frame
    } else {
      raf = window.requestAnimationFrame(tick);
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    />
  );
}
