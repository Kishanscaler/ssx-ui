import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar, AvatarFallback } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Heading } from '../Heading';
import { Text } from '../Text';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  type HoverCardAlign,
  type HoverCardSide,
} from './HoverCard';

const SIDES: HoverCardSide[] = ['top', 'right', 'bottom', 'left'];
const ALIGNS: HoverCardAlign[] = ['start', 'center', 'end'];

const openInDocs = (height: number) => ({ docs: { story: { inline: false, height: `${height}px` } } });

const meta = {
  title: 'Molecules/HoverCard',
  component: HoverCardContent,
  subcomponents: { HoverCard, HoverCardTrigger } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A richer popover that **previews** the thing behind a name — a mentor, a student, a cohort —',
          'so the reader does not navigate away. Preview only: nothing inside is interactive, and',
          'everything it shows also exists on the real page.',
          '',
          '`HoverCard` › `HoverCardTrigger asChild` (a `Link` or tertiary `Button`) · `HoverCardContent`',
          '(`aria-label="Profile preview: …"`).',
          '',
          'Hover intent: opens after 400ms, closes 200ms after the pointer leaves, stays while the',
          'pointer is inside. Opens on focus, closes on blur. `role="note"`, and the trigger is',
          '`aria-describedby` the card even while it is closed, so its content is announced without',
          'opening anything. Portals to `<body>`, themed by `data-brand` / `data-theme` on `<html>`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: SIDES,
      table: { defaultValue: { summary: 'bottom' } },
      description: 'The side of the trigger the card opens on.',
    },
    align: {
      control: 'select',
      options: ALIGNS,
      table: { defaultValue: { summary: 'start' } },
      description: 'Alignment against the trigger (`end` = `.popover--end`).',
    },
    sideOffset: { control: 'number', table: { defaultValue: { summary: '6' } } },
    'aria-label': { control: 'text', description: 'The note’s accessible name.' },
    avoidCollisions: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    container: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof HoverCardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- content -------------------------------------------------------- */

const Stack = ({ gap = 8, children }: { gap?: number; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap }}>{children}</div>
);
const HStack = ({ gap = 12, children }: { gap?: number; children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap, alignItems: 'center', flexWrap: 'wrap' }}>{children}</div>
);
/** Avatar beside the name block; never wraps (the text column shrinks instead). */
const Identity = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{children}</div>
);

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <Heading as="p" size="3" className="tabular-nums">
        {value}
      </Heading>
      <Text as="span" size="xs" tone="secondary">
        {label}
      </Text>
    </div>
  );
}

function MentorCard() {
  return (
    <Stack>
      <Identity>
        <Avatar size="lg">
          <AvatarFallback>IR</AvatarFallback>
        </Avatar>
        <Stack gap={2}>
          <Heading as="p" size="3">
            Ishita Raghunathan
          </Heading>
          <Text as="span" size="sm" tone="secondary">
            Principal Engineer · Distributed Systems
          </Text>
          <Text as="span" size="sm" tone="secondary">
            Razorpay, Bengaluru
          </Text>
        </Stack>
      </Identity>
      <Text size="sm" tone="secondary">
        Mentors SST System Design &amp; the Batch of 2028 capstone track. Ex-Amazon, ex-Gojek.
      </Text>
      <HStack gap={24}>
        <Stat value="142" label="1:1 sessions" />
        <Stat value="4.9" label="Mentor rating" />
        <Stat value="31" label="Mentees" />
      </HStack>
      <HStack gap={8}>
        <Badge tone="brand">SST</Badge>
        <Badge tone="success">Accepting mentees</Badge>
      </HStack>
    </Stack>
  );
}

function StudentCard() {
  return (
    <Stack>
      <Identity>
        <Avatar size="lg">
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
        <Stack gap={2}>
          <Heading as="p" size="3">
            Aarav Krishnan
          </Heading>
          <Text as="span" size="sm" tone="secondary">
            SST-2029-0416 · Cohort 7 · Bengaluru
          </Text>
          <Text as="span" size="sm" tone="secondary">
            aarav.k@sst.scaler.com
          </Text>
        </Stack>
      </Identity>
      <Text size="sm" tone="secondary">
        Year 2, Applied Machine Learning elective. Capstone: a multi-region job scheduler.
      </Text>
      <HStack gap={8}>
        <Badge tone="brand">Batch of 2029</Badge>
        <Badge tone="warning">Scholarship review</Badge>
      </HStack>
    </Stack>
  );
}

const NameTrigger = ({ children }: { children: React.ReactNode }) => (
  <HoverCardTrigger asChild>
    <Button variant="tertiary" size="sm">
      {children}
    </Button>
  </HoverCardTrigger>
);

/* ---------- stories -------------------------------------------------------- */

type PlaygroundArgs = React.ComponentProps<typeof HoverCardContent> & {
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
};

/** `open` is two-way: hovering, focus and blur update the control. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    open: true,
    openDelay: 400,
    closeDelay: 200,
    side: 'bottom',
    align: 'start',
    sideOffset: 6,
    'aria-label': 'Profile preview: Ishita Raghunathan',
  },
  argTypes: {
    open: { control: 'boolean', description: 'Story only: the card is open (two-way).' },
    openDelay: {
      control: 'number',
      description: 'HoverCard: hover intent before opening, ms.',
      table: { defaultValue: { summary: '400' } },
    },
    closeDelay: {
      control: 'number',
      description: 'HoverCard: grace before closing, ms.',
      table: { defaultValue: { summary: '200' } },
    },
  },
  parameters: openInDocs(420),
  render: function PlaygroundStory({ open, openDelay, closeDelay, ...content }) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <div style={{ paddingBottom: 340 }}>
        <Text size="sm" tone="secondary">
          Week 9 System Design review is led by{' '}
          <HoverCard
            open={open}
            onOpenChange={(next) => updateArgs({ open: next })}
            openDelay={openDelay}
            closeDelay={closeDelay}
          >
            <NameTrigger>Ishita Raghunathan</NameTrigger>
            <HoverCardContent {...content}>
              <MentorCard />
            </HoverCardContent>
          </HoverCard>
          , with office hours every Thursday.
        </Text>
      </div>
    );
  },
};

/** The mentor preview, open: avatar, role, stats and badges. */
export const MentorPreview: Story = {
  name: 'Mentor preview, triggered from a name',
  parameters: openInDocs(400),
  render: () => (
    <div style={{ paddingBottom: 320 }}>
      <Text size="sm" tone="secondary">
        Week 9 System Design review is led by{' '}
        <HoverCard defaultOpen>
          <NameTrigger>Ishita Raghunathan</NameTrigger>
          <HoverCardContent aria-label="Profile preview: Ishita Raghunathan">
            <MentorCard />
          </HoverCardContent>
        </HoverCard>
        , with office hours every Thursday.
      </Text>
    </div>
  ),
};

/** A second trigger near the trailing edge: `align="end"`. Hover or Tab to it. */
export const StudentPreview: Story = {
  name: 'Student preview, align end',
  parameters: openInDocs(360),
  render: () => (
    <div style={{ paddingBottom: 280, maxWidth: 560 }}>
      <Text size="sm" tone="secondary">
        Flagged for the scholarship review call:{' '}
        <HoverCard defaultOpen>
          <NameTrigger>Aarav Krishnan</NameTrigger>
          <HoverCardContent align="end" aria-label="Profile preview: Aarav Krishnan">
            <StudentCard />
          </HoverCardContent>
        </HoverCard>
        , ahead of the 18 Mar 2026 committee.
      </Text>
    </div>
  ),
};

/** Rest state: hover (400ms intent) or Tab to the name. */
export const Rest: Story = {
  parameters: openInDocs(400),
  render: () => (
    <div style={{ paddingBottom: 320 }}>
      <Text size="sm" tone="secondary">
        Week 9 System Design review is led by{' '}
        <HoverCard>
          <NameTrigger>Ishita Raghunathan</NameTrigger>
          <HoverCardContent aria-label="Profile preview: Ishita Raghunathan">
            <MentorCard />
          </HoverCardContent>
        </HoverCard>
        , with office hours every Thursday.
      </Text>
    </div>
  ),
};
