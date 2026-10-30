# The Verb Server Measured Against Its Own Contracts: Eleven Findings, Three of Them Dated, and One Hole in a Contract That Calls Itself Exhaustive

**Document ID:** RSH-007
**Version:** 1.1
**Date:** 2026-08-27
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-27 | Sandro & Claude | Initial creation. Measures `INT-001` against the SDK (RSH-006), its own fixtures and the `D-nn` rulings. Establishes the settled-ground register and the contract map for the `mcp-surface-critic` skill.                                                                                                                                                           |
| 2026-08-27 | Sandro & Claude | **Finding 11 added from the RSH-006 probe** — every input shape is accidentally permissive: the SDK silently accepts an undeclared argument key, and the zod emitter adds `additionalProperties: false` to an `outputSchema` but not to an `inputSchema`. §2's evidence-tier note corrected: the document is no longer wholly unexecuted. Title count ten → eleven. |

---

## 2. The finding

**Sound, with a dated migration and one correctness bug in waiting.** Measured against the SDK
surface RSH-006 grounds, its own contract fixtures, and every `D-nn` that touches `mcp/`, the verb
server is **above the median for MCP servers on the things that matter most** — the escape hatch is
absent by construction, the SDK is confined to one file, stdout purity is guarded by a spawned
process, and the test suite drives a real client rather than calling handlers. Two independent
research tracks arrived at the same verdict: the five-tier split matches the SDK maintainers' own
`test/e2e` traceability pattern, and CAP's generic auth handlers are dispatch-level so the
in-process path enforces annotations exactly as an HTTP request would.

Three findings are **dated** rather than wrong — the protocol moved after our pin, the SDK range
floats on the wire contract, and the CAP pin is five releases stale. One is a **correctness bug in
waiting**: reads and writes resolve different `cds.context.user` identities, invisible today and
sharp the moment any `@restrict` or `cds.context.user` read appears. One is a **hole in a contract
that describes itself as exhaustive**: `toolSurface.test.ts` would not fail if someone registered a
resource tomorrow.

Nothing found here reopens a settled ruling. **D-231's owed fixture edit has landed** and is recorded
closed below.

**Mode:** Validate · **Verdict:** **Sound with dated caveats** · **Confidence:** High on the contract
map and the measured findings, Medium on the proposals · **Feeds:** `mcp-surface-critic` /
`references/settled-ground.md` + `references/contract-map.md`; **R12**, **R13**; D-239…D-243 ·
**Researched:** 2026-08-27

### Evidence tiers

`[MEASURED]` read from this repo or `node_modules` on this machine · `[SPEC]` / `[SDK]` / `[VENDOR]`
as in RSH-006 · `[CAP-SRC]` read from `@sap/cds@9.8.4` source on disk · `[CAP-DOCS]` capire ·
`[INFERRED]` our reasoning. **Everything here is source- and fixture-reading except §5 finding 11**,
which is `[PROBED]` — measured against the installed SDK with a control twin on 2026-08-27. The
remaining probe queue is RSH-006 §14; one question of the original seven is still open.

---

## 3. The settled-ground register

The third column is deliberately written as **the proposal a naive critic would make**, not as the
ruling's summary — that is the string a reviewer greps against before emitting a finding.

| Ruling                  | What it closed                                                                  | The proposal it forbids                                                                                                         | The only trigger that reopens it                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **D-05 / D-28 / D-230** | The CRUD escape hatch, at the **tool** surface specifically                     | "Add a `query`, `describe`, `call`, `select` or generic CRUD tool"; "expose an entity-generic read so agents skip a round-trip" | The no-escape-hatch premise is retired — i.e. `SPEC-01` BR-01 is amended                                                              |
| **D-231**               | `@cap-js/mcp` and `@gavdi/cap-mcp`                                              | "Adopt the official SAP adapter"; "remodel the verbs as unbound CDS actions and use `per_action_tool`"                          | The adapter ships create/update/delete, **and** gains stdio, **or** exits Beta. See §7 — the stdio clause is architecturally unlikely |
| **D-40 / D-50**         | The inventory at eleven                                                         | "Mint a twelfth verb"; "add a delete or cancel path"                                                                            | A workshop, not a critic run                                                                                                          |
| **D-44 / D-224**        | `mcp/` as a sibling of `srv/`; a tracked `.mjs` installer                       | "Move `mcp/` under `srv/`"; "un-ignore `.mcp.json`"; "convert the installer to TypeScript"                                      | —                                                                                                                                     |
| **D-45**                | Qualified story addressing; serialized writes                                   | "Parallelize the write queue"; "resolve a bare story ID"                                                                        | —                                                                                                                                     |
| **D-46**                | Remediation on methodology rejections; a repeat call refused with current state | "Make a repeat write idempotent"; "auto-retry a methodology rejection"                                                          | —                                                                                                                                     |
| **D-223**               | Identity from the registration environment                                      | "Add an `actor` or `caller` input to a verb"                                                                                    | A move off local stdio (see §6)                                                                                                       |
| **D-225**               | `mcp/` inside four shared linters                                               | "Add a Project-Tracker-specific path to a shared linter"                                                                        | —                                                                                                                                     |
| **D-228**               | The SDK/verb boundary                                                           | "Import the SDK from a verb file"; "let a verb build its own `CallToolResult`"; "co-locate `registerTool` with its handler"     | — and §9 argues this one should be defended harder, not relaxed                                                                       |
| **D-238**               | The scenarios tier                                                              | "Delete or thin `test/integration/scenarios/` — it duplicates the protocol tier"                                                | —                                                                                                                                     |

**Three rows are `open`, not settled**, and a critic must return _"Needs a ruling"_ for them rather
than Gap or Ruled out: **D-240** (annotations), **D-241** (structured output), **D-242** (read-path
identity). They are staged in `README.md` §8 and are Sandro's to rule.

---

## 4. The contract map — what pins what

| Property of the surface                                              | Pinned by                                                 | What a change costs                                    |
| -------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Exactly eleven tools, by name                                        | `EXPECTED_TOOLS` + the exhaustiveness assertion           | A fixture row plus a `VerbRegistry.DEFINITIONS` entry  |
| Per-tool `readOnlyHint`                                              | `EXPECTED_TOOLS[].readOnly`                               | One fixture field                                      |
| Each write tool reaches **its own** verb                             | `WRITE_TOOL_KINDS` — nine unique Activity `kind_code`s    | A new kind, or the assertion stops discriminating      |
| No generic data tool                                                 | `FORBIDDEN_TOOLS` — eight names                           | One fixture row                                        |
| The FRICEW enum survives to the wire                                 | `FRICEW_SCHEMA_PATH` — one tool, one property, one member | Hard-coded to a single path                            |
| `isError` maps both directions                                       | Two protocol assertions                                   | —                                                      |
| Reconnect fires on `ECONNRESET`, and **not** on a business rejection | `CONNECTION_FAILURE` + the paired negative test           | —                                                      |
| stdout is pure JSON-RPC; the ready line is on stderr                 | `stdoutGuard.test.ts`, spawning a real process            | —                                                      |
| The sixteen `SPEC-01` functional units                               | `test/integration/scenarios/` (D-238)                     | —                                                      |
| `mcp/verbs/**` coverage                                              | 90 lines / 85 branches                                    | Jest fails hard on a threshold group matching no files |

### The holes — properties nothing pins

These are findings, not observations.

1. **`resources/list` and `prompts/list` are unasserted.** `EXPECTED_TOOLS`' own comment says _"The
   exposed surface, exhaustive — the list is the contract"_, but the exhaustiveness check only calls
   `listTools()`. **Registering a resource or a prompt tomorrow would break nothing.** A contract that
   describes itself as exhaustive and checks one of three primitives is the sharpest structural
   finding available here.
2. **Tool descriptions are unasserted.** `EXPECTED_TOOLS` covers `name` and `readOnly` only. A
   description emptied, duplicated or drifted passes all 159 tests. `[VENDOR]` Descriptions are the
   primary determinant of whether a model picks the right tool — this is the cheapest real gap.
3. **The enum assertion covers one tool.** `FRICEW_SCHEMA_PATH` proves the pattern; every other
   enum-valued parameter across the eleven is unchecked.
4. **`remediation` is optional in the type and unasserted in the tests.** D-46 requires it on
   methodology rejections. Nothing fails if it stops being populated.
5. **`SERVER_INFO.version` is unasserted** — see §5 finding 1.
6. **stdin-EOF shutdown is unasserted** — see §5 finding 8.
7. **Ten of eleven tools never cross a real serialization boundary.** `[SDK]` `InMemoryTransport`
   passes messages by reference with no `JSON.stringify`; `HANDSHAKE_FRAMES` calls exactly one tool
   (`next_action` with `{}`). Mitigated honestly: the handler stringifies before returning, so a
   non-serializable value throws on every tier. Residual risk small, not zero.

---

## 5. Findings

Graded. `[MEASURED]` unless stated. Ordered by consequence, not by file.

**1 · `SERVER_INFO.version` contradicts the manifest.** `mcp/server.ts:25` advertises
`version: "1.0.0"`; `package.json` says `"0.0.1"`. Blast radius **none** — and that is half the
finding: nothing asserts either, so they can drift indefinitely. Grade **Verified**. A fix, not a
ruling.

**2 · Nine write verbs advertise as destructive and open-world.** `mcp/server.ts:48` passes
`annotations: { readOnlyHint: verb.readOnly }` and nothing else. `[SPEC]` Absent `destructiveHint`
and `openWorldHint` **both default to true**. So every write verb tells a policy-aware host it may be
irreversible and may reach external systems — neither true, and D-50 makes nothing deletable. Real
cost: unnecessary confirmation prompts and worse auto-approval behaviour. `reopen_stage` is the one
where `destructiveHint` deserves genuine thought. Not a one-line fix: `VerbDefinition`
(`shared/types.ts:60`) carries a single `readOnly: boolean`, so the clean move is one `annotations`
object. Grade **Verified** on the defaults, **needs a ruling** on the values → **D-240**.

**3 · Reads and writes resolve different identities.** `runVerb.ts:64` wraps writes in
`ctx.service.tx({ user: actor }, …)` — `[CAP-DOCS]` the callback form, which is the one that
establishes a new async continuation, and is exactly right. `runVerb.ts:35` calls
`work(new TrackerGateway(ctx.service))` with **no tx and no user**. `[CAP-SRC]` With no context,
`cds.User(undefined)` returns `cds.User.Anonymous`. So **reads execute anonymously while writes
execute as the actor.** Invisible today — `srv/tracker-service.cds` carries no `@restrict` — and a
correctness bug the moment one is added or any handler consults `cds.context.user`. It also means the
read path is unattributable. Grade **Verified**. → **D-242**.

**4 · The SDK range floats on the wire contract.** `package.json` declares `^1.29.0` while
`@sap/cds` is exact-pinned repo-wide by D-34. The SDK **is** the protocol contract, and a floating
minor can move `tools/list` output under a fixture that asserts it exactly. Same class as **R11**.
Grade **Verified**. → **R12**, **D-239**.

**5 · The tested launch path is not the registered one.** `mcpHarness` spawns
`process.execPath --import tsx …` — a direct child, which is why `child.kill()` works and is probably
deliberate. `scripts/installMcpServer.mjs` registers `{ command: "npx", args: ["tsx", …] }`.
`[SDK]` `npx` is a **wrapper process**, precisely the shape issue #2023 identifies as producing
orphaned servers, and an additional source of stdout our purity guard never observes.
`installMcpServer.test.ts` asserts the file _contents_; nothing asserts that command actually boots
and speaks JSON-RPC. Fix: derive both from one constant. Grade **Verified**.

**6 · stdin-EOF shutdown is untested.** `[SPEC]` _"Servers SHOULD exit promptly when their standard
input is closed… This is the primary graceful-shutdown signal and the only portable one."_ Our
harness `child.kill()`s. `[INFERRED]` `cds.serve("all")` plausibly holds the event loop open, in
which case every host session leaks a process — worst on Windows, where POSIX signals are
unavailable. Compounding it: `[CAP-SRC]` `cds.shutdown()` is `this.app?.server && process.exit()`, so
with no `cds.app.server` it is a **verified no-op** and the Postgres pool is never drained.
~10 lines to test. Grade **Verified** on the mechanism, **Inferred** on whether it actually hangs —
this is the first thing a probe should settle.

**7 · No `outputSchema` / `structuredContent`.** Every tool returns a JSON string in a text block.
`[VENDOR]` The modern pattern for structured data. The historical reason to avoid it — SDK #654,
output validated before `isError` — `[SDK]` **is fixed at our pinned 1.30.0**. So `VerbSuccess` can
become an `outputSchema` while `VerbFailure` rides `isError` untouched. Largest single available
improvement; also the largest blast radius, since `readToolEnvelope` and every scenario spec parse
`content[0].text`. Grade **Verified** on the SDK behaviour (pending probe), **needs a ruling** →
**D-241**.

**8 · Descriptions are one-line summaries and `instructions` is unused.**
`new McpServer(BOOTSTRAP.SERVER_INFO)` passes no `ServerOptions`, so `instructions` is empty and no
`logging` capability is declared. `[INFERRED]` For a server whose premise is an _enforced
methodology_, `instructions` is the one place to state the rules once instead of eleven times. The
`logging` half is **Justified** and recorded as such so the next reader does not propose routing
`cds.log` through MCP notifications — `TrackerMcpServer.setupStderrLogging` is the mechanism, not a workaround.
Grade **Verified**.

**9 · Clients are never closed.** `toolSurface.test.ts` opens three `Client`s and closes none.
`[SDK]` The official guide prescribes closing in `afterEach`, client before server, so hung calls do
not leak between tests. Harmless today; it is one `afterAll`. Grade **Verified**.

**10 · Two fragilities in the spawn harness.** (a) Termination is detected by
`streams.stdout.includes('"id":3')` — a substring match over accumulated raw text. A payload
containing the literal `"id":3` would truncate the stream the purity assertion then runs against.
Parse lines and match `frame.id === 3`. (b) The `child.on("error")` reject path clears the timer but
issues no `kill()`. Grade **Verified**.

**11 · Every input shape is accidentally permissive.** — added 2026-08-27 from the RSH-006 probe.
The SDK **silently accepts** an argument key the schema does not declare; the zod→JSON-Schema emitter
adds `additionalProperties: false` to an `outputSchema` and **not** to an `inputSchema`. All eleven
verbs pass a bare `ZodRawShape`, so a caller sending a misspelled or stale parameter gets a
successful call that ignored it, with no signal at either end. `.strict()` closes it. Nothing in the
suite would notice. Grade **Verified** (probed, with a control twin). A fix, not a ruling — but it
touches all eleven, so it merges to one row.

### Recorded closed

`[MEASURED]` **D-231's owed fixture edit has landed.** `FORBIDDEN_TOOLS` at
`test/protocol/data/toolSurface.ts:97` carries `"call"` with the D-231 citation. Recorded here so no
future run re-opens it.

---

## 6. The "enforced path" claim, measured — and where it overstates

This matters more than the plugin question, because a reviewer reading D-05 could reasonably
conclude CAP is doing work it is not.

`[CAP-SRC]` **`@requires`, `@restrict`, `@readonly` and `@insertonly` ARE enforced on in-process
`cds.connect.to` + `srv.send`/`srv.run` calls.** They are registered as `before('*')` handlers on
`ApplicationService` by `libx/_runtime/common/generic/auth/index.js`, not as protocol middleware —
and CAP's own source comments say why: _"service-level restrictions (not all requests are dispatched
by protocol adapter with its early access check)."_ **The architecture is not bypassing CAP's
security model.** RSH-001's mechanism verdict holds and is now grounded in the auth path too.

**But the claim is currently vacuous for our model.** `[MEASURED]` `srv/tracker-service.cds` carries
**zero `@requires` and zero `@restrict`** — only two `@readonly` (D-230). Every methodology rule is
enforced by `assertCallerIdentity`, `stageGuards` and gateway logic. That is a legitimate
architecture. The accurate description is _"our verbs enforce it, and CAP would enforce annotations
if we added them"_ — not _"CAP enforces it."_

`[CAP-SRC]` Two escape hatches exist, and we use neither: `req.user._is_privileged` skips every
check, and `@requires: 'internal-user'` makes local app-service calls always allowed. Both belong on
a critic's checklist as never-present assertions.

`[CAP-SRC]` One consequence of the string actor: `new cds.User("sandro")` has `roles = {}`. So
`@restrict … where: $user = …` would work, `@requires: 'authenticated-user'` passes trivially, and
**any future named-role `@requires` fails closed for every MCP call** — safe, but a silent total
outage rather than a clear error.

`[INFERRED]` And stated plainly, because the code reads as if it were an authenticated principal:
**`PROJECT_TRACKER_ACTOR` is a claim, not a credential.** Identity is asserted by the launching
process, not verified. For a locally spawned stdio child whose parent already holds the database
credentials that is a reasonable trust boundary — it must not survive a move to HTTP. D-230 already
records the sibling fact in the same spirit: the OData surface is writable by anything that can reach
`localhost:4005`.

---

## 7. `@cap-js/mcp` — the ruling holds harder than its stated reason

Not re-adjudicated. D-231 ruled 2026-08-17 at v1.4.3 and reset the trigger. Two facts from this wave
belong in §6's decay row:

`[REPO]` **The plugin is an `express.Router()` with `express >= 4` as a peer dependency and no stdio
transport, not even a private one.** Our process has no HTTP server at all. **The HTTP-only
constraint is architectural, not a maturity gap** — so the trigger's "stdio" clause is unlikely to
fire without a rewrite. Worth recording so nobody waits on it.

`[REPO]` **D-231's stated reason has partly decayed, while its conclusion strengthened.**
`per_action_tool` (v1.2.0) does emit dedicated per-action tools with typed schemas derived from
`@mandatory` / `@assert.*` and correct annotations — so "it can only do generic tools" is no longer
true. It still cannot suppress `describe`/`query` beside them, and it would require remodelling
eleven verbs as unbound CDS actions. D-231 already says exactly this; the row is accurate.

`[INFERRED]` The real long-term watch item is **not** `@cap-js/mcp`. It is **`@cap-js/agents`**
(0.9.2, published 2026-08-26, importing `@cap-js/mcp/lib/tools`), which suggests SAP is making MCP
the substrate for a CAP-native agent framework. If that defines a CAP-idiomatic way to express
enforced domain verbs, divergence — not substitution — becomes the cost. Named, not scheduled.

---

## 8. What we could not establish

- **Nothing was executed.** No server started, no probe run. The seven SDK questions RSH-006 §14
  queues remain open, and finding 6's "does it actually hang on EOF" is the highest-value of them.
- **`[CAP-SRC]` claims are source-reading, not observation**, and are verified **for 9.8.4
  specifically**. CAP's own comment `REVISIT cds^10: remove opt-out` on `service_level_restrictions`
  signals the mechanism is deliberately in flux. Re-verify after any major upgrade.
- **`cds.env.features.service_level_restrictions` has no documented default**; "on" is inferred from
  a `!== false` guard in source.
- **SQLite/Postgres divergence is real and untested for the verb layer.** The `[test]` profile swaps
  drivers. Known classes: decimal precision (CAP 10 flips `ieee754compatible` to true — decimals
  return as **strings**, which would silently change the envelope JSON), timestamp precision,
  collation, and concurrency — SQLite serialises where Postgres does not, so `runSerialized` masks a
  class of races Postgres would expose.
- **`@cap-js/mcp` releases roughly weekly** (nine versions in six weeks) and renamed a tool in a
  minor. Assume tool names can move again.
- **The official conformance suite cannot test us.** `[TOOL]` `modelcontextprotocol/conformance`
  server mode requires `--url`; there is no stdio server mode. **"No conformance tier" is therefore
  a defensible answer, not a hole** — but it is worth re-checking, as that repo moves fast.

---

## 9. Grading the prior assumptions

| #   | Prior assumption                                                          | Grade                                       | What the evidence says                                                                                                              |
| --- | ------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | D-05/D-230: the enforced path has no escape hatch                         | **holds**                                   | `[CAP-SRC]` In-process dispatch enforces the same annotations as HTTP. The tool surface is genuinely the only agent-reachable path. |
| 2   | _Implicit:_ "CAP enforces the methodology"                                | **refuted as stated**                       | Zero `@requires`/`@restrict` in the model. Verbs enforce it; CAP _would_ enforce annotations if added. §6.                          |
| 3   | _Implicit:_ every verb call is attributable to the actor                  | **refuted**                                 | Reads run as `cds.User.Anonymous`. §5 finding 3.                                                                                    |
| 4   | _Implicit:_ `readOnlyHint` alone is honest metadata                       | **refuted**                                 | Omitted `destructiveHint`/`openWorldHint` default **true**, so nine verbs misrepresent themselves. §5 finding 2.                    |
| 5   | _Implicit (SDK #654):_ `outputSchema` is unsafe beside a failure envelope | **refuted — fixed at our pin**              | `validateToolOutput` short-circuits on `isError` at 1.30.0. §5 finding 7.                                                           |
| 6   | _Implicit:_ being on SDK 1.x means being behind                           | **refuted**                                 | 1.30.0 published 2026-07-27 is the **current** release of the v1 line. RSH-006 §3.                                                  |
| 7   | _Implicit:_ the stdout guard proves the production launch path            | **refuted**                                 | Tests spawn `node --import tsx`; the installer registers `npx tsx`. §5 finding 5.                                                   |
| 8   | _Implicit:_ the protocol tier exercises the wire for all eleven tools     | **partly refuted**                          | `InMemoryTransport` passes by reference; one tool crosses a real pipe. §4 hole 7.                                                   |
| 9   | D-231: `@cap-js/mcp` is disqualified by generic tools                     | **partly refuted, conclusion strengthened** | `per_action_tool` exists; but HTTP-only is _architectural_. §7.                                                                     |
| 10  | _Implicit:_ `EXPECTED_TOOLS` is the exhaustive contract                   | **refuted**                                 | It checks tools only; resources and prompts are unasserted. §4 hole 1.                                                              |
| 11  | D-228: the SDK/verb boundary is a cleanliness rule                        | **holds — and understated**                 | It is the specific property making a v2 migration a one-file change. Defend it, don't relax it.                                     |

---

## 10. Verdict and what it feeds

**Sound with dated caveats.** No ruling is reopened. Three findings are dated (protocol era, SDK
range, CAP pin), one is a correctness bug in waiting (read-path identity), one is a contract hole
(unasserted resources and prompts), and the remainder are fixes. The suites are at or above best
practice on the things most MCP servers get wrong.

| Consumer                       | Reads                                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| `references/settled-ground.md` | §3 in full, including the three `open` rows                            |
| `references/contract-map.md`   | §4 in full, holes included                                             |
| `mcp-surface-critic` SKILL.md  | §5's ordering as the expected first run; §8 as the probe queue         |
| **R12**, **R13**               | §5 finding 4; §8's CAP pin note                                        |
| D-239 … D-243                  | §5 findings 4, 2, 7, 3 and `README.md` §7's standing rule respectively |

_Every proposal here is staged, not applied. `DECISIONS_LOG.md` was not written to: the stage ran
against a live codebase and each §8 row asserts a ruling Sandro has not made._
