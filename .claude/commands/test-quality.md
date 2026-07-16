---
description: Isolated-agent test quality review — lint+coverage gate, per-module reviewers, reviewer-vs-adversary debate, auto-implements consensus
argument: Target — omit for the uncommitted diff, or "all", or a module name (e.g. "transaction")
---

Run the test-quality workflow against "$ARGUMENTS".

Your job here is **scope resolution and rendering**. All review and implementation work happens in
isolated subagents inside the workflow — you never read the tests yourself. Keeping your context
clean is the entire point of this command; a summary you write from your own reading of the suite
defeats it.

This is the twin of `/code-quality`, pointed at `test/` instead of `srv/`. **One difference matters
and you must not blur it: this workflow writes code.** Consensus items are implemented
automatically. Contested ones are not.

## 1. Resolve the target

Default module is `Financial Planner` (the only workspace today).

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

In diff mode, if `git status` is clean, say so and stop. There is nothing to review.

**In diff mode, a diff touching only `srv/` still has lenses** — that is the whole point. Map each
changed source file to the module that owns it and review that module's tests. A build that changed
`srv/modules/transaction/` and wrote no tests is exactly the case this mode exists for.

## 2. Confirm before spending

Every review, debate, and authoring agent runs on Opus; the gate runs on Haiku. **The agent count
scales with modules, not findings** — one adversary per module rules on all of that module's
findings at once. Before invoking, tell Sandro in one line what he is about to spend: `lenses + 2
reviewers, then 1–3 debate agents per module, then 1 author per module + up to 3 verify agents`.

| Target | Roughly |
| --- | --- |
| single module | ~7 Opus + 2 Haiku |
| diff mode | ~10–16, scaling with modules touched |
| `all` | **~28 Opus + 2 Haiku** |

**For `all`, ask for confirmation first** and quote the number. For diff mode and single modules,
report the shape and proceed — that is the common case and it is cheap.

## 3. Invoke

```
Workflow({
  name: 'test-quality',
  args: {
    label: '<human-readable scope, e.g. "uncommitted diff (12 files)">',
    moduleDir: 'Financial Planner',
    mode: 'diff' | 'adhoc',
    changedFiles: [ /* diff mode only — repo-relative paths */ ],
    lenses: [
      { name: 'transaction',
        testFiles: [ /* repo-relative */ ],
        sourceFiles: [ /* repo-relative */ ] }
    ]
  }
})
```

## 4. Render the result, then stop

The workflow returns `{consensus, contested, dropped, folded, implemented, sourceBugs, verification, counts, gate, buckets}`.

Render two numbered tables. **Number them in one continuous sequence across both** so Sandro can
say "do #7" without ambiguity.

```
## Implemented — reviewer and adversary agreed, and it is now written
# | file:line | gap | what was written | severity

## Contested — the adversary held out. Nothing was written. You decide.
# | file:line | gap | reviewer says | adversary says (ground)
```

The two tables mean different things and the difference is the point of the workflow: **the first
is done, the second is not.** Do not blur them into one list.

Then report, in one line each:

- **`sourceBugs`** — a new test caught a real bug in `srv/`. **Lead with this if it is non-empty.**
  It is the most valuable thing the run can produce and it is a bug report, not a footnote. Nothing
  was fixed — by design; the authors and the verifier are both forbidden from editing `srv/`.
- **`verification.passed`** — did `tsc`, `lint` and `test` end green? **Lead with this if it is
  false.** A red tree outranks every finding in the tables. Show `verification.repaired` (what the
  verifier fixed, usually lint) and `verification.unfixed`.
- Any **`deferred`** item — an author declined to write it. Name it and why; he may disagree.
- `counts.dropped` — findings the reviewer conceded after challenge. Name them briefly.
- `counts.folded` — gaps the adversary spotted as the same finding said twice.
- `counts.deduped` — how many gaps two lenses independently found before the debate.
- Whether the suite was already clean at the **gate**, before anything was written. If it was
  already red, say so — those failures are not this run's doing.

Finally: `git diff --stat "Financial Planner/test/"` and show it. He is about to review written
code, and the table is a claim about what changed — the diffstat is the evidence.

If everything came back empty, say that plainly in one sentence. A suite with no gaps worth writing
is a real result — do not pad it with the dropped findings or invent a "consider also" section.

## 5. After he reads it

Apply contested items only by index, in a fresh turn, and only the ones he names.

If he rejects something that was **already implemented**, revert it — `git checkout` the file or
the hunk. It reached consensus, not approval; consensus is two agents agreeing, and he outranks
both. Do not defend it.

If he rejects a *category* of finding rather than an instance — "stop proposing X" — that is a
standing correction, and `human-review-loop` turns it into a durable mechanism instead of a
correction he has to repeat next run. Offer it; do not run it unprompted.
