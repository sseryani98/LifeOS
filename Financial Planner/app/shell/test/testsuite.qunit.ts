import type { SuiteConfiguration } from "sap/ui/test/starter/config";

// UI5 loads from the CDN (app/index.html), so the app and shared namespaces are
// mapped here the way index.html maps them for the shell.
export default {
  name: "QUnit test suite for the Shell app",
  defaults: {
    page: "ui5://test-resources/com/financialplanner/shell/Test.qunit.html?testsuite={suite}&test={name}",
    qunit: { version: 2 },
    sinon: { version: false },
    ui5: { theme: "sap_horizon" },
    loader: {
      paths: {
        "com/financialplanner/shell": "../",
        "com/financialplanner/shared": "/shared/",
        "com/lifeos/shared": "/lifeos-shared/",
      },
    },
  },
  tests: {
    "unit/unitTests": { title: "Unit tests for the Shell app" },
  },
} satisfies SuiteConfiguration;
