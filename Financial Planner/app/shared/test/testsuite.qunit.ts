import type { SuiteConfiguration } from "sap/ui/test/starter/config";

// UI5 loads from the CDN (app/index.html), so the shared namespace is mapped
// here the way index.html maps it for the shell.
export default {
  name: "QUnit test suite for the shared library",
  defaults: {
    page: "ui5://test-resources/com/financialplanner/shared/Test.qunit.html?testsuite={suite}&test={name}",
    qunit: { version: 2 },
    sinon: { version: false },
    ui5: { theme: "sap_horizon" },
    loader: {
      paths: {
        "com/financialplanner/shared": "/shared/",
        "com/lifeos/shared": "/lifeos-shared/",
      },
    },
  },
  tests: {
    "unit/unitTests": { title: "Unit tests for the shared library" },
  },
} satisfies SuiteConfiguration;
