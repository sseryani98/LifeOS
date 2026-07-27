# Project State Durability: CAP Has No Export, So Versioning Must Be Built

**Document ID:** RSH-005
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Research stage. |

---

## 2. The Answer

**`pg_dump` fully replaces the backup half of git's durability at zero build cost, but nothing in
`@sap/cds` or `@cap-js/postgres` can produce a versioned representation — so if the diffable,
revertable properties are to survive cutover, an exporter must be built, and BA-001 gains an
object.** CAP's data flow is strictly one-directional: `cds deploy` loads CSVs, and no command,
API or utility in the installed toolchain writes them back. The load side, however, is better than
expected — on Postgres the seed load is an idempotent UPSERT inside a single transaction against
`DEFERRABLE INITIALLY DEFERRED` foreign keys, so a CSV restore is order-safe and re-runnable.
The finding that most changes the question is not about tooling at all: **this repo has no git
remote**, so "survives the laptop dying" is a property markdown state does not have today either
— it is a pre-existing gap, not a regression the migration introduces.

**Mode:** Compare · **Verdict:** per option, §9 · **Confidence:** High on tooling, Medium on the
untested restore · **Feeds:** OI-01, D-27, CNV-005 · **Researched:** 2026-07-26

---

## 3. The Durability Being Lost Is Two Properties, Not Four

**Of the four properties markdown gave for free, git delivers two unconditionally, one
conditionally, and one not at all on this machine.** PSV-001 §8 and `PLAN.md` §7 both frame the
loss as diffable, revertable, and cloned-with-the-repo. That framing is right about the first two
and optimistic about the rest.

`git remote -v` returns nothing, and `.git/config` contains no `[remote]` section at all — only
three stale `vscode-merge-base = origin/main` lines pointing at a remote that does not exist
(**Verified**, 2026-07-26). `.git/refs/remotes/` is absent. The repository exists in exactly one
place, `c:\Projects\Life OS`, which is not inside the OneDrive tree.

A second correction to the baseline: **the markdown state being retired is not fully versioned
today either.** `git ls-files "Financial Planner/project/"` returns four paths — `SPRINT_BOARD.md`,
`DEFECT_LOG.md`, `sprints/W1-S2-checkpoint.md`, and a `.gitkeep` (**Verified**). The fourth artifact
class CNV-005 retires, `project/test-reports/`, is gitignored at
`Financial Planner/.gitignore` (**Verified**). The five test reports PSV-001 §2 counts have never
been in git.

| Property                | Markdown state today                             | Evidence                                     |
| ----------------------- | ------------------------------------------------ | -------------------------------------------- |
| Diffable                | Yes, for 3 of 4 artifact classes                 | Verified — `git ls-files`                    |
| Revertable to a point   | Yes, for the same 3                              | Verified — same                              |
| Cloned with the repo    | Would be, if a clone existed                     | Verified — no remote configured              |
| Survives laptop failure | **No** — single copy, no remote, no synced path  | Verified — `.git/config` has no `[remote]`   |

**Implication for OI-01:** two of the four properties are genuinely regressions the migration
introduces; the fourth is a gap that already exists and that a database migration neither causes
nor worsens. Solving it is orthogonal to the mechanism choice and is discussed in §8.

---

## 4. CAP Offers No Data Export — This Is the Load-Bearing Negative Finding

**The installed toolchain has no command, flag, or API that writes table data out of the
database.** This was checked three ways, and all three agree.

**The CLI's own command list.** `@sap/cds@9.8.4` declares only two bins — `cds-deploy` and
`cds-serve` (`Financial Planner/node_modules/@sap/cds/package.json`, **Verified**). The full `cds`
command surface comes from `@sap/cds-dk@9.7.2`, installed globally. Running `cds help` enumerates
27 commands; there is no `export`, no `dump`, and no `extract` (**Verified**, 2026-07-26). The
three commands whose names invite the assumption do something else:

| Command       | What the name suggests             | What it actually does                                                                                  |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `cds import`  | Import data into the database      | "Imports the given source and converts it to CSN" — EDMX, OData V2/V4 XML, OpenAPI, AsyncAPI. **Model only.** |
| `cds compile` | Might emit data alongside schema   | Compiles models to CSN, EDMX, SQL DDL, CDL, OpenAPI. `--to sql` emits `CREATE TABLE`, never `INSERT`.  |
| `cds deploy`  | Two-way sync with the database     | Applies DDL and loads initial data. Strictly inbound.                                                  |

All three rows are **Verified** from `cds help import`, `cds help compile`, and `cds help deploy`
against cds-dk 9.7.2 on 2026-07-26.

**The one command that writes CSV files writes empty ones.** `cds add data` is listed in `cds help
add` as "add CSV headers for modeled entities" (**Verified**). Its options are `--filter`,
`--records | -n`, and `--out`; `--records N` generates *placeholder* rows, not database content.
The capire "Adding Initial Data" guide agrees: the command "generates empty CSV template files with
headers only, not existing data exports", and "No flag exists for exporting existing database data
to CSV" (**Documented**, cap.cloud.sap/docs/guides/databases/initial-data, retrieved 2026-07-26).

**The one function in the library that looks like a CSV writer is broken for tabular data.**
`@sap/cds` exposes `cds.utils.csv.serialize` (`lib/utils/csv-reader.js:9-13`). Its implementation is
`for (let key in rows) csv += \`${key};${rows[key]}\`` — it emits the array *index* as the first
column and comma-joins the entire row into the second. Executed against a three-column fixture with
no database involved:

```console
$ node csvprobe.cjs
--- cds.utils.csv.serialize(rows, cols) ---
"\ufeffID;title;status\n0;id-1,Story A,Done\r\n1;id-2,Story B,Open\r\n"
--- round-trip back through cds.parse.csv ---
[["ID","title","status"],[0,"id-1,Story A,Done"],[1,"id-2,Story B,Open"]]
```

The header declares three columns; every data row has two, and neither carries the ID. This does not
round-trip through CAP's own parser (**Verified**, 2026-07-26). It is also unreferenced anywhere in
`lib/` or `libx/` outside its own definition (**Verified**, grep). It is not a data exporter and
cannot be pressed into service as one.

**Consequence.** Any option in Sandro's sketch that involves producing files *from* the database —
"periodic CDS/CSV export" and "seed-data files as the checked-in form" alike — requires code that
does not exist. That is precisely the trigger D-27 names.

---

## 5. The CSV Load Side Is More Robust Than Expected

**Read against the kill criterion, CSV-as-restore-format passes: every mechanism a restore needs is
provided by `@sap/cds` and `@cap-js/postgres` as installed.** The authority here is
`Financial Planner/node_modules/@sap/cds/lib/dbs/cds-deploy.js`, which is what will actually run.

| Behaviour               | Mechanism                                                                                                                       | Source                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| File → entity resolution | Filename hyphens become dots: `com.projecttracker-Milestone.csv` → entity `com.projecttracker.Milestone`                        | `cds-deploy.js:377-378` (**Documented**) |
| Discovery folders       | `cds.requires.db.data` array, plus any `data/` or `csv/` folder beside a `.cds` source                                          | `cds-deploy.js:285-302` (**Documented**) |
| Opt-out                 | Files whose name starts with `-` are skipped                                                                                    | `cds-deploy.js:314` (**Documented**)     |
| Insert semantics        | `schema_evolution === 'auto'` selects `UPSERT` over `INSERT`                                                                    | `cds-deploy.js:210-211` (**Documented**) |
| Transaction scope       | The **entire** data load runs inside one `db.run(async tx => …)`                                                                | `cds-deploy.js:160-180` (**Documented**) |
| Missing UUID keys       | Silently generated fresh with `cds.utils.uuid()` per deploy                                                                     | `cds-deploy.js:191-194` (**Documented**) |
| Missing managed fields  | `@cds.on.insert` filled with `$user → 'anonymous'` and `$now →` deploy time                                                     | `cds-deploy.js:196-204` (**Documented**) |

Two of those rows resolve hazards that would otherwise be fatal, and both depend on configuration
this repo already has.

**Postgres upserts rather than inserts.** `cds env get requires.db --profile production` returns
`"schema_evolution": "auto"` for the `@cap-js/postgres` kind (**Verified**, 2026-07-26). By
`cds-deploy.js:210-211` that makes every seed load an `UPSERT`, so re-deploying the same CSVs into a
populated database is idempotent rather than a primary-key collision. Under the default
`deploy_data_onconflict: "insert"` on a non-evolving database it would not be.

**Foreign-key load order does not matter.** `cds env get features` reports
`"assert_integrity": "db"` (**Verified**), which makes the compiler emit real database constraints.
Compiling the Financial Planner model to the Postgres dialect produces 51 foreign keys, and every
one of them is deferred:

```console
$ cds compile '*' --to sql --dialect postgres > fp2.sql
$ grep -c "FOREIGN KEY" fp2.sql
51
$ grep -c "DEFERRABLE" fp2.sql
51
$ grep -A3 -m1 "FOREIGN KEY" fp2.sql
ADD CONSTRAINT c__com_financialplanner_RewardsProgram_currencyType
FOREIGN KEY(currencyType_code)
REFERENCES com_financialplanner_RewardsCurrencyType(code)
DEFERRABLE INITIALLY DEFERRED;
```

**Verified**, 2026-07-26. Combined with the single-transaction load at `cds-deploy.js:160`,
constraints are checked at `COMMIT`, by which point every row is present. A CSV restore of a deep
hierarchy — Area → Engagement → Workspace → Initiative → Milestone → Task → Subtask — cannot fail on
ordering. This is the finding that makes CSV a credible restore format rather than a fragile one,
and it is not stated in any documentation; it is only visible in the generated DDL.

**Three residual hazards an exporter must handle, all Documented from the source above:**

1. **Key columns are mandatory in the output.** Omit `ID` and `cds deploy` mints a new UUID per row
   (`:191-194`), silently severing every association on restore. An exporter must emit all keys.
2. **Managed fields are mandatory in the output.** Omit `createdAt`/`createdBy` and the restore
   stamps `'anonymous'` and the restore's own timestamp (`:196-204`), rewriting the audit history
   that is the whole point of the register. They load correctly when present, because `_queries4`
   only *adds* columns that are absent.
3. **UPSERT merges, it does not replace.** A restore into a live database leaves rows created after
   the export in place. A CSV restore is therefore a *merge to a point in time*, not a revert to
   one, unless the schema is dropped first. **Inferred** from `cds-deploy.js:210-211` — no
   documentation states this.

**The repo already runs this convention both ways.** `Financial Planner/package.json` declares
`data: ["db/data", "db/seed"]`; `db/data/` holds 22 tracked CSVs, and `db/seed/` holds seven CSVs of
which **zero** are tracked, because `.gitignore` excludes the folder for privacy (**Verified**,
`git ls-files`). So "seed files as the checked-in form" has both a working precedent and a working
exception in this repo — the split is by privacy, and it is enforced by `.gitignore`, not by CAP.

---

## 6. Only One Postgres Backup Mechanism Is Proportionate at This Volume

**Postgres 17.6 client tools are installed on this machine but not on `PATH`.**
`C:\Program Files\PostgreSQL\17\bin\` contains `pg_dump.exe`, `pg_dumpall.exe`, `pg_restore.exe`,
`pg_basebackup.exe`, `pg_receivewal.exe`, and `psql.exe`; `pg_dump --version` reports
`pg_dump (PostgreSQL) 17.6`, while `which pg_dump` finds nothing (**Verified**, 2026-07-26). Any
script must use the absolute path or add the folder to `PATH` — a small, real Windows cost.

The dataset is 12 stories, 4 defects, ~6 decisions, 1 checkpoint, 5 test reports. Judged at that
scale:

| Mechanism                | Produces                              | Text/diffable            | Windows cost                          | Verdict at this volume       |
| ------------------------ | ------------------------------------- | ------------------------ | ------------------------------------- | ---------------------------- |
| `pg_dump -Fc`            | Compressed single-file archive        | No — binary              | One command, server stays up          | **Recommended**              |
| `pg_dump -Fp` (default)  | Plain-text SQL, `COPY` blocks         | Text, but see §7         | Same                                  | Viable alternative           |
| `pg_dump --column-inserts` | Plain-text `INSERT INTO … (cols)`   | Text, most diffable form | Same; docs warn restore is very slow  | Viable alternative           |
| `pg_dumpall`             | Whole cluster + roles + tablespaces   | Text                     | Same                                  | Viable alternative           |
| File-system snapshot     | Binary copy of the data directory     | No                       | **Server must be shut down**          | **Rejected**                 |
| WAL archiving / PITR     | Base backup + continuous WAL segments | No                       | Config, archive command, monitoring   | **Rejected**                 |
| `pgBackRest`             | Managed repository, incremental       | No                       | **Does not run on Windows**           | **Rejected**                 |

Sourcing, all retrieved 2026-07-26: the three-approach taxonomy and the shutdown requirement for
file-system backups are **Documented** at postgresql.org/docs/17/backup.html. `pg_dump` defaults to
plain format, "does not block other users accessing the database", and produces "internally
consistent" snapshots that "can generally be re-loaded into newer versions of PostgreSQL"
(**Documented**, postgresql.org/docs/17/backup-dump.html and /app-pgdump.html). The `--inserts`
warning — "This will make restoration very slow; it is mainly useful for making dumps that can be
loaded into non-PostgreSQL databases" — is **Documented** at /app-pgdump.html. pgBackRest's user
guide targets "any Unix distribution" and documents only apt packages and a Meson/Ninja source build
against `libpq-dev`; Windows is not among the supported platforms (**Documented**,
pgbackrest.org/user-guide.html).

**Why the three rejections are rejections and not "viable with effort."** `pgBackRest` trips the
kill criterion on platform, not on cost — the tooling does not run here at all. WAL archiving and
`pg_basebackup` exist to deliver sub-minute recovery-point objectives and terabyte-scale
incremental backup; the entire dataset under discussion is smaller than a single WAL segment
(16 MB), so the mechanism's only justification is absent. A file-system snapshot requires stopping
the Postgres service on every run, which converts a background job into a manual outage.

**Frequency, retention, location — concretely.** At this volume a full `pg_dump -Fc` completes in
well under a second and produces a file measured in tens of kilobytes, so frequency is bounded by
taste, not cost. Three shapes fit the repo's proven patterns: an npm script (`tsx` standalone
scripts are already the established shape across the 20-linter suite), a Windows Task Scheduler
entry, or `node-cron` inside the CAP process (already a Financial Planner dependency and the
documented pattern for its background jobs). Retention at 30 daily dumps costs a few megabytes.
Location is the unresolved part and is the subject of §8.

---

## 7. Diffability Is the Property No Off-the-Shelf Mechanism Delivers

**A `pg_dump` committed to git is text, but it is not usefully diffable, because `pg_dump` does not
sort rows.** Tom Lane, on pgsql-hackers, 2025-08-26: "It emits whatever a sequential-scan plan would
emit. If you set `synchronize_seqscans = off` (which pg_dump does), that will match physical row
order" (**Documented**, postgresql.org message-id `1274229.1756246648@sss.pgh.pa.us`). Physical row
order changes whenever an `UPDATE` relocates a tuple, so editing one story's status can reorder
unrelated rows in the dump and produce a diff far larger than the change. Third-party tools such as
`pgdump-sort` exist specifically to post-process dumps into a canonical order for diffing
(**Reported**, github.com/tigra564/pgdump-sort, retrieved 2026-07-26) — the existence of that tool
is itself the evidence that the raw output is unsuitable.

**A purpose-built exporter does not have this problem**, because it controls the query. `SELECT …
ORDER BY ID` produces byte-identical output for identical data, which is what makes a git diff mean
something. This is the substantive argument for building the exporter rather than committing a dump:
not that CAP's format is better, but that determinism is only available when you write the query.

**The repo already has a CSV writer, just not from CAP.** `papaparse@5.5.3` is a Financial Planner
dependency and exposes a working `unparse` with correct delimiter quoting:

```console
$ node -e "const P=require('papaparse'); console.log(P.unparse({fields:['ID','title'],data:[['id-1','Story A'],['id-2','B;semi']]},{delimiter:';'}))"
ID;title
id-1;Story A
id-2;"B;semi"
```

**Verified**, 2026-07-26. It is resolved under `Financial Planner/node_modules/`, not hoisted to the
root, so Project Tracker would declare it itself — permitted, since it is a module runtime
dependency rather than shared tooling. The exporter is consequently a small object: enumerate the
model's persisted entities, `SELECT * ORDER BY` the key columns through the DataService layer, and
`unparse` each to `db/data/{namespace}-{Entity}.csv`. Nothing about it is novel; it is simply
absent from CAP.

---

## 8. The Restore Drill Is a Convention Being Established, Not One Being Kept

**PSV-001 §8 asks "whether a restore is ever tested"; the honest answer is that nothing in this repo
has ever been restored, because there has never been anything to restore.** No backup artifact,
runbook, or drill record exists anywhere under the module tree (**Verified**, repo inspection). So
this is a convention being written, and it should be written at a size that will actually be
followed.

A drill that is worth running has three checks, and they differ by mechanism:

| Mechanism    | The drill                                                                                  | Verification                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `pg_dump -Fc` | `createdb project_tracker_drill -T template0`, then `pg_restore -d project_tracker_drill`  | Row count per table matches the source; then point the CAP service at the drill DB and run `project_view` |
| CSV export   | Drop and recreate the schema, then `cds deploy` against the checked-in `db/data/`           | Same row counts, **plus** spot-check that `createdAt` values are the original ones and not the deploy timestamp |

The second row's extra check is not ceremony — it is the direct test of hazard 2 in §5, and it is
the one that would silently pass a naive row-count check while having destroyed the audit history.
The strongest single verification for either mechanism is the third one in the table's right column:
**answer a question through the application, not through SQL.** `project_view` returning the correct
next action for Financial Planner's CNV-001 exercises the hierarchy, the stage chain, and the
registers in one call, which is a far better integrity test than counting rows.

**Cadence.** Two natural anchors already exist in the workflow: the sprint checkpoint (`--no-ff`
merge plus an annotated `v{wave}.{sprint}` tag) and the schema change. A drill at every sprint
checkpoint is roughly monthly at the current cadence and costs a few minutes. A drill after every
schema migration is the one that actually catches regressions, because that is when a restore is
most likely to break. **A drill on any faster cadence will not be run, and a drill that is not run
is worse than none, because it manufactures confidence that was never earned.** Whether Sandro would
in fact run either is a question about him, not about the mechanisms — see §10.

---

## 9. The Comparison, and the Per-Option Verdicts

**No single mechanism restores all four properties, which is why the recommendation is a pair.**

| Option                                                | Diffable | Revertable | Cloned with repo | Survives laptop loss | Verdict                 |
| ----------------------------------------------------- | -------- | ---------- | ----------------- | -------------------- | ----------------------- |
| **A.** `pg_dump -Fc` to a local folder, scheduled     | No       | Yes        | No                | Only if copied off   | **Recommended** (floor) |
| **B.** Built CSV exporter → `db/data/`, committed     | **Yes**  | Yes (git)  | **Yes**           | Only if remote exists | **Recommended** (pairs with A) |
| **C.** `pg_dump --column-inserts` committed to git    | Poorly   | Yes (git)  | Yes               | Only if remote exists | Viable alternative to B |
| **D.** Seed CSVs hand-maintained as the source        | Yes      | Yes        | Yes               | Only if remote exists | **Rejected**            |
| **E.** `pg_dumpall` scheduled                         | No       | Yes        | No                | Only if copied off   | Viable alternative to A |
| **F.** File-system snapshot of the data directory     | No       | Yes        | No                | Only if copied off   | **Rejected**            |
| **G.** WAL archiving / PITR / `pg_basebackup`         | No       | Yes, finely| No                | Only if copied off   | **Rejected**            |
| **H.** `pgBackRest`                                   | No       | Yes        | No                | Yes, by design       | **Rejected**            |
| **I.** Nothing — accept the loss                      | No       | No         | No                | No                   | Viable, and say so      |

**Why D is Rejected, and it is the option most worth killing explicitly.** "Seed-data files as the
checked-in form" reads as a distinct third option in PSV-001 §8, but it is only distinct if the CSVs
are *authored* rather than *generated*. Making hand-maintained CSVs the authoritative form
reintroduces exactly the defect PSV-001 §2 names as the core problem — unconstrained artifacts that
any agent can write anything into, with the human as the integrity mechanism — one layer below where
it lives today. It would also fight the database: `cds deploy` UPSERTs (`cds-deploy.js:210-211`), so
a row deleted from the CSV is not deleted from the database, and the two drift silently. Once the
CSVs are generated instead of authored, option D *is* option B.

**Why I is honestly viable.** The entire dataset is 12 stories, 4 defects, ~6 decisions and one
checkpoint, and every one of those originates in git history and `design/` documents that CNV-005
explicitly does not touch. Reconstructing it by hand is an afternoon. That is not an argument for
doing nothing — it is the calibration that makes options G and H absurd here, and it is the reason
option A's zero build cost matters more than its lack of diffability.

**The property no option in the table fixes.** Every "survives laptop loss" cell is conditional on a
copy existing somewhere else, and today none does. The single highest-leverage action available —
`git remote add` plus a push, or a bare clone onto external media — is not a database mechanism and
is not in Sandro's sketch. It also protects the `design/` markdown, the source code, and the git
history itself, none of which any backup option above covers. **PSV-001 §7.2's "no cloud" rule is
written about deployment** ("Cloud or SaaS deployment — local only"); whether it extends to a backup
destination is a constitutional reading only Sandro can make, and it is flagged, not decided, in
§10.

---

## 10. What We Could Not Establish

- **Whether a CSV export actually restores.** No database spike was authorized. The §5 findings —
  deferred constraints, single transaction, UPSERT, managed-field preservation — are read from
  `cds-deploy.js` and the generated DDL, so the restore is *predicted* to work end to end. That
  prediction is untested and is the single test that would move this document's confidence from
  Medium to High: export the Financial Planner database to CSV, drop and recreate the schema,
  `cds deploy`, and compare row counts plus `createdAt` values.
- **`pg_dump` runtime, output size, and connectivity.** The Project Tracker schema does not exist,
  and we did not connect to Postgres. The configured credentials show `user: postgres` with an empty
  password, which implies `trust` auth or a `pgpass` file; which one was not established, and it
  determines whether a scheduled dump needs `PGPASSWORD` handling.
- **Whether draft tables should be excluded from an export.** `@cap-js/postgres` requires
  `cds.fiori.lean_draft` (it throws at plugin load without it, `cds-plugin.js:5-7`, **Verified**), so
  `.drafts` tables will exist. Whether `cds deploy` would attempt to load a `*.drafts.csv`, and
  whether draft rows are project state worth versioning, was not established. The presumption that
  drafts are transient and excluded is **Inferred**, not confirmed.
- **Whether the exporter can reuse the DataService layer.** Whether a standalone `tsx` script can
  bootstrap `cds.connect.to('db')` against the production profile outside a served process was not
  tested. `bin/deploy.js` does exactly this, so it is very likely; unverified.
- **Searches run that found nothing.** `cds help` full command list, `cds help add|import|compile|
  deploy`; grep for `csv|serialize` across `@sap/cds` `lib/` and `libx/`; grep for `csv` across
  `@cap-js/db-service`, `@cap-js/postgres`, `@cap-js/sqlite`; capire's databases and initial-data
  guides. No data-export facility surfaced in any of them. Context7 was unavailable in this session,
  so CAP documentation was reached via `WebFetch` and search against `cap.cloud.sap` directly; the
  on-disk source was treated as authoritative where it spoke.

---

## 11. Recommendation

**Adopt option A now and build option B as a catalogued object.**

**A — `pg_dump -Fc` on a schedule, retained locally.** Zero build cost, the tooling is already
installed at `C:\Program Files\PostgreSQL\17\bin\`, and it is the only option that captures schema
and data together in a form the vendor supports restoring. It settles the *backup mechanism,
frequency, retention* half of OI-01 immediately, and on its own it is sufficient to unblock CNV-005:
after cutover, project state would be no less recoverable than it is today. Concretely: a `tsx`
script invoking `pg_dump -Fc` with the absolute binary path, run at sprint checkpoint and before any
schema migration, keeping the last 30 dumps in a gitignored folder.

**B — a CSV exporter writing `db/data/{namespace}-{Entity}.csv`, committed to git.** This is the
only option that restores the diffable and revertable properties, and §5 establishes that its
restore path is genuinely supported: deferred foreign keys and a single-transaction UPSERT mean the
files load back cleanly, provided the exporter emits all key and managed columns and sorts by key.

**Fallback.** If B is judged too much ceremony for 12 stories, option C — `pg_dump --data-only
--column-inserts` committed at each sprint checkpoint — recovers a weak form of diffability with no
code at all. It is worse (noisy diffs per §7, slow restore per the PostgreSQL docs) but it is free,
and it is strictly better than option I.

**What would reverse this.** Three things. If the untested restore in §10 fails — if a CSV
round-trip cannot reproduce the database — option B collapses to option C and the recommendation
becomes A alone. If `cap-multi-module-backend` puts Project Tracker in Financial Planner's database,
the export unit becomes a shared model containing Sandro's card portfolio, and B inherits a privacy
problem that `db/seed/` currently solves with `.gitignore`; that may make B not worth its
complication. And if the module's data volume grows by two orders of magnitude — the "breadth"
deferral in PSV-001 §7.1 admitting non-software projects — the calibration in §9 changes and options
currently rejected as overkill deserve a second look.

### Does This Amend BA-001?

**Yes.** D-27 states: "If the answer turns out to be a periodic CDS/CSV export committed to git,
that becomes a Conversion and the catalogue is amended." Option B is exactly that, so the catalogue
gains one object.

One caveat for the workshop, not a decision taken here: **the D-27 label may be the wrong FRICEW
type.** A Conversion is a one-time data movement — CNV-001 through CNV-005 are all single-run cutover
acts. A recurring exporter is a standing capability, which is structurally an Interface. If it is
catalogued as a Conversion it will sit in an execution-ordered chain (`CNV-001 → … → CNV-005`) where
it does not belong, and CNV-005's dependency on it would be miscast as sequencing rather than as a
prerequisite. Worth one minute of the catalogue workshop's time.

Option A does **not** amend BA-001. It is a runbook, exactly as D-27 rules — no model, no service, no
handler, no test.

### The Questions That Turn on Taste, Not Evidence

Three, and the research deliberately stops short of answering them.

1. **Does "no cloud" reach backup destinations, or only deployment?** PSV-001 §7.2 forbids "Cloud or
   SaaS deployment". A private GitHub remote or a OneDrive-synced backup folder is neither a
   deployment nor a SaaS dependency of the running system, but it is unambiguously off-machine. This
   is the highest-leverage open question in this document — without an answer, no option in §9
   survives the laptop dying — and it is a reading of the constitution, which is Sandro's to make.
2. **How much ceremony is wanted per commit?** The export could run on every `complete_stage` verb
   call (maximum fidelity, a git diff on nearly every agent action, and a repo that grows noisy), at
   each sprint checkpoint (aligned with the existing `--no-ff` merge and tag ritual, roughly
   monthly), or on demand only. The evidence favours checkpoint-alignment because it matches a ritual
   that already reliably happens; the choice between the three is preference.
3. **Would a restore drill actually be run?** §8 sets out what a good drill is and why a drill nobody
   runs is worse than none. Whether Sandro would run one quarterly, or would let it lapse after the
   first, determines whether the drill belongs in the runbook at all — and only he knows.
