export const meta = {
  name: 'build',
  description: 'Build one story end-to-end with isolated agents: brief, TDD red, implement, gate, coverage, smoke, handoff',
  whenToUse:
    "To build a single story in any Life OS module from its spec and the module's BUILD_PLAN — a FRICEW ID in Financial Planner (FRM-001), a spec ID in Project Tracker (SPEC-02). Leaves a green, uncommitted tree for Sandro to review — it never commits. Invoked by /build.",
  phases: [
    { title: 'Brief', detail: 'resolve the story to a structured brief so no later agent re-reads the design docs' },
    { title: 'Red', detail: 'write the failing tests from the spec business rules and FUTs', model: 'opus' },
    { title: 'Implement', detail: 'build the handler pattern against frozen tests', model: 'opus' },
    { title: 'Gate', detail: 'tsc, lint, test, cds build — classify failures, hash the tests' },
    { title: 'Coverage', detail: 'raise coverage to the TEST_STRATEGY thresholds' },
    { title: 'Smoke', detail: 'drive the UI in a real browser (frontend stories only)' },
    { title: 'Handoff', detail: 'mark the board Build Done, Awaiting Review (modules with a board only) — the commit is Sandro\'s' },
  ],
}

const MAX_REPAIR_ROUNDS = 3

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    storyId: { type: 'string', description: "The story ID as the module's BUILD_PLAN defines it — FRM-001, SPEC-02" },
    storyName: { type: 'string' },
    specFile: { type: 'string', description: 'Repo-relative path to the owning spec' },
    summary: { type: 'string', description: 'What this story delivers, in two sentences' },
    businessRules: {
      type: 'array',
      description: 'Spec §5 rules this story implements, quoted verbatim — the Red agent never opens the spec',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'BR-nn' },
          text: { type: 'string', description: 'The rule, quoted — not paraphrased' },
          covers: { type: 'string', description: "The one FRICEW object this rule governs, e.g. CNV-001 — or 'shared' when it spans several objects or the story as a whole" },
        },
        required: ['id', 'text', 'covers'],
        additionalProperties: false,
      },
    },
    futs: {
      type: 'array',
      description: 'Spec §8 functional unit tests, quoted verbatim',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'FUT-nnn' },
          covers: { type: 'string', description: 'The FRICEW ID the FUT covers' },
          title: { type: 'string' },
          preconditions: { type: 'string' },
          steps: { type: 'string' },
          expected: { type: 'string', description: 'Expected result, quoted with its exact numbers' },
        },
        required: ['id', 'covers', 'title', 'preconditions', 'steps', 'expected'],
        additionalProperties: false,
      },
    },
    filesToCreate: { type: 'array', items: { type: 'string' }, description: 'Repo-relative source paths a design doc names — the BUILD_PLAN prompt block, or the spec / TECH_STACK folder structure when the plan has none' },
    filesToModify: { type: 'array', items: { type: 'string' } },
    testPlan: {
      type: 'array',
      description: "What must fail first — BUILD_PLAN's numbered TDD list, or TEST_STRATEGY's per-FUT tier assignment when the plan has none",
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Intended test file path' },
          purpose: { type: 'string', description: 'The rule or FUT this test protects' },
        },
        required: ['file', 'purpose'],
        additionalProperties: false,
      },
    },
    modules: { type: 'array', items: { type: 'string' }, description: 'Source domains the story touches, e.g. srv/modules/transaction, mcp/verbs' },
    layers: {
      type: 'array',
      description: "The technology layers the story ships code in. 'cap' for srv/, db/ and any CAP-hosted folder the module's CLAUDE.md names (mcp/); 'ui5' only if the story ships UI under app/ — a BUILD_PLAN 'Ships UI' column, where one exists, decides it. Every later agent reads only the standards for the layers named here, and 'ui5' gates a browser",
      items: { type: 'string', enum: ['cap', 'ui5'] },
      minItems: 1,
      uniqueItems: true,
    },
    pages: { type: 'array', items: { type: 'string' }, description: "App routes/pages the story touches; empty unless layers includes 'ui5'" },
    bundledWith: { type: 'array', items: { type: 'string' }, description: "Other STORY IDs sharing this story's BUILD_PLAN prompt, if any. Their scope is NOT yours to build. A story's own FRICEW objects are never listed here — they are all in scope" },
    boardRow: { type: 'string', description: "The story's sprint-board row, character-for-character. Empty string when the module has no board" },
    blockers: {
      type: 'array',
      description: 'Questions the implementer must answer that the spec does not. Non-empty stops the build.',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          why: { type: 'string', description: 'What the spec says or fails to say, cited' },
        },
        required: ['question', 'why'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'storyId', 'storyName', 'specFile', 'summary', 'businessRules', 'futs', 'filesToCreate',
    'filesToModify', 'testPlan', 'modules', 'layers', 'pages',
    'bundledWith', 'boardRow', 'blockers',
  ],
  additionalProperties: false,
}

const RED_SCHEMA = {
  type: 'object',
  properties: {
    testFiles: { type: 'array', items: { type: 'string' }, description: 'Every test file created or modified, repo-relative' },
    summary: { type: 'string', description: 'What the suite asserts and which BR/FUT each file traces to' },
    confirmedFailing: { type: 'boolean', description: 'True only if you ran the suite and saw these tests fail on a missing implementation' },
    notes: { type: 'string', description: 'Anything the implementer needs to know. Empty string if nothing' },
  },
  required: ['testFiles', 'summary', 'confirmedFailing', 'notes'],
  additionalProperties: false,
}

const FOUNDATION_SCHEMA = {
  type: 'object',
  properties: {
    sharedFiles: { type: 'array', items: { type: 'string' }, description: 'Every test file created or modified, repo-relative. Deletions go in notes — a deleted file cannot be hashed' },
    owners: {
      type: 'array',
      description: 'Every file in the TDD list, assigned to exactly one object group — the group that writes its cases',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          owner: { type: 'string', description: 'One of the object IDs you were given' },
        },
        required: ['file', 'owner'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string', description: 'What scaffolding now exists and how a group author uses it' },
    notes: { type: 'string', description: 'Anything the implementer needs to know. Empty string if nothing' },
  },
  required: ['sharedFiles', 'owners', 'summary', 'notes'],
  additionalProperties: false,
}

const GATE_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean', description: 'True only if all four checks exited zero' },
    testsFailing: { type: 'boolean', description: "True if any Jest assertion failed. On the pre-implementation run this is expected to be true" },
    testHashes: {
      type: 'array',
      description: 'git hash-object output for every test file given to you, verbatim',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          hash: { type: 'string', description: 'Exactly as git hash-object printed it' },
        },
        required: ['file', 'hash'],
        additionalProperties: false,
      },
    },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          check: { type: 'string', enum: ['tsc', 'lint', 'test', 'cds-build'] },
          kind: {
            type: 'string',
            enum: ['mechanical', 'logic', 'coverage'],
            description: 'mechanical = a rule was broken; logic = a failing assertion; coverage = threshold not met',
          },
          detail: { type: 'string', description: 'Raw output including file:line. Quoted, not summarized, not diagnosed' },
        },
        required: ['check', 'kind', 'detail'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string', description: 'One line per check: which ran, which exited non-zero' },
  },
  required: ['passed', 'testsFailing', 'testHashes', 'failures', 'summary'],
  additionalProperties: false,
}

const IMPLEMENT_SCHEMA = {
  type: 'object',
  properties: {
    filesChanged: { type: 'array', items: { type: 'string' }, description: 'Source files created or modified, repo-relative' },
    summary: { type: 'string', description: 'What you built and the decisions a reviewer should know about' },
    hasDispute: { type: 'boolean', description: 'True if a test cannot pass against any correct implementation' },
    disputeDetail: { type: 'string', description: 'The file, the test, and the contradiction. Empty string when hasDispute is false' },
  },
  required: ['filesChanged', 'summary', 'hasDispute', 'disputeDetail'],
  additionalProperties: false,
}

const COVERAGE_SCHEMA = {
  type: 'object',
  properties: {
    testFiles: { type: 'array', items: { type: 'string' }, description: 'Test files created or modified in this phase' },
    summary: { type: 'string' },
    unreachable: { type: 'array', items: { type: 'string' }, description: 'Branches you judged genuinely unreachable, with the reason' },
  },
  required: ['testFiles', 'summary', 'unreachable'],
  additionalProperties: false,
}

const SMOKE_SCHEMA = {
  type: 'object',
  properties: {
    works: { type: 'boolean', description: 'Data binds, actions fire, results appear, console is clean' },
    verified: { type: 'boolean', description: 'False if you could not reach the checks at all — server would not start, route 404s' },
    observations: { type: 'array', items: { type: 'string' }, description: 'What you actually saw, not what should happen' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocking', 'cosmetic'] },
          detail: { type: 'string', description: 'What you observed, and where' },
        },
        required: ['severity', 'detail'],
        additionalProperties: false,
      },
    },
  },
  required: ['works', 'verified', 'observations', 'issues'],
  additionalProperties: false,
}

const HANDOFF_SCHEMA = {
  type: 'object',
  properties: {
    boardUpdated: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: ['boardUpdated', 'summary'],
  additionalProperties: false,
}

// args should arrive as an object, but a stringified payload is an easy caller mistake and
// silently builds the wrong story — parse rather than guess.
const input = (typeof args === 'string' ? JSON.parse(args) : args) ?? {}
const storyId = input.storyId ?? ''
const moduleDir = input.moduleDir ?? ''
// Module-relative; empty means the module tracks no board (Project Tracker, BP-001 §13 / D-207).
// A workflow script has no filesystem, so /build checks the file exists and passes the answer in.
const boardFile = input.boardFile ?? ''

if (!storyId) {
  log('No storyId given — nothing to build.')
  return { storyId: '', built: false, note: 'no storyId in args' }
}

// No default: a silent fallback to one module is how a story gets built into the wrong one.
if (!moduleDir) {
  log('No moduleDir given — refusing to guess which module owns the story.')
  return { storyId, built: false, note: 'no moduleDir in args' }
}

// The shared standards are one file per concern, but a story lives in one or two layers, and an
// agent that reads the whole file pays for every layer it is not building. Each layer names the
// sections that apply to it; an agent reads those by heading and nothing else. Citations keep the
// `path` §Heading form so lintAgentPrompts.ts can check every heading still exists.
const STANDARDS_SECTIONS = {
  cap: [
    '`Standards (Documents)/CODING_STANDARDS.md` §CDS, §TypeScript, §Handler Pattern, §Error Handling, §Logging, §i18n, §Encryption',
    '`Financial Planner/design/TECHNICAL_STANDARDS.md` §3, §4, §5, §6, §7, §8, §9 (rationale and worked examples)',
  ],
  ui5: [
    '`Standards (Documents)/CODING_STANDARDS.md` §SAPUI5, §i18n, §Frontend Validation',
    '`Financial Planner/design/TECHNICAL_STANDARDS.md` §8, §11 (rationale and worked examples)',
  ],
  every: [
    '`Standards (Documents)/CODING_STANDARDS.md` §Test Rules, §Do NOT',
    '`Financial Planner/design/TECHNICAL_STANDARDS.md` §13 (the TDD workflow)',
  ],
}

const standardsFor = layers => `## Standards for this story (layers: ${layers.join(', ')})

Module architecture, folder structure and carve-outs are in \`${moduleDir}/CLAUDE.md\` — a carve-out there beats the shared standard. The shared standards live in \`Standards (Documents)/CODING_STANDARDS.md\` for every module. **Read only the sections below, by heading** — Grep the heading, then Read that range. Do not read either file end to end; the sections for a layer this story does not ship are context you are paying for and not using.

${[...layers, 'every'].flatMap(layer => STANDARDS_SECTIONS[layer].map(line => `- ${line}`)).join('\n')}

Test tiers and boundaries are in \`${moduleDir}/design/TEST_STRATEGY.md\`; the enforced coverage thresholds are \`coverageThreshold\` in \`${moduleDir}/jest.config.ts\`. Sandro's standing corrections are \`feedback_*.md\` files in \`~/.claude/projects/c--Projects-Life-OS/memory/\`.`

// The full suite runs with --coverage and a posttest report, minutes per pass on a large module.
// Agents iterate on their own files and leave the full run to the gate, which runs it anyway.
const focusedRuns = `## Run tests narrowly while you work

Iterate with \`cd "${moduleDir}" && npx jest <the test files you are working against> --coverage=false\`.
Run the full \`npm test\` at most once, as your final check — the gate runs it again regardless, so
every extra full run is minutes spent learning nothing new.`

// The locked test list is rendered into three prompts; one helper keeps them identical.
const lockedTests = () => red.testFiles.map(file => `- ${file}`).join('\n')

const hashesOf = gate => new Map((gate.testHashes ?? []).map(entry => [entry.file, entry.hash]))

const findTestDrift = (baseline, current) => {
  const drift = []
  for (const [file, hash] of baseline) {
    const now = current.get(file)
    if (now === undefined) drift.push(`${file} — no longer present`)
    else if (now !== hash) drift.push(`${file} — content changed since the red baseline`)
  }
  return drift
}

phase('Brief')

const brief = await agent(
  `Resolve story **${storyId}** in module **${moduleDir}** into a structured brief for the build workflow.

Every agent after you works from your output instead of re-reading the design docs, so what you
omit, they never learn.

## Where to look

Modules shape their plans differently, so read **\`${moduleDir}/design/BUILD_PLAN.md\` first** for
what a story is there: its story list, how a story ID maps to a spec, whether it carries per-story
prompt blocks, and its Ships UI column if it has one. Then:

- **The owning spec** in \`${moduleDir}/design/specs/\`. If the story ID is a spec ID (\`SPEC-02\`), it is that spec file and **every FRICEW object it lists is in scope**. If it is a FRICEW ID, grep for it — the spec's FRICEW Objects header lists it. You need the functional description, the business rules (BR-nn) and the functional unit tests (FUT-nnn); section numbers differ by module.
- **The story's prompt block** in BUILD_PLAN, if the plan has them — files to create and the numbered TDD list. If it has none, take files from the spec and \`${moduleDir}/design/TECH_STACK.md\`'s folder structure, and the TDD list from \`${moduleDir}/design/TEST_STRATEGY.md\`'s FUT tier assignment. Cite; do not invent.
- \`${moduleDir}/design/DATA_MODEL.md\` — entities and fields the story touches.
${boardFile
    ? `- \`${moduleDir}/${boardFile}\` — the story's row, and whether its dependencies are Done.`
    : `- **This module has no sprint board** — leave \`boardRow\` empty. Judge whether dependency stories are Done from the progress record BUILD_PLAN names (its Progress Tracking section), and from what exists on disk.`}

Read what ${storyId} touches. Do not read every spec.

## What matters most

**Quote, do not summarize.** The Red agent writes the test suite from your \`businessRules\` and
\`futs\` text alone — it never opens the spec. A paraphrased expected-result becomes a wrong test,
and a wrong test becomes wrong code that passes.

**\`bundledWith\`** — a BUILD_PLAN prompt sometimes covers several *stories* (Financial Planner's
§6.3 Prompt 2 is ENH-009 **and** FRM-001). We are building **${storyId} alone**. List the other
story IDs so the implementer knows their scope is not his, and make sure \`filesToCreate\`,
\`testPlan\` and the rules you quote cover **only ${storyId}**. A sibling may already be Done, in
which case its files exist and must not be rebuilt. This is about sibling stories, never about the
several FRICEW objects one story owns — those are all in scope and all quoted.

${boardFile ? `**\`boardRow\`** — the row character-for-character, so the Handoff phase can find and move it.` : '**`boardRow`** — empty string; there is no board to hand off to.'}
Ignore any commit block in BUILD_PLAN — this workflow does not commit.

**\`layers\`** decides what every later agent reads and whether a browser runs. \`cap\` for anything
under \`srv/\`, \`db/\` or a CAP-hosted folder the module's CLAUDE.md names (\`mcp/\`); \`ui5\` only if the
story ships UI under \`app/\`. Where BUILD_PLAN has a Ships UI column, it decides \`ui5\`; otherwise a
Form (FRM) story ships UI and an Enhancement (ENH) or Conversion (CNV) story usually does not.

## Blockers stop the build

Return a blocker for anything the implementer must know that the spec does not say: a BR that
contradicts another, an FUT whose expected result contradicts its BR, a field DATA_MODEL does not
define, a dependency story that is not Done, an \`## Open Items\` entry this story needs.

"The spec is thin and I would build it this way" is a blocker — say so rather than deciding.
"The spec does not restate the handler pattern" is not; that is in CLAUDE.md and the implementer
already has it.

A spec marked provisional on a risk is a blocker only if that risk is still open — check the
module's risk register or progress record before reporting it.`,
  { label: `brief:${storyId}`, phase: 'Brief', model: 'sonnet', effort: 'medium', agentType: 'build-briefer', schema: BRIEF_SCHEMA },
)

if (!brief) return { storyId, built: false, note: 'brief agent failed' }

if (brief.blockers.length) {
  log(`${brief.blockers.length} blocker(s) in the spec — stopping before any code is written.`)
  return {
    storyId,
    storyName: brief.storyName,
    built: false,
    blockers: brief.blockers,
    note: 'spec is ambiguous — run /workshop on it before building',
  }
}

log(`${brief.storyId} — ${brief.storyName}. ${brief.businessRules.length} business rules, ${brief.futs.length} FUTs. Layers: ${brief.layers.join(', ')}${brief.layers.includes('ui5') ? ' — smoke will run.' : ' — skipping smoke.'}`)

const contextFor = (rules, futs) => `## Story

**${brief.storyId} — ${brief.storyName}**
${brief.summary}

Spec: \`${brief.specFile}\`. Modules: ${brief.modules.join(', ') || '(none named)'}.
${brief.bundledWith.length ? `\n**Scope guard:** BUILD_PLAN bundles this story into one prompt with ${brief.bundledWith.join(', ')}. You are building **${brief.storyId} only** — the sibling stories are out of scope, and any of them already Done has files on disk you must not rebuild.\n` : ''}

## Business rules (quoted from the spec — treat as the source of truth)

${rules.map(rule => `- **${rule.id}** (${rule.covers}) — ${rule.text}`).join('\n')}

## Functional unit tests (spec §8)

${futs.map(fut => `### ${fut.id}: ${fut.title}\n**Covers:** ${fut.covers}\n**Preconditions:** ${fut.preconditions}\n**Steps:** ${fut.steps}\n**Expected:** ${fut.expected}`).join('\n\n')}

## Files the design docs call for

Create: ${brief.filesToCreate.join(', ') || '(none listed)'}
Modify: ${brief.filesToModify.join(', ') || '(none listed)'}

## The TDD list

${brief.testPlan.map(item => `- \`${item.file}\` — ${item.purpose}`).join('\n') || '(none listed)'}`

const briefContext = contextFor(brief.businessRules, brief.futs)

phase('Red')

// A FUT's Covers line can name several objects; it belongs to the first so no case is written twice.
const ownerOf = fut => fut.covers.split(/[,;\s]+/).find(Boolean) ?? fut.covers
const objects = [...new Set(brief.futs.map(ownerOf))]

const redRules = `Write tests that trace to the rules above. Every test names a BR-nn or FUT-nnn it protects — if
you cannot name one, the test does not belong. Do not invent coverage for behavior nobody
specified, and do not soften an expected value because it looks awkward to assert.

Work from the quoted text above. Do not open the spec — it has already been read for you.`

const redLock = `Return every test file you touched in \`testFiles\`. The workflow hashes exactly that list to lock
the suite against the implementer — a file you omit is a file he can silently rewrite.`

const writeRedSingle = () =>
  agent(
    `Write the failing tests for **${brief.storyId}**. This is the red of red-green-refactor, and it
is the highest-judgment step in the run: the implementer will make whatever you write pass, and
nothing downstream re-checks whether you asked for the right behavior.

${briefContext}

## Your job

${redRules}

${focusedRuns}

## Before you finish

Confirm your new tests **fail on a missing or wrong implementation** — not on a typo, a bad import,
or a fixture that does not compile. Those are your bugs, and the gate rejects them as a red-phase
defect. Set \`confirmedFailing\` only if you actually saw this.

${redLock}

${standardsFor(brief.layers)}`,
    { label: `red:${brief.storyId}`, phase: 'Red', model: 'opus', effort: 'high', agentType: 'test-author', schema: RED_SCHEMA },
  )

// One author per object on a multi-object story: their cases are independent, and written serially
// they were the longest phase in the run (SPEC-02: 28 minutes, 19 FUTs over three objects). Shared
// scaffolding goes first so parallel authors never edit the same file.
const writeRedByObject = async () => {
  const foundation = await agent(
    `Lay the shared test scaffolding for **${brief.storyId}**, so that ${objects.length} authors — one per
object: ${objects.join(', ')} — can then write its failing tests **in parallel** without touching the
same file. You write the ground they stand on; you write no test case.

${briefContext}

## Your job

1. **Shared scaffolding** — the test data and support modules more than one object's cases need
   (seeded worlds, harness helpers, builders, read-back helpers), and any change to an **existing**
   suite or fixture this story's rules force (a fixture copy a rule removes, a harness a new seed
   breaks). Existing files are yours alone: the group authors may not edit any of them.
2. **Assign every file in the TDD list to exactly one object** in \`owners\` — the object whose rules
   its cases trace to. A file two objects need goes to the one with more cases in it; the other
   writes its cases in a new file of its own.

Do not write a \`describe\`/\`it\` for any BR or FUT — that is the group authors' work, and a case you
write is one nobody re-checks against its rule.

${focusedRuns}

## Before you finish

Run \`cd "${moduleDir}" && npx tsc --noEmit\` — the group authors build on your files, and a type error
here is ${objects.length} failed authors. Existing suites you changed may now fail on the missing
implementation; that is expected. Return every file you created or modified in \`sharedFiles\`, and
name any you deleted in \`notes\` — a deleted file cannot be hashed.

${standardsFor(brief.layers)}`,
    { label: `red:foundation:${brief.storyId}`, phase: 'Red', model: 'opus', effort: 'high', agentType: 'test-author', schema: FOUNDATION_SCHEMA },
  )

  if (!foundation) return null

  const groupAuthors = objects.map(object => () => {
    const futs = brief.futs.filter(fut => ownerOf(fut) === object)
    const rules = brief.businessRules.filter(rule => rule.covers === object || rule.covers === 'shared')
    const ownedFiles = foundation.owners.filter(entry => entry.owner === object).map(entry => entry.file)
    return agent(
      `Write the failing tests for **${object}**, one object of story **${brief.storyId}**. This is the red
of red-green-refactor: the implementer will make whatever you write pass, and nothing downstream
re-checks whether you asked for the right behavior.

${objects.length - 1} other author(s) are writing ${objects.filter(other => other !== object).join(', ')} at this
moment, in the same tree. Stay inside your lane and you never collide.

${contextFor(rules, futs)}

## Your lane

Your FUTs and the rules above — **${object}'s rules plus the shared ones** — are yours. The other
objects' rules are not; do not write cases for them.

**Files you own** (create them, or fill them in): ${ownedFiles.map(file => `\`${file}\``).join(', ') || '(none assigned — create new files)'}.
You may also create **new** files named for your object's behavior. You may **not** modify any file
that existed before you started, or any of the shared scaffolding — another author may be reading it:

${foundation.sharedFiles.map(file => `- ${file}`).join('\n') || '(none)'}

The scaffolding author left this: ${foundation.summary}
If the scaffolding lacks something you need, build it in a new support file of your own and say so
in \`notes\`.

## Your job

${redRules}

## Run only your files

\`cd "${moduleDir}" && npx jest <your test files> --coverage=false\` — never the full \`npm test\`. It
would run the other authors' half-written files, and the gate runs the full suite next anyway.
Confirm your tests **fail on a missing or wrong implementation**, not on a typo, a bad import or a
fixture that does not compile. Set \`confirmedFailing\` only if you saw this.

${redLock}

${standardsFor(brief.layers)}`,
      { label: `red:${object}:${brief.storyId}`, phase: 'Red', model: 'opus', effort: 'high', agentType: 'test-author', schema: RED_SCHEMA },
    )
  })

  const groups = await parallel(groupAuthors)
  if (groups.some(group => !group)) return null

  return {
    testFiles: [...new Set([...foundation.sharedFiles, ...groups.flatMap(group => group.testFiles)])],
    summary: [foundation.summary, ...groups.map((group, index) => `${objects[index]}: ${group.summary}`)].join('\n\n'),
    confirmedFailing: groups.every(group => group.confirmedFailing),
    notes: [foundation.notes, ...groups.map((group, index) => group.notes && `${objects[index]}: ${group.notes}`)].filter(Boolean).join('\n\n'),
  }
}

const red = objects.length > 1 ? await writeRedByObject() : await writeRedSingle()

if (objects.length > 1) log(`Red written by ${objects.length} parallel authors (${objects.join(', ')}) over shared scaffolding.`)

if (!red) return { storyId, built: false, note: 'red agent failed' }
if (!red.testFiles.length) return { storyId, built: false, note: 'red phase wrote no tests' }

phase('Gate')

const runGate = (label, testFiles, expectRed) =>
  agent(
    `Run the build gate for \`${moduleDir}\` and report what happened.

${expectRed ? '**On this run the tests are expected to FAIL** — the implementation does not exist yet. That is the correct outcome. A test that passes here is a broken test, and saying so is the most useful thing you can do.' : 'The implementation is in place; the suite is expected to pass.'}

## Run all four, even if an early one fails

\`\`\`
cd "${moduleDir}" && npx tsc --noEmit
cd "${moduleDir}" && npm run lint
cd "${moduleDir}" && npm test
cd "${moduleDir}" && npm run build
\`\`\`

One failure must not mask the other three — if you stop early, the repair agent fixes one thing
per round and the loop runs out of budget.

\`npm run lint\` is ESLint plus 21 \`lint:*\` scripts chained with \`&&\`, so it halts at the first
failing linter. Expected. Report what you got; do not run the rest by hand.

\`npm test\` has \`--coverage\` baked in, and a module may add a \`posttest\` report generator that always fires. Both normal.

## Hash these test files

${testFiles.map(file => `- ${file}`).join('\n')}

Run \`git hash-object <file>\` on each and return the output verbatim. It works on untracked files.
These hashes prove the implementer did not weaken the tests to get green — never regenerate or
"correct" one.

## Classify each failure

- \`mechanical\` — a rule was broken and the message says how to fix it: any \`lint:*\` violation, an ESLint rule, a \`tsc\` type error, a \`cds build\` error.
- \`logic\` — a failing Jest assertion: expected X, received Y. The implementation is wrong.
- \`coverage\` — Jest's \`"Jest: coverage threshold ... not met"\`. The code is right, the tests do not reach it.

\`test\` produces both \`logic\` and \`coverage\`, and they route to different agents. \`npm test\` exits
non-zero for either, so read the output, not the exit code. If a run has both, report both.

Put the **raw output** in \`detail\` — the real error text with \`file:line\`. Do not summarize it, do
not diagnose the cause, do not suggest a fix. The agent reading your report does that, and it
needs the real text.`,
    { label, phase: 'Gate', model: 'haiku', effort: 'low', agentType: 'gate-runner', schema: GATE_SCHEMA },
  )

const redGate = await runGate(`gate:red:${brief.storyId}`, red.testFiles, true)

if (!redGate) return { storyId, built: false, note: 'gate agent failed on the red run' }

if (!redGate.testsFailing) {
  log('The new tests PASS before the implementation exists — they assert nothing. Stopping.')
  return {
    storyId,
    storyName: brief.storyName,
    built: false,
    testFiles: red.testFiles,
    note: 'red phase defect: tests pass with no implementation, so they test nothing',
    gate: redGate.summary,
  }
}

const baselineHashes = hashesOf(redGate)
log(`Red confirmed: ${red.testFiles.length} test files failing as expected. Baseline hashed; the suite is now locked.`)

phase('Implement')

const implement = await agent(
  `Implement **${brief.storyId}**. The tests are written and failing. Make them pass without
touching them.

${briefContext}

## The failing gate

${redGate.summary}

${redGate.failures.map(failure => `### ${failure.check} (${failure.kind})\n${failure.detail}`).join('\n\n')}

## The tests are frozen

These files are hashed. Any edit fails the gate and the story does not commit:

${lockedTests()}

${red.notes ? `The test author left you a note: ${red.notes}\n` : ''}
If a test cannot pass against any correct implementation — it contradicts its own BR, or asserts
behavior the spec does not specify — set \`hasDispute\` and explain. That routes to a human. Being
blocked by a wrong test is a real outcome; relaxing an assertion to get green is the failure this
workflow exists to prevent.

## Build to the standards

The handler pattern, the annotation-first rule and the CQL rules are in the standards named below;
prefer a CAP annotation to a hand-written check wherever the model can state it. Source folders
outside \`srv/\` (Project Tracker's \`mcp/\`) follow whatever \`${moduleDir}/CLAUDE.md\` rules for them.

${focusedRuns}

Run \`cd "${moduleDir}" && npm run lint\` before you report done — a violation you could have caught
costs a full gate round.

${standardsFor(brief.layers)}`,
  { label: `implement:${brief.storyId}`, phase: 'Implement', model: 'opus', effort: 'high', agentType: 'implementer', schema: IMPLEMENT_SCHEMA },
)

if (!implement) return { storyId, built: false, note: 'implement agent failed' }

if (implement.hasDispute) {
  log('The implementer disputes a test rather than weakening it. Stopping for a human.')
  return {
    storyId,
    storyName: brief.storyName,
    built: false,
    testDispute: implement.disputeDetail,
    testFiles: red.testFiles,
    note: 'test dispute — the implementer says a test cannot pass against any correct implementation',
  }
}

// A repair round can add files the first pass never wrote, and the result reports this set as the
// story's diff — losing a round's output here means Sandro reviews an incomplete changeset.
const changedFiles = new Set(implement.filesChanged)

let gate = null
let round = 0
let drift = []

// Gate first, repair second, so the last repair is always verified before the loop exits — a
// budget check at the top would leave the final round's work ungated and commit it unproven.
while (true) {
  phase('Gate')
  gate = await runGate(`gate:round-${round + 1}:${brief.storyId}`, red.testFiles, false)
  if (!gate) return { storyId, built: false, note: `gate agent failed on round ${round + 1}` }

  drift = findTestDrift(baselineHashes, hashesOf(gate))
  if (drift.length) break

  if (gate.passed) break

  // Coverage is a different job from a failing assertion — the Coverage phase owns it, so a
  // coverage-only gate is as green as this loop can get.
  const repairable = gate.failures.filter(failure => failure.kind !== 'coverage')
  if (!repairable.length) break

  if (round >= MAX_REPAIR_ROUNDS) break

  round += 1
  const hasLogicFailure = repairable.some(failure => failure.kind === 'logic')
  // Round 1 routes by kind to keep mechanical fixes off Opus. From round 2 the cheap tier has
  // already had its shot, so escalate regardless — a misclassified failure costs one round, not the run.
  const needsOpus = hasLogicFailure || round >= 2

  phase('Implement')
  log(`Gate red (round ${round}/${MAX_REPAIR_ROUNDS}): ${repairable.map(failure => `${failure.check}/${failure.kind}`).join(', ')} → ${needsOpus ? 'Opus' : 'Sonnet'} repair.`)

  const repair = await agent(
    `Repair **${brief.storyId}**. The gate is red.

${briefContext}

## What failed

${repairable.map(failure => `### ${failure.check} (${failure.kind})\n${failure.detail}`).join('\n\n')}

## Fix the cause, not the symptom

${hasLogicFailure ? 'A failing assertion means your implementation is wrong. Re-read the BR the test cites before you change code. Making the observable value match the expectation without understanding why they differed is how a test suite becomes decoration.' : 'These are rule violations — the message says what the rule is. Fix them as stated; do not redesign anything to satisfy a linter.'}

## The tests are still frozen

${lockedTests()}

Hashed and checked every round. If a test is genuinely wrong, set \`hasDispute\` — do not edit it.

${focusedRuns}

${standardsFor(brief.layers)}`,
    {
      label: `repair:round-${round}:${brief.storyId}`,
      phase: 'Implement',
      model: needsOpus ? 'opus' : 'sonnet',
      effort: needsOpus ? 'high' : 'medium',
      agentType: 'implementer',
      schema: IMPLEMENT_SCHEMA,
    },
  )

  if (repair?.hasDispute) {
    return {
      storyId,
      storyName: brief.storyName,
      built: false,
      testDispute: repair.disputeDetail,
      note: 'test dispute raised during repair',
    }
  }

  for (const file of repair?.filesChanged ?? []) changedFiles.add(file)
}

if (drift.length) {
  log('Test files changed since the red baseline. Refusing to commit.')
  return {
    storyId,
    storyName: brief.storyName,
    built: false,
    red: true,
    testDrift: drift,
    note: 'the test suite was modified after the red baseline — the TDD contract is broken, nothing committed',
  }
}

const blockingFailures = (gate?.failures ?? []).filter(failure => failure.kind !== 'coverage')

if (blockingFailures.length) {
  log(`Still red after ${MAX_REPAIR_ROUNDS} rounds. Nothing committed.`)
  return {
    storyId,
    storyName: brief.storyName,
    built: false,
    red: true,
    rounds: round,
    failures: blockingFailures,
    filesChanged: [...changedFiles],
    testFiles: red.testFiles,
    note: `gate still red after ${MAX_REPAIR_ROUNDS} repair rounds`,
  }
}

log(`Gate green after ${round} repair round(s).`)

let coverage = null

if (gate.failures.some(failure => failure.kind === 'coverage')) {
  phase('Coverage')

  const shortfall = gate.failures.filter(failure => failure.kind === 'coverage').map(failure => failure.detail).join('\n\n')

  coverage = await agent(
    `Raise test coverage for **${brief.storyId}** to threshold. The implementation is correct — the
gate is green apart from coverage. The tests just do not reach all of it.

${briefContext}

## The shortfall

${shortfall}

## Thresholds

Read \`coverageThreshold\` in \`${moduleDir}/jest.config.ts\` — that is what the gate enforces, per
path glob. \`${moduleDir}/design/TEST_STRATEGY.md\` explains why each number is what it is.
Facades are excluded — they hold no logic by design.

Read the uncovered branches from the coverage report and write tests that reach them **through
behavior that matters**. A test written to paint a line green, asserting nothing a reader would
care about, buys a number and costs a maintainer. If a branch is genuinely unreachable, list it in
\`unreachable\` with the reason rather than contorting a test to hit it.

You may add test files. You may not change the ones from the red phase:

${lockedTests()}

While you work, measure only what you are raising: \`npx jest <test files> --coverage
--collectCoverageFrom=<the source file>\`. One full \`npm test\` at the end — the gate runs it again.

${standardsFor(brief.layers)}`,
    { label: `coverage:${brief.storyId}`, phase: 'Coverage', model: 'sonnet', effort: 'medium', agentType: 'test-author', schema: COVERAGE_SCHEMA },
  )

  phase('Gate')
  const coverageGate = await runGate(`gate:coverage:${brief.storyId}`, red.testFiles, false)

  if (coverageGate) {
    const coverageDrift = findTestDrift(baselineHashes, hashesOf(coverageGate))
    if (coverageDrift.length) {
      return {
        storyId,
        storyName: brief.storyName,
        built: false,
        red: true,
        testDrift: coverageDrift,
        note: 'the coverage phase modified locked test files — nothing committed',
      }
    }
    gate = coverageGate
  }

  if (!gate.passed) {
    log('Coverage still short of threshold. Nothing committed.')
    return {
      storyId,
      storyName: brief.storyName,
      built: false,
      red: true,
      failures: gate.failures,
      coverage: coverage?.summary,
      note: 'coverage below threshold after the coverage phase',
    }
  }
}

let smoke = null

if (brief.layers.includes('ui5')) {
  phase('Smoke')

  smoke = await agent(
    `Smoke-test **${brief.storyId}** in a real browser. The gate is green — tsc, lint, the full Jest
suite and \`cds build\` all pass. None of that proves the page renders.

${briefContext}

## Pages this story touches

${brief.pages.map(page => `- ${page}`).join('\n') || '(none named — find them from the files the story changed)'}

## Drive it

Start the server with \`cd "${moduleDir}" && npm start\` in the background, wait for the port, drive
the flow a user would, then shut it down — a stray \`cds-serve\` holding the port breaks the next run.

Default to screenshot + \`browser_evaluate\` returning JSON; that answers "did it render, with what
data" in two calls. Reach for \`browser_snapshot\` only when you need click refs. Check
\`browser_console_messages\` before calling anything green — a UI5 view swallows more than you expect,
and a page that renders while throwing is not working.

## Report what you saw

Separate **does it work** (data binds, actions fire, results appear, console clean — this is the
pass/fail) from **does it look right** (labels human-readable, no raw JSON, no \`undefined\` on
screen, no untranslated i18n key showing through — these are \`cosmetic\` issues).

Cite observations, not conclusions. If you could not reach a check — server would not start, route
404s — set \`verified: false\` and say so. An honest "could not verify" beats a confident guess: a
false green here means nobody looks again.`,
    { label: `smoke:${brief.storyId}`, phase: 'Smoke', model: 'sonnet', effort: 'medium', agentType: 'smoke-tester', schema: SMOKE_SCHEMA },
  )

  const blockingIssues = (smoke?.issues ?? []).filter(issue => issue.severity === 'blocking')

  // A dead smoke agent is an unverified UI, not a passing one. Falling through would report the
  // story as green and mark the board ready for review on a page nobody managed to open.
  if (!smoke || !smoke.works || !smoke.verified || blockingIssues.length) {
    log('Smoke test did not pass. Nothing committed.')
    return {
      storyId,
      storyName: brief.storyName,
      built: false,
      red: true,
      gate: gate.summary,
      smoke,
      filesChanged: [...changedFiles],
      testFiles: red.testFiles,
      note: !smoke
        ? 'the smoke agent failed, so the UI is unverified — nothing committed'
        : smoke.verified
          ? 'the gate is green but the UI does not work — nothing committed'
          : 'the UI could not be verified — nothing committed',
    }
  }
}

// A board-less module has nothing to hand off to, and spawning an agent to edit a file that
// does not exist invites it to edit the wrong module's board instead.
if (!boardFile) {
  log(`${brief.storyId} built green and left uncommitted for review. ${moduleDir} tracks no board — nothing to mark.`)
  return {
    storyId: brief.storyId,
    storyName: brief.storyName,
    moduleDir,
    built: true,
    committed: false,
    boardUpdated: false,
    boardless: true,
    repairRounds: round,
    gate: gate.summary,
    summary: implement.summary,
    filesChanged: [...changedFiles],
    testFiles: [...red.testFiles, ...(coverage?.testFiles ?? [])],
    coverage: coverage?.summary ?? 'thresholds met without a coverage phase',
    unreachable: coverage?.unreachable ?? [],
    smoke: smoke ? { works: smoke.works, observations: smoke.observations, issues: smoke.issues } : null,
  }
}

phase('Handoff')

const handoff = await agent(
  `Hand off **${brief.storyId}**. The gate is green${brief.layers.includes('ui5') ? ' and the UI smoke-tested clean' : ''}.

## Update the sprint board — that is the whole job

In \`${moduleDir}/${boardFile}\`, move this row out of the **Backlog** table into the
**In Progress** table, and set its \`Status\` to \`Build Done, Awaiting Review\`. Do not reword the
description.

\`\`\`
${brief.boardRow}
\`\`\`

If the **In Progress** section currently reads \`_None_\`, replace that with the table — header row
included, matching the column shape the other tables use.

The story is **not Done**. It is built and green, and Sandro has not looked at it yet. \`Done\` is
his to set when he commits.

## Do not commit

This workflow stops here, one step before the commit. Sandro reviews the working tree first — that
review is the point, and a commit would front-run it.

Do not \`git add\`, do not \`git commit\`, do not \`git stash\`, do not create a branch. Leave every
change — source, tests, and this board edit — uncommitted in the working tree. Reading git state
(\`git status\`, \`git diff\`) is fine.`,
  { label: `handoff:${brief.storyId}`, phase: 'Handoff', model: 'sonnet', effort: 'medium', agentType: 'implementer', schema: HANDOFF_SCHEMA },
)

log(`${brief.storyId} built green and left uncommitted for review.${handoff?.boardUpdated ? ' Board marked Build Done, Awaiting Review.' : ' Board was NOT updated.'}`)

return {
  storyId: brief.storyId,
  storyName: brief.storyName,
  moduleDir,
  built: true,
  committed: false,
  boardUpdated: handoff?.boardUpdated ?? false,
  boardless: false,
  repairRounds: round,
  gate: gate.summary,
  summary: implement.summary,
  filesChanged: [...changedFiles],
  testFiles: [...red.testFiles, ...(coverage?.testFiles ?? [])],
  coverage: coverage?.summary ?? 'thresholds met without a coverage phase',
  unreachable: coverage?.unreachable ?? [],
  smoke: smoke ? { works: smoke.works, observations: smoke.observations, issues: smoke.issues } : null,
}
