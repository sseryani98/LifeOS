# Information Architecture

**Document ID:** IA-001
**Version:** 1.0
**Date:** 2026-02-21
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-21 | Sandro & Claude | Initial creation — Step 13 complete. D-288 through D-307 logged. |
| 2026-02-21 | Sandro | Approved. |

---

## 2. Summary

This document validates and refines the navigation structure, user journeys, and page interconnections defined across DS-001 and the 21 functional specifications. It ensures every page is discoverable through intuitive paths — not just memorized sidebar positions.

| Aspect | Outcome |
|--------|---------|
| **Side nav entries** | 23 across 5 groups (revised from DS-001's original 23 — same count, different composition) |
| **Pages not in nav** | 2 (FRM-002, FRM-006 — accessed via parent list actions) |
| **Cross-page links defined** | 30+ contextual navigation links across all pages |
| **Pages side-nav-only** | 1 (RPT-009 — acceptable) |
| **Landing page** | Weekly Review (WFL-001) |
| **Wave-gating** | Hidden-until-built (nav items appear when their sprint builds them) |
| **Decisions logged** | D-288 through D-307 (20 decisions) |

---

## 3. Sitemap Validation

### 3.1 Changes from DS-001

The Design System (DS-001 §4) defined a 5-group side nav with 23 screens. Three changes emerged from functional specs:

| Change | Source | Rationale |
|--------|--------|-----------|
| **Add** Weekly Review (WFL-001) as first item in Transactions | SPEC-15, D-244 | Operational entry point for the weekly session |
| **Remove** Transaction Entry (FRM-002) from side nav | SPEC-17, D-253 | Accessed via Create button on FRM-001 — no standalone nav needed |
| **Remove** Card Onboarding (FRM-006) from side nav | D-289 | Accessed via Create on FRM-004, "Add Supplementary Card", or Churnboard empty state |
| **Move** Scraper Approvals (WFL-003) to Admin | D-290 | System management function, not an analytics view |

**Net composition:** +1 added (WFL-001), −2 removed (FRM-002, FRM-006), +1 moved (WFL-003 to Admin). Total: 23 entries.

### 3.2 Revised Navigation Structure (D-288)

| Group | Nav Items | FRICEW IDs | Count |
|-------|-----------|------------|-------|
| **Transactions** | Weekly Review, Transaction List, CSV Import | WFL-001, FRM-001, FRM-003 | 3 |
| **Churning — Cards** | My Cards, Market Cards | FRM-004, FRM-005 | 2 |
| **Churning — Analytics** | Churnboard, Trophy Case, Card Analytics, Recommendation Matrix, Perk Tracker, Points Dashboard, Annual Summary | RPT-001, RPT-004, RPT-005, RPT-006, RPT-008, RPT-010, RPT-009 | 7 |
| **Finances** | Budget Dashboard, Income Entry, Goals, Goal Progress, Spending Trends, Income vs Expenses, Financial Picture Entry, Financial Picture Dashboard | RPT-002, FRM-007, FRM-008, RPT-011, RPT-007, RPT-012, FRM-011, RPT-003 | 8 |
| **Admin** | Master Data, SimpleFIN Connections, Scraper Approvals | FRM-009, FRM-010, WFL-003 | 3 |

**23 side nav entries across 5 groups.**

### 3.3 Pages Not in Side Nav

| Page | Access Method |
|------|---------------|
| FRM-002 (Transaction Entry) | FRM-001 Create button (create mode) or row click (edit mode) |
| FRM-006 (Card Onboarding) | FRM-004 Create button, "Add Supplementary Card" action, RPT-001 empty state |

Both follow the Fiori pattern of list-report-in-nav with object-page/wizard-via-action.

---

## 4. Task Flow Mapping

### 4.1 Weekly Review Cycle

**Pages:** WFL-001 → FRM-010 → FRM-003 → FRM-001 → FRM-007 → RPT-001 → RPT-002

| Step | Page | Action |
|------|------|--------|
| 1 | WFL-001 | Open Weekly Review — see checklist with auto-detected status |
| 2 | FRM-010 | Check connection health — fix any issues |
| 3 | FRM-003 | Import Scotia CSV if due |
| 4 | FRM-001 | Review uncategorized transactions — approve, correct, split |
| 5 | FRM-007 | Set monthly income if not yet entered |
| 6 | RPT-001 | Check Churnboard — review churning metrics and alerts |
| 7 | RPT-002 | Check Budget Dashboard — review budget status and alerts |
| 8 | WFL-001 | Mark Review Complete |

Each target page has a contextual "Back to Weekly Review" link when navigated to from WFL-001 (D-291).

### 4.2 New Card Onboarding

**Pages:** FRM-004 → FRM-006 → (optionally FRM-005, FRM-010) → FRM-004

| Step | Page | Action |
|------|------|--------|
| 1 | FRM-004 | My Cards list → Create |
| 2 | FRM-006 | Step 1: Select Market Card (or "Create Market Card" → FRM-005, D-292) |
| 3 | FRM-006 | Steps 2–5: Offer terms, card details, SimpleFIN link, supp cards |
| 4 | FRM-006 | Save → completion summary with quick-action links |
| 5 | FRM-004 | "View Card" returns to card object page |

Alternative entry: RPT-001 empty state → "Add your first card" → FRM-006.

### 4.3 Budget Check

**Pages:** RPT-002 → FRM-001, FRM-008, FRM-007, FRM-009

| Step | Page | Action |
|------|------|--------|
| 1 | RPT-002 | Open Budget Dashboard — review hero KPI (remaining, burn rate, projection) |
| 2 | RPT-002 | Spot over-budget category → click category name → FRM-001 filtered |
| 3 | RPT-002 | Check uncategorized → "Review in Transaction Manager" → FRM-001 filtered |
| 4 | RPT-002 | Check goal progress → click goal name → FRM-008 detail |
| 5 | RPT-002 | Wrong allocations? → "Edit Allocations" → FRM-009 (D-293) |
| 6 | RPT-002 | Handle budget alerts → contextual actions |

### 4.4 Historical Backfill

Scripted conversion (SPEC-14, CNV-001) — not a UI flow. Claude-driven script processes CSV files. User verifies results via FRM-001 filtered by date range and source = csv. No IA concerns.

### 4.5 Goal Tracking

**Pages:** FRM-008 → RPT-011, FRM-001, RPT-002

| Step | Page | Action |
|------|------|--------|
| 1 | FRM-008 | Create goal — set target, allocation, dates |
| 2 | FRM-001 | Link transactions to spending goals via Purchase Type picker → Goals group |
| 3 | RPT-011 | Track progress — cards with progress bars, timeline, projected completion |
| 4 | RPT-002 | Budget impact — Goal Progress section shows summary with "View All Goals" → RPT-011 (D-296) |
| 5 | FRM-008 | Complete goal via action on object page |

Clicking goal name on RPT-011 navigates to FRM-008 object page (D-294).

### 4.6 Investigate Card Profitability

**Pages:** FRM-004 → RPT-005

Clean flow. FRM-004 object page → "Analytics" button → RPT-005 pre-filtered to card (SPEC-08 D-144). Card selector dropdown on RPT-005 for switching cards.

### 4.7 Find Best Card for a Purchase

Three entry points, all clean:

| Entry Point | Page | Context |
|-------------|------|---------|
| Side nav | RPT-006 | Full recommendation matrix |
| Churnboard | RPT-001 § Card Recommendation | Condensed table → click category → RPT-006 |
| Transaction entry | FRM-002 | Card recommendation panel (advisory, no auto-fill) |

---

## 5. Cross-Page Navigation

### 5.1 Complete Navigation Map

Every contextual link defined across specs and this document:

| Source | Target | Trigger | Source Spec |
|--------|--------|---------|-------------|
| WFL-001 | FRM-010, FRM-003, FRM-001, FRM-007, RPT-001, RPT-002 | Checklist item links | SPEC-15 |
| FRM-001 | FRM-002 | Row click (edit) or Create button (create) | SPEC-17 |
| FRM-004 | RPT-005 | "Analytics" button on object page | SPEC-08 |
| FRM-004 | FRM-006 | Create button or "Add Supplementary Card" | SPEC-03 |
| FRM-004 | FRM-010 | "Link SimpleFIN Account" | SPEC-03 |
| FRM-004 | RPT-008 | "View All Perks" on Earning & Perks section | D-302 |
| FRM-005 | FRM-004 | Card Instance row click | SPEC-18 |
| FRM-005 | FRM-009 | Issuer / Rewards Program header links | SPEC-18 |
| FRM-006 | FRM-004 | Completion → "View Card" | SPEC-03 |
| FRM-006 | FRM-010 | Completion → "Link SimpleFIN" | SPEC-03 |
| FRM-006 | FRM-005 | Step 1 → "Create Market Card" | D-292 |
| FRM-008 | FRM-002 | Linked Transactions row click | D-297 |
| FRM-011 | RPT-003 | "View Dashboard" after batch entry save | D-306 |
| RPT-001 | FRM-004 | Card name click (any table) | SPEC-19 |
| RPT-001 | RPT-006 | Earning category click | SPEC-19 |
| RPT-001 | RPT-010 | Points program click | SPEC-19 |
| RPT-001 | FRM-004, WFL-003, FRM-010 | Alert contextual actions | SPEC-19, D-300 |
| RPT-001 | FRM-006 | Empty state → "Add your first card" | SPEC-19 |
| RPT-002 | FRM-001 | Category name click (filtered), uncategorized link | SPEC-20 |
| RPT-002 | FRM-008 | Goal name click, alert action | SPEC-20 |
| RPT-002 | FRM-007 | Empty state, no-income warning | SPEC-20 |
| RPT-002 | FRM-009 | "Edit Allocations" | D-293 |
| RPT-002 | RPT-011 | "View All Goals" on Goal Progress section | D-296 |
| RPT-002 | RPT-007 | "View Trends" | D-303 |
| RPT-002 | RPT-012 | "Income vs Expenses" | D-304 |
| RPT-003 | FRM-011 | "Update Balances" | D-305 |
| RPT-004 | RPT-010 | Program name click | SPEC-21 |
| RPT-005 | RPT-006 | "View Full Matrix" on Section 5 | D-298 |
| RPT-008 | FRM-004 | Card name click | D-295 |
| RPT-009 | FRM-004 | Card name click in ranking table | D-295 |
| RPT-010 | FRM-004 | Card name click in contributing cards | D-295 |
| RPT-010 | RPT-004 | "View All Redemptions" on redemption section | D-301 |
| RPT-011 | FRM-008 | Goal name click | D-294 |

### 5.2 Navigation Pattern: "Back to Weekly Review"

When any page is reached via WFL-001 checklist links, a contextual "Back to Weekly Review" link appears on the target page (D-291). This applies to: FRM-010, FRM-003, FRM-001, FRM-007, RPT-001, RPT-002.

### 5.3 Navigation Pattern: Card Name Links

Card names in tables are consistently clickable across the application. Every table displaying card names navigates to FRM-004 object page for that card:

- RPT-001 (Churnboard) — all tables (SPEC-19)
- RPT-008 (Perk Tracker) — perk tables (D-295)
- RPT-009 (Annual Summary) — card ranking table (D-295)
- RPT-010 (Points Dashboard) — contributing cards table (D-295)

### 5.4 SPEC-19 Amendment: Alert Action Correction

The `offers_pending_approval` alert action on RPT-001 navigates to WFL-003 (Scraper Approvals), not FRM-005 (Market Cards). Pending approvals live on WFL-003. Corrects SPEC-19 §4.1.12 (D-300).

---

## 6. Entry Points

### 6.1 App Launch (D-299)

The default landing page on app launch is **Weekly Review (WFL-001)**. It is the first nav item, surfaces what needs attention via auto-detected checklist status, and links to all operational pages.

### 6.2 Returning User Session

| Scenario | Flow |
|----------|------|
| Items need attention | WFL-001 → work through warning items → "Back to Weekly Review" between each → Mark Review Complete |
| All clear | WFL-001 → "All clear" banner → jump to RPT-001 or RPT-002 via checklist links |
| Quick check (skip review) | Side nav directly to RPT-001, RPT-002, or any other page |

---

## 7. Discoverability Audit

### 7.1 Reachability Summary

Every page is reachable via at least one path. Most pages are reachable via both side nav and contextual navigation:

| Page | Side Nav | Contextual Inbound |
|------|----------|-------------------|
| WFL-001 (Weekly Review) | Transactions | Landing page (D-299) |
| FRM-001 (Transaction List) | Transactions | WFL-001, RPT-002 (filtered) |
| FRM-002 (Transaction Entry) | — | FRM-001 Create/row click, FRM-008 linked transactions (D-297) |
| FRM-003 (CSV Import) | Transactions | WFL-001 |
| FRM-004 (My Cards) | Churning — Cards | RPT-001, RPT-005, RPT-008, RPT-009, RPT-010, FRM-005, FRM-006 |
| FRM-005 (Market Cards) | Churning — Cards | RPT-001 alert, FRM-006 (D-292) |
| FRM-006 (Card Onboarding) | — | FRM-004 Create, FRM-004 "Add Supp Card", RPT-001 empty state |
| FRM-007 (Income Entry) | Finances | WFL-001, RPT-002 |
| FRM-008 (Goals) | Finances | RPT-002, RPT-011 (D-294) |
| FRM-009 (Master Data) | Admin | FRM-005, RPT-002 (D-293) |
| FRM-010 (SimpleFIN) | Admin | WFL-001, FRM-004, FRM-006, RPT-001 alert |
| FRM-011 (Fin. Picture Entry) | Finances | RPT-003 (D-305) |
| RPT-001 (Churnboard) | Churning — Analytics | WFL-001 |
| RPT-002 (Budget Dashboard) | Finances | WFL-001 |
| RPT-003 (Fin. Picture Dashboard) | Finances | FRM-011 (D-306) |
| RPT-004 (Trophy Case) | Churning — Analytics | RPT-010 (D-301) |
| RPT-005 (Card Analytics) | Churning — Analytics | FRM-004 |
| RPT-006 (Recommendation Matrix) | Churning — Analytics | RPT-001, RPT-005 (D-298) |
| RPT-007 (Spending Trends) | Finances | RPT-002 (D-303) |
| RPT-008 (Perk Tracker) | Churning — Analytics | FRM-004 (D-302) |
| RPT-009 (Annual Summary) | Churning — Analytics | Side nav only |
| RPT-010 (Points Dashboard) | Churning — Analytics | RPT-001, RPT-004 |
| RPT-011 (Goal Progress) | Finances | RPT-002 (D-296) |
| RPT-012 (Income vs Expenses) | Finances | RPT-002 (D-304) |
| WFL-003 (Scraper Approvals) | Admin | RPT-001 alert (D-300) |

### 7.2 Side-Nav-Only Page

**RPT-009 (Annual Churning Summary)** is the only page reachable exclusively via side nav. This is acceptable — it's a year-in-review report, not part of any operational workflow.

---

## 8. Wave-Gating UX (D-307)

All 4 waves build before go-live. Waves define build order, not release phases. No end-user ever sees a partial application.

**Approach:** Nav items are **hidden until built**. Each sprint adds its nav entries when the corresponding pages are implemented. No disabled states, no "coming soon" placeholders.

This amends DS-001 §4 which previously stated "Wave-gated items appear in the nav structure from Wave 1 but are disabled until their wave is built."

---

## 9. Spec Amendments

Decisions in this document amend the following specs:

| Spec | Amendment | Decision |
|------|-----------|----------|
| DS-001 §4 | Revised nav structure — 23 entries with different composition | D-288, D-289, D-290 |
| DS-001 §4 | Wave-gating changed from visible-but-disabled to hidden-until-built | D-307 |
| SPEC-15 | Target pages gain "Back to Weekly Review" contextual link | D-291 |
| SPEC-03 | FRM-006 Step 1 gains "Create Market Card" shortcut to FRM-005 | D-292 |
| SPEC-20 | RPT-002 gains "Edit Allocations" link to FRM-009 | D-293 |
| SPEC-09 | RPT-011 goal cards gain click navigation to FRM-008 | D-294 |
| SPEC-11 | RPT-009, RPT-008, RPT-010 gain card name → FRM-004 links | D-295 |
| SPEC-20 | RPT-002 Goal Progress gains "View All Goals" link to RPT-011 | D-296 |
| SPEC-09 | FRM-008 Linked Transactions gain click navigation to FRM-002 | D-297 |
| SPEC-08 | RPT-005 Section 5 gains "View Full Matrix" link to RPT-006 | D-298 |
| SPEC-19 | `offers_pending_approval` alert action corrected to WFL-003 | D-300 |
| SPEC-11 | RPT-010 gains "View All Redemptions" link to RPT-004 | D-301 |
| SPEC-03 | FRM-004 Earning & Perks gains "View All Perks" link to RPT-008 | D-302 |
| SPEC-20 | RPT-002 gains "View Trends" link to RPT-007 | D-303 |
| SPEC-20 | RPT-002 gains "Income vs Expenses" link to RPT-012 | D-304 |
| SPEC-10 | RPT-003 gains "Update Balances" link to FRM-011 | D-305 |
| SPEC-10 | FRM-011 gains "View Dashboard" link to RPT-003 after batch entry | D-306 |

---

## 10. Decisions Reference

| ID | Title | Summary |
|----|-------|---------|
| D-288 | Revised side nav structure | 23 entries, 5 groups. WFL-001 added, FRM-002/FRM-006 removed, WFL-003 moved to Admin. |
| D-289 | FRM-002 and FRM-006 removed from nav | Both accessed via parent list actions — standard Fiori pattern. |
| D-290 | Scraper Approvals moved to Admin | System management function, not analytics. |
| D-291 | "Back to Weekly Review" contextual link | Target pages show return link when navigated from WFL-001. |
| D-292 | FRM-006 → FRM-005 create shortcut | "Create Market Card" in Step 1 value help prevents wizard abandonment. |
| D-293 | RPT-002 → FRM-009 Budget Allocations | "Edit Allocations" link from category table. |
| D-294 | RPT-011 → FRM-008 navigation | Goal name click navigates to goal detail. |
| D-295 | Card name links on RPT-009, RPT-008, RPT-010 | Consistent card name → FRM-004 pattern across all tables. |
| D-296 | RPT-002 → RPT-011 navigation | "View All Goals" link on Goal Progress section. |
| D-297 | FRM-008 → FRM-002 navigation | Linked Transactions row click navigates to transaction detail. |
| D-298 | RPT-005 → RPT-006 navigation | "View Full Matrix" on Section 5. |
| D-299 | Default landing page | Weekly Review (WFL-001) on app launch. |
| D-300 | Alert action correction | `offers_pending_approval` → WFL-003 (not FRM-005). |
| D-301 | RPT-010 → RPT-004 navigation | "View All Redemptions" on redemption section. |
| D-302 | FRM-004 → RPT-008 navigation | "View All Perks" on Earning & Perks section. |
| D-303 | RPT-002 → RPT-007 navigation | "View Trends" link. |
| D-304 | RPT-002 → RPT-012 navigation | "Income vs Expenses" link. |
| D-305 | RPT-003 → FRM-011 navigation | "Update Balances" link on dashboard. |
| D-306 | FRM-011 → RPT-003 navigation | "View Dashboard" after batch entry save. |
| D-307 | Wave-gating: hidden-until-built | Nav items appear when sprint builds them. No disabled states. Amends DS-001 §4. |

---

*This document is the single source of truth for the Financial Planner's navigation structure, user journeys, and page interconnections. It traces back to [Design System](DESIGN_SYSTEM.md) (D-56 through D-62), [Business Architecture](BUSINESS_ARCHITECTURE.md) (FRICEW catalog), all 21 functional specs in [design/specs/](specs/), and [Decisions Log](user-profile/DECISIONS_LOG.md).*
