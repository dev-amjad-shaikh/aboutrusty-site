import type { Lesson } from "./types";

export const checkpoints: Lesson = {
  id: "3.1",
  slug: "checkpoints",
  title: "Checkpoints",
  minutes: 14,
  source: "rusty-core/src/checkpoint.rs",
  before: ["2.3"],
  summary:
    "A checkpoint is a saved copy of a thread's state at a super-step boundary, plus the list of nodes that run next. Resume, human approval, time travel, and crash recovery all read from it.",
  glance: {
    learn: "What a checkpoint stores and when it's written",
    try: "Forking a thread and replaying it from an old checkpoint",
    read: "The Checkpoint struct and the Checkpointer trait",
  },
  interactive: true,
  sections: [
    {
      id: "contents",
      title: "What a checkpoint holds",
      toc: "What it holds",
      blocks: [
        {
          type: "p",
          text: "An agent run can take seconds or weeks. It can wait for a person, outlive a deploy, or die with its process, and anything held only in memory is lost with it. So Rusty saves the run at every step boundary. The super-step loop never applies half a step ([2.3](/learn/super-step-loop)), which makes each boundary a consistent point to save and resume from.",
        },
        { type: "p", text: "The struct is small. The fields that matter for resuming are the thread, the step, the state, and the next nodes:" },
        {
          type: "code",
          file: "rusty-core/src/checkpoint.rs",
          symbol: "Checkpoint",
          code: `pub struct Checkpoint {
    pub id: String,              // UUID; also the handle for time travel
    pub thread_id: String,       // threads cannot see each other's state
    pub step: usize,             // zero-based super-step index
    pub state: State,            // the full channel state at the boundary
    pub next_nodes: Vec<String>, // the nodes that run in the next step
    pub created_at: DateTime<Utc>,
    pub base: Option<String>,    // delta link, storage-internal
    pub header: CheckpointHeader,
    pub journal_ref: Option<JournalRef>,
}`,
        },
        {
          type: "p",
          text: "`header` records the checkpoint format version, the graph's version and topology hash, and the active policy version. `journal_ref` points at the run journal's head at that moment, which ties the saved state to the events that produced it.",
        },
        {
          type: "p",
          text: "The executor writes one after routing in every step, and one when a run suspends for an interrupt, a step or spend ceiling, or a cancellation. It never writes in the middle of a node. A node that was running when the process died runs again from its start.",
        },
      ],
    },
    {
      id: "trait",
      title: "The Checkpointer trait",
      toc: "Checkpointer",
      blocks: [
        { type: "p", text: "Storage is one trait. The executor holds it as `Arc<dyn Checkpointer>`:" },
        {
          type: "code",
          file: "rusty-core/src/checkpoint.rs",
          symbol: "trait Checkpointer",
          code: `#[async_trait]
pub trait Checkpointer: Send + Sync {
    async fn put(&self, checkpoint: Checkpoint) -> Result<()>;
    async fn get_latest(&self, thread_id: &str) -> Result<Option<Checkpoint>>;
    async fn list(&self, thread_id: &str) -> Result<Vec<Checkpoint>>;
    async fn get_by_id(&self, thread_id: &str, checkpoint_id: &str) -> Result<Option<Checkpoint>> {
        // default: search list()
    }
    async fn fork_thread(
        &self,
        src_thread: &str,
        dst_thread: &str,
        at_checkpoint_id: Option<&str>,
    ) -> Result<usize> {
        // default: copy list() up to the checkpoint into dst_thread
    }
}`,
        },
        {
          type: "p",
          text: "`put` never overwrites: ids are unique, and a duplicate id is an error. `get_by_id` and `fork_thread` have default implementations built on `list`.",
        },
        { type: "p", text: "Three [[Checkpointer|backends]] ship with the runtime:" },
        {
          type: "rows",
          rows: [
            {
              label: "InMemoryCheckpointer",
              text: "A mutex over a map of threads. Lost on restart. Use it in tests and for runs that don't need to survive the process.",
            },
            {
              label: "JsonFileCheckpointer",
              text: "One file per checkpoint at `{dir}/{thread_id}/{checkpoint_id}.json`, plus a `latest` pointer file. Every write goes to a temp file and is renamed into place, so a crash never leaves a half-written checkpoint.",
            },
            {
              label: "PostgresCheckpointer",
              text: "Behind the crate feature `postgres`. One table, `rusty_checkpoints`, with the primary key `(thread_id, checkpoint_id)`. `PostgresCheckpointer::connect` creates or migrates the table before returning.",
            },
          ],
        },
        {
          type: "p",
          text: "A file written by a newer checkpoint format is refused with a message naming both versions. Older formats load, because new fields are only ever added with serde defaults.",
        },
        {
          type: "predict",
          question: "`human_in_loop` runs `draft → approve → publish` with a `JsonFileCheckpointer`. The first call suspends at `approve`; the second resumes and finishes. How many checkpoint files does the thread end up with?",
          options: ["2: one per call", "3: one per node", "4", "6: one per node per call"],
          answer: 2,
          explain:
            "One after step 0 (`draft` ran, next `approve`), one when the run suspends at step 1 (next is still `approve`), one after the resumed step 1 (next `publish`), and one after step 2 (next nothing). The lab below lists them.",
        },
        {
          type: "lab",
          title: "Checkpoints on disk",
          intro:
            "Run the approval example, then look at what the `JsonFileCheckpointer` left in the thread's directory. The `jq` line prints each file's step, next nodes, the channels stored in it, and its `base`.",
          commands: `cd rusty-core
cargo run --example human_in_loop
cd target/examples-checkpoints/human-in-loop/hitl-demo-thread
ls
jq -c -s 'sort_by(.created_at)[] | {id: .id[0:8], step, next_nodes, state: (.state | keys), base: .base[0:8]}' *.json`,
          output: `=== human_in_loop: interrupt/resume with JsonFileCheckpointer ===
…
[phase 1] run suspended at \`approve\`
…
[phase 1] durable checkpoint id: 3039ee2d-8768-47b3-93a8-b57c52860942
…
[phase 2] run completed after resume
…

3039ee2d-8768-47b3-93a8-b57c52860942.json
4e825d41-f3e5-432f-af1d-485f4d8e8e99.json
974345b1-0c5c-4c07-b257-531b9951ef03.json
eebb836a-a76d-483d-8a2b-94a3bf3deadb.json
latest

{"id":"974345b1","step":0,"next_nodes":["approve"],"state":["draft"],"base":null}
{"id":"3039ee2d","step":1,"next_nodes":["approve"],"state":[],"base":"974345b1"}
{"id":"4e825d41","step":1,"next_nodes":["publish"],"state":["approval"],"base":"3039ee2d"}
{"id":"eebb836a","step":2,"next_nodes":[],"state":["published"],"base":"4e825d41"}`,
          capturedAt: "fedbb3a · 2026-09-29",
          exercise: {
            change:
              "Delete the thread directory, then construct the checkpointer with `JsonFileCheckpointer::with_delta_policy(checkpoint_dir, rusty_agent_runtime::checkpoint::DeltaPolicy::full_only())` and run the example again.",
            predict: "What changes in the `jq` output?",
            result:
              "Still four files with the same steps and next nodes, but every `base` is null and every file stores the whole state: `[\"draft\"]`, `[\"draft\"]`, `[\"approval\",\"draft\"]`, then `[\"approval\",\"draft\",\"published\"]`. The default policy stored only the channels that changed, which is why the suspension checkpoint above holds an empty state.",
          },
        },
      ],
    },
    {
      id: "recency",
      title: "Latest means last written",
      toc: "Latest",
      blocks: [
        {
          type: "p",
          text: "The `latest` file in the lab is a pointer to the checkpoint stored last. That is what `get_latest` returns, even when a checkpoint with a higher step number exists.",
        },
        {
          type: "predict",
          question: "A thread has checkpoints for steps 0 to 5. You replay it from step 2 on the same thread id, and the replay writes new checkpoints for steps 2 and 3. Which checkpoint does the next resume load?",
          options: ["Step 5, the highest step", "Step 3 from the replay, the last one written", "Step 2, where the replay started"],
          answer: 1,
          explain:
            "Recency follows insertion order. The replay started a newer timeline, and the next resume has to continue it, so the last write wins even though its step number is lower.",
        },
        {
          type: "p",
          text: "`list` uses a different, fixed order, ascending by `(step, created_at, id)`, so every backend lists a thread the same way. `fork_thread` depends on that order when it cuts history at a checkpoint.",
        },
      ],
    },
    {
      id: "time-travel",
      title: "Time travel and forks",
      toc: "Time travel",
      blocks: [
        {
          type: "p",
          text: "To rerun from an earlier point, set `RunConfig::with_checkpoint_id`. The executor loads that checkpoint instead of the latest one and continues from its state and next nodes. It combines with `with_resume`: the checkpoint id picks where the run restarts, and the resume value goes to the first step.",
        },
        {
          type: "p",
          text: "Replaying on the original thread appends to its history. The safer pattern is to [[Fork|fork]] first, then replay the fork. Step through it:",
        },
        { type: "diagram", name: "fork-tree" },
        { type: "p", text: "In code:" },
        {
          type: "code",
          lang: "rust",
          code: `// copy history up to and including checkpoint cp_2 into a new thread
checkpointer.fork_thread("t-main", "t-try-2", Some(&cp_2)).await?;

let outcome = executor
    .run(&graph, &spec, State::new(),
         RunConfig::new("t-try-2").with_checkpoint_id(cp_2.clone()))
    .await?;`,
        },
        {
          type: "p",
          text: "`fork_thread` copies checkpoints oldest first and keeps their ids, steps, and states; only `thread_id` changes. It refuses to fork a thread onto itself, because the ids would collide.",
        },
        {
          type: "p",
          text: "The server exposes the same operations. `POST /threads/{thread_id}/fork` takes `{\"new_thread_id\", \"checkpoint_id\"}` (both optional), `POST /threads/{thread_id}/history` lists checkpoints with `limit` and `before`, and a run created with `\"checkpoint\": {\"checkpoint_id\": \"…\"}` replays from that point.",
        },
      ],
    },
    {
      id: "delta-checkpoints",
      title: "Delta checkpoints and copy-on-write state",
      toc: "Deltas",
      blocks: [
        {
          type: "p",
          text: "Saving the full [[Checkpoint|checkpoint]] state at every step gets expensive when the state is large and mostly unchanged. Two changes in R0.7 address the two costs separately.",
        },
        {
          type: "p",
          text: "**Copying in memory.** Each channel in `State` sits behind an `Arc`, so `State::clone()` bumps one reference count per channel instead of copying values. The snapshot each node receives in a super-step is a clone like this. The reducers merge in place when nothing else holds the channel, and copy only that channel when a snapshot or checkpoint still shares it. In `docs/benchmarks.md`, the six clones of one super-step cost about 26 ns at both 1 MB and 10 MB of state.",
        },
        {
          type: "p",
          text: "**Bytes on disk.** `JsonFileCheckpointer` and `PostgresCheckpointer` can store a checkpoint as a delta: only the channels that changed since the previous one, with `base` naming it. `DeltaPolicy` bounds the chain:",
        },
        {
          type: "code",
          file: "rusty-core/src/checkpoint.rs",
          symbol: "DeltaPolicy::default",
          code: `Self {
    max_chain_len: 32,
    max_byte_ratio: 0.8,
}`,
        },
        {
          type: "p",
          text: "Click a checkpoint in the chain below to see what a resume from it has to read:",
        },
        { type: "diagram", name: "delta-chain" },
        {
          type: "p",
          text: "In the lab, the step-1 suspension checkpoint changed nothing, so its delta is an empty state with a `base`. After 32 deltas, or when a delta would be at least 80% the size of the full state, the backend writes a full snapshot. That keeps every resume to at most one full read plus 31 small ones. `put` always receives a full checkpoint and every read returns a full one, so callers never see a delta. `fork_thread` writes full snapshots, so a fork never depends on another thread's chain.",
        },
        {
          type: "p",
          text: "The benchmark for a 1000-step run over 1 MB of state went from 1.05 GB on disk to 33.0 MB, about 32 times fewer bytes, with wall time roughly flat. Deltas save disk, replication, and backup cost; they don't make a step faster.",
        },
        {
          type: "note",
          title: "One process per directory",
          text: "`JsonFileCheckpointer` serializes writes per thread inside one process. It assumes a single process writes to its directory. For several server processes, use `PostgresCheckpointer`.",
        },
      ],
    },
  ],
  quiz: [
    {
      q: "The process dies while a node is halfway through. What does the resumed run do with that node?",
      a: "It runs the node again from its start, using the state and next nodes of the last checkpoint.",
    },
    {
      q: "Does code that reads checkpoints need to handle deltas?",
      a: "No. Backends fold delta chains internally, and every read method returns a full checkpoint.",
    },
  ],
  sources: [
    { path: "rusty-core/src/checkpoint.rs", what: "Checkpoint, Checkpointer, JsonFileCheckpointer, DeltaPolicy" },
    { path: "rusty-core/src/checkpoint_postgres.rs", what: "PostgresCheckpointer" },
    { path: "rusty-core/src/executor.rs", what: "RunConfig::with_checkpoint_id, resume path" },
    { path: "docs/benchmarks.md", what: "Copy-on-write and delta checkpoint measurements" },
  ],
  deeper: [{ book: "10-durability.html#level-one-the-checkpointed-run", label: "Durability: the checkpointed run" }],
  related: [{ label: "3.2 Interrupts", href: "/learn/interrupts" }],
};
