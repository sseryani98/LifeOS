import { readdirSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const APP_DIR = join(process.cwd(), 'app');

/**
 * Attributes that carry user-facing text and should use {i18n>...} bindings.
 */
const TEXT_ATTRIBUTES = new Set([
  'text',
  'title',
  'tooltip',
  'placeholder',
  'label',
  'headerText',
  'subHeaderText',
  'subtitle',
  'description',
  'footerText',
  'introText',
  'noDataText',
  'infoText',
  'valueStateText',
  'growingTriggerText',
  'moreText',
]);

const SUPPRESSION_COMMENT = '<!-- lint-i18n-ignore -->';

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
  const entries = readdirSync(rootDir, { recursive: true, encoding: 'utf8' });
  return entries
    .filter((entry) => entry.endsWith('.view.xml') || entry.endsWith('.fragment.xml'))
    .map((entry) => join(rootDir, entry))
    .sort();
}

/**
 * Checks whether a value is exempt from i18n enforcement.
 * Binding expressions, empty strings, icon URIs, booleans, and numbers are exempt.
 */
function isExemptValue(value: string): boolean {
  if (value === '') return true;
  if (value.startsWith('{')) return true;
  if (value.startsWith('sap-icon://')) return true;
  if (value === 'true' || value === 'false') return true;
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
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations: Violation[] = [];
  const relativePath = relative(process.cwd(), filePath);

  const attrPattern = [...TEXT_ATTRIBUTES].join('|');
  const regex = new RegExp(
    `\\b(${attrPattern})\\s*=\\s*(["'])((?:(?!\\2).)*)\\2`,
    'g',
  );

  let insideComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track multi-line XML comments
    if (insideComment) {
      if (trimmed.includes('-->')) {
        insideComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('<!--')) {
      if (!trimmed.includes('-->')) {
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
 * Scans all SAPUI5 XML view and fragment files for hardcoded strings
 * that should use {i18n>...} bindings. Exits with code 1 if violations found.
 */
function main(): void {
  console.log('Scanning SAPUI5 XML files for hardcoded strings...\n');

  const xmlFiles = findXmlFiles(APP_DIR);

  if (xmlFiles.length === 0) {
    console.log('No XML view or fragment files found under app/.');
    process.exit(0);
  }

  const allViolations: Violation[] = [];
  const filesWithViolations = new Set<string>();

  for (const file of xmlFiles) {
    const violations = scanFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      filesWithViolations.add(violations[0].filePath);
    }
  }

  if (allViolations.length === 0) {
    console.log(`Scanned ${xmlFiles.length} file(s) — no hardcoded strings found.`);
    process.exit(0);
  }

  for (const violation of allViolations) {
    console.log(
      `${violation.filePath}:${violation.line}  ${violation.attribute}="${violation.value}"`,
    );
  }

  console.log(
    `\nFound ${allViolations.length} hardcoded string(s) in ${filesWithViolations.size} file(s).`,
  );
  process.exit(1);
}

main();
