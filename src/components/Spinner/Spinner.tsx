import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { MONOGRAM_TRACE } from '../Logo/marks';

/* ---------------------------------------------------------------------------
 * Spinner
 *
 * The busy indicator, as a COMPONENT rather than a pseudo-element — shadcn/ui
 * ships this as its own primitive and composes it into Button, Alert, and
 * anything else that can be busy, and that is the shape we follow. What is
 * ours is what it DRAWS at the sizes that have room for it: the monogram,
 * because loading is the most-seen moment in the product.
 *
 * THE RULE (decided 2026-09-23): small sizes use the dots loader; bigger
 * sizes use the monogram. `size="sm"` (16px) is six dots in a 2 × 3 grid,
 * `md` and up is the mark drawing itself. Below about 20px the traced monogram has nowhere to go —
 * the contour and the glyph land within a pixel of each other and it reads as
 * a smudge — so the small size does not try. It matches the HTML preview's
 * `.dots` (`preview/shell.css`) dot for dot.
 *
 * This is the ONLY dots loader in the package. `SwitchStatus` (a pending
 * Switch) renders `<Spinner kind="dots" size="sm">` rather than drawing its
 * own, so the two cannot drift.
 *
 * `kind` exists for exactly one caller that needs the other answer at 16px:
 * `<Button loading>` on a md/lg button, which renders the solid monogram
 * silhouette inking upward (the same thing `.btn.is-loading` draws in the
 * HTML). The silhouette is legible at 16px because it is a solid, not a trace.
 *
 * All of it lives in `styles/components.css`: the loops are `@keyframes`, the
 * dots are placed in their grid cells per `:nth-child`, and the draw animates
 * `stroke-dashoffset` against `pathLength` — none of which Tailwind has syntax
 * for.
 *
 * The brand is a CONTEXT, not a prop — `[data-brand='ssb']` anywhere up the
 * tree switches which mark shows, the same signal `brand.css` already reads.
 * The dots are brand-neutral.
 * ------------------------------------------------------------------------- */

/* The mark itself is generated from the brand artwork (scripts/build-logos.mjs),
   the same data <Logo> draws and brand.css's `--brand-mark` mask is built from.
   `outer` is the shield contour (traced first, and the ghost's shape), `inner`
   the glyph (traced second), `body` the whole mark as a solid (inked last at
   md+, and the only layer at sm). */
const MARKS = MONOGRAM_TRACE;

/** Which brand's mark a spinner holds. `auto` holds both and lets CSS pick. */
export type SpinnerMarkBrand = 'sst' | 'ssb' | 'auto';

export const spinnerVariants = cva('inline-block shrink-0 align-middle', {
  variants: {
    size: {
      /**
       * 16px, the six-dot grid. Inline with body text, and inside a small
       * control — which is why it is the default.
       */
      sm: 'size-icon-sm',
      /** 24px, the monogram. A card or a panel waiting on its contents. */
      md: 'size-icon-lg',
      /** 40px. A section or a route. */
      lg: 'size-10',
      /** 64px. A full page, alone on it. */
      xl: 'size-16',
    },
  },
  defaultVariants: { size: 'sm' },
});

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;

export type SpinnerSize = NonNullable<SpinnerVariantProps['size']>;

/** What the spinner draws: the six-dot grid, or the brand monogram. */
export type SpinnerKind = 'dots' | 'monogram';

/** The rule: small sizes use the dots loader; bigger sizes use the monogram. */
const defaultKind = (size: SpinnerSize): SpinnerKind => (size === 'sm' ? 'dots' : 'monogram');

/** Six dots, a 2 × 3 grid. `components.css` places each in its cell and
 *  phases it, clockwise round the outside from the top-left. */
const DOTS = [0, 1, 2, 3, 4, 5];

export type SpinnerProps = React.ComponentPropsWithoutRef<'span'> &
  SpinnerVariantProps & {
    /**
     * What a screen reader is told while this is on screen. Set it to
     * something specific when the wait has a subject ("Loading applications"),
     * and to `null` to make the mark decorative — which is what a parent that
     * already announces the wait should do. `<Button loading>` sets
     * `aria-busy` on the button itself, so the spinner inside it is silent;
     * left announcing, the same wait would be read out twice.
     *
     * @default 'Loading'
     */
    label?: string | null;
    /**
     * Leave it unset. The size decides: `sm` is the six-dot grid, `md` and up
     * is the monogram. The override exists for `<Button loading>`, whose
     * md/lg sizes want the monogram at 16px — which, at `sm`, is the solid
     * silhouette inking upward rather than the traced draw. `dots` above `sm`
     * scales the grid to the box, as the HTML `.dots--lg` does at 24px.
     *
     * Reflected as `data-kind` on the root.
     *
     * @default size === 'sm' ? 'dots' : 'monogram'
     */
    kind?: SpinnerKind;
  };

/**
 * INTERNAL — the one implementation of both loaders, shared by `Spinner` and
 * `LogoLoader` so the monogram draw exists once. Not exported from the
 * package. The only thing it adds to `SpinnerProps` is `markBrand`: `auto`
 * (what `Spinner` always passes) renders both marks and lets the brand context
 * pick; a fixed brand renders just that one, whatever the context, which is
 * what a `LogoLoader brand="ssb"` on an SST page needs.
 */
export type SpinnerCoreProps = SpinnerProps & { markBrand?: SpinnerMarkBrand };

export const SpinnerCore = React.forwardRef<HTMLSpanElement, SpinnerCoreProps>(function SpinnerCore(
  { className, size = 'sm', kind, label = 'Loading', markBrand = 'auto', ...props },
  ref,
) {
  const resolvedSize: SpinnerSize = size ?? 'sm';
  const resolvedKind: SpinnerKind = kind ?? defaultKind(resolvedSize);
  const brands: Array<keyof typeof MARKS> = markBrand === 'auto' ? ['sst', 'ssb'] : [markBrand];
  return (
    <span
      ref={ref}
      data-slot="spinner"
      data-size={resolvedSize}
      data-kind={resolvedKind}
      data-mark-brand={markBrand === 'auto' ? undefined : markBrand}
      role={label === null ? undefined : 'status'}
      aria-label={label ?? undefined}
      aria-hidden={label === null || undefined}
      className={cn(spinnerVariants({ size: resolvedSize, className }))}
      {...props}
    >
      {resolvedKind === 'dots' ? (
        <span data-part="dots" aria-hidden="true">
          {DOTS.map((i) => (
            <span key={i} data-part="dot" />
          ))}
        </span>
      )
        : brands.map((brand) => {
            const mark = MARKS[brand];
            return (
              <svg
                key={brand}
                data-brand-mark={brand}
                /* `size-full` so a parent's `[&_svg:not([class*='size-'])]` rule
                   (Button's icon sizing) cannot resize the mark inside its box. */
                className="size-full"
                viewBox={mark.viewBox}
                /* The traced stroke sits ON the path, so half of it falls outside
                   the viewBox and would otherwise be clipped. */
                overflow="visible"
                aria-hidden="true"
              >
                {/* Paint lives on the paths as SVG presentation attributes, not in
                    the stylesheet. They are the weakest style source, so the
                    stylesheet still overrides them for the animated states — and
                    the mark is drawn correctly even where components.css has not
                    loaded. A logo that turns into a black blob when one stylesheet
                    is missing is not a logo you can put in a loading state.

                    Stroke width is in USER UNITS, deliberately not
                    non-scaling-stroke: the traced path is the shield FRAME, which
                    has two contours separated by the frame's own thickness (0.91
                    units on SST, 0.76 on SSB). A stroke in CSS pixels is fixed
                    while the artwork scales, so at 24px a 1.5px stroke works out at
                    ~2.5 user units, over three times the gap it has to sit inside,
                    and the two lines merge into a slab heavier than the logo. */}
                <path
                  data-part="ghost"
                  d={mark.outer}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={0.5}
                  strokeLinejoin="round"
                  opacity={0.3}
                />
                <path data-part="body" d={mark.body} fill="currentColor" fillRule="evenodd" />
                {/* pathLength="1" renormalises each path so one dash unit is the
                    whole outline, which is what lets the stylesheet draw it with a
                    single dashoffset from 1 to 0 — no per-mark measurement. */}
                <path
                  data-part="outer"
                  d={mark.outer}
                  pathLength={1}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  data-part="inner"
                  d={mark.inner}
                  pathLength={1}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            );
          })}
    </span>
  );
});
SpinnerCore.displayName = 'SpinnerCore';

/**
 * The rule: **small sizes use the dots loader; bigger sizes use the monogram.**
 *
 * At `sm` (16px) six dots sit in a 2 × 3 grid and light one after another
 * round the outside, clockwise, with a short tail lit behind the leading dot. Nothing travels; the motion is all
 * opacity, so it stays calm beside a line of text.
 *
 * At `md` and above the monogram draws itself: contour, then glyph, then
 * inked in.
 *
 * Both draw in `currentColor`, both run forward only, and under
 * `prefers-reduced-motion` both hold still (the grid shows its leading dot,
 * the mark shows itself complete). The `role="status"` / `label` contract is
 * the same for both.
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(props, ref) {
  return <SpinnerCore ref={ref} {...props} />;
});
Spinner.displayName = 'Spinner';
