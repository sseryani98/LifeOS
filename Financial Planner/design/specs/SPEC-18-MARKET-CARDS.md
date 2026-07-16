# SPEC-18: Market Cards

**Spec ID:** SPEC-18
**Version:** 1.0
**Date:** 2026-02-20
**Status:** Approved
**Sprint:** W3-S1

---

## 1. Change History

| Date       | Author          | Description                                                                           |
| ---------- | --------------- | ------------------------------------------------------------------------------------- |
| 2026-02-20 | Sandro & Claude | Initial creation — workshop output.                                                   |
| 2026-02-20 | Claude          | FUT renumbering: FUT-190–197 → FUT-191–198 to resolve collision with SPEC-17 FUT-190. |

---

## 2. Overview

### 2.1 Scope

Fiori Elements List Report + Object Page for the Market Card product catalog. Full CRUD with computed offer metrics (First Year Value, First Year Price, Required Spend), historical offer timeline chart, quick-compare action, and "Mark as Discontinued" lifecycle action.

### 2.2 FRICEW Objects

| ID      | Name         | Type | Wave |
| ------- | ------------ | ---- | ---- |
| FRM-005 | Market Cards | Form | 3    |

### 2.3 CDS Service & Module

|                 |                                                                   |
| --------------- | ----------------------------------------------------------------- |
| **CDS Service** | ChurningService (`/service/churningSvcs`)                         |
| **Module**      | `srv/modules/churning/`                                           |
| **Files**       | `ChurningFacade.ts`, `ChurningService.ts`, `ChurningValidator.ts` |

### 2.4 Consumers

| Consumer                                      | Usage                                                     |
| --------------------------------------------- | --------------------------------------------------------- |
| SPEC-03 FRM-006 (Card Onboarding)             | Value help selects from active Market Cards (BR-22)       |
| SPEC-07 ENH-002 (Card Recommendation)         | Reads earning multipliers for recommendation calculations |
| SPEC-08 ENH-005 (Card Profitability)          | Reads Market Card fee data for profitability computation  |
| SPEC-16 ENH-004 (Eligibility Engine)          | Reads eligibility_group for cooldown rules                |
| SPEC-13 WFL-003/CNV-004 (Market Intelligence) | Creates/updates Market Cards via scraping                 |

### 2.5 Dependencies

| Dependency                            | Usage                                               |
| ------------------------------------- | --------------------------------------------------- |
| SPEC-06 CNV-002 (Reference Data Seed) | Issuers, Card Networks, Rewards Programs must exist |
| SPEC-06 CNV-003 (Market Card Seed)    | ~10 initial Market Cards seeded                     |

---

## 3. Data Model References

### 3.1 Entities Used

| Entity               | Section  | Usage                                                      |
| -------------------- | -------- | ---------------------------------------------------------- |
| Market Card          | DM §4.1  | Primary entity — full CRUD                                 |
| Offer                | DM §4.2  | Child entity — create/edit offers per Market Card          |
| Offer Tranche        | DM §4.3  | Child of Offer — multi-tranche bonus definition            |
| Earning Multiplier   | DM §4.5  | Read/edit — category-based earn rates                      |
| Soft Perk Definition | DM §4.6  | Read/edit — non-monetary card benefits                     |
| Card Instance        | DM §4.4  | Read-only — linked user cards                              |
| Issuer               | DM §3.1  | Navigation — FK display                                    |
| Card Network         | DM §3.13 | Navigation — FK display                                    |
| Rewards Program      | DM §3.2  | Navigation — FK display, cpp_valuation for FYV computation |
| Program Tier         | DM §3.16 | Navigation — FK display                                    |

### 3.2 DM Amendments (DM-001)

| Entity      | Change                                                                   | Decision |
| ----------- | ------------------------------------------------------------------------ | -------- |
| Market Card | + `status` (enum: `active` · `discontinued`, required, default `active`) | D-270    |
| Offer       | + `is_current` (boolean, required, default `false`)                      | D-271    |
| Offer       | + `offer_url` (text, optional)                                           | D-272    |

---

## 4. Functional Description

### 4.1 Page Type

Fiori Elements List Report + Object Page (D-268). Full CRUD. Side navigation entry under **Churning — Cards** group.

### 4.2 List Report

**Columns:**

| Column           | Source                     | Computed | Notes                                                                 |
| ---------------- | -------------------------- | -------- | --------------------------------------------------------------------- |
| Name             | `name`                     | No       | Primary identifier                                                    |
| Issuer           | `issuer_id` (nav)          | No       |                                                                       |
| Card Network     | `card_network_id` (nav)    | No       |                                                                       |
| Card Type        | `card_type`                | No       | Credit / Charge                                                       |
| Card Segment     | `card_segment`             | No       | Personal / Business                                                   |
| Fee Amount       | `fee_amount`               | No       | Standard fee                                                          |
| Fee Structure    | `fee_structure`            | No       | Annual / Monthly                                                      |
| Rewards Program  | `rewards_program_id` (nav) | No       |                                                                       |
| Status           | `status`                   | No       | ObjectStatus — positive for active, negative for discontinued (BR-21) |
| First Year Value | computed                   | Yes      | Dollar value from current offer (BR-12)                               |
| First Year Price | computed                   | Yes      | Effective year-1 fee from current offer (BR-11)                       |
| Required Spend   | computed                   | Yes      | Total MSR from current offer (BR-13)                                  |

**Filters:** One filter field per column. Default filter: `status = active` (BR-20).

**Actions:**

| Action  | Trigger        | Notes                                  |
| ------- | -------------- | -------------------------------------- |
| Create  | Toolbar button | Standard Fiori create                  |
| Compare | Toolbar button | Enabled when 2–3 rows selected (BR-25) |

### 4.3 Object Page Layout

**Header:** Card name, issuer, network, type/segment, fee, rewards program, status, eligibility group hidden (D-273).

**Section 1 — Current Offer**

| Field        | Control         | Notes                                                  |
| ------------ | --------------- | ------------------------------------------------------ |
| Offer Name   | Input           |                                                        |
| FYF          | Checkbox        | First Year Free                                        |
| Start Date   | DatePicker      |                                                        |
| End Date     | DatePicker      |                                                        |
| Source       | Input           | Human-readable label (e.g., "Prince of Travel")        |
| Offer URL    | Input (link)    | Clickable URL (D-272)                                  |
| Fee Override | Input (decimal) | Offer-specific fee_amount; blank = use Market Card fee |
| Is Current   | Checkbox        | Auto-toggles others off (BR-07)                        |

**Tranche sub-table:**

| Column            | Notes                        |
| ----------------- | ---------------------------- |
| Tranche #         | Sequential                   |
| MSR Amount        | Per-window minimum spend     |
| MSR Window Type   | one_time / monthly_recurring |
| MSR Window Months | Duration                     |
| Bonus Amount      | Points awarded               |
| Unlock Month      | Delayed start (optional)     |

**Computed summary (read-only):**

| Metric           | Computation |
| ---------------- | ----------- |
| First Year Value | BR-12       |
| First Year Price | BR-11       |
| Required Spend   | BR-13       |

**Section 2 — Earning Multipliers**

Table: Earning Category, multiplier value, card_instance_id (optional override per SPEC-03), effective dates.

**Section 3 — Soft Perks**

Table: Perk Type, description, card_instance_id (optional override per SPEC-03), effective dates.

**Section 4 — Offer History**

ApexCharts stepped area chart (D-274):

| Aspect              | Detail                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| X-axis              | Time (2023 → present)                                                        |
| Y-axis              | First Year Value (dollar)                                                    |
| Series              | Stepped area — each offer spans `offer_start_date` to `offer_end_date`       |
| FYF indicator       | Hatched/patterned overlay for first-year-free periods                        |
| Best Ever line      | Horizontal reference line at all-time highest FYV (D-275)                    |
| Card Instance bands | Shaded bands for user's hold periods (activation → closed/present) (D-276)   |
| Hover popover       | Required Spend, First Year Price, FYF status, raw bonus points, offer source |

Detail table below chart with all offers + tranche breakdown.

**Section 5 — Linked Card Instances**

Read-only table: Card Instance name, lifecycle state, activation date, closed date, offer name. Click navigates to FRM-004.

**Section 6 — Scraper Info (read-only)**

| Field            | Source                       | Notes     |
| ---------------- | ---------------------------- | --------- |
| Source URL       | `source_url` (SPEC-13)       | Read-only |
| Last Scrape Hash | `last_scrape_hash` (SPEC-13) | Read-only |

### 4.4 Actions

| Action               | Location            | Behavior                                                    |
| -------------------- | ------------------- | ----------------------------------------------------------- |
| Create               | List toolbar        | Standard Fiori create                                       |
| Edit                 | Object page         | Standard Fiori edit                                         |
| Delete               | Object page footer  | Confirmation dialog. Blocked if Card Instances exist.       |
| Mark as Discontinued | Object page toolbar | Sets `status = discontinued` (BR-03, BR-04)                 |
| Compare              | List toolbar        | Opens side-by-side comparison of 2–3 selected cards (BR-25) |

### 4.5 Navigation

| Direction | From → To                      | Trigger               |
| --------- | ------------------------------ | --------------------- |
| Outbound  | Card Instance row → FRM-004    | Row click             |
| Outbound  | Issuer → FRM-009               | Header link           |
| Outbound  | Rewards Program → FRM-009      | Header link           |
| Inbound   | FRM-006 value help → FRM-005   | Market Card selection |
| Inbound   | RPT-001 (Churnboard) → FRM-005 | Card link             |

---

## 5. Business Rules

### Market Card CRUD

| Rule  | Description                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Market Card `name` must be unique across all Market Cards.                                                                         |
| BR-02 | Market Card `status` defaults to `active` on creation.                                                                             |
| BR-03 | A Market Card can only be marked `discontinued` if it has zero Card Instances in `Focus` or `Active` lifecycle state.              |
| BR-04 | Discontinued Market Cards are excluded from FRM-006 value help, ENH-002 (recommendation engine), and ENH-004 (eligibility engine). |
| BR-05 | Market Card `fee_amount` represents the standard fee; an Offer's `fee_amount` overrides it for that specific offer period.         |

### Offer Management

| Rule  | Description                                                                                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-06 | Each Market Card can have at most one Offer with `is_current = true` at any time.                                                                                                                                                                                     |
| BR-07 | Setting `is_current = true` on an Offer automatically sets `is_current = false` on all other Offers for the same Market Card.                                                                                                                                         |
| BR-08 | Deleting an Offer that has `is_current = true` is allowed — the Market Card will have no current offer (triggers BR-19 warning).                                                                                                                                      |
| BR-09 | An Offer must have at least one Offer Tranche.                                                                                                                                                                                                                        |
| BR-10 | Offer Tranche `tranche_number` must be unique within an Offer and sequential starting from 1.                                                                                                                                                                         |
| BR-11 | First Year Price = $0 if `Offer.fyf = true`, otherwise `Offer.fee_amount` if set, otherwise `MarketCard.fee_amount`.                                                                                                                                                  |
| BR-12 | First Year Value = sum of year-1 eligible tranche bonus points × `RewardsProgram.cpp_valuation / 100`. For `one_time` tranches: full `bonus_amount` if `unlock_month` is null or ≤ 12. For `monthly_recurring` tranches: `bonus_amount × min(msr_window_months, 12)`. |
| BR-13 | Required Spend = sum across all tranches: for `one_time`: `msr_amount`; for `monthly_recurring`: `msr_amount × msr_window_months`.                                                                                                                                    |

### Chart & Display

| Rule  | Description                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-14 | Offer History chart shows all Offers for the Market Card from 2023 to present, plotted by `offer_start_date` to `offer_end_date`.                                                |
| BR-15 | Offers with null `offer_start_date` are excluded from the chart but included in the detail table below.                                                                          |
| BR-16 | Chart Y-axis displays First Year Value (dollar). Hover popover shows: Required Spend, First Year Price, FYF status, raw bonus points, offer source.                              |
| BR-17 | "Best Ever" reference line = the highest FYV across all Offers for this Market Card. If current offer FYV ≥ best ever, display "Best Offer Ever" badge on Current Offer section. |
| BR-18 | Card Instance periods (activation_date → closed_date, or present if still open) are overlaid as shaded bands on the chart.                                                       |
| BR-19 | If a Market Card has no Offer with `is_current = true`, display an ObjectStatus warning on the list row and a MessageStrip warning on the object page.                           |

### Navigation & Filtering

| Rule  | Description                                                                                                                                                                      |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-20 | List report default filter: `status = active`. User can clear to see discontinued cards.                                                                                         |
| BR-21 | Discontinued Market Cards display with ObjectStatus "Discontinued" (negative semantic) on the list row.                                                                          |
| BR-22 | FRM-006 value help only shows Market Cards where `status = active`.                                                                                                              |
| BR-23 | Scraper Info section (`source_url`, `last_scrape_hash`) is read-only on the object page — not editable via FRM-005.                                                              |
| BR-24 | `eligibility_group` is not exposed on FRM-005 UI.                                                                                                                                |
| BR-25 | Quick-compare action is enabled when 2–3 Market Cards are selected on the list. Comparison displays FYV, First Year Price, Required Spend, and Earning Multipliers side-by-side. |

---

## 6. Error Handling

| Condition                              | Response                                     | i18n Key                                |
| -------------------------------------- | -------------------------------------------- | --------------------------------------- |
| Duplicate Market Card name             | Field-level error on name                    | `marketCard.error.duplicateName`        |
| Discontinue with active Card Instances | Error dialog listing active instances        | `marketCard.error.activeInstancesExist` |
| Delete with any Card Instances         | Error dialog — cannot delete                 | `marketCard.error.instancesExist`       |
| Offer saved without tranches           | Error — at least one tranche required        | `marketCard.error.offerRequiresTranche` |
| Tranche number not sequential          | Error on tranche_number field                | `marketCard.error.trancheNotSequential` |
| No Rewards Program + FYV computation   | FYV displays $0 (no cpp_valuation available) | —                                       |
| Compare with < 2 or > 3 selected       | Button disabled (preventive)                 | —                                       |

---

## 7. Open Items

No open items resolved by this spec. OI-06 (alerts): FRM-005 does not generate alerts — offer-related alerts are handled by SPEC-13 (Market Intelligence), card-level alerts by SPEC-03 (Card Lifecycle).

---

## 8. Functional Unit Tests

### FUT-191: Create a Market Card

**Covers:** FRM-005

**Preconditions:**

- Reference data seeded (Issuers, Card Networks, Rewards Programs)

**Steps:**

1. Navigate to Market Cards list
2. Click "Create"
3. Fill: name "TD Aeroplan Visa Infinite", issuer "TD", network "Visa", type "credit", segment "personal", fee structure "annual", fee amount 139.00, rewards program "Aeroplan"
4. Save

**Expected Result:**

- Market Card created with `status = active`
- Appears in list
- No-current-offer warning shown (BR-19)

---

### FUT-192: Create an Offer with Tranches

**Covers:** FRM-005

**Preconditions:**

- FUT-191 Market Card exists

**Steps:**

1. Open Market Card "TD Aeroplan Visa Infinite"
2. Navigate to Current Offer section
3. Create Offer: name "Feb 2026: 80k Aeroplan", FYF = true, start date 2026-02-01, end date 2026-04-30, source "Amex.ca", offer_url "<https://example.com/offer/123>"
4. Add Tranche 1: msr_amount 6000, window one_time, months 3, bonus 80000
5. Mark `is_current = true`
6. Save

**Expected Result:**

- Offer created with is_current = true
- FYV = 80000 × Aeroplan cpp / 100
- First Year Price = $0 (FYF)
- Required Spend = $6,000
- No-current-offer warning cleared

---

### FUT-193: is_current Auto-Toggle

**Covers:** FRM-005

**Preconditions:**

- FUT-192 offer exists with `is_current = true`

**Steps:**

1. Create second offer on same Market Card
2. Mark `is_current = true`
3. Save

**Expected Result:**

- New offer is current
- FUT-192 offer now has `is_current = false` (BR-07)

---

### FUT-194: Mark as Discontinued

**Covers:** FRM-005

**Preconditions:**

- Market Card exists with no Card Instances in Focus or Active state

**Steps:**

1. Open Market Card
2. Click "Mark as Discontinued"

**Expected Result:**

- Status changes to `discontinued`
- ObjectStatus negative shown on list (BR-21)
- Card no longer appears in FRM-006 value help (BR-22)

---

### FUT-195: Discontinued Blocked by Active Card Instance

**Covers:** FRM-005

**Preconditions:**

- Market Card has a Card Instance in `Active` lifecycle state

**Steps:**

1. Open Market Card
2. Click "Mark as Discontinued"

**Expected Result:**

- Error — cannot discontinue while active Card Instances exist (BR-03)

---

### FUT-196: Offer History Chart

**Covers:** FRM-005

**Preconditions:**

- Market Card with 3+ offers (varying FYV), one Card Instance period

**Steps:**

1. Open Market Card
2. Scroll to Offer History section

**Expected Result:**

- Stepped area chart showing all offers with dates
- Best Ever reference line at highest FYV (BR-17)
- Card Instance period shown as shaded band (BR-18)
- Offers without start dates excluded from chart but visible in table (BR-15)

---

### FUT-197: Quick-Compare

**Covers:** FRM-005

**Preconditions:**

- 3 active Market Cards with current offers

**Steps:**

1. Select 3 cards on list
2. Click "Compare"

**Expected Result:**

- Side-by-side view showing FYV, First Year Price, Required Spend, Earning Multipliers for each (BR-25)

---

### FUT-198: Unique Name Validation

**Covers:** FRM-005

**Preconditions:**

- Market Card "TD Aeroplan Visa Infinite" exists

**Steps:**

1. Create new Market Card with name "TD Aeroplan Visa Infinite"
2. Save

**Expected Result:**

- Error — name must be unique (BR-01)

---

## 9. UX Enhancements

| ID      | Enhancement                                                                                                                                                                 | Decision |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| ENH-001 | **"Best Ever" indicator** — Horizontal reference line on Offer History chart at all-time highest FYV. "Best Offer Ever" badge on Current Offer section when current ≥ best. | D-275    |
| ENH-002 | **Card Instance bands on chart** — Shaded bands overlaying hold periods (activation → closed/present) on the Offer History timeline.                                        | D-276    |
| ENH-003 | **Quick-compare from list** — Multi-select 2–3 cards, Compare action opens side-by-side FYV, price, spend, multipliers.                                                     | D-277    |
| ENH-004 | **No Current Offer warning** — ObjectStatus warning on list row + MessageStrip on object page when no offer has `is_current = true`.                                        | D-278    |
