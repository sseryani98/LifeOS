# Contract Map — What Pins What, and What Nothing Pins

**Written against:** `test/protocol/data/toolSurface.ts` and `jest.config.ts` as of 2026-08-27
**Source:** `research/mcp-verb-server-critique.md` (RSH-007) §4

> **Phase 0 freshness:** both files are short. Re-read `EXPECTED_TOOLS` and the `coverageThreshold`
> block before trusting this map. A fixture that has grown a column since this was written changes
> what the Holes section is entitled to claim.

---

## Why this file exists

`test/protocol/data/toolSurface.ts` is **not an audit target**. Nothing in it is a finding on its
own — every row records a decision made elsewhere. It is a **blast-radius meter**: when a proposal
would edit this file, that edit _is_ the row's cost, and the row must say so.

The **Holes** are the exception. A property nothing pins is a finding.

---

## What is pinned

| Property of the surface                                              | Pinned by                                                                                              | What a change costs                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exactly eleven tools, by exact name                                  | `EXPECTED_TOOLS` + the exhaustiveness assertion (FUT-001)                                              | One fixture row **and** one `VerbRegistry.DEFINITIONS` entry, together                                                                                                           |
| Per-tool `readOnlyHint`                                              | `EXPECTED_TOOLS[].readOnly`                                                                            | One fixture field. The fixture's own comment says why this matters: _"a host that auto-approves read-only tools runs a write verb without asking the moment one is mislabelled"_ |
| Each write tool reaches **its own** verb                             | `WRITE_TOOL_KINDS` — nine unique Activity `kind_code`s                                                 | A new kind. This is the state oracle: bind a tool to a sibling verb and the assertion catches it, which a returned-text assertion never would                                    |
| No generic data tool                                                 | `FORBIDDEN_TOOLS` — `query`, `describe`, `call_action`, `call`, `select`, `insert`, `update`, `delete` | One fixture row                                                                                                                                                                  |
| The FRICEW enum survives zod → JSON Schema → the wire                | `FRICEW_SCHEMA_PATH` — one tool, one property, one member                                              | Hard-coded to a **single** path (see Hole 3)                                                                                                                                     |
| `isError` maps in **both** directions                                | Two protocol assertions                                                                                | — An inverted mapping cannot pass, which is more than most suites do                                                                                                             |
| Reconnect fires on `ECONNRESET`, and **not** on a business rejection | `CONNECTION_FAILURE` + `RETRY_OUTCOME` + the paired negative test                                      | — The negative half is what makes a uniform retry policy safe                                                                                                                    |
| stdout carries only JSON-RPC; the ready line lands on stderr         | `stdoutGuard.test.ts`, spawning a real process and driving raw pipes                                   | — Irreplaceable. Nothing else reproduces a log line inside a live frame stream. **Never propose collapsing this into the in-memory transport.**                                  |
| The exact ready-log string                                           | `READY_LOG` ↔ `BOOTSTRAP.READY_MESSAGE`, with cross-referencing comments in both files                 | Both, together                                                                                                                                                                   |
| The sixteen `SPEC-01` functional units                               | `test/integration/scenarios/`, one spec per unit, named by identifier (D-238)                          | —                                                                                                                                                                                |
| `mcp/verbs/**` coverage                                              | `jest.config.ts` band: **90 lines / 85 branches**                                                      | Jest fails hard on a threshold group matching no files                                                                                                                           |
| `mcp/server.ts` coverage                                             | **Excluded** via `coveragePathIgnorePatterns`                                                          | See Hole 8 — the exclusion is coarser than its justification                                                                                                                     |

---

## The Holes — properties nothing pins

**Ten of the thirteen below were closed on 2026-08-27**, in the run that also produced #1–#11 of that
report. The suite went 159 → 181 tests; `mcp/verbs/**` covers 99.8 / 95.2 against its 90 / 85 band.
Closed rows are kept, struck, with what now pins them — a hole that vanishes from this file is a hole
the next run rediscovers.

**~~1 · `resources/list` and `prompts/list` are unasserted.~~** **CLOSED.** `toolSurface.test.ts`
asserts `getServerCapabilities()` carries `tools` and neither `resources` nor `prompts`. Capabilities
rather than the list calls, because a server declaring no such capability answers `-32601` rather
than an empty array.

**~~2 · Tool descriptions are unasserted.~~** **CLOSED, both halves.** All eleven descriptions were
rewritten to the sectioned form — summary, the constraint the schema cannot express, "not for" where
a sibling verb is confusable — and `DESCRIPTION_FLOOR` plus a distinctness check pins them.

**~~3 · The enum assertion covers exactly one tool.~~** **CLOSED.** `FRICEW_SCHEMA_PATH` became
`ENUM_SCHEMA_PATHS` + `EXPECTED_CODE_LISTS`, table-driven, with `log_defect.severity` as the second
row. `readSchemaEnum`'s `member` is now optional, which is what lets a bare enum and an array-item
enum share one table.

**~~4 · `remediation` is optional in the type and unasserted.~~** **CLOSED.** A `reopen_stage` on a
not-complete stage is asserted to carry remediation naming `start_stage`.

**~~5 · `SERVER_INFO.version` is unasserted.~~** **CLOSED.** `SERVER_INFO.version` moved to `0.0.1`
and `MANIFEST_VERSION` reads `package.json` at fixture load, so the assertion compares two facts
rather than two copies of one.

**~~6 · stdin-EOF shutdown is unasserted.~~** **CLOSED, and the worry did not survive contact.**
`captureStdinShutdown()` spawns the server, waits for the ready line, closes stdin — and the process
**exits on its own**. `cds.serve("all")` does not hold the loop open. Measured, not reasoned.

**7 · Ten of eleven tools never cross a real serialization boundary.** **STILL OPEN.**
`InMemoryTransport` passes messages by reference. `HANDSHAKE_FRAMES` still calls exactly one tool
(`next_action` with `{}`) over a real pipe. Residual small, not zero; one representative _write_ in
`HANDSHAKE_FRAMES` closes it for one frame.

**8 · The coverage exclusion is coarser than its justification.** **STILL OPEN.** `mcp/server.ts` is
excluded whole, but `createServer`, `_isRetryableFailure` and `setupStderrLogging` run
in-process and are exercised by the protocol tier. The clean fix is still splitting the in-process
half into its own file and banding it like `mcp/verbs/**`.

**~~9 · The tested launch path is not the registered one.~~** **CLOSED.** `test/shared/data/launch.ts`
holds `COMMAND` / `ARGS` / `ENTRY`; the harness spawns those args and the installer test asserts the
written registration against them. The installer also **dropped the `npx` wrapper** — it now writes
`node --import tsx …`, removing the orphan shape SDK issue #2023 names and one unobserved stdout
producer.

**~~10 · Clients are never closed.~~** **CLOSED.** `afterAll` closes the suite client; the two
per-test clients close inline.

**~~11 · Two fragilities in the spawn harness.~~** **CLOSED, both.** Termination now parses each line
and matches `frame.id`, derived from the highest id in `HANDSHAKE_FRAMES` rather than hard-coded; the
`error` path kills the child before rejecting.

**~~12 · Nothing rejects an unknown argument key.~~** **CLOSED, and the fix is probe-verified.**
`server.ts` wraps every shape as `z.object(verb.inputShape).strict()` — one line covering all eleven,
which a twelfth verb inherits by construction rather than by remembering. `plan_sprint.stories[]`,
`record_test_run.metrics` and its `failures[]` are strict in their own shapes, since `.strict()` is
top-level only. Eleven protocol assertions, one per tool. See `sdk-1.30.md` §12 #4a for the probe.
**Note the wire consequence:** a rejected key returns `-32602` text, _not_ a verb envelope, so
`readToolEnvelope` would throw on it — assert `isError`, not the parsed body.

**13 · No cancellation, concurrency, or protocol-version-mismatch test.** **PARTIALLY CLOSED.**
Concurrency — the one that ranked first, because `context.service` is reassigned by `reconnect` — is
now covered: eight overlapping `next_action` calls against one server, all asserted to answer.
Cancellation and protocol-version mismatch remain untested.

## Not holes — defensible as-is

Say so plainly when a run surfaces them, so the next run does not re-find them.

- **No conformance tier.** The official `modelcontextprotocol/conformance` suite's server mode
  requires `--url`; there is no stdio server mode. It **cannot** test this server today. Worth
  re-checking — that repo moves fast — but not a hole.
- **No security tier.** Local stdio, single actor, no auth surface, no multi-tenancy.
- **No live-LLM evals in CI.** Relying solely on model-driven testing is itself a named anti-pattern;
  a deterministic harness underneath is the right foundation. An eval belongs as a separate manual
  script — and the sixteen FUTs are already the realistic multi-step task set one would need.
- **Uniform reconnect-once policy** across reads and writes. Defensible for a local DB, and the
  _"does not reconnect when the failure is an answer rather than a fault"_ test is the guard that
  makes it safe.
