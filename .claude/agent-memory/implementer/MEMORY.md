# Implementer memory

## CAP

- [CAP runtime gotchas](cap_runtime_gotchas.md) — virtual input, CSV seed, req.reject args, stamps, autoexpose naming, boot order, CDS_TYPESCRIPT timing, draft SAVE, params, deferred FKs, tx user, out-of-dispatch cds.Request; the source no longer comments these
- An `after READ` that sorts/caps rows only sees the page the DB returned: `$top` is applied first, and `$count` still counts the whole set. Give FE a `SortOrder` so the page holds the right rows, and clamp `rows.$count` when you cap (PT `projectViewService.ts`, recently completed).
- An expand (`ProjectView?$expand=taskQueue`) never fires the target entity's own `after READ`; the FE nav read (`ProjectView(ID)/taskQueue`) does. Handle both, or the browser and the test disagree.
- A new CDS view needs `npx cds deploy` against local Postgres before `npm start`, or every read touching it is `42P01 relation does not exist` (the Jest tier is in-memory and never notices).

## Lint and coverage traps

- `@typescript-eslint/naming-convention` requires a method to start with a verb from a fixed list (`create`, `build`, `apply`, `assert`...); `instantiate*` fails. Check the regex in the ESLint error before naming.
- `lint:comment-length` caps JSDoc prose at 5 lines — long rationale JSDoc on a Service method is the usual hit.
- Istanbul counts every `??` as a two-way branch but not `?.`. A small `*Service.ts` (~11 branches) fell to 72% on three defensive `?? fallback`s; move the null-normalising to the Mapper and look up with `?.`. Validators are 100/100, so a spec rule with no test (e.g. a fatal 400 guard) belongs in the Service as `req.reject`, not in the Validator.
- A method name fixed by the spec/test contract but outside the verb list (`reconcile`) needs `// eslint-disable-next-line @typescript-eslint/naming-convention` with a reason line.
- `lint:tracking-ids` also bans `BR-18`/`SPEC-02 §4.2` in source comments — briefs cite them, so paraphrase the rule instead (hit in app/transactions ext/SplitActions.ts).
- `lint:tracking-ids` scans only `.ts .js .cds .xml .properties .css .html`. Ledger data full of story/defect IDs can live in a `.json` beside the domain (SPEC-03 snapshot); plain `import x from "./x.json"` works in tsc (Node16 rejects `with {type:"json"}`), ts-jest and tsx.
- Module `scripts/*.ts` sit outside the type-aware ESLint project until `scripts/**/*.ts` is in the module `tsconfig.json` `include`.
- `lint:grouped-constants` counts an exported `as const` array as a loose constant too; a third one in `shared/constants.ts` fails — nest it in a group object.
- `lint:annotations`: a field block naming `ID` demands all five managed fields hidden. A read view has none, so hide its key as `annotate svc.X:ID with @UI.Hidden;` outside the block.
- Never run `prettier --write` over existing `mcp/`/`srv/` files: they are not prettier-clean at 80 cols, so it churns unrelated lines into the review diff. Format only new files.

## UI5

- Expression binding `{= !!${x} }` or `${tier} === 1` converts `x` to the bound property's type first (boolean / string) → FormatException or a silent wrong branch. Write `${path: 'x', targetType: 'any'}` (PT `ProjectView.view.xml`).
- A standalone ComponentSupport launch page needs `style="height: 100%"` on the `data-sap-ui-component` div; without it an ObjectPageLayout renders at height 0 (blank page, text still in the DOM).
- No Playwright MCP tool in the agent? The root `playwright` package drives headless Chromium from a scratch node script (`chromium.launch()`, console + pageerror listeners, screenshot) — caught both defects above.
- `sap.fe.macros.Table` has no `noDataText`; `personalization="false"` + `variantManagement="None"` removes the sort/settings toolbar.

## Shell traps

- Module files mix CRLF and LF (`file *.ts`); a Node string-replace edit script silently no-ops on CRLF files. Use the Edit tool for multi-line edits.
- On this machine `python` hangs (Store stub) and a `cat > file` with no heredoc body waits on stdin; write files with the Write tool, and multi-line JS edits as a script file rather than `node -e` with nested quotes.

## Project Tracker

- Jest's `./srv/modules/**/*Service.ts` threshold glob also matches `*DataService.ts` (90/85 branches): one `if` guard in a DataService fails the gate. Keep DataServices branch-free (jest.config.ts).
