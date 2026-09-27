import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlusIcon, SearchIcon } from '../Button/_fixtures/icons';
import { GlassButton } from './GlassButton';

const STAND_IN = {
  sst: new URL('../Card/_fixtures/stand-in-sst.svg', import.meta.url).href,
  ssb: new URL('../Card/_fixtures/stand-in-ssb.svg', import.meta.url).href,
};

const meta = {
  title: 'Atoms/GlassButton',
  component: GlassButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A button made of a **material**, not a meaning: frosted glass that shows what is',
          'behind it, blurred and saturated. It is `Button` underneath (no variant), so focus,',
          'lift, loading, `asChild`, sizes and `shine` all behave the same.',
          '',
          'Use it over **something**: a photograph, video, gradient or scrolling content. On a',
          'plain page it is a slightly grey button that costs a compositing layer.',
          '',
          'One look: neutral glass at the system radius. Over a photograph, mark the region',
          '`data-surface-ink="on-image"` (a media Card does it for you) and the glass turns to',
          'white frost with white ink.',
          '',
          '`refraction` bends the backdrop at the rim. **Chromium only**, progressive: elsewhere',
          'the button is the same glass without it.',
          '',
          'Opaque fallbacks: no backdrop-filter support, reduced transparency, more contrast,',
          'forced colours. Check both brands and both themes.',
        ].join('\n'),
      },
    },
  },
  args: { children: 'Watch the trailer', size: 'md', refraction: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'icon-sm', 'icon-md', 'icon-lg'] },
    refraction: { control: 'boolean' },
    loading: { control: 'boolean' },
    shine: { control: 'boolean' },
    disabled: { control: 'boolean' },
    asChild: { control: false },
    children: { control: 'text' },
  },
} satisfies Meta<typeof GlassButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- backdrops ----------------------------------------------------- */

/** A photograph under the system scrim: the surface-ink contract's on-image fill. */
function OnImage({ children, brand }: { children: React.ReactNode; brand: 'sst' | 'ssb' }) {
  return (
    <div
      className="relative isolate overflow-hidden rounded-lg"
      style={{ backgroundImage: `url("${STAND_IN[brand]}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 -z-10 bg-surface-image-scrim" />
      <div data-surface-ink="on-image" className="flex flex-wrap items-center gap-4 p-8">
        {children}
      </div>
    </div>
  );
}

/**
 * Page content behind the glass: text and colour blocks, so the blur and
 * the refraction have detail to act on.
 */
function OverContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border-decorative bg-page">
      <div aria-hidden="true" className="grid grid-cols-6 gap-2 p-4 opacity-100">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className={
              i % 3 === 0
                ? 'h-10 rounded-md bg-action-primary'
                : i % 3 === 1
                  ? 'h-10 rounded-md bg-surface-brand-subtle'
                  : 'h-10 rounded-md bg-surface-inverse'
            }
          />
        ))}
        <p className="col-span-6 m-0 type-body text-content">
          Scaler School of Technology. Four-year undergraduate programme in computer science and AI.
          Applications for the 2029 intake are open.
        </p>
      </div>
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-4 p-4">{children}</div>
    </div>
  );
}

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{children}</div>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="m-0 font-sans type-eyebrow text-content-secondary">{children}</p>
);

const brandOf = (globals: Record<string, unknown>) => ((globals.brand as 'sst' | 'ssb') ?? 'sst');

/* ---------- stories -------------------------------------------------------- */

/** Every prop, live, over a photograph. */
export const Playground: Story = {
  render: (args, { globals }) => (
    <OnImage brand={brandOf(globals)}>
      <GlassButton {...args} />
    </OnImage>
  ),
};

/** The material where it belongs: over a photograph under its scrim. */
export const OnAPhotograph: Story = {
  name: 'On a photograph',
  parameters: { controls: { disable: true } },
  render: (_args, { globals }) => (
    <Stack>
      <OnImage brand={brandOf(globals)}>
        <GlassButton>Watch the trailer</GlassButton>
        <GlassButton>
          Start learning
        </GlassButton>
        <GlassButton size="icon-md" aria-label="Search programmes">
          <SearchIcon />
        </GlassButton>
      </OnImage>
    </Stack>
  ),
};

/** On the page, over content: mode-aware glass. Switch the theme. */
export const OverPageContent: Story = {
  name: 'Over page content',
  parameters: { controls: { disable: true } },
  render: () => (
    <OverContent>
      <GlassButton>Save draft</GlassButton>
      <GlassButton>
        Apply now
      </GlassButton>
      <GlassButton size="icon-md" aria-label="Add programme">
        <PlusIcon />
      </GlassButton>
    </OverContent>
  ),
};

/** The three text sizes and the three square sizes. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (_args, { globals }) => (
    <OnImage brand={brandOf(globals)}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <GlassButton key={size} size={size}>
          Learn more
        </GlassButton>
      ))}
      {(['icon-sm', 'icon-md', 'icon-lg'] as const).map((size) => (
        <GlassButton key={size} size={size} aria-label="Search programmes">
          <SearchIcon />
        </GlassButton>
      ))}
    </OnImage>
  ),
};

/**
 * `refraction`: the rim bends the backdrop like the edge of a lens. Look at
 * the button edges over the photograph's horizon. **Chromium only**; in
 * Safari and Firefox this story shows the same glass without the bend.
 */
export const Refraction: Story = {
  parameters: { controls: { disable: true } },
  render: (_args, { globals }) => (
    <Stack>
      <Label>refraction off · on</Label>
      <OnImage brand={brandOf(globals)}>
        <GlassButton size="lg">
          Watch the trailer
        </GlassButton>
        <GlassButton size="lg" refraction>
          Watch the trailer
        </GlassButton>
      </OnImage>
      <OverContent>
        <GlassButton size="lg">
          Save draft
        </GlassButton>
        <GlassButton size="lg" refraction>
          Save draft
        </GlassButton>
      </OverContent>
    </Stack>
  ),
};

/** Loading, disabled and shine: Button's own behaviour, on glass. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (_args, { globals }) => (
    <OnImage brand={brandOf(globals)}>
      <GlassButton loading loadingText="Submitting…">
        Apply now
      </GlassButton>
      <GlassButton loading>Watch the trailer</GlassButton>
      <GlassButton disabled>Watch the trailer</GlassButton>
      <GlassButton shine>
        Start learning
      </GlassButton>
    </OnImage>
  ),
};
