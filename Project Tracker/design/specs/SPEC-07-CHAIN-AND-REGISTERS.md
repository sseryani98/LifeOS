# SPEC-07 — Chain & Registers

**Spec ID:** SPEC-07
**FRICEW Objects:** RPT-003 (Report), RPT-004 (Report)
**Wave:** 2
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 … SPEC-06. ~~and **R9** (D-69), inherited from
SPEC-04 because this spec carries Reports.~~ **R9 was executed and discharged at the Information
Architecture stage, 2026-08-06 (D-140, D-141).** **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-06 | Sandro & Claude | **R9 executed and discharged** at the Information Architecture stage (D-140, D-141) — provisional on **R1 alone**. BR-03's hand-off of layout, interaction and "how a second story is selected" is answered in `INFORMATION_ARCHITECTURE.md` (D-137): RPT-003's story selector is an in-page control reflected in a `story` route parameter, and RPT-004's Defect Scope cell gains click navigation when Scope resolves to a story. Decision list and Activity timeline gain **no** outbound links.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-07-30 | Sandro          | Status → Approved. All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on **R1 and R9** for build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-07-30 | Sandro & Claude | Seven defects fixed on Sandro's review, before approval. **BR-05 defaulted RPT-003 to the story `next_action()` resolves to, and that verb returns null** when no Milestone holds an incomplete Task — SPEC-04 BR-15's own fourth state, reachable once every Task is Complete, leaving the Report with no rule; now **BR-05a** and **FUT-018**. **FUT-004 asserted an outcome its steps never produced** (SPEC-06 FUT-012's class). **§2 declared `Defect.description` and `Milestone.description` as read while no rule rendered either** — and SPEC-03 BR-23 folds the only Open Defect's content _into_ `description`, so the register's one actionable row hid what made it actionable; BR-11 and BR-20 now render both. **`decidedAt` was made not-null with no writer** on the ongoing path; §2 amendment 2 now states `record_decision` stamps it at insert. Plus a bare `BR-31` where this spec carries one, a wrong-rule citation (SPEC-05 BR-14 → BR-18), and **one defect originating in the brief to the writer rather than in the writer**: §6 claimed D-37 §11.1's trigger fires for the `project_view` change, when §11.1 scopes it to a **guard** that cannot be stated without changing a verb signature — D-55 and D-77's reading. 35 BRs → **36**, 17 FUTs → **18**. |
| 2026-07-30 | Sandro & Claude | Initial creation from the SPEC-07 workshop. Records D-83 through D-92. **SPEC-07 resolves no OI.** Provisional on R1 (D-39) and R9 (D-69). Amendments owed and applied: SPEC-01's **ninth** (`project_view`'s Returns cell, and nine verb-emitted `Activity.kind` values), SPEC-03's **third** (`Decision.decidedAt`, seeded 2026-07-10), SPEC-06 BR-25's struck clause, and the SPEC-05 §6 / SPEC-06 §6 wording correction from `kind` to `actor`. Three BA-001 corrections listed in §6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-08-06 | Sandro & Claude | **BR-03 is discharged in full at the Design System stage (D-144, D-148, D-150).** It deferred five things; navigation and interaction were answered at Information Architecture the same day, and **layout, section arrangement and chart type are answered here** — RPT-003 is section 2 and RPT-004 section 3 of one `sap.uxap.ObjectPageLayout`, and **there is no chart**. Build technology is **Fiori Elements FPM with drafts OFF**. Two control rulings worth naming: RPT-003's Subtasks render as a nested `sap.m.List` that is **always visible, never on expansion**, because IA-001 §6.4's disclosure inventory does not include them; and RPT-004's two expandable regions (`description`, `payload`) are `sap.m.Panel` with `expandable="true"` and `expanded` left unset. **BR-03's "content and ordering only" clause is unchanged.** No business rule and no FUT changes. Status stays **Approved**.                                                                                                                                                                                                                                                                                                                                                                     |

---

## 1. Overview

The two leaf displays of the project view: RPT-003 renders one story's methodology chain — its Tasks,
its Subtasks under `sprint-build`, and what has been recorded against each — and RPT-004 renders the
three registers, the Defect table, the Decision list and the combined Activity timeline (D-19,
BA-001 §8). They share one spec because they share one display pattern at trivial volume
(D-37, BA-001 §11 row 07), not because they share a computation: neither reads the other.

Both are pure read surfaces. They render from the single `project_view` call SPEC-01 BR-22 already
guarantees, write nothing, and emit nothing. The one place they touch is the day-one shape of the
data: RPT-003's empty state is the **normal** case on eleven of twelve Milestones, while RPT-004 has
**no reachable empty state at all** — which is why one is specified and tested and the other is
refused (D-89).

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity              | Role in this spec                                         | Attributes this spec reads                                                                                                   |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Milestone**       | The subject of a chain; RPT-003's header                  | `storyId`, `fricewType`, `shipsUi`, `description`. **`status` is deliberately not read** (BR-17)                             |
| **Task**            | A chain row                                               | `stepCode`, `status`, `startedAt`, `completedAt`                                                                             |
| **Subtask**         | A chain row nested under `sprint-build`                   | `stepCode`, `status`, `completedAt`                                                                                          |
| **MethodologyStep** | Supplies every label, order and kind a chain row displays | `code`, `name`, `description`, `kind`, `position`, `conditional`, `driver`                                                   |
| **Defect**          | The Defect register                                       | `severity`, `status`, `title`, `description`, `resolution`, plus its links to Milestone (nullable) and Initiative (nullable) |
| **Decision**        | The Decision register                                     | `target`, `decision`, `rationale`, **`decidedAt`** (new)                                                                     |
| **Activity**        | The combined timeline                                     | `kind`, `actor`, `target`, `payload`, `occurredAt`                                                                           |
| **Initiative**      | Read only as a Defect's or Decision's scope label         | `name`                                                                                                                       |

**Everything above is already required by SPEC-01 … SPEC-06; the Data Model stage should not
double-count. This spec adds exactly one attribute and one code-list widening.**

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`Activity.kind` admits sixteen values.** The existing eight — `migration`, `checkpoint`, `statusUpdate`, `focusChange`, `initiativeStatus`, `lesson`, `sprintPlanned`, `storyAdded` — plus the **eight new verb-emitted kinds** in BR-32's table. Nine write verbs map onto eight new values because `sprintPlanned` is shared: `plan_sprint` emits it and FRM-002's Plan Sprint mode writes it (SPEC-06 BR-23). **Extends SPEC-06 §2 amendment 1.** SPEC-05 §2 amendment 6's casing divergence (`checkpoint` / `migration` lowercase against camelCase for the rest) is **not settled here** (D-81).                                                                                                                                                    |
| 2   | New on `Decision`: **`decidedAt`** — DateTime, **not null**. `Decision` carries no date, so BR-25's "most recent first" would sort by CAP's `createdAt`, which reads the **cutover** date for decisions made 2026-07-10. This is **D-72's finding one table over** — `TestRun` gained `executedAt` for the identical reason, from the identical source file and date (D-92). **Amends SPEC-03**: CNV-003 seeds `decidedAt` = 2026-07-10 on all five decisions in SPEC-03 BR-24. **Its writer on the ongoing path is stated so a not-null attribute is not left with none**: `record_decision` gains no input and stamps `decidedAt` at insert (`@cds.on.insert: $now`), so **no verb signature changes** and CNV-003's explicit seed is the only override. |

---

## 3. Functional Description

### 3.1 RPT-003 — Methodology Chain [Report]

#### Sections — three, and what each holds

| #   | Section          | Holds                                                                                                                                                             |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Chain header     | The story ID as `{workspace-slug}/{story-id}`, `fricewType`, `description`, `shipsUi`, and the **materialised Task count** (BR-11). **No derived status** (BR-17) |
| 2   | The Task rows    | One row per materialised stage Task: `position`, step `name`, `description`, `kind`, the Task's `status`, `startedAt`, `completedAt`, `driver` (BR-06)            |
| 3   | The Subtask rows | Nested under the `sprint-build` Task only: `position`, step `name`, `description`, `status` (BR-08, BR-09)                                                        |

#### Aggregation logic

| Section | Rule                                                                                                                                                                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | `project_view` returns **every** Milestone's chain; RPT-003 renders **one at a time**, defaulting to the story `next_action()` resolves to, so mid-build it agrees with RPT-002 (BR-04, BR-05)                                                                 |
| 1       | The header states `shipsUi` and the Task count together, because a chain of 8 against a library of 9 is otherwise indistinguishable from data loss (BR-11)                                                                                                     |
| 2       | A Conditional step whose predicate failed contributes **no row**; the chain is shorter and nothing marks a skip (BR-10, SPEC-02 BR-12)                                                                                                                         |
| 2       | Status renders from `Task.status` **alone** — no prior completion is shown, because a reopen clears `completedAt` and the history lives in the Activity log (BR-15, D-57)                                                                                      |
| 2       | A **Recommended** step renders distinguishably from a Required one, because it never blocks and can legally sit open on a Done Milestone (BR-12, SPEC-02 BR-15)                                                                                                |
| 3       | Subtasks nest under `sprint-build` and nowhere else (BR-08, D-49). A Subtask row carries **no `driver` and no `requiresHuman`** — SPEC-02 §3.1's subtask step table declares neither column, so RPT-003 structurally cannot show a command per subtask (BR-09) |
| 2, 3    | Both levels order by `position` **ascending** (BR-13)                                                                                                                                                                                                          |

#### Day one

The workspace holds twelve Milestones and **exactly one has a chain** —
`financial-planner/CNV-001`, with **8 Tasks and 6 Subtasks, all Not Started** (SPEC-03 BR-18,
SPEC-03 BR-31). It is a Conversion that ships no UI, so `ux-test` and `smoke` were never materialised and
have **no rows at all**. The other eleven are Done Milestones with zero Tasks (SPEC-03 BR-19).
**The empty state is the normal case here, not the edge case.**

#### Filters and sorting

Ordering is `position` ascending at both levels (BR-13) and is data, not a control. No filter or
sort control is specified: interaction over a chain is Information Architecture's (BR-03, D-21).

#### Drill-down

A chain is addressed by the Milestone it renders, as `{workspace-slug}/{story-id}` (D-45) — the same
value RPT-002's rows already carry as their navigation target (SPEC-04 BR-30), and a stage within it
by `stepCode`. **The interaction itself — what is clickable, how a second story is selected, where it
goes — is the Information Architecture stage's** (BR-03, D-21).

#### Empty states

| Condition                               | Renders                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| The Milestone has **zero Tasks**        | An empty state stating the chain was **never recorded** — not skipped stages and not pending work (BR-14, D-24)  |
| A Conditional step was not materialised | **Nothing at all.** No row exists to render in a skipped or cancelled state; the chain is simply shorter (BR-10) |

RPT-003 **renders from a single `project_view` call** (SPEC-01 BR-22) and issues no call of its own —
the same contract SPEC-04 BR-32 gives RPT-002 and SPEC-05 BR-30 gives RPT-001 (BR-01).

### 3.2 RPT-004 — Registers [Report]

#### Sections — three, and what each holds

| #   | Section           | Holds                                                                                                                                                                                  |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Defect table      | Every Defect in the Workspace: ID, `severity`, `status`, a resolving **`Scope`**, `title`, `resolution`; `description` on expansion (BR-19, BR-20)                                     |
| 2   | Decision list     | Every Decision in the Workspace: `decision`, `rationale`, target and `decidedAt`. **`context` and `options` are not rendered** (BR-23)                                                 |
| 3   | Activity timeline | Every Activity row in the Workspace, one shape for all sixteen kinds: `occurredAt`, `kind`, `actor`, `target`, and a **machine / human** label. `payload` on expansion (BR-26 … BR-30) |

**`TestRun` does not appear.** It is written-only in slice 1 and surfaces as RPT-001's gate tile
(D-19, SPEC-05 BR-24). RPT-004 is **one object, not three** (BA-001 §8).

#### Aggregation logic

| Section | Rule                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 2, 3 | All three registers are **workspace-scoped**, matching `project_view`'s own signature. The deciding argument: RPT-001's health already reads open Defects workspace-wide, because D-71's roll-up terminates at the Workspace — so an Initiative-scoped Defect table would let the header read NeedsAttention on a Defect the register **on the same page** does not show (BR-18) |
| 1       | **`Scope` resolves to whichever link is present** — `{workspace-slug}/{story-id}` for a Milestone (D-45, the form SPEC-05 BR-29 uses), the Initiative's `name` otherwise. SPEC-03 BR-21 guarantees at least one is present, so no cell is blank (BR-20)                                                                                                                          |
| 1       | `resolution` renders **only on a Closed Defect**. SPEC-03 BR-23 nulls it on an Open one in **both directions**, so the empty cell is structural rather than missing (BR-21)                                                                                                                                                                                                      |
| 1       | Order: **Open before Closed**, then `severity` descending — Critical, High, Medium, Low (SPEC-01 BR-18) — then by ID (BR-22)                                                                                                                                                                                                                                                     |
| 2       | A **null `rationale` renders explicit "not recorded" text**, so "the source captured no reason" is distinguishable from "the reason is missing from this screen". Never invent a value; never leave the absence ambiguous (BR-24, D-75's principle)                                                                                                                              |
| 2       | Order: `decidedAt` descending, then by ID. **All five seeded rows tie at 2026-07-10**, which is why the secondary key is stated rather than assumed (BR-25)                                                                                                                                                                                                                      |
| 3       | Order: **`occurredAt` descending — never `createdAt`.** SPEC-03 BR-28 stamps the checkpoint row at 2026-07-10 while the `migration` row is stamped at load time, so `createdAt` would misorder the only two day-one rows (BR-26, BR-27)                                                                                                                                          |
| 3       | **One row shape for all sixteen kinds** (BR-28), which is what keeps BA-001 §11 row 07's "one display pattern at trivial volume" literally true. **`payload` renders only on expansion and no summary is derived from it** — the `checkpoint` row's multi-paragraph verbatim prose (SPEC-03 BR-28) is the case this handles (BR-29)                                              |
| 3       | The **machine / human** label is derived from **`actor`**: `migration` and any agent identity are machine, `sandro` is human (D-41, D-63, D-74). It **never reads `kind`** — `sprintPlanned` has both a verb writer and a Form writer, so a kind-based split would misfile one of them (BR-30, BR-31)                                                                            |
| 3       | The timeline shows **what happened, never what was prevented**. A rejected verb call leaves no row at all (BR-34, SPEC-01 BR-05, D-42)                                                                                                                                                                                                                                           |

**The sixteen kinds** (BR-32). Eight already exist; the nine write verbs map onto eight new values,
`plan_sprint` reusing the kind FRM-002 also writes.

| Write verb         | `Activity.kind`    |
| ------------------ | ------------------ |
| `start_stage`      | `stageStarted`     |
| `complete_stage`   | `stageCompleted`   |
| `complete_subtask` | `subtaskCompleted` |
| `reopen_stage`     | `stageReopened`    |
| `log_defect`       | `defectLogged`     |
| `resolve_defect`   | `defectResolved`   |
| `record_decision`  | `decisionRecorded` |
| `record_test_run`  | `testRunRecorded`  |
| `plan_sprint`      | `sprintPlanned` ¹  |

¹ Shared with FRM-002's Plan Sprint mode (SPEC-06 BR-23) — the collision BR-31's actor-based split
exists to survive.

#### Day one

**4 Defects** — all with `story` null, all linked to an Initiative (SPEC-03 BR-21), so every Scope
cell resolves to an Initiative name. **5 Decisions** — all on the W1-S2 Initiative, all with
`context` and `options` null, and **exactly one** with a null `rationale` (SPEC-03 BR-24).
**2 Activity rows** — both written by the migration under actor `migration`, so **both land in the
machine half and the seed exercises the human half not at all** (SPEC-03 BR-04). FUT-014 builds the
human row it needs rather than assuming one.

#### Filters and sorting

**None in slice 1** (BR-33). At 4, 5 and 2 rows a filter control tests nothing (D-22), and
interaction is Information Architecture's (BR-03, D-21).

#### Drill-down

Each Defect row identifies its target through the `Scope` column, each Decision through its target,
and each Activity row through `target` — the values a navigation target needs. **The interaction
itself is the Information Architecture stage's** (BR-03, D-21).

#### Empty states

**No register empty state is specified, because none is reachable in slice 1.** The migration writes
4 Defects, 5 Decisions and 2 Activity rows before any user opens the page, and nothing deletes any of
them — D-50's invariant extends: no verb deletes a Defect, a Decision or an Activity row.
Specifying an untestable empty state is what D-22 refuses.

**Contrast RPT-003 deliberately:** its empty state is not merely reachable, it is the **normal case**,
on eleven of twelve Milestones (BR-14). The two Reports in one spec land on opposite sides of the
same principle (D-89).

RPT-004 **renders from a single `project_view` call** (SPEC-01 BR-22) and issues no call of its own —
the same contract SPEC-04 BR-32 gives RPT-002 and SPEC-05 BR-30 gives RPT-001 (BR-01).

---

## 4. Business Rules

**Cross-cutting**

- **BR-01** RPT-003 and RPT-004 each render from a **single `project_view` call** (SPEC-01 BR-22) and issue no call of their own — the contract SPEC-04 BR-32 gives RPT-002 and SPEC-05 BR-30 gives RPT-001.
- **BR-02** Neither Report writes anything, and neither emits an Activity event. `project_view` is a read verb and read verbs emit nothing (SPEC-01 §3.1, SPEC-01 BR-04).
- **BR-03** ~~Layout, chart type, section arrangement, navigation and interaction are the **Information Architecture stage's** (D-21).~~ **All five are answered, across two stages.** Navigation and interaction at Information Architecture, 2026-08-06 — RPT-004's Defect Scope cell links to RPT-003 when Scope resolves to a story, the Decision list and Activity timeline carry **no** outbound links, and RPT-003's story selector is an in-page control reflected in the `story` route parameter (D-137, [IA-001](../INFORMATION_ARCHITECTURE.md) §6.2, §6.3). Layout, section arrangement and **chart type** at Design System, 2026-08-06 — RPT-003 is section 2 and RPT-004 section 3 of one `sap.uxap.ObjectPageLayout` (D-148), and **there is no chart: none is specified in any spec and none is adopted** (D-150, [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) §11). **This spec still specifies content and ordering only** — that clause is unchanged.

**Chain — RPT-003**

- **BR-04** `project_view` returns the chain of **every Milestone in the workspace**, not one story's.
- **BR-05** RPT-003 renders **one Milestone's chain at a time**, defaulting to the story `next_action()` resolves to (SPEC-04 BR-09), so mid-build it agrees with RPT-002. Selecting another story is an interaction and falls under BR-03.
- **BR-05a** `next_action()` **returns null when no Milestone holds an incomplete Task** — SPEC-04 BR-15's fourth state, a success and not an error. RPT-003 then defaults to the Milestone with the highest `Initiative.position`, then the highest `Milestone.position` (SPEC-04 BR-34's ordering, read descending), which is the newest story. The Report is never left with no story selected.
- **BR-06** A **Task row** carries `position`, the step's `name`, `description` and `kind`, the Task's `status`, `startedAt` and `completedAt`, and the step's `driver`. The `description` exists precisely because D-56 (5) funded it so RPT-003 would not render nine slug codes.
- **BR-07** Task status renders **Not Started / In Progress / Complete**; Subtask status renders **Not Started / Complete** (SPEC-02 BR-16).
- **BR-08** Subtask rows nest under the **`sprint-build` Task only**. No other stage carries a Subtask (D-49, SPEC-02 BR-02).
- **BR-09** A **Subtask row** carries `position`, the step's `name` and `description`, and its `status`. It carries **no `driver` and no `requiresHuman`** — SPEC-02 §3.1's subtask step table declares neither column, so RPT-003 structurally cannot show a command per subtask.
- **BR-10** A Conditional step whose predicate failed **has no row**. The chain is shorter and nothing renders as skipped or cancelled (SPEC-02 BR-12).
- **BR-11** The chain header states the story ID, `fricewType`, the Milestone's `description`, `shipsUi` and the **materialised Task count**, so a chain of 8 is self-explaining rather than reading as data loss.
- **BR-12** A **Recommended** step is rendered distinguishably from a Required one, because it never blocks (SPEC-02 BR-15).
- **BR-13** Rows order by `position` **ascending** at both levels.
- **BR-14** A Milestone with **zero Tasks** renders an empty state stating the chain was **never recorded**. It must not read as skipped stages or as pending work (D-24, SPEC-03 BR-19).
- **BR-15** RPT-003 reads `Task.status` **alone** and renders **no prior completion** (D-57). "And when" is answered by the `completedAt` of the current completion.
- **BR-16** RPT-003 renders Subtasks; **RPT-002 deliberately does not** (SPEC-04 BR-23). That is what keeps BA-001 §8's "distinct consumer" claim true rather than aspirational.
- **BR-17** The chain header renders **no derived `Milestone.status`**. On the eleven chainless Milestones SPEC-02 BR-17's derivation is **vacuously true over an empty Task set** (D-64), so it would return **Done** as a computed claim rather than as a recorded fact.

**Registers — RPT-004**

- **BR-18** All three registers are **workspace-scoped**, matching `project_view`'s own signature. RPT-001's health reads open Defects workspace-wide because D-71's roll-up terminates at the Workspace, so an Initiative-scoped Defect table would let the header read NeedsAttention on a Defect the register on the same page does not show.
- **BR-19** The Defect table renders every Defect in the Workspace.
- **BR-20** Defect table columns are ID, `severity`, `status`, **`Scope`**, `title`, `resolution`. **`Scope` resolves to whichever link is present** — `{workspace-slug}/{story-id}` for a Milestone (D-45, the form SPEC-05 BR-29 uses), the Initiative's `name` otherwise. SPEC-03 BR-21 guarantees at least one is present, so no cell is blank. **`description` renders on expansion**, the same treatment BR-29 gives `payload`: SPEC-03 BR-22 preserves it verbatim and SPEC-03 BR-23 folds the Open Defect's product fork _into_ it, so the only actionable row in the register carries its content there rather than in `title` or `resolution`.
- **BR-21** `resolution` renders **only on a Closed Defect**. SPEC-03 BR-23 nulls it on an Open one in **both directions**, so the empty cell is structural rather than missing.
- **BR-22** Defects order **Open before Closed**, then `severity` descending — Critical, High, Medium, Low (SPEC-01 BR-18) — then by ID.
- **BR-23** The Decision list renders `decision`, `rationale`, target and `decidedAt`. **`context` and `options` are not rendered in slice 1**: both are null on every seeded row (SPEC-03 BR-24), so they would be fields empty for every row that exists. They stay in the entity for post-cutover `record_decision` calls (SPEC-01 BR-20).
- **BR-24** A **null `rationale` renders explicit "not recorded" text**, distinguishing "the source captured no reason" from "the reason is missing from this screen". No value is ever invented and the absence is never left ambiguous.
- **BR-25** Decisions order by `decidedAt` **descending**, then by ID. All five seeded rows tie at 2026-07-10, which is why the secondary key is stated.
- **BR-26** The Activity timeline renders **every Activity row in the Workspace**, ordered by `occurredAt` **descending**.
- **BR-27** **`occurredAt` is the sort key, never `createdAt`.** SPEC-03 BR-28 stamps the checkpoint row at 2026-07-10 while the `migration` row is stamped at load time, so a `createdAt` sort would misorder the only two rows that exist on day one.
- **BR-28** **One row shape for all sixteen kinds**: every row renders `occurredAt`, `kind`, `actor` and `target`. This is what keeps BA-001 §11 row 07's "one display pattern at trivial volume" literally true.
- **BR-29** **`payload` renders only on expansion, and no summary is derived from it.** The `checkpoint` row's multi-paragraph verbatim prose (SPEC-03 BR-28) is the case this handles.
- **BR-30** Each row is labelled **machine or human**, derived from **`actor`**: `migration` and any agent identity are machine, `sandro` is human (D-41, D-63, D-74).
- **BR-31** The machine/human split reads **`actor`, never `kind`** — `sprintPlanned` has both a verb writer and a Form writer, so a kind-based split would misfile one of them.
- **BR-32** `Activity.kind` admits **sixteen** values: the eight already required, plus eight new verb-emitted kinds. The nine write verbs map to `stageStarted`, `stageCompleted`, `subtaskCompleted`, `stageReopened`, `defectLogged`, `defectResolved`, `decisionRecorded`, `testRunRecorded` and `sprintPlanned`, per §3.2's table. `plan_sprint`'s kind is shared with FRM-002 (SPEC-06 BR-23).
- **BR-33** **No filter and no sort controls on any register in slice 1.** At 4, 5 and 2 rows a control tests nothing (D-22); interaction falls under BR-03.
- **BR-34** The timeline shows **what happened, never what was prevented**. A rejected verb call leaves no row at all (SPEC-01 BR-05, D-42).
- **BR-35** **No de-duplication of timeline events.** `PRD.md:798`'s "duplicate events are shown once" is not carried into slice 1, and duplicates are structurally impossible: SPEC-01 BR-03 gives each verb exactly one event, SPEC-06 BR-23 gives FRM-002 one row per sprint rather than per story, and SPEC-03 BR-04 gives the migration two rows in total.

---

## 5. Error Handling

| Condition                                 | Response                                                      | i18n key |
| ----------------------------------------- | ------------------------------------------------------------- | -------- |
| RPT-003's underlying `project_view` fails | SPEC-01's handling; this Report adds no error path of its own | —        |
| RPT-004's underlying `project_view` fails | SPEC-01's handling; this Report adds no error path of its own | —        |

**Neither Report mints an error key of its own**, and that follows from the mechanism rather than
from taste. Both are read-only surfaces that issue no call (BR-01) and write nothing (BR-02), so
there is no rejection for a mechanism to get wrong — D-46 and D-79's general form, that the mechanism
decides whether a rule gets a named key and not the other way round. This is SPEC-05 §5's Report
precedent applied twice; no `rpt.*` key exists.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-07 resolves no open item.** OI-05 is the only one still open and it is not a workshop
question.

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity, and both objects are
pure read surfaces issuing no call, so there is no emission point to attach one to. The one
alert-shaped case — a workspace that has silently gone adverse — is served by RPT-001's health band,
which is the view's only signalling surface and is derived on read rather than pushed (D-70).

**Provisional dependencies — R1. R9 is discharged.**

- **R1** inherited from SPEC-01 … SPEC-06 (D-39), owned by the **Data Model stage**. Deadline unchanged.
- ~~**R9** inherited from SPEC-04 (D-69), owned by the **Information Architecture stage**.~~ **R9 was
  executed at the Information Architecture stage on 2026-08-06 and is `Verified` (D-140).** It changed
  no BR and no FUT here, as D-69 predicted — it decided which **origin** serves the page, not what the
  page **says**. Measurement inverted its premise: cross-origin composition fails under `cds watch` too,
  not only under `NODE_ENV=production`, because CAP's CORS middleware never sends
  `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`) while UI5's V4 model always sends
  `X-CSRF-Token`. **The serving position is one origin behind a reverse proxy (D-141)**, executed at the
  **Tech Stack** stage.

**This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Goes to                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| ~~**Rejections leave no trace** (SPEC-01 BR-05), so enforcement firing is invisible in the timeline~~ — **discharged**: BR-34 states the carve-out rather than closing it, and D-42 is not reopened (D-90)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | SPEC-01 §6 — closed             |
| ~~**RPT-003 renders three Task states and two Subtask states**, and an unmaterialised Conditional step has **no row** rather than a skipped entry~~ — **discharged** as BR-07 and BR-10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | SPEC-02 §6 — closed             |
| ~~**D-42's carve-out compounds** — every guard rejection leaves no trace, so enforcement is invisible in the timeline~~ — **discharged** as BR-34, tested by FUT-016 (D-90)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | SPEC-02 §6 — closed             |
| ~~**RPT-004 must render a sprint-scoped Defect** (no story) and a Decision with a null rationale~~ — **discharged** as BR-20's resolving `Scope` column and BR-24's explicit "not recorded" text, tested by FUT-008 and FUT-011                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | SPEC-03 §6 — closed             |
| ~~**RPT-003 renders Subtasks; RPT-002 deliberately does not**~~ — **discharged** as BR-16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | SPEC-04 §6 — closed             |
| ~~**RPT-004 renders the six Activity kinds SPEC-05 and SPEC-06 add** — `statusUpdate`, `focusChange`, `initiativeStatus`, `lesson`, `sprintPlanned`, `storyAdded`~~ — **discharged** as BR-28's single row shape over all sixteen kinds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | SPEC-05 §6, SPEC-06 §6 — closed |
| **SPEC-01 ninth amendment, two parts.** (a) §3.1's `project_view` **Returns** cell: "chain" becomes **each Milestone's chain**, so the singular no longer implies one unnamed story (BR-04, D-85). (b) The **nine verb-emitted `Activity.kind` values** are named against the write-verb table (BR-32, D-83). **D-37 §11.1's amendment trigger is called explicitly rather than left silent — this is its fifth test, and it does not fire.** The trigger is scoped to "a **guard** that cannot be stated without changing INT-001's verb signature"; (a) clarifies a return description and (b) adds an emission vocabulary, neither is a guard, and no verb gains or loses an input. This is the reading SPEC-01's seventh and eighth amendments already applied, where a signature genuinely _did_ change and the trigger still did not fire | SPEC-01 — owed                  |
| **SPEC-03 third amendment.** `Decision.decidedAt` added to §2 and seeded **2026-07-10** across all five decisions in SPEC-03 BR-24. This is **D-72's finding recurring one table over**: `TestRun` gained `executedAt` because `createdAt` read the cutover date for a run executed 2026-07-10 — same checkpoint, same date, same defect (D-92)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | SPEC-03 — owed                  |
| **SPEC-06 amendment.** SPEC-06 BR-25's clause "**a kind a verb emits**" becomes false once `plan_sprint` emits `sprintPlanned`, which FRM-002 also writes — strike that clause. SPEC-06 BR-25's positive enumeration ("may write only `sprintPlanned` and `storyAdded`") already carries the whole constraint, so nothing is lost. **SPEC-05 BR-33 does NOT break** — none of FRM-001's five kinds is verb-emitted — stated explicitly so the next reader does not go looking (D-84)                                                                                                                                                                                                                                                                                                                                                            | SPEC-06 — owed                  |
| **SPEC-05 §6 and SPEC-06 §6 wording correction.** Both claim the **kind** partition is what lets RPT-004's timeline separate its machine and human halves. It is the **`actor`** (BR-30, BR-31, D-84). Both write constraints remain valid — they stop a Form impersonating a machine event — but neither is what makes the timeline separable                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | SPEC-05, SPEC-06 — owed         |
| **SPEC-02 BR-17 and D-64 disagree on what a zero-Task Milestone derives to, and BR-17 is the reason SPEC-07 reads neither.** SPEC-02 BR-17's clauses are ordered "**Backlog** when no Task has started, In Progress when one has and not every blocking Task is Complete, **Done** when every blocking Task is Complete" — over an empty Task set the _first_ clause fires and returns **Backlog**, while D-64 reasons from the _last_ clause being vacuously true and concludes **Done**. Live on **eleven of twelve** migrated Milestones, all of which are genuinely Done. SPEC-07 BR-17 is unaffected either way — both readings are computed claims rather than recorded facts — but the derivation itself is ambiguous and the ambiguity is not this spec's to settle                                                                     | SPEC-02, Data Model — raised    |

**BA-001 corrections** — three, all **applied in this session**.

| Correction                                                                                                                                                                                                                            | Where                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| ~~§8's RPT-003 row reads "a story's **9** stage Tasks"~~ — a `shipsUi: false` story materialises **8**, which is the only chain in existence on day one; nine is the library count, not a chain's                                     | BA-001 §8:248 — done |
| ~~§9's WFL-001 row still reads "UX Test is skippable only on non-`FRM-*` stories"~~ — **that is the prefix rule D-47 overturned**. D-47 mandated corrections to two BA-001 rows; §6's ENH-001 row got its edit and this one never did | BA-001 §9:257 — done |
| **New deferral row** for `PRD.md:798`'s duplicate-event de-duplication — BA-001 never deferred it, so it was unlisted scope; duplicates are structurally impossible in slice 1 (BR-35, D-91)                                          | BA-001 §3.6 — done   |

---

## 7. Functional Unit Tests

### FUT-001: The one migrated chain renders eight Tasks and six nested Subtasks

**Covers:** RPT-003
**Preconditions:** CNV-001, CNV-002, CNV-003 and CNV-004 have run; no verb call has been made.
`financial-planner/CNV-001` holds 8 Tasks and 6 Subtasks, all Not Started (SPEC-03 BR-31).
**Steps:**

1. Call `project_view()` once and render RPT-003 for `financial-planner/CNV-001`.

**Expected Result:**

- Exactly **8 Task rows**, ordered by `position` ascending — `sprint-build` 10 … `commit` 90 with
  position 50 absent (BR-06, BR-13).
- Exactly **6 Subtask rows**, all nested under the `sprint-build` Task and under no other (BR-08, BR-13).
- Every row renders status **Not Started** (BR-07).
- Every Task row carries a non-empty step `description` and a `driver`; **no Subtask row carries a
  `driver` or a `requiresHuman`** (BR-06, BR-09).

### FUT-002: A non-materialised Conditional step has no row

**Covers:** RPT-003
**Preconditions:** FUT-001's fixture — `financial-planner/CNV-001` has `shipsUi` false (SPEC-03 BR-16).
**Steps:**

1. Render the chain and query its rows for `stepCode` `ux-test` and `stepCode` `smoke`.

**Expected Result:**

- **Zero rows** carry either code — no Task row for `ux-test`, no Subtask row for `smoke` (BR-10).
- Nothing renders as skipped, cancelled or suppressed; the chain is simply shorter (BR-10, SPEC-02 BR-12).

### FUT-003: A chainless Milestone renders the never-recorded empty state

**Covers:** RPT-003
**Preconditions:** FUT-001's fixture. Select `financial-planner/ENH-001` — one of the eleven migrated
Done Milestones, with zero Tasks and zero Subtasks (SPEC-03 BR-19).
**Steps:**

1. Render RPT-003 for that Milestone.

**Expected Result:**

- The **empty state** renders, stating the chain was **never recorded** (BR-14).
- It does **not** read as skipped stages and does **not** read as pending work (BR-14, D-24).
- Zero Task rows and zero Subtask rows are rendered.

### FUT-004: The header states `shipsUi` and the Task count, and renders no derived status

**Covers:** RPT-003
**Preconditions:** FUT-001's fixture.
**Steps:**

1. Read RPT-003's chain header for `financial-planner/CNV-001`.
2. Render RPT-003 for `financial-planner/ENH-001` — a chainless Milestone — and read **its** header.

**Expected Result:**

- Step 1's header shows the story as `financial-planner/CNV-001`, `fricewType` **Conversion**,
  `shipsUi` **false**, the Milestone's `description`, and a materialised Task count of **8** (BR-11).
- **No derived `Milestone.status` appears anywhere in either header** (BR-17).
- Step 2's header renders a materialised Task count of **0** and still no derived status — the case
  where SPEC-02 BR-17's derivation runs over an empty Task set and returns a computed claim rather
  than a recorded fact (BR-17, D-64).

### FUT-005: A Recommended step renders distinguishably and does not block

**Covers:** RPT-003
**Preconditions:** Built, not assumed. `plan_sprint` has created a story with `shipsUi` **false**, so
its chain is 8 Tasks (SPEC-02 BR-11 and SPEC-02 BR-12). Every blocking Task has been run to Complete through
`start_stage` / `complete_stage` in position order, leaving `documentation` **Not Started** —
SPEC-02 FUT-009's end state. **`human-review` was completed under identity `sandro`**, since SPEC-02
BR-23 refuses an agent on a `requiresHuman` step.
**Steps:**

1. Read the Milestone's derived status.
2. Render its chain.

**Expected Result:**

- Step 1 reads **Done** — every blocking Task is Complete and Recommended never blocks (SPEC-02 BR-15 and SPEC-02 BR-17).
- `documentation` renders **Not Started** and is marked **Recommended**, distinguishably from the
  Required rows (BR-07, BR-12).
- The header still renders no derived status, so the Done is nowhere on the screen (BR-17).

### FUT-006: A reopened stage renders In Progress with `completedAt` cleared

**Covers:** RPT-003
**Preconditions:** Built, not assumed. On `financial-planner/CNV-001`, `sprint-build` has been run
`start_stage` → `complete_stage` and is **Complete** at a known `completedAt`. `reopen_stage` requires
a Complete Task (SPEC-02 BR-27), so a fixture that reopens a Not Started one is not valid.
**Steps:**

1. Render the chain and read the `sprint-build` row.
2. Call `reopen_stage("financial-planner/CNV-001", "sprint-build", "handoff wrote the wrong branch")`.
3. Re-render and read the same row.

**Expected Result:**

- Step 1 shows status **Complete** with its `completedAt` (BR-06, BR-07).
- Step 3 shows status **In Progress**, `startedAt` at the reopen time, and `completedAt` **empty**
  (BR-06, SPEC-02 BR-28).
- **No prior completion is rendered** — the earlier `completedAt` appears nowhere on the chain
  (BR-15, D-57).
- Its 6 Subtasks are unchanged (SPEC-02 BR-28).

### FUT-007: RPT-003 renders from a single `project_view` call

**Covers:** RPT-003
**Preconditions:** FUT-001's fixture.
**Steps:**

1. Call `project_view()` **once** and render RPT-003.

**Expected Result:**

- The chain renders in full from that response — header, Task rows and Subtask rows (BR-01; SPEC-01 BR-22 and SPEC-01 FUT-015).
- **No second call is issued**, and in particular no `next_action` call of RPT-003's own (BR-01).
- The response carries **every** Milestone's chain, not only the rendered one (BR-04).

### FUT-008: The Defect table renders four sprint-scoped defects with a resolving Scope

**Covers:** RPT-004
**Preconditions:** FUT-001's fixture — 4 Defects, all with `story` **null**, each linked to its
recorded Initiative (SPEC-03 BR-20 and SPEC-03 BR-21).
**Steps:**

1. Render the Defect table.

**Expected Result:**

- **Four rows** — Defect D-001, D-002, D-003 and D-004 (BR-19).
- Every `Scope` cell shows an **Initiative name**: `W1-S2` for Defect D-001, D-002 and D-003, and
  `W1-S3` for Defect D-004 (BR-20).
- **No `Scope` cell is blank** — SPEC-03 BR-21 guarantees at least one link is present (BR-20).
- The table shows only Workspace-scoped rows and does not narrow to the Active Initiative (BR-18).

### FUT-009: An Open Defect renders no resolution; a Closed one does

**Covers:** RPT-004
**Preconditions:** FUT-008's fixture — Defect D-004 is **Open**, Defect D-001, D-002 and D-003 are
**Closed** (SPEC-03 BR-20).
**Steps:**

1. Read the `resolution` cell on each of the four rows.

**Expected Result:**

- Defect D-001, D-002 and D-003 each render a non-empty `resolution` (BR-21, SPEC-03 BR-23).
- Defect D-004's `resolution` cell is **empty**, and the emptiness is **structural** — SPEC-03 BR-23
  nulls `resolution` on an Open Defect in both directions, so no data is missing (BR-21).

### FUT-010: Open before Closed outranks severity

**Covers:** RPT-004
**Preconditions:** FUT-008's fixture — Defect D-004 is Open / Medium, Defect D-001 is Closed / High.
**Steps:**

1. Read the Defect table's row order.

**Expected Result:**

- **Defect D-004 sorts above Defect D-001** — Open before Closed is the first key and beats severity
  (BR-22).
- Within the Closed block, Defect D-001 (High) and Defect D-003 (High) sort above Defect D-002
  (Medium), and D-001 above D-003 on the ID tiebreak (BR-22).

### FUT-011: Five Decisions, exactly one explicit "not recorded" rationale

**Covers:** RPT-004
**Preconditions:** FUT-001's fixture — 5 Decisions on the W1-S2 Initiative, `context` and `options`
null throughout, exactly one with a null `rationale` (SPEC-03 BR-24, SPEC-03 FUT-008).
**Steps:**

1. Render the Decision list.

**Expected Result:**

- **Five rows**, each carrying `decision`, target and `decidedAt` **2026-07-10** (BR-23).
- The FRM-003 scope decision 2 row — "Included multi-file same-card upload" — renders explicit
  **"not recorded"** text in place of a rationale, not a blank and not an invented value (BR-24).
- The other **four** each render a non-empty rationale (BR-23).
- **No `context` and no `options` column is rendered** on any row (BR-23).

### FUT-012: The timeline orders by `occurredAt`, and `createdAt` would invert it

**Covers:** RPT-004
**Preconditions:** FUT-001's fixture — exactly two Activity rows: the `migration` row at load time
and the `checkpoint` row at `occurredAt` 2026-07-10 (SPEC-03 BR-04 and SPEC-03 BR-28). Both were
written at cutover, the `migration` row first as CNV-002's first act and the `checkpoint` row second
by CNV-003, so both carry a cutover `createdAt` and the `migration` row's is the earlier of the two.
**Steps:**

1. Render the timeline.
2. Compare its order to the order a `createdAt` descending sort would produce.

**Expected Result:**

- **Two rows**, the `migration` row (load time) **above** the `checkpoint` row (2026-07-10) (BR-26, BR-27).
- A `createdAt` descending sort **inverts** them — the `checkpoint` row was written second and so
  carries the later `createdAt`, while its `occurredAt` is twenty days earlier. That inversion is why
  `occurredAt` is the sort key (BR-27).

### FUT-013: The checkpoint row's payload renders only on expansion

**Covers:** RPT-004
**Preconditions:** FUT-012's fixture — the `checkpoint` row carries the W1-S2 checkpoint's remaining
prose verbatim as its `payload` (SPEC-03 BR-28).
**Steps:**

1. Read the collapsed `checkpoint` row.
2. Expand it.

**Expected Result:**

- Collapsed, the row renders **only** the four fields `occurredAt`, `kind`, `actor` and `target`,
  plus its machine/human label — the same shape as the `migration` row (BR-28, BR-30).
- **No summary, excerpt or first line is derived from `payload`** (BR-29).
- Expanded, the full `payload` renders verbatim (BR-29).

### FUT-014: Every row is labelled machine or human, from `actor`

**Covers:** RPT-004, FRM-001
**Preconditions:** Built, not assumed. **Both day-one rows are machine** (actor `migration`), so a
human row is added first: FRM-001 writes a narrative entry of kind `statusUpdate` under identity
**`sandro`** — one row, a permitted human kind, under the only human identity (SPEC-05 BR-32,
SPEC-05 BR-33 and SPEC-05 BR-34).
**Steps:**

1. Render the timeline.

**Expected Result:**

- **Three rows.** The `migration` and `checkpoint` rows are labelled **machine**; the `statusUpdate`
  row is labelled **human** (BR-30).
- The label is derived from `actor` — `migration` machine, `sandro` human (BR-30, D-63, D-74).
- Both day-one rows land in the machine half, which is why the human half needed a write to exist at
  all (BR-30).

### FUT-015: `sprintPlanned` from two writers lands in different halves

**Covers:** RPT-004, FRM-002
**Preconditions:** CNV-001 and CNV-002 have run. An agent calls the `plan_sprint` verb for one sprint;
Sandro plans another through FRM-002's Plan Sprint mode. Both emit kind **`sprintPlanned`**
(BR-32, SPEC-06 BR-23).
**Steps:**

1. Render the timeline and read both `sprintPlanned` rows.

**Expected Result:**

- The verb's row is labelled **machine** (agent identity, SPEC-01 BR-07); the Form's row is labelled
  **human** (actor `sandro`, SPEC-06 BR-24) (BR-30).
- **Both carry the same `kind`**, so a kind-based split would put them in the same half and misfile
  one of them (BR-31).
- Both render in the same row shape as every other kind (BR-28).

### FUT-016: A rejected verb leaves no timeline row

**Covers:** RPT-004
**Preconditions:** FUT-001's fixture. `financial-planner/CNV-001` has every Task Not Started, so
`complete_stage("financial-planner/CNV-001", "commit")` is refused by SPEC-02 BR-22's blocking-
predecessor guard.
**Steps:**

1. Record the timeline's row count.
2. Call that verb and observe the rejection.
3. Re-read the timeline.

**Expected Result:**

- The call is rejected **409**, key `wfl.stage.predecessorOpen` inside SPEC-01's `verb.stage.blocked`
  envelope (SPEC-02 BR-22).
- The row count is **unchanged** — the timeline holds no record of the attempt (BR-34, SPEC-01 BR-05, D-42).
- Nothing renders as a refused, blocked or attempted event.

### FUT-017: The registers are workspace-scoped, not Initiative-scoped

**Covers:** RPT-004
**Preconditions:** FUT-001's fixture — **W1-S3 is the Active Initiative** (SPEC-03 BR-10) and all five
Decisions target **W1-S2** (SPEC-03 BR-24).
**Steps:**

1. Render the Decision list.
2. Render the Defect table.

**Expected Result:**

- The Decision list shows **all five** W1-S2 decisions while W1-S3 is Active; an Initiative-scoped
  list would render **zero** (BR-18).
- The Defect table shows all four Defects, including the three on W1-S2 (BR-18, BR-19).
- Every register's scope matches the Workspace RPT-001 computes its health over, so the header can
  never flag a Defect a register on the same page omits (BR-18, SPEC-05 BR-18).

### FUT-018: With no incomplete Task anywhere, RPT-003 still selects a story

**Covers:** RPT-003
**Preconditions:** Built, not assumed. Every Task on `financial-planner/CNV-001` — the only chained
Milestone — has been run to Complete, so **no Milestone in the Workspace holds an incomplete Task**
and `next_action()` returns **null**, which SPEC-04 BR-15 makes a success rather than an error.
**Steps:**

1. Call `project_view()` once and render RPT-003.

**Expected Result:**

- `next_action()` returns null, so BR-05's default does not resolve (BR-05, SPEC-04 BR-15).
- RPT-003 nonetheless renders a chain: the Milestone with the highest `Initiative.position` then the
  highest `Milestone.position` (BR-05a).
- The Report is **not** blank and does **not** render BR-14's never-recorded empty state, which is a
  different condition — that story has a chain, and every row in it reads Complete (BR-05a, BR-14).

---

_SPEC-07 specifies RPT-003 and RPT-004 — the methodology chain and the three registers — per [BA-001 §11 row 07](../BUSINESS_ARCHITECTURE.md) (D-37). The chain it renders is instantiated and guarded by [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md); the rows it reads on day one are [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md)'s; the single-`project_view` contract it shares is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-22, as read by [SPEC-04](SPEC-04-NEXT-ACTION.md) and [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md); the Activity kinds it renders are written by [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md)'s and [SPEC-06](SPEC-06-SPRINT-PLANNING.md)'s Forms and by SPEC-01's verbs. **SPEC-07 resolves no OI.** **Provisional on R1** ([D-39](../DECISIONS_LOG.md)). **R9 executed and discharged** at Information Architecture ([D-140](../DECISIONS_LOG.md), [D-141](../DECISIONS_LOG.md)); BR-03's hand-off of layout, interaction and story selection is answered in [INFORMATION_ARCHITECTURE.md](../INFORMATION_ARCHITECTURE.md) (D-137)._
