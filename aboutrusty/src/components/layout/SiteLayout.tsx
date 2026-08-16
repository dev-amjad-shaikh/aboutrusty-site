import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Github } from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", end: true },
  { to: "/learn", label: "Learn", end: false },
  { to: "/playground", label: "Playground", end: false },
];

/** Torn-paper "R" badge from the exact reference design, with crumb specks. */
export function BrandMark({ size = 34 }: { size?: number }) {
  const scale = size / 34;
  return (
    <span
      aria-hidden="true"
      className="relative flex"
      style={{ width: size, height: size }}
    >
      <span
        className="flex h-full w-full items-center justify-center font-display"
        style={{
          fontWeight: 800,
          fontSize: Math.round(size * 0.735),
          lineHeight: 1,
          color: "#14100e",
          background:
            "linear-gradient(148deg, #FF8049 0%, #FE6B35 44%, #DC5628 78%, #F4763F 100%)",
          clipPath:
            "polygon(11% 0%, 34% 1%, 39% 5%, 52% 2%, 58% 0%, 81% 1%, 88% 7%, 100% 3%, 100% 20%, 91% 28%, 100% 35%, 99% 57%, 93% 64%, 99% 70%, 96% 87%, 87% 100%, 64% 99%, 56% 93%, 47% 100%, 37% 92%, 25% 100%, 9% 99%, 0% 88%, 1% 70%, 7% 64%, 1% 58%, 3% 39%, 0% 32%, 1% 11%)",
        }}
      >
        R
      </span>
      <span
        className="absolute"
        style={{
          bottom: 8 * scale,
          left: -3 * scale,
          width: 2 * scale,
          height: 1.5 * scale,
          background: "#FE6B35",
          opacity: 0.75,
          transform: "rotate(-14deg)",
        }}
      />
      <span
        className="absolute"
        style={{
          bottom: -3 * scale,
          left: 12 * scale,
          width: 1.5 * scale,
          height: 1.5 * scale,
          background: "#DC5628",
          transform: "rotate(9deg)",
        }}
      />
    </span>
  );
}

/**
 * Site-wide shell: fixed blurred header, ambient background chrome, footer.
 * Routed pages render in <Outlet />.
 */
export function SiteLayout() {
  const { pathname } = useLocation();
  // Landing hero paints its own grid + glow + grain via HeroCanvas —
  // suppress the legacy ambient chrome there so the layers don't double up.
  const isLanding = pathname === "/";
  return (
    <div className="flex min-h-screen flex-col">
      {/* Ambient chrome — ink grid + film grain + rust glow (inner pages) */}
      {!isLanding && (
        <>
          <div className="ambient-grid pointer-events-none absolute inset-x-0 top-0 h-[920px]" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-[300px] right-0 h-[min(600px,100vw)] w-[min(600px,100vw)] rounded-full bg-primary opacity-[0.08] blur-[150px]" aria-hidden="true" />
        </>
      )}
      <div className="ambient-noise pointer-events-none fixed inset-0 z-[100]" aria-hidden="true" />

      <header className={isLanding ? "fixed inset-x-0 top-0 z-50" : "sticky top-0 z-50"}>
        <div className="flex items-center justify-between px-6 py-[22px] sm:px-[46px]">
          <Link to="/" className="flex items-center" aria-label="rusty — home">
            <BrandMark />
          </Link>
          <nav className="flex items-center gap-[34px]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `text-[15px] font-medium transition-colors ${
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
              className="text-foreground transition-opacity hover:opacity-70"
            >
              <Github size={20} />
            </a>
            <Link
              to="/playground"
              className="hidden rounded-[10px] bg-foreground px-5 py-[11px] text-[15px] font-medium text-background transition-colors sm:inline-flex"
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
              <li><Link to="/learn/capability-planes" className="transition-colors hover:text-foreground">Capability planes</Link></li>
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
