# SPEC-01: Ingestion Pipeline

**Spec ID:** SPEC-01
**Name:** Ingestion Pipeline
**FRICEW Objects:** INT-001, INT-002, ENH-008, FRM-003, FRM-010
**Wave:** 1
**Sprint:** W1-S2
**CDS Services:** TransactionService (INT-002, ENH-008), AdminService (INT-001, FRM-010)
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-16 | Sandro & Claude | Initial creation — workshop complete. D-87 through D-91 logged. |
| 2026-02-16 | Sandro & Claude | Cross-spec amendments from SPEC-14: FRM-003 multi-file upload (D-108), Import Log `skipped_count`, System Config `SIMPLEFIN_CONNECTION_DATE`. |

---

## 2. Overview

The ingestion pipeline is how transactions enter the system. SimpleFIN Bridge pulls daily from TD, Amex, and CIBC (INT-001). CSV import handles Scotiabank ongoing and provides backfill infrastructure shared with CNV-001 (INT-002). A shared deduplication engine (ENH-008) prevents double-counting across sources and repeat imports. FRM-003 is the wizard UI for CSV imports with batch categorization. FRM-010 manages SimpleFIN connections and account-to-card mapping.

Key decisions: D-30 (SimpleFIN as V1 aggregator), D-31 (Scotia CSV), D-33 (Amex supp workaround), D-34 (broken connection detection), D-42 (ignore pending), D-87 (System Config), D-88 (two-tier dedup), D-89 (batch import UX), D-90 (CSV Format Config expansion), D-91 (Amex supp card CSV attribution).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Transaction | Target for all ingested transactions | §5.1 | — |
| Provider Connection | SimpleFIN credentials + health status | §4.12 | — |
| Provider Account | Maps SimpleFIN accounts → card instances | §4.13 | — |
| Card Instance | Transaction attribution target | §4.4 | Add `cardholder_name` (text, optional) |
| CSV Format Config | Issuer-specific parsing rules | §3.6 | Add `status_column`, `status_posted_value`, `debit_column`, `credit_column`, `cardmember_column`. Make `amount_column`/`amount_sign` optional. |
| Vendor | Created on-the-fly during CSV review | §4.8 | — |
| Alert | Connection errors, stale data, unmapped accounts | §6.1 | — |
| **System Config** | **NEW** — TVARVC-style runtime parameters | — | New entity (D-87) |
| **Import Log** | **NEW** — CSV import history | — | New entity (D-89) |

### System Config (NEW — D-87)

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| key | text | yes | Unique parameter name |
| value | text | yes | Parsed at runtime |
| description | text | yes | Human-readable explanation |

Initial parameters:

| Key | Default | Description |
|-----|---------|-------------|
| SIMPLEFIN_SYNC_TIME | 20:00 | Daily sync time (HH:MM, 24h) |
| SIMPLEFIN_LOOKBACK_DAYS | 7 | Days to look back on each sync |
| SIMPLEFIN_RETRY_ATTEMPTS | 3 | HTTP retry count on failure |
| SIMPLEFIN_STALE_DAYS | 3 | Days without sync before stale alert |

### Import Log (NEW — D-89)

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| card_instance_id | FK → Card Instance | yes | |
| file_name | text | yes | Original file name |
| import_date | timestamp | yes | |
| transaction_count | integer | yes | |
| total_amount | decimal | yes | Sum of imported amounts |

### CSV Format Config Amendments

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| status_column | text | no | Column for posted/pending status |
| status_posted_value | text | no | Value meaning "posted" (e.g., "posted") |
| debit_column | text | no | For split debit/credit formats (TD, CIBC) |
| credit_column | text | no | For split debit/credit formats (TD, CIBC) |
| cardmember_column | text | no | For supp card attribution (Amex) |

When `debit_column`/`credit_column` are set, `amount_column`/`amount_sign` are null (and vice versa).

### Card Instance Amendment

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| cardholder_name | text | no | For CSV supp card attribution (e.g., "SANDRO SERYANI") |

---

## 4. Functional Description

### 4.1 INT-001 — SimpleFIN Transaction Sync [Interface]

**API Contract:**

| Element | Detail |
|---------|--------|
| Protocol | HTTPS, HTTP Basic Auth |
| Base URL | Decrypted from `Provider Connection.access_url_enc` |
| Endpoint | `GET /accounts?start-date={epoch}&end-date={epoch}` |
| Rate limit | 24 requests/day per access token |
| Response | `{ errors: [], accounts: [{ id, name, currency, balance, transactions: [...] }] }` |

**Data Mapping:**

| SimpleFIN Field | Transaction Attribute | Transform |
|----------------|----------------------|-----------|
| `id` | `external_id` | Direct — stable ID for dedup |
| `posted` | `posted_at` | UNIX epoch → date |
| `amount` | `amount` | String → decimal. Negative = charge. |
| `description` | `raw_description` | Direct, never modified |
| `transacted_at` | `transacted_at` | UNIX epoch → date (if present) |
| `pending` | — | Discarded. `?pending=1` not used (D-42). |
| (account mapping) | `card_instance_id` | Provider Account → Card Instance FK |
| (account mapping) | `provider_account_id` | Resolving Provider Account |
| — | `source` | `simplefin` |
| — | `categorization_status` | `uncategorized` |
| — | `is_excluded` | `false` |

**Scheduling:** Daily poll via `node-cron` + `cds.spawn()`. Time from `SIMPLEFIN_SYNC_TIME` (default 20:00).

**Sync Process:**

1. For each active Provider Connection, decrypt `access_url_enc`
2. `GET /accounts?start-date={today - SIMPLEFIN_LOOKBACK_DAYS}`
3. Check `errors` array → non-empty: `connection_error` alert, `last_sync_status = error`. Non-errored accounts still processed.
4. For each account, match to Provider Account by `external_account_id`
5. Unrecognized accounts → auto-create Provider Account (`card_instance_id = null`), `unmapped_account` alert
6. For each transaction, dedup via ENH-008 (`external_id` match → skip)
7. Insert new transactions
8. Update `last_sync_at`, `last_sync_status = success`

**Retry:** On HTTP failure, retry up to `SIMPLEFIN_RETRY_ATTEMPTS` (default 3) with exponential backoff (2s, 4s, 8s). All retries exhausted → `connection_error` alert.

**Stale Detection:** `last_sync_at` older than `SIMPLEFIN_STALE_DAYS` (default 3) → `stale_data` alert.

**Manual Sync:** "Sync Now" in FRM-010 triggers immediate sync for one connection, same logic as scheduled.

**Unmatched Transaction Backfill:** When Provider Account `card_instance_id` is set from null, all its null-card transactions are backfilled.

**Connection Setup:**

1. User clicks "Add Connection" in FRM-010
2. SimpleFIN setup page opens in new browser tab
3. User connects banks, copies Setup Token
4. User pastes token into FRM-010
5. System claims token, stores encrypted Access URL
6. Provider Connection created with `last_sync_status = never_synced`
7. Accounts populated on first sync

### 4.2 INT-002 — CSV Transaction Import [Interface]

**Parsing:** `papaparse` (D-48) with CSV Format Config rules per issuer. CSV files only — Amex `.xls` exports must be converted to `.csv` before upload.

**Format Auto-Detection:** Resolved from selected card → issuer → CSV Format Config. No config → warning, import blocked.

**Data Mapping:**

| CSV Column (via Config) | Transaction Attribute | Transform |
|------------------------|----------------------|-----------|
| date column | `posted_at` | Parsed per config's `date_format` |
| amount column(s) | `amount` | Single: parse + sign per `amount_sign`. Split: debit → negative, credit → positive. Strip `$` and `,`. |
| description column | `raw_description` | Direct, trimmed |
| cardmember column | `card_instance_id` | Match to `Card Instance.cardholder_name`. Fallback to main card. |
| (wizard selection) | `card_instance_id` | From step 1 (overridden by cardmember when applicable) |
| — | `source` | `csv` |
| — | `external_id` | `null` |
| — | `categorization_status` | `uncategorized` (overridden if user categorizes in wizard) |
| — | `is_excluded` | `false` |

**Status Filtering:** When `status_column`/`status_posted_value` set, only matching rows processed. Others discarded.

**Issuer Format Summary:**

| Issuer | Headers | Skip Rows | Date Format | Amount Style | Cardmember | Status Column |
|--------|---------|-----------|-------------|-------------|------------|---------------|
| Scotiabank | Yes | 1 | YYYY-MM-DD | Single, neg = credit | No | Yes ("posted") |
| TD | No | 0 | MM/DD/YYYY | Split debit/credit | No | No |
| CIBC | No | 0 | YYYY-MM-DD | Split debit/credit | No | No |
| Amex | Yes | 12 | DD MMM. YYYY | Single with `$`, neg = credit | Yes | No |

Actual CSV samples: `design/actual-csvs/`

### 4.3 ENH-008 — Transaction Deduplication [Enhancement]

**Inputs:** Incoming transaction + existing DB transactions.
**Outputs:** `new` | `potential_duplicate`

**Two-Tier Strategy (D-88):**

| Scenario | Match Key | Result | User Action |
|----------|-----------|--------|-------------|
| SimpleFIN → SimpleFIN | `external_id` exact on same card | Auto-skip | None (silent) |
| CSV → existing (any source) | `raw_description` (exact, trimmed) + `posted_at` (date only) + `amount` (exact) + `card_instance_id` | Potential duplicate | Side-by-side review, skip or override |
| No match | — | New | Imported |

**Within-batch rule:** Rows within the same CSV import are NOT deduplicated against each other. Three identical charges in one file = three new transactions.

### 4.4 FRM-003 — CSV Import Wizard [Form]

**Type:** Freestyle SAPUI5 Wizard (`sap.m.Wizard`). TransactionService.

**Step 1 — Upload & Select Card:**

- Drag-and-drop or file picker (`.csv` only)
- Card selector: dropdown of non-closed card instances
- Auto-resolves CSV Format Config from card's issuer; warning if unrecognized

**Step 2 — Review:**

Three tabs with badge counts: **New** | **Potential Duplicates** | **Excluded**

**New Tab Columns:**

| Column | Source | Editable | Notes |
|--------|--------|----------|-------|
| Date | Parsed | Yes | |
| Description | `raw_description` | Yes | |
| Amount | Parsed | Yes | |
| Vendor | ENH-001 suggestion | Yes | Fuzzy search value help (fuse.js). On-the-fly creation. |
| Purchase Type/Subtype | ENH-001 suggestion | Yes | Dropdown. On-the-fly creation. |
| Earning Category | ENH-001 suggestion | Yes | Dropdown. On-the-fly creation. |
| Earning Yield | Computed | No | `amount × multiplier × CPP / 100` |
| Card | Cardmember match | Yes (dropdown) | Only shown when card has supplementary cards |

**Batch Categorization Workflow:**

| Action | Behavior |
|--------|----------|
| **Clear** | Confirms row (read-only). Propagates vendor, PT/subtype, EC to all uncleared rows with same `raw_description`. |
| **Clear All Matching** | Bulk-confirms all pre-filled rows with same `raw_description`. |
| **Undo Clear** | Reverts row + all values it propagated. |
| **Multi-select Apply** | Apply same vendor/categories to multiple selected rows. |
| **Import Uncategorized** | Clear without vendor/categories → imports as `uncategorized`. |

**Sort/Group:** By `raw_description` to cluster identical descriptions.

**Running Totals (cleared rows only):** Total amount, total points, total points value, overall yield.

**Progress Indicator:** "{N} of {total} cleared"

**Potential Duplicates Tab:** Side-by-side (CSV row vs existing). Actions: Skip or Import Anyway.

**Excluded Tab:** Parse-error rows with erroneous field in error state. User edits to fix → row moves to New.

**Step 3 — Confirm & Save:**

- Summary: new count, duplicates skipped, excluded count
- Save imports cleared rows from New + overridden duplicates only
- Post-import summary: transaction count, top vendor, new vendors created, earning yield, total amount

**Import History:** Viewable from FRM-003. Records: date, file name, card, transaction count, total amount.

### 4.5 FRM-010 — SimpleFIN Connection Manager [Form]

**Type:** Freestyle SAPUI5 single-page. AdminService.

**Layout:** Connection list at top → select connection → Provider Accounts below.

**Connection List:**

| Column | Type | Notes |
|--------|------|-------|
| Display Name | text | |
| Last Sync | timestamp | |
| Status | ObjectStatus | success (green) / error (red) / never_synced (grey) |
| Error Message | text | Shown when status = error |
| Active | toggle | |

**Provider Account List:**

| Column | Type | Notes |
|--------|------|-------|
| Account Name | text | From SimpleFIN |
| External Account ID | text | |
| Card Instance | dropdown | Map to card instance |
| Active | toggle | |

**Actions:**

| Action | Behavior |
|--------|----------|
| Add Connection | Opens SimpleFIN setup page (new tab) + paste token field |
| Sync Now | Immediate sync for selected connection |
| Re-authenticate | Opens SimpleFIN dashboard (new tab) |
| Deactivate/Reactivate | Toggle on connections and accounts |

---

## 5. Business Rules

### INT-001 — SimpleFIN Sync

| Rule | Description |
|------|-------------|
| BR-01 | Daily sync at configurable time (default 20:00) via `SIMPLEFIN_SYNC_TIME`. |
| BR-02 | Lookback window: `today - SIMPLEFIN_LOOKBACK_DAYS` (default 7). |
| BR-03 | HTTP failure: retry up to `SIMPLEFIN_RETRY_ATTEMPTS` (default 3), exponential backoff (2s, 4s, 8s). |
| BR-04 | Non-empty `errors` array → `connection_error` alert, `last_sync_status = error`. Non-errored accounts still processed. |
| BR-05 | No sync for `SIMPLEFIN_STALE_DAYS` (default 3) → `stale_data` alert. |
| BR-06 | Unrecognized accounts: auto-create Provider Account with null card, store transactions with null card, `unmapped_account` alert. |
| BR-07 | Card mapping set on Provider Account → backfill all null-card transactions. |
| BR-08 | `posted = 0` (pending) transactions discarded (D-42). |
| BR-09 | Dedup via `external_id`: exact match on same card = auto-skip, silent. |

### INT-002 — CSV Import

| Rule | Description |
|------|-------------|
| BR-10 | Format config auto-resolved from card's issuer. No config → warning, blocked. |
| BR-11 | Status column filtering: only rows matching `status_posted_value` processed. |
| BR-12 | Parse failures → Excluded tab with erroneous field in error state. Editable. |
| BR-13 | Whitespace trimmed on all parsed fields. |
| BR-14 | Amount normalized: negative = charge, positive = credit/refund. |
| BR-33 | Supp card attribution: cardmember column matched to `Card Instance.cardholder_name`. User override via dropdown. |
| BR-34 | Amount parsing strips `$` and `,` before decimal conversion. |
| BR-35 | Column mapping supports column names (headers) and column indices (headerless). |

### ENH-008 — Deduplication

| Rule | Description |
|------|-------------|
| BR-15 | SimpleFIN-to-SimpleFIN: `external_id` match = auto-skip, no review. |
| BR-16 | All other: `raw_description` (exact, trimmed) + `posted_at` (date only) + `amount` (exact) + `card_instance_id` → potential duplicate for review. |
| BR-17 | User can override any potential duplicate and force import. |

### FRM-003 — CSV Import Wizard

| Rule | Description |
|------|-------------|
| BR-18 | Step 1 requires file + card selection. |
| BR-19 | Three tabs: New, Potential Duplicates, Excluded. Badge counts on labels. |
| BR-20 | New tab pre-populates vendor, PT/subtype, EC from ENH-001 matching. |
| BR-21 | Clear propagates vendor, PT/subtype, EC to uncleared rows with same `raw_description`. |
| BR-22 | "Clear All Matching" bulk-confirms pre-filled rows with same `raw_description`. |
| BR-23 | Undo clear reverts row + all propagated values. |
| BR-24 | Only cleared rows submitted on Save. |
| BR-25 | Earning yield per row. Running totals (cleared): amount, points, value, yield. |
| BR-26 | On-the-fly creation via value help: Vendors, Purchase Types, Earning Categories. |
| BR-27 | Multi-select: apply same vendor/categories to multiple rows. |
| BR-28 | Potential Duplicates: side-by-side, Skip or Import Anyway. |
| BR-36 | Import history log: date, file name, card, count, total amount. |
| BR-37 | Post-import summary: count, top vendor, new vendors, yield, total. |
| BR-38 | Drag-and-drop upload alongside file picker. |

### FRM-010 — SimpleFIN Connection Manager

| Rule | Description |
|------|-------------|
| BR-29 | Add connection: SimpleFIN setup page (new tab) + paste token. |
| BR-30 | Card mapping dropdown on Provider Account. Update triggers BR-07 backfill. |
| BR-31 | Sync Now: immediate sync, same retry logic as scheduled (BR-03). |
| BR-32 | Deactivated connections skipped during daily sync. |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| SimpleFIN HTTP failure (after retries) | `connection_error` alert, `last_sync_status = error` | `ingestion.simplefin.connectionError` |
| SimpleFIN `errors` array non-empty | `connection_error` alert with institution name | `ingestion.simplefin.bankError` |
| No sync for N days | `stale_data` alert | `ingestion.simplefin.staleData` |
| Unrecognized SimpleFIN account | Auto-create + `unmapped_account` alert | `ingestion.simplefin.unmappedAccount` |
| Access token invalid | `connection_error` alert, prompt re-setup | `ingestion.simplefin.invalidToken` |
| No CSV Format Config for issuer | Warning, import blocked | `ingestion.csv.noFormatConfig` |
| CSV row parse failure | Row to Excluded tab, field in error state | `ingestion.csv.parseError` |
| CSV file empty or unreadable | Error message, import aborted | `ingestion.csv.invalidFile` |

---

## 7. Open Items

| OI | Resolution |
|----|------------|
| OI-06 | Three alert types defined: `connection_error`, `stale_data`, `unmapped_account`. Seed values for SPEC-06. |

---

## 8. Functional Unit Tests

### FUT-001: Daily SimpleFIN sync ingests new transactions

**Covers:** INT-001, ENH-008

**Preconditions:**

- Provider Connection active, last synced yesterday
- Provider Account mapped to Amex Cobalt
- 3 new transactions posted since last sync

**Steps:**

1. Scheduled sync fires at configured time
2. System calls SimpleFIN API with lookback window
3. 3 transactions returned, none match existing `external_id`

**Expected Result:**

- 3 Transaction records created: `source = simplefin`, `categorization_status = uncategorized`, correct `card_instance_id`
- `last_sync_at` updated, `last_sync_status = success`

---

### FUT-002: SimpleFIN sync skips duplicates via external_id

**Covers:** INT-001, ENH-008

**Preconditions:**

- 5 transactions returned, 3 already exist with matching `external_id`

**Steps:**

1. Sync processes 5 transactions through dedup

**Expected Result:**

- 2 new transactions created, 3 silently skipped
- No user interaction

---

### FUT-003: SimpleFIN connection error generates alert

**Covers:** INT-001

**Preconditions:**

- Provider Connection active, bank requires re-authentication

**Steps:**

1. Sync fires, API response contains non-empty `errors` array

**Expected Result:**

- `connection_error` alert with institution name
- `last_sync_status = error`
- Non-errored accounts in same response still processed

---

### FUT-004: Stale data alert after 3 days

**Covers:** INT-001

**Preconditions:**

- Provider Connection `last_sync_at` = 4 days ago, status = error

**Steps:**

1. Daily check evaluates stale threshold

**Expected Result:**

- `stale_data` alert referencing the connection

---

### FUT-005: Unmatched SimpleFIN account auto-creates Provider Account

**Covers:** INT-001

**Preconditions:**

- User linked new bank account in SimpleFIN
- No Provider Account for returned `account.id`

**Steps:**

1. Sync returns transactions for unknown account

**Expected Result:**

- Provider Account created with `card_instance_id = null`
- Transactions stored with `card_instance_id = null`
- `unmapped_account` alert

---

### FUT-006: Card mapping backfills queued transactions

**Covers:** INT-001, FRM-010

**Preconditions:**

- 10 transactions with `card_instance_id = null` on unmapped Provider Account

**Steps:**

1. User maps Provider Account to Card Instance in FRM-010

**Expected Result:**

- All 10 transactions updated with new `card_instance_id`

---

### FUT-007: SimpleFIN sync retries on HTTP failure

**Covers:** INT-001

**Preconditions:**

- Provider Connection active, SimpleFIN returning 500 errors

**Steps:**

1. First call fails → retry after 2s → fails → retry after 4s → fails → retry after 8s → fails

**Expected Result:**

- 3 retries attempted per `SIMPLEFIN_RETRY_ATTEMPTS`
- `connection_error` alert after all retries exhausted

---

### FUT-008: CSV import happy path

**Covers:** INT-002, ENH-008, FRM-003

**Preconditions:**

- CSV Format Config exists for Scotiabank
- Scotia Gold Amex card instance exists
- CSV with 20 posted transactions, none in system

**Steps:**

1. Upload CSV, select Scotia Gold Amex
2. All 20 land in New tab
3. Categorize first "cineplex" row, clear → second cineplex auto-fills
4. Clear all remaining rows
5. Save

**Expected Result:**

- 20 transactions created: `source = csv`, correct card, assigned categories
- Progress showed "20 of 20 cleared"
- Post-import summary displayed
- Import log entry created

---

### FUT-009: CSV dedup flags potential duplicates

**Covers:** INT-002, ENH-008, FRM-003

**Preconditions:**

- 5 of 15 CSV rows match existing transactions (description + date + amount + card)

**Steps:**

1. Upload CSV
2. Tabs show: New (10), Potential Duplicates (5), Excluded (0)
3. Review duplicates side-by-side, skip 4, import 1

**Expected Result:**

- 11 transactions created (10 new + 1 override)

---

### FUT-010: CSV parsing failure in Excluded tab

**Covers:** INT-002, FRM-003

**Preconditions:**

- CSV with 15 rows, 2 have malformed dates

**Steps:**

1. Upload CSV
2. 2 rows in Excluded tab, date field in error state
3. Correct one date → moves to New tab
4. Clear and save

**Expected Result:**

- Corrected row imported, uncorrected row not imported

---

### FUT-011: Clear propagation and undo

**Covers:** FRM-003

**Preconditions:**

- CSV with 8 rows, 5 share `raw_description` "AMZN MKTP US"

**Steps:**

1. Categorize first Amazon row: Vendor=Amazon, PT=Shopping, EC=Online Shopping
2. Clear → 4 matching rows auto-fill
3. Undo clear

**Expected Result:**

- First row reverts to uncleared, editable
- 4 propagated rows revert to pre-propagation state

---

### FUT-012: Three identical charges not auto-skipped

**Covers:** ENH-008, FRM-003

**Preconditions:**

- CSV with 3 rows: same description "todoist", same date, same amount $10.00

**Steps:**

1. Upload CSV (first import, no existing matches)
2. All 3 in New tab
3. Clear all three, save

**Expected Result:**

- 3 separate transactions created

---

### FUT-013: Manual sync from FRM-010

**Covers:** INT-001, FRM-010

**Preconditions:**

- Provider Connection active, healthy

**Steps:**

1. Click "Sync Now" on connection in FRM-010

**Expected Result:**

- Immediate sync with same logic as scheduled
- `last_sync_at` updated

---

### FUT-014: Add new SimpleFIN connection

**Covers:** FRM-010

**Preconditions:**

- User has SimpleFIN account with Setup Token

**Steps:**

1. Click "Add Connection"
2. SimpleFIN page opens in new tab
3. Paste Setup Token
4. System claims token, stores encrypted Access URL

**Expected Result:**

- Provider Connection created: `last_sync_status = never_synced`
- Accounts populated on first sync

---

### FUT-015: Amex CSV with supplementary card attribution

**Covers:** INT-002, FRM-003

**Preconditions:**

- Amex Cobalt with 2 supplementary cards (Karl, Maya)
- All three have `cardholder_name` populated
- Amex CSV with transactions from all three cardholders

**Steps:**

1. Upload CSV, select Amex Cobalt
2. Card column appears (supp cards detected)
3. System defaults: "SANDRO SERYANI" → main, "KARL SERYANI" → Supp 1, "MAYA FOUNEV" → Supp 2
4. Review, clear, save

**Expected Result:**

- Transactions attributed to correct card instances per cardmember

---

## 9. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-02 (Transaction Processing) | Spending Goals should support ad-hoc "block" tagging for trip/event expenses. |
| SPEC-06 (Reference Data & Seed) | System Config entity seeded. Alert Type seed values: `connection_error`, `stale_data`, `unmapped_account`. CSV Format Config entries for 4 issuers. |
| SPEC-09 (Goals) | "Block" concept = spending Goal with short time window. Design for ad-hoc trip tagging. |
| SPEC-14 (Historical Backfill) | Uses INT-002 infrastructure. Actual CSV samples in `design/actual-csvs/`. Validate all issuer formats during that workshop. |
| SPEC-14 (Historical Backfill) | **Amendments from SPEC-14:** (1) FRM-003: add multi-file upload with same-card restriction (D-108). (2) Import Log: add `skipped_count` (integer). (3) System Config: add `SIMPLEFIN_CONNECTION_DATE` (date, default null). |
| UX Persona | Explore keyboard-driven review flow for FRM-003 during build. |

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects INT-001, INT-002, ENH-008, FRM-003, FRM-010 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-87–D-91 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md).*
