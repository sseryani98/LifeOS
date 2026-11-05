---
name: mcp-surface-critic
description: Audit and critique Project Tracker's MCP verb server — mcp/server.ts, the eleven intent verbs under mcp/verbs/, and the protocol and scenario suites that pin their surface — against the installed @modelcontextprotocol/sdk and the D-nn rulings that already closed parts of the design. Finds SDK capability the verb layer is paying for by hand (structured output, resources, prompts, completions, logging, tool annotations beyond readOnlyHint), tool metadata a host will act on wrongly, envelope and error-mapping drift, retry and write-serialization hazards, and contract fixtures gone stale against the code. Use whenever Sandro asks to review, audit, critique, harden or extend the MCP server, the verb layer, the tool surface or the verb envelope; asks "should this be a resource", "why is every response a JSON string", "is that the right SDK API", "does the SDK do this at our version", "is the tool list still honest", "should we add a twelfth verb", "are the tool annotations telling the truth"; adds or edits a verb, its zod input shape, its verb class, VerbRegistry.DEFINITIONS, or test/protocol/data/toolSurface.ts; or hits an MCP client behaving oddly against the server. Also use proactively when reading mcp/ code that registers a tool, shapes a tool result, maps an error to a status, or serializes a write. It reports and stops — it proposes nothing D-05, D-28, D-40, D-44, D-45, D-46, D-50, D-223, D-224, D-225, D-228, D-230, D-231 or D-238 already ruled out, writes no code unasked, runs no build and no test suite, and never edits srv/, db/, design/ or the decisions log. Not for CAP handler or CDS annotation review — that is cap-annotation-hunter.
---

# MCP Surface Critic

This server is the only write path into project state. D-05 removed the escape hatch, so every rule
the methodology enforces is enforced _here_ — and the surface grows with every spec. Twenty-two
files carry it, and until this skill existed nothing in the repo knew what a well-designed MCP tool
looks like. The twenty-three shared linters check facade purity and test structure; ESLint does not
know that an omitted `destructiveHint` defaults to **true**.

So the goal is not to find fault. **Both the server and its suite are already above the median for
MCP servers** — the SDK is confined to one file, stdout purity is guarded by a spawned process, the
tests drive a real client rather than calling handlers, and the state oracle in `WRITE_TOOL_KINDS`
is textbook. The goal is to find the things a general code reviewer structurally cannot: protocol
obligations, SDK capability that arrived after the code was written, and metadata a host will act on.

## The failure mode that matters

**A critic that re-opens a closed decision, and the "improvement" is an escape hatch.**

A run that returns _"#1 — add a `query` tool so agents can read state without a round-trip"_ proposes
something that reads as an obvious ergonomic win, is trivially implementable, will pass review, and
**dissolves the premise of the module**. One accepted row and the verbs become advisory.

This is not hypothetical. D-231 exists because that question was asked after `INT-001` had already
shipped, and answering it cost a full research pass against npm, capire and the cap-js repository to
arrive at _"the ruling holds."_ Sandro's judgment is the scarce resource here; a table padded with
settled questions consumes it while looking thorough.

So the method is constrained: **no row enters the report until its subject has been checked against
column three of `references/settled-ground.md`.** A hit produces one of two outcomes, never a silent
drop — _Ruled out_ (moved below the table with its `D-nn` and reopen trigger) or _Trigger fire_
(**only** when column four's trigger is measurably satisfied, with the measurement attached). And the
Ruled-Out list is **printed**, not suppressed: that is what makes it a guard rather than a gag, and it
lets Sandro say "actually, reopen that one."

**Never write to `DECISIONS_LOG.md`.** Stage anything needing a ruling §8-style, per the pack's own
convention — _"logging them would have manufactured consent."_

### The secondary guard, and the one place it bites

Never propose an SDK API you have not seen in `references/sdk-1.30.md` or confirmed by probe. Unlike
CDS, this SDK mostly self-detects: `tsc` and ts-jest catch a fabricated `server.addTool()` before it
ships. **Two things do not self-detect**, and they are §11's whole reason for existing:

- **`ToolAnnotations` are hints.** The SDK's own types say _"Clients should never make tool use
  decisions based on ToolAnnotations."_ Proposing `destructiveHint: false` as a **safety mechanism**
  produces code that compiles, ships, reads as a security improvement, and enforces nothing — the
  exact fictional-annotation regression. Propose annotations as honest metadata, and say in the row
  which of the two you mean.
- **`_meta` is `Record<string, unknown>`** and swallows anything.

If a candidate is not in the reference: either probe it, or report the finding with **no suggested
API**. _"The server does this by hand and I believe the SDK covers it; I could not confirm which
call"_ is honest and useful.

## Layer Map

The tree is small enough that this is exhaustive rather than heuristic. Bucket every hit before
reading it, or Phase 2 drowns in architecture.

| Layer                        | Path                                                                                                                                        | Verdict                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tool wiring**              | `mcp/server.ts` — `TrackerMcpServer.createServer`, ~lines 32-65                                                                             | **Prime target, highest value.** Every SDK-facing decision lives in one 25-line loop: the config object, the annotations, the result shape, the `isError` mapping, the retry gate. It is **excluded from coverage**, so only the protocol tier pulls on a change here. Every row touching it must name the protocol-tier assertion that would catch a regression — or admit there isn't one. |
| **CAP bootstrap**            | `startServer`, `setupStderrLogging`, `_isInMemoryDatabase`, `_runSilentDeploy`, the module-root `chdir`, the `argv[1]` guard in `static {}` | **Architecture, not a finding.** `CDS_TYPESCRIPT` before a _dynamic_ import (static imports hoist — D-228); `cds.load → cds.serve → cds.connect.to` (RSH-001 §4: a bare `connect.to` throws); the stderr redirect (RSH-001 §5). All Verified. A finding here is legitimate only if a **measurement** shows the runtime changed.                                                              |
| **Verb definition record**   | the `readonly` fields of each of the eleven verb classes                                                                                    | **Prime target, cheapest yield.** `description` is the one string a model reads before choosing a tool; `.describe()` is the only per-parameter documentation a client ever sees. **Compare all eleven side by side** — inconsistency across them is a finding no single file can show.                                                                                                      |
| **Verb body**                | the `run` method of each verb class                                                                                                         | **Route, don't propose.** `SPEC-01` business rules, owned by the D-4x/D-5x series. A finding here is a spec question wearing MCP clothes: name it, say which spec owns it, move on.                                                                                                                                                                                                          |
| **Wire contract**            | `shared/envelope.ts`, `verbError.ts`, `types.ts`                                                                                            | **Prime target.** `toFailure`'s status-sniffing is the most fragile code in the tree and the only thing between a Postgres `23503` and a client reading it as an HTTP status.                                                                                                                                                                                                                |
| **Concurrency**              | `shared/runVerb.ts`, `writeQueue.ts`                                                                                                        | **Architecture (D-45)**, narrow target. Serialized writes and the monotonic clock are ruled. Live targets: `runSerialized`'s tail-swallowing, and reads deliberately not advancing the write clock.                                                                                                                                                                                          |
| **Rules**                    | `shared/stageGuards.ts`, `addressing.ts`, `constants.ts`                                                                                    | **Route, don't propose.** SPEC-01 rules and D-225's lint-enforced constants shape.                                                                                                                                                                                                                                                                                                           |
| **Data access**              | `shared/trackerGateway.ts`                                                                                                                  | **Architecture, not a finding.** The DataService analogue — CQL lives here by design. Only a finding if a _caller_ uses it purely to decide whether to error.                                                                                                                                                                                                                                |
| **The `srv/` reach-through** | `envelope.ts` importing `srv/modules/shared/messagingUtility.js`                                                                            | **By design** — one i18n register. Flag only if the direction ever reverses; `srv/` importing `mcp/` would be a real finding, and out of scope to fix.                                                                                                                                                                                                                                       |
| **Contract fixture**         | `test/protocol/data/toolSurface.ts`                                                                                                         | **Blast-radius meter, not a target.** Every row records a decision made elsewhere. Its **Holes** are findings — see `contract-map.md`.                                                                                                                                                                                                                                                       |
| **Protocol tier**            | `test/protocol/**`                                                                                                                          | **Prime target for gaps, never for removal.** Ask what the surface does that no test observes. `captureServerStreams()` is irreplaceable — never propose collapsing it into the in-memory transport.                                                                                                                                                                                         |
| **Scenario tier**            | `test/integration/scenarios/`                                                                                                               | **Architecture (D-238).** The overlap with the protocol tier is deliberate and is `TST-001` §14's single documented exception.                                                                                                                                                                                                                                                               |
| **Verb unit tier**           | `test/unit/verbs/tests/`                                                                                                                    | Target only for coverage-shaped findings; the band is 90/85 and Jest fails hard on a group matching no files.                                                                                                                                                                                                                                                                                |
| **Installer**                | `scripts/installMcpServer.mjs` + its test                                                                                                   | **Prime target, narrow** — it authors the _client's_ view of how to launch the server, and nothing else exercises that. `.mjs` is D-224, not an oversight.                                                                                                                                                                                                                                   |
| **Manifest**                 | `Project Tracker/package.json`                                                                                                              | Target. The SDK range and the module version are surface facts.                                                                                                                                                                                                                                                                                                                              |

**If a verb file imports the SDK, D-228 has been crossed and that is finding #1**, ahead of everything
else in the run.

## Phase 0 — Freshness, mechanically

Three reads, **printed in the report header** before anything else. A reader cannot distinguish a
check that ran from one that was skipped, so printing is part of the check.

1. `node_modules/@modelcontextprotocol/sdk/package.json` version vs `references/sdk-1.30.md`'s
   header. **Mismatch ⇒ refuse the reference** — re-derive by probe, or stop. Never "adjust for" it.
2. Highest `## D-nnn` in `Project Tracker/design/DECISIONS_LOG.md` vs `settled-ground.md`'s
   `Log read through:`. Mismatch ⇒ read the delta before Phase 2.
3. `research/README.md` §6's recheck triggers — has any fired?

This is the durable answer to how D-231 happened: its trigger was correct and nobody executed it. A
trigger the skill runs itself beats one a human is supposed to remember.

## Phase 1 — Inventory the surface; do not grep first

**The finding is usually what is absent, and absence does not grep.**

1. Read `mcp/verbs/index.ts`. The array is hand-maintained separately from the imports, so a
   verb class that exists but is not listed is dead code.
2. Read the eleven verb classes' fields and build the _actually advertised_ surface: name, title,
   description, input keys with their `.describe()` text, `readOnly`.
3. Diff that table against `EXPECTED_TOOLS`. Drift is finding #1 by construction.
4. Read `TrackerMcpServer.createServer` once, in full.

_Then_ sweep — for absence:
`registerTool|registerResource|registerPrompt|annotations|outputSchema|structuredContent|_meta|sendLoggingMessage|ServerOptions|capabilities`
across `mcp/`. The high-yield result is the **empty** hit list, read against `sdk-1.30.md` §13.

## Phase 2 — Verify against settled ground first, then the SDK

Settled ground **first**: it is cheaper, and it kills rows the SDK check would otherwise dress up in
a plausible implementation sketch.

| Verdict            | Meaning                                                                                               | Action                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Gap**            | The SDK offers it at the declared floor, nothing uses it, no ruling forbids it                        | Propose                                                                                      |
| **Ruled out**      | A `D-nn` closes it                                                                                    | Ruled-Out list, with the `D-nn` and its reopen trigger. Never in the table.                  |
| **Trigger fire**   | A ruling's own reopen condition is _measurably_ satisfied today                                       | Propose, shaped as the trigger, measurement attached                                         |
| **Contract-bound** | Accepting it edits `toolSurface.ts`, a coverage band, or the installer's output                       | Propose **with** the fixture edit named in the blast-radius column                           |
| **Needs a ruling** | It changes what a client sees and no `D-nn` covers it — or it is an `open` row in `settled-ground.md` | Stage §8-style below the table; do not number it as a fix                                    |
| **Spec question**  | A `SPEC-01` rule wearing MCP clothes                                                                  | Route to the owning spec; don't propose                                                      |
| **Justified**      | Deliberate, and there is a reason a future reader will miss                                           | Say so, name the reason, and **keep the row** — that is how the next run stops re-finding it |

Four traps, all real:

- **Annotations are hints.** Say which you mean — metadata or enforcement. Only one is true.
- **The version floor is `^1.29.0`, not the resolved 1.30.0.** A proposal must exist at 1.29.0 or
  `npm ci` breaks a fresh clone. Same hazard class as R11.
- **Zod 4 is not the wire.** The SDK's compat emitter sits between the shape and `tools/list`. Never
  assume a zod construct survives — probe it.
- **`server.ts` is uncovered.** A change there is invisible to the coverage gate.

## Phase 2.5 — Probe the installed SDK

**Cheaper than `cap-annotation-hunter`'s, which changes this from conditional to near-mandatory.**
That skill needs a whole scratch CAP project. This one needs **no CAP at all** — D-228 already
guarantees the SDK and the runtime are separable, so `McpServer` + `InMemoryTransport
.createLinkedPair()` + `Client` is about twenty lines. Reuse the shape `test/protocol/support/
mcpHarness.ts` already proves works; don't invent one.

Probe whenever the answer changes the row. The standing queue is `sdk-1.30.md` §12 — seven questions,
none of them asserted anywhere in the references.

**Include the control, or the probe proves nothing.** Register the same tool twice — once with the
candidate config, once without — list both, diff the entries. Otherwise you credit the SDK for a
field the client library synthesised.

Probe in the session scratchpad. **Never mutate `mcp/`, and never run the module's own `npm test`** —
it writes `coverage/test-results.json`.

**A probe result outranks the reference.** When they disagree, trust the runtime and correct
`references/sdk-1.30.md` in the same turn. That is how §11 and §12 stay worth reading, and how this
skill's own reference improves instead of rotting.

## Phase 3 — Report, then stop

One numbered table. Fix nothing — the point is a decision, and a rewrite pre-empts it.

`# | file:line | what it is now | verdict | proposal | blast radius | conf | note`

- **Order** Gap → Trigger fire → Contract-bound → Justified, then confidence.
- **Blast radius** is the column `cap-annotation-hunter` does not have and this one needs: `none` /
  `toolSurface.ts +N rows` / `+N protocol tests` / `SPEC-01 amendment` / `needs D-nnn`. It lets
  Sandro price a row without opening a file.
- **Confidence** ★★★/★★☆/★☆☆. Mark probed rows **VERIFIED** and say what the probe showed — the
  reader cannot otherwise tell a claim from a fact.
- **Merge by cause.** Eleven rows saying "add `.describe()`" is one finding padded to look like an
  audit, and this tree makes that temptation eleven times stronger than usual. One row, eleven files
  listed.

Then three short blocks below the table:

- **Ruled Out** — `R1 · add a query tool · D-05/D-28/D-230 · reopens only if the no-escape-hatch
premise is retired`.
- **Needs a ruling** — §8-shaped, one line of subject each. Never logged.
- **Triggers checked** — every `settled-ground.md` and §6 trigger examined this run, with its
  measurement. **Including the ones that did not fire.**

Then stop and let Sandro reply by index ("do #1 #4"). This matches how he works and keeps the
Justified rows arguable — several will be wrong, and that is the mechanism working.

## Phase 4 — Apply, on request only

Per accepted row, in order:

1. Make the change.
2. **Prove it over a real client** — extend `test/protocol/`, not `test/unit/verbs/`. The surface is
   only observable at the wire; a unit test asserting a verb class's fields proves the record, not the
   advertisement.
3. Update `test/protocol/data/toolSurface.ts` **in the same change** if the blast-radius column said
   so. The fixture and the surface land together, or the contract is a lie for the length of a commit.
4. Run `npm test` and `npm run lint`. D-225 put `mcp/` into `lintCommentLength`, `lintNoTrackingIds`,
   `lintDomainTypes` and `lintGroupedConstants` — a loose constant or an over-long comment fails the
   module, and both were caught on that ruling's first run.
5. If the row needed a ruling, **hand Sandro the `D-nnn` text**. Do not write it into the log.
6. Sweep siblings. Verb-layer findings travel in families of eleven.

## Telling a real finding from a manufactured one

- **It names a line.** A finding without `file:line` is an opinion wearing a table.
- **It names what breaks.** Blast radius filled with something other than `none` — or an _argued_ none.
- **It survives the Ruled-Out grep**, checked before emission rather than after challenge.
- **Accepting it changes something observable** — at the wire, or in what a human reads. If neither,
  it is a style note, and style notes go below the table.

## Scope boundary

Does not fix unasked · does not run the build (`cds build`, `cds deploy`, `npm start`, Postgres) ·
does not run the module's test suite during an audit · does not touch `srv/`, `db/`, `app/` or the
CDS model — handler-versus-annotation is **`cap-annotation-hunter`**, full stop · does not edit
`design/`, and **never `DECISIONS_LOG.md`** · does not edit `research/` during a run (it may _report_
that a §6 trigger fired; acting on it is Sandro's) · does not add or remove a verb (D-40/D-50 — a
workshop, not a critic) · does not touch `.mcp.json` or run `npm run install-mcp` · does not review
Financial Planner (D-29).

## Reference

Navigate by section rather than reading whole.

- **`references/sdk-1.30.md`** — the SDK capability catalogue. **§13 Quick Detection Table** (start
  here — imperative pattern → SDK capability, ranked by hit rate), **§11 Fabrication Guard** (check
  before emitting; contains the two silent traps), **§12 Confidence & Gaps** (the probe queue — do
  not assert these). §2–§10 are the catalogue proper.
- **`references/settled-ground.md`** — the Ruled-Out Register. Column three is the string you grep.
  Carries the three **`open`** rows that must return "Needs a ruling," and the recorded-closed list.
- **`references/contract-map.md`** — what pins what, and the **Holes** section, which is where the
  structural findings live.

Background, not duplicated here: `Project Tracker/research/mcp-over-cap-in-process.md` §3, §4, §5 and
§10 carry the CAP boundary at Verified grade — handlers execute in-process, a bare `cds.connect.to`
throws, the stdout hazard, and the `chdir` / `process.exit` traps. `Project Tracker/CLAUDE.md`
carries the TypeScript-impl loading levers. RSH-006 and RSH-007 are the evidence behind all three
references; read them when a row turns on _why_ a reference says what it says.
