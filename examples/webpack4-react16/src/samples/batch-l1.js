import * as React from 'react';

/** Batch L1 (layout primitives) samples. Only the batch L1 agent edits this file. See ./index.js. */
const samples = {
  // A compound: the handle only resizes inside a group, so the parts are
  // rendered together (bare, each would render but prove nothing).
  ResizeGroup: (ui) => (
    <ui.ResizeGroup defaultValue={32}>
      <ui.ResizePane>Capstone repository</ui.ResizePane>
      <ui.ResizeHandle aria-label="Resize the capstone file tree" />
      <ui.ResizePane>SegmentTreeLazyPropagation.java</ui.ResizePane>
    </ui.ResizeGroup>
  ),
  ResizePane: 'ResizeGroup',
  ResizeHandle: 'ResizeGroup',
};

export default samples;
