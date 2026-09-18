setUpShell();

const state = {
  status: null,
  category: Params.get('category', 'All'),
  search: Params.get('search', '')
};

function matches(problem) {
  const search = state.search.trim().toLowerCase();
  return (state.category === 'All' || problem.category === state.category)
    && (!search || `${problem.id} ${problem.title} ${problem.owner} ${problem.affects}`.toLowerCase().includes(search));
}

function showStatusTiles() {
  const grid = document.getElementById('problem-grid');
  grid.replaceChildren();

  PROBLEM_STATUSES.forEach(([name, tone, meaning]) => {
    const group = problemsAt(name);
    if (!group.length) return;

    const tile = create('button', 'status-tile');
    tile.type = 'button';
    tile.dataset.focus = `problem:${name}`;

    const count = create('span', 'status-count');
    count.append(create('b', '', String(group.length)), create('span', '', group.length === 1 ? 'finding' : 'findings'));
    tile.append(count, statusChip({ tone, text: name }), create('small', '', meaning));
    tile.addEventListener('click', () => {
      Trail.go([name]);
      readUrl(true);
    });
    grid.append(tile);
  });
}

function section(label, text) {
  const block = create('div', 'finding-part');
  block.append(create('h4', 'subheading', label), create('p', '', text));
  return block;
}

function problemCard(problem) {
  const panel = create('section', 'panel span-6 finding-card');
  const head = create('div', 'panel-head');
  head.append(create('h3', '', problem.title), statusChip({ tone: 'changed', text: problem.category }));
  panel.append(head, create('p', 'panel-note', `${problem.id} · found ${problem.found} · owner ${problem.owner} · due ${problem.due}`));

  panel.append(
    section('What it affects', problem.affects),
    section('Evidence', problem.evidence),
    section('Next action', problem.next),
    section('What changed', problem.changed),
    section('How it was checked', problem.verification),
    section('Lesson to carry forward', problem.lesson)
  );

  panel.append(create('p', 'panel-note', `${problem.history} ${problem.history === 1 ? 'change' : 'changes'} recorded`));
  return panel;
}

function showProblems() {
  const [name, , meaning] = PROBLEM_STATUSES.find(([status]) => status === state.status);
  const group = problemsAt(name);
  const shown = group.filter(matches);

  buildTrail(document.getElementById('problem-trail'), [{ label: 'Problems and fixes', path: [] }], (path) =>
    Trail.back(path, () => readUrl(true)));

  document.getElementById('problem-title').textContent = name;
  const filtered = state.category !== 'All' || state.search.trim();
  document.getElementById('problem-note').textContent = filtered
    ? `${shown.length} of ${group.length} · ${meaning}`
    : `${group.length} ${group.length === 1 ? 'finding' : 'findings'} · ${meaning}`;
  document.getElementById('problems-clear').hidden = !filtered;

  document.getElementById('problem-list').replaceChildren(
    ...(shown.length ? shown.map(problemCard) : [create('p', 'empty span-12', 'Nothing here matches this selection.')])
  );
}

function render() {
  document.getElementById('problem-grid').hidden = Boolean(state.status);
  document.getElementById('problem-view').hidden = !state.status;
  if (state.status) showProblems();
  else showStatusTiles();
}

// The address bar decides what is on screen, whichever way you got here
function readUrl(moveFocus) {
  const was = state.status;
  const [name] = Trail.path();
  state.status = PROBLEM_STATUSES.some(([status]) => status === name) ? name : null;
  render();
  if (!moveFocus || state.status === was) return;
  if (state.status) document.getElementById('problem-title').focus();
  else {
    const tile = document.querySelector(`[data-focus="problem:${was}"]`);
    if (tile) tile.focus();
  }
}

const categorySelect = document.getElementById('category-filter');
categorySelect.replaceChildren(new Option('All categories', 'All'), ...PROBLEM_CATEGORIES.map((name) => new Option(name, name)));
categorySelect.value = state.category;
categorySelect.addEventListener('change', (event) => {
  state.category = event.target.value;
  Params.set({ category: state.category });
  render();
});

const searchBox = document.getElementById('problem-search');
searchBox.value = state.search;
searchBox.addEventListener('input', (event) => {
  state.search = event.target.value;
  Params.set({ search: state.search });
  render();
});

document.getElementById('problems-clear').addEventListener('click', () => {
  state.category = 'All';
  state.search = '';
  Params.set({ category: '', search: '' });
  categorySelect.value = 'All';
  searchBox.value = '';
  render();
  categorySelect.focus();
});

Trail.watch(() => readUrl(true));
readUrl(false);
