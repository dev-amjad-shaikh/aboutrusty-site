/** Releases — the platform timeline, transcribed from the design. */
const RELEASES: { tag: string; ver: string; date: string; name: string; body: string }[] = [
  { tag: "main", ver: "Unreleased", date: "", name: "On main", body: "Connectors, skills, knowledge sources, goals, the verifier suite, campaigns, and Studio v4. MSRV raised to Rust 1.87." },
  { tag: "R0.12", ver: "v0.13.0", date: "Aug 11, 2026", name: "Operations Plane", body: "Run artifacts with versions, previews, and retention. Deployment revisions, environments, and environment secrets. Release gates, canary and shadow deployments, and a health endpoint." },
  { tag: "R0.11", ver: "v0.12.0", date: "Aug 10, 2026", name: "Extension Plane", body: "Registry for prompts and configuration with per-environment promotion and rollback. Credential broker: tools receive short-lived handles instead of raw credentials. OAuth flows and middleware composition." },
  { tag: "R0.10", ver: "v0.11.0", date: "Aug 9, 2026", name: "Adaptation", body: "Learned retry and timeout policies, evaluated in a deterministic runtime twin before promotion. static-v0 remains the default policy. Drift endpoint at GET /policy/drift." },
  { tag: "R0.9", ver: "v0.10.0", date: "Aug 9, 2026", name: "Capsules", body: "Capsules for untrusted code with declared capabilities and resource budgets. Cedar authorization. Signed run receipts. MCP and A2A in both directions." },
  { tag: "R0.8", ver: "v0.9.0", date: "Aug 9, 2026", name: "Rusty Learn", body: "Scoped memory records, human corrections, candidates, promotion with approvals, and rollback. Executor policy registry. rusty-eval added as a server dependency." },
  { tag: "R0.7", ver: "v0.8.0", date: "Aug 8, 2026", name: "Agent Fabric", body: "Durable agents with mailboxes and supervision. Coordination patterns: delegate, fan-out, race, quorum. Effect types enforced at compile time. Delta checkpoints: a 1000-step, 1 MB run shrinks from 1.05 GB to 33 MB on disk." },
  { tag: "R0.6", ver: "v0.7.0", date: "Aug 7, 2026", name: "Durable Work", body: "Durable task queue with leases, retries, and dead-lettering. Cancellation. Transactional outbox and effect receipts. rusty-worker ActivityWorker." },
  { tag: "R0.5", ver: "v0.6.0", date: "Aug 7, 2026", name: "Flight Recorder", body: "Run journal, deterministic clock and RNG, exact replay." },
  { tag: "R0.4", ver: "v0.4.0", date: "Aug 5, 2026", name: "Time Travel", body: "Fork and replay from any checkpoint." },
  { tag: "R0.3", ver: "v0.3.0", date: "Aug 5, 2026", name: "Interop", body: "HTTP server, Python and TypeScript clients." },
];

export function ReleasesPage() {
  return (
    <main className="mx-auto max-w-[960px] px-7">
      <section className="flex flex-col gap-[18px] pb-10 pt-[72px]">
        <h1
          className="m-0 font-light text-[#f7ece4]"
          style={{ fontSize: "clamp(42px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-.03em" }}
        >
          Releases
        </h1>
        <p className="m-0 max-w-[640px] text-[18px] leading-[1.6] text-[#cfc3b8]">
          Release notes for the Rusty platform. Crates are versioned
          independently. Full history in{" "}
          <a href="https://github.com/dev-amjad-shaikh/rusty/blob/main/CHANGELOG.md">
            CHANGELOG.md
          </a>
          .
        </p>
      </section>
      <section className="flex flex-col pb-10">
        {RELEASES.map((r) => (
          <div
            key={r.tag}
            className="grid gap-8 border-t py-[30px] sm:grid-cols-[150px_minmax(0,1fr)]"
            style={{ borderColor: "rgba(236,150,96,.12)" }}
          >
            <div className="flex flex-col gap-1.5 max-sm:flex-row max-sm:gap-3">
              <span
                className="font-code text-[14px]"
                style={{ color: r.tag === "main" ? "#f5b774" : "#f0862b" }}
              >
                {r.tag}
              </span>
              <span className="text-[14px] text-[#a39a91]">{r.ver}</span>
              <span className="text-[14px] text-[#8b837b]">{r.date}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              <h2 className="m-0 text-[26px] font-light tracking-[-0.01em] text-[#f7ece4]">
                {r.name}
              </h2>
              <p className="m-0 text-[16.5px] leading-[1.65] text-[#cfc3b8]" style={{ textWrap: "pretty" }}>
                {r.body}
              </p>
              <a href="/guide/appendix-c-releases.html" className="text-[14.5px]">
                Release history in the guide →
              </a>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
