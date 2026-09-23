'use client';

// Client: holds the controllable value and open state, and closes the
// Popover when a date is chosen.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { chipVariants } from '../Chip';
import { DateInput, DateInputButton, type DateInputProps } from '../DateInput';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger, type PopoverAlign } from '../Popover';
import { Calendar, type CalendarProps } from './Calendar';

/* ---------------------------------------------------------------------------
 * DatePicker
 *
 * A month grid in a popover attached to a date field: interview slots,
 * assignment deadlines, placement drive dates. Do NOT use it for a birth date
 * or any date a person already knows — a plain DateInput is faster.
 *
 *   <Field label="Interview date" help="Weekends are closed. Slots release 10 days ahead.">
 *     <DatePicker min="2026-03-12" disabledDaysOfWeek={[0, 6]} calendarLabel="Choose an interview date"
 *       presets={[{ label: 'Next open slot', value: '2026-03-13' }]} />
 *   </Field>
 *
 * It is `DateInput` (typing, the fast path: DD/MM/YYYY, ISO value) with a
 * `DateInputButton` in its trailing slot as the `Popover` trigger, and the
 * `Calendar` inside. One value, ISO `YYYY-MM-DD`, shared by the field and the
 * grid. Opening moves focus onto the chosen day (else today, else the first
 * open day); choosing closes the popover and returns focus to the button;
 * Escape closes it too.
 *
 * `min` / `max` / disabled dates bind the calendar only: a typed date is the
 * form's to validate (`onTextChange` reports the text's state), shown through
 * the Field's error — as `dp-bad` does ("That date does not exist").
 *
 * Every other prop — `id`, `name`, `aria-*`, `disabled`, `size` — is the
 * DateInput's, so a Field wires the text input.
 * ------------------------------------------------------------------------- */

/** One shortcut chip under the grid. */
export interface DatePickerPreset {
  /** The chip text ("Next open slot"). */
  label: string;
  /** The date it picks, ISO. */
  value: string;
}

type CalendarRules = Pick<
  CalendarProps,
  | 'min'
  | 'max'
  | 'disabledDates'
  | 'disabledDaysOfWeek'
  | 'isDateDisabled'
  | 'getDateDescription'
  | 'weekStartsOn'
  | 'today'
  | 'locale'
  | 'showOutsideDays'
>;

export type DatePickerProps = Omit<DateInputProps, 'trailing'> &
  CalendarRules & {
    /** The popover is open (controlled). */
    open?: boolean;
    /**
     * Start open (uncontrolled). For a story or a screenshot.
     *
     * @default false
     */
    defaultOpen?: boolean;
    /** Called with the popover's new open state. */
    onOpenChange?: (open: boolean) => void;
    /**
     * The calendar popover's accessible name: say what is being chosen.
     *
     * @default 'Choose a date'
     */
    calendarLabel?: string;
    /**
     * The calendar button's accessible name.
     *
     * @default 'Open the calendar'
     */
    buttonLabel?: string;
    /** Shortcut chips under the grid ("Next open slot", "This week"). Each picks its date and closes. */
    presets?: DatePickerPreset[];
    /** Anything else under the grid, after the presets. */
    footer?: React.ReactNode;
    /**
     * The popover's alignment to the field.
     *
     * @default 'start'
     */
    align?: PopoverAlign;
  };

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  {
    className,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    calendarLabel = 'Choose a date',
    buttonLabel = 'Open the calendar',
    presets,
    footer,
    align = 'start',
    min,
    max,
    disabledDates,
    disabledDaysOfWeek,
    isDateDisabled,
    getDateDescription,
    weekStartsOn,
    today,
    locale,
    showOutsideDays,
    disabled,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'DatePicker',
  });
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    caller: 'DatePicker',
  });

  const pick = (iso: string) => {
    setValue(iso);
    setOpen(false);
  };

  const hasFooter = (presets?.length ?? 0) > 0 || footer != null;

  return (
    <Popover open={disabled ? false : (open ?? false)} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div data-slot="date-picker" data-state={open ? 'open' : 'closed'} className={cn('w-full', className)}>
          <DateInput
            ref={ref}
            value={value ?? ''}
            onValueChange={setValue}
            disabled={disabled}
            trailing={
              <PopoverTrigger asChild>
                <DateInputButton aria-label={buttonLabel} />
              </PopoverTrigger>
            }
            {...props}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        aria-label={calendarLabel}
        align={align}
        data-slot="date-picker-content"
        // The grid takes focus itself (Calendar `autoFocus`), on the chosen day.
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          autoFocus
          value={value ?? ''}
          onDateSelect={pick}
          min={min}
          max={max}
          disabledDates={disabledDates}
          disabledDaysOfWeek={disabledDaysOfWeek}
          isDateDisabled={isDateDisabled}
          getDateDescription={getDateDescription}
          weekStartsOn={weekStartsOn}
          today={today}
          locale={locale}
          showOutsideDays={showOutsideDays}
          footer={
            hasFooter ? (
              <>
                {presets?.map((preset) => (
                  <button
                    key={preset.value + preset.label}
                    type="button"
                    data-slot="date-picker-preset"
                    className={cn(
                      chipVariants(),
                      // Chip's interactive look; an action, so no pressed state.
                      'cursor-pointer outline-none enabled:hover:bg-surface-hover',
                      'focus-visible:border-border-focus focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
                    )}
                    onClick={() => pick(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
                {footer}
              </>
            ) : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
});
DatePicker.displayName = 'DatePicker';
