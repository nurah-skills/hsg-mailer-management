setUpShell();

const SORTS = {
  date: (campaign) => campaign.date,
  sent: (campaign) => campaign.sent,
  delivered: (campaign) => campaign.delivered,
  open: (campaign) => (campaign.delivered ? campaign.openers / campaign.delivered : 0),
  click: (campaign) => (campaign.delivered ? campaign.clickers / campaign.delivered : 0),
  bounce: (campaign) => (campaign.sent ? campaign.hardBounces / campaign.sent : 0)
};

const SORT_KEYS = Object.keys(SORTS);

const state = {
  college: Params.get('college', 'All'),
  purpose: Params.get('purpose', 'All'),
  family: Params.get('family', 'All'),
  search: Params.get('search', ''),
  sortKey: SORT_KEYS.includes(Params.get('sort', '')) ? Params.get('sort', '') : 'date',
  sortDirection: -1
};

// The board prompts a look above these; neither proves a fault
const BOUNCE_PROMPT = 0.03;
const CLICK_PROMPT = 0.2;

function fillSelect(id, label, options, value, onChange) {
  const select = document.getElementById(id);
  select.replaceChildren(new Option(label, 'All'), ...options.map((option) => new Option(option, option)));
  select.value = value;
  select.addEventListener('change', (event) => onChange(event.target.value));
}

function shown() {
  const search = state.search.trim().toLowerCase();
  return CAMPAIGNS
    .filter((campaign) =>
      (state.college === 'All' || campaign.college === state.college)
      && (state.purpose === 'All' || campaign.purpose === state.purpose)
      && (state.family === 'All' || campaign.family === state.family)
      && (!search || campaign.name.toLowerCase().includes(search)))
    .sort((a, b) => {
      const first = SORTS[state.sortKey](a);
      const second = SORTS[state.sortKey](b);
      const order = typeof first === 'string' ? first.localeCompare(second) : first - second;
      return order * state.sortDirection || a.name.localeCompare(b.name);
    });
}

function showTiles(rows) {
  const totals = totalsFor(rows);
  const tiles = [
    ['Sent', formatNumber(totals.sent), `${formatNumber(totals.campaigns)} campaigns in this selection`],
    ['Delivered', formatNumber(totals.delivered), 'Sends minus hard and soft bounces'],
    ['Click rate', formatPercent(totals.clickRate), 'People who clicked, of deliveries'],
    ['Hard bounce rate', formatPercent(totals.bounceRate), `${formatNumber(totals.hardBounces)} addresses that do not exist`]
  ];
  const marks = [
    [ICONS.mail, ''],
    [ICONS.check, 'is-good'],
    [ICONS.click, 'is-good'],
    [ICONS.alert, 'is-warn']
  ];
  document.getElementById('campaign-tiles').replaceChildren(
    ...tiles.map(([label, value, note], index) => statTile({ label, value, note, icon: marks[index][0], tone: marks[index][1] }))
  );
}

// Naming the filter, and one button back to the whole list
function activeFilters() {
  return [
    state.college !== 'All' ? COLLEGE_NAMES[state.college] || state.college : null,
    state.purpose !== 'All' ? state.purpose : null,
    state.family !== 'All' ? state.family : null,
    state.search.trim() ? `“${state.search.trim()}”` : null
  ].filter(Boolean);
}

function clearFilters() {
  state.college = 'All';
  state.purpose = 'All';
  state.family = 'All';
  state.search = '';
  Params.set({ college: '', purpose: '', family: '', search: '' });
  ['campaign-college', 'campaign-purpose', 'campaign-family'].forEach((id) => { document.getElementById(id).value = 'All'; });
  document.getElementById('campaign-search').value = '';
  render();
  document.getElementById('campaign-college').focus();
}

function sortHeader(key, label, className = '') {
  const cell = create('th', className);
  cell.scope = 'col';
  const button = create('button', '', label);
  button.type = 'button';
  button.dataset.focus = `sort:${key}`;
  if (state.sortKey === key) {
    cell.setAttribute('aria-sort', state.sortDirection > 0 ? 'ascending' : 'descending');
    button.append(icon(state.sortDirection > 0 ? ICONS.up : ICONS.down, 14));
  }
  button.addEventListener('click', () => {
    if (state.sortKey === key) state.sortDirection *= -1;
    else {
      state.sortKey = key;
      state.sortDirection = -1;
    }
    Params.set({ sort: state.sortKey === 'date' ? '' : state.sortKey });
    keepFocus(render);
  });
  cell.append(button);
  return cell;
}

const SORT_LABELS = [['date', 'Newest first'], ['sent', 'Most sent'], ['delivered', 'Most delivered'], ['open', 'Highest opened'], ['click', 'Highest clicked'], ['bounce', 'Highest hard bounces']];

function fillSortPicker() {
  const select = document.getElementById('sort-select');
  select.replaceChildren(...SORT_LABELS.map(([key, label]) => new Option(label, key)));
  select.value = state.sortKey;
  select.addEventListener('change', (event) => {
    state.sortKey = event.target.value;
    state.sortDirection = -1;
    Params.set({ sort: state.sortKey === 'date' ? '' : state.sortKey });
    render();
  });
}

const picker = rowPicker(() => showPicked());

function showPicked() {
  const button = document.getElementById('campaigns-export');
  if (!button) return;
  const label = button.querySelector('span');
  label.textContent = picker.size
    ? `Export the ${formatNumber(picker.size)} you picked`
    : 'Export these rows';
}

function campaignRow(campaign) {
  const row = create('tr');
  const bounceRate = campaign.sent ? campaign.hardBounces / campaign.sent : 0;
  const clickRate = campaign.delivered ? campaign.clickers / campaign.delivered : 0;

  const first = create('th', 'cell-name');
  first.scope = 'row';
  first.append(create('b', '', campaign.name), create('small', '', `${campaign.id} · ${campaign.purpose} · ${campaign.family}`));

  const bounce = create('td', 'cell-cash');
  bounce.append(create('b', '', formatPercent(bounceRate)));
  if (bounceRate > BOUNCE_PROMPT) bounce.append(statusChip({ tone: 'changed', text: 'Worth a look' }));

  const clicked = create('td', 'cell-best');
  clicked.append(create('b', '', formatPercent(clickRate)));
  if (clickRate > CLICK_PROMPT) clicked.append(statusChip({ tone: 'info', text: 'Worth a look' }));

  row.append(
    picker.cell(campaign.id, campaign.name),
    first,
    create('td', '', `${campaign.date.slice(8)} Sept · ${campaign.college}`),
    create('td', 'cell-best', formatNumber(campaign.sent)),
    create('td', 'cell-best', formatNumber(campaign.delivered)),
    create('td', 'cell-best', formatPercent(campaign.delivered ? campaign.openers / campaign.delivered : 0)),
    clicked,
    bounce
  );
  return row;
}

function render() {
  const rows = shown();
  showTiles(rows);
  const filters = activeFilters();
  document.getElementById('campaigns-note').textContent = filters.length
    ? `${formatNumber(rows.length)} of ${formatNumber(CAMPAIGNS.length)} campaigns, filtered by ${filters.join(' and ')}`
    : `All ${formatNumber(CAMPAIGNS.length)} campaigns, sent between 7 and 16 September`;
  document.getElementById('campaigns-clear').hidden = !filters.length;

  document.getElementById('sort-select').value = state.sortKey;

  const table = document.getElementById('campaign-table');
  table.replaceChildren();

  picker.keepOnly(rows.map((campaign) => campaign.id));

  const head = create('thead');
  const headRow = create('tr');
  headRow.append(
    picker.headCell(),
    create('th', 'cell-name', 'Campaign'),
    sortHeader('date', 'Date'),
    sortHeader('sent', 'Sent', 'cell-best'),
    sortHeader('delivered', 'Delivered', 'cell-best'),
    sortHeader('open', 'Opened', 'cell-best'),
    sortHeader('click', 'Clicked', 'cell-best'),
    sortHeader('bounce', 'Hard bounces', 'cell-cash')
  );
  headRow.children[1].scope = 'col';
  head.append(headRow);
  table.append(head);

  const body = create('tbody');
  if (!rows.length) {
    const line = create('tr');
    const cell = create('td', 'is-empty', 'No campaigns match this selection.');
    cell.colSpan = 8;
    line.append(cell);
    body.append(line);
  }
  rows.forEach((campaign) => body.append(campaignRow(campaign)));
  table.append(body);
  labelCells(table);
  showPicked();
}

const campaignsExport = exportButton('Export these rows', () => {
  const rows = picker.size ? shown().filter((campaign) => picker.has(campaign.id)) : shown();
  downloadRows(
    'campaign-results',
    ['Campaign', 'Reference', 'Date', 'College', 'Purpose', 'Family', 'Sent', 'Delivered', 'Openers', 'Clickers', 'Hard bounces', 'Unsubscribes'],
    rows.map((campaign) => [
      campaign.name, campaign.id, campaign.date, COLLEGE_NAMES[campaign.college] || campaign.college,
      campaign.purpose, campaign.family, campaign.sent, campaign.delivered,
      campaign.openers, campaign.clickers, campaign.hardBounces, campaign.unsubscribes
    ])
  );
});
campaignsExport.id = 'campaigns-export';
document.querySelector('[aria-labelledby="campaigns-title"] .panel-head').append(campaignsExport);

const campaignsClear = document.getElementById('campaigns-clear');
campaignsClear.textContent = `Show all ${formatNumber(CAMPAIGNS.length)}`;
campaignsClear.addEventListener('click', clearFilters);

fillSortPicker();

fillSelect('campaign-college', 'All colleges', COLLEGES, state.college, (value) => {
  state.college = value;
  Params.set({ college: value });
  render();
});
fillSelect('campaign-purpose', 'All purposes', PURPOSES, state.purpose, (value) => {
  state.purpose = value;
  Params.set({ purpose: value });
  render();
});
fillSelect('campaign-family', 'All families', FAMILIES, state.family, (value) => {
  state.family = value;
  Params.set({ family: value });
  render();
});

const campaignSearch = document.getElementById('campaign-search');
campaignSearch.value = state.search;
campaignSearch.addEventListener('input', (event) => {
  state.search = event.target.value;
  Params.set({ search: state.search });
  render();
});

render();
