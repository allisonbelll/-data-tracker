// The 3D flight globe: routes from the home airport to every tracked destination, with small
// planes flying along each route. Drag to spin, click a plane or a destination to see the flight.
// Uses d3-geo (vendored in assets/vendor) for the orthographic projection.
"use strict";

const HOME = { id: "XNA", name: "Fayetteville", airport: "Northwest Arkansas National", coord: [-94.3068, 36.2819] };

// [longitude, latitude] of each tracked airport
const AIRPORT_COORDS = {
  KBNA: [-86.6782, 36.1245], KLAS: [-115.1537, 36.0840], KAUS: [-97.6699, 30.1945],
  KMIA: [-80.2870, 25.7959], KPHX: [-112.0116, 33.4342], KCHS: [-80.0405, 32.8986],
  KSAV: [-81.2021, 32.1276], KJFK: [-73.7781, 40.6413], PHNL: [-157.9225, 21.3187],
  PHOG: [-156.4305, 20.8986], MMUN: [-86.8771, 21.0365], MMSD: [-109.7215, 23.1518],
  TJSJ: [-66.0018, 18.4394], MYNN: [-77.4662, 25.0390], LFPG: [2.5479, 49.0097],
  LIRF: [12.2389, 41.8003], LEBL: [2.0833, 41.2974], LPPT: [-9.1342, 38.7742],
  LGAV: [23.9445, 37.9364],
};

const CAT_COLORS = { VFR: "#3d9970", MVFR: "#3b82f6", IFR: "#e0475b", LIFR: "#a43ac2" };
const CAT_STATUS = {
  VFR: ["On time", "Clear skies, so a smooth flight is likely"],
  MVFR: ["Minor delays possible", "Some clouds or haze at the destination"],
  IFR: ["Delays likely", "Low clouds or poor visibility at the destination"],
  LIFR: ["Delays likely", "Very low clouds or fog at the destination"],
};
const EARTH_MILES = 3958.8;

// --- a tiny TopoJSON decoder (enough for the world-atlas land file) ---
function topoToGeo(topo, objectName) {
  const t = topo.transform;
  const arcs = topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      if (t) { x += dx; y += dy; return [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]]; }
      return [dx, dy];
    });
  });
  const line = (ids) => {
    const pts = [];
    ids.forEach((i, k) => {
      const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
      a.forEach((p, j) => { if (k === 0 || j > 0) pts.push(p); });
    });
    return pts;
  };
  const geom = (g) => {
    if (g.type === "GeometryCollection") return { type: "GeometryCollection", geometries: g.geometries.map(geom) };
    if (g.type === "Polygon") return { type: "Polygon", coordinates: g.arcs.map(line) };
    if (g.type === "MultiPolygon") return { type: "MultiPolygon", coordinates: g.arcs.map((p) => p.map(line)) };
    return { type: "GeometryCollection", geometries: [] };
  };
  return { type: "Feature", properties: {}, geometry: geom(topo.objects[objectName]) };
}

async function loadLand() {
  const urls = ["assets/land-110m.json", "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return topoToGeo(await res.json(), "land");
    } catch (e) { /* try the next one */ }
  }
  return null; // the globe still works, just without coastlines
}

function fmtDuration(hours) {
  const total = Math.round(hours * 12) * 5; // minutes, to the nearest 5
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
}

function initGlobe({ canvas, infoEl, boardEl, latestRows }) {
  const ctx = canvas.getContext("2d");
  const flights = [...latestRows.values()]
    .filter((r) => AIRPORT_COORDS[r.item_id])
    .sort((a, b) => a.item.localeCompare(b.item))
    .map((r, i) => {
      const dest = AIRPORT_COORDS[r.item_id];
      const miles = d3.geoDistance(HOME.coord, dest) * EARTH_MILES;
      return {
        no: `JS ${String(101 + i * 7)}`,
        row: r,
        dest,
        interp: d3.geoInterpolate(HOME.coord, dest),
        miles,
        hours: miles / 480 + 0.6,          // rough block time: 480 mph cruise + taxi/climb
        period: 9 + miles / 700,           // seconds for one animated trip
        phase: (i * 0.137) % 1,
        color: CAT_COLORS[r.flight_category] || "#d9547a",
      };
    });

  let land = null;
  let rotation = [80, -28, 0];
  let zoom = 1;
  let selected = null;
  let dragging = null;
  let spinning = true;
  let tween = null;
  let hits = [];
  let width = 0, height = 0, dpr = 1;

  const projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const path = d3.geoPath(projection, ctx);
  const graticule = d3.geoGraticule10();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function drawPlane(x, y, angle, color, size, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    const s = size / 10;
    ctx.beginPath(); // nose points along +x
    ctx.moveTo(10 * s, 0);
    ctx.lineTo(7 * s, 1.2 * s); ctx.lineTo(1 * s, 1.4 * s); ctx.lineTo(-3 * s, 7.5 * s); ctx.lineTo(-5 * s, 7.5 * s);
    ctx.lineTo(-2.5 * s, 1.4 * s); ctx.lineTo(-7 * s, 1.3 * s); ctx.lineTo(-9 * s, 4 * s); ctx.lineTo(-10.5 * s, 4 * s);
    ctx.lineTo(-9.5 * s, 0);
    ctx.lineTo(-10.5 * s, -4 * s); ctx.lineTo(-9 * s, -4 * s); ctx.lineTo(-7 * s, -1.3 * s); ctx.lineTo(-2.5 * s, -1.4 * s);
    ctx.lineTo(-5 * s, -7.5 * s); ctx.lineTo(-3 * s, -7.5 * s); ctx.lineTo(1 * s, -1.4 * s); ctx.lineTo(7 * s, -1.2 * s);
    ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
  }

  function visible(coord) {
    const center = [-rotation[0], -rotation[1]];
    return d3.geoDistance(coord, center) < Math.PI / 2 - 0.03;
  }

  function frame(now) {
    if (tween) {
      const k = Math.min(1, (now - tween.start) / tween.ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      rotation = [tween.from[0] + (tween.to[0] - tween.from[0]) * e, tween.from[1] + (tween.to[1] - tween.from[1]) * e, 0];
      if (k === 1) tween = null;
    } else if (spinning && !dragging && !selected) {
      rotation[0] += 0.06;
    }
    const r = Math.min(width, height) / 2 * 0.92 * zoom;
    projection.rotate(rotation).scale(r).translate([width / 2, height / 2]);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // atmosphere and ocean
    const cx = width / 2, cy = height / 2;
    const glow = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.12);
    glow.addColorStop(0, "rgba(247, 201, 214, .55)"); glow.addColorStop(1, "rgba(247, 201, 214, 0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, r * 1.12, 0, 2 * Math.PI); ctx.fill();
    const ocean = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    ocean.addColorStop(0, "#5b3f8c"); ocean.addColorStop(0.6, "#3a2a6b"); ocean.addColorStop(1, "#241a4a");
    ctx.fillStyle = ocean; ctx.beginPath(); path({ type: "Sphere" }); ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 0.7;
    ctx.beginPath(); path(graticule); ctx.stroke();

    if (land) {
      ctx.fillStyle = "#f7c9d6"; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.6;
      ctx.beginPath(); path(land); ctx.fill(); ctx.stroke();
    }

    // routes
    flights.forEach((f) => {
      const on = selected === f;
      ctx.beginPath();
      path({ type: "LineString", coordinates: [HOME.coord, f.dest] });
      ctx.setLineDash(on ? [] : [4, 4]);
      ctx.strokeStyle = on ? "#f5c542" : selected ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.55)";
      ctx.lineWidth = on ? 2.6 : 1.2;
      ctx.stroke();
    });
    ctx.setLineDash([]);

    hits = [];
    // destination dots and labels
    ctx.font = "600 11px -apple-system, Segoe UI, Arial, sans-serif";
    flights.forEach((f) => {
      if (!visible(f.dest)) return;
      const [x, y] = projection(f.dest);
      ctx.beginPath(); ctx.arc(x, y, selected === f ? 6 : 4.2, 0, 2 * Math.PI);
      ctx.fillStyle = f.color; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
      if (!selected || selected === f || zoom > 1.4) {
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(36,26,74,.85)"; ctx.lineWidth = 3;
        ctx.strokeText(f.row.item, x + 7, y - 6); ctx.fillText(f.row.item, x + 7, y - 6);
      }
      hits.push({ x, y, f, radius: 9 });
    });

    // home: a little heart
    if (visible(HOME.coord)) {
      const [x, y] = projection(HOME.coord);
      ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#ff6f91"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-9, -3, -4, -10, 0, -5); ctx.bezierCurveTo(4, -10, 9, -3, 0, 4);
      ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(36,26,74,.85)"; ctx.lineWidth = 3;
      ctx.strokeText("XNA · home", x + 9, y + 12); ctx.fillText("XNA · home", x + 9, y + 12);
    }

    // planes
    const secs = now / 1000;
    flights.forEach((f) => {
      // planes stay between 12% and 92% of the route so they don't pile up on the airports
      const p = 0.12 + 0.8 * ((secs / f.period + f.phase) % 1);
      const pos = f.interp(p);
      if (!visible(pos)) return;
      const ahead = f.interp(Math.min(p + 0.01, 1));
      const [x, y] = projection(pos);
      const [ax, ay] = projection(ahead);
      const angle = Math.atan2(ay - y, ax - x);
      const on = selected === f;
      drawPlane(x, y, angle, on ? "#f5c542" : selected ? "rgba(255,255,255,.45)" : "#ffffff", on ? 16 : 9.5, on);
      hits.push({ x, y, f, radius: 13, plane: true });
    });

    requestAnimationFrame(frame);
  }

  function centerOn(coord, ms = 900) {
    tween = { from: rotation.slice(), to: [-coord[0], -coord[1]], start: performance.now(), ms };
    // spin the short way round
    const d = tween.to[0] - tween.from[0];
    tween.to[0] = tween.from[0] + (((d + 180) % 360) + 360) % 360 - 180;
  }

  function select(f, recenter = true) {
    selected = f;
    renderInfo();
    renderBoard();
    if (f && recenter) centerOn(d3.geoInterpolate(HOME.coord, f.dest)(0.5));
  }

  function renderInfo() {
    if (!selected) {
      infoEl.innerHTML = `<div class="boarding-pass empty">
        <div class="bp-main"><div class="bp-label">Tap a plane ✈ or a destination</div>
        <p class="muted small" style="margin:.3rem 0 0">Every route starts at home (XNA, Fayetteville). Drag the globe to spin it.</p></div></div>`;
      return;
    }
    const f = selected, r = f.row;
    const [status, why] = CAT_STATUS[r.flight_category] || ["–", ""];
    infoEl.innerHTML = `<div class="boarding-pass">
      <div class="bp-main">
        <div class="bp-label">Boarding pass · Flight ${esc(f.no)}</div>
        <div class="bp-route"><div><div class="bp-code">XNA</div><div class="bp-city">${esc(HOME.name)}</div></div>
          <div class="bp-plane">✈</div>
          <div><div class="bp-code">${esc(r.item_id)}</div><div class="bp-city">${esc(r.item)}</div></div></div>
        <div class="bp-grid">
          <div><span>Distance</span>${Math.round(f.miles).toLocaleString()} mi</div>
          <div><span>Est. flight time</span>${fmtDuration(f.hours)}</div>
          <div><span>Weather there</span>${fmt(r.temp_f)}°F · ${r.humidity_pct ?? "–"}% humid</div>
          <div><span>Wind</span>${r.wind_kt ?? "–"} kt${r.gust_kt ? `, gusts ${r.gust_kt}` : ""}</div>
        </div>
      </div>
      <div class="bp-stub">
        <div class="bp-label">Status</div>
        <div class="bp-status" style="color:${f.color}">${esc(status)}</div>
        ${catHTML(r.flight_category)}
        <p class="small muted" style="margin:.4rem 0 0">${esc(why)}</p>
        <button type="button" class="bp-close">Close</button>
      </div></div>`;
    infoEl.querySelector(".bp-close").onclick = () => select(null);
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = `<div class="board-head"><span>Flight</span><span>To</span><span>Temp</span><span>Status</span></div>` +
      flights.map((f) => {
        const [status] = CAT_STATUS[f.row.flight_category] || ["–"];
        return `<button type="button" class="board-row ${selected === f ? "on" : ""}" data-no="${esc(f.no)}">
          <span>${esc(f.no)}</span><span>${esc(f.row.item)}</span><span>${fmt(f.row.temp_f, 0)}°</span>
          <span style="color:${f.color}">${esc(status)}</span></button>`;
      }).join("");
    boardEl.querySelectorAll(".board-row").forEach((b) => b.addEventListener("click", () => {
      const f = flights.find((x) => x.no === b.dataset.no);
      select(selected === f ? null : f);
      canvas.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
  }

  // --- interaction ---
  canvas.addEventListener("pointerdown", (e) => {
    dragging = { x: e.clientX, y: e.clientY, rot: rotation.slice(), moved: 0 };
    tween = null;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
      dragging.moved = Math.max(dragging.moved, Math.abs(dx) + Math.abs(dy));
      const k = 0.35 / zoom;
      rotation = [dragging.rot[0] + dx * k, Math.max(-80, Math.min(80, dragging.rot[1] - dy * k)), 0];
    } else {
      const rect = canvas.getBoundingClientRect();
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = hit ? "pointer" : "grab";
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    const wasClick = dragging && dragging.moved < 5;
    dragging = null;
    if (!wasClick) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) select(hit.f === selected ? null : hit.f);
    else if (selected) select(null, false);
  });

  function hitTest(x, y) {
    let best = null, bestD = Infinity;
    hits.forEach((h) => {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < h.radius && d < bestD) { best = h; bestD = d; }
    });
    return best;
  }

  return {
    start() {
      renderInfo(); renderBoard();
      loadLand().then((l) => { land = l; });
      requestAnimationFrame(frame);
    },
    zoomBy(k) { zoom = Math.max(0.7, Math.min(3, zoom * k)); },
    toggleSpin() { spinning = !spinning; return spinning; },
    home() { select(null, false); centerOn(HOME.coord); },
    flights,
    select,
  };
}
