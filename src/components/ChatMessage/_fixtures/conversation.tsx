import * as React from 'react';

import { Avatar, AvatarFallback } from '../../Avatar';
import { Code } from '../../Code';
import { MenuItem, MenuSeparator } from '../../Menu';
import { Text } from '../../Text';
import { ChatReasoning } from '../../ThinkingIndicator/ChatReasoning';
import { ThinkingIndicator } from '../../ThinkingIndicator/ThinkingIndicator';
import { ChatMessage } from '../ChatMessage';
import { ChatMessageActions } from '../ChatMessageActions';
import { ChatMessageList, type ChatMessageListProps } from '../ChatMessageList';
import { ChatMessageMetadata } from '../ChatMessageMetadata';
import { ChatSystemMessage } from '../ChatSystemMessage';

/* Story-only fixture, never exported: a student, the AI tutor and a mentor on
   a DSA assignment (binary search, the off-by-one). "Now" is fixed so the day
   separators read Yesterday / Today in every run. */

export const NOW = '2026-09-27T21:10:00+05:30';
export const YESTERDAY = (hm: string) => `2026-09-26T${hm}:00+05:30`;
export const TODAY = (hm: string) => `2026-09-27T${hm}:00+05:30`;

export const ANSWER_TEXT = [
  'Your loop condition is the off-by-one. With `hi = len(arr)` the search range is half-open, [lo, hi), so the loop must be `while lo < hi`.',
  'With `lo <= hi`, the last pass reads `arr[hi]`, one past the end, and when the target is larger than every element `mid` never moves.',
  'Either keep `hi = len(arr)` and use `lo < hi` with `hi = mid`, or use `hi = len(arr) - 1` with `lo <= hi` and `hi = mid - 1`. Pick one convention and keep all three lines consistent.',
].join('\n\n');

export function Answer() {
  return (
    <div className="flex flex-col gap-3">
      <Text>
        Your loop condition is the off-by-one. With <Code>hi = len(arr)</Code> the search range is
        half-open, [lo, hi), so the loop must be <Code>while lo &lt; hi</Code>.
      </Text>
      <Text>
        With <Code>lo &lt;= hi</Code>, the last pass reads <Code>arr[hi]</Code>, one past the end, and
        when the target is larger than every element <Code>mid</Code> never moves.
      </Text>
      <Text>
        Either keep <Code>hi = len(arr)</Code> and use <Code>lo &lt; hi</Code> with{' '}
        <Code>hi = mid</Code>, or use <Code>hi = len(arr) - 1</Code> with <Code>lo &lt;= hi</Code> and{' '}
        <Code>hi = mid - 1</Code>. Pick one convention and keep all three lines consistent.
      </Text>
    </div>
  );
}

export const moreMenu = (
  <>
    <MenuItem>Explain more simply</MenuItem>
    <MenuItem>Show a worked example</MenuItem>
    <MenuSeparator />
    <MenuItem>Report a problem</MenuItem>
  </>
);

export function AnswerActions(props: Partial<React.ComponentProps<typeof ChatMessageActions>>) {
  const [rating, setRating] = React.useState<'' | 'up' | 'down'>('');
  return (
    <ChatMessageActions
      copyValue={ANSWER_TEXT}
      onRegenerate={() => undefined}
      feedback={rating}
      onFeedbackChange={setRating}
      menu={moreMenu}
      {...props}
    />
  );
}

export const mentorAvatar = (
  <Avatar size="sm">
    <AvatarFallback>PS</AvatarFallback>
  </Avatar>
);

/** The whole thread: yesterday's question and answer, today's group chat. */
export function Conversation(props: Partial<ChatMessageListProps> & { thinking?: boolean }) {
  const { thinking = false, ...rest } = props;
  return (
    <ChatMessageList aria-label="Conversation with Scaler Tutor" daySeparators now={NOW} {...rest}>
      <ChatMessage from="user" time={YESTERDAY('22:41')}>
        My binary search for Assignment 4 passes the samples but times out on hidden test 7.
      </ChatMessage>
      <ChatMessage from="user" time={YESTERDAY('22:41')}>
        I use <Code>lo = 0</Code>, <Code>hi = len(arr)</Code> and <Code>while lo &lt;= hi</Code>.
      </ChatMessage>
      <ChatMessage from="user" time={YESTERDAY('22:42')}>
        Is it the loop condition?
      </ChatMessage>
      <ChatMessage
        from="assistant"
        name="Scaler Tutor"
        time={YESTERDAY('22:42')}
        metadata={<ChatMessageMetadata time={YESTERDAY('22:42')} model="Scaler Tutor" />}
        actions={<AnswerActions />}
      >
        <Answer />
      </ChatMessage>
      <ChatSystemMessage time={TODAY('09:14')}>Mentor Priya Sharma joined the conversation</ChatSystemMessage>
      <ChatMessage from="other" name="Priya Sharma · Mentor" avatar={mentorAvatar} time={TODAY('09:15')}>
        The tutor is right. Draw the range on paper for a 3-element array before you submit again.
      </ChatMessage>
      <ChatMessage from="other" name="Priya Sharma · Mentor" avatar={mentorAvatar} time={TODAY('09:16')}>
        And add the target-larger-than-everything case to your own tests.
      </ChatMessage>
      <ChatMessage from="user" time={TODAY('09:20')} metadata={<ChatMessageMetadata time={TODAY('09:20')} delivery="read" />}>
        Switched to <Code>lo &lt; hi</Code> and <Code>hi = mid</Code>. All 12 tests pass now, thanks both!
      </ChatMessage>
      <ChatMessage from="user" time={TODAY('09:21')} status="failed" onRetry={() => undefined}>
        Can you check my complexity analysis too?
      </ChatMessage>
      {thinking ? (
        <ThinkingIndicator />
      ) : (
        <ChatMessage from="assistant" name="Scaler Tutor" time={TODAY('09:22')} actions={<AnswerActions />}>
          <ChatReasoning duration={12} className="mb-3">
            The student fixed the loop. The complexity question is about the halving: each pass
            removes half of the remaining range, so the number of passes is the number of times n
            can be halved before it reaches 1.
          </ChatReasoning>
          <Text>
            O(log n) time and O(1) space: every pass halves the range, and you keep only three
            integers.
          </Text>
        </ChatMessage>
      )}
    </ChatMessageList>
  );
}
