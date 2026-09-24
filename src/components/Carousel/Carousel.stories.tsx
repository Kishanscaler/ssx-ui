import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Carousel, CarouselSlide, CarouselTrack, type CarouselItemData, type CarouselPerView } from './Carousel';
import { CarouselDots, CarouselNext, CarouselPrevious } from './CarouselControls';
import { Avatar, AvatarFallback } from '../Avatar';
import { Badge, type BadgeTone } from '../Badge';
import { Button } from '../Button';
import { Card, CardBody, CardDescription, CardFooter, CardTitle } from '../Card';
import { Text } from '../Text';

const PER_VIEW: CarouselPerView[] = ['auto', '1', '2', '3', '4'];

type Mentor = { initials: string; name: string; role: string; about: string; tag: string; tone: BadgeTone };

const MENTORS: Mentor[] = [
  {
    initials: 'NB',
    name: 'Nishant Bhaskar',
    role: 'Staff Software Engineer · Google',
    about:
      'Distributed systems, low-level design and site reliability engineering — mentors four students per cohort and reviews every capstone design doc line by line',
    tag: 'DSA · System Design',
    tone: 'brand',
  },
  {
    initials: 'RM',
    name: 'Ritika Menon',
    role: 'SDE III · Amazon',
    about: 'Interview preparation and behavioural rounds.',
    tag: 'Placements',
    tone: 'brand',
  },
  {
    initials: 'KS',
    name: 'Kabir Sethi',
    role: 'Engineering Manager · Uber',
    about: 'Backend architecture and career pathing.',
    tag: 'Career',
    tone: 'accent',
  },
  {
    initials: 'SN',
    name: 'Sanya Nair',
    role: 'Applied Scientist · Microsoft',
    about: 'Machine learning foundations and research reading groups.',
    tag: 'AI',
    tone: 'brand',
  },
  {
    initials: 'AV',
    name: 'Aditya Venkatesh',
    role: "Founder's Office · Flipkart",
    about: 'GTM strategy and financial analysis for SSB cohorts.',
    tag: 'SSB',
    tone: 'accent',
  },
  {
    initials: 'PG',
    name: 'Priyanka Ghosh',
    role: 'Senior SWE · Meta · GSoC mentor',
    about: 'Open source contribution and GSoC proposals.',
    tag: 'Accepting students',
    tone: 'success',
  },
];

function MentorCard({ mentor }: { mentor: Mentor }) {
  return (
    <Card as="article">
      <CardBody>
        <Avatar size="lg" aria-hidden="true">
          <AvatarFallback>{mentor.initials}</AvatarFallback>
        </Avatar>
        <CardTitle>{mentor.name}</CardTitle>
        <CardDescription>{mentor.role}</CardDescription>
        <Text size="sm" tone="secondary">
          {mentor.about}
        </Text>
        <div>
          <Badge tone={mentor.tone}>{mentor.tag}</Badge>
        </div>
      </CardBody>
      <CardFooter>
        <Button variant="secondary" size="sm">
          Book a session
        </Button>
      </CardFooter>
    </Card>
  );
}

const ITEMS: CarouselItemData[] = MENTORS.map((m) => ({
  title: m.name,
  eyebrow: m.tag,
  description: `${m.role}. ${m.about}`,
}));

const meta = {
  title: 'Organisms/Carousel',
  component: Carousel,
  subcomponents: { CarouselTrack, CarouselSlide, CarouselPrevious, CarouselNext, CarouselDots } as Record<
    string,
    React.ComponentType<unknown>
  >,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A horizontally scrolling rail for a browsable set where order is not meaningful — Super Mentors,',
          'alumni outcomes, campus life. Do NOT hide anything essential in one.',
          '',
          'Native CSS scroll-snap: swipe, trackpad and the arrow keys on the focused track all scroll it with no',
          'JavaScript, and the track and slides are server components. Only the arrows and dots are client code;',
          'they read the scroll position from the track. Prev / next move 80% of the track width (the HTML) and',
          'go dead at the ends. `region` + `aria-roledescription="carousel"`; each slide is a `group`,',
          '`aria-roledescription="slide"`, labelled "n of m".',
          '',
          'Compound API first; the flat `items` form maps onto a Storyblok blok.',
          '',
          '`CarouselTrack`\'s `bleed="gutter"` (the default) bleeds the scroller to the true viewport edge',
          'on a phone while the first/last slide keeps the page gutter as its own edge, so the next card\'s',
          'peek trails off the real screen instead of being sliced by the track\'s own box. Turn it off when',
          'this Carousel is nested in its own container (a Card, a Dialog) rather than the page edge.',
        ].join('\n'),
      },
    },
  },
  args: {
    label: 'Super Mentors for Cohort 7',
    perView: 'auto',
    items: ITEMS,
    controls: true,
    dots: true,
    previousLabel: 'Previous mentors',
    nextLabel: 'Next mentors',
    dotsLabel: 'Mentor pages',
    bleed: 'gutter',
  },
  argTypes: {
    label: { control: 'text' },
    perView: { control: 'select', options: PER_VIEW },
    items: { control: 'object' },
    controls: { control: 'boolean' },
    dots: { control: 'boolean' },
    previousLabel: { control: 'text' },
    nextLabel: { control: 'text' },
    dotsLabel: { control: 'text' },
    bleed: { control: 'inline-radio', options: ['gutter', 'none'] },
    className: { control: 'text' },
    children: { control: false },
  },
  render: (args) => (
    <div style={{ maxWidth: 1040, paddingInline: 'var(--space-4)' }}>
      <Carousel {...args} />
    </div>
  ),
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The flat form, driven by the controls: `items` of Card fields. */
export const Playground: Story = {};

function Mentors({
  perView = 'auto' as CarouselPerView,
  bleed,
  id,
}: {
  perView?: CarouselPerView;
  bleed?: 'none' | 'gutter';
  id?: string;
}) {
  return (
    <Carousel label="Super Mentors for Cohort 7" perView={perView} id={id}>
      <CarouselPrevious label="Previous mentors" />
      <CarouselTrack bleed={bleed}>
        {MENTORS.map((m) => (
          <CarouselSlide key={m.initials}>
            <MentorCard mentor={m} />
          </CarouselSlide>
        ))}
      </CarouselTrack>
      <CarouselNext label="Next mentors" />
      <CarouselDots label="Mentor pages" />
    </Carousel>
  );
}

/** The HTML's default specimen: six Super Mentor cards, compound API. */
export const SuperMentors: Story = {
  name: 'Default · Super Mentors',
  render: () => (
    <div style={{ maxWidth: 1040, paddingInline: 'var(--space-4)' }}>
      <Mentors />
    </div>
  ),
};

/** `perView="3"`: one and a peek on a phone, two from `sm`, three from `md`. */
export const ThreeAcross: Story = {
  name: 'Slides per view · 3',
  render: () => (
    <div style={{ maxWidth: 1040, paddingInline: 'var(--space-4)' }}>
      <Mentors perView="3" />
    </div>
  ),
};

/** Scrolled to the end on load (for review): next is dead, the last dot is current. */
export const AtTheEnd: Story = {
  name: 'End state · at the end',
  render: function AtEnd() {
    React.useEffect(() => {
      const track = document.querySelector<HTMLElement>('#mentors-end [data-slot="carousel-track"]');
      if (track) {
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = track.scrollWidth;
        track.style.scrollBehavior = '';
      }
    }, []);
    return (
      <div style={{ maxWidth: 1040, paddingInline: 'var(--space-4)' }}>
        <Mentors id="mentors-end" />
      </div>
    );
  },
};

/** A marketing rail with no dots and full-width slides, flat form. */
export const FullWidthSlides: Story = {
  name: 'Slides per view · 1, no dots',
  args: { perView: '1', dots: false, label: 'Campus life' },
};

/**
 * The bug this fixes: at phone width, inside a page's own `px-gutter`
 * container, the un-bled track (`bleed="none"`) ends flush with the gutter
 * and the peeking next card is sliced by a hard edge a few pixels past the
 * fold. `bleed="gutter"` (the default) cancels the container's own padding
 * on the track alone, so the SAME container reaches the real screen edge
 * while the first slide's edge still lines up with the gutter. Review at
 * 320 / 375.
 */
export const PhoneEdgeBleed: Story = {
  name: 'Mobile · edge bleed vs. clipped (320/375)',
  render: () => (
    <div style={{ display: 'grid', gap: 32, maxWidth: 375 }}>
      <div>
        <Text size="sm" tone="secondary" style={{ display: 'block', marginBottom: 8 }}>
          bleed=&quot;none&quot; — the old behaviour: the peek is clipped by the track&apos;s own box
        </Text>
        <div className="px-gutter" style={{ background: 'var(--surface-sunken)' }}>
          <Mentors bleed="none" id="mentors-clipped" />
        </div>
      </div>
      <div>
        <Text size="sm" tone="secondary" style={{ display: 'block', marginBottom: 8 }}>
          bleed=&quot;gutter&quot; (default) — the track reaches the real edge, the first slide keeps the gutter
        </Text>
        <div className="px-gutter" style={{ background: 'var(--surface-sunken)' }}>
          <Mentors bleed="gutter" id="mentors-bled" />
        </div>
      </div>
    </div>
  ),
};
