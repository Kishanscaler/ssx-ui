import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Section
 *
 * The vertical rhythm of a whole page: breathing room above and below one band
 * of content, and NOTHING ELSE. A Section never sets a width, a background or
 * horizontal padding: colour goes on a full-bleed parent, the measure comes
 * from a Container inside it.
 *
 *   <div className="bg-surface-brand-subtle">    full-bleed band (paints)
 *     <Section>                                  rhythm
 *       <Container>...</Container>               measure + gutter
 *     </Section>
 *   </div>
 *
 * THE THREE DENSITIES ARE THE PER-SURFACE RECIPES, not taste:
 *   roomy    96px (--space-24) · marketing and landing
 *   default  64px (--space-16) · the student LMS
 *   tight    32px (--space-8)  · admissions ops and every internal console
 * Below `sm` (672px) each drops a rung, 48 / 40 / 24px, because 96px of air on
 * a 360px phone is most of a viewport spent on nothing.
 *
 * It is padding, not margin, so two adjacent sections add up (a 128px seam at
 * the default) and nothing collapses unpredictably. Move a band to another
 * page and it arrives with the same rhythm.
 *
 * Renders `<section>` by default (the preview used a plain div). A section
 * with no accessible name is exposed as a generic group, so this costs
 * nothing; give it `aria-labelledby` pointing at its heading and it becomes a
 * region landmark. `as="div"` when it is not a thematic section at all.
 *
 * Polymorphism: `as` or `asChild`, the same rule as Stack. Server component.
 * ------------------------------------------------------------------------- */

export const sectionVariants = cva('min-w-0', {
  variants: {
    density: {
      tight: 'py-6 sm:py-8',
      default: 'py-10 sm:py-16',
      roomy: 'py-12 sm:py-24',
    },
  },
  defaultVariants: { density: 'default' },
});

/** `tight` ops/admin · `default` student LMS · `roomy` marketing. */
export type SectionDensity = 'tight' | 'default' | 'roomy';
/** The elements a Section may render as without `asChild`. */
export type SectionElement = 'section' | 'div' | 'header' | 'footer' | 'main' | 'article' | 'aside';

export type SectionProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * Vertical padding, one rung per surface: `tight` 32px (24px on a phone)
   * for admissions ops and admin consoles, `default` 64px (40px) for the
   * student LMS, `roomy` 96px (48px) for marketing and landing pages.
   *
   * @default 'default'
   */
  density?: SectionDensity;
  /**
   * The element to render. Ignored with `asChild`.
   *
   * @default 'section'
   */
  as?: SectionElement;
  /**
   * Merge the Section onto its single child instead of rendering an element.
   *
   * @default false
   */
  asChild?: boolean;
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(function Section(
  { className, density = 'default', as = 'section', asChild = false, ...props },
  ref,
) {
  const Comp: React.ElementType = asChild ? Slot : as;
  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="section"
      data-density={density}
      className={cn(sectionVariants({ density }), className)}
      {...props}
    />
  );
});
Section.displayName = 'Section';
