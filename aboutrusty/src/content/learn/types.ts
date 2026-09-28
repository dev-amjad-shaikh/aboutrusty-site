/**
 * Content model for Learn lessons.
 *
 * A lesson is plain data: sections of blocks, rendered by LearnArticle.
 * Inline text supports `code`, **bold**, and [label](href) markers.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  /** A source excerpt. `file` is a repo path; `symbol` names where it lives. */
  | { type: "code"; file?: string; symbol?: string; code: string; lang?: "rust" | "shell" | "json" | "text" }
  /** Labelled rows, e.g. the three ways a node can end. */
  | { type: "rows"; rows: { label: string; tone?: "green" | "red" | "amber" | "plain"; text: string }[] }
  | { type: "note"; title?: string; text: string }
  /** A diagram or interactive from src/pages/learn/diagrams.tsx, by name. */
  | { type: "diagram"; name: string };

export interface Section {
  /** Anchor id, also used by the "On this page" rail. */
  id: string;
  /** Heading shown in the article. */
  title: string;
  /** Shorter label for the "On this page" rail. */
  toc?: string;
  blocks: Block[];
}

export interface Lesson {
  /** Chapter id in the 11-part course, e.g. "2.3". */
  id: string;
  /** URL segment under /learn/. */
  slug: string;
  title: string;
  minutes: number;
  /** Main source file shown in the lesson meta line. */
  source: string;
  /** Chapter ids to read first. */
  before?: string[];
  summary: string;
  /** The three "You'll learn / try / read" cells. */
  glance: { learn: string; try: string; read: string };
  /** True when the lesson has a hands-on interactive (shown on the hub). */
  interactive?: boolean;
  sections: Section[];
  takeaways: string[];
  quiz: { q: string; a: string }[];
  sources: { path: string; what: string }[];
  related?: { label: string; href: string }[];
}
