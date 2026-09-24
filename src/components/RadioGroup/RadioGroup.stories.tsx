import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadioGroup, RadioGroupItem } from './RadioGroup';

const meta = {
  title: 'Atoms/RadioGroup',
  component: RadioGroup,
  subcomponents: { RadioGroupItem },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Exactly one choice from a small, mutually exclusive set. Past about seven options use',
          '**Select**. There is no lone radio: a single radio cannot be unselected.',
          '',
          'Name the group with `aria-label`, `aria-labelledby` or a `fieldset`/`legend`. Arrow keys',
          'move and select inside the group; Tab leaves it. Invalid on the group restyles every item.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

function Option({
  id,
  value,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupItem> & { id: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-start gap-2 text-base text-content">
      <RadioGroupItem id={id} value={value} disabled={disabled} className="mt-0.5" {...props} />
      <label
        htmlFor={id}
        className={disabled ? 'cursor-not-allowed text-content-disabled' : 'cursor-pointer'}
      >
        {children}
      </label>
    </span>
  );
}

const Campus = (props: React.ComponentProps<typeof RadioGroup>) => (
  <RadioGroup {...props}>
    <Option id={`${props.id}-blr`} value="bengaluru">
      Bengaluru — Electronic City residential campus
    </Option>
    <Option id={`${props.id}-pune`} value="pune">
      Pune
    </Option>
    <Option id={`${props.id}-online`} value="online" disabled>
      Online-only (not offered for the 4-year UG programme)
    </Option>
  </RadioGroup>
);

export const Playground: Story = {
  args: { 'aria-label': 'Preferred campus', defaultValue: 'bengaluru', id: 'rg-play' },
  argTypes: {
    // Radix only renders the hidden "bubble" input that carries `name` when
    // the group sits inside a <form>. This Playground has none, so changing
    // `name` has nothing to attach to — it is correct, not broken.
    name: {
      control: false,
      description: 'Only rendered (as a hidden native input) inside a <form> — invisible in this Playground.',
    },
  },
  // `defaultValue` seeds Radix's uncontrolled state only at mount, so
  // Controls changing it after the fact does nothing without a remount.
  render: (args) => <Campus key={args.defaultValue} {...args} />,
};

/** The HTML's group: fieldset + legend gives the group its name. */
export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <fieldset className="m-0 grid gap-4 border-0 p-0">
      <legend className="mb-4 p-0 text-md font-semibold text-content">Preferred campus</legend>
      <Campus id="rg-group" defaultValue="bengaluru" />
    </fieldset>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="unselected">
        <RadioGroup aria-label="unselected">
          <Option id="rs-1" value="pune">Pune</Option>
        </RadioGroup>
      </Spec>
      <Spec label="selected">
        <RadioGroup aria-label="selected" defaultValue="blr">
          <Option id="rs-2" value="blr">Bengaluru</Option>
        </RadioGroup>
      </Spec>
      <Spec label="disabled">
        <RadioGroup aria-label="disabled">
          <Option id="rs-3" value="online" disabled>Online</Option>
        </RadioGroup>
      </Spec>
      <Spec label="disabled + selected">
        <RadioGroup aria-label="disabled selected" defaultValue="blr" disabled>
          <Option id="rs-4" value="blr" disabled>Bengaluru</Option>
        </RadioGroup>
      </Spec>
    </div>
  ),
};

export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-2">
      <RadioGroup aria-label="Fee plan" aria-invalid aria-describedby="rg-err">
        <Option id="rg-isa" value="isa">Income Share Agreement</Option>
        <Option id="rg-upfront" value="upfront">Pay upfront</Option>
      </RadioGroup>
      <p id="rg-err" className="m-0 text-sm text-danger-content">
        Choose a fee plan to continue.
      </p>
    </div>
  ),
};

export const WithDescription: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RadioGroup aria-label="Fee plan" defaultValue="isa" className="max-w-2xl">
      <div className="grid gap-2">
        <Option id="rg-d-isa" value="isa" aria-describedby="rg-d-help">
          Income Share Agreement
        </Option>
        <p id="rg-d-help" className="m-0 text-sm text-content-secondary">
          Pay ₹0 upfront. 15% of monthly CTC for 36 months, capped at ₹19,50,000, starting only once
          you earn above ₹8,00,000 per annum.
        </p>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Campus id="rg-h" aria-label="Preferred campus" orientation="horizontal" defaultValue="pune" />,
};

export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState('pune');
    return (
      <div className="grid gap-3">
        <Campus id="rg-c" aria-label="Preferred campus" value={value} onValueChange={setValue} />
        <p className="m-0 text-sm text-content-secondary">
          Selected: <strong className="text-content">{value}</strong>
        </p>
      </div>
    );
  },
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="rest">
        <RadioGroup aria-label="rest"><RadioGroupItem value="a" aria-label="rest" /></RadioGroup>
      </Spec>
      <Spec label="selected">
        <RadioGroup aria-label="selected" defaultValue="a"><RadioGroupItem value="a" aria-label="selected" /></RadioGroup>
      </Spec>
      <Spec label="invalid">
        <RadioGroup aria-label="invalid" aria-invalid><RadioGroupItem value="a" aria-label="invalid" /></RadioGroup>
      </Spec>
      <Spec label="disabled">
        <RadioGroup aria-label="disabled"><RadioGroupItem value="a" aria-label="disabled" disabled /></RadioGroup>
      </Spec>
      <Spec label="disabled + selected">
        <RadioGroup aria-label="disabled selected" defaultValue="a" disabled><RadioGroupItem value="a" aria-label="disabled selected" /></RadioGroup>
      </Spec>
    </div>
  ),
};
