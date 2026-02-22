# Project Management

**Document ID:** PM-001
**Version:** 1.0
**Date:** 2026-02-13
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-13 | Sandro & Claude | Initial creation — sprint methodology, persona operations, sprint plan, meeting format. |
| 2026-02-20 | Claude | Status → Approved. Step 12 complete — all 21 specs approved. |

---

## 2. Methodology

Agile/Scrum adapted for a solo developer + AI builder workflow. The Project Manager persona facilitates all ceremonies and tracks progress.

| Element | Approach |
|---------|----------|
| **Sprint duration** | 1 week |
| **Backlog** | 43 FRICEW objects → ~30–35 stories (grouped where tightly coupled) |
| **Sprint planning** | PM selects stories from wave dependency order |
| **Sprint review** | Validate completed objects against functional specs |
| **Sprint retrospective** | Multi-persona checkpoint meeting (see §5) |
| **Tracking** | Markdown-based sprint board + defect log in `project/` |
| **Definition of done** | See §7 |

---

## 3. Sprint Plan

All 4 waves produce 10 sprints. Waves define build order (per [BUSINESS_ARCHITECTURE.md §9](BUSINESS_ARCHITECTURE.md)). Sprints slice waves by dependency layers.

### Wave 1 — Core Pipeline (23 objects → 5 sprints)

| Sprint | Focus | Stories | Sprint Goal |
|--------|-------|---------|-------------|
| **W1-S1** | Foundation & seed data | CNV-002, CNV-003, FRM-009 | Reference data seeded, config tables editable via SM30-style CRUD |
| **W1-S2** | Ingestion pipeline | ENH-008, INT-001, INT-002, FRM-003, FRM-010 | Transactions flow from SimpleFIN and CSV into the system. Connection health visible. |
| **W1-S3** | Transaction processing | ENH-001, ENH-009, FRM-001, CNV-001 | Transactions categorized, splits supported, historical data backfilled, weekly review surface functional |
| **W1-S4** | Computation engines | ENH-003, ENH-006, ENH-007, FRM-007 | Bonus progress tracked, points balances computed, budget engine running |
| **W1-S5** | Cards, dashboards & workflows | FRM-004, FRM-006, RPT-001 (partial), RPT-002 (partial), WFL-001, WFL-002, WFL-004 | My Cards browsable, card onboarding works, both dashboards show Wave 1 sections, weekly session workflow end-to-end |

**Wave 1 checkpoint:** Full weekly session testable — auto-import → categorize → review → churning basics + budget status.

### Wave 2 — Churning Depth + Goals (8 objects → 2 sprints)

| Sprint | Focus | Stories | Sprint Goal |
|--------|-------|---------|-------------|
| **W2-S1** | Churning depth | ENH-002, ENH-004, ENH-005, FRM-002, RPT-001 (complete), RPT-002 (complete) | Card recommendations, eligibility, profitability. Both dashboards feature-complete. |
| **W2-S2** | Goals & reports | FRM-008, RPT-004, RPT-006, RPT-011 | Goals management, trophy case, recommendation matrix, goal progress report |

**Wave 2 checkpoint:** RPT-001 and RPT-002 feature-complete. Card recommendations and eligibility visible.

### Wave 3 — Analytics + Financial Picture (9 objects → 2 sprints)

| Sprint | Focus | Stories | Sprint Goal |
|--------|-------|---------|-------------|
| **W3-S1** | Analytics & financial picture | FRM-005, FRM-011, RPT-003, RPT-005, RPT-007 | Market cards browsable, financial picture entry, net worth dashboard, card analytics, spending trends |
| **W3-S2** | Remaining reports | RPT-008, RPT-009, RPT-010, RPT-012 | Perk tracker, annual summary, points dashboard, income vs expenses trend |

**Wave 3 checkpoint:** All analytical reports available. Financial picture complete.

### Wave 4 — Market Intelligence (3 objects → 1 sprint)

| Sprint | Focus | Stories | Sprint Goal |
|--------|-------|---------|-------------|
| **W4-S1** | Market intelligence | CNV-004, INT-003, WFL-003 | Market card database populated, offer scraping operational with human approval gate |

**Wave 4 checkpoint:** Full system operational. All 43 FRICEW objects delivered.

---

## 4. Persona Operational Roles

Ten personas defined in [TECH_STACK.md §9](TECH_STACK.md). This section defines how they operate during sprints.

### Build Personas (produce work during the sprint)

| Persona | Sprint Cadence |
|---------|---------------|
| **Backend Developer** | Active every sprint. Writes CDS models, service handlers, ENH engines. |
| **Frontend Developer** | Active every sprint. Writes Fiori Elements annotations, freestyle views, dashboards. |
| **Integration Specialist** | Primary in W1-S2 (ingestion pipeline). Active whenever INT-001/002/003, ENH-008, or scheduling is touched. |
| **Data Migration Specialist** | Primary in W1-S1 (CNV-002, CNV-003), W1-S3 (CNV-001), W4-S1 (CNV-004). Available for data quality issues in other sprints. |
| **Test Captain** | Active every sprint. Writes tests alongside or immediately after feature delivery. |

### Review Personas (audit work during sprint checkpoint)

| Persona | Review Focus |
|---------|-------------|
| **Security Reviewer** | Audits new code for vulnerabilities, encryption correctness, credential handling. |
| **UX/Design Reviewer** | Checks visual consistency, design system adherence, dashboard usability. |
| **Documentation Guardian** | Validates that design docs, decisions log, and cross-references are current. No duplication introduced. |

### Management Personas (orchestrate across sprints)

| Persona | Ongoing Role |
|---------|-------------|
| **Project Manager** | Facilitates all ceremonies. Tracks sprint board. Flags blockers, scope creep, dependency issues. |
| **Defect Tracker** | Maintains defect log. Logs new defects, tracks fixes, flags regressions. Carries open defects across sprints. |

---

## 5. Sprint Checkpoint Meeting

At the end of each sprint, all 10 personas convene in a structured meeting. The output is a sprint report document stored in `project/sprints/`.

### Phase 1: Sprint Review — *"What did we deliver?"*

PM opens with sprint goal status, then build personas report:

| Persona | Reports On |
|---------|-----------|
| **Project Manager** | Sprint goal met? Stories completed vs planned? Blockers encountered? |
| **Backend Developer** | Services delivered, technical debt introduced, patterns established |
| **Frontend Developer** | UI apps delivered, FE vs freestyle split, open UI issues |
| **Integration Specialist** | External connection status, sync reliability, parsing edge cases |
| **Data Migration Specialist** | Migration progress, data quality issues, reconciliation results |
| **Test Captain** | Test coverage, pass/fail rates, untested edge cases, gaps |

### Phase 2: Cross-cutting Review — *"What did we miss?"*

Review personas audit the sprint's output:

| Persona | Audits For |
|---------|-----------|
| **Security Reviewer** | Vulnerabilities in new code, credential handling, data exposure in OData responses or logs |
| **UX/Design Reviewer** | Visual consistency, design system violations, dashboard usability |
| **Documentation Guardian** | Missing decisions, stale cross-references, duplication, change history gaps |
| **Defect Tracker** | New defects found, defects fixed this sprint, open defect count, regressions |

### Phase 3: Retrospective — *"How do we improve?"*

- What went well
- What didn't
- Action items (feed into next sprint planning)
- Process changes (e.g., "Backend Developer should run Security Reviewer checklist before marking stories done")

### Phase 4: Next Sprint Preview

PM outlines the next sprint's goal and candidate stories. Flags any dependency risks or open items that could block progress.

### Sprint Report Template

Each meeting produces a report at `project/sprints/{wave}-{sprint}-report.md`:

```markdown
# Sprint {Wave}-{Sprint} Report

**Sprint Goal:** {goal}
**Status:** {Met / Partially Met / Not Met}
**Date:** {date}

## Stories

| Story | Status | Notes |
|-------|--------|-------|
| ... | Complete / Partial / Blocked | ... |

## Phase 1: Sprint Review
{Build persona reports}

## Phase 2: Cross-cutting Review
{Review persona findings}

## Phase 3: Retrospective

### What went well
- ...

### What didn't
- ...

### Action items
| # | Action | Owner | Target Sprint |
|---|--------|-------|---------------|
| ... | ... | ... | ... |

## Phase 4: Next Sprint Preview
**Next sprint goal:** {goal}
**Candidate stories:** {list}
**Dependency risks:** {if any}
```

---

## 6. Tracking Artifacts

### Sprint Board

**Location:** `project/SPRINT_BOARD.md`

Kanban-style tracking of all FRICEW objects across sprints:

```markdown
## Current Sprint: {Wave}-{Sprint}
**Sprint Goal:** {goal}

### Backlog
- [ ] {FRICEW-ID} — {Name}

### In Progress
- [ ] {FRICEW-ID} — {Name} — @{persona}

### Review
- [ ] {FRICEW-ID} — {Name}

### Done
- [x] {FRICEW-ID} — {Name}
```

### Defect Log

**Location:** `project/DEFECT_LOG.md`

Running log maintained by the Defect Tracker persona:

```markdown
| # | Severity | Summary | Found In | FRICEW | Status | Fixed In | Root Cause |
|---|----------|---------|----------|--------|--------|----------|------------|
| D-001 | High | ... | W1-S2 | INT-001 | Open | — | — |
```

Severities: **Critical** (blocks sprint), **High** (must fix next sprint), **Medium** (fix within wave), **Low** (backlog).

---

## 7. Definition of Done

A FRICEW object is **Done** when:

| Criterion | Validated By |
|-----------|-------------|
| Functional spec requirements are met | Project Manager |
| All unit tests pass | Test Captain |
| OData integration tests pass (if applicable) | Test Captain |
| No Critical or High severity defects open against it | Defect Tracker |
| No security vulnerabilities | Security Reviewer |
| UI matches design system | UX/Design Reviewer |
| Design docs are current (decisions logged, cross-references valid) | Documentation Guardian |

A **sprint** is Done when all stories in the sprint meet the above criteria.

A **wave** is Done when all sprints in the wave are complete AND the wave's testable increment passes end-to-end validation.

---

## 8. File Structure

```
project/
├── SPRINT_BOARD.md              ← Current sprint status (Kanban)
├── DEFECT_LOG.md                ← Running defect log across all sprints
└── sprints/
    ├── W1-S1-report.md          ← Sprint checkpoint meeting output
    ├── W1-S2-report.md
    ├── ...
    └── W4-S1-report.md
```

---

*This document is the single source of truth for the Financial Planner project management methodology. Sprint content and progress are tracked in the `project/` folder. Persona definitions are in [TECH_STACK.md §9](TECH_STACK.md). The wave plan is in [BUSINESS_ARCHITECTURE.md §9](BUSINESS_ARCHITECTURE.md).*
