import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { LogoTile } from '../LogoTile';
import { MediaCard } from '../MediaCard';
import { PersonCard } from '../PersonCard';
import { SectionHeader } from '../SectionHeader';
import { ShowcaseCard } from '../ShowcaseCard';
import { StatCard } from '../StatCard';

/* One hand across the family: each shared part (parts.tsx) is drawn the same
 * in every component that shows it. */

const PHOTO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe('the marketing family draws each shared part once', () => {
  it('the tag on a photo is the glass Badge, at the same place in every card', () => {
    const tags = [
      slot(render(<PersonCard name="P" image={PHOTO} tag="Highlight" />).container, 'person-card-tag'),
      slot(render(<ShowcaseCard title="T" image={PHOTO} tag="Highlight" />).container, 'showcase-card-tag'),
      slot(render(<MediaCard title="T" image={PHOTO} tag="Highlight" />).container, 'media-card-tag'),
    ];
    for (const tag of tags) {
      expect(tag).toHaveAttribute('data-tone', 'glass');
      expect(tag).toHaveClass('absolute', 'start-4', 'top-4', 'h-indicator-md', 'rounded-md');
      expect(tag).toHaveTextContent('Highlight');
    }
  });

  it('the eyebrow is one ink: the brand on the page, the on-image ink on a photo', () => {
    const eyebrows = [
      slot(render(<SectionHeader eyebrow="E" title="T" />).container, 'section-header-eyebrow'),
      slot(render(<StatCard eyebrow="E" value="1" label="L" />).container, 'stat-card-eyebrow'),
      slot(render(<PersonCard eyebrow="E" name="P" layout="stacked" />).container, 'person-card-eyebrow'),
      slot(render(<MediaCard eyebrow="E" title="T" />).container, 'media-card-eyebrow'),
    ];
    for (const eyebrow of eyebrows) {
      expect(eyebrow).toHaveAttribute('data-part', 'eyebrow');
      expect(eyebrow).toHaveClass('type-eyebrow', 'text-content-brand', 'in-data-[surface-ink=on-image]:text-on-image-ink');
      expect(eyebrow!.className).not.toMatch(/text-content-secondary|text-on-image-ink-secondary/);
    }
  });

  it('a linked title is the heading in its own ink, underlined on hover', () => {
    const links = [
      slot(render(<PersonCard name="P" href="/p" />).container, 'person-card-link'),
      slot(render(<ShowcaseCard title="T" href="/t" />).container, 'showcase-card-link'),
      slot(render(<MediaCard title="T" href="/t" />).container, 'media-card-link'),
    ];
    for (const link of links) {
      expect(link!.tagName).toBe('A');
      expect(link).toHaveClass('text-inherit', 'no-underline', 'decoration-hair', 'underline-offset-link');
      expect(link).toHaveClass('in-data-[surface-ink=on-image]:focus-visible:outline-on-image-ink');
    }
  });

  it('a card title is the card title role (h3), in every card', () => {
    const titles = [
      slot(render(<PersonCard name="P" />).container, 'person-card-name'),
      slot(render(<PersonCard name="P" size="sm" />).container, 'person-card-name'),
      slot(render(<ShowcaseCard title="T" />).container, 'showcase-card-title'),
      slot(render(<MediaCard title="T" />).container, 'media-card-title'),
    ];
    for (const title of titles) {
      expect(title).toHaveClass('type-h3');
    }
  });

  it('a white logo tile carries the decorative hairline on a page, none on a photo', () => {
    const { container } = render(<LogoTile logo={{ name: 'Acme' }} />);
    expect(slot(container, 'logo-tile')).toHaveClass(
      'border',
      'border-border-decorative',
      'in-data-[surface-ink=on-image]:border-transparent',
    );
    // The wordmark is set in a type role, never a raw size.
    expect(slot(container, 'logo-tile')).toHaveClass('type-h3');
    expect(slot(container, 'logo-tile')!.className).not.toMatch(/text-md|font-bold/);
  });
});
