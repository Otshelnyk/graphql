import { finiteNumber, formatXP } from '../domain/number.js';
import { escapeHtml } from './html.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderOverviewCharts(data) {
  renderXpChart(document.getElementById('chartXPBody'), data.xpTransactions);
  renderAuditChart(document.getElementById('chartAuditBody'), data.auditStats);
}

function renderXpChart(container, transactions = []) {
  if (!container) return;
  container.replaceChildren();
  const points = transactions.map((item) => ({ amount: finiteNumber(item.amount), date: new Date(item.createdAt), label: item.path?.split('/').pop() || '—' })).filter((item) => !Number.isNaN(item.date.getTime()));
  if (!points.length) return renderEmpty(container, 'No XP data found.');

  const pad = { top: 24, right: 24, bottom: 36, left: 56 };
  const height = 300, barWidth = 15, gap = 10, innerHeight = height - pad.top - pad.bottom;
  const width = pad.left + points.length * (barWidth + gap) - gap + pad.right;
  const max = Math.max(...points.map((point) => point.amount), 1);
  const svg = createSvg('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': 'XP per transaction bar chart' });
  for (let index = 0; index <= 4; index += 1) {
    const amount = Math.round(max * index / 4);
    const y = pad.top + innerHeight - (amount / max) * innerHeight;
    svg.append(createSvg('line', { x1: pad.left, y1: y, x2: width - pad.right, y2: y, stroke: '#e4e4e0', 'stroke-width': 1 }));
    svg.append(createSvg('text', { x: pad.left - 8, y, 'text-anchor': 'end', 'dominant-baseline': 'middle', 'font-size': 10, fill: '#a0a0a0' }, formatXP(amount)));
  }
  points.forEach((point, index) => {
    const x = pad.left + index * (barWidth + gap);
    const barHeight = Math.max(1, point.amount / max * innerHeight);
    const rect = createSvg('rect', { x, y: pad.top + innerHeight - barHeight, width: barWidth, height: barHeight, fill: '#8b5cf6', opacity: .75, rx: 2 });
    rect.append(createSvg('title', {}, `${point.date.toLocaleDateString('en-GB')} — ${point.label}: +${formatXP(point.amount)}`));
    svg.append(rect);
  });
  spreadIndices(points.length, 4).forEach((index) => svg.append(createSvg('text', { x: pad.left + index * (barWidth + gap) + barWidth / 2, y: pad.top + innerHeight + 18, 'text-anchor': 'middle', 'font-size': 10, fill: '#a0a0a0' }, points[index].date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))));
  container.append(svg);
}

function renderAuditChart(container, audit = {}) {
  if (!container) return;
  container.replaceChildren();
  const done = finiteNumber(audit.done), received = finiteNumber(audit.received), total = done + received;
  if (!total) return renderEmpty(container, 'No audit data found.');
  const donePercent = done / total;
  const wrap = document.createElement('div');
  wrap.className = 'audit-chart-wrap';
  const svg = createSvg('svg', { viewBox: '0 0 280 280', class: 'audit-chart-svg', role: 'img', 'aria-label': 'Audit ratio donut chart' });
  svg.append(createSvg('circle', { cx: 140, cy: 140, r: 83, fill: 'none', stroke: '#e4e4e0', 'stroke-width': 34 }));
  const progress = createSvg('circle', { cx: 140, cy: 140, r: 83, fill: 'none', stroke: '#8b5cf6', 'stroke-width': 34, 'stroke-linecap': 'butt', transform: 'rotate(-90 140 140)', 'stroke-dasharray': `${2 * Math.PI * 83 * donePercent} ${2 * Math.PI * 83}` });
  progress.append(createSvg('title', {}, `Done: ${formatXP(done)} (${Math.round(donePercent * 100)}%)`));
  svg.append(progress, createSvg('text', { x: 140, y: 132, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 300, fill: '#1a1a1a' }, audit.ratio ?? '0.0'), createSvg('text', { x: 140, y: 154, 'text-anchor': 'middle', 'font-size': 18, fill: '#a0a0a0' }, 'ratio'));
  const legend = document.createElement('div'); legend.className = 'audit-legend';
  legend.append(legendItem('#8b5cf6', 'Done', done, donePercent), legendItem('#e4e4e0', 'Received', received, 1 - donePercent, true));
  wrap.append(svg, legend); container.append(wrap);
}

function legendItem(color, label, value, percentage, border = false) {
  const item = document.createElement('div'); item.className = 'audit-legend-item';
  item.innerHTML = `<div class="audit-legend-header"><span class="audit-legend-dot" style="background:${color}${border ? ';border:1px solid #ccc' : ''}"></span><span class="audit-legend-label">${escapeHtml(label)}</span></div><span class="audit-legend-value">${escapeHtml(formatXP(value))}</span><span class="audit-legend-pct">${Math.round(percentage * 100)}%</span>`;
  return item;
}

function renderEmpty(container, message) { const empty = document.createElement('p'); empty.className = 'chart-empty'; empty.textContent = message; container.append(empty); }
function createSvg(tag, attributes, text) { const node = document.createElementNS(SVG_NS, tag); Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value))); if (text != null) node.textContent = text; return node; }
function spreadIndices(length, count) { if (length <= count) return Array.from({ length }, (_, index) => index); return [...new Set(Array.from({ length: count }, (_, index) => Math.round(index * (length - 1) / (count - 1))))]; }
