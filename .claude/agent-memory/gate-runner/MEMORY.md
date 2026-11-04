# Gate Runner Memory

## Test runs

- [Jest JSON run has no coverage table](jest_json_no_coverage_table.md) — both modules; derive coverage from coverage/lcov.info; none on a red run; strip ANSI before grepping
- Exit code after a pipe is the last command's: `npm test | sed ...; echo $?` reports sed (0) even when Jest fails. Redirect to a file first, then read `$?`, or use `${PIPESTATUS[0]}`.
