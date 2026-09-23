import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Input } from './Input';

/**
 * CONTRACT tests. Each one asserts a promise the component makes to a consumer
 * — the shadcn `data-slot` hook, the pass-through of native attributes, the
 * read-only/disabled distinction — and a snapshot would pass for all of them
 * and tell us nothing.
 */
describe('Input', () => {
  it('carries the shadcn styling hooks', () => {
    render(<Input size="lg" aria-label="Work email" />);
    const input = screen.getByLabelText('Work email');
    expect(input).toHaveAttribute('data-slot', 'input');
    expect(input).toHaveAttribute('data-size', 'lg');
  });

  it('renders a bare <input> with no wrapper, so it can go anywhere', () => {
    const { container } = render(<Input aria-label="Work email" />);
    expect(container.firstElementChild?.tagName).toBe('INPUT');
    expect(container.children).toHaveLength(1);
  });

  it('passes `type` through untouched — the keyboard and the autofill depend on it', () => {
    render(<Input type="email" aria-label="Work email" />);
    expect(screen.getByLabelText('Work email')).toHaveAttribute('type', 'email');
  });

  it('adds no type of its own when none is given, leaving the browser default', () => {
    // Unlike Button, which forces type="button" because the HTML default costs
    // forms. An <input> with no type is text, which is the right default.
    render(<Input aria-label="Work email" />);
    expect(screen.getByLabelText('Work email')).not.toHaveAttribute('type');
  });

  it('reports invalidity through aria-invalid rather than a private prop', () => {
    render(<Input aria-invalid aria-label="Work email" />);
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('keeps read-only distinct from disabled: still reachable, still readable', () => {
    render(<Input readOnly defaultValue="SSX-2026-0418" aria-label="Application ID" />);
    const input = screen.getByLabelText('Application ID');
    expect(input).toHaveAttribute('readonly');
    // A read-only field is NOT disabled — it stays in the tab order, so the
    // value can be selected and copied.
    expect(input).not.toBeDisabled();
  });

  it('does not repaint a disabled field with the read-only look', () => {
    // Per CSS Selectors a disabled input also matches `:read-only`, so the
    // sunken fill and dashed border are written as
    // `:read-only:not(:disabled)`. If someone simplifies that to the bare
    // `read-only:` variant, this assertion is what fails.
    render(<Input disabled aria-label="Work email" />);
    const className = screen.getByLabelText('Work email').className;
    expect(className).toContain('[&:read-only:not(:disabled)]:bg-surface-sunken');
    expect(className.split(/\s+/)).not.toContain('read-only:bg-surface-sunken');
    expect(className.split(/\s+/)).not.toContain('read-only:border-dashed');
  });

  it('forwards arbitrary native attributes', () => {
    render(
      <Input
        aria-label="Work email"
        name="email"
        required
        maxLength={120}
        autoComplete="email"
        placeholder="you@scaler.com"
      />,
    );
    const input = screen.getByLabelText('Work email');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('maxlength', '120');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@scaler.com');
  });

  it('merges a caller className rather than dropping the recipe', () => {
    render(<Input className="max-w-xs" aria-label="Work email" />);
    const className = screen.getByLabelText('Work email').className;
    expect(className).toContain('max-w-xs');
    expect(className).toContain('bg-field');
  });

  it('defaults to the md control height', () => {
    render(<Input aria-label="Work email" />);
    const input = screen.getByLabelText('Work email');
    expect(input).toHaveAttribute('data-size', 'md');
    expect(input.className).toContain('h-control-md');
  });
});
