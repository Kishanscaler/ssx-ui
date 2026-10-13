import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Figure, splitFigure } from './Figure';

const units = (el: Element) => Array.from(el.querySelectorAll('[data-slot="figure-unit"]')).map((u) => u.textContent);

describe('splitFigure', () => {
  it.each([
    ['₹1Cr+', [['₹', true, true], ['1', false, false], ['Cr+', true, false]]],
    ['12,000+', [['12,000', false, false], ['+', true, false]]],
    ['$2M+', [['$', true, true], ['2', false, false], ['M+', true, false]]],
    ['60%', [['60', false, false], ['%', true, false]]],
    ['3×', [['3', false, false], ['×', true, false]]],
    ['1.5x', [['1.5', false, false], ['x', true, false]]],
    ['200K', [['200', false, false], ['K', true, false]]],
    ['1 in 3', [['1', false, false], [' in ', true, false], ['3', false, false]]],
    ['First', [['First', false, false]]],
  ] as const)('%s', (value, expected) => {
    expect(splitFigure(value).map((p) => [p.text, p.unit, p.lead])).toEqual(expected);
    expect(splitFigure(value).map((p) => p.text).join('')).toBe(value);
  });
});

describe('Figure', () => {
  it('keeps the value one text, with the unit glyphs as spans a step down', () => {
    render(<Figure value="₹1Cr+" />);
    const fig = screen.getByText((_, el) => el?.getAttribute('data-slot') === 'figure');
    expect(fig.tagName).toBe('P');
    expect(fig).toHaveTextContent(/^₹1Cr\+$/);
    expect(fig.textContent).toBe('₹1Cr+');
    expect(fig).not.toHaveAttribute('aria-label');
    expect(fig).toHaveAttribute('data-part', 'figure');
    expect(fig).toHaveAttribute('data-size', 'md');
    expect(fig).toHaveAttribute('data-tone', 'default');
    expect(fig).toHaveClass('type-h1', 'tabular-nums', 'text-content');
    expect(units(fig)).toEqual(['₹', 'Cr+']);
    const [lead, tail] = fig.querySelectorAll('[data-slot="figure-unit"]');
    expect(lead).toHaveAttribute('data-lead');
    expect(lead).toHaveClass('align-text-top', 'text-(length:--type-h3-size)', 'text-content-secondary');
    expect(tail).not.toHaveAttribute('data-lead');
    expect(tail).not.toHaveClass('align-text-top');
  });

  it.each([
    ['sm', 'type-h2', 'text-(length:--type-body-size)'],
    ['md', 'type-h1', 'text-(length:--type-h3-size)'],
    ['lg', 'type-billboard-sm', 'text-(length:--type-h1-size)'],
  ] as const)('size %s → %s, units %s', (size, role, unit) => {
    const { container } = render(<Figure value="60%" size={size} />);
    const fig = container.firstElementChild!;
    expect(fig).toHaveAttribute('data-size', size);
    expect(fig).toHaveClass(role);
    expect(fig.querySelector('[data-slot="figure-unit"]')).toHaveClass(unit);
  });

  it('brand tone sets it in the accent, units included', () => {
    const { container } = render(<Figure value="$1B+" tone="brand" />);
    const fig = container.firstElementChild!;
    expect(fig).toHaveAttribute('data-tone', 'brand');
    expect(fig).toHaveClass('text-(color:--ssx-content-accent,var(--content-brand))');
    for (const u of fig.querySelectorAll('[data-slot="figure-unit"]')) {
      expect(u).not.toHaveClass('text-content-secondary');
    }
  });

  it('units={false} sets the value as one run', () => {
    const { container } = render(<Figure value="₹19L" units={false} />);
    expect(container.firstElementChild!.textContent).toBe('₹19L');
    expect(units(container.firstElementChild!)).toEqual([]);
  });

  it('inks itself white on a photo', () => {
    const { container } = render(<Figure value="200K" />);
    const fig = container.firstElementChild!;
    expect(fig.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink');
    expect(fig.querySelector('[data-slot="figure-unit"]')!.className).toContain(
      'in-data-[surface-ink=on-image]:text-on-image-ink-secondary',
    );
  });

  it('renders as another element and forwards the ref', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <dl>
        <dt>Funding</dt>
        <Figure ref={ref} as="dd" value="₹50L" className="mt-1" />
      </dl>,
    );
    expect(ref.current?.tagName).toBe('DD');
    expect(ref.current).toHaveClass('mt-1');
  });
});
