'use client';

// Client: Radix Select keeps open/value state, attaches handlers and portals.
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { CheckGlyph, ChevronDownFillGlyph, ChevronDownGlyph, ChevronUpGlyph } from './_glyphs';

/* ---------------------------------------------------------------------------
 * Select
 *
 * One value from a known, closed list. A custom listbox on Radix Select, not
 * the native <select>: the native menu is drawn by the operating system, in its
 * type at its sizes, and it was the one surface where the system lost control
 * of its own product (preview, "This no longer opens the operating system's
 * menu"). Radix pays the accessibility bill the HTML spec lists: combobox over
 * listbox, arrows / Home / End, Enter and Space commit, Escape closes without
 * committing, type-ahead, and a hidden native <select> inside a <form>.
 *
 * Deliberately NOT here: filtering. Past ~25 options this becomes a Combobox.
 *
 * The trigger has its OWN size recipe (`selectTriggerVariants`) on the shared
 * control tokens, rather than wearing Input's classes — the preview removed
 * `select selectTrigger input--sm` for exactly that coupling. Same tokens, one
 * scale, no reach-in.
 *
 * Two-line options: only the headline goes inside `SelectPrimitive.ItemText`
 * (which is what Radix copies into the trigger); `description` renders beside
 * it, so the closed trigger shows the headline alone and never drags a subline
 * into a 40px control.
 *
 * Theming: the content portals to <body>. It is themed correctly only because
 * `data-brand` / `data-theme` sit on <html>; a brand wrapper on a section does
 * not reach a portalled menu (docs/05 section 3, "Portals").
 * ------------------------------------------------------------------------- */

export const selectTriggerVariants = cva(
  [
    'flex w-full min-w-0 items-center gap-2 px-3',
    'rounded-md border border-field-border bg-field',
    'font-sans font-regular leading-none text-field-content text-left',
    'cursor-pointer outline-none',
    // Touch: a 44px invisible hit area on the 32 / 40px trigger (theme.css).
    // The trigger keeps its drawn height; the area only draws on touch.
    'touch-target',
    'transition-[color,background-color,border-color,box-shadow]',
    'duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',

    // "Nothing chosen" is the placeholder ink, set by Radix on the trigger.
    'data-[placeholder]:text-field-placeholder',

    // Hover takes the quiet field fill as well as the border, as in the
    // preview; pressed takes the secondary-action press, and an open menu keeps
    // the focus border so the trigger reads as the owner of the panel.
    'enabled:hover:border-field-border-hover enabled:hover:bg-field-hover',
    'enabled:active:border-border-control-hover enabled:active:bg-action-secondary-active',
    'data-[state=open]:border-field-border-focus',

    // Focus: the Input / Button ring contract, written identically.
    'focus-visible:border-border-focus focus-visible:ring-border-focus/50 focus-visible:ring-[3px]',

    'aria-invalid:border-danger aria-invalid:ring-danger/20',

    // Disabled is a fill, never opacity (same reason as Input).
    'disabled:cursor-not-allowed disabled:border-action-disabled-border',
    'disabled:bg-field-disabled disabled:text-content-disabled',
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

type SelectTriggerVariantProps = VariantProps<typeof selectTriggerVariants>;

/** String union, so a Storyblok option value can be passed straight in. */
export type SelectSize = NonNullable<SelectTriggerVariantProps['size']>;

/* ---- Root ---------------------------------------------------------------- */

export type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>;

/**
 * The state holder. Renders no DOM of its own (Radix), so a Storyblok blok
 * wrapper puts its `data-blok-*` attributes on a wrapping element.
 *
 * Radix forbids `value=""` on an item: use the trigger's placeholder for
 * "nothing chosen".
 */
export function Select(props: SelectProps) {
  return <SelectPrimitive.Root {...props} />;
}
Select.displayName = 'Select';

/* ---- Group / Value ------------------------------------------------------- */

export type SelectGroupProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>;

export const SelectGroup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Group>,
  SelectGroupProps
>(function SelectGroup(props, ref) {
  return <SelectPrimitive.Group ref={ref} data-slot="select-group" {...props} />;
});
SelectGroup.displayName = 'SelectGroup';

export type SelectValueProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>;

export const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  SelectValueProps
>(function SelectValue({ className, style, ...props }, ref) {
  // Radix's Value drops `className` and `style` on purpose (it owns the node
  // it portals the chosen item's text into), so the layout lives on a wrapper.
  return (
    <span
      data-slot="select-value"
      style={style}
      className={cn(
        // Long values truncate with an ellipsis; the open panel is free to wrap.
        'block min-w-0 flex-1 truncate',
        // A leading option icon is carried up into the trigger (it lives in
        // ItemText), in the secondary ink, so the closed control and the list
        // agree.
        '[&_svg]:me-2 [&_svg]:inline-block [&_svg]:size-icon-md [&_svg]:shrink-0 [&_svg]:align-middle',
        '[&_svg]:-mt-0.5 [&_svg]:text-content-secondary',
        'in-disabled:[&_svg]:text-content-disabled',
        className,
      )}
    >
      <SelectPrimitive.Value ref={ref} {...props} />
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

/* ---- Trigger ------------------------------------------------------------- */

export type SelectTriggerProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> &
  SelectTriggerVariantProps & {
    /**
     * Replaces the trailing indicator (a solid caret in the field ink). The
     * PhoneInput passes a line chevron in secondary ink, as its preview does.
     * Decorative: rendered inside an aria-hidden span.
     */
    icon?: React.ReactNode;
  };

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(function SelectTrigger({ className, size = 'md', children, icon, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      data-size={size}
      className={cn(selectTriggerVariants({ size }), className)}
      {...props}
    >
      {children}
      {/* A real glyph, flex-centred, so it holds the same optical position at
          32, 40 and 48px (preview, "Chevron centring"). */}
      <SelectPrimitive.Icon
        data-slot="select-icon"
        className={cn(
          'flex shrink-0 text-field-content in-disabled:text-content-disabled',
          "[&_svg:not([class*='size-'])]:size-icon-sm",
        )}
      >
        {icon ?? <ChevronDownFillGlyph />}
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

/* ---- Content ------------------------------------------------------------- */

const scrollButtonClass =
  'flex cursor-default items-center justify-center py-1 text-content-secondary [&_svg]:size-icon-sm';

export type SelectScrollUpButtonProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.ScrollUpButton
>;

export const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  SelectScrollUpButtonProps
>(function SelectScrollUpButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      data-slot="select-scroll-up-button"
      className={cn(scrollButtonClass, className)}
      {...props}
    >
      <ChevronUpGlyph />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export type SelectScrollDownButtonProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.ScrollDownButton
>;

export const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  SelectScrollDownButtonProps
>(function SelectScrollDownButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      data-slot="select-scroll-down-button"
      className={cn(scrollButtonClass, className)}
      {...props}
    >
      <ChevronDownGlyph />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = 'SelectScrollDownButton';

export type SelectContentProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  /**
   * Where the portal mounts. Defaults to `document.body`, which is themed by
   * the `data-brand` / `data-theme` attributes on `<html>`.
   */
  container?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Portal>['container'];
};

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(function SelectContent(
  { className, children, position = 'popper', sideOffset = 4, container, ...props },
  ref,
) {
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        ref={ref}
        data-slot="select-content"
        position={position}
        sideOffset={position === 'popper' ? sideOffset : undefined}
        className={cn(
          // The Menu / Popover surface: raised fill, raised border, xl radius,
          // the raised shadow — the same panel as every other menu.
          'relative z-popover flex flex-col overflow-hidden',
          'rounded-xl border border-border-raised bg-surface-raised text-content shadow-raised',
          'font-sans',
          position === 'popper' && [
            'min-w-(--radix-select-trigger-width)',
            'max-h-[min(16.5rem,var(--radix-select-content-available-height))]',
            // Wraps long options in full, up to a readable measure; never
            // narrower than the trigger (min-width beats max-width).
            'max-w-[min(26.25rem,var(--radix-select-content-available-width))]',
          ],
          // Entrance only (Radix unmounts on close). `@starting-style` needs no
          // keyframes; below Chrome 117 / Safari 17.5 the panel just appears.
          'transition-[opacity,translate] duration-[var(--motion-duration-normal)] ease-productive-entrance',
          'starting:-translate-y-1 starting:opacity-0',
          'motion-reduce:transition-none',
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport data-slot="select-viewport" className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = 'SelectContent';

/* ---- Label / Separator --------------------------------------------------- */

export type SelectLabelProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  SelectLabelProps
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      data-slot="select-label"
      className={cn(
        'px-3 pt-2 pb-1 type-eyebrow text-content-secondary',
        className,
      )}
      {...props}
    />
  );
});
SelectLabel.displayName = 'SelectLabel';

export type SelectSeparatorProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      data-slot="select-separator"
      className={cn('-mx-1 my-1 h-px bg-border-decorative', className)}
      {...props}
    />
  );
});
SelectSeparator.displayName = 'SelectSeparator';

/* ---- Item ---------------------------------------------------------------- */

/**
 * Radix's ItemText drops `className` / `style` (its children are what gets
 * portalled into the trigger), so the row layout is a wrapper, and the Radix
 * span is `display: contents` so an icon and the label are flex items of it.
 */
function ItemText({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span data-slot="select-item-text" className={cn('[&>span]:contents', className)}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </span>
  );
}

export type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  /**
   * A second line under the headline, for the detail that disambiguates two
   * options (campus, format, intake). It is rendered OUTSIDE the item text, so
   * the closed trigger shows the headline only. Stays secondary ink even on
   * the selected row.
   */
  description?: React.ReactNode;
};

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(function SelectItem({ className, children, description, ...props }, ref) {
  const twoLine = description != null && description !== false;
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      data-two-line={twoLine ? '' : undefined}
      className={cn(
        'group/select-item relative flex w-full cursor-pointer select-none items-center gap-2',
        'rounded-md px-3 py-2 text-left text-base text-content outline-none',
        // Touch: rows are at least 44px tall. List rows sit edge to edge, so
        // an invisible hit area would overlap the next row and a tap between
        // two would pick the lower one; the row itself grows instead. This
        // is the one place a coarse pointer changes layout on purpose: the
        // list is a popup, and it scrolls inside its own max height.
        'pointer-coarse:min-h-touch-min',
        'transition-colors duration-[var(--motion-duration-instant)] ease-productive-in-out motion-reduce:transition-none',
        // The highlight is a POSITION (arrow keys / pointer), not a selection:
        // only the checked row carries the brand ink, the weight and the check.
        'data-[highlighted]:bg-surface-brand-subtle',
        'data-[state=checked]:font-semibold data-[state=checked]:text-content-brand',
        // Disabled rows stay in the list and are announced as unavailable.
        'data-[disabled]:cursor-not-allowed data-[disabled]:bg-transparent data-[disabled]:font-regular',
        'data-[disabled]:text-content-disabled',
        // Two-line rows align the check and the glyph to the HEADLINE.
        'data-[two-line]:items-start',
        // Leading option icons: md, secondary ink, brand when chosen.
        "[&_svg:not([class*='size-'])]:size-icon-md",
        '[&_[data-slot=select-item-text]_svg]:shrink-0 [&_[data-slot=select-item-text]_svg]:text-content-secondary',
        'data-[state=checked]:[&_[data-slot=select-item-text]_svg]:text-content-brand',
        'data-[disabled]:[&_[data-slot=select-item-text]_svg]:text-content-disabled',
        className,
      )}
      {...props}
    >
      {/* The check column is reserved on every row, so moving the selection
          never shifts a label sideways. It sits BEFORE any icon. */}
      <span
        data-slot="select-item-indicator"
        className="flex size-icon-sm shrink-0 items-center justify-center text-content-brand group-data-[two-line]/select-item:mt-1"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckGlyph className="size-icon-sm" />
        </SelectPrimitive.ItemIndicator>
      </span>
      {twoLine ? (
        <span data-slot="select-item-body" className="grid min-w-0 flex-1 gap-0.5">
          <ItemText className="flex min-w-0 items-center gap-2">{children}</ItemText>
          <span
            data-slot="select-item-description"
            className={cn(
              'text-sm font-regular leading-snug text-content-secondary',
              'group-data-[disabled]/select-item:text-content-disabled',
            )}
          >
            {description}
          </span>
        </span>
      ) : (
        <ItemText className="flex min-w-0 flex-1 items-center gap-2">{children}</ItemText>
      )}
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';
