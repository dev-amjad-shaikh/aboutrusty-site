import { Link, NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/", label: "Product", end: true },
  { to: "/docs", label: "Docs", end: false },
  { to: "/learn", label: "Learn", end: false },
  { to: "/research", label: "Research", end: false },
  { to: "/releases", label: "Releases", end: false },
];

/** The official Rusty mark — torn-paper rust blob with a riveted R cut out. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/rusty-mark.png"
      alt="Rusty"
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

const footerColumns: {
  heading: string;
  links: { label: string; to?: string; href?: string }[];
}[] = [
  {
    heading: "Learn",
    links: [
      { label: "Docs", to: "/docs" },
      { label: "Learn", to: "/learn" },
      { label: "Concepts", to: "/concepts" },
      { label: "Research", to: "/research" },
      { label: "Releases", to: "/releases" },
      { label: "The book", to: "/guide" },
      { label: "Playground", to: "/playground" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "GitHub", href: "https://github.com/dev-amjad-shaikh/rusty" },
      {
        label: "Roadmap",
        href: "https://github.com/dev-amjad-shaikh/rusty/blob/main/docs/roadmap.md",
      },
      {
        label: "Contributing",
        href: "https://github.com/dev-amjad-shaikh/rusty/blob/main/CONTRIBUTING.md",
      },
      {
        label: "Security",
        href: "https://github.com/dev-amjad-shaikh/rusty/blob/main/SECURITY.md",
      },
    ],
  },
  {
    heading: "Packages",
    links: [
      { label: "crates.io", href: "https://crates.io/crates/rusty-agent-runtime" },
      { label: "npm", href: "https://www.npmjs.com/package/@rusty-runtime/client" },
      { label: "PyPI", href: "https://pypi.org/project/rusty-agent-runtime/" },
    ],
  },
];

/**
 * Site-wide shell: sticky blurred header with pill nav, routed pages in
 * <Outlet />, and the reference footer with mono column headers.
 */
export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(13, 9, 7, 0.8)",
          backdropFilter: "blur(18px) saturate(1.2)",
          WebkitBackdropFilter: "blur(18px) saturate(1.2)",
          borderColor: "rgba(236, 150, 96, 0.1)",
        }}
      >
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-[26px] gap-y-1 px-4 py-2.5 sm:px-7 sm:py-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#f7ece4] no-underline"
            aria-label="Rusty — home"
          >
            <BrandMark />
            <span className="text-[19px] font-normal tracking-[-0.01em]">
              Rusty
            </span>
          </Link>
          <nav className="order-last -mx-1 flex w-full gap-0.5 overflow-x-auto md:order-none md:mx-0 md:w-auto [scrollbar-width:none]">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-lg px-3 py-2 text-[14.5px] font-light no-underline transition-colors ${
                    isActive
                      ? "text-[#fff3ea]"
                      : "text-[#c9bdb2] hover:bg-[rgba(236,150,96,0.1)] hover:text-[#fff3ea]"
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { background: "rgba(240, 134, 43, 0.14)" } : {}
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <Link
              to="/releases"
              className="hidden rounded-md border px-[9px] py-[5px] font-code text-[11.5px] text-[#cbb3a2] no-underline transition-colors hover:border-[rgba(240,134,43,0.4)] hover:text-[#ffd0b3] sm:inline-block"
              style={{ borderColor: "rgba(236, 150, 96, 0.18)" }}
            >
              v0.13 · R0.12
            </Link>
            <a
              href="https://github.com/dev-amjad-shaikh/rusty"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3.5 py-2 text-[14px] font-light text-[#ece0d5] no-underline transition-colors hover:border-[rgba(236,150,96,0.45)] hover:bg-[rgba(255,236,214,0.03)]"
              style={{ borderColor: "rgba(236, 150, 96, 0.22)" }}
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="relative flex-1">
        <Outlet />
      </main>

      <footer
        className="mt-12 border-t"
        style={{ borderColor: "rgba(236, 150, 96, 0.12)" }}
      >
        <div className="mx-auto grid max-w-[1240px] gap-8 px-7 pb-8 pt-12 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <BrandMark size={24} />
              <span className="text-[17px] font-normal text-[#f7ece4]">
                Rusty
              </span>
            </div>
            <p className="m-0 max-w-[240px] text-[14px] leading-[1.55] text-[#a39a91]">
              Rusty is open source under MIT or Apache-2.0.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-[9px]">
              <span className="mb-1 font-code text-[10.5px] uppercase tracking-[0.16em] text-[#cbb3a2]">
                {col.heading}
              </span>
              {col.links.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-[14px] text-[#b8b0a8] no-underline transition-colors hover:text-[#fff3ea]"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] text-[#b8b0a8] no-underline transition-colors hover:text-[#fff3ea]"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>
          ))}
        </div>
        <div
          className="border-t py-5 text-center font-code text-[10px] uppercase tracking-[0.14em] text-[#6f675f]"
          style={{ borderColor: "rgba(236, 150, 96, 0.08)" }}
        >
          aboutrusty.com · v0.13 · R0.12 Operations Plane · © 2026 Rusty
          contributors
        </div>
      </footer>
    </div>
  );
}
