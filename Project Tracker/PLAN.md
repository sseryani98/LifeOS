# Project Tracker — Plan

**Status:** Plan phase — Ideate, Scope and Research complete, Scaffold next
**Last updated:** 2026-07-26
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
`design/BUSINESS_ARCHITECTURE.md` (BA-001 v1.1, **Approved** — 22 objects in 3 waves), a
`research/` pack of six documents, a decisions log (D-01 … D-32), and the three Plan-phase
skills installed in `.claude/`. **No module code exists yet.** Ideate, Scope and Research all
ran 2026-07-26; Scaffold is next. **OI-01 and OI-02 are closed**; OI-03, OI-04 and OI-05 remain.

### The one-paragraph version

Project Tracker becomes a real CAP module that **owns project state**. The markdown files that
currently hold that state (`SPRINT_BOARD.md`, `DEFECT_LOG.md`, sprint checkpoints, test
reports) are retired, and the existing build skills are rewired to write to the module through
an MCP server instead. This lands _before_ Financial Planner's last story, so `CNV-001`
becomes the first real test of the new system.

---

## 2. Decisions already made

Full rationale in `design/DECISIONS_LOG.md` (D-01 … D-32; D-19 … D-27 were added at Scope,
D-28 … D-32 at Research). The founding twelve, summarized — note that **D-28 amends item 4's
wording**: a bare `cds.connect.to()` throws, so the mechanism needs a construction step.

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

| #   | Stage              | Skill                                   | Skill status | Stage status                      |
| --- | ------------------ | --------------------------------------- | ------------ | --------------------------------- |
| 1   | Ideate             | `/generate-problem-statement-vision`    | Authored     | **Done** — 2026-07-26             |
| 2   | Scope              | `/generate-business-architecture`       | Authored     | **Done** — 2026-07-26             |
| 3   | Research           | `/gather-research`                      | Authored     | **Done** — 2026-07-26             |
| 4   | Scaffold           | `/scaffold-module`                      | Not authored | **Next** — skill not yet authored |
| 5   | Workshops          | `/workshop` → `spec-writer`             | Exists       | Not started                       |
| 6   | Information Arch.  | `/generate-information-architecture`    | Not authored | Not started — runs in full (D-21) |
| 7   | Design System      | `/generate-design-system`               | Not authored | Not started — runs in full (D-21) |
| 8   | Theme              | `/generate-theme`                       | Not authored | Not started — runs in full (D-21) |
| 9   | Data Model         | `/generate-data-model`                  | Not authored | Not started                       |
| 10  | Tech Stack         | `/generate-tech-stack`                  | Not authored | Not started                       |
| 11  | Test Strategy      | `/generate-test-strategy`               | Not authored | Not started                       |
| 12  | Project Planning   | `/generate-build-plan`                  | Not authored | Not started                       |
| 13  | Build              | `/build` + chain                        | Exists       | Not started                       |
| 14  | **Rewire tooling** | `lintNoMarkdownState` + PreToolUse hook | Not authored | Not started                       |
| 15  | Cutover            | —                                       | —            | Not started                       |
| 16  | Back to FP         | —                                       | —            | Blocked on cutover                |

Stages 6–8 (IA, Design System, Theme) **run in full** — settled by D-21. Slice 1 carries four
Reports and two Forms, which is a real UI rather than a thin shell.

### Immediate next action

Run **Scaffold**, which needs `/scaffold-module` authored first (D-14 — skills are written as
their stage arrives). Scaffold creates the module folder, the workspace entry, the ESLint
re-export, the tsconfig and the module `CLAUDE.md`, and per D-03 updates the root `CLAUDE.md`
§Undecided — which D-29 and D-30 now close on all three counts (one backend or two, shared
database or isolated, one shell or many).

**Two things to settle at or before Scaffold:**

1. **Set up the git remote.** D-31 makes it the durability destination, and the repo has none
   today — so the code and design docs have no off-machine copy either. This is Sandro's to
   create; nothing has been pushed.
2. **R2 — how a TypeScript service implementation loads outside `cds watch`.** The
   highest-priority residual from Research, and a Tech Stack decision `INT-001` depends on.
   Financial Planner's own tests carry the comment "cds.test cannot load the TypeScript service
   impl", and Project Tracker will be TypeScript.

**Still open:** OI-03 (three stages with no invocation point — settle at Scaffold), OI-04 (what
calculated health computes — the `ENH-003` workshop), OI-05 (methodology genericity — Data
Model). Five research risks remain unexecuted; see `research/README.md` §5.

### Two things worth doing before or during Scaffold

1. **Three slash commands** for `functional-tester`, `ux-tester`, and the `/human-review-loop`
   trigger. Until these exist, the project view can name a next stage that cannot be run.
2. ~~Decide what replaces git for project state~~ — **settled by D-31** (see §7). What remains
   is the mechanical act of creating the git remote.
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

| #   | Task                                                      | Driven by                                                                       | Kind                       |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| 1   | Sprint Build                                              | `/build` → `workflows/build.js`                                                 | Required                   |
| ↳   | _brief → red tests → implement → gate → coverage → smoke_ | build-briefer, test-author, implementer, gate-runner, test-author, smoke-tester | Subtasks                   |
| 2   | Code Quality                                              | `/code-quality`                                                                 | Required                   |
| 3   | Test Quality                                              | `/test-quality`                                                                 | Required                   |
| 4   | Functional Test                                           | `functional-tester` agent                                                       | Required                   |
| 5   | UX Test                                                   | `ux-tester` agent                                                               | Conditional — `FRM-*` only |
| 6   | Human Review                                              | `/human-review-loop`                                                            | Required — manual, Sandro  |
| 7   | Documentation                                             | `/refresh-docs`                                                                 | Recommended                |
| 8   | PM Update                                                 | `/pm-update`                                                                    | Required                   |
| 9   | Commit                                                    | `/commit-diff`                                                                  | Required                   |

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

**Naming collision — settled (D-09):** the canonical FRICEW type is **Interfaces**.
`/pm-update` check 6 says "Integration" and gets corrected when the skill is rewritten in this
stage.

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
- **FRICEW type name collision — settled (D-09).** Canonical is **Interfaces**; `/pm-update`
  gets corrected at the rewiring stage.
- **`research/` is precedent-only** — no `CLAUDE.md` codifies its structure. `/gather-research`
  adds `research/README.md` as pack index and gate, plus a metadata header the exemplars lack.
- **`deep-research` does not exist** despite the blueprint citing it as a seed for
  `/gather-research`. Handled as a runtime conditional.

---

## 8. Session log

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
| `Project Tracker/design/BUSINESS_ARCHITECTURE.md`        | BA-001 v1.1 — the FRICEW catalogue and the story backlog. 22 objects, 3 waves, deferred items in §3.                                  |
| `Project Tracker/research/`                              | Six research documents plus `README.md` — the index, assumption ledger, open risks and gate verdict. All **Draft**.                   |
| `Project Tracker/design/DECISIONS_LOG.md`                | D-01 … D-32 with full rationale. (`IDEATE_KICKOFF.md` was scratch — absorbed and deleted 2026-07-26.)                                 |
| `Standards (Documents)/METHODOLOGY_BLUEPRINT.md`         | The methodology→tooling map. **§7 is partly superseded** — the module is real, not a generator, and it writes rather than only reads. |
| `Financial Planner/design/`                              | The artifact set this module's design phase mirrors.                                                                                  |
| `Financial Planner/design/DESIGN_PHASE_TIMELINE.md`      | How the design phase actually ran, step by step.                                                                                      |
