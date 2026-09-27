import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkle } from '@phosphor-icons/react';

import { Button } from '../Button';
import { ChatComposer, ChatComposerFooter, ChatComposerInput, ChatComposerSend } from '../ChatComposer';
import { ChatMessage, ChatMessageList } from '../ChatMessage';
import { Conversation, NOW } from '../ChatMessage/_fixtures/conversation';
import { EmptyState } from '../EmptyState';
import { Text } from '../Text';
import { ChatLayout, ChatLayoutDock, ChatLayoutScrollButton } from './ChatLayout';

const meta = {
  title: 'AI/ChatLayout',
  component: ChatLayout,
  subcomponents: { ChatLayoutDock, ChatLayoutScrollButton } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The shell of a chat surface. The messages scroll (pushed to the bottom while the conversation is short);',
          'the composer is docked below them, sticky, on frosted glass that fades in so text passing under it melts',
          'away; a round glass button returns to the latest message. Stick-to-bottom follows a streaming reply while',
          'the reader is at the end and never moves them once they scroll up. It fills its CONTAINER (no height of',
          'its own) and steps its density at 36rem of its own width, so it works full page, in a panel, a SideDrawer',
          'and a side pane. The end-to-end stories with a streaming tutor are under AI/Chat.',
        ].join(' '),
      },
    },
  },
  args: { density: 'auto', width: 'measure' },
  argTypes: {
    density: { control: 'inline-radio', options: ['auto', 'compact', 'comfortable'] },
    width: { control: 'inline-radio', options: ['measure', 'full'] },
  },
} satisfies Meta<typeof ChatLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

function Composer() {
  return (
    <ChatComposer>
      <ChatComposerInput placeholder="Ask the DSA tutor…" />
      <ChatComposerFooter>
        <ChatComposerSend />
      </ChatComposerFooter>
    </ChatComposer>
  );
}

const frame = 'flex h-[40rem] max-h-[calc(100dvh-2*var(--space-gutter))] flex-col overflow-hidden rounded-xl border border-border-decorative';

/** A conversation with history, in a 40rem-tall box. It opens on the latest message. */
export const Default: Story = {
  render: (args) => (
    <div className={frame}>
      <ChatLayout {...args} composer={<Composer />}>
        <Conversation />
      </ChatLayout>
    </div>
  ),
};

/**
 * No messages yet: `emptyState` is centred in the message area. The (empty) list stays rendered
 * beside it, so it is already a live region when the first message arrives.
 */
export const Empty: Story = {
  render: (args) => (
    <div className={frame}>
      <ChatLayout
        {...args}
        empty
        composer={<Composer />}
        emptyState={
          <EmptyState
            icon={<Sparkle weight="duotone" />}
            title="Ask the DSA tutor"
            titleAs="h2"
            description="Paste your code or describe the bug."
          />
        }
      >
        <ChatMessageList aria-label="Conversation with Scaler Tutor" />
      </ChatLayout>
    </div>
  ),
};

const LINES = [
  'Hidden test 7 is the target larger than every element.',
  'With lo <= hi the last pass reads one past the end.',
  'Keep hi = len(arr) and loop while lo < hi.',
  'Each pass must make the range strictly smaller.',
  'Add the empty-array case to your own tests too.',
];

/**
 * A message arrives every 1.5s. At the end, you follow them. Scroll up: nothing moves you, and the
 * button counts what arrives ("Scroll to latest message, 3 new"). Press it, or scroll back down,
 * to follow again.
 */
export const StickToBottom: Story = {
  render: (args) => {
    const [messages, setMessages] = React.useState<string[]>(() =>
      Array.from({ length: 20 }, (_, i) => LINES[i % LINES.length] as string),
    );
    const [running, setRunning] = React.useState(true);
    React.useEffect(() => {
      if (!running) return undefined;
      const t = window.setInterval(() => {
        setMessages((m) => [...m, LINES[m.length % LINES.length] as string]);
      }, 1500);
      return () => window.clearInterval(t);
    }, [running]);
    return (
      <div className="grid gap-3">
        <div>
          <Button variant="secondary" size="sm" onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Resume'} messages
          </Button>
        </div>
        <div className={frame}>
          <ChatLayout {...args} composer={<Composer />}>
            <ChatMessageList aria-label="Conversation with Scaler Tutor">
              {messages.map((text, i) => (
                // Every fourth one from a mentor, so the stream is not one long run.
                <ChatMessage key={i} from={i % 4 === 3 ? 'other' : 'assistant'} name={i % 4 === 3 ? 'Priya · Mentor' : undefined}>
                  {i + 1}. {text}
                </ChatMessage>
              ))}
            </ChatMessageList>
          </ChatLayout>
        </div>
      </div>
    );
  },
};

/**
 * Density follows the layout's own width, not the viewport: 16px padding under 36rem (left, a side
 * panel), 24px from there (right).
 */
export const DensityByContainer: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap gap-6">
      <div className={`${frame} w-[22rem] max-w-full`}>
        <ChatLayout composer={<Composer />}>
          <Conversation />
        </ChatLayout>
      </div>
      <div className={`${frame} w-[48rem] max-w-full`}>
        <ChatLayout composer={<Composer />}>
          <Conversation />
        </ChatLayout>
      </div>
    </div>
  ),
};

/**
 * `ChatLayoutDock` among the children instead of `composer`, for a dock with more in it: here a
 * disclaimer under the composer.
 */
export const CustomDock: Story = {
  render: (args) => (
    <div className={frame}>
      <ChatLayout {...args}>
        <Conversation />
        <ChatLayoutDock>
          <Composer />
          <Text size="xs" tone="secondary" className="text-center">
            The tutor can be wrong. Check its answers against the lecture notes.
          </Text>
        </ChatLayoutDock>
      </ChatLayout>
    </div>
  ),
};

/**
 * `scrollContainer={ref}`: a parent element scrolls, here one padded 16px that declares the
 * scroll-pad contract (`--scroll-pad-x` / `--scroll-pad-bottom`), so the dock still meets its
 * visible edges.
 */
export const ParentScroller: Story = {
  render: (args) => {
    const scroller = React.useRef<HTMLDivElement>(null);
    return (
      <div
        ref={scroller}
        className={`${frame} block overflow-y-auto p-4 [--scroll-pad-bottom:var(--space-4)] [--scroll-pad-x:var(--space-4)]`}
      >
        <Text size="sm" tone="secondary" className="mb-4">
          A page section above the chat, in the same scroller.
        </Text>
        <ChatLayout {...args} scrollContainer={scroller} composer={<Composer />}>
          <Conversation />
        </ChatLayout>
      </div>
    );
  },
};

/** `scrollContainer="page"`: the document scrolls, and the dock sticks to the bottom of the viewport. */
export const PageScroll: Story = {
  parameters: { pageLevel: true },
  render: (args) => (
    <ChatLayout {...args} scrollContainer="page" composer={<Composer />} className="min-h-dvh">
      <Conversation now={NOW} />
    </ChatLayout>
  ),
};
