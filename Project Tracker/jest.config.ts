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
  // Only the global band is here, and that is measured rather than a trim of the
  // strategy's table. Jest resolves a threshold group against the files it
  // actually covered, and a group matching none is a hard error — not a skip. The
  // per-layer bands (Validators 100/100, Services and verbs and scripts 90/85)
  // land with the story that creates the first file under each folder.
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 80,
    },
  },
};

export default config;
