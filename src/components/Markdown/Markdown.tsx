import * as React from 'react';
import { cva } from 'class-variance-authority';
import { Lexer, type MarkedOptions, type MarkedToken, type Token, type Tokens } from 'marked';

import { cn } from '../../lib/cn';
import { Code, CodeBlock, CodeBlockGroup, CodeBlockHeader } from '../Code/Code';
import { CopyButton } from '../Code/CopyButton';
import { Divider } from '../Divider';
import { Heading, type HeadingElement, type HeadingSize } from '../Heading';
import { Link } from '../Link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { Text, textVariants } from '../Text';
import { decodeEntities, safeImageUrl, safeLinkUrl } from './safety';
import { repairStreamingMarkdown } from './streaming';

/* ---------------------------------------------------------------------------
 * Markdown
 *
 * Renders a markdown string (an AI tutor's answer, a mentor's note, a
 * student's forum post) with the system's own atoms: Heading, Text, Link,
 * Code / CodeBlock + CopyButton, Table, Divider. It is for content you do NOT
 * author in JSX; when you control the content, use the atoms directly.
 *
 * Parsing is `marked`'s LEXER only: the string becomes tokens and the tokens
 * become React elements here. No HTML string is ever produced and nothing is
 * set with `dangerouslySetInnerHTML`, so:
 *   - raw HTML in the source (`<script>`, `<img onerror>`) renders as the
 *     literal text it is;
 *   - a link reaches an `href` only with an allowlisted scheme (http, https,
 *     mailto, tel, or none: relative, `/root`, `#fragment`); `javascript:`,
 *     `data:`, `vbscript:` and every other scheme render as the link's text;
 *   - an image loads only from http(s) or a relative path; anything else, or
 *     no URL, renders as its alt text.
 *
 * `streaming` is for text arriving chunk by chunk: the incomplete tail is
 * repaired before lexing (see ./streaming.ts) and every block keeps its key,
 * so a finished paragraph, list or table keeps its DOM while later blocks
 * arrive. The whole string is re-lexed per render; blocks whose source did
 * not change skip re-rendering (`React.memo` on the block, compared by source
 * text). Measured (Apple silicon, Node): lexing takes ~0.4 ms at 3 kB,
 * ~1.3 ms at 20 kB, ~4 ms at 100 kB and ~19 ms at 500 kB; the streaming repair
 * adds under 2% of that. So per-chunk re-lexing is free for a chat answer and
 * starts to cost frames around 100 kB; past that, render the settled part as
 * its own `<Markdown>` and stream only the new message.
 *
 * Prose width: none is set, so it fills its container. A chat message caps
 * itself at the system measure, `max-w-(--size-measure-max)` (72ch).
 *
 * Server component: no hooks, no handlers. A page can render stored markdown
 * with zero client JS of its own; the client leaves are the atoms' own
 * (CopyButton, the Table scroll area).
 * ------------------------------------------------------------------------- */

export type MarkdownDensity = 'default' | 'compact';
/** Where an external (`http(s)://`) link opens. */
export type MarkdownExternalLinks = 'same-tab' | 'new-tab';
export type MarkdownHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const markdownVariants = cva(
  [
    // `minmax(0,1fr)`: a code line or a wide table scrolls inside its own box
    // instead of setting the column's width and pushing the page wide.
    'grid min-w-0 grid-cols-[minmax(0,1fr)] font-sans type-body text-content [overflow-wrap:anywhere]',
  ],
  {
    variants: {
      density: {
        // A heading takes extra air above it: it belongs to what follows.
        default: 'gap-4 [&>[data-slot=heading]:not(:first-child)]:mt-4',
        compact: 'gap-3 [&>[data-slot=heading]:not(:first-child)]:mt-2',
      },
    },
    defaultVariants: { density: 'default' },
  },
);

/* ---- overrides ------------------------------------------------------------ */

type WithChildren = { children?: React.ReactNode };

export type MarkdownHeadingProps = WithChildren & {
  /** The outline level rendered (after `headingLevelStart`). */
  level: MarkdownHeadingLevel;
};

export type MarkdownLinkProps = WithChildren & {
  /** The destination, already checked against the scheme allowlist. */
  href: string;
  title?: string;
  /** `http(s)://` or protocol-relative: it leaves this site. */
  external: boolean;
};

export type MarkdownImageProps = {
  /** Already checked against the scheme allowlist. */
  src: string;
  /** From the markdown; `''` when the author gave none. */
  alt: string;
  title?: string;
};

export type MarkdownCodeBlockProps = {
  /** The code, as written. */
  code: string;
  /** The first word of the fence's info string (` ```python ` → `python`). */
  lang?: string;
  /** The stream has not closed this fence yet. */
  open: boolean;
};

export type MarkdownListProps = WithChildren & {
  /** 0 for a top-level list. */
  depth: number;
  /** Every item is a task (`- [ ]`). */
  tasks: boolean;
};

export type MarkdownOrderedListProps = MarkdownListProps & {
  /** The first number. */
  start: number;
};

export type MarkdownListItemProps = WithChildren & {
  /** A GFM task item: `true` done, `false` not done. Unset for a plain item. */
  checked?: boolean;
};

export type MarkdownTableAlign = 'left' | 'center' | 'right' | null;

export type MarkdownTableProps = {
  /** Per column, from the delimiter row. */
  align: MarkdownTableAlign[];
  /** The header cells' content. */
  header: React.ReactNode[];
  /** Each body row's cells' content. */
  rows: React.ReactNode[][];
};

/**
 * Replace how one element renders. Each entry is a component, rendered with
 * the props named here. Unsafe URLs never reach `a` or `img`: they have
 * already been rendered as text.
 */
export type MarkdownComponents = {
  h1?: React.ComponentType<MarkdownHeadingProps>;
  h2?: React.ComponentType<MarkdownHeadingProps>;
  h3?: React.ComponentType<MarkdownHeadingProps>;
  h4?: React.ComponentType<MarkdownHeadingProps>;
  h5?: React.ComponentType<MarkdownHeadingProps>;
  h6?: React.ComponentType<MarkdownHeadingProps>;
  p?: React.ComponentType<WithChildren>;
  a?: React.ComponentType<MarkdownLinkProps>;
  img?: React.ComponentType<MarkdownImageProps>;
  /** Inline code. */
  code?: React.ComponentType<WithChildren>;
  /** A fenced or indented code block. */
  pre?: React.ComponentType<MarkdownCodeBlockProps>;
  blockquote?: React.ComponentType<WithChildren>;
  ul?: React.ComponentType<MarkdownListProps>;
  ol?: React.ComponentType<MarkdownOrderedListProps>;
  li?: React.ComponentType<MarkdownListItemProps>;
  table?: React.ComponentType<MarkdownTableProps>;
  hr?: React.ComponentType<object>;
  strong?: React.ComponentType<WithChildren>;
  em?: React.ComponentType<WithChildren>;
  del?: React.ComponentType<WithChildren>;
};

/** What `renderLink` is called with. */
export type MarkdownLinkRenderProps = {
  /** The destination, already checked against the scheme allowlist. */
  href: string;
  title?: string;
  /** `http(s)://` or protocol-relative: it leaves this site. */
  external: boolean;
  /** The link's rendered text. Put it inside the element you return. */
  children: React.ReactNode;
};

export type MarkdownProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** The markdown source. */
  children?: string | null;
  /**
   * The outline level a `#` heading renders as; `##` is one deeper, and so
   * on, clamped at h6. Set it to one below the section the markdown sits in:
   * inside an h2 section, `3`. Each level takes that level's heading role
   * (h1 → `type-h1`, h2 → `type-h2`, h3–h6 → `type-h3`).
   *
   * @default 2
   */
  headingLevelStart?: MarkdownHeadingLevel;
  /**
   * The text is still arriving. The unfinished tail is repaired before it
   * renders (an unclosed fence renders as an open code block; a half-typed
   * `**`, `` ` ``, `[text](` or table row is closed or held back), and
   * `aria-busy` is set on the root. Turn it off when the stream ends so the
   * final text renders exactly as written.
   *
   * @default false
   */
  streaming?: boolean;
  /**
   * The text was CUT OFF and will not continue: a reply the reader stopped
   * mid-stream, or one that errored. The unfinished tail is repaired exactly
   * as `streaming` repairs it (so a half table row or an unclosed `**` never
   * shows as raw syntax), but the root is not `aria-busy`, because nothing
   * more is coming. Ignored while `streaming`.
   *
   * @default false
   */
  truncated?: boolean;
  /**
   * Replace how individual elements render: `{ a: MyLink, pre: MyCodeBlock }`.
   * Keep the object stable (module scope or memoised): a new object on every
   * render re-renders every block.
   */
  components?: MarkdownComponents;
  /**
   * Syntax highlighting for fenced code. Called with the code and the
   * fence's language; return the highlighted content (`CodeToken`s, or a
   * highlighter's output mapped onto them), or `null` for plain text. Without
   * it, code is plain monospace.
   */
  highlight?: (code: string, lang: string | undefined) => React.ReactNode | null;
  /**
   * Render a link's element yourself, keeping Link's look: the element you
   * return is wrapped in `<Link asChild>`. Route through `next/link`:
   * `renderLink={({ href, children }) => <NextLink href={href}>{children}</NextLink>}`.
   * Return `null` for the default `<a>`. `components.a` replaces the Link
   * entirely instead, and wins over this.
   */
  renderLink?: (link: MarkdownLinkRenderProps) => React.ReactElement | null | undefined;
  /**
   * `same-tab`: an external link opens in place, like any other link.
   * `new-tab`: it gets `target="_blank"`, `rel="noopener noreferrer"` and
   * Link's `external` glyph with its "(opens in a new tab)" text.
   *
   * @default 'same-tab'
   */
  externalLinks?: MarkdownExternalLinks;
  /**
   * `default` 16px between blocks · `compact` 12px, headings one role
   * smaller and compact tables, for narrow chat panels and drawers.
   *
   * @default 'default'
   */
  density?: MarkdownDensity;
};

/* ---- rendering ------------------------------------------------------------ */

type Ctx = {
  components: MarkdownComponents;
  highlight: MarkdownProps['highlight'];
  renderLink: MarkdownProps['renderLink'];
  externalLinks: MarkdownExternalLinks;
  headingLevelStart: MarkdownHeadingLevel;
  density: MarkdownDensity;
  /** Inside a blockquote: paragraphs take the secondary ink. */
  quote: boolean;
  /** Nesting depth of the list being rendered. */
  listDepth: number;
};

const NO_COMPONENTS: MarkdownComponents = {};

/** Every option, spelled out: a consumer's global `marked.use()` must not reach us. */
function lex(src: string): Token[] {
  const options: MarkedOptions = {
    async: false,
    breaks: false,
    extensions: null,
    gfm: true,
    hooks: null,
    pedantic: false,
    renderer: null,
    silent: false,
    tokenizer: null,
    walkTokens: null,
  };
  return new Lexer(options).lex(src);
}

const text = (value: string) => decodeEntities(value);

function renderInline(tokens: Token[] | undefined, ctx: Ctx): React.ReactNode[] {
  if (!tokens) return [];
  return tokens.map((token, i) => renderInlineToken(token, ctx, i));
}

function renderInlineToken(token: Token, ctx: Ctx, key: number): React.ReactNode {
  const t = token as MarkedToken;
  const { components: c } = ctx;
  switch (t.type) {
    case 'text':
      // Block-level text inside a tight list item carries its inline tokens.
      return t.tokens ? (
        <React.Fragment key={key}>{renderInline(t.tokens, ctx)}</React.Fragment>
      ) : (
        <React.Fragment key={key}>{text(t.text)}</React.Fragment>
      );
    case 'escape':
      return <React.Fragment key={key}>{t.text}</React.Fragment>;
    case 'html':
      // Raw inline HTML is text. React escapes it.
      return <React.Fragment key={key}>{t.text}</React.Fragment>;
    case 'strong':
      return c.strong ? (
        <c.strong key={key}>{renderInline(t.tokens, ctx)}</c.strong>
      ) : (
        <strong key={key} data-slot="markdown-strong" className="font-semibold">
          {renderInline(t.tokens, ctx)}
        </strong>
      );
    case 'em':
      return c.em ? (
        <c.em key={key}>{renderInline(t.tokens, ctx)}</c.em>
      ) : (
        <em key={key} data-slot="markdown-emphasis" className="italic">
          {renderInline(t.tokens, ctx)}
        </em>
      );
    case 'del':
      return c.del ? (
        <c.del key={key}>{renderInline(t.tokens, ctx)}</c.del>
      ) : (
        <del key={key} data-slot="markdown-delete" className="line-through">
          {renderInline(t.tokens, ctx)}
        </del>
      );
    case 'codespan':
      return c.code ? <c.code key={key}>{t.text}</c.code> : <Code key={key}>{t.text}</Code>;
    case 'br':
      return <br key={key} data-slot="markdown-break" />;
    case 'link':
      return renderLink(t, ctx, key);
    case 'image':
      return renderImage(t, ctx, key);
    default: {
      const g = token as Tokens.Generic;
      if (g.tokens) return <React.Fragment key={key}>{renderInline(g.tokens, ctx)}</React.Fragment>;
      return <React.Fragment key={key}>{typeof g.text === 'string' ? text(g.text) : g.raw}</React.Fragment>;
    }
  }
}

function renderLink(t: Tokens.Link, ctx: Ctx, key: number): React.ReactNode {
  const children = renderInline(t.tokens, ctx);
  const safe = safeLinkUrl(t.href);
  if (!safe) {
    // Not a scheme we allow: the words stay, the link does not.
    return (
      <span key={key} data-slot="markdown-link-blocked">
        {children}
      </span>
    );
  }
  const title = t.title ? text(t.title) : undefined;
  const A = ctx.components.a;
  if (A) {
    return (
      <A key={key} href={safe.url} title={title} external={safe.external}>
        {children}
      </A>
    );
  }
  const newTab = safe.external && ctx.externalLinks === 'new-tab';
  const tab = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : null;
  const own = ctx.renderLink ? ctx.renderLink({ href: safe.url, title, external: safe.external, children }) : null;
  if (own) {
    return (
      <Link key={key} asChild external={newTab} title={title} {...tab}>
        {own}
      </Link>
    );
  }
  return (
    <Link key={key} href={safe.url} title={title} external={newTab} {...tab}>
      {children}
    </Link>
  );
}

function renderImage(t: Tokens.Image, ctx: Ctx, key: number): React.ReactNode {
  const alt = text(t.text);
  const safe = safeImageUrl(t.href);
  if (!safe) {
    return alt ? (
      <span key={key} data-slot="markdown-image-fallback">
        {alt}
      </span>
    ) : null;
  }
  const title = t.title ? text(t.title) : undefined;
  const Img = ctx.components.img;
  if (Img) return <Img key={key} src={safe.url} alt={alt} title={title} />;
  return (
    <img
      key={key}
      data-slot="markdown-image"
      src={safe.url}
      alt={alt}
      title={title}
      loading="lazy"
      decoding="async"
      className="inline-block h-auto max-w-full rounded-lg align-middle"
    />
  );
}

/* ---- blocks --------------------------------------------------------------- */

/** Compact steps each heading down one role; h3 is the floor (below 18px a heading reads as bold body). */
const COMPACT_SIZE: Record<number, HeadingSize> = { 1: '2', 2: '3', 3: '3', 4: '3', 5: '3', 6: '3' };

const BULLETS = ['list-disc', 'list-[circle]', 'list-[square]'];
const NUMBERS = ['list-decimal', 'list-[lower-alpha]', 'list-[lower-roman]'];

/** Phosphor 2.1.1 `check`, bold (MIT). */
const CHECK =
  'M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z';

function TaskState({ checked }: { checked: boolean }) {
  // A glyph, not a control: the list is read-only, so nothing here looks or
  // behaves like a Checkbox. The state is spoken as text before the item.
  return (
    <span
      data-slot="markdown-task-state"
      data-state={checked ? 'checked' : 'unchecked'}
      // One line box tall, so the glyph centres on the first line of the item.
      className="inline-flex h-[calc(var(--type-body-lh)*1em)] shrink-0 items-center"
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex size-icon-sm items-center justify-center rounded-sm',
          checked ? 'bg-success text-success-on-solid' : 'border border-border-strong',
        )}
      >
        {checked ? (
          <svg viewBox="0 0 256 256" focusable="false" className="size-3 fill-current">
            <path d={CHECK} />
          </svg>
        ) : null}
      </span>
      <span className="sr-only">{checked ? 'Done: ' : 'Not done: '}</span>
    </span>
  );
}

function renderBlocks(tokens: Token[], ctx: Ctx): React.ReactNode[] {
  return visible(tokens).map((token, i) => renderBlock(token, ctx, i, false));
}

/** Blank lines and link definitions render nothing, and must not shift keys. */
function visible(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.type !== 'space' && t.type !== 'def');
}

function renderBlock(token: Token, ctx: Ctx, key: React.Key, open: boolean): React.ReactNode {
  const t = token as MarkedToken;
  const { components: c } = ctx;
  switch (t.type) {
    case 'heading': {
      const level = Math.min(6, Math.max(1, t.depth - 1 + ctx.headingLevelStart)) as MarkdownHeadingLevel;
      const as = `h${level}` as HeadingElement;
      const Custom = c[as as keyof MarkdownComponents] as React.ComponentType<MarkdownHeadingProps> | undefined;
      if (Custom) {
        return (
          <Custom key={key} level={level}>
            {renderInline(t.tokens, ctx)}
          </Custom>
        );
      }
      return (
        <Heading key={key} as={as} size={ctx.density === 'compact' ? COMPACT_SIZE[level] : undefined}>
          {renderInline(t.tokens, ctx)}
        </Heading>
      );
    }

    case 'paragraph':
      return c.p ? (
        <c.p key={key}>{renderInline(t.tokens, ctx)}</c.p>
      ) : (
        <Text key={key} as="p" tone={ctx.quote ? 'secondary' : 'primary'} className="m-0">
          {renderInline(t.tokens, ctx)}
        </Text>
      );

    // A tight list item's text, outside a list (rare): inline content.
    case 'text':
      return <React.Fragment key={key}>{t.tokens ? renderInline(t.tokens, ctx) : text(t.text)}</React.Fragment>;

    case 'code': {
      const lang = (t.lang ?? '').trim().split(/\s+/)[0] || undefined;
      if (c.pre) return <c.pre key={key} code={t.text} lang={lang} open={open} />;
      const highlighted = ctx.highlight ? ctx.highlight(t.text, lang) : null;
      return (
        <CodeBlockGroup key={key} data-language={lang} data-state={open ? 'open' : undefined}>
          <CodeBlockHeader>
            <span data-slot="markdown-code-language">{lang ?? 'code'}</span>
            <CopyButton value={t.text} aria-label={lang ? `Copy the ${lang} code` : 'Copy the code'} />
          </CodeBlockHeader>
          <CodeBlock aria-label={lang ? `${lang} code` : 'Code'}>{highlighted ?? t.text}</CodeBlock>
        </CodeBlockGroup>
      );
    }

    case 'blockquote': {
      const inner = renderBlocks(t.tokens, { ...ctx, quote: true });
      return c.blockquote ? (
        <c.blockquote key={key}>{inner}</c.blockquote>
      ) : (
        <blockquote
          key={key}
          data-slot="markdown-blockquote"
          className="m-0 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 border-s-4 border-border-subtle ps-4 text-content-secondary"
        >
          {inner}
        </blockquote>
      );
    }

    case 'list':
      return renderList(t, ctx, key);

    case 'table':
      return renderTable(t, ctx, key);

    case 'hr':
      return c.hr ? <c.hr key={key} /> : <Divider key={key} decorative={false} className="my-2" />;

    case 'html':
      // Raw HTML is shown as the text it is, never parsed.
      return (
        <p
          key={key}
          data-slot="markdown-html"
          className={cn(textVariants({ tone: 'secondary', size: 'base' }), 'm-0 whitespace-pre-wrap')}
        >
          {t.text.replace(/\n+$/, '')}
        </p>
      );

    default: {
      const g = token as Tokens.Generic;
      if (g.tokens) return <React.Fragment key={key}>{renderInline(g.tokens, ctx)}</React.Fragment>;
      return null;
    }
  }
}

function renderList(t: Tokens.List, ctx: Ctx, key: React.Key): React.ReactNode {
  const { components: c } = ctx;
  const depth = ctx.listDepth;
  const tasks = t.items.length > 0 && t.items.every((item) => item.task);
  const inner: Ctx = { ...ctx, listDepth: depth + 1 };
  const items = t.items.map((item, i) => {
    const content = renderBlocks(item.tokens, inner);
    const checked = item.task ? Boolean(item.checked) : undefined;
    if (c.li) {
      return (
        <c.li key={i} checked={checked}>
          {content}
        </c.li>
      );
    }
    // Blocks inside an item (a loose item's paragraphs, a nested list) are
    // spaced; inline content of a tight item is not affected (margins do not
    // move inline boxes).
    const stack = t.loose ? '[&>*:not(:first-child)]:mt-2' : '[&>*:not(:first-child)]:mt-1';
    if (item.task) {
      return (
        <li
          key={i}
          data-slot="markdown-list-item"
          data-task={checked ? 'checked' : 'unchecked'}
          className="flex list-none items-start gap-2"
        >
          <TaskState checked={Boolean(checked)} />
          <div data-slot="markdown-task-content" className={cn('min-w-0 flex-1', stack)}>
            {content}
          </div>
        </li>
      );
    }
    return (
      <li key={i} data-slot="markdown-list-item" className={cn('ps-1', stack)}>
        {content}
      </li>
    );
  });

  const start = t.ordered && typeof t.start === 'number' ? t.start : 1;
  if (t.ordered && c.ol) {
    return (
      <c.ol key={key} depth={depth} tasks={tasks} start={start}>
        {items}
      </c.ol>
    );
  }
  if (!t.ordered && c.ul) {
    return (
      <c.ul key={key} depth={depth} tasks={tasks}>
        {items}
      </c.ul>
    );
  }
  const Tag = t.ordered ? 'ol' : 'ul';
  return (
    <Tag
      key={key}
      data-slot="markdown-list"
      data-ordered={t.ordered || undefined}
      data-tasks={tasks || undefined}
      start={t.ordered && start !== 1 ? start : undefined}
      className={cn(
        'm-0 min-w-0 ps-6 marker:text-content-secondary',
        (t.ordered ? NUMBERS : BULLETS)[depth % 3],
        t.ordered && 'marker:tabular-nums',
        // A list of only tasks draws glyphs, not markers.
        tasks && 'list-none ps-0',
        t.loose ? '[&>li+li]:mt-3' : '[&>li+li]:mt-1',
      )}
    >
      {items}
    </Tag>
  );
}

function renderTable(t: Tokens.Table, ctx: Ctx, key: React.Key): React.ReactNode {
  const header = t.header.map((cell) => renderInline(cell.tokens, ctx));
  const rows = t.rows.map((row) => row.map((cell) => renderInline(cell.tokens, ctx)));
  const Custom = ctx.components.table;
  if (Custom) return <Custom key={key} align={t.align} header={header} rows={rows} />;
  // Right-aligned columns are figures (fees, marks, counts): Table's numeric
  // cells, right-aligned in tabular figures.
  const alignOf = (i: number) => {
    const a = t.align[i];
    return a === 'center' ? 'text-center' : undefined;
  };
  return (
    <Table key={key} density={ctx.density === 'compact' ? 'compact' : 'default'}>
      <TableHeader>
        <TableRow>
          {header.map((cell, i) => (
            <TableHead key={i} scope="col" numeric={t.align[i] === 'right'} className={alignOf(i)}>
              {cell}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, r) => (
          <TableRow key={r}>
            {row.map((cell, i) => (
              <TableCell key={i} numeric={t.align[i] === 'right'} className={alignOf(i)}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/* ---- one top-level block, memoised by its source -------------------------- */

type BlockProps = { token: Token; ctx: Ctx; open: boolean };

function sameCtx(a: Ctx, b: Ctx) {
  return (
    a.components === b.components &&
    a.highlight === b.highlight &&
    a.renderLink === b.renderLink &&
    a.externalLinks === b.externalLinks &&
    a.headingLevelStart === b.headingLevelStart &&
    a.density === b.density
  );
}

/**
 * A finished block's source text does not change as the stream grows, so it
 * does not re-render; the block still being written does.
 */
const MarkdownBlock = React.memo(
  function MarkdownBlock({ token, ctx, open }: BlockProps) {
    return <>{renderBlock(token, ctx, 0, open)}</>;
  },
  (a, b) => a.token.raw === b.token.raw && a.open === b.open && sameCtx(a.ctx, b.ctx),
);
MarkdownBlock.displayName = 'MarkdownBlock';

/* ---- Markdown ------------------------------------------------------------- */

export const Markdown = React.forwardRef<HTMLDivElement, MarkdownProps>(function Markdown(
  {
    className,
    children,
    headingLevelStart = 2,
    streaming = false,
    truncated = false,
    components = NO_COMPONENTS,
    highlight,
    renderLink,
    externalLinks = 'same-tab',
    density = 'default',
    ...props
  },
  ref,
) {
  // `<Markdown>{a}{b}</Markdown>` arrives as an array; treat it as one string.
  const raw: string = Array.isArray(children)
    ? (children as unknown[]).filter((x) => typeof x === 'string' || typeof x === 'number').join('')
    : typeof children === 'string'
      ? children
      : '';

  const repaired = streaming || truncated ? repairStreamingMarkdown(raw) : { source: raw, openFence: false };

  let tokens: Token[];
  try {
    tokens = visible(lex(repaired.source));
  } catch {
    // The lexer refused the input: show it as the text it is.
    tokens = [{ type: 'paragraph', raw: repaired.source, text: repaired.source, tokens: [{ type: 'text', raw: repaired.source, text: repaired.source }] } as Token];
  }

  const ctx: Ctx = {
    components,
    highlight,
    renderLink,
    externalLinks,
    headingLevelStart: Math.min(6, Math.max(1, Math.round(headingLevelStart))) as MarkdownHeadingLevel,
    density,
    quote: false,
    listDepth: 0,
  };

  const last = tokens.length - 1;
  return (
    <div
      ref={ref}
      data-slot="markdown"
      data-density={density}
      data-streaming={streaming || undefined}
      data-truncated={(!streaming && truncated) || undefined}
      aria-busy={streaming || undefined}
      className={cn(markdownVariants({ density }), className)}
      {...props}
    >
      {tokens.map((token, i) => (
        // Position + kind: a block keeps its key (and its DOM) as the text
        // after it grows; only a block that changes kind remounts.
        <MarkdownBlock
          key={`${i}:${token.type}`}
          token={token}
          ctx={ctx}
          open={repaired.openFence && i === last && token.type === 'code'}
        />
      ))}
    </div>
  );
});
Markdown.displayName = 'Markdown';
