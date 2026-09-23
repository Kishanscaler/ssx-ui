'use client';

// Client: Radix ToggleGroup keeps the pressed set, runs roving focus and
// attaches the handlers.
import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { useControllableState } from '@radix-ui/react-use-controllable-state';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { buttonVariants } from '../Button';
import { buttonGroupVariants } from '../ButtonGroup';
import { useScrollEdges } from '../ButtonGroup/use-scroll-edges';
import { chipInteractiveClass, chipVariants } from '../Chip/Chip';
import { toggleButtonVariants, type ToggleButtonSize } from '../ToggleButton';

/* ---------------------------------------------------------------------------
 * ToggleButtonGroup, ToggleButtonGroupItem
 *
 * A set of toggles that belong together.
 *
 *   type="multiple" (default)  each member is independently on or off; zero
 *                              or all may be on. Filters that narrow a list
 *                              ("Assignment / Quiz / Project / Live class").
 *                              `role="toolbar"`, members `aria-pressed`.
 *   type="single"              one pressed at a time, and pressing it again
 *                              releases it (zero or one). `role="radiogroup"`,
 *                              members `role="radio"` + `aria-checked`.
 *                              Where exactly one must ALWAYS win, that is a
 *                              SegmentedControl, not this.
 *
 * Both are Radix ToggleGroup: one Tab stop, arrow keys between members, Home /
 * End, disabled members skipped; Space / Enter toggles.
 *
 * Two looks, neither of them new:
 *
 *   variant="welded"  ButtonGroup's weld (`buttonGroupVariants`: square inner
 *                     corners, one shared 1px seam, the hovered / focused /
 *                     pressed member lifted above its neighbours) around
 *                     ToggleButton's look (`buttonVariants` secondary +
 *                     `toggleButtonVariants`: filled with an inset top edge
 *                     when on). The denser surface.
 *   variant="chips"   a wrapping row of Chips (`chipVariants`), 8px apart.
 *
 * Values are strings (`string` for single, `string[]` for multiple), so a
 * Storyblok option / multi-option field maps straight in.
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type ToggleButtonGroupVariant = 'welded' | 'chips';
export type ToggleButtonGroupType = 'single' | 'multiple';
export type ToggleButtonGroupSize = ToggleButtonSize;

type GroupContextValue = {
  variant: ToggleButtonGroupVariant;
  size: ToggleButtonGroupSize;
  pressed: string[];
};

const GroupContext = React.createContext<GroupContextValue | null>(null);

type ToggleButtonGroupBaseProps = Omit<
  React.ComponentPropsWithoutRef<'div'>,
  'defaultValue' | 'dir' | 'onChange'
> & {
  /**
   * `welded`: one bordered control with shared seams (ButtonGroup + ToggleButton).
   * `chips`: a wrapping row of filter chips.
   *
   * @default 'welded'
   */
  variant?: ToggleButtonGroupVariant;
  /**
   * Member size, as ToggleButton's (`icon-*` for icon-only members). The chips
   * variant has one size and ignores it.
   *
   * @default 'md'
   */
  size?: ToggleButtonGroupSize;
  /**
   * Disables every member.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * Arrow keys wrap from the last member to the first.
   *
   * @default true
   */
  loop?: boolean;
  /**
   * What the group filters or sets, announced before its members ("Filter
   * coursework by type"). Required in practice.
   */
  'aria-label'?: string;
};

export type ToggleButtonGroupSingleProps = ToggleButtonGroupBaseProps & {
  /** One pressed at a time (zero or one). */
  type: 'single';
  /** The pressed member's `value`, `''` for none (controlled). */
  value?: string;
  /**
   * The pressed member at first (uncontrolled).
   *
   * @default ''
   */
  defaultValue?: string;
  /** Called with the pressed member's `value`, `''` when it is released. */
  onValueChange?: (value: string) => void;
};

export type ToggleButtonGroupMultipleProps = ToggleButtonGroupBaseProps & {
  /**
   * Each member on or off independently.
   *
   * @default 'multiple'
   */
  type?: 'multiple';
  /** The pressed members' values (controlled). */
  value?: string[];
  /**
   * The pressed members at first (uncontrolled).
   *
   * @default []
   */
  defaultValue?: string[];
  /** Called with every pressed member's value after each toggle. */
  onValueChange?: (value: string[]) => void;
};

export type ToggleButtonGroupProps = ToggleButtonGroupSingleProps | ToggleButtonGroupMultipleProps;

const toList = (value: string | string[] | undefined): string[] | undefined =>
  value === undefined ? undefined : Array.isArray(value) ? value : value ? [value] : [];

const EMPTY: string[] = [];

export const ToggleButtonGroup = React.forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  function ToggleButtonGroup(props, ref) {
    const {
      className,
      type = 'multiple',
      variant = 'welded',
      size = 'md',
      value: valueProp,
      defaultValue,
      onValueChange,
      disabled = false,
      loop = true,
      ...rest
    } = props;

    const single = type === 'single';
    const [pressed, setPressed] = useControllableState<string[]>({
      prop: toList(valueProp),
      defaultProp: toList(defaultValue) ?? EMPTY,
      onChange: (next) => {
        if (!onValueChange) return;
        if (single) (onValueChange as (v: string) => void)(next[0] ?? '');
        else (onValueChange as (v: string[]) => void)(next);
      },
      caller: 'ToggleButtonGroup',
    });

    const context = React.useMemo(() => ({ variant, size, pressed }), [variant, size, pressed]);

    // The weld scrolls sideways when it does not fit (ButtonGroup's recipe);
    // this marks which edge hides members so the fade is drawn there. Chips
    // wrap instead, so they need no measuring.
    const rootRef = React.useRef<HTMLDivElement>(null);
    const composedRef = useComposedRefs(ref, rootRef);
    useScrollEdges(rootRef, variant === 'welded');

    const shared = {
      ref: composedRef,
      'data-slot': 'toggle-button-group',
      'data-variant': variant,
      'data-size': size,
      'data-type': type,
      disabled,
      loop,
      className: cn(
        variant === 'welded' ? buttonGroupVariants() : 'inline-flex max-w-full flex-wrap items-center gap-2',
        className,
      ),
      ...rest,
    };

    return (
      <GroupContext.Provider value={context}>
        {single ? (
          <ToggleGroupPrimitive.Root
            {...shared}
            type="single"
            value={pressed[0] ?? ''}
            onValueChange={(v: string) => setPressed(v ? [v] : EMPTY)}
          />
        ) : (
          <ToggleGroupPrimitive.Root
            {...shared}
            type="multiple"
            value={pressed}
            onValueChange={(v: string[]) => setPressed(v)}
          />
        )}
      </GroupContext.Provider>
    );
  },
);
ToggleButtonGroup.displayName = 'ToggleButtonGroup';

export type ToggleButtonGroupItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
  'value'
> & {
  /** This member's value, reported by the group's `onValueChange`. */
  value: string;
  /**
   * Glyph before the label while NOT pressed (regular weight). Also shown
   * while pressed when `pressedIcon` is not given.
   */
  icon?: React.ReactNode;
  /** Glyph while pressed (the fill weight). */
  pressedIcon?: React.ReactNode;
  /**
   * Makes this member unavailable.
   *
   * @default false
   */
  disabled?: boolean;
};

export const ToggleButtonGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleButtonGroupItemProps
>(function ToggleButtonGroupItem({ className, value, icon, pressedIcon, children, ...props }, ref) {
  const group = React.useContext(GroupContext);
  const variant = group?.variant ?? 'welded';
  const size = group?.size ?? 'md';
  const on = group?.pressed.includes(value) ?? false;
  const glyph = on && pressedIcon != null ? pressedIcon : icon;

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      data-slot="toggle-button-group-item"
      value={value}
      className={cn(
        variant === 'welded'
          ? [
              buttonVariants({ variant: 'secondary', size }),
              toggleButtonVariants({ size }),
              // A member rising out of the weld tears the group apart (the same
              // cancel Button applies inside a ButtonGroup).
              'idle:hover:translate-y-0',
            ]
          : [chipVariants(), chipInteractiveClass],
        className,
      )}
      {...props}
    >
      {glyph}
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleButtonGroupItem.displayName = 'ToggleButtonGroupItem';
