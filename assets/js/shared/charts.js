// Charts drawn as plain SVG. Nothing is loaded from outside, and every mark comes from a figure on the page.

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgNode(name, attributes) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

// One rate as a ring, with the figure it stands for in the middle
function ringChart(fraction, label, caption, tone = 'accent') {
  const size = 128;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const part = Math.max(0, Math.min(1, fraction));

  const svg = svgNode('svg', { viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' });
  svg.append(svgNode('circle', {
    cx: size / 2, cy: size / 2, r: radius, fill: 'none',
    stroke: 'var(--field)', 'stroke-width': stroke
  }));
  svg.append(svgNode('circle', {
    cx: size / 2, cy: size / 2, r: radius, fill: 'none',
    stroke: `var(--ring-${tone})`, 'stroke-width': stroke, 'stroke-linecap': 'round',
    'stroke-dasharray': `${circumference * part} ${circumference}`,
    transform: `rotate(-90 ${size / 2} ${size / 2})`
  }));

  const art = create('div', 'ring-art');
  art.append(svg, create('b', '', formatPercent(fraction)));

  const figure = create('figure', `ring ring-${tone}`);
  const legend = create('figcaption');
  legend.append(create('span', '', label), create('small', '', caption));
  figure.append(art, legend);
  return figure;
}

// A run of figures over time. The scale is printed, so every line on the chart names a value.
function areaChart(points, { format = formatNumber, label = 'value' } = {}) {
  const width = 640;
  const height = 190;
  const top = 14;
  const bottom = height - 26;
  const most = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const at = (point, index) => [index * step, bottom - (point.value / most) * (bottom - top)];
  const spots = points.map(at);

  const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart-art', role: 'img' });
  const title = svgNode('title', {});
  title.textContent = `${label}: ${points.map((point) => `${point.label} ${format(point.value)}`).join(', ')}`;
  svg.append(title);

  [top, (top + bottom) / 2, bottom].forEach((y) => svg.append(svgNode('line', {
    x1: 0, x2: width, y1: y, y2: y, stroke: 'var(--line)', 'stroke-width': 1
  })));

  const line = spots.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  svg.append(svgNode('path', {
    d: `${line} L${width} ${bottom} L0 ${bottom} Z`, fill: 'var(--chart-fill)', stroke: 'none'
  }));
  svg.append(svgNode('path', {
    d: line, fill: 'none', stroke: 'var(--chart-line)', 'stroke-width': 2.5,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round'
  }));

  const highest = points.reduce((best, point, index) => (point.value > points[best].value ? index : best), 0);
  spots.forEach(([x, y], index) => svg.append(svgNode('circle', {
    cx: x, cy: y, r: index === highest ? 5 : 3.5,
    fill: index === highest ? 'var(--chart-line)' : 'var(--card)',
    stroke: 'var(--chart-line)', 'stroke-width': 2
  })));

  const chart = create('div', 'chart');
  const scale = create('div', 'chart-scale');
  scale.append(create('span', '', format(most)), create('span', '', format(Math.round(most / 2))), create('span', '', '0'));

  const plot = create('div', 'chart-plot');
  plot.append(scale, svg);

  const marks = create('div', 'chart-marks');
  points.forEach((point, index) => {
    const mark = create('span', '', point.label);
    if (index === highest) mark.className = 'is-peak';
    marks.append(mark);
  });

  chart.append(plot, marks);
  return chart;
}

// A ranked list, longest bar first, with the figure beside each row
function barList(rows, { format = formatNumber, split = false } = {}) {
  const most = Math.max(...rows.map((row) => row.value), 1);
  const list = create('ul', split ? 'bar-list is-split' : 'bar-list');
  rows.forEach((row) => {
    const item = create('li');
    const head = create('div', 'bar-head');
    head.append(create('span', '', row.label), create('b', '', format(row.value)));
    const track = create('div', 'track track-small');
    const fill = create('span', 'track-fill');
    fill.style.width = `${(row.value / most) * 100}%`;
    track.append(fill);
    item.append(head, track);
    if (row.note) item.append(create('small', '', row.note));
    list.append(item);
  });
  return list;
}
