# SPEC-11 — Project State Exporter

**Spec ID:** SPEC-11
**FRICEW Objects:** INT-007 (Interface)
**Wave:** 3
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39). **R7 is owned here** and **R4 is settled by the same act** (D-121)
— [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s rule-out of R1 (D-119) is **reversed**, because this object
reads the database. **R9 is ruled OUT** (D-101's precedent).

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-04 | Sandro & Claude | Initial creation from the SPEC-11 workshop. Records **D-120 … D-128**. **Fourth Wave 3 spec** and the **fifth standalone** one — not the fourth; see §6, where the running standalone count is corrected against BA-001 §11. Declares **no new entity and no new attribute** — it reads every persisted one — and places **one standing requirement** on the Data Model stage (BR-07). **SPEC-11 resolves no OI**; OI-01 was already resolved by D-31 and this object implements that resolution. **Mints no error key**, the seventh spec running and the second where none is structurally possible. **Provisional on R1, reversing [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s rule-out (D-121)**; **R7 owned here and R4 settled in the same execution**; **R9 ruled out**. Discharges [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §6's, [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §6's and [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §6's rows owed to it. Two BA-001 amendments — one correction, one completion (→ v1.12) — and four `research/README.md` corrections applied in-session, listed in §6. Six defects found and fixed on review after the writer's own DoD check passed them, including two FUT preconditions that named the wrong Conversion. |
| 2026-08-04 | Sandro & Claude | **Status → Approved** on the day it was written, the normal path for this module — only [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) is held in Draft by a decision (D-93). It owes nothing: all three §6 rows owed to it are discharged, and every correction it raised against BA-001, `research/README.md`, [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md), [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md), [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) and `PLAN.md` was applied in-session rather than left owed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-08-06 | Sandro & Claude | **BR-06's open clause is closed at the Design System stage (D-144).** It read "whether any becomes so is **not yet decided**", citing SPEC-05 §3 and SPEC-06 §3's deferral. Design System ruled **Fiori Elements FPM with draft enablement OFF**, so **no entity in this module is draft-enabled and none will be**. **BR-06's rule text is unchanged** — it was written to be true either way, and it stays an unconditional filter rather than a description of the model. Recorded correction: D-138's own consequence wording said BR-06 "becomes vacuous only if stage 7 rules freestyle"; that was wrong, since it is vacuous because drafts are off, which FPM permits. No business rule and no FUT changes. Status stays **Approved**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

---

## 1. Overview

The durable, diffable form of project state: D-31's answer to OI-01 and the reason CNV-005 can safely
retire markdown. Markdown was diffable, revertable, and cloned with the repo; the migration removes
all three, and this object restores them. **It has to be built because CAP has no data export at
all** — 27 CLI commands, none of which export data; `cds add data` writes empty headers;
`cds.utils.csv.serialize` is broken for tabular data (RSH-005 §4). It is paired with a `pg_dump -Fc`
runbook as the binary floor, and the two are complementary rather than alternatives: `pg_dump`
restores, CSV diffs.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

**INT-007 declares no new entity and no new attribute. It reads every persisted entity and every
persisted column.** The read surface is therefore stated as a set, not as an enumeration of
attributes — restating the data model is exactly the trap this object walks into.

| Entity group    | Entities                                                                                                                                  | Role                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Hierarchy (7)   | Area, Engagement, Workspace, Initiative, Milestone, Task, Subtask                                                                         | Read in full                                    |
| Methodology (2) | Methodology, MethodologyStep                                                                                                              | Read in full                                    |
| Registers (4)   | Defect, Decision, Activity, TestRun                                                                                                       | Read in full                                    |
| Code lists      | Every code-list entity the Data Model creates, including `HealthState` ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §2 amendment 2) | Read in full — a code list is a table with rows |

**One standing requirement on the Data Model, not an amendment:** every persisted entity must carry a
deterministic sort key (BR-07). That is a property the model must have, not a new attribute.

**Explicitly not read — derived values, because nothing derived is persisted.** `Milestone.status` is
derived ([SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-17,
[SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §2) and workspace health is derived on read and
stored nowhere ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-02).

**No Data Model amendments.**

---

## 3. Functional Description

### 3.1 INT-007 — Project State Exporter [Interface]

D-95 established that an Interface whose deliverable is prose gets a rewiring table instead of an
endpoint, a payload and a schedule. **D-95 does not bind here** — INT-007 has a real artifact and a
real cadence. §3.1 therefore carries the Interface template's four headings adapted as
[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §3.1 and [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) §3.1 adapt
them: there is no external API, so the **contract** is the CLI/npm surface plus the file format, the
**mapping** is entity → file, and scheduling and retry are stated and ruled out.

#### Location and lifecycle

| Aspect             | Contract                                                                                                                                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script             | `Project Tracker/scripts/exportProjectState.ts`                                                                                                                                                                                                                                                 |
| npm script         | `export-state`, no arguments                                                                                                                                                                                                                                                                    |
| Output folder      | `Project Tracker/state/`, tracked in git                                                                                                                                                                                                                                                        |
| Discovery          | **Outside** `cds.requires.db.data` — deliberately not auto-discovered                                                                                                                                                                                                                           |
| Runtime dependency | `papaparse`. **Verified 2026-08-04**: resolved only under `Financial Planner/node_modules/`, declared at `Financial Planner/package.json:47`, **not** hoisted to the root. Project Tracker declares it itself — permitted, because it is a module runtime dependency rather than shared tooling |
| Carve-out          | `Project Tracker/CLAUDE.md`'s "No `scripts/` folder — until `INT-004`" carve-out now also covers INT-007. The folder itself is created by [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-02                                                                                                    |

#### The file format

| Aspect          | Contract                                                                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File per entity | `{namespace}-{Entity}.csv` — e.g. `com.lifeos.projecttracker-Milestone.csv`. This is the only shape `cds deploy` reads back: filename hyphens become dots (`cds-deploy.js:377-378`, Documented) |
| Delimiter       | Comma                                                                                                                                                                                           |
| Header          | One row of column names                                                                                                                                                                         |
| Encoding        | UTF-8                                                                                                                                                                                           |
| Columns         | Every persisted column — all keys, all CAP-generated foreign keys (`xxx_ID` / `xxx_code`), and all four managed fields                                                                          |
| Row order       | A declared stable sort key, with the entity's key column as the final tiebreak (BR-07)                                                                                                          |
| Empty entity    | The file exists and holds its header row alone (BR-08)                                                                                                                                          |
| Writer          | `papaparse`'s `unparse`, which quotes the delimiter correctly (RSH-005 §7, Verified)                                                                                                            |

#### Bootstrap sequence

[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §3.1's precedent applies verbatim; INT-007 is the same
shape of caller.

1. Derive the module root from `import.meta.dirname`, **not** `process.cwd()` — the script must write
   to the same place whether npm runs it from the repo root or from the module.
2. `process.chdir(<Project Tracker root>)`.
3. **Dynamically** `await import('@sap/cds')` — static imports hoist above step 2 and defeat the
   chdir.
4. Read every entity through the CAP service layer.
5. `process.exit(0)` — the database pool keeps the event loop alive.

#### The rooting ruling

This is the **third** object in the module to meet the root `CLAUDE.md` rule that a shared linter
roots itself at `process.cwd()` and names no module. D-103 moved `recordTestRun.ts` **into** the
module, because `process.chdir` names a module irreducibly; D-110 kept `lintNoMarkdownState.ts`
**shared**, because `import.meta.dirname` derives the root without naming one. **INT-007 gets D-103's
answer**: it must chdir to Project Tracker's root before importing `@sap/cds`, which names a module,
so the script belongs in `Project Tracker/scripts/`. The nuance is worth stating — _inside_ the
module, `import.meta.dirname` then derives the module root (step 1), so D-110's technique still does
the work for the output path. What forces the module home is the CAP chdir, not the file path.

#### The checkpoint procedure

Written into `Project Tracker/CLAUDE.md`, and **a deliverable of this object rather than a note about
it** (BR-18). In order:

1. `pg_dump -Fc`
2. `npm run export-state`
3. Commit the diff
4. `--no-ff` merge
5. Annotated tag

#### The round-trip drill

R7's drill, owned here (BR-19, BR-20, D-121). In order: export → capture managed-field values → **drop
and recreate the schema** → copy `state/*.csv` into `db/data/` → `cds deploy` → compare row counts
**and** `createdAt`/`createdBy` values row for row. The drop is not optional: `schema_evolution:
"auto"` makes every seed load an `UPSERT` (`cds-deploy.js:210-211`), so a restore into a live database
is a **merge to a point in time, not a revert to one**.

#### Scheduling and retry

**No scheduling.** This module schedules nothing (`Project Tracker/CLAUDE.md`, D-70), nothing fires the
exporter automatically, and the export is not a verb (BR-17). **No retry.** A failure aborts and exits
non-zero (BR-21); the operator re-runs the npm script.

---

## 4. Business Rules

**Shape**

- **BR-01** One CSV per persisted entity, named `{namespace}-{Entity}.csv` (e.g. `com.lifeos.projecttracker-Milestone.csv`). This is the only shape `cds deploy` reads back: filename hyphens become dots (`cds-deploy.js:377-378`, Documented).
- **BR-02** Comma-delimited, one header row of column names, UTF-8. **Verified 2026-08-04** against the repo's existing convention: `Financial Planner/db/data/` holds 22 files, all comma-delimited with an `ID,name`-style header row.
- **BR-03** Every column of the entity is emitted: all key columns, all CAP-generated foreign keys (the `cardInstance_ID` / `xxx_code` shape), and **all four managed fields** — `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`. Omitting a key mints a fresh UUID per row on restore (`cds-deploy.js:191-194`); omitting a managed field stamps `'anonymous'` and the deploy timestamp (`:196-204`). They load correctly when present, because `_queries4` only _adds_ columns that are absent.
- **BR-04** Derived values are not exported, because they are not persisted — `Milestone.status` ([SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-17) and workspace health ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-02).
- **BR-05** The entity set is **reflected from the CSN at run time**, never a hand-maintained list. A hand-maintained list goes stale on the next Data Model change and silently drops an entity from every subsequent export — D-31's own rejection of hand-maintained artifacts, applied to the exporter itself.
- **BR-06** Draft shadow tables (`.drafts`) are excluded, **if any exist** — drafts are transient by definition and are not project state. **No entity in this module is draft-enabled** — ~~and whether any becomes so is not yet decided: [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §3 and [SPEC-06](SPEC-06-SPRINT-PLANNING.md) §3 both defer Fiori Elements vs freestyle to the Information Architecture / Design System stages.~~ **and that is now decided rather than open.** The Design System stage ruled **Fiori Elements FPM with draft enablement OFF**, 2026-08-06 (D-144, [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) §4.3), measured against the repo's only FPM app, which runs on a non-draft entity set. **This rule's text is unchanged**, because it was written to be true either way. Note that D-138's own consequence wording — that this rule "becomes vacuous only if stage 7 rules freestyle" — was wrong: it is vacuous because drafts are off, which FPM permits, and the Fiori-Elements-versus-freestyle axis was never the one that decided it. So the rule is a filter the exporter must carry unconditionally rather than a description of the current model — the exporter excludes what the CSN marks as a draft shadow, and asserts nothing about whether the set is non-empty. (`@cap-js/postgres` requiring `cds.fiori.lean_draft` — `cds-plugin.js:5-7`, Verified in RSH-005 — governs _how_ drafts are stored where they exist; it does not create them.)
- **BR-07** Each file is sorted by a declared stable key, with the entity's key column as the final tiebreak. **Determinism and diff-friendliness are separate requirements and both are required**: `ORDER BY ID` alone gives byte-identical output for identical data but scatters new rows through the file, because UUIDs do not sort chronologically. Entities that grow by append declare a temporal sort key first — `TestRun` by `executedAt`, `Activity` by `occurredAt` — so growth appends rather than scatters.
- **BR-08** An entity with zero rows still produces a file containing only its header row. A constant file set makes "this table is empty" a visible fact in the diff rather than an absence.
- **BR-09** A file in `state/` whose entity is no longer in the CSN is deleted by the next export. Otherwise a removed entity's last export lingers forever and would be re-loaded by a restore.

**Destination**

- **BR-10** Output is `Project Tracker/state/`, tracked in git, and **outside** `cds.requires.db.data`. Restore is therefore a deliberate act — copy the files into `db/data/`, then `cds deploy` — not an ambient reload.

**Execution**

- **BR-11** The exporter is `Project Tracker/scripts/exportProjectState.ts`, exposed as npm script `export-state`, and takes no arguments.
- **BR-12** It follows [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §3.1's bootstrap verbatim: derive the root from `import.meta.dirname`, `process.chdir`, **dynamic** `await import('@sap/cds')`, read, `process.exit(0)`.
- **BR-13** It reads through the **CAP service layer**, never raw SQL (D-05, D-58, D-79). It is the **fourth kind of caller**, after the MCP server ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)), the two Forms ([SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md), [SPEC-06](SPEC-06-SPRINT-PLANNING.md)) and `recordTestRun.ts` ([SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md)). A reader is not a writer, but it bypasses no guarantee and D-05's escape hatch stays shut.
- **BR-14** The exporter **writes nothing** — no row, no verb call, and **no `Activity`**. [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-03 requires every _write_ verb to emit one; the exporter is not a write verb. This is not merely permitted, it is required: an export that emitted an Activity would change the state it just exported, so no two consecutive exports could ever match.
- **BR-15** Idempotent: the same database content produces byte-identical files. BR-14 is what makes this reachable.
- **BR-21** The export is **all-or-nothing**. Files are written to a temporary location and moved into `state/` only after every entity has been read and written successfully. Any failure exits non-zero and leaves `state/` byte-for-byte unchanged. A partial export committed at a checkpoint is the worst available outcome — it looks like a backup and is not one.

**Cadence**

- **BR-16** Cadence is **per sprint checkpoint**, matching the existing `--no-ff` + annotated-tag ritual — not per `complete_stage`, which would be noisy (D-31, BA-001 §4).
- **BR-17** Nothing schedules the exporter and nothing fires it automatically. This module schedules nothing (`Project Tracker/CLAUDE.md`, D-70), and the export is not a verb — D-40's eleven stand, declined three times over (D-50, D-78, D-107).
- **BR-18** The checkpoint procedure is written into `Project Tracker/CLAUDE.md` and is **a deliverable of this object, not a note about it**: `pg_dump -Fc` → `npm run export-state` → commit the diff → `--no-ff` merge → annotated tag, in that order. A cadence nobody is instructed to run does not happen. This is D-102's finding one object over — there, converting a surface without adding the instruction would have left every chain unopened — and it is D-40's no-legal-path analysis in its eighth occurrence.

**Round-trip / R7**

- **BR-19** The drill is: export → capture managed-field values → **drop and recreate the schema** → copy `state/*.csv` into `db/data/` → `cds deploy` → compare row counts **and** `createdAt`/`createdBy` values row for row.
- **BR-20** A row-count match alone is **not** a pass. The drill fails unless managed-field values match the captured pre-drop values. And the drop is not optional: `schema_evolution: "auto"` makes every seed load an `UPSERT` (`cds-deploy.js:210-211`), so a restore into a live database is a **merge to a point in time, not a revert to one** — rows created after the export survive it.

---

## 5. Error Handling

**SPEC-11 mints no error key of its own, and that follows from the mechanism rather than from taste**
(D-46, D-79) — the general form being that the mechanism decides whether a rule gets a named key, not
the other way round. **This is the seventh spec running to mint none, and the second where it is
structural rather than a disposition** ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) was the first). Two
independent reasons, both structural:

1. **A read path has no rejection.** The exporter writes nothing (BR-14), so there is no guard for a mechanism to get wrong, no state to roll back, and nothing to log. This is [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) §5's Report argument reaching the same place by the same route.
2. **A standalone CLI process has no i18n surface and no caller.** Output is stderr and an exit code, read by Sandro at a checkpoint. This is [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s "there is no key space to mint into" and [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md)'s "no rejection reaches a caller that could act on it", holding simultaneously.

| Condition                | Surface                                          |
| ------------------------ | ------------------------------------------------ |
| Database unreachable     | Abort, exit non-zero, `state/` unchanged (BR-21) |
| An entity read fails     | Same (BR-21)                                     |
| `state/` unwritable      | Same (BR-21)                                     |
| A CAP `ASSERT_*` on read | **Cannot occur** — reads assert nothing          |
| An entity with zero rows | **Not an error** — a header-only file (BR-08)    |

**The disposition on failure is the opposite of
[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-15's, and that is the point worth stating.** SPEC-09
deliberately swallows every rejection into a stderr warning and exits 0, because a red build must not
be caused by the tracker. INT-007 must do the reverse — **fail loudly and exit non-zero** (BR-21) —
because a silent partial export produces a committed file that looks like a backup and is not one,
which is the exact failure mode this object exists to prevent.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-11 resolves no open item.** OI-05 is the only one still open and it is not a workshop question.
**OI-01 is already resolved by D-31** — INT-007 _implements_ that resolution rather than reopening it.

**Alerts:** asked per the standing rule — **none.** The exporter observes state, writes nothing, and
schedules nothing.

**Provisional dependencies — SPEC-11 is provisional on R1, reversing
[SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s rule-out.**

- **R1 — binds, and this is a change.** [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) was the first spec in the
  module not provisional on R1 (D-119), because neither cutover guard touches CAP. INT-007 reads the
  database, and R7's own drill runs `cds deploy` against a real Postgres — which, per D-39, **neither
  module has ever connected to**. Ruled explicitly rather than inherited either way, on D-82's
  precedent.
- **R7 — owned here.** `research/README.md` §5 has **no Owner column and no Grade column**
  ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) §6 recorded that absence when it had to give R10 an owner in
  prose; the same is done here). R7's owner is **INT-007's own build**, and the drill is FUT-007 rather
  than a separate exercise: it needs a real Postgres, a built exporter and loaded data, and all three
  exist only when INT-007 is built. Deadline: **before CNV-005 runs**, since CNV-005 retires the
  markdown this object replaces.
- **R4 — binds, and the same act settles it.** No prior spec has had to consider R4.
  `research/README.md` §5 calls it the "**highest-value unrun test in the wave**" — one `cds_model`
  snapshot per Postgres schema with `schema_evolution: "auto"` on by driver default. FUT-007 drops and
  recreates a schema and re-deploys, which is precisely R4's test. **R1's spike is the precondition,
  and R7 and R4 are one execution, not three.**
- **R9 — ruled OUT**, on D-101's precedent and D-82's test: no HTTP server, no origin, no page, no
  browser-originated request. Ruled rather than inherited silently.

Provisional on R1 does **not** hold up approval, and did not for the nine specs that shipped that way
before [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) — the Definition of Done has two statuses, Draft and
Approved, and "provisional" is a recorded dependency rather than a third. What R1 gates is the
_execution_ of FUT-007 … FUT-010, which is INT-007's build, not this spec's approval.

**Not a gap to be closed by re-reading.** RSH-005 is a **Compare**-mode document that _does_ carry a
verdict — "`pg_dump` runbook + built CSV exporter", confidence "High on tooling, **Medium on
restore**". The Medium is R7, and it closes by execution rather than by further reading.

### Discharged here — the three rows owed to SPEC-11

1. **[SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §6 — `createdBy`.** Discharged by BR-03:
   the exporter emits all four managed fields, so a round-trip still distinguishes migrated rows
   (`createdBy = migration`, D-63) from lived ones.
2. **[SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) §6 — `executedAt`.** Discharged by BR-03, and
   the distinction is worth stating because the two are not the same kind of thing: `executedAt` is a
   plain not-null domain attribute (D-72) carried by "emit every column", while `createdBy` is
   CAP-managed and carried by the explicit managed-field rule. They exist as separate attributes
   _because_ `createdAt` reads the cutover date rather than domain truth (D-72, D-92) — so the export
   carries both and they mean different things.
3. **[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §6 — TestRun volume.** Discharged by BR-07, and
   **the answer is the sort key, not a filter**. Filtering would break the round-trip, the one
   property this object exists to provide. Ordering `TestRun` by `executedAt` makes
   several-times-a-day growth a pure append at the end of one file; ordering by ID would scatter it.
   Slice 1 still needs no retention — [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-24 reads
   only the most recent and RPT-004 excludes TestRun (D-19).

### A finding worth carrying — the two hazards fail differently

Omitting **keys** fails loudly: the restored rows get fresh UUIDs, so every foreign key referencing
them dangles, and because all foreign keys are `DEFERRABLE INITIALLY DEFERRED` inside one transaction
(RSH-005 §5, Verified — 51 of 51 on the planner model), the constraint check at `COMMIT` fails and the
deploy aborts. Omitting **managed fields** fails silently: every row loads, every count matches, and
the audit history is gone. **That asymmetry is why BR-20 makes the managed-field comparison mandatory
rather than advisory** — the hazard that needs a test is the one that cannot announce itself.

### Cross-spec notes raised, not designed here

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Goes to                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `research/README.md` §5's R8 is not struck, while `Project Tracker/CLAUDE.md` states R3 and R8 are dissolved by D-29. Documentation drift, not a live risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | **`/refresh-docs`** — raised                                |
| `research/README.md` §6's decay row for `pg_dump` / `pgBackRest` is dated 2026-07-26 and records local machine state that has never been rechecked. The `pg_dump -Fc` half of D-31 depends on it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | **Build** — before the checkpoint procedure is first run    |
| `Activity.kind`'s unsettled casing divergence — `checkpoint` / `migration` lowercase against camelCase for the rest ([SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) §2, D-81) — is a CSV round-trip hazard as well as a display one, because a code-list value is exported literally                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Data Model** — already routed there; noted, not re-raised |
| **The running "standalone" count in the spec headers is off by one, and this spec declines to propagate it.** [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) calls itself the "second standalone" and [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) the "third". BA-001 §11's table yields **six standalone specs — SPEC-01, SPEC-06, SPEC-09, SPEC-10, SPEC-11, SPEC-12** — because 22 objects less the six grouped specs' 16 leaves six specs of one object each, and SPEC-08 §6 already corrected the prose to that split. Neither SPEC-01 nor SPEC-06 describes itself as standalone, which is how the sequence started at two. SPEC-11 is therefore the **fifth**, and the Wave 3 ordinal (fourth) is unaffected. Two Approved specs' change-history rows carry the wrong ordinal | **`/refresh-docs`** — raised                                |

### `research/README.md` corrections — four, all applied in this session

| Correction                                                                                                                                                                                                                 | Where     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| §7 gains a **`Workshops — INT-007`** row. The pack routes by stage and by `R-nn`, and RSH-005's only routing entry sent it to Cutover/CNV-005, so a workshop with a dedicated research document had no route to it (D-127) | §7 — done |
| §7's Cutover row said CNV-005 "stays blocked until OI-01 is ruled on"; **D-31 ruled on it**, and CNV-005 now depends on INT-007 existing                                                                                   | §7 — done |
| §3's RSH-005 Feeds cell read `OI-01; CNV-005; D-27` and never named **INT-007 or D-31**, which supersedes D-27                                                                                                             | §3 — done |
| §5's R7 Affects cell read `OI-01, CNV-005` and did not name **INT-007**; R7's owner is recorded in prose, since the table has no Owner column                                                                              | §5 — done |

### BA-001 amendments — two, applied in this session → v1.12: one correction and one completion

INT-007's row had received **no maintenance since it was created at v1.1**, which is the condition
under which INT-006's row accumulated five errors across nine amendments. Every other claim in it was
re-read against RSH-005 and D-31 and still holds.

| Correction                                                                                                                                                                                                                                                                   | Where             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~Traces To reads "PSV P1; OI-01, D-27, D-31; CNV-005, RPT-004"~~ → adds **D-120 … D-128**, **INT-001** (the CAP service layer it reads through, BR-13) and **INT-004** (which writes the TestRun rows whose growth BR-07 answers). The row's own prose named neither object | §4 INT-007 — done |
| The **R7 clause** — "the round-trip is untested" — is **completed rather than corrected**: still untested, but now owned by INT-007's own build, with **R4 settled by the same execution** and SPEC-11 therefore provisional on **R1** (D-121)                               | §4 INT-007 — done |

---

## 7. Functional Unit Tests

**Fifteen FUTs.** FUT-007 through FUT-010 require a real Postgres and are **provisional on R1**; each
says so. Story IDs below are **Financial Planner's** unless the text says otherwise (BA-001 §3.3).

### FUT-001: One file per persisted entity, correctly named

**Covers:** INT-007
**Preconditions:** Project Tracker's database is deployed with the full migration chain run —
CNV-001's methodology library, CNV-002's hierarchy and Milestones, CNV-003's registers, CNV-004's
tie-out ([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-03's strict order; CNV-001 is
[SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md)'s object, not SPEC-03's).
**Steps:**

1. Run `npm run export-state`.

**Expected Result:**

- `Project Tracker/state/` contains **exactly one `.csv` per persisted entity in the CSN**, each named
  `com.lifeos.projecttracker-{Entity}.csv` (BR-01, BR-05).
- **No `.drafts` file is present** (BR-06).
- The process exits **0** and does not hang (BR-12).
- The assertion is a **relation between the file set and the CSN**, not a file count. The entity set is
  not final until the Data Model stage, so a test that hardcodes a number fails on the first entity
  added and passes while one is silently dropped.

### FUT-002: Every column emitted, nothing derived

**Covers:** INT-007
**Preconditions:** FUT-001's.
**Steps:**

1. Read the header row of `com.lifeos.projecttracker-Milestone.csv`.

**Expected Result:**

- It carries **every persisted element** of the CSN entity, including the key, the generated foreign
  keys, and all four of `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy` (BR-03).
- It does **not** carry `status`, which is derived (BR-04,
  [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md) BR-17).

### FUT-003: Idempotence

**Covers:** INT-007
**Preconditions:** The fixture is loaded; one export has already run.
**Steps:**

1. Run `export-state` again, with no intervening write of any kind.

**Expected Result:**

- **Every file is byte-identical** to the previous run (BR-15).
- This is the test BR-14 makes reachable — an Activity-emitting export could not pass it.

### FUT-004: TestRun growth appends rather than scatters

**Covers:** INT-007
**Preconditions:** The fixture is loaded — it carries the seeded TestRun of
[SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-25 at `executedAt` 2026-07-10 (SPEC-03
BR-25a) — and one export has run.
**Steps:**

1. Record a new TestRun through `record_test_run` in **workspace** scope
   ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s eleventh amendment, D-104).
2. Re-export.

**Expected Result:**

- `…-TestRun.csv` differs from the prior export by **exactly one line, appended at the end** (BR-07).
- Every preceding line is unchanged.

### FUT-005: An in-place update does not relocate other rows

**Covers:** INT-007
**Preconditions:** The fixture is loaded and one export has run; at least one Defect is Open — CNV-003
seeds four Defects, of which **Defect D-004** is Open.
**Steps:**

1. Resolve that Defect through `resolve_defect`.
2. Re-export.

**Expected Result:**

- `…-Defect.csv` differs by **exactly that one row's line, changed in place rather than relocated**
  (BR-07).
- `…-Activity.csv` gains **exactly one** line ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-03).
- **Every other file is byte-identical.**
- This is the diffability property `pg_dump` cannot provide — physical row order shifts on `UPDATE`
  (RSH-005 §7).

### FUT-006: A zero-row entity gets a header-only file

**Covers:** INT-007
**Preconditions:** A database at an intermediate point of
[SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-03's strict chain — **CNV-001 and CNV-002
have run, CNV-003 has not** — so the hierarchy and the twelve Milestones exist while Defect, Decision
and TestRun hold no rows. This is a state the chain passes through, not a contrived one.
**Steps:**

1. Run `export-state`.

**Expected Result:**

- `…-Defect.csv` exists and contains **exactly one line, its header** (BR-08).
- The same for `…-Decision.csv` and `…-TestRun.csv`.

### FUT-007: The round-trip drill — managed fields survive

**Covers:** INT-007
_Provisional on R1 — requires Postgres._
**Preconditions:** The fixture is loaded on Postgres; one export has run; `createdAt` and `createdBy`
are captured for every row of every entity.
**Steps:**

1. Drop and recreate the schema.
2. Copy `state/*.csv` into `db/data/`.
3. Run `cds deploy`.
4. Re-read every entity.

**Expected Result:**

- Per-entity row counts match the pre-drop values **and** `createdAt` / `createdBy` match **row for
  row** (BR-19, BR-20).
- Specifically `createdBy = migration` on every migrated row (D-63), and `executedAt = 2026-07-10` on
  the seeded TestRun ([SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) BR-25a).
- **This is R7's drill and it settles R4 in the same act** (D-121).

### FUT-008: Omitting managed fields destroys history while every count passes

**Covers:** INT-007
_Provisional on R1 — requires Postgres._
**Preconditions:** The fixture is loaded on Postgres; an export in which the `createdAt` and
`createdBy` columns have been removed from `…-Decision.csv`.
**Steps:**

1. Drop and recreate the schema.
2. Copy into `db/data/` and run `cds deploy`.
3. Read the Decision rows.

**Expected Result:**

- The row count matches the export **exactly**.
- **And** `createdBy` reads `anonymous`, with `createdAt` at the deploy timestamp
  (`cds-deploy.js:196-204`).
- This is the negative test that gives BR-20 its teeth — it demonstrates the precise failure R7 names.

### FUT-009: Omitting keys fails loudly

**Covers:** INT-007
_Provisional on R1 — requires Postgres._
**Preconditions:** The fixture is loaded on Postgres; an export in which the `ID` column has been
removed from `…-Milestone.csv`.
**Steps:**

1. Drop and recreate the schema.
2. Copy into `db/data/` and run `cds deploy`.

**Expected Result:**

- **The deploy fails** on a foreign-key violation at `COMMIT` — Task rows carry `milestone_ID` values
  referencing Milestone IDs the deploy has re-minted (`cds-deploy.js:191-194`), and the constraints are
  `DEFERRABLE INITIALLY DEFERRED` inside one transaction (RSH-005 §5).
- **Nothing is left partially loaded.**

### FUT-010: Restore is a merge, not a revert

**Covers:** INT-007
_Provisional on R1 — requires Postgres._
**Preconditions:** The fixture is loaded on Postgres; one export has run; afterwards a new Defect is
logged through `log_defect` in **workspace** scope (D-96).
**Steps:**

1. Copy the export into `db/data/`.
2. Run `cds deploy` **without** dropping the schema.

**Expected Result:**

- The post-export Defect is **still present**, and the exported rows have been UPSERTed over the live
  ones (BR-20, `cds-deploy.js:210-211`).
- This demonstrates why BR-19's drill drops the schema first.

### FUT-011: All-or-nothing on failure

**Covers:** INT-007
**Preconditions:** A previous export is present in `state/`.
**Steps:**

1. Run `export-state` with the database made unreachable after the first entity has been read.

**Expected Result:**

- The process exits **non-zero** (BR-21).
- `state/` is **byte-for-byte identical** to the previous export.
- **No partial or temporary file remains in it.**

### FUT-012: Output location is independent of cwd

**Covers:** INT-007
**Preconditions:** A deployed database; nothing else.
**Steps:**

1. Invoke the script **by path from the repo root**, so `process.cwd()` is the repo root rather than
   the module — `npx tsx "Project Tracker/scripts/exportProjectState.ts"`.
2. Run `npm run export-state` from `Project Tracker/`.

**Expected Result:**

- Both runs write to `Project Tracker/state/`, and the resulting files are **byte-identical** (BR-12).
- Neither writes a `state/` folder anywhere else. A `process.cwd()`-derived output path would put
  step 1's files at the repo root, which is the failure this rule prevents.
- This is BR-12's `import.meta.dirname` derivation — D-110's technique doing the work for the output
  path, inside a script D-103's rule puts in the module.

### FUT-013: A stale file is removed

**Covers:** INT-007
**Preconditions:** One export has run; a file `com.lifeos.projecttracker-Obsolete.csv` is placed in
`state/`, naming an entity that is not in the CSN.
**Steps:**

1. Run `export-state`.

**Expected Result:**

- The file is **deleted** (BR-09).
- **Every legitimate file is unchanged.**

### FUT-014: Drafts are excluded

**Covers:** INT-007
**Preconditions:** A **test-fixture model** in which one entity is draft-enabled and carries an active
draft row. The precondition is deliberately a fixture rather than the production model: **no entity in
this module is draft-enabled today** and whether any becomes so is an Information Architecture /
Design System question (BR-06). Asserting the filter against the real model would make this test
vacuous now and silently vacuous later.
**Steps:**

1. Run `export-state` against the fixture model.

**Expected Result:**

- **No file exists for any `.drafts` shadow table** (BR-06).
- The base entity's file carries **only active rows**, and the draft row appears nowhere.

### FUT-015: The checkpoint procedure exists and names the exporter

**Covers:** INT-007
**Preconditions:** None.
**Steps:**

1. Read the checkpoint procedure in `Project Tracker/CLAUDE.md`.

**Expected Result:**

- It names `pg_dump -Fc`, `npm run export-state`, the commit, the `--no-ff` merge and the annotated
  tag, **in that order** (BR-18).
- This is the instruction-side test D-102's finding requires — the same shape as
  [SPEC-08](SPEC-08-CONSUMER-REWIRING.md)'s FUTs over edited instructions.

---

_SPEC-11 specifies INT-007, the project-state exporter, per [BA-001 §11 row 11](../BUSINESS_ARCHITECTURE.md), settling all four concerns that row names — CSV shape, the round-trip drill, R7, and cadence. The service layer it reads through is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s; the fixture its FUTs run against and the seeded TestRun its round-trip must reproduce are [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md)'s; the bootstrap it follows verbatim and the `scripts/` folder it lands in are [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md)'s; and it is the object **SPEC-12 (CNV-005)** must wait for, because the diffable form of state has to exist before the markdown that carried it is retired. **SPEC-11 resolves no OI** — OI-01 was resolved by [D-31](../DECISIONS_LOG.md) and this object implements it — **mints no error key**, and is **provisional on R1**, reversing [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s rule-out ([D-121](../DECISIONS_LOG.md)). **R7 is owned here and R4 is settled in the same execution**; **R9 is ruled out**._
