import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import importPlugin from 'eslint-plugin-import';

export default [
  // === Global Ignores ===
  {
    ignores: [
      '**/node_modules/**',
      '**/@cds-models/**',
      '**/gen/**',
      '**/dist/**',
      '**/*.min.js',
      '**/logs/**',
    ],
  },

  // === TypeScript Backend (srv/, db/, scripts/) ===
  {
    files: ['srv/**/*.ts', 'db/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsdoc': jsdocPlugin,
      'import': importPlugin,
    },
    rules: {
      // --- Type Safety & Best Practices (error) ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'eqeqeq': ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'error',
      'no-magic-numbers': ['error', {
        ignore: [-1, 0, 1, 2, 100, 200, 400, 404, 409, 500, 502],
        ignoreArrayIndexes: true,
        enforceConst: true,
      }],
      'prefer-template': 'error',
      'no-throw-literal': 'error',
      'no-restricted-syntax': ['error',
        { selector: 'CallExpression[callee.property.name="bind"]', message: 'Use arrow functions instead of .bind()' },
        { selector: 'CallExpression[callee.property.name="call"]', message: 'Use arrow functions instead of .call()' },
        { selector: 'CallExpression[callee.property.name="apply"]', message: 'Use arrow functions instead of .apply()' },
      ],

      // --- Complexity (warn) ---
      'max-depth': ['warn', 4],
      'max-params': ['warn', 5],
      'complexity': ['warn', 10],

      // --- Naming (error) ---
      '@typescript-eslint/naming-convention': ['error',
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'method', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],
      'camelcase': ['error', { properties: 'never', ignoreDestructuring: true }],
      'id-length': ['warn', {
        min: 2,
        exceptions: ['i', 'j', 'k', 'n', 'x', 'y', '_'],
      }],

      // --- Import Ordering (error) ---
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        pathGroups: [
          { pattern: '#cds-models/**', group: 'internal', position: 'before' },
        ],
        'newlines-between': 'always',
      }],
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',

      // --- Custom Architectural Rules ---
      // These are documented as comments. They will be implemented as actual
      // ESLint plugin rules when the project has enough code to enforce.
      //
      // 'no-logic-in-facade': 'error'
      //   — No if/for/while in Facade classes
      //
      // 'require-wrap-handler': 'error'
      //   — All handler registrations use wrapHandler
      //
      // 'no-try-catch-in-facade': 'error'
      //   — No try/catch in Facades
      //
      // 'require-facade-extends-base': 'error'
      //   — All Facades extend BaseFacade
      //
      // 'require-service-extends-base': 'error'
      //   — All Services extend BaseService
      //
      // 'private-methods-at-bottom': 'error'
      //   — _ prefixed methods at end of class

      // --- JSDoc (error) ---
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
      }],
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
    },
  },

  // === Scripts Overrides (CLI tools that need console output) ===
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-magic-numbers': 'off',
      'complexity': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },

  // === Test File Overrides ===
  {
    files: ['test/**/*.test.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'dot-notation': 'off',
      'no-magic-numbers': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },

  // === SAPUI5 Frontend (app/**/webapp/**/*.js) ===
  {
    files: ['app/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        sap: 'readonly',
        jQuery: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        Intl: 'readonly',
      },
    },
    rules: {
      // UI5-specific rules — implemented as comments until custom plugin is built.
      // 'hungarian-notation': 'warn'
      //   — sName, oModel, aItems, bIsValid, iCount, fnCallback
      //
      // 'event-handler-naming': 'error'
      //   — on prefix: onPressSubmit, onSelectCard
      //
      // 'controller-file-naming': 'error'
      //   — Extensions: *Ext.controller.js

      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 4],
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'off', // SAPUI5 uses var in sap.ui.define patterns
      'prefer-const': 'off', // SAPUI5 compatibility
    },
  },
];
