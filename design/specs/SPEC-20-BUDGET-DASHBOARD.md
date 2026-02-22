# SPEC-20: Budget Dashboard

**Spec ID:** SPEC-20
**Name:** Budget Dashboard
**FRICEW Objects:** RPT-002
**Wave(s):** Wave 1 (W1-S5), Wave 2 (W2-S1)
**CDS Service(s):** BudgetService
**App:** `app/budget-dashboard/`
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-20 | Sandro & Claude | Initial creation — SPEC-20 workshop complete. D-224 through D-229 logged. |

---

## 2. Overview

The Budget Dashboard is the primary budget screen — the single view that answers "am I on track this month?" It consumes ENH-007 (Budget Engine) output and aggregates spend, income, goal, and categorization data into a month-scoped, 8-section freestyle dashboard. Sections cover budget health, category breakdown, spend distribution, vendor concentration, uncategorized transactions, goal progress, and alerts. Five UX enhancements provide forward-looking intelligence: burn rate/pace, projected month-end spend, days remaining, previous month comparison, and no-income warning.

Key decisions: D-224 (layout), D-225 (hero KPI), D-226 (no wave split), D-227 (budget-eligible filter), D-228 (top spending subtypes), D-229 (UX enhancements).

---

## 3. Data Model References

| Entity | Role |
|--------|------|
| Transaction | Spend data aggregated per category/card/vendor/month |
| Transaction Split | Split transactions use my_share_amount for budget |
| Income Entry | Monthly income driving the budget formula |
| Goal | Active goals with monthly allocations deducted from income |
| Budget Allocation | Per-purchase-type ratio (must sum to 100%) |
| Purchase Type | Budget category hierarchy (parent/child subtypes) |
| Recurrent Expense | Expected recurring amounts per category (informational) |
| Card Instance | Card identity for CC Spend by Card section |
| Market Card | Card product metadata — issuer for color mapping |
| Issuer | Issuer identity — domain-mapped chart colors (SPEC-19 §4.1.13) |
| Vendor | Vendor identity for Top Vendors section |
| Alert | Stored alerts filtered to budget-related types |
| Alert Type | Alert type definitions for filtering and display |
| System Config | BUDGET_WARNING_THRESHOLD_PCT (default 80%) |

No DM-001 amendments required. This spec is a read-only consumer of existing entities and engines.

---

## 4. Functional Description

### 4.1 RPT-002 — Budget Dashboard [Report]

Freestyle dashboard using `sap.f.GridContainer` with 2-column base grid per DS-001. Page title: "Budget Dashboard". Month selector top-left, defaults to current calendar month on load. Format: "Month YYYY" (e.g., "March 2026").

#### 4.1.1 Dashboard Layout

| Row | Left (half) | Right (half) |
|-----|-------------|--------------|
| 1 | Budget Overview Hero KPI (full-width) | — |
| 2 | Spending vs Budget by Category (full-width) | — |
| 3 | CC Spend by Card | Top Spending Subtypes |
| 4 | Top Vendors | Uncategorized |
| 5 | Goal Progress (full-width) | — |
| 6 | Alerts (full-width) | — |

Ordering logic: headline → active work → analysis → goals → actions.

All sections except Alerts recompute on page load and when the month selector changes. Alerts are month-independent — they show all unacknowledged budget alerts regardless of selected month.

Month selector range: earliest month with data through current month. Future months not available.

#### 4.1.2 Empty State

When no income entries and no transactions exist, the dashboard shows a single message: "Set up your income to get started" with navigation to FRM-007 (Income Entry). No dashboard sections are rendered.

#### 4.1.3 No-Income Warning

When the selected month has no income entry but other data exists, a warning banner displays: "No income set for [Month YYYY] — budget cannot be calculated" with action link to FRM-007. Spend sections (CC Spend, Top Subtypes, Top Vendors, Uncategorized) still render. Budget/remaining/status figures show "N/A".

#### 4.1.4 Budget Overview Hero KPI

Full-width card. Consumes ENH-007 output for the selected month.

| Element | Content |
|---------|---------|
| Primary number | Total Remaining = totalBudget − totalActualSpend |
| Semantic color | Success (green) if ≥ 0, Error (red) if negative |
| Subtitle | "Budget: $X,XXX \| Spent: $X,XXX" |
| Secondary line | "Income: $X,XXX − Goals: $X,XXX = Budget: $X,XXX" |
| Burn rate | "Spending $X/day vs $X/day pace" with semantic color |
| Days remaining | "X days remaining" (current month only, hidden for past months) |
| Projected | "Projected: $X,XXX by month end" with semantic color (current month only, shows actual for past months) |
| Trend indicator | MoM delta on total spend vs previous month, up/down arrow with amount. Hidden if selected month is the earliest month with data. |

Burn rate computation: daily actual = totalActualSpend ÷ days elapsed; daily pace = totalBudget ÷ days in month. Semantic color: Success (green) if daily actual < daily pace, Warning (orange) if within 10% of pace, Error (red) if over pace.

Projected month-end: (totalActualSpend ÷ days elapsed) × days in month. Success (green) if projected ≤ totalBudget, Error (red) if projected > totalBudget.

#### 4.1.5 Spending vs Budget by Category

Full-width table. Consumes ENH-007 per-category breakdown.

| Column | Content | Width |
|--------|---------|-------|
| Category | Purchase type name (link → FRM-001 filtered to type + month) | 16% |
| Status | ObjectStatus (on_track = Success, warning = Warning, over_budget = Error) | 8% |
| Budgeted | Dollar amount (totalBudget × ratio) | 10% |
| Spent | Actual dollar amount | 10% |
| Prev Month | Previous month's actual for same category. "—" if no data. | 10% |
| Progress | `sap.m.ProgressIndicator` (actual / budgeted), color matches status | 16% |
| Remaining | Dollars left (budgeted − actual). Negative shown in red. | 10% |
| Recurrents | Expected recurrent amount (informational, greyed out) | 10% |
| Ratio | Allocation percentage | 10% |

Sorted by status severity descending (over_budget first, then warning, then on_track), then by spent descending within each group.

Over-budget categories show full ProgressIndicator bar in Error state.

#### 4.1.6 CC Spend by Card

Half-width card. Horizontal bar chart showing monthly spend per card for the selected month.

- Top 5 cards by spend, sorted descending. Budget-eligible transactions only.
- Bars colored by issuer using domain-mapped issuer colors (SPEC-19 §4.1.13).
- Card subtitle: "Total: $X,XXX".
- VizFrame with default tooltip interaction.

#### 4.1.7 Top Spending Subtypes

Half-width card. Horizontal bar chart showing spend by purchase subtype for the selected month.

- Top 10 subtypes by spend, sorted descending. Budget-eligible transactions only.
- Subtypes displayed as "Parent > Subtype". Transactions with top-level type but no subtype show parent name alone.
- Card subtitle: "Total: $X,XXX".
- VizFrame with default tooltip interaction.

#### 4.1.8 Top Vendors

Half-width card. Horizontal bar chart showing spend by vendor for the selected month.

- Top 10 vendors by spend, sorted descending. Budget-eligible transactions only.
- Card subtitle: "X vendors this month".
- VizFrame with default tooltip interaction.

#### 4.1.9 Uncategorized

Half-width KPI card. Consumes ENH-007 `uncategorized` output.

| Element | Content |
|---------|---------|
| Primary number | Uncategorized amount ($X,XXX) |
| Semantic color | Warning (orange) if > 0, Success (green) if 0 |
| Subtitle | "X transactions" (count) |
| Action link | "Review in Transaction Manager" → FRM-001 filtered to uncategorized + selected month |

#### 4.1.10 Goal Progress

Full-width table. Shows active goals only (status = active). Completed and cancelled goals excluded.

| Column | Content | Width |
|--------|---------|-------|
| Goal | Goal name (link → FRM-008 goal detail) | 18% |
| Direction | "Saving" or "Spending" | 8% |
| Target | Target amount | 10% |
| Allocated | monthly_allocation × months elapsed since start_date | 12% |
| Progress | `sap.m.ProgressIndicator` (allocated / target_amount) | 16% |
| Status | ObjectStatus per SPEC-09: Ahead = Success, On Track = Information, Behind = Warning | 10% |
| Target Date | Date if set, "—" if open-ended | 10% |
| Monthly | Monthly allocation amount | 8% |

Open-ended goals (no target_date) show status as "Active" with Information (blue) ObjectStatus.

Sorted by status severity: Behind first, then On Track, then Ahead, then Active (open-ended).

Card subtitle: "Monthly Allocations: $X,XXX" (sum of all active goal monthly_allocation values).

#### 4.1.11 Alerts

Full-width table. Shows unacknowledged alerts of **budget-related types only**: budget_category_warning, budget_category_overspend, budget_overspend, budget_goals_exceed_income. Month-independent.

| Column | Content | Width |
|--------|---------|-------|
| Type | Alert type icon + label | 15% |
| Message | Alert description text | 35% |
| Related Category | Purchase type name if applicable | 20% |
| Date | Alert generation date | 15% |
| Action | Contextual action button | 15% |

Sorted by date descending (newest first).

**Contextual actions per alert type:**

| Alert Type | Action Label | Navigation |
|------------|-------------|------------|
| budget_category_warning | View Transactions | FRM-001 filtered to purchase type + current month |
| budget_category_overspend | View Transactions | FRM-001 filtered to purchase type + current month |
| budget_overspend | View Transactions | FRM-001 filtered to current month |
| budget_goals_exceed_income | Manage Goals | FRM-008 |
| (default) | Dismiss | Marks alert acknowledged |

All alert types also have Dismiss as a secondary action.

#### 4.1.12 Cross-Navigation

| Source Element | Target |
|----------------|--------|
| Category name (Spending vs Budget table) | FRM-001 Transaction Manager filtered to purchase type + month |
| Goal name (Goal Progress table) | FRM-008 Goals → goal detail |
| Uncategorized action link | FRM-001 Transaction Manager filtered to uncategorized + month |
| Alert row contextual action | Per alert type (see §4.1.11) |

No chart click-through navigation per D-61 (VizFrame default interactions only).

---

## 5. Business Rules

### Dashboard Scope & Layout

- **BR-01:** The Budget Dashboard displays data scoped to a calendar month selected via the month selector.
- **BR-02:** The month selector defaults to the current month on page load. Format: "Month YYYY".
- **BR-03:** Month selector range: earliest month with data through current month. Future months not available.
- **BR-04:** All sections except Alerts recompute when the month selector changes.
- **BR-05:** Page title is "Budget Dashboard" with month selector positioned top-left.
- **BR-06:** Empty state: when no income entries and no transactions exist, show "Set up your income to get started" with navigation to FRM-007. No dashboard sections rendered.
- **BR-07:** No-income warning: if the selected month has no income entry but other data exists, show a warning banner with action link to FRM-007. Spend sections still render; budget/remaining/status figures show "N/A".

### Budget Overview Hero KPI

- **BR-08:** Full-width hero card consuming ENH-007 output for the selected month.
- **BR-09:** Primary number: Total Remaining (totalBudget − totalActualSpend). Success (green) if ≥ 0, Error (red) if negative.
- **BR-10:** Subtitle: "Budget: $X,XXX | Spent: $X,XXX".
- **BR-11:** Secondary line showing budget formula: "Income: $X,XXX − Goals: $X,XXX = Budget: $X,XXX".
- **BR-12:** Burn rate: "Spending $X/day vs $X/day pace". Daily actual = totalActualSpend ÷ days elapsed. Daily pace = totalBudget ÷ days in month.
- **BR-13:** Burn rate semantic color: Success (green) if daily actual < daily pace, Warning (orange) if within 10% of pace, Error (red) if over pace.
- **BR-14:** Days remaining: "X days remaining" displayed on the hero card. Hidden for past months.
- **BR-15:** Projected month-end spend: (totalActualSpend ÷ days elapsed) × days in month. Success (green) if projected ≤ totalBudget, Error (red) if projected > totalBudget. For past months, shows actual total.
- **BR-16:** Month-over-month trend: delta on total spend vs previous month, with up/down arrow and amount. Hidden if selected month is the earliest month with data.

### Spending vs Budget by Category

- **BR-17:** Full-width table showing ENH-007 per-category breakdown for the selected month.
- **BR-18:** Columns: Category, Status, Budgeted, Spent, Prev Month, Progress, Remaining, Recurrents, Ratio.
- **BR-19:** Status coloring: on_track = Success (green), warning = Warning (orange), over_budget = Error (red).
- **BR-20:** Sorted by status severity descending (over_budget first, then warning, then on_track), then by spent descending within each group.
- **BR-21:** ProgressIndicator shows actual ÷ budgeted. Over-budget categories show full bar in Error state.
- **BR-22:** Prev Month column shows previous month's actual spend for the same category. "—" if no previous month data exists.
- **BR-23:** Recurrents column shows expected recurrent expense amount per category (informational only, from ENH-007).
- **BR-24:** Clicking a category name navigates to FRM-001 filtered to that purchase type + selected month.

### CC Spend by Card

- **BR-25:** Half-width horizontal bar chart showing monthly spend per card for the selected month.
- **BR-26:** Top 5 cards by spend, sorted descending. Budget-eligible transactions only.
- **BR-27:** Bars colored by issuer using domain-mapped issuer colors (SPEC-19 §4.1.13).
- **BR-28:** Card subtitle shows total: "Total: $X,XXX".

### Top Spending Subtypes

- **BR-29:** Half-width horizontal bar chart showing spend by purchase subtype for the selected month.
- **BR-30:** Top 10 subtypes by spend, sorted descending. Budget-eligible transactions only.
- **BR-31:** Subtypes displayed as "Parent > Subtype". Transactions with top-level type but no subtype show parent name alone.
- **BR-32:** Card subtitle shows total: "Total: $X,XXX".

### Top Vendors

- **BR-33:** Half-width horizontal bar chart showing spend by vendor for the selected month.
- **BR-34:** Top 10 vendors by spend, sorted descending. Budget-eligible transactions only.
- **BR-35:** Card subtitle shows vendor count: "X vendors this month".

### Uncategorized

- **BR-36:** Half-width KPI card showing uncategorized transaction total from ENH-007.
- **BR-37:** Primary number: uncategorized amount. Warning (orange) if > 0, Success (green) if 0.
- **BR-38:** Subtitle: "X transactions" (count of uncategorized transactions).
- **BR-39:** Action link "Review in Transaction Manager" navigates to FRM-001 filtered to uncategorized + selected month.

### Goal Progress

- **BR-40:** Full-width table showing active goals only (status = active). Completed and cancelled goals excluded.
- **BR-41:** Columns: Goal, Direction, Target, Allocated, Progress, Status, Target Date, Monthly.
- **BR-42:** Allocated = monthly_allocation × months elapsed since goal start_date.
- **BR-43:** Progress: ProgressIndicator showing allocated ÷ target_amount.
- **BR-44:** Status per SPEC-09: Ahead = Success (green), On Track = Information (blue), Behind = Warning (orange).
- **BR-45:** Open-ended goals (no target_date) show status as "Active" with Information (blue) ObjectStatus.
- **BR-46:** Sorted by status severity: Behind first, then On Track, then Ahead, then Active (open-ended).
- **BR-47:** Card subtitle: "Monthly Allocations: $X,XXX" (sum of all active goal monthly_allocation values).
- **BR-48:** Clicking a goal name navigates to FRM-008 goal detail.

### Alerts

- **BR-49:** Full-width table showing unacknowledged alerts of budget-related types only: budget_category_warning, budget_category_overspend, budget_overspend, budget_goals_exceed_income.
- **BR-50:** Columns: Type (icon + label), Message, Related Category, Date, Action.
- **BR-51:** Sorted by date descending (newest first).
- **BR-52:** Month-independent — shows all unacknowledged budget alerts regardless of selected month.
- **BR-53:** Contextual actions: budget_category_warning and budget_category_overspend → "View Transactions" → FRM-001 filtered to purchase type + current month. budget_overspend → "View Transactions" → FRM-001 filtered to current month. budget_goals_exceed_income → "Manage Goals" → FRM-008.
- **BR-54:** All alert types have Dismiss as secondary action. Dismissing marks the alert as acknowledged.

### General

- **BR-55:** No chart click-through navigation. VizFrame default tooltip interactions only per D-61.
- **BR-56:** Each section fails independently — a failure in one computation does not prevent other sections from rendering.
- **BR-57:** Budget-eligible transactions per SPEC-05 BR-09: posted in selected month, is_excluded = false, goal_id IS NULL, purchase type not excluded_from_budget, split transactions use my_share_amount, fully reimbursed excluded.

---

## 6. Error Handling

| Condition | Response | i18n Key |
|-----------|----------|----------|
| ENH-007 computation fails | Hero KPI and category table show "Unable to calculate budget" | `budgetDashboard.error.budgetUnavailable` |
| Goal data query fails | Goal Progress shows "Unable to load goal data" | `budgetDashboard.error.goalsUnavailable` |
| Alert query fails | Alerts section shows "Unable to load alerts" | `budgetDashboard.error.alertsUnavailable` |
| No transactions in selected month | Month-scoped sections show "No spending data for [Month YYYY]" | `budgetDashboard.info.noDataForMonth` |
| No income and no transactions exist | Full-page empty state with FRM-007 link | `budgetDashboard.info.noIncome` |
| No income for selected month | Warning banner with FRM-007 action link | `budgetDashboard.warn.noIncomeForMonth` |

Each section fails independently — a failure in one engine does not prevent other sections from rendering.

---

## 7. Open Items

| OI | Status | Resolution |
|----|--------|------------|
| OI-06 | Incremental | RPT-002 does not generate alerts. It consumes and displays budget-related alerts generated by SPEC-05 (ENH-007) and SPEC-09 (goal alerts). |

---

## 8. Functional Unit Tests

### FUT-001: Dashboard loads with current month default

**Covers:** RPT-002

**Preconditions:**

- Income and transactions exist for February and March 2026.

**Steps:**

1. Navigate to Budget Dashboard.

**Expected Result:**

- Month selector shows "March 2026" (current month). All sections display March data.

---

### FUT-002: Month selector change refreshes all sections

**Covers:** RPT-002

**Preconditions:**

- Income and transactions exist for February and March 2026.

**Steps:**

1. Navigate to Budget Dashboard.
2. Change month selector to "February 2026".

**Expected Result:**

- Hero KPI, Spending vs Budget, CC Spend, Top Subtypes, Top Vendors, Uncategorized, Goal Progress all update to February data. Alerts remain unchanged (month-independent).

---

### FUT-003: Month selector excludes future months

**Covers:** RPT-002

**Preconditions:**

- Current date is March 15, 2026. Data exists from January 2026.

**Steps:**

1. Open month selector dropdown.

**Expected Result:**

- Available months: January 2026, February 2026, March 2026. April 2026 and beyond not available.

---

### FUT-004: Empty state on first use

**Covers:** RPT-002

**Preconditions:**

- No income entries and no transactions exist.

**Steps:**

1. Navigate to Budget Dashboard.

**Expected Result:**

- Single message "Set up your income to get started" with navigation link to FRM-007. No dashboard sections visible.

---

### FUT-005: No-income warning banner

**Covers:** RPT-002

**Preconditions:**

- Transactions exist for March 2026 but no income entry for March. Income exists for February.

**Steps:**

1. Navigate to Budget Dashboard (defaults to March).

**Expected Result:**

- Warning banner: "No income set for March 2026 — budget cannot be calculated" with action link to FRM-007. CC Spend, Top Subtypes, Top Vendors, Uncategorized still display spend data. Budget/remaining/status figures show "N/A".

---

### FUT-006: Hero KPI positive remaining

**Covers:** RPT-002, ENH-007

**Preconditions:**

- March 2026: totalBudget $4,000, totalActualSpend $2,500.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Primary number "$1,500" in Success (green). Subtitle: "Budget: $4,000 | Spent: $2,500".

---

### FUT-007: Hero KPI negative remaining

**Covers:** RPT-002, ENH-007

**Preconditions:**

- March 2026: totalBudget $3,000, totalActualSpend $3,400.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Primary number "-$400" in Error (red). Subtitle: "Budget: $3,000 | Spent: $3,400".

---

### FUT-008: Budget formula secondary line

**Covers:** RPT-002, ENH-007

**Preconditions:**

- March 2026: totalIncome $5,000, totalGoalAllocations $1,000, totalBudget $4,000.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Secondary line: "Income: $5,000 − Goals: $1,000 = Budget: $4,000".

---

### FUT-009: Burn rate under pace

**Covers:** RPT-002

**Preconditions:**

- March 2026, day 15 (15 days elapsed, 31 days in month). totalBudget $3,100, totalActualSpend $1,200.

**Steps:**

1. View hero KPI burn rate.

**Expected Result:**

- "Spending $80/day vs $100/day pace" in Success (green).

---

### FUT-010: Burn rate over pace

**Covers:** RPT-002

**Preconditions:**

- March 2026, day 10. totalBudget $3,100, totalActualSpend $1,500.

**Steps:**

1. View hero KPI burn rate.

**Expected Result:**

- "Spending $150/day vs $100/day pace" in Error (red).

---

### FUT-011: Projected month-end spend over budget

**Covers:** RPT-002

**Preconditions:**

- March 2026, day 10. totalBudget $3,100, totalActualSpend $1,500.

**Steps:**

1. View hero KPI projection.

**Expected Result:**

- "Projected: $4,650 by month end" in Error (red). Projection = (1500 ÷ 10) × 31 = $4,650.

---

### FUT-012: Projected shows actual for past months

**Covers:** RPT-002

**Preconditions:**

- Current month is March 2026. February 2026 totalActualSpend was $2,800.

**Steps:**

1. Select February 2026 in month selector.
2. View hero KPI.

**Expected Result:**

- Projection line shows actual total "$2,800" (not a projection). Days remaining not shown.

---

### FUT-013: MoM trend indicator

**Covers:** RPT-002

**Preconditions:**

- March 2026 totalActualSpend $2,500. February 2026 totalActualSpend $2,200.

**Steps:**

1. View hero KPI trend.

**Expected Result:**

- Trend shows up arrow with "+$300" (spending increased vs previous month).

---

### FUT-014: MoM trend hidden for earliest month

**Covers:** RPT-002

**Preconditions:**

- Earliest month with data is January 2026. Month selector set to January.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Trend indicator not displayed.

---

### FUT-015: Category table sorted by severity

**Covers:** RPT-002, ENH-007

**Preconditions:**

- March 2026: Dining = over_budget, Transportation = warning, Groceries = on_track.

**Steps:**

1. View Spending vs Budget table.

**Expected Result:**

- Dining appears first (red), Transportation second (orange), Groceries third (green).

---

### FUT-016: Over-budget category progress bar

**Covers:** RPT-002, ENH-007

**Preconditions:**

- Dining: budgeted $400, actual $520.

**Steps:**

1. View Dining row in Spending vs Budget table.

**Expected Result:**

- ProgressIndicator shows full bar in Error (red) state. Remaining shows "-$120" in red.

---

### FUT-017: Previous month comparison column

**Covers:** RPT-002

**Preconditions:**

- March 2026 Dining actual $450. February 2026 Dining actual $380.

**Steps:**

1. View Spending vs Budget table for March.

**Expected Result:**

- Dining row Prev Month column shows "$380".

---

### FUT-018: Previous month column with no prior data

**Covers:** RPT-002

**Preconditions:**

- January 2026 is the earliest month with data. Month selector set to January.

**Steps:**

1. View Spending vs Budget table.

**Expected Result:**

- Prev Month column shows "—" for all categories.

---

### FUT-019: Category click navigates to Transaction Manager

**Covers:** RPT-002

**Preconditions:**

- Spending vs Budget table visible with Dining category.

**Steps:**

1. Click "Dining" category name.

**Expected Result:**

- Navigates to FRM-001 filtered to Dining purchase type + selected month.

---

### FUT-020: CC Spend top 5 with issuer colors

**Covers:** RPT-002

**Preconditions:**

- 7 cards with budget-eligible spend in March 2026. TD Aeroplan highest, Amex Cobalt second.

**Steps:**

1. View CC Spend by Card chart.

**Expected Result:**

- 5 bars shown, sorted descending. TD Aeroplan bar in green (TD color), Amex Cobalt in blue (Amex color). Cards 6 and 7 not shown. Subtitle shows "Total: $X,XXX".

---

### FUT-021: Top Subtypes display format

**Covers:** RPT-002

**Preconditions:**

- March transactions include: Dining > Restaurants $450, Dining > Fast Food $120, Groceries $380 (no subtype).

**Steps:**

1. View Top Spending Subtypes chart.

**Expected Result:**

- Bars labeled "Dining > Restaurants", "Dining > Fast Food", "Groceries" (parent alone, no subtype). Sorted by spend descending.

---

### FUT-022: Top Vendors budget-eligible only

**Covers:** RPT-002

**Preconditions:**

- March has 15 vendors. Vendor A has $200 in budget-eligible spend and $100 in goal-linked spend. Vendor B has only goal-linked spend ($300).

**Steps:**

1. View Top Vendors chart.

**Expected Result:**

- Vendor A shows $200 (goal-linked excluded). Vendor B not shown (no budget-eligible spend). Subtitle: "14 vendors this month" (Vendor B excluded from count).

---

### FUT-023: Uncategorized warning state

**Covers:** RPT-002, ENH-007

**Preconditions:**

- March 2026: 3 uncategorized transactions totalling $185.

**Steps:**

1. View Uncategorized card.

**Expected Result:**

- "$185" in Warning (orange). Subtitle: "3 transactions". Action link "Review in Transaction Manager" visible.

---

### FUT-024: Uncategorized clear state

**Covers:** RPT-002, ENH-007

**Preconditions:**

- March 2026: 0 uncategorized transactions.

**Steps:**

1. View Uncategorized card.

**Expected Result:**

- "$0" in Success (green). Subtitle: "0 transactions".

---

### FUT-025: Goal Progress shows active goals only

**Covers:** RPT-002, FRM-008

**Preconditions:**

- Goal A (active, saving, target $5,000). Goal B (completed). Goal C (cancelled).

**Steps:**

1. View Goal Progress table.

**Expected Result:**

- Only Goal A shown. Goals B and C excluded.

---

### FUT-026: Goal progress with target date — On Track status

**Covers:** RPT-002, FRM-008

**Preconditions:**

- Goal A: saving, target $6,000, monthly allocation $500, started Jan 2026, target date Dec 2026. Current month March (3 months elapsed). Allocated = $1,500.

**Steps:**

1. View Goal Progress table.

**Expected Result:**

- Goal A: Allocated $1,500, Progress 25% (1500 ÷ 6000), Status "On Track" in Information (blue).

---

### FUT-027: Open-ended goal shows Active status

**Covers:** RPT-002, FRM-008

**Preconditions:**

- Goal A: saving, target $10,000, monthly allocation $300, no target_date.

**Steps:**

1. View Goal Progress table.

**Expected Result:**

- Goal A: Status "Active" in Information (blue). Target Date column shows "—".

---

### FUT-028: Goal Progress sorted by severity

**Covers:** RPT-002, FRM-008

**Preconditions:**

- Goal A: Behind. Goal B: On Track. Goal C: Ahead. Goal D: Active (open-ended).

**Steps:**

1. View Goal Progress table.

**Expected Result:**

- Order: Goal A (Behind/orange), Goal B (On Track/blue), Goal C (Ahead/green), Goal D (Active/blue).

---

### FUT-029: Goal Progress subtitle shows total allocations

**Covers:** RPT-002, FRM-008

**Preconditions:**

- Goal A monthly allocation $500. Goal B monthly allocation $300.

**Steps:**

1. View Goal Progress card subtitle.

**Expected Result:**

- "Monthly Allocations: $800".

---

### FUT-030: Goal name navigates to detail

**Covers:** RPT-002, FRM-008

**Preconditions:**

- Goal Progress table visible with Goal A.

**Steps:**

1. Click "Goal A" name.

**Expected Result:**

- Navigates to FRM-008 goal detail for Goal A.

---

### FUT-031: Alerts show budget-only types

**Covers:** RPT-002

**Preconditions:**

- 2 unacknowledged alerts: budget_category_overspend (budget), af_approaching (churning).

**Steps:**

1. View Alerts section.

**Expected Result:**

- Only budget_category_overspend alert shown. af_approaching not displayed.

---

### FUT-032: Alert contextual action — View Transactions

**Covers:** RPT-002

**Preconditions:**

- Unacknowledged budget_category_overspend alert for Dining.

**Steps:**

1. Click "View Transactions" action on the alert row.

**Expected Result:**

- Navigates to FRM-001 filtered to Dining purchase type + current month.

---

### FUT-033: Alert contextual action — Manage Goals

**Covers:** RPT-002

**Preconditions:**

- Unacknowledged budget_goals_exceed_income alert.

**Steps:**

1. Click "Manage Goals" action on the alert row.

**Expected Result:**

- Navigates to FRM-008 Goals.

---

### FUT-034: Alert dismiss

**Covers:** RPT-002

**Preconditions:**

- Unacknowledged budget alert visible.

**Steps:**

1. Click "Dismiss" action.

**Expected Result:**

- Alert marked as acknowledged and removed from the table.

---

### FUT-035: Alerts month-independent

**Covers:** RPT-002

**Preconditions:**

- Unacknowledged budget_category_warning alert generated in February. Month selector set to March.

**Steps:**

1. View Alerts section.

**Expected Result:**

- February alert still visible (not filtered by selected month).

---

### FUT-036: Section independent failure

**Covers:** RPT-002

**Preconditions:**

- ENH-007 computation succeeds but goal data query fails.

**Steps:**

1. Navigate to Budget Dashboard.

**Expected Result:**

- Hero KPI, Spending vs Budget, CC Spend, Subtypes, Vendors, Uncategorized, Alerts all render normally. Goal Progress shows "Unable to load goal data".

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) (RPT-002), [Data Model](../DATA_MODEL.md), [Design System](../DESIGN_SYSTEM.md) (D-56 through D-62), and [Decisions Log](../user-profile/DECISIONS_LOG.md) (D-224 through D-229). Consumes ENH-007 from [SPEC-05](SPEC-05-BUDGET-PIPELINE.md). Goal data from [SPEC-09](SPEC-09-GOALS.md). Alert types from [SPEC-05](SPEC-05-BUDGET-PIPELINE.md) and [SPEC-09](SPEC-09-GOALS.md). Issuer colors from [SPEC-19](SPEC-19-CHURNBOARD.md) (§4.1.13).*
