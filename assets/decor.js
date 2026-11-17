// Original vintage-travel scrapbook illustrations (inline SVG), shared by every page:
// passports, boarding passes, postage stamps, postmarks, a signpost, a suitcase, an old map and a compass.
"use strict";

const PAL = { navy: "#1d2a4a", forest: "#1f5a44", sage: "#a9c3b8", cream: "#f4ecdc", tan: "#d8c3a5",
  caramel: "#b9783f", rose: "#c46b7a", ink: "#2b2730", gold: "#c9a24a", red: "#a8423a" };

let _uid = 0;
const uid = (p) => `${p}${++_uid}`;

// ---------- mini drawings used inside stamps (36 x 36 box) ----------
const MINI = {
  tower: `<path d="M18 3 L21 33 M18 3 L15 33 M15.8 22 h4.4 M16.8 13 h2.4 M12 33 h12 M14.5 33 q3.5-6 7 0" stroke="${PAL.ink}" stroke-width="1.4" fill="none"/>`,
  palm: `<circle cx="27" cy="9" r="5" fill="${PAL.gold}"/><path d="M15 33 q2-12 1-20" stroke="${PAL.caramel}" stroke-width="2" fill="none"/>
         <path d="M16 13 q-8-3 -12 3 M16 13 q-4-7 -10-6 M16 13 q6-6 12-3 M16 13 q7 0 9 7" stroke="${PAL.forest}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
         <path d="M2 33 q8-4 16 0 t16 0" stroke="${PAL.navy}" stroke-width="1.6" fill="none"/>`,
  cactus: `<circle cx="27" cy="9" r="4" fill="${PAL.caramel}" opacity=".8"/><path d="M18 33 V10 a3 3 0 0 1 6 0 V33 M18 22 h-4 a2 2 0 0 1 -2-2 v-5 M24 19 h3 a2 2 0 0 0 2-2 v-4"
         stroke="${PAL.forest}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 33 h28" stroke="${PAL.caramel}" stroke-width="2"/>`,
  guitar: `<g transform="rotate(30 18 18)"><circle cx="18" cy="25" r="6" fill="${PAL.caramel}"/><circle cx="18" cy="19" r="4.5" fill="${PAL.caramel}"/>
         <circle cx="18" cy="23" r="1.6" fill="${PAL.ink}"/><rect x="17" y="3" width="2" height="16" fill="${PAL.ink}"/><rect x="16" y="1" width="4" height="4" rx="1" fill="${PAL.ink}"/></g>`,
  dice: `<rect x="5" y="12" width="14" height="14" rx="2.5" fill="#fff" stroke="${PAL.ink}" stroke-width="1.4" transform="rotate(-12 12 19)"/>
         <rect x="17" y="8" width="14" height="14" rx="2.5" fill="${PAL.rose}" stroke="${PAL.ink}" stroke-width="1.4" transform="rotate(14 24 15)"/>
         <circle cx="12" cy="19" r="1.4" fill="${PAL.ink}"/><circle cx="9" cy="16" r="1.2" fill="${PAL.ink}"/><circle cx="15" cy="22" r="1.2" fill="${PAL.ink}"/>
         <circle cx="21" cy="12" r="1.2" fill="#fff"/><circle cx="27" cy="18" r="1.2" fill="#fff"/>`,
  star: `<path d="M18 4 l4 9 l10 1 l-7.5 6.5 l2.3 10 L18 25.5 L9.2 30.5 l2.3-10 L4 14 l10-1z" fill="${PAL.navy}"/><path d="M4 34 h28" stroke="${PAL.red}" stroke-width="2"/>`,
  skyline: `<path d="M3 33 V20 h5 V14 h4 V24 h3 V8 h3 l1-4 l1 4 h3 V22 h3 V16 h5 V33z" fill="${PAL.navy}"/><circle cx="29" cy="8" r="3" fill="${PAL.gold}"/>`,
  flower: `<g transform="translate(18 17)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-7" rx="4.5" ry="7" fill="${PAL.rose}" transform="rotate(${a})"/>`).join("")}
         <circle r="3" fill="${PAL.gold}"/></g><path d="M18 24 q-1 6 -4 9" stroke="${PAL.forest}" stroke-width="1.6" fill="none"/>`,
  wave: `<circle cx="10" cy="10" r="5" fill="${PAL.gold}"/><path d="M2 24 q6-10 14-4 q-6 0 -4 6 q8-2 10 4 H2z" fill="${PAL.navy}"/>
         <path d="M2 30 q8-4 16 0 t16 0 V34 H2z" fill="${PAL.sage}"/>`,
  arches: `<path d="M3 32 V12 h30 V32" fill="${PAL.tan}" stroke="${PAL.caramel}" stroke-width="1.4"/>
         ${[6, 14, 22].map((x) => `<path d="M${x} 32 v-7 a4 4 0 0 1 8 0 v7" fill="${PAL.cream}" stroke="${PAL.caramel}" stroke-width="1.2"/>
         <path d="M${x} 20 v-3 a4 4 0 0 1 8 0 v3z" fill="${PAL.cream}" stroke="${PAL.caramel}" stroke-width="1.2"/>`).join("")}`,
  columns: `<path d="M4 11 L18 4 L32 11z" fill="${PAL.cream}" stroke="${PAL.ink}" stroke-width="1.2"/>
         ${[7, 13, 19, 25].map((x) => `<rect x="${x}" y="12" width="3.4" height="18" fill="#fff" stroke="${PAL.ink}" stroke-width="1"/>`).join("")}
         <rect x="4" y="30" width="28" height="3" fill="${PAL.ink}"/>`,
  ring: `<circle cx="18" cy="22" r="9" fill="none" stroke="${PAL.gold}" stroke-width="3.2"/>
         <path d="M14 7 h8 l3 4 l-7 7 l-7-7z" fill="#e5f3fb" stroke="#6e9bbd" stroke-width="1.2" stroke-linejoin="round"/>`,
  plane: `<g transform="rotate(-30 18 18)"><path d="M18 3 c2 0 2.5 3 2.5 6 v6 l11 6 v3 l-11-3 v7 l3.5 2.5 v2.5 l-6-1.5 -6 1.5 v-2.5 l3.5-2.5 v-7 l-11 3 v-3 l11-6 v-6 c0-3 .5-6 2.5-6z"
         fill="${PAL.navy}"/></g>`,
  cocktail: `<path d="M8 8 h20 l-10 12z" fill="${PAL.rose}" stroke="${PAL.ink}" stroke-width="1.3" stroke-linejoin="round"/>
         <path d="M18 20 v10 M12 31 h12" stroke="${PAL.ink}" stroke-width="1.6"/><circle cx="26" cy="7" r="3" fill="${PAL.forest}"/>`,
};

const STAMP_FOR = {
  KBNA: ["guitar", "Nashville", PAL.cream], KLAS: ["dice", "Las Vegas", "#f6e1e1"], KAUS: ["star", "Austin", PAL.cream],
  KMIA: ["palm", "Miami", "#e3efe9"], KPHX: ["cactus", "Scottsdale", "#f3e4d0"], KCHS: ["flower", "Charleston", "#f6e7ea"],
  KSAV: ["flower", "Savannah", "#eef2e6"], KJFK: ["skyline", "New York", "#e7ebf3"], PHNL: ["wave", "Honolulu", "#e3efe9"],
  PHOG: ["flower", "Maui", "#f6e7ea"], MMUN: ["palm", "Cancún", "#f3eedb"], MMSD: ["cocktail", "Cabo", "#f3e4d0"],
  TJSJ: ["wave", "San Juan", "#e7ebf3"], MYNN: ["palm", "Nassau", "#e3efe9"], LFPG: ["tower", "Paris", "#f6e7ea"],
  LIRF: ["arches", "Roma", PAL.cream], LEBL: ["wave", "Barcelona", "#f3eedb"], LPPT: ["arches", "Lisboa", "#f3e4d0"],
  LGAV: ["columns", "Athens", "#e7ebf3"],
};

// A postage stamp with perforated edges. Drawn in a 60 x 76 box.
function stampSVG({ art, label, value, bg = PAL.cream, frame = PAL.caramel, x = 0, y = 0, rot = 0, scale = 1 }) {
  const id = uid("perf");
  const holes = [];
  for (let i = 0; i <= 10; i++) { holes.push([i * 6, 0], [i * 6, 76]); }
  for (let j = 0; j <= 12; j++) { holes.push([0, j * 6.33], [60, j * 6.33]); }
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">
    <mask id="${id}"><rect x="0" y="0" width="60" height="76" fill="#fff"/>${holes.map(([hx, hy]) => `<circle cx="${hx}" cy="${hy}" r="2.1" fill="#000"/>`).join("")}</mask>
    <g mask="url(#${id})"><rect width="60" height="76" fill="#fffdf7" filter="drop-shadow(0 1px 1px rgba(0,0,0,.15))"/>
      <rect x="5" y="5" width="50" height="66" fill="${bg}" stroke="${frame}" stroke-width="1.2"/>
      <g transform="translate(12 10)">${MINI[art] || MINI.plane}</g>
      ${value ? `<text x="51" y="15" text-anchor="end" font-family="Georgia, serif" font-size="8" font-weight="700" fill="${PAL.red}">${value}</text>` : ""}
      <text x="30" y="64" text-anchor="middle" font-family="Georgia, serif" font-size="7.4" letter-spacing=".6" fill="${PAL.ink}">${esc(String(label).toUpperCase())}</text>
    </g></g>`;
}

// A round postmark with wavy cancellation lines
function postmarkSVG({ x, y, r = 26, text = "AIR MAIL", sub = "", color = PAL.navy, rot = -10, waves = true }) {
  const id = uid("pm");
  return `<g transform="translate(${x} ${y}) rotate(${rot})" opacity=".78" fill="none" stroke="${color}">
    <circle r="${r}" stroke-width="1.6"/><circle r="${r - 5}" stroke-width=".9"/>
    <path id="${id}" d="M${-(r - 9)} 0 a${r - 9} ${r - 9} 0 1 1 ${2 * (r - 9)} 0" />
    <text font-family="Georgia, serif" font-size="7" letter-spacing="1.5" fill="${color}" stroke="none"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(text)}</textPath></text>
    <text y="4" text-anchor="middle" font-family="Courier New, monospace" font-size="7.5" font-weight="700" fill="${color}" stroke="none">${esc(sub)}</text>
    ${waves ? [0, 7, 14, 21].map((d) => `<path d="M${r + 2} ${-10 + d} q7-5 14 0 t14 0 t14 0" stroke-width="1.4"/>`).join("") : ""}
  </g>`;
}

function paperPlaneSVG(x, y, rot = -15, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M0 10 L44 0 L18 16 Z" fill="#fff" stroke="${PAL.ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M18 16 L44 0 L24 26 Z" fill="#ece4d4" stroke="${PAL.ink}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M18 16 L20 24 L24 26" fill="#ddd2bd" stroke="${PAL.ink}" stroke-width="1" stroke-linejoin="round"/></g>`;
}

function today() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

// ---------- page illustrations ----------
function heroToday() {
  const barcode = Array.from({ length: 22 }, (_, i) => `<rect x="196" y="${32 + i * 3}" width="44" height="${[1, 2, 1, 1.5, 2.2][i % 5]}" fill="${PAL.ink}"/>`).join("");
  return `<svg viewBox="0 0 420 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" font-family="Georgia, serif">
  <!-- boarding pass -->
  <g transform="translate(18 40) rotate(-6)">
    <rect width="250" height="104" rx="8" fill="#fffaf0" stroke="${PAL.tan}" filter="drop-shadow(0 3px 4px rgba(0,0,0,.18))"/>
    <rect width="250" height="22" rx="8" fill="${PAL.navy}"/><rect y="12" width="250" height="10" fill="${PAL.navy}"/>
    <text x="12" y="15" font-size="9.5" letter-spacing="2" fill="#fff">BOARDING PASS · JETSET AIR</text>
    <text x="12" y="52" font-size="26" font-weight="700" fill="${PAL.ink}">XNA</text>
    <text x="118" y="52" font-size="26" font-weight="700" fill="${PAL.ink}">CDG</text>
    <path d="M78 44 h28" stroke="${PAL.caramel}" stroke-dasharray="2 3"/><g transform="translate(88 36) scale(.5)">${MINI.plane}</g>
    <text x="12" y="64" font-size="7.5" fill="#7d7468">FAYETTEVILLE</text><text x="118" y="64" font-size="7.5" fill="#7d7468">PARIS</text>
    <g font-family="Courier New, monospace" font-size="7.5" fill="#7d7468"><text x="12" y="82">FLIGHT</text><text x="62" y="82">GATE</text><text x="104" y="82">SEAT</text><text x="146" y="82">CLASS</text></g>
    <g font-family="Courier New, monospace" font-size="10" font-weight="700" fill="${PAL.ink}"><text x="12" y="94">JS 199</text><text x="62" y="94">B7</text><text x="104" y="94">2A</text><text x="146" y="94">BRIDE</text></g>
    <path d="M188 22 v82" stroke="${PAL.tan}" stroke-dasharray="3 3"/>
    ${barcode}
    <text x="200" y="98" font-size="6.5" fill="#7d7468" font-family="Courier New, monospace">ONE WAY</text>
  </g>
  <!-- passport -->
  <g transform="translate(250 92) rotate(9)">
    <rect width="104" height="140" rx="8" fill="${PAL.navy}" filter="drop-shadow(0 4px 5px rgba(0,0,0,.28))"/>
    <rect x="5" y="5" width="94" height="130" rx="5" fill="none" stroke="${PAL.gold}" stroke-opacity=".55"/>
    <text x="52" y="32" text-anchor="middle" font-size="12" letter-spacing="3" fill="${PAL.gold}">PASSPORT</text>
    <g transform="translate(52 76)" stroke="${PAL.gold}" fill="none" stroke-width="1.4">
      <circle r="22"/><ellipse rx="10" ry="22"/><path d="M-22 0 h44 M-19 -11 h38 M-19 11 h38"/>
      <path d="M-30 -2 q-6 10 4 20 M30 -2 q6 10 -4 20" stroke-width="1.2"/>
    </g>
    <text x="52" y="120" text-anchor="middle" font-size="7.5" letter-spacing="1.6" fill="${PAL.gold}">WORLD TRAVELER</text>
  </g>
  ${stampSVG({ art: "tower", label: "Paris", value: "2.50", bg: "#f6e7ea", x: 304, y: 6, rot: 8, scale: .95 })}
  ${stampSVG({ art: "ring", label: "Just married", value: "1€", bg: "#eef2e6", frame: PAL.forest, x: 222, y: 150, rot: -9, scale: .85 })}
  ${postmarkSVG({ x: 268, y: 64, text: "PAR AVION · AIR MAIL ·", sub: today().slice(0, 6), color: PAL.red, rot: -14 })}
  ${paperPlaneSVG(30, 168, -20, 1.1)}
  <path d="M80 186 q40 30 100 6" fill="none" stroke="${PAL.ink}" stroke-width="1.3" stroke-dasharray="2 5" stroke-linecap="round"/>
</svg>`;
}

function heroBrowse() {
  const signs = [["PARIS", PAL.rose, 1], ["CANCÚN", PAL.sage, -1], ["NASHVILLE", PAL.caramel, 1], ["MAUI", PAL.tan, -1], ["ROMA", PAL.forest, 1], ["LAS VEGAS", "#e6c46a", -1]];
  return `<svg viewBox="0 0 420 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" font-family="Courier New, monospace">
  <!-- signpost -->
  <rect x="96" y="16" width="9" height="226" fill="#8a5a33"/><rect x="96" y="16" width="3" height="226" fill="#a8723f"/>
  ${signs.map(([t, c, dir], i) => {
    const y = 22 + i * 34, w = 96 + t.length * 2;
    const x0 = dir > 0 ? 101 : 101 - w;
    const tip = dir > 0 ? `M${x0} ${y} h${w - 12} l12 13 l-12 13 h${-(w - 12)}z` : `M${x0 + w} ${y} h${-(w - 12)} l-12 13 l12 13 h${w - 12}z`;
    return `<g transform="rotate(${dir * (i % 2 ? 3 : -3)} 100 ${y + 13})"><path d="${tip}" fill="${c}" stroke="${PAL.ink}" stroke-width="1.1"/>
      <text x="${dir > 0 ? x0 + (w - 12) / 2 : x0 + 12 + (w - 12) / 2}" y="${y + 17.5}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${PAL.ink}">${t}</text></g>`;
  }).join("")}
  <!-- suitcase with stickers -->
  <g transform="translate(250 104) rotate(-4)">
    <path d="M44 0 h46 a6 6 0 0 1 6 6 v12 h-10 v-8 h-38 v8 h-10 v-12 a6 6 0 0 1 6 -6z" fill="${PAL.caramel}"/>
    <rect y="16" width="136" height="104" rx="12" fill="#8fb3c9" stroke="${PAL.ink}" stroke-width="1.4" filter="drop-shadow(0 4px 4px rgba(0,0,0,.2))"/>
    <rect x="22" y="16" width="10" height="104" fill="${PAL.caramel}"/><rect x="104" y="16" width="10" height="104" fill="${PAL.caramel}"/>
    <circle cx="70" cy="56" r="17" fill="${PAL.cream}" stroke="${PAL.red}" stroke-width="2"/>
    <text x="70" y="54" text-anchor="middle" font-family="Georgia, serif" font-size="7" fill="${PAL.red}">BON</text>
    <text x="70" y="63" text-anchor="middle" font-family="Georgia, serif" font-size="7" fill="${PAL.red}">VOYAGE</text>
    <rect x="44" y="84" width="48" height="22" rx="3" fill="${PAL.rose}" transform="rotate(8 68 95)"/>
    <text x="68" y="99" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" transform="rotate(8 68 95)">BRIDE ♥</text>
  </g>
  <!-- luggage tag -->
  <g transform="translate(226 40) rotate(-18)">
    <path d="M0 8 l10-8 h62 v52 h-62 l-10-8z" fill="${PAL.tan}" stroke="${PAL.ink}" stroke-width="1.1"/>
    <circle cx="11" cy="26" r="3.4" fill="${PAL.cream}" stroke="${PAL.ink}"/>
    <path d="M7 26 C -20 30, -10 70, 20 92" stroke="${PAL.red}" stroke-width="1.4" fill="none"/>
    <text x="22" y="20" font-size="7" fill="${PAL.ink}">FROM: XNA</text><text x="22" y="32" font-size="7" fill="${PAL.ink}">TO: ANYWHERE</text>
    <text x="22" y="44" font-size="7" fill="${PAL.ink}">♥ ♥ ♥</text>
  </g>
  ${stampSVG({ art: "palm", label: "Cancún", value: "8P", bg: "#f3eedb", x: 340, y: 12, rot: 10, scale: .85 })}
</svg>`;
}

function heroTrends() {
  return `<svg viewBox="0 0 420 250" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" font-family="Georgia, serif">
  <!-- folded vintage map -->
  <g transform="translate(20 30) rotate(-4)">
    <path d="M0 10 L80 0 L160 12 L240 0 L240 170 L160 182 L80 170 L0 180 Z" fill="#efe2c4" stroke="${PAL.tan}" filter="drop-shadow(0 4px 5px rgba(0,0,0,.18))"/>
    <path d="M80 0 V170 M160 12 V182" stroke="#d8c39b" stroke-width="1.2"/>
    <path d="M0 10 L80 0 V170 L0 180z" fill="#000" opacity=".04"/><path d="M160 12 L240 0 V170 L160 182z" fill="#000" opacity=".04"/>
    <g stroke="#cdb48a" stroke-width=".7" fill="none">${[40, 80, 120, 160].map((y) => `<path d="M0 ${y} Q120 ${y - 10} 240 ${y}"/>`).join("")}
      ${[40, 120, 200].map((x) => `<path d="M${x} 0 Q${x - 8} 90 ${x} 180"/>`).join("")}</g>
    <path d="M18 60 q14-22 40-14 q20 6 18 24 q-2 18 -24 22 q-18 4 -30 -10 q-10 -12 -4 -22z" fill="${PAL.sage}" opacity=".85"/>
    <path d="M120 40 q30-10 60 0 q24 10 20 36 q-6 30 -40 36 q-30 4 -46 -20 q-14 -26 6 -52z" fill="${PAL.sage}" opacity=".85"/>
    <path d="M190 130 q20-8 34 6 q8 14 -6 22 q-20 8 -30 -6 q-6 -14 2 -22z" fill="${PAL.sage}" opacity=".85"/>
    <path d="M44 78 C 90 140, 150 30, 206 140" fill="none" stroke="${PAL.red}" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>
    <circle cx="44" cy="78" r="4" fill="${PAL.navy}"/>
    <path d="M200 134 l12 12 M212 134 l-12 12" stroke="${PAL.red}" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- compass rose -->
  <g transform="translate(330 70)">
    <circle r="48" fill="${PAL.cream}" stroke="${PAL.caramel}" stroke-width="2"/><circle r="40" fill="none" stroke="${PAL.caramel}" stroke-dasharray="1 3"/>
    <path d="M0 -42 L7 -7 L0 0 Z M0 42 L-7 7 L0 0 Z" fill="${PAL.navy}"/><path d="M0 -42 L-7 -7 L0 0 Z M0 42 L7 7 L0 0 Z" fill="${PAL.sage}"/>
    <path d="M-42 0 L-7 -7 L0 0 Z M42 0 L7 7 L0 0 Z" fill="${PAL.caramel}"/><path d="M-42 0 L-7 7 L0 0 Z M42 0 L7 -7 L0 0 Z" fill="${PAL.tan}"/>
    <circle r="4" fill="${PAL.gold}"/>
    <text y="-50" text-anchor="middle" font-size="11" font-weight="700" fill="${PAL.navy}">N</text>
  </g>
  <!-- postcard -->
  <g transform="translate(250 140) rotate(6)">
    <rect width="150" height="96" fill="#fffaf0" stroke="${PAL.tan}" filter="drop-shadow(0 3px 4px rgba(0,0,0,.2))"/>
    <path d="M86 12 v74" stroke="${PAL.tan}"/>
    <text x="12" y="30" font-family="Bradley Hand, Segoe Print, cursive" font-size="13" fill="${PAL.navy}">Greetings</text>
    <text x="12" y="48" font-family="Bradley Hand, Segoe Print, cursive" font-size="13" fill="${PAL.navy}">from</text>
    <text x="12" y="68" font-family="Bradley Hand, Segoe Print, cursive" font-size="13" fill="${PAL.rose}">everywhere ♥</text>
    ${[52, 64, 76].map((y) => `<path d="M94 ${y} h46" stroke="${PAL.tan}"/>`).join("")}
    ${stampSVG({ art: "columns", label: "Athens", value: "€1", bg: "#e7ebf3", x: 110, y: 8, scale: .48 })}
  </g>
  ${paperPlaneSVG(250, 8, 10, .9)}
</svg>`;
}

const HERO_ART = { today: heroToday, browse: heroBrowse, trends: heroTrends };
const TYPESTRIPS = { today: "NEXT STOP: EVERYWHERE.", browse: "PICK YOUR DESTINATION.", trends: "THE TRAVEL LOG." };

// small icons
const ICON = {
  plane: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>`,
};

const VIBE_ICONS = {
  "Bachelorette": "💍", "Beach": "🏝️", "Island": "🌺", "City": "🥂", "Southern charm": "🌸", "Desert & spa": "🌵",
};
function vibeHTML(v) { return `<span class="vibe">${VIBE_ICONS[v] || "✨"} ${esc(v)}</span>`; }

// a row of postage stamps, one per destination
function stampStripSVG(ids) {
  const w = 70 * ids.length + 10;
  return `<svg viewBox="0 0 ${w} 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="min-width:${w * 0.82}px">
    ${ids.map((id, i) => {
      const [art, label, bg] = STAMP_FOR[id];
      const rot = [-5, 3, -2, 6, -4, 2][i % 6];
      const value = ["25¢", "1€", "40", "2.50", "70c", "5"][i % 6];
      return stampSVG({ art, label, value, bg, x: 8 + i * 70, y: 10, rot });
    }).join("")}</svg>`;
}

// a rubber passport stamp for one destination's latest observation
function passportStampSVG(r, date) {
  const colors = { VFR: PAL.forest, MVFR: PAL.navy, IFR: PAL.red, LIFR: "#7b3f8f" };
  const color = colors[r.flight_category] || PAL.navy;
  const id = uid("ps");
  const word = r.flight_category === "VFR" ? "ARRIVED" : r.flight_category === "MVFR" ? "ADMITTED" : "DELAYED";
  const rot = ((r.item_id.charCodeAt(1) * 7 + r.item_id.charCodeAt(3) * 3) % 24) - 12;
  const square = r.item_id.charCodeAt(0) % 2 === 0;
  const frame = square
    ? `<rect x="-44" y="-36" width="88" height="72" rx="8" stroke-width="2.4"/><rect x="-39" y="-31" width="78" height="62" rx="5" stroke-width="1"/>`
    : `<circle r="44" stroke-width="2.4"/><circle r="38" stroke-width="1"/>`;
  return `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label="${esc(r.item)}: ${fmt(r.temp_f)}°F, ${esc(r.flight_category)}">
    <g transform="rotate(${rot})" fill="none" stroke="${color}" opacity=".88" style="mix-blend-mode:multiply">
      ${frame}
      ${square ? "" : `<path id="${id}" d="M-31 0 a31 31 0 1 1 62 0"/>`}
      <g fill="${color}" stroke="none" font-family="Courier New, monospace" text-anchor="middle">
        ${square ? `<text y="-17" font-size="9" font-weight="700" letter-spacing="1">${esc(r.item.toUpperCase().slice(0, 12))}</text>`
                 : `<text font-size="8.5" font-weight="700" letter-spacing="1.4"><textPath href="#${id}" startOffset="50%">${esc(r.item.toUpperCase())}</textPath></text>`}
        <text y="${square ? 6 : 8}" font-size="17" font-weight="700" font-family="Georgia, serif">${fmt(r.temp_f, 0)}°F</text>
        <text y="${square ? 18 : 20}" font-size="6.6" letter-spacing=".8">${esc(word)}</text>
        <text y="${square ? 27 : 29}" font-size="6">${esc(r.item_id)} · ${esc(date)}</text>
      </g>
    </g></svg>`;
}

function injectDecor() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".hero").forEach((h) => {
    if (h.querySelector(".hero-art")) return;
    const draw = HERO_ART[page] || heroToday;
    h.insertAdjacentHTML("beforeend", `<div class="hero-art">${draw()}</div>`);
    const h1 = h.querySelector("h1");
    if (h1 && TYPESTRIPS[page]) h1.insertAdjacentHTML("beforebegin", `<span class="typestrip">${TYPESTRIPS[page]}</span>`);
    // the stamp strip under every page header
    const order = { today: ["LFPG", "MMUN", "KBNA", "KLAS", "PHOG", "LIRF", "KJFK", "LGAV", "KPHX", "TJSJ"],
      browse: ["MMSD", "LEBL", "KAUS", "KMIA", "LPPT", "KCHS", "PHNL", "MYNN", "KSAV", "LFPG"],
      trends: ["LGAV", "KLAS", "LIRF", "KBNA", "MMUN", "KJFK", "PHOG", "LEBL", "KPHX", "MMSD"] }[page] || [];
    h.insertAdjacentHTML("afterend", `<div class="stamp-strip">${stampStripSVG(order)}</div>`);
  });
  const brand = document.querySelector(".brand");
  if (brand && !brand.querySelector("svg")) {
    brand.innerHTML = `<span class="brand-icon">${ICON.plane}</span>Jetset <span>Tracker</span>`;
  }
  document.querySelectorAll("footer").forEach((f) => {
    f.insertAdjacentHTML("afterbegin", `<div class="ticket"><div class="ticket-main">
        <span class="ticket-kicker">One-way ticket</span><strong>XNA ✈ ANYWHERE</strong>
        <span class="ticket-sub">Admit one · Bride tribe · Valid every day</span></div>
        <div class="ticket-stub">No.<br><b>${String(Math.abs(Date.now() / 864e5 | 0)).slice(-6)}</b></div></div>`);
  });
}
document.addEventListener("DOMContentLoaded", injectDecor);
