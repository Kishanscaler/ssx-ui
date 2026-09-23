import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * Icon
 *
 * A wrapper, not an icon pack. The glyph is the CHILD — any single `<svg>`
 * element: a `@phosphor-icons/react` component (the recommended source; the
 * HTML preview's allowlist is Phosphor 2.1.1), a Lucide icon, or a hand-drawn
 * `<svg>`. The wrapper renders no element of its own; through Radix `Slot` it
 * puts our size token, `currentColor`, and the accessibility default onto the
 * child svg itself:
 *
 *   <Icon size="sm"><Check weight="bold" /></Icon>
 *   <Icon label="Verified SST alumnus"><SealCheck /></Icon>
 *
 * Why no wrapper element: the HTML preview found that a sized icon inside an
 * extra inline wrapper collapses to ~10px in a flex row (`max-width: 100%` of a
 * shrinking parent). Putting the classes on the svg is the fix.
 *
 * Why no `size` default CLASS: every control in the system sizes the icons it
 * is given (`[&_svg:not([class*='size-'])]:size-icon-*` on Button, Badge, ...).
 * With no `size`, the icon therefore draws at the 24px standalone default
 * using `w-/h-` classes, which a parent's rule beats; an explicit `size`
 * writes a `size-*` class, which a parent's rule deliberately leaves alone.
 *
 * Weight is the glyph's business (Phosphor `weight="bold" | "fill"`): bold at
 * 16px, fill for a selected state. It is not a prop here because it is not
 * something CSS can do to a filled path.
 *
 * Server atom: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const iconVariants = cva(
  // `fill-current` matches Phosphor, which fills its paths with currentColor.
  // `stroke-none` protects the filled-path contract from an inherited stroke.
  'inline-block shrink-0 align-middle fill-current stroke-none',
  {
    variants: {
      size: {
        // Unset: 24px, but a parent's `[&_svg:not([class*='size-'])]` wins.
        auto: 'h-icon-lg w-icon-lg',
        sm: 'size-icon-sm min-w-icon-sm',
        md: 'size-icon-md min-w-icon-md',
        lg: 'size-icon-lg min-w-icon-lg',
        xl: 'size-icon-xl min-w-icon-xl',
        '2xl': 'size-icon-2xl min-w-icon-2xl',
      },
      tone: {
        inherit: '',
        brand: 'text-content-brand',
        success: 'text-success-icon',
        warning: 'text-warning-icon',
        danger: 'text-danger-icon',
        info: 'text-info-icon',
      },
    },
    defaultVariants: { size: 'auto', tone: 'inherit' },
  },
);

/** Radix Slot, typed for an svg child (it is typed for HTML elements). */
const SvgSlot = Slot as unknown as React.ForwardRefExoticComponent<
  React.SVGAttributes<SVGSVGElement> & React.RefAttributes<SVGSVGElement>
>;

type IconVariantProps = VariantProps<typeof iconVariants>;

/** `auto` is internal (no size given); callers pass one of these. */
export type IconSize = Exclude<NonNullable<IconVariantProps['size']>, 'auto'>;
export type IconTone = NonNullable<IconVariantProps['tone']>;

export type IconProps = Omit<React.SVGAttributes<SVGSVGElement>, 'children'> & {
  /**
   * The glyph: exactly one svg element, e.g. `<Star weight="fill" />` from
   * `@phosphor-icons/react`. Our classes and attributes are merged onto it.
   */
  children: React.ReactElement;
  /**
   * 16 / 20 / 24 / 32 / 48px, from `--size-icon-*`. `sm` for badges, chips and
   * dense cells (use the bold weight there); `md` for buttons, menu items and
   * input affordances; `lg` standalone and in nav; `xl` card headers; `2xl`
   * empty states. Omit it inside a control, which sizes its own icons.
   *
   * @default undefined (24px, and the parent control may resize it)
   */
  size?: IconSize;
  /**
   * The colour role. `inherit` takes the text colour around it, which is
   * almost always right. The status tones use the status ICON inks.
   *
   * @default 'inherit'
   */
  tone?: IconTone;
  /**
   * The same colour, dimmed (65% opacity), for a genuinely secondary glyph.
   *
   * @default false
   */
  muted?: boolean;
  /**
   * An accessible name, for a meaningful icon with no labelled parent (a
   * standalone "verified" mark). Sets `role="img"` and `aria-label`. Omit it
   * — the default — when a visible word or the parent control carries the
   * name: the icon is then `aria-hidden`, so nothing is announced twice.
   *
   * @default undefined (decorative)
   */
  label?: string;
};

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
  { className, size, tone = 'inherit', muted = false, label, children, ...props },
  ref,
) {
  const named = label != null && label !== '';
  return (
    <SvgSlot
      ref={ref}
      data-slot="icon"
      data-size={size}
      data-tone={tone}
      data-muted={muted || undefined}
      aria-hidden={named ? undefined : true}
      role={named ? 'img' : undefined}
      aria-label={named ? label : undefined}
      focusable="false"
      className={cn(iconVariants({ size: size ?? 'auto', tone }), muted && 'opacity-65', className)}
      {...props}
    >
      {children}
    </SvgSlot>
  );
});
Icon.displayName = 'Icon';
