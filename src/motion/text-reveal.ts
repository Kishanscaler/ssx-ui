/**
 * The text reveal PRESETS, shared by `<TextReveal>` and the markup runtime
 * (`data-ssx-text-reveal`), so the two can never animate a headline
 * differently. Each builds one PAUSED animation over an already-split element;
 * the caller decides when it plays (mount, in view, after a hold).
 *
 *   rise   each piece fades in and rises `motion.offset.enter`. The default.
 *   blur   each piece fades in, grows from `motion.scale.text` and sharpens
 *          from `motion.blur.text` (in em, so it scales with the headline).
 *          By letter or by word.
 *   wipe   word by word: a block of brand colour (`--surface-brand-solid`, or
 *          `--ssx-text-wipe` set on the element) slides up over the word
 *          (`duration.fast`), then the word slides up into place and pushes
 *          the block off the top (`duration.normal`), inside the word's own
 *          clip. Each word starts `motion.stagger.wipe` (50ms) after the last,
 *          so the wipes overlap tightly. By word or by line.
 *   soft-wipe  the same push, but the block is a brand GRADIENT
 *          (`--surface-brand-subtle` to `--surface-brand-solid`, or
 *          `--ssx-text-wipe-from` / `--ssx-text-wipe`) under a very heavy
 *          blur (`motion.blur.wipe`), so it reads as a glow sweeping up
 *          through each word. It sits outside the word's clip, so the blur
 *          spreads past the word, and it fades in and out as it passes.
 *
 * Transforms, opacity and filter only: the line never reflows. No hooks, no
 * directive: server-safe to import (it does nothing until called).
 */
import { gsap } from 'gsap';
// Type only: the class is passed in, so the markup runtime can keep loading it lazily.
import type { SplitText } from 'gsap/SplitText';

import { ease, entrance, holdTransitions, motionTokens, revealClearProps, stagger, type MotionIntent } from './core';

export type TextRevealPreset = 'rise' | 'blur' | 'wipe' | 'soft-wipe';
export type TextRevealBy = 'words' | 'chars' | 'lines';

export const textRevealPresets: readonly TextRevealPreset[] = ['rise', 'blur', 'wipe', 'soft-wipe'];

const isWipe = (preset: TextRevealPreset) => preset === 'wipe' || preset === 'soft-wipe';

export const textRevealBys: readonly TextRevealBy[] = ['words', 'chars', 'lines'];

/** What SplitText should split: `wipe` goes by word or by line, never by letter. */
export function splitType(preset: TextRevealPreset, by: TextRevealBy): string {
  if (by === 'lines') return 'lines';
  return !isWipe(preset) && by === 'chars' ? 'words,chars' : 'words';
}

/**
 * SplitText's lines are full-width blocks. A line is revealed through an
 * inline-block box around its own text, so a wipe's block (and a blur's grow)
 * fits the words, not the column.
 */
function textBox(line: Element): HTMLElement {
  const box = line.ownerDocument.createElement('span');
  while (line.firstChild) box.appendChild(line.firstChild);
  line.appendChild(box);
  gsap.set(box, { display: 'inline-block' });
  return box;
}

/** The inline styles a wipe adds to a word, and the bar it draws. Tokens only. */
const wipeBar = {
  position: 'absolute',
  inset: '0',
  background: 'var(--ssx-text-wipe, var(--surface-brand-solid))',
  pointerEvents: 'none',
} as const;

/** The soft wipe's glow: a brand gradient, blurred far past its edges. Tokens only. */
const softBar = {
  position: 'absolute',
  inset: '0',
  background:
    'linear-gradient(to top, var(--ssx-text-wipe-from, var(--surface-brand-subtle)), var(--ssx-text-wipe, var(--surface-brand-solid)))',
  pointerEvents: 'none',
} as const;

/**
 * The soft wipe: the word's text is clipped in its own box (so it can slide
 * in), and the glow sits beside that box, unclipped, so its blur spreads past
 * the word instead of ending at a hard edge.
 */
function buildSoftWipe(element: Element, words: Element[], intent: MotionIntent, timeline: gsap.core.Timeline): void {
  const interval = stagger('wipe', element);
  const cover = motionTokens.duration.fast;
  const push = motionTokens.duration.normal;
  const curve = ease(intent === 'expressive' ? 'expressiveInOut' : 'productiveInOut');
  words.forEach((word, i) => {
    const doc = word.ownerDocument;
    const clip = doc.createElement('span');
    const text = doc.createElement('span');
    while (word.firstChild) text.appendChild(word.firstChild);
    clip.appendChild(text);
    const glow = doc.createElement('span');
    glow.setAttribute('aria-hidden', 'true');
    word.append(clip, glow);
    gsap.set(word, { position: 'relative' });
    gsap.set(clip, { display: 'inline-block', clipPath: 'inset(0)' });
    gsap.set(text, { display: 'inline-block', yPercent: 100 });
    gsap.set(glow, { ...softBar, filter: `blur(${motionTokens.blur.wipe})`, yPercent: 100, autoAlpha: 0 });
    const at = i * interval;
    timeline
      // The glow rises into the word as it brightens…
      .to(glow, { yPercent: 0, autoAlpha: 1, duration: cover, ease: curve }, at)
      // …then the word slides up into place and pushes it off the top, fading.
      .to(text, { yPercent: 0, duration: push, ease: curve }, at + cover)
      .to(glow, { yPercent: -100, autoAlpha: 0, duration: push, ease: curve }, at + cover)
      .set(clip, { clearProps: 'clipPath' }, at + cover + push);
  });
}

function buildWipe(element: Element, words: Element[], intent: MotionIntent, timeline: gsap.core.Timeline): void {
  const interval = stagger('wipe', element);
  const cover = motionTokens.duration.fast;
  const push = motionTokens.duration.normal;
  const curve = ease(intent === 'expressive' ? 'expressiveInOut' : 'productiveInOut');
  words.forEach((word, i) => {
    const doc = word.ownerDocument;
    // The word's text moves into an inner span, the bar sits over it, and the
    // word clips both: `clip-path`, not `overflow: hidden`, which would move an
    // inline-block's baseline off the line. SplitText's revert puts the text back.
    const text = doc.createElement('span');
    while (word.firstChild) text.appendChild(word.firstChild);
    const bar = doc.createElement('span');
    bar.setAttribute('aria-hidden', 'true');
    word.append(text, bar);
    gsap.set(word, { position: 'relative', clipPath: 'inset(0)' });
    gsap.set(text, { display: 'inline-block', yPercent: 100 });
    gsap.set(bar, { ...wipeBar, yPercent: 100 });
    const at = i * interval;
    timeline
      // The block slides up over the word…
      .to(bar, { yPercent: 0, duration: cover, ease: curve }, at)
      // …then the word slides up into place and pushes the block off the top.
      .to(text, { yPercent: 0, duration: push, ease: curve }, at + cover)
      .to(bar, { yPercent: -100, duration: push, ease: curve }, at + cover)
      // Done: the block (now above the word) goes, and only then the clip, so no
      // sliver of it shows and no ascender or descender stays cut.
      .set(bar, { autoAlpha: 0 }, at + cover + push)
      .set(word, { clearProps: 'clipPath' }, at + cover + push);
  });
}

/**
 * The paused animation for `preset` over `pieces` (SplitText's words, chars or
 * line boxes). `element` is the line itself: where the reduced-motion and
 * token reads happen. Lines are staggered `base`, words and letters `tight`.
 */
export function buildTextReveal(
  element: Element,
  pieces: Element[],
  preset: TextRevealPreset,
  intent: MotionIntent,
  by: TextRevealBy = 'words',
): gsap.core.Timeline {
  const timeline = gsap.timeline({ paused: true });
  if (preset === 'wipe') {
    buildWipe(element, pieces, intent, timeline);
    return timeline;
  }
  if (preset === 'soft-wipe') {
    buildSoftWipe(element, pieces, intent, timeline);
    return timeline;
  }
  holdTransitions(pieces);
  const timing = { ...entrance(intent), stagger: stagger(by === 'lines' ? 'base' : 'tight', element) };
  if (preset === 'blur') {
    // An explicit end: GSAP cannot tween a blur toward `filter: none`.
    timeline.fromTo(
      pieces,
      { autoAlpha: 0, scale: motionTokens.scale.text, filter: `blur(${motionTokens.blur.text})` },
      {
        autoAlpha: 1,
        scale: 1, // mechanic: full size
        filter: 'blur(0em)',
        ...timing,
        clearProps: 'transform,opacity,visibility,transition,filter',
      },
    );
    return timeline;
  }
  timeline.from(pieces, { autoAlpha: 0, y: motionTokens.offset.enter, ...timing, clearProps: revealClearProps });
  return timeline;
}

/**
 * Split `element` for `preset` / `by` and build its paused reveal. By line,
 * the split is undone when the reveal ends: lines are measured once, and fixed
 * line breaks would not reflow if the page is later resized.
 */
export function revealText(
  Splitter: typeof SplitText,
  element: HTMLElement,
  preset: TextRevealPreset,
  by: TextRevealBy,
  intent: MotionIntent,
): gsap.core.Timeline {
  const split = Splitter.create(element, { type: splitType(preset, by), aria: 'auto' });
  const pieces =
    by === 'lines' ? split.lines.map(textBox) : !isWipe(preset) && by === 'chars' ? split.chars : split.words;
  const timeline = buildTextReveal(element, pieces, preset, intent, by);
  if (by === 'lines') timeline.call(() => split.revert());
  return timeline;
}
