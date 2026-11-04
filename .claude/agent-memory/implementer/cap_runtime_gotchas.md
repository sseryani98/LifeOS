---
name: cap-runtime-gotchas
description: Measured CAP 9.8.4 behaviours that change how a handler or seed must be written in Project Tracker (virtual input, CSV seed, req.reject args)
metadata:
  type: reference
---

- **A `virtual` element on a projection is stripped from `req.data` on INSERT** (before/after CREATE,
  `srv.run(INSERT)` path) unless it also carries `@Core.Computed: false`. Without it, an unknown key
  throws `Property "x" does not exist`. Evidence: SPEC-02 `createdDone` on `TrackerService.Milestones`.
- **`db/data/{namespace}-{Entity}.csv` loads in every harness**: `cds.test` and `mcp/server.ts`'s
  `cds.deploy` both pick it up. `;` delimiter works, an empty field reads back `null`, `false`/`true`
  become Booleans, FKs are `kind_code` / `parent_code` columns.
- **`req.reject(409, key, [arg])`**: an array third argument becomes `args` (`lib/req/response.js`
  `prepareError`). In-process the thrown error keeps `code: 409, message: key`; the OData adapter is
  what resolves `{0}`. So a verb-tier test sees the key, an HTTP test sees the text.
- `INSERT.into(X).entries([])` is a harmless 0-row insert on sqlite — no empty-list guard needed.

Moved here from source comments 2026-11-04 (Sandro: framework behaviour belongs in agent memory, not in code comments):

- **`@cds.on.insert` / `managed` stamps overwrite a supplied value.** `Decision.decidedAt` has no stamp on purpose: the verb layer always supplies the envelope's timestamp, and a stamp would discard it.
- **`@cds.autoexpose` exposes an entity under its singular name** (`TrackerService.Actor`, not `Actors`) — that is why `ENTITIES.ACTOR` is singular in `srv/modules/shared/constants.ts`.
- **A projection, not a view, when registers must stay collections.** A view flattens associations into rows; a function's result can't be bound. `ProjectView` is a projection for this reason.
- **Validation annotations (`@assert.range`) go on the service entity**, so every write path — OData and the MCP verbs — is checked (`TrackerService.TestRuns`).
- **CAP's message bundle resolves from `cds.root`** (cwd unless a cds command set it); a process started outside the module root falls back to raw keys. CAP's own replacer eats every braced token, so substitution of `{0}` placeholders stays in `MessagingUtility` (the catalogue uses named `{workspace}` as literal text).
- **`req.reject(409, key)` in-process arrives as numeric `code: 409`, message = key, placeholder values on `args`.** A driver SQLSTATE (`"23505"`) is a string `code` and must not be read as a status.
- **Boot order matters (`mcp/server.ts`, mirrors `@sap/cds/server.js`):** set `cds.model` → `cds.connect.to('db')` → deploy (in-memory only) → `cds.serve('all')`. The db service reads `cds.model` when it connects. An earlier version connected db only inside the in-memory deploy, so on Postgres every verb answered 500 behind a green gate. Serve exactly once: a reconnect reopens the connection, not the services.
- **`CDS_TYPESCRIPT=true` must be set before `@sap/cds` is imported** (CAP fixes its impl-extension list at module load) — hence the env assignment before the dynamic import in `mcp/server.ts`. CAP also roots the project at cwd, hence the `chdir` to the module.
- **`cds.deploy` prints a banner to stdout** — fatal for an MCP stdio server; `_runSilentDeploy` passes an option the published typings omit.
- **CAP omits absent optional action params** from `req.data` — coerce to `null` explicitly when null and 0 mean different things (Financial Planner `transactionMapper._toNullableNumber`).
- **Draft `before('SAVE')` receives the full activated row**, so "did the vendor change" means comparing against the stored row (Financial Planner `transactionService`).
- **UPDATE key lives in the last `req.params` entry**, as an id string or a `{ ID }` object.
- **`cuid` fills `ID` before any handler runs** — every created row already has an ID in `before CREATE`.
