import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

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

/** The shield contour. Traced first, and the shape the ghost silhouette holds. */
const SST_OUTER =
  'M16.2531 39.4423C16.0942 39.3728 12.3029 37.6967 8.4772 34.9275C2.85171 30.8565 0 26.5399 0 22.0962V0H35.0492V22.0962C35.0492 26.5399 32.1975 30.8565 26.5735 34.9275C22.7477 37.6967 18.9564 39.3728 18.7976 39.4423L17.5253 40L16.2531 39.4423Z';
/** The glyph inside the shield. Traced second. */
const SST_INNER =
  'M16.3145 6.72781L7.70845 15.2234V26.9896H19.6278L28.2338 18.4941V6.72781H16.3145ZM16.0523 23.4586H11.2839V18.7515H16.0523V23.4586ZM23.6393 21.5207L19.6278 25.4808V15.2219H9.29539L13.307 11.2618H23.6393V21.5207Z';
/** The whole mark as a solid. Inked in last at md+, and the only layer at sm. */
const SST_BODY =
  'M16.2531 39.4423C16.0942 39.3728 12.3029 37.6967 8.4772 34.9275C2.85171 30.8565 0 26.5399 0 22.0962V0H35.0492V22.0962C35.0492 26.5399 32.1975 30.8565 26.5735 34.9275C22.7477 37.6967 18.9564 39.3728 18.7976 39.4423L17.5253 40L16.2531 39.4423ZM17.5253 39.0059L18.423 38.6124C18.5788 38.5444 22.2817 36.9068 26.0295 34.1953C31.4047 30.3047 34.1291 26.2337 34.1291 22.0976V0.909763H0.921597V22.0962C0.921597 26.2337 3.64743 30.3047 9.02116 34.1938C12.769 36.9053 16.4719 38.5429 16.6277 38.6109L17.5253 39.0044V39.0059ZM3.13193 3.09172V22.0962C3.13193 30.3033 17.5253 36.6183 17.5253 36.6183C17.5253 36.6183 31.9187 30.3033 31.9187 22.0962V3.09172H3.13193Z M16.3145 6.72781L7.70845 15.2234V26.9896H19.6278L28.2338 18.4941V6.72781H16.3145ZM16.0523 23.4586H11.2839V18.7515H16.0523V23.4586ZM23.6393 21.5207L19.6278 25.4808V15.2219H9.29539L13.307 11.2618H23.6393V21.5207Z';

const SSB_OUTER =
  'M0 0V25.0228C0 28.7396 2.3557 32.3516 7.00032 35.7561C10.1593 38.0721 13.2912 39.4747 13.4212 39.5325L14.4718 40L15.5224 39.5325C15.6541 39.4747 18.7842 38.0721 21.945 35.7561C26.5896 32.3498 28.9454 28.7396 28.9454 25.0228V0H0Z';
const SSB_INNER =
  'M19.251 25.5066L16.2714 28.4872V20.7682H8.5955L11.5761 17.7875H19.251V25.5066Z M13.6141 26.9653H10.0723V23.4235H13.6141V26.9653Z M26.4069 10.6357V24.9143C26.4069 31.781 14.5216 37.0627 14.5216 37.0627C14.435 37.0241 2.63531 31.754 2.63527 24.9143V10.6357H26.4069ZM7.41691 20.7661V29.6207H16.2714L22.6633 23.2287V14.3742H13.8088L7.41691 20.7661Z M12.3653 8.95323C11.7515 8.09399 10.7822 7.53981 9.69547 7.53981H2.63558V8.6951H9.69547C10.2533 8.6951 10.7641 8.91171 11.1612 9.26733H12.5638C12.5025 9.15902 12.4375 9.05251 12.3653 8.95323Z M14.5892 8.69695C14.434 8.33772 14.2444 7.99836 14.0242 7.68246C13.8003 7.35934 13.5458 7.06149 13.2624 6.79433C12.3039 5.88093 11.0403 5.32676 9.65937 5.32676H2.63558V6.48204H9.66117C10.8616 6.48204 11.9501 7.00373 12.7389 7.84853C13.0404 8.17165 13.2985 8.5399 13.5007 8.94425C13.553 9.04895 13.6 9.15726 13.6451 9.26737H14.8058C14.7444 9.07241 14.6722 8.88107 14.591 8.69695H14.5892Z M26.5029 4.15544V3.00016H19.6976C17.7336 3.00016 15.9393 3.79983 14.589 5.11036C13.237 3.79983 11.4463 3.00016 9.48231 3.00016H2.63543V4.15544H9.48231C11.1575 4.15544 12.6864 4.83237 13.8417 5.94433C14.1125 6.20427 14.3634 6.48768 14.5908 6.79275C14.8002 7.07254 14.988 7.36859 15.1558 7.68087C15.3689 8.07981 15.5458 8.50221 15.6829 8.94447C15.7154 9.05097 15.7461 9.15748 15.7732 9.26759H18.0188C18.4159 8.91017 18.9268 8.69536 19.4846 8.69536H26.5047V7.54007H19.4846C18.3961 7.54007 17.4285 8.09606 16.813 8.9553C16.7155 8.57442 16.5909 8.20436 16.4429 7.84875C17.2318 7.00575 18.3203 6.48407 19.2427 6.48407H26.5047V5.32878H19.5207C18.1397 5.32878 16.8761 5.88296 15.9158 6.79636C15.7407 6.50032 15.5476 6.21691 15.3382 5.94794C16.4935 4.83418 18.0242 4.15725 19.6994 4.15725H26.5047L26.5029 4.15544Z';
const SSB_BODY =
  'M0 0V25.0228C0 28.7396 2.3557 32.3516 7.00032 35.7561C10.1593 38.0721 13.2912 39.4747 13.4212 39.5325L14.4718 40L15.5224 39.5325C15.6541 39.4747 18.7842 38.0721 21.945 35.7561C26.5896 32.3498 28.9454 28.7396 28.9454 25.0228V0H0ZM28.1836 25.0246C28.1836 28.485 25.9326 31.8913 21.4956 35.146C18.4016 37.415 15.3437 38.7851 15.2137 38.8411L14.4718 39.1714L13.7299 38.8411C13.6017 38.7833 10.5438 37.415 7.44799 35.146C3.00916 31.8913 0.759962 28.4868 0.759962 25.0246V0.759962H28.1818V25.0228L28.1836 25.0246Z M19.251 25.5066L16.2714 28.4872V20.7682H8.5955L11.5761 17.7875H19.251V25.5066Z M13.6141 26.9653H10.0723V23.4235H13.6141V26.9653Z M26.4069 10.6357V24.9143C26.4069 31.781 14.5216 37.0627 14.5216 37.0627C14.435 37.0241 2.63531 31.754 2.63527 24.9143V10.6357H26.4069ZM7.41691 20.7661V29.6207H16.2714L22.6633 23.2287V14.3742H13.8088L7.41691 20.7661Z M12.3653 8.95323C11.7515 8.09399 10.7822 7.53981 9.69547 7.53981H2.63558V8.6951H9.69547C10.2533 8.6951 10.7641 8.91171 11.1612 9.26733H12.5638C12.5025 9.15902 12.4375 9.05251 12.3653 8.95323Z M14.5892 8.69695C14.434 8.33772 14.2444 7.99836 14.0242 7.68246C13.8003 7.35934 13.5458 7.06149 13.2624 6.79433C12.3039 5.88093 11.0403 5.32676 9.65937 5.32676H2.63558V6.48204H9.66117C10.8616 6.48204 11.9501 7.00373 12.7389 7.84853C13.0404 8.17165 13.2985 8.5399 13.5007 8.94425C13.553 9.04895 13.6 9.15726 13.6451 9.26737H14.8058C14.7444 9.07241 14.6722 8.88107 14.591 8.69695H14.5892Z M26.5029 4.15544V3.00016H19.6976C17.7336 3.00016 15.9393 3.79983 14.589 5.11036C13.237 3.79983 11.4463 3.00016 9.48231 3.00016H2.63543V4.15544H9.48231C11.1575 4.15544 12.6864 4.83237 13.8417 5.94433C14.1125 6.20427 14.3634 6.48768 14.5908 6.79275C14.8002 7.07254 14.988 7.36859 15.1558 7.68087C15.3689 8.07981 15.5458 8.50221 15.6829 8.94447C15.7154 9.05097 15.7461 9.15748 15.7732 9.26759H18.0188C18.4159 8.91017 18.9268 8.69536 19.4846 8.69536H26.5047V7.54007H19.4846C18.3961 7.54007 17.4285 8.09606 16.813 8.9553C16.7155 8.57442 16.5909 8.20436 16.4429 7.84875C17.2318 7.00575 18.3203 6.48407 19.2427 6.48407H26.5047V5.32878H19.5207C18.1397 5.32878 16.8761 5.88296 15.9158 6.79636C15.7407 6.50032 15.5476 6.21691 15.3382 5.94794C16.4935 4.83418 18.0242 4.15725 19.6994 4.15725H26.5047L26.5029 4.15544Z';

const MARKS = {
  sst: { viewBox: '0 0 36 40', outer: SST_OUTER, inner: SST_INNER, body: SST_BODY },
  ssb: { viewBox: '0 0 29 40', outer: SSB_OUTER, inner: SSB_INNER, body: SSB_BODY },
} as const;

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
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, size = 'sm', kind, label = 'Loading', ...props },
  ref,
) {
  const resolvedSize: SpinnerSize = size ?? 'sm';
  const resolvedKind: SpinnerKind = kind ?? defaultKind(resolvedSize);
  return (
    <span
      ref={ref}
      data-slot="spinner"
      data-size={resolvedSize}
      data-kind={resolvedKind}
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
        : (Object.keys(MARKS) as Array<keyof typeof MARKS>).map((brand) => {
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
Spinner.displayName = 'Spinner';
