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
      link: ['checks.html#sent-early', 'Open these rows']
    });
  }
  blocked.forEach((item) => list.push({
    group: item.status === 'Blocked' ? 'blocked' : 'waiting',
    title: item.title,
    detail: item.detail,
    action: item.next,
    link: ['week.html?view=attention', 'Open needs attention']
  }));
  waitingLessons.forEach((lesson) => list.push({
    group: 'testing',
    title: lesson.title,
    detail: lesson.shows,
    action: lesson.action,
    link: [`lessons.html#${encodeURIComponent(lesson.status)}/${lesson.verdict}`, 'Open this lesson']
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

const state = { group: null };
const list = decisionsWaiting();
const groupsWithItems = GROUPS.filter(([key]) => list.some((item) => item.group === key));

function showGroupTiles() {
  const grid = document.getElementById('decide-grid');
  grid.replaceChildren();

  groupsWithItems.forEach(([key, label, note]) => {
    const items = list.filter((item) => item.group === key);
    const tile = create('button', 'decide-tile');
    tile.type = 'button';
    tile.dataset.flag = key;
    tile.dataset.focus = `decide:${key}`;

    const count = create('span', 'decide-count');
    count.append(create('b', '', String(items.length)), create('span', '', items.length === 1 ? 'item' : 'items'));
    tile.append(count, create('span', 'decide-name', label), create('small', '', note));
    tile.addEventListener('click', () => {
      Trail.go([key]);
      readUrl(true);
    });
    grid.append(tile);
  });
}

function showGroup() {
  const [key, label, note] = GROUPS.find(([name]) => name === state.group);
  const items = list.filter((item) => item.group === key);
  const view = document.getElementById('decide-view');
  view.dataset.flag = key;
  buildTrail(document.getElementById('decide-trail'), [{ label: 'Decide first', path: [] }], (path) => Trail.back(path, () => readUrl(true)));
  document.getElementById('decide-group-title').textContent = label;
  document.getElementById('decide-group-note').textContent = note;
  document.getElementById('decision-list').replaceChildren(...items.map(decisionCard));
}

function render() {
  document.getElementById('decide-count').textContent = `${list.length} ${list.length === 1 ? 'item' : 'items'} in three groups`;
  document.getElementById('summary-decisions').textContent = String(list.length);
  document.getElementById('summary-decisions-note').textContent = list.length === 1 ? 'item' : 'items';
  document.getElementById('decide-grid').hidden = Boolean(state.group);
  document.getElementById('decide-view').hidden = !state.group;
  if (state.group) showGroup();
  else showGroupTiles();
}

// The address bar decides what is on screen, whichever way you got here
function readUrl(moveFocus) {
  const was = state.group;
  const [key] = Trail.path();
  state.group = groupsWithItems.some(([name]) => name === key) ? key : null;
  render();
  if (!moveFocus || state.group === was) return;
  if (state.group) document.getElementById('decide-group-title').focus();
  else {
    const tile = document.querySelector(`[data-focus="decide:${was}"]`);
    if (tile) tile.focus();
  }
}

Trail.watch(() => readUrl(true));

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

readUrl(false);
showStages();
showMail();
