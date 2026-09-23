'use client';

// Client: Radix ToggleGroup (roving focus, handlers), controllable state, and
// the travelling indicator is measured from the DOM in a layout effect.
import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';

/* ---------------------------------------------------------------------------
 * SegmentedControl, SegmentedControlItem
 *
 * A single-select switch on a sunken track: exactly ONE segment is always
 * active. It changes the view of one list ("All / Submitted / Graded"). Not
 * for more than four segments or labels longer than two words — it does not
 * scroll. If flipping it changes what the region IS rather than how much of
 * it you see, that is Tabs.
 *
 * Semantics: a radio group (Radix ToggleGroup `type="single"` renders
 * `role="radiogroup"` and `role="radio"` + `aria-checked` on each segment).
 * Tab enters on the checked segment; the arrow keys, Home and End move AND
 * select, as a radio group does; disabled segments are skipped. The preview
 * draws the same control as a `role="group"` of `aria-pressed` buttons; the
 * radio pattern is the one-of-N semantics that markup is standing in for.
 *
 * Exactly one: clicking the active segment again does nothing (Radix would
 * clear a single group; this one refuses the empty value). Never disable the
 * active segment — the control would appear to have nothing selected.
 *
 * The selection travels. The raised pill is ONE element on the track that
 * slides to the chosen segment over `--motion-duration-normal` on the
 * productive easing (a filter switch, not an entrance, so no overshoot). It is
 * measured from the live segment, so labels of different widths and a track
 * that reflows both stay right; a resize or a font swap re-measures WITHOUT
 * travel. Until it has measured (server render, first paint, a track laid out
 * at zero width) the active segment paints its own pill, so the control is
 * never shown with nothing selected. Under `prefers-reduced-motion` there is
 * no travel: the pill is simply somewhere else.
 * ------------------------------------------------------------------------- */

export const segmentedControlVariants = cva([
  'group/segmented relative isolate inline-flex max-w-full items-center gap-0.5 p-[3px]',
  'rounded-md border border-border-decorative bg-surface-sunken font-sans',
]);

export const segmentedControlItemVariants = cva([
  'relative z-[1] inline-flex h-[30px] min-w-0 shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3',
  'rounded-sm border-0 bg-transparent font-sans text-sm font-semibold leading-none whitespace-nowrap',
  'text-content-secondary outline-none',
  'transition-[color,background-color] duration-[var(--motion-duration-instant)] ease-productive-in-out',
  'motion-reduce:transition-none',
  'enabled:hover:text-content',
  'data-[state=on]:text-content',
  // The no-measure fallback: the active segment carries the pill itself.
  'data-[state=on]:bg-surface-raised data-[state=on]:shadow-raised',
  // Once the travelling pill is placed, it replaces the per-segment one.
  'group-data-[indicator]/segmented:data-[state=on]:bg-transparent',
  'group-data-[indicator]/segmented:data-[state=on]:shadow-none',
  'focus-visible:ring-[3px] focus-visible:ring-border-focus/50',
  // Unavailable, not merely unselected: disabled ink on the track's ground.
  'disabled:cursor-not-allowed disabled:bg-transparent disabled:text-content-disabled disabled:shadow-none',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
]);

type SegmentedControlContextValue = {
  /** Set by the root before a keyboard move, so the next focused segment is selected. */
  selectOnFocus: React.MutableRefObject<boolean>;
  select: (value: string) => void;
};

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null);

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const MOVE_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

type Rect = { x: number; y: number; w: number; h: number; animate: boolean };

export type SegmentedControlProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'dir' | 'onChange'
> & {
  /** The active segment's `value` (controlled). */
  value?: string;
  /**
   * The active segment at first (uncontrolled). Give one: a segmented control
   * always has a selection.
   */
  defaultValue?: string;
  /** Called with the newly active segment's `value`. Never called with an empty value. */
  onValueChange?: (value: string) => void;
  /**
   * Disables every segment.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Arrow keys wrap from the last segment to the first.
   *
   * @default true
   */
  loop?: boolean;
  /**
   * What the control switches, announced before its segments ("Roster
   * density"). Required in practice; use `aria-labelledby` when a visible
   * heading names it.
   */
  'aria-label'?: string;
};

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl(
    {
      className,
      value: valueProp,
      defaultValue,
      onValueChange,
      disabled = false,
      loop = true,
      children,
      onKeyDownCapture,
      onPointerDownCapture,
      ...props
    },
    forwardedRef,
  ) {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(forwardedRef, trackRef);

    const [value, setValue] = useControllableState<string>({
      prop: valueProp,
      defaultProp: defaultValue ?? '',
      onChange: onValueChange,
      caller: 'SegmentedControl',
    });

    const selectOnFocus = React.useRef(false);
    const select = React.useCallback(
      (next: string) => {
        // Exactly one: the empty value Radix sends on re-click is refused.
        if (next) setValue(next);
      },
      [setValue],
    );
    const context = React.useMemo(() => ({ selectOnFocus, select }), [select]);

    /* ---- the travelling indicator ---- */
    const [rect, setRect] = React.useState<Rect | null>(null);
    const placedValue = React.useRef<string | null>(null);

    const place = React.useCallback((animate: boolean) => {
      const track = trackRef.current;
      const active = track?.querySelector<HTMLElement>('[data-slot="segmented-control-item"][data-state="on"]');
      if (!track || !active || !track.offsetWidth || !active.offsetWidth) {
        setRect(null);
        return;
      }
      const next = {
        x: active.offsetLeft,
        y: active.offsetTop,
        w: active.offsetWidth,
        h: active.offsetHeight,
        animate,
      };
      setRect((prev) =>
        prev && prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
          ? prev.animate === animate
            ? prev
            : { ...prev, animate }
          : next,
      );
    }, []);

    // A selection change is the only thing that travels.
    useIsoLayoutEffect(() => {
      const first = placedValue.current === null;
      placedValue.current = value;
      place(!first);
    }, [value, place]);

    // A resize or a font swap is not a selection change: re-measure in place.
    React.useEffect(() => {
      const track = trackRef.current;
      if (!track) return undefined;
      let cancelled = false;
      const still = () => {
        if (!cancelled) place(false);
      };
      let ro: ResizeObserver | undefined;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(still);
        ro.observe(track);
        // The segments only: the indicator resizes on every move, and observing
        // it would turn each travel into a static re-placement.
        track
          .querySelectorAll('[data-slot="segmented-control-item"]')
          .forEach((item) => ro?.observe(item));
      }
      const fonts = typeof document !== 'undefined' ? (document as Document & { fonts?: FontFaceSet }).fonts : undefined;
      fonts?.ready?.then(still, () => undefined);
      return () => {
        cancelled = true;
        ro?.disconnect();
      };
    }, [place]);

    return (
      <SegmentedControlContext.Provider value={context}>
        <ToggleGroupPrimitive.Root
          ref={ref}
          type="single"
          data-slot="segmented-control"
          data-indicator={rect ? '' : undefined}
          value={value}
          onValueChange={select}
          disabled={disabled}
          loop={loop}
          orientation="horizontal"
          className={cn(segmentedControlVariants(), className)}
          // Radix moves focus a tick after the arrow key (setTimeout), so the
          // flag is set here and consumed by the segment that receives focus.
          // Any other key, and any pointer press, clears it.
          onKeyDownCapture={(event: React.KeyboardEvent<HTMLDivElement>) => {
            onKeyDownCapture?.(event);
            selectOnFocus.current = MOVE_KEYS.has(event.key);
          }}
          onPointerDownCapture={(event: React.PointerEvent<HTMLDivElement>) => {
            onPointerDownCapture?.(event);
            selectOnFocus.current = false;
          }}
          {...props}
        >
          <span
            aria-hidden="true"
            data-slot="segmented-control-indicator"
            data-animate={rect?.animate ? '' : undefined}
            className={cn(
              'pointer-events-none absolute top-0 left-0 z-0 rounded-sm bg-surface-raised shadow-raised',
              'opacity-0 group-data-[indicator]/segmented:opacity-100',
              'data-[animate]:transition-[transform,width,height]',
              'data-[animate]:duration-[var(--motion-duration-normal)] data-[animate]:ease-productive-in-out',
              'motion-reduce:data-[animate]:transition-none',
            )}
            style={
              rect
                ? { width: rect.w, height: rect.h, transform: `translate(${rect.x}px, ${rect.y}px)` }
                : undefined
            }
          />
          {children}
        </ToggleGroupPrimitive.Root>
      </SegmentedControlContext.Provider>
    );
  },
);
SegmentedControl.displayName = 'SegmentedControl';

export type SegmentedControlItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
  'value'
> & {
  /** This segment's value: what `onValueChange` reports when it is chosen. */
  value: string;
  /**
   * Makes this segment unavailable. Never disable the active one.
   *
   * @default false
   */
  disabled?: boolean;
};

export const SegmentedControlItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  SegmentedControlItemProps
>(function SegmentedControlItem({ className, value, onFocus, ...props }, ref) {
  const context = React.useContext(SegmentedControlContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-slot="segmented-control-item"
      value={value}
      className={cn(segmentedControlItemVariants(), className)}
      onFocus={(event: React.FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event);
        // Radio behaviour: a keyboard move selects as it focuses.
        if (context?.selectOnFocus.current) {
          context.selectOnFocus.current = false;
          context.select(value);
        }
      }}
      {...props}
    />
  );
});
SegmentedControlItem.displayName = 'SegmentedControlItem';
