# SPEC-12: Budget Analytics

**Spec ID:** SPEC-12
**Name:** Budget Analytics
**FRICEW Objects:** RPT-007, RPT-012
**Wave:** 3
**Sprint:** RPT-007 in W3-S1, RPT-012 in W3-S2
**CDS Services:** BudgetService
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-18 | Sandro & Claude | Initial creation — workshop complete. D-170 through D-176 logged. |

---

## 2. Overview

SPEC-12 covers two budget-focused analytical reports in the "Finances" navigation group, both Wave 3 leaf nodes. They are pure consumers of ENH-007 (Budget Engine) output with no downstream dependents.

**RPT-007 (Spending Trends)** is a freestyle dashboard providing multi-month spend analysis: spend by category over time, budget vs. actual trend, category health heatmap, month-over-month comparison, vendor concentration, and uncategorized spend tracking. Shows how spending patterns shift across months and highlights persistent budget trouble spots.

**RPT-012 (Income vs Expenses Trend)** is a freestyle dashboard presenting the macro financial view: income vs. total expenses over time, savings rate trend, surplus vs. deficit months, and income composition. Answers "am I living within my means?"

Both dashboards are separate navigation items (D-170, confirming D-58), use a year dropdown selector consistent with the SPEC-11 pattern (D-171), and retrieve data via a CDS function that calls ENH-007 iteratively per month server-side to avoid multiple OData round trips (D-176).

Key decisions: D-12 (no rollover), D-15 (manual income), D-131 (simplified budget formula), D-132 (goal transaction exclusion), D-135 (retroactive allocation), D-170 (two separate pages), D-171 (year selector), D-172 (RPT-007 layout), D-173 (RPT-012 layout), D-174 (outflow definition), D-175 (savings rate formula), D-176 (CDS function).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Transaction | Primary spend source — amounts, dates, categorization | §5.1 | — |
| Transaction Split | my_share_amount for split budget calculations | §5.2 | — |
| Income Entry | Monthly income amounts by source type | §5.5 | — |
| Income Source Type | Income classification (Salary, Bonus, Churn Reward) | §3.5 | — |
| Purchase Type | Two-level budget taxonomy, parent for rollup | §3.3 | — |
| Budget Allocation | Ratio per top-level Purchase Type, time-bound | §4.14 | — |
| Goal | monthly_allocation deducted from income by ENH-007 | §4.11 | — |
| Vendor | Merchant names for vendor concentration analysis | §4.8 | — |
| Recurrent Expense | Informational only — not a formula input (D-131) | §4.10 | — |

### DM-001 Amendments

None. SPEC-12 consumes existing entities and ENH-007 computed output. No new entities or fields required.

---

## 4. Functional Description

### 4.1 RPT-007 — Spending Trends [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

#### Controls

- **Year Selector:** Dropdown listing calendar years with transaction data, default = current year. Position: top-left `sap.m.Bar`. Same pattern as SPEC-11 RPT-009 (D-171).

#### Section 1 — KPI Row (full-width)

| KPI | Computation | Format |
|-----|-------------|--------|
| Total Spend YTD | Sum of `totalActualSpend` across all months in selected year | Currency (ObjectNumber, neutral) |
| Avg Monthly Spend | Total Spend YTD / count of elapsed months in selected year | Currency (ObjectNumber, neutral) |
| Highest-Spend Month | Month with maximum `totalActualSpend` — display month name + amount | Text + Currency |
| Over-Budget Months | Count of months where `totalActualSpend > totalBudget` | Integer (ObjectNumber, Error if > 0, Success if 0) |

#### Section 2 — Spend by Category Over Time (full-width)

Stacked bar chart (VizFrame). X-axis = months in selected year. Each stack = top-level Purchase Type. Values = `actual` per category from ENH-007. Uncategorized spend included as its own stack segment.

Follows D-61 default: 3+ series trend → stacked bar.

#### Section 3 — Budget vs Actual Trend (full-width)

Line chart (VizFrame), two series:

- Series 1: `totalBudget` per month
- Series 2: `totalActualSpend` per month

X-axis = months. Y-axis = currency. Shows whether spending consistently exceeds or stays within budget over time.

#### Section 4 — Category Health Heatmap (full-width)

Table with colored cells:

- **Rows:** Top-level Purchase Types (matching ENH-007 category output)
- **Columns:** One per month in the selected year (Jan through Dec, or through current month for partial year)
- **Cell value:** Category `actual` spend amount
- **Cell color:** Mapped from ENH-007 per-category `status` — `on_track` = green, `warning` = orange, `over_budget` = red
- **Future months:** Blank/grey for current year

Provides at-a-glance view of which categories are persistent trouble spots (e.g., "Dining Out red for 4 straight months").

#### Section 5 — Month-over-Month Comparison (half-width)

Table format:

- **Rows:** Top-level Purchase Types
- **Columns:** Prior Month ($), Current Month ($), Delta ($), Delta (%)
- "Current month" = most recent elapsed month in selected year
- "Prior month" = the month before current month
- If only one month exists (January of selected year), prior month columns show blank

Sortable. Standard table personalization applies.

#### Section 6 — Vendor Concentration (half-width)

Horizontal bar chart (VizFrame), top 10 vendors by total spend for the selected year.

- **Optional category filter:** Dropdown above chart to select a top-level Purchase Type. Default = All (D-172).
- **Data source:** Transactions joined to Vendor, aggregated by `vendor_id`, sorted descending by spend
- **Inclusion rules:** Same as ENH-007 — `is_excluded = false`, goal-linked excluded, splits use `my_share_amount`

#### Section 7 — Uncategorized Spend Trend (half-width)

Combination chart (VizFrame):

- **Bars** (left Y-axis): `uncategorized` amount from ENH-007 per month
- **Line** (right Y-axis): Count of transactions with null `purchase_type_id` per month

Serves as a data quality indicator. Declining trends indicate the categorization engine is learning effectively.

#### Partial Year Behavior

When the selected year is the current year, data is shown through the current month. Future months are absent from all charts and the heatmap. No special year-to-date indicator (same as SPEC-11 BR-07).

### 4.2 RPT-012 — Income vs Expenses Trend [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

#### Controls

- **Year Selector:** Same pattern as RPT-007 (D-171).

#### Section 1 — KPI Row (full-width)

| KPI | Computation | Format |
|-----|-------------|--------|
| Total Income YTD | Sum of `totalIncome` across all months in selected year | Currency (ObjectNumber, neutral) |
| Total Expenses YTD | Sum of `totalActualSpend` across all months in selected year | Currency (ObjectNumber, neutral) |
| Net Surplus/Deficit YTD | Total Income YTD − Total Expenses YTD | Currency (ObjectNumber, Success if ≥ 0, Error if negative) |
| Avg Savings Rate | Mean of monthly savings rates for elapsed months in selected year | Percentage (ObjectNumber, Success if ≥ 0%, Error if negative) |

#### Section 2 — Income vs Expenses Trend (full-width)

Combination chart (VizFrame):

- **Clustered bars:** `totalIncome` and `totalActualSpend` per month (two bar series)
- **Line:** Net surplus/deficit per month (`totalIncome - totalActualSpend`)

X-axis = months. Left Y-axis = currency. Shows income and expense levels side by side with the net trend overlaid.

#### Section 3 — Savings Rate Trend (full-width)

Line chart (VizFrame), single series:

- Value = `(totalIncome - totalActualSpend) / totalIncome × 100` per month
- If `totalIncome = 0` for a month, savings rate = 0% (D-175)

X-axis = months. Y-axis = percentage.

#### Section 4 — Surplus / Deficit Summary (half-width)

Vertical bar chart (VizFrame):

- One bar per month
- Value = `totalIncome - totalActualSpend`
- Color: green for positive (surplus), red for negative (deficit)

#### Section 5 — Income Breakdown (half-width)

Donut chart (VizFrame):

- Segments = Income Source Types (Salary, Bonus, Churn Reward)
- Values = YTD sum of Income Entry amounts per source type for the selected year
- Tooltip: source name + amount + percentage of total

Follows D-61 default: part-of-whole → donut.

#### Definitions (D-174, D-175)

| Term | Definition |
|------|------------|
| Total outflow | `totalActualSpend` from ENH-007. Goal allocations are not included. |
| Surplus/deficit | `totalIncome - totalActualSpend`. Positive = surplus, negative = deficit. |
| Savings rate | `(totalIncome - totalActualSpend) / totalIncome × 100`. Division by zero (zero income month) yields 0%. |

Goal allocations are treated as part of the surplus in this view. RPT-012 answers "how much of my income did I actually spend" rather than "how much is uncommitted."

#### Partial Year Behavior

Same as RPT-007. Current year shows months through today. Future months absent. No YTD indicator.

---

## 5. Business Rules

### RPT-007 — Spending Trends

| Rule | Description |
|------|-------------|
| BR-01 | Year selector lists all calendar years that contain at least one transaction. Default = current year (D-171). |
| BR-02 | Partial-year behavior: current year shows months through the current month only. Future months absent from all charts and the heatmap. No YTD indicator (D-171). |
| BR-03 | All spend data sourced from ENH-007 output — same inclusion rules apply: `is_excluded = false`, goal-linked transactions excluded, splits use `my_share_amount`, refunds reduce spend. Inherits SPEC-05 BR-20, BR-21, BR-12, BR-06, BR-13 (D-172). |
| BR-04 | KPI "Total Spend YTD" = sum of `totalActualSpend` across all months in selected year (D-172). |
| BR-05 | KPI "Avg Monthly Spend" = Total Spend YTD / count of elapsed months in selected year (D-172). |
| BR-06 | KPI "Highest-Spend Month" = month with maximum `totalActualSpend`. Display month name + amount (D-172). |
| BR-07 | KPI "Over-Budget Months" = count of months where `totalActualSpend > totalBudget`. ObjectNumber with Error state if > 0, Success if 0 (D-172). |
| BR-08 | Spend by Category Over Time: stacked bar chart. X-axis = months, stacks = top-level Purchase Types, values = `actual` per category. Uncategorized shown as its own stack segment (D-172). |
| BR-09 | Budget vs Actual Trend: line chart, two series — `totalBudget` and `totalActualSpend` per month (D-172). |
| BR-10 | Category Health Heatmap: rows = top-level Purchase Types, columns = months. Cell value = category `actual`. Cell color from ENH-007 `status` (`on_track` = green, `warning` = orange, `over_budget` = red). Future months blank/grey (D-172). |
| BR-11 | Month-over-Month Comparison: table with rows = top-level Purchase Types, columns = prior month, current month, delta ($), delta (%). Current month = most recent elapsed month. If only one month exists, prior month columns blank (D-172). |
| BR-12 | Vendor Concentration: horizontal bar, top 10 vendors by total spend for selected year. Optional Purchase Type filter dropdown (default = All). Same inclusion rules as ENH-007 (D-172). |
| BR-13 | Uncategorized Spend Trend: combination chart. Bars = `uncategorized` amount (left Y-axis). Line = count of uncategorized transactions (right Y-axis). Per month (D-172). |

### RPT-012 — Income vs Expenses Trend

| Rule | Description |
|------|-------------|
| BR-14 | Year selector: same behavior as RPT-007 BR-01 and BR-02 (D-171). |
| BR-15 | Total outflow = `totalActualSpend` from ENH-007. Goal allocations are not included in outflow (D-174). |
| BR-16 | Savings rate = `(totalIncome - totalActualSpend) / totalIncome × 100`. If `totalIncome = 0` for a month, savings rate = 0% (D-175). |
| BR-17 | Surplus/deficit = `totalIncome - totalActualSpend`. Positive = surplus, negative = deficit (D-174). |
| BR-18 | KPI "Total Income YTD" = sum of `totalIncome` across all months in selected year. ObjectNumber, neutral (D-173). |
| BR-19 | KPI "Total Expenses YTD" = sum of `totalActualSpend` across all months. ObjectNumber, neutral (D-173). |
| BR-20 | KPI "Net Surplus/Deficit YTD" = Total Income YTD − Total Expenses YTD. ObjectNumber, Success if ≥ 0, Error if negative (D-173). |
| BR-21 | KPI "Avg Savings Rate" = mean of monthly savings rates for elapsed months. ObjectNumber, Success if ≥ 0%, Error if negative (D-173). |
| BR-22 | Income vs Expenses Trend: combination chart. Clustered bars = `totalIncome` and `totalActualSpend` per month. Line = net surplus/deficit per month (D-173). |
| BR-23 | Savings Rate Trend: line chart, single series = savings rate % per month (D-173). |
| BR-24 | Surplus / Deficit Summary: vertical bar chart, one bar per month. Green if positive (surplus), red if negative (deficit) (D-173). |
| BR-25 | Income Breakdown: donut chart showing YTD income by Income Source Type for the selected year (D-173). |

### Cross-cutting

| Rule | Description |
|------|-------------|
| BR-26 | Data retrieval: a CDS function on BudgetService accepts a year parameter and returns all monthly ENH-007 results in a single call. Engine invoked server-side per month. One-vs-two function split deferred to implementation (D-176). |
| BR-27 | No alerts for either dashboard. OI-06 considered, not applicable — these are retrospective analytics dashboards. |
| BR-28 | No cross-chart interactions or drill-through navigation (D-61). Standard VizFrame hover tooltips only. |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| RPT-007: no data for selected year | Standard `noDataText` on all charts and tables | — |
| RPT-012: no data for selected year | Standard `noDataText` on all charts and KPIs show 0 | — |
| RPT-007: no uncategorized transactions | Uncategorized chart shows zero values / flat line | — |
| RPT-012: zero income month | Savings rate = 0% for that month (BR-16) | — |
| CDS function: year parameter invalid | `req.error()` 400 | `budget.trend.invalidYear` |
| CDS function: ENH-007 computation failure | `req.reject()` 500 | `budget.trend.computationError` |

---

## 7. Open Items

None. All design questions resolved during workshop. OI-06 (alerts) considered and deemed not applicable.

---

## 8. Functional Unit Tests

### FUT-001: RPT-007 full year with mixed budget statuses

**Covers:** RPT-007

**Preconditions:**

- 12 months of transaction data for 2025
- Multiple Purchase Types with varying spend levels — some on_track, some warning, some over_budget
- Income entries and budget allocations in place

**Steps:**

1. Open Spending Trends
2. Select 2025 from year dropdown

**Expected Result:**

- KPI row shows full-year totals
- Stacked bar shows 12 months with category breakdown
- Heatmap shows 12 columns with green/orange/red cells
- Budget vs Actual shows two lines across 12 months
- MoM table compares Nov vs Dec

---

### FUT-002: RPT-007 partial year (current year)

**Covers:** RPT-007

**Preconditions:**

- Current year is 2026, data exists for Jan–Mar only

**Steps:**

1. Open Spending Trends
2. Year defaults to 2026

**Expected Result:**

- Charts show 3 months only, no future months
- KPI "Avg Monthly Spend" divides by 3
- MoM table compares Feb vs Mar
- Heatmap shows 3 columns

---

### FUT-003: RPT-007 single month only

**Covers:** RPT-007

**Preconditions:**

- Selected year has data for January only

**Steps:**

1. Open Spending Trends, select that year

**Expected Result:**

- Stacked bar shows 1 month
- Heatmap shows 1 column
- MoM table shows current month values, prior month columns blank
- Budget vs Actual shows single data point
- "Highest-Spend Month" = January

---

### FUT-004: RPT-007 year with no over-budget months

**Covers:** RPT-007

**Preconditions:**

- All months in selected year have `totalActualSpend ≤ totalBudget`

**Steps:**

1. Open Spending Trends

**Expected Result:**

- KPI "Over-Budget Months" = 0 with Success (green) state
- Budget vs Actual line for actual stays below budget line

---

### FUT-005: RPT-007 vendor concentration with category filter

**Covers:** RPT-007

**Preconditions:**

- Transactions across multiple vendors and Purchase Types

**Steps:**

1. Open Spending Trends
2. In Vendor Concentration card, select "Dining Out" from category dropdown

**Expected Result:**

- Horizontal bar updates to show top 10 vendors for Dining Out only
- Totals reflect Dining Out transactions only

---

### FUT-006: RPT-007 vendor concentration default (all categories)

**Covers:** RPT-007

**Preconditions:**

- Transactions across multiple vendors

**Steps:**

1. Open Spending Trends, Vendor Concentration category filter = All (default)

**Expected Result:**

- Top 10 vendors by total spend across all categories shown

---

### FUT-007: RPT-007 uncategorized spend decreasing

**Covers:** RPT-007

**Preconditions:**

- Jan: 20 uncategorized transactions ($500)
- Feb: 10 uncategorized transactions ($200)
- Mar: 3 uncategorized transactions ($50)

**Steps:**

1. Open Spending Trends

**Expected Result:**

- Uncategorized chart shows declining bars (amount) and declining line (count)

---

### FUT-008: RPT-007 no uncategorized spend

**Covers:** RPT-007

**Preconditions:**

- All transactions in selected year are categorized

**Steps:**

1. Open Spending Trends

**Expected Result:**

- Uncategorized chart shows zero values across all months

---

### FUT-009: RPT-007 empty state (no data for selected year)

**Covers:** RPT-007

**Preconditions:**

- Year 2023 selected, no transaction data exists for 2023

**Steps:**

1. Select 2023 from year dropdown

**Expected Result:**

- All charts show "No data available" placeholder
- KPI values show 0
- Layout does not shift

---

### FUT-010: RPT-012 full year surplus

**Covers:** RPT-012

**Preconditions:**

- 12 months of data, every month has `totalIncome > totalActualSpend`

**Steps:**

1. Open Income vs Expenses, select year

**Expected Result:**

- KPI "Net Surplus/Deficit" is positive, green
- All bars in Surplus/Deficit chart are green
- Savings rate line above 0% for all months
- Avg Savings Rate is positive, green

---

### FUT-011: RPT-012 mixed surplus and deficit months

**Covers:** RPT-012

**Preconditions:**

- Some months have income > expenses, others have expenses > income

**Steps:**

1. Open Income vs Expenses

**Expected Result:**

- Surplus/Deficit chart shows mix of green and red bars
- Net line in combo chart crosses zero
- Savings rate line dips below 0% for deficit months

---

### FUT-012: RPT-012 zero income month

**Covers:** RPT-012

**Preconditions:**

- One month has no Income Entry records, transactions exist for that month

**Steps:**

1. Open Income vs Expenses

**Expected Result:**

- That month shows income = 0, expenses = actual spend, deficit = negative (red)
- Savings rate = 0% for that month (BR-16)
- Avg Savings Rate includes the 0% month in the mean calculation

---

### FUT-013: RPT-012 income breakdown by source type

**Covers:** RPT-012

**Preconditions:**

- Income entries with mix of Salary, Bonus, and Churn Reward for selected year

**Steps:**

1. Open Income vs Expenses

**Expected Result:**

- Donut chart shows three segments proportional to YTD amounts per source type
- Tooltip shows source name + amount + percentage

---

### FUT-014: RPT-012 partial year

**Covers:** RPT-012

**Preconditions:**

- Current year with 4 months of data

**Steps:**

1. Open Income vs Expenses, year defaults to current year

**Expected Result:**

- All charts show 4 months
- Avg Savings Rate divides by 4
- No future months rendered

---

### FUT-015: RPT-012 empty state

**Covers:** RPT-012

**Preconditions:**

- No data for selected year

**Steps:**

1. Select year with no data

**Expected Result:**

- All charts show "No data available"
- KPIs show 0
- Layout does not shift

---

### FUT-016: Year selector population (both dashboards)

**Covers:** RPT-007, RPT-012

**Preconditions:**

- Transaction data exists for 2023, 2024, 2025

**Steps:**

1. Open either dashboard, click year dropdown

**Expected Result:**

- Dropdown shows 2023, 2024, 2025
- Default = current year (or most recent with data if current year has none)

---

## 9. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-05 (Budget Pipeline) | Both dashboards consume ENH-007 output exclusively. All business rules for transaction inclusion, category rollup, and budget formula are defined in SPEC-05. No amendments to SPEC-05 required — the CDS function wraps existing ENH-007 logic. |
| SPEC-02 (Transaction Processing) | Vendor concentration (RPT-007 §4.1 Section 6) joins Transactions to Vendor entities created by ENH-001 categorization. |
| SPEC-06 (Reference Data & Seed) | Purchase Type hierarchy (top-level + subtypes), Income Source Type seeds, and Budget Allocation structure are defined in SPEC-06. |
| SPEC-20 (Monthly Budget Dashboard) | RPT-002 shows current-month budget detail. RPT-007 and RPT-012 show multi-month trends. No overlap — different time scopes, same ENH-007 engine. No cross-navigation. |

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects RPT-007, RPT-012 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-170–D-176 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md).*
