export const meta = {
  name: 'code-quality',
  description: 'Isolated-agent code quality review: lint gate, parallel reviewers, single adversary triage pass, consensus report',
  whenToUse:
    'After Claude Code builds a feature (review the uncommitted diff), or ad hoc against a module, backend, frontend, or all. Invoked by /code-quality.',
  phases: [
    { title: 'Lint', detail: 'run the 21-script lint suite so reviewers skip machine-checked rules' },
    { title: 'Review', detail: 'parallel isolated finders: per-domain structure+comments, duplication, naming, /code-review, cap-annotation-hunter' },
    { title: 'Triage', detail: 'one adversary pass per file (Opus for high-severity batches, Sonnet otherwise): not-worth-a-row drops a finding, over-engineering/readability sends it to Sandro as contested. No rebuttal round.' },
    { title: 'Report', detail: 'consensus + contested tables' },
  ],
}

const CATEGORIES = ['structure', 'comments', 'duplication', 'dead-code', 'naming', 'correctness', 'simplification', 'annotation']

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Repo-relative path' },
          line: { type: 'number', description: '1-indexed line the finding anchors to' },
          category: { type: 'string', enum: CATEGORIES },
          summary: { type: 'string', description: 'One sentence stating the defect' },
          argument: { type: 'string', description: 'Why this is a defect, argued from the code — not a label' },
          fix: { type: 'string', description: 'The smallest concrete change that resolves it' },
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

const CHALLENGE_BATCH_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      description: 'Exactly one verdict per finding you were given, keyed by its index.',
      items: {
        type: 'object',
        properties: {
          index: { type: 'number', description: '0-based index of the finding in the list you were given' },
          challenged: { type: 'boolean', description: 'True if the finding fails on one of the three grounds' },
          ground: {
            type: 'string',
            enum: ['over-engineering', 'readability', 'not-worth-a-row', 'none'],
            description: 'Which ground you are challenging on. "none" when challenged is false.',
          },
          argument: { type: 'string', description: 'The case for your ground, or why the finding earns its row' },
        },
        required: ['index', 'challenged', 'ground', 'argument'],
        additionalProperties: false,
      },
    },
  },
  required: ['verdicts'],
  additionalProperties: false,
}

// args should arrive as an object, but a stringified payload is an easy caller mistake and
// silently yields an empty scope — parse rather than review nothing.
const scope = (typeof args === 'string' ? JSON.parse(args) : args) ?? {}
const moduleDir = scope.moduleDir
if (!moduleDir) throw new Error('code-quality needs args.moduleDir — the command resolves it; nothing defaults to a module')
const files = scope.files ?? []
const domains = scope.domains ?? []
const label = scope.label ?? 'target'
// Layers the scope ships code in — the same vocabulary as the build brief ('cap', 'ui5'). The
// command derives it from the files; a missing value means the caller predates the field.
const layers = scope.layers ?? []


if (!files.length) {
  log('No files in scope — nothing to review.')
  return { consensus: [], contested: [], scope: label, note: 'empty scope' }
}

const fileList = files.join('\n')
const standards = `The shared standards live in \`Financial Planner/CLAUDE.md\` §Coding Patterns and \`Financial Planner/design/TECHNICAL_STANDARDS.md\` §12 (six review checklists); they apply to every module. Read only the subsections for the layers in scope (${layers.join(', ') || 'not stated — judge from the files'}): \`cap\` is \`Financial Planner/CLAUDE.md\` §CDS, §TypeScript, §Handler Pattern, §Error Handling, §Logging, §i18n; \`ui5\` is \`Financial Planner/CLAUDE.md\` §SAPUI5, §i18n. \`Financial Planner/CLAUDE.md\` §Do NOT applies to both. \`${moduleDir}/CLAUDE.md\` holds this module's architecture and carve-outs — a carve-out there beats the shared rule. Cite rules by section heading, not line number. Sandro's standing corrections are \`feedback_*.md\` files in \`~/.claude/projects/c--Projects-Life-OS/memory/\`.`

phase('Lint')

const lint = await agent(
  `Run the lint suite for the \`${moduleDir}\` module and report what it flags.

Run: \`cd "${moduleDir}" && npm run lint\`

The suite is ESLint plus the custom architectural linters, chained with &&, so it STOPS at the first failing linter. That is expected — report what you got.

Return a plain-text report:
- Which linters ran and which one halted the chain (if any).
- Every violation, as \`file:line — rule — message\`.
- If everything passed, say exactly: "Lint suite passed clean."

Do not fix anything. Do not comment on code quality. You are a reporter, not a reviewer.`,
  { label: 'lint-suite', phase: 'Lint', model: 'haiku', effort: 'low', agentType: 'quality-reviewer' },
)

const lintGate = `## Lint suite output (already machine-checked — do NOT re-report these)

${lint ?? 'Lint could not be run; rely on your own judgment but stay off mechanical rules.'}

The \`lint:*\` scripts plus ESLint already cover: facade purity, comment length, mapper placement, domain types, grouped constants, test structure/data/CQL, control IDs, event handlers, messaging, frontend data access, i18n, annotations, filenames, doc claims. Do not spend a finding on anything in that list. Report only judgment defects a linter cannot see.`

phase('Review')

// A reviewer's model tracks how much reasoning its scope needs: Opus where there is real
// logic (TS/CDS) to reason about, Sonnet for declarative-only scope (markup/config). The
// naming finder is gated on code presence — id naming targets code identifiers, not markup.
const LOGIC_EXTS = ['.ts', '.js', '.cds']
const CODE_EXTS = ['.ts', '.js']
const hasExtension = (names, exts) => names.some(name => exts.some(ext => name.endsWith(ext)))
const pickModel = names => (hasExtension(names, LOGIC_EXTS) ? 'opus' : 'sonnet')

const reviewers = []

// One reviewer per domain covers both structure and comment substance, reading the domain
// once. Two finders here read the identical files twice for no gain — the file read is the
// cost, and structure and comments are one context away from each other.
for (const domain of domains) {
  const domainFiles = (domain.files ?? []).join('\n')

  reviewers.push(() =>
    agent(
      `You are the **domain reviewer** for the \`${domain.name}\` domain, covering both structure and comment substance. Scope — read these files once and nothing else:

${domainFiles}

${lintGate}

${standards}

Report findings in two categories; report only where the answer is genuinely bad.

## Structure (category \`structure\`)

1. **Is this module doing too much?** Does it have more than one reason to change? Name the distinct responsibilities you found.
2. **Is any class too big / doing too much?** Note: there is deliberately NO line-count rule in this repo — no \`max-lines\`, no \`max-classes-per-file\`, and neither CLAUDE.md nor TECHNICAL_STANDARDS.md states a class cap. So you cannot cite a rule. Argue from cohesion: what are the class's distinct reasons to change, and would splitting it make the code easier or harder to follow? A 400-line class with one job is fine. A 90-line class with three jobs is not.
3. **Is the Facade/Service/DataService/Validator/Mapper split honored in spirit?** \`lint:facades\` and \`lint:mapper-methods\` check the letter — you check the intent. Business logic hiding in a DataService, a Validator that queries, a Service that shape-translates below the mapper threshold, a "Mapper" doing scalar conversion (that's a utility per the shared Handler Pattern).

## Comments (category \`comments\`)

\`lint:comment-length\` already caps comment prose at 5 lines. Length is handled. **You review substance.**

The rule (shared CLAUDE.md §Coding Patterns, \`feedback_comment_why_not_what\`): a comment explains **why** — rationale, gotchas, invariants, constraints the code cannot show. It never restates **what** the code says, never explains an obvious language feature, never narrates the pattern being used, and never talks to the reviewer ("this change is correct because…").

Flag:
- Comments that restate the line below them.
- Comments explaining a pattern the reader can see (\`// Facade delegates to service\`).
- JSDoc \`@param\` text that just re-types the parameter name (\`@param userId The user ID\`).
- Comments that have drifted — they describe behavior the code no longer has. These are the most valuable finding in this category; a wrong comment is worse than no comment.
- Missing comments **only** where a genuinely non-obvious constraint is invisible (a magic constant from a spec, an ordering dependency, a workaround for a CAP quirk).

Do NOT flag a comment merely for existing. Sandro's preference is "Lean" trimming, not comment eradication.

Tag each finding \`structure\` or \`comments\` as appropriate.`,
      { label: `review:${domain.name}`, phase: 'Review', model: pickModel(domain.files ?? []), agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
    ),
  )
}

reviewers.push(() =>
  agent(
    `You are the **duplication and dead-code reviewer**, working holistically across the whole target (${label}).

Files in scope:
${fileList}

${lintGate}

${standards}

You may read beyond the scope list to check whether something is duplicated or referenced elsewhere — that is the point of your role. Use Grep aggressively.

**Duplication** (category \`duplication\`): repeated logic that should be extracted and shared. Placement rules matter: cross-module/generic → \`srv/shared/\`; domain-scoped → the domain folder; frontend cross-app → \`app/shared/\`. Two similar-looking blocks that happen to differ in intent are NOT duplication — copy-paste that will drift together is. Argue why the two sites must change together.

**Dead code** (category \`dead-code\`): unreferenced exports, unreachable branches, files nothing imports, constants nobody reads, commented-out blocks. **Verify with Grep before reporting** — check the whole repo, including tests, CDS files, and XML views, since UI5 references controllers/formatters from XML by string name and CAP wires handlers by convention. A "dead" method reached only from an XML view is a false positive and the most likely way you embarrass yourself.`,
    { label: 'holistic:duplication', phase: 'Review', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
  ),
)

if (hasExtension(files, CODE_EXTS))
  reviewers.push(() =>
    agent(
      `You are the **readability and naming reviewer**, working holistically across the whole target (${label}).

Files in scope:
${fileList}

${lintGate}

${standards}

\`id-length\` (≥3 letters) and the lint suite already cover the mechanical shape. You judge whether names are **honest** — does the name say what the thing actually is?

Flag:
- **Names that lie or mislead** — \`accounts\` holding transactions, \`isValid\` returning a list, a \`get*\` that mutates. Highest value; report every one.
- **Method names that are not verb + object** (shared CLAUDE.md §Coding Patterns, \`feedback_no_single_verb_methods\`) — \`_fetch\` not \`_fetchAccounts\`. Exempt: framework lifecycle (\`init\`, \`onInit\`, \`render\`) and interface methods named for the class (\`DedupService.evaluate\`).
- **Method ordering** (shared CLAUDE.md §Coding Patterns): visibility (public → \`_\`private at bottom) → importance → alphabetical. No section-divider comments.
- **Readability** — a function whose control flow you had to re-read, a boolean parameter that makes the call site unreadable, nesting that a guard clause would flatten.

Do not propose a rename that is merely a synonym of the current name. The bar is: a reader is actively misled today.

Use category \`naming\` for all findings.`,
      { label: 'holistic:naming', phase: 'Review', model: 'sonnet', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
    ),
  )

reviewers.push(() =>
  agent(
    `You are running the standard \`/code-review\` skill on a fresh context.

Invoke the Skill tool with \`skill: "code-review"\` and \`args: "high"\`.

**Do NOT pass \`--fix\` or \`--comment\`.** Review only.

Scope the review to (${label}):
${fileList}

${lintGate}

If the skill reports its findings via the ReportFindings tool or as prose, translate every finding into the structured schema you must return. Map the skill's categories onto ours: bugs → \`correctness\`, reuse/simplification → \`simplification\`, efficiency → \`simplification\`, dead code → \`dead-code\`.

Return only findings the skill actually produced. If it found nothing, return an empty array — do not invent findings to look useful.`,
    { label: 'skill:code-review', phase: 'Review', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
  ),
)

if (layers.includes('cap')) {
  reviewers.push(() =>
    agent(
      `You are running the \`cap-annotation-hunter\` skill on a fresh context, against the backend in scope.

Invoke the Skill tool with \`skill: "cap-annotation-hunter"\`.

**Stop after the skill's Phase 3** — the numbered verdict table. Do NOT proceed to Phase 4 (apply). Phase 4 requires Sandro's explicit go-ahead and this workflow does not have it.

Honor the skill's own §10 Fabrication Guard and §11 Confidence rules: probe before claiming, mark VERIFIED rows, and do not report an annotation you have not confirmed exists in this CAP version.

Backend files in scope:
${(scope.backendFiles ?? files).join('\n')}

${lintGate}

Translate the Phase 3 table into the structured schema, category \`annotation\`. Carry the skill's confidence into severity: ★★★ → \`high\` or \`medium\` by impact, ★★☆ → \`medium\`, ★☆☆ → \`low\`. Include the skill's verdict (Missed / Redundant / Dead) at the front of each \`summary\`. Skip rows the skill marked Justified — those are working as intended.`,
      { label: 'skill:cap-annotation-hunter', phase: 'Review', agentType: 'quality-reviewer', schema: FINDINGS_SCHEMA },
    ),
  )
}

// Barrier: triage must not run twice on the same defect, and /code-review will
// independently surface what the structure reviewer found. Dedup needs every finder in.
const reviewResults = await parallel(reviewers)

const merged = new Map()
for (const result of reviewResults.filter(Boolean)) {
  for (const finding of result.findings ?? []) {
    // Key on file:line, not file:line:category — the same defect surfaced under two category
    // labels (a line flagged both `structure` and `simplification`) is one problem, and
    // sending it to two adversaries wastes a challenge and ships Sandro a duplicate row.
    const key = `${finding.file}:${finding.line}`
    const seen = merged.get(key)
    if (!seen) {
      merged.set(key, { ...finding, foundBy: 1 })
      continue
    }
    // Two finders agreeing is signal. Keep the longer argument, raise severity to the higher.
    seen.foundBy += 1
    if (finding.argument.length > seen.argument.length) seen.argument = finding.argument
    const rank = { low: 0, medium: 1, high: 2 }
    if (rank[finding.severity] > rank[seen.severity]) seen.severity = finding.severity
  }
}

const findings = [...merged.values()]
const duplicatesCollapsed = reviewResults.filter(Boolean).reduce((sum, result) => sum + (result.findings?.length ?? 0), 0) - findings.length
log(`${findings.length} distinct findings after dedup (${duplicatesCollapsed} collapsed as duplicates). Entering triage.`)
// The journal is the only thing that survives a killed run — put the findings in it now, not at Report.
log(`Findings: ${JSON.stringify(findings.map(finding => ({ file: finding.file, line: finding.line, severity: finding.severity, category: finding.category, summary: finding.summary })))}`)

if (!findings.length) {
  return { consensus: [], contested: [], dropped: [], scope: label, lint, note: 'Reviewers found no judgment defects.' }
}

phase('Triage')

// One adversary per file judges every finding anchored to it: file reads dominate triage cost.
// The model tier follows the batch's top severity, so Opus runs only where a `high` finding
// is at stake.
const fileBatches = [
  ...findings.reduce((map, finding) => {
    const bucket = map.get(finding.file) ?? []
    bucket.push(finding)
    return map.set(finding.file, bucket)
  }, new Map()),
].map(([file, batchFindings]) => ({ file, findings: batchFindings }))

const judgedBatches = await pipeline(
  fileBatches,
  batch => {
    const roster = batch.findings
      .map(
        (finding, index) => `### Finding ${index}
- **Line:** ${finding.line}
- **Category:** ${finding.category}
- **Defect:** ${finding.summary}
- **Reviewer's argument:** ${finding.argument}
- **Proposed fix:** ${finding.fix}
- **Severity claimed:** ${finding.severity}`,
      )
      .join('\n\n')
    const batchModel = batch.findings.some(finding => finding.severity === 'high') ? 'opus' : 'sonnet'

    return agent(
      `You are the **adversary**. A reviewer proposes changes to one file of Life OS code. Your job is to stop changes that make the codebase worse.

## The file

\`${batch.file}\` — read it once, in full, before judging. Every finding below anchors to a line in it.

## The findings (${batch.findings.length})

${roster}

## Your mandate is narrow

Judge **each** finding independently and return exactly one verdict per finding, keyed by its \`index\` (0..${batch.findings.length - 1}). For each, challenge on **exactly three grounds, and no others**. Set \`ground\` to the one you are using.

1. **\`over-engineering\`** — the fix adds abstraction, indirection, or generality the code does not need. An extracted helper used once. A pattern applied because it is a pattern. A layer for a problem that isn't real yet. This is a single-user local personal ERP, not a platform — speculative generality has negative value here.
2. **\`readability\`** — the code is easier to read as it stands. The "duplication" is two things that read clearly and happen to look alike. The rename is a synonym. The split scatters one coherent idea across three files.
3. **\`not-worth-a-row\`** — the defect is real but too trivial to spend Sandro's attention on. **This is a severity gate and you should use it.** Every finding that survives you costs him a row to read and a decision to make; a review table padded with nits is one he skims, and the two findings that actually mattered get lost in it.

## Applying \`not-worth-a-row\`

The bar is: **would Sandro be glad he read this row?**

Challenge on this ground when the finding is a pure nit with no downstream consequence — a JSDoc typo, a comment that is merely imprecise rather than wrong, a rename to a synonym, a test-file cosmetic. Also challenge when the reviewer has **inflated the severity**: a \`medium\` whose argument only supports a \`low\`.

Do NOT use this ground to dismiss:
- Anything the reviewer marked \`high\`, unless the argument plainly does not support it.
- A **wrong** comment or JSDoc — one that describes behavior the code no longer has. Those mislead the next reader and are worth the row even though they look cosmetic.
- A small fix with real consequence — a one-line bug is not a nit.

Severity is your calibration, not your rule: most \`low\` findings should fail this gate, most \`medium\` should pass it, \`high\` passes unless the argument is unsound.

## What is NOT yours to challenge

- **Whether the defect is real** — that is the reviewer's call, not yours. Argue it isn't worth fixing, never that it isn't there.
- **Whether you would have written it differently** — irrelevant.

## Judgment, not reflex

## There is no rebuttal round — your verdict is final for this run

- \`not-worth-a-row\` **drops** the finding. Sandro still sees a one-line list of drops, so a wrong drop is recoverable, but it is not in front of him.
- \`over-engineering\` or \`readability\` sends it to Sandro as **contested**, your argument beside the reviewer's. He rules.
- Unchallenged goes to Sandro as **consensus**.

Because nobody answers you, be sure before you drop. A \`high\` finding challenged as \`not-worth-a-row\` is sent to Sandro as contested, not dropped.

Do not challenge everything, and do not wave everything through. Both make you useless. For a finding that earns its row on all three grounds, return \`challenged: false, ground: 'none'\` and say briefly why it earns it. When you do challenge, name the ground and quote the code that makes your case. One verdict object per finding index — no more, no fewer.

${standards}`,
      { label: `adversary:${batch.file.split(/[/\\]/).pop()}`, phase: 'Triage', model: batchModel, agentType: 'quality-reviewer', schema: CHALLENGE_BATCH_SCHEMA },
    ).then(result => ({ batch, verdicts: result?.verdicts ?? null }))
  },

  async ({ batch, verdicts }) => {
    const byIndex = new Map((verdicts ?? []).map(verdict => [verdict.index, verdict]))

    return batch.findings.map((finding, index) => {
      const challenge = byIndex.get(index)
      if (!challenge) return { finding, verdict: 'contested', ground: 'none', adversary: '(adversary returned no verdict on this finding — silence is not endorsement, so it is flagged for your call rather than auto-accepted)' }
      if (!challenge.challenged) return { finding, verdict: 'consensus', adversary: challenge.argument }
      const drops = challenge.ground === 'not-worth-a-row' && finding.severity !== 'high'
      return { finding, verdict: drops ? 'dropped' : 'contested', ground: challenge.ground, adversary: challenge.argument }
    })
  },
)

const judged = judgedBatches.filter(Boolean).flat()

phase('Report')

const settled = judged.filter(Boolean)
const rank = { high: 0, medium: 1, low: 2 }
const bySeverity = (left, right) => rank[left.finding.severity] - rank[right.finding.severity] || right.finding.foundBy - left.finding.foundBy

const consensus = settled.filter(item => item.verdict === 'consensus').sort(bySeverity)
const contested = settled.filter(item => item.verdict === 'contested').sort(bySeverity)
const dropped = settled.filter(item => item.verdict === 'dropped')


const droppedByGround = dropped.reduce((tally, item) => ({ ...tally, [item.ground]: (tally[item.ground] ?? 0) + 1 }), {})
log(`${consensus.length} consensus · ${contested.length} contested · ${dropped.length} dropped (${JSON.stringify(droppedByGround)}).`)

return {
  scope: label,
  lint,
  counts: { consensus: consensus.length, contested: contested.length, dropped: dropped.length, deduped: duplicatesCollapsed, droppedByGround },
  consensus: consensus.map(item => ({ ...item.finding, adversary: item.adversary })),
  contested: contested.map(item => ({ ...item.finding, ground: item.ground, adversary: item.adversary })),
  dropped: dropped.map(item => ({ file: item.finding.file, line: item.finding.line, severity: item.finding.severity, summary: item.finding.summary, ground: item.ground, why: item.adversary })),
}
