---
title: 22 · Deploy & operate
---

<p class="chapter-eyebrow">Part III · Building with Rusty · Chapter 22</p>

# Deploy & operate

The deploy story fits in one sentence: **one static binary, the checkpointer pointing at Postgres, OTLP spans going wherever your observability stack lives.** That's the whole topology — no Python runtime, no Redis, no orchestration config file. This chapter is everything around that sentence: the production checklist, the day-2 operations, and the deployment control plane for shipping changes safely.

## The production checklist

**Harden the edge.** Set `RUSTY_ENV=production` — the server refuses to boot without authentication, and serves same-origin only unless you explicitly name a cross-origin browser client. Configure tenants with `ServerConfig::with_tenant_key(tenant, key)`; every resource lands under the tenant's id namespace, and cross-tenant probes get 404, never 403 (Chapter 12).

**Move persistence to Postgres.** The `postgres` feature moves checkpoints and the whole platform surface — assistants, crons, KV, tasks, memory — into auto-migrated tables. The JSON-file backend is honest about being dev-scale: one writer process, local disk, no replication. `/info` tells you which backend you're on (`server_store: json_file` or postgres), so the checklist is verifiable, not remembered.

**Wire observability.** `rusty-otel` init with your OTLP endpoint (Chapter 21); the trace tree covers runs, super-steps, nodes, and classified errors.

**Know your shutdown.** `serve` drains on SIGINT/SIGTERM: new runs 503, in-flight runs cancel cooperatively at super-step boundaries and stay resumable, workers settle within grace, and the whole drain is bounded by `ServerConfig::shutdown_grace`. Deploys are not an outage for parked runs — a run interrupted for human approval survives the deploy that happens while the human thinks.

**Back up the store, verify the backup.** `docs/backup.md` and `docs/recovery.md` carry the operational detail; the platform's discipline is content addressing all the way down, so verification means re-walking digests — blob locators and journal heads — rather than trusting file copies. A backup that can't be verified is a hope, not a backup.

## Shipping changes: the deployment control plane

R0.12's operations plane turns "rebuild and restart" into a governed path (`docs/operations-plane-design.md`), applying Chapter 05's version-pointer discipline to deployments themselves:

- **Immutable revisions.** A deployment change is a revision — content-addressed, named, never edited in place.
- **Declared environments.** dev / staging / prod are first-class records; a revision *moves through* them. (R0.11's environment tags were labels pointing at a control plane that didn't exist yet; R0.12 built the plane.)
- **Gates wired to evaluation.** Promotion between environments passes through `rusty-eval` release gates — Chapter 20's `compare()` verdict as a deployment condition, not a CI afterthought.
- **Canary and shadow by seeded draw.** A revision serves a bounded fraction of traffic against the live baseline; the seeded draw means a recorded run reproduces its assignment, so canary evidence replays exactly.
- **Rollback by pointer.** Byte-exact: the previous revision is re-pointed, not rebuilt. Every transition journals into the deployment's evidence chain, so the whole path — gate verdict, canary window, rollback — lands under the run's signed receipt.

The constraint the design bends to, worth repeating in an operations chapter: single-binary self-hosting remains the default. The control plane manages that binary; it never replaces it with a hosted service.

## Run artifacts

Runs produce binary outputs — generated files, images, exports — and R0.12 gives them the same discipline as everything else: content-addressed objects in the blob store, lineage back to the producing effect, permission checks at read, retention policies, and previews. "Which run made this file, and was it the canary's?" is a query. Retention is declared — "delete everything older than thirty days except what a receipt still pins" is the shape of the policy, and what a receipt pins survives.

## The honest limitations, restated for operators

The README keeps this list current; the operational headline items: the **executor is single-node** (remote nodes distribute node work; the super-step loop itself is not clustered and has no failover), **persistence is single-node** (no replication; Postgres is one database), durable-queue autoscaling is an open R1.0 item, and checkpoints happen at step boundaries — your nodes must be idempotent (Chapter 10's contract). R1.0's track — clustered executor, graphs on WASM targets, registry publishing — is directional, not scheduled. Size your deployment for one well-run binary with a good database, because that's what the platform is.

::: tip Key takeaways
- Topology: one static binary, Postgres, OTLP. Nothing else.
- `RUSTY_ENV=production` flips the defaults by refusing to boot unauthenticated; verify the store backend on `/info`.
- Deploys drain gracefully; parked human-approval runs survive them.
- Ship changes as immutable revisions through environments, gated by eval, canaried by seeded draw, rolled back by pointer.
- Single-node executor and persistence are the stated limits; plan capacity accordingly.
:::

**Further reading**

- [docs/operations-plane-design.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/operations-plane-design.md) — revisions, environments, the artifact plane
- [docs/backup.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/backup.md) and [docs/recovery.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/recovery.md) — the operational runbooks
- [docs/stability.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/stability.md) and [docs/versioning.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/versioning.md) — what upgrades promise
- [README.md](https://github.com/dev-amjad-shaikh/rusty/blob/main/README.md) — the current known-limitations list
