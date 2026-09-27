import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Markdown, type MarkdownProps } from './Markdown';
import { binarySearchAnswer, compactAnswer, feeBreakdown, safetyDoc } from './_fixtures/content';
import { Button } from '../Button';
import { CodeToken, type CodeTokenKind } from '../Code';
import { Heading } from '../Heading';
import { Text } from '../Text';

const meta = {
  title: 'AI/Markdown',
  component: Markdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Renders a markdown string (an AI answer, a mentor note, a forum post) with the system’s own atoms:',
          '`Heading`, `Text`, `Link`, `Code` / `CodeBlock` + `CopyButton`, `Table`, `Divider`. Parsing is `marked`’s',
          'lexer only; tokens become React elements, never an HTML string. Raw HTML renders as text, and only',
          'http, https, mailto, tel and relative URLs become links (http(s) and relative for images).',
          '',
          'A server component: an RSC page renders stored markdown with no client JS of its own. `streaming`',
          'repairs a half-arrived tail (open fence, half `**`, half link, half table row) and keeps every',
          'finished block’s DOM. No max width is set; a chat message caps at `max-w-(--size-measure-max)` (72ch).',
        ].join('\n'),
      },
    },
  },
  args: {
    children: binarySearchAnswer,
    headingLevelStart: 2,
    density: 'default',
    externalLinks: 'same-tab',
    streaming: false,
  },
  argTypes: {
    children: { control: 'text' },
    density: { control: 'inline-radio', options: ['default', 'compact'] },
    externalLinks: { control: 'inline-radio', options: ['same-tab', 'new-tab'] },
    headingLevelStart: { control: { type: 'number', min: 1, max: 6 } },
  },
  decorators: [
    (Story) => (
      <div className="max-w-(--size-measure-max)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The AI tutor explaining binary search: headings, an ordered list, code, a quote, a table, tasks. */
export const TutorAnswer: Story = {};

/** A fee table: right-aligned amounts are Table's numeric cells, in tabular figures. */
export const FeeBreakdown: Story = {
  args: { children: feeBreakdown },
};

/** Read-only task lists and nested lists. The glyph is not a control; the state is spoken. */
export const ListsAndTasks: Story = {
  args: {
    children: `### Week 6 checklist

- [x] Watch *Recursion II* (lecture 12)
- [x] Submit **Assignment 4**
- [ ] Book a mock interview with your mentor
- [ ] Revise \`merge sort\` before Friday's contest

### How the contest is scored

3. Each accepted solution earns its problem's points.
4. Wrong submissions cost a penalty:
   - 5 minutes per wrong attempt
   - no penalty for compile errors
     - but they still count towards the attempt limit
5. Ties break on total time.

> Your mentor sees this checklist too. Ticking an item here is not how you mark it done; use the **Progress** tab.`,
  },
};

/**
 * The text arrives in chunks on a timer, as an LLM streams it. The open
 * fence renders as a growing CodeBlock, half-typed `**` / links / table rows
 * never flash, and finished blocks keep their DOM.
 */
export const Streaming: Story = {
  parameters: { controls: { disable: true } },
  render: function Render(args) {
    const full = binarySearchAnswer;
    const [cut, setCut] = React.useState(0);
    const [run, setRun] = React.useState(0);
    React.useEffect(() => {
      setCut(0);
      let at = 0;
      const id = setInterval(() => {
        // Chunks of 2–9 characters, like a token stream.
        at = Math.min(full.length, at + 2 + Math.floor(Math.random() * 8));
        setCut(at);
        if (at >= full.length) clearInterval(id);
      }, 30);
      return () => clearInterval(id);
    }, [full, run]);
    const done = cut >= full.length;
    return (
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>
            Restart stream
          </Button>
          <Text as="span" size="sm" tone="secondary" className="tabular-nums" aria-live="off">
            {done ? 'Done' : `Streaming… ${cut} / ${full.length}`}
          </Text>
        </div>
        <Markdown {...args} streaming={!done}>
          {full.slice(0, cut)}
        </Markdown>
      </div>
    );
  },
};

/**
 * Hostile input, shown inert: script URLs render as text, raw HTML shows as
 * the literal text it is, an unsafe image falls back to its alt text.
 */
export const Safety: Story = {
  args: { children: safetyDoc },
};

/** `density="compact"` in a 360px chat panel: tighter blocks, headings a role smaller, a compact table. */
export const Compact: Story = {
  args: { children: compactAnswer, density: 'compact' },
  render: (args) => (
    <div className="w-[22.5rem] max-w-full rounded-lg border border-border-decorative bg-surface-raised p-4">
      <Markdown {...args} />
    </div>
  ),
};

/**
 * The markdown sits inside an h2 section, so `#` should be an h3:
 * `headingLevelStart={3}`. Levels past h6 clamp.
 */
export const HeadingLevelStart: Story = {
  args: {
    headingLevelStart: 3,
    children: `# Your question

How do I pick between BFS and DFS?

## Short answer

BFS for shortest paths in unweighted graphs; DFS for exhaustive search and cycle detection.

### Rule of thumb

If the answer is "the nearest", think **BFS**.`,
  },
  render: (args) => (
    <section className="grid gap-4">
      <Heading as="h2">Doubt #4182 · Graphs</Heading>
      <Markdown {...args} />
    </section>
  ),
};

/* A tiny illustrative highlighter: keywords, strings, numbers and comments. */
const PY_KEYWORDS = /^(def|return|while|if|else|for|in|import|from|class|lambda|and|or|not|None|True|False)$/;
function toyHighlight(code: string, lang: string | undefined): React.ReactNode | null {
  if (lang !== 'python') return null;
  const parts = code.split(/(#[^\n]*|"""[\s\S]*?"""|"[^"\n]*"|'[^'\n]*'|\b\d+\b|\b[A-Za-z_]\w*\b)/);
  return parts.map((part, i) => {
    let kind: CodeTokenKind | null = null;
    if (part.startsWith('#')) kind = 'comment';
    else if (/^["']/.test(part)) kind = 'string';
    else if (/^\d+$/.test(part)) kind = 'number';
    else if (PY_KEYWORDS.test(part)) kind = 'keyword';
    else if (/^[A-Za-z_]\w*$/.test(part) && code.slice(code.indexOf(part) + part.length).startsWith('(')) kind = 'function';
    return kind ? (
      <CodeToken key={i} kind={kind}>
        {part}
      </CodeToken>
    ) : (
      part
    );
  });
}

/**
 * Highlighting is opt-in through `highlight(code, lang)`: return `CodeToken`s
 * (or a highlighter's output mapped onto them), or `null` for plain text.
 * This story uses a toy regex highlighter; in production run shiki in a
 * Server Component and map its tokens onto `CodeToken`.
 */
export const WithHighlight: Story = {
  args: {
    children: binarySearchAnswer.slice(
      binarySearchAnswer.indexOf('### Code'),
      binarySearchAnswer.indexOf('> **Why'),
    ),
    highlight: toyHighlight as MarkdownProps['highlight'],
  },
};

/**
 * `renderLink` routes links through your router while keeping Link's look
 * (the element is wrapped in `<Link asChild>`); here a stand-in for
 * `next/link` marks internal links. `externalLinks="new-tab"` gives external
 * ones a new tab and the external glyph.
 */
export const RoutedLinks: Story = {
  args: {
    externalLinks: 'new-tab',
    children:
      'Continue with [Module 6, lecture 2](/academy/modules/6/lectures/2), or read the [Python `bisect` docs](https://docs.python.org/3/library/bisect.html). Questions: [help@scaler.com](mailto:help@scaler.com).',
    renderLink: (({ href, external, children }) =>
      external || !href.startsWith('/') ? null : (
        <a href={href} data-router="next-link">
          {children}
        </a>
      )) as MarkdownProps['renderLink'],
  },
};
