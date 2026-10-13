import { cva } from 'class-variance-authority';

/* ---------------------------------------------------------------------------
 * The Avatar's recipe, in a module of its own with no `'use client'`.
 *
 * Avatar.tsx is a client module (Radix loads the image in an effect), and a
 * value imported from a client module into a Server Component is a client
 * reference, not the function. The marketing cards draw their people as
 * server `<img>`s with an initials fallback (src/marketing/README.md, rule 5)
 * and must still look like this Avatar, so they read the recipe from here.
 * Avatar.tsx re-exports it; the public name and its import path are unchanged.
 * ------------------------------------------------------------------------- */

export const avatarVariants = cva(
  [
    'group/avatar relative inline-flex shrink-0 items-center justify-center rounded-full select-none',
    'bg-surface-brand-subtle font-sans font-bold leading-flat text-content-brand',
  ],
  {
    variants: {
      size: {
        sm: 'size-control-xs text-xs',
        md: 'size-control-md text-sm',
        lg: 'size-control-lg text-md',
      },
      ring: {
        // Selection / emphasis: a page-coloured gap, then the brand ring.
        true: 'ring-thick ring-border-brand ring-offset-thick ring-offset-page',
        false: '',
      },
    },
    defaultVariants: { size: 'md', ring: false },
  },
);

/**
 * AvatarGroup's overlap: each avatar after the first pulled under the one
 * before by a step, and cut out of it by a surface ring. Shared with the
 * marketing cards' people rows, which are server markup and cannot use the
 * group itself.
 */
export const AVATAR_OVERLAP = '-ms-2.5';
export const AVATAR_CUTOUT = 'ring-thick ring-surface';
