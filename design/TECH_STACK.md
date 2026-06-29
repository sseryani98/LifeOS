# Tech Stack

**Document ID:** TS-001
**Version:** 1.0
**Date:** 2026-02-13
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                             |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-13 | Sandro & Claude | Initial creation — Step 6 complete. D-46 through D-52 logged.                                                                                                                                                                                                           |
| 2026-02-16 | Sandro & Claude | Updated project structure: modular db/ schema (D-63), entity-based annotation folders (D-72), app/shared/ resources (D-72), .env + logs/ (D-68, D-70). Added Validators to all module folders (D-66). Cross-reference to TECHNICAL_STANDARDS.md for coding conventions. |
| 2026-02-16 | Sandro & Claude | Expanded test/ folder structure: unit tests per module, integration tests per CDS service, scenario tests, test data factories + canonical test world (D-74 through D-78). Cross-reference to TEST_STRATEGY.md.                                                         |
| 2026-02-20 | Claude          | SPEC-21 amendment: `app/trophy-case/` changed from Freestyle to Fiori Elements ALP + Object Page (D-279).                                                                                                                                                               |
| 2026-02-20 | Claude          | Status → Approved. Step 12 complete — all 21 specs approved.                                                                                                                                                                                                            |

---

## 2. Summary

| Layer                  | Choice                                         |
| ---------------------- | ---------------------------------------------- |
| **Language**           | TypeScript (full-stack)                        |
| **Backend Framework**  | SAP CAP (Cloud Application Programming Model)  |
| **Frontend Framework** | SAPUI5 with Fiori Elements + Freestyle         |
| **Database**           | PostgreSQL (local)                             |
| **API Protocol**       | OData V4 (auto-generated from CDS)             |
| **Runtime**            | Node.js 20 LTS                                 |
| **Deployment**         | Local — `cds-serve` + local PostgreSQL service |

---

## 3. Language & Runtime

| Component      | Version             | Decision                                                                                            |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| **TypeScript** | 5.x (latest stable) | D-46 — Full-stack TypeScript. Same language front-to-back. Shared type definitions for 39 entities. |
| **Node.js**    | 20 LTS              | D-51 — Active LTS until April 2026, maintenance until 2027. Native `fetch`, stable `crypto`.        |
| **SAPUI5**     | 1.136.16            | D-51 — Latest Fiori Elements features, VizFrame, Smart Controls.                                    |
| **CDS Types**  | `@cap-js/cds-types` | Typed CDS APIs for TypeScript service handlers.                                                     |

Sandro's background: expert in SAP CAP + SAPUI5/Fiori (JavaScript). TypeScript is new — this project is the learning opportunity.

---

## 4. Architecture

**Decision D-47:** CAP backend + SAPUI5 frontend. Fiori Elements for CRUD / list reports / object pages. Freestyle SAPUI5 for dashboards and wizards.

```
┌─────────────────────────────────────────────────────┐
│                    SAPUI5 Frontend                    │
│                                                       │
│  Fiori Elements              Freestyle SAPUI5         │
│  ─────────────               ────────────────         │
│  List Reports (FRM-001,      Dashboards (RPT-001–012) │
│    004, 005, 007, 009,       Wizards (FRM-003, 006)   │
│    010, 011)                 VizFrame + ApexCharts     │
│  Object Pages                                         │
│  Variant Management                                   │
│  Draft / Edit Mode                                    │
│  Personalization                                      │
├───────────────────── OData V4 ────────────────────────┤
│                    CAP Backend                         │
│                                                       │
│  CDS Models ──→ Auto-generated OData Services         │
│  TypeScript Service Handlers                          │
│  Facade → Service → Validator Pattern                 │
│  ENH Engines (Business Logic)                         │
│  Integration Services (SimpleFIN, CSV, Scheduling)    │
├───────────────────────────────────────────────────────┤
│              PostgreSQL (local)                        │
│              @cap-js/postgres                          │
└───────────────────────────────────────────────────────┘
```

### Why CAP + SAPUI5

- **CDS models** are purpose-built for the 39-entity data model with associations, compositions, enums, computed values, and config tables.
- **Fiori Elements** auto-generates list reports, object pages, variant management, draft handling, and personalization from CDS annotations — directly serves FRM-009 (SM30-style CRUD) and 7 other form apps.
- **Freestyle SAPUI5** handles dashboards (12 reports) and wizards (CSV import, card onboarding) where Fiori Elements is too rigid.
- **Sandro's expertise** in CAP + SAPUI5 is the project's accelerator — framework learning curve is zero, only TypeScript syntax is new.
- **CAP runs fully outside BTP** — no HANA, no XSUAA, no BTP services required. Local Node.js + PostgreSQL.

### Dashboard Charting Strategy

VizFrame is the primary charting library for dashboards (bar, line, donut, combination charts). Where VizFrame is too rigid for a specific visualization, ApexCharts is embedded inside a custom SAPUI5 control. The decision is made chart-by-chart during functional specs, not upfront.

---

## 5. CDS Service Split

**Decision D-49:** Four CDS services aligned to problem domains.

| Service                | Path                       | Scope                                                                            | Serves                                                                                                         |
| ---------------------- | -------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **TransactionService** | `/service/transactionSvcs` | Transactions, categorization, splits, CSV import, dedup                          | FRM-001, FRM-003, ENH-001, ENH-008, ENH-009, INT-002                                                           |
| **ChurningService**    | `/service/churningSvcs`    | Cards, offers, bonuses, points, eligibility, recommendations, redemptions, perks | FRM-004, FRM-005, FRM-006, RPT-001, RPT-004, RPT-005, RPT-006, RPT-008, RPT-009, RPT-010, ENH-002–006, WFL-002 |
| **BudgetService**      | `/service/budgetSvcs`      | Budget, income, goals, recurrent expenses, financial picture                     | FRM-007, FRM-008, FRM-011, RPT-002, RPT-003, RPT-007, RPT-011, RPT-012, ENH-007                                |
| **AdminService**       | `/service/adminSvcs`       | Reference data CRUD, SimpleFIN connections, alerts, system config                | FRM-009, FRM-010, INT-001, CNV-001–004, WFL-004                                                                |

Wave 4's market intelligence (INT-003, WFL-003, CNV-004) folds into ChurningService.

---

## 6. Key Libraries

**Decision D-48.**

| Need                              | Library                   | Rationale                                                                                                                     |
| --------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **HTTP Client**                   | `axios`                   | SimpleFIN API calls (INT-001). Handles Basic Auth natively.                                                                   |
| **CSV Parsing**                   | `papaparse`               | INT-002, CNV-001. Auto-detects delimiters, handles headers, streaming. Maps to CSV Format Config entity.                      |
| **Fuzzy Search (UI)**             | `fuse.js`                 | Vendor name search in forms (FRM-001, FRM-002). Lightweight, zero dependencies.                                               |
| **Merchant Pattern Matching**     | Native string operations  | Merchant Pattern entity uses `exact` / `contains` / `starts_with` — `===`, `.includes()`, `.startsWith()`. No library needed. |
| **Background Scheduling**         | `node-cron`               | Cron expressions for daily SimpleFIN poll and alert generation. Combined with `cds.spawn()` for CDS context.                  |
| **Encryption**                    | Node.js built-in `crypto` | AES-256-GCM for card details (OI-07) and SimpleFIN access URL. No external dependency.                                        |
| **Web Scraping**                  | `cheerio` + `axios`       | Wave 4 (INT-003). Lightweight HTML parser. Defer final choice — `puppeteer` if target sites are JS-heavy SPAs.                |
| **Dashboard Charting (fallback)** | `ApexCharts`              | Embedded in custom SAPUI5 controls where VizFrame is too rigid. SVG-based, polished defaults, good interactivity.             |

---

## 7. Project Structure

Follows Sandro's Enbridge CAP conventions, adapted for TypeScript and local deployment.

```
financial-planner/
├── package.json
├── tsconfig.json
├── .cdsrc.json
├── .env                                     ← ENCRYPTION_KEY (gitignored)
├── .gitignore
├── eslint.config.mjs
├── CLAUDE.md
├── design/                                  ← Design documents
├── project/                                 ← Sprint tracking (see PROJECT_MANAGEMENT.md)
│   ├── SPRINT_BOARD.md
│   ├── DEFECT_LOG.md
│   └── sprints/
├── logs/                                    ← Runtime logs (gitignored)
│   ├── app.log                              ← All entries at configured level
│   └── error.log                            ← ERROR entries only
├── db/
│   ├── enums.cds                            ← All enum type definitions
│   ├── common/                              ← Shared aspects
│   ├── reference/schema.cds                 ← 16 reference data entities
│   ├── cards/schema.cds                     ← MarketCard, Offer, OfferTranche, CardInstance, EarningMultiplier, SoftPerkDefinition, CardPerk
│   ├── transactions/schema.cds              ← Transaction, TransactionSplit, Vendor, MerchantPattern, VendorCategoryStats
│   ├── points/schema.cds                    ← PointsAdjustment, Redemption
│   ├── budget/schema.cds                    ← BudgetAllocation, RecurrentExpense, Goal, IncomeEntry
│   ├── financial/schema.cds                 ← FinancialAccount, FinancialSnapshot
│   ├── integration/schema.cds               ← ProviderConnection, ProviderAccount
│   ├── alerts/schema.cds                    ← Alert
│   └── seed/                                ← CSV seed data for CNV-002
├── srv/
│   ├── transaction-service.cds              ← TransactionService definition
│   ├── transaction-service.ts               ← TransactionService entry point
│   ├── churning-service.cds                 ← ChurningService definition
│   ├── churning-service.ts                  ← ChurningService entry point
│   ├── budget-service.cds                   ← BudgetService definition
│   ├── budget-service.ts                    ← BudgetService entry point
│   ├── admin-service.cds                    ← AdminService definition
│   ├── admin-service.ts                     ← AdminService entry point
│   ├── _i18n/
│   │   ├── i18n.properties                  ← CDS field labels (PascalCase)
│   │   └── messages.properties              ← Runtime messages (camelCase.dots)
│   ├── modules/
│   │   ├── shared/
│   │   │   ├── constants.ts                 ← App-wide constants
│   │   │   ├── BaseFacade.ts                ← wrapHandler, logging
│   │   │   ├── BaseService.ts               ← connectAndRun pattern
│   │   │   ├── Logger.ts                    ← Structured logging with file output
│   │   │   └── MessagingUtility.ts          ← i18n message helper for req.error/reject
│   │   ├── transaction/
│   │   │   ├── TransactionFacade.ts
│   │   │   ├── TransactionService.ts
│   │   │   └── TransactionValidator.ts
│   │   ├── categorization/                  ← ENH-001
│   │   │   ├── CategorizationFacade.ts
│   │   │   ├── CategorizationService.ts
│   │   │   └── CategorizationValidator.ts
│   │   ├── churning/                        ← ENH-003, ENH-005, ENH-006
│   │   │   ├── ChurningFacade.ts
│   │   │   ├── ChurningService.ts
│   │   │   └── ChurningValidator.ts
│   │   ├── budget/                          ← ENH-007
│   │   │   ├── BudgetFacade.ts
│   │   │   ├── BudgetService.ts
│   │   │   └── BudgetValidator.ts
│   │   ├── eligibility/                     ← ENH-004
│   │   │   ├── EligibilityFacade.ts
│   │   │   ├── EligibilityService.ts
│   │   │   └── EligibilityValidator.ts
│   │   ├── recommendation/                  ← ENH-002
│   │   │   ├── RecommendationFacade.ts
│   │   │   ├── RecommendationService.ts
│   │   │   └── RecommendationValidator.ts
│   │   └── integration/
│   │       ├── SimpleFINIntegrationService.ts   ← INT-001
│   │       ├── CSVImportService.ts              ← INT-002
│   │       └── SchedulingService.ts             ← Cron jobs
│   └── util/
│       ├── EncryptionUtility.ts
│       ├── DateTimeUtility.ts
│       └── CurrencyUtility.ts
├── app/
│   ├── shared/                              ← Shared across freestyle apps
│   │   ├── BaseController.js
│   │   ├── controls/
│   │   │   ├── VizFrameCard.js
│   │   │   └── ApexChartCard.js
│   │   └── util/
│   │       └── formatter.js                 ← Shared formatters (currency, date, status)
│   ├── transactions/                        ← FRM-001 (Fiori Elements List Report)
│   │   ├── webapp/
│   │   │   ├── manifest.json
│   │   │   ├── Component.js
│   │   │   ├── i18n/
│   │   │   │   └── i18n.properties          ← UI5 messages (camelCase)
│   │   │   └── ext/
│   │   │       ├── ListReportExt.js
│   │   │       └── ObjectPageExt.js
│   │   └── annotations/
│   │       ├── Transaction.cds              ← Entity-based annotations
│   │       └── Vendor.cds
│   ├── my-cards/                            ← FRM-004 (Fiori Elements)
│   ├── market-cards/                        ← FRM-005 (Fiori Elements)
│   ├── csv-import/                          ← FRM-003 (Freestyle Wizard)
│   ├── card-onboarding/                     ← FRM-006 (Freestyle Wizard)
│   ├── income/                              ← FRM-007 (Fiori Elements)
│   ├── goals/                               ← FRM-008 (Fiori Elements)
│   ├── master-data/                         ← FRM-009 (Fiori Elements)
│   ├── connections/                         ← FRM-010 (Fiori Elements)
│   ├── financial-picture/                   ← FRM-011 (Fiori Elements)
│   ├── churnboard/                          ← RPT-001 (Freestyle Dashboard)
│   ├── budget-dashboard/                    ← RPT-002 (Freestyle Dashboard)
│   ├── financial-dashboard/                 ← RPT-003 (Freestyle Dashboard)
│   ├── trophy-case/                         ← RPT-004 (Fiori Elements ALP + Object Page, D-279)
│   ├── card-analytics/                      ← RPT-005 (Freestyle)
│   ├── recommendation-matrix/               ← RPT-006 (Freestyle)
│   ├── spending-trends/                     ← RPT-007 (Freestyle)
│   ├── perk-tracker/                        ← RPT-008 (Freestyle)
│   ├── annual-summary/                      ← RPT-009 (Freestyle)
│   ├── points-dashboard/                    ← RPT-010 (Freestyle)
│   ├── goal-progress/                       ← RPT-011 (Freestyle)
│   └── income-expenses/                     ← RPT-012 (Freestyle)
└── test/
    ├── unit/                                ← Backend unit tests (per-module)
    │   ├── transaction/                     ← TransactionService.test.ts, TransactionValidator.test.ts
    │   ├── categorization/                  ← CategorizationService.test.ts, ...
    │   ├── churning/
    │   ├── budget/
    │   ├── eligibility/
    │   ├── recommendation/
    │   ├── integration/                     ← SimpleFINIntegrationService.test.ts
    │   └── util/                            ← EncryptionUtility.test.ts, DateTimeUtility.test.ts, ...
    ├── integration/                         ← OData integration tests (per CDS service)
    │   ├── TransactionService.test.ts
    │   ├── ChurningService.test.ts
    │   ├── BudgetService.test.ts
    │   ├── AdminService.test.ts
    │   └── scenarios/                       ← FUT multi-step scenario tests
    │       ├── weekly-review.test.ts
    │       ├── card-onboarding.test.ts
    │       └── csv-import.test.ts
    └── data/                                ← Test data factories + named constants
        ├── factories.ts
        ├── cards.ts                         ← AMEX_COBALT_FOCUS_CARD, ...
        ├── offers.ts
        ├── transactions.ts
        ├── vendors.ts
        ├── reference.ts
        └── integration/
            └── seeds.ts                     ← Canonical test world for integration tests
```

### Conventions from Enbridge (Adapted)

| Convention                   | Pattern                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Handler layering**         | Facade (handler registration + wrapHandler) → Service (business logic) → Validator (validation)                                         |
| **Naming — classes**         | PascalCase: `TransactionFacade`, `ChurningService`                                                                                      |
| **Naming — methods**         | camelCase: `readTransactions()`, `computeBonusProgress()`                                                                               |
| **Naming — private methods** | `_` prefix: `_validateAmount()`, `_getEntitySet()`                                                                                      |
| **Naming — handlers**        | `handle{Action}()`: `handleReadTransactions()`, `handleApprove()`                                                                       |
| **Naming — CDS entities**    | PascalCase: `Transaction`, `CardInstance`, `EarningMultiplier`                                                                          |
| **Naming — CDS fields**      | camelCase: `cardInstanceId`, `activationDate`, `lifecycleState`                                                                         |
| **Naming — files**           | `{Domain}Facade.ts`, `{Domain}Service.ts`, `{Domain}Validator.ts`                                                                       |
| **Value help entities**      | Suffix `VH`: `GasPoolStatusVH` pattern (used for config table projections)                                                              |
| **i18n — CDS labels**        | PascalCase keys in `srv/_i18n/i18n.properties`                                                                                          |
| **i18n — runtime messages**  | camelCase.dots in `srv/_i18n/messages.properties`                                                                                       |
| **i18n — UI5**               | camelCase in `app/{appname}/webapp/i18n/i18n.properties`                                                                                |
| **Annotations**              | Entity-based files in `app/{name}/annotations/` folder — e.g., `Transaction.cds`, `Vendor.cds` (D-72, amends Enbridge three-file split) |
| **Constants**                | Centralized in `srv/modules/shared/constants.ts`                                                                                        |
| **Error handling**           | `req.error()` for validation (accumulate), `req.reject()` for fatal. Always i18n keys.                                                  |
| **Arrow functions**          | In class methods to preserve `this` context                                                                                             |
| **External services**        | Wrapped in integration service classes extending `BaseService`                                                                          |

### What Drops (Not Needed)

| Enbridge Pattern                         | Reason to Drop                                           |
| ---------------------------------------- | -------------------------------------------------------- |
| `mta.yaml`, `xs-security.json`           | No BTP deployment                                        |
| XSUAA, access rights, two-role pattern   | Single user, no auth                                     |
| `@sap-cloud-sdk`, destination service    | No BTP services                                          |
| `@enbridge/cap-commonmodules` dependency | Build our own `BaseFacade` + `BaseService` in TypeScript |
| External `.csn` files                    | No S/4HANA remoting — all local CDS entities             |

---

## 8. Deployment

**Decision D-50:** Local deployment. No Docker for V1.

| Component           | How It Runs                                                          |
| ------------------- | -------------------------------------------------------------------- |
| **CAP Server**      | `npm start` → `cds-serve` on localhost                               |
| **PostgreSQL**      | Local Windows service (installed once, always running)               |
| **Background Jobs** | `node-cron` starts in service `init()` — runs inside the CAP process |
| **SAPUI5**          | Loaded from SAP CDN (`sapui5.hana.ondemand.com`)                     |

Development workflow: `cds watch` with live reload (standard CAP DX).

Docker deferred to future cloud deployment.

---

## 9. Claude Code Subagent Personas

**Decision D-52:** Ten personas for the build phase. Persona list and scopes defined here. Detailed agent configurations (system prompts, checklists, rules) will be defined after Steps 7–10 are complete, before the first sprint.

| #   | Persona                       | Owns                         | Key Responsibilities                                                                                                                                       |
| --- | ----------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Backend Developer**         | `db/`, `srv/`                | CDS models, service definitions, TypeScript handlers, Facade → Service → Validator pattern, ENH engines, utilities, i18n (CDS labels + runtime messages).  |
| 2   | **Frontend Developer**        | `app/`                       | Fiori Elements apps (annotations, manifest.json, extensions) AND freestyle SAPUI5 (views, controllers, VizFrame/ApexCharts dashboards, wizards). UI5 i18n. |
| 3   | **Project Manager**           | Sprint board, sprint reports | Tracks progress against 43 FRICEW objects across 4 waves. Manages backlog, sprint planning, sprint reviews. Flags scope creep and dependency blockers.     |
| 4   | **Integration Specialist**    | `srv/modules/integration/`   | SimpleFIN API client (INT-001), CSV parsing (INT-002), web scraping (INT-003), dedup (ENH-008), scheduling, external system error handling.                |
| 5   | **Test Captain**              | `test/`                      | Unit tests for services, OData integration tests, test data setup, edge case coverage from functional specs, test strategy enforcement.                    |
| 6   | **Documentation Guardian**    | `design/`, `CLAUDE.md`       | Single source of truth enforcement. No duplication, no conflicting information. Updates change history on evolving documents. Validates cross-references.  |
| 7   | **Security Reviewer**         | Cross-cutting                | Encryption implementation (OI-07), credential handling, code audits for vulnerabilities, no sensitive data in logs/OData responses, OWASP basics.          |
| 8   | **UX/Design Reviewer**        | Cross-cutting                | Design system enforcement, visual consistency across all UI apps, dashboard usability, Fiori design guideline adherence.                                   |
| 9   | **Data Migration Specialist** | `db/seed/`, CNV-001–004      | Data cleansing, validation, reconciliation. Historical backfill quality. Seed data accuracy.                                                               |
| 10  | **Defect Tracker**            | `project/DEFECT_LOG.md`      | Defect logging with severity/priority, root cause tracking, fix verification, regression flags. Running defect count across sprints.                       |

Operational details for how these personas interact during sprint checkpoint meetings are defined in [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md).

---

## 10. Decisions Reference

Decisions made during tech stack selection (Step 6):

| ID   | Title                     | Summary                                                                                                                          |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| D-46 | TypeScript Full-Stack     | Single language front-to-back. Shared types for 39 entities.                                                                     |
| D-47 | CAP + SAPUI5 Architecture | CAP backend + SAPUI5 frontend. Fiori Elements for CRUD, freestyle for dashboards/wizards. VizFrame primary, ApexCharts fallback. |
| D-48 | Library Selections        | axios, papaparse, fuse.js, node-cron, native crypto, cheerio, ApexCharts.                                                        |
| D-49 | Four CDS Services         | TransactionService, ChurningService, BudgetService, AdminService.                                                                |
| D-50 | Local Deployment          | cds-serve + local PostgreSQL. No Docker for V1.                                                                                  |
| D-51 | Runtime Versions          | Node.js 20 LTS, TypeScript 5.x, SAPUI5 1.136.16.                                                                                 |
| D-52 | Ten Subagent Personas     | Backend Dev, Frontend Dev, PM, Integration, Test, Docs, Security, UX, Migration, Defect Tracker.                                 |

---

_This document is the single source of truth for the Financial Planner tech stack. All technology choices trace back to the [Problem Statement & Vision](PROBLEM_STATEMENT_AND_VISION.md), [Data Model](DATA_MODEL.md), [Business Architecture](BUSINESS_ARCHITECTURE.md), and [Decisions Log](user-profile/DECISIONS_LOG.md)._
