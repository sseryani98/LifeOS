---
description: Build one story end-to-end — brief, TDD red, implement, gate, coverage, smoke. Stops before the commit.
argument: FRICEW story ID (e.g. FRM-001). Omit to take the next Backlog story from the sprint board.
---

Your job here is **story resolution and rendering**. The workflow does the building — you do not
read the spec, you do not write code, and you do not review the result. Resolve `$ARGUMENTS` to
one story ID, confirm the spend, invoke, render what came back.

The workflow **never commits**. It stops one step short, leaving a green working tree for Sandro
to review. Do not commit on its behalf when it returns.

## 1. Resolve the story

| `$ARGUMENTS` | Do |
| --- | --- |
| A FRICEW ID (`FRM-001`, `CNV-001`) | Use it |
| Empty | Read `Financial Planner/project/SPRINT_BOARD.md` and take the **first row of the Backlog table** under Current Sprint |
| Anything else | Grep `SPRINT_BOARD.md` for it. If it resolves to exactly one Backlog story, use that; otherwise ask |

Check the board before invoking, and stop rather than build if:

- The story is already in **Done** — say so and ask whether he means to rebuild it.
- The story is **Build Done, Awaiting Review** — a previous run already built it and it is sitting
  in the tree unreviewed. Building again would bury the diff he has not read yet. Ask.
- The working tree has uncommitted changes in `srv/`, `app/`, or `db/`. Everything the workflow
  produces stays uncommitted, so pre-existing changes will be tangled with the story's diff and
  the review cannot tell them apart. Show `git status --short` and ask.

One story per invocation. If he names two, build the first and say the second needs its own run.

## 2. Confirm before spending

State the shape before you invoke — this is the expensive command in the repo:

> `FRM-001 — Transaction List`. 7 phases, sequential. Roughly 2 Opus agents on a clean run, up to
> 5 if the gate needs repair rounds. Frontend story, so Playwright runs. Ends green and
> uncommitted, board marked Build Done, Awaiting Review.

Read `hasFrontend` off the story type to say whether smoke runs — FRM ships UI, ENH and CNV
usually do not. Get a yes before invoking.

## 3. Invoke

```
Workflow({
  name: 'build',
  args: { storyId: 'FRM-001', moduleDir: 'Financial Planner' }
})
```

## 4. Render the result, then stop

Lead with what happened, then the detail. Four outcomes, and they read differently:

**Blocked on the spec** (`blockers` non-empty) — nothing was built and that is the cheap, correct
outcome. Render each blocker as question + why. Recommend `/workshop` on the spec. Do not offer
to answer the blockers yourself.

**Red** (`red: true`) — say what stopped it and that nothing was committed:
- `testDrift` — the test suite moved after the red baseline. This is the serious one. Show the
  drifted files; the TDD contract was broken and the diff needs a human before anything lands.
- `testDispute` — the implementer says a test cannot pass against any correct implementation.
  Show it. This is a judgment call for Sandro, not something to route back automatically.
- `failures` after `rounds` repair rounds — table of check / kind / detail.
- A red phase defect (tests passed with no implementation) — the suite asserts nothing.
- Smoke failed — gate green, UI broken. Show `observations` and blocking `issues`.

**Green** (`built: true`) — lead with what was built and that it is green and waiting in the tree.
Then:

- What was built (`summary`), `filesChanged`, `testFiles`.
- `repairRounds` — if above 0, say so plainly; it is a signal about the spec or the pattern.
- `coverage`, and any `unreachable` branches the coverage phase declined to contort a test around.
- `smoke.observations` for a frontend story, plus any `cosmetic` issues — those did not block the
  build but Sandro should see them.
- If `boardUpdated` is false, say so — the board still reads Backlog and he will want to know.

## 5. Then stop

Nothing is committed and nothing should be. The tree is his to review.

Suggest `/code-quality` on the diff, and that `/commit-diff` writes the commit once he is happy.
**Do not invoke either** — both are his call, and the review is the whole reason the workflow
stopped here. Do not review the code yourself, do not fix what the smoke test flagged, do not
commit, and do not start the next story.
