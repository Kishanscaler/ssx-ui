import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionHeadingLevel,
  type AccordionItemData,
  type AccordionType,
} from './Accordion';
import { Code } from '../Code';
import { Spec, Stack } from '../Icon/_fixtures/story-layout';

const FAQ: AccordionItemData[] = [
  {
    value: 'fees',
    title: 'What does the B.Sc CS & AI programme cost, and when is each instalment due?',
    content:
      'Tuition for the Batch of 2029 is ₹5,50,000 per year, billed in two instalments — ₹2,75,000 within 14 days of seat confirmation and ₹2,75,000 by 30 Nov. Hostel and mess are billed separately at ₹1,80,000 per year. Nothing is charged before you accept the seat.',
  },
  {
    value: 'deferred',
    title: 'Is there an income-share or deferred-payment option?',
    content:
      'Yes. The deferred plan moves 60% of tuition to after you are placed, capped at 17% of CTC for 24 months and never starting below ₹8,00,000 annual CTC. Applications for it close two weeks after seat confirmation and are assessed by the financial aid committee, not by admissions.',
  },
  {
    value: 'nset',
    title: 'What happens to my application if the NSET score is borderline?',
    content:
      'Borderline scripts go to a second reader, and you are invited to a 30-minute problem-solving interview instead of being rejected on the number alone. You may retake the NSET once in the same admission cycle; the higher of the two scores stands.',
  },
  {
    value: 'refund',
    title: 'Can I withdraw after paying, and what is refunded?',
    content:
      'Withdraw before the cohort start date and the full first instalment less ₹25,000 in processing is refunded within 21 working days. After classes begin, refunds follow the UGC pro-rata schedule published in the admission letter. Hostel deposits are refunded in full either way.',
  },
];

const TYPES: AccordionType[] = ['multiple', 'single'];
const LEVELS: AccordionHeadingLevel[] = ['h2', 'h3', 'h4', 'h5', 'h6'];

const meta = {
  title: 'Molecules/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Stacked headers that each reveal a panel: FAQs and secondary detail. Do NOT hide anything a',
          'person must read to finish the task. Each header is a real button inside a heading',
          '(`headingLevel`); the chevron is aria-hidden. Arrow keys, Home and End move between headers.',
          '',
          '`type="multiple"` (default, the HTML\'s behaviour) toggles each item on its own; `type="single"`',
          'keeps one open and is `collapsible` by default. The panel animates its real height and does',
          'not animate under reduced motion. The flat `items` form maps onto a Storyblok FAQ blok.',
        ].join('\n'),
      },
    },
  },
  args: {
    type: 'multiple',
    collapsible: true,
    disabled: false,
    headingLevel: 'h3',
    defaultValue: 'fees',
    items: FAQ,
  },
  argTypes: {
    type: { control: 'select', options: TYPES },
    collapsible: { control: 'boolean', description: '`single` only.' },
    disabled: { control: 'boolean' },
    headingLevel: { control: 'select', options: LEVELS },
    defaultValue: { control: 'select', options: ['', ...FAQ.map((f) => f.value as string)] },
    dir: { control: 'select', options: ['ltr', 'rtl'] },
    items: { control: 'object' },
    className: { control: 'text' },
  },
  render: (args) => (
    // `key` remounts on type change: Radix does not switch single <-> multiple in place.
    <div style={{ maxWidth: 720 }}>
      <Accordion key={`${args.type}-${String(args.defaultValue)}`} {...args} />
    </div>
  ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The HTML's first specimen: four items, the first open by default. Compound API. */
export const FourItemsFirstOpen: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Spec label="admissions & fees FAQ · click a header to toggle" wide>
      <Accordion defaultValue={['fees']}>
        {FAQ.map((item) => (
          <AccordionItem key={item.value} value={item.value as string}>
            <AccordionTrigger headingLevel="h4">{item.title}</AccordionTrigger>
            <AccordionContent>
              <p>{item.content}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Spec>
  ),
};

/** Collapsed and expanded side by side, plus a disabled item. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <Spec label="collapsed and expanded, side by side" wide>
        <Accordion defaultValue={['open']}>
          <AccordionItem value="closed">
            <AccordionTrigger headingLevel="h4">Collapsed · aria-expanded=&quot;false&quot;</AccordionTrigger>
            <AccordionContent>
              <p>Hidden until the header is activated.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="open">
            <AccordionTrigger headingLevel="h4">
              Expanded · aria-expanded=&quot;true&quot;, chevron rotated
            </AccordionTrigger>
            <AccordionContent>
              <p>
                The panel animates from 0 to its measured height (<Code>--radix-accordion-content-height</Code>),
                so it opens to its real height without a hard-coded max-height.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="disabled" disabled>
            <AccordionTrigger headingLevel="h4">Disabled · intake closed for 2026</AccordionTrigger>
            <AccordionContent>
              <p>Never shown.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Spec>
      <Spec label="multi-paragraph panel · one gap token between paragraphs" wide>
        <Accordion defaultValue={['p']}>
          <AccordionItem value="p">
            <AccordionTrigger headingLevel="h4">How is the deferred plan assessed?</AccordionTrigger>
            <AccordionContent>
              <p>The financial aid committee reviews family income and the seat confirmation date.</p>
              <p>A decision is sent within 10 working days, and it does not affect your admission.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Spec>
    </Stack>
  ),
};

/** `type="single"`: opening one closes the other; collapsible by default. */
export const SingleCollapsible: Story = {
  args: { type: 'single', defaultValue: 'deferred' },
};

/** The flat form a Storyblok FAQ blok maps onto: `items={[{ title, content }]}`. */
export const FlatItemsForFaq: Story = {
  args: { items: FAQ.map(({ title, content }) => ({ title, content })), defaultValue: '' },
};
