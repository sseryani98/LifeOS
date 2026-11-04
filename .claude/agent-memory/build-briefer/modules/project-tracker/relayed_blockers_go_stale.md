---
name: relayed-blockers-go-stale
description: Project Tracker - a blocker relayed from an earlier briefer run may already be resolved by a spec amendment; check Change History and DECISIONS_LOG tail first
metadata:
  type: feedback
---

When the prompt relays an earlier run's blockers ("answer these and continue"), read the spec's Change History last row and the DECISIONS_LOG tail before re-raising them. SPEC-03's three blockers were closed by D-249/D-250/D-251 (2026-11-04) in the spec itself.

**Why:** the spec header and §3/§4 were re-baselined in place; BUILD_PLAN §? row for SPEC-03 (4 Defects) and TEST_STRATEGY §11.1 (Four Defects) were NOT updated, so stale copies elsewhere can mislead.

**How to apply:** trust the spec over BUILD_PLAN/TEST_STRATEGY counts; note the stale copies in the brief, do not block on them. Existing test fixtures (test/integration/tracker/data/migrationStories.ts) carry July values (0a9804f) and are SPEC-02 test rows, not the migration's data.
