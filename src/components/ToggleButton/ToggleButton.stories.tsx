import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ToggleButton, type ToggleButtonSize } from './ToggleButton';

/* Story fixtures only: a bookmark in regular and fill weight (Phosphor's shape).
   Consumers bring their own from @phosphor-icons/react. */
const BookmarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z" />
  </svg>
);
const BookmarkFillIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Z" />
  </svg>
);

const meta = {
  title: 'Atoms/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A button that stays in: a **state** (bookmarked, pinned), not an action. `aria-pressed`',
          'is the only thing driving the pressed look.',
          '',
          'ON is a filled button with an inset top edge — deliberately unlike a selected Chip or a',
          'Segmented Control item. Disabled + pressed keeps its on-ness and dims.',
          '',
          '`icon` / `pressedIcon` swap regular → fill with the state. Icon-only needs an',
          '`aria-label` naming the thing toggled. "One pressed at a time" is ToggleGroup (a molecule).',
        ].join('\n'),
      },
    },
  },
  args: {
    children: 'Bookmark',
    icon: <BookmarkIcon />,
    pressedIcon: <BookmarkFillIcon />,
  },
  argTypes: {
    icon: { control: false },
    pressedIcon: { control: false },
    // `pressed` is a real prop (Radix Toggle), unlike hover and active, which
    // are CSS states. Controlled from here so the Docs page can show both looks.
    pressed: { control: 'boolean' },
    defaultPressed: { control: 'boolean' },
    onPressedChange: { control: false },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg', 'icon-sm', 'icon-md', 'icon-lg'] satisfies ToggleButtonSize[],
    },
  },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const Spec = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-content-secondary">{label}</span>
    {children}
  </div>
);

const icons = { icon: <BookmarkIcon />, pressedIcon: <BookmarkFillIcon /> };

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="unpressed">
        <ToggleButton {...icons}>Bookmark</ToggleButton>
      </Spec>
      <Spec label="pressed">
        <ToggleButton {...icons} defaultPressed>
          Bookmarked
        </ToggleButton>
      </Spec>
      <Spec label="disabled · unpressed">
        <ToggleButton {...icons} disabled>
          Bookmark
        </ToggleButton>
      </Spec>
      <Spec label="disabled · pressed">
        <ToggleButton {...icons} disabled defaultPressed>
          Bookmarked
        </ToggleButton>
      </Spec>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-4">
          <ToggleButton {...icons} size={size}>Bookmark</ToggleButton>
          <ToggleButton {...icons} size={size} defaultPressed>Bookmarked</ToggleButton>
        </div>
      ))}
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <Spec label="unpressed · aria-label">
        <ToggleButton {...icons} size="icon-md" aria-label="Bookmark Data Structures & Algorithms — Week 6" />
      </Spec>
      <Spec label="pressed · aria-label">
        <ToggleButton {...icons} size="icon-md" defaultPressed aria-label="Bookmark Data Structures & Algorithms — Week 6" />
      </Spec>
      <Spec label="icon-sm / icon-md / icon-lg">
        <div className="flex items-center gap-3">
          <ToggleButton {...icons} size="icon-sm" aria-label="Bookmark Week 6 (sm)" />
          <ToggleButton {...icons} size="icon-md" defaultPressed aria-label="Bookmark Week 6 (md)" />
          <ToggleButton {...icons} size="icon-lg" aria-label="Bookmark Week 6 (lg)" />
        </div>
      </Spec>
    </div>
  ),
};

/** Controlled: the label follows the state as well as the icon. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [pressed, setPressed] = React.useState(false);
    return (
      <ToggleButton {...icons} pressed={pressed} onPressedChange={setPressed}>
        {pressed ? 'Bookmarked' : 'Bookmark'}
      </ToggleButton>
    );
  },
};

export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid gap-4">
      {[false, true].map((pressed) => (
        <div key={String(pressed)} className="flex flex-wrap items-center gap-4">
          <ToggleButton {...icons} defaultPressed={pressed}>{pressed ? 'Bookmarked' : 'Bookmark'}</ToggleButton>
          <ToggleButton {...icons} defaultPressed={pressed} disabled>{pressed ? 'Bookmarked' : 'Bookmark'}</ToggleButton>
          <ToggleButton {...icons} defaultPressed={pressed} size="icon-md" aria-label={`Bookmark (${pressed ? 'on' : 'off'})`} />
        </div>
      ))}
    </div>
  ),
};
