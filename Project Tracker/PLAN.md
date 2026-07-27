# Project Tracker — Plan

**Status:** Plan phase, pre-Ideate
**Last updated:** 2026-07-26
**Purpose:** The continuity document. Anyone (or any fresh chat) picking up Project Tracker
starts here. Read this, then `IDEATE_KICKOFF.md` for the full decision rationale.

---

## 1. Where we are right now

Financial Planner is mid-sprint **W1-S3 — Transaction Processing**, with two stories left in
Backlog (`FRM-001` Transaction List, `CNV-001` Historical backfill) and nothing In Progress.
That gap is deliberate — it is the cutover window.

Project Tracker has a PRD, a set of foundational decisions (below), and three newly authored
Plan-phase skills. **No module code exists yet.** The Ideate stage has not run.

### The one-paragraph version

Project Tracker becomes a real CAP module that **owns project state**. The markdown files that
currently hold that state (`SPRINT_BOARD.md`, `DEFECT_LOG.md`, sprint checkpoints, test
reports) are retired, and the existing build skills are rewired to write to the module through
an MCP server instead. This lands *before* Financial Planner's last two stories, so those
stories become the first real test of the new system.

---

## 2. Decisions already made

Full rationale in `IDEATE_KICKOFF.md`. Summary:

| # | Decision |
| - | -------- |
| 1 | **Project Tracker owns project state.** Not a read-only mirror, not a PM overlay. |
| 2 | **A real CAP module, now** — not the v1 HTML generator, not a JSON-seed intermediate. |
| 3 | **Namespace `com.lifeos.projecttracker`.** The `CLAUDE.md` "undecided" item is closed. |
| 4 | **Access via a bespoke MCP server over CAP, in-process** (`cds.connect.to()`), exposing **intent-level verbs**, not CRUD and not raw SQL. |
| 5 | **Hierarchy:** sprint = Initiative, story = Milestone, methodology stage = Task, workflow step = Subtask. |
| 6 | **v1 serves Financial Planner only.** Non-software projects and personal systems are a later slice. |
| 7 | **Migration scope is project state only.** `design/*.md` stays markdown. |
| 8 | **Cutover before `FRM-001`**, while the board is clean. |
| 9 | **Full Plan + Design methodology**, narrowly scoped to the slice-1 surface. |
| 10 | **`/generate-*` skills authored as their stage arrives.** |
| 11 | **The v1 dashboard is deleted**, not evolved. |
| 12 | **FP's namespace rename is deferred** until after W1-S3. |

---

## 3. The sequence

### Stage status

| # | Stage | Skill | Skill status | Stage status |
| - | ----- | ----- | ------------ | ------------ |
| 1 | Ideate | `/generate-problem-statement-vision` | **Authored** | **Next** |
| 2 | Scope | `/generate-business-architecture` | **Authored** | Not started |
| 3 | Research | `/gather-research` | **Authored** | Not started |
| 4 | Scaffold | `/scaffold-module` | Not authored | Not started |
| 5 | Workshops | `/workshop` → `spec-writer` | Exists | Not started |
| 6 | Information Arch. | `/generate-information-architecture` | Not authored | Scope-dependent |
| 7 | Design System | `/generate-design-system` | Not authored | Scope-dependent |
| 8 | Theme | `/generate-theme` | Not authored | Scope-dependent |
| 9 | Data Model | `/generate-data-model` | Not authored | Not started |
| 10 | Tech Stack | `/generate-tech-stack` | Not authored | Not started |
| 11 | Test Strategy | `/generate-test-strategy` | Not authored | Not started |
| 12 | Project Planning | `/generate-build-plan` | Not authored | Not started |
| 13 | Build | `/build` + chain | Exists | Not started |
| 14 | **Rewire tooling** | `lintNoMarkdownState` + PreToolUse hook | Not authored | Not started |
| 15 | Cutover | — | — | Not started |
| 16 | Back to FP | — | — | Blocked on cutover |

Stages 6–8 (IA, Design System, Theme) depend on how much UI slice 1 actually has — Scope
decides whether they run in full or are trimmed.

### Immediate next action

Run **Ideate** using the newly authored `/generate-problem-statement-vision`, producing
`Project Tracker/design/PROBLEM_STATEMENT_AND_VISION.md`.

Note that the PRD already covers much of the vision, so the interview should fill gaps and
settle scope rather than re-eliciting known answers — the skill is built to handle exactly
this case.

### Two things worth doing before or during Scaffold

1. **Three slash commands** for `functional-tester`, `ux-tester`, and the `/human-review-loop`
   trigger. Until these exist, the project view can name a next stage that cannot be run.
2. **Decide what replaces git for project state** (see Open Items §1) — this must be settled
   *before* cutover, not after.
3. **Note the rewiring stage exists** (§6). Eight files carry references to the retired state
   files, and `/pm-update` largely dissolves. Worth knowing while writing the Build Plan so it
   is estimated, not discovered.

---

## 4. Slice 1 scope

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

| # | Task | Driven by | Kind |
| - | ---- | --------- | ---- |
| 1 | Sprint Build | `/build` → `workflows/build.js` | Required |
| ↳ | *brief → red tests → implement → gate → coverage → smoke* | build-briefer, test-author, implementer, gate-runner, test-author, smoke-tester | Subtasks |
| 2 | Code Quality | `/code-quality` | Required |
| 3 | Test Quality | `/test-quality` | Required |
| 4 | Functional Test | `functional-tester` agent | Required |
| 5 | UX Test | `ux-tester` agent | Conditional — `FRM-*` only |
| 6 | Human Review | `/human-review-loop` | Required — manual, Sandro |
| 7 | Documentation | `/refresh-docs` | Recommended |
| 8 | PM Update | `/pm-update` | Required |
| 9 | Commit | `/commit-diff` | Required |

---

## 6. Rewiring the tooling (stage 14)

Every skill, agent, command, workflow and script that reads or writes project state must move
onto the MCP verbs. This is its own stage, immediately before cutover, because it is real work
with a measurable surface — not a footnote inside cutover.

### The surface — eight files

Measured 2026-07-26 by grepping `.claude/` and `Standards (Technical + Linting)/` for
`SPRINT_BOARD`, `DEFECT_LOG`, `sprints/`, `test-reports`:

| File | Refs | What changes |
| ---- | ---- | ------------ |
| `.claude/skills/pm-update/SKILL.md` | 4 | Mostly retired — see below |
| `.claude/workflows/build.js` | 3 | Per-story board handoff → `complete_stage` / `start_stage` |
| `Standards (Technical + Linting)/scripts/generateTestReport.ts` | 2 | Stops writing markdown; emits a `TestRun` record |
| `.claude/commands/build.md` | 2 | Instructions repointed at MCP verbs |
| `.claude/agents/build-briefer.md` | 2 | Reads board state via `project_view` instead of parsing |
| `.claude/workflows/test-quality.js` | 1 | Repoint |
| `.claude/skills/human-review-loop/SKILL.md` | 1 | Feedback/defect capture → `log_defect` |
| `.claude/agents/implementer.md` | 1 | Board handoff → `complete_stage` |

### `/pm-update` — retire most of it, keep a thin reconciler

Blueprint §6 reframed `/pm-update` from write-back into a **consistency auditor**, cross-checking
board against defect log against checkpoints against git. Once there is one store with
constraints, most of that drift becomes *structurally impossible to create* — the skill's reason
for existing largely dissolves.

- **Delete:** the checks that compare markdown artifacts against each other. The schema is now
  the audit.
- **Keep:** only what the database cannot enforce — **git history vs recorded state**, and
  **the FRICEW catalogue vs the actual story backlog**. Both cross a boundary the DB does not
  own.
- Result should be a much smaller skill that is honest about what it still buys you.

**Note the naming collision:** `/pm-update` check 6 enforces FRICEW Type ∈ {…, **Integration**,
…} while `BUSINESS_ARCHITECTURE.md` says "Interfaces". Settle this while rewriting the skill
rather than carrying the contradiction forward (see §7).

### Two deterministic guards

These are complementary, not alternatives. **A hook cannot perform the migration — it can only
ratchet it shut afterward.** The rewiring above is still real work.

**1. `PreToolUse` hook — runtime enforcement.** *"You cannot do the wrong thing."*

- Matcher: `Write|Edit|MultiEdit`. Inspects `tool_input.file_path` against the retired-path list
  and **hard-denies**, returning a message naming the MCP verb to use instead.
- Precise, no false positives, catches the overwhelming majority of regressions. Deliberately
  does **not** parse `Bash` commands — command regexing is fuzzy and the false positives aren't
  worth the residual shell loophole.
- Guarantees the property regardless of what any agent's prompt says, which is exactly what
  prompt-only instructions cannot do.

**2. `lintNoMarkdownState.ts` — instruction enforcement.** *"Nothing tells you to do the wrong
thing."*

- Joins the existing ~20-linter suite in `Standards (Technical + Linting)/scripts/`. Scans
  `.claude/**` and `Standards/**` for references to retired paths and fails `npm run lint`,
  which is already in the gate.
- Catches what the hook structurally cannot see: a skill file still *instructing* an agent to
  edit the board.

### Sequencing constraint

**Enable both guards at cutover, not before.** While markdown is still authoritative, the hook
would block legitimate Financial Planner work. They are the final act of stage 14.

### Repo-first note

`.claude/settings.json` currently contains **permissions only — no hooks are configured**. This
is a new pattern for the repo, so expect to establish the convention (where hook scripts live,
how they're tested) as part of this stage. And per §9, the Cowork bridge cannot write into
`.claude/` — the hook config stages like the skills did.

---

## 7. Open items

### Blocking cutover

**1. What replaces git for project state.** Moving state out of markdown into Postgres loses
durability that currently comes for free — markdown was diffable, revertable, and cloned with
the repo. This is a **regression the migration introduces**, not a pre-existing gap. Needs
answers on: backup mechanism, frequency, retention and location; whether a versioned
representation exists at all (periodic CDS/CSV export committed to git? seed-data files as the
checked-in form? backups only?); and whether a restore has ever been tested.

### Blocking design, not Ideate

**2. Overall CAP/UI5 plan across modules.** A second module forces the cross-module questions
the root `CLAUDE.md` lists as undecided:

- One backend or two — is Financial Planner in the same CAP service, or does each module run
  its own service and database?
- One frontend or many — one UI5 app you can navigate between modules from, or a shell per
  module? (`CLAUDE.md` §Undecided already flags "Shell".)
- Shared database, or isolated modules? Related to the "Cross-module data" item.

Bears directly on the namespace decision already taken and on the in-process MCP design, which
assumes a resolvable single CDS model.

### Non-blocking

**3. Financial Planner namespace rename — deferred, not cancelled.** FP declares
`namespace com.financialplanner;`. Measured blast radius: **65 files, 192 occurrences**
(excluding `node_modules`, `gen`, `@cds-models`, `coverage` — all regenerate). Roughly 34 in
`app/` UI5 controllers and views, 11 in `db/` and `srv/` CDS, 6 in integration tests, plus
`package.json`, `CLAUDE.md`, and two design docs. Renames as its own change after W1-S3.

**4. Three stages with no invocation point.** `functional-tester` and `ux-tester` exist as
agents but have no slash command; `/human-review-loop` has no defined trigger.

### Small rulings, surfaced while authoring the skills

- **Blueprint §5.1 contradicts itself on Ideate's agents.** It lists `interviewer, writer`, but
  its own note and §3.2 say the interview stays in the main thread, and the proven `/workshop`
  row says `scouts + interview → writer`. The authored skill follows the proven pattern; §5.1's
  "interviewer" should be corrected to "scouts".
- **Decisions-log path.** FP uses `design/user-profile/DECISIONS_LOG.md`; `user-profile/` reads
  as planner-specific. `vision-writer` defaults to `design/DECISIONS_LOG.md` and flags it.
- **FRICEW type name collision.** `BUSINESS_ARCHITECTURE.md` says "Interfaces";
  `/pm-update` check 6 enforces Type ∈ {…, **Integration**, …}. One is wrong.
- **`research/` is precedent-only** — no `CLAUDE.md` codifies its structure. `/gather-research`
  adds `research/README.md` as pack index and gate, plus a metadata header the exemplars lack.
- **`deep-research` does not exist** despite the blueprint citing it as a seed for
  `/gather-research`. Handled as a runtime conditional.

---

## 8. Session log

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

| Document | What it holds |
| -------- | ------------- |
| `Project Tracker/PRD.md` | Full product design. Slice 1 is a small fraction of it. |
| `Project Tracker/IDEATE_KICKOFF.md` | Decision rationale and the Ideate warm-start brief. |
| `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` | The methodology→tooling map. **§7 is partly superseded** — the module is real, not a generator, and it writes rather than only reads. |
| `Financial Planner/design/` | The artifact set this module's design phase mirrors. |
| `Financial Planner/design/DESIGN_PHASE_TIMELINE.md` | How the design phase actually ran, step by step. |
