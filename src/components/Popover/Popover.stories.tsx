import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Funnel, Plus } from '@phosphor-icons/react';

import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Divider } from '../Divider';
import { Field } from '../Field';
import { Input } from '../Input';
import { Text } from '../Text';
import {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  type PopoverAlign,
  type PopoverPadding,
  type PopoverSide,
} from './Popover';

const SIDES: PopoverSide[] = ['top', 'right', 'bottom', 'left'];
const ALIGNS: PopoverAlign[] = ['start', 'center', 'end'];
const PADDINGS: PopoverPadding[] = ['none', 'sm', 'md'];

/** Open stories render in their own iframe in the docs page, so panels do not stack. */
const openInDocs = (height: number) => ({ docs: { story: { inline: false, height: `${height}px` } } });

const meta = {
  title: 'Molecules/Popover',
  component: PopoverContent,
  subcomponents: { Popover, PopoverTrigger, PopoverAnchor, PopoverClose } as Record<
    string,
    React.ComponentType<unknown>
  >,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A small, dismissible panel anchored to its trigger, holding **real interactive content**:',
          'a short form, a filter, a summary. Heavier than a Tooltip, lighter than a Dialog; never',
          'for a critical or destructive confirmation (a popover can be dismissed by accident).',
          '',
          '`Popover` › `PopoverTrigger asChild` (a `Button`) · `PopoverContent` (`aria-label`, `side`,',
          '`align`, `padding`) › … `PopoverClose asChild` on the control that finishes the task.',
          '`PopoverAnchor` positions the panel against an input group (Combobox, DatePicker).',
          '',
          'Escape and a click outside close it; focus is not trapped; `PopoverClose` returns focus',
          'to the trigger. The HTML placements: `.popover--end` = `align="end"`, `.popover--above` =',
          '`side="top"`, `.popover--center` = `align="center"`. The panel portals to `<body>`, themed',
          'by `data-brand` / `data-theme` on `<html>`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: SIDES,
      table: { defaultValue: { summary: 'bottom' } },
      description: 'The side of the trigger the panel opens on (`top` = `.popover--above`).',
    },
    align: {
      control: 'select',
      options: ALIGNS,
      table: { defaultValue: { summary: 'start' } },
      description: 'Alignment against the trigger (`end` = `.popover--end`, `center` = `.popover--center`).',
    },
    padding: {
      control: 'select',
      options: PADDINGS,
      table: { defaultValue: { summary: 'md' } },
      description: '`md` for a form or summary; `sm` for rows with their own inset; `none` for a calendar.',
    },
    sideOffset: { control: 'number', table: { defaultValue: { summary: '6' } } },
    'aria-label': { control: 'text', description: 'The dialog’s accessible name.' },
    avoidCollisions: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    container: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof PopoverContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- helpers -------------------------------------------------------- */

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>{children}</div>
);
const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 12, alignContent: 'start', justifyItems: 'start' }}>
    <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
    {children}
  </div>
);
const Stack = ({ gap = 8, children }: { gap?: number; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap }}>{children}</div>
);
const HStack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
);
const Between = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>{children}</div>
);

function InviteForm() {
  return (
    <Stack>
      <Field label="Reviewer email" help="They will be added to the SSB Cohort 7 shortlisting queue." required>
        <Input type="email" defaultValue="meera.subramaniam@scaler.com" />
      </Field>
      <HStack>
        <PopoverClose asChild>
          <Button size="sm">Send invite</Button>
        </PopoverClose>
        <PopoverClose asChild>
          <Button size="sm" variant="tertiary">
            Cancel
          </Button>
        </PopoverClose>
      </HStack>
    </Stack>
  );
}

function InvitePopover(props: React.ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <Plus weight="bold" />
          Invite reviewer
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="Invite a reviewer to Cohort 7">
        <InviteForm />
      </PopoverContent>
    </Popover>
  );
}

/* ---------- stories -------------------------------------------------------- */

type PlaygroundArgs = React.ComponentProps<typeof PopoverContent> & { open?: boolean };

/**
 * `open` is two-way: clicking the trigger, Escape, a click outside or a
 * PopoverClose update the control, and the control opens the panel.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    open: true,
    side: 'bottom',
    align: 'start',
    padding: 'md',
    sideOffset: 6,
    'aria-label': 'Invite a reviewer to Cohort 7',
  },
  argTypes: {
    open: { control: 'boolean', description: 'Story only: the panel is open (two-way).' },
  },
  parameters: openInDocs(360),
  render: function PlaygroundStory({ open, ...content }) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <div style={{ padding: '140px 0 220px 0', display: 'flex', justifyContent: 'center' }}>
        <Popover open={open} onOpenChange={(next) => updateArgs({ open: next })}>
          <PopoverTrigger asChild>
            <Button variant="secondary">
              <Plus weight="bold" />
              Invite reviewer
            </Button>
          </PopoverTrigger>
          <PopoverContent {...content}>
            <InviteForm />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
};

/** The short form, open. Send and Cancel are `PopoverClose`: they return focus to the trigger. */
export const WorkingExample: Story = {
  name: 'Working example — a short form',
  parameters: { ...(openInDocs(300)), controls: { disable: true } },
  render: () => (
    <div style={{ paddingBottom: 220 }}>
      <InvitePopover defaultOpen />
    </div>
  ),
};

/** A filter. Apply closes the panel; Reset deliberately does not. */
export const FilterPopover: Story = {
  name: 'Filter popover',
  parameters: { ...(openInDocs(300)), controls: { disable: true } },
  render: () => (
    <div style={{ paddingBottom: 220 }}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="secondary">
            <Funnel />
            Campus
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filter by campus">
          <Stack>
            <Field label="Bengaluru" orientation="horizontal">
              <Checkbox defaultChecked />
            </Field>
            <Field label="Hyderabad" orientation="horizontal">
              <Checkbox />
            </Field>
            <Field label="Remote / online cohort" orientation="horizontal">
              <Checkbox />
            </Field>
            <Divider />
            <HStack>
              <PopoverClose asChild>
                <Button size="sm">Apply</Button>
              </PopoverClose>
              <Button size="sm" variant="tertiary">
                Reset
              </Button>
            </HStack>
          </Stack>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

/** The HTML's three placement modifiers. Click each trigger (one open at a time). */
export const Placement: Story = {
  name: 'Placement — end, above, center',
  parameters: { ...(openInDocs(420)), controls: { disable: true } },
  render: () => (
    <div style={{ padding: '200px 0 120px' }}>
      <Row>
        <Spec tag='align="end" · .popover--end'>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <Between>
              <Text size="sm" tone="secondary">
                Cohort 7 · Bengaluru
              </Text>
              <Popover defaultOpen>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="secondary">
                    Row actions
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" aria-label="Actions for Cohort 7" className="w-[300px]">
                  <Stack>
                    <Text size="sm" tone="secondary">
                      A trigger at the trailing edge of a table row or a toolbar. Left-anchored, this panel
                      would run off the page.
                    </Text>
                    <HStack>
                      <PopoverClose asChild>
                        <Button size="sm">Done</Button>
                      </PopoverClose>
                    </HStack>
                  </Stack>
                </PopoverContent>
              </Popover>
            </Between>
          </div>
        </Spec>
        <Spec tag='side="top" · .popover--above'>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                Fee breakdown
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" aria-label="Semester 4 fee breakdown">
              <Stack>
                <Between>
                  <Text size="sm">Tuition</Text>
                  <Text size="sm" className="tabular-nums">
                    ₹2,40,000
                  </Text>
                </Between>
                <Between>
                  <Text size="sm">Hostel &amp; mess</Text>
                  <Text size="sm" className="tabular-nums">
                    ₹35,000
                  </Text>
                </Between>
                <Divider />
                <Between>
                  <Text size="sm">
                    <strong>Due 30 Nov 2026</strong>
                  </Text>
                  <Text size="sm" className="tabular-nums">
                    <strong>₹2,75,000</strong>
                  </Text>
                </Between>
                <PopoverClose asChild>
                  <Button size="sm" variant="tertiary">
                    Close
                  </Button>
                </PopoverClose>
              </Stack>
            </PopoverContent>
          </Popover>
        </Spec>
        <Spec tag='align="center" · .popover--center'>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="secondary">
                Attendance
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" aria-label="Attendance detail" className="w-[260px]">
              <Stack>
                <Text size="sm" tone="secondary">
                  82% across 14 weeks. The policy floor for sitting the endsem is 75%.
                </Text>
                <PopoverClose asChild>
                  <Button size="sm" variant="tertiary">
                    Close
                  </Button>
                </PopoverClose>
              </Stack>
            </PopoverContent>
          </Popover>
        </Spec>
      </Row>
    </div>
  ),
};

/** An anchor that is not the trigger: the panel lines up with the whole group (Combobox / DatePicker). */
export const Anchored: Story = {
  name: 'Anchor (for Combobox / DatePicker)',
  parameters: { ...(openInDocs(300)), controls: { disable: true } },
  render: () => (
    <div style={{ paddingBottom: 200 }}>
      <Popover defaultOpen>
        <PopoverAnchor style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 320 }}>
          <Input aria-label="Mentor" defaultValue="Ishita" />
          <PopoverTrigger asChild>
            <Button variant="secondary">Pick</Button>
          </PopoverTrigger>
        </PopoverAnchor>
        <PopoverContent
          aria-label="Mentors"
          padding="sm"
          className="w-(--radix-popover-trigger-width) min-w-[min(320px,var(--radix-popover-content-available-width))]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Text size="sm" className="px-3 py-2">
            Ishita Raghunathan
          </Text>
          <Text size="sm" className="px-3 py-2">
            Rohan Bhatia
          </Text>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
