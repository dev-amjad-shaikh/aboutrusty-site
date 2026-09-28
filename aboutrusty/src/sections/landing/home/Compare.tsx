import { Kicker, Reveal, SectionTitle } from "./primitives";

const COLS = ["Rusty", "LangGraph", "LangGraph Platform", "Rust LLM libraries (rig, langchain-rust)"];

const ROWS: [string, string, string, string, string][] = [
  ["Language", "Rust", "Python (JS port)", "Hosts LangGraph agents", "Rust"],
  ["Saves progress between steps", "Every step: memory, file, or Postgres", "Yes: memory, SQLite, Postgres", "Managed", "No"],
  ["Pause for a person, replay a run", "Yes", "Yes", "Yes", "No"],
  ["How you deploy", "One static binary, or embed as a library", "Your Python app", "Managed service or enterprise self-host", "Library in your app"],
  ["Remote steps and sandboxed code", "HTTP workers, WASM sandbox", "No", "No", "No"],
  ["Server API", "Threads, runs, streaming, assistants, crons, KV, tenants", "No (library)", "Full hosted platform", "No"],
  ["License", "MIT or Apache-2.0", "MIT", "Commercial", "MIT"],
];

/** 07 · How Rusty compares — the README's comparison table, in plain words. */
export function Compare() {
  return (
    <Reveal className="flex flex-col gap-8 border-t border-[rgba(236,150,96,0.10)] py-[90px]">
      <div className="flex max-w-[680px] flex-col gap-[14px]">
        <Kicker>08 · Compare</Kicker>
        <SectionTitle>How Rusty compares</SectionTitle>
        <p className="m-0 text-[17px] leading-[1.7] text-[#cfc3b8]">
          A short comparison with the tools teams usually evaluate alongside
          Rusty.
        </p>
      </div>

      <div
        className="overflow-x-auto rounded-[14px] border"
        style={{ borderColor: "rgba(236,150,96,.16)", background: "rgba(255,236,214,.02)" }}
      >
        <table className="w-full min-w-[820px] border-collapse text-left text-[15px]">
          <thead>
            <tr>
              <th className="w-[200px] p-4" />
              {COLS.map((c, i) => (
                <th
                  key={c}
                  className="p-4 align-bottom text-[15px] font-normal"
                  style={{
                    color: i === 0 ? "#fff3ea" : "#cbb3a2",
                    background: i === 0 ? "rgba(240,134,43,.10)" : undefined,
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, ...cells]) => (
              <tr key={label} className="border-t" style={{ borderColor: "rgba(236,150,96,.10)" }}>
                <th className="p-4 align-top text-[14.5px] font-light text-[#a39a91]">{label}</th>
                {cells.map((c, i) => (
                  <td
                    key={i}
                    className="p-4 align-top leading-[1.5]"
                    style={{
                      color: i === 0 ? "#f7ece4" : c === "No" ? "#8b837b" : "#d8ccc0",
                      background: i === 0 ? "rgba(240,134,43,.06)" : undefined,
                    }}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="m-0 text-[14px] leading-[1.6] text-[#8b837b]">
        As of Sep 26, 2026. "No" means not present or not verified by us.
        Sources and details are in the{" "}
        <a
          href="https://github.com/dev-amjad-shaikh/rusty#how-rusty-compares"
          target="_blank"
          rel="noreferrer"
        >
          README
        </a>
        . If you want the largest Python ecosystem or a fully managed platform
        today, LangGraph and LangGraph Platform are further along.
      </p>
    </Reveal>
  );
}
