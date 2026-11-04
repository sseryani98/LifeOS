import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { basename, join, relative } from "path";

// Roots at the repo, not a module: the harness under .claude/ is shared by every module, so this
// is wired into the root `lint` script rather than a module's lint:* block. A missing .claude/ is
// skipped, never fatal.
const ROOT_DIR = process.cwd();
const HARNESS_DIR = join(ROOT_DIR, ".claude");
const AGENTS_DIR = join(HARNESS_DIR, "agents");
const STANDARDS_DIR = join(import.meta.dirname, "..");
const CANONICAL_BLOCK = join(STANDARDS_DIR, "agentMemoryBlock.md");
const BLOCK_HEADING = "## Learn from every task";
const AGENT_PLACEHOLDER = "{{agent}}";
const WRITE = process.argv.includes("--write");

/**
 * Prose that states how many linters exist. Every such number must equal the count of lint*.ts
 * scripts on disk, or the claim drifts the moment a linter is added — as "18", "20" and "21"
 * already did across the harness.
 */
const LINTER_COUNT_CLAIM =
  /\b(\d+)\s+(?:shared |architectural |custom |\\?`?lint:\*\\?`? )*(?:linters|lint scripts|lint:\* scripts|\\?`lint:\*\\?` scripts)\b/g;

/**
 * A drive-letter path is one machine's. Agents and workflows run on whatever clone starts them,
 * and the one path they legitimately need — the memory folder — is reachable as `~/.claude/...`.
 */
const MACHINE_PATH = /\b[A-Z]:[\\/]/;

/**
 * A section citation that names its file: a backticked `.md` path followed by one or more
 * `§Heading` or `§12` references. Prompts tell agents to read standards by heading, so a heading
 * that no longer exists sends an agent to read nothing — or the whole file. A bare `§8` with no
 * path beside it cannot be resolved and is left alone.
 */
const SECTION_CITATION = /`([^`\n]+\.md)`\s+(§[^`\n]*)/g;
const SECTION_REF = /§(\d+|[A-Za-z][A-Za-z0-9 ]*?)(?=\s*[,;:)`'"]|\s+[—(]|\.(?:\s|$)|\s*$)/gm;
const HEADING = /^#{1,6}\s+(.+?)\s*$/;

/**
 * Where linter-count claims live: the harness, and the CLAUDE.md files that describe the suite.
 */
const CLAIM_FILES = [
  ...listFiles(join(HARNESS_DIR, "agents"), ".md"),
  ...listFiles(join(HARNESS_DIR, "commands"), ".md"),
  ...listFiles(join(HARNESS_DIR, "workflows"), ".js"),
  ...listFiles(join(HARNESS_DIR, "skills"), ".md"),
  join(ROOT_DIR, "CLAUDE.md"),
  ...moduleClaudeFiles(),
];

interface Violation {
  filePath: string;
  message: string;
}

/**
 * Lists files under a directory (recursively) with the given extension. An absent directory
 * yields nothing, so a clone without that part of the harness still lints.
 */
function listFiles(dir: string, extension: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter(entry => entry.endsWith(extension))
    .map(entry => join(dir, entry));
}

/**
 * Every workspace module's CLAUDE.md, read from the root package.json so a new module is covered
 * the day it is added to `workspaces`.
 */
function moduleClaudeFiles(): string[] {
  const packageJson = join(ROOT_DIR, "package.json");
  if (!existsSync(packageJson)) return [];
  const workspaces: string[] = JSON.parse(readFileSync(packageJson, "utf8")).workspaces ?? [];
  return workspaces.map(folder => join(ROOT_DIR, folder, "CLAUDE.md")).filter(existsSync);
}

/**
 * Linters that root at the repo rather than a module. The prose counts describe the module
 * suite — the scripts every module wires into its lint:* block — so these are left out.
 */
const REPO_LEVEL_LINTERS = ["lintAgentPrompts.ts"];

/**
 * Counts the module-suite lint*.ts scripts beside this one — the only authority on how many exist.
 */
function realLinterCount(): number {
  return readdirSync(join(STANDARDS_DIR, "scripts")).filter(name => /^lint[A-Z].*\.ts$/.test(name) && !REPO_LEVEL_LINTERS.includes(name)).length;
}

/**
 * The canonical memory block with the agent's name substituted, normalised to LF.
 */
function expectedBlock(agent: string): string {
  return readFileSync(CANONICAL_BLOCK, "utf8").replace(/\r\n/g, "\n").replaceAll(AGENT_PLACEHOLDER, agent).trimEnd();
}

/**
 * Checks one agent file's memory block against the canonical copy. With --write, restamps it.
 */
function checkAgent(filePath: string, violations: Violation[]): void {
  const agent = basename(filePath, ".md");
  const source = readFileSync(filePath, "utf8");
  const normalised = source.replace(/\r\n/g, "\n");
  const start = normalised.indexOf(BLOCK_HEADING);
  const expected = expectedBlock(agent);
  if (start === -1) {
    if (WRITE) writeFileSync(filePath, `${normalised.trimEnd()}\n\n${expected}\n`);
    else violations.push({ filePath, message: `has no "${BLOCK_HEADING}" block` });
    return;
  }
  const actual = normalised.slice(start).trimEnd();
  if (actual === expected) return;
  if (WRITE) {
    writeFileSync(filePath, `${normalised.slice(0, start)}${expected}\n`);
    return;
  }
  const actualLines = actual.split("\n");
  const expectedLines = expected.split("\n");
  const index = expectedLines.findIndex((line, position) => line !== actualLines[position]);
  violations.push({
    filePath,
    message: `memory block drifts from Standards (Technical + Linting)/agentMemoryBlock.md at block line ${index + 1}: ${JSON.stringify(actualLines[index] ?? "(missing)")} — run with --write to restamp`,
  });
}

/**
 * Checks every prose claim of a linter count against the scripts on disk.
 */
function checkLinterCounts(filePath: string, count: number, violations: Violation[]): void {
  const source = readFileSync(filePath, "utf8");
  for (const match of source.matchAll(LINTER_COUNT_CLAIM)) {
    const claimed = Number(match[1]);
    if (claimed === count) continue;
    const line = source.slice(0, match.index).split("\n").length;
    violations.push({ filePath, message: `line ${line} claims ${claimed} linters; there are ${count} lint*.ts scripts` });
  }
}

/**
 * Checks a harness file for a drive-letter path.
 */
function checkMachinePaths(filePath: string, violations: Violation[]): void {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    if (MACHINE_PATH.test(text)) violations.push({ filePath, message: `line ${index + 1} names a machine-specific path: ${text.trim().slice(0, 80)}` });
  });
}

/**
 * Headings of a markdown file, with the markdown stripped, cached per path.
 */
const headingCache = new Map<string, string[]>();
function headingsOf(filePath: string): string[] {
  let headings = headingCache.get(filePath);
  if (!headings) {
    headings = readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map(line => HEADING.exec(line)?.[1].replaceAll(/[`*]/g, "").trim())
      .filter((text): text is string => Boolean(text));
    headingCache.set(filePath, headings);
  }
  return headings;
}

/**
 * Whether a citation names a heading: either is a whole-word prefix of the other, so `§Handler
 * Pattern` finds "Handler Pattern — 4 Files" and `§Test Rules holds them` finds "Test Rules",
 * while `§1` does not find "12. Code Review Checklists".
 */
function headingMatches(reference: string, heading: string): boolean {
  const [shorter, longer] = reference.length <= heading.length ? [reference, heading] : [heading, reference];
  if (!longer.startsWith(shorter)) return false;
  return longer.length === shorter.length || !/[A-Za-z0-9]/.test(longer[shorter.length]);
}

/**
 * The files a cited path can mean. A bare `CLAUDE.md` is "a CLAUDE.md" — prose says "the
 * module's `CLAUDE.md` §Folder Structure" — so it resolves to the root one and every module's.
 * A path that does not resolve from the repo root (a `${moduleDir}/CLAUDE.md` template, a
 * module-relative spec) resolves to nothing — only a file on disk can be checked.
 */
function citedFiles(cited: string): string[] {
  if (cited.includes("$")) return [];
  if (cited === "CLAUDE.md") return [join(ROOT_DIR, cited), ...moduleClaudeFiles()].filter(existsSync);
  const target = join(ROOT_DIR, cited);
  return existsSync(target) ? [target] : [];
}

/**
 * Checks every `path` §Heading citation in a harness file against the headings of that file.
 */
function checkSectionCitations(filePath: string, violations: Violation[]): void {
  const source = readFileSync(filePath, "utf8");
  for (const citation of source.matchAll(SECTION_CITATION)) {
    const targets = citedFiles(citation[1]);
    if (!targets.length) continue;
    const headings = targets.flatMap(headingsOf);
    const line = source.slice(0, citation.index).split("\n").length;
    for (const reference of citation[2].matchAll(SECTION_REF)) {
      const text = reference[1].trim();
      if (headings.some(heading => headingMatches(text, heading))) continue;
      violations.push({ filePath, message: `line ${line} cites \`${citation[1]}\` §${text}, which has no such heading` });
    }
  }
}

/**
 * Compiles a workflow script the way the runtime does — as an async function body with the
 * runtime's globals — so a backtick inside a prompt template breaks here, not on the next /build.
 * `node --check` cannot do this: the scripts use top-level `return`.
 */
function checkWorkflowSyntax(filePath: string, violations: Violation[]): void {
  const source = readFileSync(filePath, "utf8").replace(/^export const meta/m, "const meta");
  const ASYNC_FUNCTION = Object.getPrototypeOf(async () => undefined).constructor as new (...parameters: string[]) => unknown;
  try {
    new ASYNC_FUNCTION("args", "agent", "parallel", "pipeline", "phase", "log", source);
  } catch (error) {
    violations.push({ filePath, message: `does not compile as a workflow body: ${(error as Error).message}` });
  }
}

/**
 * Lints the shared harness under .claude/: every agent carries the canonical memory block, no
 * prose misstates the linter count, nothing names one machine's path, every workflow script
 * compiles as the runtime would run it, and every `path` §Heading citation names a real heading.
 * Exits with code 1 if violations found.
 */
function main(): void {
  if (!existsSync(HARNESS_DIR)) {
    console.log("No .claude/ folder here — nothing to lint.");
    process.exit(0);
  }
  const violations: Violation[] = [];
  const agents = listFiles(AGENTS_DIR, ".md");
  const count = realLinterCount();

  for (const agent of agents) checkAgent(agent, violations);
  for (const file of CLAIM_FILES) checkLinterCounts(file, count, violations);
  const workflows = listFiles(join(HARNESS_DIR, "workflows"), ".js");
  for (const file of [...agents, ...listFiles(join(HARNESS_DIR, "commands"), ".md"), ...workflows]) {
    checkMachinePaths(file, violations);
  }
  for (const file of workflows) checkWorkflowSyntax(file, violations);
  for (const file of CLAIM_FILES) checkSectionCitations(file, violations);

  console.log(`Checked ${agents.length} agent(s), ${CLAIM_FILES.length} file(s) for linter-count claims (${count} on disk)...`);

  if (violations.length === 0) {
    console.log("Harness prompts are in sync.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) console.log(`${relative(ROOT_DIR, violation.filePath)}  ${violation.message}`);
  console.log(`\nFound ${violations.length} harness violation(s).`);
  process.exit(1);
}

main();
