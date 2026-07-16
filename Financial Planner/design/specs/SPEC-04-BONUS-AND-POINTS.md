# SPEC-04: Bonus & Points

**Spec ID:** SPEC-04
**Name:** Bonus & Points
**FRICEW Objects:** ENH-003, ENH-006
**Wave:** 1
**Sprint:** W1-S4
**CDS Services:** ChurningService
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                       |
| ---------- | --------------- | ----------------------------------------------------------------- |
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-123 through D-130 logged. |

---

## 2. Overview

ENH-003 (Signup Bonus Tracker) and ENH-006 (Points Balance & Valuation) are the two computation engines powering churning metrics. ENH-003 computes per-tranche MSR progress for each card, determining whether the cardholder is on track, has met, or has missed each bonus threshold. ENH-006 computes points balances per rewards program from transaction-level earnings, adjustments, and redemptions, then applies CPP valuations for dollar equivalents. Both are computed at runtime — no stored progress or balance tables.

ENH-003 has a write side effect: when a tranche or monthly period is met, it auto-creates a Points Adjustment record that feeds into ENH-006's balance computation. ENH-003 also generates alerts for approaching deadlines, met bonuses, and missed bonuses.

Key decisions: D-02 (supp card rollup), D-04 (fee exclusion), D-07 (refund not reversed), D-09 (CPP valuation), D-24 (multi-tranche structure), D-26 (adjustment types), D-40 (time-bound multipliers), D-123 (billing period mechanics), D-124 (statement_close_day), D-125 (cumulative thresholds), D-126 (auto Points Adjustment), D-127 (configurable deadline alert), D-128 (dual-trigger evaluation), D-129 (refunds excluded from points), D-130 (dual aggregation level).

---

## 3. Data Model References

| Entity             | Role                                                    | DM-001 Ref | Amendment?                |
| ------------------ | ------------------------------------------------------- | ---------- | ------------------------- |
| Offer              | Links card signup to offer terms                        | §4.2       | —                         |
| Offer Tranche      | MSR thresholds, window types, bonus amounts             | §4.3       | —                         |
| Card Instance      | Activation date, lifecycle state, supp card parent link | §4.4       | Add `statement_close_day` |
| Earning Multiplier | Points-per-category rates per market card               | §4.5       | —                         |
| Transaction        | Qualifying spend source for MSR and points earning      | §5.1       | —                         |
| Transaction Split  | Full amount used for churning (not my_share)            | §5.2       | —                         |
| Points Adjustment  | Manual and auto-created point entries                   | §5.3       | —                         |
| Redemption         | Points spent, reduces balance                           | §5.4       | —                         |
| Rewards Program    | CPP valuation for dollar conversion                     | §3.2       | —                         |
| Earning Category   | "Everything Else" as base rate catch-all                | §3.4       | —                         |
| Alert              | MSR deadline, bonus met, bonus missed alerts            | §6.1       | —                         |
| System Config      | MSR_DEADLINE_ALERT_DAYS parameter                       | §3.17      | Add config key            |

### DM-001 Amendments

**Amendment 1 — Statement close day on Card Instance (D-124):**

| New Attribute         | Type    | Required | Notes                                                                                                                                              |
| --------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `statement_close_day` | integer | no       | Day of month (1–31) the statement closes. Required for cards with `monthly_recurring` tranches. Used by ENH-003 to compute billing period windows. |

**System Config Addition (D-127):**

| Key                       | Default | Description                                                        |
| ------------------------- | ------- | ------------------------------------------------------------------ |
| `MSR_DEADLINE_ALERT_DAYS` | `14`    | Days before MSR window/period end to generate `msr_deadline` alert |

---

## 4. Functional Description

### 4.1 ENH-003 — Signup Bonus Tracker [Enhancement]

**Inputs:** `card_instance_id`

**Outputs (per tranche):**

| Field              | Type    | Notes                                               |
| ------------------ | ------- | --------------------------------------------------- |
| `tranche_number`   | integer | From Offer Tranche                                  |
| `msr_amount`       | decimal | Target spend                                        |
| `qualifying_spend` | decimal | Computed sum of eligible transactions               |
| `progress_pct`     | decimal | `qualifying_spend / msr_amount` (capped at 1.0)     |
| `remaining`        | decimal | `msr_amount - qualifying_spend` (floored at 0)      |
| `window_start`     | date    | Computed from activation_date + unlock_month        |
| `window_end`       | date    | Computed from window_start + msr_window_months      |
| `status`           | enum    | `pending` · `in_progress` · `met` · `missed`        |
| `days_remaining`   | integer | Calendar days until window_end (null if met/missed) |

For `monthly_recurring` tranches, outputs are **per billing period** within the tranche window:

| Field              | Type    | Notes                                        |
| ------------------ | ------- | -------------------------------------------- |
| `period_number`    | integer | 1 through `msr_window_months`                |
| `period_start`     | date    | Billing period start                         |
| `period_end`       | date    | Billing period end                           |
| `qualifying_spend` | decimal | Spend posted within this period              |
| `progress_pct`     | decimal | `qualifying_spend / msr_amount`              |
| `status`           | enum    | `pending` · `in_progress` · `met` · `missed` |

**Consumers:**

| Consumer                      | Usage                                                  |
| ----------------------------- | ------------------------------------------------------ |
| FRM-004 (My Cards)            | Bonus progress tab — tranche list with progress bars   |
| RPT-001 (Churnboard)          | Bonus progress section — cards with active MSR windows |
| WFL-002 (Card Lifecycle)      | Focus→Active transition trigger when all tranches met  |
| ENH-002 (Card Recommendation) | Wave 2 — factors remaining MSR into recommendations    |
| ENH-005 (Card Profitability)  | Wave 2 — bonus value as profitability input            |

#### One-Time Tranche Computation

1. **Window calculation:** `window_start = activation_date + (unlock_month - 1) months`. `window_end = window_start + msr_window_months months`.
2. **Qualifying spend:** Sum of `Transaction.amount` where:
   - `card_instance_id` matches this card OR any supplementary card (D-02)
   - `posted_at` is within `[window_start, window_end]`
   - `is_excluded = false`
   - Purchase Type is NOT "Credit Card Fee" (D-04)
   - `amount < 0` (charges only — positive amounts are refunds/credits, excluded)
   - Uses absolute value of amount for progress calculation
3. **Cumulative thresholds (D-125):** When multiple tranches share the same window (same `unlock_month` and `msr_window_months`), qualifying spend counts toward ALL overlapping tranches. Tranche 1 at $1,000 and Tranche 2 at $3,000 in the same window: spending $3,000 total meets both.
4. **Status logic:**
   - `pending`: current date < `window_start`
   - `in_progress`: current date within window, spend < `msr_amount`
   - `met`: qualifying spend ≥ `msr_amount`
   - `missed`: current date > `window_end` AND spend < `msr_amount`
5. **Refund handling (D-07):** Refunds (positive amounts) are excluded from qualifying spend but do not reverse progress. If a refund brings the mathematical sum below the threshold after it was previously met, the tranche remains `met`.

#### Monthly Recurring Tranche Computation (D-123)

For tranches with `msr_window_type = monthly_recurring`:

1. **Period calculation:** Each billing period is defined by `Card Instance.statement_close_day`. Period 1 starts at `activation_date`, ends at the next `statement_close_day`. Subsequent periods run statement-close-to-statement-close.
2. **Per-period evaluation:** Each billing period is evaluated independently against `msr_amount`. No carryover between periods.
3. **Posted date governs:** A transaction counts toward the billing period in which its `posted_at` date falls, regardless of `transacted_at`.
4. **Independent pass/fail:** Missing period 3 forfeits that period's bonus but does not affect periods 4 through N. Each period earns or misses its own `bonus_amount` independently.
5. **12th period edge case:** Transactions posting after the final billing period ends do not count toward any period.

#### Computation Example — One-Time Multi-Tranche

Card: TD Aeroplan Visa Infinite, activated 2026-01-15.

Offer tranches:

- Tranche 1: $1,500 in 3 months → 25,000 Aeroplan points (`unlock_month = 1`, `msr_window_months = 3`)
- Tranche 2: $3,000 in 3 months → 25,000 Aeroplan points (`unlock_month = 1`, `msr_window_months = 3`)

Window: 2026-01-15 → 2026-04-14 (both tranches share the same window).

| Date   | Transaction        | Running Total                          |
| ------ | ------------------ | -------------------------------------- |
| Jan 20 | Grocery $200       | $200                                   |
| Feb 5  | Gas $80            | $280                                   |
| Feb 15 | Electronics $1,300 | $1,580                                 |
| Mar 1  | Annual Fee $139    | $1,580 (fee excluded)                  |
| Mar 10 | Dining $120        | $1,700                                 |
| Mar 20 | Refund +$50        | $1,700 (refund excluded, not reversed) |
| Apr 1  | Travel $1,400      | $3,100                                 |

Result:

- Tranche 1 ($1,500): **met** on Feb 15 → auto-create Points Adjustment: 25,000 Aeroplan pts
- Tranche 2 ($3,000): **met** on Apr 1 → auto-create Points Adjustment: 25,000 Aeroplan pts

#### Computation Example — Monthly Recurring

Card: Amex Cobalt, activated 2026-02-10. Statement closes on 15th. `msr_amount = $500/month`, `bonus_amount = 2,500 MR`, `msr_window_months = 12`.

| Period | Window          | Spend | Status | Points   |
| ------ | --------------- | ----- | ------ | -------- |
| 1      | Feb 10 – Mar 14 | $620  | met    | 2,500 MR |
| 2      | Mar 15 – Apr 14 | $380  | missed | 0        |
| 3      | Apr 15 – May 14 | $510  | met    | 2,500 MR |
| …      | …               | …     | …      | …        |

Period 1 excess ($120) does NOT carry to Period 2. Period 2 is evaluated on its own $380.

#### Auto-Create Points Adjustment (D-126)

When a tranche or monthly period status flips to `met`:

1. Create a Points Adjustment record:
   - `rewards_program_id` = Offer → Market Card → Rewards Program
   - `card_instance_id` = the card instance
   - `adjustment_type_id` = `signup_bonus`
   - `amount` = tranche/period `bonus_amount`
   - `date` = the date qualifying spend crossed the threshold
   - `description` = auto-generated (e.g., "Cobalt Period 3 bonus" or "TD Aeroplan Tranche 1 bonus")
2. For monthly recurring: one adjustment per met period (up to `msr_window_months` adjustments total)
3. For one-time: one adjustment per met tranche
4. Idempotent — if the adjustment already exists for this tranche/period, do not create a duplicate

#### Alert Generation

| Alert Type     | Trigger                                    | Timing                                                                         |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| `msr_deadline` | Window/period end approaching, MSR not met | `MSR_DEADLINE_ALERT_DAYS` (System Config, default 14) before window/period end |
| `bonus_met`    | Qualifying spend crosses tranche threshold | Immediately on evaluation                                                      |
| `bonus_missed` | Window/period closes below threshold       | On daily scheduled check                                                       |

Alert entity fields:

- `alert_type_id` = corresponding Alert Type
- `card_instance_id` = the card
- `offer_tranche_id` = the tranche
- `due_date` = window/period end date
- `message` = i18n-templated with card name, tranche number, amount remaining / earned

#### Evaluation Triggers (D-128)

| Trigger                | Evaluates                                                    | Timing                                             |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| Transaction processing | Progress recalculation for the card's in-progress tranches   | After each new transaction is ingested/categorized |
| Daily scheduled check  | Time-based alerts (deadline, missed) across all active cards | Once daily (node-cron)                             |

### 4.2 ENH-006 — Points Balance & Valuation [Enhancement]

**Inputs:** `rewards_program_id` (optional — if omitted, computes all programs)

**Outputs (per rewards program):**

| Field                | Type    | Notes                                                            |
| -------------------- | ------- | ---------------------------------------------------------------- |
| `rewards_program_id` | UUID    |                                                                  |
| `program_name`       | string  |                                                                  |
| `currency_name`      | string  | "points", "MR", "miles"                                          |
| `points_earned`      | integer | From transactions                                                |
| `points_adjusted`    | integer | Net adjustments (signup bonus, referral, transfers, corrections) |
| `points_redeemed`    | integer | Sum of Redemption.points_spent                                   |
| `total_balance`      | integer | `points_earned + points_adjusted - points_redeemed`              |
| `cpp_valuation`      | decimal | From Rewards Program                                             |
| `dollar_value`       | decimal | `total_balance × cpp_valuation / 100`                            |
| `card_breakdown`     | array   | Per-card contribution detail                                     |

**Per-card breakdown:**

| Field              | Type    | Notes                           |
| ------------------ | ------- | ------------------------------- |
| `card_instance_id` | UUID    |                                 |
| `card_name`        | string  | Market Card name                |
| `points_earned`    | integer | From this card's transactions   |
| `points_adjusted`  | integer | Adjustments linked to this card |
| `points_redeemed`  | integer | Redemptions linked to this card |
| `card_total`       | integer | Net for this card               |

**Consumers:**

| Consumer                           | Usage                                                           |
| ---------------------------------- | --------------------------------------------------------------- |
| RPT-001 (Churnboard)               | Points balances section — per-program totals with dollar values |
| RPT-010 (Points Program Dashboard) | Detailed per-program analytics with card breakdowns             |
| ENH-005 (Card Profitability)       | Wave 2 — points earned per card as revenue input                |

#### Points Earned per Transaction

For each Transaction:

1. Determine the card's Market Card
2. Find the Earning Multiplier where:
   - `market_card_id` matches
   - `earning_category_id` matches the transaction's `earning_category_id`
   - `posted_at` falls within `[effective_from, effective_to]` (or `effective_to IS NULL` for current) (D-40)
3. Points = `|transaction.amount| × multiplier`
4. If no earning category is assigned to the transaction, use "Everything Else" multiplier as fallback

**Excluded from points computation (D-129):**

- Transactions with `is_excluded = true`
- Refund transactions (`amount > 0`) — manual corrections via Points Adjustment if needed
- Transactions with `categorization_status = uncategorized` and no earning category assigned — effectively zero points (no multiplier match)

#### Aggregation

- **Per-program:** Sum all card-level totals within the same Rewards Program. This is the primary balance used for valuation and display.
- **Per-card (D-130):** Drill-down showing each Card Instance's contribution. Includes only transactions, adjustments, and redemptions linked to that card.
- **Program-level adjustments/redemptions:** Points Adjustment or Redemption with `card_instance_id = null` are included in the program total but not attributed to any specific card.

#### Dollar Valuation

`dollar_value = total_balance × cpp_valuation / 100`

Where `cpp_valuation` is the user-maintained cents-per-point value on the Rewards Program entity (D-09). Updated in-place (D-40) — changing the CPP immediately revalues the entire balance.

#### Computation Example

Program: Aeroplan (CPP = 1.8).

Cards earning Aeroplan:

- TD Aeroplan: 45,000 pts earned from transactions + 50,000 signup bonus adjustment
- CIBC Aventura: 12,000 pts earned from transactions
- Program-level: 5,000 referral adjustment, −30,000 redemption

| Component                | Points                             |
| ------------------------ | ---------------------------------- |
| TD Aeroplan earned       | 45,000                             |
| TD Aeroplan signup bonus | +50,000                            |
| CIBC Aventura earned     | 12,000                             |
| Referral (program-level) | +5,000                             |
| Redemption               | −30,000                            |
| **Total Balance**        | **82,000**                         |
| **Dollar Value**         | **$1,476.00** (82,000 × 1.8 / 100) |

---

## 5. Business Rules

### ENH-003 — Signup Bonus Tracker

| Rule  | Description                                                                                                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Each Offer Tranche defines an independent MSR window. Window start = `activation_date + (unlock_month - 1) months`. Window duration = `msr_window_months`.                                                       |
| BR-02 | For `msr_window_type = one_time`: qualifying spend = sum of eligible charge transactions within the window. Tranches with the same window are cumulative — spend counts toward all overlapping tranches (D-125). |
| BR-03 | For `msr_window_type = monthly_recurring`: each billing period (based on `statement_close_day`) is evaluated independently. No carryover between periods (D-123).                                                |
| BR-04 | Supplementary card spend rolls up to the parent card for MSR progress (D-02).                                                                                                                                    |
| BR-05 | Fee transactions (Purchase Type = "Credit Card Fee") are excluded from qualifying spend (D-04).                                                                                                                  |
| BR-06 | Refunds (positive amounts) are excluded from qualifying spend but do not reverse previously met progress (D-07).                                                                                                 |
| BR-07 | Tranche status progression: `pending` → `in_progress` → `met` or `missed`. Monthly recurring has per-period status.                                                                                              |
| BR-08 | When a tranche or monthly period flips to `met`, auto-create a Points Adjustment (`adjustment_type = signup_bonus`, `amount = bonus_amount`). One per met period for monthly recurring (D-126).                  |
| BR-09 | Points Adjustment auto-creation is idempotent — no duplicate if adjustment already exists for this tranche/period.                                                                                               |
| BR-10 | `msr_deadline` alert fires when window/period end is within `MSR_DEADLINE_ALERT_DAYS` (System Config, default 14 days) and MSR not yet met (D-127).                                                              |
| BR-11 | `bonus_met` alert fires when qualifying spend crosses the tranche threshold.                                                                                                                                     |
| BR-12 | `bonus_missed` alert fires when a window/period closes below threshold.                                                                                                                                          |
| BR-13 | Progress evaluation triggered by transaction processing (new transactions) and daily scheduled check (time-based alerts) (D-128).                                                                                |

### ENH-006 — Points Balance & Valuation

| Rule  | Description                                                                                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| BR-14 | Points earned per transaction = `                                                                                                                                                       | amount | × earning multiplier` for the transaction's earning category on that card's market card. |
| BR-15 | Multiplier matched by transaction `posted_at` within the multiplier's `[effective_from, effective_to]` range (D-40).                                                                    |
| BR-16 | Base earn rate modeled as an Earning Multiplier row with earning category "Everything Else". Every market card should have this row.                                                    |
| BR-17 | Refund transactions (positive amounts) are excluded from points computation. Manual corrections via Points Adjustment (D-129).                                                          |
| BR-18 | Points Balance per Program = Σ(transaction points) + Σ(Points Adjustments) − Σ(Redemptions.points_spent).                                                                               |
| BR-19 | Per-card breakdown available within each program total (D-130). Program-level adjustments/redemptions (card_instance_id = null) included in program total but not attributed to a card. |
| BR-20 | Dollar valuation = `total_balance × cpp_valuation / 100`. Changing CPP revalues the entire balance immediately.                                                                         |
| BR-21 | No alerts generated by ENH-006.                                                                                                                                                         |

---

## 6. Error Handling

| Condition                                                                         | Response                                                                              | i18n Key Pattern                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------- |
| Card Instance has no activation_date                                              | Skip MSR computation for this card; log WARN                                          | `churning.bonus.noActivationDate`     |
| Card Instance has monthly_recurring tranche but no statement_close_day            | Skip monthly evaluation; generate WARN alert                                          | `churning.bonus.noStatementDay`       |
| Offer Tranche has unlock_month but activation_date would place window in the past | Evaluate normally — status will be `met` or `missed` based on historical transactions | —                                     |
| Earning Multiplier not found for transaction's earning category + card            | Use "Everything Else" multiplier. If that's also missing, log WARN, earn 0 points     | `churning.points.noMultiplier`        |
| CPP valuation is 0 or null on Rewards Program                                     | Dollar value = 0; log WARN                                                            | `churning.points.noCppValuation`      |
| Daily scheduled check fails                                                       | Log ERROR, retry on next scheduled run                                                | `churning.scheduler.evaluationFailed` |
| Duplicate Points Adjustment detected (idempotency check)                          | Skip creation silently; log INFO                                                      | —                                     |

---

## 7. Open Items

| OI    | Resolution                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OI-04 | Card status transition rules remain open — addressed by SPEC-03 (Card Lifecycle). ENH-003 provides the data for WFL-002's Focus→Active trigger but does not own the transition.            |
| OI-06 | Partially resolved. MSR-related alerts (msr_deadline, bonus_met, bonus_missed) defined in this spec. Other alert types (AF renewals, perk expirations) deferred to their respective specs. |

---

## 8. Functional Unit Tests

### FUT-001: Single one-time tranche — in progress

**Covers:** ENH-003

**Preconditions:**

- Card Instance: TD Aeroplan, activated 2026-01-15, Offer Tranche: $1,500 MSR, 3 months, unlock_month = 1
- Transactions: $800 in qualifying spend within window

**Steps:**

1. Evaluate bonus progress for this card

**Expected Result:**

- Status = `in_progress`, qualifying_spend = $800, progress_pct = 0.53, remaining = $700

---

### FUT-002: Single one-time tranche — spend crosses threshold

**Covers:** ENH-003

**Preconditions:**

- Same as FUT-001 but with $1,600 in qualifying spend

**Steps:**

1. New transaction of $800 posted (total now $1,600)
2. ENH-003 evaluates on transaction processing trigger

**Expected Result:**

- Status = `met`, Points Adjustment auto-created (25,000 Aeroplan, type = signup_bonus)
- `bonus_met` alert generated

---

### FUT-003: Multi-tranche overlapping — first met, second in progress

**Covers:** ENH-003

**Preconditions:**

- Offer: Tranche 1 = $1,000 / 3 months, Tranche 2 = $3,000 / 3 months (both unlock_month = 1)
- Qualifying spend: $1,500

**Steps:**

1. Evaluate bonus progress

**Expected Result:**

- Tranche 1: `met` (cumulative $1,500 ≥ $1,000), Points Adjustment created
- Tranche 2: `in_progress` (cumulative $1,500 < $3,000)

---

### FUT-004: Multi-tranche overlapping — both met

**Covers:** ENH-003

**Preconditions:**

- Same tranches as FUT-003, qualifying spend: $3,200

**Steps:**

1. Evaluate bonus progress

**Expected Result:**

- Both tranches `met`, two Points Adjustments created
- Two `bonus_met` alerts generated

---

### FUT-005: Sequential tranche — pending before unlock month

**Covers:** ENH-003

**Preconditions:**

- Card activated 2026-01-15
- Tranche 2: unlock_month = 13, msr_window_months = 1 (month 13 retention bonus)
- Current date: 2026-06-01

**Steps:**

1. Evaluate bonus progress for tranche 2

**Expected Result:**

- Status = `pending`, no progress computation

---

### FUT-006: Sequential tranche — met in month 13 window

**Covers:** ENH-003

**Preconditions:**

- Card activated 2025-01-15, Tranche 2: unlock_month = 13, $1,000 MSR, 1 month
- Current date: 2026-02-10, qualifying spend in window: $1,200

**Steps:**

1. Evaluate bonus progress

**Expected Result:**

- Tranche 2: `met`, Points Adjustment created

---

### FUT-007: Monthly recurring — all periods met

**Covers:** ENH-003

**Preconditions:**

- Amex Cobalt, statement_close_day = 15, 12 periods, $500/month, 2,500 MR/period
- All 12 billing periods have ≥ $500 in qualifying spend

**Steps:**

1. Evaluate all periods

**Expected Result:**

- All 12 periods: `met`
- 12 Points Adjustments created (2,500 MR each = 30,000 total)

---

### FUT-008: Monthly recurring — period 3 missed, periods 4+ met

**Covers:** ENH-003

**Preconditions:**

- Same Cobalt card, period 3 has $380 spend, periods 1-2 and 4-12 all ≥ $500

**Steps:**

1. Evaluate all periods

**Expected Result:**

- Period 3: `missed`, `bonus_missed` alert generated
- 11 periods: `met`, 11 Points Adjustments (27,500 MR total)

---

### FUT-009: Monthly recurring — no carryover between periods

**Covers:** ENH-003

**Preconditions:**

- Cobalt, threshold $500/period
- Period 1: $400 spend, Period 2: $600 spend

**Steps:**

1. Evaluate both periods

**Expected Result:**

- Period 1: `missed` (no carryover of period 2's excess)
- Period 2: `met`

---

### FUT-010: Supplementary card rollup

**Covers:** ENH-003

**Preconditions:**

- Parent card: Amex Cobalt, Tranche 1 = $1,000
- Supp card linked via parent_card_instance_id
- Parent card spend: $600, supp card spend: $500

**Steps:**

1. Evaluate parent card bonus progress

**Expected Result:**

- Qualifying spend = $1,100 (parent $600 + supp $500), status = `met`

---

### FUT-011: Fee transaction excluded from MSR

**Covers:** ENH-003

**Preconditions:**

- Card with $1,000 MSR, qualifying spend = $950
- Annual fee transaction: $139, Purchase Type = "Credit Card Fee"

**Steps:**

1. Evaluate bonus progress

**Expected Result:**

- Qualifying spend = $950 (fee excluded), status = `in_progress`

---

### FUT-012: Refund does not reverse met status

**Covers:** ENH-003

**Preconditions:**

- Card with $1,000 MSR, qualifying spend = $1,050 (status = `met`)
- Refund of +$100 posted

**Steps:**

1. Re-evaluate bonus progress

**Expected Result:**

- Qualifying spend = $1,050 (refund excluded, not reversed), status remains `met`
- No duplicate Points Adjustment created (idempotency)

---

### FUT-013: MSR deadline alert at 14 days

**Covers:** ENH-003

**Preconditions:**

- Card with window ending 2026-03-15, MSR not met
- System Config: MSR_DEADLINE_ALERT_DAYS = 14
- Current date: 2026-03-01 (14 days before)

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- `msr_deadline` alert generated with due_date = 2026-03-15

---

### FUT-014: No alert at 15 days before deadline

**Covers:** ENH-003

**Preconditions:**

- Same as FUT-013 but current date = 2026-02-28 (15 days before)

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- No alert generated

---

### FUT-015: Configurable deadline days via System Config

**Covers:** ENH-003

**Preconditions:**

- System Config: MSR_DEADLINE_ALERT_DAYS changed to 7
- Window ending 2026-03-15, current date = 2026-03-08

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- `msr_deadline` alert generated (7 days before window end)

---

### FUT-016: Window closes below threshold — bonus missed

**Covers:** ENH-003

**Preconditions:**

- Tranche: $2,000 MSR, window ended yesterday, qualifying spend = $1,500

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- Status = `missed`, `bonus_missed` alert generated

---

### FUT-017: Spend crosses threshold mid-window — bonus met alert

**Covers:** ENH-003

**Preconditions:**

- Tranche: $1,000 MSR, window active, qualifying spend = $950

**Steps:**

1. New $100 transaction ingested (total now $1,050)

**Expected Result:**

- Status = `met`, `bonus_met` alert generated, Points Adjustment created

---

### FUT-018: Points earned with category multiplier

**Covers:** ENH-006

**Preconditions:**

- Amex Cobalt with Earning Multiplier: Dining = 5×
- Transaction: $100 dining charge

**Steps:**

1. Compute points for this transaction

**Expected Result:**

- 500 points earned (100 × 5)

---

### FUT-019: Points earned with base rate (Everything Else)

**Covers:** ENH-006

**Preconditions:**

- Amex Cobalt with Earning Multiplier: Everything Else = 1×
- Transaction: $100 charge, earning_category = Everything Else

**Steps:**

1. Compute points for this transaction

**Expected Result:**

- 100 points earned (100 × 1)

---

### FUT-020: Time-bound multiplier change

**Covers:** ENH-006

**Preconditions:**

- Card with Dining multiplier: 5× (effective_from = 2025-01-01, effective_to = 2026-06-30) and 3× (effective_from = 2026-07-01, effective_to = null)
- Transaction A: $50 dining, posted 2026-06-15
- Transaction B: $50 dining, posted 2026-07-15

**Steps:**

1. Compute points for both transactions

**Expected Result:**

- Transaction A: 250 points (50 × 5)
- Transaction B: 150 points (50 × 3)

---

### FUT-021: Refund excluded from points

**Covers:** ENH-006

**Preconditions:**

- Card with Dining = 5×
- Transaction: +$50 refund from restaurant

**Steps:**

1. Compute points for this transaction

**Expected Result:**

- 0 points (refund excluded from computation)

---

### FUT-022: Points Adjustments net correctly

**Covers:** ENH-006

**Preconditions:**

- Program: Membership Rewards
- Adjustments: signup_bonus +10,000, referral +5,000, transfer_out −3,000

**Steps:**

1. Compute points balance for MR program

**Expected Result:**

- Net adjustments = +12,000

---

### FUT-023: Redemption reduces balance

**Covers:** ENH-006

**Preconditions:**

- Program: Aeroplan, earned 50,000 pts
- Redemption: 20,000 points_spent

**Steps:**

1. Compute points balance

**Expected Result:**

- Total balance = 30,000

---

### FUT-024: Two cards in same program — aggregated balance

**Covers:** ENH-006

**Preconditions:**

- TD Aeroplan card: 45,000 pts earned
- CIBC Aventura card: 12,000 pts earned
- Both earning into Aeroplan program

**Steps:**

1. Compute Aeroplan program balance

**Expected Result:**

- Program total = 57,000 pts earned

---

### FUT-025: Per-card breakdown within program

**Covers:** ENH-006

**Preconditions:**

- Same as FUT-024

**Steps:**

1. Request per-card breakdown for Aeroplan

**Expected Result:**

- TD Aeroplan: 45,000 pts
- CIBC Aventura: 12,000 pts

---

### FUT-026: CPP dollar valuation

**Covers:** ENH-006

**Preconditions:**

- Aeroplan: cpp_valuation = 1.8, balance = 50,000 pts

**Steps:**

1. Compute dollar value

**Expected Result:**

- Dollar value = $900.00 (50,000 × 1.8 / 100)

---

### FUT-027: Auto-created signup bonus reflected in balance

**Covers:** ENH-003, ENH-006

**Preconditions:**

- TD Aeroplan card, Tranche 1 met → ENH-003 auto-created Points Adjustment: 25,000 Aeroplan pts

**Steps:**

1. Compute Aeroplan balance

**Expected Result:**

- Balance includes the 25,000 pts from auto-created adjustment

---

## 9. Cross-Spec Notes

| Target Spec                      | Note                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC-01 (Ingestion Pipeline)     | New transactions trigger ENH-003 progress evaluation as part of transaction processing.                                                                                                                                 |
| SPEC-02 (Transaction Processing) | Churning metrics use full `transaction.amount`, not `my_share_amount` from splits. Fee transactions identified by Purchase Type = "Credit Card Fee" (D-04).                                                             |
| SPEC-03 (Card Lifecycle)         | ENH-003 provides tranche progress data for WFL-002's Focus→Active transition. All tranches `met` is the trigger condition.                                                                                              |
| SPEC-06 (Reference Data & Seed)  | Alert types seeded: msr_deadline, bonus_met, bonus_missed. Adjustment type seeded: signup_bonus. System Config key: MSR_DEADLINE_ALERT_DAYS. Every Market Card should have an "Everything Else" Earning Multiplier row. |
| SPEC-08 (Card Profitability)     | ENH-005 consumes per-card points earned from ENH-006 as a revenue input.                                                                                                                                                |
| SPEC-07 (Card Recommendation)    | ENH-002 factors remaining MSR from ENH-003 into card recommendations.                                                                                                                                                   |
| SPEC-19 (Churnboard)             | RPT-001 displays bonus progress (ENH-003) and points balances (ENH-006) sections.                                                                                                                                       |

---

_This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects ENH-003, ENH-006 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-123–D-130 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md)._
