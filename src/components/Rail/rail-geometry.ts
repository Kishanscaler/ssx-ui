/* ---------------------------------------------------------------------------
 * Rail geometry (internal, server-safe: plain functions, no React)
 *
 * Everything the Rail's hooks read off the scroller, in one place, so pages
 * and autoplay agree. Positions are distances from the row's start
 * in px, always positive: in right-to-left the browser reports `scrollLeft`
 * as zero or negative, and `readPos` / `writePos` hide that.
 * ------------------------------------------------------------------------- */

/** How long a move the visitor asked for (a dot, an arrow) holds its dot while the row travels: about one smooth scroll. */
export const RAIL_PENDING_MS = 1100;

const num = (value: string | null | undefined) => parseFloat(value || '0') || 0;

export function isRtl(el: Element): boolean {
  return getComputedStyle(el).direction === 'rtl';
}

/** The row's own items (the copies included). */
export function railItems(el: HTMLElement): HTMLElement[] {
  return Array.prototype.filter.call(el.children, (c: Element) => c.tagName === 'LI') as HTMLElement[];
}

/** One column's travel: an item's width plus the gap after it. */
export function itemStep(el: HTMLElement): number {
  const first = railItems(el)[0];
  if (!first) return 0;
  return first.offsetWidth + num(getComputedStyle(el).columnGap);
}

/**
 * How many columns show whole between the row's content edge and the window's
 * (a bleeding row's cards run past its padding to the window edge; those count).
 */
export function columnsInView(el: HTMLElement, step: number): number {
  if (!step) return 1;
  const cs = getComputedStyle(el);
  const doc = el.ownerDocument.documentElement;
  const box = Math.min(el.clientWidth, (doc && doc.clientWidth) || el.clientWidth);
  const view = box - num(cs.paddingInlineStart || cs.paddingLeft);
  // A hair of slack: subpixel widths can leave the last card 0.1px short.
  return Math.max(1, Math.floor((view + num(cs.columnGap)) / step + 0.02));
}

/** One set's width on a looped row: from the first item to the first copy. 0 when not looped. */
export function setWidth(el: HTMLElement): number {
  const items = railItems(el);
  const first = items[0];
  let copy: HTMLElement | undefined;
  for (let i = 0; i < items.length; i += 1) {
    if (items[i]!.hasAttribute('data-copy')) {
      copy = items[i];
      break;
    }
  }
  return first && copy ? Math.abs(copy.offsetLeft - first.offsetLeft) : 0;
}

/** The furthest the row can scroll. */
export function maxPos(el: HTMLElement): number {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

/** How far the row is scrolled from its start. */
export function readPos(el: HTMLElement): number {
  return Math.abs(el.scrollLeft);
}

/**
 * Scroll the row to `pos` px from its start, with its own `scrollTo` (never
 * `scrollIntoView`, which scrolls the page too). `smooth` false is instant.
 */
export function writePos(el: HTMLElement, pos: number, smooth: boolean): void {
  const left = isRtl(el) ? -pos : pos;
  if (typeof el.scrollTo === 'function') el.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  else el.scrollLeft = left;
}

/** Set the position at once, for the loop's seam. */
export function jumpPos(el: HTMLElement, pos: number): void {
  el.scrollLeft = isRtl(el) ? -pos : pos;
}
