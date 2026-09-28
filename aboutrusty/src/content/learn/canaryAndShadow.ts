import type { Lesson } from "./types";

export const canaryAndShadow: Lesson = {
  id: "9.3",
  slug: "canary-and-shadow",
  title: "Canary and shadow",
  minutes: 13,
  source: "rusty-core/src/deploy.rs",
  summary:
    "Before a new revision of an agent serves everyone, you want evidence. A canary sends a fixed fraction of real runs to it. A shadow runs it against a recorded run without letting it touch the world. This lesson covers how Rusty assigns runs to a canary reproducibly, and how a shadow run is kept from causing side effects.",
  glance: {
    learn: "How a run is assigned to canary or active, and why it replays the same",
    try: "Moving the canary fraction over real SHA-256 draws",
    read: "canary_admits and the shadow admission boundary",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "A new prompt passes the eval suite and still misbehaves in production. You want it to serve a small share of traffic first, and you want to know later exactly which runs it served. A random coin flip per request gives you the first but not the second: replay the run and the coin lands differently.",
        },
        {
          type: "p",
          text: "Some changes are too risky even for a small share. For those you want to see what the new revision would have done, without it charging a card or sending an email.",
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
          text: "A `DeploymentRevision` is an immutable, content-addressed description of what runs: the graph and its topology hash, the assistant, and the pinned registry candidates (prompts, policies). Its id is the SHA-256 of that content, so a changed declaration is a new id. There is no in-place update.",
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
          text: "A canary is a revision id and a `fraction` in (0, 1]. When a run starts, `deployment_admission` decides which revision serves it. It doesn't use a random number generator. It hashes values the run already has:",
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
        { type: "p", text: "The draws below are computed in your browser with the same formula, over twenty example run ids:" },
        { type: "diagram", name: "canary-draw" },
        {
          type: "p",
          text: "Raising the fraction only adds runs to the canary; a run that was in stays in, because its draw doesn't change. There is no automatic traffic controller: each fraction change is a declared, journaled act, made with `PUT /deployments/environments/{name}/canary` and `{\"revision_id\", \"fraction\", \"author\"}`.",
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
          text: "`POST /deployments/shadows` runs a candidate revision against a recorded source run. The server gives the shadow run an `EffectAdmissionContext::shadow`, which decides per effect class what may execute:",
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
          text: "An environment can declare a release gate: an eval policy and a dataset version. Promoting a revision into it, or declaring a canary there, first evaluates the revision against the environment's current one. The gate allows only when the verdict is `Allow` and every check passed, and the decision is journaled either way. An environment with `approval_required` also needs an approval token minted for that exact revision.",
        },
      ],
    },
    {
      id: "trade-offs",
      title: "Trade-offs",
      blocks: [
        {
          type: "rows",
          rows: [
            {
              label: "Assignment is per run, not per user.",
              text: "The draw uses the run id, so one user's successive runs can land on different revisions.",
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
  takeaways: [
    "Revisions are content-addressed and immutable; pointers move, revisions don't.",
    "The canary draw is SHA-256 over journaled values, so a run's assignment replays exactly.",
    "Shadow runs execute only Pure and ReadOnly effects and are served recorded outcomes for the rest.",
    "Promotion and canary declaration pass through the environment's gate, and every decision is journaled.",
  ],
  quiz: [
    {
      q: "You raise a canary from 0.1 to 0.2. Does any run that was on the canary move back to active?",
      a: "No. Each run's draw is fixed by its inputs; a higher fraction only admits more runs.",
    },
    {
      q: "Why does the shadow refuse `Idempotent` effects, which are safe to retry?",
      a: "Safe to retry under one key isn't safe to execute from a second revision. A shadowed charge is still a charge.",
    },
    {
      q: "A shadow's verdict shows unserved effects. What does that tell you?",
      a: "The candidate asked for effects the recorded run doesn't have, so its behavior diverged from production.",
    },
  ],
  sources: [
    { path: "rusty-core/src/deploy.rs", what: "DeploymentRevision, DeploymentPointer, deployment_admission" },
    { path: "rusty-core/src/learn.rs", what: "canary_admits, CANARY_DRAW_DOMAIN" },
    { path: "rusty-core/src/effects.rs", what: "EffectAdmissionContext::shadow" },
    { path: "rusty-server/tests/release_gates.rs", what: "Canary and shadow end-to-end tests" },
    { path: "docs/operations-plane-design.md", what: "The R0.12 design" },
  ],
  related: [{ label: "Book: Deploy & operate", href: "/guide/22-deploy-operate.html#shipping-changes-the-deployment-control-plane" }],
};
