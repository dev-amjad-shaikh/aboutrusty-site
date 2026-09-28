---
title: 00 · Preface
prev: false
next:
  text: '01 · The problem: why agents need a runtime'
  link: /01-the-problem
---

<p class="chapter-eyebrow">Part I · Orientation</p>

# Preface

This is the book we wished existed when we started explaining Rusty to people. The repository has a README, a stack of design documents, and module documentation in the source — all accurate, all maintained, and all written for someone who already knows what they're looking for. This book is for everyone else: the engineer who heard "durable agent runtime" and wants to know what that actually means before deciding whether to care.

It is a book, not a doc dump. Chapters build on each other. Concepts come before mechanisms, and mechanisms come before API calls. Where a claim can be checked against the code, we cite the file — not as decoration, but so you can go read the real thing and catch us out if the book drifts.

## What Rusty is, in one page

Rusty is a durable agent runtime built in Rust. You define an agent as a graph of nodes over schema-declared JSON state; the engine executes that graph in transactional super-steps and writes a versioned checkpoint at every step boundary. The same compiled graph runs embedded in your process, behind an included axum HTTP/SSE server as a single static binary, and across remote nodes and sandboxed WASM modules.

Three properties carry the weight:

1. **A run is a graph over shared state, executed in super-steps.** You declare state channels with reducers and nodes as async functions; the engine plans, runs the active set in parallel, merges at a barrier, routes, and checkpoints. The ReAct loop is not recursion — it is nodes being re-scheduled across steps.
2. **Durability is a primitive, not a feature.** Every super-step ends in a checkpoint. Resume after a crash, suspend for a human decision that takes a week, fork and replay any historical step — one mechanism serves all three.
3. **The server is the interop layer by design.** The core has no HTTP. The server serves compiled graphs, and zero-dependency Python and TypeScript SDKs — plus the Studio workspace — talk to it. Native bindings were considered and rejected; the wire protocol is the API.

Rusty is v0.x under active development, and we say so on the first page of the README rather than in a footnote. Packages version independently. The latest versioned release as this chapter is written is **R0.12 — Operations Plane** (August 2026); `main` carries one cycle further. Wherever this book describes something designed but not yet shipped, it says exactly that.

If you want the honest comparison with LangGraph and LangGraph Platform — including where they are further along — the README has it, and Chapter 01 covers the reasoning.

## Who this book is for

We wrote it for three readers.

**The evaluator.** You're deciding whether Rusty is the right substrate for a product. Read Part I. Chapter 01 gives you the problem frame, Chapter 02 the mental model, and you'll know within an hour whether the trade-offs fit.

**The builder.** You're going to ship an agent on Rusty. Read Part I, then Part III front to back, dipping into Part II when a mechanism surprises you. The how-to chapters assume you can read Rust but don't assume you've written much of it.

**The operator or contributor.** You run Rusty in production, or you're about to send a pull request. Part II is your part — it reads the codebase with you, file by file, and explains why each mechanism exists, not just what it does.

## How the book is organized

Part I orients: the problem, and the five concepts that make the rest of the platform legible.

Part II is concepts and internals. Each chapter follows the same contract: first the general idea and what the field does about it, then how Rusty implements it — mechanism by mechanism, with file paths you can open. A chapter should teach you something true about agent systems even if you never touch Rusty.

Part III is hands-on: quickstart, then building an agent, a skill, a tool, wiring memory, evaluating, observing, deploying. Every chapter there is a walkthrough you can follow at a keyboard.

Appendices carry the glossary, an index into the design documents, the release history, and a pointer to the roadmap.

## Conventions

File references appear in monospace — `rusty-core/src/executor.rs` — and always name a real path in the repository at the time of writing. If a path is going to rot, we'd rather rot visibly.

Features fall into two states, and we never blur them: **shipped** means it's in the current release with tests behind it; **designed, not yet shipped** means a design document exists and the code doesn't. Rusty's design docs are unusually honest about this distinction, and the book inherits that.

"Key takeaways" boxes close each chapter. If you only skim, skim those — but the chapters are the argument, and the argument is why the takeaways are true.

## A note on voice

This book is written in the first person plural, by the project, because that's what it is. Where we made a trade-off, we say what we traded and why. Where something is unfinished, we say unfinished. The repo's design documents set that register — precise, opinionated, plain — and we've tried to hold it.

::: tip Key takeaways
- Rusty is a durable agent runtime in Rust: graphs over shared state, executed in checkpointed super-steps, deployed as one static binary.
- The book reads concept-first: the general problem, what the field does, then Rusty's mechanism with real file paths.
- "Shipped" and "designed, not yet shipped" are labeled explicitly throughout.
- Part I orients, Part II explains internals, Part III builds. Read in the order that matches why you came.
:::

**Further reading**

- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — the landing page: install, the honest comparison, known limitations
- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md) — the developer-guide orientation layer
- [docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md) and [docs/stability.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/stability.md) — what v0.x promises and doesn't
