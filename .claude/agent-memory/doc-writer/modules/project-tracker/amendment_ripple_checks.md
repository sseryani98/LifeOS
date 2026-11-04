---
name: amendment-ripple-checks
description: Where an amendment to an Approved Project Tracker spec leaks into other docs - FUT/BR totals, load-rejection claims, CNV ownership
metadata:
  type: project
---

Adding a FUT or BR to an Approved Project Tracker spec drifts frozen totals elsewhere, and the
workshop record will not list them. Grep before handing back.

- **FUT/BR totals:** `design/TEST_STRATEGY.md` §14 (§14.2 per-spec tier table, "All 180", "366
  business rules"), `design/BUILD_PLAN.md` §3.1 prose, the story table (~line 288) and its totals
  (~line 299-303), and `PLAN.md` (~lines 30, 49, 858-948). A new FUT also needs a **tier** in §14.2 —
  that is a ruling, not a count, so return it to the host rather than guessing (SPEC-02 FUT-019,
  2026-11-02: returned, Sandro ruled Verb (A) in a follow-up — the right call).
- **Rewrite vs annotate (applied 2026-11-02, host accepted the brief):** current-state contract text
  (TST-001 §2/§14, BP-001 §2-§9) gets the new number; dated `PLAN.md` §8 entries keep the measured
  number plus a "— N since YYYY-MM-DD" annotation; Decisions Reference rows (TST-001 ~836/842, BP-001
  ~546/552) and `DECISIONS_LOG.md` stay as decided. Re-check derived *claims* too: +1 verb made
  TST-001 §14.2's "largest destination is the script tier" false (verb 60 > script 59).
- **Removing an error key drifts derived counts:** `PLAN.md` ~174/~2025 say "nine `wfl.*` keys" and
  "14 rejections"; `TST-001` §8 (~375) says "SPEC-02's 14 rejections" (§5 actually had 15 — the 14's
  basis is unstated, so flag rather than re-count).
- **A BR that borrows another object's constraint as its mechanism: check the scope agrees.** SPEC-02
  BR-13 (D-245 draft) leaned on `verb.story.duplicate` "in the Workspace" (SPEC-06 BR-17), but DM-001
  §4.5/§9 row 519, TST-001 ~374, D-232's `@assert.unique.storyId: [initiative, storyId]` and
  `srv/modules/tracker/trackerService.ts` `checkMilestoneWrite` are all per-**Initiative**. Returned a gap;
  Sandro ruled workspace-wide (D-246) and the code became a named build defect in SPEC-02 §2 am. 9.
  Grep the constraint across DM-001 §9, the schema and the handler before writing the BR.
- **Spec behaviour cited by DM-001:** `design/DATA_MODEL.md` §9's constraints table quotes specs'
  mechanisms (e.g. "SPEC-02 §3.1 rejects the _load_"). Changing a spec's mechanism breaks that row.

- **Logging new D-nn trips `lint:design-counts` on `PLAN.md:10`** ("decisions run to D-256"). Run
  `npm run -s lint:design-counts` from the module after appending; PLAN.md is the host's, so report
  the drift rather than editing it (2026-11-04, D-257 … D-263).
- **Two `R-nn` registers collide:** this module's `research/README.md` §5 (R4, R7, R10, R11) and the
  UI5 pack at `Standards (Documents)/research/README.md` (R1–R9). Prefix the pack's as "UI5-pack Rn".
- **Browser-FUT ruling ripples to BP-001 §8.3 and D-204** ("done when `/functional-test` passes").

**Why:** DoD criterion 7 (no broken cross-references) fails silently on these; the record only names
the docs the host thought of.

**How to apply:** after editing, `grep -rn "SPEC-nn" design/ PLAN.md | grep -i "FUT\|BR\|count"` and
grep DATA_MODEL §9 for the spec's section number. See also [[doc-editing-mechanics]].
