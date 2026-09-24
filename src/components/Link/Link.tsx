import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Link
 *
 * Navigation: it changes where you are, not what is true. If activating it
 * writes something, it is a Button wearing a link costume — fix the element.
 *
 * Routing goes through `asChild`, never an `href` that renders `next/link`
 * (this package must not import `next/*`):
 *
 *   <Link asChild><NextLink href="/apply">Apply</NextLink></Link>
 *
 * Colour comes from `--content-link` on the page. On a coloured fill, Link
 * reads the surface-ink contract itself (`src/lib/surface-ink.ts`): a section
 * that says `data-surface-ink="on-brand-solid"` (or another fill) gets the
 * fill's link ink, its hover and a focus outline in the fill's ink, from
 * Link's own recipe. Nothing outside Link re-points its colours.
 *
 * `trailingIcon`: `arrow` a small arrow after the label, `arrow-circle` the
 * quiet CTA of a feature card ("Learn more ⭢"): semibold, the arrow in a
 * ring that fills on hover while the arrow nudges forward. Both glyphs are
 * inline SVG (the package ships no icon pack) and mirror in RTL.
 *
 * `visited` is a prop, not `:visited`: browsers cripple `:visited` styling to
 * stop history sniffing, so a system that relies on it gets a colour it can
 * neither control nor test. Read state comes from your own data.
 *
 * Disabled is `aria-disabled`, and a disabled link has no `href`: removing it
 * is what takes the anchor out of the tab order and stops navigation, while
 * `role="link"` + `aria-disabled` keep it announced. (Under `asChild` the
 * child owns `href`, so the caller omits it.)
 *
 * `standalone`: a link with nothing else on its line (a card action, a footer
 * link, a "View all") is only as tall as its text — 19px at `body`, well
 * under the 44px a thumb needs. Set it and the link gets `touch-target`, the
 * same invisible hit area Button gets, centred on the link and drawn only on
 * a coarse pointer. An inline link inside running text must NEVER get it: the
 * invisible area would spill onto the line above and below and swallow taps
 * meant for the words next to it, not just the link itself.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const linkVariants = cva(
  [
    'cursor-pointer text-content-link underline decoration-1 underline-offset-2',
    'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out',
    'motion-reduce:transition-none',
    // The focus outline (base layer) is `--border-focus`, a brand blue that
    // disappears on a brand fill: on a fill it is the fill's ink.
    'in-data-[surface-ink=on-brand-solid]:focus-visible:outline-on-brand-solid-ink',
    'in-data-[surface-ink=on-accent1-solid]:focus-visible:outline-on-accent1-solid-ink',
    'in-data-[surface-ink=on-accent2-solid]:focus-visible:outline-on-accent2-solid-ink',
    'in-data-[surface-ink=on-inverse]:focus-visible:outline-on-inverse-ink',
    'in-data-[surface-ink=on-image]:focus-visible:outline-on-image-ink',
    // The label an ink-filled glyph (the `arrow-circle` ring, hovered) draws
    // its arrow in: the page, or the fill's own colour.
    '[--link-on-ink:var(--surface-page)]',
    'in-data-[surface-ink=on-brand-solid]:[--link-on-ink:var(--on-brand-solid-action-fg)]',
    'in-data-[surface-ink=on-accent1-solid]:[--link-on-ink:var(--on-accent1-solid-action-fg)]',
    'in-data-[surface-ink=on-accent2-solid]:[--link-on-ink:var(--on-accent2-solid-action-fg)]',
    'in-data-[surface-ink=on-inverse]:[--link-on-ink:var(--on-inverse-action-fg)]',
    'in-data-[surface-ink=on-image]:[--link-on-ink:var(--on-image-action-fg)]',
  ],
  {
    variants: {
      variant: {
        default: '',
        // Underline on hover only: lists of links, footers, dense nav.
        quiet: 'no-underline',
      },
      visited: {
        true: 'text-content-link-hover',
        false: '',
      },
      disabled: {
        // The hover rules below are only added when NOT disabled, so there is
        // no specificity race to lose here. The fill inks too: a disabled link
        // keeps the disabled ink on every surface.
        true: 'cursor-not-allowed text-content-disabled no-underline',
        false: [
          'hover:text-content-link-hover hover:decoration-2',
          'in-data-[surface-ink=on-brand-solid]:text-on-brand-solid-link in-data-[surface-ink=on-brand-solid]:hover:text-on-brand-solid-link-hover',
          'in-data-[surface-ink=on-accent1-solid]:text-on-accent1-solid-link in-data-[surface-ink=on-accent1-solid]:hover:text-on-accent1-solid-link-hover',
          'in-data-[surface-ink=on-accent2-solid]:text-on-accent2-solid-link in-data-[surface-ink=on-accent2-solid]:hover:text-on-accent2-solid-link-hover',
          'in-data-[surface-ink=on-inverse]:text-on-inverse-link in-data-[surface-ink=on-inverse]:hover:text-on-inverse-link-hover',
          'in-data-[surface-ink=on-image]:text-on-image-link in-data-[surface-ink=on-image]:hover:text-on-image-link-hover',
        ],
      },
      trailingIcon: {
        none: '',
        // The label and the glyph on one line, the glyph never squeezed; a
        // long label wraps beside it.
        arrow: 'group/link inline-flex max-w-full items-center gap-1 [overflow-wrap:anywhere]',
        'arrow-circle': 'group/link inline-flex max-w-full items-center gap-3 font-semibold [overflow-wrap:anywhere]',
      },
    },
    compoundVariants: [{ variant: 'quiet', disabled: false, className: 'hover:underline' }],
    defaultVariants: { variant: 'default', visited: false, disabled: false, trailingIcon: 'none' },
  },
);

export type LinkVariant = 'default' | 'quiet';
/** A glyph after the label. String values, so a Storyblok option maps straight in. */
export type LinkTrailingIcon = 'none' | 'arrow' | 'arrow-circle';

export type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  Omit<VariantProps<typeof linkVariants>, 'disabled' | 'visited' | 'variant' | 'trailingIcon'> & {
    /**
     * `default` is underlined (running text, standalone links). `quiet`
     * underlines on hover only, for dense lists where every row is a link.
     *
     * @default 'default'
     */
    variant?: LinkVariant;
    /**
     * Render as the child element (e.g. `next/link`), keeping every style.
     *
     * @default false
     */
    asChild?: boolean;
    /**
     * The link opens somewhere else (usually a new tab). Adds a trailing
     * open-external glyph and a visually hidden "(opens in a new tab)". It
     * does NOT set `target`: the caller decides that.
     *
     * @default false
     */
    external?: boolean;
    /**
     * Already opened, from YOUR data (a completed module). Shown in the
     * link-hover ink.
     *
     * @default false
     */
    visited?: boolean;
    /**
     * This link stands alone — nothing else shares its line (a card action, a
     * footer link, a "View all", a nav item) — rather than sitting inline in
     * running text. Adds an invisible ≥44px hit area on a coarse pointer
     * (`touch-target`), centred on the link, with no change to its drawn
     * size. Leave it `false` for a link inside a paragraph or sentence: the
     * hit area would overlap the lines above and below it.
     *
     * @default false
     */
    standalone?: boolean;
    /**
     * A glyph after the label. `arrow` a small arrow · `arrow-circle` the
     * arrow in a ring, semibold: the quiet CTA of a feature card ("Learn
     * more"), usually with `variant="quiet"` and `standalone`. On hover the
     * ring fills with the link's ink and the arrow nudges forward (no nudge
     * under reduced motion). Decorative: the label is the name.
     *
     * @default 'none'
     */
    trailingIcon?: LinkTrailingIcon;
  };

/** Phosphor 2.1.1 `arrow-square-out`, bold (MIT). Inline so the atom has no icon dependency. */
const OPEN_EXTERNAL =
  'M228,104a12,12,0,0,1-24,0V69l-59.51,59.51a12,12,0,0,1-17-17L187,52H152a12,12,0,0,1,0-24h64a12,12,0,0,1,12,12Zm-44,24a12,12,0,0,0-12,12v64H52V84h64a12,12,0,0,0,0-24H48A20,20,0,0,0,28,80V208a20,20,0,0,0,20,20H176a20,20,0,0,0,20-20V140A12,12,0,0,0,184,128Z';

/** An arrow pointing forward (right; mirrored in RTL), drawn on a 24 grid. */
const ARROW = 'M5 12h14M13 6l6 6-6 6';

const GLYPH_MOTION = [
  'transition-[translate,color] duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-productive-in-out)]',
  'motion-reduce:transition-none',
].join(' ');

function trailingGlyph(kind: LinkTrailingIcon, disabled: boolean) {
  if (kind === 'none') return null;
  const nudge = disabled
    ? ''
    : 'motion-safe:group-hover/link:translate-x-0.5 motion-safe:rtl:group-hover/link:-translate-x-0.5';
  const ringed = kind === 'arrow-circle';
  const arrow = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn(
        'size-icon-sm shrink-0 rtl:-scale-x-100',
        GLYPH_MOTION,
        nudge,
        ringed && !disabled && 'group-hover/link:text-(--link-on-ink)',
      )}
    >
      <path d={ARROW} />
    </svg>
  );
  if (kind === 'arrow') {
    return (
      <span data-slot="link-trailing-icon" data-icon="arrow" aria-hidden="true" className="inline-flex shrink-0">
        {arrow}
      </span>
    );
  }
  // The ring: an ink outline at rest, filled with the ink on hover, the arrow
  // then drawn in the page (or the fill's own colour) so it stays legible.
  return (
    <span
      data-slot="link-trailing-icon"
      data-icon="arrow-circle"
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-current',
        'transition-colors duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-productive-in-out)] motion-reduce:transition-none',
        !disabled && 'group-hover/link:bg-current',
      )}
    >
      {arrow}
    </span>
  );
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    className,
    variant = 'default',
    asChild = false,
    external = false,
    visited = false,
    standalone = false,
    trailingIcon = 'none',
    href,
    role,
    children,
    ...props
  },
  ref,
) {
  const disabled = props['aria-disabled'] === true || props['aria-disabled'] === 'true';
  const Comp = asChild ? Slot : 'a';
  return (
    <Comp
      ref={ref}
      data-slot="link"
      data-variant={variant}
      data-visited={visited || undefined}
      data-external={external || undefined}
      data-standalone={standalone || undefined}
      data-trailing-icon={trailingIcon === 'none' ? undefined : trailingIcon}
      href={disabled && !asChild ? undefined : href}
      role={role ?? (disabled && !asChild ? 'link' : undefined)}
      className={cn(
        linkVariants({ variant, visited, disabled, trailingIcon }),
        standalone && 'touch-target',
        className,
      )}
      {...props}
    >
      <Slottable>{children}</Slottable>
      {trailingGlyph(trailingIcon, disabled)}
      {external ? (
        <>
          <svg
            data-slot="link-external-icon"
            viewBox="0 0 256 256"
            aria-hidden="true"
            focusable="false"
            className="ml-1 inline-block size-icon-sm shrink-0 fill-current align-middle"
          >
            <path d={OPEN_EXTERNAL} />
          </svg>
          <span className="sr-only">(opens in a new tab)</span>
        </>
      ) : null}
    </Comp>
  );
});
Link.displayName = 'Link';
