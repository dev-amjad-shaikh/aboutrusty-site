/**
 * Content model for Learn lessons.
 *
 * A lesson is plain data: sections of blocks, rendered by LearnArticle.
 * Inline text supports `code`, **bold**, [label](href), and [[Glossary term]]
 * or [[Glossary term|shown text]] markers. A glossary marker shows the term's
 * definition from src/content/concepts.ts on hover or tap.
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
  | { type: "diagram"; name: string }
  /**
   * Ask before telling. The reader commits to an answer, then the answer and
   * explanation are revealed. Put it right before the diagram or section that
   * shows the answer.
   */
  | { type: "predict"; question: string; options: string[]; answer: number; explain: string }
  /**
   * Run it yourself against the real repo. `output` is real captured output
   * (trim, but never invent), recorded at `capturedAt` (short sha + date).
   * The optional exercise asks the reader to change one thing and predict the
   * result; `result` is what really happened when it was run.
   */
  | {
      type: "lab";
      title: string;
      /** One or two sentences: what you'll run and what to watch for. */
      intro: string;
      commands: string;
      output: string;
      capturedAt: string;
      exercise?: { change: string; predict: string; result: string };
    };

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
  /** Optional: not every lesson needs a takeaway list or a quiz. */
  takeaways?: string[];
  quiz?: { q: string; a: string }[];
  /** Book chapters that go deeper, as "NN-file.html#anchor" under /guide/. */
  deeper?: { book: string; label: string }[];
  sources: { path: string; what: string }[];
  related?: { label: string; href: string }[];
}
