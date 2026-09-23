import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Button, type ButtonVariant } from '../Button';
import { Logo } from '../Logo';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../Menu';
import { TopNavToggle } from './TopNavToggle';

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
 * Small screens (below `sm`, 672px), `collapse`:
 *   - `menu` (default): the links and actions fold behind a menu button
 *     (`TopNavToggle`, rendered for you after the brand) and open as a
 *     full-width panel under the bar. `TopNavActions collapsible={false}`
 *     keeps a cluster in the bar (the LMS bell and avatar, or a pinned
 *     "Apply now").
 *   - `scroll`: the HTML shell's own fallback — the bar wraps and the link
 *     row scrolls sideways. For an app bar with few links.
 *   - `none`: nothing changes; you handle it.
 *
 * Server component: the bar, brand, links and actions are plain markup. Only
 * `TopNavToggle` (client) holds state, and it reflects it as `data-open` on
 * this root, which the CSS reads. `TopNavMenu` renders the client `Menu`.
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type TopNavSize = 'md' | 'sm';
export type TopNavCollapse = 'menu' | 'scroll' | 'none';
export type TopNavActionsOnMobile = 'menu' | 'bar';

/* The descendant rules below key off the root's `data-collapse` and
   `data-open`, through the `group/topnav` name, so every part can live in a
   Server Component and still respond to the client toggle. */
const COLLAPSED = 'max-sm:group-data-[collapse=menu]/topnav:hidden';
const OPENED = 'max-sm:group-data-[collapse=menu]/topnav:group-data-[open]/topnav:flex';
// Class names are written out in full below (never built at runtime), so
// Tailwind's scanner sees every one of them.

export const topNavVariants = cva(
  [
    'group/topnav relative flex items-center gap-4 font-sans',
    'border-b border-border-decorative bg-page text-content',
  ],
  {
    variants: {
      size: {
        // The HTML's 64px student bar and its 48px admin bar (`.topnav--sm`).
        md: 'h-16 px-5',
        sm: 'h-12 px-4',
      },
      collapse: {
        // Below sm the bar grows to hold the open panel.
        menu: 'max-sm:h-auto max-sm:min-h-[56px] max-sm:flex-wrap max-sm:gap-x-2 max-sm:gap-y-0 max-sm:py-2',
        // The HTML shell's own small-screen rule.
        scroll: 'max-sm:h-auto max-sm:min-h-[56px] max-sm:flex-wrap max-sm:py-2',
        none: '',
      },
    },
    defaultVariants: { size: 'md', collapse: 'menu' },
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
 * logo ("Scaler School of Technology"); an `aria-label` replaces that.
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
        'flex shrink-0 items-center gap-2 rounded-md text-content no-underline',
        '[&_svg]:h-[28px] [&_svg]:w-auto [&_img]:h-[28px] [&_img]:w-auto',
        'group-data-[size=sm]/topnav:[&_svg]:h-[22px] group-data-[size=sm]/topnav:[&_img]:h-[22px]',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
        // On a phone the brand pushes the rest of the row to the right.
        'max-sm:group-data-[collapse=menu]/topnav:me-auto',
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
 * button on small screens (`collapse="menu"`), or scrolls sideways
 * (`collapse="scroll"`).
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
        'ms-6 flex min-w-0 items-center gap-1',
        // collapse="scroll": the HTML shell's small-screen fallback.
        'max-sm:group-data-[collapse=scroll]/topnav:ms-0 max-sm:group-data-[collapse=scroll]/topnav:overflow-x-auto',
        // collapse="menu": folded away, then a full-width column under the bar.
        COLLAPSED,
        OPENED,
        'max-sm:group-data-[collapse=menu]/topnav:order-last max-sm:group-data-[collapse=menu]/topnav:basis-full max-sm:group-data-[collapse=menu]/topnav:ms-0 max-sm:group-data-[collapse=menu]/topnav:flex-col max-sm:group-data-[collapse=menu]/topnav:items-stretch max-sm:group-data-[collapse=menu]/topnav:gap-1 max-sm:group-data-[collapse=menu]/topnav:border-t max-sm:group-data-[collapse=menu]/topnav:border-border-decorative max-sm:group-data-[collapse=menu]/topnav:mt-2 max-sm:group-data-[collapse=menu]/topnav:pt-2',
        'max-sm:group-data-[open]/topnav:animate-ssx-topnav-panel-in motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
});
TopNavLinks.displayName = 'TopNavLinks';

export const topNavLinkVariants = cva([
  'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 whitespace-nowrap',
  'font-sans text-base leading-body font-medium text-content-secondary no-underline',
  'border-0 bg-transparent',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  '[&:not([aria-current=page]):hover]:bg-surface-hover [&:not([aria-current=page]):hover]:text-content',
  // The current page: brand ink on the brand-subtle fill, semibold.
  'aria-[current=page]:bg-surface-brand-subtle aria-[current=page]:font-semibold aria-[current=page]:text-content-brand',
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  // In the open panel: a full-width row with a 48px target.
  'max-sm:group-data-[collapse=menu]/topnav:w-full max-sm:group-data-[collapse=menu]/topnav:py-3',
]);

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

/* ---- Menu (a dropdown group of links) ------------------------------------- */

/** Phosphor 2.1.1 `caret-down` bold (MIT), 16px beside the label. */
function CaretDownGlyph() {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="size-icon-sm transition-transform duration-[var(--motion-duration-normal)] ease-productive-in-out group-data-[state=open]/topnav-menu:rotate-180 motion-reduce:transition-none"
    >
      <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

export type TopNavMenuProps = {
  /** The trigger's text ("Programmes"). */
  label: React.ReactNode;
  /**
   * The page you are on is one of this menu's links: the trigger takes the
   * current-page look (`aria-current` belongs on the link itself, inside).
   *
   * @default false
   */
  current?: boolean;
  /** `MenuItem`s, usually `<MenuItem asChild><a href="…">…</a></MenuItem>`. */
  children?: React.ReactNode;
  /** Classes for the trigger button. */
  className?: string;
  /**
   * The panel's alignment to the trigger.
   *
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end';
};

/**
 * A dropdown group in the link row, or the account menu: a `Menu` whose
 * trigger looks like a TopNav link with a caret. The panel is Menu's own
 * (portalled, themed from `<html>`, full keyboard contract).
 */
export function TopNavMenu({ label, current = false, children, className, align = 'start' }: TopNavMenuProps) {
  return (
    <Menu>
      <MenuTrigger
        data-slot="topnav-menu-trigger"
        data-current={current || undefined}
        className={cn(
          topNavLinkVariants(),
          'group/topnav-menu',
          current && 'bg-surface-brand-subtle font-semibold text-content-brand',
          'max-sm:group-data-[collapse=menu]/topnav:justify-between',
          className,
        )}
      >
        {label}
        <CaretDownGlyph />
      </MenuTrigger>
      <MenuContent align={align}>{children}</MenuContent>
    </Menu>
  );
}
TopNavMenu.displayName = 'TopNavMenu';

/* ---- Actions -------------------------------------------------------------- */

export type TopNavActionsProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Fold behind the menu button on small screens (`collapse="menu"`). Set
   * `false` to keep this cluster in the bar: the LMS bell and avatar, or a
   * pinned "Apply now".
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
              COLLAPSED,
              OPENED,
              'max-sm:group-data-[collapse=menu]/topnav:order-last max-sm:group-data-[collapse=menu]/topnav:basis-full max-sm:group-data-[collapse=menu]/topnav:ms-0 max-sm:group-data-[collapse=menu]/topnav:flex-col max-sm:group-data-[collapse=menu]/topnav:items-stretch max-sm:group-data-[collapse=menu]/topnav:gap-2 max-sm:group-data-[collapse=menu]/topnav:pt-3 max-sm:group-data-[collapse=menu]/topnav:pb-2',
              'max-sm:group-data-[collapse=menu]/topnav:[&>*]:w-full',
              'max-sm:group-data-[open]/topnav:animate-ssx-topnav-panel-in motion-reduce:animate-none',
            ]
          : // Pinned in the bar, beside the menu button (the brand pushes both right).
            'max-sm:group-data-[collapse=menu]/topnav:ms-0',
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
  /** This is the page you are on. One per bar. */
  current?: boolean;
  /** A dropdown group instead of a link: each item is a link in a Menu. */
  items?: Array<{ label: string; href: string; description?: string }>;
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
   * What happens below `sm` (672px): `menu` folds the links and actions
   * behind a menu button; `scroll` wraps the bar and scrolls the link row
   * (the HTML shell's fallback); `none` leaves it to you.
   *
   * @default 'menu'
   */
  collapse?: TopNavCollapse;
  /**
   * The menu button's accessible name, with `collapse="menu"`.
   *
   * @default 'Menu'
   */
  menuLabel?: string;
  /**
   * Start with the small-screen menu open. For a story or a screenshot.
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
   * Flat form: on small screens, put the actions in the menu panel (`menu`) or
   * keep them in the bar (`bar`).
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
                <a href={item.href}>{item.label}</a>
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

/**
 * The bar, a `<header>`. Compound: `TopNavBrand`, `TopNavLinks` (with
 * `TopNavLink` / `TopNavMenu`), `TopNavActions`. Flat: `brandLabel`, `links`,
 * `actions`. The menu button is inserted after the brand for you.
 */
export const TopNav = React.forwardRef<HTMLElement, TopNavProps>(function TopNav(
  {
    className,
    size = 'md',
    collapse = 'menu',
    menuLabel = 'Menu',
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
  const toggle =
    collapse === 'menu' ? (
      <TopNavToggle
        key="topnav-toggle"
        label={menuLabel}
        size={size === 'sm' ? 'sm' : 'md'}
        defaultOpen={defaultMenuOpen}
      />
    ) : null;

  const { brand, linkRow, actionRow } = renderFlat({
    brandLabel,
    brandHref,
    logoSrc,
    links,
    linksLabel,
    actions,
    actionsOnMobile,
  });

  // The toggle goes right after the brand, so the tab order is brand → menu
  // button → the panel it opens.
  let content: React.ReactNode;
  if (brand) {
    content = [
      <React.Fragment key="brand">{brand}</React.Fragment>,
      toggle,
      <React.Fragment key="links">{linkRow}</React.Fragment>,
      <React.Fragment key="actions">{actionRow}</React.Fragment>,
      <React.Fragment key="children">{children}</React.Fragment>,
    ];
  } else {
    const parts = React.Children.toArray(children);
    const at = parts.findIndex((child) => React.isValidElement(child) && child.type === TopNavBrand);
    const flatRest = [
      <React.Fragment key="links">{linkRow}</React.Fragment>,
      <React.Fragment key="actions">{actionRow}</React.Fragment>,
    ];
    content =
      at === -1
        ? [toggle, ...flatRest, ...parts]
        : [...parts.slice(0, at + 1), toggle, ...flatRest, ...parts.slice(at + 1)];
  }

  return (
    <header
      ref={ref}
      data-slot="topnav"
      data-size={size}
      data-collapse={collapse}
      className={cn(topNavVariants({ size, collapse }), className)}
      {...props}
    >
      {content}
    </header>
  );
});
TopNav.displayName = 'TopNav';
