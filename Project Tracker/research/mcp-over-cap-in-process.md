# MCP Over CAP In-Process: CAP Handlers Do Execute Without a Server, But `cds.connect.to()` Alone Will Not Get You There

**Document ID:** RSH-001
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Research stage. |

---

## 2. The finding

**Viable with caveats.** An executable spike in this repo's own `@sap/cds@9.8.4` proved that an
application service reached in-process, with no HTTP server and no listening socket anywhere in the
process, runs its `before`/`on`/`after` handlers, enforces `@mandatory`, `@assert.range` and enum
constraints, stamps managed fields, honours an explicit agent user, and rolls back on rejection — and
that an MCP stdio server can live in the same process and call it. None of the three kill criteria
tripped. Three caveats are load-bearing and none is fatal: `cds.connect.to('ServiceName')` **by
itself throws** and needs one of three documented predecessors; CDS log output **does** corrupt the
JSON-RPC frame stream on stdout and needs an explicit two-line guard; and everything verified here
ran on in-memory SQLite, not on the Postgres this module will actually use. Separately, SAP shipped
an official `@cap-js/mcp` protocol adapter five days ago — it does not replace INT-001, but D-05
should acknowledge it exists.

**Mode:** Validate · **Verdict:** Viable with caveats · **Confidence:** High on the mechanism,
Medium on Postgres · **Feeds:** INT-001, D-05, D-06, D-26, Tech Stack, Workshops ·
**Researched:** 2026-07-26

---

## 3. Handlers execute in-process, with zero HTTP anywhere

**Verified.** A throwaway CAP module (one entity, one service, one rejecting `before` handler, one
`@mandatory` field, one `@assert.range`, the `managed` aspect) was loaded from an absolute path with
`@sap/cds` resolved out of `Financial Planner/node_modules/`, backed by in-memory SQLite, in a plain
`node` process with no express app. Command and real output:

```
$ cd <scratchpad>/capspike && node run.js

[SPIKE] node v22.19.0 | cds 9.8.4 | root ...\capspike
[SPIKE] E1 connect.to('SpikeService') before serve THREW: Didn't find a configuration for
        'cds.requires.SpikeService' in ...\capspike
[SPIKE] E3 db: SQLiteService | isDatabaseService true | deployed
[SPIKE] E4 cds.services: db,SpikeService
[SPIKE] E4 cds.app defined? undefined | protocol providers: 0
[SPIKE] E4 listening handles: 0
[SPIKE] E4 connect.to('SpikeService') -> SpikeService
[SPIKE] E5 handlers fired: ["before:CREATE:Notes","after:CREATE:Notes"]
[SPIKE] E5 row: {"createdAt":"2026-07-27T01:58:34.212Z","createdBy":"anonymous",
        "modifiedAt":"...","modifiedBy":"anonymous","ID":"3c85c62d-...","title":"Hello",
        "stage":"open","score":null}
[SPIKE] E6 before-handler reject ENFORCED: before-handler rejected the write | fired: ["before:CREATE:Notes"]
[SPIKE] E7 @mandatory ENFORCED: ASSERT_MANDATORY | fired: []
[SPIKE] E8 @assert.range ENFORCED: ASSERT_RANGE | fired: ["before:CREATE:Notes"]
[SPIKE] E8b @assert.range enum ENFORCED: ASSERT_ENUM | fired: ["before:CREATE:Notes"]
[SPIKE] E9 direct db INSERT SUCCEEDED. handlers fired: []
[SPIKE] E9 raw row: {..., "title":"REJECT ME","stage":"nonsense","score":99}
[SPIKE] E10 action result: completed 3c85c62d-... | fired: ["on:completeNote"]
[SPIKE] E11 cds.tx user -> createdBy: claude-agent | fired: []
[SPIKE] E12 rows left after rollback: 1
```

`cds.app` is `undefined`, `cds.service.providers.length` is `0`, and
`process._getActiveHandles()` contains **zero** `Server` objects. That is the direct refutation of
kill criterion 1: no running HTTP server is required for custom handlers to dispatch.

Two details in that output matter downstream. `E7` shows `fired: []` — CAP's generic input
validation runs **before** custom `before` handlers, so `@mandatory` rejects a payload the Validator
never sees. And `E12` confirms a rejection inside `cds.tx` rolls the whole transaction back, which
is the property a multi-write verb like `complete_stage` depends on.

`E11` is a trap worth naming: `cds.tx({user}, tx => tx.run(...))` stamped `createdBy` correctly but
fired **no application handlers** — `cds.tx` is a transaction on `cds.db`, not on the application
service. The correct form is `srv.tx(...)`, verified separately:

```
[SPIKE2] V3 srv.tx({user}) fired: ["before:CREATE:Notes","after:CREATE:Notes"] | createdBy: claude-agent
```

## 4. `cds.connect.to('ServiceName')` alone throws — D-05's wording needs one correction

**Verified + Documented.** D-05 and BA-001's INT-001 row both describe the design as "loading the CDS
model and calling the CAP service layer in-process via `cds.connect.to()`". Taken literally that
does not work. The on-disk implementation at
`Financial Planner/node_modules/@sap/cds/lib/srv/cds-connect.js:29` short-circuits only if the name
is already in `cds.services`; otherwise `options4()` at line 60-67 looks the name up in
`cds.service.bindings` / `cds.requires` and throws when it finds nothing:

```js
if (!options && datasource in cds.services) return Promise.resolve (cds.services[datasource])
...
if (!o.kind && !o.impl && !o.silent) throw cds.error(
  conf ? `Configuration for 'cds.requires.${name}' lacks mandatory property 'kind' or 'impl'` :
    name ? `Didn't find a configuration for 'cds.requires.${name}' in ${cds.root}` : ...
```

Capire's own `cds.connect.to` page states the same positively: "As services constructed by
`cds.serve` are registered with `cds.services` as well, a connect finds and returns them as local
service connections" (cap.cloud.sap/docs/node.js/cds-connect, retrieved 2026-07-26). The `cds.serve`
page adds: "The constructed service providers are cached in `cds.services`, which (a) makes them
accessible to `cds.connect`."

Three routes work; all were run. All three load the service's sibling implementation file and fire
its handlers.

| Route                                          | Works | Evidence                                                        |
| ---------------------------------------------- | ----- | --------------------------------------------------------------- |
| `cds.connect.to('SpikeService')` bare          | No    | `E1` — `Didn't find a configuration for 'cds.requires.…'`       |
| `cds.serve('all').from(model)` then `connect.to(name)` | Yes | `E4`/`E5` — handlers fired, no HTTP server                    |
| `cds.connect.to(ServiceClass)`                 | Yes   | `V1` — `fired: ["before:CREATE:Notes","after:CREATE:Notes"]`    |
| `cds.connect.to(name, { kind: 'app-service' })` | Yes  | `V2` — same                                                     |

```
[SPIKE2] V1 class._is_service_class: true
[SPIKE2] V1 connect.to(Class) -> SpikeService | name: SpikeService
[SPIKE2] V1 write via class-connected srv, fired: ["before:CREATE:Notes","after:CREATE:Notes"] | ID: true
[SPIKE2] V1 reject ENFORCED: before-handler rejected the write | fired: ["before:CREATE:Notes"]
[SPIKE2] V2 connect.to(name,{kind:'app-service'}) -> SpikeService | fired: [...]
```

The class route (`V1`) is the closest literal match to D-05's sentence and needs **no** `cds.serve`
at all — but it does need `cds.model` populated first, so "loading the CDS model" in D-05 is doing
real work in that sentence and must survive into the spec.

**Recommendation for Sandro to rule on:** D-05's rationale is sound; its mechanism sentence is one
clause short. Suggested amendment — "loading the CDS model and constructing the service in-process
(`cds.serve` or `cds.connect.to(ServiceClass)`), then calling it via `cds.connect.to()`". This is a
wording correction, not a decision reversal.

A second, smaller API trap: the naive `srv.send({ event, entity, data })` shape fails.

```
[SPIKE2] V4a srv.send({event,entity,data}) THREW: The request has no query and cannot be served
         generically. | code: 501
[SPIKE2] V4b srv.create('Notes').entries fired: ["before:CREATE:Notes","after:CREATE:Notes"] | got ID: true
[SPIKE2] V4c srv.send({query}) fired: ["before:CREATE:Notes","after:CREATE:Notes"] | got ID: true
```

Verb implementations must use `srv.create(...)`/`srv.run(INSERT…)`/`srv.send({query})`, or
`srv.send('actionName', {...})` for custom actions (`E10`).

## 5. The stdout hazard is real, confirmed, and closed by two lines

**Verified.** This was the specific hazard the brief flagged, and it is not theoretical. The MCP
SDK's `StdioServerTransport.send()` writes newline-delimited JSON straight to `process.stdout`
(`@modelcontextprotocol/sdk@1.29.0`, `dist/esm/server/stdio.js`), while CDS writes to stdout in two
places: `cds.log`'s default `Logger` maps `log`/`info`/`debug` to `console.log`/`console.info`
(`lib/log/cds-log.js:97-102`), and `cds.deploy` prints its banner with a raw `console.log`
(`lib/dbs/cds-deploy.js:13,42`).

A raw capture of the child process's stdout, with a tool handler that calls `cds.log('app').info()`
mid-request — exactly what this repo's `Logger` class does on every service call:

```
$ GUARD_STDOUT=0 node rawtest.js
=== GUARD_STDOUT=0 — RAW CHILD STDOUT, line by line ===
 0 NOT-JSON >>> Unexpected token '/', "/> success"... | /> successfully deployed to in-memory database.
 2 VALID-JSONRPC | {"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":...
 3 NOT-JSON >>> Unexpected token 'a', "[app] - han"... | [app] - handling a write for Noisy
 4 VALID-JSONRPC | {"result":{"content":[{"type":"text","text":"{\"ok\":true,\"ID\":\"aaae2bbd-...
```

Line 3 is a CDS log line sitting **inside** the live JSON-RPC stream. With the guard applied:

```
$ GUARD_STDOUT=1 node rawtest.js
=== GUARD_STDOUT=1 — RAW CHILD STDOUT, line by line ===
 0 VALID-JSONRPC | {"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":...
 1 VALID-JSONRPC | {"result":{"content":[{"type":"text","text":"{\"ok\":true,\"ID\":\"36e931a5-...
```

The guard is the documented hook, not a hack. `lib/log/cds-log.js:80-88` carries the JSDoc "You can
assign different implementations, e.g. `cds.log.Logger = () => winston.createLogger(...)`". Routing
that factory plus the bare `console.*` methods to `process.stderr` produced the clean run above.
`cds.deploy(model, { silent: true })` independently suppresses the deploy banner (verified in the
ESM run below). Kill criterion 2 does **not** trip: there is a conflict, it is documented in the
dependency's own source, and the workaround is verified.

Note the failure mode is survivable but silent: the unguarded end-to-end client run still completed
every call, because the SDK's `ReadBuffer` reports a parse error and continues rather than aborting.
That makes it a corruption class that will not announce itself in testing — argue for the guard on
day one, not after a mystery.

Full end-to-end, one process, MCP stdio transport in front of the CAP service layer:

```
$ node client.js
[MCP] connected in 944 ms
[MCP] tools: create_note,count_notes
[MCP] create_note(ok): {"content":[{"type":"text","text":"{\"ok\":true,\"ID\":\"af119adf-...\"}"}]}
[MCP] create_note(reject): {"content":[{"type":"text","text":"{\"ok\":false,\"code\":400,
      \"message\":\"before-handler rejected the write\"}"}],"isError":true}
[MCP] create_note(bad range): {"content":[{"type":"text","text":"{\"ok\":false,
      \"message\":\"ASSERT_RANGE\"}"}],"isError":true}
[MCP] count_notes: {"content":[{"type":"text","text":"1"}]}
```

A CAP `before`-handler rejection and an `@assert.range` violation both surfaced to the MCP client as
tool errors with their CAP status code intact. That is D-05's "malformed writes fail loudly at the
boundary", demonstrated rather than assumed. Process lifetime and signal handling raised no issue:
the server ran until `client.close()`, and no CDS component registered a competing `SIGINT`/`SIGTERM`
handler in the spike.

## 6. ESM, CJS and Node 22 compose — and SAP ships the same combination

**Verified.** `@sap/cds@9.8.4` is CommonJS (`main: lib/index.js`, no `type`, no `exports` map,
`engines.node >=20`). `@modelcontextprotocol/sdk@1.29.0` declares `"type": "module"` but ships a
**dual** build — its `exports` map is `{ "import": "./dist/esm/*", "require": "./dist/cjs/*" }`, so
it loads either way. Both were loaded into one Node v22.19.0 process from a native-ESM entry point:

```
$ node esm-compose.mjs
[ESM] module system of this file: ESM (import.meta present)
[ESM] cds version: 9.8.4 | cds module.exports type: object
[ESM] McpServer: function | StdioServerTransport: function | zod: function
[ESM] McpServer instantiated + transport constructed OK
[ESM] CAP write through app service, handlers fired: ["before:CREATE:Notes","after:CREATE:Notes"] | ID: true
```

Kill criterion 3 does not trip. Corroborating evidence, **Documented**: the npm registry records
`@cap-js/mcp@1.2.0` (published 2026-07-21) depending on `@modelcontextprotocol/sdk@^1.29.0` with a
peer dependency of `@sap/cds >=8` — SAP itself runs this exact SDK version inside a CAP Node process.

One version note, **Documented**: `@sap/cds` is now at **10.0.4** (published 2026-07-21) while this
repo pins `^9` and resolves 9.8.4. Nothing here depends on 10, but the community plugin
`@gavdi/cap-mcp@1.8.0` requires `@sap/cds >=10`, so a later decision to adopt it would force the
major upgrade.

## 7. SAP now ships an official MCP adapter — and it is not a substitute for INT-001

**Documented, and material enough to report prominently.** As of 2026-07-26, capire carries an
"MCP Protocol Adapter **Beta**" guide (cap.cloud.sap/docs/guides/protocols/mcp) for the npm package
`@cap-js/mcp` (v1.2.0, 2026-07-21). It exposes a service by adding `@mcp` to it and auto-generates
three tools per service — `describe`, `query`, `call_action`.

It fails INT-001's requirements on three independent counts, each stated by SAP's own documentation:

| INT-001 requirement                       | `@cap-js/mcp` Beta                                                                  |
| ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Writes state (`start_stage`, `log_defect`) | "currently focused on **reading data** and calling unbound actions and functions only" |
| Intent verbs, **no** generic CRUD surface  | Generic `describe` / `query` / `call_action` — precisely the surface D-05 rejects     |
| In-process, no "is the service up?" dependency | HTTP transport only; served alongside other protocols at e.g. `/mcp/browse`       |

It also states "The MCP adapter does not perform any input validation or output validation regarding
prompt injections." The community alternative `@gavdi/cap-mcp@1.8.0` (gavdilabs, 2026-07-15) *does*
support `create`/`update` entity wrappers, but is likewise HTTP/SSE only ("MCP Endpoint:
`http://localhost:4004/mcp`") and requires `@sap/cds >=10`.

**Inferred, from the above:** every published CAP-MCP option today is D-05's option (B) — MCP over
HTTP to a running CAP service — wearing a generic-CRUD surface. D-05's option (C) with intent verbs
remains bespoke. The adapters are not competitors to INT-001; they are worth knowing about only as a
later read-only convenience, and adopting one would reintroduce the ambient "is the service up?"
dependency D-05 rejected.

**Recommendation for Sandro to rule on:** D-05 predates `@cap-js/mcp` and does not mention it. A one
line addition to D-05's rationale — that an official adapter exists, is Beta, is read-only, is HTTP
only, and offers a generic surface, and was therefore not chosen — makes the decision defensible to
a future reader who finds the package and wonders why it was ignored.

**Unknown:** no published example of an MCP **stdio** server over CAP was found as of 2026-07-26.
Section 11 records where I looked.

## 8. What a generic Postgres MCP actually bypasses — D-05's counterfactual, measured

**Verified.** The spike ran the identical malformed payload against `cds.connect.to('db')` — the
database service — instead of the application service:

```
[SPIKE] E9 direct db INSERT SUCCEEDED. handlers fired: []
[SPIKE] E9 raw row: {"createdAt":"2026-07-27T01:58:34.222Z","createdBy":"anonymous",
        "modifiedAt":"...","modifiedBy":"anonymous","ID":"d73ee22e-...",
        "title":"REJECT ME","stage":"nonsense","score":99}
```

A row that the application service rejected three separate ways — `before`-handler reject,
`@assert.range` on `score`, `@assert.range` enum on `stage` — landed intact. D-05's core claim is
confirmed on the evidence: application handlers and annotation-based constraints are the thing the
service layer buys, and they are entirely bypassed one layer down.

One correction to D-05's phrasing, though: **managed fields are not in that list**. `createdAt`,
`createdBy`, `modifiedAt` and `modifiedBy` were stamped on the direct-`db` write too, because managed
field handling is a generic database-layer handler in CAP 9. What a *generic Postgres MCP* bypasses is
strictly wider — it speaks raw SQL, not CQL, so it misses the db service as well and would leave
managed fields blank. The distinction is small but D-05's rationale currently bundles managed fields
with handlers and constraints as if they lived at the same layer. They do not.

## 9. Two module models in one process do not break the in-process design — OI-02 unblocked

**Verified.** The brief flagged this as the cross-topic risk: D-05's design assumes one resolvable
CDS model, so if `cap-multi-module-backend` concludes "one CAP service per module", INT-001 might
break. It does not. A second, wholly independent module tree (own namespace, own entity, own service,
own rejecting handler) was merged into one CSN via explicit multi-path `cds.load` and served
alongside the first, in one process:

```
$ node run3.js
[SPIKE3] A merged model services: SpikeService,OtherService
[SPIKE3] A cds.services: db,SpikeService,OtherService
[SPIKE3] A both services' handlers fired: ["before:CREATE:Notes","after:CREATE:Notes","before:CREATE:Tickets"]
[SPIKE3] A OtherService reject ENFORCED: other-service rejected | fired: ["before:CREATE:Tickets"]
[SPIKE3] A cross-module reads in one process: notes = 1 tickets = 1
```

Both services dispatched their own handlers; each enforced its own rules; both were readable from
the same process. **Inferred, from that result:** "one CAP service per module" does not by itself
sink INT-001, provided the models are loadable from one process and share one database connection.
What the spike did *not* test is two separate CAP roots with **conflicting** `cds.env` (different
`requires.db` credentials, different namespaces colliding) — see §11.

## 10. A one-shot script can reach the service layer, at ~0.5 s, with one cwd trap (INT-004 / D-26)

**Verified.** The bootstrap is the same three calls and completes in under a second on a trivial
model, measured twice for stability:

```
[SPIKE2] V6 timings ms | require(@sap/cds): 5 | cds.load+compile: 294 | connect db + deploy: 144 | total: 506
[SPIKE2] V6 timings ms | require(@sap/cds): 4 | cds.load+compile: 293 | connect db + deploy: 145 | total: 506
```

`cds.load` + compile dominates at ~294 ms for a two-entity model and will grow with Project Tracker's
schema; `deploy` (144 ms) disappears against a real Postgres and is replaced by a connection
handshake. Process teardown needed an explicit `process.exit(0)` — the SQLite pool keeps the event
loop alive otherwise, which a `posttest` script must handle or it will hang the npm run.

**The trap, verified.** `cds.env` is read from `cds.root`, which defaults to `process.cwd()` at
require time (`lib/index.js:23`). `generateTestReport.ts` runs as `posttest` with cwd set to the
**module under test** (Financial Planner), not Project Tracker. Loading Project Tracker's model by
absolute path from the wrong cwd compiles fine but cannot connect:

```
$ node run4.js
[SPIKE4] cwd: C:\Users\sandr\AppData\Local\Temp | cds.root: C:\Users\sandr\AppData\Local\Temp
[SPIKE4] cds.env.requires.db from wrong cwd: undefined
[SPIKE4] A model loaded by absolute path. services: SpikeService
[SPIKE4] A THREW: Didn't find a configuration for 'cds.requires.db' in C:\Users\sandr\AppData\Local\Temp
```

Repointing `cds.root` *after* requiring `@sap/cds` did not recover it — `cds.env` was already
resolved. The fix that works is `process.chdir(<Project Tracker root>)` **before** the first
`require`/`import` of `@sap/cds`, proven by running `run.js` from an unrelated cwd and getting the
identical clean result. That is a real constraint on INT-004's implementation and it interacts with
the shared-linter rule in the root `CLAUDE.md` that every script roots itself at `process.cwd()`.

**Existing in-repo precedent, Documented.** Financial Planner already reaches a live application
service in-process: `Financial Planner/test/integration/transaction/support/transaction.ts:149`
does `const srv = (await cds.connect.to(SERVICE_NAME)) as cds.ApplicationService;` and then
registers the production facade on it. It works there because `cds.test("serve", …)` has already
populated `cds.services` — the same precondition §4 describes. Note the repo's integration tests
otherwise drive services over **HTTP** (`cds.test("serve", "--with-mocks", "--in-memory")` plus
`POST`/`PATCH` in all six integration suites), so there is no existing in-repo example of a
fully serverless in-process bootstrap. The spike is the first.

## 11. Grading the prior assumption

| D-05 claim                                                            | Grade                    | Why                                                                                                                          |
| --------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| In-process "keeps CAP handlers (and therefore validation) executing"   | **Holds** — Verified     | `before`/`on`/`after`, `@mandatory`, `@assert.range`, enum checks and rollback all fired with no HTTP server (§3, §5)         |
| "…with no separate process to keep alive"                             | **Holds** — Verified     | Zero `Server` handles, `cds.app` undefined, `cds.service.providers` empty (§3)                                                |
| A generic Postgres MCP "bypasses the service layer … the Facade/Service/DataService/Validator/Mapper pattern, CDS constraints" | **Holds** — Verified | The identical malformed row landed intact via the db service (§8)                                                            |
| …"and managed fields"                                                 | **Refuted in part**      | `createdAt`/`createdBy`/`modifiedAt`/`modifiedBy` were stamped on the direct-`db` write; only raw SQL loses them (§8)         |
| The mechanism is "`cds.connect.to()`"                                 | **Refuted as written**   | Bare `cds.connect.to('Name')` throws; needs `cds.serve`, a Service class, or `{kind:'app-service'}` first (§4)                |
| MCP over HTTP "gives every agent write an ambient 'is the service up?' dependency" | **Holds** — Inferred | Structural, not measured; and every shipped CAP-MCP adapter today is HTTP-only, so choosing one reintroduces it (§7)      |

The decision D-05 reaches is supported. Two of its supporting sentences are imprecise and should be
corrected when the spec is written; neither correction changes the option chosen.

## 12. What we could not establish

- **Postgres.** Everything verified here ran on `@cap-js/sqlite` in-memory. `@cap-js/postgres@^2` is
  installed but was not exercised — testing it means touching a real database, which is outside the
  spike's bounds. The application-service handler layer sits above the database service and is
  db-agnostic by construction (`lib/srv/factory.js`), so I expect no difference — but that is
  **Inferred**, and a Postgres-backed repeat of `run.js` is the single test that would settle it.
- **Long-running stability.** The spike's MCP server lived for one client session (~5 s). Connection
  pool behaviour, `cds.tx` leakage and memory growth across a multi-hour Claude Code session are
  untested. Whether a long-lived stdio server holding a Postgres pool survives laptop sleep is
  **Unknown**.
- **Two CAP roots with conflicting `cds.env`.** §9 proved two *models* merge into one process. Two
  independent module *roots*, each with its own `package.json` `cds.requires.db`, were not tested —
  and §10 shows `cds.env` binds once to one root. This is the residual OI-02 risk.
- **TypeScript service implementations.** The spike's service impl was plain `.js`. CAP's
  `_sibling()` resolver only considers `.ts` when `process.env.CDS_TYPESCRIPT` is set
  (`lib/srv/factory.js:46`), and this repo's own integration tests carry the comment "cds.test cannot
  load the TypeScript service impl". How INT-001 loads a TypeScript facade — `tsx`, `cds-tsx`,
  `CDS_TYPESCRIPT=true`, or a build step — is **Unknown** and is a real Tech Stack question.
- **Draft-enabled entities.** Only non-draft writes were tested. If any Project Tracker entity is
  draft-enabled, whether an in-process verb must drive `draftEdit`/`draftActivate` is untested.
- **MCP stdio precedent over CAP.** Searched: capire (`/docs/guides/protocols/mcp`,
  `/docs/node.js/cds-connect`, `/docs/node.js/cds-serve`), the npm registry for `@cap-js/mcp`,
  `@cap-js/mcp-server`, `@gavdi/cap-mcp` and `@neoimpulse/cap-js-mcp`, the gavdilabs GitHub README,
  and SAP Community blog listings. Every implementation found is HTTP/SSE. **No documented example of
  an MCP stdio server over CAP exists as of 2026-07-26** — which is why the spike in §5 was worth
  running.
- **Context7 was unavailable** in this session (`mcp__Context7__resolve-library-id` returned "No such
  tool available"), so CAP documentation was read from the on-disk `@sap/cds` source and fetched
  directly from cap.cloud.sap rather than through it. The on-disk source is the higher-authority
  source for runtime behaviour regardless, but a Context7 pass on `@sap/cds` may surface API guidance
  I did not see.
- **`@cap-js/mcp` internals** were read from its documentation and npm metadata only; the package was
  not installed or inspected. Whether it could be configured for stdio is **Unknown**.

## 13. Verdict, caveats, and the fallback

**Verdict: Viable with caveats.** All three kill criteria were tested and none tripped. The
mechanism works, it works without a server, it works with an MCP stdio transport in the same process,
and it works under ESM on Node 22.

The caveats that must reach the spec:

1. **Bootstrap correctly or nothing dispatches.** `cds.serve`, a Service class, or
   `{kind: 'app-service'}` — never bare `cds.connect.to('Name')`. Verified (§4).
2. **Guard stdout on day one.** Redirect `cds.log.Logger` and the bare `console.*` methods to stderr,
   and pass `{ silent: true }` to `cds.deploy`. The failure is silent corruption, not a crash.
   Verified (§5).
3. **`srv.tx`, not `cds.tx`,** for anything that must run handlers under an agent identity.
   Verified (§3).
4. **`process.chdir` before requiring `@sap/cds`** in any script whose cwd is not the module root —
   this is INT-004/D-26's specific constraint. Verified (§10).
5. **Postgres is unverified.** Repeat `run.js` against `@cap-js/postgres` before INT-001 leaves
   design. This is the one open item that could still move the verdict.

**The fallback, at the same evidence standard.** If Postgres or the TypeScript-impl question sinks
option (C), D-05's option (B) — MCP over HTTP to a running CAP service — is not hypothetical: it is
what every shipped CAP-MCP adapter does, and `@gavdi/cap-mcp@1.8.0` demonstrates `create`/`update`
tools over it (Documented, gavdilabs README, 2026-07-15). Its costs are the ones D-05 already named,
now with a number attached: the CAP server must be listening before any agent write, so every verb
acquires a liveness precondition, and the MCP process must either spawn and supervise `cds serve` or
fail. Against that, the in-process bootstrap measured **506 ms** cold (§10) — cheap enough that
"start the server first" buys nothing on latency. Option (B) would also require `@sap/cds >=10` for
the gavdi plugin, forcing a major upgrade this repo has not planned; a bespoke HTTP client against
custom OData actions avoids that but re-splits the verb logic across two processes. Option (B)
remains a real fallback, and it is strictly worse than what the spike demonstrated.

---

**Spike artifacts.** All spike code lives in the session scratchpad and is throwaway:
`C:\Users\sandr\AppData\Local\Temp\claude\c--Projects-Life-OS\f483cf78-bd5b-4d40-a2b6-b8f8067bd062\scratchpad\`
— `capspike/` (CAP model, `run.js`, `run2.js`, `run3.js`, `run4.js`) and `mcpspike/`
(`mcp-cap-server.js`, `client.js`, `rawtest.js`, `esm-compose.mjs`). The MCP SDK was installed
**only** into `mcpspike/node_modules`; no repo `package.json`, lockfile or `node_modules` was
touched.
