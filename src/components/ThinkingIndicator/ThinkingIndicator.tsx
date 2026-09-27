'use client';

// Client: announces the wait once, from an effect, through the package's
// shared live region.
import * as React from 'react';

import { announce, ensureAnnouncer, withdraw } from '../../lib/announce';
import { cn } from '../../lib/cn';
import { Spinner } from '../Spinner';

/* ---------------------------------------------------------------------------
 * ThinkingIndicator
 *
 * The assistant is working on a reply. The brand monogram draws itself (the
 * `Spinner`, 24px) beside a label, "Thinking…" by default, with a soft band of
 * light crossing the words.
 *
 *   <ThinkingIndicator />
 *   <ThinkingIndicator label="Reading your submission…" />
 *
 * THE SHIMMER is the label's own ink (secondary) with a band of the primary
 * ink passing through it, so no part of the text ever drops below the
 * secondary ink's contrast (6.19:1 light, 8.33:1 dark on the page). It is
 * `@keyframes`, so it lives in `styles/components.css`, keyed off
 * `[data-slot='thinking-indicator-label'][data-shimmer]`. Under
 * `prefers-reduced-motion` (or a `data-motion="reduce"` ancestor) the label is
 * static secondary text and the Spinner holds its still frame. Where the
 * stylesheet has not loaded, the label is plain text. `shimmer={false}` turns
 * it off.
 *
 * ANNOUNCED ONCE. On mount the label (or `announcement`) is written to the
 * package's one polite live region (`lib/announce`), and taken back on
 * unmount. The element itself is not a live region and the Spinner inside is
 * silent, so the wait is read once, not once per re-render or once per part.
 * `announcement={null}` stays silent (when the page already says it).
 *
 * Place it where the reply will appear, usually as the last child of a
 * ChatMessageList: it is not a message, so it ends any group before it.
 * ------------------------------------------------------------------------- */

export type ThinkingIndicatorProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * What the assistant is doing.
   *
   * @default 'Thinking…'
   */
  label?: React.ReactNode;
  /**
   * Announced once to screen readers on mount. Defaults to `label` when it is
   * a string, else "Thinking". `null` announces nothing.
   */
  announcement?: string | null;
  /**
   * The band of light across the label. Always off under reduced motion.
   *
   * @default true
   */
  shimmer?: boolean;
  /**
   * The monogram beside the label. `false` shows the label alone (inside a
   * ChatReasoning header, say).
   *
   * @default true
   */
  showSpinner?: boolean;
};

export const ThinkingIndicator = React.forwardRef<HTMLDivElement, ThinkingIndicatorProps>(
  function ThinkingIndicator(
    { className, label = 'Thinking…', announcement, shimmer = true, showSpinner = true, ...props },
    ref,
  ) {
    const message =
      announcement === null
        ? ''
        : (announcement ?? (typeof label === 'string' ? label.replace(/…$/, '') : 'Thinking'));

    // Once per mount: a change of label while it is showing is not re-read.
    const first = React.useRef(message);
    React.useEffect(() => {
      ensureAnnouncer();
      const ticket = first.current ? announce(first.current) : 0;
      return () => withdraw(ticket);
    }, []);

    return (
      <div
        ref={ref}
        data-slot="thinking-indicator"
        className={cn('flex min-w-0 items-center gap-3 font-sans', className)}
        {...props}
      >
        {showSpinner ? (
          // The avatar column's width (28px), so the label lines up with the
          // prose of the assistant's messages above it.
          <span data-slot="thinking-indicator-mark" className="flex size-control-xs shrink-0 items-center justify-center">
            <Spinner size="md" kind="monogram" label={null} className="text-content-brand" />
          </span>
        ) : null}
        <span
          data-slot="thinking-indicator-label"
          data-shimmer={shimmer || undefined}
          className="min-w-0 type-body-sm text-content-secondary [overflow-wrap:anywhere]"
        >
          {label}
        </span>
      </div>
    );
  },
);
ThinkingIndicator.displayName = 'ThinkingIndicator';
