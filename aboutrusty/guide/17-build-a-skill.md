---
title: 17 · Build a skill
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 17</p>

# Build a skill

Chapter 06 covered what a skill *is* — versioned procedural knowledge, context rather than authority. This chapter is the craft of writing one well, then getting it governed and attached. The flow runs in Studio against your local server; everything Studio does here, the `skill.rs` registry does under it.

## The anatomy

A skill is a `SKILL.md` package: YAML frontmatter with `name` and `description` required, a markdown body, and optional `references/` and `assets/` beside it. If you remember one thing about authoring, make it this: the **description and "when to use" are the routing contract**, not a summary. The agent reads them to decide whether the skill applies to the task at hand — structural trigger matching, no embeddings. Write the trigger: *"Use when the user asks for a weekly notice, or when a draft needs the notice format."* A skill with a vague description is a skill that never activates, or activates everywhere; both are authoring bugs, not model bugs.

## Building one in Studio

1. **Open the editor.** Skills → **New skill**. (From an agent's builder, the skill list's **Compose a skill** does the same and attaches the result on save.)
2. **Name it.** A plain, kebab-cased name — `weekly-notice`.
3. **Write "When to use it."** The routing contract, per above.
4. **Write the procedure.** Markdown, with headings, lists, and code. Reference tools inline — `` `tool_name` `` — and the editor detects which tools the procedure calls and records them as the skill's allowed tools. This is Chapter 06's `SkillBinding` in its authoring form: the advisory list becomes an enforceable set that can only narrow what the run may call while the skill is active.
5. **Save.** The skill joins the library; attach it to any agent from that agent's **Skills** section.

Two other arrival paths: **Browse library** imports governed packages from the registry, and *From a repository* pulls `SKILL.md` files straight from a git URL — the import report lists what was found, imported, and skipped, with reasons. Skips are the governance layer working: packages parse fail-closed, so a malformed frontmatter or an over-long body is refused with a reason, never silently repaired.

## What governance does to your skill

Saving is not just storage. Registration runs the pipeline from Chapter 06, and it's worth knowing what happens to your markdown:

- **Validation at construction** — frontmatter in the supported subset, name rules, byte ceilings, member-path hygiene. An invalid package cannot exist as a value.
- **Provenance stamping** — source, author, content hash on every version.
- **The security scan** — embedded script tags and credentialed URLs are denials (registration fails closed); large base64 blobs are warnings that travel with the version's `ScanReport`. If your import is skipped, this report is where you look.
- **Immutable versioning** — the version's identity is the SHA-256 of canonical content. Re-saving identical content is idempotent; changed content appends a new revision and moves the latest pointer forward, never backward.

## Activation and iteration

Attaching a skill to an agent doesn't mean every run loads it. At run time the platform shortlists by trigger-tag overlap against the task, gates by tool availability, and binds the revision the **promotion pointer** names — not the latest revision. A brand-new draft of a skill does not silently go live; the learn plane's pointer decides what binds, and there's no silent fallback to "newest." When you revise a skill, the revision is a new candidate walking the same evaluation and promotion path as any behavioral change (Chapter 05) — and a run that used the skill has the exact `name@revision:hash` pinned in its journaled context, so you can always answer which procedure shaped which answer.

::: tip Key takeaways
- The "when to use" text is the routing contract — write the trigger, not the summary.
- Reference tools inline; the editor turns them into the skill's enforceable, narrowing tool set.
- Registration validates, stamps provenance, scans for smuggled content, and versions immutably — import skips come with reasons.
- Activation binds the promoted revision, never silently the latest; revisions iterate through the candidate pipeline.
:::

**Further reading**

- [Chapter 06 · Skills](./06-skills.md) — the internals this chapter leans on
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — the Studio flow with screenshots
- [rusty-core/src/skill.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/skill.rs) — the package format's exact rules
