# next-smoke

A minimal Next.js App Router app that installs `@kishanscaler/ssx-ui` **the way a
consumer does** (from the `npm pack` tarball, not from source) and builds it.

## Run it

From `react/`:

```bash
npm run smoke
```

That builds the package, packs it into `.pack/scaler-ssx-ui.tgz`, installs it
here, runs `next build`, and then checks the output. It passes only if:

- `next build` succeeds with **every** exported component imported from the package
  root and rendered inside a **Server Component** page (`app/[brand]/[theme]/page.tsx`
  via `app/samples/`), and each one prerenders a `[data-slot]` element;
- the compiled CSS contains the components' utilities (`h-control-md`) with no
  `@source` in `app/globals.css`, real breakpoints (no `var()` in a media
  query), the `dark:` variant bound to `data-theme`, and none of Tailwind's
  default palette;
- all four prerendered pages carry the right `data-brand` / `data-theme`.

## Look at it

```bash
cd examples/next-smoke
npm run start          # after `npm run smoke`; or `npm run dev`
```

Open http://localhost:3000. The buttons at the top switch between
`/sst/light`, `/sst/dark`, `/ssb/light`, `/ssb/dark`. Brand and theme are route
segments so they can be set on `<html>`, where the token layer reads them.

After changing the package, run `npm run smoke` again: it reinstalls the new
tarball. `npm run dev` here does not see source changes in `react/src`.

## Adding an atom

Nothing, usually: `app/samples/index.tsx` renders every PascalCase export with no props.
If yours cannot render bare, add a sample to your batch's file (`app/samples/batch-a.tsx`,
`-b`, `-c`; never another batch's) and the same in
`examples/webpack4-react16/src/samples/`.
