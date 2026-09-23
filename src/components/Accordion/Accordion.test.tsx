import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './Accordion';

function Faq(props: React.ComponentProps<typeof Accordion>) {
  return (
    <Accordion {...props}>
      <AccordionItem value="fees">
        <AccordionTrigger>What does it cost?</AccordionTrigger>
        <AccordionContent>Rs 5,50,000 per year.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="isa">
        <AccordionTrigger>Is there a deferred plan?</AccordionTrigger>
        <AccordionContent>Yes.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="closed" disabled>
        <AccordionTrigger>Intake closed</AccordionTrigger>
        <AccordionContent>Hidden.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const trigger = (name: string | RegExp) => screen.getByRole('button', { name });

describe('Accordion', () => {
  it('is a list of headings, each holding a button', () => {
    render(<Faq />);
    const heading = screen.getByRole('heading', { level: 3, name: 'What does it cost?' });
    expect(heading).toHaveAttribute('data-slot', 'accordion-header');
    expect(heading.firstElementChild).toBe(trigger('What does it cost?'));
  });

  it('opens a panel labelled by its header; the chevron is aria-hidden', () => {
    const { container } = render(<Faq defaultValue={['fees']} />);
    const t = trigger('What does it cost?');
    expect(t).toHaveAttribute('aria-expanded', 'true');
    expect(t).toHaveAttribute('data-state', 'open');
    const region = screen.getByRole('region', { name: 'What does it cost?' });
    expect(region).toHaveAttribute('data-slot', 'accordion-content');
    expect(region).toHaveTextContent('Rs 5,50,000');
    expect(t.getAttribute('aria-controls')).toBe(region.id);
    const chevron = t.querySelector('[data-slot="accordion-chevron"]');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('[data-slot="accordion"]')).toHaveAttribute('data-type', 'multiple');
  });

  it('multiple (default): items toggle independently', () => {
    render(<Faq />);
    fireEvent.click(trigger('What does it cost?'));
    fireEvent.click(trigger('Is there a deferred plan?'));
    expect(trigger('What does it cost?')).toHaveAttribute('aria-expanded', 'true');
    expect(trigger('Is there a deferred plan?')).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger('What does it cost?'));
    expect(trigger('What does it cost?')).toHaveAttribute('aria-expanded', 'false');
  });

  it('single: one open at a time, and collapsible by default', () => {
    render(<Faq type="single" defaultValue="fees" />);
    fireEvent.click(trigger('Is there a deferred plan?'));
    expect(trigger('Is there a deferred plan?')).toHaveAttribute('aria-expanded', 'true');
    expect(trigger('What does it cost?')).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger('Is there a deferred plan?'));
    expect(trigger('Is there a deferred plan?')).toHaveAttribute('aria-expanded', 'false');
  });

  it('single, not collapsible: the open item stays open', () => {
    render(<Faq type="single" collapsible={false} defaultValue="fees" />);
    fireEvent.click(trigger('What does it cost?'));
    expect(trigger('What does it cost?')).toHaveAttribute('aria-expanded', 'true');
  });

  it('a disabled item cannot be toggled', () => {
    render(<Faq />);
    const t = trigger('Intake closed');
    expect(t).toBeDisabled();
    fireEvent.click(t);
    expect(t).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves between headers with the arrow keys, Home and End', () => {
    render(<Faq />);
    const first = trigger('What does it cost?');
    const second = trigger('Is there a deferred plan?');
    act(() => first.focus());
    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(second).toHaveFocus();
    // The disabled third item is skipped, so ArrowDown wraps to the first.
    fireEvent.keyDown(second, { key: 'ArrowDown' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'End' });
    expect(second).toHaveFocus();
    fireEvent.keyDown(second, { key: 'Home' });
    expect(first).toHaveFocus();
  });

  it('is controlled, reporting a string for single and string[] for multiple', () => {
    const onSingle = vi.fn();
    const { unmount } = render(<Faq type="single" value="fees" onValueChange={onSingle} />);
    fireEvent.click(trigger('Is there a deferred plan?'));
    expect(onSingle).toHaveBeenCalledWith('isa');
    expect(trigger('What does it cost?')).toHaveAttribute('aria-expanded', 'true');
    unmount();

    const onMulti = vi.fn();
    render(<Faq value={['fees']} onValueChange={onMulti} />);
    fireEvent.click(trigger('Is there a deferred plan?'));
    expect(onMulti).toHaveBeenCalledWith(['fees', 'isa']);
  });

  it('renders the flat items form with a chosen heading level', () => {
    render(
      <Accordion
        headingLevel="h4"
        defaultValue="refund"
        items={[
          { title: 'Can I withdraw?', content: 'Yes, before the start date.', value: 'refund' },
          { title: 'Borderline NSET?', content: 'A second reader.', disabled: true },
        ]}
      />,
    );
    expect(screen.getByRole('heading', { level: 4, name: 'Can I withdraw?' })).toBeInTheDocument();
    expect(trigger('Can I withdraw?')).toHaveAttribute('aria-expanded', 'true');
    expect(trigger('Borderline NSET?')).toBeDisabled();
  });

  it('forwards refs, merges className and spreads props onto the root', () => {
    const root = React.createRef<HTMLDivElement>();
    const item = React.createRef<HTMLDivElement>();
    const btn = React.createRef<HTMLButtonElement>();
    const content = React.createRef<HTMLDivElement>();
    render(
      <Accordion ref={root} className="rounded-none" data-blok-uid="x1" defaultValue={['a']}>
        <AccordionItem ref={item} value="a" className="border-t-2">
          <AccordionTrigger ref={btn} className="p-6">
            A
          </AccordionTrigger>
          <AccordionContent ref={content}>body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(root.current).toHaveAttribute('data-slot', 'accordion');
    expect(root.current).toHaveAttribute('data-blok-uid', 'x1');
    expect(root.current).toHaveClass('rounded-none');
    expect(root.current).not.toHaveClass('rounded-lg');
    expect(item.current).toHaveAttribute('data-slot', 'accordion-item');
    expect(btn.current).toHaveClass('p-6');
    expect(btn.current).not.toHaveClass('p-4');
    expect(content.current).toHaveAttribute('data-state', 'open');
  });

  it('animates height only with motion allowed', () => {
    render(<Faq defaultValue={['fees']} />);
    const cls = screen.getByRole('region').className;
    expect(cls).toContain('data-[state=open]:animate-ssx-accordion-down');
    expect(cls).toContain('motion-reduce:animate-none');
  });
});
