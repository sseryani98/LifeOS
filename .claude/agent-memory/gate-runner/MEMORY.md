# Gate Runner Memory

## Test runs

- [Jest JSON run has no coverage table](jest_json_no_coverage_table.md) — both modules; derive coverage from coverage/lcov.info; none on a red run; strip ANSI before grepping
- `test:ui5` with `--row "<glob>:…"` still prints the whole-app nyc table (every file, `All files` row); the row arg only adds the `UI5 coverage row …` line. Paste the full table, not the row.
- A red `test:ui5` prints only the test name (`…🐞 28/29`) and `undefined` on stdout. The expected/actual pair lives in `<module>/report-ui5/job.js` (search the test name; `logs[].expected`/`actual`/`source`). Quote that for `detail`.
- `test:ui5` can print `listen EADDRINUSE :::4104` when a stale server holds the port; the tests then run against whatever owns it. Note it in the report; it is environmental, not a test result.
- Exit code after a pipe is the last command's: `npm test | sed ...; echo $?` reports sed (0) even when Jest fails. Redirect to a file first, then read `$?`, or use `${PIPESTATUS[0]}`.
