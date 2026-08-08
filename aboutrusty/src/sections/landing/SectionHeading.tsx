interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

/**
 * Reference-style section intro: mono kicker + huge display headline on the
 * left, muted description on the right (bottom-aligned on large screens).
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="grid items-end gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-24">
      <div>
        <span className="flex items-center gap-2.5 font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-primary" />
          {eyebrow}
        </span>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[0.98] sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </div>
      {description && (
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:mb-1 lg:justify-self-end">
          {description}
        </p>
      )}
    </div>
  );
}
