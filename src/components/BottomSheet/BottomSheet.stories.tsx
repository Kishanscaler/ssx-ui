import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Funnel } from '@phosphor-icons/react';

import {
  BottomSheet,
  BottomSheetActions,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from './BottomSheet';
import { Badge } from '../Badge';
import { Button, type ButtonVariant } from '../Button';
import { Checkbox } from '../Checkbox';
import { Chip } from '../Chip';
import { Field, FieldControl, FieldSet } from '../Field';
import { Kbd } from '../Kbd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Slider } from '../Slider';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'neutral'];

const STAGES: Array<[string, boolean]> = [
  ['Shortlisted', true],
  ['Interview scheduled', true],
  ['On hold', false],
  ['Offer sent', false],
];

/** The HTML's `sheet-applicant-filter` fields. */
function ApplicantFilters() {
  const [score, setScore] = React.useState([65]);
  return (
    <>
      <div role="group" aria-labelledby="sheet-stage-label" className="grid gap-2">
        <Text as="span" size="sm" className="font-semibold" id="sheet-stage-label">
          Stage
        </Text>
        <div className="flex flex-wrap gap-2">
          {STAGES.map(([label, on]) => (
            <Chip key={label} defaultSelected={on}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <Field label="Campus">
        <Select defaultValue="blr">
          <FieldControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="all">All campuses</SelectItem>
            <SelectItem value="blr">Bengaluru — SST residential</SelectItem>
            <SelectItem value="hybrid">Hybrid — SSB</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-2">
        <Text as="span" size="sm" className="font-semibold" id="sheet-score-label">
          Minimum NSET score — <span className="tabular-nums">{score[0]}</span>
        </Text>
        <Slider aria-labelledby="sheet-score-label" max={100} value={score} onValueChange={setScore} />
      </div>
      <FieldSet legend="Scholarship" variant="choices">
        <Field label="Merit scholarship applicants only" orientation="horizontal">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Needs-based financial aid requested" orientation="horizontal">
          <Checkbox />
        </Field>
      </FieldSet>
    </>
  );
}

function FilterSheet({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <BottomSheet defaultOpen={defaultOpen}>
      <BottomSheetTrigger asChild>
        <Button variant="secondary">
          <Funnel />
          Filter applicants
          <Badge tone="brand">2</Badge>
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader eyebrow="Admissions · Batch of 2029" closeLabel="Close filters">
          <BottomSheetTitle>Filter applicants</BottomSheetTitle>
        </BottomSheetHeader>
        <BottomSheetBody>
          <ApplicantFilters />
          <BottomSheetActions>
            <BottomSheetClose asChild>
              <Button variant="tertiary">Reset</Button>
            </BottomSheetClose>
            <BottomSheetClose asChild>
              <Button>Show 214 applicants</Button>
            </BottomSheetClose>
          </BottomSheetActions>
        </BottomSheetBody>
      </BottomSheetContent>
    </BottomSheet>
  );
}

const meta = {
  title: 'Organisms/BottomSheet',
  component: BottomSheet,
  subcomponents: {
    BottomSheetTrigger,
    BottomSheetContent,
    BottomSheetHeader,
    BottomSheetTitle,
    BottomSheetDescription,
    BottomSheetBody,
    BottomSheetActions,
    BottomSheetClose,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        component: [
          'The phone counterpart of the SideDrawer: rises from the bottom edge, thumb-reachable, for filters and',
          'short pickers on small screens. Not for desktop, where a Popover or SideDrawer sits closer to the control.',
          '',
          'Dismissed by dragging the grabber down (past a quarter of the height, or a flick), the scrim, Escape or',
          'the ×. Otherwise the Dialog contract (same Radix primitive). At most 80% of the viewport tall; the body',
          'scrolls. No footer part, as in the HTML: the actions are the last row of the body, `BottomSheetActions`.',
        ].join('\n'),
      },
    },
  },
  args: {
    title: 'Filter applicants',
    eyebrow: 'Admissions · Batch of 2029',
    trigger: 'Filter applicants',
    triggerVariant: 'secondary',
    cancelLabel: 'Reset',
    confirmLabel: 'Show 214 applicants',
    closeLabel: 'Close filters',
    defaultOpen: false,
    modal: true,
  },
  argTypes: {
    title: { control: 'text', description: 'Flat form: the sheet title. Setting it turns the flat form on.' },
    eyebrow: { control: 'text' },
    description: { control: 'text' },
    trigger: { control: 'text' },
    triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
    cancelLabel: { control: 'text' },
    confirmLabel: { control: 'text' },
    closeLabel: { control: 'text' },
    open: { control: false, description: 'Controlled state. Use `defaultOpen` here.' },
    defaultOpen: { control: 'boolean' },
    modal: { control: 'boolean' },
    onOpenChange: { action: 'openChange' },
    onCancel: { action: 'cancel' },
    onConfirm: { action: 'confirm' },
    children: { control: false },
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls. The body is `children`. */
export const Playground: Story = {
  render: (args) => (
    <BottomSheet key={String(args.defaultOpen)} {...args}>
      <ApplicantFilters />
    </BottomSheet>
  ),
};

/** The HTML's working example: the filter sheet behind a badge-counted trigger. */
export const ApplicantFilter: Story = {
  name: 'Applicant filter (HTML)',
  render: () => (
    <Row>
      <Spec label="trigger · opens the filter sheet">
        <FilterSheet />
      </Spec>
      <Spec label="behaviour">
        <Text size="sm" tone="secondary">
          Grabber affords the drag · focus trapped · <Kbd>Esc</Kbd> closes
        </Text>
      </Spec>
    </Row>
  ),
};

/** Open on load, for review in the four brand × theme combinations and at phone width. */
export const Open: Story = {
  render: () => <FilterSheet defaultOpen />,
};

/** A short picker: no grabber drag, a description, and a single choice that commits and closes. */
export const ShortPicker: Story = {
  render: () => (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="secondary">Sort by</Button>
      </BottomSheetTrigger>
      <BottomSheetContent dragToDismiss={false}>
        <BottomSheetHeader>
          <BottomSheetTitle>Sort applicants</BottomSheetTitle>
          <BottomSheetDescription>Applies to the Batch of 2029 pipeline.</BottomSheetDescription>
        </BottomSheetHeader>
        <BottomSheetBody className="gap-2">
          {['NSET score, high to low', 'Interview date, soonest first', 'Applied on, newest first'].map((label) => (
            <BottomSheetClose key={label} asChild>
              <Button variant="tertiary" className="justify-start">
                {label}
              </Button>
            </BottomSheetClose>
          ))}
        </BottomSheetBody>
      </BottomSheetContent>
    </BottomSheet>
  ),
};
