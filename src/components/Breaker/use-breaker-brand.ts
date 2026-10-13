'use client';

// Client: the page's brand is read off the DOM once mounted.
import * as React from 'react';

/** The brand a page leaves unset: the default (tokens.generated.css). */
const DEFAULT_BRAND = 'sst';

/**
 * The brand for the band's dark island. A dark island needs `data-brand` AND
 * `data-theme` on ONE element (the dark tokens are declared on
 * `[data-brand][data-theme]`), so the words block repeats the page's brand
 * beside its `data-theme="dark"`.
 *
 * `brand` given: that, from the first render (server included). Otherwise the
 * nearest `data-brand` ancestor's (the document root's, failing that), read on
 * mount; until then `undefined`, so the server markup carries no guess. The
 * type inside sets its on-image inks from `data-surface-ink`, which holds
 * before the brand is read, so the first paint already reads white.
 */
export function useBreakerBrand(ref: React.RefObject<Element | null>, brand: string | undefined): string | undefined {
  const [read, setRead] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    if (brand) return;
    const el = ref.current;
    const fromAncestor = el && el.parentElement ? el.parentElement.closest('[data-brand]') : null;
    const fromRoot = typeof document !== 'undefined' ? document.documentElement : null;
    const value =
      (fromAncestor && fromAncestor.getAttribute('data-brand')) ||
      (fromRoot && fromRoot.getAttribute('data-brand')) ||
      DEFAULT_BRAND;
    setRead(value);
  }, [ref, brand]);
  return brand || read;
}
