'use client';

// Client: hover and focus listeners that ease the marquee's playback rate.
import * as React from 'react';

/* ---------------------------------------------------------------------------
 * useMarqueeHover (internal)
 *
 * The hover brake, eased. When the pointer comes over a Marquee the row brakes
 * smoothly — to a stop (`hover="pause"`) or to a crawl it keeps moving at
 * (`hover="slow"`, `--marquee-hover-rate` of full speed) — and when it leaves,
 * the row picks back up. Focus inside always brakes to a stop, whatever
 * `hover` says: someone tabbing through has to be able to read and act.
 *
 * CSS can only switch `animation-play-state` (an abrupt stop), so this eases
 * the CSSAnimation's `playbackRate` instead (Web Animations API), from
 * wherever it is to its target:
 *
 *   over `--motion-duration-slowest`, on `--motion-easing-productive-in-out`
 *
 * read from the box, so retuning a token retunes the brake, and under reduced
 * motion (tokens at 1ms) it is instant — though then the row is still anyway.
 * Re-entering mid-brake starts from the current rate, so it never jumps.
 *
 * Touch has no hover: a finger never brakes it (a tap that focuses a link
 * inside does, through focus). No Web Animations API: a stop falls back to
 * `data-hover-hold` on the box, which the track's classes pause on, abruptly;
 * a crawl cannot be expressed, so `slow` keeps full speed there.
 * ------------------------------------------------------------------------- */

function cssValue(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

function cssMs(el: Element, name: string): number {
  const raw = cssValue(el, name);
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return raw.endsWith('ms') ? n : n * 1000;
}

/** `cubic-bezier(x1, y1, x2, y2)` as a function of progress; linear if it does not parse. */
function bezier(value: string): (x: number) => number {
  const m = value.match(/cubic-bezier\(([^)]+)\)/);
  const pts = m ? m[1]!.split(',').map((v) => parseFloat(v)) : [];
  if (pts.length !== 4 || pts.some((v) => !Number.isFinite(v))) return (x) => x;
  const [x1, y1, x2, y2] = pts as [number, number, number, number];
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t;
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

/** What the pointer does to a Marquee: brake to a stop, brake to a crawl, or nothing. */
export type MarqueeHover = 'pause' | 'slow' | 'none';

export function useMarqueeHover(
  rootRef: React.RefObject<HTMLDivElement | null>,
  trackRef: React.RefObject<HTMLDivElement | null>,
  hover: MarqueeHover,
  enabled: boolean,
): void {
  React.useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!enabled || !root || !track) return undefined;

    let hovering = false;
    let focused = false;
    let frame = 0;

    const animation = () => (typeof track.getAnimations === 'function' ? track.getAnimations()[0] : undefined);

    const easeTo = (target: number) => {
      const anim = animation();
      if (!anim) {
        if (target === 0) root.setAttribute('data-hover-hold', '');
        else root.removeAttribute('data-hover-hold');
        return;
      }
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      const from = anim.playbackRate;
      const total = cssMs(root, '--motion-duration-slowest');
      if (!total || from === target) {
        anim.playbackRate = target;
        return;
      }
      const curve = bezier(cssValue(root, '--motion-easing-productive-in-out'));
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / total);
        anim.playbackRate = from + (target - from) * curve(p);
        frame = p < 1 ? requestAnimationFrame(step) : 0;
      };
      frame = requestAnimationFrame(step);
    };
    const hoverRate = () => {
      if (hover === 'pause') return 0;
      if (hover === 'none') return 1;
      const rate = parseFloat(cssValue(root, '--marquee-hover-rate'));
      return Number.isFinite(rate) ? rate : 1;
    };
    const update = () => easeTo(focused ? 0 : hovering ? hoverRate() : 1);

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      hovering = true;
      update();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      hovering = false;
      update();
    };
    const onFocusIn = () => {
      focused = true;
      update();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && root.contains(e.relatedTarget)) return;
      focused = false;
      update();
    };

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      root.removeAttribute('data-hover-hold');
      const anim = animation();
      if (anim) anim.playbackRate = 1;
    };
  }, [rootRef, trackRef, hover, enabled]);
}
