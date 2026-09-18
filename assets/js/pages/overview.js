setUpShell();

const current = totalsFor(campaignsIn(PERIOD.current));
const previous = totalsFor(campaignsIn(PERIOD.previous));
const needsCheck = [...new Set(CHECKS.map(({ job }) => job.code))].length;

function showTiles() {
  const tiles = [
    {
      label: 'Tracker rows', icon: ICONS.rows, tone: 'is-info',
      value: formatNumber(JOBS.length),
      note: `${formatNumber(JOBS.filter((job) => job.stage === 'Ready for AC build').length)} ready for the build`
    },
    {
      label: 'Rows needing a check', icon: ICONS.alert, tone: 'is-warn',
      value: formatNumber(needsCheck),
      note: `${formatNumber(JOBS.filter((job) => job.stage === 'Paused / blocked').length)} paused or blocked`
    },
    {
      label: 'Emails sent', icon: ICONS.mail, tone: '',
      value: formatNumber(current.sent),
      note: `${formatNumber(current.campaigns)} campaigns · ${PERIOD.current.label}`,
      change: changeBetween(previous.sent, current.sent)
    },
    {
      label: 'People who clicked', icon: ICONS.click, tone: 'is-good',
      value: formatNumber(current.clickers),
      note: `${formatPercent(current.clickRate)} of deliveries`,
      change: changeBetween(previous.clickers, current.clickers)
    }
  ];

  document.getElementById('overview-tiles').replaceChildren(...tiles.map(statTile));
}

// Every campaign the board holds, grouped by the day it went out
function showSends() {
  const days = [...new Set(CAMPAIGNS.map((campaign) => campaign.date))].sort();
  const points = days.map((date) => ({
    label: `${Number(date.slice(8))} Sep`,
    value: CAMPAIGNS.filter((campaign) => campaign.date === date).reduce((sum, campaign) => sum + campaign.sent, 0)
  }));
  document.getElementById('sends-chart').replaceChildren(areaChart(points, { label: 'Emails sent by day' }));
}

function showRates() {
  const rates = [
    [current.delivered ? current.openers / current.delivered : 0, 'Opened', `${formatNumber(current.openers)} of ${formatNumber(current.delivered)} deliveries`, 'accent'],
    [current.clickRate, 'Clicked', `${formatNumber(current.clickers)} people`, 'good'],
    [current.sent ? current.hardBounces / current.sent : 0, 'Hard bounces', `${formatNumber(current.hardBounces)} addresses that do not exist`, 'warn']
  ];
  const holder = document.getElementById('rate-rings');
  holder.replaceChildren(...rates.map(([fraction, label, caption, tone]) => ringChart(fraction, label, caption, tone)));
}

function showPhases() {
  const rows = PHASES
    .map((phase) => {
      const jobs = JOBS.filter((job) => job.phase === phase);
      const sent = jobs.filter((job) => job.stage === 'Reported sent / live').length;
      return { label: `Phase ${phase}`, value: jobs.length, note: `${sent} reported sent · ${jobs.length - sent} still in progress` };
    })
    .filter((row) => row.value)
    .sort((a, b) => b.value - a.value);
  document.getElementById('phase-chart').replaceChildren(barList(rows, { split: true }));
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
showSends();
showRates();
showPhases();
showSettle();
showMailTable();
showOutcomes();
