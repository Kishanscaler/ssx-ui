import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { Stepper, StepperDescription, StepperItem, StepperLabel } from './Stepper';

const STEPS = [
  { label: 'Personal details' },
  { label: 'Academic record' },
  { label: 'Aptitude test slot' },
  { label: 'Payment' },
];

describe('Stepper', () => {
  it('is an ordered list; flat steps derive status from currentStep (1-based)', () => {
    const { container } = render(<Stepper aria-label="Application" steps={STEPS} currentStep={3} />);
    const list = screen.getByRole('list', { name: 'Application' });
    expect(list.tagName).toBe('OL');
    expect(list).toHaveAttribute('data-slot', 'stepper');
    expect(list).toHaveAttribute('data-orientation', 'horizontal');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((i) => i.getAttribute('data-status'))).toEqual(['complete', 'complete', 'current', 'upcoming']);
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items.filter((i) => i.hasAttribute('aria-current'))).toHaveLength(1);
    for (const slot of ['stepper-item', 'stepper-marker', 'stepper-indicator', 'stepper-line', 'stepper-body', 'stepper-label']) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it('indicator: check for complete, counter for current/upcoming, exclamation for error', () => {
    render(
      <Stepper>
        <StepperItem status="complete" label="A" />
        <StepperItem status="current" label="B" />
        <StepperItem status="upcoming" label="C" />
        <StepperItem status="error" label="D" />
      </Stepper>,
    );
    const ind = (name: string) =>
      screen.getByText(name).closest('li')!.querySelector('[data-slot="stepper-indicator"]') as HTMLElement;
    expect(ind('A').querySelector('svg')).not.toBeNull();
    expect(ind('A')).toHaveAttribute('aria-hidden', 'true');
    expect(ind('B').querySelector('svg')).toBeNull();
    expect(ind('B').className).toContain('before:content-[counter(ssx-step)]');
    expect(ind('B').className).toContain('outline-2');
    expect(ind('C').className).toContain('border-border-strong');
    expect(ind('D').querySelector('svg')).not.toBeNull();
    expect(ind('D').className).toContain('bg-danger');
  });

  it('announces complete / error in words, overridable via statusLabel', () => {
    render(
      <Stepper>
        <StepperItem status="complete" label="Personal details" />
        <StepperItem status="error" label="Documents" />
        <StepperItem status="complete" label="Academic" description="Completed" statusLabel="" />
      </Stepper>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Personal details, Completed');
    expect(items[1]).toHaveTextContent('Documents, Needs attention');
    expect(items[2]!.querySelector('.sr-only')).toBeNull();
  });

  it('flat step status wins; currentStep past the end completes all; 0 starts none', () => {
    const { rerender } = render(
      <Stepper steps={[{ label: 'a' }, { label: 'b', status: 'error' }]} currentStep={1} />,
    );
    expect(screen.getAllByRole('listitem').map((i) => i.getAttribute('data-status'))).toEqual(['current', 'error']);
    rerender(<Stepper steps={STEPS} currentStep={9} />);
    expect(screen.getAllByRole('listitem').every((i) => i.getAttribute('data-status') === 'complete')).toBe(true);
    rerender(<Stepper steps={STEPS} currentStep={0} />);
    expect(screen.getAllByRole('listitem').every((i) => i.getAttribute('data-status') === 'upcoming')).toBe(true);
  });

  it('vertical, with description, meta and compound parts', () => {
    const { container } = render(
      <Stepper orientation="vertical">
        <StepperItem status="current" label="Interview Round" description="A 45-minute conversation." meta={<span>Fri 27 Mar</span>} />
        <StepperItem>
          <StepperLabel>Final Decision</StepperLabel>
          <StepperDescription>Released on a fixed date.</StepperDescription>
        </StepperItem>
      </Stepper>,
    );
    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
    expect(container.querySelector('[data-slot="stepper-meta"]')).toHaveTextContent('Fri 27 Mar');
    expect(screen.getByText('Released on a fixed date.')).toHaveAttribute('data-slot', 'stepper-description');
    expect(screen.getByText('Final Decision').closest('li')).toHaveAttribute('data-status', 'upcoming');
  });

  it('forwards refs and merges className last', () => {
    const ref = React.createRef<HTMLOListElement>();
    const itemRef = React.createRef<HTMLLIElement>();
    render(
      <Stepper ref={ref} className="gap-4">
        <StepperItem ref={itemRef} className="gap-6" label="x" />
      </Stepper>,
    );
    expect(ref.current!.className).toContain('gap-4');
    expect(itemRef.current!.className).toContain('gap-6');
    expect(itemRef.current!.className).not.toMatch(/(^|\s)gap-3(\s|$)/);
  });
});
