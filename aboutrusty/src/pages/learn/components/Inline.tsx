import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import { RUSTY_BLOB, RUSTY_TREE } from "@/content/learn/source";
import { findTerm } from "./glossary";

const CODE_INK = "#ffc7a6";

const REPO = "https://github.com/dev-amjad-shaikh/rusty/";

/** Lesson text quotes rusty at the pinned commit, so its repo links point there too. */
const pinRepoLink = (href: string) =>
  href.startsWith(REPO + "blob/main/")
    ? RUSTY_BLOB + href.slice((REPO + "blob/main/").length)
    : href.startsWith(REPO + "tree/main/")
      ? RUSTY_TREE + href.slice((REPO + "tree/main/").length)
      : href;

/**
 * A link that uses the router for site pages and a plain anchor for GitHub.
 * Links into rusty on main are pinned to the commit the lessons quote.
 */
export function SmartLink({ href, className, style, children }: { href: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className} style={style}>
        {children}
      </Link>
    );
  }
  const external = /^https?:\/\//.test(href);
  return (
    <a href={pinRepoLink(href)} className={className} style={style} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children}
    </a>
  );
}

const POP_W = 320;

/**
 * A glossary term with its definition in a popover. Opens on mouse hover,
 * keyboard focus, or tap; closes on leave, blur, Escape, scroll, or a tap
 * elsewhere.
 */
function GlossaryTerm({ name, shown }: { name: string; shown: string }) {
  const term = findTerm(name);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [pos, setPos] = useState<CSSProperties | null>(null);

  const open = () => {
    window.clearTimeout(closeTimer.current);
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const vw = document.documentElement.clientWidth;
    const width = Math.min(POP_W, vw - 32);
    const left = Math.max(16, Math.min(r.left + r.width / 2 - width / 2, vw - 16 - width));
    const below = r.bottom + 190 < window.innerHeight;
    setPos(below ? { left, width, top: r.bottom + 8 } : { left, width, bottom: window.innerHeight - r.top + 8 });
  };
  const close = () => setPos(null);
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(close, 140);
  };

  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [pos]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  if (!term) return <>{shown}</>;

  return (
    <span
      ref={wrap}
      className="inline"
      onPointerEnter={(e) => e.pointerType === "mouse" && open()}
      onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
    >
      <button
        ref={btn}
        type="button"
        aria-describedby={pos ? id : undefined}
        aria-expanded={!!pos}
        onClick={() => (pos ? close() : open())}
        onFocus={() => btn.current?.matches(":focus-visible") && open()}
        onBlur={closeSoon}
        className="inline cursor-help border-0 bg-transparent p-0 text-left text-inherit underline decoration-dotted decoration-[1.5px] underline-offset-[4px]"
        style={{ font: "inherit", textDecorationColor: "rgba(240,134,43,.75)" }}
      >
        {shown}
      </button>
      {pos && (
        <span
          id={id}
          role="tooltip"
          className="fixed z-50 flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-left"
          style={{
            ...pos,
            borderColor: "rgba(240,134,43,.35)",
            background: "#140d0a",
            boxShadow: "0 18px 40px -12px rgba(0,0,0,.8)",
          }}
        >
          <span className="font-code text-[10.5px] uppercase tracking-[0.14em] text-[#f0862b]">{term.term}</span>
          <span className="text-[14.5px] font-normal leading-[1.55] text-[#ece0d5]">{term.definition}</span>
        </span>
      )}
    </span>
  );
}

/** Inline `code`, **bold**, [label](href), and [[Term]] / [[Term|text]] markers. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((seg, i) => {
        const g = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/.exec(seg);
        if (g) return <GlossaryTerm key={i} name={g[1]} shown={g[2] ?? g[1]} />;
        if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4)
          return (
            <strong key={i} className="font-normal text-[#f7ece4]">
              {seg.slice(2, -2)}
            </strong>
          );
        if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2)
          return (
            <code key={i} className="break-words font-code text-[0.88em]" style={{ color: CODE_INK }}>
              {seg.slice(1, -1)}
            </code>
          );
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(seg);
        if (m) return <SmartLink key={i} href={m[2]}>{m[1]}</SmartLink>;
        return seg;
      })}
    </>
  );
}
