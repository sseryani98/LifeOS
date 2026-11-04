import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * UI5 views/fragments and app manifests both live here — the XML scan covers
 * redundant control defaults, the manifest scan FE column overrides.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/**
 * Pairs that are the default wherever they can legally appear, so a flat line
 * match never false-positives. `editable`/`expanded` are excluded: their
 * defaults are control-specific, so a flat match could not tell redundant from
 * required.
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

/**
 * FE derives an annotation-backed column's alignment from its Edm type
 * (timestamps and numbers end-align), so a manifest `horizontalAlign` on a
 * `DataField…::` column overrides a framework default. Custom columns keep it:
 * they have no type for FE to align by.
 */
const ANNOTATION_COLUMN_KEY = /^DataField\w*::/;

function scanManifest(filePath: string): Violation[] {
  const text = readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const violations: Violation[] = [];
  const visitNode = (node: unknown): void => {
    if (node === null || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (key === "columns" && child !== null && typeof child === "object") {
        for (const [columnKey, column] of Object.entries(child)) {
          if (
            ANNOTATION_COLUMN_KEY.test(columnKey) &&
            column !== null &&
            typeof column === "object" &&
            "horizontalAlign" in column
          ) {
            const keyLine = lines.findIndex(line =>
              line.includes(`"${columnKey}"`),
            );
            violations.push({
              filePath: relative(ROOT_DIR, filePath),
              line: keyLine + 1,
              text: columnKey,
              match: "horizontalAlign",
            });
          }
        }
      }
      visitNode(child);
    }
  };
  visitNode(JSON.parse(text));
  return violations;
}

function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".xml"]));
  const manifests = SOURCE_DIRS.flatMap(dir =>
    collectFiles(dir, ["manifest.json"]),
  );
  const violations = [
    ...files.flatMap(scanFile),
    ...manifests.flatMap(scanManifest),
  ];

  reportViolations(
    `Scanning ${files.length} UI5 view(s) and ${manifests.length} manifest(s) for redundant defaults...`,
    "No redundant default attributes found.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  "${violation.match}"  →  ${violation.text}`,
    ),
    `\nFound ${violations.length} redundant default attribute(s). ` +
      `visible/enabled default to true on every control — omit them. ` +
      `(Control-specific defaults like SimpleForm.editable and Panel.expanded ` +
      `are intentionally NOT flagged; setting those to true can be required.) ` +
      `Manifest horizontalAlign on a DataField:: column overrides FE's type-derived ` +
      `alignment — remove it; only custom (template) columns may set it.`,
  );
}

main();
