import { readFileSync } from "fs";
import { join, relative, sep } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/** The UI5 frontend is the surface this rule governs. */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/** Matches `import X from "module"` and captures the module path. */
const IMPORT_DECL = /^\s*import\s+[^"']*?from\s+["']([^"']+)["']/;

/** A line that is only comment text cannot hold a call. */
const COMMENT_LINE = /^\s*(\/\/|\/?\*)/;

interface Funnel {
  /** The helper every caller goes through; it lives in the Life OS shared UI5 library. */
  helper: string;
  /** Modules only the helper may import. Scanned in tests too. */
  modules: string[];
  /** Hand-rolled forms of the helper's job. Source only — OPA and fakes need them. */
  patterns: { regex: RegExp; label: string }[];
}

/**
 * Cross-cutting UI concerns each funnel through one helper in `Shared/app/`. MessageStrip
 * is absent on purpose — it is a declarative XML control, not an imperative call.
 */
const FUNNELS: Funnel[] = [
  {
    helper: "Messaging.ts",
    modules: ["sap/m/MessageToast", "sap/m/MessageBox", "sap/m/MessagePopover"],
    patterns: [
      // A `{ getView }` stand-in means the helper did not accept the caller's real host.
      { regex: /new\s+Messaging\(\s*\{/, label: "Messaging host shim" },
    ],
  },
  {
    helper: "DialogManager.ts",
    modules: ["sap/ui/core/Fragment"],
    patterns: [
      { regex: /\.loadFragment\(/, label: "loadFragment call" },
      { regex: /["']sap\.m\.Dialog["']/, label: "dialog lookup by class" },
    ],
  },
];

interface Hit {
  label: string;
  line: number;
}

/**
 * Tells whether a file sits under a test folder, where OPA matchers and fakes
 * legitimately name dialog classes and stand-in hosts.
 * @param filePath Absolute path of the file.
 * @returns True for a file under any `test` folder.
 */
function isTestFile(filePath: string): boolean {
  return relative(ROOT_DIR, filePath).split(sep).includes("test");
}

/**
 * Collects one funnel's violations in one file.
 * @param filePath Absolute path of the file.
 * @param lines The file's lines.
 * @param funnel The helper funnel to check.
 * @returns The offending lines.
 */
function scanFunnel(filePath: string, lines: string[], funnel: Funnel): Hit[] {
  if (filePath === join(ROOT_DIR, "app", funnel.helper)) return [];
  const sourceOnly = !isTestFile(filePath);
  const hits: Hit[] = [];
  lines.forEach((text, index) => {
    const match = IMPORT_DECL.exec(text);
    if (match && funnel.modules.includes(match[1])) {
      hits.push({ label: match[1], line: index + 1 });
    }
    if (!sourceOnly || COMMENT_LINE.test(text)) return;
    for (const pattern of funnel.patterns) {
      if (pattern.regex.test(text))
        hits.push({ label: pattern.label, line: index + 1 });
    }
  });
  return hits.map(hit => ({
    ...hit,
    label: `${hit.label} → ${funnel.helper}`,
  }));
}

/**
 * Scans the UI5 frontend for messaging and dialog work done around the shared
 * Messaging and DialogManager helpers, and exits non-zero when any is found.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"]));
  const violations = files.flatMap(filePath => {
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    const hits = FUNNELS.flatMap(funnel => scanFunnel(filePath, lines, funnel));
    if (hits.length === 0) return [];
    const names = hits.map(hit => `${hit.label} (l.${hit.line})`).join(", ");
    return [`${relative(ROOT_DIR, filePath)}  —  ${names}`];
  });

  reportViolations(
    `Scanning ${files.length} frontend file(s) for messaging and dialog work outside the shared helpers...`,
    "All messaging and dialog work funnels through the shared helpers.",
    violations,
    `\nRoute it through the Life OS shared UI5 library (Shared/app/): ` +
      `\`new Messaging(host)\` takes a Controller or an ExtensionAPI as-is; ` +
      `\`new DialogManager(host)\` owns fragment loading (open/openWithModel/close) ` +
      `and finding a dialog's model from an event (readModel).`,
  );
}

main();
