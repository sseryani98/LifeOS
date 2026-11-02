---
name: doc-editing-mechanics
description: Line endings, prettier state and Bash heredoc pitfalls when editing Project Tracker design docs
metadata:
  type: reference
---

- **Line endings differ per file.** `design/TECH_STACK.md` and `design/DATA_MODEL.md` are CRLF;
  specs, `DECISIONS_LOG.md` and `TEST_STRATEGY.md` are LF (checked with `file`, 2026-11-02). A
  multi-line exact-match replace fails on CRLF unless normalised first.
- **Run `npx prettier --check` (from the repo root) before `--write`.** `DECISIONS_LOG.md`,
  `TECH_STACK.md` and `DATA_MODEL.md` were already prettier-unclean, so `--write` would churn the
  whole file; there, add table rows unpadded or pad by hand. Specs and `TEST_STRATEGY.md` were clean,
  so `--write` safely re-pads their tables.
- **Large Bash heredocs carrying JSON/markdown failed** with `unexpected EOF while looking for
  matching '` even when quoted `<<'EOF'`. Reliable path: Write the replacement pairs to a JSON file in
  the scratchpad, apply with a small Python script that asserts each old string matches exactly once.

Related: [[amendment-ripple-checks]].
