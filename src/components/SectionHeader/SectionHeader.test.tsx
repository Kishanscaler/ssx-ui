import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SectionHeader } from './SectionHeader';
import * as marketing from '../../marketing';

const slot = (root: ParentNode, name: string) => root.querySelector<HTMLElement>(`[data-slot="${name}"]`);

describe('SectionHeader', () => {
  it('renders the markers: data-slot, data-part and the transitional data-enter on the same elements', () => {
    const { container } = render(
      <SectionHeader
        eyebrow="Alumni"
        title="Already in the roles"
        description="Our earlier cohorts."
        aside={<button type="button">Next</button>}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-slot', 'section-header');
    expect(root).toHaveAttribute('data-part', 'header');
    expect(root).toHaveAttribute('data-enter', 'header');
    expect(slot(root, 'section-header-copy')).not.toBeNull();

    const parts: [string, string][] = [
      ['section-header-eyebrow', 'eyebrow'],
      ['section-header-title', 'headline'],
      ['section-header-description', 'sub'],
      ['section-header-aside', 'controls'],
    ];
    for (const [name, part] of parts) {
      const el = slot(root, name);
      expect(el, name).not.toBeNull();
      expect(el).toHaveAttribute('data-part', part);
      expect(el).toHaveAttribute('data-enter', part);
    }
    // Every data-enter element is also a data-part element (one set of nodes).
    const enter = Array.from(root.querySelectorAll('[data-enter]')).concat(root);
    for (const el of enter) expect(el.getAttribute('data-part')).toBe(el.getAttribute('data-enter'));
  });

  it('omitted slots render nothing: no eyebrow, no description, no aside', () => {
    const { container } = render(<SectionHeader title="Just a title" />);
    const root = container.firstElementChild as HTMLElement;
    expect(slot(root, 'section-header-eyebrow')).toBeNull();
    expect(slot(root, 'section-header-description')).toBeNull();
    expect(slot(root, 'section-header-aside')).toBeNull();
    expect(slot(root, 'section-header-title')).toHaveTextContent('Just a title');
  });

  it('the eyebrow is a paragraph in the brand ink, the on-image ink on a photo, out of the outline', () => {
    const { container } = render(<SectionHeader eyebrow="Placements" title="Hired" />);
    const eyebrow = slot(container, 'section-header-eyebrow')!;
    expect(eyebrow.tagName).toBe('P');
    expect(eyebrow.className).toContain('text-content-brand');
    expect(eyebrow.className).toContain('in-data-[surface-ink=on-image]:text-on-image-ink');
    // Heading's own on-image eyebrow ink (secondary) is replaced, not stacked.
    expect(eyebrow.className).not.toContain('text-on-image-ink-secondary');
    expect(eyebrow.className).not.toContain('text-content-secondary');
    expect(screen.queryAllByRole('heading')).toHaveLength(1);
  });

  it('titleAccent wraps the phrase and leaves the text content intact', () => {
    const { container } = render(<SectionHeader title="10+ startups incubated here" titleAccent="10+ startups" />);
    const title = slot(container, 'section-header-title')!;
    const accent = slot(title, 'section-header-accent')!;
    expect(accent.tagName).toBe('SPAN');
    expect(accent).toHaveTextContent('10+ startups');
    expect(accent.className).toContain('--ssx-content-accent');
    expect(title.textContent).toBe('10+ startups incubated here');
  });

  it('a titleAccent that is not in the title renders the title unchanged', () => {
    const { container } = render(<SectionHeader title="Campus life" titleAccent="startups" />);
    const title = slot(container, 'section-header-title')!;
    expect(slot(title, 'section-header-accent')).toBeNull();
    expect(title.innerHTML).toBe('Campus life');
  });

  it('"\\n" splits the title into line blocks, read with a space between them', () => {
    const { container } = render(
      <SectionHeader
        title={"Students at SSB didn't just build careers.\nThey built companies."}
        titleAccent="companies."
      />,
    );
    const title = slot(container, 'section-header-title')!;
    const lines = title.querySelectorAll('[data-slot="section-header-line"]');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent("Students at SSB didn't just build careers.");
    expect(lines[1]).toHaveTextContent('They built companies.');
    expect(lines[0]!.className).toContain('block');
    // The accent lands in the line that holds it.
    expect(slot(lines[1]!, 'section-header-accent')).toHaveTextContent('companies.');
    expect(title.textContent).toBe("Students at SSB didn't just build careers. They built companies.");
  });

  it('titleId lands on the heading', () => {
    render(<SectionHeader title="Beyond placements" titleId="beyond-title" />);
    expect(screen.getByRole('heading', { name: 'Beyond placements' })).toHaveAttribute('id', 'beyond-title');
  });

  it.each(['h1', 'h2', 'h3'] as const)('titleAs="%s" controls the element', (as) => {
    render(<SectionHeader title="Network with industry leaders" titleAs={as} />);
    expect(screen.getByRole('heading').tagName).toBe(as.toUpperCase());
  });

  it('titleAs defaults to h2 at the display size; titleSize="1" is type-h1', () => {
    const { rerender, container } = render(<SectionHeader title="Section" />);
    let title = slot(container, 'section-header-title')!;
    expect(title.tagName).toBe('H2');
    expect(title).toHaveAttribute('data-size', 'display');
    expect(container.firstElementChild).toHaveAttribute('data-title-size', 'display');
    rerender(<SectionHeader title="Sub-section" titleAs="h3" titleSize="1" />);
    title = slot(container, 'section-header-title')!;
    expect(title).toHaveAttribute('data-size', '1');
    expect(title.className).toContain('type-h1');
  });

  it.each(['end', 'title', 'below'] as const)('asideAt="%s" sets data-aside-at', (asideAt) => {
    const { container } = render(
      <SectionHeader title="Placements" aside={<a href="#report">Report</a>} asideAt={asideAt} />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-aside-at', asideAt);
  });

  it('asideAt defaults to end', () => {
    const { container } = render(<SectionHeader title="Placements" />);
    expect(container.firstElementChild).toHaveAttribute('data-aside-at', 'end');
  });

  it('asideAt="title" lays the copy out as a grid and puts the aside in the title\'s row', () => {
    const withEyebrow = render(
      <SectionHeader eyebrow="Placements" title="Hired" asideAt="title" aside={<a href="#r">Report</a>} />,
    );
    const root = withEyebrow.container.firstElementChild as HTMLElement;
    expect(root.className).toContain('grid');
    expect(slot(root, 'section-header-copy')!.className).toContain('contents');
    expect(slot(root, 'section-header-aside')!.className).toContain('sm:row-start-2');
    withEyebrow.unmount();

    const { container } = render(<SectionHeader title="Hired" asideAt="title" aside={<a href="#r">Report</a>} />);
    expect(slot(container, 'section-header-aside')!.className).toContain('sm:row-start-1');
  });

  it('align="center" takes the aside under the copy and says so', () => {
    const { container } = render(
      <SectionHeader title="FAQ" align="center" asideAt="title" aside={<a href="#all">All</a>} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-align', 'center');
    expect(root).toHaveAttribute('data-aside-at', 'below');
    expect(root.className).toContain('text-center');
  });

  it.each([
    ['md', 'mb-10'],
    ['sm', 'mb-6'],
  ] as const)('spacing="%s" sets %s', (spacing, cls) => {
    const { container } = render(<SectionHeader title="Gap" spacing={spacing} />);
    expect((container.firstElementChild as HTMLElement).className).toContain(cls);
  });

  it.each([
    ['lg', 'type-body-lg'],
    ['md', 'type-body'],
  ] as const)('descriptionSize="%s" is %s, secondary, measure-capped', (size, role) => {
    const { container } = render(<SectionHeader title="T" description="Line" descriptionSize={size} />);
    const desc = slot(container, 'section-header-description')!;
    expect(desc).toHaveAttribute('data-size', size);
    expect(desc).toHaveAttribute('data-tone', 'secondary');
    expect(desc.className).toContain(role);
    expect(desc.className).toContain('max-w-measure');
  });

  it('forwards its ref, className and attributes to the root', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <SectionHeader ref={ref} title="T" className="extra" data-testid="hdr" aria-describedby="x" />,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('extra');
    expect(ref.current).toHaveAttribute('data-testid', 'hdr');
    // `title` is the heading's text, never the tooltip attribute.
    expect(ref.current).not.toHaveAttribute('title');
  });

  it.each([
    ['sst', 'light'],
    ['sst', 'dark'],
    ['ssb', 'light'],
    ['ssb', 'dark'],
  ] as const)('renders the same markup under data-brand="%s" data-theme="%s", setting neither itself', (brand, theme) => {
    const { container } = render(
      <div data-brand={brand} data-theme={theme}>
        <SectionHeader eyebrow="E" title="T" titleAccent="T" description="D" aside={<span>A</span>} />
      </div>,
    );
    const root = slot(container, 'section-header')!;
    expect(root).not.toHaveAttribute('data-brand');
    expect(root).not.toHaveAttribute('data-theme');
    expect(root.querySelectorAll('[data-brand], [data-theme]')).toHaveLength(0);
    expect(root).toHaveAttribute('data-part', 'header');
    expect(root.querySelectorAll('[data-part]')).toHaveLength(4);
  });

  it('inside an on-image region the title and sub-line keep their own on-image inks', () => {
    const { container } = render(
      <div data-surface-ink="on-image">
        <SectionHeader eyebrow="Why SSB" title="The MBA" description="Line" />
      </div>,
    );
    expect(slot(container, 'section-header-title')!.className).toContain(
      'in-data-[surface-ink=on-image]:text-on-image-ink',
    );
    expect(slot(container, 'section-header-description')!.className).toContain(
      'in-data-[surface-ink=on-image]:text-on-image-ink-secondary',
    );
  });

  it('is exported from the marketing entry', () => {
    expect(marketing.SectionHeader).toBe(SectionHeader);
    expect(typeof marketing.sectionHeaderVariants).toBe('function');
  });
});
