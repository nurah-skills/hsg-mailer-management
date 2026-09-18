setUpShell();

const current = totalsFor(campaignsIn(PERIOD.current));
const previous = totalsFor(campaignsIn(PERIOD.previous));
const needsCheck = [...new Set(CHECKS.map(({ job }) => job.code))].length;

function showTiles() {
  const tiles = [
    ['Tracker rows', formatNumber(JOBS.length), `${formatNumber(JOBS.filter((job) => job.stage === 'Ready for AC build').length)} ready for the build`],
    ['Rows needing a check', formatNumber(needsCheck), `${formatNumber(JOBS.filter((job) => job.stage === 'Paused / blocked').length)} paused or blocked`],
    ['Emails sent', formatNumber(current.sent), `${formatNumber(current.campaigns)} campaigns · ${PERIOD.current.label}`],
    ['Click rate', formatPercent(current.clickRate), `${formatNumber(current.clickers)} people clicked, of deliveries`]
  ];
  const holder = document.getElementById('overview-tiles');
  holder.replaceChildren();
  tiles.forEach(([label, value, note]) => {
    const tile = create('div', 'tile');
    tile.append(create('span', '', label), create('b', '', value), create('small', '', note));
    holder.append(tile);
  });
}

function showPhases() {
  const holder = document.getElementById('phase-grid');
  holder.replaceChildren();
  const most = Math.max(...PHASES.map((phase) => JOBS.filter((job) => job.phase === phase).length), 1);

  PHASES.forEach((phase) => {
    const jobs = JOBS.filter((job) => job.phase === phase);
    if (!jobs.length) return;
    const item = create('li');
    const top = create('div', 'college-top');
    top.append(create('span', '', `Phase ${phase}`), create('b', '', String(jobs.length)));
    const track = create('div', 'track track-small');
    const fill = create('span', 'track-fill');
    fill.style.width = `${(jobs.length / most) * 100}%`;
    track.append(fill);
    const sent = jobs.filter((job) => job.stage === 'Reported sent / live').length;
    item.append(top, track, create('p', 'panel-note', `${sent} reported sent · ${jobs.length - sent} still in progress`));
    holder.append(item);
  });
}

function showSettle() {
  const holder = document.getElementById('settle-list');
  holder.replaceChildren();
  const byType = CHECK_TYPES
    .map((type) => [type, CHECKS.filter((check) => check.type[0] === type[0])])
    .filter(([, group]) => group.length)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4);

  byType.forEach(([type, group]) => {
    const item = create('li');
    const top = create('div', 'decision-top');
    const link = create('a', 'text-link', type[1]);
    link.href = `checks.html#${type[0]}`;
    const heading = create('h3');
    heading.append(link);
    top.append(heading, statusChip({ tone: 'changed', text: `${group.length} rows` }));
    item.append(top, create('p', '', type[2]));
    holder.append(item);
  });
}

function showMailTable() {
  const table = document.getElementById('overview-mail');
  table.replaceChildren();

  const head = create('thead');
  const headRow = create('tr');
  ['Measure', 'Period before', 'This period', 'Change'].forEach((label) => {
    const cell = create('th', '', label);
    cell.scope = 'col';
    headRow.append(cell);
  });
  head.append(headRow);

  const rows = [
    ['Emails sent', previous.sent, current.sent, formatNumber],
    ['Campaigns', previous.campaigns, current.campaigns, formatNumber],
    ['Deliveries', previous.delivered, current.delivered, formatNumber],
    ['People who clicked', previous.clickers, current.clickers, formatNumber],
    ['Unsubscribes', previous.unsubscribes, current.unsubscribes, formatNumber]
  ];

  const body = create('tbody');
  rows.forEach(([label, before, now, format]) => {
    const row = create('tr');
    const first = create('th', 'cell-name', label);
    first.scope = 'row';
    const change = create('td', 'cell-status');
    change.append(statusChip(changeBetween(before, now)));
    row.append(first, create('td', 'cell-best', format(before)), create('td', 'cell-best', format(now)), change);
    body.append(row);
  });

  table.append(head, body);
  labelCells(table);
}

function showOutcomes() {
  const rows = [
    ['Registrations · all sources', `${formatNumber(OUTCOMES.registrations.current)} · ${formatNumber(OUTCOMES.registrations.previous)} before`],
    ['Survey responses', `${formatNumber(OUTCOMES.responses.current)} · ${formatNumber(OUTCOMES.responses.previous)} before`],
    ['Registrations from campaigns', 'Not joined up'],
    ['Cash from campaigns', 'Not joined up']
  ];
  const holder = document.getElementById('overview-outcomes');
  holder.replaceChildren();
  rows.forEach(([term, value]) => {
    const row = create('div');
    row.append(create('dt', '', term), create('dd', '', value));
    holder.append(row);
  });
}

document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
showTiles();
showPhases();
showSettle();
showMailTable();
showOutcomes();
