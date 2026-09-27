/**
 * Public exports for batch AI4 (ChatLayout). Only the batch AI4 agent edits this file.
 * Re-exported from src/index.ts with `export *`; add named exports here only.
 */
export {
  ChatLayout,
  chatLayoutVariants,
  ChatLayoutDock,
  ChatLayoutScrollButton,
  useChatLayout,
} from '../components/ChatLayout';
export type {
  ChatLayoutProps,
  ChatLayoutDensity,
  ChatLayoutWidth,
  ChatLayoutScrollContainer,
  ChatLayoutDockProps,
  ChatLayoutScrollButtonProps,
  ChatLayoutContextValue,
} from '../components/ChatLayout';
export { useStickToBottom } from '../lib/use-stick-to-bottom';
export type {
  UseStickToBottomOptions,
  UseStickToBottomResult,
  StickToBottomBehavior,
} from '../lib/use-stick-to-bottom';
