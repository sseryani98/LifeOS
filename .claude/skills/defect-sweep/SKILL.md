---
name: defect-sweep
description: Run a bounded, unattended fix-and-retest loop on one story — functional test and UX test in parallel, log what they raise, fix the medium-and-worse findings test-first, commit, retest — until a round raises nothing medium or worse, or five rounds pass. Use whenever Sandro says "run a defect sweep", "sweep FRM-001", "/defect-sweep", "loop the testers on this story", "fix and retest until it's clean", or wants the overnight test-fix loop run on a module, story or app. Also the entry point of the Wednesday-night scheduled run (`/defect-sweep --pick`), which rotates through Done stories. It never decides behaviour the spec leaves open, never touches main, never pushes.
---

The defect sweep is the overnight loop of 2026-11-04/05 made safe to repeat. That run fixed real
defects (data loss, a 27% save-failure rate, a Fiori Elements state bug, broken deep links) and then
spent eight more rounds on 1–3 low-severity polish items each, with testers reversing their own
earlier fixes. The rules below exist to keep the first half and cut the second.

Paths are relative to `Life OS/`. You **orchestrate**; agents test and fix. You never drive the app
or edit source yourself.

## 1. Resolve the target

| Argument                       | Do                                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `<Module>/<Story>`             | Sweep that story                                                                              |
| `<Module>` or `<Module>/<app>` | Take that module's least-recently-swept **Done** story (that app's, if an app is named)       |
| `--pick`                       | Across every module, take the least-recently-swept **Done** story. This is the scheduled mode |
| Empty                          | Ask — unless running headless, then behave as `--pick`                                        |

"Least-recently swept" is read from `.claude/defect-sweep/ledger.md` (§3). A Done story with no
ledger row has never been swept and goes first. Done means Done on the module's board or progress
record (Financial Planner: `project/SPRINT_BOARD.md`; Project Tracker: `PLAN.md`).

## 2. Stop before starting if

- **The branch is `main`**, or not a sprint branch. Never sweep `main`.
- **The working tree is dirty.** Each round commits; a dirty tree would mix Sandro's work into the
  sweep's commits. In headless mode, log the reason to the ledger and exit.
- **The build gate is red** (§5's gate). Sweeping a red build measures the gate.
- **The story has no spec or no FUTs covering it** — same rule as `/functional-test`.
- **The module has no defect record.** Financial Planner logs to `project/DEFECT_LOG.md`. A module
  whose `CLAUDE.md` names none: report and stop; do not invent one.
- **Local Postgres is not reachable** — the functional tester needs a throwaway database on it.

## 3. The ledger

`.claude/defect-sweep/ledger.md` is tracked. One table row per sweep run (date, story, rounds, raised,
fixed, left open, stop reason, commit range), plus one `### <Module>/<Story>` section per story
holding its **known list**: defects still Open, behaviours ruled deliberate, and framework noise.
Every tester brief carries that list as "already known — do not re-file". Create the file on first
run. Update it at the end of every run, including a run that stopped in §2.

## 4. One round

At most **five rounds**. A round is:

1. **Test, in parallel, fresh context each.**
   - `functional-tester`: every FUT covering the story, real keystrokes, **its own Chromium** (never
     the shared Playwright MCP browser), a throwaway Postgres database dropped at the end.
   - `ux-tester` (only if the story ships UI): the story's pages at 1440 and 1920 px, on the MCP
     browser, its own dev server.
   - Both briefs carry: the known list; what changed since the last round; _clear IndexedDB
     `ui5-cachemanager-db` first_; _read control state (`getState()`, `getValue()`) not CSS_;
     _measure borders on drawn elements, not 0-width wrappers_; _never `setValue` to test input
     behaviour — it bypasses FE side effects_.
2. **Triage** every finding yourself before logging it:
   - Already in the known list, or a reversal of a fix made earlier in this sweep → drop it.
   - Unverified (the tester could not use real input, or saw it once) → log it marked
     "(Unverified)" and have the next fixer reproduce it before touching code.
   - Needs a behaviour the spec does not state → log it **Open, "needs Sandro"**, add it to the
     known list, and do **not** send it to a fixer. Never pick a default.
   - Everything else → log it with severity, expected vs observed, and the tester as source.
3. **Stop check.** If the round logged nothing **Medium or worse** that a fixer can act on, stop.
   Lows stay logged and Open for Sandro.
4. **Fix** — one fresh `general-purpose` agent, briefed with only the Medium-and-worse rows:
   failing test first (run red, fix, run green), browser-verify anything visual, gate green (§5),
   close each row with a dated Resolution, revert nothing, run prettier only on files it changed,
   no spec edits, no commits.
5. **Commit the round** via the `commit-diff` skill on the sprint branch:
   `fix(<module-scope>): defect sweep <story> round <n>`, defect IDs in the body. Never push. If the
   commit is refused, stop the sweep and report — never continue on an uncommitted round.

## 5. The gate

From the module folder: `npx tsc --noEmit`, `npx tsc --noEmit -p app/<each app with a tsconfig>`
(the root `tsc` does not see per-app projects — D-086), `npm run lint`, `npm test`, `npx cds build`.

## 6. Report, then stop

Write the run into the ledger, then reply: the stop reason, rounds run, defects raised / fixed / left
open (IDs), anything marked "needs Sandro", and the commit range. In headless mode the reply is the
log. Fix nothing after the last round, and never start a second story in the same run.
