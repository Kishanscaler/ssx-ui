import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('is in the accessibility tree and drawn sr-only', () => {
    render(
      <button type="button">
        <svg aria-hidden="true" />
        <VisuallyHidden>Stop generating</VisuallyHidden>
      </button>,
    );
    const button = screen.getByRole('button', { name: 'Stop generating' });
    const hidden = button.querySelector('[data-slot="visually-hidden"]');
    expect(hidden?.tagName).toBe('SPAN');
    expect(hidden).toHaveClass('sr-only');
    expect(hidden).not.toHaveAttribute('aria-hidden');
  });

  it('asChild keeps the child element and adds the hiding', () => {
    render(
      <VisuallyHidden asChild>
        <h2 id="t">Conversation</h2>
      </VisuallyHidden>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Conversation' });
    expect(heading).toHaveAttribute('data-slot', 'visually-hidden');
    expect(heading).toHaveAttribute('id', 't');
    expect(heading).toHaveClass('sr-only');
  });

  it('forwards the ref, spreads props and puts className last', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(
      <VisuallyHidden ref={ref} id="x" className="not-sr-only">
        (opens in a new tab)
      </VisuallyHidden>,
    );
    expect(ref.current).toHaveAttribute('id', 'x');
    expect(ref.current).toHaveClass('not-sr-only');
    expect(ref.current).not.toHaveClass('sr-only');
  });

  it('focusable shows the content while it holds focus (skip link)', () => {
    render(
      <VisuallyHidden focusable>
        <a href="#chat">Skip to the conversation</a>
      </VisuallyHidden>,
    );
    const wrap = screen.getByRole('link').parentElement;
    expect(wrap).toHaveAttribute('data-focusable', '');
    expect(wrap).toHaveClass('sr-only', 'focus-within:not-sr-only');
  });
});
