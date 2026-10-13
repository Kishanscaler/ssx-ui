import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProfilePlate } from './ProfilePlate';
import { AVATAR } from '../StatCard/_fixtures/stats';
import { LOGOS, PHOTO, PHOTO_PALE } from '../PhotoFrame/_fixtures/marketing';
import { PhotoFrame } from '../PhotoFrame';
import { Text } from '../Text';

const meta = {
  title: 'Marketing/ProfilePlate',
  component: ProfilePlate,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Who said it: the **name**, a **credential**, and the companies behind them (**logos**, after an optional',
          '`logosPrefix` such as "Ex-"), with an optional 32px round **avatar**, on a `GlassPlate`: `light` on a dark',
          'scene, `dark` on a pale one; white type in both themes. One row from `sm`, the logos behind a hairline;',
          'below `sm` the logos take a row of their own. It hugs its content up to the cell\'s width.',
          '',
          'Markers: `data-slot="profile-plate[-avatar|-name|-credential|-logos]"`, `data-part="title | subline |',
          'logos"`.',
        ].join('\n'),
      },
    },
  },
  args: {
    name: 'Anupam Mittal',
    credential: 'Founder, Shaadi.com · Shark on Shark Tank India',
    logos: LOGOS.slice(0, 2),
    tone: 'light',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['light', 'dark'] },
    as: { control: 'inline-radio', options: ['div', 'aside', 'figure'] },
    logos: { control: false },
  },
  render: (args) => (
    <PhotoFrame
      src={args.tone === 'dark' ? PHOTO_PALE : PHOTO}
      ratio="fill"
      scrim={false}
      style={{ padding: 'var(--space-6)', minHeight: 'var(--size-panel-xs, 14rem)' }}
    >
      <ProfilePlate {...args} />
    </PhotoFrame>
  ),
} satisfies Meta<typeof ProfilePlate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Light glass on a dark scene: name, credential, two logos. */
export const Light: Story = {};

/** `tone="dark"` on a pale photo: the fixed dark plate. */
export const Dark: Story = {
  args: { tone: 'dark' },
};

/** With a photo of the person. */
export const WithAvatar: Story = {
  args: { avatar: AVATAR },
};

/** `logosPrefix="Ex-"`: where they were, read with the logos. */
export const ExPrefix: Story = {
  args: {
    name: 'Ankur Warikoo',
    credential: 'Founder, nearbuy · author and investor',
    logosPrefix: 'Ex-',
    logos: [LOGOS[1]!, LOGOS[4]!],
    avatar: AVATAR,
  },
};

/** Every optional slot omitted: the name alone. */
export const NameOnly: Story = {
  args: { credential: undefined, logos: undefined },
};

/** No logos: name and credential, no rule. */
export const WithoutLogos: Story = {
  args: { logos: undefined, avatar: AVATAR },
};

/** Under a statement on a scrimmed photo, as the testimonial band sets it: `as="aside"`, the attribution. */
export const UnderAStatement: Story = {
  args: { avatar: AVATAR, as: 'aside' },
  render: (args) => (
    <PhotoFrame src={PHOTO} ratio="fill" scrim style={{ padding: 'var(--space-6)', minHeight: 'var(--size-panel-xs, 20rem)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 640 }}>
        <Text size="lg">
          “In July 2026, Anupam Mittal offered to invest ₹50 lakh in a student’s snack brand.”
        </Text>
        <ProfilePlate {...args} />
      </div>
    </PhotoFrame>
  ),
};
