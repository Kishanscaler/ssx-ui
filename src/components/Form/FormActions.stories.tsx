import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import { FormActions } from './FormActions';

const meta = {
  title: 'Molecules/FormActions',
  component: FormActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The submit / cancel row. The safe answer first, the committing action last, in the markup and on',
          'screen (the DialogFooter rule). Right-aligned from `sm`; on a phone stacked full width with the primary',
          'at the bottom, so the visual order is the tab order. `sticky` pins it to the bottom of the viewport or',
          'scroll container, with a top hairline and the safe-area inset, side by side on phones.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    sticky: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
  },
} satisfies Meta<typeof FormActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const Buttons = () => (
  <>
    <Button variant="secondary">Save draft</Button>
    <Button type="submit">Submit application</Button>
  </>
);

/** Resize to under 672px to see the stack. */
export const Default: Story = {
  args: { sticky: false },
  render: (args) => (
    <div style={{ maxWidth: 720 }}>
      <FormActions {...args}>
        <Buttons />
      </FormActions>
    </div>
  ),
};

/** One action. */
export const SingleAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <FormActions>
      <Button type="submit">Pay ₹1,500</Button>
    </FormActions>
  ),
};

/** Pinned inside a scroll container while its content scrolls under it. */
export const Sticky: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    // A padded scroll container, like a SideDrawer body: it declares its
    // padding (the scroll-pad contract) so the bar sticks flush to its
    // visible bottom and sides.
    <div
      style={{
        height: 320,
        overflow: 'auto',
        border: '1px solid var(--border-decorative)',
        padding: 20,
        ['--scroll-pad-x' as string]: '20px',
        ['--scroll-pad-bottom' as string]: '20px',
      }}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <p key={i} className="type-body text-content">
          Section {i + 1}. Tell us about a project you shipped and what you would do differently.
        </p>
      ))}
      <FormActions sticky>
        <Buttons />
      </FormActions>
    </div>
  ),
};
