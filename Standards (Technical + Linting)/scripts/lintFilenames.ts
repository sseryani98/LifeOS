import { readdirSync } from "fs";
import { join, basename, relative } from "path";

const ROOT_DIR = process.cwd();

/**
 * Directories where all .ts files must be camelCase.
 */
const CAP_DIRS = [join(ROOT_DIR, "srv"), join(ROOT_DIR, "db")];

/**
 * Files explicitly allowed to deviate (e.g., CAP service entry points are kebab-case by convention).
 */
const ALLOWED_PATTERNS = [/^[a-z]+-[a-z]+\.cds$/, /^[a-z]+-[a-z]+\.ts$/];

/**
 * Checks whether a filename is camelCase (starts lowercase, no hyphens/underscores except leading _).
 */
function isCamelCase(name: string): boolean {
  return /^_?[a-z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Checks whether a filename matches an allowed exception pattern.
 */
function isAllowed(filename: string): boolean {
  return ALLOWED_PATTERNS.some(pattern => pattern.test(filename));
}

interface Violation {
  filePath: string;
  filename: string;
}

/**
 * Scans CAP directories (srv/, db/) for TypeScript and CDS files with non-camelCase names.
 * Service entry points (kebab-case .cds/.ts) are exempt.
 * Exits with code 1 if violations found.
 */
function main(): void {
  const violations: Violation[] = [];
  let totalFiles = 0;

  for (const dir of CAP_DIRS) {
    const entries = readdirSync(dir, { recursive: true, encoding: "utf8" });
    const tsFiles = entries.filter(
      entry => entry.endsWith(".ts") || entry.endsWith(".cds"),
    );

    for (const entry of tsFiles) {
      totalFiles++;
      const filename = basename(entry);
      const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

      if (nameWithoutExt === "schema" || nameWithoutExt === "index") continue;
      if (isAllowed(filename)) continue;

      if (!isCamelCase(nameWithoutExt)) {
        violations.push({
          filePath: relative(ROOT_DIR, join(dir, entry)),
          filename,
        });
      }
    }
  }

  console.log(
    `Scanning ${totalFiles} file(s) in srv/ and db/ for naming violations...`,
  );

  if (violations.length === 0) {
    console.log(`All ${totalFiles} file(s) follow camelCase naming.`);
    process.exit(0);
  }

  console.log();

  for (const violation of violations) {
    console.log(
      `${violation.filePath}  filename "${violation.filename}" is not camelCase`,
    );
  }

  console.log(
    `\nFound ${violations.length} naming violation(s). CAP files must be camelCase.`,
  );
  process.exit(1);
}

main();
