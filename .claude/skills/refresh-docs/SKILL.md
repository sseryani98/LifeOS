---
name: refresh-docs
description: Sweep the design docs, CLAUDE.md files, and specs for staleness and contradiction, then fix them in one pass and show the diff. Use whenever Sandro wants the documentation brought back in sync — after a build or refactor, when he says "the docs are stale", "check the docs still match", "refresh the documentation", "did we update the docs", or before a checkpoint. It catches the semantic drift the lint:doc-claims linter cannot: statuses that no longer hold, references to renamed files, and docs that contradict newer docs or the code.
---

The `lint:doc-claims` linter catches docs that claim an enforcement mechanism the code does not
have. This skill catches the drift a linter cannot see: a status that says "In Progress" for
something shipped, a link to a file that was renamed, a decision one doc still states that a newer
doc reversed, a count that no longer matches. It fixes what it finds in one pass and shows you the
diff. It corrects facts; it never rewrites meaning.

Paths are relative to `Life OS/`. **Resolve the module first:** the one Sandro names, else the one
the working-tree diff (or the latest commits) touches. If that is ambiguous, ask. Sweep every module
only when he asks for "all" — each module is its own pass, run one after another.

The corpus for one module `{module}`:

- `{module}/design/*.md` and `{module}/design/specs/*.md` (Financial Planner ~8,300 lines of
  design docs; Project Tracker ~13,600).
- `{module}/CLAUDE.md`, plus `{module}/PLAN.md` where the module has one.
- Root `CLAUDE.md` and both `Standards` folders — the cross-module layer. Check these in every pass,
  but correct only facts about **this** module; drift about another module goes in the
  left-alone list for its own pass.
- `Standards (Documents)/CODING_STANDARDS.md` is the shared standards file for every module — its
  examples are the planner's by design; sweep it for rules that no longer hold, not for vocabulary.
- Ground truth when a doc's claim is checkable: the module's actual tree (`srv/`, `app/`, `db/`,
  and any other source folder its `CLAUDE.md` lists), its tracking artifacts (the sprint board, or
  `PLAN.md`), and git history.

## Why this delegates its reading

One module's corpus runs to 10,000–20,000 lines — far too much for the main thread. Fan out **scout subagents**, one
per doc cluster (design docs; specs; CLAUDE.md + standards), each returning a structured drift list,
not the prose. Scouts return `file:line`, the stale text, why it is stale, and the corrected value
with its source. You reconcile the lists; the writing happens against citations, not against the whole corpus held
in context.

## What counts as drift (fix these)

- **Stale status / progress** — "In Progress", "Draft", "8 of 21", "planned" that the board, the
  tree, or a newer doc shows is no longer true.
- **Broken references** — links or mentions of a file, path, section, or D-nnn ID that was renamed,
  moved, or renumbered.
- **Cross-doc contradiction** — two docs stating incompatible facts. The source of truth wins:
  code over doc, newer decision over older, the spec over a summary of it. If it is genuinely
  unclear which is right, that is not drift — leave it and list it (see below).
- **Count / inventory mismatch** — "39 entities", "N linters", "6 agents" that no longer matches
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
3. **Verify** — run `npm run lint:doc-claims` (from `{module}`) and re-scan the touched files to
   confirm no new contradiction was introduced. Then show `git diff --stat` and the full diff of
   changed docs.

## Report

Lead with the diff summary: how many files, what categories of drift were corrected. Then the
detect table so Sandro can see each stale→corrected change and its source. Close with anything you
**left alone because it needed a decision** — genuine contradictions where the correct value was
not knowable. Those go to Sandro as questions, not silent edits.

You edit only documentation. You never touch `srv/`, `app/`, `db/`, or tests.
