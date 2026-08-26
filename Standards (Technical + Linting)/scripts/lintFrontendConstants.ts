import { readFileSync } from "fs";
import { basename, join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * The UI5 frontend is the surface this rule governs. Backend object-literal
 * constants are handled by their domain constants.ts convention; scripts/ and
 * test/ are tooling/fixtures where co-located data literals are expected.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/** The one filename allowed to declare a module's named data constants. */
const CONSTANTS_FILE = "constants.ts";

/**
 * Matches a module-scope (column 0, so not inside a class or function)
 * SCREAMING_SNAKE_CASE `const NAME = …`. Captures the name and the initializer
 * so object/array data maps can be told apart from scalar one-offs. camelCase
 * module subjects (`formatter`, `navConfig`) never match — the naming is the
 * signal that this is a named data constant, not the module's own export.
 */
const CONST_DECL = /^(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\b\s*(?::[^=]+)?=\s*(.+)$/;

interface DataConst {
  name: string;
  line: number;
}

interface Violation {
  filePath: string;
  constants: DataConst[];
}

/**
 * Classifies a `const` initializer as an object or array literal — a data map
 * or list, the kind that belongs in constants.ts. Scalar strings/numbers (e.g.
 * a single-use fragment name) and computed/derived values legitimately stay local.
 * @param initializer Source text of the initializer, right of the `=`.
 * @returns True when the initializer opens an object or array literal.
 */
function isDataLiteral(initializer: string): boolean {
  const head = initializer.trimStart();
  return head.startsWith("{") || head.startsWith("[");
}

/**
 * Scans one file for SCREAMING_SNAKE object/array-literal constants that belong
 * in a constants.ts. Files named constants.ts are the designated home and skipped.
 * @param filePath Absolute path of the file to scan.
 * @returns A violation listing the misplaced data constants, or null when clean.
 */
function scanFile(filePath: string): Violation | null {
  if (basename(filePath) === CONSTANTS_FILE) return null;
  const constants: DataConst[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    const match = CONST_DECL.exec(text);
    if (match && isDataLiteral(match[2])) {
      constants.push({ name: match[1], line: index + 1 });
    }
  });
  if (constants.length === 0) return null;
  return { filePath: relative(ROOT_DIR, filePath), constants };
}

/**
 * Scans the UI5 frontend for SCREAMING_SNAKE object/array-literal constants
 * living outside a constants.ts and exits non-zero when any are found. Keeps
 * formatter/controller/component modules focused on behaviour, not lookup data.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"]));
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  reportViolations(
    `Scanning ${files.length} frontend file(s) for misplaced data constants...`,
    "All frontend data constants live in a constants.ts.",
    violations.map(violation => {
      const names = violation.constants
        .map(entry => `${entry.name} (l.${entry.line})`)
        .join(", ");
      return `${violation.filePath}  —  ${names}`;
    }),
    `\nFound object/array-literal constant(s) outside a constants.ts. Move ` +
      `each into the app's constants.ts (e.g. app/connection-manager/webapp/` +
      `model/constants.ts), grouped under an \`as const\` namespace. Scalar ` +
      `one-offs (a single fragment/route name) may stay local.`,
  );
}

main();
