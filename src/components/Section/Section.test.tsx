import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Section } from './Section';

describe('Section', () => {
  it('is a <section> with the default 64px rhythm, stepping down below sm', () => {
    const { container } = render(<Section />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('SECTION');
    expect(el).toHaveAttribute('data-slot', 'section');
    expect(el).toHaveAttribute('data-density', 'default');
    expect(el).toHaveClass('py-10', 'sm:py-16');
  });

  it('maps the three density recipes', () => {
    const { container, rerender } = render(<Section density="tight" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('py-6', 'sm:py-8');
    rerender(<Section density="roomy" />);
    expect(el).toHaveClass('py-12', 'sm:py-24');
    expect(el).toHaveAttribute('data-density', 'roomy');
  });

  it('never sets width, background or horizontal padding', () => {
    const { container } = render(<Section density="roomy" />);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).not.toMatch(/(^|\s)(px-|pl-|pr-|bg-|max-w-|w-)/);
  });

  it('becomes a named region with aria-labelledby', () => {
    render(
      <Section aria-labelledby="curriculum">
        <h2 id="curriculum">What the Batch of 2029 curriculum covers</h2>
      </Section>,
    );
    expect(screen.getByRole('region', { name: 'What the Batch of 2029 curriculum covers' })).toHaveAttribute(
      'data-slot',
      'section',
    );
  });

  it('renders another element with `as`, or the child with `asChild`', () => {
    const { container, rerender } = render(<Section as="div" />);
    expect((container.firstChild as HTMLElement).tagName).toBe('DIV');
    rerender(
      <Section asChild density="tight">
        <main>Round 2 applications</main>
      </Section>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-slot', 'section');
    expect(main).toHaveClass('py-6');
  });

  it('forwards the ref and lets className win', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Section ref={ref} className="py-0" />);
    expect(ref.current).toHaveClass('py-0');
    expect(ref.current).not.toHaveClass('py-10');
  });
});
