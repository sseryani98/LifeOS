export const meta = {
  name: 'build',
  description: 'Build one story end-to-end with isolated agents: brief, TDD red, implement, gate, coverage, smoke, handoff',
  whenToUse:
    'To build a single FRICEW story (e.g. FRM-001) from its spec and BUILD_PLAN prompt. Leaves a green, uncommitted tree for Sandro to review — it never commits. Invoked by /build.',
  phases: [
    { title: 'Brief', detail: 'resolve the story to a structured brief so no later agent re-reads the design docs' },
    { title: 'Red', detail: 'write the failing tests from the spec business rules and FUTs', model: 'opus' },
    { title: 'Implement', detail: 'build the handler pattern against frozen tests', model: 'opus' },
    { title: 'Gate', detail: 'tsc, lint, test, cds build — classify failures, hash the tests' },
    { title: 'Coverage', detail: 'raise coverage to the TEST_STRATEGY thresholds' },
    { title: 'Smoke', detail: 'drive the UI in a real browser (frontend stories only)' },
    { title: 'Handoff', detail: 'mark the board Build Done, Awaiting Review — the commit is Sandro\'s' },
  ],
}

const MAX_REPAIR_ROUNDS = 3

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    storyId: { type: 'string', description: 'The FRICEW ID, e.g. FRM-001' },
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
        },
        required: ['id', 'text'],
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
    filesToCreate: { type: 'array', items: { type: 'string' }, description: 'Repo-relative source paths from the BUILD_PLAN Backend block' },
    filesToModify: { type: 'array', items: { type: 'string' } },
    testPlan: {
      type: 'array',
      description: "BUILD_PLAN's numbered TDD list — what must fail first",
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
    modules: { type: 'array', items: { type: 'string' }, description: 'srv/modules/ names the story touches, e.g. transaction' },
    hasBackend: { type: 'boolean' },
    hasFrontend: { type: 'boolean', description: 'True only if the story ships UI under app/ — this gates a browser' },
    pages: { type: 'array', items: { type: 'string' }, description: 'App routes/pages the story touches; empty when hasFrontend is false' },
    bundledWith: { type: 'array', items: { type: 'string' }, description: "Other FRICEW IDs sharing this story's BUILD_PLAN prompt, if any. Their scope is NOT yours to build" },
    boardRow: { type: 'string', description: "The story's SPRINT_BOARD.md row, character-for-character" },
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
    'filesToModify', 'testPlan', 'modules', 'hasBackend', 'hasFrontend', 'pages',
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
const moduleDir = input.moduleDir ?? 'Financial Planner'

if (!storyId) {
  log('No storyId given — nothing to build.')
  return { storyId: '', built: false, note: 'no storyId in args' }
}

const standards = `Standards live in \`${moduleDir}/CLAUDE.md\` (handler pattern :109-122, TS/naming :100-107, SAPUI5 :143-166, test rules :173-184) and \`${moduleDir}/design/TECHNICAL_STANDARDS.md\`. Test boundaries and coverage thresholds are in \`${moduleDir}/design/TEST_STRATEGY.md\`. Sandro's standing corrections are \`feedback_*.md\` files in C:\\Users\\sandr\\.claude\\projects\\c--Projects-Life-OS\\memory\\.`

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

// --------------------------------------------------------------- Phase 1: Brief

phase('Brief')

const brief = await agent(
  `Resolve story **${storyId}** into a structured brief for the build workflow.

Every agent after you works from your output instead of re-reading the design docs, so what you
omit, they never learn.

## Where to look

- \`${moduleDir}/design/BUILD_PLAN.md\` §6 — the story's verbatim prompt block: files to create and the numbered TDD list. §7 is the sprint → prompt → stories table if you need to locate it. W1-S3 is §6.3.
- \`${moduleDir}/design/specs/SPEC-nn-*.md\` — the owning spec. Find it by grepping \`${storyId}\` (§2.2 FRICEW Objects lists it) . You need §4 (functional description), §5 (business rules), §8 (functional unit tests).
- \`${moduleDir}/design/DATA_MODEL.md\` — entities and fields the story touches.
- \`${moduleDir}/project/SPRINT_BOARD.md\` — the story's row, and whether its dependencies are Done.

Read what ${storyId} touches. Do not read all 21 specs.

## What matters most

**Quote, do not summarize.** The Red agent writes the test suite from your \`businessRules\` and
\`futs\` text alone — it never opens the spec. A paraphrased expected-result becomes a wrong test,
and a wrong test becomes wrong code that passes.

**\`bundledWith\`** — a BUILD_PLAN prompt sometimes covers several stories (§6.3 Prompt 2 is
ENH-009 **and** FRM-001). We are building **${storyId} alone**. List the other IDs so the
implementer knows their scope is not his, and make sure \`filesToCreate\`, \`testPlan\` and the rules
you quote cover **only ${storyId}**. Check the board: a bundled sibling may already be Done, in
which case its files exist and must not be rebuilt.

**\`boardRow\`** — the row character-for-character, so the Handoff phase can find and move it.
Ignore BUILD_PLAN's commit block entirely — this workflow does not commit.

**\`hasFrontend\`** gates a browser. True only if the story ships UI under \`app/\`.

## Blockers stop the build

Return a blocker for anything the implementer must know that the spec does not say: a BR that
contradicts another, an FUT whose expected result contradicts its BR, a field DATA_MODEL does not
define, a dependency story that is not Done, an \`## Open Items\` entry this story needs.

"The spec is thin and I would build it this way" is a blocker — say so rather than deciding.
"The spec does not restate the handler pattern" is not; that is in CLAUDE.md and the implementer
already has it.`,
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

log(`${brief.storyId} — ${brief.storyName}. ${brief.businessRules.length} business rules, ${brief.futs.length} FUTs. ${brief.hasFrontend ? 'Frontend story: smoke will run.' : 'Backend-only: skipping smoke.'}`)

const briefContext = `## Story

**${brief.storyId} — ${brief.storyName}**
${brief.summary}

Spec: \`${brief.specFile}\`. Modules: ${brief.modules.join(', ') || '(none named)'}.
${brief.bundledWith.length ? `\n**Scope guard:** BUILD_PLAN bundles this story into one prompt with ${brief.bundledWith.join(', ')}. You are building **${brief.storyId} only** — the sibling stories are out of scope, and any of them already Done has files on disk you must not rebuild.\n` : ''}

## Business rules (quoted from the spec — treat as the source of truth)

${brief.businessRules.map(rule => `- **${rule.id}** — ${rule.text}`).join('\n')}

## Functional unit tests (spec §8)

${brief.futs.map(fut => `### ${fut.id}: ${fut.title}\n**Covers:** ${fut.covers}\n**Preconditions:** ${fut.preconditions}\n**Steps:** ${fut.steps}\n**Expected:** ${fut.expected}`).join('\n\n')}

## Files the BUILD_PLAN calls for

Create: ${brief.filesToCreate.join(', ') || '(none listed)'}
Modify: ${brief.filesToModify.join(', ') || '(none listed)'}

## The TDD list from BUILD_PLAN

${brief.testPlan.map(item => `- \`${item.file}\` — ${item.purpose}`).join('\n') || '(none listed)'}`

// ----------------------------------------------------------------- Phase 2: Red

phase('Red')

const red = await agent(
  `Write the failing tests for **${brief.storyId}**. This is the red of red-green-refactor, and it
is the highest-judgment step in the run: the implementer will make whatever you write pass, and
nothing downstream re-checks whether you asked for the right behavior.

${briefContext}

## Your job

Write tests that trace to the rules above. Every test names a BR-nn or FUT-nnn it protects — if
you cannot name one, the test does not belong. Do not invent coverage for behavior nobody
specified, and do not soften an expected value because it looks awkward to assert.

Work from the quoted text above. Do not open the spec — it has already been read for you.

## Before you finish

Run \`cd "${moduleDir}" && npm test\` and confirm your new tests **fail on a missing or wrong
implementation** — not on a typo, a bad import, or a fixture that does not compile. Those are your
bugs, and the gate rejects them as a red-phase defect. Set \`confirmedFailing\` only if you actually
saw this.

Return every test file you touched in \`testFiles\`. The workflow hashes exactly that list to lock
the suite against the implementer — a file you omit is a file he can silently rewrite.

${standards}`,
  { label: `red:${brief.storyId}`, phase: 'Red', model: 'opus', effort: 'high', agentType: 'test-author', schema: RED_SCHEMA },
)

if (!red) return { storyId, built: false, note: 'red agent failed' }
if (!red.testFiles.length) return { storyId, built: false, note: 'red phase wrote no tests' }

// ------------------------------------------------- Phase 3: Gate (expects red)

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

\`npm test\` has \`--coverage\` baked in and a \`posttest\` report generator that always fires. Both normal.

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

// ----------------------------------------------------------- Phase 4: Implement

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

${red.testFiles.map(file => `- ${file}`).join('\n')}

${red.notes ? `The test author left you a note: ${red.notes}\n` : ''}
If a test cannot pass against any correct implementation — it contradicts its own BR, or asserts
behavior the spec does not specify — set \`hasDispute\` and explain. That routes to a human. Being
blocked by a wrong test is a real outcome; relaxing an assertion to get green is the failure this
workflow exists to prevent.

## Build to the pattern

Facade (pure wiring) → Service (logic, no CQL) → DataService (all CQL, no logic) → Validator
(accumulates \`req.error\`) → Mapper (only if foreign-shape translation exists). Prefer a CAP
annotation to a hand-written check wherever the model can state it.

Run \`cd "${moduleDir}" && npm run lint\` before you report done — a violation you could have caught
costs a full gate round.

${standards}`,
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

// ------------------------------------------------- Phase 5: Gate + repair loop

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

${red.testFiles.map(file => `- ${file}`).join('\n')}

Hashed and checked every round. If a test is genuinely wrong, set \`hasDispute\` — do not edit it.

${standards}`,
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

// ------------------------------------------------------------ Phase 6: Coverage

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

## Thresholds (TEST_STRATEGY §8.1)

Validators and Utilities 100% lines / 100% branches. Services (including ENH engines) 90% / 85%.
Overall 85% / 80%. Facades are excluded — they hold no logic by design.

Read the uncovered branches from the coverage report and write tests that reach them **through
behavior that matters**. A test written to paint a line green, asserting nothing a reader would
care about, buys a number and costs a maintainer. If a branch is genuinely unreachable, list it in
\`unreachable\` with the reason rather than contorting a test to hit it.

You may add test files. You may not change the ones from the red phase:

${red.testFiles.map(file => `- ${file}`).join('\n')}

${standards}`,
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

// --------------------------------------------------------------- Phase 7: Smoke

let smoke = null

if (brief.hasFrontend) {
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

// ------------------------------------------------------------- Phase 8: Handoff

phase('Handoff')

const handoff = await agent(
  `Hand off **${brief.storyId}**. The gate is green${brief.hasFrontend ? ' and the UI smoke-tested clean' : ''}.

## Update the sprint board — that is the whole job

In \`${moduleDir}/project/SPRINT_BOARD.md\`, move this row out of the **Backlog** table into the
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
  built: true,
  committed: false,
  boardUpdated: handoff?.boardUpdated ?? false,
  repairRounds: round,
  gate: gate.summary,
  summary: implement.summary,
  filesChanged: [...changedFiles],
  testFiles: [...red.testFiles, ...(coverage?.testFiles ?? [])],
  coverage: coverage?.summary ?? 'thresholds met without a coverage phase',
  unreachable: coverage?.unreachable ?? [],
  smoke: smoke ? { works: smoke.works, observations: smoke.observations, issues: smoke.issues } : null,
}
