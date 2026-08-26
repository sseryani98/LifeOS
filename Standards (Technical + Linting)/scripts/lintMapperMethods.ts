import { readFileSync } from "fs";
import { join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * Only backend Service classes are governed. Mapping belongs in a
 * `{domain}Mapper.ts`; DataService row-shaping and app/ (UI5) are out of scope.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "srv")];

/**
 * A returned object literal with at least this many fields read off a source
 * shape (`param.field`) is a data mapper, not incidental result-DTO assembly.
 * Below the threshold a small returned object is not worth relocating.
 */
const MAP_PROPERTY_THRESHOLD = 4;

/** A `*Service.ts` file, excluding the DataService and Mapper layers. */
function isGovernedFile(fileName: string): boolean {
  return (
    fileName.endsWith("Service.ts") &&
    !fileName.endsWith("DataService.ts") &&
    !fileName.endsWith("Mapper.ts")
  );
}

/** Opens a method body's `return { … }` object literal. */
const RETURN_OPEN = /^\s*return\s*\{\s*$/;

/** A `name(` method signature — captures the method name for the report. */
const METHOD_SIG = /^\s*(?:public\s+|private\s+|protected\s+|static\s+|async\s+)*([A-Za-z_$][\w$]*)\s*\(/;

/** A `key: value` object-literal property — captures the initializer. */
const PROPERTY = /^\s*[A-Za-z_$][\w$]*\s*:\s*(.+)$/;

/** A `foo.bar` member access — the fingerprint of field-by-field mapping. */
const MEMBER_ACCESS = /[A-Za-z_$][\w$]*\.[A-Za-z_$]/;

interface MapperMethod {
  name: string;
  line: number;
  fields: number;
}

interface Violation {
  filePath: string;
  methods: MapperMethod[];
}

/**
 * Counts direct properties of the object literal opened at `openIndex` whose
 * value reads a member off a source shape (`param.field`). Brace depth is
 * tracked so only top-level fields count and nested objects are skipped.
 * @param lines All lines of the file.
 * @param openIndex Index of the `return {` line.
 * @returns The mapped-field count, or -1 if the object never closes cleanly.
 */
function countMappedFields(lines: string[], openIndex: number): number {
  let depth = 1;
  let mapped = 0;
  for (let cursor = openIndex + 1; cursor < lines.length; cursor++) {
    const text = lines[cursor];
    if (depth === 1) {
      const property = PROPERTY.exec(text);
      if (property && MEMBER_ACCESS.test(property[1])) mapped++;
    }
    for (const char of text) {
      if (char === "{") depth++;
      else if (char === "}") depth--;
    }
    if (depth <= 0) return mapped;
  }
  return -1;
}

/**
 * Scans one Service file for methods whose body is a lone `return { … }` that
 * maps a source shape field-by-field — the transformation that belongs in a
 * Mapper. The nearest preceding method signature names the offender.
 * @param filePath Absolute path of the file to scan.
 * @returns A violation listing the mapper methods found, or null if none.
 */
function scanFile(filePath: string): Violation | null {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const methods: MapperMethod[] = [];
  let currentMethod = "(anonymous)";
  lines.forEach((text, index) => {
    const signature = METHOD_SIG.exec(text);
    if (signature) currentMethod = signature[1];
    if (!RETURN_OPEN.test(text)) return;
    const fields = countMappedFields(lines, index);
    if (fields >= MAP_PROPERTY_THRESHOLD) {
      methods.push({ name: currentMethod, line: index + 1, fields });
    }
  });
  if (methods.length === 0) return null;
  return { filePath: relative(ROOT_DIR, filePath), methods };
}

/**
 * Scans backend Service classes for inline data-mapping methods and exits
 * non-zero when any is found. Keeps external-payload-to-entity translation in a
 * dedicated `{domain}Mapper.ts` instead of bloating the orchestration layer.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"])).filter(
    filePath => isGovernedFile(filePath.split(/[\\/]/).pop() ?? ""),
  );
  const violations = files
    .map(scanFile)
    .filter((violation): violation is Violation => violation !== null);

  reportViolations(
    `Scanning ${files.length} Service file(s) for inline mappers...`,
    "No inline mapper methods found.",
    violations.map(violation => {
      const names = violation.methods
        .map(entry => `${entry.name} (l.${entry.line}, ${entry.fields} mapped fields)`)
        .join(", ");
      return `${violation.filePath}  —  ${names}`;
    }),
    `\nFound inline data-mapping method(s). Move each into a ` +
      `\`{domain}Mapper.ts\` class (e.g. SimpleFINMapper.toTransactionRow) so ` +
      `Services stay orchestration-only. Scalar converters (epoch→ISO) are ` +
      `utilities, not mappers, and are exempt.`,
  );
}

main();
