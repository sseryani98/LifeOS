# Version Control Strategy

**Document ID:** VC-001
**Version:** 1.0
**Date:** 2026-02-16
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-16 | Sandro & Claude | Initial creation — Step 11 complete. D-81 through D-86 logged. |
| 2026-02-20 | Claude | Status → Approved. Step 12 complete — all 21 specs approved. |

---

## 2. Summary

| Area | Standard |
|------|----------|
| **Repository** | Local Git. Single repo. No remote for V1. |
| **Branching** | Sprint branches off `main`. One branch per sprint (10 total). |
| **Branch naming** | `sprint/W{wave}-S{sprint}` — e.g., `sprint/W1-S1` |
| **Commits** | Conventional Commits — `type(scope): description`. FRICEW IDs in body. |
| **Co-authorship** | `Co-Authored-By: Claude Code <noreply@anthropic.com>` on all agent commits |
| **Merge strategy** | Merge commit (`--no-ff`) at sprint checkpoint. Sprint boundary visible in graph. |
| **Tagging** | Per-sprint annotated tags — `v{wave}.{sprint}`. `v1.0.0` at go-live. |

---

## 3. Repository Setup

**Decision D-81.**

### 3.1 .gitignore

```gitignore
# Node
node_modules/

# CAP generated
gen/
@cds-models/
.cds-services.json

# Secrets
.env

# Runtime logs
logs/

# Test artifacts
coverage/
project/test-reports/

# TypeScript build cache
*.tsbuildinfo

# CAP local env overrides
default-env.json

# IDE
.vscode/

# OS
Thumbs.db
Desktop.ini
.DS_Store
```

### 3.2 What Stays Tracked

| Path | Why |
|------|-----|
| `package-lock.json` | Deterministic dependency installs |
| `db/seed/*.csv` | Seed data for CNV-002 — design artifact, not generated |
| `project/sprints/*.md` | Permanent sprint reports |
| `project/SPRINT_BOARD.md` | Sprint tracking |
| `project/DEFECT_LOG.md` | Defect tracking |
| `design/` | All design deliverables |
| `CLAUDE.md` | Project context |

---

## 4. Branching Strategy

**Decision D-82.**

### 4.1 Branch Model

Two branch types:

| Branch | Lifespan | Purpose |
|--------|----------|---------|
| `main` | Permanent | Stable. Only moves forward at sprint checkpoints after multi-persona review. |
| `sprint/W{n}-S{n}` | 1 week | Working branch for the active sprint. All agents commit here. Merged to `main` at sprint end. |

### 4.2 Sprint Branch Lifecycle

```
1. Sprint start    →  git checkout -b sprint/W1-S1 main
2. During sprint   →  All agents commit to sprint/W1-S1
3. Sprint checkpoint meeting (PM §5)
4. Merge to main   →  git checkout main
                       git merge --no-ff sprint/W1-S1
5. Tag             →  git tag -a v1.1 -m "Wave 1 Sprint 1 — Foundation & seed data"
6. Clean up        →  git branch -d sprint/W1-S1
7. Next sprint     →  git checkout -b sprint/W1-S2 main
```

### 4.3 Rules

| Rule | Details |
|------|---------|
| `main` is always stable | Never commit directly to `main` during a sprint |
| One active sprint branch at a time | No parallel sprints — solo developer |
| Merge only at checkpoint | Sprint branch merges to `main` after the sprint checkpoint meeting passes |
| Delete after merge | Sprint branches are short-lived — delete after successful merge |

---

## 5. Branch Naming

**Decision D-83.**

| Pattern | Example | Notes |
|---------|---------|-------|
| `sprint/W{wave}-S{sprint}` | `sprint/W1-S1` | Matches sprint IDs in [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) §3 |

The `sprint/` prefix groups working branches visually in `git branch --list`. Wave-Sprint IDs are the same identifiers used in the sprint board, sprint reports, and defect log — zero translation.

Full branch list over the project lifecycle:

```
main
sprint/W1-S1
sprint/W1-S2
sprint/W1-S3
sprint/W1-S4
sprint/W1-S5
sprint/W2-S1
sprint/W2-S2
sprint/W3-S1
sprint/W3-S2
sprint/W4-S1
```

Only `main` and the current sprint branch exist at any given time.

---

## 6. Commit Conventions

**Decision D-84.**

### 6.1 Message Format

Conventional Commits:

```
type(scope): short description

Optional body with details.
FRICEW ID reference if applicable.

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

### 6.2 Types

| Type | When |
|------|------|
| `feat` | New functionality (FRICEW object delivery) |
| `fix` | Bug fix |
| `refactor` | Code restructuring, no behavior change |
| `test` | Adding or updating tests |
| `docs` | Design docs, CLAUDE.md, decisions log |
| `chore` | Config, dependencies, .gitignore, ESLint |
| `seed` | Reference data seeding (CNV-002, CNV-003) |

### 6.3 Scopes

| Scope | Maps To |
|-------|---------|
| `transaction` | `srv/modules/transaction/`, TransactionService |
| `categorization` | `srv/modules/categorization/`, ENH-001 |
| `churning` | `srv/modules/churning/`, ENH-003/005/006 |
| `budget` | `srv/modules/budget/`, ENH-007 |
| `eligibility` | `srv/modules/eligibility/`, ENH-004 |
| `recommendation` | `srv/modules/recommendation/`, ENH-002 |
| `integration` | `srv/modules/integration/`, INT-001/002/003 |
| `admin` | AdminService, FRM-009/010 |
| `shared` | `srv/modules/shared/`, `app/shared/` |
| `db` | CDS models, seed data |
| `ui` | Frontend apps (when scope spans multiple apps) |
| `docs` | Design documents |
| `config` | Project config files |

### 6.4 Examples

```
feat(categorization): add merchant pattern matching engine

Implements ENH-001 two-pass categorization — exact match then fuzzy.
VendorCategoryStats updated on each correction.

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

```
test(churning): add bonus progress unit tests

Covers ENH-003 single-tranche, multi-tranche, and edge cases.
100% branch coverage on ChurningValidator.

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

```
fix(integration): handle SimpleFIN timeout on large accounts

INT-001 sync was failing silently when response exceeded 30s.
Added timeout config and retry with exponential backoff.

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

```
docs: complete SPEC-03 categorization engine workshop

Covers ENH-001, ENH-009. Resolves OI-01 (categorization taxonomy).
```

### 6.5 Co-Author Attribution

| Who Commits | Co-Author Trailer? |
|-------------|-------------------|
| Claude Code agent | Yes — `Co-Authored-By: Claude Code <noreply@anthropic.com>` |
| Sandro manually | No |

---

## 7. Merge Strategy

**Decision D-85.**

### 7.1 How Sprint Branches Merge

Merge commits with `--no-ff` (no fast-forward). Every sprint merge creates a visible node in the Git graph.

```bash
git checkout main
git merge --no-ff sprint/W1-S1 -m "merge: sprint W1-S1 — Foundation & seed data

Delivers: CNV-002, CNV-003, FRM-009"
```

### 7.2 Merge Commit Message Format

```
merge: sprint W{wave}-S{sprint} — {sprint goal}

Delivers: {FRICEW IDs completed this sprint}
```

### 7.3 Why Merge Commits

| Alternative | Why Not |
|-------------|---------|
| Squash | Loses individual commit granularity. 10-20+ commits per sprint across multiple agents would collapse into one. |
| Rebase | Linear history but sprint boundaries become invisible. The merge node is the sprint boundary marker. |
| Fast-forward | Same as rebase — no merge node, no visible sprint boundary. |

---

## 8. Tagging & Releases

**Decision D-86.**

### 8.1 Tag Scheme

| Event | Tag Format | Example |
|-------|-----------|---------|
| Sprint completion | `v{wave}.{sprint}` | `v1.1`, `v1.2`, `v2.1` |
| Go-live (all 43 objects) | `v1.0.0` | Final release after Wave 4 |

### 8.2 Tag Schedule

| Tag | Sprint | Milestone |
|-----|--------|-----------|
| `v1.1` | W1-S1 | Foundation & seed data |
| `v1.2` | W1-S2 | Ingestion pipeline |
| `v1.3` | W1-S3 | Transaction processing |
| `v1.4` | W1-S4 | Computation engines |
| `v1.5` | W1-S5 | Cards, dashboards & workflows |
| `v2.1` | W2-S1 | Churning depth |
| `v2.2` | W2-S2 | Goals & reports |
| `v3.1` | W3-S1 | Analytics & financial picture |
| `v3.2` | W3-S2 | Remaining reports |
| `v4.1` | W4-S1 | Market intelligence |
| `v1.0.0` | — | Go-live: all 43 FRICEW objects delivered |

### 8.3 Creating Tags

Annotated tags with the sprint goal and delivered FRICEW IDs:

```bash
git tag -a v1.1 -m "Wave 1 Sprint 1 — Foundation & seed data (CNV-002, CNV-003, FRM-009)"
```

Tags are created immediately after the merge commit, before starting the next sprint branch.

---

## 9. Git Workflow Summary

Complete flow for one sprint:

```
┌─ Sprint Start ─────────────────────────────────────────────┐
│                                                             │
│  git checkout -b sprint/W1-S1 main                         │
│                                                             │
├─ During Sprint ─────────────────────────────────────────────┤
│                                                             │
│  All agents commit to sprint/W1-S1                          │
│  feat(db): add reference data CDS models                   │
│  seed(admin): load issuer and network seed data             │
│  feat(admin): add SM30-style CRUD for config tables         │
│  test(admin): add AdminService integration tests            │
│  ...                                                        │
│                                                             │
├─ Sprint Checkpoint Meeting (PM §5) ─────────────────────────┤
│                                                             │
│  Multi-persona review passes                                │
│                                                             │
├─ Merge & Tag ───────────────────────────────────────────────┤
│                                                             │
│  git checkout main                                          │
│  git merge --no-ff sprint/W1-S1 -m "merge: sprint W1-S1…"  │
│  git tag -a v1.1 -m "Wave 1 Sprint 1 — Foundation…"        │
│  git branch -d sprint/W1-S1                                 │
│                                                             │
├─ Next Sprint ───────────────────────────────────────────────┤
│                                                             │
│  git checkout -b sprint/W1-S2 main                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Decisions Reference

Decisions made during version control strategy (Step 11):

| ID | Title | Summary |
|----|-------|---------|
| D-81 | Repository Setup | .gitignore for CAP + Node + TypeScript stack. Ignores gen/, @cds-models/, .env, logs/, coverage/, test-reports/, .vscode/. |
| D-82 | Branching Strategy | Sprint branches off `main`. One branch per sprint. `main` only moves at checkpoint. |
| D-83 | Branch Naming | `sprint/W{wave}-S{sprint}` — matches sprint IDs from PROJECT_MANAGEMENT.md. |
| D-84 | Commit Conventions | Conventional Commits — `type(scope): description`. FRICEW IDs in body. Co-Authored-By on agent commits. |
| D-85 | Merge Strategy | Merge commits (`--no-ff`). Sprint boundary visible as merge node. Individual commits preserved. |
| D-86 | Tagging & Releases | Per-sprint annotated tags — `v{wave}.{sprint}`. `v1.0.0` at go-live. |

---

*This document is the single source of truth for the Financial Planner version control strategy. References [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) (sprint plan, checkpoint meeting), [TECH_STACK.md](TECH_STACK.md) (project structure), and [Decisions Log](user-profile/DECISIONS_LOG.md).*
