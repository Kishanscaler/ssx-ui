# Responsive and mobile-web audit: `@kishanscaler/ssx-ui` 0.4.0

**Date:** 2026-09-23.

**Method:** four parallel audits covered every Storybook story of all 69 components plus Logo. Each story was rendered at 320×640, 375×812, 414×896, 768×1024 (phones and tablet emulated as touch devices at 3× pixel density) and at 1024, 1280, 1440 and 1920 wide. The audits also ran:
- landscape 812×375
- 200% zoom (simulated with a 640-wide viewport)
- a 200% root font size
- a 320→1920 resize in 40px steps
- SST/SSB and light/dark spot checks

Measurements were taken in Chromium. Findings are based on measured numbers. The worst ones were confirmed by eye.

**Not tested:**
- Real iOS Safari and Android. iOS focus-zoom is inferred from computed font sizes plus WebKit's documented rule that it zooms when a field's text is under 16px.
- Notch and home-bar insets (safe-area insets).
- The on-screen keyboard.

This audit covered 0.4.0. It predates the full-size BottomSheet and the `normal`/`wide` SideDrawer sizes.

## Verdict

**Every component works on desktop, and none is unusable on a phone. Six problems appear across many components, and 13 components have their own phone bugs.**

| | Components |
|---|---|
| ❌ Broken on some phones | TopNav (672–1008px), DataTable, List, OtpInput (320), ButtonGroup, ToggleButtonGroup (welded), SegmentedControl, Pagination (320), Toast (landscape), CommandPalette (landscape/zoom), PhoneInput list (320) |
| ⚠️ Works with issues | AppShell, Table, TreeList, Toolbar, FileUpload, Combobox, DatePicker, BottomSheet (desktop width), Popover, Menu, Tooltip, HoverCard, Breadcrumbs, MetadataList, Banner, Chip, SelectableCard, Code, Button, Checkbox, Radio, Switch, Slider, Heading, Text, every text input (iOS zoom) |
| ✅ Responsive | Accordion, Alert, AvatarGroup, Card, ClickableCard, EmptyState, Stepper, Tabs, Timestamp, SideNav, Dialog, SideDrawer, Carousel, Avatar, Badge, Divider, Icon, Kbd, Skeleton, Spinner, StatusDot, ProgressBar, Select, Logo |

**Works as intended:**
- Hover styles don't stay on after a tap (Tailwind v4 applies them only on devices that can hover).
- Nothing overflows at 200% zoom.
- Nothing overflows from 1024 to 1920.
- Themes and brands behave the same.
- Select's list fits phones, including landscape.
- BottomSheet drag-to-dismiss works with real touch.
- The AppShell drawer traps focus and locks scrolling.
- Stepper switches layout exactly at 672.

## Problems across the whole package (fix once, each clears many findings)

| # | Problem | Evidence | Affects |
|---|---|---|---|
| S1 | **Text fields use 15px text (13px at `sm`), so iOS Safari zooms the page on focus** | `Input.tsx:97-98` (`text-base` = `--font-size-base: 15px`) | Input, Textarea, NumberInput, PhoneInput, DateInput, DatePicker, SearchInput, Combobox, every Field, forms in Dialog/SideDrawer/Popover |
| S2 | **Tap targets are below 44px.** The `--size-touch-min` 44px token exists but only Chip uses it. There is no `pointer: coarse` rule | Checkbox/Radio 18px, Switch 22px tall, Slider handle 20px, `sm` controls 32px, close buttons 32px, calendar days 37px, Carousel dots 16px | Most interactive atoms, dense molecules, organism chrome |
| S3 | **Width guards are missing**: grids without a `minmax(0,1fr)` column, flex items that can't shrink, text that never wraps | AppShell 336–410px wide at 320; Code header 365px; OtpInput 328; long Button labels cut off; Heading/Text long words overflow; List, FileUpload and TreeList rows squeezed to 23–87px | AppShell, Code, OtpInput, Button, Heading, Text, List, FileUpload, TreeList |
| S4 | **Joined groups (ButtonGroup recipe) have no overflow handling** | 145px page overflow at 320 | ButtonGroup, ToggleButtonGroup (welded), SegmentedControl |
| S5 | **Floating panels have no viewport max-height, and one uses `vh` instead of `dvh`** | Popover and DatePicker run past the bottom in landscape; CommandPalette (`top-[18vh]`, no max-height) cuts off results; Toast stack has no cap | Popover (and everything built on it), CommandPalette, Toast; Menu lacks edge padding |
| S6 | **Notch and home-bar insets are handled only in BottomSheet; `h-dvh` has no `vh` fallback** | — | Toast, SideDrawer footer, AppShell drawer, sticky TopNav |
| S7 | ✅ **Fixed 2026-09-24, see "S7 status" below.** ~~**Sizes are in px, so a user's browser font-size setting is ignored**~~ (browser zoom works). 12 Tailwind default classes compile to rem, so those parts alone grow. The responsive `--type-*` roles exist, but components use fixed `text-base`/`text-sm` | `tokens.generated.css`, `theme.css` | Everything |
| S8 | **Narrow layouts are opt-in props and nothing uses container queries** | Pagination compact, Breadcrumbs `maxItems`, MetadataList stacked | Components inside cards and side panels |
| S9 | **The viewport meta tag is missing** from the webpack 4 fixture, and the README doesn't tell apps to set it | — | Consumer setup |
| S10 | **Story layouts use fixed px widths**, which hides or creates overflow, and people copy story code | about 12 stories | Storybook |

## S7 status (2026-09-24)

**Done.** Three parts, all in `@kishanscaler/ssx-ui` after 0.5.0.

1. **rem.** `scripts/build.py` writes space, font sizes, the `--type-*` sizes, radii and the control / icon / touch / container sizes in rem at a 16px base (the token JSON stays in px, and every type gate still reads px). Component arbitrary values moved to rem the same way (sizes, paddings, panel widths, `calc()` offsets beside `env()`, container-query thresholds). Kept in px: borders and 1-2px hairline offsets, focus rings, shadows, `radius-full`, media queries, and the 16px floor in `field-text`. Slider's bubble geometry is computed in rem to track its rem-sized thumb.
   - **Default root, before vs after, rem step alone:** 398 stories at 1280×800, byte-compared by pixel. 393 identical. The other five are all in the set that also differs between two runs of the *same* build: Timestamp (relative time), Field overview (9px), and DataTable's footer, where Pagination's fit measurement races (it sometimes shows "Page 1 of 1", sometimes the numbered rail). That race predates this work.
   - **200% root font size:** before, every measured box and font size stayed at ×1.00 (the audit's finding). After, ×2.00 across 21 stories (Button, Input, Checkbox, Switch, Slider, Badge, OTP, Text, Field, Tabs, SegmentedControl, Menu, Banner, Toast, Dialog, SideDrawer, TopNav, AppShell, DataTable); Card and Alert grow more than ×2 in height only because their text rewraps in a fixed-width story.
2. **Type roles.** `type-*` utilities in `theme.css` (see README, "Type roles and the page gutter"), registered with `cn()`. Heading and Text are built on them, so everything that composes them (Card, Dialog, SideDrawer, BottomSheet, EmptyState, FileUpload's title) follows. Every eyebrow-style label now uses `type-eyebrow`, so the 0.08em tracking is applied everywhere by one rule, and a test fails if a component or story spells an eyebrow by hand.
3. **Page gutter.** `--space-gutter` (16px below `sm`, 24px from `sm`) and `px-gutter`. On AppShell's content well, Banner, the Toast viewport and, on phones, the TopNav bar. Storybook pads every story with it; `parameters: { pageLevel: true }` (TopNav) drops the padding.

**Intended visual changes at the default size** (the after-build differs from the baseline in 122 of 398 stories, all traced to these):

| Change | Where it shows |
|---|---|
| `Text size="sm"` → body-sm role: line height 1.55 → 1.6 (13px text, +0.65px a line) | every story using Text sm: Card/Dialog/SideDrawer descriptions, Popover, HoverCard, Carousel, Tabs and SelectableCard content, AppShell pages |
| `Text size="xs"` → caption role: 1.55 → 1.6 (12px) | same, where xs is used |
| `Text size="lg"` → body-lg role: 18px at 1.5 from `sm` (was 1.55), **16px on phones** (was 18px) | ledes |
| Field hint / help / error, Alert and Toast description, Banner text, MetadataList term, List description, Table caption, FileUpload description / error, vertical Stepper description → body-sm (1.55 → 1.6) | those components |
| Field "optional" marker, FileUpload hint, Tooltip → caption (1.55 → 1.6) | those components |
| Group labels in Menu, Select, Combobox, CommandPalette, the TopNav drawer and BottomSheet's label → eyebrow role: line height 1.55 → 1.2 (each label 4px shorter); tracking was already 0.08em | open menus and lists with groups |
| Banner inline padding 16px → the gutter: **24px from `sm`**, 16px on phones, plus the notch in landscape | Banner |
| TopNav `md` bar on phones: 20px → 16px sides (desktop keeps 20px) | TopNav below 672px |
| Story chrome: TopNav stories render edge to edge (`pageLevel`); Field's story subheads use the eyebrow role (0.06em → 0.08em); every story's canvas padding is the gutter (16px on a phone viewport; unchanged 24px on desktop) | Storybook only |

Heading, Accordion, the vertical Stepper title and Text `base` / `md` were already on the role values and render identically.

**Open, needs a decision:**
- **Label role vs Field label.** The `label` role is 14px; Field's label (like the HTML preview's `.field__label`) is 13px semibold. Field was left at 13px rather than grow every form label by 1px unasked. Either the token moves to 13px or Field moves to `type-label`.
- **Code role.** `code` is 13px on phones and 14px from `sm`; Code renders 13px everywhere. Left alone for the same reason.
- **TopNav vs the gutter on desktop.** The `md` bar is 20px in from 672px up; AppShell's content and Banner are 24px. Moving TopNav to the gutter is a 4px desktop change, not made here.
- **10px micro-labels.** Badge `sm`, the Chip's avatar initials and TreeList's count badge draw 10px text inside fixed 18-20px chrome. They are below the 12px floor the caption role sets for readable text; they were converted to rem and otherwise left.

## Component findings (High first)

| ID | Component | Severity | What happens | Cause |
|---|---|---|---|---|
| N-01 | TopNav | High | From 672 to about 1008px (landscape phones, portrait tablets) the desktop bar shows and overlaps itself | One breakpoint (672), no check for whether links fit (`TopNav.tsx:60,170,187`, `TopNavToggle.tsx:50`) |
| D1 | DataTable / Table | High | At 320 only the checkbox and name are visible; row actions are 999px off-screen with no cue. Actions are also hidden at 1280 | `Table.tsx:111` `min-w-max`, no scroll cue, `pinFirstColumn` not exposed, actions not sticky |
| D2 | DataTable | High | No stacked/card layout on phones | — |
| L1 | List | High | Text column 23–34px at 320 | `List.tsx:92,187` trailing slot `shrink-0` |
| F1 | FileUpload rows | High | Name column 54–87px at 320 | `FileUpload.tsx:666` (same as L1) |
| N-02 | AppShell | High | Page 336–410px wide at 320; breadcrumbs overlap the H1 | `AppShell.tsx:140` needs `grid-cols-[minmax(0,1fr)]` (fix verified) |
| N-03 | CommandPalette | High | Landscape / 200% zoom: lower results off-screen | `CommandPalette.tsx:165,520` |
| M-01 | Toast | High | Landscape: 4th toast off-screen above the top; stack covers page actions | `Toast.tsx:163` |
| M-02 | SegmentedControl | High | Overflows the page by 35px at 320 | `SegmentedControl.tsx:45,50` |
| M-03 / M-04 | ButtonGroup, ToggleButtonGroup | High | Overflow up to 157px at 320 | `ButtonGroup.tsx:36` (S4) |
| M-05 | Pagination | High | The 9-slot rail needs 306–324px; wraps to 2–3 rows with an orphaned arrow | `Pagination.tsx:361` |
| A2 | OtpInput | High | 6×44px boxes need 304px; last box cut off at 320 | `OtpInput.tsx:228` |
| A3 | Code | High | Block with a header overflows the page at 320/360 | `Code.tsx:140` |
| A4 | Button | High | Long full-width label is cut off; page becomes 332px | `Button.tsx:36` `whitespace-nowrap` |
| N-05 / M-11 | Popover, DatePicker | Medium–High | Runs past the screen in landscape | `Popover.tsx:137-150` |
| N-06 / N-07 | TopNav | Medium | Sticky open panel can't scroll in landscape. Picking a dropdown item leaves the panel open. Dropdown floats over the panel | `TopNavToggle.tsx:117-120` |
| N-08 | BottomSheet (default) | Medium | Full 1920px width on desktop | `BottomSheet.tsx:125` |
| A5 | PhoneInput | Medium | Country list 10px wider than a 320 screen | `PhoneInput.tsx:415` `min-w-80` |
| M-07 / M-08 | Tooltip, HoverCard | Medium | Long tooltip text runs off-screen. On touch they open only through focus-on-tap, which iOS doesn't do. A link trigger navigates before the card shows | `Tooltip.tsx:201-203` |
| M-09 / M-10 | MetadataList, Breadcrumbs | Medium | 140px term column at 320; breadcrumbs don't collapse by width and leave orphaned separators | `MetadataList.tsx:69`, `Breadcrumbs.tsx:151,172` |
| TB1 / TR1 | Toolbar, TreeList | Medium | Toolbar wraps awkwardly (a separator starts a line, ⋯ alone on a line). TreeList indent has no cap; labels collapse from level 7 | `Toolbar.tsx:265`, `TreeList.tsx:363,378` |
| T2 / T3 | Table | Medium | Pinned column 66% wide with no divider; the scroll region can't get keyboard focus | `Table.tsx:95-103,206` |
| — | Low | Low | Dialog body only 155px in landscape; SelectableCard jumps from 1 to 3 columns; Tabs have no overflow fade; Carousel arrows cover text on phones; Banner action overflows; Chip remove button 20px; stand-alone links 19px tall; code scroller can't get keyboard focus | see the per-audit reports |

## What changes at each width

| Component | Changes at |
|---|---|
| Heading type roles | Step up at `sm` 672 |
| Stepper | Horizontal from 672 |
| Toast | Full width below 672, bottom-right from 672 |
| SelectableCard | 1 column → 2 or 3 columns at 672 |
| TopNav | Menu button below 672 |
| AppShell | Drawer below `md` 1056 |
| Carousel | perView steps at sm, md and lg |
| BottomSheet `full` split | Side-by-side from 672 |

Everything else is fluid or wraps. The mismatch between TopNav (672) and AppShell (1056) is undocumented.

## Does TopNav have a mobile menu that opens a side drawer?

No.
- `collapse="menu"` is a push-down panel below 672px. It has no backdrop, no focus trap and no scroll lock.
- `collapse="scroll"` scrolls the link row sideways.
- AppShell's drawer holds the side rail only, not the TopNav links.

Proposed: add `collapse="drawer"` (TopNav links and actions in a SideDrawer, with dropdowns shown as accordions) and a configurable collapse breakpoint.

## Fix plan

1. **Wave 1: shared fixes (S1–S6, S9).** These are small changes in shared recipes that clear most rows above:
   - 16px field text on touch devices
   - an invisible 44px hit area on coarse pointers
   - width guards: `minmax(0,1fr)` grids, `overflow-wrap:anywhere`, shrinkable flex rows, fluid OTP boxes
   - an overflow strategy for joined groups
   - `available-height` clamps on popovers, a `dvh` palette, a capped Toast stack
   - safe-area insets and `vh` fallbacks
   - viewport meta docs
2. **Wave 2: component behaviour.**
   - TopNav `collapse="drawer"` and a configurable breakpoint; fix the 672–1056 range and the panel bugs.
   - Table/DataTable: scroll cues, sticky actions, `pinFirstColumn`, focusable scroll region, and an optional `mobileLayout="cards"`.
   - List/FileUpload/TreeList trailing rows wrap below `sm`.
   - Pagination auto-compact, Breadcrumbs auto-collapse, MetadataList stacked below `sm`.
   - Toolbar overflow into a menu.
   - BottomSheet default max width on desktop; compact header in landscape.
   - Tooltip wraps; a tap path for HoverCard.
3. **Wave 3: system.**
   - rem tokens (no visual change at the default 16px root).
   - Components use the `--type-*` roles.
   - A 320px overflow check on every story in CI, so reflow can't regress.

Evidence (screenshots, measurements, scripts) is in the audit scratchpad folders for this session: `audit/{atoms,molecules,organisms-nav,organisms-data-system}/`.
