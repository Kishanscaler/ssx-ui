import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PhotoFrame, type PhotoFrameRatio } from './PhotoFrame';

const slot = (root: ParentNode, name: string) => root.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;
const slots = (root: ParentNode, name: string) =>
  Array.from(root.querySelectorAll(`[data-slot="${name}"]`)) as HTMLElement[];

describe('PhotoFrame', () => {
  it('renders the photo with its markers, lazily by default', () => {
    const { container } = render(<PhotoFrame src="/campus.webp" alt="The campus at dusk" position="50% 30%" />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-slot', 'photo-frame');
    expect(frame).toHaveAttribute('data-ratio', '4:3');
    expect(frame).toHaveClass('aspect-landscape', 'rounded-lg', 'overflow-hidden');
    expect(frame).not.toHaveAttribute('data-blur');
    expect(frame).not.toHaveAttribute('data-surface-ink');

    const media = slot(frame, 'photo-frame-media')!;
    expect(media).toHaveAttribute('data-part', 'photo');
    expect(media).toHaveClass('will-change-transform');

    const img = screen.getByRole('img', { name: 'The campus at dusk' });
    expect(img).toHaveAttribute('data-slot', 'photo-frame-image');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img.style.objectPosition).toBe('50% 30%');
    expect(slots(frame, 'photo-frame-blur')).toHaveLength(0);
    expect(slot(frame, 'photo-frame-scrim')).toBeNull();
    expect(slot(frame, 'photo-frame-placeholder')).toBeNull();
  });

  it('priority loads it eagerly at high fetch priority', () => {
    render(<PhotoFrame src="/hero.webp" alt="Hero" priority />);
    const img = screen.getByRole('img', { name: 'Hero' });
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img).not.toHaveAttribute('decoding');
  });

  it('blur="bottom" lays a soft then a deep copy, hidden from AT, under a scrim', () => {
    const { container } = render(<PhotoFrame src="/x.webp" srcSet="/x-800.webp 800w" sizes="50vw" blur="bottom" />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-blur', 'bottom');
    expect(frame).toHaveAttribute('data-scrim');
    expect(frame).toHaveAttribute('data-surface-ink', 'on-image');

    const layers = slots(frame, 'photo-frame-blur');
    expect(layers.map((l) => l.getAttribute('data-layer'))).toEqual(['soft', 'deep']);
    for (const layer of layers) {
      expect(layer).toHaveAttribute('aria-hidden', 'true');
      const copy = layer.querySelector('img')!;
      expect(copy).toHaveAttribute('alt', '');
      expect(copy).toHaveAttribute('src', '/x.webp');
      expect(copy).toHaveAttribute('srcset', '/x-800.webp 800w');
      expect(copy).toHaveAttribute('sizes', '50vw');
    }
    // The ramps come from `from` (0.4): soft 40% → 60%, deep 55% → 80%.
    expect(layers[0]!.style.getPropertyValue('--ssx-photo-mask-from')).toBe('40%');
    expect(layers[0]!.style.getPropertyValue('--ssx-photo-mask-to')).toBe('60%');
    expect(layers[1]!.style.getPropertyValue('--ssx-photo-mask-from')).toBe('55%');
    expect(layers[1]!.style.getPropertyValue('--ssx-photo-mask-to')).toBe('80%');
    expect(frame.style.getPropertyValue('--ssx-photo-from')).toBe('40%');
    expect(slot(frame, 'photo-frame-scrim')).toHaveClass('bg-surface-image-scrim');
    // Every layer bleeds past the frame alike, so the blur's rim is clipped.
    for (const img of frame.querySelectorAll('img')) {
      expect(img).toHaveClass('inset-[calc(var(--glass-blur)*-3)]');
      // Sized explicitly: a set width/height beats the right and bottom insets, so a negative
      // inset alone only shifts the image (it does not grow it).
      expect(img).toHaveClass('size-[calc(100%+var(--glass-blur)*6)]');
      expect(img).not.toHaveClass('size-full');
    }
  });

  it('blur="end" lays one copy; `from` moves it; the scrim can be switched off', () => {
    const { container } = render(<PhotoFrame src="/x.webp" blur="end" from={0.5} scrim={false} />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-blur', 'end');
    expect(frame).not.toHaveAttribute('data-scrim');
    expect(frame).not.toHaveAttribute('data-surface-ink');
    const layers = slots(frame, 'photo-frame-blur');
    expect(layers.map((l) => l.getAttribute('data-layer'))).toEqual(['end']);
    expect(layers[0]!.style.getPropertyValue('--ssx-photo-mask-from')).toBe('50%');
    expect(layers[0]!.style.getPropertyValue('--ssx-photo-mask-to')).toBe('75%');
    expect(slot(frame, 'photo-frame-scrim')).toBeNull();
  });

  it('a scrim alone declares on-image ink, with no blurred copies', () => {
    const { container } = render(<PhotoFrame src="/x.webp" scrim />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-surface-ink', 'on-image');
    expect(slots(frame, 'photo-frame-blur')).toHaveLength(0);
    expect(slot(frame, 'photo-frame-scrim')).not.toBeNull();
    expect(frame.querySelector('img')).toHaveClass('inset-0');
  });

  it.each([
    ['16:9', 'aspect-video'],
    ['4:3', 'aspect-landscape'],
    ['3:2', 'aspect-photo'],
    ['1:1', 'aspect-square'],
    ['9:16', 'aspect-portrait'],
    ['3:4', 'aspect-[calc(1/(var(--aspect-landscape)))]'],
    ['4:5', 'aspect-[var(--ssx-aspect-4-5,calc(1/(var(--aspect-landscape))))]'],
    ['fill', 'h-full'],
  ] as Array<[PhotoFrameRatio, string]>)('ratio %s → %s', (ratio, cls) => {
    const { container } = render(<PhotoFrame src="/x.webp" ratio={ratio} />);
    const frame = container.firstElementChild as HTMLElement;
    expect(frame).toHaveAttribute('data-ratio', ratio);
    expect(frame).toHaveClass(cls);
  });

  it('with no src shows the plate (on-image ink) or the sunken ground, and no image', () => {
    const plate = render(<PhotoFrame />).container.firstElementChild as HTMLElement;
    expect(plate).toHaveAttribute('data-placeholder', 'plate');
    expect(plate).toHaveAttribute('data-surface-ink', 'on-image');
    expect(slot(plate, 'photo-frame-placeholder')).toHaveClass(
      'bg-(--ssx-surface-fixed-dark,var(--surface-inverse))',
    );
    expect(plate.querySelector('img')).toBeNull();
    expect(slot(plate, 'photo-frame-media')).toBeNull();

    const sunken = render(<PhotoFrame placeholder="sunken" blur="bottom" />).container.firstElementChild as HTMLElement;
    expect(sunken).toHaveAttribute('data-placeholder', 'sunken');
    expect(slot(sunken, 'photo-frame-placeholder')).toHaveClass('bg-surface-sunken');
    // No photo, nothing to blur; the scrim still rises for the type.
    expect(sunken).not.toHaveAttribute('data-blur');
    expect(slot(sunken, 'photo-frame-scrim')).not.toBeNull();
  });

  it('renders children on top, after the layers, and forwards the ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <PhotoFrame ref={ref} src="/x.webp" className="max-w-panel-sm" style={{ order: 2 }}>
        <span>₹50L</span>
      </PhotoFrame>,
    );
    const frame = container.firstElementChild as HTMLElement;
    expect(ref.current).toBe(frame);
    expect(frame).toHaveClass('max-w-panel-sm');
    expect(frame.style.order).toBe('2');
    expect(frame.lastElementChild).toBe(screen.getByText('₹50L'));
    expect(slot(frame, 'photo-frame-media')).toHaveClass('z-below');
  });
});
