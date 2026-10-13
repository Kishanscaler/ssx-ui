import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { CarouselNav } from './CarouselNav';

const noop = () => {};

describe('CarouselNav', () => {
  it('renders its markers: dots between the arrows, the current one active', () => {
    const { container } = render(
      <CarouselNav count={4} active={1} itemName="mentor" onSelect={noop} onPrev={noop} onNext={noop} />,
    );
    const root = container.querySelector('[data-slot="carousel-nav"]')!;
    expect(root).toHaveAttribute('data-tone', 'light');
    expect(root).toHaveAttribute('data-shown');
    const arrows = root.querySelectorAll('[data-slot="carousel-nav-arrow"]');
    expect(Array.from(arrows).map((a) => a.getAttribute('data-direction'))).toEqual(['prev', 'next']);
    const dots = root.querySelectorAll('[data-slot="carousel-nav-dot"]');
    expect(dots).toHaveLength(4);
    expect(dots[1]).toHaveAttribute('data-active');
    expect(dots[1]).toHaveAttribute('aria-current', 'true');
    expect(dots[0]).not.toHaveAttribute('data-active');
    // Only the current dot carries a fill.
    expect(root.querySelectorAll('[data-slot="carousel-nav-fill"]')).toHaveLength(1);
    expect(dots[1]!.querySelector('[data-slot="carousel-nav-fill"]')).not.toBeNull();
  });

  it('names every control for the item', () => {
    render(<CarouselNav count={3} active={0} itemName="alumnus" onSelect={noop} onPrev={noop} onNext={noop} />);
    expect(screen.getByRole('group', { name: 'Choose an alumnus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'alumnus 2 of 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous alumnus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next alumnus' })).toBeInTheDocument();
  });

  it('selects a dot and steps with the arrows, which are aria-disabled at the ends', () => {
    const onSelect = vi.fn();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <CarouselNav count={3} active={0} itemName="slide" onSelect={onSelect} onPrev={onPrev} onNext={onNext} atStart />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'slide 3 of 3' }));
    expect(onSelect).toHaveBeenCalledWith(2);
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(prev).not.toBeDisabled(); // focus is not dropped at the end
    fireEvent.click(prev);
    expect(onPrev).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('fills by progress with a scaleX transform', () => {
    const { container } = render(<CarouselNav count={3} active={2} itemName="slide" onSelect={noop} progress={0.25} />);
    const fill = container.querySelector<HTMLElement>('[data-slot="carousel-nav-fill"]')!;
    expect(fill.style.transform).toBe('scaleX(0.25)');
    expect(fill).not.toHaveAttribute('data-timed');
  });

  it('fills on a timer: the keyframe, paused unless running, and onFillEnd on its animationend', () => {
    const onFillEnd = vi.fn();
    const { container, rerender } = render(
      <CarouselNav count={3} active={0} itemName="slide" onSelect={noop} interval={5000} onFillEnd={onFillEnd} />,
    );
    let fill = container.querySelector<HTMLElement>('[data-slot="carousel-nav-fill"]')!;
    expect(fill).toHaveAttribute('data-timed');
    expect(fill).toHaveAttribute('data-paused');
    expect(fill.className).toContain('animate-ssx-carousel-nav-fill');
    expect(fill.className).toContain('motion-reduce:animate-none');
    expect(fill.style.getPropertyValue('--ssx-carousel-nav-interval')).toBe('5000ms');

    rerender(
      <CarouselNav count={3} active={0} itemName="slide" onSelect={noop} interval={5000} running onFillEnd={onFillEnd} />,
    );
    fill = container.querySelector<HTMLElement>('[data-slot="carousel-nav-fill"]')!;
    expect(fill).not.toHaveAttribute('data-paused');
    fireEvent.animationEnd(fill);
    expect(onFillEnd).toHaveBeenCalledTimes(1);
  });

  it('with neither interval nor progress the current dot is simply full', () => {
    const { container } = render(<CarouselNav count={2} active={0} itemName="slide" onSelect={noop} />);
    const fill = container.querySelector<HTMLElement>('[data-slot="carousel-nav-fill"]')!;
    expect(fill.style.transform).toBe('');
    expect(fill).not.toHaveAttribute('data-timed');
  });

  it('renders nothing below two slides, and only arrows without dots', () => {
    const { container, rerender } = render(<CarouselNav count={1} active={0} itemName="slide" onSelect={noop} />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <CarouselNav count={3} active={0} itemName="slide" onSelect={noop} onPrev={noop} onNext={noop} dots={false} tone="dark" />,
    );
    expect(container.querySelector('[data-slot="carousel-nav-dots"]')).toBeNull();
    expect(container.querySelectorAll('[data-slot="carousel-nav-arrow"]')).toHaveLength(2);
    expect(container.querySelector('[data-slot="carousel-nav"]')).toHaveAttribute('data-tone', 'dark');
  });
});
