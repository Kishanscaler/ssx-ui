'use client';

// Client: input-otp keeps the value, the caret and the selection in state and
// attaches the input's handlers; the slots read its context.
import * as React from 'react';
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * OtpInput, OtpInputGroup, OtpInputSlot
 *
 * A one-time code (six digits by default), typed or pasted, at the moment the
 * user is holding a phone in the other hand. Only for a code that arrived out
 * of band (SMS, email, an authenticator). Not a PIN field.
 *
 * Six boxes, ONE field (`input-otp`): a single real transparent <input>
 * stretched over `aria-hidden` boxes that mirror its value. So a screen reader
 * meets one control with one value, `autocomplete="one-time-code"` sits on
 * the one field iOS / Android will offer the SMS code to, and paste,
 * Backspace, arrows, Home / End, undo and select-all are the browser's own.
 * Non-digits are refused on the way in, and a paste is stripped to its
 * digits, so pasting "Your Scaler code is 284193" fills all six.
 *
 * Invalid is a state of the WHOLE control: `aria-invalid` on the field
 * restyles every box (danger edge, danger surface, danger ink), not one slot.
 * `verifying` is not disabled: the digits stay at full contrast, the edges go
 * inert, the field goes read-only and `aria-busy`; the "Checking code…"
 * status line (role="status" + a loader) is the caller's, beside the control.
 *
 * Focus shows twice on purpose: a ring around the group says "this control
 * has focus", the highlighted box says "you are here". The caret is drawn as
 * that box (as in the preview), so no keyframes are needed.
 *
 * Where the props go: `className` on the ROOT wrapper; every native
 * attribute, `id`, `aria-*` and the ref on the one real <input>.
 * ------------------------------------------------------------------------- */

type OtpState = { invalid: boolean; disabled: boolean; verifying: boolean };

const OtpStateContext = React.createContext<OtpState>({
  invalid: false,
  disabled: false,
  verifying: false,
});

type OTPInputProps = React.ComponentPropsWithoutRef<typeof OTPInput>;

export type OtpInputProps = Omit<
  OTPInputProps,
  'children' | 'render' | 'maxLength' | 'containerClassName' | 'value' | 'defaultValue' | 'onChange'
> & {
  /** The code (controlled). */
  value?: string;
  /**
   * The initial code (uncontrolled). input-otp itself has no uncontrolled
   * mode with an initial value, so the atom holds the state.
   *
   * @default ''
   */
  defaultValue?: string;
  /** Called with the new code (digits only) on every change. */
  onChange?: (value: string) => void;
  /**
   * Number of characters. The default rendering draws one slot per character.
   *
   * @default 6
   */
  maxLength?: number;
  /**
   * The code is being checked: the field goes read-only and `aria-busy`, the
   * digits stay legible, the box edges go inert. Pair it with a
   * `role="status"` line.
   *
   * @default false
   */
  verifying?: boolean;
  /**
   * Custom slot layout (`OtpInputGroup` / `OtpInputSlot`). Omit it for one
   * group of `maxLength` slots.
   */
  children?: React.ReactNode;
};

const digitsOnly = (s: string) => s.replace(/\D/g, '');

export const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(function OtpInput(
  {
    className,
    maxLength = 6,
    verifying = false,
    disabled = false,
    readOnly,
    children,
    pattern = REGEXP_ONLY_DIGITS,
    inputMode = 'numeric',
    autoComplete = 'one-time-code',
    pasteTransformer,
    value: valueProp,
    defaultValue = '',
    onChange,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange,
    caller: 'OtpInput',
  });
  const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';
  const state = React.useMemo(
    () => ({ invalid, disabled: !!disabled, verifying }),
    [invalid, disabled, verifying],
  );
  const digitPattern = pattern === REGEXP_ONLY_DIGITS;

  const slots =
    children ?? (
      <OtpInputGroup>
        {Array.from({ length: maxLength }, (_, i) => (
          <OtpInputSlot key={i} index={i} />
        ))}
      </OtpInputGroup>
    );

  return (
    <OtpStateContext.Provider value={state}>
      {/* The root. input-otp's own container takes no attributes other than a
          class, so the data-slot / data-* hooks live on this wrapper. */}
      <div
        data-slot="otp-input"
        data-invalid={invalid ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-verifying={verifying ? '' : undefined}
        className={cn(
          'group/otp inline-flex w-max max-w-full font-sans',
          disabled && 'cursor-not-allowed',
          verifying && 'cursor-progress',
          className,
        )}
      >
        <OTPInput
          ref={ref}
          data-slot="otp-input-field"
          value={value}
          onChange={setValue}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          autoComplete={autoComplete}
          // A pasted SMS keeps only its digits, when the field is digits-only.
          pasteTransformer={pasteTransformer ?? (digitPattern ? digitsOnly : undefined)}
          disabled={disabled}
          readOnly={readOnly || verifying}
          aria-busy={verifying || undefined}
          containerClassName="flex items-center gap-2"
          className={cn(
            // The real control is transparent and positioned by input-otp.
            // The system's global :focus-visible outline stays off it: the
            // group ring and the active box are the focus.
            'outline-none disabled:cursor-not-allowed',
            verifying && 'cursor-progress',
          )}
          {...props}
        >
          {slots}
        </OTPInput>
      </div>
    </OtpStateContext.Provider>
  );
});
OtpInput.displayName = 'OtpInput';

/* ---- Group --------------------------------------------------------------- */

export type OtpInputGroupProps = React.ComponentPropsWithoutRef<'div'>;

export const OtpInputGroup = React.forwardRef<HTMLDivElement, OtpInputGroupProps>(function OtpInputGroup(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-slot="otp-input-group"
      aria-hidden="true"
      className={cn(
        'flex items-center gap-2 rounded-md',
        // The ring around the whole group: "this control has focus". Drawn by
        // :focus-within, so it needs no script.
        'outline-offset-4 group-focus-within/otp:outline-2 group-focus-within/otp:outline-solid',
        'group-focus-within/otp:outline-border-focus',
        className,
      )}
      {...props}
    />
  );
});
OtpInputGroup.displayName = 'OtpInputGroup';

/* ---- Slot ---------------------------------------------------------------- */

export type OtpInputSlotProps = React.ComponentPropsWithoutRef<'div'> & {
  /** Which character of the value this box mirrors, from 0. */
  index: number;
};

export const OtpInputSlot = React.forwardRef<HTMLDivElement, OtpInputSlotProps>(function OtpInputSlot(
  { className, index, ...props },
  ref,
) {
  const otp = React.useContext(OTPInputContext);
  const { invalid, disabled, verifying } = React.useContext(OtpStateContext);
  const slot = otp?.slots?.[index];
  const char = slot?.char ?? null;
  const active = !!slot?.isActive && !disabled;

  return (
    <div
      ref={ref}
      data-slot="otp-input-slot"
      data-active={active ? '' : undefined}
      data-filled={char ? '' : undefined}
      className={cn(
        'flex h-control-lg w-11 shrink-0 items-center justify-center',
        'rounded-md border border-field-border bg-field',
        'text-lg font-semibold tabular-nums leading-none text-field-content',
        'transition-[border-color,background-color,box-shadow] duration-[var(--motion-duration-instant)]',
        'ease-productive-in-out motion-reduce:transition-none',
        // A filled box is darker-edged, so "how far am I" needs no counting.
        char && 'border-border-strong',
        // Where the caret is.
        active && 'border-field-border-focus shadow-[inset_0_0_0_var(--border-thick)_var(--field-border-focus)]',
        verifying && 'border-border-inert',
        invalid && 'border-danger bg-danger-surface text-danger-content',
        disabled && 'border-field-border bg-field-disabled text-content-disabled',
        className,
      )}
      {...props}
    >
      {char ?? slot?.placeholderChar ?? null}
    </div>
  );
});
OtpInputSlot.displayName = 'OtpInputSlot';
