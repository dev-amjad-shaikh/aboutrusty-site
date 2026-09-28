/**
 * Research page content. Every mechanism, test path, and number is checked
 * against rusty-src (CHANGELOG.md, docs/learn-design.md, docs/adaptation-design.md,
 * docs/benchmarks.md, docs/roadmap.md, rusty-core/src, rusty-server/tests).
 * Lesson ids use the Learn course's 11-part numbering.
 */

export interface Row {
  label: string;
  text: string;
}

export interface Problem {
  id: string;
  title: string;
  onMain?: boolean;
  rows: Row[];
  /** Repo-relative test file that proves the claim. */
  proof?: { path: string; text: string };
  lessons: string[];
}

export const PROBLEMS: Problem[] = [
  {
    id: "governed-learning",
    title: "Changing agent behavior without silent rewrites",
    rows: [
      { label: "Problem", text: "Agents that learn usually do it by editing their own prompt or memory in place. When behavior changes, nobody can say who changed it, based on what, or how to undo it." },
      { label: "Approach", text: "No learning process may silently rewrite a production prompt, graph, policy, memory, or tool permission. Learning produces an immutable, content-addressed candidate. The candidate is evaluated against recorded runs, promotion is a journaled step inside a declared envelope, and rollback moves a version pointer back to the exact previous content." },
      { label: "Detail", text: "A person's correction that targets a run event produces two things: the candidate fix and an example for the evaluation dataset. The correction is both the fix and its regression test." },
      { label: "Lineage", text: "Reflexion (Shinn et al., NeurIPS 2023) and CLIN (Majumder et al., COLM 2024) learn from feedback persisted as memory. Rusty adds attribution and governance: corrections name their author and are promoted, not appended to a prompt." },
    ],
    proof: {
      path: "rusty-server/tests/learn_release.rs",
      text: "Plants a defect, applies a correction through the API, lets the candidate auto-promote inside the envelope, and checks that new runs are corrected. It then walks the chain from the improved run's journal back to the correction, rolls back, and checks the defect returns byte for byte.",
    },
    lessons: ["8.1", "8.3", "8.4"],
  },
  {
    id: "decision-records",
    title: "Recording decisions so they can be learned from later",
    rows: [
      { label: "Problem", text: "To compare a new policy with the one that produced your logs, the logs must record which actions were possible and how likely the chosen one was. That can't be reconstructed after the fact." },
      { label: "Approach", text: "Rusty froze its decision record in R0.5, before any learning shipped. Each DecisionEvent stores the features, the closed set of legal actions, the selected action, its propensity, the policy version, and the outcome. Journals written since then are usable evidence." },
      { label: "Where we're careful", text: "The default policy static-v0 is deterministic, so it logs a propensity of 1.0 and propensity-weighted evaluation against it degenerates. Until canary traffic produces randomized logs, Rusty evaluates candidates with replay and experiment comparison." },
      { label: "Lineage", text: "Logged bandit feedback and off-policy evaluation: Bottou et al. (JMLR 2013), Dudík, Langford & Li (ICML 2011), Swaminathan & Joachims (ICML 2015)." },
    ],
    lessons: ["5.1"],
  },
  {
    id: "runtime-twin",
    title: "Testing policies against failures that never happened",
    rows: [
      { label: "Problem", text: "Production logs only show the failures that occurred. A new retry or timeout policy has to be tested against the ones that didn't." },
      { label: "Approach", text: "The runtime twin re-executes recorded runs deterministically and injects seeded faults: worker crashes, callee timeouts, rate-limit windows, and resource exhaustion. It randomizes the order of each super-step's parallel tasks and supports counterfactual forks that change one decision. The same seed and fixture produce byte-identical journals." },
      { label: "Where we're careful", text: "The twin only evaluates decisions that change when or whether effects run. A decision that would change an effect's input is refused with UnevaluableCase, and every TwinReport states its validity bound." },
      { label: "Result", text: "In the R0.10 release proof, a learned retry policy finished a rate-limited workload at 504 ms per item against 2,130 ms for static-v0, with identical completion, attempts, and cost." },
      { label: "Also", text: "Before any learner shipped, a headroom experiment with a pre-registered bar decided which decision families were worth learning. Its two weak results are published with the numbers in docs/benchmarks.md." },
    ],
    proof: {
      path: "rusty-server/tests/adaptation_release.rs",
      text: "Promotes a retry policy distilled from twin evidence, measures the margin under the same fault schedule, then reactivates static-v0 and checks the original behavior returns exactly.",
    },
    lessons: ["8.5"],
  },
  {
    id: "effectively-once",
    title: "Effectively-once side effects across crashes",
    rows: [
      { label: "Problem", text: "Exactly-once delivery isn't achievable over a network. Pretending otherwise causes duplicate charges, emails, and writes." },
      { label: "Approach", text: "Rusty uses at-least-once delivery plus idempotency. Tasks have leases and idempotency keys. Effects have deterministic IDs derived from their scope, kind, input, and key. When a provider confirms an effect, the confirmation is journaled as an effect receipt, so on recovery Rusty checks whether the effect already committed before trying again." },
    ],
    proof: {
      path: "rusty-server/tests/crash_recovery.rs",
      text: "Runs a real server and worker, writes an idempotent effect to an external ledger, then kills both processes before completion is reported. After restart the ledger shows exactly one invocation and the task completes with the first attempt's receipt.",
    },
    lessons: ["4.3", "4.4"],
  },
  {
    id: "receipts",
    title: "Receipts that prove what a run did and didn't do",
    rows: [
      { label: "Problem", text: "Logs can be edited, and they usually record only what happened, not what was refused." },
      { label: "Approach", text: "Run journals are hash-chained. A signed run receipt (Ed25519) covers the journal head, the manifest digests, the effect receipts, the policy versions, and the ledger of denied actions. Verification recomputes each digest and names the one that fails." },
      { label: "Where we're careful", text: "A receipt proves what this runtime received, authorized, and executed. It does not prove an external model told the truth." },
    ],
    proof: {
      path: "rusty-server/tests/capsules_release.rs",
      text: "Verifies the receipt of a run that attempted forbidden access, then tampers with a journaled denial and checks verification fails and names the component.",
    },
    lessons: ["5.5"],
  },
  {
    id: "no-ambient-authority",
    title: "Running untrusted code with no ambient authority",
    rows: [
      { label: "Problem", text: "Sandboxes usually check permissions at call time, so one missed check is a hole." },
      { label: "Approach", text: "Capsules run as WebAssembly components. If the manifest doesn't grant a capability, the import doesn't exist in the module. The effective grant set is the intersection of the manifest and the tenant overlay; no code path computes a union. Cedar policies decide admission, grant checks, and overlay legality." },
      { label: "Lineage", text: "The WebAssembly Component Model and Cedar (Cutler et al., OOPSLA 2024)." },
    ],
    proof: {
      path: "rusty-server/tests/capsules_release.rs",
      text: "A capsule granted one network host fetches from it, is denied another host, and finds no filesystem import. Both denials are journaled and name the absent grant.",
    },
    lessons: ["10.1", "10.2"],
  },
  {
    id: "shadow",
    title: "Shadow deployments that can't cause side effects",
    rows: [
      { label: "Problem", text: "Running a candidate next to production usually means it also sends emails and writes to databases." },
      { label: "Approach", text: "A shadow deployment runs under an admission context that allows only Pure and ReadOnly effects. Where the candidate depends on a refused effect, Rusty serves the recorded outcome. The shadow is evaluated against the recorded world instead of acting in the real one." },
    ],
    lessons: ["9.3"],
  },
  {
    id: "canaries",
    title: "Reproducible canaries",
    rows: [
      { label: "Problem", text: "Random traffic splits can't be reproduced when you investigate a regression." },
      { label: "Approach", text: "Canary assignment is a seeded draw, so each run's assignment can be reproduced from the journal alone. Changing the fraction is a declared, journaled action. There is no automatic traffic controller." },
    ],
    proof: {
      path: "rusty-server/tests/operations_release.rs",
      text: "Binds a revision at a 10% canary and reproduces the split from the journaled resolutions, then rolls the pointer back and checks the canary run's receipt still verifies.",
    },
    lessons: ["9.3"],
  },
  {
    id: "forgetting",
    title: "Forgetting that reaches derived data",
    rows: [
      { label: "Problem", text: "Deleting a record doesn't delete the summaries and caches built from it." },
      { label: "Approach", text: "forget deletes the record, walks the supersession chain to invalidate dependent summaries, and journals a tombstone with the ID, scope, reason, and invalidations, never the forgotten content. Memory is erasable. Run journals are evidence and are not rewritten." },
      { label: "On main", text: "POST /users/{id}/forget forgets a person. Their memory is tombstoned, their connections revoked, and the runs that acted for them, sealed under their key, are removed. The key is destroyed, so any copy of those records, including a restored backup, is ciphertext." },
      { label: "Lineage", text: "Machine unlearning (Cao & Yang, IEEE S&P 2015) and the right to erasure (GDPR Article 17)." },
    ],
    proof: {
      path: "rusty-server/tests/forget.rs",
      text: "Forgets a person, restores a backup, and checks that what comes back of them is ciphertext while everyone else's history stands.",
    },
    lessons: ["8.2"],
  },
  {
    id: "verifier",
    title: "Measuring the measurer",
    onMain: true,
    rows: [
      { label: "Problem", text: "Auto-promoting on an automated verdict is only as good as the verifier that produced it." },
      { label: "Approach", text: "People judge whether a run's verdict was right. Those judgments become the cases the verifier is scored on: every reviewed run's transcript goes past the judge again, and Rusty counts where it agrees with the person." },
    ],
    proof: {
      path: "rusty-server/tests/verifier_suite.rs",
      text: "Runs a verified run, records a person's review, and scores the judge against it through the real server paths.",
    },
    lessons: [],
  },
];

export interface Idea {
  idea: string;
  source: string;
  inRusty: string;
}

export const IDEAS: Idea[] = [
  { idea: "Bulk-synchronous parallel graph execution", source: "Pregel (Malewicz et al., SIGMOD 2010); LangGraph", inRusty: "The super-step loop and its barrier" },
  { idea: "Checkpointed state channels with reducers", source: "LangGraph", inRusty: "StateSpec, reducers, and the single-write rule" },
  { idea: "Tiered agent memory with explicit operations", source: "MemGPT / Letta (Packer et al., 2023, arXiv:2310.08560)", inRusty: "Memory writes are declared operations. Self-editing is replaced by candidates." },
  { idea: "Temporal validity for facts", source: "Zep / Graphiti (Rasmussen et al., 2025, arXiv:2501.13956)", inRusty: "ValidityWindow and supersession chains" },
  { idea: "Memory scopes and conflict detection", source: "Mem0 (Chhikara et al., 2025, arXiv:2504.19413)", inRusty: "Run, agent, team, user, and tenant scopes. Conflicts are flagged for review, never auto-resolved." },
  { idea: "Learning from feedback", source: "Reflexion (Shinn et al., NeurIPS 2023); CLIN (Majumder et al., COLM 2024)", inRusty: "The correction loop" },
  { idea: "Off-policy evaluation", source: "Bottou et al. (JMLR 2013); Dudík, Langford & Li (ICML 2011); Swaminathan & Joachims (ICML 2015)", inRusty: "DecisionEvent with legal actions and propensity" },
  { idea: "Canary and shadow releases", source: "The Site Reliability Workbook (Beyer et al., 2018), canarying chapter", inRusty: "Seeded canaries and effect-restricted shadows" },
  { idea: "Supervision trees", source: "Erlang/OTP (Armstrong, 2003)", inRusty: "permanent, transient, and temporary restart policies" },
  { idea: "Policy-based authorization", source: "Cedar (Cutler et al., OOPSLA 2024)", inRusty: "Capsule admission, grant checks, and overlay legality" },
  { idea: "Machine unlearning", source: "Cao & Yang (IEEE S&P 2015)", inRusty: "Forgetting with tombstones and dependent invalidation" },
  { idea: "Schema-defined connectors", source: "Airbyte connector specification", inRusty: "One JSON Schema document is the connector" },
];

export const OPEN_QUESTIONS: string[] = [
  "Clustered execution: executor failover and a distributed durable queue. The executor, queue, and persistence are single-node today.",
  "Propensity-weighted evaluation, once canary traffic produces randomized logs.",
  "Vector retrieval for memory. MemoryRecord reserves an embedding field that nothing reads yet.",
  "Running graphs on a WASM target, in the browser or at the edge.",
];

export const REPO = "https://github.com/dev-amjad-shaikh/rusty";
export const repoFile = (path: string) => `${REPO}/blob/main/${path}`;

export const READING: { label: string; path: string }[] = [
  { label: "Roadmap", path: "docs/roadmap.md" },
  { label: "Benchmarks", path: "docs/benchmarks.md" },
  { label: "Learn design (R0.8)", path: "docs/learn-design.md" },
  { label: "Adaptation design (R0.10)", path: "docs/adaptation-design.md" },
  { label: "Capsules design (R0.9)", path: "docs/capsules-design.md" },
  { label: "Operations plane design (R0.12)", path: "docs/operations-plane-design.md" },
];
