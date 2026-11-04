import { existsSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/**
 * UI5 views and fragments only — control IDs are an XML-view concern, so no
 * other source tree is scanned.
 */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/**
 * The UI5 Language Support plugin's defaults (`ui5linter.attributesToCheck`),
 * in the plugin's own order: the first one present on a tag names it.
 */
const MEANING_ATTRIBUTES = ["content", "items", "value", "text", "number"];

interface ControlId {
  attributes: TagAttribute[];
  className: string;
  idValue: string;
  offset: number;
}

interface TagAttribute {
  name: string;
  value: string;
}

interface Violation {
  expected: string;
  filePath: string;
  idValue: string;
  line: number;
}

/**
 * Locates every opening tag carrying an `id` attribute, pairing the id value
 * with the control's class name (tag name minus any namespace prefix) and the
 * tag's attributes in source order. Comments are blanked and the tag scan is
 * quote-aware, so `>` inside a binding (`{model>/path}`) never truncates a tag.
 * @param content the raw XML file text
 * @returns one entry per id-bearing control tag
 */
function collectControlIds(content: string): ControlId[] {
  const blanked = content.replace(/<!--[\s\S]*?-->/g, comment => comment.replace(/[^\n]/g, " "));
  const results: ControlId[] = [];
  const tagStart = /<([A-Za-z_][\w.]*)(?::([A-Za-z_][\w.]*))?/g;
  let match: RegExpExecArray | null;
  while ((match = tagStart.exec(blanked)) !== null) {
    const className = match[2] ?? match[1];
    const attrsStart = tagStart.lastIndex;
    const closeIndex = findTagClose(blanked, attrsStart);
    const attrs = blanked.slice(attrsStart, closeIndex);
    const idMatch = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(attrs);
    if (idMatch) {
      results.push({
        attributes: parseAttributes(attrs),
        className,
        idValue: idMatch[1] ?? idMatch[2],
        offset: attrsStart + idMatch.index,
      });
    }
    tagStart.lastIndex = closeIndex;
  }
  return results;
}

/**
 * Scans forward from a tag's attribute region to the `>` that closes the
 * opening tag, ignoring any `>` inside a quoted attribute value.
 * @param content the raw XML text
 * @param from the index just past the tag name
 * @returns the index of the closing `>` (or end of content)
 */
function findTagClose(content: string, from: number): number {
  let quote: string | null = null;
  for (let pos = from; pos < content.length; pos++) {
    const char = content[pos];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ">") {
      return pos;
    }
  }
  return content.length;
}

/**
 * Splits an opening tag's attribute region into name/value pairs, in order.
 * @param attrs the text between the tag name and its closing `>`
 * @returns every attribute on the tag
 */
function parseAttributes(attrs: string): TagAttribute[] {
  const pairs = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  const found: TagAttribute[] = [];
  let pair: RegExpExecArray | null;
  while ((pair = pairs.exec(attrs)) !== null) {
    found.push({ name: pair[1], value: pair[2] ?? pair[3] });
  }
  return found;
}

/**
 * Loads the i18n texts of the component owning an XML file: the nearest
 * manifest.json above it, then that manifest's i18n model `bundleName`
 * resolved against `sap.app.id`. A component with no i18n model has no texts.
 * @param filePath the view or fragment being linted
 * @returns i18n key → text for the owning component
 */
function loadComponentTexts(filePath: string): Map<string, string> {
  let dir = dirname(filePath);
  while (!existsSync(join(dir, "manifest.json"))) {
    const parent = dirname(dir);
    if (parent === dir) return new Map();
    dir = parent;
  }
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as {
    "sap.app"?: { id?: string };
    "sap.ui5"?: { models?: { i18n?: { settings?: { bundleName?: string } } } };
  };
  const appId = manifest["sap.app"]?.id ?? "";
  const bundleName = manifest["sap.ui5"]?.models?.i18n?.settings?.bundleName;
  if (!bundleName?.startsWith(`${appId}.`)) return new Map();
  const bundlePath = `${join(dir, ...bundleName.slice(appId.length + 1).split("."))}.properties`;
  return existsSync(bundlePath) ? parseProperties(readFileSync(bundlePath, "utf8")) : new Map();
}

/**
 * Reproduces the plugin's `{MeaningAssumption}`: the first tag attribute among
 * MEANING_ATTRIBUTES decides it — an `{i18n>key}` yields the PascalCased text,
 * any other binding its path's last segment, a literal its PascalCased value.
 * @param attributes the tag's attributes in source order
 * @param texts the owning component's i18n texts
 * @returns the expected meaning prefix, "" when nothing names the control
 */
function deriveMeaning(attributes: TagAttribute[], texts: Map<string, string>): string {
  const source = attributes.find(attribute => MEANING_ATTRIBUTES.includes(attribute.name));
  if (!source) return "";
  const { value } = source;
  if (!value.startsWith("{") && !value.endsWith("}")) return toPascalCase(value);
  const path = extractBindingPath(value);
  if (path === undefined) return "";
  const [modelName, ...rest] = path.split(">");
  if (modelName === "i18n" && rest.length > 0) return toPascalCase(texts.get(rest.at(-1) ?? "") ?? "");
  const segment = (path.split(">").pop() ?? "").replace(/\/results$/, "").split("/").pop() ?? "";
  return segment
    .split("_")
    .map(part => (part === part.toUpperCase() ? part.toLowerCase() : part))
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
    .replace(/[^a-zA-Z| ]/g, "");
}

/**
 * The plugin evaluates a binding as an object literal and reads `.path`; a
 * simple `{model>path}` falls back to its inner text, and anything it cannot
 * evaluate (expression and composite bindings) names nothing.
 * @param value an attribute value wrapped in braces
 * @returns the binding path, or undefined when the binding names nothing
 */
function extractBindingPath(value: string): string | undefined {
  if (/^\{\s*:?=/.test(value)) return undefined;
  const keyed = /\bpath\s*:\s*(?:'([^']*)'|"([^"]*)")/.exec(keepTopLevel(value));
  if (keyed) return keyed[1] ?? keyed[2];
  const braceCount = (value.match(/[{}]/g) ?? []).length;
  if (braceCount !== 2) return undefined;
  const inner = value.slice(1, -1).trim();
  return /^[\w$]+\s*:/.test(inner) ? "" : inner;
}

/**
 * Mirrors the plugin's id rule `^id{MeaningAssumption}.*?{ControlName}$`, so
 * CI and the editor agree on every id rather than only on its shape.
 * @param meaning the derived meaning prefix
 * @param className the control's class name
 * @returns the regular expression the id must match
 */
function expectedPattern(meaning: string, className: string): RegExp {
  return new RegExp(`^id${meaning}.*?${className}$`);
}

/**
 * Blanks everything nested deeper than the binding object itself, so a
 * composite binding's inner `parts: [{ path }]` is not read as its own path —
 * the plugin reads only the top-level `.path`.
 * @param value an attribute value wrapped in braces
 * @returns the value with nested brackets' contents replaced by spaces
 */
function keepTopLevel(value: string): string {
  let depth = 0;
  let kept = "";
  for (const char of value) {
    if (char === "}" || char === "]") depth--;
    kept += depth > 1 ? " " : char;
    if (char === "{" || char === "[") depth++;
  }
  return kept;
}

function parseProperties(content: string): Map<string, string> {
  const texts = new Map<string, string>();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    const separator = line.search(/[=:]/);
    if (separator > 0) texts.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return texts;
}

function resolveLineNumber(content: string, offset: number): number {
  let line = 1;
  for (let pos = 0; pos < offset; pos++) {
    if (content[pos] === "\n") line++;
  }
  return line;
}

function scanFile(filePath: string): Violation[] {
  const content = readFileSync(filePath, "utf8");
  const texts = loadComponentTexts(filePath);
  const violations: Violation[] = [];
  for (const { attributes, className, idValue, offset } of collectControlIds(content)) {
    const pattern = expectedPattern(deriveMeaning(attributes, texts), className);
    if (!pattern.test(idValue)) {
      violations.push({
        expected: pattern.source,
        filePath: relative(ROOT_DIR, filePath),
        idValue,
        line: resolveLineNumber(content, offset),
      });
    }
  }
  return violations;
}

/**
 * The plugin's PascalCase: drop everything but letters, `|` and spaces, then
 * upper-case each word's first letter. Digits are dropped, not kept.
 * @param text the i18n text or literal value
 * @returns the PascalCased text
 */
function toPascalCase(text: string): string {
  return text
    .replace(/[^a-zA-Z| ]/g, "")
    .split(" ")
    .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join("");
}

function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".xml"]));
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} UI5 view(s) for control-ID naming...`,
    "All control IDs match ^id{MeaningAssumption}.*?{ControlName}$.",
    violations.map(
      violation => `${violation.filePath}:${violation.line}  "${violation.idValue}"  should match  ${violation.expected}`,
    ),
    `\nFound ${violations.length} control ID(s) not matching the UI5 Language Support rule ` +
      `^id{MeaningAssumption}.*?{ControlName}$. The meaning comes from the tag's first ` +
      `content/items/value/text/number attribute: an {i18n>key}'s PascalCased text, a binding ` +
      `path's last segment, or a literal (e.g. text="{i18n>pageTitle}" = "SimpleFIN Connection ` +
      `Manager" on a Title → idSimpleFINConnectionManagerTitle).`,
  );
}

main();
