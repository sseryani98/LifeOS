import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * Only UI5 views/fragments live here — the redundant-default attribute problem
 * is a UI5 XML concern, so we scan nothing else.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/**
 * Redundant attribute=value pairs, safe to flag by a flat line match because
 * each is always the control's default wherever the pair can legally appear:
 *   - `visible`/`enabled` default true on EVERY control (Control base), so the
 *     pair is noise anywhere it occurs.
 *   - `layout="ResponsiveGridLayout"` is control-specific, but that value
 *     string only ever sits on `SimpleForm.layout`, where it IS the default
 *     (since UI5 1.16) — so matching the value alone can't false-positive.
 * `editable`/`expanded` stay excluded: their defaults are control-specific AND
 * their values (`true`) are shared, so a flat match couldn't tell a redundant
 * one from a required one. Guidance handles those, not this rule.
 */
const REDUNDANT_DEFAULTS: Array<{ attr: string; value: string }> = [
  { attr: "visible", value: "true" },
  { attr: "enabled", value: "true" },
  { attr: "layout", value: "ResponsiveGridLayout" },
];

interface Violation {
  filePath: string;
  line: number;
  text: string;
  match: string;
}

/**
 * Requires a preceding whitespace char so `someVisible="true"` can never match
 * as a substring; accepts either quote style and tolerant spacing around `=`.
 */
const PATTERNS = REDUNDANT_DEFAULTS.map(({ attr, value }) => ({
  attr,
  value,
  regex: new RegExp(`\\s${attr}\\s*=\\s*["']${value}["']`),
}));

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    for (const { attr, value, regex } of PATTERNS) {
      if (regex.test(text)) {
        violations.push({
          filePath: relative(ROOT_DIR, filePath),
          line: index + 1,
          text: text.trim(),
          match: `${attr}="${value}"`,
        });
      }
    }
  });
  return violations;
}

function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".xml"]));
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} UI5 view(s) for redundant default attributes...`,
    "No redundant default attributes found.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  "${violation.match}"  →  ${violation.text}`,
    ),
    `\nFound ${violations.length} redundant default attribute(s). ` +
      `visible/enabled default to true on every control — omit them. ` +
      `(Control-specific defaults like SimpleForm.editable and Panel.expanded ` +
      `are intentionally NOT flagged; setting those to true can be required.)`,
  );
}

main();
