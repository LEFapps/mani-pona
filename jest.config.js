
module.exports = {
  'setupFilesAfterEnv': ['./tests/fixTextencoder.js'],
  'moduleDirectories': [
    'node_modules',
    'src'
  ],
  'moduleFileExtensions': [
    'js'
  ],
  'transform': {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  }
}
