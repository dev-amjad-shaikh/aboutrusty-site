import { useMemo, useState } from "react";
import { DiagramFrame, StepControls, Toggle } from "./primitives";
import { D, useDiagramWidth, useStepper } from "./tokens";
import { sha256, toHex } from "./sha256";

const DOMAIN = "rusty/canary-draw/v1";
const REVISION = toHex(sha256("example revision"));
const RUN_IDS = Array.from({ length: 20 }, (_, i) => {
  const h = toHex(sha256(`example run ${i}`));
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
});

/** The draw canary_admits computes: the first eight digest bytes as a
 * big-endian u64, as a fraction of u64::MAX. */
function draw(env: string, runId: string): number {
  const material = [DOMAIN, `deployment:${env}`, REVISION, runId].join("\n");
  const d = sha256(material);
  let v = 0n;
  for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(d[i]);
  return Number(v) / 2 ** 64;
}

/** Canary assignment by seeded draw, computed live with the runtime's formula. */
export function CanaryDraw() {
  const [fraction, setFraction] = useState(0.25);
  const [env, setEnv] = useState<"prod" | "staging">("prod");
  const draws = useMemo(() => RUN_IDS.map((id) => ({ id, d: draw(env, id) })), [env]);
  const canary = draws.filter((x) => x.d < fraction).length;
  const { ref, width } = useDiagramWidth();
  const pad = 14;
  const X = (v: number) => pad + v * (width - pad * 2);
  const height = 96;

  return (
    <DiagramFrame
      label={`Canary draw · surface deployment:${env}`}
      caption={{
        title: `${canary} of ${draws.length} runs go to the canary`,
        text: `A run goes to the canary when its draw is below the fraction (${fraction.toFixed(2)}). Move the slider: runs only ever join the canary as it grows. Switch the environment: the surface is part of the hash, so every draw changes.`,
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2.5 font-code text-[12.5px] text-[#cfc3b8]">
          fraction
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={fraction}
            onChange={(e) => setFraction(Number(e.target.value))}
            className="w-[150px] accent-[#f0862b]"
            aria-label="Canary fraction"
          />
          <span className="w-10 text-[#ffc7a6]">{fraction.toFixed(2)}</span>
        </label>
        <span className="flex-1" />
        <Toggle on={env === "staging"} onClick={() => setEnv(env === "prod" ? "staging" : "prod")}>
          environment: {env}
        </Toggle>
      </div>
      <div ref={ref}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ display: "block", fontFamily: D.mono }} role="img" aria-label={`${canary} of 20 example runs admitted at fraction ${fraction}`}>
          <rect x={pad} y={30} width={Math.max(0, X(fraction) - pad)} height={46} fill="rgba(240,134,43,.08)" style={{ transition: "width .25s" }} />
          <line x1={pad} y1={78} x2={width - pad} y2={78} stroke={D.line} />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={X(t)} y1={78} x2={X(t)} y2={83} stroke={D.line} />
              <text x={X(t)} y={94} fontSize={10} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} fill={D.muted}>
                {t}
              </text>
            </g>
          ))}
          {draws.map((x, i) => {
            const on = x.d < fraction;
            return (
              <circle
                key={x.id}
                cx={X(x.d)}
                cy={40 + (i % 3) * 14}
                r={5}
                fill={on ? D.accent : "#0d0908"}
                stroke={on ? D.accent : D.strong}
                style={{ transition: "cx .4s, fill .25s" }}
              />
            );
          })}
          <line x1={X(fraction)} y1={22} x2={X(fraction)} y2={80} stroke={D.accent} strokeWidth={2} style={{ transition: "x1 .25s, x2 .25s" }} />
          <text
            x={Math.min(Math.max(X(fraction), pad + 40), width - pad - 40)}
            y={15}
            textAnchor="middle"
            fontSize={10.5}
            fill={D.accentSoft}
          >
            draw &lt; {fraction.toFixed(2)}
          </text>
        </svg>
      </div>
      <div className="mt-3 grid gap-1.5 font-code text-[11.5px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))" }}>
        {draws.map((x) => {
          const on = x.d < fraction;
          return (
            <span
              key={x.id}
              className="flex justify-between gap-2 rounded-md border px-2 py-1"
              style={{ borderColor: on ? "rgba(240,134,43,.4)" : "rgba(236,150,96,.12)", color: on ? D.accentSoft : D.muted }}
            >
              <span>{x.id.slice(0, 8)}</span>
              <span>{x.d.toFixed(3)}</span>
            </span>
          );
        })}
      </div>
    </DiagramFrame>
  );
}

type Req = { call: string; effect: string; recorded: boolean };
const LADDER = ["Pure", "ReadOnly", "Idempotent", "Compensatable", "NonIdempotent"];
const BASE: Req[] = [
  { call: "crm.lookup(customer)", effect: "ReadOnly", recorded: true },
  { call: "score(order)", effect: "Pure", recorded: true },
  { call: "payments.charge(order)", effect: "NonIdempotent", recorded: true },
  { call: "email.send_receipt(key)", effect: "Idempotent", recorded: true },
];
const EXTRA: Req = { call: "sms.send(customer)", effect: "NonIdempotent", recorded: false };

/** A shadow run's effect requests passing the shadow admission boundary. */
export function ShadowFilter() {
  const [extra, setExtra] = useState(false);
  const reqs = extra ? [...BASE, EXTRA] : BASE;
  const stepper = useStepper(reqs.length + 1, 1900);
  const { step } = stepper;
  const done = step >= reqs.length;
  const shown = reqs.slice(0, done ? reqs.length : step + 1);
  const outcome = (r: Req) =>
    r.effect === "Pure" || r.effect === "ReadOnly" ? "executed" : r.recorded ? "refused · served recorded outcome" : "refused · nothing recorded";
  const matched = shown.filter((r) => outcome(r).includes("served")).length;
  const unserved = shown.filter((r) => outcome(r).includes("nothing")).length;
  const cur = reqs[Math.min(step, reqs.length - 1)];

  const caption = done
    ? {
        title: `ShadowVerdict: ${matched} matched, ${unserved} unserved`,
        text: unserved
          ? "The candidate asked for an effect the production run never made. That divergence is what the verdict exists to show, and it goes into the gate's evidence."
          : "Every refused effect matched the recording, so the candidate behaved like production on this run.",
      }
    : {
        title: `${cur.call} · ${cur.effect}`,
        text:
          outcome(cur) === "executed"
            ? `${cur.effect} effects are admitted: they don't change the world, so the shadow may run them.`
            : outcome(cur).includes("served")
              ? "Refused. The shadow is served the outcome the source run recorded for the same request, and the refusal is journaled as ShadowEffectRefused."
              : "Refused, and the source run never made this request, so there is nothing to serve. It counts as unserved.",
      };

  return (
    <DiagramFrame
      label="Shadow · the effect boundary"
      caption={caption}
      captionTone={done && unserved ? "bad" : "plain"}
      controls={
        <StepControls stepper={stepper} count={reqs.length + 1}>
          <Toggle
            on={extra}
            onClick={() => {
              setExtra(!extra);
              stepper.setStep(0);
            }}
          >
            Candidate also sends an SMS
          </Toggle>
        </StepControls>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
        <div className="flex flex-col gap-1">
          <span className="mb-1 font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">Effect class</span>
          {LADDER.map((e, i) => {
            const ok = i < 2;
            const on = !done && cur.effect === e;
            return (
              <span
                key={e}
                className="flex items-center justify-between rounded-md border px-2.5 py-1.5 font-code text-[12px]"
                style={{
                  borderColor: on ? D.accent : ok ? "rgba(159,212,168,.35)" : "rgba(240,154,128,.3)",
                  background: on ? "rgba(240,134,43,.12)" : "transparent",
                  color: ok ? D.green : D.red,
                  transition: "all .3s",
                }}
              >
                {e}
                <span className="text-[10.5px]">{ok ? "admit" : "refuse"}</span>
              </span>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="mb-1 font-code text-[10.5px] uppercase tracking-[0.12em] text-[#8b837b]">Candidate requests</span>
          {shown.map((r, i) => {
            const o = outcome(r);
            const c = o === "executed" ? D.green : o.includes("served") ? D.amber : D.red;
            return (
              <div
                key={r.call}
                className="flex flex-col gap-0.5 rounded-lg border px-3 py-2"
                style={{
                  borderColor: i === step && !done ? "rgba(240,134,43,.45)" : "rgba(236,150,96,.12)",
                  background: "rgba(255,236,214,.02)",
                }}
              >
                <span className="break-words font-code text-[12.5px] text-[#f7ece4]">{r.call}</span>
                <span className="font-code text-[11.5px]" style={{ color: c }}>
                  {r.effect} → {o}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mb-0 mt-3 text-[13px] text-[#8b837b]">The calls are illustrative; the admit and refuse rule is the one in effects.rs.</p>
    </DiagramFrame>
  );
}
