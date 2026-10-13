import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StatCard } from './StatCard';
import * as marketing from '../../marketing';

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
const FORBES = { name: 'Forbes', src: '/logos/forbes.svg' };

describe('StatCard', () => {
  let errors: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('renders every part with its markers, in reading order', () => {
    const { container } = render(
      <StatCard
        eyebrow="Internship placement"
        value="100%"
        label="Across cohorts 1 and 2"
        description="Every learner interns, three to six months."
        source="Forbes"
        sourceLogo={FORBES}
        sourceNote="2025 survey"
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('data-slot', 'stat-card');
    const parts: [string, string][] = [
      ['stat-card-eyebrow', 'eyebrow'],
      ['stat-card-value', 'figure'],
      ['stat-card-label', 'subline'],
      ['stat-card-description', 'description'],
      ['stat-card-source', 'logos'],
    ];
    for (const [name, part] of parts) {
      const el = slot(root, name);
      expect(el, name).not.toBeNull();
      expect(el).toHaveAttribute('data-part', part);
    }
    const order = Array.from(root.querySelectorAll('[data-part]')).map((el) => el.getAttribute('data-part'));
    expect(order).toEqual(['eyebrow', 'figure', 'subline', 'description', 'logos']);
  });

  it('omitted slots render nothing: no eyebrow, description or source row', () => {
    const { container } = render(<StatCard value="$1B+" label="raised by our mentors" />);
    const root = container.firstElementChild as HTMLElement;
    expect(slot(root, 'stat-card-eyebrow')).toBeNull();
    expect(slot(root, 'stat-card-description')).toBeNull();
    expect(slot(root, 'stat-card-source')).toBeNull();
    expect(root.children).toHaveLength(2);
  });

  it('an empty CMS string is an unset field: no eyebrow, description or source row', () => {
    const { container } = render(
      <StatCard value="$1B+" label="raised by our mentors" eyebrow="" description="" source="" sourceNote="" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(slot(root, 'stat-card-eyebrow')).toBeNull();
    expect(slot(root, 'stat-card-description')).toBeNull();
    expect(slot(root, 'stat-card-source')).toBeNull();
    expect(root.children).toHaveLength(2);
  });

  it('defaults: plain, md, default tone; the data attributes say so', () => {
    const { container } = render(<StatCard value="60%" label="x" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', 'plain');
    expect(root).toHaveAttribute('data-size', 'md');
    expect(root).toHaveAttribute('data-tone', 'default');
    expect(root).not.toHaveClass('border-t', 'bg-surface-sunken');
  });

  it.each([
    ['ruled', ['border-t', 'border-border-decorative', 'pt-4']],
    ['boxed', ['rounded-lg', 'not-in-data-[surface-ink=on-image]:bg-surface-sunken', 'not-in-data-[surface-ink=on-image]:p-5']],
  ] as const)('variant="%s" draws its shape', (variant, classes) => {
    const { container } = render(<StatCard value="3×" label="x" variant={variant} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-variant', variant);
    expect(root).toHaveClass(...classes);
  });

  it.each([
    ['sm', 'type-h2'],
    ['md', 'type-h1'],
    ['lg', 'type-billboard-sm'],
  ] as const)('size="%s" goes to the Figure (%s)', (size, role) => {
    const { container } = render(<StatCard value="₹19L" label="x" size={size} />);
    expect(container.firstElementChild).toHaveAttribute('data-size', size);
    const figure = slot(container, 'stat-card-value')!;
    expect(figure).toHaveAttribute('data-size', size);
    expect(figure).toHaveClass(role);
  });

  it('tone="brand" sets the figure in the accent', () => {
    const { container } = render(<StatCard value="₹10Cr+" label="x" tone="brand" />);
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'brand');
    const figure = slot(container, 'stat-card-value')!;
    expect(figure).toHaveAttribute('data-tone', 'brand');
    expect(figure.className).toContain('--ssx-content-accent');
  });

  it('the value copies as written: one element, its text the value', () => {
    const { container } = render(<StatCard value="₹1Cr+" label="ARR" />);
    const figure = slot(container, 'stat-card-value')!;
    expect(figure.tagName).toBe('P');
    expect(figure.textContent).toBe('₹1Cr+');
    expect(figure).not.toHaveAttribute('aria-label');
  });

  it('the label and description are Text, so they ink themselves on a photo', () => {
    const { container } = render(<StatCard value="1" label="L" description="D" />);
    const label = slot(container, 'stat-card-label')!;
    expect(label).toHaveAttribute('data-size', 'sm');
    expect(label).toHaveAttribute('data-tone', 'secondary');
    expect(label.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink-secondary');
    expect(slot(container, 'stat-card-description')!.className).toContain(
      'in-data-[surface-ink=on-image]:text-on-image-ink',
    );
  });

  it('the eyebrow is a paragraph in the brand ink (the on-image ink on a photo), out of the outline', () => {
    render(<StatCard eyebrow="Top roles" value="52%+" label="x" />);
    const eyebrow = screen.getByText('Top roles');
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow).toHaveClass('text-content-brand', 'in-data-[surface-ink=on-image]:text-on-image-ink');
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('source: the logo alone when the names match; a different source name is set beside it', () => {
    const { container, rerender } = render(<StatCard value="60%" label="x" source="Forbes" sourceLogo={FORBES} />);
    const row = () => slot(container, 'stat-card-source')!;
    expect(screen.getByRole('img', { name: 'Forbes' })).toBeInTheDocument();
    expect(slot(row(), 'logo-tile')).toHaveAttribute('data-fill', 'white');
    expect(row().textContent).toBe('');
    rerender(<StatCard value="60%" label="x" source="Forbes India, 2025" sourceLogo={FORBES} />);
    expect(row()).toHaveTextContent('Forbes India, 2025');
    rerender(<StatCard value="60%" label="x" source="PwC" />);
    expect(slot(row(), 'logo-tile')).toBeNull();
    expect(row()).toHaveTextContent('PwC');
    rerender(<StatCard value="60%" label="x" sourceNote="survey of 1,200 managers" />);
    expect(row()).toHaveTextContent('survey of 1,200 managers');
  });

  it.each(['div', 'li', 'article'] as const)('as="%s" sets the root element', (as) => {
    const { container } = render(
      as === 'li' ? (
        <ul>
          <StatCard as="li" value="1" label="x" />
        </ul>
      ) : (
        <StatCard as={as} value="1" label="x" />
      ),
    );
    expect(slot(container, 'stat-card')!.tagName).toBe(as.toUpperCase());
  });

  it('definition: a div of dt terms then dd definitions, shown in the same order', () => {
    const { container } = render(
      <dl>
        <StatCard definition eyebrow="E" value="₹19L" label="average CTC" description="D" source="PwC" />
      </dl>,
    );
    const root = slot(container, 'stat-card')!;
    expect(root.tagName).toBe('DIV');
    expect(Array.from(root.children).map((el) => el.tagName)).toEqual(['DT', 'DT', 'DD', 'DD', 'DD']);
    expect(slot(root, 'stat-card-value')!.tagName).toBe('DD');
    expect(slot(root, 'stat-card-label')!.closest('dt')).not.toBeNull();
    // Each part's row puts the label back under the figure.
    expect(slot(root, 'stat-card-label')!.closest('dt')).toHaveClass('row-start-3');
    expect(slot(root, 'stat-card-value')).toHaveClass('row-start-2');
  });

  it('lays its parts on five rows, one each, the source at the foot of the last', () => {
    const { container } = render(
      <StatCard eyebrow="E" value="₹19L" label="L" description="D" source="PwC" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('grid', 'grid-rows-[repeat(4,auto)_1fr]', 'gap-y-0');
    expect(slot(root, 'stat-card-eyebrow')).toHaveClass('row-start-1');
    expect(slot(root, 'stat-card-value')).toHaveClass('row-start-2');
    expect(slot(root, 'stat-card-label')).toHaveClass('row-start-3');
    expect(slot(root, 'stat-card-description')).toHaveClass('row-start-4');
    expect(slot(root, 'stat-card-source')).toHaveClass('row-start-5', 'self-end');
  });

  it('forwards its ref, className and attributes to the root', () => {
    const ref = React.createRef<HTMLElement>();
    const { container } = render(<StatCard ref={ref} value="1" label="x" className="extra" data-testid="s" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current).toHaveAttribute('data-testid', 's');
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders the same markup under data-brand="%s" data-theme="%s", setting neither', (brand, theme) => {
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        <StatCard eyebrow="E" value="₹50L" label="L" description="D" source="S" variant="boxed" tone="brand" />
      </div>,
    );
    const root = slot(container, 'stat-card')!;
    expect(root.querySelectorAll('[data-brand], [data-theme]')).toHaveLength(0);
    expect(root.querySelectorAll('[data-part]')).toHaveLength(5);
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.StatCard).toBe(StatCard);
    expect(typeof marketing.statCardVariants).toBe('function');
  });
});
