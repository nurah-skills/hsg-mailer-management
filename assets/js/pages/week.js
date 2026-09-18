setUpShell();

const VIEWS = [['comparison', 'Comparison'], ['sameage', 'Same age'], ['attention', 'Needs attention']];
const ATTENTION_FILTERS = [['all', 'All'], ['Blocked', 'Blocked'], ['Waiting', 'Waiting'], ['Confirmed', 'Confirmed']];

const state = {
  through: COMPLETED_DAYS.includes(Params.get('through', '')) ? Params.get('through', '') : PERIOD.current.to,
  view: VIEWS.some(([key]) => key === Params.get('view', '')) ? Params.get('view', '') : 'comparison',
  college: Params.get('college', 'All'),
  purpose: Params.get('purpose', 'All'),
  family: Params.get('family', 'All'),
  window: 24,
  attention: 'all'
};

function fillSelect(id, label, options, value, onChange) {
  const select = document.getElementById(id);
  select.replaceChildren(new Option(label, 'All'), ...options.map((option) => new Option(option, option)));
  select.value = value;
  select.addEventListener('change', (event) => onChange(event.target.value));
}

const filters = () => ({ college: state.college, purpose: state.purpose, family: state.family });
const period = () => periodThrough(state.through);

function showTiles() {
  const current = totalsFor(campaignsIn(period().current, filters()));
  const previous = totalsFor(campaignsIn(period().previous, filters()));

  const tiles = [
    { label: 'Emails sent', value: formatNumber(current.sent), note: `${formatNumber(previous.sent)} in the period before`, icon: ICONS.mail, change: changeBetween(previous.sent, current.sent),
      spark: dailyTotals('sent', 10, state.through, filters()), sparkLabel: 'Emails sent on each of the ten days up to the day you are comparing through',
      about: 'What the mail tool reports as sent over the three weekdays in this period, after the filters above. The small chart runs over the ten days up to the day you compare through.' },
    { label: 'Campaigns', value: formatNumber(current.campaigns), note: `${formatNumber(previous.campaigns)} before · sends, not people`, icon: ICONS.rows, tone: 'is-info', change: changeBetween(previous.campaigns, current.campaigns),
      spark: dailyTotals('campaigns', 10, state.through, filters()), sparkLabel: 'Campaigns sent on each of the ten days up to the day you are comparing through',
      about: 'Sends, not people. One mail sent to three colleges counts three times, because the mail tool records it three times.' },
    { label: 'Click rate', value: formatPercent(current.clickRate), note: `${formatPercent(previous.clickRate)} before · newer mail has had less time to collect clicks`, icon: ICONS.click, tone: 'is-good',
      spark: dailyTotals('clickers', 10, state.through, filters()), sparkLabel: 'People who clicked on each of the ten days up to the day you are comparing through',
      about: 'People who clicked, as a share of mail that was delivered. Newer mail has had less time to collect clicks, so a period that ends today reads lower than one that ended a week ago.' },
    { label: 'Unsubscribes', value: formatNumber(current.unsubscribes), note: `${formatPercent(current.unsubscribeRate)} of deliveries`, icon: ICONS.alert, tone: 'is-warn', change: changeBetween(previous.unsubscribes, current.unsubscribes),
      spark: dailyTotals('unsubscribes', 10, state.through, filters()), sparkLabel: 'Unsubscribes on each of the ten days up to the day you are comparing through',
      about: 'People who asked to stop hearing from us. The arrow is coloured the same way as on the other figures, so read this one with that in mind: up here is not good news.' }
  ];

  document.getElementById('week-tiles').replaceChildren(...tiles.map(statTile));
}

function tableRow(cells, tag = 'td') {
  const row = create('tr');
  cells.forEach((cell, index) => {
    const node = create(index === 0 ? (tag === 'th' ? 'th' : 'th') : tag, '', typeof cell === 'string' ? cell : '');
    if (index === 0) node.scope = 'row';
    if (typeof cell !== 'string') node.append(cell);
    row.append(node);
  });
  return row;
}

function headRow(labels) {
  const head = create('thead');
  const row = create('tr');
  labels.forEach((label) => {
    const cell = create('th', '', label);
    cell.scope = 'col';
    row.append(cell);
  });
  head.append(row);
  return head;
}

function showColleges() {
  const rows = [];
  const slices = [];

  COLLEGES.forEach((college) => {
    const current = totalsFor(campaignsIn(period().current, { ...filters(), college }));
    const previous = totalsFor(campaignsIn(period().previous, { ...filters(), college }));
    if (!current.sent && !previous.sent) return;
    const registrations = OUTCOMES.registrations.byCollege[college];
    rows.push({
      label: COLLEGE_NAMES[college],
      first: previous.sent,
      second: current.sent,
      chip: statusChip(changeBetween(previous.sent, current.sent)),
      note: registrations
        ? `Registrations ${formatNumber(registrations[1])}, ${formatNumber(registrations[0])} before`
        : 'Registrations not mapped to this college'
    });
    if (current.sent) slices.push({ label: COLLEGE_NAMES[college], value: current.sent });
  });

  document.getElementById('college-chart').replaceChildren(pairedBars(rows, { first: 'Period before', second: 'This period' }));
  document.getElementById('college-share').replaceChildren(
    slices.length ? donutChart(slices) : create('p', 'empty', 'No mail in this selection.')
  );
}

function showOutcomes() {
  const rows = [
    ['Registrations · all sources', `${formatNumber(OUTCOMES.registrations.current)} · ${formatNumber(OUTCOMES.registrations.previous)} before`],
    ['Survey responses', `${formatNumber(OUTCOMES.responses.current)} · ${formatNumber(OUTCOMES.responses.previous)} before`],
    ['Registrations from campaigns', 'Not joined up'],
    ['Cash from campaigns', 'Not joined up']
  ];
  const holder = document.getElementById('outcome-figures');
  holder.replaceChildren();
  rows.forEach(([term, value]) => {
    const row = create('div');
    row.append(create('dt', '', term), create('dd', '', value));
    holder.append(row);
  });
}

function showFamilies() {
  const rows = [];

  PURPOSES.forEach((purpose) => {
    FAMILIES.forEach((family) => {
      const current = totalsFor(campaignsIn(period().current, { ...filters(), purpose, family }));
      const previous = totalsFor(campaignsIn(period().previous, { ...filters(), purpose, family }));
      if (!current.sent && !previous.sent) return;
      rows.push({
        label: family,
        group: purpose,
        value: current.sent,
        note: current.delivered ? `${formatPercent(current.clickRate)} clicked` : 'No sends yet'
      });
    });
  });

  rows.sort((a, b) => b.value - a.value);
  const used = PURPOSES.filter((purpose) => rows.some((row) => row.group === purpose));
  document.getElementById('family-chart').replaceChildren(
    rows.length ? columnChart(rows, { groups: used }) : create('p', 'empty', 'No mail in this selection.')
  );
}

// A reading counts towards the window it sits closest to, so an empty window is visible before it is chosen
const nearestWindow = (age) => CHECKPOINT_WINDOWS.reduce((best, hours) => (Math.abs(hours - age) < Math.abs(best - age) ? hours : best));
const readingsAt = (hours) => CHECKPOINTS.filter((point) => nearestWindow(point.age) === hours);

function showCheckpoints() {
  buildSegmented(document.getElementById('window-picker'), CHECKPOINT_WINDOWS.map((hours) => [String(hours), `${hours} hours · ${readingsAt(hours).length}`]), String(state.window), (hours) => {
    state.window = Number(hours);
    showCheckpoints();
  });

  const table = document.getElementById('checkpoint-table');
  table.replaceChildren(headRow(['Campaign', 'Sent', 'Measured', 'Actual age', 'Clickers of delivered']));
  const body = create('tbody');
  const rows = readingsAt(state.window);

  if (!rows.length) {
    const withReadings = CHECKPOINT_WINDOWS.filter((hours) => readingsAt(hours).length);
    const row = create('tr');
    const cell = create('td', 'is-empty', `No readings were taken ${state.window} hours after sending in this period.${withReadings.length ? ` ${withReadings.join(' and ')} hours has readings.` : ''}`);
    cell.colSpan = 5;
    row.append(cell);
    body.append(row);
  }

  rows.forEach((point) => body.append(tableRow([
    point.campaign,
    point.sentAt,
    point.measuredAt,
    `${point.age} hours`,
    `${formatNumber(point.clickers)} of ${formatNumber(point.delivered)}`
  ])));
  table.append(body);
  labelCells(table);
}

function showAttention() {
  buildSegmented(document.getElementById('attention-filter'), ATTENTION_FILTERS.map(([key, label]) =>
    [key, `${label} ${key === 'all' ? ATTENTION.length : ATTENTION.filter((item) => item.status === key).length}`]), state.attention, (value) => {
    state.attention = value;
    showAttention();
  });

  const tones = { Confirmed: 'good', Waiting: 'info', Blocked: 'waiting' };
  const holder = document.getElementById('attention-list');
  holder.replaceChildren();
  const shown = ATTENTION.filter((item) => state.attention === 'all' || item.status === state.attention);

  if (!shown.length) {
    holder.append(create('li', 'empty', 'Nothing with this status right now.'));
    return;
  }

  shown.forEach((item) => {
    const entry = create('li', 'finding');
    const top = create('div', 'decision-top');
    top.append(create('h3', '', item.title), statusChip({ tone: tones[item.status], text: item.status }));
    entry.append(top, create('p', 'panel-note', item.date), create('p', '', item.detail), create('p', 'decision-action', item.next));
    holder.append(entry);
  });
}

function render() {
  const span = period();
  document.getElementById('period-note').textContent =
    `${span.current.label} compared with ${span.previous.label}. ${span.note}.`;
  document.getElementById('share-note').textContent =
    `Each college's part of the mail that went out from ${span.current.label}.`;

  buildSegmented(document.getElementById('view-picker'), VIEWS, state.view, (view) => {
    state.view = view;
    Params.set({ view: view === 'comparison' ? '' : view });
    render();
  });

  const comparison = state.view === 'comparison';
  document.getElementById('week-filters').hidden = !comparison;
  document.getElementById('filters-off').hidden = comparison;
  document.getElementById('view-comparison').hidden = state.view !== 'comparison';
  document.getElementById('view-sameage').hidden = state.view !== 'sameage';
  document.getElementById('view-attention').hidden = state.view !== 'attention';

  if (state.view === 'comparison') {
    showTiles();
    showColleges();
    showOutcomes();
    showFamilies();
  } else if (state.view === 'sameage') {
    showCheckpoints();
  } else {
    showAttention();
  }
}

const throughSelect = document.getElementById('through-filter');
throughSelect.replaceChildren(...[...COMPLETED_DAYS].reverse().map((date) =>
  new Option(`Through ${readable(date)}`, date)));
throughSelect.value = state.through;
throughSelect.addEventListener('change', (event) => {
  state.through = event.target.value;
  Params.set({ through: state.through === PERIOD.current.to ? '' : state.through });
  render();
});

fillSelect('college-filter', 'All colleges', COLLEGES, state.college, (value) => {
  state.college = value;
  Params.set({ college: value });
  render();
});
fillSelect('purpose-filter', 'All purposes', PURPOSES, state.purpose, (value) => {
  state.purpose = value;
  Params.set({ purpose: value });
  render();
});
fillSelect('family-filter', 'All families', FAMILIES, state.family, (value) => {
  state.family = value;
  Params.set({ family: value });
  render();
});

render();
