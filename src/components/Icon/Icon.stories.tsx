import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from './Icon';
import { Button } from '../Button';
// Stand-in for `@phosphor-icons/react` (same names and props); see the fixture header.
import {
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  BookmarkSimple,
  CaretDown,
  CaretRight,
  ChalkboardTeacher,
  Check,
  CheckCircle,
  ClockCountdown,
  CurrencyInr,
  DotsThree,
  DownloadSimple,
  Exam,
  GraduationCap,
  Heart,
  Info,
  MagnifyingGlass,
  Notebook,
  Paperclip,
  Plus,
  PresentationChart,
  Prohibit,
  SealCheck,
  Star,
  Student,
  TerminalWindow,
  Trash,
  TreeStructure,
  Trophy,
  UploadSimple,
  UsersThree,
  Warning,
  WarningCircle,
  X,
} from './_fixtures/phosphor';
import { Row, Spec, Stack } from './_fixtures/story-layout';

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A **wrapper, not an icon pack**. The glyph is the child — a `@phosphor-icons/react` component',
          '(the recommended source; the HTML allowlist is Phosphor 2.1.1), or any single `<svg>`.',
          '`Icon` renders no element of its own: it puts the size token, `currentColor` and the',
          'accessibility default onto the child svg.',
          '',
          'Phosphor icons are **filled paths on a 256 grid**: weight is a different path, never a',
          'stroke. Use `weight="bold"` at 16px (regular thins to 1px there) and `weight="fill"` for a',
          'selected state. Neither is an emphasis device.',
          '',
          'Inside a control (Button, Badge, ...) leave `size` off: the control sizes its icons.',
        ].join('\n'),
      },
    },
  },
  args: { children: <Star />, size: 'lg', tone: 'inherit' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    tone: { control: 'inline-radio', options: ['inherit', 'brand', 'success', 'warning', 'danger', 'info'] },
    children: { control: false },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const SET: Array<[string, React.ReactElement]> = [
  ['search', <MagnifyingGlass />],
  ['add', <Plus />],
  ['close', <X />],
  ['check', <Check />],
  ['chevron-right', <CaretRight />],
  ['chevron-down', <CaretDown />],
  ['arrow-right', <ArrowRight />],
  ['open-external', <ArrowSquareOut />],
  ['download', <DownloadSimple />],
  ['upload', <UploadSimple />],
  ['delete', <Trash />],
  ['more', <DotsThree />],
  ['student', <Student />],
  ['cohort', <UsersThree />],
  ['mentor', <ChalkboardTeacher />],
  ['programme', <GraduationCap />],
  ['course', <BookOpen />],
  ['assessment', <Exam />],
  ['placement', <Trophy />],
  ['fee', <CurrencyInr />],
  ['deadline', <ClockCountdown />],
  ['success', <CheckCircle />],
  ['warning', <Warning />],
  ['error', <WarningCircle />],
];

/** A representative set at the 24px default, regular weight. Semantic names, Phosphor glyphs. */
export const RepresentativeSet: Story = {
  render: () => (
    <Row>
      {SET.map(([name, glyph]) => (
        <Spec key={name} label={name}>
          <Icon>{glyph}</Icon>
        </Spec>
      ))}
    </Row>
  ),
};

/** 16 / 20 / 24 / 32 / 48. Size is a box, not a scale factor: the path is the same drawing. */
export const Sizes: Story = {
  render: () => (
    <Row>
      <Spec label="sm · 16 · badge, chip, dense cell">
        <Icon size="sm">
          <Trophy weight="bold" />
        </Icon>
      </Spec>
      <Spec label="md · 20 · button, menu item">
        <Icon size="md">
          <Trophy />
        </Icon>
      </Spec>
      <Spec label="lg · 24 · the default">
        <Icon size="lg">
          <Trophy />
        </Icon>
      </Spec>
      <Spec label="xl · 32 · card header">
        <Icon size="xl">
          <Trophy />
        </Icon>
      </Spec>
      <Spec label="2xl · 48 · empty state">
        <Icon size="2xl">
          <Trophy />
        </Icon>
      </Spec>
    </Row>
  ),
};

/** regular · fill (the selected-state partner) · bold (for 16px dense surfaces). */
export const Weights: Story = {
  render: () => (
    <Stack>
      <Row>
        <Spec label="regular · the default">
          <Icon>
            <BookmarkSimple />
          </Icon>
        </Spec>
        <Spec label="fill · selected">
          <Icon>
            <BookmarkSimple weight="fill" />
          </Icon>
        </Spec>
        <Spec label="bold · 16px surfaces">
          <Icon>
            <BookmarkSimple weight="bold" />
          </Icon>
        </Spec>
        <Spec label="star regular / fill / bold">
          <span style={{ display: 'inline-flex', gap: 8 }}>
            <Icon>
              <Star />
            </Icon>
            <Icon>
              <Star weight="fill" />
            </Icon>
            <Icon>
              <Star weight="bold" />
            </Icon>
          </span>
        </Spec>
      </Row>
      <Row>
        <Spec label="16px regular — thins out">
          <span style={{ display: 'inline-flex', gap: 8 }}>
            {[Notebook, TerminalWindow, TreeStructure, PresentationChart].map((G, i) => (
              <Icon key={i} size="sm">
                <G />
              </Icon>
            ))}
          </span>
        </Spec>
        <Spec label="16px bold — the weight the eye expects">
          <span style={{ display: 'inline-flex', gap: 8 }}>
            {[Notebook, TerminalWindow, TreeStructure, PresentationChart].map((G, i) => (
              <Icon key={i} size="sm">
                <G weight="bold" />
              </Icon>
            ))}
          </span>
        </Spec>
      </Row>
    </Stack>
  ),
};

/** Fill marks selection: a pressed toggle, and the current nav item. */
export const FillInUse: Story = {
  render: () => (
    <Row>
      <Spec label="aria-pressed=false · regular">
        <Button variant="tertiary" size="icon-md" aria-pressed={false} aria-label="Favourite Cohort 7">
          <Heart />
        </Button>
      </Spec>
      <Spec label="aria-pressed=true · fill">
        <Button variant="tertiary" size="icon-md" aria-pressed aria-label="Remove Cohort 7 from favourites">
          <Heart weight="fill" />
        </Button>
      </Spec>
      <Spec label="nav · rest">
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <Icon size="md">
            <BookOpen />
          </Icon>
          Curriculum
        </span>
      </Spec>
      <Spec label="nav · current, fill + brand">
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--content-brand)' }}>
          <Icon size="md">
            <BookOpen weight="fill" />
          </Icon>
          Curriculum
        </span>
      </Spec>
    </Row>
  ),
};

/** Colour follows currentColor. A tone is a semantic role, so it is right in all four themes. */
export const Tones: Story = {
  render: () => (
    <Row>
      <Spec label="inherit">
        <Icon>
          <GraduationCap />
        </Icon>
      </Spec>
      <Spec label="brand">
        <Icon tone="brand">
          <GraduationCap />
        </Icon>
      </Spec>
      <Spec label="success">
        <Icon tone="success">
          <CheckCircle />
        </Icon>
      </Spec>
      <Spec label="warning">
        <Icon tone="warning">
          <Warning />
        </Icon>
      </Spec>
      <Spec label="danger">
        <Icon tone="danger">
          <WarningCircle />
        </Icon>
      </Spec>
      <Spec label="info">
        <Icon tone="info">
          <Info />
        </Icon>
      </Spec>
      <Spec label="muted · same colour dimmed">
        <Icon muted>
          <Paperclip />
        </Icon>
      </Spec>
    </Row>
  ),
};

/** Name it once: decorative beside a word, named by the parent in a button, `label` only when alone. */
export const AccessibleNaming: Story = {
  render: () => (
    <Row>
      <Spec label="decorative · the text carries it">
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
          <Icon size="md">
            <ClockCountdown />
          </Icon>
          Due in 6 hours
        </span>
      </Spec>
      <Spec label="icon-only button · the button is named">
        <Button variant="secondary" size="icon-md" aria-label="Download Aarav Krishnan's transcript">
          <DownloadSimple />
        </Button>
      </Spec>
      <Spec label="standalone · label → role=img">
        <Icon label="Verified SST alumnus">
          <SealCheck />
        </Icon>
      </Spec>
      <Spec label="status in a cell · icon plus a word">
        <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--status-danger-icon)' }}>
          <Icon size="sm">
            <Prohibit weight="bold" />
          </Icon>
          Enrolment blocked
        </span>
      </Spec>
    </Row>
  ),
};

/** Storyblok gives strings: every visual axis is a plain string option. */
export const FromCmsStrings: Story = {
  args: { size: 'xl' as const, tone: 'brand' as const, children: <GraduationCap /> },
};
