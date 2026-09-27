/**
 * Public exports for batch AI2 (groundwork + ChatComposer). Only the batch AI2 agent edits this file.
 * Re-exported from src/index.ts with `export *`; add named exports here only.
 *
 * List's existing parts stay in batch O3's barrel; only the interactive-row
 * parts added by AI2 are exported here. Toolbar's new `size` prop and the
 * Button / IconButton / ToggleButton cascade need no new export.
 */
export { VisuallyHidden } from '../components/VisuallyHidden';
export type { VisuallyHiddenProps } from '../components/VisuallyHidden';

export { ListItemLink, ListItemButton, listItemTargetClass } from '../components/List';
export type { ListItemLinkProps, ListItemButtonProps, ListItemCurrent } from '../components/List';

export type { ControlSize } from '../lib/control-size';

export {
  ChatComposer,
  ChatComposerInput,
  ChatComposerSend,
  ChatComposerAttachments,
  ChatComposerAttachment,
  ChatComposerHeader,
  ChatComposerFooter,
  ChatComposerStatus,
  chatComposerVariants,
  useChatComposer,
} from '../components/ChatComposer';
export type {
  ChatComposerProps,
  ChatComposerElevation,
  ChatComposerStatusPosition,
  ChatComposerSubmitResult,
  ChatComposerContextValue,
  ChatComposerInputProps,
  ChatComposerSendProps,
  ChatComposerAttachmentsProps,
  ChatComposerAttachmentProps,
  ChatComposerAttachmentStatus,
  ChatComposerHeaderProps,
  ChatComposerFooterProps,
  ChatComposerStatusProps,
} from '../components/ChatComposer';
