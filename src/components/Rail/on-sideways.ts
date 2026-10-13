import { space } from '../../lib/scale.generated';

/* ---------------------------------------------------------------------------
 * onSideways (internal, server-safe: a plain function)
 *
 * Calls `take` when the visitor moves the row themselves: a sideways swipe (the
 * finger clearly travelling more across than down), a sideways wheel or
 * trackpad stroke, or a mouse press on the row. A vertical swipe or wheel that
 * only passes over the row on its way down the page does not count, so
 * autoplay survives the page being scrolled past. Returns the cleanup.
 *
 * Copied from the SSB page (`src/sections/shared/onSideways.ts`), with the
 * swipe threshold read from the space scale (`space.2`, 8px) as
 * use-marquee-scrub reads its drag threshold.
 * ------------------------------------------------------------------------- */

export function onSideways(el: HTMLElement, take: () => void): () => void {
  let start: { x: number; y: number } | null = null;
  const touchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    start = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const touchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (!start || !t) return;
    const dx = Math.abs(t.clientX - start.x);
    const dy = Math.abs(t.clientY - start.y);
    if (Math.hypot(dx, dy) < space['2']) return;
    if (dx > dy) take();
    start = null; // decided, one way or the other
  };
  const wheel = (e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) take();
  };
  const press = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') take();
  };
  el.addEventListener('touchstart', touchStart, { passive: true });
  el.addEventListener('touchmove', touchMove, { passive: true });
  el.addEventListener('wheel', wheel, { passive: true });
  el.addEventListener('pointerdown', press);
  return () => {
    el.removeEventListener('touchstart', touchStart);
    el.removeEventListener('touchmove', touchMove);
    el.removeEventListener('wheel', wheel);
    el.removeEventListener('pointerdown', press);
  };
}
