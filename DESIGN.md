# Design

How the mailer board is put together. Written from the code, not ahead of it: if the two disagree, the code is right and this file is out of date.

The board is a **working tool, not a pitch**. Someone opens it to settle something, so scanning, consistency and plain language come before expression. Every figure on screen is a count the board can trace; nothing is inferred, and nothing is dressed up as more certain than it is.

## Colour

Colours live as custom properties on `:root` in `assets/css/styles.css`, redefined once under `@media (prefers-color-scheme: dark)`. Nothing in the stylesheet uses a raw colour value — if a new colour is needed, it becomes a token first.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--page` | `#F1F6F3` | `#0A130F` | The ground behind everything |
| `--card` | `#FFFFFF` | `#12201A` | Panels, tiles, the raised surfaces |
| `--field` | `#E6EEE9` | `#1A2B24` | Inputs, chip backgrounds, chart tracks |
| `--ink` | `#11211B` | `#E7F0EB` | Body text |
| `--muted` | `#52665D` | `#96A9A0` | Second-line text, labels, captions |
| `--line` | `#D6E4DC` | `#26382F` | Hairlines and dividers |
| `--navy` / `--navy-deep` | `#14352C` / `#0C211A` | `#143027` / `#0C1F19` | The dark green cards, the sign-in panel, and the art on the check tiles |
| `--accent` | `#17A57C` | `#3FBF95` | The green the board is known by |
| `--accent-ink` | `#0A6B50` | `#7FDCBB` | Links, and text on green |
| `--focus` | `#0F766E` | `#6EE7C4` | The focus ring |

**The three status colours** carry meaning and are used nowhere decorative:

| Meaning | Soft | Line | Ink |
| --- | --- | --- | --- |
| Stop (blocked, went down, working badly) | `--red-soft` | `--red-line` | `--red-ink` |
| Hold (waiting) | `--yellow-soft` | `--yellow-line` | `--yellow-ink` |
| Go (being tested, went up, working well) | `--green-soft` | `--green-line` | `--green-ink` |

A group applies them by setting `data-flag="blocked|waiting|testing"`, which maps them onto `--flag-soft`, `--flag-line` and `--flag-ink` for everything inside.

**The colleges** each keep the colour they use on their own material, so a college looks the same in every chart:

| College | Token | Light | Dark |
| --- | --- | --- | --- |
| Skills Academy | `--college-sa` | `#0E8C86` | `#46B8B1` |
| Matric College | `--college-mc` | `#B3332A` | `#E2786A` |
| Bellview | `--college-bv` | `#29426B` | `#7E9DC9` |
| More than one college | `--college-multi` | `#6D6350` | `#BCA98A` |
| Not labelled yet | `--college-none` | `#77877F` | `#93A39B` |

`COLLEGE_COLOURS` in `assets/js/shared/data.js` maps a college to its token, and a chart row or slice carries it as `colour`. Matric College's red is a college colour, not a verdict — every chart that uses these names them in its key, and status still lives in chips and tinted cards, never in a chart fill.

**Charts** take `--ring-accent`, `--ring-good`, `--ring-warn`, `--chart-line`, `--chart-fill` and `--slice-1` … `--slice-5`. These are darkened versions of the palette so a thin stroke still reads against `--card`.

**Contrast.** Every text colour measures at least 4.5:1 against the surface behind it, in both themes. Chips and tinted cards are measured the same way, against their own tint rather than the page.

## Type

Two faces, from Google Fonts:

- **Archivo** (`--heading`) at 500/600/700 — headings, figures, tile counts, table figures. Chosen for a squarer skeleton that suits dense numbers.
- **Nunito** (`--body`) at 400/600/700 — everything else.

| Role | Size | Weight |
| --- | --- | --- |
| Page title `h1` | 30px (26px ≤900px) | 600 |
| Panel heading `h2` | 16px, `.open-section` 18px | 600 |
| Drill-down heading | 20–22px | 600 |
| Card title `h3` | 17–18px | 600 |
| Section label `.subheading` | 14px, body face | 700 |
| Body | 15px | 400 |
| Second line, captions | 13–14px | 400–700 |
| Big figure `.tile b` | 30px | 600 |

Rules that hold everywhere: running text stops at **68 characters**; every figure carries `font-variant-numeric: tabular-nums` so columns line up; a heading sits closer to what follows it than to what came before.

## Space and shape

**Three shapes, and nothing else.** A square corner next to a rounded one is the fastest way to look unfinished, so every corner comes from one of these:

| Token | Value | Used for |
| --- | --- | --- |
| `--radius` | `16px` | Panels, tiles, cards — anything that is a surface |
| `--radius-control` | `10px` | Buttons, inputs, selects, the header tag, icon badges |
| `--radius-mark` | `4px` | Colour swatches and legend dots |

A full pill (`999px`) is reserved for status chips and progress tracks, and `50%` for an avatar. Nothing else may invent a corner.

- Panels are padded `20px 22px`, tiles `18px`, the page `24px 16px` on a phone and up to `32px` above that.
- **The page rhythm is 22px, and every wrapper keeps it.** `.app-main` spaces its children by 22px. Any element that wraps stacked page sections — a view inside a page, an opened drill-down — has to carry the same column gap, or its children butt together and the cards read as one jammed block.
- Panels sit on a 12-column grid (`.span-4` … `.span-12`) up to `1760px` wide, collapsing to one column at 900px. Panels in a row **stretch to the same height**, so a row never looks ragged.
- **Elevation is declared once.** A raised surface takes `--shell` and no border: a soft shadow in light, a hairline ring in dark. A card never sits inside another card.

## Components

- **The menu** — a light column on `--card`, held off the page by a single hairline. The page you are on is a soft green pill with a thin green ring, so it reads at a glance in both themes; everything else is `--muted` until you hover it. `markCurrentPage()` sets that mark from the page's own file name, so a page built from a copy of another cannot point at the wrong entry. At the foot, one quiet line says **Not connected** and when the mail tool was read.
- **A menu that fits** — the whole column has to sit on the screen without scrolling, so its spacing is sized against the window: `clamp()` on the gaps, the padding and the row height, then two `max-height` steps that tighten the type and drop the second heading on short laptop screens. A finger still gets a 44px row through `@media (pointer: coarse)`. Below roughly 620px of window the menu scrolls, because there is nothing left to give.
- **Sign in** — one card resting on `--page`: the green panel on the left carrying the brand, the lead line, three points and the college names; the form on the right on `--card`. The panel's soft lights are radial gradients on a `::after`, never images. Under 900px the panel drops away and the form fills the screen.
- **The page header** — the page name and its one-line note on the left, the search field and the refresh button on the right, closed by a hairline. One row on a laptop, stacking on a phone.
- **Search** — one field in the header covering jobs, campaigns, evidence checks, lessons and problems. Every result is a link to the page that holds it, built from the same addresses those pages put in the address bar themselves, so a result lands with the right tile open and the right filter set. Built by `buildSearch()`.
- **`.tile`** — a figure with its name, an icon badge, a small chart of the run behind it, and a footer that can hold a change chip and a note. The **(i)** beside the name opens one sentence saying what the figure counts and what it does not. The small chart marks the newest day when the run is days, and the biggest group when the run is groups, so the dark bar never implies something the run does not say. Built by `statTile()` and `sparkline()`.
- **`.status`** — a chip. `status-up` / `status-down` carry a direction arrow and the green/red pair; `status-well` / `status-poor` say whether a lesson is good news; `status-good`, `-info`, `-waiting`, `-changed` are the neutral states. A chip never carries a verdict the figure does not support.
- **Drill-down tiles** — `.decide-tile` (colour-filled, urgency) and `.status-tile` / `.category-tile` (plain, a stage or a kind). Opening one puts the step in the address bar; a `.trail` above the heading names the way back.
- **Charts**, in `assets/js/shared/charts.js`, drawn as plain SVG with no library: `ringChart()` for one rate, `donutChart()` for a share of a whole, `areaChart()` for a run over time, `pairedBars()` for before against now, `columnChart()` for a long set read across the panel, `barList()` for a ranked set, `sparkline()` for the run inside a tile. Every chart prints its scale or its legend, so each mark names a value the chart reaches. Donut slices take `--slice-1` to `--slice-5`.
- **Reading a chart** — `areaChart()` carries a key above it naming the line and the highest day, and follows the pointer: the nearest day gets a dashed guide, a filled point and a dark reading giving the figure and the date. The reading slides in at the ends and drops below the line near the top, so it is never cut off by the panel. It is decoration on top of the `<title>` the chart already carries, never the only way to get the numbers.
- **The page footer** — one line under every page: *HSG · SAST · a management view. The source workbooks stay in charge of the work itself.* Built by `buildFooter()`, so no page can forget it.
- **Export** — `exportButton()` and `downloadRows()` in `assets/js/shared/app.js`. It saves exactly the rows on screen, so a filtered view exports filtered, and says how many rows it wrote.
- **Picking rows** — the Job pipeline and Campaign results tables carry a tick in the first column, and one in the heading row that takes everything on screen. Picked rows tint, the export button changes to **Export the 6 you picked**, and a pick that falls outside the filter is forgotten rather than quietly exported. Built by `rowPicker()`. On a phone the tick sits in the corner of each stacked card.
- **Tables** (`.results`) show a heading row on a laptop. On a phone the heading row is hidden and each cell carries its own heading through `data-label`, set by `labelCells()`.

## Motion

Almost none, and always short: 0.15s ease on colour and shadow, and the menu drawer sliding in. `prefers-reduced-motion` turns transitions off. Nothing animates on load — the page is readable in its first frame.

## Writing

- Say what a control does: **Show all 44**, **Back to all statuses**, **Open the evidence checks**.
- Name the limit next to the figure: *sends, not people* · *Not joined up* · *a reported state* · *Sample figures · not connected*.
- Plain South African English. No exclamation marks, no product jargon where an ordinary word exists. "The mail tool", not the vendor's name.
- A number that was counted over a different window says so on the number itself.

## Accessibility

- One `h1` per page, headings in order, no level skipped.
- Every control reachable by keyboard with a visible `--focus` ring; 44px targets on phones.
- Opening a drill-down moves focus to the new heading; coming back returns it to the tile.
- The phone drawer sets `inert` on the page behind it; the closed drawer is `inert` itself.
- Tables use `scope`, and sortable columns carry `aria-sort`. Counts that change are announced through `role="status"`.

## What this board will not do

No conversion rates across the mail/sales boundary. No colour that implies a verdict the evidence does not support. No figure without the window it was counted over. No chart drawn from anything but a number printed on the page.
