# SPEC-01 — MCP Intent-Verb Layer

**Spec ID:** SPEC-01
**FRICEW Objects:** INT-001 (Interface)
**Wave:** 1
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39) — every behaviour below was verified on in-memory SQLite only.

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-27 | Sandro & Claude | Initial creation from the SPEC-01 workshop. Records D-40 through D-46. Eleven verbs, provisional on R1 (D-39).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-07-27 | Sandro & Claude | Applied the four amendments SPEC-02 §6 raised, all consequences of D-47 … D-57 rather than new design. §2 `MethodologyStep.conditional` restated as a predicate name (D-47); §5 gains the `complete_stage` guard precedence (D-52); BR-13 cross-references SPEC-02 BR-28 for the reopened stage's own record (D-57); FUT-005's precondition corrected — `smoke` is never materialised on a backend story (D-48). Status stays **Draft**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-28 | Sandro & Claude | Applied the fifth amendment, raised by SPEC-03 §6. **FUT-014's accepted FRICEW value becomes `Interface`, not `Interfaces`** — D-60 rules the code-list values singular. The rejected value stays `Integration`. One word; no rule, fixture or other FUT changes. Status stays **Draft**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-07-30 | Sandro & Claude | Applied the sixth amendment, raised by SPEC-04 §6 (D-68). §3.1's `next_action` row named one mode; it now names **both** — `next_action(story)` resolves that story, `next_action()` selects a candidate first — and the **null** result as a success (SPEC-04 BR-08, BR-09, BR-15). **BR-16 now states that the `nextAction` is story-scoped to the verb's target story and null when that story has no incomplete Task**, with no fallback to workspace scope (SPEC-04 BR-19). No FUT changes. Status stays **Draft**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-30 | Sandro & Claude | Applied the **ninth** amendment at the SPEC-07 workshop, in two parts (D-83, D-85). (a) §3.1's `project_view` **Returns** cell said "chain", singular, and never said whose, while RPT-003 is per-story — it now reads **each Milestone's chain**, and RPT-003 selects which one to render (SPEC-07 BR-04, BR-05). (b) The write-verb table gains an **`Activity.kind`** column naming all nine emitted kinds — `stageStarted`, `stageCompleted`, `subtaskCompleted`, `stageReopened`, `defectLogged`, `defectResolved`, `decisionRecorded`, `testRunRecorded` and `sprintPlanned` — because BR-03 required every verb to emit a `kind` and **no spec named one**, leaving SPEC-05 BR-33 and SPEC-06 BR-25 referencing an empty set. `sprintPlanned` is shared with FRM-002, so RPT-004 splits machine from human on **`actor`** (D-84). **D-37 §11.1's trigger does not fire** — no guard changed and no verb gained an input; D-55 and D-77's precedent. Status stays **Draft**.                                                                                                                                                                                                                                                                     |
| 2026-07-30 | Sandro & Claude | Applied the **seventh** and **eighth** amendments at the SPEC-06 workshop. `plan_sprint`'s `stories[]` gains a fourth field, **`shipsUi`** (D-76) — SPEC-02 §3.2 already names `plan_sprint` as a caller that sets it, and without it D-47's predicate evaluates against null on every human-planned story while SPEC-03 BR-16 asserts no Milestone carries a null `shipsUi`. The verb gains an explicit **`workspace`** input (D-77), because §5 already rejects a "duplicate story ID in workspace" with no signature carrying that scope. §3.1's `plan_sprint` row, **BR-21** and **FUT-013**'s literal are updated; no rule is renumbered. **A verb signature changed and D-37 §11.1's amendment trigger does not fire** — that trigger is scoped to the SPEC-01/SPEC-02 seam, and this is neither a guard nor that seam. Status stays **Draft**.                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-07-30 | Sandro & Claude | Applied the **tenth** amendment at the SPEC-08 workshop (D-96). `log_defect` required a `story`, but `/human-review-loop` runs ad hoc as well as in-chain and the ad-hoc entry point has no story — while [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-21 already permits an Initiative-scoped Defect and all four seeded Defects carry `story` null. So a legal state had **no verb that could create it**, the sixth occurrence of D-40's analysis after D-40, D-74, D-76, D-77, D-78 and D-83. §3.1's row now reads `story?`, `workspace?` with footnote ², new **BR-18a** requires exactly one of the two, §2's `Defect` row names the two nullable links, and §5 gains **`verb.defect.scopeRequired`** (400) — a verb-input shape check no CAP annotation can pre-empt, because with neither input there is nothing to resolve and no row to attempt. **FUT-009 is corrected** — it called `log_defect` with no scope at all, which BR-18a now rejects, so it names the story mode and its precondition names the story. **D-37 §11.1's trigger does not fire** — it is scoped to a _guard_ on the SPEC-01/SPEC-02 seam, and D-77 is the precedent for it holding when a signature genuinely changed. Status stays **Draft** (D-93). |

| 2026-07-30 | Sandro & Claude | Applied the **eleventh** amendment at the SPEC-09 workshop (D-104, D-105, D-106). `record_test_run` required a `story` and a `stage`, and its only caller is a `posttest` script that on a bare `npm test` has neither — so the verb gains a **`workspace`** mode exactly as `log_defect` did at D-96, the **seventh** occurrence of D-40's analysis. §3.1's row now reads `story?`+`stage?`, `workspace?`, `metrics`, `executedAt` with footnote ³; new **BR-20a** (exactly one scope) and **BR-20b** (explicit `executedAt`); §5 gains **`verb.testrun.scopeRequired`** (400). The shape needed no entity change — [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-26 already permits a null Task link and the seeded run is that shape. Two mapping-table corrections: **`startTime` → `executedAt`** is added, discharging [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §6's obligation; and **`location` is dropped** from the per-failure shape, because `generateTestReport.ts:95` sets it to `suite.name` — the table named four fields where the source produces three (D-106). §2's `TestRun` row gains `executedAt` and its two nullable links, and **amendment 4 makes `executedAt` not null** now that both writers supply it. **D-37 §11.1's trigger does not fire** — a signature changed but it is neither a guard nor the SPEC-01/SPEC-02 seam; D-77 and D-96's precedent. Status stays **Draft** (D-93). |
| 2026-08-06 | Sandro & Claude | Applied the **twelfth** amendment at the Design System stage (D-145) — **the first amendment since approval, and therefore a re-approval, which is exactly the cost D-136 accepted.** §3.1's transport table said "MCP **stdio**, in-process with CAP. No HTTP server, no listening socket", and three Approved specs say their Report "renders from a single `project_view` call" citing **BR-22** ([SPEC-04](SPEC-04-NEXT-ACTION.md) BR-32, [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-30, [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-01). **A browser cannot call an MCP stdio server, and no spec named the read path** — the write path was already named (D-82; D-79's create-handler on `Initiative` and `Milestone`). The transport table gains a **browser read surface** row and new **BR-22a** states it: the same composed-payload implementation is additionally exposed as a **read-only OData projection** on the CAP service this server connects to. **INT-001's own transport is unchanged** — the stdio row describes the MCP server, not the CAP service behind it — so no verb signature changes and **D-37 §11.1's trigger does not fire**. Status **Approved**. |
| 2026-08-04 | Sandro & Claude | **Status → Approved (D-136).** No amendment. D-93 held this spec in Draft "through the Workshops stage… approved after `SPEC-12`", and the [SPEC-12](SPEC-12-DECOMMISSION.md) workshop **found no twelfth amendment**: CNV-005 calls no verb, and `project_view(workspace?)` already carries what [SPEC-12](SPEC-12-DECOMMISSION.md) BR-03 needs. Six of eleven prior workshops amended this spec — eleven amendments, the last being `record_test_run`'s workspace scope at the SPEC-09 workshop (D-104) — so the twelfth finding none is the evidence the verb layer has stopped moving that D-93 was waiting for. Every one of D-40's eleven verbs now has at least one specified consumer. **Still provisional on R1** — that is a recorded dependency, not a third status. Any later amendment is now a re-approval, the cost D-93 accepted. |
| 2026-08-15 | Sandro & Claude | Applied the **thirteenth** amendment at the Data Model stage (D-163) — the **second since approval**, and therefore a second re-approval, the cost D-136 accepted. §2 gains **amendment 5**: `Defect`, `Decision`, `Activity` and `TestRun` each take a **mandatory `workspace` association**. D-145 required the `project_view` payload's collections to be navigation properties and named no construct; standing that up found that **two of the three registers have no navigable path from a Workspace at all** — a Defect's scope is a union of two nullable links, which one `on` condition cannot express, and a Workspace-targeted Decision has no path through Initiative or Milestone. **BR-22a is unchanged**, as are every verb signature and every FUT: each write verb already resolves a workspace (BR-18a; D-96, D-104), so **D-37 §11.1's trigger does not fire**. Status **Approved**. |

---

## 1. Overview

The single read and write path into project state: an MCP stdio server running in the same Node
process as the CAP service layer, exposing **eleven intent-level verbs** and nothing else. There is
no CRUD tool, no raw-SQL tool and no generic query tool, because removing the escape hatch is what
makes the enforced path the only path (D-05). Every verb that changes state emits an Activity event
inside its own transaction (D-25, D-42), which is what makes the log structurally complete rather
than a writer any caller could skip.

**This spec is provisional on R1.** RSH-001's validating spike ran entirely on in-memory SQLite;
D-39 defers the Postgres repeat to the Data Model stage, together with standing up a binding neither
Life OS module currently has. Every mechanism below is Verified — on SQLite.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity              | Role in this spec                                      | Attributes this spec requires                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workspace**       | Addressing root; the `{workspace}` half of a story ref | `slug` (unique, URL-safe), `name`                                                                                                                                                                     |
| **Initiative**      | Created by `plan_sprint`                               | `name`, `goal`, `branch`, `status`                                                                                                                                                                    |
| **Milestone**       | A story; the target of most verbs                      | `storyId`, `fricewType`, `description`, `status` (**derived**, see BR-12)                                                                                                                             |
| **Task**            | A methodology stage instance                           | `stepCode`, `status`, `startedAt`, `completedAt`, `notes`                                                                                                                                             |
| **Subtask**         | A workflow step instance                               | `stepCode`, `status`, `completedAt`                                                                                                                                                                   |
| **MethodologyStep** | Supplies the stage/subtask vocabulary                  | `code` (slug, the key), `name` (label), `kind`, `position`, `conditional` (a **predicate name**)                                                                                                      |
| **Defect**          | `log_defect` / `resolve_defect`                        | `severity`, `status`, `title`, `description`, `references`, `resolution`, plus its nullable links to Milestone and Initiative (SPEC-03 BR-21, BR-18a)                                                 |
| **Decision**        | `record_decision`                                      | `target` (Workspace \| Initiative \| Milestone), `context`, `options`, `decision`, `rationale`                                                                                                        |
| **Activity**        | Emitted by every state-changing verb                   | `kind`, `actor`, `target`, `payload`, `occurredAt`                                                                                                                                                    |
| **TestRun**         | `record_test_run`                                      | `total`, `passed`, `failed`, `pending`, `durationMs`, `linesPct`, `branchesPct`, `failures`, **`executedAt`**, plus its nullable links to Task and Initiative (SPEC-03 BR-26, SPEC-05 §2 amendment 1) |

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `MethodologyStep.code` must be the primary key and `MethodologyStep.name` a label (BR-08).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2   | `Milestone.status` must be computed, not stored writable (BR-12).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 3   | **`MethodologyStep.conditional` is a predicate name** (`shipsUi` or null), **not a boolean** — the step names _which_ predicate is evaluated, and ENH-001 evaluates it once at instantiation (D-47, SPEC-02 §2 amendment 1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | **`TestRun.executedAt` becomes not null.** [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §2 amendment 1 made it nullable because at that time only the migration wrote it and the ongoing path carried no input for it. BR-20b supplies one, and CNV-003 already sets it (SPEC-03 BR-25a), so **no writer can omit it** and the constraint is now honest. A missing value surfaces as `ASSERT_NOT_NULL` **verbatim** rather than a named key — the mechanism decides (D-46, D-105).                                                                                                                                                                                                                                                                                                                                                                                                           |
| 5   | **`Defect`, `Decision`, `Activity` and `TestRun` each gain a mandatory `workspace` association** (Data Model, D-163). Without it there is no navigable path from a Workspace to two of the three registers: a `Defect` links to a Milestone **or** an Initiative, so "every Defect in this Workspace" is a union one association `on` condition cannot express, and a `Decision` may target the Workspace itself, in which case no path through Initiative or Milestone exists at all. This is what makes **BR-22a**'s navigation properties reachable. **No verb signature changes** — every write verb already resolves a workspace (BR-18a; D-96, D-104), so D-37 §11.1's trigger does not fire. `Decision`'s Workspace \| Initiative \| Milestone target is then **two** nullable links plus this scope: a null-null Decision targets its Workspace ([DM-001](../DATA_MODEL.md) §7.2, D-167). |

---

## 3. Functional Description

### 3.1 INT-001 — MCP Intent-Verb Server [Interface]

#### Transport and bootstrap

| Aspect               | Contract                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport            | MCP **stdio**, in-process with CAP. No HTTP server, no listening socket.                                                                                                                                                                                        |
| Browser read surface | **Not this server.** `project_view`'s payload is additionally exposed as a **read-only OData projection** on the CAP service this server connects to, because a browser cannot call an MCP stdio transport (BR-22a, D-145). One implementation, two transports. |
| Bootstrap            | `cds.serve('all').from(model)` → `cds.connect.to(name)`. Never bare `cds.connect.to(name)` (D-28).                                                                                                                                                              |
| TypeScript impl      | `CDS_TYPESCRIPT=true` **and** a `tsx` loader — both required, independent levers (D-33).                                                                                                                                                                        |
| Code location        | `Project Tracker/mcp/` — sibling to `db/ srv/ app/ test/`, not under `srv/` (D-44).                                                                                                                                                                             |
| Registration         | Written by a **tracked installer script**; `.mcp.json` is gitignored (`.gitignore:13`) (D-44).                                                                                                                                                                  |
| Connection holding   | Bootstrap once at server start; one reconnect attempt on a connection-caused failure before reporting (BR-20).                                                                                                                                                  |
| Concurrency          | Writes serialized; reads concurrent (BR-13).                                                                                                                                                                                                                    |
| Transactions         | `srv.tx({ user })` — never `cds.tx`, which stamps `createdBy` but fires no application handlers (RSH-001 §3).                                                                                                                                                   |
| Identity             | The **calling agent's own** name (`implementer`, `test-author`, `gate-runner`, …) (D-41).                                                                                                                                                                       |

#### Verb inventory — eleven, exhaustive

**Write verbs.** Each emits exactly one Activity event inside its own transaction, of the `kind` named
in the last column ([SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-32, D-83).

| Verb               | Inputs                                                                      | Returns                      | `Activity.kind`    |
| ------------------ | --------------------------------------------------------------------------- | ---------------------------- | ------------------ |
| `start_stage`      | `story`, `stage`                                                            | envelope                     | `stageStarted`     |
| `complete_stage`   | `story`, `stage`, `notes?`                                                  | envelope (+ subtask warning) | `stageCompleted`   |
| `complete_subtask` | `story`, `stage`, `subtask`                                                 | envelope                     | `subtaskCompleted` |
| `reopen_stage`     | `story`, `stage`, `reason`                                                  | envelope                     | `stageReopened`    |
| `log_defect`       | `story?`, `workspace?`, `severity`, `title`, `description`, `references?` ² | envelope + `defectId`        | `defectLogged`     |
| `resolve_defect`   | `defect`, `resolution`                                                      | envelope                     | `defectResolved`   |
| `record_decision`  | `target`, `context`, `options?`, `decision`, `rationale`                    | envelope + `decisionId`      | `decisionRecorded` |
| `record_test_run`  | `story?`+`stage?`, `workspace?`, `metrics`, `executedAt` ³                  | envelope                     | `testRunRecorded`  |
| `plan_sprint`      | `workspace`, `name`, `goal`, `branch`, `stories[]`                          | envelope + `initiativeId`    | `sprintPlanned` ¹  |

¹ Shared with FRM-002's Plan Sprint mode ([SPEC-06](SPEC-06-SPRINT-PLANNING.md) BR-23) — one event
type, two writers. RPT-004 separates them by **`actor`**, never by kind (SPEC-07 BR-31, D-84).

² **Exactly one** of `story` / `workspace` is present (BR-18a). `story` scopes the Defect to a
Milestone; `workspace` scopes it to that Workspace's Active Initiative
([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-20). INT-005 uses the first in chain mode and
the second ad hoc ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §3.3, D-96).

³ **Exactly one scope** (BR-20a): `story` **with** `stage`, or `workspace`. Story mode links the
TestRun to that stage's Task; workspace mode links it to that Workspace's Active Initiative with a
**null Task link**, the shape [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-26 already
permits and [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-13 keeps out of health. INT-004 uses
the first when a build supplies the story and the second on a bare `npm test`
([SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §3.1, D-104).

**Read verbs.** Emit no Activity event.

| Verb           | Inputs       | Returns                                                                                                                                                                                                                                                                                                                                                                      |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next_action`  | `story?`     | The next incomplete stage, in library position order regardless of kind. **Two modes:** `next_action(story)` resolves that story alone; `next_action()` selects a candidate story first, then resolves within it. **Either mode may return null** — no incomplete stage remains, which is a success and not an error ([SPEC-04](SPEC-04-NEXT-ACTION.md) BR-08, BR-09, BR-15) |
| `project_view` | `workspace?` | The **whole** view in one call: header, next action, task queue, **each Milestone's chain**, three registers. The chain field is per-Milestone, not one unnamed story's — RPT-003 renders one at a time and selects which ([SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-04, BR-05, D-85)                                                                                     |

Four of the eleven were added at this workshop because a slice-1 object otherwise had no legal write
path (D-40): `record_test_run` (INT-004 writes a `TestRun`), `reopen_stage` (WFL-001 owns stage
reopening), `resolve_defect` (seeded defect D-004 is **Open** and must be closable), and
`complete_subtask` (RPT-003 displays subtask state).

#### Response envelopes

```
success  { ok: true,  timestamp, nextAction, warnings[] }
failure  { ok: false, timestamp, code, message, target?, remediation? }
```

A failure is returned as an MCP tool error with `isError: true` and the CAP status code intact.

#### Addressing

| Thing   | Form                          | Example                     |
| ------- | ----------------------------- | --------------------------- |
| Story   | `{workspace-slug}/{story-id}` | `financial-planner/CNV-001` |
| Stage   | slug code                     | `code-quality`              |
| Subtask | slug code                     | `handoff`                   |

A bare story ID is **rejected**, not resolved — BA-001 §3.3 documents `CNV-001` as live on both
modules' boards, so silent resolution would write to the wrong story.

#### Data mapping — `record_test_run`

`generateTestReport.ts` already holds the Jest JSON (INT-004, D-26). No new plumbing:

| Jest field                          | TestRun attribute |
| ----------------------------------- | ----------------- |
| `numTotalTests`                     | `total`           |
| `numPassedTests`                    | `passed`          |
| `numFailedTests`                    | `failed`          |
| `numPendingTests`                   | `pending`         |
| `startTime` → elapsed               | `durationMs`      |
| `startTime`                         | `executedAt`      |
| `coverage.total.lines.pct`          | `linesPct`        |
| `coverage.total.branches.pct`       | `branchesPct`     |
| per-failure `{suite,title,message}` | `failures`        |

**`lines.pct`, never `statements.pct`** — the two differ, and seeding one against writing the other
is what [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §6 raised to
[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) (SPEC-09 BR-05). `TestRun` carries no statements
attribute, so there is nowhere for the other figure to land.

**`location` is dropped.** This table named four per-failure fields; the source produces three
distinct values — `generateTestReport.ts:95` sets `location` to `suite.name`, the same value
`suite` already carries. Corrected at the SPEC-09 workshop (D-106).

#### Scheduling and retry

**No scheduling.** This module schedules nothing (Project Tracker `CLAUDE.md`); every verb is caller-
driven. **No automatic retry** of a rejected verb — a rejection is a methodology answer, not a
transient fault, and retrying it blindly is the behaviour BR-16's remediation exists to replace. The
one retry in the system is the single reconnect attempt in BR-20, which is a transport concern.

---

## 4. Business Rules

**Surface**

- **BR-01** The verb layer is the only write path into project state. No CRUD tool, no raw-SQL tool and no generic query tool is exposed.
- **BR-02** Exactly eleven verbs exist, as listed in §3.1. A capability the list does not name is not reachable.
- **BR-03** Every state-changing verb emits exactly one Activity event, within the same transaction as its write.
- **BR-04** Read verbs emit no Activity event.
- **BR-05** A verb rejected for any reason writes nothing and emits nothing — including no record of the attempt.

**Identity and transactions**

- **BR-06** Every verb executes under `srv.tx({ user })`. `cds.tx` is never used.
- **BR-07** The transaction user is the calling agent's own identity, and it reaches `createdBy` on every row the verb writes.
- **BR-08** Stages and subtasks are addressed by slug code. The display name is never the key.
- **BR-09** Stories are addressed as `{workspace-slug}/{story-id}`. A bare story ID is rejected.

**Stage lifecycle**

- **BR-10** `complete_stage` on an already-complete stage is rejected, and the rejection carries that stage's current status and completion timestamp.
- **BR-11** `complete_stage` succeeds with a warning when the stage has incomplete subtasks. It does not reject.
- **BR-12** A Milestone's completion is derived from its chain. No verb sets it.
- **BR-13** `reopen_stage` reopens only the named stage. Later completed stages retain their completion records unchanged. What becomes of the **reopened stage's own** record is [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-28 (D-57): In Progress, `startedAt` set to the reopen time, `completedAt` cleared, its Subtasks untouched.
- **BR-14** `reopen_stage` requires a non-empty reason.

**Responses**

- **BR-15** Every verb response carries a server timestamp.
- **BR-16** Every write-verb success response carries the resulting next action. That `nextAction` is **story-scoped to the verb's target story** and is **null when that story has no incomplete Task**. There is no fallback to workspace scope — the workspace answer is reached through `project_view` ([SPEC-04](SPEC-04-NEXT-ACTION.md) BR-19, D-68).
- **BR-17** Every rejection carries a code and a message; where a methodology rule caused it, it also carries a remediation naming the blocking condition and the command that clears it.

**Registers**

- **BR-18** Defect `severity` ∈ {Critical, High, Medium, Low}; `status` ∈ {Open, Closed}.
- **BR-18a** `log_defect` carries **exactly one** of `story` / `workspace`. `story` links the Defect to that Milestone; `workspace` links it to that Workspace's Active Initiative ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-20). Neither, or both, is rejected. Either way exactly one link is written, which satisfies [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-21's at-least-one-present on rows created after cutover (D-96).
- **BR-19** `resolve_defect` requires a non-empty resolution.
- **BR-20** `record_decision` targets a Workspace, Initiative or Milestone, and carries Context, Decision and Rationale. Options is optional.
- **BR-20a** `record_test_run` carries **exactly one scope**: `story` **with** `stage`, or `workspace`. Story mode links the TestRun to that stage's Task; workspace mode links it to that Workspace's Active Initiative ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-20) with a null Task link. Neither, both, or a `story` without a `stage`, is rejected. Either way exactly one link is written, satisfying [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-26 on rows created after cutover (D-104).
- **BR-20b** `record_test_run` carries an explicit **`executedAt`** — when the run executed, distinct from `createdAt`. It is a verb input, not a write-time default (D-105, [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §6).
- **BR-21** `plan_sprint` creates one Initiative and its story Milestones **in the named Workspace**. Each story carries ID, FRICEW type ∈ D-09's six values, description and `shipsUi`.
- **BR-22** `project_view` returns the whole view in one call.
- **BR-22a** The same composed-payload implementation backing `project_view` is **additionally exposed as a read-only OData projection** on the CAP service this server connects to, so the browser can read it — an MCP stdio transport is not reachable from a page. The projection is **read-only and exposes no write path**, so D-05's removal of the CRUD escape hatch stands; agents still reach state only through the verbs. The Forms write through the entity sets D-79's shared create-handler already presumes. **Requirement on the Data Model stage (D-43's shape):** the payload must be expressible as a read-only entity whose collections — task queue, per-Milestone chain, Defects, Decisions, Activity — are **navigation properties**, because `sap.fe.macros` binds collections rather than arbitrary JSON ([DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) §5, D-144, D-145).

**Runtime**

- **BR-23** The server bootstraps via `cds.serve('all').from(model)` then `cds.connect.to(name)`. A bare `cds.connect.to(name)` is never used.
- **BR-24** `cds.log.Logger` and the bare `console.*` methods are redirected to stderr before the transport connects, and `cds.deploy` is called with `{ silent: true }`.
- **BR-25** Nothing but JSON-RPC frames is written to stdout.
- **BR-26** The CAP bootstrap runs once at server start. A call failing for connection reasons triggers exactly one reconnect attempt before the failure is reported.
- **BR-27** Verb implementations use `srv.create()`, `srv.run(INSERT…)` or `srv.send({ query })`. `srv.send({ event, entity, data })` is never used — it throws 501.
- **BR-28** Write verbs are serialized. Read verbs run concurrently.
- **BR-29** The server registration is produced by a tracked installer script. Hand-editing `.mcp.json` is not the durable mechanism.

---

## 5. Error Handling

| Condition                                                     | Response                                                    | i18n key                         |
| ------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| Bare story ID (no workspace prefix)                           | Reject 400, naming the expected form                        | `verb.story.unqualified`         |
| Unknown story / stage / subtask code                          | Reject 404, listing valid codes for that chain              | `verb.target.notFound`           |
| No caller identity declared                                   | Reject 400                                                  | `verb.identity.missing`          |
| Stage already complete                                        | Reject 409 **with current status and timestamp**            | `verb.stage.alreadyComplete`     |
| Stage not started                                             | Reject 409 with remediation naming `start_stage`            | `verb.stage.notStarted`          |
| Methodology guard refuses the transition                      | Reject 409 **with remediation** (WFL-001 supplies the rule) | `verb.stage.blocked`             |
| Stage completed with open subtasks                            | **Succeed**, `warnings[]` names each open subtask           | `verb.stage.subtasksOpen`        |
| `reopen_stage` with empty reason                              | Reject 400                                                  | `verb.reopen.reasonRequired`     |
| `resolve_defect` with empty resolution                        | Reject 400                                                  | `verb.defect.resolutionRequired` |
| `log_defect` with neither or both of `story` / `workspace`    | Reject 400, naming the two modes                            | `verb.defect.scopeRequired`      |
| `record_test_run` with neither, both, or `story` sans `stage` | Reject 400, naming the two modes                            | `verb.testrun.scopeRequired`     |
| Severity or FRICEW type outside its code list                 | Reject 400 (`ASSERT_ENUM` surfaced verbatim)                | `verb.value.notInCodeList`       |
| `plan_sprint` duplicate story ID in workspace                 | Reject 409                                                  | `verb.story.duplicate`           |
| Connection lost mid-call                                      | One reconnect, then reject 503                              | `verb.connection.unavailable`    |
| Any handler rejection                                         | Roll back; surface CAP code and message intact              | —                                |

Rejections carry a `remediation` only where a methodology rule caused them. `ASSERT_*` validation
failures pass through with their CAP message, because a malformed payload is the caller's own bug.

**Guard precedence on `complete_stage`** (D-52, [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md)
BR-30). The table above lists conditions, not an order; where more than one holds, **the first to fire
is the response**:

**blocking predecessor → human-only → not started → already complete → open-subtask warning.**

Human-only sits second because it is a permanent property of the caller, so an agent learns the fact
that will never change before facts that will.

---

## 6. Open Items

| OI    | Status in this spec                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------- |
| OI-04 | **Not resolved here.** Calculated health is SPEC-05's. `project_view` returns whatever ENH-003 computes. |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). This spec assumes one chain. |

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity, the Activity log
already records every state change, and a rejection surfaces to the agent that caused it.

**Provisional dependency — R1.** Every mechanism specified here was verified on in-memory SQLite. The
Postgres repeat is owned by the Data Model stage (D-39), which must also stand up a binding neither
module has. **This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                  | Goes to           |
| ------------------------------------------------------------------------------------- | ----------------- |
| Which transitions the guard actually refuses — the rule table behind BR-17            | SPEC-02 (WFL-001) |
| Whether "cancel vs delete" needs a twelfth verb                                       | SPEC-02           |
| Rejections leave no trace (BR-05), so enforcement firing is invisible in the timeline | SPEC-07 (RPT-004) |
| `MethodologyStep.code` slugs must be seeded to match the codes verbs accept           | SPEC-02 (CNV-001) |

---

## 7. Functional Unit Tests

### FUT-001: The exposed tool list is exactly eleven verbs

**Covers:** INT-001
**Preconditions:** Server started, transport connected.
**Steps:**

1. Issue an MCP `tools/list` request.

**Expected Result:**

- Exactly 11 tools are returned, matching §3.1's inventory by name.
- No tool named `query`, `describe`, `call_action`, `select`, `insert`, `update` or `delete` appears.

### FUT-002: A completed stage advances the chain and emits one Activity event

**Covers:** INT-001
**Preconditions:** `financial-planner/CNV-001` exists with `code-quality` in progress.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "code-quality")`.

**Expected Result:**

- Response `ok: true`, carrying a timestamp and `nextAction` naming the next incomplete stage.
- The `code-quality` Task is complete with a `completedAt`.
- Exactly **one** Activity event exists for the call, with `actor` set to the calling agent.

### FUT-003: A rejected verb writes nothing and logs nothing

**Covers:** INT-001
**Preconditions:** A stage whose methodology guard will refuse completion.
**Steps:**

1. Record the Activity count and the stage's status.
2. Call `complete_stage` on the blocked stage.
3. Re-read both.

**Expected Result:**

- The call returns `ok: false` with `isError: true`.
- Stage status is unchanged.
- Activity count is unchanged — **no record of the attempt** (BR-05).

### FUT-004: Completing an already-complete stage is rejected with usable state

**Covers:** INT-001
**Preconditions:** `code-quality` already complete at a known timestamp.
**Steps:**

1. Call `complete_stage` on it again.

**Expected Result:**

- Rejected 409, key `verb.stage.alreadyComplete`.
- The response carries the stage's current status **and** its original completion timestamp.

### FUT-005: Open subtasks warn rather than block

**Covers:** INT-001
**Preconditions:** `financial-planner/CNV-001` (`shipsUi` false, so `smoke` is never materialised — D-48); `sprint-build` In Progress with `brief` … `coverage` Complete and `handoff` open.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "sprint-build")`.

**Expected Result:**

- Response `ok: true`, key `verb.stage.subtasksOpen` in `warnings[]`.
- `warnings[]` names **`handoff` only**. `smoke` cannot appear — a Conditional step whose predicate fails has no row at all (SPEC-02 BR-12, FUT-014).
- The stage is complete.

### FUT-006: Reopening a stage preserves later stages' records

**Covers:** INT-001
**Preconditions:** `code-quality` and `test-quality` both complete, with distinct `completedAt` values.
**Steps:**

1. Call `reopen_stage("financial-planner/CNV-001", "code-quality", "defect found at commit")`.

**Expected Result:**

- `code-quality` is open again.
- `test-quality` remains complete with its **original** `completedAt` unchanged.
- The Milestone is no longer Done, without any verb having set its status (BR-12).

### FUT-007: Reopen requires a reason

**Covers:** INT-001
**Preconditions:** A completed stage.
**Steps:**

1. Call `reopen_stage` with an empty `reason`.

**Expected Result:**

- Rejected 400, key `verb.reopen.reasonRequired`. Stage stays complete.

### FUT-008: A bare story ID is rejected, not resolved

**Covers:** INT-001
**Preconditions:** `financial-planner/CNV-001` exists.
**Steps:**

1. Call `start_stage("CNV-001", "code-quality")`.

**Expected Result:**

- Rejected 400, key `verb.story.unqualified`, message naming the `{workspace}/{story}` form.
- Nothing is written to Project Tracker's own `CNV-001` or to Financial Planner's.

### FUT-009: The calling agent's identity reaches `createdBy`

**Covers:** INT-001
**Preconditions:** Server running; `financial-planner/CNV-001` exists.
**Steps:**

1. Call `log_defect` on story `financial-planner/CNV-001`, declaring the caller as `implementer`. The story mode is named because BR-18a requires exactly one of `story` / `workspace`.
2. Read the resulting Defect row and its Activity event.

**Expected Result:**

- Both carry `createdBy` / `actor` of `implementer`, not `anonymous` and not a shared agent name.

### FUT-010: stdout carries only JSON-RPC frames

**Covers:** INT-001
**Preconditions:** Server spawned as a child process with stdout captured; a verb whose handler calls `cds.log('app').info()`.
**Steps:**

1. Deploy the model and call that verb.
2. Parse every line of captured stdout as JSON.

**Expected Result:**

- Every line parses as valid JSON-RPC. Zero unparseable lines.
- The CDS log line and the `cds.deploy` banner appear on **stderr**, not stdout.

### FUT-011: A methodology rejection carries actionable remediation

**Covers:** INT-001
**Preconditions:** `commit` stage reachable, `human-review` still open.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "commit")`.

**Expected Result:**

- Rejected 409, key `verb.stage.blocked`.
- `remediation` names the blocking stage (`human-review`) and the command that clears it
  (`/human-review-loop`).

### FUT-012: Closing a defect requires a resolution

**Covers:** INT-001
**Preconditions:** An Open defect.
**Steps:**

1. Call `resolve_defect` with an empty resolution.
2. Call it again with a non-empty resolution.

**Expected Result:**

- First call rejected 400, key `verb.defect.resolutionRequired`; defect stays Open.
- Second call succeeds; defect is Closed and the resolution is stored.

### FUT-013: `plan_sprint` creates an Initiative and its stories in one call

**Covers:** INT-001
**Preconditions:** Workspace `financial-planner` exists.
**Steps:**

1. Call `plan_sprint("financial-planner", "W1-S4", goal, branch, [ {id, type, description, shipsUi} × 3 ])`.

**Expected Result:**

- One Initiative exists carrying name, goal and branch.
- Three Milestones exist beneath it, each with its FRICEW type.
- One Activity event, not four.

### FUT-014: An invalid FRICEW type is refused at the boundary

**Covers:** INT-001
**Preconditions:** Workspace exists.
**Steps:**

1. Call `plan_sprint` with a story typed `Integration`.

**Expected Result:**

- Rejected 400 — `Integration` is not one of D-09's six values (`Interface` is — D-60 rules the code-list values singular).
- No Initiative and no Milestone is created.

### FUT-015: `project_view` answers in one call

**Covers:** INT-001
**Preconditions:** Seeded workspace with stories, defects, decisions and activity.
**Steps:**

1. Call `project_view()` once.

**Expected Result:**

- The response contains header, next action, task queue, methodology chain, and all three registers.
- No second call is needed to render RPT-001…RPT-004.

### FUT-016: Concurrent writes serialize

**Covers:** INT-001
**Preconditions:** Two stages of one story both startable.
**Steps:**

1. Issue two write verbs simultaneously.
2. Read the Activity events.

**Expected Result:**

- Both succeed.
- Their Activity events carry distinct, strictly ordered timestamps — no interleaved partial writes.

---

_SPEC-01 specifies INT-001, the widest fan-out object in [BA-001](../BUSINESS_ARCHITECTURE.md) — every wave-2 and wave-3 object depends on it. Rules behind BR-17's rejections belong to `SPEC-02` (WFL-001), not yet written. **Provisional on R1** per [D-39](../DECISIONS_LOG.md)._
