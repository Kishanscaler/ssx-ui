import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Icon } from './Icon';
import { Button } from '../Button';

const Glyph = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function Glyph(props, ref) {
  return (
    <svg ref={ref} viewBox="0 0 256 256" data-testid="glyph" {...props}>
      <path d="M0 0h256v256H0z" />
    </svg>
  );
});

describe('Icon', () => {
  it('renders no element of its own: the classes land on the child svg', () => {
    const { container } = render(
      <Icon size="sm">
        <Glyph />
      </Icon>,
    );
    const svg = screen.getByTestId('glyph');
    expect(container.firstChild).toBe(svg);
    expect(svg).toHaveAttribute('data-slot', 'icon');
    expect(svg).toHaveAttribute('data-size', 'sm');
    expect(svg).toHaveAttribute('data-tone', 'inherit');
    expect(svg).toHaveClass('size-icon-sm', 'fill-current');
  });

  it('is decorative by default', () => {
    render(
      <Icon>
        <Glyph />
      </Icon>,
    );
    const svg = screen.getByTestId('glyph');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('becomes a named image when given a label', () => {
    render(
      <Icon label="Verified SST alumnus">
        <Glyph />
      </Icon>,
    );
    const img = screen.getByRole('img', { name: 'Verified SST alumnus' });
    expect(img).not.toHaveAttribute('aria-hidden');
  });

  it('leaves sizing to the parent when no size is given (no size-* class)', () => {
    render(
      <Icon>
        <Glyph />
      </Icon>,
    );
    const svg = screen.getByTestId('glyph');
    expect(svg).not.toHaveAttribute('data-size');
    expect(svg.getAttribute('class')).not.toMatch(/\bsize-/);
    expect(svg).toHaveClass('h-icon-lg', 'w-icon-lg');
  });

  it('maps tone and muted to token classes', () => {
    render(
      <Icon tone="danger" muted>
        <Glyph />
      </Icon>,
    );
    const svg = screen.getByTestId('glyph');
    expect(svg).toHaveAttribute('data-tone', 'danger');
    expect(svg).toHaveAttribute('data-muted');
    expect(svg).toHaveClass('text-danger-icon', 'opacity-65');
  });

  it('forwards the ref to the svg', () => {
    const ref = React.createRef<SVGSVGElement>();
    render(
      <Icon ref={ref}>
        <Glyph />
      </Icon>,
    );
    expect(ref.current).toBe(screen.getByTestId('glyph'));
  });

  it('merges className last, and keeps the child’s own classes', () => {
    render(
      <Icon size="sm" className="size-icon-xl">
        <Glyph className="custom" />
      </Icon>,
    );
    const svg = screen.getByTestId('glyph');
    expect(svg).toHaveClass('size-icon-xl', 'custom');
    expect(svg).not.toHaveClass('size-icon-sm');
  });

  it('stays hidden inside an icon-only button, which carries the name', () => {
    render(
      <Button size="icon-md" aria-label="Download transcript">
        <Icon>
          <Glyph />
        </Icon>
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName('Download transcript');
    expect(screen.getByTestId('glyph')).toHaveAttribute('aria-hidden', 'true');
  });
});
