/**
 * The SECTION ENTRANCE builders: the `wipe` reveal preset and the section
 * header sequence, shared by every entry point so they can never animate a
 * section differently:
 *
 *   - `<Reveal preset="wipe">` and `<Stagger preset="wipe">`;
 *   - the markup runtime (`data-ssx-reveal="wipe"`, `data-ssx-stagger="wipe"`,
 *     `data-ssx-section="header"`);
 *   - `useSectionEntrance()`, the hook a page section calls.
 *
 * Ported from the SSB home page's section entrance (its faculty, alumni and
 * innovation-lab sections), which was already built on these tokens. Each
 * builder returns a PAUSED timeline whose start state is drawn at once; the
 * caller decides when it plays (mount, in view, after a hold).
 *
 *   wipe     a card clips open from the bottom (`clip-path: inset()`, rounded
 *            to its own corners), its photo settles from a slight zoom, and its
 *            eyebrow, title, subline, description, figure, logos, avatars and
 *            action rise in. Always the expressive curve: it is a marketing
 *            moment.
 *   header   the eyebrow fades up, the headline rises line by line out of a
 *            mask (SplitText, passed in so it stays lazily loaded), then the
 *            sub and controls follow.
 *
 * Only transforms, opacity and clip-path move. No hooks, no directive, no
 * ScrollTrigger: server-safe to import (it does nothing until called), and the
 * markup runtime can keep loading it lazily.
 */
import { gsap } from 'gsap';
// Type only: the class is passed in, so callers can keep loading it lazily.
import type { SplitText } from 'gsap/SplitText';

import { motionAttributes } from './attributes';
import { ease, holdTransitions, motionTokens, revealClearProps } from './core';

const { duration: d, stagger: st, offset } = motionTokens;

/**
 * Where a section's parts start, as ScrollTrigger `start`s. The in-view rule
 * (`motion.viewport.enter`, 10%) is where a single block enters; a section's
 * header waits until it is half as far again up the screen (85%), its cards
 * until their row is two and a half times as far (75%), so the cards open on
 * screen, not just below the fold. `clamp()` keeps each start reachable when
 * the section is the last thing on the page.
 */
const inViewShare = parseFloat(motionTokens.viewport.enter);
const fromTop = (factor: number) => `clamp(top ${100 - inViewShare * factor}%)`;
/** `clamp(top 85%)`: a section header (and a `data-enter="block"`) plays. */
export const sectionHeaderStart = fromTop(1.5);
/** `clamp(top 75%)`: a deck of cards wipes open. */
export const sectionDeckStart = fromTop(2.5);

/**
 * The photo's settle, from this scale to its own. The page's value (tuned by
 * eye on the faculty portraits): a zoom slight enough to read as the camera
 * settling, not as the photo growing. No motion token is a zoom-IN step
 * (`motion.scale.*` are press, pulse and entrance steps below 1, or a beat),
 * so it is named here.
 */
const photoSettleScale = 1.18;

/**
 * Room below a masked headline line for its descenders. A SplitText line mask
 * is exactly one line tall and clips a "y" or "g"; the mask is padded by this
 * and pulled back by the same margin, so nothing moves. A typographic depth
 * (the descender of the display faces), not a motion value, so no token.
 */
const descenderRoom = '0.15em';

/** A line starts a tenth below its own height, so it clears its mask (percent of the line: structural). */
const belowMask = 110;

/** The card parts that rise in once the wipe is under way, in reading order. */
const risingParts = ['eyebrow', 'title', 'subline', 'description', 'figure', 'logos', 'avatars', 'action']
  .map((part) => `[data-part="${part}"]`)
  .join(',');

/** A section header sequence: it owns its own eyebrow (and headline, sub, controls). */
const sectionHeaderBlock = `[${motionAttributes.section}="header"]`;

/** The card's photo: a marked part, or a `CardMedia`'s image. */
const photoParts = '[data-part="photo"],[data-slot="card-media"] img';

/**
 * Every element that owns its own wipe. A part belongs to the NEAREST of
 * these above it, so a card inside a wiping panel animates its own parts and
 * the panel does not animate them too.
 */
export const wipeOwnerSelector = `[${motionAttributes.wipe}],[${motionAttributes.reveal}="wipe"],[${motionAttributes.stagger}="wipe"] > *`;

/** The header's parts. `data-enter` is the SSB page's spelling, accepted during its migration. */
export const sectionParts = {
  header: `[${motionAttributes.section}="header"],[data-part="header"],[data-enter="header"]`,
  eyebrow: '[data-part="eyebrow"],[data-enter="eyebrow"]',
  headline: '[data-part="headline"],[data-enter="headline"]',
  follow: '[data-part="sub"],[data-part="controls"],[data-enter="sub"],[data-enter="controls"]',
} as const;

/** The end state of a rise: in place, visible, and back on its stylesheet when done. */
const shown = {
  autoAlpha: 1,
  y: 0, // mechanic: in place
  clearProps: revealClearProps,
} as const;

/**
 * Tags `cards` as wipe owners (`data-ssx-wipe`) BEFORE any timeline is built,
 * so each card's parts are found by nearest owner even when its own wipe is
 * built later. Returns the untag.
 */
export function markWipeTargets(cards: Element[]): () => void {
  cards.forEach((card) => card.setAttribute(motionAttributes.wipe, ''));
  return () => cards.forEach((card) => card.removeAttribute(motionAttributes.wipe));
}

/**
 * Only the cards that start on screen horizontally (their box overlaps the
 * viewport's width, so a right-to-left row that overflows to the left counts
 * only what shows); the rest of a row (a loop's copy) opens long before it
 * scrolls round. A card with no box yet (no layout) counts as on screen.
 */
export function cardsOnScreen(cards: Element[]): Element[] {
  const width = typeof window === 'undefined' ? Infinity : window.innerWidth;
  return cards.filter((card) => {
    const { left, right, width: w, height: h } = card.getBoundingClientRect();
    return (!w && !h) || (right > 0 && left < width);
  });
}

export interface WipeOptions {
  /** Seconds between one card's wipe and the next. Default: `motion.stagger.base` × 1.5. */
  gap?: number;
  /**
   * A row (a scroller, a stepping Rail) to hold still while the cards wipe:
   * `data-ssx-hold` is set on it now and removed when they have landed (or on
   * revert), so the row starts moving with its cards open on the margin.
   */
  row?: Element | null;
}

/**
 * The `wipe` preset over `cards`, one `gap` apart, as one paused timeline.
 * The radius is read from each card's computed style here, at build time: a
 * measurement, not a design value. Returns the timeline and a revert that
 * removes the row hold and the owner tags (the tweens revert with their
 * gsap.context).
 */
export function wipeTimeline(
  cards: Element[],
  { gap = st.base * 1.5, row = null }: WipeOptions = {},
): { timeline: gsap.core.Timeline; revert: () => void } {
  const untag = markWipeTargets(cards);
  const enter = ease('expressiveEntrance');
  const timeline = gsap.timeline({ paused: true, defaults: { ease: enter } });
  if (row) row.setAttribute(motionAttributes.rowHold, '');

  cards.forEach((card, i) => {
    const at = i * gap;
    const radius = (typeof getComputedStyle === 'function' && getComputedStyle(card).borderTopLeftRadius) || '0px';
    /** The card's own parts: those whose nearest wipe owner is this card. */
    const parts = (selector: string) =>
      Array.from(card.querySelectorAll(selector)).filter((el) => el.closest(wipeOwnerSelector) === card);
    const photos = parts(photoParts);
    const marked = parts(risingParts).filter((el) => {
      // An eyebrow in a section header sequence inside this card is the header's to play.
      const header = el.closest(sectionHeaderBlock);
      return !(header && card.contains(header) && el.matches(sectionParts.eyebrow));
    });
    // Outermost only: a part inside another (a Figure in a figures plate, a
    // role in the avatars row) rises with it, so offsets never compound.
    const risers = marked.filter((el) => !marked.some((outer) => outer !== el && outer.contains(el)));
    holdTransitions([card, ...photos, ...risers]);

    timeline.fromTo(
      card,
      { clipPath: `inset(100% 0% 0% 0% round ${radius})` },
      {
        clipPath: `inset(0% 0% 0% 0% round ${radius})`,
        duration: d.slower * 1.25,
        ease: ease('expressiveInOut'),
        clearProps: 'clipPath,transition',
      },
      at,
    );
    if (photos.length) {
      timeline.fromTo(
        photos,
        { scale: photoSettleScale },
        {
          scale: 1, // mechanic: its own size
          duration: d.slower * 1.5,
          clearProps: 'transform,transition',
        },
        at,
      );
    }
    if (risers.length) {
      // The text rises in once the wipe is nearly half open.
      timeline.fromTo(
        risers,
        { autoAlpha: 0, y: offset.reveal },
        { ...shown, duration: d.slower, stagger: st.base * 1.5 },
        at + d.slower * 0.45,
      );
    }
  });
  // Landed: let the row move. A call at the end, not onComplete, which the caller may own.
  if (row) timeline.call(() => row.removeAttribute(motionAttributes.rowHold));

  return {
    timeline,
    revert: () => {
      untag();
      if (row) row.removeAttribute(motionAttributes.rowHold);
    },
  };
}

export interface SectionHeaderParts {
  eyebrows: Element[];
  headline: HTMLElement | undefined;
  follow: Element[];
}

/**
 * The header's parts under `scope`, leaving out any inside a wipe owner (a
 * card's own headline belongs to the card).
 */
export function sectionHeaderParts(scope: Element): SectionHeaderParts {
  const find = (selector: string) =>
    Array.from(scope.querySelectorAll(selector)).filter((el) => {
      const owner = el.closest(wipeOwnerSelector);
      return !owner || !scope.contains(owner) || owner === scope;
    });
  return {
    eyebrows: find(sectionParts.eyebrow),
    headline: find(sectionParts.headline)[0] as HTMLElement | undefined,
    follow: find(sectionParts.follow),
  };
}

/**
 * The header sequence over `parts`, as one paused timeline: eyebrow, then the
 * headline line by line out of a mask, then the sub and controls. Pass
 * SplitText (loaded however the caller loads it) to split the headline by
 * lines; without it the headline fades up with the eyebrow. The split is
 * undone when the lines land, and by the returned revert.
 */
export function sectionHeaderTimeline(
  parts: SectionHeaderParts,
  Splitter: typeof SplitText | null,
): { timeline: gsap.core.Timeline; revert: () => void } {
  const { eyebrows, headline, follow } = parts;
  const enter = ease('expressiveEntrance');
  const timeline = gsap.timeline({ paused: true, defaults: { ease: enter } });
  // fromTo, never from(): an explicit end state survives React re-running the
  // effect (Strict Mode), where from() would read a half-hidden value.
  holdTransitions([...eyebrows, ...follow]);
  const rising = Splitter || !headline ? eyebrows : [...eyebrows, headline];
  if (headline && !Splitter) holdTransitions(headline);
  if (rising.length) {
    timeline.fromTo(rising, { autoAlpha: 0, y: offset.enter }, { ...shown, duration: d.slow }, 0);
  }

  let split: SplitText | null = null;
  if (headline && Splitter) {
    split = Splitter.create(headline, { type: 'lines', mask: 'lines', aria: 'auto' });
    const done = split;
    gsap.set(done.masks, { paddingBottom: descenderRoom, marginBottom: `-${descenderRoom}` });
    const lines = gsap.fromTo(
      done.lines,
      { yPercent: belowMask },
      { yPercent: 0, duration: d.slower, stagger: st.base * 2, ease: enter },
    );
    // Landed: drop the split, so the headline reflows if the page is resized.
    // (A call, not an `onComplete` key: this module is server-safe, and the
    // directive check reads an `on*:` key as a React event handler.)
    lines.eventCallback('onComplete', () => done.revert());
    // One stagger step after the eyebrow.
    timeline.add(lines, rising.length ? `<${st.base}` : 0);
  }
  if (follow.length) {
    timeline.fromTo(
      follow,
      { autoAlpha: 0, y: offset.reveal },
      { ...shown, duration: d.slower, stagger: st.base },
      timeline.getChildren().length ? `<${d.fast}` : 0,
    );
  }
  return { timeline, revert: () => split?.revert() };
}

/** A block that fades up on its own (`data-enter="block"`), as a paused tween. */
export function blockRise(block: Element): gsap.core.Tween {
  holdTransitions(block);
  return gsap.fromTo(
    block,
    { autoAlpha: 0, y: offset.reveal },
    { ...shown, duration: d.slower, ease: ease('expressiveEntrance'), paused: true },
  );
}
