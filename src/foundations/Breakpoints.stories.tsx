import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../components/Badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Text } from '../components/Text';
import { breakpointVariants, describeGroup, describeToken, tokens } from './_lib/data';
import { toPx, withPrefix } from './_lib/parse';
import { CopyName, FoundationPage, PageSection, useLive, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Breakpoints: the `--breakpoint-*` tokens, the Tailwind variant each is
 * (theme.css keeps literal copies because var() is invalid in a media query;
 * a mismatch is flagged here and fails theme.test.ts), and which one the
 * canvas is in right now.
 * ------------------------------------------------------------------------- */

function useMatches(queries: string[]) {
  const [matches, setMatches] = React.useState<boolean[]>(() => queries.map(() => false));
  React.useEffect(() => {
    const lists = queries.map((q) => window.matchMedia(q));
    const update = () => setMatches(lists.map((l) => l.matches));
    update();
    lists.forEach((l) => l.addEventListener?.('change', update));
    return () => lists.forEach((l) => l.removeEventListener?.('change', update));
  }, [queries.join('|')]);
  return matches;
}

function BreakpointsPage({ globals }: { globals: Globals }) {
  return (
    <FoundationPage
      globals={globals}
      title="Breakpoints"
      lede="Mobile-first: every query is min-width, and most components are fluid and never switch. Resize the canvas (or use the Viewport toolbar) to move the indicator."
    >
      <BreakpointsBody />
    </FoundationPage>
  );
}

/* Inside the page, so `useLive()` reads the page's live width. */
function BreakpointsBody() {
  const { width } = useLive();
  const names = withPrefix(tokens.primitives, '--breakpoint-').sort(
    (a, b) => (toPx(tokens.primitives[a] ?? '') ?? 0) - (toPx(tokens.primitives[b] ?? '') ?? 0),
  );
  const queries = names.map((n) => `(min-width: ${tokens.primitives[n]})`);
  const matches = useMatches(queries);
  const currentIndex = matches.lastIndexOf(true);
  const current = currentIndex >= 0 ? names[currentIndex]!.replace('--breakpoint-', '') : null;
  const max = Math.max(...names.map((n) => toPx(tokens.primitives[n] ?? '') ?? 0)) * 1.15;
  return (
    <>
      <section aria-live="polite" className="flex min-w-0 flex-col gap-3 rounded-lg border border-border-strong bg-surface-subtle p-4">
        <Text size="sm" tone="secondary">
          Current breakpoint
        </Text>
        <p className="m-0 type-h2 text-content">
          {current ?? `below ${names[0]?.replace('--breakpoint-', '')}`}{' '}
          <span className="type-body text-content-secondary">· canvas {width}px wide</span>
        </p>
        <div aria-hidden="true" className="relative h-8 w-full rounded-md bg-surface-sunken">
          {names.map((n) => {
            const px = toPx(tokens.primitives[n] ?? '') ?? 0;
            return (
              <span
                key={n}
                className="absolute inset-y-0 w-px bg-border-strong"
                style={{ left: `${(px / max) * 100}%` }}
              />
            );
          })}
          <span
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-action-primary"
            style={{ left: `${Math.min(width / max, 1) * 100}%` }}
          />
        </div>
      </section>
      <PageSection title="Scale" description={describeGroup('breakpoint')}>
        <Table density="compact" scrollLabel="Breakpoints">
          <TableCaption visuallyHidden>Breakpoints</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead numeric>Min width</TableHead>
              <TableHead>Now</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {names.map((n, i) => {
              const key = n.replace('--breakpoint-', '');
              const variant = breakpointVariants[key];
              return (
                <TableRow key={n}>
                  <TableCell>
                    <CopyName name={n} />
                  </TableCell>
                  <TableCell>
                    {variant ? (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        <CopyName name={`${key}:`} />
                        {variant !== tokens.primitives[n] ? (
                          <Badge tone="danger" size="sm">
                            theme.css says {variant}
                          </Badge>
                        ) : null}
                      </span>
                    ) : (
                      <Badge size="sm">no variant</Badge>
                    )}
                  </TableCell>
                  <TableCell numeric>{tokens.primitives[n]}</TableCell>
                  <TableCell>
                    {i === currentIndex ? (
                      <Badge tone="brand" size="sm">
                        current
                      </Badge>
                    ) : matches[i] ? (
                      <Badge size="sm">matches</Badge>
                    ) : (
                      <Text as="span" size="sm" tone="secondary">
                        not yet
                      </Text>
                    )}
                  </TableCell>
                  <TableCell>
                    <Text as="span" size="sm" tone="secondary">
                      {describeToken(n) ?? '—'}
                    </Text>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Text size="sm" tone="secondary" className="max-w-measure">
          Tokens that change at a width:{' '}
          {tokens.responsive
            .map((r) => `${Object.keys(r.values).length} from ${r.minWidth}px`)
            .join(', ')}{' '}
          (the type roles and the page gutter). A media query cannot read a custom property, so the variants are
          literal copies of these values.
        </Text>
      </PageSection>
    </>
  );
}

const meta = { title: 'Foundations/Breakpoints' } satisfies Meta;
export default meta;

export const Breakpoints: StoryObj = {
  render: (_args, { globals }) => <BreakpointsPage globals={globals} />,
};
