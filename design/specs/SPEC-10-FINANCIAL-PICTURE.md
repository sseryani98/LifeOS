# SPEC-10: Financial Picture

**Spec ID:** SPEC-10
**Name:** Financial Picture
**FRICEW Objects:** FRM-011, RPT-003
**Wave:** 3
**Sprint:** W3-S1
**CDS Services:** BudgetService
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-157 through D-164 logged. |

---

## 2. Overview

FRM-011 (Financial Picture Entry) provides CRUD management for non-credit-card financial accounts — investments (RRSP, TFSA, FHSA, RIF, Crypto, Non-Registered, Savings Account) and liabilities (Car Loan, Student Loan, Mortgage, Line of Credit). Accounts track balance over time through periodic snapshots entered at any frequency. A batch entry action ("Update Balances") enables rapid updates across all active accounts in one screen. Separate contribution tracking on investment accounts enables true return computation (market growth vs deposits). Loan accounts with populated metadata display amortization curves and payoff projections. Vehicle/depreciating asset accounts display depreciation curves.

RPT-003 (Financial Picture Dashboard) presents net worth, asset/liability trends, asset allocation, month-over-month changes, and a debt-to-asset ratio. All Time is the default view with a year filter available. The dashboard resolves multiple snapshots per month to the latest and carries forward balances for months without entries.

This maps to PSV Problem 4 — net worth, debt trends, investment trends. Medium priority, manually maintained.

Key decisions: D-157 (dual entry workflow), D-158 (flexible frequency), D-159 (expanded account type seeds), D-160 (loan metadata), D-161 (type-specific object pages), D-162 (contribution entity), D-163 (dashboard layout), D-164 (stale data alert).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Financial Account | Account master data with optional loan/asset metadata | §4.16 | Yes — 5 new optional fields |
| Financial Account Type | Reference data — asset vs liability classification | §3.7 | Yes — expanded seed list (6 → 12) |
| Financial Snapshot | Periodic balance observations | §5.6 | — |
| Financial Contribution | Deposit/withdrawal events for return computation | — | Yes — new composition entity |
| System Config | Alert threshold | §3.17 | Yes — 1 new key |
| Alert | Stale data notification | §6.1 | Yes — 1 new Alert Type seed value |

### DM-001 Amendments

**1. Financial Account — 5 new optional fields (D-160)**

| Attribute | Type | Nullable | Notes |
|-----------|------|----------|-------|
| original_amount | Decimal(15,2) | Yes | Purchase price (assets) or loan principal (liabilities) |
| start_date | Date | Yes | Acquisition date or loan origination |
| interest_rate | Decimal(5,4) | Yes | Annual rate — liabilities only |
| monthly_payment | Decimal(15,2) | Yes | Fixed payment — liabilities only |
| term_months | Integer | Yes | Loan term in months — liabilities only |

**2. Financial Account Type — expanded seed list (D-159)**

| Name | is_asset | New? |
|------|----------|------|
| RRSP | true | — |
| TFSA | true | — |
| FHSA | true | — |
| RIF | true | — |
| Crypto | true | Yes |
| Vehicle | true | Yes |
| Non-Registered | true | Yes |
| Savings Account | true | Yes |
| Car Loan | false | — |
| Student Loan | false | — |
| Mortgage | false | Yes |
| Line of Credit | false | Yes |

**3. Financial Contribution — new composition entity (D-162)**

| Attribute | Type | Nullable | Notes |
|-----------|------|----------|-------|
| id | UUID | No | PK |
| financial_account_id | UUID | No | FK → Financial Account (composition parent) |
| amount | Decimal(15,2) | No | Positive = deposit, negative = withdrawal |
| contribution_date | Date | No | When the contribution occurred |
| notes | String(500) | Yes | Optional |

Composition under Financial Account. Cascade delete with parent. Relationship: Financial Contribution → Financial Account (N:1, required).

**4. New System Config key (D-164)**

| Key | Default | Description |
|-----|---------|-------------|
| `FINANCIAL_PICTURE_STALE_DAYS` | 45 | Days after which an account's snapshot data is considered stale |

**5. New Alert Type seed value (D-164)**

| Alert Type | Severity | Description |
|------------|----------|-------------|
| `financial_picture_stale` | Low | Active account has no snapshot within FINANCIAL_PICTURE_STALE_DAYS |

---

## 4. Functional Description

### 4.1 FRM-011 — Financial Picture Entry [Form]

**Type:** Fiori Elements — List Report + Object Page, with batch entry action

#### List Report

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Name | `name` | 20% | — |
| Type | `financial_account_type.name` | 15% | — |
| Asset/Liability | `financial_account_type.is_asset` | 10% | "Asset" (green) / "Liability" (orange) via ObjectStatus |
| Current Balance | Latest snapshot `balance` | 15% | Currency formatted |
| MoM Change | Computed | 15% | vs previous month ($, %) with semantic color |
| Last Updated | Latest snapshot `snapshot_date` | 15% | Date formatted |
| Active | `is_active` | 10% | Boolean |

**Default filter:** `is_active = true`.

**Sort:** Asset/Liability (assets first), then name alphabetical.

**Actions:**

| Action | Location | Effect |
|--------|----------|--------|
| **Update Balances** | Toolbar button | Opens batch entry dialog (§4.1.1) |
| **Create** | Standard Fiori | Create new financial account |

#### 4.1.1 Batch Entry — "Update Balances" (D-157)

Dialog opened from List Report toolbar. Editable table showing all active accounts.

| Column | Editable | Notes |
|--------|----------|-------|
| Account | No | `name` — read-only |
| Type | No | `financial_account_type.name` — read-only |
| Last Balance | No | Latest snapshot balance — reference |
| New Balance | **Yes** | Pre-filled with Last Balance. User overwrites changed accounts. |
| Date | **Yes** | Defaults to today. Single date field for all rows. |

**Behavior:**

- Pre-fills "New Balance" with the last known balance for each active account
- On Save, creates a Financial Snapshot only for accounts where New Balance ≠ Last Balance
- Accounts with no change are skipped — no duplicate snapshots
- Cancel discards all changes

#### Object Page

**Header:**

- Title: Account name
- Subtitle: Account type name
- ObjectStatus: "Asset" (Success/green) or "Liability" (Warning/orange)
- ObjectNumber: Current balance (latest snapshot)

**Section 1 — Account Details (editable):**

| Field | Type | Notes |
|-------|------|-------|
| Name | String | Required |
| Type | FK → Financial Account Type | Required |
| Original Amount | Decimal | Optional. Purchase price or loan principal. |
| Start Date | Date | Optional. Acquisition or origination. |
| Interest Rate (%) | Decimal | Optional. Annual rate. Relevant for liabilities. |
| Monthly Payment | Decimal | Optional. Relevant for liabilities. |
| Term (Months) | Integer | Optional. Relevant for liabilities. |
| Active | Boolean | — |
| Notes | Textarea | — |

**Section 2 — Balance Trend (all accounts):**

VizFrame line chart: snapshot balance over time. If `original_amount` is populated, displayed as a horizontal reference line.

**Section 3 — Amortization (conditional, D-161):**

Rendered only when `interest_rate`, `original_amount`, `monthly_payment`, and `term_months` are all populated.

| Element | Content |
|---------|---------|
| Amortization Curve | VizFrame dual-line chart: projected balance (computed from loan params) vs actual balance (from snapshots). Current position marker at latest snapshot. |
| Remaining Balance | ObjectNumber: latest snapshot balance |
| Payments Remaining | Computed: remaining balance / (monthly_payment − interest portion) |
| Projected Payoff | Date: computed from current balance + payment schedule |
| Total Interest Paid | Computed from actual payment history vs principal reduction |
| Total Interest (Life of Loan) | Computed from full amortization formula |

**Section 4 — Growth & Contributions (asset accounts only, D-161, D-162):**

Rendered only for accounts where `financial_account_type.is_asset = true`.

| Element | Content |
|---------|---------|
| Growth vs Contributions | VizFrame stacked area chart: cumulative contributions vs market growth over time |
| True Return | Market Growth / Total Invested Capital |
| Total Contributions | Sum of all positive contributions |
| Market Growth | Current Balance − (Original Amount + Total Contributions) |

Only renders growth metrics when `original_amount` is populated and at least one contribution exists. Otherwise, shows balance trend only (Section 2).

**Section 5 — Monthly Changes (all accounts):**

VizFrame horizontal bar chart: MoM balance changes. Green for gains/paydown, red for losses/increase.

**Section 6 — Snapshot History:**

Inline-editable table of Financial Snapshots.

| Column | Width | Notes |
|--------|-------|-------|
| Date | 25% | `snapshot_date` |
| Balance | 25% | Currency formatted |
| Change | 25% | Computed: vs previous snapshot ($, %) |
| Notes | 25% | Optional |

Add / Delete rows. Sorted by date descending.

**Section 7 — Contribution History (asset accounts only, D-162):**

Rendered only for accounts where `financial_account_type.is_asset = true`.

Inline-editable table of Financial Contributions.

| Column | Width | Notes |
|--------|-------|-------|
| Date | 25% | `contribution_date` |
| Amount | 25% | Positive = deposit, negative = withdrawal |
| Running Total | 25% | Cumulative sum to date |
| Notes | 25% | Optional |

Add / Delete rows. Sorted by date descending.

### 4.2 RPT-003 — Financial Picture Dashboard [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

**Period:** All Time default (D-163). Year filter in toolbar constrains all charts and KPIs to the selected year.

#### Row 1 — KPI Cards (half-width, 4 cards)

| Card | Value | Subtext | Semantic Color |
|------|-------|---------|----------------|
| Net Worth | Assets − Liabilities | MoM change ($, %) | Green if positive/increasing, Red if negative/decreasing |
| Total Assets | Sum of latest asset balances | MoM change ($, %) | — |
| Total Liabilities | Sum of latest liability balances | MoM change ($, %) | — |
| Debt-to-Asset Ratio | Liabilities / Assets × 100% | MoM change (pp) | Green if declining, Orange if increasing |

#### Row 2 — Net Worth Trend (full-width)

VizFrame line chart. X-axis: monthly. Y-axis: net worth ($). Single series. Monthly resolution — latest snapshot per month per account, carry-forward for missing months.

#### Row 3 — Asset Allocation + MoM Changes (half-width each)

| Card | Chart Type | Content |
|------|-----------|---------|
| Asset Allocation | Donut (VizFrame) | % split of total assets by account type. Current month only. |
| MoM Changes | Horizontal bar (VizFrame) | Per-account balance change from previous month. Green = gain/paydown, Red = loss/increase. Sorted by absolute change descending. |

#### Row 4 — Assets Trend (full-width)

VizFrame multi-line chart. One series per active asset account. Monthly resolution.

#### Row 5 — Liabilities Trend (full-width)

VizFrame multi-line chart. One series per active liability account. Monthly resolution.

#### Row 6 — Account Summary Table (full-width)

| Column | Notes |
|--------|-------|
| Account | `name` |
| Type | `financial_account_type.name` |
| Asset/Liability | ObjectStatus with semantic color |
| Current Balance | Latest snapshot |
| Previous Balance | Previous month's latest snapshot |
| Change ($) | Current − Previous, semantic color |
| Change (%) | Percentage change, semantic color |

Sortable. Search enabled. Standard table conventions per Design System §9.1.1.

---

## 5. Business Rules

### Snapshot Resolution

| Rule | Description |
|------|-------------|
| BR-01 | Net worth = sum(latest active asset snapshot balances) − sum(latest active liability snapshot balances). |
| BR-02 | Monthly snapshot resolution: for months with multiple snapshots per account, use the latest (`max(snapshot_date)` within the calendar month). |
| BR-03 | Carry-forward: if an account has no snapshot in a given month, the dashboard uses the last known balance (most recent snapshot before that month). |

### Entry Workflow

| Rule | Description |
|------|-------------|
| BR-04 | Batch entry pre-fills "New Balance" with each active account's last known balance. Only creates a Financial Snapshot when New Balance ≠ Last Balance. Date defaults to today (D-157). |
| BR-05 | Snapshots can be entered at any frequency — multiple per month allowed. Dashboard resolves to monthly granularity (D-158). |
| BR-06 | Inactive accounts (`is_active = false`) are excluded from batch entry, all dashboard KPIs, and trend charts. |

### Loan Computations

| Rule | Description |
|------|-------------|
| BR-07 | Amortization curve computed from `interest_rate`, `original_amount`, `monthly_payment`, `start_date`, `term_months` using standard amortization formula. Projected vs actual (from snapshots) displayed as dual-line chart (D-160). |
| BR-08 | Projected payoff date computed from current balance (latest snapshot) + remaining payments at `monthly_payment` with `interest_rate`. Updates dynamically as new snapshots are entered (D-160). |
| BR-09 | Amortization section renders only when all four loan fields (`interest_rate`, `original_amount`, `monthly_payment`, `term_months`) are populated (D-161). |

### Investment Computations

| Rule | Description |
|------|-------------|
| BR-10 | Market Growth = Balance Change − Net Contributions. All-time: Current Balance − (Original Amount + sum of all positive contributions) (D-162). |
| BR-11 | True Return = Market Growth / Total Invested Capital. Total Invested Capital = `original_amount` + sum of all positive contributions (D-162). |
| BR-12 | Contributions are entered on the account's object page only — not part of batch entry (D-162). |
| BR-13 | Growth & Contributions section renders for asset-type accounts when `original_amount` is populated and at least one contribution exists (D-161). |

### Dashboard

| Rule | Description |
|------|-------------|
| BR-14 | Dashboard defaults to All Time view. Year filter constrains all charts and KPIs to the selected year (D-163). |
| BR-15 | Debt-to-Asset Ratio = Total Liabilities / Total Assets × 100%. Not computed when Total Assets = 0 — card displays "N/A" (D-163). |
| BR-16 | MoM change = current month's latest snapshot balance − previous month's latest snapshot balance, per account. For KPI cards, aggregated across all active accounts in each category. |
| BR-17 | Asset allocation donut shows current-month data only. Groups by Financial Account Type. |

### Alerts

| Rule | Description |
|------|-------------|
| BR-18 | `financial_picture_stale` — daily scheduled check. Fires when any active account's latest snapshot is older than `FINANCIAL_PICTURE_STALE_DAYS` (System Config, default 45). One alert per stale account. Idempotent (D-164). |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| Account name empty | `req.error()` 400 | `budget.financialAccount.nameRequired` |
| Account name duplicate | `req.error()` 400 | `budget.financialAccount.nameDuplicate` |
| Account type not selected | `req.error()` 400 | `budget.financialAccount.typeRequired` |
| Snapshot balance < 0 | `req.error()` 400 | `budget.financialSnapshot.negativeBalance` |
| Snapshot date missing | `req.error()` 400 | `budget.financialSnapshot.dateRequired` |
| Contribution amount = 0 | `req.error()` 400 | `budget.financialContribution.zeroAmount` |
| Contribution date missing | `req.error()` 400 | `budget.financialContribution.dateRequired` |
| Delete account with snapshots | `req.error()` 400 with count | `budget.financialAccount.hasSnapshots` |
| Interest rate > 100 or < 0 | `req.error()` 400 | `budget.financialAccount.invalidInterestRate` |
| Monthly payment < 0 | `req.error()` 400 | `budget.financialAccount.invalidPayment` |
| Term months ≤ 0 | `req.error()` 400 | `budget.financialAccount.invalidTerm` |
| Batch entry with no changes | No action, dismiss dialog | — |
| No snapshots for dashboard | Cards show "No data available" | — |

---

## 7. Open Items

None. OI-06 (alert event types) incrementally addressed — `financial_picture_stale` defined.

---

## 8. Functional Unit Tests

### FUT-100: Create financial account

**Covers:** FRM-011

**Preconditions:**

- System has Financial Account Types seeded

**Steps:**

1. Navigate to FRM-011 List Report
2. Click Create
3. Enter: Name = "TFSA - Wealthsimple", Type = TFSA, Active = true

**Expected Result:**

- Account appears in list report
- Current Balance column shows blank (no snapshots yet)

### FUT-101: Add snapshot to account

**Covers:** FRM-011

**Preconditions:**

- Financial account "TFSA - Wealthsimple" exists

**Steps:**

1. Navigate to account's Object Page
2. In Snapshot History, add row: Date = 2026-01-31, Balance = 50000

**Expected Result:**

- Snapshot appears in history table
- List report shows Current Balance = $50,000, Last Updated = 2026-01-31

### FUT-102: Batch entry — changed balances only

**Covers:** FRM-011

**Preconditions:**

- 3 active accounts: TFSA ($50K), RRSP ($80K), Car Loan ($15K)

**Steps:**

1. Click "Update Balances" on List Report
2. All three accounts shown with pre-filled balances
3. Change TFSA New Balance to $52,000. Leave others unchanged.
4. Click Save

**Expected Result:**

- New snapshot created for TFSA only (balance = $52,000, date = today)
- No new snapshots for RRSP or Car Loan
- List report reflects updated TFSA balance

### FUT-103: Batch entry — no changes

**Covers:** FRM-011

**Preconditions:**

- 3 active accounts with existing snapshots

**Steps:**

1. Click "Update Balances"
2. Make no changes
3. Click Save

**Expected Result:**

- No new snapshots created
- Dialog closes

### FUT-104: Multiple snapshots in same month

**Covers:** RPT-003

**Preconditions:**

- TFSA account with snapshot: Jan 15 = $50K

**Steps:**

1. Add second snapshot: Jan 28 = $52K

**Expected Result:**

- Dashboard uses $52K for January (latest snapshot in month)
- Both snapshots visible in Object Page history

### FUT-105: Carry-forward for missing month

**Covers:** RPT-003

**Preconditions:**

- TFSA account with snapshot in January ($50K), none in February

**Steps:**

1. Open RPT-003 dashboard

**Expected Result:**

- Net Worth Trend shows $50K for both January and February (carry-forward)

### FUT-106: Net worth and KPI computation

**Covers:** RPT-003

**Preconditions:**

- TFSA: latest balance $50K (asset)
- RRSP: latest balance $30K (asset)
- Car Loan: latest balance $15K (liability)

**Steps:**

1. Open RPT-003 dashboard

**Expected Result:**

- Net Worth = $65,000
- Total Assets = $80,000
- Total Liabilities = $15,000
- Debt-to-Asset Ratio = 18.75%

### FUT-107: Month-over-month change

**Covers:** RPT-003

**Preconditions:**

- TFSA: Jan = $50K, Feb = $52K

**Steps:**

1. Open RPT-003 dashboard

**Expected Result:**

- TFSA MoM change shows +$2,000 (+4.0%)
- MoM Changes bar chart shows TFSA green bar

### FUT-108: Asset allocation donut

**Covers:** RPT-003

**Preconditions:**

- RRSP: $50K, TFSA: $30K, Crypto: $20K (all current month)

**Steps:**

1. Open RPT-003 dashboard

**Expected Result:**

- Asset Allocation donut: RRSP 50%, TFSA 30%, Crypto 20%

### FUT-109: Loan amortization curve

**Covers:** FRM-011

**Preconditions:**

- Car Loan account: original_amount = $30K, interest_rate = 4.99%, monthly_payment = $565, term_months = 60, start_date = 2024-01-15
- Latest snapshot balance = $20K

**Steps:**

1. Navigate to Car Loan Object Page

**Expected Result:**

- Amortization section rendered
- Dual-line chart: projected curve vs actual balance
- Current position marker at $20K
- Remaining Balance = $20,000
- Projected payoff date computed

### FUT-110: Loan fields incomplete — no amortization

**Covers:** FRM-011

**Preconditions:**

- Car Loan account: original_amount = $30K, interest_rate = 4.99%. Monthly payment and term NOT set.

**Steps:**

1. Navigate to Car Loan Object Page

**Expected Result:**

- Amortization section NOT rendered (missing required loan fields)
- Balance Trend chart still shown

### FUT-111: Vehicle depreciation curve

**Covers:** FRM-011

**Preconditions:**

- Vehicle account: original_amount = $35K
- Snapshots: Jan = $33K, Feb = $31K, Mar = $29K

**Steps:**

1. Navigate to Vehicle Object Page

**Expected Result:**

- Balance Trend chart shows declining line
- Horizontal reference line at $35K (original value)

### FUT-112: Investment return computation

**Covers:** FRM-011

**Preconditions:**

- TFSA: original_amount = $10K
- 3 contributions: $500 each (total $1,500)
- Latest balance = $14K

**Steps:**

1. Navigate to TFSA Object Page

**Expected Result:**

- Total Contributions = $1,500
- Market Growth = $14K − ($10K + $1.5K) = $2,500
- True Return displayed
- Growth vs Contributions stacked area chart rendered

### FUT-113: Growth section requires original amount and contributions

**Covers:** FRM-011

**Preconditions:**

- TFSA: original_amount NOT set. No contributions.
- Snapshots exist.

**Steps:**

1. Navigate to TFSA Object Page

**Expected Result:**

- Growth & Contributions section NOT rendered
- Balance Trend chart still shown

### FUT-114: Stale data alert — triggered

**Covers:** FRM-011, RPT-003

**Preconditions:**

- TFSA: latest snapshot is 46 days old
- FINANCIAL_PICTURE_STALE_DAYS = 45

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- `financial_picture_stale` alert created for TFSA account
- Alert severity = Low

### FUT-115: Stale data alert — not triggered

**Covers:** FRM-011

**Preconditions:**

- TFSA: latest snapshot is 44 days old
- FINANCIAL_PICTURE_STALE_DAYS = 45

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- No alert created for TFSA

### FUT-116: Deactivate account

**Covers:** FRM-011, RPT-003

**Preconditions:**

- 3 active accounts. Deactivate one.

**Steps:**

1. Set `is_active = false` on RRSP account
2. Open "Update Balances" dialog
3. Open RPT-003 dashboard

**Expected Result:**

- RRSP not shown in batch entry
- RRSP excluded from all dashboard KPIs and charts
- Net worth recalculated without RRSP

### FUT-117: Dashboard with no data

**Covers:** RPT-003

**Preconditions:**

- No financial accounts or no snapshots exist

**Steps:**

1. Open RPT-003 dashboard

**Expected Result:**

- All cards show "No data available"
- Layout does not shift (cards remain visible per Design System §9.4)

### FUT-118: Year filter on dashboard

**Covers:** RPT-003

**Preconditions:**

- Snapshots spanning 2024, 2025, 2026

**Steps:**

1. Open RPT-003 dashboard (shows All Time)
2. Apply year filter: 2025

**Expected Result:**

- All charts show only 2025 data
- KPIs computed from 2025 snapshots only
- Asset allocation shows 2025 latest month

---

## 9. Cross-References / Dependencies

| Spec | Dependency |
|------|------------|
| SPEC-06 (Reference Data & Seed) | Financial Account Type seeds expanded (6 → 12). System Config gains 1 new key. Alert Type gains 1 new seed value. FRM-009 maintains all reference data including Financial Account Types. |
| SPEC-05 (Budget Pipeline) | No direct dependency. Financial picture is independent of budget computation. |
| SPEC-20 (Budget Dashboard) | RPT-002 may reference net worth from RPT-003 for context. |
| SPEC-19 (Churnboard) | RPT-001 may include a net worth summary section consuming RPT-003 data. |

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects FRM-011, RPT-003 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-157–D-164 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md).*
