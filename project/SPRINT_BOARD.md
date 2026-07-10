# Sprint Board

## Current Sprint: W1-S3 — Transaction Processing

**Branch:** sprint/W1-S3
**Goal:** Transactions categorized, splits supported, historical data backfilled.
**Sync point:** #4 — Categorization engine trained

### Backlog

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| ENH-009 | Enhancement | Split logic: TransactionSplit with mySharePct/myShareAmount. Budget uses myShareAmount, churning uses parent Transaction.amount. splitTransaction action + validation (enter %/$ not both, sum, recurring suggestion). | Backlog |
| FRM-001 | Form | Transaction List: Fiori Elements List Report + Object Page — inline edit (vendor/PT/EC/notes), Split dialog, Apply Categories bulk, Re-categorize action, splits section, filters. | Backlog |
| CNV-001 | Conversion | Historical backfill: BackfillService orchestration (parse via INT-002 → ENH-008 dedup → ENH-001 categorize → ImportLog), purchases-only + date-cutoff filters, halt-on-parse-error, supp-card attribution. Scenario test. | Backlog |

### In Progress

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| ENH-001 | Enhancement | Categorization engine: three-pass matching pipeline (exact → starts-with → contains, fuse.js fuzzy fallback) returning vendor + dual taxonomy; user correction auto-creates MerchantPattern (learning). MerchantPattern entity + VendorCategoryStats CDS view. Wires deferred FRM-003 fuzzy pre-fill. | In Progress |

### Done

_None yet_

---

## Previous Sprint: W1-S2 — Ingestion Pipeline (merged 9bbe826, tagged v1.2)

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| INT-001 | Integration | SimpleFIN Bridge sync: 4-layer engine, ENH-008 dedup, node-cron scheduling, encrypted access URL, retry/backoff, connection_error/stale_data/unmapped_account alerts, null-card backfill | Done |
| INT-002 | Integration | CSV parsing engine: 4-layer engine + field parser + mapper, per-issuer format config resolution (Scotia/TD/CIBC/Amex), dedup classification, parseCsvImport action | Done |
| ENH-008 | Enhancement | Deduplication engine: evaluate() returns new/duplicate/potential_duplicate per SPEC-01 §4.3 | Done |
| FRM-003 | Form | CSV Import Wizard: 3-step freestyle wizard, tabbed review, saveCsvImport action, Import Log + Vendor entity + Transaction categorization FKs | Done |
| FRM-010 | Form | Connection Manager: freestyle health page, manual Sync Now, Add Connection, Re-authenticate, account→card mapping | Done |

---

## W1-S1 — Foundation & Seed Data (merged 0a9804f, tagged v1.1)

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| CNV-002 | Conversion | Seed reference lookup tables from design specs | Done |
| CNV-003 | Conversion | Seed Sandro's card portfolio and historical data | Done |
| FRM-009 | Form | Master Data Maintenance: SM30-style CRUD for all config tables | Done |
