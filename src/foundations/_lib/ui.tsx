/* ---------------------------------------------------------------------------
 * Foundations page parts (Storybook only; never exported from the package).
 *
 * The chrome is our own components on semantic utilities. A swatch is the one
 * place that paints with `style={{ background: 'var(--token)' }}`: showing the
 * token IS the point. Every swatch has a text label beside it; colour is never
 * the only carrier.
 * ------------------------------------------------------------------------- */
import * as React from 'react';

import { Badge } from '../../components/Badge';
import { Code, CopyButton } from '../../components/Code';
import { Heading } from '../../components/Heading';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/Table';
import { Stack } from '../../components/Stack';
import { Text } from '../../components/Text';
import { allTokenNames, bridge, describeToken, pairingsFor, tokens } from './data';
import { THEMES, THEME_LABEL, isTranslucent, toPx, type Pairing, type ThemeKey } from './parse';

/* ---- live values ------------------------------------------------------------ */

export interface Live {
  /** The brand/mode the page is showing (read from the nearest `data-brand`). */
  theme: ThemeKey;
  /** `getComputedStyle` value of every token, as the browser resolves it now. */
  values: Record<string, string>;
  /** The canvas width in CSS px. */
  width: number;
  reducedMotion: boolean;
}

const LiveContext = React.createContext<Live>({
  theme: 'sst-light',
  values: {},
  width: 1024,
  reducedMotion: false,
});

export const useLive = () => React.useContext(LiveContext);

const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

function themeOf(el: Element): ThemeKey {
  const host = el.closest('[data-brand]') ?? document.documentElement;
  const brand = host.getAttribute('data-brand') === 'ssb' ? 'ssb' : 'sst';
  const themeHost = el.closest('[data-theme]');
  let mode = themeHost?.getAttribute('data-theme');
  if (mode !== 'light' && mode !== 'dark') {
    mode = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return `${brand}-${mode}` as ThemeKey;
}

function sameValues(a: Record<string, string>, b: Record<string, string>) {
  for (const k in b) if (a[k] !== b[k]) return false;
  return true;
}

export type Globals = Record<string, unknown>;

/**
 * Reads every token off the page with `getComputedStyle`, and again whenever
 * the toolbar (brand/theme), the canvas width or the motion preference
 * changes, so each "now" value follows the toolbar live.
 */
function useLiveValues(ref: React.RefObject<HTMLDivElement | null>, globals: Globals): Live {
  const [live, setLive] = React.useState<Live>(() => ({
    theme: 'sst-light',
    values: {},
    width: typeof window === 'undefined' ? 1024 : window.innerWidth,
    reducedMotion: false,
  }));

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame = 0;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const read = () => {
      const cs = getComputedStyle(el);
      const values: Record<string, string> = {};
      for (const n of allTokenNames) values[n] = cs.getPropertyValue(n).trim();
      const next: Live = {
        theme: themeOf(el),
        values,
        width: window.innerWidth,
        reducedMotion: !!motion?.matches,
      };
      setLive((prev) =>
        prev.theme === next.theme &&
        prev.width === next.width &&
        prev.reducedMotion === next.reducedMotion &&
        sameValues(prev.values, next.values)
          ? prev
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(read);
    };
    read();
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-brand', 'data-theme'] });
    const host = el.closest('[data-brand]');
    if (host) observer.observe(host, { attributes: true, attributeFilter: ['data-brand', 'data-theme'] });
    window.addEventListener('resize', schedule);
    // The canvas can settle its width after the first read without a resize
    // event (Storybook's viewport addon, a docs frame): watch the root too.
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    ro?.observe(document.documentElement);
    motion?.addEventListener?.('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
      motion?.removeEventListener?.('change', schedule);
    };
  }, [globals.brand, globals.theme]);

  return live;
}

/* ---- page ------------------------------------------------------------------- */

export function FoundationPage({
  globals,
  title,
  lede,
  children,
}: {
  globals: Globals;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const live = useLiveValues(ref, globals);
  return (
    <LiveContext.Provider value={live}>
      <div ref={ref} className="mx-auto flex w-full max-w-[72rem] min-w-0 flex-col gap-12 pb-16">
        <header className="flex flex-col gap-3">
          <Heading as="p" size="eyebrow">
            Foundations · {THEME_LABEL[live.theme]}
          </Heading>
          <Heading as="h1">{title}</Heading>
          <Text size="lg" tone="secondary" className="max-w-measure">
            {lede}
          </Text>
        </header>
        {children}
      </div>
    </LiveContext.Provider>
  );
}

export function PageSection({
  title,
  description,
  children,
  level = 'h2',
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  level?: 'h2' | 'h3';
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4">
      <Stack gap="2">
        <Heading as={level}>{title}</Heading>
        {description ? (
          <Text tone="secondary" size="sm" className="max-w-measure">
            {description}
          </Text>
        ) : null}
      </Stack>
      {children}
    </section>
  );
}

/* ---- names ------------------------------------------------------------------- */

/** A token or utility name you can copy. */
export function CopyName({ name, label, nowrap = false }: { name: string; label?: string; nowrap?: boolean }) {
  return (
    <span className={nowrap ? 'inline-flex items-center gap-1' : 'inline-flex max-w-full min-w-0 items-center gap-1'}>
      <Code className={nowrap ? 'whitespace-nowrap [overflow-wrap:normal]' : undefined}>{name}</Code>
      <CopyButton value={name} aria-label={label ?? `Copy ${name}`} />
    </span>
  );
}

/**
 * The Tailwind utility that reads a token (from theme.css), with the likeliest
 * prefix for its role (`prefer`: `text-` for an ink, `border-` for an edge).
 * A second theme name for the same token (a shadcn alias) is listed after it.
 * Unmapped: says so.
 */
export function UtilityNames({ name, prefer, nowrap = false }: { name: string; prefer?: string; nowrap?: boolean }) {
  const entries = bridge[name] ?? [];
  if (!entries.length) {
    return (
      <Badge tone="default" size="sm">
        not a utility
      </Badge>
    );
  }
  const pick = (classes: string[]) =>
    (prefer ? classes.find((c) => c.startsWith(`${prefer}-`)) : undefined) ?? classes[0]!;
  const [first, ...aliases] = entries.map((e) => pick(e.classes));
  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <CopyName name={first!} nowrap={nowrap} />
      {aliases.length ? (
        <Text as="span" size="xs" tone="secondary">
          alias {aliases.join(' · ')}
        </Text>
      ) : null}
    </span>
  );
}

/** The value as the browser resolves it now, and in all four themes. */
export function NowValue({ name }: { name: string }) {
  const { values, theme } = useLive();
  const v = values[name] || tokens.themes[theme][name] || tokens.primitives[name] || '';
  return <Code>{v}</Code>;
}

/* ---- swatches ------------------------------------------------------------------ */

/** A checkerboard, so a translucent token shows its alpha. */
export const CHECKER: React.CSSProperties = {
  backgroundColor: 'var(--surface-default)',
  backgroundImage:
    'linear-gradient(45deg, var(--border-inert) 25%, transparent 25%, transparent 75%, var(--border-inert) 75%), linear-gradient(45deg, var(--border-inert) 25%, transparent 25%, transparent 75%, var(--border-inert) 75%)',
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 6px 6px',
};

/** Swatch of a colour token. Decorative: the label beside it names it. */
export function Swatch({
  color,
  size = '3.5rem',
  checker = false,
  under,
}: {
  /** Any CSS colour, usually `var(--token)`. */
  color: string;
  size?: string;
  checker?: boolean;
  /** Paint this underneath instead of the checkerboard (`var(--color-neutral-light-1)`). */
  under?: string;
}) {
  const base: React.CSSProperties = under ? { background: under } : checker ? CHECKER : {};
  return (
    <span
      aria-hidden="true"
      className="relative inline-block shrink-0 overflow-hidden rounded-md border border-border-decorative"
      style={{ ...base, width: size, height: size === '100%' ? '2.5rem' : size }}
    >
      <span className="absolute inset-0" style={{ background: color }} />
    </span>
  );
}

/** The token's value in each of the four themes, the current one marked. */
export function ThemeValues({ name, render }: { name: string; render?: (value: string, theme: ThemeKey) => React.ReactNode }) {
  const { theme } = useLive();
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2 p-0">
      {THEMES.map((key) => {
        const v = tokens.themes[key][name] ?? '';
        const current = key === theme;
        return (
          <li
            key={key}
            className={
              current
                ? 'flex min-w-0 items-center gap-2 rounded-md border border-border-strong px-2 py-1'
                : 'flex min-w-0 items-center gap-2 rounded-md border border-border-decorative px-2 py-1'
            }
          >
            {render ? render(v, key) : <Swatch color={v} size="1.25rem" checker={isTranslucent(v)} />}
            <span className="flex min-w-0 flex-col">
              <Text as="span" size="xs" tone="secondary">
                {THEME_LABEL[key]}
                {current ? ' (now)' : ''}
              </Text>
              <Text as="span" size="xs" className="font-mono">
                {v}
              </Text>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ---- contrast --------------------------------------------------------------------- */

const STATUS_TEXT = { PASS: 'PASS', FAIL: 'FAIL', EXCP: 'Hover exception' } as const;
const STATUS_TONE = { PASS: 'success', FAIL: 'danger', EXCP: 'warning' } as const;

export function StatusBadge({ pairing }: { pairing: Pairing }) {
  return (
    <Badge tone={STATUS_TONE[pairing.status]} size="sm">
      {STATUS_TEXT[pairing.status]}
    </Badge>
  );
}

/**
 * A pairing drawn as a picture: "Aa" in the foreground on the background, or a
 * ring for a 1.4.11 boundary. SVG and aria-hidden on purpose: the ratio and the
 * names are the text beside it. (A declared hover exception is below 4.5:1 by
 * decision; drawn as live text it would be reported as a new failure.)
 */
export function PairChip({ pairing }: { pairing: Pick<Pairing, 'fg' | 'bg' | 'nonText'> }) {
  const bgTranslucent = /scrim|glass/.test(pairing.bg);
  return (
    <svg width="44" height="28" viewBox="0 0 44 28" aria-hidden="true" focusable="false" className="shrink-0">
      {bgTranslucent ? <rect x="0" y="0" width="44" height="28" rx="4" style={{ fill: 'var(--color-neutral-light-1)' }} /> : null}
      <rect
        x="0.5"
        y="0.5"
        width="43"
        height="27"
        rx="4"
        style={{ fill: `var(${pairing.bg})`, stroke: 'var(--border-decorative)' }}
      />
      {pairing.nonText ? (
        <rect x="10" y="7" width="24" height="14" rx="3" style={{ fill: 'none', stroke: `var(${pairing.fg})`, strokeWidth: 2 }} />
      ) : (
        <text
          x="22"
          y="19"
          textAnchor="middle"
          style={{ fill: `var(${pairing.fg})`, fontFamily: 'var(--font-family-sans)', fontSize: 14, fontWeight: 600 }}
        >
          Aa
        </text>
      )}
    </svg>
  );
}

/** "content-secondary on surface-tray — 5.68:1 PASS", as one line. */
export function PairingLine({ pairing, subject }: { pairing: Pairing; subject?: string }) {
  const fg = pairing.fg === subject ? 'this' : pairing.fg.slice(2);
  const bg = pairing.bg === subject ? 'this' : pairing.bg.slice(2);
  return (
    <li className="flex min-w-0 items-center gap-2">
      <PairChip pairing={pairing} />
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
        <Text as="span" size="sm">
          <span className="font-mono">{fg}</span> on <span className="font-mono">{bg}</span>
        </Text>
        <Text as="span" size="sm" className="font-semibold tabular-nums">
          {pairing.ratio.toFixed(2)}:1
        </Text>
        <Text as="span" size="xs" tone="secondary">
          min {pairing.min}
          {pairing.nonText ? ' (UI boundary, 1.4.11)' : ''}
        </Text>
        <StatusBadge pairing={pairing} />
      </span>
    </li>
  );
}

/** The gated pairings a token takes part in, in the current theme. */
export function ContrastFor({ name }: { name: string }) {
  const { theme } = useLive();
  const list = pairingsFor(theme, name);
  if (!list.length) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Text as="span" size="xs" tone="secondary">
        Gated contrast, {THEME_LABEL[theme]} (audit.txt)
      </Text>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {list.map((p, i) => (
          <PairingLine key={`${p.fg}-${p.bg}-${i}`} pairing={p} subject={name} />
        ))}
      </ul>
    </div>
  );
}

/* ---- a token as a row --------------------------------------------------------------- */

/**
 * One token: visual, names, utilities, description, the live value. `visual`
 * defaults to a colour swatch.
 */
export function TokenRow({
  name,
  description,
  visual,
  prefer,
  children,
  hideThemes = false,
}: {
  name: string;
  description?: string;
  visual?: React.ReactNode;
  prefer?: string;
  children?: React.ReactNode;
  hideThemes?: boolean;
}) {
  const { theme } = useLive();
  const themed = name in tokens.themes[theme];
  return (
    <li className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-border-decorative py-4 last:border-b-0">
      <div>{visual ?? <Swatch color={`var(${name})`} checker={isTranslucent(tokens.themes[theme][name])} />}</div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <CopyName name={name} />
          <UtilityNames name={name} prefer={prefer} />
        </div>
        {description ? (
          <Text size="sm" tone="secondary" className="max-w-measure">
            {description}
          </Text>
        ) : null}
        <Text size="sm">
          Now: <NowValue name={name} />
        </Text>
        {themed && !hideThemes ? <ThemeValues name={name} /> : null}
        {children}
      </div>
    </li>
  );
}

export function TokenList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 flex min-w-0 list-none flex-col p-0">{children}</ul>;
}

/* ---- a scale as a table ------------------------------------------------------------ */

/** `1.25rem` → `1.25rem · 20px`; anything else unchanged. */
export function withPx(value: string) {
  const px = toPx(value);
  return px !== null && !value.endsWith('px') ? `${value} · ${px}px` : value;
}

/**
 * A non-colour scale (radius, z-index, weights…): token, utility, the value
 * now, a sample, and the source's description. Scrolls inside itself when
 * narrow.
 */
export function ScaleTable({
  caption,
  names,
  sample,
  sampleHead = 'Sample',
  prefer,
}: {
  caption: string;
  /** Utility prefix to show first (`h` for a control height). */
  prefer?: string;
  names: string[];
  sample?: (name: string) => React.ReactNode;
  sampleHead?: string;
}) {
  const { values } = useLive();
  return (
    <Table density="compact" scrollLabel={caption}>
      <TableCaption visuallyHidden>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Token</TableHead>
          <TableHead>Utility</TableHead>
          <TableHead>Value</TableHead>
          {sample ? <TableHead>{sampleHead}</TableHead> : null}
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {names.map((n) => (
          <TableRow key={n}>
            <TableCell>
              <CopyName name={n} nowrap />
            </TableCell>
            <TableCell>
              <UtilityNames name={n} prefer={prefer} nowrap />
            </TableCell>
            <TableCell>
              <span className="font-mono text-sm whitespace-nowrap">{withPx(values[n] || tokens.primitives[n] || '')}</span>
            </TableCell>
            {sample ? <TableCell>{sample(n)}</TableCell> : null}
            <TableCell>
              <Text as="span" size="sm" tone="secondary">
                {describeToken(n) ?? '—'}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Sort token names by their px value (lengths), else numerically, else by name. */
export function byValue(a: string, b: string) {
  const va = tokens.primitives[a] ?? '';
  const vb = tokens.primitives[b] ?? '';
  const na = toPx(va) ?? (Number.isFinite(Number.parseFloat(va)) ? Number.parseFloat(va) : Number.POSITIVE_INFINITY);
  const nb = toPx(vb) ?? (Number.isFinite(Number.parseFloat(vb)) ? Number.parseFloat(vb) : Number.POSITIVE_INFINITY);
  return na - nb || a.localeCompare(b);
}
