'use client';

// Client: holds the draft text and the controllable value, attaches key,
// wheel and click handlers.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { inputVariants } from '../Input';

/* ---------------------------------------------------------------------------
 * NumberInput
 *
 * A bounded numeric quantity: a fee, a credit count, an attendance
 * percentage. NOT for identifiers that merely look numeric (an applicant ID,
 * a phone number): those are strings, and a spinbutton would round them.
 *
 * A native `<input type="number">` (so the keypad, form value and the
 * spinbutton role come free) with the native spinners hidden — they are
 * unstyleable, differ per browser and vanish on touch — and two real stepper
 * buttons with accessible names instead.
 *
 * Value model. `value` / `onValueChange` carry a `number | null` (null =
 * empty); the field keeps its own draft TEXT so a half-typed "-" or "1." is
 * never clobbered. Stepping goes through state, not `input.stepUp()` (which
 * does not fire React's onChange), is rounded to the step's precision, and is
 * always clamped to `min` / `max`. A typed value is clamped on blur
 * (`clampOnBlur`), so a form that wants to SHOW an out-of-range value with an
 * error can turn that off. The wheel never changes a focused value.
 *
 * Where the props go: `className` and the size go on the ROOT (the bordered
 * group, or the bare input when `stepper={false}`); every other native
 * attribute, `id`, `aria-*` and the ref go on the <input>, which is what a
 * label, a form and a test all target.
 *
 * Indian digit grouping (₹19,50,000) is impossible inside type=number: put it
 * in the help text. Units (₹ / %) are the InputGroup molecule's job.
 * ------------------------------------------------------------------------- */

export const numberInputVariants = cva(
  [
    'group/number-input inline-flex max-w-full items-stretch overflow-hidden',
    'rounded-md border border-field-border bg-field',
    'transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)] ease-productive-in-out',
    'motion-reduce:transition-none',
    '[&:not([data-disabled])]:hover:border-field-border-hover',
    // Border on any focus inside; the ring only when the VALUE has focus (a
    // focused stepper draws its own inset ring, and two rings read as two
    // controls). Below :has() support the border alone still says "focused".
    'focus-within:border-border-focus',
    'has-[[data-slot=number-input-field]:focus]:ring-[3px] has-[[data-slot=number-input-field]:focus]:ring-border-focus/50',
    'data-[invalid]:border-danger data-[invalid]:ring-danger/20',
    'data-[disabled]:cursor-not-allowed data-[disabled]:border-action-disabled-border data-[disabled]:bg-field-disabled',
    'data-[readonly]:border-dashed data-[readonly]:bg-surface-sunken',
  ],
  {
    variants: {
      size: {
        sm: 'h-control-sm text-sm',
        md: 'h-control-md text-base',
        lg: 'h-control-lg text-md',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/** Hides the native spinners in every engine. */
const noSpinners = [
  '[appearance:textfield]',
  '[&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none',
  '[&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
];

const fieldClass = cn(
  'h-full w-[8ch] min-w-0 border-0 bg-transparent px-2',
  // Centred: a stepper is a symmetrical control and its value belongs on its
  // axis. Tabular, so the field does not breathe from 9 to 10 to 1,080.
  'text-center font-sans tabular-nums text-field-content',
  'outline-none placeholder:text-field-placeholder',
  'selection:bg-action-primary selection:text-action-primary-fg',
  'disabled:cursor-not-allowed disabled:text-content-disabled',
  noSpinners,
);

const stepClass = cn(
  'flex shrink-0 items-center justify-center rounded-none p-0',
  'bg-surface-subtle text-content cursor-pointer outline-none',
  'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
  // rest neutral · hover brand ink on a quiet fill · pressed the solid
  // primary fill (the press is the moment that must be unambiguous).
  'enabled:hover:bg-action-secondary-hover enabled:hover:text-content-brand enabled:hover:border-border-control-hover',
  'enabled:active:bg-action-primary-active enabled:active:text-action-primary-fg',
  // Inset ring: the group clips its children, an outset one would be sliced.
  'focus-visible:relative focus-visible:z-raised focus-visible:outline-2 focus-visible:-outline-offset-2',
  'focus-visible:outline-solid focus-visible:outline-border-focus',
  // The dead button keeps its box, so "at maximum" is still balanced.
  'disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-content-disabled',
  "[&_svg:not([class*='size-'])]:size-icon-sm",
);

const stepSize = {
  sm: 'w-control-sm',
  md: 'w-control-md',
  lg: "w-control-lg [&_svg:not([class*='size-'])]:size-icon-md",
} as const;

type NumberInputVariantProps = VariantProps<typeof numberInputVariants>;

/** String union, so a Storyblok option value can be passed straight in. */
export type NumberInputSize = NonNullable<NumberInputVariantProps['size']>;

export type NumberInputProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step'
> & {
  /** The value (controlled). `null` is an empty field. */
  value?: number | null;
  /**
   * The initial value (uncontrolled).
   *
   * @default null
   */
  defaultValue?: number | null;
  /** Called with the new value (`null` when emptied) on typing, stepping and clamping. */
  onValueChange?: (value: number | null) => void;
  /** Lowest allowed value. Stepping never goes below it; the − button disables at it. */
  min?: number;
  /** Highest allowed value. Stepping never goes above it; the + button disables at it. */
  max?: number;
  /**
   * Amount per step (buttons, ↑ / ↓). PageUp / PageDown step ten times this.
   *
   * @default 1
   */
  step?: number;
  /**
   * Control height and type size: 32 / 40 / 48px, from `--size-control-*`.
   *
   * @default 'md'
   */
  size?: NumberInputSize;
  /**
   * Show the − / + stepper buttons. `false` renders a bare field (keyboard
   * stepping still works).
   *
   * @default true
   */
  stepper?: boolean;
  /**
   * Accessible name of the − button. Name the quantity: "Decrease credits".
   *
   * @default 'Decrease'
   */
  decrementLabel?: string;
  /**
   * Accessible name of the + button. Name the quantity: "Increase credits".
   *
   * @default 'Increase'
   */
  incrementLabel?: string;
  /**
   * Clamp a typed value into `min`..`max` when the field loses focus. Turn off
   * to keep an out-of-range value on screen next to its error.
   *
   * @default true
   */
  clampOnBlur?: boolean;
};

/* ---- pure helpers -------------------------------------------------------- */

function decimals(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const s = String(n);
  const e = s.indexOf('e-');
  if (e !== -1) return Number(s.slice(e + 2));
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function parse(text: string): number | null {
  if (text.trim() === '') return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function toText(value: number | null | undefined): string {
  return value == null ? '' : String(value);
}

function clamp(n: number, min?: number, max?: number): number {
  let out = n;
  if (max != null && out > max) out = max;
  if (min != null && out < min) out = min;
  return out;
}

/* ---- glyphs (Phosphor `remove` / `add`, inline; no icon library) --------- */

const MinusGlyph = () => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z" />
  </svg>
);
const PlusGlyph = () => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
  </svg>
);

/* ---- component ----------------------------------------------------------- */

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    className,
    size = 'md',
    value: valueProp,
    defaultValue = null,
    onValueChange,
    min,
    max,
    step = 1,
    stepper = true,
    decrementLabel = 'Decrease',
    incrementLabel = 'Increase',
    clampOnBlur = true,
    disabled,
    readOnly,
    id: idProp,
    onChange,
    onKeyDown,
    onBlur,
    ...props
  },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);
  const id = useId(idProp);

  const [value, setValue] = useControllableState<number | null>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'NumberInput',
  });
  const current = value ?? null;

  // The draft text. Re-derived from the value whenever the value changes to
  // something the text does not already say (a step, a clamp, a parent).
  const [text, setText] = React.useState(() => toText(current));
  React.useEffect(() => {
    setText((t) => (parse(t) === current ? t : toText(current)));
  }, [current]);

  const locked = !!disabled || !!readOnly;
  const precision = Math.max(decimals(step), decimals(min ?? 0));

  const commit = (next: number | null) => {
    setText(toText(next));
    if (next !== current) setValue(next);
  };

  const stepBy = (direction: 1 | -1, multiplier = 1) => {
    if (locked) return current;
    let next: number;
    if (current == null) {
      next = direction > 0 ? (min ?? 0) : (max ?? min ?? 0);
    } else {
      next = current + direction * step * multiplier;
    }
    next = clamp(Number(next.toFixed(precision)), min, max);
    commit(next);
    return next;
  };

  const atMin = current != null && min != null && current <= min;
  const atMax = current != null && max != null && current >= max;

  // The wheel must not change a focused value. React's onWheel is passive, so
  // this is a native, non-passive listener.
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return undefined;
    const onWheel = (event: WheelEvent) => {
      if (el.ownerDocument.activeElement === el) event.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    const raw = event.target.value;
    setText(raw);
    const parsed = parse(raw);
    if (parsed !== current) setValue(parsed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || locked) return;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        stepBy(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        stepBy(-1);
        break;
      case 'PageUp':
        event.preventDefault();
        stepBy(1, 10);
        break;
      case 'PageDown':
        event.preventDefault();
        stepBy(-1, 10);
        break;
      case 'Home':
        if (min != null) {
          event.preventDefault();
          commit(min);
        }
        break;
      case 'End':
        if (max != null) {
          event.preventDefault();
          commit(max);
        }
        break;
      default:
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    const parsed = parse(text);
    commit(clampOnBlur && parsed != null ? clamp(parsed, min, max) : parsed);
  };

  const handleStep = (direction: 1 | -1) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const next = stepBy(direction);
    // Reaching a bound disables the button under a keyboard user's focus;
    // hand focus to the value rather than dropping it on <body>.
    const bound = direction > 0 ? max : min;
    if (bound != null && next === bound && button.ownerDocument.activeElement === button) {
      inputRef.current?.focus();
    }
  };

  const input = (
    <input
      ref={ref}
      id={id}
      type="number"
      data-slot={stepper ? 'number-input-field' : 'number-input'}
      data-size={stepper ? undefined : size}
      min={min}
      max={max}
      step={step}
      value={text}
      disabled={disabled}
      readOnly={readOnly}
      className={
        stepper
          ? fieldClass
          : cn(inputVariants({ size }), 'tabular-nums', noSpinners, className)
      }
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      {...props}
    />
  );

  if (!stepper) return input;

  const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';

  return (
    <div
      data-slot="number-input"
      data-size={size}
      data-invalid={invalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly && !disabled ? '' : undefined}
      className={cn(numberInputVariants({ size }), className)}
    >
      <button
        type="button"
        data-slot="number-input-decrement"
        aria-label={decrementLabel}
        aria-controls={id}
        disabled={locked || atMin}
        className={cn(stepClass, stepSize[size], 'border-r border-border-decorative')}
        onClick={handleStep(-1)}
      >
        <MinusGlyph />
      </button>
      {input}
      <button
        type="button"
        data-slot="number-input-increment"
        aria-label={incrementLabel}
        aria-controls={id}
        disabled={locked || atMax}
        className={cn(stepClass, stepSize[size], 'border-l border-border-decorative')}
        onClick={handleStep(1)}
      >
        <PlusGlyph />
      </button>
    </div>
  );
});
NumberInput.displayName = 'NumberInput';
