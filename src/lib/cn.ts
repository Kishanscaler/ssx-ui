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
    'control-xs',
    'control-sm',
    'control-md',
    'control-lg',
    'touch-min',
    'icon-sm',
    'icon-md',
    'icon-lg',
    'icon-xl',
    'icon-2xl',
    'indicator-sm',
    'indicator-md',
    'indicator-lg',
  ],
  /** `--text-*` (font size). `md` is ours; the rest overlap Tailwind's. */
  text: ['2xs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'],
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
  shadow: ['1', '2', '3', '4', '5', '6', 'raised', 'overlay'],
  /** `--container-*` (w-*, max-w-*: the prose measure and the panel ladder). */
  container: ['measure', 'panel-xs', 'panel-sm', 'panel-md', 'panel-lg', 'panel-xl', 'panel-2xl'],
  /** `--z-index-*` */
  z: ['below', 'base', 'lift', 'lift-edge', 'raised', 'sticky', 'overlay', 'dialog', 'popover', 'toast', 'tooltip'],
  /**
   * Widths. Without these, tailwind-merge reads `border-thick` as a border
   * COLOUR, so `cn('border-thick', 'border-border-control')` would drop the
   * width; the same for ring, outline and decoration.
   */
  borderWidth: ['hair', 'thick', 'accent', 'heavy'],
  ringWidth: ['thick', 'halo'],
  ringOffsetWidth: ['thick'],
  outlineWidth: ['focus'],
  outlineOffset: ['focus', 'focus-tight', 'focus-loose'],
  decorationThickness: ['hair', 'thick'],
  underlineOffset: ['link'],
  /** `--opacity-*` */
  opacity: ['disabled', 'muted', 'inactive', 'faint', 'track'],
  /** `--aspect-*` */
  aspect: ['square', 'video', 'landscape', 'photo', 'cinema', 'portrait', 'banner'],
  /** `--blur-*` */
  blur: ['glass'],
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
      container: [...ssxScales.container],
      aspect: [...ssxScales.aspect],
      blur: [...ssxScales.blur],
    },
    classGroups: {
      // tailwind-merge's `z` group has no theme key, so it is extended here.
      z: [{ z: [...ssxScales.z] }],
      'border-w': [{ border: [...ssxScales.borderWidth] }],
      'border-w-x': [{ 'border-x': [...ssxScales.borderWidth] }],
      'border-w-y': [{ 'border-y': [...ssxScales.borderWidth] }],
      'border-w-s': [{ 'border-s': [...ssxScales.borderWidth] }],
      'border-w-e': [{ 'border-e': [...ssxScales.borderWidth] }],
      'border-w-t': [{ 'border-t': [...ssxScales.borderWidth] }],
      'border-w-r': [{ 'border-r': [...ssxScales.borderWidth] }],
      'border-w-b': [{ 'border-b': [...ssxScales.borderWidth] }],
      'border-w-l': [{ 'border-l': [...ssxScales.borderWidth] }],
      'ring-w': [{ ring: [...ssxScales.ringWidth] }],
      'ring-offset-w': [{ 'ring-offset': [...ssxScales.ringOffsetWidth] }],
      'outline-w': [{ outline: [...ssxScales.outlineWidth] }],
      'outline-offset': [{ 'outline-offset': [...ssxScales.outlineOffset] }],
      'text-decoration-thickness': [{ decoration: [...ssxScales.decorationThickness] }],
      'underline-offset': [{ 'underline-offset': [...ssxScales.underlineOffset] }],
      opacity: [{ opacity: [...ssxScales.opacity] }],
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
