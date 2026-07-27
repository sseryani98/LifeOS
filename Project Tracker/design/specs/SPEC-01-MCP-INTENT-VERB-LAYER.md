# SPEC-01 — MCP Intent-Verb Layer

**Spec ID:** SPEC-01
**FRICEW Objects:** INT-001 (Interface)
**Wave:** 1
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Draft
**Provisional on:** **R1** (D-39) — every behaviour below was verified on in-memory SQLite only.

---

## Change History

| Date       | Author          | Description                                                                                                    |
| ---------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-07-27 | Sandro & Claude | Initial creation from the SPEC-01 workshop. Records D-40 through D-46. Eleven verbs, provisional on R1 (D-39). |

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

| Entity              | Role in this spec                                      | Attributes this spec requires                                                                  |
| ------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Workspace**       | Addressing root; the `{workspace}` half of a story ref | `slug` (unique, URL-safe), `name`                                                              |
| **Initiative**      | Created by `plan_sprint`                               | `name`, `goal`, `branch`, `status`                                                             |
| **Milestone**       | A story; the target of most verbs                      | `storyId`, `fricewType`, `description`, `status` (**derived**, see BR-12)                      |
| **Task**            | A methodology stage instance                           | `stepCode`, `status`, `startedAt`, `completedAt`, `notes`                                      |
| **Subtask**         | A workflow step instance                               | `stepCode`, `status`, `completedAt`                                                            |
| **MethodologyStep** | Supplies the stage/subtask vocabulary                  | `code` (slug, the key), `name` (label), `kind`, `position`, `conditional`                      |
| **Defect**          | `log_defect` / `resolve_defect`                        | `severity`, `status`, `title`, `description`, `references`, `resolution`                       |
| **Decision**        | `record_decision`                                      | `target` (Workspace \| Initiative \| Milestone), `context`, `options`, `decision`, `rationale` |
| **Activity**        | Emitted by every state-changing verb                   | `kind`, `actor`, `target`, `payload`, `occurredAt`                                             |
| **TestRun**         | `record_test_run`                                      | `total`, `passed`, `failed`, `pending`, `durationMs`, `linesPct`, `branchesPct`, `failures`    |

**Amendment flagged for Data Model:** `MethodologyStep.code` must be the primary key and
`MethodologyStep.name` a label (BR-08). `Milestone.status` must be computed, not stored writable
(BR-12).

---

## 3. Functional Description

### 3.1 INT-001 — MCP Intent-Verb Server [Interface]

#### Transport and bootstrap

| Aspect             | Contract                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Transport          | MCP **stdio**, in-process with CAP. No HTTP server, no listening socket.                                       |
| Bootstrap          | `cds.serve('all').from(model)` → `cds.connect.to(name)`. Never bare `cds.connect.to(name)` (D-28).             |
| TypeScript impl    | `CDS_TYPESCRIPT=true` **and** a `tsx` loader — both required, independent levers (D-33).                       |
| Code location      | `Project Tracker/mcp/` — sibling to `db/ srv/ app/ test/`, not under `srv/` (D-44).                            |
| Registration       | Written by a **tracked installer script**; `.mcp.json` is gitignored (`.gitignore:13`) (D-44).                 |
| Connection holding | Bootstrap once at server start; one reconnect attempt on a connection-caused failure before reporting (BR-20). |
| Concurrency        | Writes serialized; reads concurrent (BR-13).                                                                   |
| Transactions       | `srv.tx({ user })` — never `cds.tx`, which stamps `createdBy` but fires no application handlers (RSH-001 §3).  |
| Identity           | The **calling agent's own** name (`implementer`, `test-author`, `gate-runner`, …) (D-41).                      |

#### Verb inventory — eleven, exhaustive

**Write verbs.** Each emits exactly one Activity event inside its own transaction.

| Verb               | Inputs                                                     | Returns                      |
| ------------------ | ---------------------------------------------------------- | ---------------------------- |
| `start_stage`      | `story`, `stage`                                           | envelope                     |
| `complete_stage`   | `story`, `stage`, `notes?`                                 | envelope (+ subtask warning) |
| `complete_subtask` | `story`, `stage`, `subtask`                                | envelope                     |
| `reopen_stage`     | `story`, `stage`, `reason`                                 | envelope                     |
| `log_defect`       | `story`, `severity`, `title`, `description`, `references?` | envelope + `defectId`        |
| `resolve_defect`   | `defect`, `resolution`                                     | envelope                     |
| `record_decision`  | `target`, `context`, `options?`, `decision`, `rationale`   | envelope + `decisionId`      |
| `record_test_run`  | `story`, `stage`, `metrics`                                | envelope                     |
| `plan_sprint`      | `name`, `goal`, `branch`, `stories[]`                      | envelope + `initiativeId`    |

**Read verbs.** Emit no Activity event.

| Verb           | Inputs       | Returns                                                                                 |
| -------------- | ------------ | --------------------------------------------------------------------------------------- |
| `next_action`  | `story?`     | The single next incomplete stage, respecting kind and conditionality                    |
| `project_view` | `workspace?` | The **whole** view in one call: header, next action, task queue, chain, three registers |

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

| Jest field                                   | TestRun attribute |
| -------------------------------------------- | ----------------- |
| `numTotalTests`                              | `total`           |
| `numPassedTests`                             | `passed`          |
| `numFailedTests`                             | `failed`          |
| `numPendingTests`                            | `pending`         |
| `startTime` → elapsed                        | `durationMs`      |
| `coverage.total.lines.pct`                   | `linesPct`        |
| `coverage.total.branches.pct`                | `branchesPct`     |
| per-failure `{suite,title,message,location}` | `failures`        |

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
- **BR-13** `reopen_stage` reopens only the named stage. Later completed stages retain their completion records unchanged.
- **BR-14** `reopen_stage` requires a non-empty reason.

**Responses**

- **BR-15** Every verb response carries a server timestamp.
- **BR-16** Every write-verb success response carries the resulting next action.
- **BR-17** Every rejection carries a code and a message; where a methodology rule caused it, it also carries a remediation naming the blocking condition and the command that clears it.

**Registers**

- **BR-18** Defect `severity` ∈ {Critical, High, Medium, Low}; `status` ∈ {Open, Closed}.
- **BR-19** `resolve_defect` requires a non-empty resolution.
- **BR-20** `record_decision` targets a Workspace, Initiative or Milestone, and carries Context, Decision and Rationale. Options is optional.
- **BR-21** `plan_sprint` creates one Initiative and its story Milestones. Each story carries ID, FRICEW type ∈ D-09's six values, and description.
- **BR-22** `project_view` returns the whole view in one call.

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

| Condition                                     | Response                                                    | i18n key                         |
| --------------------------------------------- | ----------------------------------------------------------- | -------------------------------- |
| Bare story ID (no workspace prefix)           | Reject 400, naming the expected form                        | `verb.story.unqualified`         |
| Unknown story / stage / subtask code          | Reject 404, listing valid codes for that chain              | `verb.target.notFound`           |
| No caller identity declared                   | Reject 400                                                  | `verb.identity.missing`          |
| Stage already complete                        | Reject 409 **with current status and timestamp**            | `verb.stage.alreadyComplete`     |
| Stage not started                             | Reject 409 with remediation naming `start_stage`            | `verb.stage.notStarted`          |
| Methodology guard refuses the transition      | Reject 409 **with remediation** (WFL-001 supplies the rule) | `verb.stage.blocked`             |
| Stage completed with open subtasks            | **Succeed**, `warnings[]` names each open subtask           | `verb.stage.subtasksOpen`        |
| `reopen_stage` with empty reason              | Reject 400                                                  | `verb.reopen.reasonRequired`     |
| `resolve_defect` with empty resolution        | Reject 400                                                  | `verb.defect.resolutionRequired` |
| Severity or FRICEW type outside its code list | Reject 400 (`ASSERT_ENUM` surfaced verbatim)                | `verb.value.notInCodeList`       |
| `plan_sprint` duplicate story ID in workspace | Reject 409                                                  | `verb.story.duplicate`           |
| Connection lost mid-call                      | One reconnect, then reject 503                              | `verb.connection.unavailable`    |
| Any handler rejection                         | Roll back; surface CAP code and message intact              | —                                |

Rejections carry a `remediation` only where a methodology rule caused them. `ASSERT_*` validation
failures pass through with their CAP message, because a malformed payload is the caller's own bug.

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
**Preconditions:** `sprint-build` in progress with `smoke` and `handoff` incomplete.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "sprint-build")`.

**Expected Result:**

- Response `ok: true`.
- `warnings[]` names both `smoke` and `handoff`.
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
**Preconditions:** Server running.
**Steps:**

1. Call `log_defect` declaring the caller as `implementer`.
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

1. Call `plan_sprint("W1-S4", goal, branch, [ {id, type, description} × 3 ])`.

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

- Rejected 400 — `Integration` is not one of D-09's six values (`Interfaces` is).
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
