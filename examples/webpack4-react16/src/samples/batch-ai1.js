import * as React from 'react';

/** Batch AI1 (Markdown) samples. Only the batch AI1 agent edits this file. See ./index.js. */
const md = [
  '## Binary search',
  '',
  'Halve the **sorted** range each step. See [Module 6](/academy/modules/6).',
  '',
  '- `lo` and `hi` bound the range',
  '- [x] Revise the invariant',
  '',
  '```python',
  'mid = lo + (hi - lo) // 2',
  '```',
  '',
  '| n | Comparisons |',
  '|:--|--:|',
  '| 1,000 | 10 |',
  '| 1,000,000 | 20 |',
].join('\n');

const samples = {
  // A markdown string is required: bare, Markdown renders an empty div.
  Markdown: (ui) => <ui.Markdown>{md}</ui.Markdown>,
};

export default samples;
