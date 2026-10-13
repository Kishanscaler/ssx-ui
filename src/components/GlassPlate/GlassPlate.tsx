import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * GlassPlate (marketing)
 *
 * The plate or bar laid on a photo: a figure and its line at a card's foot, a
 * profile under a quote, a row of facts over a scene. The type on it is white
 * in both themes: the plate declares `data-surface-ink="on-image"`, so Heading,
 * Text, Figure, Button and Link inside ink themselves.
 *
 *   <PhotoFrame src={url} blur="bottom">
 *     <GlassPlate inset="foot"><Figure value="₹50L" size="sm" /></GlassPlate>
 *   </PhotoFrame>
 *
 * Two tones, after the page's one colour system:
 *   - `light` the system's on-image glass (`--glass-on-image-surface`), its
 *     hover step as the 1px edge. For a dark ground: a dark scene, a breaker.
 *   - `dark` the fixed dark plate, for a pale photo, where white type needs a
 *     dark ground in BOTH themes. No token yet (src/marketing/README.md, token
 *     request `glass.on-image.plate`): it reads `--ssx-plate-on-photo` (one
 *     colour, its alpha included: the page sets #171717 at 55%), falling back
 *     to `--surface-image-scrim`, the one dark fill that is fixed in both
 *     themes and already gated for white type.
 *
 * The frost is the glass material (`--glass-blur`, `--glass-saturate`), off
 * with `blur={false}` (a plate inside a row that scrolls, say). Padding is the
 * card standard for a plate, 16px by 20px; corners `radius-lg`, as anything
 * inset in a card. Width comes from the cell; `inset="foot"` pins it to the
 * foot of its positioned parent (a PhotoFrame), `--space-2` in from its edges.
 *
 * Server component.
 * ------------------------------------------------------------------------- */

/** `light` the on-image glass · `dark` the fixed dark plate for a pale photo. */
export type GlassPlateTone = 'light' | 'dark';
/** `none` in flow · `foot` pinned to the foot of its positioned parent. */
export type GlassPlateInset = 'none' | 'foot';
/** The element a GlassPlate renders as. */
export type GlassPlateElement = 'div' | 'section' | 'aside' | 'footer' | 'figure' | 'dl' | 'ul' | 'blockquote';

export const glassPlateVariants = cva(
  'min-w-0 rounded-lg border border-glass-on-image-hover px-5 py-4 font-sans text-on-image-ink',
  {
    variants: {
      tone: {
        light: 'bg-glass-on-image',
        dark: 'bg-(--ssx-plate-on-photo,var(--surface-image-scrim))',
      },
      blur: {
        true: 'backdrop-blur-glass backdrop-saturate-(--glass-saturate)',
        false: '',
      },
      inset: {
        none: '',
        foot: 'absolute inset-x-2 bottom-2',
      },
    },
    defaultVariants: { tone: 'light', blur: true, inset: 'none' },
  },
);

export interface GlassPlateProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * `light` the on-image glass, for a dark ground · `dark` the fixed dark
   * plate, for a pale photo (the same in both themes).
   *
   * @default 'light'
   */
  tone?: GlassPlateTone;
  /**
   * Frost what is behind it (the glass blur and saturation). Off where the
   * plate moves over a scroller, or nothing behind it needs softening.
   *
   * @default true
   */
  blur?: boolean;
  /**
   * `foot` pins it to the foot of its positioned parent (a PhotoFrame),
   * `--space-2` in from the sides and the bottom. `none` keeps it in flow.
   *
   * @default 'none'
   */
  inset?: GlassPlateInset;
  /**
   * The element. `dl` for a row of facts, `footer` for a card's foot,
   * `blockquote` for a quote on a photo.
   *
   * @default 'div'
   */
  as?: GlassPlateElement;
}

export const GlassPlate = React.forwardRef<HTMLElement, GlassPlateProps>(function GlassPlate(
  { className, tone = 'light', blur = true, inset = 'none', as = 'div', ...props },
  ref,
) {
  return React.createElement(as, {
    ref,
    'data-slot': 'glass-plate',
    'data-tone': tone,
    'data-inset': inset,
    'data-blur': blur || undefined,
    'data-surface-ink': 'on-image',
    className: cn(glassPlateVariants({ tone, blur, inset }), className),
    ...props,
  });
});
GlassPlate.displayName = 'GlassPlate';
