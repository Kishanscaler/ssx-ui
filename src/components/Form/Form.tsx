'use client';

// Client: Form attaches the submit handler and moves focus in an effect.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { findErrorSummary, findFirstInvalid, focusableFor } from './focus';

/* ---------------------------------------------------------------------------
 * Form
 *
 * A `<form>` that makes a failed submit land somewhere: the error summary
 * when one is rendered, otherwise the first invalid field. It does not own
 * values, rules or messages, so it works under plain state, react-hook-form
 * and server actions alike; those decide what is wrong, and Form decides
 * where focus goes once they have said so.
 *
 * What happens on submit:
 *
 *   1. Native constraints (`required`, `type="email"`, `min` / `max`,
 *      `pattern` ON THE CONTROL — Field's `required` only sets
 *      `aria-required`) are checked, unless `constraintValidation={false}`.
 *      If any fail, the submit is cancelled (`onSubmit` and a React 19
 *      `action` do not run) and:
 *        - with `onInvalidSubmit`: it gets the failures as `FormError[]`
 *          (`fieldId` + the browser's `validationMessage`), so you can
 *          render your FieldErrors and a FormErrorSummary. No browser
 *          bubble is shown.
 *        - without it: `reportValidity()` shows the browser's own message
 *          on the first failure, so the person is never left with focus on
 *          a field and no reason.
 *   2. Otherwise `onSubmit` runs as usual (validate there, set your errors).
 *   3. After React commits what the handler set, focus moves to the
 *      FormErrorSummary inside the form if there is one, else the first
 *      `aria-invalid="true"` control, else nowhere (the submit succeeded).
 *
 * `noValidate` is ON by default: the browser's bubbles are unstyleable,
 * appear one at a time, vanish on scroll, and say nothing a FieldError
 * cannot. Constraint checking still happens (step 1). Pass
 * `noValidate={false}` to hand validation back to the browser entirely (it
 * then blocks the submit itself and this component only does step 3).
 *
 * Async validation (react-hook-form's `handleSubmit`, a server action):
 * errors arrive after step 3 has looked. A FormErrorSummary focuses itself
 * when it appears, so render one and nothing else is needed. Without a
 * summary, rely on react-hook-form's own `shouldFocusError`, and set
 * `focusOnError={false}` here if its focus and ours would disagree.
 * ------------------------------------------------------------------------- */

/** One entry in a FormErrorSummary, and what `onInvalidSubmit` hands you. */
export type FormError = {
  /**
   * The `id` of the control the message is about; the summary links to
   * `#fieldId` and focuses it. Omit for a form-level error ("Payment
   * failed"), which is listed without a link.
   */
  fieldId?: string;
  /** The message: what to do, not only what is wrong. */
  message: React.ReactNode;
};

/** The event `onSubmit` receives (named per React version's types). */
type FormSubmitEvent = Parameters<NonNullable<React.ComponentPropsWithoutRef<'form'>['onSubmit']>>[0];

type ConstraintElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function constraintFailures(form: HTMLFormElement): ConstraintElement[] {
  const out: ConstraintElement[] = [];
  const elements = form.elements;
  for (let i = 0; i < elements.length; i += 1) {
    const el = elements[i] as ConstraintElement;
    if (el.willValidate && el.validity && !el.validity.valid) out.push(el);
  }
  return out;
}

export const formVariants = cva('grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 font-sans');

export type FormProps = React.ComponentPropsWithoutRef<'form'> & {
  /**
   * Suppress the browser's validation bubbles. Constraints are still checked
   * on submit (see `constraintValidation`); only the browser's UI is off.
   *
   * @default true
   */
  noValidate?: boolean;
  /**
   * Check the controls' native constraints before `onSubmit`, and cancel the
   * submit when any fail. Turn off when your own validation (a schema) is
   * the only source of truth and the constraint attributes are there for
   * semantics and keyboards.
   *
   * @default true
   */
  constraintValidation?: boolean;
  /**
   * Called instead of `onSubmit` when native constraints fail, with one
   * `FormError` per failing control (`fieldId` is its `id`, `message` the
   * browser's `validationMessage` — replace it with your own words). Set
   * your error state here; focus moves after React commits it.
   */
  onInvalidSubmit?: (errors: FormError[], event: FormSubmitEvent) => void;
  /**
   * After a submit, move focus to the FormErrorSummary, or to the first
   * `aria-invalid` control when there is no summary.
   *
   * @default true
   */
  focusOnError?: boolean;
};

export const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form(
  {
    className,
    noValidate = true,
    constraintValidation = true,
    onInvalidSubmit,
    focusOnError = true,
    onSubmit,
    ...props
  },
  ref,
) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const setRefs = useComposedRefs(ref, formRef);

  // Bumped on every submit; the effect below runs after the commit that
  // carries whatever error state the handler set in the same event.
  const [attempt, setAttempt] = React.useState(0);
  const fallback = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (attempt === 0 || !focusOnError) return;
    const form = formRef.current;
    if (!form) return;
    const target = findErrorSummary(form) ?? findFirstInvalid(form) ?? focusableFor(fallback.current);
    fallback.current = null;
    if (target && target.ownerDocument.activeElement !== target) target.focus();
  }, [attempt, focusOnError]);

  const handleSubmit = (event: FormSubmitEvent) => {
    const form = event.currentTarget;
    if (constraintValidation && noValidate) {
      const failures = constraintFailures(form);
      if (failures.length > 0) {
        event.preventDefault();
        if (onInvalidSubmit) {
          fallback.current = failures[0] ?? null;
          onInvalidSubmit(
            failures.map((el) => ({ fieldId: el.id || undefined, message: el.validationMessage })),
            event,
          );
          setAttempt((n) => n + 1);
        } else {
          // Nothing will render a message for us: let the browser say it.
          form.reportValidity();
        }
        return;
      }
    }
    onSubmit?.(event);
    setAttempt((n) => n + 1);
  };

  return (
    <form
      ref={setRefs}
      data-slot="form"
      noValidate={noValidate}
      className={cn(formVariants(), className)}
      onSubmit={handleSubmit}
      {...props}
    />
  );
});
Form.displayName = 'Form';
