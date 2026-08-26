import { readFileSync } from "fs";
import { basename, join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * The TypeScript surfaces the types-in-a-types.ts convention governs: srv/
 * ({domain}/types.ts), app/ (each UI5 app's model/types.ts) and mcp/ where a
 * module has one. scripts/ is tooling with its own idioms and no equivalent
 * shared-contract convention. A tree a module does not have is skipped.
 */
const SOURCE_DIRS = [
  join(ROOT_DIR, "srv"),
  join(ROOT_DIR, "app"),
  join(ROOT_DIR, "mcp"),
];

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
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"]));
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  reportViolations(
    `Scanning ${files.length} TypeScript file(s) for misplaced types...`,
    "All domain types live in a types.ts.",
    violations.map(violation => {
      const names = violation.declarations
        .map(entry => `${entry.name} (l.${entry.line})`)
        .join(", ");
      return `${violation.filePath}  —  ${names}`;
    }),
    `\nFound type declaration(s) outside a types.ts. Move each into the domain's ` +
      `types.ts (srv/modules/ingestion/types.ts, or a UI5 app's model/types.ts). ` +
      `Exported types always belong there; a file that declares a class may keep ` +
      `no named type beside it either. Private types in non-class modules may stay local.`,
  );
}

main();
