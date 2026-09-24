'use client';

// Client: the collapsible rail keeps its collapsed state (controlled or not)
// and shares it through context; while collapsed, each item is named by a
// Tooltip (Radix), and the collapse trigger is a button with a handler.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Tooltip';
import { sideNavItemVariants } from './sideNavStyles';

/* ---------------------------------------------------------------------------
 * SideNavRail (internal), SideNavItemTip (internal), SideNavCollapseTrigger
 *
 * `SideNav` renders SideNavRail in place of its plain `<nav>` when it is given
 * `collapsed`, `defaultCollapsed` or `onCollapsedChange`. The rail:
 *   - owns the collapsed state (uncontrolled from `defaultCollapsed`, or
 *     controlled by `collapsed` + `onCollapsedChange`);
 *   - marks the nav `data-rail` (and `data-collapsed` while collapsed); the
 *     width and the label fade are CSS on those (sideNavStyles.ts);
 *   - provides one TooltipProvider, so moving down the collapsed rail opens
 *     each item's name without waiting again.
 * ------------------------------------------------------------------------- */

type RailContextValue = {
  collapsed: boolean;
  setCollapsed: (next: boolean) => void;
  navId: string;
  /** Under SideNavForceExpandedProvider (the AppShell drawer copy): never folds. */
  forceExpanded: boolean;
};

const SideNavRailContext = React.createContext<RailContextValue | null>(null);

/** The rail's state, or `null` outside a collapsible SideNav. */
export const useSideNavRail = () => React.useContext(SideNavRailContext);

/**
 * Forces every `SideNav` under it to render fully expanded, whatever
 * `collapsed` / `defaultCollapsed` it was given. For a second copy of the
 * same nav that must never fold — the AppShell mobile drawer draws the
 * rail's own children again, and a folded rail there would leave the small
 * screen's only nav showing glyphs with no names.
 */
const SideNavForceExpandedContext = React.createContext(false);

export function SideNavForceExpandedProvider({ children }: { children?: React.ReactNode }) {
  return <SideNavForceExpandedContext.Provider value={true}>{children}</SideNavForceExpandedContext.Provider>;
}
SideNavForceExpandedProvider.displayName = 'SideNavForceExpandedProvider';

export type SideNavRailProps = React.HTMLAttributes<HTMLElement> & {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  /** `onCollapsedChange`, under a name the server SideNav can pass without an `on*` key. */
  collapsedChangeHandler?: (collapsed: boolean) => void;
};

export const SideNavRail = React.forwardRef<HTMLElement, SideNavRailProps>(function SideNavRail(
  { collapsed: collapsedProp, defaultCollapsed = false, collapsedChangeHandler, id, children, ...props },
  ref,
) {
  const navId = useId(id);
  const [inner, setInner] = React.useState(defaultCollapsed);
  const controlled = collapsedProp !== undefined;
  const forceExpanded = React.useContext(SideNavForceExpandedContext);
  const collapsed = forceExpanded ? false : controlled ? collapsedProp : inner;

  const handler = React.useRef(collapsedChangeHandler);
  handler.current = collapsedChangeHandler;
  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next);
      handler.current?.(next);
    },
    [controlled],
  );

  const value = React.useMemo(
    () => ({ collapsed, setCollapsed, navId, forceExpanded }),
    [collapsed, setCollapsed, navId, forceExpanded],
  );

  return (
    <SideNavRailContext.Provider value={value}>
      <TooltipProvider>
        <nav
          ref={ref}
          id={navId}
          data-slot="sidenav"
          data-rail=""
          data-collapsed={collapsed ? '' : undefined}
          {...props}
        >
          {children}
        </nav>
      </TooltipProvider>
    </SideNavRailContext.Provider>
  );
});
SideNavRail.displayName = 'SideNavRail';

/* ---- Item tooltip --------------------------------------------------------- */

export type SideNavItemTipProps = {
  /** The name shown beside the collapsed rail. */
  label: React.ReactNode;
  /** The item element (one element, which becomes the tooltip trigger). */
  children: React.ReactElement;
};

/**
 * Wraps a SideNavItem. Outside a collapsible rail it renders the item
 * untouched; inside one it is always a Tooltip trigger (so collapsing never
 * remounts the link) whose bubble only opens while the rail is collapsed.
 */
export function SideNavItemTip({ label, children }: SideNavItemTipProps) {
  const rail = useSideNavRail();
  const [open, setOpen] = React.useState(false);
  if (!rail || label == null || label === '') return children;
  return (
    <Tooltip open={rail.collapsed && open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
SideNavItemTip.displayName = 'SideNavItemTip';

/* ---- Collapse trigger ----------------------------------------------------- */

/** Phosphor 2.1.1 `caret-double-left` regular (MIT). Points at the edge the rail folds to. */
function CollapseGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M205.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L131.31,128ZM51.31,128l74.35-74.34a8,8,0,0,0-11.32-11.32l-80,80a8,8,0,0,0,0,11.32l80,80a8,8,0,0,0,11.32-11.32Z" />
    </svg>
  );
}

export type SideNavCollapseTriggerProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  /**
   * The button's name, and its visible text, while the rail is open.
   *
   * @default 'Collapse navigation'
   */
  collapseLabel?: string;
  /**
   * The button's name, and its tooltip, while the rail is collapsed.
   *
   * @default 'Expand navigation'
   */
  expandLabel?: string;
};

/**
 * Folds the rail to its glyphs and back: a row styled like an item, with
 * `aria-expanded` (open = the labels are showing) and `aria-controls` on the
 * nav. Put it inside a SideNav that has `defaultCollapsed` or `collapsed`
 * (last, or first); outside one it renders nothing, and so it does in a copy
 * that is forced expanded (the AppShell mobile drawer), where it could not
 * fold anything and would only be a dead control. To drive the rail from a
 * button elsewhere (a TopNav), control `collapsed` yourself instead.
 */
export const SideNavCollapseTrigger = React.forwardRef<HTMLButtonElement, SideNavCollapseTriggerProps>(
  function SideNavCollapseTrigger(
    { className, collapseLabel = 'Collapse navigation', expandLabel = 'Expand navigation', onClick, children, ...props },
    ref,
  ) {
    const rail = useSideNavRail();
    if (!rail || rail.forceExpanded) return null;
    const { collapsed, setCollapsed, navId } = rail;
    const name = collapsed ? expandLabel : collapseLabel;
    return (
      <SideNavItemTip label={expandLabel}>
        <button
          ref={ref}
          type="button"
          data-slot="sidenav-collapse-trigger"
          data-state={collapsed ? 'collapsed' : 'expanded'}
          aria-label={name}
          aria-expanded={!collapsed}
          aria-controls={navId}
          className={cn(sideNavItemVariants(), 'bg-transparent', className)}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) setCollapsed(!collapsed);
          }}
          {...props}
        >
          <CollapseGlyph
            className={cn(
              'transition-transform duration-[var(--motion-duration-normal)] ease-productive-in-out motion-reduce:transition-none',
              'rtl:-scale-x-100',
              collapsed && 'rotate-180',
            )}
          />
          <span data-slot="sidenav-item-label" aria-hidden="true">
            {children ?? collapseLabel}
          </span>
        </button>
      </SideNavItemTip>
    );
  },
);
SideNavCollapseTrigger.displayName = 'SideNavCollapseTrigger';
