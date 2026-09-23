import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { SideNav, type SideNavEntry } from '../SideNav';
import { AppShellNavDrawer, AppShellNavRoot } from './AppShellNav';

/* ---------------------------------------------------------------------------
 * AppShell, AppShellSide, AppShellMain, AppShellContent
 *
 * The persistent frame every signed-in surface sits inside: the side rail
 * (a SideNav, often under the brand), the top bar (a TopNav) and the
 * scrolling content well. The student LMS, the faculty portal, the admissions
 * console. Do NOT use it for a marketing or landing page: those are
 * full-bleed and have no rail.
 *
 *   <AppShell>
 *     <AppShellSide>
 *       <SideNav aria-label="Student navigation" items={…} />
 *     </AppShellSide>
 *     <AppShellMain>
 *       <TopNav collapse="scroll">
 *         <AppShellNavTrigger />
 *         <TopNavBrand href="/" />
 *         …
 *       </TopNav>
 *       <AppShellContent>…the page…</AppShellContent>
 *     </AppShellMain>
 *   </AppShell>
 *
 * Or flat: `<AppShell side={<SideNav …/>} header={<TopNav …/>}>…</AppShell>`
 * (`navItems` builds the SideNav for you).
 *
 * Landmarks: the SideNav is the `nav`, the TopNav the `header` (banner), the
 * content well the `main`. A skip link ("Skip to main content") is the first
 * tab stop; it appears on focus and moves focus into `main`.
 *
 * Below `md` (1056px) the shell is one column, as the HTML's is. What happens
 * to the rail is `mobileNav`:
 *   - `drawer` (default): the rail hides and its content opens in a modal
 *     drawer from the leading edge, opened by `AppShellNavTrigger` — the
 *     HTML's "the side rail is expected to move into a Side Drawer; the app
 *     owns the trigger". Put the trigger in your TopNav.
 *   - `stack`: the HTML's literal small-screen rule — the rail stacks above
 *     the content, with a hairline under it.
 *
 * `variant`: `page` (default) is the real frame — the full viewport, the rail
 * sticky and scrolling on its own, the top bar sticky. `embedded` is the
 * HTML's specimen — a bordered, rounded box (min 420px) inside a page, for
 * docs, previews and a console embedded in another tool.
 *
 * Server component: plain markup. The small-screen drawer (Radix Dialog) is
 * the client island, in AppShellNav.tsx.
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type AppShellVariant = 'page' | 'embedded';
export type AppShellMobileNav = 'drawer' | 'stack';

export const appShellVariants = cva(
  [
    'group/app-shell grid grid-cols-[240px_minmax(0,1fr)] max-md:grid-cols-1',
    'bg-page font-sans text-content',
  ],
  {
    variants: {
      variant: {
        page: 'min-h-dvh',
        // `.shell`: the specimen frame.
        embedded: 'min-h-[420px] max-w-full overflow-hidden rounded-lg border border-border-decorative',
      },
    },
    defaultVariants: { variant: 'page' },
  },
);

/* ---- Side ----------------------------------------------------------------- */

export type AppShellSideProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The drawer's close button name, below `md` with `mobileNav="drawer"`.
   *
   * @default 'Close navigation'
   */
  closeLabel?: string;
};

/**
 * The rail column (`.shell__side`): the subtle surface, a hairline at its
 * trailing edge, 16px in. Holds the SideNav, and the brand above it if the
 * top bar does not carry one. Below `md` its content moves into the drawer
 * (or stacks, with `mobileNav="stack"`).
 */
export const AppShellSide = React.forwardRef<HTMLDivElement, AppShellSideProps>(function AppShellSide(
  { className, closeLabel, children, ...props },
  ref,
) {
  return (
    <>
      <div
        ref={ref}
        data-slot="app-shell-side"
        className={cn(
          'grid min-w-0 content-start gap-1 border-e border-border-decorative bg-surface-subtle p-4',
          // The real frame: the rail keeps to the viewport and scrolls on its own.
          'md:group-data-[variant=page]/app-shell:sticky md:group-data-[variant=page]/app-shell:top-0',
          'md:group-data-[variant=page]/app-shell:h-dvh md:group-data-[variant=page]/app-shell:self-start',
          'md:group-data-[variant=page]/app-shell:overflow-y-auto',
          // Small screens: into the drawer, or stacked above the content.
          'max-md:group-data-[mobile-nav=drawer]/app-shell:hidden',
          'max-md:group-data-[mobile-nav=stack]/app-shell:border-e-0 max-md:group-data-[mobile-nav=stack]/app-shell:border-b',
          className,
        )}
        {...props}
      >
        {children}
      </div>
      <AppShellNavDrawer closeLabel={closeLabel}>{children}</AppShellNavDrawer>
    </>
  );
});
AppShellSide.displayName = 'AppShellSide';

/* ---- Main ----------------------------------------------------------------- */

export type AppShellMainProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The right column (`.shell__main`): the top bar over the content well.
 */
export const AppShellMain = React.forwardRef<HTMLDivElement, AppShellMainProps>(function AppShellMain(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="app-shell-main"
      className={cn(
        'grid min-w-0 grid-rows-[auto_1fr]',
        // The real frame: the top bar stays in view while the page scrolls.
        'group-data-[variant=page]/app-shell:[&>[data-slot=topnav]]:sticky',
        'group-data-[variant=page]/app-shell:[&>[data-slot=topnav]]:top-0',
        'group-data-[variant=page]/app-shell:[&>[data-slot=topnav]]:z-sticky',
        className,
      )}
      {...props}
    />
  );
});
AppShellMain.displayName = 'AppShellMain';

/* ---- Content -------------------------------------------------------------- */

export type AppShellContentProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * The `main` landmark's id, the skip link's target. Match `AppShell`'s
   * `mainId` if you change it.
   *
   * @default 'main-content'
   */
  id?: string;
};

/**
 * The content well (`.shell__content`), the `<main>` landmark: 24px in,
 * scrolling on its own inside an `embedded` shell.
 */
export const AppShellContent = React.forwardRef<HTMLElement, AppShellContentProps>(function AppShellContent(
  { className, id = 'main-content', ...props },
  ref,
) {
  return (
    <main
      ref={ref}
      id={id}
      // The skip link moves focus here; the well itself shows no ring.
      tabIndex={-1}
      data-slot="app-shell-content"
      className={cn('min-w-0 overflow-auto p-6 outline-none max-sm:p-4', className)}
      {...props}
    />
  );
});
AppShellContent.displayName = 'AppShellContent';

/* ---- Root ----------------------------------------------------------------- */

export type AppShellProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * `page`: the full-viewport frame (sticky rail and top bar). `embedded`:
   * the HTML's bordered specimen box, for docs or a console inside a page.
   *
   * @default 'page'
   */
  variant?: AppShellVariant;
  /**
   * Below `md` (1056px): `drawer` moves the rail into a modal drawer opened by
   * `AppShellNavTrigger`; `stack` stacks it above the content.
   *
   * @default 'drawer'
   */
  mobileNav?: AppShellMobileNav;
  /**
   * The small-screen drawer's name, and its visible title.
   *
   * @default 'Navigation'
   */
  navLabel?: string;
  /** The drawer is open (controlled). */
  navOpen?: boolean;
  /**
   * The drawer starts open (uncontrolled). For a story or a screenshot; a real
   * page starts closed.
   *
   * @default false
   */
  defaultNavOpen?: boolean;
  /** Called with the drawer's new open state. */
  onNavOpenChange?: (open: boolean) => void;
  /**
   * The skip link's text. It is the first tab stop and appears on focus.
   *
   * @default 'Skip to main content'
   */
  skipLinkLabel?: string;
  /**
   * The `main` landmark's id, which the skip link targets.
   *
   * @default 'main-content'
   */
  mainId?: string;
  /** Flat form: the rail's content (a SideNav, a brand above it). */
  side?: React.ReactNode;
  /** Flat form: the rail's links, built into a SideNav (after `side`). */
  navItems?: SideNavEntry[];
  /**
   * Flat form: the SideNav landmark's name, with `navItems`.
   *
   * @default 'Primary'
   */
  navItemsLabel?: string;
  /** Flat form: the top bar, a `TopNav` (put an `AppShellNavTrigger` in it). */
  header?: React.ReactNode;
};

/**
 * The shell. Compound: `AppShellSide` + `AppShellMain` (a TopNav, then
 * `AppShellContent`). Flat: `side` / `navItems`, `header`, and the page as
 * children.
 */
export const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    className,
    variant = 'page',
    mobileNav = 'drawer',
    navLabel = 'Navigation',
    navOpen,
    defaultNavOpen = false,
    onNavOpenChange,
    skipLinkLabel = 'Skip to main content',
    mainId = 'main-content',
    side,
    navItems,
    navItemsLabel,
    header,
    children,
    ...props
  },
  ref,
) {
  const flat = side != null || navItems != null || header != null;
  const body = flat ? (
    <>
      <AppShellSide>
        {side}
        {navItems ? <SideNav aria-label={navItemsLabel} items={navItems} /> : null}
      </AppShellSide>
      <AppShellMain>
        {header}
        <AppShellContent id={mainId}>{children}</AppShellContent>
      </AppShellMain>
    </>
  ) : (
    children
  );

  return (
    <AppShellNavRoot
      mode={mobileNav}
      label={navLabel}
      open={navOpen}
      defaultOpen={defaultNavOpen}
      // Not `onOpenChange`: an `on*` prop in this server module reads as a
      // host handler to check-directives. The island maps it back.
      openChangeHandler={onNavOpenChange}
    >
      <div
        ref={ref}
        data-slot="app-shell"
        data-variant={variant}
        data-mobile-nav={mobileNav}
        className={cn(appShellVariants({ variant }), className)}
        {...props}
      >
        <a
          href={`#${mainId}`}
          data-slot="app-shell-skip-link"
          className={cn(
            // Off screen until focused, then a primary pill at the top-left.
            'sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-toast',
            'focus:inline-flex focus:h-control-md focus:items-center focus:rounded-md focus:px-4',
            'focus:bg-action-primary focus:text-action-primary-fg focus:shadow-overlay',
            'font-sans text-base font-semibold no-underline',
            'outline-none focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
          )}
        >
          {skipLinkLabel}
        </a>
        {body}
      </div>
    </AppShellNavRoot>
  );
});
AppShell.displayName = 'AppShell';
