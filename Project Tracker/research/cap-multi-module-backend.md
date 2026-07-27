# One Node Process Is One CAP Project — Composition Happens in the Model, Not the Runtime

**Document ID:** RSH-002
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Research stage. |

---

## 2. What This Establishes

**CAP gives you exactly one lever: a Node process runs one CAP project — one `cds.root`, one
`cds.env`, one model, one `cds.db` — so "one service or one per module" is really "do the two
modules' CDS models compile into one model, or not", and both answers are natively supported.**
Cross-package model composition already works in this workspace: npm has symlinked
`node_modules/financial-planner`, and CAP's model resolver is Node's own `_resolveFilename` walking
`node_modules/` up the tree, so `using from 'financial-planner/db/reference/schema'` resolves today
from a folder that does not yet exist. The database question is more constrained than the namespace
flattening suggests: `com_financialplanner_*` prefixes do protect entity tables, but **84 of
Financial Planner's 128 database objects carry no namespace at all** — 64 service views, 19 draft
shadow tables and the fixed-name `DRAFT_DraftAdministrativeData` — and `cds deploy` keeps its
schema-evolution snapshot in a single fixed-name `cds_model` table per Postgres schema, which two
independently deploying projects would fight over. `@cap-js/postgres` does implement a
`credentials.schema` option that issues `SET search_path`, which makes schema-per-module viable, but
capire does not document it. What would change this document's shape: an actual two-project compile
and an actual Postgres deploy — neither was run, because no spike was authorised.

---

## 3. A Node Process Runs One CAP Project, Full Stop

**`cds` is a process-global singleton with a single `root`, `model`, `db` and `env`, so two
independent CAP projects cannot coexist in one process — composition must happen at the model layer,
before the runtime starts.** `Documented`, from the installed source:

```js
// @sap/cds/lib/index.js:7,20-23  (@sap/cds 9.8.4)
const cds = exports = module.exports = global.cds = new class cds extends EventEmitter {
  /** @type LinkedCSN */ model = undefined
  /** @type Service */   db    = undefined
  /** CLI args */        cli   = { command:'', options:{}, argv:[] }
  /** Working dir */     root  = process.cwd()
```

Everything downstream keys off that single `root`. `cds.env.roots` — the list of folders auto-loaded
by `cds.load('*')` — is six *relative* paths resolved against it. `Verified`, run in
`Financial Planner/`:

```text
$ cds env get roots
[ "db/", "srv/", "app/", "app/*", "schema", "services" ]
```

Those come from `cds-env.js:156-157` (`Object.values(this.folders).concat(['schema','services'])`)
over `defaults.js:105-110`. `Documented`. There is no mechanism by which a project's auto-load reaches
into a sibling workspace package: the roots are relative, and `cds.root` is one value.

A second guard makes the point operationally. `cds serve` **hard-exits** if `@sap/cds` was loaded from
more than one location in the same process:

```js
// @sap/cds/bin/serve.js:366-380
function _check_setup() {
  if (global.__cds_loaded_from?.size <= 1) return // all good
  …  ERROR: @sap/cds was loaded from different locations
  if (cds.env.server.exit_on_multi_install)  process.exit(1)
}
```

with `exit_on_multi_install: true` at `defaults.js:17`. `Documented`. This matters here because
**npm has not hoisted `@sap/cds` to the workspace root**. `Verified` — the root `package-lock.json`
(lockfileVersion 3) places it at `Financial Planner/node_modules/@sap/cds` (9.8.4), and 1249 packages
are nested under the module against 563 at the root. A second module declaring `@sap/cds` may or may
not hoist; if it nests too, any attempt to load both modules' code in one process trips the guard.

There is one loosening worth knowing: `cds.env.for(context, cwd)` (`cds-env.js:17-24`) can construct a
*second config object* for a different directory. That reads a second project's settings; it does not
give it a second `cds.db` or a second service registry. `Inferred` from the source — the singleton
fields at `index.js:20-23` are plain instance properties, not per-config.

---

## 4. Cross-Package Model Composition Already Resolves in This Workspace

**CAP resolves model references through Node's own module resolution, and npm workspaces has already
created the symlink that makes `financial-planner/...` importable from a Project Tracker that does
not exist yet.** The resolver builds its lookup path from `cds.root` outward:

```js
// @sap/cds/lib/compile/resolve.js:34-43
const paths = [ cwd ]
const node_modules = (o.env||cds.env).cdsc.moduleLookupDirectories   // ['node_modules/']
const a = cwd.split(path.sep), n = a.length
for (let each of node_modules) paths.push (
  ...a.map ((_,i,a)=> a.slice(0,n-i).join(path.sep) + path.sep + each)
)
…
const _resolve = require('module')._resolveFilename                   // resolve.js:163
```

`Documented`. Reproducing that exact algorithm against the real workspace, for a hypothetical
`Project Tracker` folder — `Verified`, read-only, no files written to the repo:

```text
$ node scratchpad/probe-resolve.cjs
lookup paths:
  c:\Projects\Life OS\Project Tracker
  c:\Projects\Life OS\Project Tracker\node_modules/
  c:\Projects\Life OS\node_modules/
  c:\Projects\node_modules/
  c:\node_modules/

OK    financial-planner/db/reference/schema.cds  ->  C:\Projects\Life OS\Financial Planner\db\reference\schema.cds
OK    financial-planner/srv/admin-service.cds    ->  C:\Projects\Life OS\Financial Planner\srv\admin-service.cds
OK    financial-planner/@cds-models/index.js     ->  C:\Projects\Life OS\Financial Planner\@cds-models\index.js
FAIL  @sap/cds/common.cds                        ->  MODULE_NOT_FOUND
```

The three `OK` lines work because npm workspaces created
`c:\Projects\Life OS\node_modules\financial-planner -> /c/Projects/Life OS/Financial Planner`
(`Verified`, `ls -la node_modules | grep financial`). The `FAIL` is not a defect: `@sap/cds` is nested
under the module (§3), and CAP short-circuits that reference anyway —
`if (id.startsWith('@sap/cds/')) id = cds.home + id.slice(8)` at `resolve.js:88-89`.

This is the mechanism capire's **CAP Service Composition** guide describes (fetched 2026-07-26,
`cap.cloud.sap/docs/guides/integration/reuse-and-compose`). `Documented`. Its governing rule:

> "Everything that you are referring to from your own models is served. Everything outside of your
> models is ignored."

and its stated caveat is precisely our situation:

> "Ensure namespace isolation to prevent table name collisions. Reuse packages should use unique
> namespaces … so their entities don't conflict when composed together."

**What is not established:** that a `using from 'financial-planner/db/…'` inside a Project Tracker
`.cds` file *compiles cleanly*. Resolution is verified; compilation is not. §11 names the test.

---

## 5. Four Composition Shapes, and What Each Costs Locally

**All four are natively supported; they differ mainly in how many processes must be alive and how
many places own the schema.** Costs below are for local, single-user, no-BTP operation.

| Shape                                                     | Processes / ports                       | Model                                                            | `cds deploy` owners | Typed models                                     |
| --------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------- | ------------------- | ------------------------------------------------ |
| **A. Two projects, two processes, two databases**         | 2 (`4004` + one more, `PORT` env)       | Independent; PT never sees FP's model                            | 2, disjoint         | 2 × `@cds-models/`, independent                  |
| **B. Two projects, two processes, one Postgres database** | 2                                       | Independent, or PT imports FP's `db/`                            | Must be exactly 1   | 2 × `@cds-models/`                               |
| **C. One collector project imports both**                 | 1                                       | One CSN; both modules' `db/` + `srv/` reachable                  | 1 (the collector)   | 1 × `@cds-models/`, in the collector             |
| **D. Two projects, one consumes the other remotely**      | 2, and the producer must be up on write | PT holds an *imported* FP service model via `cds.requires.model` | 2, disjoint         | 2 × `@cds-models/`, PT's includes the remote API |

Supporting facts, all `Documented` unless marked:

- **Port.** `server.js:64` — `process.env.PORT || cds.env.server?.port || 4004`. Two processes need two
  ports and two terminals; nothing in CAP multiplexes them.
- **Serve does not deploy against Postgres.** `bin/serve.js:336-351` auto-deploys only when the db is
  `:memory:`. So a second process pointed at an already-deployed Postgres will not clobber it merely by
  starting — but it also will not create anything. `cds deploy` is an explicit act.
- **Today's dev loop never touches Postgres.** `Verified` — `cds env get roots`/`requires.db` in
  `Financial Planner/` returns `kind: "sqlite", url: ":memory:"`, because the module's
  `[development]` profile overrides it (`Financial Planner/package.json:105-120`). Only
  `CDS_ENV=production` yields `kind: "postgres" … database: "financial_planner"` plus
  `schema_evolution: "auto"`. The shared-database question is, right now, entirely theoretical in the
  loop Sandro actually runs.
- **`cds build` is not in `@sap/cds`.** `Verified` — the package's `bin/` holds only `args.js`,
  `deploy.js`, `serve.js`, and `package.json` declares only `cds-deploy` and `cds-serve`. The `cds`
  CLI on PATH comes from a **globally installed** `@sap/cds-dk@9.7.2` alongside a global
  `@sap/cds@9.7.1` (`npm ls -g --depth=0`), a different patch line from the project's 9.8.4. Whatever
  shape Design picks, `npm run build` in any module depends on a global tool this repo does not pin.
- **Typed models are per project root.** `@cap-js/cds-typer@0.38.0` defaults `output_directory` to
  `@cds-models` (`package.json:56,86`; `lib/cli.js:147`), and Financial Planner maps it via
  `"imports": { "#cds-models/*": "./@cds-models/*/index.js" }`. Shape C collapses these to one
  directory; A, B and D keep two. `Documented`.
- **i18n does not collide by accident, but can by configuration.** Bundles are gathered by walking up
  from *each model source's own directory* (`lib/i18n/files.js:36-51`), so composed sources each find
  their own `_i18n`. But Financial Planner sets a project-wide `cds.i18n.folders: ["srv/_i18n"]`; in
  shape C that override applies to every source in the collector, and the entries merge into one
  bundle. `Documented` for the mechanism, `Inferred` for the collision risk.
- **`cds serve --project <pkg>`** sets `cds.root` from a package name (`bin/serve.js:320-328`), so a
  root-level script can start either module without `cd`. One root at a time.
- **`app.serve(ep).from(pkg, folder)`** (`server.js:110-118`) mounts another package's static folder
  on this server — the package-level UI composition the `ui5-multi-app-shell` scout also found.

capire's **Microservices with CAP** guide (fetched 2026-07-26, at
`cap.cloud.sap/docs/guides/deploy/microservices` — note that `/guides/deployment/microservices`,
which several search results still cite, returns 404) documents shape C as the sanctioned
shared-database pattern: a dedicated `shared-db` project whose only content is
`using from '@capire/bookstore'; using from '@capire/reviews'; using from '@capire/orders';`, built
once and deployed once, with the runtime apps binding to the resulting database. It also states the
opposite pole plainly: *"True microservices each consist of their own deployment unit with their own
application and their own database."* `Documented`. **Caveat:** that guide's worked example is
Cloud Foundry + MTA + HANA throughout. The *model-composition* half is platform-neutral; the
`mta.yaml` / `hdi-container` half is not, and does not apply here.

---

## 6. Namespace Flattening Protects Entity Tables — and Nothing Else

**`com.lifeos.projecttracker` versus `com.financialplanner` guarantees no *entity* table collides, but
84 of Financial Planner's 128 Postgres objects carry no namespace whatsoever — and only 44 do.**
`Verified`, by compiling the installed model read-only (no files written to the repo):

```text
$ node scratchpad/probe-count.cjs   # cds.load(['db','srv']); cds.compile.to.sql(csn,{dialect:'postgres'})
total       : 128  (TABLE 63, VIEW 65)
namespaced  : 44  (TABLE 43, VIEW 1)
unnamespaced: 84  (TABLE 20, VIEW 64)
unnamespaced TABLEs:
  DRAFT_DraftAdministrativeData
  AdminService_Issuers_drafts
  AdminService_RewardsPrograms_drafts
  …
  TransactionService_TransactionSplits_drafts
```

The 20 unnamespaced tables are `DRAFT_DraftAdministrativeData` plus 19 draft shadow tables; the 64
unnamespaced views are the service projections (`AdminService_Issuers`, `TransactionService_…`). The
namespaced half looks as expected:

```sql
CREATE TABLE com_financialplanner_Issuer (
  ID VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP,
  …
```

Four classes of object escape the namespace, and each is a distinct collision risk in a shared schema:

| Object class              | Example                         | Why it is unnamespaced                                   | Collision risk                                                           |
| ------------------------- | ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| Fixed-name draft admin    | `DRAFT_DraftAdministrativeData` | CAP's own; one per database schema by construction       | **Certain** — both modules emit it if either uses draft-enabled entities |
| Service projection views  | `AdminService_Issuers`          | Services declared namespace-free — `admin-service.cds:7` | **Likely** — any service name reused across modules collides             |
| Draft shadow tables       | `AdminService_Issuers_drafts`   | Derived from the service name                            | **Likely** — same cause                                                  |
| Schema-evolution snapshot | `cds_model`                     | Fixed name, written by `cds deploy` (§7)                 | **Certain**, and destructive                                             |

`Verified` for the object names; `Documented` for the cause (`Financial Planner/srv/*.cds` declares
`service AdminService`, `BudgetService`, `ChurningService`, `TransactionService`, all namespace-free).
Project Tracker naming a service `AdminService` — a plausible choice — would silently overwrite
Financial Planner's views in a shared schema.

---

## 7. `cds deploy` Keeps One Schema Snapshot Per Postgres Schema

**Postgres deployment defaults to automatic schema evolution, and that machinery stores exactly one
CSN in one fixed-name `cds_model` table per schema — so two projects deploying into the same schema
would each read the other's model as their "prior image".** `Documented`, from
`@sap/cds/lib/dbs/cds-deploy.js`:

```js
// cds-deploy.js:68-92
let schevo = (o.kind === 'postgres' && o.schema_evolution !== false) || …
if (schevo) {
  const { prior, table_exists } = await get_prior_model()
  const { afterImage, drops: d, createsAndAlters } = cds.compile.to.sql.delta(csn, o, prior);
  …
  creas = createsAndAlters
  drops = d
}
// cds-deploy.js:135-146
let [table_exists] = await db.run(
  db.kind === 'postgres' ? `SELECT 1 from pg_tables WHERE tablename = 'cds_model' and schemaname = current_schema()` : …
)
if (table_exists) { let [{ csn }] = await db.run('SELECT csn from cds_model'); … }
```

`schema_evolution: "auto"` is a kind-level default set by the driver itself
(`@cap-js/postgres/package.json:74`), not something Financial Planner opted into — `Verified` via
`CDS_ENV=production cds env get requires.db`, which returns it even though the module's own config
never mentions it. `@cap-js/postgres`'s README (§"schema migration") confirms the same table:
*"this will create the table `cds_model` laying the foundation for the schema migration"*.

**The consequence is `Inferred`, not `Verified`:** if Project Tracker ran `cds deploy` against the
`financial_planner` database's `public` schema, `get_prior_model()` would return Financial Planner's
CSN as `prior`, the delta would treat all 128 of its objects as removed, and `drops` would carry DDL
to remove them. The code path is explicit; I did not execute a deploy, and no spike was authorised.
This is the single highest-value thing to test before Design commits to a shared schema.

**`@cap-js/postgres` does implement schema selection — capire does not document it.** `Documented`,
from `@cap-js/postgres/lib/PostgresService.js`:

```js
// PostgresService.js:81-83 — issued on every session
...(this.options?.credentials?.schema
  ? [this.exec(`SET search_path TO "${this.options?.credentials?.schema}";`)]
  : []),
// PostgresService.js:288-292 — the error you get when the schema is absent
if (err.code === '3F000') {
  if (this.options?.credentials?.schema)
    cds.error`Failed to configure schema ("…") before plainSQL call: ${req.query}`
```

`credentials.schema` is also passed to the `pg` driver at `PostgresService.js:34`. CAP's config schema
accepts it — `lib/env/schemas/cds-package.js:21` sets `additionalProperties: true`. Two facts qualify
it:

1. **capire's PostgreSQL guide does not mention a `schema` credential** (fetched 2026-07-26,
   `cap.cloud.sap/docs/guides/databases/postgres`). This is an implemented-but-undocumented option;
   it can change without a doc-visible deprecation.
2. **Nothing creates the schema for you outside multitenancy.** `PostgresService.tenant()`
   (`PostgresService.js:641-680`) does `CREATE SCHEMA "…" AUTHORIZATION "…"`, but that is the MT path,
   and capire states flatly: *"Multitenancy and extensibility aren't yet supported on PostgreSQL."*
   Under a plain `credentials.schema`, `CREATE SCHEMA` is a manual `psql` step. `Documented` +
   `Inferred` for the manual-step conclusion.

Because `cds_model` is looked up with `schemaname = current_schema()` (`cds-deploy.js:136`), a
distinct `search_path` per module gives each module its **own** `cds_model` — which is what makes
schema-per-module structurally clean rather than merely tidy.

---

## 8. Cross-Module Reads: Three Mechanisms, Three Different Liveness Requirements

**All three are supported without BTP; they differ in what must be running and where the data
physically lives.**

| Mechanism                                        | Config                                                                                                                                                          | Must be running                      | Data location               |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------- |
| **Remote OData**                                 | `cds.requires.FinPlanner = { kind: 'odata-v4', model: 'financial-planner/srv/admin-service', credentials: { url: 'http://localhost:4004/service/adminSvcs' } }` | The other CAP process, on every call | Stays in the other module   |
| **In-process (composed model)**                  | `using from 'financial-planner/srv/admin-service'` + `cds.connect.to('AdminService')`                                                                           | Nothing extra — same process         | One database, one process   |
| **Database-level (shared schema, split models)** | Both point `cds.requires.db` at the same Postgres database/schema; one project deploys                                                                          | Only Postgres                        | One database, two processes |

Evidence:

- **Remote kinds exist and are BTP-free.** `cds-requires.js:95-119` maps `rest`, `odata`, `odata-v2`,
  `odata-v4`, `graphql` and `hcql` to `@sap/cds/srv/remote-service.js` with `external: true`. The
  implementation needs `credentials.url` *or* a destination —
  `libx/_runtime/remote/Service.js:246-247`: `"url" or "destination" property must be configured in
  "credentials"`. A plain `http://localhost:…` URL satisfies it; nothing forces an SAP destination
  service. `Documented`.
- **`model` in a requires entry is the imported API.** capire *Connecting to Required Services*
  (fetched 2026-07-26, `cap.cloud.sap/docs/node.js/cds-connect`): *"Specify (imported) models for
  remote services in this property. This allows the service runtime to reflect on the external API…"*
  and *"a service definition for your required service must be included in that model."* The value
  resolves *"as absolute node modules or relative to the project root"* — i.e. via the same workspace
  symlink verified in §4. `Documented`.
- **`cds.connect.to` transparently prefers local.** Same page: *"As services constructed by `cds.serve`
  are registered with `cds.services` as well, a connect finds and returns them as local service
  connections."* So the *call site* is identical in the composed and remote shapes; only the config
  differs. `Documented`.

**Worth stating plainly: slice 1 does not appear to need any of them.** CNV-002 loads Financial
Planner's board *from markdown files* into Project Tracker's own entities, one time; it is a
migration, not a live cross-module read. `Documented` from `BUSINESS_ARCHITECTURE.md:162`. Nothing in
the INT-001 verb list reads Financial Planner's CDS entities. Cross-module read capability is a
forward-looking requirement, not a slice-1 one — which changes how much the Design stage needs to buy
now.

---

## 9. Two Services Makes INT-001 Simpler, Not Harder

**If Project Tracker runs its own CAP project over its own model, the in-process MCP server resolves
one small model rooted at one folder — which is the simplest possible version of D-05, not a
compromised one.** The premise in `INT-001` ("D-05's in-process design assumes one resolvable CDS
model") **holds, and is satisfied by separation rather than threatened by it.**

The reasoning is the §3 singleton. An in-process MCP server is a Node process that sets `cds.root`,
loads a model, and calls `cds.connect.to()`. It gets exactly one root. Therefore:

- **Separate services (A/B/D).** The MCP process sets `cds.root` to `Project Tracker/`, `cds.load('*')`
  picks up `db/` + `srv/` (§3), and every verb targets a service in that model. Financial Planner is
  not loaded, not compiled, and not a dependency. `Inferred` — from `index.js:20-23`, `cds-env.js:156`
  and the verified `cds env get roots` output.
- **One composed service (C).** The MCP process must set `cds.root` to the *collector*, which loads
  both models. That means compiling Financial Planner's 128 database objects and 4 services on every
  MCP start; it means the collector's `cds.requires.db` is the only db config, so the MCP inherits
  Financial Planner's Postgres binding; and it means Financial Planner's `srv/` handlers — which
  include `node-cron` background jobs started via `cds.spawn()` and an `ENCRYPTION_KEY` requirement
  (`Financial Planner/CLAUDE.md`, Architecture and Encryption sections) — become side effects of
  starting the MCP server. `Inferred`, and the strongest single argument in this document against
  shape C for this repo.

**One caveat that cuts the other way.** Shape C is the only shape in which an MCP verb could ever read
Financial Planner data in-process without a second process being alive. If a future verb needs that,
shapes A/B/D push it onto the remote mechanism in §8, which reintroduces exactly the *"is the service
up?"* ambient dependency that D-05 rejected — for the cross-module read only, not for Project
Tracker's own state. That is a real trade-off and it belongs in the Design workshop, not here.

The sibling `mcp-over-cap-in-process` scout owns the mechanics of hosting `cds` inside the MCP process.
This section asserts only the model-scoping consequence.

---

## 10. Grading the Prior Assumptions

| Assumption                                                                                                                            | Grade                                  | Why                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root `CLAUDE.md`: cross-module data is genuinely undecided — "read each other's entities, share a database, or stay isolated is open" | **Holds**                              | All three are natively supported (§5, §8). CAP forecloses none of them. The decision is a real decision, not a discovered constraint.                                                                                                                                          |
| D-05 / INT-001: the in-process MCP assumes **one resolvable CDS model**                                                               | **Holds — and is easier than assumed** | One process gets one model by construction (§3). Separate services give INT-001 the smallest possible model; only shape C makes it larger (§9). The assumption was framed as a risk; it is closer to a guarantee.                                                              |
| Implied in OI-02's phrasing: "one CAP service or one per module" is the axis                                                          | **Partly refuted**                     | The axis is *one model or two*. "One service" is impossible without one model, and one model can still expose four services (Financial Planner already does). The database question is separable from both.                                                                    |
| D-03/D-16: different namespace roots are the collision hazard                                                                         | **Partly refuted**                     | Namespaces already prevent entity-table collisions (§6, `Verified`) and would do so even if both modules used `com.lifeos.*`. The real hazards are unnamespaced service views, `DRAFT_DraftAdministrativeData` and `cds_model` — none of which the namespace decision touches. |

**Nothing the module is already counting on turned out to be unsupported by CAP.** That was the one
flag this Ground topic was asked to raise, and it is not raised. The nearest thing to a problem is
`credentials.schema` being implemented but undocumented (§7), which is a durability risk, not an
unsupported configuration.

---

## 11. What We Could Not Establish

- **That a cross-package `using` actually compiles.** §4 verifies *resolution* by reproducing CAP's own
  algorithm. It does not verify that the CDS compiler accepts
  `using { com.financialplanner as fp } from 'financial-planner/db/reference/schema';` from a second
  project. The test that settles it, once a Project Tracker package exists: a two-line `.cds` file and
  `cds.compile.to.sql(await cds.load(['db','srv']), { dialect: 'postgres' })`. No spike was authorised,
  and I would not write a `.cds` file into the repo to run one. Side note for whoever does: the CLI
  form `cds compile db/ -2 sql` returned **empty output** in this session while the Node API returned
  128 statements — the CLI on PATH is the global cds-dk 9.7.2, not the project's 9.8.4. `Verified`.
- **What `cds deploy` actually does to a shared schema.** §7's DROP consequence is read off the code
  path, not observed. Settling it needs a throwaway Postgres database, two deploys, and `\dt`. This is
  the highest-value unrun test in this document.
- **Whether npm hoists `@sap/cds` once a second module declares it.** Today it is nested under
  `Financial Planner/` (§3, `Verified`). Whether adding an identical `^9` range to a second workspace
  package causes npm to hoist, nest twice, or nest once is npm-version-dependent and I did not
  simulate an install. If it nests twice, the `exit_on_multi_install` guard becomes live for shape C.
- **Whether `credentials.schema` survives a full deploy cycle.** The `SET search_path` is issued per
  session (`PostgresService.js:81-83`), but I did not confirm the deploy connection takes the same
  path, nor that CSV initial-data loading honours it. Searched: `@cap-js/postgres` source, README and
  CHANGELOG on disk; capire's PostgreSQL guide. Not found in any of them.
- **Whether `cds build` behaves across workspace packages.** capire's microservices guide shows
  `npx cds build ./orders --for nodejs --production --ws-pack`, but `--ws-pack` does not appear
  anywhere in the installed `@sap/cds` (`grep -rln "ws-pack"` → no matches), because `cds build` lives
  in `@sap/cds-dk`, which is not a workspace dependency at all — only a global 9.7.2 install. I did not
  inspect the global cds-dk.
- **Context7 was unavailable in this session** (`mcp__Context7__resolve-library-id` — "No such tool
  available"), so library documentation came from on-disk source first and `cap.cloud.sap` second.
  Where the two disagree, on-disk source at 9.8.4 / 2.1.3 is what will run.
- **Two capire URLs the brief and search results still cite are dead**:
  `/docs/guides/databases-postgres` and `/docs/guides/deployment/microservices` both 404 as of
  2026-07-26; the live paths are `/docs/guides/databases/postgres` and `/docs/guides/deploy/microservices`.

---

## 12. Implications for Design

OI-02's backend half decomposes into **three independent decisions**, not one. Design can answer them
separately, and answering the first does not force the others.

**Decision 1 — one CDS model or two?** This is the real "one service or one per module" question (§3,
§10). Committing to **one model** (shape C) buys: a single process, a single `cds deploy`, a single
`@cds-models/`, and the only in-process path to cross-module reads. It commits Design to a third
package (the collector), to Financial Planner's `srv/` handlers — cron jobs, `ENCRYPTION_KEY` — running
whenever Project Tracker or the MCP server runs, and to resolving service-name collisions before the
first deploy. Committing to **two models** buys the smallest possible MCP model surface (§9) and full
independence; it commits Design to two processes, two ports, two build steps, and to §8's remote
mechanism if a cross-module read is ever needed.

**Decision 2 — shared database, schema-per-module, or database-per-module?** The Data Model stage owns
this, and §6/§7 set the terms. **One database, one schema** requires reconciling four collision classes
and, on the evidence in §7, requires that only one project ever runs `cds deploy` — the collector
pattern, which effectively forces Decision 1 to "one model". **Schema-per-module** is implemented
(`credentials.schema`, `SET search_path`) and gives each module its own `cds_model`, at the cost of
depending on an option capire does not document and of a manual `CREATE SCHEMA`. **Database-per-module**
is what Financial Planner already does (`database: "financial_planner"`), needs no new mechanism, and
costs nothing locally beyond a second `createdb` — it forecloses only database-level cross-module joins.

**Decision 3 — does anything need to read across modules in slice 1?** §8 finds nothing that does:
CNV-002 migrates from markdown, and no INT-001 verb touches Financial Planner's entities. If Design
confirms that, Decisions 1 and 2 can be taken on operational-cost grounds alone, and the cross-module
read mechanism becomes a Wave-2 question with three documented answers already on the shelf.

**For the Tech Stack stage specifically**, four facts need a home regardless of which way the above go:
`@sap/cds` is not hoisted and a second module may create a second copy (§3); `cds build` depends on a
global, unpinned `@sap/cds-dk@9.7.2` that is a patch line behind the project's `@sap/cds@9.8.4` (§5);
the development loop runs on in-memory SQLite, so no Postgres decision is exercised until a profile
changes (§5); and `schema_evolution: "auto"` is on by default for Postgres without anyone having
configured it (§7).

**Cross-topic note for `ui5-multi-app-shell`.** That scout flagged that a shared shell forces one HTTP
*origin*, not one CAP process, and asked what this document concludes. It concludes nothing — Ground
mode — but it can confirm the mechanism: one origin serving two CAP models does require one process
(§3), so shell options (a) proxy, (b) absolute cross-origin URIs, and (c) one shell per module remain
the live set under any two-model outcome. §5 also surfaces a fourth: `app.serve(ep).from(pkg, folder)`
at `@sap/cds/server.js:110-118`, which mounts another package's static content on this server — the
same package-level composition that scout found, confirmed from the backend side.
