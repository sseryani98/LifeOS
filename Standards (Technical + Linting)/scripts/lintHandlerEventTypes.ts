import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/** Event handlers live in freestyle controllers and FE extensions only. */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/** Only `controller/` and `ext/` hold XML-bound handlers (V+C layers). */
const HANDLER_DIRS = ["controller", "ext"];

/**
 * A public handler whose first parameter is annotated with the bare `Event`.
 * `on[A-Z]` skips private `_on…` helpers and native listeners; the capture is
 * the method name for reporting.
 */
const HANDLER_PARAM = /\b(on[A-Z]\w*)\s*\(\s*\w+\s*:\s*Event\b/g;

/**
 * An import binding named exactly `Event`. The `\b…\b` guards stop
 * `Button$PressEvent` (no word boundary before its `Event`) from counting as a
 * UI5 event import, so only a real `Event` binding suppresses the finding.
 */
const IMPORTS_EVENT = /import\b[\s\S]*?\bEvent\b[\s\S]*?from\s*['"][^'"]+['"]/;

interface Violation {
  filePath: string;
  line: number;
  handler: string;
}

/** True when the file sits under a `controller/` or `ext/` path segment. */
function isHandlerFile(filePath: string): boolean {
  const segments = relative(ROOT_DIR, filePath).split(/[\\/]/);
  return HANDLER_DIRS.some(dir => segments.includes(dir));
}

/**
 * Flags handlers typed with the global DOM `Event`. When the file never imports
 * an `Event` binding, a `: Event` annotation resolves to `lib.dom`'s event —
 * never the UI5 event a handler actually receives.
 * @param filePath the controller/extension file to scan
 * @returns the handlers annotated with the global `Event`
 */
function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  if (IMPORTS_EVENT.test(content)) return [];

  return [...content.matchAll(HANDLER_PARAM)].map(match => ({
    filePath: relative(ROOT_DIR, filePath),
    line: content.slice(0, match.index).split(/\r?\n/).length,
    handler: match[1],
  }));
}

function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"])).filter(
    isHandlerFile,
  );
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} controller/extension file(s) for event-type annotations...`,
    "No handler is typed with the global DOM Event.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  "${violation.handler}"  ` +
        `→ first parameter typed with the global DOM Event`,
    ),
    `\nFound ${violations.length} handler(s) typed with the global DOM Event. A ` +
      `UI5 handler receives a control event (e.g. Button$PressEvent from ` +
      `"sap/m/Button"), never lib.dom's Event. Import the control's event type; ` +
      `TypeScript then enforces the specific shape (matching the ui5plugin ` +
      `EventTypeLinter in-editor).`,
  );
}

main();
