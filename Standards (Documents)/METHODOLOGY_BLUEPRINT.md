# Life OS — Methodology Blueprint

**Document ID:** MB-001
**Version:** 0.1 (Draft)
**Date:** 2026-07-15
**Status:** Draft — for review
**Scope:** Cross-module. Formalizes the Plan → Design → Build methodology proven on the
Financial Planner and turns it into reusable Claude Code tooling (skills, agents,
workflows). Also specifies the **Project Tracker** (PMO) module that visualizes it.

---

## 1. Change History

| Date       | Author          | Description                                                                 |
| ---------- | --------------- | -------------------------------------------------------------------------- |
| 2026-07-15 | Sandro & Claude | Initial draft. Methodology→tooling map, gap analysis, PMO module design.    |

---

## 2. Why this document exists

The Financial Planner was built through a repeatable process — 15 design steps
(`Financial Planner/design/DESIGN_PHASE_TIMELINE.md`) followed by sprint-based build. That
process lives partly in prose docs and partly in a maturing set of `.claude/` assets. It
was *discovered* on one module. This blueprint does two things:

1. **Formalize** the process so a second module (and a third) can pick it up as tooling,
   not tribal memory — every stage gets a skill, workflow, or agent, and each step runs in
   an isolated agent so context stays clean.
2. **Specify the Project Tracker (PMO) module** — a dashboard that makes the current state
   of any Life OS project visible (stage, sprint board, decisions, defects) plus the
   tooling that drives it.

This is a **draft blueprint**, not a ratified standard. It names things that do not exist
yet. Per the repo's own rule (`Standards (Documents)/README.md`), a genuine cross-module
standard is only promoted once a second module proves which parts are the standard and
which were only ever the planner's example. This document is the on-ramp to that proof.

---

## 3. Design principles (from Sandro)

These are load-bearing constraints, not preferences:

1. **Every project stage has a skill, workflow, or agent.** No stage is "just do it by
   hand." The methodology is executable.
2. **Agents exist for context isolation.** A stage that would otherwise flood the main
   context with reading, tool output, or trial-and-error is pushed into a subagent that
   returns only its conclusion.
3. **A workflow uses one agent per step.** The build workflow already proves the shape:
   *write failing tests* → *build until green* → *run the gate* → *evaluate quality* →
   *smoke/playwright* are each a separate agent. New workflows follow the same rule.
4. **Reuse and extend before inventing.** Where an existing asset already does the job (or
   nearly does), the blueprint maps onto it and notes the extension, rather than spawning a
   parallel duplicate.

---

## 4. The methodology at a glance

Three phases, each a sequence of stages. Every stage produces a durable **artifact** and is
driven by **tooling**. The stage list below reconciles Sandro's target methodology with the
15 steps actually executed on the planner (`DESIGN_PHASE_TIMELINE.md`).

```
PLAN
  Ideate                → Problem Statement & Vision
  Scope                 → Business Architecture (FRICEW catalogue)
  Research              → Feature/context research pack
  Scaffold              → Module skeleton (folders, lint pipeline, CLAUDE.md)

DESIGN
  Workshops             → Lean Specs (one per FRICEW group)
  Information Arch.     → Information Architecture
  Design System         → Design System
  Theme                 → Theme
  Data Model            → Data Model
  Tech Stack            → Tech Stack
  Test Strategy         → Test Strategy
  Project Planning      → Build Plan + Project Management

BUILD  (per sprint, per story)
  Sprint Build          → Green, reviewed story (brief→red→green→gate→coverage→smoke)
  Code Quality          → Consensus quality findings, applied
  Test Quality          → Consensus test gaps, implemented
  Functional Test       → Pass/fail report over all functional cases
  UX Test               → Holistic UX/theme/consistency report
  Human Review          → Feedback triaged into durable prevention
  Documentation         → Fresh, consistent technical docs
  PM Update             → Sprint board / defect log / checkpoint updated
  Commit                → Conventional commit matching repo history
```

---

## 5. Stage → tooling map

Legend for **Status**: **Have** = exists and fits; **Extend** = exists but needs a change
for reuse across modules; **New** = must be authored.

### 5.1 Plan

| Stage    | Artifact                        | Tooling (proposed)                     | Status | Context-isolated agents |
| -------- | ------------------------------- | -------------------------------------- | ------ | ----------------------- |
| Ideate   | `PROBLEM_STATEMENT_AND_VISION`  | `/generate-problem-statement-vision`   | New    | interviewer, writer     |
| Scope    | `BUSINESS_ARCHITECTURE` (FRICEW) | `/generate-business-architecture`      | New    | domain-scout, writer    |
| Research | `research/` pack                | `/gather-research` (+ `research-scout` agent) | New | research-scout (×N, parallel) |
| Scaffold | Module skeleton                 | `/scaffold-module`                     | New    | scaffolder              |

Notes:

- **Ideate / Scope** mirror the `/workshop` shape: a subagent (or a short interview) gathers
  what only Sandro knows, a writer subagent produces the artifact. The interview stays in the
  main thread; reading and drafting are delegated.
- **Research** is fan-out by nature (many sources) — the exact case for isolation. One
  `research-scout` per topic runs in parallel and returns citations, not raw pages. The
  existing `deep-research` skill can seed this.
- **Scaffold** encodes the repo's "Adding a Module" checklist (`CLAUDE.md` §Adding a Module):
  create the folder, add to root `workspaces`, copy the `lint:*` block, re-export the shared
  eslint config, extend the base tsconfig, write a module `CLAUDE.md`, `npm install`. This is
  deterministic enough to be a script-backed skill (like the existing workflow `.js` files).

### 5.2 Design

| Stage             | Artifact                    | Tooling (proposed)                   | Status  | Context-isolated agents            |
| ----------------- | --------------------------- | ------------------------------------ | ------- | ---------------------------------- |
| Workshops         | `specs/SPEC-nn` (Lean Spec) | `design-workshop` **workflow**       | Extend  | `/workshop` scout(s) → **spec-writer** agent |
| Information Arch.  | `INFORMATION_ARCHITECTURE`  | `/generate-information-architecture` | New     | ia-scout, writer                   |
| Design System      | `DESIGN_SYSTEM`             | `/generate-design-system`            | New     | writer                             |
| Theme             | `THEME`                     | `/generate-theme`                    | New     | writer                             |
| Data Model         | `DATA_MODEL`                | `/generate-data-model`               | New     | model-scout, writer                |
| Tech Stack         | `TECH_STACK`                | `/generate-tech-stack` (copy-forward) | New    | writer                             |
| Test Strategy      | `TEST_STRATEGY`             | `/generate-test-strategy` (copy-forward) | New | writer                             |
| Project Planning   | `BUILD_PLAN` + `PROJECT_MANAGEMENT` | `/generate-build-plan`       | New     | plan-scout, writer                 |

Notes:

- **Workshops — the one explicit refactor.** Today `/workshop` scouts, interviews, *and*
  writes the spec in one skill. Sandro's target splits it: **one agent runs the workshop**
  (`/workshop` — scouts + interview) and **a separate `spec-writer` agent writes the Lean
  Spec** from the interview transcript, for context isolation. Formalize this as a
  `design-workshop` **workflow** with two phases: `Workshop` (existing skill) → `Write Spec`
  (new `spec-writer` agent). "Lean Spec" is the evolution of the planner's SPEC-nn — same
  slot, leaner template.
- **Copy-forward artifacts.** Tech Stack and Test Strategy are ~identical per module (the
  README already flags both as "expected to move" to `Standards (Documents)/`). Their
  "generate" skills are mostly *port + adapt the planner's version*, not author-from-blank —
  which argues for promoting those two docs to the shared folder as templates first.
- **Design System / Theme / IA** are the most module-specific (visual identity differs every
  time). Their skills scaffold the document structure and prompt for the module's choices
  rather than copying the planner's palette.

### 5.3 Build

| Stage           | Artifact / outcome                | Tooling                          | Status  | Context-isolated agents                          |
| --------------- | --------------------------------- | -------------------------------- | ------- | ------------------------------------------------ |
| Sprint Build    | Green, reviewed story             | `/build` → `build.js` workflow   | Have    | build-briefer → test-author → implementer → gate-runner → test-author → smoke-tester |
| Code Quality    | Consensus findings, applied       | `/code-quality` workflow         | Have    | gate-runner → quality-reviewer ×N → adversary ×N |
| Test Quality    | Consensus test gaps, implemented  | `/test-quality` workflow         | Have    | gate-runner → quality-reviewer ×N → adversary → test-author → gate-runner |
| Functional Test | Pass/fail over all functional cases | `functional-tester` agent      | New (extends smoke-tester) | functional-tester             |
| UX Test         | Holistic UX/theme/consistency report | `ux-tester` agent             | New     | ux-tester                                        |
| Human Review    | Feedback → durable prevention     | `/human-review-loop` skill       | Have    | —                                                |
| Documentation   | Fresh, consistent tech docs       | `/refresh-docs` skill            | New     | doc-scout, writer                                |
| PM Update       | Board / defect log / checkpoint   | `/pm-update` skill (or agent)    | New     | pm-updater                                       |
| Commit          | Conventional commit               | `/commit-diff` skill (Haiku)     | Have    | Haiku drafter                                    |

Notes:

- **Functional Test vs. smoke-tester.** The existing `smoke-tester` is *exploratory* — it
  drives the built UI and reports observations for one story. The new `functional-tester` is
  *systematic* — it runs **every functional test case / FUT** for the feature in Playwright
  and returns a structured pass/fail matrix. Cleanest path: a sibling agent that reuses
  smoke-tester's browser harness but is driven by the spec's FUT list, not free exploration.
- **UX Test** is genuinely new: contrast/accessibility, theme adherence, label and wording
  consistency, page-to-page consistency. It reads the Design System + Theme as its rubric and
  reports violations. Read-only, like the other review agents.
- **Documentation** parallels `human-review-loop`'s spirit but points at docs: detect stale
  or contradictory statements across `design/` and `CLAUDE.md`, then write/refresh technical
  specifications. Scout (find drift) and writer (fix it) are separate agents.
- **PM Update** is the write-back that keeps the PMO dashboard honest — moves board rows,
  appends defects, writes the sprint checkpoint. It is the counterpart to the read-only
  dashboard in §7.

---

## 6. Gap summary — what to author

Grouped by effort. Full specs for each become their own `SKILL.md` / agent file when built.

**Build phase (highest leverage — closes the loop on work you do every sprint):**

- `functional-tester` agent — systematic FUT runner in Playwright.
- `ux-tester` agent — holistic UX/theme/consistency reviewer.
- `/refresh-docs` skill — staleness + inconsistency sweep, then rewrite.
- `/pm-update` skill — board / defect / checkpoint write-back.

**Design phase (mostly port-and-adapt from the planner's existing docs):**

- `design-workshop` workflow — wraps existing `/workshop` + new `spec-writer` agent.
- `/generate-tech-stack`, `/generate-test-strategy` — copy-forward from planner.
- `/generate-data-model`, `/generate-information-architecture`,
  `/generate-design-system`, `/generate-theme`, `/generate-build-plan`.

**Plan phase (new authoring, but low frequency — once per module):**

- `/generate-problem-statement-vision`, `/generate-business-architecture`,
  `/gather-research`, `/scaffold-module`.

**Recommended authoring order:** the four Build-phase gaps first (they pay back every
sprint), then `design-workshop` (a small refactor of something that already works), then the
copy-forward Design skills, and finally the Plan skills when a real second module starts.

---

## 7. The Project Tracker (PMO) module

### 7.1 What it is, for now

A dashboard that renders the current state of a Life OS project from the markdown that is
already the source of truth. It reads, never writes — the `/pm-update` skill (§5.3) owns
writes. Eventually it becomes a full Life OS module (CAP + SAPUI5 + Postgres) like the
planner; for now it is a **generated live view**, so Sandro gets value this session without
a multi-sprint build.

### 7.2 "Live and updating" — the chosen approach

Three options were considered:

1. **Cowork artifact** — persists across sessions, but reads from connectors, not local repo
   files. Wrong data source.
2. **Full SAPUL5 module** — correct end state, but weeks of build.
3. **Generator script → self-contained HTML** *(chosen for v1)* — a Node script (same family
   as the existing `workflows/*.js`) parses the project markdown and emits a single
   self-contained `dashboard.html`. Re-run on demand, on a git hook, or on a schedule. The
   HTML always reflects the files as of the last generation, and the parser + view definitions
   become the seed for the eventual module's OData model and UI5 views.

This keeps the dashboard *local, offline, and versioned with the repo*, and every artifact it
reads is already maintained as part of the build process.

### 7.3 Data sources (all existing markdown)

| View feeds from                | File(s)                                                        |
| ------------------------------ | ------------------------------------------------------------- |
| Current stage / substage       | `design/DESIGN_PHASE_TIMELINE.md` (Progress table) + `project/SPRINT_BOARD.md` (Current Sprint heading) |
| Sprint board                   | `project/SPRINT_BOARD.md` (Backlog / In Progress / Done tables) |
| User story list                | `project/SPRINT_BOARD.md` + `design/BUSINESS_ARCHITECTURE.md` (FRICEW catalogue) |
| Decisions log                  | Sprint checkpoints `project/sprints/*.md` §4 + design docs' decision IDs (D-nnn) |
| Defects                        | `project/DEFECT_LOG.md`                                        |
| Change logs                    | Change History tables across `design/*.md`                    |
| Next step                      | Sprint board first Backlog row + timeline next incomplete step |
| Methodology infographic        | This blueprint §4 + `DESIGN_PHASE_TIMELINE.md`                 |

Parsing rules are stable (documented from the real files): markdown tables with leading/
trailing pipes; story IDs `{PREFIX}-{NNN}` where PREFIX ∈ {FRM, INT, ENH, CNV, RPT, WFL};
status enums `Backlog | In Progress | Done`; defect severity `Critical | High | Medium | Low`;
defect status `Open | Closed`.

### 7.4 Dashboard views (Sandro's spec)

**Project areas:**

- **Current stage** — Plan / Design / Build, plus substage (e.g. "Design · Workshop" or
  "Build · W1-S3 · FRM-001").
- **Current stage view** — the active item in flight (e.g. "Workshop for ENH-003").
- **Next step** — the following queued item.
- **Decisions / Defects / Change logs** — three registers.
- **Sprint board** — Backlog / In Progress / Done lanes.
- **User story list** — every FRICEW object with type, status, description.

**Project tooling views:**

- **ESLint rules** — from the shared `eslint.config.mjs` + the 20-linter suite in
  `Standards (Technical + Linting)/scripts/`.
- **Custom skills / workflows / agents** — inventory of `.claude/` (name, purpose, model).
- **Methodology infographic** — the §4 phase map, rendered.
- **Switch projects** — the generator scans for module folders that have both a `design/`
  and a `project/` directory; today only Financial Planner qualifies, so the switcher shows
  one project and is ready for the next.

### 7.5 Eventual module (deferred)

When promoted to a real module, Project Tracker follows the same "Adding a Module" checklist
and inherits the shared stack, lint suite, and standards. The v1 generator's parser becomes
the ingestion layer; the HTML views become UI5 views over an OData model. Namespace is
**undecided** (`CLAUDE.md` §Undecided) — do not assume `com.lifeos.projecttracker` until
Sandro rules on the cross-module namespace question.

---

## 8. Sequenced roadmap

1. **This session** — this blueprint + a v1 generated dashboard grounded in the planner's
   real data.
2. **Build-phase gaps** — author `functional-tester`, `ux-tester`, `/refresh-docs`,
   `/pm-update`. These slot straight into the workflow you already run.
3. **Workshop refactor** — split `/workshop` into workshop + `spec-writer` via a
   `design-workshop` workflow.
4. **Copy-forward Design skills** — promote `TECH_STACK` and `TEST_STRATEGY` to
   `Standards (Documents)/` as templates; wrap in generate-skills.
5. **Remaining Design + Plan skills** — author as a real second module begins.
6. **Promote Project Tracker to a module** — when the generated dashboard has earned it.

---

## 9. Open questions for Sandro

- **Dashboard delivery cadence.** On-demand only, git post-commit hook, or a scheduled daily
  regeneration?
- **"Lean Spec" template.** How lean vs. the planner's SPEC-nn? Do you want the leaner
  template defined before the `design-workshop` workflow, or discovered on the next module?
- **`functional-tester` scope.** Should it own the whole regression suite for a module each
  run, or only the current story's FUTs?
- **Namespace.** Does building the PMO module force the `com.lifeos.{module}` decision, or do
  you want to keep it deferred and let the generator live outside module conventions for now?
