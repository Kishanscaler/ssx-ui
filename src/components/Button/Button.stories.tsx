import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Spinner } from '../Spinner';
import { LogoLoader } from '../Logo';
import { Button, type ButtonVariant, type ButtonSize } from './Button';
import {
  ArrowRightIcon,
  DownloadIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from './_fixtures/icons';

const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
  'neutral',
];
const TEXT_SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const ICON_SIZES: ButtonSize[] = ['icon-sm', 'icon-md', 'icon-lg'];

const meta = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The variants **are** the meaning. `primary` is the one thing this screen is for,',
          '`secondary` is the alternative, `tertiary` is a ghost action, `danger` destroys',
          'something, and `neutral` dismisses or clears.',
          '',
          'There is no `outline` or `ghost` alias. Two names for one meaning is how a system',
          'starts drifting.',
          '',
          'The API follows shadcn/ui: icons are **children**, not props; a square button is a',
          '`size` (`icon-sm` / `icon-md` / `icon-lg`), not a boolean; full width is',
          '`className="w-full"`. Everything else on the props table below comes free from',
          '`React.ComponentProps<"button">`.',
          '',
          'Use the **brand** and **theme** toolbar controls above to check any story across',
          'all four combinations — SST/SSB x light/dark. Every colour here is a semantic',
          'token, so nothing in this file changes when the toggles do.',
        ].join('\n'),
      },
    },
  },
  args: {
    children: 'Apply now',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: VARIANTS,
      table: { defaultValue: { summary: 'primary' } },
      description: 'What the button means, not what it looks like.',
    },
    size: {
      control: 'inline-radio',
      options: [...TEXT_SIZES, ...ICON_SIZES],
      table: { defaultValue: { summary: 'md' } },
      description:
        'Control height: 32 / 40 / 48px, from `--size-control-*`. The `icon-*` sizes are square.',
    },
    loading: {
      control: 'boolean',
      description:
        'Busy. Shows a `<Spinner>`, reports `aria-busy`, shows `cursor: progress`, blocks clicks, and announces the wait once through a polite live region.',
    },
    loadingText: {
      control: 'text',
      description:
        'The visible label while `loading` ("Submitting…"). Unset, the label stays as it is. Name the action — a generic "Loading…" loses the context and changes the width. The original label keeps holding the width, so the button never narrows.',
    },
    loadingAnnouncement: {
      control: 'text',
      table: { defaultValue: { summary: "loadingText ?? 'Loading'" } },
      description:
        'What a screen reader hears, once, when `loading` turns on. `null` opts out (when the surrounding UI announces the wait itself).',
    },
    shine: {
      control: 'boolean',
      description:
        'A specular sweep across the fill. A modifier, not a variant — refused on `danger`, while loading, while disabled, and under reduced motion.',
    },
    disabled: { control: 'boolean' },
    asChild: { control: false },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- layout helpers for the matrix stories ------------------------- */

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
    {children}
  </div>
);

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="m-0 font-sans type-eyebrow text-content-secondary">
    {children}
  </p>
);

/* ---------- stories -------------------------------------------------------- */

/** Every prop, live. Start here. */
export const Playground: Story = {};

/** The five meanings, side by side. This is the story to look at in both brands. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Row>
      <Button variant="primary">Apply now</Button>
      <Button variant="secondary">Save draft</Button>
      <Button variant="tertiary">Download transcript</Button>
      <Button variant="danger">Withdraw application</Button>
      <Button variant="neutral">Dismiss</Button>
    </Row>
  ),
};

/** 32 / 40 / 48px. The label scales with the control; the icon does not. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Stack>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>{variant}</Label>
          <Row>
            {TEXT_SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                Apply now
              </Button>
            ))}
          </Row>
        </div>
      ))}
    </Stack>
  ),
};

/**
 * Icons are **children**, in the order you want them — there is no
 * `leadingIcon` / `trailingIcon` prop. The button still owns their size and the
 * gap, and tightens its own padding when an icon is present.
 */
export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Row>
      <Button variant="primary">
        <PlusIcon />
        Apply now
      </Button>
      <Button variant="secondary">
        Save draft
        <ArrowRightIcon />
      </Button>
      <Button variant="tertiary">
        <DownloadIcon />
        Download transcript
      </Button>
      <Button variant="danger">
        <TrashIcon />
        Withdraw application
      </Button>
    </Row>
  ),
};

/**
 * A square button is a **size**, not a boolean. `aria-label` is not optional —
 * an icon is not an accessible name, and Storybook's a11y addon will fail the
 * story if you leave it off.
 */
export const IconOnly: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Stack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>variants · icon-md</Label>
        <Row>
          <Button size="icon-md" variant="primary" aria-label="Add student to Cohort 7">
            <PlusIcon />
          </Button>
          <Button size="icon-md" variant="secondary" aria-label="Search students">
            <SearchIcon />
          </Button>
          <Button size="icon-md" variant="tertiary" aria-label="Download transcript">
            <DownloadIcon />
          </Button>
          <Button size="icon-md" variant="danger" aria-label="Delete submission">
            <TrashIcon />
          </Button>
          <Button size="icon-md" variant="neutral" aria-label="Dismiss notification">
            <PlusIcon style={{ transform: 'rotate(45deg)' }} />
          </Button>
        </Row>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>sizes · 32 / 40 / 48, icon 16 / 20 / 24</Label>
        <Row>
          {ICON_SIZES.map((size) => (
            <Button key={size} size={size} aria-label={`Add module (${size})`}>
              <PlusIcon />
            </Button>
          ))}
        </Row>
      </div>
    </Stack>
  ),
};

/**
 * Full width is `className="w-full"` — layout belongs to the parent, so there
 * is no `block` prop for it. This is the mobile admissions footer, and every
 * sticky bar in a narrow column.
 */
export const FullWidth: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Button className="w-full" variant="primary">
        Apply now — Batch of 2029 closes 30 Apr
      </Button>
      <Button className="w-full" variant="secondary">
        Save draft
      </Button>
    </div>
  ),
};

/**
 * `loading` renders a `<Spinner>` beside the label rather than replacing it, so
 * the control reports `aria-busy`, keeps focus and its accessible name, and
 * swallows clicks.
 *
 * Small sizes use the six-dot grid; bigger sizes use the monogram: `sm` and
 * `icon-sm` show the dots, `md`, `lg` and the larger icon sizes show the mark.
 */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Stack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>the spinner takes the variant&rsquo;s ink</Label>
        <Row>
          {VARIANTS.map((variant) => (
            <Button key={variant} loading variant={variant}>
              Apply now
            </Button>
          ))}
        </Row>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>sizes — sm and icon-sm: the six-dot grid · md and up: the monogram</Label>
        <Row>
          {TEXT_SIZES.map((size) => (
            <Button key={size} loading size={size}>
              Apply now
            </Button>
          ))}
          {ICON_SIZES.map((size) => (
            <Button key={size} loading size={size} aria-label="Adding module" />
          ))}
        </Row>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>sm, every variant — the dots take the variant&rsquo;s ink too</Label>
        <Row>
          {VARIANTS.map((variant) => (
            <Button key={variant} loading size="sm" variant={variant}>
              Save draft
            </Button>
          ))}
        </Row>
      </div>
    </Stack>
  ),
};

/**
 * `loadingText` swaps the visible label while `loading` — name the ACTION
 * ("Submitting…", "Saving draft…"), never a generic "Loading…", which throws
 * away the context the label carried and is a different width.
 *
 * Width: the original label stays in the layout, invisible and hidden from
 * assistive tech, in the same grid cell as the loading text, so the button
 * never gets narrower. (The loader adds its own 16px + gap, as it always has.)
 * While it shows, the loading text IS the accessible name — what is on screen.
 *
 * Press the first button: it loads for three seconds. A screen reader hears
 * "Submitting…" once, from the package's single polite live region; the
 * button's own name is not touched by the announcement.
 */
export const LoadingWithLoadingText: Story = {
  parameters: { controls: { disable: true } },
  name: 'Loading · with loadingText',
  args: { children: undefined },
  render: () => {
    const [busy, setBusy] = React.useState(false);
    React.useEffect(() => {
      if (!busy) return undefined;
      const t = setTimeout(() => setBusy(false), 3000);
      return () => clearTimeout(t);
    }, [busy]);
    return (
      <Stack>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>live — press it</Label>
          <Row>
            <Button loading={busy} loadingText="Submitting…" onClick={() => setBusy(true)}>
              Submit application
            </Button>
          </Row>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>at rest, then loading — the width holds</Label>
          {TEXT_SIZES.map((size) => (
            <Row key={size}>
              <Button size={size} loadingText="Saving…">
                Save draft
              </Button>
              <Button size={size} loading loadingText="Saving…">
                Save draft
              </Button>
              <Button size={size} variant="secondary" loading loadingText="Saving…">
                Save draft
              </Button>
            </Row>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>unset — the label stays, as it always has</Label>
          <Row>
            <Button loading>Submit application</Button>
          </Row>
        </div>
      </Stack>
    );
  },
};

/**
 * Under `prefers-reduced-motion: reduce` every loader holds a still frame that
 * is visibly UNFINISHED — never the finished mark, which reads as "done":
 * the six-dot grid with its leading dot lit; the 16px monogram (md/lg loading
 * buttons) half-inked over its ghost; the md+ mark with its contour traced and
 * its glyph half-traced.
 *
 * How this story shows it: Storybook has no built-in reduced-motion
 * emulation, and a media query cannot be switched on from script. So the
 * frame is wrapped in `data-motion="reduce"`, the package's own hook that
 * forces the same reduced-motion frame for every loader beneath it (it is in
 * `components.css` beside the media-query rules, and a test pins that the two
 * agree). To see the real media query, emulate it in DevTools: Rendering ›
 * "Emulate CSS media feature prefers-reduced-motion" › reduce — every other
 * story's loaders then freeze the same way.
 */
export const LoadingReducedMotion: Story = {
  parameters: { controls: { disable: true } },
  name: 'Loading · reduced motion',
  args: { children: undefined },
  render: () => (
    <div data-motion="reduce">
      <Stack>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>buttons — sm / icon-sm: dots · md, lg, icon-md, icon-lg: the monogram</Label>
          <Row>
            {TEXT_SIZES.map((size) => (
              <Button key={size} loading size={size}>
                Apply now
              </Button>
            ))}
            {ICON_SIZES.map((size) => (
              <Button key={size} loading size={size} aria-label="Adding module" />
            ))}
          </Row>
          <Row>
            {VARIANTS.map((variant) => (
              <Button key={variant} loading variant={variant}>
                Apply now
              </Button>
            ))}
          </Row>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>spinner sm / md / lg / xl · logo loader md / lg</Label>
          <Row>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
            <LogoLoader size="md" />
            <LogoLoader size="lg" />
          </Row>
        </div>
      </Stack>
    </div>
  ),
};

/**
 * `shine` is a MODIFIER, not a variant: a specular sweep that travels across
 * the fill and adds nothing to the button's meaning, so it stacks on any
 * variant without changing what it is. Most of the loop is the pause between
 * passes — a sweep that runs continuously stops reading as a highlight and
 * starts reading as a loading bar.
 *
 * It belongs to delight, and is suppressed everywhere delight would be wrong:
 * on `danger`, while `loading`, while disabled, and under
 * `prefers-reduced-motion`. All four suppressions live in `components.css`
 * beside the rule they override.
 */
export const Shine: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Stack>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>the sweep is keyed to the fill it crosses</Label>
        <Row>
          <Button shine size="lg">
            Apply now
          </Button>
          <Button shine variant="secondary" size="lg">
            Book a call
          </Button>
          <Button shine variant="tertiary" size="lg">
            See the syllabus
          </Button>
        </Row>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Label>where it is refused — nothing sweeps in this row</Label>
        <Row>
          <Button shine variant="danger">
            Withdraw application
          </Button>
          <Button shine loading>
            Submitting
          </Button>
          <Button shine disabled>
            Apply now
          </Button>
        </Row>
      </div>
    </Stack>
  ),
};

/** Disabled is a fill, not an opacity — fading also fades the surface behind it. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Row>
      {VARIANTS.map((variant) => (
        <Button key={variant} disabled variant={variant}>
          Apply now
        </Button>
      ))}
      <Button disabled size="icon-md" aria-label="Add module">
        <PlusIcon />
      </Button>
    </Row>
  ),
};

/**
 * `asChild` renders the child element with the button's styling and props, so a
 * link can look like a button without a duplicate `LinkButton` component that
 * would then drift from this one.
 */
export const AsLink: Story = {
  parameters: { controls: { disable: true } },
  args: { children: undefined },
  render: () => (
    <Row>
      <Button asChild variant="primary">
        <a href="#apply">Apply now</a>
      </Button>
      <Button asChild variant="tertiary">
        <a href="#programmes">
          See all programmes
          <ArrowRightIcon />
        </a>
      </Button>
    </Row>
  ),
};

/**
 * The full grid. This is the review artifact — flip brand and theme in the
 * toolbar and nothing in this story should need to change.
 */
export const Matrix: Story = {
  args: { children: undefined },
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      {VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>{variant}</Label>
          <Row>
            <Button variant={variant}>Rest</Button>
            <Button variant={variant}>
              <PlusIcon />
              Icon
            </Button>
            <Button variant={variant} loading>
              Loading
            </Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button
              variant={variant}
              size="icon-md"
              aria-label={`${variant} icon button`}
            >
              <PlusIcon />
            </Button>
          </Row>
        </div>
      ))}
    </Stack>
  ),
};
