import { join } from "path";

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdocPlugin from "eslint-plugin-jsdoc";
import importPlugin from "eslint-plugin-import";
import unicornPlugin from "eslint-plugin-unicorn";

// Names we choose need 3+ letters; only `i` and `id` are idiomatic enough to keep.
// properties:"never" exempts keys we don't control (CAP's `ID`, SimpleFIN payloads).
const idLength = [
  "error",
  { min: 3, properties: "never", exceptions: ["i", "id"] },
];

// Every method name starts with an approved verb; one regex so frontend and backend
// share the rule. The `(?![a-z])` tail stops `settle` reading as `set`. A failure
// means "rename to start with a verb", not "extend this list".
const VERB_PREFIXES = [
  "get", "set", "is", "has", "can", "should", "will", "did",
  "on", "handle", "wrap", "round",
  "init", "exit", "destroy", "render",
  "create", "read", "update", "delete", "remove", "add", "insert",
  "save", "load", "reload", "fetch", "find", "list", "count", "exists",
  "build", "make", "compute", "calculate", "derive", "resolve", "ensure",
  "apply", "map", "parse", "decode", "format", "serialize", "deserialize", "normalize",
  "sanitize", "redact", "encrypt", "decrypt", "hash",
  "validate", "verify", "assert", "check",
  "open", "close", "show", "hide", "toggle", "refresh", "reset", "clear",
  "bind", "unbind", "register", "configure", "setup", "start", "stop", "run",
  "spawn", "schedule", "sync", "claim", "dedupe", "ingest", "process",
  "transform", "merge", "split", "group", "filter", "sort",
  "restore", "evaluate", "backfill", "raise", "write", "categorize", "correct",
  "classify", "reclassify",
  "to", "from", "with", "navigate", "nav", "emit", "dispatch", "notify",
  "log", "throw", "reject", "attach", "detach", "enable", "disable",
  "select", "submit", "cancel", "confirm", "copy", "move", "import", "export",
  "generate", "seed", "mock", "stub",
];
const methodVerbRegex = `^_?(?:${VERB_PREFIXES.join("|")})(?![a-z])`;

// A block that overrides no-restricted-syntax must spread this, or it silently drops
// these bans. Deprecated APIs belong to @typescript-eslint/no-deprecated; list here only
// architectural bans on methods their types do not deprecate.
const restrictedSyntax = [
  {
    selector: 'CallExpression[callee.property.name="bind"]',
    message: "Use arrow functions instead of .bind()",
  },
  {
    selector: 'CallExpression[callee.property.name="call"]',
    message: "Use arrow functions instead of .call()",
  },
  {
    selector: 'CallExpression[callee.property.name="apply"]',
    message: "Use arrow functions instead of .apply()",
  },
];

// ESTree models every class and object method as a FunctionExpression, so the
// keyword ban exempts exactly those parents — everything else is `function`.
const noFunctionKeyword = [
  {
    selector: "FunctionDeclaration, TSDeclareFunction",
    message: "No `function` keyword. Use a class method, or an arrow function inside one.",
  },
  {
    selector:
      "FunctionExpression:not(MethodDefinition > FunctionExpression, TSAbstractMethodDefinition > FunctionExpression, Property[method=true] > FunctionExpression, Property[kind='get'] > FunctionExpression, Property[kind='set'] > FunctionExpression)",
    message: "No `function` keyword. Use a class method, or an arrow function inside one.",
  },
];

// A code file is its imports plus a class. Named types live in types.ts and
// constants in constants.ts — the one override below that relaxes this.
const classOnlyMessage =
  "Top-level code belongs in a class. Types go in types.ts, constants in constants.ts.";
const classOnlyModule = [
  {
    selector:
      "Program > :not(ImportDeclaration, ClassDeclaration, ExportNamedDeclaration, ExportDefaultDeclaration, ExportAllDeclaration)",
    message: classOnlyMessage,
  },
  {
    selector:
      "ExportNamedDeclaration > :not(ClassDeclaration, ExportSpecifier, Literal, ImportAttribute)",
    message: classOnlyMessage,
  },
  {
    selector: "ExportDefaultDeclaration > :not(ClassDeclaration, Identifier)",
    message: classOnlyMessage,
  },
];

// One source for TypeScript rules, applied identically to backend and frontend. The
// blocks below add only divergences with a stated reason; a rule meant for both lives
// here, so the two stay in lockstep by construction.
const tsRules = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "error",
  // Flags any API marked @deprecated in its type declarations (UI5's
  // @sapui5/types, CAP's types) — blanket, maintenance-free deprecation
  // coverage. For non-deprecated architectural bans, use restrictedSyntax.
  "@typescript-eslint/no-deprecated": "error",
  eqeqeq: ["error", "always"],
  "prefer-const": "error",
  "no-var": "error",
  // Backend uses the Logger class; the frontend uses sap/base/Log. Raw console
  // is banned in both — extract to the proper logging facility.
  "no-console": "error",
  "no-magic-numbers": [
    "error",
    {
      ignore: [-1, 0, 1, 2, 100, 200, 400, 404, 409, 500, 502],
      ignoreArrayIndexes: true,
      enforceConst: true,
    },
  ],
  "arrow-parens": ["error", "as-needed"],
  "prefer-template": "error",
  "no-throw-literal": "error",
  "object-shorthand": ["error", "always"],
  "prefer-arrow-callback": "error",
  "no-restricted-syntax": [
    "error",
    ...restrictedSyntax,
    ...noFunctionKeyword,
    ...classOnlyModule,
  ],

  "max-depth": ["warn", 4],
  "max-params": ["warn", 5],
  complexity: ["warn", 10],
  "max-lines-per-function": [
    "warn",
    { max: 50, skipBlankLines: true, skipComments: true },
  ],
  // A file past this holds more than one job — TransactionActions reached 611 lines
  // before review caught it. Tests and the types/constants data files are exempt below.
  "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],

  "@typescript-eslint/naming-convention": [
    "error",
    { selector: "class", format: ["PascalCase"] },
    // Only methods we author; interface signatures mirror external contracts. The
    // filter exempts names that deliberately mirror external APIs (logger levels,
    // the axios verb, UI5's event-callback key).
    {
      selector: ["classMethod", "objectLiteralMethod"],
      format: ["camelCase"],
      leadingUnderscore: "allow",
      filter: {
        regex: "^(info|warn|error|debug|post|componentCreated)$",
        match: false,
      },
      custom: { regex: methodVerbRegex, match: true },
    },
    { selector: "typeMethod", format: ["camelCase"], leadingUnderscore: "allow" },
    {
      selector: "variable",
      format: ["camelCase", "UPPER_CASE"],
      leadingUnderscore: "allow",
    },
    {
      selector: "variable",
      modifiers: ["destructured"],
      format: ["camelCase", "PascalCase", "UPPER_CASE"],
    },
    {
      selector: "parameter",
      format: ["camelCase"],
      leadingUnderscore: "allow",
    },
  ],
  camelcase: ["error", { properties: "never", ignoreDestructuring: true }],
  "id-length": idLength,

  // The #cds-models path group is backend-only in practice; it simply never
  // matches a frontend import, so sharing it is harmless and keeps one config.
  "import/order": [
    "error",
    {
      groups: [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index",
      ],
      pathGroups: [
        { pattern: "#cds-models/**", group: "internal", position: "before" },
      ],
      "newlines-between": "always",
    },
  ],
  "import/first": "error",
  "import/no-duplicates": "error",
  "import/newline-after-import": "error",

  "jsdoc/require-jsdoc": [
    "error",
    {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
      },
    },
  ],
  "jsdoc/require-param": "error",
  "jsdoc/require-param-description": "error",
  "jsdoc/require-returns": "error",
  "jsdoc/require-returns-description": "error",
  "jsdoc/require-param-type": "off",
  "jsdoc/require-returns-type": "off",
};

const tsPlugins = {
  "@typescript-eslint": tsPlugin,
  jsdoc: jsdocPlugin,
  import: importPlugin,
  unicorn: unicornPlugin,
};

// Type-aware parsing for rules that read the checker (no-deprecated). The root must be
// the workspace, not this folder: tsconfigs resolve by walking up, so a non-ancestor
// root would leave every module file without a project.
const typeAwareParserOptions = {
  ecmaVersion: 2022,
  sourceType: "module",
  // A module's root config files (jest.config.ts) sit in no tsconfig `include`.
  projectService: { allowDefaultProject: ["*/*.ts"] },
  tsconfigRootDir: join(import.meta.dirname, ".."),
};

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/@cds-models/**",
      "**/coverage/**",
      "**/coverage-ui5/**",
      "**/report-ui5/**",
      "**/.nyc_output-ui5/**",
      "**/gen/**",
      "**/dist/**",
      "**/*.min.js",
      "**/*.gen.d.ts",
      "**/logs/**",
    ],
  },

  // A folder passed to eslint but matched by no block here is skipped with a
  // warning, not an error — mcp/ sat outside this list and was never linted.
  {
    files: ["*.ts", "srv/**/*.ts", "mcp/**/*.ts", "db/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: typeAwareParserOptions,
    },
    plugins: tsPlugins,
    rules: {
      ...tsRules,

      // Backend-only divergence: CAP source files are camelCase (with the
      // `-service.ts` suffix exempted). The frontend can't share this — UI5
      // controllers/controls/components are PascalCase by convention.
      "unicorn/filename-case": [
        "error",
        { case: "camelCase", ignore: ["^.*-service\\.ts$"] },
      ],

      // Architectural rules live in scripts/lint*.ts: a plugin rule costs ~5x a scanner
      // script. Rules once parked here as comments read as enforced for months; don't
      // re-add any.
    },
  },

  {
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "no-magic-numbers": "off",
      // Shape/complexity guardrails are relaxed for one-shot procedural CLI
      // tools — a long, deeply-nested main() is idiomatic here, not a smell.
      complexity: "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },

  // Exempt from the class-only rule and the keyword ban by Sandro's ruling. An
  // absolute basePath, because a relative `scripts/**` also matches module scripts.
  {
    basePath: import.meta.dirname,
    files: ["scripts/**/*.ts"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax],
    },
  },

  {
    files: ["test/**/*.test.ts", "test/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      "unicorn/filename-case": [
        "error",
        { case: "camelCase", ignore: ["^.*-service\\.ts$"] },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "dot-notation": "off",
      "no-magic-numbers": "off",
      "jsdoc/require-jsdoc": "off",
      // Root cause of the `const m` miss: this block previously defined no
      // id-length, so test files had zero minimum-length enforcement.
      "id-length": idLength,
      // Tests are exempt from the class-only rule, not from the keyword ban.
      "no-restricted-syntax": ["error", ...noFunctionKeyword],
    },
  },

  // Shares tsRules with the backend verbatim. The only divergences are the
  // browser runtime and UI5's generated-constructor boilerplate — both below.
  {
    files: ["app/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: typeAwareParserOptions,
      // Frontend-only divergence: browser globals (backend runs on Node).
      globals: {
        window: "readonly",
        document: "readonly",
        Intl: "readonly",
      },
    },
    plugins: tsPlugins,
    rules: {
      ...tsRules,

      // Frontend-only divergence: UI5 control constructors are generated
      // boilerplate ("should remain as-is") — don't force a JSDoc block on
      // them. Every other require-jsdoc setting matches the backend.
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
          checkConstructors: false,
        },
      ],
    },
  },

  // Keeps controllers thin: formatters, dialogs and i18n go through shared helpers.
  // no-restricted-syntax replaces rather than merges, so the shared bans are spread back in.
  {
    files: ["app/**/*.controller.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntax,
        ...noFunctionKeyword,
        ...classOnlyModule,
        {
          selector: "MethodDefinition[key.name=/^format/]",
          message:
            "Formatters belong in a formatter.ts module bound via core:require, not as controller methods.",
        },
        {
          selector: "CallExpression[callee.property.name='loadFragment']",
          message:
            "Load dialogs through the shared DialogManager, not loadFragment directly.",
        },
        {
          selector: "CallExpression[callee.property.name='getResourceBundle']",
          message:
            "Resolve i18n via the shared `I18n.getText` in Shared/app/I18n.ts (com/lifeos/shared/I18n), not getResourceBundle directly.",
        },
        // The base classes wrap these chains; calling around them re-hand-rolls
        // the shortcut. The :matches covers the `(… as View)` cast form too.
        {
          selector:
            "CallExpression[callee.property.name=/^(getModel|setModel)$/]:matches([callee.object.callee.property.name='getView'], [callee.object.expression.callee.property.name='getView'])",
          message:
            "Use the base controller's this.getModel()/this.setModel(), not this.getView().getModel()/setModel().",
        },
        {
          selector:
            "CallExpression[callee.property.name='getRouter']:matches([callee.object.callee.property.name='getOwnerComponent'], [callee.object.expression.callee.property.name='getOwnerComponent'])",
          message:
            "Use the base controller's this.getRouter(), not this.getOwnerComponent().getRouter().",
        },
      ],
    },
  },

  // SAP binds an FE action to a plain object module's methods, and a formatter
  // is resolved off core:require the same way. Only `export default {…}` is
  // allowed — every other class-only selector still applies.
  {
    files: ["app/**/ext/*.ts", "app/**/formatter.ts"],
    ignores: ["**/*.controller.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...restrictedSyntax,
        ...noFunctionKeyword,
        ...classOnlyModule.slice(0, 2),
      ],
    },
  },

  // UI5 tests get the backend test block's exemptions and no more: QUnit's module/test
  // calls sit at top level, so class-only is off; the keyword ban stays.
  {
    files: ["app/**/test/**/*.ts"],
    rules: {
      "no-magic-numbers": "off",
      "dot-notation": "off",
      "jsdoc/require-jsdoc": "off",
      // A QUnit.module callback holds the whole module, as a Jest describe does.
      "max-lines-per-function": "off",
      "max-lines": "off",
      "no-restricted-syntax": ["error", ...restrictedSyntax, ...noFunctionKeyword],
    },
  },

  // Last before the catch-all so it wins over the app block too. These hold the shapes and values the class-only rule moves out of code
  // files, or a shape a tool dictates (jest.config.ts). The keyword ban stays.
  {
    files: ["**/types.ts", "**/constants.ts", "**/*.d.ts", "*.config.ts"],
    rules: {
      "max-lines": "off",
      "no-restricted-syntax": ["error", ...restrictedSyntax, ...noFunctionKeyword],
    },
  },

  // ESLint skips such a file in silence when it sits inside a passed folder,
  // which is how mcp/ went unlinted. Keep `ignores` equal to the globs above.
  {
    files: ["**/*.ts"],
    ignores: ["*.ts", "srv/**", "mcp/**", "db/**", "scripts/**", "test/**", "app/**"],
    languageOptions: { parser: tsParser },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message:
            "No lint block covers this file. Add its folder to a files: glob in Standards (Technical + Linting)/eslint.config.mjs.",
        },
      ],
    },
  },
];
