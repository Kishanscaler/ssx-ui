'use client';

// Client: holds the controllable range, the draft while the popover is open
// and the open state, and closes the Popover when a range completes.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { chipVariants } from '../Chip';
import { Popover, PopoverContent, PopoverTrigger, type PopoverAlign } from '../Popover';
import { selectTriggerVariants, type SelectSize } from '../Select';
import {
  RangeCalendar,
  formatDateRange,
  normalizeDateRange,
  type DateRange,
  type RangeCalendarProps,
} from './RangeCalendar';

/* ---------------------------------------------------------------------------
 * DateRangePicker
 *
 * Two dates chosen together in a popover: a cohort's start and end, an
 * interview window, a leave request. Do NOT use it for two unrelated dates
 * (two DatePickers), or for one date (DatePicker).
 *
 *   <Field label="Interview window" help="Weekdays only. At least 3 nights.">
 *     <DateRangePicker name="window" min="2026-10-01" disabledDaysOfWeek={[0, 6]} minNights={3}
 *       presets={[{ label: 'Next 7 days', value: { from: '2026-10-01', to: '2026-10-07' } }]} />
 *   </Field>
 *
 * Why not `DatePicker mode="range"`: DatePicker is a DateInput (a typed
 * DD/MM/YYYY value) with a calendar button, and its value is one string. A
 * range changes the value's type, the field (a range is not one typed date)
 * and when the popover closes. A separate component leaves every DatePicker
 * call site exactly as it was; the two share the date model, the words and
 * the grid's keyboard (`RangeCalendar` reads Calendar's helpers).
 *
 * The field is a button in the Select trigger's look (sizes, invalid,
 * disabled): `role="combobox"` with a dialog popup, so its accessible name is
 * the Field label and its value is the text it shows, "12 Oct – 3 Nov 2026"
 * (`formatDateRange`, `Intl` in `en-IN`, the locale DatePicker uses).
 * Opening focuses the start day (else today). The range is a DRAFT until it
 * is complete: the first pick is the start, the second the end, and only then
 * does `value` change and the popover close (focus returns to the field).
 * Closing half-way (Escape, a press outside) leaves the value as it was.
 *
 * Form: with `name`, two hidden inputs, `name[from]` and `name[to]` (ISO) —
 * the nested-params shape Rails and most form libraries read as one object.
 *
 * Every other prop — `id`, `aria-*`, `disabled` — goes to the button, and so
 * does `ref`, so a Field wires its label, help and error onto it.
 * ------------------------------------------------------------------------- */

/** One shortcut chip under the grids ("Last 7 days", "Next cohort"). */
export interface DateRangePreset {
  /** The chip text. */
  label: string;
  /** The range it picks. */
  value: DateRange;
}

type CalendarRules = Pick<
  RangeCalendarProps,
  | 'min'
  | 'max'
  | 'disabledDates'
  | 'disabledDaysOfWeek'
  | 'isDateDisabled'
  | 'getDateDescription'
  | 'minNights'
  | 'maxNights'
  | 'weekStartsOn'
  | 'today'
  | 'locale'
  | 'showOutsideDays'
  | 'numberOfMonths'
>;

export type DateRangePickerProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'children'
> &
  CalendarRules & {
    /** The range (controlled): both ends, or `{ from: '', to: '' }` for none. */
    value?: DateRange;
    /**
     * The initial range (uncontrolled).
     *
     * @default { from: '', to: '' }
     */
    defaultValue?: DateRange;
    /** Called with the new range when a pick completes it or a preset is chosen. */
    onValueChange?: (range: DateRange) => void;
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
     * The field's text while no range is chosen.
     *
     * @default 'Choose dates'
     */
    placeholder?: string;
    /**
     * The calendar popover's accessible name: say what is being chosen.
     *
     * @default 'Choose a start and end date'
     */
    calendarLabel?: string;
    /** Shortcut chips under the grids. Each picks its range and closes; the one matching the value is pressed. */
    presets?: DateRangePreset[];
    /** Anything else under the grids, after the presets. */
    footer?: React.ReactNode;
    /**
     * The field's text for a range.
     *
     * @default formatDateRange (`12 Oct – 3 Nov 2026`)
     */
    formatValue?: (range: DateRange, locale: string) => string;
    /**
     * With `name`, the range is posted as two hidden inputs, `name[from]`
     * and `name[to]`, each ISO or `''`.
     */
    name?: string;
    /**
     * Control height and type size: 32 / 40 / 48px, as Input and Select.
     *
     * @default 'md'
     */
    size?: SelectSize;
    /**
     * The popover's alignment to the field.
     *
     * @default 'start'
     */
    align?: PopoverAlign;
    /**
     * Where the popover's portal mounts. Defaults to `document.body`, themed
     * by the `data-brand` / `data-theme` attributes on `<html>`.
     */
    container?: HTMLElement | null;
    /** Classes for the root wrapper, merged last. */
    className?: string;
  };

const EMPTY_RANGE: DateRange = { from: '', to: '' };

/** Phosphor 2.1.1 `calendar-blank` regular (DateInputButton's glyph). */
function CalendarGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `caret-down` fill (the Select trigger's solid caret). */
function CaretGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z" />
    </svg>
  );
}

const sameRange = (a: DateRange, b: DateRange) => a.from === b.from && a.to === b.to;

export const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      className,
      value: valueProp,
      defaultValue = EMPTY_RANGE,
      onValueChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      placeholder = 'Choose dates',
      calendarLabel = 'Choose a start and end date',
      presets,
      footer,
      formatValue = formatDateRange,
      name,
      size = 'md',
      align = 'start',
      container,
      min,
      max,
      disabledDates,
      disabledDaysOfWeek,
      isDateDisabled,
      getDateDescription,
      minNights,
      maxNights,
      weekStartsOn,
      today,
      locale = 'en-IN',
      showOutsideDays,
      numberOfMonths,
      disabled,
      ...props
    },
    ref,
  ) {
    const [valueState, setValue] = useControllableState<DateRange>({
      prop: valueProp,
      defaultProp: defaultValue,
      onChange: onValueChange,
      caller: 'DateRangePicker',
    });
    const committed = normalizeDateRange(valueState);
    // A half-chosen value is not a value: the field shows a whole range or nothing.
    const value = committed.to ? committed : EMPTY_RANGE;

    const [openState, setOpenState] = useControllableState<boolean>({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
      caller: 'DateRangePicker',
    });
    const open = Boolean(openState) && !disabled;

    // The range being chosen, reset from the value each time the popover opens.
    const [draft, setDraft] = React.useState<DateRange>(value);
    const setOpen = (next: boolean) => {
      if (next) setDraft(value);
      setOpenState(next);
    };

    const complete = (range: DateRange) => {
      if (!sameRange(range, value)) setValue(range);
      setOpenState(false);
    };

    const text = value.from ? formatValue(value, locale) : '';
    const hasFooter = (presets?.length ?? 0) > 0 || footer != null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div data-slot="date-range-picker" data-state={open ? 'open' : 'closed'} className={cn('w-full', className)}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              role="combobox"
              data-slot="date-range-picker-trigger"
              data-size={size}
              data-placeholder={text ? undefined : ''}
              disabled={disabled}
              className={selectTriggerVariants({ size })}
              {...props}
            >
              <span
                aria-hidden="true"
                className="flex shrink-0 text-content-secondary in-disabled:text-content-disabled [&_svg]:size-icon-md"
              >
                <CalendarGlyph />
              </span>
              <span data-slot="date-range-picker-value" className="block min-w-0 flex-1 truncate">
                {text || placeholder}
              </span>
              <span
                aria-hidden="true"
                className="flex shrink-0 text-field-content in-disabled:text-content-disabled [&_svg]:size-icon-sm"
              >
                <CaretGlyph />
              </span>
            </button>
          </PopoverTrigger>
          {name ? (
            <>
              <input type="hidden" name={`${name}[from]`} value={value.from} />
              <input type="hidden" name={`${name}[to]`} value={value.to} />
            </>
          ) : null}
        </div>
        <PopoverContent
          aria-label={calendarLabel}
          align={align}
          container={container}
          data-slot="date-range-picker-content"
          className={cn(
            // One month on a phone (Calendar's 280px; 320px of 44px days on
            // touch, as DatePicker), two side by side from `sm`.
            'pointer-coarse:max-w-[min(calc(var(--calendar-width-coarse)+2*var(--space-3)+2*var(--border-hair)),var(--radix-popover-content-available-width))] pointer-coarse:p-3',
            numberOfMonths !== 1 &&
              'sm:max-w-[min(var(--date-range-picker-popover-max-width),var(--radix-popover-content-available-width))] sm:pointer-coarse:max-w-[min(var(--date-range-picker-popover-max-width-coarse),var(--radix-popover-content-available-width))]',
          )}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <RangeCalendar
            autoFocus
            value={draft}
            onValueChange={setDraft}
            onRangeSelect={complete}
            min={min}
            max={max}
            disabledDates={disabledDates}
            disabledDaysOfWeek={disabledDaysOfWeek}
            isDateDisabled={isDateDisabled}
            getDateDescription={getDateDescription}
            minNights={minNights}
            maxNights={maxNights}
            weekStartsOn={weekStartsOn}
            today={today}
            locale={locale}
            showOutsideDays={showOutsideDays}
            numberOfMonths={numberOfMonths}
            footer={
              hasFooter ? (
                <>
                  {presets?.map((preset) => {
                    const range = normalizeDateRange(preset.value);
                    const pressed = range.to !== '' && sameRange(range, value);
                    return (
                      <button
                        key={`${preset.label}-${range.from}-${range.to}`}
                        type="button"
                        aria-pressed={pressed}
                        data-slot="date-range-picker-preset"
                        data-state={pressed ? 'on' : 'off'}
                        className={cn(
                          chipVariants(),
                          'cursor-pointer outline-none enabled:hover:bg-surface-hover',
                          'data-[state=on]:enabled:hover:bg-surface-brand-subtle',
                          'focus-visible:border-border-focus focus-visible:ring-halo focus-visible:ring-focus-halo',
                          // Touch: the chip itself grows to 44px (a popup may change
                          // layout; an invisible area would overlap the next row).
                          'pointer-coarse:h-touch-min',
                        )}
                        onClick={() => {
                          if (range.to) complete(range);
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  {footer}
                </>
              ) : undefined
            }
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DateRangePicker.displayName = 'DateRangePicker';
