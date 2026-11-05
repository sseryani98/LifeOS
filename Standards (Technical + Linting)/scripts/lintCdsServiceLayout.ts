import { existsSync, readdirSync, readFileSync } from "fs";
import { basename, join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

const SRV_DIR = join(ROOT_DIR, "srv");

/**
 * Each declaration kind a service can hold, keyed by the one file it lives in.
 * A service's root `{name}-service.cds` is a shell; its members sit in
 * `srv/{service}/{kind}.cds` as `extend service … with`, so no file mixes kinds.
 */
const KIND_FILES: Record<string, { label: string; pattern: RegExp }[]> = {
  "entities.cds": [{ label: "entity", pattern: /^\s*entity\s+\w+/m }],
  "types.cds": [{ label: "type", pattern: /^\s*type\s+\w+/m }],
  "actions.cds": [
    { label: "action/function", pattern: /^\s*(?:action|function)\s+\w+/m },
    { label: "bound actions", pattern: /^\s*extend\s+[\w.]+\s+with\s+actions\b/m },
  ],
  "calculations.cds": [
    { label: "calculated column", pattern: /\bcase\b/ },
    { label: "extend projection", pattern: /^\s*extend\s+projection\b/m },
  ],
  "annotations.cds": [{ label: "annotate", pattern: /^\s*annotate\s+/m }],
};

/** A service declaration; the shell's body must be empty. */
const SERVICE_DECL = /^\s*service\s+\w+/m;
const EMPTY_SERVICE = /^\s*service\s+\w+[^{]*\{\s*\}/m;

interface Violation {
  filePath: string;
  message: string;
}

/**
 * Blanks comments and string literals so a keyword in prose or a label
 * (`'{i18n>Type}'`) never reads as a declaration.
 * @param source raw CDS text
 * @returns the text with comments and strings replaced by spaces
 */
function stripNoise(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, " "))
    .replace(/\/\/.*$/gm, "")
    .replace(/'(?:[^'\n]|'')*'/g, "''");
}

/**
 * Lists every declaration kind the text contains.
 * @param source comment-stripped CDS text
 * @returns [kind file, label] pairs found in the text
 */
function findKinds(source: string): [string, string][] {
  return Object.entries(KIND_FILES).flatMap(([file, kinds]) =>
    kinds.filter(kind => kind.pattern.test(source)).map(kind => [file, kind.label] as [string, string]),
  );
}

/**
 * Checks one srv/ CDS file against the shell-plus-kind-files layout.
 * @param filePath absolute path of the CDS file
 * @returns the layout violations in that file
 */
function scanFile(filePath: string): Violation[] {
  const source = stripNoise(readFileSync(filePath, "utf8"));
  const rel = relative(ROOT_DIR, filePath);
  const name = basename(filePath);
  const kinds = findKinds(source);

  if (SERVICE_DECL.test(source)) {
    const violations: Violation[] = kinds.map(([file, label]) => ({
      filePath: rel,
      message: `service shell declares a ${label} → move it to srv/{service}/${file}`,
    }));
    if (kinds.length === 0 && !EMPTY_SERVICE.test(source)) {
      violations.push({ filePath: rel, message: "service shell body is not empty" });
    }
    return violations;
  }

  if (!(name in KIND_FILES)) {
    return [
      {
        filePath: rel,
        message: `"${name}" is not a service kind file (${Object.keys(KIND_FILES).join(", ")})`,
      },
    ];
  }

  return kinds
    .filter(([file]) => file !== name)
    .map(([file, label]) => ({
      filePath: rel,
      message: `${name} declares a ${label} → it belongs in ${file}`,
    }));
}

/**
 * Checks the module's CLAUDE.md folder tree names every `srv/{service}/` member folder — by its
 * own name or the `{service-name}/` placeholder — so the tree cannot silently fall behind a split.
 * @returns one violation per member folder the tree omits
 */
function scanClaudeTree(): Violation[] {
  const claudePath = join(ROOT_DIR, "CLAUDE.md");
  if (!existsSync(SRV_DIR) || !existsSync(claudePath)) return [];
  const claude = readFileSync(claudePath, "utf8");
  if (claude.includes("{service-name}/")) return [];

  return readdirSync(SRV_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(SRV_DIR, `${entry.name}-service.cds`)))
    // A tree entry, not a path mention — `modules/tracker/` must not satisfy `tracker/`.
    .filter(entry => !new RegExp(`^[\\s│├└─|]*${entry.name}/(\\s|$)`, "m").test(claude))
    .map(entry => ({
      filePath: "CLAUDE.md",
      message: `folder tree omits srv/${entry.name}/ (the ${entry.name}-service.cds member folder)`,
    }));
}

function main(): void {
  const files = collectFiles(SRV_DIR, [".cds"]);
  const violations = [...files.flatMap(scanFile), ...scanClaudeTree()];

  reportViolations(
    `Scanning ${files.length} srv/ CDS file(s) for service layout...`,
    "Every service is a shell plus one file per declaration kind.",
    violations.map(violation => `${violation.filePath}  ${violation.message}`),
    `\nFound ${violations.length} service layout violation(s). A {name}-service.cds holds ` +
      `only \`using\` lines and an empty \`service X @(path) {}\`; its members go in ` +
      `srv/{service}/entities.cds, types.cds, actions.cds, calculations.cds (case/when ` +
      `columns via \`extend projection\`) and annotations.cds, each an \`extend service\`.`,
  );
}

main();
