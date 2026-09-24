import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckCircle, Warning, WarningCircle } from '@phosphor-icons/react';

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMedia,
  DialogTitle,
  DialogTrigger,
  type DialogLayout,
  type DialogVariant,
} from './Dialog';
import { Button, type ButtonVariant } from '../Button';
import { Checkbox } from '../Checkbox';
import { Field, FieldControl } from '../Field';
import { Icon } from '../Icon';
import { Input } from '../Input';
import { PhoneInput } from '../PhoneInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Text } from '../Text';
import { Spec } from '../Icon/_fixtures/story-layout';

const VARIANTS: DialogVariant[] = ['default', 'destructive'];
const LAYOUTS: DialogLayout[] = ['default', 'strip', 'split'];

/** A stand-in "photograph" (an inline SVG, so the story needs no network): a campus block at dusk. */
const CAMPUS_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">',
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#1b2a6b"/><stop offset=".55" stop-color="#6d4bb3"/><stop offset="1" stop-color="#f29a6b"/>',
    '</linearGradient></defs>',
    '<rect width="800" height="1000" fill="url(#s)"/>',
    '<circle cx="560" cy="420" r="90" fill="#ffd9a8" opacity=".85"/>',
    '<path d="M0 640h140V470h170v110h120V360h160v280h210v360H0z" fill="#161a3a"/>',
    '<path d="M0 800q200-60 400-20t400 10v210H0z" fill="#0c0f24"/>',
    '</svg>',
  ].join(''),
)}`;
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'neutral'];

const meta = {
  title: 'Organisms/Dialog',
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogBody,
    DialogFooter,
    DialogClose,
    DialogMedia,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A modal that stops everything until the person decides. Use it only for a decision that cannot be',
          'undone by navigating away, or a short form that must not lose the page behind it. Radix Dialog:',
          'focus is trapped, Escape and the scrim close it, focus returns to the trigger, the page is scroll-locked,',
          'and the panel is labelled by `DialogTitle` and described by `DialogDescription`.',
          '',
          '`variant="destructive"` is an `alertdialog`: the scrim does not dismiss it and focus opens on the safe',
          "answer (the footer's first `DialogClose`). Motion is productive only — a short scale-and-fade — and",
          'nothing expressive, ever, on a destructive confirm.',
          '',
          'Compound API first; the flat `title` / `description` / `trigger` / `confirmLabel` form maps onto a',
          'Storyblok blok (the body is `children`).',
          '',
          '**Media.** `DialogMedia` + `layout` on `DialogContent`: `strip` is a 2:1 picture across the top;',
          '`split` puts the picture left (two fifths of an 800px panel) from `sm` up and stacks it on top on a',
          'phone. Always flush to the panel edges, clipped by its corners; the × gets a raised chip wherever it',
          'sits on the picture. Flat form: `layout`, `mediaSrc`, `mediaAlt`.',
        ].join('\n'),
      },
    },
  },
  args: {
    title: 'Publish Week 6 grades?',
    description:
      '84 students in Cohort 7 will be emailed their Data Structures & Algorithms score and rank. You can still re-grade an individual submission afterwards.',
    trigger: 'Publish Week 6 grades',
    variant: 'default',
    cancelLabel: 'Cancel',
    confirmLabel: 'Publish to 84 students',
    confirmLoading: false,
    showClose: false,
    closeLabel: 'Close',
    layout: 'default',
    mediaSrc: '',
    mediaAlt: '',
    defaultOpen: false,
    modal: true,
  },
  argTypes: {
    title: { control: 'text', description: 'Flat form: the dialog title. Setting it turns the flat form on.' },
    description: { control: 'text' },
    trigger: { control: 'text' },
    triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
    variant: { control: 'select', options: VARIANTS },
    cancelLabel: { control: 'text' },
    confirmLabel: { control: 'text' },
    confirmLoading: { control: 'boolean' },
    showClose: { control: 'boolean' },
    closeLabel: { control: 'text' },
    layout: {
      control: 'inline-radio',
      options: LAYOUTS,
      description: 'Flat form: `strip` (top) or `split` (left) picture; the placeholder with no `mediaSrc`.',
    },
    mediaSrc: { control: 'text', description: 'Flat form: an image URL (a strip unless `layout="split"`).' },
    mediaAlt: { control: 'text' },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    modal: { control: 'boolean' },
    onOpenChange: { action: 'openChange' },
    onConfirm: { action: 'confirm' },
    children: { control: false },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls. The body is `children`. */
export const Playground: Story = {
  render: (args) => (
    <Dialog key={`${args.variant}-${String(args.defaultOpen)}`} {...args} mediaSrc={args.mediaSrc || undefined}>
      <Field label="Include the cohort percentile in the email" orientation="horizontal">
        <Checkbox defaultChecked />
      </Field>
    </Dialog>
  ),
};

/** The HTML's "confirm · default": publish grades, with a success head icon and a body. */
export const PublishGrades: Story = {
  parameters: { controls: { disable: true } },
  name: 'Confirm · default',
  render: () => (
    <Spec label="confirm · default · click to open">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Publish Week 6 grades</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader
            icon={
              <Icon size="xl" tone="success">
                <CheckCircle weight="fill" />
              </Icon>
            }
          >
            <DialogTitle>Publish Week 6 grades?</DialogTitle>
            <DialogDescription>
              84 students in Cohort 7 will be emailed their Data Structures &amp; Algorithms score and rank. You can
              still re-grade an individual submission afterwards.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Include the cohort percentile in the email" orientation="horizontal">
              <Checkbox defaultChecked />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="tertiary">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button>Publish to 84 students</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Spec>
  ),
};

const WithdrawBody = () => (
  <div
    role="note"
    className="flex gap-3 rounded-md border border-danger-border bg-danger-surface p-4 text-danger-content"
  >
    <Icon size="md" tone="danger">
      <Warning weight="fill" />
    </Icon>
    <div className="grid gap-0.5">
      <Text size="sm" className="font-semibold text-danger-content">
        Re-applying is only possible in the next admission cycle
      </Text>
      <Text size="sm" className="text-danger-content">
        The next NSET window opens in October 2026.
      </Text>
    </div>
  </div>
);

/**
 * The HTML's "confirm · destructive": an `alertdialog`. The scrim does not
 * dismiss it; focus opens on "Keep application".
 */
export const Withdraw: Story = {
  parameters: { controls: { disable: true } },
  name: 'Confirm · destructive',
  render: () => (
    <Spec label="confirm · destructive · click to open">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="danger">Withdraw application</Button>
        </DialogTrigger>
        <DialogContent variant="destructive">
          <DialogHeader
            icon={
              <Icon size="xl" tone="danger">
                <Warning weight="fill" />
              </Icon>
            }
          >
            <DialogTitle>Withdraw application SST-2029-0416?</DialogTitle>
            <DialogDescription>
              Aarav Krishnan&apos;s application to the Batch of 2029 will be withdrawn, the interview slot on 18 Mar
              2026 will be released to the waitlist, and the ₹1,500 application fee is non-refundable. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <WithdrawBody />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="tertiary">Keep application</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="danger">Withdraw application</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Spec>
  ),
};

/** Opened on load, for review and screenshots: the destructive confirm. */
export const WithdrawOpen: Story = {
  parameters: { controls: { disable: true } },
  name: 'Confirm · destructive (open)',
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="danger">Withdraw application</Button>
      </DialogTrigger>
      <DialogContent variant="destructive">
        <DialogHeader
          icon={
            <Icon size="xl" tone="danger">
              <Warning weight="fill" />
            </Icon>
          }
        >
          <DialogTitle>Withdraw application SST-2029-0416?</DialogTitle>
          <DialogDescription>
            Aarav Krishnan&apos;s application to the Batch of 2029 will be withdrawn, the interview slot on 18 Mar
            2026 will be released to the waitlist, and the ₹1,500 application fee is non-refundable. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <WithdrawBody />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="tertiary">Keep application</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="danger">Withdraw application</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/**
 * The HTML's loading note: the confirming button takes `loading` while the
 * request is in flight, and the dialog stays open until the server answers.
 */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  name: 'Confirm · in flight',
  render: function LoadingStory() {
    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    return (
      <Spec label="confirm · loading · click to open, then confirm">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (!busy) setOpen(next);
          }}
          title="Release the hostel allotment?"
          description="Room assignments for 312 first-year SST students go live immediately and cannot be re-run for 48 hours."
          trigger="Release allotment"
          confirmLabel="Release allotment"
          confirmLoading={busy}
          onConfirm={(event) => {
            event.preventDefault();
            setBusy(true);
            window.setTimeout(() => {
              setBusy(false);
              setOpen(false);
            }, 1600);
          }}
        />
      </Spec>
    );
  },
};

const COHORTS = [
  ['sst-2029', 'Scaler School of Technology · Batch of 2029'],
  ['ssb-2027', 'Scaler School of Business · PGP 2027'],
  ['sst-mtech', 'SST · M.Tech in AI (working professionals)'],
] as const;

function LeadForm() {
  return (
    <form
      id="apply-now-lead"
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Field label="Full name" required>
        <Input autoComplete="name" placeholder="Aarav Krishnan" required />
      </Field>
      <Field label="Email" required help="We send your NSET slot and admit card here.">
        <Input type="email" autoComplete="email" placeholder="aarav.k@gmail.com" required />
      </Field>
      <Field label="Mobile number" required help="An admissions counsellor calls within one working day.">
        <PhoneInput defaultCountry="IN" />
      </Field>
      <Field label="Programme" required>
        <Select defaultValue="sst-2029">
          <FieldControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            {COHORTS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </form>
  );
}

function ApplyNowDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>
        <Button shine>Apply now</Button>
      </DialogTrigger>
      <DialogContent showClose closeLabel="Close application form">
        <DialogHeader>
          <DialogTitle>Apply to Scaler</DialogTitle>
          <DialogDescription>
            Applications for the Batch of 2029 close on 30 Apr 2026. It takes two minutes; the NSET comes next.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <LeadForm />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="tertiary">Not now</Button>
          </DialogClose>
          <Button type="submit" form="apply-now-lead">
            Request a callback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Composition proof: an "Apply now" lead form built from Field, Input,
 * PhoneInput, Select and Button inside the Dialog parts. The Select and the
 * country picker portal above the dialog (z-popover over z-dialog).
 */
export const ApplyNowLeadForm: Story = {
  parameters: { controls: { disable: true } },
  name: 'Apply now · lead form',
  render: () => (
    <Spec label="marketing · lead form dialog · click to open">
      <ApplyNowDialog />
    </Spec>
  ),
};

/** The lead form, opened on load. */
export const ApplyNowLeadFormOpen: Story = {
  parameters: { controls: { disable: true } },
  name: 'Apply now · lead form (open)',
  render: () => <ApplyNowDialog defaultOpen />,
};

/** The head-and-foot anatomy with a warning icon and no body (the HTML's static specimen), opened. */
export const Anatomy: Story = {
  parameters: { controls: { disable: true } },
  name: 'Anatomy · head + foot (open)',
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Release allotment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader
          icon={
            <Icon size="xl" tone="warning">
              <WarningCircle weight="fill" />
            </Icon>
          }
        >
          <DialogTitle>Release the hostel allotment?</DialogTitle>
          <DialogDescription>
            Room assignments for 312 first-year SST students go live immediately and cannot be re-run for 48 hours.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="tertiary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Release allotment</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

type MediaArgs = { layout: DialogLayout; photo: boolean; showClose: boolean; label: string };

const MEDIA_ARG_TYPES = {
  layout: { control: 'inline-radio', options: ['strip', 'split'] },
  photo: { control: 'boolean', description: 'Story only: the stand-in photo, or the placeholder.' },
  showClose: { control: 'boolean', description: 'The × (a raised chip where it sits on the picture).' },
  label: { control: 'text', description: 'The placeholder caption (with `photo` off).' },
} as const;

/**
 * `layout="split"`: the picture left, the "Apply now" lead form right, from
 * `sm` up; on a phone the picture stacks on top. Flush to the panel's edges.
 */
export const MediaSplit: StoryObj<MediaArgs> = {
  name: 'Media · split (open)',
  args: { layout: 'split', photo: true, showClose: true, label: 'Campus photo · 2 : 3' },
  argTypes: MEDIA_ARG_TYPES,
  // Storybook merges meta's argTypes (title, description, cancelLabel,
  // confirmLabel, mediaSrc, mediaAlt, modal, triggerVariant, …) additively
  // onto this story's own MEDIA_ARG_TYPES, but this render only ever reads
  // `layout` / `photo` / `showClose` / `label` — every inherited control was
  // showing in Controls with zero effect. Scope Controls to what this story
  // actually wires up.
  parameters: { controls: { include: Object.keys(MEDIA_ARG_TYPES) } },
  render: (args) => (
    <Dialog key={args.layout} defaultOpen>
      <DialogTrigger asChild>
        <Button shine>Apply now</Button>
      </DialogTrigger>
      <DialogContent layout={args.layout} showClose={args.showClose} closeLabel="Close application form">
        <DialogHeader>
          <DialogTitle>Apply to Scaler</DialogTitle>
          <DialogDescription>
            Applications for the Batch of 2029 close on 30 Apr 2026. It takes two minutes; the NSET comes next.
          </DialogDescription>
        </DialogHeader>
        <DialogMedia src={args.photo ? CAMPUS_PHOTO : undefined} label={args.label} />
        <DialogBody>
          <LeadForm />
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="tertiary">Not now</Button>
          </DialogClose>
          <Button type="submit" form="apply-now-lead">
            Request a callback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** `layout="strip"`: a 2:1 picture across the top, over the header. */
export const MediaStrip: StoryObj<MediaArgs> = {
  name: 'Media · strip (open)',
  args: { layout: 'strip', photo: true, showClose: true, label: 'Campus photo · 2 : 1' },
  argTypes: MEDIA_ARG_TYPES,
  // See MediaSplit above: scope Controls to the args this render actually
  // reads, rather than the full meta-level argTypes it inherits but ignores.
  parameters: { controls: { include: Object.keys(MEDIA_ARG_TYPES) } },
  render: (args) => (
    <Dialog key={args.layout} defaultOpen>
      <DialogTrigger asChild>
        <Button>Scholarship test</Button>
      </DialogTrigger>
      <DialogContent layout={args.layout} showClose={args.showClose} closeLabel="Close scholarship details">
        <DialogHeader>
          <DialogTitle>NSET scholarship test, 12 Oct</DialogTitle>
          <DialogDescription>Online, 90 minutes. Up to 100% of the tuition fee waived for the top scorers.</DialogDescription>
        </DialogHeader>
        <DialogMedia src={args.photo ? CAMPUS_PHOTO : undefined} label={args.label} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="tertiary">Not now</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Book a slot</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
