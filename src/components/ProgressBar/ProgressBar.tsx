import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * ProgressBar
 *
 * Determinate progress through a task with a knowable end: modules completed,
 * a file uploading. With no `value` it is indeterminate — use that only when
 * the duration is genuinely unknown, and a Spinner when there is no notion of
 * "how far" at all.
 *
 * Built on a plain `role="progressbar"` rather than Radix Progress, because
 * Radix Progress has no `min` and the product needs one ("4 of 12 modules"
 * in its own units). ARIA is the source of truth: the fill is derived from
 * `value` against `min`/`max` and nothing else, so the bar cannot drift from
 * what a screen reader announces. Indeterminate omits `aria-valuenow`, which
 * is how "unknown" is expressed.
 *
 * Needs a name: `aria-label`, or `aria-labelledby` pointing at the visible
 * label. `aria-valuetext` says it in words ("Module 4 of 12 complete").
 *
 * Server atom: no hooks, no handlers, so no directive.
 * ------------------------------------------------------------------------- */

export const progressBarVariants = cva(
  'relative block h-2 w-full overflow-hidden rounded-full bg-surface-active',
);

export type ProgressBarState = 'indeterminate' | 'loading' | 'complete';

export type ProgressBarProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * Current value, in the same units as `min`/`max`. Clamped to that range.
   * `null` or omitted = indeterminate.
   */
  value?: number | null;
  /**
   * Lower bound.
   *
   * @default 0
   */
  min?: number;
  /**
   * Upper bound.
   *
   * @default 100
   */
  max?: number;
};

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
  { className, value = null, min = 0, max = 100, ...props },
  ref,
) {
  const indeterminate = value == null || !Number.isFinite(value);
  const span = max - min;
  const clamped = indeterminate ? min : Math.min(max, Math.max(min, value as number));
  const percent = indeterminate || span <= 0 ? 0 : ((clamped - min) / span) * 100;
  const state: ProgressBarState = indeterminate
    ? 'indeterminate'
    : clamped >= max
      ? 'complete'
      : 'loading';

  return (
    <div
      ref={ref}
      role="progressbar"
      data-slot="progress-bar"
      data-state={state}
      data-value={indeterminate ? undefined : clamped}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : clamped}
      className={cn(progressBarVariants(), className)}
      {...props}
    >
      <div
        data-slot="progress-bar-indicator"
        className={cn(
          'h-full rounded-full bg-action-primary',
          indeterminate
            ? 'w-[35%] animate-ssx-progress-indeterminate motion-reduce:animate-none'
            : [
                'w-full',
                'transition-transform duration-(--motion-duration-slow) ease-productive-in-out motion-reduce:transition-none',
              ],
        )}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - percent}%)` }}
      />
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';
