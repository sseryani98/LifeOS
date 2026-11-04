---
name: functional-coverage-gotchas
description: Reusable checks for the functional-coverage reviewer role (spec->test mapping) in Financial Planner; where real gaps hid in the ingestion run 2026-11-02
metadata:
  type: feedback
---

Checks that found real defects when mapping SPEC-nn rules to tests:

- **FRM-* wizard rules live in app/ controllers, not srv/.** The ingestion backend was at 99% coverage, but SPEC-01 FRM-003 logic (clear/propagate/undo, moving a fixed Excluded row into New) sits in `app/csv-import-wizard/webapp/controller/*.controller.ts` and no frontend test exists. Two confirmed spec breaches were there: undo does not revert propagated rows, and a fixed Excluded row comes back with amount 0. Always read the controller for each FRM rule.
- **Mocks whose fixture values equal production defaults make "fallback" tests vacuous.** `simplefinMocks.ts` CONFIG = SYNC_DEFAULTS (7/3/3), and `getNumericConfig` is re-implemented in the mock, so a test named "falls back to defaults" proves nothing. Compare mock config values with `constants.ts` defaults.
- Key-insensitive reference mocks: see [[test-review-gotchas]]. The same mock means no rule-to-alert-type mapping is tested anywhere.
- **Uncovered DataService lines = a filter rule no test exercises.** `simpleFinDataService.ts:60-71` (isActive / lastSyncAt filters) is spec rule BR-32. Read the uncovered-lines column as a list of rules, not as a style issue.
- **Not a defect: `req.params[0]` is `{ID}` on cds 9.** `cds.env.features.consistent_params` defaults to true (`node_modules/@sap/cds/lib/env/defaults.js:49`), so `params?.[0].ID` works. Do not flag it until cds^10.

**Why:** these were the only gaps under a suite that looked green with 99% coverage.
**How to apply:** run these checks first on any module's functional-coverage review. SPEC-14 (CNV-001) is a one-off script, not the ingestion module, so skip it on ingestion runs.
