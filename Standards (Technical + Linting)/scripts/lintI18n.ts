import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const APP_DIR = join(process.cwd(), "app");

/**
 * Attributes that carry user-facing text and should use {i18n>...} bindings.
 */
const TEXT_ATTRIBUTES = new Set([
  "text",
  "title",
  "tooltip",
  "placeholder",
  "label",
  "headerText",
  "subHeaderText",
  "subtitle",
  "description",
  "footerText",
  "introText",
  "noDataText",
  "infoText",
  "valueStateText",
  "growingTriggerText",
  "moreText",
]);

const SUPPRESSION_COMMENT = "<!-- lint-i18n-ignore -->";
const CDS_SUPPRESSION_COMMENT = "// lint-i18n-ignore";

/**
 * Manifest properties that carry user-facing text and must use {{i18nKey}} bindings.
 */
const MANIFEST_TEXT_PROPERTIES = new Set(["title", "description", "subTitle"]);

/**
 * CDS annotation properties that carry user-facing text and must use '{i18n>...}'.
 */
const CDS_TEXT_PROPERTIES = new Set(["TypeName", "TypeNamePlural", "Label"]);

interface Violation {
  filePath: string;
  line: number;
  attribute: string;
  value: string;
}

/**
 * Finds all XML view and fragment files recursively under the given directory.
 */
function findXmlFiles(rootDir: string): string[] {
  const entries = readdirSync(rootDir, { recursive: true, encoding: "utf8" });
  return entries
    .filter(
      entry => entry.endsWith(".view.xml") || entry.endsWith(".fragment.xml"),
    )
    .map(entry => join(rootDir, entry))
    .sort();
}

/**
 * Checks whether a value is exempt from i18n enforcement.
 * Binding expressions, empty strings, icon URIs, booleans, and numbers are exempt.
 */
function isExemptValue(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("{")) return true;
  if (value.startsWith("sap-icon://")) return true;
  if (value === "true" || value === "false") return true;
  if (/^-?\d+(\.\d+)?$/.test(value)) return true;
  return false;
}

/**
 * Checks whether the previous non-blank line is a lint-i18n-ignore suppression comment.
 */
function hasSuppressComment(lines: string[], lineIndex: number): boolean {
  if (lineIndex === 0) return false;
  return lines[lineIndex - 1].trim() === SUPPRESSION_COMMENT;
}

/**
 * Scans a single XML file for hardcoded text attributes and returns violations.
 */
function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  const relativePath = relative(process.cwd(), filePath);

  const attrPattern = [...TEXT_ATTRIBUTES].join("|");
  const regex = new RegExp(
    `\\b(${attrPattern})\\s*=\\s*(["'])((?:(?!\\2).)*)\\2`,
    "g",
  );

  let insideComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track multi-line XML comments
    if (insideComment) {
      if (trimmed.includes("-->")) {
        insideComment = false;
      }
      continue;
    }

    if (trimmed.startsWith("<!--")) {
      if (!trimmed.includes("-->")) {
        insideComment = true;
      }
      continue;
    }

    if (hasSuppressComment(lines, i)) continue;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const attribute = match[1];
      const value = match[3];

      if (!isExemptValue(value)) {
        violations.push({
          filePath: relativePath,
          line: i + 1,
          attribute,
          value,
        });
      }
    }
  }

  return violations;
}

/**
 * Finds all CDS annotation files recursively under the given directory.
 */
function findCdsAnnotationFiles(rootDir: string): string[] {
  const entries = readdirSync(rootDir, { recursive: true, encoding: "utf8" });
  return entries
    .filter(entry => entry.includes("annotations") && entry.endsWith(".cds"))
    .map(entry => join(rootDir, entry))
    .sort();
}

/**
 * Checks whether a CDS string value is an i18n reference.
 */
function isCdsI18nValue(value: string): boolean {
  return /^\{i18n>[^}]+\}$/.test(value);
}

/**
 * Scans a single CDS annotation file for hardcoded text properties.
 * Text properties (TypeName, TypeNamePlural, Label) must use '{i18n>Key}'.
 */
function scanCdsFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  const relativePath = relative(process.cwd(), filePath);

  const propPattern = [...CDS_TEXT_PROPERTIES].join("|");
  const regex = new RegExp(`\\b(${propPattern})\\s*:\\s*'([^']*)'`, "g");

  let insideBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track multi-line CDS comments
    if (insideBlockComment) {
      if (trimmed.includes("*/")) {
        insideBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) {
        insideBlockComment = true;
      }
      continue;
    }

    // Skip single-line comments
    if (trimmed.startsWith("//")) continue;

    // Check for suppression comment on previous line
    if (i > 0 && lines[i - 1].trim() === CDS_SUPPRESSION_COMMENT) continue;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const property = match[1];
      const value = match[2];

      if (!isCdsI18nValue(value)) {
        violations.push({
          filePath: relativePath,
          line: i + 1,
          attribute: property,
          value,
        });
      }
    }
  }

  return violations;
}

/**
 * Finds all manifest.json files recursively under the given directory.
 */
function findManifestFiles(rootDir: string): string[] {
  const entries = readdirSync(rootDir, { recursive: true, encoding: "utf8" });
  return entries
    .filter(entry => entry.endsWith("manifest.json"))
    .map(entry => join(rootDir, entry))
    .sort();
}

/**
 * Checks whether a manifest text value uses {{i18nKey}} binding syntax.
 */
function isManifestI18nValue(value: string): boolean {
  return /^\{\{[^}]+\}\}$/.test(value);
}

/**
 * Scans a single manifest.json for hardcoded text properties.
 * Properties like title, description, subTitle must use {{i18nKey}} syntax.
 */
function scanManifestFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  const relativePath = relative(process.cwd(), filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*"(\w+)"\s*:\s*"([^"]*)"/);
    if (!match) continue;

    const property = match[1];
    const value = match[2];

    if (
      MANIFEST_TEXT_PROPERTIES.has(property) &&
      value !== "" &&
      !isManifestI18nValue(value)
    ) {
      violations.push({
        filePath: relativePath,
        line: i + 1,
        attribute: property,
        value,
      });
    }
  }

  return violations;
}

/**
 * Scans SAPUI5 XML views/fragments, CDS annotations, and manifest.json files
 * for hardcoded strings. Exits with code 1 if violations found.
 */
function main(): void {
  const allViolations: Violation[] = [];
  const filesWithViolations = new Set<string>();

  // ── XML files ──
  const xmlFiles = findXmlFiles(APP_DIR);
  console.log(
    `Scanning ${xmlFiles.length} XML file(s) for hardcoded strings...`,
  );

  for (const file of xmlFiles) {
    const violations = scanFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      filesWithViolations.add(violations[0].filePath);
    }
  }

  // ── CDS annotation files ──
  const cdsFiles = findCdsAnnotationFiles(APP_DIR);
  console.log(
    `Scanning ${cdsFiles.length} CDS annotation file(s) for hardcoded strings...`,
  );

  for (const file of cdsFiles) {
    const violations = scanCdsFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      filesWithViolations.add(violations[0].filePath);
    }
  }

  // ── Manifest files ──
  const manifestFiles = findManifestFiles(APP_DIR);
  console.log(
    `Scanning ${manifestFiles.length} manifest.json file(s) for hardcoded strings...`,
  );

  for (const file of manifestFiles) {
    const violations = scanManifestFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      filesWithViolations.add(violations[0].filePath);
    }
  }

  const totalFiles = xmlFiles.length + cdsFiles.length + manifestFiles.length;

  console.log();

  if (allViolations.length === 0) {
    console.log(`Scanned ${totalFiles} file(s) — no hardcoded strings found.`);
    process.exit(0);
  }

  for (const violation of allViolations) {
    console.log(
      `${violation.filePath}:${violation.line}  ${violation.attribute}="${violation.value}"`,
    );
  }

  console.log(
    `\nFound ${allViolations.length} hardcoded string(s) in ${filesWithViolations.size} of ${totalFiles} file(s).`,
  );
  process.exit(1);
}

main();
