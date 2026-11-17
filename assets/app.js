// Shared code for every page: loading the two data files, parsing, the move rule, formatting.
"use strict";

const NUMERIC = [
  { key: "temp_f", label: "Temp", unit: "°F" },
  { key: "temp_c", label: "Temp", unit: "°C" },
  { key: "dewpoint_c", label: "Dew point", unit: "°C" },
  { key: "humidity_pct", label: "Humidity", unit: "%" },
  { key: "wind_kt", label: "Wind", unit: "kt" },
  { key: "gust_kt", label: "Gusts", unit: "kt" },
  { key: "visibility_mi", label: "Visibility", unit: "mi" },
  { key: "ceiling_ft", label: "Ceiling", unit: "ft" },
  { key: "pressure_hpa", label: "Pressure", unit: "hPa" },
];
const NUMERIC_KEYS = NUMERIC.map((n) => n.key);
const MOVE_COLUMN = "temp_f";
const MOVE_LIMIT = 5;
const SHORTLIST_KEY = "jetset.shortlist";

// ---------- CSV ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() || [];
  return rows.filter((r) => r.length > 1).map((r) => {
    const o = {};
    header.forEach((h, i) => {
      const v = r[i] === undefined ? "" : r[i];
      o[h] = NUMERIC_KEYS.includes(h) ? (v === "" ? null : Number(v)) : v;
    });
    return o;
  });
}

// ---------- loading (network first; the service worker falls back to the last copy) ----------
async function loadData() {
  const [h, s] = await Promise.all([
    fetch("data/history.csv", { cache: "no-store" }),
    fetch("data/status.json", { cache: "no-store" }),
  ]);
  if (!h.ok || !s.ok) throw new Error("could not load the data files");
  const rows = parseCSV(await h.text());
  const status = await s.json();
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  return { rows, status, dates };
}

function rowsOn(rows, date) {
  const m = new Map();
  rows.forEach((r) => { if (r.date === date) m.set(r.item_id, r); });
  return m;
}

// The move rule (same as tracker/moves.py): absolute change in temp_f between the run date
// and the previous date in the history; largest first, ties by item_id.
function compare(rows, date) {
  const dates = [...new Set(rows.map((r) => r.date))].sort();
  if (!date) date = dates[dates.length - 1];
  const earlier = dates.filter((d) => d < date);
  const prev = earlier.length ? earlier[earlier.length - 1] : null;
  const today = rowsOn(rows, date);
  const before = prev ? rowsOn(rows, prev) : new Map();
  const moves = [], catChanges = [];
  [...today.keys()].filter((k) => before.has(k)).sort().forEach((id) => {
    const n = today.get(id), o = before.get(id);
    if (n[MOVE_COLUMN] != null && o[MOVE_COLUMN] != null) {
      const change = Math.round((n[MOVE_COLUMN] - o[MOVE_COLUMN]) * 10) / 10;
      moves.push({ item_id: id, item: n.item, old: o[MOVE_COLUMN], new: n[MOVE_COLUMN], change, abs: Math.abs(change) });
    }
    if ((o.flight_category || "") !== (n.flight_category || "")) {
      catChanges.push({ item_id: id, item: n.item, old: o.flight_category, new: n.flight_category });
    }
  });
  moves.sort((a, b) => b.abs - a.abs || (a.item_id < b.item_id ? -1 : 1));
  const newItems = prev ? [...today.keys()].filter((k) => !before.has(k)).sort() : [];
  const gone = prev ? [...before.keys()].filter((k) => !today.has(k)).sort() : [];
  return { date, prev, today, before, moves: moves.slice(0, MOVE_LIMIT), allMoves: moves, catChanges, newItems, gone };
}

// ---------- shortlist (stored in the browser) ----------
function getShortlist() {
  try { return new Set(JSON.parse(localStorage.getItem(SHORTLIST_KEY) || "[]")); }
  catch (e) { return new Set(); }
}
function saveShortlist(set) {
  try { localStorage.setItem(SHORTLIST_KEY, JSON.stringify([...set].sort())); } catch (e) { /* storage off */ }
}

// ---------- formatting ----------
function fmt(v, digits = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "–";
  return Number(v).toFixed(digits);
}
function fmtNum(key, v) {
  if (v === null || v === undefined) return "–";
  if (["humidity_pct", "wind_kt", "gust_kt", "ceiling_ft"].includes(key)) return Math.round(v).toLocaleString();
  return fmt(v);
}
function deltaHTML(n, o, digits = 1) {
  if (n == null || o == null) return "";
  const d = Math.round((n - o) * 10 ** digits) / 10 ** digits;
  const cls = d > 0 ? "up" : d < 0 ? "down" : "flat";
  const sign = d > 0 ? "+" : "";
  const arrow = d > 0 ? "▲" : d < 0 ? "▼" : "•";
  return `<span class="delta ${cls}">${arrow} ${sign}${d.toFixed(digits)}</span>`;
}
function catHTML(c) { return c ? `<span class="cat ${c}">${c}</span>` : "–"; }
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function localTime(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }

// Colors for items: a fixed hue per item_id so each airport keeps its color on every chart.
function itemColor(id, allIds) {
  const i = allIds.indexOf(id);
  const hue = (i * 360 / Math.max(allIds.length, 1) + 330) % 360;
  return `hsl(${hue}, 62%, ${i % 2 ? 46 : 56}%)`;
}

// ---------- page chrome ----------
function setupPage() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.dataset.page === page) a.classList.add("active");
  });
  const banner = document.getElementById("offline");
  const update = () => banner && banner.classList.toggle("show", !navigator.onLine);
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function showError(container, err) {
  container.innerHTML = `<div class="card"><h2>No data yet</h2><p class="muted">${esc(err.message || err)}.
  The first daily run will create the data files.</p></div>`;
}

document.addEventListener("DOMContentLoaded", setupPage);
