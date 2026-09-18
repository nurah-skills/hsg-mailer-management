# Mailer board

What is ready, what needs attention, and what the mailers delivered.

A management view over the email campaigns for Skills Academy, Matric College and Bellview: the jobs in flight, the campaigns that went out, and the evidence behind each decision.

**Live site:** https://nurah-skills.github.io/hsg-mailer-management/

This is a working design. It follows the same measures and rules as the current mailer board, with made-up campaigns, jobs and names, and it isn’t connected to the real trackers or the mail tool yet.

## Trying it

1. Open the live site.
2. Choose **Look around as a manager**.
3. Sign out from the bottom of the menu.

The board is for the marketing managers, so there is one kind of account. On a phone the menu sits behind the menu button, with Overview, Decisions and This week along the bottom. The menu also links to the other boards, and every page has a **Refresh the mail tool** button, which explains that sample figures don’t refresh.

## Pages

| Page | What it does |
| --- | --- |
| `pages/overview.html` | The landing page: four figures with how each moved, emails sent by day, how the mail landed as three rings, the work by phase, the problems to resolve first, and the mail figures against the period before. |
| `pages/decisions.html` | The job stages and the period’s mail figures, then what needs a management call. “Decide first” shows three tiles — **Blocked** (red), **Waiting** (yellow) and **Being tested** (green) — with a count on each. Open one to read its items; the cards take the colour of the group. |
| `pages/week.html` | The period against the same weekdays before, with filters for college, purpose and family. Three views: **Comparison** (sends, campaigns, click rate, unsubscribes, plus registrations and responses alongside), **Same age** (results measured the same number of hours after each send) and **Needs attention** (dated findings from the lead-source audit). |
| `pages/jobs.html` | Every work item from the trackers: phase, stage, owner, audience, next check and the note, with filters and search. The count above the table says what is filtering the list, and **Show all** puts every row back. |
| `pages/campaigns.html` | Every campaign with sends, deliveries, opens, clicks and hard bounces. Every campaign counted in the heading is on the page. Sort by clicking a column heading, or with the **Sort by** control on a phone. Anything above the review thresholds is marked “worth a look”. |
| `pages/checks.html` | Rows whose record contradicts itself or is missing something, grouped by the kind of problem. Choose one to see those rows. |
| `pages/lessons.html` | Two steps in. Four tiles, one per status — **Observed**, **Being tested**, **Confirmed**, **Retired** — each with a count and what that status means. Open one and it splits into **Working well** and **Working badly**. Open one of those to read the lessons: the evidence, what it does not prove, and what to do. |
| `pages/sources.html` | What the board is connected to and what each connection may do, the workbooks it reads and when they were read, how to read the figures, and what is still not joined up. |
| `index.html` | Sign in, or look around as a manager. |

## What the figures mean

- **Sends are emails, not people.** Somebody mailed twice counts twice.
- **Delivered** is sends minus hard and soft bounces.
- **Click rate** is people who clicked, divided by deliveries. Opens and clicks can include automated scanning.
- **Campaign counters are lifetime totals** grouped by the date the campaign went out, so a newer campaign has had less time to collect results. That is what the same-age view is for.
- **Registrations and cash are never joined to campaigns** on this board, so no conversion rate is shown.
- **A tracker saying “sent” is a reported state,** not evidence that mail went out.
- **A hard bounce rate above 3% or a click rate above 20%** is marked “worth a look”. Neither proves a fault.
- **A change chip is green when the figure went up and red when it went down,** against the period before. It reports the direction, not a verdict: on unsubscribes and hard bounces, up is not the good news.
- **“The current period” always means 14 to 16 September.** Any figure counted over a longer run says so on the figure itself.
- **Reading only.** The board never creates, schedules or sends a mailer, and never writes back to a tracker.

## Sample data

Every campaign, job, owner, tracker and lesson here is made up, so no real staff names, addresses or figures are stored in this public repo. The sample period is 14 to 16 September 2026 against 7 to 9 September, with the mail read at 13:08 on 18 September.

## Folders

```
index.html             sign in, the way into the site
pages/                 the signed-in pages, one file each
assets/css/styles.css  all styles, in the same order as the menu
assets/img/            the logo
assets/js/shared/      used by several pages
  session.js           demo sign-in and sign-out (loads first on every page)
  data.js              sample campaigns, jobs, checks, lessons and sources
  app.js               menu, bottom bar, messages and small helpers
  charts.js            rings, the run over time and the ranked bars, drawn as plain SVG
  auth.js              sign-in buttons
assets/js/pages/       one script per page, named after the page
```

## Finding your way around

Where you are inside a page is in the address bar, so the browser's back button and a phone's back gesture step back one level rather than leaving the page — and a link can be sent to someone:

- `checks.html#no-owner` opens that kind of problem
- `lessons.html#Observed/bad` opens what is going badly under Observed
- `jobs.html?stage=Waiting+on+AC` opens the job list already filtered
- `campaigns.html?college=BV&sort=bounce` opens Bellview sorted by hard bounces

Every page that opens into tiles shows the same trail above the heading — the page name, then each step you took — and each step is a button back to that level. The counts on Overview and the cards under "Decide first" link straight to the rows they are about.

## On a phone

Tables have no room for a heading row on a phone, so each figure is printed with its own heading beside it. Nothing is dropped and no number is left unlabelled. The three most used pages sit in a bar along the bottom, and the rest are under **More**.

## Working on it

Plain HTML, CSS and JavaScript, with nothing to build. Headings and figures are set in Archivo, running text in Nunito, both from Google Fonts. To run it on your own computer, open a terminal in this folder and run:

```
npx.cmd serve .
```

Changes pushed to the `main` branch go live on GitHub Pages within a few minutes.

## Still to do

- Connect the real trackers and the mail tool
- Real sign-in with approved work emails
- Take a reading a set number of hours after every send, so weeks compare like for like
- Join campaigns to registrations and cash, if that is ever agreed
