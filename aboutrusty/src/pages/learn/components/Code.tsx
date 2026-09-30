import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { RUSTY_BLOB } from "@/content/learn/source";

const RUST_KW =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(let|mut|async|move|await|fn|pub|match|if|else|return|struct|impl|trait|for|in|use|Some|None|Ok|Err|Self|self|const|as|where|loop|while|true|false)\b|\b(\d[\d_]*(?:\.\d+)?)\b/gm;
const SHELL_KW = /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(curl|cargo|cd|git|export|npm|docker)\b|(\$\w+)/gm;

function highlight(code: string, lang: string): ReactNode[] {
  if (lang === "text" || lang === "json") return [code];
  const re = new RegExp(lang === "shell" ? SHELL_KW : RUST_KW);
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [tok, comment, str, kw, num] = m;
    const color = comment ? "#8b837b" : str ? "#9fd4a8" : kw ? "#f0862b" : num ? "#f5b774" : undefined;
    out.push(
      <span key={k++} style={{ color }}>
        {tok}
      </span>,
    );
    last = m.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

const FRAME = { borderColor: "rgba(236,150,96,.16)", background: "rgba(8,5,4,.75)" };
const BAR = { borderColor: "rgba(236,150,96,.10)", background: "rgba(255,236,214,.02)" };

export function CodePre({ code, lang = "rust", maxHeight }: { code: string; lang?: string; maxHeight?: number }) {
  return (
    <pre
      className="m-0 overflow-auto px-[18px] py-4 font-code text-[13px] leading-[1.7] text-[#ddd0c4]"
      style={{ borderLeft: "2px solid rgba(240,134,43,.5)", maxHeight }}
    >
      <code>{highlight(code, lang)}</code>
    </pre>
  );
}

/** A source excerpt with its repo path, linked at the pinned rusty commit. */
export function CodeExcerpt({ file, symbol, code, lang = "rust" }: { file?: string; symbol?: string; code: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border" style={FRAME}>
      {(file || symbol) && (
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b px-3.5 py-2" style={BAR}>
          {file ? (
            <a href={RUSTY_BLOB + file} target="_blank" rel="noreferrer" className="break-all font-code text-[11.5px] text-[#cbb3a2] hover:text-[#ffd0b3]">
              {file}
            </a>
          ) : (
            <span />
          )}
          {symbol && <span className="font-code text-[11.5px] text-[#6f675f]">{symbol}</span>}
        </div>
      )}
      <CodePre code={code} lang={lang} />
    </div>
  );
}

/** Commands to type, with a copy button. */
export function CommandBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="overflow-hidden rounded-xl border" style={FRAME}>
      <div className="flex items-center justify-between border-b px-3.5 py-1.5" style={BAR}>
        <span className="font-code text-[11px] uppercase tracking-[0.12em] text-[#6f675f]">shell</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy commands"}
          className="flex cursor-pointer items-center gap-1.5 rounded-md border-0 bg-transparent px-1.5 py-1 font-code text-[11px] text-[#a39a91] transition-colors hover:text-[#fff3ea]"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <CodePre code={code} lang="shell" />
    </div>
  );
}
