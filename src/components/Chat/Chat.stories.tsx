import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatCircleDots } from '@phosphor-icons/react';

import { Badge } from '../Badge';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '../BottomSheet';
import { Button } from '../Button';
import { ChatAssistantAvatar } from '../ChatMessage';
import { Heading } from '../Heading';
import { Markdown } from '../Markdown';
import { ResizeGroup, ResizeHandle, ResizePane } from '../ResizeHandle';
import {
  SideDrawer,
  SideDrawerContent,
  SideDrawerDescription,
  SideDrawerHeader,
  SideDrawerTitle,
  SideDrawerTrigger,
} from '../SideDrawer';
import { Text } from '../Text';
import { TutorChat } from './_fixtures/tutor';

/* The end-to-end chat: every AI piece composed on a simulated tutor (the
   simulation is in ./_fixtures/tutor.tsx; the components know nothing of it).
   Send a message and watch it think, reason ("Thought for Ns"), stream
   Markdown and settle into its action row. Scroll up while it streams: you
   stay where you are and the scroll button counts what arrives. */

const meta = {
  title: 'AI/Chat',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The AI tutor end to end: `ChatLayout` + `ChatMessageList` + `ChatMessage` + `Markdown` (streaming) +',
          '`ThinkingIndicator` → `ChatReasoning` + `ChatMessageActions` + `ChatComposer` (attachments, Stop).',
          'The same component in five containers: the page, a 400×640 card, a SideDrawer, a resizable side pane',
          'beside course content, and a full BottomSheet on a phone. It adapts to its CONTAINER, not the viewport.',
          'Try: a suggestion chip (empty state), the paperclip (a fake upload), Stop while it streams, Retry on the',
          'failed message, and scrolling up mid-stream.',
        ].join(' '),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ChatHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border-decorative px-4 py-3">
      <ChatAssistantAvatar />
      <div className="grid min-w-0 flex-1">
        <Heading as="h2" size="3" className="m-0 truncate">
          Scaler Tutor
        </Heading>
        <Text as="span" size="xs" tone="secondary" className="truncate">
          DSA · Module 3 · Binary search
        </Text>
      </div>
      {children}
    </div>
  );
}

/** The whole page: a header bar and the chat filling the rest. Comfortable density, a centred column. */
export const FullPage: Story = {
  parameters: { pageLevel: true, layout: 'fullscreen' },
  render: () => (
    <div className="flex h-dvh flex-col bg-page">
      <ChatHeader>
        <Badge tone="brand">Beta</Badge>
      </ChatHeader>
      <TutorChat />
    </div>
  ),
};

/** A ~400×640 card: compact density (under 36rem), starting empty with suggestion chips. */
export const Panel: Story = {
  render: () => (
    <div
      data-elevation="raised"
      className="flex h-[40rem] max-h-[calc(100dvh-2*var(--space-gutter))] w-[25rem] max-w-full flex-col overflow-hidden rounded-xl border border-border-raised bg-surface-raised shadow-raised"
    >
      <ChatHeader />
      <TutorChat start="empty" compact />
    </div>
  ),
};

/**
 * In a SideDrawer, as the drawer's middle row in place of SideDrawerBody (the layout is its own
 * scroller). Escape stops a streaming reply instead of closing the drawer.
 */
export const InSideDrawer: Story = {
  render: () => {
    const [streaming, setStreaming] = React.useState(false);
    return (
      <SideDrawer defaultOpen>
        <SideDrawerTrigger asChild>
          <Button>
            <ChatCircleDots weight="bold" />
            Ask the tutor
          </Button>
        </SideDrawerTrigger>
        <SideDrawerContent
          onEscapeKeyDown={(event) => {
            if (streaming) event.preventDefault();
          }}
        >
          <SideDrawerHeader eyebrow="DSA · Assignment 4">
            <SideDrawerTitle>Scaler Tutor</SideDrawerTitle>
            <SideDrawerDescription>Explains the idea, not just the answer.</SideDrawerDescription>
          </SideDrawerHeader>
          <TutorChat compact onStreamingChange={setStreaming} />
        </SideDrawerContent>
      </SideDrawer>
    );
  },
};

const LESSON = [
  '# Binary search: the off-by-one',
  '',
  'Binary search finds a value in a **sorted** array by halving the range it could be in, so it takes O(log n) comparisons instead of O(n).',
  '',
  'Every correct binary search agrees on one thing: what `hi` means. Either it is the last index that could still hold the target (a **closed** range, `[lo, hi]`), or one past it (a **half-open** range, `[lo, hi)`). Mixing the two is the most common bug in this module.',
  '',
  '```python',
  'lo, hi = 0, len(arr)      # half-open',
  'while lo < hi:',
  '    mid = (lo + hi) // 2',
  '    if arr[mid] < target:',
  '        lo = mid + 1',
  '    else:',
  '        hi = mid',
  '```',
  '',
  '## Practice',
  '',
  '1. Rewrite the loop above as a closed range.',
  '2. Find the first element greater than the target.',
  '3. Search a rotated sorted array.',
].join('\n');

/** Story-only: the viewport is under `sm` (672px). */
function useNarrow() {
  const query = '(max-width: 671px)';
  const [narrow, setNarrow] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  React.useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setNarrow(list.matches);
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, []);
  return narrow;
}

/**
 * A course page with the chat in a resizable side pane (ResizeGroup). Drag the handle: the chat
 * steps between compact and comfortable at 36rem of its own width.
 */
export const SidePanel: Story = {
  parameters: { pageLevel: true, layout: 'fullscreen' },
  render: () => {
    // Below `sm` there is no room beside the lesson: the chat goes under it.
    const narrow = useNarrow();
    return (
    <ResizeGroup
      direction={narrow ? 'vertical' : 'horizontal'}
      defaultValue={narrow ? 40 : 62}
      min={narrow ? 25 : 35}
      max={75}
      className="h-dvh bg-page"
    >
      <ResizePane>
        <article className="mx-auto max-w-(--size-measure-max) px-gutter py-8">
          <Markdown headingLevelStart={1}>{LESSON}</Markdown>
        </article>
      </ResizePane>
      <ResizeHandle aria-label="Resize the tutor panel" />
      <ResizePane className="flex flex-col overflow-hidden">
        <ChatHeader />
        <TutorChat start="empty" compact />
      </ResizePane>
    </ResizeGroup>
    );
  },
};

/** On a phone: a full BottomSheet holding the chat. Set a mobile viewport. */
export const MobileSheet: Story = {
  globals: { viewport: { value: 'mobile', isRotated: false } },
  render: () => {
    const [streaming, setStreaming] = React.useState(false);
    return (
      <BottomSheet defaultOpen>
        <BottomSheetTrigger asChild>
          <Button>
            <ChatCircleDots weight="bold" />
            Ask the tutor
          </Button>
        </BottomSheetTrigger>
        <BottomSheetContent
          size="full"
          onEscapeKeyDown={(event) => {
            if (streaming) event.preventDefault();
          }}
        >
          <BottomSheetHeader eyebrow="DSA · Assignment 4">
            <BottomSheetTitle>Scaler Tutor</BottomSheetTitle>
            <BottomSheetDescription className="sr-only">Chat with the DSA tutor</BottomSheetDescription>
          </BottomSheetHeader>
          <TutorChat compact onStreamingChange={setStreaming} />
        </BottomSheetContent>
      </BottomSheet>
    );
  },
};
