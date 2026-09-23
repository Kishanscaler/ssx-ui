import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DatePicker, type DatePickerProps } from './DatePicker';
import { Calendar, type CalendarWeekStart } from './Calendar';
import { Field } from '../Field';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const WEEK_STARTS: CalendarWeekStart[] = ['sunday', 'monday'];

/** The HTML's March 2026: slots from today (12 Mar), weekends closed, "no slots" before. */
const TODAY = '2026-03-12';
const describeDay = (iso: string) =>
  iso < TODAY ? 'no slots' : [0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay()) ? 'campus closed' : undefined;

const meta = {
  title: 'Organisms/DatePicker',
  component: DatePicker,
  subcomponents: { Calendar } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A month grid in a popover attached to a date field: interview slots, assignment deadlines, placement',
          'drive dates. Do NOT use it for a birth date — a plain DateInput is faster.',
          '',
          '`DateInput` (typing, DD/MM/YYYY) + `DateInputButton` as the Popover trigger + `Calendar`. One ISO',
          '`YYYY-MM-DD` value. Opening focuses the chosen day; ←/→ a day, ↑/↓ a week, PageUp/PageDown a month',
          '(Shift: a year), Home/End the week, Enter/Space choose, Escape closes. A chosen day is `aria-pressed`,',
          'today `aria-current="date"`, a closed day a native disabled button. `en-IN`, Sunday first as the HTML',
          'draws it (`weekStartsOn="monday"` available). No date library.',
          '',
          '`min` / `max` / disabled dates bind the calendar; a typed date is the form\'s to validate, through the',
          "Field's error.",
        ].join('\n'),
      },
    },
  },
  args: {
    value: '2026-03-18',
    today: TODAY,
    min: TODAY,
    max: '2026-04-30',
    disabledDaysOfWeek: [0, 6],
    weekStartsOn: 'sunday',
    locale: 'en-IN',
    showOutsideDays: true,
    calendarLabel: 'Choose an interview date',
    buttonLabel: 'Open the calendar',
    presets: [
      { label: 'Next open slot', value: '2026-03-13' },
      { label: 'This week', value: '2026-03-16' },
    ],
    size: 'md',
    disabled: false,
    defaultOpen: false,
    align: 'start',
  },
  argTypes: {
    value: { control: 'text', description: 'ISO YYYY-MM-DD (two-way with the story).' },
    defaultValue: { control: false },
    today: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    disabledDates: { control: 'object' },
    disabledDaysOfWeek: { control: 'object' },
    weekStartsOn: { control: 'select', options: WEEK_STARTS },
    locale: { control: 'text' },
    showOutsideDays: { control: 'boolean' },
    calendarLabel: { control: 'text' },
    buttonLabel: { control: 'text' },
    presets: { control: 'object' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    open: { control: false },
    align: { control: 'select', options: ['start', 'center', 'end'] },
    placeholder: { control: 'text' },
    name: { control: 'text' },
    footer: { control: false },
    isDateDisabled: { control: false },
    getDateDescription: { control: false },
    onValueChange: { action: 'valueChange' },
    onOpenChange: { action: 'openChange' },
    onTextChange: { action: 'textChange' },
    className: { control: 'text' },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<DatePickerProps>();
    return (
      <div style={{ maxWidth: 320, minHeight: 440 }}>
        <Field label="Interview date" help="Weekends are closed. Slots release 10 days ahead.">
          <DatePicker
            key={String(args.defaultOpen)}
            getDateDescription={describeDay}
            {...args}
            onValueChange={(value) => {
              updateArgs({ value });
              args.onValueChange?.(value);
            }}
          />
        </Field>
      </div>
    );
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The HTML's working example (`#date-picker`): pick an interview slot. The value is two-way with the controls. */
export const Playground: Story = {};

/** The same, opened: the popover calendar with the presets row (`pop-datepicker`). */
export const Open: Story = {
  args: { defaultOpen: true },
};

/** Field states (`dp-bad`, `dp-off`): invalid through the Field's error, and disabled once the offer is sent. */
export const FieldStates: Story = {
  name: 'Field states',
  render: () => (
    <Row align="start">
      <Spec label="invalid">
        <div style={{ width: '100%', maxWidth: 280 }}>
          <Field label="Interview date" error="That date does not exist. Use DD/MM/YYYY.">
            <DatePicker today={TODAY} />
          </Field>
        </div>
      </Spec>
      <Spec label="disabled">
        <div style={{ width: '100%', maxWidth: 280 }}>
          <Field label="Interview date" help="Locked once the offer is sent." disabled>
            <DatePicker defaultValue="2026-03-18" today={TODAY} />
          </Field>
        </div>
      </Spec>
    </Row>
  ),
};

/** The calendar on its own ("always-visible, so every day state is reviewable"). Arrow keys work. */
export const InlineCalendar: StoryObj<typeof Calendar> = {
  name: 'Calendar (inline)',
  render: (args) => (
    <Row align="start">
      <Spec label="Sunday first (the HTML)">
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-raised)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
          }}
        >
          <Calendar {...args} />
        </div>
      </Spec>
      <Spec label="weekStartsOn=monday">
        <div
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-raised)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
          }}
        >
          <Calendar {...args} weekStartsOn="monday" defaultValue="2026-03-18" />
        </div>
      </Spec>
    </Row>
  ),
  args: {
    // Reset the DatePicker story's args: an inline calendar here is uncontrolled.
    value: undefined,
    max: undefined,
    disabledDaysOfWeek: undefined,
    today: TODAY,
    defaultValue: '2026-03-14',
    min: '2026-03-10',
    disabledDates: ['2026-03-21', '2026-03-28'],
    getDateDescription: describeDay,
  },
  argTypes: {
    weekStartsOn: { control: 'select', options: WEEK_STARTS },
    today: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    disabledDates: { control: 'object' },
    disabledDaysOfWeek: { control: 'object' },
    locale: { control: 'text' },
    showOutsideDays: { control: 'boolean' },
    onValueChange: { action: 'valueChange' },
    onMonthChange: { action: 'monthChange' },
  },
};
