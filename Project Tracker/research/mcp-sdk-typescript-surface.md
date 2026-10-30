# The MCP TypeScript SDK Surface at 1.30.0: What We Pin, What It Offers, and the v2 Cliff One Day Past Our Pin

**Document ID:** RSH-006
**Version:** 1.1
**Date:** 2026-08-27
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-27 | Sandro & Claude | Initial creation. Grounds the SDK surface at the resolved version for the `mcp-surface-critic` skill build. Records the v2 / `2026-07-28` protocol break as a decay.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-08-27 | Sandro & Claude | **Five of §14's seven queued questions settled by probe** against the installed 1.30.0 with a control twin, before the reference derived from this document was finished. §14 rewritten from "nothing was executed" to the measured results. The probe also found what the docs did not predict — **an unknown key in `arguments` is silently accepted**, and the emitter adds `additionalProperties: false` to an `outputSchema` but not to an `inputSchema`, so a bare Zod raw shape is accidentally permissive. D-241's load-bearing fact is now measured rather than read. |

---

## 2. The finding

**Ground mode — no verdict.** This document catalogues what `@modelcontextprotocol/sdk` offers at
the version this repo actually resolved, so that a reviewer of `mcp/server.ts` can tell a deliberate
omission from an unknown one.

One fact dominates and it is not about tool design. **The protocol moved one day after our pin was
published.** MCP spec revision `2026-07-28` removes the `initialize` handshake entirely in favour of
per-request `_meta`, and the TypeScript SDK shipped **v2.0.0** on 2026-07-27 under new package names.
Our `1.30.0` published **2026-07-27** and is the terminal 1.x release; it speaks 2025-era protocol
only. It is **not** deprecated on npm and carries bug and security fixes for at least six months past
v2 — a floor of roughly **2027-01-27**. This is a dated migration, not a fire.

Second fact, load-bearing for any review: **`INT-001` is on the current release of the v1 line, not a
stale one.** A reviewer seeing "1.x" should not read "behind."

**Mode:** Ground · **Verdict:** — _(no verdict; Ground mode)_ · **Confidence:** High — installed
source plus official docs · **Feeds:** `mcp-surface-critic` / `references/sdk-1.30.md`; `INT-001`
maintenance; **R12** · **Researched:** 2026-08-27

### Evidence tiers used in this document

`[SPEC]` official MCP specification or modelcontextprotocol.io docs · `[SDK]` the SDK repository,
its README, changelog, or source · `[NPM]` the npm registry · `[VENDOR]` Anthropic engineering
writing or the published `mcp-builder` skill · `[MEASURED]` read from `node_modules` on this machine
· `[INFERRED]` our reasoning.

---

## 3. The version fact, measured

`[MEASURED]` `Project Tracker/package.json` declares:

```json
"@modelcontextprotocol/sdk": "^1.29.0"
```

`[MEASURED]` `node_modules/@modelcontextprotocol/sdk/package.json` resolves to **`1.30.0`**.

**The declared floor and the resolved version are different, and the floor is what binds a fresh
clone.** Anything this pack recommends must exist at **1.29.0**, or `npm ci` on another machine
produces a build that does not compile. This is the same hazard class as **R11** (the unpinned global
`@sap/cds-dk`), and it is why **R12** is minted below.

`[NPM]` `@modelcontextprotocol/sdk` dist-tag `latest` is **`1.30.0`, published 2026-07-27**, not
marked deprecated.
`[NPM]` `@modelcontextprotocol/server` is **`2.0.0`, published 2026-07-27**.

`[MEASURED]` The server declares its own identity as `{ name: "project-tracker", version: "1.0.0" }`
at `mcp/server.ts:25`, while `package.json` declares `"version": "0.0.1"`. Nothing reconciles the
two and nothing asserts either.

---

## 4. Tools — the `registerTool` config, key by key

`[SDK]` The modern registration APIs are `registerTool`, `registerResource`, `registerPrompt`. The
older `server.tool(...)` overloads remain in the type definitions and are deprecated; raw
`setRequestHandler(ListToolsRequestSchema, …)` is the low-level escape hatch and is not the
recommended path.

Config keys accepted at 1.30.0:

| Key            | Type                        | Used by `INT-001`?                                                                                                          |
| -------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `title`        | `string`                    | **Yes** — `mcp/server.ts:45`, from `verb.title`, at the top level (the modern location, not the legacy `annotations.title`) |
| `description`  | `string`                    | **Yes** — `verb.description`                                                                                                |
| `inputSchema`  | Zod raw shape or `z.object` | **Yes** — `verb.inputShape`, a `ZodRawShape`                                                                                |
| `outputSchema` | Zod raw shape or `z.object` | **No**                                                                                                                      |
| `annotations`  | `ToolAnnotations`           | **Partially** — `readOnlyHint` only                                                                                         |
| `_meta`        | `Record<string, unknown>`   | **No**                                                                                                                      |

`[SPEC]` Tool names SHOULD be 1–128 characters from `A-Za-z0-9_-.`, with no spaces, unique within a
server. All eleven of ours comply.

`[VENDOR]` Anthropic specifies snake_case, action-oriented, **with a service prefix** —
`slack_send_message`, not `send_message` — because a server runs alongside others.
`[SPEC]` The spec independently warns that aggregating clients "MAY encounter naming collisions" and
that `serverInfo.name` "SHOULD NOT be relied upon for disambiguation."

`[INFERRED]` Our `next_action` and `project_view` are the two most collision-prone names on the
surface. Renaming breaks every caller, and in a single-server config the risk is hypothetical —
recorded as a fact, not a recommendation.

`[SPEC]` `tools/list` is itself paginated (`cursor` / `nextCursor`), and `2026-07-28` adds caching
hints plus a requirement that tool ordering be **deterministic**, because it "improves LLM prompt
cache hit rates." `[INFERRED]` Our `VerbRegistry.DEFINITIONS` is a source-order array, so ordering is already
deterministic — by construction rather than by intent.

### Descriptions

`[SDK]` The `description` must be provided explicitly; **JSDoc comments are not extracted**.

`[VENDOR]` The reference description format has named sections: prose summary, an explicit statement
of what the tool does _not_ do, `Args:` with types and ranges, `Returns:` with the schema inline,
`Examples:` carrying both "use when" and "don't use when", and `Error Handling:` listing the literal
error strings. `[VENDOR]` Description refinement is credited as a material contributor to Claude
Sonnet 3.5's SWE-bench Verified result — "even small refinements… yield dramatic improvements."

`[MEASURED]` Our eleven descriptions are one-line summaries. The field-level `.describe()` calls are
good — `"Story reference, as {workspace-slug}/{story-id}"` is exactly the documented shape — but no
description carries the methodology the verb enforces. A model calling `start_stage` cannot learn
from it that a blocked stage will be rejected, what a valid stage code is, or that `next_action`
exists to answer "what next."

---

## 5. Tool annotations — four hints, and two of the defaults are pessimistic

`[SDK]` `ToolAnnotations`, with **spec defaults when the key is absent**:

| Annotation        | Default when omitted | Meaning                                                                                       |
| ----------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `title`           | —                    | Human-readable display name                                                                   |
| `readOnlyHint`    | `false`              | Does not modify its environment                                                               |
| `destructiveHint` | **`true`**           | May perform destructive or irreversible updates. Meaningful only when `readOnlyHint` is false |
| `idempotentHint`  | `false`              | Repeat calls with the same arguments add no further effect                                    |
| `openWorldHint`   | **`true`**           | Interacts with an open world of external entities                                             |

**The consequence is the sharpest single fact in this document.** `[MEASURED]` `mcp/server.ts:48`
passes `annotations: { readOnlyHint: verb.readOnly }` and nothing else. Because absent
`destructiveHint` and `openWorldHint` both default to **true**, our **nine write verbs currently
advertise themselves to any policy-aware host as potentially irreversible and reaching external
systems.** Neither is true: they write to a local CAP store, most are additive-only, and D-50 makes
nothing deletable.

`[SDK]` A well-annotated tool sets all four explicitly even where the value matches the default,
because a client cannot distinguish "unset" from "deliberately false."

### The trap: annotations are hints, not enforcement

`[SPEC]` Normative, in a warning block: clients "**MUST** consider tool annotations to be untrusted
unless they come from trusted servers."
`[SDK]` The SDK's own type definitions say it plainly — _all properties in `ToolAnnotations` are
**hints**… Clients should never make tool use decisions based on `ToolAnnotations`._
`[VENDOR]` "Annotations are hints, not security guarantees."

`[INFERRED]` **This is the one place in the SDK that behaves like a CDS annotation that silently does
nothing.** Proposing `destructiveHint: false` as a _safety mechanism_ produces code that compiles,
ships, reads as a security improvement, and enforces nothing. Propose annotations as honest metadata
— they drive confirmation prompts, auto-approval and UI — and never as a control.

`[SPEC]` `_meta?: Record<string, unknown>` is untyped and accepts anything; it is the second silent
trap, for the same reason.

`[MEASURED]` Adopting the other three annotations is not a one-line change: `VerbDefinition`
(`mcp/verbs/shared/types.ts:60`) carries a single `readOnly: boolean`. The clean move is one
`annotations` object on the definition rather than four booleans.

---

## 6. Structured output — and the reason to avoid it no longer exists

`[SPEC]` `outputSchema` arrived with the `2025-06-18` revision. If provided, servers **MUST** return
structured results conforming to it, and clients **SHOULD** validate. For backwards compatibility a
tool returning structured content **SHOULD** also return the serialized JSON in a text block.

`[SDK]` `registerTool` takes `outputSchema`; the handler returns
`{ content: [...], structuredContent: output }`.

`[VENDOR]` Anthropic labels this the "modern pattern for structured data" and says to define
`outputSchema` "where possible."

**There was a real reason not to, and it is gone.** `[SDK]` Issue #654: the server validated
`structuredContent` _before_ checking `isError`, so a tool declaring an `outputSchema` could not
report an error at all. `[SDK]` **Fixed at our pinned 1.30.0** — `validateToolOutput` short-circuits
on `if (result.isError) { return; }` before any structured-content check, and the client mirrors it.

`[INFERRED]` So our discriminated `VerbSuccess | VerbFailure` envelope can declare `VerbSuccess` as an
`outputSchema` while `VerbFailure` continues to ride the `isError` path untouched. The hard part —
the discriminated union — already exists. **This is the largest single improvement available to the
tool surface, and it is now low-risk.** It is staged as **D-241** rather than proposed, because it
changes what every client parses and what `readToolEnvelope` re-parses in the protocol harness.

`[MEASURED]` Present shape, `mcp/server.ts:56-59`: `{ content: [{ type: "text", text:
JSON.stringify(result) }], ...(result.ok ? {} : { isError: true }) }`. Both directions of the
`isError` mapping are asserted by `toolSurface.test.ts`, which is more than most servers do.

---

## 7. Errors — the spec's own dividing line

`[SPEC]` The distinction is normative and is worth quoting, because it is exactly the line our
envelope draws:

- **Protocol errors** are "issues with the request structure itself **that models are less likely to
  be able to fix**" — unknown tool, malformed request. Returned as a JSON-RPC `error`. Clients MAY
  surface them; "less likely to result in successful recovery."
- **Tool execution errors** "contain **actionable feedback that language models can use to
  self-correct and retry with adjusted parameters**." Returned in the result with `isError: true`.
  Clients **SHOULD** provide them to the model.

`[SPEC]` The spec's own model error message supplies the fact needed to fix it, not just a code:
_"Invalid departure date: must be in the future. Current date is 08/08/2025."_

`[SDK]` In `McpServer`, a thrown exception inside a tool callback is caught and converted to an
`isError` result via `createToolError`. So throwing "works" — but it discards structure and leaks
whatever `error.message` happens to say. Returning an explicit envelope is the documented path.

**Is "remediation in the payload" an established pattern?** `[VENDOR]` Yes, under several names:
"error messages should guide agents toward solutions with specific suggestions and next steps";
"steer agents with specific and actionable improvements, rather than opaque error codes."
`[INFERRED]` What is _not_ established is remediation as a **separate structured field**. Ours is a
strict superset of the guidance and reaches the model correctly — because the whole envelope is
JSON-stringified into `content[0].text`, the `remediation` string does land in what the model reads.
**Fine as written.** The open question is whether it is _populated_ for model-recoverable failures
rather than merely optional in the type; that is a `contract-map` hole, not an SDK question.

`[SPEC]` Servers **MUST** "sanitize tool outputs," and `[VENDOR]` "don't expose internal errors to
clients." `[INFERRED]` The live path here is second-order: defect titles, decision text and reopen
reasons are stored and returned through `project_view` into model context. Low severity for a
single-user local tool; it is nonetheless the one place that MUST applies to us.

---

## 8. Resources and prompts — and why tools-only is a legitimate choice

`[SPEC]` The control axis is the entire answer:

| Primitive | Controlled by       |
| --------- | ------------------- |
| Tools     | **The model**       |
| Resources | **The application** |
| Prompts   | **The user**        |

`[SDK]` Resources "should not perform heavy computation or side-effects. They are ideal for
configuration, documents, or other reference data."

**Tools-only is the modal case, not a smell.** `[VENDOR]` Anthropic's `mcp-builder` skill — the
definitive vendor guidance on building a server — walks through naming, annotations, pagination,
transports, security and evaluation and **never instructs you to add resources or prompts**.
`[SPEC]` The official tutorial says it "will primarily focus on tools."

`[INFERRED]` **The important correction for this repo:** adding a _resource_ would not reintroduce
the escape hatch D-05 removed. Resources are read-only and application-controlled; they cannot
mutate state, so the enforced-write-path invariant is untouched. Conflating "no query tool" with "no
resources" is the one place D-05's rationale over-reaches. That does **not** make adding one a
recommendation — client support for resources is materially thinner than for tools, and a resource
nothing reads is dead weight. It makes it a **fork**, which is where it belongs.

`[SPEC]` A middle path exists that is worth recording: a tool **MAY** return a `resource_link`
instead of an inlined payload. `[INFERRED]` That is the natural answer for `project_view`, which
today composes an entire workspace tree into one JSON string with no limit, no depth control and no
truncation. `[VENDOR]` The reference pattern is a module-level `CHARACTER_LIMIT = 25000` with a
`truncated` flag and a message telling the model how to narrow the request; Claude Code caps tool
responses at 25,000 tokens by default. **This is a scaling cliff, not a present bug** — the dataset
is small today.

---

## 9. `ServerOptions` — the cheapest unused lever

`[SDK]` `ServerOptions` carries `instructions?: string` — "optional instructions describing how to
use the server and its features" — returned in the initialize result, plus the `capabilities`
declaration.

`[MEASURED]` `mcp/server.ts:40` is `new McpServer(BOOTSTRAP.SERVER_INFO)` with no second argument.
Two consequences:

1. **No `logging` capability is declared**, so `sendLoggingMessage` is unreachable. `[INFERRED]` This
   makes `TrackerMcpServer.setupStderrLogging` the mechanism rather than a workaround — worth recording so the next
   reader does not propose routing `cds.log` through MCP logging notifications.
   `[SPEC]` Note also that `2026-07-28` **deprecates** `notifications/message` logging; clients opt
   in per request. stderr remains the recommended stdio approach and is unaffected.
2. **`instructions` is unused.** `[INFERRED]` For a server whose entire premise is an _enforced
   methodology_, this is the single place to state the rules once — stages must be started before
   completed, a blocked stage cannot start, `next_action` answers "what next" — rather than
   repeating them across eleven descriptions. Cheapest available win, and complementary to §4's
   description work rather than a substitute.

---

## 10. Transports

`[VENDOR]` Current guidance: "Streamable HTTP for remote servers, using stateless JSON… **stdio for
local servers**." `[SDK]` The SDK ranks Streamable HTTP as recommended for remote, HTTP+SSE as
backwards-compatibility only, stdio for local process-spawned integrations. SSE is deprecated.

`[INFERRED]` **stdio-only is correct here** and offering both would add attack surface — an HTTP
transport on localhost needs auth, Origin validation and `127.0.0.1` binding — for no benefit.

`[SPEC]` The stdout-purity rule, normative and absolute:

- "The server **MUST NOT** write anything to its `stdout` that is not a valid MCP message."
- "Messages are delimited by newlines, and **MUST NOT** contain embedded newlines."
- "The server **MAY** write UTF-8 strings to `stderr` for any logging purposes."
- The client "**SHOULD NOT** assume `stderr` output indicates error conditions."

`[SPEC]` **Shutdown** — and this is the one lifecycle obligation we do not test:

> "Servers **SHOULD** exit promptly when their standard input is closed or reads return
> end-of-file. **This is the primary graceful-shutdown signal and the only portable one**, so
> honoring it reduces the need for forced termination."

`[SPEC]` On Windows, POSIX signals are unavailable; clients use `TerminateProcess` or Job Objects.
`[INFERRED]` `cds.serve("all")` plausibly holds the event loop open, in which case the server does
**not** exit on EOF and every host session leaks a process — most painfully on this machine's
platform. Untested today.

`[SPEC]` **Cancellation**: the client sends `notifications/cancelled`; servers **SHOULD** stop work
as soon as practical and **MUST NOT** send further messages for that request.

`[SDK]` **`InMemoryTransport.createLinkedPair()`** is the sanctioned in-process pairing, and the
critical property is in its source: **`send()` passes the message object by reference — there is no
`JSON.stringify`, no `structuredClone`.** `[INFERRED]` So an in-memory tier cannot catch
non-serializable payloads (`Date`, `undefined`, `BigInt`, `Map`, circular refs), newline framing,
stdout purity, process bootstrap, env/cwd, or shutdown. Our handler stringifies before returning,
which insulates us for most of that class — the residual is genuinely small but nonzero.

---

## 11. Security, briefly — where it lands for a local stdio server

`[SPEC]` Servers **MUST**: validate all tool inputs; implement access controls; rate limit; sanitize
outputs.

`[SPEC]` **Does local stdio need auth?** The spec's guidance is the opposite of adding it: "Use the
`stdio` transport to limit access to just the MCP client." stdio _is_ the control.

`[COMMUNITY]` **Tool poisoning** is the named attack class — adversarial instructions hidden in a
tool's description, schema or metadata, visible to the model and not usually rendered to the user;
the **rug pull** variant changes a description after approval. `[INFERRED]` For a first-party server
this is mostly an _outbound_ concern: our descriptions are trusted by our own client, so the risk is
untrusted data flowing _through_ the tools into model context. That is §7's sanitization MUST.

`[SPEC]` **Confused deputy** and **token passthrough** apply to OAuth-proxying servers. `[INFERRED]`
Not applicable — no OAuth, no HTTP.

`[SPEC]` **Least privilege**: avoid wildcard or omnibus scopes. `[INFERRED]` **The no-query,
no-raw-SQL, no-generic-CRUD design is a textbook application of least privilege at the capability
layer, and it is the strongest security property this server has.** It deserves to be described that
way rather than as a design preference — a reviewer who reads D-05 as ergonomics will propose
undoing it.

`[SPEC]` **State handle hijacking** (new in `2026-07-28`): servers "MUST NOT treat possession of a
state handle as authentication." `[INFERRED]` Relevant here only as a boundary note — our actor
arrives as an _ambient_ environment variable, not a per-request credential. Fine for a locally
spawned child whose parent already holds the database credentials; it must not survive a move to HTTP.

---

## 12. Versioning — the v2 cliff

`[SPEC]` Latest revision **`2026-07-28`** (previously `2025-11-25`, before that `2025-06-18`). It
draws an **era** boundary:

- **Modern** (`2026-07-28`+): version, identity and capabilities travel as per-request `_meta`.
  "**There is no negotiation handshake.**" Servers **MUST** implement `server/discover`. Results carry
  a `resultType` discriminator. Version mismatch returns `UnsupportedProtocolVersionError` (`-32022`)
  carrying `data.supported[]`.
- **Legacy** (`2025-11-25` and earlier): the `initialize` handshake, session-scoped.
- Compatibility: **Modern client + Legacy server fails. Legacy client + Modern server fails**
  ("legacy clients have no fall-forward mechanism"). Dual-era works both ways.

`[SDK]` v2.0.0 splits the monolith into `@modelcontextprotocol/server` + `/client` + `/core`, with
thin adapters for Express, Fastify, Hono and Node `http`. Schemas move to Standard Schema — **Zod v4
raw shapes carry forward**. A **codemod** automates the mechanical changes. The two upgrades are
**decoupled**: v1→v2 and protocol-revision adoption are documented as standalone steps.

`[VENDOR]` "TypeScript v1 receives bug fixes and security updates for at least six months after v2
ships" → a floor of roughly **2027-01-27**.

`[MEASURED]` `HANDSHAKE_FRAMES` in `test/protocol/data/toolSurface.ts:74` pins `protocolVersion:
"2025-06-18"`. Correct for SDK 1.x; it also means our protocol tier is pinned to an era the spec now
labels legacy.

`[INFERRED]` **D-228 is what makes this cheap.** With the SDK imported by exactly one file, a v2
migration is a one-file change; a codebase scattering SDK imports across eleven verb files would have
eleven files to migrate. The verbs-never-import-the-SDK rule is not merely clean — **it is the
specific property that de-risks the migration**, and it should be defended on those grounds.

---

## 13. `@cap-js/mcp` — not re-asked here

The adapter question is **not** re-opened by this document. It is `research/README.md` §6's decay row
and D-231's trigger, rechecked 2026-08-17 at v1.4.3.

One fact from this wave belongs in that row and nowhere else: `[REPO]` the plugin is an
`express.Router()` mounted by a CAP protocol adapter, with `express >= 4` as a peer dependency and no
stdio transport, not even a private one. **The HTTP-only constraint is architectural, not a maturity
gap** — so the trigger's "stdio" clause is unlikely to fire without a rewrite. Recorded so a future
reader does not wait on it.

`[REPO]` Also decayed, and already handled: `call_action` was renamed `call` in v1.3.0 (2026-07-31).
`[MEASURED]` `FORBIDDEN_TOOLS` at `test/protocol/data/toolSurface.ts:97` **already carries `call`**
with a D-231 citation. **D-231's owed one-line edit has landed.** Recorded closed so no future run
re-opens it.

---

## 14. What we could not establish

- **§2–§13 were not executed** — every claim there is documentation- or source-reading. Seven
  questions were queued for probe and **five were settled on 2026-08-27** against the installed
  1.30.0, with a control twin, before this document's first amendment. They are recorded in
  `.claude/skills/mcp-surface-critic/references/sdk-1.30.md` §12 and summarised here:
  - **`outputSchema` does not reject an `{ok:false}` envelope** returned with `isError: true` — no
    throw, `structuredContent: undefined`. **This is the fact D-241 rests on, and it is now measured.**
  - **`title` reaches the client as a field distinct from `name`.**
  - On success, `isError` is **`undefined`, not `false`** — assert on absence.
  - **Omitted annotations are absent from the wire, not materialised.** The pessimistic default is
    applied by the _client_, from nothing. This strengthens §5's argument rather than softening it.
  - A zod-4 `.describe()` survives as JSON Schema `description` (draft-07). **Asymmetry found:** the
    emitter adds `additionalProperties: false` to an `outputSchema` and **not** to an `inputSchema`.
- **The probe found something the documentation did not predict: an unknown key in `arguments` is
  silently accepted** — not stripped, not rejected. Combined with the asymmetry above, an input
  surface built from a bare Zod raw shape is **accidentally permissive**: a client sending a
  misspelled or stale parameter gets a successful call that ignored it, with no signal. `.strict()`
  closes it. This is a live finding, not a curiosity, and it belongs in the next critic run.
- **One question remains unprobed:** whether `sendLoggingMessage` throws or silently no-ops with no
  `logging` capability declared. The distinction matters — a throw is a bug a test catches, a no-op
  is a capability that looks present and is not.
- **Zod 4 is not the wire.** `zod@^4.4.3` sits behind the SDK's own compat emitter. What
  `readSchemaEnum` walks is whatever _that emitter_ produces, not what zod means. No zod construct
  should be assumed to survive to `tools/list` without a probe.
- **The `2026-08-22` MCP roadmap post was not read.** Published five days before this research;
  it may carry forward guidance on transports.
- **Extensions are covered shallowly** — Tasks (async long-running calls with durable handles), MCP
  Apps, Skills-over-MCP. Tasks would matter if a verb ever became long-running.
- **The six-month v1 support floor is arithmetic** on "at least six months," not a published calendar
  date. "At least" means it may extend.
- `[VENDOR]` **Anthropic's own `mcp-builder` skill is itself slightly stale on versions**, pinning
  `@modelcontextprotocol/sdk ^1.6.1` and `zod ^3.23.8` in its example manifest. Its design guidance
  is unaffected; its version numbers should not be copied.

---

## 15. What this grounds

| Consumer                                        | Reads                                                                                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp-surface-critic` / `references/sdk-1.30.md` | §3–§12 in full; §14 becomes the reference's **Confidence & Gaps**; §5's hints trap and §4's deprecated-overload note become its **Fabrication Guard** |
| **R12** (new)                                   | §3 — the declared floor differs from the resolved version on the wire contract                                                                        |
| §6 Decays                                       | §3 and §12 — the SDK version row, with a mechanical trigger the skill executes                                                                        |
| D-239, D-240, D-241                             | §3, §5, §6 respectively                                                                                                                               |

_Ground mode: this document records what is, not what should be. Every recommendation it implies is
staged as a §8 proposal in `research/README.md` or as a row in a critic run — none is applied here._
