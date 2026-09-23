'use client';

// Client: holds the controllable query, attaches the clear / Escape handlers.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { IconButton } from '../IconButton';
import { Input, type InputSize } from '../Input';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * SearchInput
 *
 * A query that narrows a set the user can already see: a leading magnifier,
 * a trailing clear button once there is something to clear, an optional
 * live result count under the field. If the query navigates somewhere new,
 * that is a search FORM (a submit button and a results page), not this.
 *
 * The field IS `Input` — same recipe, sizes, focus ring, invalid and disabled
 * looks — with the side padding widened for the glyph and the trailing
 * control (preview `.inputGroup`). `type="search"` for the semantics and the
 * on-screen keyboard; Input already suppresses the browser's own ✕.
 *
 * Where the props go (as NumberInput): `className` on the ROOT; every other
 * native attribute, `id`, `aria-*` and the ref on the <input>, so a Field, a
 * `<label htmlFor>` and a test all find the input. Without a visible label
 * give it an `aria-label` ("Search students").
 *
 * Clear: the ✕ is a real button named by `clearLabel`; it empties the query,
 * calls `onClear` and puts focus back in the field. Escape does the same from
 * the keyboard. Hidden while empty, disabled, read-only or loading.
 *
 * Loading: the six-dot loader takes the ✕'s place, and the status line says
 * `loadingText`. Result count: `resultCount` under the field, in a
 * `role="status"` line linked by `aria-describedby`, so it is announced as it
 * changes; tabular figures keep it from jittering while it counts down.
 * ------------------------------------------------------------------------- */

export const searchInputVariants = cva('group/search-input grid w-full min-w-0 gap-2 font-sans');

/* Phosphor 2.1.1 `magnifying-glass` regular and bold (preview `ph-search`, `ph-search-bold`). */
function SearchGlyph({ bold }: { bold: boolean }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      {bold ? (
        <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
      ) : (
        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
      )}
    </svg>
  );
}

/* Phosphor 2.1.1 `x` bold (preview `ph-close-bold`). */
function ClearGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

const isShown = (node: React.ReactNode) => node != null && node !== false && node !== '';

/** String union, so a Storyblok option value can be passed straight in. */
export type SearchInputSize = InputSize;

export type SearchInputProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue'
> & {
  /** The query (controlled). */
  value?: string;
  /**
   * The initial query (uncontrolled).
   *
   * @default ''
   */
  defaultValue?: string;
  /** Called with the new query on typing, clearing and Escape. */
  onValueChange?: (value: string) => void;
  /** Called after the clear button or Escape empties the field. */
  onClear?: () => void;
  /**
   * Control height and type size: 32 / 40 / 48px. `sm` takes the bold 16px
   * magnifier, as the preview's toolbar filter does.
   *
   * @default 'md'
   */
  size?: SearchInputSize;
  /**
   * Results are being fetched: the dots loader replaces the clear button and
   * the status line reads `loadingText`.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * The status line while `loading`. `null` for none.
   *
   * @default 'Searching…'
   */
  loadingText?: React.ReactNode;
  /**
   * The live result count under the field ("27 of 412 students match").
   * Announced politely as it changes and linked by `aria-describedby`.
   */
  resultCount?: React.ReactNode;
  /**
   * Accessible name of the clear button.
   *
   * @default 'Clear search'
   */
  clearLabel?: string;
  /** Classes for the root (the field + status wrapper). */
  className?: string;
};

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    className,
    size = 'md',
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onClear,
    loading = false,
    loadingText = 'Searching…',
    resultCount,
    clearLabel = 'Clear search',
    disabled,
    readOnly,
    onChange,
    onKeyDown,
    'aria-describedby': describedByProp,
    ...props
  },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);
  const statusId = `${useId()}-status`;

  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'SearchInput',
  });
  const query = value ?? '';

  const status = loading ? loadingText : resultCount;
  const hasStatus = isShown(status);
  const describedBy = [describedByProp, hasStatus ? statusId : null].filter(Boolean).join(' ') || undefined;

  const canClear = query !== '' && !disabled && !readOnly && !loading;

  const clear = () => {
    setValue('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div
      data-slot="search-input"
      data-size={size}
      data-loading={loading ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn(searchInputVariants(), className)}
    >
      <div data-slot="search-input-group" className="relative flex w-full items-center">
        <span
          data-slot="search-input-icon"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute start-3 flex text-content-secondary',
            size === 'sm'
              ? "[&_svg:not([class*='size-'])]:size-icon-sm"
              : "[&_svg:not([class*='size-'])]:size-icon-md",
            disabled && 'text-content-disabled',
          )}
        >
          <SearchGlyph bold={size === 'sm'} />
        </span>
        <Input
          ref={ref}
          data-slot="search-input-field"
          type="search"
          size={size}
          value={query}
          disabled={disabled}
          readOnly={readOnly}
          aria-describedby={describedBy}
          aria-busy={loading || undefined}
          className={cn('ps-10', (canClear || loading) && 'pe-10')}
          onChange={(event) => {
            onChange?.(event);
            setValue(event.target.value);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented) return;
            if (event.key === 'Escape' && canClear) {
              event.preventDefault();
              clear();
            }
          }}
          {...props}
        />
        {canClear || loading ? (
          <span data-slot="search-input-trailing" className="absolute end-2 flex items-center gap-1">
            {loading ? (
              <Spinner size="sm" label={null} className="me-2 text-content-secondary" />
            ) : (
              <IconButton
                data-slot="search-input-clear"
                variant="neutral"
                size="sm"
                aria-label={clearLabel}
                // Inside a 32px field a 32px button would sit on the border.
                className={size === 'sm' ? 'size-6 min-w-6' : undefined}
                onClick={clear}
              >
                <ClearGlyph />
              </IconButton>
            )}
          </span>
        ) : null}
      </div>
      {/* Always in the document: a live region that mounts WITH its text is
          often not announced. Empty, it is visually hidden and takes no gap. */}
      <p
        id={statusId}
        role="status"
        data-slot="search-input-status"
        className={cn('m-0 text-sm text-content-secondary tabular-nums', !hasStatus && 'sr-only')}
      >
        {hasStatus ? status : null}
      </p>
    </div>
  );
});
SearchInput.displayName = 'SearchInput';
