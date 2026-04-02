# SPEC-09: Goals

**Spec ID:** SPEC-09
**Name:** Goals
**FRICEW Objects:** FRM-008, RPT-011
**Wave:** 2
**Sprint:** W2-S2
**CDS Services:** BudgetService
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                       |
| ---------- | --------------- | ----------------------------------------------------------------- |
| 2026-02-17 | Sandro & Claude | Initial creation — workshop complete. D-148 through D-156 logged. |

---

## 2. Overview

FRM-008 (Goals Management) provides CRUD management for financial goals — both saving goals (setting money aside) and spending goals (saving up for a specific purchase). Goals deduct a monthly allocation from income before budget computation (SPEC-05, D-131), providing dedicated saving toward a target amount. Users can optionally break down a goal's target into forecast line items for detailed planning.

RPT-011 (Goal Progress) is a freestyle dashboard showing all goals with progress visualization, timeline view, on-track/behind/ahead status, and projected completion dates. Completed goals are shown in a separate section.

Transaction linking for spending goals is integrated into FRM-001's Purchase Type picker — active spending goals appear as a separate group in the dropdown, and selecting one sets `goal_id` while clearing `purchase_type_ID` (mutually exclusive, D-151).

Key decisions: D-11 (unified goals concept), D-131 (budget formula), D-132 (goal transaction exclusion), D-133 (negative budget alert), D-148 (status enum), D-149 (manual completion), D-150 (forecast items), D-151 (goal/PT mutual exclusion), D-152 (goals in PT picker), D-153 (computed progress), D-154 (on-track status), D-155 (goal alerts), D-156 (alert config).

---

## 3. Data Model References

| Entity            | Role                                              | DM-001 Ref | Amendment?                         |
| ----------------- | ------------------------------------------------- | ---------- | ---------------------------------- |
| Goal              | Saving or spending target with monthly allocation | §4.11      | Yes — `is_active` → `status` enum  |
| GoalForecastItem  | Optional line-item breakdown of target amount     | —          | Yes — new composition entity       |
| Transaction       | Spending goal transactions linked via `goal_id`   | §4.6       | —                                  |
| Purchase Type     | Mutually exclusive with Goal on Transaction       | §3.3       | —                                  |
| Budget Allocation | Goal allocations feed budget formula              | §4.10      | —                                  |
| Income Entry      | Goal allocations compared against income          | §4.9       | —                                  |
| System Config     | Alert thresholds                                  | §—         | Yes — 2 new keys                   |
| Alert             | Goal-related alert notifications                  | §4.14      | Yes — 4 new Alert Type seed values |

### DM-001 Amendments

**1. Goal.status replaces Goal.is_active (D-148)**

Remove `is_active` (Boolean). Add `status` (enum: `active`, `completed`, `cancelled`, default `active`). Status transitions are user-initiated only — the system never auto-changes status.

**2. GoalForecastItem — new composition entity (D-150)**

| Attribute        | Type          | Nullable | Notes                          |
| ---------------- | ------------- | -------- | ------------------------------ |
| id               | UUID          | No       | PK                             |
| goal_id          | UUID          | No       | FK → Goal (composition parent) |
| description      | String(200)   | No       | Line item name                 |
| estimated_amount | Decimal(15,2) | No       | Estimated cost                 |

When forecast items exist, `Goal.target_amount` = sum of `estimated_amount` (computed, read-only on form). When no forecast items exist, `target_amount` is directly editable.

**3. New System Config keys (D-156)**

| Key                         | Default | Description                                                            |
| --------------------------- | ------- | ---------------------------------------------------------------------- |
| `GOAL_DEADLINE_ALERT_DAYS`  | 30      | Days before target_date to fire goal_deadline_approaching alert        |
| `GOAL_SPENDING_WARNING_PCT` | 80      | Percentage of target_amount at which goal_spending_warning alert fires |

**4. New Alert Type seed values (D-155)**

| Alert Type                  | Severity | Description                                                          |
| --------------------------- | -------- | -------------------------------------------------------------------- |
| `goal_deadline_approaching` | Medium   | Goal with target_date is behind schedule and deadline is approaching |
| `goal_completed`            | Low      | Goal cumulative allocations have reached target_amount               |
| `goal_spending_warning`     | Medium   | Spending goal linked transactions reached warning threshold          |
| `goal_spending_overspend`   | High     | Spending goal linked transactions exceeded target_amount             |

---

## 4. Functional Description

### 4.1 FRM-008 — Goals Management [Form]

**Type:** Fiori Elements — List Report + Object Page

#### List Report

| Column             | Source               | Notes                                              |
| ------------------ | -------------------- | -------------------------------------------------- |
| Name               | `name`               | —                                                  |
| Direction          | `direction`          | Saving / Spending with semantic color              |
| Status             | `status`             | Active (green), Completed (blue), Cancelled (grey) |
| Target Amount      | `target_amount`      | Currency formatted                                 |
| Progress           | Computed             | % of target reached — allocation-based             |
| Monthly Allocation | `monthly_allocation` | Currency formatted                                 |
| Target Date        | `target_date`        | Blank if open-ended                                |

**Default filter:** `status = active`. Toggle to include completed/cancelled.

**Sort:** Direction (spending first), then name alphabetical.

#### Object Page

**Header:**

- Title: Goal name
- ObjectStatus: status with semantic color
- Progress bar: allocation progress toward target_amount
- ObjectNumber: target_amount

**Section 1 — Details (editable):**

- Direction (read-only after creation)
- Start Date
- Target Date (optional)
- Monthly Allocation
- Status (read-only — changed via actions)
- Notes (textarea)

**Section 2 — Forecast Items:**

- Inline-editable table of GoalForecastItem (description, estimated_amount)
- Add / Delete rows
- Running total at bottom
- When items exist: `target_amount` displayed as computed sum (read-only in Section 1)
- When no items: `target_amount` editable in Section 1

**Section 3 — Linked Transactions (spending goals only):**

- Read-only table showing transactions where `goal_id` = this goal
- Columns: Date, Description, Vendor, Amount
- Running total of linked transaction amounts
- Hidden when `direction = saving`

#### Actions

| Action         | Precondition                        | Effect                                                                                   |
| -------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| **Complete**   | `status = active`                   | Sets `status = completed`. Goal allocation removed from budget formula next computation. |
| **Cancel**     | `status = active`                   | Sets `status = cancelled`. Same budget effect as Complete.                               |
| **Reactivate** | `status = completed` or `cancelled` | Sets `status = active`. Goal allocation resumes in budget formula.                       |

#### Transaction Linking via FRM-001 (D-151, D-152)

Goal and Purchase Type are mutually exclusive on a transaction. The Purchase Type picker on FRM-001 (SPEC-02) displays two visual groups:

1. **Purchase Types** — standard categories (Groceries, Dining, etc.)
2. **Goals** — active spending goals only (saving goals excluded)

Selecting a goal from the picker:

- Sets `goal_id` on the transaction
- Clears `purchase_type_ID`
- Transaction excluded from Purchase Type budget (D-132)

Selecting a Purchase Type from the picker:

- Sets `purchase_type_ID` on the transaction
- Clears `goal_id`

### 4.2 RPT-011 — Goal Progress [Report]

**Type:** Freestyle dashboard (sap.f.GridContainer)

#### Section 1 — Active Goals Summary (full-width)

Card grid with one card per active goal:

| Element              | Content                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Title                | Goal name                                                                                             |
| Subtitle             | Direction badge (Saving / Spending)                                                                   |
| Progress bar         | Allocation progress % toward target_amount                                                            |
| Target Amount        | ObjectNumber with currency                                                                            |
| Monthly Allocation   | Below progress bar                                                                                    |
| Projected Completion | Computed: `today + (remaining / monthly_allocation)` months                                           |
| On-Track Status      | ObjectStatus — Ahead (green), On Track (neutral), Behind (red). Only shown when `target_date` is set. |
| Actual Spend         | Spending goals only — sum of linked transactions vs target                                            |

#### Section 2 — Timeline Visualization (full-width)

Horizontal bar chart showing all active goals:

- Each bar spans `start_date` to `target_date` (or projected completion if open-ended)
- Current date marker
- Progress fill within each bar
- Color-coded by on-track status (green/neutral/red)

#### Section 3 — Completed Goals (full-width, collapsible)

Table of completed goals:

| Column          | Content                            |
| --------------- | ---------------------------------- |
| Name            | Goal name                          |
| Direction       | Saving / Spending                  |
| Target Amount   | Original target                    |
| Duration        | `start_date` to completion date    |
| Completion Date | Date status changed to `completed` |

Default: collapsed. Expands on click.

#### Controls

- **Filter:** Active only (default) / All / Completed / Cancelled
- No period selector — goals span their own time ranges

---

## 5. Business Rules

### FRM-008 — Goals Management

| Rule  | Description                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Goal.status enum: `active`, `completed`, `cancelled`. Replaces `is_active` boolean. Default: `active` (D-148).                                    |
| BR-02 | Status transitions are manual only. System never auto-changes status. "Complete" and "Cancel" actions on FRM-008 object page (D-149).             |
| BR-03 | Reactivate action sets `completed` or `cancelled` back to `active`. Goal allocation resumes in budget formula (D-149).                            |
| BR-04 | GoalForecastItem is a composition of Goal. Fields: `description` (String), `estimated_amount` (Decimal). Cascade delete with parent (D-150).      |
| BR-05 | When forecast items exist, `target_amount` = sum of `estimated_amount`. Field is read-only on the form (D-150).                                   |
| BR-06 | When no forecast items exist, `target_amount` is directly editable (D-150).                                                                       |
| BR-07 | Goal and Purchase Type are mutually exclusive on a transaction. Setting `goal_id` clears `purchase_type_ID` and vice versa (D-151).               |
| BR-08 | Active spending goals appear as a separate group in the Purchase Type picker on FRM-001. Saving goals and non-active goals do not appear (D-152). |
| BR-09 | Linked transactions shown read-only on the Goal object page, spending goals only. Running total of linked transaction amounts displayed (D-152).  |
| BR-10 | `direction` is immutable after creation — cannot change a saving goal to spending or vice versa.                                                  |
| BR-11 | Completing or cancelling a goal removes its `monthly_allocation` from the budget formula (SPEC-05 BR-03 only sums active goals).                  |

### Progress & Status Computation

| Rule  | Description                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-12 | Goal progress (saving goals) = `monthly_allocation × months_elapsed / target_amount × 100`. Computed, no contribution ledger (D-153).      |
| BR-13 | Goal progress (spending goals) = same allocation-based formula. Separately, actual spend = sum of linked transaction amounts (D-153).      |
| BR-14 | `months_elapsed` = number of full months from `start_date` to current date. Partial months counted proportionally.                         |
| BR-15 | On-track status requires `target_date` (D-154). Expected progress = `(months_elapsed / total_months) × target_amount`.                     |
| BR-16 | Status thresholds: Ahead = actual > expected. On Track = actual within 5% of expected. Behind = actual < 95% of expected (D-154).          |
| BR-17 | Projected completion = `today + (remaining_amount / monthly_allocation)` months. If `monthly_allocation = 0`, no projection shown (D-153). |

### Alerts

| Rule  | Description                                                                                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-18 | `goal_deadline_approaching` — daily scheduled check. Fires when: `target_date` set, `status = active`, on-track status is `behind`, deadline within `GOAL_DEADLINE_ALERT_DAYS` (System Config, default 30) (D-155).                                         |
| BR-19 | `goal_completed` — daily scheduled check. Fires when cumulative allocations >= `target_amount`. Informational only, does not change status. Idempotent per goal (D-155).                                                                                    |
| BR-20 | `goal_spending_warning` — triggered during transaction processing. Fires when sum of linked transactions >= `GOAL_SPENDING_WARNING_PCT` (System Config, default 80%) of `target_amount`. Spending goals only. Idempotent per goal per month (D-155, D-156). |
| BR-21 | `goal_spending_overspend` — triggered during transaction processing. Fires when sum of linked transactions > `target_amount`. Spending goals only. Idempotent per goal per month (D-155).                                                                   |

---

## 6. Error Handling

| Condition                                 | Response                                     | i18n Key Pattern                                         |
| ----------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| Goal name empty or duplicate              | `req.error()` 400                            | `budget.goal.nameRequired` / `budget.goal.nameDuplicate` |
| `target_amount` ≤ 0 (direct entry)        | `req.error()` 400                            | `budget.goal.invalidTargetAmount`                        |
| `estimated_amount` ≤ 0 on forecast item   | `req.error()` 400                            | `budget.goal.invalidForecastAmount`                      |
| `monthly_allocation` < 0                  | `req.error()` 400                            | `budget.goal.invalidAllocation`                          |
| `target_date` before `start_date`         | `req.error()` 400                            | `budget.goal.targetDateBeforeStart`                      |
| Complete/Cancel on non-active goal        | `req.error()` 400                            | `budget.goal.invalidStatusTransition`                    |
| Reactivate on active goal                 | `req.error()` 400                            | `budget.goal.alreadyActive`                              |
| Delete goal with linked transactions      | `req.error()` 400 with count                 | `budget.goal.hasLinkedTransactions`                      |
| `monthly_allocation = 0` with active goal | Log WARN, no projected completion on RPT-011 | `budget.goal.zeroAllocation`                             |

---

## 7. Open Items

None. All design questions resolved during workshop.

---

## 8. Functional Unit Tests

### FUT-001: Create saving goal with direct target amount

**Covers:** FRM-008

**Preconditions:**

- No existing goals

**Steps:**

1. Create goal: name = "Emergency Fund", direction = saving, target_amount = $10,000, monthly_allocation = $500, start_date = 2026-01-01, no target_date

**Expected Result:**

- Goal created with status `active`, progress = 0%
- Budget formula: Total Goal Allocations includes $500

---

### FUT-002: Create spending goal with forecast items (auto-sum)

**Covers:** FRM-008

**Preconditions:**

- No existing goals

**Steps:**

1. Create goal: name = "Trip to Japan", direction = spending, monthly_allocation = $300, start_date = 2026-03-01, target_date = 2027-03-01
2. Add forecast items: Flights ($2,000), Hotels ($1,500), Food & Activities ($800)

**Expected Result:**

- `target_amount` auto-set to $4,300 (sum of items)
- `target_amount` field is read-only on the form
- Progress = 0%

---

### FUT-003: Remove all forecast items — target becomes editable

**Covers:** FRM-008

**Preconditions:**

- Goal from FUT-002 with 3 forecast items, target_amount = $4,300

**Steps:**

1. Delete all 3 forecast items

**Expected Result:**

- `target_amount` remains $4,300 but becomes editable
- User can now change target_amount directly

---

### FUT-004: Complete a goal

**Covers:** FRM-008

**Preconditions:**

- Active goal with monthly_allocation = $500

**Steps:**

1. Click "Complete" action

**Expected Result:**

- Status changes to `completed`
- Goal's $500 allocation removed from budget formula
- Goal appears in RPT-011 "Completed Goals" section

---

### FUT-005: Cancel a goal

**Covers:** FRM-008

**Preconditions:**

- Active goal with monthly_allocation = $200

**Steps:**

1. Click "Cancel" action

**Expected Result:**

- Status changes to `cancelled`
- Goal's $200 allocation removed from budget formula

---

### FUT-006: Reactivate a completed goal

**Covers:** FRM-008

**Preconditions:**

- Completed goal with monthly_allocation = $500

**Steps:**

1. Click "Reactivate" action

**Expected Result:**

- Status returns to `active`
- Goal's $500 allocation resumes in budget formula

---

### FUT-007: Link transaction to spending goal via PT picker

**Covers:** FRM-008, FRM-001 (SPEC-02 amendment)

**Preconditions:**

- Active spending goal: "New Laptop", target_amount = $2,000
- Uncategorized transaction: $1,800 at Best Buy

**Steps:**

1. On FRM-001, open PT picker for the transaction
2. Select "New Laptop" from the Goals group

**Expected Result:**

- Transaction.goal_id set to the New Laptop goal
- Transaction.purchase_type_ID cleared (null)
- Transaction excluded from Purchase Type budget
- Transaction appears in FRM-008 object page "Linked Transactions" section

---

### FUT-008: Change goal-linked transaction to Purchase Type

**Covers:** FRM-008, FRM-001 (SPEC-02 amendment)

**Preconditions:**

- Transaction linked to "New Laptop" goal (goal_id set)

**Steps:**

1. On FRM-001, open PT picker for the transaction
2. Select "Shopping > Electronics" Purchase Type

**Expected Result:**

- Transaction.purchase_type_ID set to Electronics
- Transaction.goal_id cleared (null)
- Transaction now counts toward Shopping budget category
- Transaction removed from goal's linked transactions

---

### FUT-009: Only active spending goals in PT picker

**Covers:** FRM-001 (SPEC-02 amendment)

**Preconditions:**

- Active spending goal: "New Laptop"
- Active saving goal: "Emergency Fund"
- Completed spending goal: "New Phone"

**Steps:**

1. On FRM-001, open PT picker

**Expected Result:**

- Goals group shows only "New Laptop"
- "Emergency Fund" not shown (saving goal)
- "New Phone" not shown (completed)

---

### FUT-010: Saving goal progress computation

**Covers:** RPT-011

**Preconditions:**

- Saving goal: target = $10,000, allocation = $500/month, start_date = 6 months ago

**Steps:**

1. View RPT-011

**Expected Result:**

- Progress = 30% ($3,000 / $10,000)
- Projected completion: 14 months from now ($7,000 remaining / $500)

---

### FUT-011: Spending goal — allocation progress + actual spend

**Covers:** RPT-011

**Preconditions:**

- Spending goal: target = $4,300, allocation = $300/month, start_date = 5 months ago
- $1,200 in linked transactions

**Steps:**

1. View RPT-011

**Expected Result:**

- Allocation progress ≈ 35% ($1,500 / $4,300)
- Actual spend: $1,200 displayed separately
- Both figures shown on the goal card

---

### FUT-012: On-track status — behind

**Covers:** RPT-011

**Preconditions:**

- Goal: target = $12,000, allocation = $500/month, start_date = 12 months ago, target_date = 12 months from now (24 total months)
- 12 months elapsed → expected 50%, actual = $4,800 (40%)

**Steps:**

1. View RPT-011

**Expected Result:**

- On-track status: "Behind" (red) — 40% < 95% of 50% expected

---

### FUT-013: On-track status — on track

**Covers:** RPT-011

**Preconditions:**

- Same goal setup as FUT-012 but allocation = $520/month
- 12 months elapsed → actual = $6,240 (52%), expected = 50%

**Steps:**

1. View RPT-011

**Expected Result:**

- On-track status: "On Track" (neutral) — 52% is within 5% of 50%

---

### FUT-014: No on-track status without target_date

**Covers:** RPT-011

**Preconditions:**

- Goal with no target_date, allocation = $500/month

**Steps:**

1. View RPT-011

**Expected Result:**

- No on-track status indicator shown
- Projected completion date shown instead

---

### FUT-015: goal_deadline_approaching alert

**Covers:** Alert system

**Preconditions:**

- Active goal, target_date = 25 days from now, on-track status = behind
- GOAL_DEADLINE_ALERT_DAYS = 30

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- `goal_deadline_approaching` alert created
- Alert references the goal name and target_date

---

### FUT-016: goal_completed alert (saving goal)

**Covers:** Alert system

**Preconditions:**

- Saving goal: target = $3,000, allocation = $500/month, start_date = 6 months ago
- Cumulative allocation = $3,000 (= target)

**Steps:**

1. Daily scheduled check runs

**Expected Result:**

- `goal_completed` alert created
- Goal status remains `active` (not auto-completed)

---

### FUT-017: goal_spending_warning alert

**Covers:** Alert system

**Preconditions:**

- Spending goal: target = $1,000
- Linked transactions total = $750 (75%)
- GOAL_SPENDING_WARNING_PCT = 80
- New transaction of $50 linked to goal → total = $800 (80%)

**Steps:**

1. Save transaction with goal_id

**Expected Result:**

- `goal_spending_warning` alert created (80% threshold reached)

---

### FUT-018: goal_spending_overspend alert

**Covers:** Alert system

**Preconditions:**

- Spending goal: target = $1,000
- Linked transactions total = $950
- New transaction of $100 linked to goal → total = $1,050

**Steps:**

1. Save transaction with goal_id

**Expected Result:**

- `goal_spending_overspend` alert created (exceeded target)

---

### FUT-019: RPT-011 default view — active goals only

**Covers:** RPT-011

**Preconditions:**

- 2 active goals, 1 completed goal, 1 cancelled goal

**Steps:**

1. Navigate to RPT-011

**Expected Result:**

- Section 1 shows 2 active goal cards
- Section 3 (Completed Goals) shows 1 completed goal, collapsed by default
- Cancelled goal not visible unless filter changed to "All"

---

### FUT-020: Timeline visualization

**Covers:** RPT-011

**Preconditions:**

- Goal A: start = 2026-01-01, target_date = 2026-12-31, progress = 60%
- Goal B: start = 2026-03-01, no target_date, projected completion = 2027-06-01

**Steps:**

1. View RPT-011 Section 2

**Expected Result:**

- Goal A: bar from Jan to Dec 2026, 60% filled, current date marker
- Goal B: bar from Mar 2026 to Jun 2027 (projected), progress fill shown
- Current date vertical marker across both bars

---

## 9. Cross-Spec Notes

| Target Spec                      | Note                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC-05 (Budget Pipeline)        | Goal.monthly_allocation feeds ENH-007 formula (BR-01/BR-03). Only active goals included in Total Goal Allocations. Completing/cancelling a goal removes its allocation.                 |
| SPEC-02 (Transaction Processing) | Amendment: FRM-001 Purchase Type picker gains a "Goals" group showing active spending goals. Selecting a goal sets `goal_id` and clears `purchase_type_ID` (mutually exclusive, D-151). |
| SPEC-06 (Reference Data & Seed)  | GoalForecastItem follows the composition object page pattern from D-93. System Config gains 2 new keys. Alert Type gains 4 new seed values.                                             |
| SPEC-19 (Churnboard)             | RPT-001 may include a goal summary section consuming RPT-011 data.                                                                                                                      |
| SPEC-20 (Budget Dashboard)       | RPT-002 shows budget status including goal allocation impact. Goal-linked transactions excluded from category spend.                                                                    |

---

_This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) objects FRM-008, RPT-011 and [Data Model](../DATA_MODEL.md) entities listed in §3. New decisions D-148–D-156 logged in [Decisions Log](../user-profile/DECISIONS_LOG.md)._
