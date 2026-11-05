import type { SuiteConfiguration } from "sap/ui/test/starter/config";

// UI5 loads from the CDN, so the shared namespace is mapped here the way a
// module's index.html maps it.
export default {
  name: "QUnit test suite for the Life OS shared library",
  defaults: {
    page: "ui5://test-resources/com/lifeos/shared/Test.qunit.html?testsuite={suite}&test={name}",
    qunit: { version: 2 },
    sinon: { version: false },
    ui5: { theme: "sap_horizon" },
    loader: {
      paths: {
        "com/lifeos/shared": "/lifeos-shared/",
      },
    },
  },
  tests: {
    "unit/unitTests": { title: "Unit tests for the Life OS shared library" },
  },
} satisfies SuiteConfiguration;
