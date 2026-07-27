---
name: scaffold-module
description: Run the Scaffold stage for a Life OS module — create the module folder and its workspace wiring per the root CLAUDE.md "Adding a Module" steps, reconcile whatever the new module forces the root to decide, and hand a scaffold record to the scaffold-writer agent that writes the module's CLAUDE.md. Use whenever Sandro wants to stand up a new module, scaffold or bootstrap one, wire a module into the npm workspace, or says "run Scaffold", "scaffold Project Tracker", "create the module folder", "add the module to the workspace"; or when a Design or Build stage is blocked because the module has no folder, no package.json, and no place to put code. Also use to re-run Scaffold when the workspace wiring has drifted.
---

Scaffold is the stage where a module stops being documents and becomes a folder npm knows about. It
is the smallest stage in the methodology and the one with the least judgment in it — the root
`CLAUDE.md` §"Adding a Module" already prescribes six steps, and this skill's job is to execute them
faithfully, notice what the new module forces the root to decide, and stop.

**Scaffold produces structure, not behaviour.** No FRICEW object gets built here. No entity, no
service handler, no UI app. If you find yourself writing a `.cds` entity to make a command turn
green, you have left the stage — say the command is red and why, instead.

The stage matters out of proportion to its size for one reason: **a second module is the first real
test of every claim the root makes about being shared.** Standards written against one module are
hypotheses. Scaffold is where they get falsified, and a falsified claim gets fixed at the root — not
worked around inside the new module.

## Resolve the module first — never hardcode one

This skill serves every module. Financial Planner is the worked example, not the target.

1. Take the module from the argument if given.
2. Otherwise use the module folder containing `process.cwd()`.
3. Otherwise **ask**. Do not guess, and do not default to the planner.

The module name is the folder name; the package name is its kebab-case form (`Project Tracker` →
`project-tracker`). Everything you write lives under that folder, with exactly two exceptions — the
root `package.json` `workspaces` array and the root `CLAUDE.md` — both of which are §Phase 2.

## The six steps are the authority

Root `CLAUDE.md` §"Adding a Module" is the spec. Read it at runtime rather than trusting this
summary, because it is the file that changes:

1. Create the folder; add it to `workspaces` in the root `package.json`.
2. `package.json` — module deps and cds config only. Copy the `lint:*` block from an existing module.
3. `eslint.config.mjs` — re-export the shared config.
4. `tsconfig.json` — extend the shared base.
5. `CLAUDE.md` — module architecture and carve-outs. Do not restate the shared standards.
6. `.gitignore` — the root one does not cover CAP build output.
7. `npm install` from the root so the workspace links.

If this skill and the root file disagree, **the root file wins and this skill is stale** — say so.

## Phase 0: Read the upstream, yourself

Scaffold consumes decisions rather than making them. Before writing a file, read — in the module's
own folder — whatever of these exist:

- The continuity document (`PLAN.md` or equivalent). Start here; it says where the stage sits.
- `design/PROBLEM_STATEMENT_AND_VISION.md` — the traceability root.
- `design/BUSINESS_ARCHITECTURE.md` — what will eventually be built, which shapes the folder skeleton.
- `design/DECISIONS_LOG.md` — **the load-bearing one.** Namespace, database, shell and toolchain
  rulings all land here, and Scaffold is usually the first stage that has to obey them physically.
- `research/README.md` — the gate verdict, the assumption ledger, and the open-risk register.

Build a short table of **every decision that constrains a file you are about to write**, with its
D-nn. Namespace → `db/*.cds` and `@cds-models` paths. Database ruling → `cds.requires.db`. Shell
ruling → `app/`. Toolchain ruling → `package.json` scripts and `tsconfig.json`. Show it to Sandro
before you write. A scaffold that contradicts a logged decision is worse than no scaffold, because
it looks settled.

**Read the risk register specifically for risks that Scaffold would silently assume away.** A risk
graded `Inferred` is a risk nobody has executed. Scaffolding as though it holds converts an open
risk into a hidden one. Name each such risk in the handoff instead.

## Phase 1: The wiring

Work the six steps in order. Three of them carry traps.

### The `lint:*` block is copied, then audited

The root instruction says to copy the block verbatim because "the paths are already module-relative."
That is true of the shared linters — every one roots itself at `process.cwd()` and takes no arguments
— and it is **not automatically true of the whole block.** A script that shells into a named app
folder, or names a module's own tooling, is module-specific text riding along inside a block
described as portable.

So: copy it, then read every line back and ask of each one, *would a second module run this
unchanged?* Any line that fails becomes one of three things, and you decide which with Sandro:

| What you found | What to do |
|---|---|
| A script naming another module's folder or app | Rewrite it for this module, or drop it until this module has the thing it lints |
| A script whose linter is genuinely portable | Copy verbatim — this is the common case |
| A root claim that the whole block is portable, now falsified | **Fix the root claim.** This is the finding, not a nuisance |

The last row is the point of the stage. Record it and correct the root file in Phase 2.

### `package.json` carries module deps only

Shared tooling — eslint, tsx, typescript, jest and their plugins — is declared once at the root and
inherited. Root `CLAUDE.md` §Do NOT is explicit. Before adding any `devDependency`, check whether the
root already declares it; if it does, adding it here pins a second version of a thing the repo
deliberately has one of.

Runtime deps, the CDS runtime, database drivers, UI5 tooling and `@cds-models` typing packages are
module-scoped and belong here.

### The folder skeleton is empty on purpose

Create the tree the module's standards describe — typically `db/`, `srv/`, `app/`, `test/` — and
leave it empty. The Data Model stage fills `db/`; the Workshops and Build stages fill `srv/` and
`app/`. Use `.gitkeep` so the structure survives a clone.

**Do not invent content to make a command succeed.** An empty module cannot `cds build`, and several
`lint:*` scripts have nothing to lint. That is the correct state of a scaffolded module, and Phase 3
reports it as such.

## Phase 2: Reconcile the root

A new module changes the root, and this is the only stage that is allowed to. Two files.

**Root `package.json`** — add the folder to `workspaces`. Alphabetical unless the array already
carries a different order for a stated reason.

**Root `CLAUDE.md`** — three things, and the second is the one that gets forgotten:

1. The **Modules table** — the new module's status changes from Planned to Active.
2. **§Undecided** — every item the module's decisions log now closes. This is usually *owed* from an
   earlier stage: Ideate rules on a namespace, Research rules on data sharing, and the ruling is
   recorded in the module's log while the root file still says "do not invent an answer to these —
   ask." Carry each closed item into the body of the root file where it now belongs, cite the D-nn,
   and delete it from §Undecided. **An item closed in a module's log but still listed as undecided at
   the root is a live contradiction** — the next module will read the root, not the log.
3. Any **shared claim this module falsified** — the lint-block portability claim, a counted
   inventory that has drifted, a convention that turns out to be planner-specific. Fix the sentence.

If §Undecided empties completely, say so plainly and leave the heading with an explicit statement
that nothing is open, or remove it — do not leave an empty section implying the questions vanished.

**What Scaffold must not do at the root:** it may not adopt a convention the module's log has not
ruled on. If a root question is still genuinely open, it stays in §Undecided. Closing it here would
be inventing an answer, which is exactly what the section forbids.

## Phase 3: Verify, and report red honestly

Run the checks, and classify each result into one of three states. The third is the one that matters.

| State | Meaning |
|---|---|
| **Green** | Works now, and is expected to |
| **Inert** | Ran, found nothing to check, exited clean — correct for an empty module |
| **Red — expected** | Fails *because* the module is empty, and will go green as content arrives |
| **Red — unexpected** | A wiring defect. This is a Scaffold bug and blocks the stage |

At minimum:

- `npm install` from the root, then confirm the module is linked (`node_modules/{package-name}` is a
  symlink into the module folder). Green or the stage failed.
- The module's `eslint.config.mjs` resolves the shared config, and `tsconfig.json` resolves the base.
- `npm run lint --workspace "{Module}"` — expect a mix. Say which scripts are inert and which are red
  because there is nothing to lint, per-script. "Lint fails" is not a report; "18 inert, 3 red on an
  empty `srv/`" is.
- The root `lint:doc-claims` runs against the module's `CLAUDE.md`, so any enforcement claim you
  wrote must name a live `lint:*` script in *this* module's `package.json`.

**Never make a check pass by weakening it.** Deleting a lint script because it is red on an empty
tree, or stubbing an entity so `cds build` succeeds, converts an honest red into a false green that
nobody will re-examine.

## Phase 4: The module CLAUDE.md (delegated to scaffold-writer)

Everything above is mechanical. The module's `CLAUDE.md` is not — it is the file every future agent
reads before writing a line of code in this module, and its hardest constraint is what it **leaves
out**. Root `CLAUDE.md` §Do NOT: do not duplicate the shared standards into a module's CLAUDE.md,
reference them.

Write it in an isolated `scaffold-writer` agent so producing it does not compete for context with
the wiring you just did.

1. Assemble the **scaffold record**: the module and its package name; the constraining decisions
   table from Phase 0 with D-nn citations; the folder skeleton as built; the `package.json` shape
   (deps, cds config, the audited lint block); every carve-out from the shared standards, with its
   reason; the open risks Scaffold refused to assume away; the Phase 3 verification results; and the
   path to the standards file being referenced rather than restated. **It must be complete — the
   writer cannot ask Sandro anything.**
2. Invoke `scaffold-writer` with the record. It writes `CLAUDE.md` in the module folder and returns
   its validation check.
3. If it returns a **gap**, the wiring left a hole. Answer that one question, extend the record,
   re-invoke. Do not fill the hole yourself.

## Phase 5: Hand off

1. **Log the decisions Scaffold took** into the module's `DECISIONS_LOG.md` at the next free `D-nn` —
   Context, Options, Decision, Rationale. A toolchain question the stage settled empirically is a
   decision, and the evidence goes in the rationale.
2. **Close and raise open items.** Update the module's continuity document: the stage table, the
   session log, and any open item the stage settled or newly exposed.
3. **Name what is still red and what it blocks**, so the next stage inherits a true picture.
4. Name the next stage and **stop**. Do not start it.

## Definition of Done

Validate against this list and show the result. Each line is pass/fail, and a fail is a question for
Sandro rather than something you quietly fix.

1. The module folder exists and is listed in the root `package.json` `workspaces` array.
2. `npm install` has run from the root and the workspace is linked.
3. `package.json` declares module deps and cds config only — **no shared tooling**, checked against
   the root's `devDependencies` by name.
4. The `lint:*` block is present, and every line in it was audited for module-specific text.
5. `eslint.config.mjs` re-exports the shared config; `tsconfig.json` extends the shared base.
6. The folder skeleton exists and is empty of invented content.
7. Every file written obeys a decision in the module's log, and no file contradicts one.
8. Root `CLAUDE.md` — Modules table updated, §Undecided reconciled against the module's log, and any
   shared claim this module falsified is corrected.
9. The module `CLAUDE.md` exists, references the shared standards rather than restating them, and
   every enforcement claim in it names a live `lint:*` script or rule id.
10. Verification results are reported per-check and classified, with reds named and explained.
11. Decisions taken are logged; open items are updated; risks Scaffold declined to assume away are
    named.

## Rules

- **Structure, not behaviour.** No FRICEW object, no entity, no handler, no UI app. If a later stage
  owns it, leave it.
- **A red that tells the truth beats a green that does not.** Report what fails and why. The stage's
  output includes its own incompleteness.
- **Settle a toolchain question by running it, not by reasoning about it.** Scaffold is the first
  stage that can execute anything, so a question of the form *"does X load / resolve / build"* is
  answerable here for the cost of a throwaway probe outside the repo. A verified answer at this stage
  is worth more than the same answer inferred at three later ones. Where the ruling is formally
  another stage's to make, supply the evidence and the recommendation and say whose call it is.
- **Do not assume an unexecuted risk away.** A risk graded `Inferred` stays inferred until someone
  runs it. Scaffolding around it silently is how it stops being tracked.
- **The root is fixable; the module is not the place to work around it.** A shared linter, config or
  claim that this module disproves gets corrected at the root. Adding a module-specific path to a
  shared linter is explicitly forbidden — root `CLAUDE.md` §Do NOT.
- **One module is not a pattern; two is barely one.** Resist generalising from the first module's
  answers while scaffolding the second. Where the second module differs, the honest output is a
  carve-out with a reason, not a rewritten standard.
- Follow the module's existing document conventions — status field and Change History where its other
  artifacts have them.
