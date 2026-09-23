import * as React from 'react';
import * as ReactNamespace from 'react';
import * as ReactDOMNamespace from 'react-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * Guards the test harness itself. `npm test` runs the suite twice — React 19
 * (vite.config.ts) and React 16.12 (vitest.react16.config.ts) — and a green
 * React 16 run means nothing if an alias silently fell back to React 19.
 */

// React 16 is CommonJS with a conditional `module.exports`, so Node's ESM
// interop can expose it only as the default export.
function unwrap<T>(ns: T): T {
  return ((ns as { default?: T }).default ?? ns) as T;
}

describe('test harness', () => {
  it('runs on the React it claims to', () => {
    const React = unwrap(ReactNamespace);
    const ReactDOM = unwrap(ReactDOMNamespace) as Record<string, unknown>;
    const expected = process.env.SSX_EXPECT_REACT;
    if (!expected) return;
    expect(React.version).toBe(expected);
    // react-dom@16 has no `version` export; its API is the tell. 16.12 has
    // `render` and none of 18's root API.
    expect(typeof ReactDOM.render).toBe('function');
    expect('createRoot' in ReactDOM).toBe(false);
  });

  it('renders through ONE React: a hook works under the testing library', () => {
    // Two copies of React (ours vs react-dom's) fail here with "Invalid hook call".
    function Counter() {
      const [count] = ReactNamespace.useState(3);
      return <output>{count}</output>;
    }
    render(<Counter />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
