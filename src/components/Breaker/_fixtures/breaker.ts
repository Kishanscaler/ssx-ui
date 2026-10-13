/**
 * STORY FIXTURE — stand-in stills and copy for the Breaker stories. Not part of
 * the public API, not shipped, not scanned for classes. The copy is the SSB
 * page's (its placeholders are placeholders here); the hexes are the stand-in
 * artwork's.
 */
import type { MarketingLogo } from '../../MarketingCard/fields';
import { AVATAR, WHY } from '../../StatCard/_fixtures/stats';
import type { BreakerSlideData } from '../types';

const svg = (body: string, w = 1600, h = 900) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

/** A seated speaker a quarter across a dark studio, turned toward the right. */
const person = (skin: string, shirt: string, x: number) =>
  `<g transform="translate(0 -90)">` +
  `<ellipse cx="${x}" cy="360" rx="92" ry="112" fill="${skin}"/>` +
  `<path d="M${x - 40} 300 Q${x + 30} 250 ${x + 96} 320 L${x + 96} 300 Q${x + 20} 220 ${x - 70} 290 Z" fill="#1A1410"/>` +
  `<circle cx="${x + 48}" cy="350" r="9" fill="#1A1410"/>` +
  `<path d="M${x - 230} 990 Q${x - 210} 520 ${x} 500 Q${x + 210} 520 ${x + 240} 990 Z" fill="${shirt}"/></g>`;

/** The Why breaker's still: a dark studio, the speaker on the left looking right. */
export const STUDIO = svg(
  '<defs><radialGradient id="s" cx="0.25" cy="0.4" r="0.9"><stop offset="0" stop-color="#3A3F46"/><stop offset="1" stop-color="#0D0F12"/></radialGradient></defs>' +
    '<rect width="1600" height="900" fill="url(#s)"/>' +
    '<rect x="980" y="120" width="460" height="300" rx="8" fill="#1E2A36"/><rect x="1010" y="150" width="400" height="240" fill="#2C4A63"/>' +
    '<circle cx="1250" cy="640" r="160" fill="#5A3A22" fill-opacity="0.6"/>' +
    person('#C98F6B', '#20262E', 400),
);

/** The testimonial band's first still: a classroom, warm light. */
export const ROOM = svg(
  '<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4B3A2A"/><stop offset="1" stop-color="#14100C"/></linearGradient></defs>' +
    '<rect width="1600" height="900" fill="url(#r)"/>' +
    '<rect x="900" y="560" width="520" height="40" rx="20" fill="#2A2018"/><rect x="1100" y="420" width="90" height="140" rx="40" fill="#6B5240"/>' +
    '<rect x="1260" y="440" width="80" height="120" rx="36" fill="#7A5E48"/>' +
    person('#B9805C', '#E9E4DA', 380),
);

/** A pale scene (a white convocation tent): the frost darkens for white type. */
export const TENT = svg(
  '<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBFAF6"/><stop offset="1" stop-color="#DCD8CC"/></linearGradient></defs>' +
    '<rect width="1600" height="900" fill="url(#t)"/>' +
    '<path d="M0 120 L400 40 L800 120 L1200 40 L1600 120 L1600 160 L0 160 Z" fill="#FFFFFF" stroke="#D8D2C2" stroke-width="4"/>' +
    '<rect x="1000" y="260" width="420" height="160" fill="#2E5D8A"/>' +
    person('#C48A62', '#1F2B3A', 420),
);

const word = (text: string, fill: string) =>
  svg(
    `<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="64" fill="${fill}">${text}</text>`,
    360,
    96,
  );

export const SHAADI: MarketingLogo = { name: 'Shaadi.com', src: word('shaadi.com', '#E8493F') };
export const WEBVEDA: MarketingLogo = { name: 'WebVeda', src: word('webveda', '#2B2B6B') };
export const SEQUOIA: MarketingLogo = { name: 'Sequoia Capital', src: word('SEQUOIA', '#0E5E3C') };

/** The Why breaker: one slide, the clip drawn at the band's height, two spec figures. */
export const WHY_SLIDE: BreakerSlideData = {
  eyebrow: 'Why the traditional MBA doesn’t work',
  statement: '“If you’re 25 and going to an MBA college today, you must be some kind of idiot, if you ask me.”',
  attribution: '— Nikhil Kamath, Co-founder, Zerodha',
  figures: WHY,
  media: { poster: STUDIO, fit: 'height', position: '25% 50%' },
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
    media: { poster: ROOM, position: '20% 40%' },
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
