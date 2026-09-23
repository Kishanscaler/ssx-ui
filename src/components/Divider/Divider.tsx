import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Divider
 *
 * A line between two things that are ALREADY spatially separated. Reach for
 * spacing first: if a divider is the only thing keeping two groups apart, the
 * layout is doing too little work.
 *
 *   <Divider />                          decorative rule (default)
 *   <Divider decorative={false} />       a semantic <hr> (role separator)
 *   <Divider orientation="vertical" />   between toolbar clusters or metrics
 *   <Divider>or continue with</Divider>  a labelled divider
 *
 * Decorative (the default) renders `<div role="none">`, which assistive tech
 * skips. `decorative={false}` renders `<hr>`, announced as a separator.
 *
 * WITH CHILDREN it is the labelled form ("or continue with", a date separator
 * in a chat): a flex row with a rule either side. It is NOT a separator then —
 * the words are content a screen reader should read — so it renders a plain
 * `<div>` with the text, and the rules are `aria-hidden`. A long label shrinks
 * the rules, and wraps only once they are gone.
 *
 * The vertical divider needs a stretching flex parent: it has no height of
 * its own (`self-stretch`), so in a block container it renders nothing.
 *
 * Radix Separator adds nothing here (and is marked client). Server atom.
 * ------------------------------------------------------------------------- */

export const dividerVariants = cva('shrink-0 border-0 bg-border-decorative', {
  variants: {
    orientation: {
      // The HTML's own rhythm: 16px either side, across the flow.
      horizontal: 'my-4 h-px w-full',
      vertical: 'mx-4 w-px self-stretch',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export type DividerOrientation = 'horizontal' | 'vertical';

export type DividerProps = React.HTMLAttributes<HTMLElement> & {
  /**
   * @default 'horizontal'
   */
  orientation?: DividerOrientation;
  /**
   * `true`: purely visual, skipped by assistive tech (`<div role="none">`).
   * `false`: a semantic thematic break (`<hr>`, role separator). Ignored for
   * the labelled form, which is always read.
   *
   * @default true
   */
  decorative?: boolean;
  /** A centred label. Makes this the labelled form (horizontal only). */
  children?: React.ReactNode;
};

export const Divider = React.forwardRef<HTMLElement, DividerProps>(function Divider(
  { className, orientation = 'horizontal', decorative = true, children, ...props },
  ref,
) {
  if (children != null && children !== false && children !== '') {
    const rule = (
      <span aria-hidden="true" data-slot="divider-rule" className="h-px min-w-0 flex-1 bg-border-decorative" />
    );
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        data-slot="divider"
        data-variant="label"
        data-orientation="horizontal"
        className={cn(
          'flex items-center gap-3 font-sans text-xs font-semibold text-content-secondary',
          className,
        )}
        {...props}
      >
        {rule}
        <span data-slot="divider-label" className="min-w-0 text-center">
          {children}
        </span>
        {rule}
      </div>
    );
  }

  const shared = {
    'data-slot': 'divider',
    'data-variant': 'rule',
    'data-orientation': orientation,
    className: cn(dividerVariants({ orientation }), className),
  };

  if (decorative) {
    return <div ref={ref as React.Ref<HTMLDivElement>} role="none" {...shared} {...props} />;
  }
  return (
    <hr
      ref={ref as React.Ref<HTMLHRElement>}
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      {...shared}
      {...props}
    />
  );
});
Divider.displayName = 'Divider';
