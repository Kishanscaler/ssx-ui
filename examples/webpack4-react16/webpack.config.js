/**
 * The Rails monolith's pipeline, reduced to what matters for consuming
 * @kishanscaler/ssx-ui: @rails/webpacker 4.2.2 = webpack 4.41, babel-loader with
 * `exclude: /node_modules/` (so the package must ALREADY be ES2019), and the
 * css-loader 3 + postcss-loader 3 + postcss-preset-env 6 CSS chain.
 *
 * webpack 4 ignores package.json `exports`: it resolves `browser`, `module`,
 * `main` (in that order) and real file paths only. Nothing here is special-
 * cased for the package; if it needs a config change, the consumer would too.
 *
 *   SSX_MODE=development|production   (default development: React's dev build,
 *                                      which is the one that prints warnings)
 */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const mode = process.env.SSX_MODE === 'production' ? 'production' : 'development';

module.exports = {
  mode,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public/build', mode),
    filename: 'app.js',
  },
  // Readable dev output, no eval (so a parse failure names the file).
  devtool: mode === 'development' ? 'cheap-module-source-map' : false,
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { importLoaders: 1, sourceMap: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: 'app.css' })],
  performance: { hints: false },
};
