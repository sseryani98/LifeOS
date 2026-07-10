# Technical Standards

**Document ID:** TS-002
**Version:** 1.0
**Date:** 2026-02-16
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                   |
| ---------- | --------------- | ----------------------------------------------------------------------------- |
| 2026-02-16 | Sandro & Claude | Initial creation — Step 9 complete. D-63 through D-73 logged. OI-07 resolved. |
| 2026-02-20 | Sandro & Claude | Added §13 — Test-Driven Development workflow (D-230).                         |
| 2026-02-20 | Claude          | Status → Approved. Step 12 complete — all 21 specs approved.                  |

---

## 2. Summary

This document formalizes coding conventions and patterns so all build personas follow consistent rules from Sprint 1. Turns the high-level Enbridge conventions ([TECH_STACK.md](TECH_STACK.md) §7) into enforceable standards.

| Area                     | Key Standard                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| **CDS**                  | PascalCase entities, camelCase fields, CAP auto-generated FKs, modular schema files by domain       |
| **TypeScript**           | `strict: true`, all sub-flags, `ES2022` target, `Node16` module                                     |
| **Handler pattern**      | Facade → Service → Validator, always 3 files, `wrapHandler` on every handler                        |
| **Error handling**       | `req.error()` for validation (accumulate), `req.reject()` for fatal. Always i18n keys.              |
| **Logging**              | Structured JSON, dual output (console + file), dedicated `error.log`, correlation IDs               |
| **i18n**                 | Three tiers: CDS labels (PascalCase), runtime messages (camelCase.dots), UI5 (camelCase)            |
| **Encryption**           | AES-256-GCM, env var key, per-field IV, `EncryptionUtility.ts`                                      |
| **ESLint**               | Enbridge-adapted, custom architectural rules; UI5 shares the backend tsRules                        |
| **SAPUI5**               | XML views, BaseController, entity-based annotations, `{ViewType}Ext` extensions, ES modules (TS)    |
| **Code review**          | Per-persona checklists for sprint checkpoint meetings                                               |
| **Development workflow** | Test-driven development — Red-Green-Refactor for all Validators, Services, Utilities                |

---

## 3. CDS Conventions

**Decision D-63.**

### 3.1 Naming

| Convention               | Standard                          | Example                                                                  |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------ |
| Namespace                | `com.financialplanner`            | `namespace com.financialplanner;`                                        |
| Entity names             | PascalCase, singular              | `Transaction`, `CardInstance`, `EarningMultiplier`                       |
| Field names              | camelCase                         | `lifecycleState`, `activationDate`                                       |
| Foreign key fields       | CAP auto-generated                | `cardInstance_ID` (underscore + capital `ID`)                            |
| Association names        | camelCase, no suffix              | `cardInstance`, `issuer`, `rewardsProgram`                               |
| Enum types               | PascalCase type, camelCase values | `type LifecycleState : String enum { focus; active; toCancel; closed; }` |
| Config table projections | `VH` suffix for value-help        | `PurchaseTypeVH` in service definitions                                  |

### 3.2 Associations & Compositions

| Type            | Use When                              | Example                                                                    |
| --------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| **Composition** | True parent-child with cascade delete | `Offer` composes `OfferTranche`; `Transaction` composes `TransactionSplit` |
| **Association** | All other references (no cascade)     | `Transaction` → `CardInstance`, `Alert` → `CardInstance`                   |

### 3.3 Modular Schema Structure

One `schema.cds` per domain folder under `db/`:

| Folder                       | Entities                                                                                       | Count |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ----- |
| `db/common/`                 | Enum imports, shared aspects                                                                   | —     |
| `db/reference/schema.cds`    | All 16 reference data entities                                                                 | 16    |
| `db/cards/schema.cds`        | MarketCard, Offer, OfferTranche, CardInstance, EarningMultiplier, SoftPerkDefinition, CardPerk | 7     |
| `db/transactions/schema.cds` | Transaction, TransactionSplit, Vendor, MerchantPattern, VendorCategoryStats                    | 5     |
| `db/points/schema.cds`       | PointsAdjustment, Redemption                                                                   | 2     |
| `db/budget/schema.cds`       | BudgetAllocation, RecurrentExpense, Goal, IncomeEntry                                          | 4     |
| `db/financial/schema.cds`    | FinancialAccount, FinancialSnapshot                                                            | 2     |
| `db/ingestion/schema.cds`    | ProviderConnection, ProviderAccount, ImportLog                                                 | 3     |
| `db/alerts/schema.cds`       | Alert                                                                                          | 1     |
| `db/enums.cds`               | All enum type definitions                                                                      | —     |

### 3.4 Annotation Files

Entity-based, in a dedicated folder per Fiori Elements app:

```
app/{appname}/annotations/
├── Transaction.cds
├── Vendor.cds
└── TransactionSplit.cds
```

Each file contains UI, micro-frontend, and side-effect annotations for that entity.

### 3.5 CDS Linting

`@sap/eslint-plugin-cds` enforces:

- `start-entities-uppercase: error` — PascalCase entities
- `start-elements-lowercase: error` — camelCase fields
- `no-dollar-prefixed-names: error` — no `$` prefix (reserved)
- `no-db-keywords: warn` — avoid SQL reserved words
- `no-java-keywords: warn` — avoid Java reserved words

---

## 4. TypeScript Standards

**Decision D-64.**

### 4.1 tsconfig.json

| Setting                      | Value    | Notes                        |
| ---------------------------- | -------- | ---------------------------- |
| `strict`                     | `true`   | Enables all strict sub-flags |
| `noUnusedLocals`             | `true`   | Dead variable detection      |
| `noUnusedParameters`         | `true`   | Dead parameter detection     |
| `noImplicitReturns`          | `true`   | Every code path must return  |
| `noFallthroughCasesInSwitch` | `true`   | Prevents switch fallthrough  |
| `esModuleInterop`            | `true`   | Clean CommonJS interop       |
| `resolveJsonModule`          | `true`   | Import JSON files            |
| `skipLibCheck`               | `true`   | Faster builds                |
| `target`                     | `ES2022` | Node.js 20 native support    |
| `module`                     | `Node16` | CAP 8 recommended            |
| `outDir`                     | `./gen`  | CAP default output           |

Scope: `srv/` and `db/` TypeScript files. **`app/` is now TypeScript too** (D-315, superseding this line) — but with its own per-app `tsconfig.json` + `ui5.yaml` transpile setup (`ui5-tooling-transpile` + `cds-plugin-ui5`), not this root config. See D-315 and §11 for the frontend TypeScript conventions.

### 4.2 CDS Entity Type Patterns

**Decision D-65.** Follow CAP's standard TypeScript patterns:

**Entity imports** from generated types:

```typescript
import { Transaction, CardInstance } from "#cds-models/com/financialplanner";
```

**Handler registration** — pass entity references, not strings, for typed `req.data`:

```typescript
// Correct — req.data is typed as Transaction
this.on('CREATE', Transaction, async (req) => { ... })

// Avoid — req.data is any
this.on('CREATE', 'Transaction', async (req) => { ... })
```

**Custom computed shapes** in `types.ts` per module:

```
srv/modules/churning/types.ts  →  ProfitabilityResult, EligibilityResult
srv/modules/budget/types.ts    →  BudgetStatus, DiscretionaryBreakdown
```

---

## 5. CAP Handler Pattern

**Decision D-66.**

### 5.1 Three-Layer Architecture

Every module has exactly three files. No exceptions.

| Layer         | File                   | Responsibility                                                  | Calls                     |
| ------------- | ---------------------- | --------------------------------------------------------------- | ------------------------- |
| **Facade**    | `{Domain}Facade.ts`    | Handler registration, `wrapHandler` wrapping                    | Service                   |
| **Service**   | `{Domain}Service.ts`   | Business logic, orchestration, CDS reads/writes                 | Validator, other Services |
| **Validator** | `{Domain}Validator.ts` | Input validation only. `req.error()` accumulation. No DB calls. | Nothing                   |

### 5.2 wrapHandler Contract

Defined in `srv/modules/shared/BaseFacade.ts`. Every handler in every Facade goes through it:

```
wrapHandler(req, handlerName, async () => {
    // 1. Sets logger context (correlationId from req.id)
    // 2. Logs ENTRY with handler name at INFO level
    // 3. Executes the async callback
    // 4. Logs EXIT with handler name at INFO level
    // 5. On error: logs ERROR → re-throws
})
```

### 5.3 Layer Rules

| Rule                                            | Enforced By                            |
| ----------------------------------------------- | -------------------------------------- |
| Facades contain no `if`/`for`/`while`           | ESLint: `no-logic-in-facade`           |
| Facades contain no `try`/`catch`                | ESLint: `no-try-catch-in-facade`       |
| All Facades extend `BaseFacade`                 | ESLint: `require-facade-extends-base`  |
| All Services extend `BaseService`               | ESLint: `require-service-extends-base` |
| All handlers use `wrapHandler`                  | ESLint: `require-wrap-handler`         |
| Private methods (`_` prefix) at bottom of class | ESLint: `private-methods-at-bottom`    |

---

## 6. Error Handling

**Decision D-67.**

### 6.1 Two Patterns

| Method         | Purpose               | Behavior                                   | Who Calls It      |
| -------------- | --------------------- | ------------------------------------------ | ----------------- |
| `req.error()`  | Validation failure    | Accumulates. All errors returned together. | Validator         |
| `req.reject()` | Fatal / unrecoverable | Stops execution immediately.               | Service or Facade |

### 6.2 HTTP Status Codes

| Scenario                                           | Status | Method         |
| -------------------------------------------------- | ------ | -------------- |
| Field validation failed                            | `400`  | `req.error()`  |
| Entity not found                                   | `404`  | `req.reject()` |
| Business logic conflict (duplicate, invalid state) | `409`  | `req.reject()` |
| External service failure (SimpleFIN, CSV parse)    | `502`  | `req.reject()` |
| Unexpected server error (wrapHandler catch)        | `500`  | `req.reject()` |

### 6.3 Message Format

Always i18n keys via `MessagingUtility`. Never hardcoded strings.

```typescript
// Validator — accumulates, with field target
req.error({
  code: "VALIDATION",
  message: texts.getText("validation.amount.required"),
  target: "amount",
  status: 400,
});

// Service — fatal
req.reject(404, texts.getText("entity.notFound", ["Transaction", id]));
```

The `target` field links errors to form fields — Fiori Elements highlights the field in red.

---

## 7. Logging Standards

**Decision D-68.**

### 7.1 Logger Class

TypeScript adaptation of Enbridge's Logger in `srv/modules/shared/Logger.ts`. Uses `cds.log()` internally.

| Property       | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Namespace      | Module name only (e.g., `TransactionFacade`)                           |
| Correlation ID | From `req.id`. For `cds.spawn()` background jobs, generate a new UUID. |
| Output         | Console + file (dual)                                                  |

### 7.2 Log Levels

| Level   | When                                   | Examples                                                                     |
| ------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| `ERROR` | Something failed that needs attention  | wrapHandler catch, SimpleFIN failure, CSV parse failure, encryption failure  |
| `WARN`  | Unexpected but handled                 | Duplicate skipped, broken connection detected, low categorization confidence |
| `INFO`  | Normal operations worth tracking       | Handler ENTRY/EXIT, sync completed, import completed, lifecycle state change |
| `DEBUG` | Detailed internals for troubleshooting | Categorization scoring, bonus calculation steps, pattern match attempts      |

Default level: `INFO`. Toggle to `DEBUG` via `cds.env.log.levels` — no code change.

### 7.3 Structured Log Format

```json
{
  "module": "TransactionFacade",
  "correlationId": "req-uuid",
  "type": "ENTRY",
  "timestamp": "2026-02-16T14:30:00.000Z",
  "...data": "handler-specific payload"
}
```

### 7.4 Log Types

| Type            | Used For                                       |
| --------------- | ---------------------------------------------- |
| `ENTRY`         | wrapHandler start                              |
| `EXIT`          | wrapHandler end                                |
| `EXTERNAL_CALL` | Before/after SimpleFIN API, CSV parse          |
| `STATE_CHANGE`  | Card lifecycle transition, alert status change |
| `BATCH_RESULT`  | Sync/import summary (counts)                   |
| `ERROR`         | Caught exceptions                              |

### 7.5 File Output

| File             | Contents                                         |
| ---------------- | ------------------------------------------------ |
| `logs/app.log`   | All log entries at or above the configured level |
| `logs/error.log` | ERROR entries only — dedicated safety net        |

Rotation: daily or at 10MB threshold.

### 7.6 Sensitive Data Rules

| Never Log                           | Why                          |
| ----------------------------------- | ---------------------------- |
| Decrypted card numbers, CVV, expiry | OI-07 sensitive data         |
| SimpleFIN access URL (decrypted)    | Credential                   |
| Full `req.data` at INFO level       | May contain sensitive fields |

At DEBUG level, `req.data` may be logged but with sensitive fields redacted. Logger class provides a `_redact()` utility that strips known sensitive field names (`cardNumberEnc`, `cvvEnc`, `expiryDateEnc`, `accessUrlEnc`) before output.

---

## 8. i18n Conventions

**Decision D-69.**

### 8.1 Three Tiers

| Tier             | File                                     | Key Format       | Purpose                                                       |
| ---------------- | ---------------------------------------- | ---------------- | ------------------------------------------------------------- |
| CDS field labels | `srv/_i18n/i18n.properties`              | PascalCase       | Column headers, form labels, filter labels                    |
| Runtime messages | `srv/_i18n/messages.properties`          | `camelCase.dots` | Errors, toasts, validation, user-facing runtime text          |
| UI5 app messages | `app/{name}/webapp/i18n/i18n.properties` | camelCase        | Page titles, buttons, wizard steps, card titles, empty states |

### 8.2 Examples

**Tier 1 — CDS labels** (`srv/_i18n/i18n.properties`):

```properties
CardInstance = Card Instance
CardInstance.lifecycleState = Status
CardInstance.activationDate = Activation Date
Transaction.amount = Amount
Transaction.postedAt = Posted Date
Transaction.rawDescription = Bank Description
```

**Tier 2 — Runtime messages** (`srv/_i18n/messages.properties`):

```properties
validation.amount.required = Amount is required
validation.card.invalidState = Cannot perform this action when card is in state "{0}"
entity.notFound = {0} with ID "{1}" not found
sync.completed = SimpleFIN sync completed: {0} new, {1} duplicates, {2} errors
import.completed = CSV import completed: {0} new, {1} reconciled, {2} duplicates
```

**Tier 3 — UI5 app messages** (`app/transactions/webapp/i18n/i18n.properties`):

```properties
appTitle = Transaction List
filterBarLabel = Filters
noDataText = No transactions found
buttonApproveAll = Approve All
```

### 8.3 Enforcement

No hardcoded strings in `req.error()`, `req.reject()`, `req.notify()`, or any UI text. The `MessagingUtility` class only accepts i18n keys.

---

## 9. Encryption

**Decision D-70. Resolves OI-07.**

### 9.1 Scope

Four encrypted fields:

- `CardInstance.card_number_enc`
- `CardInstance.cvv_enc`
- `CardInstance.expiry_date_enc`
- `ProviderConnection.access_url_enc`

### 9.2 Algorithm

AES-256-GCM (authenticated encryption — confidentiality + tamper detection). Node.js built-in `crypto` module.

### 9.3 Key Management

| Aspect          | Standard                                                         |
| --------------- | ---------------------------------------------------------------- |
| Storage         | `.env` file (gitignored) as `ENCRYPTION_KEY`                     |
| Key format      | 256-bit random, hex-encoded                                      |
| Startup check   | App refuses to start if `ENCRYPTION_KEY` is missing (logs ERROR) |
| First-run setup | `npm run generate-key` creates a random key and writes to `.env` |

### 9.4 Storage Format

Per-field: `{iv}:{authTag}:{ciphertext}` — all hex-encoded, stored as a single string in the `_enc` text column.

- IV: Random 12-byte, generated per encryption call (GCM standard)
- Auth tag: 16-byte (GCM default)

### 9.5 Utility

`srv/util/EncryptionUtility.ts` — two methods:

- `encrypt(plaintext: string): string` — returns `{iv}:{authTag}:{ciphertext}`
- `decrypt(stored: string): string` — parses stored format, decrypts, returns plaintext

No raw `crypto` calls outside this utility. All `_enc` field access goes through `EncryptionUtility`.

---

## 10. ESLint Configuration

**Decision D-71.**

### 10.1 Base Preset

`@typescript-eslint/recommended` for TypeScript files. `@sap/eslint-plugin-cds` for CDS files.

### 10.2 Severity Philosophy

| Category                                                            | Severity |
| ------------------------------------------------------------------- | -------- |
| Architectural rules (wrapHandler, no-logic-in-facade, extends-base) | `error`  |
| Type safety (no-explicit-any, no-console, eqeqeq)                   | `error`  |
| Style (import order, private-methods-at-bottom, prefer-const)       | `error`  |
| Complexity (max-depth, max-params, complexity)                      | `warn`   |

### 10.3 Rules

**Type Safety & Best Practices:**

| Rule                    | Severity | Notes                                                            |
| ----------------------- | -------- | ---------------------------------------------------------------- |
| `no-explicit-any`       | `error`  |                                                                  |
| `no-non-null-assertion` | `error`  |                                                                  |
| `eqeqeq`                | `error`  | Always `===`                                                     |
| `prefer-const`          | `error`  |                                                                  |
| `no-var`                | `error`  |                                                                  |
| `no-console`            | `error`  | Use Logger                                                       |
| `no-magic-numbers`      | `error`  | Ignores: -1, 0, 1, 2, 100, 200, 400, 404, 409, 500, 502          |
| `prefer-template`       | `error`  | Template literals over concatenation                             |
| `no-throw-literal`      | `error`  |                                                                  |
| `no-restricted-syntax`  | `error`  | Disallows `.bind()`, `.call()`, `.apply()` — use arrow functions |

**Complexity:**

| Rule         | Severity | Threshold |
| ------------ | -------- | --------- |
| `max-depth`  | `warn`   | 4         |
| `max-params` | `warn`   | 5         |
| `complexity` | `warn`   | 10        |

**Naming:**

| Rule                                   | Severity | Notes                                                         |
| -------------------------------------- | -------- | ------------------------------------------------------------- |
| `@typescript-eslint/naming-convention` | `error`  | PascalCase classes, camelCase methods, `_` prefix for private |
| `camelcase`                            | `error`  | General camelCase enforcement                                 |
| `id-length`                            | `warn`   | Min 2, exceptions: `i`, `j`, `k`, `n`, `x`, `y`, `_`          |

**Import Ordering:**

| Rule                          | Severity | Order                                                    |
| ----------------------------- | -------- | -------------------------------------------------------- |
| `import/order`                | `error`  | builtin → external → internal (`#cds-models`) → relative |
| `import/first`                | `error`  |                                                          |
| `import/no-duplicates`        | `error`  |                                                          |
| `import/newline-after-import` | `error`  |                                                          |

**Custom Architectural Rules (adapted from Enbridge):**

| Rule                           | Severity | Enforces                                    |
| ------------------------------ | -------- | ------------------------------------------- |
| `no-logic-in-facade`           | `error`  | No `if`/`for`/`while` in Facade classes     |
| `require-wrap-handler`         | `error`  | All handler registrations use `wrapHandler` |
| `no-try-catch-in-facade`       | `error`  | No try/catch in Facades                     |
| `require-facade-extends-base`  | `error`  | All Facades extend `BaseFacade`             |
| `require-service-extends-base` | `error`  | All Services extend `BaseService`           |
| `private-methods-at-bottom`    | `error`  | `_` prefixed methods at end of class        |

**JSDoc (TypeScript backend):**

| Rule                                | Severity | Notes                            |
| ----------------------------------- | -------- | -------------------------------- |
| `jsdoc/require-jsdoc`               | `error`  | All methods (public and private) |
| `jsdoc/require-param-description`   | `error`  |                                  |
| `jsdoc/require-returns-description` | `off`    |                                  |
| `jsdoc/require-param-type`          | `off`    | TypeScript handles types         |
| `jsdoc/require-returns-type`        | `off`    | TypeScript handles types         |

### 10.4 UI5 Frontend Rules

Applied to `app/**/*.ts` (D-315). The frontend **shares the backend `tsRules` verbatim** — including `id-length` (min 3), the `jsdoc/*` set, and `no-explicit-any` — diverging only in two spots: browser globals (`window`, `document`, `Intl` as `readonly`) and `jsdoc/require-jsdoc` `checkConstructors: false` (UI5's generated control constructors are boilerplate). The custom UI5 rules below are **pre-migration and no longer active** — Hungarian notation is dropped and modules use ES `import`/`export`, not `sap.ui.define`:

| Rule                     | Severity | Notes                                                           |
| ------------------------ | -------- | --------------------------------------------------------------- |
| `hungarian-notation`     | `warn`   | `sName`, `oModel`, `aItems`, `bIsValid`, `iCount`, `fnCallback` |
| `event-handler-naming`   | `error`  | `on` prefix: `onPressSubmit`, `onSelectCard`                    |
| `controller-file-naming` | `error`  | Extensions: `*Ext.controller.ts`                                |
| `max-lines-per-function` | `warn`   | 50 lines (excludes `sap.ui.define` callbacks)                   |
| `max-params`             | `warn`   | 4 (excludes `sap.ui.define` callbacks)                          |
| `max-dependencies`       | `warn`   | 10 imports per `sap.ui.define` call                             |
| `complexity`             | `warn`   | 10                                                              |
| `max-depth`              | `warn`   | 4                                                               |
| `no-console`             | `warn`   | Allows `console.warn` and `console.error`                       |

### 10.5 Global Ignores

```
**/node_modules/**
**/@cds-models/**
**/gen/**
**/dist/**
**/*.min.js
**/logs/**
```

---

## 11. SAPUI5 Conventions

**Decision D-72** — but **substantially superseded by D-315 (Frontend TypeScript Migration).** `app/` is now TypeScript: all filenames below are `.ts` not `.js` (`BaseController.ts`, `{PageName}.controller.ts`, `{ViewType}Ext.controller.ts`, `VizFrameCard.ts`); modules use ES `import`/`export default class` not `sap.ui.define`; **every UI5 class needs a `@namespace` JSDoc** tag (else the transpiler emits a native class UI5 can't instantiate); and **Hungarian notation is dropped** (the type is in the signature). See D-315 for the toolchain (`ui5-tooling-transpile` + `cds-plugin-ui5`). The structural conventions (XML views only, BaseController, entity-based annotations, `{ViewType}Ext` extensions, `on`-prefix handlers, `_`-prefix privates) still hold.

### 11.1 Fiori Elements Apps (8 apps)

| Convention       | Standard                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| Customization    | Extensions in `app/{name}/webapp/ext/` only                                             |
| Extension naming | `{ViewType}Ext.controller.ts` — `ListReportExt`, `ObjectPageExt`, `FilterBarExt`        |
| Annotations      | Entity-based files in `app/{name}/annotations/` — e.g., `Transaction.cds`, `Vendor.cds` |
| `manifest.json`  | Standard Fiori Elements config. No custom Component.ts logic.                           |

### 11.2 Freestyle Apps (14 apps — 12 dashboards + 2 wizards)

| Convention         | Standard                                                                     |
| ------------------ | ---------------------------------------------------------------------------- |
| Base controller    | All extend `BaseController.ts` in `app/shared/`                              |
| Controller naming  | `{PageName}.controller.ts`                                                   |
| View naming        | `{PageName}.view.xml` — XML views only                                       |
| Fragment naming    | `{FragmentName}.fragment.xml`                                                |
| Model access       | Named models: `this.getView().getModel("data")`. OData stays as default.     |
| Formatter          | `formatter.ts` per app for display logic. No inline formatting in XML views. |
| Event handlers     | `on` prefix: `onPressSubmit`, `onSelectCard`, `onChangeMonth`                |
| Identifier naming  | No Hungarian notation (D-315). Min 3-letter identifiers (`id-length`).       |
| Private methods    | `_` prefix: `_loadChartData`, `_buildFilterArray`                            |

### 11.3 Custom Controls

| Convention   | Standard                                                                        |
| ------------ | ------------------------------------------------------------------------------- |
| Location     | `app/shared/controls/`                                                          |
| Pattern      | Extends `sap.ui.core.Control`. Wraps chart library instance.                    |
| Naming       | `VizFrameCard.ts`, `ApexChartCard.ts`                                           |
| Data binding | Accepts JSON model path, renders internally. Parent sets data; control renders. |
| Lifecycle    | `onAfterRendering` initializes chart. `exit` destroys chart instance.           |

### 11.4 Shared Resources

```
app/shared/
├── BaseController.ts
├── controls/
│   ├── VizFrameCard.ts
│   └── ApexChartCard.ts
└── util/
    └── formatter.ts          ← shared formatters (currency, date, status)
```

---

## 12. Code Review Checklists

**Decision D-73.**

Per-persona checklists for the sprint checkpoint meeting. Review personas validate against these criteria.

### 12.1 Backend Developer

- [ ] All handlers go through `wrapHandler`
- [ ] Three-file pattern (Facade/Service/Validator) for every module
- [ ] Entity imports from `#cds-models/`, not string literals
- [ ] No `req.reject()` in Validators, no business logic in Facades
- [ ] Custom types in `types.ts` per module, not inline

### 12.2 Frontend Developer

- [ ] `@namespace` JSDoc tag on every UI5 class (else the transpiler emits an uninstantiable native class)
- [ ] ES `import` / `export default class` syntax — not `sap.ui.define`
- [ ] No Hungarian notation — plain descriptive names
- [ ] Event handlers use `on` prefix
- [ ] XML views only — no JS/TS views
- [ ] Annotation files are entity-based in `annotations/` folder
- [ ] Extensions follow `{ViewType}Ext` naming (`{ViewType}Ext.controller.ts`)
- [ ] Formatters in `formatter.ts`, not inline in XML

### 12.3 Security Reviewer

- [ ] No decrypted sensitive data in logs (card numbers, CVV, access URLs)
- [ ] `EncryptionUtility` used for all `_enc` fields — no raw crypto calls elsewhere
- [ ] `.env` file in `.gitignore`
- [ ] No sensitive fields exposed in OData responses (card details only via explicit action, not in list queries)
- [ ] `_redact()` applied before any DEBUG-level `req.data` logging

### 12.4 Test Captain

- [ ] Unit tests exist for every Service and Validator method
- [ ] Tests written before implementation (TDD — D-230): test file committed before or with the implementation
- [ ] Integration tests cover each OData endpoint (CRUD + custom actions)
- [ ] FUT scenarios from functional specs have corresponding test cases
- [ ] Test data doesn't contain real card numbers or credentials

### 12.5 Documentation Guardian

- [ ] JSDoc descriptions on all methods (no type annotations — TypeScript handles that)
- [ ] i18n keys for all user-visible strings — no hardcoded text
- [ ] Change history updated on evolving design documents
- [ ] No duplication across documents

### 12.6 UX/Design Reviewer

- [ ] Design system compliance — Horizon theme, compact density, semantic colors
- [ ] Table standards — 100% column widths, titles with counts, search, personalization
- [ ] Status indicators use `ObjectStatus`/`ObjectNumber` per [Design System](DESIGN_SYSTEM.md) §8 mapping
- [ ] Dashboard cards use `GridContainer` 2-column layout
- [ ] Empty states use `noDataText`, no custom illustrations

---

## 13. Development Workflow — Test-Driven Development

**Decision D-230.**

All backend implementation follows the Red-Green-Refactor cycle:

1. **Red** — Write a failing test that defines the expected behavior.
2. **Green** — Write the minimum code to make the test pass.
3. **Refactor** — Clean up the implementation while keeping all tests green.

### 13.1 Scope

| Layer                 | TDD? | Notes                                                                                                          |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------- |
| **Validators**        | Yes  | Pure functions — ideal TDD targets. Write test per business rule, then implement.                              |
| **Services**          | Yes  | Mock CDS + use real Validator. One test per method, then implement.                                            |
| **Utilities**         | Yes  | Pure functions. Write test, then implement.                                                                    |
| **ENH engines**       | Yes  | Core computation logic. Test expected outputs per scenario, then implement.                                    |
| **Facades**           | No   | Zero logic by design (ESLint-enforced). Covered by integration tests after unit TDD is complete.               |
| **Integration tests** | No   | Written after unit-level TDD for a module is complete, since they require the full CDS stack via `cds.test()`. |
| **Frontend**          | No   | Learning exercise (D-80). Tests written alongside or after implementation.                                     |

### 13.2 Workflow Per Module

For each FRICEW object being built:

1. Create the Validator test file — write tests for every business rule from the functional spec.
2. Implement the Validator until all tests pass.
3. Create the Service test file — write tests for each service method (CDS mocked, Validator real).
4. Implement the Service until all tests pass.
5. Create the Facade (wiring only — no tests needed).
6. Write integration tests against the full CDS stack.
7. Refactor across all layers while keeping tests green.

### 13.3 Practical Guidelines

- **One test at a time.** Write one failing test, make it pass, then write the next. Do not batch multiple failing tests.
- **Test names describe behavior, not implementation.** Use `should reject transaction with zero amount`, not `test validateAmount function`.
- **Commit on green.** Every time the suite goes green after a meaningful addition, it's a valid commit point.
- **Do not skip red.** If the test passes before writing implementation, the test is not testing what you think it is — investigate.

---

## 14. Decisions Reference

Decisions made during technical standards definition (Step 9):

| ID    | Title                             | Summary                                                                                                                                 |
| ----- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| D-63  | CDS Naming & Modeling Conventions | PascalCase entities, camelCase fields, CAP auto-generated FKs, modular schema by domain, entity-based annotations in folder             |
| D-64  | TypeScript Strict Mode            | `strict: true`, ES2022 target, Node16 module, all strict sub-flags enabled                                                              |
| D-65  | CDS Entity Type Patterns          | Follow CAP standard — `#cds-models/` imports, entity references in handlers, `types.ts` per module                                      |
| D-66  | Three-Layer Handler Pattern       | Facade → Service → Validator, always 3 files, `wrapHandler` on every handler                                                            |
| D-67  | Error Handling Patterns           | `req.error()` for validation, `req.reject()` for fatal, always i18n keys, field targets on validation errors                            |
| D-68  | Logging Standards                 | Structured JSON, dual output (console + file), dedicated `error.log`, correlation IDs, sensitive data redaction                         |
| D-69  | i18n Three-Tier Convention        | CDS labels (PascalCase), runtime messages (camelCase.dots), UI5 (camelCase)                                                             |
| D-70  | Encryption — OI-07                | AES-256-GCM, env var key in `.env`, per-field IV, `EncryptionUtility.ts`                                                                |
| D-71  | ESLint Configuration              | Enbridge-adapted, custom architectural rules, errors for most rules, warn for complexity, JSDoc descriptions required, Hungarian in UI5 |
| D-72  | SAPUI5 Conventions                | XML views, BaseController, entity-based annotations, `{ViewType}Ext` extensions, Hungarian notation, max 10 deps                        |
| D-73  | Code Review Checklists            | Per-persona checklists for 6 review roles at sprint checkpoint meetings                                                                 |
| D-230 | Test-Driven Development           | Red-Green-Refactor for Validators, Services, Utilities, ENH engines. Integration and frontend tests written after.                      |

---

_This document is the single source of truth for coding conventions and patterns. All build personas reference these standards. Traces back to [Tech Stack](TECH_STACK.md) (Enbridge conventions), [Design System](DESIGN_SYSTEM.md) (UI patterns), [Data Model](DATA_MODEL.md) (entity definitions), and [Decisions Log](user-profile/DECISIONS_LOG.md)._
