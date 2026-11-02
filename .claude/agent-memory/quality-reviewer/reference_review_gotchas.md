---
name: review-gotchas
description: Mechanical traps that produce wrong citations or wrong coverage conclusions when reviewing Project Tracker specs
metadata:
  type: reference
---

- `cat -n a b` numbers lines continuously across files. Print one file per `cat -n`, or confirm anchors with `grep -n "  it("`, before citing a line. (2026-11-02: readPath.test.ts read after projectView.test.ts was offset by 175.)
- `*Facade.ts` is excluded from coverage, so "100% on trackerService" hides untested facade branches. Example: `_handleReadMilestones` / `_handleReadProjectView` wrap a single-object result (a by-key GET) into an array, and no spec does a by-key read.
- The unit tier never loads `@sap/cds`, so `SELECT` is not a global there. A mutation that drops a "skip the count" guard in `trackerService` crashes with ReferenceError rather than failing an assertion. It is still caught, so it is not a finding by itself.
- Guards that judge only the payload on UPDATE are a known defect pattern here. Initiative and Milestone merge the stored row; Defect does not, and TestRun has no UPDATE guard. Check each new entity guard for both.
