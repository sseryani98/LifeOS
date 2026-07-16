---
name: pm-update
description: Audit the PMO tracking artifacts for consistency and reconcile drift. Use whenever Sandro wants to check that the sprint board, defect log, and sprint checkpoints agree with each other, with git history, and with the design docs — after a build, at sprint close, before generating the dashboard, or any time he says "check the board", "is the tracking up to date", "reconcile the project state", or "audit the PMO". It reports every inconsistency, fixes the mechanical ones, and flags the judgment calls for Sandro.
---

The PMO dashboard is only as honest as the markdown it reads. This skill keeps that markdown
honest. It does not run sprint ceremonies and it does not replace the implementer's board handoff
(`build.js` already marks a story "Build Done, Awaiting Review"). It **audits** the tracking
artifacts against each other and against ground truth, then reconciles what is safe to reconcile.

Paths are relative to `Life OS/`. The artifacts under audit:

- `Financial Planner/project/SPRINT_BOARD.md` — lanes, current-sprint pointer, sprint history.
- `Financial Planner/project/DEFECT_LOG.md` — the defect register.
- `Financial Planner/project/sprints/*.md` — sprint checkpoints.
- Ground truth: `git log`, `Financial Planner/design/BUSINESS_ARCHITECTURE.md` (the FRICEW
  catalogue), `Financial Planner/design/PROJECT_MANAGEMENT.md` (the sprint plan).

## Why this delegates its reading

The board, defect log, checkpoints, the FRICEW catalogue, and the git history are a lot to hold at
once. Send a subagent to gather the raw state and return a structured snapshot — board rows by
lane, defect rows, checkpoint inventory, the commit subjects that mention FRICEW IDs, the planned
sprint stories. You reason over the snapshot; you do not read all five sources into the main
thread. The audit is the deliverable, not the reading.

## Phase 1: Audit

Run every check below and build one findings table:
`# | artifact | check | finding | severity | reconcilable?`

Consistency checks:

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

You edit only the tracking artifacts. You never touch `srv/`, `app/`, `db/`, tests, or specs.
