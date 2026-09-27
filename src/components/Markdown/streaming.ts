/* ---------------------------------------------------------------------------
 * Streaming repair (pure, no React)
 *
 * An LLM answer arrives a few characters at a time, so the string Markdown
 * renders is usually cut mid-syntax. Rendered as-is, a cut string flickers:
 * a half-typed `**` shows as two asterisks, `[docs](https://sca` shows as
 * bracket soup, a table header shows as a paragraph of pipes until its
 * delimiter row lands, and an unclosed ``` fence turns into inline text.
 *
 * `repairStreamingMarkdown` rewrites only the TAIL of the string (the last
 * block, and within it the last line) so that what renders is what the
 * finished text will render, minus what has not arrived yet:
 *
 *   - an unclosed code fence is closed (the block renders as an open
 *     CodeBlock, growing in place);
 *   - a trailing line that is only the start of a block (`-`, `1.`, `#`,
 *     `>`, a setext underline, one or two backticks, a half table row) is held
 *     back until it has content;
 *   - table rows with no delimiter row yet are held back, so the table appears
 *     once, as a table;
 *   - a half link `[text](http…` shows its text, a half image shows nothing;
 *   - an unclosed inline code span, `**`, `*`, `__`, `_` or `~~` is closed
 *     after what has arrived, or dropped when nothing has arrived after it.
 *
 * It is a heuristic, not a parser: it only ever looks at the last line of the
 * last block, and it errs towards hiding a marker for one chunk rather than
 * showing it. Earlier blocks are never touched, which is what keeps them
 * stable. Not handled: tables without a leading pipe, emphasis opened on an
 * earlier line of the same paragraph, reference-style links.
 * ------------------------------------------------------------------------- */

export type StreamingRepair = {
  /** The markdown to lex. */
  source: string;
  /** The last block is a code fence the stream has not closed yet. */
  openFence: boolean;
};

const FENCE_OPEN = /^[ \t]*(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^[ \t]*(`{3,}|~{3,})[ \t]*$/;
const BLANK = /^[ \t]*$/;

/** A delimiter row: `| :--- | ---: |`, `|---|`, `--- | ---`. */
const TABLE_DELIMITER = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

/**
 * A line that is only the START of a block, with no content yet. Shown
 * as-is, each one draws something the finished text will not have: `-`
 * under a paragraph is a setext h2, `#` is an empty heading, `1.` an empty
 * list item, one or two backticks the fence being typed.
 */
const PENDING_LINE = [
  /^[ \t]*([-*+]|\d{1,9}[.)])[ \t]*$/, // a list marker with no item text
  /^[ \t]*([-*+]|\d{1,9}[.)])[ \t]+\[[ xX]?\]?[ \t]*$/, // a task marker with no text
  /^[ \t]*[-=_*]+[ \t]*$/, // a setext underline or a thematic break in progress
  /^[ \t]*#{1,6}[ \t]*$/, // a heading marker
  /^[ \t]*>[ \t]*$/, // an empty quote line
  /^[ \t]*(`{1,2}|~{1,2})$/, // a fence being typed
  /^[ \t]*\|/, // a half table row
];

export function repairStreamingMarkdown(input: string): StreamingRepair {
  const src = input.replace(/\r\n?/g, '\n');
  // A final newline ends the last line; it does not start a blank one.
  const typing = !src.endsWith('\n');
  const lines = (typing ? src : src.slice(0, -1)).split('\n');

  // 1. Fences. Walk every line; whatever is open at the end is the tail.
  let fence: { char: string; len: number } | null = null;
  let afterFence = 0; // the first line after the last closed fence
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (fence) {
      const close = FENCE_CLOSE.exec(line);
      const run = close?.[1] ?? '';
      if (close && run[0] === fence.char && run.length >= fence.len) {
        fence = null;
        afterFence = i + 1;
      }
      continue;
    }
    const open = FENCE_OPEN.exec(line);
    const run = open?.[1] ?? '';
    // A backtick fence's info string cannot hold a backtick (CommonMark 4.5).
    if (open && !(run[0] === '`' && (open[2] ?? '').includes('`'))) {
      fence = { char: run.charAt(0), len: run.length };
    }
  }
  if (fence) {
    const closer = fence.char.repeat(fence.len);
    return { source: `${src}${src.endsWith('\n') ? '' : '\n'}${closer}`, openFence: true };
  }

  // 2. The tail block: the lines after the last blank line (and after the
  // last fence). Earlier blocks are finished and are never rewritten.
  let start = lines.length;
  while (start > afterFence && !BLANK.test(lines[start - 1] ?? '')) start -= 1;
  const head = lines.slice(0, start);
  const tail = lines.slice(start);
  if (tail.length === 0) return { source: src, openFence: false };

  // An indented code block: leave it alone.
  if (/^( {4}|\t)/.test(tail[0] ?? '') && (start === 0 || BLANK.test(lines[start - 1] ?? ''))) {
    return { source: src, openFence: false };
  }

  // 3. Hold back a last line that is only the start of a block. Only while it
  // is still being typed (no newline yet), except a table row, whose check
  // is the next step.
  const before = tail.length;
  const lastLine = () => tail[tail.length - 1] ?? '';
  if (typing && PENDING_LINE.some((re) => re.test(lastLine()))) tail.pop();

  // 4. Table rows with no delimiter row yet: hold the whole run back, so the
  // table appears once, as a table, and never as a paragraph of pipes.
  let run = tail.length;
  while (run > 0 && /^[ \t]*\|/.test(tail[run - 1] ?? '')) run -= 1;
  if (run < tail.length && !tail.slice(run).some((l) => TABLE_DELIMITER.test(l))) {
    tail.splice(run);
  }

  // 5. Inline repair on the last line (a table row is complete by now).
  if (tail.length > 0 && !/^[ \t]*\|/.test(lastLine())) {
    tail[tail.length - 1] = repairInline(lastLine());
  }

  const kept = tail.length === before;
  const out = head.concat(tail).join('\n') + (!typing && kept ? '\n' : '');
  return { source: out, openFence: false };
}

/* ---- inline --------------------------------------------------------------- */

const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
const isWordChar = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

/**
 * Masks what emphasis must not see: complete code spans, link destinations
 * and bare URLs (an underscore in a URL is not emphasis). Same length as the
 * input, so an index into the mask is an index into the line.
 */
function mask(line: string, from: number, to: number, char = 'a'): string {
  return line.slice(0, from) + char.repeat(Math.max(0, to - from)) + line.slice(to);
}

/** Complete code spans masked; the first unmatched backtick run, if any. */
function scanCode(line: string): { masked: string; open: { at: number; len: number } | null } {
  const runs: Array<{ at: number; len: number }> = [];
  const re = /`+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > 0 && line[m.index - 1] === '\\') continue;
    runs.push({ at: m.index, len: m[0].length });
  }
  let masked = line;
  for (let i = 0; i < runs.length; i += 1) {
    const opener = runs[i]!;
    const j = runs.findIndex((r, k) => k > i && r.len === opener.len);
    const closer = runs[j];
    if (!closer) return { masked, open: opener };
    masked = mask(masked, opener.at, closer.at + closer.len);
    i = j;
  }
  return { masked, open: null };
}

type Open = { at: number; closer: string };

type Delimiters = {
  /** Still open at the end of the line, outermost first. */
  opens: Open[];
  /** Where a trailing run of markers that closes nothing begins (`foo **`), or -1. */
  dangling: number;
};

/**
 * The emphasis delimiters still open at the end of the line. A rough pass
 * over CommonMark's flanking rules: a run between two spaces (`2 * 3`), a
 * list bullet, an escaped marker and an intraword underscore
 * (`binary_search`) are never delimiters.
 */
function scanDelimiters(masked: string): Delimiters {
  const stack: Array<{ char: string; len: number; at: number }> = [];
  let dangling = -1;
  const re = /(\*+|_+|~+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked))) {
    const run = m[0];
    const at = m.index;
    const char = run.charAt(0);
    if (at > 0 && masked[at - 1] === '\\') continue;
    const before = masked[at - 1];
    const after = masked[at + run.length];
    const atEnd = masked.slice(at + run.length).trim() === '';
    // A bullet: `* item` at the start of the line.
    if (char === '*' && run.length === 1 && /^[ \t]*$/.test(masked.slice(0, at)) && isSpace(after)) continue;

    const canClose = !isSpace(before) && (char !== '~' || run.length === 2);
    let left = run.length;
    // Close what the stack holds, innermost first, as far as the run reaches.
    let top = stack[stack.length - 1];
    while (canClose && left > 0 && top) {
      if (top.char !== char) break;
      const take = Math.min(top.len, left);
      top.len -= take;
      left -= take;
      if (top.len === 0) stack.pop();
      top = stack[stack.length - 1];
    }
    if (left === 0) continue;
    // Whatever is left of a run at the end of the line opens nothing yet.
    if (atEnd) {
      dangling = at + run.length - left;
      break;
    }
    if (char === '~' && run.length !== 2) continue;
    if (isSpace(before) && isSpace(after)) continue;
    if (char === '_' && isWordChar(before) && isWordChar(after)) continue;
    const canOpen = !isSpace(after) && !(char === '_' && isWordChar(before));
    if (!canOpen) continue;
    // `***` opens a strong and an emphasis; keep them as separate entries so
    // their closers come out in the right order.
    if (char === '~') stack.push({ char, len: 2, at });
    else {
      if (left >= 2) stack.push({ char, len: 2, at });
      if (left % 2 === 1) stack.push({ char, len: 1, at: at + (left >= 2 ? 2 : 0) });
    }
  }
  return { opens: stack.map((s) => ({ at: s.at, closer: s.char.repeat(s.len) })), dangling };
}

/** Masks link destinations and bare URLs: an underscore in a URL is not emphasis. */
function maskUrls(line: string): string {
  let masked = line;
  let d: RegExpExecArray | null;
  const dest = /\]\([^)]*\)/g;
  while ((d = dest.exec(masked))) masked = mask(masked, d.index + 2, d.index + d[0].length - 1);
  const url = /\b(https?:\/\/|www\.)\S+/g;
  while ((d = url.exec(masked))) masked = mask(masked, d.index, d.index + d[0].length);
  return masked;
}

const closersFor = (opens: Open[]) =>
  opens
    .slice()
    .reverse()
    .map((o) => o.closer)
    .join('');

export function repairInline(input: string): string {
  let line = input;

  // A few passes: dropping a dangling marker can expose another one
  // (`**bold _` → `**bold` → closed).
  for (let pass = 0; pass < 4; pass += 1) {
    const { masked: codeMasked, open: openCode } = scanCode(line);

    // An unclosed code span: close it after what has arrived, or drop the
    // backticks when nothing has. Emphasis opened before it closes after it.
    if (openCode) {
      const content = line.slice(openCode.at + openCode.len);
      if (content.trim() === '') {
        line = line.slice(0, openCode.at).replace(/\s+$/, '');
        continue;
      }
      const before = line.slice(0, openCode.at);
      const tick = '`'.repeat(openCode.len);
      const { opens } = scanDelimiters(maskUrls(scanCode(before).masked));
      return `${before}${tick}${content}${content.endsWith('`') ? ' ' : ''}${tick}${closersFor(opens)}`;
    }

    // A half link or image at the end of the line. Its text shows as plain
    // text (a half image shows nothing) until the `)` lands.
    const bracket = lastUnescaped(codeMasked, '[');
    if (bracket !== -1) {
      const rest = codeMasked.slice(bracket);
      const half = /^\[([^\]]*)$/.exec(rest) ?? /^\[([^\]]*)\](\([^)]*)?$/.exec(rest);
      if (half) {
        const image = bracket > 0 && line[bracket - 1] === '!';
        const label = line.slice(bracket + 1, bracket + 1 + (half[1] ?? '').length);
        line = image ? line.slice(0, bracket - 1) : line.slice(0, bracket) + label;
        continue;
      }
    }

    const { opens, dangling } = scanDelimiters(maskUrls(codeMasked));
    if (dangling !== -1) {
      line = line.slice(0, dangling).replace(/\s+$/, '');
      continue;
    }
    if (opens.length === 0) return line;
    // Close the rest after the last character that arrived. A closer must
    // touch the text (`**bold**`, not `**bold **`), so trailing space goes.
    return line.replace(/\s+$/, '') + closersFor(opens);
  }
  return line;
}

function lastUnescaped(line: string, char: string): number {
  let i = line.lastIndexOf(char);
  while (i > 0 && line[i - 1] === '\\') i = line.lastIndexOf(char, i - 1);
  return i;
}
