import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { ChatMessage } from './ChatMessage';
import { ChatMessageActions } from './ChatMessageActions';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatMessageList } from './ChatMessageList';
import { ChatMessageMetadata } from './ChatMessageMetadata';
import { ChatDaySeparator, ChatSystemMessage } from './ChatSystemMessage';
import { formatChatDay, formatClockTime } from './format';
import { MenuItem } from '../Menu';

const T = (hm: string, day = '27') => `2026-09-${day}T${hm}:00+05:30`;
const NOW = T('21:00');

const slot = (root: ParentNode, name: string) => root.querySelector(`[data-slot="${name}"]`);
const slots = (root: ParentNode, name: string) => Array.from(root.querySelectorAll(`[data-slot="${name}"]`));

/* ---- ChatMessage ---------------------------------------------------------- */

describe('ChatMessage · from', () => {
  it('user: end-aligned, in a bubble, no avatar by default, a hidden "You" sender', () => {
    const { container } = render(<ChatMessage from="user">Is it the loop condition?</ChatMessage>);
    const root = slot(container, 'chat-message') as HTMLElement;
    expect(root).toHaveAttribute('data-from', 'user');
    expect(root).toHaveAttribute('data-group', 'single');
    expect(root).toHaveClass('flex-row-reverse', '@container/chat-message');
    expect(slot(root, 'chat-message-body')).toHaveClass('items-end');
    const bubble = slot(root, 'chat-message-bubble');
    expect(bubble).toHaveTextContent('Is it the loop condition?');
    expect(bubble).toHaveClass('bg-surface-subtle', 'text-content', 'border-border-decorative');
    expect(slot(root, 'chat-message-content')).toBeNull();
    expect(slot(root, 'chat-message-avatar')).toBeNull();
    expect(slot(root, 'chat-message-sender')).toHaveTextContent('You:');
    expect(slot(root, 'chat-message-sender')).toHaveClass('sr-only');
  });

  it('assistant: start-aligned prose at the measure, NO bubble, the brand monogram avatar', () => {
    const { container } = render(<ChatMessage from="assistant">Use lo &lt; hi.</ChatMessage>);
    const root = slot(container, 'chat-message') as HTMLElement;
    expect(root).toHaveAttribute('data-from', 'assistant');
    expect(root).not.toHaveClass('flex-row-reverse');
    expect(slot(root, 'chat-message-body')).toHaveClass('items-start');
    expect(slot(root, 'chat-message-bubble')).toBeNull();
    expect(slot(root, 'chat-message-content')).toHaveClass('max-w-(--size-measure-max)', 'type-body');
    const avatar = slot(root, 'chat-message-avatar');
    expect(avatar?.querySelector('[data-avatar-kind="assistant"]')).toHaveAttribute('data-slot', 'avatar');
    expect(avatar?.querySelector('[data-slot="logo"]')).toHaveAttribute('data-variant', 'monogram');
  });

  it('defaults to assistant; avatar={false} removes the avatar', () => {
    const { container } = render(<ChatMessage avatar={false}>Hi</ChatMessage>);
    expect(slot(container, 'chat-message')).toHaveAttribute('data-from', 'assistant');
    expect(slot(container, 'chat-message-avatar')).toBeNull();
  });

  it('other: start-aligned bubble with avatar and a visible name (no hidden sender)', () => {
    const { container } = render(
      <ChatMessage from="other" name="Priya Sharma · Mentor" avatar={<span data-testid="face" />}>
        Draw the range on paper.
      </ChatMessage>,
    );
    expect(slot(container, 'chat-message-bubble')).toBeInTheDocument();
    expect(slot(container, 'chat-message-body')).toHaveClass('items-start');
    expect(slot(container, 'chat-message-name')).toHaveTextContent('Priya Sharma · Mentor');
    expect(screen.getByTestId('face')).toBeInTheDocument();
    expect(slot(container, 'chat-message-sender')).toBeNull();
  });

  it('forwards the ref, spreads props and merges className last', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ChatMessage ref={ref} from="user" id="m1" className="px-8">
        x
      </ChatMessage>,
    );
    expect(ref.current).toHaveAttribute('id', 'm1');
    expect(ref.current).toHaveClass('px-8');
  });
});

describe('ChatMessage · grouping', () => {
  it('shows the name only on the first of a run and keeps the avatar column invisible after it', () => {
    const face = <span data-testid="face" />;
    const { container } = render(
      <>
        <ChatMessage from="other" name="Priya" avatar={face} group="first">a</ChatMessage>
        <ChatMessage from="other" name="Priya" avatar={face} group="last">b</ChatMessage>
      </>,
    );
    const [first, last] = slots(container, 'chat-message');
    expect(slot(first!, 'chat-message-name')).toBeInTheDocument();
    expect(slot(last!, 'chat-message-name')).toBeNull();
    expect(slot(first!, 'chat-message-avatar')).not.toHaveClass('invisible');
    expect(slot(last!, 'chat-message-avatar')).toHaveClass('invisible');
    // Later messages pull up to the group gap.
    expect(last).toHaveClass('data-[group=last]:mt-[calc(var(--chat-group-gap)-var(--chat-turn-gap))]');
  });

  it('a bubble inside a message reads the corner from data-from / data-group (CSS, no context)', () => {
    const { container } = render(<ChatMessage from="user" group="first">a</ChatMessage>);
    const bubble = slot(container, 'chat-message-bubble');
    expect(bubble).not.toHaveAttribute('data-group');
    expect(bubble).toHaveClass('in-data-[from=user]:in-data-[group=first]:rounded-ee-md');
    expect(bubble).toHaveClass('in-data-[from=other]:in-data-[group=last]:rounded-ss-md');
  });

  it.each([
    ['end', 'single', []],
    ['end', 'first', ['rounded-ee-md']],
    ['end', 'middle', ['rounded-se-md', 'rounded-ee-md']],
    ['end', 'last', ['rounded-se-md']],
    ['start', 'first', ['rounded-es-md']],
    ['start', 'middle', ['rounded-ss-md', 'rounded-es-md']],
    ['start', 'last', ['rounded-ss-md']],
  ] as const)('an explicit bubble on the %s side, %s, squares %j', (side, group, corners) => {
    render(
      <ChatMessageBubble side={side} group={group} data-testid="b">
        x
      </ChatMessageBubble>,
    );
    const b = screen.getByTestId('b');
    expect(b).toHaveAttribute('data-group', group);
    expect(b).toHaveAttribute('data-side', side);
    expect(b).toHaveClass('rounded-2xl');
    for (const c of corners) expect(b).toHaveClass(c);
    const all = ['rounded-ee-md', 'rounded-se-md', 'rounded-es-md', 'rounded-ss-md'];
    for (const c of all.filter((x) => !(corners as readonly string[]).includes(x))) expect(b).not.toHaveClass(c);
    // No inherited corners once it is explicit.
    expect(b.className).not.toContain('in-data-[from=');
  });

  it('caps the bubble at 85% (75% in a wide message) and never past the measure', () => {
    render(<ChatMessageBubble data-testid="b">x</ChatMessageBubble>);
    expect(screen.getByTestId('b')).toHaveClass(
      'max-w-[min(85%,var(--size-measure-max))]',
      '@min-[40rem]/chat-message:max-w-[min(75%,var(--size-measure-max))]',
    );
  });
});

describe('ChatMessage · status', () => {
  it('failed: a compact "Not sent" in the danger ink with a Retry button that calls onRetry', () => {
    const onRetry = vi.fn();
    const { container } = render(
      <ChatMessage from="user" status="failed" onRetry={onRetry} time={T('09:21')}>
        Can you check my complexity analysis?
      </ChatMessage>,
    );
    expect(slot(container, 'chat-message')).toHaveAttribute('data-status', 'failed');
    const error = slot(container, 'chat-message-error') as HTMLElement;
    expect(error).toHaveClass('text-danger-content', 'type-caption');
    expect(error).toHaveTextContent('Not sent');
    const retry = within(error).getByRole('button', { name: 'Retry' });
    expect(retry).toHaveAttribute('data-slot', 'button');
    expect(retry).toHaveAttribute('data-size', 'sm');
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    // No automatic time on a failed message: the notice is the metadata.
    expect(slot(container, 'chat-message-metadata')).toBeNull();
  });

  it('failed without onRetry has no button; labels are customisable', () => {
    render(
      <ChatMessage from="user" status="failed" errorLabel="Couldn’t send">
        x
      </ChatMessage>,
    );
    expect(screen.getByText('Couldn’t send')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('sending: aria-busy and "Sending…"', () => {
    const { container } = render(
      <ChatMessage from="user" status="sending" time={T('09:21')}>
        x
      </ChatMessage>,
    );
    expect(slot(container, 'chat-message')).toHaveAttribute('aria-busy', 'true');
    expect(slot(container, 'chat-message-delivery')).toHaveTextContent('Sending…');
  });

  it('shows the time automatically only on the last of a run; metadata={null} hides it', () => {
    const { container, rerender } = render(
      <ChatMessage from="user" group="first" time={T('09:21')}>
        x
      </ChatMessage>,
    );
    expect(slot(container, 'chat-message-metadata')).toBeNull();
    rerender(
      <ChatMessage from="user" group="last" time={T('09:21')}>
        x
      </ChatMessage>,
    );
    expect(slot(container, 'chat-message-metadata')).toHaveTextContent('9:21 AM');
    rerender(
      <ChatMessage from="user" time={T('09:21')} metadata={null}>
        x
      </ChatMessage>,
    );
    expect(slot(container, 'chat-message-metadata')).toBeNull();
  });
});

/* ---- ChatMessageMetadata --------------------------------------------------- */

describe('ChatMessageMetadata', () => {
  it('is caption text in the secondary ink: time · model', () => {
    const { container } = render(<ChatMessageMetadata time={T('22:42', '26')} model="Scaler Tutor" />);
    const row = slot(container, 'chat-message-metadata') as HTMLElement;
    expect(row).toHaveClass('type-caption', 'text-content-secondary');
    const time = row.querySelector('time') as HTMLElement;
    expect(time).toHaveAttribute('data-slot', 'timestamp');
    expect(time).toHaveAttribute('dateTime', T('22:42', '26'));
    expect(time).toHaveTextContent('10:42 PM');
    expect(time).toHaveAttribute('title', '26 Sep 2026, 10:42 PM');
    expect(time).toHaveClass('type-caption');
    expect(slot(row, 'chat-message-model')).toHaveTextContent('Scaler Tutor');
    // The separator dot is hidden from assistive tech.
    expect(slot(row, 'chat-message-metadata-separator')).toHaveAttribute('aria-hidden', 'true');
    expect(row).toHaveTextContent('10:42 PM·Scaler Tutor');
  });

  it.each([
    ['sending', 'Sending…'],
    ['sent', 'Sent'],
    ['read', 'Read'],
    ['failed', 'Not sent'],
  ] as const)('delivery %s reads "%s"', (delivery, words) => {
    const { container } = render(<ChatMessageMetadata delivery={delivery} />);
    const d = slot(container, 'chat-message-delivery') as HTMLElement;
    expect(d).toHaveTextContent(words);
    expect(d).toHaveAttribute('data-delivery', delivery);
    if (delivery === 'failed') expect(d).toHaveClass('text-danger-content');
    else expect(d).not.toHaveClass('text-danger-content');
  });

  it('formats the clock time in the zone', () => {
    expect(formatClockTime(T('09:05'))).toBe('9:05 AM');
    expect(formatClockTime('2026-09-27T03:35:00Z')).toBe('9:05 AM');
    expect(formatClockTime(T('09:05'), { timeZone: 'UTC' })).toBe('3:35 AM');
  });
});

/* ---- ChatMessageActions --------------------------------------------------- */

describe('ChatMessageActions', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as unknown as Record<string, unknown>).clipboard;
  });

  function Row(props: Partial<React.ComponentProps<typeof ChatMessageActions>>) {
    return (
      <ChatMessageActions
        copyValue="O(log n)"
        onRegenerate={() => undefined}
        menu={<MenuItem>Report a problem</MenuItem>}
        {...props}
      />
    );
  }

  it('is a named group of small controls', () => {
    const { container } = render(<Row />);
    const row = slot(container, 'chat-message-actions') as HTMLElement;
    expect(row).toHaveAttribute('role', 'group');
    expect(row).toHaveAttribute('aria-label', 'Response actions');
    for (const name of ['Copy response', 'Regenerate response', 'More actions']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('data-size', 'icon-sm');
    }
    expect(screen.getByRole('radio', { name: 'Good response' })).toHaveClass('size-control-sm');
  });

  it('copies the reply', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<Row />);
    await act(async () => {
      screen.getByRole('button', { name: 'Copy response' }).click();
    });
    expect(writeText).toHaveBeenCalledWith('O(log n)');
  });

  it('calls onRegenerate', () => {
    const onRegenerate = vi.fn();
    render(<Row onRegenerate={onRegenerate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate response' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('thumbs are single choice: exactly one or none pressed', () => {
    const onFeedbackChange = vi.fn();
    render(<Row onFeedbackChange={onFeedbackChange} />);
    // ToggleButtonGroup type="single": a radiogroup of two radios.
    const up = () => screen.getByRole('radio', { name: 'Good response' });
    const down = () => screen.getByRole('radio', { name: 'Bad response' });
    expect(screen.getByRole('radiogroup', { name: 'Rate this response' })).toBeInTheDocument();
    const pressed = () => [up(), down()].filter((b) => b.getAttribute('aria-checked') === 'true').length;
    expect(pressed()).toBe(0);
    fireEvent.click(up());
    expect(onFeedbackChange).toHaveBeenLastCalledWith('up');
    expect(up()).toHaveAttribute('aria-checked', 'true');
    expect(up()).toHaveAttribute('data-state', 'on');
    expect(pressed()).toBe(1);
    fireEvent.click(down());
    expect(onFeedbackChange).toHaveBeenLastCalledWith('down');
    expect(up()).toHaveAttribute('aria-checked', 'false');
    expect(down()).toHaveAttribute('aria-checked', 'true');
    expect(pressed()).toBe(1);
    fireEvent.click(down());
    expect(onFeedbackChange).toHaveBeenLastCalledWith('');
    expect(pressed()).toBe(0);
  });

  it('controlled feedback follows the prop', () => {
    const { rerender } = render(<Row feedback="down" />);
    expect(screen.getByRole('radio', { name: 'Bad response' })).toHaveAttribute('aria-checked', 'true');
    rerender(<Row feedback="" />);
    expect(screen.getByRole('radio', { name: 'Bad response' })).toHaveAttribute('aria-checked', 'false');
  });

  it('hover visibility is opacity only: never display:none or visibility:hidden, always shown on touch', () => {
    const { container } = render(<Row />);
    const row = slot(container, 'chat-message-actions') as HTMLElement;
    expect(row).toHaveAttribute('data-visibility', 'hover');
    expect(row).toHaveClass(
      'opacity-0',
      'group-hover/chat-message:opacity-100',
      'group-focus-within/chat-message:opacity-100',
      'focus-within:opacity-100',
      'has-[[aria-expanded=true]]:opacity-100',
      'pointer-coarse:opacity-100',
    );
    for (const hidden of ['hidden', 'invisible', 'sr-only']) expect(row).not.toHaveClass(hidden);
    expect(row).not.toHaveAttribute('aria-hidden');
    expect(getComputedStyle(row).display).not.toBe('none');
    // Still in the accessibility tree.
    expect(screen.getByRole('button', { name: 'Copy response' })).toBeVisible();
  });

  it('every control is keyboard reachable in order (one stop for the thumbs pair)', () => {
    render(<Row />);
    const row = document.querySelector('[data-slot="chat-message-actions"]') as HTMLElement;
    const tabbable = Array.from(row.querySelectorAll<HTMLElement>('button, [tabindex]')).filter(
      (b) => b.tabIndex >= 0 && !b.hasAttribute('disabled'),
    );
    // With no rating yet, Radix's roving group is the one stop and hands
    // focus to its first radio.
    const names = tabbable.map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual(['Copy response', 'Regenerate response', 'Rate this response', 'More actions']);
    for (const b of tabbable) {
      act(() => b.focus());
      if (b.getAttribute('role') === 'radiogroup') {
        expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Good response' }));
      } else expect(document.activeElement).toBe(b);
    }
  });

  it('visibility="always" is shown at rest', () => {
    const { container } = render(<Row visibility="always" />);
    expect(slot(container, 'chat-message-actions')).not.toHaveClass('opacity-0');
  });

  it('More opens a menu from the keyboard', async () => {
    render(<Row />);
    const more = screen.getByRole('button', { name: 'More actions' });
    act(() => more.focus());
    fireEvent.keyDown(more, { key: 'Enter' });
    expect(await screen.findByRole('menuitem', { name: 'Report a problem' })).toBeInTheDocument();
    expect(more).toHaveAttribute('aria-expanded', 'true');
  });

  it('omits each control whose input is missing', () => {
    render(<ChatMessageActions showFeedback={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

/* ---- ChatMessageList ------------------------------------------------------ */

describe('ChatMessageList', () => {
  it('is a named log with a stable slot and no overflow of its own', () => {
    const { container, rerender } = render(<ChatMessageList />);
    const log = screen.getByRole('log', { name: 'Conversation' });
    expect(log).toHaveAttribute('data-slot', 'chat-message-list');
    expect(log).toHaveClass('@container/chat-list');
    expect(log.className).not.toMatch(/overflow|h-full|max-h/);
    expect(slot(container, 'chat-message-list-items')?.className).not.toMatch(/overflow/);
    rerender(<ChatMessageList aria-label="Conversation with Scaler Tutor" />);
    expect(screen.getByRole('log', { name: 'Conversation with Scaler Tutor' })).toBeInTheDocument();
  });

  it('groups consecutive messages from one sender automatically', () => {
    const { container } = render(
      <ChatMessageList>
        <ChatMessage from="user">a</ChatMessage>
        <ChatMessage from="user">b</ChatMessage>
        <ChatMessage from="user">c</ChatMessage>
        <ChatMessage from="assistant">d</ChatMessage>
        <ChatMessage from="other" name="Priya">e</ChatMessage>
        <ChatMessage from="other" name="Rahul">f</ChatMessage>
        <ChatMessage from="other" name="Rahul">g</ChatMessage>
        <ChatSystemMessage>Conversation reset</ChatSystemMessage>
        <ChatMessage from="other" name="Rahul">h</ChatMessage>
        <ChatMessage from="user" group="single">i</ChatMessage>
        <ChatMessage from="user">j</ChatMessage>
      </ChatMessageList>,
    );
    const groups = slots(container, 'chat-message').map((m) => m.getAttribute('data-group'));
    expect(groups).toEqual([
      'first', 'middle', 'last', // user a b c
      'single', // assistant
      'single', // Priya
      'first', 'last', // Rahul f g (a different person with the same `from`)
      'single', // Rahul h, after the system line
      'single', 'last', // an explicit group is kept; j closes the run
    ]);
  });

  it('`sender` groups by id; grouping="none" leaves every message single', () => {
    const { container, rerender } = render(
      <ChatMessageList>
        <ChatMessage from="other" sender="m1" name={<b>Priya</b>}>a</ChatMessage>
        <ChatMessage from="other" sender="m1" name={<b>Priya</b>}>b</ChatMessage>
      </ChatMessageList>,
    );
    expect(slots(container, 'chat-message').map((m) => m.getAttribute('data-group'))).toEqual(['first', 'last']);
    rerender(
      <ChatMessageList grouping="none">
        <ChatMessage from="user">a</ChatMessage>
        <ChatMessage from="user">b</ChatMessage>
      </ChatMessageList>,
    );
    expect(slots(container, 'chat-message').map((m) => m.getAttribute('data-group'))).toEqual(['single', 'single']);
  });

  it('inserts day separators (Yesterday / Today with `now`), which also end a run', () => {
    const { container } = render(
      <ChatMessageList daySeparators now={NOW}>
        <ChatMessage from="user" time={T('22:41', '26')}>a</ChatMessage>
        <ChatMessage from="user" time={T('22:42', '26')}>b</ChatMessage>
        <ChatSystemMessage time={T('09:14')}>Mentor Priya joined</ChatSystemMessage>
        <ChatMessage from="user" time={T('09:20')}>c</ChatMessage>
      </ChatMessageList>,
    );
    const items = slot(container, 'chat-message-list-items') as HTMLElement;
    const order = Array.from(items.children).map((c) => c.getAttribute('data-slot'));
    expect(order).toEqual([
      'chat-day-separator',
      'chat-message',
      'chat-message',
      'chat-day-separator',
      'chat-system-message',
      'chat-message',
    ]);
    const [yesterday, today] = slots(container, 'chat-day-separator');
    expect(yesterday).toHaveTextContent('Yesterday');
    expect(yesterday?.querySelector('time')).toHaveAttribute('dateTime', T('22:41', '26'));
    expect(yesterday?.querySelector('[data-slot="divider"]')).toHaveAttribute('data-variant', 'label');
    expect(today).toHaveTextContent('Today');
    expect(slots(container, 'chat-message').map((m) => m.getAttribute('data-group'))).toEqual(['first', 'last', 'single']);
  });

  it('without `now` a separator prints the date, so the server cannot disagree with the reader', () => {
    render(<ChatDaySeparator date={T('10:00', '04')} />);
    expect(screen.getByText('4 Sep 2026')).toBeInTheDocument();
    expect(formatChatDay(T('23:59', '25'), { now: NOW })).toBe('25 Sep 2026');
    expect(formatChatDay(T('00:01'), { now: NOW })).toBe('Today');
  });

  it('density follows the container by default; compact / comfortable pin it', () => {
    const { container, rerender } = render(<ChatMessageList />);
    const items = () => slot(container, 'chat-message-list-items') as HTMLElement;
    expect(slot(container, 'chat-message-list')).toHaveAttribute('data-density', 'auto');
    expect(items()).toHaveClass('[--chat-turn-gap:var(--space-4)]', '@min-[36rem]/chat-list:[--chat-turn-gap:var(--space-6)]');
    rerender(<ChatMessageList density="comfortable" />);
    expect(items()).toHaveClass('[--chat-turn-gap:var(--space-6)]');
    expect(items().className).not.toContain('@min-[36rem]');
  });
});

describe('ChatSystemMessage', () => {
  it('is centred caption text in the secondary ink, with no role of its own', () => {
    const { container } = render(<ChatSystemMessage time={T('09:14')}>Conversation reset</ChatSystemMessage>);
    const line = slot(container, 'chat-system-message') as HTMLElement;
    expect(line).toHaveTextContent('Conversation reset');
    expect(line).toHaveClass('text-center', 'type-caption', 'text-content-secondary');
    expect(line).not.toHaveAttribute('role');
    expect(line).not.toHaveAttribute('time');
  });
});
