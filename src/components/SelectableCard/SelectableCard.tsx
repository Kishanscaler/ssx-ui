'use client';

// Client: the group keeps the chosen value(s) and shares them through context;
// the marker is the client Checkbox / RadioGroupItem atom.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useId } from '../../lib/use-id';
import { Card, CardBody, CardDescription, CardEyebrow, CardTitle } from '../Card';
import { Checkbox } from '../Checkbox';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';

/* ---------------------------------------------------------------------------
 * SelectableCard, SelectableCardGroup
 *
 * A card that HOLDS a choice rather than going anywhere: pressing it turns it
 * on and leaves it on. Use it where each option deserves more than a radio
 * label — a programme, a plan, a cohort. Past about six options it is a list.
 * A card that navigates is a ClickableCard.
 *
 *   <SelectableCardGroup type="single" aria-label="Choose a fee plan" defaultValue="a">
 *     <SelectableCard value="a" eyebrow="Plan A" title="Pay in two instalments" description="…" />
 *     <SelectableCard value="b" eyebrow="Plan B" title="Deferred, income-share" description="…" />
 *   </SelectableCardGroup>
 *
 * THE MARKER IS THE ATOM. The card is a Card rendered as a `<label>` around
 * the real control: `RadioGroupItem` in a `type="single"` group (exactly one
 * is on; arrows move and select, Tab leaves), `Checkbox` in a
 * `type="multiple"` group or standing alone (any number; Space toggles). So
 * the 18px box is literally the Checkbox / Radio atom and cannot drift from
 * it, the shape carries the arity (square: one of several, circle: one of
 * one), and the label makes the WHOLE card the click target.
 *
 * Name and description: the control is named by the eyebrow + title and
 * described by the description and any children (a status Badge), so a
 * screen reader hears "SST, B.Sc CS & AI, radio button, checked, Batch of 2029
 * · 240 seats" rather than one run-on string.
 *
 * States, as the HTML: hover is `border-control-hover` (NOT the brand border,
 * which reads as chosen); selected is the brand border + an inset brand ring
 * + `surface-brand-subtle` fill, three signals so it never relies on hue;
 * focus belongs to the card (a 2px focus outline, offset 2px), not to the box
 * inside; disabled dims the card and takes it out of the pointer's way.
 * ------------------------------------------------------------------------- */

/** `single` radio semantics, exactly one on · `multiple` checkbox semantics, any number on. */
export type SelectableCardGroupType = 'single' | 'multiple';
/** Columns from the `sm` breakpoint up; always one column below it. */
export type SelectableCardGroupColumns = '1' | '2' | '3';

type GroupContextValue =
  | { type: 'single'; value: string; disabled: boolean }
  | {
      type: 'multiple';
      value: string[];
      disabled: boolean;
      name?: string;
      required: boolean;
      toggle: (value: string, on: boolean) => void;
    };

const GroupContext = React.createContext<GroupContextValue | null>(null);

export const selectableCardGroupVariants = cva('grid grid-cols-1 gap-4', {
  variants: {
    columns: {
      '1': '',
      '2': 'sm:grid-cols-2',
      // Two at `sm` first: three ~200px cards at 672px squeeze a title and a
      // description into a tall narrow column. Three from `md` (1056px).
      '3': 'sm:grid-cols-2 md:grid-cols-3',
    },
  },
  defaultVariants: { columns: '2' },
});

/* ---- SelectableCardGroup -------------------------------------------------- */

type GroupBaseProps = {
  /**
   * Columns from the `sm` breakpoint up (one column below it). `'3'` steps
   * 1 → 2 at `sm` (672px) → 3 at `md` (1056px).
   *
   * @default '2'
   */
  columns?: SelectableCardGroupColumns;
  /**
   * Disables every card in the group.
   *
   * @default false
   */
  disabled?: boolean;
  /** Form field name. `single`: one value is posted; `multiple`: one entry per chosen card. */
  name?: string;
  /**
   * A choice is required before the form submits.
   *
   * @default false
   */
  required?: boolean;
};

export type SelectableCardGroupSingleProps = GroupBaseProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'dir'> & {
    /** Radio semantics: exactly one card is on. */
    type?: 'single';
    /** The chosen card's `value` (controlled). Pair it with `onValueChange`. */
    value?: string;
    /** The card chosen first when uncontrolled. */
    defaultValue?: string;
    /** Called with the chosen card's `value`. */
    onValueChange?: (value: string) => void;
  };

export type SelectableCardGroupMultipleProps = GroupBaseProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> & {
    /** Checkbox semantics: any number of cards may be on. */
    type: 'multiple';
    /** The chosen cards' values (controlled). Pair it with `onValueChange`. */
    value?: string[];
    /** The cards chosen first when uncontrolled. */
    defaultValue?: string[];
    /** Called with every chosen card's `value`, in the order they were chosen. */
    onValueChange?: (value: string[]) => void;
  };

export type SelectableCardGroupProps = SelectableCardGroupSingleProps | SelectableCardGroupMultipleProps;

const EMPTY: string[] = [];

const SingleGroup = React.forwardRef<HTMLDivElement, SelectableCardGroupSingleProps>(function SingleGroup(
  { className, columns = '2', disabled = false, value: valueProp, defaultValue, onValueChange, type: _type, ...props },
  ref,
) {
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue ?? '',
    onChange: onValueChange,
    caller: 'SelectableCardGroup',
  });
  const ctx = React.useMemo<GroupContextValue>(
    () => ({ type: 'single', value: value ?? '', disabled }),
    [value, disabled],
  );
  return (
    <GroupContext.Provider value={ctx}>
      <RadioGroup
        ref={ref}
        data-slot="selectable-card-group"
        data-type="single"
        data-columns={columns}
        value={value ?? ''}
        onValueChange={setValue}
        disabled={disabled}
        className={cn(selectableCardGroupVariants({ columns }), className)}
        {...props}
      />
    </GroupContext.Provider>
  );
});

const MultipleGroup = React.forwardRef<HTMLDivElement, SelectableCardGroupMultipleProps>(function MultipleGroup(
  {
    className,
    columns = '2',
    disabled = false,
    name,
    required = false,
    value: valueProp,
    defaultValue,
    onValueChange,
    type: _type,
    role,
    ...props
  },
  ref,
) {
  const [value, setValue] = useControllableState<string[]>({
    prop: valueProp,
    defaultProp: defaultValue ?? EMPTY,
    onChange: onValueChange,
    caller: 'SelectableCardGroup',
  });
  const current = value ?? EMPTY;
  const toggle = React.useCallback(
    (item: string, on: boolean) =>
      setValue((prev = EMPTY) => (on ? (prev.includes(item) ? prev : [...prev, item]) : prev.filter((v) => v !== item))),
    [setValue],
  );
  const ctx = React.useMemo<GroupContextValue>(
    () => ({ type: 'multiple', value: current, disabled, name, required, toggle }),
    [current, disabled, name, required, toggle],
  );
  return (
    <GroupContext.Provider value={ctx}>
      <div
        ref={ref}
        role={role ?? 'group'}
        data-slot="selectable-card-group"
        data-type="multiple"
        data-columns={columns}
        data-disabled={disabled ? '' : undefined}
        className={cn(selectableCardGroupVariants({ columns }), className)}
        {...props}
      />
    </GroupContext.Provider>
  );
});

/**
 * The set of choices, laid out as a grid. `type="single"` is a RadioGroup
 * (`role="radiogroup"`); `type="multiple"` is `role="group"`. Name it with
 * `aria-label` / `aria-labelledby` ("Choose a fee plan").
 */
export const SelectableCardGroup = React.forwardRef<HTMLDivElement, SelectableCardGroupProps>(
  function SelectableCardGroup(props, ref) {
    return props.type === 'multiple' ? (
      <MultipleGroup ref={ref} {...props} />
    ) : (
      <SingleGroup ref={ref} {...(props as SelectableCardGroupSingleProps)} />
    );
  },
);
SelectableCardGroup.displayName = 'SelectableCardGroup';

/* ---- SelectableCard ------------------------------------------------------- */

export const selectableCardVariants = cva([
  'block w-full cursor-pointer text-left',
  'transition-[border-color,background-color,box-shadow] duration-(--motion-duration-fast) ease-productive-in-out',
  'motion-reduce:transition-none',
  // Hover is NOT the brand border: that reads as chosen.
  'not-data-disabled:not-data-[state=checked]:hover:border-border-control-hover',
  // Selected: three signals — brand border, inset brand ring, brand-subtle fill.
  'data-[state=checked]:border-border-brand data-[state=checked]:bg-surface-brand-subtle',
  'data-[state=checked]:inset-ring data-[state=checked]:inset-ring-border-brand',
  // Focus belongs to the card, which is what gets activated.
  'has-[[data-slot=selectable-card-control]:focus-visible]:outline-2',
  'has-[[data-slot=selectable-card-control]:focus-visible]:outline-offset-2',
  'has-[[data-slot=selectable-card-control]:focus-visible]:outline-border-focus',
  // Disabled: dimmed, as the HTML's `opacity: var(--opacity-disabled)`.
  'data-disabled:cursor-not-allowed data-disabled:opacity-disabled',
]);

export type SelectableCardProps = Omit<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  'title' | 'defaultChecked' | 'onChange'
> & {
  /**
   * This card's value in its group, and the value posted with the form. Required
   * inside a `SelectableCardGroup`.
   *
   * @default 'on'
   */
  value?: string;
  /** Kicker beside the marker (12px caps): the brand, the plan letter. Part of the name. */
  eyebrow?: React.ReactNode;
  /** The option's name, in the card title style. Part of the control's accessible name. */
  title?: React.ReactNode;
  /** One or two lines of detail under the title. Read as the control's description. */
  description?: React.ReactNode;
  /**
   * The card cannot be changed (it keeps showing its state: "locked by ops").
   *
   * @default false
   */
  disabled?: boolean;
  /** Standalone card (no group) only: on or off (controlled). Pair it with `onCheckedChange`. */
  checked?: boolean;
  /**
   * Standalone card (no group) only: on at first, when uncontrolled.
   *
   * @default false
   */
  defaultChecked?: boolean;
  /** Standalone card (no group) only: called with the new state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Standalone card only: form field name. In a group the group's `name` is used. */
  name?: string;
  /**
   * Standalone card only: must be on before the form submits.
   *
   * @default false
   */
  required?: boolean;
};

/**
 * One choice. Inside a `SelectableCardGroup` it takes the group's semantics
 * (radio or checkbox); alone it is a checkbox card. Extra `children` (a
 * Badge) render at the end of the body.
 */
export const SelectableCard = React.forwardRef<HTMLLabelElement, SelectableCardProps>(
  function SelectableCard(
    {
      className,
      value = 'on',
      eyebrow,
      title,
      description,
      disabled: disabledProp = false,
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      name,
      required = false,
      children,
      id,
      ...props
    },
    ref,
  ) {
    const group = React.useContext(GroupContext);
    const [ownChecked, setOwnChecked] = useControllableState<boolean>({
      prop: checkedProp,
      defaultProp: defaultChecked,
      onChange: onCheckedChange,
      caller: 'SelectableCard',
    });

    const baseId = useId();
    const controlId = id ?? `${baseId}-control`;
    const eyebrowId = `${baseId}-eyebrow`;
    const titleId = `${baseId}-title`;
    const descriptionId = `${baseId}-description`;
    const extraId = `${baseId}-extra`;

    const disabled = disabledProp || Boolean(group?.disabled);
    let checked: boolean;
    if (group?.type === 'single') checked = group.value === value;
    else if (group?.type === 'multiple') checked = group.value.includes(value);
    else checked = Boolean(ownChecked);

    const labelledBy = [eyebrow != null && eyebrowId, title != null && titleId].filter(Boolean).join(' ');
    const describedBy = [description != null && descriptionId, children != null && extraId]
      .filter(Boolean)
      .join(' ');
    const a11y = {
      id: controlId,
      'aria-labelledby': labelledBy || undefined,
      'aria-describedby': describedBy || undefined,
      'data-slot': 'selectable-card-control',
      // The card draws the focus ring; the box inside would be a second one.
      className: 'focus-visible:ring-0',
      disabled,
    };

    const control =
      group?.type === 'single' ? (
        <RadioGroupItem value={value} {...a11y} />
      ) : (
        <Checkbox
          {...a11y}
          value={value}
          name={group?.type === 'multiple' ? group.name : name}
          required={group?.type === 'multiple' ? group.required && group.value.length === 0 : required}
          checked={checked}
          onCheckedChange={(next) => {
            const on = next === true;
            if (group?.type === 'multiple') group.toggle(value, on);
            else setOwnChecked(on);
          }}
        />
      );

    return (
      <Card
        asChild
        data-slot="selectable-card"
        data-state={checked ? 'checked' : 'unchecked'}
        data-disabled={disabled ? '' : undefined}
        data-type={group?.type === 'single' ? 'radio' : 'checkbox'}
        className={cn(selectableCardVariants(), className)}
      >
        <label ref={ref} htmlFor={controlId} {...props}>
          <CardBody data-slot="selectable-card-body">
            <span data-slot="selectable-card-marker" className="flex w-full items-center gap-2">
              {control}
              {eyebrow != null ? (
                <CardEyebrow id={eyebrowId} className="min-w-0 grow">
                  {eyebrow}
                </CardEyebrow>
              ) : null}
            </span>
            {title != null ? (
              <CardTitle as="p" id={titleId}>
                {title}
              </CardTitle>
            ) : null}
            {description != null ? <CardDescription id={descriptionId}>{description}</CardDescription> : null}
            {children != null ? (
              <div id={extraId} data-slot="selectable-card-extra" className="flex flex-wrap items-center gap-2">
                {children}
              </div>
            ) : null}
          </CardBody>
        </label>
      </Card>
    );
  },
);
SelectableCard.displayName = 'SelectableCard';
