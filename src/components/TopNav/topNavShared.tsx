import * as React from 'react';
import { cva } from 'class-variance-authority';

/* ---------------------------------------------------------------------------
 * The pieces the server bar (TopNav.tsx) and its client islands
 * (TopNavToggle.tsx) both draw: the link recipe and the caret. Plain markup
 * and classes, no directive, so either side can import it without a cycle.
 * ------------------------------------------------------------------------- */

export const topNavLinkVariants = cva([
  'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 whitespace-nowrap',
  'font-sans text-base leading-body font-medium text-content-secondary no-underline',
  'border-0 bg-transparent',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  // `hover:` first, so Tailwind's `@media (hover: hover)` guard wraps it: a
  // tap on a phone does not leave the hover fill stuck on (N-09).
  'hover:not-aria-[current=page]:bg-surface-hover hover:not-aria-[current=page]:text-content',
  // The current page: brand ink on the brand-subtle fill, semibold.
  'aria-[current=page]:bg-surface-brand-subtle aria-[current=page]:font-semibold aria-[current=page]:text-content-brand',
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  // In the open push-down panel (`collapse="menu"`): a full-width row, 48px.
  'group-data-[open]/topnav:in-data-[topnav-collapse]:w-full group-data-[open]/topnav:in-data-[topnav-collapse]:py-3',
  // In the side drawer (`collapse="drawer"`): the same row, and a long label wraps.
  'in-data-[topnav-drawer]:w-full in-data-[topnav-drawer]:py-3 in-data-[topnav-drawer]:whitespace-normal',
]);

/** Phosphor 2.1.1 `caret-down` bold (MIT), 16px beside the label. */
export function CaretDownGlyph() {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="ms-auto size-icon-sm transition-transform duration-[var(--motion-duration-normal)] ease-productive-in-out group-data-[state=open]/topnav-menu:rotate-180 motion-reduce:transition-none"
    >
      <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}
