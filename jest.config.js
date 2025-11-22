module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/test/mocks/obsidian.ts',
    '^src/components/(.*)$': '<rootDir>/test/mocks/components.ts',
    '^src/hooks/(.*)$': '<rootDir>/test/mocks/hooks.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^react$': '<rootDir>/test/mocks/react.ts',
    '^react-dom$': '<rootDir>/test/mocks/react-dom.ts',
    '^reactflow$': '<rootDir>/test/mocks/reactflow.ts',
    '^lucide-react$': '<rootDir>/test/mocks/lucide-react.ts',
    '^react-select/creatable$': '<rootDir>/test/mocks/react-select.ts',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
