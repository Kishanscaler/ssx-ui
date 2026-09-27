import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

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
 * A plain row is not itself a target: the trailing action is, so a row never
 * nests one control inside another. Loading and empty rows are a Skeleton and
 * an EmptyState inside a `ListItem`.
 *
 * A row that IS one target (a conversation in the history, "Open chat") puts
 * a `ListItemLink` (`<a>`, or your router link with `asChild`) or a
 * `ListItemButton` (`<button>`) inside the `ListItem`, holding the row's
 * parts. That element is the ONE interactive element in the row: the whole
 * row is its hit area, hover and press fill the row, the focus ring is drawn
 * inside the row's edge, and `current` marks the open conversation
 * (`aria-current`, the selected look). Nothing interactive goes inside it
 * (the ClickableCard rule: a link in a link, a button in a button). A row
 * action that is not the row's own ("More actions for this chat") is a
 * `ListItemTrailing` placed AFTER the link, as its sibling:
 *
 *   <ListItem>
 *     <ListItemLink href="/chat/rotated-array" current>
 *       <ListItemContent>
 *         <ListItemTitle>Binary search on a rotated array</ListItemTitle>
 *         <ListItemDescription>Yesterday · 14 messages</ListItemDescription>
 *       </ListItemContent>
 *       <ListItemTrailing><Badge>Assignment 3</Badge></ListItemTrailing>   // static only
 *     </ListItemLink>
 *     <ListItemTrailing>                                                    // a separate target
 *       <IconButton variant="tertiary" size="sm" aria-label="More actions for this chat">…</IconButton>
 *     </ListItemTrailing>
 *   </ListItem>
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
        // A row holding a ListItemLink / ListItemButton: the target carries
        // the padding (so the whole row is its hit area) and a separate
        // trailing action keeps the row's end inset. The row still draws the
        // fills, so a hover over the trailing action lights the whole row.
        // None of these match a plain row. (Literal strings: Tailwind only
        // generates classes it can read in the source.)
        'has-[>[data-list-item-target]]:gap-x-0 has-[>[data-list-item-target]]:p-0 has-[>[data-list-item-target]]:flex-nowrap',
        'has-[>[data-list-item-target]]:[&>[data-slot=list-item-trailing]]:pe-3',
        'has-[>[data-list-item-target]:not(:disabled):not([aria-disabled=true]):active]:bg-surface-active',
        'has-[>[data-list-item-target][data-current]]:bg-surface-brand-subtle has-[>[data-list-item-target][data-current]]:hover:bg-surface-active',
        'has-[>[data-list-item-target]:is(:disabled,[aria-disabled=true])]:hover:bg-transparent',
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
        className={cn('min-w-0 flex-1 basis-[10rem] [overflow-wrap:anywhere]', className)}
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
        className={cn('m-0 type-body-sm text-content-secondary', className)}
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

/* ---- Interactive rows ------------------------------------------------------- */

/**
 * The row's one target: it lays the row's parts out exactly as a plain
 * ListItem does, and takes the whole row's width and padding as its hit area.
 * The focus ring is inset, because the List frame clips its rows.
 */
export const listItemTargetClass = cn(
  'flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 self-stretch px-4 py-3',
  // Resets for <button> (UA font, padding, background, alignment) and <a> (underline, colour).
  'm-0 cursor-pointer border-0 bg-transparent text-start no-underline text-inherit',
  '[font:inherit] [letter-spacing:inherit]',
  'outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-border-focus/50',
  // The open conversation: the selected row's ink and weight (the row draws the fill).
  'data-[current]:font-semibold data-[current]:text-content-brand',
  'disabled:cursor-not-allowed disabled:text-content-disabled',
  'aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled',
);

/** What `aria-current` says: `true` means the row is the current PAGE for a link, the current item for a button. */
export type ListItemCurrent = boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true';

function currentAttr(current: ListItemCurrent | undefined, fallback: 'page' | 'true') {
  if (current === undefined || current === false) return undefined;
  return current === true ? fallback : current;
}

export type ListItemLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  /**
   * This row is the one open now (the conversation on screen): the selected
   * look and `aria-current` (`true` is `"page"`; pass another token when the
   * list is not navigation between pages).
   *
   * @default false
   */
  current?: ListItemCurrent;
  /**
   * Render as the child link (`next/link`, a router link), keeping every
   * style and attribute: `<ListItemLink asChild><NextLink href="/chat/42">…</NextLink></ListItemLink>`.
   * Put the row's parts inside your link.
   *
   * @default false
   */
  asChild?: boolean;
};

/**
 * A whole list row as ONE link. Goes inside a `ListItem` and holds the row's
 * Leading / Content / Trailing parts. Nothing interactive inside it.
 */
export const ListItemLink = React.forwardRef<HTMLAnchorElement, ListItemLinkProps>(function ListItemLink(
  { className, current, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'a';
  const aria = currentAttr(current, 'page');
  return (
    <Comp
      ref={ref}
      data-slot="list-item-link"
      data-list-item-target=""
      data-current={aria ? '' : undefined}
      aria-current={aria}
      className={cn(listItemTargetClass, className)}
      {...props}
    />
  );
});
ListItemLink.displayName = 'ListItemLink';

export type ListItemButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * This row is the one chosen now: the selected look and `aria-current`
   * (`true` is `"true"`).
   *
   * @default false
   */
  current?: ListItemCurrent;
  /**
   * Render as the child element, keeping every style.
   *
   * @default false
   */
  asChild?: boolean;
};

/**
 * A whole list row as ONE button, for an in-page action ("Open chat" in a
 * panel, "Start a new chat about Assignment 3"). Goes inside a `ListItem`.
 * `type="button"` unless you say otherwise. Nothing interactive inside it.
 */
export const ListItemButton = React.forwardRef<HTMLButtonElement, ListItemButtonProps>(function ListItemButton(
  { className, current, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  const aria = currentAttr(current, 'true');
  return (
    <Comp
      ref={ref}
      data-slot="list-item-button"
      data-list-item-target=""
      data-current={aria ? '' : undefined}
      aria-current={aria}
      type={asChild ? type : (type ?? 'button')}
      className={cn(listItemTargetClass, className)}
      {...props}
    />
  );
});
ListItemButton.displayName = 'ListItemButton';
