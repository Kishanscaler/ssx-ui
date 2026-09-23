import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Divider } from './Divider';

describe('Divider', () => {
  it('is decorative by default: skipped by assistive tech', () => {
    const { container } = render(<Divider />);
    const el = container.firstChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('role', 'none');
    expect(el).toHaveAttribute('data-slot', 'divider');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('decorative={false} is a semantic <hr>', () => {
    render(<Divider decorative={false} />);
    const hr = screen.getByRole('separator');
    expect(hr.tagName).toBe('HR');
    expect(hr).not.toHaveAttribute('aria-orientation');
  });

  it('vertical stretches and reports its orientation when semantic', () => {
    render(<Divider decorative={false} orientation="vertical" />);
    const hr = screen.getByRole('separator');
    expect(hr).toHaveAttribute('aria-orientation', 'vertical');
    expect(hr).toHaveAttribute('data-orientation', 'vertical');
    expect(hr).toHaveClass('self-stretch', 'w-px');
  });

  it('with children it is a labelled row whose words are read', () => {
    const { container } = render(<Divider>or continue with</Divider>);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', 'label');
    expect(root).not.toHaveAttribute('role');
    expect(screen.getByText('or continue with')).toHaveAttribute('data-slot', 'divider-label');
    const rules = container.querySelectorAll('[data-slot="divider-rule"]');
    expect(rules).toHaveLength(2);
    rules.forEach((r) => expect(r).toHaveAttribute('aria-hidden', 'true'));
  });

  it('forwards the ref and merges className last', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<Divider ref={ref} className="my-8" />);
    expect(ref.current).toBe(container.firstChild);
    expect(ref.current).toHaveClass('my-8');
    expect(ref.current).not.toHaveClass('my-4');
  });
});
