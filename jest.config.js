module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|\\.(test))\\.(ts|js)$',
  globals: {
    'ts-jest': {
      babelConfig: false
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/__tests__'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts']
}
