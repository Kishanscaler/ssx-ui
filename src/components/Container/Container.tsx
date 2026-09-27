import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Container · ContainerBleed
 *
 * The horizontal counterpart to Section: it caps the measure, centres it, and
 * holds the page gutter so text never touches the edge of a phone. It has no
 * vertical padding (pair it with Section) and it NEVER PAINTS: a tinted band
 * is a full-bleed parent with the Container inside it, never the other way
 * round, or the tint stops at 1280px and looks broken on a wide screen.
 *
 *   <Container>                   80rem (--size-container-max, 1280px)
 *   <Container width="narrow">    72ch, the prose measure (a policy page)
 *   <Container width="wide">      1584px (--container-max-width-wide), dashboards and wide tables
 *
 * THE GUTTER is `px-gutter` (--space-gutter): 16px on a phone, 24px from
 * `sm`. The preview wrote a fixed 16px; the package's page-gutter rule (README,
 * "The page gutter", decided after the preview) is what an element that owns
 * the page edge uses, and a Container is exactly that element.
 *
 * `ContainerBleed` is the one child that escapes the measure to the full
 * viewport width while its siblings stay on it: `margin-inline: calc(50% -
 * 50vw)`. It is measured against the VIEWPORT, so it is right on a centred
 * marketing page and wrong inside a side-nav app shell, where the pane is not
 * centred and the bleed overshoots; use `width="wide"` there. `vw` includes a
 * classic (non-overlay) scrollbar, so on a desktop with one the bleed is that
 * scrollbar wider than the page; the page root should clip x-overflow.
 *
 * Polymorphism: `as` or `asChild`, the same rule as Stack. Server components.
 * ------------------------------------------------------------------------- */

export const containerVariants = cva('mx-auto w-full min-w-0 px-gutter', {
  variants: {
    width: {
      // `--size-measure-max` (72ch, decided 2026-09-27): the one prose measure,
      // shared with chat messages and BottomSheet's full size.
      narrow: 'max-w-(--size-measure-max)',
      default: 'max-w-(--size-container-max)',
      wide: 'max-w-(--container-max-width-wide)',
    },
  },
  defaultVariants: { width: 'default' },
});

export const containerBleedVariants = cva('mx-[calc(50%-100vw/2)] max-w-none');

/** `narrow` 72ch prose · `default` 1280px · `wide` 1584px. */
export type ContainerWidth = 'narrow' | 'default' | 'wide';
/** The elements a Container may render as without `asChild`. */
export type ContainerElement = 'div' | 'main' | 'header' | 'footer' | 'section' | 'article' | 'nav';
/** The elements a ContainerBleed may render as without `asChild`. */
export type ContainerBleedElement = 'div' | 'figure' | 'section' | 'aside';

export type ContainerProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * The maximum measure. `narrow` 72ch (`--size-measure-max`) for long-form prose (fee policies,
   * case studies), `default` 1280px, `wide` 1584px where there is no reading
   * measure to protect (a nine-column applicant table).
   *
   * @default 'default'
   */
  width?: ContainerWidth;
  /**
   * The element to render. `main` for the page's main content. Ignored with
   * `asChild`.
   *
   * @default 'div'
   */
  as?: ContainerElement;
  /**
   * Merge the Container onto its single child instead of rendering an element.
   *
   * @default false
   */
  asChild?: boolean;
};

export type ContainerBleedProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * The element to render. `figure` for a hero image with a caption. Ignored
   * with `asChild`.
   *
   * @default 'div'
   */
  as?: ContainerBleedElement;
  /**
   * Put the bleed on the child you pass instead of wrapping it:
   * `<ContainerBleed asChild><AspectRatio ratio="21:9">...</AspectRatio></ContainerBleed>`.
   *
   * @default false
   */
  asChild?: boolean;
};

export const Container = React.forwardRef<HTMLElement, ContainerProps>(function Container(
  { className, width = 'default', as = 'div', asChild = false, ...props },
  ref,
) {
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="container"
      data-width={width}
      className={cn(containerVariants({ width }), className)}
      {...props}
    />
  );
});
Container.displayName = 'Container';

export const ContainerBleed = React.forwardRef<HTMLElement, ContainerBleedProps>(function ContainerBleed(
  { className, as = 'div', asChild = false, ...props },
  ref,
) {
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp ref={ref as React.Ref<HTMLDivElement>} data-slot="container-bleed" className={cn(containerBleedVariants(), className)} {...props} />
  );
});
ContainerBleed.displayName = 'ContainerBleed';
