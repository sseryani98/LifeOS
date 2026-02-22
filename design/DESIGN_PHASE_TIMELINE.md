# Design Phase Timeline

**Document ID:** DPT-001
**Version:** 1.0
**Date:** 2026-02-12
**Status:** Active

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-12 | Sandro & Claude | Initial creation |
| 2026-02-12 | Sandro & Claude | Step 1 (Domain Validation) marked complete |
| 2026-02-12 | Sandro & Claude | Inserted Step 7 (Design Workshop Setup) — methodology, templates, workshop format. Steps 7-9 renumbered to 8-10 |
| 2026-02-12 | Sandro & Claude | Step 2 (Aggregator Spike) marked complete. Renamed from "Plaid Spike" — gate outcome: GO WITH CAVEATS, SimpleFIN as V1 provider (D-30). Updated Plaid references throughout. |
| 2026-02-13 | Sandro & Claude | Step 3 (Business Architecture) marked complete. 43 FRICEW objects cataloged: 11 Forms, 12 Reports, 3 Interfaces, 4 Conversions, 9 Enhancements, 4 Workflows. |
| 2026-02-13 | Sandro & Claude | Step 4 (Prioritization & Phasing) marked complete. 4 build waves (23/8/9/3). All built before go-live (D-35). Wave plan in BA-001 §9. |
| 2026-02-13 | Sandro & Claude | Step 5 (Data Model Design) marked complete. 39 entities (16 ref, 16 master, 6 transactional, 1 cross-cutting). 10 decisions (D-36–D-45). OI-08 closed. |
| 2026-02-13 | Sandro & Claude | Step 6 (Tech Stack Decision) marked complete. TypeScript + CAP + SAPUI5 + PostgreSQL. 7 decisions (D-46–D-52). 10 subagent personas. Project management methodology defined. |
| 2026-02-13 | Sandro & Claude | Inserted Step 10 (Technical Standards) — CDS, TypeScript, SAPUI5, linting, logging, error handling conventions. Step 10 renumbered to 11. Total steps now 11. |
| 2026-02-15 | Sandro & Claude | Step 7 (Design Workshop Setup) marked complete. 21 specs defined (13 grouped + 8 standalone) covering all 43 FRICEW objects. Workshop methodology, spec template, DoD, open item mapping, and `/workshop` Claude skill created. D-53 through D-55 logged. |
| 2026-02-15 | Sandro & Claude | Steps 8–11 reordered: Design System → Technical Standards → Test Strategy → Functional Specs. Functional Specs moved to last step so specs can reference established design patterns, coding standards, and test approaches. Dependency diagram updated. |
| 2026-02-16 | Sandro & Claude | Step 8 (Design System) marked complete. Horizon Light + Compact, side navigation (5 groups), 2-column dashboard grid, standard semantic colors, chart conventions, page layout standards. D-56 through D-62 logged. |
| 2026-02-16 | Sandro & Claude | Step 9 (Technical Standards) marked complete. CDS conventions, TypeScript strict mode, Facade/Service/Validator formalized, error handling, logging (console + file), i18n three-tier, encryption (OI-07 resolved), ESLint (Enbridge-adapted), SAPUI5 conventions, code review checklists. D-63 through D-73 logged. |
| 2026-02-16 | Sandro & Claude | Step 10 (Test Strategy) marked complete. Jest + ts-jest, three-tier pyramid, per-layer unit standards, integration via cds.test() + SQLite, hybrid test data with canonical test world, coverage targets (100%/90%/85%), frontend testing (QUnit + OPA5 as learning exercise). D-74 through D-80 logged. |
| 2026-02-16 | Sandro & Claude | Inserted Step 11 (Version Control Strategy) — .gitignore, branching, commit conventions, merge strategy, tagging. Functional Specs renumbered to Step 12. Total steps now 12. D-81 through D-86 logged. |
| 2026-02-18 | Sandro & Claude | Added Step 13 (Information Architecture) — UX-lens review after all specs complete. Sitemap validation, task flow mapping, cross-page navigation, entry points, discoverability audit, wave-gating UX. Total steps now 13. |
| 2026-02-18 | Sandro & Claude | Added Step 14 (Theme Build) — custom visual identity on top of sap_horizon. Custom color palette, 0 border radius, component overrides. Amends D-60. Total steps now 14. |
| 2026-02-18 | Claude | Step 12 status updated to In Progress — 13 of 21 specs approved (SPEC-01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14). |
| 2026-02-20 | Sandro & Claude | Added Step 15 (Build Plan) — prompt playbook, CLAUDE.md build-phase update, scaffold prompt, sprint checklists. Central deliverable: ordered prompts Sandro pastes into Claude Code. Total steps now 15. |
| 2026-02-20 | Claude | Step 12 (Functional Specs) marked complete — all 21 of 21 specs approved. 43 FRICEW objects fully specified across all 4 waves. 201 workshop decisions logged (D-87 through D-287). OI-06 resolved (14 Alert Types accumulated). All Step 0–12 design documents updated to Approved status. |
| 2026-02-21 | Sandro & Claude | Step 13 (Information Architecture) drafted. Revised side nav (23 entries, 3 changes from DS-001), 7 user journeys traced, 30+ cross-page links defined, landing page set (WFL-001), discoverability audit complete (1 side-nav-only page), wave-gating changed to hidden-until-built. D-288 through D-307 logged. |
| 2026-02-21 | Sandro & Claude | Step 14 (Theme Build) drafted. Warm Charcoal brand palette, dark ShellBar, 0 border radius, 28 CSS custom property overrides, single-file override strategy. Amends D-60. D-308 through D-313 logged. |
| 2026-02-21 | Sandro & Claude | Step 15 (Build Plan) complete. BUILD_PLAN.md approved — 32 prompts across 10 sprints covering all 43 FRICEW objects. Cross-sprint integration contracts, build-phase CLAUDE.md, scaffold prompt, sprint checklists, prompt playbook with pass/fail gates. Design phase complete. |

---

## Progress

| Step | Name | Status | Deliverable |
|------|------|--------|-------------|
| 0 | Problem Statement + Vision | Complete | [PROBLEM_STATEMENT_AND_VISION.md](PROBLEM_STATEMENT_AND_VISION.md) |
| 1 | Domain Validation | Complete | D-22 through D-29 + PSV amendments (no standalone doc — outcomes captured in decisions log and PSV change history) |
| 2 | Aggregator Spike | Complete | Plaid + SimpleFIN research (research/), gate assessment, D-30 through D-34, OI-05 closed |
| 3 | Business Architecture | Complete | [BUSINESS_ARCHITECTURE.md](BUSINESS_ARCHITECTURE.md) — 43 FRICEW objects |
| 4 | Prioritization & Phasing | Complete | Wave plan in [BA-001 §9](BUSINESS_ARCHITECTURE.md) — 4 build waves (23/8/9/3), all built before go-live (D-35) |
| 5 | Data Model Design | Complete | [DATA_MODEL.md](DATA_MODEL.md) — 39 entities, D-36 through D-45, OI-08 closed |
| 6 | Tech Stack Decision | Complete | [TECH_STACK.md](TECH_STACK.md) + [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) — TypeScript, CAP + SAPUI5, PostgreSQL, D-46 through D-52, 10 personas |
| 7 | Design Workshop Setup | Complete | [DESIGN_WORKSHOP.md](DESIGN_WORKSHOP.md) — 21 specs, workshop methodology, `/workshop` skill, D-53 through D-55 |
| 8 | Design System | Complete | [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — Horizon Light, compact density, side nav, dashboard grid, chart conventions, status indicators. D-56 through D-62. |
| 9 | Technical Standards | Complete | [TECHNICAL_STANDARDS.md](TECHNICAL_STANDARDS.md) — CDS conventions, TypeScript strict mode, handler patterns, error handling, logging, i18n, encryption (OI-07), ESLint, SAPUI5 conventions, code review checklists. D-63 through D-73. |
| 10 | Test Strategy | Complete | [TEST_STRATEGY.md](TEST_STRATEGY.md) — Jest + ts-jest, three-tier pyramid, per-layer unit standards, cds.test() + SQLite integration, hybrid test data with canonical test world, coverage targets, QUnit + OPA5 frontend. D-74 through D-80. |
| 11 | Version Control Strategy | Complete | [VERSION_CONTROL.md](VERSION_CONTROL.md) — .gitignore, sprint branches, Conventional Commits, merge commits (--no-ff), per-sprint tags. D-81 through D-86. |
| 12 | Functional Specs | Complete | 21 of 21 specs approved per [DESIGN_WORKSHOP.md](DESIGN_WORKSHOP.md) grouping — all 43 objects across all waves |
| 13 | Information Architecture | Complete | [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) — revised side nav (23 entries), 7 user journeys, 30+ cross-page links, landing page (WFL-001), discoverability audit, wave-gating (hidden-until-built). D-288 through D-307. |
| 14 | Theme Build | Complete | [THEME.md](THEME.md) — Warm Charcoal brand palette (`#3D3A38`), dark ShellBar, 0 border radius, 28 CSS custom property overrides, single-file strategy. Amends D-60. D-308 through D-313. |
| 15 | Build Plan | Complete | [BUILD_PLAN.md](BUILD_PLAN.md) — 32 prompts across 10 sprints, build-phase CLAUDE.md, scaffold prompt, sprint checklists, cross-sprint integration contracts. All 43 FRICEW objects covered. |

---

## Step Details

### Step 1: Domain Validation

**Purpose:** Cross-reference the churning research (`research/churning-in-canada.md`) against the Problem Statement + Vision to identify gaps, missing concepts, and areas for improvement.
**Deliverable:** Gap analysis document. Amendments to PSV where needed (new decisions logged).
**Inputs:** research/churning-in-canada.md, PROBLEM_STATEMENT_AND_VISION.md, DECISIONS_LOG.md

### Step 2: Aggregator Spike *(Complete)*

**Purpose:** Validate the automation foundation before designing around it.
**Key Questions (answered):**

- Plaid cannot reliably pull from CIBC (4% success) or Amex (daily re-auth). TD/Scotia marginal (60%).
- SimpleFIN/MX has direct API partnerships with CIBC (Aug 2022) and Amex (Nov 2024). TD via screen scraping. Scotia unreliable on all aggregators.
- Transaction data from SimpleFIN is sparse (raw bank descriptions, no categories, no MCC). In-house categorization required.
- No aggregator can distinguish supplementary card transactions (Amex is the partial exception via separate logins).
- SimpleFIN: $15/year, free sandbox. Plaid: $5-30/month with access gating.

**Gate outcome:** GO WITH CAVEATS — SimpleFIN as V1 provider, Scotia via CSV, in-house categorization, provider-abstracted architecture. Decisions D-30 through D-34 logged. OI-05 closed.
**Research:** `research/plaid-research.md`, `research/simplefin-research.md`

### Step 3: Business Architecture

**Purpose:** Decompose the full system into numbered FRICEW objects.
**Deliverable:** One-page catalog - one table per FRICEW type, one-liner per object, unique IDs.
**Inputs:** Problem Statement + Vision, Original Spec (reference)

### Step 4: Prioritization & Phasing

**Purpose:** Group FRICEW objects into build waves and define MVP scope.
**Deliverable:** Wave plan showing which objects ship in which order.
**Replaces:** Standalone project management document.

### Step 5: Data Model Design

**Purpose:** Define the backbone that everything plugs into.
**Deliverable:** Entity definitions, relationships, master vs transactional data classification.
**Informed by:** Aggregator spike results (SimpleFIN data schema, CSV import needs), FRICEW catalog (what entities are needed).

### Step 6: Tech Stack Decision

**Purpose:** Lock in language, framework, DB, and libraries before functional design.
**Deliverable:** Stack selection with rationale. Includes deployment approach (lightweight, not a standalone document).
**Informed by:** Aggregator spike (SimpleFIN API — no official SDKs, simple REST; CSV parsing needs), data model (DB requirements).
**Also in this step:** Define Claude Code subagent personas for the build phase (PM agent, UX specialist, test captain, etc.) as part of the development workflow setup.

### Step 7: Design Workshop Setup

**Purpose:** Agree on the methodology for writing functional specs before running the workshops. Prevents ad-hoc spec writing and ensures consistency across all FRICEW objects.
**Deliverable:**

- **Workshop format** — How Claude interviews Sandro per FRICEW object (structured Q&A flow, session cadence)
- **Lean spec template** — Standardized sections so every spec is consistent and nothing gets missed
- **Definition of done** — What a spec needs before it moves to "Approved"
- **Open item resolution** — How OI-01 through OI-07 (excluding closed OI-05, OI-08) get resolved during spec workshops
- **Grouping strategy** — When to combine related FRICEW objects into one spec vs. write standalone

**Informed by:** FRICEW catalog (Step 3), wave plan (Step 4), tech stack (Step 6)

### Step 8: Design System

**Purpose:** Define the visual language so the app has a cohesive, intentional look.
**Deliverable:** Theme, colours, typography, component patterns, layout standards, UX conventions.
**Informed by:** Tech stack (Step 6) — SAPUI5 component library, Fiori design guidelines.

### Step 9: Technical Standards

**Purpose:** Formalize coding conventions and patterns so all personas follow consistent rules from Sprint 1. Turns the high-level Enbridge conventions (TECH_STACK.md §7) into enforceable standards.
**Deliverable:** TECHNICAL_STANDARDS.md covering:

- **CDS conventions** — Entity naming, association patterns, annotation standards, enum vs config table enforcement
- **TypeScript standards** — Strict mode settings, `tsconfig.json`, type patterns for CDS entities
- **CAP handler patterns** — Facade/Service/Validator formalized with TypeScript interfaces, `wrapHandler` contract, `cds.spawn()` usage
- **SAPUI5 conventions** — Controller patterns, view structure, binding conventions, custom control patterns (VizFrame/ApexCharts embedding)
- **ESLint configuration** — Rules, plugins, severity levels
- **Logging standards** — Log levels, structured format, what to log at each level, correlation IDs
- **Error handling** — `req.error()` vs `req.reject()` patterns, i18n message conventions, HTTP status codes
- **i18n enforcement** — Three-tier naming conventions formalized with examples
- **Code review checklists** — Per-persona checklists for the sprint checkpoint meeting

**Informed by:** Tech stack (Step 6), Enbridge conventions, design system (Step 8). Resolves OI-07 (encryption approach).

### Step 10: Test Strategy

**Purpose:** Define how each object gets validated and how test data is managed.
**Deliverable:** Testing standards, test data approach, unit/integration/functional test boundaries, per-object test expectations.
**Informed by:** Technical standards (Step 9) — coding patterns inform test patterns.

### Step 11: Version Control Strategy

**Purpose:** Define Git conventions before the first sprint so all agents follow consistent branching, commit, and merge patterns from day one.
**Deliverable:** VERSION_CONTROL.md covering:

- **Repository setup** — .gitignore rules for CAP + Node + TypeScript stack
- **Branching strategy** — Sprint branches off `main`, one per sprint, merged at checkpoint
- **Branch naming** — `sprint/W{wave}-S{sprint}` matching sprint plan identifiers
- **Commit conventions** — Conventional Commits with module scopes and FRICEW traceability
- **Merge strategy** — Merge commits (`--no-ff`) for visible sprint boundaries
- **Tagging** — Per-sprint annotated tags (`v{wave}.{sprint}`), `v1.0.0` at go-live

**Informed by:** Tech stack (Step 6) — project structure informs .gitignore. Project management (Step 6) — sprint plan informs branching and tagging. Test strategy (Step 10) — test artifacts inform .gitignore.

### Step 12: Functional Specs

**Purpose:** Detail all 43 FRICEW objects — UI behaviour, business rules, edge cases.
**Deliverable:** 21 specs per [DESIGN_WORKSHOP.md](DESIGN_WORKSHOP.md) grouping, covering all objects across all waves.
**Informed by:** Design system (Step 8), technical standards (Step 9), test strategy (Step 10), version control (Step 11). Specs reference established patterns and conventions.
**Resolves:** Remaining open items (OI-01 through OI-04, OI-06) per mapping in [DESIGN_WORKSHOP.md](DESIGN_WORKSHOP.md) §7.

### Step 13: Information Architecture

**Purpose:** With all 21 specs complete and 23+ screens fully detailed, validate the navigation structure and ensure every page is discoverable through intuitive paths — not just memorized menu positions. This is a UX-lens review that synthesizes everything the specs describe into a coherent navigational experience.
**Deliverable:** INFORMATION_ARCHITECTURE.md covering:

- **Sitemap validation** — Revisit the 5-group side nav (D-57, D-58) against the actual page content defined in specs. Confirm groupings still make sense, reorder or regroup if needed.
- **Task flow mapping** — Trace key user journeys (weekly review cycle, new card onboarding, budget check, historical backfill, goal tracking) across pages. Identify dead ends, unnecessary hops, and missing shortcuts.
- **Cross-page navigation** — Define contextual links and inline navigation patterns (e.g., clicking a card name on the Churnboard navigates to My Cards detail, clicking a merchant in Budget Dashboard navigates to filtered transaction list). Ensure pages are interconnected, not siloed behind the sidebar.
- **Entry points** — Define the landing page / default view on app launch, and what a returning user sees during their typical weekly session.
- **Discoverability audit** — Review each page and confirm it can be found through both the sidebar nav and contextual navigation from related pages. Flag any features that are only reachable via one path.
- **Wave-gating UX** — Refine how disabled W2/W3 nav items appear. Determine whether they should be visible-but-disabled, hidden, or shown with a "coming soon" indicator.

**Informed by:** All 21 functional specs (Step 12), design system (Step 8) — particularly §4 Navigation, and the FRICEW wave plan (Step 4).

### Step 14: Theme Build

**Purpose:** Define a custom visual identity on top of the `sap_horizon` base theme. Rather than rebuilding a theme from scratch, this step specifies targeted overrides — the same kind of work done in SAP Theme Designer — to give the app its own look and feel while retaining Horizon's component library compatibility.
**Deliverable:** THEME.md covering:

- **Color palette** — Custom primary and secondary colors, replacing Horizon's default blue accent. Mapped to SAPUI5 theming parameters (`sapBrandColor`, `sapHighlightColor`, `sapActiveColor`, etc.).
- **Border radius** — 0 border radius on buttons, inputs, cards, and other interactive controls. Sharp edges throughout.
- **Component overrides** — Any other targeted tweaks to Horizon defaults (e.g., button styles, header bar treatment, card shadows, table row density adjustments).
- **Override strategy** — How overrides are applied: custom CSS stylesheet loaded after Horizon, using SAPUI5 CSS custom properties. No theme package build tooling needed for V1.
- **Color mapping table** — Each SAPUI5 theming parameter being overridden, its Horizon default, and the new value. Single source of truth for the custom theme.

**Amends:** D-60 (currently "standard Horizon semantic colors only, no custom accent") — this step replaces that constraint with a defined custom palette.
**Informed by:** Design system (Step 8), information architecture (Step 13) — IA may surface needs for visual differentiation between nav groups or page types.

### Step 15: Build Plan

**Purpose:** Translate the entire design corpus into an actionable build plan that Sandro can execute by pasting ordered prompts into Claude Code. This is the bridge between design and code — Sandro shouldn't have to figure out what to ask. The plan hands him the script.
**Deliverable:** BUILD_PLAN.md covering:

- **CLAUDE.md build-phase update** — Enhanced project instructions loaded automatically on every Claude Code session. Encodes folder structure, handler patterns, naming conventions, test expectations, and references to design docs. Claude Code reads this as baseline context so prompts can stay concise.
- **Prompt playbook** — The ordered sequence of prompts Sandro pastes into Claude Code, grouped by sprint. Each prompt is a self-contained instruction that references the relevant spec, data model section, and standards. Format per prompt: the prompt text, what to review after execution, and a pass/fail checklist before moving on.
- **Scaffold prompt** — The first prompt in the playbook: initial project setup (`cds init`, `package.json`, `tsconfig.json`, ESLint config, folder structure, `.gitignore`, dev dependencies, CDS schema stubs). Defines exactly what the first commit contains before any business logic.
- **Sprint checklists** — Per-sprint definition of done that maps to the code review checklists (D-73) and test coverage targets (D-79). What must pass before a sprint branch merges to `main`.
- **Cross-sprint integration points** — Where later sprints depend on earlier sprint outputs (e.g., W2 ENH engines depend on W1 entity definitions). Explicit handoff contracts between sprints.

**Sandro's workflow during the build:** paste prompt → review output → approve or ask for fixes → paste next prompt. Sprint checkpoint = `--no-ff` merge to main + annotated tag.

**Informed by:** All preceding steps — functional specs (Step 12) define what to build, technical standards (Step 9) define how, test strategy (Step 10) defines validation, version control (Step 11) defines branching, project management (Step 6) defines sprint structure, and personas (Step 6) define who.

---

## Dependencies

```
Step 0 (PSV) ──→ Step 1 (Domain) ──→ Step 2 (Aggregator) ──→ Step 3 (FRICEW) ──→ Step 4 (Waves)
                                          │                    │
                                          ▼                    ▼
                                     Step 6 (Tech) ◄── Step 5 (Data Model)
                                          │
                                          ▼
                                     Step 7 (Workshop Setup)
                                          │
                                          ▼
                                     Step 8 (Design System)
                                          │
                                          ▼
                                     Step 9 (Tech Standards)
                                          │
                                          ▼
                                     Step 10 (Test Strategy)
                                          │
                                          ▼
                                     Step 11 (Version Control)
                                          │
                                          ▼
                                     Step 12 (Func Specs)
                                          │
                                          ▼
                                     Step 13 (Info Architecture)
                                          │
                                          ▼
                                     Step 14 (Theme Build)
                                          │
                                          ▼
                                     Step 15 (Build Plan)
                                          │
                                          ▼
                                    FIRST LINE OF CODE
```

---

*No application code is written until all 15 steps are complete and approved.*
