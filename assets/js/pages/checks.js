setUpShell();

const state = { type: CHECK_TYPES.some(([key]) => key === recall('checks-type')) ? recall('checks-type') : null };

const groupFor = (key) => CHECKS.filter(({ type }) => type[0] === key);

function showTypes() {
  const grid = document.getElementById('check-grid');
  grid.replaceChildren();

  CHECK_TYPES.forEach((type) => {
    const group = groupFor(type[0]);
    if (!group.length) return;
    const tile = create('button', 'category-tile');
    tile.type = 'button';
    tile.dataset.focus = `check:${type[0]}`;

    const art = create('span', 'card-art kind-check');
    art.append(create('b', '', String(group.length)), create('span', '', group.length === 1 ? 'row to settle' : 'rows to settle'));

    const body = create('span', 'category-body');
    const phases = [...new Set(group.map(({ job }) => `Phase ${job.phase}`))].sort();
    body.append(create('b', '', type[1]), create('small', '', phases.slice(0, 4).join(', ') + (phases.length > 4 ? ` and ${phases.length - 4} more` : '')));

    tile.append(art, body);
    tile.addEventListener('click', () => openType(type[0]));
    grid.append(tile);
  });
}

function openType(key) {
  state.type = key;
  remember('checks-type', key);
  render();
  document.getElementById('check-title').focus();
}

function showType() {
  const type = CHECK_TYPES.find(([key]) => key === state.type);
  const group = groupFor(state.type);
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
  document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
  document.getElementById('check-list').hidden = Boolean(state.type);
  document.getElementById('check-view').hidden = !state.type;
  if (state.type) showType();
  else showTypes();
}

const backButton = document.getElementById('back-to-checks');
backButton.prepend(icon(ICONS.back, 16));

backButton.addEventListener('click', () => {
  const key = state.type;
  state.type = null;
  remember('checks-type', '');
  render();
  const tile = document.querySelector(`[data-focus="check:${key}"]`);
  if (tile) tile.focus();
});

render();
