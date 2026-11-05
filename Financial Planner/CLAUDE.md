# Financial Planner — Build Phase

## What This Is

Personal financial management system for a Canadian credit card churner. TypeScript + SAP CAP + SAPUI5 + PostgreSQL. Single user, local deployment.

## Current Sprint

<!-- Updated each sprint -->

**Sprint:** W1-S3 — Transaction Processing
**Branch:** sprint/W1-S3
**Goal:** Transactions categorized, splits supported, historical data backfilled.
**Stories:** ENH-001, ENH-009, FRM-001, CNV-001

## Architecture

- **Backend:** CAP with @cap-js/postgres — 4 CDS services (Transaction, Churning, Budget, Admin)
- **Frontend:** SAPUI5 1.136.16 in **TypeScript** (transpiled to AMD via `ui5-tooling-transpile` + `cds-plugin-ui5`) — Fiori Elements for CRUD (`admin-master-data`, `transactions`), Freestyle for the shell, dashboards and wizards (`shell`, `connection-manager`, `csv-import-wizard`)
- **API:** OData V4 auto-generated from CDS
- **Theme:** sap_horizon + custom overrides in `app/shared/css/theme-overrides.css`
- **Background jobs:** node-cron inside CAP process via `cds.spawn()`

## Folder Structure

```

../                          Life OS monorepo root — one git repo, one npm workspace
  package.json               Shared devDeps (eslint, typescript, tsx, jest) — `npm install` runs HERE
  package-lock.json          The only lockfile; deps hoist to ../node_modules/
  .mcp.json .prettierrc.json Playwright MCP + shared formatting
  Standards (Technical + Linting)/
    eslint.config.mjs        The shared rules — this module's eslint.config.mjs re-exports them
    tsconfig.base.json       Shared compilerOptions — this module's tsconfig.json extends it
    scripts/                 The shared lint scripts + generateTestReport.ts, called by path
db/                          CDS entity models (9 domain folders)
  common/                    Shared aspects + enums.cds (all enum types)
  reference/schema.cds       26 reference entities
  cards/schema.cds           7 card entities
  transactions/schema.cds    3 transaction entities + 1 view
  points/schema.cds          2 points entities
  budget/schema.cds          4 budget entities
  financial/schema.cds       2 financial entities
  ingestion/schema.cds       3 ingestion entities
  alerts/schema.cds          1 alert entity
  seed/                      CSV seed data (CNV-002, CNV-003)
srv/
  {service-name}.cds         CDS service shells (4 services) — using lines + empty service body
  {service-name}/            Service members by kind: entities/types/actions/calculations/annotations.cds (lint:cds-layout)
  {service-name}.ts          Service entry points
  _i18n/
    i18n.properties          CDS field labels (PascalCase keys)
    messages.properties      Runtime messages (camelCase.dots keys)
  modules/
    shared/                  baseFacade, baseService, logger, messagingUtility, constants
    {domain}/                Per-domain: {domain}Facade.ts, {domain}Service.ts, {domain}DataService.ts, {domain}Validator.ts (+ {domain}Mapper.ts when translating shapes)
    ingestion/               SimpleFIN, CSV, Scheduling, Dedup services (the ingestion domain)
  util/                      encryptionUtility, dateTimeUtility, currencyUtility
app/
  shared/                    BaseController.ts, controls/, util/formatter.ts, css/theme-overrides.css (transpiled UI5 lib, served at /shared)
  {app-name}/                One folder per UI app (5 today; more land per sprint)
    package.json ui5.yaml tsconfig.json   per-app UI5 tooling (transpile config)
    webapp/                  manifest.json, Component.ts, i18n/, ext/ or views/
    annotations/             Entity-based CDS annotation files (Fiori Elements apps only)
test/
  shared/{data,support}/     Cross-cutting fixtures + builders (used across modules or test types)
  unit/{module}/             Per-module unit area, each split into:
    data/                    Fixtures + factories used only by this module's unit tests
    support/                 Mocks/harness builders (buildXxxMocks) — functions, never fixtures
    tests/                   The *.test.ts specs
  integration/{module}/      Same data/support/tests split, per CDS service / domain
  integration/scenarios/     FUT multi-step scenario tests
  journey/data/              Seed rows for the [journey] cds profile (UI5 OPA5 journeys)
                             ({module}: ingestion=CSV/SimpleFIN/Scheduling/Dedup, shared=utilities, admin, …)
project/
  SPRINT_BOARD.md            Current sprint status
  DEFECT_LOG.md              Running defect log
  sprints/                   Sprint checkpoint reports
scripts/
  generateKey.ts             ENCRYPTION_KEY generator — the only script left in this module

```

`npm run lint` and `npm test` run from this module; `npm install` runs from the Life OS root.
## Standards

**The shared standards are in [Standards (Documents)/CODING_STANDARDS.md](../Standards%20(Documents)/CODING_STANDARDS.md)**
— CDS, TypeScript, the handler pattern, i18n, SAPUI5, test rules, git workflow, the shared Do NOT list.
They apply here in full. This file carries only what is true of Financial Planner.

## Encryption

- `EncryptionUtility.ts` (AES-256-GCM) guards 4 fields: `card_number_enc`, `cvv_enc`, `expiry_date_enc`, `access_url_enc`. Key in `.env` as `ENCRYPTION_KEY` (gitignored). No raw `crypto` calls outside `EncryptionUtility`

## Design References

Look up details here — do not duplicate:

| Topic                      | Document                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| Entity definitions         | [DATA_MODEL.md](design/DATA_MODEL.md)                             |
| Functional specs           | [design/specs/SPEC-{nn}-\*.md](design/specs/)                     |
| Business rules             | Spec §5 (Business Rules) per FRICEW object                        |
| Wave plan & FRICEW catalog | [BUSINESS_ARCHITECTURE.md](design/BUSINESS_ARCHITECTURE.md)       |
| Sprint plan & personas     | [PROJECT_MANAGEMENT.md](design/PROJECT_MANAGEMENT.md)             |
| Full coding standards      | [TECHNICAL_STANDARDS.md](design/TECHNICAL_STANDARDS.md)           |
| Test strategy details      | [TEST_STRATEGY.md](design/TEST_STRATEGY.md)                       |
| Design system              | [DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)                       |
| Theme overrides            | [THEME.md](design/THEME.md)                                       |
| Navigation & IA            | [INFORMATION_ARCHITECTURE.md](design/INFORMATION_ARCHITECTURE.md) |
| Cross-sprint contracts     | [BUILD_PLAN.md](design/BUILD_PLAN.md) §2                          |
| All decisions              | [DECISIONS_LOG.md](design/user-profile/DECISIONS_LOG.md)          |

## Do NOT

Module-specific only — the shared Do NOT list applies here too and is not repeated.

- Log a decrypted card number, CVV, expiry or SimpleFIN access URL at any level
- Commit `db/seed/` CSVs that carry the real card portfolio — they are gitignored on purpose
