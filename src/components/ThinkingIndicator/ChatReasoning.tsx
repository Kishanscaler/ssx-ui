'use client';

// Client: Radix Collapsible keeps the open state and wires the disclosure
// (`aria-expanded` / `aria-controls`).
import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

import { cn } from '../../lib/cn';
import { CaretRightGlyph } from '../ChatMessage/glyphs';

/* ---------------------------------------------------------------------------
 * ChatReasoning
 *
 * The assistant's reasoning, folded away above its answer: a disclosure whose
 * header says how long it thought ("Thought for 12s") and whose body is the
 * reasoning text in the secondary ink, set off by a hairline at its start.
 *
 *   <ChatReasoning duration={12}>{reasoningText}</ChatReasoning>
 *
 * Collapsed by default: most students want the answer, and the few who want
 * the working can open it. A button (not a heading: it is one part of one
 * message, not an entry in the page outline) with `aria-expanded`; Space /
 * Enter toggles. The panel opens to its measured height (Radix's
 * `--radix-collapsible-content-height`) and does not animate under reduced
 * motion.
 *
 * While the model is still reasoning, pass `thinking`: the header reads
 * "Thinking…" with the ThinkingIndicator's shimmer (and no duration yet).
 *
 * Radix Collapsible rather than our Accordion: an Accordion item is a heading
 * with FAQ spacing and a divider, and none of that belongs inside a message.
 * ------------------------------------------------------------------------- */

/** "12s", "1m 5s". */
export function formatReasoningDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${m}m ${rest}s` : `${m}m`;
}

export type ChatReasoningProps = Omit<
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>,
  'title'
> & {
  /** How long the model reasoned, in seconds. Shown as "Thought for 12s". */
  duration?: number;
  /** Replaces the header text entirely. */
  label?: React.ReactNode;
  /**
   * Still reasoning: the header reads `thinkingLabel` with the shimmer.
   *
   * @default false
   */
  thinking?: boolean;
  /**
   * The header while `thinking`.
   *
   * @default 'Thinking…'
   */
  thinkingLabel?: React.ReactNode;
  /** The reasoning: text, Markdown, anything. */
  children?: React.ReactNode;
};

export const ChatReasoning = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  ChatReasoningProps
>(function ChatReasoning(
  { className, duration, label, thinking = false, thinkingLabel = 'Thinking…', children, ...props },
  ref,
) {
  const header =
    label ??
    (thinking
      ? thinkingLabel
      : duration !== undefined
        ? `Thought for ${formatReasoningDuration(duration)}`
        : 'Reasoning');

  return (
    <CollapsiblePrimitive.Root
      ref={ref}
      data-slot="chat-reasoning"
      data-thinking={thinking || undefined}
      className={cn('group/chat-reasoning flex w-full min-w-0 max-w-(--size-measure-max) flex-col', className)}
      {...props}
    >
      <CollapsiblePrimitive.Trigger
        data-slot="chat-reasoning-trigger"
        className={cn(
          'inline-flex max-w-full cursor-pointer items-center gap-1 self-start rounded-md border-0 bg-transparent p-0 text-start',
          'font-sans type-body-sm font-medium text-content-secondary',
          'transition-colors duration-[var(--motion-duration-fast)] ease-productive-in-out motion-reduce:transition-none',
          'hover:text-content',
          'outline-none focus-visible:outline-focus focus-visible:outline-offset-focus focus-visible:outline-solid focus-visible:outline-border-focus',
          'pointer-coarse:min-h-touch-min',
        )}
      >
        <span
          data-slot="chat-reasoning-label"
          data-shimmer={thinking || undefined}
          className="min-w-0 [overflow-wrap:anywhere]"
        >
          {header}
        </span>
        <CaretRightGlyph
          data-slot="chat-reasoning-caret"
          className={cn(
            'size-icon-sm shrink-0 rtl:-scale-x-100',
            'transition-transform duration-[var(--motion-duration-normal)] ease-productive-in-out motion-reduce:transition-none',
            'group-data-[state=open]/chat-reasoning:rotate-90',
          )}
        />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content
        data-slot="chat-reasoning-content"
        className={cn(
          'overflow-hidden',
          // The collapsible height motion SideNav's groups already declare
          // (styles/batches/o4.css), on Radix's measured height.
          'data-[state=open]:animate-ssx-sidenav-group-down data-[state=closed]:animate-ssx-sidenav-group-up',
          'motion-reduce:animate-none',
        )}
      >
        <div
          data-slot="chat-reasoning-body"
          className={cn(
            'mt-2 border-s-thick border-border-decorative ps-3',
            'font-sans type-body-sm text-content-secondary [overflow-wrap:anywhere]',
            '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          )}
        >
          {children}
        </div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
});
ChatReasoning.displayName = 'ChatReasoning';
