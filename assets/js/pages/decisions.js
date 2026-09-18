setUpShell();

// Anything a manager has to settle: contradictions in the records, lessons waiting on a call, blocked findings
function decisionsWaiting() {
  const conflicts = CHECKS.filter(({ type }) => type[0] === 'sent-early');
  const waitingLessons = LESSONS.filter((lesson) => lesson.status === 'Being tested');
  const blocked = ATTENTION.filter((item) => item.status !== 'Confirmed');

  const list = [];
  if (conflicts.length) {
    list.push({
      title: `${conflicts.length} jobs are marked as sent while the stage says otherwise`,
      detail: 'The tracker row says the mail went out, but the same row still shows an earlier step. Until that is settled, "sent" cannot be trusted as a count.',
      action: 'Agree who updates the stage after a send, then clear the backlog.',
      link: ['checks.html', 'Open the evidence checks'],
      tone: 'changed'
    });
  }
  blocked.forEach((item) => list.push({
    title: item.title,
    detail: item.detail,
    action: item.next,
    link: ['week.html', 'Open needs attention'],
    tone: item.status === 'Blocked' ? 'waiting' : 'info',
    status: item.status
  }));
  waitingLessons.forEach((lesson) => list.push({
    title: lesson.title,
    detail: lesson.shows,
    action: lesson.action,
    link: ['lessons.html', 'Open the lessons'],
    tone: 'info',
    status: 'Being tested'
  }));
  return list;
}

function showDecisions() {
  const list = decisionsWaiting();
  document.getElementById('summary-decisions').textContent = String(list.length);
  document.getElementById('summary-decisions-note').textContent = list.length === 1 ? 'item' : 'items';

  const holder = document.getElementById('decision-list');
  holder.replaceChildren();
  if (!list.length) {
    holder.append(create('li', 'empty', 'Nothing waiting on a decision right now.'));
    return;
  }

  list.forEach((item) => {
    const entry = create('li', 'decision');
    const top = create('div', 'decision-top');
    top.append(create('h3', '', item.title));
    if (item.status) top.append(statusChip({ tone: item.tone, text: item.status }));
    const link = create('a', 'text-link', item.link[1]);
    link.href = item.link[0];
    entry.append(top, create('p', '', item.detail), create('p', 'decision-action', item.action), link);
    holder.append(entry);
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
