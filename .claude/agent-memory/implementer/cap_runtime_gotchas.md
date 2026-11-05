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

- **A supplied `managed` stamp survives a direct db `INSERT`** (probed 2026-11-04, Financial Planner: `modifiedAt: "2026-01-10..."` read back unchanged), so a seed can pin `modifiedAt` to make "latest" ordering deterministic. The overwrite below is the service-layer path.
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

Measured at SPEC-03 (migration domain, 2026-11-04):

- **Code-list and parent FKs are `DEFERRABLE INITIALLY DEFERRED` on both sqlite and postgres** (`cds compile --to sql --dialect postgres`), so a child row may be inserted before its parent inside one tx (the migration Activity precedes its Workspace).
- **`srv.tx({ user: new cds.User("migration") }, fn)`** stamps `createdBy` on every row, including rows an `after CREATE` handler writes by direct `await INSERT` (the chain Tasks/Subtasks). Direct `await SELECT` inside `fn` joins the same tx.
- **A request outside dispatch:** `new cds.Request({ event })` gives a real `req.error()` accumulator; `req.reject()` with no args throws the one error, or `MULTIPLE_ERRORS` with `details`. Both `req.errors` and the no-arg `reject()` are missing from the typings — cast to a local interface. Extra fields on `req.error({...})` (e.g. `counts`) need a non-literal variable, or TS's excess-property check rejects the overload.

Measured on Financial Planner D-063 (2026-11-05):

- **A targeted `req.error` in a draft PATCH handler does not fail the PATCH.** Lean draft (`cds.fiori.draft_messages`, default on) diverts any error with a `target` into draft messages; the PATCH returns 2xx with the bad value stored, and `draftActivate` still succeeds. To refuse the edit, raise it without `target` (it then fails the PATCH 400).
- **The planner's `wrapHandler` turns any throw into a 500**, including a deliberate `req.reject(400, ...)`; Project Tracker's passes rejections through. In planner handlers, refuse with `req.error`, not `req.reject`.
- **FE fires no annotated side effect for a plain `sap.m.Input` in a custom field fragment**; call `context.requestSideEffects` from its `change` (via the app's `model/` service).


- **A refused draft PATCH stays pending in UI5 and is re-sent with the next edit** — call `resetChanges()` only after the failed batch settles (not inside `patchCompleted`), then re-read the affected fields; resetting earlier is lost and the PATCH loops (Financial Planner D-064, 2026-11-05).
- **`@assert.range.message` translates only a `{i18n>key}` value** — a bare key is shown verbatim (Financial Planner D-066).
