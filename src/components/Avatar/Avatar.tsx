'use client';

// Client: Radix Avatar loads the image in an effect and swaps the fallback
// out once it has; AvatarGroup shares its size through context.
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { StatusDot, type StatusDotProps } from '../StatusDot';

/* ---------------------------------------------------------------------------
 * Avatar
 *
 * Identity at a glance. Initials are the default, because most student
 * records have a name long before they have a photo:
 *
 *   <Avatar><AvatarImage src={url} alt="" /><AvatarFallback>AK</AvatarFallback></Avatar>
 *
 * Accessibility follows the HTML: the avatar is DECORATIVE when the name is
 * already beside it (the fallback initials are `aria-hidden`, and give the
 * image `alt=""`). Standing alone, give the Avatar an `aria-label`; it then
 * becomes `role="img"` and states identity — and presence, if it has an
 * `AvatarBadge` — in one string ("Aarav Krishnan — online"). Announcing "AK,
 * green circle" is worse than announcing nothing.
 *
 * Radix loads the image in JS, so server HTML shows the initials first and the
 * photo swaps in after hydration. Sources are centre-cropped (`object-cover`);
 * an organisation takes its logo MARK, never a wordmark. Use a plain `src`
 * (Storyblok image-service URLs are fine); it does not compose with
 * `next/image`.
 * ------------------------------------------------------------------------- */

export const avatarVariants = cva(
  [
    'group/avatar relative inline-flex shrink-0 items-center justify-center rounded-full select-none',
    'bg-surface-brand-subtle font-sans font-bold leading-none text-content-brand',
  ],
  {
    variants: {
      size: {
        sm: 'size-7 text-xs',
        md: 'size-control-md text-sm',
        lg: 'size-control-lg text-md',
      },
      ring: {
        // Selection / emphasis: a page-coloured gap, then the brand ring.
        true: 'ring-2 ring-border-brand ring-offset-2 ring-offset-page',
        false: '',
      },
    },
    defaultVariants: { size: 'md', ring: false },
  },
);

type AvatarVariantProps = VariantProps<typeof avatarVariants>;
export type AvatarSize = NonNullable<AvatarVariantProps['size']>;

/** An AvatarGroup's size, inherited by the avatars and the count inside it. */
const AvatarGroupSizeContext = React.createContext<AvatarSize | undefined>(undefined);

const isLabelled = (props: { 'aria-label'?: string; 'aria-labelledby'?: string }) =>
  Boolean(props['aria-label'] || props['aria-labelledby']);

/* ---- Avatar --------------------------------------------------------------- */

export type AvatarProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
  /**
   * 28 / 40 / 48px. Inside an `AvatarGroup` the group's size is the default.
   *
   * @default 'md'
   */
  size?: AvatarSize;
  /**
   * A selection or emphasis ring (the signed-in user in an account switcher).
   *
   * @default false
   */
  ring?: boolean;
};

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(function Avatar({ className, size, ring = false, role, ...props }, ref) {
  const groupSize = React.useContext(AvatarGroupSizeContext);
  const resolved = size ?? groupSize ?? 'md';
  return (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      data-size={resolved}
      data-ring={ring || undefined}
      role={role ?? (isLabelled(props) ? 'img' : undefined)}
      className={cn(avatarVariants({ size: resolved, ring }), className)}
      {...props}
    />
  );
});
Avatar.displayName = 'Avatar';

/* ---- AvatarImage ---------------------------------------------------------- */

export type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;

export const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(function AvatarImage({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      data-slot="avatar-image"
      // Any source ratio fills the circle from the centre, never letterboxed.
      className={cn('block size-full rounded-full object-cover', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

/* ---- AvatarFallback ------------------------------------------------------- */

export type AvatarFallbackProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>;

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(function AvatarFallback({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      // Initials are not a name. The Avatar's `aria-label` (or the visible
      // name beside it) is; a caller can still override this.
      aria-hidden="true"
      className={cn(
        'flex size-full items-center justify-center rounded-full',
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-icon-md",
        className,
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';

/* ---- AvatarBadge (presence) ------------------------------------------------ */

export type AvatarBadgeProps = StatusDotProps;

/**
 * A presence dot hung on the avatar's corner: a `StatusDot` with a 2px
 * surface-coloured ring so it reads against a dark portrait. It scales with
 * the avatar (10px on `lg`). It is `aria-hidden`; put the presence in the
 * Avatar's `aria-label`.
 */
export const AvatarBadge = React.forwardRef<HTMLSpanElement, AvatarBadgeProps>(
  function AvatarBadge({ className, size, ...props }, ref) {
    return (
      <StatusDot
        ref={ref}
        data-slot="avatar-badge"
        size={size}
        className={cn(
          'absolute right-0 bottom-0 ring-2 ring-surface',
          size == null && 'group-data-[size=lg]/avatar:size-2.5',
          className,
        )}
        {...props}
      />
    );
  },
);
AvatarBadge.displayName = 'AvatarBadge';

/* ---- AvatarGroup ------------------------------------------------------------ */

export type AvatarGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The size of every avatar (and the count) inside, unless one sets its own.
   *
   * @default 'md'
   */
  size?: AvatarSize;
};

/**
 * Overlapping avatars. Give the group ONE `aria-label` naming everyone ("Aarav
 * Krishnan, Priyadarshini V and 3 more"); it becomes `role="img"`, and the
 * avatars inside are presentational.
 */
export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { className, size = 'md', role, ...props },
  ref,
) {
  return (
    <AvatarGroupSizeContext.Provider value={size}>
      <div
        ref={ref}
        data-slot="avatar-group"
        data-size={size}
        role={role ?? (isLabelled(props) ? 'img' : undefined)}
        className={cn(
          'inline-flex items-center -space-x-2.5',
          // Each avatar is cut out of the one beneath it by a surface ring.
          '*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-surface',
          '*:data-[slot=avatar-group-count]:ring-2 *:data-[slot=avatar-group-count]:ring-surface',
          className,
        )}
        {...props}
      />
    </AvatarGroupSizeContext.Provider>
  );
});
AvatarGroup.displayName = 'AvatarGroup';

/* ---- AvatarGroupCount ------------------------------------------------------- */

export type AvatarGroupCountProps = React.HTMLAttributes<HTMLSpanElement> & {
  /** @default the group's size, else 'md' */
  size?: AvatarSize;
};

/** The overflow count at the end of a group ("+3"). `aria-hidden`: the group's label says it. */
export const AvatarGroupCount = React.forwardRef<HTMLSpanElement, AvatarGroupCountProps>(
  function AvatarGroupCount({ className, size, ...props }, ref) {
    const groupSize = React.useContext(AvatarGroupSizeContext);
    const resolved = size ?? groupSize ?? 'md';
    return (
      <span
        ref={ref}
        data-slot="avatar-group-count"
        data-size={resolved}
        aria-hidden="true"
        className={cn(avatarVariants({ size: resolved }), className)}
        {...props}
      />
    );
  },
);
AvatarGroupCount.displayName = 'AvatarGroupCount';
