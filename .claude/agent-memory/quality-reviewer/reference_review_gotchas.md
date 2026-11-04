---
name: review-gotchas
description: Mechanical traps that produce wrong citations or wrong coverage conclusions when reviewing Project Tracker specs
metadata:
  type: reference
---

- `cat -n a b` numbers lines continuously across files. Print one file per `cat -n`, or confirm anchors with `grep -n "  it("`, before citing a line. (2026-11-02: readPath.test.ts read after projectView.test.ts was offset by 175.)
- `*Facade.ts` is excluded from coverage, so "100% on trackerService" hides untested facade branches. Example: `_handleReadMilestones` / `_handleReadProjectView` wrap a single-object result (a by-key GET) into an array, and no spec does a by-key read.
- The unit tier never loads `@sap/cds`, so `SELECT` is not a global there. A mutation that drops a "skip the count" guard in `trackerService` crashes with ReferenceError rather than failing an assertion. It is still caught, so it is not a finding by itself.
- PT has no app/, so `lint:i18n` scans 0 files and dead `messages.properties` keys go unchecked. Loop each key through `grep -rF` over srv/ mcp/ test/ (2026-11-03: all live, but it is the only check).
- Test-support headers that claim "no suite inserts/clears X" drift when a sibling helper starts mutating X. Grep `INSERT.into|DELETE.from` over test/ (2026-11-03: seedWorld.ts TABLE comment vs libraryAccess.ts).
- Annotation hunts: `@cap-js/db-service` `fill-in-keys.js` fills a missing cuid `ID` on a plain `INSERT.into(X).entries(rows)` (skipped only for `.rows`/`.values`), so `randomUUID()` for a row nobody else references is Redundant. A key another row's FK needs (Task ID → Subtask.task_ID over an Association, which gets no deep insert) is Justified. Fast probe: scratchpad CAP project, sqlite `:memory:`, `NODE_PATH="C:/Projects/Life OS/node_modules" node probe.js`, with a control row.
- Row types in `mcp/verbs/shared/types.ts` get fields made optional (`requiresHuman?`, `driver?`) so old unit fixtures still compile, even though the schema says `not null` and the gateway always selects them. On a guard flag that is fail-open. Diff `types.ts` against `db/schema.cds` and the fixture file. (2026-11-03, SPEC-02.)
- Specs carry structural mandates you can cite. SPEC-02 §6 OI-05 says the blocking "predicate is named rather than inlined", and §4 BR-30 fixes guard order. Grep the spec's BR and OI lines before arguing duplication from taste.
- Duplication review: srv/ and mcp/ guard the same rules under twin constants (`HANDLER_KEYS.X` and `VERB_KEYS.X`, same string). Grep the key *value* across both when a diff changes a srv guard. A verb pre-check outside the diff can turn redundant that way; 2026-11-03 SPEC-02 made `planSprint._assertStoryIdsFree` duplicate `checkMilestoneWrite`.
- The `code-review` skill runs forked and has StructuredOutput in its toolset, so it can submit its own findings there and hand the parent only "Skill execution completed" with no text. In that case the findings cannot be recovered, so return `[]` and do not reconstruct them yourself. (2026-11-03, SPEC-02 code-quality run.)
- Guards that judge only the payload on UPDATE are a known defect pattern here. Initiative and Milestone merge the stored row; Defect does not, and TestRun has no UPDATE guard. Check each new entity guard for both.
