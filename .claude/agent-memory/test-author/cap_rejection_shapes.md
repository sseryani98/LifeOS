---
name: cap-rejection-shapes
description: Observed error shapes on @sap/cds 9.8.4 + SQLite for @mandatory, @assert.unique and String(n) overflow, so contract tests can pin them without a probe run
metadata:
  type: reference
---

Observed in Project Tracker `test/integration/tracker/tests/readPath.test.ts` (2026-11-02, cds 9.8.4, SQLite in-memory):

- **@mandatory field omitted on POST** -> HTTP 400, `error.code` `ASSERT_MANDATORY`, `error.target` = the bare field name (`branch`, `executedAt`, `decidedAt`). A single missing field gives a single error, not MULTIPLE_ERRORS.
- **Entity-level @assert.unique violated** -> HTTP 500, `error.code` `SQLITE_CONSTRAINT_UNIQUE`, `error.message` contains `Entity.field` (e.g. `Initiative.position`, `Milestone.position`, `Workspace.slug`). Never an ASSERT_UNIQUE code (TEST_STRATEGY §9.1).
- The OData harness `RejectedWrite` (`support/odataHarness.ts`) now carries `target`; use it to prove *which* field was refused.

**How to apply:** pin these directly; re-verify only if the cds pin moves.

- **`String(n)` overflow on a service-level `srv.tx(...).run(INSERT.into("TrackerService.X"))`** -> rejected `ASSERT_DATA_TYPE`, `target` = the field, `args[0]` = the value (seen 2026-11-04, a 494-char `Defect.title` into `String(200)`). So a "fits the column" assertion on rows written through the service is a framework test — drop it; it can never fail on a passing load.
- **Accumulated `req.error()`s thrown by in-process `req.reject()`** (a `new cds.Request` inside `srv.tx`, not HTTP) -> the error has `message: "MULTIPLE_ERRORS"`, **no `code`**, and `details[]` each with `code`/`status`/`target`. A harness that unwraps on `error.code === "MULTIPLE_ERRORS"` never unwraps, and `keys` comes back `["MULTIPLE_ERRORS"]` (Project Tracker `integration/migration/support/migrationHarness.ts`, fixed 2026-11-04 to key on `Array.isArray(details)`). Single errors are thrown bare.
