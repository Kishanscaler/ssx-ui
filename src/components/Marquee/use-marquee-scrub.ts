'use client';

// Client: pointer, wheel and focus listeners on the marquee's box.
import * as React from 'react';

import { space } from '../../lib/scale.generated';

/* ---------------------------------------------------------------------------
 * useMarqueeScrub (internal)
 *
 * Lets a person move a Marquee by hand: drag it with a mouse, swipe it with a
 * finger, or scroll it sideways with a trackpad (or shift + wheel). It works
 * in both directions, forever, and stays seamless.
 *
 * How: the row is moved by the CSS animation alone, so moving it by hand means
 * moving the animation's clock. While a hand is on it the box carries
 * `data-scrubbing` (the track pauses on it), and every pixel moved becomes
 * `currentTime` on the track's CSSAnimation (Web Animations API), wrapped to one
 * loop. When the hand lets go the animation simply carries on from there, so
 * there is never a second position to reconcile, and the seam can never show.
 *
 * Flick: a release with speed glides to a stop over `--motion-duration-slowest`,
 * decelerating evenly. Under reduced motion the motion tokens are 1ms, so the
 * row stops where it is released: the same rule as every other SSX motion.
 *
 * Details that matter:
 *   - A press only becomes a drag past `space.2` (8px), so a click or a tap on
 *     a link inside still lands. After a drag, the click that ends it is eaten.
 *   - Touch: `touch-action: pan-y` on the box (Marquee's classes) gives the page
 *     vertical scrolling and gives this hook horizontal swipes.
 *   - Wheel: only a gesture that is more sideways than vertical is taken; a
 *     vertical wheel always scrolls the page.
 *   - Keyboard: tabbing to an item that is out of view moves the row to show
 *     it (the browser's own scroll-into-view is undone: the box clips).
 *   - Right to left and `direction="reverse"` move the clock the other way, so
 *     the row always follows the hand.
 *
 * No Web Animations API (an old browser, jsdom): it does nothing, and the row
 * still loops. React 16.12-safe: plain effects.
 * ------------------------------------------------------------------------- */

type Sample = { x: number; t: number };

/** A CSS time token in ms, read from where the box sits (so `data-motion="reduce"` collapses it too). */
function cssMs(el: Element, name: string): number {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return raw.endsWith('ms') ? n : n * 1000;
}

function rootFontSize(el: Element): number {
  return parseFloat(getComputedStyle(el.ownerDocument.documentElement).fontSize) || space['4'];
}

export function useMarqueeScrub(
  rootRef: React.RefObject<HTMLDivElement | null>,
  trackRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
): void {
  React.useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!enabled || !root || !track) return undefined;

    const animation = () => (typeof track.getAnimations === 'function' ? track.getAnimations()[0] : undefined);

    /** Move the row by `dx` screen pixels (positive: rightward). */
    const moveBy = (dx: number) => {
      const anim = animation();
      const half = track.offsetWidth / 2;
      if (!anim || !half || !dx) return;
      const loop = Number(anim.effect?.getComputedTiming().duration) || 0;
      if (!loop) return;
      const rtl = getComputedStyle(track).direction === 'rtl';
      const reverse = track.dataset.direction === 'reverse';
      // Forward in LTR moves content leftward, so a rightward hand runs the clock back.
      const sign = (rtl ? 1 : -1) * (reverse ? -1 : 1);
      const now = Number(anim.currentTime) || 0;
      const next = now + (sign * dx * loop) / half;
      anim.currentTime = ((next % loop) + loop) % loop;
    };

    let glide = 0;
    const stopGlide = () => {
      if (glide) cancelAnimationFrame(glide);
      glide = 0;
    };
    const setScrubbing = (on: boolean) => {
      if (on) root.setAttribute('data-scrubbing', '');
      else root.removeAttribute('data-scrubbing');
    };

    /* ---- drag and swipe ---- */
    let pointer: number | null = null;
    let startX = 0;
    let lastX = 0;
    let dragging = false;
    let samples: Sample[] = [];
    let eatClick = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || pointer !== null) return;
      stopGlide();
      pointer = e.pointerId;
      startX = lastX = e.clientX;
      dragging = false;
      samples = [{ x: e.clientX, t: e.timeStamp }];
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (!dragging) {
        if (Math.abs(e.clientX - startX) < space['2']) return;
        dragging = true;
        setScrubbing(true);
        root.setPointerCapture?.(e.pointerId);
      }
      moveBy(e.clientX - lastX);
      lastX = e.clientX;
      // Release speed is read from the last `--motion-duration-instant` of movement.
      const recent = cssMs(root, '--motion-duration-instant');
      samples.push({ x: e.clientX, t: e.timeStamp });
      samples = samples.filter((s) => e.timeStamp - s.t <= recent);
    };

    const release = (e: PointerEvent, cancelled: boolean) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      if (!dragging) return;
      dragging = false;
      eatClick = !cancelled;
      root.releasePointerCapture?.(e.pointerId);
      const first = samples[0];
      const last = samples[samples.length - 1];
      const span = first && last ? last.t - first.t : 0;
      const velocity = span > 0 && !cancelled ? (last!.x - first!.x) / span : 0;
      const total = cssMs(root, '--motion-duration-slowest');
      if (!velocity || !total) {
        setScrubbing(false);
        return;
      }
      // Even deceleration: speed falls from `velocity` to 0 across `total`.
      const t0 = performance.now();
      let travelled = 0;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / total);
        const at = velocity * total * (p - (p * p) / 2);
        moveBy(at - travelled);
        travelled = at;
        if (p < 1) glide = requestAnimationFrame(step);
        else {
          glide = 0;
          setScrubbing(false);
        }
      };
      glide = requestAnimationFrame(step);
    };
    const onPointerUp = (e: PointerEvent) => release(e, false);
    const onPointerCancel = (e: PointerEvent) => release(e, true);

    // The click that ends a drag is not a click on the item under it.
    const onClick = (e: MouseEvent) => {
      if (!eatClick) return;
      eatClick = false;
      e.preventDefault();
      e.stopPropagation();
    };
    // Images and links would otherwise start the browser's own drag-and-drop.
    const onDragStart = (e: DragEvent) => e.preventDefault();

    /* ---- trackpad, shift + wheel ---- */
    let wheelEnd = 0;
    const onWheel = (e: WheelEvent) => {
      // Shift + a vertical wheel is a sideways scroll; otherwise only a mostly-sideways gesture counts.
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0;
      if (!dx) return;
      e.preventDefault();
      stopGlide();
      setScrubbing(true);
      const unit = e.deltaMode === 1 ? rootFontSize(root) : e.deltaMode === 2 ? root.clientWidth : 1;
      moveBy(-dx * unit);
      window.clearTimeout(wheelEnd);
      wheelEnd = window.setTimeout(() => setScrubbing(false), cssMs(root, '--motion-duration-slow'));
    };

    /* ---- keyboard: bring a focused item into view ---- */
    const onFocusIn = (e: FocusEvent) => {
      const item = e.target as Element | null;
      if (!item || item === root) return;
      root.scrollLeft = 0;
      const box = root.getBoundingClientRect();
      const r = item.getBoundingClientRect();
      if (r.left < box.left) moveBy(box.left - r.left);
      else if (r.right > box.right) moveBy(box.right - r.right);
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('click', onClick, true);
    root.addEventListener('dragstart', onDragStart);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('focusin', onFocusIn);
    return () => {
      stopGlide();
      window.clearTimeout(wheelEnd);
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerCancel);
      root.removeEventListener('click', onClick, true);
      root.removeEventListener('dragstart', onDragStart);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('focusin', onFocusIn);
      root.removeAttribute('data-scrubbing');
    };
  }, [rootRef, trackRef, enabled]);
}
