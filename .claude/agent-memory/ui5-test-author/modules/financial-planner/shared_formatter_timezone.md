---
name: shared-formatter-timezone
description: FP app/shared/util/formatter.formatDate shifts date-only ISO strings back a day in the host time zone (America/Toronto); test with a local timestamp, report as a defect
metadata:
  type: project
---

Measured 2026-11-04 on Financial Planner: `formatter.formatDate("2026-02-21")` returns "Feb 20, 2026" on this host
(America/Toronto). `new Date("YYYY-MM-DD")` parses as UTC midnight, then `toLocaleDateString` renders it in local
time. The headless runner inherits the host time zone.

**Why:** a test using the JSDoc's own example ("Feb 21, 2026") goes red on this machine. Asserting "Feb 20" would pin
the defect as correct.

**How to apply:** test `formatDate` with a local timestamp (`2026-02-21T12:00:00`, no `Z`). Report the date-only
shift as a finding until source fixes it (it was not in DEFECT_LOG as of 2026-11-04; `formatDate` had no callers then).
