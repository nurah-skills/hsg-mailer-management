setUpShell();

const state = {
  phase: recall('jobs-phase') || 'All',
  stage: recall('jobs-stage') || 'All',
  owner: recall('jobs-owner') || 'All',
  search: ''
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
  document.getElementById('jobs-note').textContent =
    `${formatNumber(rows.length)} of ${formatNumber(JOBS.length)} jobs · ${formatNumber(rows.reduce((sum, job) => sum + job.audience, 0))} on the lists`;

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
}

fillSelect('phase-filter', 'All phases', PHASES.map((phase) => phase), state.phase, (value) => {
  state.phase = value;
  remember('jobs-phase', value);
  render();
});
fillSelect('stage-filter', 'All stages', STAGES, state.stage, (value) => {
  state.stage = value;
  remember('jobs-stage', value);
  render();
});
fillSelect('owner-filter', 'All owners', [...new Set(JOBS.map((job) => job.owner))].sort(), state.owner, (value) => {
  state.owner = value;
  remember('jobs-owner', value);
  render();
});

document.getElementById('job-search').addEventListener('input', (event) => {
  state.search = event.target.value;
  render();
});

render();
