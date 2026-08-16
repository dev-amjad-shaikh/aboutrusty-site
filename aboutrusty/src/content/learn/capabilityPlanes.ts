import type { Article } from "./types";

export const capabilityPlanes: Article = {
  slug: "capability-planes",
  title: "Skills, connectors, and knowledge: the capability planes",
  description:
    "Three governed planes landed on main — skill packages with progressive disclosure, lifecycle-managed connectors, and citable knowledge retrieval — plus the content-addressed capability set that pins one run's exact reach at admission.",
  readingTime: "7 min read",
  kicker: "Concepts",
  blocks: [
    {
      type: "callout",
      variant: "quote",
      text: "Tools and connectors provide action; skills and knowledge provide context; a capability set composes both under policy.",
    },
    {
      type: "paragraph",
      text: "Rusty keeps five concepts distinct where other harnesses collapse them into one generic plugin list (`docs/rusty-capability-harness-design.md`):",
    },
    {
      type: "table",
      head: ["Concept", "What it is"],
      rows: [
        ["Tool", "A typed action the model may call — stable name, JSON input schema, effect class, cancellable execution"],
        ["Connector", "A lifecycle-managed provider of tools; owns health, authentication, discovery, shutdown — grants no authority by itself"],
        ["Skill", "Versioned procedural knowledge — a `SKILL.md` package that alters model context through progressive disclosure; executes nothing, carries no credentials"],
        ["Knowledge source", "Governed facts and documents that retrieval may cite — distinct from procedural skills and from short-term thread memory"],
        ["Capability set", "The immutable, content-addressed composition one agent version declares and one run resolves at admission"],
      ],
      caption:
        "Landed on main 2026-08-15 (`rusty-core` `skill` / `connector` / `knowledge` / `capability` modules, `rusty-server` routes), after R0.12 — not yet in a numbered release.",
    },

    { type: "heading", level: 2, text: "The skill plane" },
    {
      type: "paragraph",
      text: "A skill is a governed `SKILL.md` package — one markdown file with YAML frontmatter (`name` and `description` required) plus optional `references/` and `assets/` members, following the emerging Agent Skills convention. Parsing is **fail-closed**: frontmatter subset, kebab-case name, bounded description and body, package and per-member byte ceilings, and member-path hygiene (relative, `..`-free, symlink-free) are all validated at construction, so an invalid package cannot exist as a value.",
    },
    {
      type: "paragraph",
      text: "The registry exposes **progressive disclosure** in three tiers, so an agent can hold hundreds of skill entries and pay only for what it loads: (1) metadata — name, description, revision, content hash; list and history return metadata projections only, the type has no body field; (2) the body, reached through a resolved version handle; (3) references and assets, enumerated on demand and loaded one member at a time.",
    },
    {
      type: "list",
      items: [
        "**Provenance is mandatory** — every registered version records its source, an author string, and the content hash; a package that cannot name its origin cannot be audited.",
        "**Deterministic local scan** — `scan_package` flags embedded HTML script tags and credentialed (userinfo) URLs as denials and large base64 blobs as warnings; registration fails closed on any denial, and warnings travel with the version's recorded `ScanReport`.",
        "**Immutable, content-addressed versions** — a version's identity is the SHA-256 of the package's canonical serialization. Re-registering identical content is idempotent; changed content under the same name appends a new revision and moves the latest pointer forward — never backward, never in place.",
      ],
    },
    {
      type: "paragraph",
      text: "Server surface: `POST /skills` + `GET /skills` (register, list), `GET /skills/{name}`, `GET /skills/{name}/body`, `GET /skills/{name}/history`, `GET /skills/{name}/versions/{revision}`, `GET /skills/{name}/files/{*path}`. A run that discloses a skill body journals that load — skill name, revision, and content hash — so replay can pin the context the model saw.",
    },

    { type: "heading", level: 2, text: "The connector plane" },
    {
      type: "paragraph",
      text: "A connector is declared as a content-addressed `ConnectorManifest` — the SHA-256 of its canonical serialization **is** the registration key — and instantiated per tenant as a `ConnectorInstance`. Credentials are injected from a `CredentialBroker` seam at creation time; tools hold handles, never raw bytes (the R0.11 broker discipline). Instances are driven through an explicit lifecycle: `pending → connecting → healthy | degraded | failed`, plus `disabled`.",
    },
    {
      type: "paragraph",
      text: "A healthy instance exposes its tools as a derived catalog pinned by `CatalogGeneration`: consumers pin a generation number and content hash, **never “latest”**. All timestamps are logical — every transition takes `now_ms` from the caller — so health sweeps and lifecycle history stay deterministic under replay and test.",
    },
    {
      type: "list",
      items: [
        "**`McpStdioProvider`** — wraps the existing MCP stdio client: spawns the manifest's command with a scrubbed environment (only the declared env allowlist passes through), performs the MCP handshake, and namespaces every discovered tool as `<connector>/<tool>`.",
        "**`HttpSearchProvider`** — the bounded web-search contract: a query in, ranked `SearchHit`s out, byte and count ceilings enforced on both sides, the HTTP exchange behind an `HttpTransport` seam so tests drive a fake. Search is a provider in its own right — never a hidden network call inside a built-in tool.",
      ],
    },
    {
      type: "paragraph",
      text: "Server surface: `POST /connectors/manifests` + `GET /connectors/manifests`, `POST /connectors/instances` + `GET /connectors/instances`, and per-instance `POST /connectors/instances/{id}/connect`, `GET …/catalog`, `POST …/health`, `POST …/disable`, `POST …/enable`, plus `POST /connectors/sweep`.",
    },

    { type: "heading", level: 2, text: "The knowledge plane" },
    {
      type: "paragraph",
      text: "Knowledge reuses the governed-memory vocabulary but answers a different question: memory records what an agent *learned*; knowledge stores what an operator *published* — documents and facts a run may retrieve and **cite**. A `KnowledgeSource` is one governed source version: scoped (the memory scope taxonomy unchanged), attributed (an author/provenance string is mandatory), confidence a writer-declared claim in `(0, 1]`, with a retention policy (TTL or pinned) and a content hash that is the version's identity.",
    },
    {
      type: "list",
      items: [
        "**Deterministic ingestion** — same bytes in, same chunks out: byte-bounded chunks with overlap that never split a Markdown code fence, content-addressed (`sha256` over the normalized bytes), with stable ids (`{source_id}#{index}`).",
        "**Content-addressed storage** — idempotent put/get by hash, a source-version → chunks index, and the reverse chunk → source index citations resolve through; file/Postgres backends sit behind the same store trait on the server.",
        "**Hybrid retrieval with citations** — a BM25-lite lexical rank plus an optional `VectorScorer` behind a trait (no embedding dependencies in core), combined under declared weights; result sets bounded in count and bytes. Retrieval returns `CitedChunk`s, never bare text: every chunk renders a `Citation` (source id, title, chunk id, content address, byte range) so agents attribute what they quote.",
        "**Corrections and supersession** — correcting a source mints a new version (new content hash) that supersedes the old; retrieval never returns superseded chunks, and the old version remains addressable by hash as evidence.",
        "**Retention** — `plan_sweep` reports what a sweep *would* purge (dry-run); `apply_sweep` executes it: chunks and bodies removed, the source id tombstoned so citations in old journals stay resolvable to metadata. Pinned sources are never swept.",
      ],
    },
    {
      type: "paragraph",
      text: "Server surface: `POST /knowledge/sources` + `GET /knowledge/sources`, `POST /knowledge/query`, `POST /knowledge/retention/plan` + `POST /knowledge/retention/apply`, `GET /knowledge/sources/{id}`, `POST /knowledge/sources/{id}/correct`, `GET /knowledge/sources/{id}/chunks/{chunk_id}`. Every clock read is caller-injected, keeping the plane deterministic under replay.",
    },

    { type: "heading", level: 2, text: "Resolved capability sets" },
    {
      type: "paragraph",
      text: "A `CapabilitySet` names exact members — tool names, plus forward-compatible, kind-tagged skill/connector references — and derives its identity from the canonical serialization of those members: the set id is `cs-` followed by the lowercase hex SHA-256, the same digest convention every `RunManifest` pin follows. Two compositions are the same set if and only if they name the same members; the empty set is legitimate — a deliberately tool-free agent.",
    },
    {
      type: "list",
      items: [
        "**Composition** validates every tool member against the graph's executable catalog and fails closed on unknown or duplicate names — a configuration typo can never silently broaden what a run may call.",
        "**Resolution** produces the exact `tool_allowlist` vector the executor consumes; the set id pins into the `RunManifest` alongside the prompt, tool-schema, and model pins.",
        "**Replay guard** re-resolves the pinned set against the current registry: a member the registry no longer contains fails with a typed `RustyError::Replay` instead of silently widening or narrowing the replayed run.",
      ],
    },
    {
      type: "paragraph",
      text: "On the server, a run payload declares `config.tool_allowlist` **or** `config.capability_set` — they are mutually exclusive (declaring both is a 400). Whichever is declared is validated at admission against the graph's catalog, so an unknown or ambiguous selection never reaches a running executor; absent means byte-identical prior behavior, and `[]` is a deliberately tool-free run. When the run declares neither, the assistant version's reviewed tool selection (`config.studio_intent.tools`) supplies the default allowlist — an explicit run-level selection always wins. The run status view reports the admitted selection as `capability_tools`.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Honest scope",
      text: "These planes are on main but not yet in a numbered release — the CHANGELOG runs through R0.12 (2026-08-11); the planes landed 2026-08-15. Skill and connector members ride in capability sets as opaque, kind-tagged references today: the set records them verbatim so the content address already covers them, and validation against their registries arrives with those planes.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Where this sits",
      text: "The planes compose machinery that already exists: the registry is the R0.8 candidate pipeline turned toward human-authored configuration, the broker discipline is R0.11, and the admission-time manifest pins are R0.7. See [Roadmap, versioning, and stability](/learn/roadmap-and-stability) for the release line.",
    },
  ],
};
