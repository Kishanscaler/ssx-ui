import * as React from 'react';

import { cn } from '../../lib/cn';
import { Button } from '../Button';
import { Link, type LinkProps } from '../Link';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../Menu';

/* ---------------------------------------------------------------------------
 * Breadcrumbs
 *
 * The path from the root of the product to where you are standing, with the
 * current page marked and unlinked. Use it where the hierarchy is real and
 * more than two deep. Do NOT use it to record how someone arrived — that is
 * history, not structure.
 *
 *   <Breadcrumbs items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Programmes', href: '/programmes' },
 *     { label: 'B.Sc CS & AI' },                    // the last item is the current page
 *   ]} />
 *
 *   <Breadcrumbs>
 *     <BreadcrumbsItem><BreadcrumbsLink asChild><NextLink href="/">Home</NextLink></BreadcrumbsLink></BreadcrumbsItem>
 *     <BreadcrumbsEllipsis items={[{ label: 'Programmes', href: '/programmes' }]} />
 *     <BreadcrumbsItem current>B.Sc CS &amp; AI</BreadcrumbsItem>
 *   </Breadcrumbs>
 *
 * A `<nav aria-label="Breadcrumb">` around an ordered list. The current page
 * is a plain `<li aria-current="page">`, never a link (a link to where you
 * already are is a dead control). Separators are `aria-hidden`, so the path
 * is not read out as "Home slash Programmes slash"; every item draws one
 * after itself and the last item's is hidden, so any composition is right.
 *
 * Collapse: with `maxItems`, a longer trail keeps `itemsBeforeCollapse` at
 * the start and `itemsAfterCollapse` at the end, and the middle goes into a
 * Menu behind a "…" button named for what it hides ("Show 3 hidden levels:
 * Programmes, B.Sc CS & AI, Year 2").
 *
 * Narrow containers (`autoCollapse`, on by default, flat form without
 * `maxItems`): below 480px of CONTAINER width (a container query, so a card
 * or a side panel counts, not only the phone) the same middle collapses into
 * the "…" menu by CSS alone, still server-rendered. Both states are in the
 * markup and one is `display: none`, so the hidden one is out of the
 * accessibility tree. The nav is the query container, which makes it fill the
 * width of its row (a container cannot size itself from its content).
 *
 * One line, always: the trail never wraps (a wrapped trail leaves a "/"
 * dangling at the end of a line). A crumb that does not fit shrinks and ends
 * in an ellipsis instead; the current page gives way first (it repeats the
 * page heading), the levels above it, the way back, last.
 *
 * Truncate: a crumb capped at 22ch with an ellipsis stays on one line instead
 * of wrapping the whole trail; its full text stays in the DOM (read in full)
 * and in a `title` (hover).
 *
 * Routing: `asChild` on `BreadcrumbsLink`, or `linkAs` for the flat form —
 * the package never imports `next/*`. Server component: no hooks, no
 * handlers (the collapsed Menu is a client component it renders).
 * ------------------------------------------------------------------------- */

/** One level of the trail, for the flat `items` form. */
export interface BreadcrumbsItemData {
  /** The level's name. */
  label: React.ReactNode;
  /** Destination. Ignored on the last item, which is the current page. */
  href?: string;
  /** Cap this crumb at 22ch with an ellipsis. */
  truncate?: boolean;
}

/** Plain text of a node, for a `title` or an accessible name. */
function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return '';
}

/* ---- Breadcrumbs ---------------------------------------------------------- */

export type BreadcrumbsProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * The trail as data, root first; the last item is the current page. With
   * `items`, `children` are ignored.
   */
  items?: BreadcrumbsItemData[];
  /**
   * Flat form: collapse the middle into a "…" menu when there are more items
   * than this, at every width. Unset: only `autoCollapse` collapses.
   */
  maxItems?: number;
  /**
   * Flat form without `maxItems`: collapse the middle into the "…" menu when
   * the container is narrower than 480px, and show the full trail when it is
   * wider (CSS container query; no JS). `false`: never collapse by width.
   *
   * @default true
   */
  autoCollapse?: boolean;
  /**
   * Flat form, collapsed: items kept before the "…".
   *
   * @default 1
   */
  itemsBeforeCollapse?: number;
  /**
   * Flat form, collapsed: items kept after the "…" (the current page included).
   *
   * @default 2
   */
  itemsAfterCollapse?: number;
  /**
   * Flat form: cap every crumb at 22ch with an ellipsis.
   *
   * @default false
   */
  truncate?: boolean;
  /**
   * Flat form: the link component (`next/link`). It receives `href` and
   * `children` and must render an `<a>`.
   *
   * @default 'a'
   */
  linkAs?: React.ElementType;
  /**
   * Names the navigation landmark.
   *
   * @default 'Breadcrumb'
   */
  'aria-label'?: string;
};

export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    className,
    items,
    maxItems,
    autoCollapse = true,
    itemsBeforeCollapse = 1,
    itemsAfterCollapse = 2,
    truncate = false,
    linkAs,
    'aria-label': ariaLabel = 'Breadcrumb',
    children,
    ...props
  },
  ref,
) {
  let content: React.ReactNode = children;
  if (items) {
    const last = items.length - 1;
    const renderItem = (item: BreadcrumbsItemData, index: number, className?: string) => {
      const current = index === last;
      const capped = item.truncate ?? truncate;
      if (current || item.href == null) {
        return (
          <BreadcrumbsItem key={index} current={current} truncate={capped} className={className}>
            {item.label}
          </BreadcrumbsItem>
        );
      }
      const link = React.createElement(linkAs ?? 'a', { href: item.href }, item.label);
      return (
        <BreadcrumbsItem key={index} truncate={capped} className={className}>
          <BreadcrumbsLink asChild>{link}</BreadcrumbsLink>
        </BreadcrumbsItem>
      );
    };

    const before = Math.max(0, Math.floor(itemsBeforeCollapse));
    const after = Math.max(1, Math.floor(itemsAfterCollapse));
    const collapse = maxItems != null && items.length > maxItems && before + after < items.length;
    const collapseByWidth = maxItems == null && autoCollapse && before + after < items.length;
    if (collapseByWidth) {
      // Both states in the markup; the container query shows one.
      const hidden = items.slice(before, items.length - after);
      content = [
        ...items.slice(0, before).map((item, i) => renderItem(item, i)),
        <BreadcrumbsEllipsis
          key="ellipsis"
          data-auto-collapse=""
          className="hidden @max-[480px]/breadcrumbs:flex"
          linkAs={linkAs}
          items={hidden.map((item) => ({ label: item.label, href: item.href }))}
        />,
        ...hidden.map((item, i) => renderItem(item, before + i, '@max-[480px]/breadcrumbs:hidden')),
        ...items.slice(items.length - after).map((item, i) => renderItem(item, items.length - after + i)),
      ];
    } else if (collapse) {
      const hidden = items.slice(before, items.length - after);
      content = [
        ...items.slice(0, before).map((item, i) => renderItem(item, i)),
        <BreadcrumbsEllipsis
          key="ellipsis"
          linkAs={linkAs}
          items={hidden.map((item) => ({ label: item.label, href: item.href }))}
        />,
        ...items.slice(items.length - after).map((item, i) => renderItem(item, items.length - after + i)),
      ];
    } else {
      content = items.map((item, i) => renderItem(item, i));
    }
  }

  return (
    <nav
      ref={ref}
      data-slot="breadcrumbs"
      aria-label={ariaLabel}
      className={cn('@container/breadcrumbs w-full min-w-0', className)}
      {...props}
    >
      <ol
        data-slot="breadcrumbs-list"
        className="m-0 flex list-none flex-nowrap items-center gap-2 p-0 font-sans text-sm text-content-secondary"
      >
        {content}
      </ol>
    </nav>
  );
});
Breadcrumbs.displayName = 'Breadcrumbs';

/* ---- BreadcrumbsItem ------------------------------------------------------ */

export type BreadcrumbsItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  /**
   * This is the page you are on: `aria-current="page"`, primary ink,
   * semibold. Its content is plain text, never a link.
   *
   * @default false
   */
  current?: boolean;
  /**
   * Cap the crumb at 22ch with an ellipsis. The full text stays readable
   * (it is still the element's text) and becomes the `title`.
   *
   * @default false
   */
  truncate?: boolean;
};

/** One level: a `BreadcrumbsLink`, or the current page's text. Draws its own trailing separator. */
export const BreadcrumbsItem = React.forwardRef<HTMLLIElement, BreadcrumbsItemProps>(function BreadcrumbsItem(
  { className, current = false, truncate = false, title, children, ...props },
  ref,
) {
  const full = truncate ? textOf(children) : '';
  return (
    <li
      ref={ref}
      data-slot="breadcrumbs-item"
      data-truncate={truncate || undefined}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'flex min-w-0 items-center gap-2',
        // Shrinks when the one-line trail does not fit. The current page gives
        // way first (it is also the page's heading; the levels above it are
        // the way back). Its shrink factor is so much larger that the levels
        // do not move at all, not even the fraction of a pixel that would
        // already turn "Home" into "Ho…", until it has reached its floor. In
        // a narrow container the current page keeps about four characters
        // and a level about two.
        current
          ? 'shrink-[10000] @max-[480px]/breadcrumbs:min-w-[5em]'
          : 'shrink @max-[480px]/breadcrumbs:min-w-[2.5em]',
        // Whatever the crumb is (a link, our text span), it ends in "…"
        // rather than pushing the trail wide. The link keeps its own focus
        // ring: truncating the link itself does not clip its ring.
        '[&>:not([data-slot=breadcrumbs-separator])]:min-w-0 [&>:not([data-slot=breadcrumbs-separator])]:truncate',
        current && 'font-semibold text-content',
        // The last item never shows its separator, whatever it holds.
        'last:[&>[data-slot=breadcrumbs-separator]]:hidden',
        className,
      )}
      {...props}
    >
      {truncate ? (
        <span
          data-slot="breadcrumbs-crumb"
          title={title ?? (full || undefined)}
          className="block max-w-[22ch] min-w-0 truncate"
        >
          {children}
        </span>
      ) : typeof children === 'string' || typeof children === 'number' ? (
        // Plain text (the current page) in a box, so it can end in "…".
        <span data-slot="breadcrumbs-crumb" className="min-w-0 truncate">
          {children}
        </span>
      ) : (
        children
      )}
      <BreadcrumbsSeparator />
    </li>
  );
});
BreadcrumbsItem.displayName = 'BreadcrumbsItem';

/* ---- BreadcrumbsLink ------------------------------------------------------ */

export type BreadcrumbsLinkProps = Omit<LinkProps, 'variant'>;

/**
 * A level you can go back to: the quiet `Link` (underlined on hover). Use
 * `asChild` for a router link: `<BreadcrumbsLink asChild><NextLink href="/">Home</NextLink></BreadcrumbsLink>`.
 */
export const BreadcrumbsLink = React.forwardRef<HTMLAnchorElement, BreadcrumbsLinkProps>(function BreadcrumbsLink(
  { className, ...props },
  ref,
) {
  return <Link ref={ref} variant="quiet" data-slot="breadcrumbs-link" className={className} {...props} />;
});
BreadcrumbsLink.displayName = 'BreadcrumbsLink';

/* ---- BreadcrumbsSeparator ------------------------------------------------- */

export type BreadcrumbsSeparatorProps = React.HTMLAttributes<HTMLSpanElement>;

/** The "/" between levels. `aria-hidden`; each item renders one, so you rarely place it yourself. */
export const BreadcrumbsSeparator = React.forwardRef<HTMLSpanElement, BreadcrumbsSeparatorProps>(
  function BreadcrumbsSeparator({ className, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        data-slot="breadcrumbs-separator"
        aria-hidden="true"
        className={cn('shrink-0 font-regular text-content-secondary', className)}
        {...props}
      >
        {children ?? '/'}
      </span>
    );
  },
);
BreadcrumbsSeparator.displayName = 'BreadcrumbsSeparator';

/* ---- BreadcrumbsEllipsis -------------------------------------------------- */

export type BreadcrumbsEllipsisProps = React.LiHTMLAttributes<HTMLLIElement> & {
  /** The levels hidden behind the "…", in order. Each opens as a menu row. */
  items: Array<Pick<BreadcrumbsItemData, 'label' | 'href'>>;
  /**
   * The "…" button's accessible name. Defaults to "Show 3 hidden levels:
   * Programmes, B.Sc CS & AI, Year 2".
   */
  label?: string;
  /**
   * The link component for the menu rows (`next/link`).
   *
   * @default 'a'
   */
  linkAs?: React.ElementType;
};

/**
 * The collapsed middle of a long trail: a tertiary "…" button that opens a
 * Menu of the hidden levels, each a link.
 */
export const BreadcrumbsEllipsis = React.forwardRef<HTMLLIElement, BreadcrumbsEllipsisProps>(
  function BreadcrumbsEllipsis({ className, items, label, linkAs, ...props }, ref) {
    const names = items.map((item) => textOf(item.label));
    const name =
      label ??
      `Show ${items.length} hidden ${items.length === 1 ? 'level' : 'levels'}${names.length ? `: ${names.join(', ')}` : ''}`;
    return (
      <li
        ref={ref}
        data-slot="breadcrumbs-ellipsis"
        className={cn(
          'flex shrink-0 items-center gap-2',
          'last:[&>[data-slot=breadcrumbs-separator]]:hidden',
          className,
        )}
        {...props}
      >
        <Menu>
          <MenuTrigger asChild>
            {/* 44px hit area on a touch screen; the button keeps its size. */}
            <Button variant="tertiary" size="sm" aria-label={name} className="touch-target">
              …
            </Button>
          </MenuTrigger>
          <MenuContent>
            {items.map((item, i) =>
              item.href != null ? (
                <MenuItem key={i} asChild>
                  {React.createElement(linkAs ?? 'a', { href: item.href }, item.label)}
                </MenuItem>
              ) : (
                <MenuItem key={i} disabled>
                  {item.label}
                </MenuItem>
              ),
            )}
          </MenuContent>
        </Menu>
        <BreadcrumbsSeparator />
      </li>
    );
  },
);
BreadcrumbsEllipsis.displayName = 'BreadcrumbsEllipsis';
