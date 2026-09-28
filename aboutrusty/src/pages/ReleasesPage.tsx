import { Link } from "react-router";
import { CHANGELOG_URL, RELEASES, REPO } from "@/content/releases";
import { lessonHref } from "@/content/lessonLinks";
import { ReleaseTimeline, releaseAnchor } from "@/components/diagrams/research/ReleaseTimeline";

/** Releases — the platform timeline, written from CHANGELOG.md. */
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
          <a href={CHANGELOG_URL} target="_blank" rel="noreferrer" className="text-primary no-underline transition-colors hover:text-[#fb9a3f]">
            CHANGELOG.md
          </a>
          .
        </p>
        <div
          className="mt-4 rounded-[14px] border px-3 pb-4 pt-5 sm:px-6"
          style={{ borderColor: "rgba(236,150,96,.14)", background: "rgba(255,236,214,.02)" }}
        >
          <ReleaseTimeline releases={RELEASES} />
        </div>
      </section>

      <section className="relative flex flex-col pb-20">
        <div
          aria-hidden="true"
          className="absolute bottom-20 left-[5px] top-0 w-px"
          style={{ background: "linear-gradient(180deg,rgba(245,183,116,.45),rgba(240,134,43,.4) 20%,rgba(236,150,96,.12))" }}
        />
        {RELEASES.map((r) => (
          <article
            key={r.tag}
            id={releaseAnchor(r.tag)}
            className="relative ml-7 grid scroll-mt-24 gap-3 border-t py-[30px] sm:ml-9 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-8"
            style={{ borderColor: "rgba(236,150,96,.12)" }}
          >
            <span
              aria-hidden="true"
              className="absolute left-[-28px] top-[36px] h-[11px] w-[11px] rounded-full sm:left-[-36px]"
              style={
                r.tag === "main"
                  ? { border: "1px solid #f5b774", background: "#070506" }
                  : { background: "#f0862b", boxShadow: "0 0 10px rgba(240,134,43,.4)" }
              }
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 sm:flex-col sm:flex-nowrap">
              <span
                className="font-code text-[14px]"
                style={{ color: r.tag === "main" ? "#f5b774" : "#f0862b" }}
              >
                {r.tag}
              </span>
              <span className="text-[14px] text-[#a39a91]">{r.version}</span>
              {r.date && <span className="text-[14px] text-[#8b837b]">{r.date}</span>}
            </div>
            <div className="flex min-w-0 flex-col gap-2.5">
              <h2 className="m-0 text-[26px] font-light tracking-[-0.01em] text-[#f7ece4]">
                {r.name}
              </h2>
              <p
                className="m-0 text-[16.5px] leading-[1.65] text-[#cfc3b8]"
                style={{ textWrap: "pretty" }}
              >
                {r.body}
              </p>
              {r.proof && (
                <p className="m-0 text-[14px] leading-[1.6] text-[#a39a91]">
                  Release proof:{" "}
                  <a
                    href={`${REPO}/blob/main/${r.proof}`}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all font-code text-[13px] text-primary no-underline transition-colors hover:text-[#fb9a3f]"
                  >
                    {r.proof}
                  </a>
                </p>
              )}
              {r.lessons.length > 0 && (
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14.5px] text-[#a39a91]">
                  <span>Learn</span>
                  {r.lessons.map((id) => (
                    <Link key={id} to={lessonHref(id)} className="font-code text-[13.5px] text-primary no-underline transition-colors hover:text-[#fb9a3f]">
                      {id}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
