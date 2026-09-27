/**
 * Public exports for batch M8 (multi-select and date range). Only the batch M8 agent edits this file.
 * Re-exported from src/index.ts with `export *`; add named exports here only.
 */

/* ---------- MultiSelect ---------------------------------------------------- */
export { MultiSelect, multiSelectFilter, multiSelectVariants } from '../components/MultiSelect';
export type { MultiSelectProps, MultiSelectOption, MultiSelectSize } from '../components/MultiSelect';

/* ---------- DateRangePicker, RangeCalendar --------------------------------- */
export {
  DateRangePicker,
  RangeCalendar,
  rangeCalendarVariants,
  rangeCalendarDayVariants,
  formatDateRange,
  normalizeDateRange,
} from '../components/DateRangePicker';
export type {
  DateRangePickerProps,
  DateRangePreset,
  RangeCalendarProps,
  RangeCalendarMonths,
  DateRange,
} from '../components/DateRangePicker';
