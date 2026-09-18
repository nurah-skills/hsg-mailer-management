setUpShell();

const state = {
  type: null,
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

// The filters narrow every check, so the tiles and the list inside them always agree
function matching() {
  const search = state.search.trim().toLowerCase();
  return CHECKS.filter(({ job }) =>
    (state.college === 'All' || job.college === state.college)
    && (state.phase === 'All' || job.phase === state.phase)
    && (!search || `${job.code} ${job.title} ${job.owner}`.toLowerCase().includes(search)));
}

const groupFor = (key) => matching().filter(({ type }) => type[0] === key);

function activeFilters() {
  return [
    state.college !== 'All' ? COLLEGE_NAMES[state.college] || state.college : null,
    state.phase !== 'All' ? `Phase ${state.phase}` : null,
    state.search.trim() ? `“${state.search.trim()}”` : null
  ].filter(Boolean);
}

function showNote() {
  const rows = matching().length;
  const filters = activeFilters();
  document.getElementById('checks-note').textContent = filters.length
    ? `${formatNumber(rows)} of ${formatNumber(CHECKS.length)} checks, filtered by ${filters.join(' and ')}`
    : `All ${formatNumber(CHECKS.length)} checks · one row can raise more than one`;
  document.getElementById('checks-clear').hidden = !filters.length;
}

function clearFilters() {
  state.college = 'All';
  state.phase = 'All';
  state.search = '';
  Params.set({ college: '', phase: '', search: '' });
  ['check-college', 'check-phase'].forEach((id) => { document.getElementById(id).value = 'All'; });
  document.getElementById('check-search').value = '';
  render();
  document.getElementById('check-college').focus();
}

function showTypes() {
  const grid = document.getElementById('check-grid');
  grid.replaceChildren();

  let drawn = 0;
  CHECK_TYPES.forEach((type) => {
    const group = groupFor(type[0]);
    if (!group.length) return;
    drawn += 1;
    const tile = create('button', 'category-tile');
    tile.type = 'button';
    tile.dataset.focus = `check:${type[0]}`;

    const art = create('span', 'card-art kind-check');
    art.append(create('b', '', String(group.length)), create('span', '', group.length === 1 ? 'row to settle' : 'rows to settle'));

    const body = create('span', 'category-body');
    const phases = [...new Set(group.map(({ job }) => `Phase ${job.phase}`))].sort();
    body.append(create('b', '', type[1]), create('small', '', phases.slice(0, 4).join(', ') + (phases.length > 4 ? ` and ${phases.length - 4} more` : '')));

    tile.append(art, body);
    tile.addEventListener('click', () => {
      Trail.go([type[0]]);
      readUrl(true);
    });
    grid.append(tile);
  });

  if (!drawn) grid.append(create('p', 'empty', 'No check matches this selection.'));
}

function showType() {
  const type = CHECK_TYPES.find(([key]) => key === state.type);
  const group = groupFor(state.type);
  buildTrail(document.getElementById('checks-trail'), [{ label: 'Evidence checks', path: [] }], (path) => Trail.back(path, () => readUrl(true)));
  document.getElementById('check-title').textContent = type[1];
  document.getElementById('check-note').textContent = `${group.length} row${group.length === 1 ? '' : 's'}`;
  document.getElementById('check-detail').textContent = type[2];

  const table = document.getElementById('check-table');
  table.replaceChildren();
  const head = create('thead');
  const headRow = create('tr');
  ['Job', 'Phase', 'Stage', 'Owner', 'Tracker row'].forEach((label) => {
    const cell = create('th', '', label);
    cell.scope = 'col';
    headRow.append(cell);
  });
  head.append(headRow);

  const body = create('tbody');
  if (!group.length) {
    const line = create('tr');
    const cell = create('td', 'is-empty', 'No row of this kind matches the filters above.');
    cell.colSpan = 5;
    line.append(cell);
    body.append(line);
  }
  group.forEach(({ job }) => {
    const row = create('tr');
    const first = create('th', 'cell-name');
    first.scope = 'row';
    first.append(create('b', '', job.title), create('small', '', job.code));
    const stage = create('td', 'cell-status');
    stage.append(statusChip({ tone: 'changed', text: job.stage }));
    row.append(first, create('td', '', `Phase ${job.phase}`), stage, create('td', '', job.owner), create('td', 'cell-cash', `Row ${job.row}`));
    body.append(row);
  });
  table.append(head, body);
  labelCells(table);
}

function render() {
  showNote();
  document.getElementById('check-list').hidden = Boolean(state.type);
  document.getElementById('check-view').hidden = !state.type;
  if (state.type) showType();
  else showTypes();
}

// The address bar decides what is on screen, whichever way you got here
function readUrl(moveFocus) {
  const was = state.type;
  const [key] = Trail.path();
  state.type = CHECK_TYPES.some(([name]) => name === key) ? key : null;
  render();
  if (!moveFocus || state.type === was) return;
  if (state.type) document.getElementById('check-title').focus();
  else {
    const tile = document.querySelector(`[data-focus="check:${was}"]`);
    if (tile) tile.focus();
  }
}

fillSelect('check-college', 'All colleges', COLLEGES, state.college, (value) => {
  state.college = value;
  Params.set({ college: value });
  render();
});
fillSelect('check-phase', 'All phases', PHASES, state.phase, (value) => {
  state.phase = value;
  Params.set({ phase: value });
  render();
});

const checkSearch = document.getElementById('check-search');
checkSearch.value = state.search;
checkSearch.addEventListener('input', (event) => {
  state.search = event.target.value;
  Params.set({ search: state.search });
  render();
});

document.getElementById('checks-clear').addEventListener('click', clearFilters);

Trail.watch(() => readUrl(true));
readUrl(false);
