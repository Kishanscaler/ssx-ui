/**
 * STORY FIXTURE — photographs and stand-in logos for the marketing stories
 * (PhotoFrame and the families built on it). Not part of the public API, not
 * shipped, not scanned for classes. The photos are the SSB page's own
 * (`../../_fixtures/photos`, credited in its README); the logos are invented
 * brands drawn as SVG wordmarks, and their hexes are a company's own colour
 * (content), not interface colours.
 */
import type { MarketingLogo } from '../../MarketingCard/fields';
import { CAMPUS_ENTRANCE, CAMPUS_WALK } from '../../_fixtures/photos';

const svg = (body: string, w = 800, h = 600) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

/** A deep scene with a bright sky (students on the campus path): exercises the blur and the scrim. */
export const PHOTO = CAMPUS_WALK;

/** A pale scene (the school's sunlit entrance): white type needs the dark plate here. */
export const PHOTO_PALE = CAMPUS_ENTRANCE;

const word = (text: string, fill: string, w = 360, h = 96) =>
  svg(
    `<text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="64" fill="${fill}">${text}</text>`,
    w,
    h,
  );

const mark = (fill: string, accent: string) =>
  svg(`<circle cx="48" cy="48" r="44" fill="${fill}"/><path d="M28 50 L44 66 L70 32" stroke="${accent}" stroke-width="10" fill="none"/>`, 96, 96);

/** Wordmarks with their brand's colour, a multi-colour mark, and a name with no file. */
export const LOGOS: MarketingLogo[] = [
  { name: 'Northwind', src: word('northwind', '#C8102E'), color: '#C8102E' },
  { name: 'Bluepeak', src: word('bluepeak', '#1F4FD8'), color: '#1F4FD8' },
  { name: 'Verdant', src: word('verdant', '#0E7A4F'), color: '#0E7A4F' },
  { name: 'Prism Labs', src: mark('#7A3FF2', '#FFC83D'), color: '#2A1060', native: true },
  { name: 'Halcyon' },
];

export const SQUARE_LOGO: MarketingLogo = { name: 'Prism Labs', src: mark('#7A3FF2', '#FFC83D'), color: '#2A1060' };
