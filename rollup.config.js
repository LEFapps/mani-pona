// import hashbang from 'rollup-plugin-hashbang'

export default [{
  input: 'src/lambda/handler.js',
  output: {
    file: 'dist/server.js',
    format: 'cjs'
  }
}
  /*
  , {
  input: 'cli/index.js',
  output: {
    file: 'dist/cli.js',
    format: 'cjs'
  },
  // we don't actually include bundles
  external: ['inquirer', 'loglevel', '@apollo/client/core'],
  plugins: [
    hashbang()
  ]
} */
]
