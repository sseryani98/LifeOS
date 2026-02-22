# SPEC-03: Card Lifecycle

**Spec ID:** SPEC-03
**Name:** Card Lifecycle
**FRICEW Objects:** FRM-004, FRM-006, WFL-002, WFL-004 (absorbed by FRM-006)
**Wave:** 1
**Sprint:** W1-S5
**CDS Services:** ChurningService (FRM-004, FRM-006, WFL-002)
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-20 | Sandro & Claude | Initial creation — workshop complete. D-188 through D-208 logged. |
| 2026-02-20 | Sandro | Approved. |
| 2026-02-20 | Claude | SPEC-21 amendment: Remove FRM-004 Section 4 (Redemptions). Sections 5–8 renumber to 4–7 (D-280). |

---

## 2. Overview

SPEC-03 covers the full card journey: onboarding a new card via a freestyle wizard (FRM-006), managing cards through their lifecycle states (WFL-002), and browsing/editing the card portfolio (FRM-004). WFL-004 (New Card Setup) is absorbed into FRM-006 — the wizard handles end-to-end orchestration including SimpleFIN linking and bonus tracking initiation.

The card lifecycle state machine has four states — Focus, Active, To Cancel, Closed — with 7 valid transitions. Focus→Active is auto-triggered when all bonus tranches are met (ENH-003, SPEC-04) or when all MSR windows expire. Cards without offers start directly at Active. Supplementary cards have independent lifecycles but cascade-close when the parent is closed.

Key decisions: D-03 (register first), D-21 (soft perk tracking), D-24 (multi-tranche), D-25 (card type/segment), D-27/D-41 (FYF on Offer), D-29 (encrypted details), D-33 (Amex supp workaround), D-37 (offer belongs to market card), D-39 (supp card self-reference), D-60 (lifecycle colors), D-188 (WFL-004 absorbed), D-189 (state machine transitions), D-190 (CVV split), D-191 (fee_amount on Offer), D-192 (instance-level overrides), D-193 (supp card lifecycle), D-194 (delete rules), D-195 (AF alert), D-196 (cancel reminder), D-197 (no-offer cards), D-198 (auto-Active on bonus_missed), D-199 (estimated first year value), D-200 (lifetime value gain), D-201 (fee history computed), D-202 (supp card rollup), D-203 (list primary only), D-204 (UX enhancements), D-205 (mutable fields), D-206 (Active→Closed direct), D-207 (every column filterable), D-208 (supp card offers).

---

## 3. Data Model References

| Entity | Role | DM-001 Ref | Amendment? |
|--------|------|------------|------------|
| Card Instance | Central entity — lifecycle state, card details, encrypted fields | §4.4 | `cvv_enc` → `cvv_front_enc` + `cvv_back_enc` |
| Market Card | Card product reference for onboarding | §4.1 | — |
| Offer | Signup offer terms, linked to Card Instance | §4.2 | Add `fee_amount` |
| Offer Tranche | MSR thresholds per offer | §4.3 | — |
| Earning Multiplier | Per-category earn rates | §4.5 | Add optional `card_instance_id` |
| Soft Perk Definition | Card perks | §4.6 | Add optional `card_instance_id` |
| Card Perk | Instance-level perk utilization tracking | §4.7 | — |
| Provider Account | SimpleFIN account → card mapping | §4.13 | — |
| Alert | AF approaching, cancel reminder | §6.1 | — |
| Alert Type | New seed values | §3.11 | Add `af_approaching`, `cancel_reminder` (total: 13) |
| System Config | Alert timing parameters | §3.17 | Add `AF_ALERT_DAYS`, `CANCEL_REMINDER_DAYS` |

### DM-001 Amendments

**1. Card Instance — CVV field split (D-190)**

Remove `cvv_enc`. Add:

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| `cvv_front_enc` | String (encrypted) | no | Front CVV (Amex 4-digit CID) |
| `cvv_back_enc` | String (encrypted) | no | Back CVV (3-digit) |

**2. Offer — fee_amount (D-191)**

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| `fee_amount` | Decimal(15,2) | no | Defaults from Market Card's `fee_amount` during onboarding. Overridable per offer. |

**3. Earning Multiplier — instance override (D-192)**

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| `card_instance_id` | UUID (FK → Card Instance) | no | If set, this is an instance-level override. Takes precedence over market card defaults. |

**4. Soft Perk Definition — instance override (D-192)**

| New Attribute | Type | Required | Notes |
|---------------|------|----------|-------|
| `card_instance_id` | UUID (FK → Card Instance) | no | Same pattern as Earning Multiplier. Instance override takes precedence over market card defaults. |

**5. System Config — new parameters**

| Key | Default | Description |
|-----|---------|-------------|
| `AF_ALERT_DAYS` | `30` | Days before AF date to create `af_approaching` alert |
| `CANCEL_REMINDER_DAYS` | `2` | Days before tentative cancel date to create `cancel_reminder` alert |

---

## 4. Functional Description

### 4.1 WFL-002 — Card Lifecycle [Workflow]

**State Diagram:**

```
                        ┌────────────────────────────┐
                        │                            │
  FRM-006 (with offer)  │  Focus                     │
  ───────────────────►   │  (tracking bonus progress) │
                        │                            │
                        └──┬──────────┬──────────┬───┘
                           │          │          │
              All tranches │  Manual  │  Manual  │
              met OR all   │          │          │
              MSR expired  │          │          │
                           ▼          │          │
                        ┌─────────┐   │          │
  FRM-006 (no offer)    │         │   │          │
  ───────────────────►   │ Active  │◄──┘          │
                        │         │◄──┐          │
                        └──┬──┬───┘   │          │
                           │  │       │          │
                   Manual  │  │Manual │ Reversal │
                           │  │       │          │
                           │  │  ┌────┴──────┐   │
                           │  │  │           │   │
                           │  └─►│ To Cancel │───┘
                           │     │           │
                           │     └─────┬─────┘
                           │           │
                           │   Manual  │
                           │           │
                           ▼           ▼
                        ┌────────────────┐
                        │                │
                        │  Closed        │
                        │  (terminal)    │
                        │                │
                        └────────────────┘
```

**Transitions:**

| # | From | To | Trigger | Guard | Side Effects |
|---|------|----|---------|-------|--------------|
| 1 | Focus | Active | Auto — all offer tranches met (ENH-003) | ENH-003 reports all tranches `met` | — |
| 2 | Focus | Active | Auto — all MSR windows expired | ENH-003 reports all tranches `missed` | — |
| 3 | Focus | Active | Immediate — no offer on card | Card created without offer via FRM-006 | — |
| 4 | Focus | To Cancel | Manual | `tentative_cancel_date` required | Create `cancel_reminder` alert |
| 5 | Focus | Closed | Manual | `closed_date` required | Dismiss all alerts, unlink Provider Account, cascade close supp cards |
| 6 | Active | To Cancel | Manual | `tentative_cancel_date` required | Create `cancel_reminder` alert |
| 7 | Active | Closed | Manual | `closed_date` required | Dismiss all alerts, unlink Provider Account, cascade close supp cards |
| 8 | To Cancel | Active | Manual (reversal) | — | Clear `tentative_cancel_date`, dismiss `cancel_reminder` alert |
| 9 | To Cancel | Closed | Manual | `closed_date` required | Clear `tentative_cancel_date`, dismiss all alerts, unlink Provider Account, cascade close supp cards |

**Lifecycle State Colors (D-60):**

| State | Semantic | Color |
|-------|----------|-------|
| Focus | Information | Blue |
| Active | Success | Green |
| To Cancel | Warning | Orange |
| Closed | None | Grey |

**Supplementary Card Lifecycle (D-193):**

- Supp cards have independent lifecycle states
- Supp cards can have their own offers and go through Focus → Active
- Closing a parent cascades Closed to all child supp cards (same side effects per child)
- A supp card can be closed independently without affecting the parent

### 4.2 FRM-006 — Card Onboarding [Form — Freestyle Wizard]

**Wizard Steps:**

| Step | Name | Required | Description |
|------|------|----------|-------------|
| 1 | Select Market Card | Yes | Searchable value help against existing Market Cards. No inline creation — use FRM-005 first. |
| 2 | Define Offer Terms | No | Defaults from market card's current active offer (latest by `offer_start_date` where `offer_end_date` is null or future). Skippable if no bonus. |
| 3 | Enter Card Details | Yes | Card instance attributes. `activation_date` is required. |
| 4 | SimpleFIN Link | No | Connect a Provider Account (FRM-010 flow from SPEC-01). |
| 5 | Supplementary Cards | No | Add supp cards. Reuses FRM-006 with Market Card locked and `parent_card_instance_id` set. |

**Step 2 — Offer Terms Fields:**

| Field | Source | Editable | Notes |
|-------|--------|----------|-------|
| Offer name | Defaulted from active offer | Yes | |
| FYF | Defaulted from active offer | Yes | Boolean |
| fee_amount | Defaulted from Market Card's `fee_amount` | Yes | Overridable per offer (D-191) |
| Source | — | Yes | Free text |
| Notes | — | Yes | Free text |
| Tranches (table) | Defaulted from active offer's tranches | Yes | Add/remove/edit rows |

**Tranche Row Fields:** `tranche_number`, `msr_amount`, `msr_window_type`, `msr_window_months`, `bonus_amount`, `unlock_month`

**Step 3 — Card Details Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| activation_date | Date | Yes | |
| credit_limit | Decimal | No | |
| card_number_enc | String (encrypted) | No | |
| cvv_front_enc | String (encrypted) | No | Amex 4-digit CID |
| cvv_back_enc | String (encrypted) | No | 3-digit CVV |
| expiry_date_enc | String (encrypted) | No | |
| cardholder_name | String | No | |
| statement_close_day | Integer (1–31) | No | Required for monthly_recurring tranches (SPEC-04) |

**Estimated First Year Value (D-199):**

Displayed as a live-updating summary in the wizard:

```
Estimated First Year Value = SUM(tranche bonus_amounts)
                           + SUM(soft perk dollar_values)
                           − first year fee
```

Where first year fee = 0 if FYF, else offer `fee_amount`.

Soft perk values sourced from Market Card's Soft Perk Definitions (current effective).

**Save Behavior:**

- Atomic transaction: creates Card Instance + Offer + Offer Tranches (if offer defined)
- Initial `lifecycle_state`: Focus (if offer exists), Active (if no offer)
- After save: SPEC-01 resolves queued unmatched transactions if SimpleFIN linked, SPEC-04 begins bonus tracking if in Focus

**Supplementary Card Creation (D-208):**

Two entry points, same wizard:

1. **From FRM-006 Step 5** — optional during primary card onboarding
2. **From FRM-004 object page** — "Add Supplementary Card" action

Both open FRM-006 with Market Card pre-filled/locked and `parent_card_instance_id` auto-set. Supp cards can have their own offers, fees, and encrypted card details.

### 4.3 FRM-004 — My Cards [Form — Fiori Elements]

**List Page:**

| Column | Source | Visible by Default | Filterable |
|--------|--------|--------------------|------------|
| Card Name | Market Card → `name` | Yes | Yes |
| Issuer | Market Card → Issuer → `name` | Yes | Yes |
| Lifecycle State | Card Instance → `lifecycle_state` (ObjectStatus, D-60 colors) | Yes | Yes |
| Activation Date | Card Instance → `activation_date` | Yes | Yes |
| Annual Fee | Offer → `fee_amount` | Yes | Yes |
| Credit Limit | Card Instance → `credit_limit` | Yes | Yes |
| Rewards Program | Market Card → Rewards Program → `name` | Yes | Yes |
| Next AF Date | Computed: `activation_date + N×12 months` | Yes | Yes |
| Estimated Value Gain | Computed: lifetime points earned + perks realized − fees paid | Yes | Yes |
| Bonus Progress | ENH-003: e.g., "2/3 tranches met" or "Complete" | Yes | Yes |
| Card Network | Market Card → Card Network → `name` | Yes | Yes |
| Total Points Earned | Computed from transactions + adjustments | Yes | Yes |
| Tentative Cancel Date | Card Instance → `tentative_cancel_date` | No (p13n) | Yes |

**List Behavior:**

- Shows primary cards only (`parent_card_instance_id` is null) (D-203)
- Default variant: all lifecycle states except Closed (Closed remains selectable) (D-207)
- Default sort: `activation_date` descending
- Every column has a corresponding filter (D-207)
- Variant management enabled (D-62)
- Search bar (Fiori Elements built-in)

**Inline Actions (from list):**

| Action | Visible When |
|--------|-------------|
| Mark To Cancel | Focus or Active |
| Close Card | Focus, Active, or To Cancel |

**Object Page (scrolling, per D-62):**

**Header:** Card name, issuer, lifecycle state (ObjectStatus), card network, rewards program, activation date, next AF date, estimated value gain, AF countdown ("X days until next AF") (D-204)

**Sections:**

| # | Section | Content |
|---|---------|---------|
| 1 | Overview | Card details (credit limit, statement close day, cardholder name, FYF status), offer summary with tranche table, encrypted fields (card number, CVV1, CVV2, expiry — reveal on click) |
| 2 | Bonus Progress | Tranche table from ENH-003 (SPEC-04), MSR progress bars, deadlines |
| 3 | Earning & Perks | Earning multipliers table + soft perks with utilization tracking. Overridable per instance (D-192). |
| 4 | Fee History | Computed timeline from activation_date + fee data. Year 1: $0 if FYF, else fee_amount. Subsequent years: fee_amount. Not linked to transactions. (D-201) |
| 5 | Supplementary Cards | Child Card Instances table. "Add Supplementary Card" action. Points/fees roll up to parent totals. (D-202) |
| 6 | Lifecycle Timeline | Visual timeline of state transitions with dates (D-204) |
| 7 | Analytics | Monthly spend trend, earning category breakdown, points earned over time, bonus progress timeline. Includes supp card data (D-202). |

**Object Page Actions:**

| Action | Visible When | Effect |
|--------|-------------|--------|
| Mark To Cancel | Focus or Active | Prompts for `tentative_cancel_date`, transitions state |
| Close Card | Focus, Active, or To Cancel | Prompts for `closed_date`, transitions to Closed |
| Reactivate | To Cancel | Reverses to Active, clears `tentative_cancel_date` |
| Add Supplementary Card | Not Closed | Opens FRM-006 with Market Card locked, parent set |
| Edit Card Details | Not Closed | Inline edit of mutable fields |
| Link SimpleFIN Account | Not Closed & unlinked | Opens FRM-010 flow |
| Unlink SimpleFIN Account | Not Closed & linked | Removes Provider Account mapping |
| Delete Card | Any state | Deletes card if zero transactions (BR-30–BR-32) |

**Mutable Fields (D-205):**

| Field | Editable | Notes |
|-------|----------|-------|
| Market Card | No | Fundamental identity — delete and re-create |
| Offer / Tranches | Yes | User might correct terms |
| Activation Date | Yes | Correction |
| Credit Limit | Yes | Limit increases |
| Statement Close Day | Yes | Could change |
| Cardholder Name | Yes | Rare |
| Card Number (enc) | Yes | Card renewal |
| CVV1 / CVV2 (enc) | Yes | Card renewal |
| Expiry (enc) | Yes | Card renewal |
| Lifecycle State | No | Changed via actions only |
| Parent Card Instance | No | Structural — set at creation |

**Onboarding Completion Summary (D-204):**

After FRM-006 wizard saves, display a summary card:

- Card name and lifecycle state
- Estimated First Year Value
- Quick-action links: "Link SimpleFIN Account", "Add Supplementary Card", "View Card"

### 4.4 WFL-004 — New Card Setup [Workflow — Absorbed]

WFL-004 is absorbed by FRM-006 (D-188). The onboarding wizard handles the full orchestration:

1. FRM-006 creates the Card Instance (Focus or Active)
2. Optional SimpleFIN link via FRM-010 (step 4)
3. SPEC-01 resolves queued unmatched transactions on link
4. SPEC-04 begins bonus tracking if card is in Focus

No separate WFL-004 implementation. Traceability preserved — WFL-004 maps to FRM-006's end-to-end flow.

---

## 5. Business Rules

### WFL-002 — Card Lifecycle

| Rule | Description |
|------|-------------|
| BR-01 | `lifecycle_state` enum: `Focus`, `Active`, `To Cancel`, `Closed`. |
| BR-02 | Valid transitions: Focus→Active, Focus→To Cancel, Focus→Closed, Active→To Cancel, Active→Closed, To Cancel→Active, To Cancel→Closed. Any other transition SHALL be rejected. |
| BR-03 | Closed is terminal — no outbound transitions allowed. |
| BR-04 | Focus→Active auto-triggers when all offer tranches are met (ENH-003 trigger, SPEC-04). |
| BR-05 | Focus→Active auto-triggers when all MSR windows have expired (bonus_missed). |
| BR-06 | Card Instance with no offer SHALL start at Active, not Focus. |
| BR-07 | Active→To Cancel and Focus→To Cancel require `tentative_cancel_date`. |
| BR-08 | To Cancel→Active SHALL clear `tentative_cancel_date` and dismiss the `cancel_reminder` alert. |
| BR-09 | Any transition to Closed SHALL set `closed_date`, dismiss all open alerts for the card, and unlink the Provider Account (if linked). |
| BR-10 | Closing a parent card SHALL cascade Closed to all supplementary cards, applying BR-09 side effects to each. |

### FRM-006 — Card Onboarding

| Rule | Description |
|------|-------------|
| BR-11 | Market Card selection is required. Value help against existing Market Cards only — no inline creation. |
| BR-12 | Offer step is optional — skippable if no bonus. |
| BR-13 | Offer terms SHALL default from Market Card's current active offer (latest by `offer_start_date` where `offer_end_date` is null or future). |
| BR-14 | Offer `fee_amount` SHALL default from Market Card's `fee_amount`, overridable by user. |
| BR-15 | `activation_date` is required. |
| BR-16 | Wizard save SHALL be atomic: Card Instance + Offer + Offer Tranches created in a single transaction. |
| BR-17 | Estimated First Year Value = SUM(tranche `bonus_amount`) + SUM(soft perk `dollar_value`) − first year fee (0 if FYF, else offer `fee_amount`). Live-updating in wizard. |
| BR-18 | Supplementary card creation SHALL reuse FRM-006 with Market Card pre-filled/locked and `parent_card_instance_id` auto-set. |
| BR-19 | Multiple Card Instances for the same Market Card are allowed (re-churning). |

### FRM-004 — My Cards

| Rule | Description |
|------|-------------|
| BR-20 | List page SHALL show only primary cards (`parent_card_instance_id` is null). |
| BR-21 | Default variant SHALL filter `lifecycle_state` to exclude Closed. Closed remains selectable. |
| BR-22 | Every list column SHALL have a corresponding filter. |
| BR-23 | Default sort: `activation_date` descending. |
| BR-24 | Supplementary cards SHALL be displayed only in the parent's Supplementary Cards section, not in the list. |
| BR-25 | Supplementary card points and fees SHALL roll up into the parent card's analytics and totals (Estimated Value Gain, Total Points Earned). |
| BR-26 | Market Card is immutable after creation. All other fields are mutable via Edit or lifecycle actions. |
| BR-27 | Encrypted fields (card number, CVV1, CVV2, expiry) SHALL be editable post-creation. |
| BR-28 | Fee History SHALL be a computed timeline from `activation_date` + fee data, not linked to transactions. |
| BR-29 | Estimated Value Gain = lifetime total points earned + perks realized − total fees paid. |

### Delete

| Rule | Description |
|------|-------------|
| BR-30 | Card Instance deletion SHALL be allowed only if zero transactions are assigned. |
| BR-31 | Delete SHALL cascade to: Offer, Tranches, instance-level Earning Multiplier/Soft Perk Definition overrides, Card Perks, Alerts. Provider Account SHALL be unlinked (not deleted). |
| BR-32 | Parent delete SHALL be blocked if any supplementary card has transactions. |

### Alerts

| Rule | Description |
|------|-------------|
| BR-33 | `af_approaching` alert SHALL be created `AF_ALERT_DAYS` (default 30) days before the next AF date. |
| BR-34 | Next AF date = `activation_date` + N×12 months, where N is the smallest positive integer placing the date in the future. |
| BR-35 | `cancel_reminder` alert SHALL be created `CANCEL_REMINDER_DAYS` (default 2) days before `tentative_cancel_date`. Alert persists until card leaves To Cancel state. |

### Overrides

| Rule | Description |
|------|-------------|
| BR-36 | Earning Multiplier and Soft Perk Definition support instance-level overrides via optional `card_instance_id`. |
| BR-37 | Instance-level overrides SHALL take precedence over Market Card defaults when displaying or computing for a card instance. |
| BR-38 | No auto-copy on onboarding. Instance overrides are created only when the user explicitly edits a value on the FRM-004 object page. |

---

## 6. Error Handling

| Condition | Response | i18n Key Pattern |
|-----------|----------|------------------|
| Invalid state transition attempted | Reject with current state and attempted target | `card.lifecycle.invalidTransition` |
| `tentative_cancel_date` missing on To Cancel transition | Validation error | `card.lifecycle.cancelDateRequired` |
| `closed_date` missing on Close transition | Validation error | `card.lifecycle.closeDateRequired` |
| Market Card not selected in wizard | Validation error | `card.onboarding.marketCardRequired` |
| `activation_date` missing in wizard | Validation error | `card.onboarding.activationDateRequired` |
| Delete attempted with assigned transactions | Reject with transaction count | `card.delete.hasTransactions` |
| Parent delete attempted with supp card transactions | Reject listing which supp cards have transactions | `card.delete.suppCardHasTransactions` |
| Cascade close fails on supp card | Transaction rolled back, parent remains in original state | `card.lifecycle.cascadeCloseFailed` |
| Provider Account unlink fails on close | Log warning, proceed with close (non-blocking) | `card.lifecycle.unlinkWarning` |

---

## 7. Open Items

| OI | Resolution |
|----|------------|
| OI-04 | Resolved. Card status transition rules fully defined — 4 states, 7 transitions (9 including auto-triggers), guards, and side effects specified in §4.1. |
| OI-06 | Two alert types defined: `af_approaching`, `cancel_reminder`. Added to Alert Type seed (total now 13 across all specs). |

---

## 8. Functional Unit Tests

### FUT-301: Onboard card with offer — auto-transition Focus to Active

**Covers:** FRM-006, WFL-002
**Preconditions:** Market Card "TD Aeroplan VI" exists with active offer (1 tranche, $1,500 MSR).

**Steps:**

1. Complete FRM-006 wizard with offer terms.
2. Simulate ENH-003 detecting all tranches met.

**Expected Result:** Card Instance created in Focus. After ENH-003 trigger, `lifecycle_state` = Active. No manual intervention required.

---

### FUT-302: Onboard card without offer — starts Active

**Covers:** FRM-006, WFL-002 (BR-06)
**Preconditions:** Market Card exists, no active offer.

**Steps:**

1. Complete FRM-006 wizard, skip offer step.

**Expected Result:** Card Instance created with `lifecycle_state` = Active.

---

### FUT-303: Active → To Cancel → Closed happy path

**Covers:** FRM-004, WFL-002 (BR-07, BR-09)
**Preconditions:** Card Instance in Active state.

**Steps:**

1. Mark To Cancel, set `tentative_cancel_date` = 2025-04-10.
2. Close Card, set `closed_date` = 2025-04-10.

**Expected Result:** Step 1: `cancel_reminder` alert created. Step 2: all alerts dismissed, Provider Account unlinked, `lifecycle_state` = Closed.

---

### FUT-304: To Cancel → Active reversal

**Covers:** FRM-004, WFL-002 (BR-08)
**Preconditions:** Card Instance in To Cancel with `tentative_cancel_date` and `cancel_reminder` alert.

**Steps:**

1. Reactivate card.

**Expected Result:** `lifecycle_state` = Active. `tentative_cancel_date` = null. `cancel_reminder` alert dismissed.

---

### FUT-305: Focus → Closed directly

**Covers:** FRM-004, WFL-002 (BR-02)
**Preconditions:** Card Instance in Focus.

**Steps:**

1. Close Card, provide `closed_date`.

**Expected Result:** `lifecycle_state` = Closed. All alerts dismissed. Provider Account unlinked.

---

### FUT-306: Auto-transition Focus → Active on bonus_missed

**Covers:** WFL-002 (BR-05)
**Preconditions:** Card in Focus, all MSR windows expired, ENH-003 fires `bonus_missed`.

**Steps:**

1. System detects all tranche windows expired.

**Expected Result:** `lifecycle_state` auto-transitions to Active.

---

### FUT-307: Invalid transition rejected

**Covers:** WFL-002 (BR-03)
**Preconditions:** Card Instance in Closed state.

**Steps:**

1. Attempt Reactivate action.

**Expected Result:** Error: invalid transition. Card remains Closed.

---

### FUT-308: Offer defaults from Market Card's active offer

**Covers:** FRM-006 (BR-13, BR-14)
**Preconditions:** Market Card "Amex Cobalt" with active offer (3 tranches, FYF=true, fee $155.88/yr on Market Card).

**Steps:**

1. Start FRM-006, select Amex Cobalt.

**Expected Result:** Offer terms auto-populated: 3 tranches, FYF=true, `fee_amount`=$155.88. All editable.

---

### FUT-309: Onboard with custom offer overrides

**Covers:** FRM-006 (BR-13, BR-14)
**Preconditions:** Market Card with active offer (2 tranches, `fee_amount`=$199).

**Steps:**

1. Start FRM-006, select card, modify to 1 tranche, change `fee_amount` to $99.

**Expected Result:** Card Instance created with custom offer (1 tranche, `fee_amount`=99).

---

### FUT-310: Estimated First Year Value computation

**Covers:** FRM-006 (BR-17)
**Preconditions:** Offer with 2 tranches (25,000 + 25,000 bonus), 3 soft perks ($200 total), FYF=true.

**Steps:**

1. Review wizard summary.

**Expected Result:** Estimated First Year Value = 50,000 points + $200 − $0 fee.

---

### FUT-311: Supplementary card creation via FRM-006

**Covers:** FRM-006, FRM-004 (BR-18, BR-24, D-208)
**Preconditions:** Parent Card Instance "Amex Cobalt" exists in Active state.

**Steps:**

1. From FRM-004 object page → Add Supplementary Card.
2. FRM-006 opens with Market Card locked.
3. Enter cardholder name, offer terms, card details.

**Expected Result:** Supp card created with `parent_card_instance_id` set. Appears in parent's Supplementary Cards section, not in main list. Supp card points/fees roll up to parent.

---

### FUT-312: Close parent cascades to supp cards

**Covers:** WFL-002 (BR-10)
**Preconditions:** Parent card Active with 2 supp cards (one Active, one Focus).

**Steps:**

1. Close parent card.

**Expected Result:** All 3 cards (parent + 2 supp) transition to Closed. All alerts dismissed per card. Provider Accounts unlinked.

---

### FUT-313: List page shows primary cards only, default excludes Closed

**Covers:** FRM-004 (BR-20, BR-21)
**Preconditions:** 5 primary cards (2 Active, 1 Focus, 1 To Cancel, 1 Closed). 2 supp cards.

**Steps:**

1. Open FRM-004 list with default variant.

**Expected Result:** 4 primary cards shown (Closed excluded). 0 supp cards in list.

---

### FUT-314: Delete card with zero transactions

**Covers:** FRM-004 (BR-30, BR-31)
**Preconditions:** Card Instance with Offer (2 tranches), 1 earning multiplier override, 1 alert, linked Provider Account, zero transactions.

**Steps:**

1. Delete card.

**Expected Result:** Card Instance, Offer, Tranches, override, alert all deleted. Provider Account unlinked but still exists.

---

### FUT-315: Delete blocked — card has transactions

**Covers:** FRM-004 (BR-30)
**Preconditions:** Card Instance with 3 assigned transactions.

**Steps:**

1. Attempt delete.

**Expected Result:** Error: deletion blocked. Transaction count displayed.

---

### FUT-316: Parent delete blocked — supp card has transactions

**Covers:** FRM-004 (BR-32)
**Preconditions:** Parent card with zero transactions, supp card with 1 transaction.

**Steps:**

1. Attempt delete parent.

**Expected Result:** Error: deletion blocked due to supp card transactions.

---

### FUT-317: AF approaching alert

**Covers:** WFL-002 (BR-33, BR-34)
**Preconditions:** Card activated 2024-03-15, `AF_ALERT_DAYS`=30, today is 2025-02-14.

**Steps:**

1. System evaluates alert schedule.

**Expected Result:** `af_approaching` alert created with `due_date` = 2025-03-15.

---

### FUT-318: Cancel reminder lifecycle

**Covers:** WFL-002, FRM-004 (BR-35, BR-08)
**Preconditions:** Active card, `CANCEL_REMINDER_DAYS`=2.

**Steps:**

1. Mark To Cancel with `tentative_cancel_date` = 2025-04-10.
2. Later, Reactivate.

**Expected Result:** Step 1: `cancel_reminder` created with `due_date` = 2025-04-08. Step 2: alert dismissed.

---

### FUT-319: Instance-level earning multiplier override

**Covers:** FRM-004 (BR-36, BR-37, BR-38)
**Preconditions:** Card Instance linked to Market Card with grocery multiplier = 5x.

**Steps:**

1. Edit earning multiplier on FRM-004 object page, change grocery to 4x.

**Expected Result:** Instance-level Earning Multiplier created with `card_instance_id`, `multiplier`=4. Market Card default unchanged.

---

### FUT-320: Supp card points roll up to parent

**Covers:** FRM-004 (BR-25)
**Preconditions:** Parent card with 20,000 points earned, supp card with 10,000 points earned.

**Steps:**

1. View parent card on FRM-004 object page.

**Expected Result:** Total Points Earned shows 30,000. Estimated Value Gain includes supp card contributions.

---

## 9. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-01 (Ingestion Pipeline) | FRM-010 SimpleFIN link reused in FRM-006 step 4. Provider Account `card_instance_id` mapping triggers unmatched transaction resolution (SPEC-01, BR-07). Provider Account unlinked on card close. |
| SPEC-02 (Transaction Processing) | Card reassignment dropdown on FRM-001 filters by lifecycle state — exclude Closed (SPEC-02 cross-spec note). Transaction count checked on card delete (BR-30). |
| SPEC-04 (Bonus & Points) | ENH-003 provides Focus→Active auto-trigger (all tranches met) and Focus→Active on bonus_missed. `statement_close_day` on Card Instance used by ENH-003. Bonus Progress section on FRM-004 cross-refs ENH-003 output. |
| SPEC-06 (Reference Data & Seed) | Alert Type seed values: add `af_approaching`, `cancel_reminder` (total 13). System Config: add `AF_ALERT_DAYS`, `CANCEL_REMINDER_DAYS`. |
| SPEC-05 (Budget Pipeline) | No direct dependency. Cards with transactions feed into budget via Transaction → Purchase Type. |
| FRM-005 (Market Cards) | FRM-006 step 1 reads from Market Card catalog managed by FRM-005. No inline creation from wizard. |
| Business Architecture | WFL-004 status changed to "Absorbed by FRM-006" (D-188). |

---

*This spec is the single source of truth for FRM-004, FRM-006, WFL-002, and WFL-004. Card Instance entity definition is in [DATA_MODEL.md](../DATA_MODEL.md). Design decisions are in [DECISIONS_LOG.md](../user-profile/DECISIONS_LOG.md).*
