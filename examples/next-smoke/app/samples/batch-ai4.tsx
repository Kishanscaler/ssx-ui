import type { Samples } from './types';

/** Batch AI4 (ChatLayout) samples. Only the batch AI4 agent edits this file. See ./index.tsx. */
const samples: Samples = {
  // ChatLayoutDock and ChatLayoutScrollButton read ChatLayout's context (they
  // throw outside one), so one sample renders them inside it.
  ChatLayout: (ui) => (
    <div style={{ height: 480, display: 'flex', flexDirection: 'column' }}>
      <ui.ChatLayout scrollButton={<ui.ChatLayoutScrollButton />}>
        <ui.ChatMessageList aria-label="Conversation with Scaler Tutor">
          <ui.ChatMessage from="user">Why does my binary search loop forever?</ui.ChatMessage>
          <ui.ChatMessage from="assistant">Your loop condition is the off-by-one.</ui.ChatMessage>
        </ui.ChatMessageList>
        <ui.ChatLayoutDock>
          <ui.ChatComposer>
            <ui.ChatComposerInput placeholder="Ask the DSA tutor" />
            <ui.ChatComposerFooter>
              <ui.ChatComposerSend />
            </ui.ChatComposerFooter>
          </ui.ChatComposer>
        </ui.ChatLayoutDock>
      </ui.ChatLayout>
    </div>
  ),
  ChatLayoutDock: 'ChatLayout',
  ChatLayoutScrollButton: 'ChatLayout',
};

export default samples;
