import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatMessage } from './ChatMessage';
import { ChatMessageList } from './ChatMessageList';
import { ChatDaySeparator, ChatSystemMessage } from './ChatSystemMessage';
import { Conversation, NOW, TODAY, YESTERDAY } from './_fixtures/conversation';

const meta = {
  title: 'AI/ChatMessageList',
  component: ChatMessageList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The conversation: `role="log"` with a name, consecutive messages from one sender grouped',
          'automatically (corners squared, 4px apart, avatar and name once), day separators from each',
          "message's `time` (`daySeparators`; Today / Yesterday when `now` is given), and `ChatSystemMessage`",
          'lines. Density follows the list\'s own width: 16px between turns below 36rem, 24px from there.',
          'It does not scroll and has no padding; the layout that holds it does both.',
        ].join('\n'),
      },
    },
  },
  args: { density: 'auto', grouping: 'auto', daySeparators: true },
  argTypes: {
    density: { control: 'inline-radio', options: ['auto', 'compact', 'comfortable'] },
    grouping: { control: 'inline-radio', options: ['auto', 'none'] },
    daySeparators: { control: 'boolean' },
  },
  render: (args) => <Conversation {...args} />,
} satisfies Meta<typeof ChatMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full width: the whole thread. The prose stops at the measure; the bubbles at 75% of the row. */
export const FullWidth: Story = {};

const Frame = ({ width, label, children }: { width: string; label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <span className="type-caption text-content-secondary">{label}</span>
    <div
      style={{ width }}
      className="max-w-full rounded-xl border border-border-decorative bg-surface p-4"
    >
      {children}
    </div>
  </div>
);

/** A ~360px panel: tight turns, bubbles at 85%, the assistant avatar steps aside. */
export const Panel360: Story = {
  render: (args) => (
    <Frame width="22.5rem" label="360px panel">
      <Conversation {...args} />
    </Frame>
  ),
};

/** A ~480px side panel (a SideDrawer's width). */
export const SidePanel480: Story = {
  render: (args) => (
    <Frame width="30rem" label="480px side panel">
      <Conversation {...args} />
    </Frame>
  ),
};

/** The thread while the tutor is still working: a ThinkingIndicator as the last child. */
export const Thinking: Story = {
  render: (args) => <Conversation {...args} thinking />,
};

/** Separators and system lines placed by hand, grouping off. */
export const ManualSeparators: Story = {
  args: { grouping: 'none', daySeparators: false },
  render: (args) => (
    <ChatMessageList {...args} aria-label="Conversation">
      <ChatDaySeparator date={YESTERDAY('22:40')} now={NOW} />
      <ChatMessage from="user">First message</ChatMessage>
      <ChatMessage from="user">Second message, not grouped</ChatMessage>
      <ChatSystemMessage>Conversation reset</ChatSystemMessage>
      <ChatDaySeparator date={TODAY('09:00')} now={NOW} />
      <ChatMessage from="assistant">A fresh start.</ChatMessage>
    </ChatMessageList>
  ),
};
