import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NumberInput } from './NumberInput';

const meta = {
  title: 'Atoms/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A bounded numeric quantity: a fee, a credit count, an attendance percentage. Not for',
          'identifiers that merely look numeric (applicant ID, phone number).',
          '',
          'A native `type="number"` with the native spinners hidden and two real stepper buttons with',
          'accessible names. `value` / `onValueChange` carry `number | null`. Steps are clamped to',
          '`min` / `max` and rounded to the step’s precision; the − / + button disables at its bound;',
          '↑ ↓ step, PageUp / PageDown step ten, Home / End jump to the bounds; the wheel never changes',
          'a focused value. A typed value is clamped on blur unless `clampOnBlur={false}`.',
          '',
          '`className` and `size` go on the group; `id`, `aria-*`, `name` and the ref on the <input>.',
          'Units (₹ / %) are the InputGroup molecule’s job; Indian digit grouping goes in help text.',
        ].join('\n'),
      },
    },
  },
  args: {
    'aria-label': 'Credits this semester',
    defaultValue: 18,
    min: 12,
    max: 24,
    step: 1,
    size: 'md',
    stepper: true,
    decrementLabel: 'Decrease credits',
    incrementLabel: 'Increase credits',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-invalid': { control: 'boolean', name: 'aria-invalid' },
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>{children}</div>
);

const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 8, justifyItems: 'start', alignContent: 'start', minWidth: 160 }}>
    <span style={{ font: '600 11px/1 var(--font-family-mono)', color: 'var(--content-secondary)', textTransform: 'uppercase' }}>{tag}</span>
    {children}
  </div>
);

/** Every prop, live. */
export const Playground: Story = {};

/** The stepper, at rest, at maximum (+ disabled), at minimum (− disabled), and four figures at the same width. */
export const Stepper: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec tag="stepper · credits">
        <NumberInput aria-label="Credits" defaultValue={18} min={12} max={24} decrementLabel="Decrease credits" incrementLabel="Increase credits" />
      </Spec>
      <Spec tag="at maximum">
        <NumberInput aria-label="Credits" defaultValue={24} min={12} max={24} />
      </Spec>
      <Spec tag="at minimum">
        <NumberInput aria-label="Credits" defaultValue={12} min={12} max={24} />
      </Spec>
      <Spec tag="four figures · step 10">
        <NumberInput aria-label="Seats offered, Batch of 2029" defaultValue={1080} min={0} max={2000} step={10} decrementLabel="Decrease seats" incrementLabel="Increase seats" />
      </Spec>
    </Row>
  ),
};

/** Rest (empty), disabled, read-only, and invalid above max (clampOnBlur off, so the error can point at it). */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec tag="rest · empty">
        <NumberInput aria-label="Attendance percentage" min={0} max={100} placeholder="0" />
      </Spec>
      <Spec tag="disabled">
        <NumberInput aria-label="Credits, disabled" defaultValue={18} min={12} max={24} disabled />
      </Spec>
      <Spec tag="read-only">
        <NumberInput aria-label="Credits already earned" defaultValue={24} readOnly />
      </Spec>
      <Spec tag="invalid · above max">
        <NumberInput
          aria-label="Credits this semester"
          defaultValue={30}
          min={12}
          max={24}
          step={2}
          clampOnBlur={false}
          aria-invalid
          aria-describedby="ni-invalid-err"
        />
        <p id="ni-invalid-err" className="text-sm text-danger-content">
          Maximum is 24 credits without a dean’s exception.
        </p>
      </Spec>
    </Row>
  ),
};

/** 32 / 40 / 48px; the step buttons stay square at the field’s own height. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Spec key={size} tag={size}>
          <NumberInput aria-label={`Credits, ${size}`} size={size} defaultValue={18} min={12} max={24} step={2} />
        </Spec>
      ))}
    </Row>
  ),
};

/** `stepper={false}`: a bare field in the Input recipe. Keyboard stepping and clamping still apply. */
export const WithoutStepper: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Spec key={size} tag={`bare · ${size}`}>
          <NumberInput aria-label={`Credits, ${size}`} stepper={false} size={size} defaultValue={18} min={12} max={24} step={2} className="w-40" />
        </Spec>
      ))}
      <Spec tag="bare · invalid">
        <NumberInput aria-label="Credits" stepper={false} defaultValue={30} max={24} clampOnBlur={false} aria-invalid className="w-40" />
      </Spec>
    </Row>
  ),
};

/** Controlled (`value` / `onValueChange`) beside uncontrolled (`defaultValue`). */
export const ControlledAndUncontrolled: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Demo = () => {
      const [value, setValue] = React.useState<number | null>(75);
      return (
        <Row>
          <Spec tag={`controlled · value = ${String(value)}`}>
            <NumberInput aria-label="Minimum attendance (%)" value={value} onValueChange={setValue} min={0} max={100} step={5} />
          </Spec>
          <Spec tag="uncontrolled · defaultValue = 18">
            <NumberInput aria-label="Credits" defaultValue={18} min={12} max={24} />
          </Spec>
        </Row>
      );
    };
    return <Demo />;
  },
};
