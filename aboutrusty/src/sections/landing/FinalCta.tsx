import { Link } from "react-router";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { Reveal } from "./home/primitives";

const LOCAL_SETUP = `git clone https://github.com/dev-amjad-shaikh/rusty.git && cd rusty
./scripts/dev.sh        # local: Rusty Server on :8100 + Rusty Studio on :8000`;

const DOCKER_SETUP = `docker compose up       # the same pair, containerized`;

export function FinalCta() {
  return (
    <section className="mx-auto max-w-[1240px] px-7 py-[90px]">
      <Reveal
        className="overflow-hidden rounded-[14px] border"
        style={{
          borderColor: "rgba(240,134,43,.3)",
          background:
            "linear-gradient(160deg,rgba(240,134,43,.1),rgba(200,110,44,.02))",
        }}
      >
        <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
          <span className="font-code text-[11.5px] uppercase tracking-[0.16em] text-primary">
            Get started
          </span>
          <h2
            className="m-0 mt-5 max-w-3xl font-light text-[#f7ece4]"
            style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: "-.025em" }}
          >
            Build the durable runtime with us.
          </h2>
          <p className="mb-0 mt-5 max-w-xl text-[17px] leading-[1.65] text-[#cfc3b8]">
            No Docker, no database, no Redis required — everything runs in one
            process. Or take the containerized path if you prefer.
          </p>
          <div className="mt-9 grid gap-4 lg:grid-cols-2">
            <CodeBlock code={LOCAL_SETUP} language="bash" title="local" />
            <CodeBlock code={DOCKER_SETUP} language="bash" title="docker" />
          </div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="https://github.com/dev-amjad-shaikh/rusty"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-[9px] bg-primary px-[22px] py-[13px] text-[16px] font-medium text-primary-foreground no-underline transition-colors hover:bg-[#fb9a3f]"
              style={{ boxShadow: "0 10px 30px -10px rgba(240,134,43,.8)" }}
            >
              View on GitHub ↗
            </a>
            <Link
              to="/learn"
              className="inline-flex items-center justify-center rounded-[9px] border px-[22px] py-[13px] text-[16px] text-[#ece0d5] no-underline transition-colors hover:border-[rgba(236,150,96,.5)] hover:text-[#fff3ea]"
              style={{ borderColor: "rgba(236,150,96,.25)" }}
            >
              Learn the architecture
            </Link>
            <Link
              to="/playground"
              className="inline-flex items-center justify-center px-3 py-[13px] text-[15px] text-[#b8b0a8] no-underline transition-colors hover:text-[#fff3ea]"
            >
              or try the Playground first →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
