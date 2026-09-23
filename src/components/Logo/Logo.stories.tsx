import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Logo, LogoLoader } from './Logo';
import { Label, Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const BRANDS = ['sst', 'ssb'] as const;
const MODES = ['light', 'dark'] as const;
const BRAND_TITLE = { sst: 'SST — Scaler School of Technology', ssb: 'SSB — Scaler School of Business' };

/**
 * A surface pinned to one brand and mode, whatever the toolbar says: the tile
 * carries its own `data-brand` + `data-theme`, so the tokens (and the logo's
 * `auto` values) resolve inside it exactly as they would on a page.
 */
const Tile = ({
  brand,
  mode,
  children,
  label,
}: {
  brand: 'sst' | 'ssb';
  mode: 'light' | 'dark';
  children: React.ReactNode;
  label?: string;
}) => (
  <div
    data-brand={brand}
    data-theme={mode}
    style={{
      background: 'var(--surface-page)',
      color: 'var(--content-primary)',
      border: '1px solid var(--border-decorative)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      minWidth: 220,
    }}
  >
    {label ? <Label>{label}</Label> : null}
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>{children}</div>
  </div>
);

const meta = {
  title: 'Brand/Logo',
  component: Logo,
  subcomponents: { LogoLoader } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The SST and SSB logos, inline SVG generated from the approved artwork in `assets/{sst,ssb}/logos`',
          '(`npm run sync:logos`). Use it for every Scaler logo: the TopNav brand renders it by default, and',
          'the Spinner traces the same monogram. Partner and employer logos are images, not this.',
          '',
          '- **brand** `auto` (default) follows the nearest `data-brand`; pin `sst` / `ssb` when the page is',
          '  about the other school.',
          '- **variant** `full` is the combination mark; `monogram` the mark alone.',
          '- **tone** `color` is the artwork\'s colours; `mono` is one colour, in `currentColor`.',
          '- **surface** `auto` (default) follows `data-theme`, or the OS when nothing pins it — the same rule',
          '  as the tokens: Color / Mono on light, Inverse Color / Inverse Mono on dark. Pin `dark` for a surface',
          '  that is dark in both modes (brand-filled, a photo, a dark footer), `light` for a white card in a',
          '  dark page. `surface-inverse` flips with the theme, so pin against the colour it has, not its name.',
          '- **size** `sm` 24px, `md` 32px, `lg` 40px (the artwork\'s own height). A `className` height replaces',
          '  it; the width always follows the artwork.',
          '- **label** / **decorative**: named "Scaler School of Technology" / "…Business" by default.',
          '',
          '`auto` needs no JavaScript: brand.css sets the logo colours as custom properties under the tokens\'',
          'own selectors, and they inherit, so the nearest ancestor decides. Flip the toolbar to see it.',
          '',
          '**Usage.** No clear-space or minimum-size rule is specified anywhere in this repository (`docs/`,',
          '`assets/`); ask the brand team before publishing one. What the system does fix: the monogram is',
          'traced as a loader only at 24px and up (below that, the solid silhouette inks in), and there is no',
          'stacked lockup — only the horizontal combination mark and the monogram exist. SSB\'s Inverse Color',
          'artwork is all white (it drops the green), while SST\'s keeps the blue glyph; both are drawn as supplied.',
        ].join('\n'),
      },
    },
  },
  args: {
    brand: 'auto',
    variant: 'full',
    tone: 'color',
    surface: 'auto',
    size: 'md',
    decorative: false,
  },
  argTypes: {
    brand: { control: 'select', options: ['auto', 'sst', 'ssb'] },
    variant: { control: 'inline-radio', options: ['full', 'monogram'] },
    tone: { control: 'inline-radio', options: ['color', 'mono'] },
    surface: { control: 'inline-radio', options: ['auto', 'light', 'dark'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
    decorative: { control: 'boolean' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Driven by the controls. `auto` brand and surface follow the toolbar. */
export const Playground: Story = {};

/**
 * Every artwork: both schools × full and monogram × colour and mono × a light
 * and a dark surface. Surfaces are pinned here, so this grid looks the same in
 * every toolbar combination.
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={32}>
      {BRANDS.map((brand) => (
        <Stack key={brand} gap={12}>
          <Label>{BRAND_TITLE[brand]}</Label>
          <Row align="start">
            {MODES.map((mode) => (
              <Tile key={mode} brand={brand} mode={mode} label={`${mode} surface · surface="${mode}"`}>
                <Stack gap={16}>
                  {(['color', 'mono'] as const).map((tone) => (
                    <div key={tone} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                      <Logo brand={brand} tone={tone} surface={mode} size="lg" />
                      <Logo brand={brand} tone={tone} surface={mode} variant="monogram" size="lg" />
                      <Label>{tone}</Label>
                    </div>
                  ))}
                </Stack>
              </Tile>
            ))}
          </Row>
        </Stack>
      ))}
    </Stack>
  ),
};

/**
 * `brand="auto"` and `surface="auto"`, the defaults: nothing is pinned, so each
 * logo takes its brand and mode from the nearest ancestor. The first row
 * follows the toolbar; the tiles each set their own `data-brand` /
 * `data-theme`, and the same `<Logo />` re-themes inside them with no JS.
 */
export const Auto: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={24}>
      <Spec label="following the toolbar — <Logo />, variant monogram, tone mono">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo size="lg" />
          <Logo size="lg" variant="monogram" />
          <Logo size="lg" tone="mono" />
          <Logo size="lg" variant="monogram" tone="mono" />
        </div>
      </Spec>
      <Row align="start">
        {BRANDS.flatMap((brand) =>
          MODES.map((mode) => (
            <Tile key={`${brand}-${mode}`} brand={brand} mode={mode} label={`data-brand="${brand}" data-theme="${mode}"`}>
              <Logo />
              <Logo variant="monogram" />
              <Logo tone="mono" variant="monogram" />
            </Tile>
          )),
        )}
      </Row>
    </Stack>
  ),
};

/** Height is the size; width follows the artwork. The TopNav draws it at 28px (22px in the sm bar). */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      {(['full', 'monogram'] as const).map((variant) => (
        <Row key={variant}>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Spec key={size} label={`${variant} · ${size} — ${{ sm: 24, md: 32, lg: 40 }[size]}px`}>
              <Logo variant={variant} size={size} />
            </Spec>
          ))}
          <Spec label={`${variant} · className="h-[28px]" (TopNav)`}>
            <Logo variant={variant} className="h-[28px]" />
          </Spec>
        </Row>
      ))}
    </Stack>
  ),
};

/**
 * The loading monograms. `LogoLoader` is the Spinner's monogram draw — the same
 * element and keyframes — in the logo's colours: the brand colour on light,
 * white on dark (as the Inverse Color shield is), or mono. `sm` (16px) inks the
 * solid silhouette upward, because the trace has no room; `Spinner size="sm"`
 * itself stays the six-dot grid.
 */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap={24}>
      <Spec label="following the toolbar — <LogoLoader />, sm · md · lg · xl">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <LogoLoader key={size} size={size} />
          ))}
        </div>
      </Spec>
      <Row align="start">
        {BRANDS.flatMap((brand) =>
          MODES.map((mode) => (
            <Tile key={`${brand}-${mode}`} brand={brand} mode={mode} label={`${brand} · ${mode}`}>
              <Stack gap={16}>
                {(['color', 'mono'] as const).map((tone) => (
                  <div key={tone} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                      <LogoLoader key={size} brand={brand} tone={tone} surface={mode} size={size} />
                    ))}
                    <Label>{tone}</Label>
                  </div>
                ))}
              </Stack>
            </Tile>
          )),
        )}
      </Row>
    </Stack>
  ),
};

/**
 * A logo on a surface whose darkness does not follow the theme — a brand-filled
 * hero, a photo, a footer that is dark in both modes: pin `surface="dark"`.
 * (Do not pin against `surface-inverse`: it flips to light in dark mode.)
 */
export const OnDarkSurface: Story = {
  name: 'On a fixed dark surface',
  parameters: { controls: { disable: true } },
  render: () => (
    <Row align="start">
      <div
        style={{
          background: 'var(--color-neutral-light-12)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <Logo surface="dark" size="lg" />
        <LogoLoader surface="dark" size="lg" />
      </div>
      <div
        style={{
          background: 'var(--surface-brand-solid)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
        }}
      >
        <Logo surface="dark" tone="mono" size="lg" />
        <LogoLoader surface="dark" tone="mono" size="lg" />
      </div>
    </Row>
  ),
};
