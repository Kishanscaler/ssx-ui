'use client';

// Client: the group shares its size, disabled state and the addon-text ids
// through context, addon text registers itself with a layout effect, and an
// addon attaches a click handler (a click on the ₹ focuses the field).
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { Button, type ButtonProps } from '../Button';
import { Input, type InputProps } from '../Input';

/* ---------------------------------------------------------------------------
 * InputGroup, InputGroupAddon, InputGroupText, InputGroupButton,
 * InputGroupInput, InputGroupControl
 *
 * One field with things attached: a leading icon, a unit (₹, %, "months",
 * "@scaler.com"), a trailing action (clear, show password, copy). shadcn's
 * `input-group.tsx` shape: the GROUP draws the field chrome (border, radius,
 * fill, hover, the focus ring, invalid, disabled, read-only) and the control
 * inside drops its own, so the ring goes round the whole thing, unit and
 * action included. The group styles off the control's own state with
 * `has-[[data-slot=input-group-control]:focus-visible]` and friends, so
 * `aria-invalid`, `disabled` and `readonly` stay on the control, where a
 * screen reader and a form read them.
 *
 *   <Field label="Scholarship amount" help="Up to ₹19,50,000.">
 *     <InputGroup>
 *       <InputGroupAddon><InputGroupText>₹</InputGroupText></InputGroupAddon>
 *       <InputGroupControl><NumberInput stepper={false} min={0} /></InputGroupControl>
 *     </InputGroup>
 *   </Field>
 *
 *   <InputGroup>
 *     <InputGroupInput type="password" aria-label="Portal password" />
 *     <InputGroupAddon align="inline-end">
 *       <InputGroupButton aria-label="Show password"><Eye /></InputGroupButton>
 *     </InputGroupAddon>
 *   </InputGroup>
 *
 * The parts, and why there are six:
 *   - InputGroup: the chrome and the size. `role="group"`.
 *   - InputGroupAddon: a slot at one end (`align`). Holds an icon, text or
 *     buttons. Clicking it (not a button in it) focuses the control, so the
 *     ₹ reads as part of the field. Visual side comes from `align`; DOM
 *     order is reading and tab order, so put a trailing action AFTER the
 *     control in the markup.
 *   - InputGroupText: a unit or affix. Not part of the value (a form posts
 *     "195000", never "₹195000"). It IS part of the control's description:
 *     its id is added to the control's `aria-describedby`, so "@scaler.com"
 *     is not visual-only. Pass `aria-hidden` when the label already says it
 *     ("Fee (₹)").
 *   - InputGroupButton: a Button sized to sit 4px inside the field at every
 *     size. `neutral` by default (an action on a field must not outshout the
 *     form's submit), disabled with the field.
 *   - InputGroupInput: `Input`, chrome off, size from the group. The common
 *     case in one element.
 *   - InputGroupControl: the same treatment for ANY one control you pass
 *     (`NumberInput stepper={false}`, a masked input, a native <input>). No
 *     element of its own, like FieldControl.
 *
 * Field wiring. A flat `<Field label>` wraps its one child in FieldControl,
 * which sets `id`, `aria-describedby`, `aria-invalid`, `aria-required` and
 * `disabled` on it — here, on the group. The group forwards exactly those to
 * its control (the label's `htmlFor` lands on the input, not the div), so
 * `<Field label><InputGroup>…</InputGroup></Field>` just works. In the
 * compound form you can equally wrap the control itself in FieldControl.
 *
 * Touch. The control keeps Input's 16px coarse-pointer text; addon text
 * follows it so the unit stays on the value's baseline size. Buttons keep
 * Button's 44px `touch-target`, which may reach past the field's edge (the
 * group does not clip: no `overflow-hidden`).
 *
 * Not here: a NumberInput WITH steppers. It already is its own bordered
 * group; put it in an InputGroup with `stepper={false}`. Textarea and block
 * (top / bottom) addons are not built yet.
 * ------------------------------------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type InputGroupSize = 'sm' | 'md' | 'lg';
/** Which end of the field an addon sits at. Logical, so it mirrors in RTL. */
export type InputGroupAddonAlign = 'inline-start' | 'inline-end';
/** A square icon button, or a short text button ("Copy", "Apply"). */
export type InputGroupButtonSize = 'icon' | 'text';

/* ---- context -------------------------------------------------------------- */

type ControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-required'?: React.AriaAttributes['aria-required'];
  disabled?: boolean;
};

type InputGroupContextValue = {
  size: InputGroupSize;
  disabled: boolean;
  /** Control props handed to the group (by a Field, usually), for the control. */
  control: ControlProps;
  /** Ids of the rendered InputGroupText parts, in registration order. */
  textIds: string[];
  registerText: (id: string, present: boolean) => void;
};

const InputGroupContext = React.createContext<InputGroupContextValue | null>(null);

/* `useLayoutEffect` warns during server rendering on React < 19. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const CONTROL = '[data-slot=input-group-control]';

/* ---- InputGroup ----------------------------------------------------------- */

export const inputGroupVariants = cva(
  [
    'group/input-group relative flex w-full min-w-0 items-center',
    // The same chrome as Input: 1px field border, radius-md, the field fill.
    'rounded-md border border-field-border bg-field font-sans text-field-content',
    'transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)] ease-productive-in-out',
    'motion-reduce:transition-none',
    // Hover only while nothing else is saying something louder.
    `[&:not(:has([data-slot=input-group-control]:is(:disabled,:focus-visible,[aria-invalid=true])))]:hover:border-field-border-hover`,
    // Focus: Input's ring contract (3px at half strength + a solid border),
    // drawn by the group, and only when the CONTROL has focus. A focused
    // trailing button draws its own ring; two rings would read as two
    // controls. Invalid is written as the exclusive case so the two never
    // race on variant order.
    `has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]`,
    `has-[[data-slot=input-group-control]:focus-visible:not([aria-invalid=true])]:border-border-focus`,
    `has-[[data-slot=input-group-control]:focus-visible:not([aria-invalid=true])]:ring-border-focus/50`,
    `has-[[data-slot=input-group-control][aria-invalid=true]]:border-danger has-[[data-slot=input-group-control][aria-invalid=true]]:ring-danger/20`,
    // Disabled is a fill, not an opacity (Input, Button).
    `has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:border-action-disabled-border`,
    `has-[[data-slot=input-group-control]:disabled]:bg-field-disabled`,
    // Read-only: Input's dashed border + sunken fill, for the whole group.
    `has-[[data-slot=input-group-control]:read-only:not(:disabled)]:border-dashed has-[[data-slot=input-group-control]:read-only:not(:disabled)]:bg-surface-sunken`,
  ],
  {
    variants: {
      size: {
        // Input's heights and type ramp. The text size here is the ADDON
        // text's; the control carries its own (the same values).
        sm: "h-control-sm text-sm pointer-coarse:text-md [&_[data-slot=input-group-addon]_svg:not([class*='size-'])]:size-icon-sm",
        md: "h-control-md text-base pointer-coarse:text-md [&_[data-slot=input-group-addon]_svg:not([class*='size-'])]:size-icon-md",
        lg: "h-control-lg text-md [&_[data-slot=input-group-addon]_svg:not([class*='size-'])]:size-icon-md",
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type InputGroupProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * Height and type size: 32 / 40 / 48px, Input's `--size-control-*` ramp.
   * The control, the addon text and any InputGroupButton follow it.
   *
   * @default 'md'
   */
  size?: InputGroupSize;
  /**
   * Disables the control and every InputGroupButton in the group (a button
   * can still set `disabled={false}` to stay live). Forwarded as the control's
   * `disabled`, so a Field's `disabled` reaches the input through the group.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Forwarded to the CONTROL, not the group, so a Field's `htmlFor` finds
   * the input. The group itself has no id.
   */
  id?: string;
  /**
   * Forwarded to the control (merged with its own and the addon text ids).
   * This is how a Field's help and error ids reach the input.
   */
  'aria-describedby'?: string;
  /** Forwarded to the control, whose `aria-invalid` the group styles. */
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  /** Forwarded to the control. */
  'aria-required'?: React.AriaAttributes['aria-required'];
};

export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(function InputGroup(
  {
    className,
    size = 'md',
    disabled = false,
    id,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    children,
    ...props
  },
  ref,
) {
  const [textIds, setTextIds] = React.useState<string[]>([]);
  const registerText = React.useCallback((textId: string, present: boolean) => {
    setTextIds((ids) => {
      const has = ids.includes(textId);
      if (present === has) return ids;
      return present ? [...ids, textId] : ids.filter((x) => x !== textId);
    });
  }, []);

  const context = React.useMemo<InputGroupContextValue>(
    () => ({
      size,
      disabled,
      control: {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': ariaInvalid,
        'aria-required': ariaRequired,
        disabled: disabled || undefined,
      },
      textIds,
      registerText,
    }),
    [size, disabled, id, describedBy, ariaInvalid, ariaRequired, textIds, registerText],
  );

  return (
    <InputGroupContext.Provider value={context}>
      <div
        ref={ref}
        role="group"
        data-slot="input-group"
        data-size={size}
        data-disabled={disabled || undefined}
        className={cn(inputGroupVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    </InputGroupContext.Provider>
  );
});
InputGroup.displayName = 'InputGroup';

/* ---- InputGroupAddon ------------------------------------------------------ */

export const inputGroupAddonVariants = cva(
  [
    'flex h-full shrink-0 items-center gap-2 text-content-secondary select-none cursor-text',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    'group-has-[[data-slot=input-group-control]:disabled]/input-group:cursor-not-allowed',
    'group-has-[[data-slot=input-group-control]:disabled]/input-group:text-content-disabled',
  ],
  {
    variants: {
      align: {
        // 12px from the edge, like the control's own padding; a button sits
        // 4px in, so its box is centred in the field at every size.
        'inline-start': 'order-first ps-3 has-[>button]:ps-1 gap-1',
        'inline-end': 'order-last pe-3 has-[>button]:pe-1 gap-1',
      },
    },
    defaultVariants: { align: 'inline-start' },
  },
);

export type InputGroupAddonProps = React.ComponentPropsWithoutRef<'div'> & {
  /**
   * The end it sits at. Visual only: reading and tab order follow the
   * markup, so put a trailing action after the control.
   *
   * @default 'inline-start'
   */
  align?: InputGroupAddonAlign;
};

export const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  function InputGroupAddon({ className, align = 'inline-start', onClick, ...props }, ref) {
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      // A click on the ₹ or the icon is a click on the field; a click on a
      // button in the addon is that button's.
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea')) return;
      const group = event.currentTarget.closest('[data-slot=input-group]');
      const control = group?.querySelector<HTMLElement>(CONTROL);
      if (control && !(control as HTMLInputElement).disabled) control.focus();
    };
    return (
      <div
        ref={ref}
        data-slot="input-group-addon"
        data-align={align}
        className={cn(inputGroupAddonVariants({ align }), className)}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
InputGroupAddon.displayName = 'InputGroupAddon';

/* ---- InputGroupText ------------------------------------------------------- */

export type InputGroupTextProps = React.ComponentPropsWithoutRef<'span'>;

/**
 * A unit or affix: ₹, %, "months", "@scaler.com". Tabular figures, never
 * wraps. Described into the control (see the file comment); `aria-hidden`
 * opts out.
 */
export const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(
  function InputGroupText({ className, id: idProp, ...props }, ref) {
    const group = React.useContext(InputGroupContext);
    const id = useId(idProp);
    const hidden = props['aria-hidden'] === true || props['aria-hidden'] === 'true';
    const register = group?.registerText;
    useIsoLayoutEffect(() => {
      if (!register || hidden) return undefined;
      register(id, true);
      return () => register(id, false);
    }, [register, id, hidden]);
    return (
      <span
        ref={ref}
        id={id}
        data-slot="input-group-text"
        className={cn('flex items-center whitespace-nowrap tabular-nums', className)}
        {...props}
      />
    );
  },
);
InputGroupText.displayName = 'InputGroupText';

/* ---- InputGroupButton ----------------------------------------------------- */

/**
 * Button sizes per group size: the button is the field height less 8px (4px
 * in on every side). `sm` has no Button size of its own (24px), so it is
 * written here.
 */
const BUTTON_SIZE: Record<InputGroupSize, Record<InputGroupButtonSize, { size: ButtonProps['size']; className?: string }>> = {
  sm: {
    icon: { size: 'icon-sm', className: 'size-6 min-w-6' },
    text: { size: 'sm', className: 'min-h-6 px-2 py-0 text-xs has-[>svg]:px-1.5' },
  },
  md: { icon: { size: 'icon-sm' }, text: { size: 'sm' } },
  lg: { icon: { size: 'icon-md' }, text: { size: 'md' } },
};

export type InputGroupButtonProps = Omit<ButtonProps, 'size'> & {
  /**
   * `icon`: a square holding one glyph (give it an `aria-label`: "Show
   * password", "Clear search"). `text`: a short label ("Copy", "Apply").
   * The height follows the group's size.
   *
   * @default 'icon'
   */
  size?: InputGroupButtonSize;
};

export const InputGroupButton = React.forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  function InputGroupButton({ className, size = 'icon', variant = 'neutral', disabled, ...props }, ref) {
    const group = React.useContext(InputGroupContext);
    const spec = BUTTON_SIZE[group?.size ?? 'md'][size] ?? BUTTON_SIZE.md.icon;
    return (
      <Button
        ref={ref}
        data-slot="input-group-button"
        data-size={size}
        variant={variant}
        size={spec.size}
        disabled={disabled ?? (group?.disabled || undefined)}
        className={cn(spec.className, className)}
        {...props}
      />
    );
  },
);
InputGroupButton.displayName = 'InputGroupButton';

/* ---- InputGroupControl / InputGroupInput ---------------------------------- */

/**
 * The chrome the group takes over, removed from the control. Written against
 * Input's recipe (and NumberInput's bare field, which is that recipe): the
 * border, fill, ring and read-only / disabled fills go; the text size, the
 * placeholder, selection and the disabled text colour stay.
 */
export const inputGroupControlClass = cn(
  'h-full min-w-0 flex-1 self-stretch rounded-none border-0 bg-transparent shadow-none',
  'focus-visible:ring-0 disabled:bg-transparent',
  "[&:read-only:not(:disabled):not([type='file'])]:bg-transparent",
  // Beside an addon the gap is 8px, not the edge's 12px: the addon brings
  // its own edge padding.
  'group-has-[>[data-align=inline-start]]/input-group:ps-2',
  'group-has-[>[data-align=inline-end]]/input-group:pe-2',
);

export type InputGroupControlProps = {
  /** Exactly one element: the control (NumberInput, a native <input>, …). */
  children: React.ReactElement;
};

/**
 * Makes its one child the group's control: `data-slot="input-group-control"`
 * (what the group styles off), the chrome removed, the group's size (for a
 * component child that takes one), and the control props the group was
 * handed (`id`, `aria-*`, `disabled`) plus the addon text ids in
 * `aria-describedby`. The child's own props win. Renders no element; the ref
 * lands on the child.
 */
export const InputGroupControl = React.forwardRef<HTMLElement, InputGroupControlProps>(
  function InputGroupControl({ children }, ref) {
    const group = React.useContext(InputGroupContext);
    if (!React.isValidElement(children)) return null;
    const child = children as React.ReactElement<Record<string, unknown>>;
    const own = child.props;

    const describedBy =
      [
        ...(group?.textIds ?? []),
        group?.control['aria-describedby'],
        typeof own['aria-describedby'] === 'string' ? own['aria-describedby'] : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    const wired: Record<string, unknown> = {
      'data-slot': 'input-group-control',
      className: cn(inputGroupControlClass, own.className as string | undefined),
      'aria-describedby': describedBy,
    };
    if (group) {
      const { control } = group;
      if (own.id == null && control.id != null) wired.id = control.id;
      if (own['aria-invalid'] == null && control['aria-invalid'] != null) {
        wired['aria-invalid'] = control['aria-invalid'];
      }
      if (own['aria-required'] == null && own.required == null && control['aria-required'] != null) {
        wired['aria-required'] = control['aria-required'];
      }
      if (own.disabled == null && control.disabled) wired.disabled = true;
      // A component child (Input, NumberInput) takes our size; a host
      // <input>'s `size` is a character count and must not get a string.
      if (typeof child.type !== 'string' && own.size == null) wired.size = group.size;
    }

    return <Slot ref={ref}>{React.cloneElement(child, wired)}</Slot>;
  },
);
InputGroupControl.displayName = 'InputGroupControl';

export type InputGroupInputProps = Omit<InputProps, 'size'>;

/** `Input` as the group's control: chrome off, size from the group. */
export const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  function InputGroupInput(props, ref) {
    return (
      <InputGroupControl>
        <Input ref={ref} {...props} />
      </InputGroupControl>
    );
  },
);
InputGroupInput.displayName = 'InputGroupInput';
