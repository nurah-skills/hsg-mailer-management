// What this board would tell someone looking at all three at once.
// The hub reads this rather than keeping its own copy of the figures, so the two can never disagree.
// It is loaded by summary.html, which the hub opens in a hidden frame.

const current = totalsFor(campaignsIn(PERIOD.current));
const waiting = decisionsWaiting();
const openProblems = PROBLEMS.filter((problem) => problem.status !== 'Resolved');

const SUMMARY = {
  board: 'mailer',
  name: 'Mailer board',
  what: 'What is ready to send, what needs a decision, and what the mail did.',
  home: 'pages/overview.html',
  read: SNAPSHOT.mailRead,
  needs: [
    {
      count: waiting.filter((item) => item.group === 'blocked').length,
      one: 'decision blocked', many: 'decisions blocked',
      href: 'pages/decisions.html#blocked', tone: 'stop'
    },
    {
      count: waiting.filter((item) => item.group === 'waiting').length,
      one: 'decision waiting on someone', many: 'decisions waiting on someone',
      href: 'pages/decisions.html#waiting', tone: 'hold'
    },
    {
      count: [...new Set(CHECKS.map(({ job }) => job.code))].length,
      one: 'row to settle', many: 'rows to settle',
      href: 'pages/checks.html', tone: 'hold'
    },
    {
      count: openProblems.length,
      one: 'problem still open', many: 'problems still open',
      href: 'pages/problems.html', tone: 'stop'
    }
  ],
  figures: [
    { label: 'Tracker rows', value: formatNumber(JOBS.length), note: `${formatNumber(JOBS.filter((job) => job.stage === 'Ready for AC build').length)} ready for the build` },
    { label: 'Emails sent', value: formatNumber(current.sent), note: PERIOD.current.label }
  ]
};

parent.postMessage({ hsgSummary: SUMMARY }, location.origin);
