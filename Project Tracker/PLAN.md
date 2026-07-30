# Project Tracker — Plan

**Status:** Plan phase — Ideate, Scope, Research and Scaffold complete; Workshops in progress
(grouping settled, `SPEC-01` … `SPEC-12`; **6 of 12 written**)
**Last updated:** 2026-07-30
**Purpose:** The continuity document. Anyone (or any fresh chat) picking up Project Tracker
starts here. Read this, then `design/PROBLEM_STATEMENT_AND_VISION.md` (PSV-001),
`design/BUSINESS_ARCHITECTURE.md` (BA-001) and `design/DECISIONS_LOG.md` for the full
decision rationale.

---

## 1. Where we are right now

Financial Planner is mid-sprint **W1-S3 — Transaction Processing**, with one story left in
Backlog (`CNV-001` Historical backfill) and nothing In Progress. That gap is deliberate — it
is the cutover window.

Project Tracker has a PRD, `design/PROBLEM_STATEMENT_AND_VISION.md` (PSV-001, **Draft**),
`design/BUSINESS_ARCHITECTURE.md` (BA-001 v1.7, **Approved** — 22 objects in 3 waves, grouped into
12 specs), a `research/` pack of six documents, a decisions log (D-01 … D-82), a wired module folder,
**six written specs** — `SPEC-01` **Draft**, `SPEC-02` … `SPEC-06` **Approved** —
and the
Plan-phase skills installed in `.claude/`. **No module code exists yet.** Ideate, Scope and Research ran
2026-07-26; Scaffold, the Workshops grouping, `SPEC-01` and `SPEC-02` ran 2026-07-27; `SPEC-03` and
`SPEC-04` ran 2026-07-28; `SPEC-05` and `SPEC-06` ran 2026-07-30. **OI-01, OI-02, OI-03 and OI-04 are
closed**; **only OI-05 remains**, at Data Model.

### The one-paragraph version

Project Tracker becomes a real CAP module that **owns project state**. The markdown files that
currently hold that state (`SPRINT_BOARD.md`, `DEFECT_LOG.md`, sprint checkpoints, test
reports) are retired, and the existing build skills are rewired to write to the module through
an MCP server instead. This lands _before_ Financial Planner's last story, so `CNV-001`
becomes the first real test of the new system.

---

## 2. Decisions already made

Full rationale in `design/DECISIONS_LOG.md` (D-01 … D-82; D-19 … D-27 were added at Scope,
D-28 … D-32 at Research, D-33 … D-36 at Scaffold, D-37 … D-39 at the Workshops grouping,
D-40 … D-46 at the `SPEC-01` workshop, D-47 … D-57 at the `SPEC-02` workshop, D-58 … D-65 at the
`SPEC-03` workshop, D-66 … D-69 at the `SPEC-04` workshop, D-70 … D-75 at the `SPEC-05` workshop and
D-76 … D-82 at the `SPEC-06` workshop). The founding twelve,
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

| #   | Stage              | Skill                                   | Skill status | Stage status                                                                            |
| --- | ------------------ | --------------------------------------- | ------------ | --------------------------------------------------------------------------------------- |
| 1   | Ideate             | `/generate-problem-statement-vision`    | Authored     | **Done** — 2026-07-26                                                                   |
| 2   | Scope              | `/generate-business-architecture`       | Authored     | **Done** — 2026-07-26                                                                   |
| 3   | Research           | `/gather-research`                      | Authored     | **Done** — 2026-07-26                                                                   |
| 4   | Scaffold           | `/scaffold-module` → `scaffold-writer`  | Authored     | **Done** — 2026-07-27                                                                   |
| 5   | Workshops          | `/workshop` → `spec-writer`             | Exists       | **In progress** — D-37 grouping; `SPEC-01` Draft, `SPEC-02` … `SPEC-06` Approved (6/12) |
| 6   | Information Arch.  | `/generate-information-architecture`    | Not authored | Not started — runs in full (D-21)                                                       |
| 7   | Design System      | `/generate-design-system`               | Not authored | Not started — runs in full (D-21)                                                       |
| 8   | Theme              | `/generate-theme`                       | Not authored | Not started — runs in full (D-21)                                                       |
| 9   | Data Model         | `/generate-data-model`                  | Not authored | Not started                                                                             |
| 10  | Tech Stack         | `/generate-tech-stack`                  | Not authored | Not started                                                                             |
| 11  | Test Strategy      | `/generate-test-strategy`               | Not authored | Not started                                                                             |
| 12  | Project Planning   | `/generate-build-plan`                  | Not authored | Not started                                                                             |
| 13  | Build              | `/build` + chain                        | Exists       | Not started                                                                             |
| 14  | **Rewire tooling** | `lintNoMarkdownState` + PreToolUse hook | Not authored | Not started                                                                             |
| 15  | Cutover            | —                                       | —            | Not started                                                                             |
| 16  | Back to FP         | —                                       | —            | Blocked on cutover                                                                      |

Stages 6–8 (IA, Design System, Theme) **run in full** — settled by D-21. Slice 1 carries four
Reports and two Forms, which is a real UI rather than a thin shell.

### Immediate next action

**The spec grouping is settled — D-37, twelve specs, the table is `BUSINESS_ARCHITECTURE.md` §11.**
`/workshop` reads that table; it does not re-derive a grouping per session. Spec number is build
order, so the sequence is simply `SPEC-01` → `SPEC-12`.

**`SPEC-01` … `SPEC-06` are written**, all six provisional on R1 and `SPEC-04` … `SPEC-06` additionally on R9. `SPEC-01`
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

**Next is `SPEC-07` — Chain & Registers** (RPT-003, RPT-004), Wave 2. `SPEC-06` owes it one thing:
RPT-004's combined timeline must render the two Activity kinds this workshop added — **`sprintPlanned`
and `storyAdded`** (D-81) — and `SPEC-06` BR-25's extension of `SPEC-05` BR-33's partition is what keeps
that timeline separable into its machine and human halves without parsing payloads.

**Still open:** **OI-05 alone** (methodology genericity — Data Model). **OI-03 is closed by D-35 and
OI-04 by D-70.** Research risks: R2 is closed
by D-33 and R3/R8 dissolved with D-29; **R1, R4, R7 and R9 remain unexecuted** — see
`research/README.md` §5. Two of the four now have an owner rather than only a description:

- **R1 goes to Data Model (D-39), and it is worse than the research thought.** The finding is not
  that Postgres is unproven for this module — it is that `Financial Planner/package.json:82-88`
  declares `"password": ""`, which SCRAM rejects, so **neither module has ever connected to
  Postgres**; all six planner integration suites run on in-memory SQLite. Standing the binding up is
  a prerequisite of Data Model, not a detail inside it. **`SPEC-01` ships provisional on R1.**
- **R9 now has an owner — the Information Architecture stage (D-69), assigned at the `SPEC-04`
  workshop.** `SPEC-04` is the first spec carrying a Report and **ships provisional on R9**, exactly
  as `SPEC-01`…`SPEC-03` ship provisional on R1; `SPEC-05`, **`SPEC-06`** and `SPEC-07` inherit that
  status. **`SPEC-06` carries no Report and inherits R9 anyway (D-82)** — R9's mechanism is
  **per-origin, not per-object-type**, and a Form is the more exposed case, since it issues OData
  **writes** and a POST is not a CORS simple request, so it preflights. `research/README.md` §5's R9
  **Affects cell was widened in that session** to name `FRM-001` and `FRM-002` alongside the four
  Reports; ownership is unchanged. R9
  changes no business rule and no FUT in any Report spec — it decides which **origin** serves the
  page, not what the page says — which is why it was assigned rather than executed mid-workshop. Its
  deadline is unchanged: **before `RPT-001`…`RPT-004` are built**, which is Wave 2 _build_, not Wave 2
  spec. IA is named because D-21 already gives it how the four Reports compose into one page and it
  is the next stage to run. Assigning it at all is D-39's lesson applied: a risk recorded with no
  owner is what left R1 unexecuted until a workshop tripped over it.

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

Catalogued as 21 FRICEW objects in `design/BUSINESS_ARCHITECTURE.md` (BA-001), which is now
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
the workflow writes the sprint board, the exact write `INT-002` rewires onto `complete_stage`; and
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

**Measurement caveat.** A directory-scoped ripgrep over `.claude/` silently returns only the
`.js` hits; the `.md` files match only with an explicit `**/*.md` glob. Any future measurement
of this surface that omits the glob under-reports by six files.

| File                                                            | Refs  | What changes                                                                                                                                                  |
| --------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/skills/pm-update/SKILL.md`                             | 4     | Mostly retired — see below                                                                                                                                    |
| `.claude/workflows/build.js`                                    | 3     | Per-story board handoff → `complete_stage` / `start_stage`                                                                                                    |
| `Standards (Technical + Linting)/scripts/generateTestReport.ts` | 2     | Stops writing markdown; emits a `TestRun` record                                                                                                              |
| `.claude/commands/build.md`                                     | 2     | Instructions repointed at MCP verbs                                                                                                                           |
| `.claude/agents/build-briefer.md`                               | 2     | Reads board state via `project_view` instead of parsing                                                                                                       |
| `.claude/workflows/test-quality.js`                             | 1     | Repoint                                                                                                                                                       |
| `.claude/skills/human-review-loop/SKILL.md`                     | 1     | Feedback/defect capture → `log_defect`                                                                                                                        |
| `.claude/agents/implementer.md`                                 | 1     | Board handoff → `complete_stage`                                                                                                                              |
| **`Standards (Documents)/METHODOLOGY_BLUEPRINT.md`**            | **5** | Ninth file, found at Scope. A "where state lives" table pointing at all four retired paths. The original grep only scanned `Standards (Technical + Linting)/` |
| **`Financial Planner/CLAUDE.md`**                               | **3** | Tenth file, found at Scope. Documents a `project/` folder that stops existing; neither guard reaches it                                                       |

The blueprint is the load-bearing one: it sits inside `lintNoMarkdownState`'s stated
`Standards/**` glob, so leaving it stale turns the linter red the moment it is enabled at
cutover. Separately, **32 references across six `Financial Planner/design/*.md` files** go to a
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

- Matcher: `Write|Edit|MultiEdit`. Inspects `tool_input.file_path` against the retired-path list
  and **hard-denies**, returning a message naming the MCP verb to use instead.
- Precise, no false positives, catches the overwhelming majority of regressions. Deliberately
  does **not** parse `Bash` commands — command regexing is fuzzy and the false positives aren't
  worth the residual shell loophole.
- Guarantees the property regardless of what any agent's prompt says, which is exactly what
  prompt-only instructions cannot do.

**2. `lintNoMarkdownState.ts` — instruction enforcement.** _"Nothing tells you to do the wrong
thing."_

- Joins the existing ~20-linter suite in `Standards (Technical + Linting)/scripts/`. Scans
  `.claude/**` and `Standards/**` for references to retired paths and fails `npm run lint`,
  which is already in the gate.
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
Residual risk **R9**: two CAP processes serving into one shell page is _Inferred_ only, not
executed.

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

| Document                                                 | What it holds                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Project Tracker/PRD.md`                                 | Full product design. Slice 1 is a small fraction of it.                                                                               |
| `Project Tracker/design/PROBLEM_STATEMENT_AND_VISION.md` | PSV-001 — the traceability root: problems P1–P5, scope, boundary.                                                                     |
| `Project Tracker/design/BUSINESS_ARCHITECTURE.md`        | BA-001 v1.6 — the FRICEW catalogue and the story backlog. 22 objects, 3 waves, deferred items in §3, **the 12-spec grouping in §11**. |
| `Project Tracker/design/specs/`                          | The twelve functional specs, written in `SPEC-01` → `SPEC-12` order. Grouping and membership are BA-001 §11. **5 of 12 written.**     |
| `Project Tracker/research/`                              | Six research documents plus `README.md` — the index, assumption ledger, open risks and gate verdict. All **Draft**.                   |
| `Project Tracker/design/DECISIONS_LOG.md`                | D-01 … D-75 with full rationale. (`IDEATE_KICKOFF.md` was scratch — absorbed and deleted 2026-07-26.)                                 |
| `Standards (Documents)/METHODOLOGY_BLUEPRINT.md`         | The methodology→tooling map. **§7 is partly superseded** — the module is real, not a generator, and it writes rather than only reads. |
| `Financial Planner/design/`                              | The artifact set this module's design phase mirrors.                                                                                  |
| `Financial Planner/design/DESIGN_PHASE_TIMELINE.md`      | How the design phase actually ran, step by step.                                                                                      |
