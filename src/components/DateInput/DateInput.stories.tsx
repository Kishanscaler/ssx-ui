import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field } from '../Field';
import {
  DateInput,
  DateInputButton,
  parseDateInputText,
  type DateInputProps,
  type DateInputSize,
  type DateInputState,
} from './DateInput';

type PlaygroundArgs = DateInputProps & { withButton: boolean };

const meta = {
  title: 'Molecules/DateInput',
  component: DateInput,
  subcomponents: { DateInputButton },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A typed date, DD/MM/YYYY (day first). The slashes are typed for you, paste survives any',
          'punctuation (and ISO), Backspace steps over a separator, the caret stays by digit.',
          '',
          '**Value** is an ISO `YYYY-MM-DD` string, `\'\'` while empty, half-typed or not a real date.',
          '`onTextChange(text, state)` reports `empty | partial | invalid | valid` on every edit, for the',
          'Field error. No calendar here: the DatePicker organism puts a Popover on `DateInputButton`.',
        ].join('\n'),
      },
    },
  },
  args: {
    'aria-label': 'Interview date',
    value: '2026-03-27',
    size: 'md',
    placeholder: 'DD/MM/YYYY',
    disabled: false,
    readOnly: false,
    withButton: true,
  } as PlaygroundArgs,
  argTypes: {
    value: { control: 'text', description: 'ISO `YYYY-MM-DD`, or `\'\'`.' },
    defaultValue: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] satisfies DateInputSize[] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    name: { control: 'text' },
    'aria-label': { control: 'text' },
    trailing: { control: false },
    onValueChange: { control: false },
    onTextChange: { control: false },
    withButton: { control: 'boolean', description: 'Story only: a trailing `DateInputButton`.' },
  } as Meta<typeof DateInput>['argTypes'],
  decorators: [
    (Story) => (
      <div className="max-w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-w-[280px] flex-1 flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

const calendar = <DateInputButton aria-label="Choose interview date from calendar" />;

/** Two-way: a complete, real date updates the `value` control (ISO), and the control drives the field. */
export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const { withButton, ...rest } = args as PlaygroundArgs;
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <DateInput {...rest} trailing={withButton ? calendar : undefined} onValueChange={(value) => updateArgs({ value })} />
    );
  },
};

const long = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** The form pattern: help says the date back in words, an impossible date is an error that repeats the rule. */
export const WithValidation: Story = {
  render: function ValidationStory() {
    const [iso, setIso] = React.useState('2026-03-27');
    const [state, setState] = React.useState<DateInputState>('valid');
    const [text, setText] = React.useState('27/03/2026');
    const error =
      state === 'invalid' ? `${text} is not a real date. Use DD/MM/YYYY.` : undefined;
    return (
      <Field
        label="Interview date"
        required
        help={iso ? `Format DD/MM/YYYY. ${long(iso)}` : 'Format DD/MM/YYYY — the slashes are typed for you.'}
        error={error}
      >
        <DateInput
          value={iso}
          onValueChange={setIso}
          onTextChange={(t, s) => {
            setText(t);
            setState(s);
          }}
          trailing={<DateInputButton aria-label="Change interview date" />}
        />
      </Field>
    );
  },
};

export const States: Story = {
  decorators: [(Story) => <div className="max-w-none"><Story /></div>],
  render: () => (
    <div className="flex max-w-[680px] flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="rest">
        <Field label="Interview date" help="Format DD/MM/YYYY — the slashes are typed for you. Panel slots run 10:00–18:00 IST on weekdays.">
          <DateInput trailing={calendar} />
        </Field>
      </Spec>
      <Spec label="filled">
        <Field label="Interview date" help={`Format DD/MM/YYYY. ${long('2026-03-27')}`}>
          <DateInput defaultValue="2026-03-27" trailing={<DateInputButton aria-label="Change interview date" />} />
        </Field>
      </Spec>
      <Spec label="invalid">
        <Field label="Interview date" required error="31 February 2026 is not a real date. Use DD/MM/YYYY.">
          <InvalidSpecimen />
        </Field>
      </Spec>
      <Spec label="disabled">
        <Field label="Interview date" help="Locked once the offer letter is issued." disabled>
          <DateInput defaultValue="2026-03-27" trailing={<DateInputButton aria-label="Change interview date" />} />
        </Field>
      </Spec>
    </div>
  ),
};

/** 31/02/2026 is typed text, not a value (it has no ISO form), so the specimen types it on mount. */
function InvalidSpecimen(props: Partial<DateInputProps>) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    // After the first frame, so the story's own mount has settled.
    const frame = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '31022026');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  // `ref` after the spread: under React 19 the Field's Slot passes its own ref in props.
  return <DateInput trailing={<DateInputButton aria-label="Change interview date" />} {...props} ref={ref} />;
}

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <DateInput key={size} size={size} aria-label={`Date ${size}`} defaultValue="2026-03-04" trailing={calendar} />
      ))}
    </div>
  ),
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      <DateInput aria-label="Empty" />
      <DateInput aria-label="Filled" defaultValue="2026-03-27" trailing={calendar} />
      <DateInput aria-label="Invalid" defaultValue="2026-03-27" aria-invalid trailing={calendar} />
      <DateInput aria-label="Disabled" defaultValue="2026-03-27" disabled trailing={calendar} />
      <DateInput aria-label="Read-only" defaultValue="2026-03-27" readOnly />
      <span className="text-xs text-content-secondary">
        parse(&quot;04032026&quot;) → {parseDateInputText('04032026').iso}
      </span>
    </div>
  ),
};
