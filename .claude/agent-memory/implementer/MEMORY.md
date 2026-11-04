# Implementer memory

## CAP runtime
- [CAP runtime gotchas](cap_runtime_gotchas.md) — virtual input, CSV seed, req.reject args, stamps, autoexpose naming, boot order, CDS_TYPESCRIPT timing, draft SAVE, params; the source no longer comments these

## Lint and coverage traps
- `@typescript-eslint/naming-convention` requires a method to start with a verb from a fixed list (`create`, `build`, `apply`, `assert`...); `instantiate*` fails. Check the regex in the ESLint error before naming.
- `lint:comment-length` caps JSDoc prose at 5 lines — long rationale JSDoc on a Service method is the usual hit.

## Project Tracker
- Jest's `./srv/modules/**/*Service.ts` threshold glob also matches `*DataService.ts` (90/85 branches): one `if` guard in a DataService fails the gate. Keep DataServices branch-free (jest.config.ts).
