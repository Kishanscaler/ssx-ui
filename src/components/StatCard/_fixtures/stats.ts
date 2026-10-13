/**
 * STORY FIXTURE — the SSB page's figures, for the StatCard, StatGroup and
 * ProfilePlate stories. Not part of the public API, not shipped, not scanned
 * for classes. Copy from the page (placeholders there are placeholders here);
 * the avatar is the page's photo (`../../_fixtures/photos`); the wordmarks are
 * stand-ins, their hexes a company's own colour (content).
 */
import type { MarketingLogo } from '../../MarketingCard/fields';
import { SIDHANT_GOYAL } from '../../_fixtures/photos';

const svg = (body: string, w: number, h: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

const word = (text: string, fill: string, font = 'Georgia, serif') =>
  svg(
    `<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-weight="700" font-size="64" fill="${fill}">${text}</text>`,
    360,
    96,
  );

/** The breaker's two sources, as stand-in wordmarks. */
export const FORBES: MarketingLogo = { name: 'Forbes', src: word('Forbes', '#111111') };
export const PWC: MarketingLogo = { name: 'PwC', src: word('pwc', '#D04A02', 'Helvetica, Arial, sans-serif') };

/** The Innovation Lab's three, in the accent. */
export const LAB = [
  { value: '$1B+', label: 'Combined valuations' },
  { value: '₹10Cr+', label: 'Revenue generated' },
  { value: '$2M+', label: 'Funding raised' },
];

/** The internship's boxes: eyebrow, figure, caption. */
export const INTERNSHIP = [
  { eyebrow: 'Internship placement', value: '100%', label: 'Across cohorts 1 and 2' },
  { eyebrow: 'Top roles', value: '52%+', label: 'In Product and Founder’s Office' },
  { eyebrow: 'Duration', value: '3–6 months', label: 'Of internship, within the PGP' },
];

/** Placements' four outcomes (placeholders on the page too). */
export const PLACEMENTS = [
  { value: '₹19L', label: 'average CTC' },
  { value: '₹1.2Cr', label: 'highest CTC' },
  { value: '3×', label: 'average salary hike' },
  { value: '200+', label: 'recruiters on campus' },
];

/** The Why breaker's spec figures (the deck's, one sentence split into label and line). */
export const WHY = [
  {
    value: '60%',
    label: 'of MBA students',
    description: 'say their own coursework isn’t built for an AI-first workforce',
    source: 'Forbes',
    sourceLogo: FORBES,
    sourceNote: '2026',
  },
  {
    value: '62% more',
    label: 'pay for AI skills',
    description: 'than for peers in the same role without them',
    source: 'PwC',
    sourceLogo: PWC,
    sourceNote: '2026',
  },
];

/** Sidhant Goyal's portrait (the page's faculty photo): the testimonial band's profile avatar. */
export const AVATAR = SIDHANT_GOYAL;
