# Tech Stack

**Document ID:** TS-001
**Version:** 1.0
**Date:** 2026-08-15
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Sandro          | **Status → Approved.** All twelve Phase 5 coverage checks met; the approval gate at step 0 of Phase 6 was answered before the stage closed — the second stage running, after `DM-001`.                                                                                                                                                                                                                                |
| 2026-08-15 | Sandro & Claude | Initial creation from the Tech Stack stage. Settles the **5** questions the design documents defer here by name across **14** files. Records D-176 through D-185. **D-141's reverse proxy is EXECUTED and closed** — `$batch` POST and an OData write both green in a real browser under `NODE_ENV=production`, with no CORS header of any kind. Mints **R11**. Two measured defects found, one of them cross-module. |

---

## 2. Summary

| Layer                  | Choice                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Language**           | TypeScript throughout — `srv/`, `db/`, `app/`, `mcp/`                                                                                     |
| **Backend framework**  | SAP CAP, `@sap/cds` **9.8.4 exactly** (D-34)                                                                                              |
| **Frontend**           | SAPUI5 **1.136.16**, Fiori Elements FPM (DS-001 §4, D-144)                                                                                |
| **Database**           | PostgreSQL 17.6, its own database `project_tracker` (D-29), proven by R1 (D-170)                                                          |
| **API protocols**      | OData V4 for the browser; **MCP stdio** for the agent fleet — one implementation, two transports (D-145, SPEC-01 BR-22a)                  |
| **Runtime**            | Node.js **22.19.0** — measured, and **pinned by nothing** (§3)                                                                            |
| **Processes**          | **4** in a running system, **2** of them this module's (§4)                                                                               |
| **CDS services**       | **1** — `TrackerService` at `/service/trackerSvcs` (D-178)                                                                                |
| **New libraries**      | **2** — `@modelcontextprotocol/sdk` and `zod`. **7** the exemplar carries are not inherited (D-179)                                       |
| **TypeScript loading** | `cds serve` via the dk CLI supplies **both** of D-33's levers automatically; **`cds-serve` supplies neither and answers 501** (D-180)     |
| **Credential**         | A dedicated non-superuser `project_tracker` role; password as `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD` from a **gitignored `.env`** (D-181) |
| **Runtime flags**      | `assert_integrity: 'DB'` in **`.cdsrc.json`**, not `package.json` — **correcting D-173** (D-182)                                          |
| **Dev-loop database**  | **Postgres**, not the inherited in-memory SQLite. SQLite survives as the **test** profile only (D-183)                                    |
| **Origin**             | **One** — `http://localhost:4000`, a tracked **zero-dependency** Node reverse proxy fronting :4004 and :4005 (D-184). The **47-line** delivered script is `S-00`'s; §11.1's "31-line" is the spike it implements |
| **Risk R9 residual**   | **EXECUTED and CLOSED.** The proxy D-141 ruled for is proven, in a real browser, in both profiles (D-184)                                 |
| **Risk R11**           | **Minted.** `cds` is a globally-installed, unpinned `@sap/cds-dk@9.7.2` that nothing in the repo holds (D-185)                            |
| **Deliverable**        | The document, plus **one** `.gitignore` line. Every other config edit is ruled here and applied by the first build story (D-176)          |
| **Amendments caused**  | **6** — 4 applied in-session, **2 raised and owed** (§15)                                                                                 |
| **Open items**         | **None.** All five closed at Data Model; register checked, not assumed (§17)                                                              |

---

## 3. Language & Runtime

Every version below was measured on this machine this session. **The pin column is the point of the
table** — a version nothing holds is a shared, silent lever, which is the lesson D-34 was logged for.

| Component               | Declared           | **Resolved** | Pinned by                                                                                                          |
| ----------------------- | ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Node.js**             | —                  | **22.19.0**  | **Nothing.** No `engines` field in any of the three `package.json`, no `.nvmrc`                                    |
| **npm**                 | —                  | 10.9.3       | **Nothing**                                                                                                        |
| **`@sap/cds`**          | `9.8.4`            | **9.8.4**    | Exact, at the root **and** both modules (D-34)                                                                     |
| **`@sap/cds-dk`**       | — (global install) | **9.7.2**    | **Nothing** — not a repo dependency at all. See **R11** (§16)                                                      |
| **`@sap/cds-compiler`** | — (transitive)     | 6.9.3        | `@sap/cds` 9.8.4                                                                                                   |
| **TypeScript**          | `^5`               | 5.9.3        | Caret — floats within 5.x                                                                                          |
| **`tsx`**               | `^4`               | 4.23.1       | Caret                                                                                                              |
| **SAPUI5 runtime**      | —                  | **1.136.16** | The CDN URL at `Financial Planner/app/index.html:16`, and `minUI5Version` in **5 of the 6** manifests under `app/` |
| **`@sapui5/types`**     | `^1.136.16`        | **1.150.0**  | Caret — **14 minors ahead of the runtime**. See §13                                                                |
| **`@cap-js/postgres`**  | `^2`               | 2.3.0        | Caret                                                                                                              |
| **`@cap-js/sqlite`**    | `^2.2.0`           | 2.4.0        | Caret                                                                                                              |
| **PostgreSQL**          | —                  | **17.6**     | The local Windows service (D-170)                                                                                  |

**Four of these are findings rather than choices.**

1. **Node is unpinned repo-wide.** `@sap/cds` declares only `engines.node >=20`, and the root declares
   `@types/node: ^20` while the runtime is 22.19.0 — the type surface and the runtime are a major
   version apart. Not raised to a risk because nothing has broken on it; recorded so the next person
   who upgrades Node knows nothing was holding it.
2. **`@sap/cds-dk` is a globally-installed 9.7.2 that no file in this repo mentions.** It is what the
   `cds` command actually is, it is a patch line behind the pinned `@sap/cds@9.8.4`, and D-180 now
   makes this module's start command depend on it. Minted as **R11**.
3. **`@sapui5/types` resolves 1.150.0 against a 1.136.16 runtime.** §13.
4. **`@sap/cds` _is_ hoisted, and `research/cap-multi-module-backend.md` §3 says it is not.** That
   document warns that "`@sap/cds` is not hoisted and a second module may create a second copy".
   Measured: **one** copy, at `C:\Projects\Life OS\node_modules\@sap\cds`, and **none** under either
   module. The claim was true when written and D-34 is why it is not now — pinning the same exact
   version at the root and in both modules is precisely what produces one hoisted runtime. Corrected
   in `research/README.md` §7 rather than left to mislead the next module (§15).

---

## 4. Process Topology (D-177)

A layer diagram is not a process list. **Four processes exist in a running system; two are this
module's.** They are enumerated because D-05 puts an MCP server and a browser on the same database,
and no prior document has ever said how many things are running.

| #   | Process              | Owner             | Command                                  | Serves                                                                         | Shares                 |
| --- | -------------------- | ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------ | ---------------------- |
| 1   | **CAP HTTP server**  | Project Tracker   | `cds serve` on **:4005**                 | `TrackerService` — the `ProjectView` read path and the two Forms' write path   | `project_tracker` DB   |
| 2   | **MCP stdio server** | Project Tracker   | `mcp/server.ts`, spawned per client      | INT-001's eleven verbs. **No HTTP server, no listening socket** (SPEC-01 §3.1) | `project_tracker` DB   |
| 3   | **CAP HTTP server**  | Financial Planner | `cds serve` on **:4004**                 | Its four services, `app/shell`, `app/index.html` and every hosted component    | `financial_planner` DB |
| 4   | **Reverse proxy**    | **Shared**        | `node …/serveOneOrigin.mjs` on **:4000** | The single origin (§11)                                                        | Nothing                |

**Processes 1 and 2 hold the same database at the same time, and that is the ruling that needed
making.** Postgres arbitrates it; nothing in CAP does. Three facts make it safe rather than merely
tolerable:

- **Writes are serialized inside process 2** (SPEC-01 BR-13), so the verb layer never races itself.
- **Process 1 is read-mostly.** Its only writes are FRM-001's and FRM-002's, through D-79's shared
  create-handler, and both are Sandro at a keyboard rather than a concurrent agent.
- **Neither process caches rows.** `ProjectView`'s derived scalars are filled by an `after READ`
  handler per request (DM-001 §11.1), so a verb write in process 2 is visible to the next
  `project_view` read in process 1 with no invalidation step.

**Process 2 needs no port, and that is load-bearing.** R1 measured `cds.app === undefined` on Postgres
(D-170), so the MCP server holds a database connection and nothing else — it does not contend for a
socket with process 1 and does not need process 1 running.

**One residual, stated:** long-running stability of a stdio server holding a Postgres pool across a
multi-hour session, and whether it survives laptop sleep, is **Unknown** — `research/mcp-over-cap-in-process.md`
§12 says so and this stage did not settle it. It is `INT-001`'s to measure when it is built; a spike
lasting five seconds cannot answer it and neither can a document.

---

## 5. CDS Service Split (D-178)

**One service. `TrackerService`, mounted at `/service/trackerSvcs`.**

| Service          | Path                   | Exposes                                                                                                                                    | Serves                       |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| `TrackerService` | `/service/trackerSvcs` | `ProjectView` and `TaskQueueItem` read-only (DM-001 §11); `Initiative`, `Milestone`, `Workspace` writable for D-79's shared create-handler | Every UI object, and INT-001 |

**Why one.** The exemplar's four services partition four problem domains with four independent
consumer sets (`Financial Planner` D-49). This module has **one** domain, **one** page (IA-001 §4) and
**one** write path — D-05 removes the CRUD surface on purpose, so a second service would partition a
surface that has a single consumer. `cds.serve('all').from(model)` then `cds.connect.to(name)`
(SPEC-01 §3.1, D-28) names exactly one service, and the name above is that name.

**Why the path.** `/service/{domain}Svcs` is the house form — Financial Planner's four are
`transactionSvcs`, `churningSvcs`, `budgetSvcs` and `adminSvcs`, all at `manifest.json:13`. It also
gives the proxy a **single unambiguous prefix** (§11), so the route table is one row rather than a
per-service list that drifts.

`Workspace` carries `@cds.redirection.target: true` here, without which the service does not compile —
D-174, measured while running R1.

---

## 6. Key Libraries (D-179)

**Two new dependencies.** Everything else the module needs is already declared.

| Need                           | Library                     | Version             | Required by                                                                                 |
| ------------------------------ | --------------------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| MCP protocol + stdio transport | `@modelcontextprotocol/sdk` | `^1.29.0`           | `INT-001` (SPEC-01 §3.1)                                                                    |
| Typed tool-input schemas       | `zod`                       | as the SDK requires | `INT-001` — typed inputs are what make a malformed write fail loudly at the boundary (D-05) |
| Postgres driver                | `@cap-js/postgres`          | `^2` → 2.3.0        | D-29. **Already declared**                                                                  |
| SQLite driver (test profile)   | `@cap-js/sqlite`            | `^2.2.0` → 2.4.0    | §10. **Already declared**                                                                   |

`research/mcp-over-cap-in-process.md` §6 loaded `@sap/cds` 9.8.4 (CommonJS) and
`@modelcontextprotocol/sdk` 1.29.0 (dual ESM/CJS build) into **one** Node 22.19.0 process from a
native-ESM entry point, and SAP's own `@cap-js/mcp@1.2.0` depends on the same SDK range against
`@sap/cds >=8`. The combination is executed, not assumed.

### 6.1 What is not inherited from the exemplar — stated, not omitted

Seven of the exemplar's eight libraries are **not** taken, and each absence is a ruling rather than an
oversight.

| Exemplar library      | Not taken because                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `axios`               | No external HTTP integration in slice 1. `INT-001` is stdio and in-process                                                                   |
| `papaparse`           | `INT-007` **writes** CSV and parses none. `cds.utils.csv.serialize` is broken for tabular data (D-31), so it hand-writes — no parser is owed |
| `fuse.js`             | No search surface. Search is deferred (PLAN.md §4)                                                                                           |
| `node-cron`           | **This module schedules nothing** (`CLAUDE.md` §Architecture)                                                                                |
| Node `crypto`         | **This module encrypts nothing** (same). No `ENCRYPTION_KEY`, no `EncryptionUtility`                                                         |
| `cheerio`             | No scraping. Wave 4 of the other module                                                                                                      |
| VizFrame / ApexCharts | **No charts** — DS-001 §11 rules it, D-150                                                                                                   |

---

## 7. Implementation Loading (D-180)

`Project Tracker/CLAUDE.md` §Loading a TypeScript Service Implementation states in terms that **"the
ruling is the Tech Stack stage's to make"**, D-33 having recorded the mechanism and not the choice.
This section is that ruling — and it changes what D-33 implied, because the CLI already does the work.

### 7.1 What was measured

A scratch CAP project outside every module: one `.cds` service, one `.ts` implementation importing a
sibling as `./types.js` (the `module: Node16` idiom that defeats Node's strip-only mode), and a
`tsconfig.json` at `cds.root`. **Same tree, two entry points:**

| Entry point                        | Service impl resolved         | `ping()` result                                   |
| ---------------------------------- | ----------------------------- | ------------------------------------------------- |
| `npx cds serve` — the **dk CLI**   | `srv/probe-service.ts`        | **200** — `typescript-impl-loaded`                |
| `npx cds-serve` — `@sap/cds`'s bin | `@sap/cds/srv/app-service.js` | **501** — `Service "ProbeService" has no handler` |

**The cause, read in the installed source.** `@sap/cds-dk@9.7.2` `bin/cds.js` `_prepareTsIfNeeded`
runs when the command is `serve` (directly or through `watch`) **and a `tsconfig.json` exists at
`cds.root`**: it loads `tsx/cjs` itself and sets `process.env.CDS_TYPESCRIPT = 'tsx'`. Both of D-33's
"two required, independent levers" are supplied automatically. `cds-serve` is `@sap/cds/bin/serve.js`,
invoked directly, and never passes through that file — it only _reads_ `CDS_TYPESCRIPT`
(`bin/serve.js:267`) to prefer `server.ts` over `server.js`.

**Project Tracker has a `tsconfig.json` at its root**, so the CLI path works today with no
configuration at all.

### 7.2 The ruling, per invocation path

| Path                           | Command                                                | Levers              | How                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dev loop**                   | `cds watch`                                            | Both, **automatic** | dk CLI, `tsconfig.json` present                                                                                                                                 |
| **`npm start`**                | **`cds serve --port 4005`** — changed from `cds-serve` | Both, **automatic** | Same. The current script is measured broken for a TypeScript impl. **The port is not optional** — bare `cds serve` binds :4004, the other module's port (D-214) |
| **MCP server**                 | `mcp/server.ts` under `tsx`                            | Both, **explicit**  | The launcher sets `process.env.CDS_TYPESCRIPT` **before** requiring `@sap/cds`, and runs under a `tsx` loader. Neither is supplied for it                       |
| **`scripts/recordTestRun.ts`** | `tsx …` (INT-004, D-103)                               | Both, **explicit**  | Same shape. It also `process.chdir`s to this module's root before requiring `@sap/cds`                                                                          |
| **`cds.test` suites**          | Jest                                                   | **Unsettled here**  | Financial Planner's suites carry the comment "cds.test cannot load the TypeScript service impl". **Handed to Test Strategy (stage 11) by name**                 |

**The `npm start` change is not cosmetic and its cost is stated.** It makes this module's start command
depend on a globally-installed `@sap/cds-dk@9.7.2` that nothing in the repo pins — **R11** (§16). The
alternatives were weighed and rejected: an inline `CDS_TYPESCRIPT=true cds-serve` **fails on this
machine** (measured — npm falls back to `cmd.exe`, which does not recognise the POSIX form, and
`npm config get script-shell` is `null`); pinning `@sap/cds-dk` as a root devDependency would fix R11
outright but drags a large package that itself depends on `@sap/cds` into the hoisted tree, which is
precisely the hazard D-34 exists for, mid-sprint on the other module; and a hand-written launcher
re-implements what the CLI already does correctly.

**This is a cross-module defect, and it is raised rather than fixed** (§15). `Financial Planner/package.json`
declares `"start": "cds-serve"` over **four** `.ts` service implementations. It has evidently never
bitten, because that module is developed under `cds watch` — which is exactly why it would surface at
the worst moment.

---

## 8. Database Binding & Secrets (D-181)

DM-001 §15.1 hands this stage the question by name: both modules declare `"password": ""`, and the
credential that made R1 pass was supplied through the environment.

| Element          | Ruling                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| Host / port      | `localhost:5432`                                                                |
| Database         | `project_tracker` — created during R1 (D-170), PostgreSQL **17.6**              |
| **Role**         | A **dedicated non-superuser `project_tracker` role**, owning only that database |
| **Transport**    | `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD` in the process environment               |
| **Source**       | A **gitignored `.env`** at the module root, in the dev loop                     |
| **Ignore rule**  | `.env` added to `Project Tracker/.gitignore` — **applied in-session** (§15)     |
| `"password": ""` | **Removed** from `package.json`, not set to a value                             |

**Why a dedicated role.** R1 connected as the `postgres` superuser. This module's write path is an MCP
server that an agent fleet drives, and a superuser binding gives a bug in that path reach over every
database on the machine — including `financial_planner`, which holds Sandro's card portfolio and which
D-29 separated structurally. A role that owns one database makes that separation enforced rather than
merely intended. **The role does not exist yet:** creating it is a change to a Postgres installation
outside this repo, so it is the one **prerequisite** of the first build story rather than something
this stage did unasked (D-168's precedent).

**Why the empty string is removed rather than filled.** D-168 measured the failure precisely: an empty
password is falsy, so `pg` treats it as absent and throws a client-side type guard —
`SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` — **before the handshake begins**.
The server never sees an attempt. Removing the key lets the environment variable supply it; leaving it
declared documents a value nobody uses.

**Why an environment variable rather than a config file.** Measured in the installed runtime
(`@sap/cds/lib/env/cds-env.js:235-249`): any `CDS_*` process variable is mapped into `cds.env` by
path — `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD` becomes `cds.requires.db.credentials.password` — and it
is applied **last**, so it overrides whatever the config declares. That works under every profile.

### 8.1 The constraint that decides the `.env` half — measured

**CAP reads `.env` only when the `development` profile is active.** `cds-env.js:207-216`:
`default-env.json` is added to `process.env` unconditionally, and the `.env` read sits **inside**
`if (this._profiles.has('development'))`.

Consequence, stated plainly so nobody debugs it later: **a `.env` holding the password works in the dev
loop and silently does nothing under `NODE_ENV=production`.** Any non-development invocation must
supply `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD` in the real environment. This module's normal modes are
all development (§10), so the gap is not on the current path — it is on the first path anyone adds.

---

## 9. Runtime Configuration (D-182)

Configuration the **model** requires, each with the file that carries it. D-173 states in terms that
"naming the file and its final placement is the Tech Stack stage's".

| Setting                         | Value                 | **File**                   | Required by                                                              |
| ------------------------------- | --------------------- | -------------------------- | ------------------------------------------------------------------------ |
| `cds.features.assert_integrity` | `'DB'`                | **`.cdsrc.json`**          | D-173 — without it twelve code lists' referential integrity is imaginary |
| `cds.requires.db`               | postgres              | `package.json` `cds` block | D-29                                                                     |
| `cds.i18n.folders`              | `srv/_i18n`           | `package.json` `cds` block | The shared i18n tiers. **Already declared**                              |
| `schema_evolution`              | **left at `auto`**    | — (driver default)         | D-29 — the fourth of RSH-002 §5's homeless facts. See below              |
| `cds.fiori.routes`              | **untouched**         | —                          | R9's workaround does not apply under one origin (§11)                    |
| CORS                            | **none, of any kind** | —                          | Measured unnecessary under one origin (§11.2)                            |

**`schema_evolution` is left alone deliberately, which is a ruling rather than an omission.**
`research/cap-multi-module-backend.md` §7 flags that the Postgres driver turns it on by default
without anyone configuring it, and R4 is the hazard that follows — two projects deploying into one
schema each read the other's `cds_model` snapshot as prior and emit `DROP`s. **D-29 dissolves the
hazard by giving each module its own database**, so there is nothing to configure away. D-175's two
reproductions stand as the operational warning: a deploy from a **narrower** model is
destructive-by-intent and is refused, and `cds deploy` cannot add a `not null` column to a populated
table. Both bind `CNV-002`/`CNV-003` ordering and neither is fixed by a flag.

**`.cdsrc.json`, not `package.json` — this corrects D-173.** That decision said the flag "belongs in
this module's `package.json` `cds` block". Measured: `Financial Planner/.cdsrc.json:5-6` **already
carries** `"features": { "assert_integrity": "db" }`, so the house already has a location and D-173
guessed a different one. Project Tracker gains a `.cdsrc.json` of its own; the ruling D-173 made is
unchanged, only the file it named.

**And the casing is not load-bearing, which D-173 implies it is.** The compiler's option validator
lowercases both sides — `@sap/cds-compiler/lib/api/validate.js:36-46` and `:147`,
`generateStringValidator(['DB','RT'])` — so Financial Planner's `"db"` and D-173's `'DB'` are equally
valid. What is genuinely rejected is the literal `true`, and the default is `false`
(`@sap/cds/lib/env/defaults.js:46`).

### 9.1 The stdout guard — configuration, not a flag

The MCP process (§4, process 2) must reassign `cds.log.Logger` and the bare `console.*` methods to
`process.stderr`, and call `cds.deploy(model, { silent: true })`.

This is here rather than in SPEC-01 because it is runtime configuration and because **the failure is
silent**: `StdioServerTransport.send()` writes newline-delimited JSON to `process.stdout` while
`cds.log`'s default logger maps `info` to `console.log`, so a single log line lands **inside** the live
JSON-RPC stream — and the SDK's `ReadBuffer` reports a parse error and carries on, so every call still
completes. Measured in `research/mcp-over-cap-in-process.md` §5, with the guard verified to clean the
stream. The hook is documented in the dependency's own source (`lib/log/cds-log.js:80-88`).

---

## 10. Profiles & Run Modes (D-183)

| Mode         | Command                   | Profile       | Database                       | What it never exercises                                                                                                            |
| ------------ | ------------------------- | ------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Dev loop** | `cds watch`               | `development` | **Postgres `project_tracker`** | Production-profile behaviour (§8.1, §10.1)                                                                                         |
| **Start**    | `npm start` → `cds serve` | `development` | Postgres                       | Same                                                                                                                               |
| **Deploy**   | `cds deploy`              | `development` | Postgres                       | —                                                                                                                                  |
| **Tests**    | `cds.test`                | `test`        | in-memory SQLite               | Postgres types, `assert_integrity: 'DB'`'s `23503` rejection, and every constraint whose mechanism is the database rather than CAP |

**The dev loop moves to Postgres, and that is a change from the inherited scaffold.** Both modules
currently carry a `[development]` block pinning `:memory:` SQLite, so — as
`research/cap-multi-module-backend.md` §5 flagged with no home — **no Postgres decision is exercised
until a profile changes**. For this module that is not merely untidy: a `cds watch` against `:memory:`
discards the board on every restart, which is the exact property the module exists to supply. R1
proved Postgres works (D-170). The `[development]` block is therefore removed and SQLite moves to a
`[test]` profile.

**The test profile keeps SQLite deliberately.** Suites stay fast and isolated, and it matches the
exemplar's six integration suites. The cost is named in the last column and is **Test Strategy's to
carry**: a constraint enforced by Postgres rather than by CAP cannot be asserted there.

### 10.1 Measured: production does not deploy an in-memory database

Found while executing R9's residual, and worth recording where a migration story will look. Under
`NODE_ENV=production` with `credentials.url: ':memory:'`, the server boots cleanly and the **first read
fails** — `SqliteError: no such table: ProbeService_Probes`, HTTP 500. CAP auto-deploys an in-memory
database under the development profile and **not** under production. A file-backed database plus an
explicit `cds deploy` was required before the same server answered.

---

## 11. Origin & Serving (D-184)

**One origin: `http://localhost:4000`, served by a reverse proxy fronting both CAP processes.** Every
manifest keeps its relative `/service/…` URI unchanged; the proxy routes by path prefix.

| Prefix                 | Upstream | Process                        |
| ---------------------- | -------- | ------------------------------ |
| `/service/trackerSvcs` | `:4005`  | Project Tracker's CAP server   |
| _everything else_      | `:4004`  | Financial Planner's CAP server |

Ports: Financial Planner **4004** (its existing default), Project Tracker **4005**, proxy **4000**.

**Home: a tracked, zero-dependency Node script in `Standards (Technical + Linting)/scripts/`.** It
fronts both modules, so it belongs to neither, and the root `CLAUDE.md` forbids a non-module folder at
the repo root — the Standards folder is the only shared home available. It takes **no** module name:
its route table is prefixes and ports, which is configuration, so the shared-linter rule that a shared
script may not name a module is honoured by construction. ~~**The script itself is written by the first
build story** (D-176)~~ — **written at `S-00`, 2026-08-16**; this section is the proven design it
implements.

**One thing the script adds to this design, and it is not a change to it (D-216).** The four route
values read from `ONE_ORIGIN_PORT`, `ONE_ORIGIN_PREFIX`, `ONE_ORIGIN_PREFIX_PORT` and
`ONE_ORIGIN_DEFAULT_PORT`, **defaulting to exactly the topology above** — so `node …/serveOneOrigin.mjs`
with no environment is this table. The overrides exist because `S-00`'s test drives the real script,
and a suite that must bind 4004 would either collide with a running dev server or, worse, get answered
by it.

### 11.1 R9's residual — executed (D-184)

**Grade: `Inferred` → `Verified`.** D-141 ruled the position and said in terms that "the reverse proxy
is itself untested… its execution belongs to the Tech Stack stage". IA-001 §7.4, DS-001 §15, TH-001,
BA-001 §8 and SPEC-04 … SPEC-07 all repeat the assignment.

**What ran.** Two CAP 9.8.4 servers in a scratch project outside every module — `serverA` on :4004
serving a host page plus a UI5 1.136.16 component and its own OData service, `serverB` on :4005 serving
a second OData service at `/service/probe` — behind a **31-line** `node:http` reverse proxy on :4000
routing by path prefix. Driven in a real browser, then repeated under `NODE_ENV=production` on both,
then again under `cds watch`. The scratch project was deleted afterwards.

| Check                                                            | Result                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Host page, manifest and component load through the proxy         | **Pass**                                                            |
| `$metadata` GET reaches the **other** process                    | **Pass** — 200                                                      |
| **`$batch` POST** — the request R9 measured failing cross-origin | **Pass** — 200, in the browser                                      |
| **An OData write** (`bindList().create()` → `created()`)         | **Pass** — the row read back on the next request                    |
| The same, under `NODE_ENV=production` on both processes          | **Pass** — where cross-origin gave a blank page                     |
| The same, with the app process under `cds watch`                 | **Pass**                                                            |
| CORS headers on any response                                     | **None, of any kind** — and none needed                             |
| `OPTIONS` preflights issued                                      | **Zero** — same-origin, so the question does not arise              |
| Manifest changes required                                        | **Zero** — the relative `/service/…` URI is untouched               |
| `cds.fiori.routes: false` required                               | **No** — the boot crash R9 measured needs an absolute `http://` URI |
| One upstream down                                                | **502**, naming the upstream port                                   |

**The finding is that the cheap option is the complete one.** D-140 proved multi-origin composition
needs three coordinated, hand-maintained changes across two modules and left credentialed **write**
traffic untested — the case D-82 widened R9 to cover. One origin makes all three unnecessary, and the
write it left unproven is now measured green in the profile that previously produced a blank page.

### 11.2 What this did not establish

- **No `upgrade` handler.** The proxy forwards HTTP only; a WebSocket upgrade would not traverse it.
  Measured as currently harmless: `cds watch` at 9.8.4 injected **no** livereload snippet into a static
  `app/index.html` (the served bytes are identical to the source), and its livereload server listens
  **separately on :35729**, so nothing about live reload crosses the proxy today. A future app that
  needs WebSockets needs the handler.
- **Auth was `dummy` throughout**, as at IA. Both modules are single-user with no auth strategy
  configured, so this matches production for them — but credentialed traffic is still unexercised.
- **The spike used a classic AMD `Component.js`**, not the repo's `cds-plugin-ui5` +
  `ui5-tooling-transpile` toolchain, and tested no Fiori Elements app. What it proves is the
  **transport**; §13's toolchain is unchanged by it.

---

## 12. Project Structure

**Every source folder is still empty** (D-160). The tree below is the **destination**, not a
description — it says where the first build story puts things.

```text
../                                     Life OS root — `npm install` runs HERE
  package.json                          Shared devDeps + the pinned CAP runtime
  Standards (Technical + Linting)/
    scripts/
      serveOneOrigin.mjs                ← NEW (§11). Zero-dependency, shared, names no module
Project Tracker/
  .cdsrc.json                           ← NEW (§9). assert_integrity: 'DB'
  .env                                  ← NEW, GITIGNORED (§8). The DB password
  .gitignore                            ← gains `.env` (applied in-session)
  package.json                          cds block, deps, `start: cds serve` (§7)
  tsconfig.json                         Extends the shared base — and is what makes the CLI load .ts (§7.1)
  eslint.config.mjs
  db/
    schema.cds                          The 25 persisted entities (DM-001)
    data/                               Code-list seeds (CNV-002)
  srv/
    tracker-service.cds                 TrackerService (§5)
    tracker-service.ts                  Entry point
    _i18n/                              i18n.properties + messages.properties
    modules/{domain}/                   Facade / Service / DataService / Validator / Mapper
  mcp/                                  ← sibling of db/ srv/ app/ test/, NOT under srv/ (D-44)
    server.ts                           Sets CDS_TYPESCRIPT, guards stdout (§7.2, §9.1)
    verbs/                              The eleven intent verbs (SPEC-01)
  app/
    project-view/                       The one FPM page (IA-001 §4, DS-001 §4)
      webapp/ annotations/              manifest, Component.ts, view, annotations
  scripts/
    recordTestRun.ts                    INT-004 (D-103) — the module's only script
  test/                                 Structure is Test Strategy's (stage 11)
```

Two placements are inherited rulings rather than choices here: `mcp/` is a **sibling** of `srv/`
(D-44), and `scripts/recordTestRun.ts` lives in this module rather than the shared linter folder
because it `process.chdir`s to a named module (D-103).

---

## 13. Frontend Toolchain

Inherited from the exemplar in full; nothing here is a new choice.

| Element        | Value                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Authoring      | TypeScript, ES modules and ES classes, `@namespace` JSDoc mandatory on every UI5 class                       |
| Transpile      | `ui5-tooling-transpile` (Babel) → classic `sap.ui.define` AMD, at serve/build                                |
| Plugin         | `cds-plugin-ui5`                                                                                             |
| Per-app files  | `package.json`, `ui5.yaml`, `tsconfig.json` per app folder                                                   |
| Runtime        | SAPUI5 **1.136.16** from `https://ui5.sap.com/1.136.16/…`, pinned in Financial Planner's `app/index.html:16` |
| Framework      | Fiori Elements FPM, `sap.fe.core` + `sap.fe.macros` per component (DS-001 §4)                                |
| Shared library | `Financial Planner/app/shared` at `/shared` — a cross-module dependency D-147 already priced                 |

**One finding.** `@sapui5/types` is declared `^1.136.16` in **both** modules and resolves to
**1.150.0** — fourteen minor versions ahead of the pinned runtime. The compiler would therefore accept
UI5 APIs that do not exist at 1.136.16, and the failure would appear in a browser rather than in
`tsc`. Raised, not fixed (§15): it is a shared dependency change touching a module mid-sprint, and it
is the same class of silent lever as D-34.

---

## 14. Deployment & Local Run

Local only. No Docker, no BTP, no cloud (PSV §7.2).

| Step | Command                                                                  | Note                                                                               |
| ---- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 1    | `createdb project_tracker`                                               | Already exists from R1 (D-170); skip if present                                    |
| 2    | `CREATE ROLE project_tracker LOGIN PASSWORD …; GRANT …`                  | **Prerequisite of the first build story** (§8), not run here                       |
| 3    | Write `Project Tracker/.env` with `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD` | Gitignored (§8)                                                                    |
| 4    | `npm run deploy` → `cds deploy`                                          | Postgres. **Cannot add a `not null` column to a populated table** (D-175)          |
| 5    | `npm start` → **`cds serve`** on :4005                                   | **Not `cds-serve`** (§7)                                                           |
| 6    | `npm start` in Financial Planner, on :4004                               | Serves the shell and `index.html`                                                  |
| 7    | `node "Standards (Technical + Linting)/scripts/serveOneOrigin.mjs"`      | :4000 (§11)                                                                        |
| 8    | Open `http://localhost:4000/index.html`                                  | **The only URL a browser should ever use** — :4004 and :4005 directly reproduce R9 |
| 9    | The MCP server is spawned by its client                                  | Registered by a tracked installer; `.mcp.json` is gitignored (D-44)                |

Step 8 is the operational half of D-141: the direct ports still work for a single module and break the
moment a page composes both, which is the failure R9 measured.

---

## 15. Amendments

**Six. Four applied in-session; two raised and owed.**

| #   | Target                                                                 | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Status                |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | `Project Tracker/.gitignore`                                           | Gains `.env`. The file did not list it, so §8's credential would have been committable — a ruling that creates the hazard it exists to remove (D-176, D-181)                                                                                                                                                                                                                                                                                                      | **Applied**           |
| 2   | [CLAUDE.md](../CLAUDE.md) §Loading a TypeScript Service Implementation | The deferred ruling is made (D-180), and the section is corrected: the dk CLI supplies **both** levers automatically, and `cds-serve` supplies neither                                                                                                                                                                                                                                                                                                            | **Applied**           |
| 3   | [DECISIONS_LOG.md](DECISIONS_LOG.md) **D-173**                         | Its "the flag belongs in this module's `package.json` `cds` block" is superseded — the house location is `.cdsrc.json`, measured on disk. The ruling is unchanged (D-182)                                                                                                                                                                                                                                                                                         | **Applied**           |
| 4   | [research/README.md](../research/README.md) §5 and §7                  | R9's row records the proxy as executed; **R11 is minted**; §7's Tech Stack row records that RSH-002 §5's four homeless facts now have one, and that **RSH-002 §3's "`@sap/cds` is not hoisted" is false today** — measured, one copy at the root and none under either module (D-184, D-185). §7 is maintained rather than left as a routing entry, which is the **fourth** occurrence of the defect D-135 named and the first where the consuming stage fixed it | **Applied**           |
| 5   | **`Financial Planner/package.json`** — `"start": "cds-serve"`          | The same defect measured in §7.1, over **four** `.ts` services. A runtime behaviour change in another module, mid-sprint W1-S3                                                                                                                                                                                                                                                                                                                                    | **Raised — Sandro's** |
| 6   | **`@sapui5/types: ^1.136.16`** in both modules                         | Resolves **1.150.0** against a 1.136.16 runtime (§13). A shared dependency change touching a module mid-sprint                                                                                                                                                                                                                                                                                                                                                    | **Raised — Sandro's** |

---

## 16. Risks Assigned to This Stage

**One assigned, and it is executed. One minted.** `research/README.md` §7 routes **Tech Stack →
RSH-001 (R2), RSH-002 and RSH-003**; §5's live rows were checked rather than assumed.

| Risk            | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R9 residual** | **EXECUTED and CLOSED** (§11.1, D-184). Grade `Inferred` → **`Verified`**. The proxy D-141 ruled for is proven end to end in a real browser, in both profiles                                                                                                                                                                                                                                                               |
| **R1 residual** | **CLOSED** (§8, D-181). "Where the secret lives" is ruled: a dedicated role, an env var, a gitignored `.env` with its ignore line applied                                                                                                                                                                                                                                                                                   |
| ~~**R2**~~      | Settled at Scaffold (D-33); **the formal ruling it left open is made here** (§7, D-180)                                                                                                                                                                                                                                                                                                                                     |
| **R4**          | Not this stage's — `INT-007`'s build (D-121). Not re-owned. D-175's two reproductions stand                                                                                                                                                                                                                                                                                                                                 |
| **R7**          | Not this stage's — `INT-007`'s build (D-121)                                                                                                                                                                                                                                                                                                                                                                                |
| **R10**         | Not this stage's — `CNV-005` (D-119)                                                                                                                                                                                                                                                                                                                                                                                        |
| **R11**         | **MINTED HERE** (D-185). `cds` is a globally-installed, unpinned `@sap/cds-dk@9.7.2` — not a repo dependency at all, a patch line behind the pinned `@sap/cds@9.8.4`, and §7 makes `npm start` depend on it. **Owner: whoever next raises the `@sap/cds` pin** (D-34's "its own change, suite green either side"). **Settled by** adding `@sap/cds-dk` as a pinned root devDependency with the suite green before and after |

---

## 17. Open Items Resolved

**None — and that is measured, not assumed.** All five open items were closed before this stage
opened: OI-01 (D-31), OI-02 (D-29, D-30), OI-03 (D-35), OI-04 (D-70) and **OI-05 (D-161)**, the last,
at Data Model. `PSV-001` §8 is the register and it carries no sixth row. This stage opens none.

---

## 18. Decisions Reference

| ID        | Title                                                                               | Summary                                                                                                                                                                                                                                                                                  |
| --------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-176** | The Tech Stack stage ships the document plus one `.gitignore` line                  | D-160 keeps code out of Design and config is not schema — but ruling that a secret lives in `.env` while `.env` is committable creates the hazard the ruling removes. Every other config edit is specified here and applied by the first build story                                     |
| **D-177** | Four processes; two are this module's, and two share one database                   | The MCP server and the CAP HTTP server hold `project_tracker` concurrently. Safe because writes serialize in the verb layer, the HTTP path is read-mostly and single-user, and nothing caches rows. Process 2 needs no port — `cds.app === undefined` (D-170)                            |
| **D-178** | One CDS service, `TrackerService`, at `/service/trackerSvcs`                        | The exemplar's four partition four domains with four consumer sets; this module has one domain, one page and one write path, and D-05 removes the CRUD surface. One prefix also keeps the proxy's route table one row                                                                    |
| **D-179** | Two new libraries; seven of the exemplar's are stated not-inherited                 | `@modelcontextprotocol/sdk` + `zod` for INT-001, executed together with CAP in one Node 22 process by RSH-001 §6. No HTTP client, no CSV parser, no cron, no crypto, no charts — each absence traced to a ruling                                                                         |
| **D-180** | `cds serve` via the dk CLI; `cds-serve` cannot load a TypeScript impl               | Measured: same tree, `cds serve` resolves `srv/probe-service.ts` and answers 200; `cds-serve` resolves the generic fallback and answers **501**. The dk CLI sets both of D-33's levers when a `tsconfig.json` sits at `cds.root`. Standalone entry points set them explicitly. Cost: R11 |
| **D-181** | A dedicated non-superuser role; the password is an env var from a gitignored `.env` | A superuser binding gives the agent-driven write path reach over `financial_planner`, undoing D-29's separation. `"password": ""` is removed — it throws client-side before the handshake (D-168). Measured: CAP reads `.env` **only** under the development profile                     |
| **D-182** | `assert_integrity: 'DB'` lives in `.cdsrc.json` — correcting D-173                  | `Financial Planner/.cdsrc.json:5-6` already carries the flag, so the house had a location and D-173 named a different file. Also measured: the compiler's validator is case-insensitive, so `'db'` and `'DB'` are equally valid; only the literal `true` is rejected                     |
| **D-183** | The dev loop runs on Postgres; SQLite survives as the test profile                  | A `cds watch` against `:memory:` discards the board every restart — the exact property the module exists to supply. R1 proved Postgres. Measured in passing: production does **not** auto-deploy an in-memory database, so the first read is a 500                                       |
| **D-184** | One origin via a tracked zero-dependency proxy — R9's residual executed             | 31 lines of `node:http`. `$batch` POST and an OData **write** both green in a real browser under `NODE_ENV=production`, with zero CORS headers, zero preflights and zero manifest changes. Lives in the Standards folder because it fronts both modules                                  |
| **D-185** | R11 is minted — the `cds` command is an unpinned global                             | `@sap/cds-dk@9.7.2` is installed globally, appears in no repo file, and is a patch line behind the pinned `@sap/cds@9.8.4`. RSH-002 §5 flagged it with no home; D-180 makes `npm start` depend on it. Owner: whoever next raises the CAP pin                                             |

---

_This document is the runtime contract for Project Tracker — what runs it, in how many processes, on
which versions, under which profiles, behind which origin, and where its secret lives. It settles the
**5** questions the design documents defer to this stage by name across **14** files, and rules nothing
that [DM-001](DATA_MODEL.md), [DS-001](DESIGN_SYSTEM.md), [IA-001](INFORMATION_ARCHITECTURE.md) or
[TH-001](THEME.md) already settled. Decisions are logged in the [Decisions Log](DECISIONS_LOG.md) at
D-176 … D-185. **R9's residual — the reverse proxy — is executed and closed**; **R11 is minted**. No
source file is written here; that remains the first build story's (§12), but the proxy and the loader
were both **executed** rather than reasoned about, and both changed what this document says._
