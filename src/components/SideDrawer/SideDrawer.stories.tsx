import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from '@phosphor-icons/react';

import {
  SideDrawer,
  SideDrawerBody,
  SideDrawerClose,
  SideDrawerContent,
  SideDrawerDescription,
  SideDrawerFooter,
  SideDrawerHeader,
  SideDrawerTitle,
  SideDrawerTrigger,
  type SideDrawerSide,
  type SideDrawerSize,
} from './SideDrawer';
import { Button, type ButtonVariant } from '../Button';
import { Checkbox } from '../Checkbox';
import { Field, FieldControl, FieldSet } from '../Field';
import { Input } from '../Input';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Textarea } from '../Textarea';
import { Text } from '../Text';
import { Kbd } from '../Kbd';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const SIDES: SideDrawerSide[] = ['right', 'left'];
const SIZES: SideDrawerSize[] = ['normal', 'wide'];
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'neutral'];

const MENTORS = [
  ['nishant', 'Nishant Bhaskar — Staff Engineer, Google'],
  ['ritika', 'Ritika Menon — SDE III, Amazon'],
  ['kabir', 'Kabir Sethi — Engineering Manager, Uber'],
] as const;

const OUTCOMES = [
  ['on-track', 'On track for the Week 6 assessment'],
  ['follow-up', 'Needs a follow-up session this week'],
  ['escalate', 'Escalate to the programme office'],
] as const;

/** The HTML's `drawer-mentor-note` form: every control a real drawer carries. */
function MentorSessionForm() {
  return (
    <FieldSet>
      <Field label="Super Mentor" required help="Only mentors mapped to Cohort 7 are listed.">
        <Select defaultValue="nishant">
          <FieldControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            {MENTORS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Topic covered">
        <Input defaultValue="Balanced BSTs, AVL rotations and order-statistic trees" />
      </Field>
      <Field label="Duration (minutes)">
        <Input type="number" min={15} max={180} step={15} defaultValue={45} />
      </Field>
      <FieldSet legend="Outcome" variant="choices">
        <RadioGroup defaultValue="on-track" aria-label="Outcome">
          {OUTCOMES.map(([value, label]) => (
            <Field key={value} label={label} orientation="horizontal">
              <RadioGroupItem value={value} />
            </Field>
          ))}
        </RadioGroup>
      </FieldSet>
      <Field label="Session notes" help="Visible to the student, their mentor and the programme office.">
        <Textarea defaultValue="Aarav can derive the rotation cases but is still hand-waving the height invariant proof; assigned CLRS 13.3 and a second pass at the augmented tree problem set before Friday." />
      </Field>
      <Field label="Notify Aarav by email at aarav.k@sst.scaler.com" orientation="horizontal">
        <Checkbox />
      </Field>
    </FieldSet>
  );
}

const meta = {
  title: 'Organisms/SideDrawer',
  component: SideDrawer,
  subcomponents: {
    SideDrawerTrigger,
    SideDrawerContent,
    SideDrawerHeader,
    SideDrawerTitle,
    SideDrawerDescription,
    SideDrawerBody,
    SideDrawerFooter,
    SideDrawerClose,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'An edge panel for a task that needs the page kept visible behind it: editing a record, filtering a',
          'list, logging a mentor session. Not for a decision that blocks everything (that is a Dialog).',
          '',
          'The Dialog contract, on the same Radix primitive: focus trapped and returned, Escape and the scrim',
          'close it, scroll lock, labelled by `SideDrawerTitle`. The scrim is `surface.overlayScrim`. Right edge',
          'by default (`side="left"` for a collapsed nav rail), `sm` 320 / `md` 400 / `lg` 560px, each capped',
          'at 92vw. The head and foot stay put; the body scrolls.',
          '',
          'Compound API first; the flat `title` / `eyebrow` / `trigger` / `confirmLabel` form maps onto a',
          'Storyblok blok (the body is `children`).',
        ].join('\n'),
      },
    },
  },
  args: {
    title: 'Log a mentor session',
    eyebrow: 'Aarav Krishnan · SST-2029-0416',
    trigger: 'Log a mentor session',
    triggerVariant: 'primary',
    side: 'right',
    size: 'normal',
    cancelLabel: 'Cancel',
    confirmLabel: 'Save session',
    confirmLoading: false,
    closeLabel: 'Close drawer',
    defaultOpen: false,
    modal: true,
  },
  argTypes: {
    title: { control: 'text', description: 'Flat form: the drawer title. Setting it turns the flat form on.' },
    eyebrow: { control: 'text' },
    description: { control: 'text' },
    trigger: { control: 'text' },
    triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
    side: { control: 'inline-radio', options: SIDES },
    size: { control: 'inline-radio', options: SIZES },
    cancelLabel: { control: 'text' },
    confirmLabel: { control: 'text' },
    confirmLoading: { control: 'boolean' },
    closeLabel: { control: 'text' },
    open: { control: false, description: 'Controlled state. Use `defaultOpen` here; see the Controlled story.' },
    defaultOpen: { control: 'boolean' },
    modal: { control: 'boolean' },
    onOpenChange: { action: 'openChange' },
    onConfirm: { action: 'confirm' },
    children: { control: false },
  },
} satisfies Meta<typeof SideDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls. The body is `children`. */
export const Playground: Story = {
  render: (args) => (
    <SideDrawer key={`${String(args.defaultOpen)}-${args.side}-${args.size}`} {...args}>
      <MentorSessionForm />
    </SideDrawer>
  ),
};

/** The HTML's working example, compound: eyebrow, title, the × and a long form. */
export const MentorNote: Story = {
  name: 'Mentor note (HTML)',
  render: () => (
    <Row>
      <Spec label="trigger · opens the drawer">
        <SideDrawer>
          <SideDrawerTrigger asChild>
            <Button>
              <Plus />
              Log a mentor session
            </Button>
          </SideDrawerTrigger>
          <SideDrawerContent>
            <SideDrawerHeader eyebrow="Aarav Krishnan · SST-2029-0416">
              <SideDrawerTitle>Log a mentor session</SideDrawerTitle>
            </SideDrawerHeader>
            <SideDrawerBody>
              <MentorSessionForm />
            </SideDrawerBody>
            <SideDrawerFooter>
              <SideDrawerClose asChild>
                <Button variant="tertiary">Cancel</Button>
              </SideDrawerClose>
              <Button>Save session</Button>
            </SideDrawerFooter>
          </SideDrawerContent>
        </SideDrawer>
      </Spec>
      <Spec label="behaviour">
        <Text size="sm" tone="secondary">
          Slides in over a scrim · focus trapped · <Kbd>Esc</Kbd> closes
        </Text>
      </Spec>
    </Row>
  ),
};

/** Open on load, for review in the four brand × theme combinations. */
export const Open: Story = {
  render: () => (
    <SideDrawer defaultOpen>
      <SideDrawerTrigger asChild>
        <Button>Log a mentor session</Button>
      </SideDrawerTrigger>
      <SideDrawerContent>
        <SideDrawerHeader eyebrow="Aarav Krishnan · SST-2029-0416">
          <SideDrawerTitle>Log a mentor session</SideDrawerTitle>
        </SideDrawerHeader>
        <SideDrawerBody>
          <MentorSessionForm />
        </SideDrawerBody>
        <SideDrawerFooter>
          <SideDrawerClose asChild>
            <Button variant="tertiary">Cancel</Button>
          </SideDrawerClose>
          <Button>Save session</Button>
        </SideDrawerFooter>
      </SideDrawerContent>
    </SideDrawer>
  ),
};

/** Both edges and both widths. Each opens its own drawer. */
export const SidesAndSizes: Story = {
  name: 'Sides and sizes',
  render: () => (
    <Row>
      {SIDES.flatMap((side) =>
        SIZES.map((size) => (
          <Spec key={`${side}-${size}`} label={`${side} · ${size}`}>
            <SideDrawer>
              <SideDrawerTrigger asChild>
                <Button variant="secondary">
                  {side} · {size}
                </Button>
              </SideDrawerTrigger>
              <SideDrawerContent side={side} size={size}>
                <SideDrawerHeader eyebrow="Cohort 7 · Batch of 2029">
                  <SideDrawerTitle>Filter the roster</SideDrawerTitle>
                  <SideDrawerDescription>84 students match the current filters.</SideDrawerDescription>
                </SideDrawerHeader>
                <SideDrawerBody>
                  <Field label="Search by name or roll number">
                    <Input placeholder="Aarav, SST-2029-0416…" />
                  </Field>
                </SideDrawerBody>
                <SideDrawerFooter>
                  <SideDrawerClose asChild>
                    <Button variant="tertiary">Clear</Button>
                  </SideDrawerClose>
                  <SideDrawerClose asChild>
                    <Button>Show 84 students</Button>
                  </SideDrawerClose>
                </SideDrawerFooter>
              </SideDrawerContent>
            </SideDrawer>
          </Spec>
        )),
      )}
    </Row>
  ),
};

/** Controlled: the app owns `open` (e.g. a row click opens the record). Two-way, so the story still closes. */
export const Controlled: Story = {
  render: function Render() {
    const [open, setOpen] = React.useState(false);
    return (
      <Row>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Review applicant SST-2029-0416
        </Button>
        <Text size="sm" tone="secondary">
          open: {String(open)}
        </Text>
        <SideDrawer open={open} onOpenChange={setOpen}>
          <SideDrawerContent size="wide">
            <SideDrawerHeader eyebrow="Admissions · Batch of 2029">
              <SideDrawerTitle>Aarav Krishnan</SideDrawerTitle>
            </SideDrawerHeader>
            <SideDrawerBody>
              <Text as="p" size="sm" tone="secondary">
                NSET 82 · Interview on 18 Mar 2026 · Merit scholarship applicant.
              </Text>
            </SideDrawerBody>
            <SideDrawerFooter>
              <Button variant="tertiary" onClick={() => setOpen(false)}>
                Close
              </Button>
            </SideDrawerFooter>
          </SideDrawerContent>
        </SideDrawer>
      </Row>
    );
  },
};
