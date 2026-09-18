setUpShell();

// Anything a manager has to settle, kept in three groups so the worst is read first
const GROUPS = [
  ['blocked', 'Blocked', 'Stuck until someone makes a call.'],
  ['waiting', 'Waiting', 'Moving, but waiting on an answer from someone else.'],
  ['testing', 'Being tested', 'A change is running and the result is not in yet.']
];

function decisionsWaiting() {
  const conflicts = CHECKS.filter(({ type }) => type[0] === 'sent-early');
  const waitingLessons = LESSONS.filter((lesson) => lesson.status === 'Being tested');
  const blocked = ATTENTION.filter((item) => item.status !== 'Confirmed');

  const list = [];
  if (conflicts.length) {
    list.push({
      group: 'blocked',
      title: `${conflicts.length} jobs are marked as sent while the stage says otherwise`,
      detail: 'The tracker row says the mail went out, but the same row still shows an earlier step. Until that is settled, "sent" cannot be trusted as a count.',
      action: 'Agree who updates the stage after a send, then clear the backlog.',
      link: ['checks.html', 'Open the evidence checks']
    });
  }
  blocked.forEach((item) => list.push({
    group: item.status === 'Blocked' ? 'blocked' : 'waiting',
    title: item.title,
    detail: item.detail,
    action: item.next,
    link: ['week.html', 'Open needs attention']
  }));
  waitingLessons.forEach((lesson) => list.push({
    group: 'testing',
    title: lesson.title,
    detail: lesson.shows,
    action: lesson.action,
    link: ['lessons.html', 'Open the lessons']
  }));
  return list;
}

function decisionCard(item) {
  const entry = create('li', 'decision-card');
  const link = create('a', 'text-link', item.link[1]);
  link.href = item.link[0];
  entry.append(create('h4', '', item.title), create('p', '', item.detail), create('p', 'decision-action', item.action), link);
  return entry;
}

function showDecisions() {
  const list = decisionsWaiting();
  document.getElementById('summary-decisions').textContent = String(list.length);
  document.getElementById('summary-decisions-note').textContent = list.length === 1 ? 'item' : 'items';

  const holder = document.getElementById('decision-list');
  holder.replaceChildren();
  if (!list.length) {
    holder.append(create('p', 'empty', 'Nothing waiting on a decision right now.'));
    return;
  }

  GROUPS.forEach(([key, label, note]) => {
    const group = list.filter((item) => item.group === key);
    if (!group.length) return;

    const section = create('section', 'decision-group');
    section.dataset.flag = key;
    const head = create('div', 'decision-group-head');
    head.append(create('span', 'flag-dot'), create('h3', '', label), create('span', 'flag-count', `${group.length} ${group.length === 1 ? 'item' : 'items'}`));

    const cards = create('ul', 'decision-cards');
    group.forEach((item) => cards.append(decisionCard(item)));
    section.append(head, create('p', 'panel-note', note), cards);
    holder.append(section);
  });
}

function showStages() {
  const holder = document.getElementById('stage-list');
  holder.replaceChildren();
  const most = Math.max(...STAGES.map((stage) => JOBS.filter((job) => job.stage === stage).length), 1);

  STAGES.forEach((stage) => {
    const jobs = JOBS.filter((job) => job.stage === stage);
    const item = create('li');
    const top = create('div', 'college-top');
    top.append(create('span', '', stage), create('b', '', String(jobs.length)));
    const track = create('div', 'track track-small');
    const fill = create('span', 'track-fill');
    fill.style.width = `${(jobs.length / most) * 100}%`;
    track.append(fill);
    item.append(top, track);
    holder.append(item);
  });
}

function showMail() {
  const current = totalsFor(campaignsIn(PERIOD.current));
  const previous = totalsFor(campaignsIn(PERIOD.previous));

  document.getElementById('summary-sent').textContent = formatNumber(current.sent);
  document.getElementById('summary-sent-change').replaceChildren(statusChip(changeBetween(previous.sent, current.sent)));
  document.getElementById('summary-unmatched').textContent =
    String(CHECKS.filter(({ type }) => type[0] === 'sent-early').length);

  const rows = [
    ['Campaigns sent', `${formatNumber(current.campaigns)} · ${formatNumber(previous.campaigns)} before`],
    ['Emails sent', `${formatNumber(current.sent)} · ${formatNumber(previous.sent)} before`],
    ['Click rate', `${formatPercent(current.clickRate)} · ${formatPercent(previous.clickRate)} before`],
    ['Unsubscribes', `${formatNumber(current.unsubscribes)} · ${formatNumber(previous.unsubscribes)} before`]
  ];
  const holder = document.getElementById('mail-figures');
  holder.replaceChildren();
  rows.forEach(([term, value]) => {
    const row = create('div');
    row.append(create('dt', '', term), create('dd', '', value));
    holder.append(row);
  });
}

document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
showDecisions();
showStages();
showMail();
