/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/tests/mocks/react-native.ts',
    '^expo-local-authentication$': '<rootDir>/tests/mocks/expo.ts',
    '^expo-secure-store$': '<rootDir>/tests/mocks/expo.ts',
    '^expo-clipboard$': '<rootDir>/tests/mocks/expo.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'es2022',
        module: 'commonjs',
        strict: true,
        esModuleInterop: true,
      },
    }],
  },
  testMatch: ['**/tests/**/*.test.ts'],
};
