import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button, type ButtonVariant } from '../Button';
import { Logo } from '../Logo';
import { MenuItem } from '../Menu';
import { type NavCollapseBelow } from './collapseBreakpoints';
import { topNavLinkVariants, type TopNavMegaFooter, type TopNavMegaGroup } from './topNavShared';
import { TopNavThemeObserver } from './TopNavTheme';
import { TopNavDrawerToggle, TopNavMenu, TopNavOverflowCue, TopNavToggle } from './TopNavToggle';

export { topNavLinkVariants, topNavThemeAttribute } from './topNavShared';
export type { TopNavMegaFooter, TopNavMegaGroup, TopNavMegaItem } from './topNavShared';
export { TopNavMenu } from './TopNavToggle';
export type { TopNavMenuProps, TopNavMenuLayout } from './TopNavToggle';

/* ---------------------------------------------------------------------------
 * TopNav
 *
 * The horizontal bar across the top of an app or a marketing page: brand
 * mark, the primary section links (one of them `aria-current="page"`), and a
 * right cluster — "Student login" / "Apply now" on a landing page,
 * notifications and the account menu in the LMS. Do NOT put page-level
 * actions here: those belong in a Toolbar beside the content they act on.
 *
 *   <TopNav>
 *     <TopNavBrand href="/">{logo}</TopNavBrand>
 *     <TopNavLinks>
 *       <TopNavLink href="/programmes" current>Programmes</TopNavLink>
 *       <TopNavLink asChild><NextLink href="/curriculum">Curriculum</NextLink></TopNavLink>
 *       <TopNavMenu label="Outcomes">
 *         <MenuItem asChild><a href="/placements">Placements</a></MenuItem>
 *       </TopNavMenu>
 *     </TopNavLinks>
 *     <TopNavActions>
 *       <Button asChild variant="tertiary" size="sm"><a href="/login">Student login</a></Button>
 *       <Button asChild size="sm"><a href="/apply">Apply now</a></Button>
 *     </TopNavActions>
 *   </TopNav>
 *
 * Or flat, for a CMS blok: `<TopNav brandLabel="Scaler" links={[…]} actions={[…]} />`,
 * where a link with `items` is a dropdown and a link with `groups` (and an
 * optional `footer`) is a mega menu:
 * `{ label: 'Why SSB', groups: [{ title, items: [{ label, description, href, icon }] }],
 *    footer: { title, description, cta: { label, href } } }`.
 *
 * Page-level options (all additive; the defaults are the app bar it was):
 *   - `align="container"`: brand, links and actions sit on the page column,
 *     the same max-width (`--size-container-max`) and gutter (`px-gutter`)
 *     as `Container`, so the logo lines up with the content under it. The
 *     bar still paints edge to edge. Default `bar`: the app bar's padding.
 *   - `appearance="glass"`: a frosted bar. The frost is a `::before` layer
 *     behind the content (components.css), not a `backdrop-filter` on the
 *     bar, which would make the bar the containing block of anything fixed
 *     inside it. It turns solid while the push-down panel, the drawer or a
 *     mega panel is open, and under reduced transparency, more contrast,
 *     forced colours or no backdrop filter. Give a sticky glass bar its own
 *     z-index (`z-sticky`): it is an isolated stacking context.
 *   - `theme`: `light` / `dark` pins the bar's theme (a dark bar on a light
 *     page); `auto` follows the page: the bar takes the theme of the section
 *     under its bottom edge, from sections marked
 *     `data-nav-theme="dark" | "light"` (`topNavThemeAttribute`), nested
 *     ones included (the innermost wins). The bar gets `data-brand` with
 *     `data-theme`, never one without the other (the dark-island rule: both
 *     on one element; `data-brand` alone re-declares the LIGHT tokens).
 *     `brand` (`sst` | `ssb`) names it; unset, it is copied from the page
 *     after mount. Pass `brand` with a pinned theme, or the server markup has
 *     `data-theme` without `data-brand` and the first paint is the page's
 *     theme (a light flash under a dark bar). For `auto`'s first paint pass
 *     `data-theme` yourself (with `brand`); `auto` takes over on mount and
 *     puts it back on unmount. Unset (the default): the bar inherits the
 *     page's theme.
 *

 * Small screens: below `collapseBelow` (default `md`, 1056px — the same
 * breakpoint as AppShell's rail), `collapse`:
 *   - `drawer` (default, product decision 2026-09-23): the links and actions
 *     fold behind a menu button at the leading edge of the bar, which opens a
 *     SideDrawer (`normal`, from the left): the links as full-width rows (the
 *     current page marked), each `TopNavMenu` as an expandable section, and
 *     the actions as full-width buttons at the bottom. The drawer is modal
 *     (focus trap, scroll lock, scrim) and closes on a followed link, on
 *     browser navigation and when the window widens past the breakpoint.
 *     `TopNavLinks` and `TopNavActions` must be DIRECT children of `TopNav`
 *     (or come from the flat props) to be copied into the drawer.
 *   - `menu`: the push-down panel under the bar (a disclosure, not a modal).
 *     Its `TopNavMenu`s expand inline, and a sticky bar's open panel scrolls.
 *   - `scroll`: the HTML shell's own fallback — the bar wraps and the link
 *     row scrolls sideways. For an app bar with few links.
 *   - `none`: nothing changes; you handle it.
 *
 * The primary action stays in the bar (product decision 2026-09-23). In
 * `drawer` and `menu` mode, below the breakpoint, the bar is menu button +
 * brand + the PRIMARY action at the trailing edge; the other actions
 * ("Student login") fold into the drawer footer or the panel. The primary
 * action is the first action child that is a `Button` with `variant`
 * `primary` (Button's default), or the child you mark with
 * `data-topnav-primary` (any element; it must reach the DOM). In the flat
 * form, the first action whose `variant` is `primary` (the default). Per
 * cluster, `TopNavActions mobile` (flat: `actionsOnMobile`) picks the rule:
 *   - `primary` (default): the primary action stays in the bar, the rest fold;
 *   - `menu`: everything folds (the behaviour before 2026-09-23);
 *   - `bar`: the whole cluster stays in the bar (the LMS bell and avatar).
 *     `collapsible={false}` is the older spelling of `mobile="bar"`.
 * With `drawer`, the drawer footer ALSO carries the primary action: the drawer
 * is modal, so while it is open the bar behind the scrim is inert and its CTA
 * cannot be reached; the copy in the footer is the only way to act without
 * closing the menu first. Only one of the two is ever reachable, so assistive
 * technology never meets it twice. The `menu` panel is not modal (the bar stays
 * live above it), so the panel does NOT repeat it.
 *
 * From the breakpoint up the bar is inline. If the links still do not fit
 * (long labels, a narrow window just past the breakpoint), the link row
 * scrolls sideways with a fade at the clipped edge instead of running under
 * the actions (N-01).
 *
 * Safe areas: the bar pads itself by the notch (`env(safe-area-inset-*)`),
 * so a sticky bar under `viewport-fit=cover` keeps its content clear of it.
 *
 * Server component: the bar, brand, links and actions are plain markup. The
 * menu buttons (TopNavToggle.tsx, client) hold the state. `menu` reflects it
 * as `data-open` on this root, which the CSS reads; `drawer` renders the
 * drawer (and a copy of the links and actions in it) as a client island.
 * A mega `TopNavMenu` holds its own open state (TopNavToggle.tsx) and marks
 * this root `data-mega-open`; `theme` adds a small client island
 * (TopNavTheme.tsx) that writes `data-theme` / `data-brand` here.
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type TopNavSize = 'md' | 'sm';
export type TopNavCollapse = 'drawer' | 'menu' | 'scroll' | 'none';
/**
 * What a cluster of actions does below the collapse breakpoint (`drawer` and
 * `menu`): `primary` keeps the primary action in the bar and folds the rest,
 * `menu` folds everything, `bar` keeps everything in the bar.
 */
export type TopNavActionsOnMobile = 'primary' | 'menu' | 'bar';
/** The breakpoint below which the bar collapses: `sm` 672px, `md` 1056px, `lg` 1312px. */
export type TopNavCollapseBelow = NavCollapseBelow;
/** Where the bar's content sits: the app bar's own padding, or the page's `Container` column. */
export type TopNavAlign = 'bar' | 'container';
/** The bar's surface: the opaque page colour, or frosted glass over what scrolls under it. */
export type TopNavAppearance = 'solid' | 'glass';
/** The bar's theme: pinned light or dark, or `auto` (the marked page section under it). */
export type TopNavTheme = 'light' | 'dark' | 'auto';

/* The descendant rules below key off the root's data attributes through the
   `group/topnav` name, so every part can live in a Server Component and still
   respond to the breakpoint and the client toggle:
     data-fold="sm|md|lg"  the parts fold away below it (`drawer` and `menu`)
     data-scroll="sm|md|lg"  the link row scrolls below it (`scroll`)
     data-open  the push-down panel is open (`menu`; set by TopNavToggle)
   Class names are written out in full (never built at runtime), so
   Tailwind's scanner sees every one of them. */
const FOLDED =
  'max-sm:group-data-[fold=sm]/topnav:hidden max-md:group-data-[fold=md]/topnav:hidden max-lg:group-data-[fold=lg]/topnav:hidden';
/** Shown again in the open panel; its specificity beats FOLDED's. */
const OPENED = 'group-data-[collapse=menu]/topnav:group-data-[open]/topnav:flex';
/** The open panel's layout: a full-width column under the bar. */
const PANEL = [
  'group-data-[open]/topnav:order-last group-data-[open]/topnav:basis-full group-data-[open]/topnav:ms-0',
  'group-data-[open]/topnav:flex-col group-data-[open]/topnav:items-stretch',
  'motion-safe:group-data-[open]/topnav:animate-ssx-topnav-panel-in',
];
/** Inside the drawer (portalled, so no `group/topnav` above it). */
const IN_DRAWER = 'in-data-[topnav-drawer]:ms-0 in-data-[topnav-drawer]:flex-col in-data-[topnav-drawer]:items-stretch';

export const topNavVariants = cva(
  [
    'group/topnav relative flex items-center gap-4 font-sans',
    'border-b border-border-decorative text-content',
    // The notch: the bar grows by the top inset and keeps its content clear
    // of the side insets in landscape (all 0 without `viewport-fit=cover`).
    'pt-[env(safe-area-inset-top,0px)]',
  ],
  {
    variants: {
      size: {
        // The HTML's 64px student bar and its 48px admin bar (`.topnav--sm`).
        md: 'h-[calc(var(--space-16)+env(safe-area-inset-top,0px))]',
        sm: 'h-[calc(var(--space-12)+env(safe-area-inset-top,0px))]',
      },
      align: {
        // The app bar's padding: per size, below.
        bar: '',
        // The page column, as Container draws it (`mx-auto max-w-(--size-container-max)
        // px-gutter`), written as padding so the bar still paints edge to edge and
        // every part stays a direct child: half the room past the measure, plus the
        // gutter, and never less than the gutter or the notch.
        container: [
          'pr-[max(var(--space-gutter),env(safe-area-inset-right,0px),calc((100%_-_var(--size-container-max))/2_+_var(--space-gutter)))]',
          'pl-[max(var(--space-gutter),env(safe-area-inset-left,0px),calc((100%_-_var(--size-container-max))/2_+_var(--space-gutter)))]',
        ],
      },
      appearance: {
        solid: 'bg-page',
        // The frost and its wash are a `::before` layer (components.css, keyed
        // on `data-appearance`); `isolate` keeps that layer behind the content
        // and in front of the page.
        glass: 'isolate bg-transparent',
      },
      collapse: {
        drawer: '',
        // A sticky bar's open panel can be taller than a landscape phone:
        // it scrolls inside the bar (N-06).
        menu: [
          'data-[open]:max-h-screen supports-[height:100dvh]:data-[open]:max-h-dvh',
          'data-[open]:overflow-y-auto data-[open]:overscroll-contain',
        ],
        scroll: '',
        none: '',
      },
      collapseBelow: { sm: '', md: '', lg: '' },
    },
    compoundVariants: [
      // The app bar's padding (align="bar").
      {
        size: 'md',
        align: 'bar',
        className: [
          'pr-[max(var(--space-5),env(safe-area-inset-right,0px))] pl-[max(var(--space-5),env(safe-area-inset-left,0px))]',
          // Phones: the page gutter (16px), so the bar lines up with the content.
          'max-sm:pr-[max(var(--space-gutter),env(safe-area-inset-right,0px))] max-sm:pl-[max(var(--space-gutter),env(safe-area-inset-left,0px))]',
        ],
      },
      {
        size: 'sm',
        align: 'bar',
        className:
          'pr-[max(var(--space-4),env(safe-area-inset-right,0px))] pl-[max(var(--space-4),env(safe-area-inset-left,0px))]',
      },
      // Collapsed, the bar grows to hold the open panel.
      {
        collapse: 'menu',
        collapseBelow: 'sm',
        className:
          'max-sm:h-auto max-sm:min-h-(--top-nav-wrapped-min-height) max-sm:flex-wrap max-sm:gap-x-2 max-sm:gap-y-0 max-sm:pt-[calc(var(--space-2)+env(safe-area-inset-top,0px))] max-sm:pb-2',
      },
      {
        collapse: 'menu',
        collapseBelow: 'md',
        className:
          'max-md:h-auto max-md:min-h-(--top-nav-wrapped-min-height) max-md:flex-wrap max-md:gap-x-2 max-md:gap-y-0 max-md:pt-[calc(var(--space-2)+env(safe-area-inset-top,0px))] max-md:pb-2',
      },
      {
        collapse: 'menu',
        collapseBelow: 'lg',
        className:
          'max-lg:h-auto max-lg:min-h-(--top-nav-wrapped-min-height) max-lg:flex-wrap max-lg:gap-x-2 max-lg:gap-y-0 max-lg:pt-[calc(var(--space-2)+env(safe-area-inset-top,0px))] max-lg:pb-2',
      },
      // The HTML shell's own small-screen rule.
      {
        collapse: 'scroll',
        collapseBelow: 'sm',
        className: 'max-sm:h-auto max-sm:min-h-(--top-nav-wrapped-min-height) max-sm:flex-wrap max-sm:pt-[calc(var(--space-2)+env(safe-area-inset-top,0px))] max-sm:pb-2',
      },
      {
        collapse: 'scroll',
        collapseBelow: 'md',
        className: 'max-md:h-auto max-md:min-h-(--top-nav-wrapped-min-height) max-md:flex-wrap max-md:pt-[calc(var(--space-2)+env(safe-area-inset-top,0px))] max-md:pb-2',
      },
      {
        collapse: 'scroll',
        collapseBelow: 'lg',
        className: 'max-lg:h-auto max-lg:min-h-(--top-nav-wrapped-min-height) max-lg:flex-wrap max-lg:pt-[calc(var(--space-2)+env(safe-area-inset-top,0px))] max-lg:pb-2',
      },
      // Collapsed to menu button + brand (+ a pinned cluster): tighter.
      { collapse: 'drawer', collapseBelow: 'sm', className: 'max-sm:gap-2' },
      { collapse: 'drawer', collapseBelow: 'md', className: 'max-md:gap-2' },
      { collapse: 'drawer', collapseBelow: 'lg', className: 'max-lg:gap-2' },
    ],
    defaultVariants: { size: 'md', collapse: 'drawer', collapseBelow: 'md', align: 'bar', appearance: 'solid' },
  },
);

/* ---- Brand ---------------------------------------------------------------- */

export type TopNavBrandProps = React.HTMLAttributes<HTMLElement> & {
  /** Where the brand goes (usually `/`). Set: the brand is a link. */
  href?: string;
  /**
   * Render as the child element (e.g. `next/link`), keeping every style.
   *
   * @default false
   */
  asChild?: boolean;
};

/**
 * The logo slot. With no children it draws the Scaler logo — `<Logo>`, the full
 * colour lockup of whichever brand (`data-brand`) and theme (`data-theme`) the
 * page is in, 28px tall (22px in the `sm` bar). Pass children for anything
 * else (an `svg` or `img` gets the same height). As a link, it is named by the
 * logo ("Scaler School of Technology"); an `aria-label` replaces that. With
 * `collapse="drawer"` it is drawn again at the top of the drawer.
 */
export const TopNavBrand = React.forwardRef<HTMLElement, TopNavBrandProps>(function TopNavBrand(
  { className, href, asChild = false, children, ...props },
  ref,
) {
  const Comp: React.ElementType = asChild ? Slot : href != null ? 'a' : 'span';
  const empty = children == null || children === false;
  return (
    <Comp
      ref={ref as React.Ref<HTMLAnchorElement>}
      data-slot="topnav-brand"
      href={asChild ? undefined : href}
      className={cn(
        'flex min-w-0 shrink-0 items-center gap-2 rounded-md text-content no-underline',
        '[&_svg]:h-(--top-nav-logo-height) [&_svg]:w-auto [&_img]:h-(--top-nav-logo-height) [&_img]:w-auto',
        'group-data-[size=sm]/topnav:[&_svg]:h-(--top-nav-logo-height-sm) group-data-[size=sm]/topnav:[&_img]:h-(--top-nav-logo-height-sm)',
        'outline-none focus-visible:outline-focus focus-visible:outline-offset-focus focus-visible:outline-solid focus-visible:outline-border-focus',
        // Collapsed, the brand pushes the rest of the row to the end.
        'max-sm:group-data-[fold=sm]/topnav:me-auto max-md:group-data-[fold=md]/topnav:me-auto max-lg:group-data-[fold=lg]/topnav:me-auto',
        className,
      )}
      {...props}
    >
      {asChild ? children : empty ? <TopNavLogo /> : children}
    </Comp>
  );
});
TopNavBrand.displayName = 'TopNavBrand';

/** The default brand: the Scaler logo at the bar's logo height. */
function TopNavLogo({ label }: { label?: string }) {
  return <Logo label={label} className="h-(--top-nav-logo-height) group-data-[size=sm]/topnav:h-(--top-nav-logo-height-sm)" />;
}

/* ---- Links ---------------------------------------------------------------- */

export type TopNavLinksProps = Omit<React.HTMLAttributes<HTMLElement>, 'aria-label'> & {
  /**
   * The navigation landmark's name. Two navs on a page need two names
   * ("Primary", "Console sections").
   *
   * @default 'Primary'
   */
  'aria-label'?: string;
};

/**
 * The primary section links, a `<nav>` landmark. Collapses behind the menu
 * button on small screens (`drawer`, `menu`), or scrolls sideways
 * (`scroll`). In the inline bar it never runs under the actions: if the
 * links do not fit, the row scrolls, fading at the clipped edge.
 */
export const TopNavLinks = React.forwardRef<HTMLElement, TopNavLinksProps>(function TopNavLinks(
  { className, 'aria-label': ariaLabel = 'Primary', ...props },
  ref,
) {
  return (
    <nav
      ref={ref}
      data-slot="topnav-links"
      data-topnav-collapse=""
      aria-label={ariaLabel}
      className={cn(
        'ms-5 flex min-w-0 items-center gap-1',
        // The safety net (N-01): a row that does not fit scrolls instead of
        // overlapping. 4px of room around it keeps the focus ring unclipped.
        '-my-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        // The fade at the clipped edge(s), set by the menu button's observer.
        'data-[overflow=end]:[mask-image:linear-gradient(to_right,#000_calc(100%-var(--space-8)),transparent)]',
        'data-[overflow=start]:[mask-image:linear-gradient(to_left,#000_calc(100%-var(--space-8)),transparent)]',
        'data-[overflow=both]:[mask-image:linear-gradient(to_right,transparent,#000_var(--space-8),#000_calc(100%-var(--space-8)),transparent)]',
        'rtl:data-[overflow=end]:[mask-image:linear-gradient(to_left,#000_calc(100%-var(--space-8)),transparent)]',
        'rtl:data-[overflow=start]:[mask-image:linear-gradient(to_right,#000_calc(100%-var(--space-8)),transparent)]',
        // An open mega panel hangs from this row (positioned against the bar):
        // the fade's mask would hide it. `:has()` drops the mask the moment the
        // panel is shown. Where `:has()` is missing (Firefox < 121, Safari <
        // 15.4) that rule never matches, and an overflowing row's mask would
        // also mask the open panel; the bar's `data-mega-open` (set by the
        // mega trigger on open) drops it there too. `data-[overflow]` in the
        // fallback outranks the fade rules above whatever their order.
        'has-[[data-slot=topnav-mega]:not([hidden])]:[mask-image:none]',
        'group-data-[mega-open]/topnav:data-[overflow]:[mask-image:none]',
        // collapse="scroll": the HTML shell's small-screen fallback.
        // Its own full-width line under the brand and actions.
        'max-sm:group-data-[scroll=sm]/topnav:ms-0 max-md:group-data-[scroll=md]/topnav:ms-0 max-lg:group-data-[scroll=lg]/topnav:ms-0',
        'max-sm:group-data-[scroll=sm]/topnav:order-last max-md:group-data-[scroll=md]/topnav:order-last max-lg:group-data-[scroll=lg]/topnav:order-last',
        'max-sm:group-data-[scroll=sm]/topnav:basis-full max-md:group-data-[scroll=md]/topnav:basis-full max-lg:group-data-[scroll=lg]/topnav:basis-full',
        // collapse="drawer" / "menu": folded away below the breakpoint…
        FOLDED,
        // …then, with "menu", a full-width column under the bar.
        OPENED,
        PANEL,
        'group-data-[open]/topnav:m-0 group-data-[open]/topnav:gap-1 group-data-[open]/topnav:overflow-visible',
        'group-data-[open]/topnav:border-t group-data-[open]/topnav:border-border-decorative',
        'group-data-[open]/topnav:mt-2 group-data-[open]/topnav:pt-2 group-data-[open]/topnav:px-0 group-data-[open]/topnav:[mask-image:none]',
        // In the drawer: a column of full-width rows.
        IN_DRAWER,
        'in-data-[topnav-drawer]:m-0 in-data-[topnav-drawer]:gap-1 in-data-[topnav-drawer]:overflow-visible in-data-[topnav-drawer]:p-0',
        className,
      )}
      {...props}
    />
  );
});
TopNavLinks.displayName = 'TopNavLinks';

export type TopNavLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** The destination. With `asChild`, put it on your link instead. */
  href?: string;
  /**
   * This link is the page you are on: `aria-current="page"`, drawn in the
   * brand ink on the brand-subtle fill. Exactly one link per bar.
   *
   * @default false
   */
  current?: boolean;
  /**
   * Render as the child element (e.g. `next/link`), keeping every style:
   * `<TopNavLink asChild current><NextLink href="/modules">Modules</NextLink></TopNavLink>`.
   *
   * @default false
   */
  asChild?: boolean;
};

/** One section link. */
export const TopNavLink = React.forwardRef<HTMLAnchorElement, TopNavLinkProps>(function TopNavLink(
  { className, current = false, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      data-slot="topnav-link"
      aria-current={current ? 'page' : undefined}
      className={cn(topNavLinkVariants(), className)}
      {...props}
    />
  );
});
TopNavLink.displayName = 'TopNavLink';

/* ---- Actions -------------------------------------------------------------- */

/** The attribute that marks (and, once picked, carries) the primary action. */
const PRIMARY_ATTR = 'data-topnav-primary';

/**
 * Which child of a cluster is its primary action: the first one marked
 * `data-topnav-primary`, else the first `Button` whose variant is `primary`
 * (Button's default). -1 when there is none.
 */
function primaryIndex(items: React.ReactNode[]): number {
  const marked = items.findIndex(
    (item) => React.isValidElement(item) && (item.props as Record<string, unknown>)[PRIMARY_ATTR] != null,
  );
  if (marked !== -1) return marked;
  return items.findIndex(
    (item) =>
      React.isValidElement(item) &&
      item.type === Button &&
      ((item.props as { variant?: ButtonVariant }).variant ?? 'primary') === 'primary',
  );
}

/** The rule a cluster follows: `collapsible={false}` is the older `mobile="bar"`. */
function actionsMode(collapsible: boolean | undefined, mobile: TopNavActionsOnMobile | undefined): TopNavActionsOnMobile {
  return collapsible === false ? 'bar' : (mobile ?? 'primary');
}

/**
 * Whether a cluster has anything to fold into the drawer or panel beyond the
 * primary action it keeps in the bar. (Internal: TopNav uses it to decide
 * whether a menu button is needed at all.)
 */
function foldsMoreThanPrimary(children: React.ReactNode, mode: TopNavActionsOnMobile): boolean {
  if (mode === 'bar') return false;
  const items = React.Children.toArray(children);
  if (mode === 'menu') return items.length > 0;
  return items.length > (primaryIndex(items) === -1 ? 0 : 1);
}

export type TopNavActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Below the collapse breakpoint (`drawer`, `menu`): `primary` keeps the
   * primary action in the bar, at the trailing edge, and folds the rest into
   * the drawer footer or the panel; `menu` folds every action; `bar` keeps the
   * whole cluster in the bar (the LMS bell and avatar). The primary action is
   * the first child marked `data-topnav-primary`, else the first `Button`
   * whose `variant` is `primary`; with none, `primary` behaves as `menu`.
   *
   * @default 'primary'
   */
  mobile?: TopNavActionsOnMobile;
  /**
   * `false` is the older spelling of `mobile="bar"`, and wins over `mobile`.
   *
   * @default true
   */
  collapsible?: boolean;
};

const IN_BAR_WHEN_FOLDED =
  'max-sm:group-data-[fold=sm]/topnav:flex max-md:group-data-[fold=md]/topnav:flex max-lg:group-data-[fold=lg]/topnav:flex';
/** The primary action inside the folding cluster: hidden in the bar and panel (it has its own slot), kept in the drawer. */
const PRIMARY_FOLDED =
  'max-sm:group-data-[fold=sm]/topnav:[&>[data-topnav-primary]]:hidden max-md:group-data-[fold=md]/topnav:[&>[data-topnav-primary]]:hidden max-lg:group-data-[fold=lg]/topnav:[&>[data-topnav-primary]]:hidden';

/**
 * The right cluster, pushed to the end of the bar: `Button`s ("Student
 * login", "Apply now", `size="sm"` on a marketing bar), an `IconButton`
 * bell, the account `Menu`. Below the collapse breakpoint its primary action
 * stays in the bar and the rest fold away (see `mobile`).
 *
 * With `mobile="primary"` the primary action is rendered twice: in the
 * cluster (shown from the breakpoint up, and in the drawer) and in a
 * `data-slot="topnav-primary-action"` slot after it (shown only below the
 * breakpoint). Only one is ever displayed. A `ref` or `id` on that child
 * lands on the cluster's copy.
 */
export const TopNavActions = React.forwardRef<HTMLDivElement, TopNavActionsProps>(function TopNavActions(
  { className, collapsible, mobile, children, ...props },
  ref,
) {
  const mode = actionsMode(collapsible, mobile);
  const items = React.Children.toArray(children);
  const primaryAt = mode === 'primary' ? primaryIndex(items) : -1;
  const keepsPrimary = primaryAt !== -1;
  // Nothing but the primary action: nothing for the panel to show.
  const onlyPrimary = keepsPrimary && items.length === 1;
  const folds = mode !== 'bar';
  const primary = keepsPrimary ? items[primaryAt] : null;
  const marked = keepsPrimary
    ? items.map((item, i) =>
        i === primaryAt && React.isValidElement(item)
          ? React.cloneElement(item as React.ReactElement<Record<string, unknown>>, { [PRIMARY_ATTR]: '' })
          : item,
      )
    : children;
  const cluster = (
    <div
      ref={ref}
      data-slot="topnav-actions"
      data-topnav-mobile={mode}
      data-topnav-collapse={folds && !onlyPrimary ? '' : undefined}
      className={cn(
        'ms-auto flex shrink-0 items-center gap-2',
        folds
          ? [
              FOLDED,
              !onlyPrimary && [OPENED, PANEL, 'group-data-[open]/topnav:gap-2 group-data-[open]/topnav:pt-3 group-data-[open]/topnav:pb-2'],
              keepsPrimary && PRIMARY_FOLDED,
              IN_DRAWER,
              'in-data-[topnav-drawer]:gap-2',
              // A landscape phone: the buttons side by side, so the links keep the height.
              'short-sm:in-data-[topnav-drawer]:flex-row short-sm:in-data-[topnav-drawer]:[&>*]:flex-1',
              // Full-width, 40px-tall buttons in the panel and the drawer.
              'group-data-[open]/topnav:[&>*]:w-full in-data-[topnav-drawer]:[&>*]:w-full',
              'group-data-[open]/topnav:[&>[data-slot=button]]:min-h-control-md in-data-[topnav-drawer]:[&>[data-slot=button]]:min-h-control-md',
            ]
          : // Pinned in the bar, beside the menu button (the brand pushes both to the end).
            'max-sm:group-data-[fold=sm]/topnav:ms-0 max-md:group-data-[fold=md]/topnav:ms-0 max-lg:group-data-[fold=lg]/topnav:ms-0',
        className,
      )}
      {...props}
    >
      {marked}
    </div>
  );
  if (!keepsPrimary || !React.isValidElement(primary)) return cluster;
  return (
    <>
      {cluster}
      {/* The primary action's place in the collapsed bar: after the menu
          button (`menu`) or the brand (`drawer`), at the trailing edge.
          Hidden from the breakpoint up and in the drawer (no bar around it). */}
      <div
        data-slot="topnav-primary-action"
        className={cn('hidden shrink-0 items-center', IN_BAR_WHEN_FOLDED)}
      >
        {React.cloneElement(primary as React.ReactElement<Record<string, unknown>>, {
          key: 'primary',
          ref: null,
          id: undefined,
        })}
      </div>
    </>
  );
});
TopNavActions.displayName = 'TopNavActions';

/* ---- Root ----------------------------------------------------------------- */

/**
 * One link in the flat form. With `items` it becomes a dropdown group; with
 * `groups` a mega menu (`TopNavMenu layout="mega"`).
 */
export interface TopNavLinkData {
  /** The link text. */
  label: string;
  /** The destination. Ignored when `items` or `groups` is set. */
  href?: string;
  /**
   * This is the page you are on. One per bar. On a group: one of its items
   * is (the group starts expanded in the drawer).
   */
  current?: boolean;
  /** A dropdown group instead of a link: each item is a link in a Menu. */
  items?: Array<{
    label: string;
    href: string;
    description?: string;
    /** This item is the page you are on (`aria-current="page"`). */
    current?: boolean;
  }>;
  /**
   * A mega menu instead of a link: a full-width panel under the bar, these
   * titled columns of links (each an icon tile, a label and a line). Wins
   * over `items`.
   */
  groups?: TopNavMegaGroup[];
  /** With `groups`: the strip at the mega panel's foot, with one call to action. */
  footer?: TopNavMegaFooter;
}

/** One action in the flat form: a link drawn as a Button. */
export interface TopNavActionData {
  /** The button text ("Apply now"). */
  label: string;
  /** The destination. */
  href: string;
  /**
   * The Button variant. The one thing the page is for is `primary`; a login
   * link beside it is `tertiary`. The first `primary` action is the one that
   * stays in the bar on small screens (`actionsOnMobile="primary"`).
   *
   * @default 'primary'
   */
  variant?: ButtonVariant;
}

export type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * `md` is the 64px bar; `sm` the 48px admin bar (`.topnav--sm`), whose
   * icon buttons should be `size="sm"` with bold glyphs.
   *
   * @default 'md'
   */
  size?: TopNavSize;
  /**
   * What happens below `collapseBelow`: `drawer` folds the links and actions
   * into a side drawer behind a menu button; `menu` into a push-down panel
   * under the bar; `scroll` wraps the bar and scrolls the link row (the HTML
   * shell's fallback); `none` leaves it to you.
   *
   * @default 'drawer'
   */
  collapse?: TopNavCollapse;
  /**
   * The breakpoint below which the bar collapses: `sm` (672px), `md`
   * (1056px) or `lg` (1312px). `md` matches AppShell's rail, so the two
   * switch together. Raise it to `lg` for a bar with many or long links.
   *
   * @default 'md'
   */
  collapseBelow?: TopNavCollapseBelow;
  /**
   * The menu button's accessible name (and the drawer's name), with
   * `collapse="drawer"` or `"menu"`.
   *
   * @default 'Menu'
   */
  menuLabel?: string;
  /**
   * The drawer's × button name, with `collapse="drawer"`.
   *
   * @default 'Close menu'
   */
  menuCloseLabel?: string;
  /**
   * Start with the small-screen menu (drawer or panel) open. For a story or
   * a screenshot.
   *
   * @default false
   */
  defaultMenuOpen?: boolean;
  /**
   * Flat form: the brand link's accessible name. Set (or `logoSrc` set), the bar
   * has a brand: the Scaler `<Logo>` (it carries its own wordmark), named by
   * this label.
   */
  brandLabel?: string;
  /** Flat form: where the brand links to. */
  brandHref?: string;
  /** Flat form: a logo image URL, drawn instead of the Scaler `<Logo>` (`brandLabel` is its `alt`). */
  logoSrc?: string;
  /** Flat form: the section links. */
  links?: TopNavLinkData[];
  /**
   * Flat form: the links landmark's name.
   *
   * @default 'Primary'
   */
  linksLabel?: string;
  /** Flat form: the right-hand buttons ("Student login", "Apply now"). */
  actions?: TopNavActionData[];
  /**
   * Flat form, below `collapseBelow` (`drawer`, `menu`): `primary` keeps the
   * first `variant: 'primary'` action in the bar, at the trailing edge, and
   * folds the rest into the drawer footer or the panel; `menu` folds every
   * action (the default before 2026-09-23); `bar` keeps them all in the bar.
   *
   * @default 'primary'
   */
  actionsOnMobile?: TopNavActionsOnMobile;
  /**
   * Where the brand, links and actions sit. `bar`: the app bar's own padding
   * (20px, 16px in the `sm` bar, the gutter on a phone). `container`: the
   * page column, the same max-width (`--size-container-max`, 1280px) and
   * gutter (`px-gutter`) as `Container`, so the logo lines up with the
   * content under it on a marketing page; the bar still paints edge to edge.
   * A mega panel's content follows it. Sets `data-align`.
   *
   * @default 'bar'
   */
  align?: TopNavAlign;
  /**
   * The bar's surface. `solid`: the page colour. `glass`: frosted, a blurred
   * and saturated layer (the glass tokens) with a see-through wash over it,
   * behind the content, so the page shows softly through as it scrolls
   * under a sticky bar. Solid again while the push-down panel, the drawer or
   * a mega panel is open, and under reduced transparency, more contrast,
   * forced colours, or with no backdrop filter. The wash is
   * `--ssx-topnav-glass-wash` (default `--glass-surface`); set it on the bar
   * to tune it. A sticky glass bar needs its own z-index (`z-sticky`).
   * Sets `data-appearance`.
   *
   * @default 'solid'
   */
  appearance?: TopNavAppearance;
  /**
   * The bar's theme. Unset: it inherits the page's. `light` / `dark`: pinned
   * (`data-theme` on the bar). `auto`: it follows the page: the bar takes the
   * theme of the section under its bottom edge, from sections marked
   * `data-nav-theme="dark"` or `"light"` (`topNavThemeAttribute`), watched by
   * an IntersectionObserver on a 1px band at the bar's bottom edge (no
   * scroll handler, no GSAP), so a section's top or foot crossing it turns
   * the bar; the innermost marked section there wins (a dark island nested
   * in a light section). Without an observer, the first marked section's
   * value. The bar gets `data-brand` with `data-theme`, always together
   * (dark tokens need both on one element): `brand`, else the page's. For
   * `auto`'s first paint, pass `data-theme` yourself; it is restored on
   * unmount.
   */
  theme?: TopNavTheme;
  /**
   * The brand written beside `theme` (`data-brand`), only ever together with
   * a `data-theme`. With a pinned `theme` it is in the server markup, so a
   * dark bar is dark from the first paint; unset, the bar copies the page's
   * brand after mount (the nearest `data-brand` ancestor's, else `sst`),
   * and a pinned `dark` paints light until then. Ignored without `theme`
   * unless you pass `data-theme` yourself.
   */
  brand?: 'sst' | 'ssb';
};

function renderFlat({
  brandLabel,
  brandHref,
  logoSrc,
  links,
  linksLabel,
  actions,
  actionsOnMobile,
}: Pick<
  TopNavProps,
  'brandLabel' | 'brandHref' | 'logoSrc' | 'links' | 'linksLabel' | 'actions' | 'actionsOnMobile'
>) {
  const brand =
    brandLabel != null || logoSrc != null ? (
      <TopNavBrand href={brandHref}>
        {logoSrc ? <img src={logoSrc} alt={brandLabel ?? ''} /> : <TopNavLogo label={brandLabel} />}
      </TopNavBrand>
    ) : null;
  const linkRow = links?.length ? (
    <TopNavLinks aria-label={linksLabel}>
      {links.map((link, i) =>
        link.groups?.length ? (
          <TopNavMenu
            key={i}
            label={link.label}
            current={link.current}
            layout="mega"
            groups={link.groups}
            footer={link.footer}
          />
        ) : link.items?.length ? (
          <TopNavMenu key={i} label={link.label} current={link.current}>
            {link.items.map((item, j) => (
              <MenuItem key={j} asChild description={item.description}>
                <a href={item.href} aria-current={item.current ? 'page' : undefined}>
                  {item.label}
                </a>
              </MenuItem>
            ))}
          </TopNavMenu>
        ) : (
          <TopNavLink key={i} href={link.href} current={link.current}>
            {link.label}
          </TopNavLink>
        ),
      )}
    </TopNavLinks>
  ) : null;
  const actionRow = actions?.length ? (
    <TopNavActions mobile={actionsOnMobile}>
      {actions.map((action, i) => (
        <Button key={i} asChild variant={action.variant ?? 'primary'} size="sm">
          <a href={action.href}>{action.label}</a>
        </Button>
      ))}
    </TopNavActions>
  ) : null;
  return { brand, linkRow, actionRow };
}

const isElementOf = (node: React.ReactNode, type: React.ElementType): node is React.ReactElement =>
  React.isValidElement(node) && node.type === type;

/**
 * The bar, a `<header>`. Compound: `TopNavBrand`, `TopNavLinks` (with
 * `TopNavLink` / `TopNavMenu`), `TopNavActions`. Flat: `brandLabel`, `links`,
 * `actions`. The menu button is inserted for you: before the brand with
 * `collapse="drawer"` (the drawer opens from that edge), after it with
 * `"menu"`.
 */
export const TopNav = React.forwardRef<HTMLElement, TopNavProps>(function TopNav(
  {
    className,
    size = 'md',
    collapse = 'drawer',
    collapseBelow = 'md',
    menuLabel = 'Menu',
    menuCloseLabel = 'Close menu',
    defaultMenuOpen = false,
    brandLabel,
    brandHref,
    logoSrc,
    links,
    linksLabel,
    actions,
    actionsOnMobile = 'primary',
    align = 'bar',
    appearance = 'solid',
    theme,
    brand: themeBrand,
    children,
    ...props
  },
  ref,
) {
  const { brand, linkRow, actionRow } = renderFlat({
    brandLabel,
    brandHref,
    logoSrc,
    links,
    linksLabel,
    actions,
    actionsOnMobile,
  });
  const parts = React.Children.toArray(children);
  const brandAt = brand ? -1 : parts.findIndex((child) => isElementOf(child, TopNavBrand));
  const folds = collapse === 'drawer' || collapse === 'menu';

  let toggle: React.ReactNode = null;
  if (collapse === 'menu') {
    toggle = (
      <TopNavToggle
        key="topnav-toggle"
        label={menuLabel}
        size={size === 'sm' ? 'sm' : 'md'}
        collapseBelow={collapseBelow}
        defaultOpen={defaultMenuOpen}
      />
    );
  } else if (collapse === 'drawer') {
    // The drawer shows a copy of what folds away: the links, and the actions
    // that are not pinned to the bar (a kept primary action included: see the
    // header comment for why the modal drawer repeats it).
    const drawerLinks = [linkRow, ...parts.filter((child) => isElementOf(child, TopNavLinks))].filter(Boolean);
    const actionParts = parts.filter((child) => isElementOf(child, TopNavActions)) as React.ReactElement<TopNavActionsProps>[];
    const drawerActions = [
      actionsOnMobile !== 'bar' ? actionRow : null,
      ...actionParts.filter((child) => actionsMode(child.props.collapsible, child.props.mobile) !== 'bar'),
    ].filter(Boolean);
    // A drawer holding nothing but the CTA already in the bar has no job.
    const foldsActions =
      (actionRow != null && foldsMoreThanPrimary(actionRow.props.children, actionsOnMobile)) ||
      actionParts.some((child) =>
        foldsMoreThanPrimary(child.props.children, actionsMode(child.props.collapsible, child.props.mobile)),
      );
    if (drawerLinks.length || foldsActions) {
      toggle = (
        <TopNavDrawerToggle
          key="topnav-toggle"
          label={menuLabel}
          closeLabel={menuCloseLabel}
          size={size === 'sm' ? 'sm' : 'md'}
          collapseBelow={collapseBelow}
          defaultOpen={defaultMenuOpen}
          brand={brand ?? (brandAt === -1 ? null : parts[brandAt])}
          links={drawerLinks.length ? drawerLinks : null}
          actions={drawerActions.length ? drawerActions : null}
        />
      );
    }
  }

  // No menu button to watch the link row: a bare observer does it (the fade).
  if (!toggle && (collapse === 'scroll' || collapse === 'none')) toggle = <TopNavOverflowCue key="topnav-toggle" />;

  const flatRest = [
    <React.Fragment key="links">{linkRow}</React.Fragment>,
    <React.Fragment key="actions">{actionRow}</React.Fragment>,
  ];
  // Tab order. `drawer`: menu button → brand → the rest (the button sits at
  // the edge the drawer opens from). `menu`: brand → menu button → the panel
  // it opens.
  let content: React.ReactNode;
  if (brand) {
    const brandNode = <React.Fragment key="brand">{brand}</React.Fragment>;
    content = [
      ...(collapse === 'drawer' ? [toggle, brandNode] : [brandNode, toggle]),
      ...flatRest,
      <React.Fragment key="children">{children}</React.Fragment>,
    ];
  } else if (brandAt === -1 || collapse === 'drawer') {
    content = [toggle, ...flatRest, ...parts];
  } else {
    content = [...parts.slice(0, brandAt + 1), toggle, ...flatRest, ...parts.slice(brandAt + 1)];
  }

  // The theme attributes go AFTER the spread props, so a stray `data-theme`
  // prop cannot override a pinned `theme`. With `auto` (or unset) the
  // author's own `data-theme` is the first paint; `data-brand` is written only
  // beside a `data-theme`, never alone (it would force the light tokens).
  const pinned = theme === 'light' || theme === 'dark';
  const { 'data-theme': ownTheme, 'data-brand': ownBrand, ...rest } = props as typeof props & {
    'data-theme'?: string;
    'data-brand'?: string;
  };
  const themeAttr = pinned ? theme : ownTheme;
  const brandAttr = themeAttr ? (themeBrand ?? ownBrand) : ownBrand;

  return (
    <header
      ref={ref}
      data-slot="topnav"
      data-size={size}
      data-collapse={collapse}
      data-collapse-below={collapseBelow}
      data-fold={folds ? collapseBelow : undefined}
      data-scroll={collapse === 'scroll' ? collapseBelow : undefined}
      data-align={align}
      data-appearance={appearance}
      className={cn(topNavVariants({ size, collapse, collapseBelow, align, appearance }), className)}
      {...rest}
      data-theme={themeAttr}
      data-brand={brandAttr}
    >
      {content}
      {/* The theme island: the brand beside a pinned theme, or the observer
          behind `auto`. Unset: nothing, the bar inherits. */}
      {theme ? <TopNavThemeObserver theme={theme} brand={themeBrand} /> : null}
    </header>
  );
});
TopNav.displayName = 'TopNav';
