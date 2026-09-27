'use client';

// Client: focuses itself when errors appear (an effect) and attaches the
// link click handler that focuses the field.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { alertVariants } from '../Alert';
import { ErrorGlyph } from '../Alert/status-glyphs';
import type { FormError } from './Form';
import { focusableFor, focusField } from './focus';

/* ---------------------------------------------------------------------------
 * FormErrorSummary
 *
 * The list of what is wrong, at the top of a form, after a failed submit
 * (GOV.UK's error summary). A count heading ("There are 3 problems"), then
 * one link per error; following a link focuses that field and scrolls its
 * label into view. It repeats the FieldErrors, it does not replace them:
 * the summary is how someone learns there are errors, the FieldError is
 * what they read beside the field while fixing it. Use the same words.
 *
 * Errors are DATA: an array of `{ fieldId, message }`, or an object keyed by
 * field id (the shape most error state already has: `{ email: 'Enter…' }`).
 * Empty messages are dropped, and with nothing left the summary renders
 * nothing, so it can be written unconditionally.
 *
 * Link targets are control ids. A Field generates one unless you pass
 * `controlId` (or an `id` on the control), so give every Field in a form
 * that can fail a stable `controlId`.
 *
 * Focus and announcement follow GOV.UK Frontend: the summary is focusable
 * (`tabIndex={-1}`) and takes focus when it appears (and, inside a `Form`,
 * again after every failed submit), and its body is `role="alert"`, which
 * covers `autoFocus={false}`. It appearing after a server action counts:
 * that is the case a Form alone cannot see.
 *
 * Styled as a danger `Alert` (its recipe and glyph), not a Banner: it
 * belongs to this form.
 * ------------------------------------------------------------------------- */

/** Heading elements the summary title can render as. */
export type FormErrorSummaryHeading = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type FormErrorSummaryProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> & {
  /**
   * The errors, in form order. An array of `{ fieldId, message }`, or an
   * object mapping control id to message. Entries with an empty message are
   * skipped.
   *
   * @default []
   */
  errors?: FormError[] | Record<string, React.ReactNode>;
  /**
   * The heading. A function gets the error count. The default counts:
   * "There is a problem" for one, "There are 3 problems" for more.
   */
  title?: React.ReactNode | ((count: number) => React.ReactNode);
  /** An optional line under the heading: "Fix these to submit your application." */
  description?: React.ReactNode;
  /**
   * The heading element. Pick the level that fits the page outline; the
   * look does not change.
   *
   * @default 'h2'
   */
  headingAs?: FormErrorSummaryHeading;
  /**
   * Move focus to the summary when it appears (errors go from none to
   * some). Off, it is still announced through `role="alert"`.
   *
   * @default true
   */
  autoFocus?: boolean;
};

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

function normalise(errors: FormErrorSummaryProps['errors']): FormError[] {
  if (!errors) return [];
  const list: FormError[] = Array.isArray(errors)
    ? errors
    : Object.keys(errors).map((fieldId) => ({ fieldId, message: errors[fieldId] }));
  return list.filter((e) => e && isRendered(e.message));
}

function defaultTitle(count: number): string {
  return count === 1 ? 'There is a problem' : `There are ${count} problems`;
}

export const FormErrorSummary = React.forwardRef<HTMLDivElement, FormErrorSummaryProps>(
  function FormErrorSummary(
    { className, errors, title, description, headingAs: Heading = 'h2', autoFocus = true, children, ...props },
    forwardedRef,
  ) {
    const innerRef = React.useRef<HTMLDivElement>(null);
    const ref = useComposedRefs(forwardedRef, innerRef);
    const list = normalise(errors);
    const count = list.length;

    // Focus on appear: from none to some, including a mount with errors (a
    // server action's result, a page rendered after a no-JS post).
    const previous = React.useRef(0);
    React.useEffect(() => {
      const appeared = previous.current === 0 && count > 0;
      previous.current = count;
      if (appeared && autoFocus) innerRef.current?.focus();
    }, [count, autoFocus]);

    if (count === 0) return null;

    const heading = typeof title === 'function' ? title(count) : (title ?? defaultTitle(count));

    const handleLinkClick = (fieldId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const target = focusableFor(event.currentTarget.ownerDocument.getElementById(fieldId));
      if (!target) return; // let the hash link do what it can
      event.preventDefault();
      focusField(target);
    };

    return (
      <div
        ref={ref}
        data-slot="form-error-summary"
        data-count={count}
        tabIndex={-1}
        className={cn(alertVariants({ tone: 'danger' }), 'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus', className)}
        {...props}
      >
        <span
          data-slot="form-error-summary-icon"
          aria-hidden="true"
          // Alert's 20px status glyph (Alert sizes it by its own slot name).
          className="flex shrink-0 pt-px [&_svg:not([class*='size-'])]:size-icon-md"
        >
          <ErrorGlyph />
        </span>
        <div role="alert" data-slot="form-error-summary-body" className="grid min-w-0 flex-1 gap-2">
          <Heading data-slot="form-error-summary-title" className="m-0 text-base leading-body font-semibold">
            {heading}
          </Heading>
          {isRendered(description) ? (
            <p data-slot="form-error-summary-description" className="m-0 type-body-sm">
              {description}
            </p>
          ) : null}
          <ul data-slot="form-error-summary-list" className="m-0 grid list-none gap-1 p-0 type-body-sm">
            {list.map((error, index) => (
              <li key={error.fieldId ?? `form-${index}`} data-slot="form-error-summary-item" className="[overflow-wrap:anywhere]">
                {error.fieldId ? (
                  <a
                    href={`#${error.fieldId}`}
                    data-slot="form-error-summary-link"
                    className={cn(
                      'font-semibold text-danger-content underline decoration-1 underline-offset-2',
                      'hover:decoration-2 motion-reduce:transition-none',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus',
                    )}
                    onClick={handleLinkClick(error.fieldId)}
                  >
                    {error.message}
                  </a>
                ) : (
                  error.message
                )}
              </li>
            ))}
          </ul>
          {children}
        </div>
      </div>
    );
  },
);
FormErrorSummary.displayName = 'FormErrorSummary';
