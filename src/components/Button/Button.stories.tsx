import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
      description: 'Busy. Shows a `<Spinner>`, reports `aria-busy`, blocks clicks.',
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
  <p
    style={{
      margin: 0,
      font: 'var(--type-eyebrow-weight) var(--type-eyebrow-size)/var(--type-eyebrow-lh) var(--font-family-sans)',
      letterSpacing: 'var(--type-eyebrow-tracking)',
      textTransform: 'uppercase',
      color: 'var(--content-secondary)',
    }}
  >
    {children}
  </p>
);

/* ---------- stories -------------------------------------------------------- */

/** Every prop, live. Start here. */
export const Playground: Story = {};

/** The five meanings, side by side. This is the story to look at in both brands. */
export const Variants: Story = {
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
