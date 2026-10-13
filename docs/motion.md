# Motion: markup, holds, Marquee, and the traps

Added 2026-10-01, in answer to the site team's "requests for the design team" (2026-09-30):
the motion items only (P1 markup vocabulary, P1 Marquee, P2 scroll-frame findings, P3 splash
opening, P3 "things that tripped us"). Layout asks (Sticky, Hero, feathering, GlassPanel) are
not covered here.

## 1. Markup motion: animate server-rendered blocks

`Reveal`, `Stagger` and `TextReveal` are client components that wrap their children. A
server-rendered CMS block tree cannot do that without shipping client code on every page. Blocks
carry attributes instead, and one runtime animates them:

```tsx
// a Server Component (a Storyblok block)
import { motionProps } from '@kishanscaler/ssx-ui/motion';

<section {...motionProps({ reveal: 'fade-up', trigger: 'in-view' })}>…</section>
<ul {...motionProps({ stagger: 'fade-up', interval: 'base' })}>…</ul>
<h1 {...motionProps({ text: 'words' })}>Learn to build</h1>

// once, high in a layout
import { MotionScope } from '@kishanscaler/ssx-ui/motion';
<MotionScope asChild><main>{children}</main></MotionScope>
```

| Attribute | Values | Default |
|---|---|---|
| `data-ssx-reveal` | `fade-up` · `fade` · `scale` · `wipe` | `fade-up` when empty |
| `data-ssx-stagger` | a preset; its **direct children** enter in turn | `fade-up` |
| `data-ssx-text-reveal` | `words` · `chars` | `words` |
| `data-ssx-section` | `header`: a section header's parts in sequence (§8) | none |
| `data-ssx-trigger` | `mount` · `in-view` | `mount` |
| `data-ssx-intent` | `productive` · `expressive` | `productive` (`expressive` for text) |
| `data-ssx-delay` | a duration step: `instant` … `slowest` | none |
| `data-ssx-interval` | a stagger step: `base` · `tight` | `base` |
| `data-ssx-motion` | written by the runtime: `armed` · `done` | never author it |
| `data-ssx-hold` | written by the runtime on a row while its cards wipe (§8) | never author it |
| `data-ssx-wipe` | written by the runtime on every element that owns a `wipe` | never author it |

**What it costs.** Measured with webpack 4 on a page importing only `MotionScope`:
- The main bundle holds React, Slot, `MotionScope` and the contract, with no GSAP.
- GSAP core, CustomEase and the runtime come as one lazy chunk, fetched only once a target is in
  the scope. It is never fetched under reduced motion.
- SplitText is a second lazy chunk, fetched only for a `data-ssx-text-reveal` or a section
  header with a headline.
- ScrollTrigger is fetched only for a `data-ssx-section` (its start must stay reachable at the
  page's foot, which an IntersectionObserver cannot promise).
- `in-view` uses an IntersectionObserver, not ScrollTrigger, so it adds nothing.

**Outside React** (the Rails app, a plain script): `applyMotion(document.body)` arms the
targets and returns a `stop()`. By default it keeps watching and arms targets added later.

## 2. No flash before the script

The page has to hide its targets before the first paint, then let the runtime take over:

```tsx
import { motionNoFlashScript } from '@kishanscaler/ssx-ui/motion';

<html suppressHydrationWarning>
  <head>
    <script dangerouslySetInnerHTML={{ __html: motionNoFlashScript }} />
  </head>
```

The script sets `data-ssx-motion-pending` on `<html>` unless the OS asks for reduced motion.
`styles.css` (`styles/batches/motion.css`) then hides every target that the runtime has not
armed. **Fallback:** if the script never runs, the targets fade in after
`--motion-fallback-reveal` (3s). A blocked script never leaves the page blank. Under a
`data-motion="reduce"` ancestor, nothing is hidden.

`suppressHydrationWarning` is there because the script adds an attribute that React did not render.
React 19 merges same-precedence `<style href>` tags into one, so a selector like
`style[data-href="x"]` will not find a hoisted stylesheet. Key off attributes, as this recipe
does.

## 3. Hold everything behind a splash

Every entrance honours a `data-motion-hold` ancestor. That covers `Reveal`, `Stagger`,
`TextReveal`, `CountUp` and the markup runtime. Under the hold, the start state is drawn at once:
the content is hidden, not visible and then snapped away. Nothing plays until the attribute is
removed.

```tsx
<html data-motion-hold>          // server-rendered; the splash removes it when it ends
// or, before the content mounts:
const release = holdMotion();    // sets it on <html>; release() removes it
```

**Put the hold in the markup.** A child's effects run before its parent's. So an entrance that
mounts together with a splash component would already be playing by the time that splash's
effect set the hold. See the "Hold (behind a splash)" story.

## 4. Marquee (main entry, CSS-animated, no GSAP)

```tsx
<Marquee aria-label="Hiring partners" gap="8">
  {logos.map((l) => <img key={l.id} src={l.src} alt={l.name} />)}
</Marquee>
```

- The track is two identical halves sliding by half its width, so the seam never shows. Each
  item carries the gap after it, so seams are gap-matched.
- Each half repeats the row until it covers the box, re-measured on resize. A 485px row on a
  1584px screen is four copies.
- **Speed** (`speed`): `slow` · `medium` (default) · `fast` · `ultrafast`, each twice the one
  before, about 30 · 60 · 120 · 240px/s on a pill row. The tokens (`--marquee-pace-*`: 4.8s,
  2.4s, 1.2s and 0.6s) are the time one item takes to pass, so long and short rows move at the same
  speed. Keep `ultrafast` for short tickers, not for anything people need to read.
- Only the first copy is exposed to assistive tech. Repeats are `aria-hidden` and `inert`.
- **By hand** (`scrollable`, on by default): it can be dragged with a mouse, swiped with a finger,
  or scrolled sideways with a trackpad or shift + wheel. It goes either way, forever, and a flick
  glides to a stop over `motion.duration.slowest`. The hand moves the CSS animation's own clock
  (`currentTime`, Web Animations API), so the loop stays seamless. When the hand lets go, the row
  carries on from there.
  - A press becomes a drag only past 8px (`space.2`), so taps and clicks on items still land, and
    the click that ends a drag is swallowed.
  - `touch-action: pan-y` leaves vertical page scrolling alone.
- **Hover** (`hover`): it brakes smoothly, by easing `playbackRate` over
  `motion.duration.slowest` on the productive in-out curve, then picks back up when the pointer
  leaves.
  - `pause` (default) brakes to a stop.
  - `slow` brakes to a crawl and keeps moving, at `--marquee-hover-rate` (0.25 of full speed,
    about 15px/s).
  - `none` ignores the pointer.
  - Focus inside always brakes it to a stop, so a keyboard user can read and act. Tabbing to an
    item out of view brings it into view.
- `paused` is for a page's own pause button, which WCAG 2.2.2 requires for anything that moves
  past five seconds.
- Under reduced motion it never moves on its own and a flick does not glide. It still moves by hand.
- **Measured in Chromium:** cruise is 60px/s. The hover brake goes 58 → 48 → 35 → 24 → 16 → 8 → 3
  → 0px/s, 100ms apart, and the pick-up goes 2 → 13 → 25 → 37 → 50 → 57 → 60. A 180px touch swipe
  moved it 181px, and a vertical swipe over it scrolled the page.
- In RTL it runs mirrored and stays seamless.
- **It takes its width from its parent** (`contain: inline-size`). In a flex row, give it `flex-1`
  or `w-full`. Without containment, a shrink-to-fit parent would grow with every repeat and loop
  forever. The smoke test caught exactly that.

## 5. TextReveal presets

| `preset` | What it does | `by` |
|---|---|---|
| `rise` (default) | Each piece fades in and rises `motion.offset.enter` (12px), 30ms apart (lines 60ms) | `words` · `chars` · `lines` |
| `blur` | Each piece fades in, grows from `motion.scale.text` (0.85) and sharpens out of a motion blur, `motion.blur.text` (0.15em, so a display headline blurs as much, relatively, as a small one), 30ms apart | `words` · `chars` |
| `wipe` | Word by word, a block of brand colour (`--surface-brand-solid`) slides up over the word in `duration.fast` (150ms). Then the word slides up into place and pushes the block off the top, both moving together for `duration.normal` (250ms), inside the word's own clip. Each word starts `motion.stagger.wipe` (50ms) after the last, so the wipes overlap tightly. Recolour the block with `--ssx-text-wipe` on the element, for example on a brand-coloured section. | `words` · `lines` |
| `soft-wipe` | The same push as `wipe`, but the block is a brand **gradient** (`--surface-brand-subtle` to `--surface-brand-solid`) under a very heavy blur, `motion.blur.wipe` (0.6em, in em so it scales with the headline). It reads as a glow sweeping up through each word. The glow sits outside the word's clip, so the blur spreads past the word rather than stopping at a hard edge, and it fades in as it rises and out as it leaves. Recolour it with `--ssx-text-wipe-from` and `--ssx-text-wipe`. | `words` · `lines` |

```tsx
<TextReveal asChild preset="wipe"><Heading as="h1" size="display">Learn to build</Heading></TextReveal>
<h1 {...motionProps({ text: 'chars', textPreset: 'blur' })}>Learn to build</h1>   // markup
```

**`by="lines"`** reveals several words at a time, one real line at a time. It follows the actual
line breaks, so the grouping adapts to the screen width. Each line is revealed through a box
around its own text, so a wipe block or a blur's grow fits the words rather than the column. When
the reveal ends, the split is undone, so the text reflows normally if the page is resized later.

Screen readers hear one plain string (SplitText `aria: 'auto'`). Only transforms, opacity and
filter move, so the line never reflows. Under reduced motion nothing is split and the text just
appears.

## 6. CountUp versions

| Prop | Values | |
|---|---|---|
| `entrance` | `none` (default) · `fade-scale` | With `fade-scale`, every digit is its own piece, aligned from the right, so the units stay the units as the number grows. Only the pieces whose character changed move. A digit that ticks over after sitting still for `duration.normal` **pops**: it fades in, grows from `motion.scale.count` (0.85) and sharpens from `motion.blur.count` (4px). A digit changing faster than that **races**: it stays at full strength but blurred, which reads as motion blur, and sharpens as the count slows onto its value. A new place (9 → 10, 999 → 1,000) pops in on the left. Only transforms, opacity and filter move, so nothing shifts the layout. Slightly expressive: for a landing page's stats or a success screen. |
| `speed` | `medium` (default) · `slow` | How long it counts: `motion.count.medium` 800ms, or `motion.count.slow` 1600ms for the one hero figure in a section. |

The accessible text is always the final value. Under reduced motion it shows the value and nothing
moves. Under a hold (a splash) the figure stays hidden until the hold is released.

## 7. Brand mark opening (for a splash that flies into the mark)

`brandMarkOpening` (main entry) gives the point in viewBox units. `--brand-mark-opening` gives the
same point in CSS, as a percentage pair next to `--brand-mark`, ready for `transform-origin`.

- **The point** is the centre of the largest circle inside the shield's inner panel. That is where
  a zoom fills the screen with ink soonest.
- **Where it comes from:** `scripts/build-logos.mjs` measures it from the same path data.
- **Results:** SST (17.52, 17.48) in 36×40; SSB (14.52, 22.52) in 29×40.
- **Check against the site:** the site measured SSB at (14.45, 22.5) with a distance transform.
  The difference is their raster resolution.

## 8. Section entrance

The SSB home page's section entrance, ported (2026-10-13) so pages and CMS blocks use the
system's instead of a copy. A section enters in moments, each **once**, when its part is on
screen, on the expressive curves and the motion tokens:

1. **The header**, when it is 85% of the way up the screen: the eyebrow fades up
   (`offset.enter`, `duration.slow`); the headline rises line by line out of a mask (SplitText
   `type: 'lines', mask: 'lines', aria: 'auto'`, `duration.slower`, lines `stagger.base × 2`
   apart, starting one `stagger.base` after the eyebrow); then the sub and controls rise
   (`offset.reveal`, `stagger.base` apart, `duration.fast` after the headline starts). Each line
   mask is padded 0.15em below and pulled back by the same margin, so descenders are not clipped
   and nothing moves; the split is undone when the lines land.
2. **Each deck of cards**, when its row is 75% of the way up: each card clips open from the
   bottom (`clip-path: inset(100% 0 0 0 round r)` to `inset(0 round r)`, `r` its own computed
   corner radius; `duration.slower × 1.25`, `expressiveInOut`), the cards `stagger.base × 1.5`
   apart. With it, the card's photo settles from a 1.18 zoom (`duration.slower × 1.5`) and, from
   45% of the wipe, its text parts rise in (`offset.reveal`, `duration.slower`,
   `stagger.base × 1.5` apart), in reading order from the eyebrow. A marked part inside another
   (a `Figure` in a figures plate, a role in the avatars row) rises with its outer part, not on
   its own, so offsets never compound.
3. **A block** (`data-enter="block"`, with the hook) fades up on its own at 85%.

The starts are `clamp(top 85%)` and `clamp(top 75%)`, so they stay reachable when the section ends
the page. They are derived from the in-view token (`motion.viewport.enter`, 10%): 1.5 and 2.5
times it from the bottom. Under reduced motion nothing is armed and the section is simply
there. Every moment honours a `data-motion-hold` (a splash). Strict Mode safe: every tween is a
`fromTo` with an explicit end.

**Markers** (the marketing components render them; see `src/marketing/README.md` rule 4):

| Marker | Part |
|---|---|
| `data-part="header"` (or `data-ssx-section="header"`) | the header block: the header's trigger |
| `data-part="eyebrow"` · `"headline"` · `"sub"` · `"controls"` | the header's parts |
| `data-part="photo"`, or a `CardMedia`'s `img` (`[data-slot="card-media"] img`) | the card's photo: settles |
| `data-part="eyebrow"` · `"title"` · `"subline"` · `"description"` · `"figure"` · `"logos"` · `"avatars"` · `"action"` (inside a card) | the card's text: rises in |
| `data-enter="header"` · `"eyebrow"` · `"headline"` · `"sub"` · `"controls"` | **transitional**: the SSB page's spelling, accepted as an alias for the `data-part` above while the page migrates. New markup uses `data-part`; the alias goes in a later major. |

A part belongs to its **nearest** wipe owner (`data-ssx-wipe`, `data-ssx-reveal="wipe"`, a child of
`data-ssx-stagger="wipe"`): a card inside a wiping panel animates its own parts, and the panel
does not animate them too. An eyebrow is the header's or the card's, never both: the header
sequence plays the eyebrow of a `data-ssx-section="header"` block (even one inside a wipe owner,
which then skips it), and the wipe plays a card's own.

**The hook** (client), for a section rendered by React:

```tsx
import { useSectionEntrance } from '@kishanscaler/ssx-ui/motion';

const ref = React.useRef<HTMLElement>(null);
useSectionEntrance(ref);                                     // decks: the default
useSectionEntrance(ref, { decks: ['.stat', '.startup'] });   // one selector per group of cards
return <section ref={ref}>…</section>;
```

- `decks` (default `['[data-slot$="-card"]', '.ssx-card']`): one selector per group of cards that
  wipe together. The first matches the marketing cards' roots (`person-card`, `showcase-card`,
  `media-card`, `stat-card`), the second the SSB page's `.ssx-card`. It also matches the product
  cards `selectable-card` and `clickable-card`; pass `decks` to narrow it in a section that has
  them. A card already in an earlier group is left to that group.
- Each group plays when its row (the cards' `closest('ul')` when that list is inside the
  section, else the first card: a section that is itself a list item never holds the page's
  list) reaches 75%. Only cards on the page at this width (`offsetParent !== null`: a phone
  stack and a desktop row can both be in the DOM) and starting on screen (the card's box
  overlaps the viewport's width, `right > 0 && left < innerWidth`, so a right-to-left row that
  overflows to the left counts only what shows) play; the rest of a row (a loop's copy) is open
  long before it scrolls round.
- SplitText is loaded on demand; the header's parts are hidden at once and play once it is in.
- Cleanup (unmount, Strict Mode's re-run) reverts the split, the tweens, the triggers, the
  holds and the owner tags.

**From markup** (a server-rendered block, under a `MotionScope`), the same builders:

```tsx
<header {...motionProps({ section: 'header' })}>…eyebrow, headline, sub, controls…</header>
<ul {...motionProps({ stagger: 'wipe', trigger: 'in-view' })}>…cards…</ul>
<article {...motionProps({ reveal: 'wipe', trigger: 'in-view' })}>…</article>
```

`data-ssx-section="header"` is in view by default (`clamp(top 85%)`, through ScrollTrigger); a
`wipe` reveal or stagger takes the usual triggers (`in-view` there is the IntersectionObserver
rule). A `wipe` stagger opens its children one and a half intervals apart, only those starting
on screen. `<Reveal preset="wipe">` and `<Stagger preset="wipe">` are the same in components. A
wipe is always expressive: `intent` does not apply. Use the hook or the markup on a section, not
both. `revealFrom('wipe')` alone is only the clip (no radius, no parts), for a hand-written tween.

**The row hold.** While its cards wipe, the row carries `data-ssx-hold` (the hook: the cards'
`ul`; a `wipe` stagger: the stagger itself), removed when they land or on cleanup. A `Rail`'s
autoplay (ticker and step) waits on it, so it starts with its cards open on the margin. A
`Marquee` does not read it yet: it keeps running through the wipe. A row of your own that moves
on its own waits the same way:

```ts
import { isRowHeld } from '@kishanscaler/ssx-ui/motion';
if (isRowHeld(scroller)) return;   // in the autoplay tick: true on the row or under a held ancestor
```

## 9. Traps (for anyone writing their own GSAP against this system)

- **Never tween a Button with its CSS transition live.** Its `transition-all` restarts a CSS
  transition on every frame GSAP writes, and the button stays invisible. Every SSX entrance now
  switches transitions off on its targets while it plays (`holdTransitions`) and clears them after
  (`revealClearProps`). Do the same in your own timelines.
- **Tween transforms and opacity only.** Animating `left`, `top`, `width` or `height` shifts the
  layout on every frame. The site's hero measured CLS 0.13 that way, a 7–8 point Lighthouse loss,
  and CLS 0.0068 drawn with transforms. To move a card into a target box:
  - scale the card onto the box;
  - make its media a CSS cover box in container units, counter-scaled so it never squashes;
  - scale its overlays back to 1:1.
- **ScrollTrigger measures once.** A lazy image loading above a trigger pushes it late (about
  500px, measured). Call `ScrollTrigger.refresh()` when `body` resizes.
- **A lazy image has no size until it loads** if the CMS sends no dimensions. Build anything
  measured from it after `load`.
- **A card that leaves the flow collapses its slot** in a shrink-to-fit column. Give the slot the
  card's measured width *and* aspect ratio before it leaves.
- **Tell a responsive image its new display width** (`sizes`) when you scale it up. Otherwise
  the framed image is the small file upscaled (2.75× measured).
- **SplitText and the `/motion` barrel.** `TextReveal` imports SplitText statically. The package
  marks its JS side-effect free, so a bundler that tree-shakes drops it when `TextReveal` is
  unused. A dev build or an `import *` keeps it. The markup path (`data-ssx-text-reveal`) loads
  SplitText only on demand.
