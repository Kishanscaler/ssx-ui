import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Stepper,
  StepperDescription,
  StepperItem,
  StepperLabel,
  type StepperOrientation,
  type StepperStatus,
  type StepperStep,
} from './Stepper';
import { Badge } from '../Badge';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const ORIENTATIONS: StepperOrientation[] = ['horizontal', 'vertical'];
const STATUSES: StepperStatus[] = ['complete', 'current', 'upcoming', 'error'];

const WIZARD: StepperStep[] = [
  { label: 'Personal details' },
  { label: 'Academic record' },
  { label: 'Aptitude test slot' },
  { label: 'Payment' },
];

const meta = {
  title: 'Molecules/Stepper',
  component: Stepper,
  subcomponents: { StepperItem, StepperLabel, StepperDescription } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Where someone is in a sequence with a fixed order and a known end. Horizontal for a short wizard on',
          'one screen (it stacks below 672px); vertical when each step needs a sentence. Not a checklist.',
          '',
          'The states differ in SHAPE, not only hue: complete is a solid success disc with a check (its',
          'connector turns success), current is a solid inverse disc in a concentric ring with a semibold label',
          'and `aria-current="step"`, upcoming is a hollow ring, error a solid danger disc with an exclamation.',
          'Numbers are a CSS counter, so a Server Component can map items freely.',
          '',
          'Flat: `steps` + `currentStep` (1-based). Compound: `StepperItem status=…`.',
        ].join('\n'),
      },
    },
  },
  args: {
    orientation: 'horizontal',
    steps: WIZARD,
    currentStep: 3,
    'aria-label': 'Application progress',
  },
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
    currentStep: { control: { type: 'number', min: 0, max: 5, step: 1 } },
    steps: { control: 'object' },
    'aria-label': { control: 'text' },
    className: { control: 'text' },
  },
  render: (args) => (
    <div style={{ maxWidth: args.orientation === 'vertical' ? 640 : 880 }}>
      <Stepper {...args} />
    </div>
  ),
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's horizontal specimens: SST application wizard. */
export const Horizontal: Story = {
  render: () => (
    <div style={{ maxWidth: 880 }}>
      <Stack>
        <Spec label="complete / complete / current / upcoming" wide>
          <Stepper aria-label="Application progress">
            <StepperItem status="complete" label="Personal details" description="Completed" statusLabel="" />
            <StepperItem status="complete" label="Academic record" description="Completed" statusLabel="" />
            <StepperItem status="current" label="Aptitude test slot" description="Current step" />
            <StepperItem status="upcoming" label="Payment" description="Upcoming" />
          </Stepper>
        </Spec>
        <Spec label="first step current, nothing complete" wide>
          <Stepper aria-label="Application progress" steps={WIZARD.map((s, i) => ({ ...s, description: i === 0 ? 'Current step' : 'Upcoming' }))} currentStep={1} />
        </Spec>
        <Spec label="all four complete" wide>
          <Stepper aria-label="Application progress" steps={WIZARD} currentStep={5} />
        </Spec>
        <Spec label="error · a step that failed validation (not in the HTML)" wide>
          <Stepper aria-label="Application progress">
            <StepperItem status="complete" label="Personal details" />
            <StepperItem status="error" label="Academic record" description="Marksheet rejected" />
            <StepperItem status="current" label="Aptitude test slot" />
            <StepperItem label="Payment" />
          </Stepper>
        </Spec>
      </Stack>
    </div>
  ),
};

/** The HTML's vertical specimen: the real SSB admissions sequence. */
export const Vertical: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Stepper orientation="vertical" aria-label="Admissions progress">
        <StepperItem
          status="complete"
          label="Submission of Application Online"
          description="Fill the form, upload your Class XII and graduation marksheets, and pay the ₹1,000 application fee. You can save a draft and return to it — nothing is final until you submit."
          meta={<Badge tone="success">Submitted 4 Mar 2026, 11:42 PM</Badge>}
        />
        <StepperItem
          status="complete"
          label="Review & Shortlisting"
          description="The admissions committee reads every application in full — academics, work or founder experience, and your written responses. Shortlisting decisions are sent within 10 working days."
          meta={<Badge tone="success">Shortlisted 16 Mar 2026</Badge>}
        />
        <StepperItem
          status="current"
          label="Interview Round"
          description="A 45-minute conversation with two panellists — one faculty member and one industry practitioner — covering a short business case, your reasoning under ambiguity, and why an AI-first business programme now."
          meta={<Badge tone="warning">Scheduled Fri, 27 Mar 2026, 4:00 PM IST</Badge>}
        />
        <StepperItem
          label="Final Decision"
          description="The committee combines your application, interview panel scores and scholarship assessment into one decision. Outcomes are released on a fixed date — there is no rolling notification."
          meta={<Badge>Expected 10 Apr 2026</Badge>}
        />
        <StepperItem
          label="Offer & Acceptance"
          description="Accept your seat by paying the admission deposit within 14 days of the offer. Your cohort, campus and pre-read list are confirmed the same day the deposit clears."
          meta={<Badge>Not started</Badge>}
        />
      </Stepper>
    </div>
  ),
};

/** Every state in both orientations, for the brand × theme review. */
export const Matrix: Story = {
  render: () => (
    <Stack>
      {ORIENTATIONS.map((orientation) => (
        <Spec key={orientation} label={orientation} wide>
          <Stepper orientation={orientation}>
            {STATUSES.map((status) => (
              <StepperItem key={status} status={status} label={status} description={`A ${status} step`} />
            ))}
          </Stepper>
        </Spec>
      ))}
    </Stack>
  ),
};
