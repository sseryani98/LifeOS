# Test-author memory

## CAP

- [CAP rejection shapes](cap_rejection_shapes.md) — cds 9.8.4: @mandatory = 400 ASSERT_MANDATORY + target; @assert.unique = 500 SQLITE_CONSTRAINT_UNIQUE; String(n) overflow via service = ASSERT_DATA_TYPE (column-length asserts are framework tests); in-process MULTIPLE_ERRORS has no code, only message+details
- [CAP test facts](cap_test_facts.md) — facades not auto-registered under cds.test; req.params is `{ID}`; projection `virtual` stripped on INSERT unless `@Core.Computed: false`; null complex-function result = 204 + `""`

## UI5

- OPA page objects: `matchers: someArrowFn` in a waitFor literal trips `@typescript-eslint/naming-convention` (reads as an object-literal method named `matchers`). Write `matchers: [someArrowFn]`; OPA takes an array (PT `app/project-view/webapp/test/integration/pages/ProjectView.ts`).

## Lint and coverage traps

- [Test-tree lint gotchas](lint_gotchas_test_tree.md) — no BR/FUT ids in tests (lint:tracking-ids), 3-line header cap, per-file Service coverage threshold

## Fixtures

- "Verbatim from the source" oracles: generate the data literals from `git show <sha>:<path>` with a node script in the scratchpad (JSON.stringify per cell), never hand-transcribe — markdown cells carry `…`, `→`, `≤`, backticks. Then check every generated string still occurs in the source.
- Test-quality runs write regression tests that pass on day one; prove one bites by mutating a *test-side* support helper (never srv/) and restoring — e.g. a trailing space in a scenario's save-row mapper red-lined the CSV re-import storyline.

## Proving the red

- A red where every suite dies on one shared cause (e.g. `FOREIGN KEY constraint failed` once fixture seeds give way to undeployed CSVs) hides your own assertion bugs. Prove the suite against a throwaway prototype: copy the module to `C:/Projects/Life OS/.proto-pt/` (inside the repo so `../node_modules` resolves; exclude coverage/design), patch a quick impl, run, mutate to confirm tests bite, then `rm -rf` it. SPEC-02 2026-11-03: 247/247 green, and it surfaced the D-244 virtual-strip finding.
- Test-quality batch: apply one mutation per finding on *disjoint* code paths in a single prototype copy (unique folder name — parallel authors), run once with `--verbose`, and the `×` list must be exactly your new tests. 2026-11-03 tracker: 6 mutations, 7/7 new tests red, 0 old ones — one run proved every finding.
- Red for a source file that does not exist yet: load it through a computed-path `require` (Project Tracker `test/shared/support/migrationModule.ts`) so `tsc` stays green, and make any "expect it to reject" helper rethrow `MODULE_NOT_FOUND`/`TypeError` — otherwise the absent module *is* the rejection and "fails loudly" passes on day one (seen in the SPEC-03 probe: key came back `MODULE_NOT_FOUND`).
- Red for a *method* missing on an existing class: ts-jest type-checks the spec, so a direct call fails compile and red-lines every old test in the file. Call it through a cast helper in `support/` (`suggestRecurringSplitOn` in FP `test/unit/transaction/support/transactionMocks.ts`) so the red is `TypeError: ... is not a function`. Same for a payload *field* the source type lacks: read it through a test-side interface in `support/` (PT `test/integration/tracker/support/readNextAction.ts`), so the red is `undefined`, not TS2339.
- A "404 for unknown id" OData test passes on day one: CAP 404s an undeclared function too (`code: "404"`, "Invalid resource path"). Assert the error *key* from `response.data.error.code`.
- A "fails on tamper X" test that asserts only a key namespace (`/^cnv\.reconcile\./`) passes whenever the check fails for *any* reason. A mutation that breaks the clean fixture (load as the wrong user) exposed four such tests in SPEC-03. Assert the exact key, or `not.toContain` the other assertions' keys.
- A parallel writer can rewrite files in your own lane mid-run (2026-11-05: the unit resolver loader deleted, two files left CRLF/LF-mixed at one mtime). `stat`/`file` before editing; a node `s.replace` on a CRLF file misses silently, so throw on `!s.includes(anchor)`.
- Prototype mutations: `perl -e` eats `—` (wrote literal `2014`) and silently misses patterns containing `\n` (one cause is CRLF or mixed line endings, e.g. PT `srv/tracker/entities.cds`, so run `file <f>` first or write `\r?\n`); use the Edit tool on the prototype file and `grep -c` each mutation landed before running. Back up the clean impl first (`cp x.ts /tmp/x.orig`) so a second batch starts clean.
- A prototype mutation that leaves an unused local fails ts-jest (`noUnusedLocals`), the server never boots, and every test times out in `beforeAll`. That is a broken mutation, not a result. Same for a wrong value that is not in its code list (`fricewType_code: "Integration"`): FK failure kills the shared arrangement, 24/24 red. Swap to another *valid* code.
- `cds.db.run(...)` inside a `srv.tx({ user }, ...)` callback inherits the tx user, so it is no provenance mutation (createdBy stayed `migration`). Change the tx `user` instead.

## Tooling

- [Tooling gotchas](tooling_gotchas.md) — no `python` (REPL hang); heredoc edits fail; tar+perl prototype mutation; prettier --check is not a gate; FP prototype needs a node_modules junction
- Test-quality finding paths can be stale (tests get moved between scenario files): F8 cited verbLayerFuts.test.ts:402 in a 397-line file; the FUT lived in methodologyFuts.test.ts. Grep the cited symbols before deferring.

## Financial Planner

- Check a shared fixture actually separates the values a mutation would swap before relying on it: RESPONSE_TWO_NEW's Netflix transacted_at and posted fall on the same date, so it cannot catch transactedAt-from-posted.

## Project Tracker

- Reading derived `status` off `TrackerService.Milestones` needs `ID` in `.columns(...)`: without it the after-READ derivation finds no chain and answers `done` for a Backlog story (vacuous truth), silently.
- `Milestone.storyId` is stored bare (`CNV-001`); verbs split `slug/storyId` on the first `/` (`mcp/verbs/shared/addressing.ts`). A brief or fixture quoting `financial-planner/CNV-001` means the reference: compare `${slug}/${storyId}`, never the column (SPEC-03 snapshot `EXPECTED_MILESTONES.storyId`).
- The cds.test SQLite store **does** enforce code-list foreign keys, even though TEST_STRATEGY §10 calls them unassertable: setting `Milestone.fricewType_code = 'Integration'` threw `FOREIGN KEY constraint failed`. To arrange a bad code, INSERT it into the code list first. `not null` plus `@assert.unique` on `position` also makes a null or duplicate position impossible to arrange.
- Pointing a spawned script at a SQLite file: the `[test]` profile pins `credentials.database: null`, and @cap-js/sqlite reads `database` before `url`, so `cds_requires_db_credentials_url` silently runs on `:memory:` ("no such table"). Set `cds_requires_db_credentials_database`. Deploy with `node <require.resolve('@sap/cds/bin/deploy.js')> --to sqlite --database <f>` (no cds-dk in node_modules). SQLite never holds the process open, so a dropped `disconnect()` is uncatchable there (`test/script/support/migrationScriptHarness.ts`).
- A brief's TDD list can predate the ruling on it: SPEC-04's listed `integration/scenarios/` specs, but D-266 rules no scenarios spec for a UI story (FUTs live in `tracker/tests/`, no FUT ids). Grep DECISIONS_LOG for the story's tier ruling before placing files. The same brief put `app/project-view/webapp/test/` in test-author's lane; D-264 gives every UI5 tier to `ui5-test-author`. Write CAP only and say so in notes.
- Filling a ProjectView virtual breaks readPath's "every derived scalar ... empty rather than missing" (asserts `null` on a world with open work). Re-arrange it to `WHOLE_CHAIN_COMPLETE`, where every scalar is legitimately null (done for SPEC-04).
- `setChainStates` writes stage rows only, no Activity events, so every `completedBy` on such a world is legitimately null. Assert the completer only on a verb-driven world (`driveChainScript`), never on a spread-completion fixture.
- A `ProjectView(id)/<section>?$top=n` navigation GET ignores the projection's `order by` (rows came back in key order) and runs the target entity's after-READ on that page only. A red built on it is *flaky*: random UUID keys let it pass now and then (1 of 3 runs for the 7-completion world). Say so when reporting it.
- `Task.completedAt` is a `DateTime` (second precision), so two verb-driven completions in one script tie on it; any "newest first" order must break the tie from Activity `occurredAt` (Timestamp). A spec ordering completions across a fast script inherits that tie.
- Verb guards put the blocking list in `VerbError.remediation`, not `.message` (message only names the target; `verb.remediation.runDriver`). Briefs saying "message contains" mean remediation.
- Verb-driven Activity sequences are strictly ordered: `mcp/verbs/shared/writeQueue.ts` hands out strictly increasing timestamps and `occurredAt` is a `Timestamp`. So "latest completion event wins" can be arranged as complete, then reopen, then complete through the verbs, with no hand-inserted Activity fixture and no tie flake.
