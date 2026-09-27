'use client';

// Client: the draft is state (controlled or not), the parts share it through
// context, and the input, send button and attachments attach key, click and
// focus handlers (submit on Enter, stop on Escape, focus hand-offs).
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useId } from '../../lib/use-id';
import { Alert, type AlertProps } from '../Alert';
import { Button } from '../Button';
import { Chip, chipVariants } from '../Chip';
import { IconButton, type IconButtonProps } from '../IconButton';
import { ProgressBar } from '../ProgressBar';
import { Textarea, type TextareaProps } from '../Textarea';
import { Toolbar, type ToolbarProps } from '../Toolbar';

/* ---------------------------------------------------------------------------
 * ChatComposer, ChatComposerInput, ChatComposerSend, ChatComposerAttachments,
 * ChatComposerAttachment, ChatComposerHeader, ChatComposerFooter,
 * ChatComposerStatus
 *
 * The message-entry box of a chat surface (the AI tutor, a doubt thread): a
 * draft, the files attached to it, a row of actions, and the send button that
 * turns into STOP while a reply is streaming.
 *
 *   <ChatComposer onSubmit={send} streaming={streaming} onStop={stop}>
 *     <ChatComposerStatus tone="danger" title="Couldn't send. Check your connection and try again." />
 *     <ChatComposerAttachments>
 *       <ChatComposerAttachment icon={<FilePdf />} onRemove={() => drop('a3')}>assignment-3.pdf</ChatComposerAttachment>
 *     </ChatComposerAttachments>
 *     <ChatComposerInput placeholder="Ask about binary search…" />
 *     <ChatComposerFooter>
 *       <IconButton variant="tertiary" aria-label="Attach a file"><Paperclip /></IconButton>
 *       <ToolbarSpacer />
 *       <ChatComposerSend />
 *     </ChatComposerFooter>
 *   </ChatComposer>
 *
 * The parts, and why each exists:
 *   - ChatComposer: the <form> and the shared state. `onSubmit(value)` gets
 *     the draft; the draft is cleared after it (see `onSubmit` for keeping it
 *     on failure). A `ChatComposerStatus` child is lifted out of the frame and
 *     drawn above or below it (`statusPosition`); everything else is inside.
 *   - ChatComposerInput: our Textarea, growing with its text up to a max
 *     height, then scrolling. Enter sends, Shift+Enter is a newline, and an
 *     Enter that COMMITS an IME composition (Hindi, Japanese, Chinese input)
 *     never sends. Escape stops a streaming reply.
 *   - ChatComposerSend: the primary IconButton. Disabled while the draft is
 *     empty; while streaming it is Stop (a square), never disabled.
 *   - ChatComposerAttachments / ChatComposerAttachment: removable Chips on a
 *     grey tray tucked BEHIND the frame (lifted out of it, like the status),
 *     the input, with an upload bar or an error per file, collapsing to "5
 *     files" when there are many.
 *   - ChatComposerHeader / ChatComposerFooter: action rows built on Toolbar
 *     with `size="sm"`, so every Button and IconButton in them is small
 *     without a size on each. A `ToolbarSpacer` splits start from end. The
 *     footer lifts a ChatComposerSend out of the toolbar to its own end, so
 *     Send is its own tab stop rather than one arrow-key step in a toolbar.
 *   - ChatComposerStatus: an inline Alert in a polite live region.
 *
 * Sizing is to the CONTAINER, not the viewport (`@container/chat-composer`),
 * because the same composer sits full page, in a narrow side panel, and in a
 * SideDrawer: under 24rem the frame's padding tightens and the action rows
 * wrap; Send always holds the end of the last row.
 *
 * Custom parts (a mention-aware editor, a voice button) join the same draft,
 * submit and stop contract through `useChatComposer()`.
 * ------------------------------------------------------------------------- */

/* ---- context -------------------------------------------------------------- */

export type ChatComposerContextValue = {
  /** The current draft. */
  value: string;
  /** Replace the draft. */
  setValue: (value: string) => void;
  /** The draft has text and nothing blocks sending (not streaming, not disabled). */
  canSubmit: boolean;
  /** Send the draft, if it can be sent. */
  submit: () => void;
  /** Ask the streaming reply to stop (calls `onStop`), then focus the input. */
  stop: () => void;
  /** A reply is streaming in. */
  streaming: boolean;
  /** The whole composer is disabled. */
  disabled: boolean;
  /** The id of the ChatComposerInput's textarea. */
  inputId: string;
  /** Registers the input element (ChatComposerInput does this). */
  inputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  /** Move focus to the input (after a send, a stop, a removed attachment). */
  focusInput: () => void;
};

const ChatComposerContext = React.createContext<ChatComposerContextValue | null>(null);

/**
 * The composer's shared state, for a custom part (your own editor or send
 * control). Throws outside a `ChatComposer`.
 */
export function useChatComposer(part = 'useChatComposer'): ChatComposerContextValue {
  const ctx = React.useContext(ChatComposerContext);
  if (!ctx) throw new Error(`${part} must be used inside a <ChatComposer>.`);
  return ctx;
}

/* `useLayoutEffect` warns during server rendering on React < 19. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/* ---- glyphs (Phosphor 2.1.1, MIT) --------------------------------------------- */

/** `arrow-up` bold. */
function SendGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208.49,120.49a12,12,0,0,1-17,0L140,69V216a12,12,0,0,1-24,0V69L64.49,120.49a12,12,0,0,1-17-17l72-72a12,12,0,0,1,17,0l72,72A12,12,0,0,1,208.49,120.49Z" />
    </svg>
  );
}

/** A filled rounded square: the universal "stop" (Phosphor `stop` fill, inset). */
function StopGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <rect x="56" y="56" width="144" height="144" rx="20" />
    </svg>
  );
}

/** `caret-down` bold. */
function CaretGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

/** `paperclip` bold. */
function PaperclipGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M212.48,136.49l-82.06,82a60,60,0,0,1-84.85-84.88l98.16-99.69a44,44,0,1,1,62.25,62.23L108.19,195.8a28,28,0,1,1-39.6-39.61L150.9,72.53a12,12,0,1,1,17.1,16.83L85.66,173.08a4,4,0,0,0,5.63,5.68L189.08,79.39a20,20,0,1,0-28.3-28.28L62.63,150.8a36,36,0,0,0,50.9,50.93l82-82a12,12,0,0,1,17,16.97Z" />
    </svg>
  );
}

/** `warning-circle` fill. */
function WarningGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
    </svg>
  );
}

/* ---- ChatComposer ----------------------------------------------------------- */

export const chatComposerVariants = cva(
  [
    // The frame: header, attachments, input and footer stacked.
    'relative m-0 flex min-w-0 flex-col gap-1 rounded-lg border p-2 @min-[24rem]/chat-composer:p-3',
    'font-sans text-content',
    'transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)] ease-productive-in-out',
    'motion-reduce:transition-none',
    // Typing: the frame shows focus (the textarea draws none of its own).
    'has-[[data-slot=chat-composer-input]:focus-visible]:border-border-focus',
  ],
  {
    variants: {
      elevation: {
        // A raised surface that floats over a conversation.
        raised: 'border-border-raised bg-surface-raised shadow-raised',
        // A field: Input's border, hover and 3px focus ring, round the frame.
        flat: [
          'border-field-border bg-field',
          '[&:not(:has([data-slot=chat-composer-input]:is(:disabled,:focus-visible)))]:hover:border-field-border-hover',
          'has-[[data-slot=chat-composer-input]:focus-visible]:ring-[3px] has-[[data-slot=chat-composer-input]:focus-visible]:ring-border-focus/50',
        ],
      },
    },
    defaultVariants: { elevation: 'raised' },
  },
);

type ChatComposerVariantProps = VariantProps<typeof chatComposerVariants>;

/** `raised` a floating surface (default) · `flat` a field-style border. */
export type ChatComposerElevation = NonNullable<ChatComposerVariantProps['elevation']>;
/** Where a `ChatComposerStatus` is drawn: `above` or `below` the frame. */
export type ChatComposerStatusPosition = 'above' | 'below';

/** What `onSubmit` may return: `false` (or a promise of it) keeps the draft. */
export type ChatComposerSubmitResult = void | boolean | Promise<void | boolean>;

export type ChatComposerProps = Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'defaultValue'> & {
  /** The draft (controlled). Pair with `onValueChange`. */
  value?: string;
  /**
   * The draft to start with (uncontrolled).
   *
   * @default ''
   */
  defaultValue?: string;
  /** Called with the new draft on every change, including the clear after a send. */
  onValueChange?: (value: string) => void;
  /**
   * Called with the draft when the user sends it (Enter, or the Send
   * button). Never called with an empty or whitespace-only draft, while
   * `streaming`, or while `disabled`.
   *
   * The draft is CLEARED after it, so the box is ready for the next message.
   * To keep it when sending fails:
   *   - return `false` (synchronously): the draft is not cleared;
   *   - return a promise: the draft is cleared at once (it reads as sent) and
   *     PUT BACK if the promise rejects or resolves `false`, unless the user
   *     has started typing something new meanwhile. Show why with a
   *     `ChatComposerStatus`; the rejection is treated as handled here.
   * Controlled (`value`)? The clear and the restore arrive as
   * `onValueChange('')` / `onValueChange(draft)`.
   */
  onSubmit?: (value: string) => ChatComposerSubmitResult;
  /**
   * A reply is streaming in: Send becomes Stop, Escape in the input stops,
   * and nothing can be sent until it ends. The draft stays editable.
   *
   * @default false
   */
  streaming?: boolean;
  /** Called when the user asks the streaming reply to stop (Stop, or Escape). */
  onStop?: () => void;
  /**
   * Disable the whole composer: the input, Send, and every control you put in
   * the frame (the frame is a disabled `<fieldset>`). While `streaming` only
   * the input is disabled, so Stop always works.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * `raised`: the raised surface and `shadow-raised`, for a composer that
   * floats over the conversation. `flat`: a field-style border with Input's
   * rest / hover / focus treatment, for one set into a page or a panel.
   *
   * @default 'raised'
   */
  elevation?: ChatComposerElevation;
  /**
   * Where a `ChatComposerStatus` child is drawn. Above keeps it in view when
   * the composer is docked to the bottom of the screen.
   *
   * @default 'above'
   */
  statusPosition?: ChatComposerStatusPosition;
};

function isThenable(value: unknown): value is PromiseLike<void | boolean> {
  return !!value && typeof (value as PromiseLike<unknown>).then === 'function';
}

export const ChatComposer = React.forwardRef<HTMLFormElement, ChatComposerProps>(function ChatComposer(
  {
    className,
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSubmit,
    streaming = false,
    onStop,
    disabled = false,
    elevation = 'raised',
    statusPosition = 'above',
    children,
    ...props
  },
  ref,
) {
  const [value, setValueState] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: 'ChatComposer',
  });
  const draft = value ?? '';
  // Read inside async callbacks (a restore after a failed send).
  const valueRef = React.useRef(draft);
  valueRef.current = draft;
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const inputId = useId();
  const resolvedElevation: ChatComposerElevation = elevation === 'flat' ? 'flat' : 'raised';
  const canSubmit = !disabled && !streaming && draft.trim() !== '';

  const setValue = React.useCallback(
    (next: string) => {
      valueRef.current = next;
      setValueState(next);
    },
    [setValueState],
  );

  const focusInput = React.useCallback(() => {
    const el = inputRef.current;
    if (el && !el.disabled) el.focus();
  }, []);

  // Everything the callbacks read, so they can stay stable.
  const latest = React.useRef({ canSubmit, onSubmit, onStop });
  latest.current = { canSubmit, onSubmit, onStop };

  const submit = React.useCallback(() => {
    const { canSubmit: can, onSubmit: send } = latest.current;
    const sent = valueRef.current;
    if (!can) return;
    const result = send ? send(sent) : undefined;
    if (result === false) return;
    setValue('');
    focusInput();
    if (isThenable(result)) {
      const restore = () => {
        // Only into an empty box: never over what the user typed since.
        if (mounted.current && valueRef.current === '') setValue(sent);
      };
      result.then((ok) => {
        if (ok === false) restore();
      }, restore);
    }
  }, [setValue, focusInput]);

  const stop = React.useCallback(() => {
    latest.current.onStop?.();
    focusInput();
  }, [focusInput]);

  const context = React.useMemo<ChatComposerContextValue>(
    () => ({ value: draft, setValue, canSubmit, submit, stop, streaming, disabled, inputId, inputRef, focusInput }),
    [draft, setValue, canSubmit, submit, stop, streaming, disabled, inputId, focusInput],
  );

  // A status is drawn outside the frame, above or below it. Attachments too:
  // they sit on a tray BEHIND the frame, not inside it (user decision
  // 2026-09-27), so the input keeps the whole box.
  const parts = React.Children.toArray(children);
  const statuses = parts.filter((c) => React.isValidElement(c) && c.type === ChatComposerStatus);
  const trays = parts.filter((c) => React.isValidElement(c) && c.type === ChatComposerAttachments);
  const lifted = [...statuses, ...trays];
  const body = lifted.length ? parts.filter((c) => !lifted.includes(c)) : children;

  return (
    <ChatComposerContext.Provider value={context}>
      <form
        ref={ref}
        data-slot="chat-composer"
        data-elevation={resolvedElevation}
        data-streaming={streaming ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        data-status-position={statusPosition}
        noValidate
        className={cn('group/chat-composer @container/chat-composer flex w-full min-w-0 flex-col', className)}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        {...props}
      >
        {statusPosition === 'above' ? statuses : null}
        {trays.length ? (
          // Its own fieldset, so `disabled` still reaches the remove buttons.
          <fieldset role="none" disabled={disabled && !streaming} data-slot="chat-composer-tray" className="m-0 min-w-0 border-0 p-0">
            {trays}
          </fieldset>
        ) : null}
        {/* A fieldset, so `disabled` reaches EVERY control in the frame, your
            attach and model buttons included, with no prop on each. Not while
            streaming: Stop must stay usable. role="none": the form is the
            group; a nameless fieldset would add an empty one. */}
        <fieldset
          role="none"
          disabled={disabled && !streaming}
          data-slot="chat-composer-body"
          // Buttons read this to take the raised surface's hover fills.
          data-elevation={resolvedElevation === 'raised' ? 'raised' : undefined}
          data-disabled={disabled ? '' : undefined}
          className={cn(
            chatComposerVariants({ elevation: resolvedElevation }),
            // Drawn over the tray's bottom edge, so the tray reads as tucked
            // behind the frame.
            'z-raised',
            'data-[disabled]:border-action-disabled-border data-[disabled]:bg-field-disabled data-[disabled]:shadow-none',
          )}
          // A press on the frame's own padding goes to the input, so the
          // whole box reads as one field. Controls inside keep their press.
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
              focusInput();
            }
          }}
        >
          {body}
        </fieldset>
        {statusPosition === 'below' ? statuses : null}
      </form>
    </ChatComposerContext.Provider>
  );
});
ChatComposer.displayName = 'ChatComposer';

/* ---- ChatComposerInput ------------------------------------------------------ */

const supportsFieldSizing = () =>
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('field-sizing', 'content');

export type ChatComposerInputProps = Omit<TextareaProps, 'value' | 'defaultValue' | 'autoResize'> & {
  /**
   * Enter sends (Shift+Enter is a newline). `false`: Enter is always a
   * newline and only the Send button sends; Ctrl/⌘+Enter still sends.
   *
   * @default true
   */
  submitOnEnter?: boolean;
};

/**
 * The draft. Our Textarea with `autoResize` (`field-sizing: content`; a
 * measured height where that is unsupported), one row at rest, growing to a
 * 12rem max and then scrolling. Its name is `aria-label` ("Message" by
 * default) or a label pointing at its `id`. No border of its own: the frame
 * draws the field.
 *
 * Keys: Enter sends, Shift+Enter inserts a newline, Ctrl/⌘+Enter sends. An
 * Enter pressed to COMMIT an IME composition (Hindi, Japanese, Chinese) never
 * sends: `isComposing`, keyCode 229 (Safari reports the commit that way) and
 * the composition events are all checked. Escape stops a streaming reply.
 */
export const ChatComposerInput = React.forwardRef<HTMLTextAreaElement, ChatComposerInputProps>(
  function ChatComposerInput(
    {
      className,
      submitOnEnter = true,
      rows = 1,
      id,
      disabled,
      onChange,
      onKeyDown,
      onCompositionStart,
      onCompositionEnd,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      ...props
    },
    forwardedRef,
  ) {
    const ctx = useChatComposer('ChatComposerInput');
    const localRef = React.useRef<HTMLTextAreaElement | null>(null);
    const ref = useComposedRefs(forwardedRef, localRef, ctx.inputRef);
    const composing = React.useRef(false);

    // The virtual keyboard's Enter key says what Enter does. Set on the node:
    // React 16 does not know the `enterKeyHint` prop and warns on it.
    useIsoLayoutEffect(() => {
      localRef.current?.setAttribute('enterkeyhint', submitOnEnter ? 'send' : 'enter');
    }, [submitOnEnter]);

    // Where `field-sizing: content` is missing (Firefox, older Safari), grow
    // by measuring. The CSS max height still caps it, then it scrolls.
    useIsoLayoutEffect(() => {
      const el = localRef.current;
      if (!el || supportsFieldSizing()) return;
      el.style.height = 'auto';
      if (el.scrollHeight > 0) el.style.height = `${el.scrollHeight}px`;
    }, [ctx.value]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Only YOUR handler cancels ours. An Escape an enclosing SideDrawer or
      // Dialog already prevented (to stay open while a reply streams) must
      // still reach Stop.
      const preventedBefore = event.defaultPrevented;
      onKeyDown?.(event);
      if (event.defaultPrevented && !preventedBefore) return;
      if (event.key === 'Escape' && ctx.streaming) {
        event.preventDefault();
        ctx.stop();
        return;
      }
      if (event.key !== 'Enter' || preventedBefore) return;
      const native = event.nativeEvent as KeyboardEvent;
      if (native.isComposing || event.keyCode === 229 || composing.current) return;
      if (event.shiftKey || event.altKey) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (!submitOnEnter && !modifier) return;
      event.preventDefault();
      ctx.submit();
    };

    return (
      <Textarea
        ref={ref}
        id={id ?? ctx.inputId}
        data-slot="chat-composer-input"
        rows={rows}
        autoResize
        value={ctx.value}
        disabled={disabled ?? ctx.disabled}
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Message')}
        aria-labelledby={ariaLabelledBy}
        onChange={(event) => {
          onChange?.(event);
          ctx.setValue(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onCompositionStart={(event) => {
          composing.current = true;
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          onCompositionEnd?.(event);
        }}
        className={cn(
          // The frame is the field: no border, fill, ring or radius here.
          'min-h-0 rounded-none border-0 bg-transparent px-2 py-2 shadow-none',
          'focus-visible:ring-0 disabled:bg-transparent',
          // Grows with the text to 12rem, then scrolls.
          'max-h-48 overflow-y-auto',
          className,
        )}
        {...props}
      />
    );
  },
);
ChatComposerInput.displayName = 'ChatComposerInput';

/* ---- ChatComposerSend -------------------------------------------------------- */

export type ChatComposerSendProps = Omit<IconButtonProps, 'aria-label' | 'children' | 'variant' | 'type'> & {
  /**
   * The name while it sends.
   *
   * @default 'Send message'
   */
  'aria-label'?: string;
  /**
   * The name while a reply is streaming and it stops it.
   *
   * @default 'Stop generating'
   */
  stopLabel?: string;
  /** The send glyph. Defaults to an up arrow. */
  icon?: React.ReactNode;
  /** The stop glyph. Defaults to a filled square. */
  stopIcon?: React.ReactNode;
};

/**
 * The primary action: an up arrow that sends, and while `streaming` a square
 * that stops ("Stop generating"), never disabled. Disabled (the `disabled`
 * attribute, per Button's rules: unavailable, not busy) while the draft is
 * empty or whitespace; if it held focus when it became disabled (the send
 * that just cleared the draft, the reply that just finished), focus moves to
 * the input rather than falling to the page. 40px (`md`), with the 44px touch
 * target every Button has on a coarse pointer; set `size` to change it (it
 * does not follow the footer's `sm`).
 */
export const ChatComposerSend = React.forwardRef<HTMLButtonElement, ChatComposerSendProps>(function ChatComposerSend(
  {
    'aria-label': label = 'Send message',
    stopLabel = 'Stop generating',
    icon,
    stopIcon,
    size = 'md',
    disabled: disabledProp,
    onClick,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const ctx = useChatComposer('ChatComposerSend');
  const isStop = ctx.streaming;
  const disabled = !isStop && (!!disabledProp || !ctx.canSubmit);
  const focused = React.useRef(false);

  useIsoLayoutEffect(() => {
    if (disabled && focused.current) {
      focused.current = false;
      ctx.focusInput();
    }
  }, [disabled]);

  return (
    <IconButton
      ref={ref}
      data-slot="chat-composer-send"
      data-state={isStop ? 'stop' : 'send'}
      variant="primary"
      size={size}
      type={isStop ? 'button' : 'submit'}
      aria-label={isStop ? stopLabel : label}
      disabled={disabled}
      onFocus={(event) => {
        focused.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focused.current = false;
        onBlur?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (isStop) {
          event.preventDefault();
          ctx.stop();
        }
        // Send: type="submit" submits the form, which calls `submit()`.
      }}
      {...props}
    >
      {isStop ? (stopIcon ?? <StopGlyph />) : (icon ?? <SendGlyph />)}
    </IconButton>
  );
});
ChatComposerSend.displayName = 'ChatComposerSend';

/* ---- ChatComposerAttachments ------------------------------------------------- */

export type ChatComposerAttachmentsProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Names the strip for assistive tech.
   *
   * @default 'Attachments'
   */
  'aria-label'?: string;
  /**
   * More attachments than this and the strip gets a toggle that collapses
   * it to a summary ("5 files").
   *
   * @default 3
   */
  collapseAfter?: number;
  /** Expanded (controlled), when collapsible. */
  expanded?: boolean;
  /**
   * Expanded at first (uncontrolled), when collapsible.
   *
   * @default true
   */
  defaultExpanded?: boolean;
  /** Called when the toggle expands or collapses the strip. */
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * The toggle's text for a count.
   *
   * @default (n) => `${n} files`
   */
  summary?: (count: number) => React.ReactNode;
};

/**
 * The files and context attached to the draft: a wrapping row of
 * `ChatComposerAttachment`s on a lower, grey tray (`surface-tray`) tucked
 * behind the composer's frame. ChatComposer lifts it out of the frame
 * wherever it appears among the children. Past `collapseAfter` a toggle
 * ("5 files", `aria-expanded`) folds the row away and back.
 */
export const ChatComposerAttachments = React.forwardRef<HTMLDivElement, ChatComposerAttachmentsProps>(
  function ChatComposerAttachments(
    {
      className,
      'aria-label': label = 'Attachments',
      collapseAfter = 3,
      expanded: expandedProp,
      defaultExpanded = true,
      onExpandedChange,
      summary = (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
      children,
      ...props
    },
    ref,
  ) {
    useChatComposer('ChatComposerAttachments');
    const [expanded, setExpanded] = useControllableState({
      prop: expandedProp,
      defaultProp: defaultExpanded,
      onChange: onExpandedChange,
      caller: 'ChatComposerAttachments',
    });
    const listId = useId();
    const count = React.Children.toArray(children).filter(React.isValidElement).length;
    if (count === 0) return null;
    const collapsible = count > collapseAfter;
    const open = !collapsible || !!expanded;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        data-slot="chat-composer-attachments"
        data-state={collapsible ? (open ? 'expanded' : 'collapsed') : undefined}
        className={cn(
          // THE TRAY (2026-09-27): a lower, grey surface behind the composer,
          // not a strip inside it. `surface-tray` is one neutral step below
          // the raised frame in both modes (#F5F5F5 under white, #121212
          // under #212121), with no shadow of its own. It is inset from the
          // frame's sides and runs 0.5rem under its top edge (the frame is
          // drawn over it), so it reads as tucked behind; the extra bottom
          // padding is what the frame covers.
          'mx-2 -mb-2 flex min-w-0 flex-col items-start gap-2 rounded-t-lg border border-b-0 border-border-decorative bg-surface-tray px-3 pt-2 pb-4',
          '@max-[24rem]/chat-composer:mx-1 @max-[24rem]/chat-composer:px-2',
          className,
        )}
        {...props}
      >
        {collapsible ? (
          <Button
            data-slot="chat-composer-attachments-toggle"
            variant="neutral"
            size="sm"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setExpanded(!open)}
          >
            <PaperclipGlyph />
            {summary(count)}
            <CaretGlyph
              className={cn(
                'transition-transform duration-[var(--motion-duration-fast)] ease-productive-in-out motion-reduce:transition-none',
                open && 'rotate-180',
              )}
            />
          </Button>
        ) : null}
        <ul
          id={listId}
          data-slot="chat-composer-attachments-list"
          hidden={!open}
          className="m-0 flex w-full min-w-0 list-none flex-wrap gap-2 p-0 [&[hidden]]:hidden"
        >
          {children}
        </ul>
      </div>
    );
  },
);
ChatComposerAttachments.displayName = 'ChatComposerAttachments';

export type ChatComposerAttachmentStatus = 'ready' | 'uploading' | 'error';

export type ChatComposerAttachmentProps = Omit<React.LiHTMLAttributes<HTMLLIElement>, 'children'> & {
  /** The file or context name ("binary-search.py"). */
  children: React.ReactNode;
  /** A leading glyph for the file type. Replaced by a warning glyph while `error` is set. */
  icon?: React.ReactNode;
  /**
   * Makes it removable: a ✕ that calls this. Focus then moves to the next
   * attachment's ✕ (or the previous one, or the input).
   */
  onRemove?: () => void;
  /**
   * The ✕'s name.
   *
   * @default `Remove ${name}`
   */
  removeLabel?: string;
  /** Upload progress, 0–100: a bar under the chip until it reaches 100. */
  progress?: number;
  /** Why it failed ("Too large: 25 MB max"). Shown under the chip in danger ink. */
  error?: React.ReactNode;
};

/**
 * One attached file: a removable Chip, with an upload bar (ProgressBar) or
 * an error line under it.
 */
export const ChatComposerAttachment = React.forwardRef<HTMLLIElement, ChatComposerAttachmentProps>(
  function ChatComposerAttachment(
    { className, children, icon, onRemove, removeLabel, progress, error, ...props },
    forwardedRef,
  ) {
    const ctx = useChatComposer('ChatComposerAttachment');
    const localRef = React.useRef<HTMLLIElement | null>(null);
    const ref = useComposedRefs(forwardedRef, localRef);
    const hasError = error != null && error !== false && error !== '';
    const uploading = !hasError && typeof progress === 'number' && progress < 100;
    const status: ChatComposerAttachmentStatus = hasError ? 'error' : uploading ? 'uploading' : 'ready';
    const name = typeof children === 'string' ? children : undefined;
    const glyph = hasError ? (
      <span data-slot="chat-composer-attachment-error-icon" className="flex text-danger-icon">
        <WarningGlyph />
      </span>
    ) : (
      icon
    );

    const handleRemove = () => {
      // Hand focus on BEFORE the row goes, so it never drops to the page.
      const li = localRef.current;
      const sibling = (el: Element | null | undefined) =>
        el?.querySelector<HTMLElement>('[data-slot="chip-remove"]:not(:disabled)') ?? null;
      const target = sibling(li?.nextElementSibling) ?? sibling(li?.previousElementSibling);
      if (target) target.focus();
      else ctx.focusInput();
      onRemove?.();
    };

    return (
      <li
        ref={ref}
        data-slot="chat-composer-attachment"
        data-status={status}
        className={cn('flex min-w-0 max-w-full flex-col gap-1', className)}
        {...props}
      >
        {onRemove ? (
          <Chip onRemove={handleRemove} removeLabel={removeLabel} icon={glyph} disabled={ctx.disabled}>
            {children}
          </Chip>
        ) : (
          // Not removable: the chip's look with no control in it (a Chip
          // without onRemove would be a toggle button).
          <span data-slot="chip" className={chipVariants()}>
            {glyph}
            <span data-slot="chip-label" className="min-w-0 truncate">
              {children}
            </span>
          </span>
        )}
        {uploading ? (
          <ProgressBar
            data-slot="chat-composer-attachment-progress"
            value={progress}
            aria-label={name ? `Uploading ${name}` : 'Uploading'}
            className="h-1"
          />
        ) : null}
        {hasError ? (
          <span data-slot="chat-composer-attachment-error" className="type-caption text-danger-content">
            {error}
          </span>
        ) : null}
      </li>
    );
  },
);
ChatComposerAttachment.displayName = 'ChatComposerAttachment';

/* ---- ChatComposerHeader / ChatComposerFooter --------------------------------------- */

/** The toolbar chrome removed: the composer's frame is the only box. */
const barToolbarClass = 'min-w-0 gap-1 rounded-none border-0 bg-transparent p-0';

export type ChatComposerHeaderProps = ToolbarProps;

/**
 * A row of actions or context above the input (the topic, a context meter).
 * A Toolbar with `size="sm"`: every Button, IconButton and ToggleButton in it
 * is small unless it says otherwise. `ToolbarSpacer` splits start from end.
 * `className` and the ref go to the row; every other prop to the Toolbar.
 */
export const ChatComposerHeader = React.forwardRef<HTMLDivElement, ChatComposerHeaderProps>(
  function ChatComposerHeader({ className, size = 'sm', 'aria-label': label = 'Message context', ...props }, ref) {
    useChatComposer('ChatComposerHeader');
    return (
      <div ref={ref} data-slot="chat-composer-header" className={cn('flex min-w-0 px-1', className)}>
        <Toolbar size={size} aria-label={label} className={cn(barToolbarClass, 'flex-1')} {...props} />
      </div>
    );
  },
);
ChatComposerHeader.displayName = 'ChatComposerHeader';

export type ChatComposerFooterProps = ToolbarProps;

/**
 * The row under the input: attach, a model picker, a context meter, and
 * `ChatComposerSend`. The actions are a Toolbar with `size="sm"` (one tab
 * stop, arrow keys between them); a ChatComposerSend child is lifted out of
 * it to the row's end, its own tab stop, so Tab from the input reaches Send
 * in two steps at most. On a narrow composer the actions wrap and Send holds
 * the end of the last line. `className` and the ref go to the row; every
 * other prop to the Toolbar.
 */
export const ChatComposerFooter = React.forwardRef<HTMLDivElement, ChatComposerFooterProps>(
  function ChatComposerFooter(
    { className, size = 'sm', 'aria-label': label = 'Message options', children, ...props },
    ref,
  ) {
    useChatComposer('ChatComposerFooter');
    const parts = React.Children.toArray(children);
    const sends = parts.filter((c) => React.isValidElement(c) && c.type === ChatComposerSend);
    const actions = parts.filter((c) => !sends.includes(c));
    return (
      <div ref={ref} data-slot="chat-composer-footer" className={cn('flex min-w-0 items-end gap-2', className)}>
        {actions.length ? (
          <Toolbar size={size} aria-label={label} className={cn(barToolbarClass, 'flex-1')} {...props}>
            {actions}
          </Toolbar>
        ) : (
          <span data-slot="chat-composer-footer-spacer" aria-hidden="true" className="flex-1" />
        )}
        {sends}
      </div>
    );
  },
);
ChatComposerFooter.displayName = 'ChatComposerFooter';

/* ---- ChatComposerStatus ------------------------------------------------------ */

export type ChatComposerStatusProps = Omit<AlertProps, 'role'>;

/**
 * Inline feedback about the message: "Couldn't send", "Context window is 90%
 * full". An Alert (tone, title, description, dismiss) inside a polite live
 * region that is ALWAYS mounted, so a message that appears later is
 * announced, at the next pause, whatever the tone: keep the part rendered
 * and pass a title only when there is something to say. Drawn outside the
 * frame, above or below it (`statusPosition` on ChatComposer).
 */
export const ChatComposerStatus = React.forwardRef<HTMLDivElement, ChatComposerStatusProps>(
  function ChatComposerStatus({ className, title, description, children, tone, ...props }, ref) {
    useChatComposer('ChatComposerStatus');
    const has = (node: React.ReactNode) => node != null && node !== false && node !== '';
    const show = has(title) || has(description) || has(children);
    // A new message is a new Alert (a dismissed one does not swallow the next).
    const key = `${tone ?? 'info'}:${typeof title === 'string' ? title : ''}:${
      typeof description === 'string' ? description : ''
    }`;
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-slot="chat-composer-status"
        className={cn(
          'min-w-0',
          'group-data-[status-position=above]/chat-composer:[&:not(:empty)]:mb-2',
          'group-data-[status-position=below]/chat-composer:[&:not(:empty)]:mt-2',
        )}
      >
        {show ? (
          <Alert
            key={key}
            role="none"
            tone={tone}
            title={title}
            description={description}
            className={cn('p-3', className)}
            {...props}
          >
            {children}
          </Alert>
        ) : null}
      </div>
    );
  },
);
ChatComposerStatus.displayName = 'ChatComposerStatus';
