# Test Strategy

**Document ID:** TS-003
**Version:** 1.0
**Date:** 2026-02-16
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                           |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| 2026-02-16 | Sandro & Claude | Initial creation — Step 10 complete. D-74 through D-80 logged.                                        |
| 2026-02-16 | Sandro & Claude | Added §12 — Markdown test report generation (rolling 5 files).                                        |
| 2026-02-20 | Sandro & Claude | Added TDD workflow reference in §2 Summary (D-230). Primary definition in TECHNICAL_STANDARDS.md §13. |
| 2026-02-20 | Claude          | Status → Approved. Step 12 complete — all 21 specs approved.                                          |
| 2026-07-15 | Sandro & Claude | Life OS restructure — §12.1 test report script now shared from Standards.                             |

---

## 2. Summary

| Area                     | Standard                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Framework**            | Jest + ts-jest (backend), QUnit + OPA5 (frontend)                                                         |
| **Test pyramid**         | Unit → Integration → Functional (scenario). External APIs always mocked.                                  |
| **Unit targets**         | Validators (100%), Services + ENH engines (90%), Utilities (100%). Facades skipped.                       |
| **Integration**          | `cds.test()` + SQLite. One test file per CDS service. Scenarios under `integration/scenarios/`.           |
| **Test data**            | Hybrid factories + named constants. Canonical test world for integration. Semantic naming.                |
| **Coverage**             | Validators/Utilities: 100%/100%. Services: 90%/85%. Overall: 85%/80%. Frontend: no enforced threshold.    |
| **Frontend**             | QUnit for shared resources + select controllers. OPA5 journeys on 2 apps (learning exercise).             |
| **Development workflow** | Test-driven development (D-230). Primary definition in [Technical Standards](TECHNICAL_STANDARDS.md) §13. |

---

## 3. Test Tooling

**Decision D-74.**

### 3.1 Backend

| Tool           | Purpose                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| **Jest**       | Test runner, assertion library, mocking (`jest.fn()`, `jest.mock()`, `jest.spyOn()`) |
| **ts-jest**    | TypeScript transpilation for Jest — enables `.test.ts` files without pre-compilation |
| **cds.test()** | CAP test helper — boots test server with SQLite, provides bound `axios` client       |

Jest is CAP's documented test framework. `cds.test()` is framework-agnostic but all CAP examples and community answers target Jest.

### 3.2 Frontend

| Tool      | Purpose                                                                                     |
| --------- | ------------------------------------------------------------------------------------------- |
| **QUnit** | SAPUI5's built-in unit test framework — tests controller logic, formatters, custom controls |
| **OPA5**  | SAPUI5's integration/journey test framework — simulates user interaction through actual UI  |

### 3.3 Configuration

`jest.config.ts` at project root:

| Setting                      | Value                                                                       |
| ---------------------------- | --------------------------------------------------------------------------- |
| `preset`                     | `ts-jest`                                                                   |
| `testEnvironment`            | `node`                                                                      |
| `roots`                      | `['<rootDir>/test']`                                                        |
| `testMatch`                  | `['**/*.test.ts']`                                                          |
| `coverageDirectory`          | `coverage/`                                                                 |
| `coveragePathIgnorePatterns` | `['**/node_modules/**', '**/@cds-models/**', '**/gen/**', '**/*Facade.ts']` |
| `coverageThreshold`          | See §8                                                                      |

---

## 4. Test Boundaries

**Decision D-75.**

### 4.1 Three-Tier Pyramid

| Level           | Scope                                     | Database?                     | Network?                  | What It Validates                                                                   |
| --------------- | ----------------------------------------- | ----------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| **Unit**        | Single class/method in isolation          | No — mocked                   | No — mocked               | Logic correctness. One layer at a time.                                             |
| **Integration** | OData endpoint through the full CAP stack | Yes — SQLite via `cds.test()` | No — external APIs mocked | Request → CDS → Handler → DB → Response. Layers wire together correctly.            |
| **Functional**  | Multi-step user scenario                  | Yes — SQLite via `cds.test()` | No — external APIs mocked | FUT scenarios from functional specs. Sequence of OData calls simulating a workflow. |

### 4.2 Boundary Rules

| Rule                                                            | Rationale                                                                                                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| External APIs are always mocked (SimpleFIN, cheerio, node-cron) | Deterministic, fast, no network dependency                                                                                               |
| Unit tests never touch the database                             | CDS queries mocked. Pure logic testing.                                                                                                  |
| Integration tests use SQLite, not PostgreSQL                    | `cds.test()` makes SQLite zero-config. Pragmatic trade-off for a solo project — PostgreSQL-specific edge cases caught in manual testing. |
| Functional tests are integration tests with storylines          | Same `cds.test()` + SQLite infrastructure. Organized by user journey, not by endpoint.                                                   |
| Functional tests nest under `test/integration/scenarios/`       | Not a separate top-level folder — same test infrastructure, different organization.                                                      |

---

## 5. Unit Test Standards

**Decision D-76.**

### 5.1 Per-Layer Rules

| Layer         | What to Test                                                                                        | What to Mock                                                                                                                                                                     | Test File                   |
| ------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Validator** | Every validation rule — positive (valid passes) and negative (`req.error()` fires). 100% coverage.  | Nothing. Mock `req` as a simple object with an `error()` spy. Validators have no dependencies.                                                                                   | `{Domain}Validator.test.ts` |
| **Service**   | Business logic, orchestration, computed values, state transitions. Every public and private method. | CDS queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), other Services, `EncryptionUtility`, `DateTimeUtility`. **Validator is NOT mocked** — called through for free integration. | `{Domain}Service.test.ts`   |
| **Facade**    | **Not unit tested.** Zero logic (enforced by ESLint). Wiring validated by integration tests.        | —                                                                                                                                                                                | —                           |

### 5.2 Additional Unit Test Targets

| Module                                                                    | What to Test                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Utilities** (`EncryptionUtility`, `DateTimeUtility`, `CurrencyUtility`) | Every public method. Encrypt/decrypt round-trips, edge cases (empty string, null). 100% coverage.                                                                                                                                 |
| **ENH engines** (via their Service class)                                 | Core computations — bonus progress (ENH-003), points balance (ENH-006), budget engine (ENH-007), eligibility rules (ENH-004), profitability (ENH-005), categorization scoring (ENH-001). Highest-value unit tests in the project. |
| **MessagingUtility**                                                      | i18n key resolution, parameter substitution.                                                                                                                                                                                      |

### 5.3 Private Method Testing

Private methods (prefixed with `_`) are tested directly via bracket notation:

```typescript
const result = service["_computeTrancheWindow"](startDate, months);
```

Test files get ESLint overrides to allow this pattern:

```typescript
// Standards (Technical + Linting)/eslint.config.mjs — test file overrides
{
  files: ['test/**/*.test.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'dot-notation': 'off',
  }
}
```

### 5.4 Service Test Mocking Pattern

Services mock CDS queries, not the Validator:

```typescript
// Mock CDS SELECT
jest.mock("#cds-models/com/financialplanner", () => ({
  Transaction: "Transaction",
}));
const cds = require("@sap/cds");
jest.spyOn(cds, "run").mockResolvedValue([AMEX_COBALT_TRANSACTIONS]);

// Validator is real — exercises validation for free
const service = new TransactionService();
const result = await service.processTransaction(VALID_TRANSACTION_INPUT);
```

---

## 6. Integration Test Standards

**Decision D-77.**

### 6.1 Setup Pattern

```typescript
const cds = require("@sap/cds");
const { GET, POST, PATCH, DELETE } = cds.test("serve", "--with-mocks");

beforeAll(async () => {
  // Seed canonical test world
  await seedTestData();
});
```

`cds.test()` boots the CAP server with SQLite and provides a bound `axios` client. No manual URL wiring.

### 6.2 Test Coverage Per CDS Service

| Test Shape                    | Example                                                               | Covers                                               |
| ----------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| **CRUD operations**           | `GET /service/transactionSvcs/Transaction`, `POST`, `PATCH`, `DELETE` | Entity exposed correctly, projections work           |
| **Custom actions/functions**  | `POST /service/churningSvcs/computeEligibility`                       | Action routing, parameter validation, response shape |
| **Query options**             | `$filter`, `$expand`, `$orderby`, `$select`, `$top/$skip`             | OData query handling, association expansion          |
| **Error responses**           | Send invalid data, expect 400/404/409                                 | Error messages surface correctly, i18n keys resolve  |
| **Sensitive field exclusion** | `GET` list queries must NOT return `_enc` fields                      | Encrypted fields only via explicit actions           |

### 6.3 Test Isolation

Each test file targets one CDS service. Tests within a file share seed data but do not depend on execution order. Mutations use either:

- Unique identifiers to avoid collisions, or
- Per-test setup/teardown around the mutation

### 6.4 Scenario Tests

Nested under `test/integration/scenarios/`. These chain multiple OData calls to simulate FUT workflows:

| Scenario                  | Steps                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Weekly review (WFL-001)   | Trigger sync → GET new transactions → PATCH categorizations → verify dashboard data      |
| Card onboarding (WFL-004) | POST card instance → POST provider account → trigger sync → verify bonus tracking starts |
| CSV import (FRM-003)      | POST CSV upload action → GET review buckets → PATCH approvals → verify counts            |
| Card lifecycle (WFL-002)  | Create Focus card → meet bonus → verify auto-transition → manually cancel → close        |

### 6.5 Test Data Rule

**Tests never construct data inline.** All test data comes from imported constants with semantic names:

```typescript
// Good — intent is immediately clear
it('should compute bonus progress for multi-tranche offer', () => {
  const result = service.computeBonusProgress(
    AMEX_COBALT_FOCUS_CARD,
    COBALT_THREE_TRANCHE_OFFER,
    COBALT_PARTIAL_SPEND_TRANSACTIONS
  );
  expect(result.tranches[0].status).toBe('met');
  expect(result.tranches[1].status).toBe('inProgress');
});

// Bad — test drowns in setup noise
it('should compute bonus progress', () => {
  const card = { id: '1', marketCard_ID: '2', ... };
  const tranches = [{ id: '1', msrAmount: 1000, ... }];
  // ...
});
```

The only exception: when the test is specifically _about_ a field value (e.g., testing `amount: 0` triggers validation), that specific override is inline — the base object is still imported.

---

## 7. Test Data Strategy

**Decision D-78.**

### 7.1 Hybrid Pattern: Factories + Named Constants

Factories keep data DRY. Named constants keep tests readable.

```typescript
// test/shared/data/factories.ts — builds the objects
export function buildCardInstance(
  overrides?: Partial<CardInstance>,
): CardInstance {
  return {
    ID: randomUUID(),
    marketCard_ID: AMEX_COBALT_MARKET_CARD.ID,
    offer_ID: COBALT_STANDARD_OFFER.ID,
    lifecycleState: "Active",
    ...overrides,
  };
}

// test/shared/data/cards.ts — named constants for tests
export const AMEX_COBALT_FOCUS_CARD = buildCardInstance({
  lifecycleState: "Focus",
  activationDate: "2026-01-15",
});

export const TD_AEROPLAN_ACTIVE_CARD = buildCardInstance({
  marketCard_ID: TD_AEROPLAN_MARKET_CARD.ID,
  offer_ID: TD_SIMPLE_OFFER.ID,
  lifecycleState: "Active",
  activationDate: "2025-06-01",
});

export const CLOSED_AMEX_GOLD = buildCardInstance({
  marketCard_ID: AMEX_GOLD_MARKET_CARD.ID,
  lifecycleState: "Closed",
  closedDate: "2025-12-01",
});
```

### 7.2 Canonical Test World

A pre-built dataset for integration and scenario tests in `test/shared/data/` (module-grouped seed sets):

| Seed Set           | Contents                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| **Reference data** | 3 issuers (Amex, TD, CIBC), 4 rewards programs, 6 purchase types, 5 earning categories, 3 card networks |
| **Card products**  | 3 market cards (one per issuer), each with earning multipliers and at least one offer with tranches     |
| **User portfolio** | 4 card instances — Focus (active bonus), Active, To Cancel, Closed. One supplementary card.             |
| **Transactions**   | ~20-30 covering: multiple vendors, both categories assigned, splits, excluded, different sources        |
| **Budget**         | Income entries, budget allocations, one recurrent expense, one active goal                              |
| **Integration**    | One provider connection, two provider accounts                                                          |
| **Alerts**         | A few across different types and severities                                                             |

### 7.3 Sensitive Data in Test Fixtures

| Rule                                                          | Details                                                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Use obviously fake values                                     | `4111111111111111` (standard test card), `000` CVV, `12/99` expiry, `https://test.simplefin.example/fake-token` |
| Unit test constants hold plaintext                            | Encryption is mocked at the unit level                                                                          |
| Integration seeds encrypt via `EncryptionUtility`             | Exercises the real encryption path                                                                              |
| No real card numbers or credentials ever appear in test files | Enforced by Security Reviewer checklist (D-73)                                                                  |

### 7.4 File Structure

Fixtures live in a `data/` folder — either the cross-cutting `test/shared/data/` (used by many modules or across the unit↔integration boundary) or a module-local `{test-type}/{module}/data/` (used only there). See §11 for the full tree and the `data/support/tests` contract.

```
test/shared/data/
├── factories.ts              ← Factory functions (buildCardInstance, buildTransaction, ...)
├── cards.ts                  ← AMEX_COBALT_FOCUS_CARD, TD_AEROPLAN_ACTIVE_CARD, ...
├── reference.ts              ← ISSUERS, EARNING_CATEGORIES, PURCHASE_TYPES, ...
├── budget.ts                 ← GROCERIES_ALLOCATION_CURRENT, NETFLIX_EXPENSE, ...
└── ingestion/                ← module-grouped fixtures shared across unit + integration
    ├── csv.ts                ← SCOTIA_CONFIG, CIBC_CSV, VALID_PARSE_REQUEST, ...
    └── simplefin.ts          ← CONNECTION_ACTIVE, RESPONSE_TWO_NEW, VALID_CLAIM, ...
```

---

## 8. Coverage Targets

**Decision D-79.**

### 8.1 Enforced Thresholds

| Scope                            | Line | Branch | Rationale                                                                         |
| -------------------------------- | ---- | ------ | --------------------------------------------------------------------------------- |
| **Validators**                   | 100% | 100%   | Pure functions, no dependencies. Every rule tested positive + negative.           |
| **Utilities**                    | 100% | 100%   | Small, critical, pure. Untested crypto is dangerous crypto.                       |
| **Services** (incl. ENH engines) | 90%  | 85%    | Core logic. 10% gap covers defensive catch blocks and hard-to-trigger edge paths. |
| **Overall project**              | 85%  | 80%    | Global safety net.                                                                |

### 8.2 Excluded from Coverage

| Excluded        | Why                                                                         |
| --------------- | --------------------------------------------------------------------------- |
| `*Facade.ts`    | Zero logic by design (ESLint-enforced). Wiring tested by integration tests. |
| `@cds-models/`  | Auto-generated by CAP                                                       |
| `gen/`          | Build output                                                                |
| `node_modules/` | Dependencies                                                                |

### 8.3 Enforcement

```typescript
// jest.config.ts — coverageThreshold
coverageThreshold: {
  global: {
    lines: 85,
    branches: 80,
  },
  './srv/modules/**/Validator.ts': {
    lines: 100,
    branches: 100,
  },
  './srv/util/**/*.ts': {
    lines: 100,
    branches: 100,
  },
}
```

Coverage report runs on every `npm test` execution. Not a separate step.

---

## 9. Frontend Testing

**Decision D-80.**

Frontend testing is included as a **learning exercise** — no enforced coverage thresholds. Enough scope to learn QUnit and OPA5 patterns for both Fiori Elements and freestyle SAPUI5 apps. Test files are authored in **TypeScript** (like all of `app/` since D-315) and transpiled by `ui5-tooling-transpile`.

### 9.1 QUnit — Controller Logic and Shared Resources

| Target                                 | What to Test                                              |
| -------------------------------------- | --------------------------------------------------------- |
| `app/shared/util/formatter.ts`         | Currency formatting, date formatting, status text mapping |
| `app/shared/BaseController.ts`         | Helper methods (model access, navigation)                 |
| `app/shared/controls/VizFrameCard.ts`  | Property binding, config generation                       |
| `app/shared/controls/ApexChartCard.ts` | Property binding, config generation                       |
| 1-2 freestyle controllers              | Event handlers that transform data before OData calls     |

### 9.2 OPA5 — Journey Tests

| App                                      | Journey                                             | Learning Goal                                                    |
| ---------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| `transactions` (FRM-001, Fiori Elements) | Open list → filter → navigate to object page → edit | OPA5 on Fiori Elements — the pattern used in enterprise projects |
| `csv-import` (FRM-003, Freestyle Wizard) | Upload → review tabs → approve → verify             | OPA5 on freestyle — different setup, more manual wiring          |

Two apps, not twenty-two. Enough to learn both patterns. Adding more is repetition.

### 9.3 File Structure

```
app/
├── shared/
│   └── test/
│       └── unit/
│           ├── formatter.test.ts
│           ├── BaseController.test.ts
│           ├── VizFrameCard.test.ts
│           └── ApexChartCard.test.ts
├── transactions/
│   └── webapp/
│       └── test/
│           ├── unit/
│           │   └── ListReportExt.test.ts
│           └── integration/
│               └── TransactionJourney.ts
└── csv-import/
    └── webapp/
        └── test/
            ├── unit/
            │   └── CsvImportController.test.ts
            └── integration/
                └── CsvImportJourney.ts
```

### 9.4 Coverage

No enforced thresholds. Frontend tests are a learning exercise, not a quality gate. Backend coverage targets (§8) remain the project's quality gatekeepers.

---

## 10. Per-Wave Test Expectations

Test scope grows with each wave. Earlier waves carry heavier test weight because they contain the foundational engines.

### Wave 1 — Core Pipeline (23 objects)

| Test Type       | Scope                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **Unit**        | All 7 Validators, all 7 Services, all ENH engines (ENH-001, 003, 006, 007, 008, 009), all Utilities |
| **Integration** | All 4 CDS services — CRUD + custom actions for Wave 1 entities                                      |
| **Scenarios**   | Weekly review (WFL-001), card onboarding (WFL-004), CSV import (FRM-003)                            |
| **Frontend**    | QUnit: shared resources. OPA5: transactions (FRM-001), csv-import (FRM-003).                        |

### Wave 2 — Churning Depth + Goals (8 objects)

| Test Type       | Scope                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **Unit**        | ENH-002 (recommendation), ENH-004 (eligibility), ENH-005 (profitability) — highest computation density |
| **Integration** | New endpoints for recommendations, eligibility, profitability, goals                                   |
| **Scenarios**   | Card recommendation flow, eligibility check                                                            |

### Wave 3 — Analytics + Financial Picture (9 objects)

| Test Type       | Scope                                                                      |
| --------------- | -------------------------------------------------------------------------- |
| **Unit**        | Minimal — Wave 3 objects are mostly report consumers with little new logic |
| **Integration** | New endpoints for financial picture, market cards                          |
| **Scenarios**   | Financial snapshot entry + net worth computation                           |

### Wave 4 — Market Intelligence (3 objects)

| Test Type       | Scope                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| **Unit**        | Web scraper parsing logic (INT-003), offer approval validation (WFL-003) |
| **Integration** | Scraper action endpoint, approval workflow                               |
| **Scenarios**   | Scrape → review → approve offer                                          |

---

## 11. Test File Structure

**The contract (`lint:test-structure`).** Every backend test file lives under `test/{unit|integration}/{module}/{data|support|tests}/`, plus one cross-cutting `test/shared/{data,support}/`:

| Role folder | Holds | Rule |
| --- | --- | --- |
| `data/` | Fixtures + factories — named constants (UPPER_SNAKE_CASE) and builder functions returning plain objects | Data lives here, nowhere else |
| `support/` | Mocks, service/harness wiring, `seedXxx`, HTTP stubs — **functions only** | An exported object/array fixture here is a lint violation → move to sibling `data/` |
| `tests/` | The `*.test.ts` specs (imports + arrange-act-assert) | A spec outside a `tests/`/`scenarios/` folder is a violation |

- **`{module}`** mirrors `srv/modules/`. The data-ingestion domain lives in `srv/modules/ingestion` (CSV, SimpleFIN, Scheduling, Dedup) and keeps that `ingestion` name in the test tree — renamed from `integration` so it never collides with the _integration_ test type.
- **`test/shared/{data,support}`** is for fixtures/builders shared across modules **or** across the unit↔integration boundary (e.g. `cards.ts`, `reference.ts`). A fixture used by only one module+test-type stays in that module's local `data/`.

Current layout:

```
test/
├── shared/                              ← cross-cutting fixtures + builders
│   ├── data/
│   │   ├── factories.ts
│   │   ├── cards.ts
│   │   ├── reference.ts
│   │   ├── budget.ts
│   │   └── ingestion/                   ← module-grouped, shared across test types
│   │       ├── csv.ts
│   │       └── simplefin.ts
│   └── support/
├── unit/
│   ├── ingestion/
│   │   ├── data/
│   │   │   └── transactions.ts          ← used only by unit dedup specs
│   │   ├── support/
│   │   │   ├── csvImportMocks.ts
│   │   │   ├── deduplicationMocks.ts
│   │   │   ├── schedulingMocks.ts
│   │   │   └── simplefinMocks.ts
│   │   └── tests/
│   │       ├── csvFieldParser.test.ts
│   │       ├── csvImportMapper.test.ts
│   │       ├── csvImportService.test.ts
│   │       ├── csvImportValidator.test.ts
│   │       ├── deduplicationService.test.ts
│   │       ├── deduplicationValidator.test.ts
│   │       ├── schedulingService.test.ts
│   │       ├── simpleFinService.test.ts
│   │       └── simpleFinValidator.test.ts
│   └── shared/
│       ├── data/
│       ├── support/
│       └── tests/                       ← utility specs
│           ├── currencyUtility.test.ts
│           ├── dateTimeUtility.test.ts
│           ├── encryptionUtility.test.ts
│           └── logger.test.ts
└── integration/
    ├── ingestion/
    │   ├── data/
    │   │   └── csvImport.ts             ← RBC_CARD_INSTANCE, CIBC_DUP_TRANSACTION
    │   ├── support/
    │   │   ├── csvImport.ts             ← buildCsvImportService, seedCsvImport
    │   │   └── simplefinSync.ts
    │   └── tests/
    │       ├── csvImport.test.ts
    │       └── simpleFinSync.test.ts
    ├── admin/
    │   ├── data/
    │   │   └── admin.ts
    │   ├── support/
    │   │   └── adminService.ts
    │   └── tests/
    │       └── adminService.test.ts
    └── scenarios/                        ← FUT multi-step specs
```

Frontend tests live within their respective `app/` folders (see §9.3).

---

## 12. Test Run Reports

### 12.1 Report Generation

Every `npm test` execution generates a markdown report in `project/test-reports/`. The report is produced by a post-test script (`generateTestReport.ts`) that reads Jest's JSON output and coverage summary. The script is shared across the Life OS monorepo and lives in `Standards (Technical + Linting)/scripts/` — `npm test` still runs from this project.

**npm scripts:**

```json
{
  "test": "jest --json --outputFile=coverage/test-results.json --coverage",
  "posttest": "tsx \"../Standards (Technical + Linting)/scripts/generateTestReport.ts\""
}
```

### 12.2 Report Contents

| Section                  | Contents                                                              |
| ------------------------ | --------------------------------------------------------------------- |
| **Header**               | Date and time of test run                                             |
| **Summary**              | Total tests run, passed, failed, skipped                              |
| **Failures**             | Each failed test: test name, suite, error message, expected vs actual |
| **Coverage — Overall**   | Line and branch coverage percentages for the whole codebase           |
| **Coverage — By Module** | Per-folder breakdown: Validators, Services, Utilities, Integration    |

### 12.3 Report Template

```markdown
# Test Report — 2026-03-01 14:32:05

## Summary

| Metric   | Count |
| -------- | ----- |
| Total    | 142   |
| Passed   | 140   |
| Failed   | 2     |
| Skipped  | 0     |
| Duration | 8.4s  |

## Failures

### TransactionValidator.test.ts > should reject zero amount

- **Error:** Expected req.error to have been called with 400, but received 422
- **Location:** test/unit/transaction/TransactionValidator.test.ts:47

### BudgetService.test.ts > should compute discretionary correctly

- **Error:** Expected 1250.00 but received 1200.00
- **Location:** test/unit/budget/BudgetService.test.ts:103

## Coverage — Overall

| Metric   | Value | Target |
| -------- | ----- | ------ |
| Lines    | 87.3% | 85%    |
| Branches | 82.1% | 80%    |

## Coverage — By Module

| Module      | Lines | Branch |
| ----------- | ----- | ------ |
| Validators  | 100%  | 100%   |
| Utilities   | 100%  | 100%   |
| Services    | 91.2% | 86.4%  |
| Integration | 78.5% | 74.2%  |
```

### 12.4 File Naming & Rolling Retention

| Rule      | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| File name | `tests_YYYY-MM-DD_HH-mm-ss.md`                                         |
| Location  | `project/test-reports/`                                                |
| Max files | 5                                                                      |
| Retention | Rolling delete — when a 6th report is generated, the oldest is deleted |

The `posttest` script handles retention: list files in `project/test-reports/`, sort by name (timestamp-based, so alphabetical = chronological), delete the oldest if count exceeds 5.

### 12.5 Folder Structure

```
project/
├── SPRINT_BOARD.md
├── DEFECT_LOG.md
├── sprints/
└── test-reports/                            ← Rolling test run reports (max 5)
    ├── tests_2026-03-01_14-32-05.md
    ├── tests_2026-03-02_09-15-22.md
    └── ...
```

---

## 13. Decisions Reference

Decisions made during test strategy definition (Step 10):

| ID    | Title                      | Summary                                                                                                                                                                       |
| ----- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-74  | Test Framework             | Jest + ts-jest for backend. CAP-aligned, built-in mocking.                                                                                                                    |
| D-75  | Test Boundaries            | Three-tier pyramid. External APIs always mocked. Unit tests never touch DB. Integration uses SQLite via `cds.test()`. Functional tests nested under `integration/scenarios/`. |
| D-76  | Unit Test Standards        | Validators fully tested (pure, no mocks). Services tested with CDS mocked, Validator real. Facades skipped. Private methods tested via bracket notation.                      |
| D-77  | Integration Test Standards | `cds.test()` + SQLite. One file per CDS service. Scenario tests for FUT workflows. Test data always imported with semantic names — never inline.                              |
| D-78  | Test Data Strategy         | Hybrid factories + named constants. Canonical test world for integration seeds. Obviously fake sensitive data.                                                                |
| D-79  | Coverage Targets           | Validators/Utilities: 100%/100%. Services: 90%/85%. Overall: 85%/80%. Facades excluded. Enforced via `jest.config.ts`.                                                        |
| D-80  | Frontend Testing           | QUnit for shared resources + select controllers. OPA5 journeys on FRM-001 (Fiori Elements) and FRM-003 (freestyle). Learning exercise, no enforced thresholds.                |
| D-230 | Test-Driven Development    | Red-Green-Refactor for Validators, Services, Utilities, ENH engines. Primary definition in [Technical Standards](TECHNICAL_STANDARDS.md) §13.                                 |

---

_This document is the single source of truth for the Financial Planner test strategy. All test personas reference these standards. Traces back to [Technical Standards](TECHNICAL_STANDARDS.md) (coding patterns), [Tech Stack](TECH_STACK.md) (project structure), [Business Architecture](BUSINESS_ARCHITECTURE.md) (FRICEW catalog), and [Decisions Log](user-profile/DECISIONS_LOG.md)._
