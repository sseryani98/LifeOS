export const meta = {
  name: 'test-quality',
  description: 'Isolated-agent test quality review: gate, per-module reviewers, one reviewer-vs-adversary debate per module, auto-implement consensus',
  whenToUse:
    'After a build (review the tests that cover the changeset), or ad hoc against a module or "all". Twin of code-quality, pointed at test/ instead of srv/. Re-checks the judgment of build\'s test-author, which nothing else does. Invoked by /test-quality.',
  phases: [
    { title: 'Gate', detail: 'run the suite so reviewers read real coverage numbers, not guesses' },
    { title: 'Review', detail: 'isolated reviewers: one per module, plus integration/mocks and functional-coverage lenses' },
    { title: 'Debate', detail: 'one adversary per module challenges unproductive tests; reviewer rebuts; adversary closes', model: 'opus' },
    { title: 'Implement', detail: 'one test-author per module writes the consensus items' },
    { title: 'Verify', detail: 'gate reports, test-author repairs, gate confirms' },
  ],
}

const CATEGORIES = [
  'meaningfulness',
  'assertion-quality',
  'behavior-vs-framework',
  'edge-case',
  'flakiness',
  'fixture-safety',
  'missing-test',
  'integration',
  'mocking',
  'functional-coverage',
]

const GATE_SCHEMA = {
  type: 'object',
  properties: {
    passed: { type: 'boolean', description: 'True only if every check exited zero' },
    failures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          check: { type: 'string', enum: ['tsc', 'lint', 'test', 'cds-build'] },
          kind: { type: 'string', enum: ['mechanical', 'logic', 'coverage'] },
          detail: { type: 'string', description: 'Raw output including file:line. Quoted, not summarized, not diagnosed' },
        },
        required: ['check', 'kind', 'detail'],
        additionalProperties: false,
      },
    },
    coverageTable: {
      type: 'string',
      description: 'The per-file statements/branches coverage table from the jest run, verbatim. This is the payload — reviewers argue from these numbers.',
    },
    overall: { type: 'string', description: 'Overall statements/branches percentages as printed' },
  },
  required: ['passed', 'failures', 'coverageTable', 'overall'],
  additionalProperties: false,
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Repo-relative path of the spec that is wrong, or the spec that should hold the missing test' },
          line: { type: 'number', description: '1-indexed line the finding anchors to; the describe block line for a missing test' },
          category: { type: 'string', enum: CATEGORIES },
          summary: { type: 'string', description: 'One sentence stating the defect or gap' },
          argument: { type: 'string', description: 'Why this matters, argued from the code — name the regression that would ship undetected' },
          fix: { type: 'string', description: 'The smallest concrete change: the test to write, or the assertion to strengthen. Name the data/ constants it needs.' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['file', 'line', 'category', 'summary', 'argument', 'fix', 'severity'],
        additionalProperties: false,
      },
    },
  },
  required: ['findings'],
  additionalProperties: false,
}

// Batched per module: the adversary rules on every finding for one module in a single pass, so it
// reads that tree once and can see across findings. `duplicates` is what per-finding could not do.
const CHALLENGE_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The finding id exactly as given to you' },
          challenged: { type: 'boolean', description: 'True ONLY if unproductive on one of the five named grounds' },
          ground: { type: 'string', enum: ['framework-test', 'coverage-theatre', 'already-covered', 'wrong-tier', 'fixture-cost', 'none'] },
          argument: { type: 'string', description: 'The unproductiveness case, or why you have no objection' },
        },
        required: ['id', 'challenged', 'ground', 'argument'],
        additionalProperties: false,
      },
    },
    duplicates: {
      type: 'array',
      description: 'Findings that are the same gap said twice. You can see this because you hold them all at once — nobody else in this workflow can.',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The finding to fold away' },
          duplicateOf: { type: 'string', description: 'The finding id it duplicates — this one survives' },
          argument: { type: 'string', description: 'Why one test closes both gaps' },
        },
        required: ['id', 'duplicateOf', 'argument'],
        additionalProperties: false,
      },
    },
  },
  required: ['verdicts', 'duplicates'],
  additionalProperties: false,
}

const REBUTTAL_SCHEMA = {
  type: 'object',
  properties: {
    responses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The finding id exactly as given to you' },
          concedes: { type: 'boolean', description: 'True if the adversary is right and the finding should be dropped' },
          argument: { type: 'string', description: 'Your single response to this challenge' },
          revisedFix: { type: 'string', description: 'A smaller fix that answers the objection while still closing the gap, or empty if unchanged' },
        },
        required: ['id', 'concedes', 'argument', 'revisedFix'],
        additionalProperties: false,
      },
    },
  },
  required: ['responses'],
  additionalProperties: false,
}

const CLOSE_SCHEMA = {
  type: 'object',
  properties: {
    closes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The finding id exactly as given to you' },
          withdraws: { type: 'boolean', description: 'True if the rebuttal answered you. Restating your original challenge counts as withdrawing.' },
          argument: { type: 'string', description: 'If maintaining, the NEW argument that engages the rebuttal. Not a restatement.' },
        },
        required: ['id', 'withdraws', 'argument'],
        additionalProperties: false,
      },
    },
  },
  required: ['closes'],
  additionalProperties: false,
}

const IMPLEMENT_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The finding id this result answers' },
          status: { type: 'string', enum: ['implemented', 'deferred', 'sourceBug'] },
          what: { type: 'string', description: 'What you wrote; why you deferred; or the source bug the test caught, quoted' },
          filesTouched: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'status', 'what', 'filesTouched'],
        additionalProperties: false,
      },
    },
  },
  required: ['results'],
  additionalProperties: false,
}

const REPAIR_SCHEMA = {
  type: 'object',
  properties: {
    fixes: { type: 'array', items: { type: 'string', description: 'file — what you changed — why' } },
    sourceBugs: { type: 'array', items: { type: 'string', description: 'A test correctly caught a real bug in srv/. Quote the failure.' } },
    unfixed: { type: 'array', items: { type: 'string', description: 'What you could not fix, and why' } },
  },
  required: ['fixes', 'sourceBugs', 'unfixed'],
  additionalProperties: false,
}

// args should arrive as an object, but a stringified payload is an easy caller mistake and
// silently yields an empty scope — parse rather than review nothing.
const scope = (typeof args === 'string' ? JSON.parse(args) : args) ?? {}
const moduleDir = scope.moduleDir ?? 'Financial Planner'
const lenses = scope.lenses ?? []
const changedFiles = scope.changedFiles ?? []
const mode = scope.mode ?? 'adhoc'
const label = scope.label ?? 'target'

if (!lenses.length) {
  log('No lenses in scope — nothing to review.')
  return { consensus: [], contested: [], dropped: [], implemented: [], scope: label, note: 'empty scope' }
}

const standards = `## The rules you review against

\`${moduleDir}/CLAUDE.md:173-184\` holds the test rules in citable form. \`${moduleDir}/design/TEST_STRATEGY.md\` holds the rationale — §4 boundaries, §5 unit standards, §6 integration, §8 coverage. Sandro's standing corrections are \`feedback_*.md\` in C:\\\\Users\\\\sandr\\\\.claude\\\\projects\\\\c--Projects-Life-OS\\\\memory\\\\.

The load-bearing ones:

- **Unit:** no DB, mocked CDS. Validators mock nothing (\`req\` is a plain object with an \`error()\` spy), 100% coverage. Services: **the Validator is NOT mocked** — called through for free integration. Mock CDS queries, other Services, \`EncryptionUtility\`, \`DateTimeUtility\`. **Facades are not unit tested** — zero logic by design, ESLint-enforced.
- **Integration:** \`cds.test("serve","--with-mocks","--in-memory")\` + SQLite, **Chai \`expect\`, not Jest**. One file per CDS service. External APIs always mocked (SimpleFIN, cheerio, node-cron). Tests share seed data but must not depend on execution order.
- **Never test CAP CRUD/draft machinery or \`@readonly\` enforcement.** Framework behavior is banned outright (§4/§6). Annotation constraints (\`@assert.unique\`, \`@mandatory\`, \`@assert.range\`) ARE fair game as contract documentation.
- **Coverage targets:** Validators/Utilities 100/100, Services (incl. ENH engines) 90/85, Overall 85/80. Facades excluded.
- A \`*.test.ts\` is imports + AAA. Payloads/UUIDs are named UPPER_SNAKE constants from \`data/\`. Assertions may hold inline expected values. No CQL in specs — it lives in \`support/\` helpers.`

const diffFocus =
  mode === 'diff' && changedFiles.length
    ? `\n## This is a post-build review\n\nThe build changed these files:\n\n${changedFiles.join('\n')}\n\n**Judge the tests that cover this changeset.** A gap unrelated to what moved is real but is not what this run is for, and reporting it buries the gaps that are. Ask: does the changed behavior have a test that would fail if the change were wrong?\n\nThese tests were likely written by the build workflow's \`test-author\` from the spec's business rules. **Nothing else re-checks its judgment — you are the only thing that does.** It wrote tests the implementer then made pass; if it aimed at the wrong behavior, every phase after it agreed.\n`
    : ''

// The full suite runs all ~266 tests + whole-project coverage. For a single-module or diff run,
// that is 200+ wasted seconds — the reviewers only read their own module's rows. Scope jest to the
// lenses under review, and clear the config threshold so unrun modules don't emit phantom
// "coverage not met" failures (the gate agent flags real shortfalls from the table, not the exit
// code). `all` runs every module, so scope is empty and it falls back to plain `npm test`.
const ALL_MODULES = ['admin', 'categorization', 'ingestion', 'shared', 'transaction']

const jestCommandFor = names => {
  const modules = [...new Set(names)].filter(name => ALL_MODULES.includes(name))
  const isFull = ALL_MODULES.every(module => modules.includes(module)) || !modules.length
  // jest 29: --testPathPattern is singular. --coverageThreshold="{}" clears the config gate so unrun
  // modules do not emit phantom "threshold not met" failures.
  return isFull ? 'npm test' : `npx jest --coverage --coverageThreshold="{}" --testPathPattern="(${modules.join('|')})"`
}

const gateTestCommand = jestCommandFor(lenses.map(lens => lens.name))
const gateIsScoped = gateTestCommand !== 'npm test'

// ---------------------------------------------------------------- Phase 1: Gate

phase('Gate')

const gateResult = await agent(
  `Run the checks for \`${moduleDir}\` and report what happened, **plus the coverage table**.

## Run these

\`\`\`
cd "${moduleDir}" && npx tsc --noEmit
cd "${moduleDir}" && npm run lint
cd "${moduleDir}" && ${gateTestCommand}
\`\`\`

Run all three even if an early one fails — one failure must not mask the others.

**\`tsc --noEmit\` is the ONLY authority on type errors.** ${gateIsScoped ? 'The test command below runs a scoped subset through ts-jest, whose per-file diagnostics can disagree with a full compile (it may flag a method as missing that exists, or miss a real error). Take every \`mechanical\`/type failure from `tsc`, never from the jest output — a TS line printed by jest is noise unless \`tsc\` also reports it.' : 'Report type errors from its output.'}

\`npm run lint\` is ESLint plus 21 \`lint:*\` scripts chained with \`&&\`, so it halts at the first failing linter. Expected. Report what you got.

${
  gateIsScoped
    ? `The test command is **scoped to the modules under review** (\`${gateTestCommand}\`) — it runs only their tests, not the full ~266, and clears the coverage threshold so unrun modules do not raise phantom failures. The coverage table it prints therefore covers the target modules and whatever they exercise; that is the scope you are reviewing, so it is complete for this run. Report a \`coverage\` failure only by reading a target file's numbers against the targets below — jest will not exit non-zero on coverage here.`
    : '\`npm test\` has \`--coverage\` baked in and a \`posttest\` generator that writes markdown under \`project/test-reports/\`. If the console table is truncated, read the newest report there.'
}

## The coverage table is the payload

This workflow's reviewers argue about what is untested. **They need real numbers, or they guess.** Put the per-file statements/branches table in \`coverageTable\` **verbatim** — every file under \`srv/\`, numbers exact, including the uncovered-line column. Do not summarize it, do not round, do not drop rows you think are boring. A file at 0% is the most interesting row on the table and the easiest to omit by accident.

No test file hashing on this run — you were given no test list, so skip that step.

## Classify each failure

- \`mechanical\` — a rule was broken and the message says how: any \`lint:*\` violation, an ESLint rule, a \`tsc\` type error.
- \`logic\` — a failing Jest assertion: expected X, received Y.
- \`coverage\` — Jest's \`"coverage threshold ... not met"\`.

Put the **raw output** in \`detail\`, with \`file:line\`. Do not diagnose, do not suggest a fix.`,
  { label: 'gate', phase: 'Gate', model: 'haiku', effort: 'low', agentType: 'gate-runner', schema: GATE_SCHEMA },
)

const gate = `## Machine-checked already — do NOT re-report any of this

${
  gateResult
    ? gateResult.passed
      ? 'The suite passed clean: tsc, lint and test are all green.'
      : `The suite is not clean. Failures:\n\n${gateResult.failures.map(failure => `- **${failure.check}** (${failure.kind}): ${failure.detail}`).join('\n')}`
    : 'The gate could not be run; rely on your own judgment but stay off mechanical rules and do not invent coverage numbers.'
}

\`lint:test-data\` (inline literals + missing JSDoc), \`lint:test-structure\` (data/support/tests roles), \`lint:test-cql\` (CQL in specs), \`lint:comment-length\` and \`lint:tracking-ids\` run on every commit. **Do not spend a finding on anything they cover.** "Add a JSDoc to this test" is not a finding — it is a lint failure, and reporting it costs Sandro a row to learn what CI already told him.

Your value is the judgment layer no script reaches: does this test assert something that could actually fail, is it testing behavior or the framework, which edge case is missing.

## Coverage — real numbers. Argue from these, never guess.

Overall: ${gateResult?.overall ?? '(unavailable)'}

${gateResult?.coverageTable ?? '(no coverage table — say so in any finding that depends on coverage rather than inventing a number)'}`

// -------------------------------------------------------------- Phase 2: Review

phase('Review')

const reviewers = []

for (const lens of lenses) {
  const testFiles = (lens.testFiles ?? []).join('\n') || '(none — this module has no tests yet)'
  const sourceFiles = (lens.sourceFiles ?? []).join('\n') || '(none resolved)'

  reviewers.push(() =>
    agent(
      `You are the **test reviewer** for the \`${lens.name}\` module. You are the only agent looking at it — nobody else will catch what you miss.

## Your scope — read these and nothing else

Tests:
${testFiles}

The source they cover:
${sourceFiles}

${diffFocus}
${gate}

${standards}

## Six questions. Report a finding only where the answer is genuinely bad.

1. **Are the tests meaningful?** Do not answer this in the abstract. For each test, answer the concrete form: **name a change I could make to the source that this test would not catch.** If you can name an obvious one — flip a comparison, drop a branch, return the input unchanged — the test is not protecting the behavior it claims to. The classic failure: a test that asserts the mock returned what the mock was told to return. That passes forever and protects nothing. If you cannot name any surviving mutation, the test is good — say nothing.

2. **Are the assertions any good?** Three distinct failure modes, all worth a finding:
   - **Weak** — \`expect(result).toBeTruthy()\`, \`expect(fn).not.toThrow()\`, asserting a call happened but not with what. Passes for the wrong reasons.
   - **Brittle** — \`toEqual\` on a whole object including \`createdAt\`/\`ID\`/computed fields, so an unrelated change reddens it. **Brittle tests get deleted, not fixed** — that is why this matters.
   - **Undiagnosable** — fails with "expected true, received false" and tells you nothing. The house standard is the opposite: \`expect(errors[0].messageKey).toBe("transaction.split.enterOneInput")\` names the defect in the failure message. Read \`test/unit/transaction/tests/transactionValidator.test.ts\` for the bar.

3. **Do they test behavior, not the framework?** TEST_STRATEGY §4/§6 bans testing CAP CRUD/draft machinery and \`@readonly\` — if you find one, the finding is to **delete** it, not strengthen it. Annotation constraints (\`@assert.unique\`, \`@mandatory\`, \`@assert.range\`) are the deliberate exception: those ARE tested, as contract documentation. Know the difference before reporting.

4. **Are the edge cases covered?** Read the **source**, not the tests, to find them — the tests cannot tell you what they forgot. Boundaries (zero, negative, empty array, single element), the error paths, the branches the coverage table above says are cold.

5. **Will these tests still pass next Tuesday?** Flakiness is a slow poison: it trains the reader to re-run rather than believe. Flag a spec that depends on **the real clock** (\`new Date()\`, \`Date.now()\`, real timers — \`DateTimeUtility\` exists to be mocked for exactly this reason, and this module may touch scheduling or \`node-cron\`), **real randomness**, **the network** (every external API is mocked — SimpleFIN, cheerio — so a test reaching out is a finding whether or not it passes today), or **execution order** (§6.3 — tests share seed data but must not depend on position; a test that only passes in place is a latent flake).

6. **Is anything in \`data/\` unsafe?** Scan the module's fixtures. **No real card numbers, account numbers, or PII** — TEST_STRATEGY says semantic names only, and the real seed data is gitignored precisely because this repo holds live card data. A real PAN in a committed fixture is a **git leak, not a test smell**: report it \`high\`, always. UUIDs should be semantic placeholders (\`ca5e0001-…\`), never real values.

Then: **what test cases would you recommend?** Concrete ones. Name the \`data/\` constants each needs and whether it extends an existing spec or needs a new one. "More coverage" is not a recommendation.

## Report honestly

Cite a real \`file:line\` — read the file, never infer a location. State the argument, not the label: name **the regression that would ship undetected**, not "insufficient coverage". One concrete fix each, the smallest that closes the gap.

**Zero findings is a valid, respectable result.** A short list you are sure of beats a long list you are not. Every finding you invent costs an adversary's time and may get written into a suite that runs forever.`,
      { label: `review:${lens.name}`, phase: 'Review', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
    ),
  )
}

reviewers.push(() =>
  agent(
    `You are the **integration and mocking reviewer**, working holistically across the whole target (${label}). The per-module reviewers each see one tree; you see the seams between them.

Integration tests live under \`${moduleDir}/test/integration/{module}/\`. Unit mocks live in \`${moduleDir}/test/unit/{module}/support/*Mocks.ts\`. Read across all of them. Use Grep aggressively — that is your role.

${diffFocus}
${gate}

${standards}

## Two questions

1. **Are the integrations tested well?** One file per CDS service is the rule. Per TEST_STRATEGY §6.2 an integration test should cover the custom actions, the query options that matter (\`$filter\`/\`$expand\`), the error responses (400/404/409), and **sensitive-field exclusion — a \`GET\` list must never return \`_enc\` fields**. That last one is a security property; if no test asserts it, that is a \`high\` finding. Also §6.3: tests share seed data but must not depend on execution order.

2. **Are mocks and stubs used correctly?** The policy is specific and easy to get backwards:
   - Service tests **do not mock the Validator** — it is called through on purpose, for free integration coverage. **A mocked Validator in a Service test is a finding**, and a common one.
   - Mock: CDS queries, other Services, \`EncryptionUtility\`, \`DateTimeUtility\`.
   - Validator tests mock **nothing** — \`req\` is a plain object with an \`error()\` spy.
   - External APIs are **always** mocked (SimpleFIN, cheerio, node-cron). A test reaching the network is a finding regardless of whether it passes today.
   - **Over-mocking is the quieter failure**: a test where every collaborator is a stub asserts only that you wired your own stubs together. It is indistinguishable from a passing test and it protects nothing. Name those.
   - A mock that has **drifted from the real collaborator's signature** is the worst case — the test passes, the production call fails. Check the \`buildXxxMocks\` builders against the real classes.

Read the mock builders before judging their callers. Use category \`integration\` or \`mocking\`.`,
    { label: 'holistic:integration-and-mocks', phase: 'Review', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
  ),
)

reviewers.push(() =>
  agent(
    `You are the **functional coverage reviewer**, working holistically across the whole target (${label}). You answer one question: **are the core functional unit tests covered?**

This is a spec-to-test mapping job, and you are the only agent doing it.

## Method

1. Read the functional specs — **but only for the modules under review this run: ${lenses.map(lens => lens.name).join(', ')}.** Glob \`${moduleDir}/design/specs/SPEC-*.md\` and read the ones whose subject is a module in that list; skip the rest. Reading every spec on a single-module run is wasted effort — the gaps you would find in an unreviewed module are not this run's job and will bury the ones that are. Open another module's spec only if a rule you are tracing for an in-scope module explicitly reaches into it. **§5 of each spec holds the business rules**; the specs also enumerate functional unit tests (FUTs). Those are the contract.
2. Map each rule and FUT to the test that protects it. Grep the test tree for the **behavior**, not the ID.
3. Report the ones with **no test**, ranked by what breaks if the rule silently stops holding.

## Known gaps — confirm before reporting, they may have moved

- \`${moduleDir}/test/integration/scenarios/\` is an empty \`.gitkeep\`. TEST_STRATEGY §6.4 names four planned scenarios: **WFL-001 weekly review, WFL-004 card onboarding, FRM-003 CSV import, WFL-002 card lifecycle**. None are built. Multi-step FUT scenarios nest there — not a new top-level folder.
- \`${moduleDir}/test/shared/data/factories.ts\` is 8 lines. TEST_STRATEGY documents "hybrid factories + named constants"; in practice it is nearly all named constants. Report this only if a *specific* missing test needs a factory — "adopt factories" is a refactor, not a coverage gap.

${gate}

${standards}

## Constraints

**Never write a FRICEW ID into a test file** — \`lint:tracking-ids\` bans them from \`test/\`; they belong in design docs and commit bodies. Cite the ID in your *finding*; the fix must name the behavior instead.

Rank by consequence. An untested business rule that **silently produces wrong money** is high — this is a financial planner, and a rule that fails loudly is far cheaper than one that quietly miscategorises. An untested rule whose breakage is immediate and obvious is not high.

The four unbuilt scenarios are a known, deliberate backlog: one finding each is honest; "no functional tests exist" as a single finding is not useful. If the specs are thin or absent for a module, **say so plainly rather than inventing rules to test against** — a test traced to a rule you made up is worse than the gap.

Use category \`functional-coverage\`.`,
    { label: 'holistic:functional-coverage', phase: 'Review', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
  ),
)

// Barrier: the holistic lenses independently surface what a module reviewer found, and debating one
// gap twice costs two adversaries and can write the same test twice. Dedup needs every lens in.
const reviewResults = await parallel(reviewers)

const merged = new Map()
for (const result of reviewResults.filter(Boolean)) {
  for (const finding of result.findings ?? []) {
    const key = `${finding.file}:${finding.line}:${finding.category}`
    const seen = merged.get(key)
    if (!seen) {
      merged.set(key, { ...finding, foundBy: 1 })
      continue
    }
    // Two lenses agreeing is signal. Keep the longer argument, raise severity to the higher.
    seen.foundBy += 1
    if (finding.argument.length > seen.argument.length) seen.argument = finding.argument
    const rank = { low: 0, medium: 1, high: 2 }
    if (rank[finding.severity] > rank[seen.severity]) seen.severity = finding.severity
  }
}

const findings = [...merged.values()].map((finding, index) => ({ ...finding, id: `F${index + 1}` }))
const proposed = reviewResults.filter(Boolean).reduce((sum, result) => sum + (result.findings?.length ?? 0), 0)
const duplicatesCollapsed = proposed - findings.length

// One grouping, used twice: it decides which adversary rules on a finding and which author writes
// it. Both need the same answer — the module that owns the file.
//
// A finding may anchor to source rather than a spec, and legitimately so: "this branch is
// uncovered" cites `srv/`, because the test that would cover it does not exist yet. Matching only
// test paths would dump every one of those into `shared` — wrong adversary, wrong author, and the
// sequential bucket swallowing work that should run in parallel.
const OWNER_PATTERNS = [
  /test[/\\](?:unit|integration)[/\\]([^/\\]+)[/\\]/, // test/unit/transaction/...
  /srv[/\\]modules[/\\]([^/\\]+)[/\\]/, //               srv/modules/transaction/...
  /srv[/\\]([^/\\]+)-service\.(?:ts|cds)$/, //           srv/admin-service.ts — the non-1:1 lens
]

const ownerOf = finding => {
  for (const pattern of OWNER_PATTERNS) {
    const owner = pattern.exec(finding.file)?.[1]
    if (owner && owner !== 'scenarios' && lenses.some(lens => lens.name === owner)) return owner
  }
  return 'shared'
}

const groupBy = items => {
  const groups = new Map()
  for (const item of items) {
    const owner = ownerOf(item.finding ?? item)
    if (!groups.has(owner)) groups.set(owner, [])
    groups.get(owner).push(item)
  }
  return groups
}

log(`${findings.length} distinct findings after dedup (${duplicatesCollapsed} collapsed). Entering debate.`)

if (!findings.length) {
  return {
    scope: label,
    gate: gateResult,
    consensus: [],
    contested: [],
    dropped: [],
    implemented: [],
    counts: { proposed, deduped: duplicatesCollapsed, consensus: 0, contested: 0, dropped: 0 },
    note: 'Reviewers found no test-quality gaps.',
  }
}

// -------------------------------------------------------------- Phase 3: Debate

phase('Debate')

const renderFindings = items =>
  items
    .map(
      finding =>
        `### ${finding.id} — ${finding.file}:${finding.line} (${finding.category}, claimed ${finding.severity}${finding.foundBy > 1 ? `, found independently by ${finding.foundBy} reviewers` : ''})\n\n**Gap:** ${finding.summary}\n\n**Reviewer's argument:** ${finding.argument}\n\n**Proposed fix:** ${finding.fix}`,
    )
    .join('\n\n')

// One adversary per module, not per finding: it reads the tree once, and holding every finding at
// once is what lets it see that two of them are the same gap.
const debated = await pipeline(
  [...groupBy(findings).entries()],

  ([owner, items]) =>
    agent(
      `You are the **adversary** for the \`${owner}\` module. Reviewers want to add or change ${items.length} test(s). Your job is to stop the ones that are not worth having.

A bad test is not free. It runs forever, it is maintained forever, and it fails for reasons unrelated to the bug it was meant to catch. A suite full of tests nobody trusts is worse than a smaller suite that is believed.

## The findings

${renderFindings(items)}

## Rule on every one — and look across them

You hold all ${items.length} at once, which no other agent in this workflow does. Use that:

- **Rule on each** in \`verdicts\`. Every id gets exactly one verdict.
- **Fold duplicates** in \`duplicates\`. Two reviewers describing the same gap from different angles is common, and one test closes both. Nobody else can see this — the reviewers each saw one lens, and the authors will each write one finding. If you miss a duplicate here, the same test gets written twice.

## Challenge on exactly these five grounds, and no others

Read the actual test and the source it covers first. Name the ground in \`ground\`:

1. \`framework-test\` — it tests CAP CRUD/draft machinery or \`@readonly\`. TEST_STRATEGY §4/§6 bans this outright, so this ground is decisive. **But check the exception:** annotation constraints (\`@assert.unique\`, \`@mandatory\`, \`@assert.range\`) are tested deliberately as contract documentation. That is not a framework test.
2. \`coverage-theatre\` — the test cannot fail for a real reason. It asserts a mock returned what the mock was told to return, or restates the implementation. It moves a number and protects nothing.
3. \`already-covered\` — an existing test already fails when this breaks. **Grep and name it.** "Probably covered somewhere" is not a challenge.
4. \`wrong-tier\` — an integration test for logic that is pure (belongs in unit), or a unit test for wiring only integration can prove. The fix here is usually to **move** it, not drop it — say so.
5. \`fixture-cost\` — the fixture apparatus is disproportionate to the risk retired. A new seed harness and three \`data/\` files to prove a getter returns a field.

## What is NOT yours to challenge

- **Whether the gap is real** — the reviewer's call.
- **Whether it is worth the effort** — Sandro's call.
- **Whether you would have written it differently** — irrelevant.

"This is minor" is not a challenge. Return \`challenged: false, ground: "none"\`.

## Default to not challenging

**Anything you do not challenge is written to disk automatically.** That cuts both ways: do not rubber-stamp, but do not challenge what you cannot argue. Most findings are fine. A finding found by more than one reviewer is not proven, but it should raise your bar.

${gate}

${standards}`,
      { label: `adversary:${owner}`, phase: 'Debate', agentType: 'quality-reviewer', schema: CHALLENGE_SCHEMA },
    ).then(challenge => ({ owner, items, challenge })),

  async ({ owner, items, challenge }) => {
    // Batching made silence dangerous. Per finding, a dead adversary cost one finding; per module
    // it would auto-write every finding nobody ruled on. Unreviewed goes to Sandro, never to disk.
    if (!challenge) return items.map(finding => ({ finding, verdict: 'contested', ground: 'none', adversary: '(adversary failed — nothing reviewed this module, so nothing was auto-written)', rebuttal: '' }))

    const verdictOf = new Map((challenge.verdicts ?? []).map(verdict => [verdict.id, verdict]))

    // Only fold into a survivor. A→B and B→A would otherwise fold both and write neither.
    const foldedInto = new Map(
      (challenge.duplicates ?? [])
        .filter(dupe => dupe.id !== dupe.duplicateOf)
        .filter((dupe, _index, all) => !all.some(other => other.id === dupe.duplicateOf))
        .map(dupe => [dupe.id, dupe]),
    )

    const folded = items
      .filter(finding => foldedInto.has(finding.id))
      .map(finding => ({ finding, verdict: 'folded', adversary: foldedInto.get(finding.id).argument, duplicateOf: foldedInto.get(finding.id).duplicateOf }))

    const live = items.filter(finding => !foldedInto.has(finding.id))

    // An omitted id is not an endorsement. Consensus requires an actual verdict.
    const unruled = live
      .filter(finding => !verdictOf.has(finding.id))
      .map(finding => ({ finding, verdict: 'contested', ground: 'none', adversary: '(adversary returned no verdict on this finding — not auto-written)', rebuttal: '' }))

    const ruled = live.filter(finding => verdictOf.has(finding.id))
    const contestedItems = ruled.filter(finding => verdictOf.get(finding.id).challenged)
    const unchallenged = ruled
      .filter(finding => !verdictOf.get(finding.id).challenged)
      .map(finding => ({ finding, verdict: 'consensus', adversary: verdictOf.get(finding.id).argument }))

    if (!contestedItems.length) return [...unchallenged, ...folded, ...unruled]

    const rebuttal = await agent(
      `You are the **reviewer** for the \`${owner}\` module. The adversary challenged ${contestedItems.length} of your findings as unproductive. You get **one response each** — this is your only reply, so make it count.

## The challenges

${contestedItems
  .map(finding => {
    const verdict = verdictOf.get(finding.id)
    return `### ${finding.id} — ${finding.file}:${finding.line}\n\n**Your gap:** ${finding.summary}\n\n**Your argument:** ${finding.argument}\n\n**Your proposed fix:** ${finding.fix}\n\n**Adversary's ground:** ${verdict.ground}\n\n**Adversary says:** ${verdict.argument}`
  })
  .join('\n\n')}

## Respond to each

Read the code again before answering — the adversary may be right, and you are not obliged to defend your own findings.

- If the adversary is **right**, return \`concedes: true\`. The finding is dropped. **Conceding a bad finding is a win** — it keeps a worthless test out of a suite that has to run forever. Especially on \`framework-test\` and \`already-covered\`: if they grepped and named the existing test, concede.
- If the adversary is **wrong**, \`concedes: false\` plus your single strongest case. Address their **specific ground**. Cite the code. Name the regression that ships if this test is not written.
- If a **smaller fix** answers the objection while still closing the gap, put it in \`revisedFix\`. A test that survives review beats a test that is rejected — this is the right move against \`fixture-cost\` and \`wrong-tier\`.

Do not repeat your original argument verbatim. The adversary read it. Add something.

${standards}`,
      { label: `rebuttal:${owner}`, phase: 'Debate', agentType: 'quality-reviewer', schema: REBUTTAL_SCHEMA },
    )

    if (!rebuttal) {
      return [...unchallenged, ...folded, ...unruled, ...contestedItems.map(finding => ({ finding, verdict: 'contested', ground: verdictOf.get(finding.id).ground, adversary: verdictOf.get(finding.id).argument, rebuttal: '(reviewer failed to respond)' }))]
    }

    const responseOf = new Map((rebuttal.responses ?? []).map(response => [response.id, response]))
    const conceded = contestedItems
      .filter(finding => responseOf.get(finding.id)?.concedes)
      .map(finding => ({ finding, verdict: 'dropped', ground: verdictOf.get(finding.id).ground, adversary: verdictOf.get(finding.id).argument, rebuttal: responseOf.get(finding.id).argument }))

    const held = contestedItems
      .filter(finding => responseOf.has(finding.id) && !responseOf.get(finding.id).concedes)
      .map(finding => {
        const response = responseOf.get(finding.id)
        return response.revisedFix ? { ...finding, fix: response.revisedFix, revised: true } : finding
      })

    // A challenged finding whose rebuttal never arrived cannot be auto-written on silence.
    const unanswered = contestedItems
      .filter(finding => !responseOf.has(finding.id))
      .map(finding => ({ finding, verdict: 'contested', ground: verdictOf.get(finding.id).ground, adversary: verdictOf.get(finding.id).argument, rebuttal: '(no response returned)' }))

    if (!held.length) return [...unchallenged, ...folded, ...unruled, ...conceded, ...unanswered]

    const close = await agent(
      `You are the **adversary** for the \`${owner}\` module. You challenged these findings; the reviewer has answered. You get **one close each** — then the matter is settled.

## The exchanges

${held
  .map(finding => {
    const verdict = verdictOf.get(finding.id)
    const response = responseOf.get(finding.id)
    return `### ${finding.id} — ${finding.file}:${finding.line}\n\n**Gap:** ${finding.summary}\n\n**Fix now proposed:** ${finding.fix}${finding.revised ? '  ← revised in response to you' : ''}\n\n**Your challenge (${verdict.ground}):** ${verdict.argument}\n\n**Reviewer's response:** ${response.argument}`
  })
  .join('\n\n')}

## Decide each

- **\`withdraws: true\`** — the rebuttal answered you, or the revised fix resolves your objection. The finding gets implemented. **Withdrawing is the normal outcome of a good rebuttal, not a loss.**
- **\`withdraws: false\`** — you maintain. Then you **must give a NEW argument that engages what the reviewer actually said.** Restating your challenge in different words is not maintaining — it is withdrawing, and it will be scored as a withdrawal. If you cannot say something new, withdraw.

## Know the stakes — they are asymmetric

Maintaining does **not** drop the finding. It goes to Sandro as **contested**, and he rules. So maintaining is cheap for you and costs him a row of reading. **Do not maintain to win.** Maintain only where you genuinely believe writing this test makes the suite worse and a human should look.

${standards}`,
      { label: `close:${owner}`, phase: 'Debate', agentType: 'quality-reviewer', schema: CLOSE_SCHEMA },
    )

    const closeOf = new Map((close?.closes ?? []).map(item => [item.id, item]))
    const settled = held.map(finding => {
      const verdict = verdictOf.get(finding.id)
      const response = responseOf.get(finding.id)
      const closed = closeOf.get(finding.id)
      if (closed?.withdraws) {
        return { finding, verdict: 'consensus', ground: verdict.ground, adversary: `Challenged (${verdict.ground}), withdrew: ${closed.argument}`, rebuttal: response.argument }
      }
      return {
        finding,
        verdict: 'contested',
        ground: verdict.ground,
        adversary: closed ? `${verdict.argument}\n\nMaintained: ${closed.argument}` : verdict.argument,
        rebuttal: response.argument,
      }
    })

    return [...unchallenged, ...folded, ...unruled, ...conceded, ...unanswered, ...settled]
  },
)

const settled = debated.filter(Boolean).flat()
const rank = { high: 0, medium: 1, low: 2 }
const bySeverity = (left, right) => rank[left.finding.severity] - rank[right.finding.severity] || right.finding.foundBy - left.finding.foundBy

const consensus = settled.filter(item => item.verdict === 'consensus').sort(bySeverity)
const contested = settled.filter(item => item.verdict === 'contested').sort(bySeverity)
const dropped = settled.filter(item => item.verdict === 'dropped')
const folded = settled.filter(item => item.verdict === 'folded')

log(`${consensus.length} consensus · ${contested.length} contested · ${dropped.length} dropped · ${folded.length} folded as duplicates.`)

const report = {
  scope: label,
  gate: gateResult,
  counts: { proposed, deduped: duplicatesCollapsed, folded: folded.length, consensus: consensus.length, contested: contested.length, dropped: dropped.length },
  contested: contested.map(item => ({ ...item.finding, ground: item.ground, adversary: item.adversary, rebuttal: item.rebuttal })),
  dropped: dropped.map(item => ({ file: item.finding.file, line: item.finding.line, summary: item.finding.summary, ground: item.ground, why: item.adversary })),
  folded: folded.map(item => ({ id: item.finding.id, duplicateOf: item.duplicateOf, summary: item.finding.summary, why: item.adversary })),
}

if (!consensus.length) {
  return { ...report, consensus: [], implemented: [], verification: null, note: 'Nothing reached consensus — nothing was written.' }
}

// ----------------------------------------------------------- Phase 4: Implement

phase('Implement')

const buckets = groupBy(consensus)

const implementPrompt = (owner, items) =>
  `You are writing tests for the \`${owner}\` module in the **test-quality** workflow — not the build workflow.

**Your usual rule does not apply here.** You normally write from a brief's business rules and FUTs, and refuse anything you cannot trace to a BR-nn or FUT-nnn. There is no brief on this run. **Each finding below IS your justification** — it was proposed by a reviewer and survived an adversary who tried to kill it as unproductive. The argument is over. Write them.

If an item turns out to be wrong once you read the code, return it \`deferred\` with the reason — do not relitigate it, and do not write a test you do not believe in.

## Your write scope — a hard boundary

${
  owner === 'shared'
    ? `You own \`${moduleDir}/test/shared/**\` and any test path the module authors could not claim. You are running **alone** — every module author has already finished, so nothing is racing you.`
    : `You may write **only** under:
- \`${moduleDir}/test/unit/${owner}/**\`
- \`${moduleDir}/test/integration/${owner}/**\`

Other authors are writing other modules **right now**. A write outside those two trees races them and corrupts a file neither of you can see the other editing. If an item needs \`${moduleDir}/test/shared/**\`, return it \`deferred\` — a later sequential stage owns that path.`
}

**Never edit \`srv/\`** — you have no mandate to, and this workflow exists to judge the tests, not change the code. If a test fails because **the source is wrong**, that is the most valuable thing this run can produce: return it \`sourceBug\` with the failure quoted, and leave both the test and the source alone. Greening your own test by editing the code under test destroys the only signal it was worth writing.

## The items

${items.map(item => item.finding).map(finding => `### ${finding.id} — ${finding.file}:${finding.line} (${finding.category})${finding.revised ? ' — fix revised during debate' : ''}\n\n**Gap:** ${finding.summary}\n\n**Why it matters:** ${finding.argument}\n\n**Write this:** ${finding.fix}`).join('\n\n')}

${gate}

${standards}

## Before you write

**Read a neighbouring spec and its \`data/\` file first.** \`test/unit/transaction/tests/transactionValidator.test.ts\` and \`data/splits.ts\` are the house pattern — 23 named imports, zero inline literals, a one-line why-JSDoc over every \`it\`. Match the files you are extending, not this description of them.

Prefer extending over creating: a new constant beside the existing ones beats a new file; a new \`it\` in the right \`describe\` beats a new spec. **Reuse the canonical constant when one exists** — re-declaring it is itself a \`lint:test-data\` violation.

## Batch your verification — do not run the suite between findings

Write **all** the tests first, then run the suite **once** at the end to confirm they compile, pass, and lint clean. **Do not re-run after each finding** — a full run per finding is the single most expensive habit here, and it buys nothing a final run does not. Reserve a re-run for a specific test your one check flagged. A dedicated **Verify phase runs the whole gate again after you**, independently — so you do not need to prove green exhaustively; you need to write correct tests and sanity-check them once. For a sourceBug, confirm the test fails for the reason you claim, then stop — it is *meant* to stay red.

Report each item as \`implemented\`, \`deferred\`, or \`sourceBug\`. **Deferred is respectable.** Do not invent a passing test to close a row — a test that cannot fail is worse than the gap it replaced, and it will outlive both of us in the suite.`

log(`Implementing ${consensus.length} consensus items across ${buckets.size} bucket(s): ${[...buckets.keys()].join(', ')}.`)

const moduleBuckets = [...buckets.entries()].filter(([owner]) => owner !== 'shared')

// Barrier: the shared bucket owns paths a module author might otherwise collide with, so it must
// not start until every module author has put its tools down.
const moduleResults = await parallel(
  moduleBuckets.map(([owner, items]) => () => agent(implementPrompt(owner, items), { label: `author:${owner}`, phase: 'Implement', agentType: 'test-author', schema: IMPLEMENT_SCHEMA })),
)

const sharedItems = buckets.get('shared')
const sharedResult = sharedItems ? await agent(implementPrompt('shared', sharedItems), { label: 'author:shared', phase: 'Implement', agentType: 'test-author', schema: IMPLEMENT_SCHEMA }) : null

const implemented = [...moduleResults, sharedResult].filter(Boolean).flatMap(result => result.results ?? [])
const wrote = implemented.filter(item => item.status === 'implemented')
const deferred = implemented.filter(item => item.status === 'deferred')
const authorSourceBugs = implemented.filter(item => item.status === 'sourceBug')
log(`${wrote.length} written · ${deferred.length} deferred · ${authorSourceBugs.length} source bug(s) found. Verifying.`)

// -------------------------------------------------------------- Phase 5: Verify

phase('Verify')

// Verify only what changed. A module author touches one tree, so its writes can only break its own
// tests — scope the confirm run to the buckets that were written. The shared bucket is the
// exception: it edits cross-module fixtures, so any shared write forces a full run.
const writtenBuckets = [...buckets.keys()]
const verifyTestCommand = writtenBuckets.includes('shared') ? 'npm test' : jestCommandFor(writtenBuckets)

const verifyPrompt = `Run the checks for \`${moduleDir}\` after new tests were just written into it.

\`\`\`
cd "${moduleDir}" && npx tsc --noEmit
cd "${moduleDir}" && npm run lint
cd "${moduleDir}" && ${verifyTestCommand}
\`\`\`

Run all three even if an early one fails. Report the coverage table verbatim in \`coverageTable\` as before. No hashing on this run.

**\`tsc --noEmit\` is the only authority on type errors** — ${verifyTestCommand === 'npm test' ? 'report them from its output.' : "the scoped ts-jest run's per-file type diagnostics can disagree with a full compile, so take type/`mechanical` failures from `tsc`, not from jest's printed TS lines."} A pre-existing \`tsc\` error in a file no author touched is not this run's doing — check it against the baseline below before calling it a new failure.

Classify each failure: \`mechanical\` (a lint/ESLint/tsc rule — the message says the fix), \`logic\` (a failing Jest assertion), \`coverage\` (threshold not met). Put the **raw output** in \`detail\`. Do not diagnose and do not suggest fixes — the agent reading this needs the real text.`

const postGate = await agent(verifyPrompt, { label: 'verify:gate', phase: 'Verify', model: 'haiku', effort: 'low', agentType: 'gate-runner', schema: GATE_SCHEMA })

let repair = null
let finalGate = postGate

// The gate reports and the author repairs — never the same agent. An agent that grades its own
// repair work has every incentive to call a red tree green, and Sandro merges on that word.
if (postGate && !postGate.passed) {
  repair = await agent(
    `New tests were just written into \`${moduleDir}\` and the suite is not clean. Repair it.

## What the gate found

${postGate.failures.map(failure => `- **${failure.check}** (${failure.kind}): ${failure.detail}`).join('\n')}

## What was just written

${wrote.map(item => `- ${item.id}: ${item.what}\n  ${(item.filesTouched ?? []).join(', ')}`).join('\n') || '(nothing reported — check `git status`)'}

## Fix within these limits

**\`mechanical\` failures are yours.** Expect them: freshly written tests trip \`lint:test-data\` (an inline literal, a missing why-JSDoc) more often than not. Move the literal into the module's \`data/\` folder as a named UPPER_SNAKE constant; add the one-line JSDoc stating the rule it protects; move CQL into a \`support/\` helper.

**\`logic\` failures need a decision before you touch anything:**
- The **test is wrong** — it asserts the wrong thing, or the fixture is off. Fix the test.
- The **source is wrong** — the test correctly caught a real bug. **Do not fix the source. Do not weaken the test to make it pass.** Report it in \`sourceBugs\` with the failure quoted. That test is the most valuable thing this entire workflow produced, and deleting it to get a green run is the worst available outcome here.

**Never touch a pre-existing failure.** Compare against the baseline below — if a test was already failing before this run, it is not yours. Say so in \`unfixed\`.

**Never edit \`srv/\`.**

## The baseline, from before any tests were written

${gateResult ? (gateResult.passed ? 'The suite was clean before this run — every failure above is new and is yours.' : `The suite was ALREADY not clean:\n\n${gateResult.failures.map(failure => `- **${failure.check}** (${failure.kind}): ${failure.detail}`).join('\n')}`) : '(no baseline — the pre-run gate failed. Be conservative about claiming a failure is new.)'}

${standards}`,
    { label: 'verify:repair', phase: 'Verify', agentType: 'test-author', schema: REPAIR_SCHEMA },
  )

  finalGate = await agent(verifyPrompt, { label: 'verify:confirm', phase: 'Verify', model: 'haiku', effort: 'low', agentType: 'gate-runner', schema: GATE_SCHEMA })
}

const sourceBugs = [...authorSourceBugs.map(item => `${item.id} — ${item.what}`), ...(repair?.sourceBugs ?? [])]

// A null gate is UNVERIFIED, not "failed" — the gate can die (session limit, crash), and the smoke
// test hit exactly that. Reporting passed:false there hid that nothing had checked the tree. And a
// run that plants a sourceBug test is SUPPOSED to end red: separate that expected red from a real
// repair failure, or every good run that catches a bug reads as broken.
const verdictOf = () => {
  if (!finalGate) return 'unverified'
  if (finalGate.passed) return 'clean'
  // mechanical/coverage failures are never expected: the author's tests must lint-clean and must not
  // drop coverage. Only a `logic` failure can be a planted sourceBug left deliberately red.
  const failures = finalGate.failures ?? []
  const allLogic = failures.length > 0 && failures.every(failure => failure.kind === 'logic')
  return sourceBugs.length && allLogic ? 'red-known' : 'red-unexpected'
}

const status = verdictOf()

return {
  ...report,
  consensus: consensus.map(item => ({ ...item.finding, adversary: item.adversary })),
  implemented,
  buckets: [...buckets.keys()],
  sourceBugs,
  verification: {
    status, // clean | red-known (only sourceBugs remain) | red-unexpected | unverified (gate never ran)
    passed: status === 'clean',
    ranRepair: repair !== null,
    failures: finalGate?.failures ?? [],
    repaired: repair?.fixes ?? [],
    unfixed: repair?.unfixed ?? [],
    coverage: finalGate?.overall ?? null,
  },
  counts: { ...report.counts, written: wrote.length, deferred: deferred.length, sourceBugs: sourceBugs.length },
}
