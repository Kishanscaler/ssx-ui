import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MetadataDescription, MetadataItem, MetadataList, MetadataTerm } from './MetadataList';

describe('MetadataList', () => {
  it('is a real <dl> of dt/dd pairs in div rows', () => {
    const { container } = render(
      <MetadataList
        items={[
          { term: 'Application ID', value: 'SST-2029-0416' },
          { term: 'Cohort', value: 'Batch of 2029 · Cohort 7' },
        ]}
      />,
    );
    const dl = container.firstElementChild as HTMLElement;
    expect(dl.tagName).toBe('DL');
    expect(dl).toHaveAttribute('data-slot', 'metadata-list');
    expect(dl).toHaveAttribute('data-layout', 'inline');
    const rows = dl.querySelectorAll(':scope > div[data-slot="metadata-item"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.children[0]!.tagName).toBe('DT');
    expect(rows[0]!.children[0]!).toHaveAttribute('data-slot', 'metadata-term');
    expect(rows[0]!.children[1]!.tagName).toBe('DD');
    expect(rows[0]!.children[1]!).toHaveAttribute('data-slot', 'metadata-description');
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual([
      'SST-2029-0416',
      'Batch of 2029 · Cohort 7',
    ]);
  });

  it('an empty flat value is never a blank cell', () => {
    render(
      <MetadataList
        emptyValue="Not assigned yet"
        items={[{ term: 'Interview panel', value: '' }, { term: 'Offer letter' }, { term: 'Scholarship', value: 'Assessment pending', tone: 'muted' }]}
      />,
    );
    const dds = screen.getAllByRole('definition');
    expect(dds[0]).toHaveTextContent('Not assigned yet');
    expect(dds[0]).toHaveAttribute('data-tone', 'muted');
    expect(dds[0]!.className).toContain('text-content-secondary');
    expect(dds[1]).toHaveTextContent('Not assigned yet');
    expect(dds[2]).toHaveAttribute('data-tone', 'muted');
    render(<MetadataList items={[{ term: 'x', value: null }]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('layout="stacked", and the term min-width only applies inline', () => {
    const { container } = render(<MetadataList layout="stacked" items={[{ term: 'Campus', value: 'Bengaluru' }]} />);
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'stacked');
    const row = container.querySelector('[data-slot="metadata-item"]') as HTMLElement;
    expect(row.className).toContain('group-data-[layout=stacked]/meta:flex-col');
    expect(screen.getByText('Campus').className).toContain('group-data-[layout=inline]/meta:min-w-[140px]');
  });

  it('MetadataItem: term + children as the value, or compound parts', () => {
    render(
      <MetadataList>
        <MetadataItem term="Submitted">
          <time dateTime="2026-03-04T23:42">4 Mar 2026, 11:42 PM</time>
        </MetadataItem>
        <MetadataItem>
          <MetadataTerm>Status</MetadataTerm>
          <MetadataDescription tone="muted">In review</MetadataDescription>
        </MetadataItem>
      </MetadataList>,
    );
    const dds = screen.getAllByRole('definition');
    expect(dds[0]!.querySelector('time')).not.toBeNull();
    expect(dds[1]).toHaveAttribute('data-tone', 'muted');
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Submitted', 'Status']);
  });

  it('forwards refs and merges className last', () => {
    const ref = React.createRef<HTMLDListElement>();
    const termRef = React.createRef<HTMLElement>();
    render(
      <MetadataList ref={ref} className="gap-5" aria-label="Student record">
        <MetadataItem>
          <MetadataTerm ref={termRef} className="text-xs">
            Campus
          </MetadataTerm>
          <MetadataDescription>Bengaluru</MetadataDescription>
        </MetadataItem>
      </MetadataList>,
    );
    expect(ref.current).toHaveAttribute('aria-label', 'Student record');
    expect(ref.current!.className).toContain('gap-5');
    expect(ref.current!.className).not.toContain('gap-3');
    expect(termRef.current!.className).toContain('text-xs');
    expect(termRef.current!.className).not.toContain('text-sm');
  });
});
