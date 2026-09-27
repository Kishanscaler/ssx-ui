import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { Text } from '../Text';
import { VisuallyHidden } from './VisuallyHidden';

const meta = {
  title: 'Atoms/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Content for assistive technology only (`sr-only`): read by a screen reader, drawn nowhere.',
          'For the words a sighted reader gets from the layout. An icon-only control is named with',
          '`aria-label` instead; hiding from everyone is `hidden`; hiding decoration is `aria-hidden`.',
          '`asChild` keeps your element (a heading, a label); `focusable` is the skip-link pattern.',
        ].join(' '),
      },
    },
  },
  args: { children: 'Stop generating' },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing is drawn; inspect the tree or use a screen reader. The text sits inside the paragraph. */
export const Default: Story = {
  render: (args) => (
    <Text>
      Your tutor replied.
      <VisuallyHidden {...args}> The reply covers binary search on a rotated array.</VisuallyHidden>
    </Text>
  ),
};

/** A heading for a region whose purpose is obvious on screen, so screen-reader users can jump to it. */
export const AsHeading: Story = {
  render: () => (
    <section aria-labelledby="chat-heading">
      <VisuallyHidden asChild>
        <h2 id="chat-heading">Conversation with the DSA tutor</h2>
      </VisuallyHidden>
      <Text>How do I find the pivot in a rotated sorted array?</Text>
    </section>
  ),
};

/** Tab into the frame: the skip link appears while it has focus. */
export const SkipLink: Story = {
  render: () => (
    <div>
      <VisuallyHidden focusable>
        <a href="#composer" className="type-body-sm text-content-link">
          Skip to the message box
        </a>
      </VisuallyHidden>
      <Button variant="secondary">New chat</Button>
    </div>
  ),
};
