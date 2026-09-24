import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../Button';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
} from './Toast';
import { toast, type ToastVariant } from './toast-store';

const VARIANTS: ToastVariant[] = ['success', 'info', 'warning', 'danger'];

const meta = {
  title: 'Molecules/Toast',
  component: Toast,
  subcomponents: {
    Toaster,
    ToastProvider,
    ToastViewport,
    ToastTitle,
    ToastDescription,
    ToastAction,
    ToastClose,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A short, self-dismissing **receipt** for something the system just did. Never for anything',
          'the user must read, act on, or copy down — that is an Alert or a Dialog. If a student would',
          'ever need the message again, it must also exist somewhere permanent.',
          '',
          'Imperative: mount one `<Toaster />` near the root, then `toast.success(title, { description })`,',
          '`toast.info / warning / danger`, `toast({ … action: { label, onClick } })`, `toast.dismiss(id)`.',
          'Declarative: `ToastProvider` › `Toast` (`variant`, `title`, `description`, `open` /',
          '`onOpenChange`) + `ToastViewport`; compose `ToastTitle`, `ToastDescription`, `ToastAction`.',
          '',
          'Bottom-right, 4.2s, stacks; paused while hovered or focused; swipe right, Escape or the',
          'neutral × dismiss it; F8 jumps to the region. Success / info / warning are announced',
          'politely (`role="status"` in the HTML), danger assertively (`role="alert"`). The viewport',
          'portals to `<body>`, themed by `data-brand` / `data-theme` on `<html>`.',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: VARIANTS,
      table: { defaultValue: { summary: 'info' } },
      description: 'The status: glyph, ink and politeness (`danger` is assertive).',
    },
    title: { control: 'text', description: 'The headline.' },
    description: { control: 'text', description: 'The supporting line.' },
    dismissible: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    dismissLabel: { control: 'text', description: 'The × button’s name. Default “Dismiss: <title>”.' },
    duration: { control: 'number', description: 'ms before it closes itself. Default: the provider’s 4200.' },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean', table: { defaultValue: { summary: 'true' } } },
    icon: { control: false },
    type: {
      control: 'select',
      options: ['foreground', 'background'],
      description: 'Override the politeness: `foreground` = assertive. Derived from `variant` by default.',
    },
    forceMount: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- helpers -------------------------------------------------------- */

/** A toast drawn in place (its own provider and an in-flow viewport), for side-by-side review. */
function Specimen({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
      <span style={{ font: '600 12px/1 var(--font-family-sans)', color: 'var(--content-secondary)' }}>{tag}</span>
      <ToastProvider duration={Infinity}>
        {children}
        {/* In flow: no fixed corner, no gutters, no scroll cap. */}
        <ToastViewport
          container={null}
          hotkey={[]}
          label="Toast specimen"
          className="static max-h-none overflow-visible p-0 max-sm:p-0 supports-[height:100dvh]:max-h-none"
        />
      </ToastProvider>
    </div>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 440px))', gap: 32 }}>
    {children}
  </div>
);

/* ---------- stories -------------------------------------------------------- */

type PlaygroundArgs = React.ComponentProps<typeof Toast> & { actionLabel?: string };

/**
 * One toast in the real bottom-right viewport. `open` is two-way: the timer,
 * a swipe, Escape and the × update the control; tick it to show it again.
 */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    open: true,
    variant: 'success',
    title: 'Assignment submitted',
    description: 'DSA Week 6 · submitted 2 minutes before the deadline.',
    dismissible: true,
    duration: 8000,
    actionLabel: '',
  },
  argTypes: {
    actionLabel: { control: 'text', description: 'Story only: a ToastAction label (empty for none).' },
  },
  parameters: { docs: { story: { inline: false, height: '240px' } } },
  render: function PlaygroundStory({ open, actionLabel, ...props }) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    return (
      <ToastProvider>
        <Button variant="secondary" onClick={() => updateArgs({ open: true })}>
          Show the toast
        </Button>
        <Toast open={open} onOpenChange={(next) => updateArgs({ open: next })} {...props}>
          {actionLabel ? (
            <ToastAction altText={actionLabel} onClick={() => {}}>
              {actionLabel}
            </ToastAction>
          ) : null}
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
  },
};

/** The HTML's live triggers: each fires a real toast; fire several and they stack. */
export const Live: Story = {
  name: 'Live — fire one and watch it animate in and auto-dismiss',
  parameters: { controls: { disable: true }, docs: { story: { inline: false, height: '420px' } } },
  render: () => (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Button
          onClick={() =>
            toast.success('Assignment submitted', {
              description: 'DSA Week 6 · submitted 2 minutes before the deadline.',
            })
          }
        >
          Submit DSA Week 6
        </Button>
        <Button
          variant="danger"
          onClick={() =>
            toast.danger('Upload failed', {
              description: 'transcript.pdf exceeds the 10 MB limit.',
              action: { label: 'Retry', altText: 'Upload a smaller file from Documents', onClick: () => {} },
            })
          }
        >
          Upload transcript.pdf
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.warning('Saved as draft', {
              description: 'Capstone proposal is not submitted yet — the window closes 31 Mar.',
            })
          }
        >
          Check fee status
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.info('Mentor session moved', {
              description: 'System Design 1:1 with Rohan Bhatia is now Fri, 6 Mar at 7:30 PM IST.',
            })
          }
        >
          Join System Design — Week 6
        </Button>
        <Button variant="tertiary" onClick={() => toast.dismiss()}>
          Dismiss all
        </Button>
      </div>
      <Toaster />
    </>
  ),
};

/** All four statuses, drawn statically so nothing has to be triggered to be reviewed. */
export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  name: 'Statuses',
  render: () => (
    <Grid>
      <Specimen tag='success · polite (role="status")'>
        <Toast
          variant="success"
          title="Assignment submitted"
          description="DSA Week 6 · submitted 2 minutes before the deadline."
        />
      </Specimen>
      <Specimen tag='info · polite (role="status")'>
        <Toast
          variant="info"
          title="Mentor session moved"
          description="System Design 1:1 with Rohan Bhatia is now Fri, 6 Mar at 7:30 PM IST."
        />
      </Specimen>
      <Specimen tag='warning · polite (role="status")'>
        <Toast
          variant="warning"
          title="Saved as draft"
          description="Capstone proposal is not submitted yet — the window closes 31 Mar."
        />
      </Specimen>
      <Specimen tag='danger · assertive (role="alert")'>
        <Toast variant="danger" title="Upload failed" description="transcript.pdf exceeds the 10 MB limit." />
      </Specimen>
    </Grid>
  ),
};

/** An action (it closes the toast), a title-only toast, and one without a dismiss. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Grid>
      <Specimen tag="with an action">
        <Toast variant="info" title="Cohort archived" description="SSB Cohort 5 moved to the archive.">
          <ToastAction altText="Open Archive to restore the cohort" onClick={() => {}}>
            Undo
          </ToastAction>
        </Toast>
      </Specimen>
      <Specimen tag="title only">
        <Toast variant="success" title="Link copied" />
      </Specimen>
      <Specimen tag="dismissible={false} · a custom close">
        <Toast variant="warning" dismissible={false}>
          <ToastTitle>Offline</ToastTitle>
          <ToastDescription>Changes are saved on this device until you reconnect.</ToastDescription>
          <ToastClose asChild>
            <Button variant="tertiary" size="sm" className="mt-2 -ms-3 justify-self-start">
              Got it
            </Button>
          </ToastClose>
        </Toast>
      </Specimen>
    </Grid>
  ),
};
