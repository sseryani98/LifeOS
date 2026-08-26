import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * The product TypeScript surfaces the constants-grouping convention governs:
 * srv/, app/ (UI5, now strict TS) and mcp/ where a module has one. scripts/ and
 * test/ are tooling/fixtures where loose top-level constants are expected. A
 * tree a module does not have is skipped.
 */
const SOURCE_DIRS = [
  join(ROOT_DIR, "srv"),
  join(ROOT_DIR, "app"),
  join(ROOT_DIR, "mcp"),
];

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
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"]));
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  reportViolations(
    `Scanning ${files.length} TypeScript file(s) for ungrouped constants...`,
    "No ungrouped constant walls found.",
    violations.map(violation => {
      const names = violation.constants
        .map(entry => `${entry.name} (l.${entry.line})`)
        .join(", ");
      return `${violation.filePath}  —  ${violation.constants.length} loose constants: ${names}`;
    }),
    `\nFound ${violations.length} file(s) with ${GROUP_THRESHOLD}+ loose ` +
      `module-level constants. Group related values into an \`as const\` object ` +
      `(in a constants.ts when shared across files). Computed one-offs like ` +
      `join()-built paths are exempt.`,
  );
}

main();
