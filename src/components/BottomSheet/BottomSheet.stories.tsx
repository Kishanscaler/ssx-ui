import { useArgs } from 'storybook/preview-api';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Funnel } from '@phosphor-icons/react';

import {
  BottomSheet,
  BottomSheetActions,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetMedia,
  BottomSheetPane,
  BottomSheetSplit,
  BottomSheetTitle,
  BottomSheetTrigger,
  type BottomSheetMediaOnMobile,
  type BottomSheetMediaRatio,
  type BottomSheetProps,
  type BottomSheetSize,
} from './BottomSheet';
import { Badge } from '../Badge';
import { Button, type ButtonVariant } from '../Button';
import { Checkbox } from '../Checkbox';
import { Chip } from '../Chip';
import { Field, FieldControl, FieldSet } from '../Field';
import { Heading } from '../Heading';
import { Input } from '../Input';
import { Kbd } from '../Kbd';
import { PhoneInput } from '../PhoneInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Slider } from '../Slider';
import { Text } from '../Text';
import { Row, Spec } from '../Icon/_fixtures/story-layout';

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger', 'neutral'];
const SIZES: BottomSheetSize[] = ['default', 'full'];
const MEDIA_RATIOS: BottomSheetMediaRatio[] = ['1:2', '5:7', '1:1', '7:5'];
const MEDIA_ON_MOBILE: BottomSheetMediaOnMobile[] = ['banner', 'hidden'];

/** A stand-in "photograph" (an inline SVG, so the story needs no network): a campus block at dusk. */
const CAMPUS_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice">',
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">',
    '<stop offset="0" stop-color="#1b2a6b"/><stop offset=".55" stop-color="#6d4bb3"/><stop offset="1" stop-color="#f29a6b"/>',
    '</linearGradient></defs>',
    '<rect width="800" height="1000" fill="url(#s)"/>',
    '<circle cx="560" cy="420" r="70" fill="#ffd9a8" opacity=".85"/>',
    '<path d="M0 640h120v-160h90v80h110v-220h150v140h90v-90h120v250h120V1000H0z" fill="#171a3a"/>',
    '<g fill="#ffcf7a" opacity=".9">',
    '<rect x="360" y="400" width="22" height="30"/><rect x="400" y="400" width="22" height="30"/>',
    '<rect x="360" y="460" width="22" height="30"/><rect x="440" y="460" width="22" height="30"/>',
    '<rect x="150" y="520" width="18" height="26"/><rect x="620" y="440" width="20" height="28"/>',
    '<rect x="660" y="500" width="20" height="28"/>',
    '</g>',
    '<path d="M0 820c160-40 320-40 480 0s240 40 320 10V1000H0z" fill="#0d0f24"/>',
    '</svg>',
  ].join(''),
)}`;

const COHORTS = [
  ['sst-2029', 'Scaler School of Technology · Batch of 2029'],
  ['ssb-2027', 'Scaler School of Business · PGP 2027'],
  ['sst-mtech', 'SST · M.Tech in AI (working professionals)'],
] as const;

/** Dialog's "Apply now" lead form: Field, Input, PhoneInput, Select. */
function LeadForm({ id = 'sheet-apply-lead' }: { id?: string }) {
  return (
    <form
      id={id}
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
      <Field label="Graduation year">
        <Input inputMode="numeric" placeholder="2026" />
      </Field>
    </form>
  );
}

type FullArgs = Pick<
  BottomSheetProps,
  'open' | 'size' | 'mediaRatio' | 'mediaOnMobile' | 'mediaSrc' | 'mediaAlt' | 'mediaLabel'
>;

/**
 * The compound full-size sheet. `onOpenChange` comes from the story's
 * `useArgs`, so the `open` control, the trigger, the ×, Escape and the drag
 * all agree (two-way; never pinned open).
 */
function FullSheet({
  args,
  onOpenChange,
  media = true,
  trigger = 'Apply now',
  children,
}: {
  args: FullArgs;
  onOpenChange: (open: boolean) => void;
  media?: boolean;
  trigger?: string;
  children: React.ReactNode;
}) {
  const pane = children;
  return (
    <BottomSheet open={Boolean(args.open)} onOpenChange={onOpenChange}>
      <BottomSheetTrigger asChild>
        <Button shine>{trigger}</Button>
      </BottomSheetTrigger>
      <BottomSheetContent size={args.size ?? 'full'}>
        {media ? (
          <BottomSheetSplit mediaRatio={args.mediaRatio} mediaOnMobile={args.mediaOnMobile}>
            <BottomSheetPane>{pane}</BottomSheetPane>
            <BottomSheetMedia src={args.mediaSrc || undefined} alt={args.mediaAlt} label={args.mediaLabel} />
          </BottomSheetSplit>
        ) : (
          pane
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function ApplyPane() {
  return (
    <>
      <BottomSheetHeader eyebrow="Admissions · Batch of 2029" closeLabel="Close application form">
        <BottomSheetTitle>Apply to Scaler</BottomSheetTitle>
        <BottomSheetDescription>
          Applications for the Batch of 2029 close on 30 Apr 2026. It takes two minutes; the NSET comes next.
        </BottomSheetDescription>
      </BottomSheetHeader>
      <BottomSheetBody>
        <LeadForm />
        <BottomSheetActions>
          <BottomSheetClose asChild>
            <Button variant="tertiary">Not now</Button>
          </BottomSheetClose>
          <Button type="submit" form="sheet-apply-lead">
            Request a callback
          </Button>
        </BottomSheetActions>
      </BottomSheetBody>
    </>
  );
}

const FULL_ARG_TYPES = {
  open: {
    control: 'boolean',
    description: 'Two-way: the trigger, ×, Escape and the drag write it back.',
  },
  size: { control: 'inline-radio', options: SIZES },
  mediaRatio: { control: 'inline-radio', options: MEDIA_RATIOS },
  mediaOnMobile: { control: 'inline-radio', options: MEDIA_ON_MOBILE },
  mediaSrc: { control: 'text' },
  mediaAlt: { control: 'text' },
  mediaLabel: { control: 'text' },
} as const;

const FULL_ARGS: FullArgs = {
  open: false,
  size: 'full',
  mediaRatio: '5:7',
  mediaOnMobile: 'banner',
  mediaSrc: '',
  mediaAlt: '',
  mediaLabel: 'Campus photo · 5 : 7',
};

const STAGES: Array<[string, boolean]> = [
  ['Shortlisted', true],
  ['Interview scheduled', true],
  ['On hold', false],
  ['Offer sent', false],
];

/** The HTML's `sheet-applicant-filter` fields. */
function ApplicantFilters() {
  const [score, setScore] = React.useState([65]);
  return (
    <>
      <div role="group" aria-labelledby="sheet-stage-label" className="grid gap-2">
        <Text as="span" size="sm" className="font-semibold" id="sheet-stage-label">
          Stage
        </Text>
        <div className="flex flex-wrap gap-2">
          {STAGES.map(([label, on]) => (
            <Chip key={label} defaultSelected={on}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <Field label="Campus">
        <Select defaultValue="blr">
          <FieldControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FieldControl>
          <SelectContent>
            <SelectItem value="all">All campuses</SelectItem>
            <SelectItem value="blr">Bengaluru — SST residential</SelectItem>
            <SelectItem value="hybrid">Hybrid — SSB</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-2">
        <Text as="span" size="sm" className="font-semibold" id="sheet-score-label">
          Minimum NSET score — <span className="tabular-nums">{score[0]}</span>
        </Text>
        <Slider aria-labelledby="sheet-score-label" max={100} value={score} onValueChange={setScore} />
      </div>
      <FieldSet legend="Scholarship" variant="choices">
        <Field label="Merit scholarship applicants only" orientation="horizontal">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Needs-based financial aid requested" orientation="horizontal">
          <Checkbox />
        </Field>
      </FieldSet>
    </>
  );
}

function FilterSheet({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <BottomSheet defaultOpen={defaultOpen}>
      <BottomSheetTrigger asChild>
        <Button variant="secondary">
          <Funnel />
          Filter applicants
          <Badge tone="brand">2</Badge>
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent>
        <BottomSheetHeader eyebrow="Admissions · Batch of 2029" closeLabel="Close filters">
          <BottomSheetTitle>Filter applicants</BottomSheetTitle>
        </BottomSheetHeader>
        <BottomSheetBody>
          <ApplicantFilters />
          <BottomSheetActions>
            <BottomSheetClose asChild>
              <Button variant="tertiary">Reset</Button>
            </BottomSheetClose>
            <BottomSheetClose asChild>
              <Button>Show 214 applicants</Button>
            </BottomSheetClose>
          </BottomSheetActions>
        </BottomSheetBody>
      </BottomSheetContent>
    </BottomSheet>
  );
}

const meta = {
  title: 'Organisms/BottomSheet',
  component: BottomSheet,
  subcomponents: {
    BottomSheetTrigger,
    BottomSheetContent,
    BottomSheetHeader,
    BottomSheetTitle,
    BottomSheetDescription,
    BottomSheetBody,
    BottomSheetActions,
    BottomSheetClose,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        component: [
          '`size="full"` + `BottomSheetSplit`: a full-viewport sheet with an image column (LEFT from `sm`, 672px; a',
          'capped banner, or hidden, on phones) beside any content, e.g. an "Apply now" form. Edge to edge on',
          'phones; from `sm` a top gap and xl top corners keep it a sheet. The pane scrolls on its own.',
          '',
          'The phone counterpart of the SideDrawer: rises from the bottom edge, thumb-reachable, for filters and',
          'short pickers on small screens. Not for desktop, where a Popover or SideDrawer sits closer to the control.',
          '',
          'Dismissed by dragging the grabber down (past a quarter of the height, or a flick), the scrim, Escape or',
          'the ×. Otherwise the Dialog contract (same Radix primitive). At most 80% of the viewport tall; the body',
          'scrolls. No footer part, as in the HTML: the actions are the last row of the body, `BottomSheetActions`.',
        ].join('\n'),
      },
    },
  },
  args: {
    title: 'Filter applicants',
    eyebrow: 'Admissions · Batch of 2029',
    trigger: 'Filter applicants',
    triggerVariant: 'secondary',
    cancelLabel: 'Reset',
    confirmLabel: 'Show 214 applicants',
    closeLabel: 'Close filters',
    defaultOpen: false,
    modal: true,
    size: 'default',
  },
  argTypes: {
    title: { control: 'text', description: 'Flat form: the sheet title. Setting it turns the flat form on.' },
    eyebrow: { control: 'text' },
    description: { control: 'text' },
    trigger: { control: 'text' },
    triggerVariant: { control: 'select', options: BUTTON_VARIANTS },
    cancelLabel: { control: 'text' },
    confirmLabel: { control: 'text' },
    closeLabel: { control: 'text' },
    size: {
      control: 'inline-radio',
      options: SIZES,
      description: '`default` content-sized (80dvh max) · `full` the viewport (a small top gap from `sm`).',
    },
    mediaSrc: {
      control: 'text',
      description: 'Flat form: image URL. Set it (or `mediaLabel`) for the split.',
    },
    mediaAlt: {
      control: 'text',
      description: 'Flat form: alt text. Empty: decorative.',
    },
    mediaLabel: {
      control: 'text',
      description: 'Flat form: placeholder caption (no `mediaSrc`).',
    },
    media: {
      control: false,
      description: 'Flat form: your own image element (`next/image` with `fill`).',
    },
    mediaRatio: { control: 'inline-radio', options: MEDIA_RATIOS },
    mediaOnMobile: { control: 'inline-radio', options: MEDIA_ON_MOBILE },
    open: {
      control: false,
      description: 'Controlled state. Use `defaultOpen` here.',
    },
    defaultOpen: { control: 'boolean' },
    modal: { control: 'boolean' },
    onOpenChange: { action: 'openChange' },
    onCancel: { action: 'cancel' },
    onConfirm: { action: 'confirm' },
    children: { control: false },
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls. The body is `children`. */
export const Playground: Story = {
  render: (args) => (
    <BottomSheet key={String(args.defaultOpen)} {...args}>
      <ApplicantFilters />
    </BottomSheet>
  ),
};

/** The HTML's working example: the filter sheet behind a badge-counted trigger. */
export const ApplicantFilter: Story = {
  name: 'Applicant filter (HTML)',
  render: () => (
    <Row>
      <Spec label="trigger · opens the filter sheet">
        <FilterSheet />
      </Spec>
      <Spec label="behaviour">
        <Text size="sm" tone="secondary">
          Grabber affords the drag · focus trapped · <Kbd>Esc</Kbd> closes
        </Text>
      </Spec>
    </Row>
  ),
};

/** Open on load, for review in the four brand × theme combinations and at phone width. */
export const Open: Story = {
  render: () => <FilterSheet defaultOpen />,
};

/** A short picker: no grabber drag, a description, and a single choice that commits and closes. */
export const ShortPicker: Story = {
  render: () => (
    <BottomSheet>
      <BottomSheetTrigger asChild>
        <Button variant="secondary">Sort by</Button>
      </BottomSheetTrigger>
      <BottomSheetContent dragToDismiss={false}>
        <BottomSheetHeader>
          <BottomSheetTitle>Sort applicants</BottomSheetTitle>
          <BottomSheetDescription>Applies to the Batch of 2029 pipeline.</BottomSheetDescription>
        </BottomSheetHeader>
        <BottomSheetBody className="gap-2">
          {['NSET score, high to low', 'Interview date, soonest first', 'Applied on, newest first'].map((label) => (
            <BottomSheetClose key={label} asChild>
              <Button variant="tertiary" className="justify-start">
                {label}
              </Button>
            </BottomSheetClose>
          ))}
        </BottomSheetBody>
      </BottomSheetContent>
    </BottomSheet>
  ),
};

/**
 * The full-size sheet with the image placeholder left and the "Apply now"
 * lead form right (a banner above it on phones). The pane scrolls on its own;
 * the Select and country picker portal above the sheet.
 */
export const FullSplitForm: Story = {
  name: 'Full size · split with form',
  args: FULL_ARGS,
  argTypes: FULL_ARG_TYPES,
  parameters: { viewport: { defaultViewport: 'responsive' } },
  render: function FullSplitFormStory(args) {
    const [, updateArgs] = useArgs<FullArgs>();
    const onOpenChange = (open: boolean) => updateArgs({ open });
    return (
      <FullSheet args={args} onOpenChange={onOpenChange}>
        <ApplyPane />
      </FullSheet>
    );
  },
};

/** Anything in the pane: a programme overview with a call to action, no form. */
export const FullSplitAnyContent: Story = {
  name: 'Full size · split with any content',
  args: {
    ...FULL_ARGS,
    mediaRatio: '1:1',
    mediaLabel: 'Programme film still · 1 : 1',
  },
  argTypes: FULL_ARG_TYPES,
  parameters: { viewport: { defaultViewport: 'responsive' } },
  render: function FullSplitAnyContentStory(args) {
    const [, updateArgs] = useArgs<FullArgs>();
    const onOpenChange = (open: boolean) => updateArgs({ open });
    return (
      <FullSheet args={args} onOpenChange={onOpenChange} trigger="Explore the programme">
        <BottomSheetHeader eyebrow="Scaler School of Technology" closeLabel="Close programme overview">
          <BottomSheetTitle>B.Tech in Computer Science and AI</BottomSheetTitle>
        </BottomSheetHeader>
        <BottomSheetBody>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">4 years · residential</Badge>
            <Badge>Bengaluru</Badge>
            <Badge>Batch of 2029</Badge>
          </div>
          <Text>
            Build real software from the first term: two industry internships, a capstone shipped with a partner
            company, and mentors who run engineering teams today.
          </Text>
          {[
            ['Year 1', 'Programming foundations, discrete maths, the first shipped product.'],
            ['Year 2', 'Systems, data structures at scale, a summer internship.'],
            ['Year 3', 'AI and machine learning, a specialisation track, a second internship.'],
            ['Year 4', 'Capstone with an industry partner, placement season.'],
          ].map(([year, text]) => (
            <div key={year} className="grid gap-1">
              <Heading as="h3" size="3" className="m-0">
                {year}
              </Heading>
              <Text size="sm" tone="secondary">
                {text}
              </Text>
            </div>
          ))}
          <BottomSheetActions>
            <BottomSheetClose asChild>
              <Button variant="tertiary">Back</Button>
            </BottomSheetClose>
            <Button>Download the brochure</Button>
          </BottomSheetActions>
        </BottomSheetBody>
      </FullSheet>
    );
  },
};

/** No media: the full-size sheet alone. The body keeps a readable measure (68ch) on wide screens. */
export const FullNoMedia: Story = {
  name: 'Full size · no media',
  args: FULL_ARGS,
  argTypes: FULL_ARG_TYPES,
  parameters: { viewport: { defaultViewport: 'responsive' } },
  render: function FullNoMediaStory(args) {
    const [, updateArgs] = useArgs<FullArgs>();
    const onOpenChange = (open: boolean) => updateArgs({ open });
    return (
      <FullSheet args={args} onOpenChange={onOpenChange} media={false}>
        <ApplyPane />
      </FullSheet>
    );
  },
};

/** `mediaOnMobile="hidden"`: the picture from `sm` up only; on a phone the form takes the whole sheet. */
export const FullMediaHiddenOnMobile: Story = {
  name: 'Full size · media hidden on mobile',
  args: { ...FULL_ARGS, mediaOnMobile: 'hidden' },
  argTypes: FULL_ARG_TYPES,
  parameters: { viewport: { defaultViewport: 'responsive' } },
  render: function FullMediaHiddenOnMobileStory(args) {
    const [, updateArgs] = useArgs<FullArgs>();
    const onOpenChange = (open: boolean) => updateArgs({ open });
    return (
      <FullSheet args={args} onOpenChange={onOpenChange}>
        <ApplyPane />
      </FullSheet>
    );
  },
};

/** A real image (`src` + `alt`): cropped to the column (`object-fit: cover`), announced by its alt. */
export const FullRealImage: Story = {
  name: 'Full size · real image',
  args: {
    ...FULL_ARGS,
    mediaSrc: CAMPUS_PHOTO,
    mediaAlt: 'The Scaler campus in Bengaluru at dusk',
    mediaLabel: '',
  },
  argTypes: FULL_ARG_TYPES,
  parameters: { viewport: { defaultViewport: 'responsive' } },
  render: function FullRealImageStory(args) {
    const [, updateArgs] = useArgs<FullArgs>();
    const onOpenChange = (open: boolean) => updateArgs({ open });
    return (
      <FullSheet args={args} onOpenChange={onOpenChange}>
        <ApplyPane />
      </FullSheet>
    );
  },
};

/**
 * The flat form, as a Storyblok blok would describe it: `size`, `mediaSrc`,
 * `mediaAlt`, `title`, `description`, `trigger`, the actions, and the form as
 * `children`. Open state two-way bound to the `open` arg.
 */
export const FullFlat: Story = {
  name: 'Full size · flat props',
  args: {
    title: 'Apply to Scaler',
    eyebrow: 'Admissions · Batch of 2029',
    description: 'Applications for the Batch of 2029 close on 30 Apr 2026.',
    trigger: 'Apply now',
    triggerVariant: 'primary',
    cancelLabel: 'Not now',
    confirmLabel: 'Request a callback',
    closeLabel: 'Close application form',
    size: 'full',
    mediaSrc: CAMPUS_PHOTO,
    mediaAlt: '',
    mediaRatio: '5:7',
    mediaOnMobile: 'banner',
    open: false,
  },
  argTypes: { open: FULL_ARG_TYPES.open },
  parameters: { viewport: { defaultViewport: 'responsive' } },
  render: function FullFlatStory({ open, ...args }) {
    const [, updateArgs] = useArgs<BottomSheetProps>();
    return (
      <BottomSheet {...args} open={Boolean(open)} onOpenChange={(next) => updateArgs({ open: next })}>
        <LeadForm id="sheet-apply-flat" />
      </BottomSheet>
    );
  },
};

type StripArgs = { open?: boolean; size?: BottomSheetSize; mediaSrc?: string; mediaAlt?: string; mediaLabel?: string };

/**
 * A media STRIP: `BottomSheetMedia` as a direct child of `BottomSheetContent`
 * (no split) runs 2:1 across the top at every width, flush to the sheet's
 * corners. The grabber floats over the picture; the × stays in the head.
 */
export const MediaStrip: Story = {
  name: 'Media strip on top',
  args: { open: true, size: 'default', mediaSrc: CAMPUS_PHOTO, mediaAlt: '', mediaLabel: 'Campus photo · 2 : 1' } as StripArgs,
  argTypes: {
    open: FULL_ARG_TYPES.open,
    size: FULL_ARG_TYPES.size,
    mediaSrc: { control: 'text', description: 'Empty: the placeholder.' },
    mediaAlt: FULL_ARG_TYPES.mediaAlt,
    mediaLabel: { control: 'text', description: 'Placeholder caption (no `mediaSrc`).' },
  },
  render: function MediaStripStory(raw) {
    const args = raw as StripArgs;
    const [, updateArgs] = useArgs<StripArgs>();
    return (
      <BottomSheet open={Boolean(args.open)} onOpenChange={(open) => updateArgs({ open })}>
        <BottomSheetTrigger asChild>
          <Button>Scholarship test</Button>
        </BottomSheetTrigger>
        <BottomSheetContent size={args.size}>
          <BottomSheetMedia src={args.mediaSrc || undefined} alt={args.mediaAlt} label={args.mediaLabel} />
          <BottomSheetHeader eyebrow="Batch of 2030" closeLabel="Close scholarship details">
            <BottomSheetTitle>NSET scholarship test</BottomSheetTitle>
            <BottomSheetDescription>12 Oct 2026 · online · 90 minutes</BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetBody>
            <Text>
              Up to 100% of the tuition fee is waived for the top scorers. Book a slot to get the syllabus and two mock
              tests.
            </Text>
            <BottomSheetActions>
              <BottomSheetClose asChild>
                <Button variant="tertiary">Not now</Button>
              </BottomSheetClose>
              <Button>Book a slot</Button>
            </BottomSheetActions>
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    );
  },
};
