import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { CheckGlyph, ExclamationGlyph } from '../Alert/status-glyphs';

/* ---------------------------------------------------------------------------
 * Stepper
 *
 * Where someone is in a sequence with a FIXED order and a known end: an
 * application wizard, an admissions pipeline. Horizontal for a short wizard on
 * one screen; vertical when each step needs a sentence of explanation. Not a
 * checklist (no order) and not navigation: the steps are not links here — a
 * wizard that lets you jump back renders its own `<a>` / `<button>` in the
 * label.
 *
 * STATES DIFFER IN SHAPE, NOT ONLY HUE (WCAG 1.4.1, and in SSB the brand and
 * success ramps are both green):
 *   complete  solid success disc with a check; its connector turns success
 *   current   solid inverse disc inside a concentric ring, label semibold,
 *             `aria-current="step"` on the item
 *   upcoming  hollow ring, no fill, label secondary
 *   error     solid danger disc with an exclamation mark (not in the HTML
 *             reference; added for a step that failed validation)
 * Complete and error also carry a visually hidden word (`statusLabel`), so a
 * screen reader hears the state, not just the label.
 *
 * NUMBERS are a CSS counter, so a Server Component can render the items in
 * any wrapper (a `.map()`, a fragment) and they still count 1, 2, 3. The
 * `<ol>` carries the same order for assistive tech.
 *
 *   <Stepper currentStep={3} steps={[{ label: 'Personal details' }, …]} />   flat (Storyblok)
 *
 *   <Stepper orientation="vertical">
 *     <StepperItem status="complete" label="Submission" description="…" meta={<Badge tone="success">Submitted</Badge>} />
 *     <StepperItem status="current" label="Interview Round" />
 *   </Stepper>
 *
 * Below the `sm` breakpoint (672px) a horizontal stepper stacks vertically,
 * as the HTML does, rather than crushing its labels.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const stepperVariants = cva(
  'group/stepper m-0 flex list-none p-0 font-sans [counter-reset:ssx-step]',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row max-sm:flex-col',
        vertical: 'flex-col',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
);

type StepperVariantProps = VariantProps<typeof stepperVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type StepperOrientation = NonNullable<StepperVariantProps['orientation']>;
export type StepperStatus = 'complete' | 'current' | 'upcoming' | 'error';

export const stepperIndicatorVariants = cva(
  [
    'box-border grid size-[1.75rem] shrink-0 place-content-center rounded-full border border-transparent',
    'text-xs leading-none font-bold',
    "[&_svg:not([class*='size-'])]:size-icon-sm",
  ],
  {
    variants: {
      status: {
        complete: 'bg-success text-success-on-solid',
        // The halo is an outline, so it never moves the connector or labels.
        current:
          'bg-surface-inverse text-content-inverse outline-2 outline-offset-2 outline-surface-inverse',
        upcoming: 'border-border-strong bg-transparent font-semibold text-content-secondary',
        error: 'bg-danger text-danger-on-solid',
      },
    },
    defaultVariants: { status: 'upcoming' },
  },
);

/** The word a screen reader hears for each state, unless `statusLabel` is passed. */
export const stepperStatusLabels: Record<StepperStatus, string> = {
  complete: 'Completed',
  current: '',
  upcoming: '',
  error: 'Needs attention',
};

/* ---- parts ---------------------------------------------------------------- */

export type StepperLabelProps = React.HTMLAttributes<HTMLSpanElement>;

/**
 * The step's name. 13px in a horizontal stepper, the h3 size in a vertical
 * one; secondary while upcoming, semibold while current.
 */
export const StepperLabel = React.forwardRef<HTMLSpanElement, StepperLabelProps>(function StepperLabel(
  { className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-slot="stepper-label"
      className={cn(
        'text-sm text-content',
        'group-data-[orientation=vertical]/stepper:type-h3',
        'group-data-[status=upcoming]/step:text-content-secondary',
        'group-data-[status=current]/step:font-semibold',
        className,
      )}
      {...props}
    />
  );
});
StepperLabel.displayName = 'StepperLabel';

export type StepperDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/** The line (or paragraph) under the label: 12px horizontal, 13px vertical, secondary. */
export const StepperDescription = React.forwardRef<HTMLParagraphElement, StepperDescriptionProps>(
  function StepperDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        data-slot="stepper-description"
        className={cn(
          'm-0 text-xs text-content-secondary',
          'group-data-[orientation=vertical]/stepper:type-body-sm',
          className,
        )}
        {...props}
      />
    );
  },
);
StepperDescription.displayName = 'StepperDescription';

export type StepperItemProps = Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> & {
  /**
   * Where this step stands. `current` sets `aria-current="step"`.
   *
   * @default 'upcoming'
   */
  status?: StepperStatus;
  /** The step's name, as a flat field. Renders a `StepperLabel`. */
  label?: React.ReactNode;
  /** One line (horizontal) or a paragraph (vertical) under the label. */
  description?: React.ReactNode;
  /** Anything under the description, typically a dated `Badge`. */
  meta?: React.ReactNode;
  /**
   * Replaces the indicator's content (the number, check or exclamation mark).
   * Decorative: the indicator is `aria-hidden`.
   */
  marker?: React.ReactNode;
  /**
   * The visually hidden word announced after the label. Pass `''` when the
   * visible description already says it ("Completed").
   *
   * @default 'Completed' for complete, 'Needs attention' for error, none otherwise
   */
  statusLabel?: string;
};

export const StepperItem = React.forwardRef<HTMLLIElement, StepperItemProps>(function StepperItem(
  { className, status = 'upcoming', label, description, meta, marker, statusLabel, children, ...props },
  ref,
) {
  const glyph =
    marker !== undefined ? (
      marker
    ) : status === 'complete' ? (
      <CheckGlyph />
    ) : status === 'error' ? (
      <ExclamationGlyph />
    ) : null;
  const srLabel = statusLabel ?? stepperStatusLabels[status] ?? '';

  return (
    <li
      ref={ref}
      data-slot="stepper-item"
      data-status={status}
      aria-current={status === 'current' ? 'step' : undefined}
      className={cn(
        'group/step flex min-w-0 flex-1 gap-3 [counter-increment:ssx-step]',
        'group-data-[orientation=vertical]/stepper:flex-row',
        'group-data-[orientation=horizontal]/stepper:flex-col group-data-[orientation=horizontal]/stepper:items-start group-data-[orientation=horizontal]/stepper:gap-2',
        'max-sm:group-data-[orientation=horizontal]/stepper:flex-row max-sm:group-data-[orientation=horizontal]/stepper:items-stretch max-sm:group-data-[orientation=horizontal]/stepper:gap-3',
        className,
      )}
      {...props}
    >
      <span
        data-slot="stepper-marker"
        className={cn(
          'flex flex-col items-center',
          'group-data-[orientation=horizontal]/stepper:w-full group-data-[orientation=horizontal]/stepper:flex-row',
          'max-sm:group-data-[orientation=horizontal]/stepper:w-auto max-sm:group-data-[orientation=horizontal]/stepper:flex-col',
        )}
      >
        <span
          data-slot="stepper-indicator"
          aria-hidden="true"
          className={cn(
            stepperIndicatorVariants({ status }),
            glyph == null && 'before:content-[counter(ssx-step)]',
          )}
        >
          {glyph}
        </span>
        <span
          data-slot="stepper-line"
          aria-hidden="true"
          className={cn(
            'my-2 min-h-4 w-0.5 flex-1 bg-border-decorative',
            'group-last/step:hidden group-data-[status=complete]/step:bg-success',
            'group-data-[orientation=horizontal]/stepper:mx-2 group-data-[orientation=horizontal]/stepper:my-0 group-data-[orientation=horizontal]/stepper:h-0.5 group-data-[orientation=horizontal]/stepper:min-h-0 group-data-[orientation=horizontal]/stepper:w-auto',
            'max-sm:group-data-[orientation=horizontal]/stepper:mx-0 max-sm:group-data-[orientation=horizontal]/stepper:my-2 max-sm:group-data-[orientation=horizontal]/stepper:h-auto max-sm:group-data-[orientation=horizontal]/stepper:min-h-4 max-sm:group-data-[orientation=horizontal]/stepper:w-0.5',
          )}
        />
      </span>
      <div
        data-slot="stepper-body"
        className={cn(
          'grid min-w-0 content-start justify-items-start leading-loose',
          'group-data-[orientation=vertical]/stepper:gap-2 group-data-[orientation=vertical]/stepper:pb-5',
          'group-data-[orientation=horizontal]/stepper:gap-1 group-data-[orientation=horizontal]/stepper:pr-4',
          'max-sm:group-data-[orientation=horizontal]/stepper:pb-5',
        )}
      >
        {label != null && label !== '' ? <StepperLabel>{label}</StepperLabel> : null}
        {description != null && description !== '' ? (
          <StepperDescription>{description}</StepperDescription>
        ) : null}
        {meta != null && meta !== '' ? <span data-slot="stepper-meta">{meta}</span> : null}
        {children}
        {srLabel ? <span className="sr-only">{`, ${srLabel}`}</span> : null}
      </div>
    </li>
  );
});
StepperItem.displayName = 'StepperItem';

/* ---- root ----------------------------------------------------------------- */

/** One step of the flat `steps` field (a Storyblok nested blok). */
export type StepperStep = {
  /** The step's name. */
  label: React.ReactNode;
  /** The line under it. */
  description?: React.ReactNode;
  /** Anything under the description (a `Badge`). */
  meta?: React.ReactNode;
  /** An explicit state. Unset: derived from `currentStep`. */
  status?: StepperStatus;
  /** A stable React key. Unset: the index. */
  key?: React.Key;
};

export type StepperProps = React.OlHTMLAttributes<HTMLOListElement> &
  StepperVariantProps & {
    /**
     * `horizontal` a short wizard across one screen (stacks below 672px) ·
     * `vertical` a sequence whose steps each need a sentence.
     *
     * @default 'horizontal'
     */
    orientation?: StepperOrientation;
    /**
     * Flat steps. Rendered as `StepperItem`s before any children.
     */
    steps?: StepperStep[];
    /**
     * With `steps`: the CURRENT step, counting from 1 like the visible
     * numbers. Earlier steps are complete, later ones upcoming; a step's own
     * `status` wins. `0` means nothing started; a value past the last step
     * means everything is complete.
     *
     * @default 1
     */
    currentStep?: number;
  };

export const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  { className, orientation = 'horizontal', steps, currentStep = 1, children, ...props },
  ref,
) {
  return (
    <ol
      ref={ref}
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(stepperVariants({ orientation }), className)}
      {...props}
    >
      {steps?.map((step, index) => {
        const n = index + 1;
        const derived: StepperStatus = n < currentStep ? 'complete' : n === currentStep ? 'current' : 'upcoming';
        return (
          <StepperItem
            key={step.key ?? index}
            status={step.status ?? derived}
            label={step.label}
            description={step.description}
            meta={step.meta}
          />
        );
      })}
      {children}
    </ol>
  );
});
Stepper.displayName = 'Stepper';
