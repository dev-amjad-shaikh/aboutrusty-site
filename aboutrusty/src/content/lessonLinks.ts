import { CHAPTERS } from "./learn/course";

/**
 * Links into the Learn course by chapter id (the 11-part numbering on /learn,
 * e.g. "2.3"). A chapter with a written lesson opens it; a chapter covered by
 * a section of another lesson opens that section; every other chapter opens
 * the book chapter that covers the topic today.
 */

export type LessonKind = "lesson" | "section" | "book";

function find(id: string) {
  return CHAPTERS.find((c) => c.id === id);
}

export function lessonHref(id: string): string {
  const c = find(id);
  if (!c) return "/learn";
  if (c.lesson) return `/learn/${c.lesson}`;
  if (c.within) return `/learn/${c.within}`;
  return `/guide/${c.book}`;
}

export function lessonTitle(id: string): string | undefined {
  return find(id)?.t;
}

export function lessonKind(id: string): LessonKind | undefined {
  const c = find(id);
  if (!c) return undefined;
  return c.lesson ? "lesson" : c.within ? "section" : "book";
}
