import * as React from 'react';

import { cn } from '../../lib/cn';
import { Timestamp, formatAbsolute, type TimestampValue } from '../Timestamp';
import { formatClockTime } from './format';

/* ---------------------------------------------------------------------------
 * ChatMessageMetadata
 *
 * The quiet line under a message: when it was sent, which model wrote it, and
 * whether it arrived. Caption role (12px), secondary ink, parts separated by
 * a middle dot that a screen reader skips.
 *
 *   <ChatMessageMetadata time={sentAt} delivery="read" />       11:42 PM · Read
 *   <ChatMessageMetadata time={sentAt} model="Scaler Tutor" />  11:42 PM · Scaler Tutor
 *
 * THE TIME is a `Timestamp` (a `<time dateTime>` with tabular figures) showing
 * the clock time only ("11:42 PM"): the day is what the list's day separator
 * says. The full date is in the `title`. `timeFormat="relative"` or
 * `"absolute"` hands the choice back to Timestamp.
 *
 * DELIVERY is words, never a tick glyph alone: "Sending…", "Sent", "Read",
 * "Not sent". `failed` is the danger ink; a failed send also shows the Retry
 * notice (`ChatMessage status="failed"`), and this is the short form of it.
 *
 * Server component: no hooks, no handlers (Timestamp is its own client leaf).
 * ------------------------------------------------------------------------- */

/** String union, so a Storyblok option value can be passed straight in. */
export type ChatMessageDelivery = 'sending' | 'sent' | 'read' | 'failed';
export type ChatMessageTimeFormat = 'time' | 'relative' | 'absolute';

/** The words for each delivery state. Override with `deliveryLabel`. */
export const chatMessageDeliveryLabels: Record<ChatMessageDelivery, string> = {
  sending: 'Sending…',
  sent: 'Sent',
  read: 'Read',
  failed: 'Not sent',
};

export type ChatMessageMetadataProps = React.HTMLAttributes<HTMLDivElement> & {
  /** When the message was sent: a `Date`, epoch ms, or an ISO string with an offset. */
  time?: TimestampValue;
  /**
   * `time` "11:42 PM" (the full date in the tooltip) · `relative` "2 minutes
   * ago" · `absolute` "4 Mar 2026, 11:42 PM".
   *
   * @default 'time'
   */
  timeFormat?: ChatMessageTimeFormat;
  /** The model that wrote an assistant reply ("Scaler Tutor · GPT-5"). */
  model?: React.ReactNode;
  /** Whether a sent message arrived. Words, in the secondary ink (`failed` in danger). */
  delivery?: ChatMessageDelivery;
  /** Replaces the default words for `delivery` ("Seen by Priya"). */
  deliveryLabel?: React.ReactNode;
  /**
   * @default 'en-IN'
   */
  locale?: string;
  /**
   * @default 'Asia/Kolkata'
   */
  timeZone?: string;
  /** Extra parts, after the built-in ones, each separated by a dot. */
  children?: React.ReactNode;
};

const Dot = () => (
  <span aria-hidden="true" data-slot="chat-message-metadata-separator">
    ·
  </span>
);

export const ChatMessageMetadata = React.forwardRef<HTMLDivElement, ChatMessageMetadataProps>(
  function ChatMessageMetadata(
    {
      className,
      time,
      timeFormat = 'time',
      model,
      delivery,
      deliveryLabel,
      locale = 'en-IN',
      timeZone = 'Asia/Kolkata',
      children,
      ...props
    },
    ref,
  ) {
    const parts: React.ReactNode[] = [];
    if (time !== undefined) {
      parts.push(
        <Timestamp
          key="time"
          date={time}
          locale={locale}
          timeZone={timeZone}
          format={timeFormat === 'time' ? 'absolute' : timeFormat}
          title={timeFormat === 'time' ? formatAbsolute(time, true, { locale, timeZone }) : undefined}
          className="type-caption"
        >
          {timeFormat === 'time' ? formatClockTime(time, { locale, timeZone }) : undefined}
        </Timestamp>,
      );
    }
    if (model != null && model !== false) {
      parts.push(
        <span key="model" data-slot="chat-message-model">
          {model}
        </span>,
      );
    }
    if (delivery) {
      parts.push(
        <span
          key="delivery"
          data-slot="chat-message-delivery"
          data-delivery={delivery}
          className={cn(delivery === 'failed' && 'font-semibold text-danger-content')}
        >
          {deliveryLabel ?? chatMessageDeliveryLabels[delivery]}
        </span>,
      );
    }
    React.Children.forEach(children, (child) => {
      if (child != null && child !== false && child !== '') parts.push(child);
    });

    return (
      <div
        ref={ref}
        data-slot="chat-message-metadata"
        className={cn(
          'flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 font-sans type-caption text-content-secondary tabular-nums',
          className,
        )}
        {...props}
      >
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <Dot /> : null}
            {part}
          </React.Fragment>
        ))}
      </div>
    );
  },
);
ChatMessageMetadata.displayName = 'ChatMessageMetadata';
