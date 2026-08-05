# SPEC-09 — Test Report → TestRun

**Spec ID:** SPEC-09
**FRICEW Objects:** INT-004 (Interface)
**Wave:** 3
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 … SPEC-08. **R9 is ruled OUT** (D-101's
precedent). **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-30 | Sandro & Claude | Initial creation from the SPEC-09 workshop. Records **D-103 … D-108**. **Second Wave 3 spec** and the **second standalone** one. [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s **eleventh** amendment applied in-session by the main thread (D-104, D-105, D-106): `record_test_run` gains a `workspace` mode, **BR-20a** and **BR-20b**, `verb.testrun.scopeRequired`, `startTime` → `executedAt`, and `location` dropped from the per-failure shape. [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-29 and its §3.1 guard row scoped to story mode; [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §2 amendment 1 corrected to **not null**; [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13 amended and **BR-13a … BR-13c** added, and SPEC-08 flipped to **Approved** (D-103). [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §6's and SPEC-05 §6's rows to SPEC-09 discharged, and SPEC-08's raised row discharged. **SPEC-09 resolves no OI.** **Provisional on R1**; **R9 ruled out**. Two BA-001 corrections applied in-session, listed in §6. |
| 2026-08-04 | Sandro & Claude | **Status → Approved** at the SPEC-10 workshop (**D-109**). It owed nothing at writing, was reviewed line-by-line after the writer returned, and no decision held it in Draft — [D-93](../DECISIONS_LOG.md)'s Draft ruling is scoped to [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) alone. Its §6 row owed to SPEC-10 is discharged in the same session; amending an Approved spec in-session is the established path ([SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md), [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) and [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) each carry one), so approval costs the amendment nothing. |

---

## 1. Overview

The one consumer that is genuinely not an agent. `generateTestReport.ts` stops writing timestamped
markdown and writes a `TestRun` through the same CAP service layer the MCP verbs call, moving into
Project Tracker as `scripts/recordTestRun.ts` because the fix its own research proves —
`process.chdir` before requiring `@sap/cds` — hardcodes a module name that the root `CLAUDE.md`
forbids inside the shared linter folder. BA-001 §11 row 09 cuts it standalone for three unique
concerns, and all three turned out to be real: the `process.chdir` trap, the `posttest` lifecycle,
and the Jest JSON mapping.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity         | Role in this spec                              | Attributes this spec requires                                                                                                                                        |
| -------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TestRun**    | The write target                               | `total`, `passed`, `failed`, `pending`, `durationMs`, `linesPct`, `branchesPct`, `failures`, `executedAt`, plus its nullable links to Task and Initiative (SPEC-03 BR-26) |
| **Task**       | Story mode's link target                       | `status`, addressed by slug `code` (SPEC-02 §3.1)                                                                                                                        |
| **Milestone**  | Resolves the story half of a qualified reference | `storyId`                                                                                                                                                              |
| **Initiative** | Workspace mode's link target                   | `status`, `position` — read only to resolve the Active Initiative (SPEC-05 BR-20)                                                                                        |
| **Workspace**  | The slug half of a qualified reference, and workspace mode's scope | `slug`                                                                                                                                |

**Everything above is already required by SPEC-01 … SPEC-08; the Data Model stage should not
double-count. Nothing this spec never reads or writes is declared here.**

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **No new entity and no new link shape.** Workspace mode needs neither — [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-26 already permits a TestRun linked to an Initiative with a null Task link, and the seeded run is permanently that shape ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-13).                                                                                                                                                                |
| 2   | **`TestRun.linesPct` and `branchesPct` are nullable.** Jest's coverage summary is optional — `generateTestReport.ts:57-65` reads it inside a silent `catch`, and a run without `--coverage` produces neither file. SPEC-01 §2 and SPEC-03 §2 list both unqualified, so this is the first spec to state it; BR-08 writes the TestRun anyway.                                                                                                                                           |
| 3   | **`TestRun.executedAt` is not null** — applied at [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §2 amendment 4 and noted here rather than restated. It was nullable because only the migration wrote it; SPEC-01 BR-20b gives the ongoing path an input, so no writer can omit it (D-105).                                                                                                                                                                                             |
| 4   | **The identity enumeration gains one value — `test-report`** (BR-17). [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) §2 amendment 6 holds the enumeration and [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §2 amendment 3 extended it by two. This value is **not an agent**, which is new — every prior value names an agent or `sandro` — and it lands in RPT-004's machine half like every non-`sandro` value ([SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-30).             |

---

## 3. Functional Description

### 3.1 INT-004 — Test Report → TestRun [Interface]

[SPEC-08](SPEC-08-CONSUMER-REWIRING.md)'s D-95 gives a `File | Line(s) | Currently instructs |
Instructs instead | Verb` table for an object whose deliverable is edited prose. **INT-004's
deliverable is executable code**, so its two retired-path references are lines of a program rather
than instructions to an agent, and the object's real content is a contract and a lifecycle rather
than a set of edits. §3.1 therefore carries the Interface template's own four headings, and §7 is
behavioural rather than split ten-to-two (D-103).

#### Location and lifecycle

| Aspect         | Contract                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Moves from     | `Standards (Technical + Linting)/scripts/generateTestReport.ts`                                                                                                                              |
| Moves to       | **`Project Tracker/scripts/recordTestRun.ts`**                                                                                                                                              |
| `posttest`     | `Financial Planner/package.json:14` repoints by path — it already names an explicit path, so this is a one-line edit                                                                        |
| New npm script | **`record-test-run`**, exposing the same file for explicit invocation (BR-03a)                                                                                                              |
| Carve-out      | Reverses Project Tracker `CLAUDE.md`'s "**No `scripts/` folder**" carve-out, which now reads "until `INT-004`". Stated, not hidden                                                          |

**The move is forced, not stylistic.** The root `CLAUDE.md` says a shared linter roots itself at
`process.cwd()` and hardcodes no path outside it, and that is exactly what makes one copy serve every
module. `process.chdir(<Project Tracker root>)` names a module. A script that names a module belongs
in the module.

#### Why this consumer reaches CAP directly

D-94 says every rewired consumer reaches the verbs as an MCP client through the Claude Code harness.
**INT-004 is the one where that does not hold**: it is a plain Node process npm spawns, not a
subagent, so there is no harness to carry an MCP client. It calls the **same CAP service the MCP
verbs call** — the service that owns [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-29's
guard, [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-03's Activity emission and SPEC-01 BR-06's
`srv.tx({ user })` — so **no guarantee is bypassed and D-05's escape hatch stays shut**. This is
D-58's precedent (the migration writes through the CAP service layer because D-05 binds agents) and
D-79's mechanism (one shared handler, so no caller can skip a rule another hits) applied to a third
kind of caller, alongside the MCP server and the two Forms.

#### Bootstrap sequence

The order is the whole finding (RSH-001 §10):

1. Read Jest's `coverage/test-results.json` and `coverage/coverage-summary.json` from
   **`process.cwd()`** — the module under test.
2. `process.chdir(<Project Tracker root>)`.
3. **Dynamically** `await import('@sap/cds')` — static imports hoist above step 2, so a static import
   defeats the chdir.
4. Bootstrap and call the service.
5. `process.exit(0)`.

**The evidence.** `cds.env` is read from `cds.root`, which defaults to `process.cwd()` at require
time; loading the model by absolute path from the wrong cwd compiles fine and then throws
`Didn't find a configuration for 'cds.requires.db'`, and repointing `cds.root` after the require does
not recover it. The database pool keeps the event loop alive, so without step 5 `npm test` hangs.

#### API contract

`record_test_run(story?, stage?, workspace?, metrics, executedAt)` under identity **`test-report`**.
Exactly one scope ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-20a).

| Mode          | Applies when                                                     | Links to                                                                            |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Story**     | The environment supplies a qualified story **and** a stage slug  | That stage's **Task**                                                                 |
| **Workspace** | Otherwise                                                        | The Workspace's **Active Initiative**, with a **null Task link** (SPEC-05 BR-20, SPEC-05 BR-13) |

#### Data mapping — Jest → TestRun

| Jest field                            | TestRun attribute |
| ------------------------------------- | ----------------- |
| `numTotalTests`                       | `total`           |
| `numPassedTests`                      | `passed`          |
| `numFailedTests`                      | `failed`          |
| `numPendingTests`                     | `pending`         |
| `startTime` → elapsed                 | `durationMs`      |
| `startTime`                           | `executedAt`      |
| `coverage.total.lines.pct`            | `linesPct`        |
| `coverage.total.branches.pct`         | `branchesPct`     |
| per-failure `{suite, title, message}` | `failures`        |

#### Scheduling and retry

**No scheduling.** This module schedules nothing; the script is invoked by npm and by the gate call
sites. **No retry.** A rejection is a methodology answer, not a transient fault
([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §3.1); the script surfaces it under BR-15 and does not
retry. The one retry in the system is SPEC-01 BR-26's single reconnect, which is the CAP client's,
not the script's.

---

## 4. Business Rules

**Surface and lifecycle**

- **BR-01** The script writes **no file**. `project/test-reports/` is neither read nor written, and the rolling-retention block (`MAX_REPORTS`, `readdirSync`, `unlinkSync`) is deleted with the markdown assembly. INT-004's two measured retired-path references — `generateTestReport.ts:6` and `:125` — go with the code that used them.
- **BR-02** The script lives at `Project Tracker/scripts/recordTestRun.ts`. `Financial Planner/package.json`'s `posttest` names that path.
- **BR-03** `gate-runner` needs **no new tool grant** (D-26). It runs `npm test` as it does today; the additional invocation of BR-03a is a Bash command, which its `tools: Read, Grep, Bash` already covers.
- **BR-03a** A `record-test-run` npm script exposes the same file, and both gate call sites invoke it after `npm test` **without regard to whether the suite passed** ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13a). `posttest` alone would record only passing runs — npm skips a `post` script when the main script exits non-zero. **One carve-out**: `test-quality.js` invokes it on a **full** run only (SPEC-08 BR-13b). Its scoped path is `npx jest`, not an npm lifecycle at all, and its coverage table is partial by design.
- **BR-04** The script reads `coverage/test-results.json` and `coverage/coverage-summary.json` from **`process.cwd()`**, the module under test, and reads both **before** BR-13's chdir.

**Data mapping**

- **BR-05** `linesPct` comes from `coverage.total.lines.pct` and **never from `statements.pct`**. The two differ — the W1-S2 checkpoint carries Lines 98.71% and Statements 98.73% — `TestRun` has no statements attribute, and [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-25 seeds `linesPct` **98.71** deliberately. A statements read would put ongoing rows in disagreement with the seeded one on the same column, which is the class of drift this module exists to remove. `generateTestReport.ts:115` already reads `lines.pct`, so this rule protects correct code against a plausible-looking correction at Build rather than describing a change.
- **BR-06** `executedAt` is Jest's **`startTime`** — when the run executed — not the write time ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-20b, D-105).
- **BR-07** `durationMs` is the elapsed milliseconds from `startTime`; `failures` carries **`{suite, title, message}`** per failed assertion — three fields, not four. SPEC-01 §3.1 named `location` and the source sets it to `suite.name`, the value `suite` already carries (D-106).
- **BR-08** With no coverage summary, `linesPct` and `branchesPct` are **null** and the TestRun is still written. The counts and `executedAt` do not depend on coverage.

**Scope**

- **BR-09** Every call carries **exactly one** scope ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-20a): `story` with `stage`, or `workspace`.
- **BR-10** Story mode applies when the environment supplies both a qualified story and a stage slug. The story is **carried, not constructed** ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-04a) — it arrives already qualified from `next_action()` or `project_view`. The stage is the **caller's own running stage**: `sprint-build` under `/build`, `test-quality` under `/test-quality`. It cannot be a fixed value, because [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-29 refuses a target Task that is Not Started and only the running stage is In Progress.
- **BR-11** Workspace mode applies otherwise. The slug comes from a **declared mapping** held in Project Tracker, keyed on the module folder — `Financial Planner` → `financial-planner`. It is **never derived from the folder name**, which is [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-04a's rule one object over. An unmapped folder is BR-15's case, not a guess.
- **BR-12** A workspace-mode TestRun links to the Active Initiative — the Active one with the highest `position` ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-20) — with a **null Task link**. It is therefore never live for health (SPEC-05 BR-13) and reaches only the gate tile, which resolves both link shapes (SPEC-05 BR-24). A bare `npm test` is recorded honestly without becoming a health signal about a story it never ran against.

**Runtime**

- **BR-13** `process.chdir(<Project Tracker root>)` runs **before the first import of `@sap/cds`**, and because static imports hoist, the CAP interaction is behind a **dynamic `await import()`** (RSH-001 §10).
- **BR-14** The script ends with an explicit **`process.exit(0)`**. Without it the database pool keeps the event loop alive and `npm test` hangs (RSH-001 §10).
- **BR-15** Any failure to record — connection lost, model not deployed, unmapped workspace, unresolvable story, **or a verb rejection** — writes a warning to **stderr naming the run that was lost** and exits **0**. `npm test` never fails because the tracker is unavailable.
- **BR-16** A missing `coverage/test-results.json` is BR-15's case: warn, write nothing, exit 0.
- **BR-17** The script writes under identity **`test-report`** (D-41, [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-07). It is not `gate-runner`, which has no write channel (D-26), and not the invoking agent.
- **BR-18** The write goes through the **same CAP service the MCP verbs call**, so [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-03's single Activity event, SPEC-01 BR-06's `srv.tx({ user })` and [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-29's guard all apply unchanged. INT-004 opens **no second write path** (D-05, D-58, D-79).
- **BR-19** No scheduling and no retry.
- **BR-20** **At most one TestRun per (`executedAt`, scope).** A second invocation for the same run writes nothing and is not an error. This is what makes BR-03a's unconditional call safe on a passing run, where `posttest` has already recorded it, and it makes a manually re-run recorder harmless.

**Consumers**

- **BR-21** `test-quality.js`'s gate agent takes coverage from the **console table**, falling back to **`coverage/coverage-summary.json`** — the file this script itself reads. The `TestRun` is **not** a source there and cannot be: `posttest` fires after `npm test` exits, so the run's own TestRun does not exist when the gate agent reports ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13, D-107).
- **BR-22** The five existing markdown reports under `project/test-reports/` are **neither migrated nor deleted here** — D-24's carve-out stands (none names a story, sprint, branch or commit) and CNV-005 retires the folder.

---

## 5. Error Handling

**SPEC-09 mints no error key of its own**, and that follows from the mechanism (D-46, D-79). Two
reasons. Every rejection INT-004 can provoke is an **existing** SPEC-01 or SPEC-02 key, because the
consumer calls a verb and the verb owns the guard. And **no rejection reaches a caller that could act
on it**: under `posttest` there is no agent in the loop at all, and under BR-03a's explicit call the
gate agent is running but BR-15 swallows the rejection into a stderr warning rather than returning it
— by design, since a red build must not be caused by the tracker. So the `remediation` string
SPEC-01 BR-17 attaches is written to stderr and read by Sandro, never acted on in-session. That is the
disposition SPEC-04, SPEC-05, SPEC-07 and SPEC-08 each reached by a different route.

| Condition                                             | Key                                                                                            | Owner                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| No caller identity declared                           | `verb.identity.missing`                                                                        | [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §5                                                   |
| Neither scope, both, or `story` without `stage`       | `verb.testrun.scopeRequired`                                                                   | SPEC-01 §5 (added by SPEC-01's eleventh amendment)                                                |
| A bare story ID                                       | `verb.story.unqualified`                                                                       | SPEC-01 §5 — **prevented**, not impossible: BR-10 carries the qualified form rather than building one, but nothing structurally constrains what an instruction puts in the environment |
| Unknown story or stage slug                           | `verb.target.notFound`                                                                         | SPEC-01 §5                                                                                       |
| Story mode against a Not Started Task                 | `wfl.testrun.stageNotStarted`                                                                  | [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) §5, SPEC-02 BR-29                        |
| Connection lost mid-call                              | `verb.connection.unavailable` after one reconnect                                              | SPEC-01 §5, SPEC-01 BR-26                                                                        |
| `executedAt` absent                                   | `ASSERT_NOT_NULL` surfaced **verbatim** — no named key, because a CDS constraint pre-empts it (D-46) | CAP                                                                                         |

**Every one of these lands the same way** — a stderr warning and exit 0 (BR-15). That is what
distinguishes this consumer from every other: it cannot surface a remediation to an agent, because no
agent is reading.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-09 resolves no open item.** OI-05 is the only one still open, it is not a workshop question,
and this spec touches no `Methodology` shape.

**Alerts:** asked per the standing rule — **none.** The script's only signal is a stderr warning to
whoever ran `npm test`; nothing observes state and this module schedules nothing.

**Provisional dependencies — R1 only.**

- **R1** (Postgres unverified) — inherited exactly as SPEC-01 … SPEC-08 inherit it. Owner: the **Data
  Model stage** (D-39). **Sharper here than elsewhere**: RSH-001 §10's whole `cds.root` finding was
  measured against in-memory SQLite, and BR-13's fix is the one thing in this spec whose failure mode
  is a connection error.
- **R9 — ruled OUT**, on **D-101's precedent and D-82's test**. R9's mechanism is per-**origin**: two
  CAP processes serving into one shell page. INT-004 is a Node process with an in-process CAP client,
  no HTTP server, no page and no browser-originated request, so there is no origin for the risk to
  attach to. Ruled explicitly rather than inherited silently (D-82's own argument read the other way).
- **R5, R6 and R10** belong to INT-006 / SPEC-10.

**This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                | Goes to                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| ~~`lintNoMarkdownState`'s roots must reach **`Project Tracker/scripts/`**. The script leaves `Standards (Technical + Linting)/` and lands under neither `.claude/**` nor `Standards/**`, so the glob question D-100 opened widens by a third root — a future edit reintroducing `project/test-reports/` in this file would be caught by nothing~~ — **discharged 2026-08-04.** [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-17 names `Project Tracker/scripts/` as one of six declared roots, and SPEC-10 BR-18 makes its absence today a skip rather than a failure — the third root is born missing, which is what D-36 already required of every shared linter | **SPEC-10 (INT-006)** — **discharged** |
| ~~**`TestRun` volume changes shape.** The old script capped at five files by rolling retention; nothing caps rows, and every `npm test` now writes one. Slice 1 needs no retention — [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-24 reads only the most recent and RPT-004 excludes TestRun (D-19) — but the exporter's per-checkpoint cadence now carries a table that grows several times a day~~ — **discharged at the SPEC-11 workshop as [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) BR-07 (D-125), and the answer is the sort key, not a filter.** Filtering would break the round-trip, the one property the exporter exists to provide; ordering `TestRun` by `executedAt` makes several-times-a-day growth a pure append at the end of one file, where ordering by ID would scatter it, because UUIDs do not sort chronologically | **SPEC-11 (INT-007)** — discharged |
| ~~CNV-005 must retire `project/test-reports/` **after** INT-004 stops writing to it, or the folder reappears on the next `npm test`. INT-004 stops first; CNV-005 deletes the folder and its five files~~ — **discharged at the SPEC-12 workshop as [SPEC-12](SPEC-12-DECOMMISSION.md) BR-06**, a precondition that reads `posttest` **and** both gate call sites, since [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13a's two explicit `npm run record-test-run` calls are also write paths. **[SPEC-12](SPEC-12-DECOMMISSION.md) BR-09 also records what this row did not**: the five files are **untracked** (`Financial Planner/.gitignore:21`), so their deletion is irreversible, accepted on D-24's finding, and sequenced **last** among the deletions | **SPEC-12 (CNV-005)** — discharged |
| **Two values name a sibling module from inside this one** — BR-11's declared workspace mapping (`Financial Planner` → `financial-planner`) and BR-13's Project Tracker root. They are the only such values in the module, and they exist because a `posttest` script necessarily straddles two modules. Data Model should decide whether they are **configuration or code** — a mapping in a config file is editable without a deploy; a constant is not                                                                                                                                     | **Data Model** — raised        |

**BA-001 corrections** — two, both **applied in this session**.

| Correction                                                                                                                                                                                                                                                                                                                                                                          | Where             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~INT-004's row says `gate-runner` "continues to invoke the script **exactly as it does today**"~~ — the **tool-grant** half of D-26's carve-out survives untouched, but the invocation does not: the story and stage arrive in the environment, and both gate sites gain an explicit `npm run record-test-run` call, because `posttest` does not fire on a failing suite            | §4 INT-004 — done |
| ~~INT-004's row lists the per-failure shape as `{suite, title, message, location}`~~ — the source produces **three** distinct values; `generateTestReport.ts:95` sets `location` to `suite.name`                                                                                                                                                                                     | §4 INT-004 — done |

---

## 7. Functional Unit Tests

**Thirteen FUTs, and D-95's ten-inspection-to-two-behavioural split does not carry over** —
[SPEC-08](SPEC-08-CONSUMER-REWIRING.md)'s deliverable was prose, which can only be inspected;
INT-004's is executable, so all but SPEC-09 FUT-010 run the thing (D-103).

Story IDs below are **Financial Planner's** unless the text says otherwise — Project Tracker runs its
own `CNV-001` (BA-001 §3.3).

### FUT-001: A build's run links to the running stage's Task

**Covers:** INT-004
**Preconditions:** The CAP service is deployed; the migrated fixture is loaded; Financial Planner's
CNV-001 is the one Backlog story on W1-S3 with a materialised chain
([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-18, SPEC-03 BR-31) and **`sprint-build` is
In Progress** — the state [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-11a's `start_stage` creates and
SPEC-08 FUT-012 step 2 exercises. The environment supplies story `financial-planner/CNV-001` and
stage `sprint-build`.
**Steps:**

1. Run `npm test` in Financial Planner.
2. Read the resulting TestRun.

**Expected Result:**

- **A second TestRun exists** — one new row linked to the `sprint-build` **Task** (BR-10), beside the
  migrated one, which is untouched. The fixture already carries a TestRun
  ([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-25), so the assertion is on the new row
  and not on the table's size.
- Counts come from the Jest JSON (BR-04); `linesPct` from `lines.pct` (BR-05); `executedAt` equals
  `startTime` (BR-06).
- **No file is created under `project/test-reports/`** — the folder still holds the five reports
  CNV-005 retires, and none is added (BR-01, BR-22).

### FUT-002: A bare `npm test` records against the Active Initiative and never reaches health

**Covers:** INT-004, ENH-003
**Preconditions:** The migrated fixture is loaded; **W1-S3 is the Active Initiative**
([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-10). No story and no stage in the
environment.
**Steps:**

1. Run `npm test`.
2. Read the TestRun, the gate tile and Workspace health.

**Expected Result:**

- The TestRun links to the **W1-S3 Initiative** with the Task link **null** (BR-12, SPEC-03 BR-26).
- The gate tile shows it and names W1-S3 and its `executedAt`
  ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-24, SPEC-05 BR-25).
- **Workspace health is unchanged** — a null-Task run is never live (SPEC-05 BR-13).
- **No `wfl.testrun.stageNotStarted` is raised**, because workspace mode has no target Task for the
  guard to read ([SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-29 as scoped).

### FUT-003: `linesPct` reads lines, not statements

**Covers:** INT-004
**Preconditions:** The migrated fixture is loaded, so the **seeded TestRun exists**
([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-25) — step 3 reads it. A coverage summary
whose `total.lines.pct` and `total.statements.pct` **differ** — 98.71 against 98.73, the W1-S2
checkpoint's own pair.
**Steps:**

1. Run the recorder in workspace mode.
2. Read the new TestRun's `linesPct`.
3. Read the seeded TestRun's `linesPct`.

**Expected Result:**

- **98.71** on the new row (BR-05).
- **98.71** on the seeded one ([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-25) — one
  number for one metric across both rows.

### FUT-004: `executedAt` is the run's start, not the write time

**Covers:** INT-004
**Preconditions:** The migrated fixture is loaded, so workspace mode has a Workspace and an Active
Initiative to resolve — without one BR-15 fires and nothing is written. A run whose `startTime` is
knowably earlier than the write.
**Steps:**

1. Read `startTime` from `coverage/test-results.json`.
2. Run the recorder.
3. Read the TestRun's `executedAt` and `createdAt`.

**Expected Result:**

- `executedAt` equals `startTime` (BR-06).
- `createdAt` is **later**.
- The two are distinct values, which is the property D-72 added the attribute for.

### FUT-005: No coverage summary still writes a TestRun

**Covers:** INT-004
**Preconditions:** The migrated fixture is loaded, so workspace mode resolves a scope.
`coverage/coverage-summary.json` absent — a run without `--coverage`; `coverage/test-results.json`
present.
**Steps:**

1. Run the recorder.

**Expected Result:**

- The TestRun is written with counts populated (BR-08).
- `linesPct` and `branchesPct` are **null** (BR-08, §2 amendment 2).
- `executedAt` is still set, without which the write would fail `ASSERT_NOT_NULL`
  ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §2 amendment 4).

### FUT-006: An unreachable store warns and does not fail `npm test`

**Covers:** INT-004
**Preconditions:** Project Tracker's database unreachable; every test passing.
**Steps:**

1. Run `npm test`.

**Expected Result:**

- `npm test` exits **0** (BR-15).
- A warning naming the lost run appears on **stderr**.
- **No TestRun exists.**
- The jest verdict is unaffected.

### FUT-007: A guard refusal does not fail the build

**Covers:** INT-004, WFL-001
**Preconditions:** `financial-planner/CNV-001` with **`test-quality` Not Started** — the state
[SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) FUT-017 builds. The environment names story
`financial-planner/CNV-001` and stage `test-quality`.
**Steps:**

1. Run `npm test` with every test passing.

**Expected Result:**

- The verb is rejected 409 `wfl.testrun.stageNotStarted`, with remediation naming `start_stage`
  (SPEC-02 BR-29).
- **No TestRun row and no Activity row** — a rejected verb writes nothing and emits nothing,
  including no record of the attempt ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-05).
- The script warns and exits **0**, and `npm test` is green (BR-15).

### FUT-008: The chdir happens before the CAP import, and the Jest JSON is read before the chdir

**Covers:** INT-004
**Preconditions:** `posttest` runs with cwd = Financial Planner; Project Tracker's model and binding
are live.
**Steps:**

1. Run `npm test` in Financial Planner.
2. Record which `coverage/` directory the Jest JSON was read from.
3. Record which root `cds.env.requires.db` resolved against.
4. Repeat the run with the chdir **removed**, and again with it **after** the `@sap/cds` import.

**Expected Result:**

- The JSON comes from **Financial Planner's** `coverage/` (BR-04).
- `cds.env.requires.db` resolves against **Project Tracker's** root and the connection succeeds
  (BR-13).
- Both variants in step 4 throw **`Didn't find a configuration for 'cds.requires.db'`** (RSH-001
  §10). The model still **compiles** in each, which is what makes the trap silent — and the second
  variant is why BR-13 requires a dynamic import rather than only an early chdir.

### FUT-009: `npm test` terminates

**Covers:** INT-004
**Preconditions:** A successful write.
**Steps:**

1. Run `npm test` to completion and observe the process.
2. Repeat with `process.exit(0)` **removed**.

**Expected Result:**

- Step 1's process exits and does not hang (BR-14).
- Step 2's does hang, on the open pool (RSH-001 §10) — which is what makes BR-14 a rule rather than
  tidiness.

### FUT-010: Inspection — the script names no retired path and writes no file

**Covers:** INT-004
**Preconditions:** The script as rewritten.
**Steps:**

1. Search `Project Tracker/scripts/recordTestRun.ts` for `test-reports`, `SPRINT_BOARD`,
   `DEFECT_LOG` and `project/sprints/`.
2. Search it for `writeFileSync`, `readdirSync` and `unlinkSync`.
3. Read `Financial Planner/package.json`'s `posttest` and `record-test-run` scripts.

**Expected Result:**

- **Zero matches** for every string in steps 1 and 2 (BR-01).
- `Standards (Technical + Linting)/scripts/generateTestReport.ts` no longer exists (BR-02).
- Both npm scripts name the new path (BR-02, BR-03a).

### FUT-011: The write is guarded, attributed, and logged once

**Covers:** INT-004, INT-001
**Preconditions:** SPEC-09 FUT-001's fixture.
**Steps:**

1. Run the recorder.
2. Read the TestRun's `createdBy` and the emitted Activity row.

**Expected Result:**

- `createdBy` is **`test-report`** and the Activity's `actor` is **`test-report`** (BR-17,
  [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-07).
- **Exactly one** Activity of kind **`testRunRecorded`** (SPEC-01 BR-03,
  [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-32).
- It files in RPT-004's **machine** half, since it is not `sandro` (SPEC-07 BR-30).

### FUT-012: The workspace slug is declared, not derived

**Covers:** INT-004
**Preconditions:** The migrated fixture is loaded, so the `financial-planner` Workspace and its Active
Initiative exist to resolve to. Workspace mode; the mapping carries
`Financial Planner` → `financial-planner`.
**Steps:**

1. Run the recorder in Financial Planner.
2. Repeat with that mapping entry **absent**.

**Expected Result:**

- Step 1 resolves `financial-planner` and writes (BR-11).
- Step 2 **warns and writes nothing** (BR-11, BR-15) rather than constructing a slug from the folder
  name ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-04a) — the folder is `Financial Planner`, which is
  not a slug.

### FUT-013: A failing suite is recorded, and recording it twice writes one row

**Covers:** INT-004, INT-002
**Preconditions:** SPEC-09 FUT-001's fixture; at least one test made to fail, so `npm test` exits
non-zero.
**Steps:**

1. Run `npm test`.
2. Observe whether `posttest` ran.
3. Run `npm run record-test-run`.
4. Read the TestRun rows.
5. Run `npm run record-test-run` a second time and re-read.

**Expected Result:**

- **`posttest` did not run** — npm skips a `post` script when the main script exits non-zero
  ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13a).
- The explicit call writes one TestRun with **`failed` > 0** and `passed` < `total`, and its
  `failures` array carries **`{suite, title, message}`** per failed assertion — three fields, no
  `location` (BR-07).
- The second call writes **nothing** and is not an error, leaving exactly one row for that
  `executedAt` and scope (BR-20).
- This is the only path by which a `failed` > 0 TestRun can exist on the ongoing path, and therefore
  the only thing that makes [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-10 — a live TestRun
  with `failed` > 0 signals Struggling — reachable rather than a rule over an empty set.

---

_SPEC-09 specifies INT-004, the one consumer that is not an agent, per [BA-001 §11 row 09](../BUSINESS_ARCHITECTURE.md). The verb it calls is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s, amended an **eleventh** time here (D-104, D-105, D-106); the guard that verb enforces is [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-29's, scoped to story mode here; the fixture its FUTs run against and the seeded run its `linesPct` must agree with are [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md)'s; the Active Initiative a bare `npm test` resolves to and the gate tile that reads its rows are [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md)'s; the register its Activity lands in is [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md)'s; the gate call sites that invoke it are [SPEC-08](SPEC-08-CONSUMER-REWIRING.md)'s, amended and approved here (D-103, D-107). **SPEC-09 resolves no OI.** **Provisional on R1** ([D-39](../DECISIONS_LOG.md)); **R9 ruled out** ([D-101](../DECISIONS_LOG.md))._
