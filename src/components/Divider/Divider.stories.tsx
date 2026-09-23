import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './Divider';
import { Button } from '../Button';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { DotsThree } from '../Icon/_fixtures/phosphor';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Atoms/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A line between two things that are already spatially separated — reach for spacing first.',
          'Decorative by default (`role="none"`); `decorative={false}` is a semantic `<hr>`. With',
          'children it is the labelled form ("or continue with"), whose words are read. The vertical',
          'divider needs a stretching flex parent.',
        ].join('\n'),
      },
    },
  },
  args: { orientation: 'horizontal', decorative: true },
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: args.orientation === 'vertical' ? 'row' : 'column', height: args.orientation === 'vertical' ? 48 : undefined, maxWidth: 480 }}>
      <Text>Before</Text>
      <Divider {...args} />
      <Text>After</Text>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Spec label="between two content groups" wide>
      <div style={{ maxWidth: 560 }}>
        <Text>Data Structures &amp; Algorithms — Week 6</Text>
        <Text size="sm" tone="secondary">
          Segment trees, Fenwick trees, offline queries
        </Text>
        <Divider decorative={false} />
        <Text>System Design — Week 6</Text>
        <Text size="sm" tone="secondary">
          Consistent hashing and request routing
        </Text>
      </div>
    </Spec>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Stack>
      <Spec label="between two metrics">
        <div style={{ display: 'flex' }}>
          {(
            [
              ['Median CTC', '₹19,50,000'],
              ['Highest CTC', '₹1,04,00,000'],
              ['Placed in 90 days', '94%'],
            ] as const
          ).map(([k, v], i) => (
            <React.Fragment key={k}>
              {i > 0 ? <Divider orientation="vertical" /> : null}
              <div>
                <Heading as="p" size="eyebrow">
                  {k}
                </Heading>
                <Heading as="p" size="2" className="tabular-nums">
                  {v}
                </Heading>
              </div>
            </React.Fragment>
          ))}
        </div>
      </Spec>
      <Spec label="between two toolbar clusters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Button variant="tertiary" size="sm">
            Shortlist
          </Button>
          <Button variant="tertiary" size="sm">
            Schedule interview
          </Button>
          <Divider orientation="vertical" />
          <Button variant="tertiary" size="sm">
            Export CSV
          </Button>
          <Button variant="tertiary" size="icon-sm" aria-label="More actions">
            <DotsThree weight="bold" />
          </Button>
        </div>
      </Spec>
    </Stack>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Stack>
      <Spec label="the admissions sign-in separator">
        <div style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
          <Button className="w-full">Continue with your Scaler ID</Button>
          <Divider>or continue with</Divider>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary">Google</Button>
            <Button variant="secondary">GitHub</Button>
            <Button variant="secondary">Institute email</Button>
          </div>
        </div>
      </Spec>
      <Spec label="a date separator in the mentor chat">
        <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
          <Text size="sm" tone="secondary">
            Kavya Menon · Could you push the segment-tree lab before the review?
          </Text>
          <Divider>Wed, 4 Mar 2026</Divider>
          <Text size="sm" tone="secondary">
            Aarav Krishnan · Pushed at 11:42 PM — sorry, the offline-query part took longer than I expected.
          </Text>
          <Divider>Today</Divider>
          <Text size="sm" tone="secondary">
            Kavya Menon · Reviewed. Two comments on the lazy propagation, otherwise good.
          </Text>
        </div>
      </Spec>
      <Spec label="a long label — the rules shrink first">
        <div style={{ maxWidth: 480 }}>
          <Divider>or continue with your Scaler School of Business institute email</Divider>
        </div>
      </Spec>
    </Stack>
  ),
};
