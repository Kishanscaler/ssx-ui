import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProfilePlate } from './ProfilePlate';
import * as marketing from '../../marketing';

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const LOGOS = [
  { name: 'Google', src: '/logos/google.svg' },
  { name: 'Meta', src: '/logos/meta.svg' },
];

describe('ProfilePlate', () => {
  let errors: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('is a light GlassPlate with its markers on every part', () => {
    const { container } = render(
      <ProfilePlate
        name="Anupam Mittal"
        credential="Founder, Shaadi.com"
        avatar="/people/anupam.webp"
        logos={LOGOS}
        logosPrefix="Ex-"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-slot', 'profile-plate');
    expect(root).toHaveAttribute('data-tone', 'light');
    expect(root).toHaveAttribute('data-surface-ink', 'on-image');
    expect(root).toHaveClass('bg-glass-on-image', 'rounded-lg', 'px-5', 'py-4', 'max-w-full');
    expect(slot(root, 'profile-plate-avatar')).toHaveAttribute('alt', '');
    expect(slot(root, 'profile-plate-avatar')).toHaveClass('size-8', 'rounded-full');
    expect(slot(root, 'profile-plate-name')).toHaveAttribute('data-part', 'title');
    expect(slot(root, 'profile-plate-credential')).toHaveAttribute('data-part', 'subline');
    expect(slot(root, 'profile-plate-logos')).toHaveAttribute('data-part', 'logos');
  });

  it('name and credential are Text: white and on-image secondary on the plate', () => {
    render(<ProfilePlate name="Ankur Warikoo" credential="Founder, nearbuy" />);
    const name = screen.getByText('Ankur Warikoo');
    expect(name).toHaveClass('font-semibold');
    expect(name.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink');
    const cred = screen.getByText('Founder, nearbuy');
    expect(cred).toHaveAttribute('data-size', 'sm');
    expect(cred.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink-secondary');
  });

  it('omitted slots render nothing: no avatar, credential or logo row', () => {
    const { container } = render(<ProfilePlate name="Kiran Shah" />);
    const root = container.firstElementChild as HTMLElement;
    expect(slot(root, 'profile-plate-avatar')).toBeNull();
    expect(slot(root, 'profile-plate-credential')).toBeNull();
    expect(slot(root, 'profile-plate-logos')).toBeNull();
    // An empty list is no list.
    const { container: empty } = render(<ProfilePlate name="K" logos={[]} logosPrefix="Ex-" />);
    expect(slot(empty, 'profile-plate-logos')).toBeNull();
  });

  it('an empty CMS string is an unset field: no credential, prefix or avatar', () => {
    const { container } = render(<ProfilePlate name="Kiran Shah" credential="" logosPrefix="" avatar="" logos={LOGOS} />);
    const root = container.firstElementChild as HTMLElement;
    expect(slot(root, 'profile-plate-credential')).toBeNull();
    expect(slot(root, 'profile-plate-prefix')).toBeNull();
    expect(slot(root, 'profile-plate-avatar')).toBeNull();
    expect(slot(root, 'profile-plate-logos')).not.toBeNull();
  });

  it.each(['div', 'aside', 'figure'] as const)('as="%s" sets the element', (as) => {
    const { container } = render(<ProfilePlate as={as} name="N" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe(as.toUpperCase());
    expect(root).toHaveAttribute('data-slot', 'profile-plate');
  });

  it('logos are glass tiles, each named; the prefix comes first and is read with them', () => {
    const { container } = render(<ProfilePlate name="N" logos={LOGOS} logosPrefix="Ex-" />);
    const row = slot(container, 'profile-plate-logos')!;
    const tiles = row.querySelectorAll('[data-slot="logo-tile"]');
    expect(tiles).toHaveLength(2);
    tiles.forEach((t) => {
      expect(t).toHaveAttribute('data-fill', 'glass');
      expect(t).toHaveAttribute('data-size', 'sm');
    });
    expect(screen.getByRole('img', { name: 'Google' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Meta' })).toBeInTheDocument();
    const prefix = slot(row, 'profile-plate-prefix')!;
    expect(prefix).toHaveTextContent('Ex-');
    expect(prefix).not.toHaveAttribute('aria-hidden');
    expect(row.firstElementChild).toBe(prefix);
  });

  it('no prefix without logosPrefix', () => {
    const { container } = render(<ProfilePlate name="N" logos={LOGOS} />);
    expect(slot(container, 'profile-plate-prefix')).toBeNull();
  });

  it('tone="dark" is the fixed dark plate', () => {
    const { container } = render(<ProfilePlate name="N" tone="dark" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-tone', 'dark');
    expect(root).toHaveClass('bg-(--ssx-plate-on-photo,var(--surface-image-scrim))');
  });

  it('forwards its ref, className and attributes to the root', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<ProfilePlate ref={ref} name="N" className="mt-8" data-testid="p" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('mt-8');
    expect(ref.current).toHaveAttribute('data-testid', 'p');
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders under data-brand="%s" data-theme="%s", setting neither', (brand, theme) => {
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        <ProfilePlate name="N" credential="C" avatar="/a.webp" logos={LOGOS} logosPrefix="Ex-" />
      </div>,
    );
    const root = slot(container, 'profile-plate')!;
    expect(root.querySelectorAll('[data-brand], [data-theme]')).toHaveLength(0);
    expect(root.querySelectorAll('[data-part]')).toHaveLength(3);
  });

  it('is internal: not exported from the marketing entry (only Breaker composes it)', () => {
    expect(marketing).not.toHaveProperty('ProfilePlate');
  });
});
