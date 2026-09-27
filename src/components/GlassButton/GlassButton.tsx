'use client';

// Client: wraps Button (client), and measures itself for `refraction`
// (a ResizeObserver and a canvas, after mount).
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { Button, type ButtonProps } from '../Button';
import { drawDisplacementMap, supportsRefraction, type DisplacementMap } from './refraction';

/* ---------------------------------------------------------------------------
 * GlassButton
 *
 * A button made of a MATERIAL, not a meaning: frosted, neutral glass that
 * lets whatever is behind it show through, blurred. It is Button underneath,
 * rendered with no variant (`variant={null}`), so every behaviour is Button's:
 * the focus ring, the 2px lift, loading and its announcement, `asChild`, the
 * sizes (including the square `icon-*`), the touch target and `shine`. Only
 * the surface is different. It takes no trailing icon well: a `ButtonIcon`
 * inside it renders as a plain icon (see Button).
 *
 * Use it where there IS something behind it: a hero photograph, a video, a
 * gradient, a map, content scrolling under a floating bar. On a plain page
 * it is a slightly grey button that costs a compositing layer, so it is not
 * a replacement for `secondary`.
 *
 * One look, on purpose: neutral glass, at the system's control radius. There
 * is no brand-tinted glass (on the page it has to be nearly solid to carry
 * white text, so it is a primary Button with extra cost) and no capsule
 * (the system's controls are not pills). Decided 2026-09-27.
 *
 * The material, back to front, all on the one element (utilities; the ::before
 * stays free for the touch target and the ::after for the shine):
 *   frost    `backdrop-filter: blur(12px) saturate(180%)`. Saturation is what
 *            makes it read as glass rather than as fog: colour behind it
 *            stays vivid while detail goes soft.
 *   tint     a translucent fill. Its strength is not a style choice. See
 *            "Legibility" below.
 *   sheen    a white gradient over the top half, the light falling on it.
 *   rim      a 1px edge plus an inset highlight on the top edge and a fainter
 *            one on the bottom, then the system's raised shadow.
 *   refract  optional, Chromium only (`refraction`, see refraction.ts).
 *
 * Surfaces. It reads the surface-ink contract, like Button: on the page it is
 * mode-aware glass (white in light, dark in dark); inside
 * `data-surface-ink="on-image"` (a media Card, or any region you mark over a
 * photograph under its scrim) it is white frost with white ink.
 *
 * Legibility. A translucent button cannot be checked against its own colour,
 * only against what might be BEHIND it, so each tint (the `glass.*` tokens)
 * is the weakest that keeps its label at 4.5:1 over the worst backdrop, in
 * all four brand x mode themes. The token pipeline enforces it: build.py's
 * GLASS gate composites every tint over its worst backdrops and fails the
 * build below 4.5:1. The figures:
 *   page       surface.raised at 76%. Dark mode sets the floor: light ink
 *              over a white backdrop needs 74%. Light needs 50%.
 *   on-image   white at 14% (6.2:1), hovered 20% (5.3:1), over the
 *              contract's worst case: the scrim over a white photograph.
 * Blur averages the backdrop, so in practice every figure has room to spare;
 * the sheen is kept faint (white 16% fading out by mid-height) so it does not
 * spend that room where the label sits.
 *
 * Fallbacks, each turning the glass into an opaque button:
 *   - no `backdrop-filter` at all (Firefox before 103). Safari 15.4 to 17 has
 *     only `-webkit-backdrop-filter`, which Tailwind emits, so it gets glass;
 *   - `prefers-reduced-transparency: reduce` (Chromium 118+);
 *   - `prefers-contrast: more`, which also gets a strong edge;
 *   - `forced-colors: active`: the system paints it, and the backdrop filter
 *     is dropped.
 * These use `!` (important) on purpose. They are the reader's settings, and
 * they must beat the hover and press tints, which are more specific.
 *
 * Disabled keeps Button's opaque grey chip on every surface, as Button does:
 * a grey chip reads as "off" whatever is behind it.
 *
 * Cost: every glass button is its own compositing layer and re-blurs its
 * backdrop on every frame that backdrop moves. A handful on a hero is fine.
 * A glass button in every row of a scrolling list is not.
 * ------------------------------------------------------------------------- */

export const glassButtonVariants = cva(
  [
    // The frost. Tailwind emits `-webkit-backdrop-filter` beside the standard
    // property, which is what Safari 15.4 to 17 reads.
    '[--glass-blur:12px] [--glass-saturate:180%]',
    'backdrop-blur-(--glass-blur) backdrop-saturate-(--glass-saturate)',
    // The light on the glass (sheen and rim): `glass.highlight`, white in
    // every mode.
    '[--glass-light:var(--glass-highlight)]',
    'bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--glass-light)_16%,transparent),transparent_50%)]',
    'shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--glass-light)_45%,transparent),inset_0_-1px_0_0_color-mix(in_oklab,var(--glass-light)_12%,transparent),var(--shadow-raised)]',
    'idle:hover:shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--glass-light)_65%,transparent),inset_0_-1px_0_0_color-mix(in_oklab,var(--glass-light)_18%,transparent),var(--shadow-raised)]',

    // Opaque fallbacks: the reader's settings, then a browser with no
    // backdrop filter. Important, to beat the state tints (see above).
    'reduce-transparency:bg-(--glass-solid)! reduce-transparency:bg-none! reduce-transparency:backdrop-filter-none!',
    'contrast-more:bg-(--glass-solid)! contrast-more:bg-none! contrast-more:backdrop-filter-none! contrast-more:border-border-strong!',
    'forced-colors:backdrop-filter-none! forced-colors:bg-none!',
    'not-supports-[((backdrop-filter:blur(1px))_or_(-webkit-backdrop-filter:blur(1px)))]:bg-(--glass-solid)!',
    // Disabled: Button's opaque chip, without the sheen or the rim.
    'disabled:bg-none disabled:shadow-none disabled:backdrop-filter-none',

    // The page: mode-aware glass. Its opaque form is the raised surface.
    '[--glass-solid:var(--surface-raised)]',
    'border-border-decorative/70 bg-glass text-content',
    'idle:hover:bg-glass-hover idle:active:bg-glass-active',
    // On a photograph: white frost, white ink. Pressing darkens it rather
    // than whitening it further, which would eat the contrast. Its opaque
    // form is the fill's own dark label colour.
    'in-data-[surface-ink=on-image]:[--glass-solid:var(--on-image-action-fg)]',
    'in-data-[surface-ink=on-image]:border-on-image-ink/30 in-data-[surface-ink=on-image]:bg-glass-on-image in-data-[surface-ink=on-image]:text-on-image-ink',
    'in-data-[surface-ink=on-image]:idle:hover:bg-glass-on-image-hover',
    'in-data-[surface-ink=on-image]:idle:active:bg-glass-on-image-active',
  ],
);

export type GlassButtonProps = Omit<ButtonProps, 'variant'> & {
  /**
   * Bend the backdrop at the rim, like the edge of a lens. Progressive, and
   * Chromium only: elsewhere, and under reduced transparency, more contrast
   * or forced colours, the button is the same glass without it. Measured and
   * drawn after mount, and redrawn when the button resizes.
   *
   * It costs a canvas draw per size and an SVG filter per button, so keep it
   * for a few hero actions.
   *
   * @default false
   */
  refraction?: boolean;
};

/** Refraction for one button: the map for its current box, or null when off. */
function useRefraction(enabled: boolean, node: HTMLElement | null): DisplacementMap | null {
  const [map, setMap] = React.useState<DisplacementMap | null>(null);
  React.useEffect(() => {
    if (!enabled || !node || !supportsRefraction() || typeof ResizeObserver === 'undefined') {
      setMap(null);
      return undefined;
    }
    let last = '';
    const draw = () => {
      const rect = node.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0;
      const key = `${Math.round(rect.width)}x${Math.round(rect.height)}r${radius}`;
      if (key === last || rect.width === 0 || rect.height === 0) return;
      last = key;
      setMap(drawDisplacementMap(rect.width, rect.height, radius));
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node]);
  return map;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { className, refraction = false, style, ...props },
  ref,
) {
  // State, not a ref: the effect has to re-run when the node first exists.
  const [node, setNode] = React.useState<HTMLButtonElement | null>(null);
  const composedRef = useComposedRefs(ref, setNode);
  const map = useRefraction(refraction, node);
  const filterId = `ssx-glass-${useId().replace(/:/g, '')}`;

  const refracted: React.CSSProperties | undefined = map
    ? {
        // Displace first, then frost, so the blur smooths the bent edge.
        backdropFilter: `url(#${filterId}) blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
        ...style,
      }
    : style;

  return (
    <>
      {map ? (
        // Zero-size and out of flow, so it never takes a slot in a flex row
        // or a ButtonGroup. Rendered only in the browser, after measuring.
        <svg
          aria-hidden="true"
          focusable="false"
          width="0"
          height="0"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
          <filter
            id={filterId}
            x="0"
            y="0"
            width={map.width}
            height={map.height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map.href}
              x="0"
              y="0"
              width={map.width}
              height={map.height}
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={map.scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      ) : null}
      <Button
        ref={composedRef}
        variant={null}
        data-material="glass"
        data-refraction={map ? '' : undefined}
        className={cn(glassButtonVariants(), className)}
        style={refracted}
        {...props}
      />
    </>
  );
});
GlassButton.displayName = 'GlassButton';
