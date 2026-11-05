import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { dirname, join, relative } from "path";

const ROOT_DIR = process.cwd();
const PACKAGE_JSON = join(ROOT_DIR, "package.json");

// The module's own CLAUDE.md, plus the shared standards every module inherits. The shared file is
// found from this script's folder, so its claims are checked against each module's scripts in turn
// — a lint:* name that one module lacks is a phantom claim for that module.
const CLAIM_FILES = [
  join(ROOT_DIR, "CLAUDE.md"),
  join(import.meta.dirname, "..", "..", "Standards (Documents)", "CODING_STANDARDS.md"),
];

// A module config only re-exports the shared rules, so the shared config is read too, or
// every claimed rule id would read as phantom. It is found from this script's folder so
// moving Standards cannot silently defeat the check; absent paths are skipped.
const ESLINT_CONFIGS = [
  join(ROOT_DIR, "eslint.config.mjs"),
  join(import.meta.dirname, "..", "eslint.config.mjs"),
];

/**
 * Phrases that assert a rule is mechanically enforced. A line carrying one of these
 * is making a falsifiable promise, so it must name the mechanism keeping it.
 */
const CLAIM_MARKERS = [/\(ESLint\)/, /lint-enforced/i, /enforced (by|via)/i];

/**
 * A backticked token is treated as a rule id only if it is kebab-case or scoped
 * (`id-length`, `jsdoc/require-jsdoc`). Bare words like `if` or `try` are prose and
 * would otherwise substring-match half the config.
 */
const RULE_ID = /^[@a-z][a-z0-9@/_-]*[-/][a-z0-9@/_-]+$/;

// Living docs whose `path:NN` citations must still land on a real line. The decisions log is a
// dated record — its citations describe the tree as it was, so it is never re-checked.
const CITING_DIRS = [join(ROOT_DIR, "design"), join(ROOT_DIR, "design", "specs")];
const CITING_FILES = [join(ROOT_DIR, "CLAUDE.md"), join(ROOT_DIR, "PLAN.md")];
const HISTORICAL_DOCS = new Set(["DECISIONS_LOG.md"]);
const REPO_ROOT = join(import.meta.dirname, "..", "..");

/** A backticked `some/file.ext:12` or `file.ext:12-30` citation. */
const LINE_CITATION = /`([^`\s][^`]*?\.[A-Za-z]{2,5}):(\d+)(?:-(\d+))?`/g;

interface Violation {
  file: string;
  line: number;
  message: string;
}

/**
 * Strips comments so a rule parked as `// 'no-logic-in-facade': 'error'` never counts
 * as enforcement. Commented rules are exactly the phantom this linter exists to catch.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith("//"))
    .join("\n");
}

/**
 * Extracts `lint:x` script names referenced in a body of text.
 */
function findLintScripts(text: string): string[] {
  return [...new Set([...text.matchAll(/lint:[a-z][a-z0-9-]*/g)].map(match => match[0]))];
}

/**
 * Extracts backticked tokens that look like ESLint rule ids.
 */
function findRuleIds(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)]
    .map(match => match[1])
    .filter(token => RULE_ID.test(token));
}

/**
 * Whether a claim line names at least one mechanism that actually exists — a live npm
 * script, or a rule id present in the config outside a comment.
 */
function namesLiveMechanism(text: string, scripts: string[], activeConfig: string): boolean {
  const claimsScript = findLintScripts(text).some(name => scripts.includes(name));
  const claimsRule = findRuleIds(text).some(rule =>
    new RegExp(`["'\`]${rule.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&")}["'\`]`).test(activeConfig),
  );
  return claimsScript || claimsRule;
}

/**
 * Lists the living docs a module's citation check scans.
 */
function listCitingDocs(): string[] {
  const inDirs = CITING_DIRS.filter(existsSync).flatMap(dir =>
    readdirSync(dir)
      .filter(name => name.endsWith(".md") && !HISTORICAL_DOCS.has(name))
      .map(name => join(dir, name)),
  );
  return [...CITING_FILES.filter(existsSync), ...inDirs];
}

/**
 * Resolves a cited path the way a reader would: beside the doc, then the module, then the repo.
 * An unresolvable bare name (`manifest.json:13`) is ambiguous rather than wrong, so it is skipped.
 */
function resolveCitation(cited: string, docPath: string): string | undefined {
  return [dirname(docPath), ROOT_DIR, join(ROOT_DIR, "design"), REPO_ROOT]
    .map(base => join(base, cited))
    .find(candidate => existsSync(candidate) && statSync(candidate).isFile());
}

/**
 * Flags every `path:NN` citation in a living doc whose file is now shorter than the cited line —
 * the signature of a file that was split or moved out from under the citation.
 */
function findStaleCitations(): { violations: Violation[]; checked: number } {
  const violations: Violation[] = [];
  const lengths = new Map<string, number>();
  let checked = 0;

  for (const docPath of listCitingDocs()) {
    const file = relative(ROOT_DIR, docPath);
    for (const [index, text] of readFileSync(docPath, "utf8").split(/\r?\n/).entries()) {
      for (const match of text.matchAll(LINE_CITATION)) {
        const target = resolveCitation(match[1], docPath);
        if (!target) continue;
        checked++;
        if (!lengths.has(target)) lengths.set(target, readFileSync(target, "utf8").split(/\r?\n/).length);
        const lastLine = Number(match[3] ?? match[2]);
        if (lastLine > (lengths.get(target) ?? 0)) {
          violations.push({
            file,
            line: index + 1,
            message: `cites ${match[1]}:${lastLine} — that file has ${lengths.get(target)} line(s)`,
          });
        }
      }
    }
  }
  return { violations, checked };
}

/**
 * Verifies CLAUDE.md's enforcement claims against reality, in both directions: no claim
 * without a live mechanism, and no mechanism the chain forgets to run.
 * Exits with code 1 if violations found.
 */
function main(): void {
  const activeConfig = ESLINT_CONFIGS.filter(configPath => existsSync(configPath))
    .map(configPath => stripComments(readFileSync(configPath, "utf8")))
    .join("\n");
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  const scripts: Record<string, string> = pkg.scripts ?? {};
  const scriptNames = Object.keys(scripts);
  const chain = scripts.lint ?? "";
  const violations: Violation[] = [];
  const files = CLAIM_FILES.filter(existsSync);
  let lineCount = 0;

  for (const filePath of files) {
    const file = relative(ROOT_DIR, filePath);
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    lineCount += lines.length;

    for (const [index, text] of lines.entries()) {
      // Blockquotes state the convention itself, not a claim about a specific rule.
      if (text.trim().startsWith(">")) continue;

      for (const name of findLintScripts(text)) {
        if (!scriptNames.includes(name)) {
          violations.push({ file, line: index + 1, message: `claims "${name}" — no such npm script` });
        }
      }

      const isClaim = CLAIM_MARKERS.some(marker => marker.test(text));
      if (isClaim && !namesLiveMechanism(text, scriptNames, activeConfig)) {
        violations.push({
          file,
          line: index + 1,
          message: "asserts enforcement but names no live mechanism (add the lint:* script or rule id)",
        });
      }
    }
  }

  const citations = findStaleCitations();
  violations.push(...citations.violations);

  const unwired = scriptNames.filter(name => name.startsWith("lint:") && !chain.includes(name));

  console.log(`Scanning ${lineCount} line(s) across ${files.length} standards file(s) against ${scriptNames.length} npm script(s), and ${citations.checked} line citation(s)...`);

  if (!violations.length && !unwired.length) {
    console.log("All enforcement claims resolve to live mechanisms.");
    process.exit(0);
  }

  console.log();

  for (const violation of violations) {
    console.log(`${violation.file}:${violation.line}  ${violation.message}`);
  }
  for (const name of unwired) {
    console.log(`package.json  "${name}" exists but the lint chain never runs it`);
  }

  console.log(
    `\nFound ${violations.length + unwired.length} phantom enforcement claim(s). ` +
      `A rule that reads as enforced and is not is worse than no rule.`,
  );
  process.exit(1);
}

main();
