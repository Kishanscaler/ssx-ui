'use client';

// Client: plays and pauses a <video> element from state.
import * as React from 'react';

/**
 * A band's clip, played like a GIF: only while its slide is on, the band on
 * screen, the tab visible and motion allowed (`playing`); paused otherwise,
 * where it holds its frame (the poster until it has played). Each time its
 * slide comes on (`active` turning true) it starts again from the top.
 *
 * `play()` returns a promise in current browsers (a rejected one when the
 * browser declines to autoplay) and nothing in old ones; both are handled.
 */
export function useBreakerClip(ref: React.RefObject<HTMLVideoElement | null>, active: boolean, playing: boolean) {
  const wasActive = React.useRef(active);

  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active && !wasActive.current) {
      try {
        video.currentTime = 0;
      } catch {
        // Not seekable yet (no metadata): it starts from the top anyway.
      }
    }
    wasActive.current = active;
  }, [ref, active]);

  React.useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (playing) {
      const started = typeof video.play === 'function' ? video.play() : undefined;
      if (started && typeof started.catch === 'function') started.catch(() => {});
    } else if (typeof video.pause === 'function') {
      video.pause();
    }
  }, [ref, playing]);
}
