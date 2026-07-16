---
name: refresh-docs
description: Sweep the design docs, CLAUDE.md files, and specs for staleness and contradiction, then fix them in one pass and show the diff. Use whenever Sandro wants the documentation brought back in sync — after a build or refactor, when he says "the docs are stale", "check the docs still match", "refresh the documentation", "did we update the docs", or before a checkpoint. It catches the semantic drift the lint:doc-claims linter cannot: statuses that no longer hold, references to renamed files, and docs that contradict newer docs or the code.
---

The `lint:doc-claims` linter catches docs that claim an enforcement mechanism the code does not
have. This skill catches the drift a linter cannot see: a status that says "In Progress" for
something shipped, a link to a file that was renamed, a decision one doc still states that a newer
doc reversed, a count that no longer matches. It fixes what it finds in one pass and shows you the
diff. It corrects facts; it never rewrites meaning.

Paths are relative to `Life OS/`. The corpus:

- `Financial Planner/design/*.md` (~4,500 lines) and `design/specs/*.md` (~14,000 lines).
- `CLAUDE.md` (root) and `Financial Planner/CLAUDE.md`.
- `Standards (Documents)/` and `Standards (Technical + Linting)/`.
- Ground truth when a doc's claim is checkable: the actual tree (`srv/`, `app/`, `db/`), the sprint
  board, and git history.

## Why this delegates its reading

The corpus is ~19,000 lines — far too much for the main thread. Fan out **scout subagents**, one
per doc cluster (design docs; specs; CLAUDE.md + standards), each returning a structured drift list,
not the prose. Scouts return `file:line`, the stale text, why it is stale, and the corrected value
with its source. You reconcile the lists; the writing happens against citations, not against 19,000
lines held in context.

## What counts as drift (fix these)

- **Stale status / progress** — "In Progress", "Draft", "8 of 21", "planned" that the board, the
  tree, or a newer doc shows is no longer true.
- **Broken references** — links or mentions of a file, path, section, or D-nnn ID that was renamed,
  moved, or renumbered.
- **Cross-doc contradiction** — two docs stating incompatible facts. The source of truth wins:
  code over doc, newer decision over older, the spec over a summary of it. If it is genuinely
  unclear which is right, that is not drift — leave it and list it (see below).
- **Count / inventory mismatch** — "39 entities", "20 linters", "6 agents" that no longer matches
  what exists.

## What is NOT drift (never touch)

Do not rewrite decisions, business rules, rationale, tone, or structure. Do not "improve" prose.
Do not resolve a genuine open question by picking an answer. This skill trues up facts that have a
knowable correct value; it does not make design choices.

## The pass

1. **Detect** — scouts return the drift lists; merge and dedupe into one table:
   `file:line | stale | corrected | source`.
2. **Fix** — apply every entry with `Edit`, preserving each file's format. Where a doc has a
   Change History table, add a row noting the refresh. One pass, no approval gate — this is a
   fact-truing sweep, and the diff is the review surface.
3. **Verify** — run `npm run lint:doc-claims` (from the module) and re-scan the touched files to
   confirm no new contradiction was introduced. Then show `git diff --stat` and the full diff of
   changed docs.

## Report

Lead with the diff summary: how many files, what categories of drift were corrected. Then the
detect table so Sandro can see each stale→corrected change and its source. Close with anything you
**left alone because it needed a decision** — genuine contradictions where the correct value was
not knowable. Those go to Sandro as questions, not silent edits.

You edit only documentation. You never touch `srv/`, `app/`, `db/`, or tests.
