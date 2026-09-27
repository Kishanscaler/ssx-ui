/**
 * "use client" manifest — the GSAP motion layer (src/motion). See ./core.mjs.
 * `motion/core`, `motion/tokens.generated` and the `motion/index` barrel are
 * server-safe and must NOT carry the directive.
 */
export default [
  // gsap.context in a layout effect.
  'motion/use-motion',
  // The primitives: refs + useMotion.
  'motion/Reveal',
  'motion/Stagger',
  'motion/TextReveal',
  'motion/CountUp',
];
