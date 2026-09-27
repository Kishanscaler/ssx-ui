import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { describeGroup, tokens } from './_lib/data';
import { withPrefix } from './_lib/parse';
import { FoundationPage, PageSection, ScaleTable, byValue, type Globals } from './_lib/ui';

/* Radius: the `--radius-*` ladder, each drawn on a box. */

function RadiusPage({ globals }: { globals: Globals }) {
  const names = withPrefix(tokens.primitives, '--radius-').sort(byValue);
  return (
    <FoundationPage
      globals={globals}
      title="Radius"
      lede="A ladder, not one value: the rounding says what kind of thing it is. Controls are tightest, then cards, then panels and overlays."
    >
      <PageSection title="Scale" description={describeGroup('radius')}>
        <ScaleTable
          caption="Radius scale"
          names={names}
          sample={(n) => (
            <span
              aria-hidden="true"
              className="block size-12 border-2 border-border-strong bg-surface-sunken"
              style={{ borderRadius: `var(${n})` }}
            />
          )}
        />
      </PageSection>
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Radius' } satisfies Meta;
export default meta;

export const Radius: StoryObj = {
  render: (_args, { globals }) => <RadiusPage globals={globals} />,
};
