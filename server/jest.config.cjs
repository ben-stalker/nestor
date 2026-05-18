/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
          types: ['jest', 'node'],
        },
      },
    ],
  },
  collectCoverageFrom: ['src/services/**/*.ts', 'src/repositories/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
};

module.exports = config;
