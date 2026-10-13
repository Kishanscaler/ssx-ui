/**
 * "use client" manifest — the MOTION batch: the GSAP layer (src/motion) and Marquee. See ./core.mjs.
 * `motion/core`, `motion/attributes`, `motion/markup`, `motion/section`, `motion/text-reveal`, `motion/tokens.generated`
 * and the `motion/index` barrel are server-safe and must NOT carry the directive.
 */
export default [
  // gsap.context in a layout effect.
  'motion/use-motion',
  // A section's entrance (header sequence, card wipes) on useMotion, with ScrollTrigger starts.
  'motion/use-section-entrance',
  // The primitives: refs + useMotion.
  'motion/Reveal',
  'motion/Stagger',
  'motion/TextReveal',
  'motion/CountUp',
  // Plays a paused entrance by its trigger (ScrollTrigger callbacks); only runs inside useMotion.
  'motion/trigger',
  // Markup motion: an effect that lazily loads the runtime (motion/markup, server-safe).
  'motion/MotionScope',
  // Marquee: measures its row (ResizeObserver) to repeat it enough to fill the screen.
  'components/Marquee/Marquee',
  // Marquee by hand: pointer, wheel and focus listeners that move the animation's clock.
  'components/Marquee/use-marquee-scrub',
  // Marquee hover brake: eases the animation's playback rate on hover and focus.
  'components/Marquee/use-marquee-hover',
];
