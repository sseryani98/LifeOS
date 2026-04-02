# SPEC-05: Budget Pipeline

**Spec ID:** SPEC-05
**Name:** Budget Pipeline
**FRICEW Objects:** ENH-007, FRM-007
**Wave:** 1
**Sprint:** W1-S4
**CDS Services:** BudgetService
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                       |
| ---------- | --------------- | ----------------------------------------------------------------- |
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-131 through D-135 logged. |

---

## 2. Overview

ENH-007 (Budget Engine) computes monthly budget status on-demand: total income minus goal allocations equals total budget, split across Purchase Types by Budget Allocation ratios. FRM-007 (Income Entry) provides the income input surface as a Fiori Elements List Report with a Copy from Previous Month action.

Formula simplified from original design: recurrent expenses removed from formula (D-131), retained as forecasting data only. Spending goal transactions excluded from Purchase Type spend (D-132). Four budget alert types generated during transaction processing (D-134).

Key decisions: D-07 (refund reversal), D-08 (split share), D-11 (goals), D-12 (no rollover), D-15 (manual income), D-94 (100% constraint), D-97 (excludes_from_budget), D-119 (split remainder), D-131 (simplified formula), D-132 (goal transaction exclusion), D-133 (negative budget), D-134 (budget alerts), D-135 (retroactive allocation).

---

## 3. Data Model References

| Entity             | Role                                           | DM-001 Ref | Amendment?     |
| ------------------ | ---------------------------------------------- | ---------- | -------------- |
| Income Entry       | Monthly income by source type                  | §5.5       | —              |
| Income Source Type | Reference lookup for income entries            | §3.8       | —              |
| Budget Allocation  | Per-Purchase Type budget ratios (time-bound)   | §4.14      | —              |
| Purchase Type      | Budget taxonomy, `excludes_from_budget` flag   | §3.3       | —              |
| Recurrent Expense  | Forecasting only — not a formula input (D-131) | §4.10      | —              |
| Goal               | `monthly_allocation` deducted from income      | §4.11      | —              |
| Transaction        | Actual spend source                            | §5.1       | —              |
| Transaction Split  | `my_share_amount` for budget (D-08)            | §5.2       | —              |
| Alert              | Budget alerts                                  | §6.1       | —              |
| System Config      | `BUDGET_WARNING_THRESHOLD_PCT`                 | §3.17      | Add config key |

### DM-001 Amendments

**Amendment 1 — Budget Status formula update (D-131):**

Data Model §8 currently reads:

> "Budget Status: Income − Recurrent Expenses − Goal Allocations = Discretionary; actual spend vs Budget Allocations | ENH-007"

Updated to:

> "Budget Status: Income − Goal Allocations = Total Budget; actual spend vs Budget Allocations | ENH-007"

Recurrent Expenses are no longer a formula input. They remain as master data for forecasting purposes.

**System Config Addition (D-134):**

| Key                            | Default | Description                                                                 |
| ------------------------------ | ------- | --------------------------------------------------------------------------- |
| `BUDGET_WARNING_THRESHOLD_PCT` | `80`    | Percentage threshold at which category approaching-limit alert is generated |

**Alert Type Additions (D-134):**

| Alert Type                   | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `budget_category_warning`    | Purchase Type spend approaching budgeted limit |
| `budget_category_overspend`  | Purchase Type actual spend exceeds budget      |
| `budget_overspend`           | Total actual spend exceeds total budget        |
| `budget_goals_exceed_income` | Total goal allocations exceed total income     |

---

## 4. Functional Description

### 4.1 ENH-007 — Budget Engine [Enhancement]

**Inputs:** `month` (date, first of month — defaults to current month)

**Outputs:**

| Field                  | Type    | Notes                                          |
| ---------------------- | ------- | ---------------------------------------------- |
| `month`                | date    | First of month                                 |
| `totalIncome`          | decimal | Sum of Income Entry.amount for the month       |
| `totalGoalAllocations` | decimal | Sum of active Goal.monthly_allocation          |
| `totalBudget`          | decimal | `totalIncome - totalGoalAllocations`           |
| `categories`           | array   | Per-Purchase Type breakdown (see below)        |
| `uncategorized`        | decimal | Spend on transactions with no purchase_type_id |
| `totalActualSpend`     | decimal | Sum of all category actuals + uncategorized    |
| `totalRemaining`       | decimal | `totalBudget - totalActualSpend`               |

**Per-category output:**

| Field                | Type    | Notes                                                         |
| -------------------- | ------- | ------------------------------------------------------------- |
| `purchaseTypeId`     | UUID    | Top-level Purchase Type                                       |
| `purchaseTypeName`   | string  |                                                               |
| `ratio`              | decimal | From Budget Allocation                                        |
| `budgeted`           | decimal | `totalBudget × ratio / 100`                                   |
| `actual`             | decimal | Sum of included transactions for this type + subtypes         |
| `remaining`          | decimal | `budgeted - actual`                                           |
| `status`             | enum    | `over_budget` · `warning` · `on_track`                        |
| `recurrentsExpected` | decimal | Sum of active Recurrent Expense for this type (informational) |

**Consumers:**

| Consumer                           | Usage                                     |
| ---------------------------------- | ----------------------------------------- |
| RPT-002 (Monthly Budget Dashboard) | Primary consumer — full budget breakdown  |
| RPT-007 (Spending Trends)          | Historical budget data for trend analysis |
| RPT-012 (Income vs Expenses Trend) | Income and spend totals over time         |
| WFL-001 (Weekly Review Session)    | Budget status in weekly review            |

#### Budget Formula

```
Total Income = Σ(Income Entry.amount) for entries where month = target month
Total Goal Allocations = Σ(Goal.monthly_allocation) for active goals (is_active = true)
Total Budget = Total Income − Total Goal Allocations
```

Per-category budget: `Total Budget × Budget Allocation.ratio / 100`

#### Transaction Inclusion Rules

A transaction counts toward budget spend when ALL of these are true:

1. `posted_at` falls within the target calendar month
2. `is_excluded = false`
3. `goal_id IS NULL` (spending goal transactions excluded, D-132)
4. Purchase Type does NOT have `excludes_from_budget = true` (D-97), or `purchase_type_id IS NULL` (uncategorized — goes to virtual bucket)
5. Transaction does NOT have a Transaction Split with `my_share_amount = 0` (fully reimbursed)

**Amount used for budget:**

- If Transaction Split exists: use `my_share_amount` (D-08)
- If no split: use `|Transaction.amount|`
- Charges (negative amount): positive spend against budget
- Refunds (positive amount): negative spend, reduces category actual (D-07)

#### Subtype Rollup

Transactions categorized with a child Purchase Type roll up to the parent for budget computation. Budget Allocations only exist for top-level types (SPEC-06 BR-08).

#### Uncategorized Bucket

Transactions where `purchase_type_id IS NULL` are summed into the `uncategorized` field. This is a virtual bucket — outside the allocation ratio system — shown as a separate line on the budget view as a nudge to categorize during weekly review. Uncategorized spend is included in `totalActualSpend`.

#### Budget Allocation Selection

For a given month, the engine uses the Budget Allocation rows where:

- `effective_from <= last day of month`
- `effective_to IS NULL` OR `effective_to >= first day of month`

If allocations change mid-month, the latest active set applies retroactively to the entire month (D-135).

If the sum of active ratios ≠ 100%, the engine skips category-level computation (D-94, SPEC-06 BR-10). Total income, goal allocations, and total budget are still computed. Total actual spend is still tracked. Only the per-category breakdown is omitted.

#### Recurrent Expenses (Forecasting Only)

Per D-131, Recurrent Expense is not a formula input. For each category, the engine reports `recurrentsExpected` — the sum of active Recurrent Expense.amount for that Purchase Type in the given month. This is informational, helping the user see how much of a category's budget is committed vs. discretionary.

Active means: `effective_from <= last day of month` AND (`effective_to IS NULL` OR `effective_to >= first day of month`).

#### Category Status

| Status        | Condition                                                                        |
| ------------- | -------------------------------------------------------------------------------- |
| `over_budget` | `actual > budgeted`                                                              |
| `warning`     | `actual / budgeted ≥ BUDGET_WARNING_THRESHOLD_PCT / 100` AND `actual ≤ budgeted` |
| `on_track`    | `actual / budgeted < BUDGET_WARNING_THRESHOLD_PCT / 100`                         |

When `budgeted ≤ 0` (negative total budget), status is `over_budget` if any spend exists, `on_track` if zero.

#### Alert Generation (D-134)

| Alert Type                   | Trigger                       | Condition                                                       |
| ---------------------------- | ----------------------------- | --------------------------------------------------------------- |
| `budget_category_warning`    | Transaction processing        | Category spend crosses `BUDGET_WARNING_THRESHOLD_PCT` threshold |
| `budget_category_overspend`  | Transaction processing        | Category spend exceeds budgeted amount                          |
| `budget_overspend`           | Transaction processing        | Total spend exceeds total budget                                |
| `budget_goals_exceed_income` | Income Entry save / Goal save | Total goal allocations > total income for the current month     |

Alert entity fields:

- `alert_type_id` = corresponding Alert Type
- `card_instance_id` = null (budget alerts are not card-specific)
- `due_date` = last day of the month
- `message` = i18n-templated with category name, amounts

Alerts are idempotent — if an alert already exists for this alert type + month combination (+ Purchase Type for category alerts), do not create a duplicate. If a refund brings spend back below threshold, the existing alert remains (not auto-dismissed).

#### Computation Example

Month: March 2026

**Income:**

| Source           | Amount     |
| ---------------- | ---------- |
| Salary           | $5,000     |
| Churn Reward     | $200       |
| **Total Income** | **$5,200** |

**Goal Allocations:**

| Goal                       | Monthly Allocation |
| -------------------------- | ------------------ |
| Japan Vacation (spending)  | $500               |
| Emergency Fund (saving)    | $300               |
| **Total Goal Allocations** | **$800**           |

**Total Budget:** $5,200 − $800 = **$4,400**

**Budget Allocations (sum = 100%):**

| Purchase Type  | Ratio | Budgeted |
| -------------- | ----- | -------- |
| Housing        | 35%   | $1,540   |
| Groceries      | 20%   | $880     |
| Transportation | 15%   | $660     |
| Dining         | 10%   | $440     |
| Entertainment  | 10%   | $440     |
| Personal       | 10%   | $440     |

**Actual Spend (March transactions):**

| Purchase Type  | Transactions                  | Actual | Status             |
| -------------- | ----------------------------- | ------ | ------------------ |
| Housing        | Rent $1,500                   | $1,500 | on_track (97%)     |
| Groceries      | Various $720                  | $720   | warning (82%)      |
| Transportation | Gas $180, Insurance $200      | $380   | on_track (58%)     |
| Dining         | Restaurants $500, Refund -$30 | $470   | over_budget (107%) |
| Entertainment  | Netflix $15, Games $40        | $55    | on_track (13%)     |
| Personal       | Clothing $200                 | $200   | on_track (45%)     |

Uncategorized: $85 (two transactions without purchase_type_id)

**Totals:** totalActualSpend = $3,410, totalRemaining = $990

### 4.2 FRM-007 — Income Entry [Form]

**App location:** `app/income/`
**Pattern:** Fiori Elements List Report + Object Page
**CDS Service:** BudgetService

#### Field List

| Field                   | Type    | Required | Validation                       | Notes                            |
| ----------------------- | ------- | -------- | -------------------------------- | -------------------------------- |
| `month`                 | date    | yes      | Must be first of month           | Default: current month first day |
| `income_source_type_id` | FK      | yes      | Must be valid Income Source Type | ValueHelp                        |
| `amount`                | decimal | yes      | > 0                              |                                  |
| `description`           | text    | no       | Max 255 chars                    |                                  |
| `notes`                 | text    | no       | Max 1000 chars                   |                                  |

#### List Report

Standard Fiori Elements List Report. Columns: Month, Income Source Type, Amount, Description.

**Default filter:** Current month (via variant management).
**Sort:** Month descending, then Income Source Type.

#### Actions

| Action                   | Location              | Behavior                                                          |
| ------------------------ | --------------------- | ----------------------------------------------------------------- |
| Create                   | Table toolbar         | Standard FE create with defaults: month = current month first day |
| Copy from Previous Month | Table toolbar         | Custom action (see below)                                         |
| Edit                     | Inline or Object Page | Standard FE edit                                                  |
| Delete                   | Object Page           | Standard FE delete with confirmation                              |

**Copy from Previous Month logic:**

1. Determine "current month" from the active filter (or actual current month if no filter)
2. Find all Income Entry records for the previous month
3. If target month already has entries, show warning: "Income entries already exist for {month}. Copy skipped." and abort
4. If previous month has no entries, show info: "No income entries found for {previous month}." and abort
5. Copy each entry with the target month, same `income_source_type_id`, `amount`, `description`. Notes not copied.
6. Entries are created in draft mode for user review before save.

---

## 5. Business Rules

### ENH-007 — Budget Engine

| Rule  | Description                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Budget formula: `Total Income − Total Goal Allocations = Total Budget`. Recurrent Expenses are not a formula input (D-131).                                                 |
| BR-02 | Total Income = sum of Income Entry.amount for entries in the target month.                                                                                                  |
| BR-03 | Total Goal Allocations = sum of Goal.monthly_allocation for goals where `is_active = true`.                                                                                 |
| BR-04 | Per-category budget = `Total Budget × Budget Allocation.ratio / 100`.                                                                                                       |
| BR-05 | Only top-level, non-excluded Purchase Types participate in budget computation (SPEC-06 BR-08).                                                                              |
| BR-06 | Subtype transactions roll up to parent Purchase Type for budget spend.                                                                                                      |
| BR-07 | Budget Allocations selected by time overlap with the target month. Mid-month changes apply retroactively to the entire month (D-135).                                       |
| BR-08 | If active Budget Allocation ratios ≠ 100%, category-level computation is skipped. Totals still computed (D-94, SPEC-06 BR-10).                                              |
| BR-09 | Transaction inclusion: `is_excluded = false`, `goal_id IS NULL` (D-132), Purchase Type not excluded (D-97), within calendar month.                                          |
| BR-10 | Split transactions: use `my_share_amount` for budget. Fully reimbursed splits (`my_share_amount = 0`) excluded (D-08).                                                      |
| BR-11 | Split remainder is implicitly excluded — no storage, budget engine just uses `my_share_amount` (D-119).                                                                     |
| BR-12 | Refunds (positive amount) reduce actual spend in their Purchase Type (D-07).                                                                                                |
| BR-13 | Uncategorized transactions (`purchase_type_id IS NULL`) summed into virtual bucket, outside allocation ratios. Included in `totalActualSpend`.                              |
| BR-14 | Category status: `over_budget` when actual > budgeted; `warning` when actual/budgeted ≥ `BUDGET_WARNING_THRESHOLD_PCT` / 100; `on_track` otherwise.                         |
| BR-15 | `budget_category_warning` alert when spend crosses threshold. `budget_category_overspend` when actual exceeds budget. Both triggered during transaction processing (D-134). |
| BR-16 | `budget_overspend` alert when total spend exceeds total budget. Triggered during transaction processing.                                                                    |
| BR-17 | `budget_goals_exceed_income` alert when total goal allocations > total income. Triggered on Income Entry save or Goal save (D-133).                                         |
| BR-18 | Budget alerts are idempotent per alert type + month + Purchase Type combination.                                                                                            |
| BR-19 | Recurrent Expense amounts reported per category as `recurrentsExpected` — informational forecasting only (D-131).                                                           |
| BR-20 | Budget computed on-demand at read time. No persisted snapshots. Engine accepts any month parameter for historical queries.                                                  |
| BR-21 | Calendar month boundaries. No rollover between months (D-12).                                                                                                               |

### FRM-007 — Income Entry

| Rule  | Description                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| BR-22 | Multiple Income Entry records per month allowed.                                                                                 |
| BR-23 | `month` field must be first of month (e.g., 2026-03-01).                                                                         |
| BR-24 | Amount must be > 0.                                                                                                              |
| BR-25 | Copy from Previous Month copies all entries from previous month with new month value. Skips if target month already has entries. |
| BR-26 | Copied entries created in draft mode for user review. Notes field not copied.                                                    |

---

## 6. Error Handling

| Condition                                               | Response                                                                              | i18n Key Pattern              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------- |
| No Income Entry for target month                        | Compute normally with totalIncome = 0                                                 | —                             |
| Goal allocations exceed income                          | Compute with negative totalBudget; trigger `budget_goals_exceed_income` alert (D-133) | `budget.goalsExceedIncome`    |
| Budget Allocations ≠ 100%                               | Skip category computation; return totals only                                         | `budget.allocationIncomplete` |
| No Budget Allocations active for month                  | Skip category computation; return totals only                                         | `budget.noAllocations`        |
| Purchase Type has `excludes_from_budget = true`         | Excluded from budget computation silently                                             | —                             |
| Transaction has no Purchase Type                        | Counted in uncategorized bucket                                                       | —                             |
| Copy from Previous Month — target month has entries     | Warning message; copy aborted                                                         | `income.copyExists`           |
| Copy from Previous Month — no entries in previous month | Info message; nothing to copy                                                         | `income.copyEmpty`            |
| Income Entry amount ≤ 0                                 | Validation error                                                                      | `income.invalidAmount`        |
| Income Entry month not first of month                   | Validation error                                                                      | `income.invalidMonth`         |

---

## 7. Open Items

| OI    | Resolution                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OI-06 | Partially resolved. Budget alerts (`budget_category_warning`, `budget_category_overspend`, `budget_overspend`, `budget_goals_exceed_income`) defined in this spec. Other alert types deferred to their respective specs. |

---

## 8. Functional Unit Tests

### FUT-001: Basic budget computation — happy path

**Covers:** ENH-007

**Preconditions:**

- Income entries for March 2026: Salary $5,000
- Active goals: Japan Vacation $500/month
- Budget Allocations: Groceries 50%, Dining 50% (sum = 100%)
- March transactions: $300 groceries, $200 dining

**Steps:**

1. Compute budget for March 2026

**Expected Result:**

- totalIncome = $5,000, totalGoalAllocations = $500, totalBudget = $4,500
- Groceries: budgeted = $2,250, actual = $300, status = on_track
- Dining: budgeted = $2,250, actual = $200, status = on_track
- totalActualSpend = $500, totalRemaining = $4,000

---

### FUT-002: Refund reduces category spend

**Covers:** ENH-007

**Preconditions:**

- Budget setup as FUT-001
- March transactions: $400 dining charge, $50 dining refund

**Steps:**

1. Compute budget for March 2026

**Expected Result:**

- Dining actual = $350 ($400 − $50 refund)

---

### FUT-003: Split transaction — my_share_amount used

**Covers:** ENH-007

**Preconditions:**

- $100 dining transaction with Transaction Split: my_share_amount = $25

**Steps:**

1. Compute budget for March 2026

**Expected Result:**

- Dining actual includes $25 (not $100)

---

### FUT-004: Fully reimbursed split excluded

**Covers:** ENH-007

**Preconditions:**

- $200 transaction with Transaction Split: my_share_amount = $0

**Steps:**

1. Compute budget for March 2026

**Expected Result:**

- Transaction excluded from budget entirely

---

### FUT-005: Subtype rolls up to parent

**Covers:** ENH-007

**Preconditions:**

- Purchase Type "Coffee" is child of "Dining"
- Budget Allocation on "Dining" = 20%
- $15 transaction categorized as "Coffee"

**Steps:**

1. Compute budget

**Expected Result:**

- $15 counts toward Dining actual spend

---

### FUT-006: Excluded Purchase Type skipped

**Covers:** ENH-007

**Preconditions:**

- Purchase Type "Reimbursable" with `excludes_from_budget = true`
- $500 transaction categorized as Reimbursable

**Steps:**

1. Compute budget

**Expected Result:**

- $500 not included in any category actual or totalActualSpend

---

### FUT-007: Spending goal transaction excluded

**Covers:** ENH-007

**Preconditions:**

- Goal "Japan Vacation" (spending, monthly_allocation = $500)
- $2,000 transaction with goal_id = Japan Vacation, Purchase Type = "Travel"

**Steps:**

1. Compute budget

**Expected Result:**

- $2,000 excluded from Travel actual. Goal allocation ($500) still deducted from income.

---

### FUT-008: Uncategorized transactions in virtual bucket

**Covers:** ENH-007

**Preconditions:**

- Two transactions with `purchase_type_id = null`: $50, $35

**Steps:**

1. Compute budget

**Expected Result:**

- uncategorized = $85. Not counted in any category budget. Included in totalActualSpend.

---

### FUT-009: Allocations ≠ 100% — category computation skipped

**Covers:** ENH-007

**Preconditions:**

- Budget Allocations sum to 80%
- Income and transactions exist

**Steps:**

1. Compute budget

**Expected Result:**

- totalIncome, totalGoalAllocations, totalBudget computed normally
- categories array empty
- totalActualSpend still computed

---

### FUT-010: No income for month — zero budget

**Covers:** ENH-007

**Preconditions:**

- No Income Entry for March 2026
- Active goal: $300/month

**Steps:**

1. Compute budget for March 2026

**Expected Result:**

- totalIncome = 0, totalGoalAllocations = $300, totalBudget = −$300
- All categories show negative budgeted amounts

---

### FUT-011: Goal allocations exceed income — alert triggered

**Covers:** ENH-007

**Preconditions:**

- Income: $1,000, Goal allocations: $1,500

**Steps:**

1. Save Income Entry

**Expected Result:**

- totalBudget = −$500
- `budget_goals_exceed_income` alert generated (D-133)

---

### FUT-012: Category warning at 80% threshold

**Covers:** ENH-007

**Preconditions:**

- Dining budgeted = $500, System Config BUDGET_WARNING_THRESHOLD_PCT = 80
- Dining actual = $390 (78%)

**Steps:**

1. New $15 dining transaction ingested (total now $405, 81%)

**Expected Result:**

- Dining status = `warning`
- `budget_category_warning` alert generated

---

### FUT-013: Category overspend alert

**Covers:** ENH-007

**Preconditions:**

- Dining budgeted = $500, actual = $490

**Steps:**

1. New $20 dining transaction ingested (total now $510)

**Expected Result:**

- Dining status = `over_budget`
- `budget_category_overspend` alert generated

---

### FUT-014: Overall overspend alert

**Covers:** ENH-007

**Preconditions:**

- Total budget = $4,000, total actual = $3,950

**Steps:**

1. New $100 transaction ingested (total now $4,050)

**Expected Result:**

- `budget_overspend` alert generated

---

### FUT-015: Alert idempotency — no duplicate

**Covers:** ENH-007

**Preconditions:**

- `budget_category_overspend` alert already exists for Dining in March 2026
- New dining transaction ingested

**Steps:**

1. Budget engine evaluates alerts

**Expected Result:**

- No duplicate alert created

---

### FUT-016: Mid-month allocation change — retroactive

**Covers:** ENH-007

**Preconditions:**

- March 1: Dining ratio = 10% (budgeted = $440 on $4,400 budget)
- March 15: Dining ratio changed to 15% (budgeted = $660)
- March actual dining spend = $500 (all before the change)

**Steps:**

1. Compute budget for March after the change

**Expected Result:**

- Dining budgeted = $660 (new ratio applied retroactively, D-135)
- Dining actual = $500, status = on_track

---

### FUT-017: Historical month computation

**Covers:** ENH-007

**Preconditions:**

- January 2026 income, allocations, and transactions all exist

**Steps:**

1. Compute budget for January 2026 (historical)

**Expected Result:**

- Engine replays formula with January data. No persistence required.

---

### FUT-018: is_excluded transaction skipped

**Covers:** ENH-007

**Preconditions:**

- $100 transaction with `is_excluded = true`

**Steps:**

1. Compute budget

**Expected Result:**

- Transaction excluded from all budget computation

---

### FUT-019: Configurable warning threshold

**Covers:** ENH-007

**Preconditions:**

- System Config: BUDGET_WARNING_THRESHOLD_PCT = 90
- Dining budgeted = $500, actual = $440 (88%)

**Steps:**

1. Compute budget

**Expected Result:**

- Dining status = `on_track` (88% < 90% threshold)

---

### FUT-020: Income Entry — create and save

**Covers:** FRM-007

**Preconditions:**

- No existing entries

**Steps:**

1. Navigate to Income Entry list report
2. Click Create
3. Enter: month = 2026-03-01, type = Salary, amount = 5000

**Expected Result:**

- Entry saved, appears in list filtered to March

---

### FUT-021: Income Entry — Copy from Previous Month

**Covers:** FRM-007

**Preconditions:**

- February 2026 has: Salary $5,000, Churn Reward $200
- March 2026 has no entries

**Steps:**

1. Filter to March 2026
2. Click "Copy from Previous Month"

**Expected Result:**

- Two draft entries created: Salary $5,000, Churn Reward $200 (for March)
- Notes field not copied

---

### FUT-022: Income Entry — Copy blocked when entries exist

**Covers:** FRM-007

**Preconditions:**

- March 2026 already has entries

**Steps:**

1. Click "Copy from Previous Month" while filtered to March

**Expected Result:**

- Warning: "Income entries already exist for March 2026. Copy skipped."

---

### FUT-023: Income Entry — validation

**Covers:** FRM-007

**Steps:**

1. Attempt to save with amount = 0
2. Attempt to save with amount = -100
3. Attempt to save with month = 2026-03-15

**Expected Result:**

- All three rejected with validation errors

---

## 9. Cross-Spec Notes

| Target Spec                        | Note                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC-01 (Ingestion Pipeline)       | New transactions trigger budget alert evaluation as part of transaction processing.                                                                                                                                                                                                                                                     |
| SPEC-02 (Transaction Processing)   | Budget uses `my_share_amount` from splits (D-08). Split remainder implicitly excluded (D-119).                                                                                                                                                                                                                                          |
| SPEC-04 (Bonus & Points)           | ENH-007 and ENH-003/ENH-006 are peer computation engines in W1-S4. No direct dependency between them.                                                                                                                                                                                                                                   |
| SPEC-06 (Reference Data & Seed)    | Budget Allocation rules (BR-08 through BR-13) govern ENH-007's allocation selection. Alert types seeded: `budget_category_warning`, `budget_category_overspend`, `budget_overspend`, `budget_goals_exceed_income`. System Config key: `BUDGET_WARNING_THRESHOLD_PCT`. **DM-001 §8 amendment:** Budget Status formula updated per D-131. |
| SPEC-09 (Goals)                    | Goal.monthly_allocation feeds into ENH-007 formula. Spending goal transactions (goal_id set) excluded from Purchase Type budget (D-132).                                                                                                                                                                                                |
| SPEC-20 (Monthly Budget Dashboard) | RPT-002 is the primary consumer of ENH-007 output.                                                                                                                                                                                                                                                                                      |
| SPEC-12 (Budget Analytics)         | RPT-007 and RPT-012 consume ENH-007 for historical budget data.                                                                                                                                                                                                                                                                         |

---

_This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects ENH-007, FRM-007 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-131–D-135 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md)._
