# Story photos

Real photographs for the marketing stories, so a story looks like the page it is for. Story-only:
`index.ts` exports each file's URL (`new URL('./file', import.meta.url)`), the fixture modules
(`PhotoFrame/_fixtures/marketing.ts`, `Breaker/_fixtures/breaker.ts`, `StatCard/_fixtures/stats.ts`)
and a few stories import them, and nothing here is exported from the package or shipped
(`tsconfig.build.json` and the standalone CSS exclude `_fixtures`).

Every file comes from the SSB landing page repo (`SSB---Page`, `public/`), copied as is unless noted.
The credit lines are that repo's `public/media/CREDITS.md`, which covers `public/media/` only; the
people's portraits are the school's own, as the page shows them. Nothing was fetched from the internet.

| File | From (`SSB---Page/public/…`) | Size | Credit |
| --- | --- | --- | --- |
| `campus-walk.webp` | `media/campus-students.webp` | 1600 × 900, 168 KB | a still from the team's campus film; Scaler, ours |
| `campus-entrance.webp` | `media/campus-entrance-1280.webp` | 1280 × 720, 45 KB | a still from the team's campus film; Scaler, ours |
| `innovation-lab.webp` | `media/lab-space-1400.webp` | 1400 × 843, 69 KB | Scaler's Innovation Lab page (scaler.com/innovation-lab); Scaler, ours |
| `san-francisco.webp` | `media/san-francisco-golden-gate-1280.webp` | 1280 × 960, 80 KB | "Golden Gate Bridge in 2012 as seen from Battery Spencer", Choinowski, Wikimedia Commons; CC0 |
| `mittal-visit.webp` | `media/mittal-band.webp` | 1600 × 686, 39 KB | the team's GIF of Anupam Mittal's campus visit, widened to 21:9 on Magnific (the widened area AI-generated); Scaler, ours |
| `warikoo-convocation.webp` | `media/warikoo-band.webp` | 980 × 720, 54 KB | the team's GIF of Ankur Warikoo's convocation speech; Scaler, ours |
| `live-project.jpg` | `live-projects/stockgro.jpg` | 900 × 1200, 68 KB | the page's live-project card art (not in CREDITS.md) |
| `malthi-ss.webp` | `faculty/malthi-ss.webp` | 640 × 800, 31 KB | faculty portrait, the school's own (not in CREDITS.md) |
| `gaurav-dadhich.webp` | `faculty/gaurav-dadhich.webp` | 640 × 800, 17 KB | faculty portrait, the school's own (not in CREDITS.md) |
| `sidhant-goyal.webp` | `faculty/sidhant-goyal.webp` | 640 × 800, 15 KB | faculty portrait, the school's own (not in CREDITS.md) |
| `moh-agarwal.webp` | `alumni/moh-agarwal.webp` | 948 × 631, 21 KB | alumni photo, the school's own (not in CREDITS.md) |
| `aashish-us-avatar.webp` | `alumni/aashish-us.webp`, **cropped** square on the face (380 px at 90, 20) and resized to 192 × 192 | 192 × 192, 4 KB | alumni photo, the school's own (not in CREDITS.md) |
| `tanisha-singhal.webp` | `immersions/tanisha-singhal.webp`, **cropped** to rows 170–750 so her face sits in the overlay card's top third | 702 × 580, 16 KB | a student creator's portrait from the immersions section, the school's own (not in CREDITS.md) |

## Rules for the stories

- **A real face carries its own name.** Where a story shows one of these people, it uses their name
  and role as the page gives them (`SSB---Page/src/content/people.ts`, `alumni.ts`, `immersions.ts`,
  `community.ts`); never an invented person over a real photo, and no claim about them beyond the
  page's. Two things beside them are stand-ins: the company tiles (the fixtures' invented brands,
  Northwind, Bluepeak…: the package ships no third-party logos) and the faculty card's course
  (`headline`, "Product Strategy").
- **The Why breaker's still is not Kamath's.** The page's clip of his remark is Zerodha's, cleared for
  the page only; the story shows the empty lab instead.
- Pick the smallest file that reads well; no `2560` variants, no video. The page repo has more
  (other faculty, the lab's photos, Bengaluru's Vidhana Soudha) if a story needs them.
