module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { babelConfig: false }],
  },
  testRegex: '(/__tests__/.*|\\.(test))\\.(ts|js)$',
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['<rootDir>/__tests__'],
  testPathIgnorePatterns: ['/node_modules/'],
}
