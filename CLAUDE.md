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
