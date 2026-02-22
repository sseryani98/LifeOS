# Financial Planner - Project Context

## What This Is

A personal financial management system for a Canadian credit card churner. The system automates transaction ingestion, tracks churning performance metrics, manages budgeting, and provides a consolidated financial picture.

## Owner

Sandro - solo user, SAP implementation consultant by day, credit card churner by hobby.

## Key Architecture Decisions

- **Automation is the foundation** - without auto-import, nothing gets used. Manual effort killed the Excel approach.
- **SimpleFIN Bridge is the V1 transaction source** (D-30) - MX backend has direct API partnerships with CIBC and Amex. TD via screen scraping. Scotiabank via CSV import (D-31). Architecture is provider-abstracted to support future CDB (open banking) transition.
- **In-house categorization engine** (D-32) - SimpleFIN data is sparse (raw bank descriptions, no categories). System normalizes merchant names and assigns categories in-house, learning from user corrections.
- **Two independent categorization taxonomies** - Purchase Type (budget) and Earning Category (churning), both auto-learned.
- **Desktop-first web app** - no mobile optimization needed for V1.
- **Single user, local deployment** - no auth, no multi-tenancy.
- **All 4 build waves ship together** (D-35) - no MVP release. Waves (23/8/9/3 objects) define build order and testable increments, not release phases.

## Repository Structure

```
Financial Planner/
├── CLAUDE.md                                  ← You are here. Project context for Claude Code
├── design/                                    ← All design work lives here
│   ├── PROBLEM_STATEMENT_AND_VISION.md        ← Foundation document, everything traces back here
│   ├── BUSINESS_ARCHITECTURE.md               ← FRICEW catalog — 43 objects with IDs, traceability, and wave plan (§9)
│   ├── DATA_MODEL.md                          ← 42 entities with attributes, relationships, computed values (Step 5)
│   ├── TECH_STACK.md                          ← Tech stack decisions, libraries, project structure, personas (Step 6)
│   ├── PROJECT_MANAGEMENT.md                  ← Sprint methodology, sprint plan, meeting format, tracking (Step 6)
│   ├── DESIGN_PHASE_TIMELINE.md               ← Steps to first line of code, with progress tracking
│   ├── DESIGN_WORKSHOP.md                     ← Workshop methodology, spec grouping, template, DoD (Step 7)
│   ├── DESIGN_SYSTEM.md                       ← Theme, nav, layout, colors, charts, status indicators (Step 8)
│   ├── THEME.md                               ← Custom theme overrides on sap_horizon — palette, border radius, components (Step 14)
│   ├── TECHNICAL_STANDARDS.md                 ← CDS, TypeScript, handler patterns, linting, logging, encryption (Step 9)
│   ├── TEST_STRATEGY.md                       ← Test framework, boundaries, coverage, test data strategy (Step 10)
│   ├── VERSION_CONTROL.md                     ← Git strategy, branching, commits, merge, tagging (Step 11)
│   ├── specs/                                 ← Functional specs written during Step 12 workshops
│   │   ├── SPEC-01-INGESTION-PIPELINE.md      ← Approved — ENH-008, INT-001, INT-002, FRM-003, FRM-010
│   │   ├── SPEC-02-TRANSACTION-PROCESSING.md  ← Approved — ENH-001, ENH-009, FRM-001
│   │   ├── SPEC-04-BONUS-AND-POINTS.md        ← Approved — ENH-003, ENH-006
│   │   ├── SPEC-05-BUDGET-PIPELINE.md         ← Approved — ENH-007
│   │   ├── SPEC-06-REFERENCE-DATA-AND-SEED.md ← Approved — CNV-002, CNV-003, FRM-009
│   │   ├── SPEC-07-CARD-RECOMMENDATION.md     ← Approved — ENH-002, RPT-006
│   │   ├── SPEC-08-CARD-PROFITABILITY.md      ← Approved — ENH-005, RPT-005
│   │   ├── SPEC-09-GOALS.md                   ← Approved — FRM-008, RPT-011
│   │   ├── SPEC-10-FINANCIAL-PICTURE.md       ← Approved — FRM-011, RPT-003
│   │   ├── SPEC-11-CHURNING-ANALYTICS.md      ← Approved — RPT-008, RPT-009, RPT-010
│   │   ├── SPEC-12-BUDGET-ANALYTICS.md        ← Approved — RPT-007, RPT-012
│   │   ├── SPEC-13-MARKET-INTELLIGENCE.md     ← Approved — INT-003, WFL-003, CNV-004
│   │   ├── SPEC-14-HISTORICAL-BACKFILL.md     ← Approved — CNV-001
│   │   ├── SPEC-15-WEEKLY-REVIEW.md            ← Approved — WFL-001
│   │   ├── SPEC-16-ELIGIBILITY-ENGINE.md       ← Approved — ENH-004
│   │   ├── SPEC-17-TRANSACTION-ENTRY.md        ← Approved — FRM-002
│   │   ├── SPEC-18-MARKET-CARDS.md            ← Approved — FRM-005
│   │   ├── SPEC-19-CHURNBOARD.md              ← Approved — RPT-001
│   │   ├── SPEC-20-BUDGET-DASHBOARD.md        ← Approved — RPT-002
│   │   └── SPEC-21-TROPHY-CASE.md             ← Approved — RPT-004
│   ├── user-profile/
│   │   ├── SANDRO.md                          ← User preferences, working style, likes/dislikes
│   │   └── DECISIONS_LOG.md                   ← All design decisions with context and rationale (D-01 through D-313)
│   ├── actual-csvs/                           ← Real CSV samples from all 4 issuers (Scotia, TD, CIBC, Amex)
│   └── reference/
│       └── ORIGINAL_SPEC_2024.md              ← Archived original spec (reference input, not governing)
└── research/
    ├── churning-in-canada.md                  ← Domain research on Canadian CC churning (Step 1 input)
    ├── plaid-research.md                      ← Plaid API assessment (Step 2 input)
    └── simplefin-research.md                  ← SimpleFIN Bridge assessment (Step 2 input)
```

## Design Progress

- **Steps 0–14 complete** — problem statement, domain research, aggregator spike, data model, tech stack, project management, workshop methodology, design system, technical standards, test strategy, version control, functional specs, information architecture, theme build
- **313 design decisions logged** (D-01 through D-313)
- **DM-001 amendments tracked** — System Config, Import Log, Redemption Type, GoalForecastItem, Financial Contribution, Financial Account (+5 fields), Financial Account Type (seed expansion), Points Transfer, ScrapeRun, ScrapeQueueItem, ScrapeMapping, and field-level changes across multiple specs

## Project Terminology

Sandro uses SAP FRICEW terminology for design objects:

- **F** - Forms (UI screens)
- **R** - Reports (dashboards, analytics)
- **I** - Interfaces (APIs, integrations, data feeds)
- **C** - Conversions (data migration, historical loading)
- **E** - Enhancements (custom business logic)
- **W** - Workflows (process flows, state machines)

Each object gets an ID: `FRM-001`, `RPT-001`, `INT-001`, `CNV-001`, `ENH-001`, `WFL-001`

## Document Status Convention

Every design document carries a **Status** field in its header block. The status determines whether the document is evolving or frozen.

| Status | Meaning | Change History? |
|--------|---------|-----------------|
| Draft | Being written, not yet reviewed | Yes |
| Active | In use and being updated | Yes |
| In Review | Under review | Yes |
| Approved | Reviewed and approved, may receive amendments | Yes |
| Final | Frozen - no further changes | No |
| Archived | Superseded, kept for reference only | No |

**Rules:**

- Evolving documents (Draft, Active, In Review, Approved) must have a **Change History** table as section 1
- Frozen documents (Final, Archived) do not get a change history
- Change History format: `| Date | Author | Description |`
- When editing an evolving document, Claude **must** add an entry to its Change History table describing the change
- Claude must **never** edit a frozen document (Final or Archived) without explicit approval from Sandro

**Exempt from versioning:** `CLAUDE.md` and `SANDRO.md` — these are project config and user profile files, not design deliverables

## Conventions

- Currency: CAD (foreign currency not tracked for now)
- Budget periods: Monthly, no rollover
- All design decisions are documented with rationale in the design folder
- Plan thoroughly before coding - no code until design is approved
- No duplication across documents - single source of truth per piece of information, reference from elsewhere

## Do NOT

- Write any application code until the design phase is complete and approved
- Skip the design review process
- Make assumptions about business rules - ask Sandro
- Add features beyond what's been discussed and documented
