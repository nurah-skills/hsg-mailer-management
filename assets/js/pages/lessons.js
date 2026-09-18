setUpShell();

// A lesson sits at one of four statuses. Pick a status, then read what is in it.
const STATUSES = [
  ['Observed', 'info', 'A pattern someone noticed in the figures.'],
  ['Being tested', 'changed', 'A working explanation that still needs another period to confirm.'],
  ['Confirmed', 'good', 'Management has reviewed the evidence. It still does not prove cause and effect.'],
  ['Retired', 'waiting', 'Kept as a record, but no longer acted on.']
];

const VERDICTS = { good: ['well', 'Working well'], bad: ['poor', 'Working badly'] };

const state = { status: STATUSES.some(([name]) => name === recall('lessons-status')) ? recall('lessons-status') : null };

const lessonsAt = (status) => LESSONS.filter((lesson) => lesson.status === status);

function showStatusTiles() {
  const grid = document.getElementById('status-grid');
  grid.replaceChildren();

  STATUSES.forEach(([name, tone, meaning]) => {
    const lessons = lessonsAt(name);
    if (!lessons.length) return;

    const tile = create('button', 'status-tile');
    tile.type = 'button';
    tile.dataset.focus = `status:${name}`;

    const count = create('span', 'status-count');
    count.append(create('b', '', String(lessons.length)), create('span', '', lessons.length === 1 ? 'lesson' : 'lessons'));
    tile.append(count, statusChip({ tone, text: name }), create('small', '', meaning));
    tile.addEventListener('click', () => openStatus(name));
    grid.append(tile);
  });
}

function lessonCard(lesson) {
  const panel = create('section', 'panel span-6 lesson');
  const head = create('div', 'panel-head');
  const [tone, label] = VERDICTS[lesson.verdict];
  head.append(create('h3', '', lesson.title), statusChip({ tone, text: label }));
  panel.append(head, create('p', 'panel-note', lesson.scope));

  [['What the evidence shows', lesson.shows], ['What it does not prove', lesson.limits], ['What to do', lesson.action]].forEach(([label, text]) => {
    panel.append(create('h4', 'subheading', label), create('p', '', text));
  });

  panel.append(create('p', 'panel-note', `Updated ${lesson.updated}`));
  return panel;
}

function showStatus() {
  const [name, , meaning] = STATUSES.find(([status]) => status === state.status);
  const lessons = lessonsAt(name);
  document.getElementById('status-title').textContent = name;
  document.getElementById('status-note').textContent = `${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'} · ${meaning}`;
  document.getElementById('lesson-grid').replaceChildren(...lessons.map(lessonCard));
}

function openStatus(name) {
  state.status = name;
  remember('lessons-status', name);
  render();
  document.getElementById('status-title').focus();
}

function render() {
  document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
  document.getElementById('status-grid').hidden = Boolean(state.status);
  document.getElementById('lesson-view').hidden = !state.status;
  if (state.status) showStatus();
  else showStatusTiles();
}

const backButton = document.getElementById('back-to-statuses');
backButton.prepend(icon(ICONS.back, 16));
backButton.addEventListener('click', () => {
  const name = state.status;
  state.status = null;
  remember('lessons-status', '');
  render();
  const tile = document.querySelector(`[data-focus="status:${name}"]`);
  if (tile) tile.focus();
});

render();
