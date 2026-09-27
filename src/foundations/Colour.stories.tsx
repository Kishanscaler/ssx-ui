import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion } from '../components/Accordion';
import { Code } from '../components/Code';
import { Heading } from '../components/Heading';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Text } from '../components/Text';
import { audit, semanticColours, semanticDtcg, tokens } from './_lib/data';
import { THEME_LABEL } from './_lib/parse';
import { ColourRow } from './_lib/colour';
import {
  FoundationPage,
  PageSection,
  PairChip,
  StatusBadge,
  Swatch,
  TokenList,
  useLive,
  type Globals,
} from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Colour. Semantic roles first, grouped by what they are for; each with its
 * utility, description, live value and gated contrast. The primitives last,
 * collapsed. Everything below is derived from the generated files; the only
 * hand-written parts are the section titles and their one-line intros.
 * ------------------------------------------------------------------------- */

/** Path segments for a token: its DTCG path when known, else its CSS name. */
function segments(name: string): string[] {
  const path = semanticDtcg.tokens[name]?.path;
  return path ? path.split('.') : name.slice(2).split('-');
}

interface SectionDef {
  id: string;
  title: string;
  intro: string;
  /** First path segment(s) this section takes. */
  roots: string[];
  /** Subgroup by this path segment (h3s). */
  subBy?: number;
}

const SECTIONS: SectionDef[] = [
  { id: 'surface', title: 'Surfaces', intro: 'What things sit on: the page, cards, raised layers, wells, inverted and brand blocks.', roots: ['surface'] },
  { id: 'content', title: 'Content: text and icons', intro: 'Inks. Each is gated against the surfaces it is meant to sit on (listed under it).', roots: ['content'] },
  { id: 'border', title: 'Borders', intro: 'Decorative hairlines, the 3:1 control edge, and the focus ring.', roots: ['border'] },
  { id: 'action', title: 'Actions', intro: 'Button fills, labels and edges, per variant, with their hover and press.', roots: ['action'], subBy: 1 },
  { id: 'field', title: 'Fields', intro: 'Inputs, selects and textareas.', roots: ['field'] },
  { id: 'status', title: 'Status', intro: 'Success, warning, danger and info: a tint, its border, its ink, a solid fill and the label on it.', roots: ['status'], subBy: 1 },
  { id: 'brand', title: 'Brand tint and accents', intro: 'The brand wash and the two accent families.', roots: ['brandTint', 'accent1', 'accent2'], subBy: 0 },
  { id: 'onImage', title: 'On image: the surface-ink fill', intro: 'Read only by components inside data-surface-ink="on-image" (over a photograph under the image scrim).', roots: ['onImage'] },
  { id: 'glass', title: 'Glass', intro: 'Translucent tints for GlassButton, each gated over its worst backdrop.', roots: ['glass'] },
];

const isScrim = (name: string) => /scrim/.test(name);

function camelTitle(s: string) {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

interface Built {
  def: SectionDef;
  groups: Array<{ title?: string; names: string[] }>;
}

function buildSections(): Built[] {
  const taken = new Set<string>();
  const out: Built[] = [];
  for (const def of SECTIONS) {
    const names = semanticColours.filter((n) => !isScrim(n) && def.roots.includes(segments(n)[0]!));
    names.forEach((n) => taken.add(n));
    if (!names.length) continue;
    if (def.subBy === undefined) {
      out.push({ def, groups: [{ names }] });
      continue;
    }
    const by = new Map<string, string[]>();
    for (const n of names) {
      const key = segments(n)[def.subBy] ?? '';
      by.set(key, [...(by.get(key) ?? []), n]);
    }
    out.push({ def, groups: [...by].map(([k, list]) => ({ title: camelTitle(k), names: list })) });
  }
  const scrims = semanticColours.filter(isScrim);
  scrims.forEach((n) => taken.add(n));
  // Anything the pipeline adds under a new root still shows, in its own section.
  const rest = new Map<string, string[]>();
  for (const n of semanticColours) {
    if (taken.has(n)) continue;
    const root = segments(n)[0]!;
    rest.set(root, [...(rest.get(root) ?? []), n]);
  }
  for (const [root, names] of rest) {
    out.push({ def: { id: root, title: camelTitle(root), intro: 'A semantic family added in the token pipeline.', roots: [root] }, groups: [{ names }] });
  }
  if (scrims.length) {
    out.push({
      def: { id: 'scrim', title: 'Scrims', intro: 'Veils. Translucent: shown over a checkerboard, over white and over black.', roots: [] },
      groups: [{ names: scrims }],
    });
  }
  return out;
}

function ScrimAudit() {
  const { theme } = useLive();
  const rows = audit.scrim[theme];
  if (!rows.length) return null;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Heading as="h3">The modal veil, as audited ({THEME_LABEL[theme]})</Heading>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {rows.map((r) => (
          <li key={r.token} className="flex flex-wrap items-center gap-2">
            <Swatch color={r.from} size="1.25rem" />
            <Text as="span" size="sm" className="font-mono">
              {r.token.slice(2)}
            </Text>
            <Text as="span" size="sm" tone="secondary">
              {r.from} under the veil becomes
            </Text>
            <Swatch color={r.to} size="1.25rem" />
            <Text as="span" size="sm" className="font-mono">
              {r.to}
            </Text>
          </li>
        ))}
      </ul>
      {audit.scrimNotes[theme].map((n) => (
        <Text key={n} size="sm" tone="secondary">
          {n}
        </Text>
      ))}
    </div>
  );
}

function AllPairings() {
  const { theme } = useLive();
  const list = audit.pairings[theme];
  return (
    <PageSection
      title="Every gated pairing"
      description={`All ${list.length} foreground/background pairs the contrast gate checks in ${THEME_LABEL[theme]}: 4.5:1 for text, 3:1 for UI boundaries (WCAG 1.4.11). Read from audit.txt.`}
    >
      <Table density="compact" scrollLabel="Every gated contrast pairing">
        <TableCaption visuallyHidden>Gated contrast pairings, {THEME_LABEL[theme]}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Sample</TableHead>
            <TableHead>What</TableHead>
            <TableHead>Foreground on background</TableHead>
            <TableHead numeric>Ratio</TableHead>
            <TableHead numeric>Min</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p, i) => (
            <TableRow key={`${p.fg}-${p.bg}-${i}`}>
              <TableCell>
                <PairChip pairing={p} />
              </TableCell>
              <TableCell>{p.label}</TableCell>
              <TableCell>
                <span className="font-mono text-sm">
                  {p.fg.slice(2)} on {p.bg.slice(2)}
                </span>
              </TableCell>
              <TableCell numeric>{p.ratio.toFixed(2)}:1</TableCell>
              <TableCell numeric>{p.min}</TableCell>
              <TableCell>
                <span className="inline-flex flex-wrap items-center gap-1">
                  <StatusBadge pairing={p} />
                  {p.note ? (
                    <Text as="span" size="xs" tone="secondary">
                      {p.note}
                    </Text>
                  ) : null}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {audit.exceptions.length ? (
        <div className="flex flex-col gap-1">
          {audit.exceptions.map((line) => (
            <Text key={line} size="sm" tone="secondary">
              {line}
            </Text>
          ))}
        </div>
      ) : null}
    </PageSection>
  );
}

/* ---- primitives ------------------------------------------------------------------ */

const FAMILY_ORDER = ['neutral', 'sst', 'ssb', 'accent1', 'accent2', 'success', 'warning', 'danger', 'info'];

function primitiveRamps() {
  const ramps = new Map<string, Array<{ name: string; step: string }>>();
  const others: string[] = [];
  for (const name of Object.keys(tokens.primitives)) {
    if (!name.startsWith('--color-')) continue;
    const m = /^--color-([a-z0-9]+)-(light|dark)-(\d+)$/.exec(name);
    if (m) {
      const key = `${m[1]} ${m[2]}`;
      ramps.set(key, [...(ramps.get(key) ?? []), { name, step: m[3]! }]);
    } else others.push(name);
  }
  const rank = (key: string) => {
    const i = FAMILY_ORDER.indexOf(key.split(' ')[0]!);
    return i === -1 ? FAMILY_ORDER.length : i;
  };
  const list = [...ramps]
    .map(([key, steps]) => ({ key, steps: steps.sort((a, b) => Number(a.step) - Number(b.step)) }))
    .sort((a, b) => rank(a.key) - rank(b.key) || b.key.localeCompare(a.key)); // light before dark
  return { list, others };
}

function Primitives() {
  const { list, others } = primitiveRamps();
  const total = Object.keys(tokens.primitives).filter((n) => n.startsWith('--color-')).length;
  return (
    <div className="flex min-w-0 flex-col gap-8 py-2">
      <Text size="sm" tone="secondary" className="max-w-measure">
        {total} colour primitives. They do not follow data-brand or data-theme, and none of them is a Tailwind
        utility, on purpose: a semantic token aliases them per theme (the alias is shown on each semantic row
        above).
      </Text>
      {list.map(({ key, steps }) => (
        <section key={key} className="flex min-w-0 flex-col gap-2">
          <Heading as="h4">{key}</Heading>
          <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 p-0">
            {steps.map((s) => (
              <li key={s.name} className="flex min-w-0 flex-col gap-1">
                <Swatch color={`var(${s.name})`} size="100%" />
                <Text as="span" size="xs" className="font-mono">
                  {s.step}
                  <br />
                  {tokens.primitives[s.name]}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="flex min-w-0 flex-col gap-2">
        <Heading as="h4">Named primitives</Heading>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-2 p-0">
          {others.map((n) => (
            <li key={n} className="flex min-w-0 items-center gap-2">
              <Swatch color={`var(${n})`} size="1.5rem" checker />
              <span className="flex min-w-0 flex-col">
                <Text as="span" size="xs" className="font-mono">
                  {n}
                </Text>
                <Text as="span" size="xs" tone="secondary" className="font-mono">
                  {tokens.primitives[n]}
                </Text>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---- page ------------------------------------------------------------------------- */

function ColourPage({ globals }: { globals: Globals }) {
  const sections = buildSections();
  return (
    <FoundationPage
      globals={globals}
      title="Colour"
      lede={
        <>
          Semantic roles, grouped by what they are for. Each shows its Tailwind utility, its description from the token
          source, its value now (it follows the Brand and Theme toolbar) and in all four themes, and the contrast the
          build gates it at. Use these; the primitives at the bottom are reference only.
        </>
      }
    >
      <Text size="sm" tone="secondary" className="max-w-measure">
        {semanticColours.length} semantic colour tokens, {audit.pairings['sst-light'].length} gated pairings per theme.
        Copy a name with the button beside it. A token with <Code>not a utility</Code> is reachable only as{' '}
        <Code>var(--name)</Code>.
      </Text>
      {sections.map(({ def, groups }) => (
        <PageSection key={def.id} title={def.title} description={def.intro}>
          {def.id === 'scrim' ? <ScrimAudit /> : null}
          {groups.map((g) =>
            g.title ? (
              <section key={g.title} className="flex min-w-0 flex-col gap-1">
                <Heading as="h3">{g.title}</Heading>
                <TokenList>
                  {g.names.map((n) => (
                    <ColourRow key={n} name={n} />
                  ))}
                </TokenList>
              </section>
            ) : (
              <TokenList key="all">
                {g.names.map((n) => (
                  <ColourRow key={n} name={n} />
                ))}
              </TokenList>
            ),
          )}
        </PageSection>
      ))}
      <AllPairings />
      <PageSection title="Primitives" description="The ramps the semantic roles alias. Last, and collapsed, on purpose.">
        <Accordion
          headingLevel="h3"
          items={[
            {
              value: 'primitives',
              title: 'Reference only — never use these in product code; use a semantic token',
              content: <Primitives />,
            },
          ]}
        />
      </PageSection>
    </FoundationPage>
  );
}

const meta = {
  title: 'Foundations/Colour',
  parameters: { a11y: { test: 'error' } },
} satisfies Meta;

export default meta;

export const Colour: StoryObj = {
  render: (_args, { globals }) => <ColourPage globals={globals} />,
};
