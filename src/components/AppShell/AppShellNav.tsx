'use client';

// Client: the small-screen nav is a Radix Dialog (open state, focus trap,
// scroll lock, portal), closed again by a followed link and by widening past
// `md`. The shell around it stays server markup (AppShell.tsx).
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { IconButton, type IconButtonProps } from '../IconButton';
import { SideDrawerContent } from '../SideDrawer';
import { watchWide } from '../TopNav/collapseBreakpoints';

/* ---------------------------------------------------------------------------
 * AppShellNavRoot, AppShellNavDrawer, AppShellNavTrigger
 *
 * Below `md` (1056px) the HTML's shell drops to one column and "the side rail
 * is expected to move into a Side Drawer". This is that drawer: the same rail
 * content (`AppShellSide`'s children), in a modal panel from the leading
 * edge, over the scrim, with Dialog's contract (focus in and trapped, Escape
 * and the scrim close it, focus back to the trigger, the page inert).
 *
 * The HTML says the shell ships no hamburger and the app owns it: that is
 * `AppShellNavTrigger`, which you put in your TopNav (before the brand). It
 * renders nothing outside an AppShell, in `mobileNav="stack"`, and from `md`
 * up, where the rail is on screen.
 *
 * The panel is SideDrawer's (`side="left"`, `size="normal"`): its scrim,
 * motion, `dvh` height with a `vh` fallback, and safe-area padding (notch,
 * home bar, the landscape notch on the leading edge).
 * ------------------------------------------------------------------------- */

/**
 * The `md` breakpoint (1056px), where the rail is back beside the content —
 * the same default as TopNav's `collapseBelow`, from the same map
 * (TopNav/collapseBreakpoints.ts), so the shell and its bar switch together.
 */
const APP_SHELL_BREAKPOINT = 'md';

type NavContextValue = {
  mode: 'drawer' | 'stack';
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};
const NavContext = React.createContext<NavContextValue | null>(null);

/* ---- Root ----------------------------------------------------------------- */

export type AppShellNavRootProps = {
  /** `drawer`: the rail moves into a drawer below `md`; `stack`: it stacks above the content. */
  mode: 'drawer' | 'stack';
  /** The drawer's accessible name. */
  label: string;
  open?: boolean;
  defaultOpen?: boolean;
  /** `onOpenChange`, under a name the server shell can pass without an `on*` key. */
  openChangeHandler?: (open: boolean) => void;
  children?: React.ReactNode;
};

/** The state holder around the whole shell (renders no DOM). */
export function AppShellNavRoot({
  mode,
  label,
  open: openProp,
  defaultOpen = false,
  openChangeHandler,
  children,
}: AppShellNavRootProps) {
  const [open, setOpen] = useControllableState<boolean>({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: openChangeHandler,
    caller: 'AppShell',
  });
  const isOpen = open ?? false;

  // Widening past `md` puts the rail back on screen: the drawer has no job.
  React.useEffect(
    () => (isOpen ? watchWide(APP_SHELL_BREAKPOINT, () => setOpen(false)) : undefined),
    [isOpen, setOpen],
  );

  const context = React.useMemo(
    () => ({ mode, label, open: isOpen, setOpen: (next: boolean) => setOpen(next) }),
    [mode, label, isOpen, setOpen],
  );
  return (
    <NavContext.Provider value={context}>
      <DialogPrimitive.Root open={mode === 'drawer' ? isOpen : false} onOpenChange={setOpen}>
        {children}
      </DialogPrimitive.Root>
    </NavContext.Provider>
  );
}
AppShellNavRoot.displayName = 'AppShellNavRoot';

/* ---- Drawer --------------------------------------------------------------- */

/** Phosphor 2.1.1 `x` bold (MIT): a 16px close glyph wants the bold cut. */
function XGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z" />
    </svg>
  );
}

export type AppShellNavDrawerProps = {
  /** The rail content, drawn again inside the drawer. */
  children?: React.ReactNode;
  /**
   * The close button's accessible name.
   *
   * @default 'Close navigation'
   */
  closeLabel?: string;
  /** Where the portal mounts. Defaults to `document.body`. */
  container?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>['container'];
};

/** The small-screen panel. Rendered by `AppShellSide`; mounted only while open. */
export function AppShellNavDrawer({ children, closeLabel = 'Close navigation', container }: AppShellNavDrawerProps) {
  const nav = React.useContext(NavContext);
  if (!nav || nav.mode !== 'drawer') return null;
  return (
    <SideDrawerContent
      side="left"
      size="normal"
      container={container}
      data-slot="app-shell-nav-drawer"
      // No description: the panel is its links.
      aria-describedby={undefined}
      onClick={(event) => {
        // Following a link is leaving: close, as TopNav's drawer does.
        const target = event.target as Element | null;
        if (target?.closest?.('a[href]')) nav.setOpen(false);
      }}
    >
      <div
        data-slot="app-shell-nav-drawer-head"
        className="flex items-center justify-between gap-2 border-b border-border-decorative px-4 py-3"
      >
        <DialogPrimitive.Title className="m-0 text-sm font-semibold text-content-secondary">
          {nav.label}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close asChild>
          <IconButton variant="neutral" size="sm" aria-label={closeLabel} data-slot="app-shell-nav-close">
            <XGlyph />
          </IconButton>
        </DialogPrimitive.Close>
      </div>
      <div
        data-slot="app-shell-nav-drawer-body"
        className="grid min-h-0 content-start gap-1 overflow-y-auto overscroll-contain p-4"
      >
        {children}
      </div>
    </SideDrawerContent>
  );
}
AppShellNavDrawer.displayName = 'AppShellNavDrawer';

/* ---- Trigger -------------------------------------------------------------- */

/** Phosphor 2.1.1 `sidebar-simple` (MIT, the preview's `ph-sidebar`): regular at 20px, bold at 16px. */
const SIDEBAR = {
  regular:
    'M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H80V200H40ZM216,200H96V56H216V200Z',
  bold: 'M216,36H40A20,20,0,0,0,20,56V200a20,20,0,0,0,20,20H216a20,20,0,0,0,20-20V56A20,20,0,0,0,216,36ZM44,60H76V196H44ZM212,196H100V60H212Z',
} as const;

export type AppShellNavTriggerProps = Omit<IconButtonProps, 'aria-label'> & {
  /**
   * The accessible name. It does not change with the state: `aria-expanded`
   * says whether the drawer is open.
   *
   * @default 'Open navigation'
   */
  'aria-label'?: string;
};

/**
 * The button that opens the small-screen nav drawer. Put it in your TopNav,
 * before the brand. Hidden from `md` up, and renders nothing outside an
 * AppShell or with `mobileNav="stack"`.
 */
export const AppShellNavTrigger = React.forwardRef<HTMLButtonElement, AppShellNavTriggerProps>(
  function AppShellNavTrigger(
    { className, 'aria-label': ariaLabel = 'Open navigation', variant = 'neutral', size = 'md', children, ...props },
    ref,
  ) {
    const nav = React.useContext(NavContext);
    if (!nav || nav.mode !== 'drawer') return null;
    return (
      <DialogPrimitive.Trigger asChild>
        <IconButton
          ref={ref}
          variant={variant}
          size={size}
          data-slot="app-shell-nav-trigger"
          aria-label={ariaLabel}
          className={cn('md:hidden', className)}
          {...props}
        >
          {children ?? (
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
              <path d={SIDEBAR[size === 'sm' ? 'bold' : 'regular']} />
            </svg>
          )}
        </IconButton>
      </DialogPrimitive.Trigger>
    );
  },
);
AppShellNavTrigger.displayName = 'AppShellNavTrigger';
