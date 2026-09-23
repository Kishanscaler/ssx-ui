import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  Card,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
  cardVariants,
} from './Card';

describe('Card', () => {
  it('renders the compound parts with their slots', () => {
    const { container } = render(
      <Card as="article" aria-label="Module 06">
        <CardMedia alt="Campus" />
        <CardBody>
          <CardHeader>
            <CardTitle>Data Structures &amp; Algorithms</CardTitle>
            <button type="button">More</button>
          </CardHeader>
          <CardEyebrow>Module 06</CardEyebrow>
          <CardDescription>Week 6 of 12</CardDescription>
        </CardBody>
        <CardFooter>Graded</CardFooter>
      </Card>,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.tagName).toBe('ARTICLE');
    expect(card).toHaveAttribute('data-slot', 'card');
    expect(card).toHaveAttribute('data-variant', 'default');
    for (const slot of [
      'card-media',
      'card-body',
      'card-header',
      'card-title',
      'card-eyebrow',
      'card-description',
      'card-footer',
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(screen.getByRole('heading', { level: 3, name: 'Data Structures & Algorithms' })).toBeInTheDocument();
    // The eyebrow is a paragraph, not an outline entry.
    expect(screen.getByText('Module 06').tagName).toBe('P');
    expect(screen.getByRole('img', { name: 'Campus' })).toHaveAttribute('data-ratio', '16:9');
  });

  it('builds media + body from the flat fields, then renders children after', () => {
    const { container } = render(
      <Card
        eyebrow="Campus life"
        title="Orientation week"
        titleAs="h2"
        description="4–9 Aug 2026"
        image="/orientation.jpg"
        imageAlt="Cohort 7 on the lawn"
      >
        <CardFooter>footer</CardFooter>
      </Card>,
    );
    const card = container.firstElementChild as HTMLElement;
    const slots = Array.from(card.children).map((c) => c.getAttribute('data-slot'));
    expect(slots).toEqual(['card-media', 'card-body', 'card-footer']);
    expect(screen.getByRole('img', { name: 'Cohort 7 on the lawn' })).toHaveAttribute('src', '/orientation.jpg');
    expect(screen.getByRole('heading', { level: 2, name: 'Orientation week' })).toBeInTheDocument();
    // `title` is ours, not the tooltip attribute.
    expect(card).not.toHaveAttribute('title');
  });

  it('media variant: the image is a background, no <img>, text over a scrim', () => {
    const { container } = render(<Card variant="media" image="/a b.jpg" title="Residency week" />);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveAttribute('data-variant', 'media');
    expect(card.style.getPropertyValue('--card-image')).toBe('url("/a b.jpg")');
    expect(container.querySelector('img')).toBeNull();
    expect(card.className).toContain('before:from-surface-image-scrim');
  });

  it('renders nothing extra with no flat fields', () => {
    const { container } = render(<Card>plain</Card>);
    expect((container.firstElementChild as HTMLElement).innerHTML).toBe('plain');
  });

  it('asChild lends the card to the child and still injects the flat fields', () => {
    render(
      <Card asChild title="Report">
        <section aria-label="report">
          <span>tail</span>
        </section>
      </Card>,
    );
    const section = screen.getByRole('region', { name: 'report' });
    expect(section).toHaveAttribute('data-slot', 'card');
    expect(section.firstElementChild).toHaveAttribute('data-slot', 'card-body');
    expect(section.lastElementChild).toHaveTextContent('tail');
  });

  it('merges className last and forwards refs on every part', () => {
    const refs = {
      card: React.createRef<HTMLElement>(),
      body: React.createRef<HTMLDivElement>(),
      title: React.createRef<HTMLHeadingElement>(),
      desc: React.createRef<HTMLParagraphElement>(),
      eyebrow: React.createRef<HTMLParagraphElement>(),
      footer: React.createRef<HTMLDivElement>(),
      media: React.createRef<HTMLDivElement>(),
      header: React.createRef<HTMLDivElement>(),
    };
    render(
      <Card ref={refs.card} className="rounded-none">
        <CardMedia ref={refs.media} className="aspect-square" />
        <CardBody ref={refs.body} className="p-8">
          <CardHeader ref={refs.header}>
            <CardTitle ref={refs.title}>T</CardTitle>
          </CardHeader>
          <CardEyebrow ref={refs.eyebrow}>E</CardEyebrow>
          <CardDescription ref={refs.desc}>D</CardDescription>
        </CardBody>
        <CardFooter ref={refs.footer}>F</CardFooter>
      </Card>,
    );
    Object.values(refs).forEach((r) => expect(r.current).toBeInstanceOf(HTMLElement));
    expect(refs.card.current).toHaveClass('rounded-none');
    expect(refs.card.current).not.toHaveClass('rounded-lg');
    expect(refs.body.current).toHaveClass('p-8');
    expect(refs.body.current).not.toHaveClass('p-5');
    expect(refs.media.current).toHaveClass('aspect-square');
    expect(refs.media.current).not.toHaveClass('aspect-video');
  });

  it('keeps padding off the root and no width baked in (Carousel-safe)', () => {
    const cls = cardVariants({ variant: 'default' });
    expect(cls).not.toMatch(/(^|\s)p-\d/);
    expect(cls).not.toMatch(/(^|\s)w-/);
  });

  it('CardMedia wraps a consumer image', () => {
    render(
      <CardMedia ratio="4:3">
        <img src="/x.png" alt="Showcase" />
      </CardMedia>,
    );
    const img = screen.getByRole('img', { name: 'Showcase' });
    expect(img.parentElement).toHaveAttribute('data-ratio', '4:3');
    expect(img.parentElement).not.toHaveAttribute('role');
  });
});
