'use client';

// Client: keeps the current page (controlled or not) and attaches click handlers.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Pagination
 *
 * Numbered movement through a result set whose size is KNOWN: prev / next,
 * page numbers, and an ellipsis where a run of pages is elided. Use it where
 * people return to a specific page (a marked list, a roster). Do NOT use it
 * for a feed — that is "Load more" or infinite scroll.
 *
 *   <Pagination count={42} page={page} onPageChange={setPage} aria-label="Submissions pages" />
 *   <Pagination count={42} defaultPage={1} hrefTemplate="?page={page}" />      // links, RSC-safe
 *   <Pagination count={42} variant="compact" />                                // prev · Page 3 of 42 · next
 *
 * THE RAIL KEEPS ITS WIDTH. `paginationRange` (exported, so DataTable and
 * anything else paging a list draws the same rail) always returns the same
 * number of slots once the count exceeds them: 1 2 3 4 5 … 42, 1 … 17 18 19 …
 * 128, 1 … 38 39 40 41 42. Together with tabular figures, the row does not
 * twitch as you page.
 *
 * Buttons or links. With `hrefTemplate` (a string, so it crosses from a Server
 * Component) or `getHref` every page is an `<a>`; `linkAs` swaps the anchor
 * for your router's link (`next/link`) — the package never imports `next/*`.
 * `onPageChange` fires either way.
 *
 * Prev / next at an end are `aria-disabled`, not `disabled`: a keyboard user
 * who pages back to page 1 keeps focus on "Previous page" instead of being
 * dropped on <body>. Each number carries a full name ("Page 18, current
 * page") because "18" alone is not a destination.
 * ------------------------------------------------------------------------- */

/** `default` numbered rail · `compact` prev / "Page 3 of 42" / next, for narrow columns. */
export type PaginationVariant = 'default' | 'compact';

/** One slot of the rail: a page number, or an elided run. */
export type PaginationRangeItem = number | 'start-ellipsis' | 'end-ellipsis';

const span = (start: number, end: number) =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/**
 * The slots of a pagination rail: `boundaryCount` pages at each end,
 * `siblingCount` either side of `page`, ellipses between. The slot count is
 * constant (`2 × boundary + 2 × sibling + 3`) once `count` exceeds it, so the
 * rail keeps its width as you page.
 */
export function paginationRange(
  page: number,
  count: number,
  siblingCount = 1,
  boundaryCount = 1,
): PaginationRangeItem[] {
  const total = Math.max(1, Math.floor(count));
  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const sib = Math.max(0, Math.floor(siblingCount));
  const bnd = Math.max(0, Math.floor(boundaryCount));

  const startPages = span(1, Math.min(bnd, total));
  const endPages = span(Math.max(total - bnd + 1, bnd + 1), total);

  const siblingsStart = Math.max(Math.min(current - sib, total - bnd - sib * 2 - 1), bnd + 2);
  const siblingsEnd = Math.min(
    Math.max(current + sib, bnd + sib * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : total - 1,
  );

  const items: PaginationRangeItem[] = [...startPages];
  if (siblingsStart > bnd + 2) items.push('start-ellipsis');
  else if (bnd + 1 < total - bnd) items.push(bnd + 1);
  items.push(...span(siblingsStart, siblingsEnd));
  if (siblingsEnd < total - bnd - 1) items.push('end-ellipsis');
  else if (total - bnd > bnd) items.push(total - bnd);
  items.push(...endPages);

  // De-duplicate and keep in range (tiny counts can produce overlaps).
  const seen = new Set<PaginationRangeItem>();
  return items.filter((item) => {
    if (typeof item === 'number' && (item < 1 || item > total)) return false;
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

export const paginationItemVariants = cva([
  'inline-flex h-control-sm min-w-control-sm shrink-0 items-center justify-center px-2',
  'rounded-sm border border-transparent bg-transparent',
  'font-sans text-sm leading-none text-content-secondary tabular-nums no-underline',
  'cursor-pointer select-none outline-none',
  'transition-colors duration-(--motion-duration-instant) ease-productive-in-out motion-reduce:transition-none',
  'not-aria-disabled:not-aria-[current=page]:hover:bg-surface-hover not-aria-disabled:not-aria-[current=page]:hover:text-content',
  // The current page: the primary fill, and it stays filled under the pointer.
  'aria-[current=page]:bg-action-primary aria-[current=page]:text-action-primary-fg',
  'aria-[current=page]:hover:bg-action-primary-hover',
  'focus-visible:border-border-focus focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  'aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
]);

/** Phosphor 2.1.1 `caret-left` bold, the HTML's `#ph-chevron-left-bold`. */
function ChevronLeft() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z" />
    </svg>
  );
}

/** Phosphor 2.1.1 `caret-right` bold, the HTML's `#ph-chevron-right-bold`. */
function ChevronRight() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z" />
    </svg>
  );
}

const fill = (template: string, page: number, count: number) =>
  template.replace(/\{page\}/g, String(page)).replace(/\{count\}/g, String(count));

export type PaginationProps = Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> & {
  /**
   * Total number of pages (not items). Below 1 is treated as 1.
   *
   * @default 1
   */
  count?: number;
  /** The current page, 1-based (controlled). Pair it with `onPageChange`. */
  page?: number;
  /**
   * The page shown first when uncontrolled.
   *
   * @default 1
   */
  defaultPage?: number;
  /** Called with the new page when prev, next or a number is activated (links too). */
  onPageChange?: (page: number) => void;
  /**
   * `default` the numbered rail · `compact` prev / "Page 3 of 42" / next, for a
   * drawer, a card or a mobile roster.
   *
   * @default 'default'
   */
  variant?: PaginationVariant;
  /**
   * Pages shown either side of the current one.
   *
   * @default 1
   */
  siblingCount?: number;
  /**
   * Pages always shown at each end.
   *
   * @default 1
   */
  boundaryCount?: number;
  /**
   * Render every page as a link: `{page}` is replaced with the page number
   * (`"/submissions?page={page}"`). A string, so it can be set from a Server
   * Component or a CMS.
   */
  hrefTemplate?: string;
  /** Render every page as a link to `getHref(page)`. Client-side alternative to `hrefTemplate`. */
  getHref?: (page: number) => string;
  /**
   * The link component used with `hrefTemplate` / `getHref`, e.g. `next/link`.
   * It receives `href`, `aria-*`, `className` and `children`, and must forward
   * them to an `<a>`.
   *
   * @default 'a'
   */
  linkAs?: React.ElementType;
  /**
   * Disables every control (while the next page loads, say).
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Names the navigation landmark. Name it for what is paged
   * ("Submissions pages") when there is more than one on a page.
   *
   * @default 'Pagination'
   */
  'aria-label'?: string;
  /**
   * Accessible name of the previous-page control.
   *
   * @default 'Previous page'
   */
  previousLabel?: string;
  /**
   * Accessible name of the next-page control.
   *
   * @default 'Next page'
   */
  nextLabel?: string;
  /**
   * Accessible name of a page number; `{page}` is replaced.
   *
   * @default 'Page {page}'
   */
  pageLabel?: string;
  /**
   * Accessible name of the current page number; `{page}` is replaced.
   *
   * @default 'Page {page}, current page'
   */
  currentPageLabel?: string;
  /**
   * The compact readout; `{page}` and `{count}` are replaced.
   *
   * @default 'Page {page} of {count}'
   */
  readoutLabel?: string;
};

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    className,
    count = 1,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    variant = 'default',
    siblingCount = 1,
    boundaryCount = 1,
    hrefTemplate,
    getHref,
    linkAs,
    disabled = false,
    'aria-label': ariaLabel = 'Pagination',
    previousLabel = 'Previous page',
    nextLabel = 'Next page',
    pageLabel = 'Page {page}',
    currentPageLabel = 'Page {page}, current page',
    readoutLabel = 'Page {page} of {count}',
    ...props
  },
  ref,
) {
  const total = Math.max(1, Math.floor(count) || 1);
  const [pageState, setPage] = useControllableState<number>({
    prop: pageProp,
    defaultProp: defaultPage,
    onChange: onPageChange,
    caller: 'Pagination',
  });
  const current = Math.min(Math.max(1, Math.floor(pageState ?? 1) || 1), total);

  const hrefFor =
    getHref ?? (hrefTemplate != null ? (p: number) => fill(hrefTemplate, p, total) : undefined);
  const LinkComp: React.ElementType = linkAs ?? 'a';

  const control = (
    target: number,
    { label, isDisabled, current: isCurrent, content, slot }: {
      label: string;
      isDisabled: boolean;
      current?: boolean;
      content: React.ReactNode;
      slot: string;
    },
  ) => {
    const off = disabled || isDisabled;
    const shared = {
      'data-slot': slot,
      'aria-label': label,
      'aria-current': isCurrent ? ('page' as const) : undefined,
      'aria-disabled': off ? true : undefined,
      className: paginationItemVariants(),
      onClick: (event: React.MouseEvent) => {
        if (off) {
          event.preventDefault();
          return;
        }
        if (target !== current) setPage(target);
      },
    };
    if (hrefFor) {
      // A disabled link has no href: that is what stops navigation.
      return React.createElement(
        off ? 'a' : LinkComp,
        { ...shared, href: off ? undefined : hrefFor(target), role: off ? 'link' : undefined },
        content,
      );
    }
    return (
      <button type="button" {...shared}>
        {content}
      </button>
    );
  };

  const prev = control(current - 1, {
    label: previousLabel,
    isDisabled: current <= 1,
    content: <ChevronLeft />,
    slot: 'pagination-previous',
  });
  const next = control(current + 1, {
    label: nextLabel,
    isDisabled: current >= total,
    content: <ChevronRight />,
    slot: 'pagination-next',
  });

  let middle: React.ReactNode;
  if (variant === 'compact') {
    middle = (
      <li data-slot="pagination-item">
        <span
          data-slot="pagination-readout"
          aria-live="polite"
          className="px-1 font-sans text-sm text-content-secondary tabular-nums"
        >
          {fill(readoutLabel, current, total)}
        </span>
      </li>
    );
  } else {
    middle = paginationRange(current, total, siblingCount, boundaryCount).map((item) =>
      typeof item === 'number' ? (
        <li key={`page-${item}`} data-slot="pagination-item">
          {control(item, {
            label: fill(item === current ? currentPageLabel : pageLabel, item, total),
            isDisabled: false,
            current: item === current,
            content: item,
            slot: 'pagination-page',
          })}
        </li>
      ) : (
        <li key={item} data-slot="pagination-ellipsis" aria-hidden="true">
          <span className="inline-flex min-w-4 justify-center font-sans text-sm text-content-secondary">…</span>
        </li>
      ),
    );
  }

  return (
    <nav
      ref={ref}
      data-slot="pagination"
      data-variant={variant}
      data-disabled={disabled || undefined}
      aria-label={ariaLabel}
      className={cn('min-w-0', className)}
      {...props}
    >
      <ul
        data-slot="pagination-list"
        className={cn(
          'm-0 flex list-none flex-wrap items-center p-0',
          variant === 'compact' ? 'gap-2' : 'gap-1',
        )}
      >
        <li data-slot="pagination-item">{prev}</li>
        {middle}
        <li data-slot="pagination-item">{next}</li>
      </ul>
    </nav>
  );
});
Pagination.displayName = 'Pagination';
