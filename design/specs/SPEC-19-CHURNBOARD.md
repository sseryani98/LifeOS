# SPEC-19: Churnboard

**Spec ID:** SPEC-19
**Name:** Churnboard
**FRICEW Objects:** RPT-001
**Wave(s):** Wave 1 (W1-S5), Wave 2 (W2-S1)
**CDS Service(s):** ChurningService
**App:** `app/churnboard/`
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-20 | Sandro & Claude | Initial creation — SPEC-19 workshop complete. D-209 through D-223 logged. |
| 2026-02-20 | Claude | Post-audit: Fixed alert type names — bonus_deadline_near→msr_deadline, sync_error→connection_error, over_budget→budget_overspend. |

---

## 2. Overview

The Churnboard is the primary churning dashboard — the single screen that answers "how's my churning year going?" It aggregates outputs from five enhancement engines (ENH-002, ENH-003, ENH-004, ENH-005, ENH-006) into a year-scoped, 10-section freestyle dashboard. Sections cover net value, bonus progress, spend distribution, reward yield, profitability, points balances, upcoming fees, issuer eligibility, card recommendations, and alerts.

Key decisions: D-209 (layout), D-210 (hero KPI), D-211–D-219 (per-section), D-220 (issuer colors), D-221 (cross-navigation), D-222 (empty state), D-223 (cross-spec alert list).

---

## 3. Data Model References

| Entity | Role |
|--------|------|
| Card Instance | Card portfolio — lifecycle state, activation date, fees |
| Market Card | Card product metadata — issuer, rewards program |
| Issuer | Issuer identity — name, color mapping |
| Offer | Signup offers linked to card instances |
| Offer Tranche | Per-tranche bonus targets and progress (via ENH-003) |
| Transaction | Spend data aggregated per card/month/year |
| Earning Multiplier | Yield rates per card × earning category (via ENH-002) |
| Rewards Program | Points program identity and valuation (via ENH-006) |
| Points Ledger | Points balance computation source (via ENH-006) |
| Issuer Application Rule | Eligibility rules per issuer (via ENH-004) |
| Alert | Stored alerts filtered to churning-related types |
| Alert Type | Alert type definitions for filtering and display |

No DM-001 amendments required. This spec is a read-only consumer of existing entities and engines.

---

## 4. Functional Description

### 4.1 RPT-001 — Churnboard [Report]

Freestyle dashboard using `sap.f.GridContainer` with 2-column base grid per DS-001. Page title: "Churnboard". Year selector top-left, defaults to current calendar year on load.

#### 4.1.1 Dashboard Layout

| Row | Left (half) | Right (half) |
|-----|-------------|--------------|
| 1 | Net Value Hero KPI (full-width) | — |
| 2 | Bonus Progress (full-width) | — |
| 3 | CC Spend by Card | Reward Yield Trend |
| 4 | Realized Value vs Fees | Points Balances |
| 5 | Upcoming Fees | Issuer Eligibility |
| 6 | Card Recommendation by Category (full-width) | — |
| 7 | Alerts (full-width) | — |

Ordering logic: headline → active work → analysis → decisions → actions.

All sections compute fresh on page load and when the year selector changes. Year-independent sections (Points Balances, Upcoming Fees, Issuer Eligibility, Card Recommendation) are unaffected by the year selector.

#### 4.1.2 Empty State

When no cards exist in the system, the dashboard shows a single message: "Add your first card to get started" with navigation to FRM-006 (Card Onboarding). No dashboard sections are rendered.

#### 4.1.3 Net Value Hero KPI

Full-width card. Consumes ENH-005 (Card Profitability) aggregated across all cards with any activity in the selected year, regardless of current lifecycle status.

| Element | Content |
|---------|---------|
| Primary number | Net Churning Value = Σ(rewards earned − annual fees paid) |
| Semantic color | Success (green) if ≥ 0, Error (red) if negative |
| Subtitle | "Rewards: ${total} \| Fees: ${total}" |
| Trend indicator | YoY delta with up/down arrow and amount. Hidden if selected year is the earliest year with data. |

#### 4.1.4 Bonus Progress

Full-width table. Consumes ENH-003 (Signup Bonus Tracker). Shows only tranches with status **In Progress** or **Pending**. Focus cards grouped at top with visual separator, Active cards below.

| Column | Content | Width |
|--------|---------|-------|
| Card | Card name + issuer (link → FRM-004 object page) | 20% |
| Tranche | "Tranche N of M" | 10% |
| Status | ObjectStatus (In Progress = Information, Pending = None) | 10% |
| Qualifying Spend | Dollar amount so far | 10% |
| Target | Tranche threshold | 10% |
| Progress | `sap.m.ProgressIndicator` (qualifying spend / target) | 15% |
| Remaining | Dollars left to hit target | 10% |
| Days Left | Days until tranche deadline. Semantic color: Success (green) >30d, Warning (orange) 8–30d, Error (red) ≤7d | 8% |
| Reward | Points/value for hitting this tranche | 7% |

#### 4.1.5 CC Spend by Card

Half-width card. Horizontal bar chart showing annual spend per card for the selected year.

- Top 5 cards by spend only, sorted descending.
- Bars colored by issuer using domain-mapped issuer colors (D-220).
- VizFrame with default tooltip interaction.

#### 4.1.6 Reward Yield Trend

Half-width card. Line chart with months (Jan–Dec) on x-axis and yield percentage on y-axis.

- One line per issuer (domain-mapped color) + one aggregate line (grey, dashed).
- Yield = total rewards earned ÷ total spend × 100, per month.
- Months with no spend for a given issuer show no data point (gap in line), not zero.
- Only issuers with spend in the selected year appear.

#### 4.1.7 Realized Value vs Fees

Half-width card. Diverging horizontal bar chart showing net value (rewards − fees) per card for the selected year. Consumes ENH-005.

- All cards with any activity in the selected year, regardless of lifecycle status.
- Positive bars extend right (Success/green), negative bars extend left (Error/red).
- Sorted by net value descending.
- Bars colored by issuer using domain-mapped issuer colors (D-220).

#### 4.1.8 Points Balances

Half-width table. Consumes ENH-006 (Points Balance & Valuation). **Year-independent** — shows current balances.

| Column | Content | Width |
|--------|---------|-------|
| Program | Rewards program name (link → RPT-010) | 40% |
| Balance | Points count formatted with thousands separator | 30% |
| Value | Dollar equivalent | 30% |

Sorted by dollar value descending.

#### 4.1.9 Upcoming Fees

Half-width table. Shows cards with annual fees due within the next 90 days from today. **Year-independent.**

| Column | Content | Width |
|--------|---------|-------|
| Card | Card name + issuer (link → FRM-004 object page) | 25% |
| AF Amount | Dollar amount | 15% |
| AF Date | Next annual fee date | 15% |
| Days Until | Countdown | 10% |
| Net Value | Card's YTD net value (ENH-005) | 15% |
| Keep/Cancel | Success (green ✓) if YTD net value ≥ AF amount, Error (red ✗) if not | 20% |

Sorted by Days Until ascending (most urgent first).

#### 4.1.10 Issuer Eligibility

Half-width table. Consumes ENH-004 (Issuer Eligibility Engine). **Year-independent** — reflects current state.

| Column | Content | Width |
|--------|---------|-------|
| Issuer | Issuer name | 25% |
| Status | ObjectStatus: Eligible = Success, Cooldown = Warning, At Limit = Error | 25% |
| Active Cards | Count of current active cards | 25% |
| Next Eligible | Date if Cooldown, "Now" if Eligible, "—" if At Limit | 25% |

Only issuers where the user has or has had at least one card are shown.

#### 4.1.11 Card Recommendation by Category

Full-width table. Consumes ENH-002 (Card Recommendation Engine) condensed output. **Year-independent.**

| Column | Content | Width |
|--------|---------|-------|
| Earning Category | Category name (link → RPT-006) | 25% |
| Best Card | Best wallet card for this category | 20% |
| Yield | Earn rate (e.g., "4x" or "4%") | 10% |
| Runner-Up | Second-best wallet card | 20% |
| Runner-Up Yield | Runner-up earn rate | 10% |
| Wallet Gap | Warning indicator if market best yields >2x user's best | 15% |

#### 4.1.12 Alerts

Full-width table. Shows unacknowledged alerts of **churning-related types only** (af_approaching, cancel_reminder, msr_deadline, connection_error, offers_pending_approval, and similar). Budget alerts are excluded — they appear on RPT-002.

| Column | Content | Width |
|--------|---------|-------|
| Type | Alert type icon + label | 15% |
| Message | Alert description text | 35% |
| Related Card | Card name if applicable (link → FRM-004) | 20% |
| Date | Alert generation date | 15% |
| Action | Contextual action button | 15% |

Sorted by date descending (newest first).

**Contextual actions per alert type:**

| Alert Type | Action Label | Navigation |
|------------|-------------|------------|
| af_approaching | Go to Card | FRM-004 object page |
| cancel_reminder | Go to Card | FRM-004 object page |
| msr_deadline | Go to Card | FRM-004 object page |
| offers_pending_approval | View Offers | FRM-005 Market Cards |
| connection_error | View Connection | FRM-010 SimpleFIN Manager |
| (default) | Dismiss | Marks alert acknowledged |

All alert types also have Dismiss as a secondary action.

#### 4.1.13 Issuer Color Assignments

System-wide constants used across all charts in the application. Defined here per D-61.

| Issuer | Color | CSS Token |
|--------|-------|-----------|
| TD | Green | `sapChart_OrderedColor_1` or custom `#00A650` |
| Amex | Blue | `sapChart_OrderedColor_2` or custom `#006FCF` |
| CIBC | Red | `sapChart_OrderedColor_3` or custom `#C41F3E` |
| Scotia | Gold | `sapChart_OrderedColor_4` or custom `#EC111A` → Gold `#FFB819` |
| BMO | Teal | `sapChart_OrderedColor_5` or custom `#0079C1` → Teal `#009B8D` |
| RBC | Purple | `sapChart_OrderedColor_6` or custom `#005DAA` → Purple `#7B2D8E` |
| Aggregate | Grey (dashed) | `sapNeutralColor` |

Exact hex values to be finalized during build. Issuers not in this list fall back to VizFrame's auto-assigned qualitative palette.

#### 4.1.14 Cross-Navigation

| Source Element | Target |
|----------------|--------|
| Card name (any table) | FRM-004 My Cards → card object page |
| Earning category (recommendation table) | RPT-006 Recommendation Matrix |
| Points program (balances table) | RPT-010 Points Dashboard |
| Alert row contextual action | Per alert type (see §4.1.12) |

No chart click-through navigation per D-61 (VizFrame default interactions only).

---

## 5. Business Rules

### Dashboard Scope & Layout

- **BR-01:** The Churnboard displays data scoped to a calendar year (Jan 1 – Dec 31) selected via the year selector.
- **BR-02:** The year selector defaults to the current year on page load.
- **BR-03:** All sections are computed fresh on page load and when the year selector changes.
- **BR-04:** The page title is "Churnboard" with the year selector positioned top-left.
- **BR-05:** On first use (no cards exist), the dashboard shows a single empty-state message "Add your first card to get started" with navigation to FRM-006.

### Net Value Hero KPI

- **BR-06:** Net Churning Value = sum of (rewards earned − annual fees paid) across all cards with any activity in the selected year, regardless of current lifecycle status.
- **BR-07:** The hero card displays: net value (primary number), rewards total and fees total (subtitle), and year-over-year delta with up/down indicator.
- **BR-08:** Net value is displayed in Success (green) if ≥ 0, Error (red) if negative.
- **BR-09:** If the selected year is the earliest year with data, the YoY trend indicator is hidden.

### Bonus Progress

- **BR-10:** Bonus Progress shows only tranches with status In Progress or Pending.
- **BR-11:** Focus cards are grouped at the top, separated from Active cards below.
- **BR-12:** Each row displays a `ProgressIndicator` showing qualifying spend vs. target.
- **BR-13:** Days Left column uses semantic coloring: Success (green) if >30 days, Warning (orange) if 8–30 days, Error (red) if ≤7 days.
- **BR-14:** Clicking a card name navigates to the card's object page on FRM-004.

### CC Spend by Card

- **BR-15:** Horizontal bar chart showing annual spend per card for the selected year, sorted descending.
- **BR-16:** Only the top 5 cards by spend are shown.
- **BR-17:** Bars are colored by issuer using domain-mapped issuer colors.

### Reward Yield Trend

- **BR-18:** Line chart with months (Jan–Dec) on x-axis and yield percentage on y-axis.
- **BR-19:** One line per issuer (domain-mapped color) plus one aggregate line (grey, dashed).
- **BR-20:** Yield = total rewards earned ÷ total spend × 100, calculated per month.
- **BR-21:** Months with no spend for a given issuer show no data point (gap in line), not zero.

### Realized Value vs Fees

- **BR-22:** Diverging horizontal bar chart showing net value (rewards − fees) per card for the selected year.
- **BR-23:** All cards with any activity in the selected year are shown, regardless of lifecycle status.
- **BR-24:** Positive bars extend right (Success/green), negative bars extend left (Error/red).
- **BR-25:** Sorted by net value descending.
- **BR-26:** Bars colored by issuer using domain-mapped issuer colors.

### Points Balances

- **BR-27:** Table showing current point balances per rewards program, unaffected by the year selector.
- **BR-28:** Columns: Program, Balance (points), Value (dollar equivalent from ENH-006).
- **BR-29:** Sorted by dollar value descending.
- **BR-30:** Clicking a program name navigates to RPT-010 (Points Dashboard).

### Upcoming Fees

- **BR-31:** Table showing cards with annual fees due within the next 90 days.
- **BR-32:** Columns: Card, AF Amount, AF Date, Days Until, Net Value, Keep/Cancel signal.
- **BR-33:** Keep/Cancel signal: Success (green checkmark) if card's year-to-date net value ≥ AF amount, Error (red X) if not.
- **BR-34:** Sorted by Days Until ascending (most urgent first).
- **BR-35:** Upcoming Fees is unaffected by the year selector — always shows the next 90 days from today.

### Issuer Eligibility

- **BR-36:** Table showing one row per issuer.
- **BR-37:** Columns: Issuer, Status (Eligible/Cooldown/At Limit as ObjectStatus), Active Cards count, Next Eligible date.
- **BR-38:** Status "Eligible" = Success (green), "Cooldown" = Warning (orange), "At Limit" = Error (red).
- **BR-39:** Issuer Eligibility is unaffected by the year selector — always reflects current state.
- **BR-40:** Only issuers where the user has or has had at least one card are shown.

### Card Recommendation by Category

- **BR-41:** Table showing best wallet card per earning category, consuming ENH-002's condensed output.
- **BR-42:** Columns: Earning Category, Best Card, Yield, Runner-Up + Yield, Wallet Gap flag.
- **BR-43:** Wallet Gap flag: Warning indicator shown if the best market card for that category yields >2x the user's best wallet card.
- **BR-44:** Clicking an earning category navigates to RPT-006 (Recommendation Matrix).
- **BR-45:** Card Recommendation is unaffected by the year selector — always reflects current card portfolio.

### Alerts

- **BR-46:** Table showing unacknowledged alerts of churning-related types only.
- **BR-47:** Columns: Type (icon + label), Message, Related Card, Date, Action.
- **BR-48:** Sorted by date descending (newest first).
- **BR-49:** Each alert type has a contextual action: "Go to Card" for af_approaching/cancel_reminder, "View Offers" for offers_pending_approval, "Dismiss" as default fallback.
- **BR-50:** Dismissing an alert marks it as acknowledged in the Alert entity.

### Issuer Colors

- **BR-51:** Six domain-mapped issuer colors are defined as system-wide constants: TD = Green, Amex = Blue, CIBC = Red, Scotia = Gold, BMO = Teal, RBC = Purple.
- **BR-52:** The aggregate line on Reward Yield Trend uses grey with dashed style.
- **BR-53:** Any issuer not in the six mapped issuers falls back to VizFrame's auto-assigned palette.

---

## 6. Error Handling

| Condition | Response | i18n Key |
|-----------|----------|----------|
| ENH-005 computation fails | Hero KPI shows "Unable to calculate" placeholder | `churnboard.error.profitabilityUnavailable` |
| ENH-003 computation fails | Bonus Progress shows "Unable to load bonus data" | `churnboard.error.bonusUnavailable` |
| ENH-006 computation fails | Points Balances shows "Unable to load balances" | `churnboard.error.pointsUnavailable` |
| ENH-004 computation fails | Issuer Eligibility shows "Unable to load eligibility" | `churnboard.error.eligibilityUnavailable` |
| ENH-002 computation fails | Card Recommendation shows "Unable to load recommendations" | `churnboard.error.recommendationUnavailable` |
| No transactions in selected year | Year-scoped sections show "No data for [year]" | `churnboard.info.noDataForYear` |
| No cards exist | Full-page empty state with FRM-006 link | `churnboard.info.noCards` |

Each section fails independently — a failure in one engine does not prevent other sections from rendering.

---

## 7. Open Items

| OI | Status | Resolution |
|----|--------|------------|
| OI-06 | Incremental | RPT-001 does not generate alerts. It consumes and displays churning-related alerts generated by other specs (SPEC-03, SPEC-04, SPEC-01, SPEC-13). |

**Cross-spec note for SPEC-15 (Alerts & Notifications):** Sandro requested a centralized Fiori Elements list report for all alert types across all domains (churning, budget, sync). This should be designed as part of SPEC-15. (D-223)

---

## 8. Functional Unit Tests

### FUT-001: Dashboard loads with year selector defaulting to current year

**Covers:** RPT-001

**Preconditions:**

- Cards exist with transactions in 2025 and 2026.

**Steps:**

1. Navigate to Churnboard.

**Expected Result:**

- Year selector shows 2026 (current year). All year-scoped sections display 2026 data.

---

### FUT-002: Year selector changes refresh all sections

**Covers:** RPT-001

**Preconditions:**

- Cards exist with transactions in 2025 and 2026.

**Steps:**

1. Navigate to Churnboard.
2. Change year selector to 2025.

**Expected Result:**

- Hero KPI, CC Spend, Reward Yield, Realized Value vs Fees update to 2025 data.
- Points Balances, Upcoming Fees, Issuer Eligibility, Card Recommendation remain unchanged.

---

### FUT-003: Hero KPI shows positive net value in green

**Covers:** RPT-001, ENH-005

**Preconditions:**

- Selected year has total rewards $4,000 and total fees $1,200.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Net value displays "$2,800" in Success (green). Subtitle shows "Rewards: $4,000 | Fees: $1,200".

---

### FUT-004: Hero KPI shows negative net value in red

**Covers:** RPT-001, ENH-005

**Preconditions:**

- Selected year has total rewards $500 and total fees $1,200.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Net value displays "-$700" in Error (red).

---

### FUT-005: YoY trend hidden for earliest year

**Covers:** RPT-001

**Preconditions:**

- Earliest year with data is 2023. Year selector set to 2023.

**Steps:**

1. View hero KPI.

**Expected Result:**

- Year-over-year delta indicator is not displayed.

---

### FUT-006: Bonus Progress shows only actionable tranches

**Covers:** RPT-001, ENH-003

**Preconditions:**

- Card A has Tranche 1 (Met), Tranche 2 (In Progress). Card B has Tranche 1 (Pending). Card C has all tranches Missed.

**Steps:**

1. View Bonus Progress section.

**Expected Result:**

- Card A Tranche 2 and Card B Tranche 1 shown. Card A Tranche 1 and Card C not shown.

---

### FUT-007: Focus cards grouped above Active cards

**Covers:** RPT-001, ENH-003

**Preconditions:**

- Card A (Focus) has In Progress tranche. Card B (Active) has In Progress tranche.

**Steps:**

1. View Bonus Progress section.

**Expected Result:**

- Card A appears above a visual separator. Card B appears below it.

---

### FUT-008: Days Left urgency coloring

**Covers:** RPT-001, ENH-003

**Preconditions:**

- Card A tranche has 45 days left. Card B tranche has 20 days left. Card C tranche has 5 days left.

**Steps:**

1. View Bonus Progress section.

**Expected Result:**

- Card A Days Left in Success (green). Card B in Warning (orange). Card C in Error (red).

---

### FUT-009: CC Spend shows top 5 only

**Covers:** RPT-001

**Preconditions:**

- 8 cards with spend in selected year.

**Steps:**

1. View CC Spend chart.

**Expected Result:**

- Only 5 bars displayed, representing the 5 highest-spend cards, sorted descending.

---

### FUT-010: Reward Yield shows per-issuer lines plus aggregate

**Covers:** RPT-001

**Preconditions:**

- Cards from TD, Amex, and CIBC with transactions across multiple months.

**Steps:**

1. View Reward Yield Trend chart.

**Expected Result:**

- Three issuer lines in domain-mapped colors (TD green, Amex blue, CIBC red) plus one grey dashed aggregate line. Scotia/BMO/RBC lines absent (no cards).

---

### FUT-011: Reward Yield gaps for months with no spend

**Covers:** RPT-001

**Preconditions:**

- TD cards have spend in Jan, Feb, Apr (no March).

**Steps:**

1. View Reward Yield Trend chart.

**Expected Result:**

- TD line shows data points for Jan, Feb, Apr. No data point for March (gap in line).

---

### FUT-012: Realized Value diverging bars

**Covers:** RPT-001, ENH-005

**Preconditions:**

- Card A net value +$800. Card B net value -$200.

**Steps:**

1. View Realized Value vs Fees chart.

**Expected Result:**

- Card A bar extends right in green. Card B bar extends left in red. Card A above Card B (sorted descending).

---

### FUT-013: Points Balances unaffected by year selector

**Covers:** RPT-001, ENH-006

**Preconditions:**

- Aeroplan balance 84,200 pts ($1,263). Year selector set to 2024.

**Steps:**

1. View Points Balances table.

**Expected Result:**

- Shows current balances regardless of year. Aeroplan row: 84,200 and $1,263. Sorted by dollar value descending.

---

### FUT-014: Points Balances navigation

**Covers:** RPT-001, ENH-006

**Preconditions:**

- Aeroplan row visible in Points Balances.

**Steps:**

1. Click "Aeroplan" program name.

**Expected Result:**

- Navigates to RPT-010 (Points Dashboard).

---

### FUT-015: Upcoming Fees with Keep/Cancel signal

**Covers:** RPT-001, ENH-005

**Preconditions:**

- Card A: AF $120 due in 30 days, YTD net value $450. Card B: AF $500 due in 15 days, YTD net value $200.

**Steps:**

1. View Upcoming Fees table.

**Expected Result:**

- Card A shows green checkmark ($450 ≥ $120). Card B shows red X ($200 < $500). Card B appears first (15 days < 30 days).

---

### FUT-016: Upcoming Fees 90-day window

**Covers:** RPT-001

**Preconditions:**

- Card A AF due in 60 days. Card B AF due in 120 days.

**Steps:**

1. View Upcoming Fees table.

**Expected Result:**

- Card A shown. Card B not shown.

---

### FUT-017: Issuer Eligibility status display

**Covers:** RPT-001, ENH-004

**Preconditions:**

- TD = Eligible (2 active cards). Amex = Cooldown (next eligible 2026-06-01). CIBC = At Limit (4 active cards).

**Steps:**

1. View Issuer Eligibility table.

**Expected Result:**

- TD: Success "Eligible", 2, "Now". Amex: Warning "Cooldown", count, "2026-06-01". CIBC: Error "At Limit", 4, "—".

---

### FUT-018: Issuer Eligibility only shows issuers with history

**Covers:** RPT-001, ENH-004

**Preconditions:**

- User has cards from TD, Amex, CIBC only. No BMO/RBC/Scotia cards ever.

**Steps:**

1. View Issuer Eligibility table.

**Expected Result:**

- Only TD, Amex, CIBC rows shown.

---

### FUT-019: Wallet Gap flag on recommendation

**Covers:** RPT-001, ENH-002

**Preconditions:**

- User's best Dining card yields 2%. Market best Dining card yields 5% (>2x). User's best Gas card yields 3%. Market best Gas card yields 4% (<2x).

**Steps:**

1. View Card Recommendation table.

**Expected Result:**

- Dining row shows Warning flag. Gas row does not.

---

### FUT-020: Recommendation navigation

**Covers:** RPT-001, ENH-002

**Preconditions:**

- Card Recommendation table visible.

**Steps:**

1. Click "Dining" earning category.

**Expected Result:**

- Navigates to RPT-006 (Recommendation Matrix).

---

### FUT-021: Alerts show churning-only types

**Covers:** RPT-001

**Preconditions:**

- 2 unacknowledged alerts: af_approaching (churning), budget_overspend (budget).

**Steps:**

1. View Alerts section.

**Expected Result:**

- Only af_approaching alert shown. budget_overspend not displayed.

---

### FUT-022: Alert contextual action — Go to Card

**Covers:** RPT-001

**Preconditions:**

- Unacknowledged af_approaching alert for Card A.

**Steps:**

1. Click "Go to Card" action on the alert row.

**Expected Result:**

- Navigates to Card A's object page on FRM-004.

---

### FUT-023: Alert dismiss

**Covers:** RPT-001

**Preconditions:**

- Unacknowledged alert visible.

**Steps:**

1. Click "Dismiss" action.

**Expected Result:**

- Alert marked as acknowledged and removed from the table.

---

### FUT-024: Empty state on first use

**Covers:** RPT-001

**Preconditions:**

- No cards exist in the system.

**Steps:**

1. Navigate to Churnboard.

**Expected Result:**

- Single message "Add your first card to get started" with navigation link to FRM-006. No dashboard sections visible.

---

### FUT-025: Issuer color consistency

**Covers:** RPT-001

**Preconditions:**

- Cards from TD and Amex with spend data.

**Steps:**

1. View CC Spend chart and Realized Value vs Fees chart.

**Expected Result:**

- TD bars are green in both charts. Amex bars are blue in both charts.

---

*This spec traces to [Business Architecture](../BUSINESS_ARCHITECTURE.md) (RPT-001), [Data Model](../DATA_MODEL.md), [Design System](../DESIGN_SYSTEM.md) (D-56 through D-62), and [Decisions Log](../user-profile/DECISIONS_LOG.md) (D-209 through D-223). Consumes engines from [SPEC-04](SPEC-04-BONUS-AND-POINTS.md) (ENH-003, ENH-006), [SPEC-07](SPEC-07-CARD-RECOMMENDATION.md) (ENH-002), [SPEC-08](SPEC-08-CARD-PROFITABILITY.md) (ENH-005), and SPEC-16 (ENH-004, pending).*
