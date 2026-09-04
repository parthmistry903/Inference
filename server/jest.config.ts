import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  setupFilesAfterEnv: [],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/workerEntry.ts'],
  coverageThreshold: { global: { lines: 80, functions: 80, branches: 70, statements: 80 } },
  testTimeout: 30000,
};

export default config;
