// Small SVG charts with no outside library, so the site works offline.
"use strict";

const SVGNS = "http://www.w3.org/2000/svg";

function niceTicks(min, max, count = 5) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

function shortDate(d) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function tickLabel(v) {
  return Math.abs(v) >= 1000 ? v.toLocaleString() : String(Math.round(v * 10) / 10);
}

// series: [{ name, color, values: { date: number|null } }]
function lineChart(container, { dates, series, unit = "", height = 260 }) {
  const W = 640, H = height, m = { t: 14, r: 16, b: 34, l: 52 };
  const vals = [];
  series.forEach((s) => dates.forEach((d) => { const v = s.values[d]; if (v != null) vals.push(v); }));
  container.innerHTML = "";
  container.classList.add("chart");
  if (!vals.length || !dates.length) {
    container.innerHTML = '<p class="muted small">No values to plot for this selection yet.</p>';
    return;
  }
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const x = (i) => dates.length === 1 ? (m.l + W - m.r) / 2 : m.l + (i * (W - m.l - m.r)) / (dates.length - 1);
  const y = (v) => m.t + (H - m.t - m.b) * (1 - (v - y0) / (y1 - y0 || 1));
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  ticks.forEach((t) => {
    svg += `<line class="grid-line" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/>`;
    svg += `<text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${tickLabel(t)}</text>`;
  });
  const every = Math.ceil(dates.length / 8);
  dates.forEach((d, i) => {
    if (i % every === 0 || i === dates.length - 1) {
      svg += `<text x="${x(i)}" y="${H - 12}" text-anchor="middle">${shortDate(d)}</text>`;
    }
  });
  svg += `<text x="12" y="${m.t + 4}" text-anchor="start">${esc(unit)}</text>`;
  series.forEach((s) => {
    let path = "", pen = false;
    dates.forEach((d, i) => {
      const v = s.values[d];
      if (v == null) { pen = false; return; }
      path += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    if (path) svg += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    dates.forEach((d, i) => {
      const v = s.values[d];
      if (v == null) return;
      svg += `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.4" fill="${s.color}"><title>${esc(s.name)} · ${d}: ${tickLabel(v)} ${esc(unit)}</title></circle>`;
    });
  });
  svg += "</svg>";
  const legend = series.length > 1
    ? `<div class="legend">${series.map((s) => `<span><i class="dot" style="background:${s.color};width:.7rem;height:.7rem;border-radius:50%;display:inline-block"></i>${esc(s.name)}</span>`).join("")}</div>`
    : "";
  container.innerHTML = svg + legend;
}

// items: [{ label, value, color? }]; horizontal bars; negative values grow left of zero
function barChart(container, { items, unit = "", digits = 1 }) {
  container.innerHTML = "";
  container.classList.add("chart");
  items = items.filter((it) => it.value != null && !Number.isNaN(it.value));
  if (!items.length) {
    container.innerHTML = '<p class="muted small">Not enough history yet. This chart fills in as the daily runs add days.</p>';
    return;
  }
  const W = 640, row = 24, m = { t: 8, r: 70, b: 8, l: 150 };
  const H = m.t + m.b + row * items.length;
  const lo = Math.min(0, ...items.map((i) => i.value));
  const hi = Math.max(0, ...items.map((i) => i.value));
  const span = hi - lo || 1;
  const left = m.l + (lo < 0 ? 56 : 0); // leave room for the value text of negative bars
  const x = (v) => left + ((v - lo) / span) * (W - left - m.r);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  svg += `<line class="axis" x1="${x(0)}" x2="${x(0)}" y1="${m.t}" y2="${H - m.b}"/>`;
  items.forEach((it, i) => {
    const yy = m.t + i * row;
    const a = x(Math.min(0, it.value)), b = x(Math.max(0, it.value));
    const color = it.color || (it.value < 0 ? "#6c8ef5" : "#d9547a");
    svg += `<text x="${m.l - 8}" y="${yy + row / 2 + 4}" text-anchor="end" style="fill:#3b1f2b">${esc(it.label)}</text>`;
    svg += `<rect x="${a}" y="${yy + 4}" width="${Math.max(b - a, 1.5)}" height="${row - 8}" rx="5" fill="${color}"><title>${esc(it.label)}: ${it.value.toFixed(digits)} ${esc(unit)}</title></rect>`;
    const tx = it.value < 0 ? a - 6 : b + 6;
    svg += `<text x="${tx}" y="${yy + row / 2 + 4}" text-anchor="${it.value < 0 ? "end" : "start"}">${it.value.toFixed(digits)}${unit ? " " + esc(unit) : ""}</text>`;
  });
  svg += "</svg>";
  container.innerHTML = svg;
}
