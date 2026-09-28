---
title: 18 · Build a tool / connector
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 18</p>

# Build a tool / connector

The Tools catalog in Rusty has no hand-written tools — every tool comes from what the server can reach, and the reach is declared. That's the connector standard from Chapter 09 applied as a workflow: you connect a system once, and every operation its manifest names becomes a governed tool any allowed agent can call. This chapter is the hands-on path, including the case where the system you need has no built-in manifest yet.

## Three paths to a tool

**Tools → New tool** offers three, and the third is really a redirect:

1. **From a connection.** Connect a service (below); every operation its manifest names appears in the catalog as a tool, each carrying an effect class — `read_only`, `idempotent`, `compensatable`, `irreversible` — that the admission gate reads before letting a run through.
2. **From an OpenAPI document.** Connectors → **Browse all** → **Custom protocol**, paste a spec; each operation becomes a tool the same way. This is the "system nobody built a manifest for yet" answer — a public REST API with an OpenAPI spec is a connector you can author in minutes.
3. **As a skill — which is not a tool.** A *procedure over* existing tools is procedural knowledge, and the drawer sends you to Skills. Chapter 17. The distinction matters: if you're describing *how* to do something, write a skill; if you're declaring *what can be called*, that's a tool.

Granting a tool to an agent happens in the agent's builder under **Tools**, where each grant also takes a "when" note so the agent knows when to reach for it. Grant deliberately: the tool surface an agent may call is a security boundary (Chapter 12), and narrower is easier to reason about than wider.

## Adding a connector

1. **Browse the library.** Connectors → **Browse all**. Filter by what the system *does*, not by name. Built-in manifests cover the common SaaS systems.
2. **Choose the system** — or **Custom protocol** with an OpenAPI document.
3. **Authenticate.** The dialog shows the auth method the manifest declares: API key, OAuth sign-in, or none. Credentials go into the broker and are issued to tools as short-lived opaque handles — raw values never reach an agent, a prompt, a journal, or a log. If you've read Chapter 09, this is `rusty_secret: true` doing its job: sealed before anything persists, served back as a marker.
4. **Prove it.** The connector's `check` operation — a parameterless read-only GET — runs against the real system before the configuration is stored. "Saved" means "answered": a connection that can't reach its system doesn't get to exist as a stored configuration.
5. **Test against a stand-in (optional, and better than it sounds).** Connectors → **New stand-in** answers a connection's calls from a seeded dataset, so an agent can be exercised end to end — tools, skills, effects — without touching the live system. The stand-in is to connectors what the scripted model is to graphs: deterministic, free, and honest about being a stand-in.

## Authoring a manifest by hand

For a system with no OpenAPI spec, the manifest is one JSON document — and the standard's rules (Chapter 09) are the authoring checklist: constrain every object level (`additionalProperties: false`), declare auth alternatives as a closed `oneOf` with discriminators, mark secrets with `rusty_secret: true`, give every operation an honest effect, use wire names a human would write, set `rusty_order` where form order matters. Leave the `hash` out — the server's registration door validates, canonicalizes, and seals it. If registration refuses your manifest, the refusal names the rule; the standard's failures are designed to be fixable by the person holding the JSON.

## The discipline underneath

Everything you did above composes into the run-time behavior from Part II without further effort. A tool call from a connector operation is journaled with its effect class; egress to the connector's hosts passes the egress policy's resolved-address checks; an irreversible operation waits at the decision gate for an approval token; and under exact replay the call is served from evidence rather than re-executed. You don't wire any of that per connector. Declaring the manifest honestly *is* wiring it.

::: tip Key takeaways
- Tools come from connections, OpenAPI documents, or — if it's a procedure — should be skills instead.
- Credentials are sealed into the broker as opaque handles; the `check` operation proves a connection before it's stored.
- Stand-ins let you exercise agents end to end against seeded data, not live systems.
- Hand-authored manifests follow the standard's rules; leave the hash to the server.
- Effect classes, egress policy, approval gates, and replay come free with an honestly declared manifest.
:::

**Further reading**

- [Chapter 09 · Tools & connectors](./09-tools-connectors.md) — the standard and its rules
- [docs/connector-standard.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/connector-standard.md) — the manifest, field by field
- [docs/how-to.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/how-to.md) — the Studio flows with screenshots
