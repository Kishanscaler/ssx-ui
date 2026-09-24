import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The names `styles/theme.css` adds to Tailwind that Tailwind's defaults do not
 * have. tailwind-merge only knows the defaults, and an unknown name is either
 * not merged at all (both `h-control-md` and `h-12` survive and CSS order picks
 * the winner) or merged into the WRONG group (`shadow-raised` read as a shadow
 * colour, `text-md` as a text colour).
 *
 * Exported for `cn.test.ts`, which parses `theme.css` and fails if a name there
 * is missing here — so the two cannot drift. Not part of the public barrel.
 *
 * Colours need no entry: tailwind-merge groups any unknown `bg-*` / `text-*` /
 * `border-*` value as that property's colour, which is right for every
 * semantic colour name in `theme.css`.
 */
export const ssxScales = {
  /** `--spacing-*` names that are not numbers: h-, w-, size-, min-w-, p-, gap-, ... */
  spacing: [
    'gutter',
    'control-sm',
    'control-md',
    'control-lg',
    'touch-min',
    'icon-sm',
    'icon-md',
    'icon-lg',
    'icon-xl',
    'icon-2xl',
  ],
  /** `--text-*` (font size). `md` is ours; the rest overlap Tailwind's. */
  text: ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'],
  /** `--font-weight-*`. `regular` is ours (Tailwind calls it `normal`). */
  fontWeight: ['regular', 'medium', 'semibold', 'bold'],
  /** `--tracking-*` */
  tracking: ['tighter', 'tight', 'snug', 'normal', 'wide'],
  /** `--leading-*` */
  leading: ['flat', 'tight', 'snug', 'base', 'heading', 'open', 'loose', 'body'],
  /** `--radius-*` */
  radius: ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'],
  /** `--ease-*` */
  ease: [
    'linear',
    'productive-in-out',
    'productive-entrance',
    'productive-exit',
    'expressive-in-out',
    'expressive-entrance',
    'overshoot',
  ],
  /** `--shadow-*` */
  shadow: ['raised', 'overlay'],
  /** `--z-index-*` */
  z: ['base', 'raised', 'sticky', 'overlay', 'dialog', 'popover', 'toast', 'tooltip'],
  /**
   * `@utility type-*` roles that set size, leading and tracking AND weight
   * (headings, label, eyebrow). `cn.test.ts` checks this list against theme.css.
   */
  typeWeighted: [
    'billboard-sm',
    'billboard-md',
    'billboard-lg',
    'billboard-xl',
    'hero',
    'display',
    'h1',
    'h2',
    'h3',
    'label',
    'eyebrow',
  ],
  /** `@utility type-*` roles that leave weight to inherit (running text). */
  type: ['body-lg', 'body', 'body-sm', 'caption', 'code'],
} as const;

const twMerge = extendTailwindMerge<'ssx-type' | 'ssx-type-weighted'>({
  extend: {
    theme: {
      spacing: [...ssxScales.spacing],
      text: [...ssxScales.text],
      'font-weight': [...ssxScales.fontWeight],
      tracking: [...ssxScales.tracking],
      leading: [...ssxScales.leading],
      radius: [...ssxScales.radius],
      ease: [...ssxScales.ease],
      shadow: [...ssxScales.shadow],
    },
    classGroups: {
      // tailwind-merge's `z` group has no theme key, so it is extended here.
      z: [{ z: [...ssxScales.z] }],
    },
    // A later `type-*` replaces an earlier `text-*` size, `leading-*` and
    // `tracking-*` (and `font-*` weight, for the roles that set weight). The
    // reverse is deliberately NOT a conflict: `type-body text-sm` keeps the
    // role's leading and tracking and changes only the size, which is what
    // CSS order does anyway (single-property utilities sort after `type-*`).
    conflictingClassGroups: {
      'ssx-type': ['ssx-type-weighted', 'font-size', 'leading', 'tracking'],
      'ssx-type-weighted': ['ssx-type', 'font-size', 'leading', 'tracking', 'font-weight'],
    },
  },
  override: {
    classGroups: {
      'ssx-type': [{ type: [...ssxScales.type] }],
      'ssx-type-weighted': [{ type: [...ssxScales.typeWeighted] }],
    },
  },
});

/**
 * Compose class names, last-write-wins on conflicting Tailwind utilities.
 *
 * This is what makes `className` a safe escape hatch rather than a source of
 * drift: a consumer passing `className="px-8"` replaces our padding instead of
 * landing in a specificity race with it.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
