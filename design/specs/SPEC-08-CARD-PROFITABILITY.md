# SPEC-08: Card Profitability

**Spec ID:** SPEC-08
**Name:** Card Profitability
**FRICEW Objects:** ENH-005, RPT-005
**Wave:** 2 (ENH-005), 3 (RPT-005)
**Sprint:** W2-S1 (ENH-005), W3-S1 (RPT-005)
**CDS Services:** ChurningService
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-142 through D-147 logged. |
| 2026-02-18 | Sandro | Approved. |

---

## 2. Overview

ENH-005 (Card Profitability Calculator) computes the net financial value of each card in the user's portfolio. RPT-005 (Card Analytics) is a freestyle per-card deep-dive dashboard visualizing spend, points, profitability, and earning optimization.

Profitability is computed at runtime — no stored snapshots. The formula uses all-CPP valuation (no redemption attribution at card level, D-142) and provides both all-time and per-card-year breakdowns (anniversary-based, D-143).

Key decisions: D-04 (CC fees as budget + churning cost), D-23 (realized vs unrealized perks), D-26 (referral attribution), D-27/D-41 (FYF on Offer), D-28 (fee structure), D-40 (time-bound multipliers), D-129 (refunds excluded from points), D-130 (per-card points breakdown), D-142 (profitability formula), D-143 (anniversary card years), D-144 (RPT-005 navigation), D-145 (breakeven monitor), D-146 (RPT-005 sections), D-147 (headline KPIs).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Card Instance | Hub — profitability computed per card | §4.4 | — |
| Market Card | fee_structure, fee_amount for breakeven | §4.1 | — |
| Offer | fyf flag for FYF year detection | §4.2 | — |
| Offer Tranche | Bonus terms (consumed via ENH-003) | §4.3 | — |
| Earning Multiplier | Per-card per-category earn rates | §4.5 | — |
| Card Perk | dollar_value_realized for realized perks line | §4.7 | — |
| Transaction | Fee identification (Annual Fee subtype) + spend totals | §5.1 | — |
| Points Adjustment | Signup bonus + referral bonus attribution | §5.3 | — |
| Rewards Program | cpp_valuation for points-to-dollar conversion | §3.2 | — |
| Purchase Type | Annual Fee subtype identification | §3.3 | — |

### DM-001 Amendments

**Amendment 1 — Card Profitability formula update (D-142):**

Data Model §8 currently reads:

> "Card Profitability: Points earned ($) + Redemptions + realized Card Perks − fee Transactions | ENH-005"

Updated to:

> "Card Profitability: Points earned × CPP + realized Card Perks − Annual Fee Transactions. Computed per card, per card year (anniversary-based), and all-time. Redemptions excluded from card-level profitability — they are per-program. | ENH-005"

---

## 4. Functional Description

### 4.1 ENH-005 — Card Profitability Calculator [Enhancement]

**Inputs:** `card_instance_id` (required), `card_year` (optional — null = all-time)

**Outputs:**

| Field | Type | Notes |
|-------|------|-------|
| `cardInstanceId` | UUID | |
| `cardName` | string | Market Card name |
| `lifecycleState` | enum | Current card status |
| `activationDate` | date | Card Instance activation_date |
| `currentCardYear` | integer | Which card year the card is in (1, 2, 3…) |
| `scope` | enum | `all_time` · `card_year` |
| `cardYearStart` | date | Start of the requested card year (null for all-time) |
| `cardYearEnd` | date | End of the requested card year (null for all-time) |
| `profitability` | object | Five-line breakdown (see below) |
| `breakeven` | object | Breakeven monitor (see below) |
| `effectiveEarnRate` | decimal | Blended points per dollar across all spend |
| `totalSpend` | decimal | Total card spend in scope |
| `cardYears` | array | Summary per card year (for all-time scope only) |

**Profitability breakdown:**

| Field | Type | Notes |
|-------|------|-------|
| `spendBasedPoints` | integer | Points earned from spending (ENH-006 per-card) minus signup/referral |
| `spendBasedValue` | decimal | spendBasedPoints × CPP / 100 |
| `signupBonusPoints` | integer | Points Adjustments where adjustment_type = signup_bonus AND card_instance_id matches |
| `signupBonusValue` | decimal | signupBonusPoints × CPP / 100 |
| `referralBonusPoints` | integer | Points Adjustments where adjustment_type = referral AND card_instance_id matches |
| `referralBonusValue` | decimal | referralBonusPoints × CPP / 100 |
| `realizedPerks` | decimal | Sum of Card Perk.dollar_value_realized for this card |
| `feesPaid` | decimal | Sum of fee transactions (Annual Fee subtype) on this card |
| `netValue` | decimal | spendBasedValue + signupBonusValue + referralBonusValue + realizedPerks − feesPaid |

**Breakeven monitor:**

| Field | Type | Notes |
|-------|------|-------|
| `applicable` | boolean | False for closed cards, no-fee cards |
| `feeTarget` | decimal | Expected fee for current period |
| `feePeriod` | enum | `monthly` · `annual` |
| `periodStart` | date | Current fee period start |
| `periodEnd` | date | Current fee period end |
| `earnedValue` | decimal | Total value earned in current period (all five revenue lines) |
| `pointsNeeded` | integer | Points still needed to break even: (feeTarget − earnedValue) / CPP × 100 |
| `progress` | decimal | earnedValue / feeTarget × 100 (capped at 100) |
| `isMet` | boolean | earnedValue ≥ feeTarget |
| `isFyf` | boolean | True when in FYF year 1 |

**Per-card-year summary (within all-time response):**

| Field | Type | Notes |
|-------|------|-------|
| `cardYear` | integer | 1, 2, 3… |
| `yearStart` | date | |
| `yearEnd` | date | |
| `netValue` | decimal | Profitability for this card year |
| `totalSpend` | decimal | Spend in this card year |
| `feesPaid` | decimal | |
| `isFyf` | boolean | |

**Consumers:**

| Consumer | Usage |
|----------|-------|
| RPT-005 (Card Analytics) | Primary consumer — full profitability breakdown + breakeven + card year history |
| FRM-004 (My Cards) | Summary net value per card on card list |
| RPT-001 (Churnboard) | Portfolio-level profitability summary |
| WFL-002 (Card Lifecycle) | Renewal decision support — current year profitability vs fee |

#### Profitability Formula

```
Net Value = Spend-Based Value + Signup Bonus Value + Referral Bonus Value + Realized Perks − Fees Paid

Where:
  Spend-Based Value = spend-based points earned on this card × CPP / 100
  Signup Bonus Value = Σ(Points Adjustment.amount) where type = signup_bonus AND card = this card × CPP / 100
  Referral Bonus Value = Σ(Points Adjustment.amount) where type = referral AND card = this card × CPP / 100
  Realized Perks = Σ(Card Perk.dollar_value_realized) for this card
  Fees Paid = Σ(|Transaction.amount|) where Purchase Type = "Annual Fee" AND card = this card
  CPP = Rewards Program.cpp_valuation (current, via Market Card → Rewards Program)
```

Redemptions are excluded from card-level profitability (D-142). They are per-program events tracked in the trophy case (RPT-004). All points valued at current CPP — not historical CPP at time of earning.

#### Card Year Definition

A card year is an anniversary-based 365-day period starting from `Card Instance.activation_date` (D-143).

```
Card Year 1: activation_date to activation_date + 364 days
Card Year 2: activation_date + 365 to activation_date + 729 days
Card Year N: activation_date + ((N-1) × 365) to activation_date + (N × 365) - 1
```

For closed cards, the final card year ends at `closed_date`.

The current card year is determined by: `floor((today - activation_date) / 365) + 1`

All-time profitability = sum across all card years from activation to today (or closed_date).

#### Fee Identification

Fee transactions are identified by Purchase Type hierarchy:

- Top-level: "Credit Card Fees"
- Subtype: **"Annual Fee"** — only this subtype counts toward profitability fees

Other subtypes ("FX Fee", "Interest") are excluded from the profitability calculation — they are transaction-level costs, not card-holding costs.

#### Breakeven Monitor

The breakeven monitor answers: "Is this card earning more than its cost in the current fee period?"

**Fee target source:**

| Scenario | Fee Target |
|----------|-----------|
| Current period (fee not yet posted) | Market Card.fee_amount |
| Historical period | Actual fee transaction amount |
| FYF year 1 (Offer.fyf = true AND within card year 1) | $0 — breakeven auto-met |
| No-fee card (fee_amount = 0) | N/A — breakeven not applicable |
| Closed card | N/A — breakeven not applicable |

**Fee period:**

| fee_structure | Period Definition |
|---------------|-------------------|
| `annual` | Current card year (activation anniversary to next anniversary) |
| `monthly` | Current billing month based on statement_close_day (D-124). Day N of month to Day N-1 of next month. |

**Points needed:** `max(0, (feeTarget − earnedValue)) / CPP × 100`

When feeTarget = 0 (FYF), progress = 100%, isMet = true, isFyf = true.

#### Effective Earn Rate

Blended earn rate across all spending on this card within the requested scope:

```
effectiveEarnRate = totalPointsEarned / totalSpend
```

Where `totalPointsEarned` is spend-based points only (excludes signup/referral bonuses). `totalSpend` is the absolute sum of charge transactions (negative amounts). Refunds excluded from both numerator and denominator (D-129).

#### Spend-Based Points Computation

Spend-based points = total points earned on the card (from ENH-006 per-card breakdown, D-130) minus Points Adjustments (signup_bonus + referral + transfer_in + transfer_out + correction).

ENH-006 provides total points per card. ENH-005 subtracts non-spend Points Adjustments to isolate the spend-driven portion.

### 4.2 RPT-005 — Card Analytics [Report]

**App location:** `app/card-analytics/`
**Pattern:** Freestyle (custom dashboard)
**CDS Service:** ChurningService

#### Navigation (D-144)

- **Primary entry:** FRM-004 (My Cards) → card row → "Analytics" button/link → RPT-005 pre-filtered to that card
- **Card selector:** Dropdown at top of RPT-005. Grouped: active cards (Focus, Active, To Cancel) on top, Closed cards in separate group below.
- **All card statuses** included — closed cards have full historical profitability data.

#### Headline KPIs (D-147)

Two prominent ObjectNumber tiles at the top of the page:

| KPI | Value | Color |
|-----|-------|-------|
| **This Card Year** | ENH-005 netValue for current card year | Semantic: green (positive), red (negative) |
| **Lifetime** | ENH-005 netValue for all-time | Semantic: green (positive), red (negative) |

For closed cards, "This Card Year" shows the final card year's value. Label changes to "Final Card Year".

#### Dashboard Sections (D-146)

The page is a scrolling object page (per Design System, D-62) with the following sections:

**Section 1 — Profitability Breakdown**

Five-line table showing the ENH-005 profitability breakdown for the selected scope (current card year by default, toggle to all-time):

| Line | Value | Format |
|------|-------|--------|
| Spend-based points | X points ($Y.YY) | Points count + dollar value |
| Signup bonus | X points ($Y.YY) | |
| Referral bonuses | X points ($Y.YY) | |
| Realized perks | $Y.YY | Dollar only |
| Fees paid | −$Y.YY | Red, negative |
| **Net value** | **$Y.YY** | Bold, semantic color |

**Section 2 — Breakeven Monitor**

| Element | Details |
|---------|---------|
| Progress bar | Visual progress toward breakeven (0–100%) |
| Points needed | "650 MR points ($13.00) remaining" |
| Fee target | "Monthly fee: $12.99" or "Annual fee: $139.00" |
| Period | "Mar 5 – Apr 4, 2026" (monthly) or "Mar 15, 2025 – Mar 14, 2026" (annual) |
| Status | ObjectStatus: "Breakeven Met" (green) / "X points to go" (orange) / "First Year Free" (blue) |

Hidden when: closed card, no-fee card. Shows "First Year Free — no fee to offset" for FYF year 1.

**Section 3 — Effective Earn Rate**

| Element | Details |
|---------|---------|
| Headline number | "2.6×" — blended earn rate |
| Context | "Across $X,XXX total spend" |
| Comparison | "vs. base rate of 1.0×" (the card's "Everything Else" multiplier) |

**Section 4 — Bonus Progress**

Active MSR tranche status from ENH-003. Shows progress bar, amount remaining, deadline.

Hidden when: no active tranches. This section mirrors FRM-004's bonus progress display but in the analytics context.

**Section 5 — What to Use This Card On**

Table showing this card's earning multipliers sorted by earn value (multiplier × CPP):

| Category | Multiplier | Earn Rate | Best Card? |
|----------|-----------|-----------|------------|
| Groceries | 5× | $0.10/$ | Yes |
| Dining | 3× | $0.06/$ | No (TD Aeroplan: $0.08/$) |
| Streaming | 2× | $0.04/$ | Yes |
| Everything Else | 1× | $0.02/$ | No |

"Earn Rate" = multiplier × CPP / 100. "Best Card?" indicator from ENH-002 recommendation data — shows the card that currently wins if this card doesn't.

Uses current active multipliers only (time-bound per D-40).

**Section 6 — Spend Trend**

VizFrame line/bar chart: monthly spend on this card over time.

- X-axis: months
- Y-axis: dollar amount
- Default range: last 12 months (scrollable)
- Card year boundaries shown as vertical reference lines

**Section 7 — Category Spend Breakdown**

VizFrame donut chart: spend by Earning Category on this card.

- Scope: current card year (toggle to all-time)
- Segments: Earning Category names, sized by spend amount
- Legend with amounts and percentages

**Section 8 — Year-over-Year Comparison**

Table comparing profitability across card years (D-143):

| Card Year | Period | Spend | Points | Value | Perks | Fees | Net | FYF? |
|-----------|--------|-------|--------|-------|-------|------|-----|------|
| Year 1 | Mar 2024 – Mar 2025 | $12,000 | 28,000 | $560 | $100 | $0 | +$660 | Yes |
| Year 2 | Mar 2025 – Mar 2026 | $8,000 | 16,000 | $320 | $75 | $139 | +$256 | No |

For the current (incomplete) card year, the period shows "to date" and values reflect partial year.

---

## 5. Business Rules

### ENH-005 — Card Profitability Calculator

| Rule | Description |
|------|-------------|
| BR-01 | Profitability formula: Net Value = Spend-Based Value + Signup Bonus Value + Referral Bonus Value + Realized Perks − Fees Paid. Computed at runtime, not stored (D-142). |
| BR-02 | All points valued at current CPP (Rewards Program.cpp_valuation). Not historical CPP at time of earning. |
| BR-03 | Redemptions excluded from card-level profitability. They are per-program events (D-142). |
| BR-04 | Spend-based points = ENH-006 per-card total (D-130) minus Points Adjustments (all types) for this card. |
| BR-05 | Signup bonus points = Points Adjustments where adjustment_type = signup_bonus AND card_instance_id = this card. Includes auto-created adjustments from ENH-003 (D-126). |
| BR-06 | Referral bonus points = Points Adjustments where adjustment_type = referral AND card_instance_id = this card (D-26). |
| BR-07 | Realized perks = sum of Card Perk.dollar_value_realized for this card's Card Perk records. |
| BR-08 | Fees = sum of absolute Transaction.amount where Purchase Type = "Annual Fee" (subtype of "Credit Card Fees") AND card_instance_id = this card. FX Fee and Interest subtypes excluded. |
| BR-09 | Card year = anniversary-based 365-day period from activation_date (D-143). Year N starts at activation_date + ((N-1) × 365). |
| BR-10 | All-time profitability = sum across all card years. |
| BR-11 | For closed cards, final card year ends at closed_date. |
| BR-12 | Breakeven fee target: Market Card.fee_amount for current period; actual fee transactions for historical periods (D-145). |
| BR-13 | Breakeven period: matches fee_structure — monthly periods for monthly fees, card-year periods for annual fees (D-145). |
| BR-14 | FYF year 1 (Offer.fyf = true AND within card year 1): breakeven target = $0, auto-met (D-145). |
| BR-15 | Breakeven not applicable for closed cards and no-fee cards (fee_amount = 0). |
| BR-16 | Monthly fee breakeven period: statement_close_day to next statement_close_day (D-124). |
| BR-17 | Effective earn rate = spend-based points / total charge spend. Excludes signup, referral, refunds (D-129). |
| BR-18 | Cards without activation_date cannot have profitability computed. Return empty result. |
| BR-19 | Points Adjustment date determines which card year a bonus falls into. |

### RPT-005 — Card Analytics

| Rule | Description |
|------|-------------|
| BR-20 | Card selector includes all lifecycle states: Focus, Active, To Cancel, Closed (D-144). Grouped with active on top, closed below. |
| BR-21 | Primary navigation from FRM-004. Dropdown on RPT-005 for card switching (D-144). |
| BR-22 | Two headline KPIs: current card year net value and lifetime net value (D-147). Semantic color: green (≥ 0), red (< 0). |
| BR-23 | For closed cards, headline label changes from "This Card Year" to "Final Card Year". |
| BR-24 | Breakeven monitor section hidden for closed cards and no-fee cards (BR-15). |
| BR-25 | "What to Use This Card On" shows current active earning multipliers only (D-40 time-bound). |
| BR-26 | "Best Card?" indicator in Section 5 sourced from ENH-002 recommendation output. Shows the winning card name when this card is not the best. |
| BR-27 | Spend Trend default range: last 12 months. Card year boundaries shown as vertical reference lines. |
| BR-28 | Category Spend Breakdown defaults to current card year scope with toggle to all-time. |
| BR-29 | Year-over-Year table shows all completed card years plus current (partial) year. |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| Card has no activation_date | Profitability section shows "Activation date required for profitability analysis" | `churning.profitability.noActivationDate` |
| Card has no Rewards Program (Market Card.rewards_program_id is null) | Points-based lines show 0. Perks and fees still computed. | — |
| No transactions on card | All values = 0. Dashboard shows empty state: "No transactions yet" | `churning.profitability.noTransactions` |
| No fee transactions found (annual fee card) | feesPaid = 0 for that period. Breakeven shows full fee target as remaining. | — |
| ENH-006 per-card breakdown unavailable | Spend-based points = 0. Log warning. | — |
| ENH-002 recommendation data unavailable | "Best Card?" column hidden in Section 5 | — |
| ENH-003 tranche data unavailable | Bonus Progress section hidden | — |
| Card year extends beyond today (current year) | Show "to date" label. All values are partial/in-progress. | — |

---

## 7. Open Items

| OI | Resolution |
|----|------------|
| OI-06 | No new Alert Types from this spec. Existing alert types (af_renewal, bonus_met) support renewal decision context indirectly. |

---

## 8. Functional Unit Tests

### FUT-801: Basic profitability — all-time happy path

**Covers:** ENH-005

**Preconditions:**

- Card Instance: TD Aeroplan, activation_date = 2025-03-15, lifecycle_state = Active
- Rewards Program: Aeroplan, cpp_valuation = 2.0
- Transactions on this card: $10,000 total charges
- ENH-006 reports 15,000 Aeroplan points earned on this card
- Points Adjustments: signup_bonus 20,000 points (card_instance = this card), referral 5,000 points (card_instance = this card)
- Card Perk: dollar_value_realized = $100 (Priority Pass usage)
- Fee transaction: 1 × $139 (Purchase Type = Annual Fee)

**Steps:**

1. Compute profitability for this card, scope = all-time

**Expected Result:**

- Spend-based points: 15,000 − 20,000 − 5,000 = −10,000 → 0 (floor at 0, or compute as negative? See BR-04)

*Correction: ENH-006 total includes spend + adjustments. Spend-based = 15,000 total from ENH-006, adjustments total = 25,000. But ENH-006's per-card breakdown tracks actual points from transactions × multipliers, NOT Points Adjustments. So spend-based = 15,000.*

- spendBasedPoints = 15,000, spendBasedValue = $300.00
- signupBonusPoints = 20,000, signupBonusValue = $400.00
- referralBonusPoints = 5,000, referralBonusValue = $100.00
- realizedPerks = $100.00
- feesPaid = $139.00
- netValue = $300 + $400 + $100 + $100 − $139 = **$761.00**

---

### FUT-802: Per-card-year profitability

**Covers:** ENH-005

**Preconditions:**

- Card Instance: Amex Cobalt, activation_date = 2024-06-01
- Year 1 (Jun 2024 – May 2025): spend-based 30,000 MR, signup 30,000 MR, perks $50, fees $155.88 (12 × $12.99)
- Year 2 (Jun 2025 – May 2026): spend-based 20,000 MR, signup 0, perks $25, fees $155.88
- MR cpp_valuation = 2.0

**Steps:**

1. Compute profitability for card year 1
2. Compute profitability for card year 2

**Expected Result:**

- Year 1: netValue = $600 + $600 + $0 + $50 − $155.88 = **$1,094.12**
- Year 2: netValue = $400 + $0 + $0 + $25 − $155.88 = **$269.12**

---

### FUT-803: FYF year 1 — breakeven auto-met

**Covers:** ENH-005

**Preconditions:**

- Card Instance: CIBC Aventura, activation_date = 2026-01-10
- Offer: fyf = true
- Market Card: fee_structure = annual, fee_amount = $139
- Currently in card year 1

**Steps:**

1. Compute breakeven for current period

**Expected Result:**

- breakeven.isFyf = true
- breakeven.feeTarget = $0
- breakeven.progress = 100%
- breakeven.isMet = true

---

### FUT-804: Monthly fee breakeven — in progress

**Covers:** ENH-005

**Preconditions:**

- Card Instance: Amex Cobalt, statement_close_day = 5
- Market Card: fee_structure = monthly, fee_amount = $12.99
- Rewards Program: MR, cpp = 2.0
- Current period: Feb 5 – Mar 4, 2026
- Points earned this period: 400 MR

**Steps:**

1. Compute breakeven

**Expected Result:**

- breakeven.feePeriod = monthly
- breakeven.feeTarget = $12.99
- breakeven.earnedValue = $8.00 (400 × 0.02)
- breakeven.pointsNeeded = 250 (($12.99 − $8.00) / 0.02)
- breakeven.progress = 61.6%
- breakeven.isMet = false

---

### FUT-805: Annual fee breakeven — met

**Covers:** ENH-005

**Preconditions:**

- Card Instance: TD Aeroplan, activation_date = 2025-03-15
- Market Card: fee_structure = annual, fee_amount = $139
- Current card year: Mar 2025 – Mar 2026
- Total value earned this card year: $350 (spend + perks)

**Steps:**

1. Compute breakeven

**Expected Result:**

- breakeven.feeTarget = $139
- breakeven.earnedValue = $350
- breakeven.progress = 100% (capped)
- breakeven.isMet = true

---

### FUT-806: Closed card — breakeven N/A, profitability computed

**Covers:** ENH-005

**Preconditions:**

- Card Instance: CIBC Aventura (old), lifecycle_state = Closed, activation_date = 2023-06-01, closed_date = 2025-05-31
- Lifetime: spend-based 10,000 Aventura points, $50 perks, $139 fee

**Steps:**

1. Compute profitability (all-time)
2. Check breakeven

**Expected Result:**

- netValue = 10,000 × 0.01 + $50 − $139 = **$11.00** (Aventura at 1.0 cpp)
- breakeven.applicable = false

---

### FUT-807: No-fee card — breakeven N/A

**Covers:** ENH-005

**Preconditions:**

- Card Instance with Market Card fee_amount = 0

**Steps:**

1. Compute breakeven

**Expected Result:**

- breakeven.applicable = false

---

### FUT-808: Effective earn rate

**Covers:** ENH-005

**Preconditions:**

- Card Instance with 8,000 spend-based points, $4,000 total charges (excluding refunds)

**Steps:**

1. Compute effective earn rate

**Expected Result:**

- effectiveEarnRate = 8,000 / 4,000 = **2.0×**

---

### FUT-809: Card with no activation_date

**Covers:** ENH-005

**Preconditions:**

- Card Instance with activation_date = null

**Steps:**

1. Compute profitability

**Expected Result:**

- Returns empty result with message "Activation date required"
- No error thrown

---

### FUT-810: Card year boundary — transaction on anniversary date

**Covers:** ENH-005

**Preconditions:**

- Card Instance: activation_date = 2025-03-15
- Fee transaction on 2026-03-15 (exactly year 1 anniversary)

**Steps:**

1. Compute profitability for card year 1 and card year 2

**Expected Result:**

- Transaction on 2026-03-15 falls in card year 2 (year 1 ends on 2026-03-14)
- Fee counted in card year 2

---

### FUT-811: RPT-005 — headline KPIs

**Covers:** RPT-005

**Preconditions:**

- Card Instance: Amex Cobalt, current card year netValue = +$247, lifetime netValue = +$1,842

**Steps:**

1. Open RPT-005 for Amex Cobalt

**Expected Result:**

- "This Card Year: +$247.00" (green)
- "Lifetime: +$1,842.00" (green)

---

### FUT-812: RPT-005 — closed card labels

**Covers:** RPT-005

**Preconditions:**

- Closed card with final card year netValue = −$50, lifetime netValue = +$300

**Steps:**

1. Select closed card in RPT-005 dropdown

**Expected Result:**

- "Final Card Year: −$50.00" (red)
- "Lifetime: +$300.00" (green)
- Breakeven section hidden
- Year-over-Year table shows all card years through closed_date

---

### FUT-813: RPT-005 — card selector dropdown grouping

**Covers:** RPT-005

**Preconditions:**

- 3 Active cards, 1 Focus card, 1 To Cancel card, 2 Closed cards

**Steps:**

1. Open RPT-005 dropdown

**Expected Result:**

- Group 1: Focus (1), Active (3), To Cancel (1)
- Group 2: Closed (2)
- Active cards listed first

---

### FUT-814: RPT-005 — "What to Use This Card On"

**Covers:** RPT-005

**Preconditions:**

- Amex Cobalt multipliers: Groceries 5×, Dining 3×, Streaming 2×, Everything Else 1×
- CPP = 2.0
- ENH-002 recommends: Groceries → Cobalt, Dining → TD Aeroplan

**Steps:**

1. View Section 5 on Cobalt analytics

**Expected Result:**

- Groceries: 5×, $0.10/$, Best Card = Yes
- Dining: 3×, $0.06/$, Best Card = No (TD Aeroplan: $0.08/$)
- Streaming: 2×, $0.04/$, Best Card = [from ENH-002]
- Everything Else: 1×, $0.02/$, Best Card = [from ENH-002]

---

### FUT-815: RPT-005 — Year-over-Year with partial current year

**Covers:** RPT-005

**Preconditions:**

- Card Instance: activation_date = 2024-06-01
- Year 1 complete, Year 2 in progress (8 months elapsed)

**Steps:**

1. View Section 8

**Expected Result:**

- Year 1 row: complete data, full 12-month period
- Year 2 row: partial data, period shows "Jun 2025 – to date", values reflect 8 months

---

### FUT-816: Navigate from FRM-004 to RPT-005

**Covers:** RPT-005

**Preconditions:**

- FRM-004 displays list of cards including Amex Cobalt

**Steps:**

1. Click Amex Cobalt row in FRM-004
2. Click "Analytics" link/button on card detail

**Expected Result:**

- RPT-005 opens with Amex Cobalt pre-selected in dropdown
- All sections populated with Cobalt data

---

## 9. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-04 (Bonus & Points) | ENH-005 consumes ENH-006's per-card points breakdown (D-130) as a revenue input. ENH-003 auto-creates signup_bonus Points Adjustments (D-126) which feed the signup bonus line. |
| SPEC-07 (Card Recommendation) | "What to Use This Card On" (Section 5) consumes ENH-002 recommendation output. ENH-005 and ENH-002 share multiplier and CPP data but have no direct dependency. |
| SPEC-06 (Reference Data & Seed) | Purchase Type "Credit Card Fees" → "Annual Fee" subtype used for fee identification. Market Card fee_amount and fee_structure used for breakeven target. Offer.fyf for FYF detection. **DM-001 §8 amendment:** Card Profitability formula updated per D-142. |
| SPEC-10 (My Cards) | RPT-005 primary navigation entry point from FRM-004 card detail. ENH-005 summary net value displayed on FRM-004 card list. |
| SPEC-15 (Churnboard) | RPT-001 consumes ENH-005 for portfolio-level profitability aggregation. |
| SPEC-11 (Card Lifecycle) | WFL-002 uses ENH-005 current-year profitability for renewal decision support. |

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects ENH-005, RPT-005 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-142–D-147 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md).*
