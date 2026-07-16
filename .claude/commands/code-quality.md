---
description: Isolated-agent code quality review — lint gate, parallel reviewers, reviewer-vs-adversary debate, consensus table
argument: Target — omit for the uncommitted diff, or "backend", "frontend", "all", or a module name (e.g. "transaction")
---

Run the code-quality review workflow against "$ARGUMENTS".

Your job here is **scope resolution and rendering**. All review work happens in isolated
subagents inside the workflow — you never read the code under review yourself. Keeping your
context clean is the entire point of this command; a summary you write from your own reading
of the diff defeats it.

## 1. Resolve the target

Default module is `Financial Planner` (the only workspace today). If a second module exists
and the argument names it, use that instead.

| "$ARGUMENTS" | Scope |
| --- | --- |
| *(empty)* | **Diff mode.** `git status --porcelain` — every modified and untracked file. This is the post-build case. |
| `backend` | `Financial Planner/srv/**/*.{ts,cds}` |
| `frontend` | `Financial Planner/app/**/*.{ts,xml,json}` |
| `all` | both of the above |
| anything else | Treat as a **module/domain name**. Glob `Financial Planner/srv/modules/{name}/**` and `Financial Planner/test/{unit,integration}/{name}/**`. If that matches nothing, list the real domain folders under `srv/modules/` and ask which one — do not guess. |

Exclude from every mode: `gen/`, `@cds-models/`, `node_modules/`, `coverage/`, `logs/`,
`db/seed/`, `*.log`, lockfiles, and anything under `design/` or `project/` (docs are not
this workflow's job).

In diff mode, if `git status` is clean, say so and stop. There is nothing to review.

## 2. Group into domains

The per-domain reviewers exist so no agent has to hold the whole tree. Bucket the scoped
files by domain:

- `srv/modules/{domain}/**` → domain `{domain}`
- `app/{appName}/**` → domain `{appName}`
- everything else (`srv/shared`, root `.cds`, `test/shared`) → domain `shared`

Drop empty buckets. If a single domain exceeds ~25 files, split it by subfolder — a reviewer
with 60 files in context is the problem this workflow was built to avoid.

## 3. Confirm before spending

Both sides of the debate run on Opus. Before invoking, tell Sandro in one line what he is
about to spend: the file count, the domain count, and the resulting agent count —
`2 × domains + 3 (+1 if backend) reviewers, then 1–2 agents per surviving finding`.

For `all`, or anything over ~40 files, **ask for confirmation first**. For diff mode and
single modules, just report the shape and proceed — that is the common case and it is cheap.

## 4. Invoke

```js
Workflow({
  name: 'code-quality',
  args: {
    label: '<human-readable scope, e.g. "uncommitted diff (24 files)">',
    moduleDir: 'Financial Planner',
    files: [ /* repo-relative paths */ ],
    domains: [ { name: 'transaction', files: [ /* ... */ ] } ],
    hasBackend: true,
    backendFiles: [ /* srv/ subset — cap-annotation-hunter's scope */ ],
    hasFrontend: false
  }
})
```

`hasBackend: false` skips the `cap-annotation-hunter` agent entirely — it has nothing to say
about `app/`.

## 5. Render the result, then stop

The workflow returns `{consensus, contested, dropped, counts, lint}`. Render two numbered
tables. **Number them in one continuous sequence across both tables** so Sandro can say
"do #1 #4 #7" without ambiguity about which table he means.

```text
## Consensus — reviewer and adversary agree
# | file:line | finding | proposed fix | severity

## Contested — you decide
# | file:line | finding | reviewer says | adversary says
```

Then stop. This matches the contract `human-review-loop` and `cap-annotation-hunter` already
use: table, then wait. **Apply nothing.** Sandro replies by index.

Also report, in one line each:

- `counts.dropped` and `counts.droppedByGround` — findings the reviewer conceded after
  challenge, and on which ground (`over-engineering`, `readability`, `not-worth-a-row`).
  **List the dropped items briefly, one line each** — the adversary is a severity gate and
  Sandro may disagree with a concession. A silent drop reads as "nothing was there."
- `counts.deduped` — how many findings two finders independently agreed on.
- Whether the lint suite passed clean or halted, and where.

If everything came back empty, say that plainly in one sentence. A clean review is a real
result — do not pad it with the findings that were dropped or invent a "consider also"
section.

## 6. After he rules

Apply only the indices he names, in a fresh turn.

If he accepts a `structure` finding about size or cohesion, note that **no lint rule covers
it** — there is no `max-lines` or `max-classes-per-file` in this repo, by decision. That
makes it a candidate for `human-review-loop`, which turns a one-off correction into a durable
mechanism. Offer that; do not run it unprompted.
