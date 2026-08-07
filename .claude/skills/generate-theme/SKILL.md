---
name: generate-theme
description: Run the Theme stage for a Life OS module — resolve the semantic roles its Design System declared into concrete visual values, measured against the pinned UI5 runtime rather than quoted from another module's document. Scout the module's design system, the exemplar theme and the CSS actually on disk via subagents, settle theme ownership, palette, token resolution, border radius, component overrides, contrast and the CSS contract with Sandro one question at a time, then hand a theme record to the theme-writer agent that writes design/THEME.md. Use whenever Sandro wants to run the Theme stage for a module, decide its concrete visual contract, or says "run theme", "generate the theme", "what colour is health", "what's our brand palette", "does this module get its own accent", "check the contrast"; or when a build or /ux-test is blocked because a module has semantic roles with no values behind them.
---

The Design System stage settles **what each surface is built with and which semantic role every domain
value carries**. This stage settles **what those roles look like**. It runs eighth — after Design
System, because it resolves what that document declares, and before Data Model, because nothing in
the model turns on a colour.

A module's Design System can be complete and its UI still unreviewable: `Healthy` is `Success` and
nobody has said what `Success` renders as, on which surface, or whether the result is legible. That
gap is this stage's deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is `design/THEME.md`. Financial
Planner is the **worked example throughout — never the target**. If you find yourself typing a module
name into a path, stop; you have broken the thing that makes this skill serve the next module.

Two things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; a module
  scaffolded later may put its own at `design/DECISIONS_LOG.md`. Resolve the module's actual log;
  never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.

**IDs are module-local too.** `TH-001` and `DS-001` in one module are not `TH-001` and `DS-001` in
another, and neither is `RPT-001` or `FRM-001`. When this document cites another module's artifact,
qualify it with that module's name.

## Step 0: the predecessor's status

**Read the module's `design/DESIGN_SYSTEM.md` header before anything else.** If it is not
**Approved**, say so in your first message and ask Sandro to approve it or to authorise running on an
unapproved input. Do not flip the status yourself and do not proceed silently — this stage resolves
that document's role map, so its status is this stage's status.

This check exists because it failed twice in a row. Both the Information Architecture and the Design
System stages closed without asking for approval, and the following stage discovered it. See the
approval gate in Phase 6.

## What this stage owns, and what it does not

| Owned here                                                                          | Not here                                                                                        |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Theme ownership** — does the module own a theme, inherit one, or scope its own    | Theme _family_ and density (Design System — and often inherited from the host page, not chosen) |
| The brand palette, or the stated inheritance of one                                 | Which semantic role a domain value carries (Design System)                                      |
| **Token resolution** — which CSS custom property each semantic role resolves to     | Which control renders an element (Design System)                                                |
| Border radius, component overrides, and the exceptions to each                      | Routes, links, shell placement (Information Architecture)                                       |
| **Contrast verification** for the pairings the module actually renders              | Surface content, field lists, empty-state text (Workshops)                                      |
| The **CSS contract** — file, load mechanism, layering, specificity, and who owns it | The serving stack, the origin, the proxy (Tech Stack)                                           |
| Colours applied in code rather than CSS, or a stated "none"                         | Writing the CSS file — that is the first UI story's job                                         |

**This stage specifies; it does not build.** No CSS file is written to disk here. The document is the
contract a build story implements and `/ux-test` reviews against.

**A module that inherits a theme still has a Theme document.** Inheriting is a ruling with
consequences — which tokens it inherits, at what measured values, on which surfaces, and who owns the
file it depends on. A stage that answers "we inherit" and stops has not done the work; it has skipped
questions 5, 9 and 12.

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer                        | Reads                                                                                                                                                  | Breaks if                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `/ux-test` → `ux-tester`        | `design/THEME.md` for the brand palette, ShellBar treatment, border radius and the CSS custom-property overrides (`.claude/agents/ux-tester.md:21-23`) | The document names no concrete value — the agent has nothing to measure a computed style against    |
| Build (`implementer`)           | The CSS contract: which file, loaded how, in what layer, at what specificity                                                                           | The contract is absent or describes a mechanism the repo does not actually use                      |
| The next module's Theme         | The ownership ruling and the shared-shell boundary                                                                                                     | The boundary is unstated, so the second module writes into the first module's page and they collide |
| Design System (on an amendment) | Whether this stage forced a new role                                                                                                                   | A brand accent is introduced with no role row behind it                                             |

## The document standard

This section is the template. `theme-writer` reads it verbatim — do not paraphrase it into the record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/THEME.md`) carries nine sections built around a module that
owned its own brand, overrode nine component families, and drove a chart library — concepts that
assume **a module alone in its page**. A module joining an existing shell has different content and
the same questions.

So: **the questions are fixed, the section list is derived from the surface, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight, and the next module cannot tell
whether the question was considered.

| #   | The question                                                                          | Section it becomes           | Exemplar's answer shape                                                            |
| --- | ------------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| 1   | What is the record of this document?                                                  | Change History               | Table                                                                              |
| 2   | What did this stage settle?                                                           | Summary                      | `Aspect \| Decision` table                                                         |
| 3   | Does the module **own** a theme, **inherit** one, or **scope** its own overrides?     | Theme Ownership              | **Absent** — it was the only module, so the question could not arise               |
| 4   | What is the brand palette, or the stated inheritance of one?                          | Colour Palette               | Design intent + a 10-row brand table                                               |
| 5   | **Which CSS custom property does each semantic role resolve to, at what value?**      | Semantic Token Resolution    | **Absent** — its §3.3 restates the role table with colour _names_ and no token     |
| 6   | Which colours are applied in code rather than in CSS?                                 | Programmatic Colours         | §3.5 chart series colours, §3.6 a spec-driven semantic mapping                     |
| 7   | What is the border-radius rule, and what is exempt?                                   | Border Radius                | Rule + a components table + an exceptions table                                    |
| 8   | Which components are overridden, and to what?                                         | Component Overrides          | Nine sub-sections of `Property \| Default \| Override`                             |
| 9   | **Does every pairing the module renders meet WCAG AA, on the surface it lands on?**   | Contrast Verification        | **Absent as a section** — three prose ratios, all against white, one of them wrong |
| 10  | How are overrides delivered — file, load mechanism, layering, specificity?            | Override Strategy            | Approach, file location, load mechanism, layers, specificity, what is not used     |
| 11  | What is the exhaustive property-to-value mapping?                                     | Colour Mapping Table         | Two layers, grouped by category, plus a "not overridden" table                     |
| 12  | **Where is the boundary with the shared shell and other modules, and who owns what?** | Shared-Shell Boundary        | **Absent** — one module, one shell, no boundary to draw                            |
| 13  | What does this stage change in an upstream or Approved document?                      | Amendments                   | A table — but pointing at its own supersessions, not at another stage's document   |
| 14  | **Which risks are assigned to this stage?**                                           | Risks Assigned to This Stage | **Absent**                                                                         |
| 15  | Which decisions did this stage take?                                                  | Decisions Reference          | `ID \| Title \| Summary` table                                                     |

Questions 3, 5, 9, 12 and 14 are **not** sections in the exemplar and are not optional. It was the
only module in its page, so ownership and the shell boundary could not arise; it verified contrast
in prose against a background its own theme does not use; and it was written before risk registers
were routed by stage. **Every module that joins an existing shell faces all five.**

### Rules that hold at any surface size

- **Measure the runtime, do not quote another document.** Theme defaults drift and documents about
  them drift faster. Read the pinned UI5 version's own parameters — for a CDN-pinned repo,
  `…/resources/sap/ui/core/themes/{theme}/library-parameters.json` and the relevant library CSS —
  and cite the measurement. **A "Horizon default" column copied from another module's Theme is the
  single most reliably wrong table in this repo.**
- **A token claim names the property, the value, and where the value came from.**
  "`Success` resolves to `--sapPositiveTextColor` `#256f3a`, measured at 1.136.16" is a claim.
  "Success is green" is not.
- **Contrast is verified against the surface the element actually lands on**, not against white by
  default. Resolve the container chain — page canvas, section, list, tile, header — and say which
  background each pairing sits on. A ratio against the wrong background is worse than no ratio.
- **Never invent a semantic role.** The role map is the Design System's. If a palette choice needs a
  role that document does not carry, that is an amendment raised with Sandro, not an invention here.
- **A module that writes no CSS says so, and says who owns the file it depends on.** "Inherits" is
  not a synonym for "unspecified".
- **`!important` is banned** by the shared standards. Reference them; do not restate them.
- **Amendments to Approved documents are listed, not applied silently.** The Amendments section is
  the record; the edit itself is made in-session by the host.

## Why this delegates its reading

The inputs are large and mostly settled: the module's Design System, the exemplar theme, the CSS on
disk, and the host page. Reading them in the main thread spends the interview's context on content
you will not re-litigate. **Send scouts; get back findings with `file:line` citations.** When Sandro
contradicts one — he will — read that one line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent**
as explicitly as what is present, and to re-measure every count and value it reports rather than
quoting one.

| Scout         | Reads                                                                                                            | Returns (≤ ½ page, every claim cited `file:line`)                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **roles**     | The module's `design/DESIGN_SYSTEM.md` and `design/INFORMATION_ARCHITECTURE.md`                                  | Every semantic role and status rendering the module declares, the control each lands in, and **every sentence deferring a decision to this stage, quoted**                                 |
| **precedent** | The exemplar's theme document **and its CSS file on disk**, plus the host page and whatever loads the stylesheet | The exemplar's palette and radius **as the file has them, not as its document claims**; the real load mechanism; the property count re-measured; and every place the two disagree          |
| **decisions** | The module's decisions log, its plan, and its research pack's risk register and routing table                    | Decisions binding this stage (ID + one-line ruling), the next free `D-nn`, **risks assigned to it by ID with what would settle each**, and any prior ruling on palette, shell or ownership |

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/THEME.md` already exists, this run
   is an **amendment**: read it yourself, in full, before anything else.
2. **Run Step 0** above on `design/DESIGN_SYSTEM.md`.
3. **Read the module's `design/DESIGN_SYSTEM.md` yourself, in full.** It is this stage's direct
   input: it carries the role map this stage resolves and it may have named a question for this
   stage by name. A question it hands down is not yours to re-frame.
4. Read the exemplar yourself — `Financial Planner/design/THEME.md` **and its CSS file**. Read both,
   because where they disagree is a finding and the file wins.
5. **Derive the value surface from the Design System document, not from memory.** State the role
   count and the status-rendering count before scouting; a missed role is a value nobody specifies.

## Phase 1: Scout

Spawn the three scouts above with the module, the resolved role list, and — on an amendment — the
existing document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing the semantic roles and the surfaces they render on — one line each — and ask whether
that is the whole value surface. Then walk the stage **question by question**, in the standard's
order. Present what the Design System already answers and ask if it is accurate before moving to the
gaps. **One question at a time.** A wall of questions gets one answer to the last one.

## Phase 3: Theme interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **Theme ownership.** Own a palette, inherit one wholesale, or scope overrides under a
   component-root class. Ground it in the page: if the module shares a `<body>` with another, CSS
   custom properties set on `:root` are **global by construction** and two palettes collide. Name the
   consequence you are buying — including what the module gives up.
2. **The palette**, or the stated inheritance of one, with its design intent.
3. **Token resolution.** For every semantic role the Design System declares, the CSS custom property
   it resolves to and that property's measured value at the pinned runtime version. This is the
   question the exemplar never answered and the one `/ux-test` most needs.
4. **Programmatic colours.** Anything applied in code rather than CSS — chart series, a
   spec-driven mapping. If the module has none, that is "none — because", not a dropped heading.
5. **Border radius**, and its exceptions.
6. **Component overrides.** Only for components the module actually renders. An override table for a
   control the module never uses is specification without a test.
7. **Contrast.** Measure every foreground/background pairing the module renders, on the surface it
   actually lands on. Report the ratio and the AA verdict. **A failure is a finding, not a footnote**
   — turn it into a rule a build persona can follow and a reviewer can check.
8. **The CSS contract.** File, load mechanism, layering, specificity, and — where a file is shared —
   **who owns it and who may write into it**. Verify the load mechanism against the repo rather than
   against the exemplar's description of it.
9. **The shared-shell boundary.** What this module writes into the shared page, what it only reads,
   and who owns the relocation when a later module needs its own overrides.
10. **Don't stop early.** After the forks clear, ask what a build persona would still have to guess,
    and what `/ux-test` would have no rule to check. That is the bar.

When Sandro asks for a recommendation — "any suggestions?", "what do you think?" — **give one**, with
rationale. Not a balanced menu. He is asking because he wants your judgment.

## Phase 4: Risks assigned to this stage

The decisions scout returns any risk the module's register or decisions log **assigns to this
stage**. For each one, take one of exactly two positions and record which:

- **Execute it.** Run the settling test the register names, in a scratch location outside the
  module's source tree, and report what happened — including a null result. An executed risk changes
  its grade from `Inferred` to `Verified` and that grade goes in the document.
- **Re-own it explicitly**, with the owner, the deadline, and why executing here was the wrong shape.

**Deferring silently is not one of the options.** If no risk is assigned here, **state that**, having
checked the register rather than assumed it — a stage that inherits nothing and does not say so is
indistinguishable from one that never looked.

**One risk this stage tends to create rather than inherit:** a load or scoping mechanism nobody has
executed. If the ruling depends on one, grade it honestly rather than assuming it works.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every semantic role in the Design System has a token and a measured value.
- Every status rendering in the Design System has a resolved appearance.
- Every value in the document was measured this session against the pinned runtime.
- Every pairing the module renders has a contrast ratio and an AA verdict, against the surface it
  lands on.
- Every Design System sentence that deferred a decision here has an answer here.
- The CSS contract names a file, a load mechanism verified against the repo, and an owner.
- Every risk assigned to this stage is executed or re-owned, or the absence is stated.
- No question in the standard is missing a section, including those answered "none".

## Phase 6: Production (delegated to theme-writer)

The interview is done. The writing happens in an isolated **theme-writer** agent so producing the
document never competes for context with the conversation you just held.

1. Assemble the **theme record** — the handoff artifact. It contains: the module, its decisions-log
   path and the next free `D-nn`; the ownership ruling with its consequence; the palette or the
   stated inheritance; the token resolution table with measured values and the measurement method;
   the programmatic-colour ruling; the border-radius rule; the component overrides; the contrast
   table with surfaces and verdicts; the CSS contract and its owner; the shared-shell boundary; the
   risk outcomes; the amendments this stage causes; the coverage-check result; and every decision
   taken (context, options, ruling, rationale, consequences). **It must be complete — the writer
   cannot ask Sandro anything.**
2. Invoke `theme-writer` with that record. It reads this skill's **document standard** section
   itself, writes `design/THEME.md` at status **Draft**, logs the decisions in the module's log at
   the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one
   question, add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence.
   Check every value against the measurement, every cross-reference against a file, and every claim
   against its own evidence.
5. Apply the amendments in-session rather than leaving them owed, and show the list.
6. **The approval gate.** Show Sandro the path and the Summary, and ask for explicit approval. On
   approval, flip Draft → Approved and add the Change History row. **Do not report the stage closed
   without an answer to that question** — an unapproved artifact is owed work, and the next stage
   should not be the thing that discovers it.
7. **Check the encoding survived the write.** Run `git diff --stat` and grep for `â€` before
   committing. A PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown file
   double-encodes every em-dash; append with `cat` or the Edit tool.
8. Name the next stage — Data Model — and stop. Do not start it.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The exemplar's answer                                      | Status                                                                                                                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A custom brand identity replacing the stock accent         | That module's call, made when it was alone in its page. A module joining an existing shell answers question 3 first, and may answer it "inherit".        |
| Zero border radius on all containers                       | A ruling, not a house default. Where the property is set on shared `:root`, a later module **inherits** it and should say so rather than re-deciding it. |
| Nine component-override sub-sections                       | Derived from what that module renders. Override only what your module renders.                                                                           |
| Domain chart colours applied as constants                  | A chart-heavy domain's answer. A module with no chart answers question 6 "none — because".                                                               |
| A "Horizon Default" column                                 | **Re-measure or omit it.** Its values drift against the runtime, and a stale default column reads as verified when it is not.                            |
| Contrast stated in prose, against white                    | Give it a section, measure it, and use the background the element actually lands on.                                                                     |
| A `<link>` in `index.html` as the load mechanism           | **Verify this against the repo.** A document can be wrong about its own module. Read what actually injects the stylesheet.                               |
| An Amendments table pointing only at its own supersessions | Where a Design System ran first, amendments to _that_ document are the real ones — and "none" is a legitimate answer if the boundary was drawn well.     |

What **is** the standard: the fifteen questions, a stated "none" over a dropped heading, values
measured against the pinned runtime rather than quoted, token claims naming property and value,
contrast verified on the real surface, a CSS contract with an owner, and a decisions table that makes
every ruling citable by ID.

## Rules

- **Sandro decides; you propose.** Give a recommendation with rationale, then take his answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Design System decision.** The role map, the controls and the build technology are
  settled. If a value is impossible for a role, that is an amendment raised with Sandro — not a quiet
  override.
- **Never re-open an Information Architecture or Workshops decision.**
- **Never write a CSS file.** This stage specifies the contract; building it is the first UI story's.
- **Every value in the document is measured this session** against the pinned runtime version,
  including values about the exemplar.
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage has no linter.** Nothing mechanically validates a palette, a token resolution or a
  contrast figure — Phase 5 and `theme-writer`'s check are procedural. Say that plainly rather than
  implying enforcement that does not exist.
