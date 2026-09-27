import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DateRangePicker, type DateRangePreset } from './DateRangePicker';
import { RangeCalendar, formatDateRange, type DateRange } from './RangeCalendar';
import { Button } from '../Button';
import { Field } from '../Field';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

/** Pinned, so every screenshot draws the same months. */
const TODAY = '2026-10-05';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const shift = (base: string, days: number) => {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
};

const PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', value: { from: shift(TODAY, -6), to: TODAY } },
  { label: 'This month', value: { from: '2026-10-01', to: '2026-10-31' } },
  { label: 'Next cohort', value: { from: '2026-11-02', to: '2027-04-30' } },
];

const WEEKEND = (date: string) => [0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay());

const meta = {
  title: 'Molecules/DateRangePicker',
  component: DateRangePicker,
  subcomponents: { RangeCalendar } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Two dates chosen together: a cohort’s start and end, an interview window, a leave request. Not for two',
          'unrelated dates (two DatePickers) or one date (DatePicker).',
          '',
          'A button in the Select trigger’s look (`role="combobox"`, dialog popup) showing “12 Oct – 3 Nov 2026”',
          '(`Intl` `en-IN`, as DatePicker), and a `RangeCalendar` in a popover: two months side by side from `sm`,',
          'one on phones. The first pick is the start, the second the end; a pick before the start starts again;',
          'the pointer (or keyboard focus) previews the range with a dashed band. The range is a draft until both',
          'ends are in, then `value` changes and the popover closes. Keyboard as Calendar: ←/→ a day, ↑/↓ a week,',
          'PageUp/PageDown a month (Shift: a year), Home/End the week, one tab stop across both months.',
          '',
          '`min` / `max` / disabled days bind the ends (a range may span a closed day); `minNights` / `maxNights`',
          'bound its length. With `name`, two hidden inputs: `name[from]` and `name[to]`.',
          '',
          'Its own component, not `DatePicker mode="range"`, so the single-date DatePicker (a typed DD/MM/YYYY',
          'field, one string value) is untouched. `RangeCalendar` is exported for an always-visible range grid.',
        ].join('\n'),
      },
    },
  },
  args: {
    defaultValue: { from: '2026-10-12', to: '2026-11-03' },
    today: TODAY,
    placeholder: 'Choose dates',
    calendarLabel: 'Choose the cohort’s start and end',
    presets: PRESETS,
    numberOfMonths: 2,
    minNights: 0,
    size: 'md',
    disabled: false,
    defaultOpen: false,
    align: 'start',
    locale: 'en-IN',
    weekStartsOn: 'sunday',
    name: 'cohort',
  },
  argTypes: {
    value: { control: false, description: 'Controlled range. Use `defaultValue` here; see the Controlled story.' },
    defaultValue: { control: 'object' },
    today: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    disabledDates: { control: 'object' },
    disabledDaysOfWeek: { control: 'object' },
    minNights: { control: 'number' },
    maxNights: { control: 'number' },
    numberOfMonths: { control: 'inline-radio', options: [1, 2] },
    weekStartsOn: { control: 'inline-radio', options: ['sunday', 'monday'] },
    locale: { control: 'text' },
    presets: { control: 'object' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    open: { control: false },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    formatValue: { control: false },
    container: { control: false },
    onValueChange: { action: 'valueChange' },
    onOpenChange: { action: 'openChange' },
  },
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <Field label="Cohort dates" help="Classes run Monday to Friday.">
        <DateRangePicker key={`${JSON.stringify(args.defaultValue)}-${String(args.defaultOpen)}`} {...args} />
      </Field>
    </div>
  ),
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Driven by the controls. */
export const Playground: Story = {};

/** Open on a chosen range, with presets. Hover a day after picking a start to see the preview. */
export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 360, minHeight: 460 }}>
      <Field label="Cohort dates">
        <DateRangePicker {...args} />
      </Field>
    </div>
  ),
};

/** An interview window: weekdays only, from today, 2 to 10 nights long, a holiday closed. */
export const InterviewWindow: Story = {
  args: {
    defaultValue: { from: '', to: '' },
    min: TODAY,
    max: '2026-12-31',
    disabledDaysOfWeek: [0, 6],
    disabledDates: ['2026-10-20'],
    minNights: 2,
    maxNights: 10,
    presets: undefined,
    placeholder: 'Choose a window',
    calendarLabel: 'Choose the interview window',
    getDateDescription: (date: string) =>
      date === '2026-10-20' ? 'Diwali, campus closed' : WEEKEND(date) ? 'weekend' : undefined,
    name: 'window',
  },
  render: (args) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <Field label="Interview window" help="Weekdays only, 2 to 10 nights. The panel picks a slot inside it.">
        <DateRangePicker {...args} />
      </Field>
    </div>
  ),
};

/** Invalid (a Field error), disabled, and the three sizes. */
export const FieldStates: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <Spec label="invalid">
        <div style={{ width: 300, maxWidth: '100%' }}>
          <Field label="Leave dates" error="Leave must end before the placement drive on 16 Nov." required>
            <DateRangePicker today={TODAY} defaultValue={{ from: '2026-11-10', to: '2026-11-20' }} />
          </Field>
        </div>
      </Spec>
      <Spec label="disabled">
        <div style={{ width: 300, maxWidth: '100%' }}>
          <Field label="Term 3 dates" help="Set by the programme office." disabled>
            <DateRangePicker today={TODAY} defaultValue={{ from: '2027-01-04', to: '2027-03-26' }} />
          </Field>
        </div>
      </Spec>
      <Spec label="sizes · sm / md / lg">
        <div style={{ display: 'grid', gap: 12, width: 300, maxWidth: '100%' }}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <DateRangePicker
              key={size}
              size={size}
              aria-label={`Dates, ${size}`}
              today={TODAY}
              defaultValue={{ from: '2026-12-28', to: '2027-01-04' }}
            />
          ))}
        </div>
      </Spec>
    </Row>
  ),
};

/** `value` + `onValueChange`, and what the form posts (`cohort[from]`, `cohort[to]`). */
export const Controlled: Story = {
  parameters: { controls: { disable: true } },
  render: function ControlledStory() {
    const [value, setValue] = React.useState<DateRange>({ from: '', to: '' });
    const [posted, setPosted] = React.useState('');
    return (
      <form
        style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 360 }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setPosted(`cohort[from]=${data.get('cohort[from]')} cohort[to]=${data.get('cohort[to]')}`);
        }}
      >
        <Field label="Bootcamp dates">
          <DateRangePicker today={TODAY} value={value} onValueChange={setValue} name="cohort" presets={PRESETS} />
        </Field>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setValue({ from: '', to: '' })}>
            Clear dates
          </Button>
          <Button type="submit" size="sm">
            Submit
          </Button>
        </div>
        <Text size="sm" tone="secondary">
          {value.from ? formatDateRange(value) : 'No range'} · posted: {posted || '—'}
        </Text>
      </form>
    );
  },
};

/** The grid on its own (always visible), with a start chosen: move the pointer to preview an end. */
export const InlineRangeCalendar: StoryObj<typeof RangeCalendar> = {
  parameters: { controls: { disable: true } },
  render: function InlineStory() {
    const [range, setRange] = React.useState<DateRange>({ from: '2026-10-26', to: '' });
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <RangeCalendar
          today={TODAY}
          value={range}
          onValueChange={setRange}
          min={TODAY}
          getDateDescription={(date) => (WEEKEND(date) ? 'weekend' : undefined)}
        />
        <Text size="sm" tone="secondary">
          {range.to ? formatDateRange(range) : range.from ? 'Now choose the end date.' : 'Choose a start date.'}
        </Text>
      </div>
    );
  },
};

/** A complete range across a month boundary and several week wraps. */
export const RangeAcrossMonths: StoryObj<typeof RangeCalendar> = {
  parameters: { controls: { disable: true } },
  render: () => <RangeCalendar today={TODAY} defaultValue={{ from: '2026-10-21', to: '2026-11-11' }} />,
};
