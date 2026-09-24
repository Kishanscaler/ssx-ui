import { cva } from 'class-variance-authority';

/* ---------------------------------------------------------------------------
 * The SideNav recipes, in a module of their own so the server parts
 * (SideNav.tsx) and the client islands (SideNavRail.tsx) share them without
 * importing each other.
 *
 * The collapsed rail is styled from the '<nav>': it is 'group/sidenav', has
 * 'data-rail' when it can collapse and 'data-collapsed' while it is collapsed.
 * Everything below keys off those two attributes, so a plain (non-rail) nav
 * renders exactly as before.
 * ------------------------------------------------------------------------- */

export const sideNavVariants = cva('group/sidenav grid content-start gap-0.5 font-sans', {
  variants: {
    rail: {
      false: '',
      true: [
        // A definite width, so it can animate: 13rem open (the AppShell rail
        // column less its padding), 2.875rem collapsed (a 20px glyph, 12px
        // either side, the 1px borders). Override with the two variables.
        'w-[var(--sidenav-width,13rem)] data-[collapsed]:w-[var(--sidenav-rail-width,2.875rem)]',
        // One track that can shrink below the labels' min-content.
        'grid-cols-[minmax(0,1fr)]',
        'transition-[width] duration-[var(--motion-duration-normal)] ease-productive-in-out motion-reduce:transition-none',
      ],
    },
  },
  defaultVariants: { rail: false },
});

export const sideNavItemVariants = cva([
  'flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2 text-start',
  'font-sans text-base leading-body font-regular text-content-secondary no-underline',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  // Hover (never on the current item, which keeps its solid fill).
  '[&:not([aria-current=page]):not([aria-disabled=true]):hover]:bg-surface-hover',
  '[&:not([aria-current=page]):not([aria-disabled=true]):hover]:text-content',
  // The page you are on: the solid brand fill, semibold ('.sidenav__item[aria-current]').
  'aria-[current=page]:bg-action-primary aria-[current=page]:font-semibold aria-[current=page]:text-action-primary-fg',
  // Not available: the disabled ink, no pointer ('.sidenav__item[aria-disabled]').
  'aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled',
  'cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
  // A count badge sits at the trailing edge; a long label wraps beside it.
  '[&>[data-slot=badge]]:ms-auto [&>[data-slot=badge]]:tabular-nums',

  // ---- The collapsible rail -------------------------------------------------
  // The row clips its text while the rail narrows (its own focus outline is
  // not clipped: 'overflow' clips descendants only). The glyph never moves.
  'relative min-w-0 group-data-[rail]/sidenav:overflow-hidden',
  // The text fades: out fast as the rail closes, in after a beat as it opens,
  // so it never shows squeezed. Opacity only, so it stays in the link's name.
  'group-data-[rail]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:min-w-0',
  'group-data-[rail]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:transition-opacity group-data-[rail]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:ease-productive-in-out',
  'group-data-[rail]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:duration-[var(--motion-duration-normal)] group-data-[rail]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:delay-[var(--motion-duration-fast)]',
  'group-data-[collapsed]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:opacity-0 group-data-[collapsed]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:whitespace-nowrap',
  'group-data-[collapsed]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:duration-[var(--motion-duration-fast)] group-data-[collapsed]/sidenav:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:delay-0',
  'motion-reduce:[&>:not(svg):not([data-slot=icon]):not([data-slot=badge])]:transition-none',
  // The badge folds into a dot on the glyph's corner, in its own ink. Its text
  // stays in the DOM (font-size 0), so the count is still in the link's name.
  'group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:absolute group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:top-1.5 group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:end-1.5',
  'group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:size-2 group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:min-w-0 group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:p-0',
  'group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:rounded-full group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:bg-current group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:text-[0px]',
  'group-data-[collapsed]/sidenav:[&>[data-slot=badge]]:shadow-none',
]);

/** The group heading's look ('.sidenav__group'): 12px bold uppercase, secondary ink. */
export const sideNavGroupLabelClass = [
  'm-0 px-3 pt-4 pb-1 font-sans text-xs leading-body font-bold tracking-wide uppercase text-content-secondary',
  // The collapsible rail: one line (no height change as it narrows); while
  // collapsed the text fades to a short hairline that keeps the sections apart.
  'relative group-data-[rail]/sidenav:truncate',
  'group-data-[rail]/sidenav:transition-colors group-data-[rail]/sidenav:duration-[var(--motion-duration-normal)] group-data-[rail]/sidenav:ease-productive-in-out',
  'group-data-[collapsed]/sidenav:text-transparent',
  "after:pointer-events-none after:absolute after:inset-x-3 after:bottom-3 after:h-px after:bg-border-decorative after:opacity-0 after:content-['']",
  'after:transition-opacity after:duration-[var(--motion-duration-normal)] after:ease-productive-in-out',
  'group-data-[collapsed]/sidenav:after:opacity-100',
  'motion-reduce:transition-none motion-reduce:after:transition-none',
].join(' ');
