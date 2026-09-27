/**
 * "use client" manifest — BATCH AI3 (AI3 (ChatMessage, ChatMessageList, ThinkingIndicator)). Only the batch AI3 agent edits this file.
 * Add the dist path (no extension) of each client module you create. See ./core.mjs.
 */
export default [
  // ChatMessage hands `onRetry` to the failed notice's Retry Button.
  'components/ChatMessage/ChatMessage',
  // Composes CopyButton, IconButton, ToggleButtonGroup and Menu with the caller's handlers.
  'components/ChatMessage/ChatMessageActions',
  // Announces the wait once, from an effect (lib/announce).
  'components/ThinkingIndicator/ThinkingIndicator',
  // Radix Collapsible.
  'components/ThinkingIndicator/ChatReasoning',
];
