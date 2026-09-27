import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../components/Text';
import { tokens } from './_lib/data';
import { withPrefix } from './_lib/parse';
import { FoundationPage, PageSection, ScaleTable, byValue, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Sizes: every `--size-*` token, grouped by the word after `size-` (control,
 * icon, touch, measure, container, and whatever the pipeline adds), each with
 * a drawing that fits its kind.
 * ------------------------------------------------------------------------- */

const GROUPS: Record<string, { title: string; intro: string }> = {
  control: { title: 'Control heights', intro: 'Button, Input and Select heights. Control text does not step with the viewport.' },
  icon: { title: 'Icon sizes', intro: 'The box a glyph is drawn in.' },
  touch: { title: 'Touch minimum', intro: 'On a coarse pointer every smaller control gets an invisible hit area of at least this, centred on it (the touch-target utility).' },
  measure: { title: 'Prose measure', intro: 'How wide a run of text may be. max-w-measure is the one readable line length.' },
  container: { title: 'Container', intro: 'The widest a page’s content column gets.' },
};

/** The utility a developer writes for each kind of size. */
const PREFER: Record<string, string> = { control: 'h', icon: 'size', touch: 'size', measure: 'max-w', container: 'max-w' };

const groupOf = (name: string) => /^--size-([a-z]+)/.exec(name)?.[1] ?? 'other';

const PROSE =
  'Tuition for the Batch of 2029 is billed in two instalments: the first within 14 days of seat confirmation and the second by 30 November. Hostel and mess are billed separately, and nothing is charged before you accept the seat.';

function sample(group: string) {
  return (n: string) => {
    if (group === 'control') {
      return <span aria-hidden="true" className="block w-24 rounded-md border border-border-control bg-surface" style={{ height: `var(${n})` }} />;
    }
    if (group === 'icon') {
      return <span aria-hidden="true" className="block rounded-sm bg-content-brand" style={{ width: `var(${n})`, height: `var(${n})` }} />;
    }
    if (group === 'touch') {
      return (
        <span
          aria-hidden="true"
          className="relative flex items-center justify-center rounded-md border border-dashed border-border-strong"
          style={{ width: `var(${n})`, height: `var(${n})` }}
        >
          <span className="block rounded-md bg-action-primary" style={{ width: 'var(--size-control-sm)', height: 'var(--size-control-sm)' }} />
        </span>
      );
    }
    return null;
  };
}

function Measure({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Text size="xs" tone="secondary" className="font-mono">
        {name} · {tokens.primitives[name]}
      </Text>
      <p
        className="m-0 border-x-2 border-border-brand px-2 type-body text-content"
        style={{ maxWidth: `var(${name})` }}
      >
        {PROSE}
      </p>
    </div>
  );
}

function SizesPage({ globals }: { globals: Globals }) {
  const names = withPrefix(tokens.primitives, '--size-');
  const groups = new Map<string, string[]>();
  for (const n of names) groups.set(groupOf(n), [...(groups.get(groupOf(n)) ?? []), n]);
  const order = [...Object.keys(GROUPS), ...[...groups.keys()].filter((g) => !(g in GROUPS))];
  return (
    <FoundationPage
      globals={globals}
      title="Sizes"
      lede="Fixed sizes that are decisions, not layout: how tall a control is, how big an icon is, how small a tap target may be, and how long a line of prose may run."
    >
      {order
        .filter((g) => groups.has(g))
        .map((g) => {
          const list = groups.get(g)!.sort(byValue);
          const meta = GROUPS[g] ?? { title: g, intro: 'A size added in the token pipeline.' };
          return (
            <PageSection key={g} title={meta.title} description={meta.intro}>
              <ScaleTable caption={meta.title} names={list} prefer={PREFER[g]} sample={g === 'measure' || g === 'container' ? undefined : sample(g)} />
              {g === 'measure' ? (
                <div className="flex min-w-0 flex-col gap-6">
                  {list.map((n) => (
                    <Measure key={n} name={n} />
                  ))}
                </div>
              ) : null}
            </PageSection>
          );
        })}
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Sizes' } satisfies Meta;
export default meta;

export const Sizes: StoryObj = {
  render: (_args, { globals }) => <SizesPage globals={globals} />,
};
