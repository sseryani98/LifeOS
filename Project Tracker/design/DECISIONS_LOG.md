# Design Decisions Log

All decisions made during the Project Tracker discovery and design phases. Each decision is
referenced by ID in design documents. The sequence is module-local — Financial Planner's D-nn IDs
are a separate sequence (D-17).

## How to Read This Log

- **Decision ID**: Referenced in all design documents (e.g., D-01)
- **Context**: What question or gap prompted this decision
- **Options**: What alternatives were discussed (omitted where there was no real fork)
- **Decision**: What was chosen
- **Rationale**: Why

Amendments are made in place — the superseded text is struck through and marked
"Amended by D-nn".

---

## D-01: Project Tracker Owns Project State

- **Context:** `METHODOLOGY_BLUEPRINT.md` §7 cast Project Tracker as a read-only HTML dashboard generator over the markdown state files. Does the module mirror state, sit alongside it, or own it?
- **Options:** A) Read-only mirror over the markdown files, B) PM overlay alongside markdown, C) Project Tracker owns state and the agent fleet writes into it
- **Decision:** C — Project Tracker owns project state. Not a read-only mirror, not a PM overlay. The markdown state files are retired. Blueprint §7 is superseded.
- **Rationale:** A mirror inherits the exact defect it would be built to fix: markdown stays authoritative, so nothing structural keeps state consistent and integrity still costs a reconciliation pass (P1). Only a store with constraints makes consistency structural rather than maintained.

## D-02: A Real CAP Module Now

- **Context:** A v1 HTML dashboard generator exists (`Project Tracker/dashboard/` — `generate.mjs` + `dashboard.html`). Evolve it, pass through a JSON-seed intermediate, or build the CAP module directly?
- **Options:** A) Evolve the v1 generator, B) JSON-seed intermediate on the way to CAP, C) A real CAP module now
- **Decision:** C — a real CAP module now. The v1 dashboard is deleted rather than evolved.
- **Rationale:** The generator's markdown parser was only valuable as an ingestion seed, and there is nothing to ingest once state lives in the module (D-01). An intermediate JSON store would be built and then thrown away. Building the module directly also makes Project Tracker the second real module on the shared stack, which is what tests whether the conventions are shared or planner-specific.

## D-03: Namespace `com.lifeos.projecttracker`

- **Context:** The root `CLAUDE.md` lists the CDS namespace as undecided — whether later modules become `com.lifeos.{module}`, and whether the planner gets renamed. Project Tracker is the first module that forces the answer.
- **Options:** A) `com.projecttracker`, mirroring the planner's `com.financialplanner`, B) `com.lifeos.projecttracker`, adopting a suite-wide convention
- **Decision:** B — `com.lifeos.projecttracker`. The `com.lifeos.{module}` convention is adopted and the root `CLAUDE.md` "undecided" item is closed. The root file is updated at Scaffold; Ideate does not touch root files.
- **Rationale:** Ruled now, over the blueprint's "do not assume" caution, because the second module is the cheapest point to set the convention — every module added later would otherwise repeat the question and a rename. Financial Planner's own rename is deferred, not cancelled (D-16).

## D-04: Project Tracker Is Sandro's Tool; Agents Are Instruments

- **Context:** Day-to-day writes come from Claude Code agents across ~9 methodology stages, which raises whose tool this is and whom the module is optimised for.
- **Decision:** Project Tracker is Sandro's tool. The agents are instruments writing into it, not users.
- **Rationale:** The question the module exists to answer — "what is the true state of my project, and what should happen next" — is asked and answered for Sandro. Agent write ergonomics are an access-layer concern (D-05), not the module's purpose; treating agents as users would make the product's success measurable in machine convenience rather than in whether Sandro can resume work in minutes.

## D-05: Bespoke In-Process MCP Server Over CAP

- **Context:** How skills and agents read and write project state once markdown is retired.
- **Options:** A) A generic Postgres MCP writing SQL directly, B) An MCP over HTTP to a running CAP service, C) A bespoke MCP server loading the CDS model and calling the CAP service layer in-process via `cds.connect.to()`
- **Decision:** C — a bespoke in-process MCP server exposing **intent-level verbs** (`start_stage`, `complete_stage`, `log_defect`, `record_decision`, `next_action`, `project_view` as sketched), not generic CRUD and not raw SQL. No CRUD escape hatch. The verbs enforce the methodology.
- **Rationale:** A generic Postgres MCP bypasses the service layer, the Facade/Service/DataService/Validator/Mapper pattern, CDS constraints and managed fields — discarding the whole reason to build a CAP module rather than a JSON store, and letting a malformed write corrupt state silently. MCP over HTTP keeps one logic location but gives every agent write an ambient "is the service up?" dependency that fails unpredictably. In-process keeps CAP handlers (and therefore validation) executing with no separate process to keep alive. Intent verbs mean agents need no schema knowledge, typed inputs make malformed writes fail loudly at the boundary, and the module can express rules markdown cannot — `complete_stage("commit")` can reject while Human Review is open. Removing the escape hatch is what makes the enforced path the only path.

## D-06: Rewire the Existing Skills; Author No New Skill

- **Context:** Skills, agents, workflows and scripts currently read and write the markdown state files — an eight-file surface measured in `PLAN.md` §6.
- **Decision:** The existing skills and workflows are rewired onto the MCP verbs. No new skill is invented for state-keeping.
- **Rationale:** The methodology chain already exists and is already invoked at every stage; what changes is where those stages write, not what they do. A new skill would add a step to the chain instead of removing markdown from it. `/pm-update` largely dissolves as a consequence — most of what it audits becomes structurally impossible to create.

## D-07: Both Deterministic Guards Enable at Cutover, Not Before

- **Context:** Two complementary guards keep state out of markdown after migration: a hard-denying `PreToolUse` hook on the retired state paths ("you cannot do the wrong thing") and a `lintNoMarkdownState` linter over `.claude/**` and `Standards/**` ("nothing tells you to do the wrong thing"). When do they switch on?
- **Decision:** Build both; enable both at cutover as the final act of the rewiring stage, not before.
- **Rationale:** While markdown is still authoritative, the hook would hard-deny legitimate Financial Planner work. A hook cannot perform the migration anyway — it can only ratchet it shut afterward, so enabling it early buys nothing and blocks the sprint in progress.

## D-08: Hierarchy Mapping — Story Sits at Milestone

- **Context:** Financial Planner's sprint vocabulary has to map onto the PRD hierarchy (Area → Engagement → Workspace → Initiative → Milestone → Task → Subtask).
- **Options:** A) Story = Task, with methodology stages as Subtasks, B) Story = Milestone, with methodology stages as Tasks and workflow steps as Subtasks
- **Decision:** B — sprint = Initiative, story = Milestone, methodology stage = Task, workflow step = Subtask. For Financial Planner that reads: Area "Personal Software" → Engagement "Life OS" → Workspace "Financial Planner" → Initiative "W1-S3" → Milestone "CNV-001".
- **Rationale:** The PRD caps subtasks at one level, so with story as Task the build workflow's six internal agent steps would have nowhere to live. The mapping also produces the answer the daily routine needs: "what is next" resolves to a **stage**, not a story.

## D-09: FRICEW Type Canonical Name Is "Interfaces"

- **Context:** Two live sources disagree — the ratified `BUSINESS_ARCHITECTURE.md` says "Interfaces"; `/pm-update` check 6 enforces Type ∈ {…, **Integration**, …}. One is wrong, and the seeded catalogue will inherit whichever is carried forward.
- **Decision:** "Interfaces" is canonical. `/pm-update`'s "Integration" is corrected when the skill is rewired.
- **Rationale:** It matches the FRICEW acronym and the ratified document, and the rewiring stage is already rewriting that skill — correcting it there costs nothing and stops the contradiction entering the migrated data.

## D-10: Test Reports Become `TestRun` Records

- **Context:** `generateTestReport.ts` writes timestamped Jest summaries (total / passed / failed / skipped / duration) to `project/test-reports/`, unlinked to any story or stage.
- **Decision:** Test runs become lightweight `TestRun` records written by `gate-runner` and linked to the story's stage. `generateTestReport.ts` stops writing markdown.
- **Rationale:** Linked runs give the workspace header a real gate-status tile and a trend, and make gate history queryable per story (P5). The markdown reports were data nobody could reach — five files that answer no question without being read one by one.

## D-11: v1 Serves Financial Planner Only

- **Context:** The PRD reaches across non-software projects, persistent personal systems and other areas of life (P2). How much of that reach does the first build carry?
- **Decision:** v1 serves Financial Planner and only Financial Planner. The wider reach is explicitly a later slice, and the day-one data model is not stretched to accommodate it.
- **Rationale:** Financial Planner is the only project with real state to migrate and the only one that exercises the methodology chain end to end. Generalising before that works would design against imagined projects instead of the one available test. OI-05 carries the residual question of how generic Methodology must nonetheless be.

## D-12: Migration Covers Project State Only

- **Context:** Which markdown moves into the module, and which stays.
- **Decision:** `project/SPRINT_BOARD.md`, `project/DEFECT_LOG.md`, `project/sprints/*.md` and `project/test-reports/` become records. Everything under `design/` stays markdown, and git remains the system of record for work product.
- **Rationale:** Design docs are prose deliverables that `/refresh-docs` already owns; they have no consistency defect to fix. The split also fixes the module's boundary — Project Tracker owns state _about_ work, never the work itself.

## D-13: Cutover Before CNV-001

- **Context:** `PLAN.md` §2 set cutover before `FRM-001`, while the board was clean. The live board shows FRM-001 **Done** (commit 46094f9), so that window has passed.
- **Decision:** Cutover lands before **CNV-001** — the last remaining W1-S3 story.
- **Rationale:** CNV-001 then runs its entire chain on the new system, which is the real test of it before Project Tracker's own build continues, and it keeps the original intent (cut over between stories, with nothing In Progress). The stale instruction that forced this correction is itself an instance of P4.

## D-14: Full Plan + Design Methodology, Scoped to Slice 1

- **Context:** How much methodology Project Tracker's own design phase runs, given slice 1 is small.
- **Decision:** Every Plan + Design stage runs — Ideate → Scope → Research → Scaffold → Workshops → IA → Design System → Theme → Data Model → Tech Stack → Test Strategy → Project Planning — but scoped to the slice-1 surface. Missing `/generate-*` skills are authored as their stage arrives.
- **Rationale:** Per the blueprint no stage is done by hand, and scoping each stage to slice 1 keeps every artifact short, so running the full chain is cheap. Authoring skills on arrival avoids building tooling for stages whose shape slice 1 may trim — IA, Design System and Theme are scope-dependent.

## D-15: Seed Depth — Two Sprints Summarised, One Modelled Live

- **Context:** How deeply Financial Planner's history is modelled by the migration.
- **Decision:** W1-S1 and W1-S2 become completed Initiatives with their stories as Done Milestones and no per-stage detail. W1-S3 is fully modelled with the live methodology chain.
- **Rationale:** Per-stage detail for the earlier sprints was never tracked, so it cannot be reconstructed honestly. Backfilling plausible stages would put invented history into the register that exists precisely to be trustworthy (P1).

## D-16: Financial Planner's Namespace Rename Is Deferred

- **Context:** Financial Planner declares `namespace com.financialplanner;`, which diverges from the `com.lifeos.{module}` convention adopted in D-03.
- **Decision:** Deferred, not cancelled — the rename runs as its own change after W1-S3.
- **Rationale:** Measured blast radius is 65 files and 192 occurrences (roughly 34 in `app/`, 11 in `db/` and `srv/`, 6 in integration tests, plus `package.json`, `CLAUDE.md` and two design docs). Running that mid-sprint risks the planner's remaining story for a consistency gain that has no deadline.

## D-17: Decisions Log at `design/DECISIONS_LOG.md`

- **Context:** Financial Planner keeps its log at `design/user-profile/DECISIONS_LOG.md`. Does Project Tracker copy the path, and does it continue the planner's D-nn sequence?
- **Decision:** Project Tracker's log lives at `design/DECISIONS_LOG.md`, with a fresh D-nn sequence starting at D-01.
- **Rationale:** `user-profile/` reads as planner-specific — the folder exists for Sandro's profile, not for decisions — so inheriting it would carry a naming accident into every future module. Separate per-module sequences keep decision IDs unambiguous inside each module's own documents.

## D-18: Source Precedence

- **Context:** Four documents describe Project Tracker and they overlap and conflict: `PLAN.md`, `IDEATE_KICKOFF.md`, `PRD.md`, and `Standards (Documents)/METHODOLOGY_BLUEPRINT.md`.
- **Decision:** Precedence is `PLAN.md` > `IDEATE_KICKOFF.md` > `PRD.md` > `METHODOLOGY_BLUEPRINT.md`. The blueprint is a self-declared unratified draft whose §7 is superseded by D-01 and D-02. `IDEATE_KICKOFF.md` is self-declared scratch and is deleted once this artifact exists. The PRD remains the full product design — slice 1 is a small fraction of it.
- **Rationale:** Where the documents conflict the most recent ruling wins, and `PLAN.md` carries it. Naming the order once stops every later stage re-litigating which document is authoritative, and marks the blueprint's superseded section explicitly rather than leaving a reversed instruction live.

## D-19: Defect Is Its Own Entity; Three Registers Shown, Four Written

- **Context:** PSV §6 contradicts itself — item 3 names four registers while item 6 says the project view shows three. Underneath that sits a second conflict: `PRD.md:326` states that "a defect is a task with the Defect type, not a separate object", which would make the Defect register a filtered view of Task rather than a register at all.
- **Options:** A) Follow the PRD — Defect is a Task type, and the view shows a filtered task list, B) Defect is its own entity, and the register count is reconciled by deciding which registers are written and which are shown
- **Decision:** B. Defect is its own entity. **Four registers are written** — Defect, Decision, Activity, TestRun — and **three are shown** on the project view: the Defect table, the Decision list, and the combined Activity timeline. `TestRun` is written-only in slice 1, surfacing as the workspace header's gate-status tile rather than as a fourth browsable register.
- **Rationale:** The PRD line predates D-05 and D-08, and D-08 already spends Task on methodology stages — the slot the PRD assumes is free is taken, so a defect modelled as a Task would have to compete with a story's own 9-stage chain. `log_defect` is a named verb in D-05's own verb list, and the defect log has a distinct source shape (severity, status, `file:line` references, commit SHAs) that a stage Task does not carry. Showing three and writing four resolves the §6 contradiction without dropping data: a gate tile is precisely what D-10's rationale describes wanting from linked test runs, and browsing raw runs answers no question at slice-1 volume.

## D-20: Slice 1 Ships Two Forms and a `plan_sprint` Verb

- **Context:** As first catalogued, slice 1 had zero human write surfaces — every write arrived through an agent verb. That does not survive contact with three facts: Current Focus is a manually maintained summary and by definition not derivable, someone must transition a sprint from active to Complete, and cutover's `PreToolUse` hook hard-denies `SPRINT_BOARD.md`, which is the only existing way to create a sprint.
- **Options:** A) Two Forms, and sprint creation stays a human-only surface, B) One Form for the header plus a `plan_sprint` verb, so agents create sprints, C) Both — two Forms and the verb
- **Decision:** C. FRM-001 Workspace Header Editor, FRM-002 Sprint Planning Form, and a `plan_sprint` verb on INT-001.
- **Rationale:** Without a creation surface the system blocks the moment the migration proves itself — Financial Planner's CNV-001 closes W1-S3 and planning W1-S4 is the very next act, so a slice that cannot create a sprint fails within one story of cutover. Both paths write through the same CAP service, so validation is shared rather than duplicated, and the choice between typing a sprint and asking Claude mid-session costs nothing. Neither Form is a CRUD escape hatch: D-05 prohibits **agents bypassing the service layer**, not Sandro using a validated Form over CAP.

## D-21: The Project View Is Four Reports; IA, Design System and Theme Run in Full

- **Context:** PSV §6 item 6 names the project view's four components in one breath — workspace header, next action and task queue, methodology chain, registers — which leaves open whether that is one FRICEW object or several. `PLAN.md:75` makes design stages 6-8 (Information Architecture, Design System, Theme) contingent on how much UI slice 1 turns out to carry.
- **Options:** A) One Report for the whole project view, B) Four Reports, registers as a single object, C) Seven Reports, splitting the registers into Defect, Decision and Activity
- **Decision:** B — four Reports composing one page, with the three shown registers as a single object (RPT-004). Consequently IA, Design System and Theme all run rather than being trimmed.
- **Rationale:** One object would make the workshop a four-feature session and the story undemonstrable — nothing could be shown until all of it worked. Seven would split registers that share one display pattern at trivial volume (4 defects, ~6 seeded decisions), buying three specs where one suffices. Four Reports plus two Forms (D-20) is a real UI by any measure, which settles `PLAN.md`'s contingency in favour of running the design stages properly. Layout across the four is Information Architecture's decision, not the catalogue's.

## D-22: Methodology Genericity Is Out of Slice 1

- **Context:** The PRD carries a Type system (types defining custom fields, statuses and health rules), Templates, methodology combination with shared-step merge, and refresh of an already-instantiated chain when the library changes. OI-05 asks how generic `Methodology` must nonetheless be.
- **Decision:** None of them are catalogued. Slice 1 carries `Methodology` + ordered `MethodologyStep`, per-story instantiation (ENH-001), and the stage state machine (WFL-001). OI-05 is unchanged and still settles at the Data Model stage.
- **Rationale:** Every one of those four features configures **variation**, and one methodology over one project cannot exercise variation — a Type system with one type, a Template library with one template, and a merge with nothing to merge are all specification without a test. Building them would design against imagined projects, which is exactly what D-11 already ruled out. Leaving OI-05 open is the honest position: the data model must not preclude genericity, but slice 1 does not build it.

## D-23: The Rewiring Surface Is Ten Files, Not Eight

- **Context:** `PLAN.md` §6 measured the markdown-state surface at eight files and 16 references. Re-grepping during scoping confirmed all eight exactly and found more.
- **Decision:** Two files join the catalogued rewiring: `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` (5 refs, lines 255-259) joins INT-003, and `Financial Planner/CLAUDE.md` (3 refs, lines 75-77) joins INT-002. The 32 further references across six `Financial Planner/design/*.md` files do **not** become catalogued objects — they go to a `/refresh-docs` sweep at cutover.
- **Rationale:** The test for inclusion is whether the file **instructs an agent**, and both added files do. The blueprint additionally sits inside `lintNoMarkdownState`'s stated `Standards/**` glob, so leaving it would turn the linter red the moment INT-006 enables it — that makes it load-bearing, not cosmetic. The six design docs are prose deliverables that `/refresh-docs` already owns and that D-12 keeps as markdown; catalogueing them would put documentation maintenance into the build backlog. Also recorded as a measurement caveat: a directory-scoped ripgrep over `.claude/` silently returned only `.js` hits, and the `.md` files matched only with an explicit `**/*.md` glob — any future measurement omitting that glob under-reports by six files.

## D-24: No Stage History Is Backfilled, and `TestRun` Starts at Financial Planner's CNV-001

- **Context:** D-15 set the seed depth — two sprints summarised, one modelled live — but left three questions unanswered. What does "W1-S3 fully modelled" mean for its three stories that are already Done? Do the five markdown test reports migrate? And what becomes of the one sprint checkpoint report, which is neither a story, a defect nor a test run?
- **Decision:** Three rulings. (1) Financial Planner's W1-S3 Done stories — its ENH-001, ENH-009 and FRM-001 — become Done Milestones with **no stage detail**, exactly like W1-S1 and W1-S2; "fully modelled" means CNV-004 instantiates the live chain for the one story that still has one. (2) The five markdown test reports are **not** backfilled; `TestRun` history begins with Financial Planner's CNV-001, the sole exception being the W1-S2 checkpoint's metrics, which do link to a sprint and seed one record. (3) The checkpoint's remaining prose becomes a **manual narrative Activity entry of kind "checkpoint"**, preserved verbatim, rather than a new entity.
- **Rationale:** D-15's own reasoning extends to all three. Stage history for finished stories was never recorded, and plausible reconstruction is invented history in the one register that exists to be trustworthy (P1) — the fact that a story finished last week rather than last month does not make its stages recoverable. No test report names a story, sprint, branch or commit, and retention already caps at five, so the record is lossy by design and backfilling it would fabricate linkage rather than restore it. Inventing a Checkpoint entity to hold one file is structure without a second instance; the checkpoint's story table and defect summary are already covered by CNV-002 and CNV-003, so only its narrative needs a home, and the Activity timeline is one.

## D-25: The Activity Log Is a Side Effect of the Verb Layer, Not an Object

- **Context:** PSV §6 names the Activity log as one of the four registers, but nothing in the repo produces an activity trail today — there is no writer, no source file and no established shape to migrate.
- **Decision:** Not catalogued as a standalone object. Every INT-001 verb that changes state emits an Activity event as a side effect; the manual narrative half (status update, checkpoint, lesson) folds into FRM-001; the display is RPT-004's combined timeline.
- **Rationale:** Cataloguing it separately would mean specifying a writer with no callers of its own — the writing already happens at a boundary every state change crosses, so the object would be an emission described twice. Making it a side effect of the verb layer also makes it structurally complete: there is no path to change state that skips it, which is the property a trustworthy activity log needs and a separately-invoked writer could never guarantee.

## D-26: `generateTestReport.ts` Writes the `TestRun`, Not `gate-runner` — Corrects D-10

- **Context:** D-10 assigned the `TestRun` write to `gate-runner`. Inspecting the agent during scoping showed it declares `tools: Read, Grep, Bash` — no write channel — and carries **zero** references to any retired markdown path, which is why it never appeared in `PLAN.md` §6's surface measurement.
- **Decision:** The write moves to `Standards (Technical + Linting)/scripts/generateTestReport.ts`, which already runs as `posttest` and already holds the Jest JSON. `gate-runner` invokes the script exactly as it does today and needs no new tool grant. D-10 stands in every other respect.
- **Rationale:** D-10 named the wrong component; the script is where the data already is, so the change is a swap of output target rather than new plumbing, and it avoids widening an agent's tool grant purely to let it write records. Recorded as a correcting decision rather than an in-place edit to D-10 so the original reasoning — and the measurement blind spot that produced the error — survives for the next stage that reads this log.

## D-27: OI-01 Durability Is a Runbook, Not a Slice-1 Object

- **Context:** PSV §8 marks OI-01 — what replaces git's diffable, revertable, repo-cloned history once project state lives in Postgres — as "must settle before cutover". "Must settle before cutover" could reasonably be read as a build story inside this slice.
- **Decision:** Not catalogued. OI-01 is recorded in `BUSINESS_ARCHITECTURE.md` §3 as an explicit dependency blocking CNV-005. If the answer turns out to be a periodic CDS/CSV export committed to git, that becomes a Conversion and the catalogue is amended to add it.
- **Rationale:** It is a sequencing constraint on the stage, not a unit of behaviour — until the mechanism is chosen there is nothing to specify, and an object minted now would be a placeholder that a workshop could not scope. Recording it as a named blocker on the one object it gates keeps it impossible to forget, which is the only property that mattered; amending the catalogue once the mechanism is known costs one row.

## D-28: D-05's Wording Is Amended; Its Decision Stands, Now Spike-Validated

- **Context:** The Research stage ran an executed spike against D-05's in-process MCP-over-CAP design and graded fourteen prior assumptions. Three statements in D-05 did not survive contact with the evidence, none of them the decision itself.
- **Decision:** D-05's **decision is unchanged** — a bespoke in-process MCP server over CAP exposing intent verbs, no CRUD, no raw-SQL escape hatch — and is now **validated by an executed spike** rather than inferred: CAP `before`/`on`/`after` handlers, `ASSERT_MANDATORY`, `ASSERT_RANGE`, managed fields and transaction rollback all fired with `cds.app === undefined` and zero server handles. Three wording corrections are recorded. (1) **The mechanism is not a bare `cds.connect.to()`.** `cds.connect.to('SpikeService')` throws `Didn't find a configuration for 'cds.requires.SpikeService'`; the connection needs a construction step first — `cds.serve`, the service class, or `{kind:'app-service'}`. (2) **The "a generic Postgres MCP bypasses managed fields" contrast is partly refuted.** `createdAt` and `createdBy` were still stamped on a direct `db` write; only **raw SQL** loses them, so the original rationale overstated the contrast. (3) **`@cap-js/mcp` now exists and was considered and set aside** — SAP published v1.2.0 on 2026-07-21, five days before the research; it is Beta, read-only ("currently focused on reading data and calling unbound actions and functions only"), HTTP-transport only, and exposes a generic `describe`/`query`/`call_action` surface, which is precisely the surface D-05 rejects and precisely the "is the service up?" dependency it rejects.
- **Rationale:** All three corrections leave the conclusion intact while removing statements a future reader could disprove in a minute. The first would have cost real implementation time — an INT-001 spec written against a bare `cds.connect.to()` fails on the first run. The second matters because an overstated rationale invites re-litigation of a sound decision. The third is the one a future reader is most likely to raise: finding an official SAP MCP adapter and no mention of it in the log reads as an oversight, whereas recording that it fails INT-001 on three counts stated by SAP's own documentation makes the decision defensible. Recorded as an amending decision rather than an in-place edit so the original reasoning, and the fact that it was tested rather than assumed, both survive.

## D-29: Two CDS Models, Separate Postgres Databases — Resolves OI-02 (Backend)

- **Context:** OI-02 asked whether Financial Planner and Project Tracker share one CAP service or run one each, and how their data sits in Postgres. The research reframed the question: the real axis is one CDS **model** or two — one model can already expose four services, as Financial Planner does — and the database question is separable from both.
- **Options:** A) One composed CDS model over both modules, B) Two models sharing one Postgres database, C) Two models, a schema each, D) Two models, a database each
- **Decision:** D — **two CDS models, separate Postgres databases.** Financial Planner and Project Tracker each keep their own model and their own database.
- **Rationale:** The prior assumption was that two services **threatened** INT-001, because D-05's in-process design was thought to need "one resolvable CDS model". The truth is the exact inverse: a Node process runs exactly one CAP project by construction, so two separate models is the **easy** case and makes INT-001 simpler, not harder. One composed model would have dragged Financial Planner's 128 Postgres objects, its Postgres binding, its cron jobs and its `ENCRYPTION_KEY` into the MCP server's process — everything Project Tracker has no business loading. Separate databases also close two risks that were live only under sharing: **R4**, where two projects deploying into one schema each read the other's `cds_model` CSN snapshot as "prior" and emit DROPs, with `schema_evolution: "auto"` on by driver default; and **R3**, two module roots each declaring `cds.requires.db` when `cds.env` binds once to one root and does not re-read. It dissolves **R8** outright — the OI-01 exporter never runs over a model containing Sandro's card portfolio, which `db/seed/`'s gitignore currently protects, and that is what makes committing its output safe.

## D-30: One Shared UI5 Shell — Resolves OI-02 (Shell)

- **Context:** OI-02's second half asks whether the modules share one UI5 shell or each get their own, and it had to be ruled on together with D-29 because the two were believed to be coupled.
- **Decision:** **One shared UI5 shell** spanning modules. This is a non-negotiable requirement, not a preference weighed against alternatives.
- **Rationale:** The assumed coupling is weaker than it looked: a shared shell requires one **origin**, not one CAP service, so it composes with D-29's two models rather than contradicting them. The prior claim that "nobody has checked whether a shell is achievable locally" is refuted — Financial Planner **already runs** a hand-built `sap.tnt.ToolPage` shell at `app/shell` hosting four apps as components, so the pattern is proven for the single-module case. What remains unproven is the cross-module case: **R9**, two CAP processes serving into one shell page, is `Inferred` only, from relative resource roots plus `cors: !production`, and has never been executed. It is carried as a live risk against RPT-001…RPT-004 rather than as a condition on this decision, because the requirement is fixed and the risk is about how it is implemented; a second server on another port, one resource root, and both components in one host page settles it cheaply.

## D-31: OI-01 Durability — A `pg_dump` Runbook Plus a Built CSV Exporter, to a Git Remote

- **Context:** OI-01 asks what replaces git's diffable, revertable, repo-cloned history for project state once that state lives in Postgres. PSV §8 marks it "must settle before cutover" and D-27 left it as an uncatalogued blocker on CNV-005.
- **Options:** A) A `pg_dump` runbook alone, B) Hand-maintained CDS seed files as the checked-in form, C) A built CSV exporter alone, D) A `pg_dump -Fc` runbook as the floor plus a built CSV exporter as the diffable form
- **Decision:** D. A `pg_dump -Fc` runbook is the binary floor, and a **built CSV exporter** is the diffable, git-committed form; the destination is a **git remote**. The exporter is catalogued as **INT-007, an Interface** — this **supersedes D-27's pre-labelling of it as a Conversion**. Cadence is per sprint checkpoint.
- **Rationale:** The two mechanisms are complementary, not alternatives — `pg_dump` restores, CSV diffs — and neither alone covers both properties. **The exporter has to be built because CAP has no data export at all**: 27 CLI commands, none of which export data; `cds add data` writes empty headers; and `cds.utils.csv.serialize` is broken for tabular data, emitting the array index as the first column and comma-joining the row into the second. That finding also collapses option B into this object rather than leaving it a distinct choice — seed files are not producible from the database — and **hand-maintained seed files are rejected outright**, because a hand-maintained artifact reinstates exactly the unconstrained-artifact defect PSV §2 names and the module exists to fix. A committed `pg_dump` is not a substitute: `pg_dump` does not sort rows, so a status change that relocates a tuple reorders the file and the diff is noise. The type ruling matters structurally: a **recurring** exporter catalogued as `CNV` would land inside `BUSINESS_ARCHITECTURE.md` §5's strict `CNV-001 → … → CNV-005` execution chain, where a repeating job does not belong. The destination is the sharpest finding — **this repo has no git remote at all**, only three stale `vscode-merge-base` lines pointing at one that does not exist, so "survives the laptop dying" is a property the current markdown state does not have either. Adding a remote gives the exporter's output and the repository itself off-machine durability from the same act. Checkpoint cadence matches the existing `--no-ff` + tag ritual; per `complete_stage` would be noise. **R7** stays live and unexecuted: the CSV round-trip is untested, and a naive row-count check passes while `createdAt`/`createdBy` history is destroyed, so the drill is export → drop → `cds deploy` → compare row counts **and managed-field values**.

## D-32: `INT-006` Scope Correction — Matcher, and a Tracked Installer for the Hook

- **Context:** Research into `PreToolUse` hook mechanics found INT-006's matcher partly wrong and its coverage inventory incomplete, and turned up a durability problem in where the hook is registered.
- **Decision:** Three corrections to INT-006. (1) **`MultiEdit` is dropped from the matcher** — it is not a tool, absent from the documentation and from the installed `sdk-tools.d.ts`. (2) **`mcp__*` and `NotebookEdit` are added**; `NotebookEdit` carries its path in `notebook_path`, not `file_path`, so it needs its own inspection. (3) **Hook registration ships as a tracked installer script** under `Standards (Technical + Linting)/scripts/`. The **`Bash` carve-out stands** — the hook still does not parse shell commands.
- **Rationale:** `MultiEdit` was harmless dead text, but a matcher naming a non-existent tool invites the reader to trust the rest of the list. The `mcp__*` gap is the sharp one: **this repo runs its own MCP server after cutover** (INT-001), so an unguarded MCP write verb is a hole in precisely the surface the guard exists to close — the guard would be blind to the one write path the migration creates. The Bash carve-out survives on better evidence than it had: Anthropic's own documentation describes command matching as fragile and fail-open, so parsing it would buy false positives rather than coverage. The registration problem is the one that would have gone unnoticed: **`.claude/settings.json` is gitignored** (`.gitignore:8`), so INT-006's two halves have different durability — `lintNoMarkdownState.ts` is a tracked file in the shared suite, while the hook registration would be absent on a fresh clone and cutover's guarantee would silently lapse. An installer script is preferred over un-ignoring the settings file because that file also holds local permissions, which are not a shared artifact. Recorded here rather than deferred to the INT-006 workshop because it closes risk **R6**, and because a guard whose durability is undecided is not a guard. Related and settled by evidence rather than by ruling: hooks **do** fire inside subagents — `agent_id` appears 21 times in the installed v2.1.90 bundle — which matters because this repo's entire build workflow runs through `implementer`, `test-author` and friends, and a guard that missed subagents would guard nothing.

## D-33: TypeScript Service Implementations Load via `CDS_TYPESCRIPT` Plus a `tsx` Loader — Settles R2

- **Context:** R2 was the highest-priority residual from Research and the one `INT-001` depends on: how a TypeScript service implementation loads outside `cds watch` was graded **Unknown**. CAP's `_sibling()` resolver only considers `.ts` when `process.env.CDS_TYPESCRIPT` is set (`lib/srv/factory.js:46`), and Financial Planner's own integration tests carry the comment "cds.test cannot load the TypeScript service impl". Project Tracker is TypeScript throughout, so an unanswered R2 blocks the whole access layer.
- **Options:** A) `CDS_TYPESCRIPT=true` alone, relying on Node's native type stripping, B) A `tsx` loader alone, C) Both together, D) A compile step producing `.js` before serving
- **Decision:** **C — both, and they are independent levers rather than alternatives.** `CDS_TYPESCRIPT=true` makes CAP's resolver look for `.ts` at all; `tsx` makes Node able to import what the resolver then finds. Verified by executed spike on this machine at `@sap/cds` 9.8.4 / Node 22.19.0: with both, a service loads and dispatches with `cds.app === undefined` and no HTTP server. **The formal ruling belongs to the Tech Stack stage**; what this decision records is that a mechanism exists, which one works, and why the cheaper option does not.
- **Rationale:** Each option was executed rather than reasoned about. **A fails on this repo's own idiom.** Node 22.19 does strip types natively, but the shared `tsconfig.base.json` sets `module: Node16`, under which TypeScript source imports a sibling as `./types.js`; Node's strip-only mode does not rewrite that back to `./types.ts` and the import throws `ERR_MODULE_NOT_FOUND`. Financial Planner's `srv/` writes `.js` specifiers in every relative import — 29 to `./types.js` alone — so this is the repo standard, not an edge case. Strip-only mode additionally rejects TS `enum` and `namespace` outright (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`) and requires `import type` on every type-only import. **B fails for a different reason and is the more instructive failure:** with `tsx` loaded but `CDS_TYPESCRIPT` unset, the service starts cleanly and then rejects every call with `Service "X" has no handler` — the resolver never offered the file, so the loader had nothing to load. That failure is silent at startup and surfaces only at first dispatch, which is exactly the kind of thing worth executing once rather than discovering inside `INT-001`. **D was not taken** because it puts a build step between editing a handler and running it, for a problem two environment-level levers already solve, and `tsx` is already a root devDependency so C adds nothing to install.

## D-34: `@sap/cds` Is Pinned to an Exact Version Across the Whole Repo

- **Context:** Both modules declared `"@sap/cds": "^9"`, following the repo's existing range convention. Adding Project Tracker to the workspace and running `npm install` from the root moved Financial Planner's CAP runtime from 9.8.4 to 9.9.3 and broke **68 tests across 6 suites** in a sprint that is mid-flight — found by Scaffold's own verification, not by the change that caused it.
- **Options:** A) Keep `^9` and accept the float, B) Pin exactly in each module only, C) Pin exactly at the root **and** in each module, D) Use npm `overrides` at the root
- **Decision:** **C.** `@sap/cds` is pinned to `9.8.4` in the root `devDependencies` and in both modules' `dependencies`. Raising it is its own change, made deliberately with the suite green before and after.
- **Rationale:** The break is a genuine CAP behaviour change, not a hoisting artifact: 9.9.x `await`s `cds.plugins` inside `bin/serve.js`, which is a dynamic `import()`, and Jest's CJS VM rejects it without `--experimental-vm-modules` — every `cds.test` suite fails at `serve()`. **What made a one-module-safe convention unsafe is the second module.** With one workspace package the CAP toolchain nested under it and resolved that module's copy; with two, npm hoists the shared toolchain to the root, and `@cap-js/cds-test` carries a `>=8.8` **peer** range that pulls its own newer runtime up there. So B was tried and was not sufficient — both modules resolved 9.8.4 while the hoisted `@cap-js/cds-test` still loaded 9.9.3 from the root, and the suite stayed red. D was tried first and npm silently ignored it, because an override may not conflict with a direct dependency spec and both modules depend on `@sap/cds` directly. Only pinning the hoisted copy as well produces one runtime for the repo. Recorded as a decision rather than a fix because the rule now binds every future module: **a floating range on a hoisted dependency is a shared, silent lever.**

## D-35: Invocation Points for the Three Unrunnable Stages — Closes OI-03

- **Context:** OI-03: `functional-tester` and `ux-tester` existed as agents but had no slash command, and `/human-review-loop` had no defined trigger. Three of the nine Sprint Build methodology stages therefore had no invocation point. This blocks Project Tracker directly — the project view names a **next action**, and a next action resolving to a stage nobody can run is a wrong answer produced confidently, which is the P4 defect the module exists to remove.
- **Decision:** Three additions. (1) `/functional-test` — resolves a story, spawns `functional-tester`, renders the FUT matrix, fixes nothing. (2) `/ux-test` — the same shape over `ux-tester`, and it **stops when the story ships no UI** rather than reviewing someone else's screens. (3) `/human-review-loop` gains an explicit chain position in its description and a **When this fires** section naming both entry points, with the rule that an agent may never declare the stage complete on its own behalf.
- **Rationale:** The two commands are thin by design — resolution and rendering only — because both agents already carry the whole method, and duplicating it into a command creates a second copy to drift. Each stops rather than runs where running would produce a misleading result: a story with no spec has no FUTs to verify, and a story with no UI has no pages to review. Human Review needed the opposite treatment. Its gap was never a missing command — the skill was already invocable — but a missing _position_ in the chain and no rule about who may close it. "Reviewed, nothing found" and "never reviewed" are indistinguishable downstream, which is why the stage must be recorded rather than inferred, and why it becomes a **Required, manual** Task when the chain is modelled as data.

## D-36: The `lint:*` Block Is Copied Then Audited, and a Shared Linter Must Survive a Missing Folder

- **Context:** Root `CLAUDE.md` §"Adding a Module" step 2 says to copy Financial Planner's `lint:*` block **verbatim** because "the paths are already module-relative". Scaffolding the second module falsified that in three separate ways.
- **Decision:** Three corrections, all made at the root rather than carved out in the module. (1) The instruction becomes **copy, then audit** — the 21 shared linters are portable, but the block also carries `lint:ui5` (`cd app/admin-master-data && ui5lint`), which names a Financial Planner app folder. (2) A shared linter **skips a missing scan root instead of crashing**; `lintNoTrackingIds.ts` is fixed accordingly. (3) The `eslint` leg carries `--no-error-on-unmatched-pattern` in every module. Also corrected: the root's linter count, which read 20 and is 21.
- **Rationale:** All three are the same failure — a claim about portability never tested against a second module, which is exactly what the root file predicted a second module would expose. The alternatives were worse in the same way: pointing the UI5 lint script at a nonexistent folder, creating an empty `scripts/` directory so `lintNoTrackingIds.ts` stops throwing, or dropping the linter from the module's chain would each have made the suite green by making it check less, and the last two would have put module-shaped workarounds where a shared-tooling bug is. The `--no-error-on-unmatched-pattern` flag is not a weakening: ESLint exits 2 when a passed directory holds nothing lintable, which is the normal state of a scaffolded module, and a probe file carrying real violations still exits 1 with the flag on. Root `CLAUDE.md` §Do NOT already forbids adding a module-specific path to a shared linter; this records the converse duty — **a shared linter owes every module the right not to have a folder.**
