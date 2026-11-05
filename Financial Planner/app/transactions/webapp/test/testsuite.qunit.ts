import type { SuiteConfiguration } from "sap/ui/test/starter/config";

// UI5 loads from the CDN (app/index.html), so the app and shared namespaces are
// mapped here the way index.html maps them for the shell.
export default {
  name: "QUnit test suite for the Transactions app",
  defaults: {
    page: "ui5://test-resources/com/financialplanner/transactions/Test.qunit.html?testsuite={suite}&test={name}",
    qunit: { version: 2 },
    sinon: { version: false },
    ui5: { theme: "sap_horizon" },
    loader: {
      paths: {
        "com/financialplanner/transactions": "../",
        "com/financialplanner/shared": "/shared/",
      },
    },
  },
  tests: {
    "unit/unitTests": { title: "Unit tests for the Transactions app" },
    "integration/TransactionsJourney": {
      title: "Journey for the Transaction List split and categorize dialogs",
    },
  },
} satisfies SuiteConfiguration;
