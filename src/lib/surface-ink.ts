/* ---------------------------------------------------------------------------
 * The surface-ink contract
 *
 * A section painted in a strong fill (a DisplayBanner, a consumer's hero, a
 * CTA strip) says so with ONE attribute, and nothing else:
 *
 *   <section class="bg-surface-brand-solid" data-surface-ink="on-brand-solid">
 *     <Heading as="h2">…</Heading>        ink on the fill
 *     <Text tone="secondary">…</Text>     the fill's secondary ink
 *     <Button>Apply</Button>              the fill's own primary: ink fill, fill label
 *     <Link href="/x">Learn more</Link>   the fill's link ink and focus ring
 *   </section>
 *
 * The surface never sets another component's tokens or classes. Each component
 * that draws text or an action reads the attribute INSIDE ITS OWN RECIPE, with
 * `in-data-[surface-ink=…]:`, and picks its own variant for that fill from the
 * `--on-<fill>-*` token families (tokens/semantic.color.json, gated for
 * contrast in scripts/build.py). It is the same shape as the existing
 * `data-elevation="raised"` contract Button honours for its neutral hover.
 *
 * Why an attribute and not React context: DisplayBanner, Card and the atoms
 * are server components, and context does not exist there. Why not only
 * explicit props: a `<Button>` written inside `<DisplayBannerActions>` on a
 * solid banner must be legible with no extra prop.
 *
 * LIMITS. The contract reaches every descendant, so do not nest a second fill
 * (or a page-coloured card) inside a fill: CSS cannot pick the NEAREST
 * ancestor's value, and which one wins would be source order. Components that
 * bring their own surface (Badge, Chip, Input, …) ignore the contract and keep
 * their page colours on purpose.
 *
 * Each component spells its own classes out LITERALLY, in its own file: the
 * published stylesheet scans `dist/components/**` for class names, so a shared
 * fragment kept here would never be generated. This file holds only the value
 * union, for props and adapters.
 * ------------------------------------------------------------------------- */

/** A `data-surface-ink` value: which fill the content sits on. */
export type SurfaceInk = 'on-brand-solid' | 'on-accent1-solid' | 'on-accent2-solid' | 'on-inverse' | 'on-image';

export const SURFACE_INKS: readonly SurfaceInk[] = [
  'on-brand-solid',
  'on-accent1-solid',
  'on-accent2-solid',
  'on-inverse',
  'on-image',
];
