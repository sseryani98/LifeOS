import { readFileSync } from "fs";
import { basename, join, relative, sep } from "path";

import typescript from "typescript";

import { collectFiles, collectUi5TestRoots, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();
const TEST_DIR = join(ROOT_DIR, "test");

/**
 * The three role folders every test file must live under. `data/` holds
 * fixtures, `support/` holds builders/mocks/harnesses, `tests/` holds specs.
 * `scenarios/` is the FUT multi-step home and counts as a spec folder.
 */
const DATA_SEGMENT = "data";
const SUPPORT_SEGMENT = "support";
const SPEC_SEGMENTS = new Set(["tests", "scenarios"]);

/**
 * Playwright specs run at the sprint boundary, never under Jest, so they carry their
 * own suffix and live only under `test/e2e/<area>/tests/`.
 */
const E2E_SUFFIX = ".e2e.ts";
const E2E_SEGMENT = "e2e";

/**
 * UI5 test trees (each app's `test/` folder) use the QUnit Test Starter layout: the suite
 * config at the root, specs (`*.qunit.ts`) under unit/ or integration/, OPA5 page
 * objects under integration/pages/, and the shared data/ + support/ split.
 */
const UI5_SPEC_SUFFIX = ".qunit.ts";
const UI5_SPEC_SEGMENTS = new Set(["unit", "integration"]);
const UI5_ROOT_FILES = new Set(["testsuite.qunit.ts"]);
const UI5_PAGES_SEGMENT = "pages";

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

/** Path segments of a test file relative to its test root, e.g. `unit/ingestion/data`. */
function segmentsOf(filePath: string, testRoot = TEST_DIR): string[] {
  return relative(testRoot, filePath).split(sep);
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
  const isE2eSpec = filePath.endsWith(E2E_SUFFIX);

  if (isE2eSpec || (isSpec && segments[0] === E2E_SEGMENT)) {
    if (isE2eSpec && segments[0] === E2E_SEGMENT && roleSegment.includes("tests")) return null;
    return {
      filePath: relative(ROOT_DIR, filePath),
      line: 1,
      reason: `an e2e spec must be a *${E2E_SUFFIX} file under test/e2e/<area>/tests/`,
    };
  }

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
 * Checks a file in a UI5 test tree sits where the Test Starter layout puts it.
 */
function checkUi5Placement(filePath: string, testRoot: string): Violation | null {
  const segments = segmentsOf(filePath, testRoot);
  const roleSegment = segments.slice(0, -1);
  const fileName = basename(filePath);
  const violation = (reason: string): Violation => ({
    filePath: relative(ROOT_DIR, filePath),
    line: 1,
    reason,
  });

  if (roleSegment.length === 0) {
    return UI5_ROOT_FILES.has(fileName)
      ? null
      : violation("only testsuite.qunit.ts sits at a UI5 test root; specs go under unit/ or integration/");
  }
  if (fileName.endsWith(UI5_SPEC_SUFFIX)) {
    return UI5_SPEC_SEGMENTS.has(roleSegment[0])
      ? null
      : violation(`a *${UI5_SPEC_SUFFIX} spec must live under unit/ or integration/`);
  }
  if (
    roleSegment.includes(DATA_SEGMENT) ||
    roleSegment.includes(SUPPORT_SEGMENT) ||
    (roleSegment[0] === "integration" && roleSegment.includes(UI5_PAGES_SEGMENT))
  ) {
    return null;
  }
  return violation(
    "a non-spec UI5 test file must live under data/, support/ or integration/pages/",
  );
}

/**
 * Enforces the test tree contract: `test/{unit,integration,e2e}/<module>/{data,
 * support,tests}` plus the cross-cutting `test/shared/{data,support}`. Data
 * lives in data/, builders in support/, specs in tests/ — no data in support/.
 */
function main(): void {
  const files = collectFiles(TEST_DIR, [".ts"]);
  const violations: Violation[] = [];

  for (const filePath of files) {
    const placement = checkPlacement(filePath);
    if (placement) violations.push(placement);
    if (segmentsOf(filePath).slice(0, -1).includes(SUPPORT_SEGMENT)) {
      violations.push(...scanSupportForData(filePath));
    }
  }

  const ui5Roots = collectUi5TestRoots(ROOT_DIR);
  for (const testRoot of ui5Roots) {
    for (const filePath of collectFiles(testRoot, [".ts"])) {
      files.push(filePath);
      const placement = checkUi5Placement(filePath, testRoot);
      if (placement) violations.push(placement);
      if (segmentsOf(filePath, testRoot).slice(0, -1).includes(SUPPORT_SEGMENT)) {
        violations.push(...scanSupportForData(filePath));
      }
    }
  }

  reportViolations(
    `Scanning ${files.length} test file(s) for structure violations...`,
    "Test tree follows the data/support/tests contract.",
    violations.map(
      violation => `${violation.filePath}:${violation.line}  ${violation.reason}`,
    ),
    `\nFound ${violations.length} test-structure violation(s). Layout is ` +
      `test/{unit,integration}/<module>/{data,support,tests} (+ test/shared/` +
      `{data,support}, test/e2e/<area>/{data,support,tests}), and app/**/test/` +
      `{unit,integration[/pages],data,support}: fixtures in data/, builders in support/.`,
  );
}

main();
