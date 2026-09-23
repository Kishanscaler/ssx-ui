/**
 * The pack. Imports EVERY export of @kishanscaler/ssx-ui from the package root,
 * exactly as the Rails app would, and renders each PascalCase export (a
 * component) into its own section with ReactDOM.render — React 16.12, client
 * only, no hydration.
 *
 * Coverage is automatic: a new atom exported from src/index.ts is rendered
 * here with no props, and the smoke fails if that throws. An export that
 * cannot render bare (a compound part, a required prop) gets a sample in its
 * batch's file in ./samples. See ./samples/index.js.
 *
 * Results go to window.__SSX_SMOKE__ for scripts/smoke-legacy.mjs to assert.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ui from '@kishanscaler/ssx-ui';
// A REAL file path, not the `@kishanscaler/ssx-ui/standalone.css` subpath: webpack 4
// does not read `exports`, so a subpath export does not resolve here.
import '@kishanscaler/ssx-ui/dist/ssx.standalone.css';

import { samples } from './samples';

const params = new URLSearchParams(window.location.search);
const brand = params.get('brand') || 'sst';
const theme = params.get('theme') || 'light';
document.documentElement.setAttribute('data-brand', brand);
document.documentElement.setAttribute('data-theme', theme);

const names = Object.keys(ui).sort();
const components = names.filter((name) => /^[A-Z]/.test(name));

const result = {
  react: React.version,
  brand,
  theme,
  exports: names,
  components,
  samples: {},
  renderErrors: {},
  unknownSamples: Object.keys(samples).filter((name) => !(name in ui)),
};
window.__SSX_SMOKE__ = result;

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    result.renderErrors[this.props.name] = String((error && error.stack) || error);
  }
  render() {
    if (this.state.error) return <pre data-render-error>{String(this.state.error)}</pre>;
    return this.props.children;
  }
}

/**
 * samples[name] is:
 *   undefined  -> render <X /> with no props (the default; most atoms)
 *   a function -> (ui) => element, for an export that needs props or parents
 *   a string   -> the name of the export whose sample already renders this one
 *                 (a compound part: 'SelectItem' -> 'Select')
 */
function Sample({ name }) {
  const sample = samples[name];
  if (typeof sample === 'string') {
    result.samples[name] = `covered-by:${sample}`;
    return null;
  }
  if (typeof sample === 'function') {
    result.samples[name] = 'custom';
    return sample(ui);
  }
  result.samples[name] = 'default';
  const Component = ui[name];
  return <Component />;
}

function App() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, background: 'var(--surface-page)', color: 'var(--content-primary)', fontFamily: 'var(--font-family-sans)' }}>
      <h1 style={{ margin: 0, fontSize: 20 }}>
        @kishanscaler/ssx-ui on webpack 4 + React {React.version} ({brand} / {theme})
      </h1>
      {/* Resolves the brand's primary colour for the harness to compare with. */}
      <div data-probe="action-primary" style={{ background: 'var(--action-primary-bg)', height: 4 }} />
      {components.map((name) => (
        <section key={name} data-sample={name} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Boundary name={name}>
            <Sample name={name} />
          </Boundary>
        </section>
      ))}
    </main>
  );
}

ReactDOM.render(<App />, document.getElementById('x-root'), () => {
  result.rendered = true;
});
