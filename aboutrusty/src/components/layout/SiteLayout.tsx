import { Link, NavLink, Outlet } from "react-router";
import { Github } from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/learn", label: "Learn", end: false },
  { to: "/playground", label: "Playground", end: false },
];

/** Rust-in-a-box brand mark from the reference design. */
export function BrandMark({ size = 27 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="rounded-[7px] bg-primary p-[5px] fill-primary-foreground"
    >
      <path d="M7 6h11.5C23.7 6 27 9.1 27 13.7c0 3.2-1.6 5.6-4.2 6.8L27 27h-7l-3.1-5.4H13V27H7V6Zm6 5v5.6h4.8c2 0 3.1-1 3.1-2.8 0-1.8-1.1-2.8-3.1-2.8H13Z" />
    </svg>
  );
}

/**
 * Site-wide shell: fixed blurred header, ambient background chrome, footer.
 * Routed pages render in <Outlet />.
 */
export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Ambient chrome — ink grid + film grain + rust glow */}
      <div className="ambient-grid pointer-events-none absolute inset-x-0 top-0 h-[920px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-[300px] right-0 h-[min(600px,100vw)] w-[min(600px,100vw)] rounded-full bg-primary opacity-[0.08] blur-[150px]" aria-hidden="true" />
      <div className="ambient-noise pointer-events-none fixed inset-0 z-[100]" aria-hidden="true" />

      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-xl font-extrabold tracking-tight">
              rusty
            </span>
            <sup className="-ml-1 -mt-3 font-code text-[9px] font-medium tracking-[0.08em] text-muted-foreground">
              OSS
            </sup>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-2 py-1.5 text-[13px] font-semibold transition-colors sm:px-3 ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <a
              href="https://github.com/dev-amjad-shaikh/rusty"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
              className="ml-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground sm:p-2"
            >
              <Github size={17} />
            </a>
            <Link
              to="/playground"
              className="ml-2 hidden rounded-lg border border-primary-foreground/0 bg-foreground px-3.5 py-2 text-[13px] font-bold text-background transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Try Playground
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        <Outlet />
      </main>

      <footer className="relative border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={24} />
              <span className="font-display text-lg font-extrabold tracking-tight">rusty</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The durable agent runtime built in Rust.
            </p>
          </div>
          <div>
            <h4 className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Docs</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/learn/architecture" className="transition-colors hover:text-foreground">The anatomy of a run</Link></li>
              <li><Link to="/learn/server-quickstart" className="transition-colors hover:text-foreground">Server quickstart</Link></li>
              <li><Link to="/learn/human-in-the-loop" className="transition-colors hover:text-foreground">Interrupts &amp; time travel</Link></li>
              <li><Link to="/learn/studio" className="transition-colors hover:text-foreground">Rusty Studio</Link></li>
              <li><Link to="/learn/roadmap-and-stability" className="transition-colors hover:text-foreground">Roadmap &amp; stability</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Site</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/" className="transition-colors hover:text-foreground">Overview</Link></li>
              <li><Link to="/learn" className="transition-colors hover:text-foreground">Learn</Link></li>
              <li><Link to="/playground" className="transition-colors hover:text-foreground">Playground</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-code text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Project</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="https://github.com/dev-amjad-shaikh/rusty" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                  GitHub repository
                </a>
              </li>
              <li>
                <a href="https://github.com/dev-amjad-shaikh/rusty/issues" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
                  Report an issue
                </a>
              </li>
              <li>License: MIT OR Apache-2.0</li>
              <li>MSRV: Rust 1.86</li>
            </ul>
          </div>
        </div>
        <div className="border-t py-5 text-center font-code text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          aboutrusty.com · v0.x active development · © 2026 rusty contributors
        </div>
      </footer>
    </div>
  );
}
