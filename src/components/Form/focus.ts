/* ---------------------------------------------------------------------------
 * Focus helpers shared by Form and FormErrorSummary. Pure DOM, no React, so
 * this module needs no directive; it is imported only by client modules.
 * ------------------------------------------------------------------------- */

/** What can take focus from a script. */
const FOCUSABLE = [
  'input:not([type=hidden]):not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'button:not(:disabled)',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * The element to focus for a field: the element itself when it can take
 * focus, else the first focusable inside it (a RadioGroup root is a
 * `role="radiogroup"` div; its checked radio, or the first one, takes focus).
 */
export function focusableFor(el: Element | null): HTMLElement | null {
  if (!el) return null;
  if (el.matches(FOCUSABLE)) return el as HTMLElement;
  return (
    el.querySelector<HTMLElement>('[role=radio][aria-checked=true]:not(:disabled)') ??
    el.querySelector<HTMLElement>(FOCUSABLE)
  );
}

/** A non-empty FormErrorSummary inside `root`. */
export function findErrorSummary(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-slot=form-error-summary]');
}

/** The first `aria-invalid="true"` control inside `root`, as something focusable. */
export function findFirstInvalid(root: ParentNode): HTMLElement | null {
  const candidates = root.querySelectorAll('[aria-invalid=true]');
  for (let i = 0; i < candidates.length; i += 1) {
    const target = focusableFor(candidates[i] ?? null);
    if (target) return target;
  }
  return null;
}

/**
 * Focus a field and bring its label into view with it (GOV.UK: scrolling to
 * the bare input can hide the question that explains it). The label is the
 * `<label for>`, or the legend of the fieldset the field sits in.
 */
export function focusField(el: HTMLElement): void {
  const doc = el.ownerDocument;
  const id = el.id;
  const label =
    (id ? doc.querySelector<HTMLElement>(`label[for="${cssEscape(id)}"]`) : null) ??
    el.closest('fieldset')?.querySelector<HTMLElement>('legend') ??
    null;
  if (label && typeof label.scrollIntoView === 'function') {
    label.scrollIntoView({ block: 'start' });
    el.focus({ preventScroll: true });
  } else {
    el.focus();
  }
}

function cssEscape(value: string): string {
  const css = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS;
  return css?.escape ? css.escape(value) : value.replace(/["\\]/g, '\\$&');
}
