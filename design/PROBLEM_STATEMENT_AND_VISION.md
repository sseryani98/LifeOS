# Problem Statement & Vision

**Document ID:** PSV-001
**Version:** 1.0
**Date:** 2026-02-12
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                        |
| ---------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-12 | Sandro & Claude | Initial creation                                                                                                                                                                                   |
| 2026-02-12 | Sandro & Claude | Domain validation (Step 1): D-22 through D-29                                                                                                                                                      |
| 2026-02-12 | Sandro & Claude | PSV review: added D-22, D-24, D-27, D-28 to key decisions list; reframed guiding question to cover churning + budget                                                                               |
| 2026-02-12 | Sandro & Claude | Aggregator spike (Step 2): D-01 amended, Plaid→SimpleFIN pivot. Updated automation pillars, "What Solved Looks Like" flow, key decisions list (added D-30, D-31, D-32). Closed OI-05, added OI-08. |
| 2026-02-13 | Sandro & Claude | Data model design (Step 5): Closed OI-08 (D-42 — ignore pending transactions).                                                                                                                     |
| 2026-02-20 | Claude          | Status → Approved. All design steps built on this foundation. Step 12 complete — all 21 specs approved.                                                                                            |
| 2026-02-20 | Claude          | Post-audit: Closed all remaining open items — OI-01 (D-94), OI-02 (D-98), OI-03 (D-99), OI-04 (D-189), OI-06 (23 alert types across 9 specs). All 8 OIs now closed.                                |

---

## 2. Problem Statement

### Who

A solo credit card churner in Canada holding 13+ credit cards across 4 issuers (TD, Amex, CIBC, Scotia), opening 6-8 new cards per year, cancelling 2-3 per year. This is a growing hobby started around 2023.

### Core Problem

Tracking credit card churning performance and personal budgeting across multiple issuers is so manually intensive that it doesn't get done. Financial data is siloed per issuer with no consolidated view. A previous attempt using Excel spreadsheets was abandoned because the effort to maintain it exceeded the value gained.

### Vision

Financial Planner will be a single, low-maintenance system for Sandro’s Canadian churning and budgeting workflow. Credit card transactions flow in automatically from TD, Amex, CIBC, and Scotia, so weekly upkeep is limited to short exception review. The system makes card decisions clear by showing bonus progress, issuer eligibility timing, and net card value in one place. It also provides monthly budget status and a consolidated financial picture, so spending optimization and overall financial control are managed together.

### The Question This System Answers

> How do I maximize the value from every dollar I spend, while staying within budget?

"Maximize value" means: extracting the most from credit card programs — earning optimal rewards on every purchase, capturing signup bonuses, tracking profitability per card — while maintaining visibility into whether overall spending stays within budget.

---

## 3. Problems to Solve

### Problem 1: Automation (Foundation)

**Priority: Critical - nothing else works without this.**

Credit card transactions must flow into the system automatically. The system must auto-categorize transactions with high enough accuracy that a weekly 15-20 minute review session is sufficient to maintain clean data. The system learns from user corrections over time.

**Why this is the foundation:** The Excel approach failed because manual effort was too high. If the new system requires the same effort, it will suffer the same fate. Automation is not a feature - it is the prerequisite for the system's survival.

**Automation pillars:**

1. **Transaction ingestion** - SimpleFIN Bridge pulls credit card transactions daily from TD, Amex, CIBC via aggregator API (D-30). Scotiabank via CSV import until CDB mandates standardized APIs (D-31). Architecture is provider-abstracted to support future aggregator changes.
2. **Auto-categorization** - In-house rules-based engine normalizes raw merchant descriptions and assigns both Purchase Type (budget) and Earning Category (churning) per transaction, learning from user corrections (D-32). No external enrichment API dependency.
3. **Offer data monitoring** - Web scraping of public sources (Prince of Travel, issuer websites, Reddit) to detect new/changed credit card offers, with human approval before database entry

### Problem 2: Churning Performance

**Priority: High - checked most frequently.**

Cannot currently track across multiple issuers:

- Signup bonus progress per card, per tranche (how much more spend, by when, across multi-tranche offers)
- Which card to use for a given purchase category
- Card profitability (points earned + referral bonuses + redemptions + realized perks - fees)
- Accumulated unredeemed points value across all programs
- Yield on spending (including signup bonus value)
- Card lifecycle (upcoming fees, cancellation dates)
- Bonus eligibility per issuer (cooldown status, Aeroplan tier usage, when re-eligible)
- Soft perk usage (lounge passes remaining, travel credits used)
- Redemption history with effective CPP (the "trophy case")

### Problem 3: Budgeting

**Priority: High - checked frequently.**

No system to track:

- Monthly budget against income
- Recurrent expenses (loan payments, subscriptions)
- Goals with target amounts and timelines (both saving and spending)
- Discretionary spending by category
- "Am I on track this month?" at a glance

### Problem 4: Financial Picture

**Priority: Medium - checked less frequently, manually maintained.**

No consolidated view of:

- Net worth (assets - liabilities)
- Debt balances trending over time (car loan, student loan)
- Investment balances trending over time (RRSP, TFSA, FHSA, RIF)

---

## 4. What "Solved" Looks Like

```
Transactions auto-import daily:
  - TD, Amex, CIBC via SimpleFIN Bridge (aggregator API)
  - Scotia via CSV import (until CDB mandates bank APIs)
                    |
In-house engine normalizes merchant names + auto-categorizes ~90%+ correctly
(Purchase Type for budget + Earning Category for churning)
                    |
Weekly 15-min session:
  - Review flagged items + fix exceptions
  - Approve suggestions
  - Attribute supp card transactions (if active bonus)
  - Split shared expenses
  - Import Scotia CSV (if not automated)
  - Re-authenticate any broken aggregator connections (if flagged)
                    |
Dashboards always current:
  - Churning: bonus progress, yield, profitability, points value, card recommendation, eligibility status
  - Budget: on track / overspending, by category, discretionary remaining
  - Goals: progress toward savings and planned spending
  - Financial: net worth, debt/investment trends (monthly manual updates)
```

---

## 5. Current Card Landscape

### Issuers (4 active)

TD, Amex, CIBC, Scotia

### Main Cards (10)

| Card                     | Issuer |
| ------------------------ | ------ |
| TD Aeroplan              | TD     |
| TD First Class Travel #1 | TD     |
| TD First Class Travel #2 | TD     |
| Amex Cobalt              | Amex   |
| Amex Gold                | Amex   |
| Amex Bonvoy              | Amex   |
| CIBC Aventura            | CIBC   |
| Scotia Amex Gold         | Scotia |

_Note: 2 cards not listed above to reach 10 - to be confirmed during conversion_

### Supplementary Cards (3)

| Card          | Parent      | Reason                                            |
| ------------- | ----------- | ------------------------------------------------- |
| Cobalt Supp 1 | Amex Cobalt | 10k points for 2k spend promo, no additional cost |
| Cobalt Supp 2 | Amex Cobalt | 10k points for 2k spend promo, no additional cost |
| Bonvoy Supp   | Amex Bonvoy | 10k points for 2k spend promo, no additional cost |

### Turnover

- Opens: 6-8 cards per year
- Cancellations: 2-3 per year
- Net growth: 3-5 cards per year
- Hobby started: ~2023 (~16 total cards since inception)

---

## 6. Design Decisions

All design decisions are documented with full context, options considered, and rationale in:
**[DECISIONS_LOG.md](user-profile/DECISIONS_LOG.md)**

Key decisions that most shape the system architecture:

- **D-01/D-30:** Provider-abstracted transaction ingestion; SimpleFIN Bridge as V1 aggregator (not Plaid)
- **D-05:** Two independent categorization taxonomies
- **D-06:** Card recommendation engine factors in signup bonus value
- **D-08:** Split transactions - full amount for churning, share for budget
- **D-11:** Unified Goals concept replaces planned expenses
- **D-22:** Issuer application rules as reference data; bonus eligibility computed at runtime from card history
- **D-24:** Multi-tranche welcome bonus structure (per-tranche MSR, deadline, payout, and status)
- **D-27:** First Year Free tracked on card instance; AF renewal alert differentiates first AF vs subsequent
- **D-28:** Fee structure variant (annual vs monthly) on market card reference data
- **D-31:** Scotiabank via CSV import (not automated) until CDB mandates bank APIs
- **D-32:** In-house transaction categorization engine (no external enrichment API)

---

## 7. Conversion Scope

### Wave 1

| Data                              | Source                        | Volume                         |
| --------------------------------- | ----------------------------- | ------------------------------ |
| Issuers                           | Manual setup (reference data) | ~8-10                          |
| Issuer application rules          | Manual setup (reference data) | ~20-30 rules                   |
| Rewards programs + CPP valuations | Manual setup (reference data) | ~6-8 programs                  |
| Market cards held                 | Manual setup                  | ~10-12 products                |
| Offers signed up for              | Confirmation emails, memory   | 16 offers                      |
| My Card instances                 | Manual setup                  | 16 cards (13 active, 3 closed) |
| Supplementary cards               | Manual setup                  | 3 cards                        |
| Earning multipliers               | Current values per card       | ~80-100 rows                   |
| Historical transactions           | CSV from issuer websites      | 2023-present, 4 issuers        |

### Wave 2

| Data                                                              | Source                                           | Volume          |
| ----------------------------------------------------------------- | ------------------------------------------------ | --------------- |
| Broader market card database (for historical offer comparison)    | Research: Prince of Travel, Reddit, issuer sites | ~50-100 cards   |
| Historical offer variants (for "is this a good offer?" decisions) | Research: Wayback Machine, forums                | ~150-500 offers |
| Soft perks per card                                               | Research: issuer sites                           | ~100-200 rows   |
| Ongoing offer updates                                             | Automated scraping + human approval              | Continuous      |

---

## 8. Out of Scope for V1

- Mobile-optimized UI
- Multi-user / authentication
- P2/household tracking (partner cards, cross-referrals, pooled points)
- Multi-currency tracking
- Credit score / credit bureau inquiry tracking
- Card recommendation across cards you don't own ("you should apply for X")
- Points transfer partner network modeling
- Cloud deployment
- Export capabilities (CSV, PDF reports)
- Budget rollover between months
- Minimum spend optimization tools (Chexy, Plastiq, PaySimply integration or advice)

---

## 9. Open Items

| #     | Item                                                                                                                      | Status                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OI-01 | ~~Define specific Purchase Type categories for budgeting~~                                                                | Closed — resolved by SPEC-06 (D-94). 14 Purchase Types seeded.                                                                                                        |
| OI-02 | ~~Define specific Earning Categories across programs~~                                                                    | Closed — resolved by SPEC-06 (D-98). 12 Earning Categories seeded.                                                                                                    |
| OI-03 | ~~Budget ratio constraint UX (must total 100%) - how to handle during setup~~                                             | Closed — resolved by SPEC-06 (D-99). Warning-only, no hard constraint.                                                                                                |
| OI-04 | ~~Card status transition rules (Focus -> Active trigger). Multi-tier bonus structure addressed in D-24.~~                 | Closed — resolved by SPEC-03 (D-189). Full state machine: Focus→Active→To Cancel→Closed with defined transitions and triggers.                                        |
| OI-05 | ~~Plaid pricing model for personal use~~                                                                                  | Closed — researched in Step 2. Plaid $5–30/month, SimpleFIN $15/year. Provider decision made in D-30.                                                                 |
| OI-06 | ~~Define specific dashboard alert event types (MSR deadlines, AF renewals, eligibility windows, perk expirations, etc.)~~ | Closed — resolved incrementally across 21 specs. 23 alert types defined across SPEC-01, 03, 04, 05, 06, 09, 10, 13, 15. Every spec asked "does this generate alerts?" |
| OI-07 | ~~Encryption approach for stored card details (number, CVV, expiry) — local-only but still sensitive~~                    | Closed — resolved by D-70. AES-256-GCM, env var key, per-field IV. Details in [TECHNICAL_STANDARDS.md](TECHNICAL_STANDARDS.md) §9.                                    |
| OI-08 | ~~Pending-to-posted transaction lifecycle handling in data model~~                                                        | Closed — resolved by D-42. System ignores pending transactions entirely; only posted transactions are ingested.                                                       |

---

_This document is the single source of truth for the Financial Planner project. Every design decision, FRICEW object, and implementation choice must trace back to a problem, decision, or requirement stated here._
