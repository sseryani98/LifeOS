import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * UI5 views and fragments only — control IDs are an XML-view concern, so no
 * other source tree is scanned.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

interface ControlId {
  className: string;
  idValue: string;
  offset: number;
}

interface Violation {
  className: string;
  filePath: string;
  idValue: string;
  line: number;
}

/**
 * Locates every opening tag carrying an `id` attribute, pairing the id value
 * with the control's class name (tag name minus any namespace prefix).
 * Comments are blanked and the tag scan is quote-aware, so `>`/`<` inside
 * binding expressions (`{model>/path}`) never truncate a tag.
 * @param content the raw XML file text
 * @returns one entry per id-bearing control tag
 */
function collectControlIds(content: string): ControlId[] {
  const blanked = content.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\n]/g, " "));
  const results: ControlId[] = [];
  const tagStart = /<([A-Za-z_][\w.]*)(?::([A-Za-z_][\w.]*))?/g;
  let match: RegExpExecArray | null;
  while ((match = tagStart.exec(blanked)) !== null) {
    const className = match[2] ?? match[1];
    const attrsStart = tagStart.lastIndex;
    const closeIndex = findTagClose(blanked, attrsStart);
    const attrs = blanked.slice(attrsStart, closeIndex);
    const idMatch = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(attrs);
    if (idMatch) {
      results.push({
        className,
        idValue: idMatch[1] ?? idMatch[2],
        offset: attrsStart + idMatch.index,
      });
    }
    tagStart.lastIndex = closeIndex;
  }
  return results;
}

/**
 * Scans forward from a tag's attribute region to the `>` that closes the
 * opening tag, ignoring any `>` inside a quoted attribute value.
 * @param content the raw XML text
 * @param from the index just past the tag name
 * @returns the index of the closing `>` (or end of content)
 */
function findTagClose(content: string, from: number): number {
  let quote: string | null = null;
  for (let pos = from; pos < content.length; pos++) {
    const char = content[pos];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return pos;
    }
  }
  return content.length;
}

/**
 * Mirrors the UI5 Language Support editor rule: an id must start with `id`
 * and end with its control's class name (`^id.*?<ClassName>$`), keeping IDs
 * self-documenting about the control they address.
 * @param idValue the id attribute value
 * @param className the control's class name
 * @returns true when the id satisfies the pattern
 */
function matchesPattern(idValue: string, className: string): boolean {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^id.*?${escaped}$`).test(idValue);
}

function resolveLineNumber(content: string, offset: number): number {
  let line = 1;
  for (let pos = 0; pos < offset; pos++) {
    if (content[pos] === "\n") line++;
  }
  return line;
}

function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const violations: Violation[] = [];
  for (const { className, idValue, offset } of collectControlIds(content)) {
    if (!matchesPattern(idValue, className)) {
      violations.push({
        className,
        filePath: relative(ROOT_DIR, filePath),
        idValue,
        line: resolveLineNumber(content, offset),
      });
    }
  }
  return violations;
}

function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".xml"]));
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} UI5 view(s) for control-ID naming...`,
    "All control IDs match ^id.*?<ControlClass>$.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  "${violation.idValue}"  should match  ^id.*?${violation.className}$`,
    ),
    `\nFound ${violations.length} control ID(s) not matching ^id.*?<ControlClass>$. ` +
      `Every control id must start with "id" and end with its control's class name ` +
      `(e.g. a sap.m.Button id → idNavBackButton).`,
  );
}

main();
