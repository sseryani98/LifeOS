# SPEC-15: Weekly Review Session

**Spec ID:** SPEC-15
**Version:** 1.0
**Date:** 2026-02-20
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-20 | Sandro & Claude | Initial creation — workshop output (D-243 through D-251) |

---

## 2. Overview

| Field | Value |
|-------|-------|
| **FRICEW Objects** | WFL-001 (Weekly Review Session) |
| **Sprint** | W1-S5 |
| **CDS Service** | TransactionService (primary entry point) |
| **UI Type** | Freestyle |
| **Dependencies** | FRM-010 (SPEC-01), FRM-003 (SPEC-01), FRM-001 (SPEC-02), FRM-007, RPT-001 (SPEC-19), RPT-002 (SPEC-20) |

WFL-001 is a cross-component orchestration workflow. It provides a launchpad page with a checklist that guides the user through the weekly 15–20 minute operational cycle: check connection health, import Scotia CSV, review transactions, set monthly income, then check churning and budget dashboards.

---

## 3. Data Model References

| Entity | Usage |
|--------|-------|
| System Config | `LAST_REVIEW_DATE`, `REVIEW_REMINDER_DAYS`, `CSV_IMPORT_REMINDER_DAYS` |
| Alert / Alert Type | `review_overdue` alert generation; churning and budget alert counts for dashboard items |
| Provider Connection | Connection health status for item 1 |
| Import Log | Last Scotia CSV import date for item 2 |
| Transaction | Uncategorized transaction count for item 3 |
| Budget Period | Income existence check for item 4 |

### DM-001 Amendments

| Entity | Change |
|--------|--------|
| Alert Type (seed) | +`review_overdue` (14th type) |
| System Config | +`LAST_REVIEW_DATE` (datetime, default null) |
| System Config | +`REVIEW_REMINDER_DAYS` (integer, default 7) |
| System Config | +`CSV_IMPORT_REMINDER_DAYS` (integer, default 7) |

---

## 4. Functional Description

### 4.1 Page Structure

WFL-001 is a freestyle launchpad page — **first item in the Transactions navigation group** (D-244).

| Section | Content |
|---------|---------|
| **Header** | Title: "Weekly Review." Subtitle: "Last completed: {relative time}" or "Never." Progress counter: "{N} of 4 items clear" (D-251). |
| **Checklist** | 6 items in fixed order (§4.2). Items 1–4 with auto-detected status. Items 5–6 as navigation links with alert counts. |
| **"All clear" banner** | Shown when items 1–4 are all green (D-251). Text: "All clear — just check your dashboards." |
| **Footer** | "Mark Review Complete" button. Always enabled (D-248). |

### 4.2 Checklist Items

Fixed order (D-245). Each item has a status indicator and a navigation link.

| # | Item | Links To | Status: Green | Status: Warning |
|---|------|----------|---------------|-----------------|
| 1 | Connection Health | FRM-010 | "All healthy" — no `connection_error` or `stale_data` alerts active | "{N} connection(s) with issues" |
| 2 | Import Scotia CSV | FRM-003 | "Up to date" — last Scotia import ≤ `CSV_IMPORT_REMINDER_DAYS` | "Last import: {N} days ago" |
| 3 | Review Transactions | FRM-001 | "All clear" — 0 uncategorized transactions | "{N} uncategorized" |
| 4 | Set Monthly Income | FRM-007 | "Set for {month}" — income exists for current budget period | "Not set" |
| 5 | Churnboard | RPT-001 | "No alerts" | "{N} alerts" |
| 6 | Budget Dashboard | RPT-002 | "No alerts" | "{N} alerts" |

Items 1–4: **auto-detected status** (green/warning). Items 5–6: **navigation links** with alert counts, no green/warning logic (D-246).

### 4.3 Session Tracking

- Clicking "Mark Review Complete" writes the current timestamp to `LAST_REVIEW_DATE` in System Config (D-247).
- Header displays relative time since last review ("Last completed: 3 days ago") or "Never" if null.
- Button is always enabled regardless of checklist item status (D-248). No confirmation dialog.

### 4.4 Alert Generation

| Alert Type | Condition | Notes |
|------------|-----------|-------|
| `review_overdue` | `(today - LAST_REVIEW_DATE) > REVIEW_REMINDER_DAYS` | Not generated if `LAST_REVIEW_DATE` is null (D-249) |

---

## 5. Business Rules

| Rule | Description |
|------|-------------|
| BR-01 | WFL-001 is a launchpad page; first item in the Transactions navigation group |
| BR-02 | Page displays: header (title + last review date + progress counter), checklist (6 items), "Mark Review Complete" button |
| BR-03 | Checklist order is fixed: (1) Connection Health, (2) Import Scotia CSV, (3) Review Transactions, (4) Set Monthly Income, (5) Churnboard, (6) Budget Dashboard |
| BR-04 | Items 1–4 use auto-detected status (green/warning); items 5–6 show alert counts as navigation links |
| BR-05 | Connection Health: green if no `connection_error` or `stale_data` alerts active; warning with count otherwise |
| BR-06 | Import Scotia CSV: green if last Scotia import ≤ `CSV_IMPORT_REMINDER_DAYS`; warning with days since last import otherwise |
| BR-07 | Review Transactions: green if 0 uncategorized transactions; warning with count otherwise |
| BR-08 | Set Monthly Income: green if income exists for current budget period; warning "Not set" otherwise |
| BR-09 | Churnboard: displays count of active churning-related alerts; links to RPT-001 |
| BR-10 | Budget Dashboard: displays count of active budget-related alerts; links to RPT-002 |
| BR-11 | `LAST_REVIEW_DATE` updated to current timestamp on "Mark Review Complete" click |
| BR-12 | "Mark Review Complete" is always enabled regardless of item status |
| BR-13 | Header shows "Last completed: {relative time}"; "Never" if `LAST_REVIEW_DATE` is null |
| BR-14 | `review_overdue` alert generated when `(today - LAST_REVIEW_DATE) > REVIEW_REMINDER_DAYS` |
| BR-15 | `review_overdue` alert NOT generated if `LAST_REVIEW_DATE` is null |
| BR-16 | `REVIEW_REMINDER_DAYS`: System Config, default 7 |
| BR-17 | `CSV_IMPORT_REMINDER_DAYS`: System Config, default 7 |
| BR-18 | Progress counter shows "{N} of 4 items clear" based on green status of items 1–4 |
| BR-19 | "All clear" banner shown when all 4 auto-detected items (1–4) are green |

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| System Config entries missing | Use defaults: `REVIEW_REMINDER_DAYS` = 7, `CSV_IMPORT_REMINDER_DAYS` = 7 |
| Provider Connection query fails | Item 1 shows "Unable to check" (error state) |
| Transaction count query fails | Item 3 shows "Unable to check" (error state) |
| No Scotia import log exists | Item 2 shows "No imports yet" (neutral) |

---

## 7. Functional Unit Tests

### FUT-150: Full weekly review — happy path

- **Covers:** WFL-001
- **Preconditions:** `LAST_REVIEW_DATE` is 6 days ago. 1 SimpleFIN connection with error. Scotia last imported 8 days ago. 5 uncategorized transactions. Income set for current month. 2 churning alerts active. 1 budget alert active.
- **Steps:** (1) Navigate to Weekly Review. (2) Observe checklist status. (3) Click Connection Health → navigate to FRM-010. (4) Return. (5) Click Import Scotia CSV → FRM-003. (6) Return. (7) Click Review Transactions → FRM-001. (8) Return. (9) Click Churnboard → RPT-001. (10) Return. (11) Click Budget Dashboard → RPT-002. (12) Return. (13) Click "Mark Review Complete."
- **Expected:** Header shows "Last completed: 6 days ago", "1 of 4 items clear." Items: (1) warning "1 connection with issues", (2) warning "Last import: 8 days ago", (3) warning "5 uncategorized", (4) green "Set for Feb 2026", (5) "2 alerts", (6) "1 alert." Each click navigates correctly. After marking complete, `LAST_REVIEW_DATE` = today, header updates to "Last completed: today."

### FUT-151: First-time use

- **Covers:** WFL-001
- **Preconditions:** `LAST_REVIEW_DATE` is null. No transactions, no imports, no connections.
- **Steps:** (1) Navigate to Weekly Review. (2) Observe header and checklist.
- **Expected:** Header shows "Last completed: Never." No `review_overdue` alert exists (BR-15). Checklist reflects empty system state.

### FUT-152: Mark complete with outstanding items

- **Covers:** WFL-001
- **Preconditions:** 3 uncategorized transactions. Scotia CSV overdue. Income not set.
- **Steps:** (1) Navigate to Weekly Review. (2) Click "Mark Review Complete."
- **Expected:** Button enabled (BR-12). `LAST_REVIEW_DATE` updates to today. No error or confirmation dialog.

### FUT-153: Review overdue alert generation

- **Covers:** WFL-001
- **Preconditions:** `LAST_REVIEW_DATE` is 8 days ago. `REVIEW_REMINDER_DAYS` = 7.
- **Steps:** (1) System evaluates alert conditions.
- **Expected:** `review_overdue` alert generated (BR-14). Visible on dashboards.

### FUT-154: Review overdue alert clears after completion

- **Covers:** WFL-001
- **Preconditions:** `review_overdue` alert active. `LAST_REVIEW_DATE` is 10 days ago.
- **Steps:** (1) Navigate to Weekly Review. (2) Click "Mark Review Complete."
- **Expected:** `LAST_REVIEW_DATE` = today. `review_overdue` no longer generated on next evaluation.

### FUT-155: Scotia CSV import overdue indicator

- **Covers:** WFL-001
- **Preconditions:** Last Scotia CSV import was 9 days ago. `CSV_IMPORT_REMINDER_DAYS` = 7.
- **Steps:** (1) Navigate to Weekly Review. (2) Observe item 2.
- **Expected:** Warning: "Last import: 9 days ago." Links to FRM-003.

### FUT-156: Income not set for current month

- **Covers:** WFL-001
- **Preconditions:** No income record for current budget period.
- **Steps:** (1) Navigate to Weekly Review. (2) Observe item 4.
- **Expected:** Warning: "Not set." Links to FRM-007.

### FUT-157: All items green — clean state

- **Covers:** WFL-001
- **Preconditions:** All connections healthy. Scotia imported 2 days ago. 0 uncategorized transactions. Income set. 0 churning alerts. 0 budget alerts.
- **Steps:** (1) Navigate to Weekly Review.
- **Expected:** All items 1–4 green. "All clear" banner visible (BR-19). Counter: "4 of 4 items clear." Button available.

---

*Cross-references: [SPEC-01](SPEC-01-INGESTION-PIPELINE.md) (FRM-010, FRM-003), [SPEC-02](SPEC-02-TRANSACTION-PROCESSING.md) (FRM-001), [SPEC-19](SPEC-19-CHURNBOARD.md) (RPT-001), [SPEC-20](SPEC-20-BUDGET-DASHBOARD.md) (RPT-002), [SPEC-05](SPEC-05-BUDGET-PIPELINE.md) (income/budget context)*
