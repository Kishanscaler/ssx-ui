import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AspectRatio, AspectRatioFill, type AspectRatioRatio } from './AspectRatio';

describe('AspectRatio', () => {
  it('reserves a 16:9 sunken box by default', () => {
    const { container } = render(<AspectRatio />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-slot', 'aspect-ratio');
    expect(el).toHaveAttribute('data-ratio', '16:9');
    expect(el).toHaveClass('aspect-video', 'relative', 'overflow-hidden', 'bg-surface-sunken', 'rounded-lg');
  });

  it('maps all six ratios and no others', () => {
    const map: Record<AspectRatioRatio, string> = {
      '16:9': 'aspect-video',
      '4:3': 'aspect-landscape',
      '1:1': 'aspect-square',
      '3:2': 'aspect-photo',
      '21:9': 'aspect-cinema',
      '9:16': 'aspect-portrait',
    };
    (Object.keys(map) as AspectRatioRatio[]).forEach((ratio) => {
      const { container, unmount } = render(<AspectRatio ratio={ratio} />);
      expect(container.firstChild).toHaveClass(map[ratio]);
      expect(container.firstChild).toHaveAttribute('data-ratio', ratio);
      unmount();
    });
  });

  it('a direct <img> fills the box and covers', () => {
    const { container } = render(
      <AspectRatio ratio="3:2">
        <img src="/convocation.jpg" alt="Convocation, Batch of 2028" />
      </AspectRatio>,
    );
    expect(screen.getByAltText('Convocation, Batch of 2028')).toBeInTheDocument();
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).toContain('[&>img]:absolute');
    expect(cls).toContain('[&>img]:object-cover');
    expect(cls).toContain('[&>video]:object-cover');
    expect(cls).toContain('[&>iframe]:size-full');
  });

  it('AspectRatioFill stretches over the box', () => {
    render(
      <AspectRatio ratio="4:3">
        <AspectRatioFill>Transcoding…</AspectRatioFill>
      </AspectRatio>,
    );
    const fill = screen.getByText('Transcoding…');
    expect(fill).toHaveAttribute('data-slot', 'aspect-ratio-fill');
    expect(fill).toHaveClass('absolute', 'inset-0', 'grid');
  });

  it('asChild makes a thumbnail link the box', () => {
    render(
      <AspectRatio asChild ratio="1:1">
        <a href="/mentors/ritika-bansal">Ritika Bansal</a>
      </AspectRatio>,
    );
    const link = screen.getByRole('link', { name: 'Ritika Bansal' });
    expect(link).toHaveAttribute('data-slot', 'aspect-ratio');
    expect(link).toHaveClass('aspect-square', 'block');
  });

  it('forwards refs and lets className win', () => {
    const ref = React.createRef<HTMLElement>();
    const fillRef = React.createRef<HTMLDivElement>();
    render(
      <AspectRatio ref={ref} as="li" className="rounded-none">
        <AspectRatioFill ref={fillRef} />
      </AspectRatio>,
    );
    expect(ref.current?.tagName).toBe('LI');
    expect(ref.current).toHaveClass('rounded-none');
    expect(ref.current).not.toHaveClass('rounded-lg');
    expect(fillRef.current).toHaveAttribute('data-slot', 'aspect-ratio-fill');
  });
});
