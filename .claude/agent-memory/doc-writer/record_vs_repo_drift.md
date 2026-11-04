---
name: record-vs-repo-drift
description: A record's measured values can be stale against the repo; spot-check headline counts before rendering, and how the inline-cite check treats upstream D-nn
metadata:
  type: feedback
---

- **Spot-check the record's headline counts against the file they measure (read-only, one grep).**
  Rendering Project Tracker TH-001 from its approved doc (2026-11-04): the record said
  `theme-overrides.css` is 187 lines, 44 `:root` properties, Link `#8B6B1F`; the file on disk was
  390 lines, 89 properties, `--sapLinkColor: #7a5e1b` (commit 6abcd76, 2026-11-02, after the doc).
  **Why:** the writer must not re-measure or override the record, but silently rendering a stale
  value turns into a wrong `/ux-test` rubric. **How to apply:** render the record's value, and report
  the mismatch to the host as a gap/finding — never substitute your own measurement.
- **Contrast ratios are cheap to recompute** from two hexes (WCAG relative-luminance formula, a
  10-line Python script in the scratchpad). Doing it confirms the record's arithmetic; it does not
  confirm the hexes are current (see above).
- **"Every decision cited inline appears in the Decisions Reference" collides with upstream D-nn.**
  Stage docs cite earlier same-module decisions (D-146, D-30, D-143…) that belong to other stages'
  references. Treat the check as covering *this stage's* decisions only, and say so in the report.
- **Process decisions (skill/harness changes) logged by a stage have no natural inline home.** Cite
  them in Amendments → "outside this module" rows so the inline/reference check holds both ways.
