import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CaretDown, ChatCircle, FileCode, FilePdf, FileText, Globe, Paperclip, Sparkle } from '@phosphor-icons/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Kbd } from '../Kbd';
import { Menu, MenuContent, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuTrigger } from '../Menu';
import { ProgressBar } from '../ProgressBar';
import {
  SideDrawer,
  SideDrawerBody,
  SideDrawerContent,
  SideDrawerDescription,
  SideDrawerFooter,
  SideDrawerHeader,
  SideDrawerTitle,
  SideDrawerTrigger,
} from '../SideDrawer';
import { Text } from '../Text';
import { ToggleButton } from '../ToggleButton';
import { ToolbarSpacer } from '../Toolbar';
import {
  ChatComposer,
  ChatComposerAttachment,
  ChatComposerAttachments,
  ChatComposerFooter,
  ChatComposerHeader,
  ChatComposerInput,
  ChatComposerSend,
  ChatComposerStatus,
  type ChatComposerProps,
} from './ChatComposer';

const meta = {
  title: 'AI/ChatComposer',
  component: ChatComposer,
  subcomponents: {
    ChatComposerInput,
    ChatComposerSend,
    ChatComposerAttachments,
    ChatComposerAttachment,
    ChatComposerHeader,
    ChatComposerFooter,
    ChatComposerStatus,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'The message box of a chat surface: a draft, its attachments, a row of actions and the Send button that',
          'turns into Stop while a reply streams. Enter sends, Shift+Enter is a newline, and an Enter that commits',
          'an IME composition (Hindi, Japanese) never sends. The draft is cleared after `onSubmit`; return `false`',
          '(or a promise that rejects / resolves `false`) to keep it. `raised` floats over a conversation, `flat` is',
          'a field. It sizes to its CONTAINER (`@container`), so it works full page, in a 360px panel and in a SideDrawer.',
          'The header and footer are Toolbars with `size="sm"`: the Buttons in them are small without a size each.',
        ].join(' '),
      },
    },
  },
  args: { elevation: 'raised', streaming: false, disabled: false, statusPosition: 'above' },
  argTypes: {
    elevation: { control: 'inline-radio', options: ['raised', 'flat'] },
    statusPosition: { control: 'inline-radio', options: ['above', 'below'] },
    streaming: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof ChatComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

const PLACEHOLDER = 'Ask the DSA tutor about this assignment…';

/** A reply "streams" for a few seconds after each send, so Send → Stop can be seen. */
function useFakeStream(seconds = 6) {
  const [streaming, setStreaming] = React.useState(false);
  const [left, setLeft] = React.useState(0);
  const timer = React.useRef<number | undefined>(undefined);
  const stop = React.useCallback(() => {
    window.clearInterval(timer.current);
    setStreaming(false);
    setLeft(0);
  }, []);
  const start = React.useCallback(() => {
    window.clearInterval(timer.current);
    setStreaming(true);
    setLeft(seconds);
    timer.current = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(timer.current);
          setStreaming(false);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  }, [seconds]);
  React.useEffect(() => () => window.clearInterval(timer.current), []);
  return { streaming, left, start, stop };
}

/** The last few messages sent, shown under the composer so the story proves what was sent. */
function SentLog({ sent }: { sent: string[] }) {
  if (!sent.length) return null;
  return (
    <div className="mt-3 grid gap-1">
      <Text size="xs" tone="secondary">
        Sent
      </Text>
      {sent.slice(-3).map((m, i) => (
        <Text key={i} size="sm" className="whitespace-pre-wrap">
          {m}
        </Text>
      ))}
    </div>
  );
}

/** Input and Send. Type, then Enter (or the arrow). */
export const Simple: Story = {
  render: (args) => {
    const [sent, setSent] = React.useState<string[]>([]);
    return (
      <div className="max-w-[40rem]">
        <ChatComposer {...args} onSubmit={(v) => setSent((s) => [...s, v])}>
          <ChatComposerInput placeholder={PLACEHOLDER} />
          <ChatComposerFooter>
            <ChatComposerSend />
          </ChatComposerFooter>
        </ChatComposer>
        <SentLog sent={sent} />
      </div>
    );
  },
};

function Basic(props: Partial<ChatComposerProps>) {
  return (
    <ChatComposer {...props}>
      <ChatComposerInput placeholder={PLACEHOLDER} />
      <ChatComposerFooter>
        <IconButton variant="tertiary" aria-label="Attach a file">
          <Paperclip weight="bold" />
        </IconButton>
        <ToolbarSpacer />
        <ChatComposerSend />
      </ChatComposerFooter>
    </ChatComposer>
  );
}

/**
 * `raised` (default): the raised surface and `shadow-raised`, for a composer floating over a
 * conversation. `flat`: Input's border, hover and 3px focus ring round the frame, for one set into a page.
 */
export const FlatVsRaised: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-[40rem] gap-6">
      <div className="grid gap-2">
        <Text size="sm" tone="secondary">
          elevation="raised"
        </Text>
        <Basic elevation="raised" />
      </div>
      <div className="grid gap-2">
        <Text size="sm" tone="secondary">
          elevation="flat"
        </Text>
        <Basic elevation="flat" />
      </div>
      <div className="grid gap-2">
        <Text size="sm" tone="secondary">
          disabled
        </Text>
        <Basic elevation="flat" disabled defaultValue="Tutor is unavailable during the contest window." />
      </div>
    </div>
  ),
};

const FILES = [
  { name: 'assignment-3.pdf', icon: <FilePdf /> },
  { name: 'binary-search.py', icon: <FileCode />, progress: 64 },
  { name: 'rotated-array-notes.md', icon: <FileText /> },
  { name: 'test-cases.txt', icon: <FileText /> },
  { name: 'lecture-12-recording.mp4', icon: <FileText />, error: 'Too large: 25 MB max' },
];

/**
 * Five attached files: removable Chips, one still uploading (a ProgressBar), one failed (danger ink).
 * More than `collapseAfter` (3) and the strip gets a "5 files" toggle. Removing a file moves focus
 * to the next ✕, and after the last one to the input.
 */
export const WithAttachments: Story = {
  render: (args) => {
    const [files, setFiles] = React.useState(FILES);
    return (
      <div className="max-w-[40rem]">
        <ChatComposer {...args} defaultValue="Why does my binary search loop forever when the array is rotated?">
          <ChatComposerAttachments>
            {files.map((f) => (
              <ChatComposerAttachment
                key={f.name}
                icon={f.icon}
                progress={f.progress}
                error={f.error}
                onRemove={() => setFiles((all) => all.filter((x) => x.name !== f.name))}
              >
                {f.name}
              </ChatComposerAttachment>
            ))}
          </ChatComposerAttachments>
          <ChatComposerInput placeholder={PLACEHOLDER} />
          <ChatComposerFooter>
            <IconButton variant="tertiary" aria-label="Attach a file" onClick={() => setFiles(FILES)}>
              <Paperclip weight="bold" />
            </IconButton>
            <ToolbarSpacer />
            <ChatComposerSend />
          </ChatComposerFooter>
        </ChatComposer>
      </div>
    );
  },
};

/** A small context meter from ProgressBar: "72% of context used". */
function ContextMeter({ used }: { used: number }) {
  return (
    <span data-slot="context-meter" className="flex items-center gap-2 px-1">
      <ProgressBar
        value={used}
        aria-label="Context used"
        aria-valuetext={`${used}% of context used`}
        className="h-1 w-12"
      />
      <Text as="span" size="xs" tone="secondary" className="tabular-nums whitespace-nowrap">
        {used}%<span className="sr-only"> of context used</span>
      </Text>
    </span>
  );
}

const MODELS = [
  { value: 'fast', label: 'Tutor · Fast', description: 'Quick hints, shorter answers' },
  { value: 'deep', label: 'Tutor · Deep', description: 'Step-by-step reasoning, slower' },
  { value: 'review', label: 'Code review', description: 'Reads your attached code first' },
];

function ModelPicker() {
  const [model, setModel] = React.useState('fast');
  const current = MODELS.find((m) => m.value === model) ?? MODELS[0]!;
  return (
    <Menu>
      <MenuTrigger asChild>
        {/* No `size`: the footer's Toolbar makes it `sm`. */}
        <Button variant="neutral" aria-label={`Model: ${current.label}`}>
          <Sparkle />
          {current.label}
          <CaretDown weight="bold" />
        </Button>
      </MenuTrigger>
      <MenuContent align="start">
        <MenuLabel>Model</MenuLabel>
        <MenuRadioGroup value={model} onValueChange={setModel}>
          {MODELS.map((m) => (
            <MenuRadioItem key={m.value} value={m.value} description={m.description}>
              {m.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

/**
 * The footer is a Toolbar with `size="sm"`: attach, a model picker (a Menu on a Button), a web-search
 * toggle and the context meter take the small size with no `size` on any of them. Send is lifted out
 * of the toolbar to the row's end, its own tab stop, and stays 40px.
 */
export const FooterActions: Story = {
  render: (args) => (
    <div className="max-w-[40rem]">
      <ChatComposer {...args}>
        <ChatComposerHeader>
          <Text as="span" size="xs" tone="secondary" className="flex items-center gap-1 px-1">
            <ChatCircle aria-hidden="true" /> DSA · Module 4 · Assignment 3
          </Text>
          <ToolbarSpacer />
          <ContextMeter used={72} />
        </ChatComposerHeader>
        <ChatComposerInput placeholder={PLACEHOLDER} />
        <ChatComposerFooter>
          <IconButton variant="tertiary" aria-label="Attach a file">
            <Paperclip weight="bold" />
          </IconButton>
          <ModelPicker />
          <ToggleButton aria-label="Search the course notes" icon={<Globe />} />
          <ToolbarSpacer />
          <ChatComposerSend />
        </ChatComposerFooter>
      </ChatComposer>
    </div>
  ),
};

/**
 * Send, and a reply "streams" for six seconds: Send becomes Stop (a square, "Stop generating"),
 * never disabled. Escape in the input stops too. The draft stays editable while it streams, but
 * Enter does not send until the reply ends.
 */
export const Streaming: Story = {
  render: (args) => {
    const stream = useFakeStream(6);
    const [sent, setSent] = React.useState<string[]>([]);
    return (
      <div className="max-w-[40rem]">
        <ChatComposer
          {...args}
          streaming={stream.streaming}
          onStop={stream.stop}
          onSubmit={(v) => {
            setSent((s) => [...s, v]);
            stream.start();
          }}
          defaultValue="Walk me through the invariant for lower_bound."
        >
          <ChatComposerInput placeholder={PLACEHOLDER} />
          <ChatComposerFooter>
            <IconButton variant="tertiary" aria-label="Attach a file">
              <Paperclip weight="bold" />
            </IconButton>
            <ToolbarSpacer />
            <ChatComposerSend />
          </ChatComposerFooter>
        </ChatComposer>
        <Text size="sm" tone="secondary" className="mt-3" aria-live="polite">
          {stream.streaming ? `Tutor is replying… ${stream.left}s` : 'Idle'}
        </Text>
        <SentLog sent={sent} />
      </div>
    );
  },
};

/**
 * A failed send. The async `onSubmit` rejects, the draft is put back, and a danger status explains
 * it in a polite live region (always mounted, so it is announced when it appears).
 */
export const StatusError: Story = {
  render: (args) => {
    const [error, setError] = React.useState(true);
    return (
      <div className="max-w-[40rem]">
        <ChatComposer
          {...args}
          defaultValue="Can you check my recurrence for the rotated-array search?"
          onSubmit={() => {
            setError(false);
            return new Promise<void>((_, reject) => window.setTimeout(() => {
              setError(true);
              reject(new Error('offline'));
            }, 600));
          }}
        >
          <ChatComposerStatus
            tone="danger"
            title={error ? "Couldn't send. Check your connection and try again." : undefined}
          />
          <ChatComposerInput placeholder={PLACEHOLDER} />
          <ChatComposerFooter>
            <ChatComposerSend />
          </ChatComposerFooter>
        </ChatComposer>
      </div>
    );
  },
};

/** A warning, below the frame (`statusPosition="below"`), dismissible. */
export const StatusWarning: Story = {
  args: { statusPosition: 'below' },
  render: (args) => (
    <div className="max-w-[40rem]">
      <ChatComposer {...args}>
        <ChatComposerStatus
          tone="warning"
          title="Context window is 90% full"
          description="Older messages will be summarised. Start a new chat for a new topic."
          dismissible
        />
        <ChatComposerInput placeholder={PLACEHOLDER} />
        <ChatComposerFooter>
          <ContextMeter used={90} />
          <ToolbarSpacer />
          <ChatComposerSend />
        </ChatComposerFooter>
      </ChatComposer>
    </div>
  ),
};

function PanelComposer(props: Partial<ChatComposerProps>) {
  const [files, setFiles] = React.useState(FILES.slice(0, 2).map((f) => ({ ...f, progress: undefined })));
  return (
    <ChatComposer {...props}>
      <ChatComposerAttachments>
        {files.map((f) => (
          <ChatComposerAttachment
            key={f.name}
            icon={f.icon}
            onRemove={() => setFiles((all) => all.filter((x) => x.name !== f.name))}
          >
            {f.name}
          </ChatComposerAttachment>
        ))}
      </ChatComposerAttachments>
      <ChatComposerInput placeholder={PLACEHOLDER} />
      <ChatComposerFooter>
        <IconButton variant="tertiary" aria-label="Attach a file">
          <Paperclip weight="bold" />
        </IconButton>
        <ModelPicker />
        <ChatComposerSend />
      </ChatComposerFooter>
    </ChatComposer>
  );
}

/**
 * A 360px side panel. The composer sizes to its container, not the viewport: the frame's padding
 * tightens under 24rem and the footer actions wrap, with Send holding the end.
 */
export const InANarrowPanel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-[22.5rem] max-w-full flex-col gap-3 rounded-lg border border-border-decorative bg-surface p-3">
      <Text size="sm" tone="secondary">
        Side panel · 360px
      </Text>
      <div className="min-h-[10rem] rounded-md bg-surface-sunken" aria-hidden="true" />
      <PanelComposer />
    </div>
  ),
};

/**
 * In a SideDrawer: the conversation scrolls in the body and a `flat` composer sits in the footer.
 * Escape closes a drawer, so while a reply streams the drawer's `onEscapeKeyDown` is prevented and
 * Escape reaches the input to stop the reply instead.
 */
export const InASideDrawer: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const stream = useFakeStream(6);
    return (
      <SideDrawer>
        <SideDrawerTrigger asChild>
          <Button variant="secondary">
            <ChatCircle />
            Ask the DSA tutor
          </Button>
        </SideDrawerTrigger>
        <SideDrawerContent
          onEscapeKeyDown={(event) => {
            if (stream.streaming) event.preventDefault();
          }}
        >
          <SideDrawerHeader eyebrow="DSA · Assignment 3">
            <SideDrawerTitle>AI tutor</SideDrawerTitle>
            <SideDrawerDescription>Hints, not answers. Your attempts stay yours.</SideDrawerDescription>
          </SideDrawerHeader>
          <SideDrawerBody className="grid content-start gap-3">
            <Text size="sm">How do I find the smallest element in a rotated sorted array in O(log n)?</Text>
            <Text size="sm" tone="secondary">
              {stream.streaming
                ? `Replying… ${stream.left}s`
                : 'Compare the middle element with the last one. If it is greater, the minimum is to its right.'}
            </Text>
          </SideDrawerBody>
          <SideDrawerFooter className="block">
            <PanelComposer elevation="flat" streaming={stream.streaming} onStop={stream.stop} onSubmit={() => stream.start()} />
          </SideDrawerFooter>
        </SideDrawerContent>
      </SideDrawer>
    );
  },
};

/**
 * Enter sends; Shift+Enter inserts a newline; Ctrl/⌘+Enter also sends. With an IME (Hindi
 * transliteration, Japanese kana-to-kanji) the Enter that commits the composition only commits: it
 * never sends. Escape stops a streaming reply. `submitOnEnter={false}` makes Enter a newline and
 * leaves Send (and Ctrl/⌘+Enter) to send.
 */
export const Keyboard: Story = {
  render: (args) => {
    const [sent, setSent] = React.useState<string[]>([]);
    return (
      <div className="grid max-w-[40rem] gap-3">
        <Text size="sm" tone="secondary">
          <Kbd>Enter</Kbd> sends · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> new line · <Kbd>Esc</Kbd> stops a reply ·
          an IME's commit <Kbd>Enter</Kbd> never sends
        </Text>
        <ChatComposer {...args} onSubmit={(v) => setSent((s) => [...s, v])}>
          <ChatComposerInput placeholder="Try Enter and Shift+Enter…" />
          <ChatComposerFooter>
            <ChatComposerSend />
          </ChatComposerFooter>
        </ChatComposer>
        <SentLog sent={sent} />
      </div>
    );
  },
};
