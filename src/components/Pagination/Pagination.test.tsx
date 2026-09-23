import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { Pagination, paginationRange } from './Pagination';

const btn = (name: string) => screen.getByRole('button', { name });

describe('paginationRange', () => {
  it('keeps a constant slot count once the count exceeds it', () => {
    expect(paginationRange(1, 42)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 42]);
    expect(paginationRange(18, 128)).toEqual([1, 'start-ellipsis', 17, 18, 19, 'end-ellipsis', 128]);
    expect(paginationRange(42, 42)).toEqual([1, 'start-ellipsis', 38, 39, 40, 41, 42]);
    for (let p = 1; p <= 42; p += 1) expect(paginationRange(p, 42)).toHaveLength(7);
  });

  it('shows every page when they fit, and clamps odd input', () => {
    expect(paginationRange(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(1, 2)).toEqual([1, 2]);
    expect(paginationRange(99, 3)).toEqual([1, 2, 3]);
    expect(paginationRange(1, 0)).toEqual([1]);
  });

  it('honours sibling and boundary counts', () => {
    expect(paginationRange(10, 20, 2, 2)).toEqual([1, 2, 'start-ellipsis', 8, 9, 10, 11, 12, 'end-ellipsis', 19, 20]);
    expect(paginationRange(10, 20, 0, 1)).toEqual([1, 'start-ellipsis', 10, 'end-ellipsis', 20]);
  });
});

describe('Pagination', () => {
  it('is a named navigation landmark of page buttons with full names', () => {
    render(<Pagination count={128} defaultPage={18} aria-label="Applicant pages" />);
    const nav = screen.getByRole('navigation', { name: 'Applicant pages' });
    expect(nav).toHaveAttribute('data-slot', 'pagination');
    expect(nav).toHaveAttribute('data-variant', 'default');
    expect(within(nav).getByRole('list')).toHaveAttribute('data-slot', 'pagination-list');
    const current = btn('Page 18, current page');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('data-slot', 'pagination-page');
    expect(current).toHaveAttribute('type', 'button');
    expect(btn('Page 17')).not.toHaveAttribute('aria-current');
    expect(btn('Page 128')).toHaveTextContent('128');
    expect(btn('Previous page')).toHaveAttribute('data-slot', 'pagination-previous');
    expect(btn('Next page')).toHaveAttribute('data-slot', 'pagination-next');
    // The ellipses are hidden from assistive tech.
    const ellipses = nav.querySelectorAll('[data-slot=pagination-ellipsis]');
    expect(ellipses).toHaveLength(2);
    ellipses.forEach((el) => expect(el).toHaveAttribute('aria-hidden', 'true'));
  });

  it('defaults the landmark name to "Pagination" and renders with no props', () => {
    render(<Pagination />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(btn('Page 1, current page')).toBeInTheDocument();
    expect(btn('Previous page')).toHaveAttribute('aria-disabled', 'true');
    expect(btn('Next page')).toHaveAttribute('aria-disabled', 'true');
  });

  it('pages uncontrolled with prev, next and numbers', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={42} onPageChange={onPageChange} />);
    fireEvent.click(btn('Next page'));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(btn('Page 2, current page')).toHaveAttribute('aria-current', 'page');
    fireEvent.click(btn('Page 42'));
    expect(onPageChange).toHaveBeenLastCalledWith(42);
    expect(btn('Next page')).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(btn('Previous page'));
    expect(onPageChange).toHaveBeenLastCalledWith(41);
    // Clicking the current page is not a change.
    onPageChange.mockClear();
    fireEvent.click(btn('Page 41, current page'));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('prev at the first page is aria-disabled, keeps focus and does nothing', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} defaultPage={2} onPageChange={onPageChange} />);
    const prev = btn('Previous page');
    prev.focus();
    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(prev).not.toBeDisabled();
    expect(prev).toHaveFocus();
    onPageChange.mockClear();
    fireEvent.click(prev);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps the clicked page button mounted, so keyboard focus stays on it', () => {
    render(<Pagination count={42} />);
    const four = btn('Page 4');
    four.focus();
    fireEvent.click(four);
    expect(btn('Page 4, current page')).toBe(four);
    expect(four).toHaveFocus();
  });

  it('is controlled by page + onPageChange', () => {
    function Controlled() {
      const [page, setPage] = React.useState(3);
      return (
        <>
          <Pagination count={10} page={page} onPageChange={setPage} />
          <output>{page}</output>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(btn('Next page'));
    expect(screen.getByRole('status')).toHaveTextContent('4');
    expect(btn('Page 4, current page')).toBeInTheDocument();
  });

  it('a controlled page without a handler does not move', () => {
    render(<Pagination count={10} page={3} />);
    fireEvent.click(btn('Next page'));
    expect(btn('Page 3, current page')).toBeInTheDocument();
  });

  it('renders links from hrefTemplate; disabled ends lose their href', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={7} defaultPage={7} hrefTemplate="#receipts-{page}" onPageChange={onPageChange} />);
    const current = screen.getByRole('link', { name: 'Page 7, current page' });
    expect(current).toHaveAttribute('href', '#receipts-7');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Previous page' })).toHaveAttribute('href', '#receipts-6');
    const next = screen.getByRole('link', { name: 'Next page' });
    expect(next).not.toHaveAttribute('href');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('link', { name: 'Page 1' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('getHref and linkAs render the caller’s link component', () => {
    const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function RouterLink(props, ref) {
        return <a ref={ref} data-router="" {...props} />;
      },
    );
    render(<Pagination count={3} getHref={(p) => `#p${p}`} linkAs={RouterLink} />);
    const two = screen.getByRole('link', { name: 'Page 2' });
    expect(two).toHaveAttribute('href', '#p2');
    expect(two).toHaveAttribute('data-router');
  });

  it('compact: prev / live readout / next, no numbers', () => {
    render(<Pagination count={42} defaultPage={3} variant="compact" aria-label="Graded submissions pages, compact" />);
    const nav = screen.getByRole('navigation', { name: 'Graded submissions pages, compact' });
    expect(nav).toHaveAttribute('data-variant', 'compact');
    const readout = nav.querySelector('[data-slot=pagination-readout]');
    expect(readout).toHaveTextContent('Page 3 of 42');
    expect(readout).toHaveAttribute('aria-live', 'polite');
    expect(within(nav).getAllByRole('button')).toHaveLength(2);
    fireEvent.click(btn('Next page'));
    expect(readout).toHaveTextContent('Page 4 of 42');
  });

  it('labels are replaceable (i18n)', () => {
    render(
      <Pagination
        count={3}
        variant="default"
        previousLabel="पिछला पृष्ठ"
        nextLabel="अगला पृष्ठ"
        pageLabel="पृष्ठ {page}"
        currentPageLabel="पृष्ठ {page}, वर्तमान"
      />,
    );
    expect(btn('पिछला पृष्ठ')).toBeInTheDocument();
    expect(btn('पृष्ठ 1, वर्तमान')).toBeInTheDocument();
    expect(btn('पृष्ठ 2')).toBeInTheDocument();
  });

  it('disabled disables every control', () => {
    const onPageChange = vi.fn();
    render(<Pagination count={5} defaultPage={3} disabled onPageChange={onPageChange} />);
    screen.getAllByRole('button').forEach((b) => expect(b).toHaveAttribute('aria-disabled', 'true'));
    fireEvent.click(btn('Page 4'));
    expect(onPageChange).not.toHaveBeenCalled();
    expect(screen.getByRole('navigation')).toHaveAttribute('data-disabled', 'true');
  });

  it('clamps an out-of-range page', () => {
    render(<Pagination count={5} defaultPage={99} />);
    expect(btn('Page 5, current page')).toBeInTheDocument();
  });

  it('forwards the ref, merges className and spreads props', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Pagination ref={ref} count={3} className="mt-8" id="pager" data-testid="p" />);
    const nav = screen.getByTestId('p');
    expect(ref.current).toBe(nav);
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('mt-8');
    expect(nav).toHaveAttribute('id', 'pager');
  });
});
