import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = process.cwd();
const SRV_DIR = join(ROOT_DIR, "srv");

/**
 * baseFacade implements wrapHandler itself — the try/catch that wraps every handler is
 * the mechanism, not a violation of it. Only domain facades are policed.
 */
const EXEMPT_FILES = ["baseFacade.ts"];

/**
 * Facades are pure wiring: registration and one-line delegation, nothing else.
 * Each pattern is a construct that means logic has leaked down into the wiring layer.
 */
const FORBIDDEN = [
  { pattern: /(^|[^\w.])(if|for|while|switch)\s*\(/, label: "control flow" },
  { pattern: /(^|[^\w.])try\s*\{/, label: "try/catch" },
  { pattern: /(^|[^\w.])(SELECT|INSERT|UPDATE|DELETE|UPSERT)\s*[.(]/, label: "CQL" },
  { pattern: /cds\.(run|ql|entities)\b/, label: "data access" },
];

interface Violation {
  filePath: string;
  line: number;
  label: string;
  text: string;
}

/**
 * Blanks out string and comment bodies so a forbidden word inside a message or an
 * i18n key never counts as logic. Delimiters are kept so columns stay meaningful.
 */
function blankNonCode(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, match => " ".repeat(match.length))
    .replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, match => match[0].repeat(match.length));
}

/**
 * Recursively collects every *Facade.ts under srv/, minus the exempt infrastructure.
 */
function findFacades(): string[] {
  return readdirSync(SRV_DIR, { recursive: true, encoding: "utf8" })
    .filter(entry => entry.endsWith("Facade.ts"))
    .filter(entry => !EXEMPT_FILES.includes(entry.split(/[\\/]/).pop() ?? ""))
    .map(entry => join(SRV_DIR, entry));
}

/**
 * Scans domain facades for logic. CLAUDE.md promises this is enforced; this is the
 * enforcement. Exits with code 1 if violations found.
 */
function main(): void {
  const facades = findFacades();
  const violations: Violation[] = [];

  for (const filePath of facades) {
    const lines = blankNonCode(readFileSync(filePath, "utf8")).split(/\r?\n/);

    for (const [index, text] of lines.entries()) {
      for (const { pattern, label } of FORBIDDEN) {
        if (pattern.test(text)) {
          violations.push({
            filePath: relative(ROOT_DIR, filePath),
            line: index + 1,
            label,
            text: text.trim(),
          });
        }
      }
    }
  }

  console.log(`Scanning ${facades.length} facade(s) in srv/ for logic...`);

  if (violations.length === 0) {
    console.log(`All ${facades.length} facade(s) are pure wiring.`);
    process.exit(0);
  }

  console.log();

  for (const violation of violations) {
    console.log(`${violation.filePath}:${violation.line}  ${violation.label} in a facade — move it to the Service`);
  }

  console.log(`\nFound ${violations.length} facade violation(s). Facades are pure wiring.`);
  process.exit(1);
}

main();
