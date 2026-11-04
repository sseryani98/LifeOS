import { readFileSync } from "fs";
import { join, relative } from "path";

import typescript from "typescript";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * Source trees whose comments are governed by the prose cap. Generated shims
 * (@cds-models, *.d.ts) and dependencies are excluded by the shared walker.
 */
const SOURCE_DIRS = [
  join(ROOT_DIR, "srv"),
  join(ROOT_DIR, "db"),
  join(ROOT_DIR, "app"),
  join(ROOT_DIR, "mcp"),
  join(ROOT_DIR, "test"),
  join(ROOT_DIR, "scripts"),
  join(ROOT_DIR, "dashboard"),
  // Exist only at the repo root, where the root `lint:comments` script runs this.
  join(ROOT_DIR, "Standards (Technical + Linting)"),
  join(ROOT_DIR, ".claude", "workflows"),
];

/**
 * CDS shares TS's `//` and block comment syntax and quotes strings the same
 * way, so the TS scanner tokenises its comments just as reliably. CSS and
 * .properties are exempt from the divider ban by ruling (2026-11-04).
 */
const SCANNED_EXTENSIONS = [".ts", ".js", ".mjs", ".cds"];

/**
 * A divider is any comment holding a run of three identical rule characters
 * (dashes, equals, box-drawing lines). Banners paper over ordering; order the
 * code instead.
 */
const DIVIDER_PATTERN = /([-=*#~_─═━])\1{2,}/;

/** After one of these a slash divides; after anything else it opens a regex. */
const VALUE_END_TOKENS = new Set<typescript.SyntaxKind>([
  typescript.SyntaxKind.Identifier,
  typescript.SyntaxKind.NumericLiteral,
  typescript.SyntaxKind.StringLiteral,
  typescript.SyntaxKind.CloseParenToken,
  typescript.SyntaxKind.CloseBracketToken,
  typescript.SyntaxKind.CloseBraceToken,
  typescript.SyntaxKind.TemplateTail,
  typescript.SyntaxKind.NoSubstitutionTemplateLiteral,
  typescript.SyntaxKind.ThisKeyword,
]);

/**
 * Maximum prose lines per comment block. Only the description counts — tag
 * lines (@param, @returns) and everything after the first tag are exempt, as
 * are blank lines and delimiters. An inline comment sits in the code path, so
 * it gets less room than a JSDoc block above a signature.
 */
const MAX_PROSE_LINES = { jsdoc: 5, inline: 3 } as const;

type CommentKind = keyof typeof MAX_PROSE_LINES;

interface CommentBlock {
  hasDivider: boolean;
  startLine: number;
  proseLines: number;
  kind: CommentKind;
}

interface Violation {
  filePath: string;
  line: number;
  message: string;
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
  let runDivider = false;
  const flushRun = () => {
    if (runStart !== -1) {
      blocks.push({ hasDivider: runDivider, startLine: runStart, proseLines: runProse, kind: "inline" });
      runStart = -1;
      runLast = -1;
      runProse = 0;
      runDivider = false;
    }
  };
  const templateDepths: number[] = [];
  let braceDepth = 0;
  let previousToken: typescript.SyntaxKind = typescript.SyntaxKind.Unknown;
  let token = scanner.scan();
  while (token !== typescript.SyntaxKind.EndOfFileToken) {
    const tokenText = scanner.getTokenText();
    const startLine = lineOf(lineStarts, scanner.getTokenEnd() - tokenText.length);
    if (token === typescript.SyntaxKind.SingleLineCommentTrivia) {
      const content = tokenText.replace(/^\/\/+/, "").trim();
      const divider = DIVIDER_PATTERN.test(content);
      if (runStart !== -1 && startLine === runLast + 1) {
        runLast = startLine;
        runDivider ||= divider;
        if (content !== "") runProse++;
      } else {
        flushRun();
        runStart = startLine;
        runLast = startLine;
        runProse = content === "" ? 0 : 1;
        runDivider = divider;
      }
    } else if (token === typescript.SyntaxKind.MultiLineCommentTrivia) {
      flushRun();
      const body = tokenText.replace(/^\/\*\*?|\*\/$/g, "").replace(/^\s*\*(?=\s|$)/gm, "");
      blocks.push({
        hasDivider: DIVIDER_PATTERN.test(body),
        startLine,
        proseLines: countBlockProse(tokenText),
        kind: tokenText.startsWith("/**") ? "jsdoc" : "inline",
      });
    } else if (
      token !== typescript.SyntaxKind.WhitespaceTrivia &&
      token !== typescript.SyntaxKind.NewLineTrivia
    ) {
      flushRun();
      previousToken = token;
    }
    token = scanner.scan();
    // A bare scanner has no parser context: without these rescans, text after a
    // template `${}` and a regex literal's slashes would be read as comments.
    if (token === typescript.SyntaxKind.TemplateHead) {
      templateDepths.push(braceDepth);
    } else if (token === typescript.SyntaxKind.OpenBraceToken) {
      braceDepth++;
    } else if (token === typescript.SyntaxKind.CloseBraceToken) {
      if (templateDepths.at(-1) === braceDepth) {
        token = scanner.reScanTemplateToken(false);
        if (token === typescript.SyntaxKind.TemplateTail) templateDepths.pop();
      } else {
        braceDepth--;
      }
    } else if (
      (token === typescript.SyntaxKind.SlashToken || token === typescript.SyntaxKind.SlashEqualsToken) &&
      !VALUE_END_TOKENS.has(previousToken)
    ) {
      token = scanner.reScanSlashToken();
    }
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
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, SCANNED_EXTENSIONS));
  const violations: Violation[] = [];
  for (const filePath of files) {
    for (const block of extractComments(readFileSync(filePath, "utf8"))) {
      const location = { filePath: relative(ROOT_DIR, filePath), line: block.startLine };
      if (block.proseLines > MAX_PROSE_LINES[block.kind]) {
        violations.push({
          ...location,
          message: `${block.proseLines} prose lines (${block.kind} cap ${MAX_PROSE_LINES[block.kind]})`,
        });
      }
      if (block.hasDivider) violations.push({ ...location, message: "divider comment, delete it" });
    }
  }

  reportViolations(
    `Scanning ${files.length} source file(s) for over-long comments...`,
    `No comment blocks exceed ${MAX_PROSE_LINES.jsdoc} (JSDoc) or ` +
      `${MAX_PROSE_LINES.inline} (inline) prose lines, and no divider comments.`,
    violations.map(violation => `${violation.filePath}:${violation.line}  :  ${violation.message}`),
    `\nFound ${violations.length} comment violation(s). Trim over-long blocks to the ` +
      `cap and state why, not what; @param/@returns lines are exempt. Delete divider ` +
      `comments: order the code instead of labelling sections.`,
  );
}

main();
