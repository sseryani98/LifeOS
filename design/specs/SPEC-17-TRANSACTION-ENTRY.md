# SPEC-17: Transaction Entry

**Spec ID:** SPEC-17
**Version:** 1.0
**Date:** 2026-02-20
**Status:** Approved
**Sprint:** W2-S1

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-20 | Sandro & Claude | Initial creation — workshop output. |

---

## 2. Overview

### 2.1 Scope

Fiori Elements Object Page for creating manual transactions and editing any transaction regardless of source. Vendor autocomplete with ENH-001 categorization cascade, ENH-002 card recommendation with live point calculation, expense splitting via Transaction Split, and inline entity creation for vendor/category master data.

### 2.2 FRICEW Objects

| ID | Name | Type | Wave |
|----|------|------|------|
| FRM-002 | Transaction Entry | Form | 2 |

### 2.3 CDS Service & Module

| | |
|---|---|
| **CDS Service** | TransactionService (`/service/transactionSvcs`) |
| **Module** | `srv/modules/transaction/` |
| **Files** | `TransactionFacade.ts`, `TransactionService.ts`, `TransactionValidator.ts` |

### 2.4 Consumers

| Consumer | Usage |
|----------|-------|
| SPEC-02 FRM-001 (Transaction List) | Create button in table toolbar navigates to Object Page in create mode |

### 2.5 Dependencies

| Dependency | Usage |
|------------|-------|
| SPEC-02 ENH-001 (Categorization Engine) | Auto-fills PT + EC on vendor selection; learning on edits |
| SPEC-07 ENH-002 (Card Recommendation) | Single-category mode — advisory card ranking with point calculation |
| SPEC-02 ENH-009 (Expense Splitting) | Transaction Split entity exposed on form |

---

## 3. Data Model References

### 3.1 Entities Used

| Entity | Section | Usage |
|--------|---------|-------|
| Transaction | DM §5.1 | Primary entity — create and edit |
| Transaction Split | DM §5.2 | Expense sharing — my share vs. full amount |
| Vendor | DM §3.9 | Autocomplete, inline creation |
| Purchase Type | DM §3.10 | Combined picker with Goal, inline creation |
| Purchase Subtype | DM §3.11 | Filtered by selected PT, inline creation |
| Earning Category | DM §3.12 | Category selection, inline creation |
| Card Instance | DM §4.4 | Card picker filtered by active date |
| Goal | DM §4.11 | Combined picker with Purchase Type |

### 3.2 DM Amendments (DM-001)

| Entity | Change | Decision |
|--------|--------|----------|
| Transaction | `source` enum: add `manual` (existing: `simplefin` · `csv`) | D-259 |

---

## 4. Functional Description

### 4.1 Page Type

Fiori Elements Object Page (D-252). Accessed via Create button on FRM-001 table toolbar (D-253). No dedicated side navigation entry.

### 4.2 Modes

| Mode | Trigger | Source Field |
|------|---------|--------------|
| Create | FRM-001 Create button | `manual` (auto-set, read-only) |
| Edit | Click any transaction in FRM-001 list | Original value (read-only) |

All fields editable in both modes except source and import metadata (D-266).

### 4.3 Page Layout

**Section 1 — Header**

| Field | Control | Required | Default | Notes |
|-------|---------|----------|---------|-------|
| Transaction Date | DatePicker | Yes | Today | D-260 |
| Amount | Input (positive number) | Yes | — | "CAD" unit label |
| Purchase / Refund | SegmentedButton | Yes | Purchase | Refund stores negative (D-260) |
| Source | ObjectStatus | Read-only | `manual` on create | |
| Vendor | Input + SuggestionItems | Yes | — | 2+ chars triggers search (D-254). 5 recent vendors first (D-263). `+ Create Vendor` when no match (D-255). |
| Card | ComboBox | Yes | — | Filtered to cards active on transaction date (D-261) |

**Section 2 — Categorization**

| Field | Control | Required | Default | Notes |
|-------|---------|----------|---------|-------|
| Purchase Type / Goal | Combined picker | At least one of PT/EC/Goal | Auto-filled by ENH-001 | Goals at top with `sap-icon://target-group`, progress indicator, group header separator. Mutually exclusive with Goal. `+ Create Purchase Type`. |
| Purchase Subtype | ComboBox | No | — | Filtered by selected PT. `+ Create Subtype`. |
| Earning Category | ComboBox | At least one of PT/EC/Goal | Auto-filled by ENH-001 | `+ Create Earning Category`. |
| Card Recommendation | Custom section (read-only) | — | — | Shows when EC + amount present (D-256, D-257). Top card: name, earn rate, projected points, bonus override. "See all cards" expands ranked list. |

**Section 3 — Expense Split**

| Field | Control | Required | Default | Notes |
|-------|---------|----------|---------|-------|
| My Share Amount | Input (dollar) | No | — | Fill one → other auto-calculates. Cannot exceed transaction amount. |
| My Share % | Input (percentage) | No | — | |
| Split Description | Input | No | — | e.g., "Dinner with Mike" |
| Is Recurring | Switch | No | Off | ENH-009 suggests for repeat vendors |

Full amount feeds churning; my_share_amount feeds budget (D-08). Reimbursed = my_share_amount 0 (D-258).

**Section 4 — Details**

| Field | Control | Required | Notes |
|-------|---------|----------|-------|
| Notes | TextArea | No | Plain text, no length limit |
| Import Batch | ObjectStatus | Read-only | Only shown for `simplefin`/`csv` source |
| Import Date | ObjectStatus | Read-only | Only shown for `simplefin`/`csv` source |
| Created Date | ObjectStatus | Read-only | |
| Last Modified | ObjectStatus | Read-only | |

### 4.4 Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Save | Footer | Standard Fiori save. Draft → active. |
| Create Another | Footer (after save) | New create form with date + card pre-filled (D-262). |
| Delete | Footer | Confirmation dialog. Returns to FRM-001 list. |

### 4.5 Inline Entity Creation

All four entities (Vendor, Purchase Type, Purchase Subtype, Earning Category) support inline creation via two entry points (D-255):

1. **Suggestion dropdown** — type with no match → `+ Create [Entity]` entry with `+` icon at bottom of dropdown
2. **Value help dialog** — "Create New" button in dialog footer

Both open a lightweight `sap.m.Dialog` with minimal required fields. On save: entity created, auto-selected in field, value help refreshes. Purchase Subtype dialog includes parent Purchase Type dropdown.

### 4.6 Categorization Cascade

On vendor selection (D-254):

1. ENH-001 looks up learned category mappings
2. Purchase Type auto-fills (overridable)
3. Earning Category auto-fills (overridable)
4. If EC + amount present → ENH-002 fires → recommendation panel updates

On edit/correction of any transaction (D-266): same ENH-001 learning as FRM-001 inline edits (SPEC-02 BR-08/BR-09).

---

## 5. Business Rules

### Form & Field Defaults

| Rule | Description |
|------|-------------|
| BR-01 | Transaction date defaults to today. |
| BR-02 | Amount is always positive. Purchase/Refund toggle controls sign; Refund stores negative. |
| BR-03 | Source set to `manual` on create; read-only on all transactions. |
| BR-04 | Card picker shows only cards active on the transaction date. |
| BR-05 | Required: date, amount, vendor, card, and at least one of PT, EC, or Goal. Save disabled until met. |
| BR-06 | Notes optional, plain text, no length limit. |

### Vendor & Categorization

| Rule | Description |
|------|-------------|
| BR-07 | Vendor SuggestionItems trigger after 2+ characters. |
| BR-08 | 5 most recently used vendors shown first, then alphabetical. |
| BR-09 | No match → `+ Create Vendor` at bottom of dropdown → quick-create dialog. |
| BR-10 | Vendor selected → ENH-001 auto-fills PT and EC. Both overridable. |
| BR-11 | Same `+ Create [Entity]` pattern for PT, Subtype, and EC value helps. |
| BR-12 | PT and Goal mutually exclusive in combined picker. Goals at top with icon, progress, group header. |
| BR-13 | Editing vendor/category on any transaction triggers ENH-001 learning. |

### Card Recommendation

| Rule | Description |
|------|-------------|
| BR-14 | ENH-002 fires when EC populated. Re-fires on change. |
| BR-15 | EC + amount present → projected points per card (earn rate × amount). |
| BR-16 | Recommendation advisory only — card field not auto-populated. |
| BR-17 | Panel: top card with earn rate, points, bonus override. "See all cards" expands ranked list. |

### Expense Split

| Rule | Description |
|------|-------------|
| BR-18 | Optional split: my_share_amount (dollar) or my_share_pct (percentage). Fill one → other auto-calculates. |
| BR-19 | my_share_amount cannot exceed transaction amount. |
| BR-20 | Split description optional free text. |
| BR-21 | Is Recurring defaults to off. |
| BR-22 | Full amount feeds churning; my_share_amount feeds budget (D-08). Reimbursed = my_share_amount 0. |

### Edit & Navigation

| Rule | Description |
|------|-------------|
| BR-23 | Object Page editable for any transaction regardless of source. |
| BR-24 | All fields editable except source and import metadata. |
| BR-25 | FRM-001 Create button → Object Page in create mode. |
| BR-26 | Delete on Object Page with confirmation dialog. |

### Data Integrity & UX

| Rule | Description |
|------|-------------|
| BR-27 | Duplicate detection on save: date + amount ±10% + vendor within 3-day window. Non-blocking warning. |
| BR-28 | Backdated budget warning if date in prior budget month. Non-blocking. |
| BR-29 | "Create Another" after save → fresh form with date + card pre-filled. |
| BR-30 | Fiori Elements draft handling — auto-saved until explicit Save. |

---

## 6. Error Handling

| Condition | Response | i18n Key |
|-----------|----------|----------|
| Required field missing | Field-level validation message, Save disabled | `transaction.entry.error.requiredField` |
| my_share_amount > transaction amount | Inline error on split amount field | `transaction.entry.error.shareExceedsAmount` |
| Card not active on transaction date | Card excluded from picker (preventive) | — |
| Duplicate detected on save | Non-blocking warning dialog with similar transaction details | `transaction.entry.warn.duplicateDetected` |
| Backdated to prior budget month | Non-blocking warning dialog | `transaction.entry.warn.backdatedBudget` |
| Vendor create fails | Error message in quick-create dialog | `transaction.entry.error.vendorCreateFailed` |
| Draft save conflict | Standard Fiori Elements draft error handling | — |

---

## 7. Open Items

No open items resolved by this spec. OI-06 (alerts): FRM-002 does not generate alerts — downstream engines (SPEC-05, SPEC-04, SPEC-09) react to transaction data.

---

## 8. Functional Unit Tests

### FUT-170: Create Manual Transaction

**Covers:** FRM-002

**Preconditions:**

- User is on FRM-001 transaction list

**Steps:**

1. Click Create button in table toolbar

**Expected Result:**

- Object Page opens in create mode
- Date defaults to today
- Toggle set to Purchase
- Source = `manual` (read-only)

---

### FUT-171: Vendor Auto-Categorization Cascade

**Covers:** FRM-002, ENH-001

**Preconditions:**

- Vendor "Loblaws" exists with learned mappings: PT=Groceries, EC=Grocery

**Steps:**

1. Type "Lob" in vendor field
2. Select "Loblaws" from suggestions

**Expected Result:**

- Purchase Type auto-fills to "Groceries"
- Earning Category auto-fills to "Grocery"
- Both fields remain editable

---

### FUT-172: Card Recommendation with Point Calculation

**Covers:** FRM-002, ENH-002

**Preconditions:**

- EC = "Dining", Amount = $500
- TD Aeroplan Visa Infinite earns 3x on Dining

**Steps:**

1. Observe recommendation panel

**Expected Result:**

- Panel shows: "TD Aeroplan Visa Infinite — 3x Dining → 1,500 pts"
- Card field remains blank

---

### FUT-173: Inline Vendor Creation

**Covers:** FRM-002

**Preconditions:**

- No vendor "Blue Moon Bakery" exists

**Steps:**

1. Type "Blue Moon" in vendor field
2. No match — `+ Create Vendor` appears
3. Click it
4. Enter "Blue Moon Bakery" in dialog, Save

**Expected Result:**

- Dialog closes
- "Blue Moon Bakery" auto-selected in vendor field
- Vendor entity created

---

### FUT-174: Inline Purchase Type Creation

**Covers:** FRM-002

**Preconditions:**

- No Purchase Type "Pet Supplies" exists

**Steps:**

1. Open PT picker
2. Type "Pet" — no match
3. Click `+ Create Purchase Type`
4. Enter "Pet Supplies", Save

**Expected Result:**

- PT created and auto-selected

---

### FUT-175: Save and Create Another

**Covers:** FRM-002

**Preconditions:**

- Valid transaction saved (today, $45, Loblaws, TD Aeroplan)

**Steps:**

1. Click "Create Another"

**Expected Result:**

- New create form opens
- Date = today (carried over)
- Card = TD Aeroplan (carried over)
- All other fields blank

---

### FUT-176: Expense Split — Dollar Amount

**Covers:** FRM-002

**Preconditions:**

- Transaction amount = $100

**Steps:**

1. Enter my_share_amount = $60

**Expected Result:**

- my_share_pct auto-calculates to 60%

---

### FUT-177: Expense Split — Percentage

**Covers:** FRM-002

**Preconditions:**

- Transaction amount = $100

**Steps:**

1. Enter my_share_pct = 25%

**Expected Result:**

- my_share_amount auto-calculates to $25

---

### FUT-178: Fully Reimbursed Transaction

**Covers:** FRM-002

**Preconditions:**

- Transaction amount = $100

**Steps:**

1. Set my_share_amount = 0
2. Save

**Expected Result:**

- Churning counts full $100
- Budget counts $0

---

### FUT-179: Goal Linking

**Covers:** FRM-002, FRM-008

**Preconditions:**

- Goal "Japan Trip" exists at $340/$500

**Steps:**

1. Open combined PT/Goal picker
2. Select "Japan Trip" from Goals group

**Expected Result:**

- Goal linked
- Purchase Type cleared
- Goal shows icon + "$340 / $500" progress

---

### FUT-180: Goal / PT Mutual Exclusion

**Covers:** FRM-002

**Preconditions:**

- Goal "Japan Trip" currently selected

**Steps:**

1. Open combined picker
2. Select "Groceries" from Purchase Types group

**Expected Result:**

- Purchase Type set to "Groceries"
- Goal cleared

---

### FUT-181: Refund Toggle

**Covers:** FRM-002

**Preconditions:**

- Amount = $45, toggle = Purchase

**Steps:**

1. Switch toggle to Refund
2. Save

**Expected Result:**

- Transaction saved with amount = -$45.00

---

### FUT-182: Edit SimpleFIN Transaction

**Covers:** FRM-002

**Preconditions:**

- Existing SimpleFIN transaction in FRM-001 list

**Steps:**

1. Click transaction in list

**Expected Result:**

- Object Page opens
- All fields editable except source ("simplefin", read-only) and import metadata

---

### FUT-183: Edit Triggers ENH-001 Learning

**Covers:** FRM-002, ENH-001

**Preconditions:**

- SimpleFIN transaction with EC = "Other"

**Steps:**

1. Change EC to "Grocery"
2. Save

**Expected Result:**

- ENH-001 learning triggered — future transactions from same vendor auto-categorize as EC=Grocery

---

### FUT-184: Duplicate Detection

**Covers:** FRM-002

**Preconditions:**

- Creating: Jan 15, $45, Loblaws
- Existing: Jan 15, $43, Loblaws (SimpleFIN)

**Steps:**

1. Click Save

**Expected Result:**

- Warning: "A similar transaction exists: $43.00 at Loblaws on Jan 15 (SimpleFIN). Continue anyway?"
- Dismissible — user can proceed or cancel

---

### FUT-185: Backdated Budget Warning

**Covers:** FRM-002

**Preconditions:**

- Current month: February 2026
- Transaction date: January 20, 2026

**Steps:**

1. Click Save

**Expected Result:**

- Warning: "This transaction falls in a closed budget period (January 2026). Budget figures will be recalculated."
- Dismissible

---

### FUT-186: Card Date Filtering

**Covers:** FRM-002

**Preconditions:**

- Card "TD Aeroplan" opened February 1, 2026
- Transaction date: January 15, 2026

**Steps:**

1. Open card picker

**Expected Result:**

- TD Aeroplan not shown (not active on Jan 15)

---

### FUT-187: Delete Transaction

**Covers:** FRM-002

**Preconditions:**

- Transaction open on Object Page

**Steps:**

1. Click Delete
2. Confirm in dialog

**Expected Result:**

- Transaction deleted
- Navigate back to FRM-001 list

---

### FUT-188: Required Field Validation

**Covers:** FRM-002

**Preconditions:**

- Amount and vendor filled, no category or goal selected

**Steps:**

1. Attempt Save

**Expected Result:**

- Save disabled
- Validation message on category field

---

### FUT-189: Recent Vendors First

**Covers:** FRM-002

**Preconditions:**

- Recent vendors: Loblaws, Tim Hortons, Costco

**Steps:**

1. Focus vendor field (or type 1 char)

**Expected Result:**

- Recent vendors shown at top before alphabetical list

---

### FUT-190: Split Share Exceeds Amount

**Covers:** FRM-002

**Preconditions:**

- Transaction amount = $100

**Steps:**

1. Enter my_share_amount = $150

**Expected Result:**

- Validation error: share cannot exceed transaction amount
- Save blocked
