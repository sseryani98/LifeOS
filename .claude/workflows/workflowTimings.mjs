// Per-phase and per-agent wall-clock for a finished workflow run. The workflow runtime makes
// Date.now() throw inside a script (it breaks resume), so timing is read back afterwards from
// each agent transcript's timestamps and its meta.json workflowPhase.
// Usage: node .claude/workflows/workflowTimings.mjs "<transcript dir from the Workflow launch>"
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: node workflowTimings.mjs "<transcript dir>"')
  process.exit(2)
}

const agents = readdirSync(dir)
  .filter(name => name.endsWith('.meta.json'))
  .map(name => {
    const meta = JSON.parse(readFileSync(join(dir, name), 'utf8'))
    const transcript = readFileSync(join(dir, name.replace('.meta.json', '.jsonl')), 'utf8')
    const stamps = [...transcript.matchAll(/"timestamp":"([^"]+)"/g)].map(match => Date.parse(match[1]))
    return {
      label: meta.description,
      phase: meta.workflowPhase ?? '(no phase)',
      model: meta.model ?? 'inherited',
      start: Math.min(...stamps),
      end: Math.max(...stamps),
    }
  })
  .filter(agent => Number.isFinite(agent.start))

if (!agents.length) {
  console.error(`No agent transcripts with timestamps under ${dir}`)
  process.exit(1)
}

const phases = new Map()
for (const agent of agents) {
  const span = phases.get(agent.phase) ?? { start: Infinity, end: -Infinity, agents: [] }
  span.start = Math.min(span.start, agent.start)
  span.end = Math.max(span.end, agent.end)
  span.agents.push(agent)
  phases.set(agent.phase, span)
}

const toSeconds = millis => Math.round(millis / 1000)
const runStart = Math.min(...agents.map(agent => agent.start))
const runEnd = Math.max(...agents.map(agent => agent.end))
const ordered = [...phases].sort((left, right) => left[1].start - right[1].start)
for (const [phase, span] of ordered) {
  console.log(`${phase}: ${toSeconds(span.end - span.start)}s (starts +${toSeconds(span.start - runStart)}s)`)
  for (const agent of span.agents.sort((left, right) => left.start - right.start)) {
    console.log(`  ${agent.label} [${agent.model}] ${toSeconds(agent.end - agent.start)}s`)
  }
}
console.log(`Total: ${toSeconds(runEnd - runStart)}s`)
