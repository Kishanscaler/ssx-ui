import * as React from 'react';

import { cn } from '../../lib/cn';
import { Avatar, AvatarFallback, type AvatarProps } from '../Avatar';
import { Logo } from '../Logo';

/* ---------------------------------------------------------------------------
 * ChatAssistantAvatar
 *
 * The assistant's default identity: the brand monogram (whichever school the
 * page is in, from `data-brand`, with no JavaScript) in the Avatar's
 * brand-subtle circle, in the brand ink. It is what `ChatMessage
 * from="assistant"` shows when no `avatar` is passed, and what a
 * ThinkingIndicator sits beside.
 *
 * Decorative by default: the assistant's name is beside it, or the message
 * says who is speaking. Give it an `aria-label` to make it an image.
 *
 * Server component: no hooks, no handlers (Avatar is its own client leaf).
 * ------------------------------------------------------------------------- */

export type ChatAssistantAvatarProps = Omit<AvatarProps, 'children'>;

export const ChatAssistantAvatar = React.forwardRef<HTMLSpanElement, ChatAssistantAvatarProps>(
  function ChatAssistantAvatar({ className, size = 'sm', ...props }, ref) {
    return (
      <Avatar
        ref={ref}
        // Keeps Avatar's own `data-slot="avatar"`; this marks which avatar it is.
        data-avatar-kind="assistant"
        size={size}
        className={cn(className)}
        {...props}
      >
        <AvatarFallback>
          {/* Mono, so it paints in the Avatar's brand ink; ~57% of the circle. */}
          <Logo
            variant="monogram"
            tone="mono"
            decorative
            className="h-[57%] [&>svg]:h-full"
          />
        </AvatarFallback>
      </Avatar>
    );
  },
);
ChatAssistantAvatar.displayName = 'ChatAssistantAvatar';
