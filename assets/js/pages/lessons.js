setUpShell();

// Two steps in: pick the status a lesson sits at, then whether it says the work is going well or badly.
const STATUSES = [
  ['Observed', 'info', 'A pattern someone noticed in the figures.'],
  ['Being tested', 'changed', 'A working explanation that still needs another period to confirm.'],
  ['Confirmed', 'good', 'Management has reviewed the evidence. It still does not prove cause and effect.'],
  ['Retired', 'waiting', 'Kept as a record, but no longer acted on.']
];

const VERDICTS = [
  ['good', 'well', 'Working well', 'Something to keep doing, and the evidence for it.'],
  ['bad', 'poor', 'Working badly', 'Something to change, and what the evidence does not prove.']
];

const state = { status: null, verdict: null };

const lessonsAt = (status, verdict) =>
  LESSONS.filter((lesson) => lesson.status === status && (!verdict || lesson.verdict === verdict));

const countText = (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'}`;

function tile(focusKey, count, chip, meaning, path) {
  const button = create('button', 'status-tile');
  button.type = 'button';
  button.dataset.focus = focusKey;

  const holder = create('span', 'status-count');
  holder.append(create('b', '', String(count)), create('span', '', count === 1 ? 'lesson' : 'lessons'));
  button.append(holder, chip, create('small', '', meaning));
  button.addEventListener('click', () => {
    Trail.go(path);
    readUrl(true);
  });
  return button;
}

const stepBack = (path) => Trail.back(path, () => readUrl(true));

function showStatusTiles() {
  const grid = document.getElementById('status-grid');
  grid.replaceChildren();
  STATUSES.forEach(([name, tone, meaning]) => {
    const lessons = lessonsAt(name);
    if (!lessons.length) return;
    grid.append(tile(`status:${name}`, lessons.length, statusChip({ tone, text: name }), meaning, [name]));
  });
}

function showVerdictTiles() {
  const [name, , meaning] = STATUSES.find(([status]) => status === state.status);
  const lessons = lessonsAt(name);
  buildTrail(document.getElementById('verdict-trail'), [{ label: 'Lessons learnt', path: [] }], stepBack);
  document.getElementById('status-title').textContent = name;
  document.getElementById('status-note').textContent = `${countText(lessons.length)} · ${meaning}`;

  const grid = document.getElementById('verdict-grid');
  grid.replaceChildren();
  VERDICTS.forEach(([key, tone, label, note]) => {
    const group = lessonsAt(name, key);
    if (!group.length) return;
    grid.append(tile(`verdict:${key}`, group.length, statusChip({ tone, text: label }), note, [name, key]));
  });
}

function lessonCard(lesson) {
  const panel = create('section', 'panel span-6 lesson');
  panel.append(create('h3', '', lesson.title), create('p', 'panel-note', lesson.scope));

  [['What the evidence shows', lesson.shows], ['What it does not prove', lesson.limits], ['What to do', lesson.action]].forEach(([label, text]) => {
    panel.append(create('h4', 'subheading', label), create('p', '', text));
  });

  panel.append(create('p', 'panel-note', `Updated ${lesson.updated}`));
  return panel;
}

function showLessons() {
  const [, , label] = VERDICTS.find(([key]) => key === state.verdict);
  const lessons = lessonsAt(state.status, state.verdict);
  buildTrail(document.getElementById('lesson-trail'), [
    { label: 'Lessons learnt', path: [] },
    { label: state.status, path: [state.status] }
  ], stepBack);
  document.getElementById('lesson-title').textContent = label;
  document.getElementById('lesson-note').textContent = countText(lessons.length);
  document.getElementById('lesson-grid').replaceChildren(...lessons.map(lessonCard));
}

function render() {
  document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
  const atLessons = Boolean(state.status && state.verdict);
  document.getElementById('status-grid').hidden = Boolean(state.status);
  document.getElementById('verdict-view').hidden = !state.status || atLessons;
  document.getElementById('lesson-view').hidden = !atLessons;

  if (atLessons) showLessons();
  else if (state.status) showVerdictTiles();
  else showStatusTiles();
}

// The address bar decides what is on screen, whichever way you got here
function readUrl(moveFocus) {
  const was = { ...state };
  const [status, verdict] = Trail.path();
  state.status = STATUSES.some(([name]) => name === status) ? status : null;
  state.verdict = state.status && VERDICTS.some(([key]) => key === verdict) ? verdict : null;
  render();
  if (!moveFocus) return;

  if (state.verdict && state.verdict !== was.verdict) document.getElementById('lesson-title').focus();
  else if (state.status && !state.verdict && was.verdict) {
    const tile = document.querySelector(`[data-focus="verdict:${was.verdict}"]`);
    if (tile) tile.focus();
  } else if (state.status && state.status !== was.status) document.getElementById('status-title').focus();
  else if (!state.status && was.status) {
    const tile = document.querySelector(`[data-focus="status:${was.status}"]`);
    if (tile) tile.focus();
  }
}

Trail.watch(() => readUrl(true));
readUrl(false);
