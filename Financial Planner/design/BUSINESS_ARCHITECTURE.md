# Business Architecture — FRICEW Catalog

**Document ID:** BA-001
**Version:** 1.0
**Date:** 2026-02-13
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                              |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-13 | Sandro & Claude | Initial creation — 43 objects across 6 FRICEW types                                                                                                                                                                      |
| 2026-02-13 | Sandro & Claude | Step 4 (Prioritization & Phasing): Wave column added to all FRICEW tables. Section 9 (Wave Plan) added. D-35 logged.                                                                                                     |
| 2026-02-20 | Claude          | Status → Approved. All 43 objects fully specified across 21 functional specs (Step 12 complete). Footer updated.                                                                                                         |
| 2026-02-20 | Claude          | Post-audit fixes: FRM-004 description updated (removed "redemptions", D-280). ENH-005 description updated (removed "redemptions", D-142). RPT-004 description updated (ALP + CRUD, D-279).                               |
| 2026-02-20 | Claude          | Post-audit fixes (batch 2): WFL-004 marked absorbed by FRM-006 (D-188). ENH-004 +ISSUER_COOLDOWN +dual output. RPT-010 +Transfer Points +Manual Adjustment +page type. FRM-005 +full CRUD +chart +status +Quick-compare. |

---

## 2. Summary

| Type                 | Count  | IDs                     |
| -------------------- | ------ | ----------------------- |
| **F** — Forms        | 11     | FRM-001 through FRM-011 |
| **R** — Reports      | 12     | RPT-001 through RPT-012 |
| **I** — Interfaces   | 3      | INT-001 through INT-003 |
| **C** — Conversions  | 4      | CNV-001 through CNV-004 |
| **E** — Enhancements | 9      | ENH-001 through ENH-009 |
| **W** — Workflows    | 4      | WFL-001 through WFL-004 |
| **Total**            | **43** |                         |

---

## 3. Interfaces

| ID      | Name                       | Wave | Description                                                                                                                                                                                                                                                                                              | Traces To                                      |
| ------- | -------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| INT-001 | SimpleFIN Transaction Sync | 1    | Automated daily poll of SimpleFIN Bridge API to pull credit card transactions from TD, Amex, CIBC. Provider-abstracted ingestion layer supports future aggregator swap. Checks errors array for broken connections and flags stale data. Handles Amex supp card workaround via separate account linkage. | PSV P1 Pillar 1, D-01, D-30, D-33, D-34, OI-08 |
| INT-002 | CSV Transaction Import     | 1    | Manual upload and parsing of bank CSV exports. Issuer-specific format configs for column mapping, date parsing, amount handling. Dual purpose: ongoing Scotiabank workflow and historical backfill infrastructure (shared with CNV-001).                                                                 | PSV P1 Pillar 1, D-01, D-13, D-31              |
| INT-003 | Offer Data Web Scraper     | 4    | Automated scraping of public sources (Prince of Travel, issuer sites, Reddit) to detect new/changed card offers. Human approval required before database entry. **Deprioritized.**                                                                                                                       | PSV P1 Pillar 3, D-14                          |

---

## 4. Conversions

| ID      | Name                            | Wave | Description                                                                                                                                                                                     | Traces To                       |
| ------- | ------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| CNV-001 | Historical Transaction Backfill | 1    | One-time load of transactions from 2023 to present via CSV exports across all 4 issuers. Uses INT-002 parsing infrastructure. Multiple batches by issuer.                                       | D-13, PSV §7 Wave 1             |
| CNV-002 | Reference Data Seed             | 1    | Initial population of system config tables: issuers, issuer application rules, rewards programs + CPP valuations, earning categories, purchase types.                                           | PSV §7 Wave 1, D-05, D-09, D-22 |
| CNV-003 | Card Portfolio Load             | 1    | Initial load of user's card portfolio: market cards held, offer terms (multi-tranche), card instances (13 active + 3 closed), supplementary cards, earning multipliers, soft perks, FYF status. | PSV §7 Wave 1, D-21, D-24, D-27 |
| CNV-004 | Market Card Database Build      | 4    | Population of the broader Canadian credit card market database (~50-100 cards) with historical offer variants (~150-500) and soft perk definitions.                                             | PSV §7 Wave 2, D-14             |

**Execution order:** CNV-002 → CNV-003 → CNV-001. CNV-004 is Wave 4 (market intelligence).

---

## 5. Enhancements

| ID      | Name                              | Wave | Description                                                                                                                                                                                                                                                                                                                                                              | Traces To                    |
| ------- | --------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| ENH-001 | Transaction Categorization Engine | 1    | Normalizes raw merchant descriptions to known vendors (fuzzy matching with confidence tiers). Assigns dual taxonomy: Purchase Type (budget) + Earning Category (churning). Rules-based with learning from user corrections. Amount-based matching for recurring charges.                                                                                                 | D-32, D-05, PSV P1 Pillar 2  |
| ENH-002 | Card Recommendation Engine        | 2    | Determines optimal card for a given purchase category. Compares earning rates across active cards, overrides with bonus-chasing card when bonus value exceeds the earning rate difference.                                                                                                                                                                               | D-06                         |
| ENH-003 | Signup Bonus Tracker              | 1    | Per-tranche MSR progress computation. Multi-tranche structures + monthly recurring MSR (Cobalt-style). Supp card spend rolls to parent. Fee transactions excluded from progress. Status per tranche: pending / in progress / met / missed.                                                                                                                               | D-24, D-02, D-04             |
| ENH-004 | Issuer Eligibility Engine         | 2    | Computes "eligible now" / "eligible in X days" per issuer from card history + rules reference data. Handles Amex credit vs charge card distinction, personal vs business segments, Aeroplan 5-tier cross-issuer lifetime limit, issuer cooldown periods. Dual output: per-issuer summary (IssuerEligibility) + per-rule detail function (getEligibilityDetail). SPEC-16. | D-22, D-25                   |
| ENH-005 | Card Profitability Calculator     | 2    | Net value per card: points earned × CPP + realized perks − annual fees. FYF year-1 handling. Monthly-to-annual fee normalization. Referral bonus attribution to referring card. Redemptions excluded — per-program (D-142).                                                                                                                                              | D-23, D-26, D-27, D-28       |
| ENH-006 | Points Balance & Valuation        | 1    | Computed balance per rewards program from (transactions × multipliers) + manual adjustments. CPP valuation applied. Adjustment types: signup bonus deposits, referrals, transfers.                                                                                                                                                                                       | D-09, D-19, D-26             |
| ENH-007 | Budget Engine                     | 1    | Monthly computation: income − recurrents − goal allocations = discretionary. Ratio split per purchase type. Refund reversal for budget only. Split transactions use share amount. Clean slate per month.                                                                                                                                                                 | D-07, D-08, D-11, D-12, D-15 |
| ENH-008 | Transaction Deduplication         | 1    | Matches incoming transactions against existing records by vendor + date + amount + card. Categorizes as duplicate / reconciliation / new. Consumed by both INT-001 and INT-002.                                                                                                                                                                                          | INT-001, INT-002             |
| ENH-009 | Split Transaction Logic           | 1    | "My share" computation for shared expenses. Recurring splits remembered by system. Reimbursed = 0% share. Full amount feeds churning metrics, share feeds budget.                                                                                                                                                                                                        | D-08                         |

---

## 6. Forms

| ID      | Name                         | Wave | Description                                                                                                                                                                                                                                                            | Traces To                                |
| ------- | ---------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| FRM-001 | Transaction List & Review    | 1    | Main transaction grid with filtering, sorting, search. Weekly review surface: approve categorization suggestions, correct exceptions, attribute supp card transactions, initiate splits. Inline editing.                                                               | PSV "What Solved Looks Like", D-02, D-08 |
| FRM-002 | Transaction Entry            | 2    | Manual single transaction create/edit. Vendor fuzzy matching, card selection, dual-taxonomy assignment, card recommendation display (ENH-002), goal linking, notes.                                                                                                    | D-03, D-05, D-06                         |
| FRM-003 | CSV Import Wizard            | 1    | Multi-step: upload file + select card → review tabs (New / Reconciliation / Duplicates / Excluded) → save. On-the-fly entity creation during review. Inline editing.                                                                                                   | INT-002, D-31                            |
| FRM-004 | My Cards                     | 1    | List view (filterable by status) + scrolling object page: overview, bonus progress (ENH-003), earning & perks, fee history, supplementary cards, lifecycle timeline, analytics. Redemptions removed (D-280) — per-program in RPT-004.                                  | D-21, D-24, D-27                         |
| FRM-005 | Market Cards                 | 3    | Fiori Elements list report + object page with full CRUD. Overview, current offer (multi-tranche), earning & perks, offer history (ApexCharts stepped area chart), linked user cards, scraper info. Status field (active/discontinued). Quick-compare action (SPEC-18). | D-14, D-24, D-25, D-28, D-29             |
| FRM-006 | Card Onboarding              | 1    | Wizard: select market card → define offer terms (multi-tranche) → enter instance details (dates, FYF, limits, encrypted fields) → optional SimpleFIN account link. Also supp card creation.                                                                            | D-03, D-24, D-27, D-29, D-33             |
| FRM-007 | Income Entry                 | 1    | Monthly income entry by source type (salary, bonus, churn reward, other).                                                                                                                                                                                              | D-15                                     |
| FRM-008 | Goals Management             | 2    | Unified goals (saving + spending): target amount, timeline, user-defined monthly allocations, progress tracking, transaction linking.                                                                                                                                  | D-11                                     |
| FRM-009 | Master Data Maintenance      | 1    | SM30-style CRUD for reference tables: purchase types (+ budget ratios), purchase subtypes, earning categories, rewards programs + CPP, redemption types, vendors, issuers, issuer application rules, CSV format configs, recurrent expenses.                           | D-05, D-09, D-22                         |
| FRM-010 | SimpleFIN Connection Manager | 1    | Connected accounts list, account-to-card mapping, connection health status, last sync timestamps, re-auth links to SimpleFIN dashboard.                                                                                                                                | D-30, D-33, D-34                         |
| FRM-011 | Financial Picture Entry      | 3    | Manual entry of non-CC financial positions: investment accounts (RRSP, TFSA, FHSA, RIF), debt balances (car loan, student loan). Monthly snapshots for trend tracking.                                                                                                 | PSV Problem 4                            |

---

## 7. Reports

| ID      | Name                        | Wave | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Traces To                             |
| ------- | --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| RPT-001 | Churnboard                  | 1→2  | Primary churning dashboard. Year selector. Sections: net value for year (hero), CC spend by card (month), upcoming fees, realized value vs fees per card, focus card bonus progress (ENH-003), reward yield trend, points balances (ENH-006), issuer eligibility status (ENH-004), card recommendation by category (ENH-002), alerts. **Wave 1:** bonus progress, points balances, CC spend, upcoming fees, alerts. **Wave 2:** remaining sections (recommendation, eligibility, profitability, yield trend). | PSV Problem 2, D-06, D-16, D-22, D-24 |
| RPT-002 | Monthly Budget Dashboard    | 1→2  | Budget tracking with month navigation. Sections: budget overview (income − recurrents − goals = discretionary), spending vs budget by purchase type (ENH-007), CC spend by card, top vendors, goal progress summary, on-track/overspending indicators. **Wave 1:** budget overview (no goals), spending vs budget, on-track indicators. **Wave 2:** goal progress, top vendors.                                                                                                                               | PSV Problem 3, D-11, D-12, D-15       |
| RPT-003 | Financial Picture Dashboard | 3    | Net worth (assets − liabilities). Debt balances trending over time. Investment balances trending over time. Fed by FRM-011 snapshots.                                                                                                                                                                                                                                                                                                                                                                         | PSV Problem 4                         |
| RPT-004 | Trophy Case                 | 2    | Fiori Elements ALP + Object Page (D-279). Cross-program redemption register with full CRUD. KPI tags, visual filters, top-10 CPP bar chart, CPP semantic coloring (D-281). Aggregate stats: total redeemed, avg CPP, total value.                                                                                                                                                                                                                                                                             | D-10                                  |
| RPT-005 | Card Analytics              | 3    | Per-card deep dive with card selector. Spend over time, points earned over time, profitability breakdown (ENH-005), spend by earning category, monthly trends.                                                                                                                                                                                                                                                                                                                                                | ENH-005, ENH-006                      |
| RPT-006 | Card Recommendation Matrix  | 2    | Standalone "which card for which category" view. All active cards × all earning categories: multiplier, CPP value, effective earn rate. Highlights optimal card. Flags signup bonus overrides (ENH-002).                                                                                                                                                                                                                                                                                                      | D-06                                  |
| RPT-007 | Spending Trends             | 3    | Multi-month time-series: spend by category over time, month-over-month comparison, seasonal patterns, vendor concentration shifts.                                                                                                                                                                                                                                                                                                                                                                            | PSV Problem 3                         |
| RPT-008 | Soft Perk Tracker           | 3    | Cross-card soft perk view: lounge passes, travel credits, portal rebates. Realized vs unrealized status, remaining value, expiration dates.                                                                                                                                                                                                                                                                                                                                                                   | D-21, D-23                            |
| RPT-009 | Annual Churning Summary     | 3    | Year-in-review: cards opened/closed, total net value, best/worst cards, total points earned vs redeemed, fees paid, bonuses completed/missed.                                                                                                                                                                                                                                                                                                                                                                 | PSV Problem 2, ENH-005                |
| RPT-010 | Points Program Dashboard    | 3    | Fiori Elements list report + object page. Per-program view: current balance, CPP valuation, earning history, redemption history, contributing cards. Actions: Transfer Points, Manual Adjustment (SPEC-11).                                                                                                                                                                                                                                                                                                   | D-09, ENH-006                         |
| RPT-011 | Goal Progress               | 2    | All active goals with progress bars, timeline visualization, monthly contribution history, projected completion, on-track/behind/ahead status.                                                                                                                                                                                                                                                                                                                                                                | D-11                                  |
| RPT-012 | Income vs Expenses Trend    | 3    | Multi-month macro view: income vs total outflow, savings rate over time, surplus vs deficit months.                                                                                                                                                                                                                                                                                                                                                                                                           | PSV Problem 3, D-12, D-15             |

---

## 8. Workflows

| ID      | Name                  | Wave | Description                                                                                                                                                                                                                                                                                                                 | Traces To                    |
| ------- | --------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| WFL-001 | Weekly Review Session | 1    | The 15-20 min weekly operational cycle: check connection health (FRM-010) → import Scotia CSV if due (FRM-003) → review exceptions and approve suggestions (FRM-001) → check dashboards (RPT-001, RPT-002). Defines intended usage cadence and cross-component journey.                                                     | PSV "What Solved Looks Like" |
| WFL-002 | Card Lifecycle        | 1    | State machine for card instances. States: Focus → Active → To Cancel → Closed. Focus→Active: automatic when all bonus tranches met (ENH-003). Active→To Cancel: manual with tentative cancel date. To Cancel→Closed: manual. State changes trigger recommendation recalc, alert changes, AF renewal differentiation (D-27). | OI-04, D-27                  |
| WFL-003 | Offer Approval        | 4    | Human approval gate for scraped offer data. INT-003 queues detected offers → user reviews/edits/approves → approved offers enter market card database. **Deprioritized** (follows INT-003).                                                                                                                                 | INT-003, D-14                |
| WFL-004 | New Card Setup        | 1    | _(Absorbed by FRM-006 — D-188, SPEC-03.)_ The onboarding wizard in FRM-006 handles the full orchestration inline: register card → connect SimpleFIN account → resolve queued unmatched transactions → card enters Focus state → bonus tracking begins. No separate WFL-004 implementation.                                  | D-03, D-33, D-188            |

---

## 9. Wave Plan

All 4 waves are built before go-live (D-35). Waves define build order and testable increments, not release phases.

### Build Order

| Wave                              | Objects | Testable Increment                                                                                      |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| 1 — Core Pipeline                 | 23      | Full weekly session: auto-import → categorize → review → churning basics + budget status                |
| 2 — Churning Depth + Goals        | 8       | Card recommendations, eligibility, profitability, goals in budget. RPT-001 and RPT-002 feature-complete |
| 3 — Analytics + Financial Picture | 9       | Deep analytics, financial picture, spending trends, annual summary                                      |
| 4 — Market Intelligence           | 3       | Automated offer scraping + market card database                                                         |
| **Total**                         | **43**  |                                                                                                         |

### Wave 1 — Core Pipeline (23 objects)

The minimum set that makes the weekly 15-minute session work: transactions flow in automatically, get categorized, and both dashboards show usable data.

| Layer                  | Objects                                     |
| ---------------------- | ------------------------------------------- |
| Foundation & Seed Data | CNV-002, CNV-003, CNV-001, FRM-009          |
| Ingestion Pipeline     | ENH-008, INT-001, INT-002, FRM-003, FRM-010 |
| Transaction Processing | ENH-001, ENH-009                            |
| Computation Engines    | ENH-003, ENH-006, ENH-007, FRM-007          |
| UI Surfaces            | FRM-001, FRM-004, FRM-006                   |
| Dashboards (partial)   | RPT-001, RPT-002                            |
| Workflows              | WFL-001, WFL-002, WFL-004                   |

RPT-001 Wave 1 sections: bonus progress, points balances, CC spend by card, upcoming fees, alerts.
RPT-002 Wave 1 sections: budget overview (income − recurrents = discretionary), spending vs budget by category, on-track indicators. Goal allocations deferred to Wave 2.

### Wave 2 — Churning Depth + Goals (8 objects)

Adds the three remaining computation engines (ENH-002, ENH-004, ENH-005), goals (FRM-008), manual transaction entry (FRM-002), and three reports (RPT-004, RPT-006, RPT-011). Completes all sections of RPT-001 and RPT-002.

### Wave 3 — Analytics + Financial Picture (9 objects)

Adds Problem 4 coverage (FRM-011, RPT-003) and the remaining analytical reports (RPT-005, RPT-007, RPT-008, RPT-009, RPT-010, RPT-012) plus the market cards browser (FRM-005). All leaf nodes — pure consumers with no downstream dependents.

### Wave 4 — Market Intelligence (3 objects)

The deprioritized cluster: CNV-004, INT-003, WFL-003. Self-contained, no impact on daily operations.

### Key Dependency Chains

**Longest path (7 layers):** CNV-002 → CNV-003 → INT-002 + ENH-008 → CNV-001 → ENH-001 → ENH-007 → RPT-002

**Widest fan-in:** ENH-007 (Budget Engine) depends on ENH-001, ENH-009, FRM-007, and optionally FRM-008.

**Widest fan-in on dashboards:** RPT-001 (Churnboard) consumes ENH-002, ENH-003, ENH-004, ENH-005, ENH-006 — spanning Waves 1 and 2.

---

_This catalog is the complete FRICEW inventory for the Financial Planner system. Every object traces back to the [Problem Statement & Vision](PROBLEM_STATEMENT_AND_VISION.md) and [Decisions Log](user-profile/DECISIONS_LOG.md). All 43 objects have approved functional specifications in [design/specs/](specs/) (Step 12 complete)._
