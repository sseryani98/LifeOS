# Test Strategy

**Document ID:** TS-003
**Version:** 1.1
**Date:** 2026-02-16
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                        |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-16 | Sandro & Claude | Initial creation — Step 10 complete. D-74 through D-80 logged.                                                                                                                                                                                                                     |
| 2026-02-16 | Sandro & Claude | Added §12 — Markdown test report generation (rolling 5 files).                                                                                                                                                                                                                     |
| 2026-02-20 | Sandro & Claude | Added TDD workflow reference in §2 Summary (D-230). Primary definition in TECHNICAL_STANDARDS.md §13.                                                                                                                                                                              |
| 2026-02-20 | Claude          | Status → Approved. Step 12 complete — all 21 specs approved.                                                                                                                                                                                                                       |
| 2026-07-15 | Sandro & Claude | Life OS restructure — §12.1 test report script now shared from Standards.                                                                                                                                                                                                          |
| 2026-08-26 | Sandro & Claude | §6.4 rewritten — `integration/scenarios/` becomes the Functional Test stage's evidence, mandatory for a story that ships no UI. Proven on Project Tracker (D-238).                                                                                                                 |
| 2026-11-04 | Sandro & Claude | Amendment — UI5 testing becomes a gate. D-80 reversed by D-321; D-322 to D-329 logged. §9 rewritten; §2, §3.2, §4.1, §4.2, §8.4, §10 Wave 1, §11, §12.6 and §13 updated. Gate mechanics provisional until Sprint 2 story 1 closes R1. Status Approved → Draft pending re-approval. |
| 2026-11-04 | Sandro          | **Status → Approved.** UI5-testing amendment approved by Sandro; gate mechanics stay provisional until Sprint 2 story 1 closes R1.                                                                                                                                                 |
| 2026-11-04 | Sandro & Claude | Sprint 2 story 1 executes the gate. R1 and R9 closed; D-331 … D-334 logged. §3, §8.4, §9, §11 and §12.6 now state measured mechanics, not provisional ones.                                                                                                                     |

---

## 2. Summary

| Area                     | Standard                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**            | Jest + ts-jest (backend). QUnit 2 + OPA5 via `ui5-test-runner` 5.14.2 (frontend, D-321). Playwright `@playwright/test` (E2E, D-329).                                                        |
| **Test pyramid**         | Unit → Integration → Functional (scenario). External APIs always mocked.                                                                                                                    |
| **Unit targets**         | Validators (100%), Services + ENH engines (90%), Utilities (100%). Facades skipped.                                                                                                         |
| **Integration**          | `cds.test()` + SQLite. One test file per CDS service. Scenarios under `integration/scenarios/`.                                                                                             |
| **Test data**            | Hybrid factories + named constants. Canonical test world for integration. Semantic naming.                                                                                                  |
| **Coverage**             | Jest: Validators/Utilities 100%/100%, Services 90%/85%, Overall 85%/80%. UI5, a separate gate (D-327): `app/shared/util/**` 100%/100%, overall `app/**` 85%/80%.                            |
| **Frontend**             | A gate on every app (D-321). QUnit on every logic class; at least one OPA5 contract journey per FE app (D-325); journeys launch through the shell (D-324). Gate mechanics executed (D-331). |
| **Development workflow** | Test-driven development (D-230). Primary definition in [Technical Standards](TECHNICAL_STANDARDS.md) §13.                                                                                   |

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

**Decision D-321.** Versions measured 2026-11-04.

| Tool                              | Version                                 | Purpose                                                                                                                                                                   |
| --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **QUnit 2** (Test Starter)        | SAPUI5 runtime, 1.136.16                | UI5 unit tier — `*.qunit.ts`                                                                                                                                              |
| **OPA5** + `sap.fe.test`          | SAPUI5 runtime, 1.136.16                | UI5 journey tier — `sap.fe.test` for ListReport/ObjectPage; plain OPA5 page objects for FPM, freestyle and the shell                                                      |
| **`ui5-test-runner`** (community) | **5.14.2**, pinned, root                | Headless runner for both UI5 tiers, remote mode. v6 needs Node ≥ 24.11.1; the repo runs Node v22.19.0. 5.14.2 runs on it (D-331)                                         |
| **`ui5-tooling-transpile`**       | **3.14.0**, pinned (D-332)              | Its `coverage` option (`babel-plugin-istanbul` 6.1.1, already present via Jest) instruments the TypeScript sources. ≤3.13.1 instruments nothing under `cds-plugin-ui5`   |
| **`nyc`**                         | **18.0.0**, pinned, root                | Merges the UI5 coverage and checks the thresholds (§8.4)                                                                                                                  |
| **`playwright`**                  | **1.56.1**, pinned, root                | The browser `ui5-test-runner` drives (`$/playwright.js`). Matches the cached Chromium build 1194, so nothing downloads                                                   |
| **`@playwright/test`**            | Held                                    | E2E tier (D-329); installed with the first E2E spec                                                                                                                       |

**Runner invocation** is `npm run test:ui5`. `runUi5Gate.ts` calls the runner with `--no-npm-install` (R6) and the absolute scanner path; everything else, including the R5 output folders, is in `ui5-test-runner.json` (D-331). UI5 CLI is 4.0.59.

**Rejected:** Karma (`karma-ui5` archived 2025-12-12); `@ui5/middleware-code-coverage` (its TypeScript-capable line needs UI5 CLI v5 and UI5 ≥ 1.136.25); wdi5 (D-329).

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

### 4.1 Tiers

| Level           | Scope                                                    | Database?                     | Network?                                    | What It Validates                                                                     |
| --------------- | -------------------------------------------------------- | ----------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Unit**        | Single class/method in isolation                         | No — mocked                   | No — mocked                                 | Logic correctness. One layer at a time.                                               |
| **Integration** | OData endpoint through the full CAP stack                | Yes — SQLite via `cds.test()` | No — external APIs mocked                   | Request → CDS → Handler → DB → Response. Layers wire together correctly.              |
| **Functional**  | Multi-step user scenario                                 | Yes — SQLite via `cds.test()` | No — external APIs mocked                   | FUT scenarios from functional specs. Sequence of OData calls simulating a workflow.   |
| **UI5 unit**    | One UI5 logic class, headless browser                    | No                            | No — OData mocked or absent                 | Frontend logic correctness (D-321). Scope and ceiling: §9.1.                          |
| **UI5 journey** | One app through OPA5 against `cds-serve` `[development,journey]` | Yes — SQLite `:memory:`       | Local `cds-serve` only                      | An app's annotation contract and SQLite-observable browser FUTs (D-325, D-328). §9.1. |
| **E2E**         | Browser flow across real servers, at the sprint boundary | Yes — Postgres                | Module CAP processes + `serveOneOrigin.mjs` | Postgres-dependent and cross-module browser FUTs (D-329). §9.1.                       |

### 4.2 Boundary Rules

| Rule                                                                           | Rationale                                                                                                                                |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| External APIs are always mocked (SimpleFIN, cheerio, node-cron)                | Deterministic, fast, no network dependency                                                                                               |
| Unit tests never touch the database                                            | CDS queries mocked. Pure logic testing.                                                                                                  |
| Integration tests use SQLite, not PostgreSQL                                   | `cds.test()` makes SQLite zero-config. Pragmatic trade-off for a solo project — PostgreSQL-specific edge cases caught in manual testing. |
| Functional tests are integration tests with storylines                         | Same `cds.test()` + SQLite infrastructure. Organized by user journey, not by endpoint.                                                   |
| Functional tests nest under `test/integration/scenarios/`                      | Not a separate top-level folder — same test infrastructure, different organization.                                                      |
| A story that ships **no UI** discharges Functional Test here                   | The browser instrument does not apply, but the FUTs stay executable at that story's outermost surface. See §6.4.                         |
| UI5 unit tests never boot `cds-serve` or render a whole app                    | One logic class at a time; the journey tier owns rendering.                                                                              |
| No UI5 tier asserts FE or UI5 generic behaviour                                | Sorting, paging, draft machinery and variant management are the framework (D-325).                                                       |
| UI5 journeys never assert a Postgres mechanism or cross-module routing         | They run on in-memory SQLite inside one module; those FUTs go to E2E (D-328).                                                            |
| E2E never runs per story, never gates `npm test`, never counts toward coverage | It needs real Postgres, both CAP processes and the proxy (D-329).                                                                        |

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

### 6.4 Scenario Tests — and the Functional Test stage's evidence

Nested under `test/integration/scenarios/`. Two things live here, and only the second is mandatory.

**(a) Storyline scenarios.** Chains of OData calls simulating a user journey, organised by journey
rather than by endpoint:

| Scenario                  | Steps                                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Weekly review (WFL-001)   | Trigger sync → GET new transactions → PATCH categorizations → verify dashboard data      |
| Card onboarding (WFL-004) | POST card instance → POST provider account → trigger sync → verify bonus tracking starts |
| CSV import (FRM-003)      | POST CSV upload action → GET review buckets → PATCH approvals → verify counts            |
| Card lifecycle (WFL-002)  | Create Focus card → meet bonus → verify auto-transition → manually cancel → close        |

**(b) The Functional Test stage's evidence, for a story that ships no UI. Mandatory.** Methodology
stage 4 drives a story's FUTs through the running app in a real browser. A story with **no UI** has
no browser surface — but "no browser" is not "cannot be executed", and closing the stage on a
traceability matrix instead records an argument where an output belongs. **Such a story discharges
stage 4 by executing every one of its FUTs here**, at whatever its outermost caller-facing surface
actually is — an MCP tool call, a service action, a CLI entry point.

| Rule                                                               | Why                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **One spec per FUT**, not one per journey                          | The stage asks _does each named unit pass_, which a merged storyline cannot answer per unit            |
| **The spec title carries the FUT identifier**                      | A run of the tier then answers traceability in its own output, with no separate matrix to keep true    |
| **The identifiers live in the sibling `data/` folder**             | `lint:tracking-ids` bans a design identifier anywhere under `test/` outside `data/`; specs interpolate |
| **Drive the real surface, not an internal function**               | A FUT verified below the boundary it is written against is not that FUT                                |
| **The FUT's own Preconditions/Steps/Expected Result are the spec** | The spec is the contract; a scenario that improves on it has stopped testing the FUT                   |

**This tier deliberately re-asserts what the unit and integration tiers already cover**, which is a
real exception to the rule that a FUT is written at the outermost tier that can observe it, **once**.
That rule assumed a browser tier existed to be the outermost one. The tier suites own regression;
this tier owns the stage. When a UI story reaches stage 4 and the browser _does_ apply, this tier may
have nothing to add — re-read the rule then rather than duplicating by reflex.

**Proven on one module, not two.** Project Tracker's `INT-001` is the first story to run it (D-238):
sixteen FUTs, sixteen specs, driven through a real MCP client, all passing. Treat the shape as
settled and the vocabulary as provisional until a second module runs it.

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

### 8.4 UI5 Thresholds

**Decision D-327.** A separate gate from Jest's — the two are never merged into one number. The Jest thresholds above are unchanged, and Jest still never loads `app/**` (`roots: ['<rootDir>/test']`, measured).

| Scope                   | Folder                                         | Line | Branch | Rationale               |
| ----------------------- | ---------------------------------------------- | ---- | ------ | ----------------------- |
| **Shared pure helpers** | `app/shared/util/**`, including `formatter.ts` | 100% | 100%   | Mirrors Utilities       |
| **Overall UI5**         | `app/**`                                       | 85%  | 80%    | Mirrors Overall project |

| Excluded from UI5 coverage                                            | Why                                                                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Thin `ext/` SAP handler modules (e.g. `TransactionsListActions.ts`)   | Wiring; the journey tier proves them, as integration proves Facades |
| Lifecycle `ControllerExtension`s (e.g. `ObjectPageExt.controller.ts`) | Wiring once they delegate (D-323); proven by journeys               |
| `*.gen.d.ts`                                                          | Generated declarations                                              |

**Enforced (D-331, D-333).** The overall row is `coverageCheckLines`/`coverageCheckBranches` in `ui5-test-runner.json`. The `app/shared/util/**` row is the `--row` argument of the `test:ui5` script, which `runUi5Gate.ts` checks with `nyc check-coverage --include`. The exclusions are the transpile `coverage.exclude` list in each app's `ui5-test.yaml`. Both rows are on at these numbers from day one, so the leg stays red until the backfill lands (D-333).

---

## 9. Frontend Testing

**Decisions D-321 through D-329.** Supersedes D-80, which framed frontend tests as a learning exercise on two apps with no thresholds. None was ever written: no `webapp/test/` exists anywhere under `app/` (measured 2026-11-04).

UI5 testing is a **gate, not a learning exercise** (D-321). Every app under `app/` is tested and the thresholds in §8.4 are enforced. Test files are TypeScript, like all of `app/` (D-315). Evidence: the research pack at `Standards (Documents)/research/` (`README.md`, verdict **GO WITH CAVEATS**).

> **Executed (D-331, Sprint 2 story 1).** The gate chain ran three times on this machine: `ui5-test-runner` 5.14.2 in remote mode against a runner-spawned `cds-serve` (in-memory SQLite, port 4104), coverage from `ui5-tooling-transpile` 3.14.0 (D-332), and a deliberately failing threshold failing the leg. The leg is `npm run test:ui5`, chained after Jest as `posttest`. Its output goes to `report-ui5/` and `coverage-ui5/`, leaving Jest's `coverage/` untouched.

**The silent pass.** If `ui5-tooling-transpile`'s `coverage` option is not switched on for the test run, or a served tree is not instrumented, the QUnit and OPA5 suites **still pass** while reporting zero or partial coverage. Nothing in the suite itself fails. Story 1 met it three ways:

- At transpile 3.12.0 the option instrumented nothing under `cds-plugin-ui5`, with no warning (D-332).
- The `CDS_PLUGIN_UI5_MODULES` key that selects `ui5-test.yaml` is the app **folder name**; the package name is ignored without an error.
- The runner's default scanner never finds a file no test loads (`[COVALL]`), so the denominator shrank to the tested files.

The levers are each app's `ui5-test.yaml` and `scanUi5Coverage.cjs`. The threshold check catches the failure: a 100% lines threshold failed the leg with exit 1. A UI5 leg reporting green while a source file is missing from its coverage table is the symptom to look for.

UI5 tests are written by a dedicated `ui5-test-author` agent, selected by the build brief's `layers` vocabulary; `test-author` stays CAP-only.

### 9.1 Tiers

| Tier                   | Runner                                                                                                 | Boots                                                                  | DB                            | May assert                                                                                                                                                                              | May not                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **UI5 unit**           | QUnit 2 via `ui5-test-runner` 5.14.2                                                                   | UI5 in a headless browser, no backend                                  | None — OData mocked or absent | One logic class at a time: formatters, `shared/util`, custom controls, `model/{App}Service.ts` intent methods against a stubbed model, freestyle controller logic, `ext/` logic classes | Boot `cds-serve`; assert FE or UI5 framework behaviour; render a whole app             |
| **UI5 journey**        | OPA5 via the same runner — `sap.fe.test` for ListReport/ObjectPage, plain OPA5 for FPM/freestyle/shell | `cds-serve` in the `[development,journey]` profile, seeded from `db/data`, `db/seed` and `test/journey/data` | SQLite `:memory:`             | An app's annotation contract and extensions as rendered; browser FUTs observable on SQLite; freestyle flows                                                                             | FE generic behaviour; anything whose mechanism is Postgres; cross-module routing       |
| **E2E**                | Playwright (`@playwright/test`)                                                                        | Postgres + the module CAP processes + `serveOneOrigin.mjs`             | Postgres                      | Postgres-dependent and cross-module browser FUTs; shell → module routing                                                                                                                | Run per story; count toward coverage; gate `npm test`                                  |
| **`/functional-test`** | Playwright MCP — a methodology stage, not a tier in `npm test`                                         | Real servers                                                           | Throwaway Postgres            | The story's FUTs, plus exploratory probing                                                                                                                                              | Be the only regression net — it runs only the current story's FUTs and commits nothing |

### 9.2 What Each Surface Owes

| Surface                      | Apps (measured)                                                                                                       | UI5 unit (QUnit)                                                                                  | UI5 journey (OPA5)                                                                                       | Excluded from UI5 coverage                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FE ListReport/ObjectPage** | `admin-master-data` (one `ControllerExtension`), `transactions` (two `ControllerExtension`s in `ext/controller/`; `ext/` logic class + handler modules) | Every logic class — e.g. `ext/TransactionActions.ts` — and `model/{App}Service.ts` intent methods | At least one **contract journey** per app via `sap.fe.test` (D-325)                                      | The thin `ext/` handler module (`TransactionsListActions.ts`); the `ControllerExtension` (`ObjectPageExt.controller.ts`) once it delegates (D-323) |
| **FE FPM custom page**       | `connection-manager` (`sap.fe.core.fpm`, `controller/ConnectionManager.controller.ts`)                                | Every logic class — e.g. `model/ConnectionService.ts`                                             | At least one contract journey, with **plain OPA5 page objects** — `sap.fe.test` has none for FPM (D-322) | None                                                                                                                                               |
| **Freestyle**                | `csv-import-wizard` (`controller/CsvImportWizard.controller.ts`)                                                      | Controller logic and every `model/` class                                                         | Freestyle flows, plain OPA5 page objects                                                                 | None                                                                                                                                               |
| **Shell**                    | `shell` (`sap.tnt.ToolPage`, `controller/App.controller.ts`; **no `webapp/` folder**)                                 | Controller logic                                                                                  | Hosts every journey's start: a custom Shell page object at the shell route (D-324)                       | None                                                                                                                                               |
| **Shared library**           | `shared/` (14 `.ts` files, two of them `*.gen.d.ts`; namespace `com.financialplanner.shared`, served at `/shared`)    | `util/**` including `formatter.ts`, custom controls, base classes                                 | None of its own — it hosts the shared page objects                                                       | `*.gen.d.ts`                                                                                                                                       |

**The contract journey (D-325).** It asserts that the app's columns, filters, actions and extensions render **as declared** — the annotation contract, the UI5 analogue of asserting `@assert.range`. It never asserts FE's generic behaviour: sorting, paging, draft machinery, variant management. That is the framework, and testing it stays forbidden.

**Lifecycle extensions delegate (D-323).** A `ControllerExtension` hook delegates to a plain logic class, the twin of the custom-action rule (`TransactionsListActions` → `TransactionActions`). The extension becomes wiring like a Facade: excluded from UI5 coverage, proven by the journey tier. The logic class is QUnit-tested. The rule lives in `CODING_STANDARDS.md` §SAPUI5, enforced by `lint:frontend-controller-shape`.

### 9.3 Journey Launch

Every Financial Planner journey starts at the **shell route** through a custom Shell page object, in place of `sap.fe.test.Shell`, which assumes the Fiori launchpad (D-324). No journey starts a component directly.

### 9.4 File Structure

Per app, in QUnit Test Starter layout (D-326). `testsuite.qunit.ts` at the tree's root, specs (`*.qunit.ts`) under `unit/` or `integration/`, page objects in `integration/pages/`, fixtures in `test/data/`, builders in `test/support/` (D-334). Data never lives in `support/`. Page objects shared across apps — the Shell page object and the FPM base page object — live in `app/shared/test/`. The shell and the shared library have no `webapp/` folder, so their trees sit directly under the app folder. A suite outside `webapp/` is not served under the app's namespace, which is why there is no module-level suite.

```
app/
├── admin-master-data/webapp/test/
│   ├── unit/
│   ├── integration/
│   │   └── pages/
│   └── data/
├── connection-manager/webapp/test/
│   ├── unit/
│   ├── integration/
│   │   └── pages/                ← extend the FPM base page object
│   └── data/
├── transactions/webapp/test/
│   ├── unit/                     ← TransactionActions, TransactionsService, VirtualStateCarrier
│   ├── integration/
│   │   └── pages/
│   └── data/
├── csv-import-wizard/webapp/test/
│   ├── unit/
│   ├── integration/
│   │   └── pages/
│   └── data/
├── shell/test/                   ← no webapp/ folder
│   ├── unit/
│   ├── integration/
│   │   └── pages/
│   └── data/
└── shared/test/                  ← no webapp/ folder
    ├── unit/                     ← util/**, controls, base classes
    └── (shared page objects)     ← FP Shell page object, FPM base page object
```

The gate passes **one `url` per app testsuite** in `ui5-test-runner.json`. Today that is five: `shared`, `shell`, `transactions`, `connection-manager`, `csv-import-wizard` (2026-11-04 backfill); `admin-master-data` has no logic class yet. A new app suite adds its `testsuite.qunit.html` to that list.

### 9.5 Coverage

UI5 coverage is a **separate gate** from Jest's, never merged into one number (D-327). Thresholds and exclusions: §8.4. Each surface in §9.2 counts toward the overall `app/**` row; `app/shared/util/**` carries the 100/100 row as well, which makes `/shared/` instrumentation (R9) load-bearing.

### 9.6 Browser FUTs

| A browser FUT whose observation…                                                          | Lands in                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| does **not** depend on Postgres                                                           | An OPA5 journey in `npm test` — the per-story regression net. Titled **without** the FUT ID: `lint:tracking-ids` scans `app/` |
| depends on Postgres, or crosses modules (shell → module routing via `serveOneOrigin.mjs`) | The E2E tier (§9.7)                                                                                                           |
| any of the above, for the story being built                                               | Also `/functional-test`, which runs every FUT of that story and keeps its exploratory probing                                 |

`/functional-test` alone was a regression gap: it runs only the current story's FUTs and commits nothing, so the Postgres-only and cross-module behaviour of already-shipped stories had no net (D-328).

**Counts: none measured for this amendment.** Its record scoped the FUT question to routing browser FUTs to a tier; no per-spec count of browser FUTs was taken.

### 9.7 E2E Tier

| Rule     | Ruling (D-329)                                                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What     | Committed Playwright specs (`@playwright/test`)                                                                                                                                               |
| When     | At each sprint boundary (the checkpoint) — never in every `npm test` or build gate, because they need real Postgres, both CAP processes and the proxy                                         |
| Where    | `test/e2e/{area}/{data,support,tests}/` (§11)                                                                                                                                                 |
| Suffix   | `*.e2e.ts`, so Jest's `**/*.test.ts` never collects them. `lint:test-structure` enforces it under `test/e2e/<area>/tests/` (D-334)                                                              |
| Coverage | Not counted                                                                                                                                                                                   |
| Install  | Story 1 installed `ui5-test-runner` 5.14.2, `nyc` 18.0.0 and `playwright` 1.56.1 at the root. `@playwright/test` is **held** until the first E2E spec exists                                    |
| Rejected | wdi5 — UI5 selectors and `sap.fe.test` reuse, bought with 460 packages / 121 MB and a second runner                                                                                           |

### 9.8 Test Data

The shared Test Rules carry over: no inline payloads, named constants in the app's `test/data/` folder, a one-line `/** why */` JSDoc on every test. `lint:test-data` enforces them on every `*.qunit.ts` (`QUnit.test` and `opaTest`) and `*.e2e.ts`, and `lint:test-structure` enforces the layout (D-334).

### 9.9 Enforcement

| Rule                                                     | Enforced by                                                                                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ControllerExtension` hooks delegate to a logic class    | `lint:frontend-controller-shape`, extended for D-323 by the host in this amendment's session                                                                                                             |
| No FUT ID in a journey title                             | `lint:tracking-ids` (scans `app/`)                                                                                                                                                                       |
| UI5 test data and layout (`app/**/test/**`)              | `lint:test-data`, `lint:test-structure` (D-334)                                                                                                                                                          |
| ESLint on `app/**/test/**`                               | ESLint — the `app/**/test/**` block takes the backend `test/**` exemptions: class-only off, keyword ban kept                                                                                             |
| `test/e2e/` tree                                         | `lint:test-structure` — `*.e2e.ts` under `test/e2e/<area>/tests/` only                                                                                                                                   |
| UI5 thresholds (§8.4)                                    | `npm run test:ui5` (D-331): the runner's global check, then `runUi5Gate.ts` per-folder rows                                                                                                              |
| `ui5-test.yaml` stays `ui5.yaml` + the coverage block    | **Nothing.** A drifted copy serves the test run differently from the app                                                                                                                                 |
| One contract journey per FE app; the browser-FUT routing | **Nothing**                                                                                                                                                                                              |
| The transpile `coverage` lever                           | **Nothing** but the threshold check on the UI5 report — the silent pass above                                                                                                                            |

### 9.10 Amendments

The host applies these in-session; this document lists them.

| Target                                                  | Change                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Standards (Documents)/CODING_STANDARDS.md` §Test Rules | Framework line, and a UI5 tier bullet set (D-321, D-323, D-325, D-327, D-328, D-329)                                                                                                                                                                                                                                                                    |
| `Standards (Documents)/CODING_STANDARDS.md` §SAPUI5     | The extension-delegation rule, naming `lint:frontend-controller-shape` (D-323)                                                                                                                                                                                                                                                                          |
| `lint:frontend-controller-shape`                        | Extended for D-323                                                                                                                                                                                                                                                                                                                                      |
| Research pack (`playwright-in-repo.md`, `README.md`)    | "Playwright already installed" refuted                                                                                                                                                                                                                                                                                                                  |
| Project Tracker `TEST_STRATEGY.md` §13.2, §17           | `app/**` exclusion reason changes (Jest still excludes; the UI5 gate covers it); the owed items join the inventory as enforced by nothing                                                                                                                                                                                                               |
| **Applied by Sprint 2 story 1** (D-331 … D-334)        | ESLint `app/**/test/**` block; `lint:test-structure` accepts `test/e2e/` and every app test tree; `lint:test-data` reaches `*.qunit.ts` and `*.e2e.ts`; `build.js` gains a `ui5-test-author` red and UI5 coverage routing, keyed on `hasUi5Leg`; the stale `build.md` sentence and `build.js` comment are rewritten |
| **Still owed**                                          | `build.js`'s post-implementation journey leg (D-330); `@playwright/test`, with the first E2E spec                                                                                                                                                                                                                                                       |

### 9.11 Risks

Register: `Standards (Documents)/research/README.md` §Open risks.

| Risk                                          | Outcome                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** Gate chain unexecuted                  | **Closed** (D-331). Three runs green, a deliberate threshold failure red, a mutated rule red                                                                                                                                                                                                                                                                                                                                                                          |
| **R2** `sap.fe.test.Shell` assumes FLP        | **Resolved by ruling** (D-324: custom Shell page object); **executed** by story 1's first journey through the shell route                                                                                                                                                                                                                                                                                                                                             |
| **R3** No `sap.fe.test` page object for FPM   | **Resolved by ruling** (D-322: plain OPA5). Hits this module's `connection-manager`, not only Project Tracker                                                                                                                                                                                                                                                                                                                                                         |
| **R4** `ControllerExtension` unit-testability | **Resolved by ruling** (D-323: delegation standard + lint); no fake-`base` spike needed                                                                                                                                                                                                                                                                                                                                                                               |
| **R5** Coverage directory collision           | **Executed**: `coverageReportDir: coverage-ui5`, `reportDir: report-ui5` and `coverageTempDir: .nyc_output-ui5` in `ui5-test-runner.json`; Jest's `coverage/` measured untouched                                                                                                                                                                                                                                                                                      |
| **R6** Runner installs drivers at runtime     | Settled: the runner always carries `--no-npm-install`                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **R7** Single-maintainer runner               | Pinned 5.14.2; revisit when Node moves to 24. Owner: whoever raises the Node pin                                                                                                                                                                                                                                                                                                                                                                                      |
| **R8** Merged UI5 + Jest threshold            | **Avoided by ruling** (D-327: separate gate)                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **R9** `/shared/` instrumentation             | **Closed** (D-332). Instrumented once transpile is at 3.14.0, keyed by real `.ts` paths; the 100/100 row is measured (3.03% / 17.85% today)                                                                                                                                                                                                                                                                                                                          |

---

## 10. Per-Wave Test Expectations

Test scope grows with each wave. Earlier waves carry heavier test weight because they contain the foundational engines.

### Wave 1 — Core Pipeline (23 objects)

| Test Type       | Scope                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Unit**        | All 7 Validators, all 7 Services, all ENH engines (ENH-001, 003, 006, 007, 008, 009), all Utilities         |
| **Integration** | All 4 CDS services — CRUD + custom actions for Wave 1 entities                                              |
| **Scenarios**   | Weekly review (WFL-001), card onboarding (WFL-004), CSV import (FRM-003)                                    |
| **Frontend**    | ~~QUnit: shared resources. OPA5: transactions (FRM-001), csv-import (FRM-003).~~ Every app, per §9 (D-321). |

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

| Role folder | Holds                                                                                                   | Rule                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `data/`     | Fixtures + factories — named constants (UPPER_SNAKE_CASE) and builder functions returning plain objects | Data lives here, nowhere else                                                       |
| `support/`  | Mocks, service/harness wiring, `seedXxx`, HTTP stubs — **functions only**                               | An exported object/array fixture here is a lint violation → move to sibling `data/` |
| `tests/`    | The `*.test.ts` specs (imports + arrange-act-assert)                                                    | A spec outside a `tests/`/`scenarios/` folder is a violation                        |

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

Frontend tests live within their respective `app/` folders (see §9.4).

**E2E tree (D-329).** `test/e2e/<area>/{data,support,tests}/`, enforced by `lint:test-structure` (D-334). Specs carry the `*.e2e.ts` suffix so Jest never collects them.

```
test/
└── e2e/
    └── {area}/
        ├── data/
        ├── support/
        └── tests/                       ← *.e2e.ts
```

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

### 12.6 UI5 and E2E Runs

Measured in Sprint 2 story 1 (D-331).

| Run          | Recorded how                                                                                                                                                                                                                                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI5 gate** | Not in the rolling test report. 5.14.2 writes `report-ui5/report.html`, `job.js` and per-page folders, not the v6 `report.json`, so `gate-runner` reads the leg's console output: the result box and nyc's threshold lines. The leg runs in `posttest` **after** the Jest report is written, and a failing Jest run skips it, so the build gate runs `test:ui5` itself when Jest fails |
| **E2E**      | At the sprint checkpoint, recorded the way a checkpoint run is already recorded here — a test report per §12.1–§12.4                                                                                                                                                                                                                               |

---

## 13. Decisions Reference

Decisions made during test strategy definition (Step 10) and the 2026-11-04 frontend amendment:

| ID    | Title                                        | Summary                                                                                                                                                                                     |
| ----- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-74  | Test Framework                               | Jest + ts-jest for backend. CAP-aligned, built-in mocking.                                                                                                                                  |
| D-75  | Test Boundaries                              | Three-tier pyramid. External APIs always mocked. Unit tests never touch DB. Integration uses SQLite via `cds.test()`. Functional tests nested under `integration/scenarios/`.               |
| D-76  | Unit Test Standards                          | Validators fully tested (pure, no mocks). Services tested with CDS mocked, Validator real. Facades skipped. Private methods tested via bracket notation.                                    |
| D-77  | Integration Test Standards                   | `cds.test()` + SQLite. One file per CDS service. Scenario tests for FUT workflows. Test data always imported with semantic names — never inline.                                            |
| D-78  | Test Data Strategy                           | Hybrid factories + named constants. Canonical test world for integration seeds. Obviously fake sensitive data.                                                                              |
| D-79  | Coverage Targets                             | Validators/Utilities: 100%/100%. Services: 90%/85%. Overall: 85%/80%. Facades excluded. Enforced via `jest.config.ts`.                                                                      |
| D-80  | Frontend Testing                             | ~~QUnit for shared resources + select controllers. OPA5 journeys on FRM-001 (Fiori Elements) and FRM-003 (freestyle). Learning exercise, no enforced thresholds.~~ **Superseded by D-321.** |
| D-230 | Test-Driven Development                      | Red-Green-Refactor for Validators, Services, Utilities, ENH engines. Primary definition in [Technical Standards](TECHNICAL_STANDARDS.md) §13.                                               |
| D-321 | Frontend Testing Is a Gate                   | Reverses D-80. Every app tested, thresholds enforced. QUnit 2 + OPA5 via `ui5-test-runner` 5.14.2; journeys on `cds-serve` `[development]`. Gate mechanics executed in D-331.               |
| D-322 | FPM Pages Use Plain OPA5 Page Objects        | `connection-manager` (and Project Tracker's page) get hand-written OPA5 page objects, same runner and coverage. Playwright for FPM rejected.                                                |
| D-323 | Extensions Delegate to a Logic Class         | A `ControllerExtension` hook delegates to a plain logic class; the extension is wiring, excluded from UI5 coverage. `lint:frontend-controller-shape`.                                       |
| D-324 | Journeys Launch Through the Shell            | Every Financial Planner journey starts at the shell route via a custom Shell page object, in place of `sap.fe.test.Shell`.                                                                  |
| D-325 | What a Fiori Elements App Owes               | QUnit on every logic class, plus at least one OPA5 contract journey per FE app. FE generic behaviour stays untested.                                                                        |
| D-326 | UI5 Test Layout Per App                      | `app/<app>/webapp/test/{unit,integration}/`, page objects in `integration/pages/`, data in `test/data/`; shared page objects in `app/shared/test/`; shell at `app/shell/test/`.             |
| D-327 | UI5 Coverage Is a Separate Gate              | `app/shared/util/**` 100%/100%; overall `app/**` 85%/80%; thin ext handlers, `ControllerExtension`s, `*.gen.d.ts` excluded. No merge with Jest.                                             |
| D-328 | Browser FUT Routing                          | SQLite-observable browser FUTs also get an OPA5 journey in `npm test`; Postgres-dependent or cross-module ones go to E2E. `/functional-test` unchanged.                                     |
| D-329 | E2E Tier — Playwright at the Sprint Boundary | Committed `@playwright/test` specs in `test/e2e/{area}/{data,support,tests}/`, `*.e2e.ts`, run at each checkpoint, not counted in coverage. wdi5 rejected.                                  |
| D-331 | UI5 Gate Mechanics, as Executed              | Runner-spawned `cds-serve` + per-app `ui5-test.yaml`; global thresholds in `ui5-test-runner.json`, rows via `runUi5Gate.ts --row`; `scanUi5Coverage.cjs` counts unloaded files. Closes R1. |
| D-332 | `ui5-tooling-transpile` Pinned to 3.14.0     | ≤3.13.1 instruments nothing under `cds-plugin-ui5` (virtual paths). Closes R9.                                                                                                              |
| D-333 | UI5 Thresholds at the Ruled Numbers Now      | D-327's numbers enforced from day one; FP `npm test` red until the backfill lands.                                                                                                          |
| D-334 | UI5 Layout Adds `support/`; QUnit Types      | `support/` beside `data/`; per-file `/// <reference types="qunit" />`; QUnit 2.3.2 API only.                                                                                                |

---

_This document is the single source of truth for the Financial Planner test strategy. All test personas reference these standards. Traces back to [Technical Standards](TECHNICAL_STANDARDS.md) (coding patterns), [Tech Stack](TECH_STACK.md) (project structure), [Business Architecture](BUSINESS_ARCHITECTURE.md) (FRICEW catalog), [Decisions Log](user-profile/DECISIONS_LOG.md), and the UI5 testing research pack (`Standards (Documents)/research/README.md`)._
