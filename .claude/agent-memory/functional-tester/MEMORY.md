# functional-tester memory

## Scratch database

- No `psql`/`createdb` on PATH (Windows, Git Bash). Run SQL via `node -e` on `require("pg")` from the
  module folder — `@cap-js/postgres` installs it at the repo root `node_modules/`.
- A leftover `node -e` pg script that never calls `client.end()` hangs and times out; always `end()`.
- Postgres lowercases unquoted names (`com_lifeos_projecttracker_task`, `milestone_id`). node-pg reads
  `timestamp` (no tz) as local time -> a 5h skew vs API envelopes; compare as text, not Date.

## Scratch scripts

- PARALLEL RUNS: the scratchpad dir is shared with a sibling tester. Use a private subdir (`scratchpad/<story>/`)
  for the `dbname` file and scripts, and hardcode/assert the DB name prefix in every script — a shared
  `dbname` file once pointed my seed at the sibling's DB.
- Import SDK/pg from a scratch script by `file:///C:/Projects/Life%20OS/node_modules/...` URL, or from a
  scratch `.cjs` with `createRequire("<module>/package.json")` (bare absolute `C:/` paths fail ESM; a
  scratch file has no node_modules).
- Long scenario scripts: write with the Write tool, not a Bash heredoc (a 100-line `.mjs` heredoc died with "unexpected EOF").
- A `console.log(label, JSON.stringify(x))` helper with one value param silently drops extra args - pass arrays when logging deltas.

## Project Tracker

- [Driving the verb server](modules/project-tracker/verb_server_driving.md) — boot via `node --import tsx mcp/server.ts`, seeding recipes, envelope shapes, zod refusals, timestamp precision, library-edit probes
