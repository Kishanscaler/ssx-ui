/// <reference types="vite/client" />
/* ---------------------------------------------------------------------------
 * The Foundations pages' one data source: the generated files, imported as
 * text and parsed here. Vite re-evaluates this module when any of them
 * changes (`npm run sync:tokens`), so the pages never hold a stale copy.
 * ------------------------------------------------------------------------- */
import themeCss from '../../styles/theme.css?raw';
import tokensCss from '../../styles/tokens.generated.css?raw';
import auditTxt from '../_generated/audit.txt?raw';
import scalesJson from '../_generated/primitive.scales.json?raw';
import semanticJson from '../_generated/semantic.color.json?raw';
import {
  isColor,
  parseAudit,
  parseBreakpointVariants,
  parseDtcg,
  parseThemeBridge,
  parseTokens,
  parseTypeRoles,
  type ThemeKey,
} from './parse';

export const tokens = parseTokens(tokensCss);
export const bridge = parseThemeBridge(themeCss);
export const breakpointVariants = parseBreakpointVariants(themeCss);
export const typeRoles = parseTypeRoles(themeCss);
export const audit = parseAudit(auditTxt);
export const semanticDtcg = parseDtcg(semanticJson);
export const scalesDtcg = parseDtcg(scalesJson);

/** Every custom property a page may read live (semantic, primitive, responsive). */
export const allTokenNames: string[] = Array.from(
  new Set([
    ...tokens.semantic,
    ...Object.keys(tokens.primitives),
    ...tokens.responsive.flatMap((r) => Object.keys(r.values)),
  ]),
);

/** The `$description` for a token, from whichever DTCG file declares it. */
export function describeToken(name: string): string | undefined {
  return semanticDtcg.tokens[name]?.description ?? scalesDtcg.tokens[name]?.description;
}

/** Group description by dotted DTCG path (`radius`, `type.h1`, `layout.gutter`). */
export function describeGroup(path: string): string | undefined {
  return scalesDtcg.groups[path] ?? semanticDtcg.groups[path];
}

/** Every Tailwind utility that reads a token (empty: not a utility). */
export function utilitiesFor(name: string): string[] {
  return (bridge[name] ?? []).flatMap((u) => u.classes);
}

/** The value a semantic token has in one theme; a primitive's single value otherwise. */
export function valueIn(theme: ThemeKey, name: string): string | undefined {
  return tokens.themes[theme][name] ?? tokens.primitives[name];
}

const dtcgOrder = Object.keys(semanticDtcg.tokens);
const rank = (n: string) => {
  const i = dtcgOrder.indexOf(n);
  return i === -1 ? dtcgOrder.length : i;
};

/**
 * Semantic colour tokens (themed and colour-valued), in the DTCG source's
 * authored order (the stylesheet is alphabetical); unknown ones last.
 */
export const semanticColours = tokens.semantic
  .filter((n) => isColor(tokens.themes['sst-light'][n]))
  .sort((a, b) => rank(a) - rank(b));

export function pairingsFor(theme: ThemeKey, name: string) {
  return audit.pairings[theme].filter((p) => p.fg === name || p.bg === name);
}
