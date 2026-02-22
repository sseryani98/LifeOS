# Design System

**Document ID:** DS-001
**Version:** 1.0
**Date:** 2026-02-16
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-16 | Sandro & Claude | Initial creation — Step 8 complete. D-56 through D-62 logged. |
| 2026-02-16 | Sandro & Claude | Added table standards: 100% column widths, filter-column parity, table titles with counts, search on all tables, personalization on all tables, collection/reference facet pattern for object pages. |
| 2026-02-20 | Claude | Status → Approved. Step 12 complete — all 21 specs approved. |
| 2026-02-21 | Sandro & Claude | §6 (D-60) amended by TH-001. Custom brand palette (Warm Charcoal `#3D3A38`) replaces "no custom accent." Semantic colors unchanged. See [THEME.md](THEME.md) for full override spec. |

---

## 2. Summary

| Aspect | Decision |
|--------|----------|
| **Theme** | SAP Horizon Light (`sap_horizon`) |
| **Density** | Compact (`sapUiSizeCompact`) |
| **Navigation** | Side navigation — 5 groups |
| **Dashboard Layout** | `sap.f.GridContainer` — 2-column base grid |
| **Colors** | Warm Charcoal brand (`#3D3A38`) + standard Horizon semantic colors. See [TH-001](THEME.md). |
| **Charts** | VizFrame primary, ApexCharts fallback. Domain-mapped colors for issuers. |
| **Status Indicators** | `ObjectStatus` / `ObjectNumber` with Horizon semantic states |
| **Page Patterns** | Fiori Elements (scrolling object pages) + Freestyle (GridContainer dashboards, Wizard flows) |
| **Empty States** | Standard `noDataText` — no illustrated empty states in V1 |

---

## 3. Theme & Density

**Decision D-56.**

- **Theme:** SAP Horizon Light (`sap_horizon`). Current-generation SAP theme with best SAPUI5 1.120+ component support. Loaded from SAP CDN.
- **Density:** Compact (`sapUiSizeCompact`). Desktop-first, mouse-driven, data-dense screens. ~32px row height. Applied globally via `<body>` class.

Dark mode (`sap_horizon_dark`) is not in scope for V1. Can be added later as a runtime theme toggle — no architectural impact.

---

## 4. Navigation

**Decision D-57, D-58.**

Side navigation using `sap.tl.ShellBar` + `sap.tl.SideNavigation`. Persistent left sidebar with grouped menu items. Collapsible to icon-only (~48px) for full-width dashboard viewing.

### Navigation Groups

| Group | Nav Items | FRICEW IDs |
|-------|-----------|------------|
| **Transactions** | Transaction List, CSV Import, Transaction Entry (W2) | FRM-001, FRM-003, FRM-002 |
| **Churning — Cards** | My Cards, Card Onboarding, Market Cards (W3) | FRM-004, FRM-006, FRM-005 |
| **Churning — Analytics** | Churnboard, Trophy Case (W2), Card Analytics (W3), Recommendation Matrix (W2), Perk Tracker (W3), Points Dashboard (W3), Annual Summary (W3) | RPT-001, RPT-004, RPT-005, RPT-006, RPT-008, RPT-010, RPT-009 |
| **Finances** | Budget Dashboard, Income Entry, Goals (W2), Goal Progress (W2), Spending Trends (W3), Income vs Expenses (W3), Financial Picture Entry (W3), Financial Picture Dashboard (W3) | RPT-002, FRM-007, FRM-008, RPT-011, RPT-007, RPT-012, FRM-011, RPT-003 |
| **Admin** | Master Data, SimpleFIN Connections | FRM-009, FRM-010 |

**23 screens across 5 groups.** Items within each group are listed in typical usage order. Wave-gated items (W2, W3) appear in the nav structure from Wave 1 but are disabled until their wave is built.

### Why Side Navigation

- 23 screens is too many for a tile-based launchpad
- Weekly workflow (WFL-001) crosses 4+ screens — persistent nav avoids back-to-home round trips
- Collapses to icons when dashboards need full width
- Groups align naturally to CDS service domains

---

## 5. Dashboard Layout

**Decision D-59.**

All 12 freestyle dashboards use `sap.f.GridContainer` with a **base 2-column grid**. Cards can span 1 column (half-width) or 2 columns (full-width).

| Card Size | Use Case |
|-----------|----------|
| Half-width (1 col) | KPI cards, small charts, compact tables |
| Full-width (2 col) | Hero charts, wide comparison tables, time-series charts |

Dashboards scroll vertically. Each dashboard spec defines its own card arrangement, but all use the same grid system.

### Dashboard Shell Pattern

```
┌─ ShellBar ──────────────────────────────────────────────┐
│  App Title                                              │
├─ Side Nav ──┬─ Page ────────────────────────────────────┤
│             │  Page Title + Filter Bar (period selector) │
│  Txns       │  ┌─────────────┬─────────────┐            │
│  Churning   │  │  Card (1col) │  Card (1col) │           │
│   - Cards   │  ├─────────────┴─────────────┤            │
│   - Anlytcs │  │  Card (full width)          │           │
│  Finances   │  ├─────────────┬─────────────┤            │
│  Admin      │  │  Card (1col) │  Card (1col) │           │
│             │  └─────────────┴─────────────┘            │
└─────────────┴───────────────────────────────────────────┘
```

---

## 6. Color Semantics

**Decision D-60.**

Standard Horizon semantic colors only. No custom brand accent or custom CSS overrides in V1.

### Semantic Color Mapping

| Horizon Token | Color | Used For |
|---------------|-------|----------|
| **Positive / Success** | Green | Active state, met bonus, on-track budget, successful sync |
| **Critical / Error** | Red | Missed bonus, over budget, sync error |
| **Warning** | Orange | To Cancel state, near budget limit, uncategorized transaction |
| **Information** | Blue | Focus state, in-progress bonus, user-corrected categorization |
| **Neutral** | Grey | Closed state, pending bonus, never synced, historical items |

### Domain Color Mappings

| Domain | Value | Semantic State |
|--------|-------|----------------|
| Card Lifecycle — Focus | Information (blue) |
| Card Lifecycle — Active | Success (green) |
| Card Lifecycle — To Cancel | Warning (orange) |
| Card Lifecycle — Closed | Neutral (grey) |
| Bonus Tranche — Met | Success (green) |
| Bonus Tranche — In Progress | Information (blue) |
| Bonus Tranche — Pending | Neutral (grey) |
| Bonus Tranche — Missed | Error (red) |
| Categorization — Auto | Success (green) |
| Categorization — User Corrected | Information (blue) |
| Categorization — Uncategorized | Warning (orange) |
| Sync — Success | Success (green) |
| Sync — Error | Error (red) |
| Sync — Never Synced | Neutral (grey) |
| Budget — Under/on track | Positive (green) |
| Budget — Near limit (80-100%) | Warning (orange) |
| Budget — Over budget | Critical (red) |

---

## 7. Chart Conventions

**Decision D-61.**

### 7.1 Chart Libraries

- **VizFrame** — Primary. Used for all standard chart types (bar, line, donut, combination).
- **ApexCharts** — Fallback. Embedded in custom SAPUI5 controls only where VizFrame cannot achieve the required visualization. Decision made chart-by-chart during functional specs.

### 7.2 Data Series Colors

| Scope | Strategy |
|-------|----------|
| **Issuers** (4 fixed) | Domain-mapped — each issuer has a fixed color across all charts. Defined in a shared constants file. |
| **Everything else** (categories, vendors, programs) | VizFrame auto-assigned qualitative palette. Dynamic sets are too large for manual mapping. |

Issuer color assignments will be defined during the first dashboard functional spec (RPT-001 Churnboard) and documented back here.

### 7.3 Default Chart Types

These are starting points, not mandates. Each dashboard spec can override.

| Data Shape | Default Chart Type |
|------------|-------------------|
| Part-of-whole (one period) | Donut |
| Comparison across categories | Horizontal bar |
| Trend over time (1-2 series) | Line |
| Trend over time (3+ series) | Stacked bar |
| Single KPI with target | Bullet / KPI card |
| Ranking | Horizontal bar (sorted) |

### 7.4 Chart Interactions

Standard VizFrame defaults only. No custom click handlers, no cross-chart filtering, no drill-through navigation in V1.

| Interaction | Behavior |
|-------------|----------|
| Hover | Tooltip with value + label (VizFrame default) |
| Click | Tooltip only — no drill-down navigation |
| Legend | Visible below chart. Clickable to toggle series on/off. |
| Zoom / Pan | Off. Monthly granularity does not require it. |

If a specific dashboard needs richer interaction, it requests it explicitly in its functional spec.

---

## 8. Status Indicators

**Decision D-62 (part 1).**

### Components

| Component | Purpose |
|-----------|---------|
| `ObjectStatus` | Colored text + optional icon for state display in tables and object headers |
| `ObjectNumber` with `state` | Colored number for amounts with semantic meaning (budget amounts, profitability) |

### Status-to-Component Mapping

| Domain | Value | Component | State | Icon |
|--------|-------|-----------|-------|------|
| Card Lifecycle | Focus | ObjectStatus | Information | `sap-icon://target-group` |
| Card Lifecycle | Active | ObjectStatus | Success | `sap-icon://accept` |
| Card Lifecycle | To Cancel | ObjectStatus | Warning | `sap-icon://alert` |
| Card Lifecycle | Closed | ObjectStatus | None | `sap-icon://decline` |
| Bonus Tranche | Met | ObjectStatus | Success | `sap-icon://accept` |
| Bonus Tranche | In Progress | ObjectStatus | Information | `sap-icon://process` |
| Bonus Tranche | Pending | ObjectStatus | None | `sap-icon://pending` |
| Bonus Tranche | Missed | ObjectStatus | Error | `sap-icon://decline` |
| Categorization | Auto | ObjectStatus | Success | — |
| Categorization | User Corrected | ObjectStatus | Information | — |
| Categorization | Uncategorized | ObjectStatus | Warning | — |
| Sync Status | Success | ObjectStatus | Success | — |
| Sync Status | Error | ObjectStatus | Error | — |
| Sync Status | Never Synced | ObjectStatus | None | — |
| Budget Amount | Under/on track | ObjectNumber | Success | — |
| Budget Amount | Near limit | ObjectNumber | Warning | — |
| Budget Amount | Over budget | ObjectNumber | Error | — |

Icon assignments can be refined during functional specs. The pattern (ObjectStatus for states, ObjectNumber for amounts) is the standard.

---

## 9. Page Layout Standards

**Decision D-62 (part 2).**

### 9.1 Fiori Elements Pages

| Convention | Standard |
|------------|----------|
| List Report default view | Table (compact rows) |
| Filter bar | Collapsed by default, adapt-filters enabled. Every visible table column has a matching selection field. Filter order matches column order. |
| Table selection mode | Single select with row navigation to object page |
| Object page header | Dynamic header — key attributes + ObjectStatus for lifecycle/state |
| Object page sections | Scrolling sections with anchor bar navigation (standard Fiori). Always use **Collection Facets** — every collection facet has a title. Tables are **Reference Facets** inside collection facets. |
| Draft handling | Off. Single user — save on explicit action only. |
| Variant management | On for list reports. Saved filter/sort/column configurations. |

### 9.1.1 Table Standards (All Contexts)

Applies to all tables: list reports, object page tables, value help dialogs, and freestyle tables.

| Convention | Standard |
|------------|----------|
| Column widths | Must sum to 100%. No empty space to the right of the last column. |
| Table title | Always present. Includes row count — e.g., "Products (6)". Format: `{Title} ({count})`. |
| Search | Every table has a search field that searches across all visible columns. |
| Personalization | Enabled on all tables — resize columns, reorder, group, sort, filter. (`p13nMode` in Fiori Elements annotations.) |

### 9.2 Freestyle Pages — Dashboards

| Convention | Standard |
|------------|----------|
| Shell | Page title + optional filter bar → GridContainer body → vertical scroll |
| Period selector | Top-left when applicable. Month/year navigation. Shared `sap.m.Bar`. |
| Section headers | `sap.m.Title` level H2 with `sapUiSmallMarginTop` separator |
| Padding | Standard Horizon content padding (`sapUiContentPadding`) |

### 9.3 Freestyle Pages — Wizards

| Convention | Standard |
|------------|----------|
| Component | `sap.m.Wizard` |
| Flow | Linear steps, no branching |
| Final step | Review step before save |

Applies to FRM-003 (CSV Import) and FRM-006 (Card Onboarding).

### 9.4 Empty States & Loading

| Scenario | Behavior |
|----------|----------|
| List with no data | Standard `noDataText` on table (e.g., "No transactions found") |
| Dashboard with no data | Cards render with "No data available" placeholder. Cards remain visible — layout does not shift. |
| Filters produce no results | Standard `noDataText` |
| Page load | `sap.m.BusyIndicator` on page until OData returns |
| Chart loading | VizFrame built-in busy state |
| Long operations (CSV import, sync) | `sap.m.BusyDialog` with message text — blocks interaction until complete |

No illustrated empty states in V1. Standard text-based placeholders throughout.

---

## 10. Decisions Reference

Decisions made during design system definition (Step 8):

| ID | Title | Summary |
|----|-------|---------|
| D-56 | Horizon Light + Compact Density | `sap_horizon` theme, `sapUiSizeCompact` density. Desktop-first, data-dense. |
| D-57 | Side Navigation Pattern | Persistent side nav instead of launchpad tiles. 23 screens, weekly workflow needs one-click access. |
| D-58 | Navigation Grouping | 5 groups: Transactions, Churning—Cards, Churning—Analytics, Finances, Admin. Churning split for manageability, Budget + Financial Picture merged into Finances. |
| D-59 | Dashboard Grid Layout | `sap.f.GridContainer` with 2-column base. Half-width and full-width cards. Vertical scroll. |
| D-60 | Standard Semantic Colors | Horizon semantic colors only (green/orange/red/blue/grey). No custom brand accent. Domain states mapped to semantic tokens. |
| D-61 | Chart Conventions | Domain-mapped colors for 4 issuers, auto-assigned for dynamic sets. Chart type defaults by data shape. VizFrame-default interactions only. |
| D-62 | Page Standards & Status Indicators | Scrolling object pages, compact tables, variant management on. ObjectStatus for states, ObjectNumber for amounts. Standard empty states. |

---

*This document is the single source of truth for the Financial Planner visual language and UX conventions. All UI implementations reference these standards. Traces back to [Tech Stack](TECH_STACK.md) (D-47, D-48), [Business Architecture](BUSINESS_ARCHITECTURE.md) (FRICEW catalog), and [Decisions Log](user-profile/DECISIONS_LOG.md).*
