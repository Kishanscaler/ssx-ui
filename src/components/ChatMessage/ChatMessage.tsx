'use client';

// Client: a failed message hands `onRetry` to its Retry Button. Everything
// else here is static; the parts it composes (bubble, metadata) are server.
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { ErrorGlyph } from '../Alert/status-glyphs';
import { Button } from '../Button';
import type { TimestampValue } from '../Timestamp';
import { ChatAssistantAvatar } from './ChatAssistantAvatar';
import { ChatMessageBubble, type ChatMessageGroup } from './ChatMessageBubble';
import { ChatMessageMetadata } from './ChatMessageMetadata';

/* ---------------------------------------------------------------------------
 * ChatMessage
 *
 * One message from one sender. Who sent it decides the whole shape:
 *
 *   from="user"       the student. Aligned to the END, in a neutral
 *                     ChatMessageBubble, no avatar unless you pass one.
 *   from="assistant"  the AI tutor. Aligned to the START, NO bubble: the
 *                     reply is prose at the measure (72ch,
 *                     `--size-measure-max`), full width below that. The
 *                     brand monogram is its avatar by default.
 *   from="other"      another person in a group chat (a mentor). Aligned to
 *                     the start, in a bubble, with their avatar and name.
 *
 *   <ChatMessage from="user" time={sentAt}>Why does my binary search loop forever?</ChatMessage>
 *   <ChatMessage from="assistant" name="Scaler Tutor" actions={<ChatMessageActions … />}>
 *     <Markdown>{reply}</Markdown>
 *   </ChatMessage>
 *
 * One ChatMessage is one bubble. A turn of several bubbles is several
 * ChatMessages from the same sender; ChatMessageList groups them (`group`),
 * squaring the corners between them, tightening the gap, and showing the
 * avatar and name once, on the first.
 *
 * SLOTS: `avatar` (false for none), `name`, the content (children: any
 * ReactNode, Markdown included), `metadata` (a ChatMessageMetadata; when unset
 * and `time` is given, the time is shown on the last message of a group),
 * `actions` (a ChatMessageActions row). A sender with no visible name gets a
 * visually hidden one (`senderLabel`, "You" / "Assistant"), so a screen reader
 * walking the log knows who said what.
 *
 * STATUS. `sending` marks the message busy and says "Sending…" in the
 * metadata. `failed` adds a compact inline notice in the danger ink, "Not
 * sent", with a Retry button when `onRetry` is given. The log announces the
 * change; the notice itself is not a second live region.
 *
 * CONTAINER, NOT VIEWPORT. The message is a size container
 * (`@container/chat-message`), so its bubble width and its avatar follow the
 * width it is given: in a 360px panel the assistant's avatar steps aside
 * (below 24rem) and the prose takes the whole row.
 * ------------------------------------------------------------------------- */

export const chatMessageVariants = cva(
  [
    '@container/chat-message group/chat-message relative flex w-full min-w-0 items-start gap-3',
    // Inside a ChatMessageList: a message that continues a run pulls up to
    // the group gap. Outside one the variables are unset, the calc is
    // invalid, and the margin is 0.
    'data-[group=middle]:mt-[calc(var(--chat-group-gap)-var(--chat-turn-gap))]',
    'data-[group=last]:mt-[calc(var(--chat-group-gap)-var(--chat-turn-gap))]',
  ],
  {
    variants: {
      from: {
        user: 'flex-row-reverse',
        assistant: '',
        other: '',
      },
    },
    defaultVariants: { from: 'assistant' },
  },
);

type ChatMessageVariantProps = VariantProps<typeof chatMessageVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type ChatMessageFrom = NonNullable<ChatMessageVariantProps['from']>;
export type ChatMessageStatus = 'sending' | 'sent' | 'failed';

const SENDER_LABEL: Record<ChatMessageFrom, string> = {
  user: 'You',
  assistant: 'Assistant',
  other: '',
};

export type ChatMessageProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  ChatMessageVariantProps & {
    /**
     * Who sent it: `user` (the student: end-aligned bubble), `assistant` (the
     * AI: start-aligned prose, no bubble), `other` (another person: start-
     * aligned bubble with avatar and name).
     *
     * @default 'assistant'
     */
    from?: ChatMessageFrom;
    /**
     * The sender's avatar. The assistant's default is the brand monogram
     * (`ChatAssistantAvatar`); the others have none unless given. `false`
     * hides it. Kept (invisible) on later messages of a group, for the indent.
     */
    avatar?: React.ReactNode;
    /** The sender's visible name ("Priya Sharma · Mentor"), shown on the first message of a group. */
    name?: React.ReactNode;
    /**
     * A visually hidden sender name, used when no `name` is visible, so each
     * message says who said it to a screen reader. `''` for none.
     *
     * @default 'You' (user) · 'Assistant' (assistant) · '' (other)
     */
    senderLabel?: string;
    /**
     * Where this message sits in a run from one sender. ChatMessageList sets it
     * for you; set it yourself outside a list.
     *
     * @default 'single'
     */
    group?: ChatMessageGroup;
    /**
     * Groups runs by sender in ChatMessageList when two different people share
     * a `from` (two mentors). Defaults to `from` plus a string `name`.
     */
    sender?: string;
    /**
     * When it was sent. Read by ChatMessageList for day separators, and shown
     * as the time on the last message of a group when `metadata` is unset.
     */
    time?: TimestampValue;
    /**
     * `sending` busy, "Sending…" · `sent` nothing extra · `failed` the inline
     * "Not sent" notice with Retry.
     *
     * @default 'sent'
     */
    status?: ChatMessageStatus;
    /** Called by the Retry button of a `failed` message. Without it there is no button. */
    onRetry?: React.MouseEventHandler<HTMLButtonElement>;
    /**
     * The failed notice's words.
     *
     * @default 'Not sent'
     */
    errorLabel?: React.ReactNode;
    /**
     * The Retry button's label.
     *
     * @default 'Retry'
     */
    retryLabel?: React.ReactNode;
    /** The metadata row (a ChatMessageMetadata). `null` hides the automatic time. */
    metadata?: React.ReactNode;
    /** The action row under the message (a ChatMessageActions). */
    actions?: React.ReactNode;
    /** The message: text, Markdown, a code block, anything. */
    children?: React.ReactNode;
  };

export const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(function ChatMessage(
  {
    className,
    from = 'assistant',
    avatar,
    name,
    senderLabel,
    group = 'single',
    sender: _sender,
    time,
    status = 'sent',
    onRetry,
    errorLabel = 'Not sent',
    retryLabel = 'Retry',
    metadata,
    actions,
    children,
    ...props
  },
  ref,
) {
  const leads = group === 'single' || group === 'first';
  const closes = group === 'single' || group === 'last';
  const bubbled = from !== 'assistant';

  const avatarNode = avatar === undefined ? (from === 'assistant' ? <ChatAssistantAvatar /> : null) : avatar;
  const hasAvatar = avatarNode != null && avatarNode !== false;
  const hasName = name != null && name !== false && name !== '';
  const hidden = senderLabel ?? SENDER_LABEL[from] ?? '';

  let meta: React.ReactNode = metadata;
  if (metadata === undefined) {
    if (status === 'sending') meta = <ChatMessageMetadata time={time} delivery="sending" />;
    else if (time !== undefined && closes && status !== 'failed') meta = <ChatMessageMetadata time={time} />;
  }

  return (
    <div
      ref={ref}
      data-slot="chat-message"
      data-from={from}
      data-group={group}
      data-status={status}
      aria-busy={status === 'sending' || undefined}
      className={cn(chatMessageVariants({ from }), className)}
      {...props}
    >
      {hasAvatar ? (
        <div
          data-slot="chat-message-avatar"
          className={cn(
            'flex shrink-0',
            // The run's later messages keep the column, not the face.
            !leads && 'invisible',
            // In a narrow container the assistant's prose needs the row more
            // than the monogram does.
            from === 'assistant' && '@max-region-xs/chat-message:hidden',
          )}
        >
          {avatarNode}
        </div>
      ) : null}

      <div
        data-slot="chat-message-body"
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1.5',
          from === 'user' ? 'items-end' : 'items-start',
        )}
      >
        {leads && hasName ? (
          <div
            data-slot="chat-message-name"
            className="max-w-full font-sans type-body-sm font-semibold text-content [overflow-wrap:anywhere]"
          >
            {name}
          </div>
        ) : null}
        {leads && !hasName && hidden ? (
          <span data-slot="chat-message-sender" className="sr-only">
            {`${hidden}: `}
          </span>
        ) : null}

        {bubbled ? (
          <ChatMessageBubble>{children}</ChatMessageBubble>
        ) : (
          <div
            data-slot="chat-message-content"
            className={cn(
              'w-full min-w-0 max-w-(--size-measure-max)',
              'font-sans type-body text-content [overflow-wrap:anywhere]',
              '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
            )}
          >
            {children}
          </div>
        )}

        {status === 'failed' ? (
          <div
            data-slot="chat-message-error"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans type-caption text-danger-content"
          >
            <ErrorGlyph className="size-icon-sm shrink-0" />
            <span data-slot="chat-message-error-label" className="font-semibold">
              {errorLabel}
            </span>
            {onRetry ? (
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                // Button keeps its own data-slot; this names its job.
                data-chat-retry=""
                onClick={onRetry}
              >
                {retryLabel}
              </Button>
            ) : null}
          </div>
        ) : null}

        {meta}
        {actions}
      </div>
    </div>
  );
});
ChatMessage.displayName = 'ChatMessage';
