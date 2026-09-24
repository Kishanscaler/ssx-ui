import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, GraduationCap } from '@phosphor-icons/react';

import { Avatar, AvatarFallback } from '../Avatar';
import { Badge, type BadgeTone } from '../Badge';
import { Button, type ButtonVariant } from '../Button';
import { EmptyState } from '../EmptyState';
import { Skeleton } from '../Skeleton';
import {
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  type ListProps,
} from './List';

const meta = {
  title: 'Organisms/List',
  component: List,
  subcomponents: {
    ListItem,
    ListItemLeading,
    ListItemContent,
    ListItemTitle,
    ListItemDescription,
    ListItemTrailing,
  } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A vertical stack of records: an identity (Avatar or icon), a title with an optional `meta`',
          'identifier, a supporting line, and a trailing status and action. Use it where a table would be mostly',
          'empty columns; comparing values across rows is a Table. `as="ol"` when order matters; `selected` on a',
          'row marks the open record (`aria-current`). Server components throughout.',
        ].join(' '),
      },
    },
  },
  args: { as: 'ul', 'aria-label': 'Week 6 submissions' } as ListProps,
  argTypes: {
    as: { control: 'inline-radio', options: ['ul', 'ol'], description: 'List element.' },
    'aria-label': { control: 'text' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

type Submission = {
  initials: string;
  name: string;
  id: string;
  line: string;
  status: string;
  tone: BadgeTone;
  action: string;
  actionVariant: ButtonVariant;
  selected?: boolean;
};

const SUBMISSIONS: Submission[] = [
  { initials: 'AK', name: 'Aarav Krishnan', id: 'SST-2029-0416', line: 'Submitted 4 Mar 2026, 11:42 PM · 18 minutes before the deadline', status: 'Graded 92', tone: 'success', action: 'Open', actionVariant: 'tertiary' },
  { initials: 'MI', name: 'Meher Iyengar', id: 'SST-2029-0733', line: 'Submitted 4 Mar 2026, 09:07 PM · awaiting the second reviewer', status: 'In review', tone: 'warning', action: 'Review', actionVariant: 'secondary', selected: true },
  { initials: 'DR', name: 'Devansh Raghunathan', id: 'SST-2029-1187', line: 'Resubmitted 6 Mar 2026, 01:15 AM after the academic-integrity review cleared the original submission with no finding against it', status: 'Regrading', tone: 'info', action: 'Open', actionVariant: 'tertiary' },
  { initials: 'RQ', name: 'Rehan Qureshi', id: 'SST-2029-0042', line: 'No submission · deadline passed 4 Mar 2026, 11:59 PM', status: 'Missing', tone: 'danger', action: 'Nudge', actionVariant: 'tertiary' },
];

/** The HTML's submissions list: avatar, title + meta, supporting line, status, one action; row 2 selected; a loading row. */
export const Playground: Story = {
  render: (args) => (
    <List {...args}>
      {SUBMISSIONS.map((s) => (
        <ListItem key={s.id} selected={s.selected}>
          <ListItemLeading>
            <Avatar aria-hidden="true">
              <AvatarFallback>{s.initials}</AvatarFallback>
            </Avatar>
          </ListItemLeading>
          <ListItemContent>
            <ListItemTitle meta={s.id}>{s.name}</ListItemTitle>
            <ListItemDescription>{s.line}</ListItemDescription>
          </ListItemContent>
          <ListItemTrailing>
            <Badge tone={s.tone}>{s.status}</Badge>
            <Button size="sm" variant={s.actionVariant} aria-label={`${s.action} ${s.name}'s submission`}>
              {s.action}
            </Button>
          </ListItemTrailing>
        </ListItem>
      ))}
      <ListItem aria-busy="true">
        <ListItemLeading>
          <Skeleton shape="circle" />
        </ListItemLeading>
        <ListItemContent className="grid gap-2">
          <Skeleton shape="title" className="w-1/3" />
          <Skeleton className="w-3/4" />
        </ListItemContent>
        <span className="sr-only">Loading more submissions</span>
      </ListItem>
    </List>
  ),
};

/** Icon leading instead of an avatar; an ordered list where the order is the point. */
export const IconsAndOrder: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <List aria-label="Programme documents">
        {[
          ['Offer letter — Batch of 2029', 'PDF · 214 KB · issued 5 Mar 2026'],
          ['Fee schedule, Plan A', 'PDF · 96 KB · two instalments'],
          ['Hostel allotment rules', 'PDF · 1.2 MB · Bengaluru campus'],
        ].map(([title, line]) => (
          <ListItem key={title}>
            <ListItemLeading>
              <FileText />
            </ListItemLeading>
            <ListItemContent>
              <ListItemTitle>{title}</ListItemTitle>
              <ListItemDescription>{line}</ListItemDescription>
            </ListItemContent>
            <ListItemTrailing>
              <Button size="sm" variant="tertiary">
                Download
              </Button>
            </ListItemTrailing>
          </ListItem>
        ))}
      </List>
      <List as="ol" aria-label="Interview queue, 18 Mar 2026">
        {['Aarav Krishnan · 10:00 AM', 'Ishita Balasubramanian · 10:30 AM', 'Rehan Qureshi · 11:00 AM'].map((t, i) => (
          <ListItem key={t}>
            <ListItemLeading>
              <GraduationCap />
            </ListItemLeading>
            <ListItemContent>
              <ListItemTitle meta={`slot ${i + 1}`}>{t}</ListItemTitle>
            </ListItemContent>
          </ListItem>
        ))}
      </List>
    </div>
  ),
};

/** No records: an EmptyState in a single row. */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <List aria-label="Week 7 submissions">
      <ListItem className="hover:bg-transparent">
        <EmptyState
          className="flex-1"
          icon={<FileText />}
          title="Nothing submitted yet"
          description="Submissions appear here as students upload. The deadline is 14 Mar 2026, 11:59 PM."
        />
      </ListItem>
    </List>
  ),
};
