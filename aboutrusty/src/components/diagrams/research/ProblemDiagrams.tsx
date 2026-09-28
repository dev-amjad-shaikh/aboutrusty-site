import type { ReactElement } from "react";
import { Arrow, Box, Diagram, Label, T, useDiagramId } from "./kit";

/*
 * One diagram per Research problem. Each draws the mechanism as rusty-src
 * implements it; names match the code (DecisionEvent fields, derive_effect_id
 * material, RunReceipt fields, canary_admits seed material).
 */

/** 1 · correction → candidate + example → evaluate → promote → pointer / rollback. */
function GovernedLearning() {
  return (
    <Diagram title="A correction becomes a candidate and an eval example, is evaluated, promoted by moving a pointer, and rolled back by moving it back" height={352}>
      <Box x={120} y={6} w={180} h={40} label="correction" sub="corrector named" />
      <Arrow from={[170, 46]} to={[118, 78]} flow />
      <Arrow from={[250, 46]} to={[302, 78]} flow />
      <Box x={14} y={80} w={192} h={40} label="candidate" sub="immutable · sha256 address" />
      <Box x={214} y={80} w={192} h={40} label="eval example" sub="new dataset version" tone="green" />
      <Arrow from={[110, 120]} to={[178, 152]} flow />
      <Arrow from={[310, 120]} to={[242, 152]} flow />
      <Box x={110} y={154} w={200} h={40} label="evaluate" sub="replay + compare()" />
      <Arrow from={[210, 194]} to={[210, 222]} flow />
      <Box x={110} y={224} w={200} h={40} label="promote" sub="declared envelope · journaled" tone="accent" />
      <Arrow from={[210, 264]} to={[210, 286]} />
      <Box x={160} y={288} w={100} h={28} label="active" size={11} />
      <Box x={24} y={288} w={100} h={28} label="v1" size={11} tone="muted" />
      <Box x={296} y={288} w={100} h={28} label="v2" size={11} tone="accent" />
      <Arrow from={[260, 302]} to={[294, 302]} tone="accent" />
      <Arrow d="M190 316 Q150 346 80 318" tone="red" dashed />
      <Label x={176} y={346} anchor="start" tone="red">rollback: re-point, byte-exact</Label>
    </Diagram>
  );
}

/** 2 · the DecisionEvent record, with a retry decision as the example. */
function DecisionRecord() {
  const rows: [string, string][] = [
    ["family", "retry"],
    ["features", "failure_class, attempt, max_attempts, effect"],
    ["legal_actions", ""],
    ["selected", ""],
    ["propensity", "1.0"],
    ["policy_version", "static-v0"],
    ["outcome", "success | failure | cancelled"],
  ];
  return (
    <Diagram title="A DecisionEvent records the family, features, the legal action set, the selected action, its propensity, the policy version, and the outcome" height={252}>
      <rect x={6} y={6} width={408} height={240} rx={10} fill={T.fill} stroke={T.lineStrong} />
      <Label x={20} y={29} anchor="start" tone="accent" size={12}>DecisionEvent</Label>
      <Label x={402} y={29} anchor="end" size={9}>rusty-core/src/record.rs</Label>
      <line x1={6} y1={40} x2={414} y2={40} stroke={T.line} />
      {rows.map(([k, v], i) => {
        const y = 64 + i * 28;
        return (
          <g key={k}>
            <Label x={20} y={y} anchor="start" size={10}>{k}</Label>
            {v && <Label x={128} y={y} anchor="start" tone="ink" size={10}>{v}</Label>}
          </g>
        );
      })}
      {/* legal_actions chips */}
      <rect x={124} y={107} width={124} height={20} rx={5} fill="transparent" stroke={T.lineStrong} />
      <Label x={186} y={121} tone="ink" size={10}>retry {"{attempt: 2}"}</Label>
      <rect x={254} y={107} width={52} height={20} rx={5} fill="transparent" stroke={T.lineStrong} />
      <Label x={280} y={121} tone="ink" size={10}>abort</Label>
      {/* selected chip */}
      <rect x={124} y={135} width={124} height={20} rx={5} fill={T.accentFill} stroke={T.accent} className="rd-pulse" />
      <Label x={186} y={149} tone="accent" size={10}>retry {"{attempt: 2}"}</Label>
      <Label x={152} y={176} anchor="start" tone="amber" size={9.5}>deterministic floor logs 1.0</Label>
    </Diagram>
  );
}

/** 3 · the runtime twin: recorded run in, seeded faults injected, floor vs candidate out. */
function RuntimeTwin() {
  const faults: [string, number][] = [["worker crash", 88], ["timeout", 60], ["rate limit", 78], ["exhaustion", 78]];
  let fx = 26;
  return (
    <Diagram title="The runtime twin re-executes a recorded run with seeded faults and compares the floor policy with a candidate" height={300}>
      <Label x={210} y={14}>recorded run journal</Label>
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={115 + i * 22} y={22} width={14} height={14} rx={3} fill={T.fill} stroke={T.lineStrong} />
      ))}
      <Arrow from={[210, 40]} to={[210, 68]} flow />
      <rect x={10} y={70} width={400} height={92} rx={10} fill={T.accentFill} stroke={T.accent} />
      <Label x={210} y={90} tone="ink" size={11}>runtime twin · same seed, same journal</Label>
      {faults.map(([f, w]) => {
        const x = fx;
        fx += w + 10;
        return <Box key={f} x={x} y={102} w={w} h={24} label={f} tone="red" size={10} />;
      })}
      <Label x={210} y={148} size={9.5}>parallel order shuffled · counterfactual forks</Label>
      <Arrow from={[210, 162]} to={[210, 180]} />
      <Label x={14} y={201} anchor="start" size={10}>static-v0</Label>
      <rect x={100} y={190} width={240} height={14} rx={3} fill={T.line} />
      <Label x={346} y={201} anchor="start" tone="ink" size={10}>2,130 ms</Label>
      <Label x={14} y={225} anchor="start" size={10}>learned</Label>
      <rect x={100} y={214} width={57} height={14} rx={3} fill={T.accent} />
      <Label x={163} y={225} anchor="start" tone="accent" size={10}>504 ms per item</Label>
      <Label x={210} y={248} size={9.5}>same completion, attempts, and cost</Label>
      <Box x={10} y={262} w={400} h={30} label="input-changing decision → UnevaluableCase" tone="red" size={10} dashed />
    </Diagram>
  );
}

/** 4 · deterministic effect ids, receipts, and the recovery check. */
function EffectivelyOnce() {
  return (
    <Diagram title="An effect id is derived from scope, kind, input hash, and key; the provider's confirmation is journaled as a receipt; recovery checks for it before running the effect" height={292}>
      <Box x={10} y={6} w={400} h={46} label="effect_id = sha256(…)" sub="rusty/effect-id/v1 · scope · kind · input_hash · key" />
      <Arrow from={[210, 52]} to={[210, 76]} />
      <Box x={14} y={78} w={176} h={36} label="provider commits" />
      <Arrow from={[190, 96]} to={[226, 96]} tone="green" flow />
      <Box x={228} y={78} w={178} h={36} label="effect receipt" sub="journaled by effect_id" tone="green" />
      <line x1={10} y1={146} x2={410} y2={146} stroke={T.red} strokeDasharray="4 4" />
      <Label x={210} y={138} tone="red" size={10}>✕ crash before completion is reported</Label>
      <Arrow from={[210, 150]} to={[210, 176]} />
      <Box x={90} y={178} w={240} h={40} label="on recovery" sub="receipt for this effect_id?" tone="accent" />
      <Arrow from={[150, 218]} to={[100, 246]} tone="green" />
      <Arrow from={[270, 218]} to={[320, 246]} />
      <Box x={10} y={248} w={190} h={36} label="yes: reuse the receipt" tone="green" size={11} />
      <Box x={220} y={248} w={190} h={36} label="no: run the effect" size={11} />
    </Diagram>
  );
}

/** 5 · hash-chained journal → signed RunReceipt. */
function SignedReceipt() {
  const fields: [string, boolean][] = [
    ["journal_head", false],
    ["manifest_digest · capsules", false],
    ["effects[]", false],
    ["executor_policy · capsule_policies", false],
    ["denials[]", true],
  ];
  return (
    <Diagram title="Journal events are hash-chained; the RunReceipt signs the head hash, manifest digests, effects, policy versions, and denials with Ed25519" height={262}>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <Box x={10 + i * 82} y={8} w={66} h={32} label={i === 4 ? "head" : `e${i + 1}`} tone={i === 4 ? "accent" : "line"} size={11} />
          {i < 4 && <Arrow from={[76 + i * 82, 24]} to={[90 + i * 82, 24]} />}
        </g>
      ))}
      <Label x={10} y={58} anchor="start" size={9.5}>each event hashes the one before it</Label>
      <Arrow from={[371, 40]} to={[371, 80]} tone="accent" flow />
      <rect x={10} y={82} width={400} height={140} rx={10} fill={T.fill} stroke={T.lineStrong} />
      <Label x={24} y={104} anchor="start" tone="accent" size={12}>RunReceipt</Label>
      <Label x={396} y={104} anchor="end" tone="amber" size={10}>Ed25519 signature</Label>
      <line x1={10} y1={114} x2={410} y2={114} stroke={T.line} />
      {fields.map(([f, deny], i) => (
        <g key={f}>
          <Label x={24} y={134 + i * 20} anchor="start" tone={deny ? "red" : "ink"} size={10}>{f}</Label>
          <Label x={396} y={134 + i * 20} anchor="end" tone={deny ? "red" : "green"} size={10}>
            {deny ? "refused actions, too" : "✓"}
          </Label>
        </g>
      ))}
      <Label x={210} y={246} size={9.5}>verify_receipt recomputes each digest and names the one that fails</Label>
    </Diagram>
  );
}

/** 6 · manifest ∩ tenant overlay = effective grants; ungranted imports do not exist. */
function NoAmbientAuthority() {
  const id = useDiagramId();
  return (
    <Diagram title="Effective grants are the intersection of the capsule manifest and the tenant overlay; an ungranted capability has no import" height={262}>
      <defs>
        <clipPath id={`${id}-b`}>
          <circle cx={255} cy={98} r={82} />
        </clipPath>
      </defs>
      <circle cx={165} cy={98} r={82} fill={T.accentFill} clipPath={`url(#${id}-b)`} className="rd-pulse" />
      <circle cx={165} cy={98} r={82} fill="none" stroke={T.lineStrong} />
      <circle cx={255} cy={98} r={82} fill="none" stroke={T.lineStrong} />
      <Label x={118} y={95} tone="ink" size={10.5}>manifest</Label>
      <Label x={118} y={109} size={9.5}>declares</Label>
      <Label x={302} y={95} tone="ink" size={10.5}>tenant</Label>
      <Label x={302} y={109} size={9.5}>overlay</Label>
      <Label x={210} y={95} tone="accent" size={10}>effective</Label>
      <Label x={210} y={109} tone="accent" size={10}>grants</Label>
      <Label x={210} y={198} size={9.5}>intersection only · Cedar decides admission</Label>
      <Box x={14} y={214} w={188} h={40} label="net.fetch" sub="granted: import exists" tone="green" />
      <Box x={218} y={214} w={188} h={40} label="filesystem" sub="not granted: no import" tone="red" dashed strike />
    </Diagram>
  );
}

/** 7 · shadow admission: Pure and ReadOnly run; everything above is served from the recording. */
function ShadowFilter() {
  const classes: [string, boolean][] = [
    ["Pure", true],
    ["ReadOnly", true],
    ["Idempotent", false],
    ["Compensatable", false],
    ["NonIdempotent", false],
  ];
  return (
    <Diagram title="A shadow deployment admits only Pure and ReadOnly effects; refused effects are served their recorded outcome" height={250}>
      {classes.map(([c, ok], i) => {
        const y = 8 + i * 42;
        const cy = y + 15;
        return (
          <g key={c}>
            <Box x={10} y={y} w={140} h={30} label={c} tone={ok ? "green" : "red"} size={11} />
            {ok ? (
              <Arrow d={`M150 ${cy} L286 ${cy === 23 ? 32 : 58}`} tone="green" flow />
            ) : (
              <>
                <Arrow from={[150, cy]} to={[194, cy]} tone="red" />
                <Arrow d={`M206 ${cy} L286 ${165}`} dashed />
              </>
            )}
          </g>
        );
      })}
      <line x1={200} y1={4} x2={200} y2={214} stroke={T.accent} strokeDasharray="3 5" />
      <Label x={200} y={232} tone="accent" size={10}>shadow admission</Label>
      <Box x={288} y={14} w={122} h={62} label="runs" sub="no side effects" tone="green" />
      <Box x={288} y={126} w={122} h={78} label="recorded" sub="outcome served" />
    </Diagram>
  );
}

/** 8 · the seeded canary draw from canary_admits. */
function SeededCanary() {
  return (
    <Diagram title="Canary assignment hashes journaled inputs and compares the draw with the fraction, so a run's assignment reproduces from its journal" height={294}>
      <Box x={10} y={6} w={400} h={44} label="sha256(domain · surface · candidate_id · run_id)" sub="every input is journaled" size={11} />
      <Arrow from={[210, 50]} to={[210, 70]} />
      <Box x={90} y={72} w={240} h={34} label="first 8 bytes → u64 draw" size={11} />
      <Arrow from={[210, 106]} to={[210, 126]} />
      <polygon points="70,152 210,128 350,152 210,176" fill={T.accentFill} stroke={T.accent} />
      <Label x={210} y={156} tone="ink" size={10.5}>draw &lt; fraction × u64::MAX</Label>
      <Arrow from={[120, 168]} to={[90, 196]} tone="accent" />
      <Arrow from={[300, 168]} to={[330, 196]} />
      <Label x={96} y={180} anchor="end" tone="accent" size={10}>yes</Label>
      <Label x={322} y={180} anchor="start" size={10}>no</Label>
      <Box x={10} y={198} w={170} h={34} label="canary revision" tone="accent" size={11} />
      <Box x={240} y={198} w={170} h={34} label="active revision" size={11} />
      {Array.from({ length: 20 }, (_, i) => (
        <circle
          key={i}
          cx={24 + i * 19.5}
          cy={254}
          r={5}
          fill={i === 6 || i === 15 ? T.accent : "transparent"}
          stroke={i === 6 || i === 15 ? T.accent : T.lineStrong}
        />
      ))}
      <Label x={210} y={284} size={9.5}>same run_id, same assignment on replay</Label>
    </Diagram>
  );
}

/** 9 · forget walks the supersession chain and journals a content-free tombstone. */
function Forgetting() {
  return (
    <Diagram title="Forgetting a record deletes it, invalidates every summary built from it, and journals a tombstone without the content; run journals are not rewritten" height={258}>
      <Box x={14} y={10} w={96} h={32} label="record r1" tone="red" size={11} strike />
      <Box x={14} y={58} w={96} h={32} label="record r2" size={11} />
      <Box x={14} y={106} w={96} h={32} label="record r3" size={11} />
      <Box x={162} y={34} w={104} h={32} label="summary s1" tone="red" size={11} dashed />
      <Box x={306} y={72} w={104} h={32} label="summary s2" tone="red" size={11} dashed />
      <Arrow from={[110, 26]} to={[160, 46]} tone="red" flow />
      <Arrow from={[110, 74]} to={[160, 56]} />
      <Arrow from={[266, 54]} to={[304, 82]} tone="red" flow />
      <Arrow from={[110, 122]} to={[304, 94]} />
      <Label x={290} y={50} anchor="start" size={9}>superseded by</Label>
      <Label x={210} y={162} size={9.5}>forget(r1) deletes r1 and invalidates what was built from it</Label>
      <Box x={14} y={178} w={254} h={44} label="MemoryForget tombstone" sub="id · scope · reason · invalidations" tone="accent" />
      <Box x={280} y={178} w={130} h={44} label="run journal" sub="not rewritten" tone="muted" />
      <Label x={14} y={244} anchor="start" size={9.5}>the tombstone never carries the forgotten content</Label>
    </Diagram>
  );
}

/** 10 · the verifier suite: people's reviews become the cases the judge is scored on. */
function VerifierSuite() {
  return (
    <Diagram title="A person reviews whether a run's verdict was right; the review becomes a case the verifier is scored on" height={140}>
      <Box x={10} y={10} w={120} h={40} label="run" sub="with a verdict" />
      <Arrow from={[130, 30]} to={[148, 30]} flow />
      <Box x={150} y={10} w={120} h={40} label="person" sub="verdict right?" tone="accent" />
      <Arrow from={[270, 30]} to={[288, 30]} flow />
      <Box x={290} y={10} w={120} h={40} label="suite case" sub="reviewed run" />
      <Arrow from={[350, 50]} to={[350, 80]} flow />
      <Box x={290} y={82} w={120} h={40} label="judge again" sub="kept transcript" />
      <Arrow from={[290, 102]} to={[272, 102]} flow />
      <Box x={150} y={82} w={120} h={40} label="agreement" sub="judge vs person" tone="green" />
    </Diagram>
  );
}

export const PROBLEM_DIAGRAMS: Record<string, () => ReactElement> = {
  "governed-learning": GovernedLearning,
  "decision-records": DecisionRecord,
  "runtime-twin": RuntimeTwin,
  "effectively-once": EffectivelyOnce,
  receipts: SignedReceipt,
  "no-ambient-authority": NoAmbientAuthority,
  shadow: ShadowFilter,
  canaries: SeededCanary,
  forgetting: Forgetting,
  verifier: VerifierSuite,
};
