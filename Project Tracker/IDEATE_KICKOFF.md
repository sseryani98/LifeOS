# Project Tracker — Ideate Kickoff (handoff note)

**Purpose:** Warm-start the Problem Statement & Vision conversation in a fresh chat. This is
a scratch note, not a design artifact — delete it once `PROBLEM_STATEMENT_AND_VISION.md`
exists.

**Updated 2026-07-26.** The three framing forks are now settled and several `CLAUDE.md`
"undecided" items have been ruled on. Read §Decisions before anything else — parts of
`Standards (Documents)/METHODOLOGY_BLUEPRINT.md` §7 are now superseded.

## Where we are

Plan phase → **Ideate** stage for the Project Tracker (PMO) module — the second Life OS
module. Deliverable: `Project Tracker/design/PROBLEM_STATEMENT_AND_VISION.md`, same structure
as `Financial Planner/design/PROBLEM_STATEMENT_AND_VISION.md` (Who / Core Problem / Vision /
The Question It Answers / Problems to Solve / What "Solved" Looks Like / Design Decisions /
Scope / Out of Scope / Open Items).

Run it as an interview — one question at a time, spend Sandro's time only on what he alone
can decide. `Project Tracker/PRD.md` already covers a great deal of the vision; the Ideate
interview should fill gaps and settle scope, not re-elicit what the PRD states.

## Decisions (2026-07-26)

### The three framing forks — settled

1. **Project scope** — **v1 is literally just Financial Planner.** The PRD's wider reach
   (non-software projects, persistent personal systems) is explicitly a later slice. Do not
   stretch the day-one data model to accommodate them.
2. **System of record** — **Project Tracker owns state and skills write to it.** Not a
   read-only mirror, not a PM overlay. Markdown state files are retired.
3. **Primary job** — project-state tracking first. Methodology and tooling views ride along
   because the methodology *is* modelled as tasks, not as a separate showcase.

### Now decided, previously "undecided" in `CLAUDE.md`

- **Namespace: `com.lifeos.projecttracker`.** The `com.lifeos.{module}` convention is
  adopted. Check Financial Planner and retro-fit it if it diverges.
- **Project Tracker is promoted to a module** via the "Adding a Module" checklist and joins
  the root `workspaces` array. It is no longer a pre-module tool.

### Build shape

- **A real CAP module, now** — not the v1 HTML generator, and not a JSON-seed intermediate.
- **The v1 dashboard is removed.** `Project Tracker/dashboard/` (`generate.mjs` +
  `dashboard.html`) is deleted rather than evolved. Its parser is no longer the ingestion
  seed, because there is nothing to ingest once state lives in the module.
- **Migration scope is project state only.** `project/SPRINT_BOARD.md`,
  `project/DEFECT_LOG.md`, `project/sprints/*.md` and `project/test-reports/` become records.
  Everything under `design/` stays markdown — those are prose deliverables, and
  `/refresh-docs` already owns them.
- **Consequence Sandro accepted:** this lands *ahead of* finishing Financial Planner, not
  after. FP's remaining two stories run on the new system.

### Access layer — bespoke MCP server over CAP, in-process

How skills and agents read and write project state. **An MCP server loads the CDS model and
calls the CAP service layer in-process via `cds.connect.to()` against Postgres.**

- *Rejected: a generic Postgres MCP writing SQL directly.* It bypasses the service layer, the
  Facade/Service/DataService/Validator/Mapper pattern, CDS constraints and managed fields —
  discarding the whole reason to build a CAP module rather than a JSON store, and letting a
  malformed write corrupt state silently.
- *Rejected: MCP over HTTP to a running CAP service.* Single logic location, but every agent
  write inherits an ambient "is the service up?" dependency that fails unpredictably.
- In-process keeps CAP handlers executing (validation still applies) with no separate process
  to keep alive. Claude Code starts it from `.mcp.json`, same as the existing Playwright MCP.

**Tool shape: intent-level verbs, not generic CRUD** — `start_stage`, `complete_stage`,
`log_defect`, `record_decision`, `next_action`, `project_view`. Agents never need schema
knowledge, typed inputs make malformed writes fail loudly at the boundary, and the module can
**enforce the methodology** (`complete_stage("commit")` rejects while Human Review is open —
a rule currently inexpressible). No CRUD escape hatch; it becomes the default path.

**Layering:** the MCP server provides the verbs; the *existing* skills (`/pm-update`,
`build.js`, `/human-review-loop`, `/commit-diff`) are rewired to call them instead of editing
markdown. No new skill required.

## Hierarchy mapping — Financial Planner into the PRD schema

```
Area          Personal Software
Engagement    Life OS
Workspace     Financial Planner                (persistent)
Initiative    W1-S3 — Transaction Processing   (time-boxed = sprint)
Milestone     FRM-001, CNV-001                 (= user story)
Task          methodology stage
Subtask       workflow step
```

Story sits at **Milestone**, not Task, because the PRD caps subtasks at one level (§3). With
story as Task, the build workflow's six internal agent steps would have nowhere to live.
Effect: *"what task is next"* answers with a **stage**, not a story.

## The Sprint Build methodology, as it instantiates per story

Grounded in the real `.claude/` inventory, not aspirational:

| # | Task | Driven by | Kind |
| - | ---- | --------- | ---- |
| 1 | Sprint Build | `/build` → `workflows/build.js` | Required |
| ↳ | *brief → red tests → implement → gate → coverage → smoke* | build-briefer, test-author, implementer, gate-runner, test-author, smoke-tester | Subtasks |
| 2 | Code Quality | `/code-quality` → `workflows/code-quality.js` | Required |
| 3 | Test Quality | `/test-quality` → `workflows/test-quality.js` | Required |
| 4 | Functional Test | `functional-tester` agent | Required |
| 5 | UX Test | `ux-tester` agent | Conditional — `FRM-*` only, skipped for `ENH-*`/`CNV-*`/`INT-*` |
| 6 | Human Review | `/human-review-loop` | Required — manual, Sandro |
| 7 | Documentation | `/refresh-docs` | Recommended |
| 8 | PM Update | `/pm-update` | Required |
| 9 | Commit | `/commit-diff` | Required |

**Gap noticed:** `functional-tester` and `ux-tester` exist as agents but have **no slash
command**, and `/human-review-loop` has no defined trigger point. Every other stage in the
chain is invocable. If the project view is going to say "this stage is next," those three
are where *next* doesn't map to something runnable.

## Slice 1 — what the first build actually covers

**In scope:**

- Hierarchy entities: Area, Engagement, Workspace, Initiative, Milestone, Task, Subtask
- Methodology + MethodologyStep (the library, and per-story instantiation)
- Defect, Decision, Activity log, TestRun
- The Financial Planner migration — **and only Financial Planner**
- The MCP access layer, and rewiring the existing skills onto it
- The project view: next action + task queue · methodology chain per story · workspace
  header (status, Current Focus, calculated health) · the three registers

**Test reports become records.** `generateTestReport.ts` currently writes timestamped Jest
summaries to `project/test-reports/` (total / passed / failed / skipped / duration), unlinked
to anything. These become a lightweight **TestRun** entity written by `gate-runner` and linked
to the story's stage — giving the workspace header a real gate-status tile and a trend.

**Deferred to later slices:** meetings, agenda items, ideas, resources, notes, requirements,
risks, gamification, scheduling and work blocks, weekly and monthly planning, calendar sync,
Apple Notes capture, search.

**Seed depth:** Build phase, all sprints. W1-S1 and W1-S2 as completed Initiatives with their
stories as Done Milestones (no per-stage detail — it was never tracked). W1-S3 fully modelled
with the live methodology chain.

## Cutover

Migrate and switch the skills over **while W1-S3 sits between stories** — board is clean,
nothing In Progress, FRM-001 not yet started. FRM-001 and CNV-001 then run entirely on the
new system, which is also the real test of it before Project Tracker's own build continues.

## Methodology for this module

Full Plan + Design — every stage runs (Ideate → Scope → Research → Scaffold → Workshops →
IA → Design System → Theme → Data Model → Tech Stack → Test Strategy → Project Planning) —
but **scoped only to the slice-1 surface**, so each artifact stays short.

Missing `/generate-*` skills are **authored as their stage arrives**: reach the Data Model
stage → author `/generate-data-model` → run it. Per blueprint §3.1, no stage is done by hand.

## Read first (context already produced)

- `Project Tracker/PRD.md` — the full product design. Slice 1 is a small fraction of it.
- `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` — the keystone. §4–5 are the
  methodology→tooling map. **§7 is now partly superseded** by the decisions above: the module
  is real, not a generator, and it writes rather than only reads.
- `Financial Planner/design/` — the artifact set this module's design phase mirrors.

## Constraints from CLAUDE.md still in force

- Cross-module data sharing remains undecided.
- One module is not a pattern — Financial Planner plus Project Tracker is the *first*
  evidence of what is genuinely a standard. Don't over-generalize from the planner.

## Open items

None blocking. The four questions this note previously carried — data model reach, access
layer, UX Test conditionality, and the fate of `test-reports/` — were all settled on
2026-07-26 and are recorded above.

Two things to resolve *during* the design phase rather than before it:

- **Financial Planner's namespace.** Check whether it already follows `com.lifeos.{module}`;
  if not, decide whether to retro-fit it now or leave the inconsistency until it bites.
- **The three unrunnable stages.** `functional-tester`, `ux-tester` and `/human-review-loop`
  need invocation points before the project view can meaningfully say "this is next."
