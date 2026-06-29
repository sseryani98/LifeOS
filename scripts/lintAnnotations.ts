import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const APP_DIR = join(process.cwd(), "app");

/**
 * Technical fields that must always be annotated with @UI.Hidden.
 */
const TECHNICAL_FIELDS = [
  "ID",
  "createdAt",
  "createdBy",
  "modifiedAt",
  "modifiedBy",
];

interface Violation {
  filePath: string;
  line: number;
  rule: string;
  message: string;
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
 * Parses annotation blocks from a CDS file.
 * Returns entity UI blocks (with @UI:) and entity field blocks (with @UI.Hidden).
 */
interface EntityUiBlock {
  entityName: string;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Extracts the content between matched braces starting at the given position.
 */
function extractBracedBlock(
  text: string,
  openIndex: number,
): { content: string; endIndex: number } | null {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        return { content: text.slice(openIndex, i + 1), endIndex: i };
      }
    }
  }
  return null;
}

/**
 * Finds all `annotate svc.EntityName with @UI: { ... }` blocks.
 */
function findUiBlocks(content: string): EntityUiBlock[] {
  const blocks: EntityUiBlock[] = [];
  const regex = /annotate\s+svc\.(\w+)\s+with\s+@UI\s*:\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const entityName = match[1];
    const braceStart = match.index + match[0].length - 1;
    const result = extractBracedBlock(content, braceStart);
    if (result) {
      const startLine = content.slice(0, match.index).split("\n").length;
      const endLine = content.slice(0, result.endIndex).split("\n").length;
      blocks.push({
        entityName,
        startLine,
        endLine,
        content: result.content,
      });
    }
  }

  return blocks;
}

/**
 * Finds all `annotate svc.EntityName with { ... }` field-label blocks.
 */
function findFieldBlocks(content: string): EntityUiBlock[] {
  const blocks: EntityUiBlock[] = [];
  const regex = /annotate\s+svc\.(\w+)\s+with\s*\{/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Skip @UI: blocks (already handled)
    const beforeBrace = content.slice(
      Math.max(0, match.index - 10),
      match.index + match[0].length,
    );
    if (beforeBrace.includes("@UI")) continue;

    const entityName = match[1];
    const braceStart = match.index + match[0].length - 1;
    const result = extractBracedBlock(content, braceStart);
    if (result) {
      const startLine = content.slice(0, match.index).split("\n").length;
      const endLine = content.slice(0, result.endIndex).split("\n").length;
      blocks.push({
        entityName,
        startLine,
        endLine,
        content: result.content,
      });
    }
  }

  return blocks;
}

/**
 * Rule 1: Every LineItem Value entry must have ![@HTML5.CssDefaults] with a width.
 */
function checkColumnWidths(
  block: EntityUiBlock,
  filePath: string,
): Violation[] {
  const violations: Violation[] = [];

  // Find the LineItem array content
  const lineItemMatch = block.content.match(/^\s*LineItem\s*[^:]*:\s*\[/m);
  if (!lineItemMatch) return violations;

  const lineItemStart = block.content.indexOf(lineItemMatch[0]);
  const bracketStart = block.content.indexOf("[", lineItemStart);

  // Extract the LineItem array by matching brackets
  let depth = 0;
  let lineItemEnd = bracketStart;
  for (let i = bracketStart; i < block.content.length; i++) {
    if (block.content[i] === "[") depth++;
    else if (block.content[i] === "]") {
      depth--;
      if (depth === 0) {
        lineItemEnd = i;
        break;
      }
    }
  }

  const lineItemContent = block.content.slice(bracketStart, lineItemEnd + 1);

  // Count Value entries and CssDefaults entries
  const valueEntries = [...lineItemContent.matchAll(/\bValue\s*:/g)];
  const cssDefaults = [...lineItemContent.matchAll(/HTML5\.CssDefaults/g)];

  if (valueEntries.length > 0 && cssDefaults.length < valueEntries.length) {
    const lineItemLine =
      block.startLine +
      block.content.slice(0, bracketStart).split("\n").length -
      1;
    violations.push({
      filePath,
      line: lineItemLine,
      rule: "column-widths",
      message: `${block.entityName}: ${valueEntries.length} LineItem columns but only ${cssDefaults.length} have ![@HTML5.CssDefaults]. All columns need explicit widths.`,
    });
  }

  // Check that widths sum to 100%
  if (cssDefaults.length > 0) {
    const widthMatches = [...lineItemContent.matchAll(/width\s*:\s*'(\d+)%'/g)];
    if (widthMatches.length > 0) {
      const totalWidth = widthMatches.reduce(
        (sum, wm) => sum + parseInt(wm[1], 10),
        0,
      );
      if (totalWidth !== 100) {
        const lineItemLine =
          block.startLine +
          block.content.slice(0, bracketStart).split("\n").length -
          1;
        violations.push({
          filePath,
          line: lineItemLine,
          rule: "column-widths-sum",
          message: `${block.entityName}: Column widths sum to ${totalWidth}%, must be exactly 100%.`,
        });
      }
    }
  }

  return violations;
}

/**
 * Rule 2: If entity has LineItem, it should have SelectionFields.
 * Composition children (no Facets or FieldGroup) are exempt.
 */
function checkSelectionFields(
  block: EntityUiBlock,
  filePath: string,
): Violation[] {
  const violations: Violation[] = [];

  const hasLineItem = /^\s*LineItem\b/m.test(block.content);
  const hasSelectionFields = /\bSelectionFields\b/.test(block.content);

  if (!hasLineItem) return violations;

  // Composition children typically have no Facets or FieldGroup — exempt them
  const hasFacets = /\bFacets\b/.test(block.content);
  const hasFieldGroup = /\bFieldGroup\b/.test(block.content);
  const isCompositionChild = !hasFacets && !hasFieldGroup;

  if (!hasSelectionFields && !isCompositionChild) {
    violations.push({
      filePath,
      line: block.startLine,
      rule: "selection-fields",
      message: `${block.entityName}: Has LineItem but no SelectionFields. Add filters matching column order.`,
    });
  }

  // Check that SelectionFields count matches LineItem column count
  if (hasSelectionFields && hasLineItem && !isCompositionChild) {
    const lineItemMatch = block.content.match(/^\s*LineItem\s*[^:]*:\s*\[/m);
    if (lineItemMatch) {
      const liStart = block.content.indexOf(
        "[",
        block.content.indexOf(lineItemMatch[0]),
      );
      let liDepth = 0;
      let liEnd = liStart;
      for (let i = liStart; i < block.content.length; i++) {
        if (block.content[i] === "[") liDepth++;
        else if (block.content[i] === "]") {
          liDepth--;
          if (liDepth === 0) {
            liEnd = i;
            break;
          }
        }
      }
      const liContent = block.content.slice(liStart, liEnd + 1);
      const lineItemCount = [...liContent.matchAll(/\bValue\s*:/g)].length;

      const sfStartMatch = block.content.match(
        /SelectionFields\s*[^:]*:\s*\[/s,
      );
      if (sfStartMatch) {
        const sfStart = block.content.indexOf(
          "[",
          block.content.indexOf(sfStartMatch[0]),
        );
        let sfEnd = sfStart;
        let sfDepth = 0;
        for (let si = sfStart; si < block.content.length; si++) {
          if (block.content[si] === "[") sfDepth++;
          if (block.content[si] === "]") sfDepth--;
          if (sfDepth === 0) {
            sfEnd = si;
            break;
          }
        }
        const sfContent = block.content.slice(sfStart + 1, sfEnd).trim();
        const selectionFieldCount = sfContent
          ? sfContent.split(",").filter(sf => sf.trim()).length
          : 0;
        if (selectionFieldCount !== lineItemCount) {
          violations.push({
            filePath,
            line: block.startLine,
            rule: "selection-fields-count",
            message: `${block.entityName}: ${selectionFieldCount} SelectionFields but ${lineItemCount} LineItem columns. Every visible column needs a filter.`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Rule 3: Technical fields must be @UI.Hidden in field-label blocks.
 */
function checkTechnicalFieldsHidden(
  block: EntityUiBlock,
  filePath: string,
): Violation[] {
  const violations: Violation[] = [];

  // CodeList entities (key `code`, no `ID`/managed fields) have no technical
  // fields to hide. They are identified by an annotated `code` element —
  // ID-bearing entities annotate `ID`, never `code`.
  const isCodeList = /\bcode\s+@UI\.Hidden/.test(block.content);
  if (isCodeList) return violations;

  for (const field of TECHNICAL_FIELDS) {
    const hiddenPattern = new RegExp(`\\b${field}\\b[^;]*@UI\\.Hidden`, "s");
    if (!hiddenPattern.test(block.content)) {
      violations.push({
        filePath,
        line: block.startLine,
        rule: "technical-fields-hidden",
        message: `${block.entityName}: Technical field '${field}' is not annotated with @UI.Hidden.`,
      });
    }
  }

  return violations;
}

/**
 * Rule 4: Every entity with a LineItem must have a PresentationVariant with SortOrder.
 */
function checkDefaultSort(block: EntityUiBlock, filePath: string): Violation[] {
  const violations: Violation[] = [];
  const hasLineItem = /^\s*LineItem\b/m.test(block.content);
  const hasPresentationVariant = /\bPresentationVariant\b/.test(block.content);
  if (hasLineItem && !hasPresentationVariant) {
    violations.push({
      filePath,
      line: block.startLine,
      rule: "default-sort",
      message: `${block.entityName}: Has LineItem but no PresentationVariant. Add SortOrder ascending on the first column with Visualizations: ['@UI.LineItem'].`,
    });
  }
  if (hasLineItem && hasPresentationVariant) {
    const hasVisualizations = /Visualizations\s*:/.test(block.content);
    if (!hasVisualizations) {
      violations.push({
        filePath,
        line: block.startLine,
        rule: "default-sort-visualizations",
        message: `${block.entityName}: PresentationVariant is missing Visualizations: ['@UI.LineItem']. Sort won't bind to the table without it.`,
      });
    }
  }
  return violations;
}

/**
 * Scans a single CDS annotation file for UX rule violations.
 */
function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const relativePath = relative(process.cwd(), filePath);
  const allViolations: Violation[] = [];

  const uiBlocks = findUiBlocks(content);
  const fieldBlocks = findFieldBlocks(content);

  // Check UI blocks for column widths, selection fields, and default sort
  for (const block of uiBlocks) {
    allViolations.push(...checkColumnWidths(block, relativePath));
    allViolations.push(...checkSelectionFields(block, relativePath));
    allViolations.push(...checkDefaultSort(block, relativePath));
  }

  // Check field blocks for technical fields hidden
  for (const block of fieldBlocks) {
    allViolations.push(...checkTechnicalFieldsHidden(block, relativePath));
  }

  return allViolations;
}

/**
 * Scans CDS annotation files for UX rule violations:
 * 1. Column widths must sum to 100% (HTML5.CssDefaults on every LineItem entry)
 * 2. SelectionFields must match visible columns
 * 3. Technical fields (ID, createdAt, createdBy, modifiedAt, modifiedBy) must be @UI.Hidden
 * Exits with code 1 if violations found.
 */
function main(): void {
  const cdsFiles = findCdsAnnotationFiles(APP_DIR);
  console.log(
    `Scanning ${cdsFiles.length} CDS annotation file(s) for UX rule violations...\n`,
  );

  const allViolations: Violation[] = [];
  const filesWithViolations = new Set<string>();

  for (const file of cdsFiles) {
    const violations = scanFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      filesWithViolations.add(violations[0].filePath);
    }
  }

  if (allViolations.length === 0) {
    console.log(
      `Scanned ${cdsFiles.length} file(s) — no UX rule violations found.`,
    );
    process.exit(0);
  }

  // Group by rule for readability
  const byRule = new Map<string, Violation[]>();
  for (const violation of allViolations) {
    const list = byRule.get(violation.rule) ?? [];
    list.push(violation);
    byRule.set(violation.rule, list);
  }

  for (const [rule, violations] of byRule) {
    console.log(`── ${rule} ──`);
    for (const violation of violations) {
      console.log(
        `  ${violation.filePath}:${violation.line}  ${violation.message}`,
      );
    }
    console.log();
  }

  console.log(
    `Found ${allViolations.length} violation(s) in ${filesWithViolations.size} file(s).`,
  );
  process.exit(1);
}

main();
