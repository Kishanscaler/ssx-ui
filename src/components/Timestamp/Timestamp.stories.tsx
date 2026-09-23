import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Timestamp, type TimestampFormat, type TimestampTone } from './Timestamp';
import { Text } from '../Text';
import { StatusDot } from '../StatusDot';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const FORMATS: TimestampFormat[] = ['absolute', 'relative', 'both', 'date'];
const TONES: TimestampTone[] = ['default', 'primary', 'warning', 'danger'];

/** Two hours before the story mounts, so the relative forms read "2 hours ago". */
const twoHoursAgo = () => new Date(Date.now() - 2 * 3600 * 1000);

const meta = {
  title: 'Molecules/Timestamp',
  component: Timestamp,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A moment in time in the form the reader needs, always in a `<time dateTime>`, with tabular figures.',
          'Relative for recency in a feed; absolute for anything auditable. Never relative alone on a record',
          'someone may have to quote back.',
          '',
          '**SSR.** The server (and the client’s first render) print the absolute text; the relative text',
          'replaces it after mount, so hydration never mismatches. Pass `now` (e.g. the request time) to render',
          'relative on the server too. `en-IN` + `Asia/Kolkata` by default, so a UTC server and an IST browser',
          'agree. Relative text ticks (30s under an hour, 60s under a day) unless `live={false}`.',
        ].join('\n'),
      },
    },
  },
  args: {
    date: '2026-03-04T23:42:00+05:30',
    format: 'absolute',
    tone: 'default',
    locale: 'en-IN',
    timeZone: 'Asia/Kolkata',
    live: true,
  },
  argTypes: {
    date: { control: 'text', description: 'ISO string with an offset, a Date, or epoch ms.' },
    format: { control: 'select', options: FORMATS },
    tone: { control: 'select', options: TONES },
    locale: { control: 'text' },
    timeZone: { control: 'select', options: ['Asia/Kolkata', 'UTC', 'America/New_York'] },
    live: { control: 'boolean' },
    now: { control: false },
    className: { control: 'text' },
    children: { control: 'text', description: 'Replaces the visible text.' },
  },
} satisfies Meta<typeof Timestamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's `#timestamp` section. */
export const Forms: Story = {
  render: () => {
    const moment = twoHoursAgo();
    return (
      <Row align="start">
        <Spec label="absolute">
          <Timestamp date={moment} />
        </Spec>
        <Spec label="relative">
          <Timestamp date={moment} format="relative" />
        </Spec>
        <Spec label="relative + absolute (preferred)">
          <Timestamp date={moment} format="both" />
        </Spec>
        <Spec label="date only">
          <Timestamp date={moment} format="date" />
        </Spec>
      </Row>
    );
  },
};

export const Deadlines: Story = {
  render: () => (
    <Row align="start">
      <Spec label="due — comfortable">
        <span>
          <Text as="span" size="sm" tone="secondary">
            Due{' '}
          </Text>
          <Timestamp date="2026-03-31T23:59:00+05:30" />
        </span>
      </Spec>
      <Spec label="due — soon · tone=warning">
        <span>
          <Text as="span" size="sm" tone="secondary">
            Due in{' '}
          </Text>
          <Timestamp date="2026-03-06T23:59:00+05:30" tone="warning">
            6 hours · 6 Mar 2026, 11:59 PM
          </Timestamp>
        </span>
      </Spec>
      <Spec label="overdue · tone=danger">
        <span>
          <Text as="span" size="sm" tone="secondary">
            Overdue by{' '}
          </Text>
          <Timestamp date="2026-02-28T23:59:00+05:30" tone="danger">
            4 days · 28 Feb 2026, 11:59 PM
          </Timestamp>
        </span>
      </Spec>
    </Row>
  ),
};

export const InContext: Story = {
  render: () => (
    <Stack gap={0}>
      {[
        { dot: 'success' as const, label: 'Data Structures & Algorithms — Week 6', date: '2026-03-04T23:42:00+05:30', text: 'Submitted 4 Mar 2026, 11:42 PM', tone: 'default' as const },
        { dot: 'danger' as const, label: 'Operating Systems — Lab 3', date: '2026-02-28T23:59:00+05:30', text: 'Overdue since 28 Feb 2026, 11:59 PM', tone: 'danger' as const },
      ].map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) 0',
            borderBottom: '1px solid var(--border-decorative)',
            maxWidth: 720,
          }}
        >
          <StatusDot tone={row.dot} />
          <Text as="span" size="sm" style={{ flex: 1 }}>
            {row.label}
          </Text>
          <Timestamp date={row.date} tone={row.tone}>
            {row.text}
          </Timestamp>
        </div>
      ))}
    </Stack>
  ),
};

/** Every tone and format, for the brand × theme review. */
export const Matrix: Story = {
  render: () => {
    const moment = twoHoursAgo();
    return (
      <Stack gap={12}>
        {TONES.map((tone) => (
          <Row key={tone}>
            {FORMATS.map((format) => (
              <Spec key={format} label={`${tone} · ${format}`}>
                <Timestamp date={moment} format={format} tone={tone} />
              </Spec>
            ))}
          </Row>
        ))}
      </Stack>
    );
  },
};
