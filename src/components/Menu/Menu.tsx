'use client';

// Client: Radix DropdownMenu keeps open state, attaches handlers and portals.
import * as React from 'react';
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { Kbd } from '../Kbd';

/* ---------------------------------------------------------------------------
 * Menu
 *
 * A list of ACTIONS on one object, opened from a labelled button ("Cohort
 * actions") or, as the More Menu, from an icon-only ⋯ button in a dense row
 * ("More actions for Aarav Krishnan" — the label names the object, because a
 * list of forty rows otherwise says "More actions" forty times). If the list
 * chooses a value that stays chosen in a form, it is a Select, not a Menu.
 *
 * Radix DropdownMenu pays the keyboard contract the preview insists the
 * `role="menu"` announces: arrows, Home / End, type-ahead, Escape, roving
 * focus, disabled rows announced but skipped.
 *
 *   <Menu>
 *     <MenuTrigger asChild>
 *       <Button variant="secondary">Cohort actions <CaretDown /></Button>
 *     </MenuTrigger>
 *     <MenuContent>
 *       <MenuItem icon={<DownloadSimple />} shortcut="⌘E">Export CSV</MenuItem>
 *       <MenuItem icon={<Archive />} disabled>Archive</MenuItem>
 *       <MenuSeparator />
 *       <MenuItem variant="danger" icon={<Trash />}>Delete cohort</MenuItem>
 *     </MenuContent>
 *   </Menu>
 *
 * Rows:
 *   - `icon` is a leading column (20px, secondary ink; the glyph is the row's
 *     identity, so it stays neutral on a chosen row, and goes red / disabled
 *     with a danger / disabled row). It is a slot rather than a child because
 *     a two-line row needs the icon in its OWN column, beside both lines.
 *   - `description` makes a two-line row: headline + supporting line in ONE
 *     menuitem, so the row has one name and one target. The subline is
 *     secondary ink (never tertiary: it fails AA on a chosen row).
 *   - `shortcut` renders a Kbd on the trailing edge.
 *   - Destructive rows go last, below a separator (`variant="danger"`).
 *   - A row that shows a check is `MenuRadioItem` / `MenuCheckboxItem`
 *     (`menuitemradio` / `menuitemcheckbox` + `aria-checked`), never a plain
 *     item with a glyph. The check column is on the TRAILING edge (the leading
 *     one means "what this row is about") and always reserved, so moving the
 *     selection never reflows the panel.
 *
 * Theming: the panel portals to <body>; it is themed because `data-brand` /
 * `data-theme` sit on <html> (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

/* ---- glyph ---------------------------------------------------------------- */

/** Phosphor 2.1.1 `check` regular (`ph-check` in the preview sprite). */
function CheckGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}

/* ---- Root / Trigger ------------------------------------------------------- */

export type MenuProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Root>;

/**
 * The state holder (`open` / `defaultOpen` / `onOpenChange`, `modal`). Renders
 * no DOM of its own.
 */
export function Menu(props: MenuProps) {
  return <MenuPrimitive.Root {...props} />;
}
Menu.displayName = 'Menu';

export type MenuTriggerProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Trigger>;

/**
 * Use with `asChild` and a `Button` / `IconButton`, which keep their own look
 * and `data-slot`; Radix adds `aria-haspopup="menu"`, `aria-expanded` and
 * `data-state`.
 */
export const MenuTrigger = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Trigger>,
  MenuTriggerProps
>(function MenuTrigger({ asChild = false, ...props }, ref) {
  return (
    <MenuPrimitive.Trigger
      ref={ref}
      asChild={asChild}
      // Not under asChild: the slot would overwrite the child's own
      // `data-slot="button"`, which consumers target. (Omitted, not
      // `undefined`: an undefined key still overrides in a props spread.)
      {...(asChild ? null : { 'data-slot': 'menu-trigger' })}
      {...props}
    />
  );
});
MenuTrigger.displayName = 'MenuTrigger';

/* ---- Content -------------------------------------------------------------- */

export type MenuContentProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content> & {
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Portal>['container'];
};

export const MenuContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  MenuContentProps
>(function MenuContent({ className, sideOffset = 4, align = 'start', container, ...props }, ref) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Content
        ref={ref}
        data-slot="menu-content"
        // The Button `neutral` contract: a raised surface flips its hover.
        data-elevation="raised"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          // The Menu / Popover surface — the same panel Select draws.
          'z-popover min-w-[220px] overflow-y-auto p-1',
          'max-h-(--radix-dropdown-menu-content-available-height)',
          'max-w-[min(420px,var(--radix-dropdown-menu-content-available-width))]',
          'rounded-xl border border-border-raised bg-surface-raised text-content shadow-raised',
          'font-sans outline-none',
          // Entrance only (Radix unmounts on close). `@starting-style`: no
          // keyframes; below Chrome 117 / Safari 17.5 the panel just appears.
          'transition-[opacity,translate] duration-[var(--motion-duration-normal)] ease-productive-entrance',
          'starting:-translate-y-1 starting:opacity-0',
          'motion-reduce:transition-none',
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});
MenuContent.displayName = 'MenuContent';

/* ---- Item recipe ---------------------------------------------------------- */

export const menuItemVariants = cva(
  [
    'group/menu-item relative flex w-full cursor-pointer select-none items-center gap-3',
    'rounded-md px-3 py-2 text-left text-base leading-body text-content no-underline outline-none',
    'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
    // The highlight is a position (pointer / arrows), not a choice.
    'data-[highlighted]:bg-surface-hover',
    // Keyboard focus is also drawn as the system's 2px ring, offset, so a
    // keyboard user can tell the focused row from the hovered one.
    'focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-border-focus',
    // Two-line rows pin every column to the headline, not the row's middle.
    'data-[two-line]:items-start',
    // Disabled rows stay, announced as unavailable, and are skipped.
    'data-[disabled]:cursor-not-allowed data-[disabled]:bg-transparent data-[disabled]:text-content-disabled',
  ],
  {
    variants: {
      variant: {
        default: '',
        danger: 'text-danger-content',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

/** String union, so a Storyblok option value can be passed straight in. */
export type MenuItemVariant = 'default' | 'danger';

type RowSlots = {
  /**
   * A leading glyph (20px, secondary ink), in its own column beside both lines
   * of a two-line row. Decorative: the label names the row.
   */
  icon?: React.ReactNode;
  /**
   * A supporting line under the headline. Makes the row two-line; it is part
   * of the same menuitem, so it is read as part of the row's name.
   */
  description?: React.ReactNode;
  /**
   * A keyboard shortcut on the trailing edge. A string renders in a `Kbd`
   * (`"⌘E"`); pass a `KbdGroup` for a combination. It is a hint only: the
   * shortcut itself is the app's to bind.
   */
  shortcut?: React.ReactNode;
};

const isRendered = (node: React.ReactNode) => node != null && node !== false && node !== '';

/** The columns every row shares: icon · text · shortcut · (check). */
function RowBody({
  icon,
  description,
  shortcut,
  check,
  children,
}: RowSlots & { check?: React.ReactNode; children: React.ReactNode }) {
  const twoLine = isRendered(description);
  return (
    <>
      {isRendered(icon) ? (
        <span
          data-slot="menu-item-icon"
          className={cn(
            'flex shrink-0 items-center text-content-secondary',
            "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-md",
            // Line the glyph up with the headline's line box (loose leading).
            twoLine && 'h-[1lh] leading-loose',
            // Danger and disabled rows take the glyph with them.
            'group-data-[variant=danger]/menu-item:text-inherit group-data-[disabled]/menu-item:text-inherit',
          )}
        >
          {icon}
        </span>
      ) : null}
      {twoLine ? (
        <span
          data-slot="menu-item-text"
          // A definite width (the system's short measure), not only a max, so
          // the panel opens at the width it documents instead of shrinking to
          // its min-width and wrapping the subline onto three lines.
          className="grid w-[var(--size-measure-min)] min-w-0 max-w-full flex-1 gap-0.5"
        >
          <span data-slot="menu-item-label" className="leading-loose">
            {children}
          </span>
          <span
            data-slot="menu-item-description"
            className={cn(
              // Resets the weight a checked row puts on the whole item: only
              // the headline goes semibold.
              'text-sm leading-base font-regular text-content-secondary',
              'group-data-[disabled]/menu-item:text-inherit',
            )}
          >
            {description}
          </span>
        </span>
      ) : (
        <span data-slot="menu-item-label" className="min-w-0 flex-1">
          {children}
        </span>
      )}
      {isRendered(shortcut) ? (
        <span data-slot="menu-item-shortcut" className="ms-auto flex shrink-0 items-center">
          {typeof shortcut === 'string' ? <Kbd>{shortcut}</Kbd> : shortcut}
        </span>
      ) : null}
      {check}
    </>
  );
}

/** The plain text of a label, for type-ahead: the headline, never the subline. */
function textOf(node: React.ReactNode): string | undefined {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return undefined;
}

/* ---- MenuItem ------------------------------------------------------------- */

export type MenuItemProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> &
  RowSlots & {
    /**
     * `danger` for a destructive action. It goes last, below a separator.
     *
     * @default 'default'
     */
    variant?: MenuItemVariant;
  };

/**
 * One action. `onSelect` fires on click, Enter and Space, then the menu
 * closes (call `event.preventDefault()` to keep it open). `asChild` renders
 * the row as its child, e.g. a link: `<MenuItem asChild><a href="/profile">
 * Profile</a></MenuItem>`; the child's text becomes the label.
 */
export const MenuItem = React.forwardRef<React.ElementRef<typeof MenuPrimitive.Item>, MenuItemProps>(
  function MenuItem(
    { className, variant = 'default', icon, description, shortcut, asChild = false, children, textValue, ...props },
    ref,
  ) {
    const twoLine = isRendered(description);
    const row = (label: React.ReactNode) => (
      <RowBody icon={icon} description={description} shortcut={shortcut}>
        {label}
      </RowBody>
    );

    let content: React.ReactNode;
    let label: React.ReactNode = children;
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ children?: React.ReactNode }>;
      label = child.props.children;
      content = React.cloneElement(child, undefined, row(label));
    } else {
      content = row(children);
    }

    return (
      <MenuPrimitive.Item
        ref={ref}
        asChild={asChild}
        data-slot="menu-item"
        data-variant={variant}
        data-two-line={twoLine ? '' : undefined}
        textValue={textValue ?? textOf(label)}
        className={cn(menuItemVariants({ variant }), className)}
        {...props}
      >
        {content}
      </MenuPrimitive.Item>
    );
  },
);
MenuItem.displayName = 'MenuItem';

/* ---- Checkable items ------------------------------------------------------ */

const checkableClass = [
  // A chosen row: brand ink and semibold on the headline (the subline resets).
  'data-[state=checked]:font-semibold data-[state=checked]:text-content-brand',
  'data-[disabled]:data-[state=checked]:font-regular data-[disabled]:data-[state=checked]:text-content-disabled',
];

/**
 * The trailing check column: always present, only its visibility toggles, so
 * moving the selection changes no width or height. A disabled row never shows
 * a check (an unavailable option cannot be the chosen one).
 */
function CheckColumn({ Indicator }: { Indicator: typeof MenuPrimitive.ItemIndicator }) {
  return (
    <span
      data-slot="menu-item-check"
      className={cn(
        'flex size-icon-md shrink-0 items-center justify-center text-content-brand',
        'group-data-[two-line]/menu-item:h-[1lh] group-data-[two-line]/menu-item:leading-loose',
        'group-data-[disabled]/menu-item:invisible',
      )}
    >
      <Indicator forceMount className="flex data-[state=unchecked]:invisible">
        <CheckGlyph className="size-icon-md" />
      </Indicator>
    </span>
  );
}

export type MenuCheckboxItemProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem> &
  RowSlots & {
    /**
     * The initial state when uncontrolled (Radix's item is controlled-only;
     * this lets a static page or a CMS blok render one without state).
     *
     * @default false
     */
    defaultChecked?: boolean;
  };

/**
 * An independent on / off setting in a menu (`menuitemcheckbox`), e.g.
 * "Show archived cohorts". `checked` / `onCheckedChange`.
 */
export const MenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.CheckboxItem>,
  MenuCheckboxItemProps
>(function MenuCheckboxItem(
  {
    className,
    icon,
    description,
    shortcut,
    children,
    textValue,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    ...props
  },
  ref,
) {
  const [checked, setChecked] = useControllableState<boolean | 'indeterminate'>({
    prop: checkedProp,
    defaultProp: defaultChecked,
    onChange: onCheckedChange as ((value: boolean | 'indeterminate') => void) | undefined,
    caller: 'MenuCheckboxItem',
  });
  return (
    <MenuPrimitive.CheckboxItem
      ref={ref}
      checked={checked}
      onCheckedChange={setChecked}
      data-slot="menu-checkbox-item"
      data-two-line={isRendered(description) ? '' : undefined}
      textValue={textValue ?? textOf(children)}
      className={cn(menuItemVariants({ variant: 'default' }), checkableClass, className)}
      {...props}
    >
      <RowBody
        icon={icon}
        description={description}
        shortcut={shortcut}
        check={<CheckColumn Indicator={MenuPrimitive.ItemIndicator} />}
      >
        {children}
      </RowBody>
    </MenuPrimitive.CheckboxItem>
  );
});
MenuCheckboxItem.displayName = 'MenuCheckboxItem';

export type MenuRadioGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioGroup>,
  'defaultValue'
> & {
  /**
   * The initial choice when uncontrolled (Radix's group is controlled-only;
   * this lets a static page or a CMS blok render one without state).
   */
  defaultValue?: string;
};

/** A set of `MenuRadioItem`s, exactly one chosen: `value` / `onValueChange`, or `defaultValue`. */
export const MenuRadioGroup = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.RadioGroup>,
  MenuRadioGroupProps
>(function MenuRadioGroup({ value: valueProp, defaultValue, onValueChange, ...props }, ref) {
  const [value, setValue] = useControllableState<string | undefined>({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange as ((value: string | undefined) => void) | undefined,
    caller: 'MenuRadioGroup',
  });
  return (
    <MenuPrimitive.RadioGroup
      ref={ref}
      data-slot="menu-radio-group"
      value={value}
      onValueChange={setValue}
      {...props}
    />
  );
});
MenuRadioGroup.displayName = 'MenuRadioGroup';

export type MenuRadioItemProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem> & RowSlots;

/**
 * One mode of a set (`menuitemradio`), e.g. the reporting scope. A menu may
 * SET A MODE and say so; a control that fills a form field is a Select.
 */
export const MenuRadioItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.RadioItem>,
  MenuRadioItemProps
>(function MenuRadioItem({ className, icon, description, shortcut, children, textValue, ...props }, ref) {
  return (
    <MenuPrimitive.RadioItem
      ref={ref}
      data-slot="menu-radio-item"
      data-two-line={isRendered(description) ? '' : undefined}
      textValue={textValue ?? textOf(children)}
      className={cn(menuItemVariants({ variant: 'default' }), checkableClass, className)}
      {...props}
    >
      <RowBody
        icon={icon}
        description={description}
        shortcut={shortcut}
        check={<CheckColumn Indicator={MenuPrimitive.ItemIndicator} />}
      >
        {children}
      </RowBody>
    </MenuPrimitive.RadioItem>
  );
});
MenuRadioItem.displayName = 'MenuRadioItem';

/* ---- Group / Label / Separator -------------------------------------------- */

export type MenuGroupProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Group>;

/** Rows that belong together; name it with a `MenuLabel` inside. */
export const MenuGroup = React.forwardRef<React.ElementRef<typeof MenuPrimitive.Group>, MenuGroupProps>(
  function MenuGroup(props, ref) {
    return <MenuPrimitive.Group ref={ref} data-slot="menu-group" {...props} />;
  },
);
MenuGroup.displayName = 'MenuGroup';

export type MenuLabelProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Label>;

/** A group heading ("Share", "Danger zone"). Not focusable, not an action. */
export const MenuLabel = React.forwardRef<React.ElementRef<typeof MenuPrimitive.Label>, MenuLabelProps>(
  function MenuLabel({ className, ...props }, ref) {
    return (
      <MenuPrimitive.Label
        ref={ref}
        data-slot="menu-label"
        className={cn(
          'px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wide text-content-secondary',
          className,
        )}
        {...props}
      />
    );
  },
);
MenuLabel.displayName = 'MenuLabel';

export type MenuSeparatorProps = React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>;

export const MenuSeparator = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Separator>,
  MenuSeparatorProps
>(function MenuSeparator({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Separator
      ref={ref}
      data-slot="menu-separator"
      className={cn('my-1 h-px bg-border-decorative', className)}
      {...props}
    />
  );
});
MenuSeparator.displayName = 'MenuSeparator';
