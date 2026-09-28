import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper — fades and rises once when it enters the viewport,
 * matching the reference design's data-reveal behavior. Disabled under
 * prefers-reduced-motion.
 */
export function Reveal({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(40px)",
        transition: "opacity 1s ease, transform 1s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      {children}
    </div>
  );
}

/** Mono uppercase section kicker: "01 · What it is" in rust. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">
      {children}
    </span>
  );
}

/** Light-weight section headline, 44px / tracking -0.025em. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="m-0 font-light text-[#f7ece4]"
      style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: "-.025em" }}
    >
      {children}
    </h2>
  );
}
