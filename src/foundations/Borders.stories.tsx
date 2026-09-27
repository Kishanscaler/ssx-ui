import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ColourRow } from './_lib/colour';
import { semanticColours, tokens } from './_lib/data';
import { withPrefix } from './_lib/parse';
import { FoundationPage, PageSection, ScaleTable, TokenList, byValue, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Borders: the width tokens, then every semantic colour that is an edge (its
 * name says border, or it is the focus ring), with its 1.4.11 contrast.
 * ------------------------------------------------------------------------- */

function BordersPage({ globals }: { globals: Globals }) {
  // Widths are the untyped `--border-*` primitives; `--border-subtle` etc. are
  // semantic colours and live in the themed blocks, so they are not in here.
  const widths = withPrefix(tokens.primitives, '--border-').sort(byValue);
  const colours = semanticColours.filter((n) => /border|focus/.test(n));
  return (
    <FoundationPage
      globals={globals}
      title="Borders"
      lede="Depth in this system is carried by borders, not shadows. A hairline is the default; the thick width is for focus, selection and accent rules."
    >
      <PageSection title="Widths" description="Tailwind's own border and border-2 draw these widths; the tokens are for var() use.">
        <ScaleTable
          caption="Border widths"
          names={widths}
          sample={(n) => (
            <span aria-hidden="true" className="block w-24 border-border-strong" style={{ borderTopStyle: 'solid', borderTopWidth: `var(${n})` }} />
          )}
        />
      </PageSection>
      <PageSection
        title="Border colours"
        description="Every semantic colour that draws an edge, with the boundaries the contrast gate checks (3:1, WCAG 1.4.11). Decorative hairlines are not gated."
      >
        <TokenList>
          {colours.map((n) => (
            <ColourRow key={n} name={n} edge />
          ))}
        </TokenList>
      </PageSection>
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Borders' } satisfies Meta;
export default meta;

export const Borders: StoryObj = {
  render: (_args, { globals }) => <BordersPage globals={globals} />,
};
