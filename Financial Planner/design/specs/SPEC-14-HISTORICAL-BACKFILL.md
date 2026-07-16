# SPEC-14: Historical Transaction Backfill

**Spec ID:** SPEC-14
**Name:** Historical Transaction Backfill
**FRICEW Objects:** CNV-001
**Wave:** 1
**Sprint:** W1-S3
**CDS Services:** TransactionService (via INT-002 parsing logic)
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                       |
| ---------- | --------------- | ----------------------------------------------------------------- |
| 2026-02-16 | Sandro & Claude | Initial creation — workshop complete. D-107 through D-113 logged. |

---

## 2. Overview

One-time load of historical credit card transactions from 2023 to present via CSV exports across all 4 issuers (TD, Amex, CIBC, Scotiabank). CNV-001 is a scripted conversion run by Claude (D-107), not a UI-driven process through FRM-003. The script reuses INT-002 parsing infrastructure (CSV Format Config rules, papaparse) but automates the full pipeline: parse → filter → categorize → load → reconcile.

Execution dependency: CNV-002 (reference data) → CNV-003 (card portfolio) → CNV-001 (historical transactions). The script requires all reference data and card instances to exist before running.

Categorization is performed as part of the conversion (D-110): ENH-001 rules match known vendors, Claude reasoning fills gaps, and Sandro reviews/approves remaining unmatched transactions. This bootstraps ENH-001's learned patterns for strong day-one auto-categorization.

Key decisions: D-13 (historical backfill to 2023 via CSV), D-107 (scripted conversion), D-108 (FRM-003 multi-file upload — separate SPEC-01 amendment), D-109 (purchases only), D-110 (three-tier categorization), D-111 (date cutoff strategy), D-112 (halt on parse errors), D-113 (Amex Cobalt supp cards only).

---

## 3. Data Model References

| Entity                | Role                                  | DM-001 Ref | Amendment?                                |
| --------------------- | ------------------------------------- | ---------- | ----------------------------------------- |
| Transaction           | Target for all loaded transactions    | §5.1       | —                                         |
| Card Instance         | Transaction attribution target        | §4.4       | —                                         |
| Supplementary Card    | Amex Cobalt supp card matching        | §4.5       | —                                         |
| CSV Format Config     | Issuer-specific parsing rules         | §3.6       | — (SPEC-01 amendments apply)              |
| Import Log            | One entry per file processed          | SPEC-01    | Add `skipped_count` (integer)             |
| Vendor                | Created/matched during categorization | §4.8       | —                                         |
| Merchant Pattern      | Used by ENH-001 for vendor matching   | §4.9       | —                                         |
| Vendor Category Stats | Updated by categorization assignments | §4.15      | —                                         |
| Purchase Type         | Assigned during categorization        | §3.3       | —                                         |
| Earning Category      | Assigned during categorization        | §3.4       | —                                         |
| System Config         | SimpleFIN connection date for cutoff  | SPEC-01    | Add `SIMPLEFIN_CONNECTION_DATE` parameter |

### Import Log Amendment

| New Attribute | Type    | Required | Notes                                                           |
| ------------- | ------- | -------- | --------------------------------------------------------------- |
| skipped_count | integer | yes      | Count of rows skipped (payments, refunds, post-cutoff, pending) |

### System Config Addition

| Key                       | Default | Description                                                                                                   |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| SIMPLEFIN_CONNECTION_DATE | null    | Date SimpleFIN was first connected (YYYY-MM-DD). Used as cutoff for historical CSV backfill (TD, Amex, CIBC). |

---

## 4. Functional Description

### 4.1 CNV-001 — Historical Transaction Backfill [Conversion]

**Approach:** Scripted conversion run by Claude interactively (D-107). TypeScript/CAP script that reads CSV files, applies INT-002 parsing logic, filters, categorizes, and bulk-inserts into PostgreSQL. Not exposed as a UI action.

**Pre-requisites:**

| #   | Requirement                                            | Validation                                                            |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| 1   | CNV-002 complete — all reference data seeded           | Issuers, Purchase Types, Earning Categories, CSV Format Configs exist |
| 2   | CNV-003 complete — Sandro's card portfolio seeded      | Card Instances for all 4 issuers exist with correct `cardholder_name` |
| 3   | ENH-001 built — categorization engine operational      | Vendor matching and category assignment functions callable            |
| 4   | Full-history CSV exports downloaded from all 4 issuers | Files present in designated directory                                 |
| 5   | `SIMPLEFIN_CONNECTION_DATE` recorded in System Config  | Set before running (or null if SimpleFIN not yet connected)           |

**File Inventory:**

| Issuer     | File Pattern                                     | Cards                        | Est. Files | Est. Rows        |
| ---------- | ------------------------------------------------ | ---------------------------- | ---------- | ---------------- |
| TD         | Monthly per-card (`accountactivity-{month}.csv`) | 3 (Aeroplan, FCT #1, FCT #2) | ~90        | ~300–500         |
| Amex       | All-transactions per card                        | 3 (Cobalt, Gold, Bonvoy)     | 3          | ~500             |
| CIBC       | All-transactions per card                        | 2 (Aventura, Aeroplan)       | 2          | ~300             |
| Scotiabank | All-transactions                                 | 1 (Amex Gold)                | 1          | ~80              |
| **Total**  |                                                  | **9 cards**                  | **~96**    | **~1,200–1,400** |

**Processing Flow:**

```
For each card:
  1. Identify CSV file(s) for this card
  2. Parse using INT-002 logic (CSV Format Config for issuer)
  3. Filter: purchases only (BR-01)
     - Scotia: Type of Transaction = "Debit"
     - TD/CIBC: debit column populated
     - Amex: positive amounts only
  4. Filter: date cutoff (BR-02/BR-03)
     - TD/Amex/CIBC: posted_at < SIMPLEFIN_CONNECTION_DATE
     - Scotiabank: no cutoff (full range)
  5. Filter: status (Scotia only — posted transactions only)
  6. Map fields to Transaction entity (per INT-002 data mapping)
  7. Supp card matching (Amex Cobalt only — BR-05)
  8. Categorize — three tiers:
     a. ENH-001 rules (vendor matching → Purchase Type + Earning Category)
     b. Claude reasoning for unmatched (propose categories)
     c. Sandro review for remaining ambiguous
  9. Create Vendor records as needed (ENH-009 normalization)
  10. Bulk insert Transaction records (all-or-nothing per file)
  11. Create Import Log entry
  12. Reconcile (BR-11)
```

**Data Mapping:**

Reuses INT-002 data mapping (SPEC-01 §4.2) with these fixed values:

| Field                   | Value         | Notes                                          |
| ----------------------- | ------------- | ---------------------------------------------- |
| `source`                | `csv`         | All historical transactions                    |
| `external_id`           | `null`        | CSV transactions have no external ID           |
| `is_excluded`           | `false`       | Default                                        |
| `categorization_status` | `categorized` | All transactions categorized during conversion |

**Categorization Strategy (D-110):**

Three-tier approach, executed per card batch:

| Tier | Actor   | Input                    | Output                                                |
| ---- | ------- | ------------------------ | ----------------------------------------------------- |
| 1    | ENH-001 | Raw merchant description | Vendor match → Purchase Type + Earning Category       |
| 2    | Claude  | Unmatched descriptions   | Proposed vendor name, Purchase Type, Earning Category |
| 3    | Sandro  | Claude's proposals       | Approve, correct, or assign manually                  |

Tier 2 and 3 corrections feed back into ENH-001 as learned patterns (Merchant Pattern + Vendor Category Stats), bootstrapping the categorization engine for ongoing use.

**Reconciliation Report (per card):**

| Check              | Detail                                                        |
| ------------------ | ------------------------------------------------------------- |
| Row count          | Imported + skipped = total CSV rows (minus headers/skip rows) |
| Skipped breakdown  | Payments: N, Refunds: N, Post-cutoff: N, Pending: N           |
| Date range         | Earliest and latest `posted_at` match expected range          |
| Field completeness | Zero nulls in: vendor, purchase_type, earning_category        |
| Amount total       | Sum of imported amounts (for spot-check)                      |

---

## 5. Business Rules

| Rule  | Description                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Purchases only — skip payments and refunds. Scotia: Type="Debit" + status="posted". TD/CIBC: debit column populated. Amex: positive amounts only.                               |
| BR-02 | Date cutoff for TD, Amex, CIBC: import only transactions where `posted_at` < `SIMPLEFIN_CONNECTION_DATE`.                                                                       |
| BR-03 | No date cutoff for Scotiabank (not on SimpleFIN). Import full date range.                                                                                                       |
| BR-04 | Each CSV file maps to exactly one Card Instance. Card assigned before processing.                                                                                               |
| BR-05 | Amex Cobalt only: supplementary card attribution via Cardmember column → `Card Instance.cardholder_name` (D-91, D-113). All other cards: single cardholder, no matching needed. |
| BR-06 | Execution dependency: CNV-002 and CNV-003 must complete before CNV-001. Script validates pre-requisites before starting.                                                        |
| BR-07 | Halt on parse errors. Script stops on any unparseable row, logs file name and line number, waits for investigation before continuing.                                           |
| BR-08 | Categorization is mandatory. No transaction saved without Purchase Type + Earning Category. Three-tier: ENH-001 → Claude → Sandro (D-110).                                      |
| BR-09 | New vendors auto-created following ENH-009 normalization rules. Existing vendors matched, no duplicates.                                                                        |
| BR-10 | One Import Log entry per file: source filename, card, imported count, skipped count, total amount, date range.                                                                  |
| BR-11 | Reconciliation checks run after each card's batch: row counts, date range, field completeness, amount total.                                                                    |
| BR-12 | Sandro downloads full-history CSVs from all 4 issuers before SimpleFIN goes live. Pre-requisite action item.                                                                    |
| BR-13 | All-or-nothing per file. If processing halts mid-file, no transactions from that file are committed. Fix and reprocess the entire file.                                         |

---

## 6. Error Handling

| Condition                                                         | Response                                                | Resolution                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| CSV row unparseable (bad date, missing amount)                    | Script halts, logs file name + line number + raw row    | Investigate, fix source data or skip row manually                   |
| Unknown Cardmember on Amex Cobalt                                 | Script halts, shows unmatched name                      | Add `cardholder_name` to Card Instance or Supplementary Card, retry |
| Card Instance not found for file                                  | Script halts before processing                          | Verify CNV-003 loaded correctly                                     |
| CSV Format Config missing for issuer                              | Script halts before processing                          | Verify CNV-002 loaded correctly                                     |
| ENH-001 not available                                             | Script halts before processing                          | Verify ENH-001 is built and operational                             |
| Vendor name collision (same normalized name, different merchants) | Flag for manual resolution during categorization review | Sandro disambiguates                                                |
| `SIMPLEFIN_CONNECTION_DATE` not set (null)                        | Warning — all transactions imported (no cutoff applied) | Set the date if SimpleFIN is already connected                      |

---

## 7. Open Items

None. All questions resolved during workshop.

---

## 8. Functional Unit Tests

### FUT-01: Load Scotiabank CSV — purchases only

**Covers:** CNV-001, INT-002 parsing

**Preconditions:**

- CSV Format Config for Scotiabank exists
- Scotia Amex Gold card instance exists
- Scotiabank CSV with 50 data rows: 35 debits (posted), 10 credits (payments), 5 pending

**Steps:**

1. Script processes Scotiabank CSV for Scotia Amex Gold
2. Filters: Type of Transaction = "Debit" AND status = "posted"

**Expected Result:**

- 35 transactions imported
- 15 rows skipped (10 payments + 5 pending)
- Import Log: imported_count = 35, skipped_count = 15

---

### FUT-02: Load TD monthly CSV — debit column only

**Covers:** CNV-001, INT-002 parsing

**Preconditions:**

- CSV Format Config for TD exists
- TD Aeroplan card instance exists
- TD monthly CSV with 20 rows: 15 with debit values, 5 with credit values (payments)

**Steps:**

1. Script processes TD CSV for TD Aeroplan

**Expected Result:**

- 15 transactions imported
- 5 rows skipped

---

### FUT-03: Load CIBC CSV — debit column only

**Covers:** CNV-001, INT-002 parsing

**Preconditions:**

- CSV Format Config for CIBC exists
- CIBC Aventura card instance exists
- CIBC CSV with 30 rows: 25 debits, 5 credits

**Steps:**

1. Script processes CIBC CSV for CIBC Aventura

**Expected Result:**

- 25 transactions imported
- 5 rows skipped

---

### FUT-04: Load Amex CSV (Gold) — positive amounts only

**Covers:** CNV-001, INT-002 parsing

**Preconditions:**

- CSV Format Config for Amex exists
- Amex Gold card instance exists
- Amex Gold CSV with 12 header rows + 40 data rows: 35 positive (purchases), 5 negative (credits/payments)

**Steps:**

1. Script processes Amex Gold CSV
2. Skips 12 header rows, filters positive amounts only

**Expected Result:**

- 35 transactions imported
- 5 rows skipped
- 12 header rows excluded from counts

---

### FUT-05: Load Amex Cobalt with supp card attribution

**Covers:** CNV-001, INT-002 parsing

**Preconditions:**

- Amex Cobalt card instance with `cardholder_name = "SANDRO SERYANI"`
- Two supplementary cards: `cardholder_name` = "KARL SERYANI" and "MAYA FOUNEV"
- Amex Cobalt CSV with transactions from all 3 cardholders

**Steps:**

1. Script processes Amex Cobalt CSV
2. Matches Cardmember column to card instances

**Expected Result:**

- "SANDRO SERYANI" transactions → Amex Cobalt card instance
- "KARL SERYANI" transactions → Supplementary Card 1
- "MAYA FOUNEV" transactions → Supplementary Card 2

---

### FUT-06: Unknown Cardmember halts script

**Covers:** CNV-001

**Preconditions:**

- Amex Cobalt CSV with a row where Cardmember = "UNKNOWN PERSON"
- No card instance or supplementary card with that `cardholder_name`

**Steps:**

1. Script encounters the unmatched row

**Expected Result:**

- Script halts with error identifying "UNKNOWN PERSON" as unmatched
- No transactions from this file committed (BR-13)

---

### FUT-07: Date cutoff applied to TD file

**Covers:** CNV-001

**Preconditions:**

- `SIMPLEFIN_CONNECTION_DATE` = 2026-02-01
- TD CSV with 20 purchase rows: 15 before Feb 1, 5 on or after Feb 1

**Steps:**

1. Script processes TD CSV with date cutoff

**Expected Result:**

- 15 transactions imported (pre-cutoff)
- 5 rows skipped as post-cutoff

---

### FUT-08: Scotiabank ignores date cutoff

**Covers:** CNV-001

**Preconditions:**

- `SIMPLEFIN_CONNECTION_DATE` = 2026-02-01
- Scotiabank CSV with purchase transactions from Oct 2025 through Feb 2026

**Steps:**

1. Script processes Scotiabank CSV

**Expected Result:**

- All purchase transactions imported regardless of date
- No cutoff applied (BR-03)

---

### FUT-09: Malformed row halts script

**Covers:** CNV-001

**Preconditions:**

- CIBC CSV with 30 rows, row 15 has invalid date "2023-13-45"

**Steps:**

1. Script processes rows 1–14 successfully
2. Script encounters row 15

**Expected Result:**

- Script halts, logs: file name, line 15, raw row content, "invalid date" error
- No transactions committed from this file (BR-13)

---

### FUT-10: ENH-001 categorizes known vendor

**Covers:** CNV-001, ENH-001

**Preconditions:**

- Vendor "Uber Eats" exists with Merchant Pattern matching "UBER EATS"
- Vendor Category Stats: Purchase Type = Dining/Delivery, Earning Category = Dining

**Steps:**

1. Script processes a row with raw_description "UBER EATS CA"
2. ENH-001 matches to Vendor "Uber Eats"

**Expected Result:**

- Transaction: vendor = Uber Eats, purchase_type = Dining, purchase_subtype = Delivery, earning_category = Dining
- `categorization_status = categorized`

---

### FUT-11: Claude reasoning proposes category for unmatched vendor

**Covers:** CNV-001

**Preconditions:**

- No Vendor or Merchant Pattern matching "NETFLIX.COM"

**Steps:**

1. ENH-001 fails to match
2. Claude reasons: "NETFLIX.COM" → Vendor "Netflix", Purchase Type = Subscriptions/Streaming, Earning Category = Streaming

**Expected Result:**

- Proposal presented to Sandro for approval
- On approval: Vendor created, Merchant Pattern created, transaction categorized
- Correction feeds into ENH-001 as learned pattern

---

### FUT-12: Post-load reconciliation — row counts

**Covers:** CNV-001

**Preconditions:**

- Scotiabank CSV with 86 rows (1 header): 60 debits-posted, 15 credits, 10 pending

**Steps:**

1. Script completes processing

**Expected Result:**

- Reconciliation report: 60 imported + 25 skipped = 85 data rows = 86 total − 1 header
- Counts balance

---

### FUT-13: Post-load reconciliation — date ranges

**Covers:** CNV-001

**Preconditions:**

- CIBC Aeroplan CSV with transactions from July 2023 to Feb 2026
- `SIMPLEFIN_CONNECTION_DATE` = 2026-02-01

**Steps:**

1. Script completes processing with cutoff

**Expected Result:**

- Reconciliation: earliest = July 2023, latest = Jan 2026 (pre-cutoff)
- Matches expected range

---

### FUT-14: Post-load reconciliation — field completeness

**Covers:** CNV-001

**Preconditions:**

- All transactions in a batch have been through three-tier categorization

**Steps:**

1. Script runs field completeness check

**Expected Result:**

- Zero transactions with null vendor, purchase_type, or earning_category
- Report confirms 100% field completeness

---

### FUT-15: Vendor auto-creation with normalization

**Covers:** CNV-001, ENH-009

**Preconditions:**

- Raw descriptions: "COSTCO WHOLESALE W1234", "COSTCO WHOLESALE W5678"

**Steps:**

1. ENH-001 normalizes both to Vendor "Costco Wholesale"
2. First occurrence creates vendor, second matches existing

**Expected Result:**

- One Vendor "Costco Wholesale" created
- Merchant Pattern matches both raw descriptions
- Both transactions assigned to same vendor

---

### FUT-16: Import Log entries created per file

**Covers:** CNV-001

**Preconditions:**

- 3 TD monthly files for Aeroplan processed

**Steps:**

1. Script completes all 3 files

**Expected Result:**

- 3 Import Log entries, each with: file name, card = TD Aeroplan, imported count, skipped count, total amount
- Dates reflect processing timestamp

---

### FUT-17: Script refuses to run before pre-requisites

**Covers:** CNV-001

**Preconditions:**

- No Card Instances in database (CNV-003 not run)

**Steps:**

1. Attempt to run conversion script

**Expected Result:**

- Script halts with pre-requisite check failure
- Error message identifies what is missing

---

## 9. Cross-Spec Notes

| Target Spec                      | Note                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| SPEC-01 (Ingestion Pipeline)     | Amendment: add multi-file upload to FRM-003 with same-card restriction (D-108).             |
| SPEC-01 (Ingestion Pipeline)     | Amendment: add `skipped_count` to Import Log entity.                                        |
| SPEC-01 (Ingestion Pipeline)     | Amendment: add `SIMPLEFIN_CONNECTION_DATE` to System Config seed values.                    |
| SPEC-02 (Transaction Processing) | ENH-001 patterns bootstrapped by CNV-001 categorization — strong day-one matching expected. |

---

_This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) object CNV-001 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-107–D-113 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md)._
