'use client';

// Client: Field generates ids with a hook and shares them through context, and
// Radix Label attaches a mousedown handler.
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';

/* ---------------------------------------------------------------------------
 * Field, FieldLabel, FieldControl, FieldHelp, FieldError, FieldContent,
 * FieldSet, FieldLegend
 *
 * The composed form unit: a label, a required / optional marker, ONE control,
 * help text and an error, wired together. The controls themselves (Input,
 * Textarea, Select, NumberInput, PhoneInput, OtpInput, Checkbox, RadioGroup,
 * Switch) have no label or error props on purpose; this is where those live.
 *
 * Wiring, done once here so no form hand-writes it:
 *   - the label's `htmlFor` = the control's `id` (generated, or `controlId`);
 *   - the control's `aria-describedby` = the help id and the error id (only the
 *     parts that render), merged with any `aria-describedby` it already has;
 *   - `aria-invalid="true"` on the control while there is an error (or
 *     `invalid`); the red border is the control styling that attribute;
 *   - `required` draws the `*` (aria-hidden) plus a visually hidden
 *     "(required)", and sets `aria-required` on the control. Native constraint
 *     validation is the control's own `required` attribute: put it on the
 *     control when you want the browser to block the submit;
 *   - `disabled` is forwarded to the control.
 *
 * Two ways to write it, the same DOM:
 *
 *   Flat, for a CMS blok whose fields are plain strings:
 *     <Field label="Scaler email" help="We send cohort announcements here.">
 *       <Input type="email" />
 *     </Field>
 *
 *   Compound, when the parts need to move:
 *     <Field required>
 *       <FieldLabel>SST roll number</FieldLabel>
 *       <FieldControl><Input /></FieldControl>
 *       <FieldHelp>Printed on your admission letter.</FieldHelp>
 *       <FieldError>{errors.roll}</FieldError>
 *     </Field>
 *
 * A control that is not the element you pass (Select: the Root renders no DOM,
 * the focusable element is SelectTrigger) is wired by wrapping the real
 * element in `FieldControl`, in either form:
 *     <Field label="Elective track">
 *       <Select><FieldControl><SelectTrigger>…</SelectTrigger></FieldControl>…</Select>
 *     </Field>
 *
 * A GROUP of controls (a checkbox list, a radio group) is a `FieldSet` with a
 * `legend`, not a Field: a `<label for>` can name one control, a `<legend>`
 * names a group. Each option inside is a horizontal Field. Stacked fields in a
 * form column also go in a FieldSet, which owns the 24px rhythm between
 * fields; inside one Field the parts are 8px apart.
 *
 * Not here: a bare toolbar filter. That takes an `aria-label` and no Field,
 * because a visible label in a toolbar is noise (preview, Field).
 * ------------------------------------------------------------------------- */

/* ---- context -------------------------------------------------------------- */

type FieldContextValue = {
  controlId: string;
  helpId: string;
  errorId: string;
  hasHelp: boolean;
  hasError: boolean;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  registerHelp: (present: boolean) => void;
  registerError: (present: boolean) => void;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

/**
 * The wiring of the nearest `Field`, for a custom control that cannot be
 * wrapped in `FieldControl`. Returns `null` outside a Field.
 */
export function useField(): FieldContextValue | null {
  return React.useContext(FieldContext);
}

/* `useLayoutEffect` warns during server rendering on React < 19. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** A part tells the Field it rendered, so the control only points at ids that exist. */
function useRegister(register: ((present: boolean) => void) | undefined, present: boolean) {
  useIsoLayoutEffect(() => {
    if (!register) return undefined;
    register(present);
    return () => register(false);
  }, [register, present]);
}

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

/* ---- glyphs --------------------------------------------------------------- */

/** Phosphor 2.1.1 `warning-circle` fill (`ph-error-fill` in the preview sprite). */
function ErrorGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
    </svg>
  );
}

/* ---- Field ---------------------------------------------------------------- */

export const fieldVariants = cva('group/field min-w-0 font-sans', {
  variants: {
    orientation: {
      // Label, control, help, error — 8px apart, one unit.
      vertical: 'grid gap-2',
      // A single checkbox / radio / switch: the control first, then the label
      // (and any help under the label), aligned to the label's first line.
      horizontal: 'flex items-start gap-2',
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

/** String union, so a Storyblok option value can be passed straight in. */
export type FieldOrientation = 'vertical' | 'horizontal';

export type FieldProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * The visible label. Given, Field renders the whole unit itself (flat form):
   * the label, the child as the control, `help` and `error`. Omit it and
   * compose `FieldLabel` / `FieldControl` / `FieldHelp` / `FieldError`.
   */
  label?: React.ReactNode;
  /** Help text under the control, linked by `aria-describedby`. Flat form. */
  help?: React.ReactNode;
  /**
   * The error message. When present the control gets `aria-invalid="true"` and
   * the message is linked by `aria-describedby`. Flat form; in the compound
   * form a non-empty `FieldError` does the same.
   */
  error?: React.ReactNode;
  /**
   * Draws the required marker (`*` plus a visually hidden "(required)") and
   * sets `aria-required` on the control. For native constraint validation,
   * also put `required` on the control.
   *
   * @default false
   */
  required?: boolean;
  /**
   * Draws a quiet "Optional" after the label. For the form where most fields
   * are required and the exceptions need saying. Pass a string to change the
   * word (`optional="Optional, but helps"`).
   *
   * @default false
   */
  optional?: boolean | string;
  /**
   * Forwarded to the control as `disabled`. The label and help stay legible:
   * the disabled fill on the control is the signal.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Marks the control invalid without an error message. Normally you pass
   * `error` (or render a `FieldError`) and this follows from it.
   *
   * @default false
   */
  invalid?: boolean;
  /**
   * The control's `id`, and the label's `htmlFor`. Generated when omitted; in
   * the flat form the child's own `id` is used if it has one.
   */
  controlId?: string;
  /**
   * `vertical` stacks label, control, help and error. `horizontal` is for a
   * single checkbox, radio or switch: the control, then the label beside it.
   *
   * @default 'vertical'
   */
  orientation?: FieldOrientation;
};

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    className,
    label,
    help,
    error,
    required = false,
    optional = false,
    disabled = false,
    invalid: invalidProp = false,
    controlId: controlIdProp,
    orientation = 'vertical',
    children,
    ...props
  },
  ref,
) {
  const flat = isRendered(label);
  const onlyChild =
    flat && React.Children.count(children) === 1 && React.isValidElement(children)
      ? (children as React.ReactElement<Record<string, unknown>>)
      : null;
  const childId = onlyChild && typeof onlyChild.props.id === 'string' ? onlyChild.props.id : undefined;

  const baseId = useId();
  const controlId = controlIdProp ?? childId ?? `${baseId}-control`;
  const helpId = `${baseId}-help`;
  const errorId = `${baseId}-error`;

  // Parts register themselves, so `aria-describedby` never names an id that
  // is not in the document. The flat form knows up front (no extra render).
  const [helpCount, setHelpCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const registerHelp = React.useCallback(
    (present: boolean) => setHelpCount((n) => Math.max(0, n + (present ? 1 : -1))),
    [],
  );
  const registerError = React.useCallback(
    (present: boolean) => setErrorCount((n) => Math.max(0, n + (present ? 1 : -1))),
    [],
  );

  const hasHelp = flat ? isRendered(help) : helpCount > 0;
  const hasError = flat ? isRendered(error) : errorCount > 0;
  const invalid = invalidProp || hasError;

  const context = React.useMemo<FieldContextValue>(
    () => ({
      controlId,
      helpId,
      errorId,
      hasHelp,
      hasError,
      invalid,
      required,
      disabled,
      // The flat form renders its own parts and needs no registration.
      registerHelp: flat ? noop : registerHelp,
      registerError: flat ? noop : registerError,
    }),
    [controlId, helpId, errorId, hasHelp, hasError, invalid, required, disabled, flat, registerHelp, registerError],
  );

  let body: React.ReactNode = children;
  if (flat) {
    // The child is the control unless it is a layout wrapper (a host element
    // that is not itself a form control); then it is rendered as given, and a
    // FieldControl inside it does the wiring.
    const wireChild =
      onlyChild != null &&
      (typeof onlyChild.type !== 'string' || /^(input|textarea|select|button)$/.test(onlyChild.type)) &&
      onlyChild.type !== FieldControl;
    const control = wireChild ? <FieldControl>{onlyChild}</FieldControl> : children;
    const labelEl = (
      <FieldLabel optional={optional}>{label}</FieldLabel>
    );
    const helpEl = isRendered(help) ? <FieldHelp>{help}</FieldHelp> : null;
    const errorEl = isRendered(error) ? <FieldError>{error}</FieldError> : null;
    body =
      orientation === 'horizontal' ? (
        <>
          {/* One label-line tall, so an 18px box or a switch sits on the
              label's first line rather than on its top edge. */}
          <span
            data-slot="field-control-box"
            className="flex h-[1lh] shrink-0 items-center text-base leading-body"
          >
            {control}
          </span>
          <FieldContent>
            {labelEl}
            {helpEl}
            {errorEl}
          </FieldContent>
        </>
      ) : (
        <>
          {labelEl}
          {control}
          {helpEl}
          {errorEl}
        </>
      );
  }

  return (
    <FieldContext.Provider value={context}>
      <div
        ref={ref}
        data-slot="field"
        data-orientation={orientation}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-required={required || undefined}
        className={cn(fieldVariants({ orientation }), className)}
        {...props}
      >
        {body}
      </div>
    </FieldContext.Provider>
  );
});
Field.displayName = 'Field';

function noop() {}

/* ---- FieldContent --------------------------------------------------------- */

export type FieldContentProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * The label + help + error column of a horizontal Field, beside the control.
 * Not needed in a vertical Field.
 */
export const FieldContent = React.forwardRef<HTMLDivElement, FieldContentProps>(function FieldContent(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="field-content"
      className={cn('grid min-w-0 flex-1 gap-1', className)}
      {...props}
    />
  );
});
FieldContent.displayName = 'FieldContent';

/* ---- FieldLabel ----------------------------------------------------------- */

export type FieldLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
  /**
   * Draws a quiet "Optional" after the label text; a string replaces the word.
   *
   * @default false
   */
  optional?: boolean | string;
};

export const FieldLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FieldLabelProps
>(function FieldLabel({ className, optional = false, htmlFor, children, ...props }, ref) {
  const field = React.useContext(FieldContext);
  const required = field?.required ?? false;
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="field-label"
      htmlFor={htmlFor ?? field?.controlId}
      className={cn(
        'text-sm font-semibold text-content',
        // A horizontal Field labels a checkbox / radio / switch: the option
        // text is body copy, not a form heading, so it drops to regular 15px
        // (the preview's `.check`), and the whole label is the hit target.
        'group-data-[orientation=horizontal]/field:cursor-pointer',
        'group-data-[orientation=horizontal]/field:text-base group-data-[orientation=horizontal]/field:font-regular',
        'group-data-[orientation=horizontal]/field:leading-body',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <>
          {' '}
          <span data-slot="field-required" aria-hidden="true" className="text-danger-content">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      ) : null}
      {optional && !required ? (
        <>
          {' '}
          <span data-slot="field-optional" className="text-xs font-regular text-content-secondary">
            {typeof optional === 'string' ? optional : 'Optional'}
          </span>
        </>
      ) : null}
    </LabelPrimitive.Root>
  );
});
FieldLabel.displayName = 'FieldLabel';

/* ---- FieldControl --------------------------------------------------------- */

export type FieldControlProps = {
  /** Exactly one element: the focusable control (Input, SelectTrigger, …). */
  children: React.ReactElement;
};

/**
 * Wires its one child as the Field's control: `id`, `aria-describedby`
 * (merged with the child's own), `aria-invalid`, `aria-required`, `disabled`.
 * Renders no element of its own; the ref and every prop land on the child,
 * which keeps its own `data-slot`.
 */
export const FieldControl = React.forwardRef<HTMLElement, FieldControlProps>(function FieldControl(
  { children },
  ref,
) {
  const field = React.useContext(FieldContext);
  if (!React.isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  if (!field) return <Slot ref={ref}>{child}</Slot>;

  const own = child.props;
  const describedBy =
    [
      typeof own['aria-describedby'] === 'string' ? own['aria-describedby'] : null,
      field.hasHelp ? field.helpId : null,
      field.hasError ? field.errorId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const wired: Record<string, unknown> = {
    id: own.id ?? field.controlId,
    'aria-describedby': describedBy,
  };
  if (field.invalid && own['aria-invalid'] == null) wired['aria-invalid'] = true;
  if (field.required && own['aria-required'] == null && own.required == null) wired['aria-required'] = true;
  if (field.disabled && own.disabled == null) wired.disabled = true;

  // cloneElement (not Slot's prop merge) so the merged aria-describedby wins
  // over the child's own; Slot composes the refs.
  return <Slot ref={ref}>{React.cloneElement(child, wired)}</Slot>;
});
FieldControl.displayName = 'FieldControl';

/* ---- FieldHelp ------------------------------------------------------------ */

export type FieldHelpProps = React.ComponentPropsWithoutRef<'p'>;

/** Help text. Renders nothing when empty, so it can be written unconditionally. */
export const FieldHelp = React.forwardRef<HTMLParagraphElement, FieldHelpProps>(function FieldHelp(
  { className, id, children, ...props },
  ref,
) {
  const field = React.useContext(FieldContext);
  const present = isRendered(children);
  useRegister(field?.registerHelp, present);
  if (!present) return null;
  return (
    <p
      ref={ref}
      data-slot="field-help"
      id={id ?? field?.helpId}
      className={cn('m-0 text-sm text-content-secondary', className)}
      {...props}
    >
      {children}
    </p>
  );
});
FieldHelp.displayName = 'FieldHelp';

/* ---- FieldError ----------------------------------------------------------- */

export type FieldErrorProps = React.ComponentPropsWithoutRef<'p'> & {
  /**
   * The leading glyph. `null` for none. The default is the preview's filled
   * warning circle at 16px.
   */
  icon?: React.ReactNode;
};

/**
 * The error message. Renders nothing when empty, and while it renders the
 * control is `aria-invalid`. The message says what to do, not only what is
 * wrong ("Roll numbers are 13 characters — check the four digits…").
 */
export const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(function FieldError(
  { className, id, icon, children, ...props },
  ref,
) {
  const field = React.useContext(FieldContext);
  const present = isRendered(children);
  useRegister(field?.registerError, present);
  if (!present) return null;
  return (
    <p
      ref={ref}
      data-slot="field-error"
      id={id ?? field?.errorId}
      className={cn(
        'm-0 flex items-start gap-1 text-sm text-danger-content',
        // The glyph sits on the first line's optical centre when the message wraps.
        "[&>svg]:mt-[calc((1lh-var(--size-icon-sm))/2)] [&>svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-sm",
        className,
      )}
      {...props}
    >
      {icon === undefined ? <ErrorGlyph /> : icon}
      <span data-slot="field-error-text">{children}</span>
    </p>
  );
});
FieldError.displayName = 'FieldError';

/* ---- FieldSet / FieldLegend ----------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type FieldSetVariant = 'fields' | 'choices';

export type FieldSetProps = React.ComponentPropsWithoutRef<'fieldset'> & {
  /** The group's name, rendered as its `<legend>`. */
  legend?: React.ReactNode;
  /**
   * Keeps the legend for assistive technology but hides it visually, for a
   * group whose heading is already on screen (preview, "Stacked fields").
   *
   * @default false
   */
  hideLegend?: boolean;
  /** Help for the whole group, linked to the fieldset by `aria-describedby`. */
  help?: React.ReactNode;
  /** An error for the whole group ("Pick at least one track"), linked the same way. */
  error?: React.ReactNode;
  /**
   * Draws the required marker after the legend.
   *
   * @default false
   */
  required?: boolean;
  /**
   * `fields`: stacked Fields in a form column, 24px apart. `choices`: the
   * options of one question (horizontal checkbox / radio Fields, or a
   * RadioGroup), 8px apart with the group help above them, read as one unit.
   *
   * @default 'fields'
   */
  variant?: FieldSetVariant;
};

/**
 * A group of controls, or of stacked Fields. `<fieldset>` + `<legend>`, so the
 * group is announced by its name before its members, and `disabled` on it
 * disables every native control inside.
 */
export const FieldSet = React.forwardRef<HTMLFieldSetElement, FieldSetProps>(function FieldSet(
  {
    className,
    legend,
    hideLegend = false,
    help,
    error,
    required = false,
    variant = 'fields',
    children,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const helpId = `${baseId}-help`;
  const errorId = `${baseId}-error`;
  const hasHelp = isRendered(help);
  const hasError = isRendered(error);
  const describedBy =
    [props['aria-describedby'], hasHelp ? helpId : null, hasError ? errorId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <fieldset
      ref={ref}
      data-slot="field-set"
      data-variant={variant}
      data-invalid={hasError || undefined}
      className={cn(
        'm-0 grid min-w-0 border-0 p-0 font-sans',
        variant === 'choices' ? 'gap-2' : 'gap-6',
        className,
      )}
      {...props}
      aria-describedby={describedBy}
    >
      {isRendered(legend) ? (
        <FieldLegend hidden={hideLegend} required={required}>
          {legend}
        </FieldLegend>
      ) : null}
      {hasHelp ? (
        <p data-slot="field-help" id={helpId} className="m-0 text-sm text-content-secondary">
          {help}
        </p>
      ) : null}
      {children}
      {hasError ? (
        // Its own (empty) context, so it does not register with an enclosing Field.
        <FieldContext.Provider value={null}>
          <FieldError id={errorId}>{error}</FieldError>
        </FieldContext.Provider>
      ) : null}
    </fieldset>
  );
});
FieldSet.displayName = 'FieldSet';

export type FieldLegendProps = React.ComponentPropsWithoutRef<'legend'> & {
  /**
   * Visually hidden, still announced.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Draws the required marker.
   *
   * @default false
   */
  required?: boolean;
};

export const FieldLegend = React.forwardRef<HTMLLegendElement, FieldLegendProps>(function FieldLegend(
  { className, hidden = false, required = false, children, ...props },
  ref,
) {
  return (
    <legend
      ref={ref}
      data-slot="field-legend"
      className={cn(
        // A rendered legend sits outside the fieldset's grid, so the grid gap
        // does not reach it: its own 8px margin separates it from the group.
        'float-none mb-2 p-0 text-md font-semibold text-content',
        hidden && 'sr-only',
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <>
          {' '}
          <span data-slot="field-required" aria-hidden="true" className="text-danger-content">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      ) : null}
    </legend>
  );
});
FieldLegend.displayName = 'FieldLegend';
