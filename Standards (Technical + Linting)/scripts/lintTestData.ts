import { readFileSync } from "fs";
import { join, relative } from "path";

import typescript from "typescript";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();
const TEST_DIR = join(ROOT_DIR, "test");

/**
 * Only `*.test.ts` files carry the "no inline data" rule. `test/data/` (named
 * fixtures) and `test/support/` (mock/service/seed builders) are exactly where
 * inline construction is allowed to live — the rule pushes data *there*.
 */
const SPEC_EXTENSIONS = [".test.ts"];

/** Full-string UUID literal — an identifier that belongs in a `test/data/` constant. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Object/array literals at or above this recursive weight (own keys/elements
 * plus nested weight), when used as *input* rather than inside an assertion,
 * are inline test data that belongs in `test/data/`.
 */
const MAX_LITERAL_WEIGHT = 5;

/**
 * Call names whose arguments are *expected* values, not input fixtures — exempt.
 * Covers Jest matchers/asymmetric-matchers and the Chai chain endings used here.
 */
const ASSERTION_CALLEES = new Set([
  "expect",
  "objectContaining",
  "arrayContaining",
  "stringContaining",
  "stringMatching",
  "toEqual",
  "toStrictEqual",
  "toMatchObject",
  "toContainEqual",
  "toContain",
  "toHaveBeenCalledWith",
  "toHaveBeenLastCalledWith",
  "toHaveBeenNthCalledWith",
  "toReturnWith",
  "oneOf",
  "equal",
  "eql",
  "eqls",
  "include",
  "includes",
  "members",
  "deep",
  "match",
  "within",
  "closeTo",
]);

interface Violation {
  filePath: string;
  line: number;
  reason: string;
  text: string;
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

/** The trailing name of a call's callee, e.g. `oneOf` in `expect(x).to.be.oneOf(y)`. */
function calleeName(call: typescript.CallExpression): string | null {
  const expression = call.expression;
  if (typescript.isIdentifier(expression)) return expression.text;
  if (typescript.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

/** Root callee identifier of a test call, unwrapping `.only` / `.skip` / `.each`. */
function testCallRoot(call: typescript.CallExpression): string | null {
  let expression: typescript.Expression = call.expression;
  for (;;) {
    if (typescript.isPropertyAccessExpression(expression)) {
      expression = expression.expression;
    } else if (typescript.isCallExpression(expression)) {
      expression = expression.expression;
    } else {
      break;
    }
  }
  return typescript.isIdentifier(expression) ? expression.text : null;
}

/** A `it(...)` / `test(...)` call that declares a body (excludes `it.todo`). */
function isTestCall(call: typescript.CallExpression): boolean {
  const root = testCallRoot(call);
  if (root !== "it" && root !== "test") return false;
  return call.arguments.some(
    arg => typescript.isArrowFunction(arg) || typescript.isFunctionExpression(arg),
  );
}

/** True when a `/**` JSDoc block sits in the node's leading trivia. */
function hasLeadingJsdoc(node: typescript.Node, text: string): boolean {
  const ranges = typescript.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  return ranges.some(range => text.slice(range.pos, range.pos + 3) === "/**");
}

/**
 * Scans one source file, returning a violation per raw UUID literal and per
 * oversized input literal found outside an assertion.
 */
function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const source = typescript.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    typescript.ScriptTarget.Latest,
    true,
  );

  const record = (node: typescript.Node, reason: string): void => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    violations.push({
      filePath: relative(ROOT_DIR, filePath),
      line: line + 1,
      reason,
      text: node.getText(source).replace(/\s+/g, " ").slice(0, 80),
    });
  };

  const visit = (node: typescript.Node, inAssertion: boolean): void => {
    if (
      (typescript.isStringLiteral(node) ||
        typescript.isNoSubstitutionTemplateLiteral(node)) &&
      UUID.test(node.text)
    ) {
      record(node, "raw UUID literal");
      return;
    }

    if (
      (typescript.isObjectLiteralExpression(node) ||
        typescript.isArrayLiteralExpression(node)) &&
      !inAssertion &&
      literalWeight(node) >= MAX_LITERAL_WEIGHT
    ) {
      record(node, `inline data literal (weight ≥ ${MAX_LITERAL_WEIGHT})`);
      return; // report the outermost literal only
    }

    if (typescript.isCallExpression(node)) {
      if (isTestCall(node) && !hasLeadingJsdoc(node, source.text)) {
        record(node, "test without a leading JSDoc comment");
      }
      const name = calleeName(node);
      const argsAreExpected =
        inAssertion || (name !== null && ASSERTION_CALLEES.has(name));
      node.forEachChild(child => {
        // The callee subtree keeps the current context; arguments become
        // "expected" once we are inside an assertion call.
        visit(child, child === node.expression ? inAssertion : argsAreExpected);
      });
      return;
    }

    node.forEachChild(child => visit(child, inAssertion));
  };

  visit(source, false);
  return violations;
}

/**
 * Scans every `test/**​/*.test.ts` for inline test data and exits non-zero when
 * any is found. Test bodies must be arrange-act-assert against named constants;
 * fixtures belong in `test/data/`, builders in `test/support/`.
 */
function main(): void {
  const files = collectFiles(TEST_DIR, SPEC_EXTENSIONS);
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} test file(s) for inline test data...`,
    "No inline test data found.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  ` +
        `[${violation.reason}]  →  ${violation.text}`,
    ),
    `\nFound ${violations.length} inline-test-data violation(s). Move payloads ` +
    `and identifiers to test/data/ constants and builders to test/support/.`,
  );
}

main();
