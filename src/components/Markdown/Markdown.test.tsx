import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { Markdown, type MarkdownComponents } from './Markdown';
import { decodeEntities, safeImageUrl, safeLinkUrl } from './safety';
import { repairInline, repairStreamingMarkdown } from './streaming';
import source from './Markdown.tsx?raw';
import { binarySearchAnswer, feeBreakdown } from './_fixtures/content';

const md = (text: string, props: Omit<React.ComponentProps<typeof Markdown>, 'children'> = {}) =>
  render(<Markdown {...props}>{text}</Markdown>);

describe('Markdown: root', () => {
  it('is a div with the slot, density and a merged className; forwards the ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <Markdown ref={ref} className="gap-8" id="answer">
        {'Hello'}
      </Markdown>,
    );
    const root = container.firstChild as HTMLElement;
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('data-slot', 'markdown');
    expect(root).toHaveAttribute('data-density', 'default');
    expect(root).toHaveAttribute('id', 'answer');
    expect(root).toHaveClass('gap-8');
    expect(root).not.toHaveClass('gap-4');
    expect(root).not.toHaveAttribute('aria-busy');
  });

  it('compact tightens the block gap', () => {
    const { container } = md('a', { density: 'compact' });
    expect(container.firstChild).toHaveClass('gap-3');
    expect(container.firstChild).toHaveAttribute('data-density', 'compact');
  });

  it('renders nothing for an empty or missing string', () => {
    const { container } = render(<Markdown />);
    expect((container.firstChild as HTMLElement).childElementCount).toBe(0);
  });

  it('is a server component: no directive, no hooks', () => {
    expect(source.startsWith("'use client'")).toBe(false);
    expect(source).not.toMatch(/\buse(State|Effect|LayoutEffect|Ref|Memo|Callback|Context|Reducer|Id)\(/);
    expect(source).not.toMatch(/dangerouslySetInnerHTML\s*=/);
  });
});

describe('Markdown: headings', () => {
  const doc = '# One\n\n## Two\n\n### Three\n\n###### Six';

  it('maps # to h2 by default, one level deeper per #, clamped at h6', () => {
    md(doc);
    expect(screen.getByText('One').tagName).toBe('H2');
    expect(screen.getByText('Two').tagName).toBe('H3');
    expect(screen.getByText('Three').tagName).toBe('H4');
    expect(screen.getByText('Six').tagName).toBe('H6');
    expect(screen.getByText('One')).toHaveAttribute('data-slot', 'heading');
    expect(screen.getByText('One')).toHaveAttribute('data-size', '2');
    expect(screen.getByText('Two')).toHaveAttribute('data-size', '3');
  });

  it('headingLevelStart moves the whole outline', () => {
    md(doc, { headingLevelStart: 1 });
    expect(screen.getByText('One').tagName).toBe('H1');
    expect(screen.getByText('One')).toHaveAttribute('data-size', '1');
    expect(screen.getByText('Two').tagName).toBe('H2');
  });

  it('clamps deep starts at h6', () => {
    md(doc, { headingLevelStart: 5 });
    expect(screen.getByText('One').tagName).toBe('H5');
    expect(screen.getByText('Two').tagName).toBe('H6');
    expect(screen.getByText('Three').tagName).toBe('H6');
  });

  it('compact steps the roles down one', () => {
    md(doc, { headingLevelStart: 1, density: 'compact' });
    expect(screen.getByText('One')).toHaveAttribute('data-size', '2');
    expect(screen.getByText('Two')).toHaveAttribute('data-size', '3');
  });
});

describe('Markdown: text', () => {
  it('paragraphs are Text; strong, em, del and hard breaks', () => {
    const { container } = md('Use **binary** search, *not* ~~linear~~.  \nNext line');
    const p = container.querySelector('p')!;
    expect(p).toHaveAttribute('data-slot', 'text');
    expect(screen.getByText('binary').tagName).toBe('STRONG');
    expect(screen.getByText('not').tagName).toBe('EM');
    expect(screen.getByText('linear').tagName).toBe('DEL');
    expect(p.querySelector('br')).not.toBeNull();
  });

  it('decodes entities in text, not in code', () => {
    md('Fees &amp; EMI &rarr; &#8377;1,20,000 &constructor; `&amp;`');
    expect(screen.getByText(/Fees & EMI → ₹1,20,000 &constructor;/)).toBeInTheDocument();
    expect(screen.getByText('&amp;').tagName).toBe('CODE');
  });
});

describe('Markdown: links', () => {
  it('relative, root, fragment, mailto and tel links are Links', () => {
    md('[a](/cohorts/7) [b](notes.md) [c](#faq) [d](mailto:help@scaler.com) [e](tel:+918000000000)');
    for (const [name, href] of [
      ['a', '/cohorts/7'],
      ['b', 'notes.md'],
      ['c', '#faq'],
      ['d', 'mailto:help@scaler.com'],
      ['e', 'tel:+918000000000'],
    ]) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', href);
      expect(link).toHaveAttribute('data-slot', 'link');
      expect(link).not.toHaveAttribute('target');
    }
  });

  it('an external link opens in place by default: no target, no new-tab text', () => {
    md('[Docs](https://docs.python.org/3/)');
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://docs.python.org/3/');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('data-external');
  });

  it('externalLinks="new-tab": target, rel and the external glyph', () => {
    md('[Docs](https://docs.python.org/3/) and [home](/)', { externalLinks: 'new-tab' });
    const link = screen.getByRole('link', { name: /Docs/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('data-external', 'true');
    expect(link).toHaveTextContent('(opens in a new tab)');
    expect(screen.getByRole('link', { name: 'home' })).not.toHaveAttribute('target');
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '&#106;avascript:alert(1)',
    'java&#9;script:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('a %s link renders as plain text', (href) => {
    const { container } = md(`Click [here](${href}) now`);
    expect(container.querySelector('a')).toBeNull();
    const blocked = container.querySelector('[data-slot="markdown-link-blocked"]');
    expect(blocked).toHaveTextContent('here');
  });

  it('bare URLs autolink', () => {
    md('See https://www.scaler.com/academy for details');
    expect(screen.getByRole('link', { name: 'https://www.scaler.com/academy' })).toHaveAttribute(
      'href',
      'https://www.scaler.com/academy',
    );
  });

  it('renderLink supplies the element and keeps Link’s look (asChild)', () => {
    const Routed = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function Routed(props, ref) {
        return <a ref={ref} data-router="yes" {...props} />;
      },
    );
    const renderLink = vi.fn(({ href, children, external }) =>
      external ? null : <Routed href={href}>{children}</Routed>,
    );
    md('[Module 4](/modules/4) and [MDN](https://developer.mozilla.org)', { renderLink });
    const routed = screen.getByRole('link', { name: 'Module 4' });
    expect(routed).toHaveAttribute('data-router', 'yes');
    expect(routed).toHaveAttribute('data-slot', 'link');
    expect(routed).toHaveAttribute('href', '/modules/4');
    // null falls back to the default anchor
    expect(screen.getByRole('link', { name: 'MDN' })).not.toHaveAttribute('data-router');
    expect(renderLink).toHaveBeenCalledWith(expect.objectContaining({ href: '/modules/4', external: false }));
  });

  it('components.a replaces the link, and never sees an unsafe URL', () => {
    const A: MarkdownComponents['a'] = ({ href, external, children }) => (
      <a href={href} data-custom={external ? 'ext' : 'int'}>
        {children}
      </a>
    );
    const { container } = md('[x](https://a.dev) [y](javascript:void0)', { components: { a: A } });
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('data-custom', 'ext');
  });
});

describe('Markdown: images', () => {
  it('a safe image: alt from markdown, lazy, contained', () => {
    md('![Binary search tree](/img/bst.png "A BST")');
    const img = screen.getByRole('img', { name: 'Binary search tree' });
    expect(img).toHaveAttribute('src', '/img/bst.png');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('title', 'A BST');
    expect(img).toHaveAttribute('data-slot', 'markdown-image');
    expect(img).toHaveClass('max-w-full', 'rounded-lg');
  });

  it('no alt in markdown: an empty alt, never a missing one', () => {
    const { container } = md('![](https://cdn.scaler.com/x.png)');
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it.each(['javascript:alert(1)', 'data:image/png;base64,iVBORw0KGgo=', 'blob:https://x/1', ''])(
    'an unsafe or missing source (%s) falls back to the alt text',
    (src) => {
      const { container } = md(`![Diagram of the heap](${src})`);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('[data-slot="markdown-image-fallback"]')).toHaveTextContent('Diagram of the heap');
    },
  );
});

describe('Markdown: code', () => {
  it('inline code is Code', () => {
    md('Call `bisect_left(a, x)` first.');
    const code = screen.getByText('bisect_left(a, x)');
    expect(code).toHaveAttribute('data-slot', 'code');
  });

  it('a fence is a CodeBlock with a language header and a CopyButton', () => {
    const { container } = md('```python\ndef f():\n    return 1\n```');
    const pre = container.querySelector('pre')!;
    expect(pre).toHaveAttribute('data-slot', 'code-block');
    expect(pre).toHaveTextContent('def f():');
    expect(pre).toHaveAttribute('aria-label', 'python code');
    const header = container.querySelector('[data-slot="code-block-header"]')!;
    expect(within(header as HTMLElement).getByText('python')).toHaveAttribute('data-slot', 'markdown-code-language');
    expect(screen.getByRole('button', { name: 'Copy the python code' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="code-block-group"]')).toHaveAttribute('data-language', 'python');
  });

  it('plain by default; highlight() output replaces the text, null keeps it', () => {
    const highlight = vi.fn((code: string, lang: string | undefined) =>
      lang === 'js' ? <span data-testid="hl">{code.toUpperCase()}</span> : null,
    );
    const { container } = md('```js\nlet a\n```\n\n```\nplain\n```', { highlight });
    expect(highlight).toHaveBeenCalledWith('let a', 'js');
    expect(highlight).toHaveBeenCalledWith('plain', undefined);
    expect(screen.getByTestId('hl')).toHaveTextContent('LET A');
    expect(container.querySelectorAll('pre')[1]).toHaveTextContent('plain');
  });

  it('an indented block is a code block too', () => {
    const { container } = md('Para\n\n    x = 1');
    expect(container.querySelector('pre')).toHaveTextContent('x = 1');
  });
});

describe('Markdown: lists', () => {
  it('unordered, ordered with start, nested', () => {
    const { container } = md('3. three\n4. four\n   - nested\n     - deeper');
    const ol = container.querySelector('ol')!;
    expect(ol).toHaveAttribute('start', '3');
    expect(ol).toHaveAttribute('data-slot', 'markdown-list');
    expect(ol).toHaveClass('list-decimal');
    const ul = ol.querySelector('ul')!;
    expect(ul).toHaveClass('list-[circle]');
    expect(ul.querySelector('ul')).toHaveClass('list-[square]');
    expect(container.querySelectorAll('li[data-slot="markdown-list-item"]')).toHaveLength(4);
  });

  it('an ordered list from 1 has no start attribute', () => {
    const { container } = md('1. a\n2. b');
    expect(container.querySelector('ol')).not.toHaveAttribute('start');
  });

  it('task items are read-only glyphs with a spoken state, never controls', () => {
    const { container } = md('- [x] Revise recursion\n- [ ] Solve 3 DP problems');
    expect(container.querySelector('input')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    const items = container.querySelectorAll('li');
    expect(items[0]).toHaveAttribute('data-task', 'checked');
    expect(items[1]).toHaveAttribute('data-task', 'unchecked');
    expect(items[0]).toHaveTextContent('Done: Revise recursion');
    expect(items[1]).toHaveTextContent('Not done: Solve 3 DP problems');
    expect(container.querySelector('ul')).toHaveAttribute('data-tasks', 'true');
  });
});

describe('Markdown: blocks', () => {
  it('a GFM table is our Table, with alignment', () => {
    const { container } = md('| Item | Qty | Fee |\n|:--|:-:|--:|\n| Tuition | 1 | ₹3,50,000 |');
    const table = container.querySelector('table')!;
    expect(table).toHaveAttribute('data-slot', 'table');
    expect(container.querySelector('[data-slot="table-container"]')).not.toBeNull();
    const heads = table.querySelectorAll('th');
    expect(heads).toHaveLength(3);
    heads.forEach((th) => expect(th).toHaveAttribute('scope', 'col'));
    const cells = table.querySelectorAll('td');
    expect(cells[1]).toHaveClass('text-center');
    expect(cells[2]).toHaveAttribute('data-numeric', 'true');
    expect(cells[2]).toHaveTextContent('₹3,50,000');
  });

  it('a compact Markdown gets a compact Table', () => {
    const { container } = md('| a |\n|---|\n| 1 |', { density: 'compact' });
    expect(container.querySelector('table')).toHaveAttribute('data-density', 'compact');
  });

  it('a blockquote holds secondary paragraphs', () => {
    const { container } = md('> Premature optimisation\n> is the root of all evil.');
    const q = container.querySelector('blockquote')!;
    expect(q).toHaveAttribute('data-slot', 'markdown-blockquote');
    expect(q.querySelector('p')).toHaveAttribute('data-tone', 'secondary');
  });

  it('hr is a semantic Divider', () => {
    const { container } = md('a\n\n---\n\nb');
    const hr = container.querySelector('hr')!;
    expect(hr).toHaveAttribute('data-slot', 'divider');
  });
});

describe('Markdown: no raw HTML ever becomes markup', () => {
  const evil = [
    '<script>alert(1)</script>',
    '',
    'Hi <img src=x onerror="alert(1)"> there <b onclick="x()">bold</b>',
    '',
    '<iframe src="https://evil.example"></iframe>',
    '',
    '<a href="javascript:alert(1)">x</a>',
    '',
    '<style>body{display:none}</style>',
  ].join('\n');

  it('renders it as text', () => {
    const { container } = md(evil);
    for (const tag of ['script', 'img', 'iframe', 'style', 'b', 'a']) {
      expect(container.querySelector(tag)).toBeNull();
    }
    expect(container.querySelectorAll('[onerror],[onclick]')).toHaveLength(0);
    expect(container).toHaveTextContent('<script>alert(1)</script>');
    expect(container).toHaveTextContent('<img src=x onerror="alert(1)">');
  });

  it('also while streaming', () => {
    const { container } = md(evil, { streaming: true });
    expect(container.querySelector('script, img, iframe, style')).toBeNull();
  });
});

describe('Markdown: components', () => {
  it('overrides elements by name', () => {
    const components: MarkdownComponents = {
      p: ({ children }) => <p data-custom="p">{children}</p>,
      h2: ({ children, level }) => <div data-custom={`h${level}`}>{children}</div>,
      pre: ({ code, lang, open }) => <pre data-custom={`${lang}:${open}`}>{code}</pre>,
      table: ({ header, rows }) => <div data-custom={`table:${header.length}x${rows.length}`} />,
      li: ({ checked, children }) => <li data-custom={String(checked)}>{children}</li>,
      hr: () => <hr data-custom="hr" />,
      code: ({ children }) => <kbd>{children}</kbd>,
    };
    const { container } = md(
      '# Title\n\nText `k`\n\n```sql\nSELECT 1\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] t\n\n***',
      { components },
    );
    expect(container.querySelector('[data-custom="p"]')).toHaveTextContent('Text k');
    expect(container.querySelector('[data-custom="h2"]')).toHaveTextContent('Title');
    expect(container.querySelector('[data-custom="sql:false"]')).toHaveTextContent('SELECT 1');
    expect(container.querySelector('[data-custom="table:2x1"]')).not.toBeNull();
    expect(container.querySelector('li[data-custom="true"]')).not.toBeNull();
    expect(container.querySelector('[data-custom="hr"]')).not.toBeNull();
    expect(container.querySelector('kbd')).toHaveTextContent('k');
  });
});

/* ---- streaming ------------------------------------------------------------ */

describe('repairStreamingMarkdown', () => {
  const repair = (s: string) => repairStreamingMarkdown(s).source;

  it('closes an unclosed fence, with its own fence string', () => {
    expect(repairStreamingMarkdown('Code:\n\n```py\ndef f(')).toEqual({
      source: 'Code:\n\n```py\ndef f(\n```',
      openFence: true,
    });
    expect(repair('~~~~\nx\n')).toBe('~~~~\nx\n~~~~');
    expect(repairStreamingMarkdown('```\nx\n```\n').openFence).toBe(false);
  });

  it('leaves the inside of an open fence alone', () => {
    expect(repair('```js\nconst a = **b')).toBe('```js\nconst a = **b\n```');
  });

  it.each([
    ['The **mid', 'The **mid**'],
    ['The **mid ', 'The **mid**'],
    ['The **', 'The'],
    ['The *mid', 'The *mid*'],
    ['***both', '***both***'],
    ['**bold *it', '**bold *it***'],
    ['**bold** done', '**bold** done'],
    ['~~old', '~~old~~'],
    ['use `lo', 'use `lo`'],
    ['use `', 'use'],
    ['**use `mid', '**use `mid`**'],
    ['see [docs](https://docs.pyt', 'see docs'],
    ['see [docs](', 'see docs'],
    ['see [docs', 'see docs'],
    ['see ![graph](https://x', 'see '],
    ['call binary_search(arr', 'call binary_search(arr'],
    ['2 * 3 = 6', '2 * 3 = 6'],
    ['* item', '* item'],
    ['visit https://a.dev/x_y', 'visit https://a.dev/x_y'],
    ['snake_case and _emph', 'snake_case and _emph_'],
  ])('%j → %j', (input, output) => {
    expect(repairInline(input)).toBe(output);
  });

  it('holds back a half table row and a header with no delimiter yet', () => {
    const table = '| n | steps |\n|---|---:|\n| 8 | 3 |\n';
    expect(repair(`${table}| 16 | 4`)).toBe(table.trimEnd());
    expect(repair('Intro\n\n| n | steps |\n').trimEnd()).toBe('Intro');
    expect(repair('Intro\n\n| n | steps |\n|--').trimEnd()).toBe('Intro');
    expect(repair(`${table}| 16 | 4 |\n`)).toBe(`${table}| 16 | 4 |\n`);
  });

  it('holds back a line that is only a block marker', () => {
    expect(repair('Para\n-')).toBe('Para');
    expect(repair('Para\n\n1.').trimEnd()).toBe('Para');
    expect(repair('Para\n\n##').trimEnd()).toBe('Para');
    expect(repair('- a\n- [ ]')).toBe('- a');
    expect(repair('Para\n``')).toBe('Para');
  });

  it('does not touch finished text', () => {
    const done = '# Title\n\nSome **bold** and `code`.\n\n- a\n- b\n';
    expect(repair(done)).toBe(done);
  });
});

describe('Markdown streaming', () => {
  it('sets aria-busy while streaming', () => {
    const { container } = md('Hi', { streaming: true });
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(container.firstChild).toHaveAttribute('data-streaming', 'true');
  });

  it('an unclosed fence renders as an open CodeBlock', () => {
    const { container } = md('Here:\n\n```java\nint mid = lo +', { streaming: true });
    const group = container.querySelector('[data-slot="code-block-group"]')!;
    expect(group).toHaveAttribute('data-state', 'open');
    expect(container.querySelector('pre')).toHaveTextContent('int mid = lo +');
  });

  it('a trailing ** never shows as asterisks; a half link shows its text', () => {
    const { container } = md('Use **bin', { streaming: true });
    expect(container).not.toHaveTextContent('*');
    expect(screen.getByText('bin').tagName).toBe('STRONG');

    const half = md('Read [the docs](https://docs.pyth', { streaming: true });
    expect(half.container.querySelector('a')).toBeNull();
    expect(half.container).toHaveTextContent('Read the docs');
    expect(half.container).not.toHaveTextContent('[');
  });

  it('a half table row never renders as a row of pipes', () => {
    const { container } = md('| n | log n |\n|---|--:|\n| 8 | 3 |\n| 1', { streaming: true });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container).not.toHaveTextContent('|');
  });

  it('completed blocks keep their DOM nodes as text arrives', () => {
    const full =
      '## Binary search\n\nIt halves the range each step.\n\n- sorted input\n- O(log n)\n\n```py\nlo, hi = 0, n\n```\n\n| n | steps |\n|---|--:|\n| 8 | 3 |\n| 1024 | 10 |\n\nDone.';
    const cuts = [30, 60, 85, 105, 125, 150, 175, full.length];
    const { container, rerender } = render(<Markdown streaming>{full.slice(0, cuts[0])}</Markdown>);
    const heading = container.querySelector('h2')!;
    rerender(<Markdown streaming>{full.slice(0, cuts[1])}</Markdown>);
    const para = container.querySelector('p')!;
    expect(container.querySelector('h2')).toBe(heading);

    let list: Element | null = null;
    let pre: Element | null = null;
    let table: Element | null = null;
    for (const cut of cuts.slice(2)) {
      rerender(<Markdown streaming>{full.slice(0, cut)}</Markdown>);
      expect(container.querySelector('h2')).toBe(heading);
      expect(container.querySelector('p')).toBe(para);
      if (list) expect(container.querySelector('ul')).toBe(list);
      if (pre) expect(container.querySelector('pre')).toBe(pre);
      if (table) expect(container.querySelector('table')).toBe(table);
      list = list ?? container.querySelector('ul');
      pre = pre ?? container.querySelector('pre');
      table = table ?? container.querySelector('table');
    }
    rerender(<Markdown>{full}</Markdown>);
    expect(container.querySelector('h2')).toBe(heading);
    expect(container.querySelector('table')).toBe(table);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(container).toHaveTextContent('Done.');
  });
});

/* ---- safety helpers ------------------------------------------------------- */

describe('safety', () => {
  it('link allowlist', () => {
    expect(safeLinkUrl('https://scaler.com')).toEqual({ url: 'https://scaler.com', external: true });
    expect(safeLinkUrl('//cdn.example.com/x')).toEqual({ url: '//cdn.example.com/x', external: true });
    expect(safeLinkUrl('/a:b')).toEqual({ url: '/a:b', external: false });
    expect(safeLinkUrl(' javascript:x')).toBeNull();
    expect(safeLinkUrl('java\nscript:x')).toBeNull();
    expect(safeLinkUrl('\u0001javascript:x')).toBeNull();
    expect(safeLinkUrl('')).toBeNull();
  });

  it('image allowlist', () => {
    expect(safeImageUrl('https://x/y.png')).not.toBeNull();
    expect(safeImageUrl('mailto:a@b')).toBeNull();
    expect(safeImageUrl('#x')).toBeNull();
  });

  it('entities', () => {
    expect(decodeEntities('&lt;b&gt; &#x1F600; &#0; &nope; &hasOwnProperty;')).toBe('<b> 😀 � &nope; &hasOwnProperty;');
  });
});

describe('Markdown streaming: a whole answer, chunk by chunk', () => {
  it.each([
    ['binary search answer', binarySearchAnswer],
    ['fee breakdown', feeBreakdown],
  ])('%s: no stray syntax at any cut', (_, full) => {
    const { container, rerender } = render(<Markdown streaming>{''}</Markdown>);
    for (let cut = 1; cut <= full.length; cut += 1) {
      rerender(<Markdown streaming>{full.slice(0, cut)}</Markdown>);
      // Prose only: code keeps its own characters.
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('pre, code').forEach((n) => n.remove());
      const prose = clone.textContent ?? '';
      expect(prose, `cut ${cut}: ${JSON.stringify(full.slice(Math.max(0, cut - 20), cut))}`).not.toMatch(
        /\*\*|\]\(|`|\|/,
      );
    }
    const finished = render(<Markdown>{full}</Markdown>);
    rerender(<Markdown>{full}</Markdown>);
    expect(container.innerHTML).toBe(finished.container.innerHTML);
    // Hundreds of renders (one per character), so it outgrows the default
    // 5s budget on a loaded CI runner; the work itself is ~1s.
  }, 30_000);
});

describe('Markdown truncated', () => {
  it('repairs a cut-off tail like streaming, but is not busy', () => {
    const { container } = render(<Markdown truncated>{'| n | steps |\n|---|---|\n| 8 | 3 |\n| 16 '}</Markdown>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute('aria-busy');
    expect(root).toHaveAttribute('data-truncated');
    expect(container.textContent).not.toMatch(/\|/);
  });
});

