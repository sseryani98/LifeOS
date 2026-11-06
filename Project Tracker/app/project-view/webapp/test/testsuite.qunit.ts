import type { SuiteConfiguration } from "sap/ui/test/starter/config";

// UI5 loads from the CDN (webapp/index.html), so the app and Life OS shared
// namespaces are mapped here; cds-plugin-ui5 serves the shared one at /lifeos-shared.
export default {
  name: "QUnit test suite for the Project View app",
  defaults: {
    page: "ui5://test-resources/com/lifeos/projecttracker/projectview/Test.qunit.html?testsuite={suite}&test={name}",
    qunit: { version: 2 },
    sinon: { version: false },
    ui5: { theme: "sap_horizon" },
    loader: {
      paths: {
        "com/lifeos/projecttracker/projectview": "../",
        "com/lifeos/shared": "/lifeos-shared/",
      },
    },
  },
  tests: {
    "unit/unitTests": { title: "Unit tests for the Project View app" },
    "integration/ProjectViewJourney": {
      title: "Contract journey for the Project View page",
    },
  },
} satisfies SuiteConfiguration;
