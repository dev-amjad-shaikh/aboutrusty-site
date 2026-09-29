#!/usr/bin/env node
/**
 * Staleness check for the Learn lessons and the book.
 *
 *   RUSTY_REPO_PATH=/path/to/rusty npm run check:learn
 *
 * Everything is checked against the pinned commit RUSTY_SHA from
 * src/content/learn/source.ts, read with `git show` from a local rusty
 * checkout (default ../../rusty-src relative to this package):
 *
 *  - every quoted `code` block with a `file`: each substantive line (trimmed,
 *    12+ chars, not comment-only, no "…" or inline /* elision *\/) appears in that file,
 *    compared without whitespace, comments, or trailing commas
 *  - every lesson `source`, `sources[].path` and code `file` exists
 *  - every GitHub link to the rusty repo in lessons and guide/*.md points at a path that exists
 *  - every [[Glossary term]] marker names a term in src/content/concepts.ts
 *  - every `before` chapter id and `deeper` book chapter exists
 *
 * Exits 1 when anything fails. Not part of `build`: the deploy host has no rusty checkout.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { marked } from "marked";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(root, process.env.RUSTY_REPO_PATH ?? "../../rusty-src");

// Load the lesson data by bundling the TypeScript content modules.
const tmp = mkdtempSync(join(tmpdir(), "check-learn-"));
const out = join(tmp, "content.mjs");
await build({
  stdin: {
    contents: `
      export { lessons } from "./src/content/learn/index.ts";
      export { PARTS, CHAPTERS } from "./src/content/learn/course.ts";
      export { RUSTY_SHA } from "./src/content/learn/source.ts";
      export { TERMS } from "./src/content/concepts.ts";
    `,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  logLevel: "error",
  tsconfig: join(root, "tsconfig.app.json"),
});
const { lessons, PARTS, CHAPTERS, RUSTY_SHA, TERMS } = await import(pathToFileURL(out).href);
rmSync(tmp, { recursive: true, force: true });

const short = RUSTY_SHA.slice(0, 7);
const git = (...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 });

if (!existsSync(repo)) {
  console.error(`rusty checkout not found at ${repo}. Set RUSTY_REPO_PATH.`);
  process.exit(2);
}
try {
  git("cat-file", "-e", `${RUSTY_SHA}^{commit}`);
} catch {
  console.error(`Commit ${RUSTY_SHA} is not in ${repo}. Fetch it (git -C ${repo} fetch) and retry.`);
  process.exit(2);
}

const exists = new Map();
function pathExists(path) {
  const p = path.replace(/\/+$/, "");
  if (!exists.has(p)) {
    try {
      git("cat-file", "-e", `${RUSTY_SHA}:${p}`);
      exists.set(p, true);
    } catch {
      exists.set(p, false);
    }
  }
  return exists.get(p);
}

/**
 * Formatting-insensitive form of code: comments dropped, whitespace removed,
 * trailing commas before a closer dropped. A line rewrapped by rustfmt, or an
 * excerpt that joins a struct onto one line, still matches its source.
 */
const dropComment = (line) => (/^\s*(\/\/|\/\*|\*)/.test(line) ? "" : line.replace(/\s\/\/.*$/, ""));
const norm = (text) =>
  text
    .split("\n")
    .map(dropComment)
    .join("")
    .replace(/\s+/g, "")
    .replace(/,(?=[}\])>])/g, "");
/** The same, keeping comment text (markers removed): excerpts may quote a doc-comment example. */
const normWithComments = (text) =>
  text
    .split("\n")
    .map((l) => l.replace(/^\s*(\/\/[/!]?|\*)\s?/, ""))
    .join("")
    .replace(/\s+/g, "")
    .replace(/,(?=[}\])>])/g, "");
const contents = new Map();
function fileText(path) {
  if (!contents.has(path)) {
    const raw = pathExists(path) ? git("show", `${RUSTY_SHA}:${path}`) : null;
    contents.set(path, raw === null ? null : [norm(raw), normWithComments(raw)]);
  }
  return contents.get(path);
}

const isComment = (line) => /^(\/\/|\/\*|\*|#(?!\[|!\[)|<!--)/.test(line);
const substantive = (code) =>
  code
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 12 && !l.includes("…") && !/\/\*.*\*\//.test(l) && !isComment(l));

const REPO_LINK = /https:\/\/github\.com\/dev-amjad-shaikh\/rusty\/(?:blob|tree)\/([^/\s)"'`]+)\/([^\s)"'`#?]+)/g;
const TERM_NAMES = new Set(TERMS.map((t) => t.term.toLowerCase()));
const CHAPTER_IDS = new Set(CHAPTERS.map((c) => c.id));

// Book anchors use VitePress-style heading slugs (same as src/content/book.ts).
const slugify = (t) =>
  t.normalize("NFKD").replace(/[\u0300-\u036F]/g, "")
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, "-")
    .replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").replace(/^(\d)/, "_$1").toLowerCase();
const anchorCache = new Map();
function bookAnchors(md) {
  if (!anchorCache.has(md)) {
    const path = join(guideDir, md);
    anchorCache.set(md, existsSync(path)
      ? new Set(marked.lexer(readFileSync(path, "utf8")).filter((t) => t.type === "heading").map((t) => slugify(t.text.replace(/<[^>]+>/g, ""))))
      : null);
  }
  return anchorCache.get(md);
}
/** "10-durability.html#anchor" → an error string, or null when it resolves. */
function checkBookRef(ref) {
  const [file, anchor] = ref.split("#");
  const md = file.replace(/\.html$/, ".md");
  const ids = bookAnchors(md);
  if (!ids) return `guide/${md} does not exist`;
  if (anchor && !ids.has(anchor)) return `no heading with anchor #${anchor} in guide/${md}`;
  return null;
}
const guideDir = join(root, "guide");

/** Every string anywhere inside a value. */
function strings(v, acc = []) {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, acc));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => strings(x, acc));
  return acc;
}

const failures = []; // { where, what, detail }
const fail = (where, what, detail = "") => failures.push({ where, what, detail });
let codeBlocks = 0;
let linesChecked = 0;

// The course map: book-backed chapters and chapters covered by a lesson section.
for (const c of CHAPTERS) {
  if (c.book) {
    const err = checkBookRef(c.book);
    if (err) fail(`course ${c.id}`, `book: ${c.book}`, err);
  }
  if (c.within) {
    const [slug, sec] = c.within.split("#");
    const l = lessons.find((x) => x.slug === slug);
    if (!l) fail(`course ${c.id}`, `within: ${c.within}`, `no lesson with slug ${slug}`);
    else if (sec && !l.sections.some((x) => x.id === sec)) fail(`course ${c.id}`, `within: ${c.within}`, `lesson ${slug} has no section #${sec}`);
  }
}

for (const lesson of lessons) {
  const where = `lesson ${lesson.id} ${lesson.slug}`;

  if (!pathExists(lesson.source)) fail(where, `source ${lesson.source}`, "path does not exist");
  for (const s of lesson.sources ?? []) if (!pathExists(s.path)) fail(where, `sources: ${s.path}`, "path does not exist");
  for (const id of lesson.before ?? []) if (!CHAPTER_IDS.has(id)) fail(where, `before: ${id}`, "no such chapter id");
  for (const d of lesson.deeper ?? []) {
    const err = checkBookRef(d.book);
    if (err) fail(where, `deeper: ${d.book}`, err);
  }

  for (const section of lesson.sections) {
    for (const block of section.blocks) {
      if (block.type !== "code" || !block.file) continue;
      codeBlocks++;
      const text = fileText(block.file);
      if (text === null) {
        fail(`${where} #${section.id}`, `code file ${block.file}`, "path does not exist");
        continue;
      }
      for (const line of substantive(block.code)) {
        linesChecked++;
        const want = norm(line).replace(/,$/, "");
        const wantDoc = normWithComments(line).replace(/,$/, "");
        if (!text[0].includes(want) && !text[1].includes(wantDoc)) fail(`${where} #${section.id}`, block.file, `missing line: ${line}`);
      }
    }
  }

  for (const s of strings(lesson)) {
    for (const m of s.matchAll(REPO_LINK)) if (!pathExists(m[2])) fail(where, `link ${m[0]}`, "path does not exist");
    for (const m of s.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g))
      if (!TERM_NAMES.has(m[1].trim().toLowerCase())) fail(where, `[[${m[1]}]]`, "not a term in src/content/concepts.ts");
  }
}

PARTS.forEach((part, i) => {
  for (const s of strings(part.recap ?? []))
    for (const m of s.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g))
      if (!TERM_NAMES.has(m[1].trim().toLowerCase())) fail(`course part ${i + 1} recap`, `[[${m[1]}]]`, "not a term in src/content/concepts.ts");
});

let bookLinks = 0;
for (const f of readdirSync(guideDir).filter((f) => f.endsWith(".md")).sort()) {
  const lines = readFileSync(join(guideDir, f), "utf8").split("\n");
  lines.forEach((line, n) => {
    for (const m of line.matchAll(REPO_LINK)) {
      bookLinks++;
      if (!pathExists(decodeURIComponent(m[2]))) fail(`guide/${f}:${n + 1}`, m[0], `path does not exist at ${short}`);
    }
  });
}

console.log(
  `Checked ${lessons.length} lessons (${codeBlocks} code excerpts, ${linesChecked} lines) and ${bookLinks} book links against rusty @ ${short} in ${repo}.`,
);
if (!failures.length) {
  console.log("All sources match.");
  process.exit(0);
}
let last = "";
for (const f of failures) {
  if (f.where !== last) console.log(`\n${f.where}`);
  last = f.where;
  console.log(`  ✗ ${f.what}${f.detail ? `\n      ${f.detail}` : ""}`);
}
console.log(`\n${failures.length} problem${failures.length === 1 ? "" : "s"}.`);
process.exit(1);
