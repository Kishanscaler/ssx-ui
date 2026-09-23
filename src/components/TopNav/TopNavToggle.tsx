'use client';

// Client: the bar's islands. The menu buttons keep the open state and listen
// for Escape, a followed link, browser navigation and the breakpoint; the
// drawer is a SideDrawer (Radix Dialog); TopNavMenu is a Radix Menu, or a
// Collapsible section inside the drawer and the open panel. The bar they sit
// in stays server markup (TopNav.tsx).
import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { IconButton, type IconButtonProps } from '../IconButton';
import { Menu, MenuContent, MenuGroup, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '../Menu';
import {
  SideDrawer,
  SideDrawerBody,
  SideDrawerContent,
  SideDrawerFooter,
  SideDrawerHeader,
  SideDrawerTitle,
  SideDrawerTrigger,
} from '../SideDrawer';
import { type NavCollapseBelow, watchWide } from './collapseBreakpoints';
import { CaretDownGlyph, topNavLinkVariants } from './topNavShared';

/* ---------------------------------------------------------------------------
 * TopNavToggle (collapse="menu"), TopNavDrawerToggle (collapse="drawer"),
 * TopNavMenu
 *
 * TopNavToggle is the push-down menu button. Below `collapseBelow` the bar's
 * collapsible parts (`TopNavLinks`, and `TopNavActions` unless
 * `collapsible={false}`) fold away behind it; pressing it opens them as a
 * full-width panel under the bar — a disclosure, not a modal: the page stays
 * live, and the panel pushes the content down rather than covering it.
 * `aria-expanded` + `aria-controls` (the ids of the parts it shows). Escape
 * closes it and returns focus here; following a link or choosing an item
 * inside closes it; so does widening past the breakpoint.
 *
 * TopNavDrawerToggle (internal; TopNav renders it with `collapse="drawer"`)
 * is the drawer's button and the drawer: a SideDrawer from the leading edge
 * with a copy of the links and actions TopNav hands it.
 *
 * TopNavMenu is a dropdown group: a Radix Menu in the inline bar; an inline
 * expandable section (Radix Collapsible) in the drawer and in the open panel,
 * where a floating menu over a panel is the wrong shape (N-07). The section
 * redraws the menu's `MenuItem`s as plain rows (a link stays that link).
 *
 * `TopNav` renders the buttons for you. Render TopNavToggle yourself only in
 * a bar you assemble without `TopNav`.
 * ------------------------------------------------------------------------- */

/**
 * Phosphor 2.1.1 `list` / `x` (MIT): the regular cut at 20px, the bold cut at
 * 16px in the 48px bar, where regular resolves to a 1px line (the HTML's
 * icon-weight note).
 */
const GLYPH = {
  regular: {
    open: 'M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z',
    close:
      'M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z',
  },
  bold: {
    open: 'M228,128a12,12,0,0,1-12,12H40a12,12,0,0,1,0-24H216A12,12,0,0,1,228,128ZM40,76H216a12,12,0,0,0,0-24H40a12,12,0,0,0,0,24ZM216,180H40a12,12,0,0,0,0,24H216a12,12,0,0,0,0-24Z',
    close:
      'M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z',
  },
} as const;

/** Hidden from the breakpoint up, where the parts are in the bar. Written out for Tailwind's scanner. */
const HIDDEN_FROM: Record<NavCollapseBelow, string> = { sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden' };

const COLLAPSIBLE = '[data-topnav-collapse]';
/** What closes the panel or drawer when clicked: a followed link, or a redrawn menu item. */
const CLOSES = 'a[href], [data-topnav-item]';

function rootOf(node: Element | null) {
  return node?.closest('[data-slot="topnav"]') ?? null;
}

/**
 * Marks each of the bar's link rows with `data-overflow="start|end|both"`
 * while it is clipped (the bar is inline but the links do not fit), which the
 * row's CSS turns into a fade at that edge.
 */
function useLinkRowOverflow(anchorRef: React.RefObject<Element | null>) {
  React.useEffect(() => {
    const root = rootOf(anchorRef.current);
    if (!root) return undefined;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="topnav-links"]')).filter(
      (row) => rootOf(row) === root,
    );
    if (!rows.length) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      rows.forEach((row) => {
        const max = row.scrollWidth - row.clientWidth;
        const left = Math.abs(row.scrollLeft);
        const start = max > 1 && left > 1;
        const end = max > 1 && left < max - 1;
        const value = start && end ? 'both' : start ? 'start' : end ? 'end' : null;
        if (value) row.setAttribute('data-overflow', value);
        else row.removeAttribute('data-overflow');
      });
    };
    const schedule = () => {
      if (frame) return;
      frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(update) : 0;
      if (!frame) update();
    };
    update();
    rows.forEach((row) => row.addEventListener('scroll', schedule, { passive: true }));
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    rows.forEach((row) => observer?.observe(row));
    return () => {
      rows.forEach((row) => row.removeEventListener('scroll', schedule));
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
    };
  }, [anchorRef]);
}

/** Close on the browser's back / forward and on an in-page hash change: both are navigation. */
function useCloseOnNavigation(open: boolean, close: () => void) {
  React.useEffect(() => {
    if (!open || typeof window === 'undefined') return undefined;
    window.addEventListener('popstate', close);
    window.addEventListener('hashchange', close);
    return () => {
      window.removeEventListener('popstate', close);
      window.removeEventListener('hashchange', close);
    };
  }, [open, close]);
}

function MenuGlyph({ size, open }: { size: 'sm' | 'md'; open: boolean }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d={GLYPH[size === 'sm' ? 'bold' : 'regular'][open ? 'close' : 'open']} />
    </svg>
  );
}

/**
 * With `collapse="scroll"` / `"none"` there is no menu button to watch the
 * link row: this empty, hidden element does it, so the row still fades at a
 * clipped edge. Internal; TopNav renders it.
 */
export function TopNavOverflowCue() {
  const ref = React.useRef<HTMLSpanElement>(null);
  useLinkRowOverflow(ref);
  return <span ref={ref} hidden data-slot="topnav-overflow-cue" />;
}
TopNavOverflowCue.displayName = 'TopNavOverflowCue';

/* ---- TopNavToggle (collapse="menu") --------------------------------------- */

export type TopNavToggleProps = Omit<IconButtonProps, 'aria-label' | 'variant'> & {
  /**
   * The accessible name. It does not change with the state: `aria-expanded`
   * says whether the menu is open.
   *
   * @default 'Menu'
   */
  label?: string;
  /**
   * Start open (uncontrolled). For a story or a screenshot; a real page
   * starts closed.
   *
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * The bar's collapse breakpoint (TopNav's `collapseBelow`): the button is
   * hidden from there up, and widening past it closes the panel.
   *
   * @default 'md'
   */
  collapseBelow?: NavCollapseBelow;
};

export const TopNavToggle = React.forwardRef<HTMLButtonElement, TopNavToggleProps>(function TopNavToggle(
  { className, label = 'Menu', size = 'md', defaultOpen = false, collapseBelow = 'md', onClick, ...props },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLButtonElement>(null);
  const ref = useComposedRefs(forwardedRef, innerRef);
  const [open, setOpen] = React.useState(defaultOpen);
  const [controls, setControls] = React.useState<string | undefined>(undefined);
  const baseId = useId();
  const close = React.useCallback(() => setOpen(false), []);
  useLinkRowOverflow(innerRef);
  useCloseOnNavigation(open, close);

  // Point aria-controls at the parts this button shows, giving them ids if
  // they have none (React does not manage those attributes, so it leaves them).
  React.useEffect(() => {
    const root = rootOf(innerRef.current);
    if (!root) return;
    const ids: string[] = [];
    root.querySelectorAll<HTMLElement>(COLLAPSIBLE).forEach((part, i) => {
      if (rootOf(part) !== root) return;
      if (!part.id) part.id = `${baseId}-part-${i}`;
      ids.push(part.id);
    });
    setControls(ids.length ? ids.join(' ') : undefined);
  }, [baseId]);

  // Reflect the state on the bar, which is what the CSS reads.
  React.useEffect(() => {
    const root = rootOf(innerRef.current);
    if (!root) return;
    if (open) root.setAttribute('data-open', '');
    else root.removeAttribute('data-open');
  }, [open]);

  // While open: Escape, a followed link or chosen item, and widening past
  // the breakpoint close it.
  React.useEffect(() => {
    if (!open) return undefined;
    const root = rootOf(innerRef.current);
    if (!root) return undefined;
    const onKeyDown = (event: Event) => {
      if ((event as KeyboardEvent).key !== 'Escape') return;
      setOpen(false);
      innerRef.current?.focus();
    };
    const onClickInside = (event: Event) => {
      const target = event.target as Element | null;
      const hit = target?.closest?.(CLOSES);
      if (hit && hit.closest(COLLAPSIBLE)) setOpen(false);
    };
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('click', onClickInside);
    const unwatch = watchWide(collapseBelow, close);
    return () => {
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('click', onClickInside);
      unwatch();
    };
  }, [open, collapseBelow, close]);

  return (
    <IconButton
      ref={ref}
      variant="neutral"
      size={size}
      data-slot="topnav-toggle"
      aria-label={label}
      aria-expanded={open}
      aria-controls={controls}
      className={cn(HIDDEN_FROM[collapseBelow] ?? HIDDEN_FROM.md, className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen((value) => !value);
      }}
      {...props}
    >
      <MenuGlyph size={size === 'sm' ? 'sm' : 'md'} open={open} />
    </IconButton>
  );
});
TopNavToggle.displayName = 'TopNavToggle';

/* ---- TopNavDrawerToggle (collapse="drawer") ------------------------------- */

/** True inside the drawer's copy of the links: TopNavMenu draws itself as a section. */
const InDrawerContext = React.createContext(false);

export type TopNavDrawerToggleProps = {
  /** The button's accessible name, and the drawer's. */
  label: string;
  /** The drawer's × button name. */
  closeLabel: string;
  size: 'sm' | 'md';
  collapseBelow: NavCollapseBelow;
  defaultOpen?: boolean;
  /** The bar's brand, drawn again at the top of the drawer. */
  brand?: React.ReactNode;
  /** The `TopNavLinks` to show in the drawer. */
  links?: React.ReactNode;
  /** The collapsible `TopNavActions`, as full-width buttons in the drawer's footer. */
  actions?: React.ReactNode;
};

/**
 * The menu button and the drawer it opens (`collapse="drawer"`). Internal:
 * TopNav renders it and hands it the parts to copy.
 */
export function TopNavDrawerToggle({
  label,
  closeLabel,
  size,
  collapseBelow,
  defaultOpen = false,
  brand,
  links,
  actions,
}: TopNavDrawerToggleProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(defaultOpen);
  const close = React.useCallback(() => setOpen(false), []);
  useLinkRowOverflow(buttonRef);
  useCloseOnNavigation(open, close);

  // Widening past the breakpoint puts the links back in the bar: the drawer
  // has no job.
  React.useEffect(() => (open ? watchWide(collapseBelow, close) : undefined), [open, collapseBelow, close]);

  const hasBrand = brand != null && brand !== false;
  return (
    <SideDrawer open={open} onOpenChange={setOpen}>
      <SideDrawerTrigger asChild>
        <IconButton
          ref={buttonRef}
          variant="neutral"
          size={size}
          data-slot="topnav-toggle"
          aria-label={label}
          className={HIDDEN_FROM[collapseBelow] ?? HIDDEN_FROM.md}
        >
          <MenuGlyph size={size} open={false} />
        </IconButton>
      </SideDrawerTrigger>
      <SideDrawerContent
        side="left"
        size="normal"
        data-topnav-drawer=""
        // No description: the drawer is its links.
        aria-describedby={undefined}
        onClick={(event) => {
          // Following a link (or choosing an item) is leaving: close.
          const target = event.target as Element | null;
          if (target?.closest?.(CLOSES)) setOpen(false);
        }}
      >
        <SideDrawerHeader closeLabel={closeLabel} className="items-center px-4 py-3 [@media(max-height:480px)]:py-1">
          {hasBrand ? (
            <>
              <div data-slot="topnav-drawer-brand" className="flex min-w-0 items-center">
                {brand}
              </div>
              <SideDrawerTitle className="sr-only">{label}</SideDrawerTitle>
            </>
          ) : (
            <SideDrawerTitle>{label}</SideDrawerTitle>
          )}
        </SideDrawerHeader>
        <SideDrawerBody data-slot="topnav-drawer-links" className="grid content-start gap-4 p-3">
          <InDrawerContext.Provider value>{links}</InDrawerContext.Provider>
        </SideDrawerBody>
        {actions ? (
          <SideDrawerFooter data-slot="topnav-drawer-actions" className="grid justify-stretch gap-2 px-4 [@media(max-height:480px)]:py-2">
            {actions}
          </SideDrawerFooter>
        ) : null}
      </SideDrawerContent>
    </SideDrawer>
  );
}
TopNavDrawerToggle.displayName = 'TopNavDrawerToggle';

/* ---- TopNavMenu ----------------------------------------------------------- */

/** Rows inside a section: a link row, indented under its group. */
const sectionRowClass = cn(
  topNavLinkVariants(),
  'w-full py-3 ps-6 whitespace-normal',
  // A description under the label, as the Menu row has it.
  'flex-col items-start gap-0.5',
);

/**
 * Redraw a Menu's children as plain rows. A `MenuItem asChild` link stays
 * that link (its props and ref kept), with the row look; a `MenuItem` with
 * `onSelect` becomes a button that calls it. Labels become small headings,
 * separators hairlines, groups are flattened. Anything else is kept as is.
 */
function toSectionRows(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const props = child.props as Record<string, unknown> & { children?: React.ReactNode };
    if (child.type === React.Fragment || child.type === MenuGroup) return toSectionRows(props.children);
    if (child.type === MenuSeparator) {
      return <hr data-slot="topnav-menu-separator" className="my-1 h-px border-0 bg-border-decorative" />;
    }
    if (child.type === MenuLabel) {
      return (
        <p className="m-0 px-3 pt-2 pb-1 ps-6 text-xs font-bold tracking-wide text-content-secondary uppercase">
          {props.children}
        </p>
      );
    }
    if (child.type !== MenuItem) return child;
    const { asChild, description, icon, onSelect, disabled, className } = props as {
      asChild?: boolean;
      description?: React.ReactNode;
      icon?: React.ReactNode;
      onSelect?: (event: Event) => void;
      disabled?: boolean;
      className?: string;
    };
    const body = (label: React.ReactNode) => (
      <>
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        {description != null && description !== false && description !== '' ? (
          <span className="text-sm font-regular text-content-secondary">{description}</span>
        ) : null}
      </>
    );
    if (asChild && React.isValidElement(props.children)) {
      const link = props.children as React.ReactElement<{ children?: React.ReactNode }>;
      return (
        <Slot data-slot="topnav-menu-item" data-topnav-item="" className={cn(sectionRowClass, className)}>
          {React.cloneElement(link, undefined, body(link.props.children))}
        </Slot>
      );
    }
    return (
      <button
        type="button"
        data-slot="topnav-menu-item"
        data-topnav-item=""
        disabled={disabled}
        className={cn(sectionRowClass, 'text-start disabled:cursor-not-allowed disabled:opacity-disabled', className)}
        onClick={(event) => onSelect?.(event.nativeEvent)}
      >
        {body(props.children)}
      </button>
    );
  });
}

/**
 * Whether the bar around `ref` has its push-down panel open (`data-open`)
 * and `ref` is inside a part that folds into it.
 */
function usePanelOpen(ref: React.RefObject<Element | null>) {
  const [panelOpen, setPanelOpen] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    const root = rootOf(node);
    if (!node || !root || !node.closest(COLLAPSIBLE) || typeof MutationObserver === 'undefined') return undefined;
    const update = () => setPanelOpen(root.hasAttribute('data-open'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['data-open'] });
    return () => observer.disconnect();
  }, [ref]);
  return panelOpen;
}

export type TopNavMenuProps = {
  /** The trigger's text ("Programmes"). */
  label: React.ReactNode;
  /**
   * The page you are on is one of this menu's links: the trigger takes the
   * current-page look (`aria-current` belongs on the link itself, inside),
   * and the section starts expanded in the drawer.
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

/** The section form of a TopNavMenu: a disclosure that expands in place. */
function TopNavMenuSection({ label, current = false, children, className }: TopNavMenuProps) {
  return (
    <CollapsiblePrimitive.Root defaultOpen={current} data-slot="topnav-menu-section" className="grid w-full gap-1">
      <CollapsiblePrimitive.Trigger
        data-slot="topnav-menu-trigger"
        data-current={current || undefined}
        className={cn(
          topNavLinkVariants(),
          'group/topnav-menu w-full py-3 whitespace-normal',
          current && 'bg-surface-brand-subtle font-semibold text-content-brand',
          className,
        )}
      >
        {label}
        <CaretDownGlyph />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content data-slot="topnav-menu-section-items" className="grid gap-1">
        {toSectionRows(children)}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}

/**
 * A dropdown group in the link row, or the account menu: a `Menu` whose
 * trigger looks like a TopNav link with a caret. The panel is Menu's own
 * (portalled, themed from `<html>`, full keyboard contract). In the drawer
 * and the open push-down panel it is an expandable section instead, its
 * items redrawn as rows.
 */
export function TopNavMenu({ label, current = false, children, className, align = 'start' }: TopNavMenuProps) {
  const inDrawer = React.useContext(InDrawerContext);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelOpen = usePanelOpen(triggerRef);
  if (inDrawer) {
    return (
      <TopNavMenuSection label={label} current={current} className={className}>
        {children}
      </TopNavMenuSection>
    );
  }
  return (
    <>
      <Menu>
        <MenuTrigger
          ref={triggerRef}
          data-slot="topnav-menu-trigger"
          data-current={current || undefined}
          hidden={panelOpen || undefined}
          className={cn(
            topNavLinkVariants(),
            'group/topnav-menu',
            current && 'bg-surface-brand-subtle font-semibold text-content-brand',
            className,
          )}
        >
          {label}
          <CaretDownGlyph />
        </MenuTrigger>
        <MenuContent align={align}>{children}</MenuContent>
      </Menu>
      {panelOpen ? (
        <TopNavMenuSection label={label} current={current} className={className}>
          {children}
        </TopNavMenuSection>
      ) : null}
    </>
  );
}
TopNavMenu.displayName = 'TopNavMenu';
