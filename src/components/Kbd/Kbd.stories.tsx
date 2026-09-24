import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Kbd, KbdGroup } from './Kbd';
import { KbdMod } from './KbdMod';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A literal key the user should press — only real keystrokes, never a technical-looking label,',
          'never a value to copy (that is Code). A combination is `KbdGroup` (a `<kbd>` of `<kbd>`s,',
          '`+` added for you). The platform modifier is `KbdMod`, a client leaf: `⌘` on Apple, `Ctrl`',
          'elsewhere, `Ctrl` on the server so hydration matches.',
        ].join('\n'),
      },
    },
  },
  args: { children: 'K' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SingleKeys: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      {(
        [
          ['command', '⌘'],
          ['shift', '⇧'],
          ['enter', '↵'],
          ['escape', 'Esc'],
          ['letter', 'K'],
          ['word key', 'Tab'],
          ['arrow', '↓'],
        ] as const
      ).map(([label, key]) => (
        <Spec key={label} label={label}>
          <Kbd>{key}</Kbd>
        </Spec>
      ))}
    </Row>
  ),
};

export const Combinations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="command palette">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Spec>
      <Spec label="submit assignment">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>↵</Kbd>
        </KbdGroup>
      </Spec>
      <Spec label="jump to roster · three keys">
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>R</Kbd>
        </KbdGroup>
      </Spec>
      <Spec label="dismiss">
        <Kbd>Esc</Kbd>
      </Spec>
    </Row>
  ),
};

export const InASentence: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label="inline in body copy" wide>
      <Text tone="secondary">
        Press{' '}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>{' '}
        anywhere in the student portal to open the command palette, <Kbd>↵</Kbd> to run the highlighted result,
        and <Kbd>Esc</Kbd> to dismiss it. Hold <Kbd>⇧</Kbd> while choosing a module to open it in a new tab, or
        press{' '}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>R</Kbd>
        </KbdGroup>{' '}
        to jump straight to the Cohort 7 roster.
      </Text>
    </Spec>
  ),
};

/** `KbdMod` detects the platform after mount; `platform` pins it (here, both shown). */
export const PlatformModifier: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="detected on this machine">
        <KbdGroup>
          <KbdMod />
          <Kbd>K</Kbd>
        </KbdGroup>
      </Spec>
      <Spec label="platform=mac">
        <KbdGroup>
          <KbdMod platform="mac" />
          <KbdMod platform="mac" modifier="alt" />
          <Kbd>S</Kbd>
        </KbdGroup>
      </Spec>
      <Spec label="platform=other">
        <KbdGroup>
          <KbdMod platform="other" />
          <KbdMod platform="other" modifier="alt" />
          <Kbd>S</Kbd>
        </KbdGroup>
      </Spec>
    </Row>
  ),
};
