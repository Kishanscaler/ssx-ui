# `@kishanscaler/ssx-ui/marketing`

The marketing vocabulary: section headers, cards, rails, breakers and figures for a landing page
or a CMS block tree. Built for the SSB home page first (2026-10); meant to be consumed from
Storyblok next, so every component here is shaped as a blok.

This entry reverses a 0.8 decision. The README's Status for 0.8 removed `Carousel` because
"marketing rails belong in the site codebase". That held while one site consumed the system.
Now the same cards and rails must be assembled by CMS editors across projects, and a component
that exists only in a site's codebase cannot be. So they live here, in a separate entry: the main
entry (the LMS, the Rails app) does not ship them.

## The contract

Every component in this entry follows these. A PR that does not is not done.

1. **Flat props first.** Strings, string unions, numbers, image URLs, and arrays of small objects
   with string fields (`{ name, src }`). These ARE the Storyblok blok schema; a field maps onto a
   prop by name. `children` and named `ReactNode` slots (`aside`, `playSlot`) are the code-side
   escape hatch for what a CMS cannot express; they are never required and never the only way.
2. **Width comes from the cell.** No width prop. A card sits in a grid cell or a `Rail` item and
   takes that width (the `Card` rule). A `size` axis (`sm | md | lg`) exists only where the page
   shows a designed second size; it scales the type and insets, never the width.
3. **Every optional slot omitted is a variant.** No `hideImage`, no `showChip`. No `image` means
   the plate; no `tag` means no chip; no `figure` means no blur. `variant` / `layout` enums are
   for the few real shape differences.
4. **Markers, not motion.** A component ships no animation. It renders stable markers the motion
   layer (`@kishanscaler/ssx-ui/motion`) and a page's own motion bind to: `data-slot="<name>"` on
   the root and `data-slot="<name>-<part>"` on parts, plus `data-part` from this set:
   `header | eyebrow | headline | sub | controls | photo | title | subline | description |
   figure | logos | avatars | action`. Nothing in this entry imports `gsap`.
5. **Server components by default.** Client (`'use client'`, listed in
   `scripts/client-manifest/batch-marketing.mjs`) only for state: a scroller's pages and
   autoplay, the carousel nav, a breaker's turn. Cards are markup. In a card, people and avatars
   are a server `<img>` with an initials fallback (Radix `Avatar` loads its image in an effect,
   which paints the initials first on a server-rendered page).
6. **Tokens only; no raw values.** `src/styles/foundations-only.test.ts` fails a hard-coded value.
   Where the page's override sheets invented a value the tokens lack, the component declares a
   custom property with a token fallback and the value is listed under *Token requests* below.
7. **React 16.12 / ES2019 safe.** The legacy build (`scripts/check-legacy.mjs`) runs on every
   entry. No `useId` (ids come in as props), no `useSyncExternalStore`; `ResizeObserver` and
   `IntersectionObserver` behind a `typeof` guard with a static fallback; `inert` set via a ref.
   In shipped CSS, no `color-mix()` over a `var()` and no nested `calc(var())`: the legacy
   consumer's PostCSS rejects them.
8. **On-image ink is declared, not re-pointed.** Wherever white type sits on a photo (an overlay
   or plate layout, a breaker) the component sets `data-surface-ink="on-image"` on that region, so
   `Heading`, `Text`, `Button` and `Link` inside pick their own on-image variants.
9. **Done means: stories per variant, tests, both brands and themes, 320px.** CSF3 stories with
   `tags: ['autodocs']` under `Marketing/<Name>`, reviewed in the Storybook toolbar's Brand AND
   Theme (the single most expensive lesson in this repo), and `npm run check:reflow` clean. A
   client part also gets a sample in both smoke fixtures (`examples/*/…/samples/batch-marketing`).

## The family

| Component | What it is | Size axis |
|---|---|---|
| `SectionHeader` | eyebrow · title (an accent phrase, `\n` line breaks) · description · an aside at the end, on the title's line, or below | `titleSize: display \| 1` |
| `PhotoFrame` | a photo in a ratio, positioned, with an optional progressive blur (blurred copies revealed by gradients under a scrim) and a plate when there is no photo; children sit on top | — |
| `GlassPlate` | the plate or bar laid on a photo; light or dark tone; inset at the foot or in flow | — |
| `LogoTile` | a company mark on a tile: white, the brand's colour, or glass; wide or square | `sm \| md` |
| `Figure` | a figure with its unit glyphs a step down | `sm \| md \| lg` |
| `StatCard`, `StatGroup` | a figure with its label, eyebrow, line and source; groups of 2–4, divided, on a plate | `sm \| md \| lg` |
| `PersonCard` | a person: photo, name, role, headline, bio, eyebrow, badge, figures, a move (from → to), logos; `overlay \| stacked \| split` | `sm \| md` |
| `ShowcaseCard` | a venture, club or challenge: square photo (or banner) inset left, tag, figure on the blur; title, link, people row, line | — |
| `MediaCard` | media then copy: below, on a plate, or over the photo; `Card` reused wholesale | `sm \| md` |
| `ProfilePlate` | who said it: name, credential, logos, on a glass plate | — |
| `Rail`, `RailItem` | one scroller: free, stepped or ticking; one or two rows; bleeding to the edge; dots and arrows | `itemWidth` |
| `CarouselNav` | dots between arrows, the active dot filling on a timer or by progress | — |
| `Breaker` | the dark statement band: a clip, a frost, the words, figures, who said it, dots | — |

## Token requests

Values the SSB page's override sheets (`src/app/color-standard.css`, `globals.css`) invented
because no token existed. The token source is the parent design-system repo (this package only
carries a committed copy of its output), so these are requests, carried here as component
custom properties with a fallback until the token lands:

| Request | Used for | Interim fallback |
|---|---|---|
| `glass.on-image.plate` — a dark plate at 55%, fixed in BOTH themes | plates, tags and bars on a photo (a pale photo needs a dark plate in dark mode too; `--glass-on-image-surface` flips) | `--ssx-plate-on-photo` (one colour, its alpha included), falling back to `--surface-image-scrim`: the one dark fill fixed in both themes and gated for white type (`--surface-inverse-sunken` flips to #A3A3A3 in dark, and white on it at any glass step fails contrast; `color-mix` is out by rule 7). `GlassPlate tone="dark"` |
| `aspect.portrait-4-5` — 4 / 5 | the phone's portrait cut of a story photo (`PhotoFrame`, `CardMedia` ratio `4:5`) | `--ssx-aspect-4-5`, given an interim default of `4 / 5` in `src/styles/batches/marketing.css` (the class itself falls back to 3:4, the landscape token inverted) |
| `surface.inverse.fixed` — the inverse surface that does not flip | the dark plate a card shows when there is no photo | `--ssx-surface-fixed-dark`, given an interim default of the image scrim (`--surface-image-scrim`, the one dark fill fixed in both themes) in `src/styles/batches/marketing.css`; the class itself falls back to `--surface-inverse`, which flips light in dark mode |
| `content.accent` — the brand's bright green | an accent phrase in a title, figures in brand tone, SSB-light brand text at eyebrow size (`--content-brand` #004A1E reads black there) | `--ssx-content-accent`, falling back to `--content-brand` |
| `size.rail-item.{md,lg,xl}` — 24 / 30 / 38rem | `Rail`'s `itemWidth` `md` · `lg` · `xl` (`sm` is `--size-panel-sm`, 20rem) | `--ssx-rail-item`, counted in the scale's rem: `calc(var(--space-4) * 24)` etc. |
| `size.rail-item.viewport-max` — 82vw | a fixed-width `Rail` item's cap on a phone, so the next card peeks in | `--ssx-rail-item-w`: `min(var(--ssx-rail-item), calc(100vw * 0.82))` |
| `breakpoint.container.card-split` — 18rem | the width below which `PersonCard layout="split"` stacks (photo on top); a container-query threshold, so literal, like `--container-region-*` | `--container-person-card-split: 18rem` in `src/styles/batches/marketing.css` (`@min-person-card-split/person-card:`) |
| `type.display.weight` 500 | the page sets every display title to medium; the package's is 600. One decision, not an override | none: `--type-display-weight` already exists; the page sets it |
| `size.rail-item.peek` — 0.14 | `Rail itemWidth="view"`: the share of the row's width left for the next card to peek in (the phone stack) | `--ssx-rail-peek`, from the `peek` prop (default 0.14), falling back to `0.14` in the track's class |

## Versioning

One package, one semver. There are no per-component versions: two `Button`s in one package means
two Buttons on one page, a doubled story/test/token matrix, an old one nobody deletes, and
parallel bloks in the CMS.

- Additive is a minor: a new prop with a default, a new variant, a new component.
- Removing or renaming a prop, or changing what a default looks like, is a major.
- Deprecate before removing: `@deprecated` in the types (the editor strikes it through) for at
  least one minor, the changelog naming the replacement, then removed in the next major.
- **Blok-facing props are additive-only.** A prop CMS content depends on is never renamed in
  place: the new name is added, the old one aliased, and the alias removed only with a content
  migration.
- A redesign is a `variant` or `appearance` value on the same tokens, never a parallel version.
  At most a transitional `<Name>Legacy` export with its removal version stated.
- Dist-tags: `latest` is stable; `next` is the prerelease a consumer tests against
  (`npm publish --tag next`; `npm i @kishanscaler/ssx-ui@next`).
- If two areas ever need different release cadences, split the package: this entry's layout makes
  that a mechanical move. Not now.

CI (`.github/workflows/ci.yml`) runs typecheck, both test runs, the build with its directive and
legacy checks, and the package checks on every push and PR, so a version number can be trusted.
