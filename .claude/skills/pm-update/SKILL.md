---
name: pm-update
description: Audit a module's PMO tracking artifacts for consistency and reconcile drift — Financial Planner's sprint board, defect log and checkpoints, or Project Tracker's PLAN.md. Use whenever Sandro wants to check that the tracking agrees with itself, with git history, and with the design docs — after a build, at sprint close, before generating the dashboard, or any time he says "check the board", "is the tracking up to date", "reconcile the project state", or "audit the PMO". It reports every inconsistency, fixes the mechanical ones, and flags the judgment calls for Sandro.
---

The PMO dashboard is only as honest as the markdown it reads. This skill keeps that markdown
honest. It does not run sprint ceremonies and it does not replace the implementer's board handoff
(`build.js` already marks a story "Build Done, Awaiting Review"). It **audits** the tracking
artifacts against each other and against ground truth, then reconciles what is safe to reconcile.

Paths are relative to `Life OS/`. **Resolve the module first** — the one Sandro names, or the one
the latest commits touch. If neither settles it, ask; there is no default module. Each module keeps
different artifacts:

| Module | Artifacts under audit | Ground truth |
| --- | --- | --- |
| `Financial Planner` | `project/SPRINT_BOARD.md` (lanes, current-sprint pointer, history), `project/DEFECT_LOG.md`, `project/sprints/*.md` (checkpoints) | `git log`, `design/BUSINESS_ARCHITECTURE.md` (FRICEW catalogue), `design/PROJECT_MANAGEMENT.md` (sprint plan) |
| `Project Tracker` | `PLAN.md` only — §1 "Where we are", §3 stage-status table, §8 session log | `git log`, `design/BUILD_PLAN.md` (stories and sprints), `design/BUSINESS_ARCHITECTURE.md`, `design/DECISIONS_LOG.md`, each design doc's own status line |

A module not in this table has no audit defined. Say so and stop; do not borrow another module's.

Project Tracker's `PLAN.md` §6 already rules this skill's future: once the tracker's own store holds
the state, the markdown-vs-markdown checks are deleted and only git-vs-state and catalogue-vs-backlog
survive. Until that rewrite (stage 14), the Project Tracker checks below are the interim audit.

## Why this delegates its reading

The board, defect log, checkpoints, the FRICEW catalogue, and the git history are a lot to hold at
once. Send a subagent to gather the raw state and return a structured snapshot — board rows by
lane, defect rows, checkpoint inventory, the commit subjects that mention FRICEW IDs, the planned
sprint stories. You reason over the snapshot; you do not read all five sources into the main
thread. The audit is the deliverable, not the reading.

## Phase 1: Audit

Run every check below and build one findings table:
`# | artifact | check | finding | severity | reconcilable?`

### Financial Planner checks

1. **Board vs. git.** Every story in a **Done** lane should have a commit whose subject carries its
   FRICEW ID. A Done story with no commit is a contradiction (severity high). A story sitting in
   "Build Done, Awaiting Review" whose commit is already merged/tagged should have advanced —
   flag it.
2. **Current-sprint pointer.** The `## Current Sprint:` heading, the `**Branch:**` line, and the
   current git branch should agree, and the sprint should exist in the PROJECT_MANAGEMENT sprint
   plan. A stale pointer (branch merged, sprint still "current") is reconcilable.
3. **Story coverage.** Every story ID on the board exists in the BUSINESS_ARCHITECTURE FRICEW
   catalogue. Every story the sprint plan assigns to a completed sprint appears on the board in a
   Done lane. Missing or orphan IDs are findings.
4. **Defect integrity.** No defect is `Open` while carrying a filled Resolution (or vice versa).
   Every defect's Sprint exists. Severity ∈ {Critical, High, Medium, Low}; Status ∈ {Open, Closed}.
   A defect a checkpoint calls closed but the log still lists Open is a contradiction.
5. **Checkpoint completeness.** Every merged/tagged sprint in the board history has a matching
   `project/sprints/{sprint}-checkpoint.md`, and that checkpoint's story list matches the board's
   for that sprint. A merged sprint with no checkpoint is a finding.
6. **Enum + shape hygiene.** Lane statuses match their lane; story `Type` ∈ {Form, Integration,
   Enhancement, Conversion, Report, Workflow}; table columns are intact.

### Project Tracker checks

Run these instead of 1–6 when the module is Project Tracker:

1. **Stage table vs. documents.** Every stage §3 marks **Done** names an artifact whose own status
   line agrees (`Approved`), and the D-nn range it cites exists in `DECISIONS_LOG.md`.
2. **Build progress vs. git.** Every story §3 or §1 calls **Done** has a commit whose subject or
   body carries its ID. A story with a commit but no Done mark is a finding.
3. **Story coverage.** Every story `PLAN.md` names exists in `BUILD_PLAN.md`, and every
   `BUILD_PLAN.md` story's spec exists under `design/specs/`.
4. **"Where we are" vs. the session log.** §1's current position matches the newest §8 entry and
   the newest commits. A §1 that predates the last session entry is stale (reconcilable only when
   the session entry states the new position outright).
5. **Decision references.** Every `D-nn` cited in §1–§3 exists in `DECISIONS_LOG.md`.

## Phase 2: Reconcile

Split the findings:

- **Reconcilable** — mechanical, single correct answer, no lost information: advance a stale
  current-sprint pointer, move a story whose commit is merged, correct an enum typo, fix a defect
  Sprint reference. Apply these directly with `Edit`, preserving each file's existing format and
  change-history convention. Add a Change History row where the doc has one.
- **Judgment** — anything that could be a real problem rather than a bookkeeping slip: a Done story
  with no commit at all, a missing checkpoint, an orphan story ID, an Open/Closed defect
  contradiction. **Do not guess.** List these for Sandro with the specific question each raises.

## Report

Return the findings table, then two short lists: **Reconciled** (what you changed, with the
before→after) and **Needs Sandro** (the judgment calls, each phrased as a decision). If everything
agrees, say so — a clean audit is the goal, not a failure to find work. Re-running the dashboard
generator after a reconcile is the natural next step; mention it, do not do it unasked.

You edit only the tracking artifacts listed for the module (for Project Tracker, `PLAN.md` only). You never touch `srv/`, `app/`, `db/`, tests, or specs.
