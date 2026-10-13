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
