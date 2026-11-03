---
name: jest-json-no-coverage-table
description: Both modules' npm test runs jest --json, so stdout has no coverage table; derive it from coverage/lcov.info, and expect none at all on a red run
metadata:
  type: reference
---

Financial Planner and Project Tracker both run `jest --json --outputFile=... --coverage` as `test`.
The `--json` flag suppresses Jest's printed coverage table, and `coverage-summary.json` is not written
(only `lcov.info`, `clover.xml`, `coverage-final.json`, `lcov-report/`).

- npm skips `posttest` when `test` exits non-zero, so a red run leaves no table anywhere. Say "not
  printed" rather than inventing one.
- Failing assertions appear as `  ● <describe> › <test>` blocks, ANSI-coloured. Strip with
  `sed -e 's/\x1b\[[0-9;]*m//g'`, save the output, then grep for `●`, `FAIL`, `Tests:`, `threshold`.

**Why:** the `coverageTable` field must be verbatim; without a printed table it has to be derived.

**How to apply:** after `npm test`, parse `coverage/lcov.info` (LF/LH, BRF/BRH per SF record) for
totals and per-file gaps, and say in the report that the table was derived from lcov.
