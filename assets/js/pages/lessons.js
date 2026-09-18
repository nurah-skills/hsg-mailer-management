setUpShell();

const VERDICTS = [['all', 'All'], ['good', 'Working well'], ['bad', 'Working badly']];
const STATUS_TONES = { Observed: 'info', 'Being tested': 'changed', Confirmed: 'good', Retired: 'waiting' };

const state = {
  verdict: VERDICTS.some(([key]) => key === recall('lessons-verdict')) ? recall('lessons-verdict') : 'all'
};

// Every lesson is on the page. The status is on each card, and retired ones sit at the end.
function shown() {
  return LESSONS
    .filter((lesson) => state.verdict === 'all' || lesson.verdict === state.verdict)
    .sort((a, b) => (a.status === 'Retired' ? 1 : 0) - (b.status === 'Retired' ? 1 : 0));
}

function lessonCard(lesson) {
  const panel = create('section', 'panel span-6 lesson');
  const head = create('div', 'panel-head');
  head.append(create('h2', '', lesson.title), statusChip({ tone: STATUS_TONES[lesson.status], text: lesson.status }));
  panel.append(head, create('p', 'panel-note', lesson.scope));

  [['What the evidence shows', lesson.shows], ['What it does not prove', lesson.limits], ['What to do', lesson.action]].forEach(([label, text]) => {
    panel.append(create('h3', 'subheading', label), create('p', '', text));
  });

  panel.append(create('p', 'panel-note', `Updated ${lesson.updated}`));
  return panel;
}

function render() {
  document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
  buildSegmented(document.getElementById('verdict-picker'), VERDICTS.map(([key, label]) =>
    [key, `${label} ${key === 'all' ? LESSONS.length : LESSONS.filter((lesson) => lesson.verdict === key).length}`]), state.verdict, (verdict) => {
    state.verdict = verdict;
    remember('lessons-verdict', verdict);
    render();
  });

  const grid = document.getElementById('lesson-grid');
  grid.replaceChildren();
  const lessons = shown();
  if (!lessons.length) {
    grid.append(create('p', 'empty span-12', 'No lessons with this selection yet.'));
    return;
  }
  lessons.forEach((lesson) => grid.append(lessonCard(lesson)));
}

render();
