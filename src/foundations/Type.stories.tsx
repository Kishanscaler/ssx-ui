import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion } from '../components/Accordion';
import { Badge } from '../components/Badge';
import { Heading } from '../components/Heading';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Text } from '../components/Text';
import { breakpointVariants, describeGroup, tokens, typeRoles } from './_lib/data';
import { toPx, withPrefix, type TypeRole } from './_lib/parse';
import { CopyName, FoundationPage, PageSection, ScaleTable, UtilityNames, byValue, useLive, withPx, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Type. The `type-*` role utilities from theme.css, with the composite
 * `--type-*` tokens each reads at phone width and from the step up, a live
 * sample, then the families and the scales under the roles.
 * ------------------------------------------------------------------------- */

const SAMPLE = 'Placements 2026: 104 of 118 placed';

/** kebab `type-body-lg` → the DTCG group paths it may be described under. */
function groupPaths(role: string) {
  const rest = role.replace(/^type-/, '');
  const camel = rest.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  return [`type.${camel}`, `type.${rest.replace(/-/g, '.')}`];
}

const PROP_LABEL: Record<string, string> = {
  'font-size': 'size',
  'line-height': 'line height',
  'letter-spacing': 'tracking',
  'font-weight': 'weight',
  'text-transform': 'case',
};

const varOf = (value: string) => /var\((--[a-z0-9-]+)\)/.exec(value)?.[1];

/** The width the roles step at, and its breakpoint name. */
const step = tokens.responsive.find((r) => withPrefix(r.values, '--type-').length > 0);
const stepName =
  Object.entries(breakpointVariants).find(([, v]) => toPx(v) === step?.minWidth)?.[0] ?? `${step?.minWidth}px`;

function valueAt(prop: string, value: string, up: boolean) {
  const v = varOf(value);
  if (!v) return value;
  const raw = (up ? step?.values[v] : undefined) ?? tokens.primitives[v] ?? '';
  return prop === 'font-size' ? withPx(raw) : raw;
}

function styleOf(role: TypeRole): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const [prop, value] of role.declarations) {
    style[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return style as React.CSSProperties;
}

/** Product roles first; the marketing-only ones (billboard, hero) after them. */
const isMarketing = (r: TypeRole) => /billboard|hero/.test(r.name);
const roles = [...typeRoles.filter((r) => !isMarketing(r)), ...typeRoles.filter(isMarketing)];

function RoleCard({ role }: { role: TypeRole }) {
  const { values } = useLive();
  const description = groupPaths(role.name).map(describeGroup).find(Boolean);
  const steps = role.declarations.some(([p, v]) => valueAt(p, v, false) !== valueAt(p, v, true));
  const sizeVar = varOf(role.declarations.find(([p]) => p === 'font-size')?.[1] ?? '');
  const hasWeight = role.declarations.some(([p]) => p === 'font-weight');
  const mono = /code/.test(role.name);
  return (
    <li className="flex min-w-0 flex-col gap-2 border-b border-border-decorative py-5 last:border-b-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <CopyName name={role.name} />
        {steps ? (
          <Badge tone="info" size="sm">
            steps at {stepName}
          </Badge>
        ) : (
          <Badge tone="default" size="sm">
            same at every width
          </Badge>
        )}
        {sizeVar ? (
          <Text as="span" size="xs" tone="secondary">
            now {values[sizeVar] ? withPx(values[sizeVar]!) : ''}
          </Text>
        ) : null}
      </div>
      <p
        className={mono ? 'm-0 font-mono text-content [overflow-wrap:anywhere]' : 'm-0 font-sans text-content [overflow-wrap:anywhere]'}
        style={styleOf(role)}
      >
        {SAMPLE}
      </p>
      {description ? (
        <Text size="sm" tone="secondary" className="max-w-measure">
          {description}
        </Text>
      ) : null}
      <Text as="span" size="xs" tone="secondary">
        Phone → {stepName}+
      </Text>
      <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-0.5">
        {role.declarations.map(([prop, value]) => {
          const a = valueAt(prop, value, false);
          const b = valueAt(prop, value, true);
          return (
            <React.Fragment key={prop}>
              <dt className="type-caption text-content-secondary">{PROP_LABEL[prop] ?? prop}</dt>
              <dd className="m-0 font-mono text-sm">{a === b ? a : `${a} → ${b}`}</dd>
            </React.Fragment>
          );
        })}
        {!hasWeight ? (
          <>
            <dt className="type-caption text-content-secondary">weight</dt>
            <dd className="m-0 text-sm">inherited (a running-text role)</dd>
          </>
        ) : null}
      </dl>
    </li>
  );
}

function Families() {
  const names = withPrefix(tokens.primitives, '--font-family-');
  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {names.map((n) => (
        <li key={n} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border-decorative p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <CopyName name={n} />
            <UtilityNames name={n} />
          </div>
          <p className="m-0 text-content type-h2 [overflow-wrap:anywhere]" style={{ fontFamily: `var(${n})` }}>
            Aa Bb Cc 0123456789 {'{ } => ₹'}
          </p>
          <Text size="sm" tone="secondary" className="font-mono">
            {tokens.primitives[n]}
          </Text>
        </li>
      ))}
    </ul>
  );
}

function RoleTable() {
  const cols = ['font-size', 'line-height', 'letter-spacing', 'font-weight'];
  return (
    <Table density="compact" cellWrap="nowrap" scrollLabel="Type roles at phone width and from the step">
      <TableCaption visuallyHidden>Every type role, phone and {stepName}+</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          {cols.map((c) => (
            <TableHead key={c}>{PROP_LABEL[c]}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((r) => (
          <TableRow key={r.name}>
            <TableCell>
              <span className="font-mono text-sm">{r.name}</span>
            </TableCell>
            {cols.map((c) => {
              const d = r.declarations.find(([p]) => p === c);
              if (!d) return <TableCell key={c}>inherited</TableCell>;
              const a = valueAt(c, d[1], false).split(' · ').pop();
              const b = valueAt(c, d[1], true).split(' · ').pop();
              return (
                <TableCell key={c}>
                  <span className="font-mono text-sm">{a === b ? a : `${a} → ${b}`}</span>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TypePage({ globals }: { globals: Globals }) {
  const sizes = withPrefix(tokens.primitives, '--font-size-').sort(byValue);
  const weights = withPrefix(tokens.primitives, '--font-weight-').sort(byValue);
  const leading = withPrefix(tokens.primitives, '--font-leading-').sort(byValue);
  const tracking = withPrefix(tokens.primitives, '--font-tracking-').sort(byValue);
  return (
    <FoundationPage
      globals={globals}
      title="Type"
      lede={
        <>
          Set text with a role, not a size: one <code className="font-mono">type-*</code> utility sets size, line height and
          tracking together (and weight for headings, labels and eyebrows), and steps at {stepName} where the role does.
          Resize the canvas across {step?.minWidth}px to watch the samples change.
        </>
      }
    >
      <PageSection title="Roles" description={describeGroup('type')}>
        <ul className="m-0 flex list-none flex-col p-0">
          {roles.map((r) => (
            <RoleCard key={r.name} role={r} />
          ))}
        </ul>
      </PageSection>
      <PageSection title="All roles at a glance" description={`Phone → ${stepName}+ (${step?.minWidth}px and up).`}>
        <RoleTable />
      </PageSection>
      <PageSection title="Families" description="Both from Google Fonts; see src/styles/fonts.css.">
        <Families />
      </PageSection>
      <PageSection
        title="The scales under the roles"
        description={describeGroup('font.size')}
      >
        <Heading as="h3">Sizes</Heading>
        <Text size="sm" tone="secondary" className="max-w-measure">
          For controls with a fixed size ramp (Button, Input, Select), which do not step. Everything else uses a role.
        </Text>
        <ScaleTable
          caption="Font sizes"
          names={sizes}
          sample={(n) => (
            <span className="text-content" style={{ fontSize: `var(${n})`, lineHeight: 1.2 }}>
              Aa
            </span>
          )}
        />
        <Heading as="h3">Weights</Heading>
        <Text size="sm" tone="secondary" className="max-w-measure">
          {describeGroup('font.weight')}
        </Text>
        <ScaleTable
          caption="Font weights"
          names={weights}
          sample={(n) => (
            <span className="text-content" style={{ fontWeight: `var(${n})` as unknown as number }}>
              Placed
            </span>
          )}
        />
        <Accordion
          headingLevel="h3"
          items={[
            {
              value: 'leading',
              title: 'Leading and tracking scales',
              content: (
                <div className="flex min-w-0 flex-col gap-4 py-2">
                  <Text size="sm" tone="secondary" className="max-w-measure">
                    {describeGroup('font.leading')}
                  </Text>
                  <ScaleTable caption="Line heights" names={leading} />
                  <ScaleTable caption="Letter spacing" names={tracking} />
                </div>
              ),
            },
          ]}
        />
      </PageSection>
    </FoundationPage>
  );
}

const meta = { title: 'Foundations/Type' } satisfies Meta;
export default meta;

export const Type: StoryObj = {
  render: (_args, { globals }) => <TypePage globals={globals} />,
};
