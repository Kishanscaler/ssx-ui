import * as React from 'react';

import { cn } from '../../lib/cn';
import { Divider } from '../Divider';
import { Timestamp, type TimestampValue } from '../Timestamp';
import { formatChatDay } from './format';

/* ---------------------------------------------------------------------------
 * ChatSystemMessage, ChatDaySeparator
 *
 * The two quiet lines a conversation needs between messages. Neither is a
 * message: no sender, no bubble, no actions.
 *
 *   <ChatSystemMessage>Mentor Priya Sharma joined the conversation</ChatSystemMessage>
 *   <ChatDaySeparator date={day} now={requestTime} />        ——— Yesterday ———
 *
 * ChatSystemMessage is centred caption text in the secondary ink: an event
 * ("joined", "Conversation reset"), not a divider, so it has no rules. It has
 * no role of its own: inside ChatMessageList it is part of the log and is
 * announced as an addition like any message.
 *
 * ChatDaySeparator is Divider's labelled form (a rule each side, the words
 * read) around a `Timestamp` of the day, so the machine-readable date is in
 * `<time dateTime>` whatever the words say. "Today" / "Yesterday" need `now`
 * (the request time on the server): without it the separator prints the date,
 * so a server render never disagrees with the reader's clock. `children`
 * replaces the words.
 *
 * Server components: no hooks, no handlers (Timestamp is its own client leaf).
 * ------------------------------------------------------------------------- */

export type ChatSystemMessageProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * When it happened. Not shown; ChatMessageList reads it so a day separator
   * lands before this line, not after it.
   */
  time?: TimestampValue;
};

export const ChatSystemMessage = React.forwardRef<HTMLDivElement, ChatSystemMessageProps>(
  function ChatSystemMessage({ className, time: _time, ...props }, ref) {
    return (
      <div
        ref={ref}
        data-slot="chat-system-message"
        className={cn(
          'mx-auto w-full max-w-(--size-measure-max) px-4 text-center',
          'font-sans type-caption text-content-secondary [overflow-wrap:anywhere]',
          className,
        )}
        {...props}
      />
    );
  },
);
ChatSystemMessage.displayName = 'ChatSystemMessage';

export type ChatDaySeparatorProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Any moment on the day: a `Date`, epoch ms, or an ISO string with an offset. */
  date?: TimestampValue;
  /** "Now", for Today / Yesterday. Without it the date is printed. */
  now?: TimestampValue;
  /**
   * @default 'en-IN'
   */
  locale?: string;
  /**
   * The zone the day is read in.
   *
   * @default 'Asia/Kolkata'
   */
  timeZone?: string;
  /** @default 'Today' */
  todayLabel?: string;
  /** @default 'Yesterday' */
  yesterdayLabel?: string;
  /** Replaces the words ("Monday, 3 March"). */
  children?: React.ReactNode;
};

export const ChatDaySeparator = React.forwardRef<HTMLDivElement, ChatDaySeparatorProps>(
  function ChatDaySeparator(
    {
      className,
      date,
      now,
      locale = 'en-IN',
      timeZone = 'Asia/Kolkata',
      todayLabel,
      yesterdayLabel,
      children,
      ...props
    },
    ref,
  ) {
    let label: React.ReactNode = children;
    if (date !== undefined) {
      const words =
        children ?? formatChatDay(date, { locale, timeZone, now, todayLabel, yesterdayLabel });
      label = (
        <Timestamp date={date} format="date" locale={locale} timeZone={timeZone} className="type-caption font-semibold">
          {words}
        </Timestamp>
      );
    }
    return (
      <div ref={ref} data-slot="chat-day-separator" className={cn('w-full', className)} {...props}>
        <Divider>{label}</Divider>
      </div>
    );
  },
);
ChatDaySeparator.displayName = 'ChatDaySeparator';
