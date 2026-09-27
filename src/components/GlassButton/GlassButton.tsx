'use client';

// Client: wraps Button (client), measures itself for the lens (a
// ResizeObserver and a canvas, after mount) and tracks the pointer.
import * as React from 'react';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { Button, type ButtonProps } from '../Button';
import { attachLiquid } from './liquid';
import { drawDisplacementMap, readLensTokens, supportsRefraction, type DisplacementMap, type LensTokens } from './refraction';

/* ---------------------------------------------------------------------------
 * GlassButton — liquid glass, after Apple's material (iOS 26 / macOS 26).
 *
 * Apple: Liquid Glass "refracts content from below it, reflects light from
 * around it, and has responsive lensing along its edges", and "as you
 * interact with it ... the material flexes, glows, and distorts around your
 * finger". Five things make that, and this button does all five:
 *
 *   1. LENSING, not frost. The rim is a curved bezel that bends the backdrop
 *      (Snell's law through a squircle profile, refraction.ts); the flat
 *      centre stays clear. Blur is a trace (`--glass-button-frost`), there
 *      only to keep the label readable.
 *   2. DISPERSION. Red, green and blue bend by slightly different amounts
 *      (`--glass-button-dispersion`), so the rim carries a faint rainbow
 *      fringe, the way thick glass does.
 *   3. A SPECULAR RIM. A thin ring of light where the light meets the edge,
 *      and a fainter one where it leaves (components.css). The light follows
 *      the pointer, the web's stand-in for tilting the device.
 *   4. LIGHT UNDER THE FINGER. Under a pointer (mouse, pen, touch, or Space
 *      and Enter) the glass glows from the touch point and its lens deepens,
 *      flowing in and out on a spring (liquid.ts). Hover and press MOVE it
 *      exactly as they move every Button: the same lift, the same press
 *      scale, the same fill steps.
 *   5. THE CAPSULE. Apple's glass controls are capsules, so `shape` defaults
 *      to `capsule`; `rounded` gives the system control radius.
 *
 * It is Button underneath (`variant={null}`), so focus, loading and its
 * announcement, `asChild`, the sizes (including square `icon-*`) and the
 * touch target are Button's, and so is its motion (lift and press).
 *
 * Use it where there IS something behind it: a photograph, a video, a
 * gradient, a map, content scrolling under a floating bar. On a plain page
 * it is a pale capsule that costs a compositing layer.
 *
 * Legibility. A translucent button cannot be checked against its own colour,
 * only against what might be BEHIND it, so each tint (the `glass.*` tokens) is
 * the weakest that keeps its label at 4.5:1 over the worst backdrop, in all
 * four brand x mode themes. build.py's GLASS gate composites every tint over
 * its worst backdrops and fails the build below 4.5:1. The lens only bends
 * the rim, never the label area, so it does not spend that margin.
 *
 * Browsers. The lens and dispersion are an SVG backdrop filter, which only
 * Chromium renders (see refraction.ts). Safari and Firefox get the same
 * button without the bending: frosted glass, the specular rim and the glow.
 *
 * The reader's settings each turn it into an opaque button with no light
 * layers: `prefers-reduced-transparency`, `prefers-contrast: more`,
 * `forced-colors`, and a browser with no backdrop filter at all. Reduced
 * motion keeps the glass and the light, and holds the lens still.
 *
 * Cost: each one is a compositing layer and re-filters its backdrop on every
 * frame the backdrop moves; the lens is three displacement passes. A few on a
 * hero or a floating bar is fine. One in every row of a list is not.
 * ------------------------------------------------------------------------- */

export const glassButtonVariants = cva(
  [
    // The frost. Tailwind emits `-webkit-backdrop-filter` beside the standard
    // property, which is what Safari 15.4 to 17 reads. Where the lens runs, an
    // inline backdrop filter replaces it (refraction, then a trace of frost).
    'backdrop-blur-glass backdrop-saturate-(--glass-saturate)',
    // Its own stacking context: the light layers sit under the label and over
    // the tint.
    'isolate',
    // The light on the glass (sheen and rim): `glass.highlight`, white in
    // every mode.
    '[--glass-light:var(--glass-highlight)]',
    '[--glass-sheen:color-mix(in_oklab,var(--glass-light)_var(--glass-button-sheen-alpha),transparent)]',
    'bg-[linear-gradient(to_bottom,var(--glass-sheen),transparent_var(--glass-button-sheen-stop))]',
    'shadow-[shadow:inset_0_var(--border-hair)_0_0_color-mix(in_oklab,var(--glass-light)_var(--glass-button-rim-top-alpha),transparent),inset_0_calc(-1*var(--border-hair))_0_0_color-mix(in_oklab,var(--glass-light)_var(--glass-button-rim-bottom-alpha),transparent),var(--shadow-raised)]',
    'idle:hover:shadow-[shadow:inset_0_var(--border-hair)_0_0_color-mix(in_oklab,var(--glass-light)_var(--glass-button-rim-top-alpha-hover),transparent),inset_0_calc(-1*var(--border-hair))_0_0_color-mix(in_oklab,var(--glass-light)_var(--glass-button-rim-bottom-alpha-hover),transparent),var(--shadow-raised)]',

    // Opaque fallbacks: the reader's settings, then a browser with no
    // backdrop filter. Important, to beat the state tints (see above).
    'reduce-transparency:bg-(--glass-solid)! reduce-transparency:bg-none! reduce-transparency:backdrop-filter-none!',
    'contrast-more:bg-(--glass-solid)! contrast-more:bg-none! contrast-more:backdrop-filter-none! contrast-more:border-border-strong!',
    'forced-colors:backdrop-filter-none! forced-colors:bg-none!',
    'not-supports-[((backdrop-filter:none)_or_(-webkit-backdrop-filter:none))]:bg-(--glass-solid)!',
    // Disabled: Button's opaque chip, without the sheen or the rim.
    'disabled:bg-none disabled:shadow-none disabled:backdrop-filter-none',

    // The page: mode-aware glass. Its opaque form is the raised surface.
    '[--glass-solid:var(--surface-raised)]',
    'border-border-decorative/(--glass-button-edge-alpha) bg-glass text-content',
    'idle:hover:bg-glass-hover idle:active:bg-glass-active',
    // On a photograph: white frost, white ink. Pressing darkens it rather
    // than whitening it further, which would eat the contrast. Its opaque
    // form is the fill's own dark label colour.
    'in-data-[surface-ink=on-image]:[--glass-solid:var(--on-image-action-fg)]',
    'in-data-[surface-ink=on-image]:border-on-image-ink/(--glass-button-edge-alpha-on-image) in-data-[surface-ink=on-image]:bg-glass-on-image in-data-[surface-ink=on-image]:text-on-image-ink',
    'in-data-[surface-ink=on-image]:idle:hover:bg-glass-on-image-hover',
    'in-data-[surface-ink=on-image]:idle:active:bg-glass-on-image-active',
  ],
  {
    variants: {
      shape: {
        capsule: 'rounded-full',
        rounded: '',
      },
    },
    defaultVariants: { shape: 'capsule' },
  },
);

export type GlassButtonProps = Omit<ButtonProps, 'variant'> & {
  /**
   * `capsule` (default): Apple's glass control shape. `rounded`: the system
   * control radius, for glass that sits in a row of ordinary buttons.
   *
   * @default 'capsule'
   */
  shape?: 'capsule' | 'rounded';
  /**
   * Bend the backdrop through the rim, like the edge of a lens, with a faint
   * dispersion fringe. Progressive, and Chromium only: elsewhere, and under
   * reduced transparency, more contrast or forced colours, the button is the
   * same glass without it. Measured and drawn after mount, and redrawn when
   * the button resizes.
   *
   * @default true
   */
  refraction?: boolean;
  /**
   * The light follows the pointer, glows under a press and the lens deepens.
   * Hover and press motion are Button's either way. Under reduced motion the
   * lens holds still (the light still follows the pointer).
   *
   * @default true
   */
  liquid?: boolean;
};

/** The lens for one button: the map for its current box, or null when off. */
function useLens(
  enabled: boolean,
  node: HTMLElement | null,
): { map: DisplacementMap; lens: LensTokens } | null {
  const [state, setState] = React.useState<{ map: DisplacementMap; lens: LensTokens } | null>(null);
  React.useEffect(() => {
    if (!enabled || !node || !supportsRefraction() || typeof ResizeObserver === 'undefined') {
      setState(null);
      return undefined;
    }
    let last = '';
    const draw = () => {
      // Layout size, not the bounding box: the press scales the button, and
      // the map must not be redrawn for every frame of it.
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const style = getComputedStyle(node);
      const lens = readLensTokens(style);
      const radius = parseFloat(style.borderTopLeftRadius) || 0;
      const key = `${width}x${height}r${radius}`;
      if (!lens || key === last || width === 0 || height === 0) return;
      last = key;
      const map = drawDisplacementMap(width, height, radius, lens);
      setState(map ? { map, lens } : null);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node]);
  return state;
}

/** Red, green, blue: each channel bends a little further than the last. */
const CHANNELS = [
  { name: 'r', matrix: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', spread: 0 },
  { name: 'g', matrix: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', spread: 1 },
  { name: 'b', matrix: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', spread: 2 },
] as const;

/** The light inside the glass (components.css). Decorative, and out of the accessible name. */
const LIGHT = [
  <span key="specular" aria-hidden="true" data-part="glass-specular" />,
  <span key="glow" aria-hidden="true" data-part="glass-glow" />,
];

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { className, shape = 'capsule', refraction = true, liquid = true, asChild, children, style, ...props },
  ref,
) {
  // State, not a ref: the effects have to re-run when the node first exists.
  const [node, setNode] = React.useState<HTMLButtonElement | null>(null);
  const composedRef = useComposedRefs(ref, setNode);
  const lensed = useLens(refraction, node);
  const filterId = `ssx-glass-${useId().replace(/:/g, '')}`;
  const displacers = React.useRef<Array<SVGFEDisplacementMapElement | null>>([]);

  React.useEffect(() => {
    if (!liquid || !node) return undefined;
    return attachLiquid(node, {
      // The lens deepens as the glass swells: rescale the three passes in
      // place, without redrawing the map.
      onLensing: (factor) => {
        if (!lensed) return;
        CHANNELS.forEach((c, i) => {
          displacers.current[i]?.setAttribute(
            'scale',
            String(lensed.map.scale * factor * (1 + lensed.lens.dispersion * c.spread)),
          );
        });
      },
    });
  }, [liquid, node, lensed]);

  const refracted: React.CSSProperties | undefined = lensed
    ? {
        // Refract (with its trace of frost inside the filter), then saturate.
        backdropFilter: `url(#${filterId}) saturate(var(--glass-saturate))`,
        WebkitBackdropFilter: `url(#${filterId}) saturate(var(--glass-saturate))`,
        ...style,
      }
    : style;

  // The light layers go inside the button: before the label, or, under
  // `asChild`, inside the slotted element.
  let content: React.ReactNode;
  if (asChild && React.isValidElement<{ children?: React.ReactNode }>(children)) {
    content = React.cloneElement(children, undefined, ...LIGHT, children.props.children);
  } else if (asChild) {
    content = children;
  } else {
    content = (
      <>
        {LIGHT}
        {children}
      </>
    );
  }

  return (
    <>
      {lensed ? (
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
            width={lensed.map.width}
            height={lensed.map.height}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={lensed.map.href}
              x="0"
              y="0"
              width={lensed.map.width}
              height={lensed.map.height}
              preserveAspectRatio="none"
              result="map"
            />
            {CHANNELS.map((c, i) => (
              <React.Fragment key={c.name}>
                <feDisplacementMap
                  ref={(el) => {
                    displacers.current[i] = el;
                  }}
                  in="SourceGraphic"
                  in2="map"
                  scale={lensed.map.scale * (1 + lensed.lens.dispersion * c.spread)}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result={`bent-${c.name}`}
                />
                <feColorMatrix in={`bent-${c.name}`} type="matrix" values={c.matrix} result={`only-${c.name}`} />
              </React.Fragment>
            ))}
            <feComposite in="only-r" in2="only-g" operator="arithmetic" k2="1" k3="1" result="rg" />
            <feComposite in="rg" in2="only-b" operator="arithmetic" k2="1" k3="1" result="rgb" />
            <feGaussianBlur in="rgb" stdDeviation={lensed.lens.frost} />
          </filter>
        </svg>
      ) : null}
      <Button
        ref={composedRef}
        variant={null}
        asChild={asChild}
        data-material="glass"
        data-shape={shape}
        data-refraction={lensed ? '' : undefined}
        className={cn(glassButtonVariants({ shape }), className)}
        style={refracted}
        {...props}
      >
        {content}
      </Button>
    </>
  );
});
GlassButton.displayName = 'GlassButton';
