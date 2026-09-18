setUpShell();

const GAPS = [
  ['Registrations and cash are not linked to campaigns', 'Nothing on this board says a campaign caused a sale. The sales figures sit alongside the mail figures, never inside them.'],
  ['Survey responses are not linked to colleges', 'Responses are counted in total only, so they cannot be split by college yet.'],
  ['Readings are not taken on a schedule', 'A campaign only gets a same-age reading when a refresh happens to run at the right time. Missed readings stay missing.'],
  ['Two-week outcomes are empty', 'The cash and enrolment columns after each send have no entries yet, so nothing can be worked out from them.']
];

function showCoverage() {
  const tiles = [
    ['Trackers read', formatNumber(SOURCES.length - 1), 'Original plus each phase, listed under the index'],
    ['Tracker rows', formatNumber(SOURCES.reduce((sum, source) => sum + source.rows, 0)), 'Named rows across all trackers'],
    ['Campaign records', formatNumber(COVERAGE.mailRecords), `Retrieved from ${COVERAGE.since}`],
    ['Two-week outcomes filled', formatNumber(COVERAGE.outcomesFilled), 'Cash and enrolment cells with an entry']
  ];
  const holder = document.getElementById('coverage-tiles');
  holder.replaceChildren();
  tiles.forEach(([label, value, note]) => {
    const tile = create('div', 'tile');
    tile.append(create('span', '', label), create('b', '', value), create('small', '', note));
    holder.append(tile);
  });
}

function showSources() {
  const holder = document.getElementById('source-list');
  holder.replaceChildren();
  SOURCES.forEach((source) => {
    const item = create('li');
    const top = create('div', 'decision-top');
    top.append(create('h3', '', source.name), create('span', 'tag', `${formatNumber(source.rows)} rows`));
    item.append(top, create('p', '', source.scope), create('p', 'panel-note', `${source.range} · read ${source.read}`));
    holder.append(item);
  });
}

function showConnections() {
  const holder = document.getElementById('connection-list');
  holder.replaceChildren();
  CONNECTIONS.forEach((connection) => {
    const item = create('li');
    const top = create('div', 'decision-top');
    top.append(create('h3', '', connection.name), statusChip({ tone: connection.tone, text: connection.status }));
    item.append(top, create('p', '', connection.detail));
    holder.append(item);
  });
}

function showReading() {
  const holder = document.getElementById('reading-list');
  holder.replaceChildren();
  READING_NOTES.forEach(([title, detail]) => {
    const item = create('li');
    item.append(create('b', '', title), create('p', '', detail));
    holder.append(item);
  });
}

function showGaps() {
  const holder = document.getElementById('gap-list');
  holder.replaceChildren();
  GAPS.forEach(([title, detail]) => {
    const item = create('li');
    item.append(create('b', '', title), create('p', '', detail));
    holder.append(item);
  });
}

document.getElementById('mail-read').textContent = SNAPSHOT.mailRead;
showCoverage();
showConnections();
showSources();
showReading();
showGaps();
