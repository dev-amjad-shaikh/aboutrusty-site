/** Read-progress for the Learn course, kept in this browser only. */
import { getLesson } from "@/content/learn";
import { CHAPTERS } from "@/content/learn/course";

const KEY = "rusty-learn-done";

export function readDone(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeDone(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: progress simply isn't kept */
  }
}

/**
 * Whether a chapter counts as read: its own id is marked, or, for a chapter
 * covered by a section of another lesson, that lesson is marked.
 */
export function isChapterRead(id: string, done: string[]): boolean {
  if (done.includes(id)) return true;
  const within = CHAPTERS.find((c) => c.id === id)?.within;
  const host = within ? getLesson(within.split("#")[0])?.id : undefined;
  return !!host && done.includes(host);
}
