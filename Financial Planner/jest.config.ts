import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  // cds.test spins up an in-memory server per integration suite; cold starts
  // exceed Jest's 5s default when several bootstrap in parallel under coverage.
  testTimeout: 30000,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  coverageDirectory: "coverage/",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/@cds-models/",
    "/gen/",
    "Facade\\.ts$",
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 80,
    },
    "./srv/modules/**/*Validator.ts": {
      lines: 100,
      branches: 100,
    },
    "./srv/modules/**/*Service.ts": {
      lines: 90,
      branches: 85,
    },
    "./srv/modules/shared/encryptionUtility.ts": {
      lines: 100,
      branches: 100,
    },
    "./srv/modules/shared/dateTimeUtility.ts": {
      lines: 100,
      branches: 100,
    },
    "./srv/modules/shared/currencyUtility.ts": {
      lines: 100,
      branches: 100,
    },
  },
};

export default config;
