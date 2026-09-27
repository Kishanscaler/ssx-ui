import * as React from 'react';
import { FileCode, FilePdf, GraduationCap, Paperclip } from '@phosphor-icons/react';

import { cn } from '../../../lib/cn';
import { chipInteractiveClass, chipVariants } from '../../Chip/Chip';
import {
  ChatComposer,
  ChatComposerAttachment,
  ChatComposerAttachments,
  ChatComposerFooter,
  ChatComposerInput,
  ChatComposerSend,
} from '../../ChatComposer';
import { ChatLayout, type ChatLayoutProps } from '../../ChatLayout';
import {
  ChatMessage,
  ChatMessageActions,
  ChatMessageList,
  ChatMessageMetadata,
  ChatSystemMessage,
  type ChatMessageFeedback,
} from '../../ChatMessage';
import { EmptyState } from '../../EmptyState';
import { IconButton } from '../../IconButton';
import { Markdown } from '../../Markdown';
import { MenuItem, MenuSeparator } from '../../Menu';
import { Stack } from '../../Stack';
import { ChatReasoning, ThinkingIndicator } from '../../ThinkingIndicator';
import { ToolbarSpacer } from '../../Toolbar';

/* Story-only fixture, never exported from the package: a simulated AI tutor
   for a Scaler DSA course. Nothing here talks to a model. A reply "thinks"
   for a moment, then streams a canned Markdown answer word by word on a
   timer, exactly as a real stream arrives: the same component tree, the same
   re-render per chunk. "Now" is fixed so the day separators read
   Yesterday / Today in every run. */

export const NOW = '2026-09-27T21:10:00+05:30';
const BASE = Date.parse(NOW);
const at = (day: 'yesterday' | 'today', hm: string) =>
  `2026-09-${day === 'yesterday' ? '26' : '27'}T${hm}:00+05:30`;

/* ---- canned answers ------------------------------------------------------ */

type Answer = { match: RegExp; reasoning: string; markdown: string };

const ANSWERS: Answer[] = [
  {
    match: /complex|big.?o|log n|time/i,
    reasoning:
      'The student wants the complexity of binary search. Each pass halves the remaining range, so the number of passes is the number of halvings of n before it reaches 1: log2 n. Space is three integers.',
    markdown: [
      '**O(log n) time, O(1) space.** Every pass throws away half of what is left, so for `n = 1,000,000` the loop runs at most 20 times.',
      '',
      '| n | passes (worst case) |',
      '|---:|---:|',
      '| 16 | 4 |',
      '| 1,024 | 10 |',
      '| 1,000,000 | 20 |',
      '',
      'Your version keeps only `lo`, `hi` and `mid`, so the extra space does not grow with the input. The recursive version is O(log n) space because of the call stack.',
    ].join('\n'),
  },
  {
    match: /rotat/i,
    reasoning:
      'Rotated sorted array. One half around mid is always sorted; compare the target with that half to decide which side to keep.',
    markdown: [
      'In a rotated sorted array, **one half around `mid` is always sorted**. Check which one, then ask whether the target falls inside it:',
      '',
      '```python',
      'def search(nums, target):',
      '    lo, hi = 0, len(nums) - 1',
      '    while lo <= hi:',
      '        mid = (lo + hi) // 2',
      '        if nums[mid] == target:',
      '            return mid',
      '        if nums[lo] <= nums[mid]:          # left half sorted',
      '            if nums[lo] <= target < nums[mid]:',
      '                hi = mid - 1',
      '            else:',
      '                lo = mid + 1',
      '        else:                              # right half sorted',
      '            if nums[mid] < target <= nums[hi]:',
      '                lo = mid + 1',
      '            else:',
      '                hi = mid - 1',
      '    return -1',
      '```',
      '',
      'Still O(log n): each pass discards half the range, exactly as in the plain search.',
    ].join('\n'),
  },
  {
    match: /.*/,
    reasoning:
      'The loop never terminates on some inputs. With hi = len(arr) the range is half-open, so `lo <= hi` reads one past the end, and when `hi = mid` is used with `lo <= hi` the range stops shrinking once lo == hi. Walk through a 3-element example, then give both consistent conventions and a checklist.',
    markdown: [
      '## Why it loops forever',
      '',
      'Your three lines disagree about what `hi` means. With `hi = len(arr)` the range is **half-open**, `[lo, hi)`, but `while lo <= hi` treats it as closed. When `lo == hi` the range is empty, yet the loop runs again, and `hi = mid` leaves it exactly where it was.',
      '',
      'Try it on `arr = [1, 3, 5]` with `target = 9`:',
      '',
      '1. `lo = 0, hi = 3` → `mid = 1`, `3 < 9`, so `lo = 2`',
      '2. `lo = 2, hi = 3` → `mid = 2`, `5 < 9`, so `lo = 3`',
      '3. `lo = 3, hi = 3` → `mid = 3`: `arr[3]` is **past the end**',
      '',
      '## Pick one convention and keep all three lines consistent',
      '',
      '| Convention | Start | Loop | Shrink right |',
      '|---|---|---|---|',
      '| Half-open `[lo, hi)` | `hi = len(arr)` | `lo < hi` | `hi = mid` |',
      '| Closed `[lo, hi]` | `hi = len(arr) - 1` | `lo <= hi` | `hi = mid - 1` |',
      '',
      '```python',
      'def lower_bound(arr, target):',
      '    lo, hi = 0, len(arr)        # half-open: [lo, hi)',
      '    while lo < hi:',
      '        mid = (lo + hi) // 2',
      '        if arr[mid] < target:',
      '            lo = mid + 1',
      '        else:',
      '            hi = mid',
      '    return lo',
      '```',
      '',
      '## Before you resubmit',
      '',
      '- Add a test where the target is **larger than every element** (hidden test 7 is probably this one).',
      '- Add one where it is **smaller than every element**, and one with an **empty array**.',
      '- Say out loud what `hi` points at after every line that changes it.',
      '',
      '> A binary search is correct when every pass makes the range strictly smaller. If you can name the pass where it does not, you have found the bug.',
    ].join('\n'),
  },
];

const FALLBACK = ANSWERS[ANSWERS.length - 1] as Answer;
const pick = (question: string): Answer => ANSWERS.find((a) => a.match.test(question)) ?? FALLBACK;

/* ---- the conversation model ------------------------------------------------ */

type UserMessage = {
  id: string;
  from: 'user';
  text: string;
  time: string;
  status: 'sending' | 'sent' | 'failed';
  files?: string[];
};

type AssistantMessage = {
  id: string;
  from: 'assistant';
  time: string;
  phase: 'thinking' | 'streaming' | 'done' | 'stopped';
  answer: Answer;
  /** Tokens of the answer shown so far. */
  shown: number;
  thoughtFor?: number;
};

type SystemLine = { id: string; from: 'system'; text: string; time: string };

type Item = UserMessage | AssistantMessage | SystemLine;

const tokensOf = (md: string) => md.split(/(\s+)/);

function history(): Item[] {
  const first = FALLBACK;
  return [
    {
      id: 'h1',
      from: 'user',
      time: at('yesterday', '22:41'),
      status: 'sent',
      text: 'My binary search for Assignment 4 passes the samples but times out on hidden test 7. I use lo = 0, hi = len(arr) and while lo <= hi. What is wrong?',
    },
    {
      id: 'h2',
      from: 'assistant',
      time: at('yesterday', '22:42'),
      phase: 'done',
      answer: first,
      shown: tokensOf(first.markdown).length,
      thoughtFor: 9,
    },
    { id: 'h3', from: 'system', time: at('today', '09:14'), text: 'You reopened this conversation from Assignment 4' },
    {
      id: 'h4',
      from: 'user',
      time: at('today', '09:20'),
      status: 'sent',
      text: 'Switched to the half-open version. All 12 tests pass now, thanks!',
    },
    {
      id: 'h5',
      from: 'user',
      time: at('today', '09:21'),
      status: 'failed',
      text: 'Can you check my time complexity too?',
    },
  ];
}

const THINK_MS = 1600;
const TOKEN_MS = 28;

export type TutorOptions = { start?: 'history' | 'empty'; tokenMs?: number };

/** The simulation: messages, the one reply in flight, send / stop / retry. */
export function useTutor({ start = 'history', tokenMs = TOKEN_MS }: TutorOptions = {}) {
  const [items, setItems] = React.useState<Item[]>(() => (start === 'history' ? history() : []));
  const timers = React.useRef<number[]>([]);
  const stream = React.useRef<number | undefined>(undefined);
  const clock = React.useRef(0);
  const nextTime = () => {
    clock.current += 1;
    return new Date(BASE + clock.current * 60_000).toISOString();
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  React.useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      window.clearInterval(stream.current);
    },
    [],
  );

  const patch = (id: string, change: Partial<AssistantMessage> | Partial<UserMessage>) =>
    setItems((list) => list.map((m) => (m.id === id ? ({ ...m, ...change } as Item) : m)));

  const reply = (question: string) => {
    const id = `a${Date.now()}`;
    const answer = pick(question);
    const total = tokensOf(answer.markdown).length;
    const started = Date.now();
    setItems((list) => [...list, { id, from: 'assistant', time: nextTime(), phase: 'thinking', answer, shown: 0 }]);
    later(() => {
      patch(id, { phase: 'streaming', thoughtFor: Math.max(1, Math.round((Date.now() - started) / 1000)) });
      let shown = 0;
      window.clearInterval(stream.current);
      stream.current = window.setInterval(() => {
        // One or two words a tick, as tokens arrive.
        shown = Math.min(total, shown + 2 + (shown % 3 === 0 ? 2 : 0));
        if (shown >= total) {
          window.clearInterval(stream.current);
          stream.current = undefined;
          patch(id, { shown: total, phase: 'done' });
        } else {
          patch(id, { shown });
        }
      }, tokenMs);
    }, THINK_MS);
  };

  const inFlight = items.find(
    (m): m is AssistantMessage => m.from === 'assistant' && (m.phase === 'thinking' || m.phase === 'streaming'),
  );

  const send = (text: string, files: string[] = []) => {
    const id = `u${Date.now()}`;
    setItems((list) => [...list, { id, from: 'user', text, files, time: nextTime(), status: 'sending' }]);
    later(() => {
      patch(id, { status: 'sent' });
      reply(text);
    }, 450);
  };

  const retry = (id: string) => {
    const message = items.find((m): m is UserMessage => m.id === id && m.from === 'user');
    if (!message) return;
    patch(id, { status: 'sending' });
    later(() => {
      patch(id, { status: 'sent' });
      reply(message.text);
    }, 600);
  };

  const stop = () => {
    if (!inFlight) return;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    window.clearInterval(stream.current);
    stream.current = undefined;
    // A stop while still thinking drops the empty reply.
    if (inFlight.phase === 'thinking') setItems((list) => list.filter((m) => m.id !== inFlight.id));
    else patch(inFlight.id, { phase: 'stopped' });
  };

  const regenerate = (id: string) => {
    const index = items.findIndex((m) => m.id === id);
    const question = [...items.slice(0, index)].reverse().find((m): m is UserMessage => m.from === 'user');
    setItems((list) => list.filter((m) => m.id !== id));
    reply(question?.text ?? '');
  };

  return { items, streaming: Boolean(inFlight), send, stop, retry, regenerate };
}

/* ---- the chat, composed ------------------------------------------------------- */

const SUGGESTIONS = [
  'Why does my binary search loop forever?',
  'What is the time complexity of binary search?',
  'How do I search a rotated sorted array?',
];

const moreMenu = (
  <>
    <MenuItem>Explain more simply</MenuItem>
    <MenuItem>Show a worked example</MenuItem>
    <MenuSeparator />
    <MenuItem>Report a problem</MenuItem>
  </>
);

type Attachment = { id: string; name: string; progress: number; error?: string };

function AssistantReply({
  message,
  latest,
  compact,
  onRegenerate,
}: {
  message: AssistantMessage;
  latest: boolean;
  compact: boolean;
  onRegenerate: () => void;
}) {
  const [rating, setRating] = React.useState<ChatMessageFeedback>('');
  const tokens = React.useMemo(() => tokensOf(message.answer.markdown), [message.answer.markdown]);
  const text = tokens.slice(0, message.shown).join('');
  const streaming = message.phase === 'streaming';
  const settled = message.phase === 'done' || message.phase === 'stopped';
  return (
    <ChatMessage
      from="assistant"
      time={message.time}
      metadata={
        settled ? (
          <ChatMessageMetadata time={message.time} model="Scaler Tutor">
            {message.phase === 'stopped' ? 'Stopped' : null}
          </ChatMessageMetadata>
        ) : null
      }
      actions={
        settled ? (
          <ChatMessageActions
            copyValue={text}
            onRegenerate={onRegenerate}
            feedback={rating}
            onFeedbackChange={setRating}
            menu={moreMenu}
            visibility={latest ? 'always' : 'hover'}
          />
        ) : null
      }
    >
      <ChatReasoning duration={message.thoughtFor} className="mb-3">
        {message.answer.reasoning}
      </ChatReasoning>
      <Markdown
        streaming={streaming}
        truncated={message.phase === 'stopped'}
        density={compact ? 'compact' : 'default'}
        headingLevelStart={3}
      >
        {text}
      </Markdown>
    </ChatMessage>
  );
}

export type TutorChatProps = Omit<ChatLayoutProps, 'children' | 'composer' | 'emptyState' | 'empty'> & {
  start?: TutorOptions['start'];
  /** Markdown `density="compact"` and a tighter empty state, for panels and sheets. */
  compact?: boolean;
  /** Called with `streaming` whenever it changes (a drawer keeps Escape for Stop). */
  onStreamingChange?: (streaming: boolean) => void;
  tokenMs?: number;
};

/** The whole AI tutor: ChatLayout + ChatMessageList + ChatComposer, on the simulation. */
export function TutorChat({ start, compact = false, onStreamingChange, tokenMs, ...layout }: TutorChatProps) {
  const tutor = useTutor({ start, tokenMs });
  const [draft, setDraft] = React.useState('');
  const [files, setFiles] = React.useState<Attachment[]>([]);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    onStreamingChange?.(tutor.streaming);
  }, [tutor.streaming, onStreamingChange]);

  // A fake upload: the bar fills in about a second.
  const attach = () => {
    const id = `f${Date.now()}`;
    const name = files.length % 2 === 0 ? 'binary-search.py' : 'assignment-4.pdf';
    setFiles((list) => [...list, { id, name, progress: 8 }]);
    const tick = window.setInterval(() => {
      setFiles((list) =>
        list.map((f) => (f.id === id ? { ...f, progress: Math.min(100, f.progress + 23) } : f)),
      );
    }, 220);
    window.setTimeout(() => window.clearInterval(tick), 1200);
  };

  const fill = (text: string) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  const lastAssistant = [...tutor.items].reverse().find((m) => m.from === 'assistant');

  const composer = (
    <ChatComposer
      value={draft}
      onValueChange={setDraft}
      streaming={tutor.streaming}
      onStop={tutor.stop}
      onSubmit={(text) => {
        const ready = files.filter((f) => f.progress >= 100 && !f.error).map((f) => f.name);
        tutor.send(text, ready);
        setFiles([]);
      }}
    >
      <ChatComposerAttachments>
        {files.map((f) => (
          <ChatComposerAttachment
            key={f.id}
            icon={f.name.endsWith('.pdf') ? <FilePdf /> : <FileCode />}
            progress={f.progress}
            error={f.error}
            onRemove={() => setFiles((list) => list.filter((x) => x.id !== f.id))}
          >
            {f.name}
          </ChatComposerAttachment>
        ))}
      </ChatComposerAttachments>
      <ChatComposerInput ref={inputRef} placeholder="Ask the DSA tutor…" />
      <ChatComposerFooter>
        <IconButton variant="tertiary" aria-label="Attach a file" onClick={attach}>
          <Paperclip weight="bold" />
        </IconButton>
        <ToolbarSpacer />
        <ChatComposerSend />
      </ChatComposerFooter>
    </ChatComposer>
  );

  const emptyState = (
    <Stack align="center" gap={compact ? 2 : 4}>
      <EmptyState
        icon={<GraduationCap weight="duotone" />}
        title="Ask the DSA tutor"
        titleAs="h2"
        description="Stuck on an assignment? Paste your code or describe the bug. The tutor explains the idea, not just the answer."
        className={cn(compact ? 'px-2 py-4' : 'py-6')}
      />
      <Stack
        as="ul"
        direction="horizontal"
        wrap
        justify="center"
        gap={2}
        aria-label="Suggested questions"
        className="m-0 list-none p-0"
      >
        {SUGGESTIONS.map((s) => (
          <li key={s} className="flex max-w-full">
            {/* A one-shot action, not a toggle: a chip-shaped button (see the report: Chip has no action form). */}
            <button
              type="button"
              className={cn(chipVariants(), chipInteractiveClass, 'h-auto min-h-7 whitespace-normal py-1 text-start')}
              onClick={() => fill(s)}
            >
              {s}
            </button>
          </li>
        ))}
      </Stack>
    </Stack>
  );

  return (
    <ChatLayout
      composer={composer}
      emptyState={emptyState}
      empty={tutor.items.length === 0}
      {...layout}
    >
      <ChatMessageList aria-label="Conversation with Scaler Tutor" daySeparators now={NOW}>
        {tutor.items.map((m) => {
          if (m.from === 'system') {
            return (
              <ChatSystemMessage key={m.id} time={m.time}>
                {m.text}
              </ChatSystemMessage>
            );
          }
          if (m.from === 'user') {
            return (
              <ChatMessage
                key={m.id}
                from="user"
                time={m.time}
                status={m.status}
                onRetry={m.status === 'failed' ? () => tutor.retry(m.id) : undefined}
              >
                {m.text}
                {m.files && m.files.length ? (
                  <span className="mt-2 flex flex-wrap gap-2">
                    {m.files.map((f) => (
                      <span key={f} data-slot="chip" className={chipVariants()}>
                        {f.endsWith('.pdf') ? <FilePdf /> : <FileCode />}
                        <span className="min-w-0 truncate">{f}</span>
                      </span>
                    ))}
                  </span>
                ) : null}
              </ChatMessage>
            );
          }
          if (m.phase === 'thinking') return <ThinkingIndicator key={m.id} />;
          return (
            <AssistantReply
              key={m.id}
              message={m}
              compact={compact}
              latest={m === lastAssistant}
              onRegenerate={() => tutor.regenerate(m.id)}
            />
          );
        })}
      </ChatMessageList>
    </ChatLayout>
  );
}
