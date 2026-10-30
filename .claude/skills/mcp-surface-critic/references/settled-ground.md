# Settled Ground — the Ruled-Out Register

**Log read through:** `D-238`
**Source:** `Project Tracker/design/DECISIONS_LOG.md`, via `research/mcp-verb-server-critique.md` §3
**Written:** 2026-08-27

> **Phase 0 refuses to proceed on a stale register.** Compare the highest `## D-nnn` in
> `Project Tracker/design/DECISIONS_LOG.md` against the header above. If the log has moved, read the
> delta **before** Phase 2 — a ruling landed since this was written may have closed something you are
> about to propose, or opened something listed here as shut.

---

## How to read this

Column three is written as **the proposal a naive critic would make** — not as the ruling's summary.
That is deliberate: column three is the string you match a candidate finding against. A ruling
summarised in its own vocabulary ("the escape hatch stays closed") does not catch the row a critic
actually writes ("add a query tool so agents skip a round-trip").

**Three states, and the third is not optional:**

| State            | When                                                            | What the report does                                                                                                                               |
| ---------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ruled out**    | A row below forbids it                                          | Goes to the **Ruled Out** list under the table, one line, with the `D-nn` and the reopen trigger. Never numbered as a finding.                     |
| **Trigger fire** | The row's column-four trigger is **measurably** satisfied today | Goes in the table, shaped as the trigger, **with the measurement attached**. "We should reconsider X" without a measurement is not a trigger fire. |
| **Open**         | §Open below — staged in `research/README.md` §8, not yet ruled  | Verdict is **"Needs a ruling."** Not Gap. Not Ruled out.                                                                                           |

**Print the Ruled Out list.** Suppressing it turns a guard into a gag. Sandro must be able to see the
obvious thing was considered and say "actually, reopen that one."

**Never write to `DECISIONS_LOG.md`.** The pack's own convention, stated in `research/README.md` §8:
_"logging them would have manufactured consent."_

---

## The register

| Ruling                  | What it closed                                                                  | The proposal it forbids                                                                                                                                                                   | The only trigger that reopens it                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-05 / D-28 / D-230** | The CRUD escape hatch, at the **tool** surface specifically                     | "Add a `query` / `describe` / `call` / `select` / generic CRUD / raw-SQL tool"; "expose an entity-generic read so agents skip a round-trip"; "let a verb write through `cds.db` directly" | The no-escape-hatch premise is retired — i.e. `SPEC-01` BR-01 is amended. Note D-230 already states plainly that the _OData_ surface is writable by anything reaching `localhost:4005`; that is the accepted local posture, not a gap to close.                             |
| **D-231**               | `@cap-js/mcp`, `@gavdi/cap-mcp`                                                 | "Adopt the official SAP adapter"; "remodel the eleven verbs as unbound CDS actions and use `per_action_tool`"                                                                             | The adapter ships create/update/delete **and** gains stdio, **or** exits Beta. **RSH-007 §7: the HTTP-only constraint is architectural** — an `express.Router()` with an `express` peer dep — so the stdio clause is unlikely to fire without a rewrite. Do not wait on it. |
| **D-40 / D-50**         | The inventory at eleven; nothing is deletable                                   | "Mint a twelfth verb"; "add a delete or cancel path"; "add a verb to tidy up X"                                                                                                           | A workshop. Never a critic run.                                                                                                                                                                                                                                             |
| **D-44 / D-224**        | `mcp/` as a sibling of `srv/`; a tracked `.mjs` installer                       | "Move `mcp/` under `srv/`"; "un-ignore `.mcp.json` and commit it"; "convert `installMcpServer.mjs` to TypeScript"; "move the installer to the shared linter folder"                       | — (`.mjs` keeps it out of `tsc`'s program and out of the `./scripts/**/*.ts` coverage band `SPEC-09` owns.)                                                                                                                                                                 |
| **D-45**                | Qualified story addressing; slug-coded stages; serialized writes                | "Parallelize the write queue"; "resolve a bare story ID instead of rejecting it"; "address stages by display name"                                                                        | — (The serialized queue is also the correct answer to CAP's documented SQLite parallel-transaction deadlock.)                                                                                                                                                               |
| **D-46**                | Remediation on methodology rejections; a repeat call refused with current state | "Make a repeat write idempotent"; "auto-retry a methodology rejection"; "add remediation to `ASSERT_*` failures"                                                                          | — (`ASSERT_*` validation failures pass through with their CAP message unchanged, deliberately.)                                                                                                                                                                             |
| **D-223**               | Identity from the registration environment                                      | "Add an `actor` / `caller` / `user` input to a verb"                                                                                                                                      | A move off local stdio. RSH-007 §6 states the boundary plainly: `PROJECT_TRACKER_ACTOR` is **a claim, not a credential** — asserted by the launching process, not verified. Fine for a local child; must not survive a move to HTTP.                                        |
| **D-225**               | `mcp/` inside four shared linters                                               | "Add a Project-Tracker-specific path to a shared linter"                                                                                                                                  | — (Root `CLAUDE.md` forbids it; a linter that hardcodes a module name breaks every other module.)                                                                                                                                                                           |
| **D-228**               | The SDK/verb boundary                                                           | "Import `@modelcontextprotocol/sdk` from a verb file"; "let a verb build its own `CallToolResult`"; "co-locate `registerTool` next to its handler for readability"                        | — **and this one should be defended harder, not relaxed.** RSH-006 §12: with the SDK confined to one file, a v2 migration is a one-file change; scattered across eleven verbs it is eleven. This is the property that de-risks the migration.                               |
| **D-238**               | The scenarios tier                                                              | "Delete or thin `test/integration/scenarios/` — it duplicates the protocol tier"                                                                                                          | — (The overlap is deliberate and is `TST-001` §14's single documented exception.)                                                                                                                                                                                           |

**If a verb file imports the SDK, D-228 has been crossed and that is finding #1**, ahead of anything
else in the run.

---

## Open — staged, not ruled

These are in `research/README.md` §8 awaiting Sandro. A candidate touching one returns
**"Needs a ruling"**, with the proposed `D-nnn` named.

| Proposed  | Subject                                                                                                                                       | What a critic must NOT do                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **D-239** | Pin `@modelcontextprotocol/sdk` exactly (**R12**)                                                                                             | Do not apply it as a fix. It is a dependency-pinning ruling with D-34's suite-green-either-side constraint attached.                   |
| **D-240** | Whether the nine write verbs declare `destructiveHint` / `idempotentHint` / `openWorldHint`, and whether `EXPECTED_TOOLS` grows those columns | Do not propose the annotation values as settled. Do not present any of them as **enforcement** — see `sdk-1.30.md` §11.                |
| **D-241** | Whether the envelope adopts `outputSchema` + `structuredContent`                                                                              | Do not apply. Blast radius is `readToolEnvelope` plus every scenario spec.                                                             |
| **D-242** | Read-path identity — reads run as `cds.User.Anonymous` while writes run as the actor                                                          | The **bug** is measured and real; the **ruling** is whether every call must be attributable. Report the measurement, stage the ruling. |
| **D-243** | A mechanical §7 consumer check in the shared lint suite                                                                                       | Out of this skill's scope entirely — it touches a shared linter. Mention and move on.                                                  |

---

## Recorded closed — do not re-open

- **D-231's owed fixture edit has landed.** `test/protocol/data/toolSurface.ts` carries `"call"` in
  `FORBIDDEN_TOOLS` with the D-231 citation. Verified on disk 2026-08-27. A run that "finds" this
  again has not read the file.

---

## Where a finding belongs when it is not ruled out

The allocation rule, from `research/README.md` §8:

> **An unknown with a settling action is an `R-nn`. A fork with two defensible answers is a §8
> Proposed Decision. Anything that only changes what a human reads is neither — it is a fix.**

A critic run does not create `R-nn` rows or §8 rows; it _identifies_ which a finding would become,
and says so in the row's verdict column. Writing to `research/` is a separate, deliberate act.
