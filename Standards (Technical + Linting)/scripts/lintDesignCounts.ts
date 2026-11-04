import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = process.cwd();
const DESIGN_DIR = join(ROOT_DIR, "design");
const SPECS_DIR = join(DESIGN_DIR, "specs");
const DECISIONS_LOG = join(DESIGN_DIR, "DECISIONS_LOG.md");
const PLAN = join(ROOT_DIR, "PLAN.md");

const SPEC_FILE = /^(SPEC-\d+)\b.*\.md$/;
const FUT_HEADING = /^#{2,4}\s+FUT-\d+\b/;
const BR_DEFINITION = /^\s*-\s+\*\*(BR-\d+[a-z]?)\*\*/;
const SPEC_ID = /\bSPEC-\d+\b/;
const FUT_RANGE = /FUT-(\d+)\s*(?:…|\.\.\.|-|–)\s*FUT-(\d+)/;
const SEPARATOR_ROW = /^\s*\|[\s:|-]+\|\s*$/;
const PROSE_TOTAL = /\*{0,2}(\d+)\*{0,2}\s+(FUTs|business rules)\b/g;
const DECISION_HEADING = /^##\s+D-(\d+)\b/;
const DECISION_RANGE = /D-0[1]\s*(?:…|\.\.\.|through)\s*D-(\d+)/g;

/**
 * Lines that record the past rather than claim the present: struck-through text, change-history
 * rows (a date or version in the first cell), and counts quoted from another file.
 */
const HISTORICAL_LINE = /~~|^\|\s*(?:v?\d+\.\d+|\d{4}-\d{2}-\d{2}|\*{0,2}D-\d+\*{0,2})\s*\||\b(?:was|from) \d+ (?:to|→)/i;

/**
 * How close to the true total a prose number must be to read as that total gone stale. Subtotals
 * ("60 FUTs with no owner") sit far below it and are not claims about the whole.
 */
const TOTAL_TOLERANCE = 0.1;

interface Violation {
  file: string;
  line: number;
  message: string;
}

interface SpecCounts {
  futs: Map<string, number>;
  rules: Map<string, number>;
}

/**
 * Counts each spec's FUT headings and distinct BR definitions — the spec is the only authority.
 * @returns per-spec FUT and business-rule counts
 */
function countSpecs(): SpecCounts {
  const futs = new Map<string, number>();
  const rules = new Map<string, number>();
  for (const name of readdirSync(SPECS_DIR)) {
    const match = SPEC_FILE.exec(name);
    if (!match) continue;
    const lines = readFileSync(join(SPECS_DIR, name), "utf8").split(/\r?\n/);
    futs.set(match[1], lines.filter(text => FUT_HEADING.test(text)).length);
    rules.set(match[1], new Set(lines.map(text => BR_DEFINITION.exec(text)?.[1]).filter(Boolean)).size);
  }
  return { futs, rules };
}

/**
 * Splits a markdown table row into trimmed cells with emphasis and backticks removed.
 * @param text the raw row
 * @returns the cell values
 */
function splitCells(text: string): string[] {
  return text
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map(cell => cell.replace(/[*`]/g, "").trim());
}

/**
 * Whether a match sits inside double quotes on its line — a quote of what some file once said.
 * @param text the line
 * @param index the match offset within it
 * @returns true when quoted
 */
function isQuoted(text: string, index: number): boolean {
  return (text.slice(0, index).match(/["“”]/g) ?? []).length % 2 === 1;
}

/**
 * Checks one design doc's tables: wherever a header has a `FUTs` or `FUT IDs` column, a row
 * naming a spec must agree with that spec's heading count.
 * @param file the doc's display path
 * @param lines the doc's lines
 * @param futs spec id → FUT count
 * @param violations accumulator
 */
function checkTables(file: string, lines: string[], futs: Map<string, number>, violations: Violation[]): void {
  let countCol = -1;
  let rangeCol = -1;

  for (const [index, text] of lines.entries()) {
    if (!text.trim().startsWith("|")) {
      countCol = -1;
      rangeCol = -1;
      continue;
    }
    if (SEPARATOR_ROW.test(text)) continue;

    const cells = splitCells(text);
    if (SEPARATOR_ROW.test(lines[index + 1] ?? "")) {
      countCol = cells.indexOf("FUTs");
      rangeCol = cells.indexOf("FUT IDs");
      continue;
    }
    if (countCol < 0 && rangeCol < 0) continue;

    const specId = SPEC_ID.exec(cells[0] ?? "")?.[0];
    if (!specId) continue;
    const actual = futs.get(specId);
    if (actual === undefined) {
      violations.push({ file, line: index + 1, message: `names ${specId}, which has no spec file` });
      continue;
    }

    const claimed = countCol >= 0 ? Number(cells[countCol]) : NaN;
    if (!Number.isNaN(claimed) && claimed !== actual) {
      violations.push({ file, line: index + 1, message: `${specId} claims ${claimed} FUTs; the spec has ${actual}` });
    }
    const range = rangeCol >= 0 ? FUT_RANGE.exec(cells[rangeCol] ?? "") : null;
    if (range && Number(range[2]) !== actual) {
      violations.push({ file, line: index + 1, message: `${specId} claims FUT-${range[1]} … FUT-${range[2]}; the spec has ${actual}` });
    }
  }
}

/**
 * Checks module-wide totals stated in prose. A number within tolerance of the sum reads as the
 * total and must equal it; per-spec and subtotal numbers are left to the tables.
 * @param file the doc's display path
 * @param lines the doc's lines
 * @param counts per-spec FUT and business-rule counts
 * @param violations accumulator
 */
function checkProseTotals(file: string, lines: string[], counts: SpecCounts, violations: Violation[]): void {
  const sources = { FUTs: counts.futs, "business rules": counts.rules };
  for (const [index, text] of lines.entries()) {
    if (HISTORICAL_LINE.test(text)) continue;
    for (const match of text.matchAll(PROSE_TOTAL)) {
      const perSpec = [...sources[match[2] as keyof typeof sources].values()];
      const claimed = Number(match[1]);
      const total = perSpec.reduce((sum, count) => sum + count, 0);
      const nearTotal = Math.abs(claimed - total) <= total * TOTAL_TOLERANCE;
      if (!nearTotal || claimed === total || isQuoted(text, match.index)) continue;
      violations.push({ file, line: index + 1, message: `claims ${claimed} ${match[2]} in total; the specs carry ${total}` });
    }
  }
}

/**
 * Checks the decision range PLAN.md's status header states against the log's last heading. Only
 * the header is current; the session log below it records the range as it stood each day.
 * @param latest the highest D-nn heading in the decisions log
 * @param violations accumulator
 */
function checkDecisionRange(latest: number, violations: Violation[]): void {
  const lines = readFileSync(PLAN, "utf8").split(/\r?\n/);
  const headerEnd = lines.findIndex(text => text.startsWith("## "));
  for (const [index, text] of lines.slice(0, headerEnd < 0 ? lines.length : headerEnd).entries()) {
    for (const match of text.matchAll(DECISION_RANGE)) {
      if (Number(match[1]) === latest) continue;
      violations.push({ file: "PLAN.md", line: index + 1, message: `says decisions run to D-${match[1]}; the log's last is D-${latest}` });
    }
  }
}

/**
 * Fails when a design doc's counts disagree with the specs or decisions log they summarise. A
 * source re-baselined in place leaves every copied count stale, silently.
 */
function main(): void {
  // A module with no specs yet has nothing to disagree with.
  if (!existsSync(SPECS_DIR)) {
    console.log("No design/specs/ folder — nothing to check.");
    process.exit(0);
  }

  const counts = countSpecs();
  const docs = readdirSync(DESIGN_DIR)
    .filter(name => name.endsWith(".md") && name !== "DECISIONS_LOG.md")
    .map(name => join(DESIGN_DIR, name));
  const violations: Violation[] = [];
  for (const doc of docs) {
    const file = relative(ROOT_DIR, doc);
    const lines = readFileSync(doc, "utf8").split(/\r?\n/);
    checkTables(file, lines, counts.futs, violations);
    checkProseTotals(file, lines, counts, violations);
  }

  if (existsSync(DECISIONS_LOG) && existsSync(PLAN)) {
    const headings = readFileSync(DECISIONS_LOG, "utf8").split(/\r?\n/).map(text => DECISION_HEADING.exec(text)?.[1]);
    const latest = Math.max(0, ...headings.filter(Boolean).map(Number));
    if (latest) checkDecisionRange(latest, violations);
  }

  console.log(`Checked ${docs.length} design doc(s) against ${counts.futs.size} spec(s)...`);
  if (!violations.length) {
    console.log("Every count matches its source.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    console.log(`${violation.file}:${violation.line}  ${violation.message}`);
  }
  console.log(`\nFound ${violations.length} stale count(s). Update the copy, not the source.`);
  process.exit(1);
}

main();
