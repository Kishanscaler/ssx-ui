import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SelectableCard, SelectableCardGroup, type SelectableCardProps } from './SelectableCard';
import { Badge } from '../Badge';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Molecules/SelectableCard',
  component: SelectableCard,
  subcomponents: { SelectableCardGroup },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A card that holds a choice: pressing it turns it on and leaves it on. A Card rendered as a',
          '`<label>` around the real Checkbox / RadioGroupItem atom, so the whole card is the target and',
          'the marker cannot drift from the atoms. `SelectableCardGroup type="single"` is a radiogroup',
          '(arrows move and select); `type="multiple"` is a group of checkboxes; a lone card is a checkbox.',
          'Hover `border-control-hover`; selected = brand border + inset ring + brand-subtle fill; focus is',
          "the card's outline; disabled dims.",
        ].join('\n'),
      },
    },
  },
  args: {
    eyebrow: 'SST',
    title: 'B.Sc Computer Science & AI',
    description: '4 years · residential, Bengaluru · ₹5,50,000/year',
    checked: false,
    disabled: false,
    value: 'bsc',
  },
  argTypes: {
    eyebrow: { control: 'text' },
    title: { control: 'text' },
    description: { control: 'text' },
    checked: { control: 'boolean', description: 'Two-way bound in this story.' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
    name: { control: 'text' },
    required: { control: 'boolean' },
    onCheckedChange: { action: 'checkedChange', table: { category: 'Events' } },
  },
} satisfies Meta<typeof SelectableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A standalone (checkbox) card; `checked` is bound both ways. */
export const Playground: Story = {
  render: function Render(args) {
    const [, updateArgs] = useArgs<SelectableCardProps>();
    return (
      <div style={{ maxWidth: 360 }}>
        <SelectableCard
          {...args}
          onCheckedChange={(checked) => {
            updateArgs({ checked });
            args.onCheckedChange?.(checked);
          }}
        />
      </div>
    );
  },
};

/** The HTML's state grid (multi-select, checkbox marker). Hover and focus are live: point at or Tab to a card. */
export const States: Story = {
  render: () => (
    <SelectableCardGroup type="multiple" aria-label="States" defaultValue={['ssb-ai', 'founders', 'blr']}>
      <SelectableCard
        value="bsc"
        eyebrow="SST"
        title="B.Sc Computer Science & AI"
        description="4 years · residential, Bengaluru · ₹5,50,000/year"
      />
      <SelectableCard value="ssb-ai" eyebrow="SSB" title="AI-first Business Programme" description="2 years · Bengaluru · ₹4,20,000/year" />
      <SelectableCard value="pm" eyebrow="SST" title="Minor in Product Management" description="Year 3 elective · 12 weeks" />
      <SelectableCard value="founders" eyebrow="SSB" title="Founder's Office track" description="Year 2 elective · 10 weeks" />
      <SelectableCard value="lateral" eyebrow="SST" title="Lateral entry · Year 2" description="Opens Sep 2026" disabled />
      <SelectableCard
        value="blr"
        eyebrow="SST"
        title="Bengaluru campus"
        description="Assigned at seat confirmation · cannot be changed here"
        disabled
      />
    </SelectableCardGroup>
  ),
};

/** The marker is the atom: rounded square (one of several) vs circle (one of one). */
export const Markers: Story = {
  render: function Render() {
    const [plan, setPlan] = React.useState('a');
    return (
      <Stack>
        <Spec label="multi-select · checkbox marker, any number may be on" wide>
          <SelectableCardGroup type="multiple" aria-label="Choose electives" defaultValue={['ds', 'ml']}>
            <SelectableCard value="ds" eyebrow="Elective" title="Distributed Systems & Consensus" description="Week 12–18 · Prof. Anirudh Ramanathan" />
            <SelectableCard value="ml" eyebrow="Elective" title="Applied Machine Learning" description="Week 12–18 · Prof. Meera Subramanian" />
          </SelectableCardGroup>
        </Spec>
        <Spec label="single-select · radio marker, exactly one is on" wide>
          <SelectableCardGroup aria-label="Choose a fee plan" value={plan} onValueChange={setPlan}>
            <SelectableCard value="a" eyebrow="Plan A" title="Pay in two instalments" description="₹2,75,000 now, ₹2,75,000 by 30 Nov" />
            <SelectableCard value="b" eyebrow="Plan B" title="Deferred, income-share" description="60% after placement · capped at 17% of CTC for 24 months" />
          </SelectableCardGroup>
        </Spec>
      </Stack>
    );
  },
};

/** The HTML's programme picker: single choice, three columns, a status Badge per card. */
export const ProgrammePicker: Story = {
  render: () => (
    <SelectableCardGroup aria-label="Choose the programme you are applying to" columns="3" defaultValue="bsc" name="programme">
      <SelectableCard value="bsc" eyebrow="SST" title="B.Sc CS & AI" description="Batch of 2029 · 240 seats">
        <Badge tone="success">Applications open</Badge>
      </SelectableCard>
      <SelectableCard value="ssb" eyebrow="SSB" title="AI-first Business" description="Cohort 3 · 120 seats">
        <Badge tone="warning">Waitlist only</Badge>
      </SelectableCard>
      <SelectableCard
        value="lateral"
        eyebrow="SST"
        title="Lateral entry · Year 2"
        description="Applications for this route open in Sep 2026, after the Batch of 2029 intake closes"
        disabled
      >
        <Badge>Closed</Badge>
      </SelectableCard>
    </SelectableCardGroup>
  ),
};
