# AGENTS.md

Operational instructions for AI coding/design agents working in this repository.

## 1) Project Snapshot

- Project: Financial Planner (personal system for Canadian credit card churning + budgeting).
- Primary user: Sandro (solo user).
- Current phase: Design only.
- Hard constraint: Do not write application code until design phase is complete and approved.

## 2) Source of Truth and Read Order

Read these first, in order:

1. `CLAUDE.md`
2. `design/PROBLEM_STATEMENT_AND_VISION.md`
3. `design/DESIGN_PHASE_TIMELINE.md`
4. `design/user-profile/SANDRO.md`
5. `design/user-profile/DECISIONS_LOG.md`

Use `design/reference/ORIGINAL_SPEC_2024.md` only as historical reference input, not governing truth.

## 3) Scope Rules

- You are working on design artifacts, not implementation.
- Every recommendation or document update must trace back to:
  - A problem in `design/PROBLEM_STATEMENT_AND_VISION.md`, or
  - A logged decision in `design/user-profile/DECISIONS_LOG.md`, or
  - A clear gap explicitly identified by the user.
- Avoid adding features or business rules that are not discussed and documented.
- If information is missing, ask focused questions (one topic at a time).

## 4) Document Governance

Design docs use status-driven edit rules:

- Evolving docs: `Draft`, `Active`, `In Review`, `Approved`
  - Must include a Change History table as section 1.
  - Any edit must add a new Change History row: `| Date | Author | Description |`.
- Frozen docs: `Final`, `Archived`
  - Do not edit unless explicitly approved by Sandro.

Versioning exemption:

- `CLAUDE.md` and `design/user-profile/SANDRO.md` are config/profile docs and do not require change-history updates.

## 5) Design and Communication Standards

- Keep a single source of truth per concept; reference instead of duplicating.
- Prefer structured outputs (tables, concise sections, IDs) over long narrative text.
- When giving a rundown, go one point at a time; do not deliver dense wall-of-text responses.
- Use SAP FRICEW terminology and object IDs when decomposing design work:
  - `FRM-###`, `RPT-###`, `INT-###`, `CNV-###`, `ENH-###`, `WFL-###`
- Challenge weak assumptions early; identify gaps clearly.
- Stay direct and concise; avoid filler.

## 6) Domain/Business Conventions

- Geography and domain: Canada, credit card churning.
- Currency: CAD.
- Budget cadence: monthly, no rollover.
- Platform target: desktop-first web app (no mobile optimization in V1).
- Deployment/user model for V1: single-user local deployment, no auth/multi-tenancy.
- Core architecture decisions are logged in `design/user-profile/DECISIONS_LOG.md` and must be respected.

## 7) Editing Protocol for Agents

Before editing:

1. Confirm target document status allows edits.
2. Confirm whether this is a design deliverable (requires change-history entry) or an exempt config/profile file.

When editing:

1. Make minimal, scoped changes.
2. Preserve existing structure and IDs.
3. Add/update links instead of copying the same content to multiple docs.
4. Update Change History for evolving design docs.

After editing:

1. Summarize what changed.
2. List assumptions or unresolved items.
3. Flag any needed follow-up decision for Sandro.

## 8) Out-of-Bounds Work (Until Approved)

- No backend/frontend code, DB schema implementation, CI/CD setup, or runtime environment setup.
- No speculative technical deep dives that bypass the design timeline gates.
- No edits to frozen documents without explicit approval.

## 9) Practical Workflow

- Align work to the current step in `design/DESIGN_PHASE_TIMELINE.md`.
- If a task spans multiple steps, split output by step and identify dependencies.
- If a proposal changes prior decisions, add a new decision entry instead of silently overriding old rationale.
