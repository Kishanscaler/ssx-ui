/**
 * STORY FIXTURE: stand-in artwork for the DisplayBanner stories. Not part of
 * the public API. In a product the SITE ships this art (illustrations,
 * campaign photos); these are simple inline SVGs drawn for the stories, filled
 * with semantic colour utilities so they follow brand and theme. No external
 * images, nothing traced from the reference screenshots.
 */
import * as React from 'react';

type ArtProps = React.SVGProps<SVGSVGElement>;

/** A gift box with a bow and sparkles, on a transparent ground: the popout art. */
export function GiftArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 240 240" role="presentation" aria-hidden="true" {...props}>
      <ellipse cx="124" cy="226" rx="86" ry="10" className="fill-surface-inverse opacity-15" />
      {/* body: front, side */}
      <path d="M44 122 L128 146 L128 224 L44 200 Z" className="fill-action-primary" />
      <path d="M128 146 L204 120 L204 196 L128 224 Z" className="fill-action-primary-active" />
      {/* lid: top, front lip, side lip */}
      <path d="M34 104 L124 78 L216 104 L128 132 Z" className="fill-action-primary-hover" />
      <path d="M34 104 L128 132 L128 150 L34 122 Z" className="fill-action-primary" />
      <path d="M128 132 L216 104 L216 122 L128 150 Z" className="fill-action-primary-active" />
      {/* ribbon */}
      <path d="M78 113 L96 118 L96 208 L78 203 Z" className="fill-accent1" />
      <path d="M164 136 L182 130 L182 208 L164 214 Z" className="fill-accent1-border" />
      <path d="M79 90 L97 85 L187 111 L169 116 Z" className="fill-accent1" />
      <path d="M79 90 L169 116 L169 134 L79 108 Z" className="fill-accent1" />
      <path d="M169 116 L187 111 L187 129 L169 134 Z" className="fill-accent1-border" />
      {/* bow */}
      <path d="M124 92 C 92 40, 58 58, 84 86 C 96 98, 112 96, 124 92 Z" className="fill-accent1" />
      <path d="M124 92 C 150 36, 196 50, 170 84 C 158 98, 138 98, 124 92 Z" className="fill-accent1" />
      <path d="M124 92 C 104 70, 86 66, 90 80 C 96 90, 112 92, 124 92 Z" className="fill-accent1-border" />
      <path d="M124 92 C 142 66, 168 62, 164 78 C 158 90, 138 92, 124 92 Z" className="fill-accent1-border" />
      <ellipse cx="124" cy="92" rx="11" ry="8" className="fill-accent1" />
      {/* sparkles */}
      <path d="M28 40 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 Z" className="fill-accent2" />
      <path d="M208 28 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" className="fill-accent2" />
      <circle cx="212" cy="70" r="5" className="fill-accent1" />
      <circle cx="20" cy="92" r="4" className="fill-action-primary" />
    </svg>
  );
}

function cube(cx: number, cy: number, s: number, top: string, key: string) {
  const w = s * 0.866;
  return (
    <g key={key}>
      <path d={`M${cx} ${cy - s} L${cx + w} ${cy - s / 2} L${cx} ${cy} L${cx - w} ${cy - s / 2} Z`} className={top} />
      <path d={`M${cx - w} ${cy - s / 2} L${cx} ${cy} L${cx} ${cy + s} L${cx - w} ${cy + s / 2} Z`} className="fill-brand-tint-border" />
      <path d={`M${cx} ${cy} L${cx + w} ${cy - s / 2} L${cx + w} ${cy + s / 2} L${cx} ${cy + s} Z`} className="fill-brand-tint-border" />
      <path d={`M${cx} ${cy} L${cx + w} ${cy - s / 2} L${cx + w} ${cy + s / 2} L${cx} ${cy + s} Z`} className="fill-accent1-on-solid opacity-25" />
    </g>
  );
}

/** Isometric blocks, drawn large so the card's edge crops them: the `end` art. */
export function StackArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 320 260" preserveAspectRatio="xMinYMid slice" role="presentation" aria-hidden="true" {...props}>
      <ellipse cx="200" cy="236" rx="150" ry="16" className="fill-accent1-on-solid opacity-15" />
      {cube(236, 150, 80, 'fill-brand-tint-surface', 'a')}
      {cube(128, 176, 56, 'fill-accent1', 'b')}
      {cube(214, 60, 44, 'fill-brand-tint-surface', 'c')}
      <circle cx="96" cy="70" r="18" className="fill-accent2" />
      <circle cx="90" cy="64" r="6" className="fill-brand-tint-surface opacity-60" />
    </svg>
  );
}

function MiniCard({ x, y, r, tone }: { x: number; y: number; r: number; tone: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect width="170" height="120" rx="14" className="fill-surface-raised stroke-border-decorative" strokeWidth="1" />
      <circle cx="30" cy="32" r="14" className={tone} />
      <rect x="54" y="22" width="84" height="8" rx="4" className="fill-surface-active" />
      <rect x="54" y="36" width="56" height="8" rx="4" className="fill-surface-sunken" />
      <rect x="16" y="64" width="138" height="10" rx="5" className="fill-surface-sunken" />
      <rect x="16" y="82" width="100" height="10" rx="5" className="fill-surface-sunken" />
      <rect x="16" y="100" width="60" height="8" rx="4" className={tone} />
    </g>
  );
}

/** Overlapping UI cards, anchored bottom-right so they bleed off the corner: the hero collage. */
export function CollageArt(props: ArtProps) {
  return (
    <svg viewBox="0 0 360 280" preserveAspectRatio="xMaxYMax slice" role="presentation" aria-hidden="true" {...props}>
      <MiniCard x={70} y={40} r={-8} tone="fill-accent1" />
      <MiniCard x={190} y={70} r={6} tone="fill-accent2" />
      <MiniCard x={120} y={150} r={-2} tone="fill-action-primary" />
      <circle cx="330" cy="40" r="22" className="fill-accent1" />
    </svg>
  );
}

/** A product UI screenshot stand-in, anchored top-left, cropped at the bottom-right corner. */
export function UiMockArt(props: ArtProps & { accent?: string }) {
  const { accent = 'fill-action-primary', ...rest } = props;
  return (
    <svg viewBox="0 0 480 320" preserveAspectRatio="xMinYMin slice" role="presentation" aria-hidden="true" {...rest}>
      <rect x="0.5" y="0.5" width="520" height="360" rx="14" className="fill-surface-raised stroke-border-decorative" />
      <rect x="0.5" y="0.5" width="520" height="36" rx="14" className="fill-surface-sunken" />
      <circle cx="22" cy="18" r="5" className="fill-accent2" />
      <circle cx="40" cy="18" r="5" className="fill-accent1" />
      <circle cx="58" cy="18" r="5" className="fill-surface-active" />
      <rect x="16" y="52" width="92" height="260" rx="8" className="fill-surface-subtle" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="28" y={68 + i * 26} width={i === 1 ? 68 : 56} height="10" rx="5" className={i === 1 ? accent : 'fill-surface-active'} />
      ))}
      <rect x="124" y="52" width="160" height="12" rx="6" className="fill-surface-active" />
      <rect x="124" y="72" width="100" height="10" rx="5" className="fill-surface-sunken" />
      {[46, 80, 58, 110, 92, 130, 74].map((h, i) => (
        <rect key={i} x={128 + i * 34} y={250 - h} width="20" height={h} rx="4" className={i === 5 ? accent : 'fill-surface-brand-subtle'} />
      ))}
      <rect x="124" y="262" width="340" height="1" className="fill-border-decorative" />
      <rect x="124" y="276" width="220" height="10" rx="5" className="fill-surface-sunken" />
    </svg>
  );
}

/**
 * A "campus at dusk" photo stand-in: a bright sun and sky behind dark
 * buildings, so the scrim is exercised against both extremes.
 */
export function PhotoArt(props: ArtProps) {
  const id = React.useMemo(() => `sky-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" role="presentation" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--surface-brand-solid)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--accent2-solid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent1-solid)' }} />
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill={`url(#${id})`} />
      <circle cx="560" cy="300" r="90" className="fill-accent1" />
      <circle cx="560" cy="300" r="60" className="fill-page" />
      <path d="M0 360 C 160 300, 300 340, 420 320 S 680 300, 800 330 L800 520 L0 520 Z" className="fill-surface-inverse opacity-60" />
      {(
        [
          [40, 250, 90, 270],
          [150, 190, 120, 330],
          [290, 280, 80, 240],
          [640, 230, 110, 290],
        ] as const
      ).map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} className="fill-surface-inverse" />
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 3 }).map((__, c) => (
              <rect
                key={`${r}-${c}`}
                x={x + 14 + c * ((w - 28) / 3)}
                y={y + 20 + r * 34}
                width="12"
                height="16"
                className={(r + c + i) % 3 === 0 ? 'fill-accent1' : 'fill-surface-inverse-sunken'}
              />
            )),
          )}
        </g>
      ))}
    </svg>
  );
}

/** A fake QR code (a deterministic module pattern plus the three finder squares). Not scannable. */
export function QrArt(props: ArtProps) {
  const n = 25;
  const cells: Array<[number, number]> = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells.push([x, y]);
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" className="fill-content" />
      <rect x={x + 1} y={y + 1} width="5" height="5" className="fill-surface" />
      <rect x={x + 2} y={y + 2} width="3" height="3" className="fill-content" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} shapeRendering="crispEdges" role="img" {...props}>
      <rect x="-1" y="-1" width={n + 2} height={n + 2} className="fill-surface" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className="fill-content" />
      ))}
      {finder(0, 0)}
      {finder(n - 7, 0)}
      {finder(0, n - 7)}
    </svg>
  );
}
