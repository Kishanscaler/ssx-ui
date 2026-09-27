import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from '../components/Alert';
import { Text } from '../components/Text';
import { describeGroup, describeToken, tokens } from './_lib/data';
import { parseBezier, withPrefix } from './_lib/parse';
import { CopyName, FoundationPage, PageSection, UtilityNames, useLive, type Globals } from './_lib/ui';

/* ---------------------------------------------------------------------------
 * Motion: durations and easings, each with a small demo that plays on hover,
 * focus or click. Under reduced motion the duration tokens collapse (the
 * generated stylesheet says to what), so the demos jump instead of moving.
 * ------------------------------------------------------------------------- */

const ms = (v: string | undefined) => (v ? Number.parseFloat(v) * (v.endsWith('ms') ? 1 : 1000) : 0);

/** A dot that crosses its track with the given duration and easing. */
function Demo({ label, duration, easing }: { label: string; duration: string; easing: string }) {
  const [on, setOn] = React.useState(false);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Play: ${label}`}
      onClick={() => setOn((v) => !v)}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className="relative block h-10 w-full min-w-[8rem] cursor-pointer rounded-md border border-border-control bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-action-primary"
        style={{
          left: on ? 'calc(100% - 1.75rem)' : '0.25rem',
          transitionProperty: 'left',
          transitionDuration: `var(${duration})`,
          transitionTimingFunction: `var(${easing})`,
        }}
      />
    </button>
  );
}

/** The easing curve, drawn. Decorative; its values are printed beside it. */
function Curve({ value }: { value: string }) {
  const b = parseBezier(value);
  if (!b) return null;
  const [x1, y1, x2, y2] = b;
  // y can overshoot (the overshoot easing goes past 1), so leave headroom.
  const Y = (y: number) => 52 - y * 40;
  return (
    <svg width="64" height="64" viewBox="-4 0 72 64" aria-hidden="true" focusable="false" className="shrink-0">
      <rect x="0" y="12" width="64" height="40" style={{ fill: 'none', stroke: 'var(--border-decorative)' }} />
      <path
        d={`M0 ${Y(0)} C ${x1 * 64} ${Y(y1)}, ${x2 * 64} ${Y(y2)}, 64 ${Y(1)}`}
        style={{ fill: 'none', stroke: 'var(--content-brand)', strokeWidth: 2 }}
      />
    </svg>
  );
}

function Row({ name, visual, demo, extra }: { name: string; visual?: React.ReactNode; demo: React.ReactNode; extra?: React.ReactNode }) {
  const { values } = useLive();
  const description = describeToken(name);
  return (
    <li className="grid min-w-0 grid-cols-1 gap-3 border-b border-border-decorative py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,16rem)] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        {visual}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <CopyName name={name} />
            <UtilityNames name={name} />
          </div>
          <Text size="sm">
            <span className="font-mono">{values[name] || tokens.primitives[name]}</span>
            {extra}
          </Text>
          {description ? (
            <Text size="sm" tone="secondary">
              {description}
            </Text>
          ) : null}
        </div>
      </div>
      {demo}
    </li>
  );
}

function MotionPage({ globals }: { globals: Globals }) {
  const durations = withPrefix(tokens.primitives, '--motion-duration-').sort(
    (a, b) => ms(tokens.primitives[a]) - ms(tokens.primitives[b]),
  );
  const easings = withPrefix(tokens.primitives, '--motion-easing-');
  const defaultEasing = easings.find((n) => /productive-in-out/.test(n)) ?? easings[0]!;
  const demoDuration = durations.find((n) => /slow$/.test(n)) ?? durations[durations.length - 1]!;
  return (
    <FoundationPage
      globals={globals}
      title="Motion"
      lede="Durations and easings. Hover, focus or click a track to play it. Product surfaces use the productive curves; expressive and overshoot are for landing pages."
    >
      <MotionNote />
      <PageSection title="Durations" description={describeGroup('motion.duration')}>
        <ul className="m-0 flex list-none flex-col p-0">
          {durations.map((n) => (
            <Row
              key={n}
              name={n}
              extra={
                tokens.reducedMotion[n] ? (
                  <Text as="span" size="xs" tone="secondary">
                    {' '}
                    · {tokens.reducedMotion[n]} under reduced motion
                  </Text>
                ) : null
              }
              demo={<Demo label={n} duration={n} easing={defaultEasing} />}
            />
          ))}
        </ul>
      </PageSection>
      <PageSection
        title="Easings"
        description={`Each demo runs for ${demoDuration.replace('--motion-duration-', '')} (${tokens.primitives[demoDuration]}).`}
      >
        <ul className="m-0 flex list-none flex-col p-0">
          {easings.map((n) => (
            <Row
              key={n}
              name={n}
              visual={<Curve value={tokens.primitives[n] ?? ''} />}
              demo={<Demo label={n} duration={demoDuration} easing={n} />}
            />
          ))}
        </ul>
      </PageSection>
    </FoundationPage>
  );
}

function MotionNote() {
  const { reducedMotion: reduced } = useLive();
  const collapsed = Object.keys(tokens.reducedMotion);
  if (!collapsed.length) return null;
  return (
    <Alert
      tone={reduced ? 'warning' : 'info'}
      title={reduced ? 'Reduced motion is on' : 'Reduced motion'}
      description={reduced
        ? `Your system asks for reduced motion, so ${collapsed.length} duration tokens are ${tokens.reducedMotion[collapsed[0]!]} and the demos jump rather than move. That is the system working.`
        : `Under prefers-reduced-motion the ${collapsed.length} duration tokens collapse to ${tokens.reducedMotion[collapsed[0]!]}, so anything timed by them stops moving. Loops also opt out with motion-reduce:animate-none.`}
    />
  );
}

const meta = { title: 'Foundations/Motion' } satisfies Meta;
export default meta;

export const Motion: StoryObj = {
  render: (_args, { globals }) => <MotionPage globals={globals} />,
};
