import { useEffect } from "react";
import { useLocation } from "react-router";
import { BOOK_CHAPTERS } from "@/content/book";
import { DOC_PAGES } from "@/content/docs";
import { getLesson } from "@/content/learn";

const SITE = "Rusty";
const HOME_TITLE = "Rusty · Build AI agents that don't lose their work";
const HOME_DESC =
  "Rusty is an open-source runtime and server for AI agents, written in Rust. It saves an agent's state after every step, so a run can survive a crash, pause for approval, and be replayed exactly. One binary.";

const STATIC: Record<string, [string, string]> = {
  "/learn": [
    "Learn how Rusty works",
    "Lessons on the internals of an agent runtime, using Rusty's source code as the example: the super-step loop, checkpoints, interrupts, replay, and more.",
  ],
  "/docs": ["Docs", "Install Rusty, run it locally with Studio, build and test agents, and deploy and operate the server."],
  "/research": [
    "Research",
    "The ideas behind Rusty, where they come from, and the problems they solve, each backed by a test in the repository.",
  ],
  "/concepts": ["Concepts", "How Rusty's core ideas depend on each other, and a glossary of terms."],
  "/releases": ["Releases", "Release notes for the Rusty platform, from R0.1 Ignition to the latest release and what's on main."],
  "/playground": ["Playground", "Run a simulated Rusty graph in the browser: step through super-steps, checkpoints, interrupts, forks, and replays."],
  "/guide": ["Inside Rusty", "The long-form book about Rusty: concepts first, then the code, with every mechanism tied to the file that implements it."],
};

/** First sentence or two of a text, capped for a meta description. */
function clip(s: string, max = 180): string {
  const plain = s.replace(/`/g, "").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  const end = cut.lastIndexOf(". ");
  return end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

function metaFor(pathname: string, search: string): [string, string] {
  if (pathname === "/") return [HOME_TITLE, HOME_DESC];

  const lesson = pathname.match(/^\/learn\/([^/]+)$/);
  if (lesson) {
    const l = getLesson(lesson[1]);
    if (l) return [`${l.id} ${l.title} · Learn · ${SITE}`, clip(l.summary)];
  }

  const chapter = pathname.match(/^\/guide\/([\w-]+)\.html$/);
  if (chapter && chapter[1] !== "index") {
    const c = BOOK_CHAPTERS.find((x) => x.file === chapter[1]);
    if (c) return [`${c.n} · ${c.title} · Inside Rusty`, `Chapter ${c.n} of Inside Rusty, the book about the Rusty agent runtime: ${c.title}.`];
  }

  if (pathname === "/docs") {
    const id = new URLSearchParams(search).get("p");
    const page = id ? DOC_PAGES[id] : undefined;
    if (page) {
      const first = page.blocks.find((b) => b.type === "p");
      return [`${page.title} · Docs · ${SITE}`, clip(first && "text" in first ? first.text : STATIC["/docs"][1])];
    }
  }

  const key = pathname.startsWith("/guide") ? "/guide" : pathname;
  const s = STATIC[key];
  if (s) return [`${s[0]} · ${SITE}`, s[1]];
  return [`Page not found · ${SITE}`, HOME_DESC];
}

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/** Keeps the tab title, description, and share tags in step with the route. */
export function RouteMeta() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const [title, desc] = metaFor(pathname, search);
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", desc);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", desc);
    setMeta('meta[property="og:url"]', "property", "og:url", `https://aboutrusty.com${pathname}${search}`);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
    let canon = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.rel = "canonical";
      document.head.appendChild(canon);
    }
    canon.href = `https://aboutrusty.com${pathname}${search}`;
  }, [pathname, search]);
  return null;
}
