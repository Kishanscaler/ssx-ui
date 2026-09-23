import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './Avatar';
import { Badge } from '../Badge';
import { Text } from '../Text';
import { User } from '../Icon/_fixtures/phosphor';
import { Row, Spec, Stack } from '../Icon/_fixtures/story-layout';

const SSB_MARK = new URL('./_fixtures/ssb-mark.svg', import.meta.url).href;
const SST_WIDE = new URL('./_fixtures/sst-combination.svg', import.meta.url).href;

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  subcomponents: { AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Identity at a glance; initials by default. Decorative when the name is beside it (initials',
          'are `aria-hidden`); standing alone it takes an `aria-label` and becomes `role="img"`.',
          'Presence is an `AvatarBadge` in the corner, named in the same label. Radix loads the image',
          'client-side, so server HTML shows the initials first.',
        ].join('\n'),
      },
    },
  },
  args: { size: 'md', ring: false },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  render: (args) => (
    <Avatar {...args} aria-label="Aarav Krishnan">
      <AvatarFallback>AK</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <Row>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Spec key={size} label={`${size} · ${{ sm: 28, md: 40, lg: 48 }[size]}`}>
          <Avatar size={size}>
            <AvatarFallback>AK</AvatarFallback>
          </Avatar>
        </Spec>
      ))}
    </Row>
  ),
};

export const Content: Story = {
  render: () => (
    <Row>
      <Spec label="initials — decorative">
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </Spec>
      <Spec label="initials — standalone, named">
        <Avatar aria-label="Aarav Krishnan">
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </Spec>
      <Spec label="image — partner logo mark">
        <Avatar>
          <AvatarImage src={SSB_MARK} alt="Scaler School of Business" />
          <AvatarFallback>SSB</AvatarFallback>
        </Avatar>
      </Spec>
      <Spec label="fallback — no name, no photo">
        <Avatar aria-label="Unassigned reviewer">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      </Spec>
    </Row>
  ),
};

/** Any source ratio fills the circle from the centre. A wordmark cropped to 28px is unreadable. */
export const ImageCrop: Story = {
  render: () => (
    <Row>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Spec key={size} label={`${size} · a 29 × 40 portrait source`}>
          <Avatar size={size}>
            <AvatarImage src={SSB_MARK} alt="Scaler School of Business" />
            <AvatarFallback>SSB</AvatarFallback>
          </Avatar>
        </Spec>
      ))}
      <Spec label="lg · a 138 × 40 wide source, centre-cropped">
        <Avatar size="lg">
          <AvatarImage src={SST_WIDE} alt="Scaler School of Technology" />
          <AvatarFallback>SST</AvatarFallback>
        </Avatar>
      </Spec>
    </Row>
  ),
};

export const Ring: Story = {
  render: () => (
    <Row>
      <Spec label="ring — the signed-in user">
        <Avatar ring aria-label="Aarav Krishnan, signed in">
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </Spec>
      <Spec label="no ring">
        <Avatar aria-label="Priyadarshini Venkataraghavan">
          <AvatarFallback>PV</AvatarFallback>
        </Avatar>
      </Spec>
      <Spec label="ring · lg">
        <Avatar size="lg" ring aria-label="Anshuman Singh, lead mentor">
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
      </Spec>
    </Row>
  ),
};

/** The avatar carries the name AND the presence; the dot is hidden. */
export const Presence: Story = {
  render: () => (
    <Row>
      <Spec label="online — success">
        <Avatar aria-label="Aarav Krishnan — online">
          <AvatarFallback>AK</AvatarFallback>
          <AvatarBadge tone="success" />
        </Avatar>
      </Spec>
      <Spec label="in a live class — danger, pulsing">
        <Avatar aria-label="Anshuman Singh — in a live class">
          <AvatarFallback>AS</AvatarFallback>
          <AvatarBadge tone="danger" pulse />
        </Avatar>
      </Spec>
      <Spec label="offline — neutral">
        <Avatar aria-label="Rhea Mukherjee — offline">
          <AvatarFallback>RM</AvatarFallback>
          <AvatarBadge />
        </Avatar>
      </Spec>
      <Spec label="lg — the dot scales to 10px">
        <Avatar size="lg" aria-label="Priyadarshini Venkataraghavan — online">
          <AvatarFallback>PV</AvatarFallback>
          <AvatarBadge tone="success" />
        </Avatar>
      </Spec>
      <Spec label="sm — a dense row">
        <Avatar size="sm" aria-label="Ishaan Bhatt — online">
          <AvatarFallback>IB</AvatarFallback>
          <AvatarBadge tone="success" />
        </Avatar>
      </Spec>
      <Spec label="ring and presence">
        <Avatar ring aria-label="Aarav Krishnan, signed in — online">
          <AvatarFallback>AK</AvatarFallback>
          <AvatarBadge tone="success" />
        </Avatar>
      </Spec>
    </Row>
  ),
};

const initials = (list: string[]) =>
  list.map((i) => (
    <Avatar key={i}>
      <AvatarFallback>{i}</AvatarFallback>
    </Avatar>
  ));

export const Group: Story = {
  render: () => (
    <Row>
      <Spec label="group of 4 + overflow">
        <AvatarGroup aria-label="Aarav Krishnan, Priyadarshini Venkataraghavan, Rhea Mukherjee, Ishaan Bhatt and 3 more">
          {initials(['AK', 'PV', 'RM', 'IB'])}
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Spec>
      <Spec label="sm — inside a table row">
        <AvatarGroup size="sm" aria-label="Panel of 3 interviewers and 3 more">
          {initials(['SV', 'NG', 'TD'])}
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Spec>
      <Spec label="lg — cohort header">
        <AvatarGroup size="lg" aria-label="Cohort 7 mentors and 3 more">
          {initials(['AS', 'KM'])}
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      </Spec>
    </Row>
  ),
};

export const InSitu: Story = {
  render: () => (
    <Stack gap={16}>
      {(
        [
          ['AK', 'Aarav Krishnan', 'aarav.k@sst.scaler.com · Cohort 7 · Bengaluru', 'brand', 'Batch of 2029'],
          ['PV', 'Priyadarshini Venkataraghavan', "priyadarshini.v@ssb.scaler.com · SSB Cohort 4 · founder's office track", 'info', 'Interview scheduled'],
        ] as const
      ).map(([ini, name, meta, tone, badge]) => (
        <div key={ini} style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 640 }}>
          <Avatar>
            <AvatarFallback>{ini}</AvatarFallback>
          </Avatar>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text>{name}</Text>
            <Text size="sm" tone="secondary">
              {meta}
            </Text>
          </div>
          <Badge tone={tone}>{badge}</Badge>
        </div>
      ))}
    </Stack>
  ),
};
