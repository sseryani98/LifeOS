---
name: verb-server-driving
description: How to boot, seed and probe Project Tracker's MCP verb server on a scratch Postgres database from a functional test run
metadata:
  type: reference
---

## Database and roles

- Project Tracker's `.env` (`CDS_REQUIRES_DB_CREDENTIALS_PASSWORD`) is the `project_tracker` role's
  password; the same variable in the process env (from `~/.claude/settings.json`) is the `postgres`
  superuser's. Source the module `.env` (`set -a; . ./.env; set +a`) before connecting as the module role.
- `project_tracker` was granted `CREATEDB` on 2026-11-03 so scratch `ft_*` databases need no superuser.
- Tables are `com_lifeos_projecttracker_task` etc.; Subtask has no `startedat` column (only Task).

## Booting and connecting

- Fixed 2026-11-03: shipped `node --import tsx mcp/server.ts` (cwd = module, env `PROJECT_TRACKER_ACTOR`,
  `CDS_REQUIRES_DB_CREDENTIALS_DATABASE`) now boots on Postgres; no launcher workaround needed. (Before that
  fix every verb was 500 `verb.internal.failure`.) Boot takes ~8s.
- Use `StdioClientTransport({command:"node",args:["--import","tsx","mcp/server.ts"],cwd,env,stderr:"pipe"})`,
  one client per actor.
- Unknown actor still allowed on read verbs; `connect("")` -> `verb.identity.missing`.

## Seeding

- With in-process cds: a tsx script importing `file:///.../mcp/server.ts` and calling `TrackerMcpServer.startRuntime(cds)`
  gives an in-process cds on the scratch DB; insert Area/Engagement/Workspace/Initiative via `INSERT.into
  ("com.lifeos.projecttracker.X")` and the Milestone via `TrackerService.Milestones` (materialises the chain).
  Stage states are then set by plain SQL UPDATE on `..._task`.
- Without in-process cds (works 2026-11-03): SQL-insert Area/Engagement/Workspace only (managed cols createdat/createdby/
  modifiedat/modifiedby required), then `plan_sprint` makes Initiative+Milestones+Tasks (8 tasks/story if shipsUi false, 9 if true).
- Workspace/Area/Engagement are not seeded and no verb creates them; create via in-process
  `srv.run(INSERT.into("TrackerService.Workspaces"))` (needs `cds.model` set). `createdDone` is a virtual
  on `TrackerService.Milestones` only - reachable only through the service, not any verb.
- Two workspaces seeded => `project_view()` with no arg is 400 `verb.workspace.ambiguous`; pass `workspace`.

## Envelopes and refusals

- Failure envelopes carry `code` (`verb.stage.blocked`) and `rule` (`wfl.stage.predecessorOpen`); `wfl.stage.humanOnly`
  is in `code`, no `rule`. Milestone status: `project_view` -> `view.initiatives[].milestones[].status`.
- Zod-schema refusals (empty `stories`, negative counts, bad enum severity/FRICEW type, bad `executedAt`) never reach a verb:
  result is `isError:true` with non-JSON text `MCP error -32602: Input validation error...`, so no `status`/`code` and no
  `verb.value.notInCodeList` key (§5 row says 400 + that key; spec/impl gap). Parse defensively.
- Task story mode TestRun has `initiative_id` null by design (BR-20a).

## Probing

- Task/Subtask timestamps are second-precision, Activity.occurredAt is ms: sleep >1s between steps when testing
  "startedAt = reopen time".
- Library edits (driver/kind) are SQL on `..._methodologystep`; do last and restore. Frozen-chain probes work as raw
  SQL UPDATE on `..._methodologystep` (kind_code/position/requireshuman) then a verb call; restore from a pre-edit snapshot.
