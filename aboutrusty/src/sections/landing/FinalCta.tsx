import { Link } from "react-router";
import { ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/shared/CodeBlock";

const LOCAL_SETUP = `git clone https://github.com/dev-amjad-shaikh/rusty.git && cd rusty
./scripts/dev.sh        # local: Rusty Server on :8100 + Rusty Studio on :8000`;

const DOCKER_SETUP = `docker compose up       # the same pair, containerized`;

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <span className="flex items-center gap-2.5 font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 bg-primary" />
            MIT OR Apache-2.0
          </span>
          <h2 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[0.98] sm:text-5xl lg:text-6xl">
            Build the durable runtime with us.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
            No Docker, no database, no Redis required — everything runs in one
            process. Or take the containerized path if you prefer.
          </p>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <CodeBlock code={LOCAL_SETUP} language="bash" title="local" />
            <CodeBlock code={DOCKER_SETUP} language="bash" title="docker" />
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="gap-2">
              <a
                href="https://github.com/dev-amjad-shaikh/rusty"
                target="_blank"
                rel="noreferrer"
              >
                <Github size={16} />
                View on GitHub
                <span aria-hidden="true">↗</span>
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/learn">
                Learn the architecture
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/playground">or try the Playground first →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
