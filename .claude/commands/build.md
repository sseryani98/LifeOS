---
description: Build one story end-to-end — brief, TDD red, implement, gate, coverage, smoke. Stops before the commit.
argument: Story ID in any module (FRM-001, SPEC-02), optionally prefixed with the module (Project Tracker/SPEC-02). Omit to take the next story, asking which module when more than one has one.
---

Your job here is **story resolution and rendering**. The workflow does the building — you do not
read the spec, you do not write code, and you do not review the result. Resolve `$ARGUMENTS` to
one story ID, confirm the spend, invoke, render what came back.

The workflow **never commits**. It stops one step short, leaving a green working tree for Sandro
to review. Do not commit on its behalf when it returns.

## 1. Resolve the module and the story

**Every module defines what a story ID is in its own `design/BUILD_PLAN.md`**, so an ID is only
meaningful inside a module. Financial Planner's stories are FRICEW IDs (`FRM-001`); Project
Tracker's are spec IDs (`SPEC-02`, plus `S-00`) — BP-001 §3, D-198. The same string can exist in
both (`SPEC-02` is a spec in each, `CNV-001` an object in each), so resolve against each module's
**story list**, not a bare grep.

| `$ARGUMENTS` | Do |
| --- | --- |
| `<Module>/<ID>` | Use that module; confirm the ID is a story in its BUILD_PLAN |
| A bare ID | Check it against the story list of every module with a `design/BUILD_PLAN.md`. Exactly one match → use it. More than one → ask which module |
| Empty | Find each module's next story: the first Backlog row under Current Sprint on its board, or — for a module with no board — the first not-Done story in the record its BUILD_PLAN names. Exactly one module has one → use it. Several → list them, one per module, and ask |
| Anything else | Grep the module boards and story lists. Exactly one Backlog story → use it; otherwise ask |

**Find the module's board.** If `<Module>/project/SPRINT_BOARD.md` exists, it is the board —
pass `boardFile: 'project/SPRINT_BOARD.md'`. If not, the module tracks no board (Project Tracker,
BP-001 §13 / D-207) — pass `boardFile: ''` and read story status from the record its BUILD_PLAN's
Progress Tracking section names instead (Project Tracker: `PLAN.md`'s stage table and §8 log).

Check status before invoking, and stop rather than build if:

- The story is already **Done** — say so and ask whether he means to rebuild it.
- The story is **Build Done, Awaiting Review** — a previous run already built it and it is sitting
  in the tree unreviewed. Building again would bury the diff he has not read yet. Ask.
- The working tree has uncommitted changes in the module's source folders (`srv/`, `app/`, `db/`,
  plus any its CLAUDE.md lists, such as Project Tracker's `mcp/`). Everything the workflow
  produces stays uncommitted, so pre-existing changes will be tangled with the story's diff and
  the review cannot tell them apart. Show `git status --short` and ask.

A story ID is not a build blocker because it once read "provisional" on a risk — check whether
that risk is still open before saying so.

One story per invocation. If he names two, build the first and say the second needs its own run.

## 2. Confirm before spending

State the shape before you invoke — this is the expensive command in the repo:

> `FRM-001 — Transaction List`. 7 phases, sequential. Roughly 2 Opus agents on a clean run, up to
> 5 if the gate needs repair rounds. Frontend story, so Playwright runs. Ends green and
> uncommitted, board marked Build Done, Awaiting Review.

A story whose FUTs cover more than one FRICEW object writes its tests in parallel: one scaffolding
agent, then one Opus test author per object. Add those to the count — `SPEC-02`'s three objects make
it 4 Red agents instead of 1, finishing sooner for more spend.

Say whether smoke runs: use the BUILD_PLAN's Ships UI column where it has one (Project Tracker),
else the story type — FRM ships UI, ENH and CNV usually do not. **Find the module's UI5 leg:** if
`<Module>/ui5-test-runner.json` exists, pass `hasUi5Leg: true`; a UI story then gets a
`ui5-test-author` QUnit red beside (or instead of) the Jest red, so count it. A UI-only story in a
module with no UI5 leg (Project Tracker until its first `app/` source lands) gets no Red phase —
count one Opus agent fewer and say the FUTs are verified by `/functional-test` afterwards. For a board-less module, say the
handoff marks nothing. Then proceed. Ask first only when the Red phase will fan out to more than one
author, or when a stop condition above fired — those are the runs worth a second look before the spend.

## 3. Invoke

```
Workflow({
  name: 'build',
  args: { storyId: 'FRM-001', moduleDir: 'Financial Planner', boardFile: 'project/SPRINT_BOARD.md', hasUi5Leg: true }
})

Workflow({
  name: 'build',
  args: { storyId: 'SPEC-02', moduleDir: 'Project Tracker', boardFile: '', hasUi5Leg: false }
})
```

`moduleDir` is required — the workflow refuses to guess.

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
  If `boardless` is true, the module has no board: say so in one line, and that its progress
  record (Project Tracker: a `PLAN.md` §8 entry) is written at commit, not by this workflow.

## 5. Then stop

Nothing is committed and nothing should be. The tree is his to review.

Suggest `/code-quality` on the diff, and that `/commit-diff` writes the commit once he is happy.
**Do not invoke either** — both are his call, and the review is the whole reason the workflow
stopped here. Do not review the code yourself, do not fix what the smoke test flagged, do not
commit, and do not start the next story.
