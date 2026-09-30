import { TERMS, type Term } from "@/content/concepts";

const BY_NAME = new Map(TERMS.map((t) => [t.term.toLowerCase(), t]));
const warned = new Set<string>();

/** A glossary term by name, case-insensitive. Warns once in dev when missing. */
export function findTerm(name: string): Term | undefined {
  const t = BY_NAME.get(name.trim().toLowerCase());
  if (!t && import.meta.env.DEV && !warned.has(name)) {
    warned.add(name);
    console.warn(`[learn] [[${name}]] is not a term in src/content/concepts.ts; rendered as plain text.`);
  }
  return t;
}
