// A SERVER Component: no 'use client' here. Everything is imported from the
// package root, so this build fails if the barrel breaks the client boundary
// or a server-safe atom picks up a hook.
import { Button } from '@kishanscaler/ssx-ui';

import { AllSamples } from '../../samples';

const COMBOS = [
  ['sst', 'light'],
  ['sst', 'dark'],
  ['ssb', 'light'],
  ['ssb', 'dark'],
] as const;

export default async function Page({
  params,
}: {
  params: Promise<{ brand: string; theme: string }>;
}) {
  const { brand, theme } = await params;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-6 md:p-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">@kishanscaler/ssx-ui smoke test</h1>
        <p className="text-content-secondary">
          data-brand=<code>{brand}</code> data-theme=<code>{theme}</code>
        </p>
        <nav className="flex flex-wrap gap-2">
          {COMBOS.map(([b, t]) => (
            <Button
              key={`${b}-${t}`}
              asChild
              size="sm"
              variant={b === brand && t === theme ? 'primary' : 'secondary'}
            >
              <a href={`/${b}/${t}`}>
                {b.toUpperCase()} {t}
              </a>
            </Button>
          ))}
        </nav>
      </header>

      {/* Every exported component, automatically. See app/samples. */}
      <AllSamples />

      {/* Consumer-markup checks: the `dark:` variant (bound to data-theme) and
          a custom breakpoint. Components never need either. */}
      <p data-testid="variant-probe" className="text-sm dark:font-bold md:text-md">
        This line is bold only in dark mode and larger from md (1056px) up.
      </p>
    </main>
  );
}
