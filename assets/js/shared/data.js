// Made-up campaigns, jobs and trackers so the board can be designed before the real sources are connected.
// The measures follow the current mailer board: sends, deliveries, clicks, unsubscribes, job phases and evidence checks.

const SNAPSHOT = {
  mailRead: '18 September 2026 at 13:08 SAST',
  salesRead: '17 September 2026 at 13:59 SAST',
  responsesRead: '17 September 2026 at 13:37 SAST',
  today: '18 September 2026'
};

const PERIOD = {
  current: { from: '2026-09-14', to: '2026-09-16', label: '14 to 16 September' },
  previous: { from: '2026-09-07', to: '2026-09-09', label: '7 to 9 September' },
  note: 'Same weekdays, Monday to Wednesday'
};

const COLLEGES = ['SA', 'MC', 'BV', 'Multiple', 'Unclassified'];
const COLLEGE_NAMES = { SA: 'Skills Academy', MC: 'Matric College', BV: 'Bellview', Multiple: 'More than one college', Unclassified: 'Not labelled yet' };
const PURPOSES = ['Sales', 'Nurture', 'Collections', 'Service', 'Unclassified'];
const FAMILIES = [
  'Childcare / education', 'Course matching', 'Employer funded', 'Free course', 'Funding options',
  'ICB', 'Matric', 'Multi-college', 'OHS', 'R390 offer', 'R450 offer', 'Reactivation', 'Unclassified family'
];

// The people who own mailer jobs in this sample
const OWNERS = [
  'Lerato Mokoena', 'Sipho Dlamini', 'Ayesha Patel', 'Johan van Wyk', 'Nomsa Khumalo',
  'Thandeka Zulu', 'Megan Fourie', 'Karabo Radebe', 'Naledi Sithole', 'Craig Jacobs'
];

const PHASES = ['B', 'C', 'D', 'E', 'E-2', 'F', 'G', 'H', 'K'];
const STAGES = ['In preparation', 'Audience prepared', 'Ready for AC build', 'Waiting on AC', 'Reported sent / live', 'Paused / blocked'];

// Same seed gives the same figures on every visit
function seededRandom(text) {
  let seed = 0;
  for (const character of text) seed = (seed * 31 + character.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (list, random) => list[Math.floor(random() * list.length)];

const SEND_DATES = [
  '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
  '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17'
];

const SUBJECTS = [
  ['Sales', 'R450 offer', 'R450 digital offer follow-up'],
  ['Sales', 'R390 offer', 'R390 offer reminder'],
  ['Sales', 'Matric', 'Matric rewrite places open'],
  ['Sales', 'ICB', 'ICB bookkeeping intake'],
  ['Sales', 'Course matching', 'Still deciding on a course?'],
  ['Sales', 'Funding options', 'Ways to pay for your course'],
  ['Sales', 'Multi-college', 'Three colleges, one application'],
  ['Sales', 'Reactivation', 'Your 2025 enquiry is still open'],
  ['Nurture', 'Free course', 'Free short course this month'],
  ['Nurture', 'Childcare / education', 'Childcare course open days'],
  ['Nurture', 'Employer funded', 'Ask your employer to fund it'],
  ['Service', 'Unclassified family', 'Your student number and next steps'],
  ['Collections', 'Unclassified family', 'Outstanding fees reminder'],
  ['Unclassified', 'OHS', 'Health and safety course update']
];

// Campaign records, the way the mail tool reports them: lifetime counters grouped by send date
const CAMPAIGNS = (() => {
  const random = seededRandom('hsg campaigns');
  const list = [];

  SEND_DATES.forEach((date) => {
    const perDay = 6 + Math.floor(random() * 5);
    for (let index = 0; index < perDay; index += 1) {
      const [purpose, family, subject] = SUBJECTS[Math.floor(random() * SUBJECTS.length)];
      const college = random() < 0.18 ? 'Unclassified' : pick(['SA', 'MC', 'BV'], random);
      const owner = pick(OWNERS, random);
      const big = random() < 0.35;
      const sent = big ? 4000 + Math.floor(random() * 60000) : 40 + Math.floor(random() * 3200);
      const hardBounces = Math.round(sent * (0.001 + random() * 0.006));
      const softBounces = Math.round(sent * (0.002 + random() * 0.008));
      const delivered = sent - hardBounces - softBounces;
      const openRate = 0.004 + random() * 0.05;
      const clickRate = openRate * (0.05 + random() * 0.35);
      list.push({
        id: `C-${63000 + list.length * 7}`,
        name: `[${college}] ${subject} · ${owner.split(' ')[0]} ${date.slice(8)} Sept`,
        date,
        college,
        purpose,
        family,
        owner,
        kind: random() < 0.12 ? 'split' : 'single',
        sent,
        delivered,
        hardBounces,
        softBounces,
        openers: Math.round(delivered * openRate),
        clickers: Math.round(delivered * clickRate),
        unsubscribes: Math.round(delivered * (0.0004 + random() * 0.003))
      });
    }
  });

  // One campaign with a bounce problem worth spotting
  const problem = list.find((campaign) => campaign.sent > 20000);
  if (problem) {
    problem.hardBounces = Math.round(problem.sent * 0.047);
    problem.delivered = problem.sent - problem.hardBounces - problem.softBounces;
  }
  return list;
})();

const inPeriod = (date, period) => date >= period.from && date <= period.to;

// The comparison runs over three weekdays ending on a chosen completed day, against the
// same three weekdays a week earlier. Only days the board has actually read can be chosen.
const COMPLETED_DAYS = SEND_DATES.filter((date) => date >= '2026-09-11');

const dayName = (date) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date + 'T00:00:00Z').getUTCDay()];
const shiftDays = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);
const readable = (date) => `${Number(date.slice(8))} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(date.slice(5, 7)) - 1]}`;

// Two dates in the same month name it once: 14 to 16 September, not 14 September to 16 September
const spanLabel = (from, to) => (from.slice(0, 7) === to.slice(0, 7)
  ? `${Number(from.slice(8))} to ${readable(to)}`
  : `${readable(from)} to ${readable(to)}`);

function periodThrough(endDate) {
  const from = shiftDays(endDate, -2);
  const previousEnd = shiftDays(endDate, -7);
  const previousFrom = shiftDays(previousEnd, -2);
  return {
    current: { from, to: endDate, label: spanLabel(from, endDate) },
    previous: { from: previousFrom, to: previousEnd, label: spanLabel(previousFrom, previousEnd) },
    note: `Same weekdays, ${dayName(from)} to ${dayName(endDate)}`
  };
}

function campaignsIn(period, filters = {}) {
  return CAMPAIGNS.filter((campaign) =>
    inPeriod(campaign.date, period)
    && (!filters.college || filters.college === 'All' || campaign.college === filters.college)
    && (!filters.purpose || filters.purpose === 'All' || campaign.purpose === filters.purpose)
    && (!filters.family || filters.family === 'All' || campaign.family === filters.family));
}

function totalsFor(campaigns) {
  const add = (key) => campaigns.reduce((sum, campaign) => sum + campaign[key], 0);
  const delivered = add('delivered');
  return {
    campaigns: campaigns.length,
    sent: add('sent'),
    delivered,
    hardBounces: add('hardBounces'),
    clickers: add('clickers'),
    openers: add('openers'),
    unsubscribes: add('unsubscribes'),
    clickRate: delivered ? add('clickers') / delivered : 0,
    openRate: delivered ? add('openers') / delivered : 0,
    unsubscribeRate: delivered ? add('unsubscribes') / delivered : 0,
    bounceRate: add('sent') ? add('hardBounces') / add('sent') : 0
  };
}

// The last few days of one figure, oldest first, for the small charts inside the cards
function dailyTotals(key, days = 10, endDate = PERIOD.current.to, filters = {}) {
  const dates = shiftDays(endDate, -(days - 1));
  const list = [];
  for (let step = 0; step < days; step += 1) {
    const date = shiftDays(dates, step);
    const onDay = CAMPAIGNS.filter((campaign) => campaign.date === date
      && (!filters.college || filters.college === 'All' || campaign.college === filters.college)
      && (!filters.purpose || filters.purpose === 'All' || campaign.purpose === filters.purpose)
      && (!filters.family || filters.family === 'All' || campaign.family === filters.family));
    list.push(key === 'campaigns' ? onDay.length : onDay.reduce((sum, campaign) => sum + campaign[key], 0));
  }
  return list;
}

// Registrations and survey responses come from other sources and are never joined to campaigns here
const OUTCOMES = {
  registrations: { previous: 499, current: 416, byCollege: { SA: [251, 191], MC: [125, 97], BV: [123, 128] } },
  responses: { previous: 592, current: 648 }
};

// Work items from the trackers
const JOBS = (() => {
  const random = seededRandom('hsg jobs');
  const titles = [
    'Multi-college reactivation', 'R4 900 supply chain', 'R4 900 office and secretarial', 'Matric rewrite push',
    'ICB intake', 'Employer funded list', 'Childcare open day', 'Free short course', 'Funding options explainer',
    'Course matching quiz', 'Payer-score wave', 'Fresh enquiry digital', 'Management studies', 'OHS refresher',
    'Afrikaans follow-up', 'Second-year upsell'
  ];
  const notes = [
    'Copy and routing pass done. Update the build from the brief column, then rerun the desktop and mobile preview, sender, links, footer and unsubscribe checks.',
    'Audience list rebuilt this week. Counts still to be confirmed against the source file before the build starts.',
    'Ready for the build: customer copy, named sender, current list count and offer wording all checked.',
    'Waiting on the mail tool. Nothing to do on this side until the build is returned for checking.',
    'Reported as sent by the owner. Not yet matched to a campaign record in the mail tool.',
    'Paused while the lead list owner confirms which contacts may be mailed.'
  ];

  return Array.from({ length: 44 }, (unused, index) => {
    const phase = PHASES[Math.floor(random() * PHASES.length)];
    const stage = STAGES[Math.floor(random() * STAGES.length)];
    const college = random() < 0.25 ? 'Unclassified' : pick(['SA', 'MC', 'BV', 'Multiple'], random);
    return {
      code: `${phase}-${String(100 + index)}`,
      title: `${pick(titles, random)} · ${COLLEGE_NAMES[college]}`,
      phase,
      stage,
      college,
      owner: pick(OWNERS, random),
      audience: Math.round((200 + random() * 68000) / 10) * 10,
      nextCheck: random() < 0.4 ? '' : SEND_DATES[5 + Math.floor(random() * 4)],
      note: pick(notes, random),
      row: 5 + index
    };
  });
})();

// Checks compare what the tracker rows record. They never look at the mail itself.
const CHECK_TYPES = [
  ['sent-early', 'Marked sent, but the stage is earlier', 'The sent field reports the mail went out while the overall stage still shows an earlier step.'],
  ['no-pack', 'Build pack link missing', 'The row has no link to the brief or build pack, so the build cannot be checked.'],
  ['no-owner', 'No owner recorded', 'Nobody is named for the next step on this row.'],
  ['no-audience', 'Audience count missing', 'The row has no list size, so the send cannot be sized or checked afterwards.'],
  ['no-college', 'College not recorded', 'The row does not say which college the mail belongs to.']
];

function checksFor() {
  const random = seededRandom('hsg checks');
  const list = [];
  JOBS.forEach((job) => {
    if (job.stage === 'Reported sent / live' && random() < 0.75) list.push({ job, type: CHECK_TYPES[0] });
    if (random() < 0.28) list.push({ job, type: CHECK_TYPES[1] });
    if (random() < 0.12) list.push({ job, type: CHECK_TYPES[2] });
    if (random() < 0.15) list.push({ job, type: CHECK_TYPES[3] });
    if (job.college === 'Unclassified') list.push({ job, type: CHECK_TYPES[4] });
  });
  return list;
}

const CHECKS = checksFor();

// Dated lessons: what to repeat, what to change, and what the evidence does not prove
const LESSONS = [
  {
    id: 'lesson-responses',
    verdict: 'good',
    status: 'Observed',
    title: 'Survey response flow is holding up',
    scope: 'Available survey response sheets · 7 to 16 September',
    shows: 'Monday to Wednesday responses rose from 592 to 648, up 9.5%. Marked tests are left out and repeated submissions are counted once.',
    limits: 'This is a positive sign, not proof that a mailer worked. Failed sheet reads and undated records are not included, and responses are not linked to campaigns.',
    action: 'Keep the routes that bring in responses. Find the campaigns behind them before spending more.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-bellview',
    verdict: 'good',
    status: 'Observed',
    title: 'Bellview registrations held up while the group fell',
    scope: 'Bellview · all registrations · 7 to 16 September',
    shows: 'Bellview recorded 128 registrations on 14 to 16 September against 123 the week before, up 4.1%. Group registrations fell from 499 to 416.',
    limits: 'Registrations are not cash. This does not show which campaigns or which sales habits made the difference.',
    action: 'Look at how Bellview follows up leads and test one part of it elsewhere. Confirm the pattern over another period.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-r450',
    verdict: 'good',
    status: 'Being tested',
    title: 'The R450 offer keeps its click rate at a much bigger volume',
    scope: 'Sales · R450 offer · 7 to 16 September',
    shows: 'Sends grew from 241 110 to 607 272 and the click rate held at 0.28%. Clickers rose from 683 to 1 707.',
    limits: 'Clicks are not sales, and the newer campaigns have had less time to collect results. Bots may be counted.',
    action: 'Hold the rate through one more week at this volume before treating it as settled.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-sender',
    verdict: 'bad',
    status: 'Observed',
    title: 'Mail still goes out under a staff member who has left',
    scope: 'Matric College · handover check · 14 to 16 September',
    shows: 'The departure was confirmed on 17 September. During 14 to 16 September, 19 049 sends used that person’s stored sender identity, and 12 responses came back to the same workbook.',
    limits: 'This says nothing about the quality of the mail itself. It is an ownership and reply-handling problem.',
    action: 'Agree who owns the address, who answers the replies, and change the sender on the next build.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-unclassified',
    verdict: 'bad',
    status: 'Observed',
    title: 'A quarter of sends are still not labelled',
    scope: 'All colleges · since 15 June',
    shows: '469 603 of the 1 732 914 sends since 15 June sit under an unclassified purpose and family, so they cannot be compared with anything.',
    limits: 'The mail may have been fine. The gap is in the labelling, not necessarily the campaign.',
    action: 'Label purpose and family at build time, not afterwards. Start with the biggest recent sends.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-bounce',
    verdict: 'bad',
    status: 'Being tested',
    title: 'One list is bouncing far more than the rest',
    scope: 'Reactivation list · 14 September',
    shows: 'One campaign returned a 4.7% hard bounce rate against 0.31% across all campaigns.',
    limits: 'A single campaign is a small sample, and the list may simply be older than the others.',
    action: 'Clean the list before it is used again and check where the addresses came from.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-checkpoints',
    verdict: 'bad',
    status: 'Confirmed',
    title: 'Results are read at different ages, so weeks are not comparable',
    scope: 'All campaigns · since 15 June',
    shows: 'Only 1 of the 188 campaigns sent since 15 June has a recorded checkpoint. None of the 319 sent before that have one either.',
    limits: 'This is about measurement, not the mail. Nothing here says the campaigns did badly.',
    action: 'Take a reading 24 hours after every send so that like is compared with like.',
    updated: '17 September 2026'
  },
  {
    id: 'lesson-lists',
    verdict: 'bad',
    status: 'Retired',
    title: 'Older lead lists were mailed twice in the same week',
    scope: 'Skills Academy · 1 to 5 September',
    shows: 'Two sends a day apart used overlapping segments of the same list, so the same people were mailed twice.',
    limits: 'It is not clear how many people overlapped, because the segments were not saved.',
    action: 'Retired: the segments are now saved with each build, and the same overlap has not happened since.',
    updated: '12 September 2026'
  }
];

// Dated findings from the lead-source audit
const ATTENTION = [
  {
    id: 'attention-permissions',
    title: 'Phase D file permissions confirmed',
    status: 'Confirmed',
    date: '18 September 2026',
    detail: 'Two named people have edit permission on the tracker, all 35 linked lead files and the shared brief. This checks the permission settings, not that either person has signed in, and not that a campaign is ready.',
    next: 'No change needed on these files. Keep send approval separate from list ownership.'
  },
  {
    id: 'attention-2022',
    title: '2022 lists delivered, but only part of the year',
    status: 'Waiting',
    date: '18 September 2026',
    detail: '33 workbooks were delivered and could be read: Skills Academy 15, Matric College 12 and Bellview 6. They cover October to December, August to December and September to December. The sender said it is not a full year.',
    next: 'Match these against the outstanding request and avoid counting overlapping segments twice.'
  },
  {
    id: 'attention-aptitude',
    title: 'Both Bellview aptitude sheets are still empty',
    status: 'Blocked',
    date: '18 September 2026',
    detail: 'The two sheets that should hold aptitude results opened with headings and no rows on 18 September.',
    next: 'Ask the owner whether the results live somewhere else before any mail is planned around them.'
  },
  {
    id: 'attention-replies',
    title: 'Replies to a departed sender have no owner',
    status: 'Blocked',
    date: '17 September 2026',
    detail: 'Mail still goes out under a staff member who has left, and nobody is named to answer the replies that come back.',
    next: 'Name an owner for the address and change the sender on the next build.'
  },
  {
    id: 'attention-labels',
    title: 'Purpose and family labels missing on a quarter of sends',
    status: 'Waiting',
    date: '16 September 2026',
    detail: '469 603 sends since 15 June carry no purpose or family label, so they cannot be compared with earlier weeks.',
    next: 'Label at build time. Start with the biggest sends from 14 to 16 September.'
  }
];


// A dated register of findings and what was done about them. Every name and figure here is made up.
const PROBLEM_STATUSES = [
  ['Needs checking', 'info', 'An open question. Nobody has confirmed a fault yet.'],
  ['Confirmed', 'changed', 'The finding has been checked and it holds.'],
  ['Being fixed', 'waiting', 'Someone is working on it now.'],
  ['Awaiting verification', 'info', 'A fix went in and is waiting for evidence that it worked.'],
  ['Resolved', 'good', 'Settled, with the evidence that settled it. Kept as a record.']
];

const PROBLEM_CATEGORIES = ['Records and reporting', 'Lead delivery', 'Access', 'Ownership', 'Our analysis'];

const PROBLEMS = [
  {
    id: 'PF-01',
    title: 'Three enquiries from January to July are not in the checked workbook',
    status: 'Confirmed',
    category: 'Lead delivery',
    found: '18 September 2026',
    owner: 'Not assigned',
    due: 'Not agreed',
    affects: 'How complete the historical record is. Three enquiries could not be found by submission number anywhere in this workbook, or by email or phone in its main tab. That does not prove they were never worked, or that they are missing from every list.',
    evidence: '1 947 completed submission numbers were exported against 1 944 rows in the main tab. Four completed numbers are absent and one is a partial entry. All six tabs of the original workbook were checked and no September numbers are missing. Three older enquiries remain absent: one from 21 January, one from 27 February where the email was recorded as three letters, and one from 6 July.',
    next: 'Confirm who owns each of the three records and what contact history exists before anyone restores or contacts them. Check the February enquiry against the original phone number rather than a name that merely looks similar. Then decide whether the submissions need restoring.',
    changed: 'Cross-checked the three against the other lead sheets. Two matching contact records were found in the mail tool and one older voicemail note was dated before the enquiry, so it cannot be the follow-up. No contact was made, nothing was restored, and no source row was edited.',
    verification: 'Cell-by-cell checks covered four further tabs in this workbook and nine populated tabs across five related workbooks; one further tab was empty. Phone and email searches with matching formats returned no rows. Staff mailboxes, call recordings and message histories were not looked at.',
    lesson: 'A missing form submission is not proof of a missing person or of poor follow-up. Match the exact contact details, date any contact history against the enquiry, and confirm who owns a record before restoring or contacting anyone.',
    history: 3
  },
  {
    id: 'PF-02',
    title: 'A difference of 16 responses is explained, but the reporting still needs cleaning',
    status: 'Confirmed',
    category: 'Records and reporting',
    found: '18 September 2026',
    owner: 'Nomsa Khumalo',
    due: 'Not agreed',
    affects: 'Whether the historical counts can be trusted. The gap between the export and the sheet is explained by test entries, staff entries, placeholders, one partial and one duplicate. It is not evidence of 16 lost leads.',
    evidence: 'The export holds 1 846 completed submission numbers. The sheet holds 1 830 rows and 1 829 unique numbers. Eighteen completed numbers are absent across all four tabs: eleven carry an explicit test marker, five use a staff address and two hold one-letter placeholder details. One main-tab entry appears in the partial export and one number is duplicated across two rows. 1 846 − 18 + 1 partial + 1 duplicate = 1 830.',
    next: 'Keep the reconciliation as evidence. Agree how the five staff-address entries should be classified. Compare the duplicate rows in full and keep the notes before anything is removed, and separate partial responses in reporting.',
    changed: 'Replaced an unexplained difference of 16 with an exact, number-by-number explanation, and found the duplicate and the partial that account for the last two.',
    verification: 'Each absent number was looked up in all four tabs. The arithmetic was checked against the raw export rather than the summary formulas. No rows were deleted.',
    lesson: 'A net difference between two counts is a question, not a finding. Explain it entry by entry before anyone calls it lost work.',
    history: 2
  },
  {
    id: 'PF-03',
    title: 'Mail still goes out under a staff member who has left',
    status: 'Being fixed',
    category: 'Ownership',
    found: '17 September 2026',
    owner: 'Refiloe Sibanda',
    due: '25 September 2026',
    affects: 'Who answers the replies. Departure was confirmed on 17 September, and 19 049 sends from 14 to 16 September still used that stored sender identity. Twelve dated submissions came back to the same workbook.',
    evidence: 'The sender identity appears on four campaigns in the period. The reply address still routes to a mailbox nobody is named against. Twelve responses arrived after the departure date.',
    next: 'Name an owner for the address, change the sender on the next build, and decide what happens to replies already sitting in that mailbox.',
    changed: 'The sender was changed on the two campaigns still in preparation. The two already reported sent keep the old identity in their record.',
    verification: 'Checked the sender field on every campaign in the period rather than the campaign names. The mailbox itself was not opened.',
    lesson: 'A departure is a mail change as well as an access change. Check sender identities in the same week, not at the next build.',
    history: 4
  },
  {
    id: 'PF-04',
    title: 'Two Bellview aptitude sheets opened with headings and no rows',
    status: 'Needs checking',
    category: 'Records and reporting',
    found: '18 September 2026',
    owner: 'Not assigned',
    due: 'Not agreed',
    affects: 'Whether aptitude results exist for Bellview at all. Both sheets that should hold them were read successfully and returned only their heading row.',
    affectsNote: '',
    evidence: 'Both sheets were read at 13:38 on 17 September. Each returned a heading row and no data rows. No error was returned, so the read itself worked.',
    next: 'Ask the owner whether the results live somewhere else before any mail is planned around them. An empty sheet that reads cleanly is not the same as a missing sheet.',
    changed: 'Nothing yet. The finding is recorded so that nobody plans a send on the assumption the data is there.',
    verification: 'The read was repeated once with the same result. Other tabs in the same workbook returned rows normally, so the connection is fine.',
    lesson: 'A clean read of an empty sheet looks identical to a clean read of a full one in a summary count. Check row counts, not just whether the read succeeded.',
    history: 1
  },
  {
    id: 'PF-05',
    title: 'A quarter of sends carry no purpose or family label',
    status: 'Awaiting verification',
    category: 'Our analysis',
    found: '16 September 2026',
    owner: 'Megan Fourie',
    due: '30 September 2026',
    affects: 'Every comparison by purpose or family. 469 603 of the 1 732 914 sends since 15 June sit under an unclassified label, so they cannot be compared with anything.',
    evidence: 'Labels are read from the campaign name. Where the name does not carry a recognisable purpose or family, the board records it as unclassified rather than guessing.',
    next: 'Label purpose and family at build time rather than afterwards. Start with the biggest recent sends, since those move the totals most.',
    changed: 'A naming rule was agreed on 16 September and applied to builds from that date. The backlog before it is untouched.',
    verification: 'Waiting on the next full period to see whether the unclassified share falls. Nothing yet confirms the rule is being followed.',
    lesson: 'A label the board has to infer from a name is a label that will be wrong sometimes. Record it where the work is done.',
    history: 2
  },
  {
    id: 'PF-06',
    title: 'The tracker index pointed at a retired copy of the Phase G sheet',
    status: 'Resolved',
    category: 'Access',
    found: '11 September 2026',
    owner: 'Thandeka Zulu',
    due: '15 September 2026',
    affects: 'Which rows the board read for Phase G. For four days the index pointed at a copy that had stopped being updated on 2 September.',
    evidence: 'The index row for Phase G held a link to a file last edited on 2 September, while the working copy had been edited that morning. Sixteen rows differed between them.',
    next: 'Nothing outstanding. The index points at the working copy and the read time confirms it.',
    changed: 'The index link was corrected on 15 September and the board re-read the working copy. The four days of readings taken from the retired copy are marked in the source register.',
    verification: 'The row counts from both files were compared after the change, and the sixteen differing rows now appear. The read time moved to 17 September as expected.',
    lesson: 'An index is a source in its own right. A stale link fails quietly, because every read succeeds.',
    history: 5
  }
];

const problemsAt = (status) => PROBLEMS.filter((problem) => problem.status === status);

// Results measured a set number of hours after each send, so a new campaign is not compared with an old one
const CHECKPOINT_WINDOWS = [24, 72, 168, 336];

const CHECKPOINTS = [
  { campaign: 'Management studies · Afrikaans · 14 September', sentAt: '16 September, 11:25', measuredAt: '17 September, 13:38', age: 26.2, delivered: 11, clickers: 0 },
  { campaign: 'R450 digital offer · 15 September', sentAt: '15 September, 09:02', measuredAt: '16 September, 10:15', age: 25.2, delivered: 7508, clickers: 15 },
  { campaign: 'Matric rewrite places · 15 September', sentAt: '15 September, 14:40', measuredAt: '16 September, 15:05', age: 24.4, delivered: 5466, clickers: 42 }
];

// The workbooks this board reads
const SOURCES = [
  { name: 'Master document index', rows: 1, range: 'Index sheet', read: '17 September, 13:38', scope: 'Lists every tracker below and who owns it.' },
  { name: 'Marketing actions tracker', rows: 388, range: 'Actions tracker A1:Z1018', read: '17 September, 13:38', scope: 'The original tracker. Rows here set the job codes used everywhere else.' },
  { name: 'Phase B actions tracker', rows: 40, range: 'Actions tracker A1:AA1000', read: '17 September, 13:38', scope: 'Reactivation and offer sends for all three colleges.' },
  { name: 'Phase C actions tracker', rows: 48, range: 'Actions tracker A1:AA200', read: '17 September, 13:38', scope: 'Eligible digital lists by course intent.' },
  { name: 'Phase D actions tracker', rows: 35, range: 'Actions tracker A1:AB200', read: '17 September, 13:38', scope: 'Lead files delivered by the colleges.' },
  { name: 'Phase E (ICB) actions tracker', rows: 12, range: 'Actions tracker A1:AA200', read: '17 September, 13:38', scope: 'ICB intake sends.' },
  { name: 'Phase E-2 actions tracker', rows: 16, range: 'Actions tracker A1:AA1000', read: '17 September, 13:38', scope: 'Second ICB wave.' },
  { name: 'Phase F actions tracker', rows: 24, range: 'Actions tracker A1:AA1000', read: '17 September, 13:38', scope: '2026 leads.' },
  { name: 'Phase G actions tracker', rows: 16, range: 'Sheet 1 A1:Z80', read: '17 September, 13:38', scope: 'Proof and call follow-up.' },
  { name: 'Phase H actions tracker', rows: 4, range: 'Sheet 1 A1:AA1000', read: '17 September, 13:38', scope: 'Newest wave, still being set up.' },
  { name: 'Phase K fresh build tracker', rows: 10, range: 'Actions tracker A1:AA30', read: '17 September, 13:38', scope: 'The rebuilt Phase K. The earlier Phase K build is not counted a second time.' }
];

const COVERAGE = {
  mailRecords: 4782,
  sendLogRows: 1042,
  outcomesFilled: 0,
  since: '15 June 2026'
};

// What the board is allowed to do with each connection
const CONNECTIONS = [
  {
    name: 'Mail tool',
    status: 'Connected',
    tone: 'good',
    detail: 'The board reads campaigns and their reports. Refreshing never creates, loads, schedules or sends a mailer.'
  },
  {
    name: 'Tracker sheets',
    status: 'Dated snapshot',
    tone: 'info',
    detail: 'Tracker rows are a saved reading from 17 September. Editing a sheet does not change this board, and the board never writes back. Open a source below for its latest state.'
  },
  {
    name: 'Job review assistant',
    status: 'Not connected in this demo',
    tone: 'waiting',
    detail: 'In the real board this reviews a job’s management fields and suggests a next step, with its confidence shown. It never receives lead lists or contact details, and its suggestions never approve or send anything. No key is entered anywhere in this demo.'
  }
];

// How to read what is on this board
const READING_NOTES = [
  ['Rows are not campaigns', 'Each job is identified by its workbook, tab and row. The same work can appear in more than one phase, so rows are not merged into one campaign.'],
  ['“Sent” is a reported state', 'A tracker saying sent, an approval, a prepared file or a matching campaign name is not evidence that mail went out. Each phase keeps its own approval wording on the job.'],
  ['Audience counts stay unknown when unclear', 'A count is only used when the column holds nothing but numbers. Where audience, status and import counts disagree, that difference is flagged for review rather than settled here.'],
  ['Rates use different bases', 'Open and click rates use calculated deliveries. Hard bounce rates use sends. The same person can be counted in several campaigns, and automated scanning can look like opens and clicks.'],
  ['Thresholds are prompts, not faults', 'A hard bounce rate above 3% or a click rate above 20% is worth a look. Neither proves anything is wrong.'],
  ['What has not been checked', 'Ten trackers and the original send log were read, and campaign history covers 15 June 2026 onward. Individual briefs, every past email and recipient-level exports have not been audited here.']
];

const formatNumber = (value) => Math.round(value).toLocaleString('en-ZA').replace(/,/g, ' ');
const formatPercent = (value, places = 2) => `${(value * 100).toFixed(places)}%`;

function changeBetween(previous, current) {
  if (!previous) return { text: 'No earlier figure', tone: 'move' };
  const difference = (current - previous) / previous;
  if (Math.abs(difference) < 0.005) return { text: 'No change', tone: 'move' };
  const direction = difference > 0 ? 'up' : 'down';
  return {
    text: `${Math.abs(difference * 100).toFixed(1)}%`,
    tone: direction,
    direction
  };
}
