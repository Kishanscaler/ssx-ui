import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import type { TimestampValue } from '../Timestamp';
import type { ChatMessageGroup } from './ChatMessageBubble';
import { ChatDaySeparator } from './ChatSystemMessage';
import { dayKey } from './format';

/* ---------------------------------------------------------------------------
 * ChatMessageList
 *
 * The conversation: every message, separator and system line, in order.
 *
 *   <ChatMessageList aria-label="Conversation with Scaler Tutor" daySeparators now={requestTime}>
 *     <ChatMessage from="user" time={t1}>…</ChatMessage>
 *     <ChatMessage from="user" time={t2}>…</ChatMessage>     grouped with the one above
 *     <ChatMessage from="assistant" time={t3}>…</ChatMessage>
 *     <ChatSystemMessage>Conversation reset</ChatSystemMessage>
 *   </ChatMessageList>
 *
 * `role="log"` with an accessible name (`aria-label`, default
 * "Conversation"): a log is a polite live region whose ADDITIONS are read, so
 * a new reply is announced without stealing focus.
 *
 * GROUPING (`grouping="auto"`, the default). Consecutive direct children that
 * are messages (any element with a `from` prop) from the same sender form a
 * run, and each gets `group` = first / middle / last (single when alone):
 * corners squared between bubbles, the gap tightened to 4px, the avatar and
 * name shown once. The sender is `sender` when given, else `from` plus a
 * string `name`. Anything else between them (a separator, a system line, a
 * ThinkingIndicator) ends the run. A message with its own `group` keeps it.
 * Children must be direct: a message inside a wrapper element is not seen.
 *
 * DAY SEPARATORS (`daySeparators`). Before the first child of each calendar
 * day (any child with a `time` prop: a message, or a ChatSystemMessage given
 * one; read in `timeZone`) a ChatDaySeparator is inserted: "Today" /
 * "Yesterday" when `now` is given, else the date. A day change also ends a
 * run. You can place ChatDaySeparators yourself instead.
 *
 * DENSITY follows the list's own width (it is a size container), not the
 * viewport: `auto` spaces turns 16px apart below a 36rem-wide list (a side
 * panel, a drawer) and 24px from there. `compact` / `comfortable` pin it.
 *
 * NOT A SCROLLER. The list has no overflow, no height and no padding: the
 * layout that holds it (ChatLayout) scrolls it and pads it. Its root is
 * `data-slot="chat-message-list"`.
 *
 * Server component: it reads its children's props, no hooks.
 * ------------------------------------------------------------------------- */

export const chatMessageListVariants = cva(
  [
    'flex w-full min-w-0 flex-col',
    'gap-(--chat-turn-gap) [--chat-group-gap:var(--space-1)]',
  ],
  {
    variants: {
      density: {
        auto: '[--chat-turn-gap:var(--space-4)] @min-region-md/chat-list:[--chat-turn-gap:var(--space-6)]',
        compact: '[--chat-turn-gap:var(--space-4)]',
        comfortable: '[--chat-turn-gap:var(--space-6)]',
      },
    },
    defaultVariants: { density: 'auto' },
  },
);

type ChatMessageListVariantProps = VariantProps<typeof chatMessageListVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type ChatMessageListDensity = NonNullable<ChatMessageListVariantProps['density']>;
export type ChatMessageListGrouping = 'auto' | 'none';

export type ChatMessageListProps = React.HTMLAttributes<HTMLDivElement> &
  ChatMessageListVariantProps & {
    /**
     * `auto`: 16px between turns below a 36rem-wide list, 24px from there.
     * `compact` 16px, `comfortable` 24px, at any width.
     *
     * @default 'auto'
     */
    density?: ChatMessageListDensity;
    /**
     * `auto`: consecutive messages from one sender are grouped. `none`: every
     * message stands alone (or keeps the `group` you set).
     *
     * @default 'auto'
     */
    grouping?: ChatMessageListGrouping;
    /**
     * Insert a ChatDaySeparator before the first message of each day (read
     * from each message's `time`).
     *
     * @default false
     */
    daySeparators?: boolean;
    /** "Now", for the separators' Today / Yesterday. Without it they print the date. */
    now?: TimestampValue;
    /**
     * @default 'en-IN'
     */
    locale?: string;
    /**
     * The zone days are read in.
     *
     * @default 'Asia/Kolkata'
     */
    timeZone?: string;
  };

type MessageLikeProps = {
  from?: unknown;
  group?: ChatMessageGroup;
  sender?: unknown;
  name?: unknown;
  time?: TimestampValue;
};

const hasTime = (node: React.ReactNode): node is React.ReactElement<MessageLikeProps> =>
  React.isValidElement(node) && (node.props as MessageLikeProps).time !== undefined;

const isMessage = (node: React.ReactNode): node is React.ReactElement<MessageLikeProps> =>
  React.isValidElement(node) && typeof (node.props as MessageLikeProps).from === 'string';

const senderOf = (props: MessageLikeProps) =>
  typeof props.sender === 'string'
    ? `id:${props.sender}`
    : `${String(props.from)}:${typeof props.name === 'string' ? props.name : ''}`;

const position = (index: number, length: number): ChatMessageGroup => {
  if (length <= 1) return 'single';
  if (index === 0) return 'first';
  if (index === length - 1) return 'last';
  return 'middle';
};

export const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(
    {
      className,
      density = 'auto',
      grouping = 'auto',
      daySeparators = false,
      now,
      locale = 'en-IN',
      timeZone = 'Asia/Kolkata',
      role,
      children,
      ...props
    },
    ref,
  ) {
    const named = Boolean(props['aria-label'] || props['aria-labelledby']);

    // 1. Flatten, inserting day separators where the calendar day changes.
    const items: React.ReactNode[] = [];
    let lastDay = '';
    React.Children.toArray(children).forEach((child) => {
      if (daySeparators && hasTime(child)) {
        const day = dayKey(child.props.time as TimestampValue, timeZone);
        if (day && day !== lastDay) {
          items.push(
            <ChatDaySeparator
              key={`chat-day-${day}`}
              date={child.props.time as TimestampValue}
              now={now}
              locale={locale}
              timeZone={timeZone}
            />,
          );
          lastDay = day;
        }
      }
      items.push(child);
    });

    // 2. Runs of consecutive messages from one sender.
    let output = items;
    if (grouping === 'auto') {
      const groups: Array<ChatMessageGroup | undefined> = items.map(() => undefined);
      let start = 0;
      const close = (end: number) => {
        for (let i = start; i < end; i += 1) groups[i] = position(i - start, end - start);
      };
      for (let i = 0; i <= items.length; i += 1) {
        const prev = items[i - 1];
        const cur = items[i];
        const continues =
          i > 0 &&
          i < items.length &&
          isMessage(prev) &&
          isMessage(cur) &&
          senderOf(prev.props) === senderOf(cur.props);
        if (!continues) {
          if (i > 0 && isMessage(prev)) close(i);
          start = i;
        }
      }
      output = items.map((item, i) => {
        const group = groups[i];
        if (!isMessage(item) || group === undefined || item.props.group !== undefined) return item;
        return React.cloneElement(item, { group });
      });
    }

    return (
      <div
        ref={ref}
        data-slot="chat-message-list"
        data-density={density}
        data-grouping={grouping}
        role={role ?? 'log'}
        aria-label={named ? undefined : 'Conversation'}
        // The container the density (and anything inside) measures against.
        className={cn('@container/chat-list w-full min-w-0', className)}
        {...props}
      >
        <div data-slot="chat-message-list-items" className={chatMessageListVariants({ density })}>
          {output}
        </div>
      </div>
    );
  },
);
ChatMessageList.displayName = 'ChatMessageList';
