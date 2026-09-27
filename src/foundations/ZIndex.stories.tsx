import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { tokens } from './_lib/data';
import { withPrefix } from './_lib/parse';
import { FoundationPage, PageSection, ScaleTable, type Globals } from './_lib/ui';

/* Z-index: the `--z-*` layers in stacking order, drawn as overlapping cards. */

function ZIndexPage({ globals }: { globals: Globals }) {
  const names = withPrefix(tokens.primitives, '--z-').sort(
    (a, b) => Number(tokens.primitives[a]) - Number(tokens.primitives[b]),
  );
  return (
    <FoundationPage
      globals={globals}
      title="Z-index"
      lede="Named layers, spaced far apart so nothing needs a z-index of 9999. Use the layer that says what the element is."
    >
      <PageSection title="Layers" description="Lowest first. Each card sits on its own token, so the drawing is the real stacking order.">
        <div aria-hidden="true" className="relative isolate w-full max-w-[28rem]" style={{ height: `${names.length * 1.75 + 3}rem` }}>
          {names.map((n, i) => (
            <div
              key={n}
              className="absolute flex h-12 items-center rounded-lg border border-border-raised bg-surface-raised px-3 text-sm text-content shadow-raised"
              style={{ zIndex: `var(${n})` as unknown as number, top: `${i * 1.75}rem`, left: `${i * 1.25}rem`, right: `${(names.length - i) * 0.5}rem` }}
            >
              {n.replace('--z-', '')} · {tokens.primitives[n]}
            </div>
          ))}
        </div>
        <ScaleTable caption="Z-index layers" names={names} />
      </PageSection>
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Z-index' } satisfies Meta;
export default meta;

export const ZIndex: StoryObj = {
  name: 'Z-index',
  render: (_args, { globals }) => <ZIndexPage globals={globals} />,
};
