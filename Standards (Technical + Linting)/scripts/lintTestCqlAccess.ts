import { readFileSync } from "fs";
import { join, relative } from "path";

import typescript from "typescript";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();
const TEST_DIR = join(ROOT_DIR, "test");

/**
 * The CAP CQL constructor globals. Any of these appearing in a spec means the
 * test is reading or writing the DB directly instead of through a support/
 * helper — the exact arrange plumbing that should never sit in an AAA body.
 */
const CQL_GLOBALS = new Set([
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "UPSERT",
]);

/** `cds.<member>` calls that run queries or raw SQL, e.g. `cds.run`, `cds.ql`. */
const CDS_DATA_MEMBERS = new Set(["run", "ql"]);

interface Violation {
  filePath: string;
  line: number;
  reason: string;
}

/**
 * Reports a CQL access when this node is a bare `SELECT`/`INSERT`/… identifier
 * or a `cds.run`/`cds.ql` member. Reading identifiers off the AST (not the raw
 * text) means the keyword inside a string or comment is never mistaken for code.
 * @param node The AST node under inspection.
 * @returns The offending keyword when the node is a CQL entry point, else null.
 */
function cqlKeywordAt(node: typescript.Node): string | null {
  if (typescript.isIdentifier(node) && CQL_GLOBALS.has(node.text)) {
    return node.text;
  }
  if (
    typescript.isPropertyAccessExpression(node) &&
    typescript.isIdentifier(node.expression) &&
    node.expression.text === "cds" &&
    CDS_DATA_MEMBERS.has(node.name.text)
  ) {
    return `cds.${node.name.text}`;
  }
  return null;
}

/** Scans one spec file, flagging every CQL/SQL data-access expression. */
function scanSpec(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const source = typescript.createSourceFile(
    filePath,
    readFileSync(filePath, "utf8"),
    typescript.ScriptTarget.Latest,
    true,
  );

  const visit = (node: typescript.Node): void => {
    const keyword = cqlKeywordAt(node);
    if (keyword) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      violations.push({
        filePath: relative(ROOT_DIR, filePath),
        line: line + 1,
        reason: `${keyword} in a spec — move DB access into a support/ helper`,
      });
    }
    typescript.forEachChild(node, visit);
  };
  visit(source);
  return violations;
}

/**
 * Keeps spec bodies as arrange-act-assert by banning direct DB access: every
 * SELECT/INSERT/UPDATE/DELETE/UPSERT and `cds.run`/`cds.ql` belongs in a named
 * support/ helper (`seedX`, `readXById`), not inline in a `*.test.ts`.
 */
function main(): void {
  const files = collectFiles(TEST_DIR, [".test.ts"]);
  const violations = files.flatMap(scanSpec);

  reportViolations(
    `Scanning ${files.length} spec file(s) for inline CQL...`,
    "No direct DB access in specs — all CQL lives in support/.",
    violations.map(
      violation => `${violation.filePath}:${violation.line}  ${violation.reason}`,
    ),
    `\nFound ${violations.length} inline-CQL violation(s). A *.test.ts is ` +
      `imports + arrange-act-assert: wrap each SELECT/INSERT/UPDATE/DELETE/` +
      `UPSERT (and cds.run/cds.ql) in a named support/ helper and call that.`,
  );
}

main();
