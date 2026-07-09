import { readdirSync, readFileSync } from "fs";
import { basename, join, relative } from "path";

const ROOT_DIR = process.cwd();

/**
 * Backend TypeScript is the only surface the domain-types convention governs.
 * The `{domain}/types.ts` rule (CLAUDE.md) lives under srv/; app/ (UI5) and
 * scripts/ have their own idioms and no equivalent shared-contract convention.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "srv")];

const SKIP_SEGMENTS = new Set([
  "node_modules",
  "gen",
  "dist",
  "coverage",
  ".git",
]);

/** The one filename allowed to declare a domain's exported types. */
const TYPES_FILE = "types.ts";

/**
 * Matches a top-level EXPORTED type declaration — `export interface Foo` or
 * `export type Foo = …`. Requiring a name after the keyword (`[A-Za-z_$]`) means
 * re-export blocks (`export type { X } from …`) and `export type *` are ignored.
 * Non-exported (module-private) types are deliberately NOT matched: they are one
 * file's implementation detail, not a shared contract, so they may stay local.
 */
const EXPORTED_TYPE_DECL = /^export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/;

interface TypeDeclaration {
  name: string;
  line: number;
}

interface Violation {
  filePath: string;
  declarations: TypeDeclaration[];
}

/**
 * Recursively collects scannable TypeScript source files under a directory,
 * excluding generated shims (`*.d.ts`) and the skip-listed build/vendor folders.
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
 * Scans one file for exported type declarations that belong in a types.ts.
 * Files named types.ts are the designated home and are skipped.
 * @param filePath Absolute path of the file to scan.
 * @returns A violation listing the misplaced declarations, or null when clean.
 */
function scanFile(filePath: string): Violation | null {
  if (basename(filePath) === TYPES_FILE) return null;
  const declarations: TypeDeclaration[] = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    const match = EXPORTED_TYPE_DECL.exec(text);
    if (match) {
      declarations.push({ name: match[1], line: index + 1 });
    }
  });
  if (declarations.length === 0) return null;
  return { filePath: relative(ROOT_DIR, filePath), declarations };
}

/**
 * Scans backend TypeScript for exported `interface`/`type` declarations living
 * outside a types.ts and exits non-zero when any are found. Keeps a domain's
 * shared type contracts in one place instead of scattered atop service classes.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(collectFiles);
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  console.log(
    `Scanning ${files.length} backend file(s) for misplaced exported types...`,
  );

  if (violations.length === 0) {
    console.log("All exported domain types live in a types.ts.");
    process.exit(0);
  }

  console.log();
  for (const violation of violations) {
    const names = violation.declarations
      .map(entry => `${entry.name} (l.${entry.line})`)
      .join(", ");
    console.log(`${violation.filePath}  —  ${names}`);
  }
  console.log(
    `\nFound exported type declaration(s) outside a types.ts. Move each ` +
      `\`export interface\`/\`export type\` into the domain's types.ts ` +
      `(e.g. srv/modules/integration/types.ts). Non-exported, file-private ` +
      `types may stay local.`,
  );
  process.exit(1);
}

main();
