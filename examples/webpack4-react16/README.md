# webpack4-react16

The Rails monolith, reduced to a fixture: **webpack 4.41.2** (what @rails/webpacker 4.2.2
installs), `babel-loader` with `exclude: /node_modules/`, webpacker's default CSS chain
(css-loader 3.2 + postcss-loader 3 / PostCSS 7 + postcss-preset-env 6.7 stage 3), and
**React + ReactDOM 16.12.0**, rendered client-side with `ReactDOM.render` into an empty
`<div id="x-root">`.

## Run it

From `react/`:

```bash
npm run smoke:legacy            # SMOKE_SKIP_BUILD=1 to reuse the current dist/
```

It builds and packs the package, installs the tarball here, fetches Node 14 once into
`.legacy-node/` (the newest 14.x published for this platform; on Apple silicon that is
14.18.2, the last arm64 build; override with `SSX_LEGACY_NODE=/path/to/node`), runs webpack
4 **on Node 14** in development and production mode, then loads both bundles in headless
Chromium (both brands, both themes) and asserts: no console errors or warnings, React
16.12.0, the package resolved to `dist/legacy/` with no dependency taken from
node_modules, every exported component rendered, a Button click reached `onClick`, and
the standalone CSS applied the brand's colours. Screenshots land in `.shots/`.

## Adding an atom

Nothing, usually. `src/index.js` renders **every** PascalCase export of the package with
no props. If yours cannot render bare (a compound part, a required prop), add a sample to
your batch's file in `src/samples/` (`batch-a.js`, `batch-b.js`, `batch-c.js`; never
another batch's), and the same in `examples/next-smoke/app/samples/`.

## What it deliberately does not do

It adds nothing to the webpack config for this package. If the package needed a
consumer-side alias, loader rule or Babel include to work here, the real app would need
it too, and this fixture exists to prove it does not.
