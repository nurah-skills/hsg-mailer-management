setUpShell();

// College narrows the work and the mail; phase and the search are tracker fields,
// so they narrow the work only. The note under the filters says so on screen.
const state = {
  through: COMPLETED_DAYS.includes(Params.get('through', '')) ? Params.get('through', '') : PERIOD.current.to,
  college: Params.get('college', 'All'),
  phase: Params.get('phase', 'All'),
  search: Params.get('search', '')
};

function fillSelect(id, label, options, value, onChange) {
  const select = document.getElementById(id);
  select.replaceChildren(new Option(label, 'All'), ...options.map((option) => new Option(option, option)));
  select.value = value;
  select.addEventListener('change', (event) => onChange(event.target.value));
}

function jobsShown() {
  const search = state.search.trim().toLowerCase();
  return JOBS.filter((job) =>
    (state.college === 'All' || job.college === state.college)
    && (state.phase === 'All' || job.phase === state.phase)
    && (!search || `${job.code} ${job.title} ${job.owner}`.toLowerCase().includes(search)));
}

function checksShown() {
  const codes = new Set(jobsShown().map((job) => job.code));
  return CHECKS.filter(({ job }) => codes.has(job.code));
}

const period = () => periodThrough(state.through);
const mailFilters = () => ({ college: state.college });
const mailNow = () => totalsFor(campaignsIn(period().current, mailFilters()));
const mailBefore = () => totalsFor(campaignsIn(period().previous, mailFilters()));

function activeFilters() {
  return [
    state.college !== 'All' ? COLLEGE_NAMES[state.college] || state.college : null,
    state.phase !== 'All' ? `Phase ${state.phase}` : null,
    state.search.trim() ? `“${state.search.trim()}”` : null
  ].filter(Boolean);
}

function showNote() {
  const filters = activeFilters();
  const workOnly = state.phase !== 'All' || state.search.trim();
  document.getElementById('overview-note').textContent = filters.length
    ? `${formatNumber(jobsShown().length)} of ${formatNumber(JOBS.length)} tracker rows, filtered by ${filters.join(' and ')}${workOnly ? ' · phase and search are tracker fields, so the mail figures below follow the college only' : ''}`
    : `All ${formatNumber(JOBS.length)} tracker rows and every campaign the board holds`;
  document.getElementById('overview-clear').hidden = !filters.length;
}

function clearFilters() {
  state.college = 'All';
  state.phase = 'All';
  state.search = '';
  Params.set({ college: '', phase: '', search: '' });
  ['overview-college', 'overview-phase'].forEach((id) => { document.getElementById(id).value = 'All'; });
  document.getElementById('overview-search').value = '';
  render();
  document.getElementById('overview-college').focus();
}

// What is waiting for a manager, whatever the filters below are set to
function showStartHere() {
  const waiting = decisionsWaiting();
  const open = PROBLEMS.filter((problem) => problem.status !== 'Resolved');
  const recent = PROBLEMS.filter((problem) => problem.found === SNAPSHOT.today);

  const items = [
    {
      count: waiting.filter((item) => item.group === 'blocked').length,
      one: 'decision blocked', many: 'decisions blocked',
      href: 'decisions.html#blocked', tone: 'is-stop'
    },
    {
      count: waiting.filter((item) => item.group === 'waiting').length,
      one: 'decision waiting on someone', many: 'decisions waiting on someone',
      href: 'decisions.html#waiting', tone: 'is-hold'
    },
    {
      count: [...new Set(CHECKS.map(({ job }) => job.code))].length,
      one: 'row to settle', many: 'rows to settle',
      href: 'checks.html', tone: 'is-hold'
    },
    {
      count: open.length,
      one: 'problem still open', many: 'problems still open',
      href: 'problems.html', tone: 'is-stop'
    }
  ].filter((item) => item.count);

  const holder = document.getElementById('start-here');
  holder.replaceChildren();
  if (!items.length) {
    holder.append(create('p', 'start-empty', 'Nothing is waiting on a manager today.'));
    return;
  }

  holder.append(create('b', 'start-lead', 'Where to start'));
  items.forEach((item) => {
    const link = create('a', `start-item ${item.tone}`);
    link.href = item.href;
    link.append(create('b', '', formatNumber(item.count)), create('span', '', item.count === 1 ? item.one : item.many));
    holder.append(link);
  });
  if (recent.length) {
    holder.append(create('small', 'start-note', `${recent.length === 1 ? 'One was' : `${recent.length} were`} first written up today.`));
  }
}

function showTiles() {
  const jobs = jobsShown();
  const checks = checksShown();
  const current = mailNow();
  const previous = mailBefore();
  const needsCheck = [...new Set(checks.map(({ job }) => job.code))].length;
  const where = state.college === 'All' ? '' : ` · ${COLLEGE_NAMES[state.college] || state.college}`;

  const tiles = [
    {
      label: 'Tracker rows', icon: ICONS.rows, tone: 'is-info',
      value: formatNumber(jobs.length),
      note: `${formatNumber(jobs.filter((job) => job.stage === 'Ready for AC build').length)} ready for the build`,
      spark: STAGES.map((stage) => jobs.filter((job) => job.stage === stage).length),
      sparkLabel: 'Rows in each stage, in stage order', sparkMark: 'biggest',
      about: 'Every row on the mailer trackers, whatever state it is in. The small chart shows how those rows sit across the six stages.'
    },
    {
      label: 'Rows needing a check', icon: ICONS.alert, tone: 'is-warn',
      value: formatNumber(needsCheck),
      note: `${formatNumber(jobs.filter((job) => job.stage === 'Paused / blocked').length)} paused or blocked`,
      spark: CHECK_TYPES.map((type) => checks.filter((check) => check.type[0] === type[0]).length),
      sparkLabel: 'Checks raised of each kind', sparkMark: 'biggest',
      about: 'Rows where something is missing or does not agree with itself. One row can raise more than one check, so the checks add up to more than this number.'
    },
    {
      label: 'Emails sent', icon: ICONS.mail, tone: '',
      value: formatNumber(current.sent),
      note: `${formatNumber(current.campaigns)} campaigns · ${period().current.label}${where}`,
      change: changeBetween(previous.sent, current.sent),
      spark: dailyTotals('sent', 10, state.through, mailFilters()),
      sparkLabel: 'Emails sent on each of the last ten days',
      about: 'What the mail tool reports as sent over the three days in the period, not what the trackers plan to send. The college filter narrows this; phase and the search do not, because the mail tool does not carry them.'
    },
    {
      label: 'People who clicked', icon: ICONS.click, tone: 'is-good',
      value: formatNumber(current.clickers),
      note: `${formatPercent(current.clickRate)} of deliveries${where}`,
      change: changeBetween(previous.clickers, current.clickers),
      spark: dailyTotals('clickers', 10, state.through, mailFilters()),
      sparkLabel: 'People who clicked on each of the last ten days',
      about: 'People, not clicks: one person who clicks four links counts once. Newer mail has had less time to collect clicks, so the newest days sit low.'
    }
  ];

  document.getElementById('overview-tiles').replaceChildren(...tiles.map(statTile));
}

// Every campaign the board holds, grouped by the day it went out
function showSends() {
  const held = CAMPAIGNS.filter((campaign) => state.college === 'All' || campaign.college === state.college);
  const days = [...new Set(held.map((campaign) => campaign.date))].sort();
  const points = days.map((date) => ({
    label: `${Number(date.slice(8))} Sep`,
    value: held.filter((campaign) => campaign.date === date).reduce((sum, campaign) => sum + campaign.sent, 0)
  }));
  const chart = document.getElementById('sends-chart');
  if (!points.length) chart.replaceChildren(create('p', 'empty', 'No campaign for this college.'));
  else chart.replaceChildren(areaChart(points, { label: 'Emails sent by day' }));
}

function showRates() {
  const current = mailNow();
  const rates = [
    [current.delivered ? current.openers / current.delivered : 0, 'Opened', `${formatNumber(current.openers)} of ${formatNumber(current.delivered)} deliveries`, 'accent'],
    [current.clickRate, 'Clicked', `${formatNumber(current.clickers)} people`, 'good'],
    [current.sent ? current.hardBounces / current.sent : 0, 'Hard bounces', `${formatNumber(current.hardBounces)} addresses that do not exist`, 'warn']
  ];
  const holder = document.getElementById('rate-rings');
  holder.replaceChildren(...rates.map(([fraction, label, caption, tone]) => ringChart(fraction, label, caption, tone)));
}

function showPhases() {
  const jobs = jobsShown();
  const rows = PHASES
    .map((phase) => {
      const inPhase = jobs.filter((job) => job.phase === phase);
      const sent = inPhase.filter((job) => job.stage === 'Reported sent / live').length;
      return { label: `Phase ${phase}`, value: inPhase.length, note: `${sent} reported sent · ${inPhase.length - sent} still in progress` };
    })
    .filter((row) => row.value)
    .sort((a, b) => b.value - a.value);
  const holder = document.getElementById('phase-chart');
  if (!rows.length) holder.replaceChildren(create('p', 'empty', 'No tracker row matches this selection.'));
  else holder.replaceChildren(barList(rows, { split: true }));
}

function showSettle() {
  const holder = document.getElementById('settle-list');
  holder.replaceChildren();
  const checks = checksShown();
  const byType = CHECK_TYPES
    .map((type) => [type, checks.filter((check) => check.type[0] === type[0])])
    .filter(([, group]) => group.length)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4);

  if (!byType.length) {
    holder.append(create('li', '', 'Nothing to settle in this selection.'));
    return;
  }

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
  const current = mailNow();
  const previous = mailBefore();
  const span = period();
  document.getElementById('mail-span').textContent =
    `${span.current.label} against the same weekdays a week earlier, ${span.previous.label}.`;
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

// Registrations and responses come from other sheets, so no filter here changes them
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

function render() {
  showStartHere();
  showNote();
  showTiles();
  showSends();
  showRates();
  showPhases();
  showSettle();
  showMailTable();
}

const throughSelect = document.getElementById('overview-through');
throughSelect.replaceChildren(...[...COMPLETED_DAYS].reverse().map((date) =>
  new Option(`Through ${readableShort(date)}`, date)));
throughSelect.value = state.through;
throughSelect.addEventListener('change', (event) => {
  state.through = event.target.value;
  Params.set({ through: state.through === PERIOD.current.to ? '' : state.through });
  render();
});

fillSelect('overview-college', 'All colleges', COLLEGES, state.college, (value) => {
  state.college = value;
  Params.set({ college: value });
  render();
});
fillSelect('overview-phase', 'All phases', PHASES, state.phase, (value) => {
  state.phase = value;
  Params.set({ phase: value });
  render();
});

const overviewSearch = document.getElementById('overview-search');
overviewSearch.value = state.search;
overviewSearch.addEventListener('input', (event) => {
  state.search = event.target.value;
  Params.set({ search: state.search });
  render();
});

document.getElementById('overview-clear').addEventListener('click', clearFilters);

render();
showOutcomes();
