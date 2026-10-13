/**
 * STORY FIXTURE — stills and copy for the Breaker stories. Not part of the
 * public API, not shipped, not scanned for classes. The copy and the stills
 * are the SSB page's (`../../_fixtures/photos`, credited in its README; its
 * placeholders are placeholders here); the wordmarks are stand-ins, and their
 * hexes the stand-in artwork's.
 */
import type { MarketingLogo } from '../../MarketingCard/fields';
import { INNOVATION_LAB, MITTAL_VISIT, WARIKOO_CONVOCATION } from '../../_fixtures/photos';
import { AVATAR, WHY } from '../../StatCard/_fixtures/stats';
import type { BreakerSlideData } from '../types';

const svg = (body: string, w = 1600, h = 900) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

/**
 * The Why breaker's still: Scaler's Innovation Lab, empty. The page's own clip
 * of the remark is Zerodha's, cleared for the page only, so the story shows a
 * room with no one in it rather than a face beside someone else's words.
 */
export const STUDIO = INNOVATION_LAB;

/** The testimonial band's first still: Anupam Mittal's campus visit, him on the left in a dim room. */
export const ROOM = MITTAL_VISIT;

/** A pale scene (Ankur Warikoo at the convocation, a white tent): the frost darkens for white type. */
export const TENT = WARIKOO_CONVOCATION;

const word = (text: string, fill: string) =>
  svg(
    `<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="64" fill="${fill}">${text}</text>`,
    360,
    96,
  );

export const SHAADI: MarketingLogo = { name: 'Shaadi.com', src: word('shaadi.com', '#E8493F') };
export const WEBVEDA: MarketingLogo = { name: 'WebVeda', src: word('webveda', '#2B2B6B') };
export const SEQUOIA: MarketingLogo = { name: 'Sequoia Capital', src: word('SEQUOIA', '#0E5E3C') };

/** The Why breaker: one slide, the still drawn at the band's height, two spec figures. */
export const WHY_SLIDE: BreakerSlideData = {
  eyebrow: 'Why the traditional MBA doesn’t work',
  statement: '“If you’re 25 and going to an MBA college today, you must be some kind of idiot, if you ask me.”',
  attribution: '— Nikhil Kamath, Co-founder, Zerodha',
  figures: WHY,
  // The lab's white ceiling is a pale scene: `bright` darkens the frost for the white words.
  media: { poster: STUDIO, fit: 'height', position: '25% 50%', bright: true },
};

/** The testimonial band: a person to a slide, one of them on a pale scene. */
export const TESTIMONIALS: BreakerSlideData[] = [
  {
    eyebrow: 'Founders and investors have noticed',
    statement:
      'In July 2026, Anupam Mittal heard four startups our students built, and offered ₹50 lakh to back one of them, Hummusapiens.',
    profile: {
      name: 'Anupam Mittal',
      credential: 'Founder & CEO, Shaadi.com · Shark Tank India judge',
      logos: [SHAADI],
    },
    media: { poster: ROOM, position: '12% 40%' },
  },
  {
    eyebrow: 'Founders and investors have noticed',
    statement: 'Ankur Warikoo handed our graduates their degrees, and one line: “Don’t get intellectually comfortable.”',
    profile: { name: 'Ankur Warikoo', credential: 'Founder, WebVeda · Author, Do Epic Shit', logos: [WEBVEDA] },
    media: { poster: TENT, position: '25% 40%', bright: true },
  },
  {
    eyebrow: 'Founders and investors have noticed',
    statement:
      '“The energy at SSB & SST was intentional… they’re definitely on the right track to building things that matter.”',
    profile: {
      name: 'Sidhant Goyal',
      credential: 'Investor',
      logosPrefix: 'Ex-',
      logos: [SEQUOIA],
      avatar: AVATAR,
    },
  },
];
