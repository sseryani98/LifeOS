---
name: commit-diff
description: Write and make a git commit whose message matches this repo's real history — Conventional Commits with a why-first body, FRICEW IDs, and the Co-Authored-By trailer. A Haiku subagent drafts the message from the staged diff; a driver validates it before it lands. Use whenever Sandro asks to commit, "commit this", "commit my changes", "write a commit message", "stage and commit", or wants an existing commit message reviewed or rewritten.
---

Committing here is cheap to do and expensive to do badly: the history is the only place the *why*
of a change survives. This repo's commits are unusually rich — a rationale sentence, then bullets,
then the FRICEW ID — and that shape is learnable from the log itself. So the skill doesn't
describe the style; it feeds Haiku the last 8 real commits alongside the diff and lets it imitate.

**Drafting runs on Haiku by design.** It's a bounded, imitative task and the exemplars do the
heavy lifting — spending Opus on it buys nothing. The main agent stays the reviewer.

Paths are relative to `Life OS/`. The driver is `.Codex/skills/commit-diff/driver.mjs` (Node, no
dependencies).

## The loop

**1. Stage deliberately.** The driver never runs `git add -A` for you, and you shouldn't either.
The working tree here routinely holds in-flight sprint work that is not part of the change being
committed — `23dede4` explicitly left W1-S3 work behind. Stage the files that belong to *this*
commit:

```bash
git add "Financial Planner/srv/modules/transaction" "Financial Planner/test/unit/transaction"
```

**2. Build the context bundle.**

```bash
node .Codex/skills/commit-diff/driver.mjs context > /tmp/ctx.md
```

Emits branch, blocked paths, untracked files, the diffstat, the last 8 non-merge commit messages
as style exemplars, and the budgeted diff. Exits 2 with a hint if nothing is staged. Add
`--worktree` to bundle unstaged changes to tracked files instead (useful for a dry run before
staging). A real bundle of a mid-size sprint change ran ~59KB — comfortably one Haiku turn.

**3. Draft with Haiku.** Spawn a subagent with `model: haiku`, pointing at the bundle:

> Read the context bundle at `/tmp/ctx.md` (branch, diffstat, full diff, and 8 real commit
> messages from this repo's history).
>
> Write ONE commit message covering the staged diff, in this repo's exact style:
> - Subject `type(scope): description`, imperative, no trailing period, ≤72 chars. Types: feat,
>   fix, refactor, test, docs, chore, seed, merge. Scope = the srv module or area touched
>   (transaction, categorization, ingestion, db, shell, ui, config, repo, sprint, admin, shared).
> - Blank line, then a body wrapped at ≤80 columns.
> - The body leads with WHY the change exists, not a restatement of the diff, then bullets the
>   specifics. Study the exemplars — they open with a rationale sentence, then bullet.
> - FRICEW IDs (ENH-009, FRM-001) on their own line in the body if the diff relates to one.
> - End with a blank line then exactly:
>   `Co-Authored-By: Codex Opus 4.8 (1M context) <noreply@anthropic.com>`
>
> Write ONLY the raw message (no fences, no commentary) to `/tmp/msg.txt`, then reply DONE.

**4. Read the draft yourself, then commit.** Haiku saw the diff, not the intent. Check the *why*
sentence is actually the why — that's the one thing the diff can't tell it, and the one thing
worth your attention.

```bash
node .Codex/skills/commit-diff/driver.mjs commit /tmp/msg.txt
```

`commit` re-runs every `check` rule, refuses on any ERROR, refuses to commit a forbidden path, and
normalises CRLF (git keeps the message verbatim, so a `\r` from a Windows write lands in the log).
Run `check <file>` alone to validate without committing — including on an existing message you're
rewriting.

## What the driver enforces

Errors block the commit; warnings are advisory and print either way.

| | Rule |
|---|---|
| ERROR | Subject matches `type(scope): description` with a known type (VERSION_CONTROL.md §6.2) |
| ERROR | Line 2 is blank |
| ERROR | `Co-Authored-By` trailer present (§6.5 — required on agent commits) |
| ERROR | Subject ≤100 chars |
| ERROR | No `.env`, `node_modules/`, `gen/`, `logs/`, `@cds-models/`, `coverage/` staged |
| warn | Subject ≤72 chars; imperative mood; no trailing period |
| warn | Body lines ≤80 cols; body present at all |

Validated against ground truth: 9 of the last 10 real commits pass clean. The tenth, `d20e740`,
fails legitimately — its message begins with a stray `@` line, which is a real defect the rules
caught rather than a false positive.

## Gotchas

- **The trailer in VERSION_CONTROL.md §6.5 is wrong in practice.** The doc says
  `Co-Authored-By: Codex <noreply@anthropic.com>`; every actual commit uses the
  model-specific `Co-Authored-By: Codex Opus 4.8 (1M context) <noreply@anthropic.com>` the
  harness emits. History wins — the driver accepts any `Name <email>` trailer rather than pinning
  the model string, which would break on the next model. Don't "fix" a draft to match the doc.
- **§6.2's type table omits types history uses.** `merge`, `seed`, and `init` all appear in the
  log; only `seed` is in the doc's table. The driver allows `merge`/`seed` (plus `perf`, `style`,
  `revert`) on top of the documented six. `init` is deliberately *not* allowed — the two `init`
  commits are the repo's root commits, not a pattern to repeat.
- **§7.2's merge format is also stale.** It prescribes `merge: sprint W1-S1 — {goal}`, but real
  merges use `merge(sprint): W1-S2 Ingestion Pipeline`. Both parse as type `merge` and both pass
  `check` — the scope group is optional, so the driver can't tell them apart. This one is on you:
  prefer the real form, because the linter won't.
- **`$TMPDIR` is unset in this environment.** `> $TMPDIR/ctx.md` silently resolves to `/ctx.md`
  and dies with `Permission denied`. Use an absolute scratch path.
- **Untracked files are listed but never diffed.** A new module shows up as filenames only, so
  Haiku will under-describe it. `git add` the new files *before* step 2 if they're part of the
  commit — otherwise the message will quietly omit an entire new app.
- **The diff is budgeted, not complete.** 12K chars per file, 90K total; overflow is marked in a
  `## Truncation notes` section. If that section is non-empty, the message may be missing
  something — read the notes and consider splitting the commit, which is usually the right answer
  anyway.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Nothing staged. Stage the intended files…` (exit 2) | You skipped step 1. `git add` the files, or pass `--worktree` for a dry run. |
| `Refusing to commit: fix the ERROR lines above.` | Edit `/tmp/msg.txt` and re-run `commit`. Don't bypass with `git commit` directly. |
| `Refusing to commit .env — .env holds ENCRYPTION_KEY.` | Something ran `git add -f`. `git rm --cached .env` and re-stage properly. |
| Subject renders as one long line in `git log --oneline` | Line 2 wasn't blank. The ERROR fires for exactly this — `d20e740` is what it looks like when it slips through. |
