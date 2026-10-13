'use client';

import * as React from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { whenMotionReleased } from './attributes';
import { motionTokens, prefersReducedMotion } from './core';
import {
  blockRise,
  cardsOnScreen,
  markWipeTargets,
  sectionDeckStart,
  sectionHeaderParts,
  sectionHeaderStart,
  sectionHeaderTimeline,
  sectionParts,
  wipeOwnerSelector,
  wipeTimeline,
} from './section';
import { useMotion } from './use-motion';

export interface SectionEntranceOptions {
  /**
   * One selector per group of cards that wipe open together. Each group plays
   * when its row (the cards' `ul` inside the section, or the first card) is
   * 75% of the way up the screen. A card already in an earlier group is left to that group.
   *
   * The default, `['[data-slot$="-card"]', '.ssx-card']`, matches the
   * marketing cards' roots (`person-card`, `showcase-card`, `media-card`,
   * `stat-card`) and the SSB page's own `.ssx-card`. It also matches the
   * product cards `selectable-card` and `clickable-card`: pass `decks` to
   * narrow it in a section that has those.
   */
  decks?: string[];
}

const defaultDecks = ['[data-slot$="-card"]', '.ssx-card'];

/**
 * A section's entrance, in moments, each played once when its part is on
 * screen (`clamp()` starts, so they stay reachable at the page's foot):
 *
 *   1. The header, when it is 85% of the way up the screen: the eyebrow fades
 *      up, the headline rises line by line out of a mask (SplitText, loaded on
 *      demand), then the sub and controls follow.
 *   2. Each deck of cards, when its row is 75% of the way up: the cards
 *      wipe open bottom to top one after another while each photo settles
 *      from a slight zoom and its eyebrow, title, subline, description,
 *      figure, logos, avatars and action rise in (a part inside another rises
 *      with it). Only the cards on the page at this width (`offsetParent`)
 *      and starting on screen play; the cards' `ul` (when it is inside the
 *      section) is held (`data-ssx-hold`, `isRowHeld()`) until they land, so
 *      a ticker starts with its cards open on the margin.
 *   3. Each `data-enter="block"` fades up on its own when it is 85% up.
 *
 * Markers: the header block `data-part="header"` (or `data-ssx-section="header"`),
 * its parts `data-part="eyebrow|headline|sub|controls"`; card parts
 * `data-part="photo|eyebrow|title|subline|description|figure|logos|avatars|action"`
 * (a `CardMedia` image counts as the photo). The SSB page's `data-enter="header|
 * eyebrow|headline|sub|controls"` is accepted too, during its migration.
 *
 * The same builders as `<Reveal preset="wipe">` and `data-ssx-section="header"`
 * (one implementation, two entry points); use either the hook or the markup on
 * a section, not both. It honours a `data-motion-hold` (a splash). Under
 * reduced motion it arms nothing and the section is simply there.
 *
 *   const ref = React.useRef<HTMLElement>(null);
 *   useSectionEntrance(ref);
 *   return <section ref={ref}>…</section>;
 */
export function useSectionEntrance(
  scope: React.RefObject<HTMLElement | null>,
  { decks = defaultDecks }: SectionEntranceOptions = {},
): void {
  useMotion(
    (context) => {
      const root = scope.current;
      if (!root || prefersReducedMotion(root)) return undefined;
      gsap.registerPlugin(ScrollTrigger);

      let cancelled = false;
      const cleanups: Array<() => void> = [];

      /** Play `animation` once `trigger` reaches `start`, after any splash's hold. */
      const onScroll = (animation: gsap.core.Animation, trigger: Element, start: string) => {
        cleanups.push(
          whenMotionReleased(root, () =>
            context.add(() => {
              ScrollTrigger.create({ trigger, start, once: true, onEnter: () => animation.restart(true) });
            }),
          ),
        );
      };

      // The decks first: every card is tagged as a wipe owner before any part
      // is looked up, so a card inside another (a startup card in a panel)
      // animates only its own parts.
      const claimed = new Set<Element>();
      const groups = decks.map((selector) =>
        Array.from(root.querySelectorAll(selector)).filter((card) => {
          if (claimed.has(card)) return false;
          claimed.add(card);
          return true;
        }),
      );
      cleanups.push(markWipeTargets(Array.from(claimed)));
      groups.forEach((group) => {
        // Only cards on the page at this width: a phone stack and a desktop row
        // can both be in the DOM, one of them display:none.
        const cards = group.filter((card) => (card as HTMLElement).offsetParent !== null);
        if (!cards.length) return;
        // The cards' row, only if it is this section's own: a section inside a
        // list must not hold, or trigger on, the page's list around it.
        const list = cards[0]!.closest('ul');
        const row = list && root.contains(list) ? list : null;
        const { timeline, revert } = wipeTimeline(cardsOnScreen(cards), {
          gap: motionTokens.stagger.base * 1.5,
          row,
        });
        cleanups.push(revert);
        onScroll(timeline, row ?? cards[0]!, sectionDeckStart);
      });

      // Blocks below the cards: each fades up as it comes on screen.
      root.querySelectorAll('[data-enter="block"]').forEach((block) => {
        onScroll(blockRise(block), block, sectionHeaderStart);
      });

      // The header. Its parts are hidden at once; SplitText loads on demand.
      const parts = sectionHeaderParts(root);
      const all = [...parts.eyebrows, ...(parts.headline ? [parts.headline] : []), ...parts.follow];
      if (all.length) {
        const header = root.querySelector(sectionParts.header);
        const trigger = header && !header.closest(wipeOwnerSelector) ? header : root;
        gsap.set(all, { autoAlpha: 0 });
        const build = (Splitter: Parameters<typeof sectionHeaderTimeline>[1]) => {
          if (cancelled) return;
          context.add(() => {
            const { timeline, revert } = sectionHeaderTimeline(parts, Splitter);
            cleanups.push(revert);
            if (parts.headline && Splitter) gsap.set(parts.headline, { clearProps: 'opacity,visibility' });
            onScroll(timeline, trigger, sectionHeaderStart);
          });
        };
        if (parts.headline) {
          import('gsap/SplitText')
            .then(({ SplitText }) => {
              gsap.registerPlugin(SplitText);
              build(SplitText);
            })
            // No SplitText (an old GSAP): the headline fades up with the eyebrow.
            .catch(() => build(null));
        } else build(null);
      }

      return () => {
        cancelled = true;
        cleanups.splice(0).forEach((cleanup) => cleanup());
      };
    },
    scope,
    [decks.join('\n')],
  );
}
