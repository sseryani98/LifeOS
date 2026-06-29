# Design Workshop Methodology

**Document ID:** DW-001
**Version:** 1.0
**Date:** 2026-02-15
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                            |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-02-15 | Sandro & Claude | Initial creation — Step 7 complete. D-53 through D-55 logged. 21 specs defined, workshop methodology established, Claude skill created.                |
| 2026-02-20 | Claude          | Status → Approved. All 21 specs written and approved using this methodology (Step 12 complete). OI-06 fully resolved (14 Alert Types). Footer updated. |

---

## 2. Purpose

This document defines the methodology for writing functional specifications for the Financial Planner project's 43 FRICEW objects. It establishes:

- How 43 objects are grouped into 21 specs
- The standardized template every spec follows
- The 6-phase workshop flow for each spec session
- The definition of done for specs
- How open items (OI-01 through OI-07) are resolved during workshops
- The recommended spec ordering

This methodology is implemented as a reusable Claude Code skill (`/workshop`) for consistent execution across all 21 spec sessions.

---

## 3. Grouping Strategy

**Decision D-53.** Hybrid grouping — 13 grouped specs covering 35 objects + 8 standalone specs covering 8 objects = 21 specs total.

**Principle:** Objects that share a data pipeline or can't be designed without each other get one spec. Objects that are leaf nodes (consumers only, no downstream dependents) get their own standalone spec. The test: if specifying Object A requires answering questions about Object B's behavior, they belong together. If Object A just _reads_ from Object B's output, it can stand alone.

### 3.1 Grouped Specs (13 specs, 35 objects)

| Spec | Name                   | Objects                                     | Why Grouped                                                                                                                      |
| ---- | ---------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Ingestion Pipeline     | ENH-008, INT-001, INT-002, FRM-003, FRM-010 | Shared data flow. Can't design dedup without knowing what both sources produce. FRM-003/FRM-010 are the UIs for INT-002/INT-001. |
| 2    | Transaction Processing | ENH-001, ENH-009, FRM-001                   | FRM-001 is the review surface for ENH-001's categorization output. ENH-009 splits are initiated from FRM-001.                    |
| 3    | Card Lifecycle         | FRM-004, FRM-006, WFL-002, WFL-004          | One user journey: onboard card → manage lifecycle → browse portfolio. State machine drives all of them.                          |
| 4    | Bonus & Points         | ENH-003, ENH-006                            | Both compute from transactions × multipliers. Bonus tracker and points balance share computation context.                        |
| 5    | Budget Pipeline        | ENH-007, FRM-007                            | Budget formula starts with income (FRM-007). Tightly coupled.                                                                    |
| 6    | Reference Data & Seed  | FRM-009, CNV-002, CNV-003                   | CNV-002/CNV-003 populate what FRM-009 maintains. Spec defines both initial load and ongoing CRUD.                                |
| 7    | Card Recommendation    | ENH-002, RPT-006                            | Engine + its primary visualization. Same design concern.                                                                         |
| 8    | Card Profitability     | ENH-005, RPT-005                            | Calculator + its analytics report. Same design concern.                                                                          |
| 9    | Goals                  | FRM-008, RPT-011                            | Goals form + goals progress report. Entry and visualization of the same data.                                                    |
| 10   | Financial Picture      | FRM-011, RPT-003                            | Entry form feeds dashboard directly. Same domain.                                                                                |
| 11   | Churning Analytics     | RPT-008, RPT-009, RPT-010                   | Three churning-focused analytical reports. All Wave 3 leaf nodes, same domain.                                                   |
| 12   | Budget Analytics       | RPT-007, RPT-012                            | Two budget/financial trend reports. Both Wave 3 leaf nodes.                                                                      |
| 13   | Market Intelligence    | INT-003, WFL-003, CNV-004                   | Self-contained Wave 4 cluster.                                                                                                   |

### 3.2 Standalone Specs (8 specs, 8 objects)

| Spec | Name                            | Object  | Why Standalone                                                                                       |
| ---- | ------------------------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 14   | Historical Transaction Backfill | CNV-001 | Uses INT-002 infra but has unique migration concerns (batch strategy, reconciliation, data quality). |
| 15   | Weekly Review Session           | WFL-001 | Cross-component orchestration workflow. Specs the user journey, not the components.                  |
| 16   | Issuer Eligibility Engine       | ENH-004 | Self-contained computation engine. Output consumed by RPT-001 but no shared design decisions.        |
| 17   | Transaction Entry               | FRM-002 | Standalone data entry form. Displays ENH-002 recommendation but doesn't co-design it.                |
| 18   | Market Cards                    | FRM-005 | Wave 3 browse-only form. Leaf node.                                                                  |
| 19   | Churnboard                      | RPT-001 | Large multi-section dashboard spanning two waves. Needs its own spec.                                |
| 20   | Monthly Budget Dashboard        | RPT-002 | Large multi-section dashboard spanning two waves. Needs its own spec.                                |
| 21   | Trophy Case                     | RPT-004 | Standalone redemption history report.                                                                |

**Totals: 21 specs, 43 objects. Every FRICEW ID appears exactly once.**

### 3.3 FRICEW-to-Spec Cross-Reference

| FRICEW ID | Name                              | Spec # |
| --------- | --------------------------------- | ------ |
| ENH-001   | Transaction Categorization Engine | 2      |
| ENH-002   | Card Recommendation Engine        | 7      |
| ENH-003   | Signup Bonus Tracker              | 4      |
| ENH-004   | Issuer Eligibility Engine         | 16     |
| ENH-005   | Card Profitability Calculator     | 8      |
| ENH-006   | Points Balance & Valuation        | 4      |
| ENH-007   | Budget Engine                     | 5      |
| ENH-008   | Transaction Deduplication         | 1      |
| ENH-009   | Split Transaction Logic           | 2      |
| INT-001   | SimpleFIN Transaction Sync        | 1      |
| INT-002   | CSV Transaction Import            | 1      |
| INT-003   | Offer Data Web Scraper            | 13     |
| CNV-001   | Historical Transaction Backfill   | 14     |
| CNV-002   | Reference Data Seed               | 6      |
| CNV-003   | Card Portfolio Load               | 6      |
| CNV-004   | Market Card Database Build        | 13     |
| FRM-001   | Transaction List & Review         | 2      |
| FRM-002   | Transaction Entry                 | 17     |
| FRM-003   | CSV Import Wizard                 | 1      |
| FRM-004   | My Cards                          | 3      |
| FRM-005   | Market Cards                      | 18     |
| FRM-006   | Card Onboarding                   | 3      |
| FRM-007   | Income Entry                      | 5      |
| FRM-008   | Goals Management                  | 9      |
| FRM-009   | Master Data Maintenance           | 6      |
| FRM-010   | SimpleFIN Connection Manager      | 1      |
| FRM-011   | Financial Picture Entry           | 10     |
| RPT-001   | Churnboard                        | 19     |
| RPT-002   | Monthly Budget Dashboard          | 20     |
| RPT-003   | Financial Picture Dashboard       | 10     |
| RPT-004   | Trophy Case                       | 21     |
| RPT-005   | Card Analytics                    | 8      |
| RPT-006   | Card Recommendation Matrix        | 7      |
| RPT-007   | Spending Trends                   | 12     |
| RPT-008   | Soft Perk Tracker                 | 11     |
| RPT-009   | Annual Churning Summary           | 11     |
| RPT-010   | Points Program Dashboard          | 11     |
| RPT-011   | Goal Progress                     | 9      |
| RPT-012   | Income vs Expenses Trend          | 12     |
| WFL-001   | Weekly Review Session             | 15     |
| WFL-002   | Card Lifecycle                    | 3      |
| WFL-003   | Offer Approval                    | 13     |
| WFL-004   | New Card Setup                    | 3      |

---

## 4. Spec Template

**Decision D-54.** Every spec follows the structure below. For grouped specs, each FRICEW object gets a subsection within Section 3.

### 4.1 Sections

| #   | Section                | Purpose                                                                                        |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| H   | Header                 | Spec ID, name, FRICEW objects covered, wave(s), CDS service(s), status, change history         |
| 1   | Overview               | 2-3 sentences: what this feature does, why it matters, key decisions referenced                |
| 2   | Data Model References  | Table of DM-001 entities involved and their role. New attributes flagged as DM-001 amendments. |
| 3   | Functional Description | Type-specific content (see §4.2). Per-object subsections for grouped specs.                    |
| 4   | Business Rules         | Numbered rules (BR-xx). Testable, unambiguous. Cross-cutting rules for grouped specs.          |
| 5   | Error Handling         | Error conditions, system response, i18n message keys                                           |
| 6   | Open Items             | Which OI-xx items are resolved by this spec, and how                                           |
| 7   | Functional Unit Tests  | Per-object test scenarios (FUT-xxx) with preconditions, steps, and expected results            |

### 4.2 Type-Specific Functional Description (Section 3)

| FRICEW Type     | Section 3 Contains                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Form**        | Field list (name, type, required, validation), layout description, actions/buttons, navigation, Fiori Elements annotations vs freestyle, filters/sorting |
| **Report**      | Dashboard sections, chart type per section, data aggregation logic, filters, drill-down behavior                                                         |
| **Interface**   | API contract (endpoints, auth, payloads), data mapping (external field → CDS entity), scheduling, retry logic                                            |
| **Conversion**  | Source format, transformation rules, validation/rejection criteria, execution order, reconciliation approach                                             |
| **Enhancement** | Inputs, outputs, algorithm/logic description, computation examples with real numbers                                                                     |
| **Workflow**    | State diagram, transitions with triggers, guards (conditions), side effects per transition                                                               |

### 4.3 Functional Unit Test Format

```markdown
### FUT-001: [Test Name]

**Covers:** [FRICEW IDs]

**Preconditions:**

- [Starting state]

**Steps:**

1. [Action]
2. [Action]

**Expected Result:**

- [Verifiable outcome]
```

### 4.4 Grouped Spec Structure Example

For Spec #1 — Ingestion Pipeline (ENH-008, INT-001, INT-002, FRM-003, FRM-010):

```
Header
1. Overview
2. Data Model References
3. Functional Description
   3.1 INT-001 — SimpleFIN Transaction Sync [Interface]
   3.2 INT-002 — CSV Transaction Import [Interface]
   3.3 ENH-008 — Transaction Deduplication [Enhancement]
   3.4 FRM-003 — CSV Import Wizard [Form]
   3.5 FRM-010 — SimpleFIN Connection Manager [Form]
4. Business Rules
5. Error Handling
6. Open Items
7. Functional Unit Tests
```

---

## 5. Workshop Format

**Decision D-55.** Draft-then-interview approach. Claude pre-drafts from existing documentation, Sandro validates and fills gaps.

### 5.1 Six-Phase Flow

| Phase                        | What Happens                                                                                                                              | Who Drives                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **1. Pre-draft**             | Claude reads all relevant docs (BA, DM, decisions, tech stack) and produces a draft spec. Gaps are marked with `[WORKSHOP]` placeholders. | Claude                            |
| **2. Draft review**          | Claude presents pre-drafted sections. "Does this accurately capture the intent?"                                                          | Claude presents, Sandro validates |
| **3. Gap interview**         | Claude walks through each `[WORKSHOP]` placeholder one question at a time. Type-specific questions (see §5.2).                            | Claude asks, Sandro answers       |
| **4. Business rules**        | Claude proposes numbered business rules based on the conversation. Sandro confirms, amends, or adds.                                      | Claude proposes, Sandro validates |
| **5. Functional unit tests** | Claude drafts FUT scenarios based on business rules. Sandro validates coverage.                                                           | Claude proposes, Sandro validates |
| **6. Spec production**       | Claude writes final spec. New decisions → DECISIONS_LOG.md. DM-001 amendments flagged.                                                    | Claude writes                     |

### 5.2 Type-Specific Workshop Questions

| FRICEW Type     | Key Questions                                                                     |
| --------------- | --------------------------------------------------------------------------------- |
| **Form**        | "Walk me through this screen. What do you see? What can you do?"                  |
| **Report**      | "What sections on this dashboard? What chart shows each metric?"                  |
| **Interface**   | "What comes in? What goes out? What breaks?"                                      |
| **Conversion**  | "What's the source data? How do we clean it? How do we know it loaded correctly?" |
| **Enhancement** | "Walk me through a real example with your actual cards."                          |
| **Workflow**    | "What are the states? What moves it from one to another?"                         |

### 5.3 Pre-Draftable vs Workshop-Required

| Type            | Pre-draftable from existing docs                        | Needs workshop                                                                         |
| --------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Form**        | Entity fields, CDS service, Fiori Elements vs freestyle | Layout, column order, inline editing, action buttons, filter defaults, navigation      |
| **Report**      | Which ENH engines feed it, wave scope                   | Section layout, chart types, filter controls, drill-down, "what do you look at first?" |
| **Interface**   | API contract, data mapping to entities                  | Error recovery, retry logic, scheduling details, edge cases                            |
| **Conversion**  | Source format, target entities, execution order         | Data quality rules, rejection handling, reconciliation, batch strategy                 |
| **Enhancement** | Inputs/outputs from BA, related decisions               | Algorithm specifics, tie-breaking, thresholds, real-number walkthroughs                |
| **Workflow**    | States from DM-001 enums, transitions from BA           | Guard conditions, side effects, manual transition triggers                             |

### 5.4 Standing Workshop Rules

- One question at a time during gap interview
- **Keep interviewing until confident there are no more questions.** After clearing all `[WORKSHOP]` placeholders, think critically about edge cases, interactions, and ambiguities. Only move to Phase 4 when there are genuinely no more open questions.
- Use real examples with Sandro's actual cards where possible
- Ask "does this feature generate any alerts?" for every spec (OI-06 resolution)
- No `[WORKSHOP]` placeholders in the final spec
- Every business rule must be testable
- Every FUT must reference at least one FRICEW object
- **Output must be lean.** Follow the template exactly — no extra sections, no filler prose, no restating information already in BA/DM/Decisions docs. Tables over paragraphs. Business rules as terse numbered assertions. FUTs as concrete step sequences. If a sentence doesn't help a build persona implement or a review persona validate, cut it.

---

## 6. Definition of Done

A spec moves from **Draft → Approved** when all criteria are met:

| #   | Criterion                                                                 | Verified By |
| --- | ------------------------------------------------------------------------- | ----------- |
| 1   | No `[WORKSHOP]` placeholders remain                                       | Claude      |
| 2   | Every FRICEW object has its type-specific functional description complete | Claude      |
| 3   | Business rules are numbered (BR-xx) and testable — no ambiguity, no "TBD" | Claude      |
| 4   | Functional unit tests cover happy path + key error/edge paths             | Claude      |
| 5   | Data model references verified against DM-001 — amendments flagged        | Claude      |
| 6   | New decisions logged in DECISIONS_LOG.md with full context                | Claude      |
| 7   | No broken cross-references to other specs, decisions, or entities         | Claude      |
| 8   | Sandro has explicitly approved                                            | Sandro      |

**Simple rule:** If a build persona would need to ask a clarifying question, the spec isn't done.

---

## 7. Open Item Resolution

Open items from [PSV-001 §9](PROBLEM_STATEMENT_AND_VISION.md) are resolved during workshops as follows:

| OI    | Item                         | Resolving Spec                | How                                                                                                                                                                                  |
| ----- | ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OI-01 | Purchase Type categories     | #6 — Reference Data & Seed    | Workshop defines starter category list for CNV-002 seed data                                                                                                                         |
| OI-02 | Earning Categories           | #6 — Reference Data & Seed    | Workshop defines starter category list for CNV-002 seed data                                                                                                                         |
| OI-03 | Budget ratio constraint UX   | #6 — Reference Data & Seed    | FRM-009 spec defines how the UI enforces 100% sum constraint on Budget Allocations                                                                                                   |
| OI-04 | Card status transition rules | #3 — Card Lifecycle           | WFL-002 spec defines exact triggers, guards, and side effects for each state transition                                                                                              |
| OI-06 | Alert event types            | Incremental across specs      | Each spec that generates alerts defines its types. Full list assembled in CNV-002 seed data (Spec #6). Standing rule: "does this feature generate any alerts?" asked for every spec. |
| OI-07 | Encryption approach          | Step 10 — Technical Standards | Not a functional concern. Specs reference "encrypted" and assume it works. Implementation details in TECHNICAL_STANDARDS.md.                                                         |

OI-05 (Plaid pricing) and OI-08 (pending transactions) are already closed.

---

## 8. Spec Ordering

Specs are written in dependency order: Wave 1 first, then Waves 2–4. Within each wave, ordered by the sprint plan's build dependency layers.

| Order | Spec | Name                   | FRICEW Objects                              |
| ----- | ---- | ---------------------- | ------------------------------------------- |
| 1     | #6   | Reference Data & Seed  | FRM-009, CNV-002, CNV-003                   |
| 2     | #1   | Ingestion Pipeline     | ENH-008, INT-001, INT-002, FRM-003, FRM-010 |
| 3     | #14  | Historical Backfill    | CNV-001                                     |
| 4     | #2   | Transaction Processing | ENH-001, ENH-009, FRM-001                   |
| 5     | #4   | Bonus & Points         | ENH-003, ENH-006                            |
| 6     | #5   | Budget Pipeline        | ENH-007, FRM-007                            |
| 7     | #3   | Card Lifecycle         | FRM-004, FRM-006, WFL-002, WFL-004          |
| 8     | #19  | Churnboard             | RPT-001                                     |
| 9     | #20  | Budget Dashboard       | RPT-002                                     |
| 10    | #15  | Weekly Review          | WFL-001                                     |
| 11    | #7   | Card Recommendation    | ENH-002, RPT-006                            |
| 12    | #16  | Eligibility Engine     | ENH-004                                     |
| 13    | #8   | Card Profitability     | ENH-005, RPT-005                            |
| 14    | #17  | Transaction Entry      | FRM-002                                     |
| 15    | #9   | Goals                  | FRM-008, RPT-011                            |
| 16    | #21  | Trophy Case            | RPT-004                                     |
| 17    | #10  | Financial Picture      | FRM-011, RPT-003                            |
| 18    | #18  | Market Cards           | FRM-005                                     |
| 19    | #12  | Budget Analytics       | RPT-007, RPT-012                            |
| 20    | #11  | Churning Analytics     | RPT-008, RPT-009, RPT-010                   |
| 21    | #13  | Market Intelligence    | INT-003, WFL-003, CNV-004                   |

Orders 1–10 cover Wave 1. Orders 11–16 cover Wave 2. Orders 17–20 cover Wave 3. Order 21 covers Wave 4.

---

## 9. Spec File Structure

Specs are stored in `design/specs/`:

```
design/specs/
├── SPEC-01-INGESTION-PIPELINE.md
├── SPEC-02-TRANSACTION-PROCESSING.md
├── SPEC-03-CARD-LIFECYCLE.md
├── SPEC-04-BONUS-AND-POINTS.md
├── SPEC-05-BUDGET-PIPELINE.md
├── SPEC-06-REFERENCE-DATA-AND-SEED.md
├── SPEC-07-CARD-RECOMMENDATION.md
├── SPEC-08-CARD-PROFITABILITY.md
├── SPEC-09-GOALS.md
├── SPEC-10-FINANCIAL-PICTURE.md
├── SPEC-11-CHURNING-ANALYTICS.md
├── SPEC-12-BUDGET-ANALYTICS.md
├── SPEC-13-MARKET-INTELLIGENCE.md
├── SPEC-14-HISTORICAL-BACKFILL.md
├── SPEC-15-WEEKLY-REVIEW.md
├── SPEC-16-ELIGIBILITY-ENGINE.md
├── SPEC-17-TRANSACTION-ENTRY.md
├── SPEC-18-MARKET-CARDS.md
├── SPEC-19-CHURNBOARD.md
├── SPEC-20-BUDGET-DASHBOARD.md
└── SPEC-21-TROPHY-CASE.md
```

---

## 10. Decisions Reference

Decisions made during workshop setup (Step 7):

| ID   | Title                  | Summary                                                                             |
| ---- | ---------------------- | ----------------------------------------------------------------------------------- |
| D-53 | Spec Grouping Strategy | Hybrid: 13 grouped + 8 standalone = 21 specs for 43 objects                         |
| D-54 | Lean Spec Template     | 7 sections, type-specific functional descriptions, FUTs replace acceptance criteria |
| D-55 | Workshop Methodology   | Draft-then-interview, 6-phase flow, reusable `/workshop` Claude skill               |

---

_This document is the single source of truth for the Financial Planner spec workshop methodology. It governed how functional specifications were written during Step 12. All 21 specs are now approved. The workshop was implemented as a Claude Code skill (`/workshop`) for repeatable execution. Spec content traces back to the [Business Architecture](BUSINESS_ARCHITECTURE.md), [Data Model](DATA_MODEL.md), and [Decisions Log](user-profile/DECISIONS_LOG.md)._
