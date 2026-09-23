'use client';

// Client: the toggle keeps the open state and listens for Escape, a link
// click and the breakpoint. The bar it opens stays server markup (TopNav.tsx):
// the toggle reflects its state as `data-open` on the closest
// `[data-slot=topnav]`, and the collapsible parts show themselves from CSS.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { IconButton, type IconButtonProps } from '../IconButton';

/* ---------------------------------------------------------------------------
 * TopNavToggle
 *
 * The small-screen menu button. Below `sm` (672px) the bar's collapsible
 * parts (`TopNavLinks`, and `TopNavActions` unless `collapsible={false}`)
 * fold away behind it; pressing it opens them as a full-width panel under the
 * bar — a disclosure, not a modal: the page stays live, and the panel pushes
 * the content down rather than covering it.
 *
 * `aria-expanded` + `aria-controls` (the ids of the parts it shows). Escape
 * closes it and returns focus here; following a link inside closes it; so
 * does widening past `sm`, where the parts are always visible anyway.
 *
 * `TopNav` renders this for you with `collapse="menu"` (the default). Render
 * it yourself only in a bar you assemble without `TopNav`.
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

/** The `sm` breakpoint (672px), where the collapsible parts come back into the bar. */
const WIDE = '(min-width: 672px)';

const COLLAPSIBLE = '[data-topnav-collapse]';

function rootOf(node: Element | null) {
  return node?.closest('[data-slot="topnav"]') ?? null;
}

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
};

export const TopNavToggle = React.forwardRef<HTMLButtonElement, TopNavToggleProps>(function TopNavToggle(
  { className, label = 'Menu', size = 'md', defaultOpen = false, onClick, ...props },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLButtonElement>(null);
  const ref = useComposedRefs(forwardedRef, innerRef);
  const [open, setOpen] = React.useState(defaultOpen);
  const [controls, setControls] = React.useState<string | undefined>(undefined);
  const baseId = useId();

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

  // While open: Escape, a followed link, and widening past `sm` close it.
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
      if (target?.closest?.(`${COLLAPSIBLE} a[href]`)) setOpen(false);
    };
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('click', onClickInside);

    const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(WIDE) : null;
    const onChange = () => {
      if (query?.matches) setOpen(false);
    };
    // `addListener` for Safari < 14, which the Rails app may still meet.
    if (query?.addEventListener) query.addEventListener('change', onChange);
    else query?.addListener?.(onChange);

    return () => {
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('click', onClickInside);
      if (query?.removeEventListener) query.removeEventListener('change', onChange);
      else query?.removeListener?.(onChange);
    };
  }, [open]);

  return (
    <IconButton
      ref={ref}
      variant="neutral"
      size={size}
      data-slot="topnav-toggle"
      aria-label={label}
      aria-expanded={open}
      aria-controls={controls}
      className={cn('sm:hidden', className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen((value) => !value);
      }}
      {...props}
    >
      <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
        <path d={GLYPH[size === 'sm' ? 'bold' : 'regular'][open ? 'close' : 'open']} />
      </svg>
    </IconButton>
  );
});
TopNavToggle.displayName = 'TopNavToggle';
