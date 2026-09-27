/* ---------------------------------------------------------------------------
 * A semantic colour token as a row: swatch, names, utility, description, the
 * primitive it aliases now, translucency, and its gated contrast. Shared by
 * the Colour and Borders pages.
 * ------------------------------------------------------------------------- */
import * as React from 'react';

import { Text } from '../../components/Text';
import { audit, semanticDtcg, tokens } from './data';
import { THEME_LABEL } from './parse';
import { ContrastFor, Swatch, TokenRow, useLive } from './ui';

/** Which utility prefix a developer most likely wants for this token. */
export function prefer(name: string) {
  if (/content|-fg|ink|link|placeholder|icon|on-solid/.test(name)) return 'text';
  if (/border|focus/.test(name)) return 'border';
  return 'bg';
}

const WHITE = 'var(--color-neutral-light-1)';
const BLACK = 'var(--color-neutral-dark-1)';

function Translucent({ name }: { name: string }) {
  const { theme } = useLive();
  const glass = audit.glass[theme].find((g) => g.token === name);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
        {[
          ['over the checkerboard', undefined, true],
          [`over white (${tokens.primitives['--color-neutral-light-1']})`, WHITE, false],
          [`over black (${tokens.primitives['--color-neutral-dark-1']})`, BLACK, false],
        ].map(([label, under, checker]) => (
          <li key={String(label)} className="flex items-center gap-2">
            <Swatch color={`var(${name})`} size="2rem" under={under as string | undefined} checker={checker as boolean} />
            <Text as="span" size="xs" tone="secondary">
              {label}
            </Text>
          </li>
        ))}
      </ul>
      {glass ? (
        <Text size="sm">
          Label over the worst backdrop ({THEME_LABEL[theme]}): <strong className="tabular-nums">{glass.worst.toFixed(2)}:1</strong> over {glass.over}
        </Text>
      ) : null}
    </div>
  );
}

/** An edge drawn in the token, for the Borders page. */
export function EdgeSwatch({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="block size-12 rounded-md bg-surface"
      style={{ borderStyle: 'solid', borderWidth: 'var(--border-thick)', borderColor: `var(${name})` }}
    />
  );
}

export function ColourRow({ name, edge = false }: { name: string; edge?: boolean }) {
  const { theme } = useLive();
  const entry = semanticDtcg.tokens[name];
  const alias = entry?.alias[theme];
  const translucent = /scrim|glass/.test(name) && !/highlight/.test(name);
  return (
    <TokenRow name={name} description={entry?.description} prefer={prefer(name)} visual={edge ? <EdgeSwatch name={name} /> : undefined}>
      {alias ? (
        <Text size="xs" tone="secondary">
          Alias of the primitive <span className="font-mono">{alias}</span> in {THEME_LABEL[theme]}
        </Text>
      ) : null}
      {translucent ? <Translucent name={name} /> : null}
      <ContrastFor name={name} />
    </TokenRow>
  );
}

