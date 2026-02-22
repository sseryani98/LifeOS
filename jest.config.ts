import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  coverageDirectory: 'coverage/',
  coveragePathIgnorePatterns: [
    '**/node_modules/**',
    '**/@cds-models/**',
    '**/gen/**',
    '**/*Facade.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      branches: 80,
    },
    './srv/modules/**/Validator.ts': {
      lines: 100,
      branches: 100,
    },
    './srv/util/**/*.ts': {
      lines: 100,
      branches: 100,
    },
  },
};

export default config;
