import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = process.cwd();

/**
 * Both product TypeScript surfaces the constants-grouping convention governs:
 * srv/ and app/ (UI5, now strict TS). scripts/ and test/ are tooling/fixtures
 * where loose top-level constants are expected.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "srv"), join(ROOT_DIR, "app")];

const SKIP_SEGMENTS = new Set([
  "node_modules",
  "gen",
  "dist",
  "coverage",
  ".git",
]);

/**
 * A file with this many loose module-level literal constants must instead group
 * them into an `as const` object (locally, or in a constants.ts when shared).
 * Below the threshold, a stray one-off constant is not worth the ceremony.
 */
const GROUP_THRESHOLD = 3;

/**
 * Matches a module-scope (column 0, therefore not inside a class or function)
 * `const NAME = …` whose name is SCREAMING_SNAKE_CASE. Captures the name and the
 * initializer so its kind can be classified.
 */
const CONST_DECL = /^(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\b\s*(?::[^=]+)?=\s*(.+)$/;

/**
 * A class declaration anywhere in the file — used with the model/ path check to
 * exempt a UI5 app's `model/{App}Service.ts`, whose loose OData action-path
 * constants (`"/parseCsvImport(...)"`) are the documented carve-out.
 */
const CLASS_DECL = /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s/m;

interface LooseConst {
  name: string;
  line: number;
}

interface Violation {
  filePath: string;
  constants: LooseConst[];
}

/**
 * Classifies a `const` initializer as a fresh scalar/array/regex literal — the
 * kind that should be grouped. Object literals are already the grouped form;
 * calls and `new` are computed/derived (e.g. `join(process.cwd(), …)`) and
 * legitimately stay loose; bare identifier aliases are not literals.
 * @param initializer Source text of the initializer, right of the `=`.
 * @returns True when the initializer is a groupable scalar, array, or regex.
 */
function isGroupableLiteral(initializer: string): boolean {
  const head = initializer.trimStart();
  if (head.startsWith("{")) return false;
  if (head.startsWith("new ")) return false;
  if (/^[A-Za-z_$][\w$.]*\s*\(/.test(head)) return false;
  return /^(?:["'`[/]|-?\d|true\b|false\b)/.test(head);
}

/**
 * Recursively collects TypeScript source files under a directory, minus the
 * generated model shims (`*.ts` under @cds-models is excluded via SKIP_SEGMENTS
 * at the tree root, but the guard here keeps individual `.d.ts` out too).
 * @param dir Directory to walk.
 * @returns Absolute paths of every scannable `.ts` file beneath it.
 */
function collectFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFiles(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Scans one file for loose module-level literal constants, returning a violation
 * only when their count reaches the grouping threshold.
 * @param filePath Absolute path of the file to scan.
 * @returns A single violation when the file is over threshold, else null.
 */
function scanFile(filePath: string): Violation | null {
  const source = readFileSync(filePath, "utf8");
  const isModelClass =
    /[/\\]model[/\\]/.test(filePath) && CLASS_DECL.test(source);
  if (isModelClass) return null;
  const loose: LooseConst[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((text, index) => {
    const match = CONST_DECL.exec(text);
    if (match && isGroupableLiteral(match[2])) {
      loose.push({ name: match[1], line: index + 1 });
    }
  });
  if (loose.length < GROUP_THRESHOLD) return null;
  return { filePath: relative(ROOT_DIR, filePath), constants: loose };
}

/**
 * Scans backend TypeScript for ungrouped module-level constants and exits
 * non-zero when any file crosses the grouping threshold. Keeps loose `const`
 * walls from obscuring the methods that follow them.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(collectFiles);
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  console.log(
    `Scanning ${files.length} TypeScript file(s) for ungrouped constants...`,
  );

  if (violations.length === 0) {
    console.log("No ungrouped constant walls found.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    const names = violation.constants
      .map(entry => `${entry.name} (l.${entry.line})`)
      .join(", ");
    console.log(
      `${violation.filePath}  —  ${violation.constants.length} loose constants: ${names}`,
    );
  }
  console.log(
    `\nFound ${violations.length} file(s) with ${GROUP_THRESHOLD}+ loose ` +
      `module-level constants. Group related values into an \`as const\` object ` +
      `(in a constants.ts when shared across files). Computed one-offs like ` +
      `join()-built paths are exempt.`,
  );
  process.exit(1);
}

main();
