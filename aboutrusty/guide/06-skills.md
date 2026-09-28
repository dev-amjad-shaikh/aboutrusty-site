---
title: 06 · Skills
---

<p class="chapter-eyebrow">Part II · Concepts and internals · Chapter 06</p>

# Skills

Tools give an agent action; skills give it judgment. A tool answers "what can you do"; a skill answers "how do we do invoices here" — the procedure, the pitfalls, the order of operations, written down once and reused by every agent that needs it. In the capability-harness vocabulary the project uses internally: tools provide the action surface, skills and knowledge provide context. A skill carries neither executable authority nor credentials. It is versioned procedural knowledge, and that distinction drives everything in this chapter.

One status note up front, because the book's rule is to say it: the skill plane described here ships on `main` as part of the post-R0.12 product cycle — the crates are still 0.12.x until the next versioned release.

## The concept: procedural knowledge as a package

The emerging industry convention — the Agent Skills format — is pleasantly boring: one `SKILL.md` file with YAML frontmatter (`name` and `description` required) plus a markdown body, with optional `references/` and `assets/` directories beside it. The clever part is not the format but the loading discipline, usually called **progressive disclosure**: an agent facing hundreds of available skills cannot hold hundreds of procedures in context, so the catalog exposes tiers. The agent reads names and descriptions first, loads a full body only when a skill looks relevant, and pulls reference files one at a time, on demand. Context is the scarcest resource an agent has; progressive disclosure is how you spend it on procedure only when procedure is actually needed.

The hard problems are not the format. They are governance: who published this skill, which version is live, did anyone review it, does it smuggle in a script tag or a credentialed URL, and when a run used it, can you prove afterward exactly which bytes the model saw? A folder of markdown files answers none of those. That's the runtime's job.

## Rusty: the package registry

`rusty-core/src/skill.rs` is the package plane — parsing, disclosure tiers, provenance, scanning, versioning — and its invariants are enforced at construction, not by convention downstream:

- **Fail-closed parsing.** `SkillPackage` validates when it's built: frontmatter present and in the supported subset, kebab-case name, bounded description and body, package and per-member byte ceilings, and member-path hygiene (relative paths, no `..`, no symlinks). An invalid package cannot exist as a value, so nothing downstream ever re-checks it.
- **Provenance is mandatory.** Every registered version records its `SkillSource`, an author string, and the content hash. A package that cannot name its origin cannot be audited, so it cannot be registered.
- **Deterministic local scan.** `scan_package` flags embedded HTML script tags and credentialed (userinfo) URLs as denials, and large base64 blobs as warnings. Registration fails closed on any denial; warnings travel with the version in its recorded `ScanReport`.
- **Immutable, content-addressed versions.** A version's identity is the SHA-256 of the package's canonical serialization. Re-registering identical content is idempotent; changed content under the same name appends a new revision and moves the latest pointer forward — never backward, never in place.

Progressive disclosure is typed into the API, not just documented. `SkillMetadata` — the listing type — *has no body field*, so a catalog listing cannot pull bodies along by accident. Bodies come through `SkillVersion::body` once a handle is resolved; references and assets are enumerated on demand and loaded one member at a time. An agent can hold hundreds of entries and pay only for what it loads.

## Rusty: selection and activation

The run-integration plane, `rusty-core/src/skills.rs`, decides which skills a run actually gets. Four mechanisms, each deliberately boring:

**Bindings.** A `SkillBinding` is the run-facing half of a skill: trigger tags matched structurally against the task, a task-shape note, a cost class — and the *enforceable* tool set. The frontmatter's advisory `allowed-tools` becomes a declared set that narrows what a call may reach while the skill is active.

**Shortlisting without embeddings.** `select_skills` scores tier-1 catalog entries by trigger-tag overlap with the task, gates by declared tool availability, and returns a deterministic top-k plus the full ranking and the exclusions. No vector search, consistent with the memory plane's deferral — structural matching you can explain and replay.

**Promotion decides activation, not recency.** The learn plane's `VersionPointer` over the surface `skill:{name}` is the active authority for which *revision* binds. The registry's latest pointer is authorship history and is never consulted for activation. A skill with nothing promoted does not bind at all — there is no silent latest-pointer fallback. This is Chapter 05's governance reaching into context assembly: what would be "the newest file in the folder" in a framework is, here, a promoted candidate with evidence behind it.

**The gate tool.** While a skill is active, `SkillGateTool` wraps tool calls and refuses any call outside the active skills' declared tool union, returning a structured `ERROR:` payload as the tool result. Two properties matter: a skill can only *narrow* the run's tools, never widen them; and the refusal journals as an ordinary tool call — evidenced, attributable, replayable — instead of vanishing into a log.

## Evidence, and distillation

When a run assembles skills into context, the section manifest pins every assembled skill as `name@revision:hash`, and the bodies ride inside the journaled model-call input. The prompt the model saw is reconstructable, including which exact skill revision shaped it — the same auditability discipline Chapter 04's memory assembly follows. A dedicated `SkillLoaded` journal event is designed but deliberately deferred; the current carriers already pin the identity.

And because a skill is content-addressed procedural knowledge, it is a first-class learning candidate: the learn plane's `CandidateContent::Skill` carries name, content hash, and binding, so a distilled skill — one produced from recorded trajectories rather than written by hand — travels the same candidate → evaluate → promote → rollback pipeline as a prompt change. Distillation itself is application code (Chapter 05's distiller); the runtime's job is that a distilled skill cannot bypass governance just because a model wrote it.

::: tip Key takeaways
- A skill is versioned procedural knowledge — context, not authority: no credentials, no executable power of its own.
- Packages parse fail-closed, carry mandatory provenance, pass a deterministic security scan, and version immutably under content addresses.
- Progressive disclosure is typed: listings cannot accidentally pull bodies.
- Activation is governed: promotion pointers decide which revision binds, and the active skill set can only narrow the tool surface.
- Skills are learning candidates; a distilled skill walks the same promotion pipeline as anything else that changes behavior.
:::

**Further reading**

- [rusty-core/src/skill.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/skill.rs) — the package registry's module docs, with the governance invariants
- [rusty-core/src/skills.rs](https://github.com/dev-amjad-shaikh/rusty/blob/main/rusty-core/src/skills.rs) — selection, activation, and the gate tool
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — building a skill in Studio, step by step
- [docs/rusty-capability-harness-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/rusty-capability-harness-design.md) — the tools-action / skills-context vocabulary
