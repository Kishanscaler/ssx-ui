'use client';

// Client: follows the conversation (useStickToBottom: scroll listeners and
// observers), measures the dock, counts messages that arrive while the reader
// is scrolled up, and shares that state with the scroll button in context.
import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { useStickToBottom, type StickToBottomBehavior } from '../../lib/use-stick-to-bottom';
import { Badge } from '../Badge';
import { GlassButton, type GlassButtonProps } from '../GlassButton';
import { Stack } from '../Stack';

/* ---------------------------------------------------------------------------
 * ChatLayout, ChatLayoutDock, ChatLayoutScrollButton
 *
 * The shell of a chat surface: the conversation scrolling above, the composer
 * docked below it on frosted glass, and a button back to the latest message.
 *
 *   <ChatLayout
 *     composer={<ChatComposer onSubmit={send}>…</ChatComposer>}
 *     emptyState={<EmptyState title="Ask the DSA tutor anything" />}
 *     empty={messages.length === 0}
 *   >
 *     <ChatMessageList aria-label="Conversation with Scaler Tutor">…</ChatMessageList>
 *   </ChatLayout>
 *
 * IT FILLS ITS CONTAINER. No height of its own: `h-full`, `flex-1` and
 * `min-h-0`, so it takes the height a flex column, a grid row or a sized box
 * gives it — a full page, a 400×640 card, a SideDrawer (as the drawer's
 * middle row, in place of SideDrawerBody), a ResizePane, a BottomSheet at
 * `size="full"`. Density follows the CONTAINER, not the viewport
 * (`@container/chat-layout`): 16px padding below a 36rem-wide layout (a
 * drawer, a side panel, a phone), 24px from there, the same step
 * ChatMessageList takes. On a wide screen the column is centred and capped
 * at the prose measure plus the avatar column (`width="measure"`), so the
 * student's bubbles never drift a metre from the tutor's answers.
 *
 * THE MESSAGE AREA scrolls (it is the layout's own scroller), or, with
 * `scrollContainer`, the page or a parent element scrolls it. Content is
 * pushed to the bottom while the conversation is short, as in any chat.
 *
 * STICK TO BOTTOM (lib/use-stick-to-bottom). While the reader is at the end,
 * it stays at the end as a reply streams in. Once they scroll up, nothing
 * moves them; the scroll button appears, counting the messages that have
 * arrived since (`[data-slot=chat-message]`, not the reader's own). Scrolling
 * back to the end, pressing the button, or SENDING a message re-engages it.
 *
 * THE DOCK is `position: sticky` at the end of the scroll, not fixed: it
 * stays on screen while the messages scroll under it, and at the end of the
 * scroll it sits AFTER the last message, so it can never cover it. Its
 * height is still measured, into `--chat-layout-dock-height` on the root,
 * and used as the scroller's `scroll-padding-bottom`, so Tab into a message
 * half under the dock (a Retry button) scrolls it clear. Its material is the
 * GlassButton's: the `glass` tint with `blur(12px) saturate(180%)`, masked
 * to fade in over its top 1.5rem so a line of text passing under it melts
 * away instead of being cut. Opaque, with the same fade, under reduced
 * transparency, more contrast, forced colours or no backdrop-filter; the
 * opaque colour is the page, or the raised surface inside a raised layer
 * (`data-elevation="raised"`: SideDrawer, BottomSheet, Dialog).
 *
 * THE SCROLL-PAD CONTRACT (see FormActions). With `scrollContainer` pointing
 * at a padded scroller that declares `--scroll-pad-x` / `--scroll-pad-bottom`,
 * the dock reaches through that padding to the visible edges. The layout's
 * own scroller resets both to 0, so a variable declared further up (a
 * SideDrawerBody) never leaks in.
 *
 * ACCESSIBILITY. The ChatMessageList inside stays the `role="log"`: new
 * messages are announced by it, politely, and focus is never moved when
 * they arrive. The scroll button is out of the tab order and the
 * accessibility tree while the reader is at the end; when it is pressed from
 * the keyboard and disappears, focus goes to the composer's input rather
 * than to the page. The empty state is shown BESIDE the (empty) list, not
 * instead of it, so the log exists before its first message and that message
 * is announced.
 * ------------------------------------------------------------------------- */

/* ---- context -------------------------------------------------------------- */

export type ChatLayoutContextValue = {
  /** The reader is at the end of the conversation (stick-to-bottom engaged). */
  isAtBottom: boolean;
  /** Messages (not the reader's own) that arrived while they were scrolled up. */
  newMessageCount: number;
  /** Re-engage stick-to-bottom and scroll to the latest message. */
  scrollToBottom: (options?: { behavior?: StickToBottomBehavior }) => void;
  /** Move focus to the composer's input, when the dock holds one. */
  focusComposer: () => boolean;
};

const ChatLayoutContext = React.createContext<ChatLayoutContextValue | null>(null);

type DockContextValue = {
  dockRef: (node: HTMLDivElement | null) => void;
  scrollButton: React.ReactNode;
};
const DockContext = React.createContext<DockContextValue | null>(null);

/* Where a Dock that could NOT be lifted out of the children goes. A Dock is
 * lifted by element type; children that reach a client component from a
 * React Server Component are references whose type is not the component, so
 * the check misses and the Dock would render among the messages. Such a Dock
 * portals itself into this placeholder at the dock position instead (after
 * mount: a portal cannot render on the server). The placeholder is
 * `display: contents`, so the Dock still sticks to the layout's scroller. */
const DockPortalContext = React.createContext<HTMLElement | null>(null);
/** True around a Dock rendered at the dock position itself. */
const InDockSlotContext = React.createContext(false);

/**
 * The layout's scroll state, for a custom part (your own scroll button, a
 * "jump to latest" link in a header). Throws outside a `ChatLayout`.
 */
export function useChatLayout(part = 'useChatLayout'): ChatLayoutContextValue {
  const ctx = React.useContext(ChatLayoutContext);
  if (!ctx) throw new Error(`${part} must be used inside a <ChatLayout>.`);
  return ctx;
}

/* `useLayoutEffect` warns during server rendering on React < 19. */
const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

const MESSAGE = '[data-slot="chat-message"]';
const COMPOSER_INPUT = '[data-slot="chat-composer-input"]';

/** Anything that renders (toArray drops null, undefined and booleans). */
const isRendered = (node: React.ReactNode) => React.Children.toArray(node).some((c) => c !== '');

/* ---- glyph (Phosphor 2.1.1, MIT) -------------------------------------------- */

/** `arrow-down` bold. */
function ArrowDownGlyph() {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M208.49,152.49l-72,72a12,12,0,0,1-17,0l-72-72a12,12,0,0,1,17-17L116,187V40a12,12,0,0,1,24,0V187l51.51-51.52a12,12,0,0,1,17,17Z" />
    </svg>
  );
}

/* ---- ChatLayout -------------------------------------------------------------- */

export const chatLayoutVariants = cva(
  [
    // The container every part measures against. It cannot style itself by
    // its own width, so the padding steps live on the viewport below.
    '@container/chat-layout relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col',
    'font-sans text-content',
    // The surface the dock turns opaque into: the page, or the raised layer
    // it sits in (SideDrawer, BottomSheet, Dialog set data-elevation).
    '[--chat-layout-surface:var(--surface-page)]',
    'in-data-[elevation=raised]:[--chat-layout-surface:var(--surface-raised)]',
  ],
);

const viewportDensity = {
  auto: '[--chat-layout-pad:var(--space-4)] @min-[36rem]/chat-layout:[--chat-layout-pad:var(--space-6)]',
  compact: '[--chat-layout-pad:var(--space-4)]',
  comfortable: '[--chat-layout-pad:var(--space-6)]',
} as const;

/** `auto` by the layout's width · `compact` 16px · `comfortable` 24px. */
export type ChatLayoutDensity = 'auto' | 'compact' | 'comfortable';
/** `measure` a centred column at the prose measure plus the avatar · `full` the whole width. */
export type ChatLayoutWidth = 'measure' | 'full';
/** `self` the layout scrolls · `page` the document scrolls · a ref: that element scrolls. */
export type ChatLayoutScrollContainer = 'self' | 'page' | React.RefObject<HTMLElement | null>;

export type ChatLayoutProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The composer, docked at the bottom on frosted glass (usually a
   * `ChatComposer`). Or put a `ChatLayoutDock` among the children.
   */
  composer?: React.ReactNode;
  /**
   * Shown, centred in the message area, while the conversation is `empty`:
   * usually an `EmptyState` and a few suggestion chips that fill the
   * composer.
   */
  emptyState?: React.ReactNode;
  /**
   * The conversation has no messages yet. Defaults to "no children". Pass it
   * when the children are an empty `ChatMessageList` (keep the list
   * rendered: it is the live region the first message is announced from).
   */
  empty?: boolean;
  /**
   * The button back to the latest message, shown above the composer while
   * the reader is scrolled up. `null` for none; your own element to replace
   * it (read the state with `useChatLayout`).
   *
   * @default <ChatLayoutScrollButton />
   */
  scrollButton?: React.ReactNode;
  /**
   * What scrolls. `self`: the message area is the scroller (give the layout
   * a height through its container). `page`: the document scrolls and the
   * dock sticks to the bottom of the viewport. A ref: that ancestor element
   * scrolls (a padded one should declare the scroll-pad contract).
   *
   * @default 'self'
   */
  scrollContainer?: ChatLayoutScrollContainer;
  /**
   * `auto`: 16px padding below a 36rem-wide layout, 24px from there.
   * `compact` / `comfortable` pin it.
   *
   * @default 'auto'
   */
  density?: ChatLayoutDensity;
  /**
   * `measure`: the messages and the composer share a centred column, the
   * prose measure (72ch) plus the avatar column. `full`: edge to edge.
   *
   * @default 'measure'
   */
  width?: ChatLayoutWidth;
  /**
   * How close to the end (px) still counts as the bottom.
   *
   * @default 32
   */
  bottomThreshold?: number;
  /** Called when the reader leaves or returns to the end of the conversation. */
  onAtBottomChange?: (atBottom: boolean) => void;
  /** The conversation: a `ChatMessageList` (and a `ChatLayoutDock`, if not using `composer`). */
  children?: React.ReactNode;
};

export const ChatLayout = React.forwardRef<HTMLDivElement, ChatLayoutProps>(function ChatLayout(
  {
    className,
    composer,
    emptyState,
    empty,
    scrollButton,
    scrollContainer = 'self',
    density = 'auto',
    width = 'measure',
    bottomThreshold = 32,
    onAtBottomChange,
    children,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const ref = useComposedRefs(forwardedRef, rootRef);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const areaRef = React.useRef<HTMLDivElement | null>(null);
  const [dock, setDock] = React.useState<HTMLDivElement | null>(null);
  const [newMessageCount, setNewMessageCount] = React.useState(0);

  const stick = useStickToBottom({
    threshold: bottomThreshold,
    onChange: (atBottom) => {
      if (atBottom) setNewMessageCount(0);
      onAtBottomChange?.(atBottom);
    },
  });
  const { scrollRef, contentRef, scrollToBottom, isStuck } = stick;
  const own = scrollContainer === 'self';
  const resolvedDensity: ChatLayoutDensity =
    density === 'compact' || density === 'comfortable' ? density : 'auto';

  // Attach the scroller: ours, the page, or the caller's element.
  const viewportCallback = React.useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      if (own) scrollRef(node);
    },
    [own, scrollRef],
  );
  useIsoLayoutEffect(() => {
    if (own) return;
    if (scrollContainer === 'page') scrollRef(document.documentElement);
    else scrollRef(scrollContainer.current);
  });

  // The dock's height, as a variable (no re-render): the scroller's
  // scroll-padding, and anything of yours positioned against the dock.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!dock || !root) return undefined;
    const write = () => {
      root.style.setProperty('--chat-layout-dock-height', `${Math.round(dock.getBoundingClientRect().height)}px`);
    };
    write();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(write);
    observer.observe(dock);
    return () => observer.disconnect();
  }, [dock]);

  // Messages arriving: counted while the reader is scrolled up; the
  // reader's OWN message (they just sent it) takes them to the end.
  React.useEffect(() => {
    const area = areaRef.current;
    if (!area || typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver((records) => {
      let others = 0;
      let mine = false;
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          const found = node.matches(MESSAGE) ? [node] : Array.from(node.querySelectorAll(MESSAGE));
          for (const message of found) {
            if (message.getAttribute('data-from') === 'user') mine = true;
            else others += 1;
          }
        });
      }
      if (mine) {
        scrollToBottom();
        return;
      }
      if (others && !isStuck()) setNewMessageCount((n) => n + others);
    });
    observer.observe(area, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [scrollToBottom, isStuck]);

  const focusComposer = React.useCallback(() => {
    const input = dock?.querySelector<HTMLElement>(COMPOSER_INPUT);
    if (!input || (input as HTMLTextAreaElement).disabled) return false;
    // No scroll: it is on screen, and a focus scroll would cancel a smooth
    // scroll to the latest message that is still running.
    input.focus({ preventScroll: true });
    return true;
  }, [dock]);

  const context = React.useMemo<ChatLayoutContextValue>(
    () => ({ isAtBottom: stick.isAtBottom, newMessageCount, scrollToBottom, focusComposer }),
    [stick.isAtBottom, newMessageCount, scrollToBottom, focusComposer],
  );

  // A ChatLayoutDock among the children is lifted out to the dock position.
  const parts = React.Children.toArray(children);
  const docks = parts.filter((c) => React.isValidElement(c) && c.type === ChatLayoutDock);
  const body = docks.length ? parts.filter((c) => !docks.includes(c)) : children;
  const isEmpty = empty ?? !isRendered(body);
  const showEmpty = isEmpty && isRendered(emptyState);

  const dockContext = React.useMemo<DockContextValue>(
    () => ({ dockRef: setDock, scrollButton: scrollButton === undefined ? <ChatLayoutScrollButton /> : scrollButton }),
    [scrollButton],
  );

  const [portal, setPortal] = React.useState<HTMLElement | null>(null);

  return (
    <ChatLayoutContext.Provider value={context}>
     <DockContext.Provider value={dockContext}>
     <DockPortalContext.Provider value={portal}>
      <div
        ref={ref}
        data-slot="chat-layout"
        data-density={resolvedDensity}
        data-width={width}
        data-scroll-container={own ? 'self' : scrollContainer === 'page' ? 'page' : 'element'}
        data-empty={isEmpty ? '' : undefined}
        data-at-bottom={stick.isAtBottom ? '' : undefined}
        // Scrolled by something else: as tall as the conversation.
        className={cn(chatLayoutVariants(), !own && 'h-auto', className)}
        {...props}
      >
        <div
          ref={viewportCallback}
          data-slot="chat-layout-viewport"
          className={cn(
            'flex min-h-0 w-full min-w-0 flex-1 flex-col',
            viewportDensity[resolvedDensity],
            // The column: the measure plus the avatar column (28px + 12px), plus the padding.
            width === 'measure'
              ? '[--chat-layout-max:calc(var(--size-measure-max)+2.5rem+2*var(--chat-layout-pad))]'
              : '[--chat-layout-max:100%]',
            own && [
              'overflow-y-auto overscroll-contain',
              // Our scroller pads nothing: a scroll-pad declared further up
              // (a SideDrawerBody) must not reach the dock.
              '[--scroll-pad-x:0px] [--scroll-pad-bottom:0px]',
              // Tab to something under the dock scrolls it clear of it.
              'scroll-pb-(--chat-layout-dock-height)',
            ],
          )}
        >
          <div
            ref={contentRef}
            data-slot="chat-layout-track"
            // Fills the viewport and grows past it: grow, never shrink.
            className="flex w-full min-w-0 flex-[1_0_auto] flex-col"
          >
            <div
              ref={areaRef}
              data-slot="chat-layout-messages"
              className={cn(
                'mx-auto flex w-full min-w-0 max-w-(--chat-layout-max) flex-1 flex-col justify-end',
                'px-(--chat-layout-pad) pt-(--chat-layout-pad)',
              )}
            >
              {showEmpty ? (
                <Stack
                  data-chat-layout-empty=""
                  align="center"
                  justify="center"
                  className="flex-1 py-6 text-center"
                >
                  {emptyState}
                </Stack>
              ) : null}
              {body}
            </div>
            <InDockSlotContext.Provider value>
              {docks.length ? docks : isRendered(composer) || dockContext.scrollButton ? <ChatLayoutDock>{composer}</ChatLayoutDock> : null}
            </InDockSlotContext.Provider>
            <div ref={setPortal} data-slot="chat-layout-dock-portal" className="contents" />
          </div>
        </div>
      </div>
     </DockPortalContext.Provider>
     </DockContext.Provider>
    </ChatLayoutContext.Provider>
  );
});
ChatLayout.displayName = 'ChatLayout';

/* ---- ChatLayoutDock ---------------------------------------------------------- */

export type ChatLayoutDockProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * The bottom of the layout: the composer on a band of frosted glass, sticky
 * at the end of the scroll, with the scroll button floating above it. Use the
 * `composer` prop, or place this among ChatLayout's children for a dock with
 * more in it (a disclaimer line under the composer). It is always drawn
 * last, wherever it is placed. Throws outside a `ChatLayout`.
 */
/** The dock itself: drawn at the dock position by ChatLayoutDock. */
const DockSurface = React.forwardRef<HTMLDivElement, ChatLayoutDockProps & { ctx: DockContextValue }>(function DockSurface(
  { className, children, ctx, ...props },
  forwardedRef,
) {
  const ref = useComposedRefs(forwardedRef, ctx.dockRef);
  return (
    <div
      ref={ref}
      data-slot="chat-layout-dock"
      className={cn(
        // Sticky, in flow: it never covers the last message. The scroll-pad
        // contract takes it through a padded parent scroller's padding.
        'sticky bottom-[calc(-1*var(--scroll-pad-bottom,0px))] z-sticky mt-auto shrink-0',
        '-mx-[var(--scroll-pad-x,0px)] px-[var(--scroll-pad-x,0px)] last:-mb-[var(--scroll-pad-bottom,0px)]',
        // The fade (1.5rem) above the composer, and the home indicator below it.
        '[--chat-layout-fade:1.5rem] pt-(--chat-layout-fade)',
        'pb-[max(var(--chat-layout-pad),env(safe-area-inset-bottom,0px))]',
        className,
      )}
      {...props}
    >
      <div
        data-slot="chat-layout-dock-glass"
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          // GlassButton's material: the gated glass tint, frosted and saturated.
          'bg-glass backdrop-blur-[12px] backdrop-saturate-[180%]',
          // Fades in over the top 1.5rem, so text passing under it melts away.
          '[mask-image:linear-gradient(to_bottom,transparent,black_var(--chat-layout-fade))]',
          // Opaque fallbacks (the reader's settings, then no backdrop filter),
          // the same set GlassButton honours. The fade stays: it is a mask.
          'reduce-transparency:bg-(--chat-layout-surface)! reduce-transparency:backdrop-filter-none!',
          'contrast-more:bg-(--chat-layout-surface)! contrast-more:backdrop-filter-none!',
          'forced-colors:bg-[Canvas]! forced-colors:backdrop-filter-none!',
          'not-supports-[((backdrop-filter:blur(1px))_or_(-webkit-backdrop-filter:blur(1px)))]:bg-(--chat-layout-surface)!',
        )}
      />
      <div
        data-slot="chat-layout-dock-content"
        className="relative mx-auto flex w-full min-w-0 max-w-(--chat-layout-max) flex-col gap-2 px-(--chat-layout-pad)"
      >
        {ctx.scrollButton ? (
          <div
            data-slot="chat-layout-scroll-slot"
            // Above the composer, centred, over the messages. Only the button
            // itself takes the pointer.
            className="pointer-events-none absolute inset-x-0 bottom-full flex justify-center pb-3 [&>*]:pointer-events-auto"
          >
            {ctx.scrollButton}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
});
DockSurface.displayName = 'ChatLayoutDockSurface';

export const ChatLayoutDock = React.forwardRef<HTMLDivElement, ChatLayoutDockProps>(function ChatLayoutDock(
  props,
  forwardedRef,
) {
  const ctx = React.useContext(DockContext);
  const inSlot = React.useContext(InDockSlotContext);
  const portal = React.useContext(DockPortalContext);
  if (!ctx) throw new Error('ChatLayoutDock must be used inside a <ChatLayout>.');
  if (inSlot) return <DockSurface ref={forwardedRef} ctx={ctx} {...props} />;
  // Not lifted (see DockPortalContext): move to the dock position, and render
  // nothing in place (nor on the server, where there is no portal target).
  return portal ? createPortal(<DockSurface ref={forwardedRef} ctx={ctx} {...props} />, portal) : null;
});
ChatLayoutDock.displayName = 'ChatLayoutDock';

/* ---- ChatLayoutScrollButton --------------------------------------------------- */

export type ChatLayoutScrollButtonProps = Omit<GlassButtonProps, 'children' | 'size' | 'aria-label'> & {
  /**
   * The name.
   *
   * @default 'Scroll to latest message'
   */
  'aria-label'?: string;
  /**
   * The number of new messages to show and say. Defaults to the count
   * ChatLayout keeps (messages that arrived while the reader was scrolled up).
   * `0` for none.
   */
  count?: number;
  /**
   * The name with a count.
   *
   * @default (label, n) => `${label}, ${n} new`
   */
  countLabel?: (label: string, count: number) => string;
  /** The glyph. Defaults to a down arrow. */
  icon?: React.ReactNode;
};

/**
 * Back to the latest message: a round, 40px icon GlassButton (glass reads
 * over the messages it floats on) with a down arrow and, when messages
 * arrived while the reader was away, a count Badge. Named "Scroll to latest
 * message" ("…, 3 new" with a count); the badge is hidden from assistive
 * tech because the name says it. 44px to a finger (Button's touch target).
 *
 * Shown while the reader is scrolled up; otherwise invisible, out of the tab
 * order and out of the accessibility tree (it stays mounted so it can fade).
 * Pressed from the keyboard, it hands focus to the composer's input as it
 * disappears. Reads `useChatLayout`, so it throws outside a `ChatLayout`.
 */
export const ChatLayoutScrollButton = React.forwardRef<HTMLButtonElement, ChatLayoutScrollButtonProps>(
  function ChatLayoutScrollButton(
    {
      className,
      'aria-label': label = 'Scroll to latest message',
      count: countProp,
      countLabel = (l, n) => `${l}, ${n} new`,
      icon,
      onClick,
      ...props
    },
    forwardedRef,
  ) {
    const ctx = useChatLayout('ChatLayoutScrollButton');
    const localRef = React.useRef<HTMLButtonElement | null>(null);
    const ref = useComposedRefs(forwardedRef, localRef);
    const visible = !ctx.isAtBottom;
    const count = Math.max(0, Math.floor(countProp ?? ctx.newMessageCount));
    const name = count > 0 ? countLabel(label, count) : label;

    return (
      <div
        data-slot="chat-layout-scroll-button"
        data-state={visible ? 'visible' : 'hidden'}
        aria-hidden={visible ? undefined : true}
        className={cn(
          'relative inline-flex',
          'transition-[opacity,translate,visibility] duration-[var(--motion-duration-fast)] ease-productive-in-out',
          'motion-reduce:transition-none',
          'data-[state=hidden]:invisible data-[state=hidden]:translate-y-2 data-[state=hidden]:opacity-0',
        )}
      >
        <GlassButton
          ref={ref}
          type="button"
          size="icon-md"
          aria-label={name}
          tabIndex={visible ? undefined : -1}
          className={cn('rounded-full', className)}
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            const hadFocus = typeof document !== 'undefined' && document.activeElement === localRef.current;
            ctx.scrollToBottom();
            // It is about to disappear: never leave focus on nothing.
            if (hadFocus) ctx.focusComposer();
          }}
          {...props}
        >
          {icon ?? <ArrowDownGlyph />}
        </GlassButton>
        {count > 0 ? (
          <Badge
            tone="solid"
            aria-hidden="true"
            data-chat-layout-count=""
            className="pointer-events-none absolute -end-1.5 -top-1.5 min-w-[1.375rem] justify-center rounded-full tabular-nums"
          >
            {count > 99 ? '99+' : count}
          </Badge>
        ) : null}
      </div>
    );
  },
);
ChatLayoutScrollButton.displayName = 'ChatLayoutScrollButton';
