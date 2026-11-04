import { join } from "path";

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import jsdocPlugin from "eslint-plugin-jsdoc";
import importPlugin from "eslint-plugin-import";
import unicornPlugin from "eslint-plugin-unicorn";

// Minimum identifier length for names we choose (variables, params).
// properties:"never" exempts object keys we don't control — CAP's `ID` FK
// convention and external API payload keys (e.g. SimpleFIN `id`/`org`).
// Only `i` (loop counter) and `id` (identifier) are idiomatic enough to keep.
const idLength = [
  "error",
  { min: 3, properties: "never", exceptions: ["i", "id"] },
];

// Every method name (class + object-literal, across srv/ and app/) must begin
// with an approved verb/prefix. Enforced as a `custom` regex on the
// naming-convention `method` selector so the frontend and backend share one
// rule. `on` covers UI5 lifecycle/event handlers (already mandated elsewhere).
// The `(?![a-z])` tail requires the prefix to end at a CamelHump or word end,
// so `settle` is not read as `set`. Extend this list when a legitimate new verb
// appears — a lint failure here means "rename to start with a verb", not "add noise".
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

// Shared across backend and frontend; forked blocks that override
// no-restricted-syntax must spread this or they silently drop these bans.
// For deprecated APIs, prefer @typescript-eslint/no-deprecated (type-accurate,
// maintenance-free); add entries here only for architectural bans on methods
// that are NOT deprecated in their types.
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

// Single source of truth for TypeScript rules — applied IDENTICALLY to the CAP
// backend (srv/, db/, scripts/) and the UI5 frontend (app/). The backend and
// frontend blocks below add ONLY the divergences that have a concrete reason
// (documented inline). Any rule that should hold for both must live here, not be
// forked into a block, so the two stay in lockstep by construction.
const tsRules = {
  // --- Type Safety & Best Practices (error) ---
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

  // --- Complexity (warn) ---
  "max-depth": ["warn", 4],
  "max-params": ["warn", 5],
  complexity: ["warn", 10],
  "max-lines-per-function": [
    "warn",
    { max: 50, skipBlankLines: true, skipComments: true },
  ],

  // --- Naming (error) ---
  "@typescript-eslint/naming-convention": [
    "error",
    { selector: "class", format: ["PascalCase"] },
    // Verb rule targets methods WE author (class + object-literal). typeMethod
    // (interface/type signatures) is excluded — it often mirrors external
    // contracts (Clock.now, HttpClient.post) — but keeps its camelCase check.
    // The filter exempts names that deliberately mirror external APIs: logger
    // levels (console/cds.log), the axios HTTP verb, and UI5's event-callback key.
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

  // --- Import Ordering (error) ---
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

  // --- JSDoc (error) — types come from the TS signature, so they're OFF ---
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

// Type-aware parsing, required by rules that read the checker (no-deprecated).
// projectService auto-resolves the owning tsconfig per file — the module project
// for srv/db, the per-app project for each app/*. Spread into the backend and
// frontend blocks so both get type info.
// The root must be the workspace, not this folder: projectService resolves each
// file's tsconfig by walking up, so a root that is not an ancestor of the modules
// would leave every module file without a project.
const typeAwareParserOptions = {
  ecmaVersion: 2022,
  sourceType: "module",
  // A module's root config files (jest.config.ts) sit in no tsconfig `include`.
  projectService: { allowDefaultProject: ["*/*.ts"] },
  tsconfigRootDir: join(import.meta.dirname, ".."),
};

export default [
  // === Global Ignores ===
  {
    ignores: [
      "**/node_modules/**",
      "**/@cds-models/**",
      "**/coverage/**",
      "**/gen/**",
      "**/dist/**",
      "**/*.min.js",
      "**/*.gen.d.ts",
      "**/logs/**",
    ],
  },

  // === TypeScript Backend (srv/, mcp/, db/, scripts/) ===
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

      // Architectural rules live in scripts/lint*.ts, not here — authoring an ESLint
      // plugin rule costs ~5x a scanner script and there is no plugin scaffold.
      // Facade logic/CQL is enforced by `npm run lint:facades`. Rules parked here as
      // comments were unenforced for months while reading as enforced; don't re-add any.
    },
  },

  // === Scripts Overrides (internal CLI tools — relaxed docs) ===
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

  // === The shared linters themselves (this folder's scripts/) ===
  // Exempt from the class-only rule and the keyword ban by Sandro's ruling. An
  // absolute basePath, because a relative `scripts/**` also matches module scripts.
  {
    basePath: import.meta.dirname,
    files: ["scripts/**/*.ts"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax],
    },
  },

  // === Test File Overrides ===
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

  // === SAPUI5 Frontend (app/**/*.ts) ===
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

  // === UI5 Controllers (app/**/*.controller.ts) ===
  // Keeps controllers thin: formatters live in a formatter.ts module (bound via
  // core:require), dialogs go through the shared DialogManager, and i18n flows
  // through the shared getText helper. Inherits parser/plugins from the app
  // block above; only no-restricted-syntax is extended (it REPLACES, not merges,
  // so the shared bans are spread back in).
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
            "Resolve i18n via the shared getText helper (app/shared/util/i18n), not getResourceBundle directly.",
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

  // === UI5 object modules — FE custom-action handlers and formatters ===
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

  // === Declaration files — types.ts, constants.ts, *.d.ts, tool configs ===
  // Last before the catch-all so it wins over the app block too. These hold the shapes and values the class-only rule moves out of code
  // files, or a shape a tool dictates (jest.config.ts). The keyword ban stays.
  {
    files: ["**/types.ts", "**/constants.ts", "**/*.d.ts", "*.config.ts"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax, ...noFunctionKeyword],
    },
  },

  // === Catch-all — a .ts file no block above covers ===
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
