import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion } from '../components/Accordion';
import { Badge } from '../components/Badge';
import { Code } from '../components/Code';
import { Text } from '../components/Text';
import { bridge, describeGroup, describeToken, tokens } from './_lib/data';
import { THEMES, THEME_LABEL, splitTopLevel } from './_lib/parse';
import { CopyName, FoundationPage, PageSection, UtilityNames, useLive, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Elevation. Every semantic `--shadow-*` token (themed in tokens.generated.css
 * or mapped in theme.css), found generically: numbered levels first, then the
 * named ones, each marked as an alias when its value equals a level's in all
 * four themes. Then how dark mode carries elevation with lighter surfaces.
 * ------------------------------------------------------------------------- */

const isShadow = (n: string) => /^--shadow-/.test(n);

function shadowTokens(): string[] {
  const names = new Set<string>([...tokens.semantic.filter(isShadow), ...Object.keys(bridge).filter(isShadow)]);
  const level = (n: string) => {
    const m = /^--shadow-(\d+)$/.exec(n);
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
  };
  return [...names].sort((a, b) => level(a) - level(b) || a.localeCompare(b));
}

/** The token this one equals in every theme (or points at with var()), if any. */
function aliasOf(name: string, all: string[]): string | undefined {
  if (/^--shadow-\d+$/.test(name)) return undefined;
  for (const other of all) {
    if (other === name || !/^--shadow-\d+$/.test(other)) continue;
    const same = THEMES.every((t) => {
      const a = tokens.themes[t][name] ?? tokens.primitives[name];
      const b = tokens.themes[t][other] ?? tokens.primitives[other];
      return a !== undefined && (a === b || a === `var(${other})`);
    });
    if (same) return other;
  }
  return undefined;
}

const layerCount = (value: string | undefined) => (value && value !== 'none' ? splitTopLevel(value).length : 0);

function ShadowCard({ name, alias }: { name: string; alias?: string }) {
  const { values, theme } = useLive();
  const now = values[name] || tokens.themes[theme][name] || '';
  const layers = splitTopLevel(now);
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-border-decorative p-4">
      {/* The level, on a raised surface over the page, in the current theme. */}
      <div className="flex items-center justify-center rounded-md bg-page px-4 py-8">
        <div
          aria-hidden="true"
          className="flex h-20 w-full max-w-[12rem] items-center justify-center rounded-lg bg-surface-raised text-sm text-content-secondary"
          style={{ boxShadow: `var(${name})` }}
        >
          {name.replace('--shadow-', '')}
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <CopyName name={name} />
        <UtilityNames name={name} />
        {alias ? (
          <Badge tone="info" size="sm">
            alias of {alias.slice(2)}
          </Badge>
        ) : null}
      </div>
      {describeToken(name) ? (
        <Text size="sm" tone="secondary">
          {describeToken(name)}
        </Text>
      ) : null}
      <Text size="sm">
        {layers.length} {layers.length === 1 ? 'layer' : 'layers'} in {THEME_LABEL[theme]}
        {layers.some((l) => l.startsWith('inset')) ? ', including an inset top highlight' : ''}
      </Text>
      <ol className="m-0 flex list-decimal flex-col gap-0.5 pl-5">
        {layers.map((l, i) => (
          <li key={i} className="font-mono text-xs text-content-secondary [overflow-wrap:anywhere]">
            {l}
          </li>
        ))}
      </ol>
      <Text size="xs" tone="secondary">
        Layers per theme: {THEMES.map((t) => `${THEME_LABEL[t]} ${layerCount(tokens.themes[t][name])}`).join(' · ')}
      </Text>
    </li>
  );
}

function DarkElevation() {
  const { values } = useLive();
  const layers = ['--surface-page', '--surface-default', '--surface-raised'].filter((n) => n in tokens.themes['sst-light']);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div aria-hidden="true" className="rounded-lg border border-border-decorative p-4" style={{ background: `var(${layers[0]})` }}>
        <div className="rounded-lg border border-border-decorative p-4" style={{ background: `var(${layers[1]})` }}>
          <div
            className="rounded-xl border border-border-raised p-4"
            style={{ background: `var(${layers[2]})`, boxShadow: 'var(--shadow-raised)' }}
          >
            <span className="text-sm text-content">raised</span>
          </div>
          <span className="mt-2 block text-sm text-content">card</span>
        </div>
        <span className="mt-2 block text-sm text-content">page</span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {layers.map((n) => (
          <li key={n} className="flex flex-wrap items-center gap-2">
            <Code>{n}</Code>
            <Text as="span" size="sm">
              now {values[n]}
            </Text>
            <Text as="span" size="xs" tone="secondary">
              ({THEMES.map((t) => `${THEME_LABEL[t]} ${tokens.themes[t][n]}`).join(' · ')})
            </Text>
          </li>
        ))}
      </ul>
      {describeToken('--surface-default') ? (
        <Text size="sm" tone="secondary" className="max-w-measure">
          {describeToken('--surface-default')}
        </Text>
      ) : null}
    </div>
  );
}

function ElevationPage({ globals }: { globals: Globals }) {
  const all = shadowTokens();
  const primitives = Object.keys(tokens.primitives).filter(isShadow);
  return (
    <FoundationPage
      globals={globals}
      title="Elevation"
      lede="Shadows are for layers that float or lift, never for a resting card: borders carry depth. Each level is authored separately for light and dark."
    >
      <PageSection title="Shadow levels" description={describeGroup('shadow')}>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(17rem,100%),1fr))] gap-4 p-0">
          {all.map((n) => (
            <ShadowCard key={n} name={n} alias={aliasOf(n, all)} />
          ))}
        </ul>
      </PageSection>
      <PageSection
        title="Dark mode carries elevation with lighter surfaces"
        description="On a black page a shadow barely registers, so each step up is also a lighter surface. Flip the Theme toolbar to compare."
      >
        <DarkElevation />
      </PageSection>
      {primitives.length ? (
        <PageSection title="Primitives" description="The per-mode values the levels alias.">
          <Accordion
            headingLevel="h3"
            items={[
              {
                value: 'shadow-primitives',
                title: 'Reference only — never use these in product code; use a semantic token',
                content: (
                  <ul className="m-0 flex list-none flex-col gap-2 py-2 pl-0">
                    {primitives.map((n) => (
                      <li key={n} className="flex min-w-0 flex-col">
                        <Text as="span" size="sm" className="font-mono font-semibold">
                          {n}
                        </Text>
                        <Text size="xs" tone="secondary" className="font-mono">
                          {tokens.primitives[n]}
                        </Text>
                      </li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </PageSection>
      ) : null}
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Elevation' } satisfies Meta;
export default meta;

export const Elevation: StoryObj = {
  render: (_args, { globals }) => <ElevationPage globals={globals} />,
};
