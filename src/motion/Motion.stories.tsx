import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import { Heading } from '../components/Heading';
import { Stack } from '../components/Stack';
import { Text } from '../components/Text';
import { CountUp, MotionScope, Reveal, Stagger, TextReveal, motionProps, useSectionEntrance } from './index';

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
    preset: { control: 'inline-radio', options: ['fade-up', 'fade', 'scale', 'wipe'] },
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
  args: {
    trigger: "in-view"
  },

  name: 'TextReveal',

  render: (args) => (
    <Replay>
      <TextReveal asChild trigger={args.trigger} intent="expressive">
        <Heading as="h1" size="display">Learn to build what the world runs on</Heading>
      </TextReveal>
    </Replay>
  )
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

/**
 * TextReveal's presets. `blur` comes by letter and by word: each piece fades
 * in, grows and sharpens out of a motion blur. `wipe` goes word by word: a
 * block of brand colour slides up over each word, then the word slides in and
 * pushes it off the top, the words tightly overlapped. `by="lines"` reveals
 * several words at a time, one real line at a time, the block fitted to each
 * line's text. `soft-wipe` is the same push with a heavily blurred brand
 * gradient: a glow sweeping up through the words. "Replay" runs them again.
 */
export const TextRevealPresets: Story = {
  name: 'TextReveal presets',
  render: () => (
    <Replay>
      <div className="flex flex-col gap-8">
        {(
          [
            ['rise', 'words'],
            ['blur', 'chars'],
            ['blur', 'words'],
            ['wipe', 'words'],
            ['wipe', 'lines'],
            ['soft-wipe', 'words'],
            ['soft-wipe', 'lines'],
            ['blur', 'lines'],
          ] as const
        ).map(([preset, by]) => (
          // Lines get a narrower column so the headline wraps onto several.
          <div key={`${preset}-${by}`} className={by === 'lines' ? 'flex max-w-panel-md flex-col gap-1' : 'flex flex-col gap-1'}>
            <TextReveal asChild preset={preset} by={by}>
              <Heading as="h2" size="display">
                Learn to build what the world runs on
              </Heading>
            </TextReveal>
            <Text className="text-content-secondary">
              preset=&quot;{preset}&quot; · by=&quot;{by}&quot;
            </Text>
          </div>
        ))}
      </div>
    </Replay>
  ),
};

/**
 * CountUp's two versions and two speeds, side by side. With `entrance="fade-scale"`
 * each digit pops in on its own as it ticks over, and a digit racing too fast to
 * read is motion-blurred until the count slows;
 * `speed="slow"` counts over 1.6s instead of 0.8s. "Replay" runs them again.
 */
export const CountUpVersions: Story = {
  name: 'CountUp versions',
  render: () => (
    <Replay>
      <div className="grid grid-cols-2 gap-8">
        {(['none', 'fade-scale'] as const).flatMap((entrance) =>
          (['medium', 'slow'] as const).map((speed) => (
            <div key={`${entrance}-${speed}`} className="flex flex-col gap-1">
              <Heading as="p" size="1">
                <CountUp value={1200} entrance={entrance} speed={speed} format={(n) => `${Math.round(n).toLocaleString()}+`} />
              </Heading>
              <Text className="text-content-secondary">
                entrance=&quot;{entrance}&quot; · speed=&quot;{speed}&quot;
              </Text>
            </div>
          )),
        )}
      </div>
    </Replay>
  ),
};

/**
 * Markup motion: the blocks are plain elements carrying `data-ssx-*`
 * attributes (`motionProps()` writes them), as a server-rendered CMS block
 * tree would. One `<MotionScope>` arms them, loading GSAP only because there
 * is a target inside it.
 */
export const Markup: Story = {
  name: 'Markup (MotionScope)',
  render: () => (
    <Replay>
      <MotionScope className="flex flex-col gap-6">
        <h2 className="type-h2 font-semibold" {...motionProps({ text: 'words' })}>
          Learn to build what the world runs on
        </h2>
        <p className="type-body text-content-secondary" {...motionProps({ reveal: 'fade-up', delay: 'normal' })}>
          The same tokens, presets and gates as Reveal, Stagger and TextReveal, as attributes.
        </p>
        <div className="grid grid-cols-3 gap-4" {...motionProps({ stagger: 'fade-up', trigger: 'in-view' })}>
          {['Data structures', 'System design', 'Machine learning'].map((t) => (
            <Card key={t}>
              <CardBody>
                <Text className="font-semibold">{t}</Text>
              </CardBody>
            </Card>
          ))}
        </div>
      </MotionScope>
    </Replay>
  ),
};

/**
 * A section's entrance (`useSectionEntrance`, the SSB home page's, ported):
 * the header as it comes up (eyebrow, the headline line by line out of a
 * mask, then the sub and controls), and the cards once their row is 75% up
 * the screen: each wipes open from the bottom, rounded to its own corners,
 * while its photo settles from a slight zoom and its title and description
 * rise in. The row (`ul`) carries `data-ssx-hold` until they land. The same
 * builders run from markup: `data-ssx-section="header"` on the header and
 * `data-ssx-stagger="wipe"` on the row, under a `MotionScope`.
 */
export const SectionEntrance: Story = {
  name: 'Section entrance',
  render: () => {
    function Section() {
      const ref = React.useRef<HTMLElement>(null);
      useSectionEntrance(ref);
      return (
        <section ref={ref} className="flex flex-col gap-8">
          <div data-part="header" className="flex flex-col gap-3">
            <Text data-part="eyebrow" className="type-eyebrow text-content-secondary">
              Faculty
            </Text>
            <Heading as="h2" size="1" data-part="headline" className="max-w-panel-md">
              Learn from the people who build the companies you want to join
            </Heading>
            <Text data-part="sub" className="max-w-panel-md text-content-secondary">
              Operators, founders and investors, teaching what they do every week.
            </Text>
            <div data-part="controls">
              <Button variant="secondary" size="sm">
                Meet them all
              </Button>
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-4">
            {[
              { name: 'Asha Rao', role: 'VP Product, a fintech' },
              { name: 'Vikram Shah', role: 'Founder, a D2C brand' },
              { name: 'Meera Iyer', role: 'Partner, a venture fund' },
            ].map((p) => (
              <li key={p.name}>
                <article
                  data-slot="person-card"
                  className="flex flex-col overflow-hidden rounded-lg border border-border-decorative bg-surface"
                >
                  <div className="aspect-landscape overflow-hidden">
                    <div data-part="photo" className="size-full bg-surface-sunken" />
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <Heading as="h3" size="3" data-part="title">
                      {p.name}
                    </Heading>
                    <Text data-part="description" className="text-content-secondary">
                      {p.role}
                    </Text>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    return (
      <Replay>
        <Section />
      </Replay>
    );
  },
};

/**
 * A splash holds every entrance: `data-motion-hold` on any ancestor (here, the
 * wrapper, rendered with the content) draws each start state at once and plays
 * nothing until it is removed. Put the hold in the markup, not in an effect:
 * a child's effects run before its parent's, so an entrance that mounts with
 * the splash would already be playing when an effect set the hold.
 * (`holdMotion()` is for a hold that starts before the content mounts.)
 */
export const HeldBehindASplash: Story = {
  name: 'Hold (behind a splash)',
  render: () => {
    function Splash() {
      const [covered, setCovered] = React.useState(true);
      React.useEffect(() => {
        const t = window.setTimeout(() => setCovered(false), 2000);
        return () => window.clearTimeout(t);
      }, []);
      return (
        <div className="relative" data-motion-hold={covered ? '' : undefined}>
          {covered ? (
            <div className="absolute inset-0 z-raised flex items-center justify-center bg-surface-raised">
              <Text>Splash…</Text>
            </div>
          ) : null}
          <Stack>
            <Reveal>
              <Heading as="h2" size="2">
                Entrances wait for the splash
              </Heading>
            </Reveal>
            <MotionScope>
              <p className="type-body" {...motionProps({ reveal: 'fade-up', delay: 'fast' })}>
                Markup motion waits too.
              </p>
            </MotionScope>
          </Stack>
        </div>
      );
    }
    return (
      <Replay>
        <Splash />
      </Replay>
    );
  },
};
