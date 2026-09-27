/* ---------------------------------------------------------------------------
 * Refraction for GlassButton: the "liquid" edge, where the backdrop bends
 * as if seen through the rim of a lens.
 *
 * How: an SVG `feDisplacementMap` used as a BACKDROP filter
 * (`backdrop-filter: url(#id) blur() saturate()`). The map is a small PNG
 * drawn for the button's exact size and corner radius. Red is horizontal
 * displacement and green is vertical; 128 means "no shift". Inside a bezel
 * along the edge, each pixel samples the backdrop from further INWARD along
 * the edge normal, strongest at the rim. The falloff is the squircle's
 * (1 - t)^2, the profile Apple's material uses. The flat centre is untouched,
 * so the label area reads exactly like the plain frosted glass.
 *
 * Support: `backdrop-filter: url()` renders only in Chromium. Safari and
 * Firefox parse the declaration but draw NOTHING for it (no blur either), so a
 * bare `@supports` test is not enough: it passes, and the glass disappears.
 * The gate is `CSS.supports` AND `navigator.userAgentData`, which only
 * Chromium ships. Everywhere else the button keeps its frost from the utility
 * classes and simply does not refract. The check runs after mount, so the
 * server render and the first client render are the plain glass, and there
 * is no hydration mismatch.
 *
 * Also off when the reader asked for reduced transparency, more contrast or
 * forced colours: the button is opaque then, and a refracting edge on an
 * opaque fill would only smear the backdrop around it.
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

export type DisplacementMap = { href: string; width: number; height: number; scale: number };

/**
 * Draws the displacement map for a `width` x `height` box with corner
 * `radius` (all CSS px). Returns null when a 2D canvas is unavailable.
 */
export function drawDisplacementMap(width: number, height: number, radius: number): DisplacementMap | null {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const r = Math.min(radius, w / 2, h / 2);
  // The bezel: the band along the edge that bends light. A third of the
  // height, never more than 14px, so the centre stays flat on every size.
  const bezel = Math.max(2, Math.min(h / 3, 14));
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

      const depth = -dist; // distance inward from the edge
      const t = depth <= 0 ? 0 : Math.min(depth / bezel, 1);
      const strength = depth <= 0 ? 0 : (1 - t) * (1 - t);
      // Sample from INWARD: the displacement points against the normal.
      const i = (y * w + x) * 4;
      data[i] = Math.round(128 - nx * strength * 127);
      data[i + 1] = Math.round(128 - ny * strength * 127);
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  // The largest shift, in px, at the very rim. Proportional to the height so
  // a small button bends as much, relatively, as a large one.
  const scale = Math.round(Math.min(h * 0.45, 22));
  return { href: canvas.toDataURL('image/png'), width: w, height: h, scale };
}
