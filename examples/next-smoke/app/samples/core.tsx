import type { Samples } from './types';

/** Core atoms (done). */
const samples: Samples = {
  Button: (ui) => (
    <>
      <ui.Button>Apply now</ui.Button>
      <ui.Button variant="secondary">Download brochure</ui.Button>
      <ui.Button variant="tertiary">Add another</ui.Button>
      <ui.Button variant="danger">Withdraw</ui.Button>
      <ui.Button variant="neutral">Dismiss</ui.Button>
      <ui.Button loading>Saving</ui.Button>
      <ui.Button shine>Start learning</ui.Button>
      <ui.Button disabled>Disabled</ui.Button>
      <ui.Button type="submit" className="h-12">
        className override (h-12)
      </ui.Button>
    </>
  ),
  Input: (ui) => (
    <div className="grid w-full gap-3 md:grid-cols-3">
      <ui.Input size="sm" placeholder="Small" aria-label="Small input" />
      <ui.Input placeholder="Work email" aria-label="Work email" />
      <ui.Input size="lg" placeholder="Large" aria-label="Large input" />
      <ui.Input aria-invalid placeholder="Invalid" aria-label="Invalid input" />
      <ui.Input disabled placeholder="Disabled" aria-label="Disabled input" />
      <ui.Input readOnly defaultValue="Read only" aria-label="Read-only input" />
    </div>
  ),
  Spinner: (ui) => (
    <div className="flex items-center gap-6 text-content-brand">
      <ui.Spinner size="sm" />
      <ui.Spinner size="md" />
      <ui.Spinner size="lg" />
      <ui.Spinner size="xl" label="Loading page" />
    </div>
  ),
};

export default samples;
