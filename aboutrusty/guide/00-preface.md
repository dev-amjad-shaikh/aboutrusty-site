---
title: 00 · Preface
prev: false
next:
  text: '01 · The problem: why agents need a runtime'
  link: /01-the-problem
---

<p class="chapter-eyebrow">Part I · Orientation</p>

# Preface

The Rusty repository has a README, a set of design documents under `docs/`, and module documentation in the source. All of it is written for someone who already knows what they are looking for. This book is for the engineer who has heard "durable agent runtime" and wants to know what that means in code before deciding whether to use it.

Chapters build on each other. Concepts come before mechanisms, and mechanisms come before API calls. Where a claim can be checked against the code, the chapter names the file so you can read it yourself.

## What Rusty is, in one page

Rusty is a durable agent runtime written in Rust. You define an agent as a graph of nodes over schema-declared JSON state. The engine runs that graph in transactional super-steps and writes a versioned checkpoint at every step boundary. The same compiled graph runs embedded in your process, behind the included axum HTTP/SSE server as a single static binary, and across remote nodes and sandboxed WASM modules.

Three properties carry the design (they are stated the same way in [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md)):

1. **A run is a graph over shared state, executed in super-steps.** You declare state channels with reducers, and nodes as async functions. Each step, the engine plans the active set, runs it in parallel, merges at a barrier, routes, and checkpoints. The ReAct loop is nodes being re-scheduled across steps, so there is no recursion to overflow.
2. **Durability is built into the loop.** Every super-step ends in a checkpoint. Resuming after a crash, suspending for a human decision that takes a week, and forking from a historical step all use that one mechanism.
3. **The server is the interop layer.** The core crate has no HTTP. The server serves compiled graphs, and zero-dependency Python and TypeScript SDKs and the Studio workspace talk to it. Native bindings (PyO3, napi-rs, a C ABI) were considered and rejected; see the "Explicitly rejected" section of [docs/roadmap.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/roadmap.md).

Rusty is v0.x and under active development, and the README says so in its Status section. Packages version independently. The latest versioned release is **R0.12, Operations Plane** (platform v0.13.0, 2026-08-11). `main` carries one more cycle that has not been versioned yet: connectors, skills, knowledge, goals, and Studio v4. When this book describes something on `main` but not in a release, or something designed but not built, it says so.

The README has a comparison table with LangGraph and LangGraph Platform, including where they are further along. Chapter 01 covers the reasoning behind it.

## Who this book is for

**If you are evaluating Rusty**, read Part I. Chapter 01 frames the problem and Chapter 02 gives you the mental model. That is enough to judge whether the trade-offs fit your product.

**If you are building on Rusty**, read Part I, then Part III front to back, and go to Part II when a mechanism surprises you. The how-to chapters assume you can read Rust. They do not assume you have written much of it.

**If you operate Rusty or contribute to it**, Part II is for you. It walks the codebase file by file and explains why each mechanism exists.

## How the book is organized

Part I orients: the problem, and the five concepts the rest of the platform is built from.

Part II covers concepts and internals. Each chapter starts with the general idea and what other systems do about it, then shows how Rusty implements it, with file paths you can open.

Part III is hands-on: the quickstart, then building an agent, a skill, and a tool, wiring memory, evaluating, observing, and deploying. Each chapter is a walkthrough you can follow at a keyboard.

The appendices hold the glossary, an index into the design documents, the release history, and the roadmap.

## Conventions

File references appear in monospace, such as `rusty-core/src/executor.rs`, and name a real path in the repository at the time of writing. Links to files point at the `main` branch on GitHub.

Releases are named two ways in the repository. The release name (R0.5, R0.8) and the platform version (v0.6, v0.9) are offset by one from R0.5 onward, because v0.5 was an SDK and tenancy cycle without an R-number. The mapping is at the top of [CHANGELOG.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/CHANGELOG.md). This book uses the R-names, because the code and design docs do.

Features are in one of three states, and each is labeled:

- **Released**: in a versioned release.
- **On `main`**: merged and tested, not yet in a versioned release. Code comments on `main` sometimes call this cycle "R0.13".
- **Designed, not built**: a design document describes it and the code does not implement it.

Each chapter ends with a Key takeaways box. If you skim, skim those, then go back to the section a takeaway came from when you need the mechanism.

The book addresses you directly. Where the project made a trade-off, the chapter says what was traded and why.

::: tip Key takeaways
- Rusty is a durable agent runtime in Rust: graphs over shared state, executed in checkpointed super-steps, deployable as one static binary.
- Chapters go from the general problem, to what other systems do, to Rusty's mechanism with real file paths.
- Every feature is labeled as released, on `main`, or designed but not built.
- Part I orients, Part II explains internals, Part III builds.
:::

**Further reading**

- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md): install, the comparison table, known limitations
- [docs/building-agentic-products.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/building-agentic-products.md): the developer guide's orientation
- [docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md) and [docs/stability.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/stability.md): what v0.x promises
