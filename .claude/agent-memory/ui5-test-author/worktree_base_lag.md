---
name: worktree-base-lag
description: An isolated agent worktree can be cut from main, which lags the active sprint branch; the brief's paths may not exist until fast-forwarded
metadata:
  type: feedback
---

The worktree may start at `main`, not the sprint branch the brief describes. On 2026-11-04 the worktree sat at
`a4535fc` (pre-monorepo, no `Financial Planner/` folder, no `app/transactions/`) while the work lived on
`sprint/W1-S3` (checked out in the main checkout).

**Why:** git commands that `cd` into the main checkout are refused for isolated agents, so the gap is easy to misread
as "file missing".

**How to apply:** if a brief path is absent, run `git branch -a --contains <commit touching it>` and
`git merge-base --is-ancestor HEAD <sprint-head>`; if HEAD is an ancestor and the tree is clean, `git merge --ff-only`
to the sprint head (non-destructive), and say so in the report.
