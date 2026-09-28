# Inside Rusty — working progress

This file is the thread's memory. Read it first on every run; update it last.

## Status (updated 2026-09-27, run 2)

**THE BOOK IS COMPLETE.** All 23 chapters + 4 appendices + landing page shipped; `npx vitepress build .` passes clean with zero dead links.

**Chapters shipped:**

- `index.md` — landing; `00-preface.md`, `01-the-problem.md`, `02-mental-model.md` (Part I)
- `03-journals.md` … `14-studio.md` (Part II, 12 chapters)
- `15-quickstart.md` … `22-deploy-operate.md` (Part III, 8 chapters)
- `appendix-a-glossary.md`, `appendix-b-design-docs.md`, `appendix-c-releases.md`, `appendix-d-roadmap.md`

**Commits (main, newest first):** 23c4048 appendices · a2460bc ch 19-22 · 5d58038 build fixes · 447e2f4 ch 15-18 · 55ef4e6 ch 12-14 · 3ecc4c8 ch 09-11 · cef4a44 ch 06-08 · 4ea299f ch 03-05 · b7023b2 progress · a89ddf8 scaffold + Part I

## If a future run revisits

Possible follow-ups, none committed to: cover pages for the adaptation (R0.10) and extension (R0.11) planes as full Part II chapters; knowledge plane, goals, verifier, and campaigns chapters once that cycle reaches a versioned release; screenshots from `docs/screenshots/` embedded in Part III; wire the deploy to aboutrusty.com.

## Conventions (do not re-derive)

- Only `guide/` paths are written or committed. Commit author: dev-amjad-shaikh <dev-amjad-shaikh@users.noreply.github.com>. Messages follow repo git-log style; never mention AI/tooling.
- Sidebar only lists files that exist; internal links are relative `.md` links; repo citations use absolute GitHub URLs.
- Build gate before every commit: `cd guide && npx vitepress build .` must print "build complete" with no dead-link errors — never chain a commit behind an unchecked build (a broken config was committed once and fixed in a follow-up; don't repeat that).
- Tell-grep before commit: `grep -rniE "delve|fast-paced|important to note|unlock|seamless|leverage|in conclusion" --include="*.md"` — watch hyphenated false positives like "highest-leverage" too.
- Voice: first person plural / direct second person; em dashes sparingly; every chapter ends with `::: tip Key takeaways` and a Further reading list; "designed, not yet shipped" stated explicitly.
- mermaid needs vitepress-plugin-mermaid v2 (v1 pins mermaid ^8/^9). Bare localhost URLs get linkified and fail the dead-link check — wrap them in backticks.
