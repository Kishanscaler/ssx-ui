'use client';

// Client: composes CopyButton, IconButton, ToggleButtonGroup and Menu, which
// are client, and hands them the caller's handlers.
import * as React from 'react';

import { cn } from '../../lib/cn';
import { CopyButton } from '../Code/CopyButton';
import { IconButton } from '../IconButton';
import { Menu, MenuContent, MenuTrigger } from '../Menu';
import { ToggleButtonGroup, ToggleButtonGroupItem } from '../ToggleButtonGroup';
import {
  MoreGlyph,
  RegenerateGlyph,
  ThumbsDownFillGlyph,
  ThumbsDownGlyph,
  ThumbsUpFillGlyph,
  ThumbsUpGlyph,
} from './glyphs';

/* ---------------------------------------------------------------------------
 * ChatMessageActions
 *
 * The row under an assistant reply: copy, regenerate, a thumbs up / down
 * pair, and a More menu. Every control is 32px (`sm`, set here explicitly,
 * not inherited from a Toolbar) and neutral, so the row is quieter than the
 * answer above it.
 *
 *   <ChatMessageActions
 *     copyValue={replyText}
 *     onRegenerate={regenerate}
 *     feedback={rating} onFeedbackChange={setRating}
 *     menu={<><MenuItem>Report a problem</MenuItem><MenuItem>Share</MenuItem></>}
 *   />
 *
 * Each control appears only when its input does: no `copyValue`, no copy; no
 * `onRegenerate`, no regenerate; no `menu`, no More. The thumbs show unless
 * `showFeedback={false}`.
 *
 * THUMBS are a single-choice ToggleButtonGroup (`type="single"`): one Tab
 * stop, arrow keys between the two, exactly one or none pressed, and pressing
 * the pressed one again takes the rating back. The pressed thumb swaps to the
 * fill glyph. `feedback` is `'up' | 'down' | ''`.
 *
 * VISIBILITY. `hover` (the default) keeps the row at opacity 0 until the
 * message is hovered, anything in it has focus, or the More menu is open;
 * on a touch device (`pointer-coarse:`) it is always shown. It is never
 * `display: none` or `visibility: hidden`: the buttons stay in the tab order
 * and the accessibility tree, and tabbing into one reveals the row.
 * `always` shows it at rest (the latest reply, say).
 * ------------------------------------------------------------------------- */

/** String unions, so a Storyblok option value can be passed straight in. */
export type ChatMessageFeedback = 'up' | 'down' | '';
export type ChatMessageActionsVisibility = 'hover' | 'always';

export type ChatMessageActionsProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  /** The text the copy button writes (the reply as plain text or Markdown). Omit for no copy button. */
  copyValue?: string;
  /**
   * The copy button's name.
   *
   * @default 'Copy response'
   */
  copyLabel?: string;
  /** Called by the regenerate button. Omit for no regenerate button. */
  onRegenerate?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * The regenerate button's name.
   *
   * @default 'Regenerate response'
   */
  regenerateLabel?: string;
  /**
   * Show the thumbs up / down pair.
   *
   * @default true
   */
  showFeedback?: boolean;
  /** The rating (controlled): `'up'`, `'down'`, or `''` for none. */
  feedback?: ChatMessageFeedback;
  /**
   * The rating at first (uncontrolled).
   *
   * @default ''
   */
  defaultFeedback?: ChatMessageFeedback;
  /** Called with the new rating, `''` when it is taken back. */
  onFeedbackChange?: (feedback: ChatMessageFeedback) => void;
  /**
   * The pair's group name.
   *
   * @default 'Rate this response'
   */
  feedbackLabel?: string;
  /** @default 'Good response' */
  upLabel?: string;
  /** @default 'Bad response' */
  downLabel?: string;
  /** Menu rows (`MenuItem`s) for the More menu. Omit for no More button. */
  menu?: React.ReactNode;
  /**
   * The More button's name.
   *
   * @default 'More actions'
   */
  moreLabel?: string;
  /**
   * `hover`: shown on hover / focus-within of the message (always on touch).
   * `always`: shown at rest.
   *
   * @default 'hover'
   */
  visibility?: ChatMessageActionsVisibility;
  /** Extra controls, after the built-in ones (use `size="sm"`). */
  children?: React.ReactNode;
};

export const ChatMessageActions = React.forwardRef<HTMLDivElement, ChatMessageActionsProps>(
  function ChatMessageActions(
    {
      className,
      copyValue,
      copyLabel = 'Copy response',
      onRegenerate,
      regenerateLabel = 'Regenerate response',
      showFeedback = true,
      feedback,
      defaultFeedback,
      onFeedbackChange,
      feedbackLabel = 'Rate this response',
      upLabel = 'Good response',
      downLabel = 'Bad response',
      menu,
      moreLabel = 'More actions',
      visibility = 'hover',
      role,
      'aria-label': ariaLabel,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-slot="chat-message-actions"
        data-visibility={visibility}
        role={role ?? 'group'}
        aria-label={ariaLabel ?? 'Response actions'}
        className={cn(
          // -ms-2: the 32px buttons' own padding lines the first glyph up with
          // the prose edge above.
          'flex flex-wrap items-center gap-1 -ms-2',
          visibility === 'hover' && [
            'opacity-0 transition-opacity duration-[var(--motion-duration-fast)] ease-productive-in-out motion-reduce:transition-none',
            'group-hover/chat-message:opacity-100 group-focus-within/chat-message:opacity-100',
            'focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100',
            'pointer-coarse:opacity-100',
          ],
          className,
        )}
        {...props}
      >
        {copyValue !== undefined ? (
          <CopyButton value={copyValue} aria-label={copyLabel} size="sm" variant="neutral" />
        ) : null}
        {onRegenerate ? (
          <IconButton variant="neutral" size="sm" aria-label={regenerateLabel} onClick={onRegenerate}>
            <RegenerateGlyph />
          </IconButton>
        ) : null}
        {showFeedback ? (
          <ToggleButtonGroup
            type="single"
            size="icon-sm"
            aria-label={feedbackLabel}
            value={feedback}
            defaultValue={defaultFeedback ?? ''}
            onValueChange={onFeedbackChange as ((value: string) => void) | undefined}
            // Two quiet icons, not a welded pair of outlined boxes: the
            // recipe's box is dropped here and the pressed fill is kept.
            className={cn(
              'gap-1 overflow-visible',
              '[&>*]:rounded-md [&>*]:border-transparent [&>*]:bg-transparent [&>*]:text-content-secondary',
            )}
          >
            <ToggleButtonGroupItem
              value="up"
              aria-label={upLabel}
              icon={<ThumbsUpGlyph />}
              pressedIcon={<ThumbsUpFillGlyph />}
            />
            <ToggleButtonGroupItem
              value="down"
              aria-label={downLabel}
              icon={<ThumbsDownGlyph />}
              pressedIcon={<ThumbsDownFillGlyph />}
            />
          </ToggleButtonGroup>
        ) : null}
        {menu != null && menu !== false ? (
          <Menu>
            <MenuTrigger asChild>
              <IconButton variant="neutral" size="sm" aria-label={moreLabel}>
                <MoreGlyph />
              </IconButton>
            </MenuTrigger>
            <MenuContent>{menu}</MenuContent>
          </Menu>
        ) : null}
        {children}
      </div>
    );
  },
);
ChatMessageActions.displayName = 'ChatMessageActions';
