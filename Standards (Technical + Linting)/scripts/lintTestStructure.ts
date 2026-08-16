import { readdirSync, readFileSync } from "fs";
import { basename, join, relative, sep } from "path";

import typescript from "typescript";

const ROOT_DIR = process.cwd();
const TEST_DIR = join(ROOT_DIR, "test");

/**
 * Subtrees skipped entirely (generated output, dependencies, build artifacts).
 */
const SKIP_SEGMENTS = new Set([
  "node_modules",
  "gen",
  "dist",
  "coverage",
  ".git",
]);

/**
 * The three role folders every test file must live under. `data/` holds
 * fixtures, `support/` holds builders/mocks/harnesses, `tests/` holds specs.
 * `scenarios/` is the FUT multi-step home and counts as a spec folder.
 */
const DATA_SEGMENT = "data";
const SUPPORT_SEGMENT = "support";
const SPEC_SEGMENTS = new Set(["tests", "scenarios"]);

/**
 * Runner lifecycle files, allowed at the root of `test/` and nowhere else. They
 * belong to the runner rather than to any test module — a `setupFiles` entry
 * loads before a module exists — so the data/support/tests split has no role for
 * them, and a worse home would be the cost of enforcing one anyway. Root only:
 * the same name one folder down still has to earn a role.
 */
const RUNNER_FILES = new Set([
  "setEnv.ts",
  "globalSetup.ts",
  "globalTeardown.ts",
  "setupAfterEnv.ts",
]);

/**
 * Object/array literals at or above this recursive weight are data fixtures.
 * A `support/` file exporting one is data hiding in the harness folder — the
 * exact drift this rule blocks (mirrors `lint:test-data`'s threshold).
 */
const MAX_LITERAL_WEIGHT = 5;

interface Violation {
  filePath: string;
  line: number;
  reason: string;
}

/** Path segments of a test file relative to `test/`, e.g. `unit/ingestion/data`. */
function segmentsOf(filePath: string): string[] {
  return relative(TEST_DIR, filePath).split(sep);
}

/** Recursively collects `.ts` file paths under a directory. */
function collectTsFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectTsFiles(full));
    } else if (entry.name.endsWith(".ts")) {
      found.push(full);
    }
  }
  return found;
}

/** Recursive size of a literal: own members plus the weight of nested literals. */
function literalWeight(node: typescript.Node): number {
  if (typescript.isObjectLiteralExpression(node)) {
    let weight = node.properties.length;
    for (const property of node.properties) {
      if (typescript.isPropertyAssignment(property)) {
        weight += literalWeight(property.initializer);
      }
    }
    return weight;
  }
  if (typescript.isArrayLiteralExpression(node)) {
    let weight = node.elements.length;
    for (const element of node.elements) {
      weight += literalWeight(element);
    }
    return weight;
  }
  return 0;
}

/** Unwraps `x as const` / `x as T` to the underlying initializer expression. */
function unwrapAssertions(node: typescript.Expression): typescript.Expression {
  let current = node;
  while (
    typescript.isAsExpression(current) ||
    typescript.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

/** True when a variable statement carries the `export` modifier. */
function isExported(statement: typescript.VariableStatement): boolean {
  return (
    statement.modifiers?.some(
      modifier => modifier.kind === typescript.SyntaxKind.ExportKeyword,
    ) ?? false
  );
}

/**
 * Flags every exported data literal (object/array at or above the fixture
 * weight) declared in a `support/` file — those belong in a sibling `data/`.
 */
function scanSupportForData(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const source = typescript.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    typescript.ScriptTarget.Latest,
    true,
  );

  for (const statement of source.statements) {
    if (!typescript.isVariableStatement(statement)) continue;
    if (!isExported(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer) continue;
      const initializer = unwrapAssertions(declaration.initializer);
      if (literalWeight(initializer) < MAX_LITERAL_WEIGHT) continue;
      const { line } = source.getLineAndCharacterOfPosition(
        declaration.getStart(),
      );
      const name = declaration.name.getText(source);
      violations.push({
        filePath: relative(ROOT_DIR, filePath),
        line: line + 1,
        reason: `exported fixture "${name}" in a support/ file — move it to a sibling data/ folder`,
      });
    }
  }
  return violations;
}

/**
 * Checks a file sits in a role folder matching its kind: specs under
 * `tests/`/`scenarios/`, everything else under `data/` or `support/`.
 */
function checkPlacement(filePath: string): Violation | null {
  const segments = segmentsOf(filePath);
  const roleSegment = segments.slice(0, -1);
  const isSpec = filePath.endsWith(".test.ts");

  if (isSpec) {
    if (roleSegment.some(segment => SPEC_SEGMENTS.has(segment))) return null;
    return {
      filePath: relative(ROOT_DIR, filePath),
      line: 1,
      reason:
        "a *.test.ts spec must live under a tests/ (or scenarios/) folder",
    };
  }

  if (roleSegment.length === 0 && RUNNER_FILES.has(basename(filePath)))
    return null;

  if (
    roleSegment.includes(DATA_SEGMENT) ||
    roleSegment.includes(SUPPORT_SEGMENT)
  ) {
    return null;
  }
  return {
    filePath: relative(ROOT_DIR, filePath),
    line: 1,
    reason:
      "a non-spec test file must live under a data/ (fixtures) or support/ (builders) folder",
  };
}

/**
 * Enforces the test tree contract: `test/{unit,integration}/<module>/{data,
 * support,tests}` plus the cross-cutting `test/shared/{data,support}`. Data
 * lives in data/, builders in support/, specs in tests/ — no data in support/.
 */
function main(): void {
  const files = collectTsFiles(TEST_DIR);
  const violations: Violation[] = [];

  for (const filePath of files) {
    const placement = checkPlacement(filePath);
    if (placement) violations.push(placement);
    if (segmentsOf(filePath).slice(0, -1).includes(SUPPORT_SEGMENT)) {
      violations.push(...scanSupportForData(filePath));
    }
  }

  console.log(
    `Scanning ${files.length} test file(s) for structure violations...`,
  );

  if (violations.length === 0) {
    console.log("Test tree follows the data/support/tests contract.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    console.log(`${violation.filePath}:${violation.line}  ${violation.reason}`);
  }
  console.log(
    `\nFound ${violations.length} test-structure violation(s). Layout is ` +
      `test/{unit,integration}/<module>/{data,support,tests} (+ test/shared/` +
      `{data,support}): fixtures in data/, builders in support/, specs in tests/.`,
  );
  process.exit(1);
}

main();
