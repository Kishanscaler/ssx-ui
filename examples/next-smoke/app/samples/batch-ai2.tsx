import type { Samples } from './types';

/** Batch AI2 (groundwork + ChatComposer) samples. Only the batch AI2 agent edits this file. See ./index.tsx. */
const samples: Samples = {
  // The composer parts throw outside a ChatComposer (they read its context),
  // so one sample renders them all inside one. No function props: an
  // attachment without onRemove is the static chip.
  ChatComposer: (ui) => (
    <ui.ChatComposer defaultValue="Why does my binary search loop forever?">
      <ui.ChatComposerStatus tone="warning" title="Context window is 90% full" />
      <ui.ChatComposerHeader>
        <ui.Text as="span" size="xs" tone="secondary">
          DSA · Assignment 3
        </ui.Text>
      </ui.ChatComposerHeader>
      <ui.ChatComposerAttachments>
        <ui.ChatComposerAttachment>assignment-3.pdf</ui.ChatComposerAttachment>
        <ui.ChatComposerAttachment progress={40}>binary-search.py</ui.ChatComposerAttachment>
      </ui.ChatComposerAttachments>
      <ui.ChatComposerInput placeholder="Ask the DSA tutor" />
      <ui.ChatComposerFooter>
        <ui.ToolbarSpacer />
        <ui.ChatComposerSend />
      </ui.ChatComposerFooter>
    </ui.ChatComposer>
  ),
  ChatComposerInput: 'ChatComposer',
  ChatComposerSend: 'ChatComposer',
  ChatComposerAttachments: 'ChatComposer',
  ChatComposerAttachment: 'ChatComposer',
  ChatComposerHeader: 'ChatComposer',
  ChatComposerFooter: 'ChatComposer',
  ChatComposerStatus: 'ChatComposer',
};

export default samples;
