'use client';

// Client: Radix Slider keeps the value and runs the pointer and keyboard model.
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Slider
 *
 * An approximate value on a continuous range, where relative position matters
 * more than the exact figure. A precise figure is a NumberInput (or both,
 * bound together). One thumb, or two for a range ("fee filter").
 *
 * Naming. Radix's thumbs are `<span role="slider">`, which a `<label htmlFor>`
 * cannot reach, so the name has to be put on each thumb:
 *   - `thumbLabels` — one `aria-label` per thumb. Required in spirit for a
 *     range ("Minimum annual fee", "Maximum annual fee"): two thumbs with the
 *     same name cannot be told apart.
 *   - `aria-label` on a single-thumb Slider goes to its thumb.
 *   - `aria-labelledby` / `aria-describedby` on the Slider are forwarded to
 *     every thumb, so a visible field label names a single-thumb slider.
 * `getAriaValueText` gives a formatted announcement ("₹3 lakh", "16 hours").
 *
 * The thumb is a grip (a capsule with two rules), not a dot: it says "take
 * hold of this". It rides a 3px rail in border-control (surface-active was
 * invisible in dark) and carries a page-coloured ring so it does not dissolve
 * into the filled track. Radix insets the thumb by half its width at each end,
 * which is exactly the arithmetic the HTML's tooltip script does.
 *
 * `tooltip` shows the value above each thumb: on hover, focus or drag
 * (`interaction`), held open (`always`), or not at all (`never`, the default).
 * `formatValue` formats the bubble. The bubble is decorative (`aria-hidden`);
 * the thumb's own value is what is announced.
 * ------------------------------------------------------------------------- */

/** Thumb width in px: `w-5` (`--space-5`). The tooltip geometry depends on it. */
const THUMB_W = 20;
/** Fraction of the range under which a pair's bubbles splay apart. */
const SPLAY = 0.15;
/** Half the gap between two splayed bubbles, and the caret's inset from a bubble edge. */
const GAP = 3;
const CARET_INSET = 8;

export const sliderVariants = cva(
  [
    'group/slider relative flex w-full touch-none select-none items-center',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-disabled',
  ],
  {
    variants: {
      tooltip: {
        never: 'h-5',
        // The bubble hangs above the rail, so its clearance is reserved at all
        // times: nothing shifts when it appears.
        interaction: 'mt-5 h-7',
        always: 'mt-5 h-7',
      },
    },
    defaultVariants: { tooltip: 'never' },
  },
);

type SliderVariantProps = VariantProps<typeof sliderVariants>;

export type SliderTooltip = NonNullable<SliderVariantProps['tooltip']>;

export type SliderProps = Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onValueChange'
> &
  SliderVariantProps & {
    /** Controlled value: one number per thumb. */
    value?: number[];
    /**
     * Uncontrolled starting value: one number per thumb. The number of entries
     * is the number of thumbs.
     *
     * @default [min]
     */
    defaultValue?: number[];
    /** Called on every change while dragging or stepping. */
    onValueChange?: (value: number[]) => void;
    /**
     * One accessible name per thumb, in value order. Put on each thumb as
     * `aria-label`.
     */
    thumbLabels?: string[];
    /**
     * A formatted spoken value for a thumb (`aria-valuetext`), e.g.
     * `(v) => \`₹${v} lakh\``.
     */
    getAriaValueText?: (value: number, index: number) => string;
    /**
     * Formats the value tooltip. Defaults to the plain number.
     */
    formatValue?: (value: number, index: number) => React.ReactNode;
  };

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider(
  {
    className,
    tooltip = 'never',
    value: valueProp,
    defaultValue,
    onValueChange,
    min = 0,
    max = 100,
    thumbLabels,
    getAriaValueText,
    formatValue,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    ...props
  },
  ref,
) {
  const [values, setValues] = useControllableState<number[]>({
    prop: valueProp,
    defaultProp: defaultValue ?? [min],
    onChange: onValueChange,
    caller: 'Slider',
  });

  // Thumb centre, in the same terms Radix positions the thumb: `p%` plus the
  // in-bounds offset that keeps a THUMB_W-wide thumb inside the rail
  // (Radix `getThumbInBoundsOffset`, LTR). The tooltip layer is positioned from
  // this, so a bubble lands on its grip at 0 and at max too.
  const span = max - min;
  const pct = (v: number) => (span > 0 ? ((v - min) / span) * 100 : 0);
  const centre = (v: number) => {
    const p = pct(v);
    return `calc(${p}% + ${THUMB_W / 2 - (p / 50) * (THUMB_W / 2)}px)`;
  };

  // Two handles close together would stack their bubbles, and two stacked
  // tooltips are worse than none: you cannot tell floor from ceiling. Within
  // SPLAY of the range the pair are pushed apart symmetrically, meeting at the
  // midpoint between the thumbs, and each caret keeps pointing at its own grip.
  const pair = values.length === 2;
  const lowIndex = pair && (values[0] ?? 0) > (values[1] ?? 0) ? 1 : 0;
  const splay =
    pair && span > 0 && Math.abs((values[1] ?? 0) - (values[0] ?? 0)) / span < SPLAY;
  const mid = pair ? `((${centre(values[0] ?? 0)} + ${centre(values[1] ?? 0)}) / 2)` : '0px';

  const bubbleStyle = (v: number, i: number): React.CSSProperties => {
    if (!splay) return { left: centre(v), transform: 'translateX(-50%)' };
    return i === lowIndex
      ? { right: `calc(100% - ${mid} + ${GAP}px)` }
      : { left: `calc(${mid} + ${GAP}px)` };
  };
  const caretStyle = (v: number, i: number): React.CSSProperties => {
    if (!splay) return { left: centre(v) };
    // Clamped so the caret stays under its own bubble when the thumbs touch.
    return i === lowIndex
      ? { left: `min(${centre(v)}, calc(${mid} - ${GAP + CARET_INSET}px))` }
      : { left: `max(${centre(v)}, calc(${mid} + ${GAP + CARET_INSET}px))` };
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider"
      data-tooltip={tooltip}
      min={min}
      max={max}
      value={values}
      onValueChange={setValues}
      className={cn(sliderVariants({ tooltip }), className)}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-border-control"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full rounded-full bg-action-primary"
        />
      </SliderPrimitive.Track>
      {values.map((v, i) => (
        <SliderPrimitive.Thumb
          // Thumbs are positional; the index is their identity.
          key={i}
          data-slot="slider-thumb"
          aria-label={thumbLabels?.[i] ?? (values.length === 1 ? ariaLabel : undefined)}
          aria-labelledby={thumbLabels?.[i] ? undefined : labelledBy}
          aria-describedby={describedBy}
          aria-valuetext={getAriaValueText ? getAriaValueText(v, i) : undefined}
          className={cn(
            'group/thumb relative flex h-[22px] w-5 items-center justify-center gap-[5px]',
            'rounded-lg border-2 border-page bg-action-primary shadow-raised',
            'cursor-grab outline-none',
            'transition-[background-color,box-shadow] duration-(--motion-duration-instant) ease-productive-in-out',
            'motion-reduce:transition-none',
            'hover:bg-action-primary-hover hover:shadow-overlay',
            'active:cursor-grabbing active:bg-action-primary-active active:shadow-overlay',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
            // The thumb last touched sits on top, so two thumbs resting on one
            // value can always be pulled apart again.
            'focus:z-raised',
            'data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed',
          )}
        >
          <span aria-hidden="true" className="h-2 w-px bg-content-on-brand-solid" />
          <span aria-hidden="true" className="h-2 w-px bg-content-on-brand-solid" />
        </SliderPrimitive.Thumb>
      ))}
      {tooltip === 'never' ? null : (
        // One layer over the rail. Decorative: the thumbs carry the values.
        <span
          data-slot="slider-tooltips"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-full mb-0.5',
            'transition-[opacity,translate] duration-(--motion-duration-fast) ease-productive-in-out motion-reduce:transition-none',
            tooltip === 'always'
              ? 'opacity-100'
              : [
                  'translate-y-1 opacity-0',
                  'group-hover/slider:translate-y-0 group-hover/slider:opacity-100',
                  'group-focus-within/slider:translate-y-0 group-focus-within/slider:opacity-100',
                ],
          )}
        >
          {values.map((v, i) => (
            <React.Fragment key={i}>
              <span
                data-slot="slider-tooltip"
                data-splay={splay ? (i === lowIndex ? 'start' : 'end') : undefined}
                className={cn(
                  'absolute bottom-1 z-tooltip rounded-sm bg-surface-inverse px-2 py-1.5',
                  'text-xs leading-none font-semibold whitespace-nowrap text-content-inverse tabular-nums',
                )}
                style={bubbleStyle(v, i)}
              >
                {formatValue ? formatValue(v, i) : v}
              </span>
              <span
                data-slot="slider-tooltip-caret"
                className="absolute bottom-0 z-tooltip -ml-1 border-x-4 border-t-4 border-x-transparent border-t-surface-inverse"
                style={caretStyle(v, i)}
              />
            </React.Fragment>
          ))}
        </span>
      )}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = 'Slider';
