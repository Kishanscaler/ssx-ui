import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code } from '../Code';
import { Text } from '../Text';
import { ChatMessage } from './ChatMessage';
import { ChatMessageActions } from './ChatMessageActions';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatMessageMetadata } from './ChatMessageMetadata';
import { Answer, AnswerActions, TODAY, mentorAvatar, moreMenu } from './_fixtures/conversation';

const meta = {
  title: 'AI/ChatMessage',
  component: ChatMessage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'One message from one sender. `from="user"` is the student, end-aligned in a neutral bubble',
          '(`surface-subtle` + `content-primary`, the gated "body text on a subtle region" pair, with a',
          '`border-decorative` hairline). `from="assistant"` is the tutor: start-aligned prose at the 72ch',
          'measure, **no bubble**, the brand monogram as its avatar. `from="other"` is another person (a',
          'mentor) in a start-aligned bubble with avatar and name.',
          '',
          'Slots: `avatar`, `name`, children (any ReactNode, Markdown included), `metadata`, `actions`.',
          '`status="failed"` adds "Not sent" with Retry (`onRetry`). The message is a size container, so',
          'the bubble width and the assistant avatar follow the width it is given, not the viewport.',
        ].join('\n'),
      },
    },
  },
  args: { from: 'user', group: 'single', status: 'sent' },
  argTypes: {
    from: { control: 'inline-radio', options: ['user', 'assistant', 'other'] },
    group: { control: 'inline-radio', options: ['single', 'first', 'middle', 'last'] },
    status: { control: 'inline-radio', options: ['sending', 'sent', 'failed'] },
    avatar: { control: false },
    metadata: { control: false },
    actions: { control: false },
  },
  render: (args) => (
    <ChatMessage {...args} time={TODAY('22:41')}>
      Why does my binary search loop forever when the target is bigger than every element?
    </ChatMessage>
  ),
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The student: end-aligned, neutral bubble, time underneath. */
export const User: Story = {};

/** The tutor: prose at the measure, no bubble, the monogram, and the action row (hover it; always shown on touch). */
export const AssistantWithActions: Story = {
  render: () => (
    <ChatMessage
      from="assistant"
      name="Scaler Tutor"
      metadata={<ChatMessageMetadata time={TODAY('22:42')} model="Scaler Tutor" />}
      actions={<AnswerActions />}
    >
      <Answer />
    </ChatMessage>
  ),
};

/** The same row with `visibility="always"`, as for the latest reply. */
export const ActionsAlwaysVisible: Story = {
  render: () => (
    <ChatMessage
      from="assistant"
      actions={
        <ChatMessageActions
          visibility="always"
          copyValue="O(log n) time and O(1) space"
          onRegenerate={() => undefined}
          defaultFeedback="up"
          menu={moreMenu}
        />
      }
    >
      <Text>O(log n) time and O(1) space: every pass halves the range.</Text>
    </ChatMessage>
  ),
};

/** A multi-bubble turn: three messages, `group` first / middle / last (ChatMessageList does this for you). */
export const MultiBubbleTurn: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <ChatMessage from="user" group="first">
        My binary search for Assignment 4 passes the samples but times out on hidden test 7.
      </ChatMessage>
      <ChatMessage from="user" group="middle">
        I use <Code>lo = 0</Code>, <Code>hi = len(arr)</Code> and <Code>while lo &lt;= hi</Code>.
      </ChatMessage>
      <ChatMessage from="user" group="last" time={TODAY('22:42')}>
        Is it the loop condition?
      </ChatMessage>
    </div>
  ),
};

/** A failed send: "Not sent" in the danger ink, with Retry. */
export const FailedSend: Story = {
  args: { status: 'failed', onRetry: () => undefined },
};

/** Still sending: busy, "Sending…" in the metadata. */
export const Sending: Story = {
  args: { status: 'sending' },
};

/** A mentor in a group chat: start-aligned bubble, avatar and name. */
export const Mentor: Story = {
  render: () => (
    <ChatMessage from="other" name="Priya Sharma · Mentor" avatar={mentorAvatar} time={TODAY('09:15')}>
      Draw the range on paper for a 3-element array before you submit again.
    </ChatMessage>
  ),
};

/** Delivery states and model name in the metadata row. */
export const Metadata: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ChatMessageMetadata time={TODAY('22:41')} delivery="sending" />
      <ChatMessageMetadata time={TODAY('22:41')} delivery="sent" />
      <ChatMessageMetadata time={TODAY('22:41')} delivery="read" />
      <ChatMessageMetadata time={TODAY('22:41')} delivery="failed" />
      <ChatMessageMetadata time={TODAY('22:42')} model="Scaler Tutor" />
    </div>
  ),
};

/** The bubble on its own, grouped on both sides. */
export const Bubbles: Story = {
  render: () => (
    <div className="grid gap-6 sm:grid-cols-2">
      {(['end', 'start'] as const).map((side) => (
        <div key={side} className={side === 'end' ? 'flex flex-col items-end gap-1' : 'flex flex-col items-start gap-1'}>
          {(['single', 'first', 'middle', 'last'] as const).map((group) => (
            <ChatMessageBubble key={group} side={side} group={group}>
              {`${side} · ${group}`}
            </ChatMessageBubble>
          ))}
        </div>
      ))}
    </div>
  ),
};

/** The action row alone, every control. */
export const Actions: Story = {
  render: () => (
    <ChatMessageActions
      visibility="always"
      copyValue="O(log n)"
      onRegenerate={() => undefined}
      menu={moreMenu}
    />
  ),
};
