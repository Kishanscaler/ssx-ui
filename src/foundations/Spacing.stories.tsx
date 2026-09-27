import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../components/Text';
import { breakpointVariants, describeGroup, tokens } from './_lib/data';
import { toPx, withPrefix } from './_lib/parse';
import { CopyName, FoundationPage, PageSection, ScaleTable, UtilityNames, byValue, useLive, withPx, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Spacing: the `--space-*` scale as bars, then the page gutter (which steps
 * at a breakpoint, so it is read from the responsive block too).
 * ------------------------------------------------------------------------- */

const GUTTER = '--space-gutter';

function Gutter() {
  const { values } = useLive();
  const up = tokens.responsive.find((r) => r.values[GUTTER] !== undefined);
  const upName = Object.entries(breakpointVariants).find(([, v]) => toPx(v) === up?.minWidth)?.[0];
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <CopyName name={GUTTER} />
        <UtilityNames name={GUTTER} prefer="px" />
      </div>
      <Text size="sm" tone="secondary" className="max-w-measure">
        {describeGroup('layout.gutter')}
      </Text>
      <Text size="sm">
        Phone: <span className="font-mono">{withPx(tokens.primitives[GUTTER] ?? '')}</span>
        {up ? (
          <>
            {' '}
            · {upName ?? `${up.minWidth}px`}+: <span className="font-mono">{withPx(up.values[GUTTER] ?? '')}</span>
          </>
        ) : null}{' '}
        · now: <span className="font-mono">{withPx(values[GUTTER] ?? '')}</span>
      </Text>
      {/* The gutter drawn: a frame whose inline padding IS the token. */}
      <div aria-hidden="true" className="rounded-lg border border-border-control bg-surface-brand-subtle" style={{ paddingInline: `var(${GUTTER})` }}>
        <div className="flex h-16 items-center justify-center bg-surface text-sm text-content-secondary">content</div>
      </div>
      <Text size="xs" tone="secondary">
        The tinted bands either side are the gutter at the current canvas width.
      </Text>
    </div>
  );
}

function SpacingPage({ globals }: { globals: Globals }) {
  const scale = withPrefix(tokens.primitives, '--space-')
    .filter((n) => n !== GUTTER)
    .sort(byValue);
  return (
    <FoundationPage
      globals={globals}
      title="Spacing"
      lede="One scale for padding, gaps and margins. Pick the step by what the space separates (the description says), not by how it looks."
    >
      <PageSection title="Scale" description={describeGroup('space')}>
        <ScaleTable
          caption="Space scale"
          names={scale}
          sampleHead="Bar"
          sample={(n) => (
            <span
              aria-hidden="true"
              className="block h-4 rounded-sm bg-surface-brand-solid"
              style={{ width: `var(${n})`, minWidth: 1 }}
            />
          )}
        />
      </PageSection>
      <PageSection title="The page gutter" description="The space between the screen edge and the content, on whatever owns the page edge.">
        <Gutter />
      </PageSection>
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Spacing' } satisfies Meta;
export default meta;

export const Spacing: StoryObj = {
  render: (_args, { globals }) => <SpacingPage globals={globals} />,
};
