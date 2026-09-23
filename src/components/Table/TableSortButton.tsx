'use client';

// Client: attaches the click handler that asks for the next sort direction.
import * as React from 'react';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * TableSortButton
 *
 * The real `<button>` inside a sortable `TableHead` (the HTML's
 * `.th-sort__btn`). It fills the header cell, inherits the on-brand ink of the
 * header band, and draws the caret from the direction it is given — the caret
 * is state, never a hand-placed icon. The `<th>` around it carries `aria-sort`;
 * the button itself only says what the column is.
 *
 * Split from Table.tsx so every other table part stays a server component.
 * ------------------------------------------------------------------------- */

/** `aria-sort` values a sortable column can be in. */
export type TableSortDirection = 'none' | 'ascending' | 'descending';

/** Inline glyphs, in the HTML's arrow shapes (↕ ↑ ↓), 12px. */
function SortGlyph({ direction }: { direction: TableSortDirection }) {
  const common = {
    viewBox: '0 0 12 12',
    'aria-hidden': true as const,
    focusable: 'false' as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'data-slot': 'table-sort-icon',
    'data-direction': direction,
    className: cn('ms-auto size-3 shrink-0', direction === 'none' && 'opacity-45'),
  };
  if (direction === 'ascending') {
    return (
      <svg {...common}>
        <path d="M6 10.5V1.5M2.5 5 6 1.5 9.5 5" />
      </svg>
    );
  }
  if (direction === 'descending') {
    return (
      <svg {...common}>
        <path d="M6 1.5v9M2.5 7 6 10.5 9.5 7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 10.5v-9M1.5 4 4 1.5 6.5 4M8 1.5v9M5.5 8 8 10.5 10.5 8" />
    </svg>
  );
}

export type TableSortButtonProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'onClick'> & {
  /**
   * The column's current direction; draws the caret.
   *
   * @default 'none'
   */
  direction?: TableSortDirection;
  /**
   * Called with the direction a click asks for: `ascending` from `none` or
   * `descending`, `descending` from `ascending` (the HTML's cycle).
   */
  onSortChange?: (next: Exclude<TableSortDirection, 'none'>) => void;
  /** Called on click, before `onSortChange`. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export const TableSortButton = React.forwardRef<HTMLButtonElement, TableSortButtonProps>(
  function TableSortButton({ className, direction = 'none', onSortChange, onClick, children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        data-slot="table-sort-button"
        data-direction={direction}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent text-left',
          'px-4 py-3 group-data-[density=compact]/table:px-3 group-data-[density=compact]/table:py-2',
          'font-sans text-sm font-semibold text-content-on-brand-solid',
          'outline-none transition-colors duration-(--motion-duration-instant) ease-productive-in-out motion-reduce:transition-none',
          'hover:bg-action-primary-hover',
          // On the brand band the system ring would vanish: an inset on-brand outline instead.
          'focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-4 focus-visible:outline-content-on-brand-solid',
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          onSortChange?.(direction === 'ascending' ? 'descending' : 'ascending');
        }}
        {...props}
      >
        <span data-slot="table-sort-label">{children}</span>
        <SortGlyph direction={direction} />
      </button>
    );
  },
);
TableSortButton.displayName = 'TableSortButton';
