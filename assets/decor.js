// Original flight-and-wedding illustrations (inline SVG), shared by every page.
"use strict";

const ART = {
  // a little plane pulling a "Bride Tribe" banner over clouds, a diamond ring, champagne and hearts
  hero: `
<svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="dGem" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#dff3ff"/><stop offset="1" stop-color="#b9dcf5"/>
    </linearGradient>
    <linearGradient id="dGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f6dc8c"/><stop offset=".5" stop-color="#d4a84a"/><stop offset="1" stop-color="#b8913a"/>
    </linearGradient>
    <linearGradient id="dFizz" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbe7b5"/><stop offset="1" stop-color="#f3c96b"/>
    </linearGradient>
  </defs>
  <!-- clouds -->
  <g fill="#fff" opacity=".95">
    <ellipse cx="70" cy="170" rx="46" ry="16"/><ellipse cx="95" cy="160" rx="28" ry="18"/><ellipse cx="52" cy="162" rx="20" ry="13"/>
    <ellipse cx="300" cy="44" rx="34" ry="11"/><ellipse cx="318" cy="37" rx="20" ry="12"/>
  </g>
  <!-- dotted flight path loop with hearts -->
  <path d="M10 120 C 60 40, 130 40, 150 90 S 230 150, 250 70" fill="none" stroke="#d9547a" stroke-width="2.2"
        stroke-dasharray="2 7" stroke-linecap="round"/>
  <path d="M36 92 c-4-6 -12-3 -10 3 c1 4 10 9 10 9 s9-5 10-9 c2-6 -6-9 -10-3z" fill="#ff8fab"/>
  <path d="M120 58 c-3-4 -9-2 -7 2 c1 3 7 7 7 7 s7-4 7-7 c2-4 -4-6 -7-2z" fill="#ffb3c6"/>
  <!-- banner -->
  <line x1="196" y1="66" x2="214" y2="72" stroke="#8a6a77" stroke-width="1.2"/>
  <line x1="196" y1="88" x2="214" y2="76" stroke="#8a6a77" stroke-width="1.2"/>
  <path d="M90 62 L196 62 L196 92 L90 92 L100 77 Z" fill="#fff" stroke="#d9547a" stroke-width="2"/>
  <text x="148" y="82" text-anchor="middle" font-family="Didot, Georgia, serif" font-size="14" font-weight="700" fill="#d9547a">Bride Tribe</text>
  <!-- plane -->
  <g transform="translate(250 72) rotate(-12)">
    <path d="M-36 0 C -30 -9, 20 -10, 34 -4 C 40 -2, 40 2, 34 4 C 20 10, -30 9, -36 0 Z" fill="#ffffff" stroke="#3b1f2b" stroke-width="2"/>
    <path d="M-2 -6 L -16 -30 L -6 -30 L 14 -6 Z" fill="#d9547a" stroke="#3b1f2b" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-2 6 L -12 24 L -4 24 L 12 6 Z" fill="#d9547a" stroke="#3b1f2b" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-30 -3 L -38 -18 L -31 -18 L -22 -4 Z" fill="#d9547a" stroke="#3b1f2b" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="8" cy="-1" r="2.2" fill="#9fd3f7"/><circle cx="16" cy="-1" r="2.2" fill="#9fd3f7"/><circle cx="0" cy="-1" r="2.2" fill="#9fd3f7"/>
    <path d="M30 -3 C 33 -2, 33 2, 30 3" fill="none" stroke="#3b1f2b" stroke-width="1.6"/>
  </g>
  <!-- diamond ring -->
  <g transform="translate(330 140)">
    <circle cx="0" cy="22" r="26" fill="none" stroke="url(#dGold)" stroke-width="7"/>
    <circle cx="0" cy="22" r="26" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
    <path d="M-10 -6 L 10 -6 L 16 2 L 0 16 L -16 2 Z" fill="url(#dGem)" stroke="#7aa9cc" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M-16 2 L 16 2 M -10 -6 L -4 2 L 0 16 L 4 2 L 10 -6" fill="none" stroke="#7aa9cc" stroke-width="1"/>
    <path d="M-24 -20 l3 0 M-22.5 -21.5 l0 3 M 22 -18 l4 0 M 24 -20 l0 4 M 18 -30 l3 0 M 19.5 -31.5 l0 3" stroke="#b8913a" stroke-width="1.6" stroke-linecap="round"/>
  </g>
  <!-- champagne flutes clinking -->
  <g transform="translate(200 150)">
    <g transform="rotate(-14)">
      <path d="M-14 -34 L -2 -34 L -4 -6 C -5 0, -11 0, -12 -6 Z" fill="url(#dFizz)" stroke="#8a6a77" stroke-width="1.6"/>
      <line x1="-8" y1="-3" x2="-8" y2="18" stroke="#8a6a77" stroke-width="1.6"/>
      <line x1="-15" y1="18" x2="-1" y2="18" stroke="#8a6a77" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <g transform="rotate(14)">
      <path d="M2 -34 L 14 -34 L 12 -6 C 11 0, 5 0, 4 -6 Z" fill="url(#dFizz)" stroke="#8a6a77" stroke-width="1.6"/>
      <line x1="8" y1="-3" x2="8" y2="18" stroke="#8a6a77" stroke-width="1.6"/>
      <line x1="1" y1="18" x2="15" y2="18" stroke="#8a6a77" stroke-width="1.6" stroke-linecap="round"/>
    </g>
    <circle cx="-2" cy="-46" r="2" fill="#f3c96b"/><circle cx="5" cy="-54" r="1.5" fill="#f3c96b"/><circle cx="-7" cy="-56" r="1.3" fill="#f3c96b"/>
  </g>
</svg>`,

  // small icons
  plane: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>`,
  ring: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="15" r="6.2" fill="none" stroke="#c9a227" stroke-width="2.2"/><path d="M9 4h6l2 2.6L12 10 7 6.6z" fill="#dff3ff" stroke="#7aa9cc" stroke-width="1.1" stroke-linejoin="round"/></svg>`,
};

const VIBE_ICONS = {
  "Bachelorette": "💍", "Beach": "🏝️", "Island": "🌺", "City": "🥂", "Southern charm": "🌸", "Desert & spa": "🌵",
};
function vibeHTML(v) { return `<span class="vibe">${VIBE_ICONS[v] || "✨"} ${esc(v)}</span>`; }

function injectDecor() {
  document.querySelectorAll(".hero").forEach((h) => {
    if (h.querySelector(".hero-art")) return;
    h.insertAdjacentHTML("beforeend", `<div class="hero-art">${ART.hero}</div>`);
  });
  const brand = document.querySelector(".brand");
  if (brand && !brand.querySelector("svg")) {
    brand.innerHTML = `<span class="brand-icon">${ART.plane}</span>Jetset <span>Tracker</span>`;
  }
  document.querySelectorAll("footer").forEach((f) => {
    f.insertAdjacentHTML("afterbegin", `<div class="footer-path"><span>${ART.ring}</span><i></i><span class="fp-plane">${ART.plane}</span><i></i><span>${ART.ring}</span></div>`);
  });
}
document.addEventListener("DOMContentLoaded", injectDecor);
