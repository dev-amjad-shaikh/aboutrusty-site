import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

/**
 * Shared warm-terminal code block: mono title bar, hairline border, and the
 * reference's rust accent rail along the left of the code. Dependency-free.
 */
export function CodeBlock({ code, language, title, className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border ${className}`}
      style={{
        borderColor: "rgba(236,150,96,.16)",
        background: "rgba(8,5,4,.75)",
      }}
    >
      {(title || language) && (
        <div
          className="flex items-center justify-between border-b px-4 py-2"
          style={{
            borderColor: "rgba(236,150,96,.10)",
            background: "rgba(255,236,214,.02)",
          }}
        >
          <span className="font-code text-[11.5px] text-[#cbb3a2]">
            {title ?? ""}
          </span>
          <div className="flex items-center gap-3">
            {language && (
              <span className="font-code text-[10px] uppercase tracking-wider text-[#6f675f]">
                {language}
              </span>
            )}
            <button
              onClick={copy}
              aria-label="Copy code"
              className="text-[#8b837b] transition-colors hover:text-[#fff3ea]"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}
      <pre
        className="m-0 overflow-x-auto p-4"
        style={{ borderLeft: "2px solid rgba(240,134,43,.5)" }}
      >
        <code className="font-code text-[13px] leading-[1.7] text-[#ddd0c4]">
          {code}
        </code>
      </pre>
    </div>
  );
}
