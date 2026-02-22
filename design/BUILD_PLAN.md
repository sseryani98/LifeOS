# Build Plan

**Document ID:** BP-001
**Version:** 1.0
**Date:** 2026-02-21
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-21 | Sandro & Claude | Initial creation — Step 15 in progress. |
| 2026-02-21 | Sandro | Approved. All 7 sections complete — cross-sprint contracts, CLAUDE.md update, scaffold prompt, sprint checklists, prompt playbook (32 prompts), quick reference. |

---

## 2. Cross-Sprint Integration Points

Each sprint produces artifacts (entities, services, functions) that later sprints consume. This section defines the explicit handoff contracts so each prompt can reference what's available and what it must deliver.

### 2.1 Sprint Dependency Chain

```
W1-S1 (Foundation) ──→ W1-S2 (Ingestion) ──→ W1-S3 (Txn Processing) ──→ W1-S4 (Engines) ──→ W1-S5 (UI + Dashboards)
                                                                                                       │
                       W2-S1 (Churning Depth) ◄────────────────────────────────────────────────────────┘
                              │
                       W2-S2 (Goals + Reports)
                              │
                       W3-S1 (Analytics + Financial)
                              │
                       W3-S2 (Remaining Reports)
                              │
                       W4-S1 (Market Intelligence)
```

### 2.2 Per-Sprint Contracts

#### W1-S1 → W1-S2

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| All reference data entities (CDS models + CSV seed data) | Every subsequent sprint | `db/reference/schema.cds` deployed, `db/seed/` CSV files loaded via `cds deploy` |
| System Config parameters (18 values) | INT-001 (poll interval, retry, stale thresholds), ENH-003 (MSR_DEADLINE_ALERT_DAYS), ENH-007 (BUDGET_WARNING_THRESHOLD_PCT) | `SystemConfig` entity queryable by `key` field |
| CSV Format Config per issuer (Scotia, TD, CIBC, Amex) | INT-002, CNV-001 | `CSVFormatConfig` records with column mappings, date formats, amount handling |
| Sandro's card portfolio (13 active + 3 closed Card Instances, Market Cards, Offers, Earning Multipliers, Soft Perks) | INT-001 (card-to-account mapping), ENH-003 (bonus tracking), ENH-006 (points), FRM-004 | `CardInstance`, `MarketCard`, `Offer`, `OfferTranche`, `EarningMultiplier`, `SoftPerkDefinition`, `CardPerk` populated |
| Issuer Application Rules (9 rules) | ENH-004 (eligibility engine in W2-S1) | `IssuerApplicationRule` records seeded per issuer |
| Rewards Programs + CPP valuations | ENH-006 (points valuation), RPT-004 (trophy case) | `RewardsProgram` with `cppValuation` field |
| FRM-009 (Master Data CRUD) | Ongoing — all sprints can edit reference data | AdminService CRUD for all reference tables |
| Alert Type seeds (23 types) | SPEC-01, SPEC-04, SPEC-05 alert generation | `AlertType` records queryable by `key` field |

#### W1-S2 → W1-S3

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| INT-001 SimpleFIN sync service | WFL-001 (weekly review), FRM-010 (manual sync) | `SimpleFINIntegrationService.syncTransactions()` — creates Transaction records with `source = 'simplefin'`, `externalId` populated |
| INT-002 CSV parsing engine | CNV-001 (backfill), FRM-003 (ongoing CSV import) | `CSVImportService.parseFile(file, cardInstanceId)` — returns parsed rows per CSVFormatConfig |
| ENH-008 dedup engine | INT-001 (auto-dedup), INT-002 (dedup review), CNV-001 (backfill dedup) | `DeduplicationService.evaluate(transaction)` → returns `new` / `duplicate` / `reconciliation` |
| FRM-003 CSV Import Wizard | CNV-001 (uses same parsing path) | Wizard UI functional with upload → review → save flow |
| FRM-010 Connection Manager | WFL-001 (connection health check) | Connection list with health status, last sync time, manual sync trigger |
| Provider Connection + Provider Account records | INT-001 sync, FRM-010 display | `ProviderConnection` and `ProviderAccount` entities with SimpleFIN access URL (encrypted) |

#### W1-S3 → W1-S4

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| ENH-001 categorization engine | ENH-003 (fee detection via PT = "Credit Card Fee"), ENH-007 (budget categories), FRM-003 (pre-population) | `CategorizationService.categorize(transaction)` — sets `vendor_ID`, `purchaseType_ID`, `earningCategory_ID`, `categorizationStatus` |
| ENH-009 split logic | ENH-007 (my_share for budget), ENH-003 (full amount for churning) | `TransactionSplit` records with `mySharePct` / `myShareAmount`. Budget uses `myShareAmount`, churning uses parent `Transaction.amount` |
| FRM-001 Transaction List | WFL-001 (review surface) | Transaction grid with inline editing, split action, bulk categorization |
| CNV-001 historical backfill complete | ENH-003 (retroactive bonus eval), ENH-007 (historical budget), RPT-001/002 (historical data in charts) | ~1,200-1,400 Transaction records loaded, Merchant Patterns bootstrapped for strong day-one auto-categorization |
| Vendor + Merchant Pattern records | ENH-001 (ongoing matching) | Learned patterns from backfill corrections enable high-confidence matching on new transactions |

#### W1-S4 → W1-S5

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| ENH-003 bonus tracker | FRM-004 (bonus progress section), RPT-001 W1 sections, WFL-002 (Focus→Active trigger) | `BonusTrackingService.getProgress(cardInstanceId)` → per-tranche MSR status (pending/in_progress/met/missed), amounts, deadlines |
| ENH-006 points balance | RPT-001 W1 sections (points balances card), RPT-010 (W3) | `PointsService.getBalance(rewardsProgramId)` → balance, CPP valuation, per-card breakdown |
| ENH-007 budget engine | RPT-002 W1 sections (budget overview, spending by category) | `BudgetService.compute(month)` → totalIncome, totalBudget, per-category breakdown with status |
| FRM-007 income entry | ENH-007 (income inputs for budget) | Income Entry CRUD via BudgetService |
| Points Adjustment records (auto-created by ENH-003) | ENH-006 (points balance), RPT-004 (W2 trophy case) | `PointsAdjustment` with `type`, `amount`, `rewardsProgram_ID` |
| Alert records (3 bonus + 4 budget types) | RPT-001 alerts section, WFL-001 (weekly review) | `Alert` records with `alertType_ID`, `severity`, `relatedEntity`, `relatedEntityId` |

#### W1-S5 → W2-S1

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| FRM-004 My Cards | FRM-002 (card selector), RPT-001 (card name → FRM-004 navigation) | Card list + object page with bonus progress, earning & perks, fee history, lifecycle timeline |
| FRM-006 Card Onboarding (absorbs WFL-004) | Ongoing — new card creation | Wizard: select market card → define offer → enter instance → optional SimpleFIN link |
| RPT-001 W1 shell (partial) | W2-S1 completes remaining sections | Dashboard structure, year selector, W1 sections functional: bonus progress, points balances, CC spend, upcoming fees, alerts |
| RPT-002 W1 shell (partial) | W2-S1 completes remaining sections | Dashboard structure, month nav, W1 sections functional: budget overview (no goals), spending vs budget, on-track indicators |
| WFL-001 Weekly Review | Ongoing — defines weekly usage pattern | Cross-component journey: connection health → CSV import → transaction review → dashboards |
| WFL-002 Card Lifecycle | ENH-002 (active card set), ENH-004 (eligibility history), ENH-005 (profitability period) | State machine: Focus → Active → To Cancel → Closed. `CardInstance.lifecycleState` field |

#### W2-S1 → W2-S2

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| ENH-002 recommendation engine | FRM-002 (recommendation display), RPT-001 (recommendation section), RPT-006 | `RecommendationService.getRecommendation(earningCategoryId)` → recommended card, effective earn rate, bonus override flag |
| ENH-004 eligibility engine | RPT-001 (eligibility section) | `EligibilityService.getEligibility()` → per-issuer summary (eligible_now / eligible_in_X_days / not_eligible) + per-rule detail |
| ENH-005 profitability calculator | RPT-001 (realized value section), RPT-005 (W3), RPT-009 (W3) | `ProfitabilityService.calculate(cardInstanceId)` → net value (points×CPP + perks − fees), FYF handling |
| FRM-002 manual transaction entry | Ongoing | Single transaction create/edit with vendor fuzzy match, dual taxonomy, card recommendation |
| RPT-001 complete | Ongoing | All sections functional including recommendation, eligibility, profitability, yield trend |
| RPT-002 complete | Ongoing | All sections functional including goal progress, top vendors |

#### W2-S2 → W3-S1

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| FRM-008 Goals Management | RPT-002 (goal progress section), RPT-011 (goal progress report), ENH-007 (goal allocations in budget) | Goal CRUD with target amount, timeline, monthly allocations, transaction linking |
| RPT-004 Trophy Case | Ongoing | Redemption register with CRUD, KPI tags, CPP semantic coloring |
| RPT-006 Recommendation Matrix | Ongoing | All cards × all categories matrix with optimal card highlights |
| RPT-011 Goal Progress | Ongoing | Active goals with progress bars, projections |

#### W3-S1 → W3-S2

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| FRM-005 Market Cards | CNV-004 (W4, market card database target), INT-003 (W4, scraper target) | Market card browser with CRUD, offer history, linked user cards |
| FRM-011 Financial Picture Entry | RPT-003 (financial dashboard) | Manual entry of non-CC positions (investments, debts), monthly snapshots |
| RPT-003 Financial Picture Dashboard | Ongoing | Net worth, debt trending, investment trending |
| RPT-005 Card Analytics | Ongoing | Per-card deep dive: spend, points, profitability breakdown |
| RPT-007 Spending Trends | Ongoing | Multi-month time-series by category, vendor concentration |

#### W3-S2 → W4-S1

| Produces | Consumed By | Contract |
|----------|-------------|----------|
| RPT-008 Perk Tracker | Ongoing | Cross-card soft perk view, realized vs unrealized |
| RPT-009 Annual Summary | Ongoing | Year-in-review: cards, net value, best/worst, totals |
| RPT-010 Points Dashboard | Ongoing | Per-program view: balance, earning/redemption history |
| RPT-012 Income vs Expenses | Ongoing | Multi-month macro: income vs outflow, savings rate |

W4-S1 (CNV-004, INT-003, WFL-003) consumes the `MarketCard` entity structure established in W1-S1 (CNV-003) and browsable via W3-S1 (FRM-005). No new integration contracts beyond what already exists.

### 2.3 Critical Synchronization Points

These are the moments where output from one sprint becomes a hard input to the next. If the producing sprint doesn't deliver correctly, the consuming sprint is blocked.

| # | Sync Point | Producing Sprint | Consuming Sprint | What Must Be True |
|---|-----------|-----------------|-----------------|-------------------|
| 1 | **Reference data deployed** | W1-S1 | W1-S2 and all later | `cds deploy` succeeds, all 18 System Config values queryable, all seed CSVs loaded, FRM-009 CRUD functional |
| 2 | **Card portfolio populated** | W1-S1 (CNV-003) | W1-S2 (INT-001 needs card-to-account mapping) | 13 active + 3 closed Card Instances, Market Cards, Offers, Earning Multipliers all present |
| 3 | **Transaction ingestion operational** | W1-S2 | W1-S3 (ENH-001 needs transactions to categorize) | INT-001 or INT-002 can create Transaction records; ENH-008 dedup prevents duplicates |
| 4 | **Categorization engine trained** | W1-S3 (CNV-001 backfill) | W1-S4 (ENH-003 needs PT for fee detection, ENH-007 needs PT for budget categories) | ENH-001 can assign vendor + dual taxonomy; Merchant Patterns learned from backfill |
| 5 | **Computation engines deliver data** | W1-S4 | W1-S5 (dashboards need computed data to display) | ENH-003, ENH-006, ENH-007 all return structured results; Alerts generated |
| 6 | **Dashboard shells accept new sections** | W1-S5 (RPT-001/002 partial) | W2-S1 (completes RPT-001/002) | Dashboard code structured so new sections can be added without rewriting existing ones |
| 7 | **W2 engines expose standard interfaces** | W2-S1 | W2-S2 + W3 reports | ENH-002, ENH-004, ENH-005 each expose a clean service function callable from any report |

---

## 3. CLAUDE.md Build-Phase Update

When the first sprint begins, the current design-phase CLAUDE.md is replaced with the build-phase version below. This is the complete text — copy-paste replacement. The build-phase CLAUDE.md is loaded automatically by every Claude Code session, providing baseline context so prompts can stay concise.

### 3.1 Proposed Build-Phase CLAUDE.md

```markdown
# Financial Planner — Build Phase

## What This Is

Personal financial management system for a Canadian credit card churner. TypeScript + SAP CAP + SAPUI5 + PostgreSQL. Single user, local deployment.

## Current Sprint

<!-- Updated each sprint -->
**Sprint:** W1-S1 — Foundation & Seed Data
**Branch:** sprint/W1-S1
**Goal:** Reference data seeded, config tables editable via SM30-style CRUD
**Stories:** CNV-002, CNV-003, FRM-009

## Architecture

- **Backend:** CAP with @cap-js/postgres — 4 CDS services (Transaction, Churning, Budget, Admin)
- **Frontend:** SAPUI5 — Fiori Elements for CRUD (8 apps), Freestyle for dashboards/wizards (14 apps)
- **API:** OData V4 auto-generated from CDS
- **Theme:** sap_horizon + custom overrides in `app/shared/css/theme-overrides.css`
- **Background jobs:** node-cron inside CAP process via `cds.spawn()`

## Folder Structure

```

db/                          CDS entity models (9 domain folders)
  enums.cds                  All enum types
  common/                    Shared aspects
  reference/schema.cds       16 reference entities
  cards/schema.cds           7 card entities
  transactions/schema.cds    5 transaction entities
  points/schema.cds          2 points entities
  budget/schema.cds          4 budget entities
  financial/schema.cds       2 financial entities
  integration/schema.cds     2 integration entities
  alerts/schema.cds          1 alert entity
  seed/                      CSV seed data (CNV-002, CNV-003)
srv/
  {service-name}.cds         CDS service definitions (4 services)
  {service-name}.ts          Service entry points
  _i18n/
    i18n.properties          CDS field labels (PascalCase keys)
    messages.properties      Runtime messages (camelCase.dots keys)
  modules/
    shared/                  BaseFacade, BaseService, Logger, MessagingUtility, constants
    {domain}/                Per-domain: {Domain}Facade.ts, {Domain}Service.ts, {Domain}Validator.ts
    integration/             SimpleFIN, CSV, Scheduling services
  util/                      EncryptionUtility, DateTimeUtility, CurrencyUtility
app/
  shared/                    BaseController.js, controls/, util/formatter.js, css/theme-overrides.css
  {app-name}/                One folder per UI app (23 total)
    webapp/                  manifest.json, Component.js, i18n/, ext/ or views/
    annotations/             Entity-based CDS annotation files (Fiori Elements apps only)
test/
  unit/{domain}/             Per-module unit tests
  integration/               Per-CDS-service integration tests
  integration/scenarios/     FUT multi-step scenario tests
  data/                      Test data factories, named constants, seeds.ts
project/
  SPRINT_BOARD.md            Current sprint status
  DEFECT_LOG.md              Running defect log
  sprints/                   Sprint checkpoint reports

```

## Coding Patterns

### CDS
- **Entities:** PascalCase singular (`Transaction`, `CardInstance`)
- **Fields:** camelCase (`lifecycleState`, `activationDate`)
- **FKs:** CAP auto-generated (`cardInstance_ID`)
- **Namespace:** `com.financialplanner`
- **Schema:** One `schema.cds` per domain folder under `db/`

### TypeScript (srv/ and db/ only)
- `strict: true` with all sub-flags
- Entity imports: `import { Transaction } from '#cds-models/com/financialplanner'`
- Handler registration: pass entity references, not strings
- Custom types in `{domain}/types.ts`
- No `any` — ever

### Handler Pattern — Always 3 Files
| Layer | File | Does | Calls |
|-------|------|------|-------|
| Facade | `{Domain}Facade.ts` | Handler registration + `wrapHandler` | Service |
| Service | `{Domain}Service.ts` | Business logic, CDS reads/writes | Validator, other Services |
| Validator | `{Domain}Validator.ts` | Input validation, `req.error()` accumulation | Nothing |

- Facades: NO `if`/`for`/`while`, NO `try`/`catch` — enforced by ESLint
- All handlers wrapped with `wrapHandler` from `BaseFacade`
- Private methods: `_` prefix, placed at bottom of class

### Error Handling
- `req.error({ code, message, target, status: 400 })` — Validator, accumulates
- `req.reject(status, message)` — Service/Facade, fatal (404/409/500/502)
- Always i18n keys via `MessagingUtility` — never hardcoded strings

### Logging
- `Logger` class wrapping `cds.log()`, structured JSON
- Correlation ID from `req.id`
- Dual output: `logs/app.log` + `logs/error.log`
- Never log decrypted card numbers, CVV, access URLs
- `_redact()` before any DEBUG-level `req.data` logging

### i18n — Three Tiers
| Tier | File | Key Format |
|------|------|------------|
| CDS labels | `srv/_i18n/i18n.properties` | `PascalCase` |
| Runtime messages | `srv/_i18n/messages.properties` | `camelCase.dots` |
| UI5 app messages | `app/{name}/webapp/i18n/i18n.properties` | `camelCase` |

### SAPUI5 (app/ — JavaScript, not TypeScript)
- XML views only — no JS views
- All controllers extend `BaseController.js`
- Extensions: `{ViewType}Ext.js` (ListReportExt, ObjectPageExt)
- Annotations: entity-based files in `app/{name}/annotations/`
- Hungarian notation: `sName`, `oModel`, `aItems`, `bIsValid`, `iCount`, `fnCallback`
- Event handlers: `on` prefix (`onPressSubmit`, `onSelectCard`)
- Max 10 `sap.ui.define` dependencies

### Encryption
- AES-256-GCM via `EncryptionUtility.ts` — `encrypt(plaintext)` / `decrypt(stored)`
- 4 encrypted fields: `card_number_enc`, `cvv_enc`, `expiry_date_enc`, `access_url_enc`
- Key in `.env` as `ENCRYPTION_KEY` (gitignored)
- No raw `crypto` calls outside EncryptionUtility

## Test Rules

- **TDD:** Red-Green-Refactor for Validators, Services, Utilities, ENH engines
- **Framework:** Jest + ts-jest (backend), QUnit + OPA5 (frontend)
- **Unit tests:** No DB, mocked CDS. Validators fully tested (pure). Services tested with CDS mocked + real Validator.
- **Integration tests:** `cds.test()` + SQLite. One file per CDS service.
- **Test data:** Hybrid factories + named constants (UPPER_SNAKE_CASE) in `test/data/`. Semantic names. No real card numbers.
- **Coverage targets:** Validators/Utilities 100%/100%, Services 90%/85%, Overall 85%/80%
- **Facades excluded** from unit testing (zero logic by design)

## Git Workflow

- **Branch:** `sprint/W{wave}-S{sprint}` off `main`
- **Commits:** `type(scope): description` — Conventional Commits
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - FRICEW IDs in body, `Co-Authored-By` on agent commits
- **Merge:** `--no-ff` merge commits at sprint checkpoint
- **Tags:** `v{wave}.{sprint}` annotated tags, `v1.0.0` at go-live

## Design References

Look up details here — do not duplicate:

| Topic | Document |
|-------|----------|
| Entity definitions | [DATA_MODEL.md](design/DATA_MODEL.md) |
| Functional specs | [design/specs/SPEC-{nn}-*.md](design/specs/) |
| Business rules | Spec §5 (Business Rules) per FRICEW object |
| Wave plan & FRICEW catalog | [BUSINESS_ARCHITECTURE.md](design/BUSINESS_ARCHITECTURE.md) |
| Sprint plan & personas | [PROJECT_MANAGEMENT.md](design/PROJECT_MANAGEMENT.md) |
| Full coding standards | [TECHNICAL_STANDARDS.md](design/TECHNICAL_STANDARDS.md) |
| Test strategy details | [TEST_STRATEGY.md](design/TEST_STRATEGY.md) |
| Design system | [DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md) |
| Theme overrides | [THEME.md](design/THEME.md) |
| Navigation & IA | [INFORMATION_ARCHITECTURE.md](design/INFORMATION_ARCHITECTURE.md) |
| Cross-sprint contracts | [BUILD_PLAN.md](design/BUILD_PLAN.md) §2 |
| All decisions | [DECISIONS_LOG.md](design/user-profile/DECISIONS_LOG.md) |

## Do NOT

- Add features beyond what the functional spec defines
- Skip TDD — write failing tests before implementation
- Hardcode user-facing strings — always i18n keys
- Put logic in Facades — they are pure wiring
- Use `any` type in TypeScript
- Log decrypted sensitive data
- Use `!important` in CSS overrides
- Duplicate information already in design docs — reference it
- Commit `.env`, `logs/`, `node_modules/`, `gen/`
```

### 3.2 What Changed From Design Phase

| Design-Phase CLAUDE.md | Build-Phase CLAUDE.md |
|------------------------|----------------------|
| "No code until design is complete" | Removed — we're building now |
| Repository structure shows `design/` only | Full project structure with `db/`, `srv/`, `app/`, `test/`, `project/` |
| Design progress section | Replaced with "Current Sprint" — updated each sprint |
| Document status convention (6 statuses) | Removed — design docs are all Approved/frozen |
| FRICEW terminology explanation | Removed — assumed knowledge by build phase |
| ~128 lines | ~160 lines — denser, all actionable patterns |

### 3.3 Sprint Update Protocol

At the start of each sprint, update the "Current Sprint" block in CLAUDE.md:

```markdown
**Sprint:** W{n}-S{n} — {Focus}
**Branch:** sprint/W{n}-S{n}
**Goal:** {Sprint Goal from PM-001}
**Stories:** {FRICEW IDs}
```

This is the only section that changes sprint-to-sprint. Everything else is stable.

---

## 4. Scaffold Prompt

The very first prompt in the playbook. Creates the project skeleton — every config file, folder, and stub — before any business logic. This is a single Claude Code session that produces the first commit on `sprint/W1-S1`.

### 4.1 Pre-Requisites (Sandro does manually)

Before pasting the scaffold prompt:

1. **Install prerequisites** — Node.js 20 LTS, PostgreSQL (Windows service running), `@sap/cds-dk` globally (`npm i -g @sap/cds-dk`)
2. **Replace CLAUDE.md** — Overwrite the current design-phase CLAUDE.md with the build-phase version from BP-001 §3.1
3. **Initialize git** — `git init` in the project root, then `git add CLAUDE.md && git commit -m "chore: initialize repo with build-phase CLAUDE.md"`

### 4.2 Prompt Text

```
Scaffold the Financial Planner CAP project. Create the complete project skeleton — config files, folder structure, CDS stubs, shared modules, test infrastructure — ready for W1-S1 business logic. No business entities yet, just the framework.

Reference these design docs for exact values:
- TECH_STACK.md §7 — folder structure
- TECHNICAL_STANDARDS.md §4 — tsconfig.json settings
- TECHNICAL_STANDARDS.md §5 — BaseFacade/BaseService/wrapHandler pattern
- TECHNICAL_STANDARDS.md §7 — Logger class
- TECHNICAL_STANDARDS.md §8 — i18n file structure
- TECHNICAL_STANDARDS.md §9 — EncryptionUtility
- TECHNICAL_STANDARDS.md §10 — ESLint config
- TEST_STRATEGY.md §3.3 — jest.config.ts
- TEST_STRATEGY.md §12 — test report script
- VERSION_CONTROL.md §3.1 — .gitignore
- THEME.md §7 — theme-overrides.css (all 28 CSS custom properties)

Create the following:

**1. CAP project init + config:**
- Run `cds init --add typescript` (or equivalent manual setup)
- `package.json` with dependencies: @sap/cds, @cap-js/postgres, @cap-js/cds-types, axios, papaparse, fuse.js, node-cron, cheerio
- Dev dependencies: typescript, ts-jest, jest, @types/jest, eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, @sap/eslint-plugin-cds, eslint-plugin-jsdoc, eslint-plugin-import, ts-node
- `tsconfig.json` per TECHNICAL_STANDARDS.md §4.1
- `.cdsrc.json` with PostgreSQL config for local deployment
- `.env` with placeholder ENCRYPTION_KEY (generate a real 256-bit hex key)
- `.gitignore` per VERSION_CONTROL.md §3.1

**2. CDS schema stubs (namespace com.financialplanner):**
- `db/enums.cds` — empty file with namespace, comment "All enum types defined here"
- `db/common/common.cds` — shared aspects (cuid, managed from @sap/cds/common)
- 9 domain schema files — each with namespace + using common, empty body, comment listing target entities:
  - db/reference/schema.cds (16 entities)
  - db/cards/schema.cds (7 entities)
  - db/transactions/schema.cds (5 entities)
  - db/points/schema.cds (2 entities)
  - db/budget/schema.cds (4 entities)
  - db/financial/schema.cds (2 entities)
  - db/integration/schema.cds (2 entities)
  - db/alerts/schema.cds (1 entity)
- `db/seed/` — empty folder (seed CSVs added during CNV-002)

**3. CDS service definitions (4 services):**
- `srv/transaction-service.cds` — TransactionService at /service/transactionSvcs (empty body)
- `srv/churning-service.cds` — ChurningService at /service/churningSvcs (empty body)
- `srv/budget-service.cds` — BudgetService at /service/budgetSvcs (empty body)
- `srv/admin-service.cds` — AdminService at /service/adminSvcs (empty body)
- 4 corresponding TypeScript entry points (*.ts) — minimal, just extending cds.ApplicationService

**4. Shared modules (srv/modules/shared/):**
- `BaseFacade.ts` — wrapHandler implementation per TECHNICAL_STANDARDS.md §5.2
- `BaseService.ts` — base class for services
- `Logger.ts` — structured JSON logger per TECHNICAL_STANDARDS.md §7 (console + file output, correlation IDs, _redact)
- `MessagingUtility.ts` — i18n message helper per TECHNICAL_STANDARDS.md §6.3
- `constants.ts` — empty, with comment "App-wide constants"

**5. Utilities (srv/util/):**
- `EncryptionUtility.ts` — AES-256-GCM encrypt/decrypt per TECHNICAL_STANDARDS.md §9
- `DateTimeUtility.ts` — stub with common date helpers (formatDate, startOfMonth, endOfMonth)
- `CurrencyUtility.ts` — stub with formatCAD helper

**6. Domain module folders (empty — ready for W1-S1 stories):**
- srv/modules/transaction/
- srv/modules/categorization/
- srv/modules/churning/
- srv/modules/budget/
- srv/modules/eligibility/
- srv/modules/recommendation/
- srv/modules/integration/

**7. i18n files:**
- `srv/_i18n/i18n.properties` — header comment only
- `srv/_i18n/messages.properties` — header comment + common messages (entity.notFound, validation.required)

**8. App shared resources:**
- `app/shared/BaseController.js` — extends sap.ui.core.mvc.Controller, provides getRouter, getModel, setModel helpers
- `app/shared/css/theme-overrides.css` — full CSS from THEME.md §7 (all 28 custom properties in :root block + Layer 2 selectors placeholder)
- `app/shared/util/formatter.js` — stubs for formatCurrency, formatDate, formatStatus
- `app/shared/controls/VizFrameCard.js` — stub extending sap.ui.core.Control
- `app/shared/controls/ApexChartCard.js` — stub extending sap.ui.core.Control

**9. Shell entry point:**
- `app/index.html` — SAPUI5 bootstrap loading sap_horizon from CDN, theme-overrides.css link after bootstrap, shell container for side navigation + content area. Reference DESIGN_SYSTEM.md §4 for nav structure and INFORMATION_ARCHITECTURE.md §2 for the 23 nav entries (5 groups). Nav items hidden until built per wave-gating (D-307) — only show items relevant to W1-S1 initially.

**10. ESLint config:**
- `eslint.config.mjs` — flat config per TECHNICAL_STANDARDS.md §10. Include all rules, custom architectural rules as comments (implemented later as actual plugins), test file overrides.

**11. Test infrastructure:**
- `jest.config.ts` per TEST_STRATEGY.md §3.3 + §8.3
- `test/data/factories.ts` — empty export, ready for factory functions
- `test/data/reference.ts` — empty export
- Empty folders: test/unit/, test/integration/, test/integration/scenarios/, test/data/integration/
- `scripts/generate-test-report.ts` — per TEST_STRATEGY.md §12
- `scripts/generate-key.ts` — generates random 256-bit hex key, writes to .env

**12. Project tracking:**
- `project/SPRINT_BOARD.md` — initialized for W1-S1 with CNV-002, CNV-003, FRM-009 in Backlog
- `project/DEFECT_LOG.md` — empty table with headers
- Empty folder: project/sprints/, project/test-reports/

After creating everything:
- Run `npm install`
- Run `npx tsc --noEmit` to verify TypeScript compiles
- Run `npx eslint .` to verify linting passes
- Run `cds build` to verify CDS compiles
- Fix any issues before finishing

Create the sprint branch first: `git checkout -b sprint/W1-S1`
Commit as: `chore(config): scaffold project structure`
```

### 4.3 Review After Execution

After Claude Code completes the scaffold prompt, verify:

| Check | How |
|-------|-----|
| Folder structure matches TS-001 §7 | `ls -R` or tree view — compare against TECH_STACK.md §7 |
| `npm install` succeeds | No dependency resolution errors |
| `npx tsc --noEmit` passes | No TypeScript compilation errors |
| `cds build` passes | No CDS compilation errors |
| `.env` has a real ENCRYPTION_KEY | 64 hex characters (256-bit) |
| `.gitignore` covers all entries from VC-001 §3.1 | Compare against VERSION_CONTROL.md |
| `theme-overrides.css` has all 28 properties | Compare against THEME.md §7.1 |
| `wrapHandler` in BaseFacade.ts matches §5.2 pattern | Logger context, ENTRY/EXIT logs, error re-throw |
| `EncryptionUtility` encrypt/decrypt round-trips | Quick manual test or verify test exists |
| ESLint config has all rules from §10.3 | Spot-check key rules |
| Jest config has coverage thresholds from §8.3 | Global 85%/80%, Validator 100%/100% |
| Sprint board initialized for W1-S1 | 3 stories in Backlog |
| On branch `sprint/W1-S1` | `git branch` shows active branch |

### 4.4 Pass/Fail Checklist

All must pass before moving to the next prompt:

- [ ] `npm install` — clean exit
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `cds build` — zero errors
- [ ] `npx eslint .` — zero errors (warnings acceptable)
- [ ] `.env` exists with `ENCRYPTION_KEY`
- [ ] All 9 schema stubs exist under `db/`
- [ ] All 4 service definitions + entry points exist under `srv/`
- [ ] `BaseFacade.ts`, `BaseService.ts`, `Logger.ts`, `MessagingUtility.ts` exist
- [ ] `EncryptionUtility.ts` compiles and exports `encrypt`/`decrypt`
- [ ] `theme-overrides.css` has `:root` block with 28 properties
- [ ] `index.html` boots SAPUI5 with `sap_horizon` theme
- [ ] `jest.config.ts` exists with coverage thresholds
- [ ] `project/SPRINT_BOARD.md` shows W1-S1 stories
- [ ] Committed on `sprint/W1-S1` branch

---

## 5. Sprint Checklists

Per-sprint definition of done. Everything in the baseline checklist (§5.1) plus sprint-specific checks must pass before the `--no-ff` merge to `main` and annotated tag.

### 5.1 Baseline Checklist (Every Sprint)

Applied at every sprint checkpoint meeting (PM-001 §5). Maps to the Definition of Done (PM-001 §7) and code review checklists (D-73).

**Build & Compile:**

- [ ] `npm test` — all tests pass
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `cds build` — zero errors
- [ ] `npx eslint .` — zero errors (warnings acceptable)

**Coverage (TS-003 §8):**

- [ ] New Validators: 100% line, 100% branch
- [ ] New Utilities: 100% line, 100% branch
- [ ] New Services: ≥90% line, ≥85% branch
- [ ] Overall project: ≥85% line, ≥80% branch

**Quality:**

- [ ] No Critical or High severity defects open against delivered stories
- [ ] All functional spec requirements met for delivered FRICEW objects
- [ ] TDD followed — test files committed before or with implementation

**Security (D-73 §12.3):**

- [ ] No decrypted sensitive data in logs or OData responses
- [ ] `_enc` fields only via EncryptionUtility
- [ ] `.env` in `.gitignore`

**UX/Design (D-73 §12.6):**

- [ ] UI matches design system — Horizon theme, compact density, semantic colors
- [ ] Theme overrides applied (charcoal brand, 0 border radius)
- [ ] Tables: 100% column widths, titles with counts, search, personalization

**Docs (D-73 §12.5):**

- [ ] JSDoc descriptions on all new methods
- [ ] i18n keys for all user-visible strings
- [ ] Sprint board updated — all stories moved to Done
- [ ] Defect log updated — new defects logged, fixed defects closed

**Git (VC-001):**

- [ ] All commits on `sprint/W{n}-S{n}` branch
- [ ] Conventional Commit format with FRICEW IDs in body
- [ ] Co-Authored-By on all agent commits
- [ ] Ready for `--no-ff` merge + `v{wave}.{sprint}` tag

### 5.2 Per-Sprint Additions

#### W1-S1 — Foundation & Seed Data

| Stories | CNV-002, CNV-003, FRM-009 |
|---------|--------------------------|
| **Sync point validated** | #1 — Reference data deployed, #2 — Card portfolio populated |

Sprint-specific checks:

- [ ] `cds deploy` succeeds — all seed CSVs loaded into PostgreSQL
- [ ] All 18 System Config values queryable via OData
- [ ] 12 issuers, 14 rewards programs, 13 purchase types, 14 earning categories seeded (CNV-002)
- [ ] 13 active + 3 closed Card Instances with Market Cards, Offers, Earning Multipliers seeded (CNV-003)
- [ ] FRM-009 CRUD functional — can create/read/update/delete reference data via Fiori Elements
- [ ] Budget Allocation 100% constraint warning works
- [ ] AdminService integration tests pass

#### W1-S2 — Ingestion Pipeline

| Stories | ENH-008, INT-001, INT-002, FRM-003, FRM-010 |
|---------|---------------------------------------------|
| **Sync point validated** | #3 — Transaction ingestion operational |

Sprint-specific checks:

- [ ] INT-001: SimpleFIN mock sync creates Transaction records with `source = 'simplefin'`
- [ ] INT-002: CSV parsing works for all 4 issuer formats (Scotia, TD, CIBC, Amex)
- [ ] ENH-008: Dedup correctly categorizes new / duplicate / reconciliation
- [ ] FRM-003: CSV wizard end-to-end — upload → review tabs → save
- [ ] FRM-010: Connection list shows health status, manual sync trigger works
- [ ] Provider Connection access URL stored encrypted
- [ ] Alert generation works for connection_error, stale_data, unmapped_account
- [ ] TransactionService integration tests pass

#### W1-S3 — Transaction Processing

| Stories | ENH-001, ENH-009, FRM-001, CNV-001 |
|---------|-------------------------------------|
| **Sync point validated** | #4 — Categorization engine trained |

Sprint-specific checks:

- [ ] ENH-001: Matching pipeline (exact → starts-with → contains) returns correct vendor + dual taxonomy
- [ ] ENH-001: User correction auto-creates Merchant Pattern
- [ ] ENH-009: Split creates TransactionSplit with mySharePct/myShareAmount
- [ ] FRM-001: Transaction grid with inline editing, split action, bulk categorization functional
- [ ] CNV-001: Historical backfill loads ~1,200-1,400 transactions across 4 issuers
- [ ] Vendor Category Stats CDS view returns correct counts
- [ ] Merchant Patterns bootstrapped from backfill corrections
- [ ] CSV import scenario test passes (FRM-003 → ENH-001 → review)

#### W1-S4 — Computation Engines

| Stories | ENH-003, ENH-006, ENH-007, FRM-007 |
|---------|-------------------------------------|
| **Sync point validated** | #5 — Computation engines deliver data |

Sprint-specific checks:

- [ ] ENH-003: Per-tranche MSR progress computation correct (one-time + monthly recurring)
- [ ] ENH-003: Auto-creates PointsAdjustment when tranche met
- [ ] ENH-003: Generates msr_deadline, bonus_met, bonus_missed alerts
- [ ] ENH-006: Per-program points balance = (transactions × multipliers) + adjustments − redemptions
- [ ] ENH-007: Budget computation = income − goal allocations, per-PT ratio split
- [ ] ENH-007: Split transactions use myShareAmount for budget
- [ ] ENH-007: Generates 4 budget alert types
- [ ] FRM-007: Income entry CRUD with Copy from Previous Month action
- [ ] ChurningService + BudgetService integration tests pass

#### W1-S5 — UI + Dashboards

| Stories | FRM-004, FRM-006, RPT-001 (partial), RPT-002 (partial), WFL-001, WFL-002 |
|---------|--------------------------------------------------------------------------|
| **Sync point validated** | #6 — Dashboard shells accept new sections |

Sprint-specific checks:

- [ ] FRM-004: My Cards list + object page with bonus progress, earning & perks, fee history, lifecycle timeline
- [ ] FRM-006: Card onboarding wizard end-to-end — select → offer → instance → optional SimpleFIN link
- [ ] RPT-001 W1 sections: bonus progress, points balances, CC spend by card, upcoming fees, alerts
- [ ] RPT-002 W1 sections: budget overview, spending vs budget by category, on-track indicators
- [ ] RPT-001/002 code is modular — new sections can be added without rewriting
- [ ] WFL-001: Weekly review journey works end-to-end (connection health → CSV → review → dashboards)
- [ ] WFL-002: Card lifecycle state machine (Focus → Active → To Cancel → Closed)
- [ ] WFL-002: Focus→Active auto-triggers when all bonus tranches met
- [ ] Frontend tests: QUnit for shared resources, OPA5 for FRM-001 and FRM-003
- [ ] Card onboarding scenario test passes
- [ ] **Wave 1 checkpoint:** Full weekly session testable

#### W2-S1 — Churning Depth

| Stories | ENH-002, ENH-004, ENH-005, FRM-002, RPT-001 (complete), RPT-002 (complete) |
|---------|-----------------------------------------------------------------------------|
| **Sync point validated** | #7 — W2 engines expose standard interfaces |

Sprint-specific checks:

- [ ] ENH-002: Recommendation returns optimal card per earning category, with bonus override logic
- [ ] ENH-004: Per-issuer eligibility (eligible_now / eligible_in_X_days / not_eligible)
- [ ] ENH-004: Handles Amex credit vs charge, personal vs business, Aeroplan 5-tier limit
- [ ] ENH-005: Net value = (points×CPP + perks − fees), FYF year-1 handling correct
- [ ] FRM-002: Manual transaction entry with vendor fuzzy match and card recommendation display
- [ ] RPT-001: All sections functional (recommendation, eligibility, profitability, yield trend added)
- [ ] RPT-002: All sections functional (goal progress, top vendors added)
- [ ] **Wave 2 partial checkpoint:** Both dashboards feature-complete

#### W2-S2 — Goals & Reports

| Stories | FRM-008, RPT-004, RPT-006, RPT-011 |
|---------|-------------------------------------|

Sprint-specific checks:

- [ ] FRM-008: Goal CRUD with target amount, timeline, monthly allocations, transaction linking
- [ ] RPT-004: Trophy Case — redemption register with CRUD, KPI tags, CPP semantic coloring
- [ ] RPT-006: Recommendation matrix — all active cards × all earning categories
- [ ] RPT-011: Goal progress — active goals with progress bars, projections
- [ ] ENH-007 correctly uses goal allocations in budget computation
- [ ] **Wave 2 checkpoint:** Card recommendations and eligibility visible

#### W3-S1 — Analytics & Financial Picture

| Stories | FRM-005, FRM-011, RPT-003, RPT-005, RPT-007 |
|---------|----------------------------------------------|

Sprint-specific checks:

- [ ] FRM-005: Market Cards — Fiori Elements list + object page with full CRUD, offer history chart, quick-compare
- [ ] FRM-011: Financial picture entry — investments and debts, monthly snapshots
- [ ] RPT-003: Financial dashboard — net worth, debt trending, investment trending
- [ ] RPT-005: Card analytics — per-card spend, points, profitability breakdown
- [ ] RPT-007: Spending trends — multi-month time-series by category

#### W3-S2 — Remaining Reports

| Stories | RPT-008, RPT-009, RPT-010, RPT-012 |
|---------|-------------------------------------|

Sprint-specific checks:

- [ ] RPT-008: Perk tracker — cross-card soft perks, realized vs unrealized, remaining value
- [ ] RPT-009: Annual summary — year-in-review with totals
- [ ] RPT-010: Points dashboard — per-program view with Transfer Points and Manual Adjustment actions
- [ ] RPT-012: Income vs expenses — multi-month macro with savings rate
- [ ] **Wave 3 checkpoint:** All analytical reports available. Financial picture complete.

#### W4-S1 — Market Intelligence

| Stories | CNV-004, INT-003, WFL-003 |
|---------|--------------------------|

Sprint-specific checks:

- [ ] CNV-004: Market card database populated (~50-100 cards, ~150-500 offer variants)
- [ ] INT-003: Web scraper fetches and parses offer data from configured sources
- [ ] WFL-003: Offer approval gate — scraped offers queued → user reviews → approved enters database
- [ ] Scraper scenario test passes (scrape → queue → approve)
- [ ] **Wave 4 checkpoint:** Full system operational. All 43 FRICEW objects delivered.
- [ ] **Go-live readiness:** Tag `v1.0.0` after final validation

### 5.3 Merge & Tag Procedure

After the checklist passes, execute the sprint close:

```bash
# 1. Merge to main
git checkout main
git merge --no-ff sprint/W{n}-S{n} -m "merge: sprint W{n}-S{n} — {Sprint Goal}

Delivers: {FRICEW IDs}"

# 2. Tag
git tag -a v{wave}.{sprint} -m "Wave {n} Sprint {n} — {Sprint Goal} ({FRICEW IDs})"

# 3. Clean up
git branch -d sprint/W{n}-S{n}

# 4. Next sprint (if not last)
git checkout -b sprint/W{n}-S{next}
```

Update CLAUDE.md "Current Sprint" block for the new sprint.

---

## 6. Prompt Playbook

Ordered sequence of prompts, grouped by sprint. Sandro pastes each prompt into a fresh Claude Code session. The scaffold prompt (§4) is executed first — all playbook prompts assume the project skeleton exists.

**How to use:**

1. Execute the scaffold prompt (§4) once — it creates the project skeleton and first commit on `sprint/W1-S1`
2. Work through sprints in order — W1-S1 through W4-S1
3. Within each sprint, execute prompts in sequence — each builds on the previous
4. After each prompt, verify the pass/fail items before moving to the next
5. At sprint end, run the sprint checklist (§5) and merge procedure (§5.3)

**Prompt conventions:**

- Prompts reference design docs by ID — Claude Code reads them for exact business rules
- TDD is assumed for all backend stories: write failing tests → implement → verify green
- Commit format is specified per prompt — Claude Code creates the commit
- Sprint board updates happen within each prompt

---

### 6.1 Sprint W1-S1 — Foundation & Seed Data

**Branch:** `sprint/W1-S1` (created during scaffold)
**Goal:** Reference data seeded, config tables editable via SM30-style CRUD
**Stories:** CNV-002, CNV-003, FRM-009

#### Prompt 1: CNV-002 — Reference Data Seed

```
Implement CNV-002 (Reference Data Seed) per SPEC-06 §4.2.

Read SPEC-06 §4.2 for full seed data lists. Read DATA_MODEL.md for entity definitions.

**CDS Models:**
Define all reference data entities in `db/reference/schema.cds` per DATA_MODEL.md §3 (16 entities):
- Issuer, RewardsProgram, Network, PurchaseType, EarningCategory, IncomeSourceType, RedemptionType
- IssuerApplicationRule, CreditScoreRange, AccountType, FinancialAccountType
- CSVFormatConfig, SystemConfig, AlertType, BudgetPeriod, CurrencyCode

Define enum types in `db/enums.cds` per DATA_MODEL.md §2.

**Seed Data:**
Create CSV files in `db/seed/` per SPEC-06 §4.2 seeding lists:
- 12 issuers (Big 5 banks + Amex + others per SPEC-06)
- 14 rewards programs with CPP valuations
- 13 purchase types with budget allocation defaults
- 14 earning categories
- 6 income source types
- Card networks, redemption types, credit score ranges
- 18 System Config parameters (all keys and default values from specs)
- 23 Alert Type seeds (all alert type keys referenced across all specs)
- CSV format configs for 4 issuers (Scotia, TD, CIBC, Amex) — reference actual CSV samples in `design/actual-csvs/`

Verify `cds deploy` loads all seed data successfully.

Update sprint board: move CNV-002 to In Progress, then Done.

Commit: `seed(db): add reference data entities and seed CSV files

Delivers CNV-002 — 16 reference entities with seed data.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- All 16 reference entities defined in `db/reference/schema.cds`
- Enum types in `db/enums.cds` match DATA_MODEL.md §2
- CSV files in `db/seed/` load without errors
- CSVFormatConfig entries match actual CSV sample formats

**Pass/fail:**

- [ ] `cds deploy` succeeds — all CSVs loaded
- [ ] 12 issuers queryable via OData
- [ ] 18 System Config values present
- [ ] 23 Alert Types present
- [ ] CSV format configs cover 4 issuers
- [ ] `cds build` clean

#### Prompt 2: CNV-003 — Card Portfolio Seed

```
Implement CNV-003 (Card Portfolio Seed) per SPEC-06 §4.3.

Read SPEC-06 §4.3 for Sandro's card portfolio details. Read DATA_MODEL.md for card entity definitions.

**CDS Models:**
Define card entities in `db/cards/schema.cds` per DATA_MODEL.md §4 (7 entities):
- MarketCard, Offer, OfferTranche, CardInstance, EarningMultiplier, SoftPerkDefinition, CardPerk

CardInstance includes encrypted fields: `cardNumberEnc`, `cvvFrontEnc`, `cvvBackEnc`, `expiryDateEnc` — all String type in CDS, encryption handled at service layer.

**Seed Data:**
Create CSV files in `db/seed/` for Sandro's portfolio per SPEC-06 §4.3:
- Market cards for each product Sandro holds
- Offers with tranches (multi-tranche where applicable per D-24)
- 13 active + 3 closed Card Instances with lifecycle states
- Earning multipliers per card per earning category
- Soft perk definitions and CardPerk tracking records

Use fake data for encrypted fields (card numbers, CVV, expiry) — real values entered through FRM-004 later.

Verify `cds deploy` loads all card seed data.

Update sprint board: move CNV-003 to In Progress, then Done.

Commit: `seed(db): add card portfolio entities and seed data

Delivers CNV-003 — Sandro's 16-card portfolio with offers, multipliers, perks.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- 7 card entities defined in `db/cards/schema.cds`
- Card Instance count: 13 active + 3 closed = 16 total
- Each card has a Market Card, Offer (with tranches), and Earning Multipliers
- Lifecycle states correctly set (Focus for newest cards, Active/Closed for others)

**Pass/fail:**

- [ ] `cds deploy` succeeds with card seed data
- [ ] 16 Card Instances queryable
- [ ] Market Cards linked correctly
- [ ] Offers have OfferTranches
- [ ] EarningMultipliers populated per card

#### Prompt 3: FRM-009 — Admin CRUD

```
Implement FRM-009 (Master Data CRUD) per SPEC-06 §4.1.

Read SPEC-06 §4.1 for admin CRUD requirements.

**Backend:**
Expose all reference data entities through AdminService in `srv/admin-service.cds`. Read-write access for all 16 reference entities + card entities that need admin editing.

Create the AdminService handler files:
- `srv/modules/admin/AdminFacade.ts` — handler registration with wrapHandler
- `srv/modules/admin/AdminService.ts` — business logic (Budget Allocation 100% constraint per D-94)
- `srv/modules/admin/AdminValidator.ts` — input validation

TDD: Write unit tests first for AdminValidator (Budget Allocation sum constraint, required field validation). Then AdminService tests with mocked CDS.

Write integration tests in `test/integration/admin-service.test.ts` — CRUD operations against all exposed entities.

**Frontend:**
Create `app/admin-master-data/` — Fiori Elements List Report + Object Page for each reference entity. Use entity-based annotation files in `app/admin-master-data/annotations/`.

SM30-style: straightforward table → detail page for each entity. Key features per SPEC-06 §4.1:
- Budget Allocation: warning when percentages don't sum to 100%
- System Config: key-value editor with description
- CSV Format Config: column mapping editor

Reference DESIGN_SYSTEM.md for table standards (compact, column widths, search, personalization).

Update sprint board: move FRM-009 to In Progress, then Done.

Commit: `feat(admin): add SM30-style CRUD for reference data

Delivers FRM-009 — AdminService exposing all reference entities
with Fiori Elements List Report + Object Page.
Budget Allocation 100% constraint enforced.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- AdminService exposes all reference + card entities
- Facade → Service → Validator pattern followed
- Budget Allocation constraint works (warning when sum ≠ 100%)
- Fiori Elements app renders with correct annotations
- Integration tests cover CRUD operations

**Pass/fail:**

- [ ] AdminService integration tests pass
- [ ] AdminValidator unit tests pass
- [ ] Budget Allocation 100% constraint fires correctly
- [ ] Fiori Elements app loads — list + detail pages
- [ ] `cds build` + `tsc --noEmit` clean
- [ ] Run sprint checklist §5.2 W1-S1 before merge

---

### 6.2 Sprint W1-S2 — Ingestion Pipeline

**Branch:** `sprint/W1-S2`
**Goal:** Transactions flow from SimpleFIN and CSV into the system. Connection health visible.
**Stories:** ENH-008, INT-001, INT-002, FRM-003, FRM-010

#### Prompt 1: ENH-008 — Deduplication Engine

```
Implement ENH-008 (Deduplication Engine) per SPEC-01 §4.3.

Read SPEC-01 §4.3 for dedup rules. Read DATA_MODEL.md for Transaction entity.

**CDS Models:**
Define transaction entities in `db/transactions/schema.cds` per DATA_MODEL.md §5 (5 entities):
- Transaction, TransactionSplit, Vendor, MerchantPattern, TransactionTag

Transaction has fields: externalId, source, amount, transactionDate, postDate, rawDescription, normalizedDescription, categorizationStatus, etc.

**Backend:**
Create `srv/modules/integration/DeduplicationService.ts`:
- `evaluate(transaction)` → returns `new` / `duplicate` / `reconciliation`
- Matching logic per SPEC-01 §4.3: externalId exact match, then fuzzy match on (date + amount + description + cardInstance)
- Reconciliation = SimpleFIN match for a previously CSV-imported transaction

TDD:
1. Write DeduplicationValidator tests — input validation
2. Write DeduplicationService tests — mock CDS, test all 3 outcomes (new, duplicate, reconciliation)
3. Implement to green

No UI for this story — ENH-008 is a backend engine consumed by INT-001 and INT-002.

Update sprint board: move ENH-008 to In Progress, then Done.

Commit: `feat(integration): add deduplication engine

Delivers ENH-008 — evaluate() returns new/duplicate/reconciliation.
ExternalId exact match + fuzzy fallback on date+amount+description.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- Transaction entities defined in `db/transactions/schema.cds`
- DeduplicationService.evaluate() handles all 3 outcomes
- Reconciliation logic correctly identifies CSV→SimpleFIN matches

**Pass/fail:**

- [ ] Transaction entity compiles in CDS
- [ ] DeduplicationService unit tests pass
- [ ] All 3 outcomes tested: new, duplicate, reconciliation
- [ ] `tsc --noEmit` clean

#### Prompt 2: INT-001 + FRM-010 — SimpleFIN Sync & Connection Manager

```
Implement INT-001 (SimpleFIN Sync) and FRM-010 (Connection Manager) per SPEC-01 §4.1 and §4.5.

Read SPEC-01 §4.1 (INT-001) and §4.5 (FRM-010) for full details.

**Backend — INT-001:**
Create `srv/modules/integration/SimpleFINService.ts`:
- `syncTransactions(connectionId)` — calls SimpleFIN Bridge API via axios
- Parses response, normalizes descriptions, maps accounts to CardInstances
- Calls DeduplicationService.evaluate() for each transaction
- Creates Transaction records with `source = 'simplefin'`, `externalId` populated
- Updates ProviderConnection lastSyncAt, syncStatus
- Stores access URL encrypted via EncryptionUtility

Define integration entities in `db/integration/schema.cds` per DATA_MODEL.md §7:
- ProviderConnection, ProviderAccount

Create `srv/modules/integration/SimpleFINFacade.ts` and `SimpleFINValidator.ts`.

Add scheduling via node-cron in `srv/modules/integration/SchedulingService.ts`:
- Poll interval from SystemConfig `SIMPLEFIN_POLL_INTERVAL_HOURS`
- Uses `cds.spawn()` for background execution

**Frontend — FRM-010:**
Create `app/connection-manager/` — Fiori Elements list of ProviderConnections with:
- Health status (ObjectStatus — Connected/Error/Stale per SPEC-01 §4.5)
- Last sync time
- Manual "Sync Now" action button
- Account mapping display

Reference DESIGN_SYSTEM.md for status indicators.

**Testing:**
- Unit tests: SimpleFINValidator, SimpleFINService (mock axios responses, mock DeduplicationService)
- Integration tests: Sync flow with mocked HTTP (TransactionService integration test file)
- Alert generation: connection_error, stale_data, unmapped_account

Update sprint board: move INT-001 and FRM-010 to In Progress, then Done.

Commit: `feat(integration): add SimpleFIN sync and connection manager

Delivers INT-001 — SimpleFIN Bridge sync with dedup, scheduling, encrypted access URL.
Delivers FRM-010 — connection health dashboard with manual sync trigger.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- SimpleFIN API call structure matches SimpleFIN Bridge spec (research/simplefin-research.md)
- Access URL stored encrypted, never logged
- Dedup called for every incoming transaction
- Scheduling respects SystemConfig poll interval
- Connection Manager shows health with correct semantic colors

**Pass/fail:**

- [ ] SimpleFINService unit tests pass (mocked HTTP)
- [ ] ProviderConnection access URL stored encrypted
- [ ] Manual sync trigger creates Transaction records
- [ ] Connection health status displays correctly
- [ ] Alert generation works for 3 alert types
- [ ] `cds build` + `tsc --noEmit` clean

#### Prompt 3: INT-002 + FRM-003 — CSV Parsing & Import Wizard

```
Implement INT-002 (CSV Parsing) and FRM-003 (CSV Import Wizard) per SPEC-01 §4.2 and §4.4.

Read SPEC-01 §4.2 (INT-002) and §4.4 (FRM-003) for full details. Reference `design/actual-csvs/` for real CSV samples from all 4 issuers.

**Backend — INT-002:**
Create `srv/modules/integration/CSVImportService.ts`:
- `parseFile(fileContent, cardInstanceId)` — uses papaparse
- Reads CSVFormatConfig for the card's issuer to determine: column mapping, date format, amount sign handling, header rows to skip
- Returns parsed rows with normalized fields
- Calls DeduplicationService.evaluate() for each row
- Groups results: new transactions, duplicates (auto-skipped), reconciliations (flagged for review)

Create `CSVImportValidator.ts` — validates file format, required columns, date parsing.

**Frontend — FRM-003:**
Create `app/csv-import/` — Freestyle wizard (not Fiori Elements) per SPEC-01 §4.4:
- Step 1: Select card → upload CSV file
- Step 2: Preview parsed transactions in review table (3 tabs: New, Duplicates, Reconciliations per D-89)
- Step 3: Confirm → save new transactions, handle reconciliations

Wizard extends BaseController. XML views only. Use shared formatter for dates/currency.

**Testing:**
- Unit tests: CSVImportValidator (file validation, format detection), CSVImportService (parse each issuer format)
- Test with real CSV column structures from `design/actual-csvs/`
- Integration test: full upload → parse → save flow

Update sprint board: move INT-002 and FRM-003 to In Progress, then Done.

Commit: `feat(integration): add CSV parsing engine and import wizard

Delivers INT-002 — papaparse-based parser with per-issuer CSVFormatConfig.
Delivers FRM-003 — 3-step freestyle wizard with review tabs.
Tested against all 4 issuer CSV formats.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- CSV parsing handles all 4 issuer formats correctly
- Amount sign handling correct per issuer (some report negative for purchases)
- Date format parsing works for each issuer's format
- Wizard UX: preview shows transaction counts, tab switching works

**Pass/fail:**

- [ ] CSV parsing works for Scotia, TD, CIBC, Amex formats
- [ ] Dedup correctly separates new/duplicate/reconciliation
- [ ] Wizard renders 3 steps with correct navigation
- [ ] Review tabs show correct transaction groupings
- [ ] Save creates Transaction records with `source = 'csv'`
- [ ] Integration test passes end-to-end
- [ ] Run sprint checklist §5.2 W1-S2 before merge

---

### 6.3 Sprint W1-S3 — Transaction Processing

**Branch:** `sprint/W1-S3`
**Goal:** Transactions categorized, splits supported, historical data backfilled
**Stories:** ENH-001, ENH-009, FRM-001, CNV-001

#### Prompt 1: ENH-001 — Categorization Engine

```
Implement ENH-001 (Categorization Engine) per SPEC-02 §4.1.

Read SPEC-02 §4.1 for categorization pipeline rules. Read SPEC-02 §5 for business rules.

**Backend:**
Create `srv/modules/categorization/CategorizationService.ts`:
- `categorize(transaction)` — three-pass matching pipeline:
  1. Exact match on rawDescription → MerchantPattern
  2. Starts-with match
  3. Contains match (with fuse.js fuzzy fallback)
- Match assigns: vendor_ID, purchaseType_ID, earningCategory_ID
- Sets categorizationStatus: auto_categorized / needs_review / manual
- High-confidence matches (exact) auto-categorize; fuzzy matches flag for review

Create `CategorizationValidator.ts` — validates correction inputs.

**User Correction Flow:**
- `correctCategorization(transactionId, vendorId, purchaseTypeId, earningCategoryId)`:
  - Updates transaction
  - Auto-creates or updates MerchantPattern for the raw description
  - Updates VendorCategoryStats (CDS view — stats derived from data)

**Vendor entity:**
Ensure Vendor and MerchantPattern are defined in `db/transactions/schema.cds`.
Vendor has normalizedName, displayName. MerchantPattern links rawDescription patterns to Vendors + dual taxonomy.

**VendorCategoryStats CDS view:**
Define in `db/transactions/schema.cds` as a CDS view per DATA_MODEL.md — aggregates correction counts per vendor+category pair.

**Testing — TDD:**
1. CategorizationValidator tests — correction input validation
2. CategorizationService tests:
   - Exact match returns auto_categorized
   - Starts-with match works
   - Fuzzy match flags needs_review
   - No match returns needs_review with no assignments
   - User correction creates MerchantPattern
   - Subsequent identical description auto-categorizes via learned pattern

Update sprint board: move ENH-001 to In Progress, then Done.

Commit: `feat(categorization): add three-pass categorization engine

Delivers ENH-001 — exact/starts-with/fuzzy matching pipeline.
User corrections auto-create MerchantPatterns for learning.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- Three-pass pipeline priority order is correct
- User correction creates MerchantPattern with correct pattern text
- Dual taxonomy assigned independently (purchaseType for budget, earningCategory for churning)
- VendorCategoryStats CDS view exists
- fuse.js configured with appropriate threshold

**Pass/fail:**

- [ ] CategorizationService unit tests pass — all 3 match levels
- [ ] User correction creates MerchantPattern
- [ ] Learned pattern used on next identical description
- [ ] Dual taxonomy independent — one can be set without the other
- [ ] `tsc --noEmit` clean

#### Prompt 2: ENH-009 + FRM-001 — Transaction Splits & Transaction List

```
Implement ENH-009 (Transaction Splits) and FRM-001 (Transaction List) per SPEC-02 §4.2 and §4.3.

Read SPEC-02 §4.2 (ENH-009 splits) and §4.3 (FRM-001 list).

**Backend — ENH-009:**
Create `srv/modules/transaction/TransactionService.ts`:
- `splitTransaction(transactionId, splits)` — creates TransactionSplit records
- Each split has mySharePct and myShareAmount (budget uses myShareAmount; churning uses parent Transaction.amount per D-08)
- Remainder calculation per D-119
- Validation: splits must sum to 100%, minimum 2 splits

Expose through TransactionService CDS definition (`srv/transaction-service.cds`):
- Transaction entity with full CRUD
- TransactionSplit as composition of Transaction
- Actions: splitTransaction, bulkCategorize, correctCategorization

Create transaction handler files:
- `srv/modules/transaction/TransactionFacade.ts`
- `srv/modules/transaction/TransactionService.ts`
- `srv/modules/transaction/TransactionValidator.ts`

**Frontend — FRM-001:**
Create `app/transaction-list/` — Fiori Elements List Report + Object Page:
- List: all transactions with filters (date range, card, categorization status, purchase type, earning category)
- Inline editing for vendor, purchase type, earning category
- Object page: transaction detail with splits section
- Actions: Split, Bulk Categorize (multi-select → assign category)
- Annotations: variant management, search, compact table per DESIGN_SYSTEM.md

**Testing:**
- Unit: TransactionValidator (split sum validation), TransactionService (split creation, bulk categorize)
- Integration: TransactionService CRUD + split + categorize flows

Update sprint board: move ENH-009 and FRM-001 to In Progress, then Done.

Commit: `feat(transaction): add split logic and transaction list

Delivers ENH-009 — split with myShare, remainder handling, sum validation.
Delivers FRM-001 — Fiori Elements transaction grid with inline editing,
split action, bulk categorization.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- Split sum constraint enforced (must equal 100%)
- myShareAmount computed correctly from mySharePct
- Transaction list loads with all filter options
- Inline editing triggers re-categorization where appropriate

**Pass/fail:**

- [ ] Split creates TransactionSplit records summing to 100%
- [ ] Split validation rejects invalid percentages
- [ ] Transaction list Fiori Elements app renders
- [ ] Inline editing works for vendor, purchase type, earning category
- [ ] Bulk categorize action functional
- [ ] Integration tests pass

#### Prompt 3: CNV-001 — Historical Backfill

```
Implement CNV-001 (Historical Backfill) per SPEC-14.

Read SPEC-14 for full backfill requirements. Reference `design/actual-csvs/` for real CSV samples.

**Backend:**
CNV-001 uses INT-002 (CSV parsing, built in W1-S2) to load historical transactions from 2023 onwards. The backfill process:

1. For each issuer/card: parse historical CSV files via CSVImportService
2. Run ENH-008 dedup against existing transactions (SimpleFIN overlap for recent 90 days)
3. Run ENH-001 categorization on each imported transaction
4. Track import progress in ImportLog entity

Define ImportLog in `db/integration/schema.cds` (if not already):
- fileName, importDate, cardInstance_ID, recordsTotal, recordsNew, recordsDuplicate, recordsFailed, status

Create backfill orchestration in `srv/modules/integration/BackfillService.ts`:
- Batch processing with progress tracking
- Handles ~1,200-1,400 total transactions across 4 issuers
- After backfill: MerchantPatterns bootstrapped from user corrections during review
- Categorization confidence improves with each correction

**Frontend:**
No new UI — backfill uses FRM-003 wizard (already built). ImportLog visible through AdminService.

**Testing:**
- Unit: BackfillService (orchestration flow, error handling)
- Integration scenario: `test/integration/scenarios/backfill-scenario.test.ts`
  - Load CSV → dedup → categorize → verify transaction counts

Update sprint board: move CNV-001 to In Progress, then Done.

Commit: `feat(integration): add historical backfill orchestration

Delivers CNV-001 — batch CSV import from 2023, dedup against SimpleFIN overlap,
categorization pipeline bootstrapped. ImportLog tracking.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- Backfill uses existing INT-002 and ENH-008 — no duplication
- ImportLog tracks per-file results
- Dedup handles the 90-day SimpleFIN overlap period

**Pass/fail:**

- [ ] BackfillService unit tests pass
- [ ] Backfill scenario test passes
- [ ] ImportLog records created per file
- [ ] Dedup prevents duplicates in overlap period
- [ ] Categorization runs on all imported transactions
- [ ] Run sprint checklist §5.2 W1-S3 before merge

---

### 6.4 Sprint W1-S4 — Computation Engines

**Branch:** `sprint/W1-S4`
**Goal:** Bonus progress tracked, points balances computed, budget engine running
**Stories:** ENH-003, ENH-006, ENH-007, FRM-007

#### Prompt 1: ENH-003 — Bonus Tracking Engine

```
Implement ENH-003 (Bonus Tracking) per SPEC-04 §4.1.

Read SPEC-04 §4.1 for bonus tracking rules. Read SPEC-04 §5 for business rules.

**CDS Models:**
Define points entities in `db/points/schema.cds` per DATA_MODEL.md §6:
- PointsAdjustment, PointsRedemption

**Backend:**
Create `srv/modules/churning/ChurningService.ts`:
- `getProgress(cardInstanceId)` → per-tranche MSR status
- Tranche statuses: pending, in_progress, met, missed
- Calculation: sum qualifying transactions within each tranche's date window
- Qualifying = transactions on the CardInstance where purchaseType is NOT "Credit Card Fee" (per D-123)
- Multi-tranche support (D-24): sequential tranche evaluation
- Monthly recurring tranches (D-125): evaluated per calendar month

Auto-side effects when tranche met:
- Create PointsAdjustment (type: bonus_earned) for the tranche's bonus points
- Generate bonus_met alert

Auto-effects when tranche window expires unmet:
- Mark tranche as missed
- Generate bonus_missed alert
- Trigger Focus→Active lifecycle transition (WFL-002, delivered W1-S5 — stub the trigger for now)

MSR deadline approaching alert: generated when within MSR_DEADLINE_ALERT_DAYS (SystemConfig) of tranche end date.

Define alert entity in `db/alerts/schema.cds` per DATA_MODEL.md.

Create `ChurningValidator.ts` and `ChurningFacade.ts`.

**Testing — TDD:**
1. ChurningValidator tests
2. ChurningService tests:
   - Single tranche: pending → in_progress → met
   - Single tranche: pending → in_progress → missed
   - Multi-tranche: sequential evaluation
   - Monthly recurring: per-month progress
   - PointsAdjustment auto-creation on tranche met
   - Alert generation for msr_deadline, bonus_met, bonus_missed
   - Fee exclusion from qualifying spend

Update sprint board: move ENH-003 to In Progress, then Done.

Commit: `feat(churning): add bonus tracking engine

Delivers ENH-003 — per-tranche MSR progress with auto PointsAdjustment,
multi-tranche and monthly recurring support, 3 alert types.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- Tranche evaluation order correct (sequential, not parallel)
- Fee exclusion working (Credit Card Fee purchase type)
- PointsAdjustment created with correct bonus amount and rewards program
- Alert timing respects MSR_DEADLINE_ALERT_DAYS config

**Pass/fail:**

- [ ] ChurningService unit tests pass — all tranche states
- [ ] PointsAdjustment auto-created when tranche met
- [ ] 3 alert types generated correctly
- [ ] Fee transactions excluded from qualifying spend
- [ ] Multi-tranche and monthly recurring tested
- [ ] `tsc --noEmit` clean

#### Prompt 2: ENH-006 — Points Balance Engine

```
Implement ENH-006 (Points Balance) per SPEC-04 §4.2.

Read SPEC-04 §4.2 for points balance computation.

**Backend:**
Add to ChurningService:
- `getBalance(rewardsProgramId)` → balance, CPP valuation, per-card breakdown
- Balance = Σ(transaction earn) + Σ(PointsAdjustment where type=bonus_earned/manual_adjustment) − Σ(PointsRedemption.amount)
- Transaction earn = transaction.amount × applicable EarningMultiplier.rate for the card + earning category
- CPP valuation = balance × RewardsProgram.cppValuation / 100
- Per-card breakdown: group earn by CardInstance

**Manual adjustments:**
- Action: `addPointsAdjustment(rewardsProgramId, amount, type, notes)` — for manual corrections
- Types: bonus_earned, manual_adjustment, transfer_in, transfer_out

**Testing — TDD:**
1. Points balance calculation with known test data
2. Multiple cards earning into same program
3. Redemptions subtract from balance
4. Manual adjustments add/subtract
5. CPP valuation computed correctly
6. Empty program (zero balance)

Update sprint board: move ENH-006 to In Progress, then Done.

Commit: `feat(churning): add points balance engine

Delivers ENH-006 — per-program balance from transactions, bonuses,
adjustments, and redemptions. CPP valuation computed.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Points balance unit tests pass
- [ ] Multi-card same-program aggregation correct
- [ ] Redemptions reduce balance
- [ ] CPP valuation computed correctly
- [ ] `tsc --noEmit` clean

#### Prompt 3: ENH-007 + FRM-007 — Budget Engine & Income Entry

```
Implement ENH-007 (Budget Engine) and FRM-007 (Income Entry) per SPEC-05.

Read SPEC-05 for full budget pipeline details. Read SPEC-05 §5 for business rules.

**CDS Models:**
Define budget entities in `db/budget/schema.cds` per DATA_MODEL.md §5:
- IncomeEntry, RecurrentExpense, Goal, GoalForecastItem

BudgetAllocation already exists in `db/reference/schema.cds`.

**Backend — ENH-007:**
Create `srv/modules/budget/BudgetService.ts`:
- `compute(month)` → totalIncome, totalBudget, per-category breakdown with status
- Formula (D-131): totalBudget = totalIncome − Σ(activeGoal.monthlyAllocation)
- Per-category budget = totalBudget × BudgetAllocation.percentage / 100
- Per-category actual = Σ(Transaction.myShareAmount where purchaseType = category AND month matches)
- Split transactions use myShareAmount for budget (D-08)
- Transactions with excludes_from_budget PurchaseType excluded (D-97)
- Goal-linked transactions excluded from PT spend (D-132)
- Status per category: under_budget / warning / over_budget (threshold from SystemConfig BUDGET_WARNING_THRESHOLD_PCT)

Budget alerts (4 types per D-134):
- category_over_budget, category_warning, overall_over_budget, no_income_entered

Create `BudgetValidator.ts` and `BudgetFacade.ts`.
Expose via BudgetService CDS definition (`srv/budget-service.cds`).

**Frontend — FRM-007:**
Create `app/income-entry/` — Fiori Elements List Report + Object Page:
- Monthly income entries by source type
- "Copy from Previous Month" action (SPEC-05)
- Filterable by month

**Testing — TDD:**
1. BudgetValidator tests
2. BudgetService tests:
   - Basic: income → goal deduction → budget → per-category split
   - Split transactions use myShareAmount
   - excludes_from_budget PTs excluded
   - Goal-linked transactions excluded
   - Warning threshold triggers alert
   - Over-budget triggers alert
   - No income → no_income_entered alert
   - Copy from Previous Month
3. Integration: BudgetService CRUD + compute flow

Update sprint board: move ENH-007 and FRM-007 to In Progress, then Done.

Commit: `feat(budget): add budget engine and income entry

Delivers ENH-007 — monthly budget computation with goal deductions,
per-category split, 4 alert types.
Delivers FRM-007 — Fiori Elements income entry with Copy from Previous Month.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- Budget formula matches D-131 (simplified, no recurrent expenses in formula)
- Goal monthly allocations deducted from income before category split
- Split transactions correctly use myShareAmount
- 4 alert types fire at correct thresholds

**Pass/fail:**

- [ ] BudgetService unit tests pass — all formula variations
- [ ] 4 budget alert types generated correctly
- [ ] Split transactions use myShareAmount
- [ ] Goal deductions reduce totalBudget
- [ ] Income entry Fiori Elements app renders
- [ ] Copy from Previous Month action works
- [ ] BudgetService integration tests pass
- [ ] Run sprint checklist §5.2 W1-S4 before merge

---

### 6.5 Sprint W1-S5 — Cards, Dashboards & Workflows

**Branch:** `sprint/W1-S5`
**Goal:** My Cards browsable, card onboarding works, both dashboards show Wave 1 sections, weekly session workflow end-to-end
**Stories:** FRM-004, FRM-006 (absorbs WFL-004), RPT-001 (partial), RPT-002 (partial), WFL-001, WFL-002

#### Prompt 1: FRM-004 + WFL-002 — My Cards & Card Lifecycle

```
Implement FRM-004 (My Cards) and WFL-002 (Card Lifecycle State Machine) per SPEC-03.

Read SPEC-03 for full card lifecycle details.

**Backend — WFL-002:**
Add card lifecycle to ChurningService:
- State machine with 4 states: Focus, Active, To Cancel, Closed
- 7 valid transitions per SPEC-03 (D-189):
  - Focus → Active (auto when all bonus tranches met/missed, or manual)
  - Active → To Cancel
  - To Cancel → Closed (or back to Active)
  - Focus/Active/To Cancel → Closed (direct close per D-206)
- Supplementary card lifecycle: independent but cascade-close when parent closes (D-193)
- Connect to ENH-003: Focus→Active auto-triggers when all tranches met or all MSR windows expired (D-198)

Alerts: af_approaching (annual fee reminder per D-195), cancel_reminder (D-196) — use SystemConfig AF_ALERT_DAYS and CANCEL_REMINDER_DAYS.

**Frontend — FRM-004:**
Create `app/my-cards/` — Freestyle app per SPEC-03:
- Card list (primary cards only per D-203, supplementary visible on parent's detail)
- Object page sections:
  - Header: card name, issuer, lifecycle status (ObjectStatus with semantic color)
  - Bonus progress (reads ENH-003)
  - Earning multipliers table
  - Soft perks with utilization tracking
  - Fee history (computed per D-201)
  - Lifecycle timeline
  - Supplementary cards section
- Card name → everywhere links to this page (D-291)
- Mutable fields per D-205

**Testing:**
- Unit: Lifecycle state machine — valid transitions, invalid transitions rejected, cascade close
- Unit: Alert timing (AF approaching, cancel reminder)
- Integration: ChurningService lifecycle actions

Update sprint board: move FRM-004 and WFL-002 to In Progress, then Done.

Commit: `feat(churning): add My Cards and card lifecycle state machine

Delivers FRM-004 — freestyle card portfolio with bonus progress, earning,
perks, fee history, lifecycle timeline.
Delivers WFL-002 — 4-state lifecycle with auto Focus→Active, cascade close.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- All 7 state transitions work correctly
- Invalid transitions rejected with appropriate error
- Cascade close propagates to supplementary cards
- Lifecycle status uses correct semantic colors

**Pass/fail:**

- [ ] State machine unit tests pass — all transitions
- [ ] Cascade close works for supplementary cards
- [ ] AF approaching and cancel reminder alerts fire
- [ ] FRM-004 renders card list and object page
- [ ] Bonus progress section reads from ENH-003
- [ ] `cds build` + `tsc --noEmit` clean

#### Prompt 2: FRM-006 — Card Onboarding Wizard

```
Implement FRM-006 (Card Onboarding Wizard) per SPEC-03. WFL-004 is absorbed into this story.

Read SPEC-03 for wizard steps and flow.

**Frontend — FRM-006:**
Create `app/card-onboarding/` — Freestyle wizard:
- Step 1: Search and select a Market Card (from reference data)
  - If card not in database, placeholder link for FRM-005 (delivered W3-S1)
- Step 2: Define the signup offer — tranches, bonus amounts, annual fee, FYF flag (D-27)
  - For no-offer cards, skip this step (D-197)
- Step 3: Enter Card Instance details — activation date, last 4 digits, encrypted fields
  - Optional: card number, CVV (front + back per D-190), expiry (encrypted via EncryptionUtility)
- Step 4: Optional SimpleFIN account linking — map to existing ProviderAccount
- Step 5: Review and confirm
  - Creates: CardInstance, Offer (if applicable), OfferTranches
  - Sets lifecycle state: Focus (if offer with tranches), Active (if no offer per D-197)
  - Triggers ENH-003 to start tracking bonus progress

Wizard extends BaseController. XML views.

**Testing:**
- Scenario test: `test/integration/scenarios/card-onboarding-scenario.test.ts`
  - Create card with offer → verify CardInstance, Offer, OfferTranches → verify lifecycle = Focus
  - Create card without offer → verify lifecycle = Active

Update sprint board: move FRM-006 to In Progress, then Done.

Commit: `feat(churning): add card onboarding wizard

Delivers FRM-006 (absorbs WFL-004) — 5-step wizard: select card → define offer →
enter details → link SimpleFIN → confirm. Sets lifecycle state and initiates
bonus tracking.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Wizard renders all 5 steps
- [ ] Card with offer: lifecycle = Focus, tranches created
- [ ] Card without offer: lifecycle = Active
- [ ] Encrypted fields stored correctly
- [ ] Card onboarding scenario test passes

#### Prompt 3: RPT-001 + RPT-002 — Dashboard Shells (Wave 1 Sections)

```
Implement RPT-001 (Churnboard, partial) and RPT-002 (Budget Dashboard, partial) — Wave 1 sections only.

Read SPEC-19 for RPT-001 full spec. Read SPEC-20 for RPT-002 full spec.
Build only the sections listed below — remaining sections are added in W2-S1.

**Frontend — RPT-001 (Churnboard, W1 sections):**
Create `app/churnboard/` — Freestyle dashboard using sap.f.GridContainer per DESIGN_SYSTEM.md §5:
- Year selector (default: current year)
- W1 sections from SPEC-19:
  - §4.1.4 Bonus Progress card — active cards with MSR progress bars (reads ENH-003)
  - §4.1.8 Points Balances card — per-program balance with CPP value (reads ENH-006)
  - §4.1.5 CC Spend by Card card — bar chart, current month (VizFrame)
  - §4.1.9 Upcoming Fees card — cards with annual fee due within 60 days
  - §4.1.12 Alerts card — unread churning-related alerts
- Card name clicks → navigate to FRM-004 (D-291)
- Structure dashboard code so additional sections can be added in W2-S1 without rewriting (sync point #6)

**Frontend — RPT-002 (Budget Dashboard, W1 sections):**
Create `app/budget-dashboard/` — Freestyle dashboard:
- Month navigation (forward/back, month picker)
- W1 sections from SPEC-20:
  - §4.1.4 Budget Overview Hero KPI — totalIncome, totalBudget, totalSpent, remaining (reads ENH-007)
  - §4.1.5 Spending vs Budget by Category card — horizontal bar chart per purchase type
  - On-track indicators — ObjectStatus per category (under/warning/over)

Structure for additional sections in W2-S1.

**Shared controls:**
Implement VizFrameCard and ApexChartCard from `app/shared/controls/` for chart rendering.

**Testing:**
- QUnit for shared chart controls
- Dashboards are primarily visual — manual verification of chart rendering

Update sprint board: move RPT-001 (partial) and RPT-002 (partial) to In Progress, then Done.

Commit: `feat(ui): add Churnboard and Budget Dashboard shells

Delivers RPT-001 W1 sections — bonus progress, points balances,
CC spend, upcoming fees, alerts.
Delivers RPT-002 W1 sections — budget overview, spending by category,
on-track indicators.
Modular structure ready for W2-S1 additions.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Review:**

- GridContainer layout matches DESIGN_SYSTEM.md (2-column grid, half/full-width cards)
- Charts render with correct data from ENH-003, ENH-006, ENH-007
- Card name clicks navigate to FRM-004
- Theme overrides applied (charcoal brand, 0 border radius)

**Pass/fail:**

- [ ] RPT-001 renders with all W1 sections
- [ ] RPT-002 renders with all W1 sections
- [ ] Charts display data correctly
- [ ] Navigation to FRM-004 works from card names
- [ ] Dashboard code structured for extensibility (separate fragments or components per section)
- [ ] Theme overrides visually correct

#### Prompt 4: WFL-001 — Weekly Review Workflow

```
Implement WFL-001 (Weekly Review) per SPEC-15.

Read SPEC-15 for full weekly review workflow.

**Frontend — WFL-001:**
Create `app/weekly-review/` — Freestyle guided workflow page:
- This is the app landing page (D-299)
- Sections per SPEC-15:
  1. Connection Health — status of all ProviderConnections (reads FRM-010 data). Manual sync trigger.
  2. CSV Import shortcut — link to FRM-003 for Scotiabank import
  3. Transaction Review — recent uncategorized transactions requiring attention (filters to needs_review). Link to FRM-001 for full list.
  4. Dashboard Links — quick navigation to RPT-001 and RPT-002
  5. Alerts Summary — unread alerts grouped by type

"Back to Weekly Review" link on target pages (D-291).

**Shell navigation:**
Update `app/index.html` side navigation:
- Weekly Review is the first item under Transactions group
- Highlight as active on app launch
- Wave-gating: only show nav items for objects built in W1-S1 through W1-S5

**Testing:**
- QUnit: Verify navigation routing
- OPA5: Weekly review journey (connection check → transaction review → dashboard)
- Frontend tests: QUnit for shared resources, OPA5 for FRM-001 and FRM-003

Update sprint board: move WFL-001 to Done.

Commit: `feat(ui): add Weekly Review workflow and landing page

Delivers WFL-001 — guided weekly session: connection health → CSV import →
transaction review → dashboards. App landing page.
Side navigation updated with wave-gated entries.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Weekly Review is the app landing page
- [ ] Connection health section shows ProviderConnection status
- [ ] Transaction review section shows needs_review transactions
- [ ] Navigation links work to all target pages
- [ ] Side nav wave-gating active — only W1 items visible
- [ ] OPA5 journey test passes
- [ ] **Wave 1 complete — full weekly session testable**
- [ ] Run sprint checklist §5.2 W1-S5 before merge

---

### 6.6 Sprint W2-S1 — Churning Depth

**Branch:** `sprint/W2-S1`
**Goal:** Card recommendations, eligibility, profitability. Both dashboards feature-complete.
**Stories:** ENH-002, ENH-004, ENH-005, FRM-002, RPT-001 (complete), RPT-002 (complete)

#### Prompt 1: ENH-002 — Card Recommendation Engine

```
Implement ENH-002 (Card Recommendation Engine) per SPEC-07.

Read SPEC-07 for recommendation rules and business logic.

**Backend:**
Create `srv/modules/recommendation/RecommendationService.ts`:
- `getRecommendation(earningCategoryId)` → recommended card, effective earn rate, bonus override flag
- Logic:
  - Among active cards (lifecycle = Active or Focus), find highest EarningMultiplier rate for the given earning category
  - Bonus override: if a card is in Focus state with active MSR tracking, recommend it regardless of earn rate (to help meet MSR)
  - Tie-breaking: higher base rate wins, then alphabetical
- `getRecommendationMatrix()` → all active cards × all earning categories

Create `RecommendationValidator.ts` and `RecommendationFacade.ts`.
Expose via ChurningService.

**Testing — TDD:**
1. Single card, single category → that card recommended
2. Multiple cards, one has higher rate → higher rate wins
3. Card in Focus with MSR → bonus override
4. No active cards for category → no recommendation
5. Full matrix generation

Update sprint board: move ENH-002 to In Progress, then Done.

Commit: `feat(recommendation): add card recommendation engine

Delivers ENH-002 — per-category optimal card selection with bonus override
for Focus cards with active MSR.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] RecommendationService unit tests pass
- [ ] Bonus override prioritizes Focus cards
- [ ] Matrix returns all card × category combinations
- [ ] `tsc --noEmit` clean

#### Prompt 2: ENH-004 — Eligibility Engine

```
Implement ENH-004 (Eligibility Engine) per SPEC-16.

Read SPEC-16 for full eligibility rules. This is the most rule-heavy engine.

**Backend:**
Create `srv/modules/eligibility/EligibilityService.ts`:
- `getEligibility()` → per-issuer eligibility summary
- Per-issuer result: eligible_now / eligible_in_X_days / not_eligible + per-rule detail
- Rules from IssuerApplicationRule seeds (seeded in W1-S1) and SPEC-16:
  - Time-since-last-application per issuer
  - Max active cards per issuer
  - Product-specific rules (Amex: personal vs business, credit vs charge separate)
  - Aeroplan 5-tier limit (D-236)
  - Credit score requirements per CreditScoreRange

Create `EligibilityValidator.ts` and `EligibilityFacade.ts`.
Expose via ChurningService.

**Testing — TDD:**
Must cover all rule types per SPEC-16 §7 FUTs:
1. Eligible now — no restrictions violated
2. Eligible in X days — time-based restriction with countdown
3. Not eligible — hard rule violated (max cards reached)
4. Amex credit vs charge card distinction
5. Amex personal vs business distinction
6. Aeroplan 5-tier limit
7. Multiple rules per issuer — most restrictive wins
8. No card history for issuer → eligible

Update sprint board: move ENH-004 to In Progress, then Done.

Commit: `feat(eligibility): add issuer eligibility engine

Delivers ENH-004 — per-issuer eligibility assessment with time-based,
count-based, and product-specific rules. Amex and Aeroplan special handling.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] EligibilityService unit tests pass — all rule types
- [ ] Amex credit/charge and personal/business distinctions work
- [ ] Aeroplan 5-tier limit enforced
- [ ] Time-based countdowns computed correctly
- [ ] `tsc --noEmit` clean

#### Prompt 3: ENH-005 — Card Profitability Calculator

```
Implement ENH-005 (Card Profitability Calculator) per SPEC-08.

Read SPEC-08 for profitability calculation details.

**Backend:**
Add `ProfitabilityService.ts` to the churning module (or extend ChurningService):
- `calculate(cardInstanceId)` → net value breakdown
- Net value = (earnedPoints × CPP) + perkValue − fees
- Components:
  - Points value: total earned points × RewardsProgram.cppValuation / 100
  - Perk value: sum of realized soft perk values (from CardPerk utilization)
  - Fees: sum of annual fees paid (from Offer.feeAmount, considering FYF per D-27)
  - FYF handling: first year value excludes fee if offer.firstYearFree = true (D-147)
- Estimated first year value (D-199): projected if card is new
- Lifetime value gain (D-200): cumulative since activation

**Testing — TDD:**
1. Card with FYF — year 1 net = points + perks (no fee)
2. Card without FYF — year 1 net = points + perks − fee
3. Multi-year card — lifetime cumulative
4. Card with no perks utilized
5. Card with zero spend (edge case)

Update sprint board: move ENH-005 to In Progress, then Done.

Commit: `feat(churning): add card profitability calculator

Delivers ENH-005 — net value = (points×CPP + perks − fees).
FYF first-year handling, lifetime cumulative.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] ProfitabilityService unit tests pass
- [ ] FYF correctly excludes first-year fee
- [ ] Lifetime value accumulates correctly
- [ ] `tsc --noEmit` clean

#### Prompt 4: FRM-002 — Manual Transaction Entry

```
Implement FRM-002 (Manual Transaction Entry) per SPEC-17.

Read SPEC-17 for full transaction entry form details.

**Frontend — FRM-002:**
Create `app/transaction-entry/` — Freestyle form (not Fiori Elements) per SPEC-17:
- Single transaction create/edit form
- Fields: date, amount, description, card selector
- Vendor fuzzy search (fuse.js) — type-ahead against existing vendors
- Dual taxonomy selectors: Purchase Type + Earning Category (independent)
- Card recommendation display — shows recommended card for selected earning category (reads ENH-002)
- On save: creates Transaction with source = 'manual', runs ENH-001 categorization

Accessed from FRM-001 "Create" action and from FRM-004 card detail (D-291).

**Backend:**
Add manual transaction creation action to TransactionService.

**Testing:**
- Unit: TransactionService.createManual() validation
- OPA5: Form fill → save → verify transaction created

Update sprint board: move FRM-002 to In Progress, then Done.

Commit: `feat(transaction): add manual transaction entry form

Delivers FRM-002 — freestyle form with vendor fuzzy search,
dual taxonomy, card recommendation display.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Form renders with all required fields
- [ ] Vendor fuzzy search returns relevant matches
- [ ] Card recommendation displays for selected earning category
- [ ] Transaction created with source = 'manual'
- [ ] Categorization runs on save

#### Prompt 5: RPT-001 + RPT-002 — Dashboard Completion

```
Complete RPT-001 (Churnboard) and RPT-002 (Budget Dashboard) — add remaining sections.

Read SPEC-19 and SPEC-20 for the sections not yet implemented.

**RPT-001 additions (SPEC-19 remaining sections):**
Add to `app/churnboard/`:
- §4.1.3 Net Value Hero KPI — total net value across all cards (reads ENH-005)
- §4.1.11 Card Recommendation by Category — optimal card per earning category (reads ENH-002)
- §4.1.10 Issuer Eligibility — per-issuer eligibility status (reads ENH-004)
- §4.1.7 Realized Value vs Fees — chart showing value gained vs fees paid (reads ENH-005)
- §4.1.6 Reward Yield Trend — monthly points earned over time (VizFrame line chart)

**RPT-002 additions (SPEC-20 remaining sections):**
Add to `app/budget-dashboard/`:
- §4.1.6 CC Spend by Card — bar chart of spend per card for the month
- §4.1.7 Top Spending Subtypes — highest spend categories beyond Purchase Type
- §4.1.8 Top Vendors — highest spend vendors for the month
- §4.1.10 Goal Progress — active goals with progress bars
- §4.1.9 Uncategorized — transactions needing categorization

Both dashboards should now be feature-complete with all sections from their specs.

**Testing:**
- Verify new sections render with correct data
- Chart data accuracy spot-check
- Navigation links from new sections work

Update sprint board: move RPT-001 (complete) and RPT-002 (complete) to Done.

Commit: `feat(ui): complete Churnboard and Budget Dashboard

RPT-001 complete — adds net value KPI, recommendation, eligibility,
realized value vs fees, yield trend.
RPT-002 complete — adds CC spend by card, top subtypes, top vendors,
goal progress, uncategorized.
Both dashboards feature-complete.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] RPT-001 shows all sections from SPEC-19
- [ ] RPT-002 shows all sections from SPEC-20
- [ ] Recommendation, eligibility, profitability data displays correctly
- [ ] All chart types render
- [ ] **Both dashboards feature-complete**
- [ ] Run sprint checklist §5.2 W2-S1 before merge

---

### 6.7 Sprint W2-S2 — Goals & Reports

**Branch:** `sprint/W2-S2`
**Goal:** Goals management, trophy case, recommendation matrix, goal progress report
**Stories:** FRM-008, RPT-004, RPT-006, RPT-011

#### Prompt 1: FRM-008 — Goals Management

```
Implement FRM-008 (Goals Management) per SPEC-09.

Read SPEC-09 for goals management details.

**CDS Models:**
Ensure Goal and GoalForecastItem entities defined in `db/budget/schema.cds` per DATA_MODEL.md.

**Backend:**
Add goals management to BudgetService:
- Goal CRUD with: name, target amount, start/end date, monthly allocation
- Transaction linking: associate transactions with a goal (D-132 — goal transactions excluded from PT budget spend)
- Goal progress: (linked transaction sum / target amount) × 100
- Goal status: on_track / at_risk / behind / completed
- Auto-complete when linked transactions reach target

Extend BudgetValidator for goal validation (target > 0, end > start, etc.).

**Frontend — FRM-008:**
Create `app/goals/` — Fiori Elements List Report + Object Page:
- Goal list with status indicators (ObjectStatus)
- Object page: goal details, monthly allocation, linked transactions, progress bar
- Actions: Link Transaction, Complete Goal

Expose via BudgetService.

**Testing:**
- Unit: Goal validation, progress calculation, status determination
- Integration: Goal CRUD + transaction linking flow

Update sprint board: move FRM-008 to In Progress, then Done.

Commit: `feat(budget): add goals management

Delivers FRM-008 — goal CRUD with target tracking, transaction linking,
monthly allocations affecting budget computation.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Goal CRUD works (create, update, delete)
- [ ] Transaction linking works — linked transactions excluded from PT budget
- [ ] Progress bar shows correct percentage
- [ ] Goal status transitions correctly
- [ ] ENH-007 budget computation reflects goal allocations

#### Prompt 2: RPT-004 — Trophy Case

```
Implement RPT-004 (Trophy Case) per SPEC-21.

Read SPEC-21 for full trophy case details.

**CDS Models:**
Ensure PointsRedemption entity defined in `db/points/schema.cds`.

**Backend:**
Add redemption management to ChurningService:
- Redemption CRUD: program, amount, cash value, redemption type, date, notes
- CPP calculation: cashValue / pointsRedeemed × 100
- KPI aggregations: total redeemed, total cash value, average CPP, best CPP

**Frontend — RPT-004:**
Create `app/trophy-case/` — Freestyle dashboard + list per SPEC-21:
- KPI header cards: total points redeemed, total cash value, average CPP, best redemption
- Redemption register table: sortable, filterable
- CPP semantic coloring: green (above program avg), yellow (at avg), red (below avg)
- Actions: Add Redemption, Edit, Delete
- Group by rewards program

**Testing:**
- Unit: CPP calculation, KPI aggregation
- Integration: Redemption CRUD

Update sprint board: move RPT-004 to In Progress, then Done.

Commit: `feat(churning): add Trophy Case redemption register

Delivers RPT-004 — redemption tracking with KPI cards, CPP semantic coloring,
filterable register grouped by program.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Redemption CRUD works
- [ ] CPP calculated correctly
- [ ] KPI cards show correct aggregates
- [ ] Semantic coloring applied based on program CPP average
- [ ] Redemptions subtract from ENH-006 points balance

#### Prompt 3: RPT-006 + RPT-011 — Recommendation Matrix & Goal Progress

```
Implement RPT-006 (Recommendation Matrix) per SPEC-07 and RPT-011 (Goal Progress) per SPEC-09.

**RPT-006 — Recommendation Matrix:**
Create `app/recommendation-matrix/` — Freestyle report:
- Matrix view: all active cards (rows) × all earning categories (columns)
- Cell content: earn rate (EarningMultiplier)
- Optimal card highlighted per column (highest rate, with bonus override)
- Reads ENH-002.getRecommendationMatrix()
- Reference SPEC-07 for layout details

**RPT-011 — Goal Progress Report:**
Create `app/goal-progress/` — Freestyle or Fiori Elements:
- Active goals with progress bars
- Monthly contribution tracking
- Projection: estimated completion date based on current pace
- Links: goal name → FRM-008 detail, "Edit Allocations" → FRM-009 (D-293)
- Reference SPEC-09 for layout details

**Testing:**
- Unit: Matrix generation, projection calculation
- Visual verification of matrix highlighting and progress bars

Update sprint board: move RPT-006 and RPT-011 to Done.

Commit: `feat(ui): add recommendation matrix and goal progress report

Delivers RPT-006 — cards × categories matrix with optimal card highlights.
Delivers RPT-011 — goal progress with projections and contribution tracking.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Matrix shows all active cards × all earning categories
- [ ] Optimal card highlighted correctly per category
- [ ] Goal progress bars reflect correct percentages
- [ ] Projection dates calculated
- [ ] Navigation links work (goal → FRM-008, allocations → FRM-009)
- [ ] Run sprint checklist §5.2 W2-S2 before merge

---

### 6.8 Sprint W3-S1 — Analytics & Financial Picture

**Branch:** `sprint/W3-S1`
**Goal:** Market cards browsable, financial picture entry, net worth dashboard, card analytics, spending trends
**Stories:** FRM-005, FRM-011, RPT-003, RPT-005, RPT-007

#### Prompt 1: FRM-005 — Market Cards

```
Implement FRM-005 (Market Cards) per SPEC-18.

Read SPEC-18 for market cards browser details.

**Frontend — FRM-005:**
Create `app/market-cards/` — Fiori Elements List Report + Object Page:
- Market card list: issuer, name, card type, segment, network
- Filters: issuer, card type (credit/charge), segment (personal/business), network
- Object page sections:
  - Card details
  - Current and historical offers (with offer history chart)
  - Linked user cards (CardInstances using this MarketCard)
  - Earning multipliers (template values)
  - Soft perks
- Quick-compare: select 2-3 cards for side-by-side comparison
- Actions: Create Market Card, Edit, "Apply for this card" shortcut → FRM-006 (D-292)

Annotations in `app/market-cards/annotations/`.

**Backend:**
Expose MarketCard and related entities through ChurningService.

**Testing:**
- Integration: MarketCard CRUD
- Quick-compare feature verification

Update sprint board: move FRM-005 to In Progress, then Done.

Commit: `feat(churning): add Market Cards browser

Delivers FRM-005 — Fiori Elements market card catalog with offer history,
earning multipliers, quick-compare, and card onboarding shortcut.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Market card list renders with filters
- [ ] Object page shows all sections
- [ ] Offer history chart renders
- [ ] Quick-compare works for 2-3 cards
- [ ] FRM-006 shortcut navigation works

#### Prompt 2: FRM-011 + RPT-003 — Financial Picture Entry & Dashboard

```
Implement FRM-011 (Financial Picture Entry) and RPT-003 (Financial Picture Dashboard) per SPEC-10.

Read SPEC-10 for full financial picture details.

**CDS Models:**
Define financial entities in `db/financial/schema.cds` per DATA_MODEL.md:
- FinancialAccount, FinancialContribution

**Backend:**
Add financial management to BudgetService (or extend with a FinancialService if cleaner):
- FinancialAccount CRUD: account name, type (investment/debt/savings), institution, balance
- Monthly snapshots: balance tracking over time for trend analysis
- FinancialContribution: links income/transactions to accounts
- Net worth calculation: assets − liabilities

**Frontend — FRM-011:**
Create `app/financial-picture/` — Fiori Elements List Report + Object Page:
- Account list grouped by type (Investments, Debts, Savings)
- Object page: account details, monthly balance history, contributions
- Action: Record Monthly Snapshot

**Frontend — RPT-003:**
Create `app/financial-dashboard/` — Freestyle dashboard:
- Net Worth card — total assets, total liabilities, net (ObjectNumber)
- Debt Trending chart — line chart of total debt over time
- Investment Trending chart — line chart of total investments over time
- Account breakdown table
- Bidirectional links: RPT-003 ↔ FRM-011 (D-305/D-306)

**Testing:**
- Unit: Net worth calculation
- Integration: Financial account CRUD + snapshot

Update sprint board: move FRM-011 and RPT-003 to In Progress, then Done.

Commit: `feat(budget): add financial picture entry and dashboard

Delivers FRM-011 — financial account management with monthly snapshots.
Delivers RPT-003 — net worth, debt/investment trending dashboard.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Financial account CRUD works (investments, debts, savings)
- [ ] Net worth calculated correctly (assets − liabilities)
- [ ] Monthly snapshots recorded
- [ ] Trending charts render with historical data
- [ ] RPT-003 ↔ FRM-011 navigation works both directions

#### Prompt 3: RPT-005 — Card Analytics

```
Implement RPT-005 (Card Analytics) per SPEC-08.

Read SPEC-08 for card analytics details.

**Frontend — RPT-005:**
Create `app/card-analytics/` — Freestyle report:
- Card selector (dropdown or list navigation)
- Per-card deep dive sections:
  - Spend breakdown by earning category (pie/donut chart)
  - Monthly spend trend (line chart)
  - Points earned breakdown (by source: transactions, bonuses, adjustments)
  - Profitability summary (reads ENH-005)
  - Top vendors for this card
- Cross-card comparison view

**Backend:**
Add analytics aggregation endpoints to ChurningService — per-card spend, points, vendors.

**Testing:**
- Unit: Aggregation queries
- Visual: Chart rendering verification

Update sprint board: move RPT-005 to In Progress, then Done.

Commit: `feat(churning): add Card Analytics report

Delivers RPT-005 — per-card spend, points, profitability breakdown
with trend charts and vendor analysis.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Card selector works
- [ ] Spend breakdown chart renders
- [ ] Points earned breakdown correct
- [ ] Profitability reads from ENH-005
- [ ] Navigation from RPT-001 to RPT-005 works

#### Prompt 4: RPT-007 — Spending Trends

```
Implement RPT-007 (Spending Trends) per SPEC-12.

Read SPEC-12 for spending trends details.

**Frontend — RPT-007:**
Create `app/spending-trends/` — Freestyle report:
- Multi-month time-series by purchase type category (stacked bar or line chart)
- Date range selector (last 3/6/12 months, custom range)
- Category filter
- Vendor concentration: top 10 vendors by total spend
- Month-over-month change indicators
- Navigation from RPT-002 (D-296)

**Backend:**
Add time-series aggregation to BudgetService — monthly spend grouped by purchase type.

**Testing:**
- Unit: Aggregation correctness
- Visual: Chart rendering

Update sprint board: move RPT-007 to In Progress, then Done.

Commit: `feat(budget): add Spending Trends report

Delivers RPT-007 — multi-month spend by category, vendor concentration,
month-over-month change indicators.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Time-series chart renders with correct monthly data
- [ ] Category and date range filters work
- [ ] Vendor concentration displays top 10
- [ ] Navigation from RPT-002 works
- [ ] Run sprint checklist §5.2 W3-S1 before merge

---

### 6.9 Sprint W3-S2 — Remaining Reports

**Branch:** `sprint/W3-S2`
**Goal:** Perk tracker, annual summary, points dashboard, income vs expenses
**Stories:** RPT-008, RPT-009, RPT-010, RPT-012

#### Prompt 1: RPT-008 + RPT-009 — Perk Tracker & Annual Summary

```
Implement RPT-008 (Perk Tracker) and RPT-009 (Annual Summary) per SPEC-11.

Read SPEC-11 for full analytics details.

**RPT-008 — Perk Tracker:**
Create `app/perk-tracker/` — Freestyle report:
- Cross-card soft perk overview: all SoftPerkDefinitions across active cards
- Columns: perk name, card, value, utilization status (realized/unrealized via CardPerk)
- Remaining value: perkValue − realizedAmount
- Group by card or by perk type
- Total perk value summary

**RPT-009 — Annual Summary:**
Create `app/annual-summary/` — Freestyle report:
- Year selector
- Year-in-review sections:
  - Cards: opened, closed, active count
  - Net value: total (points×CPP + perks − fees) across all cards (reads ENH-005)
  - Best card: highest net value
  - Worst card: lowest net value
  - Total spend, total points earned, average CPP on redemptions
  - Monthly trend summary chart

**Testing:**
- Unit: Perk remaining value, annual aggregations
- Visual: Report rendering

Update sprint board: move RPT-008 and RPT-009 to Done.

Commit: `feat(churning): add Perk Tracker and Annual Summary

Delivers RPT-008 — cross-card perk utilization tracking with remaining value.
Delivers RPT-009 — year-in-review with card performance rankings.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] RPT-008 shows all perks across active cards
- [ ] Perk utilization status (realized/unrealized) correct
- [ ] RPT-009 shows correct year totals
- [ ] Best/worst card determined by net value
- [ ] Year selector works

#### Prompt 2: RPT-010 + RPT-012 — Points Dashboard & Income vs Expenses

```
Implement RPT-010 (Points Dashboard) and RPT-012 (Income vs Expenses) per SPEC-11 and SPEC-12.

**RPT-010 — Points Dashboard:**
Create `app/points-dashboard/` — Freestyle dashboard:
- Per-rewards-program view (tabs or selector)
- Balance, earning history chart, redemption history chart
- Points breakdown by source (transactions, bonuses, adjustments, transfers)
- Actions: Transfer Points (between programs), Manual Adjustment
- Reads ENH-006 for balance data
- Navigation from RPT-001 points section

**RPT-012 — Income vs Expenses:**
Create `app/income-vs-expenses/` — Freestyle report:
- Multi-month macro view: total income vs total outflow per month (grouped bar chart)
- Savings rate: (income − expenses) / income × 100
- Trend line for savings rate
- Date range selector
- Navigation from RPT-002 (D-304)

**Testing:**
- Unit: Savings rate calculation, points breakdown
- Visual: Chart rendering

Update sprint board: move RPT-010 and RPT-012 to Done.

Commit: `feat(ui): add Points Dashboard and Income vs Expenses

Delivers RPT-010 — per-program points view with transfer and adjustment actions.
Delivers RPT-012 — income vs expenses trend with savings rate.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] RPT-010 shows per-program balance and history
- [ ] Transfer Points and Manual Adjustment actions work
- [ ] RPT-012 shows income vs expenses by month
- [ ] Savings rate calculated correctly
- [ ] Navigation links from RPT-001 and RPT-002 work
- [ ] **Wave 3 complete — all analytical reports available**
- [ ] Run sprint checklist §5.2 W3-S2 before merge

---

### 6.10 Sprint W4-S1 — Market Intelligence

**Branch:** `sprint/W4-S1`
**Goal:** Market card database populated, offer scraping operational with human approval gate
**Stories:** CNV-004, INT-003, WFL-003

#### Prompt 1: INT-003 + CNV-004 — Web Scraper & Market Card Database

```
Implement INT-003 (Web Scraper) and CNV-004 (Market Card Database) per SPEC-13.

Read SPEC-13 for full market intelligence details.

**CDS Models:**
Define scraping entities (if not already in `db/integration/schema.cds`):
- ScrapeRun, ScrapeQueueItem, ScrapeMapping (per DATA_MODEL.md amendments from SPEC-13)

**Backend — INT-003:**
Create `srv/modules/integration/ScraperService.ts`:
- `scrape(sourceUrl)` — uses axios + cheerio to fetch and parse offer pages
- ScrapeMapping configuration: CSS selectors for each source site per SPEC-13
- Creates ScrapeQueueItem records for each parsed offer (status: pending_review)
- Scheduling: configurable via SystemConfig, manual trigger available
- Error handling: ScrapeRun tracks success/failure, partial results acceptable

Create `ScraperValidator.ts` and `ScraperFacade.ts`.

**CNV-004 — Market Card Database Population:**
Seed ~50-100 market cards with ~150-500 offer variants:
- Cards across all major Canadian issuers
- Historical and current offers
- Uses existing MarketCard entity structure from W1-S1

**Testing — TDD:**
- Unit: ScraperService with mocked HTTP responses (mock cheerio parsing)
- Unit: ScrapeMapping selector application
- Integration: Scrape → queue item creation flow
- Scenario: `test/integration/scenarios/scraper-scenario.test.ts`

Update sprint board: move INT-003 and CNV-004 to In Progress, then Done.

Commit: `feat(integration): add web scraper and market card database

Delivers INT-003 — cheerio-based offer scraper with configurable mappings.
Delivers CNV-004 — ~50-100 market cards with offer history seeded.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] ScraperService creates ScrapeQueueItems from parsed HTML
- [ ] ScrapeMapping selectors configurable per source
- [ ] ScrapeRun tracks execution status
- [ ] Market card database populated (50-100 cards)
- [ ] Scraper scenario test passes
- [ ] `tsc --noEmit` clean

#### Prompt 2: WFL-003 — Offer Approval Gate

```
Implement WFL-003 (Offer Approval Gate) per SPEC-13.

Read SPEC-13 for approval workflow details.

**Frontend — WFL-003:**
Create `app/offer-approval/` — Freestyle workflow page:
- Queue of pending ScrapeQueueItems (status: pending_review)
- For each item: parsed offer details, source URL, confidence score
- Actions per item:
  - Approve → creates/updates Offer on the linked MarketCard
  - Reject → marks as rejected
  - Edit & Approve → modify parsed values before accepting
  - Link to Market Card → associate with existing MarketCard or create new one
- Bulk approve for high-confidence matches
- Filter: pending, approved, rejected

Located in Admin nav group (D-290).

**Backend:**
Add approval actions to AdminService:
- `approveOffer(queueItemId)` → creates Offer + OfferTranches from queue item data
- `rejectOffer(queueItemId)` → marks rejected
- `bulkApprove(queueItemIds)` → batch approve

**Testing:**
- Unit: Approval flow creates correct Offer records
- Scenario: scrape → queue → approve → verify Offer on MarketCard

Update sprint board: move WFL-003 to Done.

Commit: `feat(integration): add offer approval gate workflow

Delivers WFL-003 — human-in-the-loop approval for scraped offers.
Approve/reject/edit flow with bulk approve for high-confidence matches.

Co-Authored-By: Claude Code <noreply@anthropic.com>`
```

**Pass/fail:**

- [ ] Approval queue shows pending items
- [ ] Approve creates Offer on MarketCard
- [ ] Reject marks item as rejected
- [ ] Edit & Approve allows modification before save
- [ ] Bulk approve works for multiple items
- [ ] End-to-end: scrape → queue → approve → Offer visible on FRM-005
- [ ] **Wave 4 complete — all 43 FRICEW objects delivered**
- [ ] **Go-live readiness — run full sprint checklist §5.2 W4-S1, then tag `v1.0.0`**

---

## 7. Quick Reference

32 prompts across 10 sprints, covering all 43 FRICEW objects.

| Sprint | # | Stories | Title |
|--------|---|---------|-------|
| **W1-S1** | 1 | CNV-002 | Reference Data Seed |
| | 2 | CNV-003 | Card Portfolio Seed |
| | 3 | FRM-009 | Admin CRUD |
| **W1-S2** | 1 | ENH-008 | Deduplication Engine |
| | 2 | INT-001, FRM-010 | SimpleFIN Sync & Connection Manager |
| | 3 | INT-002, FRM-003 | CSV Parsing & Import Wizard |
| **W1-S3** | 1 | ENH-001 | Categorization Engine |
| | 2 | ENH-009, FRM-001 | Transaction Splits & Transaction List |
| | 3 | CNV-001 | Historical Backfill |
| **W1-S4** | 1 | ENH-003 | Bonus Tracking Engine |
| | 2 | ENH-006 | Points Balance Engine |
| | 3 | ENH-007, FRM-007 | Budget Engine & Income Entry |
| **W1-S5** | 1 | FRM-004, WFL-002 | My Cards & Card Lifecycle |
| | 2 | FRM-006 | Card Onboarding Wizard |
| | 3 | RPT-001, RPT-002 | Dashboard Shells (W1 partial) |
| | 4 | WFL-001 | Weekly Review Workflow |
| **W2-S1** | 1 | ENH-002 | Card Recommendation Engine |
| | 2 | ENH-004 | Eligibility Engine |
| | 3 | ENH-005 | Card Profitability Calculator |
| | 4 | FRM-002 | Manual Transaction Entry |
| | 5 | RPT-001, RPT-002 | Dashboard Completion |
| **W2-S2** | 1 | FRM-008 | Goals Management |
| | 2 | RPT-004 | Trophy Case |
| | 3 | RPT-006, RPT-011 | Recommendation Matrix & Goal Progress |
| **W3-S1** | 1 | FRM-005 | Market Cards |
| | 2 | FRM-011, RPT-003 | Financial Picture Entry & Dashboard |
| | 3 | RPT-005 | Card Analytics |
| | 4 | RPT-007 | Spending Trends |
| **W3-S2** | 1 | RPT-008, RPT-009 | Perk Tracker & Annual Summary |
| | 2 | RPT-010, RPT-012 | Points Dashboard & Income vs Expenses |
| **W4-S1** | 1 | INT-003, CNV-004 | Web Scraper & Market Card Database |
| | 2 | WFL-003 | Offer Approval Gate |

**Execution sequence:** Scaffold (§4) → W1-S1 prompts 1–3 → merge → W1-S2 prompts 1–3 → merge → ... → W4-S1 prompts 1–2 → merge → tag `v1.0.0`

---

*This document is the single source of truth for the Financial Planner build execution plan. References [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) (sprint plan, checkpoint meeting), [TECHNICAL_STANDARDS.md](TECHNICAL_STANDARDS.md) (coding patterns), [TEST_STRATEGY.md](TEST_STRATEGY.md) (test boundaries), [VERSION_CONTROL.md](VERSION_CONTROL.md) (branching, commits, tags), and all functional specs in [design/specs/](specs/).*
