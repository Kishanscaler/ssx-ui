import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Stack
 *
 * The one-dimensional spacing primitive: the PARENT owns the gap between its
 * children, which is why no child in this system carries a margin of its own.
 * If you are typing a margin, you wanted a Stack.
 *
 *   <Stack>                                   column, 16px (--space-4)
 *   <Stack gap="8">                           outer rhythm between groups
 *   <Stack direction="horizontal">            row, centred on the cross axis
 *   <Stack direction="horizontal" wrap gap="2">   a filter row that wraps
 *   <Stack direction="horizontal" justify="between">  label left, action right
 *
 * FIVE GAPS, on purpose: 2 · 4 (default) · 6 · 8 · 12, the `--space-*` rungs
 * the HTML preview approved. A short ladder is enough to express hierarchy and
 * few enough that two teams land on the same rung. Anything else is a
 * `className` escape hatch (`gap-3`), which a reviewer can see.
 *
 * Cross-axis default follows the preview: a column STRETCHES its children (the
 * flexbox default), a row CENTRES them. `align` overrides either.
 *
 * The root is `min-w-0`, so a Stack nested inside a horizontal Stack (the
 * avatar + two lines + action row) can shrink and let its text wrap instead of
 * pushing the row wider than the screen.
 *
 * POLYMORPHISM (the same rule on all five server layout primitives): `as` picks
 * a semantic element from a short list (`ul`, `nav`, `header`, ...); `asChild`
 * merges the recipe onto the one child you pass (a `<form>`, `next/link`, a
 * Radix part). `asChild` wins when both are set.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const stackVariants = cva('flex min-w-0', {
  variants: {
    direction: {
      vertical: 'flex-col',
      horizontal: 'flex-row',
    },
    gap: {
      '2': 'gap-2',
      '4': 'gap-4',
      '6': 'gap-6',
      '8': 'gap-8',
      '12': 'gap-12',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: {
      true: 'flex-wrap',
      false: '',
    },
  },
  defaultVariants: { direction: 'vertical', gap: '4', justify: 'start', wrap: false },
});

/** `vertical` a column (the default) · `horizontal` a row. */
export type StackDirection = 'vertical' | 'horizontal';
/** The five `--space-*` rungs. Numbers are accepted too (`gap={8}`). */
export type StackGap = '2' | '4' | '6' | '8' | '12';
/** Cross-axis alignment of the children. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
/** Main-axis distribution of the children. */
export type StackJustify = 'start' | 'center' | 'end' | 'between';
/** The elements a Stack may render as without `asChild`. */
export type StackElement =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'main'
  | 'nav'
  | 'ul'
  | 'ol'
  | 'li'
  | 'fieldset';

const GAPS: readonly string[] = ['2', '4', '6', '8', '12'];

export type StackProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * The main axis. `vertical` is a column; `horizontal` is a row whose
   * children are centred on the cross axis unless `align` says otherwise.
   *
   * @default 'vertical'
   */
  direction?: StackDirection;
  /**
   * The gap between children, as a `--space-*` rung: `2` 8px · `4` 16px ·
   * `6` 24px · `8` 32px · `12` 48px. A string or a number.
   *
   * @default '4'
   */
  gap?: StackGap | 2 | 4 | 6 | 8 | 12;
  /**
   * Cross-axis alignment. `start` in a row puts an avatar with the FIRST line
   * of a long block beside it; `end` sits a value and its unit on one bottom
   * edge. Unset: `stretch` for a column, `center` for a row.
   */
  align?: StackAlign;
  /**
   * Main-axis distribution. `between` pushes the first and last child to the
   * two ends (label left, action right) with no spacer element.
   *
   * @default 'start'
   */
  justify?: StackJustify;
  /**
   * Let children flow onto a second line instead of squeezing. For rows of
   * chips or tags whose count you do not control. The gap applies between
   * lines too.
   *
   * @default false
   */
  wrap?: boolean;
  /**
   * The element to render. `ul`/`ol` for a list of items, `nav`, `header`,
   * `footer` for landmarks. Ignored with `asChild`.
   *
   * @default 'div'
   */
  as?: StackElement;
  /**
   * Merge the Stack onto its single child instead of rendering an element:
   * `<Stack asChild gap="6"><form action="/apply">...</form></Stack>`.
   *
   * @default false
   */
  asChild?: boolean;
};

export const Stack = React.forwardRef<HTMLElement, StackProps>(function Stack(
  {
    className,
    direction = 'vertical',
    gap: gapProp = '4',
    align,
    justify = 'start',
    wrap = false,
    as = 'div',
    asChild = false,
    ...props
  },
  ref,
) {
  const gap = (GAPS.includes(String(gapProp)) ? String(gapProp) : '4') as StackGap;
  const resolvedAlign: StackAlign = align ?? (direction === 'horizontal' ? 'center' : 'stretch');
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp
      ref={ref}
      data-slot="stack"
      data-direction={direction}
      data-gap={gap}
      data-align={resolvedAlign}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      className={cn(stackVariants({ direction, gap, align: resolvedAlign, justify, wrap }), className)}
      {...props}
    />
  );
});
Stack.displayName = 'Stack';
