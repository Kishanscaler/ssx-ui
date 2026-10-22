# SSX UI: how to build with it

`@kishanscaler/ssx-ui` is the React package of the Scaler Design System. It is one system with two sub-brands, **SST** (Scaler School of Technology) and **SSB** (Scaler School of Business), and two modes, light and dark. This sync contains the **foundations** (as tokens and utilities) and the **atoms**. Molecules and organisms are not in it yet. Compose them from atoms and the utilities below. Do not invent new components.

## Brand and theme are attributes, not props or providers

There is no theme provider and no `brand`/`theme` prop. Every token is a CSS custom property, and two attributes on `<html>` (or on any ancestor) choose the values:

```html
<html data-brand="sst" data-theme="light">   <!-- or ssb / dark -->
```

- The two axes are independent: all four combinations are valid. With no `data-theme`, the OS preference decides.
- To show both brands side by side, put `data-brand` on each wrapper. The nearest ancestor wins.
- Components never need `dark:`. The semantic tokens already change with the theme. Use `dark:` only for your own one-off markup, such as an image swap.

## Context goes through attributes, too

- A region over a strong fill, such as a photo or a solid brand panel, declares `data-surface-ink="on-image"`. The components inside it switch to their on-image ink by themselves. Do not recolour them.
- A raised region (a card, a tray) declares `data-elevation="raised"`. Components read it in their own styles.
- Never set another component's classes or tokens from outside it.

## Using components

- Style a component with its `variant`, `size` and `tone` props. Use `className` **only for layout**: margin, width, grid or flex placement. Never use it for colour, type, radius or padding.
- Icons are **children**, not props. There is no `leadingIcon`/`trailingIcon`. A square icon control is `IconButton`, or a `size` such as `icon-md`, not a boolean. Wrap a glyph in `<Icon>` for size and accessibility. The glyph is any single `<svg>`, and Phosphor is the house style:
  `<Button>Continue<Icon><ArrowRight /></Icon></Button>`
- Compound atoms are composed from their parts (for example `Avatar` with `AvatarImage` and `AvatarFallback`, `RadioGroup` with its items, `Select` with its parts). Use the exported part names. Do not rebuild them from `div`s.
- Polymorphism is `asChild` (Radix Slot). For a link that looks like a button, write `<Button asChild><a href="…">…</a></Button>`.
- Prefer `<Heading>` and `<Text>` over raw elements for text. They carry the type roles and tones.
- Merge classes with the exported `cn()`. It knows this system's custom scales, so conflicting utilities resolve correctly.

## The vocabulary is closed

Tailwind's default scales are **removed**. An off-scale class such as `p-7`, `max-w-md`, `text-lg`, `bg-blue-500`, `shadow-lg` or `ease-in` silently produces no CSS. Use only the names below. Never write raw hex, px or arbitrary values (`[13px]`, `[#123456]`).

| Need | Use | Not |
|---|---|---|
| Text style | `type-hero` `type-display` `type-h1` `type-h2` `type-h3` `type-body-lg` `type-body` `type-body-sm` `type-label` `type-eyebrow` `type-caption` `type-code` (large display: `type-billboard-sm/md/lg/xl`) | `text-2xl leading-tight` |
| Spacing (`p` `m` `gap` `space` and sides) | steps `0` `px` `0.5` `1` `1.5` `2` `2.5` `3` `4` `5` `6` `8` `10` `12` `16` `20` `24` `32` `40` | `p-7`, `gap-9`, `mt-14` |
| Page edge padding | `px-gutter` | `px-6` on a page shell |
| Readable width / panels | `max-w-measure`, `max-w-panel-xs` `-sm` `-md` `-lg` `-xl` `-2xl` | `max-w-md`, `max-w-prose` |
| Control and icon sizes | `h-control-xs/sm/md/lg`, `size-icon-sm/md/lg/xl/2xl`, `min-h-touch-min` | `h-10`, `size-5` for an icon |
| Backgrounds | `bg-page` `bg-surface` `bg-surface-subtle` `bg-surface-sunken` `bg-surface-raised` `bg-surface-inverse` `bg-surface-brand-solid` `bg-surface-brand-subtle` `bg-brand-tint-surface` `bg-{success,warning,danger,info,accent1,accent2}-surface` | `bg-white`, `bg-gray-50` |
| Text colour | `text-content` `text-content-secondary` `text-content-disabled` `text-content-brand` `text-content-inverse` `text-content-link` `text-content-on-brand-solid` `text-content-on-image` `text-{success,warning,danger,info,accent1,accent2}-content` | `text-gray-600`, `text-black` |
| Borders | `border` `border-t/b/l/r/x/y` `border-hair` `border-thick`; colours `border-border-subtle` `border-border-decorative` `border-border-strong` `border-border-brand` `border-{success,warning,danger,info}-border` | `border-gray-200` |
| Radius | `rounded-none` `-sm` `-md` `-lg` `-xl` `-2xl` `-full` | `rounded-3xl` |
| Elevation | `shadow-1` … `shadow-6`, `shadow-raised`, `shadow-overlay` | `shadow-md` |
| Aspect ratio | `aspect-square` `-video` `-landscape` `-photo` `-cinema` `-portrait` `-banner` | `aspect-[4/3]` |
| Stacking | `z-base` `z-lift` `z-raised` `z-sticky` `z-overlay` | `z-50` |
| Fonts and weight | `font-sans` `font-mono`; `font-regular` `font-medium` `font-semibold` `font-bold` | `font-light`, `font-normal` |
| Breakpoints (min-width) | `xs:` 320 · `sm:` 672 · `md:` 1056 · `lg:` 1312 · `xl:` 1584 | `2xl:` (does not exist) |

Layout utilities work as usual: `flex`, `grid`, `grid-cols-1`…`12`, `col-span-*`, `items-*`, `justify-*`, `w-full`, `mx-auto`, `relative`/`absolute`, `overflow-hidden`, `truncate`, `text-center`, and so on.

## Rules of thumb

- 12px (`type-caption`) is the smallest text. Do not go below it.
- A solid brand panel (`bg-surface-brand-solid`) or a photo behind components must be marked `data-surface-ink="on-image"`, or the components inside it lose contrast.
- Status colours (`success`, `warning`, `danger`, `info`) are for status only.
- Check every screen in both brands and both themes. A defect that appears only in dark mode has shipped before.
