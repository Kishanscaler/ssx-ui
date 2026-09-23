/* ---------------------------------------------------------------------------
 * announce — one polite live region for the whole package
 *
 * `aria-busy` on a button is, in practice, silent: most screen readers do not
 * speak a change to it. So when a `Button` starts loading it announces the
 * wait here, once, and withdraws the message when the wait ends.
 *
 * WHY ONE SHARED REGION, NOT ONE PER BUTTON:
 *   - Inside the button it cannot work. A button's children are presentational
 *     in the accessibility tree (Chromium flattens them into the name), so a
 *     live region nested in one is not reliably announced, and any text it
 *     holds is appended to the button's accessible name ("Save Loading").
 *   - Beside the button it would change the DOM a consumer styles:
 *     `ButtonGroup` rounds its first and last child, and a hidden sibling
 *     becomes one of them.
 *   - Outside React it is SSR-safe by construction: nothing is rendered on the
 *     server, so there is nothing to mismatch on hydration. The node is created
 *     on the client when the first Button MOUNTS (`ensureAnnouncer`, from an
 *     effect), empty, and then kept for the life of the page — so the region is
 *     already in the accessibility tree, idle, long before anything is written
 *     to it, which is the pattern every screen reader handles. Only its text
 *     changes after that.
 *
 * THE TIMING. A live region that is inserted and filled in the same tick is
 * skipped by several screen readers (Safari + VoiceOver most reliably), so the
 * text is always written FILL_DELAY after the region is cleared. The same delay
 * also coalesces: every call inside the window replaces the pending message, so
 * three buttons that start loading together are announced once, not three
 * times. The message is cleared again after CLEAR_AFTER so a virtual cursor
 * reading the page later does not find a stale "Loading" at the end of it.
 *
 * Plain DOM and `setTimeout` only — nothing React-version specific, so it
 * behaves the same on 16.12 as on 19.
 * ------------------------------------------------------------------------- */

const ATTR = 'data-ssx-announcer';
const FILL_DELAY = 100;
const CLEAR_AFTER = 7000;

let node: HTMLElement | null = null;
let owner = 0;
let seq = 0;
let fillTimer: ReturnType<typeof setTimeout> | undefined;
let clearTimer: ReturnType<typeof setTimeout> | undefined;

/** The region, created on first use. `null` where there is no DOM (SSR). */
function region(): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  if (node && node.isConnected) return node;
  let el = document.querySelector<HTMLElement>(`[${ATTR}]`);
  if (!el) {
    el = document.createElement('div');
    el.setAttribute(ATTR, '');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    // Visually hidden, still in the accessibility tree. Inline, so it holds
    // even where the package stylesheet has not loaded.
    el.style.cssText =
      'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;' +
      'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;';
    document.body.appendChild(el);
  }
  node = el;
  return el;
}

function stopTimers() {
  if (fillTimer !== undefined) clearTimeout(fillTimer);
  if (clearTimer !== undefined) clearTimeout(clearTimer);
  fillTimer = undefined;
  clearTimer = undefined;
}

/**
 * Put the (empty) region in the page ahead of any announcement. Called from
 * Button's mount effect, so it never runs on the server. Idempotent: one region
 * per document however many Buttons mount.
 */
export function ensureAnnouncer(): void {
  region();
}

/**
 * Announce `message` politely. Returns a ticket for `withdraw`. INTERNAL: not
 * exported from the package.
 */
export function announce(message: string): number {
  const el = region();
  if (!el || !message) return 0;
  seq += 1;
  const ticket = seq;
  owner = ticket;
  stopTimers();
  el.textContent = '';
  fillTimer = setTimeout(() => {
    fillTimer = undefined;
    if (owner !== ticket) return;
    el.textContent = message;
    clearTimer = setTimeout(() => {
      clearTimer = undefined;
      if (owner === ticket) {
        el.textContent = '';
        owner = 0;
      }
    }, CLEAR_AFTER);
  }, FILL_DELAY);
  return ticket;
}

/**
 * Take back an announcement: cancel it if it has not been written yet, clear it
 * if it has. A no-op when a later announcement has replaced it, so one button
 * finishing cannot silence another that is still waiting.
 */
export function withdraw(ticket: number): void {
  if (!ticket || ticket !== owner) return;
  owner = 0;
  stopTimers();
  if (node) node.textContent = '';
}

/** The region's selector, for tests. */
export const ANNOUNCER_SELECTOR = `[${ATTR}]`;
