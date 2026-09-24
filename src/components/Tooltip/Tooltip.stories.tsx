import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowsClockwise, DownloadSimple, Funnel } from '@phosphor-icons/react';

import { Button } from '../Button';
import { IconButton } from '../IconButton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipAlign,
  type TooltipSide,
} from './Tooltip';

const SIDES: TooltipSide[] = ['top', 'right', 'bottom', 'left'];
const ALIGNS: TooltipAlign[] = ['start', 'center', 'end'];

const openInDocs = (height: number) => ({ docs: { story: { inline: false, height: `${height}px` } } });

const meta = {
  title: 'Molecules/Tooltip',
  component: TooltipContent,
  subcomponents: { Tooltip, TooltipTrigger, TooltipProvider } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A short label that names or clarifies a control on **hover and keyboard focus**. Never',
          'information that lives nowhere else: a tooltip is invisible to touch, to a quick scan, and',
          'to print. Label an icon button; do not explain a policy.',
          '',
          '`Tooltip` › `TooltipTrigger asChild` (a focusable `Button` / `IconButton`) · `TooltipContent`.',
          'Put one `TooltipProvider` near the app root so moving between triggers skips the delay; a',
          'lone `Tooltip` provides its own.',
          '',
          'Focus opens at once; a pointer waits 300ms (`delayDuration`). The trigger is',
          '`aria-describedby` the bubble while it is open, so an icon button keeps its `aria-label` as',
          'its name. **Disabled controls**: a `disabled` button cannot be focused or hovered, so its',
          'tooltip is unreachable — wrap it in a `<span tabIndex={0}>` and make the span the trigger.',
          'The bubble portals to `<body>`, themed by `data-brand` / `data-theme` on `<html>`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: SIDES,
      table: { defaultValue: { summary: 'top' } },
      description: 'The side of the trigger the bubble opens on.',
    },
    align: {
      control: 'select',
      options: ALIGNS,
      table: { defaultValue: { summary: 'center' } },
      description: 'Alignment along that side.',
    },
    sideOffset: { control: 'number', table: { defaultValue: { summary: '8' } } },
    avoidCollisions: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    children: { control: 'text', description: 'The label — a few words.' },
    container: { control: false },
  },
} satisfies Meta<typeof TooltipContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 120, alignItems: 'flex-start', padding: '56px 48px 0' }}>
    {children}
  </div>
);
/** The label sits UNDER the trigger: the bubble opens above it. */
const Spec = ({ tag, children }: { tag: string; children: React.ReactNode }) => (
  <div style={{ display: 'grid', gap: 12, alignContent: 'start', justifyItems: 'center' }}>
    {children}
    <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
  </div>
);

type PlaygroundArgs = React.ComponentProps<typeof TooltipContent> & {
  open?: boolean;
  delayDuration?: number;
};

/** `open` is two-way: hovering, focusing, Escape and blur update the control. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    open: true,
    delayDuration: 300,
    side: 'top',
    align: 'center',
    sideOffset: 8,
    children: 'Download roster (.csv)',
  },
  argTypes: {
    open: { control: 'boolean', description: 'Story only: the bubble is open (two-way).' },
    delayDuration: {
      control: 'number',
      description: 'Tooltip / TooltipProvider: pointer open delay in ms.',
      table: { defaultValue: { summary: '300' } },
    },
  },
  parameters: openInDocs(240),
  render: function PlaygroundStory({ open, delayDuration, ...content }) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
        <Tooltip open={open} onOpenChange={(next) => updateArgs({ open: next })} delayDuration={delayDuration}>
          <TooltipTrigger asChild>
            <IconButton variant="secondary" aria-label="Download cohort roster">
              <DownloadSimple />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent {...content} />
        </Tooltip>
      </div>
    );
  },
};

/** The HTML's three triggers, shown open so they can be reviewed side by side. */
export const Triggers: Story = {
  parameters: { ...(openInDocs(160)), controls: { disable: true } },
  render: () => (
    <TooltipProvider>
      <Row>
        <Spec tag="on an icon button">
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <IconButton variant="secondary" aria-label="Download cohort roster">
                <DownloadSimple />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Download roster (.csv)</TooltipContent>
          </Tooltip>
        </Spec>
        <Spec tag="on a text trigger">
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              <Button variant="tertiary" size="sm">
                Median CTC
              </Button>
            </TooltipTrigger>
            <TooltipContent>Batch of 2028, verified offers only</TooltipContent>
          </Tooltip>
        </Spec>
        <Spec tag="on a disabled control (a focusable wrapper)">
          <Tooltip defaultOpen>
            <TooltipTrigger asChild>
              {/* The span takes the focus, hover and description the disabled button cannot. */}
              <span
                tabIndex={0}
                className="inline-flex rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-border-focus/50"
              >
                <Button variant="secondary" disabled>
                  Publish results
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Locked until moderation closes</TooltipContent>
          </Tooltip>
        </Spec>
      </Row>
    </TooltipProvider>
  ),
};

/** Rest: hover or Tab to reveal. Moving from one to the next skips the delay (shared provider). */
export const States: Story = {
  parameters: { ...(openInDocs(160)), controls: { disable: true } },
  render: () => (
    <TooltipProvider>
      <Row>
        <Spec tag="rest (hover or Tab to reveal)">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton variant="secondary" aria-label="Filter applications">
                <Funnel />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Filter applications</TooltipContent>
          </Tooltip>
        </Spec>
        <Spec tag="focus-visible (Tab here)">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton variant="secondary" aria-label="Refresh queue">
                <ArrowsClockwise />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Refresh queue</TooltipContent>
          </Tooltip>
        </Spec>
        <Spec tag='aria-disabled="true" (keyboard only: Button drops its pointer events)'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" aria-disabled="true">
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Nothing to export yet</TooltipContent>
          </Tooltip>
        </Spec>
      </Row>
    </TooltipProvider>
  ),
};

/** Every side, open. */
export const Sides: Story = {
  parameters: { ...(openInDocs(260)), controls: { disable: true } },
  render: () => (
    // Two by two below md (each bubble still has room on its side), one row
    // of four from md.
    <div className="grid grid-cols-2 justify-items-center gap-x-4 gap-y-24 py-[90px] md:flex md:gap-40 md:px-[120px]">
      {SIDES.map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="sm">
              {side}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Opens {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};

/**
 * A label that runs long (keep them short; this is the safety net). It wraps
 * inside 320px, or inside the room beside the trigger on a narrow screen,
 * balanced across its lines; a long unbroken token breaks instead of running
 * off the screen.
 */
export const LongLabel: Story = {
  name: 'Long label wraps',
  parameters: { ...(openInDocs(260)), controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap justify-center gap-6 py-[110px]">
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <IconButton variant="secondary" aria-label="Download verified offers">
            <DownloadSimple />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="top">
          Batch of 2028 verified offers, including the off-campus drive and the two late PPOs
        </TooltipContent>
      </Tooltip>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <IconButton variant="secondary" aria-label="Copy the roster link">
            <DownloadSimple />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent side="bottom">https://portal.scaler.com/cohorts/2029-cohort-7/rosters/export</TooltipContent>
      </Tooltip>
    </div>
  ),
};
