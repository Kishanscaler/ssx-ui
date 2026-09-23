/* ---------------------------------------------------------------------------
 * The nav collapse breakpoints, in one place.
 *
 * TopNav (`collapseBelow`) and AppShell (the rail's drawer) fold their
 * navigation away below a breakpoint. The CSS side is Tailwind's `max-sm:` /
 * `max-md:` / `max-lg:` variants, which read `--breakpoint-*` in theme.css.
 * The JS side (closing a drawer when the window widens past the breakpoint)
 * needs the same number as a media query. Both come from this map, and
 * TopNav.test.tsx checks it against theme.css, so they cannot drift apart.
 *
 * Plain data, no directive: the server TopNav and the client toggles and
 * AppShell nav all import it.
 * ------------------------------------------------------------------------- */

/** Where a nav folds away: below `sm` (672px), `md` (1056px) or `lg` (1312px). */
export type NavCollapseBelow = 'sm' | 'md' | 'lg';

/** The breakpoint widths in px, as `--breakpoint-*` in theme.css. */
export const navCollapseBreakpoints: Record<NavCollapseBelow, number> = {
  sm: 672,
  md: 1056,
  lg: 1312,
};

/** The media query that matches from the breakpoint up (the nav is inline there). */
export function navWideQuery(below: NavCollapseBelow): string {
  return `(min-width: ${navCollapseBreakpoints[below] ?? navCollapseBreakpoints.md}px)`;
}

/**
 * Call `onWide` whenever the window is at or past the breakpoint: once now,
 * then on every change. Returns the cleanup. `addListener` for Safari < 14,
 * which the Rails app may still meet.
 */
export function watchWide(below: NavCollapseBelow, onWide: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(navWideQuery(below));
  const onChange = () => {
    if (query.matches) onWide();
  };
  onChange();
  if (query.addEventListener) query.addEventListener('change', onChange);
  else query.addListener?.(onChange);
  return () => {
    if (query.removeEventListener) query.removeEventListener('change', onChange);
    else query.removeListener?.(onChange);
  };
}
