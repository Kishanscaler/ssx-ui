// What @rails/webpacker 4.2's generated babel.config.js does, trimmed to the
// parts that change the output: preset-env for the app's browsers, preset-react
// in the CLASSIC runtime (React 16.12 has no react/jsx-runtime).
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: '> 1%, not IE 11', modules: false }],
    ['@babel/preset-react', { development: process.env.NODE_ENV !== 'production' }],
  ],
};
