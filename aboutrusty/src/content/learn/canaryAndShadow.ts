import type { Lesson } from "./types";

export const canaryAndShadow: Lesson = {
  id: "9.3",
  slug: "canary-and-shadow",
  title: "Canary and shadow",
  minutes: 13,
  source: "rusty-core/src/deploy.rs",
  summary:
    "A canary sends a fixed fraction of real runs to a new revision of an agent. A shadow runs the revision against a recorded run without letting it touch the world. Rusty assigns canary runs by a seeded draw that a recorded run can re-derive, and keeps shadow runs from causing side effects.",
  glance: {
    learn: "How a run is assigned to canary or active, and why it replays the same",
    try: "Moving the canary fraction over real SHA-256 draws",
    read: "canary_admits and the shadow admission boundary",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "Two ways to try a revision",
      toc: "Canary or shadow",
      blocks: [
        {
          type: "p",
          text: "A new prompt passes the eval suite and still misbehaves in production. The usual remedy is to let it serve a small share of traffic first. You also need to know later exactly which runs it served. A random coin flip per request can't tell you that: replay the run and the coin lands differently.",
        },
        {
          type: "p",
          text: "Some changes are too risky even for a small share. For those, Rusty can show what the new revision would have done, without it charging a card or sending an email.",
        },
      ],
    },
    {
      id: "revisions",
      title: "Revisions and pointers",
      toc: "Revisions",
      blocks: [
        {
          type: "p",
          text: "A `DeploymentRevision` ([[Revision|revision]]) is an immutable, content-addressed description of what runs: the graph and its topology hash, the assistant, and the pinned registry candidates (prompts, policies). Its id is the SHA-256 of that content, so a changed declaration is a new id. There is no in-place update.",
        },
        {
          type: "p",
          text: "Each environment has a `DeploymentPointer` with two slots: `active`, the revision serving traffic, and an optional `canary`. Promotion moves `active` and clears the canary. Rollback points `active` back at the previous revision, byte for byte. Every move is journaled.",
        },
      ],
    },
    {
      id: "canary",
      title: "Canary by seeded draw",
      toc: "Canary",
      blocks: [
        {
          type: "p",
          text: "A [[Canary deployment|canary]] is a revision id and a `fraction` in (0, 1]. When a run starts, `deployment_admission` decides which revision serves it. It doesn't use a random number generator. It hashes values the run already has:",
        },
        {
          type: "code",
          file: "rusty-core/src/learn.rs",
          symbol: "canary_admits",
          code: `let material = [
    CANARY_DRAW_DOMAIN,          // "rusty/canary-draw/v1"
    surface.as_str(),            // e.g. "deployment:prod"
    binding.candidate_id.as_str(), // the canary revision id
    run_id,
]
.join("\\n");
// ...
let draw = u64::from_be_bytes(digest[..8].try_into().expect("eight bytes"));
(draw as f64) < binding.fraction * (u64::MAX as f64)`,
        },
        {
          type: "p",
          text: "The first eight bytes of the SHA-256 digest, read as a number, are uniform, so a fraction of 0.1 admits about one run in ten. Every input is recorded in the run's journal, so a recorded run re-derives its assignment exactly. Because the environment is part of the input, a canary in staging and one in prod are independent draws.",
        },
        {
          type: "predict",
          question: "A canary runs at 0.1. You raise it to 0.2. What happens to runs that were already assigned to the canary?",
          options: ["About half of them move back to active", "They all stay on the canary", "Every run is drawn again"],
          answer: 1,
          explain:
            "A run's draw depends only on the environment, the canary revision, and its run id, and none of those changed. Admission is `draw < fraction`, so raising the fraction only adds runs.",
        },
        { type: "p", text: "The draws below are computed in your browser with the same formula, over twenty example run ids:" },
        { type: "diagram", name: "canary-draw" },
        {
          type: "p",
          text: "There is no automatic traffic controller: each fraction change is a declared, journaled act, made with `PUT /deployments/environments/{name}/canary` and `{\"revision_id\", \"fraction\", \"author\"}`.",
        },
      ],
    },
    {
      id: "shadow",
      title: "Shadow runs",
      toc: "Shadow",
      blocks: [
        {
          type: "p",
          text: "`POST /deployments/shadows` starts a [[Shadow deployment|shadow]]: it runs a candidate revision against a recorded source run. The server gives the shadow run an `EffectAdmissionContext::shadow`, which decides per effect class what may execute:",
        },
        {
          type: "predict",
          question: "Which effect classes may a shadow run actually execute?",
          options: ["Everything except `NonIdempotent`", "`Pure`, `ReadOnly`, and `Idempotent`", "`Pure` and `ReadOnly` only"],
          answer: 2,
          explain:
            "`Idempotent` means safe to retry under one key. A shadow is a second revision issuing the same request, which is a different thing, so the boundary stops at `ReadOnly`. The doc comment below says it directly.",
        },
        { type: "diagram", name: "shadow-filter" },
        {
          type: "code",
          file: "rusty-core/src/effects.rs",
          symbol: "EffectAdmissionContext",
          code: `/// A context built by [\`EffectAdmissionContext::shadow\`] is the R0.12
/// shadow boundary: it admits [\`Effect::Pure\`] and [\`Effect::ReadOnly\`]
/// and refuses everything above — \`Idempotent\` included, because
/// "idempotent" means safe to retry under one key, not safe to execute
/// twice from two revisions, and a shadowed charge is a charge.`,
        },
        {
          type: "p",
          text: "A refused effect isn't simply dropped. The shadow is served the outcome the source run recorded for the same request, so it can keep going the way production did. Each refusal is journaled as `ShadowEffectRefused` the moment it happens.",
        },
        {
          type: "p",
          text: "At the end, the server journals a `ShadowVerdict`: how many refused effects matched the recording, how many the candidate asked for that the recording doesn't have (`unserved`, it diverged), and which recorded effects it never asked for (`unrequested`). A shadow has no thread, so it can never sign a production receipt.",
        },
      ],
    },
    {
      id: "gates",
      title: "Gates before traffic",
      toc: "Gates",
      blocks: [
        {
          type: "p",
          text: "An environment can declare a [[Release gate|release gate]]: an eval policy and a dataset version. Promoting a revision into it, or declaring a canary there, first evaluates the revision against the environment's current one. The gate allows only when the verdict is `Allow` and every check passed, and the decision is journaled either way. An environment with `approval_required` also needs an approval token minted for that exact revision.",
        },
        {
          type: "lab",
          title: "The release-gate tests",
          intro:
            "`release_gates.rs` drives all of this over HTTP in-process. The canary test binds 40 runs at a 0.1 canary and checks that each run's journaled slot equals the draw recomputed from its run id. The shadow test checks the refusal boundary and the verdict.",
          commands: "cargo test -p rusty-agent-server --test release_gates",
          output: `…
     Running tests/release_gates.rs (target/debug/deps/release_gates-0aaa9bb66ea30fd4)

running 5 tests
test a_shadow_run_refuses_above_read_only_serves_the_recorded_world_and_journals ... ok
test an_approval_token_admits_exactly_the_revision_it_was_minted_for ... ok
test a_failing_gate_refuses_the_promotion_and_journals_the_decision ... ok
test the_health_board_reports_pointers_canaries_and_gate_decisions_from_journal_data ... ok
test the_canary_binds_a_seeded_subset_and_every_run_re_derives_its_assignment ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.01s`,
          capturedAt: "fedbb3a · 2026-09-29",
        },
      ],
    },
    {
      id: "trade-offs",
      title: "Limits",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "Assignment is per run.",
              text: "The draw uses the run id, so one user's successive runs can land on different revisions. There is no per-user stickiness.",
            },
            {
              label: "Shadows only see recorded worlds.",
              text: "A shadow can't show what a new side effect would do; it can only show that the candidate asked for something production didn't.",
            },
            {
              label: "Fractions are manual.",
              text: "Rusty doesn't ramp a canary for you. Each change is an explicit, attributed act.",
            },
          ],
        },
      ],
    },
  ],
  sources: [
    { path: "rusty-core/src/deploy.rs", what: "DeploymentRevision, DeploymentPointer, deployment_admission" },
    { path: "rusty-core/src/learn.rs", what: "canary_admits, CANARY_DRAW_DOMAIN" },
    { path: "rusty-core/src/effects.rs", what: "EffectAdmissionContext::shadow" },
    { path: "rusty-server/tests/release_gates.rs", what: "Canary and shadow end-to-end tests" },
    { path: "docs/operations-plane-design.md", what: "The R0.12 design" },
  ],
  deeper: [
    { book: "22-deploy-operate.html#shipping-changes-the-deployment-control-plane", label: "Deploy & operate: the deployment control plane" },
    { book: "20-evaluate.html#from-report-to-release-decision", label: "Evaluate: from report to release decision" },
  ],
};
