import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Slider } from './Slider';

const meta = {
  title: 'Atoms/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'An approximate value on a continuous range. A precise figure is a NumberInput.',
          '',
          'Radix thumbs are `<span role="slider">`, so a `<label htmlFor>` cannot name them: use',
          '`aria-labelledby` (forwarded to every thumb), `aria-label` (single thumb), or',
          '`thumbLabels` (one per thumb; required in spirit for a range). `getAriaValueText` gives',
          'the spoken value; `tooltip` + `formatValue` the value bubble.',
        ].join('\n'),
      },
    },
  },
  args: { 'aria-label': 'Weekly study hours', max: 60, defaultValue: [30] },
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

/** The HTML field: label + readout above, then the rail. */
function Field({
  id,
  label,
  initial,
  ...props
}: Omit<React.ComponentProps<typeof Slider>, 'value' | 'defaultValue'> & {
  id: string;
  label: string;
  initial: number;
}) {
  const [value, setValue] = React.useState([initial]);
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span id={id} className="text-sm font-semibold text-content">
          {label}
        </span>
        <span className="text-sm text-content-secondary tabular-nums">{value[0]} / 60</span>
      </div>
      <Slider aria-labelledby={id} max={60} value={value} onValueChange={setValue} {...props} />
    </div>
  );
}

export const Playground: Story = {};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-6">
      <Spec label="rest · minimum · empty track">
        <Field id="sl-min" label="Weekly study hours" initial={0} />
      </Spec>
      <Spec label="mid value · half-filled track">
        <Field id="sl-mid" label="Weekly study hours" initial={30} />
      </Spec>
      <Spec label="maximum · full track">
        <Field id="sl-max" label="Weekly study hours" initial={60} />
      </Spec>
      <Spec label="disabled">
        <Field id="sl-dis" label="Weekly study hours (set by your mentor)" initial={22} disabled />
      </Spec>
    </div>
  ),
};

/** Live readout, and a description via aria-describedby. */
export const LiveReadout: Story = {
  parameters: { controls: { disable: true } },
  render: function LiveStory() {
    const [v, setV] = React.useState([24]);
    return (
      <div className="grid gap-2">
        <span id="sl-live" className="text-sm font-semibold text-content">
          Weekly study hours you can commit to
        </span>
        <Slider
          aria-labelledby="sl-live"
          aria-describedby="sl-live-help"
          max={60}
          value={v}
          onValueChange={setV}
          getAriaValueText={(n) => `${n} hours per week`}
        />
        <p id="sl-live-help" className="m-0 text-sm text-content-secondary">
          <span className="tabular-nums">{v[0]}</span> hours per week — the Batch of 2029 median is{' '}
          <span className="tabular-nums">31</span>.
        </p>
      </div>
    );
  },
};

export const ValueTooltip: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-8">
      <Spec label="tooltip held open (always)">
        <Slider aria-label="Weekly study hours" max={60} step={2} defaultValue={[16]} tooltip="always" formatValue={(v) => `${v} h`} getAriaValueText={(v) => `${v} hours`} />
        <div className="flex justify-between text-xs text-content-secondary tabular-nums"><span>0</span><span>60</span></div>
      </Spec>
      <Spec label="tooltip on hover, focus or drag (interaction)">
        <Slider aria-label="Weekly study hours" max={60} step={2} defaultValue={[44]} tooltip="interaction" formatValue={(v) => `${v} h`} getAriaValueText={(v) => `${v} hours`} />
        <div className="flex justify-between text-xs text-content-secondary tabular-nums"><span>0</span><span>60</span></div>
      </Spec>
    </div>
  ),
};

export const Range: Story = {
  parameters: { controls: { disable: true } },
  render: function RangeStory() {
    const [fee, setFee] = React.useState([3, 9]);
    return (
      <div className="grid gap-8">
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-content">Annual fee range (₹ lakh)</span>
            <span className="text-sm text-content-secondary tabular-nums">₹{fee[0]}L – ₹{fee[1]}L</span>
          </div>
          <Slider
            thumbLabels={['Minimum annual fee, in lakh', 'Maximum annual fee, in lakh']}
            max={12}
            value={fee}
            onValueChange={setFee}
            tooltip="always"
            formatValue={(v) => `₹${v}L`}
            getAriaValueText={(v) => `₹${v} lakh`}
          />
          <div className="flex justify-between text-xs text-content-secondary tabular-nums"><span>₹0</span><span>₹12L</span></div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-content">Monthly stipend band (₹ thousand)</span>
          </div>
          <Slider
            thumbLabels={['Minimum monthly stipend, in thousand rupees', 'Maximum monthly stipend, in thousand rupees']}
            max={120}
            defaultValue={[60, 62]}
            minStepsBetweenThumbs={1}
            tooltip="always"
            formatValue={(v) => `₹${v}k`}
          />
          <div className="flex justify-between text-xs text-content-secondary tabular-nums"><span>₹0</span><span>₹120k</span></div>
        </div>
      </div>
    );
  },
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-6">
      <Slider aria-label="empty" max={60} defaultValue={[0]} />
      <Slider aria-label="half" max={60} defaultValue={[30]} />
      <Slider aria-label="full" max={60} defaultValue={[60]} />
      <Slider aria-label="disabled" max={60} defaultValue={[22]} disabled />
      <Slider thumbLabels={['Min', 'Max']} max={12} defaultValue={[3, 9]} tooltip="always" />
    </div>
  ),
};
