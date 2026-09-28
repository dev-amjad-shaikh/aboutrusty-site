import type { ReactElement } from "react";
import { ACCENT, Arrow, Box, Frame, INK, LINE, MUTED, Text } from "./primitives";

/**
 * Diagrams for the Docs pages, keyed by id. Every label names a real
 * piece of rusty-src: crate names, routes, ports, and file paths.
 */

function Pieces() {
  return (
    <Frame viewBox="0 0 600 330" label="Your graph compiles onto Rusty Core, which writes a checkpoint per step. Rusty Server runs your graphs on Rusty Core and serves Studio, the Python client, and the TypeScript client over HTTP and SSE.">
      {(m) => (
        <>
          <Box x={20} y={16} w={220} h={66} title="Your graph" sub="main.rs · Cargo.toml" sub2="StateSpec · GraphBuilder" />
          <Arrow d="M130,82 L130,136" marker={m} />
          <Text x={140} y={113} anchor="start" mono size={12} color={MUTED}>compile()</Text>
          <Box x={20} y={138} w={220} h={76} accent title="Rusty Core" sub="rusty-agent-runtime" sub2="executor · journal" />
          <Arrow d="M130,214 L130,258" marker={m} />
          <Text x={140} y={241} anchor="start" mono size={12} color={MUTED}>checkpoint per step</Text>
          <Box x={20} y={260} w={220} h={58} title="Checkpoint store" sub="memory · JSON · Postgres" />

          <Box x={330} y={138} w={250} h={76} title="Rusty Server" sub="rusty-agent-server" sub2="HTTP + SSE · one binary" />
          <Arrow d="M328,176 L242,176" marker={m} />
          <Text x={285} y={168} mono size={12} color={MUTED}>runs on</Text>

          {[
            [330, "Studio"],
            [416, "Python"],
            [502, "TypeScript"],
          ].map(([x, t]) => (
            <g key={t as string}>
              <Box x={x as number} y={16} w={78} h={44} title={t as string} titleSize={14.5} />
              <Arrow d={`M${(x as number) + 39},60 L${(x as number) + 39},136`} marker={m} both />
            </g>
          ))}
          <Text x={590} y={102} anchor="end" mono size={11.5} color={MUTED}>HTTP / SSE</Text>
        </>
      )}
    </Frame>
  );
}

function QuickstartSequence() {
  const steps: [string, string, boolean][] = [
    ["POST /threads  {graph: publisher}", "201 · thread_id", false],
    ["POST /threads/$TID/runs/wait", "status: interrupted · checkpoint saved", true],
    ["GET /threads/$TID/state", 'next: ["approve"]', false],
    ["POST …/runs/stream · command.resume", "SSE frames … event: end · success", true],
    ["POST /threads/$TID/history", "checkpoints, newest first", false],
    ["POST /threads/$TID/fork", "201 · thread_id: branch-a", false],
  ];
  return (
    <Frame viewBox="0 0 600 424" label="The quickstart request sequence: create a thread, run until the approval interrupt, read state, resume over SSE, list history, fork.">
      {(m, ma) => (
        <>
          <Box x={20} y={10} w={100} h={36} title="curl" titleSize={15} />
          <Box x={440} y={10} w={150} h={36} title="Server :8080" titleSize={15} accent />
          <path d="M70,46 L70,414" stroke={LINE} strokeDasharray="3 5" />
          <path d="M515,46 L515,414" stroke={LINE} strokeDasharray="3 5" />
          {steps.map(([req, res, cp], i) => {
            const y = 88 + i * 56;
            return (
              <g key={req}>
                <Text x={40} y={y + 12} mono size={12} color={ACCENT}>{String(i + 1)}</Text>
                <Text x={292} y={y - 7} mono size={12.5} color={INK}>{req}</Text>
                <Arrow d={`M72,${y} L512,${y}`} marker={m} />
                <Text x={292} y={y + 18} mono size={12} color={MUTED}>{res}</Text>
                <Arrow d={`M513,${y + 26} L73,${y + 26}`} marker={m} dashed />
                {cp && <circle cx={515} cy={y + 13} r={5} fill={ACCENT} />}
                {cp && <Arrow d={`M538,${y + 13} L523,${y + 13}`} marker={ma} accent />}
                {cp && <Text x={542} y={y + 17} anchor="start" mono size={11} color={ACCENT}>saved</Text>}
              </g>
            );
          })}
        </>
      )}
    </Frame>
  );
}

function ApprovalTimeline() {
  return (
    <Frame viewBox="0 0 600 290" label="Human approval: run 1 reaches the approve node, interrupts, and saves a checkpoint. The thread waits. Run 2 on the same thread resumes with a value; approve runs again from its start and the run finishes.">
      {(m) => (
        <>
          <Text x={20} y={28} anchor="start" mono size={12} color={MUTED}>RUN 1</Text>
          <Box x={20} y={40} w={120} h={50} title="draft" />
          <Arrow d="M140,65 L178,65" marker={m} />
          <Box x={180} y={40} w={160} h={50} accent title="approve" sub="ctx.interrupt(…)" />
          <Arrow d="M340,65 L378,65" marker={m} />
          <Box x={380} y={40} w={200} h={50} title="Checkpoint saved" sub="status: interrupted" />
          <Arrow d="M480,90 L480,116" marker={m} />

          <rect x={20} y={118} width={560} height={56} rx={10} fill="rgba(255,236,214,.02)" stroke={LINE} strokeDasharray="5 4" />
          <Text x={300} y={142} size={15} color={INK}>The thread waits. Nothing runs.</Text>
          <Text x={300} y={162} mono size={12} color={MUTED}>{'next: ["approve"] · survives a restart'}</Text>
          <Arrow d="M100,174 L100,210" marker={m} />

          <Text x={580} y={204} anchor="end" mono size={12} color={MUTED}>RUN 2 · SAME THREAD</Text>
          <Box x={20} y={212} w={160} h={54} title="Resume" sub="command.resume" />
          <Arrow d="M180,239 L218,239" marker={m} />
          <Box x={220} y={212} w={180} h={54} accent title="approve" sub="runs again from start" />
          <Arrow d="M400,239 L438,239" marker={m} />
          <Box x={440} y={212} w={140} h={54} title="Done" sub="status: success" />
        </>
      )}
    </Frame>
  );
}

function CheckpointStores() {
  return (
    <Frame viewBox="0 0 600 300" label="The executor writes a checkpoint at every super-step through the Checkpointer trait. Three implementations: InMemoryCheckpointer, JsonFileCheckpointer, PostgresCheckpointer.">
      {(m) => (
        <>
          <Box x={180} y={12} w={240} h={54} title="Executor" sub="one checkpoint per super-step" />
          <Arrow d="M300,66 L300,96" marker={m} />
          <Box x={120} y={98} w={360} h={70} accent title="Checkpointer trait" sub="put · get_latest · list" sub2="get_by_id · fork_thread" />
          {[
            [20, "InMemoryCheckpointer", "dev and tests", "lost on restart"],
            [210, "JsonFileCheckpointer", "one JSON file", "per checkpoint"],
            [400, "PostgresCheckpointer", "feature postgres", "rusty_checkpoints"],
          ].map(([x, t, s, s2]) => (
            <g key={t as string}>
              <Arrow d={`M300,168 L${(x as number) + 90},210`} marker={m} />
              <Box x={x as number} y={212} w={180} h={76} title={t as string} titleSize={14} sub={s as string} sub2={s2 as string} />
            </g>
          ))}
        </>
      )}
    </Frame>
  );
}

function Slot({ x, y, label, value, accent }: { x: number; y: number; label: string; value: string; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={156} height={34} rx={8} fill={accent ? "rgba(240,134,43,.09)" : "rgba(255,236,214,.03)"} stroke={accent ? ACCENT : LINE} />
      <Text x={x + 12} y={y + 22} anchor="start" mono size={12} color={MUTED}>{label}</Text>
      <Text x={x + 144} y={y + 22} anchor="end" mono size={12.5} color={value === "—" ? MUTED : INK}>{value}</Text>
    </g>
  );
}

function Environments() {
  const envs: [string, string, string, string?][] = [
    ["dev", "rev 3", "—"],
    ["staging", "rev 2", "rev 3 · 10%"],
    ["prod", "rev 2", "—", "rev 1"],
  ];
  return (
    <Frame viewBox="0 0 600 330" label="Immutable revisions. Each environment has a pointer with an active slot and a canary slot. Promote moves active and clears the canary. Rollback points active back at the previously serving revision.">
      {(_m, ma) => (
        <>
          <Text x={20} y={24} anchor="start" mono size={12} color={MUTED}>REVISIONS · IMMUTABLE, CONTENT-ADDRESSED</Text>
          {["rev 1", "rev 2", "rev 3"].map((r, i) => (
            <Box key={r} x={20 + i * 92} y={36} w={82} h={34} title={r} titleSize={14} />
          ))}
          {envs.map(([name, active, canary, previous], i) => {
            const x = 20 + i * 190;
            return (
              <g key={name}>
                <rect x={x} y={100} width={180} height={previous ? 170 : 130} rx={11} fill="rgba(255,236,214,.02)" stroke={LINE} />
                <Text x={x + 14} y={126} anchor="start" size={16} color={INK}>{name}</Text>
                <Slot x={x + 12} y={140} label="active" value={active} accent />
                <Slot x={x + 12} y={182} label="canary" value={canary} />
                {previous && <Slot x={x + 12} y={224} label="previous" value={previous} />}
                {previous && <Arrow d={`M${x + 170},241 C${x + 188},230 ${x + 188},168 ${x + 170},157`} marker={ma} accent dashed />}
              </g>
            );
          })}
          <Text x={20} y={298} anchor="start" mono size={12} color={MUTED}>promote: set active, clear canary</Text>
          <Text x={20} y={318} anchor="start" mono size={12} color={ACCENT}>rollback: active → previous revision, byte-exact</Text>
        </>
      )}
    </Frame>
  );
}

function DockerTopology() {
  return (
    <Frame viewBox="0 0 600 280" label="docker compose: the browser opens Studio on port 8000, which proxies /api to Rusty Server on port 8100 in the same network namespace. curl reaches the API on 8100. Data lives in the server-data volume.">
      {(m) => (
        <>
          <rect x={172} y={12} width={420} height={106} rx={12} fill="none" stroke={LINE} strokeDasharray="5 4" />
          <Text x={182} y={136} anchor="start" mono size={11.5} color={MUTED}>network_mode: service:server</Text>
          <Box x={10} y={40} w={120} h={50} title="Browser" />
          <Arrow d="M130,65 L186,65" marker={m} />
          <Box x={188} y={28} w={170} h={74} accent title="Rusty Studio" sub="localhost:8000" sub2="studio/ui/dist" />
          <Arrow d="M358,65 L404,65" marker={m} />
          <Text x={381} y={57} mono size={12} color={MUTED}>/api</Text>
          <Box x={406} y={28} w={176} h={74} title="Rusty Server" sub="localhost:8100" sub2="server_demo" />
          <Arrow d="M494,102 L494,186" marker={m} both />
          <Box x={406} y={188} w={176} h={62} title="server-data" sub="volume · /app/data" />
          <Box x={10} y={188} w={120} h={50} title="curl" />
          <Arrow d="M130,213 L300,213 L440,104" marker={m} />
          <Text x={140} y={204} anchor="start" mono size={12} color={MUTED}>localhost:8100</Text>
        </>
      )}
    </Frame>
  );
}

export const DOC_DIAGRAMS: Record<string, () => ReactElement> = {
  pieces: Pieces,
  "quickstart-sequence": QuickstartSequence,
  "approval-timeline": ApprovalTimeline,
  "checkpoint-stores": CheckpointStores,
  environments: Environments,
  "docker-topology": DockerTopology,
};

export function DocDiagram({ id }: { id: string }) {
  const Diagram = DOC_DIAGRAMS[id];
  return Diagram ? <Diagram /> : null;
}
