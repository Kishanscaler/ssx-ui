'use client';

// Client: the bar's theme island. It reads the page (the marked sections and
// their place on screen) and writes `data-theme` / `data-brand` on the bar;
// the bar itself stays server markup (TopNav.tsx).
import * as React from 'react';

import { topNavThemeAttribute } from './topNavShared';

/* ---------------------------------------------------------------------------
 * TopNavThemeObserver (internal; TopNav renders it when `theme` is set)
 *
 * A dark island needs `data-brand` AND `data-theme` on ONE element (the
 * system's rule: the dark tokens are declared on `[data-brand][data-theme]`).
 * So whenever TopNav has a `theme`, this puts the page's brand on the bar too
 * (the nearest `data-brand` ancestor's, else the default `sst`), unless the
 * bar already carries one.
 *
 * `theme="auto"`: the bar takes the theme of the page section under its
 * bottom edge. Sections say theirs with `data-nav-theme="dark" | "light"`
 * (`topNavThemeAttribute`). An IntersectionObserver whose root is the
 * viewport less the bar's height (`rootMargin: -<bar height>px 0 0 0`)
 * fires as a section's edge crosses the bar's bottom edge; each time, the
 * marked section under that edge (the last one in document order that spans
 * it, else the last one already scrolled past it, else the first) gives the
 * value. No observer (an old browser): the first marked section's value,
 * once. The observer is rebuilt on resize (the bar's height and the
 * sections' places change); sections are read when it is built.
 * ------------------------------------------------------------------------- */

/** The value a page leaves unset: the default brand (tokens.css). */
const DEFAULT_BRAND = 'sst';
const THEMES = ['light', 'dark'];

function rootOf(node: Element | null) {
  return node?.closest('[data-slot="topnav"]') ?? null;
}

function themeOf(section: Element): string | null {
  const value = section.getAttribute(topNavThemeAttribute);
  return value && THEMES.indexOf(value) !== -1 ? value : null;
}

function markedSections(root: Element): Element[] {
  return Array.from(root.ownerDocument.querySelectorAll(`[${topNavThemeAttribute}]`)).filter(
    (section) => themeOf(section) !== null && !root.contains(section),
  );
}

/** The theme of the marked section under the bar's bottom edge. */
function themeUnder(root: Element, sections: Element[]): string | null {
  if (!sections.length) return null;
  const line = root.getBoundingClientRect().bottom;
  let spanning: Element | null = null;
  let passed: Element | null = null;
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= line && rect.bottom > line) spanning = section;
    else if (rect.top <= line) passed = section;
  }
  return themeOf(spanning ?? passed ?? sections[0]!);
}

export function TopNavThemeObserver({ theme }: { theme: 'light' | 'dark' | 'auto' }) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const root = rootOf(ref.current);
    if (!root) return undefined;
    // The brand beside the theme, on the same element.
    let ownBrand = false;
    if (!root.hasAttribute('data-brand')) {
      const page = root.parentElement?.closest('[data-brand]')?.getAttribute('data-brand');
      root.setAttribute('data-brand', page || DEFAULT_BRAND);
      ownBrand = true;
    }
    const releaseBrand = () => {
      if (ownBrand) root.removeAttribute('data-brand');
    };

    if (theme !== 'auto') {
      // TopNav renders it; set again in case a previous `auto` run removed it.
      root.setAttribute('data-theme', theme);
      return releaseBrand;
    }

    let sections = markedSections(root);
    const apply = () => {
      const value = themeUnder(root, sections);
      if (value) root.setAttribute('data-theme', value);
    };

    if (typeof IntersectionObserver === 'undefined') {
      // The static fallback: the first marked section's value.
      const first = sections.length ? themeOf(sections[0]!) : null;
      if (first) root.setAttribute('data-theme', first);
      return () => {
        root.removeAttribute('data-theme');
        releaseBrand();
      };
    }

    let observer: IntersectionObserver | null = null;
    const watch = () => {
      if (observer) observer.disconnect();
      sections = markedSections(root);
      const height = Math.round(root.getBoundingClientRect().height);
      observer = new IntersectionObserver(apply, { rootMargin: `-${height}px 0px 0px 0px`, threshold: 0 });
      sections.forEach((section) => observer!.observe(section));
      apply();
    };
    watch();

    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(rebuild) : 0;
      if (!frame) rebuild();
    };
    function rebuild() {
      frame = 0;
      watch();
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      root.removeAttribute('data-theme');
      releaseBrand();
    };
  }, [theme]);

  return <span ref={ref} hidden data-slot="topnav-theme" />;
}
TopNavThemeObserver.displayName = 'TopNavThemeObserver';
