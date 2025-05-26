/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }]
  },
  // テストで必要なセットアップ
  setupFiles: ['./__tests__/jest.setup.js'],
  // testsファイルのマッチングパターン
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.cjs',
    '**/__tests__/**/*.test.js'
  ],
};