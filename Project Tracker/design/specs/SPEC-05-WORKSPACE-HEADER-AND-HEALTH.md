# SPEC-05 — Workspace Header & Health

**Spec ID:** SPEC-05
**FRICEW Objects:** ENH-003 (Enhancement), RPT-001 (Report), FRM-001 (Form)
**Wave:** 2
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 … SPEC-04. ~~and **R9** (D-69), inherited from
SPEC-04 because this spec carries a Report.~~ **R9 was executed and discharged at the Information
Architecture stage, 2026-08-06 (D-140, D-141).** **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-30 | Sandro & Claude | Initial creation from the SPEC-05 workshop. Records D-70 through D-75. **OI-04 is resolved here.** Provisional on R1 (D-39) and R9 (D-69). SPEC-03 amended in-session with `TestRun.executedAt` (SPEC-03 §2 amendment 13, SPEC-03 BR-25a, SPEC-03 FUT-007).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-30 | Sandro & Claude | Two defects fixed on the writer's own review. **FUT-005's precondition was unreachable as stated** — it named CNV-002 alone and then asserted W1-S3 is NeedsAttention on **D-004**, which CNV-003 seeds (SPEC-03 BR-20); the precondition now names both, which is SPEC-03 BR-03's own execution order. §3.3's identity paragraph credited D-63 with making `sandro` the only human identity; the enumeration is **SPEC-02 §2 amendment 6** and D-63 extends it with `migration`. Three references to SPEC-03's `BR-25a` / `FUT-007` were left bare, where this spec carries a FUT-007 of its own; all now name SPEC-03.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-07-30 | Sandro & Claude | Seven further defects fixed on Sandro's review, before approval. Three substantive. **§3.2 claimed more than one Active Initiative is unreachable in slice 1 and its own FUT-005 disproves it** — `plan_sprint` creates W1-S4 while W1-S3 is still open (SPEC-04 FUT-006's fixture too) and D-62 gave the Initiative no Planned state to land in; BR-20 now names the tiebreak, the Active Initiative with the highest `position` (SPEC-04 BR-34). **FUT-014 and §5 rejected a `migration` narrative kind with `ASSERT_ENUM` / `verb.value.notInCodeList`, which cannot fire** — `migration` is a valid `Activity.kind` (SPEC-03 §2 amendment 9), so the payload is well-formed and the rule broken is BR-33's partition; new key `frm.activity.kindNotPermitted`. **BR-32 gains the rejected-write guarantee** — SPEC-01 BR-05 binds verbs and does not reach a Form, so FUT-012's "the Initiative is unchanged" had no rule behind it. Four fixture fixes: FUT-006's and FUT-009's preconditions did not establish D-004 while asserting it, FUT-004 step 2 had no expected result, and FUT-002's `resolve_defect` supplied no resolution, which SPEC-01 BR-19 rejects. |
| 2026-07-30 | Sandro          | Status → Approved. All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on **R1 and R9** for build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-30 | Sandro & Claude | §6's cross-spec row to **SPEC-09** struck through as discharged (D-105). `record_test_run` gained an explicit `executedAt` input as SPEC-01's eleventh amendment, and the ongoing run's value is Jest's own `startTime` rather than the write time — so BR-24's ordering never falls back to `createdAt`. **§2 amendment 1 is corrected with it: `executedAt` becomes not null.** Nullable was the right call when written, because the only writer then was the migration and the verb had no input to carry it; both writers now supply one, so the constraint is honest and a missing value surfaces as `ASSERT_NOT_NULL` verbatim rather than as a named key (D-46). No rule, algorithm or FUT changes — **FUT-008 step 1 already called the verb with "`executedAt` now"**, which is what made the missing input visible. Status stays **Approved**.                                                                                                                                                                                                                                                                                                                 |
| 2026-07-30 | Sandro & Claude | §6's cross-spec row to SPEC-07 struck through as discharged, with one correction (D-84): it claimed the **kind** partition is what lets RPT-004's timeline separate its machine and human halves, and it is **`actor`**. SPEC-07 named nine verb-emitted kinds (D-83), one of which — `sprintPlanned` — FRM-002 also writes, so kind cannot distinguish the halves. **BR-33 is unamended** and remains valid as a write constraint; none of FRM-001's five kinds is verb-emitted. Status stays **Approved**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-08-06 | Sandro & Claude | **R9 executed and discharged** at the Information Architecture stage (D-140, D-141) — provisional on **R1 alone**. §3's deferred "Layout, navigation, Fiori Elements vs freestyle" is answered: FRM-001 is confirmed **inline** (D-139), layout and routing are D-137, and build technology is ruled a deferral-with-deadline to Design System (D-138). RPT-001 health reason items gain click navigation to RPT-003 **when the target is a Milestone**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-08-06 | Sandro & Claude | **§3.3's deferred "Layout, navigation, Fiori Elements vs freestyle" is discharged in full.** Layout and navigation at Information Architecture (D-137, D-139); **build technology at Design System — Fiori Elements FPM, draft enablement OFF** (D-144). RPT-001 is the page header of one `sap.uxap.ObjectPageLayout` (D-148); FRM-001's fields render as `sap.fe.macros.Field` inline, and **two of its three actions open a small dialog** for fields the header does not display — a control choice inside D-139's inline ruling, not a change to it. No business rule and no FUT changes. Status stays **Approved**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

---

## 1. Overview

The workspace header, the health it displays and the human write surface behind it. ENH-003 derives
health from three inputs the module actually owns — open Defects, the most recent TestRun on live
work, and a stage stalled In Progress — rolls it up Milestone → Initiative → Workspace by
worst-child-wins, and carries its reasoning as part of the same computation (D-70, D-71). RPT-001
renders that, Current Focus, the current Initiative's status, and a gate tile that always names the
run it is showing. FRM-001 is the only human write path: Current Focus, the Initiative's transition to
Complete with its merge commit and tag, and the manual half of the Activity timeline (D-74).

Health is **derived on read and stored nowhere** — which is forced, not preferred: stalled activity
makes health a function of `now`, and this module schedules nothing
(`Project Tracker/CLAUDE.md`), so a stored value would have no recompute trigger.

**OI-04 is resolved here** (D-70), and §6 records how.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity              | Role in this spec                                        | Attributes this spec requires                                                                                                                                    |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workspace**       | The roll-up root and RPT-001's subject                   | `slug`, `name`, `currentFocus` (nullable, SPEC-03 amendment 4). **No `status` attribute** (D-75)                                                                 |
| **Initiative**      | Supplies RPT-001's status line; FRM-001 transitions it   | `name`, `status`, `mergeCommit`, `tag`, `position` — all already required by SPEC-03                                                                             |
| **Milestone**       | A roll-up node                                           | Its Tasks and its Defects. **`status` is deliberately not read** (BR-06)                                                                                         |
| **Task**            | The stalled signal, and the TestRun's liveness test      | `stepCode`, `status`, `startedAt`                                                                                                                                |
| **MethodologyStep** | Supplies `kind`, so BR-05's "blocking" test is available | `kind`, `position`                                                                                                                                               |
| **Defect**          | The primary health input                                 | `severity`, `status`, plus its links to Milestone (nullable) and Initiative (nullable), SPEC-03 amendment 6                                                      |
| **TestRun**         | The gate tile's source, and a health input               | `total`, `passed`, `failed`, `linesPct`, `branchesPct`, **`executedAt`** (new), plus its links to Task (nullable) and Initiative (nullable), SPEC-03 amendment 7 |
| **Activity**        | FRM-001's emissions, and the stalled signal's clock      | `kind`, `actor`, `target`, `payload`, `occurredAt`                                                                                                               |

**Everything else is already required by SPEC-01 … SPEC-04; the Data Model stage should not
double-count. This spec adds exactly one attribute and one code list.**

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | New on `TestRun`: **`executedAt`** — DateTime, ~~nullable~~ **not null** (corrected at the SPEC-09 workshop, D-105). When the run actually executed, as distinct from `createdAt`, which on the migrated run reads the cutover date for a run executed 2026-07-10. This is **SPEC-03 BR-28's own treatment of the checkpoint Activity applied to the TestRun from the same source file** — same checkpoint, opposite treatment, which is the inconsistency this closes (D-72). **Amends SPEC-03**: CNV-003 sets `executedAt` = 2026-07-10 on the seeded run. **Nullable was correct when written and is not now**: the only writer then was the migration, and `record_test_run` carried no input for it — SPEC-01 BR-20b supplies one, so no writer can omit it and the constraint is honest (SPEC-01 §2 amendment 4). |
| 2   | New code list: **`HealthState`** ∈ {`Healthy`, `NeedsAttention`, `Struggling`} (D-70). Three of the PRD's four bands; **`Thriving` is excluded** because no slice-1 input can produce it, on D-22's principle that an unreachable value is specification without a test.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3   | **`Activity.kind` gains four values** — `statusUpdate`, `focusChange`, `initiativeStatus`, `lesson` — joining `checkpoint` and `migration`. **Extends SPEC-03 amendment 9.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 4   | **No health attribute exists on any entity.** Health is computed at read time and is never persisted (BR-02). Recorded as an amendment because "no column" is a Data Model instruction, not an omission.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 5   | **`Initiative.mergeCommit` and `Initiative.tag` become mandatory when `status` is Complete** — a cross-field constraint (`@assert`), not a new attribute. Both already exist per SPEC-03 amendment 1. This is what makes D-62's "Complete means merged and tagged" structural (BR-27).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6   | **A note, not an attribute — the module carries two code-list casing conventions.** `Task.status`, `Initiative.status`, `Defect.severity` and `Milestone.fricewType` (D-60) are Title/PascalCase; `Activity.kind`'s seeded values `checkpoint` and `migration` are lowercase. This spec follows each where it already stands — `HealthState` PascalCase, the new Activity kinds camelCase — and flags the divergence for the Data Model stage to settle once rather than per spec.                                                                                                                                                                                                                                                                                                                                      |

---

## 3. Functional Description

### 3.1 ENH-003 — Calculated Health [Enhancement]

#### Inputs

| Input                                                                                                         | Source                                          |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Open Defects with `severity`, and the Milestone or Initiative each links to                                   | CNV-003's seed and `log_defect` (SPEC-03 BR-21) |
| The most recent TestRun linked to a Task, where that Task's Milestone still holds an incomplete blocking Task | `record_test_run` (SPEC-01 §3.1)                |
| Every Task's `status` and `startedAt`, and the most recent Activity `occurredAt` against each                 | SPEC-02, D-42                                   |
| Each Task's step `kind`, to apply SPEC-02 BR-15's blocking test                                               | CNV-001's seeded library                        |
| The current time, for the stall threshold                                                                     | The caller's clock                              |

**`Milestone.status` and `Initiative.status` are NOT inputs** (BR-06).

#### Outputs

For every node — each Milestone, each Initiative and the Workspace — a `HealthState` and a reason
list. Nothing is written; no Activity event is emitted (BR-03).

#### Algorithm

1. **Signal each Milestone from its own rows.** `Struggling` if it carries an Open Defect of severity
   Critical or High, or if its live TestRun has `failed` > 0. `NeedsAttention` if it carries an Open
   Defect of severity Medium or Low, or if it holds a stalled Task. `Healthy` otherwise. Worst signal
   wins within a node (BR-07, BR-08, BR-09, BR-10).
2. **A Task is stalled** when its status is In Progress and the most recent Activity against it is
   older than the threshold (BR-11).
3. **A TestRun is live for health** when it links to a Task and that Task's Milestone still holds at
   least one incomplete blocking Task — computed from Tasks alone, exactly as SPEC-04 BR-05 computes
   its tiers (BR-12). The seeded run has a null Task link and can never be live (BR-13).
4. **Signal each Initiative** from its own Open Defects by the same severity mapping, then take the
   worst of that and its Milestones' states (BR-14).
5. **The Workspace** is the worst of its own Open Defects' signal and its Initiatives' states (BR-14).
6. **Assemble the reason** with the band, at every level (BR-15, BR-16).

#### Reason shape

A reason is a list of items, each carrying the signal that produced it (`openDefect`, `gateFailed`,
`stalled`), the target it was found on, and a one-line detail. A parent's reason names **the child
that set its band and that child's own reason**, so the chain is walkable from the header down to the
row. `Healthy` carries an **empty** reason list — the absence of an adverse signal is the reason, and
inventing prose for it would be filler.

#### Worked example — real slice-1 numbers, day one

| Node                          | Rows it holds                                                                                                            | Band               | Reason                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------- |
| W1-S1                         | Complete; 3 Done Milestones; no Open Defect, no live TestRun, no Task at all                                             | **Healthy**        | empty                                     |
| W1-S2                         | Complete; 5 Done Milestones; 3 **Closed** Defects (D-001, D-002, D-003); the seeded TestRun (never live, null Task link) | **Healthy**        | empty                                     |
| W1-S3                         | Active; 4 Milestones. **D-004 is Open, Medium, and links to the W1-S3 Initiative, not to a story** (SPEC-03 BR-21)       | **NeedsAttention** | `openDefect` on W1-S3 — D-004 (Medium)    |
| `financial-planner/CNV-001`   | 8 Not Started Tasks — none In Progress, so nothing is stalled — and no Defect links to it                                | **Healthy**        | empty                                     |
| Workspace `financial-planner` | Worst of its Initiatives                                                                                                 | **NeedsAttention** | "1 open defect on W1-S3 — D-004 (Medium)" |

**The finding this exposes:** the seeded defects attach at **Initiative** level, so the roll-up had to
admit a Defect at **two** levels. That is a direct consequence of D-61 / SPEC-03 BR-21 and it surfaces
nowhere else.

#### Second worked example — after the first stage runs

`start_stage("financial-planner/CNV-001", "sprint-build")`: the Task goes In Progress with a fresh
Activity, so nothing is stalled and health is unchanged at **NeedsAttention**. Eight days later, with
no further Activity against that Task, the Milestone signals **NeedsAttention** on the stall as well —
and **the Workspace's health changed with no write having occurred**, which is why BR-02 makes it
derived (D-70).

#### Carve-outs

| Carve-out                                                     | Reason                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No manual health assessment beside calculated** (BA-001 §6) | BA-001 §3.6's trigger **was tested and did not fire** — three inputs computed from rows that exist is not the thin landing that clause anticipated, so the carve-out stands and manual health stays deferred.                                                                                                                                        |
| **No configurable roll-up weights**                           | `PRD.md:828`'s Critical/High/Normal/Low/Excluded is variation with exactly one configuration — D-22's stated prohibition, the same argument that refused the Type system (BR-17).                                                                                                                                                                    |
| **Roll-up terminates at the Workspace**                       | Area and Engagement health are out of scope by BA-001 §6's own wording ("rolls child health up the hierarchy **to the Workspace**"), and unlike the levels below it, no slice-1 verb or Form creates a second Area, Engagement or Workspace (D-58, BA-001 §7's FRM-001 carve-out) — so above the Workspace there is nothing to test against (BR-18). |
| **Coverage is not a health input**                            | `TestRun` carries `linesPct` and `branchesPct`, but this module holds no coverage threshold to compare them against; the 85/80 targets live in `Financial Planner/CLAUDE.md`, and reading another module's standard is the cross-module coupling D-29 exists to prevent. Health reads `failed` only (BR-19).                                         |
| **No health history and no trend**                            | Nothing is stored, so there is nothing to trend. The Activity log already records what changed.                                                                                                                                                                                                                                                      |

### 3.2 RPT-001 — Workspace Header [Report]

#### Sections — four, and what each holds

| #   | Section           | Holds                                                                                                                                                                                                                |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Status            | The **current Initiative's** name and status — `W1-S3 — Transaction Processing · Active`. The current one is the Active Initiative with the highest `position`. Not a Workspace attribute; none exists (BR-20, D-75) |
| 2   | Current Focus     | `Workspace.currentFocus`, with the date of its last change read from the most recent `focusChange` Activity. **Empty state on day one** — SPEC-03 BR-08 loads it null (BR-21, BR-22)                                 |
| 3   | Calculated health | ENH-003's Workspace band and its reason chain (BR-23)                                                                                                                                                                |
| 4   | Gate tile         | The most recent TestRun in the Workspace, **always labelled with the Initiative it describes and its `executedAt`** (BR-24, BR-25)                                                                                   |

#### Aggregation logic

| Section | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | The Active Initiative carrying the **highest `position`**; with none Active, the section renders its empty state. **More than one Active Initiative is reachable and is not an error** — `plan_sprint` creates W1-S4 while W1-S3 is still open, which is FUT-005's own fixture and SPEC-04 FUT-006's, and D-62 gave the Initiative no Planned state to land in. `position` is the tiebreak because SPEC-04 BR-34 sets a new Initiative's to the Workspace maximum + 10, so highest is newest (BR-20) |
| 3       | **No second computation** — the header renders whatever ENH-003 returns for the Workspace node (BR-23)                                                                                                                                                                                                                                                                                                                                                                                               |
| 4       | **Most recent by `executedAt`, across both link shapes.** A Task-linked run reaches the Workspace through Milestone → Initiative → Workspace; an Initiative-linked run reaches it directly (BR-24)                                                                                                                                                                                                                                                                                                   |
| 4       | **The tile and health deliberately read different runs.** The tile shows the most recent run of any shape; health reads only a **live** one (BR-13). On day one the tile shows a passed run while health reads NeedsAttention, and that is not a contradiction: the tile reports what was last tested, health reports what is wrong now. **Both are legible only because the tile names its run** (BR-25)                                                                                            |

#### Day one

Status reads `W1-S3 — Transaction Processing · Active`. Current Focus renders its empty state. Health
reads **NeedsAttention** on D-004. The gate tile shows **174/174 passed, 98.71% lines, 89.37%
branches, W1-S2, executed 2026-07-10** — a sprint that closed before cutover, and the label is what
stops that reading as current.

#### Filters and sorting

**None in slice 1** (BR-28). A header is not a list.

#### Drill-down

Every reason item identifies its target as `{workspace-slug}/{story-id}` for a Milestone, or by
Initiative name, which is what a navigation target needs. **The interaction itself is the Information
Architecture stage's** (BR-29, D-21).

#### Empty states

| Condition              | Renders                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| No Active Initiative   | Section 1's empty state; no status value is invented (BR-20, D-75)     |
| `currentFocus` is null | Section 2's empty state rather than a blank — the day-one case (BR-22) |
| No TestRun at all      | Section 4's empty state rather than a zeroed tile (BR-26)              |

RPT-001 **renders from a single `project_view` call** (SPEC-01 BR-22) and issues no call of its own —
the same contract SPEC-04 BR-32 gives RPT-002 (BR-30).

### 3.3 FRM-001 — Workspace Header Editor [Form]

#### Field list

| Field             | Type                                         | Required                         | Validation                                                                               |
| ----------------- | -------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| Current Focus     | Text, multi-line                             | No — may be cleared back to null | Non-empty when supplied; clearing is a legal edit                                        |
| Initiative        | The Workspace's Active Initiative            | —                                | Read-only target of the transition                                                       |
| Initiative status | Code list {Active, Complete}                 | Yes                              | Only Active → Complete is offered; nothing un-completes an Initiative in slice 1 (BR-31) |
| Merge commit      | Text                                         | **Yes when status → Complete**   | Non-empty (BR-27)                                                                        |
| Tag               | Text                                         | **Yes when status → Complete**   | Non-empty (BR-27)                                                                        |
| Narrative kind    | Code list {statusUpdate, checkpoint, lesson} | Yes, for a narrative entry       | Must be one of the three human narrative kinds (BR-33)                                   |
| Narrative text    | Text, multi-line                             | Yes, for a narrative entry       | Non-empty                                                                                |

#### Actions

**Save Focus · Add Narrative Entry · Complete Initiative.** Three writes, three Activity rows, one
each (BR-32).

#### Layout, navigation, Fiori Elements vs freestyle

FRM-001 is **inline on the project view** (BA-001 §7), and D-20 makes it a Form over CAP with
validation rather than a CRUD escape hatch (BR-36). ~~Whether it is built with Fiori Elements or
freestyle, how it is arranged, and what it navigates to are the **Information Architecture / Design
System stages'** call and are not decided here (D-21).~~

**All three are now answered and none of them here.** Layout and navigation were settled at
Information Architecture — FRM-001 stays **inline on RPT-001** (D-139), and RPT-001's health reason
items gain click navigation to RPT-003 when the target is a Milestone (D-137);
[IA-001](../INFORMATION_ARCHITECTURE.md) §6 carries the map. Build technology was settled at Design
System, 2026-08-06: **Fiori Elements FPM, with draft enablement OFF** (D-144). FRM-001's fields
render as `sap.fe.macros.Field` inline in the page header, and two of its three actions open a small
dialog for fields the header does not display — a control choice inside D-139's inline ruling, not a
change to it ([DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) §8.2).

#### Filters and sorting

**None.** FRM-001 edits three values and lists nothing.

#### The write contract (D-74)

- **Every FRM-001 write emits exactly one Activity row, inside the same transaction as the write**
  (BR-32). FRM-001 is a Form, not a verb, so D-42's mechanism does not literally reach it — but the
  property D-42 bought is the one that matters, and it is achieved the same way.
- **The kind space is partitioned** (BR-33). FRM-001 may write `statusUpdate`, `checkpoint`, `lesson`
  (D-25's three), `focusChange` and `initiativeStatus`. It may **never** write `migration` or any kind
  a verb emits — so a hand-typed row can never impersonate a machine event, which is what keeps
  RPT-004's combined timeline honestly separable into its two halves.
- **`checkpoint` is writable here, and that does not contradict SPEC-03 §6.** SPEC-03 rules that
  FRM-001 owns **ongoing** entries only — meaning it did not write the migrated one, not that it never
  writes the kind. W1-S3's checkpoint lands after cutover and FRM-001 is its only possible writer; no
  verb writes one.
- **Identity is `sandro`, unconditionally** (BR-34). SPEC-02 §2 amendment 6 enumerates the identities
  with `sandro` as the only human — D-63 extends that set with `migration`, not with a second human —
  and D-11 makes this a single-user system; there is no authentication, so `req.user` would resolve to
  `anonymous`, which D-41 rejects outright. Hardcoding the only identity that exists is more honest
  than stamping an unauthenticated one. **Cost, stated:** a second human user makes this a hardcode,
  and the fix is the identity mechanism D-41 already defines.

#### The Initiative-completion warning (D-73)

FRM-001 **warns and does not block** when the Initiative being completed holds Milestones with
incomplete Tasks, naming each (BR-35). This is SPEC-01 BR-11's shape — open subtasks warn rather than
reject — applied one level up, and for the same reason: SPEC-02 FUT-009's end state is a legal
Milestone that is Done with `documentation` still Not Started, so a hard block would make a legal state
unclosable.

#### Carve-out

**No hierarchy maintenance form** for Area, Engagement or Workspace (BA-001 §7). D-11 gives them
exactly one instance each and CNV-002 already creates them.

---

## 4. Business Rules

**Health — ENH-003**

- **BR-01** ENH-003 computes a `HealthState` ∈ {Healthy, NeedsAttention, Struggling} for every Milestone, every Initiative and the Workspace.
- **BR-02** Health is **derived at read time and is never stored**. No entity carries a health attribute. Stalled activity makes health a function of the current time, and this module schedules nothing, so a stored value would have no recompute trigger.
- **BR-03** ENH-003 writes nothing and emits no Activity event.
- **BR-04** Health carries a reason, computed in the same pass. A `Healthy` node's reason list is empty.
- **BR-05** A Task **blocks** exactly as SPEC-02 BR-15 defines it: Required, or Conditional-and-materialised. Recommended never blocks, and therefore never degrades health.
- **BR-06** ENH-003 never reads `Milestone.status` or `Initiative.status`. Every input is a Defect, a Task, a TestRun or an Activity row.
- **BR-07** An Open Defect of severity **Critical or High** signals **Struggling** on the node it links to.
- **BR-08** An Open Defect of severity **Medium or Low** signals **NeedsAttention** on the node it links to.
- **BR-09** A Defect signals against **whichever of a Milestone or an Initiative it links to** (SPEC-03 BR-21). A Closed Defect signals nothing.
- **BR-10** A live TestRun with `failed` > 0 signals **Struggling** on its Task's Milestone.
- **BR-11** A **stalled** Task signals **NeedsAttention** on its Milestone. A Task is stalled when its status is In Progress and the most recent Activity against it is older than the stall threshold.
- **BR-12** A TestRun is **live for health** when it links to a Task whose Milestone still holds at least one incomplete blocking Task. That test is computed from Tasks alone, the same way SPEC-04 BR-05 computes its tiers.
- **BR-13** A TestRun with a **null Task link is never live** and never reaches health. The seeded run (SPEC-03 BR-26) is of this shape permanently.
- **BR-14** Roll-up is **worst-child-wins**, Milestone → Initiative → Workspace. A parent's band is the worst of its own signals and its children's bands. Struggling outranks NeedsAttention outranks Healthy.
- **BR-15** A parent's reason names **the child that set its band, and that child's own reason**, so the chain is walkable from the Workspace down to the signalling row.
- **BR-16** The stall threshold is **7 days**, one workspace-wide constant. The reason string states the number.
- **BR-17** **No configurable roll-up weights** in slice 1 (D-22, `PRD.md:828`).
- **BR-18** Roll-up **terminates at the Workspace**. Area and Engagement carry no health.
- **BR-19** Coverage percentages are **not** health inputs — this module holds no threshold to compare them against, and reading another module's is the coupling D-29 prevents. Health reads `failed` only.

**Report — RPT-001**

- **BR-20** Section 1 renders the **current Initiative's** name and status, where the current Initiative is the **Active one carrying the highest `position`** (SPEC-04 BR-34). More than one Active Initiative is a legal state, not an error — `plan_sprint` creates the next sprint before the current one closes. There is no `Workspace.status` attribute and none is required.
- **BR-21** Section 2 renders `Workspace.currentFocus` with the date of its most recent `focusChange` Activity.
- **BR-22** Current Focus is null after the migration (SPEC-03 BR-08); the section renders an empty state rather than a blank.
- **BR-23** Section 3 renders ENH-003's Workspace band and reason chain. RPT-001 performs no computation of its own.
- **BR-24** Section 4 shows the **most recent TestRun in the Workspace by `executedAt`**, resolved across both link shapes — Task-linked through Milestone → Initiative → Workspace, and Initiative-linked directly.
- **BR-25** The gate tile **always names the Initiative its run describes and the run's `executedAt`**. A stale run is therefore legible as stale rather than read as current.
- **BR-26** A Workspace with no TestRun renders the tile's empty state.
- **BR-28** No filters and no sorting controls (a header is not a list).
- **BR-29** Every reason item identifies its target — `{workspace-slug}/{story-id}` for a Milestone, name for an Initiative (D-45). The interaction over it is the Information Architecture stage's (D-21).
- **BR-30** RPT-001 renders from a single `project_view` call (SPEC-01 BR-22) and issues no call of its own.

**Form — FRM-001**

- **BR-27** `Initiative.mergeCommit` and `Initiative.tag` are **mandatory when status becomes Complete**, and FRM-001 is their only writer. No verb writes either; CNV-002 seeds only the two historical Initiatives.
- **BR-31** FRM-001 transitions an Initiative **Active → Complete only**. Nothing un-completes an Initiative in slice 1.
- **BR-32** Every FRM-001 write emits **exactly one** Activity row, inside the same transaction as the write. A **rejected** FRM-001 write changes nothing and emits nothing, including no record of the attempt — SPEC-01 BR-05's guarantee, which binds verbs and does not reach a Form, restated here so FRM-001 carries it too.
- **BR-33** FRM-001 may write only the human Activity kinds — `statusUpdate`, `checkpoint`, `lesson`, `focusChange`, `initiativeStatus`. It can never write `migration` or a kind a verb emits.
- **BR-34** FRM-001 writes under identity **`sandro`**, unconditionally.
- **BR-35** Completing an Initiative that holds Milestones with incomplete Tasks **warns, naming each; it does not reject**.
- **BR-36** FRM-001 writes Current Focus, the Initiative transition and the narrative entry, and **nothing else**. It is not a CRUD surface (D-20).
- **BR-37** **No Initiative-status gate on any verb.** A Complete Initiative's Milestones remain fully addressable by `start_stage`, `complete_stage`, `complete_subtask` and `reopen_stage`. Complete records a git fact, not a lock. **SPEC-04 BR-04's candidate set is therefore unchanged.**

---

## 5. Error Handling

| Condition                                                                             | Response                                                  | i18n key                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------ |
| FRM-001 sets an empty Current Focus                                                   | **Succeed** — clearing is legal                           | —                                    |
| FRM-001 completes an Initiative with no `mergeCommit`                                 | Reject 400                                                | `frm.initiative.mergeCommitRequired` |
| FRM-001 completes an Initiative with no `tag`                                         | Reject 400                                                | `frm.initiative.tagRequired`         |
| FRM-001 completes an Initiative holding Milestones with incomplete Tasks              | **Succeed**, `warnings[]` names each Milestone            | `frm.initiative.incompleteWork`      |
| FRM-001 completes an Initiative already Complete                                      | Reject 409                                                | `frm.initiative.alreadyComplete`     |
| FRM-001 submits a narrative entry with an empty text                                  | Reject 400                                                | `frm.activity.textRequired`          |
| FRM-001 submits a narrative entry with a kind outside the three human narrative kinds | Reject 400, naming the three it accepts                   | `frm.activity.kindNotPermitted`      |
| RPT-001's underlying `project_view` fails                                             | SPEC-01's handling; RPT-001 adds no error path of its own | —                                    |

Every rejection above leaves the Initiative, the Workspace and the Activity log untouched (BR-32).

**The kind rejection is FRM-001's own, not a code-list assertion.** `migration` **is** a legal
`Activity.kind` (SPEC-03 §2 amendment 9), so `ASSERT_ENUM` never fires and `verb.value.notInCodeList`
would be the wrong key: the payload is well-formed and the rule it breaks is BR-33's write partition.
That is D-46's split read correctly — a CAP validation failure passes through verbatim because a
malformed payload is the caller's own bug, whereas this is a rule about who may write what, which the
Form must state itself.

**ENH-003 has no rejection of its own.** It is a pure derivation over rows that already satisfy their
own constraints, it writes nothing, and BR-02 means there is nothing to roll back. A node with no
adverse signal is `Healthy` rather than unknown, so there is no null and no error state — which is the
same choice SPEC-04 §5 made when it put the ordering guarantee in the Data Model instead of in the
resolver.

---

## 6. Open Items

| OI    | Status in this spec                                                                                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OI-04 | **RESOLVED HERE.** Calculated health computes from open Defects, the most recent live TestRun and a stalled stage; rolls up worst-child-wins to the Workspace; renders in three of the PRD's four bands; and is derived on read with its reason (D-70, D-71). |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22).                                                                                                                                                                                   |

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity, and the reason is
structural rather than a scoping choice: BR-02 makes health derived on read, so there is no emission
point to attach an alert to — a health change happens without any write occurring. The one
alert-shaped case, a workspace that has silently gone Struggling, is served by the header itself,
which is the page Sandro opens to answer that question.

**Provisional dependencies — R1. R9 is discharged.**

- **R1** inherited from SPEC-01 … SPEC-04 (D-39). The Postgres repeat is owned by the Data Model stage.
- ~~**R9** inherited from SPEC-04 (D-69), owned by the **Information Architecture stage**.~~ **R9 was
  executed at the Information Architecture stage on 2026-08-06 and is `Verified` (D-140).** It changed
  no BR and no FUT here, as D-69 predicted — it decided which **origin** serves the page, not what the
  page **says**. Its premise was inverted by measurement: cross-origin composition fails under
  `cds watch` too, not only in production, because CAP's CORS middleware never sends
  `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`) while UI5's V4 model always sends
  `X-CSRF-Token`. **The serving position is one origin behind a reverse proxy (D-141)**, executed at
  the **Tech Stack** stage.

**This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Goes to                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Initiative-status gating is answered: there is no gate (BR-37)**, so SPEC-04 BR-04's candidate set is unchanged and SPEC-04 owes no amendment. Raised by SPEC-02 §6 and again by SPEC-04 §6; recorded here so both are discharged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | SPEC-02, SPEC-04 — closed, no amendment |
| ~~**`TestRun` needs an `executedAt`**, because `createdAt` on the seeded run reads the cutover date for a run executed 2026-07-10, while SPEC-03 BR-28 stamps the checkpoint Activity from the same file at its own date~~ — **applied in-session** as SPEC-03 §2 amendment 13, SPEC-03 BR-25a and SPEC-03 FUT-007                                                                                                                                                                                                                                                                                                                                                                                                                    | SPEC-03 — applied                       |
| ~~**RPT-004 renders the Activity kinds this spec adds** — `statusUpdate`, `focusChange`, `initiativeStatus`, `lesson` — and the kind partition (BR-33) is what lets its combined timeline separate the machine half from the human half without parsing payloads~~ — **discharged at the SPEC-07 workshop.** All four render under SPEC-07 BR-28's single row shape. **The partition claim was wrong and is corrected:** what separates the halves is **`actor`**, not kind — SPEC-01's verbs emit kinds of their own (D-83) and `plan_sprint` shares `sprintPlanned` with FRM-002, so kind cannot do it (SPEC-07 BR-30, BR-31, D-84). **BR-33 itself does not break** and is unamended: none of FRM-001's five kinds is verb-emitted | SPEC-07 — closed                        |
| ~~**INT-004 must supply `executedAt`** on every `record_test_run`, or the gate tile's ordering falls back to `createdAt`~~ — **discharged at the SPEC-09 workshop.** The verb had no such input; it gains an explicit one as SPEC-01's **eleventh** amendment (SPEC-01 BR-20b, §3.1's mapping table), and the ongoing run's value is Jest's own **`startTime`**, not the write time (D-105, SPEC-09 BR-06). **Amendment 1 above is corrected with it** — `executedAt` becomes **not null**, since both writers now supply it                                                                                                                                                                                                          | SPEC-09 — applied                       |
| ~~**The exporter must carry `executedAt`** alongside `createdBy`, for the same reason SPEC-03 §6 already gives~~ — **discharged at the SPEC-11 workshop as [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) BR-03.** The two are **not the same kind of thing**, and SPEC-11 §6 states the distinction rather than folding them into one rule: `executedAt` is a plain not-null domain attribute (D-72) carried by "emit every column", while `createdBy` is CAP-managed and carried by the explicit managed-field rule. They exist as separate attributes _because_ `createdAt` reads the cutover date rather than domain truth (D-72, D-92), so the export carries both and they mean different things                                  | SPEC-11 (INT-007) — applied             |
| **The module carries two code-list casing conventions** (§2 amendment 6) — settle once at Data Model rather than per spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Data Model                              |
| **BA-001 §3.6's ENH-003 amendment trigger was tested and did not fire.** Three inputs computed from rows that exist is not the thin landing that clause anticipated, so no manual health assessment is added and the ENH-003 carve-out stands. Recorded because a tested-and-held trigger is a finding — D-55's and D-67's precedent                                                                                                                                                                                                                                                                                                                                                                                                  | BA-001 §3.6 — recorded                  |

**BA-001 corrections** — all four **applied at BA-001 v1.6**, in this session.

| Correction                                                                                                                                                                                                                                                                                                                                                                                                                   | Where                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| ~~ENH-003's claim that the PRD band vocabulary is "defined **only** for personal systems" is false — `PRD.md:1035-1037` applies the identical four values as **Area ratings**, and Area is the top of the work hierarchy~~ — corrected to say the vocabulary exists for a work-hierarchy level but is a manual monthly-review rating in a deferred cluster, which is why slice 1 inherits three of the four rather than none | BA-001 §6 — done     |
| ~~§3.6's manual-health row cites `PRD.md:822` alone; the PRD mandates showing both in **three** places — `:190-192`, `:808-811`, `:822`~~                                                                                                                                                                                                                                                                                    | BA-001 §3.6 — done   |
| ~~§3.6's manual-health row's "Where it goes" reads "Revisit at the health workshop; amends ENH-003" — the workshop has now run and the trigger did not fire; the row is resolved, not pending~~                                                                                                                                                                                                                              | BA-001 §3.6 — done   |
| ~~ENH-003's row gains what it actually computes, and RPT-001's row gains that the gate tile names the run it shows~~                                                                                                                                                                                                                                                                                                         | BA-001 §6, §8 — done |

---

## 7. Functional Unit Tests

### FUT-001: Day-one health on the migrated data

**Covers:** ENH-003
**Preconditions:** CNV-002, CNV-003 and CNV-004 have run; no verb call has been made.
**Steps:**

1. Read health for the Workspace, the three Initiatives and all twelve Milestones.

**Expected Result:**

- The Workspace is **NeedsAttention**, with a reason naming **D-004 (Medium)** on W1-S3 (BR-08, BR-09, BR-14, BR-15).
- W1-S1 and W1-S2 are **Healthy** with **empty** reasons (BR-04).
- `financial-planner/CNV-001` is **Healthy** — its 8 Tasks are Not Started, so none is In Progress and none can be stalled (BR-11).
- No node's computation read a `status` field (BR-06).

### FUT-002: Severity decides the band

**Covers:** ENH-003
**Preconditions:** FUT-001's state.
**Steps:**

1. Call `log_defect` on `financial-planner/CNV-001` at severity **High**.
2. Re-read health.
3. Call `resolve_defect` on it with a **non-empty** resolution — SPEC-01 BR-19 rejects an empty one.
4. Re-read health.

**Expected Result:**

- After step 1 the Workspace is **Struggling**, its reason naming the new defect and the Milestone (BR-07, BR-14).
- After step 3 it returns to **NeedsAttention** on D-004 alone (BR-09).

### FUT-003: A Closed defect signals nothing

**Covers:** ENH-003
**Preconditions:** FUT-001's state — D-001, D-002 and D-003 are Closed on W1-S2.
**Steps:**

1. Read W1-S2's health.

**Expected Result:**

- **Healthy**, with an **empty** reason, despite three Defects existing against it (BR-04, BR-09).

### FUT-004: A residual Recommended step does not degrade health

**Covers:** ENH-003
**Preconditions:** SPEC-02 FUT-009's end state on `financial-planner/CNV-001` — every blocking Task Complete, `documentation` Not Started; the Milestone derives Done (SPEC-02 BR-17). **`human-review` was completed under identity `sandro`, since SPEC-02 BR-23 refuses an agent.** This is the same fixture SPEC-04 FUT-004 uses.
**Steps:**

1. Read the Milestone's health.
2. Read the Workspace's health.

**Expected Result:**

- The Milestone is **Healthy** — Recommended never blocks and therefore never degrades (BR-05, BR-11).
- The Workspace is **NeedsAttention** on D-004 alone, and its reason names **no** item from this Milestone — the residual Recommended step contributed nothing to the roll-up (BR-05, BR-14, BR-15).
- The answer is identical whether the Milestone derives Done or not, because no status was read (BR-06).

### FUT-005: Roll-up is worst-child-wins across two Initiatives

**Covers:** ENH-003
**Preconditions:** CNV-002 **and CNV-003** have run — D-004 is Open on W1-S3 and the expected result below turns on it; `plan_sprint` has created W1-S4 with three stories (SPEC-04 FUT-006's fixture); `log_defect` has logged a **Critical** defect on one W1-S4 story.
**Steps:**

1. Read health at all three levels — Milestone, Initiative, Workspace.

**Expected Result:**

- That Milestone is **Struggling**; W1-S4 is **Struggling** (BR-07, BR-14).
- W1-S3 is **NeedsAttention** on D-004 (BR-08).
- The Workspace is **Struggling** (BR-14).
- The Workspace's reason names W1-S4, then the Milestone, then the Defect — **three links** (BR-15).

### FUT-006: A stalled stage degrades health, and health changed with no write

**Covers:** ENH-003
**Preconditions:** CNV-002 **and CNV-003** have run — the expected result below turns on **D-004**, which CNV-003 seeds (SPEC-03 BR-20). `financial-planner/CNV-001` has `sprint-build` **In Progress**, started by `start_stage`, whose Activity event is the most recent against that Task.
**Steps:**

1. Read health.
2. Advance the clock 8 days with no further call.
3. Re-read health.

**Expected Result:**

- Step 1 reads **NeedsAttention** on D-004 only.
- Step 3 still reads NeedsAttention, but the reason now **also** names `sprint-build` stalled 8 days, over a **7-day** threshold (BR-11, BR-16).
- **No row was written between the two reads** (BR-02, BR-03).

### FUT-007: The gate tile on day one names the run it is showing, and health does not read it

**Covers:** RPT-001, ENH-003
**Preconditions:** FUT-001's state.
**Steps:**

1. Read the gate tile.
2. Read Workspace health.

**Expected Result:**

- The tile shows **174 total, 174 passed, 0 failed, 98.71% lines, 89.37% branches** (SPEC-03 BR-25), labelled **W1-S2** and `executedAt` **2026-07-10** (SPEC-03 BR-25a) — not the load-time `createdAt` (BR-24, BR-25).
- Workspace health is **NeedsAttention** and its reason contains **no** gate item, because that run has a null Task link and can never be live (BR-13).

### FUT-008: A live failing run drives both the tile and health

**Covers:** RPT-001, ENH-003
**Preconditions:** On `financial-planner/CNV-001`, `sprint-build` and `code-quality` are **Complete** and `test-quality` is **In Progress**, reached through `start_stage` / `complete_stage` in position order — SPEC-02 BR-19 refuses `start_stage` on `test-quality` while an earlier blocking Task is open, and SPEC-02 BR-29 refuses `record_test_run` against a Not Started Task.
**Steps:**

1. Call `record_test_run` on `test-quality` with `failed` 3 and `executedAt` now.
2. Read the gate tile.
3. Read health.

**Expected Result:**

- The tile shows the **new** run, labelled **W1-S3** (BR-24, BR-25).
- The Milestone is **Struggling** (BR-10, BR-12).
- The Workspace is **Struggling** (BR-14).

### FUT-009: Coverage does not move health

**Covers:** RPT-001, ENH-003
**Preconditions:** FUT-008's fixture, with CNV-003 also run — the expected result turns on **D-004** (SPEC-03 BR-20) — but the recorded run has `failed` **0** and `linesPct` **41.0**.
**Steps:**

1. Read the gate tile.
2. Read health.

**Expected Result:**

- The tile renders the coverage figures (BR-24).
- Health carries **no** gate item (BR-19).
- The Workspace is **NeedsAttention** on D-004 alone (BR-08, BR-14).

### FUT-010: The tile's empty state

**Covers:** RPT-001
**Preconditions:** **SPEC-03 FUT-012's fixture (b)** — CNV-002 has run and CNV-003 has not, which SPEC-03 §5 states is a legal intermediate of its BR-03 execution order.
**Steps:**

1. Read the gate tile.

**Expected Result:**

- The **empty state**, not a zeroed tile (BR-26).

### FUT-011: Current Focus is empty on day one and carries its change date after a write

**Covers:** RPT-001, FRM-001
**Preconditions:** FUT-001's state.
**Steps:**

1. Read section 2.
2. Call FRM-001's **Save Focus**.
3. Re-read section 2.
4. Read the Activity log.

**Expected Result:**

- Step 1 renders the **empty state** (BR-22; SPEC-03 BR-08).
- Step 3 carries the text and the change date (BR-21).
- **Exactly one** Activity row of kind `focusChange`, actor **`sandro`** (BR-32, BR-33, BR-34).

### FUT-012: Completing an Initiative requires its git facts and warns about open work

**Covers:** FRM-001
**Preconditions:** W1-S3 **Active**; `financial-planner/CNV-001` holding 8 Not Started Tasks.
**Steps:**

1. Complete W1-S3 with no `mergeCommit`.
2. Complete it with both `mergeCommit` and `tag`.
3. Re-read the Initiative and the Activity log.

**Expected Result:**

- Step 1 is rejected **400**, key `frm.initiative.mergeCommitRequired`, and the Initiative is unchanged (BR-27).
- Step 2 **succeeds with a warning** naming `financial-planner/CNV-001`, key `frm.initiative.incompleteWork` — it does **not** reject (BR-35).
- One Activity row of kind `initiativeStatus`, actor **`sandro`** (BR-32, BR-34).

### FUT-013: A Complete Initiative does not gate its Milestones

**Covers:** FRM-001, ENH-002
**Preconditions:** FUT-012's end state — W1-S3 is **Complete** and `financial-planner/CNV-001` still holds 8 Not Started Tasks.
**Steps:**

1. Call `start_stage("financial-planner/CNV-001", "sprint-build")`.
2. Call `next_action()` with no story.

**Expected Result:**

- Step 1 **succeeds** — no guard consults Initiative status (BR-37).
- Step 2 still returns that story's `sprint-build`, so **SPEC-04 BR-04's candidate set is unchanged** (BR-37, SPEC-04 BR-04).

### FUT-014: FRM-001 cannot write a machine kind

**Covers:** FRM-001
**Preconditions:** FRM-001 reachable.
**Steps:**

1. Submit a narrative entry with kind `checkpoint`.
2. Submit one with kind `migration`.

**Expected Result:**

- Step 1 **succeeds** — `checkpoint` is a human kind, and SPEC-03 §6's "ongoing only" excludes the migrated entry, not the kind (BR-33).
- Step 2 is rejected **400**, key `frm.activity.kindNotPermitted`, its message naming the three narrative kinds (BR-33).
- The rejection is **not** `verb.value.notInCodeList` and no `ASSERT_ENUM` fires: `migration` is a valid `Activity.kind` (SPEC-03 §2 amendment 9), so the payload is well-formed and the rule broken is BR-33's partition, not the enum.
- Every row FRM-001 wrote carries actor **`sandro`** (BR-34).

---

_SPEC-05 specifies ENH-003, RPT-001 and FRM-001 — the workspace header, the health it displays and the human write surface behind it — per [BA-001 §11 row 05](../BUSINESS_ARCHITECTURE.md). **OI-04 resolves here** (D-70). The health inputs it reads are written by [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) and [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md); the day-one data it computes over is [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md); the blocking test and the single-`project_view` contract it shares are [SPEC-04](SPEC-04-NEXT-ACTION.md)'s. **Provisional on R1** ([D-39](../DECISIONS_LOG.md)). **R9 executed and discharged** at Information Architecture ([D-140](../DECISIONS_LOG.md), [D-141](../DECISIONS_LOG.md)); layout, routing, FRM-001's inline placement and navigation are settled in [INFORMATION_ARCHITECTURE.md](../INFORMATION_ARCHITECTURE.md) (D-137, D-139)._
