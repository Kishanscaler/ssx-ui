import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------------------
 * ChatMessageBubble
 *
 * The neutral bubble a PERSON's message sits in (the student, or a mentor in
 * a group chat). The assistant's reply has no bubble: it is prose at the
 * measure (`ChatMessage from="assistant"`), because an answer is something to
 * read, not a speech balloon.
 *
 * THE FILL. `surface-subtle` with `content-primary`, the pair the token
 * pipeline gates as "body text on a subtle region" (17.18:1 light, 13.36:1
 * dark, both brands; `dist/audit.txt`). The fill alone is within a shade of
 * the page in both modes (#FAFAFA on white, #0A0A0A on black), so the edge is
 * drawn by a `border-decorative` hairline, the same edge a Card uses. No
 * brand colour: a brand-filled bubble would be the loudest thing on the
 * screen and it is the least important (the student already knows what they
 * typed).
 *
 * GROUPING. `group` squares the corner on the SENDER's side where the bubble
 * touches its neighbour, so a run of bubbles reads as one turn:
 *   single  all corners 16px (radius-2xl)
 *   first   the bottom corner on the sender's side 4px
 *   middle  both corners on the sender's side 4px
 *   last    the top corner on the sender's side 4px
 * The sender's side is the end for `from="user"` and the start otherwise,
 * read from `data-from` on the nearest `ChatMessage` (or the `side` prop).
 * Corners are logical (`rounded-ee-*`), so RTL mirrors with no extra rule.
 *
 * WIDTH. Never wider than 85% of the message row in a narrow panel, 75% from
 * a 40rem-wide message, and never past the prose measure (`--size-measure-max`,
 * 72ch) at any width. It follows the CONTAINER (the message is a container),
 * not the viewport, so the same bubble is right in a full page, a 360px panel
 * and a SideDrawer.
 *
 * Server component: no hooks, no handlers.
 * ------------------------------------------------------------------------- */

export const chatMessageBubbleVariants = cva(
  [
    'min-w-0 w-fit max-w-[min(var(--chat-message-bubble-max-width),var(--size-measure-max))] @min-region-lg/chat-message:max-w-[min(var(--chat-message-bubble-max-width-wide),var(--size-measure-max))]',
    'rounded-2xl border border-border-decorative bg-surface-subtle px-4 py-2.5',
    // On a RAISED layer (a Card, SideDrawer, BottomSheet, Popover: the
    // `data-elevation="raised"` contract) the page's subtle fill is DARKER
    // than the layer in dark mode (#0A0A0A on #212121) and read as a hole.
    // There the bubble takes the raised layer's own next step up
    // (surface-raised-hover: #2E2E2E in dark, #F5F5F5 in light) and its edge.
    '[[data-elevation=raised]_&]:border-border-raised [[data-elevation=raised]_&]:bg-surface-raised-hover',
    'font-sans type-body text-content [overflow-wrap:anywhere]',
    // Rich content inside (a Markdown block, a code chip) keeps its own
    // margins off the bubble's edge.
    '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
  ],
  {
    variants: {
      side: {
        end: '',
        start: '',
      },
      group: {
        single: '',
        first: '',
        middle: '',
        last: '',
      },
    },
    compoundVariants: [
      { side: 'end', group: 'first', className: 'rounded-ee-md' },
      { side: 'end', group: 'middle', className: 'rounded-se-md rounded-ee-md' },
      { side: 'end', group: 'last', className: 'rounded-se-md' },
      { side: 'start', group: 'first', className: 'rounded-es-md' },
      { side: 'start', group: 'middle', className: 'rounded-ss-md rounded-es-md' },
      { side: 'start', group: 'last', className: 'rounded-ss-md' },
    ],
  },
);

/**
 * When the bubble sets neither `side` nor `group`, it reads both from the
 * nearest ChatMessage's `data-from` / `data-group`, with CSS alone (so it
 * stays a server component and needs no context).
 */
const inherited = [
  'in-data-[from=user]:in-data-[group=first]:rounded-ee-md',
  'in-data-[from=user]:in-data-[group=middle]:rounded-se-md in-data-[from=user]:in-data-[group=middle]:rounded-ee-md',
  'in-data-[from=user]:in-data-[group=last]:rounded-se-md',
  'in-data-[from=other]:in-data-[group=first]:rounded-es-md',
  'in-data-[from=other]:in-data-[group=middle]:rounded-ss-md in-data-[from=other]:in-data-[group=middle]:rounded-es-md',
  'in-data-[from=other]:in-data-[group=last]:rounded-ss-md',
];

type BubbleVariantProps = VariantProps<typeof chatMessageBubbleVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type ChatMessageGroup = NonNullable<BubbleVariantProps['group']>;
export type ChatMessageBubbleSide = NonNullable<BubbleVariantProps['side']>;

export type ChatMessageBubbleProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Where this bubble sits in a run from one sender. Squares the corner(s) on
   * the sender's side that touch a neighbour. Unset: the nearest
   * ChatMessage's `group` (which ChatMessageList sets automatically).
   */
  group?: ChatMessageGroup;
  /**
   * The sender's side, read together with an explicit `group`: `end` for the
   * student, `start` for anyone else. Without `group`, both come from the
   * nearest ChatMessage.
   *
   * @default 'end'
   */
  side?: ChatMessageBubbleSide;
};

export const ChatMessageBubble = React.forwardRef<HTMLDivElement, ChatMessageBubbleProps>(
  function ChatMessageBubble({ className, group, side, ...props }, ref) {
    // `side` is read only with an explicit `group`; without one, both come
    // from the enclosing ChatMessage.
    const explicit = group !== undefined;
    return (
      <div
        ref={ref}
        data-slot="chat-message-bubble"
        data-group={group}
        data-side={explicit ? (side ?? 'end') : undefined}
        className={cn(
          chatMessageBubbleVariants({ group: group ?? 'single', side: side ?? 'end' }),
          !explicit && inherited,
          className,
        )}
        {...props}
      />
    );
  },
);
ChatMessageBubble.displayName = 'ChatMessageBubble';
