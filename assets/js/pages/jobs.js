setUpShell();

const state = {
  phase: Params.get('phase', 'All'),
  stage: Params.get('stage', 'All'),
  owner: Params.get('owner', 'All'),
  search: Params.get('search', '')
};

const STAGE_TONES = {
  'In preparation': 'waiting',
  'Audience prepared': 'info',
  'Ready for AC build': 'good',
  'Waiting on AC': 'info',
  'Reported sent / live': 'good',
  'Paused / blocked': 'changed'
};

function fillSelect(id, label, options, value, onChange) {
  const select = document.getElementById(id);
  select.replaceChildren(new Option(label, 'All'), ...options.map((option) => new Option(option, option)));
  select.value = value;
  select.addEventListener('change', (event) => onChange(event.target.value));
}

function shown() {
  const search = state.search.trim().toLowerCase();
  return JOBS.filter((job) =>
    (state.phase === 'All' || job.phase === state.phase)
    && (state.stage === 'All' || job.stage === state.stage)
    && (state.owner === 'All' || job.owner === state.owner)
    && (!search || `${job.code} ${job.title} ${job.owner}`.toLowerCase().includes(search)));
}

// Naming the filter, and one button back to the whole list
function activeFilters() {
  return [
    state.phase !== 'All' ? `Phase ${state.phase}` : null,
    state.stage !== 'All' ? state.stage : null,
    state.owner !== 'All' ? state.owner : null,
    state.search.trim() ? `“${state.search.trim()}”` : null
  ].filter(Boolean);
}

function clearFilters() {
  state.phase = 'All';
  state.stage = 'All';
  state.owner = 'All';
  state.search = '';
  Params.set({ phase: '', stage: '', owner: '', search: '' });
  ['phase-filter', 'stage-filter', 'owner-filter'].forEach((id) => { document.getElementById(id).value = 'All'; });
  document.getElementById('job-search').value = '';
  render();
  document.getElementById('phase-filter').focus();
}

function jobRow(job) {
  const row = create('tr');

  const first = create('th', 'cell-name');
  first.scope = 'row';
  first.append(create('b', '', job.title), create('small', '', `${job.code} · tracker row ${job.row}`));

  const stage = create('td', 'cell-status');
  stage.append(statusChip({ tone: STAGE_TONES[job.stage] || 'info', text: job.stage }));

  const owner = create('td');
  owner.append(create('b', '', job.owner), create('small', '', COLLEGE_NAMES[job.college]));

  const audience = create('td', 'cell-best');
  audience.append(create('b', '', formatNumber(job.audience)), create('small', '', 'on the list'));

  const next = create('td', 'cell-cash', job.nextCheck ? job.nextCheck.split('-').reverse().slice(0, 2).join(' ') : 'Not set');

  const note = create('tr', 'job-note');
  const noteCell = create('td');
  noteCell.colSpan = 6;
  noteCell.append(create('p', 'panel-note', job.note));
  note.append(noteCell);

  row.append(first, create('td', '', `Phase ${job.phase}`), stage, owner, audience, next);
  return [row, note];
}

function render() {
  document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
  const rows = shown();
  const filters = activeFilters();
  const audience = formatNumber(rows.reduce((sum, job) => sum + job.audience, 0));
  document.getElementById('jobs-note').textContent = filters.length
    ? `${formatNumber(rows.length)} of ${formatNumber(JOBS.length)} jobs, filtered by ${filters.join(' and ')} · ${audience} on the lists`
    : `All ${formatNumber(JOBS.length)} jobs · ${audience} on the lists`;
  document.getElementById('jobs-clear').hidden = !filters.length;

  const table = document.getElementById('jobs-table');
  table.replaceChildren();

  const head = create('thead');
  const headRow = create('tr');
  ['Job', 'Phase', 'Stage', 'Owner', 'Audience', 'Next check'].forEach((label) => {
    const cell = create('th', '', label);
    cell.scope = 'col';
    headRow.append(cell);
  });
  head.append(headRow);
  table.append(head);

  const body = create('tbody');
  if (!rows.length) {
    const line = create('tr');
    const cell = create('td', 'is-empty', 'No jobs match this selection.');
    cell.colSpan = 6;
    line.append(cell);
    body.append(line);
  }
  rows.forEach((job) => body.append(...jobRow(job)));
  table.append(body);
  labelCells(table);
}

fillSelect('phase-filter', 'All phases', PHASES.map((phase) => phase), state.phase, (value) => {
  state.phase = value;
  Params.set({ phase: value });
  render();
});
fillSelect('stage-filter', 'All stages', STAGES, state.stage, (value) => {
  state.stage = value;
  Params.set({ stage: value });
  render();
});
fillSelect('owner-filter', 'All owners', [...new Set(JOBS.map((job) => job.owner))].sort(), state.owner, (value) => {
  state.owner = value;
  Params.set({ owner: value });
  render();
});

const jobsClear = document.getElementById('jobs-clear');
jobsClear.textContent = `Show all ${formatNumber(JOBS.length)}`;
jobsClear.addEventListener('click', clearFilters);

const jobSearch = document.getElementById('job-search');
jobSearch.value = state.search;
jobSearch.addEventListener('input', (event) => {
  state.search = event.target.value;
  Params.set({ search: state.search });
  render();
});

render();
