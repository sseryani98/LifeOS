/**
 * One UX rule violation found in a CDS annotation file.
 */
export interface Violation {
  filePath: string;
  line: number;
  rule: string;
  message: string;
}

/**
 * An `annotate svc.Entity with … { … }` block and where it sits in its file.
 */
export interface EntityUiBlock {
  entityName: string;
  startLine: number;
  endLine: number;
  content: string;
}

/**
 * Extracts the content between matched braces starting at the given position.
 * @param text Source text to scan.
 * @param openIndex Index of the opening brace.
 * @returns The braced text and the index of its closing brace, or null when unbalanced.
 */
export function extractBracedBlock(
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
 * @param content CDS file text.
 * @returns Every @UI block, in file order.
 */
export function findUiBlocks(content: string): EntityUiBlock[] {
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
 * @param content CDS file text.
 * @returns Every field-label block, in file order.
 */
export function findFieldBlocks(content: string): EntityUiBlock[] {
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
