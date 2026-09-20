#!/usr/bin/env node
// Innovate Connects — layered "flow" art generator v3
// v3: wifi glyphs are proper ~96deg fans; gold is bundled fibre (twin
// filaments + occasional stitching) rather than smooth single strokes.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- seeded rng + noise ----------
const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const gauss = (rng) => {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const makeNoise2D = (rng) => {
  const P = 256, grid = new Float32Array(P * P);
  for (let i = 0; i < P * P; i++) grid[i] = rng();
  const at = (x, y) => grid[((y & 255) * P + (x & 255)) % (P * P)];
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = fade(x - xi), yf = fade(y - yi);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
  };
};

const fbm = (noise, x, y, oct = 4) => {
  let v = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += amp * noise(x * f, y * f); amp *= 0.5; f *= 2; }
  return v;
};

// ---------- brand palette ----------
const C = {
  baseA: "#0A141C", baseB: "#132634",
  tealDeep: "#1F6E6B", teal: "#2FA39D", tealBright: "#57C4B8",
  crimDeep: "#6E2437", crim: "#96324A", crimHot: "#C05A6E",
  gold: "#D9A84E", goldBright: "#F0D089",
};

// ---------- colour helpers ----------
const q = (n) => Math.round(n * 10) / 10;
const lerpHex = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const darken = (hex, f = 0.45) => lerpHex(hex, "#050A0F", f);

// ---------- geometry ----------
const sCurve = (t, { x0, y0, x1, y1, lift = 0.35, sag = 0.18 }) => {
  const shaped = t * t * (3 - 2 * t);
  const xt = x0 + (x1 - x0) * t;
  const mid = y0 + (y1 - y0) * shaped;
  const billow = Math.sin(t * Math.PI) * (y1 - y0) * -sag;
  return [xt, mid + billow - lift * Math.sin(t * Math.PI) * (y0 - y1) * 0.25];
};

const traceStrand = (noise, cfg, bandOffset, rng) => {
  const pts = [];
  const n = cfg.segmentCount ?? 90;
  const wob = (rng() - 0.5) * cfg.wobbleJitter;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [gx, gy] = sCurve(t, cfg.guide);
    const wobble =
      (fbm(noise, gx * cfg.noiseScale + bandOffset * 0.01, gy * cfg.noiseScale) - 0.5) *
      cfg.noiseAmp * (0.4 + 0.6 * Math.sin(t * Math.PI));
    pts.push([q(gx), q(gy + bandOffset + wobble + wob)]);
  }
  return pts;
};

const pathFrom = (pts) =>
  "M" + pts[0][0] + "," + pts[0][1] +
  pts.slice(1).map(([x, y]) => "L" + x + "," + y).join("");

// ---------- ribbon sheets: gaussian density + fray + flow gradient ----------
function ribbonSheet(rng, noise, sheet, uid) {
  const gid = `sheet-${uid}`;
  const grad =
    `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" ` +
    `x1="${sheet.guide.x0}" y1="${sheet.guide.y0}" x2="${sheet.guide.x1}" y2="${sheet.guide.y1}">` +
    `<stop offset="0%" stop-color="${sheet.from}"/><stop offset="55%" stop-color="${sheet.to}"/>` +
    `<stop offset="100%" stop-color="${darken(sheet.to, sheet.endDarken ?? 0.5)}"/></linearGradient>`;
  const gradMix = sheet.gradMix ?? 0.75;
  const half = sheet.thickness * 0.5;
  const paths = [];

  const emit = (bandOffset, frayed) => {
    const pts = traceStrand(noise, sheet, bandOffset, rng);
    const centreFalloff = Math.exp(-2.1 * Math.pow(bandOffset / (half * 1.4), 2));
    const opacity = q(Math.max(0.03, Math.min(0.3,
      sheet.opacity * centreFalloff * (frayed ? 0.55 : 1) * (0.7 + rng() * 0.6))));
    const w = q((frayed ? 0.5 : 0.6) + rng() * 0.9);
    let stroke;
    const roll = rng();
    if (roll < gradMix) stroke = `url(#${gid})`;
    else if (roll < gradMix + 0.1) stroke = sheet.accent;
    else stroke = lerpHex(sheet.from, sheet.to, rng());
    paths.push(`<path d="${pathFrom(pts)}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${w}"/>`);
  };

  for (let s = 0; s < sheet.strands; s++) emit(gauss(rng) * half * 0.62, false);
  const frayN = sheet.fray ?? Math.round(sheet.strands * 0.08);
  for (let s = 0; s < frayN; s++) {
    const side = rng() < 0.5 ? -1 : 1;
    emit(side * half * (1.05 + rng() * 0.85), true);
  }

  const wash = `<path d="${pathFrom(traceStrand(noise, sheet, 0, rng))}" stroke="${sheet.from}" stroke-opacity="0.10" stroke-width="${q(sheet.thickness * 1.6)}" stroke-linecap="round"/>`;
  const blur = sheet.blur ? ` filter="url(#blur${sheet.blur})"` : "";
  const body =
    `<g id="g-${uid}" fill="none" stroke-linecap="round"${blur}` +
    (sheet.drift ? ` class="drift drift-${uid}"` : "") +
    `>\n${paths.join("\n")}\n</g>`;
  const halo = `<use href="#g-${uid}" filter="url(#blur6)" opacity="0.30" transform="translate(3,4)"/>`;
  return { grad, wash, body, halo };
}

// ---------- gold threads: bundled fibre, not smooth single strokes ----------
function goldThreads(rng, noise, cfg, uid) {
  const dark = lerpHex(C.gold, "#4A3410", 0.55);
  const paths = [];
  for (let i = 0; i < cfg.count; i++) {
    const offset = gauss(rng) * cfg.thickness * 0.5;
    const pts = traceStrand(noise, cfg, offset, rng);
    const opacity = q(0.45 + rng() * 0.45);
    const w = q(0.9 + rng() * 1.3);
    const stroke = rng() < 0.35 ? C.goldBright : C.gold;
    const dash = rng() < 0.25 ? ' stroke-dasharray="7 3"' : "";
    paths.push(`<path d="${pathFrom(pts)}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${w}"${dash}/>`);
    // fibre twins: bright + dark offset filaments = twisted thread highlight/shadow
    for (const [dy, so, sw, col] of [[-1.3, 0.55, 0.55, C.goldBright], [1.5, 0.4, 0.5, dark]]) {
      const twin = pts.map(([px, py]) => [px, q(py + dy * (0.8 + rng() * 0.5))]);
      paths.push(`<path d="${pathFrom(twin)}" stroke="${col}" stroke-opacity="${q(opacity * so)}" stroke-width="${q(w * sw)}"/>`);
    }
  }
  return `<g id="gold-${uid}" fill="none" stroke-linecap="round">\n${paths.join("\n")}\n</g>`;
}

// ---------- routed node network: nodes live on threads, 2 focal points ----------
function nodeNetwork(rng, threadPts, cfg) {
  if (!threadPts?.length) return { links: "", nodes: "" };
  const pts = [];
  for (let i = 0; i < cfg.count; i++) {
    const t = threadPts[i % threadPts.length];
    pts.push(t[Math.floor(rng() * t.length)]);
  }
  const uniq = [...new Map(pts.map((p) => [p.join(","), p])).values()];
  const links = [], dots = [], halos = [];
  const linked = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < cfg.linkRadius;
  for (const p of uniq) {
    const near = uniq.filter((o) => o !== p && linked(p, o))
      .sort((a, b) => Math.hypot(a[0]-p[0], a[1]-p[1]) - Math.hypot(b[0]-p[0], b[1]-p[1]))
      .slice(0, 2);
    for (const o of near) links.push(`<line x1="${p[0]}" y1="${p[1]}" x2="${o[0]}" y2="${o[1]}"/>`);
  }
  const cx = uniq.reduce((s, p) => s + p[0], 0) / uniq.length;
  const cy = uniq.reduce((s, p) => s + p[1], 0) / uniq.length;
  const byDist = [...uniq].sort((a, b) => Math.hypot(b[0]-cx, b[1]-cy) - Math.hypot(a[0]-cx, a[1]-cy));
  const focals = new Set(byDist.slice(0, 2).map((p) => p.join(",")));
  for (const p of uniq) {
    const focal = focals.has(p.join(","));
    const r = focal ? q(5.5 + rng() * 1.5) : q(1.8 + rng() * 2.6);
    halos.push(`<circle cx="${p[0]}" cy="${p[1]}" r="${q(r * (focal ? 5 : 4))}" fill="url(#halo)" opacity="${focal ? 0.7 : 0.45}"/>`);
    dots.push(`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${focal ? C.goldBright : C.gold}"/>`);
  }
  return {
    links: `<g stroke="${C.gold}" stroke-opacity="0.32" stroke-width="0.6">${links.join("")}</g>`,
    nodes: `<g>${halos.join("")}${dots.join("")}</g>`,
  };
}

// ---------- glyphs ----------
const polarPt = (x, y, R, deg) =>
  [q(x + R * Math.cos((deg * Math.PI) / 180)), q(y + R * Math.sin((deg * Math.PI) / 180))];

function wifiGlyph(x, y, s, rot) {
  // classic wifi fan: arcs centred on the dot, 96deg span pointing up, tilted by rot
  const arcs = [0.4, 0.7, 1.0]
    .map((r) => {
      const R = q(s * r);
      const [sx, sy] = polarPt(x, y, R, -90 + rot - 48);
      const [ex, ey] = polarPt(x, y, R, -90 + rot + 48);
      return `<path d="M${sx},${sy} A${R},${R} 0 0 1 ${ex},${ey}"/>`;
    })
    .join("");
  return `<g fill="none" stroke="${C.gold}" stroke-width="${q(s * 0.09)}" stroke-linecap="round" stroke-opacity="0.8">${arcs}<circle cx="${x}" cy="${q(y)}" r="${q(s * 0.07)}" fill="${C.goldBright}" stroke="none"/></g>`;
}

function glyphs(rng, cfg, W, H) {
  const out = [];
  for (let i = 0; i < cfg.wifiCount; i++) {
    out.push(wifiGlyph(q(W * (0.55 + rng() * 0.4)), q(H * (0.15 + rng() * 0.5)), q(34 + rng() * 30), q(-10 - rng() * 25)));
  }
  for (let i = 0; i < cfg.sparkCount; i++) {
    const x = q(W * (0.3 + rng() * 0.65)), y = q(H * (0.1 + rng() * 0.7)), s = q(3 + rng() * 5);
    out.push(`<g stroke="${C.goldBright}" stroke-opacity="${q(0.4 + rng() * 0.4)}" stroke-width="1"><line x1="${x - s}" y1="${y}" x2="${x + s}" y2="${y}"/><line x1="${x}" y1="${y - s}" x2="${x}" y2="${y + s}"/></g>`);
  }
  return `<g id="glyphs">${out.join("")}</g>`;
}

// ---------- document assembly ----------
function buildScene(preset, seed) {
  const rng = mulberry32(seed);
  const noise = makeNoise2D(rng);
  const { W, H, glows, sheets, threads, nodes, glyphCfg } = preset;

  const rendered = sheets.map((s, i) => ribbonSheet(rng, noise, s, `${preset.name}-${i}`));
  const sheetGrads = rendered.map((r) => r.grad).join("\n");
  const defs = `<defs>
<radialGradient id="vig" cx="38%" cy="38%" r="85%">
  <stop offset="0%" stop-color="${C.baseB}"/><stop offset="100%" stop-color="${C.baseA}"/>
</radialGradient>
<radialGradient id="halo"><stop offset="0%" stop-color="${C.goldBright}" stop-opacity="0.9"/><stop offset="100%" stop-color="${C.goldBright}" stop-opacity="0"/></radialGradient>
<radialGradient id="glowT"><stop offset="0%" stop-color="${C.teal}" stop-opacity="0.55"/><stop offset="100%" stop-color="${C.teal}" stop-opacity="0"/></radialGradient>
<radialGradient id="glowC"><stop offset="0%" stop-color="${C.crim}" stop-opacity="0.5"/><stop offset="100%" stop-color="${C.crim}" stop-opacity="0"/></radialGradient>
${sheetGrads}
<filter id="blur2" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter>
<filter id="blur6" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="blur60" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="mottle" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="3" stitchTiles="stitch" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.75  0 0 0 0 0.8  0 0 0 0.4 0"/>
</filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"/>
</filter>
</defs>`;

  const glowEls = glows
    .map(([cx, cy, rx, fill]) => `<ellipse cx="${q(cx * W)}" cy="${q(cy * H)}" rx="${q(rx * W)}" ry="${q(rx * W * 0.7)}" fill="${fill}" filter="url(#blur60)"/>`)
    .join("\n");

  const washes = rendered.map((r) => r.wash).join("\n");
  const halos = rendered.map((r) => r.halo).join("\n");
  const bodies = rendered.map((r) => r.body).join("\n");
  const threadPts = threads.map((t) => traceStrand(noise, t, gauss(rng) * t.thickness * 0.3, rng));
  const threadEls = threads.map((t, i) => goldThreads(rng, noise, t, `${preset.name}-t${i}`)).join("\n");
  const net = nodeNetwork(rng, threadPts, nodes);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${preset.name} flow art">
${defs}
<rect width="${W}" height="${H}" fill="url(#vig)"/>
<rect width="${W}" height="${H}" filter="url(#mottle)" opacity="0.05" style="mix-blend-mode:overlay"/>
<g id="glows">${glowEls}</g>
<g id="washes" fill="none">${washes}</g>
<g id="sheet-halos">${halos}</g>
${bodies}
${threadEls}
${net.links}
${net.nodes}
${glyphs(rng, glyphCfg, W, H)}
<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.055" style="mix-blend-mode:overlay"/>
</svg>`;
}

// ---------- presets ----------
const wave = (x0, y0, x1, y1) => ({ x0, y0, x1, y1 });
const base = (W, H) => ({
  W, H,
  glows: [[0.72, 0.42, 0.30, "url(#glowT)"], [0.5, 0.62, 0.24, "url(#glowC)"], [0.82, 0.2, 0.12, "url(#glowT)"]],
  glyphCfg: { wifiCount: 2, sparkCount: 10 },
  nodes: { count: 30, linkRadius: 150 },
});
const heroPreset = {
  name: "hero", ...base(1600, 900),
  sheets: [
    { guide: wave(-80, 1050, 1720, 190), strands: 110, thickness: 330, from: C.crimDeep, to: C.crim, accent: C.crimHot, opacity: 0.17, wobbleJitter: 26, noiseAmp: 30, noiseScale: 0.0016, blur: 2, drift: "slow" },
    { guide: wave(-80, 1150, 1720, 60),  strands: 130, thickness: 420, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.16, wobbleJitter: 26, noiseAmp: 30, noiseScale: 0.0016, blur: 2, drift: "slow" },
    { guide: wave(200, 980, 1680, -60),  strands: 60,  thickness: 150, from: C.tealDeep, to: C.tealBright, accent: C.tealBright, opacity: 0.15, wobbleJitter: 18, noiseAmp: 24, noiseScale: 0.002, drift: "slow" },
  ],
  threads: [
    { guide: wave(-60, 1080, 1700, 120), count: 15, thickness: 200, opacity: 1, wobbleJitter: 20, noiseAmp: 26, noiseScale: 0.0018 },
    { guide: wave(250, 200, 1650, 980),  count: 9,  thickness: 130, opacity: 1, wobbleJitter: 14, noiseAmp: 20, noiseScale: 0.002 },
  ],
};
const reportPreset = {
  name: "report", ...base(1200, 1600),
  glows: [[0.7, 0.3, 0.3, "url(#glowT)"], [0.4, 0.55, 0.26, "url(#glowC)"]],
  sheets: [
    { guide: wave(-80, 1250, 1300, 300), strands: 90, thickness: 300, from: C.crimDeep, to: C.crim, accent: C.crimHot, opacity: 0.16, wobbleJitter: 22, noiseAmp: 28, noiseScale: 0.0018, blur: 2 },
    { guide: wave(-80, 1350, 1300, 150), strands: 100, thickness: 380, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.15, wobbleJitter: 22, noiseAmp: 28, noiseScale: 0.0018 },
  ],
  threads: [
    { guide: wave(-60, 1280, 1280, 220), count: 13, thickness: 180, opacity: 1, wobbleJitter: 18, noiseAmp: 24, noiseScale: 0.002 },
    { guide: wave(150, 350, 1250, 1350), count: 6, thickness: 110, opacity: 1, wobbleJitter: 14, noiseAmp: 20, noiseScale: 0.0022 },
  ],
  glyphCfg: { wifiCount: 2, sparkCount: 8 },
};
const workshopPreset = {
  name: "workshop", ...base(1600, 700),
  glows: [[0.65, 0.5, 0.28, "url(#glowC)"], [0.85, 0.3, 0.2, "url(#glowT)"]],
  sheets: [
    { guide: wave(-80, 800, 1720, 120), strands: 80, thickness: 260, from: C.crimDeep, to: C.crim, accent: C.crimHot, opacity: 0.15, wobbleJitter: 18, noiseAmp: 22, noiseScale: 0.0018, blur: 2 },
    { guide: wave(-80, 880, 1720, -20), strands: 95, thickness: 320, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.15, wobbleJitter: 18, noiseAmp: 22, noiseScale: 0.0018 },
  ],
  threads: [
    { guide: wave(-60, 820, 1700, 60), count: 11, thickness: 150, opacity: 1, wobbleJitter: 16, noiseAmp: 20, noiseScale: 0.002 },
    { guide: wave(200, 120, 1650, 780), count: 6, thickness: 100, opacity: 1, wobbleJitter: 12, noiseAmp: 18, noiseScale: 0.0022 },
  ],
  glyphCfg: { wifiCount: 1, sparkCount: 8 },
};
const footerPreset = {
  name: "footer", ...base(1600, 400),
  glows: [[0.5, 0.8, 0.3, "url(#glowT)"], [0.7, 0.7, 0.22, "url(#glowC)"]],
  glyphCfg: { wifiCount: 1, sparkCount: 6 },
  nodes: { count: 18, linkRadius: 130 },
  sheets: [
    { guide: wave(-80, 520, 1720, 40), strands: 70, thickness: 200, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.14, wobbleJitter: 14, noiseAmp: 18, noiseScale: 0.002, blur: 2 },
  ],
  threads: [
    { guide: wave(-60, 480, 1700, 0), count: 9, thickness: 110, opacity: 1, wobbleJitter: 12, noiseAmp: 16, noiseScale: 0.0022 },
  ],
};

const PRESETS = { hero: heroPreset, report: reportPreset, workshop: workshopPreset, footer: footerPreset };
const SEEDS = { hero: 20260920, report: 20260921, workshop: 20260922, footer: 20260923 };

// ---------- cli ----------
const args = process.argv.slice(2);
const labIdx = args.indexOf("--lab");
const onlyIdx = args.indexOf("--only");

if (labIdx !== -1) {
  const [from, to] = [Number(args[labIdx + 1] ?? 1), Number(args[labIdx + 2] ?? args[labIdx + 1] ?? 9)];
  const outDir = join(ROOT, "public", "art-lab");
  mkdirSync(outDir, { recursive: true });
  for (let i = from; i <= to; i++) {
    writeFileSync(join(outDir, `variant-${i}.svg`), buildScene(heroPreset, 1000 + i * 97));
    console.log(`art-lab/variant-${i}.svg (seed ${1000 + i * 97})`);
  }
  process.exit(0);
}

const targets = onlyIdx !== -1 ? args[onlyIdx + 1].split(",") : Object.keys(PRESETS);
for (const name of targets) {
  const preset = PRESETS[name];
  const out = join(ROOT, "public", "assets", "art", `${name}-flow.svg`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buildScene(preset, SEEDS[name]));
  console.log(`${name}-flow.svg written (seed ${SEEDS[name]})`);
}
