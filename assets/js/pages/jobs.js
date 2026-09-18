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
  const tile = document.querySelector('.status-tile');
  if (tile) tile.focus();
  else document.getElementById('phase-filter').focus();
}

const picker = rowPicker(() => showPicked());

function showPicked() {
  const button = document.getElementById('jobs-export');
  if (!button) return;
  const label = button.querySelector('span');
  label.textContent = picker.size
    ? `Export the ${formatNumber(picker.size)} you picked`
    : 'Export these rows';
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
  noteCell.colSpan = 7;
  noteCell.append(create('p', 'panel-note', job.note));
  note.append(noteCell);

  row.append(picker.cell(job.code, job.title), first, create('td', '', `Phase ${job.phase}`), stage, owner, audience, next);
  return [row, note];
}

const STAGE_MEANING = {
  'In preparation': 'The brief and the copy are still being put together.',
  'Audience prepared': 'The list is ready and waiting for the build.',
  'Ready for AC build': 'Everything is in place for the mail tool build.',
  'Waiting on AC': 'Handed over, waiting on the build to come back.',
  'Reported sent / live': 'The owner reports it went out. Still a reported state.',
  'Paused / blocked': 'Stopped until someone settles something.'
};

function showStageTiles() {
  const grid = document.getElementById('stage-grid');
  grid.replaceChildren();

  STAGES.forEach((stage) => {
    const jobs = JOBS.filter((job) => job.stage === stage);
    if (!jobs.length) return;

    const tile = create('button', 'status-tile');
    tile.type = 'button';
    tile.dataset.focus = `stage:${stage}`;

    const count = create('span', 'status-count');
    count.append(create('b', '', String(jobs.length)), create('span', '', jobs.length === 1 ? 'job' : 'jobs'));
    tile.append(count, statusChip({ tone: STAGE_TONES[stage] || 'info', text: stage }), create('small', '', STAGE_MEANING[stage] || ''));
    tile.addEventListener('click', () => {
      state.stage = stage;
      Params.set({ stage });
      document.getElementById('stage-filter').value = stage;
      render();
      document.getElementById('jobs-title').focus();
    });
    grid.append(tile);
  });
}

function render() {
  const rows = shown();
  const filters = activeFilters();

  // Nothing chosen yet: the stages are the way in, so nobody scrolls 44 jobs to find one
  document.getElementById('stage-grid').parentElement.hidden = Boolean(filters.length);
  document.getElementById('jobs-panel').hidden = !filters.length;
  if (!filters.length) {
    showStageTiles();
    document.getElementById('jobs-clear').hidden = true;
    return;
  }
  const audience = formatNumber(rows.reduce((sum, job) => sum + job.audience, 0));
  document.getElementById('jobs-note').textContent = filters.length
    ? `${formatNumber(rows.length)} of ${formatNumber(JOBS.length)} jobs, filtered by ${filters.join(' and ')} · ${audience} on the lists`
    : `All ${formatNumber(JOBS.length)} jobs · ${audience} on the lists`;
  document.getElementById('jobs-clear').hidden = !filters.length;

  const table = document.getElementById('jobs-table');
  table.replaceChildren();

  picker.keepOnly(rows.map((job) => job.code));

  const head = create('thead');
  const headRow = create('tr');
  headRow.append(picker.headCell());
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
    cell.colSpan = 7;
    line.append(cell);
    body.append(line);
  }
  rows.forEach((job) => body.append(...jobRow(job)));
  table.append(body);
  labelCells(table);
  showPicked();
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

const jobsExport = exportButton('Export these rows', () => {
  const rows = picker.size ? shown().filter((job) => picker.has(job.code)) : shown();
  downloadRows(
    'job-pipeline',
    ['Job', 'Code', 'Tracker row', 'Phase', 'Stage', 'Owner', 'College', 'Audience', 'Next check', 'Note'],
    rows.map((job) => [
      job.title, job.code, job.row, `Phase ${job.phase}`, job.stage, job.owner,
      COLLEGE_NAMES[job.college], job.audience, job.nextCheck || 'Not set', job.note
    ])
  );
});
jobsExport.id = 'jobs-export';
document.getElementById('jobs-panel').querySelector('.panel-head').append(jobsExport);

const jobsClear = document.getElementById('jobs-clear');
jobsClear.textContent = 'Back to the stages';
jobsClear.addEventListener('click', clearFilters);

const jobSearch = document.getElementById('job-search');
jobSearch.value = state.search;
jobSearch.addEventListener('input', (event) => {
  state.search = event.target.value;
  Params.set({ search: state.search });
  render();
});

render();
