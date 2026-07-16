---
name: cap-annotation-hunter
description: Audit a CAP srv/ folder for imperative JS/TS that a CDS annotation could have replaced — missed @mandatory/@assert.*/@restrict/@readonly/@cds.on.insert/@flow, plus handlers that duplicate an annotation already in the model. Use whenever the user asks to review, audit, or clean up CAP service code, handlers, or validators; asks "could this be an annotation", "is this handler necessary", "why am I writing this by hand"; adds or reviews a before/after/on handler; writes a Validator class; or mentions CAP boilerplate, over-coded services, or declarative-vs-imperative CAP. Also use proactively when reading srv/ code that validates input, gates by role, stamps timestamps/UUIDs, or guards status transitions — even if the user only asked about something else.
---

# CAP Annotation Hunter

CAP's declarative layer exists so that services aren't hand-written. Every annotation in
`references/annotations.md` has a JS/TS twin someone wrote instead, and the twin is nearly always
worse: an annotation is enforced on every path into the entity — OData, draft activation, deep
writes, `cds.ql` from another module, the DB itself — while a handler only fires on the events it
was registered for. The handler that guards `CREATE` and forgets `UPSERT` is the normal outcome,
not the sloppy one.

So the goal isn't to delete code for its own sake. It's to move enforcement to a layer that can't
be bypassed, and to say plainly when the handler is the right call.

## The failure mode that matters

**CDS silently ignores unknown annotations.** No compile error, no warning, no runtime hint. So an
invented annotation produces code that looks correct, deploys clean, passes review — and enforces
nothing. Replacing a working handler with a fictional annotation is a security regression you
authored while feeling productive.

This is the one way this audit does real damage, so it constrains the method: **never propose an
annotation you haven't confirmed in `references/annotations.md`.** §10 (Fabrication Guard) lists
names that sound right and don't exist — `@cds.etag` (it's `@odata.etag`), `@restrict … for:`
(silently ignored → fails open), `@assert.constraint`, `@cds.outbox`, `@cds.default.order`,
`@assert.notNull: true` (no positive form). If a candidate isn't in the reference, either verify it
against capire and add it, or report the finding with **no** suggested annotation. "This looks
replaceable, I couldn't confirm what by" is a useful, honest finding.

## Layer Map

Grep hits mean nothing until you know which file they landed in. In a layered CAP project, most
`SELECT.one` hits are architecture, not findings.

| Layer | Pattern | Verdict |
|---|---|---|
| Validator | `*Validator.ts` | **Prime target.** A class whose job is validation is the most likely home of a missed `@mandatory` / `@assert.*`. Check it's actually wired up — an orphaned validator is a plausible-looking dead end. |
| Service handlers | `*-service.ts`, `*Service.ts` — inside `before`/`after`/`on` | **Prime target.** The registration event is the scope of enforcement. |
| DataService | `*DataService.ts` | **Architecture, not a finding.** CQL lives here by design. A `SELECT.one` is the layer doing its job — only a finding if the *caller* uses it purely to decide whether to error. |
| Mapper | `*Mapper.ts` | Shape translation. Rarely a finding — unless it's stamping `createdAt`/UUIDs, which is `managed`/`cuid`. |
| Facade | `*Facade.ts` | Zero logic by convention. Logic here is a finding of a different kind — out of scope; mention and move on. |
| Model | `db/**/*.cds`, `srv/*.cds` | Where fixes land, and where §12's model smells live. |

Confirm this map against the project before trusting it — layer names differ. If there's no
Validator/DataService split, every hit is a candidate and you lean harder on Phase 2.

## Phase 1 — Sweep

Grep `srv/` with §12's Quick Detection Table (`references/annotations.md`). Highest-yield single
pattern: `delete req\.data\.|req\.data\.\w+\s*=` — most of the reference exists to remove a line of
that shape.

Bucket hits by layer before reading them. Discard DataService noise early or Phase 2 drowns.

## Phase 2 — Verify each candidate against the model

A grep hit is a hypothesis. Resolve it by reading the entity's CDS *before* writing anything down,
because the same handler yields four different verdicts depending on what the model already says:

| Verdict | Meaning | Action |
|---|---|---|
| **Missed** | Annotation absent; handler does its job | Propose the annotation |
| **Redundant** | Annotation already there; handler re-checks it | Propose deleting the handler — and check the two didn't drift, because if they disagree the *handler* is the bug report |
| **Dead** | Nothing calls it | Propose deleting it. Don't annotate around it. |
| **Justified** | Annotation can't express this | Say so and move on. Don't propose it. |

**Confirm the handler actually runs before you reason about it.** A validator can look like the
authority on an entity while the live path calls a different one — grep for the class/handler's
callers, not just its definition. Duplicated validators drift, and the drift is itself the finding.

Justified is common and expected — read the per-annotation **Justified** notes rather than
guessing. Recurring cases: validation needing a remote call or non-DB state (`@assert:` is pushed
to the DB); validation keyed on `req.user`/headers/tenant rather than data; checks needing a side
effect alongside rejection; delete-guards (`@assert.target` doesn't cover DELETE); friendly
messages over a DB constraint (`@assert.unique` surfaces the raw DB error — a pre-check handler
for the message is legitimate *on top of* the constraint, not instead of it).

Two traps worth naming, since both look like wins and aren't:

- **Draft.** `@mandatory` fires at activation, not on every draft patch. A handler that validates
  mid-draft may be deliberate.
- **Version floors.** Open intervals in `@assert.range` need Node ≥ 8.5; `@assert.format` regex
  dialect differs Node vs Java. Check `@sap/cds` in `package.json` before proposing.

## Phase 2.5 — Probe what the docs won't tell you

The reference and capire are secondary sources; the project ships the actual runtime, and it
settles questions neither can. A throwaway CAP service with the candidate annotation, run against
the project's own `@sap/cds`, answers "does this fire, on this shape, in this version" in about a
minute — far cheaper than being wrong in the report.

Probe when the answer changes the row: the reference is silent or §11 lists it unverified, the
annotation is near a version floor, or the shape isn't the documented one (**action/function
parameters** are the standing example — most detection heuristics are written for entity elements
and `before('CREATE')`, so a service whose validation lives in action params matches none of them).

Include the **control** — an un-annotated twin — or the probe proves nothing. Something else may be
rejecting the input, and you'd credit the annotation for a rejection it didn't make. Probe in a
scratch directory; never mutate project source to test.

Two real results from this skill's own test run, both of which read as safe drop-ins and aren't:
`@mandatory.message` is *silently ignored* (per-field messages collapse into one global
`ASSERT_MANDATORY` key), and `@mandatory` on a `many` parameter rejects an omitted value but
**passes `[]`** — so a handler guarding `.length === 0` is Justified, not Missed. Neither is
documented. Both would have shipped as confident, wrong findings.

A probe result outranks the reference. When they disagree, trust the runtime and correct the
reference in the same turn — that's how §10 and §11 stay worth trusting.

## Phase 3 — Report, then stop

Emit one numbered table. Fix nothing yet — the point is a decision, and a rewrite pre-empts it.

`# | file:line | current code | verdict | annotation | confidence | note`

Order by verdict (Missed → Redundant → Dead → Justified), then confidence. Merge hits sharing one
annotation on one entity into a single row. Give confidence as ★★★/★★☆/★☆☆ carried from §12, and
state the version floor or draft caveat in the note where it applies. Mark a probed row
**VERIFIED** and say what the probe showed — that's the difference between a claim and a fact, and
the reader can't tell otherwise. If a row is still `unconfirmed` at report time, prefer probing it
(Phase 2.5) over shipping the hedge; report `unconfirmed` only when the probe is impractical.

Then stop and let the user reply by index ("do #1 #4"). This matches how they work and keeps
Justified rows arguable — several will be wrong, and that's the mechanism working.

## Phase 4 — Apply, on request only

Per accepted row: add the annotation → delete the handler → **prove the annotation fires** by
exercising the path the handler guarded. This step is the whole point. An annotation that compiles
is not an annotation that enforces, and the failure mode above is invisible without a test that
fails when it's gone. Then run the project's lint/build (`@cds.persistence.journal` and
`@assert.integrity` in particular have deploy-time consequences), and sweep for the same pattern on
sibling entities — these travel in families.

## Reference

`references/annotations.md` — the annotation catalogue. Per annotation: syntax, runtime
(Node/Java), maturity, the imperative code it replaces, detection heuristic, and when the custom
code is justified.

Navigate it by section rather than reading it whole: §2 validation, §3 authorization, §4
persistence/lifecycle, §5 service behavior, §6 messaging, §7 localization, §8 plugin annotations.
Three sections carry the audit — read them every run:

- **§12 Quick Detection Table** — imperative pattern → annotation, ranked by hit rate. Start here.
- **§10 Fabrication Guard** — names that don't exist. Check before emitting.
- **§11 Confidence & Gaps** — what's unverified (`@inapplicable`, dynamic `@mandatory`,
  `@cds.valid.key`). Don't assert these.

Maturity moves: `@flow` is Gamma, not GA; `@assert: (case…end)` went GA April 2026; `@assert.enum`
was deprecated in 2020 and reportedly doesn't fire on OData V4 — any occurrence is a live bug, not
a style nit. If a run turns on maturity, re-check capire rather than trusting the doc's date.
