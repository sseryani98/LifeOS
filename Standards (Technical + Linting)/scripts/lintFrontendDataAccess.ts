import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/** The UI5 frontend is the surface this rule governs. */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/**
 * The view layer: freestyle controllers and Fiori Elements extensions. OData
 * calls placed here are the violation — they belong in a model/ service class.
 */
const VIEW_LAYER_DIR = /\/(controller|ext)\//;

/**
 * OData V4 APIs that fire (or bind) a backend call. These identifiers are
 * unambiguous — they exist only on OData bindings/models — so any occurrence in
 * the view layer is flagged regardless of the receiver.
 */
const ODATA_CALL_TOKENS: { pattern: RegExp; api: string }[] = [
  { pattern: /\.bindContext\s*\(/, api: "bindContext()" },
  { pattern: /\.bindList\s*\(/, api: "bindList()" },
  { pattern: /\.invoke\s*\(/, api: "invoke()" },
  { pattern: /\.callFunction\s*\(/, api: "callFunction()" },
  { pattern: /\.submitBatch\s*\(/, api: "submitBatch()" },
  { pattern: /new\s+ODataModel\s*\(/, api: "new ODataModel()" },
];

/** V2 CRUD verbs — generic words, so flagged only on a getModel()-derived var. */
const V2_CRUD_CALL = /\b(\w+)\.(create|read|update|remove)\s*\(/g;

/** Captures a variable assigned the result of a `.getModel(...)` call. */
const MODEL_VAR_ASSIGN = /\b(\w{3,})\s*=\s*[^=;][^;]*\.getModel\s*\(/g;

interface Violation {
  filePath: string;
  hits: { api: string; line: number }[];
}

/**
 * Collects the names of local variables assigned from a `.getModel()` call, so
 * generic CRUD verbs (create/read/update/remove) can be attributed to a model.
 * @param source Full file text.
 * @returns The set of model-bound variable names in the file.
 */
function collectModelVars(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(MODEL_VAR_ASSIGN)) {
    names.add(match[1]);
  }
  return names;
}

/**
 * Scans one view-layer file for OData calls that belong in a model/ service.
 * @param filePath Absolute path of the file to scan.
 * @returns A violation listing the offending calls, or null when clean.
 */
function scanFile(filePath: string): Violation | null {
  const source = readFileSync(filePath, "utf8");
  const modelVars = collectModelVars(source);
  const hits: { api: string; line: number }[] = [];
  source.split(/\r?\n/).forEach((text, index) => {
    for (const token of ODATA_CALL_TOKENS) {
      if (token.pattern.test(text)) hits.push({ api: token.api, line: index + 1 });
    }
    for (const crud of text.matchAll(V2_CRUD_CALL)) {
      if (modelVars.has(crud[1])) {
        hits.push({ api: `${crud[1]}.${crud[2]}()`, line: index + 1 });
      }
    }
  });
  if (hits.length === 0) return null;
  return { filePath: relative(ROOT_DIR, filePath), hits };
}

/**
 * Scans freestyle controllers and Fiori Elements extensions for direct OData
 * calls and exits non-zero when any are found. Keeps the view layer free of
 * backend access — every OData call belongs in the app's model/ service class
 * (MVC), the way ConnectionService owns AdminService for the Connection Manager.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"])).filter(
    file => VIEW_LAYER_DIR.test(relative(ROOT_DIR, file).replace(/\\/g, "/")),
  );
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  reportViolations(
    `Scanning ${files.length} view-layer file(s) for direct OData calls...`,
    "No OData calls in the view layer — all backend access is in model/.",
    violations.map(violation => {
      const names = violation.hits
        .map(hit => `${hit.api} (l.${hit.line})`)
        .join(", ");
      return `${violation.filePath}  —  ${names}`;
    }),
    `\nFound OData call(s) in the view layer. Move backend access into the app's ` +
      `model/ service class (e.g. \`model/XxxService.ts\`), expose an intent-named ` +
      `method, and call it from the controller: ` +
      `\`private _service!: XxxService\` set in onInit, then \`this._service.doThing()\`.`,
  );
}

main();
