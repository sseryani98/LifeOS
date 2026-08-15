# Data Model

**Document ID:** DM-001
**Version:** 1.0
**Date:** 2026-08-15
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Sandro & Claude | Initial creation from the Data Model stage. **25 persisted entities** — 13 domain entities and 12 code lists — consolidated from the Data Model section of all **12** specs, of which **10** place requirements and **2** ([SPEC-10](specs/SPEC-10-CUTOVER-GUARDS.md), [SPEC-12](specs/SPEC-12-DECOMMISSION.md)) state they place none. **OI-05 resolved** — the last open item in the module. Records D-160 through D-169. |

---

## 2. Summary

| Aspect                     | Decision                                                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Deliverable**            | **The document only.** `db/` stays empty; the CDS files are written by the first build story (D-160)                                                                 |
| **Namespace**              | `com.lifeos.projecttracker` (D-03)                                                                                                                                   |
| **Database**               | Its own Postgres database, `project_tracker` (D-29). Nothing reads across modules                                                                                    |
| **Domain entities**        | **13** — 7 hierarchy, 2 methodology, 4 registers                                                                                                                     |
| **Code lists**             | **12**. No `String enum` anywhere — the shared standards rule code lists for a finite vocabulary                                                                     |
| **Persisted entities**     | **25** (13 + 12)                                                                                                                                                     |
| **Read-only projections**  | **2** — `ProjectView` (the browser read path, D-145) and `TaskQueueItem` (the queue filter behind it)                                                                |
| **Drafts**                 | **OFF on every entity.** Inherited from [DS-001](DESIGN_SYSTEM.md) §4.3 (D-144); not re-decided here                                                                 |
| **Methodology genericity** | **Structurally generic, functionally singular** — `Methodology` composes `MethodologyStep`, and nothing anywhere selects between methodologies (**OI-05**, D-161)    |
| **Sort keys**              | A `@lifeos.sortKey` **annotation** on every persisted entity, read from the CSN by `INT-007` (D-164)                                                                 |
| **Register scope**         | `Defect`, `Decision`, `Activity` and `TestRun` each gain a **mandatory `workspace` association**. This is what makes D-145's navigation properties reachable (D-163) |
| **Risk R1**                | **Executed as far as it goes, and blocked** — measured, not assumed. Re-owned to **Tech Stack** (D-168). Grade stays `Inferred`                                      |
| **Amendments caused**      | **7**, all applied in-session — 5 spec amendments across 4 specs, plus `research/README.md`, `PSV-001` and this module's `CLAUDE.md` (§14)                           |

### 2.1 Entity Index

| #   | Entity           | Group       | Key decisions / requiring specs                             |
| --- | ---------------- | ----------- | ----------------------------------------------------------- |
| 1   | Area             | Hierarchy   | SPEC-03                                                     |
| 2   | Engagement       | Hierarchy   | SPEC-03                                                     |
| 3   | Workspace        | Hierarchy   | SPEC-01, SPEC-03, SPEC-05 (D-75), SPEC-06, SPEC-09          |
| 4   | Initiative       | Hierarchy   | SPEC-01, SPEC-03 (D-62), SPEC-04 (D-67), SPEC-05, SPEC-06   |
| 5   | Milestone        | Hierarchy   | SPEC-01, SPEC-02, SPEC-03 (D-64), SPEC-04, SPEC-06, SPEC-07 |
| 6   | Task             | Hierarchy   | SPEC-01, SPEC-02 (D-57), SPEC-04, SPEC-05, SPEC-07          |
| 7   | Subtask          | Hierarchy   | SPEC-01, SPEC-02, SPEC-07 (D-68)                            |
| 8   | Methodology      | Methodology | SPEC-02, **D-161**                                          |
| 9   | MethodologyStep  | Methodology | SPEC-01 (D-47), SPEC-02, SPEC-04, SPEC-05, SPEC-07          |
| 10  | Defect           | Register    | SPEC-01, SPEC-03 (D-61), SPEC-05, SPEC-07, SPEC-08          |
| 11  | Decision         | Register    | SPEC-01, SPEC-03 (D-65), SPEC-07 (D-92)                     |
| 12  | Activity         | Register    | SPEC-01 (D-83), SPEC-03, SPEC-05, SPEC-06, SPEC-07          |
| 13  | TestRun          | Register    | SPEC-01, SPEC-03 (D-72), SPEC-05 (D-105), SPEC-09           |
| 14  | ActivityKind     | Code list   | SPEC-07 §2 am. 1 — 16 values                                |
| 15  | Actor            | Code list   | SPEC-02 §2 am. 6, SPEC-08 am. 3, SPEC-09 am. 4, **D-166**   |
| 16  | ActorKind        | Code list   | **D-166**                                                   |
| 17  | DefectSeverity   | Code list   | SPEC-01 BR-18                                               |
| 18  | DefectStatus     | Code list   | SPEC-01 BR-18                                               |
| 19  | FricewType       | Code list   | D-09, D-60; SPEC-03 §2 am. 11                               |
| 20  | HealthState      | Code list   | SPEC-05 §2 am. 2 (D-70)                                     |
| 21  | InitiativeStatus | Code list   | SPEC-03 §2 am. 2 (D-62)                                     |
| 22  | MilestoneStatus  | Code list   | SPEC-02 BR-17, **D-162**                                    |
| 23  | StepKind         | Code list   | SPEC-02 §3.1                                                |
| 24  | SubtaskStatus    | Code list   | SPEC-02 §2                                                  |
| 25  | TaskStatus       | Code list   | SPEC-02 §2                                                  |

Rows 1–13 are the 13 domain entities; rows 14–25 are the 12 code lists. `ProjectView` and
`TaskQueueItem` are **not** in this index — they persist nothing (§11).

---

## 3. Deliverable Boundary (D-160)

**This stage ships the document and no CDS file.** `db/` stays empty until the first build story.

| Fact                                                                                 | Source                                                                                |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Every prior stage in this module produced a document and nothing else                | `PLAN.md` §3                                                                          |
| The module has **no** Test Strategy (stage 11) and **no** Build Plan (stage 12) yet  | `PLAN.md` §3                                                                          |
| The module has **no `test` script**, deliberately                                    | [CLAUDE.md](../CLAUDE.md) §Carve-outs                                                 |
| The exemplar's own model was a document at this stage; its `db/` filled during Build | `Financial Planner/design/DATA_MODEL.md` dated 2026-02-13 against a Build-phase `db/` |

A `db/schema.cds` written here would be the module's first code, produced with no test able to run
against it, no gate covering it, and no story owning it — which is what D-22 refuses one level up.
The document is the contract; declaring it is `CNV-001`'s and `INT-001`'s work in the Build Plan's
order.

**One claim on the record is corrected by this ruling**, not left to contradict it:
[CLAUDE.md](../CLAUDE.md) §Folder Structure read `db/ (empty) ← Data Model stage`. That was an
expectation written at Scaffold, not a decision; it now names the Build stage. Applied in-session
(§14).

---

## 4. Hierarchy Entities

Seven entities, one chain: **Area → Engagement → Workspace → Initiative → Milestone → Task →
Subtask** (D-08). Every entity carries CAP's `cuid` and `managed` aspects unless the Notes say
otherwise, so `ID`, `createdAt`, `createdBy`, `modifiedAt` and `modifiedBy` are not repeated per
table. **Fields are camelCase, entities PascalCase singular, and every foreign key is CAP-generated**
— the shared standards, referenced rather than restated.

### 4.1 Area

| Attribute | Type       | Required | Requiring spec | Notes          |
| --------- | ---------- | -------- | -------------- | -------------- |
| `name`    | String(60) | yes      | SPEC-03 §2     | Hierarchy root |

No parent. One row in slice 1.

### 4.2 Engagement

| Attribute | Type                | Required | Requiring spec | Notes |
| --------- | ------------------- | -------- | -------------- | ----- |
| `name`    | String(60)          | yes      | SPEC-03 §2     |       |
| `area`    | Association to Area | yes      | SPEC-03 §2     |       |

### 4.3 Workspace

| Attribute      | Type                      | Required | Requiring spec         | Notes                                                         |
| -------------- | ------------------------- | -------- | ---------------------- | ------------------------------------------------------------- |
| `slug`         | String(30)                | yes      | SPEC-01 §2, SPEC-09 §2 | Unique, URL-safe. The `{workspace}` half of a story reference |
| `name`         | String(60)                | yes      | SPEC-01 §2             |                                                               |
| `currentFocus` | LargeString               | no       | SPEC-03 §2 am. 4       | `FRM-001` writes it; no markdown holds it today               |
| `engagement`   | Association to Engagement | yes      | SPEC-03 §2             |                                                               |

**No `status` attribute** (D-75, [SPEC-05](specs/SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §2). **No
`health` attribute** — health is computed on read and stored nowhere (SPEC-05 §2 am. 4, BR-02). Both
are stated because "no column" is an instruction, not an omission.

### 4.4 Initiative

| Attribute     | Type                            | Required | Requiring spec                      | Notes                                                           |
| ------------- | ------------------------------- | -------- | ----------------------------------- | --------------------------------------------------------------- |
| `name`        | String(60)                      | yes      | SPEC-01 §2                          | Unique within its Workspace — **handler**, not annotation (§9)  |
| `goal`        | LargeString                     | no       | SPEC-03 §2 am. 3                    | Nullable: W1-S1's is unrecoverable, no checkpoint file exists   |
| `branch`      | String(60)                      | yes      | SPEC-06 §2 am. 3                    | `@mandatory`. **No format assertion** (SPEC-06 BR-11)           |
| `status`      | Association to InitiativeStatus | yes      | SPEC-03 §2 am. 2 (D-62)             | **Written, not derived.** `FRM-001` transitions it in Wave 2    |
| `mergeCommit` | String(60)                      | no       | SPEC-03 §2 am. 1                    | Mandatory when `status` is Complete (§9). W1-S3 carries neither |
| `tag`         | String(30)                      | no       | SPEC-03 §2 am. 1                    | Mandatory when `status` is Complete (§9)                        |
| `position`    | Integer                         | yes      | SPEC-03 §2 am. 12, SPEC-04 §2 am. 1 | Gapped by 10, unique within its Workspace (`@assert.unique`)    |
| `workspace`   | Association to Workspace        | yes      | SPEC-03 §2                          |                                                                 |

**No `syncPoint` attribute** (SPEC-06 §2 am. 4). The live board header carries one and nothing in
slice 1 reads it — no Report renders it, no verb writes it, no rule turns on it. D-22.

### 4.5 Milestone

| Attribute     | Type                      | Required | Requiring spec                      | Notes                                                           |
| ------------- | ------------------------- | -------- | ----------------------------------- | --------------------------------------------------------------- |
| `storyId`     | String(30)                | yes      | SPEC-01 §2                          | Unique within its Initiative — **handler**, not annotation (§9) |
| `fricewType`  | Association to FricewType | yes      | SPEC-01 §2, SPEC-03 §2 am. 11       | Values singular — `Interface`, not `Interfaces` (D-60)          |
| `description` | LargeString               | yes      | SPEC-01 §2, SPEC-07 BR-11           |                                                                 |
| `shipsUi`     | Boolean                   | yes      | SPEC-02 §2 am. 3 (D-47)             | The **only** Conditional predicate in slice 1                   |
| `position`    | Integer                   | yes      | SPEC-03 §2 am. 12, SPEC-04 §2 am. 2 | Gapped by 10, unique within its Initiative (`@assert.unique`)   |
| `initiative`  | Association to Initiative | yes      | SPEC-03 §2                          |                                                                 |

**`status` is derived and is not a column** — SPEC-02 BR-17, [SPEC-01](specs/SPEC-01-MCP-INTENT-VERB-LAYER.md)
§2 am. 2. It surfaces as a `virtual` element on `ProjectView` (§11) and nowhere else. Its empty-Task-set
value is settled at **§5**.

**Creation status is a transient input to the create operation, not an attribute** (D-64) — supplied
by the caller, read by `ENH-001`, never persisted.

### 4.6 Task

| Attribute     | Type                           | Required | Requiring spec         | Notes                                                          |
| ------------- | ------------------------------ | -------- | ---------------------- | -------------------------------------------------------------- |
| `step`        | Association to MethodologyStep | yes      | SPEC-01 §2, SPEC-02 §2 | FK column is **`step_code`** — the `stepCode` every spec names |
| `status`      | Association to TaskStatus      | yes      | SPEC-02 §2             | Not Started · In Progress · Complete                           |
| `startedAt`   | DateTime                       | no       | SPEC-01 §2, SPEC-05 §2 | The stalled signal reads it                                    |
| `completedAt` | DateTime                       | no       | SPEC-01 §2             | **Must be clearable** — a legal reopen nulls it (D-57)         |
| `notes`       | LargeString                    | no       | SPEC-01 §2             |                                                                |
| `milestone`   | Association to Milestone       | yes      | SPEC-02 §3.2           |                                                                |

**No "was recently completed" attribute** (SPEC-04 §2 am. 3). A reopen clearing `completedAt` is what
removes a stage from `RPT-002`'s recently-completed section; nothing else records it.

### 4.7 Subtask

| Attribute     | Type                           | Required | Requiring spec         | Notes                                       |
| ------------- | ------------------------------ | -------- | ---------------------- | ------------------------------------------- |
| `step`        | Association to MethodologyStep | yes      | SPEC-01 §2, SPEC-02 §2 | FK column is **`step_code`**                |
| `status`      | Association to SubtaskStatus   | yes      | SPEC-02 §2             | Not Started · Complete — **no third value** |
| `completedAt` | DateTime                       | no       | SPEC-01 §2             |                                             |
| `task`        | Association to Task            | yes      | SPEC-02 §3.2           | Subtasks hang off the `sprint-build` Task   |

`SubtaskStatus` is a **separate code list from `TaskStatus`**, not the same list with a rule against
one value. Two lists make "a Subtask cannot be In Progress" referential integrity; one list plus a
guard makes it a handler nobody would think to write. Annotations over custom code.

---

## 5. `Milestone.status` Over an Empty Task Set (D-162)

**Ruling: an empty Task set derives `Done`.** [SPEC-02](specs/SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md)
BR-17 gains an explicit empty-set clause; the amendment is applied in §14.

This is settled here because it is a **contradiction between two Approved positions**, live on eleven
of twelve Milestones, that D-88 raised to this stage rather than settling.

| Reading                  | Result over an empty Task set                                                 | Source                 |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------- |
| BR-17's clauses in order | **Backlog** — "no Task has started" is the first clause and is vacuously true | SPEC-02 BR-17 (`:274`) |
| D-64's reasoning         | **Done** — "every blocking Task is Complete" is vacuously true                | D-64                   |

Both clauses fire. The rule as written is not a total function, and neither prior decision made it
one.

**Why `Done` is right, and by construction rather than by luck.** In slice 1 a Milestone is chainless
**if and only if** it was created Done:

- `ENH-001` fires on Milestone creation **with status Backlog, and at no other time**; a Milestone
  created Done receives no chain (SPEC-02 BR-09, BR-10, §3.2).
- A Milestone created Backlog therefore holds its chain from the same transaction. Seven of the nine
  stage steps are `Required` and one is `Recommended`, so a Backlog Milestone always materialises at
  least **eight** Tasks — `ux-test` is the only Conditional one (SPEC-02 §3.1).
- No verb deletes a Task or a Subtask (D-50), so a chain cannot be lost afterwards.

So `chainless ⟺ created Done`, and returning `Done` is correct for every row the model can hold —
including the eleven migrated Milestones, which really are Done (SPEC-03 BR-15).

**What this does not change.** `RPT-003` still renders no derived status (D-88); `ENH-002` still does
not read it (SPEC-04 BR-03); health still does not read it (SPEC-05 BR-06); `RPT-003`'s chain header
still does not read it (SPEC-07 BR-17); and `INT-007` still does not export it (SPEC-11 §2). **Four
Approved specs decline to read this value and none reads it** — which is why settling the
contradiction costs nothing on screen and is still worth doing: the value exists on `ProjectView` as
a virtual element (§11), and a derivation with two answers is not a derivation.

---

## 6. Methodology Entities — OI-05 Resolved (D-161)

**Ruling: structurally generic, functionally singular.** `Methodology` composes `MethodologyStep`; a
second methodology is a **data insert, not a schema change**; and **nothing anywhere selects between
methodologies**.

`OI-05` (`PROBLEM_STATEMENT_AND_VISION.md` §8) asked how generic these must be in v1. D-22 already
cut the four features that configure variation — a Type system, Templates, methodology combination
with shared-step merge, and refresh of an instantiated chain — and left the model question open with
one instruction: **the data model must not preclude genericity, but slice 1 does not build it.**

The fork was narrower than it looked, because two Approved specs had already foreclosed the
hardcoded direction: SPEC-02 §2 requires `Methodology` as an entity with `code` and `name`, and
SPEC-11 §2 lists `Methodology` and `MethodologyStep` among the persisted entities the exporter reads
in full. So the real question was whether the steps hang off the methodology, and whether anything
chooses one.

| What exists                                                  | What does not                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `Methodology` keyed by `code`, composing its steps           | **No `Milestone.methodology`** — nothing selects a chain               |
| `MethodologyStep.methodology`, mandatory                     | No Type system, no Templates, no merge, no chain refresh (D-22)        |
| A second methodology is one `Methodology` row plus its steps | No second methodology in slice 1, and no code path that would read one |

**The cost, stated.** `MethodologyStep.code` is the sole primary key (SPEC-01 §2 am. 1) and `Task`
and `Subtask` address a step by `code` alone — so **step codes are globally unique across
methodologies, not unique within one**. A second methodology must prefix or otherwise disambiguate
its codes. That is cheap and it is the price of keeping `stepCode` addressable by the verbs exactly
as eleven of the twelve specs assume.

**What a later slice adds to reach P2:** one association (`Milestone.methodology`) and a selector in
`ENH-001`. Not a re-model.

Both entities carry CAP's `managed` aspect and **not** `cuid` — `code` is the key. `managed` is kept
so `INT-007`'s round-trip has `createdAt` / `createdBy` to compare on all thirteen domain entities
rather than eleven (SPEC-11 BR-20).

### 6.1 Methodology

| Attribute | Type       | Required | Requiring spec | Notes                                                      |
| --------- | ---------- | -------- | -------------- | ---------------------------------------------------------- |
| `code`    | String(30) | **key**  | SPEC-02 §2     | `sprint-build` in slice 1. No `cuid` — the code is the key |
| `name`    | String(60) | yes      | SPEC-02 §2     | "Sprint Build"                                             |

One row, seeded by `CNV-001`. Its `code` equals stage 1's step code and that is harmless — separate
entities, and no verb addresses a Methodology by code (SPEC-02 §3.1).

### 6.2 MethodologyStep

| Attribute       | Type                           | Required | Requiring spec          | Notes                                                                                     |
| --------------- | ------------------------------ | -------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| `code`          | String(30)                     | **key**  | SPEC-01 §2 am. 1        | The slug — `sprint-build`, `code-quality`, `red`, `handoff`. Kebab-case (§8)              |
| `name`          | String(60)                     | yes      | SPEC-01 §2 am. 1        | The label — "Sprint Build"                                                                |
| `description`   | String(200)                    | yes      | SPEC-02 §2 am. 2        | One line, non-empty on every step (D-56)                                                  |
| `kind`          | Association to StepKind        | yes      | SPEC-02 §3.1            | Required · Conditional · Recommended                                                      |
| `position`      | Integer                        | yes      | SPEC-02 §2 am. 4        | **Gapped by 10 within each parent** — a convention, not a constraint (§9)                 |
| `conditional`   | String(30)                     | no       | SPEC-01 §2 am. 3 (D-47) | A **predicate name** (`shipsUi`), not a boolean. Null on a non-Conditional step           |
| `requiresHuman` | Boolean                        | yes      | SPEC-02 §2 am. 2        | D-35's rule as data. Exactly one step carries `true` (`human-review`)                     |
| `driver`        | String(30)                     | yes      | SPEC-02 §2 am. 2        | The slash command. Remediation text is generated from it (SPEC-02 BR-31)                  |
| `parent`        | Association to MethodologyStep | no       | SPEC-02 §2 am. 5        | **Self-reference.** Subtask steps hang off a stage step; only `sprint-build` has children |
| `methodology`   | Association to Methodology     | yes      | **D-161**               | The composition parent. Slice 1 has one value on all 16 rows                              |

Sixteen rows seeded by `CNV-001` — nine stage steps and seven subtask steps under `sprint-build`
(SPEC-02 §3.1).

---

## 7. Register Entities

Four registers, **all workspace-scoped** — [SPEC-07](specs/SPEC-07-CHAIN-AND-REGISTERS.md) BR-18
states it for `RPT-004` and SPEC-05 BR-20 for health. §11's `workspace` association (D-163) is what
makes that scope a navigable path rather than a query the model cannot express.

### 7.1 Defect

| Attribute     | Type                          | Required | Requiring spec                  | Notes                                                                     |
| ------------- | ----------------------------- | -------- | ------------------------------- | ------------------------------------------------------------------------- |
| `severity`    | Association to DefectSeverity | yes      | SPEC-01 BR-18                   | Critical · High · Medium · Low                                            |
| `status`      | Association to DefectStatus   | yes      | SPEC-01 BR-18                   | Open · Closed                                                             |
| `title`       | String(200)                   | yes      | SPEC-01 §2                      |                                                                           |
| `description` | LargeString                   | yes      | SPEC-01 §2, SPEC-07 BR-20       | Rendered on expansion; SPEC-03 BR-23 folds the Open Defect's content here |
| `references`  | LargeString                   | no       | SPEC-01 §2                      | Free text — the `file:line` list a caller supplies                        |
| `resolution`  | LargeString                   | no       | SPEC-01 §2                      | Nulled on an Open Defect in **both directions** (SPEC-03 BR-23)           |
| `milestone`   | Association to Milestone      | no       | SPEC-03 §2 am. 6                | **At least one of `milestone` / `initiative`** (§9)                       |
| `initiative`  | Association to Initiative     | no       | SPEC-03 §2 am. 6, SPEC-08 am. 2 | All four seeded Defects link here with a null story                       |
| `workspace`   | Association to Workspace      | yes      | **D-163**                       | The scope root                                                            |

**No date attribute, and that is a ruling.** `RPT-004` orders Defects **Open before Closed, then
severity descending, then by ID** (SPEC-07 BR-22) — no rule anywhere orders or renders a Defect by
date. Adding a `loggedAt` on D-72's precedent would be an attribute nothing tests (D-22). Its sort
key uses `createdAt` (§10), which is a **load fact** on the four migrated rows and is not claimed to
be anything else.

### 7.2 Decision

| Attribute    | Type                      | Required | Requiring spec          | Notes                                                                        |
| ------------ | ------------------------- | -------- | ----------------------- | ---------------------------------------------------------------------------- |
| `decision`   | LargeString               | yes      | SPEC-01 §2              |                                                                              |
| `rationale`  | LargeString               | no       | SPEC-03 §2 am. 8 (D-65) | Nullable — one seeded decision records none. Renders explicit "not recorded" |
| `context`    | LargeString               | no       | SPEC-01 §2, SPEC-03 §2  | Not rendered by `RPT-004` (SPEC-07 BR-23)                                    |
| `options`    | LargeString               | no       | SPEC-01 §2, SPEC-03 §2  | Not rendered by `RPT-004`                                                    |
| `decidedAt`  | DateTime                  | yes      | SPEC-07 §2 am. 2 (D-92) | `@cds.on.insert: $now`. `CNV-003` seeds 2026-07-10 on all five               |
| `initiative` | Association to Initiative | no       | SPEC-01 §2              | Target when set                                                              |
| `milestone`  | Association to Milestone  | no       | SPEC-01 §2              | Target when set                                                              |
| `workspace`  | Association to Workspace  | yes      | **D-163**               | The scope root — **and the target when both links are null**                 |

SPEC-01 §2 types `target` as **Workspace | Initiative | Milestone**. That trichotomy is modelled as
**two nullable links plus the mandatory scope**, on `Financial Planner` D-44's precedent (explicit
nullable FKs over a polymorphic column): a null-null Decision targets its Workspace. Two columns, not
three, and the scope association earns its keep twice.

### 7.3 Activity

| Attribute    | Type                        | Required | Requiring spec            | Notes                                                                                 |
| ------------ | --------------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `kind`       | Association to ActivityKind | yes      | SPEC-07 §2 am. 1          | **16 values** (§8)                                                                    |
| `actor`      | Association to Actor        | yes      | SPEC-02 §2 am. 6, D-166   | The caller's declared identity, carrying its own `kind` (§8.2)                        |
| `target`     | String(120)                 | yes      | SPEC-01 §2, SPEC-07 BR-28 | A reference **string**, not a foreign key — see below                                 |
| `payload`    | LargeString                 | no       | SPEC-01 §2                | JSON-encoded. Renders only on expansion; **no summary is derived from it** (BR-29)    |
| `occurredAt` | DateTime                    | yes      | SPEC-01 §2                | The domain clock. `RPT-004` orders by it and **never** by `createdAt` (SPEC-07 BR-26) |
| `workspace`  | Association to Workspace    | yes      | **D-163**                 | The scope root                                                                        |

**`target` is a String, and that is deliberate.** Sixteen kinds point at eight different entity types
(Workspace, Initiative, Milestone, Task, Subtask, Defect, Decision, TestRun). Explicit nullable FKs —
Financial Planner D-44's answer for six targets on one entity — would add eight columns of which
seven are null on every row, and would put referential integrity on rows that must survive as
written: an Activity is an append-only historical record, so a cascade or a blocked delete is the
wrong behaviour, not a safety net. The value is the qualified reference the verbs already use
(`{workspace-slug}/{storyId}`, `{workspace-slug}/{storyId}#{stepCode}`), which SPEC-07 BR-20 relies on
for the Defect `Scope` column too.

**Cost, stated:** `Activity.target` has no referential integrity and nothing prevents a dangling
reference. Nothing deletes a Milestone, an Initiative or a Workspace in slice 1, so no fixture can
produce one — which is why this is acceptable now and is the first thing to revisit when deletion
arrives.

### 7.4 TestRun

| Attribute     | Type                      | Required | Requiring spec           | Notes                                                                        |
| ------------- | ------------------------- | -------- | ------------------------ | ---------------------------------------------------------------------------- |
| `total`       | Integer                   | yes      | SPEC-01 §2               |                                                                              |
| `passed`      | Integer                   | yes      | SPEC-01 §2               |                                                                              |
| `failed`      | Integer                   | yes      | SPEC-01 §2               |                                                                              |
| `pending`     | Integer                   | no       | SPEC-03 §2 am. 7         |                                                                              |
| `durationMs`  | Integer                   | no       | SPEC-03 §2 am. 7         | Elapsed ms from `startTime` (SPEC-09 BR-07)                                  |
| `linesPct`    | Decimal(5,2)              | no       | SPEC-09 §2 am. 2         | Jest's coverage summary is optional — a run without `--coverage` has neither |
| `branchesPct` | Decimal(5,2)              | no       | SPEC-09 §2 am. 2         |                                                                              |
| `failures`    | LargeString               | no       | SPEC-09 BR-07            | JSON array of `{suite, title, message}` — **three fields, not four** (D-106) |
| `executedAt`  | DateTime                  | yes      | SPEC-01 §2 am. 4 (D-105) | Not null. A missing value surfaces as `ASSERT_NOT_NULL` verbatim (D-46)      |
| `task`        | Association to Task       | no       | SPEC-03 §2 am. 7         | **At least one of `task` / `initiative`** (§9)                               |
| `initiative`  | Association to Initiative | no       | SPEC-03 §2 am. 7         | Workspace mode's link target (D-104)                                         |
| `workspace`   | Association to Workspace  | yes      | **D-163**                | The scope root                                                               |

`failures` and `payload` are **JSON-encoded `LargeString`, not CDS `array of`**. A `LargeString` is
byte-stable across a CSV export and reload, which `INT-007`'s round-trip depends on (SPEC-11 BR-19),
and it maps identically on Postgres and SQLite — which matters while R1 is unexecuted (§13).

---

## 8. Code Lists

Twelve code lists. **No `String enum` anywhere** — the shared standards rule a CodeList entity for
any finite vocabulary needing dropdown UX, and the exemplar's §9 Enum Values table predates that
rule. Every code list is `{ key code : String; name : String; }` with `@Common: { Text: name,
TextArrangement: #TextOnly }` and `ValueListWithFixedValues` where a Form binds it.

| Code list          | `code` values                                                                                                                                                                                                                                                                        | Rows | `name`                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | -------------------------------------------- |
| `ActivityKind`     | `migration` · `checkpoint` · `statusUpdate` · `focusChange` · `initiativeStatus` · `lesson` · `sprintPlanned` · `storyAdded` · `stageStarted` · `stageCompleted` · `subtaskCompleted` · `stageReopened` · `defectLogged` · `defectResolved` · `decisionRecorded` · `testRunRecorded` | 16   | Title Case — "Stage Started"                 |
| `Actor`            | `sandro` · `implementer` · `test-author` · `gate-runner` · `build-briefer` · `pm-update` · `test-report` · `migration`                                                                                                                                                               | 8    | Title Case — "Test Author"                   |
| `ActorKind`        | `human` · `agent` · `system`                                                                                                                                                                                                                                                         | 3    | Title Case                                   |
| `DefectSeverity`   | `Critical` · `High` · `Medium` · `Low`                                                                                                                                                                                                                                               | 4    | Same as the code                             |
| `DefectStatus`     | `Open` · `Closed`                                                                                                                                                                                                                                                                    | 2    | Same as the code                             |
| `FricewType`       | `Interface` · `Conversion` · `Enhancement` · `Form` · `Report` · `Workflow`                                                                                                                                                                                                          | 6    | Same as the code                             |
| `HealthState`      | `Healthy` · `NeedsAttention` · `Struggling`                                                                                                                                                                                                                                          | 3    | "Healthy" · "Needs Attention" · "Struggling" |
| `InitiativeStatus` | `Active` · `Complete`                                                                                                                                                                                                                                                                | 2    | Same as the code                             |
| `MilestoneStatus`  | `backlog` · `inProgress` · `done`                                                                                                                                                                                                                                                    | 3    | "Backlog" · "In Progress" · "Done"           |
| `StepKind`         | `Required` · `Conditional` · `Recommended`                                                                                                                                                                                                                                           | 3    | Same as the code                             |
| `SubtaskStatus`    | `notStarted` · `complete`                                                                                                                                                                                                                                                            | 2    | "Not Started" · "Complete"                   |
| `TaskStatus`       | `notStarted` · `inProgress` · `complete`                                                                                                                                                                                                                                             | 3    | "Not Started" · "In Progress" · "Complete"   |

**Two code lists have rows and no stored foreign key**, and that is correct rather than an oversight:
`HealthState` and `MilestoneStatus` back **virtual** elements on `ProjectView` (§11), because both
values are computed on read and persisted nowhere (SPEC-05 §2 am. 4; §5 here). `INT-007` still
exports both — a code list is a table with rows (SPEC-11 §2).

### 8.1 Casing (D-165) — discharging SPEC-05 §2 amendment 6

SPEC-05 §2 amendment 6 flagged "two code-list casing conventions" for this stage to settle once.
**Measured, the flagged divergence does not exist.** It described `Activity.kind`'s `checkpoint` and
`migration` as lowercase against camelCase for the rest — but a one-word camelCase identifier **is**
lowercase. All sixteen `ActivityKind` codes are camelCase; two of them happen to be single words.

The **cross-list** divergence is real. The ruling is one rule with one exception, not a normalisation:

> **A `code` is the literal an Approved spec already froze. Where no spec froze an identifier, the
> `code` is camelCase and the `name` carries the phrase.**

| Shape                 | Code lists                                                                                            | What froze it                                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **PascalCase**        | `DefectSeverity`, `DefectStatus`, `FricewType`, `HealthState`, `InitiativeStatus`, `StepKind` — **6** | SPEC-01 FUT-014 (`Interface`), SPEC-01 BR-18 and SPEC-03 BR-20 (`High/Closed`), SPEC-02 §3.1's table, D-62, D-70 |
| **camelCase**         | `ActivityKind`, `ActorKind` — **2**                                                                   | SPEC-07 §2 am. 1's sixteen; `ActorKind` is minted here                                                           |
| **Mixed camel/kebab** | `Actor` — **1**                                                                                       | Agent codes mirror the `.claude/` folder name; `sandro` and `migration` are single words                         |
| **camelCase (new)**   | `MilestoneStatus`, `SubtaskStatus`, `TaskStatus` — **3**                                              | **Nothing.** See below                                                                                           |

Six plus two plus one plus three is twelve.

**The three status lists are the exception, and the reason is measurable.** SPEC-02 §2 and §3 write
their vocabularies as `Not Started`, `In Progress`, `Backlog` — **display phrases containing a
space**, not identifiers. They are the only three of the twelve where no spec ever froze an
identifier-shaped literal, and a key with a space is a poor primary key, a poor CSV column value and
a poor URL segment. So these three take a camelCase `code` and carry the spec's phrase in `name`.
Nothing a person sees changes.

**No other value is renamed.** Renaming `Interface`, the severity words or the step kinds for
cosmetic consistency would amend five Approved specs and their FUTs to change nothing a user sees.
`MethodologyStep.code` is kebab-case for the same reason and is not a code list — its slugs are
frozen by SPEC-02 FUT-002's contract with SPEC-01's own FUTs.

The rule governs the **next** code list; the existing ones are recorded as they stand, with what
froze each.

### 8.2 `Actor` is a code list with a kind (D-166)

SPEC-02 §2 amendment 6 asked for "a kind" on the actor identity and stated slice 1's form as
"identities are enumerated and `sandro` is the only human; anything else is an agent."

**That rule is already false against an Approved spec.** SPEC-09 §2 amendment 4 adds `test-report`
and says in terms that it is **not an agent** — "which is new; every prior value names an agent or
`sandro`". An open-set rule of the form _not-sandro ⟹ agent_ therefore misclassifies a value the
module already carries, and cannot distinguish it from a typo.

So `Actor` is a code list of eight identities, each with a mandatory `kind` → `ActorKind`:

| `code`          | `kind`   | Introduced by     |
| --------------- | -------- | ----------------- |
| `sandro`        | `human`  | SPEC-02 §2 am. 6  |
| `implementer`   | `agent`  | SPEC-01 §3.1      |
| `test-author`   | `agent`  | SPEC-01 §3.1      |
| `gate-runner`   | `agent`  | SPEC-01 §3.1      |
| `build-briefer` | `agent`  | SPEC-08 §2 am. 3  |
| `pm-update`     | `agent`  | SPEC-08 §2 am. 3  |
| `test-report`   | `system` | SPEC-09 §2 am. 4  |
| `migration`     | `system` | SPEC-03 §2 am. 10 |

SPEC-02 BR-23 (`complete_stage` on a `requiresHuman` step is rejected for an agent caller) becomes
`actor.kind.code != 'human'` — referential integrity plus one lookup, not a string comparison against
an open set. SPEC-07 BR-30's machine/human split is the same test read the other way, and is
unaffected: `system` falls in the machine half exactly as `agent` does.

**Cost, stated:** an unseeded actor is rejected at insert, so adding an agent to `.claude/` requires
one seed row before it may write. That is the intended behaviour — D-05 removed the CRUD escape
hatch so that nothing writes into the state of record unaccountably, and an unrecognised writer is
the same class of thing.

---

## 9. Constraints — Annotation or Handler

The shared standards say reach for a CAP built-in before writing a handler. Every constraint is
classified, **with the reason**, so a build persona does not simplify a deliberate handler back into
an annotation.

| Constraint                                                        | Mechanism                               | Why                                                                                                                                                                            |
| ----------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Workspace.slug` unique                                           | `@assert.unique`                        | No spec demands a named key for it                                                                                                                                             |
| `Initiative.position` unique within Workspace                     | `@assert.unique`                        | SPEC-04 §2 am. 1 says so in terms                                                                                                                                              |
| `Milestone.position` unique within Initiative                     | `@assert.unique`                        | SPEC-04 §2 am. 2 says so in terms                                                                                                                                              |
| `Initiative.branch` present                                       | `@mandatory`                            | SPEC-06 §2 am. 3. Surfaces as `ASSERT_NOT_NULL` verbatim and mints no `frm.*` key                                                                                              |
| `TestRun.executedAt` present                                      | not null                                | D-46 / D-105 — the mechanism decides the message, verbatim                                                                                                                     |
| `Decision.decidedAt` present                                      | not null + `@cds.on.insert: $now`       | SPEC-07 §2 am. 2. No verb signature changes; `CNV-003`'s seed is the only override                                                                                             |
| `Initiative.mergeCommit` and `tag` present when `status` Complete | cross-field `@assert`                   | SPEC-05 §2 am. 5 — what makes D-62's "Complete means merged and tagged" structural                                                                                             |
| `Defect` has at least one of `milestone` / `initiative`           | cross-field `@assert`                   | SPEC-03 §2 am. 6; must hold on post-cutover rows too (SPEC-08 §2 am. 2)                                                                                                        |
| `TestRun` has at least one of `task` / `initiative`               | cross-field `@assert`                   | SPEC-03 §2 am. 7                                                                                                                                                               |
| **`Initiative.name` unique within Workspace**                     | **handler** — the shared create-handler | SPEC-06 §2 am. 2 rules this out of `@assert.unique` by name: it must reject 409 with a named key, and an annotation would pass `ASSERT_UNIQUE`/400 through verbatim under D-46 |
| **`Milestone.storyId` unique within Initiative**                  | **handler** — the shared create-handler | SPEC-06 BR-19, same reason. D-79 gives both entities one shared create-handler                                                                                                 |
| **No format assertion on `Initiative.branch`**                    | **neither**                             | SPEC-06 BR-11 rules it out; recorded so its absence reads as a decision                                                                                                        |
| `MethodologyStep.conditional` names only `shipsUi`                | **neither** — `CNV-001` load validation | SPEC-02 §3.1 rejects the _load_, tested by FUT-001 and FUT-003. A model constraint over one legal value would be a second enforcement of a seed-time check                     |
| `MethodologyStep.position` gapped by 10                           | **convention**                          | SPEC-02 §2 am. 4. Nothing enforces the gap; it exists so a step can be inserted between two                                                                                    |

---

## 10. Sort Keys (D-164)

[SPEC-11](specs/SPEC-11-PROJECT-STATE-EXPORTER.md) BR-07 places a **standing requirement** on this
stage: every persisted entity declares a stable sort key with its own key column as the final
tiebreak, and append-growing entities lead with a temporal column (D-125).

**Mechanism: a CDS annotation, `@lifeos.sortKey`, read from the CSN by `INT-007`.**

| Option                            | Rejected because                                                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A new attribute per entity        | SPEC-11 §2 declares **no new attribute**, and BR-07 says the key is a property the model must have, not a column                                                       |
| A hardcoded table in the exporter | It drifts silently the moment an entity is added, and no linter exists that would catch it — the exporter would export a new table in UUID order and nobody would know |
| A convention documented here only | Same drift, one indirection further away                                                                                                                               |

The annotation wins on a fact already true of the exporter: SPEC-11 BR-06 **already reads the CSN**
to enumerate entities and filter draft shadows, so reading one more annotation off each entity costs
nothing and keeps the declaration next to the thing it describes. It is also the shared standards'
own preference — annotations over custom code.

| Entity            | `@lifeos.sortKey`                                     | Note                                                    |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `Area`            | `name`, `ID`                                          |                                                         |
| `Engagement`      | `area_ID`, `name`, `ID`                               |                                                         |
| `Workspace`       | `slug`, `ID`                                          |                                                         |
| `Initiative`      | `workspace_ID`, `position`, `ID`                      |                                                         |
| `Milestone`       | `initiative_ID`, `position`, `ID`                     |                                                         |
| `Task`            | `milestone_ID`, `step_code`, `ID`                     | Groups a chain contiguously                             |
| `Subtask`         | `task_ID`, `step_code`, `ID`                          |                                                         |
| `Methodology`     | `code`                                                | `code` is the key; already total                        |
| `MethodologyStep` | `methodology_code`, `parent_code`, `position`, `code` | Chain order, and still total                            |
| `Defect`          | `createdAt`, `ID`                                     | Append-growing; `createdAt` is its only clock (§7.1)    |
| `Decision`        | `decidedAt`, `ID`                                     | Append-growing. All five seeded rows tie at 2026-07-10  |
| `Activity`        | `occurredAt`, `ID`                                    | **D-125** — temporal first, so growth appends           |
| `TestRun`         | `executedAt`, `ID`                                    | **D-125** — one row per `npm test`, several times a day |
| Every code list   | `code`                                                | The key; already total                                  |

`ID` last is what makes each key total on the **eleven** `cuid`-keyed domain entities; `Methodology`
and `MethodologyStep` are keyed by `code` instead, which is already total on its own. The temporal
column first on the **four** append-growing entities — the four registers — is what makes growth a
diff of appended lines rather than a scatter (D-125).

---

## 11. The Read Projection (D-163)

[DS-001](DESIGN_SYSTEM.md) §5.3 places the largest single requirement this stage inherits: the
`project_view` payload must be expressible as a **read-only entity whose collections are navigation
properties**, because `sap.fe.macros` binds collections rather than arbitrary JSON (D-145, SPEC-01
BR-22a). D-145 named the requirement and not the CAP construct; this section names it.

**`ProjectView` is a read-only projection on `Workspace`** — not a CDS `select from` view, not a
function import, and not a second stored entity.

| Rejected construct         | Why                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| A CDS `select from` view   | A view flattens into rows. The registers would arrive as columns of a join, not as bindable collections |
| A function / action        | An opaque result — exactly what D-145 rules out                                                         |
| A separate composed entity | It would duplicate persisted data and need writing, which contradicts read-only                         |

### 11.1 Shape

| Element                                                                                      | Kind                         | Source                                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slug`, `name`, `currentFocus`                                                               | direct                       | `Workspace` (§4.3)                                                                                                                                              |
| `health`                                                                                     | **virtual** → `HealthState`  | `ENH-003`, computed in an `after READ` handler (SPEC-05 BR-02)                                                                                                  |
| `nextActionStoryId`, `nextActionStepCode`, `nextActionLabel`, `nextActionDriver`             | **virtual**                  | `ENH-002` (SPEC-04). Flat, because DS-001 §5.2 requires navigation only for the **collections**                                                                 |
| `gateTotal`, `gatePassed`, `gateFailed`, `gateLinesPct`, `gateBranchesPct`, `gateExecutedAt` | **virtual**                  | The most recent `TestRun` (SPEC-05 BR-24). "Most recent" is not expressible in an `on` condition, so it is a handler-filled scalar set rather than a navigation |
| `initiatives` → `milestones` → `tasks` → `subtasks`                                          | navigation                   | Each Milestone's chain (SPEC-07 BR-04, BR-05)                                                                                                                   |
| `taskQueue`                                                                                  | navigation → `TaskQueueItem` | The queue (SPEC-04, `RPT-002`)                                                                                                                                  |
| `defects`, `decisions`, `activities`                                                         | navigation                   | The three registers (SPEC-07 `RPT-004`)                                                                                                                         |

`TestRun` has **no collection** on the projection — it is written-only in slice 1 and surfaces as
`RPT-001`'s gate tile (D-19, SPEC-07 §3.2).

`TaskQueueItem` is a **read-only CDS view over `Task`** filtered to incomplete rows, carrying a
flattened `workspace` element so the association from `ProjectView` is one hop. The filter lives in
the view; ENH-002's ordering lives in `@UI.PresentationVariant`. Neither persists anything.

### 11.2 The `workspace` association, and why the four registers gain one

`Defect`, `Decision`, `Activity` and `TestRun` each gain a **mandatory `workspace` association**.
This is an addition beyond what any spec's §2 listed, and it is an amendment (§14) rather than an
invention, because the requirement it satisfies is already in three Approved specs:

- All three registers are **workspace-scoped** — SPEC-07 BR-18 rules it, with the deciding argument
  that an Initiative-scoped Defect table would let `RPT-001`'s header read `NeedsAttention` on a
  Defect the register on the same page does not show.
- Health reads open Defects **workspace-wide**, because **D-71**'s roll-up terminates at the
  Workspace — the fact SPEC-07 BR-18 reasons from.
- `record_test_run` and `log_defect` both carry a workspace mode (D-96, D-104), so a workspace is
  always determinable at write time.

Without it there is no navigable path. A `Defect` links to a Milestone **or** an Initiative, so
"every Defect in this Workspace" is a union of two paths, which one association `on` condition cannot
express; and a `Decision` may target the Workspace itself, in which case no path exists at all. The
alternative — an `on` condition traversing `milestone.initiative.workspace` — is undefined for
exactly the rows the registers must show.

---

## 12. Computed at Runtime — Not Stored

Values that look like columns and are not. Each is a stated "no column".

| Value                     | Computed from                                            | Computed by | Ruling                     |
| ------------------------- | -------------------------------------------------------- | ----------- | -------------------------- |
| **Workspace health**      | Open Defects, stalled Tasks, the most recent TestRun     | `ENH-003`   | SPEC-05 §2 am. 4, BR-02    |
| **`Milestone.status`**    | The Milestone's Tasks and their blocking kinds           | Derivation  | SPEC-02 BR-17; **§5** here |
| **The next action**       | Initiative and Milestone `position`, then chain position | `ENH-002`   | SPEC-04                    |
| **The task queue**        | Incomplete Tasks in the Workspace, in resolution order   | `ENH-002`   | SPEC-04; §11.1             |
| **Defect `Scope`**        | Whichever of `milestone` / `initiative` is present       | `RPT-004`   | SPEC-07 BR-20              |
| **Machine / human label** | `actor.kind`                                             | `RPT-004`   | SPEC-07 BR-30; **§8.2**    |

`INT-007` exports **none** of these — nothing derived is persisted, and the exporter reads persisted
columns only (SPEC-11 §2).

---

## 13. Draft Enablement

**No entity in this module is draft-enabled.** This is inherited from [DS-001](DESIGN_SYSTEM.md) §4.3
(D-144) and is not re-decided here. It closes what SPEC-11 BR-06 left open, and BR-06's filter text
stays unchanged — it is unconditional by design, excluding whatever the CSN marks as a draft shadow
and asserting nothing about whether that set is non-empty.

Consequence for this document: no entity carries `@odata.draft.enabled`, and no table below has a
draft shadow. `INT-007` will find none to filter, which is the correct outcome rather than a sign the
filter is wrong.

---

## 14. Amendments

Seven, **all applied in-session**. Five touch a spec — **all five on Approved specs**, across four
distinct specs, because `SPEC-02` is amended twice.

| #   | Target                                                                                                 | Change                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [SPEC-02](specs/SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-17 (Approved)                         | Gains an explicit empty-Task-set clause: **Done**, because chainless ⟺ created Done (D-162, §5). The rule as written was not a total function                                                                                                                                                                                                                                                       |
| 2   | [SPEC-01](specs/SPEC-01-MCP-INTENT-VERB-LAYER.md) §2 (Approved)                                        | `Activity`, `Defect`, `Decision` and `TestRun` gain a mandatory `workspace` association (D-163, §11.2). **No verb signature changes** — every write verb already resolves a workspace                                                                                                                                                                                                               |
| 3   | [SPEC-03](specs/SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §2 (Approved)                             | Same association on the four registers `CNV-003` seeds; the load sets it from the Workspace it is loading into                                                                                                                                                                                                                                                                                      |
| 4   | [SPEC-05](specs/SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §2 am. 6 (Approved)                            | **Discharged.** The flagged divergence does not exist as described. The cross-list rule is settled: **eight** of the twelve code lists keep the literal a spec froze, `ActorKind` is minted here, and the **three** status lists — the only ones whose spec text is a display phrase with a space — take a camelCase `code` with the phrase in `name`, changing nothing a person sees (D-165, §8.1) |
| 5   | [SPEC-02](specs/SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) §2 am. 6 (Approved)                      | Superseded. "Anything else is an agent" is already false against SPEC-09 §2 am. 4's `test-report`; the identity becomes a code list with a `kind` (D-166, §8.2)                                                                                                                                                                                                                                     |
| 6   | `research/README.md` §5 R1, and D-39                                                                   | The account of **why** the binding fails is corrected — `pg` rejects the empty password client-side before any handshake; the server is never reached (D-168, §15)                                                                                                                                                                                                                                  |
| 7   | [PSV-001](PROBLEM_STATEMENT_AND_VISION.md) §8 `OI-05`, and [CLAUDE.md](../CLAUDE.md) §Folder Structure | `OI-05` marked closed by D-161 — **the last open item**. `db/`'s filling stage corrected from Data Model to Build (D-160, §3)                                                                                                                                                                                                                                                                       |

---

## 15. Risks Assigned to This Stage

**One — R1 — and it is the risk that has waited longest.** `research/README.md` §7 routes **Data
Model → RSH-002**, and D-39 assigns **R1** here by name. Checked rather than assumed: no other row in
`research/README.md` §5 names this stage. **R4 and R7 belong to `INT-007`'s own build** (D-121) and
**R10 to `CNV-005`** (D-119); R9 is executed and closed (D-140) and is not re-opened.

### 15.1 R1 — executed as far as it goes, and blocked (D-168)

**Grade stays `Inferred`. Re-owned to the Tech Stack stage.**

The register says to repeat the D-05 spike's `run.js` against `@cap-js/postgres`, and D-39 says
standing the binding up is a prerequisite of this stage rather than a detail inside it. It was
attempted. What was measured, this session:

| Measurement                                                                   | Result                                                                                                                 |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A Postgres server is listening on `localhost:5432`                            | **Yes** — seven `postgres` processes, PID 6788 holding the listen socket on `0.0.0.0` and `::`                         |
| `pg_hba.conf` authentication method                                           | **`scram-sha-256` on every line.** No `trust` entry, local or host                                                     |
| A credential for the `postgres` role anywhere in the repo or the user profile | **None** — no `pgpass.conf`, no `PG*` environment variable, and `Financial Planner/.env` carries only `ENCRYPTION_KEY` |
| `password: ""` (both modules' `package.json` declare this)                    | **Fails before the server is reached** — `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`          |
| Password omitted entirely                                                     | Same client-side failure                                                                                               |
| `postgres` / `postgres`                                                       | **Reaches the server** and returns `28P01 password authentication failed`                                              |

**The register's account of the failure is wrong, and the correction matters.** `research/README.md`
§5 and D-39 both say the empty password is something "SCRAM rejects". It is not: an empty string is
falsy, so the client library treats it as absent and throws a **type guard** before the handshake
begins. The server never sees an authentication attempt at all. Only the third attempt above
produces a genuine server-side rejection. Both readings end in "no connection", but they point at
different fixes — the first at the driver, the second at a credential — and the second is the real
one. Amendment 6 in §14.

**Why re-owning rather than forcing it:** the two ways to proceed from here are to obtain the
credential, which is Sandro's to supply, or to add a `trust` line to `pg_hba.conf` and reload — a
change to a Postgres installation outside this repo, which is not a thing to do unasked as a side
effect of writing a design document.

**Owner: the Tech Stack stage. Deadline: before `INT-001` is built.** That stage already owns the
serving-stack ruling, the TypeScript-loader ruling (D-33) and the untested reverse proxy (D-141), and
it is the last stage before the Build Plan orders the work. **Eleven specs — SPEC-01 … SPEC-09,
SPEC-11 and SPEC-12 — remain provisional on R1**; SPEC-10 is the one that is not (D-119).

**Nothing in this document is designed around R1 holding.** Two rulings were made the portable way
because of it: `failures` and `payload` are `LargeString` rather than a CDS `array of` (§7.4), and no
constraint relies on a Postgres-specific type or a deferred-constraint mode.

---

## 16. Open Items Resolved

| Item      | Ruling                                                                                                                                                                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OI-05** | **Resolved (D-161, §6).** Methodology is structurally generic and functionally singular: `Methodology` composes `MethodologyStep`, and nothing selects between methodologies. **This was the last open item in the module** — OI-01 (D-31), OI-02 (D-29, D-30), OI-03 (D-35) and OI-04 (D-70) were already closed |

---

## 17. Decisions Reference

| ID        | Title                                                                                                         | Summary                                                                                                                                                                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-160** | The Data Model stage ships the document and no CDS file                                                       | `db/` stays empty until Build. No Test Strategy, no Build Plan and no `test` script exist yet, so a schema written here is code no gate covers. `CLAUDE.md`'s folder-structure claim is corrected rather than left contradicting the ruling                            |
| **D-161** | OI-05 — structurally generic, functionally singular                                                           | `Methodology` composes `MethodologyStep`; nothing selects between methodologies. Two Approved specs had already foreclosed the hardcoded direction. Cost stated: step codes are globally unique, not per-methodology                                                   |
| **D-162** | An empty Task set derives `Done`                                                                              | BR-17's ordered clauses return Backlog and D-64 returns Done; both are vacuously true. `chainless ⟺ created Done` by ENH-001 BR-09/BR-10 and D-50, so Done is correct by construction. Amends an Approved spec                                                         |
| **D-163** | The read path is a read-only projection on `Workspace`, and the four registers gain a `workspace` association | A view flattens, a function is opaque. Without the association there is no navigable path: a Defect's scope is a union of two paths and a Workspace-targeted Decision has none                                                                                         |
| **D-164** | The sort key is a CDS annotation, not an attribute or a convention                                            | SPEC-11 declares no new attribute, and the exporter already reads the CSN. A hardcoded table in the exporter drifts silently with no linter to catch it                                                                                                                |
| **D-165** | A `code` is the literal a spec froze; three status lists are the exception                                    | The divergence SPEC-05 flagged does not exist — a one-word camelCase code **is** lowercase. Eight lists keep a frozen literal, `ActorKind` is minted here, and three carry a display phrase with a space, so those take a camelCase code and keep the phrase in `name` |
| **D-166** | `Actor` is a code list carrying a kind                                                                        | SPEC-02's "anything not `sandro` is an agent" is already false against SPEC-09's `test-report`. Eight identities, three kinds; BR-23 becomes referential integrity plus a lookup                                                                                       |
| **D-167** | `Activity.target` is a reference string; every other target is an explicit nullable FK                        | Sixteen kinds across eight entity types would need eight columns, seven null per row, on an append-only record. Decision's trichotomy is two nullable links plus the mandatory scope                                                                                   |
| **D-168** | R1 is measured, blocked on a credential, and re-owned to Tech Stack                                           | The register's cause is wrong: `pg` rejects the empty password client-side and the server is never reached. Only `postgres`/`postgres` produces a real `28P01`. Grade stays `Inferred`                                                                                 |
| **D-169** | D-159's approval gate failed a third time, and the fix is structural                                          | `TH-001` opened this stage unapproved after `IA-001` and `DS-001` did the same. The gate was step 6 of 8 in a numbered list; in `/generate-data-model` it is step **0** of Phase 6                                                                                     |

---

_This document is the entity contract for Project Tracker — 13 domain entities, 12 code lists, two
read-only projections, and the constraints, sort keys and rulings behind them. Every attribute traces
to the spec that required it; the twelve specs' Data Model sections are the input, not the reference
([D-43](DECISIONS_LOG.md)). It resolves **OI-05**, the module's last open item, and re-owns **R1**
with what was measured. Decisions are logged in the [Decisions Log](DECISIONS_LOG.md) at
D-160 … D-169. No CDS file is written here — that is the first build story's (§3)._
