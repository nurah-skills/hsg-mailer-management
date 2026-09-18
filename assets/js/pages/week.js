setUpShell();

const VIEWS = [['comparison', 'Comparison'], ['sameage', 'Same age'], ['attention', 'Needs attention']];
const ATTENTION_FILTERS = [['all', 'All'], ['Blocked', 'Blocked'], ['Waiting', 'Waiting'], ['Confirmed', 'Confirmed']];

const state = {
  view: VIEWS.some(([key]) => key === recall('week-view')) ? recall('week-view') : 'comparison',
  college: recall('week-college') || 'All',
  purpose: recall('week-purpose') || 'All',
  family: recall('week-family') || 'All',
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

function showTiles() {
  const current = totalsFor(campaignsIn(PERIOD.current, filters()));
  const previous = totalsFor(campaignsIn(PERIOD.previous, filters()));

  const tiles = [
    ['Emails sent', formatNumber(current.sent), `${formatNumber(previous.sent)} in the period before`, changeBetween(previous.sent, current.sent)],
    ['Campaigns', formatNumber(current.campaigns), `${formatNumber(previous.campaigns)} before · sends, not people`, changeBetween(previous.campaigns, current.campaigns)],
    ['Click rate', formatPercent(current.clickRate), `${formatPercent(previous.clickRate)} before · newer mail has had less time to collect clicks`, null],
    ['Unsubscribes', formatNumber(current.unsubscribes), `${formatPercent(current.unsubscribeRate)} of deliveries`, changeBetween(previous.unsubscribes, current.unsubscribes)]
  ];

  const holder = document.getElementById('week-tiles');
  holder.replaceChildren();
  tiles.forEach(([label, value, note, change]) => {
    const tile = create('div', 'tile');
    const top = create('div', 'tile-top');
    top.append(create('b', '', value));
    if (change) top.append(statusChip(change));
    tile.append(create('span', '', label), top, create('small', '', note));
    holder.append(tile);
  });
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
  const table = document.getElementById('college-table');
  table.replaceChildren(headRow(['College', 'Before', 'Now', 'Change', 'Registrations']));
  const body = create('tbody');

  COLLEGES.forEach((college) => {
    const current = totalsFor(campaignsIn(PERIOD.current, { ...filters(), college }));
    const previous = totalsFor(campaignsIn(PERIOD.previous, { ...filters(), college }));
    if (!current.sent && !previous.sent) return;
    const registrations = OUTCOMES.registrations.byCollege[college];
    body.append(tableRow([
      COLLEGE_NAMES[college],
      formatNumber(previous.sent),
      formatNumber(current.sent),
      statusChip(changeBetween(previous.sent, current.sent)),
      registrations ? `${formatNumber(registrations[1])} · ${formatNumber(registrations[0])} before` : 'Not mapped'
    ]));
  });
  table.append(body);
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
  const table = document.getElementById('family-table');
  table.replaceChildren(headRow(['Purpose and family', 'Sends before', 'Sends now', 'Clickers now', 'Click rate']));
  const body = create('tbody');

  PURPOSES.forEach((purpose) => {
    FAMILIES.forEach((family) => {
      const current = totalsFor(campaignsIn(PERIOD.current, { ...filters(), purpose, family }));
      const previous = totalsFor(campaignsIn(PERIOD.previous, { ...filters(), purpose, family }));
      if (!current.sent && !previous.sent) return;
      body.append(tableRow([
        `${purpose} · ${family}`,
        formatNumber(previous.sent),
        formatNumber(current.sent),
        formatNumber(current.clickers),
        current.delivered ? formatPercent(current.clickRate) : 'No sends yet'
      ]));
    });
  });

  if (!body.children.length) {
    const row = create('tr');
    const cell = create('td', 'is-empty', 'No mail in this selection.');
    cell.colSpan = 5;
    row.append(cell);
    body.append(row);
  }
  table.append(body);
}

function showCheckpoints() {
  buildSegmented(document.getElementById('window-picker'), CHECKPOINT_WINDOWS.map((hours) => [String(hours), `${hours} hours`]), String(state.window), (hours) => {
    state.window = Number(hours);
    showCheckpoints();
  });

  const table = document.getElementById('checkpoint-table');
  table.replaceChildren(headRow(['Campaign', 'Sent', 'Measured', 'Actual age', 'Clickers of delivered']));
  const body = create('tbody');
  const rows = state.window === 24 ? CHECKPOINTS : [];

  if (!rows.length) {
    const row = create('tr');
    const cell = create('td', 'is-empty', `No readings were taken ${state.window} hours after sending in this period.`);
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
  document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
  buildSegmented(document.getElementById('view-picker'), VIEWS, state.view, (view) => {
    state.view = view;
    remember('week-view', view);
    render();
  });

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

fillSelect('college-filter', 'All colleges', COLLEGES, state.college, (value) => {
  state.college = value;
  remember('week-college', value);
  render();
});
fillSelect('purpose-filter', 'All purposes', PURPOSES, state.purpose, (value) => {
  state.purpose = value;
  remember('week-purpose', value);
  render();
});
fillSelect('family-filter', 'All families', FAMILIES, state.family, (value) => {
  state.family = value;
  remember('week-family', value);
  render();
});

render();
