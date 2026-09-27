/* ---------------------------------------------------------------------------
 * The light of GlassButton under a pointer.
 *
 * Hover and press MOVE the glass exactly as they move every Button (the lift
 * and the press scale are Button's; decided 2026-09-27). What is the
 * material's own is the LIGHT, which is what Apple's glass does under a
 * finger ("the material ... glows ... around your finger"):
 *   - the specular rim turns toward the pointer (`--glass-light-angle`);
 *   - the glow sits under it (`--glass-pointer-x/y`), stronger while pressed
 *     (`data-pressed`, pointer, Space or Enter);
 *   - pressed, the lens deepens (`--glass-button-lensing-pressed`), eased in
 *     and out on a spring (`--motion-spring-liquid-*`) so the bend flows
 *     rather than snapping.
 *
 * Plain DOM, no dependency and no React state: pointer moves write custom
 * properties, and the spring runs only while the lens is settling. Under
 * reduced motion the lens does not animate (it holds its rest depth); the
 * light still follows the pointer.
 * ------------------------------------------------------------------------- */

export type LiquidOptions = {
  /** The lens depth, 1 at rest; called on every spring frame. */
  onLensing?: (factor: number) => void;
};

type Tokens = { lensingPressed: number; stiffness: number; damping: number };

function readTokens(el: HTMLElement): Tokens | null {
  const s = getComputedStyle(el);
  const n = (v: string) => parseFloat(s.getPropertyValue(v));
  const t: Tokens = {
    lensingPressed: n('--glass-button-lensing-pressed'),
    stiffness: n('--motion-spring-liquid-stiffness'),
    damping: n('--motion-spring-liquid-damping'),
  };
  return Object.values(t).every(Number.isFinite) ? t : null;
}

function reducedMotion(el: HTMLElement): boolean {
  if (el.closest('[data-motion="reduce"]')) return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Attaches the light response to a GlassButton element. Returns the cleanup. */
export function attachLiquid(el: HTMLElement, options: LiquidOptions = {}): () => void {
  const tokens = readTokens(el);
  if (!tokens) return () => {};

  const lens = { value: 1, velocity: 0, target: 1 };
  let frame = 0;
  let last = 0;

  const step = (now: number) => {
    // Clamp the step so a backgrounded tab does not explode the integration.
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const force = -tokens.stiffness * (lens.value - lens.target) - tokens.damping * lens.velocity;
    lens.velocity += force * dt;
    lens.value += lens.velocity * dt;
    if (Math.abs(lens.value - lens.target) < 1e-3 && Math.abs(lens.velocity) < 1e-3) {
      lens.value = lens.target;
      lens.velocity = 0;
      options.onLensing?.(lens.value);
      frame = 0;
      return;
    }
    options.onLensing?.(lens.value);
    frame = requestAnimationFrame(step);
  };

  const setPressed = (pressed: boolean) => {
    if (pressed) el.setAttribute('data-pressed', '');
    else el.removeAttribute('data-pressed');
    lens.target = pressed ? tokens.lensingPressed : 1;
    if (reducedMotion(el)) return;
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
  };

  const track = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    el.style.setProperty('--glass-pointer-x', `${((nx + 1) / 2) * 100}%`);
    el.style.setProperty('--glass-pointer-y', `${((ny + 1) / 2) * 100}%`);
    // conic-gradient 0deg points up; the light comes FROM the pointer.
    el.style.setProperty('--glass-light-angle', `${(Math.atan2(nx, -ny) * 180) / Math.PI}deg`);
  };

  const isIdle = () =>
    !(el as HTMLButtonElement).disabled && !el.hasAttribute('data-loading') && el.getAttribute('aria-disabled') !== 'true';

  const onMove = (e: PointerEvent) => track(e);
  const onLeave = () => {
    el.style.removeProperty('--glass-light-angle');
    if (el.hasAttribute('data-pressed')) setPressed(false);
  };
  const onDown = (e: PointerEvent) => {
    if (!isIdle()) return;
    track(e);
    setPressed(true);
  };
  const onUp = (e: PointerEvent) => {
    if (el.hasAttribute('data-pressed')) setPressed(false);
    // A touch has no hover after it: let go of the light too.
    if (e.pointerType && e.pointerType !== 'mouse') el.style.removeProperty('--glass-light-angle');
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && isIdle()) setPressed(true);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && el.hasAttribute('data-pressed')) setPressed(false);
  };

  el.addEventListener('pointerenter', onMove);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onLeave);
  el.addEventListener('keydown', onKeyDown);
  el.addEventListener('keyup', onKeyUp);
  el.addEventListener('blur', onLeave);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    el.removeEventListener('pointerenter', onMove);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerleave', onLeave);
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onLeave);
    el.removeEventListener('keydown', onKeyDown);
    el.removeEventListener('keyup', onKeyUp);
    el.removeEventListener('blur', onLeave);
    el.removeAttribute('data-pressed');
  };
}
