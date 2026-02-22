# SPEC-11: Churning Analytics

**Spec ID:** SPEC-11
**Name:** Churning Analytics
**FRICEW Objects:** RPT-008, RPT-009, RPT-010
**Wave:** 3
**Sprint:** W3-S2
**CDS Services:** ChurningService
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-165 through D-169 logged. |

---

## 2. Overview

SPEC-11 covers three churning-focused analytical reports in the "Churning — Analytics" navigation group, all Wave 3 leaf nodes.

**RPT-008 (Soft Perk Tracker)** is a freestyle dashboard providing a centralized cross-card view of soft perks — lounge passes, travel credits, portal rebates, insurance, and status perks. Shows current-period usage and remaining value across all active cards, grouped by perk type, with KPIs for unrealized value and expiring perks.

**RPT-009 (Annual Churning Summary)** is a freestyle dashboard presenting a calendar-year-in-review of churning performance: cards opened/closed, total net value, best/worst cards by profitability, average earning yield, bonus scorecard, points summary, and monthly trend. Consumes ENH-005 (Card Profitability), ENH-003 (Signup Bonus Tracker), and ENH-006 (Points Balance & Valuation).

**RPT-010 (Points Program Dashboard)** is a Fiori Elements list report + object page (D-167, pattern changed from freestyle) providing a per-program view of points balances, earning history, redemption history, transfers, and contributing cards. Includes Transfer Points and Manual Adjustment actions for program-to-program transfers and standalone balance corrections.

Key decisions: D-21 (soft perks), D-23 (realized/unrealized), D-09 (CPP valuation), D-10 (redemption tracking), D-130 (dual aggregation), PSV Problem 2 (churning performance), D-165 (perk tracker layout), D-166 (annual summary metrics), D-167 (RPT-010 pattern change), D-168 (Points Transfer entity), D-169 (RPT-010 actions).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Card Perk | Per-card perk usage tracking (quantity, dollar value) | §4.7 | — |
| Soft Perk Definition | Market Card perk definitions (type, value, reset) | §4.6 | — |
| Perk Type | Perk classification (lounge_pass, travel_credit, etc.) | §3.9 | — |
| Card Instance | Card lifecycle state, activation/closed dates | §4.4 | — |
| Rewards Program | Program name, currency, CPP valuation | §3.2 | — |
| Points Adjustment | Point movements (bonuses, transfers, corrections) | §5.3 | — |
| Redemption | Points spent for dollar value | §5.4 | — |
| Adjustment Type | Classification of point adjustments | §3.10 | — |
| Transaction | Source for spend-based points and profitability | §5.1 | — |
| Earning Multiplier | Card earn rates per category | §4.5 | — |
| Offer Tranche | Bonus structure for ENH-003 | §4.3 | — |
| Market Card | Card product details (fees, rewards program) | §4.1 | — |
| Points Transfer | Atomic program-to-program transfer record | — | Yes — new entity |

### DM-001 Amendments

**1. Points Transfer — new transactional entity (D-168)**

| Attribute | Type | Nullable | Notes |
|-----------|------|----------|-------|
| id | UUID | No | PK |
| from_program_id | UUID | No | FK → Rewards Program (source) |
| to_program_id | UUID | No | FK → Rewards Program (destination) |
| from_amount | Integer | No | Points debited from source |
| to_amount | Integer | No | Points credited to destination (supports non-1:1 ratios) |
| transfer_date | Date | No | When the transfer occurred |
| notes | String(500) | Yes | Optional description |

On save, the system atomically creates two Points Adjustment records:

- Source: `rewards_program_id` = from_program_id, `adjustment_type` = transfer_out, `amount` = -from_amount
- Destination: `rewards_program_id` = to_program_id, `adjustment_type` = transfer_in, `amount` = +to_amount

Both adjustments reference the Points Transfer via description for traceability. `card_instance_id` = null on both (program-level).

**Entity count: 41 → 42.**

---

## 4. Functional Description

### 4.1 RPT-008 — Soft Perk Tracker [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

#### KPI Row (full-width)

| KPI | Computation | Format |
|-----|-------------|--------|
| Total Unrealized Value | Sum of `(dollar_value - dollar_value_realized)` across all eligible perks in current period | Currency (ObjectNumber, Success) |
| Perks Expiring Soon | Count of perks with `period_end` within 30 days of today | Integer (ObjectNumber, Warning when > 0) |

#### Perk Type Sections

One section per perk type that has active perks. Each section is a half-width or full-width card (depending on card count) containing a table:

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Card | Card Instance → Market Card.name | 30% | — |
| Issuer | Market Card → Issuer.short_name | 15% | — |
| Used | Card Perk.quantity_used or dollar_value_realized | 15% | Format depends on perk type |
| Total | Soft Perk Definition.quantity or dollar_value | 15% | Format depends on perk type |
| Remaining | Total − Used | 15% | Semantic color: Warning when < 25% remaining |
| Expires | Card Perk.period_end | 10% | Date format. Warning color when within 30 days. |

**Display format by perk type:**

- Count-based (lounge_pass): "2 of 4" (quantity_used / quantity)
- Dollar-based (travel_credit, portal_rebate): "$73 of $200" (dollar_value_realized / dollar_value)
- Binary (insurance, status): "Active" / "Inactive" (quantity_used > 0)

#### Filters

- **Card Status:** Focus, Active, To Cancel (all selected by default). Closed excluded entirely (BR-01).
- No period selector — always shows current perk period.

### 4.2 RPT-009 — Annual Churning Summary [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

#### Controls

- **Year Selector:** Dropdown listing calendar years with data, default = current year. Position: top-left `sap.m.Bar`.

#### Section 1 — KPI Row (full-width)

| KPI | Computation | Format |
|-----|-------------|--------|
| Total Net Value | Sum of ENH-005 net value for all cards active during year | Currency (green/red semantic) |
| Cards Opened | Count of cards with activation_date in year | Integer |
| Cards Closed | Count of cards with closed_date in year | Integer |
| Average Earning Yield | Total dollar value earned / total spend across all cards for year | Percentage |
| Total Fees Paid | Sum of Annual Fee transactions posted in year | Currency (red semantic) |

#### Section 2 — Best & Worst Cards (full-width)

Two half-width cards side by side:

**Best Cards (top 3):**

| Column | Source | Width |
|--------|--------|-------|
| Card | Market Card.name | 40% |
| Net Value | ENH-005 net value for year | 30% |
| Earning Yield | Card effective earn rate for year | 30% |

**Worst Cards (bottom 3):**

Same columns, sorted ascending by net value.

#### Section 3 — Bonus Scorecard (half-width)

| Metric | Computation |
|--------|-------------|
| Bonuses Completed | Count of tranches with status = met during year |
| Bonuses Missed | Count of tranches with status = missed during year |
| Bonus Value Earned | Sum of bonus_amount × CPP / 100 for met tranches |
| Bonus Value Missed | Sum of bonus_amount × CPP / 100 for missed tranches |

#### Section 4 — Points Summary (half-width)

| Metric | Computation |
|--------|-------------|
| Total Points Earned | Sum of positive Points Adjustments in year (all programs) |
| Total Points Redeemed | Sum of Redemption.points_spent in year |
| Net Balance Change | Earned − Redeemed |
| Dollar Value Change | Net Balance Change valued at current CPP per program |

#### Section 5 — Monthly Trend (full-width)

Line chart (VizFrame) showing monthly net value for the selected year. X-axis: months (Jan–Dec or through current month for partial year). Y-axis: net value ($). One series.

#### Section 6 — Card Ranking Table (full-width)

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Card | Market Card.name | 25% | — |
| Issuer | Issuer.short_name | 10% | — |
| Status | Card Instance.lifecycle_state | 10% | ObjectStatus with semantic color |
| Total Spend | Sum of transaction amounts for card in year | 15% | — |
| Net Value | ENH-005 net value for year | 15% | Green/red semantic |
| Earning Yield | Dollar value earned / total spend | 15% | Percentage |
| Bonuses | Met count / total tranches in year | 10% | e.g., "2/3" |

Default sort: Net Value descending. Table title: "Card Ranking ({count})".

#### Partial Year Behavior

When the selected year is the current year, data is shown through today. Future months are absent from the trend chart. No special "year-to-date" indicator (BR-07).

### 4.3 RPT-010 — Points Program Dashboard [Report]

**Type:** Fiori Elements — List Report + Object Page (D-167)

#### List Report

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Program Name | Rewards Program.name | 20% | — |
| Currency | Rewards Program.currency_name | 10% | — |
| Balance | ENH-006 total_balance | 20% | Integer with currency_name unit |
| CPP | Rewards Program.cpp_valuation | 10% | ¢ format |
| Dollar Value | balance × cpp_valuation / 100 | 20% | Currency formatted |
| Contributing Cards | Count of active Card Instances earning into program | 20% | Integer |

**Default sort:** Dollar Value descending.

**Filter bar:** Collapsed by default. Filter by Program Name.

#### Object Page

**Header:**

- Title: Program name
- Subtitle: Currency name
- ObjectNumber: Current balance with currency_name unit
- Second ObjectNumber: Dollar value (balance × CPP) with semantic color (green ≥ 0)

**Section 1 — Earning History (Collection Facet):**

Reference Facet 1 — Earning History Table:

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Date | Points Adjustment.date | 15% | — |
| Card | Card Instance → Market Card.name | 20% | "—" when card_instance_id is null |
| Type | Adjustment Type.name | 15% | — |
| Amount | Points Adjustment.amount | 15% | Positive green, negative red |
| Description | Points Adjustment.description | 35% | — |

Filter: adjustment_type NOT IN (transfer_in, transfer_out). Transfers shown in Section 3.

Reference Facet 2 — Monthly Earning Trend (Custom Section):

Line chart (VizFrame) showing monthly points earned. X-axis: months. Y-axis: total points. One series aggregating all positive non-transfer adjustments.

**Section 2 — Redemption History (Collection Facet):**

Reference Facet 1 — Redemption Table:

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Date | Redemption.redemption_date | 12% | — |
| Points Spent | Redemption.points_spent | 15% | — |
| Dollar Value | Redemption.dollar_value | 15% | Currency formatted |
| Effective CPP | Redemption.effective_cpp | 13% | ¢ format |
| Type | Redemption → Redemption Type.name | 15% | — |
| Description | Redemption.description | 30% | — |

Reference Facet 2 — Redemption Breakdown (Custom Section):

Donut chart (VizFrame) showing redemption dollar value by Redemption Type.

**Section 3 — Transfers & Adjustments (Collection Facet):**

Reference Facet 1 — Transfers Table:

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Date | Points Transfer.transfer_date | 15% | — |
| Direction | Computed | 10% | "In" / "Out" based on whether this program is source or destination |
| Counterpart | The other program's name | 20% | — |
| Amount Sent | Points Transfer.from_amount | 15% | Shown when this program is source |
| Amount Received | Points Transfer.to_amount | 15% | Shown when this program is destination |
| Ratio | from_amount : to_amount | 10% | e.g., "1:1.25" |
| Notes | Points Transfer.notes | 15% | — |

Reference Facet 2 — Manual Adjustments Table:

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Date | Points Adjustment.date | 15% | — |
| Type | "Credit" / "Debit" | 15% | Based on amount sign |
| Amount | Points Adjustment.amount | 20% | Positive green, negative red |
| Description | Points Adjustment.description | 50% | — |

Filter: adjustment_type = correction only.

**Section 4 — Contributing Cards (Collection Facet):**

Reference Facet — Contributing Cards Table:

| Column | Source | Width | Notes |
|--------|--------|-------|-------|
| Card | Card Instance → Market Card.name | 25% | — |
| Issuer | Issuer.short_name | 15% | — |
| Status | Card Instance.lifecycle_state | 15% | ObjectStatus with semantic color |
| Points Earned | Sum of spend-based + bonus Points Adjustments for this card | 25% | Integer |
| Since | Card Instance.activation_date | 20% | Date format |

#### Actions

| Action | Location | Dialog Fields | Effect |
|--------|----------|---------------|--------|
| **Transfer Points** | Object page toolbar | Destination Program (dropdown), From Amount (integer), To Amount (integer), Date (default today), Notes (optional) | Creates Points Transfer + paired Points Adjustments atomically (D-168). Source program = current page's program. |
| **Manual Adjustment** | Object page toolbar | Amount (signed integer — positive = credit, negative = debit), Date (default today), Description (required) | Creates Points Adjustment with adjustment_type = correction, card_instance_id = null (D-169). |

---

## 5. Business Rules

### RPT-008 — Soft Perk Tracker

| Rule | Description |
|------|-------------|
| BR-01 | Only perks from cards with lifecycle_state in (Focus, Active, To Cancel) are displayed. Closed cards are excluded entirely (D-165). |
| BR-02 | Dashboard shows current perk period only. Historical perk periods are visible on the card object page (FRM-004), not on RPT-008 (D-165). |
| BR-03 | Perk usage displayed as aggregate per period: quantity_used / quantity for count-based, dollar_value_realized / dollar_value for dollar-based (D-165). |
| BR-04 | Sections grouped by perk type (lounge_pass, travel_credit, portal_rebate, insurance, status). Each section lists cards that have that perk with usage/remaining columns (D-165). |
| BR-05 | KPIs: total unrealized dollar value remaining = sum of (dollar_value − dollar_value_realized) across all eligible perks; perks expiring soon = count of perks with period_end within 30 days of today (D-165). |

### RPT-009 — Annual Churning Summary

| Rule | Description |
|------|-------------|
| BR-06 | Year = calendar year (Jan 1 – Dec 31). Year selector lists calendar years with transaction data. Default = current year (D-166). |
| BR-07 | Partial year (current year selected) shows data through today. Future months absent from trend chart. No special year-to-date indicator (D-166). |
| BR-08 | Best/worst card = ranked by ENH-005 net value for the selected calendar year. Top 3 and bottom 3 shown (D-166). |
| BR-09 | Average earning yield = total dollar value earned (all sources) / total spend across all cards for the selected year. Per-card earning yield also computed for ranking (D-166). |
| BR-10 | Cards "active during the year" = activation_date ≤ Dec 31 of selected year AND (closed_date is null OR closed_date ≥ Jan 1 of selected year). Includes Focus, Active, To Cancel, and Closed cards (D-166). |

### RPT-010 — Points Program Dashboard

| Rule | Description |
|------|-------------|
| BR-11 | RPT-010 uses Fiori Elements list report + object page pattern, not freestyle dashboard. Custom sections on object page for charts (D-167). |
| BR-12 | List report dollar value column = balance × cpp_valuation / 100. Computed, not stored (D-167). |
| BR-13 | Contributing Cards count = number of Card Instances with lifecycle_state in (Focus, Active, To Cancel) where Card Instance → Market Card → Rewards Program matches the row's program (D-167). |
| BR-14 | Transfer Points action creates a Points Transfer record and two paired Points Adjustments atomically. Source adjustment: transfer_out with amount = -from_amount. Destination adjustment: transfer_in with amount = +to_amount. Supports non-1:1 ratios (from_amount ≠ to_amount) (D-168). |
| BR-15 | Manual Adjustment action creates a standalone Points Adjustment with adjustment_type = correction, card_instance_id = null. Positive amount = credit (increases balance), negative = debit (decreases balance) (D-169). |
| BR-16 | Earning History table on object page excludes transfer_in and transfer_out adjustments. These appear in the Transfers & Adjustments section instead (D-167). |
| BR-17 | Earning trend chart aggregates positive non-transfer adjustments by month. Redemption breakdown chart groups by Redemption Type (D-167). |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| Transfer: from_amount ≤ 0 | `req.error()` 400 | `churning.transfer.invalidFromAmount` |
| Transfer: to_amount ≤ 0 | `req.error()` 400 | `churning.transfer.invalidToAmount` |
| Transfer: from_program = to_program | `req.error()` 400 | `churning.transfer.sameProgram` |
| Transfer: source program not found | `req.reject()` 404 | `churning.transfer.programNotFound` |
| Manual adjustment: amount = 0 | `req.error()` 400 | `churning.adjustment.zeroAmount` |
| Manual adjustment: description empty | `req.error()` 400 | `churning.adjustment.descriptionRequired` |
| RPT-009: no data for selected year | Standard `noDataText` on all sections | — |
| RPT-008: no active perks | Standard `noDataText` per perk type section | — |

---

## 7. Open Items

None. All design questions resolved during workshop.

---

## 8. Functional Unit Tests

### FUT-001: Perk tracker shows perks from Focus card

**Covers:** RPT-008

**Preconditions:**

- Card A: lifecycle_state = Focus, has lounge_pass perk (quantity = 4, quantity_used = 2, period_end = 3 months from now)

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Lounge Passes section visible
- Card A listed with "2 of 4 used", remaining = 2

---

### FUT-002: Perk tracker excludes Closed card perks

**Covers:** RPT-008

**Preconditions:**

- Card A: lifecycle_state = Active, has travel_credit perk ($200, $73 realized)
- Card B: lifecycle_state = Closed, has travel_credit perk ($200, $0 realized)

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Travel Credits section shows only Card A ("$73 of $200 used")
- Card B not displayed anywhere

---

### FUT-003: KPI — total unrealized dollar value

**Covers:** RPT-008

**Preconditions:**

- Card A: travel_credit ($200, $73 realized) → $127 unrealized
- Card B: portal_rebate ($100, $0 realized) → $100 unrealized

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Total Unrealized Value KPI = $227

---

### FUT-004: KPI — perks expiring within 30 days

**Covers:** RPT-008

**Preconditions:**

- Card A: lounge_pass, period_end = 20 days from now
- Card B: travel_credit, period_end = 60 days from now

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Perks Expiring Soon KPI = 1 (only Card A's perk)

---

### FUT-005: Perk sections grouped by perk type

**Covers:** RPT-008

**Preconditions:**

- Card A: lounge_pass + travel_credit
- Card B: lounge_pass

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Lounge Passes section lists Card A and Card B
- Travel Credits section lists Card A only

---

### FUT-006: Count-based perk display format

**Covers:** RPT-008

**Preconditions:**

- Card A: lounge_pass, quantity = 4, quantity_used = 2

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Lounge Passes section shows Card A: Used = "2", Total = "4", Remaining = "2"

---

### FUT-007: Dollar-based perk display format

**Covers:** RPT-008

**Preconditions:**

- Card A: travel_credit, dollar_value = $200, dollar_value_realized = $73

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Travel Credits section shows Card A: Used = "$73", Total = "$200", Remaining = "$127"

---

### FUT-008: Only current period shown

**Covers:** RPT-008

**Preconditions:**

- Card A: lounge_pass with annual_reset = true
- Current period: 2026-03-15 to 2027-03-14 (quantity_used = 1)
- Prior period: 2025-03-15 to 2026-03-14 (quantity_used = 4)

**Steps:**

1. Navigate to RPT-008

**Expected Result:**

- Shows "1 of 4 used" (current period only)
- Prior period data not displayed

---

### FUT-009: Annual summary — year selector defaults to current year

**Covers:** RPT-009

**Preconditions:**

- Transaction data exists for 2025 and 2026
- Current date is in 2026

**Steps:**

1. Navigate to RPT-009

**Expected Result:**

- Year selector shows 2025 and 2026
- Default selection = 2026

---

### FUT-010: Annual summary — cards opened/closed count

**Covers:** RPT-009

**Preconditions:**

- Card A: activation_date = 2026-02-01 (opened in 2026)
- Card B: activation_date = 2025-06-01, closed_date = 2026-03-15 (closed in 2026)
- Card C: activation_date = 2025-01-01 (opened in 2025, still active)

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Cards Opened = 1 (Card A)
- Cards Closed = 1 (Card B)

---

### FUT-011: Annual summary — total net value from ENH-005

**Covers:** RPT-009

**Preconditions:**

- Card A: ENH-005 net value for 2026 = $450
- Card B: ENH-005 net value for 2026 = -$120
- Card C: not active in 2026

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Total Net Value = $330 ($450 + -$120)

---

### FUT-012: Annual summary — best and worst cards

**Covers:** RPT-009

**Preconditions:**

- 5 cards active in 2026 with ENH-005 net values: $450, $320, $200, $50, -$120

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Best Cards: $450, $320, $200 (top 3)
- Worst Cards: -$120, $50, $200 (bottom 3)

---

### FUT-013: Annual summary — average earning yield

**Covers:** RPT-009

**Preconditions:**

- Total dollar value earned across all cards in 2026 = $800
- Total spend across all cards in 2026 = $40,000

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Average Earning Yield = 2.0% ($800 / $40,000)

---

### FUT-014: Annual summary — per-card earning yield ranking

**Covers:** RPT-009

**Preconditions:**

- Card A: earned $500, spent $10,000 → 5.0%
- Card B: earned $300, spent $30,000 → 1.0%

**Steps:**

1. View RPT-009, Card Ranking table

**Expected Result:**

- Card A listed first (net value or earning yield column visible)
- Both cards show their earning yield percentage

---

### FUT-015: Annual summary — bonus scorecard

**Covers:** RPT-009

**Preconditions:**

- 2026: 3 tranches met (total bonus value $600), 1 tranche missed (bonus value $200)

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Bonuses Completed: 3 ($600)
- Bonuses Missed: 1 ($200)

---

### FUT-016: Annual summary — points summary

**Covers:** RPT-009

**Preconditions:**

- 2026: 150,000 points earned (all programs), 50,000 redeemed

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Total Points Earned: 150,000
- Total Points Redeemed: 50,000
- Net Balance Change: +100,000

---

### FUT-017: Annual summary — monthly trend chart

**Covers:** RPT-009

**Preconditions:**

- 2026 data through June (current date is June)

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- Chart shows 6 data points (Jan–Jun)
- No data points for Jul–Dec

---

### FUT-018: Annual summary — partial year shows data through today

**Covers:** RPT-009

**Preconditions:**

- Current date is March 15, 2026
- Transaction data exists for Jan, Feb, and partial March

**Steps:**

1. View RPT-009 for year 2026

**Expected Result:**

- All KPIs reflect Jan 1 – Mar 15 data
- Trend chart shows 3 months (Jan, Feb, Mar)

---

### FUT-019: Points dashboard — list report columns

**Covers:** RPT-010

**Preconditions:**

- Aeroplan: balance = 80,000, CPP = 2.0¢, 3 contributing cards
- Membership Rewards: balance = 50,000, CPP = 1.5¢, 1 contributing card

**Steps:**

1. Navigate to RPT-010

**Expected Result:**

- Aeroplan row: Balance = 80,000, CPP = 2.0¢, Dollar Value = $1,600, Contributing Cards = 3
- MR row: Balance = 50,000, CPP = 1.5¢, Dollar Value = $750, Contributing Cards = 1

---

### FUT-020: Points dashboard — dollar value computation

**Covers:** RPT-010

**Preconditions:**

- Program with balance = 100,000 and CPP = 1.8¢

**Steps:**

1. View RPT-010 list report

**Expected Result:**

- Dollar Value = $1,800 (100,000 × 1.8 / 100)

---

### FUT-021: Points dashboard — object page header

**Covers:** RPT-010

**Preconditions:**

- Aeroplan: balance = 80,000, CPP = 2.0¢

**Steps:**

1. Click into Aeroplan row

**Expected Result:**

- Title: "Aeroplan"
- Subtitle: "points"
- ObjectNumber: 80,000 points
- Second ObjectNumber: $1,600

---

### FUT-022: Points dashboard — earning history table

**Covers:** RPT-010

**Preconditions:**

- Aeroplan has: signup_bonus +25,000 (Card A), referral +5,000 (Card B), correction +2,000

**Steps:**

1. View Aeroplan object page, Earning History section

**Expected Result:**

- 3 rows showing the adjustments with date, card, type, and amount
- transfer_in/transfer_out adjustments NOT shown in this table

---

### FUT-023: Points dashboard — earning history chart

**Covers:** RPT-010

**Preconditions:**

- Aeroplan earned: Jan +25,000, Feb +3,000, Mar +4,000

**Steps:**

1. View Aeroplan object page, Earning History chart

**Expected Result:**

- Line chart with 3 monthly data points
- Only non-transfer positive adjustments included

---

### FUT-024: Points dashboard — redemption history table

**Covers:** RPT-010

**Preconditions:**

- Aeroplan redemption: 50,000 pts → $1,200 flight (effective CPP = 2.4¢), type = Flight

**Steps:**

1. View Aeroplan object page, Redemption History section

**Expected Result:**

- Row showing: 50,000 points, $1,200, 2.4¢ CPP, Flight, description

---

### FUT-025: Points dashboard — redemption breakdown chart

**Covers:** RPT-010

**Preconditions:**

- 3 Aeroplan redemptions: Flight ($1,200), Hotel ($400), Transfer to Partner ($300)

**Steps:**

1. View Aeroplan object page, Redemption chart

**Expected Result:**

- Donut chart with 3 segments by Redemption Type
- Sized by dollar value

---

### FUT-026: Transfer Points — atomic creation with 1:1 ratio

**Covers:** RPT-010

**Preconditions:**

- MR balance = 100,000
- Aeroplan balance = 50,000

**Steps:**

1. On MR object page, click "Transfer Points"
2. Select destination = Aeroplan, from_amount = 20,000, to_amount = 20,000, date = today

**Expected Result:**

- Points Transfer record created
- MR balance = 80,000 (transfer_out -20,000)
- Aeroplan balance = 70,000 (transfer_in +20,000)
- MR Transfers & Adjustments table shows: Out → Aeroplan, 20,000 sent, ratio 1:1
- Aeroplan Transfers & Adjustments table shows: In ← MR, 20,000 received, ratio 1:1

---

### FUT-027: Transfer Points — non-1:1 ratio

**Covers:** RPT-010

**Preconditions:**

- MR balance = 100,000
- Bonvoy balance = 0

**Steps:**

1. On MR object page, click "Transfer Points"
2. Select destination = Bonvoy, from_amount = 20,000, to_amount = 25,000, date = today

**Expected Result:**

- MR balance = 80,000 (-20,000)
- Bonvoy balance = 25,000 (+25,000)
- Ratio displayed as "1:1.25"

---

### FUT-028: Transfer Points — same program rejected

**Covers:** RPT-010

**Preconditions:**

- On Aeroplan object page

**Steps:**

1. Click "Transfer Points", select destination = Aeroplan

**Expected Result:**

- Error: "Cannot transfer points within the same program"

---

### FUT-029: Manual Adjustment — credit

**Covers:** RPT-010

**Preconditions:**

- Aeroplan balance = 50,000

**Steps:**

1. On Aeroplan object page, click "Manual Adjustment"
2. Enter amount = 5,000, description = "Promo bonus from Aeroplan"

**Expected Result:**

- Aeroplan balance = 55,000
- Points Adjustment created: type = correction, amount = +5,000
- Appears in Transfers & Adjustments → Manual Adjustments table

---

### FUT-030: Manual Adjustment — debit

**Covers:** RPT-010

**Preconditions:**

- Aeroplan balance = 50,000

**Steps:**

1. On Aeroplan object page, click "Manual Adjustment"
2. Enter amount = -3,000, description = "Balance correction"

**Expected Result:**

- Aeroplan balance = 47,000
- Points Adjustment created: type = correction, amount = -3,000

---

### FUT-031: Manual Adjustment — zero amount rejected

**Covers:** RPT-010

**Preconditions:**

- On Aeroplan object page

**Steps:**

1. Click "Manual Adjustment", enter amount = 0

**Expected Result:**

- Error: "Adjustment amount cannot be zero"

---

### FUT-032: Transfers & Adjustments table shows both types

**Covers:** RPT-010

**Preconditions:**

- Aeroplan has: 1 inbound transfer from MR, 1 manual correction

**Steps:**

1. View Aeroplan object page, Transfers & Adjustments section

**Expected Result:**

- Transfers table: 1 row (In ← MR)
- Manual Adjustments table: 1 row (correction)

---

### FUT-033: Contributing Cards table

**Covers:** RPT-010

**Preconditions:**

- Aeroplan: Card A (Active, earned 40,000), Card B (Focus, earned 10,000), Card C (Closed, earned 30,000)

**Steps:**

1. View Aeroplan object page, Contributing Cards section

**Expected Result:**

- 3 rows (all statuses shown on object page)
- Card A: Active (green), 40,000 points
- Card B: Focus (blue), 10,000 points
- Card C: Closed (grey), 30,000 points

---

### FUT-034: Transfer Points — from_amount validation

**Covers:** RPT-010

**Steps:**

1. Click "Transfer Points", enter from_amount = -100

**Expected Result:**

- Error: "Transfer amount must be greater than zero"

---

## 9. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-04 (Bonus & Points) | RPT-009 consumes ENH-003 tranche status (met/missed counts) and ENH-006 points balances/valuations. RPT-010 displays ENH-006 per-program data. |
| SPEC-08 (Card Profitability) | RPT-009 consumes ENH-005 net value for card ranking, best/worst, and total net value. |
| SPEC-06 (Reference Data & Seed) | Adjustment Type seeds already include transfer_in, transfer_out, correction — no amendment needed. Perk Type seeds (lounge_pass, travel_credit, portal_rebate, insurance, status) drive RPT-008 sections. |
| TECH_STACK.md | Amendment: `app/points-dashboard/` changes from freestyle to Fiori Elements with custom sections. |
| SPEC-19 (Churnboard) | RPT-001 may reference RPT-008 perk summary or RPT-009 annual KPIs. |

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects RPT-008, RPT-009, RPT-010 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-165–D-169 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md).*
