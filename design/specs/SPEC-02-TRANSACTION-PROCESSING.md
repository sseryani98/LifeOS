# SPEC-02: Transaction Processing

**Spec ID:** SPEC-02
**Name:** Transaction Processing
**FRICEW Objects:** ENH-001, ENH-009, FRM-001
**Wave:** 1
**Sprint:** W1-S3
**CDS Services:** TransactionService
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-114 through D-122 logged. |

---

## 2. Overview

Transaction processing is the heart of the weekly review session. Transactions arrive via SPEC-01's ingestion pipeline, then ENH-001 normalizes raw merchant descriptions to known vendors and assigns dual categories (Purchase Type for budget, Earning Category for churning). ENH-009 handles shared expenses with "my share" splits, ensuring churning uses full amounts while budget uses the user's portion. FRM-001 is the main review surface where the user approves auto-categorizations, corrects exceptions, initiates splits, and attributes supplementary card transactions.

Key decisions: D-05 (two taxonomies), D-08 (splits), D-32 (in-house categorization), D-43 (count-based ranking), D-114 (matching algorithm), D-115 (no auto-vendor creation), D-116 (learning mechanism), D-117 (computed usage counts), D-118 (amount on Merchant Pattern), D-119 (split remainder Reimbursable), D-120 (recurring split suggestions), D-121 (FRM-001 inline editing & actions), D-122 (vendor merge on FRM-009).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Transaction | Categorized by ENH-001, split by ENH-009, reviewed in FRM-001 | §5.1 | — |
| Transaction Split | "My share" record for shared expenses | §5.2 | — |
| Vendor | Matched from raw merchant descriptions | §4.8 | Remove `usage_count` |
| Merchant Pattern | Pattern rules for vendor matching | §4.9 | Add `amount` (decimal, optional) |
| Vendor Category Stats | Suggestion ranking for PT + EC combos | §4.15 | Convert from stored entity to CDS view |
| Purchase Type | Budget category, one of two taxonomies | §3.3 | Remove `usage_count` |
| Earning Category | Churning category, one of two taxonomies | §3.4 | Remove `usage_count` |
| Card Instance | Transaction attribution, supp card reassignment | §4.4 | — |
| Goal | Optional transaction linking for spending goals | §4.11 | — |

### DM-001 Amendments

**Amendment 1 — Remove stored usage counts (D-117):**

Remove `usage_count` (integer) from:

- Vendor (§4.8)
- Purchase Type (§3.3)
- Earning Category (§3.4)

Usage counts are computed on the fly from Transaction records. Eliminates count drift risk.

**Amendment 2 — Vendor Category Stats as CDS view (D-117):**

Convert Vendor Category Stats (§4.15) from a stored entity to a CDS view:

```
SELECT vendor_id, purchase_type_id, earning_category_id, COUNT(*) as usage_count
FROM Transaction
WHERE vendor_id IS NOT NULL
GROUP BY vendor_id, purchase_type_id, earning_category_id
```

ENH-001 queries this view for category suggestions. Always accurate, zero maintenance.

**Amendment 3 — Amount field on Merchant Pattern (D-118):**

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| `amount` | decimal | no | When set, pattern only matches if description AND amount match. Null = amount ignored. |

Enables same-description-different-vendor matching (e.g., APPLE.COM/BILL at $13.99 = YouTube Premium, at $3.99 = iCloud).

### SPEC-06 Amendment — Vendor Merge (D-122)

Add "Merge Into..." action on FRM-009 Vendor object page:

- User selects target vendor
- All transactions reassigned from source → target
- Merchant Patterns moved to target
- Source vendor deleted
- Vendor Category Stats view auto-reflects merged data

---

## 4. Functional Description

### 4.1 ENH-001 — Transaction Categorization Engine [Enhancement]

**Inputs:** `raw_description` (string), `amount` (decimal), `card_instance_id` (optional)

**Outputs:**

| Field | Type | Notes |
|-------|------|-------|
| `vendor_id` | UUID or null | Best match, null if no match |
| `vendor_name` | string or null | For display |
| `purchase_type_id` | UUID or null | Top-ranked from Vendor Category Stats view |
| `earning_category_id` | UUID or null | Top-ranked from Vendor Category Stats view |
| `confidence` | high / medium / low | From the matching Merchant Pattern |
| `alternatives` | array | Other (PT, EC) combos ranked by count |

**Callers:**

| Caller | Context | Behavior on match | Behavior on no match |
|--------|---------|-------------------|---------------------|
| INT-001 (SimpleFIN sync) | Per transaction, automated | Auto-apply, status = `auto` | Status = `uncategorized` |
| FRM-003 (CSV wizard) | Per row, user reviewing | Pre-populate suggestions | Empty fields, user assigns |
| CNV-001 (backfill script) | Per transaction, scripted | Auto-apply as tier 1 | Falls to Claude reasoning (tier 2) |
| FRM-001 (transaction review) | On re-categorize action | Update suggestion | No change |

**Matching Pipeline (D-114):**

Executed in priority order against all active Merchant Patterns:

| Priority | Match Type | Description |
|----------|-----------|-------------|
| 1 | Exact | `raw_description` (trimmed, case-insensitive) equals `pattern` exactly |
| 2 | Starts-with | `raw_description` starts with `pattern` (case-insensitive) |
| 3 | Contains | `raw_description` contains `pattern` as substring (case-insensitive) |

**Tie-breaking within same match tier (D-114):**

1. Patterns with matching `amount` preferred over `amount = null` patterns
2. Higher confidence level (high > medium > low)
3. Longer pattern (more specific)
4. Higher vendor transaction count (computed from Transaction table)

Only the top-scoring match is used. No ambiguity resolution.

**Category Suggestion (D-43):**

Once a vendor is matched, Purchase Type and Earning Category are suggested from the Vendor Category Stats CDS view, ranked by usage count. The top-ranked combination is auto-assigned. Alternative combinations are returned for UI display.

**No Auto-Vendor Creation (D-115):**

ENH-001 is a matching engine only. It never creates Vendor or Merchant Pattern records. When no pattern matches, the transaction stays `uncategorized` with no vendor. Vendor creation is always a user action (FRM-001, FRM-003, or CNV-001).

**Learning Mechanism (D-116):**

When a user assigns or corrects a transaction's vendor + categories:

1. **Merchant Pattern auto-created** (when the transaction had no vendor match and no existing pattern on the assigned vendor already matches this `raw_description`):
   - `pattern` = full `raw_description` (trimmed)
   - `match_type` = `exact`
   - `pattern_source` = `learned`
   - `confidence_level` = `medium`
   - `amount` = `null`
   - `is_active` = `true`

2. **Amount discriminator (D-118):** When the transaction's description already matched a *different* vendor (user is correcting, not creating from scratch), the auto-created pattern includes the transaction's `amount`. This handles the APPLE.COM/BILL scenario where the same description maps to different vendors by amount.

3. **Vendor Category Stats view auto-updates** — no explicit write needed. The confirmed transaction's (vendor, PT, EC) combination is reflected in the view because the transaction now has those FKs set.

### 4.2 ENH-009 — Split Transaction Logic [Enhancement]

**Inputs:** `transaction_id`, either `my_share_pct` (decimal 0–1) or `my_share_amount` (decimal)

**Outputs:** Transaction Split record created/updated

**Split Computation:**

| Input | Stored Values |
|-------|---------------|
| Percentage entered | `my_share_pct` = entered value, `my_share_amount` = `transaction.amount × my_share_pct` |
| Dollar amount entered | `my_share_pct` = null, `my_share_amount` = entered value |

`my_share_amount` is always populated — it's what the budget engine reads.

**Budget Impact (D-119):**

- `my_share_amount` → attributed to the transaction's Purchase Type
- `amount - my_share_amount` (remainder) → implicitly Reimbursable for budget purposes (excluded from budget via D-97 `excludes_from_budget`)
- No extra storage or FK needed — the budget engine (ENH-007) computes this

**Churning Impact:**

- Points earned, MSR progress, yield calculations always use full `transaction.amount`
- Splits have no effect on churning metrics

**Reimbursed Transactions:**

A fully reimbursed transaction is a split with `my_share_pct = 0`, `my_share_amount = 0`. Full amount goes to Reimbursable for budget. Full amount still counts for churning.

**Recurring Splits (D-120):**

| Element | Detail |
|---------|--------|
| Matching key | `vendor_id` — same vendor triggers suggestion |
| Template | Most recent `is_recurring = true` split for the vendor |
| Percentage-based | Recalculates on new amount (`$120 × 20% = $24`) |
| Dollar-based | Keeps fixed amount regardless of transaction amount |
| Auto-apply | Never — suggestion only. User confirms during review (FRM-001). |

**`is_recurring` flag:**

- `true`: this split's terms are used as the template for future suggestions on the same vendor
- `false`: one-off split, not suggested again

### 4.3 FRM-001 — Transaction List & Review [Form]

**Type:** Fiori Elements List Report + Object Page. TransactionService.

**App folder:** `app/transactions/`

#### List Report

**Columns:**

| Column | Source | Editable | Notes |
|--------|--------|----------|-------|
| Date | `posted_at` | No | Default sort descending |
| Description | `raw_description` | No | Full bank text |
| Vendor | `vendor.name` | Yes | Value help with fuse.js fuzzy search, on-the-fly creation |
| Amount | `amount` | No | Formatted CAD, negative = charge |
| Purchase Type | `purchase_type.name` | Yes | Dropdown with subtypes indented |
| Earning Category | `earning_category.name` | Yes | Dropdown |
| Card | `card_instance → market_card.name` | No | Short name |
| Status | `categorization_status` | No | ObjectStatus: auto (green), user_corrected (blue), uncategorized (orange) |
| Split | indicator | No | Icon if Transaction Split exists |
| Source | `source` | No | simplefin / csv |
| Notes | `notes` | Yes | Free text |

**Default filter:** `categorization_status = uncategorized` + date range = last 7 days.

**Filter bar (collapsed, adapt-filters per D-62):**

- Date range
- Card instance
- Categorization status
- Purchase Type
- Earning Category
- Vendor
- Source
- Has split (yes/no)
- Is excluded (yes/no)

**Actions:**

| Action | Behavior |
|--------|----------|
| Split | Select row → popover/dialog with split fields (my share %, my share amount, description, recurring toggle). Pre-populated with recurring suggestion if applicable (ENH-009). |
| Apply Categories | Multi-select rows → set vendor, PT, EC once → applied to all selected. Learning mechanism fires per unique `raw_description`. |
| Re-categorize | Re-runs ENH-001 on selected rows. Skips `user_corrected` transactions. Updates suggestions for `uncategorized` and `auto` rows. |

#### Object Page

**Header:**

- Title: Vendor name (or `raw_description` if no vendor)
- Subtitle: `posted_at` date
- ObjectNumber: amount with semantic state (negative = neutral, positive/refund = green)
- ObjectStatus: `categorization_status`

**Section 1 — Transaction Details:**

| Field | Editable | Notes |
|-------|----------|-------|
| Raw Description | No | Original bank text, never modified |
| Vendor | Yes | Value help with fuse.js fuzzy search, on-the-fly creation |
| Purchase Type | Yes | Dropdown, subtypes indented |
| Earning Category | Yes | Dropdown |
| Amount | No | Immutable from source |
| Posted Date | No | |
| Transaction Date | No | If available from source |
| Card | Yes | Dropdown — for supp card reassignment |
| Source | No | simplefin / csv |
| Goal | Yes | Optional link to spending Goal |
| Notes | Yes | Free text |
| Excluded | Yes | Toggle — exclude from all computation |

**Section 2 — Split:**

Only visible when split exists or user initiates.

| Field | Editable | Notes |
|-------|----------|-------|
| My Share % | Yes | Percentage input |
| My Share Amount | Yes | Dollar input — either/or with percentage |
| Description | Yes | "Padel with friends" |
| Recurring | Yes | Toggle |

Pre-populated with recurring suggestion if applicable (ENH-009).

**Section 3 — Categorization Suggestions:**

Read-only, informational. Shows:

- Matched Merchant Pattern and confidence level
- Alternative (PT, EC) combinations ranked by count from Vendor Category Stats view

Helps the user understand why the system suggested what it did and pick alternatives.

---

## 5. Business Rules

### ENH-001 — Transaction Categorization Engine

| Rule | Description |
|------|-------------|
| BR-01 | Matching pipeline priority: exact > starts_with > contains on `raw_description` (trimmed, case-insensitive). |
| BR-02 | Within same match tier: patterns with matching `amount` preferred over `amount = null` patterns. |
| BR-03 | Remaining ties broken by: confidence level (high > medium > low) → longer pattern → higher vendor transaction count (computed). |
| BR-04 | Only the top-scoring match is used. No ambiguity resolution. |
| BR-05 | No match → transaction stays `uncategorized`, no vendor assigned. ENH-001 never auto-creates vendors. |
| BR-06 | Once vendor matched, PT and EC suggested from Vendor Category Stats CDS view, ranked by usage count. Top combo auto-assigned. |
| BR-07 | `categorization_status` set to `auto` when ENH-001 assigns vendor + categories. `uncategorized` when no match. |
| BR-08 | On user correction of an unmatched transaction: auto-create Merchant Pattern — `pattern` = full `raw_description` (trimmed), `match_type` = exact, `pattern_source` = learned, `confidence_level` = medium, `amount` = null, `is_active` = true. |
| BR-09 | On user correction where description already matched a different vendor: auto-created pattern includes `amount` as discriminator. |
| BR-10 | Vendor Category Stats is a CDS view computed from transactions — no stored counters. |
| BR-11 | Re-categorize action: re-runs ENH-001 on selected transactions. Skips `user_corrected` rows. Updates `uncategorized` and `auto` rows. |

### ENH-009 — Split Transaction Logic

| Rule | Description |
|------|-------------|
| BR-12 | User enters either `my_share_pct` or `my_share_amount` — not both. |
| BR-13 | `my_share_amount` always populated. If percentage entered, computed as `amount × my_share_pct`. |
| BR-14 | Churning metrics (points, MSR progress) always use full `transaction.amount`. |
| BR-15 | Budget uses `my_share_amount` under the transaction's Purchase Type. Remainder (`amount - my_share_amount`) is implicitly Reimbursable (excluded from budget via D-97). |
| BR-16 | Reimbursed transaction = split with `my_share_pct = 0`, `my_share_amount = 0`. |
| BR-17 | Recurring split suggestion: when incoming transaction matches a vendor with an existing `is_recurring = true` split, suggest same terms. Percentage-based recalculates on new amount; dollar-based keeps fixed amount. |
| BR-18 | Recurring splits are suggested only, never auto-applied. User confirms during review. |

### FRM-001 — Transaction List & Review

| Rule | Description |
|------|-------------|
| BR-19 | Fiori Elements List Report + Object Page. TransactionService. |
| BR-20 | Default filter: `categorization_status = uncategorized` + date range = last 7 days. |
| BR-21 | Inline-editable on list: Vendor (value help), Purchase Type (dropdown), Earning Category (dropdown), Notes (text). |
| BR-22 | Object page: full transaction detail, split section, goal linking, card reassignment, excluded toggle. |
| BR-23 | Split action button on list toolbar. Popover/dialog with: my share %, my share amount, description, recurring toggle. Pre-populated with recurring suggestion if applicable. |
| BR-24 | Bulk action: multi-select rows → "Apply Categories" → set vendor, PT, EC once → applied to all selected. |
| BR-25 | On save (inline or object page): learning mechanism fires — Merchant Pattern created per BR-08/BR-09. |
| BR-26 | Re-categorize action on list toolbar: re-runs ENH-001 on selected rows. Skips `user_corrected` transactions. |
| BR-27 | Categorization suggestions section on object page: shows matched pattern, confidence, and alternative (PT, EC) combos. |

### Vendor Merge (SPEC-06 Amendment — D-122)

| Rule | Description |
|------|-------------|
| BR-28 | "Merge Into..." action on FRM-009 Vendor object page. User selects target vendor. |
| BR-29 | Merge reassigns all transactions from source → target, moves Merchant Patterns to target, deletes source vendor. |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| Vendor value help: no match for typed text | Show "Create new vendor" option | `transaction.vendor.createNew` |
| Split: both percentage and amount entered | Validation error — enter one or the other | `transaction.split.enterOneInput` |
| Split: percentage outside 0–100 range | Validation error | `transaction.split.invalidPercentage` |
| Split: my_share_amount exceeds transaction amount | Validation error | `transaction.split.amountExceedsTotal` |
| Re-categorize: no rows selected | Warning — select at least one row | `transaction.recategorize.noSelection` |
| Vendor merge: target has same ID as source | Validation error | `admin.vendor.mergeSameVendor` |
| Vendor merge: source vendor has 0 transactions | Warning — nothing to merge (allow delete instead) | `admin.vendor.mergeEmpty` |
| Goal linking: goal is inactive | Validation error — select an active goal | `transaction.goal.inactive` |
| Inline edit: vendor created on the fly with duplicate name | Warning with existing vendor suggestion | `transaction.vendor.duplicateName` |

---

## 7. Open Items

| OI | Resolution |
|----|------------|
| OI-04 | Card status transition rules remain open — addressed by SPEC-03 (Card Lifecycle). Not in scope for SPEC-02. |

---

## 8. Functional Unit Tests

### FUT-001: Exact match categorizes transaction

**Covers:** ENH-001

**Preconditions:**

- Vendor "Netflix" with Merchant Pattern: `pattern = "NETFLIX.COM"`, `match_type = exact`, `confidence = high`, `amount = null`
- Vendor Category Stats view: Netflix → Subscriptions / Streaming (12 uses)

**Steps:**

1. Transaction ingested with `raw_description = "NETFLIX.COM"`, amount = -$22.99

**Expected Result:**

- `vendor_id` = Netflix, `purchase_type_id` = Subscriptions, `earning_category_id` = Streaming
- `categorization_status = auto`

---

### FUT-002: Contains match when no exact match

**Covers:** ENH-001

**Preconditions:**

- Vendor "Amazon" with Merchant Pattern: `pattern = "AMZN MKTP"`, `match_type = contains`, `confidence = high`

**Steps:**

1. Transaction ingested with `raw_description = "AMZN MKTP US*2K4R7J3M"`

**Expected Result:**

- Vendor = Amazon, categories from top-ranked Vendor Category Stats combo
- `categorization_status = auto`

---

### FUT-003: Amount-specific pattern wins over generic

**Covers:** ENH-001

**Preconditions:**

- Vendor "Apple" with pattern: `"APPLE.COM/BILL"`, `contains`, `amount = null`
- Vendor "YouTube Premium" with pattern: `"APPLE.COM/BILL"`, `contains`, `amount = 13.99`
- Vendor "iCloud" with pattern: `"APPLE.COM/BILL"`, `contains`, `amount = 3.99`

**Steps:**

1. Transaction ingested: `raw_description = "APPLE.COM/BILL"`, amount = -$13.99

**Expected Result:**

- Vendor = YouTube Premium (amount-specific match preferred over generic)
- Categories from YouTube Premium's Vendor Category Stats

---

### FUT-004: No match leaves transaction uncategorized

**Covers:** ENH-001

**Preconditions:**

- No Merchant Pattern matches `"XYZ UNKNOWN MERCHANT 12345"`

**Steps:**

1. Transaction ingested with `raw_description = "XYZ UNKNOWN MERCHANT 12345"`

**Expected Result:**

- `vendor_id = null`, `purchase_type_id = null`, `earning_category_id = null`
- `categorization_status = uncategorized`

---

### FUT-005: User correction creates learned pattern

**Covers:** ENH-001

**Preconditions:**

- Transaction with `raw_description = "PADEL HAUS TORONTO"`, `categorization_status = uncategorized`
- No Vendor "Padel Haus" exists

**Steps:**

1. User assigns Vendor = "Padel Haus" (created on the fly), PT = Entertainment, EC = Everything Else
2. Saves

**Expected Result:**

- Vendor "Padel Haus" created
- Merchant Pattern created: `pattern = "PADEL HAUS TORONTO"`, `match_type = exact`, `pattern_source = learned`, `confidence = medium`, `amount = null`
- Next transaction with same `raw_description` auto-categorizes

---

### FUT-006: User correction with amount discriminator

**Covers:** ENH-001

**Preconditions:**

- Transaction: `raw_description = "APPLE.COM/BILL"`, amount = -$3.99
- ENH-001 matched to Vendor "Apple" via generic pattern
- User corrects to Vendor "iCloud", PT = Subscriptions, EC = Recurring Bills

**Steps:**

1. User corrects vendor from Apple → iCloud, saves

**Expected Result:**

- Merchant Pattern created: `pattern = "APPLE.COM/BILL"`, `match_type = contains`, `amount = 3.99`, `pattern_source = learned`, `confidence = medium`
- Future $3.99 APPLE.COM/BILL transactions match iCloud; other amounts still match Apple

---

### FUT-007: Re-categorize applies new patterns, skips user_corrected

**Covers:** ENH-001, FRM-001

**Preconditions:**

- 5 transactions for "UBER EATS": 3 `uncategorized`, 2 `user_corrected`
- New Merchant Pattern just added for "UBER EATS" → Vendor "Uber Eats"

**Steps:**

1. Select all 5 rows, click "Re-categorize"

**Expected Result:**

- 3 `uncategorized` transactions updated to Vendor "Uber Eats" with categories, status = `auto`
- 2 `user_corrected` transactions unchanged

---

### FUT-008: Split with percentage

**Covers:** ENH-009, FRM-001

**Preconditions:**

- Transaction: Padel Haus, $110.00

**Steps:**

1. Select row, click Split action
2. Enter: my share = 20%, description = "Padel with friends", recurring = true
3. Save

**Expected Result:**

- Transaction Split created: `my_share_pct = 0.20`, `my_share_amount = $22.00`, `is_recurring = true`
- Budget: $22.00 under Entertainment, $88.00 implicitly Reimbursable
- Churning: full $110.00

---

### FUT-009: Split with dollar amount

**Covers:** ENH-009

**Preconditions:**

- Transaction: restaurant, $85.00

**Steps:**

1. Split with my share amount = $42.50

**Expected Result:**

- `my_share_pct = null`, `my_share_amount = $42.50`
- Budget uses $42.50

---

### FUT-010: Reimbursed transaction (zero share)

**Covers:** ENH-009

**Preconditions:**

- Transaction: $200.00 purchase made for a friend

**Steps:**

1. Split with my share = 0%

**Expected Result:**

- `my_share_pct = 0`, `my_share_amount = $0`
- Budget: $0 under original PT, $200 implicitly Reimbursable (excluded)
- Churning: full $200.00 counts for points and MSR

---

### FUT-011: Recurring split suggestion

**Covers:** ENH-009, FRM-001

**Preconditions:**

- Previous Padel Haus split: 20%, `is_recurring = true`
- New Padel Haus transaction ingested: $120.00

**Steps:**

1. Open FRM-001, new Padel Haus transaction visible
2. Click Split action

**Expected Result:**

- Split dialog pre-populated: 20%, $24.00, "Padel with friends", recurring = true
- User confirms or dismisses — not auto-applied

---

### FUT-012: Inline editing on list report

**Covers:** FRM-001

**Preconditions:**

- 3 uncategorized transactions visible in list

**Steps:**

1. Click into Vendor cell on first row, type "Star" → fuse.js suggests "Starbucks"
2. Select Starbucks → PT auto-fills Dining, EC auto-fills Dining
3. Add note "morning coffee"
4. Save

**Expected Result:**

- Transaction updated: vendor, PT, EC, notes assigned
- `categorization_status = auto` (ENH-001 suggestion accepted) or `user_corrected` (if user changed from suggestion)
- Merchant Pattern created per BR-08

---

### FUT-013: Bulk apply categories

**Covers:** FRM-001

**Preconditions:**

- 4 uncategorized transactions, all from "SHELL STATION" variants

**Steps:**

1. Select all 4 rows
2. Click "Apply Categories"
3. Set Vendor = Shell, PT = Transportation/Gas, EC = Gas
4. Confirm

**Expected Result:**

- All 4 transactions updated with same vendor/categories
- Merchant Pattern created for each unique `raw_description`

---

### FUT-014: Vendor merge

**Covers:** FRM-009 (SPEC-06 amendment)

**Preconditions:**

- Vendor "Amazon" (50 transactions, 3 patterns)
- Vendor "Amazon.ca" (8 transactions, 1 pattern)

**Steps:**

1. Open FRM-009 → Vendors → "Amazon.ca" object page
2. Click "Merge Into..." → select "Amazon"
3. Confirm

**Expected Result:**

- 8 transactions reassigned from Amazon.ca → Amazon
- 1 Merchant Pattern moved to Amazon
- Amazon.ca deleted
- Vendor Category Stats view reflects merged data

---

### FUT-015: Weekly review end-to-end

**Covers:** ENH-001, ENH-009, FRM-001

**Preconditions:**

- 25 transactions ingested this week via SimpleFIN
- ENH-001 auto-categorized 20, left 5 uncategorized
- 1 recurring split pending (Padel Haus)

**Steps:**

1. Open FRM-001, default filter shows 5 uncategorized
2. Inline-edit 3 (vendor + categories)
3. Bulk apply categories on 2 (same vendor)
4. Clear filter, find Padel Haus → confirm recurring split suggestion
5. Spot-check 2 auto-categorized transactions → correct one (wrong EC)

**Expected Result:**

- 0 uncategorized remaining
- 5 new Merchant Patterns created (3 inline + 2 bulk)
- 1 split confirmed
- 1 transaction status changed to `user_corrected`
- Total review time: ~10-15 minutes

---

## 9. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-01 (Ingestion Pipeline) | ENH-001 called by FRM-003 (BR-20 in SPEC-01) to pre-populate vendor/category suggestions during CSV review. |
| SPEC-06 (Reference Data & Seed) | Amendment: add "Merge Into..." action on FRM-009 Vendor object page (D-122). Vendor merge reassigns transactions and consolidates Merchant Patterns. |
| SPEC-06 (Reference Data & Seed) | Corrects D-105 reference: vendor merge is SPEC-02's domain, not "SPEC-04." |
| SPEC-09 (Budget Engine) | ENH-007 must handle split transactions: use `my_share_amount` for budget, attribute remainder to Reimbursable. |
| SPEC-09 (Budget Engine) | Vendor Category Stats is a CDS view, not a stored entity. Budget engine and dropdown ranking query it directly. |
| SPEC-14 (Historical Backfill) | ENH-001 is tier 1 of three-tier backfill categorization. Patterns bootstrapped by CNV-001 corrections feed into learned patterns. |
| SPEC-03 (Card Lifecycle) | Card reassignment dropdown on FRM-001 object page — needs card lifecycle states for filtering (exclude Closed). |

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects ENH-001, ENH-009, FRM-001 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-114–D-122 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md).*
