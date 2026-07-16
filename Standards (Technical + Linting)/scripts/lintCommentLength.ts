import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

import typescript from "typescript";

const ROOT_DIR = process.cwd();

/**
 * Source trees whose comments are governed by the prose cap. Generated shims
 * (@cds-models, *.d.ts) and dependencies are excluded below.
 */
const SOURCE_DIRS = [
  join(ROOT_DIR, "srv"),
  join(ROOT_DIR, "db"),
  join(ROOT_DIR, "app"),
  join(ROOT_DIR, "test"),
  join(ROOT_DIR, "scripts"),
];

/**
 * Only TypeScript/JavaScript is scanned — that is where JSDoc lives and where
 * the TS scanner can tokenise comments reliably.
 */
const SCANNED_EXTENSIONS = [".ts", ".js"];

const SKIP_SEGMENTS = new Set([
  "node_modules",
  "gen",
  "dist",
  "coverage",
  ".git",
  "@cds-models",
]);

/**
 * Maximum prose lines per comment block. Only the description counts — tag
 * lines (@param, @returns, @example) and everything after the first tag are
 * exempt, as are blank dividers and the comment delimiters. Forces terse,
 * why-not-what comments without penalising wide, well-documented signatures.
 */
const MAX_PROSE_LINES = 5;

interface CommentBlock {
  startLine: number;
  proseLines: number;
}

interface Violation {
  filePath: string;
  line: number;
  proseLines: number;
}

/**
 * Precomputes the byte offset at which each line begins, so a scanner token
 * position can be mapped back to a 1-based line number.
 * @param text Full file contents.
 * @returns Ascending list of line-start offsets, index 0 being line 1.
 */
function computeLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

/**
 * Maps a character offset to its 1-based line via binary search over the
 * line-start table.
 * @param lineStarts Ascending line-start offsets from computeLineStarts.
 * @param pos Character offset within the file.
 * @returns The 1-based line number containing pos.
 */
function lineOf(lineStarts: number[], pos: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (lineStarts[mid] <= pos) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

/**
 * Counts the prose (description) lines of a block comment, stopping at the first
 * JSDoc tag so tag lines and their wrapped content never count. Blank lines and
 * the comment delimiters are ignored.
 * @param commentText Raw comment text including its surrounding delimiters.
 * @returns Number of non-blank description lines before the first tag.
 */
function countBlockProse(commentText: string): number {
  const body = commentText
    .replace(/^\/\*\*?/, "")
    .replace(/\*\/\s*$/, "");
  let count = 0;
  for (const rawLine of body.split(/\r?\n/)) {
    const content = rawLine.replace(/^\s*\*?\s?/, "").trim();
    if (content === "") continue;
    if (content.startsWith("@")) break;
    count++;
  }
  return count;
}

/**
 * Recursively collects scannable source file paths under a directory, skipping
 * generated trees and type-declaration shims.
 * @param dir Directory to walk.
 * @returns Absolute paths of every scannable `.ts`/`.js` file beneath it.
 */
function collectFiles(dir: string): string[] {
  const found: string[] = [];
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFiles(full));
    } else if (
      SCANNED_EXTENSIONS.some(ext => entry.name.endsWith(ext)) &&
      !entry.name.endsWith(".d.ts")
    ) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Tokenises a file and returns one entry per comment block: each multi-line
 * comment, and each run of consecutive single-line comments. Using the TS
 * scanner keeps `//` and `/*` inside string/template literals from being
 * mistaken for comments.
 * @param text Full file contents.
 * @returns Comment blocks with their start line and prose-line count.
 */
function extractComments(text: string): CommentBlock[] {
  const lineStarts = computeLineStarts(text);
  const scanner = typescript.createScanner(
    typescript.ScriptTarget.Latest,
    false,
    typescript.LanguageVariant.Standard,
    text,
  );
  const blocks: CommentBlock[] = [];
  let runStart = -1;
  let runLast = -1;
  let runProse = 0;
  const flushRun = () => {
    if (runStart !== -1) {
      blocks.push({ startLine: runStart, proseLines: runProse });
      runStart = -1;
      runLast = -1;
      runProse = 0;
    }
  };
  let token = scanner.scan();
  while (token !== typescript.SyntaxKind.EndOfFileToken) {
    const tokenText = scanner.getTokenText();
    const startLine = lineOf(lineStarts, scanner.getTokenEnd() - tokenText.length);
    if (token === typescript.SyntaxKind.SingleLineCommentTrivia) {
      const content = tokenText.replace(/^\/\/+/, "").trim();
      if (runStart !== -1 && startLine === runLast + 1) {
        runLast = startLine;
        if (content !== "") runProse++;
      } else {
        flushRun();
        runStart = startLine;
        runLast = startLine;
        runProse = content === "" ? 0 : 1;
      }
    } else if (token === typescript.SyntaxKind.MultiLineCommentTrivia) {
      flushRun();
      blocks.push({ startLine, proseLines: countBlockProse(tokenText) });
    } else if (
      token !== typescript.SyntaxKind.WhitespaceTrivia &&
      token !== typescript.SyntaxKind.NewLineTrivia
    ) {
      flushRun();
    }
    token = scanner.scan();
  }
  flushRun();
  return blocks;
}

/**
 * Scans all source trees for comment blocks whose prose exceeds the cap and
 * exits non-zero on any violation. Keeps JSDoc/comments terse and focused on
 * intent rather than restating the code.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(collectFiles);
  const violations: Violation[] = [];
  for (const filePath of files) {
    for (const block of extractComments(readFileSync(filePath, "utf8"))) {
      if (block.proseLines > MAX_PROSE_LINES) {
        violations.push({
          filePath: relative(ROOT_DIR, filePath),
          line: block.startLine,
          proseLines: block.proseLines,
        });
      }
    }
  }

  console.log(`Scanning ${files.length} source file(s) for over-long comments...`);

  if (violations.length === 0) {
    console.log(`No comment blocks exceed ${MAX_PROSE_LINES} prose lines.`);
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    console.log(
      `${violation.filePath}:${violation.line}  —  ` +
        `${violation.proseLines} prose lines (cap ${MAX_PROSE_LINES})`,
    );
  }
  console.log(
    `\nFound ${violations.length} over-long comment block(s). Trim the ` +
      `description to ${MAX_PROSE_LINES} lines or fewer — state why, not what. ` +
      `@param/@returns/@example lines are exempt, so widen signatures freely.`,
  );
  process.exit(1);
}

main();
