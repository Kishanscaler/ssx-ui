import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import { IconButton } from '../IconButton';
import { SearchInput } from '../SearchInput';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl';
import { MenuItem } from '../Menu';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarOverflow,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarToggle,
} from './Toolbar';

const B = () => <svg aria-hidden="true" />;

function Notes(props: Partial<React.ComponentProps<typeof Toolbar>> & { search?: boolean }) {
  const { search, ...rest } = props;
  return (
    <Toolbar aria-label="Lecture note formatting" {...rest}>
      {search ? <SearchInput aria-label="Search notes" /> : null}
      <ToolbarGroup aria-label="Text style">
        <ToolbarToggle aria-label="Bold" defaultPressed>
          <B />
        </ToolbarToggle>
        <ToolbarToggle aria-label="Italic">
          <B />
        </ToolbarToggle>
      </ToolbarGroup>
      <ToolbarSeparator />
      <IconButton variant="tertiary" size="sm" aria-label="Insert an image">
        <B />
      </IconButton>
      <IconButton variant="tertiary" size="sm" aria-label="Undo" disabled>
        <B />
      </IconButton>
      <SegmentedControl aria-label="Note view" defaultValue="write">
        <SegmentedControlItem value="write">Write</SegmentedControlItem>
        <SegmentedControlItem value="preview">Preview</SegmentedControlItem>
      </SegmentedControl>
      <ToolbarSpacer />
      <IconButton variant="tertiary" size="sm" aria-label="More note actions">
        <B />
      </IconButton>
    </Toolbar>
  );
}

const btn = (name: string) => screen.getByRole('button', { name });
const key = (k: string) => fireEvent.keyDown(document.activeElement as Element, { key: k });

describe('Toolbar', () => {
  it('is a labelled toolbar of groups, a separator and a spacer', () => {
    render(<Notes />);
    const toolbar = screen.getByRole('toolbar', { name: 'Lecture note formatting' });
    expect(toolbar).toHaveAttribute('data-slot', 'toolbar');
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('group', { name: 'Text style' })).toHaveAttribute('data-slot', 'toolbar-group');
    expect(toolbar.querySelector('[data-slot="toolbar-separator"]')).toHaveAttribute('data-orientation', 'vertical');
    expect(toolbar.querySelector('[data-slot="toolbar-spacer"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('ToolbarToggle is a pressed/unpressed button', () => {
    render(<Notes />);
    const bold = btn('Bold');
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(bold).toHaveAttribute('data-slot', 'toolbar-toggle');
    fireEvent.click(bold);
    expect(bold).toHaveAttribute('aria-pressed', 'false');
  });

  it('is one tab stop with roving focus; arrows skip disabled and treat a composite as one stop', async () => {
    render(<Notes />);
    const plain = ['Bold', 'Italic', 'Insert an image', 'More note actions'];
    expect(plain.filter((n) => btn(n).tabIndex === 0)).toEqual(['Bold']);
    act(() => btn('Bold').focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Italic'));
    expect(btn('Italic')).toHaveAttribute('tabindex', '0');
    expect(btn('Bold')).toHaveAttribute('tabindex', '-1');
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Insert an image'));
    key('ArrowRight'); // Undo is disabled: straight to the segmented control
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Write' }));
    // Inside the composite, the radio group keeps its own arrows (Radix moves
    // focus on the next tick).
    key('ArrowRight');
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Preview' }));
    // At the composite's last item the arrow continues along the toolbar.
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('More note actions'));
    key('ArrowLeft');
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(screen.getByRole('radio', { name: 'Preview' })).toHaveFocus();
    key('End');
    act(() => btn('More note actions').focus());
    key('ArrowRight'); // loops
    expect(document.activeElement).toBe(btn('Bold'));
    key('ArrowLeft');
    expect(document.activeElement).toBe(btn('More note actions'));
    key('Home');
    expect(document.activeElement).toBe(btn('Bold'));
  });

  it('leaves the caret keys to a text field', () => {
    render(<Notes search />);
    const field = screen.getByRole('searchbox', { name: 'Search notes' });
    act(() => field.focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(field);
    key('Home');
    expect(document.activeElement).toBe(field);
  });

  it('vertical orientation uses ↑ / ↓; loop={false} stops at the ends', () => {
    render(<Notes orientation="vertical" loop={false} />);
    act(() => btn('Bold').focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Bold'));
    key('ArrowDown');
    expect(document.activeElement).toBe(btn('Italic'));
    key('ArrowUp');
    key('ArrowUp');
    expect(document.activeElement).toBe(btn('Bold'));
  });

  it('forwards refs and className', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Toolbar ref={ref} aria-label="View" className="p-1" />);
    expect(ref.current).toHaveClass('p-1');
    expect(ref.current).not.toHaveClass('p-2');
  });
});

describe('Toolbar wrapping', () => {
  it('with a spacer, the leading controls wrap in their own box and ⋯ holds the end', () => {
    render(<Notes />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('data-split', 'true');
    expect(toolbar).toHaveClass('data-[split]:flex-nowrap');
    const main = toolbar.querySelector('[data-slot="toolbar-main"]') as HTMLElement;
    const end = toolbar.querySelector('[data-slot="toolbar-end"]') as HTMLElement;
    expect(main).toHaveClass('flex-wrap', 'min-w-0');
    expect(main).toContainElement(btn('Bold'));
    expect(end).toContainElement(btn('More note actions'));
    expect(end).toHaveClass('shrink-0');
  });

  it('arrow keys still run across the split, into the trailing ⋯', () => {
    render(<Notes />);
    act(() => btn('Bold').focus());
    key('End');
    expect(btn('More note actions')).toHaveFocus();
    key('Home');
    expect(btn('Bold')).toHaveFocus();
  });

  it('does not split a vertical toolbar or one without a spacer', () => {
    render(<Notes orientation="vertical" />);
    expect(screen.getByRole('toolbar')).not.toHaveAttribute('data-split');
    expect(screen.getByRole('toolbar').querySelector('[data-slot="toolbar-main"]')).toBeNull();
  });

  it('hides a separator that starts a wrapped line, and only that one', () => {
    const rect = (top: number, left: number) =>
      ({ top, bottom: top + 32, left, right: left + 32, width: 32, height: 32, x: left, y: top, toJSON() {} }) as DOMRect;
    const original = Element.prototype.getBoundingClientRect;
    // Everything on line one, except what follows the separator, which wrapped
    // to line two; the separator itself sits at the start of line two.
    Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
      if (this.getAttribute('data-slot') === 'toolbar-separator') return rect(40, 0);
      if (this.getAttribute('aria-label') === 'Insert an image') return rect(40, 8);
      return rect(0, 0);
    };
    try {
      render(<Notes />);
      const sep = screen.getByRole('toolbar').querySelector('[data-slot="toolbar-separator"]') as HTMLElement;
      expect(sep).toHaveAttribute('data-line-edge');
      expect(sep).toHaveClass('data-[line-edge]:invisible');
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
    // All on one line: shown.
    Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return rect(0, 0);
    };
    try {
      const { container } = render(<Notes />);
      expect(container.querySelector('[data-slot="toolbar-separator"]')).not.toHaveAttribute('data-line-edge');
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
  });
});

/* ---- overflow="menu" --------------------------------------------------------
 * jsdom has no layout: each box's width comes from `data-w` (default 32), the
 * toolbar's from `data-test-width`; a separator is 9 wide, the ⋯ 32, and the
 * gap 0 (no stylesheet). ResizeObserver is captured so a test can fire it. */

const observers: Array<() => void> = [];
class TestResizeObserver {
  cb: () => void;
  constructor(cb: () => void) {
    this.cb = cb;
    observers.push(() => this.cb());
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const widthOf = (el: Element) => {
  if (el.hasAttribute('data-w')) return Number(el.getAttribute('data-w'));
  const slot = el.getAttribute('data-slot');
  if (slot === 'toolbar-separator') return 9;
  if (slot === 'toolbar-spacer') return 0;
  return 32;
};

describe('Toolbar overflow="menu"', () => {
  const originalRect = Element.prototype.getBoundingClientRect;
  const originalRO = globalThis.ResizeObserver;
  beforeEach(() => {
    observers.length = 0;
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
    Element.prototype.getBoundingClientRect = function getBoundingClientRect(this: Element) {
      const width = widthOf(this);
      return { top: 0, bottom: 32, left: 0, right: width, width, height: 32, x: 0, y: 0, toJSON() {} } as DOMRect;
    };
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return Number(this.getAttribute('data-test-width') ?? 0);
      },
    });
    if (!Element.prototype.hasPointerCapture) {
      Element.prototype.hasPointerCapture = () => false;
      Element.prototype.releasePointerCapture = () => {};
    }
  });
  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalRect;
    globalThis.ResizeObserver = originalRO;
    delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
  });

  const resize = (toolbar: HTMLElement, width: number) => {
    toolbar.setAttribute('data-test-width', String(width));
    act(() => observers.forEach((fire) => fire()));
  };

  function Editor({ width = 400, onShare }: { width?: number; onShare?: () => void }) {
    return (
      <Toolbar aria-label="Lecture note formatting" overflow="menu" data-test-width={width}>
        <ToolbarItem overflowIcon={<B />}>
          <ToolbarToggle aria-label="Bold" defaultPressed>
            <B />
          </ToolbarToggle>
        </ToolbarItem>
        <ToolbarItem>
          <ToolbarToggle aria-label="Italic">
            <B />
          </ToolbarToggle>
        </ToolbarItem>
        <ToolbarSeparator />
        <ToolbarItem priority={1} overflowLabel="Insert an image">
          <IconButton variant="tertiary" size="sm" aria-label="Image">
            <B />
          </IconButton>
        </ToolbarItem>
        <ToolbarItem overflowLabel="Share with Cohort 7" onOverflowSelect={onShare}>
          <IconButton variant="tertiary" size="sm" aria-label="Share">
            <B />
          </IconButton>
        </ToolbarItem>
        <ToolbarSpacer />
        <ToolbarOverflow aria-label="More note actions">
          <MenuItem>Download as PDF</MenuItem>
        </ToolbarOverflow>
      </Toolbar>
    );
  }

  const inMenu = (toolbar: HTMLElement) =>
    Array.from(toolbar.querySelectorAll('[data-slot="toolbar-item"][data-overflowed]')).map(
      (el) => el.querySelector('button')?.getAttribute('aria-label'),
    );
  const openMenu = () => {
    const more = screen.getByRole('button', { name: 'More note actions' });
    act(() => more.focus());
    fireEvent.keyDown(more, { key: 'Enter' });
    return screen.getByRole('menu');
  };

  it('renders every control on the server (no hydration mismatch), one line, no wrapping', () => {
    // jsdom has a `window`, so React 16's server renderer sees the layout
    // effects (ours and Radix's) and warns that they do nothing on the server;
    // a real server has no window and uses plain effects. Only that warning
    // is allowed here.
    const errors = vi.mocked(console.error);
    const html = renderToString(<Editor width={100} />);
    expect(errors.mock.calls.every((call) => String(call[0]).includes('useLayoutEffect does nothing on the server'))).toBe(true);
    errors.mockClear();
    for (const name of ['Bold', 'Italic', 'Image', 'Share']) expect(html).toContain(`aria-label="${name}"`);
    expect(html).not.toMatch(/data-slot="toolbar-item"[^>]*data-overflowed/);
    render(<Editor />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveAttribute('data-overflow', 'menu');
    expect(toolbar).not.toHaveAttribute('data-split');
    expect(toolbar.className).toContain('data-[overflow=menu]:flex-nowrap');
  });

  it('with room for everything, nothing moves and the ⋯ keeps only its own rows', () => {
    render(<Editor width={400} />);
    const toolbar = screen.getByRole('toolbar');
    expect(inMenu(toolbar)).toEqual([]);
    const menu = openMenu();
    expect(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"]')).toHaveLength(1);
  });

  it('moves the lowest priority, last items into the ⋯ as the toolbar narrows, and back as it widens', () => {
    render(<Editor width={400} />);
    const toolbar = screen.getByRole('toolbar');
    // Bold 32 + Italic 32 + sep 9 + Image 32 + Share 32 + ⋯ 32 = 169.
    resize(toolbar, 160);
    expect(inMenu(toolbar)).toEqual(['Share']);
    // Image has priority 1: Italic and Bold go before it.
    resize(toolbar, 110);
    expect(inMenu(toolbar)).toEqual(['Italic', 'Share']);
    resize(toolbar, 70);
    expect(inMenu(toolbar)).toEqual(['Bold', 'Italic', 'Share']);
    resize(toolbar, 400);
    expect(inMenu(toolbar)).toEqual([]);
  });

  it('a separator never starts the row or touches the spacer', () => {
    render(<Editor width={400} />);
    const toolbar = screen.getByRole('toolbar');
    const sep = toolbar.querySelector('[data-slot="toolbar-separator"]') as HTMLElement;
    expect(sep).not.toHaveAttribute('data-overflowed');
    resize(toolbar, 70); // Bold and Italic gone: the separator would start the row
    expect(sep).toHaveAttribute('data-overflowed');
    expect(sep.className).toContain('data-[overflowed]:absolute');
    resize(toolbar, 400);
    expect(sep).not.toHaveAttribute('data-overflowed');
  });

  it('the menu lists what moved in, in row order, then its own rows', () => {
    render(<Editor width={110} />);
    const menu = openMenu();
    const rows = Array.from(menu.querySelectorAll('[role^="menuitem"]')).map((el) => [
      el.getAttribute('role'),
      el.textContent,
    ]);
    expect(rows).toEqual([
      ['menuitemcheckbox', 'Italic'], // a toggle: its pressed state as a check
      ['menuitem', 'Share with Cohort 7'],
      ['menuitem', 'Download as PDF'],
    ]);
    // One where the row had a separator (between Italic and Share), one
    // before the menu's own rows.
    expect(menu.querySelectorAll('[role="separator"]')).toHaveLength(2);
  });

  it('choosing a moved-in row clicks its control, or calls onOverflowSelect', () => {
    const onShare = vi.fn();
    render(<Editor width={70} onShare={onShare} />);
    let menu = openMenu();
    const bold = screen.getByRole('menuitemcheckbox', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(bold);
    const boldToggle = screen.getByRole('toolbar').querySelector('[aria-label="Bold"]') as HTMLElement;
    expect(boldToggle).toHaveAttribute('aria-pressed', 'false');

    menu = openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share with Cohort 7' }));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(menu).toBeDefined();
  });

  it('moved-in controls leave the roving focus; the ⋯ is the last stop', () => {
    render(<Editor width={110} />);
    act(() => btn('Bold').focus());
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('Image'));
    key('ArrowRight');
    expect(document.activeElement).toBe(btn('More note actions'));
    key('ArrowRight'); // loops, past the hidden Italic and Share
    expect(document.activeElement).toBe(btn('Bold'));
  });

  it('a focused control that moves into the menu hands focus to the ⋯', () => {
    render(<Editor width={400} />);
    const toolbar = screen.getByRole('toolbar');
    act(() => btn('Share').focus());
    resize(toolbar, 160);
    expect(document.activeElement).toBe(btn('More note actions'));
    expect(btn('More note actions')).toHaveAttribute('tabindex', '0');
  });

  it('adds a ⋯ of its own when none is given, shown only when something moved in', () => {
    render(
      <Toolbar aria-label="Filters" overflow="menu" overflowMenuLabel="More filters" data-test-width={400}>
        <ToolbarItem>
          <IconButton variant="tertiary" size="sm" aria-label="Graded">
            <B />
          </IconButton>
        </ToolbarItem>
        <ToolbarItem>
          <IconButton variant="tertiary" size="sm" aria-label="Late">
            <B />
          </IconButton>
        </ToolbarItem>
      </Toolbar>,
    );
    const toolbar = screen.getByRole('toolbar');
    const wrapper = toolbar.querySelector('[data-slot="toolbar-overflow"]') as HTMLElement;
    expect(wrapper).toHaveAttribute('data-overflowed');
    expect(screen.queryByRole('button', { name: 'More filters' })).toBeNull(); // aria-hidden
    resize(toolbar, 64); // exactly fits both, with no ⋯
    expect(inMenu(toolbar)).toEqual([]);
    resize(toolbar, 63); // one out means the ⋯ comes in: both go
    expect(inMenu(toolbar)).toEqual(['Graded', 'Late']);
    expect(wrapper).not.toHaveAttribute('data-overflowed');
    expect(screen.getByRole('button', { name: 'More filters' })).toBeInTheDocument();
  });

  it('overflowContent replaces the default row', () => {
    render(
      <Toolbar aria-label="View" overflow="menu" data-test-width={40}>
        <ToolbarItem>
          <IconButton variant="tertiary" size="sm" aria-label="Pinned">
            <B />
          </IconButton>
        </ToolbarItem>
        <ToolbarItem data-w={120} overflowContent={<MenuItem>Write · Preview · Split</MenuItem>}>
          <span>segments</span>
        </ToolbarItem>
        <ToolbarOverflow aria-label="More note actions" />
      </Toolbar>,
    );
    openMenu();
    expect(screen.getByRole('menuitem', { name: 'Write · Preview · Split' })).toBeInTheDocument();
  });

  it('a wrap toolbar (the default) never hides a ToolbarItem', () => {
    render(
      <Toolbar aria-label="Wrap" data-test-width={10}>
        <ToolbarItem>
          <IconButton variant="tertiary" size="sm" aria-label="One">
            <B />
          </IconButton>
        </ToolbarItem>
        <ToolbarOverflow aria-label="More">
          <MenuItem>Two</MenuItem>
        </ToolbarOverflow>
      </Toolbar>,
    );
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).not.toHaveAttribute('data-overflow');
    expect(toolbar.querySelector('[data-overflowed]')).toBeNull();
    expect(btn('More')).toBeInTheDocument();
  });
});
