import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

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
 * Recursively collects scannable source file paths under a directory. A missing
 * root is skipped rather than fatal: SOURCE_DIRS is the union of trees any module
 * might have, and no module has all of them — a scaffolded one has almost none.
 */
function collectFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFiles(full));
    } else if (SCANNED_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      found.push(full);
    }
  }
  return found;
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
  const files = SOURCE_DIRS.flatMap(collectFiles);
  const violations = files.flatMap(scanFile);

  console.log(
    `Scanning ${files.length} source file(s) for design-tracking IDs...`,
  );

  if (violations.length === 0) {
    console.log("No tracking IDs found in source.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    console.log(
      `${violation.filePath}:${violation.line}  ` +
        `"${violation.match}"  →  ${violation.text}`,
    );
  }
  console.log(
    `\nFound ${violations.length} tracking-ID reference(s). FRICEW IDs, ` +
      `business rules, spec/decision IDs, and section refs belong in design ` +
      `docs and commit bodies, never in source.`,
  );
  process.exit(1);
}

main();
