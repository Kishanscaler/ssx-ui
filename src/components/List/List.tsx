import * as React from 'react';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * List, ListItem, ListItemLeading, ListItemContent, ListItemTitle,
 * ListItemDescription, ListItemTrailing
 *
 * A vertical stack of records, each with an identity (an Avatar or an icon),
 * a title and a supporting line, and a trailing status and action. Use it
 * where a table's columns would be mostly empty. Do NOT use it when people
 * compare values across rows — that is a Table.
 *
 *   <List aria-label="Week 6 submissions">
 *     <ListItem selected>
 *       <ListItemLeading><Avatar><AvatarFallback>MI</AvatarFallback></Avatar></ListItemLeading>
 *       <ListItemContent>
 *         <ListItemTitle meta="SST-2029-0733">Meher Iyengar</ListItemTitle>
 *         <ListItemDescription>Submitted 4 Mar 2026, 09:07 PM</ListItemDescription>
 *       </ListItemContent>
 *       <ListItemTrailing>
 *         <Badge tone="warning">In review</Badge>
 *         <Button size="sm" variant="secondary">Review</Button>
 *       </ListItemTrailing>
 *     </ListItem>
 *   </List>
 *
 * `<ul>` by default; `as="ol"` when the order means something (a rank, a
 * queue). A selected row is `aria-current` and the brand-subtle fill, which
 * stays under the pointer (it goes one step deeper instead of un-highlighting).
 * Rows are not themselves buttons: the trailing action is the target, so a row
 * never nests one control inside another. Loading and empty rows are a
 * Skeleton and an EmptyState inside a `ListItem`.
 *
 * Narrow rows (responsive audit L1): the content keeps at least 160px; when
 * the trailing status and action no longer fit beside it they wrap onto a
 * line of their own, held to the trailing edge, instead of squeezing the
 * title to a few characters. Long words and ids break rather than overflow.
 *
 * Server component: no hooks, no handlers. Menus opened from a row portal, so
 * the rounded frame can keep clipping its row fills.
 * ------------------------------------------------------------------------- */

/** The list element: `ul` unordered · `ol` when the order carries meaning. */
export type ListElement = 'ul' | 'ol';

export type ListProps = React.HTMLAttributes<HTMLUListElement> & {
  /**
   * `ul` for a set, `ol` when the order carries meaning.
   *
   * @default 'ul'
   */
  as?: ListElement;
};

export const List = React.forwardRef<HTMLUListElement, ListProps>(function List(
  { className, as = 'ul', ...props },
  ref,
) {
  const Comp = as === 'ol' ? 'ol' : 'ul';
  return (
    <Comp
      ref={ref as React.Ref<HTMLUListElement & HTMLOListElement>}
      data-slot="list"
      className={cn(
        'm-0 list-none overflow-hidden p-0',
        'rounded-lg border border-border-decorative bg-surface font-sans text-base leading-body text-content',
        className,
      )}
      {...props}
    />
  );
});
List.displayName = 'List';

export type ListItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  /**
   * The chosen record (the one open in the panel beside it): `aria-current`,
   * the brand-subtle fill and brand ink.
   *
   * @default false
   */
  selected?: boolean;
};

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { className, selected = false, ...props },
  ref,
) {
  return (
    <li
      ref={ref}
      data-slot="list-item"
      data-state={selected ? 'selected' : undefined}
      aria-current={selected ? true : undefined}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3',
        '[&+&]:border-t [&+&]:border-border-decorative',
        'transition-colors duration-(--motion-duration-instant) ease-productive-in-out motion-reduce:transition-none',
        'hover:bg-surface-hover',
        'data-[state=selected]:bg-surface-brand-subtle data-[state=selected]:font-semibold data-[state=selected]:text-content-brand',
        'data-[state=selected]:hover:bg-surface-active',
        className,
      )}
      {...props}
    />
  );
});
ListItem.displayName = 'ListItem';

export type ListItemLeadingProps = React.HTMLAttributes<HTMLSpanElement>;

/** The row's identity: an Avatar, or a 20px icon in secondary ink. */
export const ListItemLeading = React.forwardRef<HTMLSpanElement, ListItemLeadingProps>(
  function ListItemLeading({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-slot="list-item-leading"
        className={cn(
          'flex shrink-0 items-center text-content-secondary',
          "[&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-icon-md",
          className,
        )}
        {...props}
      />
    );
  },
);
ListItemLeading.displayName = 'ListItemLeading';

export type ListItemContentProps = React.HTMLAttributes<HTMLDivElement>;

/** Title and description; takes the free width (160px at least) and lets long text wrap. */
export const ListItemContent = React.forwardRef<HTMLDivElement, ListItemContentProps>(
  function ListItemContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="list-item-content"
        className={cn('min-w-0 flex-1 basis-[160px] [overflow-wrap:anywhere]', className)}
        {...props}
      />
    );
  },
);
ListItemContent.displayName = 'ListItemContent';

export type ListItemTitleProps = React.HTMLAttributes<HTMLParagraphElement> & {
  /**
   * A secondary identifier after the title, in small secondary ink:
   * "Aarav Krishnan · SST-2029-0416".
   */
  meta?: React.ReactNode;
};

export const ListItemTitle = React.forwardRef<HTMLParagraphElement, ListItemTitleProps>(
  function ListItemTitle({ className, meta, children, ...props }, ref) {
    return (
      <p ref={ref} data-slot="list-item-title" className={cn('m-0 text-content', className)} {...props}>
        {children}
        {meta != null && meta !== false && meta !== '' ? (
          <span data-slot="list-item-meta" className="text-sm text-content-secondary">
            {' · '}
            {meta}
          </span>
        ) : null}
      </p>
    );
  },
);
ListItemTitle.displayName = 'ListItemTitle';

export type ListItemDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const ListItemDescription = React.forwardRef<HTMLParagraphElement, ListItemDescriptionProps>(
  function ListItemDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        data-slot="list-item-description"
        className={cn('m-0 text-sm text-content-secondary', className)}
        {...props}
      />
    );
  },
);
ListItemDescription.displayName = 'ListItemDescription';

export type ListItemTrailingProps = React.HTMLAttributes<HTMLDivElement>;

/** Status and the one action, on the trailing edge; on a narrow row, on a line of their own. */
export const ListItemTrailing = React.forwardRef<HTMLDivElement, ListItemTrailingProps>(
  function ListItemTrailing({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="list-item-trailing"
        className={cn('ms-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2', className)}
        {...props}
      />
    );
  },
);
ListItemTrailing.displayName = 'ListItemTrailing';
