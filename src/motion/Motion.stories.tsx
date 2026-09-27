import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Heading } from '../components/Heading';
import { Text } from '../components/Text';
import { CountUp, Reveal, Stagger, TextReveal } from './index';

/**
 * The GSAP motion layer (`@kishanscaler/ssx-ui/motion`). Every duration,
 * curve, distance and interval is an SSX motion token; the Storybook toolbar's
 * reduced-motion setting (and the OS one) makes every primitive simply appear.
 * "Replay" remounts the story.
 */
function Replay({ children }: { children: React.ReactNode }) {
  const [key, setKey] = React.useState(0);
  return (
    <div className="flex flex-col items-start gap-6">
      <Button variant="secondary" size="sm" onClick={() => setKey((k) => k + 1)}>
        Replay
      </Button>
      <div key={key} className="w-full">
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: 'Motion/GSAP primitives',
  component: Reveal,
  tags: ['autodocs'],
  argTypes: {
    preset: { control: 'inline-radio', options: ['fade-up', 'fade', 'scale'] },
    trigger: { control: 'inline-radio', options: ['mount', 'in-view'] },
    intent: { control: 'inline-radio', options: ['productive', 'expressive'] },
    delay: { control: 'select', options: [undefined, 'instant', 'fast', 'normal', 'slow', 'slower', 'slowest'] },
  },
  args: { preset: 'fade-up', trigger: 'mount', intent: 'productive' },
} satisfies Meta<typeof Reveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RevealBlock: Story = {
  name: 'Reveal',
  render: (args) => (
    <Replay>
      <Reveal {...args} className="max-w-panel-md">
        <Card>
          <CardBody>
            <Heading as="h3" size="3">Your cohort starts Monday</Heading>
            <Text>Three live classes a week, with a mentor on every one.</Text>
          </CardBody>
        </Card>
      </Reveal>
    </Replay>
  ),
};

export const StaggerGrid: Story = {
  name: 'Stagger',
  render: (args) => (
    <Replay>
      <Stagger preset={args.preset} intent={args.intent} trigger={args.trigger} className="grid grid-cols-3 gap-4">
        {['Data structures', 'System design', 'Machine learning', 'Product analytics', 'Cloud', 'Frontend'].map((t) => (
          <Card key={t}>
            <CardBody>
              <Text className="font-semibold">{t}</Text>
            </CardBody>
          </Card>
        ))}
      </Stagger>
    </Replay>
  ),
};

export const HeadlineReveal: Story = {
  name: 'TextReveal',
  render: (args) => (
    <Replay>
      <TextReveal asChild trigger={args.trigger} intent="expressive">
        <Heading as="h1" size="display">Learn to build what the world runs on</Heading>
      </TextReveal>
    </Replay>
  ),
};

export const Stats: Story = {
  name: 'CountUp',
  render: (args) => (
    <Replay>
      <div className="flex gap-12">
        {[
          { value: 1200, label: 'hiring partners', suffix: '+' },
          { value: 94, label: 'placement rate', suffix: '%' },
          { value: 25000, label: 'alumni', suffix: '+' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <Heading as="p" size="1">
              <CountUp value={s.value} trigger={args.trigger} format={(n) => `${Math.round(n).toLocaleString()}${s.suffix}`} />
            </Heading>
            <Text className="text-content-secondary">{s.label}</Text>
          </div>
        ))}
      </div>
    </Replay>
  ),
};
