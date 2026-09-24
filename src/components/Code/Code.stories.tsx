import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code, CodeBlock, CodeBlockGroup, CodeBlockHeader, CodeToken } from './Code';
import { CopyButton } from './CopyButton';
import { Text } from '../Text';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Code',
  component: Code,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A literal identifier, value or snippet the user might copy. `Code` sits in a sentence (light',
          'sunken fill, on purpose); `CodeBlock` takes a snippet on the code surface, dark in both',
          'themes. A filename bar is `CodeBlockHeader`, joined to its block by `CodeBlockGroup`.',
          'The block does not highlight: pass `CodeToken`s. `CopyButton` is the client leaf.',
        ].join('\n'),
      },
    },
  },
  args: { children: 'applicant_id', tone: 'default' },
  argTypes: { tone: { control: 'inline-radio', options: ['default', 'danger', 'success'] } },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Inline: Story = {
  render: () => (
    <Stack>
      <Spec label="inside a sentence" wide>
        <Text tone="secondary">
          Every applicant record is keyed by <Code>applicant_id</Code>, formatted as <Code>SST-2029-0416</Code>;
          the LMS resolves a student&rsquo;s active enrolment from <Code>GET /v2/cohorts/7/students</Code> and
          caches it for sixty seconds. If the call returns <Code>409 COHORT_LOCKED</Code>, the admissions ops
          console has frozen the roster for the intake and no writes will land.
        </Text>
      </Spec>
      <Row>
        <Spec label="failing identifier">
          <Text size="sm">
            Submission rejected: <Code tone="danger">solution.py</Code> exceeded the 2s limit.
          </Text>
        </Spec>
        <Spec label="passing identifier">
          <Text size="sm">
            All tests green for <Code tone="success">test_bfs.py</Code>.
          </Text>
        </Spec>
      </Row>
    </Stack>
  ),
};

const STREAKS = `def longest_streak(submitted: list[bool]) -> int:
    """Longest run of consecutive days a student shipped DSA work."""
    best = run = 0
    for day in submitted:
        run = run + 1 if day else 0
        best = max(best, run)
    return best


assert longest_streak([True, True, False, True, True, True]) == 3`;

const OVERLOADED = `type Enrolment = { studentId: string; cohort: number; credits: number };

export function overloaded(roster: Enrolment[], cap = 24): Enrolment[] {
  return roster.filter((e) => e.credits > cap);
}`;

export const Block: Story = {
  render: () => (
    <Stack>
      <Spec label="header + copy · Python" wide>
        <CodeBlockGroup>
          <CodeBlockHeader>
            <span>services/lms/analytics/streaks.py</span>
            <CopyButton value={STREAKS} aria-label="Copy streaks.py to the clipboard" />
          </CodeBlockHeader>
          <CodeBlock>{STREAKS}</CodeBlock>
        </CodeBlockGroup>
      </Spec>
      <Spec label="header + meta · TypeScript" wide>
        <CodeBlockGroup>
          <CodeBlockHeader>
            <span>apps/faculty-portal/src/roster/overloaded.ts</span>
            <span className="tabular-nums">TypeScript · 5 lines</span>
          </CodeBlockHeader>
          <CodeBlock>{OVERLOADED}</CodeBlock>
        </CodeBlockGroup>
      </Spec>
      <Spec label="no header" wide>
        <CodeBlock>{'npm install @kishanscaler/ssx-ui'}</CodeBlock>
      </Spec>
    </Stack>
  ),
};

const K = ({ children }: { children: React.ReactNode }) => <CodeToken kind="keyword">{children}</CodeToken>;

const KINDS: Array<[React.ComponentProps<typeof CodeToken>['kind'], string]> = [
  ['keyword', 'keyword — text-code-keyword'],
  ['function', 'function — text-code-function'],
  ['string', 'string — text-code-string'],
  ['number', 'number — text-code-number'],
  ['comment', 'comment — text-code-comment'],
];

export const SyntaxTokens: Story = {
  render: () => (
    <Stack>
      <Spec label="the five kinds, against the code surface (`text-content-code` for anything left plain)" wide>
        <CodeBlockGroup>
          <CodeBlockHeader>
            <span>tokens</span>
          </CodeBlockHeader>
          <CodeBlock>
            {KINDS.map(([kind, label], i) => (
              <React.Fragment key={kind}>
                {i > 0 ? '\n' : null}
                <CodeToken kind={kind}>{kind}</CodeToken>
                {'  '}
                <CodeToken kind="comment"># {label}</CodeToken>
              </React.Fragment>
            ))}
          </CodeBlock>
        </CodeBlockGroup>
      </Spec>
      <Spec label="pre-tokenised children, in a real snippet" wide>
        <CodeBlockGroup>
          <CodeBlockHeader>
            <span>bfs.py</span>
            <span>Week 6 · Graphs</span>
          </CodeBlockHeader>
          <CodeBlock>
            <CodeToken kind="comment"># shortest unweighted path</CodeToken>
            {'\n'}
            <K>def</K> <CodeToken kind="function">bfs</CodeToken>
            {'(graph, start):\n    seen = {start}\n    queue = deque([(start, '}
            <CodeToken kind="number">0</CodeToken>
            {')])\n    '}
            <K>while</K>
            {' queue:\n        node, dist = queue.popleft()\n        '}
            <K>yield</K>
            {' node, dist\n        '}
            <K>for</K> {'nxt '}
            <K>in</K>
            {' graph[node]:\n            '}
            <K>if</K> {'nxt '}
            <K>not in</K>
            {' seen:\n                seen.add(nxt)\n                queue.append((nxt, dist + '}
            <CodeToken kind="number">1</CodeToken>
            {'))\n    label = '}
            <CodeToken kind="string">&quot;visited&quot;</CodeToken>
          </CodeBlock>
        </CodeBlockGroup>
      </Spec>
    </Stack>
  ),
};
