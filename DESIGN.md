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
| `--navy` / `--navy-deep` | `#14352C` / `#0C211A` | `#143027` / `#0C1F19` | The menu gradient, and the art on the check tiles |
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

- **The page header** — the page name and its one-line note on the left, the refresh button and the board state on the right, closed by a hairline. The state is a dot, **Not connected**, and when the board was last read. One row on a laptop, stacking on a phone.
- **`.tile`** — a figure with its name, an icon badge, and a footer that can hold a change chip and a note. Built by `statTile()` in `assets/js/shared/app.js`, used on Overview, This week and Campaigns.
- **`.status`** — a chip. `status-up` / `status-down` carry a direction arrow and the green/red pair; `status-well` / `status-poor` say whether a lesson is good news; `status-good`, `-info`, `-waiting`, `-changed` are the neutral states. A chip never carries a verdict the figure does not support.
- **Drill-down tiles** — `.decide-tile` (colour-filled, urgency) and `.status-tile` / `.category-tile` (plain, a stage or a kind). Opening one puts the step in the address bar; a `.trail` above the heading names the way back.
- **Charts**, in `assets/js/shared/charts.js`, drawn as plain SVG with no library: `ringChart()` for one rate, `donutChart()` for a share of a whole, `areaChart()` for a run over time, `pairedBars()` for before against now, `columnChart()` for a long set read across the panel, `barList()` for a ranked set. Every chart prints its scale or its legend, so each mark names a value the chart reaches. Donut slices take `--slice-1` to `--slice-5`.
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
