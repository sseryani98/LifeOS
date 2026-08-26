import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  // CAP builds its service-impl extension list once, at module load, and only
  // offers ".ts" when CDS_TYPESCRIPT is set. It lives here rather than in each
  // spec because forgetting it is a silent pass: the handlers never register
  // and the suite asserts CAP's generic CRUD instead of the rule under test.
  setupFiles: ["<rootDir>/test/setEnv.ts"],
  // cds.test cold starts exceed Jest's 5s default when several bootstrap under
  // coverage.
  testTimeout: 30000,
  // module: Node16 makes TypeScript source import a sibling as "./x.js"; the
  // mapping is what lets the resolver find the file that is actually there.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  coverageDirectory: "coverage/",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/@cds-models/",
    "/gen/",
    "Facade\\.ts$",
    "mcp/server\\.ts$",
    "/app/",
    // Builders and fixtures are the harness, not the subject. Jest already drops
    // the specs; without this their helpers' error paths drag the product number.
    "/test/",
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 80,
    },
    // Jest resolves a threshold group against the files it actually covered;
    // a group matching none is a hard error, not a skip.
    "./srv/modules/**/*Validator.ts": {
      lines: 100,
      branches: 100,
    },
    "./srv/modules/**/*Service.ts": {
      lines: 90,
      branches: 85,
    },
    "./mcp/verbs/**/*.ts": {
      lines: 90,
      branches: 85,
    },
  },
};

export default config;
