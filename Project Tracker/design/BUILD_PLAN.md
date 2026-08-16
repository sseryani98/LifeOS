# Build Plan

**Document ID:** BP-001
**Version:** 1.0
**Date:** 2026-08-15
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                              |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-15 | Sandro          | **Status → Approved.** All eleven Phase 5 coverage checks met; the approval gate at step 0 of Phase 6 was answered before the stage closed — the **fourth** stage running, after `DM-001`, `TS-001` and `TST-001`. **Plan + Design is complete; Build opens on `S-00`.** |
| 2026-08-15 | Sandro & Claude | Initial creation from the Project Planning stage. 13 stories, 3 sprints, one story zero, an eight-item deferred docket. Records D-198 … D-209. Story zero resolves the eight things three documents assigned to "the first build story".                                 |

---

## 2. Summary

| Area                   | Ruling                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Story**              | A story **is a spec**, and a story's ID **is its spec's ID**. **13 stories** — `S-00` plus `SPEC-01` … `SPEC-12` (D-198)                                                          |
| **Objects**            | **22**, each claimed by exactly one story. `S-00` claims none — it is the only non-object story                                                                                   |
| **Build order**        | **[BA-001](BUSINESS_ARCHITECTURE.md) §10 and §11 own it.** This document restates neither, and adds only `S-00` at the head (D-201)                                               |
| **Sprints**            | **Three**, one per wave — `PT-W1` (4, including `S-00`), `PT-W2` (4), `PT-W3` (5). A boundary is a checkpoint, not a delivery date (D-202)                                        |
| **Branch and tag**     | **None of its own.** All three sprints run inside Financial Planner's already-open `sprint/W1-S3`, because D-13 puts cutover before that sprint's last story (D-202)              |
| **Prerequisite**       | **One, and it is human** — creating the `project_tracker` Postgres role, before `S-00` (D-200)                                                                                    |
| **Definition of done** | The baseline gate, the nine-stage chain, and the story's Functional Unit Tests **by ID** at the tier [TST-001](TEST_STRATEGY.md) §14.2 assigns (D-204)                            |
| **FUTs**               | **180**, each claimed by exactly one story. `S-00` claims none and carries **one** test of its own, which is what lets the `test` script land without `--passWithNoTests` (D-199) |
| **Shared surfaces**    | Two. `db/schema.cds` + `TrackerService` are created by `SPEC-01`; `app/project-view/` is created by `SPEC-04` and extended by three later stories (D-205)                         |
| **Non-story work**     | **One item** — the Postgres role. Everything else is a story or is docketed                                                                                                       |
| **Deferred docket**    | **Eight items.** Four share one unblocking event, and it is **downstream of `PT-W3`** (D-206)                                                                                     |
| **Progress tracking**  | **None.** `PLAN.md` §8's session log is the record. This module does not track itself in slice 1 (D-207)                                                                          |
| **Risks**              | **None assigned.** R4, R7 and R10 gain a story, a sprint and a FUT for the first time; R11 is docketed (D-209)                                                                    |
| **Enforcement**        | The four gate commands and the **21** `lint:*` scripts. **The story cut, the order, the boundaries, the contracts and the definition of done are enforced by nothing** (§15)      |

---

## 3. The Story List (D-198)

**A story is a spec.** The reason is mechanical rather than aesthetic: [TST-001](TEST_STRATEGY.md)
§14.2 attributes all 180 Functional Unit Tests **per spec and never per object**, and several are
not attributable to one object at all — `SPEC-08` FUT-001 ("no rewired file mentions a retired
markdown path") and FUT-012 span all three of its objects at once. A one-story-per-object cut would
have to re-cut those 180 FUTs, which is re-opening D-194.

**A story's ID is its spec's ID.** The mapping is 1:1 by construction, so a second identifier would
be a second thing to keep in sync. `build-briefer` resolves a story ID straight to a spec file.
`S-00` is the one exception, because it has no spec.

| Story         | Name                             | Objects                   | Spec      | Wave | Ships UI |
| ------------- | -------------------------------- | ------------------------- | --------- | ---- | -------- |
| **`S-00`**    | Module Bootstrap                 | **none** — see §4         | —         | 1    | No       |
| **`SPEC-01`** | MCP Intent-Verb Layer            | INT-001                   | `SPEC-01` | 1    | No       |
| **`SPEC-02`** | Methodology & Stage Enforcement  | CNV-001, ENH-001, WFL-001 | `SPEC-02` | 1    | No       |
| **`SPEC-03`** | Financial Planner Migration Load | CNV-002, CNV-003, CNV-004 | `SPEC-03` | 1    | No       |
| **`SPEC-04`** | Next Action                      | ENH-002, RPT-002          | `SPEC-04` | 2    | **Yes**  |
| **`SPEC-05`** | Workspace Header & Health        | ENH-003, RPT-001, FRM-001 | `SPEC-05` | 2    | **Yes**  |
| **`SPEC-06`** | Sprint Planning                  | FRM-002                   | `SPEC-06` | 2    | **Yes**  |
| **`SPEC-07`** | Chain & Registers                | RPT-003, RPT-004          | `SPEC-07` | 2    | **Yes**  |
| **`SPEC-08`** | Consumer Rewiring                | INT-002, INT-003, INT-005 | `SPEC-08` | 3    | No       |
| **`SPEC-09`** | Test Report → TestRun            | INT-004                   | `SPEC-09` | 3    | No       |
| **`SPEC-10`** | Cutover Guards                   | INT-006                   | `SPEC-10` | 3    | No       |
| **`SPEC-11`** | Project State Exporter           | INT-007                   | `SPEC-11` | 3    | No       |
| **`SPEC-12`** | Decommission                     | CNV-005                   | `SPEC-12` | 3    | No       |

**22 objects, 13 stories, every FRICEW ID exactly once.** The object-to-spec mapping is
[BA-001](BUSINESS_ARCHITECTURE.md) §11.2 and is not restated per-object here.

**The `Ships UI` column is not decoration.** It is the `shipsUi` predicate D-47 rules on, and it
decides two things: whether the chain's **UX Test** stage and the build workflow's **smoke** subtask
run at all (`.claude/workflows/build.js`, PLAN.md §5), and — once this module is loading its own
board — whether a Milestone materialises 9 Tasks or 8. **Four of thirteen ship UI**, which is
`IA-001` §3's six UI-bearing objects grouped into their four specs.

### 3.1 What a per-object cut would have cost — stated, not implied

Recorded because the option was live and rejected for a measurable reason rather than a preference.
`SPEC-02` carries three objects and 18 FUTs; `SPEC-03` carries three and 12; `SPEC-07` two and 18;
`SPEC-08` three and 12. Cutting those four specs into objects produces 22 stories and **60 FUTs with
no owner**, because those specs' §7 sections name outcomes that cross their objects. That is not a
tidy-up; it is a re-run of D-194's classification.

---

## 4. Story Zero & Prerequisites (D-199, D-200)

**Three documents assign work to "the first build story" and one to "the first test story". Neither
story existed.** Measured this session: **17 occurrences of those phrases across 6 files**, resolving
to **eight distinct items**. `S-00` is what they resolve to.

| #     | Item                                                                           | Assigned by                                   | Resolves to                       |
| ----- | ------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------- |
| **1** | `CREATE ROLE project_tracker LOGIN PASSWORD …; GRANT …`                        | [TS-001](TECH_STACK.md) §8, §14 step 2        | **Human prerequisite** — see §4.1 |
| **2** | `Project Tracker/.cdsrc.json` carrying `cds.features.assert_integrity: 'DB'`   | [TS-001](TECH_STACK.md) §9 (D-182)            | `S-00`                            |
| **3** | `Project Tracker/.env` with `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD`             | [TS-001](TECH_STACK.md) §8 (D-181)            | `S-00`                            |
| **4** | Removing `"password": ""` from `Project Tracker/package.json`                  | [TS-001](TECH_STACK.md) §8 (D-181)            | `S-00`                            |
| **5** | The `[development]` profile bound to Postgres                                  | [TS-001](TECH_STACK.md) §10 (D-183)           | `S-00`                            |
| **6** | `"start": "cds serve"` — **not** `cds-serve`                                   | [TS-001](TECH_STACK.md) §7.2 (D-180)          | `S-00`                            |
| **7** | `Standards (Technical + Linting)/scripts/serveOneOrigin.mjs`                   | [TS-001](TECH_STACK.md) §11 (D-184)           | `S-00`                            |
| **8** | `jest.config.ts`, `test/setEnv.ts`, and the `test` + `record-test-run` scripts | [TST-001](TEST_STRATEGY.md) §3.3, §12 (D-186) | `S-00`                            |
| —     | `db/schema.cds` — the 25 persisted entities                                    | [DM-001](DATA_MODEL.md) §3 (D-160)            | **`SPEC-01`** — see §4.2          |

`Project Tracker/.gitignore` already carries `.env`; that one line was applied at the Tech Stack
stage (D-176) precisely so item 3 could not create the hazard it removes.

### 4.1 The one thing that is not a story

**Creating the `project_tracker` Postgres role is a change to a PostgreSQL installation outside this
repository.** No story can own it, no gate can verify it, and no test can create it — `TS-001` §14
step 2 already calls it "a prerequisite of the first build story". It is **Sandro's, before `S-00`
starts**, and `S-00`'s first act is to fail loudly if it is absent: `cds deploy` against a missing
role returns a driver error rather than a silent fallback, because `"password": ""` is removed rather
than left (D-181, and D-168's measurement that a falsy password throws client-side before the
handshake).

### 4.2 Why the schema is `SPEC-01`'s and not `S-00`'s

D-160 says the CDS files are "`CNV-001`'s and `INT-001`'s work in the Build Plan's order". That order
is now stated: **`SPEC-01` declares `db/schema.cds` in full.** `INT-001`'s eleven verbs read and write
every entity in [DM-001](DATA_MODEL.md), and `CNV-001` sits one story later inside `SPEC-02`, so a
split schema would leave `SPEC-01` unable to run its own tests. `S-00` deliberately writes no CDS: a
schema in the bootstrap story would be code no spec's tests cover, which is what D-160 refuses one
level up.

### 4.3 `S-00` carries a test, and that is the point

**A `test` script over an empty test tree exits 1.** `TST-001` §3.3 measured it: `jest` with no
matching tests exits **1**, `jest --passWithNoTests` exits **0**, and D-186 rules the script lands
**without** the flag so an empty run is loud. A bootstrap story that added the runner and no test
would therefore hand `SPEC-01` a red gate on day one.

`S-00` resolves this by shipping **one script-tier test over `serveOneOrigin.mjs`** — item 7 is a
real Node entry point with observable behaviour that `TS-001` §11 specifies exactly (route
`/service/trackerSvcs` to :4005, everything else to :4004, no CORS headers, no manifest change). It
lands in `test/script/{data,support,tests}/` per `TST-001` §12, and it sits inside that tier's stated
ceiling — it starts its own two trivial `node:http` origins and assumes **no CAP server it did not
start** (`TST-001` §5).

So **`S-00` is the first build story and the first test story at once**, and D-186's pairing — script
and config land _with_ the first test — holds exactly rather than by exception.

> **The option rejected:** `S-00` adds `jest.config.ts` and `test/setEnv.ts` but not the `test`
> script, leaving the script to `SPEC-01`. It works, and it splits one ruling across two stories for
> no gain now that a legitimate first test exists.

---

## 5. Build Order (D-201)

**[BA-001](BUSINESS_ARCHITECTURE.md) §10 and §11 own the order. This document restates neither, and
that is deliberate.**

§10 already carries the three waves and their testable increments, the **critical path (7 deep:
CNV-001 → ENH-001 → CNV-004 → WFL-001 → RPT-003 → INT-002 → CNV-005)**, the **widest fan-in**
(CNV-005, blocked on all six other Interfaces objects) and the **widest fan-out** (INT-001). §11
states that **spec number is build order** (D-37), which is why §11 itself declares no second
ordering table is needed.

Copying any of that here would produce two orderings in two documents, which drift. This document
adds exactly one thing to the order: **`S-00` at the head**, before `SPEC-01`.

`BA-001` §10 gains a one-line pointer back to this document (§17, amendment 4) so a reader arriving
at the wave plan learns the story cut and the sprint mapping live here, and a reader arriving here
learns the order lives there.

---

## 6. Sprint Plan (D-202)

**Three sprints, one per wave.** Each wave in `BA-001` §10 is already defined as a testable
increment, so the boundary is earned rather than invented. Splitting a wave would create a boundary
no design document justifies — and §7 shows a boundary is not decorative here.

| Sprint      | Wave | Stories                                    | Count | The increment (`BA-001` §10)                                                                       |
| ----------- | ---- | ------------------------------------------ | ----- | -------------------------------------------------------------------------------------------------- |
| **`PT-W1`** | 1    | `S-00`, `SPEC-01`, `SPEC-02`, `SPEC-03`    | 4     | The store exists and can be written. Financial Planner's real history is in it, verified by query  |
| **`PT-W2`** | 2    | `SPEC-04`, `SPEC-05`, `SPEC-06`, `SPEC-07` | 4     | Sandro can see and steer it. PSV falsifiable check 3 becomes testable                              |
| **`PT-W3`** | 3    | `SPEC-08` … `SPEC-12`                      | 5     | Cutover. PSV falsifiable check 1 — Financial Planner's `CNV-001` runs its whole chain, no markdown |

### 6.1 No branch, no merge, no tag of its own — and the reason is D-13

The shared git workflow gives a sprint a branch (`sprint/W{wave}-S{sprint}`), a `--no-ff` merge and
an annotated tag (`v{wave}.{sprint}`). **Project Tracker's three sprints get none of the three**, and
this is a consequence rather than a preference.

D-13 puts cutover **before** Financial Planner's `CNV-001`, that module's last W1-S3 story. So the
whole of `PT-W1` … `PT-W3` runs while Financial Planner's `sprint/W1-S3` is open. Measured this
session: the repository carries branches `main`, `sprint/W1-S1`, `sprint/W1-S2`, `sprint/W1-S3`
(current) and tags `v1.1`, `v1.2` — Financial Planner's. A `PT-W1` tag under the `v{wave}.{sprint}`
scheme would collide with that sequence, and a separate Project Tracker branch would have to be
merged back across `.claude/` and `Financial Planner/CLAUDE.md`, the exact files `SPEC-08` and
`SPEC-12` rewrite.

**Everything commits to `sprint/W1-S3`**, per story, under the existing Conventional Commits
convention with scope `tracker`. The one `--no-ff` merge and the one tag at the end of that branch
belong to Financial Planner's W1-S3, and land after cutover and after that module's `CNV-001`.

---

## 7. Checkpoint Procedure (D-203)

**A sprint boundary runs three things, and one of them only exists at the third boundary.**

| At every boundary                            | What runs                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1. The wave's **testable increment**         | The verification `BA-001` §10 states for that wave, run end to end rather than inferred from green stories                    |
| 2. A **`PLAN.md` §8 session entry**          | The record, since §15 rules this module tracks itself nowhere else                                                            |
| 3. **`INT-007`'s CSV export** — `PT-W3` only | D-31 sets the exporter's cadence at **per sprint checkpoint**. It does not exist until `SPEC-11`, so `PT-W3` is its first run |

### 7.1 Two corrections to what the boundary was assumed to run

**`INT-004`'s `recordTestRun` does not fire at a checkpoint.** D-196 puts it at **both gate call
sites, per story, whatever the exit code**, because npm skips a `post` script when the main script
exits non-zero (D-107) and a failing run is the run worth recording. Anything describing it as a
checkpoint activity is describing `INT-007`.

**There is no ten-persona checkpoint meeting.** The exemplar's `PROJECT_MANAGEMENT.md` §5 convenes
ten personas across four phases. This repo's reviewers are agents with slash commands — `/code-quality`,
`/test-quality`, `/functional-test`, `/ux-test`, `/human-review-loop` — and they run **per story**
inside the chain (§14), not per sprint in a meeting. Stated as a "none" rather than dropped.

### 7.2 The third boundary is the cutover

`PT-W3`'s checkpoint is not a review. It is `SPEC-12`'s ordered decommission sequence with its proof
step (D-131), and it is where the **seven one-time verifications** (§9) and **R10** are recorded. It
is also the point at which both `INT-006` guards are enabled — never before (D-07).

---

## 8. Definition of Done (D-204)

A story is Done when **both** parts pass. Neither is optional and neither is sufficient.

### 8.1 Part A — the baseline gate, identical for every story

| Check                | Command                     | Bar                                                                                                                                                |
| -------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types                | `npx tsc --noEmit`          | Zero errors                                                                                                                                        |
| Lint                 | `npm run lint`              | Zero errors — **21 `lint:*` scripts**, measured in this module's 24-script block                                                                   |
| Tests + coverage     | `npm test`                  | Green, and Jest's `coverageThreshold` met: Validators 100/100, Services + verbs + scripts 90/85, Overall 85/80 ([TST-001](TEST_STRATEGY.md) §13.1) |
| CDS build            | `npm run build`             | Zero errors                                                                                                                                        |
| The nine-stage chain | `/build` and its successors | Every Required stage complete; `UX Test` complete on a `shipsUi` story (§14)                                                                       |

### 8.2 Part B — the story's Functional Unit Tests, by ID

**A story owns every FUT in its spec, named by ID — `FUT-001` through the spec's last.** A count
cannot be checked; an ID range can. The per-story figures are §9.

The **tier** each FUT lands at is decided by `TST-001` §14.1's rule — the outermost tier that can
observe it, once — and the per-spec distribution `TST-001` §14.2 fixes. This document does not
re-assign tiers and must not.

### 8.3 What "done" means for the tests that are not runner tests

**163 of 180 run under Jest** (59 verb, 59 script, 41 OData, 4 protocol) and are covered by Part A.
The other 17 need an explicit completion condition or the stories carrying them cannot be finished.

| Class                     | Count | Whose stories                         | Done when                                                                                                                                                                                                                                           |
| ------------------------- | ----- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Browser**               | 10    | `SPEC-05` 1, `SPEC-06` 1, `SPEC-07` 8 | `/functional-test` → `functional-tester` reports **pass** for each named FUT ID, against the real servers behind the proxy. It is chain stage 4 and already Required                                                                                |
| **One-time verification** | 7     | `SPEC-08` 1, `SPEC-12` 6              | **Recorded, not re-run** (`TST-001` §14.3). `SPEC-12`'s six are recorded in `CNV-005`'s own decommission procedure at the `PT-W3` checkpoint; `SPEC-08`'s one is recorded in that story's handoff, because rewiring is not part of the decommission |

**The browser ten are not a gap and must not be re-asserted in Jest** — that is the double assertion
`TST-001` §14.1 forbids. The one-time seven assert that a deletion happened, which is true forever
afterward.

---

## 9. Per-Story Test Obligations

Taken from [TST-001](TEST_STRATEGY.md) §14.2 without adjustment. **Every FUT is claimed by exactly
one story and the columns total that table exactly.**

| Story     | FUT IDs           | FUTs    | Verb (A) | OData (B) | Protocol | Script | Browser | One-time |
| --------- | ----------------- | ------- | -------- | --------- | -------- | ------ | ------- | -------- |
| `S-00`    | **none**          | **0**   | —        | —         | —        | —      | —       | —        |
| `SPEC-01` | FUT-001 … FUT-016 | 16      | 13       | —         | **3**    | —      | —       | —        |
| `SPEC-02` | FUT-001 … FUT-018 | 18      | 18       | —         | —        | —      | —       | —        |
| `SPEC-03` | FUT-001 … FUT-012 | 12      | 12       | —         | —        | —      | —       | —        |
| `SPEC-04` | FUT-001 … FUT-016 | 16      | 10       | 6         | —        | —      | —       | —        |
| `SPEC-05` | FUT-001 … FUT-014 | 14      | —        | 13        | —        | —      | 1       | —        |
| `SPEC-06` | FUT-001 … FUT-015 | 15      | —        | 13        | **1**    | —      | 1       | —        |
| `SPEC-07` | FUT-001 … FUT-018 | 18      | 1        | 9         | —        | —      | **8**   | —        |
| `SPEC-08` | FUT-001 … FUT-012 | 12      | 3        | —         | —        | **8**  | —       | 1        |
| `SPEC-09` | FUT-001 … FUT-013 | 13      | —        | —         | —        | **13** | —       | —        |
| `SPEC-10` | FUT-001 … FUT-016 | 16      | —        | —         | —        | **16** | —       | —        |
| `SPEC-11` | FUT-001 … FUT-015 | 15      | —        | —         | —        | **15** | —       | —        |
| `SPEC-12` | FUT-001 … FUT-015 | 15      | 2        | —         | —        | **7**  | —       | **6**    |
| **Total** |                   | **180** | **59**   | **41**    | **4**    | **59** | **10**  | **7**    |

**Re-measured against the specs themselves this session** rather than carried from `TST-001`: the
per-spec FUT counts are 16, 18, 12, 16, 14, 15, 18, 12, 13, 16, 15, 15 = **180**, and the business
rules are 33, 33, 38, 34, 37, 31, 36, 33, 23, 29, 21, 18 = **366**. Both agree with `TST-001` §14
exactly.

**`S-00` claims no FUT, and that is a stated none, not an omission.** It implements design-document
rulings rather than a spec, and no spec carries the proxy or the runner config. Its one test (§4.3)
is therefore a test of specified behaviour with no FUT behind it — which is consistent with
`TST-001` §14.1, where unit and script tests are driven by rules and specifications rather than by
FUTs.

### 9.1 Unit tests are not in this table, by construction

The `Unit` column of `TST-001` §14.2 is empty, and so is this one. Unit tests are driven by the
**366 business rules and the coverage thresholds**, not by the 180 FUTs (D-194). A story's unit
tests are therefore bounded by Part A of the definition of done, not by Part B.

---

## 10. Cross-Story Contracts (D-205)

What each story hands the ones after it. A story that consumes a row below must not create it again.

| Producer      | Artifact                                                                                                                                                                                          | Consumed by                                | The contract                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`S-00`**    | `.cdsrc.json`, `.env`, the Postgres `[development]` profile, `"start": "cds serve"`, `serveOneOrigin.mjs`, `jest.config.ts`, `test/setEnv.ts`, the `test` + `record-test-run` scripts             | every later story                          | `npm start` serves on :4005; the proxy fronts :4000; `npm test` runs; `CDS_TYPESCRIPT` is set by `setupFiles` and never per spec                           |
| **`SPEC-01`** | `db/schema.cds` (25 persisted entities), `srv/tracker-service.{cds,ts}` — one service `TrackerService` at `/service/trackerSvcs` — the `ProjectView` projection, `mcp/server.ts` and `mcp/verbs/` | every later story                          | `cds deploy` succeeds against Postgres; `cds.connect.to('TrackerService')` + `srv.tx({ user })` reaches the real handlers (D-189); the eleven verbs answer |
| **`SPEC-02`** | The seeded Methodology library, chain instantiation, and the guard set                                                                                                                            | `SPEC-03`, `SPEC-04`, `SPEC-07`, `SPEC-08` | A Milestone created in Backlog materialises **9** Tasks on a `shipsUi` story and **8** otherwise, with 7 Subtasks under `sprint-build` alone               |
| **`SPEC-03`** | The loaded workspace — 1 Area, 1 Engagement, 1 Workspace, 3 Initiatives, 12 Milestones, 4 Defects, 5 Decisions, 1 TestRun, 2 Activity rows                                                        | `SPEC-04` … `SPEC-07`, `SPEC-11`           | `CNV-004`'s reconciliation ties out. Every Report reads real data rather than a fixture; the exporter has rows to export                                   |
| **`SPEC-04`** | **`app/project-view/`** — the one FPM app, its `manifest.json`, `Component.ts` and the single route with its optional `story` parameter (`IA-001` §4)                                             | `SPEC-05`, `SPEC-06`, `SPEC-07`            | Later UI stories **add sections and a dialog to this app**. No story creates a second app, a second route or a second component                            |
| **`SPEC-09`** | `Project Tracker/scripts/` and `recordTestRun.ts`                                                                                                                                                 | the gate, from `SPEC-09` onward            | Both gate call sites invoke `npm run record-test-run` explicitly, after the test command, whatever its exit code (D-107)                                   |
| **`SPEC-10`** | `Standards (Technical + Linting)/retired-paths.json` (5 records), `lintNoMarkdownState.ts`, and the hook installer — **all delivered unregistered** (D-07, `SPEC-10` BR-25)                       | `SPEC-12`                                  | `SPEC-12` runs the installer and enables both guards. Neither is enabled earlier; `SPEC-10` FUT-014 asserts that                                           |
| **`SPEC-11`** | The CSV exporter, and the round-trip drill it runs                                                                                                                                                | `SPEC-12`                                  | `CNV-005` cannot retire markdown until the diffable form of state exists (`BA-001` §10, D-31)                                                              |

### 10.1 The two shared surfaces, named rather than discovered

The exemplar found its equivalent late — its sync point 6 ("dashboard shells accept new sections")
was written after two Reports had already been cut in half across sprints. Both of this module's are
stated up front:

1. **`db/schema.cds`, created by `SPEC-01`.** [DM-001](DATA_MODEL.md) consolidates all twelve specs
   into 25 persisted entities, so **no story after `SPEC-01` adds an entity.** A story that finds it
   needs one has found a Data Model amendment, not a build task.
2. **`app/project-view/`, created by `SPEC-04`.** `IA-001` §3 puts all six UI-bearing objects on
   **one page** behind **one route**, and `SPEC-04` is the first wave-2 story. `SPEC-05`, `SPEC-06`
   and `SPEC-07` extend that app.

---

## 11. Non-Story Work

**One item, and it is §4.1's:** creating the `project_tracker` Postgres role. Measured rather than
assumed — every other thing this plan needs is inside a story or on §12's docket.

Two candidates were checked and are **not** non-story work:

- **`Project Tracker/.gitignore` gaining `.env`.** Already applied at the Tech Stack stage (D-176).
- **A shared linter asserting the `setupFiles` lever.** [TST-001](TEST_STRATEGY.md) §17.2 names it as
  "a candidate for whoever writes the Build Plan, not specified as work". **Ruled: no new linter**
  (D-208). A shared linter is a Standards change with no story owning it, which is what D-22 refuses
  one level up. The lever gets an **in-module guard instead**: `SPEC-01`'s definition of done carries
  one assertion, in `test/integration/`, that `CDS_TYPESCRIPT` is set at test time. `SPEC-01` is the
  earliest story that can carry it, because it is the first with a `.ts` service implementation to
  load.

---

## 12. Deferred Change Docket (D-206)

**Changes that are real, are owed, and must not land inside a sprint in this plan.** Each names its
unblocking event, because "deferred" without one is half a ruling.

| #     | Change                                                                                                                                                                    | Raised by                             | Why not in a sprint                                                                                                                                                    | Unblocked by                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **1** | Add `@sap/cds-dk` as a **pinned root devDependency** — settles **R11**                                                                                                    | [TS-001](TECH_STACK.md) §16 (D-185)   | Collides with D-34: `cds-dk` depends on `@sap/cds` and lands in the hoisted tree, so it must run with the suite green either side — and the other module is mid-sprint | **Financial Planner's W1-S3 closes** |
| **2** | `Financial Planner/package.json` `"start": "cds-serve"` → `cds serve`, over four `.ts` services                                                                           | [TS-001](TECH_STACK.md) §15 am. 5     | A runtime behaviour change in another module, mid-sprint                                                                                                               | **Financial Planner's W1-S3 closes** |
| **3** | `@sapui5/types` declared `^1.136.16` in both modules, resolving **1.150.0** against a 1.136.16 runtime                                                                    | [TS-001](TECH_STACK.md) §15 am. 6     | A shared dependency change touching a module mid-sprint                                                                                                                | **Financial Planner's W1-S3 closes** |
| **4** | Financial Planner's namespace rename `com.financialplanner` → `com.lifeos.financialplanner` — 65 files, 192 occurrences                                                   | D-16, root `CLAUDE.md`                | Its own change, explicitly after W1-S3                                                                                                                                 | **Financial Planner's W1-S3 closes** |
| **5** | `Financial Planner/design/TEST_STRATEGY.md` §8.3 / §3.3 — three coverage-config discrepancies plus two omitted settings                                                   | [TST-001](TEST_STRATEGY.md) §18 am. 6 | Another module's D-12 markdown                                                                                                                                         | A `/refresh-docs` sweep              |
| **6** | `Financial Planner/design/THEME.md` §6.3 — the theme CSS is injected by `app/shell/Component.ts` via `includeStylesheet`, not by a `<link>` in `index.html` as documented | The Theme stage                       | Same class                                                                                                                                                             | A `/refresh-docs` sweep              |
| **7** | `Financial Planner/design/DESIGN_SYSTEM.md` — Warm Charcoal `#3D3A38` still named as the brand, superseded by that module's D-314                                         | The Theme stage                       | Same class                                                                                                                                                             | A `/refresh-docs` sweep              |
| **8** | The `/refresh-docs` sweep itself — 32 references across six `Financial Planner/design/*.md` files, plus this module's six known stale items                               | D-12, `BA-001` §3.8, `SPEC-12` BR-11  | Documentation rather than catalogued work (D-23), and `SPEC-12` BR-11 explicitly excludes it from `CNV-005`                                                            | A `/refresh-docs` sweep              |

### 12.1 The finding: four items share one event, and it is downstream of this plan

**Items 1–4 all unblock on the same thing — Financial Planner's W1-S3 closing — and that event is
downstream of `PT-W3`.** D-13 puts cutover before Financial Planner's `CNV-001`, which is that
sprint's last story, so the ordering is: `PT-W1` → `PT-W2` → `PT-W3` (cutover) → Financial Planner's
`CNV-001` → W1-S3 closes → items 1–4.

The consequence is worth stating plainly: **no repo-wide dependency change can land at any point
during this build.** Anyone tempted to "just pin `cds-dk` while we're in here" is proposing to do it
inside a sprint on a module they are not building.

**`S-00` inherits R11 rather than settling it.** Item 6 of §4 changes this module's `start` script to
`cds serve`, which depends on the globally-installed unpinned `@sap/cds-dk@9.7.2` that appears in no
file in this repository. That is the cost `TS-001` §7.2 already priced, carried knowingly.

---

## 13. Progress Tracking (D-207)

**None. This module tracks its own build nowhere, and that is a ruling.**

| Candidate                                   | Why not                                                                                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project Tracker's own database              | `CNV-002` loads exactly **one** Workspace — "Financial Planner" (`BA-001` §5, D-11). Nothing in slice 1 creates a second one; `FRM-002`'s carve-out rules out a hierarchy maintenance form, and none of the eleven verbs creates a Workspace |
| `Financial Planner/project/SPRINT_BOARD.md` | That board is Financial Planner's, its rows are that module's stories, and `SPEC-12` deletes the file at cutover                                                                                                                             |
| A new markdown board for Project Tracker    | It would be a new unconstrained markdown artifact, which is the defect `PSV-001` §2 names and this module exists to fix                                                                                                                      |

**The record is `PLAN.md` §8's session log**, which has carried every stage of this module so far and
extends to Build — one entry per story, in the shape §8 already uses.

**The consequence, stated rather than glossed: this module does not dogfood itself in slice 1.** It
is the same boundary `BA-001` §3.2 draws for PSV problem P2 — v1 serves Financial Planner and only
Financial Planner — and it is deliberate. Onboarding Project Tracker as a second Workspace is a later
slice's work, not a build task smuggled into this one.

---

## 14. Build Chain & Invocation

**A story is driven by the repo's existing chain. This document schedules work through it and
specifies none of it.** The chain is `PLAN.md` §5 and, authoritatively, `SPEC-02` §3.1.

| #   | Stage           | Driver                                   | Kind                        |
| --- | --------------- | ---------------------------------------- | --------------------------- |
| 1   | Sprint Build    | `/build` → `.claude/workflows/build.js`  | Required — 7 subtasks       |
| 2   | Code Quality    | `/code-quality`                          | Required                    |
| 3   | Test Quality    | `/test-quality`                          | Required                    |
| 4   | Functional Test | `/functional-test` → `functional-tester` | Required                    |
| 5   | UX Test         | `/ux-test` → `ux-tester`                 | **Conditional — `shipsUi`** |
| 6   | Human Review    | `/human-review-loop`                     | Required — manual, Sandro   |
| 7   | Documentation   | `/refresh-docs`                          | Recommended                 |
| 8   | PM Update       | `/pm-update`                             | Required — but see §14.1    |
| 9   | Commit          | `/commit-diff`                           | Required                    |

**No prompt playbook is written.** The exemplar's `BUILD_PLAN.md` §6 carries 32 hand-authored prompts
because it predates the agent fleet; `/build <story>` now resolves the brief through `build-briefer`
against the spec, which is what a story ID being a spec ID (§3) makes trivial.

### 14.1 `/pm-update` reconciles nothing on a Project Tracker story, until cutover

Stage 8 is Required and its checks are **Financial-Planner-scoped**: sprint board against defect log
against checkpoints against git. §13 rules that Project Tracker's own stories appear on none of
those. So on stories `S-00` … `SPEC-12` the stage runs and correctly finds nothing to reconcile.

That is not a defect and it is not a reason to skip the stage — `SPEC-02` §3.1 seeds `pm-update` as a
Required blocking step at position 80, and D-97 records that deleting it would make
`complete_stage('commit')` permanently unreachable. It is stated so a build persona does not read an
empty result as a broken tool. `SPEC-08` (`INT-003`) is the story that redesigns the skill.

---

## 15. Enforcement

**This stage has the least mechanical backing of any in the chain. Saying which parts are checked and
which are not is this section's whole job.**

### 15.1 Enforced

| Rule                                                   | By                                                       | Status                                                                         |
| ------------------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| The gate's four commands (§8.1)                        | `gate-runner` in the `/build` chain                      | **Live** — the chain already runs them                                         |
| Coverage thresholds                                    | Jest `coverageThreshold`                                 | Live from `S-00`, when `jest.config.ts` lands                                  |
| Test file structure, test data rules, no CQL in a spec | `lint:test-structure`, `lint:test-data`, `lint:test-cql` | **Live** — three of this module's 21 `lint:*` scripts, green on the empty tree |
| Facades hold zero logic                                | `lint:facades`                                           | **Live**                                                                       |
| A `CLAUDE.md` enforcement claim names a real script    | `lint:doc-claims`                                        | **Live**                                                                       |
| The guards are delivered unregistered (§10, D-07)      | `SPEC-10` FUT-014                                        | A test, not a linter — but a real mechanical check                             |

### 15.2 Enforced by nothing

| Rule                                            | Consequence if broken                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| **The story cut and the story order**           | A story starts before the thing it depends on exists                      |
| **The sprint boundaries and what runs on them** | A checkpoint passes without the wave's increment ever being run           |
| **The definition of done as a whole**           | The gate is green and Part B was never checked                            |
| **The cross-story contracts (§10)**             | A second app, a second route, or an entity added outside the Data Model   |
| **"Not inside a sprint" (§12)**                 | A pinned-dependency raise lands mid-sprint and red-lines the other module |
| **The FUT-to-story mapping (§9)**               | Specified behaviour nobody built, or a FUT written twice                  |

**No new linter is proposed** (§11, D-208). Every one of the six rules above would need a Standards
change with no story owning it, which is D-22 one level up.

---

## 16. Amendments

**Five. All applied in-session.**

| #   | Target                                                   | Change                                                                                                                                                                                                                                                 | Status      |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1   | [PLAN.md](../PLAN.md) §1, §3, §8, §9                     | Status line, stage table rows 12 and 13, a session entry, and a related-documents row for this document                                                                                                                                                | **Applied** |
| 2   | [research/README.md](../research/README.md) §7           | Gains a **Project Planning row**, which it has never had. **Sixth occurrence** of the defect D-135 named — §7 is written when a document is created and not maintained when a consumer is added — and the third time the consuming stage fixed its own | **Applied** |
| 3   | [CLAUDE.md](../CLAUDE.md) §Status                        | "the first build story" and "the first test story" now name **`S-00`** (§4). The phrases were unresolvable while no story of either name existed                                                                                                       | **Applied** |
| 4   | [BUSINESS_ARCHITECTURE.md](BUSINESS_ARCHITECTURE.md) §10 | Gains a one-line pointer stating that it remains the owner of the wave order and that the story cut, the sprint mapping and the definition of done are BP-001's. Prevents the two-orderings drift §5 refuses                                           | **Applied** |
| 5   | [TEST_STRATEGY.md](TEST_STRATEGY.md) §17.2               | Its linter candidate is ruled on: **no new linter**, an in-module assertion in `SPEC-01` instead (D-208). §17.2 said the item was "named as a candidate for whoever writes the Build Plan"                                                             | **Applied** |

**Nothing is raised and owed.** The six items on §12's docket were already raised by earlier stages
and are docketed rather than newly raised here.

---

## 17. Risks (D-209)

**None assigned to this stage — and that is a check, not an assumption.**
[research/README.md](../research/README.md) §5's live rows were read this session, and §7's routing
table was read and found to have **no Project Planning row at all** (§16, amendment 2).

**What is new is that three risks become schedulable for the first time.** Until now they had an
owner and no date, because each needs a built thing that did not exist.

| Risk       | Disposition                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R4**     | **Scheduled** — `SPEC-11`, sprint `PT-W3`, settled by its FUT-007 round-trip drill. **Owner unchanged**: `INT-007`'s own build (D-121). Scheduling is not owning                                                                   |
| **R7**     | **Scheduled** — the same story, the same sprint, the same FUT (`TST-001` §14.4 gave the drill its tier and home). **Owner unchanged** (D-121). **Deadline: before `SPEC-12` runs**, which the sprint order now guarantees          |
| **R10**    | **Scheduled** — `SPEC-12`, sprint `PT-W3`, settled by its **FUT-012** ("The hook denies and allows — R10 settles"). **Owner unchanged**: `CNV-005` (D-119). D-07 makes the settling event and the enablement event the same event  |
| **R11**    | **Docketed** — §12 item 1. It cannot run inside any sprint in this plan (D-34 plus D-13), so it gets an unblocking event rather than a date. **Owner unchanged**: whoever next raises the `@sap/cds` pin (D-185). Not settled here |
| **R1, R9** | Closed and `Verified` (D-170, D-184). Not re-opened                                                                                                                                                                                |
| **R3, R8** | Dissolved by D-29. Their rows in `research/README.md` §5 are still unstruck — a known `/refresh-docs` item on §12's docket, not this stage's to fix                                                                                |

**No risk is created here.**

---

## 18. Open Items Resolved

**None — and that is measured, not assumed.** All five were closed before this stage opened: OI-01
(D-31), OI-02 (D-29, D-30), OI-03 (D-35), OI-04 (D-70) and OI-05 (D-161), the last, at Data Model.
`PSV-001` §8 is the register and it carries no sixth row. **This stage opens none.**

---

## 19. Decisions Reference

| ID        | Title                                                                         | Summary                                                                                                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-198** | A story is a spec, and its ID is its spec's ID                                | `TST-001` §14.2 attributes all 180 FUTs per spec and never per object, and four specs carry FUTs that span their objects. A per-object cut leaves ~60 FUTs unowned and re-runs D-194. 13 stories: `S-00` plus `SPEC-01` … `SPEC-12`                                         |
| **D-199** | `S-00 Module Bootstrap`, and it carries one test                              | Resolves all eight things three documents assigned to "the first build story" / "the first test story". It ships a script-tier test over `serveOneOrigin.mjs`, because a `test` script over an empty tree exits 1 and D-186 forbids `--passWithNoTests`                     |
| **D-200** | The Postgres role is a human prerequisite, not a story                        | A change to a PostgreSQL installation outside this repository. No story owns it, no gate verifies it, no test creates it. Sandro's, before `S-00`; `cds deploy` fails loudly if it is absent                                                                                |
| **D-201** | `BA-001` §10 and §11 own the build order; BP-001 restates neither             | The waves, the 7-deep critical path, the widest fan-in and fan-out, and D-37's "spec number is build order" already exist. Two orderings drift. This plan adds `S-00` at the head and a reciprocal pointer in §10                                                           |
| **D-202** | Three sprints, one per wave, with no branch, no merge and no tag of their own | Each wave is already a testable increment. D-13 puts cutover before Financial Planner's `CNV-001`, so all three run inside its open `sprint/W1-S3`. Measured: tags `v1.1` and `v1.2` exist, so a `PT-W1` tag under `v{wave}.{sprint}` would collide                         |
| **D-203** | What runs on a boundary — and two corrections to what was assumed to          | The wave's testable increment, a `PLAN.md` §8 entry, and `INT-007`'s export at `PT-W3` only (D-31). **`recordTestRun` fires per gate, not per checkpoint** (D-196), and there is **no ten-persona meeting** — the reviewers are per-story slash commands                    |
| **D-204** | Definition of done — the gate, the chain, and the story's FUTs by ID          | A count cannot be checked; an ID range can. 163 of 180 are covered by the gate. The 10 browser FUTs are done when `/functional-test` passes them; the 7 one-time are **recorded, not re-run** — `SPEC-12`'s six in `CNV-005`'s procedure, `SPEC-08`'s one in its handoff    |
| **D-205** | Two shared surfaces, named up front                                           | `db/schema.cds` + `TrackerService` created by `SPEC-01`, and **no story after it adds an entity** — a story that needs one has found a Data Model amendment. `app/project-view/` created by `SPEC-04` and extended by `SPEC-05` … `SPEC-07`; no second app, no second route |
| **D-206** | An eight-item deferred docket, four sharing one unblocking event              | Every raised-and-owed amendment and pinned-dependency raise in the repo, each with what unblocks it. Items 1–4 all wait on Financial Planner's W1-S3 closing, which D-13 puts **downstream of `PT-W3`** — so no repo-wide dependency change can land during this build      |
| **D-207** | This module tracks its own build nowhere; `PLAN.md` §8 is the record          | `CNV-002` loads one Workspace and nothing in slice 1 creates a second; Financial Planner's board is that module's and `SPEC-12` deletes it; a new markdown board is the defect this module exists to fix. Cost stated: no dogfooding in slice 1                             |
| **D-208** | No linter for the `setupFiles` lever; `SPEC-01` carries an assertion instead  | `TST-001` §17.2 left it as a candidate. A shared linter is a Standards change with no story owning it (D-22 one level up). `SPEC-01` is the earliest story with a `.ts` implementation to load, so the guard lives in its `test/integration/`                               |
| **D-209** | No risk assigned; three become schedulable and one is docketed                | Register checked rather than assumed, and §7 had no Project Planning row. R4 and R7 → `SPEC-11` FUT-007, R10 → `SPEC-12` FUT-012, all three keeping their owners. R11 is docketed because it cannot run inside any sprint here                                              |

---

_This document is the build sequence for Project Tracker — what a story is, what must exist before the
first one, how stories group, what finishing one means, what each hands the next, and what must wait.
It settles the **4** distinct questions the design documents defer to this stage by name across **4**
files, and resolves the **8** things they assigned to a story that did not exist. The build order
itself is [BA-001](BUSINESS_ARCHITECTURE.md) §10 and §11 and is deliberately not restated. What a test
may assert is [TST-001](TEST_STRATEGY.md); what runs the module is [TS-001](TECH_STACK.md); what it
stores is [DM-001](DATA_MODEL.md). **No source file, schema, test or config is written here** — that
is `S-00`'s and `SPEC-01`'s, on D-160's and D-176's reasoning._
