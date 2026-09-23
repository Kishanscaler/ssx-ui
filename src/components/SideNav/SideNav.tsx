import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Badge, type BadgeTone } from '../Badge';
import { SideNavCollapsibleGroup } from './SideNavCollapsibleGroup';
import { sideNavGroupLabelClass } from './sideNavGroupLabel';

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
 * Server component: plain markup. Only a collapsible group is client code.
 * There is no icon-only rail mode: the HTML does not draw one.
 * ------------------------------------------------------------------------- */

/* ---- Root ----------------------------------------------------------------- */

export const sideNavVariants = cva('grid content-start gap-0.5 font-sans');

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
  { className, 'aria-label': ariaLabel = 'Primary', items, children, ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      data-slot="sidenav"
      aria-label={ariaLabel}
      className={cn(sideNavVariants(), className)}
      {...props}
    >
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
        onOpenChange={onOpenChange}
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

export const sideNavItemVariants = cva([
  'flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-start',
  'font-sans text-base leading-body font-regular text-content-secondary no-underline',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  // Hover (never on the current item, which keeps its solid fill).
  '[&:not([aria-current=page]):not([aria-disabled=true]):hover]:bg-surface-hover',
  '[&:not([aria-current=page]):not([aria-disabled=true]):hover]:text-content',
  // The page you are on: the solid brand fill, semibold (`.sidenav__item[aria-current]`).
  'aria-[current=page]:bg-action-primary aria-[current=page]:font-semibold aria-[current=page]:text-action-primary-fg',
  // Not available: the disabled ink, no pointer (`.sidenav__item[aria-disabled]`).
  'aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled',
  'cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  // A count badge sits at the trailing edge; a long label wraps beside it.
  '[&>[data-slot=badge]]:ms-auto [&>[data-slot=badge]]:tabular-nums',
]);

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
};

/**
 * One destination: a leading glyph (20px), the label, and optionally a
 * trailing `Badge` (pushed to the end). Glyph and badge are children.
 */
export const SideNavItem = React.forwardRef<HTMLAnchorElement, SideNavItemProps>(function SideNavItem(
  { className, current = false, disabled = false, asChild = false, href, ...props },
  ref,
) {
  const shared = {
    'data-slot': 'sidenav-item',
    'data-current': current ? '' : undefined,
    className: cn(sideNavItemVariants(), className),
  };
  if (disabled && !asChild) {
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        aria-disabled="true"
        {...shared}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      />
    );
  }
  const Comp = asChild ? Slot : 'a';
  return (
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
    />
  );
});
SideNavItem.displayName = 'SideNavItem';
