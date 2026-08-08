import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, ChevronRight, Clock } from "lucide-react";
import { CodeBlock } from "@/components/shared/CodeBlock";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { articles, getAdjacent, getArticle } from "@/content/learn";
import type { ContentBlock } from "@/content/learn/types";

/** Render inline `code`, **bold**, and [link](path) markers inside plain text. */
function renderInline(text: string): ReactNode[] {
  const tokenRe = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  return text.split(tokenRe).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-secondary px-1.5 py-0.5 font-code text-[0.85em] text-accent-foreground"
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(seg);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (href.startsWith("/")) {
        return (
          <Link
            key={i}
            to={href}
            className="text-primary underline-offset-4 transition-colors hover:text-accent-foreground hover:underline"
          >
            {label}
          </Link>
        );
      }
      if (/^https?:\/\//.test(href)) {
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 transition-colors hover:text-accent-foreground hover:underline"
          >
            {label}
          </a>
        );
      }
    }
    return seg;
  });
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 className="mb-4 mt-14 font-display text-3xl font-bold tracking-tight first:mt-0">
          {block.text}
        </h2>
      ) : (
        <h3 className="mb-3 mt-10 font-display text-xl font-bold tracking-tight first:mt-0">
          {block.text}
        </h3>
      );

    case "paragraph":
      return (
        <p className="mb-5 max-w-2xl text-[15px] leading-8 text-foreground/85">
          {renderInline(block.text)}
        </p>
      );

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} className="text-[15px] leading-7 text-foreground/85">
          {renderInline(item)}
        </li>
      ));
      return block.ordered ? (
        <ol className="mb-6 max-w-2xl list-decimal space-y-2.5 pl-6 marker:font-code marker:text-sm marker:text-primary">
          {items}
        </ol>
      ) : (
        <ul className="mb-6 max-w-2xl list-disc space-y-2.5 pl-6 marker:text-primary">
          {items}
        </ul>
      );
    }

    case "code":
      return (
        <div className="mb-6">
          <CodeBlock
            code={block.code}
            language={block.language}
            title={block.title}
          />
        </div>
      );

    case "table":
      return (
        <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-card">
          <Table className="min-w-[480px]">
            {block.caption && (
              <TableCaption className="font-code text-[11px]">
                {block.caption}
              </TableCaption>
            )}
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                {block.head.map((h, i) => (
                  <TableHead
                    key={i}
                    className="h-auto whitespace-normal px-3 py-2.5 font-code text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, i) => (
                <TableRow key={i} className="border-border">
                  {row.map((cell, j) => (
                    <TableCell
                      key={j}
                      className="whitespace-normal px-3 py-2.5 align-top text-sm leading-6 text-foreground/85"
                    >
                      {renderInline(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );

    case "callout": {
      if (block.variant === "quote") {
        return (
          <figure className="mb-6 rounded-lg border-l-2 border-primary bg-accent/30 px-5 py-4">
            {block.title && (
              <p className="mb-1.5 font-code text-[10px] uppercase tracking-[0.14em] text-accent-foreground">
                {block.title}
              </p>
            )}
            <blockquote className="font-display text-[1.05rem] italic leading-relaxed text-accent-foreground">
              {renderInline(block.text)}
            </blockquote>
          </figure>
        );
      }
      const isWarning = block.variant === "warning";
      return (
        <aside
          className={`mb-6 rounded-lg border-l-2 px-5 py-4 ${
            isWarning
              ? "border-warning bg-warning/10"
              : "border-primary bg-accent/30"
          }`}
        >
          {block.title && (
            <p
              className={`mb-1.5 font-code text-[10px] uppercase tracking-[0.14em] ${
                isWarning ? "text-warning" : "text-accent-foreground"
              }`}
            >
              {block.title}
            </p>
          )}
          <p className="text-sm leading-6 text-foreground/85">
            {renderInline(block.text)}
          </p>
        </aside>
      );
    }
  }
}

export function LearnArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = getArticle(slug);

  if (!article) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="mb-4 font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          404 — Missing page
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Article not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          There is no Learn article at this address.
        </p>
        <Link
          to="/learn"
          className="mt-6 inline-flex items-center gap-2 text-primary underline-offset-4 transition-colors hover:text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to Learn
        </Link>
      </div>
    );
  }

  const { prev, next } = getAdjacent(article.slug);
  const articleIndex = articles.findIndex((a) => a.slug === article.slug);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Breadcrumb + position counter */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-1.5 font-code text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
      >
        <Link
          to="/learn"
          className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Learn
        </Link>
        <ChevronRight size={13} aria-hidden className="text-muted-foreground/50" />
        <span className="truncate normal-case tracking-normal text-foreground/70">
          {article.title}
        </span>
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
          {String(articleIndex + 1).padStart(2, "0")} /{" "}
          {String(articles.length).padStart(2, "0")}
        </span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        {article.kicker && (
          <p className="mb-4 font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {article.kicker}
          </p>
        )}
        <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          {article.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {article.description}
        </p>
        <p className="mt-5 inline-flex items-center gap-1.5 font-code text-[11px] text-muted-foreground">
          <Clock size={12} aria-hidden />
          {article.readingTime}
        </p>
      </header>

      <Separator className="mb-10" />

      {/* Content blocks — narrower measure for comfortable reading */}
      <div className="max-w-2xl">
        {article.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>

      {/* End-of-article playground CTA */}
      <section className="mt-14 rounded-xl border border-primary/30 bg-accent/20 p-6 sm:p-8">
        <p className="mb-2 font-code text-[10px] uppercase tracking-[0.14em] text-accent-foreground">
          Hands-on
        </p>
        <p className="font-display text-xl font-bold leading-snug tracking-tight sm:text-2xl">
          {article.playgroundCta ?? "Want to feel this instead of reading it?"}
        </p>
        <Button asChild className="mt-5">
          <Link to="/playground">
            Try it in the Playground
            <ArrowRight size={15} aria-hidden className="ml-1.5" />
          </Link>
        </Button>
      </section>

      {/* Prev / next */}
      <nav
        aria-label="More articles"
        className="mt-14 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            to={`/learn/${prev.slug}`}
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-1.5 font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <ArrowLeft
                size={13}
                aria-hidden
                className="transition-transform motion-safe:group-hover:-translate-x-0.5"
              />
              Previous
            </span>
            <span className="mt-2 block font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent-foreground">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
        {next ? (
          <Link
            to={`/learn/${next.slug}`}
            className="group rounded-lg border border-border bg-card p-4 text-right transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center justify-end gap-1.5 font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Next
              <ArrowRight
                size={13}
                aria-hidden
                className="transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </span>
            <span className="mt-2 block font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent-foreground">
              {next.title}
            </span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}
      </nav>
    </div>
  );
}
