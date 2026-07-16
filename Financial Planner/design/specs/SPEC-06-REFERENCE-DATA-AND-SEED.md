# SPEC-06: Reference Data & Seed

**Spec ID:** SPEC-06
**Name:** Reference Data & Seed
**FRICEW Objects:** FRM-009, CNV-002, CNV-003
**Wave:** 1
**Sprint:** W1-S1
**CDS Services:** AdminService
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                          |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-16 | Sandro & Claude | Initial creation — workshop complete. D-92 through D-106 logged.                                                                                                                                                                     |
| 2026-02-20 | Claude          | OI-06 resolved — all 21 specs complete. Alert Type seed count updated from 10 to 14 (added: offers_pending_approval via SPEC-13, af_approaching + cancel_reminder via SPEC-03, review_overdue via SPEC-15). Cross-spec note updated. |

---

## 2. Overview

Reference data and master data maintenance for the Financial Planner. FRM-009 provides SM30-style CRUD for ~20 entity types via a master-detail Fiori Elements app. CNV-002 seeds all reference data on first deploy. CNV-003 bootstraps Sandro's card portfolio (market cards, offers, card instances, earning multipliers, soft perks) via CDS seed files so that W1-S2 through W1-S5 have data to work with.

Resolves OI-01 (Purchase Type list), OI-02 (Earning Category list), OI-03 (Budget Allocation 100% constraint). Partially resolves OI-06 (alert type seed values accumulated across specs).

Key decisions: D-92 (master-detail nav), D-93 (inline editing default), D-94 (Budget Allocation UX), D-95 (view-only tables), D-96 (restrict delete), D-97 (excludes_from_budget), D-98 (Purchase Types), D-99 (Earning Categories), D-100 (issuers/programs), D-101 (application rules), D-102 (Redemption Type), D-103 (time-bounding UX), D-104 (CNV-003 seed files), D-105 (vendor merge deferred), D-106 (UX enhancements).

---

## 3. Data Model References

| Entity                  | Role                                            | DM-001 Ref | Amendment?                                                         |
| ----------------------- | ----------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| Issuer                  | Reference data — card issuers                   | §3.1       | —                                                                  |
| Rewards Program         | Reference data — points programs + CPP          | §3.2       | —                                                                  |
| Purchase Type           | Reference data — budget taxonomy (2-level)      | §3.3       | Add `excludes_from_budget` (boolean, default false)                |
| Earning Category        | Reference data — churning multiplier buckets    | §3.4       | —                                                                  |
| Issuer Application Rule | Reference data — churning eligibility rules     | §3.5       | `rule_type` enum: add `ISSUER_COOLDOWN`, remove `MIN_DAYS_BETWEEN` |
| CSV Format Config       | Reference data — per-issuer CSV parsing rules   | §3.6       | — (SPEC-01 amendments apply)                                       |
| Financial Account Type  | Config table                                    | §3.7       | —                                                                  |
| Income Source Type      | Config table                                    | §3.8       | —                                                                  |
| Perk Type               | Config table                                    | §3.9       | —                                                                  |
| Adjustment Type         | Config table                                    | §3.10      | —                                                                  |
| Alert Type              | Config table                                    | §3.11      | —                                                                  |
| Alert Severity          | Config table                                    | §3.12      | —                                                                  |
| Card Network            | Config table                                    | §3.13      | —                                                                  |
| Pattern Source          | Config table                                    | §3.14      | —                                                                  |
| Confidence Level        | Config table                                    | §3.15      | —                                                                  |
| Program Tier            | Aeroplan tiers (composition of Rewards Program) | §3.16      | —                                                                  |
| System Config           | TVARVC runtime params                           | §3.17      | — (new entity from SPEC-01)                                        |
| Vendor                  | Master data — merchant names                    | §4.8       | —                                                                  |
| Merchant Pattern        | Vendor matching rules (composition of Vendor)   | §4.9       | —                                                                  |
| Recurrent Expense       | Recurring monthly charges                       | §4.10      | —                                                                  |
| Budget Allocation       | Per-type budget ratios (time-bound)             | §4.14      | —                                                                  |
| **Redemption Type**     | **NEW** — categorizes redemptions               | —          | New entity (D-102)                                                 |
| Redemption              | Trophy case entries                             | §5.5       | Add `redemption_type_id` FK → Redemption Type                      |
| Market Card             | CNV-003 target                                  | §4.1       | —                                                                  |
| Offer / Offer Tranche   | CNV-003 target                                  | §4.2–4.3   | —                                                                  |
| Card Instance           | CNV-003 target                                  | §4.4       | —                                                                  |
| Supplementary Card      | CNV-003 target                                  | §4.5       | —                                                                  |
| Earning Multiplier      | CNV-003 target                                  | §4.6       | —                                                                  |
| Soft Perk               | CNV-003 target                                  | §4.7       | —                                                                  |

### Redemption Type (NEW — D-102)

| Attribute  | Type    | Required | Notes                   |
| ---------- | ------- | -------- | ----------------------- |
| id         | PK      | yes      |                         |
| name       | text    | yes      | "Flight", "Hotel", etc. |
| sort_order | integer | yes      |                         |

Seed values: Flight, Hotel, Transfer to Partner, Cash Back, Gift Card, Merchandise.

### Purchase Type Amendment

| New Attribute        | Type    | Required | Notes                                                                                |
| -------------------- | ------- | -------- | ------------------------------------------------------------------------------------ |
| excludes_from_budget | boolean | yes      | Default `false`. When `true`, transactions skip budget but still count for churning. |

### Issuer Application Rule Enum Amendment

| Change | Detail                                                               |
| ------ | -------------------------------------------------------------------- |
| Add    | `ISSUER_COOLDOWN` — cooldown since holding ANY card from this issuer |
| Remove | `MIN_DAYS_BETWEEN` — not applicable in Canada                        |

Updated enum: `MAX_CONCURRENT` · `APPS_IN_WINDOW` · `PRODUCT_COOLDOWN` · `ISSUER_COOLDOWN` · `ONCE_PER_LIFETIME` · `TIER_LIFETIME_LIMIT`

---

## 4. Functional Description

### 4.1 FRM-009 — Master Data Maintenance [Form]

**Type:** Fiori Elements, AdminService. `app/master-data/`.

**Layout:** Master-detail (D-92). Left panel: grouped `sap.m.List` of entity types with search box. Right panel: selected entity's table.

**Entity Type Groups:**

| Group              | Entities                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Categories         | Purchase Types, Earning Categories                                                                                                                            |
| Programs & Issuers | Issuers, Rewards Programs, Program Tiers, Issuer Application Rules, Card Networks                                                                             |
| Budget             | Budget Allocations, Recurrent Expenses                                                                                                                        |
| Import Config      | CSV Format Configs, System Config                                                                                                                             |
| Lookups            | Financial Account Types, Income Source Types, Perk Types, Adjustment Types, Redemption Types, Alert Types, Alert Severity, Pattern Sources, Confidence Levels |
| Data Quality       | Vendors                                                                                                                                                       |

**Editing Patterns (D-93):**

| Pattern        | Entities                               | Reason                                                            |
| -------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Inline editing | All except below                       | SM30-style table editing                                          |
| Object page    | Purchase Type, Rewards Program, Vendor | Composition children (subtypes, Program Tiers, Merchant Patterns) |

**Editability (D-95):**

| Mode           | Entities                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| Fully editable | All except below                                                           |
| View-only      | Alert Type, Alert Severity, Pattern Source, Confidence Level, Card Network |

**UX Enhancements (D-106):**

| Enhancement                                                          | Applies To                              |
| -------------------------------------------------------------------- | --------------------------------------- |
| Search box in entity type list                                       | Left panel                              |
| `usage_count` column                                                 | Purchase Type, Earning Category, Vendor |
| Color-coded running total (green = 100%, orange = under, red = over) | Budget Allocations                      |
| Tooltips on `rule_type` enum values                                  | Issuer Application Rules                |
| Monthly expense total at top of table                                | Recurrent Expenses                      |

**Budget Allocation — 100% Constraint (D-94, resolves OI-03):**

- Running total displayed at top of table
- Save allowed at any sum — no blocking
- Warning banner when active allocations ≠ 100%: "Budget allocations do not sum to 100%. Budget tracking will be inactive until resolved."
- Budget engine (ENH-007) skips calculation when ≠ 100%

**Budget Allocation — Time-Bounding (D-103):**

- User edits ratio inline (appears as simple update)
- System auto-closes old row (`effective_to = yesterday`) and creates new row (`effective_from = today`)
- "Show History" toggle reveals closed rows (greyed out, read-only)

### 4.2 CNV-002 — Reference Data Seed [Conversion]

**Mechanism:** CDS seed files under `db/data/`, one CSV per entity type. Auto-loaded by `cds deploy`.

**Execution Order:** First (before CNV-003).

**Seed Data:**

#### Issuers (12)

| Name                    | Short Name |
| ----------------------- | ---------- |
| TD Canada Trust         | TD         |
| American Express Canada | Amex       |
| CIBC                    | CIBC       |
| Scotiabank              | Scotia     |
| BMO                     | BMO        |
| RBC                     | RBC        |
| MBNA                    | MBNA       |
| Neo Financial           | Neo        |
| Tangerine               | Tangerine  |
| Canadian Tire Bank      | CT Bank    |
| PC Financial            | PC         |
| Rogers Bank             | Rogers     |

#### Rewards Programs (14)

| Program                 | Currency Name | CPP |
| ----------------------- | ------------- | --- |
| Aeroplan                | points        | 2.0 |
| Amex Membership Rewards | MR points     | 2.0 |
| Marriott Bonvoy         | points        | 0.6 |
| Scene+                  | points        | 1.0 |
| TD First Class          | points        | 0.5 |
| CIBC Aventura           | points        | 1.0 |
| BMO Rewards             | points        | 0.7 |
| RBC Avion               | points        | 2.0 |
| HSBC Rewards            | points        | 1.0 |
| WestJet Dollars         | dollars       | 1.0 |
| Air Miles               | miles         | 0.1 |
| PC Optimum              | points        | 0.1 |
| Triangle Rewards        | CT Money      | 0.1 |
| Cash Back               | dollars       | 1.0 |

#### Purchase Types (13 top-level + subtypes)

| Top-Level Type    | excludes_from_budget | Subtypes                                 |
| ----------------- | -------------------- | ---------------------------------------- |
| Groceries         | false                | —                                        |
| Dining            | false                | Restaurants, Fast Food, Coffee, Delivery |
| Transportation    | false                | Gas, Parking, Transit, Ride Share        |
| Shopping          | false                | Clothing, Electronics, Home, Amazon      |
| Subscriptions     | false                | Streaming, Software, Memberships         |
| Bills & Utilities | false                | Phone, Internet, Hydro, Insurance        |
| Travel            | false                | Hotels, Flights, Car Rental              |
| Health            | false                | Pharmacy, Dental, Vision                 |
| Entertainment     | false                | Events, Sports, Gaming                   |
| Personal          | false                | Gifts, Personal Care, Education          |
| Credit Card Fees  | false                | Annual Fee, FX Fee, Interest             |
| Reimbursable      | true                 | —                                        |
| Other             | false                | —                                        |

#### Earning Categories (14)

| Category         |
| ---------------- |
| Groceries        |
| Dining           |
| Gas              |
| Transit          |
| Travel           |
| Streaming        |
| Recurring Bills  |
| Drugstores       |
| Entertainment    |
| Air Canada       |
| Marriott Hotels  |
| EV Charging      |
| Foreign Currency |
| Everything Else  |

#### Issuer Application Rules (9)

| Issuer   | Rule Type             | count | days | Card Type | Description                                 |
| -------- | --------------------- | ----- | ---- | --------- | ------------------------------------------- |
| Amex     | `MAX_CONCURRENT`      | 4     | —    | credit    | Max 4 credit cards (charge cards exempt)    |
| Amex     | `APPS_IN_WINDOW`      | 2     | 90   | credit    | Max 2 credit card approvals per 90 days     |
| Amex     | `ONCE_PER_LIFETIME`   | —     | —    | all       | Welcome bonus once per lifetime per product |
| TD       | `PRODUCT_COOLDOWN`    | —     | 365  | all       | 12-month same-product bonus cooldown        |
| TD       | `PRODUCT_COOLDOWN`    | —     | 180  | all       | 6-month cooldown (First Class Travel)       |
| CIBC     | `PRODUCT_COOLDOWN`    | —     | 365  | all       | 12-month product-family cooldown            |
| Scotia   | `ISSUER_COOLDOWN`     | —     | 730  | all       | 2-year cooldown since ANY Scotia card       |
| RBC      | `APPS_IN_WINDOW`      | 1     | 90   | all       | Max 1 application per 90 days               |
| Aeroplan | `TIER_LIFETIME_LIMIT` | 5     | —    | all       | Max 5 tier bonuses cross-issuer lifetime    |

#### Program Tiers (Aeroplan — 5)

| Name             | Sort Order |
| ---------------- | ---------- |
| Entry            | 1          |
| Core             | 2          |
| Premium          | 3          |
| Core Business    | 4          |
| Premium Business | 5          |

#### Simple Config Tables

| Table                  | Seed Values                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Card Network           | Visa, Mastercard, Amex                                                                                                                           |
| Alert Severity         | info, warning, critical                                                                                                                          |
| Pattern Source         | seed, learned, manual                                                                                                                            |
| Confidence Level       | high, medium, low                                                                                                                                |
| Financial Account Type | RRSP (asset), TFSA (asset), FHSA (asset), RIF (asset), Car Loan (liability), Student Loan (liability)                                            |
| Income Source Type     | Salary, Bonus, Churn Reward                                                                                                                      |
| Perk Type              | lounge_pass, travel_credit, portal_rebate, insurance, status                                                                                     |
| Adjustment Type        | signup_bonus, referral, transfer_in, transfer_out, correction                                                                                    |
| Redemption Type        | Flight, Hotel, Transfer to Partner, Cash Back, Gift Card, Merchandise                                                                            |
| Alert Type             | msr_deadline, af_renewal, first_af, perk_expiration, eligibility_window, bonus_met, bonus_missed, connection_error, stale_data, unmapped_account |

#### CSV Format Configs (4)

Per SPEC-01 §4.2 issuer format summary table. Seed values for Scotiabank, TD, CIBC, Amex.

#### System Config (4)

Per SPEC-01 §3: `SIMPLEFIN_SYNC_TIME`, `SIMPLEFIN_LOOKBACK_DAYS`, `SIMPLEFIN_RETRY_ATTEMPTS`, `SIMPLEFIN_STALE_DAYS`.

### 4.3 CNV-003 — Card Portfolio Load [Conversion]

**Mechanism:** CDS seed files under `db/data/`, one CSV per entity type (D-104). Auto-loaded by `cds deploy`.

**Execution Order:** After CNV-002 (FK dependencies on issuers, rewards programs, earning categories).

**Entities Loaded:**

| Entity             | Source                                   | Approx. Rows                    |
| ------------------ | ---------------------------------------- | ------------------------------- |
| Market Card        | Sandro's held products                   | ~10                             |
| Offer              | Signup offer terms                       | ~16                             |
| Offer Tranche      | Per-tranche MSR, deadline, payout (D-24) | ~30                             |
| Card Instance      | Active + closed cards                    | 16 (13 active + 3 closed)       |
| Supplementary Card | Supp cards linked to instances           | 3                               |
| Earning Multiplier | Per-card per-category rates              | ~140 (10 cards × 14 categories) |
| Soft Perk          | Per-card perk allocations                | Variable                        |

**Seed File Templates:** One CSV per entity under `db/data/`. Sandro fills actual card data. FK references use IDs from CNV-002 seed data.

**Validation:** FK integrity enforced by database. No service-layer validation on seed import (trusted data).

---

## 5. Business Rules

### FRM-009 — General

| Rule  | Description                                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Delete restricted on any entity referenced by other records. Error shows reference count.                                                                                     |
| BR-02 | Entity names must be unique within their entity type.                                                                                                                         |
| BR-03 | View-only tables (Alert Type, Alert Severity, Pattern Source, Confidence Level, Card Network) cannot be created, edited, or deleted.                                          |
| BR-04 | Master-detail layout: grouped entity list (left) with search, selected entity table (right). Inline editing default; object pages for Purchase Type, Rewards Program, Vendor. |

### Purchase Type

| Rule  | Description                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------- |
| BR-05 | `parent_id` must reference a top-level type (`parent_id = null`). Single-level hierarchy only.                  |
| BR-06 | `excludes_from_budget` (default `false`) excludes transactions from budget calculations. Churning still counts. |
| BR-07 | Subtypes inherit parent's `excludes_from_budget` flag implicitly.                                               |
| BR-08 | Budget Allocations can only reference top-level Purchase Types where `excludes_from_budget = false`.            |

### Budget Allocation

| Rule  | Description                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ |
| BR-09 | Running total at top of table. Save allowed at any sum. Warning banner when ≠ 100%. Color: green (100%), orange (under), red (over). |
| BR-10 | Budget engine (ENH-007) skips when allocations ≠ 100% for a period.                                                                  |
| BR-11 | Editing a ratio auto-closes old row (`effective_to = yesterday`) and creates new row (`effective_from = today`).                     |
| BR-12 | Historical rows (non-null `effective_to`) are read-only. Visible via "Show History" toggle.                                          |
| BR-13 | Ratio must be between 0 and 100 inclusive.                                                                                           |

### Issuer Application Rule & CSV Format Config

| Rule  | Description                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-14 | At least one of `issuer_id` or `rewards_program_id` must be set.                                                                                  |
| BR-15 | `parameter_count` and `parameter_days` must be positive integers when applicable.                                                                 |
| BR-16 | CSV Format Config: exactly one amount style — (`amount_column` + `amount_sign`) OR (`debit_column` + `credit_column`). Never both, never neither. |
| BR-17 | CSV Format Config: `status_column` set requires `status_posted_value`.                                                                            |

### Recurrent Expense, System Config, Vendor & Rewards Program

| Rule  | Description                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| BR-18 | Recurrent Expense: `effective_from` required, `effective_to` nullable. No overlapping periods for same name.   |
| BR-19 | System Config: `key` unique, UPPER_SNAKE_CASE. Value stored as text.                                           |
| BR-20 | Vendor: Merchant Patterns as composition children. Pattern text unique per vendor.                             |
| BR-21 | Rewards Program: Program Tiers as composition children. `cpp_valuation` positive. CPP updated in place (D-40). |

### CNV-002 & CNV-003

| Rule  | Description                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------- |
| BR-22 | CNV-002 executes before CNV-003 (FK dependency).                                                                           |
| BR-23 | Both use CDS seed files (`db/data/`), one CSV per entity, auto-loaded by `cds deploy`.                                     |
| BR-24 | Seed data is trusted — no service-layer validation. FK integrity enforced by DB.                                           |
| BR-25 | Seed files are idempotent — redeploy does not create duplicates.                                                           |
| BR-26 | CNV-003 loads: Market Cards, Offers (with tranches), Card Instances, Supplementary Cards, Earning Multipliers, Soft Perks. |

---

## 6. Error Handling

| Condition                              | Response                                | i18n Key Pattern                     |
| -------------------------------------- | --------------------------------------- | ------------------------------------ |
| Delete blocked by references           | Error with entity type and count        | `admin.masterData.deleteBlocked`     |
| Duplicate entity name                  | Error with conflicting name             | `admin.masterData.duplicateName`     |
| Budget Allocation sum ≠ 100%           | Warning banner (non-blocking)           | `admin.budget.allocationWarning`     |
| Budget Allocation on excluded type     | Error — type has `excludes_from_budget` | `admin.budget.excludedType`          |
| Invalid ratio (outside 0–100)          | Field-level validation error            | `admin.budget.invalidRatio`          |
| CSV Format Config invalid amount style | Error — choose one style                | `admin.csvConfig.invalidAmountStyle` |
| Missing status_posted_value            | Error — required when status_column set | `admin.csvConfig.missingStatusValue` |
| Overlapping Recurrent Expense periods  | Error with overlap dates                | `admin.recurrentExpense.overlap`     |
| Duplicate System Config key            | Error with conflicting key              | `admin.systemConfig.duplicateKey`    |
| CNV-003 FK violation                   | Deploy fails with constraint error      | (database-level)                     |

---

## 7. Open Items

| OI    | Resolution                                                                                                                                                                                                                                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OI-01 | Resolved. 13 top-level Purchase Types + ~30 subtypes seeded (D-98).                                                                                                                                                                                                                                      |
| OI-02 | Resolved. 14 Earning Categories seeded (D-99).                                                                                                                                                                                                                                                           |
| OI-03 | Resolved. Budget Allocation UX: running total, save at any sum, warning banner, engine skips when ≠ 100% (D-94).                                                                                                                                                                                         |
| OI-06 | Resolved. 14 Alert Type seed values accumulated across all 21 specs: msrDeadlineApproaching, msrMet, msrMissed, afDue, newTransactions, categorizationReview, connectionStale, connectionError, offersPendingApproval, goalBehind, afApproaching, cancelReminder, reviewOverdue, eligibilityApproaching. |

---

## 8. Functional Unit Tests

### FUT-601: Navigate entity types and create record inline

**Covers:** FRM-009
**Preconditions:** CNV-002 deployed.

**Steps:**

1. Open FRM-009. Click "Earning Categories" in left panel.
2. Click "Create". Enter name "Parking". Save.

**Expected Result:** Row appears in table. Left panel remains on Earning Categories.

---

### FUT-602: Edit inline record

**Covers:** FRM-009
**Preconditions:** FUT-601 complete.

**Steps:**

1. Edit "Parking" name to "Parking & Tolls". Save.

**Expected Result:** Name updated inline.

---

### FUT-603: Delete unreferenced record

**Covers:** FRM-009
**Preconditions:** FUT-601 complete, no transactions reference "Parking & Tolls".

**Steps:**

1. Select "Parking & Tolls". Click Delete. Confirm.

**Expected Result:** Row removed.

---

### FUT-604: Delete blocked by references

**Covers:** FRM-009
**Preconditions:** Earning Category "Groceries" has 50 transactions.

**Steps:**

1. Select "Groceries". Click Delete.

**Expected Result:** Error: "Cannot delete — 50 transactions use this category." Row retained.

---

### FUT-605: Purchase Type — create subtype

**Covers:** FRM-009
**Preconditions:** Purchase Type "Dining" exists (top-level).

**Steps:**

1. Click "Dining" → object page. Click "Add Subtype". Enter "Food Trucks". Save.

**Expected Result:** Subtype appears in subtypes table.

---

### FUT-606: Purchase Type — reject nested subtype

**Covers:** FRM-009
**Preconditions:** Subtype "Fast Food" exists under "Dining".

**Steps:**

1. Attempt to set "Fast Food" as parent of a new type.

**Expected Result:** Error: parent must be a top-level type.

---

### FUT-607: Purchase Type — subtype inherits excludes_from_budget

**Covers:** FRM-009
**Preconditions:** "Reimbursable" has `excludes_from_budget = true`.

**Steps:**

1. Open "Reimbursable" object page. Add subtype "Friend's Groceries".

**Expected Result:** Subtype created. Inherits `excludes_from_budget` from parent.

---

### FUT-608: Budget Allocation — warning when ≠ 100%

**Covers:** FRM-009
**Preconditions:** Active allocations: Groceries 30%, Dining 20%, Other 20% (total 70%).

**Steps:**

1. Open Budget Allocations table.

**Expected Result:** Running total: "70% — 30% unallocated" (orange). Warning banner displayed.

---

### FUT-609: Budget Allocation — reach 100%

**Covers:** FRM-009
**Preconditions:** FUT-608 state.

**Steps:**

1. Add Shopping at 30%. Save.

**Expected Result:** Total 100% (green). Warning banner disappears.

---

### FUT-610: Budget Allocation — edit triggers time-bounding

**Covers:** FRM-009
**Preconditions:** Allocations sum to 100%, Dining = 20%.

**Steps:**

1. Edit Dining from 20% to 25%. Save.

**Expected Result:** Old Dining row closed (`effective_to = yesterday`). New row created (`effective_from = today`, ratio = 25%). Total 105% (red). Warning banner appears.

---

### FUT-611: Budget Allocation — show history

**Covers:** FRM-009
**Preconditions:** FUT-610 complete.

**Steps:**

1. Toggle "Show History".

**Expected Result:** Closed Dining 20% row appears greyed out, read-only.

---

### FUT-612: Budget Allocation — reject excluded type

**Covers:** FRM-009
**Preconditions:** "Reimbursable" has `excludes_from_budget = true`.

**Steps:**

1. Attempt to create Budget Allocation for "Reimbursable".

**Expected Result:** Error: cannot allocate to budget-excluded types.

---

### FUT-613: CSV Format Config — reject dual amount style

**Covers:** FRM-009
**Preconditions:** CSV Format Config row exists.

**Steps:**

1. Set both `amount_column` and `debit_column`. Save.

**Expected Result:** Validation error: choose one amount style.

---

### FUT-614: View-only table — no editing controls

**Covers:** FRM-009
**Preconditions:** Alert Type seeded.

**Steps:**

1. Navigate to Alert Type in left panel.

**Expected Result:** Table displays rows. No Create, Edit, or Delete controls visible.

---

### FUT-615: Vendor — manage merchant patterns

**Covers:** FRM-009
**Preconditions:** Vendor "Amazon" exists.

**Steps:**

1. Click "Amazon" → object page. Add Merchant Pattern: pattern "AMZN MKTP", match_type "contains". Save.

**Expected Result:** Pattern appears in patterns table.

---

### FUT-616: CNV-002 — seed reference data

**Covers:** CNV-002
**Preconditions:** Empty database.

**Steps:**

1. Run `cds deploy`.

**Expected Result:** All reference data loaded: 12 issuers, 14 rewards programs, 13 purchase types + subtypes, 14 earning categories, 9 application rules, 4 CSV configs, all config tables.

---

### FUT-617: CNV-002 — idempotent redeploy

**Covers:** CNV-002
**Preconditions:** FUT-616 complete.

**Steps:**

1. Run `cds deploy` again.

**Expected Result:** No duplicates. Row counts unchanged.

---

### FUT-618: CNV-003 — load card portfolio

**Covers:** CNV-003
**Preconditions:** CNV-002 deployed.

**Steps:**

1. Run `cds deploy`.

**Expected Result:** Portfolio loaded: market cards, offers with tranches, card instances, supplementary cards, earning multipliers, soft perks. FK integrity passes.

---

## 9. Cross-Spec Notes

| Target Spec                          | Note                                                                                                                                                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC-01 (Ingestion Pipeline)         | CSV Format Config and System Config seed values defined in SPEC-01 §4.2 and §3. SPEC-06 seeds them via CNV-002.                                                                                                            |
| SPEC-04 (Transaction Categorization) | Vendor merge capability deferred to SPEC-04. FRM-009 provides basic CRUD only (D-105).                                                                                                                                     |
| Budget Engine spec                   | ENH-007 must check `excludes_from_budget` flag and Budget Allocation sum = 100% before calculating.                                                                                                                        |
| All specs                            | Alert Type seed values accumulated across all specs (OI-06 resolved). Final list: 14 types. Added by later specs: offers_pending_approval (SPEC-13), af_approaching + cancel_reminder (SPEC-03), review_overdue (SPEC-15). |

---

_This spec is the single source of truth for FRM-009, CNV-002, and CNV-003. Reference data entity definitions are in [DATA_MODEL.md](../DATA_MODEL.md). Design decisions are in [DECISIONS_LOG.md](../user-profile/DECISIONS_LOG.md)._
