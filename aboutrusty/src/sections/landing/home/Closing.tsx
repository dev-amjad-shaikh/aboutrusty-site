import { Link } from "react-router";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { Kicker, Reveal, SectionTitle } from "./primitives";

const REPO = "https://github.com/dev-amjad-shaikh/rusty";
const HAIRLINE = "rgba(236,150,96,.14)";

const card = {
  borderColor: HAIRLINE,
  background: "rgba(255,236,214,.03)",
};

const RESEARCH: { t: string; d: string }[] = [
  {
    t: "Learning without silent rewrites",
    d: "A human correction becomes a candidate change and a new test case. It reaches production only after replay and evaluation, and can be rolled back exactly.",
  },
  {
    t: "Logs that are ready for learning",
    d: "Every executor decision is recorded with the options available and the probability of the choice, at the moment it was made.",
  },
  {
    t: "Testing against failures that never happened",
    d: "A deterministic twin re-runs recorded work under injected crashes, timeouts, and rate limits to compare policies.",
  },
  {
    t: "Receipts that include what was refused",
    d: "A signed run receipt covers the actions a run was denied, not only the ones it performed.",
  },
];

/** 09 · Research — four problems the runtime handles, linking to the full page. */
export function ResearchTeaser() {
  return (
    <Reveal className="flex flex-col gap-10 border-t border-[rgba(236,150,96,0.10)] py-[90px]">
      <div className="flex max-w-[680px] flex-col gap-[14px]">
        <Kicker>09 · Research</Kicker>
        <SectionTitle>Built on research, tested as code</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          Rusty takes ideas from distributed systems, agent memory research,
          and off-policy learning, and turns each one into a runtime mechanism
          with a test that proves it. A few problems Rusty handles that agent
          frameworks usually leave to the application:
        </p>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))" }}
      >
        {RESEARCH.map((r, i) => (
          <div
            key={r.t}
            className="flex flex-col gap-3 rounded-[14px] border p-6 transition-colors hover:border-[rgba(240,134,43,.4)]"
            style={card}
          >
            <span className="font-code text-[12.5px] text-[#f0862b]">0{i + 1}</span>
            <span className="text-[18px] font-normal leading-[1.3] text-[#f7ece4]">{r.t}</span>
            <span className="text-[15.5px] leading-[1.6] text-[#b8b0a8]">{r.d}</span>
          </div>
        ))}
      </div>
      <Link to="/research" className="self-start text-[15.5px]">
        Read about the research →
      </Link>
    </Reveal>
  );
}

const NEXT: { t: string; d: string }[] = [
  { t: "Connectors", d: "Connect any REST API with one JSON Schema file." },
  { t: "Skills", d: "Package reusable procedures as SKILL.md files." },
  { t: "Knowledge", d: "Add documents and get answers with citations." },
  { t: "Goals", d: "Give agents objectives that persist across runs." },
  { t: "Studio v4", d: "A new workspace for agents, connectors, skills, knowledge, and operations." },
];

/** 10 · What's new — the latest release and what is already on main. */
export function WhatsNew() {
  return (
    <Reveal className="flex flex-col gap-10 border-t border-[rgba(236,150,96,0.10)] py-[90px]">
      <div className="flex flex-col gap-[14px]">
        <Kicker>10 · What's new</Kicker>
        <SectionTitle>What's new</SectionTitle>
      </div>
      <div
        className="grid items-start gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))" }}
      >
        <div
          className="flex flex-col gap-4 rounded-[16px] border p-7"
          style={{
            borderColor: "rgba(240,134,43,.35)",
            background: "linear-gradient(160deg,rgba(240,134,43,.10),rgba(200,110,44,.02))",
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#f0862b] px-[9px] py-[2px] font-code text-[11.5px] font-medium text-[#2a1000]">
              R0.12
            </span>
            <span className="font-code text-[12.5px] text-[#a39a91]">v0.13.0 · Aug 11, 2026</span>
          </div>
          <span className="text-[26px] font-light text-[#f7ece4]">Operations Plane</span>
          <p className="m-0 text-[16.5px] leading-[1.7] text-[#d8ccc0]">
            Ship agents like any other service. Each deployment is an immutable
            revision. Promote it from dev to staging to prod, try it on a share
            of traffic first, and roll back to the previous version in one
            step. Files a run produces are stored with a link back to the run
            that made them.
          </p>
          <div className="flex flex-wrap gap-5 pt-1 text-[15px]">
            <Link to="/releases">Release notes →</Link>
            <Link to="/learn#part-9">Learn part 9 →</Link>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="pb-2 font-code text-[11.5px] uppercase tracking-[0.16em] text-[#cbb3a2]">
            Coming next · on main
          </span>
          {NEXT.map((n) => (
            <div
              key={n.t}
              className="flex flex-col gap-1 border-t py-[14px]"
              style={{ borderColor: "rgba(236,150,96,.10)" }}
            >
              <span className="text-[17px] font-normal text-[#f7ece4]">{n.t}</span>
              <span className="text-[15.5px] leading-[1.55] text-[#b8b0a8]">{n.d}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/** 11 · Proof — the recorded crash-and-resume demo from the repo. */
export function Proof() {
  return (
    <Reveal
      className="grid items-center gap-12 border-t border-[rgba(236,150,96,0.10)] py-[90px]"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))" }}
    >
      <div className="flex flex-col gap-[18px]">
        <Kicker>11 · Proof</Kicker>
        <SectionTitle>Tested with a real crash</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          A run finishes two stages and pauses for a decision. The server is
          killed with <code className="font-code text-[15px] text-[#ffc7a6]">kill -9</code>.
          A new process starts against the same store, the finished work is
          still there, and the pending decision resumes with one command.
        </p>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          CI checks a harder case on every change. It kills both the server
          and a worker in the middle of a side effect, restarts them, and
          checks that the work finishes and the external effect happened
          exactly once.
        </p>
        <div className="flex flex-wrap gap-5 text-[15px]">
          <a href={`${REPO}/blob/main/rusty-server/tests/crash_recovery.rs`} target="_blank" rel="noreferrer">
            See the test ↗
          </a>
          <Link to="/docs?p=local">Try it yourself →</Link>
        </div>
      </div>
      <figure className="m-0 flex flex-col gap-3">
        <div
          className="overflow-hidden rounded-[14px] border"
          style={{ borderColor: "rgba(236,150,96,.22)", boxShadow: "0 40px 90px -30px rgba(0,0,0,.9)" }}
        >
          <img
            src="/assets/crash-resume.gif"
            alt="A run pauses mid-decision, the server is killed with SIGKILL, and a new process resumes it from the checkpoint"
            loading="lazy"
            className="block w-full"
          />
        </div>
        <figcaption className="text-[13.5px] text-[#8b837b]">
          Recorded from the demo server, with the stage delay shortened.
        </figcaption>
      </figure>
    </Reveal>
  );
}

const LIMITS = [
  "The server runs on one machine. There is no clustering or failover yet.",
  "If a step is interrupted, it runs again from the start, so steps should be safe to repeat.",
  "Server storage defaults to JSON files on local disk. Postgres needs the postgres feature, and neither backend replicates.",
];

/** 12 · Get started — the two-minute path, plus honest project status. */
export function GetStarted() {
  return (
    <Reveal
      className="grid items-start gap-12 border-t border-[rgba(236,150,96,0.10)] pb-[60px] pt-[90px]"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))" }}
    >
      <div className="flex min-w-0 flex-col gap-[18px]">
        <Kicker>12 · Get started</Kicker>
        <SectionTitle>Try it in two minutes</SectionTitle>
        <CodeBlock
          language="bash"
          title="terminal"
          code={`git clone https://github.com/dev-amjad-shaikh/rusty.git
cd rusty
./scripts/dev.sh`}
        />
        <p className="m-0 text-[16.5px] leading-[1.7] text-[#cfc3b8]">
          Open <code className="font-code text-[14.5px] text-[#ffc7a6]">http://localhost:4400</code> to
          use Studio. The first start creates an administrator and saves its
          password to{" "}
          <code className="font-code text-[14.5px] text-[#ffc7a6]">data/server-demo-checkpoints/bootstrap-admin.txt</code>.
          The demo agent runs on a local test model, so you don't need an API
          key. Add your own model in{" "}
          <code className="font-code text-[14.5px] text-[#ffc7a6]">.env.rusty-local</code> when
          you're ready.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/docs"
            className="rounded-[9px] bg-[#f0862b] px-[22px] py-[13px] text-[16px] font-medium text-[#2a1000] hover:bg-[#fb9a3f] hover:text-[#2a1000]"
            style={{ boxShadow: "0 10px 30px -10px rgba(240,134,43,.8)" }}
          >
            Read the docs
          </Link>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="rounded-[9px] border px-[22px] py-[13px] text-[16px] text-[#ece0d5] hover:border-[rgba(236,150,96,.5)] hover:text-[#fff3ea]"
            style={{ borderColor: "rgba(236,150,96,.25)" }}
          >
            View on GitHub
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[16px] border p-7" style={card}>
        <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-[#cbb3a2]">
          Project status
        </span>
        <p className="m-0 text-[16.5px] leading-[1.7] text-[#d8ccc0]">
          Rusty is at v0.x and under active development. All seven packages
          are published on crates.io, npm, and PyPI. Known limits today:
        </p>
        <div className="flex flex-col">
          {LIMITS.map((l) => (
            <div
              key={l}
              className="flex gap-3 border-t py-3"
              style={{ borderColor: "rgba(236,150,96,.10)" }}
            >
              <span className="text-[#f5b774]">•</span>
              <span className="text-[15.5px] leading-[1.55] text-[#cfc3b8]">{l}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-5 pt-1 text-[15px]">
          <a href={`${REPO}/blob/main/docs/roadmap.md`} target="_blank" rel="noreferrer">
            Roadmap ↗
          </a>
          <a href={`${REPO}/blob/main/docs/stability.md`} target="_blank" rel="noreferrer">
            Stability policy ↗
          </a>
        </div>
      </div>
    </Reveal>
  );
}
