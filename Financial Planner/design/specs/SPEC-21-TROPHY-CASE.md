# SPEC-21: Trophy Case

**Spec ID:** SPEC-21
**Version:** 1.0
**Date:** 2026-02-20
**Status:** Approved
**Sprint:** W2-S2

---

## 1. Change History

| Date       | Author          | Description                                                                           |
| ---------- | --------------- | ------------------------------------------------------------------------------------- |
| 2026-02-20 | Sandro & Claude | Initial creation — workshop output.                                                   |
| 2026-02-20 | Sandro          | Approved.                                                                             |
| 2026-02-20 | Claude          | FUT renumbering: FUT-198–209 → FUT-199–210 (cascaded from SPEC-18 FUT collision fix). |

---

## 2. Overview

### 2.1 Scope

Fiori Elements Analytical List Page + Object Page for cross-program redemption history. Provides KPI aggregates (total points redeemed, total dollar value, weighted average CPP, count), visual filters by program/type/year, a top-10 horizontal bar chart ranking "best burns" by effective CPP, and full CRUD for Redemption records. CPP values are semantically color-coded relative to each program's CPP valuation.

### 2.2 FRICEW Objects

| ID      | Name        | Type   | Wave |
| ------- | ----------- | ------ | ---- |
| RPT-004 | Trophy Case | Report | 2    |

### 2.3 CDS Service & Module

|                 |                                                                   |
| --------------- | ----------------------------------------------------------------- |
| **CDS Service** | ChurningService (`/service/churningSvcs`)                         |
| **Module**      | `srv/modules/churning/`                                           |
| **Files**       | `ChurningFacade.ts`, `ChurningService.ts`, `ChurningValidator.ts` |

### 2.4 Consumers

| Consumer                                   | Usage                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| SPEC-03 FRM-004 (My Cards)                 | FRM-004 Section 4 removed — redemptions are program-level (D-280)   |
| SPEC-11 RPT-010 (Points Program Dashboard) | Per-program redemption view — Trophy Case is the cross-program view |

### 2.5 Dependencies

| Dependency                                 | Usage                                         |
| ------------------------------------------ | --------------------------------------------- |
| SPEC-06 CNV-002 (Reference Data Seed)      | Rewards Programs, Redemption Types must exist |
| SPEC-11 RPT-010 (Points Program Dashboard) | Navigation target for program drill-down      |

---

## 3. Data Model References

### 3.1 Entities Used

| Entity          | Section | Usage                                                            |
| --------------- | ------- | ---------------------------------------------------------------- |
| Redemption      | DM §5.4 | Primary entity — full CRUD                                       |
| Redemption Type | D-102   | FK display + visual filter grouping                              |
| Rewards Program | DM §3.2 | FK display + visual filter grouping + CPP valuation for coloring |
| Card Instance   | DM §4.4 | Optional FK — for card-specific redemptions                      |
| Market Card     | DM §4.1 | Navigation display (via Card Instance)                           |

### 3.2 DM Amendments (DM-001)

None — Redemption entity already has the correct shape (including D-102 `redemption_type_id` FK).

### 3.3 Cross-Spec Amendments

| Spec          | Change                                                                          | Decision |
| ------------- | ------------------------------------------------------------------------------- | -------- |
| SPEC-03       | Remove FRM-004 Section 4 (Redemptions). Sections 5–8 renumber to 4–7.           | D-280    |
| TECH_STACK.md | `app/trophy-case/` changes from Freestyle to Fiori Elements (ALP + Object Page) | D-279    |

---

## 4. Functional Description

### 4.1 Page Type

Fiori Elements Analytical List Page + Object Page (D-279). Full CRUD. Side navigation entry under **Churning — Analytics** group.

### 4.2 KPI Tags

| KPI                   | Metric                                          | Format                          |
| --------------------- | ----------------------------------------------- | ------------------------------- |
| Total Points Redeemed | SUM(`points_spent`)                             | Number with thousands separator |
| Total Dollar Value    | SUM(`dollar_value`)                             | CAD currency                    |
| Average CPP           | SUM(`dollar_value`) / SUM(`points_spent`) × 100 | ¢ format                        |
| Redemption Count      | COUNT(\*)                                       | Number                          |

All KPIs update dynamically with applied filters.

### 4.3 Visual Filters

| Filter     | Chart Type | Dimension               | Measure             |
| ---------- | ---------- | ----------------------- | ------------------- |
| By Program | Donut      | Rewards Program         | SUM(`dollar_value`) |
| By Type    | Bar        | Redemption Type         | SUM(`dollar_value`) |
| By Year    | Line       | Year(`redemption_date`) | COUNT(\*)           |

### 4.4 Chart Area

Horizontal bar chart sorted by `effective_cpp` descending. Top 10 redemptions. Bar label = `description`. Bar color follows CPP semantic coloring (BR-06). Program CPP benchmark vertical reference line visible when filtered to a single program (BR-12).

### 4.5 Table Columns

| Column        | Source                 | Format         | Notes                       |
| ------------- | ---------------------- | -------------- | --------------------------- |
| Date          | `redemption_date`      | Date           | Default sort: descending    |
| Program       | Rewards Program.`name` | Text           | Navigation link to RPT-010  |
| Type          | Redemption Type.`name` | Text           |                             |
| Description   | `description`          | Text           |                             |
| Points Spent  | `points_spent`         | Number         | Thousands separator         |
| Dollar Value  | `dollar_value`         | Currency (CAD) |                             |
| Effective CPP | `effective_cpp`        | ¢ format       | Semantic coloring per BR-06 |

**Filters:** One filter field per column + date range + CPP range. Search field.

**Actions:**

| Action | Trigger        | Notes                               |
| ------ | -------------- | ----------------------------------- |
| Create | Toolbar button | Standard Fiori create → Object Page |

### 4.6 Object Page Layout

**Header:** Program name, redemption type, redemption date, CPP rank indicator (ENH-003).

**Fields:**

| Field           | Control                      | Required | Notes                                                             |
| --------------- | ---------------------------- | -------- | ----------------------------------------------------------------- |
| Program         | Value Help (Rewards Program) | Yes      |                                                                   |
| Redemption Type | Value Help (Redemption Type) | No       |                                                                   |
| Redemption Date | Date Picker                  | Yes      | Defaults to today                                                 |
| Points Spent    | Number Input                 | Yes      |                                                                   |
| Dollar Value    | Currency Input               | Yes      |                                                                   |
| Effective CPP   | Display Only                 | —        | Auto-calculated (BR-01). ¢ format with semantic coloring (BR-06). |
| Description     | Text Input                   | Yes      | "Business class YYZ→NRT"                                          |
| Card Instance   | Value Help                   | No       | Filtered by selected program (BR-03)                              |
| Notes           | Text Area                    | No       |                                                                   |

**Actions:**

| Action | Location           | Behavior                    |
| ------ | ------------------ | --------------------------- |
| Create | List toolbar       | Standard Fiori create       |
| Edit   | Object page        | Standard Fiori edit         |
| Delete | Object page footer | Confirmation dialog (BR-15) |

### 4.7 Navigation

| Direction | From → To              | Trigger                                                 |
| --------- | ---------------------- | ------------------------------------------------------- |
| Outbound  | Program name → RPT-010 | Table cell click / Object Page header link              |
| Inbound   | RPT-010 → RPT-004      | — (no direct link defined; user navigates via side nav) |

---

## 5. Business Rules

### Redemption Data

| Rule  | Description                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | `effective_cpp` is auto-calculated: (`dollar_value` / `points_spent`) × 100. Stored at save time (D-40), not user-editable. |
| BR-02 | `rewards_program_id` is required. `card_instance_id` is optional.                                                           |
| BR-03 | Card Instance value help SHALL filter to cards whose Market Card belongs to the selected Rewards Program.                   |
| BR-04 | `redemption_date` defaults to today on create.                                                                              |
| BR-05 | Redemptions are program-level events, not card-level (D-142).                                                               |

### CPP Semantic Coloring

| Rule  | Description                                                                                                                                                                                           |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-06 | CPP values SHALL be color-coded relative to the program's `cpp_valuation`: >= 2× → Positive (Green/exceptional), >= 1× → Information (Blue/above valuation), < 1× → Warning (Orange/below valuation). |
| BR-07 | CPP coloring applies to both the table column and the horizontal bar chart.                                                                                                                           |

### ALP Behavior

| Rule  | Description                                                                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-08 | KPI tags: Total Points Redeemed (SUM), Total Dollar Value (SUM), Average CPP (weighted: total value / total points × 100), Redemption Count. All update dynamically with filters. |
| BR-09 | Visual filters: Donut by Program (`dollar_value`), Bar by Redemption Type (`dollar_value`), Line by Year (count).                                                                 |
| BR-10 | Chart area: Horizontal bar chart sorted by `effective_cpp` descending. Top 10 redemptions. Bar color follows BR-06 thresholds.                                                    |
| BR-11 | Table default sort: `redemption_date` descending.                                                                                                                                 |
| BR-12 | Program CPP benchmark vertical reference line shown on chart when filtered to a single program. Hidden when viewing all programs.                                                 |

### Navigation

| Rule  | Description                                                                           |
| ----- | ------------------------------------------------------------------------------------- |
| BR-13 | Clicking a Program name in the table navigates to RPT-010 (Points Program Dashboard). |

### CRUD

| Rule  | Description                                                       |
| ----- | ----------------------------------------------------------------- |
| BR-14 | Create, Edit, and Delete actions available. No approval workflow. |
| BR-15 | Delete requires confirmation dialog.                              |

### UX Enhancements

| Rule  | Description                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------ |
| BR-16 | The highest `effective_cpp` redemption SHALL display a "Best Ever" badge icon in the table row (ENH-001).          |
| BR-17 | Object page header SHALL display the redemption's CPP rank among all redemptions (e.g., "#3 best burn") (ENH-003). |

---

## 6. Error Handling

| Condition                                                           | Response                             | i18n Key                              |
| ------------------------------------------------------------------- | ------------------------------------ | ------------------------------------- |
| `points_spent` is zero or negative                                  | Field-level error                    | `redemption.error.invalidPointsSpent` |
| `dollar_value` is zero or negative                                  | Field-level error                    | `redemption.error.invalidDollarValue` |
| Required fields missing (program, date, points, value, description) | Field-level errors                   | `redemption.error.requiredField`      |
| No redemptions exist                                                | Empty table with "No data available" | —                                     |
| Referenced Rewards Program deleted                                  | 404 via `req.reject()`               | `redemption.error.programNotFound`    |

---

## 7. Open Items

No open items resolved by this spec. OI-06 (alerts): RPT-004 does not generate alerts — this is a passive register.

---

## 8. Functional Unit Tests

### FUT-199: ALP Load with KPIs and Coloring

**Covers:** RPT-004

**Preconditions:**

- 3 redemptions: Aeroplan flight 50k pts/$2,000 (4.0¢), Bonvoy hotel 40k pts/$240 (0.6¢), MR gift card 10k pts/$100 (1.0¢)
- CPP valuations: Aeroplan 1.8¢, Bonvoy 0.8¢, MR 1.0¢

**Steps:**

1. Open Trophy Case

**Expected Result:**

- KPIs: 100,000 pts, $2,340, 2.34¢ avg, 3 count
- Table: 3 rows sorted by date desc
- Chart: 3 bars sorted by CPP desc
- Coloring: Aeroplan = Green (4.0¢ >= 2 × 1.8¢), MR = Blue (1.0¢ >= 1 × 1.0¢), Bonvoy = Orange (0.6¢ < 1 × 0.8¢)

---

### FUT-200: Best Ever Badge

**Covers:** RPT-004

**Preconditions:**

- Same as FUT-199

**Steps:**

1. Open Trophy Case

**Expected Result:**

- Aeroplan 4.0¢ row displays "Best Ever" badge
- Other rows do not

---

### FUT-201: Visual Filter — Single Program

**Covers:** RPT-004

**Preconditions:**

- Same as FUT-199

**Steps:**

1. Click Aeroplan slice in Program donut visual filter

**Expected Result:**

- Table filters to 1 row
- KPIs update: 50,000 pts, $2,000, 4.0¢, 1 count
- Chart shows benchmark line at 1.8¢ (Aeroplan CPP valuation)

---

### FUT-202: Create Redemption

**Covers:** RPT-004

**Preconditions:**

- Rewards Programs and Redemption Types seeded

**Steps:**

1. Click Create
2. Select Program = Aeroplan, Type = Flight
3. Enter: 50,000 points, $2,000, "Business class YYZ→NRT", today's date
4. Save

**Expected Result:**

- Effective CPP auto-calculates to 4.0¢
- Save succeeds
- List report shows new row
- KPIs update

---

### FUT-203: CPP Rank on Object Page

**Covers:** RPT-004

**Preconditions:**

- FUT-199 data + FUT-202 creates a 4th redemption at 4.0¢ (tied with existing)

**Steps:**

1. Open Bonvoy 0.6¢ redemption object page

**Expected Result:**

- Header shows rank (e.g., "#4 best burn")
- All fields displayed correctly

---

### FUT-204: Edit Redemption Recalculates CPP

**Covers:** RPT-004

**Preconditions:**

- FUT-202 redemption exists (50k pts, $2,000, 4.0¢)

**Steps:**

1. Open redemption, click Edit
2. Change dollar_value to $1,500
3. Save

**Expected Result:**

- Effective CPP recalculates to 3.0¢
- Table and KPIs update

---

### FUT-205: Delete Redemption

**Covers:** RPT-004

**Preconditions:**

- FUT-202 redemption exists

**Steps:**

1. Open redemption, click Delete
2. Confirm in dialog

**Expected Result:**

- Redemption removed from list
- KPIs update

---

### FUT-206: Card Instance Value Help Filters by Program

**Covers:** RPT-004

**Preconditions:**

- TD Aeroplan VI and Amex Cobalt Card Instances exist
- Creating redemption with Program = Aeroplan

**Steps:**

1. Open Card Instance value help

**Expected Result:**

- Only TD Aeroplan VI shown (Aeroplan-linked)
- Amex Cobalt not shown

---

### FUT-207: Top 10 Chart Limit

**Covers:** RPT-004

**Preconditions:**

- 12 redemptions with varying CPP

**Steps:**

1. Open Trophy Case, view chart

**Expected Result:**

- Chart shows top 10 bars by CPP desc
- 2 lowest CPP redemptions not in chart but visible in table

---

### FUT-208: Empty State

**Covers:** RPT-004

**Preconditions:**

- No redemptions exist

**Steps:**

1. Open Trophy Case

**Expected Result:**

- KPIs show zeros
- Table shows "No data available"
- Chart empty

---

### FUT-209: Navigate to RPT-010

**Covers:** RPT-004

**Preconditions:**

- FUT-199 data

**Steps:**

1. Click Aeroplan program name in table row

**Expected Result:**

- Navigates to RPT-010 for Aeroplan

---

### FUT-210: Benchmark Line Hidden for Multi-Program

**Covers:** RPT-004

**Preconditions:**

- FUT-199 data (3 programs)

**Steps:**

1. Open Trophy Case with no program filter

**Expected Result:**

- Chart shows top bars with CPP coloring
- No benchmark line visible (multiple programs)

---

## 9. UX Enhancements

| ID      | Enhancement                                                                                                                                | Decision |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| ENH-001 | **"Best Ever" badge** — Highest `effective_cpp` redemption displays a badge icon in the table row.                                         | D-283    |
| ENH-002 | **Program CPP benchmark line** — Vertical reference line on chart at program's `cpp_valuation`, visible when filtered to a single program. | D-284    |
| ENH-003 | **CPP rank indicator** — Object page header shows redemption's rank among all redemptions (e.g., "#3 best burn").                          | D-285    |
