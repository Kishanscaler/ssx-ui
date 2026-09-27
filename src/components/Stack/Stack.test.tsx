import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Stack } from './Stack';

describe('Stack', () => {
  it('is a column with the default 16px gap', () => {
    const { container } = render(
      <Stack>
        <span>Week 5 · Graphs</span>
        <span>Week 6 · Shortest paths</span>
      </Stack>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('data-slot', 'stack');
    expect(el).toHaveAttribute('data-direction', 'vertical');
    expect(el).toHaveAttribute('data-gap', '4');
    expect(el).toHaveAttribute('data-align', 'stretch');
    expect(el).toHaveAttribute('data-justify', 'start');
    expect(el).not.toHaveAttribute('data-wrap');
    expect(el).toHaveClass('flex', 'flex-col', 'gap-4', 'items-stretch', 'min-w-0');
  });

  it('maps every rung of the gap ladder, as a string or a number', () => {
    const rungs = ['2', '4', '6', '8', '12'] as const;
    rungs.forEach((gap) => {
      const { container, unmount } = render(<Stack gap={gap} />);
      expect(container.firstChild).toHaveClass(`gap-${gap}`);
      expect(container.firstChild).toHaveAttribute('data-gap', gap);
      unmount();
    });
    const { container } = render(<Stack gap={8} />);
    expect(container.firstChild).toHaveAttribute('data-gap', '8');
    expect(container.firstChild).toHaveClass('gap-8');
  });

  it('a horizontal stack centres on the cross axis unless align says otherwise', () => {
    const { container, rerender } = render(<Stack direction="horizontal" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('flex-row', 'items-center');
    expect(el).toHaveAttribute('data-align', 'center');
    rerender(<Stack direction="horizontal" align="start" />);
    expect(el).toHaveClass('items-start');
    expect(el).not.toHaveClass('items-center');
    rerender(<Stack direction="horizontal" align="end" />);
    expect(el).toHaveClass('items-end');
  });

  it('wrap and justify="between" are modifiers on the root', () => {
    const { container } = render(<Stack direction="horizontal" wrap justify="between" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('flex-wrap', 'justify-between');
    expect(el).toHaveAttribute('data-wrap', '');
    expect(el).toHaveAttribute('data-justify', 'between');
  });

  it('renders a semantic element with `as`', () => {
    render(
      <Stack as="ul" gap="2" aria-label="Term 3 modules">
        <li>Graphs</li>
      </Stack>,
    );
    const list = screen.getByRole('list', { name: 'Term 3 modules' });
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('data-slot', 'stack');
  });

  it('merges onto its child with `asChild`, which wins over `as`', () => {
    render(
      <Stack asChild as="nav" gap="6">
        <form aria-label="Apply">
          <button type="submit">Start application</button>
        </form>
      </Stack>,
    );
    const form = screen.getByRole('form', { name: 'Apply' });
    expect(form.tagName).toBe('FORM');
    expect(form).toHaveAttribute('data-slot', 'stack');
    expect(form).toHaveClass('flex', 'flex-col', 'gap-6');
  });

  it('forwards the ref, spreads props and lets className win', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<Stack ref={ref} gap="4" className="gap-3" id="rhythm" />);
    expect(ref.current).toBe(container.firstChild);
    expect(ref.current).toHaveAttribute('id', 'rhythm');
    expect(ref.current).toHaveClass('gap-3');
    expect(ref.current).not.toHaveClass('gap-4');
  });
});
