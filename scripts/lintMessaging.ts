import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const ROOT_DIR = process.cwd();

/** The UI5 frontend is the surface this rule governs. */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

const SKIP_SEGMENTS = new Set([
  "node_modules",
  "gen",
  "dist",
  "coverage",
  ".git",
]);

/**
 * The imperative user-messaging modules that must funnel through the shared
 * Messaging helper. MessageStrip is intentionally absent — it is a declarative
 * XML control (view-level), not an imperative call scattered across controllers.
 */
const BANNED_MODULES = new Set([
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/m/MessagePopover",
]);

/** The one module allowed to import the banned modules — the shared funnel. */
const ALLOWED_FILE = join(ROOT_DIR, "app", "shared", "Messaging.ts");

/** Matches `import X from "module"` and captures the module path. */
const IMPORT_DECL = /^\s*import\s+[^"']*?from\s+["']([^"']+)["']/;

interface Violation {
  filePath: string;
  imports: { module: string; line: number }[];
}

/**
 * Recursively collects scannable TypeScript source files under a directory,
 * excluding generated shims (`*.d.ts`) and skip-listed folders.
 * @param dir Directory to walk.
 * @returns Absolute paths of every scannable `.ts` file beneath it.
 */
function collectFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFiles(full));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Scans one file for direct imports of the banned messaging modules. The shared
 * Messaging helper is the designated home and is skipped.
 * @param filePath Absolute path of the file to scan.
 * @returns A violation listing the offending imports, or null when clean.
 */
function scanFile(filePath: string): Violation | null {
  if (filePath === ALLOWED_FILE) return null;
  const imports: { module: string; line: number }[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    const match = IMPORT_DECL.exec(text);
    if (match && BANNED_MODULES.has(match[1])) {
      imports.push({ module: match[1], line: index + 1 });
    }
  });
  if (imports.length === 0) return null;
  return { filePath: relative(ROOT_DIR, filePath), imports };
}

/**
 * Scans the UI5 frontend for direct MessageToast/MessageBox/MessagePopover
 * imports outside the shared Messaging helper and exits non-zero when any are
 * found. Keeps all imperative user messaging behind one funnel (i18n resolution,
 * consistent UX) instead of scattered across controllers.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(collectFiles);
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  console.log(
    `Scanning ${files.length} frontend file(s) for direct messaging imports...`,
  );

  if (violations.length === 0) {
    console.log("All user messaging funnels through the shared Messaging helper.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    const names = violation.imports
      .map(entry => `${entry.module} (l.${entry.line})`)
      .join(", ");
    console.log(`${violation.filePath}  —  ${names}`);
  }
  console.log(
    `\nFound direct messaging import(s) outside app/shared/Messaging.ts. Route ` +
      `user messaging through the shared helper instead: ` +
      `\`private readonly _messages = new Messaging(this)\`, then ` +
      `\`this._messages.showToast("i18nKey")\` / .showError / .showWarning / ` +
      `.showSuccess / .showConfirm.`,
  );
  process.exit(1);
}

main();
