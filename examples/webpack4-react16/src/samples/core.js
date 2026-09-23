import * as React from 'react';

/** Core atoms. The Button sample is also the click check (#click-count). */
function ClickCounter({ ui }) {
  const [count, setCount] = React.useState(0);
  return (
    <>
      <ui.Button data-testid="click-target" onClick={() => setCount((n) => n + 1)}>
        Apply now
      </ui.Button>
      <output data-testid="click-count">{count}</output>
    </>
  );
}

export default {
  Button: (ui) => (
    <>
      <ClickCounter ui={ui} />
      <ui.Button variant="secondary">Download brochure</ui.Button>
      <ui.Button variant="tertiary">Add another</ui.Button>
      <ui.Button variant="danger">Withdraw</ui.Button>
      <ui.Button variant="neutral">Dismiss</ui.Button>
      <ui.Button loading>Saving</ui.Button>
      <ui.Button shine>Start learning</ui.Button>
      <ui.Button disabled>Disabled</ui.Button>
      <ui.Button size="sm">Small</ui.Button>
      <ui.Button size="lg">Large</ui.Button>
      <ui.Button asChild>
        <a href="#apply">As a link</a>
      </ui.Button>
    </>
  ),
  Input: (ui) => (
    <>
      <ui.Input aria-label="Work email" placeholder="Work email" />
      <ui.Input aria-label="Invalid" aria-invalid defaultValue="nope" />
      <ui.Input aria-label="Disabled" disabled placeholder="Disabled" />
      <ui.Input aria-label="Read only" readOnly defaultValue="Read only" />
    </>
  ),
  Spinner: (ui) => (
    <>
      <ui.Spinner />
      <ui.Spinner size="md" />
      <ui.Spinner size="lg" label="Loading page" />
    </>
  ),
};
