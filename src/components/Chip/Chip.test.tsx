import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { Chip } from './Chip';

const Glyph = ({ name }: { name: string }) => <svg data-testid={name} aria-hidden="true" />;

describe('Chip', () => {
  it('is a toggle button with aria-pressed and the slot hook', () => {
    render(<Chip>Bengaluru</Chip>);
    const chip = screen.getByRole('button', { name: 'Bengaluru' });
    expect(chip).toHaveAttribute('data-slot', 'chip');
    expect(chip).toHaveAttribute('type', 'button');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).toHaveAttribute('data-state', 'off');
  });

  it('toggles uncontrolled on click and on Space / Enter (native button)', () => {
    const onSelectedChange = vi.fn();
    render(<Chip onSelectedChange={onSelectedChange}>Hyderabad</Chip>);
    const chip = screen.getByRole('button', { name: 'Hyderabad' });
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveAttribute('data-state', 'on');
    expect(onSelectedChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
  });

  it('controlled: follows `selected`, reports the request', () => {
    const onSelectedChange = vi.fn();
    const { rerender } = render(
      <Chip selected={false} onSelectedChange={onSelectedChange}>
        Remote cohort
      </Chip>,
    );
    const chip = screen.getByRole('button');
    fireEvent.click(chip);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    rerender(
      <Chip selected onSelectedChange={onSelectedChange}>
        Remote cohort
      </Chip>,
    );
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('swaps icon → selectedIcon with the state', () => {
    render(
      <Chip icon={<Glyph name="regular" />} selectedIcon={<Glyph name="fill" />}>
        Bengaluru
      </Chip>,
    );
    expect(screen.getByTestId('regular')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByTestId('regular')).toBeNull();
    expect(screen.getByTestId('fill')).toBeInTheDocument();
  });

  it('renders an avatar before the label', () => {
    render(<Chip avatar={<span data-slot="avatar">AK</span>}>Aarav Krishnan</Chip>);
    expect(screen.getByRole('button').firstElementChild).toHaveAttribute('data-slot', 'avatar');
  });

  it('disabled cannot be toggled', () => {
    const onSelectedChange = vi.fn();
    render(
      <Chip disabled onSelectedChange={onSelectedChange}>
        Live class
      </Chip>,
    );
    const chip = screen.getByRole('button');
    expect(chip).toBeDisabled();
    fireEvent.click(chip);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('removable: a static span, only the ✕ is a button, named after the value', () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Cohort 7 · Bengaluru</Chip>);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    const x = screen.getByRole('button', { name: 'Remove Cohort 7 · Bengaluru' });
    expect(x).toHaveAttribute('data-slot', 'chip-remove');
    expect(x).toHaveAttribute('type', 'button');
    const chip = x.closest('[data-slot="chip"]') as HTMLElement;
    expect(chip.tagName).toBe('SPAN');
    expect(chip).not.toHaveAttribute('aria-pressed');
    expect(chip).toHaveAttribute('data-removable');
    fireEvent.click(x);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('removable: removeLabel overrides the name; selected is only the look', () => {
    render(
      <Chip onRemove={() => {}} removeLabel="Remove filter: Scholarship applicants" selected>
        Scholarship applicants
      </Chip>,
    );
    const x = screen.getByRole('button', { name: 'Remove filter: Scholarship applicants' });
    const chip = x.closest('[data-slot="chip"]') as HTMLElement;
    expect(chip).toHaveAttribute('data-state', 'on');
  });

  it('removable + disabled disables the ✕', () => {
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} disabled>
        Week 6
      </Chip>,
    );
    const x = screen.getByRole('button');
    expect(x).toBeDisabled();
    expect(x.closest('[data-slot="chip"]')).toHaveAttribute('data-disabled');
  });

  it('forwards the ref (button, or the span when removable)', () => {
    const ref = React.createRef<HTMLElement>();
    const { rerender } = render(<Chip ref={ref}>Quiz</Chip>);
    expect(ref.current?.tagName).toBe('BUTTON');
    rerender(
      <Chip ref={ref} onRemove={() => {}}>
        Quiz
      </Chip>,
    );
    expect(ref.current?.tagName).toBe('SPAN');
  });

  it('merges className last', () => {
    render(<Chip className="px-8 custom">Quiz</Chip>);
    const chip = screen.getByRole('button');
    expect(chip).toHaveClass('px-8', 'custom');
    expect(chip).not.toHaveClass('px-3');
  });

  it('spreads props onto the root (Storyblok attributes)', () => {
    render(
      <Chip data-blok-uid="42" id="c1">
        Quiz
      </Chip>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-blok-uid', '42');
    expect(screen.getByRole('button')).toHaveAttribute('id', 'c1');
  });
});
