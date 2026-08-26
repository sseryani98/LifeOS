import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * Source trees that must never reference design-tracking IDs.
 * Design docs (design/, project/, *.md) and commit bodies are exempt by design —
 * FRICEW IDs and business rules belong there, not in shipped source.
 */
const SOURCE_DIRS = [
  join(ROOT_DIR, "srv"),
  join(ROOT_DIR, "db"),
  join(ROOT_DIR, "app"),
  join(ROOT_DIR, "mcp"),
  join(ROOT_DIR, "test"),
  join(ROOT_DIR, "scripts"),
];

/**
 * File extensions scanned. Covers every source surface a tracking ID could hide
 * in: TypeScript, UI5 JavaScript, CDS, XML views/annotations, i18n properties,
 * CSS overrides, and HTML shells.
 */
const SCANNED_EXTENSIONS = [
  ".ts",
  ".js",
  ".cds",
  ".xml",
  ".properties",
  ".css",
  ".html",
];

/**
 * Banned design-tracking ID patterns: FRICEW object IDs (FRM/RPT/INT/CNV/ENH/
 * WFL plus the project's FUT/REP variants), business-rule IDs (BR-nn), and
 * spec/decision IDs (SPEC-nn, D-nn). Word-boundary anchored so embedded
 * substrings (e.g. "POINT-1", "PRINT-2") never match.
 * Workflow IDs are WFL, not WKF — the latter matched nothing and left every
 * WFL-nn free to reach source code.
 */
const TRACKING_ID =
  /\b(?:FRM|RPT|INT|CNV|ENH|WFL|REP|FUT|BR|SPEC)-\d+\b|\bD-\d+\b/;

/**
 * The section mark (U+00A7), banned because it only appears in design-doc
 * "See DOC.md" section pointers. Built via char code so this source file holds
 * no literal occurrence and therefore never flags itself.
 */
const SECTION_MARK = String.fromCharCode(0xa7);

interface Violation {
  filePath: string;
  line: number;
  text: string;
  match: string;
}

/**
 * Reports whether a file is test fixture data. The ban exists so a design
 * reference never leaks into shipped source; inside a `data/` folder the same
 * literal is a value under test, and a module whose domain is the story board
 * holds story identifiers as data. Only `data/` is exempt, so a spec and every
 * source file still carry the ban.
 * @param filePath Absolute path of the file being scanned.
 * @returns True when the file is a fixture under the test tree.
 */
function isFixtureFile(filePath: string): boolean {
  const normalized = filePath.split("\\").join("/");
  return normalized.includes("/test/") && normalized.includes("/data/");
}

/**
 * Scans a single file for banned tracking IDs, returning one violation per
 * offending line.
 */
function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    const match = TRACKING_ID.exec(text)?.[0] ??
      (text.includes(SECTION_MARK) ? SECTION_MARK : null);
    if (match) {
      violations.push({
        filePath: relative(ROOT_DIR, filePath),
        line: index + 1,
        text: text.trim(),
        match,
      });
    }
  });
  return violations;
}

/**
 * Scans all source trees for FRICEW / business-rule IDs and exits non-zero when
 * any are found. Keeps shipped source free of design-tracking artifacts that
 * belong only in design docs and commit bodies.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(dir =>
    collectFiles(dir, SCANNED_EXTENSIONS),
  ).filter(file => !isFixtureFile(file));
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} source file(s) for design-tracking IDs...`,
    "No tracking IDs found in source.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  ` +
        `"${violation.match}"  →  ${violation.text}`,
    ),
    `\nFound ${violations.length} tracking-ID reference(s). FRICEW IDs, ` +
      `business rules, spec/decision IDs, and section refs belong in design ` +
      `docs and commit bodies, never in source.`,
  );
}

main();
