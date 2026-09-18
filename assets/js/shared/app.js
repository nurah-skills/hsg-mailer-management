// Shared by every signed-in page: the menu, the signed-in person and small formatting helpers.

function create(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const initials = (name) => name.split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();

// Page choices live in this tab only, so nothing ends up in the address bar
function remember(key, value) {
  try {
    sessionStorage.setItem(`hsg-${key}`, value);
  } catch {
    // The page still works, it just won't remember the choice.
  }
}

function recall(key) {
  try {
    return sessionStorage.getItem(`hsg-${key}`);
  } catch {
    return null;
  }
}

// Redrawing a list replaces its buttons, which would drop keyboard focus back to the top of the page.
// Buttons carry a data-focus key so focus can land on the matching one again.
function keepFocus(redraw, fallback) {
  const key = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.focus : null;
  redraw();
  if (!key) return;
  const match = [...document.querySelectorAll('[data-focus]')].find((node) => node.dataset.focus === key);
  const target = match || (fallback && document.querySelector(fallback));
  if (target) target.focus();
}

function buildSegmented(container, options, current, onChange) {
  container.replaceChildren();
  options.forEach(([value, label]) => {
    const button = create('button', '', label);
    button.type = 'button';
    button.dataset.focus = `${container.id}:${value}`;
    button.setAttribute('aria-pressed', String(value === current));
    button.addEventListener('click', () => keepFocus(() => onChange(value)));
    container.append(button);
  });
}

function icon(paths, size = 18) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  paths.forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  });
  return svg;
}

const ICONS = {
  check: ['M4 12.5l5 5L20 6.5'],
  back: ['M19 12H5', 'M11 18l-6-6 6-6'],
  refresh: ['M20 11a8 8 0 0 0-13.7-5.6L3 8', 'M4 13a8 8 0 0 0 13.7 5.6L21 16', 'M3 4v4h4', 'M21 20v-4h-4'],
  external: ['M14 4h6v6', 'M20 4l-8 8', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  up: ['M12 19V5', 'M6 11l6-6 6 6'],
  down: ['M12 5v14', 'M6 13l6 6 6-6'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  rows: ['M4 7h16', 'M4 12h16', 'M4 17h10'],
  alert: ['M12 8v5', 'M12 16.5v.5', 'M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'],
  mail: ['M3 6.5h18v11H3z', 'm4 7.5 8 5.5 8-5.5'],
  click: ['M9 4v3', 'M4 9h3', 'M5.6 5.6 7.7 7.7', 'm10 10 9 3.4-3.9 1.7L13.4 19z']
};

// One message area per page. An action like Undo keeps the message up a little longer.
let toastTimer;
function showToast(message, action) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.hidden = false;
  toast.replaceChildren(create('span', '', message));
  if (action) {
    const button = create('button', 'toast-action', action.label);
    button.type = 'button';
    button.addEventListener('click', () => {
      toast.hidden = true;
      action.onClick();
    });
    toast.append(button);
  }
  toastTimer = setTimeout(() => { toast.hidden = true; }, action ? 7000 : 4000);
}

// Phones get the most used pages along the bottom, within reach of a thumb
function buildTabBar(sidebar) {
  const nav = create('nav', 'tabbar');
  nav.setAttribute('aria-label', 'Quick menu');
  const current = location.pathname.split('/').pop() || 'overview.html';
  const pages = [['overview.html', 'Overview'], ['decisions.html', 'Decisions'], ['week.html', 'This week']];

  pages.forEach(([href, label]) => {
    const item = sidebar.querySelector(`.menu-item[href="${href}"]`);
    const link = create('a', 'tab');
    link.href = href;
    if (href === current) link.setAttribute('aria-current', 'page');
    link.append(item.querySelector('svg').cloneNode(true), create('span', '', label));
    nav.append(link);
    item.classList.add('in-tabbar');
  });

  const more = create('button', 'tab');
  more.type = 'button';
  more.setAttribute('aria-controls', 'sidebar');
  more.setAttribute('aria-expanded', 'false');
  if (!pages.some(([href]) => href === current)) {
    more.classList.add('is-current');
    more.setAttribute('aria-current', 'page');
  }
  more.append(icon(ICONS.menu, 20), create('span', '', 'More'));
  nav.append(more);

  document.getElementById('app').append(nav);
  return more;
}

// Phones hide the heading row, so every cell takes its heading with it
function labelCells(table) {
  const headings = [...table.querySelectorAll('thead th')].map((cell) => cell.textContent);
  table.querySelectorAll('tbody tr').forEach((row) => {
    [...row.children].forEach((cell, index) => {
      if (cell.colSpan > 1 || cell.tagName !== 'TD') return;
      if (headings[index]) cell.dataset.label = headings[index];
    });
  });
}

// Where you are inside a page lives in the address bar, so the back button works and a link can be sent to someone.
// Tiles you open go in the hash; filters go in the query, where they do not fill the history with every keystroke.
const Trail = {
  pushes: 0,

  path() {
    return location.hash.slice(1).split('/').filter(Boolean).map(decodeURIComponent);
  },

  href(path) {
    return path.length ? `#${path.map(encodeURIComponent).join('/')}` : location.pathname + location.search;
  },

  go(path) {
    history.pushState(null, '', Trail.href(path));
    Trail.pushes += 1;
  },

  // The link on the page and the browser's own back button should do the same thing
  back(parent, redraw) {
    if (Trail.pushes > 0) {
      Trail.pushes -= 1;
      history.back();
      return;
    }
    history.replaceState(null, '', Trail.href(parent));
    redraw();
  },

  watch(redraw) {
    window.addEventListener('popstate', () => {
      Trail.pushes = Math.max(0, Trail.pushes - 1);
      redraw();
    });
  }
};

const Params = {
  get(key, fallback) {
    return new URLSearchParams(location.search).get(key) || fallback;
  },

  set(values) {
    const params = new URLSearchParams(location.search);
    Object.entries(values).forEach(([key, value]) => {
      if (!value || value === 'All') params.delete(key);
      else params.set(key, value);
    });
    const query = params.toString();
    history.replaceState(null, '', `${location.pathname}${query ? '?' + query : ''}${location.hash}`);
  }
};

// The same way back on every page that opens into tiles: the page, then each step you took
function buildTrail(container, steps, onStep) {
  container.replaceChildren();
  steps.forEach((step, index) => {
    if (index) {
      const mark = create('span', 'trail-mark', '›');
      mark.setAttribute('aria-hidden', 'true');
      container.append(mark);
    }
    const button = create('button', 'trail-step', step.label);
    button.type = 'button';
    if (!index) button.prepend(icon(ICONS.back, 15));
    button.addEventListener('click', () => onStep(step.path));
    container.append(button);
  });
}

function statTile({ label, value, note, icon: paths, tone = '', change }) {
  const tile = create('div', 'tile');
  const badge = create('div', 'tile-badge');
  badge.append(create('span', '', label));
  if (paths) {
    const mark = create('span', ('tile-icon ' + tone).trim());
    mark.append(icon(paths, 18));
    badge.append(mark);
  }

  const foot = create('div', 'tile-foot');
  if (change) foot.append(statusChip(change));
  if (note) foot.append(create('small', '', note));

  tile.append(badge, create('b', '', value), foot);
  return tile;
}

function statusChip(pace) {
  const chip = create('span', `status status-${pace.tone}`);
  if (pace.direction) chip.append(icon(ICONS[pace.direction], 13), create('span', 'sr-only', pace.direction === 'up' ? 'up ' : 'down '));
  chip.append(create('span', '', pace.text));
  return chip;
}

// The other two boards sit beside this one, and the mail tool can be read again from here
const RELATED = [
  ['https://nurah-skills.github.io/every-sale-matters/', 'Sales scoreboard'],
  ['#', 'Lead tracker']
];

function buildHeaderTools() {
  const header = document.querySelector('.page-header');
  if (!header) return;
  const tools = create('div', 'header-tools');
  const refresh = create('button', 'button button-secondary button-inline');
  refresh.type = 'button';
  refresh.append(icon(ICONS.refresh, 16), document.createTextNode('Refresh the mail tool'));
  refresh.addEventListener('click', () => showToast(`Sample figures, so nothing refreshes. The mail tool was read at ${SNAPSHOT.mailRead} and that reading is fixed.`));
  const state = header.querySelector('.board-state');
  tools.append(refresh);
  if (state) tools.append(state);
  header.append(tools);
}

function buildRelatedLinks(sidebar) {
  const holder = create('div', 'sidebar-links');
  holder.append(create('p', 'menu-label', 'Other boards'));
  RELATED.forEach(([href, label]) => {
    const link = create(href === '#' ? 'span' : 'a', 'sidebar-link', label);
    if (href === '#') {
      link.append(create('span', 'tag', 'Soon'));
    } else {
      link.href = href;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.append(icon(ICONS.external, 14));
    }
    holder.append(link);
  });
  sidebar.querySelector('.sidebar-user').before(holder);
}

function setUpShell() {
  const user = readSession();
  document.getElementById('user-initials').textContent = initials(user.name);
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-role').textContent = `${user.role} · ${user.team}`;

  const app = document.getElementById('app');
  const body = document.querySelector('.app-body');
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menu-button');
  const moreButton = buildTabBar(sidebar);
  const smallScreen = window.matchMedia('(max-width: 900px)');
  let opener = menuButton;

  // On small screens the closed menu sits off to the side, so keyboards and screen readers must skip it
  const setMenuOpen = (open) => {
    app.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    moreButton.setAttribute('aria-expanded', String(open));
    sidebar.inert = smallScreen.matches && !open;
    body.inert = smallScreen.matches && open;
    if (smallScreen.matches) (open ? sidebar.querySelector('.menu-item') : opener).focus({ preventScroll: true });
  };
  sidebar.inert = smallScreen.matches;
  smallScreen.addEventListener('change', () => {
    app.classList.remove('menu-open');
    sidebar.inert = smallScreen.matches;
    body.inert = false;
  });

  const openFrom = (button) => {
    opener = button;
    setMenuOpen(!app.classList.contains('menu-open'));
  };
  menuButton.addEventListener('click', () => openFrom(menuButton));
  moreButton.addEventListener('click', () => openFrom(moreButton));
  document.getElementById('scrim').addEventListener('click', () => setMenuOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && app.classList.contains('menu-open')) setMenuOpen(false);
  });

  buildRelatedLinks(sidebar);
  buildHeaderTools();

  document.getElementById('sign-out').addEventListener('click', () => {
    endSession();
    location.href = SIGN_IN_PAGE;
  });

  return user;
}
