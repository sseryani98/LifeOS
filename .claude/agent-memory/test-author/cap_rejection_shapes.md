---
name: cap-rejection-shapes
description: Observed OData error shapes on @sap/cds 9.8.4 + SQLite for @mandatory and @assert.unique, so contract tests can pin them without a probe run
metadata:
  type: reference
---

Observed in Project Tracker `test/integration/tracker/tests/readPath.test.ts` (2026-11-02, cds 9.8.4, SQLite in-memory):

- **@mandatory field omitted on POST** -> HTTP 400, `error.code` `ASSERT_MANDATORY`, `error.target` = the bare field name (`branch`, `executedAt`, `decidedAt`). A single missing field gives a single error, not MULTIPLE_ERRORS.
- **Entity-level @assert.unique violated** -> HTTP 500, `error.code` `SQLITE_CONSTRAINT_UNIQUE`, `error.message` contains `Entity.field` (e.g. `Initiative.position`, `Milestone.position`, `Workspace.slug`). Never an ASSERT_UNIQUE code (TEST_STRATEGY §9.1).
- The OData harness `RejectedWrite` (`support/odataHarness.ts`) now carries `target`; use it to prove *which* field was refused.

**How to apply:** pin these directly; re-verify only if the cds pin moves.
