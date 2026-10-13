/**
 * STORY FIXTURE — stand-in photographs and logos for the marketing stories
 * (PhotoFrame, GlassPlate, LogoTile, Figure, and the families built on them).
 * Not part of the public API, not shipped, not scanned for classes. The hexes
 * here are the stand-ins' artwork and a company's own colour (content), not
 * interface colours.
 */
import type { MarketingLogo } from '../../MarketingCard/fields';

const svg = (body: string, w = 800, h = 600) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`,
  )}`;

/** A deep scene with a bright sky: exercises the blur and the scrim. */
export const PHOTO = svg(
  '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FC8F0"/><stop offset="0.55" stop-color="#2E7D5B"/><stop offset="1" stop-color="#0B1A12"/></linearGradient></defs>' +
    '<rect width="800" height="600" fill="url(#g)"/>' +
    '<circle cx="610" cy="140" r="70" fill="#FFF4C2"/>' +
    '<circle cx="300" cy="250" r="72" fill="#E8B48A"/><rect x="214" y="320" width="172" height="280" rx="60" fill="#1C3D6E"/>' +
    '<path d="M0 470 L200 380 L420 450 L640 360 L800 420 L800 600 L0 600 Z" fill="#0B1A12" fill-opacity="0.55"/>',
);

/** A pale scene (a sunlit room): white type needs the dark plate here. */
export const PHOTO_PALE = svg(
  '<defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F4EC"/><stop offset="1" stop-color="#CFE3D6"/></linearGradient></defs>' +
    '<rect width="800" height="600" fill="url(#p)"/>' +
    '<rect x="80" y="90" width="260" height="200" fill="#FFFFFF" stroke="#B9C9BF" stroke-width="6"/>' +
    '<rect x="460" y="300" width="280" height="160" rx="12" fill="#E4D6BF"/>' +
    '<circle cx="560" cy="200" r="58" fill="#D9A77F"/>',
);

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
