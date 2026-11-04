---
name: integration-review-checks
description: Fast checks for Financial Planner integration/mocking reviews — facade registration under cds.test, req.params shape, _enc exposure
metadata:
  type: reference
---

Checks that found real gaps in the ingestion integration review (2026-11-02):

- **cds.test does not load the TS service impl.** A module's integration tests only exercise OData
  actions if its `support/` registers the facade on the served service. The pattern to compare
  against is `registerTransactionHandlers` in `Financial Planner/test/integration/transaction/support/transaction.ts`.
  No `register*Handlers` in a module's support = its actions/after-handlers are untested over OData,
  even if test titles say "Sync Now".
- **`req.params` shape is not stable.** `transactionService._resolveTransactionKey` documents CAP
  delivering the key as a string OR `{ ID }`. Any service doing `req.params?.[0] as { ID }` whose
  unit test hand-builds `params: [{ ID }]` is a self-fulfilling mock — flag it.
- **`_enc` exclusion:** grep `srv/*.cds` for `excluding` / `@cds.api.ignore`. As of 2026-11-02 none
  existed; `AdminService.ProviderConnections` exposed `accessUrlEnc`. DataServices read db-level
  entity names (`ENTITIES.*` in each module's constants.ts), so excluding on the projection is safe.
- Order dependency: grep integration specs for comments like "created by the prior test" and for
  `to.have.length(N)` totals that only hold after earlier `it`s ran.

Related: [[feedback_no_framework_tests]]
