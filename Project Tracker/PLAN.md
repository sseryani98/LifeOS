# Project Tracker — Plan

**Status:** Plan phase — Ideate, Scope, Research, Scaffold, Workshops, Information Architecture **and
Design System complete** (grouping settled, `SPEC-01` … `SPEC-12`; **12 of 12 written and all twelve
Approved**; `IA-001` **Approved**; `DS-001` written, **Draft**). Next stage is **Theme**.
**Last updated:** 2026-08-06
**Purpose:** The continuity document. Anyone (or any fresh chat) picking up Project Tracker
starts here. Read this, then `design/PROBLEM_STATEMENT_AND_VISION.md` (PSV-001),
`design/BUSINESS_ARCHITECTURE.md` (BA-001) and `design/DECISIONS_LOG.md` for the full
decision rationale.

---

## 1. Where we are right now

Financial Planner is mid-sprint **W1-S3 — Transaction Processing**, with one story left in
Backlog (`CNV-001` Historical backfill) and nothing In Progress. That gap is deliberate — it
is the cutover window.

**Design System is complete.** `design/DESIGN_SYSTEM.md` (DS-001, **Draft**) rules **Fiori Elements
FPM for all six UI-bearing objects with draft enablement OFF** (D-144), which is the answer the Data
Model stage was waiting for, and it names the **browser read path** nobody had ever specified (D-145).
`IA-001` is **Approved**. Decisions run **D-01 … D-152**.

Project Tracker has a PRD, `design/PROBLEM_STATEMENT_AND_VISION.md` (PSV-001, **Draft**),
`design/BUSINESS_ARCHITECTURE.md` (BA-001 v1.13, **Approved** — 22 objects in 3 waves, grouped into
12 specs), a `research/` pack of six documents, a decisions log (D-01 … D-152), a wired module folder,
**twelve written specs — `SPEC-01` … `SPEC-12`, all twelve Approved** (`SPEC-01` flipped from Draft at
the `SPEC-12` workshop, discharging D-93 — D-136) — and the
Plan-phase skills installed in `.claude/`. **No module code exists yet.** Ideate, Scope and Research ran
2026-07-26; Scaffold, the Workshops grouping, `SPEC-01` and `SPEC-02` ran 2026-07-27; `SPEC-03` and
`SPEC-04` ran 2026-07-28; `SPEC-05` … `SPEC-09` ran 2026-07-30; `SPEC-10`, `SPEC-11` and `SPEC-12` ran
2026-08-04. **OI-01, OI-02, OI-03 and OI-04 are closed**; **only OI-05 remains**, at Data Model.

### The one-paragraph version

Project Tracker becomes a real CAP module that **owns project state**. The markdown files that
currently hold that state (`SPRINT_BOARD.md`, `DEFECT_LOG.md`, sprint checkpoints, test
reports) are retired, and the existing build skills are rewired to write to the module through
an MCP server instead. This lands _before_ Financial Planner's last story, so `CNV-001`
becomes the first real test of the new system.

---

## 2. Decisions already made

Full rationale in `design/DECISIONS_LOG.md` (D-01 … D-152; D-19 … D-27 were added at Scope,
D-28 … D-32 at Research, D-33 … D-36 at Scaffold, D-37 … D-39 at the Workshops grouping,
D-40 … D-46 at the `SPEC-01` workshop, D-47 … D-57 at the `SPEC-02` workshop, D-58 … D-65 at the
`SPEC-03` workshop, D-66 … D-69 at the `SPEC-04` workshop, D-70 … D-75 at the `SPEC-05` workshop and
D-76 … D-82 at the `SPEC-06` workshop, D-83 … D-92 at `SPEC-07`, D-93 … D-102 at `SPEC-08` and
D-103 … D-108 at `SPEC-09`, D-109 … D-119 at `SPEC-10`, D-120 … D-128 at `SPEC-11` and
D-129 … D-136 at `SPEC-12`, **D-137 … D-143 at Information Architecture and D-144 … D-152 at Design
System**). The founding twelve,
summarized — note that **D-28 amends item 4's wording**: a bare `cds.connect.to()` throws, so the
mechanism needs a construction step.

| #   | Decision                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Project Tracker owns project state.** Not a read-only mirror, not a PM overlay.                                                         |
| 2   | **A real CAP module, now** — not the v1 HTML generator, not a JSON-seed intermediate.                                                     |
| 3   | **Namespace `com.lifeos.projecttracker`.** The `CLAUDE.md` "undecided" item is closed.                                                    |
| 4   | **Access via a bespoke MCP server over CAP, in-process** (`cds.connect.to()`), exposing **intent-level verbs**, not CRUD and not raw SQL. |
| 5   | **Hierarchy:** sprint = Initiative, story = Milestone, methodology stage = Task, workflow step = Subtask.                                 |
| 6   | **v1 serves Financial Planner only.** Non-software projects and personal systems are a later slice.                                       |
| 7   | **Migration scope is project state only.** `design/*.md` stays markdown.                                                                  |
| 8   | **Cutover before `CNV-001`**, while the board is clean (D-13 — corrected from FRM-001, which is Done).                                    |
| 9   | **Full Plan + Design methodology**, narrowly scoped to the slice-1 surface.                                                               |
| 10  | **`/generate-*` skills authored as their stage arrives.**                                                                                 |
| 11  | **The v1 dashboard is deleted**, not evolved.                                                                                             |
| 12  | **FP's namespace rename is deferred** until after W1-S3.                                                                                  |

---

## 3. The sequence

### Stage status

| #   | Stage              | Skill                                              | Skill status | Stage status                                                                                                         |
| --- | ------------------ | -------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Ideate             | `/generate-problem-statement-vision`               | Authored     | **Done** — 2026-07-26                                                                                                |
| 2   | Scope              | `/generate-business-architecture`                  | Authored     | **Done** — 2026-07-26                                                                                                |
| 3   | Research           | `/gather-research`                                 | Authored     | **Done** — 2026-07-26                                                                                                |
| 4   | Scaffold           | `/scaffold-module` → `scaffold-writer`             | Authored     | **Done** — 2026-07-27                                                                                                |
| 5   | Workshops          | `/workshop` → `spec-writer`                        | Exists       | **Done** — 2026-08-04. D-37 grouping; `SPEC-01` … `SPEC-12` all **Approved** (12/12 written; D-136)                  |
| 6   | Information Arch.  | `/generate-information-architecture` → `ia-writer` | Authored     | **Done** — 2026-08-06. `IA-001` **Approved**; 6 objects → 1 route + 1 `story` param; **R9 executed** (D-137 … D-143) |
| 7   | Design System      | `/generate-design-system` → `design-system-writer` | Authored     | **Done** — 2026-08-06. `DS-001` **Draft**; **FE FPM, drafts OFF**; the browser read path named (D-144 … D-152)       |
| 8   | Theme              | `/generate-theme`                                  | Not authored | **Next** — runs in full (D-21). Inherits D-152's shared-shell CSS question                                           |
| 9   | Data Model         | `/generate-data-model`                             | Not authored | Not started                                                                                                          |
| 10  | Tech Stack         | `/generate-tech-stack`                             | Not authored | Not started                                                                                                          |
| 11  | Test Strategy      | `/generate-test-strategy`                          | Not authored | Not started                                                                                                          |
| 12  | Project Planning   | `/generate-build-plan`                             | Not authored | Not started                                                                                                          |
| 13  | Build              | `/build` + chain                                   | Exists       | Not started                                                                                                          |
| 14  | **Rewire tooling** | `lintNoMarkdownState` + PreToolUse hook            | Not authored | Not started                                                                                                          |
| 15  | Cutover            | —                                                  | —            | Not started                                                                                                          |
| 16  | Back to FP         | —                                                  | —            | Blocked on cutover                                                                                                   |

Stages 6–8 (IA, Design System, Theme) **run in full** — settled by D-21. Slice 1 carries four
Reports and two Forms, which is a real UI rather than a thin shell.

### Immediate next action

**The spec grouping is settled — D-37, twelve specs, the table is `BUSINESS_ARCHITECTURE.md` §11.**
`/workshop` reads that table; it does not re-derive a grouping per session. Spec number is build
order, so the sequence is simply `SPEC-01` → `SPEC-12`.

**`SPEC-01` … `SPEC-06` are written**, all six provisional on R1. ~~and `SPEC-04` … `SPEC-06` additionally on R9~~ — **R9 was executed and discharged at Information Architecture, 2026-08-06 (D-140)**, so no spec is provisional on it any more. `SPEC-01`
(`design/specs/SPEC-01-MCP-INTENT-VERB-LAYER.md`, **Draft**) is eleven verbs, 29 business rules, 16
FUTs, D-40 … D-46. `SPEC-02` (`design/specs/SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md`,
**Approved** 2026-07-27) is 33 business
rules, 18 FUTs, D-47 … D-57 — and it discharged all three things `SPEC-01` deferred to it: the guard
table (14 rejections, nine new `wfl.*` keys), the twelfth-verb question (**not needed** — D-50), and
the slug codes (16, with FUT-002 testing the contract rather than asserting it). `SPEC-03`
(`design/specs/SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md`, **Approved** 2026-07-28) is 34 business
rules, 12 FUTs, eleven Data Model amendments, D-58 … D-65 — amended in-session at the `SPEC-04`
workshop to carry `Initiative.position` and `Milestone.position` (BR-14a, BR-33a; D-67), which is the
first amendment made to an **Approved** spec. `SPEC-04`
(`design/specs/SPEC-04-NEXT-ACTION.md`, **Approved** 2026-07-28) is 34 business rules, 16 FUTs, two
Data Model amendments, D-66 … D-69 — and it answers the question `SPEC-02` §6 handed it.

**`SPEC-01`'s amendments are all applied — eight of them now, not six.** Four on 2026-07-28, the fifth
(FUT-014's accepted value `Interfaces` → **`Interface`**, D-60) the same day, the sixth on 2026-07-30
(`next_action` names **both** modes and the null result; **BR-16 states the `nextAction` is
story-scoped to the verb's target story and null when that story has no incomplete Task**, with no
fallback to workspace scope — D-68), and **a seventh and eighth at the `SPEC-06` workshop, both
applied in the same session** — `stories[]` gains **`shipsUi`** (D-76) and the verb gains an explicit
**`workspace`** input (D-77). `SPEC-02` §6's four rows, `SPEC-03` §6's one and `SPEC-04` §6's two are
struck through. **`SPEC-01` still owes nothing** — the claim held when it was made, was then falsified
by two gaps found at the `SPEC-06` workshop, and holds again because both were applied rather than
recorded as owed. It stays **Draft**, which is a status with no outstanding work behind it —
approving it is a decision nobody has been asked for rather than a blocked one.

**`SPEC-05` (`design/specs/SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md`, **Approved** 2026-07-30) is 37
business rules, 14 FUTs, one new attribute and one new code list, D-70 … D-75 — and **OI-04 is
resolved**, the module's biggest genuinely-open item. It also discharged both questions handed to it:
Initiative-status gating (**no gate** — D-73, so `SPEC-04` BR-04 is unchanged and owes no amendment)
and the checkpoint-narrative split (FRM-001 may still write the `checkpoint` kind for entries after
cutover; SPEC-03 §6's "ongoing only" excluded the migrated entry, not the kind).

**`SPEC-06` (`design/specs/SPEC-06-SPRINT-PLANNING.md`, **Approved** 2026-07-30) is 31 business rules, 15
FUTs, four Data Model amendments and **no new attribute**, D-76 … D-82.** FRM-002 turned out **not to be
create-only** — it carries an **Add Story** mode, because none of D-40's eleven verbs creates a Milestone
on an existing Initiative (D-78) — and BA-001 §7's "validation is shared rather than duplicated" is
given a mechanism: a **CAP create-handler** on `Initiative` and `Milestone`, on D-58's precedent (D-79).
It resolves **no** OI. `SPEC-04` §6's row addressed to it is struck through as applied (BR-16).

**`SPEC-07` (`design/specs/SPEC-07-CHAIN-AND-REGISTERS.md`, **Approved** 2026-07-30) is 36 business rules,
18 FUTs, two Data Model amendments and D-83 … D-92.** It resolves **no** OI, and it discharged **all five**
cross-spec notes handed to it — the two enforcement-blind-spot rows, SPEC-03's sprint-scoped Defect and
null-rationale Decision, SPEC-04's Subtask distinction, and the six Activity kinds. Its spine is that
**no verb-emitted `Activity.kind` value existed anywhere** (D-83): SPEC-01 BR-03 required every write verb
to emit one and no spec named a single value, leaving `SPEC-05` BR-33 and `SPEC-06` BR-25 forbidding a Form
from writing "a kind a verb emits" — a rule over an empty set. Naming the nine collided immediately, since
`plan_sprint` and FRM-002 both produce `sprintPlanned`, so **RPT-004's machine/human split now reads
`actor`, not `kind`** (D-84) and both specs' §6 claim to the contrary is corrected.

**`SPEC-01`'s status is now a decision rather than a habit (D-93).** It owes nothing — its **ninth**
amendment was applied in-session here — and it **stays Draft until `SPEC-12` is written**. Six workshops
out of six have amended it, five specs remain unwritten, and every remaining Report and Interface reads or
writes through the verb layer, so a tenth amendment is likelier than not. Draft is what keeps the cheap
in-session edit path cheap; approving it now would make each further amendment a re-approval ceremony.

**`SPEC-08` (`design/specs/SPEC-08-CONSUMER-REWIRING.md`, **Draft** — written 2026-07-30, awaiting
Sandro's approval) is 29 business rules, 12 FUTs, three Data Model amendments and D-94 … D-102** — the
**first Wave 3 spec** and the first whose
deliverable is edited agent instructions rather than a service, a screen or a load. It resolves **no**
OI, and it is the **first spec to rule R9 out** rather than inherit it (D-101). Two findings carried the
session: `build.js` and `test-quality.js` have **no filesystem and no Node API**, so all sixteen `.claude/`
references are prose inside agent prompts and no consumer ever needed a non-agent path to the verbs
(D-94); and the rewiring, measured as retired-path references, **opened no chain** — the board recorded a
story and never a stage, so converting only the references would have left `complete_subtask('handoff')`
refused by two SPEC-02 guards on its first call (D-102).

**`SPEC-09` (`design/specs/SPEC-09-TEST-REPORT-TO-TESTRUN.md`, **Draft** — written 2026-07-30, awaiting
Sandro's approval) is 23 business rules, 13 FUTs, four Data Model amendments and D-103 … D-108** — the
second Wave 3 spec, the second standalone one, and the **only object whose consumer is not an agent**.
It resolves **no** OI and mints **no** error key. **SPEC-08 was approved in the same session (D-103)** —
it owed nothing, and unlike SPEC-01 no decision held it in Draft.

Three findings carried it. **The `posttest` hook cannot record a failing run (D-107)** — npm skips a
`post` script when the main script exits non-zero, verified on npm 10.9.3, so `TestRun.failed > 0` was
unreachable on the ongoing path and `SPEC-05` BR-10 was a rule over an empty set in an **Approved**
spec. Both gate call sites now invoke `npm run record-test-run` explicitly, made safe by idempotence
rather than a conditional. **`record_test_run` needed a second scope (D-104)** — the same shape D-96
gave `log_defect`, seventh occurrence of D-40's analysis, and cheap because `SPEC-03` BR-26 already
permitted the null-Task link. And **the script leaves the shared linter folder (D-103)**: `process.chdir`
before requiring `@sap/cds` hardcodes a module name, which the root `CLAUDE.md` forbids there.

**`SPEC-10` (`design/specs/SPEC-10-CUTOVER-GUARDS.md`, **Approved** 2026-08-04) is 29 business
rules, 16 FUTs, **no Data Model requirement at all** and D-109 … D-119** — the third Wave 3 spec, the
third standalone one, and the **first spec that is not provisional on R1** (D-119). **SPEC-09 was
approved in the same session (D-109)**, on D-103's precedent. It resolves **no** OI and mints **no**
error key — the first spec where minting none is structural rather than a disposition, since a hook has
no i18n surface and its deny reason must name a verb.

Three measured findings carried it. **`lintDocClaims.ts:15` already answered the rooting question
D-103 opened (D-110)** — it locates the shared ESLint config from `import.meta.dirname` precisely so
"renaming or moving the Standards folder cannot silently defeat the check", which honours the cwd
rule's _purpose_ where a `process.chdir` to a named module could not. **ripgrep and git disagree about
`.claude/**/*.md` (D-116)**: `rg --files .claude/` walks 4 of 37 files while `git ls-files` reports
them tracked, so the obvious implementation of the linter would hide all five `.md` consumers and
report green. And **SPEC-08 BR-02's four literal strings are provably incomplete** against the ten
files they are scoped to (D-117) — `Financial Planner/CLAUDE.md:77` reads `sprints/` bare and
`generateTestReport.ts:6` splits its path across two literals — which is why the two guards now share
**one tracked list** rather than two hand-maintained ones (D-111).

**`SPEC-11` (`design/specs/SPEC-11-PROJECT-STATE-EXPORTER.md`, **Approved** 2026-08-04, on the day it
was written) is 21 business rules, 15 FUTs, **no new entity and no new attribute** and D-120 … D-128**
— the fourth Wave 3 spec and the **fifth** standalone one (not the fourth; SPEC-11 §6 corrects the running count against BA-001 §11). It **reads every persisted entity and every
persisted column**, so §2 places one _standing_ requirement on the Data Model — a deterministic sort key
per entity (BR-07) — rather than an amendment. It resolves **no** OI (D-31 already resolved OI-01; this
object implements it) and mints **no** error key, the seventh running and the second where none is
structurally possible. It is **provisional on R1 again (D-121)**, reversing `SPEC-10`'s rule-out, and it
**takes ownership of R7** — whose drill is its own FUT-007, and **which settles R4 in the same execution**.

Three findings carried it. **The rooting question had a third answer (D-103 vs D-110)** — the exporter
must `chdir` to this module's root before importing `@sap/cds`, which names a module, so D-103's ruling
applies and the script lands in `Project Tracker/scripts/`; _inside_ the module D-110's
`import.meta.dirname` still derives the output path, so the two rulings compose rather than conflict.
**An export that logged itself could never be idempotent (D-124)** — `SPEC-01` BR-03 binds write verbs
and the exporter is not one, so emitting no Activity is not merely permitted but required, and it is what
makes byte-identical consecutive exports reachable at all. And **the two round-trip hazards fail
differently (D-128)**: omitting keys aborts the deploy at `COMMIT` on `DEFERRABLE INITIALLY DEFERRED`
constraints, while omitting managed fields loads every row, matches every count and rewrites the audit
history — which is why the managed-field comparison is mandatory rather than advisory.

**`SPEC-12` (`design/specs/SPEC-12-DECOMMISSION.md`, **Approved** 2026-08-04) is 18 business rules, 15
FUTs, **no Data Model requirement at all** and D-129 … D-136** — the fifth Wave 3 spec, the **sixth**
standalone one, and the last. It resolves **no** OI and mints **no** error key — the eighth running and
the third structurally. It is **provisional on R1** (D-133), **owns R10 and discharges it** via BR-14's
proof run, **checks R7** rather than inheriting it, does not re-own R4, and rules R9 out. Its spine is
that a precondition checklist needs something that checks it: `lintNoMarkdownState` is **run before it
is wired in**, and zero violations across its six roots is the mechanical discharge of BA-001 §10's
six-object fan-in (D-129). Three findings carried it — `generate.mjs` is **733 lines, not 734**;
`project/test-reports/` is **gitignored**, so its five files are untracked and their deletion is
irreversible while the other four artifacts have git as their archive (D-130); and `project/sprints/`
holds a **tracked `.gitkeep`** that would outlive its contents. `SPEC-10` BR-28's "single act" became an
**ordered sequence with a proof step** (D-131), because a `PreToolUse` deny beats `bypassPermissions`
and no hook has ever fired in this repo.

**Workshops is complete.** Twelve specs, twelve Approved. **Information Architecture is complete too** — `design/INFORMATION_ARCHITECTURE.md` (IA-001, **Approved** 2026-08-06), D-137 … D-143, with **R9 executed and closed**. **Design System is complete** — `design/DESIGN_SYSTEM.md` (DS-001, **Draft**), D-144 … D-152: **FE FPM for all six objects, drafts OFF**, one `ObjectPageLayout`, 17 semantic-role mappings, no charts, and the browser read path named as a **SPEC-01 amendment**. **Next is stage 8, Theme.**

**Still open:** **OI-05 alone** (methodology genericity — Data Model). **OI-03 is closed by D-35 and
OI-04 by D-70.** Research risks: R2 is closed
by D-33 and R3/R8 dissolved with D-29; **R9 is executed and closed** (D-140, 2026-08-06) and
**R1, R4 and R7 remain unexecuted** — see
`research/README.md` §5. **All now have an owner rather than only a description** — R7's and R4's
were assigned at the `SPEC-11` workshop (D-121): both belong to **`INT-007`'s own build**, because the
drill needs a real Postgres, a built exporter and loaded data, and dropping and recreating a schema to
re-deploy into it _is_ R4's test. `research/README.md` §5 has no Owner column, so it is recorded in prose
and in SPEC-11 §6, on `SPEC-10`'s precedent for R10. The other two:

- **R1 goes to Data Model (D-39), and it is worse than the research thought.** The finding is not
  that Postgres is unproven for this module — it is that `Financial Planner/package.json:82-88`
  declares `"password": ""`, which SCRAM rejects, so **neither module has ever connected to
  Postgres**; all six planner integration suites run on in-memory SQLite. Standing the binding up is
  a prerequisite of Data Model, not a detail inside it. **`SPEC-01` ships provisional on R1.**
- **R9 is EXECUTED and CLOSED — the Information Architecture stage did what D-69 assigned it, on
  2026-08-06 (D-140).** It was owned rather than merely noted precisely because D-39's lesson was that
  a risk with no owner goes unexecuted, and the owner ran it: two CAP servers on 4004 and 4005,
  in-memory SQLite, one component composed into the other's host page, driven in a real browser and
  repeated under `NODE_ENV=production`. **The premise everyone had been carrying was wrong.** R9 said
  composition "would probably work under `cds watch`" and break in production. It **breaks in dev too**
  — CAP's CORS middleware never sends `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`)
  while UI5's V4 model always sends `X-CSRF-Token`, so the `$batch` preflight is rejected one request
  after `$metadata` succeeds. Two further measurements: under `NODE_ENV=production` CORS is off
  entirely and the manifest fetch itself is blocked, and an absolute `http://` dataSource URI
  **crashes CAP at boot** (`@sap/cds-fiori/app/routes.js:68`). **Ruling: one origin behind a reverse
  proxy (D-141)**, which keeps every manifest's relative `/service/…` URI unchanged; the proxy itself
  is untested and its execution belongs to **Tech Stack**. D-69's prediction held exactly — R9 changed
  no business rule and no FUT anywhere — so **`SPEC-04` … `SPEC-07` are no longer provisional on R9**
  (all four remain provisional on R1). D-82's widening to the two Forms was vindicated and sharpened:
  the preflight does decide it, but it fails on the request **header**, not the method.

### Carried forward from Scaffold

1. ~~**Push to the git remote.**~~ **Done.** `https://github.com/sseryani98/LifeOS.git` carries
   `main`, `sprint/W1-S1`, `sprint/W1-S2` and `sprint/W1-S3`; the working branch is in sync with its
   upstream. D-31's durability destination is real, so the `INT-007` exporter has somewhere to export
   to. The round-trip (**R7**) is still untested.
2. **The `@sap/cds` pin is now load-bearing** (D-34). Both modules and the root are held at
   `9.8.4`; raising it is its own change, run with the suite green either side. 9.9.x breaks
   every `cds.test` suite.
3. **Note the rewiring stage exists** (§6). Ten files carry references to the retired state
   files, and `/pm-update` largely dissolves. It is catalogued as `INT-002` … `INT-006`, so it
   is estimated in the Build Plan rather than discovered during cutover.

---

## 4. Slice 1 scope

Catalogued as 22 FRICEW objects in `design/BUSINESS_ARCHITECTURE.md` (BA-001), which is now
the authoritative cut. The list below is the summary; BA-001 §3 carries the deferred items and
the boundary.

**In:**

- Hierarchy entities: Area, Engagement, Workspace, Initiative, Milestone, Task, Subtask
- Methodology + MethodologyStep (library, and per-story instantiation)
- Defect, Decision, Activity log, TestRun
- The Financial Planner migration — and only Financial Planner
- The MCP access layer, and rewiring the existing skills onto it
- The project view: next action + task queue · methodology chain per story · workspace header
  (status, Current Focus, calculated health) · the three registers

**Deferred:** meetings, agenda items, ideas, resources, notes, requirements, risks,
gamification, scheduling and work blocks, weekly/monthly planning, calendar sync, Apple Notes
capture, search.

**Seed depth:** Build phase, all sprints. W1-S1 and W1-S2 as completed Initiatives with their
stories as Done Milestones (no per-stage detail — it was never tracked). W1-S3 fully modelled
with the live methodology chain.

---

## 5. The Sprint Build methodology chain

Instantiated per story. Grounded in the real `.claude/` inventory, not aspirational.

| #   | Task                                                              | Driven by                                                                                    | Kind                                                      |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Sprint Build                                                      | `/build` → `workflows/build.js`                                                              | Required                                                  |
| ↳   | _brief → red → implement → gate → coverage → smoke → **handoff**_ | build-briefer, test-author, implementer, gate-runner, test-author, smoke-tester, implementer | Subtasks — `smoke` Conditional (`shipsUi`), rest Required |
| 2   | Code Quality                                                      | `/code-quality`                                                                              | Required                                                  |
| 3   | Test Quality                                                      | `/test-quality`                                                                              | Required                                                  |
| 4   | Functional Test                                                   | `/functional-test` → `functional-tester`                                                     | Required                                                  |
| 5   | UX Test                                                           | `/ux-test` → `ux-tester`                                                                     | Conditional — `shipsUi`                                   |
| 6   | Human Review                                                      | `/human-review-loop`                                                                         | Required — manual, Sandro                                 |
| 7   | Documentation                                                     | `/refresh-docs`                                                                              | Recommended                                               |
| 8   | PM Update                                                         | `/pm-update`                                                                                 | Required                                                  |
| 9   | Commit                                                            | `/commit-diff`                                                                               | Required                                                  |

**Re-verified against `.claude/` twice on 2026-07-27** — once preparing `SPEC-01` (D-38) and again
preparing `SPEC-02` (D-47, D-48, D-49). It had drifted both times, which is the argument for
re-verifying rather than trusting it. D-38: Sprint Build carries **seven** subtasks, not six —
`.claude/workflows/build.js:7-13` declares a `Handoff` phase this table omitted, and Handoff is where
the sprint board is written — the exact write `INT-002` rewires onto `complete_stage`. **The SPEC-08
workshop sharpened that wording (D-94): the Handoff _agent_ writes it, not the workflow.** `build.js`
has no filesystem and no Node API; its three references are prose inside the prompts it hands to
`build-briefer` and `implementer`. And
stages 4 and 5 name the commands D-35 authored rather than the bare agents. D-47/D-48: **UX Test is
conditional on `shipsUi`, not on `FRM-*`** — `.claude/commands/ux-test.md:10-12` tests whether a story
ships UI, and slice 1's four Reports all ship pages, so the prefix rule would have omitted UX Test
from the entire project view; and **two of the seven subtasks carry kinds of their own**, since
`build.js:597` runs Coverage only on a shortfall and `:666` runs Smoke only for a frontend story.

**This table is no longer `CNV-001`'s only source, despite what this section used to claim.**
`.claude/skills/human-review-loop/SKILL.md:11-13` states the same nine stages in the same order
independently — it **corroborates** the prose table rather than replacing it. The authoritative seed
is now `SPEC-02` §3.1, which carries the slug codes, kinds, predicates and drivers this summary does
not; re-verify **both** sources against `.claude/` before `CNV-001` is built, not after.

---

## 6. Rewiring the tooling (stage 14)

Every skill, agent, command, workflow and script that reads or writes project state must move
onto the MCP verbs. This is its own stage, immediately before cutover, because it is real work
with a measurable surface — not a footnote inside cutover.

### The surface — ten files (was eight)

Measured 2026-07-26 by grepping `.claude/` and `Standards (Technical + Linting)/` for
`SPRINT_BOARD`, `DEFECT_LOG`, `sprints/`, `test-reports`. **Re-verified during Scope: all
eight counts below hold exactly (16 refs), and two more files were found** — see D-23.

**Measurement caveat — cause and count both corrected 2026-08-04 (D-116).** A directory-scoped
ripgrep over `.claude/` silently returns only the `.js` hits, and any measurement of this surface
that omits an explicit `**/*.md` glob under-reports by **five** files, not six —
`agents/build-briefer.md`, `agents/implementer.md`, `commands/build.md`,
`skills/human-review-loop/SKILL.md`, `skills/pm-update/SKILL.md`. **The stated cause was wrong.**
`rg --files .claude/` enumerates **4 of 37** files, because ripgrep applies `.gitignore:10`'s
`.claude/*.md` at **every depth** while git does not — `git check-ignore` reports those files not
ignored and `git ls-files` reports them **tracked**. The explicit glob works because command-line
globs outrank ignore files, not because the `.md` files needed naming. `SPEC-10` BR-19 therefore
forbids `lintNoMarkdownState` from delegating its walk to ripgrep, `git grep`, or any
gitignore-respecting library at all.

| File                                                            | Refs  | What changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/pm-update/SKILL.md`                             | 4     | Mostly retired — see below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `.claude/workflows/build.js`                                    | 3     | Per-story board handoff → `complete_subtask` / `complete_stage`. **All three refs are prose inside agent-prompt template literals** — a Workflow script has no filesystem and no Node API, so it instructs and never writes (D-94)                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Standards (Technical + Linting)/scripts/generateTestReport.ts` | 2     | Stops writing markdown; emits a `TestRun`. **And it moves** to `Project Tracker/scripts/recordTestRun.ts` (D-103) — `process.chdir` before requiring `@sap/cds` hardcodes a module name, which a shared linter may not do. **Four `.md` files name its old path and none was ever measured** — `CLAUDE.md:48` (**the repo root, in no surface measurement at all**), `Financial Planner/CLAUDE.md:35` (a _different_ line from the `project/` block INT-002 already owns), and `Financial Planner/design/TECH_STACK.md:143` + `TEST_STRATEGY.md:539,546`, which are D-12 markdown and go to the `/refresh-docs` sweep. The two `CLAUDE.md` lines are agent instructions under D-23 and are **owed to SPEC-08** |
| `.claude/commands/build.md`                                     | 2     | Instructions repointed at MCP verbs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `.claude/agents/build-briefer.md`                               | 2     | Reads board state via `project_view` instead of parsing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.claude/workflows/test-quality.js`                             | 1     | Repoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `.claude/skills/human-review-loop/SKILL.md`                     | 1     | Feedback/defect capture → `log_defect`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `.claude/agents/implementer.md`                                 | 1     | Board handoff → `complete_stage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **`Standards (Documents)/METHODOLOGY_BLUEPRINT.md`**            | **5** | Ninth file, found at Scope. A "where state lives" table pointing at all four retired paths. The original grep only scanned `Standards (Technical + Linting)/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **`Financial Planner/CLAUDE.md`**                               | **3** | Tenth file, found at Scope. Documents a `project/` folder that stops existing; neither guard reaches it                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

The blueprint was described here as the load-bearing one, because it sits inside
`lintNoMarkdownState`'s stated `Standards/**` glob. **That is wrong, and the SPEC-08 workshop found
it (D-100):** the real directory is `Standards (Documents)/`, which a literal `Standards/**` glob
does not match. So the blueprint sits outside the guard alongside `Financial Planner/CLAUDE.md` —
**two** of the ten files are unguarded, not one. Both still belong in the rewiring under D-23's
primary test (does the file instruct an agent), and the roots `lintNoMarkdownState` must actually
scan — both literal `Standards …/` directories plus every module's `CLAUDE.md` — are owed to
`SPEC-10`. Separately, **32 references across six `Financial Planner/design/*.md` files** go to a
`/refresh-docs` sweep rather than becoming build work — D-12 keeps those as markdown and they
are documentation rather than agent instructions.

### `/pm-update` — retire most of it, keep a thin reconciler

Blueprint §6 reframed `/pm-update` from write-back into a **consistency auditor**, cross-checking
board against defect log against checkpoints against git. Once there is one store with
constraints, most of that drift becomes _structurally impossible to create_ — the skill's reason
for existing largely dissolves.

- **Delete:** the checks that compare markdown artifacts against each other. The schema is now
  the audit.
- **Keep:** only what the database cannot enforce — **git history vs recorded state**, and
  **the FRICEW catalogue vs the actual story backlog**. Both cross a boundary the DB does not
  own.
- Result should be a much smaller skill that is honest about what it still buys you.

**Naming collision — settled (D-09, valued by D-60):** the canonical FRICEW type is Interfaces and
its **code-list value is singular — `Interface`**. `/pm-update` check 6 says "Integration" and gets
corrected to `Interface` when the skill is rewritten in this stage.

### Two deterministic guards

These are complementary, not alternatives. **A hook cannot perform the migration — it can only
ratchet it shut afterward.** The rewiring above is still real work.

**1. `PreToolUse` hook — runtime enforcement.** _"You cannot do the wrong thing."_

- Matcher: **two groups** — `Write|Edit|NotebookEdit` (exact list) and `mcp__.*` (regex); `MultiEdit`
  is dropped, it is not a tool (D-32). Inspects the **union** of `file_path`, `notebook_path` and
  `path` against the shared retired-artifact list and **hard-denies** with JSON on stdout and exit 0,
  returning a message naming the MCP verb to use instead (`SPEC-10` BR-08, BR-10, BR-12; D-113).
- Precise, no false positives, catches the overwhelming majority of regressions. Deliberately
  does **not** parse `Bash` commands — command regexing is fuzzy and the false positives aren't
  worth the residual shell loophole.
- Guarantees the property regardless of what any agent's prompt says, which is exactly what
  prompt-only instructions cannot do.

**2. `lintNoMarkdownState.ts` — instruction enforcement.** _"Nothing tells you to do the wrong
thing."_

- Joins the existing **21**-linter suite in `Standards (Technical + Linting)/scripts/`. Scans for
  references to retired paths and fails `npm run lint`, which is already in the gate. ~~**The glob
  this document used to state — `.claude/**` and `Standards/**` — reaches neither
  `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` nor `Financial Planner/CLAUDE.md`** (D-100).
  `SPEC-10` settles the real roots.~~ **Settled 2026-08-04.** There is no glob: `SPEC-10` BR-17 gives
  a **declared root list** of six — repo `.claude/`, `Standards (Documents)/`,
  `Standards (Technical + Linting)/`, the repo-root `CLAUDE.md`, every module's `CLAUDE.md`, and
  `Project Tracker/scripts/` — and BR-16 derives the repo root from `import.meta.dirname` rather than
  `process.cwd()`, on `lintDocClaims.ts:15`'s precedent (D-110). A missing root is skipped (D-36), which
  matters immediately: the third root does not exist yet.
- Catches what the hook structurally cannot see: a skill file still _instructing_ an agent to
  edit the board.

### Sequencing constraint

**Enable both guards at cutover, not before.** While markdown is still authoritative, the hook
would block legitimate Financial Planner work. They are the final act of stage 14.

### Repo-first note

`.claude/settings.json` currently contains **permissions only — no hooks are configured**. This
is a new pattern for the repo, so expect to establish the convention (where hook scripts live,
how they're tested) as part of this stage. And per §9, the Cowork bridge cannot write into
`.claude/` — the hook config stages like the skills did.

**Found at Research: `.claude/settings.json` is gitignored** (`.gitignore:8`). That gives the
two guards different durability — the linter is tracked, the hook registration would not be, so
on a fresh clone half of `INT-006` silently isn't there. **D-32** settles it: the hook ships as
a **tracked installer script**, keeping machine-local permission grants uncommitted. Also
confirmed: `PreToolUse` hooks **do** fire inside subagents (`agent_id` is present 21× in the
installed v2.1.90 bundle), which matters because the entire build workflow runs through
`implementer`, `test-author` and friends — a guard that missed subagents would guard nothing.
Two matcher corrections came with it: **`MultiEdit` is not a tool** and is dropped, while
`mcp__*` and `NotebookEdit` are added — the MCP one being sharp, since this repo runs its own
MCP server after cutover.

---

## 7. Open items

### Closed by the Research stage — 2026-07-26

**1. What replaces git for project state (OI-01) — settled by D-31.** A `pg_dump -Fc` runbook as
the binary floor, plus a **built CSV exporter** (`INT-007`) as the diffable, git-committed form,
exported per sprint checkpoint. It has to be built because **CAP has no data export at all** — 27
CLI commands, none of which export data. Destination is a **git remote**, which this repo does not
yet have, so the exporter's output and the repo itself gain off-machine durability from one act.
Residual risk **R7**: the round-trip is untested, and a naive row-count check passes while
`createdAt`/`createdBy` history is destroyed.

**2. Overall CAP/UI5 plan across modules (OI-02) — settled by D-29 and D-30.** **Two CDS models,
separate Postgres databases, one shared UI5 shell.** The prior framing had this backwards: a Node
process runs exactly one CAP project by construction, so two models makes `INT-001` _simpler_, and
a composed model would have dragged Financial Planner's 128 Postgres objects, its Postgres binding,
its cron jobs and its `ENCRYPTION_KEY` into Project Tracker's process. A shared shell needs one
**origin**, not one service, which is what lets the shell ruling compose with the backend one.
~~Residual risk **R9**: two CAP processes serving into one shell page is _Inferred_ only, not
executed.~~ **R9 was executed at the Information Architecture stage, 2026-08-06, and is `Verified`
(D-140).** The ruling is **one origin behind a reverse proxy** (D-141) — see §8's session entry.

### Non-blocking

**3. Financial Planner namespace rename — deferred, not cancelled (D-16).** FP declares
`namespace com.financialplanner;`. Measured blast radius: **65 files, 192 occurrences**
(excluding `node_modules`, `gen`, `@cds-models`, `coverage` — all regenerate). Roughly 34 in
`app/` UI5 controllers and views, 11 in `db/` and `srv/` CDS, 6 in integration tests, plus
`package.json`, `CLAUDE.md`, and two design docs. Renames as its own change after W1-S3.

**4. Three stages with no invocation point (OI-03).** `functional-tester` and `ux-tester`
exist as agents but have no slash command; `/human-review-loop` has no defined trigger.
Settle before or during Scaffold.

### Small rulings, surfaced while authoring the skills

- **Blueprint §5.1 contradicts itself on Ideate's agents.** It lists `interviewer, writer`, but
  its own note and §3.2 say the interview stays in the main thread, and the proven `/workshop`
  row says `scouts + interview → writer`. The authored skill follows the proven pattern; §5.1's
  "interviewer" should be corrected to "scouts".
- **Decisions-log path — settled (D-17).** This module's log lives at
  `design/DECISIONS_LOG.md`; FP's `user-profile/` folder was planner-specific.
- **FRICEW type name collision — settled (D-09), and the value settled by D-60.** The type is
  Interfaces; the **code-list value is `Interface`**, singular. `/pm-update` gets corrected at the
  rewiring stage.
- **`research/` is precedent-only** — no `CLAUDE.md` codifies its structure. `/gather-research`
  adds `research/README.md` as pack index and gate, plus a metadata header the exemplars lack.
- **`deep-research` does not exist** despite the blueprint citing it as a seed for
  `/gather-research`. Handled as a runtime conditional.

---

## 8. Session log

### 2026-08-06 — Design System: a read path that was never named, and an FPM app that proved drafts optional

- **Authored `/generate-design-system` and its `design-system-writer` agent, then ran the stage** over
  the six UI-bearing objects. Wrote `design/DESIGN_SYSTEM.md` (DS-001, **Draft**) and logged
  **D-144 … D-152**. The skill follows the `generate-information-architecture` pattern — **thirteen
  fixed questions, a section list derived from the surface, and a stated "none" over a dropped
  heading** — which is now the house shape for every remaining `/generate-*` skill. **The writer agent
  could not be invoked**: Claude Code resolves its agent registry at session start, so a
  newly-authored agent is not callable in the session that writes it. The document was written in the
  main thread against the same standard; the agent is in place for stage 8.
- **`IA-001` was approved first (Step 0 of the stage).** It had never been approved and the IA session
  ended without asking, which was the one thing it left owed.
- **Build technology is `Fiori Elements FPM` for all six objects, with draft enablement OFF (D-144)** —
  Sandro's call, against a freestyle recommendation, and **the measurement vindicated it**. The
  recommendation rested on FPM forcing drafts, which is **false**: `connection-manager` is the only
  `sap.fe.core.fpm` target among the 4 app manifests under `Financial Planner/app/*/webapp/` (2 are
  `sap.fe.templates`, 1 freestyle), and it binds `contextPath: "/ProviderConnections"` — a plain
  projection with **no `@odata.draft.enabled`** (`srv/admin-service.cds:73-75`), while 17 other
  entities in that module are draft-enabled and none of them is the FPM app's. So FPM's macros and
  field machinery arrive without rebuilding D-05's escape hatch, and **D-138's second constraint
  dissolves rather than being inherited**. Drafts OFF closes `SPEC-11` BR-06's open clause — and
  **corrects D-138's own consequence wording**, which said BR-06 goes vacuous "only if stage 7 rules
  freestyle". It is vacuous because drafts are off, which FPM permits; the FE-versus-freestyle axis
  was never the one that decided it.
- **The finding of the session: three Approved specs described a read path that cannot exist (D-145).**
  `SPEC-01` §3.1 gives INT-001 transport "MCP **stdio** … **no HTTP server, no listening socket**",
  and `SPEC-04` BR-32, `SPEC-05` BR-30 and `SPEC-07` BR-01 each say their Report "renders from a
  single `project_view` call" citing `SPEC-01` BR-22. **A browser cannot call an MCP stdio server.**
  The write path had been named twice over (D-82's "UI5 surface issuing OData writes"; D-79's
  create-handler on `Initiative` and `Milestone`) and **the read path nowhere in twelve specs**. It
  surfaced only because FPM needs a `contextPath` and asking what it binds to exposed the hole — the
  freestyle branch would have shipped without asking. Ruling: the same composed-payload implementation
  is **additionally exposed as a read-only OData projection**; one implementation, two transports;
  D-05 stands because the projection is read-only. **`SPEC-01`'s twelfth amendment, and its first
  since approval — a re-approval, exactly the cost D-136 priced in.**
- **Three further rulings worth naming.** **Theme and density are inherited, not chosen (D-146)** —
  `app/index.html:17` sets the theme attribute and `:45` the `sapUiSizeCompact` body class, both
  page-global, so a second theme is not expressible; presenting it as a choice would have been
  theatre. **The cross-module debt is wider than D-143 said (D-147)**: the shared standards mandate
  `Messaging`, `BasePageController` and `DialogManager`, which live in the
  **`com.financialplanner.shared`** library — so the dependency reaches `app/shared/` as well as the
  shell, and it is forced by the standards rather than chosen. **`ObjectPageLayout`, not a card grid
  (D-148)** — the four Reports are not peer cards, because one of them is a page header.
- **Two stated "none"s, both rulings on D-134's precedent.** **No charts (D-150)**: the grep across the
  four UI specs matches 7 lines, **five of which are the word `paragraph`** matching on `graph`, and
  the remaining two are deferral sentences rather than requirements. **No semantic role for
  `Milestone.status` or `fricewType`** (D-149) — nothing renders the first as a status, and the second
  is a category rather than a state.
- **Reviewing the produced document caught four defects** — the thirteenth session running, and **all
  four were mine**, since no writer agent ran. A count stated as **18** semantic mappings against a
  table of **17** rows, in three places. FRM-002's dialog attributed to `ExtensionAPI.loadFragment()`
  when an FPM page with its own `viewName` has an ordinary controller — `connection-manager` extends
  `BasePageController` and constructs `new DialogManager(this)`. The chart grep reported as "two hits"
  without the 7-minus-5 arithmetic behind it, which is the shape of claim the next reader "corrects".
  And "the only FPM app either module has" asserted without the manifest census that makes it true.
- **A fifth defect, caught after the fact and worth recording because it nearly shipped silently.**
  Appending the nine decisions with PowerShell `Add-Content -Encoding utf8` **double-encoded every
  em-dash** — 21 mojibake sequences, none of them in `HEAD`. Reverted and re-appended byte-exact
  through `cat`. **`git diff --stat` was what caught it**, not reading the file.
- **Six spec amendments applied in-session, none left owed.** `SPEC-01` (transport row + **BR-22a** +
  Change History), `SPEC-04` BR-33 and `SPEC-07` BR-03 (chart types answered "none"), `SPEC-05` §3.3
  and `SPEC-06` §3.1 (the deferred "Fiori Elements vs freestyle" discharged), `SPEC-11` BR-06 (its
  open clause closed, rule text unchanged). All five Approved specs keep **Approved**.
- **No risk is assigned to this stage, and that was checked rather than assumed** —
  `research/README.md:148` routes IA / Design System / Theme → RSH-003, whose only live risk was R9,
  executed and closed at D-140.

### 2026-08-06 — Information Architecture: one page, one parameter, and a risk whose premise was backwards

- **Ran the Information Architecture stage over the six UI-bearing objects.** Wrote
  `design/INFORMATION_ARCHITECTURE.md` (IA-001, **Draft**) — 6 objects onto **1 route** plus **1**
  optional `story` parameter, 8 navigation links, 2 negative link rulings, 4 in-page disclosures — and
  logged **D-137 … D-143**. The skill and its `ia-writer` agent had never been executed; both ran.
- **R9 was executed rather than deferred again, and its premise was wrong in both directions (D-140).**
  D-69 assigned it here at the `SPEC-04` workshop specifically so it would not repeat R1's history, and
  the settling test the register named was run: two CAP 9.8.4 servers on 4004/4005, in-memory SQLite
  (**R1 does not gate R9** — the risk is about origin, not the database), one component composed into
  the other's host page, in a real browser, then repeated under `NODE_ENV=production`. The register and
  D-69 both said composition "would probably work under `cds watch`". **It does not.** `$metadata`
  succeeds and `$batch` is rejected one request later, because CAP's CORS middleware sets only
  `access-control-allow-origin` and `access-control-allow-methods` and **never** sends
  `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`, read directly), while UI5's OData V4
  model always sends `X-CSRF-Token`. Under `NODE_ENV=production` CORS is off entirely and the manifest
  fetch itself is blocked, giving a blank page. **Half of R9 never needed an experiment at all** — an
  absolute `/service/…` path resolves against the **document** origin, which is arithmetic; all four
  Financial Planner manifests use exactly that form (`manifest.json:13` ×4, re-measured).
- **A third finding nobody had predicted:** an absolute `http://` dataSource URI **crashes the CAP
  process at boot**, because `@sap/cds-fiori/app/routes.js:68` filters `!uri.startsWith('/')` and
  treats everything else as relative, joining it into an Express route. The multi-origin fix therefore
  costs three coordinated changes across two modules, and it was proven green under production **only
  with `kind: dummy` auth** — credentialed cross-origin was never exercised, which is exactly the case
  D-82 widened R9 to cover. **Ruling: one origin behind a reverse proxy (D-141)**, leaving every
  manifest's relative URI untouched; the proxy is itself untested and belongs to **Tech Stack**.
- **Build technology is ruled as a deferral with a deadline, not as silence (D-138).** Financial
  Planner's own Design System owned this question — its IA has no Build Technology section because
  DS-001 ran five days earlier — so stage 7 owns it here too, with a hard deadline of **before Data
  Model**, because `SPEC-11` BR-06's `.drafts` filter is written against it. Two constraints go with
  it: D-137's one-route shape **rules out a full Fiori Elements template app** (FE templates bring
  their own routing), leaving freestyle or FE FPM; and FE templates need OData entity sets, which sits
  in tension with D-05's removal of the CRUD path. **No spec ever deferred this for the four Reports** —
  only the two Forms asked — so the ruling answers an unasked question as well as an asked one.
- **`FRM-002`'s home was stated nowhere and is now a dialog (D-139).** BR-06 makes the Workspace
  read-only context inherited from the view it renders on, so it must launch from the page; it is a
  sprint-boundary surface competing with a daily one, which is what PSV falsifiable check 3 measures
  against. `FRM-001` stays **inline**, which BA-001 §7 already said.
- **§9 Task Flow Mapping survived one page as two flows and three stated "none" (D-142)**, on D-134's
  precedent. Check 3 is the only true journey check and it is **degenerate** — one step, zero
  navigation — and documenting it precisely is the point: the flow is the assertion under test.
- **The shared shell is Financial-Planner-owned, and that is now named rather than discovered (D-143).**
  Measured: `com.financialplanner.shell` in the manifest, `package.json`, `Component.ts`,
  `tsconfig.json` and both `index.html` references; nothing outside Financial Planner references it.
  Project Tracker registers into `Financial Planner/app/`, which gives this module's UI a build-time
  dependency on the other module's folder. Relocation is owed to the third module's UI or the first
  cross-module shell navigation, whichever comes first.
- **Reviewing the produced document caught four defects the writer's own check passed** — the twelfth
  session running. Two were the writer's (a nav-group ruling attributed to **D-140** when it is
  **D-143**; §8's six rows reading as if they were §3's six objects, which they are not — the matching
  count is a coincidence). **One was mine**: §4.2 cited `ui5-multi-app-shell.md:356` after my own
  correction to that file shifted the line to **:361**. The fourth was a soft count — "all 5 manifests"
  where there are **6** under `app/`, the sixth being the `type: library` shared manifest with no
  `sap.ui5` block.
- **Corrections applied in-session, none left owed.** `PLAN.md`: stage-6 row said _Not authored_ when
  the skill was authored last session; §9 carried BA-001 at **v1.8** (it is **v1.14**), "8 of 12
  written" (twelve, all Approved) and "D-01 … D-102" (it runs to **D-143**); §4 said **21** FRICEW
  objects where BA-001 §10 and §11 both say **22**. `RSH-003` §11 claimed `app/shared` is
  `type: application` — it is `"type": "library"` at `manifest.json:5`, and `type: application` only in
  `ui5.yaml:4`, a different field. D-21's `PLAN.md:75` pointer now resolves to the Ideate row. R9's
  grade was updated in all three registers that carry it — BA-001 §8 (→ **v1.14**), the module
  `CLAUDE.md`, and `research/README.md` §5 — and discharged across all four Report/Form specs in
  header, §6, footer and a new Change History row.

### 2026-08-04 — SPEC-12 written: the checklist that checks itself, and the deletion git cannot undo

- **Ran the `SPEC-12` workshop over CNV-005.** Wrote `design/specs/SPEC-12-DECOMMISSION.md`
  (**Approved**, **provisional on R1** — R10 owned _and discharged_, R7 checked, R4 not re-owned, R9
  ruled out) with 18 business rules, 15 FUTs, **no Data Model requirement at all**, and logged
  **D-129 … D-136**. **Workshops is complete: twelve specs, all twelve Approved.**
- **A precondition checklist needed something that checks it (D-129).** Three §6 rows and BA-001 §10's
  fan-in hand CNV-005 four ordering constraints, and PSV §2's unconstrained-artifact defect was about
  to reappear in the object that closes the cutover. The fix built nothing: `SPEC-10` BR-27 keeps
  `lintNoMarkdownState` out of every `lint` chain _because_ 27 live references would fail it — so
  **that failure is the precondition test**. Run it before wiring it in; zero violations means INT-002,
  INT-003 and INT-005 are done. Re-measured 2026-08-04: **27 references across 12 files**, exactly as
  BR-27 states. The data-side half is RSH-005 §8's own rule — _answer a question through the
  application, not through SQL_ — so `project_view('financial-planner')` returning the right next
  action is what discharges SPEC-03 §6's tie-out row.
- **The four retired artifacts do not share a durability, and one deletion cannot be undone (D-130).**
  D-02 deletes and D-12 keeps git as the system of record, which reads as "the archive is free".
  Measured: **`project/test-reports/` is gitignored** (`Financial Planner/.gitignore:21`), so its five
  files are **untracked** and `git rm` recovers nothing — while the other four artifacts are tracked
  and need no archive at all. Accepted on D-24's existing finding rather than newly argued, and
  sequenced **last** among the deletions so an abort before it costs nothing. `project/sprints/` also
  holds a **tracked `.gitkeep`** that would have kept the directory alive after its contents left.
- **"One act" was the wrong shape for the act that cannot be undone from inside (D-131).** `SPEC-10`
  BR-28 enabled both guards together. But a `PreToolUse` deny beats `bypassPermissions` and
  `--dangerously-skip-permissions` (D-112), and **no hook has ever fired in this repo** — so the
  mechanism that makes cutover stick is also the one that would block the fix. BR-28 is amended
  in-session to an **ordered sequence**: lint leg first (revertible by one `package.json` edit),
  installer second, then **one run under `claude --debug-file`** — which is R10's settling event, since
  D-115 already established that the enablement act and the proof are the same event. Rollback is
  stated and machine-local, because `.claude/settings.json` is gitignored.
- **`SPEC-01` owes nothing, and that absence is the finding (D-136).** Six of eleven workshops amended
  it — eleven amendments, the last at `SPEC-09` (D-104). The twelfth found none: CNV-005 calls no verb
  and `project_view(workspace?)` already carries what it needs. That is exactly D-93's condition, so
  **`SPEC-01` flips Draft → Approved** and the ambiguity D-93 priced in is closed.
- **Reviewing the produced spec caught eight defects the writer's own DoD check passed** — the eleventh
  session running. The sharpest: **BR-17 said "no verb call" while BR-03 calls `project_view`** — now
  scoped to _write_-verb calls, with FUT-014 stating why the Activity count holds anyway. **BR-16 said
  `SPEC-10` FUT-014 inverts "all three assertions" while FUT-013 said two** — measured, only the two
  enablement assertions invert, and **`SPEC-10` FUT-014's own closing note carried the same error** and
  is corrected. **BR-13 said it "reverses" `SPEC-10` BR-27, whose text forbids the leg "in Wave 3"** —
  and CNV-005 _is_ Wave 3, so BR-27 read literally forbade the act BR-28 mandates; corrected to
  withholding rather than forbidding. And **§7's preamble inverted BA-001 §3.3's ID convention**,
  declaring unqualified IDs to be Financial Planner's while citing §3.3 as its authority.
- **One BA-001 correction (→ v1.13)**: CNV-005's row said `generate.mjs` was **734 lines**; it is
  **733**, and the file ends in a newline so there is no off-by-one to reconcile. **One
  `research/README.md` correction**: §7 gains a **`Workshops — CNV-005`** row (D-135) — the **third**
  occurrence of D-108's and D-127's defect, which makes it a pattern rather than three accidents:
  §7 is written when a document is created and never maintained when a consumer is added.

### 2026-08-04 — SPEC-11 written: the object that reads everything, and the risk that had waited for it

- **Ran the `SPEC-11` workshop over INT-007.** Wrote
  `design/specs/SPEC-11-PROJECT-STATE-EXPORTER.md` (**Approved**, **provisional on R1** — R9 ruled out,
  **R7 owned here and R4 settled in the same execution**) with 21 business rules, 15 FUTs, **no new
  entity and no new attribute**, and logged **D-120 … D-128**. It is the fourth Wave 3 spec, the
  **fifth** standalone one, and the first that **reads every persisted entity and every persisted
  column** — so §2 states a read _surface_ and one standing Data Model requirement (a deterministic
  sort key per entity) rather than an amendment list.
- **R1 comes back, one spec after being ruled out.** `SPEC-10` was the first spec not provisional on
  R1 (D-119), because neither cutover guard touches CAP. This object reads the database and its drill
  runs `cds deploy` against a real Postgres, which per D-39 **neither module has ever connected to**
  — so R1 binds again, ruled explicitly on D-82's precedent rather than inherited either way. **R7
  and R4 gain owners in the same act (D-121)**: both are `INT-007`'s own build, because the drill
  needs a real Postgres, a built exporter and loaded data, and dropping and recreating a schema to
  re-deploy into it _is_ R4's test — the "highest-value unrun test in the wave" turns out to be a
  step inside FUT-007 rather than a separate exercise.
- **The rooting fork had a third instance, and the two prior rulings compose (D-103, D-110).** The
  exporter must `process.chdir` to this module's root before importing `@sap/cds`, which names a
  module irreducibly, so D-103 applies and the script lands in `Project Tracker/scripts/`. But
  _inside_ the module, D-110's `import.meta.dirname` still derives the output path, so
  `npm run export-state` writes to the same folder from the repo root and from the module (FUT-012).
  What forces the module home is the CAP chdir, not the file path.
- **An export that logged itself could never be idempotent (D-124).** `SPEC-01` BR-03 binds _write_
  verbs and the exporter is not one, so emitting no Activity is permitted — and it is also
  **required**, because an Activity would change the state just captured and no two consecutive
  exports could ever match. The read/write distinction and the idempotence property turned out to be
  the same rule.
- **The two round-trip hazards fail differently, and only one can announce itself (D-128).** Omitting
  keys aborts the deploy at `COMMIT`, because all foreign keys are `DEFERRABLE INITIALLY DEFERRED`
  inside one transaction (RSH-005 §5, 51 of 51 on the planner model). Omitting managed fields loads
  every row, matches every count, and rewrites the audit history to `anonymous` at the deploy
  timestamp. That asymmetry is why BR-20 makes the managed-field comparison **mandatory rather than
  advisory**, and why FUT-008 is a negative test asserting a silent pass.
- **`TestRun` volume is answered by the sort key, not a filter (D-125).** `SPEC-09` §6 raised it;
  filtering would break the round-trip, the one property the object exists to provide. Determinism
  and diff-friendliness are separate requirements — `ORDER BY ID` is byte-identical _and_ scatters
  new rows, because UUIDs do not sort chronologically — so append-growing entities declare a temporal
  key first.
- **A research document with a dedicated workshop had no route to it (D-127).** `research/README.md`
  §7 routes by stage and by `R-nn`, and RSH-005's only entry sent it to Cutover/`CNV-005`. **This is
  exactly the defect D-108 logged for INT-004**, one object over, and D-39's lesson in its fourth
  form — a risk with no owner, then a certainty with no route, then three risks with no column, now a
  document with no consumer. Four `research/README.md` corrections applied in-session: the new §7
  row, the stale Cutover row (D-31 ruled on OI-01), §3's Feeds cell and §5's R7 Affects cell, neither
  of which had ever named INT-007.
- **Three §6 rows owed to SPEC-11 discharged**, from `SPEC-03`, `SPEC-05` and `SPEC-09` — the first
  two by BR-03's emit-all-managed-fields rule, though `executedAt` and `createdBy` are carried by two
  _different_ rules and the spec says so; the third by BR-07. **Two BA-001 corrections applied
  in-session → v1.12**: INT-007's Traces To named neither **INT-001**, the service layer it reads
  through, nor **INT-004**, whose rows its sort key exists to handle; and its R7 clause is completed
  with the owner D-121 assigns. The row had received no maintenance since it was created at v1.1.

### 2026-08-04 — SPEC-10 written: a search that walked 4 files in 37, and a rule its own tests could not match

- **Ran the `SPEC-10` workshop over INT-006.** Wrote
  `design/specs/SPEC-10-CUTOVER-GUARDS.md` (**Approved**, **provisional on nothing** — **R1 ruled OUT**,
  R9 ruled out, **R5 discharged**, R6 confirmed closed, R10 owned by CNV-005) with 29 business rules,
  16 FUTs and **no Data Model requirement at all**, and logged **D-109 … D-119**. **SPEC-09 was
  approved in the same session (D-109)** on D-103's precedent. **SPEC-10 is the first spec not
  provisional on R1** — every prior spec inherited it, and neither guard touches CAP.
- **The rooting fork had already been answered inside the suite, and nobody had looked (D-110).**
  D-103 moved `generateTestReport.ts` out of the shared folder because `process.chdir(<module root>)`
  hardcodes a module name, and the same collision recurs here: `lintNoMarkdownState`'s roots are under
  no module's cwd. But `lintDocClaims.ts:15` already reaches outside cwd via `import.meta.dirname`,
  with a comment saying why — "renaming or moving the Standards folder cannot silently defeat the
  check". That honours the cwd rule's **purpose** (one copy serves every module, no module named)
  where D-103's script could not, because a `chdir` target is irreducibly a module name. **D-103 was a
  precedent for the question, not for the answer**, and the difference is whether the outside-cwd path
  can be _derived_ or must be _named_. A module-local script was rejected on measurement: `build.js:371`
  runs `cd "${moduleDir}" && npm run lint`, so a Project-Tracker-only linter would never fire in the
  gate that matters, and every retired path lives in Financial Planner.
- **ripgrep and git disagree, and the whole guard rested on it (D-116).** `PLAN.md` §6 recorded that a
  directory-scoped `rg` over `.claude/` "returns only the `.js` hits" and blamed a missing `**/*.md`
  glob. Measured: `rg --files .claude/` enumerates **4 of 37** files. The cause is `.gitignore:10`'s
  `.claude/*.md`, applied by ripgrep at **every depth** while `git check-ignore` reports those files
  **not ignored** and `git ls-files` reports them **tracked**; the explicit glob works because
  command-line globs outrank ignore files. So the obvious implementation of "scan for a string" hides
  **every `.md` consumer SPEC-08 rewires** and reports green — **phantom enforcement in the object built
  to end it**. BR-19 forbids delegating the walk at all. The caveat's **count** was wrong too: five, not
  six, wrong since Scope and restated as verified at the SPEC-08 workshop.
- **A rule and its own three tests used four different spellings, and two real references matched none
  of them (D-117).** SPEC-08 BR-02 names `SPRINT_BOARD`, `DEFECT_LOG`, `project/sprints/`,
  `project/test-reports/`. `Financial Planner/CLAUDE.md:77` reads **`sprints/`** bare under the
  `project/` header at `:74`, so deleting `:75-76` and leaving `:77` would **pass BR-02** with the
  retired path intact — only SPEC-08 FUT-006 catches it, and FUT-006 spells the string differently while
  citing BR-02 as its authority. `generateTestReport.ts:6` splits the path as
  `join(process.cwd(), "project", "test-reports")`, which no literal matches. Hence **one tracked list,
  two projections** (D-111): the hook's path globs and the linter's tokens are fields on one record, so
  a missed spelling is a token added rather than a second list to remember. It gained a **fifth record**
  for the moved test-report generator — measured, that token is the _only_ thing that makes the
  repo-root `CLAUDE.md` guardable at all, which is exactly the gap SPEC-08 BR-14a describes.
- **Two rulings the register had no column for.** `research/README.md` §5 has **no Owner column and no
  Grade column**, which is why R5, R6 and R10 have carried neither. R5 is discharged, R6's closure
  re-verified rather than assumed, and **R10 gains an owner — CNV-005**, because D-07 forbids the one
  hook run that would settle it, so the settling event and the enablement event are the same event.
  **D-39's and D-108's lesson a third time**: there a risk had no owner, then a certainty had no route;
  here three risks had no column.
- **Reviewing the produced spec caught eight defects the writer's own DoD check passed** — the tenth
  session running. The sharpest: **BR-10 scoped the path read per tool**, so a `Write` carrying
  `notebook_path` would have been allowed and FUT-003 asserted that weaker behaviour as correct — now a
  union read, fail-safe. **FUT-008 listed five files as its expected set** while a correct implementation
  reports seven, the SPEC-09 FUT-001 class recurring. **§5 asserted a fail-open behaviour with no rule
  and no test behind it** — now BR-13a and FUT-016, and the asymmetry is load-bearing: a `PreToolUse`
  deny beats `bypassPermissions`, so failing closed on the hook's own bug would block every `Write` in
  the session with no override. And **BR-19 inherited the "six files" the same session proved was five**.
- **Five BA-001 corrections applied in-session → v1.11.** INT-006's row had received **no maintenance
  across nine amendments** while D-100 deferred work to it: it still carried the `Standards/**` glob
  D-100 refuted (the correction had been applied to INT-003's row and not this one), still said
  "20-linter suite" after D-36 corrected the count, and listed R6 as closed in §4 while §11 row 10 named
  it a live reason for the cut.

### 2026-07-30 — SPEC-09 written: the hook that skips the run worth recording, and a script that had to leave the shared folder

- **Ran the `SPEC-09` workshop over INT-004.** Wrote
  `design/specs/SPEC-09-TEST-REPORT-TO-TESTRUN.md` (**Draft**, provisional on **R1** alone, **R9 ruled
  out**) with 23 business rules, 13 FUTs and four Data Model amendments, and logged **D-103 … D-108**.
  **SPEC-08 was approved in the same session** — it owed nothing, no decision held it in Draft, and
  SPEC-09's amendments to it were applied rather than left owed (D-103).
- **The `posttest` lifecycle was the session's real finding, and it was found by testing rather than
  reading (D-107).** BA-001 §11 row 09 names it as one of three reasons INT-004 is cut standalone;
  running the case shows **npm does not run a `post` script when the main script exits non-zero** (npm
  10.9.3, both directions). Jest exits non-zero on failure, so the hook records only green runs — and
  `build.js`'s phase-3 gate is _deliberately_ red. Unfixed, **`TestRun.failed > 0` is unreachable on the
  ongoing path**, which makes `SPEC-05` BR-10 a rule over an empty set and its FUT-008 untestable
  through the only writer — **D-83's shape live in an Approved spec** — and leaves a gate tile that can
  only ever show a pass. Both gate call sites now call `npm run record-test-run` explicitly, made safe
  by **idempotence on (`executedAt`, scope)** rather than by a conditional an instruction could get
  wrong. `build.js:382` also tells the gate agent that generator "always fires", which is **false today**
  and is corrected rather than repointed.
- **`record_test_run` required a scope its only caller does not have (D-104)** — structurally D-96's
  `log_defect` problem one verb over, and the **seventh** occurrence of D-40's analysis. It gains a
  `workspace` mode as `SPEC-01`'s **eleventh** amendment, applied in-session under D-93. What made it
  cheap is that **the entity already carried the shape**: `SPEC-03` BR-26 permits a null Task link and
  the seeded run is permanently that shape, so no attribute and no link is added — and `SPEC-05` BR-13
  already keeps such a run out of health, so a bare `npm test` is recorded without becoming a health
  signal about a story it never ran against. **`SPEC-02` BR-29 is scoped to story mode** with it; SPEC-02
  is Approved and was amended in-session, the third such amendment.
- **The script leaves the shared linter folder, and the root `CLAUDE.md` is what forces it (D-103).**
  RSH-001 §10 proves by execution that only `process.chdir(<PT root>)` **before** the first `@sap/cds`
  import recovers `cds.env` — and that hardcodes a module name, which the root standard forbids in a
  folder whose one copy serves every module. So `generateTestReport.ts` becomes
  `Project Tracker/scripts/recordTestRun.ts`, reversing that module's "no `scripts/` folder" carve-out,
  and it calls the **same CAP service the verbs call** on D-58's precedent and D-79's mechanism — a
  third kind of caller, bypassing no guard. Two consequences worth carrying: static imports hoist, so
  the CAP interaction needs a **dynamic `await import()`**; and the pool keeps the event loop alive, so
  the script needs an explicit **`process.exit(0)`** or it hangs `npm test`.
- **Re-verification paid for itself three times, and the third was the largest.** `executedAt` and
  `linesPct` were both discharged as expected — but `SPEC-01`'s mapping table names **four** per-failure
  fields where the source produces **three** (`generateTestReport.ts:95` sets `location` to `suite.name`
  — D-106); `linesPct`/`branchesPct` are **nullable** and no spec said so, since the coverage summary is
  read in a silent `catch`; and **grepping the script's own name found four `.md` files naming its old
  path that no surface measurement had ever touched** — including the **repo-root `CLAUDE.md`**, which
  has appeared in none. Two are agent instructions and go to INT-002 (SPEC-08 is **ten** files now, not
  nine, at the same sixteen references); two are Financial Planner design docs and go to the
  `/refresh-docs` sweep.
- **`research/README.md` §7 had no "Workshops — INT-004" row (D-108)**, and the cause is worth the
  entry: §5 routes work by `R-nn`, while the `chdir` trap and the `exit(0)` teardown are **verified
  constraints rather than risks** — so nothing in the routing mechanism would ever have carried them to
  a workshop. **D-39's lesson in a second form**: there a risk had no owner; here a certainty had no
  route.
- **Reviewing the produced spec caught nine defects the writer's own DoD check passed** — the ninth
  session running, and the largest count yet. The sharpest: **FUT-001 asserted "exactly one TestRun
  exists" against a fixture that already carries the seeded one** (`SPEC-03` BR-25), so a correct
  implementation fails it. Four preconditions ran the recorder in **workspace mode without loading the
  fixture**, which makes BR-15 fire and the asserted write unreachable — the unreachable-precondition
  class, sixth session in nine. **FUT-008 and FUT-009 each asserted an outcome their own steps never
  produced** (SPEC-06 FUT-012's class, recurring). Plus BR-03a stating an unconditional call that
  SPEC-08 BR-13b carves out, §5 claiming "no agent in the loop" when BR-03a puts one there, §5 calling a
  rejection "unreachable in practice" that nothing structurally prevents, and a cross-spec note whose
  bold lead sentence belonged to a different note.

### 2026-07-30 — SPEC-08 written: a workflow that never wrote anything, and a chain nobody opened

- **Ran the `SPEC-08` workshop over INT-002, INT-003 and INT-005.** Wrote
  `design/specs/SPEC-08-CONSUMER-REWIRING.md` (**Draft**, provisional on **R1** alone) with 29 business
  rules, 12 FUTs and three Data Model amendments, and logged **D-94 … D-102**. It resolves **no OI**, and
  it is the **first Wave 3 spec** and the first whose deliverable is edited agent instructions.
- **The expected fork about `build.js` reaching a gitignored MCP registration dissolved on reading the
  file (D-94).** All three of its references are prose inside agent-prompt template literals — `:76` a
  `BRIEF_SCHEMA` field description, `:248` a doc-path list in the briefer's prompt, `:734` the Handoff
  _agent's_ prompt — and a Workflow script has no filesystem and no Node API; a grep for `fs.`/`require`/
  `writeFile` across both `.js` files returns nothing. So all sixteen `.claude/` references are one kind
  of thing, an instruction to an agent, and D-38's "the workflow writes the sprint board" is corrected to
  the Handoff _agent_. D-44's installer is the single precondition, and **R6 does not widen** — it names
  the hook registration, a different gitignored file.
- **The session's real finding came from reviewing the produced spec against its own end-to-end FUT
  (D-102).** The surface was measured as **retired-path references**, and every one of them sits at the
  story level, because D-15 and D-24 record that per-stage detail "was never tracked". So converting the
  references converts **only Handoff** — and SPEC-02 BR-24 and BR-25 then refuse `complete_subtask('handoff')`
  on its first call, because the parent is Not Started and five blocking Subtasks are open. The rewiring
  would have shipped leaving every chain mid-flight. **D-40's analysis in a subtler form**: not a state no
  verb can write, but a state **no instruction tells anyone to write** — which is why an exactly-correct
  reference count did not make the object complete.
- **`log_defect`'s missing scope was already on the record, and that made the ruling easier (D-96).**
  `DECISIONS_LOG.md:389` (D-58's context) names it verbatim — "`log_defect` requires a `story` and the
  defect log records only a Sprint" — and D-58 routed **around** it for the migration alone. Correct for a
  one-time Conversion, silent about every caller after it. INT-005's ad-hoc entry point is the first to
  walk back in, so `log_defect` gains a `workspace` mode as **SPEC-01's tenth amendment**, applied
  in-session under D-93. **D-37 §11.1's trigger does not fire** — D-77's precedent, a consumer finding its
  own input need is the cut working.
- **"Retirement" was a misnomer that would have broken the chain (D-97).** SPEC-02 §3.1 seeds `pm-update`
  as a Required stage at position 80 with driver `/pm-update`, D-52 makes it block `commit`, and D-56 (1)
  generates its remediation from that driver — so deleting the skill makes `complete_stage('commit')`
  permanently unreachable on every story. The checks retire; the skill does not.
- **D-23's justification for including `METHODOLOGY_BLUEPRINT.md` does not survive (D-100).** It cites
  `lintNoMarkdownState`'s `Standards/**` glob, which does **not** match the real directory
  `Standards (Documents)/`. So **two** of the ten files are outside every guard, not one, and until
  SPEC-10 fixes the roots, SPEC-08's own FUT-006 and FUT-009 are the only things catching a missed edit.
- **R9 ruled OUT — the first spec to do so (D-101)**, on D-82's own per-origin test read the other way:
  stdio transport, no origin, no page, no browser request.
- **Reviewing the produced spec caught four defects the writer's own DoD check passed** — the eighth
  session running. Two substantive, both in D-102: the unopened chain, and **BR-04 requiring a qualified
  story ID with no mechanism** while `build.js` carries a bare `storyId` beside a `moduleDir` that is a
  folder name, not a workspace slug. Two smaller: §5 claimed INT-003 can provoke no rejection, but D-41
  binds read verbs too; and BR-12 named three identities where five call sites exist, making
  `build-briefer` and `pm-update` new enumeration values. **BA-001 → v1.9** with four corrections,
  three of them stale claims it made about itself.

### 2026-07-30 — SPEC-07 written: a rule over an empty set, and a partition that never worked

- **Ran the `SPEC-07` workshop over RPT-003 and RPT-004.** Wrote
  `design/specs/SPEC-07-CHAIN-AND-REGISTERS.md` (**Approved**, provisional on **R1 and R9**) with 36
  business rules, 18 FUTs and two Data Model amendments, and logged **D-83 … D-92**. **It resolves no OI.**
  All five inherited cross-spec notes are discharged.
- **`Activity.kind` had no verb-emitted value anywhere, and two approved rules referenced that empty set
  (D-83).** SPEC-01 BR-03 requires every state-changing verb to emit exactly one Activity event carrying a
  `kind`; nine write verbs exist; **no spec named one value**. All eight kinds required so far are Form- or
  migration-written. So `SPEC-05` BR-33 and `SPEC-06` BR-25 each forbade a Form writing "a kind a verb
  emits" — a constraint over nothing — and RPT-004's timeline could not be tested against a vocabulary half
  of which did not exist. **Fifth occurrence of D-40's analysis** (after D-40, D-74, D-76, D-77): an
  attribute or rule whose values nothing produces is this module's most reliable defect shape.
- **Naming the nine broke the mechanism they were supposed to serve (D-84).** `plan_sprint` is a verb and
  FRM-002's Plan Sprint mode writes the same event, so `sprintPlanned` has **two writers of opposite
  natures** and a kind-based machine/human split misfiles one of them. The fix was already in the data:
  every Activity row carries `actor` (D-41, D-63, D-74). **The split reads `actor`, never `kind`** — and
  `SPEC-05` §6 and `SPEC-06` §6's claim that the kind partition is what makes the timeline separable is an
  overstatement, corrected in both. `SPEC-06` BR-25's "a kind a verb emits" clause is **struck**; its
  positive enumeration already carried the whole constraint. `SPEC-05` BR-33 does **not** break.
- **`project_view` returned "chain", singular, and never said whose (D-85).** RPT-003 is per-story by
  BA-001 §8. Returning only the candidate set's chains was the trap: a **Done** story holds no incomplete
  Task, so its chain would be invisible — and "did Code Quality run on that story" is exactly the question
  asked about finished work. It returns **every** Milestone's chain; RPT-003 renders one at a time.
- **Two Reports, one spec, opposite sides of D-22 (D-89).** RPT-004 has **no reachable empty state** — the
  migration writes 4 Defects, 5 Decisions and 2 Activity rows before anyone opens the page and nothing
  deletes any of them — so none is specified or tested. RPT-003's empty state is the **normal case**, on
  eleven of twelve Milestones. That contrast is the clearest evidence available that the principle is being
  applied rather than recited.
- **D-64's vacuous-derivation trap, third occurrence (D-88)** — and it got sharper on inspection.
  RPT-003's header renders **no** derived `Milestone.status`, because on eleven chainless Milestones
  SPEC-02 BR-17 derives a computed claim rather than a recorded fact. Then the ambiguity: **BR-17's clauses
  are ordered "Backlog when no Task has started" first**, so the literal rule returns **Backlog** over an
  empty Task set while D-64 reasons from the last clause and concludes **Done**. Live on eleven rows,
  raised to `SPEC-02` and Data Model rather than settled here.
- **`Decision` had no date, so the register's ordering would have read the cutover date (D-92).** This is
  **D-72 one table over** — `TestRun` gained `executedAt` for the identical reason, from the identical
  source file, at the identical date — which makes the defect a pattern rather than a `TestRun` quirk: a
  migrated row's managed timestamp is a load fact, not a domain fact. `Decision.decidedAt` added; **`SPEC-03`
  amended a third time**.
- **Re-verification paid for itself twice, and both were stale claims BA-001 made about itself.** §8's
  RPT-003 row said "a story's **9** stage Tasks" when a `shipsUi: false` story materialises **8** — the only
  chain in existence on day one. And §9's WFL-001 row still read "UX Test is skippable only on non-`FRM-*`
  stories", **the prefix rule D-47 overturned** — while **v1.3's own change-history row claims that
  correction was made**. D-47 called for two row edits; only §6's ENH-001 row received one. BA-001 → **v1.8**,
  with a thirteenth §3.6 deferral row for `PRD.md:798` (D-91).
- **Reviewing the produced spec caught seven defects the writer's own DoD check passed** — the seventh
  session running. The sharpest: **BR-05 defaulted RPT-003 to the story `next_action()` resolves to, and
  `next_action()` may return null** — SPEC-04 BR-15's own fourth state, reachable the moment every Task in
  the Workspace is Complete, leaving the Report with no rule at all; now BR-05a and FUT-018. **FUT-004
  asserted an outcome its own steps never produced** (SPEC-06 FUT-012's class, recurring). §2 declared
  `Defect.description` and `Milestone.description` as read while **no rule rendered either** — and SPEC-03
  BR-23 folds the _only Open Defect's_ content into `description`, so the register's one actionable row was
  hiding what makes it actionable. `decidedAt` was made **not null with no writer** on the ongoing path.
  Plus a bare `BR-31` where this spec carries one, and a wrong-rule citation. **And one defect was mine, not
  the writer's:** I briefed that D-37 §11.1's trigger fires for the `project_view` change. It does not —
  §11.1 scopes it to "a **guard** that cannot be stated without changing INT-001's verb signature", which
  D-55 and D-77 both already applied, and D-77 recorded the trigger holding even when a signature genuinely
  did change.

### 2026-07-30 — SPEC-06 written: a Form that was scoped create-only, and a verb that was missing two inputs

- **Ran the `SPEC-06` workshop over FRM-002.** Wrote `design/specs/SPEC-06-SPRINT-PLANNING.md`
  (**Approved**, provisional on **R1 and R9**) with 31 business rules, 15 FUTs, four Data Model amendments
  and **no new attribute**, and logged **D-76 … D-82**. **It resolves no OI** — OI-05 is the only one
  open and it is not a workshop question.
- **Grepping `shipsUi` across three specs found a gap nobody had raised (D-76).** `SPEC-02` §3.2's
  Inputs table says `Milestone.shipsUi` is "set by the creating caller" and names `plan_sprint` and
  FRM-002 as creating callers; `SPEC-02` FUT-006 creates a story "via `plan_sprint` with `shipsUi`
  true" — and `SPEC-01`'s verb row, BR-21 and FUT-013 all carry **three** fields per story. `SPEC-02` §6
  raised exactly this for CNV-002 and it landed as `SPEC-03` BR-16; nobody raised it for the verb.
  Unfixed, D-47's predicate would evaluate against **null** on every human-planned story, `ux-test` and
  `smoke` would silently never materialise, and `SPEC-03` BR-16's "no Milestone carries a null
  `shipsUi`" would be unsatisfiable for every row created after cutover. Deriving it from `fricewType`
  is the `FRM-*` prefix rule **D-47 overturned**; it becomes a _pre-filled tick_ instead (BR-28).
- **The same read found `plan_sprint` has no `workspace` input (D-77)**, while `SPEC-01` §5 already
  rejects a "duplicate story ID **in workspace**". The verb works today only because D-11 gives slice 1
  exactly one Workspace — and a duplicate check whose scope is implicit fails **by writing to the wrong
  place rather than by erroring**, which is D-45's own argument one level up. Both amendments were
  **applied in-session** as `SPEC-01`'s seventh and eighth; it is Draft, so no re-approval was needed.
- **FRM-002 was scoped create-only, and that leaves a third "no legal write path" (D-78).**
  `plan_sprint` creates a whole Initiative and **none of D-40's other ten verbs creates a Milestone**, so
  adding a story to a live sprint could not be done at all — while Financial Planner's own W1-S3 carries
  four stories and INT-006's hook hard-denies the markdown path that serves it today. Same analysis D-40
  ran to find four missing verbs and D-74 ran to find `mergeCommit` had no writer; **third occurrence**.
  Add Story is added; editing and descoping are refused as the start of the CRUD surface D-05 removed —
  and descoping raises a question **D-50 does not answer**, since D-50 forbids deleting a Task or
  Subtask and is silent on a Milestone. **Cost, stated:** a mistyped story ID has no correction path.
- **BA-001 §7's "validation is shared rather than duplicated" named no mechanism, and now does (D-79).**
  It is a **CAP create-handler** on `Initiative` and `Milestone`, on D-58's precedent (ENH-001 in a
  create-handler rather than verb-layer logic). The repo's documented Validator-class pattern was
  rejected for one property: it is **skippable**, and a caller that forgets to invoke it bypasses every
  rule silently — the property D-05 removed the CRUD hatch to buy. Consequence worth knowing: because
  the check is one check, the Form **reuses `verb.story.duplicate` verbatim** rather than minting a
  `frm.*` key, which is the _opposite_ call from `SPEC-05`'s `frm.activity.kindNotPermitted` and correct
  for the opposite reason — that rule was FRM-001's own, this one is the shared handler's.
- **Two new Activity kinds, `sprintPlanned` and `storyAdded` (D-81)**, extending `SPEC-05` §2's kind list
  to eight and `SPEC-05` BR-33's partition to cover them. One kind per action, because a single kind
  would leave RPT-004's timeline unable to tell "planned a sprint" from "added a story mid-sprint"
  without parsing payloads.
- **R9 was ruled to reach a Form (D-82).** BA-001 §8 and `SPEC-04` §6 named only `SPEC-05` and
  `SPEC-07`, and `research/README.md:106`'s Affects cell named `RPT-001`…`004`, so whether a Form
  inherits R9 was simply unstated. It does, and for a **sharper** reason than a Report has: R9's
  mechanism is **per-origin, not per-object-type**, and FRM-002 issues OData **writes** — a POST is not
  a CORS simple request, so it preflights. The register was widened in-session to name both Forms.
  Ownership is **not** re-decided: it stays with Information Architecture (D-69), deadline unchanged.
- **One carve-out recorded as a Data Model instruction rather than an omission.** The live board header
  carries `Sync point: #4 — Categorization engine trained` (`Financial Planner/project/SPRINT_BOARD.md:7`)
  and **nothing in slice 1 reads it** — no Report renders it, no verb writes it, no rule turns on it. So
  **no `Initiative.syncPoint` attribute exists** (§2 amendment 4), on D-22's principle, and `SPEC-03`
  owes nothing.
- **Reviewing the produced spec caught seven defects the writer's own DoD check passed** — the sixth
  session running, and this time three of them were one class: **the rejection mechanism named cannot
  fire.** §5 rejected a duplicate `Initiative.name` with 409 `frm.sprint.nameDuplicate` while §2
  amendment 2 made it `@assert.unique` — under D-46 that passes through as `ASSERT_UNIQUE`/400 verbatim
  and the named key is unreachable; uniqueness is now a handler check, mirroring `storyId`. The same
  contradiction held for `branch`, whose `@mandatory` cannot produce a `frm.sprint.branchRequired`, so
  that key is withdrawn. **This is `SPEC-05`'s `ASSERT_ENUM` defect recurring** — that one rejected a
  legal value with an assertion that could not fire, this one rejected an illegal one with a key the
  assertion pre-empts; **D-46's split is the module's most-missed rule, three specs running.** The third
  substantive one is a D-64 echo: **BR-18 put BR-07 … BR-17 in a create-handler, but BR-12's story count
  is invisible on a committed Initiative row** — vacuous over an empty set, exactly D-64's trap. BR-18
  now states Plan Sprint arrives as **one deep insert**, which puts the rows in the handler's payload and
  makes BR-22's atomicity structural rather than arranged. Plus four smaller: FUT-003 cited a bare
  `BR-09` where `SPEC-05` carries one too; FUT-012 asserted an ENH-002 outcome its own steps never
  produced; FUT-009's Form step read as impossible without saying that BR-14's refusal of a default is
  what makes an untouched row null; and BR-10 and BR-11 carried `frm.*` keys **with no test at all**,
  now FUT-015. The **unreachable-precondition class did not appear** this time — the first session in
  six where it did not, because the writer had caught its own three before delivery.

### 2026-07-30 — SPEC-05 written: OI-04 resolves, and the PRD was thinner and wider than the catalogue said

- **Applied `SPEC-01`'s sixth and last owed amendment** before opening the workshop (D-68) — §3.1's
  `next_action` row now names **both** modes and the null result, and **BR-16 states the `nextAction` is
  story-scoped to the verb's target story and null when that story has no incomplete Task**, with no
  fallback to workspace scope. `SPEC-01` stays **Draft** and now owes nothing; `SPEC-04` §6's row is
  struck through as applied.
- **Ran the `SPEC-05` workshop over ENH-003, RPT-001 and FRM-001.** Wrote
  `design/specs/SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md` (**Approved**, provisional on **R1 and R9**)
  with 37 business rules, 14 FUTs, one new attribute and one new code list, and logged **D-70 … D-75**.
  **OI-04 is closed** — only OI-05 remains, and it settles at Data Model.
- **Re-verifying the PRD paid for itself, and this time the error was in the catalogue's reasoning
  rather than in a number.** BA-001 §6 asserted the health band vocabulary is "defined **only** for
  personal systems", concluding there was nothing for work-project health to inherit.
  **`PRD.md:1035-1037` applies the identical four values as Area ratings**, and Area is the top of the
  work hierarchy — so a vocabulary did exist. The conclusion survived in weakened form (it is a manual
  monthly-review rating inside a deferred cluster), but slice 1 now **inherits three of the four bands**
  rather than inventing a vocabulary. The other two claims held: "may consider" is verbatim at
  `PRD.md:813`, and the manual-health mandate is real — stated in **three** places, where §3.6 cited one.
- **What decided OI-04 was testing the PRD's six named inputs against data that exists.** Two have
  **no data at all** — no due-date attribute exists on any entity across `SPEC-01` … `SPEC-04` §2, so
  Deadlines and Overdue tasks have nothing to read; **one has no concept**, since `Decision` carries no
  status and records a decision made rather than a pending one; and **one is non-discriminating**, since
  `SPEC-04` BR-25's blocker is structural and every incomplete Task has one. The two inputs the PRD's
  list does **not** name are the ones the module owns — open Defects and the TestRun — because
  `PRD.md:326` modelled a defect as a Task type and **D-19 overruled it**, so the list predates the entity.
- **The storage question turned out not to be a preference (D-70).** The stall input makes health a
  function of `now`, and this module **schedules nothing**, so a stored value would have no recompute
  trigger and would be wrong between writes. Derived-on-read is forced, and the reason is computed in the
  same pass — which is the PRD's explainability principle discharged without a column.
- **The roll-up question split, and that was the finding (D-71).** D-22 and D-67 point opposite ways, and
  the honest answer is that both apply to different halves: **below the Workspace the migration already
  supplies 3 Initiatives and 12 Milestones**, so n>1 exists on real data without conjuring anything —
  stronger than D-67's case, which needed a `plan_sprint` call. **Above the Workspace nothing creates a
  second Area or Engagement** — no verb (D-58), no Form (BA-001 §7) — which is D-22's shape exactly, and
  BA-001 §6 already stopped the roll-up at the Workspace in its own wording. Then the neat part:
  **`PRD.md:836`'s "completed children stop affecting health" changes no outcome and is therefore not
  coded.** A Done Milestone's only possible incomplete Task is Recommended (SPEC-02 BR-17 derives Done
  exactly when every blocking Task is Complete), and Recommended never degrades health, so its only route
  to an adverse signal is an Open Defect — which degrades either way. Under worst-child-wins, "excluded"
  and "Healthy" are indistinguishable, so health **never reads a derived status at all**, exactly as
  `SPEC-04` BR-03 does not.
- **A gap between two approved decisions, again found by specifying the object that exercises both
  (D-72).** `TestRun` has **no attribute recording when the test ran**, so the gate tile would order by
  `createdAt` — which on the seeded run reads the cutover date for a run executed 2026-07-10, while
  **`SPEC-03` BR-28 already stamps the checkpoint Activity from the same source file at its own date.**
  Same checkpoint, opposite treatment. `executedAt` closes it; **`SPEC-03` was amended in-session** on
  D-67's precedent (§2 amendment 13, BR-25a, FUT-007), the second amendment made to an Approved spec.
- **Initiative-status gating is answered no, and the argument is D-66's own (D-73).** A gate would make a
  Done story's residual `documentation` unreachable the moment the sprint closes — undoing, one spec
  later, the two decisions D-66 and D-67 spent on making it surface. Complete records a git fact, not a
  lock; **FRM-001 warns at the transition instead**, which is `SPEC-01` BR-11's shape applied one level up
  and puts the check where the human is. **`SPEC-04` BR-04's candidate set is unchanged and `SPEC-04` owes
  no amendment** — stated explicitly, because the question was handed here twice.
- **D-40's "no legal write path" analysis recurred one object over (D-74).** `Initiative.mergeCommit` and
  `tag` have **no writer**: CNV-002 seeds the two historical Initiatives, no verb in D-40's eleven writes
  either, and W1-S3 needs both the moment Financial Planner's CNV-001 closes. FRM-001 writes them,
  **mandatory on the transition to Complete**, which turns D-62's "Complete means merged and tagged" from
  a description into a constraint.
- **Reviewing the produced spec caught seven defects the writer's own DoD check passed** — the fifth
  session running, and the largest count yet. The sharpest: **§3.2 claimed more than one Active Initiative
  is unreachable in slice 1, and its own FUT-005 disproves it** — `plan_sprint` creates W1-S4 while W1-S3
  is still open, which is also `SPEC-04` FUT-006's fixture, and D-62 gave the Initiative no Planned state
  to land in; BR-20 now names the tiebreak (highest `position`). **FUT-014 rejected a `migration` narrative
  kind with `ASSERT_ENUM`, which cannot fire** — `migration` is a _valid_ `Activity.kind`, so the payload is
  well-formed and the rule broken is the write partition, not the enum; that is D-46's split read
  correctly, and it needed its own key. **BR-32 gained the rejected-write guarantee**, because `SPEC-01`
  BR-05 binds _verbs_ and does not reach a Form, leaving FUT-012's "the Initiative is unchanged" with no
  rule behind it. Plus four fixture fixes — two preconditions asserting D-004 without seeding it, one step
  with no expected result, and a `resolve_defect` call with no resolution, which `SPEC-01` BR-19 rejects.
  **The unreachable-precondition class appeared twice more**, making it five sessions out of five.

### 2026-07-28 — SPEC-04 written: a Recommended stage that surfaces, and the first amendment to an Approved spec

- **Applied `SPEC-01`'s fifth owed amendment** before opening the workshop — FUT-014's accepted FRICEW
  value becomes **`Interface`**, not `Interfaces` (D-60 rules the code-list values singular); the
  rejected value stays `Integration`. One word, no rule or fixture touched. `SPEC-01` stays **Draft**;
  `SPEC-03` §6's row is struck through as applied. Note the row lived in **`SPEC-03` §6 only** —
  `SPEC-01` §6 never carried it, so there was nothing to strike there.
- **Ran the `SPEC-04` workshop over ENH-002 and RPT-002.** Wrote
  `design/specs/SPEC-04-NEXT-ACTION.md` (**Approved**, provisional on **R1 and R9**) with 34 business
  rules, 16 FUTs and two Data Model amendments, and logged **D-66 … D-69**.
- **Re-verification found no drift this time, which is itself worth recording** — it had found some
  three sessions running. The board holds exactly as `SPEC-03` documents it (12 stories, 11 Done,
  Financial Planner's CNV-001 Backlog, nothing In Progress, three Initiatives); `build.js:6-14` still
  declares the same seven phases; all nine stage drivers exist as five commands and four skills.
- **`BA-001` v1.4 had left three values stale that D-60 and D-65 had already ruled on**, all applied
  in-session at **v1.5**: INT-003's and CNV-002's `Interfaces` → **`Interface`** (§2's plurals are
  count-row headings and correctly stay), and RPT-004's "~6 seeded decisions" → **five**. The same
  stale D-09 wording was live twice in this document, §6 and §7, and is fixed. A decision can be
  logged and still not reach the documents it governs — which is the fourth time a re-verification
  pass has paid for itself.
- **The question `SPEC-02` handed here is answered, and it moved more than one line (D-66).**
  `next_action` returns the next incomplete Task in **position order regardless of kind**, carrying
  the kind so the display ranks it. The option rejected is the one that reads as tidier: skipping
  Recommended steps would mean `documentation` is surfaced at **no point in any story's life** — a
  step CNV-001 seeds, `/refresh-docs` drives, and D-56 (5) spent a per-step `description` on. That is
  P3 reintroduced by the object built to remove it.
- **Answering it forced the candidate set, which is the session's real finding (D-67).** Had workspace
  mode considered only Backlog/In Progress Milestones, a Done story's open `documentation` would still
  have surfaced nowhere, because RPT-002's headline is workspace-scoped — D-66 would have been true on
  paper and false in the product. So the resolver now runs on **every Milestone holding an incomplete
  Task** and **never reads `Milestone.status`**: a three-tier rank computed from Tasks alone that
  coincides exactly with `SPEC-02` BR-17's derivation, which also sidesteps D-64's vacuous-derivation
  trap rather than depending on it.
- **D-22's "no specification without a test" was tested against the ordering rule and does not
  reach it.** D-22 refused a Type system because a second type cannot be conjured; a second open story
  is one `plan_sprint` call, which `SPEC-02` FUT-006 already makes. Migrated data exercises the
  degenerate n=1 case and a synthetic fixture exercises n>1, so the rule is written. Scoping it out
  would also have amended BA-001 §6 and left RPT-002 — "the component that must work alone" for PSV
  falsifiable check 3 — with no headline.
- **The tiebreak is where an Approved spec had to be amended.** `createdAt` is not one: CNV-002 loads
  twelve rows in one instant and `plan_sprint` creates a sprint's stories in one call, so it
  degenerates to alphabetical within a batch — CNV before ENH before FRM, which is neither board order
  nor build order. `Initiative.position` and `Milestone.position` are added instead, using ordering
  information `plan_sprint`'s `stories[]` array already carries and currently discards. **`SPEC-03` is
  Approved and was amended in-session** — §2 amendment 12, both §3.1 tables, BR-14a, BR-33a, FUT-001
  and FUT-002. Rules were **inserted as `BR-14a` / `BR-33a` rather than renumbered**, because `SPEC-02`
  and `SPEC-03`'s own FUTs cite BR-15 … BR-34 by number.
- **`R9` now has an owner (D-69).** `SPEC-04` is the first spec carrying a Report and ships
  **provisional on R9** the way `SPEC-01`…`SPEC-03` ship provisional on R1. R9 changes no rule and no
  FUT here — it decides which **origin** serves the page, not what the page says — so it was assigned
  rather than executed mid-workshop: to **Information Architecture**, which D-21 already gives the job
  of composing the four Reports into one page. Assigning it at all is D-39's lesson; an unowned R1 is
  what left "neither module has ever connected to Postgres" to be discovered at the `SPEC-01` workshop.
- **Reviewing the produced spec caught four defects the writer's own DoD check passed** — the fourth
  session running. The real one: **FUT-010's precondition was unreachable through its own guards**,
  naming `commit` as the last incomplete Task and then calling `complete_stage` on it, which
  `SPEC-02` §5 rejects with `verb.stage.notStarted`; `commit` must be **In Progress**. This is the
  third time that exact defect class has appeared — `SPEC-01` FUT-005, `SPEC-02` FUT-016, now here —
  and it is worth naming as a standing check: **a spec that specifies ordering writes fixtures its own
  ordering forbids.** Also: **BR-12 was overclaimed and contradicted by its own FUT-002**, asserting no
  `SPEC-02` guard can refuse the resolved Task when BR-20 plainly refuses `start_stage` on an In
  Progress one — scoped to the verb the payload's `status` names. And two FUT titles cited bare
  `BR-16` and `BR-19` where **`SPEC-04` has rules of those numbers too**, so both now name their spec.
- **D-37 §11.1's amendment trigger was tested a second time and again did not fire.** The positions
  are derived from `plan_sprint`'s existing ordered `stories[]` array, so no verb signature changes —
  D-55's precedent, recorded rather than left silent.

### 2026-07-28 — SPEC-03 written: the verbs cannot perform the migration, and CNV-004 earns its row back

- **Applied `SPEC-01`'s four owed amendments** before opening the workshop — FUT-005's precondition
  mirrored onto `SPEC-02` FUT-014, `MethodologyStep.conditional` restated as a predicate name, the
  `complete_stage` guard precedence added to §5, and BR-13 cross-referenced to `SPEC-02` BR-28. `SPEC-01`
  stays **Draft**; `SPEC-02` §6's four rows are struck through as applied.
- **Ran the `SPEC-03` workshop over CNV-002, CNV-003 and CNV-004.** Wrote
  `design/specs/SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md` (**Approved**, provisional on R1) with 34
  business rules, 12 FUTs and eleven Data Model amendments, and logged **D-58 … D-65**.
- **The load cannot run on the verb layer, and that is the spec's spine (D-58).** Testing CNV-002/003
  against D-40's eleven found four separate blocks: no verb creates an Area, Engagement or Workspace;
  `plan_sprint` creates Milestones in Backlog, so under D-54 all twelve would get a chain — the exact
  inverse of D-15; `log_defect` requires a `story` and `DEFECT_LOG.md` records only a **Sprint**; and
  `record_test_run` is **structurally blocked**, since `SPEC-02` BR-29 refuses a Not Started target Task
  and W1-S2's Milestones have no Tasks at all. The migration writes through the CAP service layer
  instead — D-05 binds _agents_ bypassing the service layer, the same reading D-20 used to clear the two
  Forms. This also settles where the checkpoint narrative comes from: CNV-003 itself, not FRM-001, which
  is Wave 2 and would have repeated D-51's rejected option B.
- **CNV-004 was hollow and is now rescoped rather than deleted (D-59).** D-54 left it asserting what
  `SPEC-02` FUT-004 and FUT-005 already assert. Widened from the chain alone to the **whole load's
  tie-out** — counts, chain, typing, provenance — which is the reconciliation approach
  `DESIGN_WORKSHOP.md` §4.2 demands of every Conversion and which genuinely spans CNV-002 and CNV-003.
  BA-001 → **v1.4**. The distinction that saves it: `SPEC-02`'s FUTs test whether ENH-001's _rule_ works;
  CNV-004 tests whether _this load's data_ came out right.
- **Re-verifying the source paid for itself three times.** The board held **exactly** as documented (12
  stories, 11 Done, nothing In Progress, three Initiatives, both SHAs and tags confirmed against git) —
  but the checkpoint metrics are misquoted everywhere: BA-001, `PLAN.md` and the brief all say "98.73%
  statements", the checkpoint separates **Statements 98.73%** from **Lines 98.71%**, and `SPEC-01`'s
  `TestRun` carries `linesPct` with **no statements attribute**. The correct seed is **98.71**.
  `DEFECT_LOG.md` has **no story column and no title column**. And the checkpoint records **five**
  decisions, not six — its third narrative bullet says "(see FRM-003 decision 1)" and is that decision
  recorded twice (D-65).
- **A gap between two approved decisions, found only by specifying the object that exercises both
  (D-64).** D-53 and `SPEC-02` BR-17 make `Milestone.status` derived and never written; D-54 fires
  ENH-001 on "created with status Backlog". At creation both cases have zero Tasks and BR-17's "every
  blocking Task is Complete" is **vacuously true over an empty set**, so the derivation returns Done for
  both and cannot discriminate the very case the trigger turns on. It is a **transient creation input** —
  not a stored flag either, which D-54 explicitly rejected. Amends `SPEC-02` §3.2.
- **Reviewing the produced spec caught three defects the writer's own DoD check passed** — the third
  session running that this has been worth doing. BR-23 was one-directional ("resolution only when
  Closed"), so FUT-006's assertion that the three Closed defects **carry** resolutions had no rule behind
  it; §5 claimed a failed migration leaves an **empty** database, which contradicts FUT-012's own second
  fixture, since atomicity is per conversion and a failing CNV-003 leaves CNV-002's rows committed; and
  BR-04 never named **which** conversion emits the `migration` Activity row, which a build persona would
  have had to ask. All three fixed.
- **Other rulings:** FRICEW code-list values are **singular** (D-60), so CNV-002 remaps only two rows and
  `SPEC-01` FUT-014 owes one word; thin sources **derive shape, never linkage** (D-61), so every Defect
  ships with a null story rather than an inferred one; Initiative status is **written**, Active/Complete,
  with new `mergeCommit` and `tag` attributes (D-62); and the migration writes under a dedicated
  **`migration`** identity emitting **two** Activity rows rather than one per row (D-63).

### 2026-07-27 — SPEC-02 written: the guard table, no twelfth verb, and a fourth drift in §5

- **Ran the `SPEC-02` workshop over CNV-001, ENH-001 and WFL-001.** Wrote
  `design/specs/SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md` (**Draft**, provisional on R1) with 33
  business rules and 18 functional unit tests, and logged **D-47 … D-57**. All three things `SPEC-01`
  deferred here are discharged.
- **`PLAN.md` §5 had drifted a third time, and this section's claim about itself was also wrong.**
  Re-verifying against `.claude/` before seeding found **UX Test's condition is `shipsUi`, not
  `FRM-*`** (`.claude/commands/ux-test.md:10-12`) — the load-bearing one, because slice 1 carries four
  Reports that all ship pages against two Forms, so the prefix rule would have left UX Test
  structurally absent from the entire project view (D-47). Also: **two of the seven subtasks are
  conditional in the workflow** (`build.js:597`, `:666`), resolved as `smoke` Conditional and
  `coverage` Required, because `build.js:772` always yields a coverage outcome (D-48). And §5's claim
  to be `CNV-001`'s only source is false — `human-review-loop/SKILL.md:11-13` states the same nine
  stages in the same order.
- **A fourth drift, inside `BA-001` itself and dated the same day.** Its CNV-004 row still read
  "Sprint Build's **6** Subtasks" — D-38 corrected CNV-001's row and `PLAN.md` §5 and missed this one.
  Fixed at BA-001 v1.3.
- **D-37 §11.1's amendment trigger was tested and did not fire (D-55).** Every guard is decided from
  `story`, `stage`, `subtask`, `reason` and the caller identity `INT-001` already carries under D-41,
  so none needed a new or changed verb input and **D-37 stands unamended**. The seam held in a
  stronger form than §11.1 anticipated: `SPEC-01`'s `verb.stage.blocked` is the **envelope** and
  `SPEC-02`'s nine `wfl.*` keys are the rules inside it. Recorded rather than left silent, because a
  tested-and-held trigger is a finding.
- **No twelfth verb, and D-40's eleven stand (D-50).** With conditionality resolved once at
  instantiation, a step that does not apply is **never created** — so there is nothing to cancel, and
  "the record survives" becomes an invariant (nothing deletes a Task or Subtask) rather than a
  transition needing a verb. `SPEC-01`'s BR-02 is untouched.
- **`BA-001` said ENH-001 fires "on Milestone creation" — which collides with CNV-002 creating twelve
  Milestones of which eleven must get no chain.** Settled as creation-in-Backlog (D-54), which turns
  D-15's policy into a mechanism: you cannot honestly hold a chain for work finished before the system
  existed. **Consequence for `SPEC-03`: CNV-004 stops being an instantiation step** and becomes the
  assertion that the chain came out right.
- **Two more `SPEC-01` amendments surfaced beyond the ones already known.** Its FUT-005 precondition
  names `smoke` open on `financial-planner/CNV-001`, a backend-only Conversion where `smoke` is never
  materialised; and its §5 lists rejection conditions with no precedence, which D-52 now supplies.
  Four amendments are owed in total — listed in §3 and in `SPEC-02` §6, none applied yet.
- **Reviewing the produced spec caught two defects the writer's own DoD check passed.** A business
  rule was missing for D-56's `start_stage`-returns-subtasks ruling, leaving §3.3 citing a rule that
  said nothing about it and FUT-006 asserting behaviour no rule carried; and FUT-016's precondition
  was **unreachable through its own guards** — `functional-test` In Progress while `test-quality` was
  Not Started is a state BR-19 refuses to create. Both fixed. The second is the same defect class as
  the `SPEC-01` FUT-005 problem, which is worth noting: a spec that specifies ordering can write test
  fixtures its own ordering forbids.

### 2026-07-27 — SPEC-01 written: eleven verbs, four of them forced

- **Ran the `SPEC-01` workshop over `INT-001`** — 18 questions across six rounds, no `[WORKSHOP]`
  placeholder surviving. Wrote `design/specs/SPEC-01-MCP-INTENT-VERB-LAYER.md` (**Draft**) with 29
  business rules and 16 functional unit tests, and logged **D-40 … D-46**.
- **The verb inventory was the real gap, and it grew from seven to eleven (D-40).** D-05 sketched six
  and D-20 added `plan_sprint`; testing that list against every slice-1 object that has to write
  found four with no legal write path — which matters _only_ because D-05 removed the CRUD escape
  hatch, so an unlisted capability is unreachable rather than merely awkward. Added:
  `record_test_run` (INT-004 writes a `TestRun`), `reopen_stage` (WFL-001 owns stage reopening),
  `resolve_defect` (**CNV-003 seeds defect D-004 as Open, and nothing could ever have closed it**),
  and `complete_subtask` (RPT-003 displays subtask state). No `complete_story` — a Milestone's state
  is derived, so nothing can advance a story past its own methodology.
- **Two rulings whose consequences are worth knowing before they surprise someone.** Activity events
  emit _inside_ the verb's transaction (D-42), so the log only ever records what happened — and a
  rejected call therefore leaves **no trace at all**, making enforcement invisible in the timeline.
  That is written as a carve-out and as a cross-spec note against RPT-004, not left to be
  rediscovered. And agents write under their **own** identity rather than a shared `claude-agent`
  (D-41), which is what makes "who advanced this stage" a queryable fact — at the stated cost that a
  caller declaring itself falsely is unprovable.
- **The template's §2 had nothing to point at, and the fix is cross-spec (D-43).** DESIGN_WORKSHOP
  §4.1 wants a DM-001 entity table, but this module runs Workshops at stage 5 and Data Model at
  stage 9. Each spec's §2 now _states_ the entities and attributes it requires, as an **input** to
  Data Model rather than a reference to it — so the model gets built from twelve specs' worth of
  stated requirements instead of guesses. Applies to all twelve specs.
- **R6's shape recurred one object over (D-44).** `.mcp.json` is gitignored (`.gitignore:13`) and
  untracked, exactly like `.claude/settings.json` — so INT-001's server registration would be absent
  on a fresh clone while INT-006's linter and hook installer survived. It ships as a tracked
  installer on D-32's precedent. Root `CLAUDE.md` claimed `.mcp.json` was a repo artifact; corrected.
- **Addressing is workspace-qualified (D-45)** — `financial-planner/CNV-001`, with a bare story ID
  **rejected rather than resolved**, because BA-001 §3.3 documents five IDs live on both modules'
  boards and the cheap option fails by writing to the wrong story rather than by erroring.

### 2026-07-27 — Workshops opened: grouping settled as D-37, two documents found stale

- **Settled the grouping before running any workshop (D-37).** `DESIGN_WORKSHOP.md` §3 is the
  planner's own 21-spec cut over 43 objects and is not inherited; its _principle_ is. Applying that
  principle to 22 objects gives **twelve specs** — five grouped, seven standalone — recorded as
  `BUSINESS_ARCHITECTURE.md` §11 rather than only in the decisions log, because `/workshop` Phase 0
  reads a module grouping table and derives one only when there is none. Without it the same question
  would have been re-litigated at the start of all twelve sessions, with no guarantee of the same
  answer twice. **Spec number is build order**, which the planner's numbering is not — it needs §8 as
  a second table to reconcile the two, and one sequence needs no reconciliation.
- **The contested cut is `SPEC-01`.** `complete_stage`'s failure modes _are_ `WFL-001`'s rejections,
  so merging `INT-001` and `WFL-001` was a real option. Split, on the seam BA-001 §4 already drew:
  INT-001 says _that_ a rejection surfaces as a typed MCP error, WFL-001 says _which_ rejections
  exist. Recorded with its own amendment trigger — if `SPEC-02`'s workshop cannot state a guard
  without changing a verb signature, D-37 gets amended rather than quietly patched.
- **`PLAN.md` §5 had drifted from `.claude/`, and §5 is `CNV-001`'s only source (D-38).** Sprint
  Build has **seven** subtasks, not six — `build.js:7-13` declares a `Handoff` phase both this
  document and BA-001 omitted. That is the load-bearing one: Handoff is where the build workflow
  writes the sprint board, the exact write `INT-002` rewires onto `complete_stage`, so a chain seeded
  six deep would have left the migration's most-cited handoff with no node to land on. Stages 4 and 5
  also still named bare agents rather than the `/functional-test` and `/ux-test` commands D-35
  authored. A continuity doc naming a superseded driver is P4 — in the document the seed reads from.
- **R1 was attempted and is worse than the research recorded (D-39).** Postgres is listening on 5432
  and `@cap-js/postgres` is installed, so the spike was cheap — but the server accepts neither an
  empty password nor the default, and `Financial Planner/package.json:82-88` declares
  `"password": ""`, which SCRAM rejects outright. **Financial Planner has never connected to this
  Postgres either**; all six of its integration suites run `--in-memory` on SQLite. R1 is unproven
  for _both_ modules. Deferred to **Data Model**, together with standing the binding up; `SPEC-01`
  ships **provisional on R1** with the dependency stated in the spec rather than left in a register.
- **The Scaffold push carry-forward is closed** — all four branches are on the remote and
  `sprint/W1-S3` is in sync with its upstream.

### 2026-07-27 — Scaffold complete: module wired, root §Undecided emptied, R2 and OI-03 closed

- Authored `/scaffold-module` + the `scaffold-writer` agent (D-14 — skills as their stage
  arrives), then ran the stage. Created `Project Tracker/` with `package.json`,
  `eslint.config.mjs`, `tsconfig.json`, `CLAUDE.md` and an empty `db/ srv/ app/ test/` skeleton.
  **No FRICEW object was built** — structure only.
- **Root `CLAUDE.md` §Undecided is empty.** All three items closed: namespace (D-03),
  cross-module data (D-29), shell (D-30). The section became **Cross-Module Rulings**, and R9's
  unexecuted cross-origin problem is written into it rather than left in the research pack where
  a future module would not look. One new item opened: where the shared standards live, which a
  second module _in build_ should trigger.
- **R2 is settled by execution, not by reasoning (D-33).** `CDS_TYPESCRIPT=true` plus a `tsx`
  loader — both required, independent levers. Node 22.19's native type stripping is **not**
  sufficient: the shared `tsconfig.base.json` sets `module: Node16`, so source imports a sibling
  as `./types.js` and strip-only mode cannot resolve that to `./types.ts`. Financial Planner
  writes `.js` specifiers in every relative import, so this is the repo idiom. `tsx` alone fails
  differently and more quietly — the service starts, then rejects every call with "no handler",
  because the resolver never offered the file. `INT-001` and `INT-004` are unblocked.
- **Scaffolding broke Financial Planner and the verification caught it (D-34).** Adding the
  second workspace package made npm hoist one CAP runtime for the whole repo and pull 9.9.3 via
  `@cap-js/cds-test`'s `>=8.8` peer range — **68 tests across 6 suites failed** mid-sprint, because
  9.9.x `await`s `cds.plugins` in `bin/serve.js` and Jest's CJS VM rejects the dynamic import.
  `@sap/cds` is now pinned to `9.8.4` at the root and in both modules; FP is back to 286/286.
  npm `overrides` was tried first and is silently ignored when it conflicts with a direct
  dependency. Also hit: `@cap-js/cds-types`' `postinstall` symlink for `@types/sap__cds` does not
  survive an incremental install, which fails every module's `tsc`.
- **OI-03 closed (D-35).** Authored `/functional-test` and `/ux-test`; gave `/human-review-loop`
  a chain position and the rule that an agent may never close the stage on its own behalf. All
  nine Sprint Build stages now have an invocation point — which the project view depends on,
  since a next action naming an unrunnable stage is the P4 defect the module exists to remove.
- **The second module falsified three shared claims, all fixed at the root (D-36).** The `lint:*`
  block is not copy-verbatim safe (`lint:ui5` names a planner app folder); `lintNoTrackingIds.ts`
  crashed on a `scripts/` folder only the planner has; and `eslint` exits 2 on an empty source
  tree. The root's linter count read 20 and is 21.
- **Git remote configured** — `https://github.com/sseryani98/LifeOS.git`. Nothing pushed yet.

### 2026-07-26 — Research complete: pack written, OI-01 and OI-02 closed, BA-001 → v1.1

- Ran `/gather-research` in a fresh agent, deliberately without this thread's context, on four
  topics. Wrote `research/` — six documents, all **Draft**. Gate verdict: **GO WITH CAVEATS**.
- **D-05 holds, and was proven rather than argued.** A spike executed CAP `before`/`on`/`after`
  handlers, `ASSERT_MANDATORY`, `ASSERT_RANGE`, managed fields and transaction rollback with
  `cds.app === undefined` and zero server handles, plus a full MCP stdio → CAP round trip with a
  handler rejection surfacing as a typed error. **Wave 1 may proceed on `INT-001`.**
- **Fourteen prior assumptions graded; the refutations were the valuable output.** A bare
  `cds.connect.to()` **throws** — D-05 named a mechanism that fails as written, so the sentence
  was amended and the decision kept (D-28). `INT-001`'s OI-02 carve-out was **inverted** — two
  models makes it simpler, not harder. **CAP has no data export at all**, so OI-01's assumed
  mechanism does not exist and had to become an object. **`.claude/settings.json` is
  gitignored.** **`MultiEdit` is not a tool.** Financial Planner **already runs a hand-built
  shell**, so "nobody has checked" was wrong for the single-module case.
- **Five decisions ruled: D-28 … D-32.** Two CDS models and separate Postgres databases (D-29);
  one shared UI5 shell, non-negotiable, which composes with D-29 because a shell needs one
  _origin_ rather than one service (D-30); `pg_dump -Fc` plus a built CSV exporter to a git
  remote (D-31); `INT-006` matcher and installer-script corrections (D-32).
- **BA-001 amended to v1.1 — 21 → 22 objects.** `INT-007` Project State Exporter added, typed
  as an **Interface** rather than the Conversion D-27 pre-labelled it: a recurring exporter
  inside §5's strict `CNV-001 → … → CNV-005` execution chain would not belong there.
- The research agent **declined to write to the decisions log**, correctly — it ran unattended,
  and every entry would have asserted a ruling not yet made. It staged five proposals instead.
- **The repo has no git remote at all.** So "survives laptop loss" is a property the current
  markdown state does not have either — the migration is not taking away something already held.

### 2026-07-26 — Scope complete: BA-001 written, 21 objects in 3 waves

- Ran `/generate-business-architecture`: two scouts in parallel (the PRD; the repo migration
  and rewiring surface), boundary and pile confirmation, eleven scoping forks worked through,
  `ba-writer` production.
- Wrote `design/BUSINESS_ARCHITECTURE.md` (BA-001, **Approved**) — 21 objects: 6 Interfaces,
  5 Conversions, 3 Enhancements, 2 Forms, 4 Reports, 1 Workflow. Waves are _the store exists_
  (7) → _Sandro can see and steer it_ (8) → _cutover_ (6).
- Appended **D-19 … D-27** to the decisions log. The load-bearing ones: Defect is its own
  entity with four registers written and three shown (D-19); slice 1 ships two Forms plus a
  `plan_sprint` verb, because cutover otherwise removes the only way to create a sprint
  (D-20); the rewiring surface is ten files, not eight (D-23); no stage history is backfilled
  and `TestRun` starts at FP's CNV-001 (D-24); the Activity log is a side effect of the verb
  layer rather than an object (D-25).
- **D-26 corrects D-10** — `gate-runner` cannot write the `TestRun`. Its tools are
  `Read, Grep, Bash`, it has no write channel, and it carried zero retired-path references so
  it was invisible to the original surface measurement. The write moves to
  `generateTestReport.ts`, which already runs as `posttest` and already holds the Jest JSON.
- **P2 is knowingly unserved by slice 1** — D-11 executing as written. PSV §4 falsifiable
  check 6 cannot be evaluated until a later slice. Recorded in BA-001 §3.2, not left silent.
- Corrected two factual errors in PSV-001 §2 that the scouts caught against the repo: the
  defect log holds **four defects, one still Open** (it said "currently empty"), and **11 of
  12 stories are Done** (it said 12). Both are the P4 error class, in the traceability root.
- Settled the linter count, which four documents disagreed on: **20 wired `lint:*` scripts**,
  21 linter files on disk — `lintI18n.ts` exists in `Standards (Technical + Linting)/scripts/`
  but is not wired into any npm script.
- **D-21 settles stages 6–8**: IA, Design System and Theme run in full, because four Reports
  and two Forms is a real UI.

### 2026-07-26 — Ideate complete: PSV-001 written, decisions log seeded

- Moved the staged skills/agents from `Project Tracker/_claude-staging/` into `.claude/` and
  deleted the staging folder.
- Ran `/generate-problem-statement-vision`: three scouts (prior material, FP precedent, repo
  constraints), gap map confirmed by Sandro, gap interview, vision-writer production.
- Wrote `design/PROBLEM_STATEMENT_AND_VISION.md` (PSV-001, **Draft** — amended by later
  stages, Approved only at design close) and seeded `design/DECISIONS_LOG.md` with
  D-01 … D-18 and OI-01 … OI-05. All eight Definition-of-Done checks passed.
- Problems were reframed **module-wide** during the interview (P1 integrity-is-manual as the
  foundation, P2 fragmented project universe, P3 invisible process, P4 reconstruction tax,
  P5 history-as-prose); slice 1 is cut from them in PSV §6, not the other way round.
- Rulings landed: cutover before **CNV-001**, since FRM-001 is Done (D-13); FRICEW type is
  **Interfaces** (D-09); decisions log at `design/DECISIONS_LOG.md` (D-17); source precedence
  PLAN > KICKOFF > PRD > BLUEPRINT (D-18); root `CLAUDE.md` §Undecided update owed at
  Scaffold (D-03).
- Deleted `IDEATE_KICKOFF.md` per its own instruction, after verifying every ruling it
  carried now lives in PSV-001, the decisions log, or this file.

### 2026-07-26 — Foundations settled, Plan-phase skills authored

- Read the PRD, `METHODOLOGY_BLUEPRINT.md`, `IDEATE_KICKOFF.md`, and FP's current board.
- Settled all twelve decisions in §2, including the three framing forks the kickoff note left
  open and two `CLAUDE.md` "undecided" items.
- Verified FP's namespace is `com.financialplanner` and measured the rename blast radius.
- Authored three Plan-phase skills with four companion agents:
  - `/generate-problem-statement-vision` + `vision-writer`
  - `/generate-business-architecture` + `domain-scout`, `ba-writer`
  - `/gather-research` + `research-scout`
- Rewrote `IDEATE_KICKOFF.md` with the settled decisions.
- Added the **Rewire tooling** stage (§6): measured the eight-file migration surface, decided
  `/pm-update` retires down to a thin git-vs-state and catalogue-vs-backlog reconciler, and
  specified two deterministic guards — a hard-denying `PreToolUse` hook and a
  `lintNoMarkdownState` linter — both enabled at cutover, not before.

**Tooling constraint discovered:** the Cowork device bridge **cannot write into `.claude/`**
("Writing to .claude is not permitted via remote tools"). Skills and agents authored in a
Cowork session must be staged elsewhere and moved locally. The three skills above were staged
to `Project Tracker/_claude-staging/` — copy `skills/*` → `.claude/skills/` and `agents/*` →
`.claude/agents/`, then delete the staging folder.

**Also note:** past chat transcripts are not reachable from a Cowork session — Claude Code
stores them under the user's home directory, which the bridge cannot access.
`DESIGN_PHASE_TIMELINE.md` is the closest record of how FP's artifacts came to be.

---

## 9. Related documents

| Document                                                 | What it holds                                                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Project Tracker/PRD.md`                                 | Full product design. Slice 1 is a small fraction of it.                                                                                          |
| `Project Tracker/design/PROBLEM_STATEMENT_AND_VISION.md` | PSV-001 — the traceability root: problems P1–P5, scope, boundary.                                                                                |
| `Project Tracker/design/BUSINESS_ARCHITECTURE.md`        | BA-001 v1.13 — the FRICEW catalogue and the story backlog. 22 objects, 3 waves, deferred items in §3, **the 12-spec grouping in §11**.           |
| `Project Tracker/design/specs/`                          | The twelve functional specs, written in `SPEC-01` → `SPEC-12` order. Grouping and membership are BA-001 §11. **12 of 12 written, all Approved.** |
| `Project Tracker/research/`                              | Six research documents plus `README.md` — the index, assumption ledger, open risks and gate verdict. All **Draft**.                              |
| `Project Tracker/design/INFORMATION_ARCHITECTURE.md`     | IA-001 — page and route decomposition, navigation, shell placement and origin. **Approved.**                                                     |
| `Project Tracker/design/DESIGN_SYSTEM.md`                | DS-001 — build technology, theme, density, layout, controls, semantic roles, status indicators, state conventions. **Draft.**                    |
| `Project Tracker/design/DECISIONS_LOG.md`                | D-01 … D-152 with full rationale. (`IDEATE_KICKOFF.md` was scratch — absorbed and deleted 2026-07-26.)                                           |
| `Standards (Documents)/METHODOLOGY_BLUEPRINT.md`         | The methodology→tooling map. **§7 is partly superseded** — the module is real, not a generator, and it writes rather than only reads.            |
| `Financial Planner/design/`                              | The artifact set this module's design phase mirrors.                                                                                             |
| `Financial Planner/design/DESIGN_PHASE_TIMELINE.md`      | How the design phase actually ran, step by step.                                                                                                 |
