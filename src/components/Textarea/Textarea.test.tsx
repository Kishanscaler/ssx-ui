import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a bare <textarea> with the slot and size hooks', () => {
    const { container } = render(<Textarea size="lg" aria-label="Why SST?" />);
    const ta = screen.getByRole('textbox', { name: 'Why SST?' });
    expect(ta.tagName).toBe('TEXTAREA');
    expect(container.children).toHaveLength(1);
    expect(ta).toHaveAttribute('data-slot', 'textarea');
    expect(ta).toHaveAttribute('data-size', 'lg');
  });

  it('defaults to md and four rows', () => {
    render(<Textarea aria-label="Why SST?" />);
    const ta = screen.getByRole('textbox');
    expect(ta).toHaveAttribute('data-size', 'md');
    expect(ta).toHaveAttribute('rows', '4');
  });

  it('shares the Input recipe (one field language), minus the single-line height', () => {
    render(<Textarea aria-label="Why SST?" />);
    const cls = screen.getByRole('textbox').className.split(/\s+/);
    expect(cls).toContain('border-field-border');
    expect(cls).toContain('aria-invalid:border-danger');
    expect(cls).toContain('[&:read-only:not(:disabled)]:border-dashed');
    expect(cls).toContain('h-auto');
    expect(cls).not.toContain('h-control-md');
  });

  it('works uncontrolled and controlled', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Textarea aria-label="Note" defaultValue="Draft" onChange={onChange} />);
    const ta = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(ta.value).toBe('Draft');
    fireEvent.change(ta, { target: { value: 'Draft two' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<Textarea aria-label="Note" value="Fixed" onChange={onChange} />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Fixed');
  });

  it('reports invalidity through aria-invalid and does not cap input', () => {
    render(<Textarea aria-label="Feedback" aria-invalid />);
    const ta = screen.getByRole('textbox');
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    expect(ta).not.toHaveAttribute('maxlength');
  });

  it('keeps read-only distinct from disabled', () => {
    render(
      <>
        <Textarea aria-label="Locked draft" readOnly defaultValue="Autosaved" />
        <Textarea aria-label="Submitted" disabled defaultValue="Submitted" />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Locked draft' })).not.toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Locked draft' })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: 'Submitted' })).toBeDisabled();
  });

  it('autoResize opts into field-sizing: content', () => {
    render(<Textarea aria-label="Note" autoResize />);
    expect(screen.getByRole('textbox').className).toContain('field-sizing-content');
  });

  it('forwards the ref and native attributes', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Note" name="sop" rows={7} required />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toHaveAttribute('name', 'sop');
    expect(ref.current).toHaveAttribute('rows', '7');
    expect(ref.current).toBeRequired();
  });

  it('merges className last', () => {
    render(<Textarea aria-label="Note" className="min-h-40 px-4" />);
    const cls = screen.getByRole('textbox').className.split(/\s+/);
    expect(cls).toContain('min-h-40');
    expect(cls).not.toContain('min-h-24');
    expect(cls).toContain('px-4');
    expect(cls).not.toContain('px-3');
  });
});
