# SPEC-02 — Methodology & Stage Enforcement

**Spec ID:** SPEC-02
**FRICEW Objects:** CNV-001 (Conversion), ENH-001 (Enhancement), WFL-001 (Workflow)
**Wave:** 1
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 — the validating spike ran on in-memory
SQLite only. Approved as a design; **not Approved-for-build until R1 clears**.

---

## Change History

| Date       | Author          | Description                                                                                      |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------ |
| 2026-07-27 | Sandro & Claude | Initial creation from the SPEC-02 workshop. Records D-47 through D-57. Provisional on R1 (D-39). |
| 2026-07-27 | Sandro          | Status → Approved. All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on R1 for build. |

---

## 1. Overview

The methodology as data and the enforcement over it: CNV-001 seeds the Sprint Build library — nine
ordered stage steps and Sprint Build's seven subtasks — ENH-001 materialises a story's chain from
that library when a Milestone is created in Backlog, and WFL-001 is the guard set that decides which
stage may start, which may complete, and what each rejection tells the caller. Conditionality is
resolved once at instantiation rather than at every transition (D-47), which is why a step that does
not apply has **no row at all** and nothing ever needs cancelling (D-50). WFL-001 is reachable only
through INT-001's verbs and adds no input to any of them (D-55), so SPEC-01's `verb.stage.blocked` is
the envelope and this spec's `wfl.*` keys are the rules inside it.

**This spec is provisional on R1.** Nothing here has been executed against Postgres; D-39 assigns the
repeat, together with standing up a binding neither Life OS module has, to the Data Model stage.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity              | Role in this spec                                       | Attributes this spec requires                                                                                                 |
| ------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Methodology**     | The seeded library's root (CNV-001)                     | `code`, `name`                                                                                                                |
| **MethodologyStep** | Stage and subtask vocabulary; the whole chain's shape   | `code` (slug, the key), `name` (label), `kind`, `position`, `parent`, `conditional`, `requiresHuman`, `driver`, `description` |
| **Milestone**       | The story a chain is instantiated for; status derived   | `storyId`, `status` (**derived**, BR-17), **`shipsUi`**                                                                       |
| **Task**            | A materialised stage step                               | `stepCode`, `status` ∈ {Not Started, In Progress, Complete}, `startedAt`, `completedAt` (nullable)                            |
| **Subtask**         | A materialised subtask step                             | `stepCode`, `status` ∈ {Not Started, Complete}, `completedAt`                                                                 |
| **Activity**        | Carries the reopen history the Task row no longer holds | `kind`, `actor`, `target`, `payload`, `occurredAt`                                                                            |

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`MethodologyStep.conditional` is a predicate name** (`shipsUi` or null), not a boolean. **Amends SPEC-01 §2**, which typed it as a boolean.                                                   |
| 2   | New on `MethodologyStep`: **`requiresHuman`** (Boolean, D-35's rule as data), **`driver`** (String, the slash command; remediation is generated from it), **`description`** (String, one line). |
| 3   | New on `Milestone`: **`shipsUi`** (Boolean) — the only Conditional predicate in slice 1 (D-47).                                                                                                 |
| 4   | `MethodologyStep.position` is **gapped by 10** within each parent.                                                                                                                              |
| 5   | `MethodologyStep.parent` — subtask steps hang off a stage step. Only `sprint-build` has children (BR-02).                                                                                       |
| 6   | **The actor identity needs a kind.** BR-23 must distinguish human from agent. Slice 1's form: identities are enumerated and `sandro` is the only human; anything else is an agent.              |
| 7   | `Task.completedAt` must be **clearable** — a legal reopen nulls it (BR-28, D-57).                                                                                                               |

---

## 3. Functional Description

### 3.1 CNV-001 — Methodology Library Seed [Conversion]

#### Source format

A **prose table**, `PLAN.md` §5, with no machine-readable original. Re-verified against `.claude/` on
2026-07-27 before seeding. `.claude/skills/human-review-loop/SKILL.md:11-13` states the same nine
stages in the same order independently, which **corroborates** the prose table rather than replacing
it — `PLAN.md` §5's claim to be the only source is itself out of date. Sprint Build's subtasks come
from `.claude/workflows/build.js:7-13`.

Four drifts were found at re-verification. Two are resolved here (D-47, D-48), one is a seeding note
below, and one is a cross-spec correction in §6.

#### Transformation — the seeded library

One **Methodology**: `code` = `sprint-build`, `name` = "Sprint Build". Its code equals stage 1's code
and that is harmless — separate entities, and no verb addresses a Methodology by code.

Nine **stage steps**. `code` is the stage name kebab-cased, **not the driver's name** — the invariant
SPEC-01 already relies on with `sprint-build` (driver `/build`) and `human-review` (driver
`/human-review-loop`).

| position | code              | name            | kind        | conditional | requiresHuman | driver               |
| -------- | ----------------- | --------------- | ----------- | ----------- | ------------- | -------------------- |
| 10       | `sprint-build`    | Sprint Build    | Required    | —           | —             | `/build`             |
| 20       | `code-quality`    | Code Quality    | Required    | —           | —             | `/code-quality`      |
| 30       | `test-quality`    | Test Quality    | Required    | —           | —             | `/test-quality`      |
| 40       | `functional-test` | Functional Test | Required    | —           | —             | `/functional-test`   |
| 50       | `ux-test`         | UX Test         | Conditional | `shipsUi`   | —             | `/ux-test`           |
| 60       | `human-review`    | Human Review    | Required    | —           | **yes**       | `/human-review-loop` |
| 70       | `documentation`   | Documentation   | Recommended | —           | —             | `/refresh-docs`      |
| 80       | `pm-update`       | PM Update       | Required    | —           | —             | `/pm-update`         |
| 90       | `commit`          | Commit          | Required    | —           | —             | `/commit-diff`       |

Seven **subtask steps**, parent `sprint-build`:

| position | code        | name      | kind        | conditional |
| -------- | ----------- | --------- | ----------- | ----------- |
| 10       | `brief`     | Brief     | Required    | —           |
| 20       | `red`       | Red       | Required    | —           |
| 30       | `implement` | Implement | Required    | —           |
| 40       | `gate`      | Gate      | Required    | —           |
| 50       | `coverage`  | Coverage  | Required    | —           |
| 60       | `smoke`     | Smoke     | Conditional | `shipsUi`   |
| 70       | `handoff`   | Handoff   | Required    | —           |

Three seeding notes:

- **`red` stays `red`** despite not being self-evident. `build.js`, `PLAN.md` §5 and BA-001 all call
  it that; a seed renaming it disagrees with all three.
- **`coverage` is Required, not Conditional.** `build.js:772` always yields a coverage outcome — it
  returns `'thresholds met without a coverage phase'` when it skips the phase — so there is always
  something true to record (D-48).
- **`gate` is one step.** `runGate` executes up to five times per story (at red, once per repair round
  ≤ 3, and after coverage); one Subtask row records that the gate closed, not each invocation.

Every step carries a non-empty one-line `description` (D-56 (5)). The strings are seed content and
are not fixed by this spec.

#### Validation and rejection criteria

The load is rejected if any of **BR-01 … BR-08** does not hold of the seeded rows — wrong step
counts, a `kind` outside the enum, a Conditional step naming a predicate other than `shipsUi`, a
second `requiresHuman` step, or children under a stage other than `sprint-build`. FUT-001 and FUT-003
are the checks.

#### Execution order

First in BA-001 §5's strict chain, `CNV-001 → CNV-002 → CNV-003 → CNV-004 → CNV-005`. It must land
before CNV-002, not merely before CNV-004: under D-54 the chain is materialised **as** a Milestone is
created, so CNV-002's load reads the library.

#### Reconciliation

There is no source system to tie out against, so reconciliation is the **FUT-002 contract**, both
directions:

| Direction             | Assertion                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed → verbs          | Every one of the 16 seeded codes is addressable by INT-001's verbs; none returns `verb.target.notFound`                                                              |
| SPEC-01's FUTs → seed | All seven codes SPEC-01's FUTs already freeze resolve to a seeded step: `sprint-build`, `code-quality`, `test-quality`, `human-review`, `commit`, `smoke`, `handoff` |
| Counts                | 9 stage steps, 7 subtask steps, 1 Methodology                                                                                                                        |

### 3.2 ENH-001 — Methodology Chain Instantiation [Enhancement]

#### Inputs

| Input                                 | Source                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| The seeded library, in position order | CNV-001                                                   |
| The Milestone being created           | `plan_sprint` (INT-001), FRM-002, or CNV-002's load       |
| `Milestone.status` at creation        | Backlog or Done                                           |
| `Milestone.shipsUi`                   | Set by the creating caller; the only predicate in slice 1 |

#### Outputs

One **Task** per materialised stage step and one **Subtask** per materialised subtask step, all
`Not Started`, in library position order. Nothing else — no Milestone status write (BR-17), no
Activity event beyond the creating verb's own.

#### Algorithm

1. Fire on **Milestone creation with status Backlog**, and at no other time. A Milestone created Done
   receives no chain (BR-09, BR-10).
2. If the Milestone already has a chain, reject `wfl.chain.alreadyInstantiated` (BR-13).
3. Read the library in position order.
4. Per stage step: **Required or Recommended** → materialise a Task. **Conditional** → evaluate its
   named predicate against the Milestone; true → materialise; false → **materialise nothing**, so no
   row exists to skip, cancel or display (BR-11, BR-12).
5. Repeat step 4 over `sprint-build`'s subtask steps, materialising Subtasks under its Task.
6. Every materialised row starts `Not Started` (BR-14).
7. A later library change does not refresh an instantiated chain (BR-13, D-22).

#### Worked example — real numbers

| Story                                            | `shipsUi` | Tasks | Subtasks | Not materialised   |
| ------------------------------------------------ | --------- | ----- | -------- | ------------------ |
| `financial-planner/CNV-001` (backend Conversion) | false     | **8** | **6**    | `ux-test`, `smoke` |
| A UI story created by `plan_sprint`              | true      | **9** | **7**    | —                  |

Over CNV-002's 12 Milestones — 11 Done, `financial-planner/CNV-001` Backlog — instantiation produces
**one** chain and eleven Milestones with zero Tasks and zero Subtasks.

### 3.3 WFL-001 — Stage State Machine [Workflow]

#### States

| Level         | States                               | Set by                                          |
| ------------- | ------------------------------------ | ----------------------------------------------- |
| **Task**      | Not Started · In Progress · Complete | `start_stage`, `complete_stage`, `reopen_stage` |
| **Subtask**   | Not Started · Complete               | `complete_subtask`                              |
| **Milestone** | Backlog · In Progress · Done         | **Nothing** — derived per BR-17 (D-53)          |

#### State diagram

```
Task
  Not Started ──start_stage──▶ In Progress ──complete_stage──▶ Complete
                                    ▲                              │
                                    └────reopen_stage(reason)──────┘

Subtask
  Not Started ──complete_subtask──▶ Complete

Milestone  (re-derived after every transition above; never written)
  Backlog ──first Task starts──▶ In Progress ──every blocking Task Complete──▶ Done
                                      ▲                                            │
                                      └────a reopen leaves a blocking Task open────┘
```

A step **blocks** if it is Required, or Conditional **and materialised**. Recommended never blocks
(BR-15), which is what keeps `documentation` skippable without stranding `pm-update` and `commit`.

#### Transitions, guards and side effects

Guards are listed in the order they fire. Every rejection carries a remediation naming the whole
blocking set in position order with each step's `driver` (BR-31); every success emits exactly one
Activity event inside its own transaction (SPEC-01 BR-03, D-42).

| Transition           | Trigger                                   | Guards, in firing order                                                                                                                                                                       | Side effects on success                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **start_stage**      | `start_stage(story, stage)`               | blocking predecessor open (BR-19) → already In Progress (BR-20) → already Complete (BR-21)                                                                                                    | `status := In Progress`; `startedAt := now`; response returns the stage's **materialised subtask list** (BR-32); Milestone re-derives                                                                                        |
| **complete_stage**   | `complete_stage(story, stage, notes?)`    | blocking predecessor open (BR-22) → human-only (BR-23) → not started (`verb.stage.notStarted`) → already complete (SPEC-01 BR-10) → open-subtask **warning** (SPEC-01 BR-11); order per BR-30 | `status := Complete`; `completedAt := now`; `warnings[]` names each open materialised Subtask; Milestone re-derives                                                                                                          |
| **complete_subtask** | `complete_subtask(story, stage, subtask)` | parent Task Not Started (BR-24) → blocking predecessor subtask open (BR-25) → already Complete (BR-26)                                                                                        | `status := Complete`; `completedAt := now`                                                                                                                                                                                   |
| **reopen_stage**     | `reopen_stage(story, stage, reason)`      | Task not Complete (BR-27) → empty reason (SPEC-01 BR-14)                                                                                                                                      | `status := In Progress`; `startedAt := reopen time`; **`completedAt := null`**; Subtasks **untouched**; later stages' records unchanged (SPEC-01 BR-13); Milestone re-derives; the Activity event carries the reason (BR-28) |
| **record_test_run**  | `record_test_run(story, stage, metrics)`  | target Task Not Started (BR-29)                                                                                                                                                               | No state change — a TestRun linked to the Task                                                                                                                                                                               |

**Why human-only sits second on `complete_stage` (BR-30).** It is a permanent property of the caller,
so an agent learns the fact that will never change before facts that will.

**Where the history goes after a reopen (D-57).** The Task row carries current state only, so no field
ever contradicts its own status and RPT-003 reads `status` alone. "Completed 14:02, reopened 15:30
because X" stays queryable in the Activity log, which is what makes clearing `completedAt` safe.

---

## 4. Business Rules

**Library — CNV-001**

- **BR-01** One Methodology `sprint-build` with 9 ordered stage steps.
- **BR-02** `sprint-build` carries 7 ordered subtask steps. No other stage carries subtasks.
- **BR-03** `code` is the key and is the step's name kebab-cased; `name` is a label and may be renamed without rewriting history.
- **BR-04** `kind` ∈ {Required, Conditional, Recommended}.
- **BR-05** A Conditional step names exactly one predicate. Slice 1's only predicate is `shipsUi`.
- **BR-06** `ux-test` and `smoke` are the only Conditional steps; both name `shipsUi`.
- **BR-07** `documentation` is the only Recommended step.
- **BR-08** `human-review` is the only step with `requiresHuman`.

**Instantiation — ENH-001**

- **BR-09** A chain is instantiated when a Milestone is created with status Backlog, and at no other time.
- **BR-10** A Milestone created Done receives no chain.
- **BR-11** Instantiation materialises every Required and Recommended step, plus every Conditional step whose predicate holds, in library position order.
- **BR-12** A Conditional step whose predicate fails is not materialised at all — no row exists for it.
- **BR-13** A Milestone that already has a chain is never re-instantiated; a second attempt is rejected. A library change does not refresh an existing chain (D-22).
- **BR-14** Materialised Tasks and Subtasks start Not Started.

**Derived state — WFL-001**

- **BR-15** A step **blocks** if it is Required, or Conditional-and-materialised. Recommended never blocks.
- **BR-16** Task status ∈ {Not Started, In Progress, Complete}; Subtask status ∈ {Not Started, Complete}.
- **BR-17** A Milestone is Backlog when no Task has started, In Progress when one has and not every blocking Task is Complete, Done when every blocking Task is Complete.
- **BR-18** Nothing deletes a Task or Subtask — no verb, no handler. This is how "the record survives" is guaranteed.

**Guards — WFL-001**

- **BR-19** `start_stage` is rejected while any blocking Task earlier in position order is incomplete → `wfl.stage.predecessorOpen`.
- **BR-20** `start_stage` on a Task already In Progress is rejected, carrying `startedAt` → `wfl.stage.alreadyStarted`.
- **BR-21** `start_stage` on a Complete Task is rejected, remediation naming `reopen_stage` → reuses `verb.stage.alreadyComplete`.
- **BR-22** `complete_stage` is rejected while any blocking Task earlier in position order is incomplete → `wfl.stage.predecessorOpen`.
- **BR-23** `complete_stage` on a `requiresHuman` step is rejected when the caller identity is an agent → `wfl.stage.humanOnly`.
- **BR-24** `complete_subtask` is rejected while its parent Task is Not Started → `wfl.subtask.stageNotStarted`.
- **BR-25** `complete_subtask` is rejected while any blocking Subtask earlier in position order is incomplete → `wfl.subtask.predecessorOpen`.
- **BR-26** `complete_subtask` on a Complete Subtask is rejected, carrying `completedAt` → `wfl.subtask.alreadyComplete`.
- **BR-27** `reopen_stage` on a Task that is not Complete is rejected → `wfl.stage.notComplete`.
- **BR-28** A legal `reopen_stage` sets the Task to In Progress, sets `startedAt` to the reopen time and clears `completedAt`. Its Subtasks are unchanged.
- **BR-29** `record_test_run` is rejected when its target Task is Not Started → `wfl.testrun.stageNotStarted`.
- **BR-30** Guard precedence on `complete_stage`: **blocking predecessor → human-only → not started → already complete → open-subtask warning.** The first to fire is the response.
- **BR-31** Every rejection above carries a remediation naming the blocking condition and the command that clears it (D-46, SPEC-01 BR-17). The command text is generated from the seeded `driver` column, and the remediation names the **whole** blocking set in position order. ENH-001's re-instantiation rejection → `wfl.chain.alreadyInstantiated`.
- **BR-32** `start_stage`'s success response returns the stage's materialised subtask list, in position order (D-56).
- **BR-33** WFL-001 adds no input to any verb.

---

## 5. Error Handling

| Condition                                                            | Response                                                  | i18n key                        |
| -------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| `start_stage` with a blocking Task earlier in position order open    | Reject 409 with remediation naming the whole blocking set | `wfl.stage.predecessorOpen`     |
| `start_stage` on a Task already In Progress                          | Reject 409 **carrying `startedAt`**                       | `wfl.stage.alreadyStarted`      |
| `start_stage` on a Complete Task                                     | Reject 409, remediation naming `reopen_stage`             | `verb.stage.alreadyComplete` ¹  |
| `complete_stage` with a blocking Task earlier in position order open | Reject 409 with remediation                               | `wfl.stage.predecessorOpen`     |
| `complete_stage` on a `requiresHuman` step by an agent identity      | Reject 409, remediation naming the step's driver          | `wfl.stage.humanOnly`           |
| `complete_stage` on a Task that is Not Started                       | Reject 409, remediation naming `start_stage`              | `verb.stage.notStarted` ¹       |
| `complete_stage` on a Complete Task                                  | Reject 409 with current status and `completedAt`          | `verb.stage.alreadyComplete` ¹  |
| `complete_stage` with materialised Subtasks open                     | **Succeed**; `warnings[]` names each open Subtask         | `verb.stage.subtasksOpen` ¹     |
| `complete_subtask` while the parent Task is Not Started              | Reject 409, remediation naming `start_stage`              | `wfl.subtask.stageNotStarted`   |
| `complete_subtask` with an earlier blocking Subtask open             | Reject 409 with remediation                               | `wfl.subtask.predecessorOpen`   |
| `complete_subtask` on a Complete Subtask                             | Reject 409 **carrying `completedAt`**                     | `wfl.subtask.alreadyComplete`   |
| `reopen_stage` on a Task that is not Complete                        | Reject 409 with the Task's current status                 | `wfl.stage.notComplete`         |
| `reopen_stage` with an empty reason                                  | Reject 400                                                | `verb.reopen.reasonRequired` ¹  |
| `record_test_run` against a Not Started Task                         | Reject 409, remediation naming `start_stage`              | `wfl.testrun.stageNotStarted`   |
| Instantiating a chain for a Milestone that already has one           | Reject 409                                                | `wfl.chain.alreadyInstantiated` |
| A stage or subtask code not in this story's chain                    | Reject 404, listing the chain's codes                     | `verb.target.notFound` ¹        |

¹ Existing SPEC-01 key, reused rather than duplicated.

Every stage-guard row above surfaces inside SPEC-01's **`verb.stage.blocked`** envelope: INT-001 says
_that_ a typed rejection surfaces, WFL-001 says _which_ rejections exist (D-37 §11.1, D-55). A
rejection writes nothing and emits nothing (SPEC-01 BR-05), including no record of the attempt.

---

## 6. Open Items

| OI    | Status in this spec                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OI-04 | **Not resolved here.** Calculated health is SPEC-05's.                                                                                                                                                                                                                                                                                                                                                                                                   |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). This spec builds one methodology over one project and must not preclude genericity: `Methodology` is a real entity with `MethodologyStep` children, `kind` and `conditional` are data rather than code, and the predicate is named rather than inlined — but **no Type system, no Templates, no combination or shared-step merge, and no refresh of an instantiated chain**. |

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity; a rejection is
delivered synchronously to the agent that caused it, carrying a remediation (D-46). An alert on a
blocked transition is D-42's rejected option B wearing a different hat — two emission paths, and a
record where "happened" and "was attempted" must be told apart by every reader forever.

**Provisional dependency — R1.** Inherited from SPEC-01 (D-39). The Postgres repeat is owned by the
Data Model stage, which must also stand up a binding neither module has. **This spec is not
Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                               | Goes to           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **FUT-005 must be amended** — its precondition names `smoke` open on `financial-planner/CNV-001`, a backend-only Conversion where `smoke` is never materialised (D-48)                                                             | SPEC-01           |
| **§2's `MethodologyStep.conditional` becomes a predicate name**, not a boolean                                                                                                                                                     | SPEC-01           |
| **§5 gains a guard precedence**; it currently lists conditions unordered (D-52, BR-30)                                                                                                                                             | SPEC-01           |
| **BR-13 guarantees only that _later_ stages keep their records.** What happens to the reopened stage's own is now defined by BR-28 (D-57), which SPEC-01 left open                                                                 | SPEC-01           |
| **CNV-004 is no longer an instantiation step** — the chain arrives with the Milestone; CNV-004 asserts it came out right (D-54)                                                                                                    | SPEC-03           |
| **CNV-002 must set `shipsUi`** on each Milestone it creates, since ENH-001 reads it at creation                                                                                                                                    | SPEC-03           |
| `next_action` on a Done Milestone with `documentation` still open — does it return the Recommended stage or nothing?                                                                                                               | SPEC-04 (ENH-002) |
| RPT-003 renders `Not Started / In Progress / Complete` per Task and `Not Started / Complete` per Subtask; a Conditional step that was not materialised has **no row**, so the chain is shorter rather than showing a skipped entry | SPEC-07 (RPT-003) |
| Initiative status gating — whether a stage may start on a Milestone in a Complete Initiative                                                                                                                                       | SPEC-05 (FRM-001) |
| ~~**BA-001's CNV-004 row reads "6 Subtasks"** — D-38 missed it~~ — **applied at BA-001 v1.3**                                                                                                                                      | BA-001 — done     |
| D-42's carve-out compounds here: every guard rejection leaves **no trace at all**, so enforcement firing is invisible in the Activity timeline                                                                                     | SPEC-07 (RPT-004) |

---

## 7. Functional Unit Tests

### FUT-001: The seeded library is exactly nine stages and seven subtasks

**Covers:** CNV-001
**Preconditions:** CNV-001 has run; no other conversion has.
**Steps:**

1. Read all Methodology rows.
2. Read all MethodologyStep rows with no parent, ordered by position.
3. Read all MethodologyStep rows with a parent, grouped by parent.

**Expected Result:**

- Exactly one Methodology: `sprint-build` / "Sprint Build".
- Exactly **9** stage steps, matching §3.1's codes, names, kinds and drivers at positions 10…90.
- Exactly **7** subtask steps under `sprint-build` at positions 10…70.
- **No stage step other than `sprint-build` has children.**
- Every step carries a non-empty one-line `description`; every stage step carries a `driver`.

### FUT-002: Every seeded code resolves, and every code SPEC-01 froze is seeded

**Covers:** CNV-001, INT-001
**Preconditions:** Library seeded; a story with an instantiated chain.
**Steps:**

1. Address each of the 16 seeded codes through a verb call against that story.
2. Look up each of the seven codes SPEC-01's FUTs name — `sprint-build`, `code-quality`,
   `test-quality`, `human-review`, `commit`, `smoke`, `handoff` — in the library.

**Expected Result:**

- No call returns `verb.target.notFound`; each either succeeds or is refused by a `wfl.*` guard.
- All seven SPEC-01 codes resolve to a seeded step.

### FUT-003: Kinds, the human step and the predicate are exactly as seeded

**Covers:** CNV-001
**Preconditions:** Library seeded.
**Steps:**

1. Query steps by `kind`, by `requiresHuman`, and by `conditional`.

**Expected Result:**

- Exactly one step has `requiresHuman` — `human-review`.
- Exactly one step is Recommended — `documentation`.
- Exactly two steps are Conditional — `ux-test` and `smoke` — and both carry `conditional = 'shipsUi'`.
- Every other step is Required; no `kind` falls outside {Required, Conditional, Recommended}.

### FUT-004: Only a Milestone created in Backlog gets a chain

**Covers:** ENH-001
**Preconditions:** Library seeded; CNV-002's 12 Milestones not yet loaded (11 Done, `financial-planner/CNV-001` Backlog).
**Steps:**

1. Run CNV-002's load.
2. Count Milestones having at least one Task.

**Expected Result:**

- Exactly **1** Milestone has a chain — `financial-planner/CNV-001`.
- The other **11** have zero Tasks and zero Subtasks.

### FUT-005: A backend story materialises no row for a failed predicate

**Covers:** ENH-001
**Preconditions:** `financial-planner/CNV-001` created Backlog with `shipsUi` false.
**Steps:**

1. Count its Tasks and Subtasks.
2. Query for a Task with `stepCode = 'ux-test'` and a Subtask with `stepCode = 'smoke'`.

**Expected Result:**

- **8 Tasks and 6 Subtasks**, in library position order, all Not Started.
- Both queries return **zero rows** — not a row in a skipped or cancelled state.

### FUT-006: A UI story materialises the full chain, and `start_stage` returns its subtasks

**Covers:** ENH-001
**Preconditions:** Library seeded; workspace exists.
**Steps:**

1. Create a UI story via `plan_sprint` with `shipsUi` true.
2. Count its Tasks and Subtasks.
3. Call `start_stage(story, "sprint-build")`.

**Expected Result:**

- **9 Tasks and 7 Subtasks**, including `ux-test` and `smoke`.
- The `start_stage` success response carries the stage's **materialised subtask list** — all seven
  codes in position order, `brief` … `handoff`.

### FUT-007: A chain is instantiated once and never refreshed

**Covers:** ENH-001
**Preconditions:** `financial-planner/CNV-001` has its chain.
**Steps:**

1. Attempt to instantiate a chain for it again.
2. Change the library — add a step and change a step's `kind`.
3. Re-read the story's chain.

**Expected Result:**

- The second attempt is rejected, key `wfl.chain.alreadyInstantiated`.
- The chain's row count, codes and kinds are **identical** to step 1's reading.

### FUT-008: The predecessor guard names the whole blocking set, from the seeded driver

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001`; `sprint-build` Complete; `code-quality`, `test-quality` and `functional-test` all Not Started.
**Steps:**

1. Call `start_stage("financial-planner/CNV-001", "test-quality")`.
2. Call `start_stage("financial-planner/CNV-001", "human-review")`.
3. Change `code-quality`'s seeded `driver` to a different string and repeat step 1.

**Expected Result:**

- Step 1 rejected, key `wfl.stage.predecessorOpen`; remediation names `code-quality` and
  `/code-quality`.
- Step 2 rejected with the same key; remediation names **all three** blocking steps in position order
  — `code-quality` (`/code-quality`), `test-quality` (`/test-quality`), `functional-test`
  (`/functional-test`) — not just the earliest.
- Step 3's remediation carries the **changed** driver string, proving it is generated from the seed
  rather than hardcoded in the guard.

### FUT-009: A Recommended step never blocks

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001` with every blocking Task through `human-review` Complete and `documentation` Not Started.
**Steps:**

1. `start_stage("pm-update")`, then `complete_stage("pm-update")`.
2. `start_stage("commit")`, then `complete_stage("commit")`.
3. Read the Milestone status and `documentation`'s Task.

**Expected Result:**

- All four calls succeed; no rejection references `documentation`.
- The Milestone is **Done**.
- `documentation` is still Not Started.

### FUT-010: `complete_stage("commit")` is refused while Human Review is open

**Covers:** WFL-001, INT-001
**Preconditions:** `financial-planner/CNV-001` with every blocking Task through `functional-test` Complete; `human-review` and `pm-update` open.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "commit")`.

**Expected Result:**

- Rejected 409 inside SPEC-01's `verb.stage.blocked` envelope, key `wfl.stage.predecessorOpen`.
- Remediation names `human-review` (`/human-review-loop`) first, then `pm-update` (`/pm-update`), in
  position order. `documentation` does not appear — it does not block.
- SPEC-01 FUT-011 passes unchanged against this behaviour.

### FUT-011: Human Review closes only under a human identity

**Covers:** WFL-001
**Preconditions:** `human-review` In Progress; every earlier blocking Task Complete.
**Steps:**

1. Call `complete_stage("human-review")` declaring the caller as `implementer`.
2. Re-read the Task and the Activity count.
3. Call the same verb declaring the caller as `sandro`.

**Expected Result:**

- Step 1 rejected, key `wfl.stage.humanOnly`.
- The Task is unchanged — still In Progress, `completedAt` null — and no Activity event was written.
- Step 3 succeeds; the Task is Complete.

### FUT-012: Human-only outranks not-started in the precedence order

**Covers:** WFL-001
**Preconditions:** `human-review` **Not Started**; every earlier blocking Task Complete.
**Steps:**

1. Call `complete_stage("human-review")` declaring the caller as `implementer`.

**Expected Result:**

- Rejected with key **`wfl.stage.humanOnly`**, not `verb.stage.notStarted` — BR-30's order, so the
  agent learns the permanent fact first.

### FUT-013: Subtask guards fire on the parent stage and on order

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001` with `sprint-build` Not Started.
**Steps:**

1. Call `complete_subtask("sprint-build", "gate")`.
2. Call `start_stage("sprint-build")`, then complete `brief` and `red`.
3. Call `complete_subtask("sprint-build", "gate")` again.

**Expected Result:**

- Step 1 rejected, key `wfl.subtask.stageNotStarted`, remediation naming `start_stage`.
- Step 3 rejected, key `wfl.subtask.predecessorOpen`, remediation naming `implement`.
- No Subtask changed state in either rejected call.

### FUT-014: The open-subtask warning can only name materialised subtasks

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001` (`shipsUi` false); `sprint-build` In Progress; `brief` … `coverage` Complete; `handoff` open.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "sprint-build")`.

**Expected Result:**

- Succeeds, key `verb.stage.subtasksOpen` in `warnings[]`.
- `warnings[]` names **`handoff` only**. `smoke` cannot appear — it was never materialised (FUT-005).
- The stage is Complete.

### FUT-015: Milestone status derives end to end and no verb sets it

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001` freshly instantiated, all Tasks Not Started.
**Steps:**

1. Read the Milestone status.
2. Call `start_stage("sprint-build")` and re-read it.
3. Run the chain until every blocking Task is Complete, leaving `documentation` Not Started, and
   re-read it.

**Expected Result:**

- **Backlog → In Progress → Done**, in that order.
- Done is reached with `documentation` Not Started, because Recommended never blocks (BR-15).
- No verb in D-40's eleven wrote `Milestone.status` at any point (BR-17, SPEC-01 BR-12).

### FUT-016: Reopen is legal only from Complete, and leaves the row carrying current state

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001` with `sprint-build`, `code-quality` and `test-quality` Complete — `code-quality` at a known `completedAt` — `functional-test` In Progress, and `pm-update` Not Started. Every state here is reachable through the verbs; a precondition BR-19 would have refused is not a valid fixture.
**Steps:**

1. Call `reopen_stage("pm-update", "reason")` — a Task that is Not Started.
2. Call `reopen_stage("functional-test", "reason")` — a Task that is In Progress.
3. Record the Task and Subtask counts, then call `reopen_stage("code-quality", "defect found at commit")`.

**Expected Result:**

- Steps 1 and 2 are rejected, key `wfl.stage.notComplete`; neither Task changes.
- Step 3 succeeds: `code-quality` is **In Progress**, its `completedAt` is **null**, and its
  `startedAt` equals the reopen time.
- Task and Subtask counts are **unchanged** — nothing was deleted (BR-18).
- One Activity event carries the reason, and the prior completion timestamp is recoverable from the
  Activity log.

### FUT-017: A test run cannot be recorded against a stage that never started

**Covers:** WFL-001
**Preconditions:** `test-quality` Not Started.
**Steps:**

1. Call `record_test_run("test-quality", metrics)`.
2. Call `start_stage("test-quality")` and repeat step 1.

**Expected Result:**

- Step 1 rejected, key `wfl.testrun.stageNotStarted`, remediation naming `start_stage`; no TestRun row
  is written.
- Step 2's call succeeds and the TestRun links to the `test-quality` Task.

### FUT-018: Reopening a stage leaves its subtasks complete

**Covers:** WFL-001
**Preconditions:** `financial-planner/CNV-001` (`shipsUi` false); `sprint-build` Complete with all **6** materialised Subtasks Complete at known timestamps.
**Steps:**

1. Call `reopen_stage("sprint-build", "handoff wrote the wrong branch")`.
2. Read all 6 Subtasks.
3. Call `complete_stage("sprint-build")`.

**Expected Result:**

- All 6 Subtasks remain **Complete** with their original `completedAt` values — a reopen is scoped to
  the named stage (SPEC-01 BR-13, BR-28).
- Step 3 succeeds with **no** open-subtask warning; `verb.stage.subtasksOpen` does not appear in
  `warnings[]`.

---

_SPEC-02 specifies CNV-001, ENH-001 and WFL-001 — the library, the chain and the enforcement over it — per [BA-001 §11 row 02](../BUSINESS_ARCHITECTURE.md). The verb surface these guards sit behind is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md); D-37's §11.1 amendment trigger was tested here and did not fire (D-55). **Provisional on R1** per [D-39](../DECISIONS_LOG.md)._
