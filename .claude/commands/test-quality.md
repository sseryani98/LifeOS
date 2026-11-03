---
description: Isolated-agent test quality review — lint+coverage gate, per-module reviewers, one adversary triage pass, report. Writes only the findings you pick, by index.
argument: Target — omit for the uncommitted diff, or "all", or a module name (e.g. "transaction")
---

Run the test-quality workflow against "$ARGUMENTS".

Your job here is **scope resolution and rendering**. All review and implementation work happens in
isolated subagents inside the workflow — you never read the tests yourself. Keeping your context
clean is the entire point of this command; a summary you write from your own reading of the suite
defeats it.

This is the twin of `/code-quality`, pointed at `test/` instead of `srv/`. It runs in two
invocations: **review** writes nothing and returns tables; **apply** writes only the indices
Sandro names. Never call apply without his indices.

## 1. Resolve the target

Resolve the module first: the workspace folder the diff sits in, or the one the argument names. If
neither settles it, ask — there is no default module. The lens table below is Financial Planner's; for another
module, build one lens per folder under its `test/unit/` and `test/integration/`, map each to the
source it covers, and pass the full lens-name list as `allModules`.

| "$ARGUMENTS" | Scope |
| --- | --- |
| *(empty)* | **Diff mode.** See §1a — the range is not always the working tree. |
| `all` or `backend` | All five lenses. `backend` is an accepted alias — only four `srv/modules/` folders have source (`categorization`, `ingestion`, `shared`, `transaction`; the other four are stubs) and no frontend tests exist, so `backend` and `all` resolve identically. |
| anything else | Treat as a **module name**. If it matches no lens below, list the real ones and ask — do not guess. |

## 1a. Diff mode — resolve the range before you trust it

Do not assume the changeset is in the working tree. `/build` hands off an uncommitted tree — it
never commits, by design; the commit is Sandro's, via `/commit-diff`. So the working tree is the
normal post-build path, **but only until he commits.** Run `/test-quality` after `/commit-diff` and
`git status` is clean while the work sits on the branch — reading only the working tree would
resolve the most important case for this command, "Claude Code just built something, check its
tests", to "nothing to review". Resolve in this order:

1. `git status --porcelain` — if **non-empty**, that is the range. A hand-built or in-progress
   changeset. Say `uncommitted diff (N files)`.
2. Otherwise `git log main..HEAD --oneline` — if it has commits, the range is
   `git diff --name-only main...HEAD`. This is the post-`/build` case. Say
   `branch vs main (N files, M commits)` **and list the commit subjects**, so Sandro sees the scope
   he's about to pay for — a long-lived sprint branch can be much wider than the build he just ran.
3. Both empty — say so and stop. Nothing to review.

If step 2 spans more than ~3 commits, offer the narrower `HEAD~1` range (the last build alone) and
let him pick. **Do not silently review a whole sprint** because he asked about one story.

**A diff touching only `srv/` still has lenses** — that is the whole point. Map each changed source
file to the module that owns it and review that module's tests. A build that changed
`srv/modules/transaction/` and wrote no tests is exactly what this mode is for.

Pass the resolved file list as `changedFiles` so reviewers judge coverage *of the changeset*.

The five lenses, with their source — **the map is not 1:1, so pass `sourceFiles` explicitly**:

| Lens | Tests | Source |
| --- | --- | --- |
| `admin` | `test/integration/admin/**` | `srv/admin-service.ts`, `srv/admin-service.cds` |
| `categorization` | `test/{unit,integration}/categorization/**` | `srv/modules/categorization/**` |
| `ingestion` | `test/{unit,integration}/ingestion/**` | `srv/modules/ingestion/**` |
| `shared` | `test/unit/shared/**` | `srv/modules/shared/**` |
| `transaction` | `test/{unit,integration}/transaction/**` | `srv/modules/transaction/**`, `srv/transaction-service.ts` |

`admin` has no `srv/modules/admin` — it maps to the root service files. Resolving that by glob
gives a reviewer an empty source list and a useless review.

Exclude from every mode: `gen/`, `@cds-models/`, `node_modules/`, `coverage/`, `logs/`, `db/seed/`,
`*.log`, lockfiles, `design/`, `project/`.

## 2. Confirm before spending

The review is reviewers on Opus, one Sonnet triage agent per module, and a Haiku gate. Before
invoking, tell Sandro the shape in one line: `lenses + 2 reviewers, then 1 triage agent per module`.
Nothing is written, so diff mode and single modules just proceed.

The expensive part is apply — Opus authors writing tests, then a gate and possibly a repair loop —
and it now runs only on the items he picks. For `all`, say plainly that the review covers every
module and ask first.

## 3. Invoke the review

```
Workflow({
  name: 'test-quality',
  args: {
    action: 'review',
    label: '<human-readable scope, e.g. "uncommitted diff (12 files)">',
    moduleDir: '<the resolved module folder>',
    mode: 'diff' | 'adhoc',
    changedFiles: [ /* diff mode only — repo-relative paths */ ],
    allModules: [ /* every lens name the module has — scopes jest */ ],
    lenses: [
      { name: 'transaction',
        testFiles: [ /* repo-relative */ ],
        sourceFiles: [ /* repo-relative */ ] }
    ]
  }
})
```

Keep the returned object — apply needs its findings, its `gate` and its `rules`.

The review reads the module's own test rules (`design/TEST_STRATEGY.md`, `CLAUDE.md`) — nothing
about Financial Planner is assumed for another module. If the module has no TEST_STRATEGY.md, say so
before invoking: the reviewers will have only the shared rules.

## 4. Render the review, then stop

The review returns `{consensus, contested, dropped, folded, defects, counts, gate}`. Render two
numbered tables, **one continuous sequence across both**, so Sandro can say "do #2 #5".

```
## Recommended — the adversary did not object
# | file:line | gap | proposed test | severity

## Contested — the adversary objected. You decide.
# | file:line | gap | reviewer says | adversary says (ground)
```

Then `defects` — findings whose fix needs code in `srv/`, `app/` or `db/` before any test can be
written. They skip triage and apply refuses them, so number them `D1, D2…`, never in the main
sequence:

```
## Defects — need a source change, not a test
D# | file:line | bug | proposed fix | severity
```

Offer to fix a defect directly (TDD: the test goes in with the fix), or to log it in the module's
defect record. Never pass one to apply.

| Module | Defect record |
| --- | --- |
| `Financial Planner` | `project/DEFECT_LOG.md` |
| `Project Tracker` | `PLAN.md` §7, under a `### Defects` subsection (create it if absent). One item per defect, continuing §7's numbering: bug, `file:line`, proposed fix, severity, date found. D-207 makes `PLAN.md` this module's only record — never a new log file, never `log_defect` (the store holds Financial Planner's Workspace only) |

A module not in this table has no defect record. Say so and offer the fix only.

**Nothing has been written.** Say so in one line under the tables.

Then, one line each: `counts.folded` (same gap said twice), `counts.deduped` (two lenses found it),
whether the **gate** was already red before this run, and the **timings** (§Timings).

If both tables are empty, say that in one sentence. A suite with no gaps worth writing is a real
result — do not pad it.

## 5. Apply what he picks

Only after Sandro names indices. Map each index back to its finding object and invoke:

```
Workflow({
  name: 'test-quality',
  args: {
    action: 'apply',
    label: '<same label>',
    moduleDir: '<same>',
    allModules: [ /* same */ ],
    lenses: [ /* same */ ],
    baseline: /* the review's `gate` — so the gate is not re-run */,
    baselineRules: /* the review's `rules` — so they are not re-read */,
    items: [ /* the selected finding objects, unchanged, ids included */ ]
  }
})
```

It returns `{implemented, sourceBugs, verification, counts}`. Report, leading with
whichever applies:

- **`sourceBugs`** — a new test caught a real bug in `srv/`. Lead with it. Nothing was fixed — the
  authors and the verifier are forbidden from editing `srv/`.
- **`verification.status`** — do not collapse it to pass/fail:
  - `clean` — `tsc`, `lint`, `test` all green.
  - `red-known` — the only failures are sourceBug tests, left red on purpose. A successful run.
  - `red-unexpected` — red for another reason. **Lead with this** and show `verification.unfixed`.
  - `unverified` — the gate never completed. Say the writes are unconfirmed and offer to run
    `npm test && npm run lint` yourself.
  Show `verification.repaired` when non-empty.
- Any **`deferred`** item — an author declined it. Name it and why.
- The **timings** (§Timings).

Finally `git diff --stat "<moduleDir>/test/"` — the table is a claim, the diffstat is the evidence.

## Timings

The timings are how Sandro measures whether the workflow is optimized, so never skip them. They
cannot come from the script: the workflow runtime makes `Date.now()` throw. After every review or
apply, run the reader against the **Transcript dir** the Workflow launch printed:

```bash
node .claude/workflows/workflowTimings.mjs "<transcript dir>"
```

Report the total, each phase's seconds, and the slowest agent in the longest phase.

If he then rejects something that was written, revert it — `git checkout` the file or hunk. Do not
defend it.

If he rejects a *category* of finding rather than an instance — "stop proposing X" — that is a
standing correction, and `human-review-loop` turns it into a durable mechanism. Offer it; do not
run it unprompted.
