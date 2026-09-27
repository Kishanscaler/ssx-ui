import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from '../components/Link';
import { Text } from '../components/Text';
import { audit, semanticColours, tokens } from './_lib/data';
import { FoundationPage, PageSection, type Globals } from './_lib/ui';

/* Foundations/Overview: the three rules, and the pages. */

const PAGES: Array<[title: string, id: string, what: string]> = [
  ['Colour', 'foundations-colour--colour', 'semantic roles by purpose, with utilities, live values and gated contrast; primitives last'],
  ['Type', 'foundations-type--type', 'the type-* roles at phone and sm+, the families, the scales under them'],
  ['Spacing', 'foundations-spacing--spacing', 'the space scale and the page gutter'],
  ['Radius', 'foundations-radius--radius', 'the radius ladder'],
  ['Borders', 'foundations-borders--borders', 'widths and every edge colour, with its 3:1 checks'],
  ['Elevation', 'foundations-elevation--elevation', 'the shadow levels, and lighter surfaces in dark mode'],
  ['Motion', 'foundations-motion--motion', 'durations and easings, with demos'],
  ['Breakpoints', 'foundations-breakpoints--breakpoints', 'the widths, their variants, and which one you are in'],
  ['Sizes', 'foundations-sizes--sizes', 'control heights, icon sizes, the 44px touch minimum, the prose measure'],
  ['Z-index', 'foundations-z-index--z-index', 'the named layers in stacking order'],
];

function OverviewPage({ globals }: { globals: Globals }) {
  return (
    <FoundationPage
      globals={globals}
      title="Foundations"
      lede="The token layer, shown the way it is meant to be used. Everything on these pages follows the Brand and Theme toolbar."
    >
      <PageSection title="Three rules">
        <Text className="max-w-measure">
          <strong>Semantic first.</strong> Reach for a role (what a colour or size is for: a raised surface, secondary
          text, the control edge), never for a swatch. Only semantic tokens are Tailwind utilities; the{' '}
          {Object.keys(tokens.primitives).filter((n) => n.startsWith('--color-')).length} colour primitives are not, on
          purpose, and they sit at the bottom of the Colour page, collapsed. <strong>Contrast sits next to colour.</strong>{' '}
          Each of the {semanticColours.length} semantic colours lists the pairings the build gates it in, per theme (
          {audit.pairings['sst-light'].length} per theme), with the declared hover exceptions marked as exceptions.
        </Text>
        <Text className="max-w-measure">
          <strong>Generated, never hand-maintained.</strong> These pages read the generated stylesheet
          (tokens.generated.css), the Tailwind bridge (theme.css), the contrast report (audit.txt) and the DTCG sources
          for descriptions, all copied in by npm run sync:tokens. A token added in the pipeline appears here with no edit;
          a number on these pages that disagrees with the build is a bug in the page, not in the tokens.
        </Text>
      </PageSection>
      <PageSection title="Pages">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {PAGES.map(([title, id, what]) => (
            <li key={id}>
              <Text>
                <Link href={`./?path=/story/${id}`} target="_top">
                  {title}
                </Link>{' '}
                <span className="text-content-secondary">— {what}</span>
              </Text>
            </li>
          ))}
        </ul>
      </PageSection>
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Overview' } satisfies Meta;
export default meta;

export const Overview: StoryObj = {
  render: (_args, { globals }) => <OverviewPage globals={globals} />,
};
