import { useState, type ReactNode } from "react";
import { DiagramFrame, Toggle } from "../primitives";
import { D } from "../tokens";

/** A grant set reduced to what the widget varies: network hosts (https,
 * GET) and the clock. */
type Grants = { hosts: string[]; clock: boolean };

const HOSTS = ["api.example.com", "files.example.com"];
const NET_IMPORT = "rusty:capsule/net@0.1.0";
const CLOCK_IMPORT = "rusty:capsule/clock@0.1.0";

/** intersect_grants for this shape: common hosts (a network grant with no
 * common host drops out), clock only when both sides grant it. */
function intersect(m: Grants, o: Grants): Grants {
  return { hosts: m.hosts.filter((h) => o.hosts.includes(h)), clock: m.clock && o.clock };
}

function flip(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function GrantList({ g, empty }: { g: Grants; empty: string }) {
  const rows: string[] = [];
  if (g.hosts.length) rows.push(`network { hosts: [${g.hosts.join(", ")}], protocols: [https], methods: [GET] }`);
  if (g.clock) rows.push("clock");
  if (!rows.length) return <span className="font-code text-[12px] text-[#6f675f]">{empty}</span>;
  return (
    <>
      {rows.map((r) => (
        <span key={r} className="break-words font-code text-[12px] text-[#f7ece4]">
          {r}
        </span>
      ))}
    </>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border p-3" style={{ borderColor: "rgba(236,150,96,.16)", background: D.card }}>
      <span className="font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">{title}</span>
      {children}
    </div>
  );
}

type Line = { what: string; verdict: string; tone: "green" | "red" | "amber" | "dim" };
const INK = { green: D.green, red: D.red, amber: D.amber, dim: D.dim };

/** Lesson 10.1 interactive: manifest grants ∩ tenant overlay = effective
 * grants, then the host's structural gate over the guest's imports and the
 * scoped check on each fetch. */
export function CapsuleGrants() {
  const [manifest, setManifest] = useState<Grants>({ hosts: ["api.example.com"], clock: false });
  const [overlayOn, setOverlayOn] = useState(false);
  const [overlay, setOverlay] = useState<Grants>({ hosts: ["api.example.com", "files.example.com"], clock: true });
  const [importsClock, setImportsClock] = useState(false);

  const effective = overlayOn ? intersect(manifest, overlay) : manifest;
  const hasNet = effective.hosts.length > 0;
  const imports = [NET_IMPORT, ...(importsClock ? [CLOCK_IMPORT] : [])];
  const missing = imports.filter((i) => (i === NET_IMPORT ? !hasNet : !effective.clock));

  const importLines: Line[] = imports.map((i) => {
    const kind = i === NET_IMPORT ? "Network" : "Clock";
    const ok = !missing.includes(i);
    return {
      what: i,
      verdict: ok ? "linked" : `no ${kind} grant: never linked`,
      tone: ok ? "green" : "red",
    };
  });

  const refused = missing.length > 0;
  const callLines: Line[] = HOSTS.map((h) => {
    const what = `fetch("https", "${h}", "GET")`;
    if (refused) return { what, verdict: "never runs", tone: "dim" };
    return effective.hosts.includes(h)
      ? { what, verdict: "executes through the connector", tone: "green" }
      : { what, verdict: `CapsuleDenied: absent grant network → ${h}`, tone: "amber" };
  });

  const caption = refused
    ? {
        title: "Structural denial: the invocation is refused before instantiation",
        text: `The component imports ${missing.join(" and ")}, and the effective grants have no grant of that kind. The host walks the import list first, journals a CapsuleDenied with an empty-scope absent grant, and returns an error. No guest code runs.`,
      }
    : callLines.some((l) => l.tone === "amber")
      ? {
          title: "Linked, then scoped",
          text: "Every import has a grant, so the component instantiates. The fetch import matches host, protocol, and method against the grants before any socket opens. A call outside the grant is refused in-band and journaled naming the host that was missing.",
        }
      : {
          title: "Every call is inside the grants",
          text: "Each fetch executes through the host-side connector and is journaled as a CapsuleCall. Toggle a manifest host off, or turn the overlay on and narrow it.",
        };

  return (
    <DiagramFrame label="Capsule grants · manifest ∩ overlay → imports" caption={caption} captionTone={refused ? "bad" : "plain"}>
      <div className="grid gap-3 md:grid-cols-3">
        <Panel title="Manifest grants">
          <div className="flex flex-wrap gap-1.5">
            {HOSTS.map((h) => (
              <Toggle key={h} on={manifest.hosts.includes(h)} onClick={() => setManifest({ ...manifest, hosts: flip(manifest.hosts, h) })}>
                net {h}
              </Toggle>
            ))}
            <Toggle on={manifest.clock} onClick={() => setManifest({ ...manifest, clock: !manifest.clock })}>
              clock
            </Toggle>
          </div>
        </Panel>
        <Panel title="Tenant overlay">
          <div className="flex flex-wrap gap-1.5">
            <Toggle on={overlayOn} onClick={() => setOverlayOn(!overlayOn)}>
              {overlayOn ? "overlay attached" : "no overlay"}
            </Toggle>
            {overlayOn && (
              <>
                {HOSTS.map((h) => (
                  <Toggle key={h} on={overlay.hosts.includes(h)} onClick={() => setOverlay({ ...overlay, hosts: flip(overlay.hosts, h) })}>
                    net {h}
                  </Toggle>
                ))}
                <Toggle on={overlay.clock} onClick={() => setOverlay({ ...overlay, clock: !overlay.clock })}>
                  clock
                </Toggle>
              </>
            )}
          </div>
        </Panel>
        <Panel title="Guest component imports">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-lg border px-3 py-2 font-code text-[12px] text-[#cfc3b8]" style={{ borderColor: "rgba(236,150,96,.2)" }}>
              net (always)
            </span>
            <Toggle on={importsClock} onClick={() => setImportsClock(!importsClock)}>
              clock
            </Toggle>
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Panel title={overlayOn ? "Effective grants = manifest ∩ overlay" : "Effective grants = manifest (no overlay)"}>
          <GrantList g={effective} empty="{} (a pure-compute guest)" />
          {overlayOn && (
            <span className="text-[12.5px] leading-[1.5] text-[#8b837b]">
              An overlay host the manifest never granted adds nothing. Intersection can only keep or remove.
            </span>
          )}
        </Panel>
        <Panel title="What the host does">
          {[...importLines, ...callLines].map((l) => (
            <div key={l.what} className="flex flex-col gap-0.5">
              <span className="break-words font-code text-[12px] text-[#f7ece4]">{l.what}</span>
              <span className="font-code text-[11.5px]" style={{ color: INK[l.tone] }}>
                → {l.verdict}
              </span>
            </div>
          ))}
        </Panel>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">
        The intersection is intersect_grants from capsule.rs, reduced to hosts and the clock. The widget links imports from the effective set; see the note under “Overlays only narrow” for where the code computes it.
      </p>
    </DiagramFrame>
  );
}
