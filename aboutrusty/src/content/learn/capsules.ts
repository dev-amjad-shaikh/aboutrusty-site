import type { Lesson } from "./types";

export const capsules: Lesson = {
  id: "10.1",
  slug: "capsules",
  title: "Capsules",
  minutes: 16,
  source: "rusty-core/src/capsule_host.rs",
  summary:
    "A capsule is untrusted code, compiled to a WASM component, that runs inside the runtime with only the reach its manifest declares. An ungranted capability isn't checked and refused at the call: the host never links the import, so the guest has nothing to call. This lesson covers the manifest, how grants become imports, how tenant overlays narrow them, and how budgets and Cedar bound the rest.",
  glance: {
    learn: "Why an ungranted import is a door that was never built",
    try: "Toggling manifest grants and a tenant overlay to see what links",
    read: "The structural gate, intersect_grants, and the budget mechanisms",
  },
  interactive: true,
  sections: [
    {
      id: "problem",
      title: "The problem",
      blocks: [
        {
          type: "p",
          text: "A tool function in most agent frameworks runs in the host process with the host's filesystem, network, and environment. Its permissions are the deployment's permissions. If a model-chosen tool, a fetched plugin, or a third-party node misbehaves, nothing stops it reaching further than its author said it would, and nothing records what it tried.",
        },
        {
          type: "p",
          text: "Sandboxes that check each call at runtime are better, but a check is code that can have a bug or be skipped. You want untrusted code to be unable to name a capability it wasn't given.",
        },
      ],
    },
    {
      id: "manifest",
      title: "The manifest declares the reach",
      toc: "Manifest",
      blocks: [
        {
          type: "p",
          text: "Every capsule has a `CapsuleManifest` (`rusty-core/src/capsule.rs`). It names the capsule and its version, the SHA-256 of the `.wasm` component (`build_digest`), the WIT world it was built against, the effect classes it may produce, its capability grants, and its resource budget.",
        },
        {
          type: "p",
          text: "Capability grants are a closed enum. The set of grants is the capsule's whole reach:",
        },
        {
          type: "code",
          file: "rusty-core/src/capsule.rs",
          symbol: "CapabilityGrant",
          code: `pub enum CapabilityGrant {
    Filesystem { paths: Vec<String>, mode: FilesystemMode },
    Network { hosts: Vec<String>, protocols: Vec<String>, methods: Vec<String> },
    Secret { handles: Vec<String> },
    Tool { tools: Vec<String> },
    Model { models: Vec<String> },
    Clock,
}`,
        },
        {
          type: "p",
          text: "The clock is a grant rather than ambient authority because it's a determinism boundary: a guest that reads wall time can branch on something the journal doesn't hold. An empty grant set, the default, describes a pure-compute guest.",
        },
        {
          type: "p",
          text: "The manifest is content-addressed. `derive_capsule_id` hashes its canonical serialization, with scope lists sorted and grants held in a `BTreeSet`, so two declarations that agree in substance get the same `CapsuleId` and a tampered manifest fails its own address. Validation also checks that the declared effects cover what the grants imply: a network grant with a `POST` method implies `NonIdempotent`, so a manifest that declares only `ReadOnly` is refused. The host recomputes the build digest when it loads the bytes; a manifest naming bytes it wasn't built from doesn't load.",
        },
      ],
    },
    {
      id: "structural",
      title: "Structural denial",
      toc: "Structural denial",
      blocks: [
        {
          type: "p",
          text: "The capability host (`rusty-core/src/capsule_host.rs`, feature `wasm`) runs capsules as WASM Component Model guests on wasmtime. A component lists its imports. The one world this release ships, `rusty:capsule/world@0.1.0`, has two capability imports: `rusty:capsule/net@0.1.0` (a `fetch` function) and `rusty:capsule/clock@0.1.0` (`now-millis`).",
        },
        {
          type: "p",
          text: "Before linking anything, the host walks the component's import list. An import whose capability kind has no grant ends the invocation, with a journaled denial:",
        },
        {
          type: "code",
          file: "rusty-core/src/capsule_host.rs",
          symbol: "run_invocation",
          code: `for (import, _extern) in inner.component.component_type().imports(&inner.engine) {
    match capability_for_import(import) {
        Some(kind) if any_grant_of_kind(&manifest.capabilities, kind) => {}
        Some(kind) => {
            let denial = CapsuleDenial::unscoped(
                inner.capsule_id.clone(),
                kind,
                format!(
                    "the component imports \`{import}\` but the manifest grants no \\
                     \`{kind:?}\` capability — the import does not exist for this guest"
                ),
            );
            // journaled as RunEventKind::CapsuleDenied, then:
            return Err(host_err(format!("structural denial: {}", denial.detail)));
        }
        None => {
            return Err(host_err(format!(
                "the component imports \`{import}\`, which no supported world declares — \\
                 fail closed rather than guess"
            )));
        }
    }
}`,
        },
        {
          type: "p",
          text: "Then it builds a `Linker` and defines only the granted instances: the `net` instance when some grant is `Network`, the `clock` instance when one is `Clock`. A guest without the import can't attempt the capability at all. There's no symbol to call and no handle to forge. This is the object-capability idea: holding the reference is the permission, and a component that was never handed one has no name to ask for.",
        },
        {
          type: "note",
          title: "What it does and doesn't prove",
          text: "Structural denial proves a guest without the import can't reach the capability. It says nothing about a guest with the import. A linked import is a door, and the grant says how far it opens.",
        },
      ],
    },
    {
      id: "scoped",
      title: "Scoped denial",
      toc: "Scoped denial",
      blocks: [
        {
          type: "p",
          text: "A network grant names hosts, protocols, and methods. The `fetch` import is linked, but its implementation checks the exact call against the grants before any socket opens:",
        },
        {
          type: "code",
          file: "rusty-core/src/capsule.rs",
          symbol: "network_grant_covers",
          code: `grants.into_iter().any(|grant| match grant {
    CapabilityGrant::Network {
        hosts,
        protocols,
        methods,
    } => {
        hosts.iter().any(|h| h == host)
            && protocols.iter().any(|p| p == protocol)
            && methods.iter().any(|m| m == method)
    }
    _ => false,
})`,
        },
        {
          type: "p",
          text: "A call outside the grant is refused in-band and journaled as a `CapsuleDenial` naming the grant that was absent: granted `api.example.com`, attempted `evil.example.com`, absent grant `network` scoped to `evil.example.com`. This half is a runtime check, and it can only run when the attempt arrives. Structural denials carry an empty-scope absent grant; scoped ones name the missing scope. Every granted use is journaled too, as a `CapsuleCall`.",
        },
        {
          type: "p",
          text: "A network grant with no host-side connector configured fails at invocation. Egress is always an explicit path the server provides, never ambient.",
        },
      ],
    },
    {
      id: "try-it",
      title: "Try it",
      blocks: [
        {
          type: "p",
          text: "The guest below imports `net` and optionally `clock`, and tries to fetch two hosts. Toggle grants on the manifest and on a tenant overlay, and watch which imports link and which calls run.",
        },
        { type: "diagram", name: "capsule-grants" },
      ],
    },
    {
      id: "overlays",
      title: "Overlays only narrow",
      toc: "Overlays",
      blocks: [
        {
          type: "p",
          text: "An operator can attach a `CapsuleOverlay` to a tenant: a grant ceiling for some or all of the tenant's capsules. The effective grant set is the intersection of the manifest's grants and the overlay's, computed per capability kind and per scope list:",
        },
        {
          type: "code",
          file: "rusty-core/src/capsule.rs",
          symbol: "intersect_grants",
          code: `(
    CapabilityGrant::Network { hosts: manifest_hosts, protocols: manifest_protocols, methods: manifest_methods },
    CapabilityGrant::Network { hosts: overlay_hosts, protocols: overlay_protocols, methods: overlay_methods },
) => {
    let hosts = common(manifest_hosts, overlay_hosts);
    let protocols = common(manifest_protocols, overlay_protocols);
    let methods = common(manifest_methods, overlay_methods);
    (!hosts.is_empty() && !protocols.is_empty() && !methods.is_empty()).then_some(
        CapabilityGrant::Network { hosts, protocols, methods },
    )
}`,
        },
        {
          type: "p",
          text: "Grants of different kinds never meet. A same-kind pair with nothing in common drops out, so an overlay naming a host the manifest never granted removes network access instead of adding the host. Filesystem modes take the narrower of the two. No code path computes a union, so a reviewer checking \"overlays can't widen\" reads this one function.",
        },
        {
          type: "p",
          text: "Resolution (`POST /capsules/resolve`) runs `compose_admission` in `rusty-server/src/capsule_policy.rs`: it applies every overlay that targets the capsule, in name order, and journals the effective set on the `capsule_resolved` event along with the deciding policy version.",
        },
        {
          type: "note",
          title: "Where the effective set is enforced",
          text: "The host links imports from the grants on the manifest it's constructed with. In the A2A bridge (`rusty-server/src/a2a.rs`), the host is built from the registered manifest, and each granted use is re-authorized against the live Cedar policy. The widget above shows the host linking from the effective set.",
        },
      ],
    },
    {
      id: "cedar",
      title: "Cedar decides legality",
      toc: "Cedar",
      blocks: [
        {
          type: "p",
          text: "With the server's `capsules` feature, authorization is written in Cedar and registered as versioned policy text (`POST /capsule_policies/versions`, activated with `POST /capsule_policies/active`). Three Cedar actions exist:",
        },
        {
          type: "rows",
          rows: [
            { label: "AdmitCapsule", text: "May this tenant load this capsule at all? Checked at registration and again at resolution, so a policy change between the two applies." },
            { label: "UseCapability", text: "One request per declared grant. A manifest may declare fewer grants than policy permits; any forbidden grant refuses the admission, with a journaled denial per grant." },
            { label: "AttachOverlay", text: "May this overlay be attached? The request carries a `widens` flag computed by `grants_beyond`, so a policy can refuse overlays that ask for more than the manifest declared." },
          ],
        },
        {
          type: "code",
          file: "rusty-server/tests/capsule_policy.rs",
          symbol: "FORBID_NETWORK",
          code: `permit(principal, action, resource);
forbid(principal, action == Action::"UseCapability", resource)
    when { context.kind == "network" };`,
        },
        {
          type: "p",
          text: "Policy decides legality; the intersection decides narrowing. An overlay crafted past the policy plane still can't widen anything. Cedar can't un-admit a capsule that's already running, so each granted import re-checks the live policy through the `GrantRecheck` seam before it acts. A revoked grant fails at the next use, journaled against the new policy version.",
        },
        {
          type: "p",
          text: "A tenant with no active policy admits capsules without Cedar checks. That keeps existing registries working after an upgrade; enforcement starts when the operator activates the first policy. A server built without the feature refuses the policy routes with `503 capsule_policy_unavailable`.",
        },
      ],
    },
    {
      id: "budgets",
      title: "Budgets the host enforces",
      toc: "Budgets",
      blocks: [
        {
          type: "p",
          text: "`ResourceBudget` declares fuel, memory, wall time, output size, tokens, and cost. The host maps the first three onto wasmtime mechanisms:",
        },
        {
          type: "rows",
          rows: [
            { label: "fuel", tone: "green", text: "The CPU budget. `store.set_fuel` meters instructions deterministically, so the bound replays the same way." },
            { label: "max_memory_bytes", tone: "green", text: "A `ResourceLimiter` refuses linear-memory growth past the cap." },
            { label: "wall_time_ms", tone: "green", text: "Epoch interruption. A ticker advances the engine epoch every 5 ms (`EPOCH_TICK_MS`), and the store's deadline is set in ticks, so a guest that stops yielding is preempted." },
            { label: "max_output_bytes", tone: "green", text: "Checked at the output gate, which also requires the result to parse as JSON." },
          ],
        },
        {
          type: "p",
          text: "At admission the declared budget is clamped field by field against the run's budget and the tenant ceiling (`ResourceBudget::clamp`), and the clamp is journaled. Tokens and cost refuse instead of clamping: a declared `max_tokens` or `max_cost_usd` above the tightest bound is a `422`, because silently giving the capsule a smaller accounting basis would misreport where the money went.",
        },
      ],
    },
    {
      id: "proof",
      title: "The release proof",
      toc: "Release proof",
      blocks: [
        {
          type: "p",
          text: "`rusty-server/tests/capsules_release.rs` registers two capsules with the same network grant for `api.example.com`. One fetches that host, the other fetches `evil.example.com`. It sends three A2A messages on one context: the granted fetch, the out-of-scope fetch, and a call that requires `filesystem`, which the v1 world doesn't import. Then it asserts the connector ran once:",
        },
        {
          type: "code",
          file: "rusty-server/tests/capsules_release.rs",
          symbol: "visible_denial_release_proof",
          code: `// Both refusals happened before egress: one fetch across three
// capsule executions.
assert_eq!(
    connector.calls.load(Ordering::Relaxed),
    1,
    "only the granted fetch ever reached the connector"
);`,
        },
        {
          type: "p",
          text: "The test then reads both denials back from `GET /runs/{id}/events`, verifies the run's signed receipt over the journal, and checks that altering a journaled event fails verification. The refusals are evidence you can show later, not log lines.",
        },
        { type: "p", text: "Run it with the feature on:" },
        { type: "code", lang: "shell", code: "cargo test -p rusty-agent-server --features capsules --test capsules_release" },
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
              label: "One world, two imports.",
              text: "The v1 world links network and clock only. Filesystem, secret, tool, and model grants are in the manifest contract, but no import for them exists yet.",
            },
            {
              label: "A newer toolchain.",
              text: "The `capsules` feature pulls in wasmtime and `cedar-policy`, lengthens clean builds, and needs Rust 1.89. Default builds are unaffected.",
            },
            {
              label: "Invocation cost, not a machine boundary.",
              text: "Capsules isolate untrusted invocations inside one process. For hostile multi-tenant processes, a microVM around the whole server is still the right tool, and the two compose.",
            },
          ],
        },
      ],
    },
  ],
  takeaways: [
    "The manifest declares every capability a capsule may reach; its id is the hash of that declaration.",
    "The host links only granted imports. An ungranted import is refused before the guest runs.",
    "Granted imports check their scope per call. Every use and every denial is journaled.",
    "Effective grants are manifest ∩ overlay. Overlays can remove reach, never add it.",
    "Fuel, a memory limiter, and epoch interruption bound what a granted capsule can consume.",
  ],
  quiz: [
    {
      q: "A capsule's component imports `rusty:capsule/clock@0.1.0` and its manifest grants only network. What happens when it's invoked?",
      a: "The host refuses the invocation before instantiating it, journaling a CapsuleDenied with an empty-scope absent grant of kind Clock. No guest code runs.",
    },
    {
      q: "The manifest grants network to api.example.com. A tenant overlay grants network to files.example.com only. What's the effective network reach?",
      a: "None. The two grants share no host, so the intersection drops the network grant entirely.",
    },
    {
      q: "Why does a scoped denial need a runtime check when structural denial doesn't?",
      a: "The fetch import is linked, so the guest can call it. Whether the host, protocol, and method are inside the grant is only known when the call arrives.",
    },
    {
      q: "A capsule declares max_cost_usd above the run's bound. Clamp or refuse?",
      a: "Refuse, with a 422. Fuel, memory, wall time, and output size clamp; tokens and cost refuse.",
    },
  ],
  sources: [
    { path: "rusty-core/src/capsule.rs", what: "CapsuleManifest, CapabilityGrant, intersect_grants, ResourceBudget" },
    { path: "rusty-core/src/capsule_host.rs", what: "The structural gate, linking, fuel, epochs, the output gate" },
    { path: "rusty-server/src/capsule_policy.rs", what: "Cedar actions, compose_admission" },
    { path: "rusty-server/tests/capsules_release.rs", what: "The visible-denial release proof" },
    { path: "docs/capsules-design.md", what: "The capsule rule and its lineage" },
  ],
  related: [
    { label: "Book: Capsules", href: "/guide/07-capsules.html" },
    { label: "Lesson 9.3: Canary and shadow", href: "/learn/canary-and-shadow" },
  ],
};
