# SPEC-03 — Financial Planner Migration Load

**Spec ID:** SPEC-03
**FRICEW Objects:** CNV-002 (Conversion), CNV-003 (Conversion), CNV-004 (Conversion)
**Wave:** 1
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 and SPEC-02 — the validating spike ran on
in-memory SQLite only. **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-28 | Sandro & Claude | Initial creation from the SPEC-03 workshop. Records D-58 through D-65. Provisional on R1 (D-39).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-07-28 | Sandro          | Status → Approved. All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on R1 for build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-07-28 | Sandro & Claude | Amended in-session at the SPEC-04 workshop (D-67). **CNV-002 now sets `Initiative.position` and `Milestone.position`** — §2 amendment 12, §3.1's two tables, BR-14a, CNV-004's BR-33a, and FUT-001 / FUT-002. ENH-002 orders open Milestones by these and has no fallback: the twelve migrated rows share one `createdAt`. Rules are inserted as `BR-14a` / `BR-33a` rather than renumbered, because SPEC-02 and this spec's own FUTs cite BR-15 … BR-34 by number. Status stays **Approved** — the load's data is unchanged, one attribute per row is added.                       |
| 2026-07-30 | Sandro & Claude | Amended in-session at the SPEC-07 workshop (D-92) — the **third** amendment to this spec. **CNV-003's five Decisions now carry `decidedAt` 2026-07-10** — §2 amendment 14, BR-24a and FUT-008. `Decision` carried no date at all, so RPT-004's "most recent first" would have ordered five rows by CAP's `createdAt`, which is the cutover date. This is amendment 13's finding one table over, from the same source file and the same date. Rule inserted as `BR-24a` rather than renumbered, on the same reasoning as `BR-14a`, `BR-25a` and `BR-33a`. Status stays **Approved**. |
| 2026-07-30 | Sandro & Claude | Amended in-session at the SPEC-05 workshop (D-72). **CNV-003's TestRun now carries `executedAt` 2026-07-10** — §2 amendment 13, §3.2's TestRun table, BR-25a and FUT-007. `createdAt` reads the cutover date for a run executed at the checkpoint, while BR-28 already stamps the checkpoint Activity from the same file at its own date. Rule inserted as `BR-25a` rather than renumbered, because SPEC-02, SPEC-04 and this spec's own FUTs cite BR-15 … BR-34 by number. Status stays **Approved**.                                                                              |

---

## 1. Overview

The one-time load of Financial Planner's markdown project state into Project Tracker's own database
(D-29), and the tie-out that proves it landed. CNV-002 loads the hierarchy and twelve story
Milestones; CNV-003 loads the registers that genuinely exist — four defects, five decisions, one test
run and one checkpoint narrative; CNV-004 reconciles both.

The load's defining constraint is that **the eleven verbs cannot perform it** (D-58): no verb creates
a Workspace, `plan_sprint` creates Milestones in Backlog and would therefore give all twelve a chain,
`log_defect` demands a story the defect log never recorded, and `record_test_run` is structurally
blocked because SPEC-02 BR-29 refuses a Not Started target Task and W1-S2's Milestones have no Tasks
at all. The migration writes through the CAP service layer instead. Under D-54 the chain arrives with
the Milestone, so CNV-004 asserts rather than instantiates (D-59).

**This spec is provisional on R1.** Nothing here has been executed against Postgres; D-39 assigns the
repeat, together with standing up a binding neither Life OS module has, to the Data Model stage.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity                 | Role in this spec                                                      | Attributes this spec requires                                                                                                                                                                |
| ---------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Area**               | Hierarchy root                                                         | `name`                                                                                                                                                                                       |
| **Engagement**         | Hierarchy level 2                                                      | `name`                                                                                                                                                                                       |
| **Workspace**          | Addressing root; the migration's target                                | `slug`, `name`, `currentFocus` (nullable)                                                                                                                                                    |
| **Initiative**         | The three sprints                                                      | `name`, `goal` (**nullable**), `branch`, `status`, `mergeCommit` (nullable), `tag` (nullable), **`position`**                                                                                |
| **Milestone**          | The twelve stories                                                     | `storyId`, `fricewType`, `description`, `shipsUi`, **`position`**, `status` (**derived**, SPEC-02 BR-17)                                                                                     |
| **Task** / **Subtask** | Written by ENH-001 as a consequence of CNV-002's load, not by the load | `stepCode`, `status`                                                                                                                                                                         |
| **Defect**             | CNV-003's four                                                         | `severity`, `status`, `title`, `description`, `references` (nullable), `resolution` (nullable), plus links to Milestone (nullable) and Initiative (nullable)                                 |
| **Decision**           | CNV-003's five                                                         | `target`, `context` (nullable), `options` (nullable), `decision`, `rationale` (**nullable**), **`decidedAt`** (SPEC-07 §2 amendment 2, D-92)                                                 |
| **TestRun**            | CNV-003's one                                                          | `total`, `passed`, `failed`, `pending` (nullable), `durationMs` (nullable), `linesPct`, `branchesPct`, `failures`, **`executedAt`**, plus links to Task (nullable) and Initiative (nullable) |
| **Activity**           | The load's two rows                                                    | `kind`, `actor`, `target`, `payload`, `occurredAt`                                                                                                                                           |
| **MethodologyStep**    | Read only — ENH-001 reads the library at Milestone creation            | —                                                                                                                                                                                            |

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | New on `Initiative`: **`mergeCommit`** and **`tag`**, both nullable String. W1-S3 carries neither.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2   | **`Initiative.status` is written, not derived**, ∈ {Active, Complete} (D-62). FRM-001 transitions it in Wave 2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3   | **`Initiative.goal` is nullable** — W1-S1's is unrecoverable (no W1-S1 checkpoint file exists).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 4   | **`Workspace.currentFocus` is nullable** — FRM-001's to write; no markdown holds it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 5   | **A Milestone's creation status is a transient input, not a stored attribute** (D-64). SPEC-02 §3.2 lists "`Milestone.status` at creation" as an ENH-001 input; because status is derived (D-53, SPEC-02 BR-17) and BR-17's "every blocking Task is Complete" is **vacuously true over an empty set**, the derivation returns Done for a Backlog and a Done Milestone alike at the instant of creation and cannot discriminate. It cannot be a stored flag either — D-54 rejected exactly that. **Amends SPEC-02 §3.2.**                                                                             |
| 6   | **`Defect` links to a Milestone OR an Initiative**, both nullable, at least one present. All four seeded defects link to an Initiative and carry a null story.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7   | **`TestRun` links to a Task OR an Initiative**, both nullable, at least one present. `pending` and `durationMs` nullable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 8   | **`Decision.rationale` is nullable**, not only `context` and `options` — one seeded decision records none.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 9   | **`Activity.kind` admits `checkpoint` and `migration`.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 10  | **The actor identity admits a third kind — `migration`** — neither human nor agent. **Extends SPEC-02 §2 amendment 6**, which enumerates identities with `sandro` as the only human and everything else an agent.                                                                                                                                                                                                                                                                                                                                                                                    |
| 11  | **`Milestone.fricewType` code-list values are singular** — `Interface`, `Conversion`, `Enhancement`, `Form`, `Report`, `Workflow` (D-60).                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 12  | New on `Initiative` and `Milestone`: **`position`** — Integer, **not null**, gapped by 10, unique within its parent (`@assert.unique`). Required by SPEC-04's ENH-002 as the ordering tiebreak, because every migrated row shares one `createdAt` and a load of twelve rows in one instant supplies no other total order (D-67). **Added at the SPEC-04 workshop.**                                                                                                                                                                                                                                  |
| 14  | New on `Decision`: **`decidedAt`** — DateTime, **not null**. When the decision was made, as distinct from `createdAt`. Required by SPEC-07's RPT-004, which orders the Decision list by it; `createdAt` on all five seeded rows reads the cutover date for decisions made 2026-07-10 and recorded in a checkpoint that states its own date. **The identical correction amendment 13 made for `TestRun`, one table over** — a migrated row's managed timestamp is a load fact, not a domain fact (D-92). `record_decision` gains no input and stamps it at insert. **Added at the SPEC-07 workshop.** |
| 13  | New on `TestRun`: **`executedAt`** — DateTime, nullable. When the run executed, as distinct from `createdAt`. Required by SPEC-05's RPT-001, which orders the gate tile by it; `createdAt` on this seeded run reads the cutover date for a run executed 2026-07-10, while BR-28 already stamps the checkpoint Activity from the same source at its own date (D-72). **Added at the SPEC-05 workshop.**                                                                                                                                                                                               |

---

## 3. Functional Description

### 3.1 CNV-002 — Hierarchy & Story Load [Conversion]

#### Source format

`Financial Planner/project/SPRINT_BOARD.md` — three prose tables, one per sprint. Git supplies the
merge commits, tags and branches; `Financial Planner/project/sprints/W1-S2-checkpoint.md` supplies
W1-S2's goal. All re-verified against the files on 2026-07-27; the board held exactly as documented,
which is worth recording because PLAN.md §5 and BA-001 have each drifted before.

#### Transformation rules — hierarchy

Area "Personal Software" → Engagement "Life OS" → Workspace `financial-planner` / "Financial
Planner" (D-08). `currentFocus` is null on load.

CNV-002's first act is the load's own Activity row — kind `migration`, `occurredAt` at load time
(BR-04). Emitting it first rather than last means a migration that fails partway is still recorded as
having started, which is the only thing about a failed load that is true.

#### Transformation rules — the three Initiatives

| name                           | goal                                                                                                         | branch         | status   | mergeCommit | tag    | position |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------------- | -------- | ----------- | ------ | -------- |
| W1-S1 — Foundation & Seed Data | **null**                                                                                                     | `sprint/W1-S1` | Complete | `0a9804f`   | `v1.1` | 10       |
| W1-S2 — Ingestion Pipeline     | From its checkpoint — "Transactions flow from SimpleFIN and CSV into the system. Connection health visible." | `sprint/W1-S2` | Complete | `9bbe826`   | `v1.2` | 20       |
| W1-S3 — Transaction Processing | From the board — "Transactions categorized, splits supported, historical data backfilled."                   | `sprint/W1-S3` | Active   | null        | null   | 30       |

All three branches were verified present on the remote, and both SHAs verified as the
`merge(sprint):` commits. W1-S1's goal is null because no W1-S1 checkpoint file exists — the folder
holds only `.gitkeep` and `W1-S2-checkpoint.md` (D-61).

#### Transformation rules — the twelve Milestones

`description` is taken verbatim from the board row. Every story ID below is a **Financial Planner**
ID; per BA-001 §3.3 each is qualified as `financial-planner/{id}`, because Project Tracker's own
CNV-001, CNV-002, INT-001, INT-002, ENH-001 and FRM-001 are different objects.

| storyId                     | Initiative | fricewType            | shipsUi  | position | Creation status |
| --------------------------- | ---------- | --------------------- | -------- | -------- | --------------- |
| `financial-planner/CNV-002` | W1-S1      | Conversion            | false    | 10       | Done            |
| `financial-planner/CNV-003` | W1-S1      | Conversion            | false    | 20       | Done            |
| `financial-planner/FRM-009` | W1-S1      | Form                  | **true** | 30       | Done            |
| `financial-planner/INT-001` | W1-S2      | **Interface** (remap) | false    | 10       | Done            |
| `financial-planner/INT-002` | W1-S2      | **Interface** (remap) | false    | 20       | Done            |
| `financial-planner/ENH-008` | W1-S2      | Enhancement           | false    | 30       | Done            |
| `financial-planner/FRM-003` | W1-S2      | Form                  | **true** | 40       | Done            |
| `financial-planner/FRM-010` | W1-S2      | Form                  | **true** | 50       | Done            |
| `financial-planner/ENH-001` | W1-S3      | Enhancement           | false    | 10       | Done            |
| `financial-planner/ENH-009` | W1-S3      | Enhancement           | false    | 20       | Done            |
| `financial-planner/FRM-001` | W1-S3      | Form                  | **true** | 30       | Done            |
| `financial-planner/CNV-001` | W1-S3      | Conversion            | false    | 40       | **Backlog**     |

`position` is **board order within each Initiative**, gapped by 10 and restarting per Initiative —
required by SPEC-04's ENH-002, which has no other total order to fall back on because all twelve rows
share one `createdAt` (D-67). W1-S3's four are ordered as the board prints them: its three Done
stories, then `CNV-001` from the Backlog section.

Two further notes on this table:

- The `Integration` → `Interface` remap is **D-09 reaching the data**, not only `/pm-update`'s enum.
  It touches exactly two rows under D-60's singular values.
- `shipsUi`'s true set coincides exactly with `FRM-*` **on this data**. That is the coincidence D-47
  warned about when it rejected a prefix rule — recorded here so no later reader concludes the prefix
  rule would have been adequate.

#### Validation and rejection criteria

The load is rejected if the `financial-planner` Workspace already exists (BR-05), if CNV-001 has not
seeded the library (§5), or if any board row resolves to a `fricewType` outside D-60's six singular
values after remapping. A rejected load writes nothing.

#### Execution order

BA-001 §5's strict chain, **CNV-001 → CNV-002 → CNV-003 → CNV-004 → CNV-005** (BR-03). CNV-002
depends on CNV-001 because ENH-001 reads the library at Milestone creation; CNV-003 depends on
CNV-002 because its defects, decisions and TestRun all link to Initiatives. §3.2 and §3.3 inherit
this order.

#### Reconciliation approach

Delegated to CNV-004 (§3.3, D-59) — the tie-out spans this load and CNV-003's and therefore belongs
to neither alone.

**Consequence, not a step.** ENH-001 fires on creation-in-Backlog (D-54), so the load itself produces
exactly one chain — **8 Tasks and 6 Subtasks on `financial-planner/CNV-001`**, `ux-test` and `smoke`
never materialised. The other eleven Milestones get none, which is how D-15's policy becomes a
mechanism rather than a rule someone must remember.

### 3.2 CNV-003 — Register Seed [Conversion]

#### Source format

`Financial Planner/project/DEFECT_LOG.md` — a table whose columns are
`ID | Sprint | Severity | Description | Status | Resolution`; **there is no story column and no title
column**, which is what forces D-61. `Financial Planner/project/sprints/W1-S2-checkpoint.md` supplies
the decisions, the test run and the checkpoint narrative.

#### Transformation rules — four Defects

| id    | Initiative | severity | status   | resolution                     |
| ----- | ---------- | -------- | -------- | ------------------------------ |
| D-001 | W1-S2      | High     | Closed   | From the log's Resolution cell |
| D-002 | W1-S2      | Medium   | Closed   | From the log's Resolution cell |
| D-003 | W1-S2      | High     | Closed   | From the log's Resolution cell |
| D-004 | W1-S3      | Medium   | **Open** | **null**                       |

All four carry a **null story** — the source records a Sprint and nothing finer, and inferring one is
D-24's prohibition on fabricated linkage. `title` is derived from each description's leading clause;
`description` is preserved verbatim; `references` is null on seed. D-004's Resolution cell records a
product fork awaiting Sandro rather than a resolution, so it folds into `description` and
`resolution` stays null.

#### Transformation rules — five Decisions

All five target the **W1-S2 Initiative** (D-65). `context` and `options` are null throughout;
`rationale` is populated where the checkpoint records one.

| Decision                                                         | rationale |
| ---------------------------------------------------------------- | --------- |
| `db/integration` → `db/ingestion` rename                         | recorded  |
| Shared `formatAmount` extraction                                 | recorded  |
| Vendor entity brought forward                                    | recorded  |
| Multi-file same-card upload included                             | **null**  |
| Deferral of ENH-001 fuzzy pre-fill and earning-yield computation | recorded  |

The checkpoint's third narrative bullet is the same ruling as its FRM-003 scope decision 1 and says
so in its own text, so it is seeded once, not twice (D-65).

#### Transformation rules — one TestRun

Against the **W1-S2 Initiative**, with its Task link null because no Task exists to link to:

| total | passed | failed | pending | durationMs | linesPct  | branchesPct | failures | executedAt     |
| ----- | ------ | ------ | ------- | ---------- | --------- | ----------- | -------- | -------------- |
| 174   | 174    | 0      | null    | null       | **98.71** | 89.37       | empty    | **2026-07-10** |

`executedAt` is the checkpoint's own date, matching BR-28's treatment of the checkpoint Activity taken
from the same file — the load time `createdAt` records is the cutover date, not the date the run
executed (D-72, BR-25a).

**98.71 is the checkpoint's Lines row, not its Statements row (98.73).** BA-001, PLAN.md and the
workshop brief all quote 98.73% as "statements", and SPEC-01's TestRun carries `linesPct` with no
statements attribute — so seeding 98.73 would put the wrong number in the register built to be
trustworthy. Listed as a BA-001 correction in §6.

#### Transformation rules — one checkpoint Activity

One Activity row, kind `checkpoint`, `occurredAt` **2026-07-10**, `payload` the checkpoint's
remaining prose verbatim: its sprint scope note, its §3 sprint-specific checks, its §5 Definition of
Done checklist and its §6 next-sprint section — everything not already loaded as a story, defect,
decision or TestRun.

#### Validation and rejection criteria

Rejected if CNV-002 has not run (the Initiatives its rows link to do not exist), if any Defect
resolves to neither a Milestone nor an Initiative, if any TestRun resolves to neither a Task nor an
Initiative, or if an Open Defect carries a non-null resolution. See §5.

**Carve-out.** The five markdown test reports are **not** migrated (D-24). The Decision register
opens nearly empty because Financial Planner's ~313 design decisions live under `design/` and D-12
excludes them.

#### Execution order

Third in the chain stated in §3.1.

#### Reconciliation approach

Delegated to CNV-004 (§3.3).

### 3.3 CNV-004 — Migration Reconciliation [Conversion]

Renamed and rescoped by D-59. **It writes nothing.** It is the reconciliation approach DESIGN_WORKSHOP
§4.2 demands of every Conversion, promoted to its own object because it spans both CNV-002 and
CNV-003.

#### Source format

**None.** CNV-004 reads Project Tracker's own rows; there is no external source.

#### Transformation rules

**None.** CNV-004 asserts and reports (BR-29).

#### Validation and rejection criteria

Three assertion families, all of which fail the migration loudly rather than warning (BR-34):

| Family                | Assertion                                                                                                                                                 | Rule         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Counts                | 1 Area, 1 Engagement, 1 Workspace, 3 Initiatives, 12 Milestones, 4 Defects, 5 Decisions, 1 TestRun, 2 Activity rows                                       | BR-30        |
| The chain             | Exactly one Milestone has a chain — `financial-planner/CNV-001`, 8 Tasks and 6 Subtasks, all Not Started; zero rows carry `stepCode` `ux-test` or `smoke` | BR-31        |
| Provenance and typing | No Milestone carries `fricewType` = `Integration`; every migrated row carries `createdBy` = `migration`                                                   | BR-32, BR-33 |

**This is not SPEC-02 FUT-004/FUT-005 restated.** Those test whether **ENH-001's rule** works; CNV-004
tests whether **this load's data** came out right. A build persona can pass every SPEC-02 test and
still set `shipsUi` wrong on twelve rows.

#### Execution order

Fourth in the chain stated in §3.1, and before CNV-005.

#### Reconciliation approach

CNV-004 _is_ the reconciliation approach for CNV-002 and CNV-003.

---

## 4. Business Rules

**Load mechanism and provenance — cross-cutting**

- **BR-01** CNV-002, CNV-003 and CNV-004 write through the CAP service layer, not through INT-001's verbs. D-05's prohibition binds agents bypassing the service layer; a one-time Conversion is not an agent.
- **BR-02** Every row the migration writes carries `createdBy` = `migration`, an enumerated identity that is neither human nor agent.
- **BR-03** Execution is strictly CNV-001 → CNV-002 → CNV-003 → CNV-004.
- **BR-04** The migration emits no per-row Activity event. It emits exactly two Activity rows, and each names its writer: **CNV-002 emits one of kind `migration`** at load time as the load's first act, so a migration that fails partway is still recorded as having started; **CNV-003 emits the `checkpoint` entry**, at the checkpoint's own date.
- **BR-05** Re-running the migration is rejected when the `financial-planner` Workspace already exists.
- **BR-06** The migration never reads or writes Financial Planner's database (D-29).

**Hierarchy and Initiatives — CNV-002**

- **BR-07** Area "Personal Software" → Engagement "Life OS" → Workspace `financial-planner` / "Financial Planner".
- **BR-08** `Workspace.currentFocus` is null on load.
- **BR-09** Three Initiatives are created: W1-S1, W1-S2, W1-S3.
- **BR-10** `Initiative.status` ∈ {Active, Complete}. W1-S1 and W1-S2 are Complete; W1-S3 is Active.
- **BR-11** `Initiative.mergeCommit` and `Initiative.tag` are nullable. W1-S1 `0a9804f`/`v1.1`; W1-S2 `9bbe826`/`v1.2`; W1-S3 both null.
- **BR-12** `Initiative.branch` is the real git ref: `sprint/W1-S1`, `sprint/W1-S2`, `sprint/W1-S3`.
- **BR-13** `Initiative.goal` comes from the board for W1-S3 and from its checkpoint for W1-S2. W1-S1's is null.

**Milestones — CNV-002**

- **BR-14** Twelve Milestones — 3 under W1-S1, 5 under W1-S2, 4 under W1-S3 — with `storyId` and `description` taken verbatim from the board.
- **BR-14a** `Initiative.position` is 10 / 20 / 30 for W1-S1 / W1-S2 / W1-S3, and `Milestone.position` is board order within each Initiative, gapped by 10 and restarting per Initiative. Both are not null and unique within their parent. Added at the SPEC-04 workshop, where ENH-002 needs a total order over open Milestones and the twelve migrated rows share one `createdAt` (D-67).
- **BR-15** A Milestone's creation status is a transient input, not a stored attribute: Done for eleven, Backlog for `financial-planner/CNV-001`. Thereafter status is derived (SPEC-02 BR-17).
- **BR-16** `shipsUi` is set on every Milestone, derived from its board description: true for Financial Planner's FRM-001, FRM-003, FRM-009 and FRM-010; false for the other eight.
- **BR-17** `fricewType` values are singular. Financial Planner's INT-001 and INT-002 remap from `Integration` to `Interface` (D-09); the other ten pass through unchanged.
- **BR-18** Chain instantiation is a consequence of creation, not a load step: exactly one chain results.
- **BR-19** No stage history is backfilled for any Done Milestone, including W1-S3's three (D-15, D-24).

**Registers — CNV-003**

- **BR-20** Four Defects are seeded with their recorded severity and status: D-001 High/Closed, D-002 Medium/Closed, D-003 High/Closed, D-004 Medium/Open.
- **BR-21** A Defect links to a Milestone or an Initiative, both nullable, at least one present. All four link to their recorded Initiative; `story` stays null.
- **BR-22** `Defect.title` is derived from the description's leading clause; `description` is preserved verbatim; `references` is null on seed.
- **BR-23** `Defect.resolution` is populated **from the log's Resolution cell when status is Closed, and is null when status is Open** — both directions. D-004 is Open, so its Resolution cell, which records a product fork rather than a resolution, folds into `description`.
- **BR-24** Five Decisions are seeded against the W1-S2 Initiative. `decision` comes from the checkpoint; `rationale` where the checkpoint records one; `context` and `options` are null.
- **BR-24a** Every seeded Decision carries `decidedAt` = **2026-07-10**, the checkpoint's own date — not the load date CAP's `createdAt` records. Same correction `TestRun.executedAt` received for the same reason, from the same source file (BR-25a, D-72, D-92).
- **BR-25** One TestRun: `total` 174, `passed` 174, `failed` 0, `linesPct` 98.71, `branchesPct` 89.37, `failures` empty; `pending` and `durationMs` null.
- **BR-25a** The seeded TestRun carries `executedAt` **2026-07-10**, the checkpoint's own date — not the load time `createdAt` records. This is BR-28's treatment of the checkpoint Activity applied to the TestRun from the same source file. Added at the SPEC-05 workshop (D-72).
- **BR-26** A TestRun links to a Task or an Initiative, both nullable, at least one present. The seeded run links to the W1-S2 Initiative; no Task exists to link to.
- **BR-27** The five markdown test reports are not migrated (D-24).
- **BR-28** One Activity of kind `checkpoint`, `occurredAt` 2026-07-10, `payload` the checkpoint's remaining prose verbatim.

**Reconciliation — CNV-004**

- **BR-29** CNV-004 writes nothing. It asserts and reports.
- **BR-30** Count tie-out: 1 Area, 1 Engagement, 1 Workspace, 3 Initiatives, 12 Milestones, 4 Defects, 5 Decisions, 1 TestRun, 2 Activity rows.
- **BR-31** Chain assertion: exactly one Milestone has a chain — `financial-planner/CNV-001` with 8 Tasks and 6 Subtasks, all Not Started; zero rows carry `stepCode` `ux-test` or `smoke`.
- **BR-32** Type assertion: no Milestone carries `fricewType` = `Integration`.
- **BR-33** Provenance assertion: every migrated row carries `createdBy` = `migration`.
- **BR-33a** Ordering assertion: no Initiative and no Milestone carries a null `position`, and no two Milestones share a `position` within one Initiative. Added at the SPEC-04 workshop — a duplicate or absent position makes ENH-002's total order ambiguous, which is the one defect its ordering rule exists to be free of.
- **BR-34** A failed assertion fails the migration loudly; it does not warn.

---

## 5. Error Handling

| Condition                                                                          | Response                                                                | i18n key                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| The migration is run when the `financial-planner` Workspace already exists         | Reject 409, naming the existing Workspace; nothing is written           | `cnv.migration.alreadyLoaded`      |
| CNV-002 is run before CNV-001 has seeded the library                               | Reject 409 — ENH-001 has no library to read                             | `cnv.migration.libraryMissing`     |
| CNV-003 is run before CNV-002                                                      | Reject 409 — the Initiatives its records link to do not exist           | `cnv.migration.hierarchyMissing`   |
| A board row carries a `fricewType` outside the six singular values after remapping | Reject 400, naming the row and the value                                | `verb.value.notInCodeList` ¹       |
| A Defect row resolves to neither a Milestone nor an Initiative                     | Reject 400                                                              | `cnv.defect.targetMissing`         |
| A TestRun resolves to neither a Task nor an Initiative                             | Reject 400                                                              | `cnv.testrun.targetMissing`        |
| A Defect with status Open carries a non-null resolution                            | Reject 400                                                              | `cnv.defect.resolutionOnOpen`      |
| A Defect with status Closed carries a null resolution                              | Reject 400 — BR-23 binds both directions                                | `cnv.defect.resolutionMissing`     |
| CNV-004's count tie-out does not match BR-30                                       | **Fail loudly**, reporting expected vs actual per entity; write nothing | `cnv.reconcile.countMismatch`      |
| CNV-004 finds a Milestone count of chains other than exactly one                   | Fail loudly, naming the offending Milestones                            | `cnv.reconcile.chainMismatch`      |
| CNV-004 finds a row whose `createdBy` is not `migration`                           | Fail loudly, naming the row                                             | `cnv.reconcile.provenanceMismatch` |

¹ Existing SPEC-01 key, reused rather than duplicated.

A rejected conversion writes nothing and emits nothing, consistent with SPEC-01 BR-05. **Atomicity is
per conversion, not across the chain**: a CNV-003 that rejects leaves CNV-002's rows committed, which
is precisely the partial state FUT-012's second fixture exercises and the state CNV-004 exists to
catch.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-04 | **Not resolved here.** Calculated health is SPEC-05's.                      |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity; a failed load fails
loudly and synchronously to its caller.

**Provisional dependency — R1.** Inherited from SPEC-01 and SPEC-02 (D-39). **R4** — `cds deploy`'s
per-schema `cds_model` snapshot — is largely dissolved by D-29's separate databases and is confirmed
at the Data Model stage's first deploy, not here. **This spec is not Approved-for-build until R1
clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                           | Goes to           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~**FUT-014 must be amended** — it asserts the canonical FRICEW value is `Interfaces` (plural); D-60 rules the code-list values singular, so the rejected value stays `Integration` and the accepted one becomes `Interface`. This is a **fifth** SPEC-01 amendment~~                                                                                          | SPEC-01 — applied |
| **§3.2's "`Milestone.status` at creation" is a transient input, not an attribute** — the derivation in BR-17 is vacuously Done over an empty Task set and cannot discriminate a Backlog from a Done Milestone at creation (D-64)                                                                                                                               | SPEC-02           |
| **§2 amendment 6's actor kind needs a third value, `migration`** — neither human nor agent (D-63)                                                                                                                                                                                                                                                              | SPEC-02           |
| **RPT-004 must render a sprint-scoped Defect** (no story) and a Decision with a null rationale — both exist in the seed from day one                                                                                                                                                                                                                           | SPEC-07           |
| ~~**The checkpoint narrative is loaded by CNV-003, not FRM-001.** FRM-001 owns ongoing manual narrative entries only; D-25's assignment is a Wave 2 concern and Wave 1 could not depend on it~~ — **SPEC-05 BR-33 confirms FRM-001 may still write the `checkpoint` kind** for entries after cutover; "ongoing only" excluded the migrated entry, not the kind | SPEC-05 — closed  |
| ~~**INT-004 must not conflate Jest's statements and lines** — SPEC-01 §3.1 maps `coverage.total.lines.pct` → `linesPct`, and the checkpoint's 98.73% is the statements figure~~ — **discharged at the SPEC-09 workshop as SPEC-09 BR-05**, and the live script already reads `lines.pct` (`generateTestReport.ts:115`), so the rule protects correct code against a plausible-looking "fix" at Build rather than describing a change. SPEC-01 §3.1's mapping table now states it too                                                                                                                                                                                    | SPEC-09 — applied |
| **The exporter must carry `createdBy`** so a round-trip can still distinguish migrated rows from lived ones — sharpens R7, whose stated failure mode is exactly destroyed managed fields                                                                                                                                                                       | SPEC-11           |
| **CNV-005 must not run before CNV-004's tie-out has passed**                                                                                                                                                                                                                                                                                                   | SPEC-12           |
| ~~**CNV-002 must set `Initiative.position` and `Milestone.position`** — SPEC-04's ENH-002 orders open Milestones by them, and the twelve migrated rows share one `createdAt`, so there is no fallback tiebreak (D-67)~~ — applied in this spec at the SPEC-04 workshop: §2 amendment 12, §3.1's two tables, BR-14a, BR-33a, FUT-001 and FUT-002                | SPEC-03 — applied |

**BA-001 corrections** — all three **applied at BA-001 v1.4**, in this session.

| Correction                                                                                                                                                           | Where                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| ~~CNV-004 renamed W1-S3 Live Chain Instantiation → **Migration Reconciliation** and rescoped from the chain alone to the whole load's tie-out (D-59)~~               | BA-001 §5, §11.2 — done |
| ~~CNV-003's "**~6 Decisions**" → **five** — the checkpoint's third narrative bullet says "(see FRM-003 decision 1)" and is the same decision recorded twice (D-65)~~ | BA-001 §5 — done        |
| ~~CNV-003's "**98.73% statements**" → `linesPct` **98.71** — TestRun has no statements attribute~~                                                                   | BA-001 §5 — done        |
| ~~CNV-003's checkpoint narrative reassigned from a manual FRM-001 entry to CNV-003's own write (D-58)~~                                                              | BA-001 §5 — done        |

---

## 7. Functional Unit Tests

### FUT-001: The hierarchy and three Initiatives load with their real git facts

**Covers:** CNV-002
**Preconditions:** CNV-001 has run; no Workspace exists.
**Steps:**

1. Run CNV-002.
2. Read the Area, Engagement and Workspace.
3. Read the three Initiatives.

**Expected Result:**

- One Area "Personal Software", one Engagement "Life OS", one Workspace with slug `financial-planner` (BR-07).
- `Workspace.currentFocus` is null (BR-08).
- W1-S1 and W1-S2 are Complete; W1-S3 is Active (BR-10).
- `0a9804f`/`v1.1`, `9bbe826`/`v1.2`, and W1-S3 with both null (BR-11).
- All three `branch` values are `sprint/W1-S1`, `sprint/W1-S2`, `sprint/W1-S3` (BR-12).
- **W1-S1's `goal` is null**; W1-S2's and W1-S3's are non-null (BR-13).
- `position` is 10 / 20 / 30 in that order, none null (BR-14a).

### FUT-002: Twelve Milestones load, and only the Backlog one gets a chain

**Covers:** CNV-002, ENH-001
**Preconditions:** CNV-001 has run; CNV-002 has not.
**Steps:**

1. Run CNV-002.
2. Count Milestones per Initiative.
3. Count Milestones having at least one Task.

**Expected Result:**

- 12 Milestones — 3 under W1-S1, 5 under W1-S2, 4 under W1-S3 (BR-14).
- Each `description` matches its board row verbatim (BR-14).
- Exactly one Milestone has a chain — `financial-planner/CNV-001` (BR-15, BR-18).
- The other eleven have zero Tasks and zero Subtasks (BR-19).
- `position` restarts per Initiative and is gapped by 10 — W1-S1 carries 10/20/30, W1-S2 10…50, W1-S3 10…40 with `financial-planner/CNV-001` at 40; none is null and none is duplicated within its Initiative (BR-14a).

### FUT-003: `shipsUi` is set on all twelve

**Covers:** CNV-002
**Preconditions:** CNV-002 has run.
**Steps:**

1. Read `shipsUi` on all twelve Milestones.

**Expected Result:**

- No Milestone carries a null `shipsUi` (BR-16).
- True for exactly Financial Planner's FRM-001, FRM-003, FRM-009 and FRM-010; false for the other eight (BR-16).

### FUT-004: The Type remap reaches the data

**Covers:** CNV-002
**Preconditions:** CNV-002 has run.
**Steps:**

1. Query Milestones grouped by `fricewType`.
2. Query for `fricewType` = `Integration`.

**Expected Result:**

- Financial Planner's INT-001 and INT-002 both carry `Interface` (BR-17).
- Zero rows carry `Integration` (BR-17, BR-32).
- The other ten carry the board's value unchanged — 3 Conversion, 3 Enhancement, 4 Form (BR-17).

### FUT-005: A defect with no story in its source keeps none

**Covers:** CNV-003
**Preconditions:** CNV-002 has run; CNV-003 has not.
**Steps:**

1. Run CNV-003.
2. Read all four Defects.

**Expected Result:**

- Four Defects with their recorded severity and status; D-004 is Open (BR-20).
- Every `story` is null, and each links to its recorded Initiative — D-001/D-002/D-003 to W1-S2, D-004 to W1-S3 (BR-21).
- Every `description` is verbatim and every `references` is null (BR-22).
- Every Defect carries a non-empty `title` (BR-22).

### FUT-006: An Open defect carries no resolution

**Covers:** CNV-003
**Preconditions:** CNV-003 has run.
**Steps:**

1. Read D-004.
2. Read D-001, D-002 and D-003.

**Expected Result:**

- D-004 is Open with `resolution` null, and the product-fork text is present in its `description` (BR-23).
- The three Closed defects each carry a non-empty `resolution`, taken from the log's Resolution cell (BR-23).
- No Defect is Open with a non-null `resolution` (BR-23).

### FUT-007: The TestRun records the metric the checkpoint actually states

**Covers:** CNV-003
**Preconditions:** CNV-003 has run.
**Steps:**

1. Read the single TestRun.

**Expected Result:**

- Exactly one TestRun exists (BR-25, BR-30).
- `total` 174, `passed` 174, `failed` 0, `branchesPct` 89.37 (BR-25).
- **`linesPct` is 98.71, not 98.73** — the checkpoint's Lines row, not its Statements row (BR-25).
- `pending` and `durationMs` are null (BR-25).
- **`executedAt` is 2026-07-10**, the checkpoint's own date, not the load time (BR-25a).
- It links to the W1-S2 Initiative with its Task link null (BR-26).

### FUT-008: Five Decisions load with what the checkpoint recorded and nothing more

**Covers:** CNV-003
**Preconditions:** CNV-003 has run.
**Steps:**

1. Read all Decisions.

**Expected Result:**

- Exactly five, all targeting the W1-S2 Initiative (BR-24, BR-30).
- Every `context` and `options` is null (BR-24).
- Every `decidedAt` is **2026-07-10** — the checkpoint's own date, not the load date `createdAt` records (BR-24a).
- Each carries a non-empty `decision` (BR-24).
- **Exactly one carries a null `rationale`** — the multi-file same-card upload decision, which records none (BR-24).

### FUT-009: The load's only two Activity rows

**Covers:** CNV-003
**Preconditions:** CNV-002 and CNV-003 have run.
**Steps:**

1. Read all Activity rows.

**Expected Result:**

- Exactly two (BR-04, BR-30).
- One of kind `checkpoint` at `occurredAt` 2026-07-10, written by CNV-003, its payload carrying the checkpoint's remaining prose verbatim (BR-28).
- One of kind `migration` at load time, written by CNV-002 (BR-04).
- **No Activity row exists for any Milestone, Defect, Decision or TestRun creation** (BR-04).

### FUT-010: Every migrated row is attributable to the migration

**Covers:** CNV-002, CNV-003
**Preconditions:** CNV-002 and CNV-003 have run; no verb call has been made.
**Steps:**

1. Read `createdBy` across every entity the load touched.

**Expected Result:**

- Every row carries `migration` — including the 8 Tasks and 6 Subtasks ENH-001 wrote inside the load's transaction (BR-02, BR-33).
- No row carries `sandro` or an agent identity.

### FUT-011: Re-running the migration is refused

**Covers:** CNV-002
**Preconditions:** CNV-002 has already run.
**Steps:**

1. Record all row counts.
2. Run CNV-002 again.
3. Re-read the counts.

**Expected Result:**

- Rejected with key `cnv.migration.alreadyLoaded` (BR-05).
- Every count is unchanged — no duplicate Workspace, no second twelve Milestones, no second chain (BR-05).

### FUT-012: Reconciliation ties out, and fails loudly when it does not

**Covers:** CNV-004
**Preconditions:** Two fixtures — (a) CNV-002 and CNV-003 both run; (b) CNV-002 run and CNV-003 not, a legal intermediate state of BR-03's order.
**Steps:**

1. Run CNV-004 against fixture (a).
2. Run CNV-004 against fixture (b).

**Expected Result:**

- Against (a) every assertion in BR-30…BR-33 passes and the counts are reported (BR-29, BR-30).
- Against (b) it **fails loudly** rather than warning — 0 Defects against an expected 4, 0 Decisions against 5, 0 TestRuns against 1, and 1 Activity row against 2, since CNV-002 emitted the `migration` row and CNV-003 never emitted the `checkpoint` one (BR-04, BR-30, BR-34).
- Neither run writes anything: total row count is identical either side of both (BR-29).

---

_SPEC-03 specifies CNV-002, CNV-003 and CNV-004 — the load of Financial Planner's markdown project state and the tie-out that proves it landed — per [BA-001 §11 row 03](../BUSINESS_ARCHITECTURE.md) (D-37). The library it depends on is [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) (CNV-001); the verb surface it deliberately bypasses is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) (D-58). **Provisional on R1** per [D-39](../DECISIONS_LOG.md)._
