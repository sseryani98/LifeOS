# SPEC-07: Card Recommendation

**Spec ID:** SPEC-07
**Name:** Card Recommendation
**FRICEW Objects:** ENH-002, RPT-006
**Wave:** 2
**Sprint:** W2-S1
**CDS Services:** ChurningService
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                       |
| ---------- | --------------- | ----------------------------------------------------------------- |
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-136 through D-141 logged. |

---

## 2. Overview

ENH-002 (Card Recommendation Engine) answers the question: "Which card should I use for this purchase category?" It compares the effective earn rate across all eligible cards by normalizing multipliers through CPP valuations, enabling cross-program comparison. When a card has an active signup bonus with remaining MSR, the engine can override the default recommendation if the bonus value per remaining dollar exceeds the earning rate difference (D-06).

RPT-006 (Card Recommendation Matrix) is the primary visualization of ENH-002's output — a matrix of all eligible cards × all earning categories with effective earn rates, heat map coloring, optimal card highlighting, and bonus override inline context. It includes a "Your Wallet" summary card and a "Top 5 Yields" section.

Key decisions: D-06 (recommendation logic), D-40 (time-bound multipliers), D-136 (bonus override formula), D-137 (eligible card states), D-138 (nearest tranche for override), D-139 (tie-breaking order), D-140 (RPT-006 UX — heat map, wallet summary, max yield column, sticky headers, cell popover), D-141 (Earning Category object page yield table — SPEC-06 amendment).

---

## 3. Data Model References

| Entity             | Role                                                       | DM-001 Ref | Amendment? |
| ------------------ | ---------------------------------------------------------- | ---------- | ---------- |
| Market Card        | Card product — links to issuer, program, multipliers       | §4.1       | —          |
| Earning Multiplier | Per-card per-category multiplier with time-bounding        | §4.5       | —          |
| Card Instance      | User's card — lifecycle state, activation date, offer link | §4.4       | —          |
| Earning Category   | Multiplier buckets cards earn against                      | §3.4       | —          |
| Rewards Program    | CPP valuation for dollar normalization                     | §3.2       | —          |
| Offer Tranche      | MSR thresholds and bonus amounts for override calc         | §4.3       | —          |
| Offer              | Links card instance to offer terms                         | §4.2       | —          |

### DM-001 Amendments

None. SPEC-07 consumes existing entities without modification.

### SPEC-06 Amendment — Earning Category Object Page (D-141)

Earning Category in FRM-009 is promoted from inline-edit-only (D-93) to object page navigation. The object page includes:

- **Header:** Name, sort order (editable)
- **Yield table:** Read-only table showing all eligible cards ranked by effective earn rate for that earning category. Columns: card name, rewards program, multiplier, CPP, effective earn rate (¢/$). Base rates only — no bonus override context. Powered by ENH-002's single-category query mode.

---

## 4. Functional Description

### 4.1 ENH-002 — Card Recommendation Engine [Enhancement]

#### Card Eligibility (D-137)

A card is eligible for recommendation when:

- `lifecycle_state` is `Focus`, `Active`, or `To Cancel`
- `activation_date` is set (not null)

`Closed` cards and cards without `activation_date` are excluded.

#### Effective Earn Rate Calculation

For each eligible card × earning category combination:

1. Find the current Earning Multiplier where:
   - `market_card_id` matches the card's Market Card
   - `earning_category_id` matches the target category
   - Current date falls within `[effective_from, effective_to]` (or `effective_to IS NULL`) (D-40)
2. If no specific multiplier exists, fall back to the "Everything Else" multiplier for that market card
3. If "Everything Else" is also missing, effective earn rate = 0
4. Compute: `effective_earn_rate = multiplier × cpp_valuation / 100` (cents per dollar)

This normalizes across programs — a 5× MR at 2.0 CPP (10.0¢/$) is directly comparable to a 3× Aeroplan at 1.8 CPP (5.4¢/$).

#### Default Recommendation

For a given earning category, the card with the highest `effective_earn_rate` is recommended.

#### Bonus Override (D-06, D-136)

For cards with an in-progress MSR tranche (status = `in_progress` from ENH-003):

1. Identify the **nearest achievable tranche** — the in-progress tranche with the lowest `remaining_msr` (D-138)
2. Compute bonus value per remaining dollar:

   ```
   bonus_value_per_dollar = (bonus_amount × cpp_valuation / 100) / remaining_msr
   ```

3. Override the default recommendation when:

   ```
   bonus_value_per_dollar + card_earn_rate > best_card_earn_rate
   ```

   Where `best_card_earn_rate` is the highest effective earn rate among all cards (without bonus).

For `monthly_recurring` tranches: use the current in-progress period's `remaining_msr` and that period's `bonus_amount`.

#### Computation Example — Bonus Override

Card A: Amex Cobalt, Dining = 5× MR at 2.0 CPP → 10.0¢/$, no active MSR.

Card B: TD Aeroplan, Dining = 1.5× at 1.8 CPP → 2.7¢/$. In-progress MSR: $500 remaining, 25,000 pts bonus.

| Component          | Card A  | Card B                               |
| ------------------ | ------- | ------------------------------------ |
| Base earn rate     | 10.0¢/$ | 2.7¢/$                               |
| Bonus value/dollar | —       | (25,000 × 1.8 / 100) / 500 = 90.0¢/$ |
| Total effective    | 10.0¢/$ | 92.7¢/$                              |

**Result:** Card B recommended with bonus override flag. Every dollar spent on Card B toward its MSR is worth 92.7¢ in total value.

#### Computation Example — Override Does Not Trigger

Card A: Cobalt, Groceries = 5× MR at 2.0 CPP → 10.0¢/$.

Card B: CIBC Aventura, Groceries = 1× at 1.5 CPP → 1.5¢/$. In-progress MSR: $3,000 remaining, 5,000 pts bonus.

| Component          | Card A  | Card B                               |
| ------------------ | ------- | ------------------------------------ |
| Base earn rate     | 10.0¢/$ | 1.5¢/$                               |
| Bonus value/dollar | —       | (5,000 × 1.5 / 100) / 3,000 = 2.5¢/$ |
| Total effective    | 10.0¢/$ | 4.0¢/$                               |

**Result:** Card A remains recommended. The bonus override is insufficient (4.0¢/$ < 10.0¢/$).

#### Tie-Breaking (D-139)

When two or more cards have equal effective earn rate (including bonus override):

1. Prefer card with in-progress MSR (accelerates bonus completion)
2. Prefer `Focus` over `Active` over `To Cancel`
3. Alphabetical by Market Card name

#### Query Modes

ENH-002 exposes two query modes:

**Single-category mode:**

- **Input:** `earning_category_id`
- **Output:**

| Field                   | Type   | Notes                         |
| ----------------------- | ------ | ----------------------------- |
| `earning_category_id`   | UUID   |                               |
| `earning_category_name` | string |                               |
| `recommendations`       | array  | Ranked list of eligible cards |

Per card in `recommendations`:

| Field                    | Type    | Notes                      |
| ------------------------ | ------- | -------------------------- |
| `card_instance_id`       | UUID    |                            |
| `card_name`              | string  | Market Card name           |
| `rewards_program_name`   | string  |                            |
| `multiplier`             | decimal | Raw multiplier             |
| `cpp_valuation`          | decimal | Program's CPP              |
| `effective_earn_rate`    | decimal | ¢/$                        |
| `is_recommended`         | boolean | True for top card          |
| `has_bonus_override`     | boolean | True if override is active |
| `remaining_msr`          | decimal | Null if no active MSR      |
| `msr_days_remaining`     | integer | Null if no active MSR      |
| `bonus_value_per_dollar` | decimal | Null if no active MSR      |

**Full-matrix mode:**

- **Input:** None
- **Output:** Array of single-category results for all earning categories, plus:

| Field            | Type  | Notes                                                                   |
| ---------------- | ----- | ----------------------------------------------------------------------- |
| `wallet_summary` | array | Optimal card distribution — card name + count of categories won         |
| `top_yields`     | array | Top 5 highest earn rate combinations (category × card), base rates only |

**Consumers:**

| Consumer                               | Query Mode      | Usage                                   |
| -------------------------------------- | --------------- | --------------------------------------- |
| RPT-006 (Card Recommendation Matrix)   | Full matrix     | Primary visualization                   |
| FRM-002 (Transaction Entry)            | Single category | Card recommendation during manual entry |
| RPT-001 (Churnboard)                   | Full matrix     | Card recommendation section             |
| FRM-009 (Earning Category object page) | Single category | Yield table on Earning Category detail  |

### 4.2 RPT-006 — Card Recommendation Matrix [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

#### Layout

**"Your Wallet" Summary Card** — full-width card at the top showing the optimal card distribution:

- Lists each card that wins at least one category
- Shows the count of categories each card is optimal for
- E.g., "Cobalt (6 categories) · TD Aeroplan (5 categories) · CIBC Aventura (3 categories)"

**Recommendation Matrix** — full-width card:

- **Rows:** Earning categories, sorted by `sort_order`. "Everything Else" included as the last row.
- **Columns:** Eligible cards, sorted by issuer name then card name. Column headers show card name, rewards program, and CPP valuation (e.g., "Amex Cobalt | MR | 2.0¢").
- **Max Yield column:** An additional column showing the best earn rate per category row across all cards. Available via Fiori personalization (variant management) — shown by default.
- **Sticky column headers:** Card names remain visible when scrolling through categories.
- **Cell content:**
  - Multiplier (e.g., "5×")
  - Effective earn rate (e.g., "10.0¢/$")
  - For bonus override cells: inline MSR context subtitle (e.g., "$320 left · 18 days")
- **Heat map gradient (D-140):** Cell background color intensity proportional to effective earn rate. Higher earn rate = more saturated color. Provides instant visual read of value concentrations across the matrix.
- **Best card highlighting:** The optimal card per category row receives a distinct highlight (green/bold border) in addition to the heat map coloring.
- **Bonus override indicator:** Override cells use a distinct icon or highlight color (separate from the standard "best card" green) to indicate the recommendation is temporary.
- **Cell click popover:** Clicking any cell shows a detail popover with full breakdown: multiplier, program, CPP, earn rate calculation, and bonus override math if applicable.

**Top 5 Yields Section** — half-width card:

- Ranked list of the 5 highest effective earn rate combinations across all categories × all cards
- Shows: rank, earning category, card name, multiplier, effective earn rate
- Base rates only — no bonus overrides in this section

#### Controls

- No period selector — matrix always reflects current multipliers and current MSR status
- Variant management for column personalization (show/hide cards, show/hide Max Yield column)

---

## 5. Business Rules

### ENH-002 — Card Recommendation Engine

| Rule  | Description                                                                                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Eligible cards: `lifecycle_state` in (`Focus`, `Active`, `To Cancel`) AND `activation_date IS NOT NULL`. `Closed` cards excluded (D-137).                                               |
| BR-02 | Effective earn rate = `multiplier × cpp_valuation / 100` (cents per dollar). Normalizes across programs (D-136).                                                                        |
| BR-03 | If no Earning Multiplier exists for a card × category, fall back to "Everything Else" multiplier. If that's also missing, earn rate = 0.                                                |
| BR-04 | Multiplier selected by current date within `[effective_from, effective_to]` range (D-40). Recommendations always reflect current rates.                                                 |
| BR-05 | Default recommendation: card with the highest effective earn rate for the given category.                                                                                               |
| BR-06 | Bonus override: `bonus_value_per_dollar = (bonus_amount × cpp_valuation / 100) / remaining_msr`. Override when `bonus_value_per_dollar + card_earn_rate > best_card_earn_rate` (D-136). |
| BR-07 | Multiple in-progress tranches: use the nearest achievable tranche (lowest `remaining_msr`) for override calculation (D-138).                                                            |
| BR-08 | Monthly recurring tranches: use current in-progress period's remaining MSR and that period's `bonus_amount` for override calculation.                                                   |
| BR-09 | Tie-breaking (equal effective earn rate): in-progress MSR > `Focus` > `Active` > `To Cancel` > alphabetical by card name (D-139).                                                       |
| BR-10 | Two query modes: single-category (ranked card list) and full-matrix (all categories × all cards, wallet summary, top 5 yields).                                                         |
| BR-11 | Wallet summary: count of categories each eligible card is the optimal choice for. Includes bonus override wins.                                                                         |
| BR-12 | Top 5 Yields: ranked by effective earn rate (base rates only, no bonus override), across all category × card combinations.                                                              |

### RPT-006 — Card Recommendation Matrix

| Rule  | Description                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-13 | Matrix orientation: earning categories as rows (sorted by `sort_order`), cards as columns (sorted by issuer name, then card name) (D-140). |
| BR-14 | Column headers: card name, rewards program, CPP valuation.                                                                                 |
| BR-15 | Each cell shows: multiplier and effective earn rate. Bonus override cells add inline MSR context (remaining amount, days left).            |
| BR-16 | Heat map gradient: cell background intensity proportional to effective earn rate across the matrix (D-140).                                |
| BR-17 | Best card per category row highlighted with distinct visual indicator (green/bold).                                                        |
| BR-18 | Bonus override cells use a separate visual treatment (distinct icon/color) to indicate the recommendation is temporary.                    |
| BR-19 | "Everything Else" category included as a row — shows base rate comparison across all cards.                                                |
| BR-20 | Max Yield column shows best earn rate per category. Available via personalization, shown by default (D-140).                               |
| BR-21 | "Your Wallet" summary card above matrix shows optimal card distribution with category counts (D-140).                                      |
| BR-22 | Top 5 Yields section shows 5 highest earn rate combinations, base rates only (D-140).                                                      |
| BR-23 | Sticky column headers — card names visible while scrolling (D-140).                                                                        |
| BR-24 | Cell click popover shows full calculation breakdown (D-140).                                                                               |
| BR-25 | No period selector — always reflects current state.                                                                                        |

---

## 6. Error Handling

| Condition                                                               | Response                                                        | i18n Key Pattern                                |
| ----------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Card has no `activation_date`                                           | Excluded from eligible cards; not an error                      | —                                               |
| No "Everything Else" multiplier for a card                              | Earn rate = 0 for unmatched categories; log WARN                | `churning.recommendation.noBaseMultiplier`      |
| CPP valuation is 0 or null on Rewards Program                           | Effective earn rate = 0 for all cards in that program; log WARN | `churning.recommendation.noCppValuation`        |
| ENH-003 data unavailable for bonus override check                       | Skip bonus override for that card; use base rate only; log WARN | `churning.recommendation.bonusDataUnavailable`  |
| No eligible cards                                                       | Empty result set; RPT-006 shows empty state with `noDataText`   | `churning.recommendation.noEligibleCards`       |
| Earning Multiplier has overlapping date ranges for same card × category | Use the most recent `effective_from`; log WARN                  | `churning.recommendation.overlappingMultiplier` |

---

## 7. Open Items

None. All design questions resolved during workshop.

---

## 8. Functional Unit Tests

### FUT-001: Basic recommendation — highest earn rate wins

**Covers:** ENH-002

**Preconditions:**

- Card A: Amex Cobalt, MR program (CPP 2.0), Dining multiplier = 5× → 10.0¢/$
- Card B: TD Aeroplan (CPP 1.8), Dining multiplier = 3× → 5.4¢/$
- Both Active, no in-progress MSR

**Steps:**

1. Query ENH-002 for Dining category

**Expected Result:**

- Card A recommended (10.0¢/$ > 5.4¢/$)

---

### FUT-002: Cross-program normalization

**Covers:** ENH-002

**Preconditions:**

- Card A: Amex Bonvoy (CPP 0.8), Dining = 5× → 4.0¢/$
- Card B: TD Aeroplan (CPP 1.8), Dining = 3× → 5.4¢/$

**Steps:**

1. Query for Dining

**Expected Result:**

- Card B recommended (5.4¢/$ > 4.0¢/$) despite lower multiplier — CPP normalization flips the result

---

### FUT-003: Bonus override triggers

**Covers:** ENH-002

**Preconditions:**

- Card A: Cobalt, Dining = 5× at 2.0 CPP → 10.0¢/$, no MSR
- Card B: TD Aeroplan, Dining = 1.5× at 1.8 CPP → 2.7¢/$, in-progress MSR: $500 remaining, 25,000 pts bonus
- Bonus value/dollar = (25,000 × 1.8 / 100) / 500 = 90.0¢/$
- Card B total = 90.0¢ + 2.7¢ = 92.7¢/$ > Card A's 10.0¢/$

**Steps:**

1. Query for Dining

**Expected Result:**

- Card B recommended with bonus override flag

---

### FUT-004: Bonus override does NOT trigger — insufficient value

**Covers:** ENH-002

**Preconditions:**

- Card A: Cobalt, Groceries = 5× at 2.0 CPP → 10.0¢/$
- Card B: CIBC Aventura, Groceries = 1× at 1.5 CPP → 1.5¢/$, in-progress MSR: $3,000 remaining, 5,000 pts bonus
- Bonus value/dollar = (5,000 × 1.5 / 100) / 3,000 = 2.5¢/$
- Card B total = 2.5¢ + 1.5¢ = 4.0¢/$ < Card A's 10.0¢/$

**Steps:**

1. Query for Groceries

**Expected Result:**

- Card A recommended (no override)

---

### FUT-005: Multiple in-progress tranches — nearest used

**Covers:** ENH-002

**Preconditions:**

- Card B: Two overlapping tranches. Tranche 1: remaining = $200, bonus = 25,000 pts. Tranche 2: remaining = $2,200, bonus = 25,000 pts
- CPP = 1.8, Dining = 1.5× → 2.7¢/$
- Nearest tranche bonus/dollar = (25,000 × 1.8 / 100) / 200 = 225.0¢/$

**Steps:**

1. Query for Dining

**Expected Result:**

- Override uses Tranche 1 ($200 remaining), not Tranche 2

---

### FUT-006: Monthly recurring — current period used

**Covers:** ENH-002

**Preconditions:**

- Cobalt: monthly recurring $500/period, 2,500 MR/period, CPP 2.0
- Current period spend = $300, remaining = $200
- Bonus value/dollar = (2,500 × 2.0 / 100) / 200 = 25.0¢/$
- Cobalt Dining = 5× → 10.0¢/$, total = 35.0¢/$
- Competing card: 5.4¢/$ for Dining

**Steps:**

1. Query for Dining

**Expected Result:**

- Cobalt recommended with override flag (35.0¢/$ > 5.4¢/$)

---

### FUT-007: Tie-breaking — MSR in-progress wins

**Covers:** ENH-002

**Preconditions:**

- Card A: Aeroplan, Groceries = 1.5× at 1.8 CPP → 2.7¢/$, no MSR, Active
- Card B: Aeroplan (different card), Groceries = 1.5× at 1.8 CPP → 2.7¢/$, MSR in-progress, Focus

**Steps:**

1. Query for Groceries

**Expected Result:**

- Card B recommended (in-progress MSR wins tie)

---

### FUT-008: Tie-breaking — Focus beats Active (no MSR)

**Covers:** ENH-002

**Preconditions:**

- Card A: Active, no MSR, Dining = 3× at 1.8 CPP
- Card B: Focus, no MSR, Dining = 3× at 1.8 CPP

**Steps:**

1. Query for Dining

**Expected Result:**

- Card B recommended (Focus > Active)

---

### FUT-009: "Everything Else" fallback

**Covers:** ENH-002

**Preconditions:**

- Card A: has Streaming multiplier = 3×
- Card B: no Streaming multiplier, "Everything Else" = 1×
- Both same program/CPP

**Steps:**

1. Query for Streaming

**Expected Result:**

- Card A recommended. Card B appears with 1× (fallback), not 0.

---

### FUT-010: Closed card excluded

**Covers:** ENH-002

**Preconditions:**

- Card A: Closed, Dining = 10× (highest rate)
- Card B: Active, Dining = 3×

**Steps:**

1. Query for Dining

**Expected Result:**

- Card B recommended. Card A not in results.

---

### FUT-011: Card without activation_date excluded

**Covers:** ENH-002

**Preconditions:**

- Card A: Focus, activation_date = null
- Card B: Active, activation_date set

**Steps:**

1. Query for any category

**Expected Result:**

- Only Card B in results

---

### FUT-012: No eligible cards — empty result

**Covers:** ENH-002

**Preconditions:**

- All cards have lifecycle_state = Closed

**Steps:**

1. Query for any category

**Expected Result:**

- Empty recommendations array, no card marked as recommended

---

### FUT-013: Full matrix query

**Covers:** ENH-002

**Preconditions:**

- 3 eligible cards, 4 earning categories (Dining, Groceries, Gas, Everything Else)

**Steps:**

1. Query full matrix (no category input)

**Expected Result:**

- 4 rows × 3 cards matrix returned
- Each category row has one optimal card marked
- Wallet summary present with card distribution
- Top 5 yields present (up to 12 combinations available, returns top 5)

---

### FUT-014: Matrix displays bonus override with inline context

**Covers:** RPT-006

**Preconditions:**

- Card A: best base rate for Dining (10.0¢/$)
- Card B: lower base rate (3.0¢/$) but MSR override wins. $320 remaining, 18 days left.

**Steps:**

1. View RPT-006

**Expected Result:**

- Dining row shows Card B highlighted with override indicator
- Card B cell shows earn rate + "$320 left · 18 days" inline
- Heat map gradient visible across all cells

---

### FUT-015: Top 5 Yields section

**Covers:** RPT-006

**Preconditions:**

- 5 cards × 8 categories with varying earn rates

**Steps:**

1. View RPT-006

**Expected Result:**

- Top 5 Yields section shows 5 highest effective earn rate combinations, ranked descending
- Base rates only (no bonus overrides reflected)

---

### FUT-016: "Everything Else" row in matrix

**Covers:** RPT-006

**Preconditions:**

- 3 cards with "Everything Else" multipliers of 1×, 1.5×, 2×

**Steps:**

1. View RPT-006

**Expected Result:**

- "Everything Else" appears as the last row in the matrix
- All three cards' base rates displayed
- Card with 2× highlighted as best

---

## 9. Cross-Spec Notes

| Target Spec                      | Note                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SPEC-04 (Bonus & Points)         | ENH-002 consumes ENH-003's per-tranche progress data (`remaining_msr`, `status`, `days_remaining`) for bonus override calculation.                                                                                                                                       |
| SPEC-06 (Reference Data & Seed)  | Amendment: Earning Category promoted from inline-edit to object page in FRM-009 (D-141). Object page includes a yield table powered by ENH-002's single-category query mode. Base rates only. Every Market Card should have an "Everything Else" Earning Multiplier row. |
| SPEC-02 (Transaction Processing) | Earning Category assigned on transactions determines which multiplier applies for ENH-002's earn rate comparison.                                                                                                                                                        |
| SPEC-17 (Transaction Entry)      | FRM-002 consumes ENH-002 single-category mode to display card recommendation during manual transaction entry.                                                                                                                                                            |
| SPEC-19 (Churnboard)             | RPT-001 has a "card recommendation by category" section consuming ENH-002's full-matrix output.                                                                                                                                                                          |
| SPEC-08 (Card Profitability)     | ENH-005 is independent from ENH-002 but both share multiplier and CPP data. No direct dependency.                                                                                                                                                                        |

---

_This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects ENH-002, RPT-006 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-136–D-141 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md)._
