import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LogoTile, type LogoTileFill, type LogoTileShape, type LogoTileSize } from './LogoTile';
import { LOGOS, PHOTO, SQUARE_LOGO } from '../PhotoFrame/_fixtures/marketing';
import { PhotoFrame } from '../PhotoFrame';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const FILLS: LogoTileFill[] = ['white', 'brand', 'glass'];
const SHAPES: LogoTileShape[] = ['wide', 'square'];
const SIZES: LogoTileSize[] = ['sm', 'md'];

/** A row of tiles: the row sets each tile's width (the card's `data-part="logos"`). */
const Row = ({ children, cols = 4, width }: { children: React.ReactNode; cols?: number; width: number }) => (
  <div
    style={{
      display: 'grid',
      gap: 'var(--space-2)',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      width,
      maxWidth: '100%',
    }}
  >
    {children}
  </div>
);

/** Glass needs something behind it. */
const OnPhoto = ({ children }: { children: React.ReactNode }) => (
  <PhotoFrame src={PHOTO} ratio="fill" scrim={false} style={{ padding: 'var(--space-4)' }}>
    {children}
  </PhotoFrame>
);

const meta = {
  title: 'Marketing/LogoTile',
  component: LogoTile,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          "A company's mark on a tile. `white` draws it in its own colours on white (white in both",
          "themes); `brand` puts it in white on the brand's own colour (`logo.color`, content, set",
          'inline); `glass` frosts it on a photo. `native` keeps a multi-colour mark in its colours.',
          'No file: the name as a wordmark. Width comes from the cell; `shape` sets the height.',
        ].join('\n'),
      },
    },
  },
  args: { logo: LOGOS[0]!, fill: 'white', shape: 'wide', size: 'md' },
  argTypes: {
    fill: { control: 'inline-radio', options: FILLS },
    shape: { control: 'inline-radio', options: SHAPES },
    size: { control: 'inline-radio', options: SIZES },
  },
  render: (args) => {
    const tile = (
      <div style={{ width: args.shape === 'square' ? 96 : 200 }}>
        <LogoTile {...args} />
      </div>
    );
    return args.fill === 'glass' ? <OnPhoto>{tile}</OnPhoto> : tile;
  },
} satisfies Meta<typeof LogoTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/* Stand-in marks with WHITE details (the hexes are the stand-ins' artwork and a company's own
   colour: content). A pin with a white hole, as a delivery app's; a letter cut out of a square. */
const markSvg = (body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">${body}</svg>`)}`;
const PIN_LOGO = {
  name: 'Pinpoint',
  color: '#FC8019',
  src: markSvg(
    '<path d="M48 6c-17 0-30 13-30 30 0 22 30 54 30 54s30-32 30-54C78 19 65 6 48 6z" fill="#FC8019"/>' +
      '<circle cx="48" cy="36" r="12" fill="#FFFFFF"/>',
  ),
};
const CUTOUT_LOGO = {
  name: 'Carloop',
  color: '#4A2BB8',
  src: markSvg(
    '<rect x="6" y="6" width="84" height="84" rx="18" fill="#2B1C6E"/>' +
      '<path d="M64 34a20 20 0 1 0 0 28" stroke="#FFFFFF" stroke-width="12" fill="none" stroke-linecap="round"/>',
  ),
};

/**
 * Marks with white details on `brand` and `glass`: the flatten
 * (`grayscale(1) invert(1) brightness(1.8)`, the batch's rule) keeps the
 * pin's hole and the cut-out "C" as shapes. For reference, the last column
 * draws the same file with the old `brightness(0) invert(1)`: a solid blob.
 */
export const WhiteDetails: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const row = (fill: LogoTileFill) => (
      <Row cols={3} width={300}>
        {[PIN_LOGO, CUTOUT_LOGO].map((logo) => (
          <LogoTile key={logo.name} logo={logo} fill={fill} shape="square" />
        ))}
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            aspectRatio: '1',
            borderRadius: 'var(--radius-md)',
            background: fill === 'brand' ? PIN_LOGO.color : 'var(--glass-on-image-surface)',
            padding: 'var(--space-2)',
          }}
        >
          <img src={PIN_LOGO.src} alt="" style={{ width: '100%', height: '100%', filter: 'brightness(0) invert(1)' }} />
        </span>
      </Row>
    );
    return (
      <Stack gap={24}>
        <Spec label="brand · the pin, the cut-out C · (old flatten, for reference)" wide>
          {row('brand')}
        </Spec>
        <Spec label="glass · the pin, the cut-out C · (old flatten, for reference)" wide>
          <OnPhoto>{row('glass')}</OnPhoto>
        </Spec>
        <Spec label="white · own colours" wide>
          <Row cols={3} width={300}>
            {[PIN_LOGO, CUTOUT_LOGO].map((logo) => (
              <LogoTile key={logo.name} logo={logo} fill="white" shape="square" className="border border-border-decorative" />
            ))}
          </Row>
        </Spec>
      </Stack>
    );
  },
};

/** Every fill, shape and size. The last wide tile has no file: its name is the wordmark. */
export const FillByShapeBySize: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={32}>
      {FILLS.map((fill) =>
        SHAPES.map((shape) =>
          SIZES.map((size) => {
            const row =
              shape === 'wide' ? (
                <Row cols={5} width={size === 'md' ? 880 : 560}>
                  {LOGOS.map((logo) => (
                    <LogoTile key={logo.name} logo={logo} fill={fill} shape="wide" size={size} />
                  ))}
                </Row>
              ) : (
                <Row cols={4} width={size === 'md' ? 320 : 200}>
                  {[SQUARE_LOGO, { ...SQUARE_LOGO, native: true }, { name: 'H' }, LOGOS[1]!].map((logo, i) => (
                    <LogoTile key={i} logo={logo} fill={fill} shape="square" size={size} />
                  ))}
                </Row>
              );
            return (
              <Spec key={`${fill}-${shape}-${size}`} label={`${fill} · ${shape} · ${size}`} wide>
                {fill === 'glass' ? <OnPhoto>{row}</OnPhoto> : row}
              </Spec>
            );
          }),
        ),
      )}
    </Stack>
  ),
};
