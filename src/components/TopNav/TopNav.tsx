import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button, type ButtonVariant } from '../Button';
import { Logo } from '../Logo';
import { MenuItem } from '../Menu';
import { type NavCollapseBelow } from './collapseBreakpoints';
import { topNavLinkVariants } from './topNavShared';
import { TopNavDrawerToggle, TopNavMenu, TopNavOverflowCue, TopNavToggle } from './TopNavToggle';

export { topNavLinkVariants } from './topNavShared';
export { TopNavMenu } from './TopNavToggle';
export type { TopNavMenuProps } from './TopNavToggle';

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
 * Or flat, for a CMS blok: `<TopNav brandLabel="Scaler" links={[…]} actions={[…]} />`.
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
 * `TopNavActions collapsible={false}` keeps a cluster in the bar in every
 * mode (the LMS bell and avatar, or a pinned "Apply now").
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
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type TopNavSize = 'md' | 'sm';
export type TopNavCollapse = 'drawer' | 'menu' | 'scroll' | 'none';
export type TopNavActionsOnMobile = 'menu' | 'bar';
/** The breakpoint below which the bar collapses: `sm` 672px, `md` 1056px, `lg` 1312px. */
export type TopNavCollapseBelow = NavCollapseBelow;

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
    'border-b border-border-decorative bg-page text-content',
    // The notch: the bar grows by the top inset and keeps its content clear
    // of the side insets in landscape (all 0 without `viewport-fit=cover`).
    'pt-[env(safe-area-inset-top,0px)]',
  ],
  {
    variants: {
      size: {
        // The HTML's 64px student bar and its 48px admin bar (`.topnav--sm`).
        md: [
          'h-[calc(var(--spacing)*16+env(safe-area-inset-top,0px))]',
          'pr-[max(20px,env(safe-area-inset-right,0px))] pl-[max(20px,env(safe-area-inset-left,0px))]',
        ],
        sm: [
          'h-[calc(var(--spacing)*12+env(safe-area-inset-top,0px))]',
          'pr-[max(16px,env(safe-area-inset-right,0px))] pl-[max(16px,env(safe-area-inset-left,0px))]',
        ],
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
      // Collapsed, the bar grows to hold the open panel.
      {
        collapse: 'menu',
        collapseBelow: 'sm',
        className:
          'max-sm:h-auto max-sm:min-h-[56px] max-sm:flex-wrap max-sm:gap-x-2 max-sm:gap-y-0 max-sm:pt-[calc(8px+env(safe-area-inset-top,0px))] max-sm:pb-2',
      },
      {
        collapse: 'menu',
        collapseBelow: 'md',
        className:
          'max-md:h-auto max-md:min-h-[56px] max-md:flex-wrap max-md:gap-x-2 max-md:gap-y-0 max-md:pt-[calc(8px+env(safe-area-inset-top,0px))] max-md:pb-2',
      },
      {
        collapse: 'menu',
        collapseBelow: 'lg',
        className:
          'max-lg:h-auto max-lg:min-h-[56px] max-lg:flex-wrap max-lg:gap-x-2 max-lg:gap-y-0 max-lg:pt-[calc(8px+env(safe-area-inset-top,0px))] max-lg:pb-2',
      },
      // The HTML shell's own small-screen rule.
      {
        collapse: 'scroll',
        collapseBelow: 'sm',
        className: 'max-sm:h-auto max-sm:min-h-[56px] max-sm:flex-wrap max-sm:pt-[calc(8px+env(safe-area-inset-top,0px))] max-sm:pb-2',
      },
      {
        collapse: 'scroll',
        collapseBelow: 'md',
        className: 'max-md:h-auto max-md:min-h-[56px] max-md:flex-wrap max-md:pt-[calc(8px+env(safe-area-inset-top,0px))] max-md:pb-2',
      },
      {
        collapse: 'scroll',
        collapseBelow: 'lg',
        className: 'max-lg:h-auto max-lg:min-h-[56px] max-lg:flex-wrap max-lg:pt-[calc(8px+env(safe-area-inset-top,0px))] max-lg:pb-2',
      },
      // Collapsed to menu button + brand (+ a pinned cluster): tighter.
      { collapse: 'drawer', collapseBelow: 'sm', className: 'max-sm:gap-2' },
      { collapse: 'drawer', collapseBelow: 'md', className: 'max-md:gap-2' },
      { collapse: 'drawer', collapseBelow: 'lg', className: 'max-lg:gap-2' },
    ],
    defaultVariants: { size: 'md', collapse: 'drawer', collapseBelow: 'md' },
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
        '[&_svg]:h-[28px] [&_svg]:w-auto [&_img]:h-[28px] [&_img]:w-auto',
        'group-data-[size=sm]/topnav:[&_svg]:h-[22px] group-data-[size=sm]/topnav:[&_img]:h-[22px]',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
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
  return <Logo label={label} className="h-[28px] group-data-[size=sm]/topnav:h-[22px]" />;
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
        'data-[overflow=end]:[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]',
        'data-[overflow=start]:[mask-image:linear-gradient(to_left,#000_calc(100%-32px),transparent)]',
        'data-[overflow=both]:[mask-image:linear-gradient(to_right,transparent,#000_32px,#000_calc(100%-32px),transparent)]',
        'rtl:data-[overflow=end]:[mask-image:linear-gradient(to_left,#000_calc(100%-32px),transparent)]',
        'rtl:data-[overflow=start]:[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]',
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

export type TopNavActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Fold behind the menu button on small screens (`drawer`, `menu`): into
   * the drawer's footer as full-width buttons, or the panel. Set `false` to
   * keep this cluster in the bar: the LMS bell and avatar, or a pinned
   * "Apply now".
   *
   * @default true
   */
  collapsible?: boolean;
};

/**
 * The right cluster, pushed to the end of the bar: `Button`s ("Student
 * login", "Apply now", `size="sm"` on a marketing bar), an `IconButton`
 * bell, the account `Menu`.
 */
export const TopNavActions = React.forwardRef<HTMLDivElement, TopNavActionsProps>(function TopNavActions(
  { className, collapsible = true, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="topnav-actions"
      data-topnav-collapse={collapsible ? '' : undefined}
      className={cn(
        'ms-auto flex shrink-0 items-center gap-2',
        collapsible
          ? [
              FOLDED,
              OPENED,
              PANEL,
              'group-data-[open]/topnav:gap-2 group-data-[open]/topnav:pt-3 group-data-[open]/topnav:pb-2',
              IN_DRAWER,
              'in-data-[topnav-drawer]:gap-2',
              // A landscape phone: the buttons side by side, so the links keep the height.
              '[@media(max-height:480px)]:in-data-[topnav-drawer]:flex-row [@media(max-height:480px)]:in-data-[topnav-drawer]:[&>*]:flex-1',
              // Full-width, 40px-tall buttons in the panel and the drawer.
              'group-data-[open]/topnav:[&>*]:w-full in-data-[topnav-drawer]:[&>*]:w-full',
              'group-data-[open]/topnav:[&>[data-slot=button]]:min-h-control-md in-data-[topnav-drawer]:[&>[data-slot=button]]:min-h-control-md',
            ]
          : // Pinned in the bar, beside the menu button (the brand pushes both to the end).
            'max-sm:group-data-[fold=sm]/topnav:ms-0 max-md:group-data-[fold=md]/topnav:ms-0 max-lg:group-data-[fold=lg]/topnav:ms-0',
        className,
      )}
      {...props}
    />
  );
});
TopNavActions.displayName = 'TopNavActions';

/* ---- Root ----------------------------------------------------------------- */

/** One link in the flat form. With `items` it becomes a dropdown group. */
export interface TopNavLinkData {
  /** The link text. */
  label: string;
  /** The destination. Ignored when `items` is set. */
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
}

/** One action in the flat form: a link drawn as a Button. */
export interface TopNavActionData {
  /** The button text ("Apply now"). */
  label: string;
  /** The destination. */
  href: string;
  /**
   * The Button variant. The one thing the page is for is `primary`; a login
   * link beside it is `tertiary`.
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
   * Flat form: on small screens, put the actions in the drawer or panel
   * (`menu`) or keep them in the bar (`bar`).
   *
   * @default 'menu'
   */
  actionsOnMobile?: TopNavActionsOnMobile;
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
        link.items?.length ? (
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
    <TopNavActions collapsible={actionsOnMobile !== 'bar'}>
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
    actionsOnMobile = 'menu',
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
    // that are not pinned to the bar.
    const drawerLinks = [linkRow, ...parts.filter((child) => isElementOf(child, TopNavLinks))].filter(Boolean);
    const drawerActions = [
      actionsOnMobile !== 'bar' ? actionRow : null,
      ...parts.filter(
        (child) =>
          isElementOf(child, TopNavActions) &&
          (child.props as TopNavActionsProps).collapsible !== false,
      ),
    ].filter(Boolean);
    if (drawerLinks.length || drawerActions.length) {
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

  return (
    <header
      ref={ref}
      data-slot="topnav"
      data-size={size}
      data-collapse={collapse}
      data-collapse-below={collapseBelow}
      data-fold={folds ? collapseBelow : undefined}
      data-scroll={collapse === 'scroll' ? collapseBelow : undefined}
      className={cn(topNavVariants({ size, collapse, collapseBelow }), className)}
      {...props}
    >
      {content}
    </header>
  );
});
TopNav.displayName = 'TopNav';
