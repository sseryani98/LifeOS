import { readdirSync, readFileSync } from "fs";
import { basename, join, relative } from "path";

const ROOT_DIR = process.cwd();

/**
 * Both TypeScript surfaces the types-in-a-types.ts convention governs: srv/
 * ({domain}/types.ts) and app/ (each UI5 app's model/types.ts). scripts/ is
 * tooling with its own idioms and no equivalent shared-contract convention.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "srv"), join(ROOT_DIR, "app")];

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
 * Matches a top-level type declaration — `interface Foo`/`type Foo = …`, with or
 * without an `export` prefix. Group 1 is the `export ` prefix (present or not),
 * group 2 the name. Requiring a name char after the keyword means re-export blocks
 * (`export type { X } from …`) and `export type *` stay unmatched.
 */
const TYPE_DECL = /^(export\s+)?(?:interface|type)\s+([A-Za-z_$][\w$]*)/;

/**
 * A file that declares a class may hold NO named type beside it — the shape
 * belongs in types.ts, exported or not. Non-class modules keep the laxer rule.
 */
const CLASS_DECL = /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s/m;

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
 * Scans one file for type declarations that belong in a types.ts. Files named
 * types.ts are the designated home and are skipped. Exported types are flagged
 * anywhere; private types are flagged only when the file declares a class.
 * @param filePath Absolute path of the file to scan.
 * @returns A violation listing the misplaced declarations, or null when clean.
 */
function scanFile(filePath: string): Violation | null {
  if (basename(filePath) === TYPES_FILE) return null;
  const source = readFileSync(filePath, "utf8");
  const fileHasClass = CLASS_DECL.test(source);
  const declarations: TypeDeclaration[] = [];
  source.split(/\r?\n/).forEach((text, index) => {
    const match = TYPE_DECL.exec(text);
    if (match && (Boolean(match[1]) || fileHasClass)) {
      declarations.push({ name: match[2], line: index + 1 });
    }
  });
  if (declarations.length === 0) return null;
  return { filePath: relative(ROOT_DIR, filePath), declarations };
}

/**
 * Scans backend TypeScript for `interface`/`type` declarations living outside a
 * types.ts and exits non-zero when any are found. Keeps a domain's type contracts
 * in one place instead of scattered atop the service and data-service classes.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(collectFiles);
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  console.log(
    `Scanning ${files.length} TypeScript file(s) for misplaced types...`,
  );

  if (violations.length === 0) {
    console.log("All domain types live in a types.ts.");
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
    `\nFound type declaration(s) outside a types.ts. Move each into the domain's ` +
      `types.ts (srv/modules/ingestion/types.ts, or a UI5 app's model/types.ts). ` +
      `Exported types always belong there; a file that declares a class may keep ` +
      `no named type beside it either. Private types in non-class modules may stay local.`,
  );
  process.exit(1);
}

main();
