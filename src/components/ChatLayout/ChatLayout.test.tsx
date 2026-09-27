import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatComposer, ChatComposerFooter, ChatComposerInput, ChatComposerSend } from '../ChatComposer';
import { ChatMessage, ChatMessageList } from '../ChatMessage';
import { ChatLayout, ChatLayoutDock, ChatLayoutScrollButton, useChatLayout, type ChatLayoutProps } from './ChatLayout';

/* jsdom has no layout. The layout's own scroller (`chat-layout-viewport`)
   reports the metrics in `m`, a write to scrollTop is clamped as a browser
   clamps it, the dock reports `dockHeight` as its box, ResizeObserver is a
   controllable stand-in and frames run synchronously. */

type Metrics = { sh: number; ch: number; top: number };
let m: Metrics = { sh: 1000, ch: 400, top: 0 };
let dockHeight = 150;
const clamp = (v: number) => Math.max(0, Math.min(v, m.sh - m.ch));
const isViewport = (el: Element) => el.getAttribute('data-slot') === 'chat-layout-viewport';
const saved: Record<string, PropertyDescriptor | undefined> = {};

beforeAll(() => {
  for (const key of ['scrollHeight', 'clientHeight', 'scrollTop'] as const) {
    saved[key] = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
  }
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return isViewport(this) ? m.sh : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return isViewport(this) ? m.ch : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
    configurable: true,
    get() {
      return isViewport(this) ? m.top : 0;
    },
    set(v: number) {
      if (isViewport(this)) m.top = clamp(v);
    },
  });
});

afterAll(() => {
  for (const [key, d] of Object.entries(saved)) {
    if (d) Object.defineProperty(HTMLElement.prototype, key, d);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});

let observers: Array<{ cb: ResizeObserverCallback; targets: Element[] }> = [];
const OriginalRO = globalThis.ResizeObserver;
const originalRaf = window.requestAnimationFrame;
const originalRect = HTMLElement.prototype.getBoundingClientRect;

beforeEach(() => {
  m = { sh: 1000, ch: 400, top: 0 };
  dockHeight = 150;
  observers = [];
  globalThis.ResizeObserver = class {
    private entry: { cb: ResizeObserverCallback; targets: Element[] };
    constructor(cb: ResizeObserverCallback) {
      this.entry = { cb, targets: [] };
      observers.push(this.entry);
    }
    observe(el: Element) {
      this.entry.targets.push(el);
    }
    unobserve() {}
    disconnect() {
      observers = observers.filter((o) => o !== this.entry);
    }
  } as unknown as typeof ResizeObserver;
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof window.requestAnimationFrame;
  HTMLElement.prototype.getBoundingClientRect = function rect(this: HTMLElement) {
    const h = this.getAttribute('data-slot') === 'chat-layout-dock' ? dockHeight : 0;
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: h, width: 0, height: h, toJSON: () => ({}) } as DOMRect;
  };
});

afterEach(() => {
  globalThis.ResizeObserver = OriginalRO;
  window.requestAnimationFrame = originalRaf;
  HTMLElement.prototype.getBoundingClientRect = originalRect;
});

/** Re-render, then let the MutationObserver (a microtask) report. */
async function update(rerender: (ui: React.ReactElement) => void, ui: React.ReactElement) {
  await act(async () => {
    rerender(ui);
    await Promise.resolve();
  });
}

const resize = () =>
  act(() => {
    observers.forEach((o) => o.cb([], {} as ResizeObserver));
  });

const slot = (name: string) => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const viewport = () => slot('chat-layout-viewport') as HTMLElement;
const scrollButtonWrap = () => slot('chat-layout-scroll-button') as HTMLElement;
const scrollButton = () => scrollButtonWrap().querySelector('button') as HTMLButtonElement;

function readerScrollsTo(top: number) {
  m.top = clamp(top);
  act(() => {
    fireEvent.scroll(viewport());
  });
}

function Composer() {
  return (
    <ChatComposer>
      <ChatComposerInput />
      <ChatComposerFooter>
        <ChatComposerSend />
      </ChatComposerFooter>
    </ChatComposer>
  );
}

type Msg = { id: number; from: 'user' | 'assistant'; text: string };

function Chat({ messages, ...props }: { messages: Msg[] } & Partial<ChatLayoutProps>) {
  return (
    <ChatLayout composer={<Composer />} empty={messages.length === 0} {...props}>
      <ChatMessageList aria-label="Conversation">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} from={msg.from}>
            {msg.text}
            {msg.from === 'assistant' ? <button type="button">Copy {msg.id}</button> : null}
          </ChatMessage>
        ))}
      </ChatMessageList>
    </ChatLayout>
  );
}

const seed: Msg[] = [
  { id: 1, from: 'user', text: 'Why does my binary search loop forever?' },
  { id: 2, from: 'assistant', text: 'Your loop condition is the off-by-one.' },
];

describe('ChatLayout: parts and slots', () => {
  it('renders the layout, its scroller, the messages, the dock and its glass', () => {
    render(<Chat messages={seed} />);
    for (const name of [
      'chat-layout',
      'chat-layout-viewport',
      'chat-layout-track',
      'chat-layout-messages',
      'chat-layout-dock',
      'chat-layout-dock-glass',
      'chat-layout-dock-content',
      'chat-layout-scroll-slot',
      'chat-layout-scroll-button',
    ]) {
      expect(slot(name), name).not.toBeNull();
    }
    const root = slot('chat-layout') as HTMLElement;
    expect(root).toHaveAttribute('data-density', 'auto');
    expect(root).toHaveAttribute('data-width', 'measure');
    expect(root).toHaveAttribute('data-scroll-container', 'self');
    expect(root.className).toContain('@container/chat-layout');
    expect(root.className).toContain('min-h-0');
  });

  it('forwards the ref to the root and merges className last', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<ChatLayout ref={ref} className="h-[30rem]" />);
    expect(ref.current).toBe(slot('chat-layout'));
    expect(ref.current?.className).toContain('h-[30rem]');
    expect(ref.current?.className).not.toMatch(/(^|\s)h-full(\s|$)/);
  });

  it('puts the composer in the dock, after the messages', () => {
    render(<Chat messages={seed} />);
    const dock = slot('chat-layout-dock') as HTMLElement;
    expect(dock.querySelector('[data-slot="chat-composer"]')).not.toBeNull();
    const messages = slot('chat-layout-messages') as HTMLElement;
    expect(messages.compareDocumentPosition(dock) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('lifts a ChatLayoutDock child to the dock position, wherever it is placed', () => {
    render(
      <ChatLayout>
        <ChatLayoutDock data-testid="dock">
          <p>Disclaimer</p>
        </ChatLayoutDock>
        <ChatMessageList>
          <ChatMessage from="user">Hi</ChatMessage>
        </ChatMessageList>
      </ChatLayout>,
    );
    const dock = screen.getByTestId('dock');
    expect(dock).toHaveAttribute('data-slot', 'chat-layout-dock');
    expect(slot('chat-layout-messages')?.contains(dock)).toBe(false);
    expect(dock.parentElement).toBe(slot('chat-layout-track'));
    expect(document.querySelectorAll('[data-slot="chat-layout-dock"]')).toHaveLength(1);
  });

  it('keeps the message list the log; the layout adds no role', () => {
    render(<Chat messages={seed} />);
    expect(screen.getByRole('log', { name: 'Conversation' })).toBeInTheDocument();
    expect(slot('chat-layout')).not.toHaveAttribute('role');
    expect(viewport()).not.toHaveAttribute('role');
  });

  it('the dock glass is decorative and falls back to an opaque fill', () => {
    render(<Chat messages={seed} />);
    const glass = slot('chat-layout-dock-glass') as HTMLElement;
    expect(glass).toHaveAttribute('aria-hidden', 'true');
    expect(glass.className).toContain('bg-glass');
    expect(glass.className).toContain('backdrop-blur-[12px]');
    expect(glass.className).toContain('reduce-transparency:bg-(--chat-layout-surface)!');
    expect(glass.className).toContain('contrast-more:bg-(--chat-layout-surface)!');
    expect(glass.className).toContain('forced-colors:backdrop-filter-none!');
    expect(glass.className).toMatch(/not-supports-\[/);
  });

  it('density and width', () => {
    const { rerender } = render(<ChatLayout density="compact" width="full" />);
    expect(slot('chat-layout')).toHaveAttribute('data-density', 'compact');
    expect(viewport().className).toContain('[--chat-layout-pad:var(--space-4)]');
    expect(viewport().className).not.toContain('@min-[36rem]/chat-layout');
    expect(viewport().className).toContain('[--chat-layout-max:100%]');
    rerender(<ChatLayout />);
    expect(viewport().className).toContain('@min-[36rem]/chat-layout:[--chat-layout-pad:var(--space-6)]');
    expect(viewport().className).toContain('--size-measure-max');
  });
});

describe('ChatLayout: empty state', () => {
  const empty = <p>Ask the DSA tutor</p>;

  it('shows the empty state, centred, while empty — and keeps the (empty) log mounted', () => {
    render(<Chat messages={[]} emptyState={empty} />);
    const shown = screen.getByText('Ask the DSA tutor').parentElement as HTMLElement;
    expect(shown).toHaveAttribute('data-chat-layout-empty');
    expect(shown).toHaveAttribute('data-align', 'center');
    expect(shown).toHaveAttribute('data-justify', 'center');
    expect(screen.getByRole('log')).toBeInTheDocument();
    expect(slot('chat-layout')).toHaveAttribute('data-empty');
  });

  it('hides it once there are messages', () => {
    const { rerender } = render(<Chat messages={[]} emptyState={empty} />);
    rerender(<Chat messages={seed} emptyState={empty} />);
    expect(screen.queryByText('Ask the DSA tutor')).toBeNull();
    expect(slot('chat-layout')).not.toHaveAttribute('data-empty');
  });

  it('defaults `empty` to "no children"', () => {
    const { rerender } = render(<ChatLayout emptyState={empty} />);
    expect(screen.getByText('Ask the DSA tutor')).toBeInTheDocument();
    rerender(
      <ChatLayout emptyState={empty}>
        <ChatMessageList />
      </ChatLayout>,
    );
    expect(screen.queryByText('Ask the DSA tutor')).toBeNull();
  });
});

describe('ChatLayout: the dock padding contract', () => {
  it('the dock is sticky and in flow, so it can never cover the last message', () => {
    render(<Chat messages={seed} />);
    const dock = slot('chat-layout-dock') as HTMLElement;
    expect(dock.className).toContain('sticky');
    expect(dock.className).toContain('bottom-[calc(-1*var(--scroll-pad-bottom,0px))]');
    expect(dock.className).not.toMatch(/(^|\s)(absolute|fixed)(\s|$)/);
    expect(dock.parentElement).toBe(slot('chat-layout-track'));
  });

  it('measures the dock into --chat-layout-dock-height, used as the scroller\'s scroll-padding', () => {
    render(<Chat messages={seed} />);
    const root = slot('chat-layout') as HTMLElement;
    expect(root.style.getPropertyValue('--chat-layout-dock-height')).toBe('150px');
    expect(viewport().className).toContain('scroll-pb-(--chat-layout-dock-height)');
    dockHeight = 212;
    resize();
    expect(root.style.getPropertyValue('--chat-layout-dock-height')).toBe('212px');
  });

  it('its own scroller resets the scroll-pad contract; a parent scroller keeps it', () => {
    const { unmount } = render(<Chat messages={seed} />);
    expect(viewport().className).toContain('[--scroll-pad-x:0px]');
    expect(viewport().className).toContain('[--scroll-pad-bottom:0px]');
    expect(viewport().className).toContain('overflow-y-auto');
    unmount();
    function Parent() {
      const ref = React.useRef<HTMLDivElement>(null);
      return (
        <div ref={ref}>
          <Chat messages={seed} scrollContainer={ref} />
        </div>
      );
    }
    render(<Parent />);
    expect(slot('chat-layout')).toHaveAttribute('data-scroll-container', 'element');
    expect(viewport().className).not.toContain('[--scroll-pad-x:0px]');
    expect(viewport().className).not.toContain('overflow-y-auto');
    expect(slot('chat-layout')?.className).toContain('h-auto');
  });
});

describe('ChatLayout: stick to bottom', () => {
  it('opens on the latest message', () => {
    render(<Chat messages={seed} />);
    expect(m.top).toBe(600);
    expect(slot('chat-layout')).toHaveAttribute('data-at-bottom');
  });

  it('follows a streaming reply while at the end', () => {
    render(<Chat messages={seed} />);
    m.sh = 1400;
    resize();
    expect(m.top).toBe(1000);
  });

  it('does not pull a reader who scrolled up, and resumes at the end', () => {
    const onAtBottomChange = vi.fn();
    render(<Chat messages={seed} onAtBottomChange={onAtBottomChange} />);
    readerScrollsTo(200);
    expect(onAtBottomChange).toHaveBeenLastCalledWith(false);
    m.sh = 1600;
    resize();
    expect(m.top).toBe(200);
    readerScrollsTo(1200);
    expect(onAtBottomChange).toHaveBeenLastCalledWith(true);
    m.sh = 1800;
    resize();
    expect(m.top).toBe(1400);
  });

  it('the reader sending a message takes them back to the end', async () => {
    const { rerender } = render(<Chat messages={seed} />);
    readerScrollsTo(100);
    m.sh = 1300;
    await update(rerender, <Chat messages={[...seed, { id: 3, from: 'user', text: 'And the space?' }]} />);
    expect(m.top).toBe(900);
    expect(slot('chat-layout')).toHaveAttribute('data-at-bottom');
  });
});

describe('ChatLayoutScrollButton', () => {
  it('is hidden at the bottom: out of the tab order and the accessibility tree', () => {
    render(<Chat messages={seed} />);
    expect(scrollButtonWrap()).toHaveAttribute('data-state', 'hidden');
    expect(scrollButtonWrap()).toHaveAttribute('aria-hidden', 'true');
    expect(scrollButtonWrap().className).toContain('data-[state=hidden]:invisible');
    expect(scrollButton().tabIndex).toBe(-1);
    expect(screen.queryByRole('button', { name: /Scroll to latest message/ })).toBeNull();
  });

  it('appears when the reader scrolls up, named "Scroll to latest message", a round glass button', () => {
    render(<Chat messages={seed} />);
    readerScrollsTo(100);
    const button = screen.getByRole('button', { name: 'Scroll to latest message' });
    expect(scrollButtonWrap()).toHaveAttribute('data-state', 'visible');
    expect(button).toHaveAttribute('data-material', 'glass');
    expect(button).toHaveAttribute('data-size', 'icon-md');
    expect(button.className).toContain('rounded-full');
    expect(button.tabIndex).toBe(0);
  });

  it('counts messages that arrive while the reader is away (not their own), in the name and a hidden Badge', async () => {
    const { rerender } = render(<Chat messages={seed} />);
    readerScrollsTo(100);
    const more: Msg[] = [
      ...seed,
      { id: 3, from: 'assistant', text: 'One more thing.' },
      { id: 4, from: 'assistant', text: 'And another.' },
    ];
    await update(rerender, <Chat messages={more} />);
    const button = screen.getByRole('button', { name: 'Scroll to latest message, 2 new' });
    const badge = scrollButtonWrap().querySelector('[data-chat-layout-count]') as HTMLElement;
    expect(badge).toHaveTextContent('2');
    expect(badge).toHaveAttribute('aria-hidden', 'true');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(button).toBeInTheDocument();
  });

  it('does not count while at the bottom, and resets when the reader returns', async () => {
    const { rerender } = render(<Chat messages={seed} />);
    await update(rerender, <Chat messages={[...seed, { id: 3, from: 'assistant', text: 'Seen as it came.' }]} />);
    readerScrollsTo(100);
    expect(screen.getByRole('button', { name: 'Scroll to latest message' })).toBeInTheDocument();
    await update(rerender,
      <Chat
        messages={[...seed, { id: 3, from: 'assistant', text: 'Seen as it came.' }, { id: 4, from: 'assistant', text: 'New.' }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Scroll to latest message, 1 new' })).toBeInTheDocument();
    readerScrollsTo(10_000);
    expect(scrollButtonWrap()).toHaveAttribute('data-state', 'hidden');
    readerScrollsTo(100);
    expect(screen.getByRole('button', { name: 'Scroll to latest message' })).toBeInTheDocument();
  });

  it('pressing it scrolls to the latest message and hides it', () => {
    render(<Chat messages={seed} />);
    readerScrollsTo(100);
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to latest message' }));
    expect(m.top).toBe(600);
    expect(scrollButtonWrap()).toHaveAttribute('data-state', 'hidden');
  });

  it('pressed from the keyboard, it hands focus to the composer input as it disappears', () => {
    render(<Chat messages={seed} />);
    readerScrollsTo(100);
    const button = screen.getByRole('button', { name: 'Scroll to latest message' });
    button.focus();
    fireEvent.click(button);
    expect(document.activeElement).toHaveAttribute('data-slot', 'chat-composer-input');
  });

  it('a mouse press that did not focus it leaves focus where it was', () => {
    render(<Chat messages={seed} />);
    const copy = screen.getByRole('button', { name: 'Copy 2' });
    copy.focus();
    readerScrollsTo(100);
    fireEvent.click(screen.getByRole('button', { name: 'Scroll to latest message' }));
    expect(document.activeElement).toBe(copy);
  });

  it('takes a count, a label and a label format', () => {
    function Custom() {
      return <ChatLayoutScrollButton count={4} aria-label="Jump to latest" countLabel={(l, n) => `${l} (${n} unread)`} />;
    }
    render(<Chat messages={seed} scrollButton={<Custom />} />);
    readerScrollsTo(100);
    expect(screen.getByRole('button', { name: 'Jump to latest (4 unread)' })).toBeInTheDocument();
  });

  it('`scrollButton={null}` removes it', () => {
    render(<Chat messages={seed} scrollButton={null} />);
    expect(slot('chat-layout-scroll-slot')).toBeNull();
    expect(slot('chat-layout-scroll-button')).toBeNull();
  });

  it('throws outside a ChatLayout, as do ChatLayoutDock and useChatLayout', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<ChatLayoutScrollButton />)).toThrow(/inside a <ChatLayout>/);
      expect(() => render(<ChatLayoutDock />)).toThrow(/inside a <ChatLayout>/);
      function Reader() {
        useChatLayout();
        return null;
      }
      expect(() => render(<Reader />)).toThrow(/inside a <ChatLayout>/);
    } finally {
      spy.mockClear();
      spy.mockRestore();
    }
  });
});

describe('ChatLayout: focus', () => {
  it('never moves focus when messages arrive, pinned or not', async () => {
    const { rerender } = render(<Chat messages={seed} />);
    const copy = screen.getByRole('button', { name: 'Copy 2' });
    copy.focus();
    await update(rerender, <Chat messages={[...seed, { id: 3, from: 'assistant', text: 'Streaming…' }]} />);
    m.sh = 1300;
    resize();
    expect(document.activeElement).toBe(copy);
    readerScrollsTo(100);
    await update(rerender,
      <Chat
        messages={[...seed, { id: 3, from: 'assistant', text: 'Streaming…' }, { id: 4, from: 'assistant', text: 'More' }]}
      />,
    );
    expect(document.activeElement).toBe(copy);
  });

  it('useChatLayout exposes the state to a custom part', () => {
    function Status() {
      const { isAtBottom, newMessageCount } = useChatLayout();
      return <output data-testid="status">{`${isAtBottom}:${newMessageCount}`}</output>;
    }
    render(
      <ChatLayout scrollButton={<Status />}>
        <ChatMessageList>
          <ChatMessage from="user">Hi</ChatMessage>
        </ChatMessageList>
      </ChatLayout>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('true:0');
    readerScrollsTo(100);
    expect(screen.getByTestId('status')).toHaveTextContent('false:0');
  });
});

describe('ChatLayout: a Dock it cannot recognise by type', () => {
  // What a React Server Component hands a client component: an element whose
  // type is not ChatLayoutDock itself. It must not throw, and must still end
  // up at the dock position, not among the messages.
  const OpaqueDock = (props: React.ComponentProps<typeof ChatLayoutDock>) => <ChatLayoutDock {...props} />;

  it('portals itself to the dock position instead of throwing', () => {
    const { container } = render(
      <ChatLayout scrollButton={null}>
        <ChatMessageList aria-label="Conversation">
          <ChatMessage from="user">Hello</ChatMessage>
        </ChatMessageList>
        <OpaqueDock>
          <p>composer here</p>
        </OpaqueDock>
      </ChatLayout>,
    );
    const docks = container.querySelectorAll('[data-slot="chat-layout-dock"]');
    expect(docks).toHaveLength(1);
    expect(docks[0]!.closest('[data-slot="chat-layout-messages"]')).toBeNull();
    expect(docks[0]!.parentElement).toHaveAttribute('data-slot', 'chat-layout-dock-portal');
    expect(screen.getByText('composer here')).toBeInTheDocument();
  });
});

