import { marked, type Tokens } from "marked";

/**
 * The book ("Inside Rusty") — the markdown chapters in guide/, rendered inside
 * the site at /guide/<file>.html so they share the site's design. Chapter
 * order and parts mirror guide/index.md.
 */

const RAW = import.meta.glob("../../guide/*.md", { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>;

const REPO = "https://github.com/dev-amjad-shaikh/rusty/blob/main/";

export interface BookChapter {
  file: string; // "02-mental-model"
  n: string; // "02" or "A"
  title: string;
}

export interface BookPart {
  title: string;
  chapters: BookChapter[];
}

export const BOOK_PARTS: BookPart[] = [
  {
    title: "Part I · Orientation",
    chapters: [
      { file: "00-preface", n: "00", title: "Preface: how to read this book" },
      { file: "01-the-problem", n: "01", title: "The problem: why agents need a runtime" },
      { file: "02-mental-model", n: "02", title: "The Rusty mental model" },
    ],
  },
  {
    title: "Part II · Concepts and internals",
    chapters: [
      { file: "03-journals", n: "03", title: "Journals & evidence" },
      { file: "04-memory", n: "04", title: "Memory" },
      { file: "05-learning-loop", n: "05", title: "The learning loop" },
      { file: "06-skills", n: "06", title: "Skills" },
      { file: "07-capsules", n: "07", title: "Capsules" },
      { file: "08-blueprints-agents", n: "08", title: "Blueprints & agents" },
      { file: "09-tools-connectors", n: "09", title: "Tools & connectors" },
      { file: "10-durability", n: "10", title: "Durability" },
      { file: "11-sub-agents", n: "11", title: "Sub-agents & delegation" },
      { file: "12-policy-security", n: "12", title: "Policy & security" },
      { file: "13-server-sdks", n: "13", title: "The server & the SDKs" },
      { file: "14-studio", n: "14", title: "Studio" },
    ],
  },
  {
    title: "Part III · Building with Rusty",
    chapters: [
      { file: "15-quickstart", n: "15", title: "Quickstart" },
      { file: "16-build-an-agent", n: "16", title: "Build an agent end to end" },
      { file: "17-build-a-skill", n: "17", title: "Build a skill" },
      { file: "18-build-a-tool", n: "18", title: "Build a tool / connector" },
      { file: "19-wire-memory", n: "19", title: "Wire memory" },
      { file: "20-evaluate", n: "20", title: "Evaluate with rusty-eval" },
      { file: "21-observe", n: "21", title: "Observe with rusty-otel" },
      { file: "22-deploy-operate", n: "22", title: "Deploy & operate" },
    ],
  },
  {
    title: "Appendices",
    chapters: [
      { file: "appendix-a-glossary", n: "A", title: "Glossary" },
      { file: "appendix-b-design-docs", n: "B", title: "Design documents" },
      { file: "appendix-c-releases", n: "C", title: "Releases" },
      { file: "appendix-d-roadmap", n: "D", title: "Roadmap" },
    ],
  },
];

export const BOOK_CHAPTERS = BOOK_PARTS.flatMap((p, i) => p.chapters.map((c) => ({ ...c, part: i })));

/** VitePress's heading slug, so existing /guide/x.html#anchor links still land. */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^(\d)/, "_$1")
    .toLowerCase();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** A book link: sibling chapters stay in the book, repo paths go to GitHub. */
function rewriteHref(href: string): string {
  const m = /^\.?\/?([\w-]+)\.md(#.*)?$/.exec(href);
  if (m) return `/guide/${m[1]}.html${m[2] ?? ""}`;
  if (/^\/[\w-]+(#.*)?$/.test(href) && BOOK_CHAPTERS.some((c) => href.startsWith("/" + c.file)))
    return `/guide${href.replace(/^(\/[\w-]+)/, "$1.html")}`;
  if (href.startsWith("../")) return REPO + href.replace(/^(\.\.\/)+/, "");
  return href;
}

/** `::: tip Title` … `:::` containers → styled boxes. */
function containers(md: string): string {
  return md.replace(/^::: ?(tip|info|warning|danger|details)(?: (.*))?\n([\s\S]*?)\n:::\s*$/gm, (_all, kind, title, body) => {
    const t = title ? `<p class="bk-box-title">${escapeHtml(title)}</p>\n\n` : "";
    return `<div class="bk-box bk-${kind}">\n${t}${body}\n\n</div>`;
  });
}

export interface RenderedChapter {
  html: string;
  title: string;
  eyebrow?: string;
  toc: { id: string; t: string }[];
}

export async function loadChapter(file: string): Promise<RenderedChapter | null> {
  const load = RAW[`../../guide/${file}.md`];
  if (!load) return null;
  let md = await load();
  md = md.replace(/^---\n[\s\S]*?\n---\n/, "");

  let eyebrow: string | undefined;
  md = md.replace(/<p class="chapter-eyebrow">([\s\S]*?)<\/p>\s*/, (_a, t) => {
    eyebrow = t.trim();
    return "";
  });
  let title = "";
  md = md.replace(/^# (.+)\n/m, (_a, t) => {
    title = t.trim();
    return "";
  });
  md = containers(md);

  const toc: RenderedChapter["toc"] = [];
  const used = new Map<string, number>();
  const renderer = new marked.Renderer();

  renderer.heading = function ({ tokens, depth, text }: Tokens.Heading) {
    const inner = this.parser.parseInline(tokens);
    let id = slugify(text.replace(/<[^>]+>/g, ""));
    const seen = used.get(id) ?? 0;
    used.set(id, seen + 1);
    if (seen) id = `${id}-${seen}`;
    if (depth === 2) toc.push({ id, t: text.replace(/`/g, "") });
    return `<h${depth} id="${id}" data-sec><a class="bk-anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${depth}>\n`;
  };
  renderer.code = ({ text, lang }: Tokens.Code) => {
    if (lang === "mermaid") return `<div class="bk-mermaid" data-src="${escapeHtml(text)}"></div>\n`;
    const label = lang ? `<span class="bk-code-lang">${escapeHtml(lang)}</span>` : "";
    return `<div class="bk-code">${label}<pre><code>${escapeHtml(text)}</code></pre></div>\n`;
  };
  renderer.link = function ({ href, title: t, tokens }: Tokens.Link) {
    const to = rewriteHref(href);
    const ext = /^https?:\/\//.test(to);
    const tt = t ? ` title="${escapeHtml(t)}"` : "";
    return `<a href="${escapeHtml(to)}"${tt}${ext ? ' target="_blank" rel="noreferrer"' : ""}>${this.parser.parseInline(tokens)}</a>`;
  };
  renderer.table = function (token: Tokens.Table) {
    const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join("");
    const rows = token.rows
      .map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="bk-table"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
  };

  const html = await marked.parse(md, { renderer, gfm: true });
  return { html, title, eyebrow, toc };
}
