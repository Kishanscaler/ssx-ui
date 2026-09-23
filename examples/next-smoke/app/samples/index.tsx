/**
 * Renders EVERY PascalCase export of @kishanscaler/ssx-ui, in a Server Component.
 *
 * Coverage is automatic: a new atom exported from the package is rendered
 * here with no props, and `next build` fails if that throws during prerender
 * (a hook in a server atom, a client part rendered outside its root, ...).
 * scripts/smoke.mjs then checks each one produced a [data-slot] element.
 *
 * An export that cannot render bare gets a sample in its batch's file:
 *   core.tsx     Button, Input, Spinner (done)
 *   batch-a.tsx  only the batch A agent edits it
 *   batch-b.tsx  batch B
 *   batch-c.tsx  batch C
 * The same split exists in examples/webpack4-react16/src/samples/ — add your
 * atom to both.
 */
import type * as React from 'react';
import * as ui from '@kishanscaler/ssx-ui';

import batchA from './batch-a';
import batchB from './batch-b';
import batchC from './batch-c';
import core from './core';
import type { Sample } from './types';

const samples: Record<string, Sample | undefined> = {};
for (const group of [core, batchA, batchB, batchC]) {
  for (const [name, sample] of Object.entries(group)) {
    if (name in samples) throw new Error(`Sample for ${name} is defined twice`);
    samples[name] = sample;
  }
}

const components = Object.keys(ui)
  .filter((name) => /^[A-Z]/.test(name))
  .sort();

export function AllSamples() {
  return (
    <>
      {components.map((name) => {
        const sample = samples[name];
        if (typeof sample === 'string') {
          return <div key={name} hidden data-sample={name} data-covered-by={sample} />;
        }
        let content: React.ReactNode;
        if (typeof sample === 'function') {
          content = sample(ui);
        } else {
          const Component = (ui as unknown as Record<string, React.ElementType>)[name]!;
          content = <Component />;
        }
        return (
          <section key={name} data-sample={name} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{name}</h2>
            <div className="flex flex-wrap items-center gap-3">{content}</div>
          </section>
        );
      })}
    </>
  );
}
