import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatMessage } from '../ChatMessage/ChatMessage';
import { ChatMessageList } from '../ChatMessage/ChatMessageList';
import { Answer, AnswerActions } from '../ChatMessage/_fixtures/conversation';
import { Text } from '../Text';
import { ChatReasoning } from './ChatReasoning';
import { ThinkingIndicator } from './ThinkingIndicator';

const meta = {
  title: 'AI/ThinkingIndicator',
  component: ThinkingIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The assistant is working: the brand monogram drawing itself beside "Thinking…", with a band of',
          'the primary ink crossing the secondary ink of the words (never below the secondary contrast).',
          'Static under reduced motion. Announced once through the package\'s shared polite live region; the',
          'element itself is not a live region.',
          '',
          '`ChatReasoning` is the collapsed "Thought for 12s" disclosure that holds the reasoning, in the',
          'secondary ink. Collapsed by default; `thinking` shows the shimmer in its header while it streams.',
        ].join('\n'),
      },
    },
  },
  args: { label: 'Thinking…', shimmer: true, showSpinner: true },
} satisfies Meta<typeof ThinkingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: 'Reading your submission…' },
};

export const NoShimmer: Story = {
  args: { shimmer: false },
};

/** Thinking, then the answer with its reasoning folded above it. */
export const ThinkingThenReasoning: Story = {
  render: (args) => {
    const [done, setDone] = React.useState(false);
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="self-start type-caption text-content-link underline"
          onClick={() => setDone((d) => !d)}
        >
          {done ? 'Show thinking' : 'Show answer'}
        </button>
        <ChatMessageList aria-label="Conversation with Scaler Tutor">
          <ChatMessage from="user">Why does my binary search time out on hidden test 7?</ChatMessage>
          {done ? (
            <ChatMessage from="assistant" name="Scaler Tutor" actions={<AnswerActions />}>
              <ChatReasoning duration={12} className="mb-3">
                The student uses hi = len(arr) with lo &lt;= hi. That mixes a half-open range with a
                closed-range loop, so the last pass reads past the end and mid stops moving when the
                target is larger than every element.
              </ChatReasoning>
              <Answer />
            </ChatMessage>
          ) : (
            <ThinkingIndicator {...args} />
          )}
        </ChatMessageList>
      </div>
    );
  },
};

/** The disclosure alone: collapsed (default), open, and still streaming. */
export const Reasoning: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <ChatReasoning duration={12}>
        Each pass removes half of the remaining range, so the number of passes is the number of
        times n can be halved before it reaches 1.
      </ChatReasoning>
      <ChatReasoning duration={74} defaultOpen>
        <Text size="sm" tone="secondary">
          Each pass removes half of the remaining range, so the number of passes is the number of
          times n can be halved before it reaches 1: log2(n), rounded up.
        </Text>
      </ChatReasoning>
      <ChatReasoning thinking>Checking the loop invariant…</ChatReasoning>
    </div>
  ),
};
