/* ---------------------------------------------------------------------------
 * Foundations parsers (Storybook only; nothing here ships in the package).
 *
 * Every Foundations page is DERIVED from four generated files, never typed in:
 *
 *   tokens.generated.css   every token, per brand/mode block      parseTokens()
 *   theme.css              which tokens are Tailwind utilities     parseThemeBridge()
 *                          and the `type-*` role utilities         parseTypeRoles()
 *   audit.txt              the contrast gate's report              parseAudit()
 *   *.json (DTCG)          $description and alias targets          parseDtcg()
 *
 * A token added in the pipeline appears on the pages with no edit here.
 * Pure functions over strings, so they are unit-tested (parse.test.ts).
 * ------------------------------------------------------------------------- */

export type ThemeKey = 'sst-light' | 'sst-dark' | 'ssb-light' | 'ssb-dark';
export const THEMES: ThemeKey[] = ['sst-light', 'sst-dark', 'ssb-light', 'ssb-dark'];
export const THEME_LABEL: Record<ThemeKey, string> = {
  'sst-light': 'SST light',
  'sst-dark': 'SST dark',
  'ssb-light': 'SSB light',
  'ssb-dark': 'SSB dark',
};

/* ---- tokens.generated.css ------------------------------------------------- */

interface Block {
  /** The rule's selector, whitespace-collapsed. */
  selector: string;
  /** Enclosing at-rule preludes, outermost first (`@media (min-width: 672px)`). */
  at: string[];
  decls: Array<[name: string, value: string]>;
}

/** Splits a stylesheet into rule blocks with their custom-property declarations. */
export function cssBlocks(css: string): Block[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks: Block[] = [];
  const stack: Array<{ prelude: string; block?: Block }> = [];
  let buf = '';
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]!;
    if (ch === '{') {
      const prelude = buf.trim().replace(/\s+/g, ' ');
      buf = '';
      if (prelude.startsWith('@')) {
        stack.push({ prelude });
      } else {
        const block: Block = {
          selector: prelude,
          at: stack.filter((s) => !s.block).map((s) => s.prelude),
          decls: [],
        };
        blocks.push(block);
        stack.push({ prelude, block });
      }
    } else if (ch === '}') {
      flushDecl(buf, stack);
      buf = '';
      stack.pop();
    } else if (ch === ';') {
      flushDecl(buf, stack);
      buf = '';
    } else {
      buf += ch;
    }
  }
  return blocks;
}

function flushDecl(text: string, stack: Array<{ block?: Block }>) {
  const m = /^\s*(--[A-Za-z0-9_\\.-]+)\s*:\s*([\s\S]*?)\s*$/.exec(text);
  if (!m) return;
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const b = stack[i]!.block;
    if (b) {
      b.decls.push([m[1]!, m[2]!.replace(/\s+/g, ' ')]);
      return;
    }
  }
}

export interface TokenSet {
  /** Semantic (themed) token names, in the order the default block declares them. */
  semantic: string[];
  /** Resolved value of every semantic token, per theme. */
  themes: Record<ThemeKey, Record<string, string>>;
  /** Everything declared once on `:root` and never themed: primitives and scales. */
  primitives: Record<string, string>;
  /**
   * Tokens that change at a width (`@media (min-width: …) { :root { … } }`):
   * the min-width in px, and the values from there up.
   */
  responsive: Array<{ minWidth: number; values: Record<string, string> }>;
  /** Values under `prefers-reduced-motion: reduce`. */
  reducedMotion: Record<string, string>;
}

function attrsOf(compound: string) {
  const brand = /\[data-brand="?([a-z0-9]+)"?\]/.exec(compound)?.[1];
  const theme = /\[data-theme="?([a-z]+)"?\]/.exec(compound)?.[1];
  const count = (compound.match(/\[/g) ?? []).length;
  return { brand, theme, count };
}

/**
 * Reads the generated token stylesheet. The four themes are resolved the way
 * the browser would for `<html data-brand=… data-theme=…>`: `:root` first,
 * then every explicit attribute rule that matches, by specificity then order.
 * The `prefers-color-scheme` copies are skipped (they repeat the dark blocks
 * for an unpinned page).
 */
export function parseTokens(css: string): TokenSet {
  const blocks = cssBlocks(css);
  const rootBlocks = blocks.filter((b) => b.selector === ':root' && b.at.length === 0);
  const root: Record<string, string> = {};
  for (const b of rootBlocks) for (const [n, v] of b.decls) root[n] = v;

  const themed = blocks.filter(
    (b) => b.at.length === 0 && /\[data-(brand|theme)=/.test(b.selector),
  );
  const semanticSet = new Set<string>();
  for (const b of themed) for (const [n] of b.decls) semanticSet.add(n);
  const semantic = Object.keys(root).filter((n) => semanticSet.has(n));
  for (const n of semanticSet) if (!semantic.includes(n)) semantic.push(n);

  const themes = {} as TokenSet['themes'];
  for (const key of THEMES) {
    const [brand, mode] = key.split('-') as [string, string];
    const matches: Array<{ count: number; order: number; block: Block }> = [];
    themed.forEach((block, order) => {
      let best = -1;
      for (const compound of block.selector.split(',')) {
        const a = attrsOf(compound);
        if (a.brand && a.brand !== brand) continue;
        if (a.theme && a.theme !== mode) continue;
        // `[data-brand="sst"]`-less rules are the default brand's only when
        // they name no brand; a rule for another brand never applies.
        best = Math.max(best, a.count);
      }
      if (best >= 0) matches.push({ count: best, order, block });
    });
    matches.sort((x, y) => x.count - y.count || x.order - y.order);
    const values: Record<string, string> = {};
    for (const n of semantic) if (root[n] !== undefined) values[n] = root[n]!;
    for (const m of matches) for (const [n, v] of m.block.decls) values[n] = v;
    themes[key] = values;
  }

  const primitives: Record<string, string> = {};
  for (const [n, v] of Object.entries(root)) if (!semanticSet.has(n)) primitives[n] = v;

  const responsive: TokenSet['responsive'] = [];
  const reducedMotion: Record<string, string> = {};
  for (const b of blocks) {
    if (b.selector !== ':root' || b.at.length !== 1) continue;
    const at = b.at[0]!;
    const mw = /min-width:\s*([\d.]+)px/.exec(at);
    if (mw) {
      responsive.push({ minWidth: Number(mw[1]), values: Object.fromEntries(b.decls) });
    } else if (/prefers-reduced-motion/.test(at)) {
      Object.assign(reducedMotion, Object.fromEntries(b.decls));
    }
  }
  responsive.sort((a, b) => a.minWidth - b.minWidth);
  return { semantic, themes, primitives, responsive, reducedMotion };
}

/** Names with a prefix, from a record, in the record's order. */
export function withPrefix(record: Record<string, string>, prefix: string): string[] {
  return Object.keys(record).filter((n) => n.startsWith(prefix));
}

/* ---- theme.css ------------------------------------------------------------ */

export interface Utility {
  /** Tailwind theme namespace (`color`, `spacing`, `radius`, …). */
  namespace: string;
  /** The key inside it (`surface-raised`, `4`, `control-md`). */
  key: string;
  /** The utilities a developer writes (`bg-surface-raised`, …), most likely first. */
  classes: string[];
}

/** Namespaces the bridge uses → the utility prefixes Tailwind derives from them. */
const NAMESPACES: Array<[ns: string, prefixes: string[]]> = [
  ['font-weight', ['font']],
  ['z-index', ['z']],
  ['color', ['bg', 'text', 'border']],
  ['spacing', ['p', 'gap', 'm', 'w', 'h', 'size']],
  ['container', ['max-w']],
  ['text', ['text']],
  ['font', ['font']],
  ['tracking', ['tracking']],
  ['leading', ['leading']],
  ['radius', ['rounded']],
  ['ease', ['ease']],
  ['shadow', ['shadow']],
  ['opacity', ['opacity']],
  ['animate', ['animate']],
];

/**
 * The `@theme inline` bridge: which token each utility reads. A token with no
 * entry here is deliberately not a utility (the colour primitives).
 * Returns token name (`--surface-raised`) → its utilities.
 */
export function parseThemeBridge(css: string): Record<string, Utility[]> {
  const out: Record<string, Utility[]> = {};
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /@theme\s+inline\s*\{/g;
  while (re.exec(src)) {
    // Walk to the matching brace; nested @keyframes are skipped by depth.
    let depth = 1;
    let i = re.lastIndex;
    let body = '';
    for (; i < src.length && depth > 0; i += 1) {
      const ch = src[i]!;
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      if (depth === 1 && ch !== '}') body += ch;
      else if (depth === 1 && ch === '}') body += ';';
    }
    for (const decl of body.split(';')) {
      const d = /^\s*--([A-Za-z0-9_\\.-]+)\s*:\s*var\((--[A-Za-z0-9-]+)\)\s*$/.exec(decl);
      if (!d) continue;
      const themeName = d[1]!.replace(/\\/g, '');
      const token = d[2]!;
      const ns = NAMESPACES.find(([n]) => themeName.startsWith(`${n}-`));
      if (!ns) continue;
      const key = themeName.slice(ns[0].length + 1);
      const classes = ns[1].map((p) => `${p}-${key}`);
      (out[token] ??= []).push({ namespace: ns[0], key, classes });
    }
  }
  return out;
}

/** The literal breakpoints from theme.css's plain `@theme` (the `sm:` variants). */
export function parseBreakpointVariants(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of src.matchAll(/--breakpoint-([a-z0-9]+):\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim();
  return out;
}

export interface TypeRole {
  /** The utility, `type-h1`. */
  name: string;
  /** CSS property → value (`font-size` → `var(--type-h1-size)`). */
  declarations: Array<[prop: string, value: string]>;
}

/** Every `@utility type-*` in theme.css, in source order. */
export function parseTypeRoles(css: string): TypeRole[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: TypeRole[] = [];
  for (const m of src.matchAll(/@utility\s+(type-[a-z0-9-]+)\s*\{([^}]*)\}/g)) {
    const declarations = m[2]!
      .split(';')
      .map((d) => /^\s*([a-z-]+)\s*:\s*(.+?)\s*$/.exec(d))
      .filter((d): d is RegExpExecArray => d !== null)
      .map((d) => [d[1]!, d[2]!] as [string, string]);
    out.push({ name: m[1]!, declarations });
  }
  return out;
}

/* ---- audit.txt ------------------------------------------------------------ */

export type AuditStatus = 'PASS' | 'FAIL' | 'EXCP';

export interface Pairing {
  status: AuditStatus;
  ratio: number;
  min: number;
  /** What the pairing is ("secondary text on the tray"). */
  label: string;
  /** Foreground and background as CSS custom properties (`--content-secondary`). */
  fg: string;
  bg: string;
  /** Gated as a UI boundary (WCAG 1.4.11, 3:1) rather than as text. */
  nonText: boolean;
  /** The declared-exception note (`declared, 2026-09-23`), when there is one. */
  note?: string;
}

export interface GlassRow {
  token: string;
  worst: number;
  over: string;
}

export interface ScrimRow {
  /** The token dimmed by the modal veil (`--surface-page`). */
  token: string;
  from: string;
  to: string;
}

export interface Audit {
  pairings: Record<ThemeKey, Pairing[]>;
  /** OVERLAY SCRIM: what each role becomes under the veil, per theme. */
  scrim: Record<ThemeKey, ScrimRow[]>;
  /** OVERLAY SCRIM: the panel-vs-dimmed-page lines, as the gate printed them. */
  scrimNotes: Record<ThemeKey, string[]>;
  glass: Record<ThemeKey, GlassRow[]>;
  /** The DECLARED EXCEPTIONS footer, line by line. */
  exceptions: string[];
}

/** `content.linkInverseHover` → `--content-link-inverse-hover`. */
export function dotToVar(path: string): string {
  return `--${path
    .split('.')
    .map((seg) => seg.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))
    .join('-')}`;
}

const THEME_HEAD = /^\s*(SST|SSB)\s*\/\s*(LIGHT|DARK)\s*$/;
const PAIR =
  /^\s*(PASS|FAIL|EXCP)\s+([\d.]+):1\s+\(min ([\d.]+)\)\s+(.*?)\s+([A-Za-z0-9]+\.[A-Za-z0-9.]+) on ([A-Za-z0-9]+\.[A-Za-z0-9.]+)(?:\s+\[([^\]]+)\])?\s*$/;
const TAGGED = /^\s*((?:sst|ssb)-(?:light|dark))\s+(.*)$/;

function emptyByTheme<T>(): Record<ThemeKey, T[]> {
  return { 'sst-light': [], 'sst-dark': [], 'ssb-light': [], 'ssb-dark': [] };
}

export function parseAudit(text: string): Audit {
  const pairings = emptyByTheme<Pairing>();
  const scrim = emptyByTheme<ScrimRow>();
  const scrimNotes = emptyByTheme<string>();
  const glass = emptyByTheme<GlassRow>();
  const exceptions: string[] = [];
  let theme: ThemeKey | null = null;
  let section: 'pairs' | 'scrim' | 'glass' | 'exceptions' | null = null;

  for (const line of text.split(/\r?\n/)) {
    const head = THEME_HEAD.exec(line);
    if (head) {
      theme = `${head[1]!.toLowerCase()}-${head[2]!.toLowerCase()}` as ThemeKey;
      section = 'pairs';
      continue;
    }
    if (/^OVERLAY SCRIM/.test(line)) section = 'scrim';
    else if (/^GLASS/.test(line)) section = 'glass';
    else if (/^DECLARED EXCEPTIONS/.test(line)) {
      section = 'exceptions';
      exceptions.push(line.trim());
      continue;
    }
    if (section === 'pairs' && theme) {
      const p = PAIR.exec(line);
      if (!p) continue;
      const rawLabel = p[4]!;
      pairings[theme].push({
        status: p[1] as AuditStatus,
        ratio: Number(p[2]),
        min: Number(p[3]),
        label: rawLabel.replace(/\s*\[1\.4\.11\]\s*/, ' ').trim(),
        fg: dotToVar(p[5]!),
        bg: dotToVar(p[6]!),
        nonText: /\[1\.4\.11\]/.test(rawLabel),
        note: p[7],
      });
    } else if (section === 'scrim') {
      const t = TAGGED.exec(line);
      if (!t) continue;
      const dim = /^([A-Za-z0-9]+\.[A-Za-z0-9.]+)\s+(#[0-9A-Fa-f]+)\s*->\s*(#[0-9A-Fa-f]+)\s*$/.exec(t[2]!);
      if (dim) scrim[t[1] as ThemeKey].push({ token: dotToVar(dim[1]!), from: dim[2]!, to: dim[3]! });
      else scrimNotes[t[1] as ThemeKey].push(t[2]!.trim().replace(/\s{3,}/g, ' · ').replace(/\s+/g, ' '));
    } else if (section === 'glass') {
      const t = TAGGED.exec(line);
      const g = t && /^([A-Za-z0-9.]+)\s+worst\s+([\d.]+):1\s+over\s+(.+?)\s*$/.exec(t[2]!);
      if (t && g) glass[t[1] as ThemeKey].push({ token: dotToVar(g[1]!), worst: Number(g[2]), over: g[3]! });
    } else if (section === 'exceptions' && line.trim()) {
      exceptions.push(line.trim());
    }
  }
  return { pairings, scrim, scrimNotes, glass, exceptions };
}

/* ---- DTCG json ------------------------------------------------------------ */

export interface DtcgEntry {
  /** Dotted source path (`surface.raisedHover`). */
  path: string;
  description?: string;
  /** Per theme for semantic tokens (`{color.neutral.light.1}` → `neutral.light.1`); `default` otherwise. */
  alias: Partial<Record<ThemeKey | 'default', string>>;
}

export interface Dtcg {
  /** CSS custom property → its entry. */
  tokens: Record<string, DtcgEntry>;
  /** Group descriptions, keyed by the dotted group path (`radius`, `type.h1`). */
  groups: Record<string, string>;
}

type Json = { [k: string]: unknown };
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Reads a DTCG file. Semantic files nest the tokens under a theme key
 * (`semantic["sst-light"].surface.page`); scale files do not. Both end up
 * keyed by the CSS custom property the build emits.
 */
export function parseDtcg(json: string): Dtcg {
  const data = JSON.parse(json) as Json;
  const tokens: Dtcg['tokens'] = {};
  const groups: Dtcg['groups'] = {};
  const walk = (node: Json, path: string[], theme: ThemeKey | 'default') => {
    if ('$value' in node) {
      const dotted = path.join('.');
      const name = dotToVar(dotted);
      const entry = (tokens[name] ??= { path: dotted, alias: {} });
      if (!entry.description && typeof node.$description === 'string') entry.description = node.$description;
      const v = node.$value;
      if (typeof v === 'string' && /^\{.+\}$/.test(v)) entry.alias[theme] = v.slice(1, -1).replace(/^color\./, '');
      return;
    }
    if (path.length && typeof node.$description === 'string') groups[path.join('.')] ??= node.$description;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$') || !isObj(v)) continue;
      if (path.length === 0 && (THEMES as string[]).includes(k)) walk(v, [], k as ThemeKey);
      else if (path.length === 0 && k === 'semantic') walk(v, [], theme);
      else walk(v, [...path, k], theme);
    }
  };
  walk(data, [], 'default');
  return { tokens, groups };
}

/* ---- values ---------------------------------------------------------------- */

/** px for a rem/px/ch-free length at a 16px root; null when not a length. */
export function toPx(value: string): number | null {
  const m = /^(-?[\d.]+)(px|rem)$/.exec(value.trim());
  if (!m) return null;
  return m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
}

export function isColor(value: string | undefined): boolean {
  return !!value && /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|transparent$)/i.test(value.trim());
}

/** True when a colour carries alpha (8-digit hex, rgba with a < 1). */
export function isTranslucent(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  const hex = /^#([0-9a-f]{8}|[0-9a-f]{4})$/i.exec(v);
  if (hex) {
    const alpha = hex[1]!.length === 8 ? hex[1]!.slice(6) : hex[1]!.slice(3);
    return alpha.toLowerCase() !== (alpha.length === 2 ? 'ff' : 'f');
  }
  const rgba = /^rgba\([^)]*,\s*([\d.]+)\s*\)$/.exec(v);
  return !!rgba && Number(rgba[1]) < 1;
}

/** Splits a comma list at the top level (not inside parentheses): shadow layers. */
export function splitTopLevel(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** `cubic-bezier(0.2, 0, 0.38, 0.9)` → [0.2, 0, 0.38, 0.9]. */
export function parseBezier(value: string): [number, number, number, number] | null {
  const m = /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(value);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] : null;
}

/** Natural sort on a token name's trailing scale step (`space-0-5` < `space-1` < `space-10`). */
export function byNumericSuffix(a: string, b: string): number {
  const num = (s: string) => {
    const m = /-(\d+)(?:-(\d+))?$/.exec(s);
    return m ? Number(m[1]) + (m[2] ? Number(`0.${m[2]}`) : 0) : Number.NaN;
  };
  const x = num(a);
  const y = num(b);
  if (Number.isNaN(x) || Number.isNaN(y)) return Number.isNaN(x) === Number.isNaN(y) ? 0 : Number.isNaN(x) ? 1 : -1;
  return x - y;
}
