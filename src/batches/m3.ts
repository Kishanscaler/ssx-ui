/**
 * Public exports for batch M3 (molecules M3). Only the batch M3 agent edits this file.
 * Re-exported from src/index.ts with `export *`; add named exports here only.
 */

/* ---------- Popover -------------------------------------------------------- */
export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  popoverContentVariants,
} from '../components/Popover';
export type {
  PopoverProps,
  PopoverTriggerProps,
  PopoverAnchorProps,
  PopoverCloseProps,
  PopoverContentProps,
  PopoverPadding,
  PopoverSide,
  PopoverAlign,
} from '../components/Popover';

/* ---------- Tooltip -------------------------------------------------------- */
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../components/Tooltip';
export type {
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
  TooltipContentProps,
  TooltipSide,
  TooltipAlign,
} from '../components/Tooltip';

/* ---------- HoverCard ------------------------------------------------------ */
export { HoverCard, HoverCardTrigger, HoverCardContent } from '../components/HoverCard';
export type {
  HoverCardProps,
  HoverCardTriggerProps,
  HoverCardContentProps,
  HoverCardSide,
  HoverCardAlign,
} from '../components/HoverCard';

/* ---------- Toast ---------------------------------------------------------- */
export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  Toaster,
  toastVariants,
  toast,
} from '../components/Toast';
export type {
  ToastProps,
  ToastProviderProps,
  ToastViewportProps,
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
  ToasterProps,
  ToastSwipeDirection,
  ToastVariant,
  ToastOptions,
  ToastActionOptions,
} from '../components/Toast';
