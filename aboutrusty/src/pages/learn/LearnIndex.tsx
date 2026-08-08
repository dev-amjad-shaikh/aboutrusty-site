import { Link } from "react-router";
import { ArrowRight, Clock } from "lucide-react";
import { articles } from "@/content/learn";

export function LearnIndex() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      {/* Editorial hero */}
      <header className="mb-12 sm:mb-16">
        <p className="mb-4 font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Documentation
        </p>
        <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Learn Rusty
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          Five articles that take you from the execution model to a served
          graph, human-in-the-loop, the zero-build debug UI, and the project's
          stability contract. Every command, identifier, and claim is traced to
          the source docs.
        </p>
      </header>

      {/* Article rows */}
      <div className="divide-y divide-border border-y border-border">
        {articles.map((article, i) => (
          <Link
            key={article.slug}
            to={`/learn/${article.slug}`}
            className="group flex gap-5 py-7 transition-colors first:pt-8 last:pb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-8 sm:py-8"
          >
            <span
              aria-hidden
              className="font-display select-none text-4xl font-bold leading-none text-primary/60 transition-colors group-hover:text-primary sm:text-5xl"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              {article.kicker && (
                <span className="mb-2 block font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {article.kicker}
                </span>
              )}
              <span className="flex items-start justify-between gap-4">
                <span className="font-display text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-accent-foreground">
                  {article.title}
                </span>
                <ArrowRight
                  size={18}
                  className="mt-1 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary motion-safe:group-hover:translate-x-1"
                />
              </span>
              <span className="mt-2 block max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-7">
                {article.description}
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 font-code text-[11px] text-muted-foreground">
                <Clock size={12} aria-hidden />
                {article.readingTime}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* Onward pointer */}
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Read in order, or skip ahead — then{" "}
        <Link
          to="/playground"
          className="font-medium text-primary underline-offset-4 transition-colors hover:text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          feel the super-step loop in the Playground
        </Link>
        .
      </p>
    </div>
  );
}
