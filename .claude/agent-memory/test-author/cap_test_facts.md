---
name: cap-test-facts
description: Verified CAP 9.8.4 / cds.test facts for Financial Planner integration specs - facade registration, req.params shape, error status, path-expression columns
metadata:
  type: reference
---

- `cds.test("serve", ...)` does NOT load the TS service impls (`srv/*-service.ts`), so no facade is registered. To hit an action/hook over OData, `cds.connect.to("<Service>")` in a `beforeAll` support helper and `new XFacade(srv, engine).registerHandlers()` (pattern: `registerTransactionHandlers`, `registerSimpleFinHandlers`, `registerCsvImportHandlers`).
- At @sap/cds 9.8.4, `req.params[0]` is a `{ ID }` object for a bound action (`POST Entity(<uuid>)/Service.action`) AND for `after("UPDATE")` on a `PATCH Entity(<uuid>)` — verified 2026-11-02 by simpleFinSync facade specs passing.
- A handler calling `req.error({status: 400})` and returning undefined yields an HTTP 400; cds.test's axios rejects, so assert via `.catch((error: { status: number }) => error)` then `response.status`.
- String path expressions work in support readers: `.columns("alertType.name as alertTypeName")`.
- A String action returns `{ data: { value: "<text>" } }`.
- Each spec file gets its own in-memory DB; rows persist across `it`s in a file, so any spec that writes must own unique ids/cards/file names (TEST_STRATEGY §6.3). Prove it with `npx jest <file> -t "<title>"` per spec.
