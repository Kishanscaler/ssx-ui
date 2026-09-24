import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../lib/cn';
import { Badge, type BadgeTone } from '../Badge';
import { SideNavCollapsibleGroup } from './SideNavCollapsibleGroup';
import { SideNavItemTip, SideNavRail } from './SideNavRail';
import { sideNavGroupLabelClass, sideNavItemVariants, sideNavVariants } from './sideNavStyles';

export { sideNavVariants, sideNavItemVariants };

/* ---------------------------------------------------------------------------
 * SideNav, SideNavGroup, SideNavItem
 *
 * The vertical rail of destinations inside an app shell, grouped by area:
 * the student LMS ("Learn", "Community"), the admissions ops console
 * ("Pipeline", "Cohorts", "Account"). One item is the page you are on
 * (`aria-current="page"`, the solid brand fill); an item can carry a count
 * badge ("Interview slots 18", "Assignments 3 due").
 *
 * Do NOT nest more than one level: a hierarchy deeper than a group of links is
 * a TreeList, not navigation. Page-level actions do not belong here either.
 *
 *   <SideNav aria-label="Admissions operations">
 *     <SideNavGroup label="Pipeline">
 *       <SideNavItem href="/overview"><House />Overview</SideNavItem>
 *       <SideNavItem href="/applicants" current><IdentificationCard weight="fill" />Applicants</SideNavItem>
 *       <SideNavItem asChild><NextLink href="/slots"><CalendarDots />Interview slots<Badge tone="brand">18</Badge></NextLink></SideNavItem>
 *     </SideNavGroup>
 *   </SideNav>
 *
 * Or flat, for a CMS blok: `<SideNav items={[{ label: 'Pipeline', items: [...] }, ...]} />`.
 *
 * A group can fold (`collapsible`): its label becomes a disclosure button
 * (Radix Collapsible, the one client island here). The HTML's groups are plain
 * headings, so that is opt-in; a group holding the current page starts open.
 *
 * The rail itself can collapse to its glyphs (an icon rail): give the SideNav
 * `defaultCollapsed` (uncontrolled; `false` = starts open) or `collapsed` +
 * `onCollapsedChange` (controlled), and put a `SideNavCollapseTrigger` in it.
 * The width animates between `--sidenav-width` (13rem) and
 * `--sidenav-rail-width` (2.875rem); the labels fade (and stay in each link's
 * accessible name); group headings fade to a hairline; a count badge becomes
 * a dot on the glyph; each item shows its name in a Tooltip on hover and on
 * focus. Every item needs a glyph in this mode. A collapsible group is held
 * open while the rail is collapsed (its heading is hidden), and gets its own
 * state back when the rail opens. Under reduced motion it simply switches.
 *
 *   <SideNav aria-label="Student navigation" defaultCollapsed={false} items={…}>
 *     <SideNavCollapseTrigger />
 *   </SideNav>
 *
 * Server component: plain markup. The client islands are a collapsible group
 * and, with the collapsible rail, the rail's state (SideNavRail.tsx).
 * ------------------------------------------------------------------------- */

/* ---- Root ----------------------------------------------------------------- */

/** One link in the flat form. */
export interface SideNavItemData {
  /** The link text. */
  label: string;
  /** The destination. */
  href?: string;
  /** This is the page you are on. One per nav. */
  current?: boolean;
  /** A leading glyph (a Phosphor icon element), 20px. */
  icon?: React.ReactNode;
  /** The glyph while current (the `-fill` weight). Defaults to `icon`. */
  currentIcon?: React.ReactNode;
  /** A trailing count or status ("18", "3 due"), drawn as a Badge. */
  badge?: React.ReactNode;
  /**
   * The badge's tone.
   *
   * @default 'default'
   */
  badgeTone?: BadgeTone;
  /** Not available right now ("needs Dean approval"): not a link, not focusable. */
  disabled?: boolean;
}

/** One group in the flat form: a heading over its links. */
export interface SideNavGroupData {
  /** The group heading ("Pipeline"). */
  label: string;
  /** The group's links. */
  items: SideNavItemData[];
  /** The heading folds the group. */
  collapsible?: boolean;
  /** Start open (collapsible). Defaults to open. */
  defaultOpen?: boolean;
}

/** An entry of the flat `items`: a link, or a group of links. */
export type SideNavEntry = SideNavItemData | SideNavGroupData;

const isGroup = (entry: SideNavEntry): entry is SideNavGroupData =>
  Array.isArray((entry as SideNavGroupData).items);

export type SideNavProps = Omit<React.HTMLAttributes<HTMLElement>, 'aria-label'> & {
  /**
   * The navigation landmark's name ("Admissions operations", "Student
   * navigation"). A page with a TopNav has two navs, and they need two names.
   *
   * @default 'Primary'
   */
  'aria-label'?: string;
  /**
   * Flat form: links and groups, in order. Rendered before any `children`.
   */
  items?: SideNavEntry[];
  /**
   * The rail is collapsed to its glyphs (controlled). Giving this,
   * `defaultCollapsed` or `onCollapsedChange` makes the rail collapsible; add
   * a `SideNavCollapseTrigger` to let people fold it.
   */
  collapsed?: boolean;
  /**
   * Start collapsed (uncontrolled). Pass `false` for a collapsible rail that
   * starts open. Leave all three collapse props out for a fixed rail.
   */
  defaultCollapsed?: boolean;
  /** Called with the new collapsed state (from `SideNavCollapseTrigger`). */
  onCollapsedChange?: (collapsed: boolean) => void;
};

function renderItem(item: SideNavItemData, key: React.Key) {
  const glyph = item.current && item.currentIcon != null ? item.currentIcon : item.icon;
  return (
    <SideNavItem key={key} href={item.href} current={item.current} disabled={item.disabled}>
      {glyph}
      {item.label}
      {item.badge != null && item.badge !== '' ? (
        <Badge tone={item.badgeTone ?? 'default'}>{item.badge}</Badge>
      ) : null}
    </SideNavItem>
  );
}

/**
 * The rail, a `<nav>` landmark. Compound: `SideNavGroup` and `SideNavItem`.
 * Flat: `items`.
 */
export const SideNav = React.forwardRef<HTMLElement, SideNavProps>(function SideNav(
  {
    className,
    'aria-label': ariaLabel = 'Primary',
    items,
    collapsed,
    defaultCollapsed,
    onCollapsedChange,
    children,
    ...props
  },
  ref,
) {
  const rail = collapsed !== undefined || defaultCollapsed !== undefined || onCollapsedChange !== undefined;
  const content = (
    <>
      {items?.map((entry, i) =>
        isGroup(entry) ? (
          <SideNavGroup
            key={i}
            label={entry.label}
            collapsible={entry.collapsible}
            defaultOpen={entry.defaultOpen ?? (entry.collapsible ? true : undefined)}
          >
            {entry.items.map((item, j) => renderItem(item, j))}
          </SideNavGroup>
        ) : (
          renderItem(entry, i)
        ),
      )}
      {children}
    </>
  );
  if (rail) {
    return (
      <SideNavRail
        ref={ref}
        aria-label={ariaLabel}
        collapsed={collapsed}
        defaultCollapsed={defaultCollapsed}
        // Not `onCollapsedChange`: an `on*` prop in this server module reads
        // as a host handler to check-directives. The island maps it back.
        collapsedChangeHandler={onCollapsedChange}
        className={cn(sideNavVariants({ rail: true }), className)}
        {...props}
      >
        {content}
      </SideNavRail>
    );
  }
  return (
    <nav ref={ref} data-slot="sidenav" aria-label={ariaLabel} className={cn(sideNavVariants(), className)} {...props}>
      {content}
    </nav>
  );
});
SideNav.displayName = 'SideNav';

/* ---- Group ---------------------------------------------------------------- */

export type SideNavGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** The heading ("Pipeline", "Cohorts"). Names the group for assistive tech. */
  label: React.ReactNode;
  /**
   * The heading folds the group: a disclosure button with a caret
   * (`aria-expanded`), the links shown or hidden under it.
   *
   * @default false
   */
  collapsible?: boolean;
  /**
   * With `collapsible`, start open (uncontrolled). Keep a group that holds the
   * current page open.
   *
   * @default true
   */
  defaultOpen?: boolean;
  /** With `collapsible`, open (controlled). */
  open?: boolean;
  /** With `collapsible`, called with the new open state. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * A heading over a run of `SideNavItem`s, a `role="group"` named by the
 * heading. Plain markup, unless `collapsible`.
 */
export const SideNavGroup = React.forwardRef<HTMLDivElement, SideNavGroupProps>(function SideNavGroup(
  { className, label, collapsible = false, defaultOpen = true, open, onOpenChange, children, id, ...props },
  ref,
) {
  if (collapsible) {
    return (
      <SideNavCollapsibleGroup
        ref={ref}
        id={id}
        label={label}
        defaultOpen={defaultOpen}
        open={open}
        // Not `onOpenChange`: an `on*` prop in this server module reads as a
        // host handler to check-directives. The island maps it back.
        openChangeHandler={onOpenChange}
        className={className}
        {...props}
      >
        {children}
      </SideNavCollapsibleGroup>
    );
  }
  // A string heading names the group directly (no id needed, so this stays
  // server markup); the visible copy is then hidden from the tree so it is
  // not read twice. Any other heading is named through an id.
  const named = typeof label === 'string';
  const labelId = !named && id ? `${id}-label` : undefined;
  return (
    <div
      ref={ref}
      id={id}
      role="group"
      data-slot="sidenav-group"
      aria-label={named ? label : undefined}
      aria-labelledby={labelId}
      className={cn('grid gap-0.5', className)}
      {...props}
    >
      <p data-slot="sidenav-group-label" id={labelId} aria-hidden={named ? true : undefined} className={sideNavGroupLabelClass}>
        {label}
      </p>
      {children}
    </div>
  );
});
SideNavGroup.displayName = 'SideNavGroup';

/* ---- Item ----------------------------------------------------------------- */

/** The plain text of a node (strings and numbers, at any depth). */
function textOf(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children);
  return '';
}

const isBadge = (node: React.ReactNode) =>
  React.isValidElement(node) &&
  (node.type === Badge || (node.props as Record<string, unknown>)['data-slot'] === 'badge');

/**
 * The collapsed rail's tooltip for an item: its text, then its count
 * ("Interview slots · 18").
 */
function tipOf(children: React.ReactNode): string {
  let label = '';
  let badge = '';
  React.Children.forEach(children, (child) => {
    if (isBadge(child)) badge += textOf(child);
    else label += textOf(child);
  });
  label = label.replace(/\s+/g, ' ').trim();
  badge = badge.trim();
  return badge && label ? `${label} · ${badge}` : label || badge;
}

/**
 * Bare text runs become one `<span data-slot="sidenav-item-label">` each, so
 * the collapsed rail can fade them (a text node takes no styles). Adjacent
 * strings (`Assignments {n}`) stay one run, as they were one anonymous flex
 * item before. Elements pass through untouched.
 */
function wrapText(children: React.ReactNode): React.ReactNode {
  const out: React.ReactNode[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length) {
      out.push(
        <span key={`label-${out.length}`} data-slot="sidenav-item-label">
          {run.join('')}
        </span>,
      );
      run = [];
    }
  };
  React.Children.toArray(children).forEach((child) => {
    if (typeof child === 'string' || typeof child === 'number') run.push(String(child));
    else {
      flush();
      out.push(child);
    }
  });
  flush();
  return out;
}


export type SideNavItemProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** The destination. With `asChild`, put it on your link instead. */
  href?: string;
  /**
   * This item is the page you are on: `aria-current="page"`, drawn on the
   * solid brand fill. Exactly one per nav.
   *
   * @default false
   */
  current?: boolean;
  /**
   * Not available right now ("Scholarship review, needs Dean approval"):
   * rendered as a `<span aria-disabled="true">`, so it is neither a link nor
   * a tab stop. Say why in the label or next to it.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Render as the child element (e.g. `next/link`), keeping every style:
   * `<SideNavItem asChild current><NextLink href="/modules"><Books />Modules</NextLink></SideNavItem>`.
   *
   * @default false
   */
  asChild?: boolean;
  /**
   * The name shown in a tooltip beside a collapsed rail. Defaults to the
   * item's text and its badge ("Interview slots · 18").
   */
  tooltip?: React.ReactNode;
};

/**
 * One destination: a leading glyph (20px), the label, and optionally a
 * trailing `Badge` (pushed to the end). Glyph and badge are children.
 */
export const SideNavItem = React.forwardRef<HTMLAnchorElement, SideNavItemProps>(function SideNavItem(
  { className, current = false, disabled = false, asChild = false, href, tooltip, children, ...props },
  ref,
) {
  const shared = {
    'data-slot': 'sidenav-item',
    'data-current': current ? '' : undefined,
    className: cn(sideNavItemVariants(), className),
  };
  // Under asChild the text is the child link's; wrap it there.
  const child =
    asChild && React.isValidElement(children)
      ? (children as React.ReactElement<{ children?: React.ReactNode }>)
      : null;
  const inner = child ? child.props.children : children;
  const content = child ? React.cloneElement(child, undefined, wrapText(inner)) : wrapText(inner);
  const tip = tooltip ?? tipOf(inner);

  if (disabled && !asChild) {
    return (
      <SideNavItemTip label={tip}>
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          aria-disabled="true"
          {...shared}
          {...(props as React.HTMLAttributes<HTMLSpanElement>)}
        >
          {content}
        </span>
      </SideNavItemTip>
    );
  }
  const Comp = asChild ? Slot : 'a';
  return (
    <SideNavItemTip label={tip}>
      <Comp
        ref={ref}
        href={asChild ? undefined : href}
        aria-current={current ? 'page' : undefined}
        // A disabled child link (asChild) keeps its element but leaves the tab
        // order and the pointer.
        aria-disabled={disabled ? true : undefined}
        tabIndex={disabled ? -1 : undefined}
        {...shared}
        className={cn(shared.className, disabled && 'pointer-events-none')}
        {...props}
      >
        {content}
      </Comp>
    </SideNavItemTip>
  );
});
SideNavItem.displayName = 'SideNavItem';
