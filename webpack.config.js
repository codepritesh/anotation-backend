const path = require('path')

module.exports = {
  stats: 'verbose',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'api.bundle.js'
  },
  target: 'node',
  mode: 'production',
  externals: {
    fs: '{}'
  }
}
