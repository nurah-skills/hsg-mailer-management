# Design

How the mailer board is put together. Written from the code, not ahead of it: if the two disagree, the code is right and this file is out of date.

The board is a **working tool, not a pitch**. Someone opens it to settle something, so scanning, consistency and plain language come before expression. Every figure on screen is a count the board can trace; nothing is inferred, and nothing is dressed up as more certain than it is.

## Colour

Colours live as custom properties on `:root` in `assets/css/styles.css`, redefined once under `@media (prefers-color-scheme: dark)`. Nothing in the stylesheet uses a raw colour value — if a new colour is needed, it becomes a token first.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--page` | `#EDF1F5` | `#0E1319` | The ground behind everything |
| `--card` | `#FFFFFF` | `#161D25` | Panels, tiles, the raised surfaces |
| `--field` | `#E4EAF0` | `#1D262F` | Inputs, chip backgrounds, chart tracks |
| `--ink` | `#16202B` | `#E9EDF1` | Body text |
| `--muted` | `#55636F` | `#9AA7B4` | Second-line text, labels, captions |
| `--line` | `#D3DCE5` | `#2A3541` | Hairlines and dividers |
| `--navy` / `--navy-deep` | `#1E2A38` / `#141D26` | `#17212C` / `#111922` | The menu, and the art on the check tiles |
| `--accent` | `#E8A33C` | `#E0AE55` | The amber the board is known by |
| `--accent-ink` | `#8A5410` | `#F0C579` | Links, and text on amber |
| `--focus` | `#2E6FA8` | `#8DB7E3` | The focus ring |

**The three status colours** carry meaning and are used nowhere decorative:

| Meaning | Soft | Line | Ink |
| --- | --- | --- | --- |
| Stop (blocked, went down, working badly) | `--red-soft` | `--red-line` | `--red-ink` |
| Hold (waiting) | `--yellow-soft` | `--yellow-line` | `--yellow-ink` |
| Go (being tested, went up, working well) | `--green-soft` | `--green-line` | `--green-ink` |

A group applies them by setting `data-flag="blocked|waiting|testing"`, which maps them onto `--flag-soft`, `--flag-line` and `--flag-ink` for everything inside.

**Charts** take `--ring-accent`, `--ring-good`, `--ring-warn`, `--chart-line` and `--chart-fill`. These are darkened versions of the palette so a thin stroke still reads against `--card`.

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

- `--radius: 14px` on panels, tiles and cards. Chips and pills are `999px`. Small marks (the icon badge) are `10px`.
- Panels are padded `20px 22px`, tiles `18px`, the page `24px 16px` on a phone and up to `32px` above that.
- Panels sit on a 12-column grid (`.span-4` … `.span-8`), collapsing to one column at 900px.
- **Elevation is declared once.** A raised surface takes `--shell` and no border: a soft shadow in light, a hairline ring in dark. A card never sits inside another card.

## Components

- **`.tile`** — a figure with its name, an icon badge, and a footer that can hold a change chip and a note. Built by `statTile()` in `assets/js/shared/app.js`, used on Overview, This week and Campaigns.
- **`.status`** — a chip. `status-up` / `status-down` carry a direction arrow and the green/red pair; `status-well` / `status-poor` say whether a lesson is good news; `status-good`, `-info`, `-waiting`, `-changed` are the neutral states. A chip never carries a verdict the figure does not support.
- **Drill-down tiles** — `.decide-tile` (colour-filled, urgency) and `.status-tile` / `.category-tile` (plain, a stage or a kind). Opening one puts the step in the address bar; a `.trail` above the heading names the way back.
- **Charts**, in `assets/js/shared/charts.js`, drawn as plain SVG with no library: `ringChart()` for one rate, `areaChart()` for a run over time, `barList()` for a ranked set. Every chart prints its scale, so each mark names a value the chart reaches.
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
