import { readFileSync, existsSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = process.cwd();
const CLAUDE_MD = join(ROOT_DIR, "CLAUDE.md");
const PACKAGE_JSON = join(ROOT_DIR, "package.json");

// A module's own config only re-exports the shared Life OS rules, so the shared config
// is read alongside it — otherwise every rule id a module claims would read as phantom.
// It is located from this script's own folder rather than a path spelled out relative to
// the module, so renaming or moving the Standards folder cannot silently defeat the check.
// Absent paths are skipped, which is what lets this run from Standards itself.
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

interface Violation {
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
 * Verifies CLAUDE.md's enforcement claims against reality, in both directions: no claim
 * without a live mechanism, and no mechanism the chain forgets to run.
 * Exits with code 1 if violations found.
 */
function main(): void {
  const claude = readFileSync(CLAUDE_MD, "utf8");
  const activeConfig = ESLINT_CONFIGS.filter(configPath => existsSync(configPath))
    .map(configPath => stripComments(readFileSync(configPath, "utf8")))
    .join("\n");
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  const scripts: Record<string, string> = pkg.scripts ?? {};
  const scriptNames = Object.keys(scripts);
  const chain = scripts.lint ?? "";
  const violations: Violation[] = [];
  const lines = claude.split(/\r?\n/);

  for (const [index, text] of lines.entries()) {
    // Blockquotes state the convention itself, not a claim about a specific rule.
    if (text.trim().startsWith(">")) continue;

    for (const name of findLintScripts(text)) {
      if (!scriptNames.includes(name)) {
        violations.push({ line: index + 1, message: `claims "${name}" — no such npm script` });
      }
    }

    const isClaim = CLAIM_MARKERS.some(marker => marker.test(text));
    if (isClaim && !namesLiveMechanism(text, scriptNames, activeConfig)) {
      violations.push({
        line: index + 1,
        message: "asserts enforcement but names no live mechanism (add the lint:* script or rule id)",
      });
    }
  }

  const unwired = scriptNames.filter(name => name.startsWith("lint:") && !chain.includes(name));

  console.log(`Scanning ${lines.length} line(s) of CLAUDE.md against ${scriptNames.length} npm script(s)...`);

  if (!violations.length && !unwired.length) {
    console.log("All enforcement claims resolve to live mechanisms.");
    process.exit(0);
  }

  console.log();

  const claudeRelative = relative(ROOT_DIR, CLAUDE_MD);
  for (const violation of violations) {
    console.log(`${claudeRelative}:${violation.line}  ${violation.message}`);
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
