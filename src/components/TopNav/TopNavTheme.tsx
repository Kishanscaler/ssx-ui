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
 * system's rule: the dark tokens are declared on `[data-brand][data-theme]`,
 * and `data-brand` alone re-declares the LIGHT tokens). So this only ever
 * writes the two together: `data-theme` with the brand beside it (TopNav's
 * `brand`, else the bar's own `data-brand`, else the nearest `data-brand`
 * ancestor's, else the default `sst`). With no theme to give (`auto` and no
 * marked section), it writes nothing, so the bar keeps inheriting.
 *
 * It remembers what the bar carried before it wrote (server markup, or the
 * page's own attributes for the first paint) and puts that back on cleanup,
 * unless the attribute has changed since (React re-rendering a new `theme`).
 *
 * `theme="auto"`: the bar takes the theme of the page section under its
 * bottom edge. Sections say theirs with `data-nav-theme="dark" | "light"`
 * (`topNavThemeAttribute`). An IntersectionObserver watches a 1px band of
 * the viewport at the bar's bottom edge (`rootMargin: -<bar height>px 0
 * -<viewport − bar height − 1>px 0`), so EITHER edge of a section crossing
 * that line fires it: a dark island nested inside a light section, or a
 * marked section after unmarked content, turns the bar as it arrives. The
 * marked section under the line is the innermost (deepest in the DOM) one in
 * the band; none in the band: the one scrolled past most recently (its foot
 * nearest above the line); none of those: the first. Meant for a bar at the
 * top of the viewport (sticky or fixed): the band is measured from there. No
 * observer (an old browser): the first marked section's value, once. The
 * observer is rebuilt on resize (the bar's height and the viewport's
 * change); sections are read when it is built.
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

function depthOf(node: Element) {
  let depth = 0;
  for (let el = node.parentElement; el; el = el.parentElement) depth += 1;
  return depth;
}

/** Is the section across the 1px band at `line` (px from the viewport top)? */
function crosses(section: Element, line: number) {
  const rect = section.getBoundingClientRect();
  return rect.top < line + 1 && rect.bottom > line;
}

/**
 * The theme of the marked section under the line: the innermost one in the
 * band, else the one scrolled past most recently, else the first. `sections`
 * is in document order, so on a tie the later (the inner) one wins.
 */
function themeUnder(sections: Element[], inBand: Set<Element>, line: number): string | null {
  if (!sections.length) return null;
  let inner: Element | null = null;
  let innerDepth = -1;
  for (const section of sections) {
    if (!inBand.has(section)) continue;
    const depth = depthOf(section);
    if (depth >= innerDepth) {
      inner = section;
      innerDepth = depth;
    }
  }
  if (inner) return themeOf(inner);
  let passed: Element | null = null;
  let passedFoot = -Infinity;
  for (const section of sections) {
    const { bottom } = section.getBoundingClientRect();
    if (bottom <= line && bottom >= passedFoot) {
      passed = section;
      passedFoot = bottom;
    }
  }
  return themeOf(passed ?? sections[0]!);
}

/** The viewport's height without a horizontal scrollbar (the observer's implicit root). */
function viewportHeight(doc: Document) {
  const view = doc.defaultView;
  const inner = view ? view.innerHeight : 0;
  const client = doc.documentElement.clientHeight;
  return client > 0 && inner > 0 ? Math.min(client, inner) : client || inner;
}

function restore(root: Element, name: string, value: string | null) {
  if (value == null) root.removeAttribute(name);
  else root.setAttribute(name, value);
}

export function TopNavThemeObserver({ theme, brand }: { theme: 'light' | 'dark' | 'auto'; brand?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const root = rootOf(ref.current);
    if (!root) return undefined;

    // What the bar carried before: restored on cleanup.
    const before = { theme: root.getAttribute('data-theme'), brand: root.getAttribute('data-brand') };
    const brandValue =
      brand ||
      before.brand ||
      root.parentElement?.closest('[data-brand]')?.getAttribute('data-brand') ||
      DEFAULT_BRAND;
    let written: { theme: string; brand: string } | null = null;
    // Theme and brand, always together on the bar.
    const write = (value: string) => {
      root.setAttribute('data-theme', value);
      root.setAttribute('data-brand', brandValue);
      written = { theme: value, brand: brandValue };
    };
    // Put back what was there, where the attribute is still the one written.
    const release = () => {
      if (!written) return;
      if (root.getAttribute('data-theme') === written.theme) restore(root, 'data-theme', before.theme);
      if (root.getAttribute('data-brand') === written.brand) restore(root, 'data-brand', before.brand);
      written = null;
    };

    if (theme !== 'auto') {
      // TopNav renders `data-theme` (and `data-brand` with `brand`); written
      // again for the brand, and in case a previous `auto` run restored over it.
      write(theme);
      return release;
    }

    let sections = markedSections(root);

    if (typeof IntersectionObserver === 'undefined') {
      // The static fallback: the first marked section's value.
      const first = sections.length ? themeOf(sections[0]!) : null;
      if (first) write(first);
      return release;
    }

    const inBand = new Set<Element>();
    let line = 0;
    const apply = () => {
      const value = themeUnder(sections, inBand, line);
      if (value) write(value);
      else release();
    };

    let observer: IntersectionObserver | null = null;
    const watch = () => {
      if (observer) observer.disconnect();
      sections = markedSections(root);
      line = Math.round(root.getBoundingClientRect().height);
      const below = Math.max(0, viewportHeight(root.ownerDocument) - line - 1);
      // Where things are now; the observer's entries take over from here.
      inBand.clear();
      sections.forEach((section) => {
        if (crosses(section, line)) inBand.add(section);
      });
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) inBand.add(entry.target);
            else inBand.delete(entry.target);
          });
          apply();
        },
        { rootMargin: `-${line}px 0px -${below}px 0px`, threshold: 0 },
      );
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
      release();
    };
  }, [theme, brand]);

  return <span ref={ref} hidden data-slot="topnav-theme" />;
}
TopNavThemeObserver.displayName = 'TopNavThemeObserver';
