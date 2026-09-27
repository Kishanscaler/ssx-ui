/* ---------------------------------------------------------------------------
 * The lens of GlassButton: how the backdrop bends through the glass.
 *
 * Apple's Liquid Glass does not scatter light the way frosted glass does; it
 * BENDS it. The edge of the material is a curved bezel that acts as a lens,
 * so the backdrop is pulled and magnified along the rim while the flat centre
 * stays clear. This file models that physically and bakes it into an image
 * for an SVG `feDisplacementMap`, used as a BACKDROP filter.
 *
 * The model (after Chris Kube's "Liquid Glass in the browser", kube.io):
 *   1. A height profile across the bezel, the convex SQUIRCLE
 *      h(x) = (1 - (1 - x)^4)^(1/4), x = 0 at the rim, 1 where the bezel
 *      meets the flat top. The squircle's soft flat-to-curve transition keeps
 *      the refraction smooth when the shape is stretched into a capsule.
 *   2. At each point, the surface normal from the profile's slope, and the
 *      ray from straight above refracted through it by Snell's law,
 *      n1 sin(t1) = n2 sin(t2), from air (1) into the glass
 *      (`--glass-button-refractive-index`).
 *   3. The ray's sideways travel through the glass's thickness is how far the
 *      backdrop appears shifted at that point. It is computed once for 128
 *      steps across the bezel, normalised to the largest, and applied per
 *      pixel along the edge normal of the button's rounded rectangle.
 *   4. The map encodes the shift as colour (red = x, green = y, 128 = none),
 *      and `feDisplacementMap`'s `scale` is the largest shift in px, so the
 *      map needs no further scaling.
 *
 * Every constant is a token (component.glassButton.*), read from the button's
 * computed style when the map is drawn. With no tokens (no stylesheet), there
 * is no lens.
 *
 * Support: `backdrop-filter: url()` renders only in Chromium. Safari and
 * Firefox parse the declaration but draw NOTHING for it (no blur either), so a
 * bare `@supports` test is not enough: it passes, and the glass disappears.
 * The gate is `CSS.supports` AND `navigator.userAgentData`, which only
 * Chromium ships. Everywhere else the button keeps its frost, its specular
 * rim and its liquid response, and simply does not refract. The check runs
 * after mount, so the server render and the first client render are the
 * plain glass, and there is no hydration mismatch.
 *
 * Also off when the reader asked for reduced transparency, more contrast or
 * forced colours: the button is opaque then.
 * ------------------------------------------------------------------------- */

export function supportsRefraction(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  if (!('userAgentData' in navigator)) return false;
  if (!CSS.supports('backdrop-filter', 'url(#a)')) return false;
  const media = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;
  if (
    media &&
    (media('(prefers-reduced-transparency: reduce)').matches ||
      media('(prefers-contrast: more)').matches ||
      media('(forced-colors: active)').matches)
  ) {
    return false;
  }
  return true;
}

/** The lens tokens, as numbers. */
export type LensTokens = {
  refractiveIndex: number;
  bezel: number;
  thickness: number;
  dispersion: number;
  frost: number;
  lensingPressed: number;
};

/** Reads the lens tokens from an element's computed style; null if any is missing. */
export function readLensTokens(style: CSSStyleDeclaration): LensTokens | null {
  const read = (name: string) => parseFloat(style.getPropertyValue(`--glass-button-${name}`));
  const tokens: LensTokens = {
    refractiveIndex: read('refractive-index'),
    bezel: read('bezel'),
    thickness: read('thickness'),
    dispersion: read('dispersion'),
    frost: read('frost'),
    lensingPressed: read('lensing-pressed'),
  };
  return Object.values(tokens).every(Number.isFinite) ? tokens : null;
}

export type DisplacementMap = { href: string; width: number; height: number; scale: number };

/** The squircle height profile: 0 at the rim, 1 on the flat top. */
const squircle = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4);

/** Samples across the bezel: the resolution of the map's 8-bit channels. */
const STEPS = 128;

/**
 * The sideways shift of a vertical ray through the bezel, at each of `STEPS`
 * points from the rim (0) to the flat top (1), in px, for glass `thickness` px
 * tall and `bezel` px wide.
 */
export function refractionProfile(bezel: number, thickness: number, refractiveIndex: number): number[] {
  const out: number[] = [];
  const dx = 1 / STEPS;
  for (let i = 0; i < STEPS; i += 1) {
    const x = (i + 0.5) / STEPS;
    // Slope of the surface in real units: height change over bezel distance.
    const slope = ((squircle(Math.min(1, x + dx)) - squircle(Math.max(0, x - dx))) / (2 * dx)) * (thickness / bezel);
    const incidence = Math.atan(slope); // the ray is vertical; the surface tilts by this much
    const refracted = Math.asin(Math.sin(incidence) / refractiveIndex);
    // The ray leaves the surface bent by (incidence - refracted) and travels
    // through the glass below that point.
    const depth = thickness * squircle(x);
    out.push(depth * Math.tan(incidence - refracted));
  }
  return out;
}

/**
 * Draws the displacement map for a `width` x `height` box with corner
 * `radius` (all CSS px). Returns null when a 2D canvas is unavailable.
 */
export function drawDisplacementMap(
  width: number,
  height: number,
  radius: number,
  lens: LensTokens,
): DisplacementMap | null {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const r = Math.min(radius, w / 2, h / 2);
  const bezel = Math.max(1, r * lens.bezel);
  const profile = refractionProfile(bezel, h * lens.thickness, lens.refractiveIndex);
  const peak = Math.max(...profile);
  if (!(peak > 0)) return null;

  const image = ctx.createImageData(w, h);
  const data = image.data;
  // Signed distance from a point to the rounded rectangle's edge (negative
  // inside), and its gradient: the outward normal.
  const hx = w / 2 - r;
  const hy = h / 2 - r;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + 0.5 - w / 2;
      const py = y + 0.5 - h / 2;
      const qx = Math.abs(px) - hx;
      const qy = Math.abs(py) - hy;
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const outside = Math.hypot(ox, oy);
      const dist = outside + Math.min(Math.max(qx, qy), 0) - r;

      let nx = 0;
      let ny = 0;
      if (outside > 0) {
        nx = (ox / outside) * Math.sign(px);
        ny = (oy / outside) * Math.sign(py);
      } else if (qx > qy) {
        nx = Math.sign(px);
      } else {
        ny = Math.sign(py);
      }

      const depth = -dist; // distance inward from the rim
      let magnitude = 0;
      if (depth > 0 && depth < bezel) {
        magnitude = profile[Math.min(STEPS - 1, Math.floor((depth / bezel) * STEPS))]! / peak;
      }
      // A convex lens magnifies: each point samples the backdrop from further
      // INWARD, so the displacement points against the outward normal.
      const i = (y * w + x) * 4;
      data[i] = Math.round(128 - nx * magnitude * 127);
      data[i + 1] = Math.round(128 - ny * magnitude * 127);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return { href: canvas.toDataURL('image/png'), width: w, height: h, scale: peak };
}
