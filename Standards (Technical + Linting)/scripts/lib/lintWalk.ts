import { existsSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Directory names every linter skips — dependencies, build output, VCS
 * metadata, and generated model shims. One list for the whole suite, because
 * per-script copies drifted (some had "@cds-models", most did not).
 */
export const SKIP_SEGMENTS = new Set([
  "node_modules",
  "gen",
  "dist",
  "coverage",
  ".git",
  "@cds-models",
]);

/**
 * Recursively collects files under a directory whose names end with one of the
 * given suffixes, skipping SKIP_SEGMENTS trees and `.d.ts` declaration shims.
 * A missing root returns [] rather than throwing: linters scan the union of
 * trees any module might have, and no module has all of them.
 * @param dir Directory to walk.
 * @param extensions File-name suffixes to match (e.g. [".ts"], [".test.ts"]).
 * @returns Absolute paths of every matching file beneath dir.
 */
export function collectFiles(dir: string, extensions: string[]): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_SEGMENTS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectFiles(full, extensions));
    } else if (
      extensions.some(ext => entry.name.endsWith(ext)) &&
      !entry.name.endsWith(".d.ts")
    ) {
      found.push(full);
    }
  }
  return found;
}

/**
 * Prints the suite's shared report shape — the scan headline, then either the
 * success message or one line per violation plus a remediation hint — and
 * exits 0/1 accordingly, so every linter fails a build the same way.
 * @param scanMessage The "Scanning N file(s)…" headline.
 * @param successMessage Printed when there are no violations.
 * @param violationLines One pre-formatted line per violation.
 * @param failureMessage Remediation hint printed after the violation lines.
 * @returns Never — the process exits.
 */
export function reportViolations(
  scanMessage: string,
  successMessage: string,
  violationLines: string[],
  failureMessage: string,
): never {
  console.log(scanMessage);

  if (violationLines.length === 0) {
    console.log(successMessage);
    process.exit(0);
  }

  console.log();
  for (const line of violationLines) {
    console.log(line);
  }
  console.log(failureMessage);
  process.exit(1);
}
