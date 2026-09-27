import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Container, ContainerBleed } from './Container';

describe('Container', () => {
  it('centres, caps at the container token and holds the page gutter', () => {
    const { container } = render(<Container />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('data-slot', 'container');
    expect(el).toHaveAttribute('data-width', 'default');
    expect(el).toHaveClass('mx-auto', 'w-full', 'px-gutter', 'max-w-(--size-container-max)');
  });

  it('maps narrow and wide', () => {
    const { container, rerender } = render(<Container width="narrow" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('max-w-[68ch]');
    rerender(<Container width="wide" />);
    expect(el).toHaveClass('max-w-[99rem]');
    expect(el).not.toHaveClass('max-w-[68ch]');
  });

  it('never paints and has no vertical padding', () => {
    const { container } = render(<Container />);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).not.toMatch(/(^|\s)(bg-|py-|pt-|pb-|border)/);
  });

  it('renders a landmark with `as`, or the child with `asChild`', () => {
    const { rerender } = render(<Container as="main">Admissions</Container>);
    expect(screen.getByRole('main')).toHaveAttribute('data-slot', 'container');
    rerender(
      <Container asChild width="narrow">
        <article aria-label="Fee policy">…</article>
      </Container>,
    );
    expect(screen.getByRole('article', { name: 'Fee policy' })).toHaveClass('max-w-[68ch]');
  });

  it('forwards the ref and lets className win', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Container ref={ref} className="px-0" />);
    expect(ref.current).toHaveClass('px-0');
    expect(ref.current).not.toHaveClass('px-gutter');
  });
});

describe('ContainerBleed', () => {
  it('escapes to the viewport width with negative inline margins', () => {
    const { container } = render(<ContainerBleed />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('data-slot', 'container-bleed');
    expect(el).toHaveClass('mx-[calc(50%-50vw)]', 'max-w-none');
  });

  it('asChild puts the bleed on the child', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <ContainerBleed asChild ref={ref}>
        <figure aria-label="Campus panorama" />
      </ContainerBleed>,
    );
    const fig = screen.getByRole('figure', { name: 'Campus panorama' });
    expect(fig).toHaveAttribute('data-slot', 'container-bleed');
    expect(ref.current).toBe(fig);
  });
});
