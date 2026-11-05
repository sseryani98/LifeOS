import { readFileSync } from "fs";
import { basename, dirname, join, relative } from "path";

import { collectFiles, reportViolations } from "./lib/lintWalk.js";

const ROOT_DIR = process.cwd();

/** The UI5 frontend is the surface this rule governs. */
const SOURCE_DIRS = [join(ROOT_DIR, "app")];

/** Type-only modules carry no runtime code and are governed by lint:domain-types. */
const EXEMPT_NAMES = new Set(["types.ts"]);

/**
 * The V+C modules this rule governs: every `*.controller.ts` and any `.ts`
 * directly in an `ext/` folder. None may hold code outside a class: no free
 * functions, no loose module state.
 * @param fileName Basename of a candidate file.
 * @param parentDir Basename of the file's containing directory.
 * @returns True when the file must obey the controller/extension shape.
 */
function isControllerModule(fileName: string, parentDir: string): boolean {
  if (EXEMPT_NAMES.has(fileName) || fileName.endsWith(".d.ts")) return false;
  return fileName.endsWith(".controller.ts") || parentDir === "ext";
}

/**
 * A registered controller must export its class. An `ext/` handler module is
 * exempt: its documented shape is a plain object of handlers, though its logic
 * still lives in a class.
 * @param fileName Basename of a candidate file.
 * @returns True when the file's default export must be a class.
 */
function requiresClassExport(fileName: string): boolean {
  return fileName.endsWith(".controller.ts");
}

/**
 * Each pattern is a construct that means logic lives outside the class — a free
 * function, mutable module state, or a function hidden in a module-scope const.
 * All anchor at column 0 so class members (indented) never match.
 */
const FORBIDDEN = [
  {
    pattern: /^(?:export\s+)?(?:async\s+)?function\b/,
    label: "free function declaration",
  },
  { pattern: /^(?:export\s+)?(?:let|var)\b/, label: "mutable module state" },
  {
    pattern:
      /^(?:export\s+)?const\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*(?:async\s+)?(?:function\b|\(?[^=]*=>)/,
    label: "free function assigned to a module-scope const",
  },
];

/** A lifecycle extension is wiring, like a Facade: its hooks delegate to a logic class. */
const EXTENDS_CONTROLLER_EXTENSION = /\bextends\s+ControllerExtension\b/;

/** Control flow that marks logic living in the extension rather than its logic class. */
const EXTENSION_LOGIC = /\b(?:if|else|for|while|do|switch|try|catch)\b/;

/** Matches a default export and captures what is exported. */
const DEFAULT_EXPORT = /^export\s+default\s+(.+?)\s*;?\s*$/;

/** Matches a class declaration and captures its name. */
const CLASS_DECL =
  /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/;

interface Violation {
  filePath: string;
  line: number;
  label: string;
}

/**
 * Blanks out string and comment bodies so a keyword inside a message or comment
 * never counts as code. Delimiters are kept so column offsets stay meaningful.
 * @param source Raw file text.
 * @returns The text with comment/string interiors replaced by spaces.
 */
function blankNonCode(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, match => " ".repeat(match.length))
    .replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, match =>
      match[0].repeat(match.length),
    );
}

/**
 * Scans one controller/extension module for code living outside the class and
 * for a non-class default export.
 * @param filePath Absolute path of the file to scan.
 * @returns Every violation found in the file.
 */
function scanFile(filePath: string): Violation[] {
  const source = blankNonCode(readFileSync(filePath, "utf8"));
  const lines = source.split(/\r?\n/);
  const relativePath = relative(ROOT_DIR, filePath);
  const violations: Violation[] = [];

  lines.forEach((text, index) => {
    for (const { pattern, label } of FORBIDDEN) {
      if (pattern.test(text)) {
        violations.push({ filePath: relativePath, line: index + 1, label });
      }
    }
  });

  if (EXTENDS_CONTROLLER_EXTENSION.test(source)) {
    lines.forEach((text, index) => {
      if (EXTENSION_LOGIC.test(text)) {
        violations.push({
          filePath: relativePath,
          line: index + 1,
          label:
            "control flow in a ControllerExtension (delegate the hook to a logic class)",
        });
      }
    });
  }

  const classNames = new Set(
    lines.map(text => CLASS_DECL.exec(text)?.[1]).filter(Boolean),
  );
  const defaultExport = lines
    .flatMap((text, index) => {
      const match = DEFAULT_EXPORT.exec(text);
      return match ? [{ exported: match[1], line: index + 1 }] : [];
    })
    .at(0);

  if (!defaultExport) {
    violations.push({
      filePath: relativePath,
      line: lines.length,
      label: "no default export (a controller/extension module must have one)",
    });
  } else if (requiresClassExport(basename(filePath))) {
    const exported = defaultExport.exported;
    const exportsClass =
      exported.startsWith("class ") ||
      classNames.has(exported.replace(/;$/, ""));
    if (!exportsClass) {
      violations.push({
        filePath: relativePath,
        line: defaultExport.line,
        label: `default export is an instance/value (\`${exported}\`), not a class`,
      });
    }
  }

  return violations;
}

/**
 * Scans the UI5 frontend's controllers and Fiori Elements extensions for code
 * outside the class and for instance (non-class) default exports, and exits
 * non-zero when any are found. Keeps every controller/extension a single class —
 * shared behaviour lives in shared helper classes (DialogManager, Messaging),
 * not free functions or module-level state.
 */
function main(): void {
  const files = SOURCE_DIRS.flatMap(dir => collectFiles(dir, [".ts"])).filter(
    file => isControllerModule(basename(file), basename(dirname(file))),
  );
  const violations = files.flatMap(scanFile);

  reportViolations(
    `Scanning ${files.length} controller/extension module(s) for shape...`,
    "All controllers/extensions are a single class with no free code.",
    violations.map(
      violation =>
        `${violation.filePath}:${violation.line}  ${violation.label}`,
    ),
    `\nFound ${violations.length} controller-shape violation(s). No controller or ` +
      `extension holds code outside a class: no free functions, no module-level ` +
      `let/var state. A registered controller (\`*.controller.ts\`) must \`export ` +
      `default class …\`; an FE custom-action handler module (\`*Ext.ts\`) may export ` +
      `the SAP object surface but must delegate all logic to a class. A lifecycle ` +
      `\`ControllerExtension\` is wiring: no if/for/while/switch/try in it — each ` +
      `hook delegates to a plain logic class that QUnit can test. Move shared ` +
      `behaviour into a helper class (e.g. Shared/app/DialogManager.ts, ` +
      `Shared/app/Messaging.ts) held as a class field.`,
  );
}

main();
