export default [{
  input: 'src/lambda/handler.js',
  output: {
    file: 'dist/server.js',
    format: 'cjs'
  }
}, {
  input: 'src/cli/index.js',
  output: {
    file: 'dist/cli.js',
    format: 'cjs'
  },
  // we don't actually include bundles
  external: ['inquirer', 'loglevel', '@apollo/client/core']
}]
