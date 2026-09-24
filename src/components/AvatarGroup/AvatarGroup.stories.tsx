import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

// No new component: the Avatar Group molecule IS `AvatarGroup` + `AvatarGroupCount`
// from the Avatar atom. This file documents the HTML's `avatar-group` block with them.
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, type AvatarSize } from '../Avatar';
import { Badge } from '../Badge';
import { Text } from '../Text';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

type Person = readonly [name: string, initials: string];

const COHORT: Person[] = [
  ['Aarav Krishnan', 'AK'],
  ['Diya Menon', 'DM'],
  ['Kabir Sethi', 'KS'],
  ['Ishita Rao', 'IR'],
  ['Vivaan Joshi', 'VJ'],
];
const MENTORS: Person[] = [
  ['Anshuman Singh', 'AS'],
  ['Naman Bhalla', 'NB'],
  ['Rishabh Poddar', 'RP'],
];

/** Story-only: the "+N" pattern from a list and a max, the way a consumer composes it. */
function People({ people, max, size, overflowNoun }: { people: Person[]; max: number; size: AvatarSize; overflowNoun: string }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <AvatarGroup size={size}>
      {shown.map(([name, initials]) => (
        <Avatar key={initials} aria-label={name}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 ? (
        <AvatarGroupCount role="img" aria-hidden={false} aria-label={`${rest} more ${overflowNoun}`}>
          +{rest}
        </AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}

const meta = {
  title: 'Molecules/AvatarGroup',
  component: AvatarGroup,
  subcomponents: { Avatar, AvatarGroupCount },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'An overlapped stack standing for a set of people, with a "+N" when the set outruns the space.',
          'A summary, never the only way to reach a person. Shipped by the Avatar atom (`AvatarGroup`,',
          '`AvatarGroupCount`): 10px overlap, each avatar cut out by a `surface` ring so the stack',
          're-separates in dark. Name it once on the group (`aria-label` → `role="img"`), or name each',
          'avatar and the count, as the HTML does.',
        ].join('\n'),
      },
    },
  },
  args: { size: 'sm', 'aria-label': 'Aarav Krishnan, Diya Menon, Kabir Sethi and 7 more students in Cohort 7' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    'aria-label': { control: 'text' },
  },
  render: (args) => (
    <AvatarGroup {...args}>
      {COHORT.slice(0, 3).map(([, initials]) => (
        <Avatar key={initials}>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      ))}
      <AvatarGroupCount>+7</AvatarGroupCount>
    </AvatarGroup>
  ),
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's counts: 3, 5, and an overflow. Each avatar and the count are named. */
export const Counts: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      <Spec label="3 · mentors on a review panel">
        <People people={MENTORS} max={3} size="sm" overflowNoun="mentors" />
      </Spec>
      <Spec label="5 · capstone team">
        <People people={COHORT} max={5} size="sm" overflowNoun="students" />
      </Spec>
      <Spec label="overflow · +7">
        <AvatarGroup size="sm">
          {COHORT.slice(0, 3).map(([name, initials]) => (
            <Avatar key={initials} aria-label={name}>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount role="img" aria-hidden={false} aria-label="7 more students in Cohort 7">
            +7
          </AvatarGroupCount>
        </AvatarGroup>
      </Spec>
    </Row>
  ),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Row>
      {(
        [
          ['sm', 'sm (28px)'],
          ['md', 'md (40px)'],
          ['lg', 'lg (48px)'],
        ] as const
      ).map(([size, label]) => (
        <Spec key={size} label={label}>
          <AvatarGroup size={size} aria-label="Anshuman Singh, Naman Bhalla and 3 more mentors">
            <Avatar>
              <AvatarFallback>AS</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>NB</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </Spec>
      ))}
    </Row>
  ),
};

export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="cohort row" wide>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 640 }}>
          <AvatarGroup size="sm" aria-label="Aarav Krishnan, Diya Menon, Kabir Sethi, Ishita Rao and 7 more students">
            {COHORT.slice(0, 4).map(([, initials]) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+7</AvatarGroupCount>
          </AvatarGroup>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" tone="secondary">
              Cohort 7 · Bengaluru · 11 students in the Distributed Systems elective
            </Text>
          </div>
          <Badge tone="brand">Batch of 2029</Badge>
        </div>
      </Spec>
    </Stack>
  ),
};
