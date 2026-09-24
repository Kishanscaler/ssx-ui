/**
 * Samples for exports that cannot render with no props. Merged from one file
 * per batch so parallel agents never edit the same file:
 *
 *   core.js     Button, Input, Spinner (done)
 *   batch-a.js  batch A's atoms — only the batch A agent edits it
 *   batch-b.js  batch B's atoms
 *   batch-c.js  batch C's atoms
 *
 * Every PascalCase export of the package is rendered whether or not it has a
 * sample here (see ../index.js). Add one only when `<X />` alone would throw
 * or be meaningless. Each value is `(ui) => element`, or the NAME of the
 * export whose sample already renders this one.
 *
 * The same four-way split exists for the Next fixture
 * (examples/next-smoke/app/samples/) — add your atom to both.
 */
import core from './core';
import batchA from './batch-a';
import batchB from './batch-b';
import batchC from './batch-c';
import batchM1 from './batch-m1';
import batchM2 from './batch-m2';
import batchO1 from './batch-o1';
import batchM3 from './batch-m3';
import batchM4 from './batch-m4';
import batchM5 from './batch-m5';
import batchM6 from './batch-m6';
import batchO2 from './batch-o2';
import batchO3 from './batch-o3';
import batchO4 from './batch-o4';
import batchO5 from './batch-o5';

const all = [core, batchA, batchB, batchC, batchM1, batchM2, batchO1, batchM3, batchM4, batchM5, batchM6, batchO2, batchO3, batchO4, batchO5];
export const samples = {};
for (const group of all) {
  for (const name of Object.keys(group)) {
    if (name in samples) throw new Error(`Sample for ${name} is defined twice`);
    samples[name] = group[name];
  }
}
