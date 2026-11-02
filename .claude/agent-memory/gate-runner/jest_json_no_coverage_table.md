---
name: jest-json-no-coverage-table
description: Project Tracker npm test runs jest --json, so stdout has no coverage table; compute it from coverage/lcov.info
metadata:
  type: reference
---

`Project Tracker/package.json` `test` is `jest --json --outputFile=coverage/test-results.json --coverage`.
The `--json` flag suppresses Jest's printed coverage table, and `coverage-summary.json` is not written
(only `lcov.info`, `clover.xml`, `coverage-final.json`, `lcov-report/`).

**Why:** the `coverageTable` field must be verbatim; without a printed table it has to be derived.

**How to apply:** after `npm test`, parse `coverage/lcov.info` (LF/LH, BRF/BRH per SF record) for
totals and per-file gaps, and say in the report that the table was derived from lcov. Failing
assertions appear in stdout as `  ● <describe> › <test>` blocks; the output is large, so save it
and grep for `●`, `FAIL`, `Tests:`.
