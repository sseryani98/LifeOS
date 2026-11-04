# Implementer memory

## CAP

- [CAP runtime gotchas](cap_runtime_gotchas.md) — virtual input, CSV seed, req.reject args, stamps, autoexpose naming, boot order, CDS_TYPESCRIPT timing, draft SAVE, params, deferred FKs, tx user, out-of-dispatch cds.Request; the source no longer comments these

## Lint and coverage traps

- `@typescript-eslint/naming-convention` requires a method to start with a verb from a fixed list (`create`, `build`, `apply`, `assert`...); `instantiate*` fails. Check the regex in the ESLint error before naming.
- `lint:comment-length` caps JSDoc prose at 5 lines — long rationale JSDoc on a Service method is the usual hit.
- Istanbul counts every `??` as a two-way branch but not `?.`. A small `*Service.ts` (~11 branches) fell to 72% on three defensive `?? fallback`s; move the null-normalising to the Mapper and look up with `?.`. Validators are 100/100, so a spec rule with no test (e.g. a fatal 400 guard) belongs in the Service as `req.reject`, not in the Validator.
- A method name fixed by the spec/test contract but outside the verb list (`reconcile`) needs `// eslint-disable-next-line @typescript-eslint/naming-convention` with a reason line.
- `lint:tracking-ids` scans only `.ts .js .cds .xml .properties .css .html`. Ledger data full of story/defect IDs can live in a `.json` beside the domain (SPEC-03 snapshot); plain `import x from "./x.json"` works in tsc (Node16 rejects `with {type:"json"}`), ts-jest and tsx.
- Module `scripts/*.ts` sit outside the type-aware ESLint project until `scripts/**/*.ts` is in the module `tsconfig.json` `include`.

## Shell traps

- On this machine `python` hangs (Store stub) and a `cat > file` with no heredoc body waits on stdin; write files with the Write tool, and multi-line JS edits as a script file rather than `node -e` with nested quotes.

## Project Tracker

- Jest's `./srv/modules/**/*Service.ts` threshold glob also matches `*DataService.ts` (90/85 branches): one `if` guard in a DataService fails the gate. Keep DataServices branch-free (jest.config.ts).
