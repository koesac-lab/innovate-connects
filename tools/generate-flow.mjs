#!/usr/bin/env node
// Innovate Connects — layered "flow" art generator
// Procedural layering: base vignette -> glow -> ribbon sheets -> gold threads
// -> node network -> glyphs -> grain. Seeded so renders are reproducible.
//
// Usage:
//   node tools/generate-flow.mjs            # renders the 4 committed art assets
//   node tools/generate-flow.mjs --lab 1 9  # renders public/art-lab/variant-{1..9}.svg
//   node tools/generate-flow.mjs --only hero,footer

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

// ---------- geometry helpers ----------
const q = (n) => Math.round(n * 10) / 10;

const sCurve = (t, { x0, y0, x1, y1, lift = 0.35, sag = 0.18 }) => {
  const shaped = t * t * (3 - 2 * t);
  const xt = x0 + (x1 - x0) * t;
  const mid = y0 + (y1 - y0) * shaped;
  const billow = Math.sin(t * Math.PI) * (y1 - y0) * -sag;
  return [xt, mid + billow - lift * Math.sin(t * Math.PI) * (y0 - y1) * 0.25];
};

const traceStrand = (noise, cfg, bandOffset, spread, rng) => {
  const pts = [];
  const n = cfg.segmentCount ?? 90;
  const wob = (rng() - 0.5) * cfg.wobbleJitter;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [gx, gy] = sCurve(t, cfg.guide);
    const nScale = cfg.noiseScale;
    const wobble =
      (fbm(noise, gx * nScale + bandOffset * 0.01, gy * nScale) - 0.5) *
      cfg.noiseAmp * (0.4 + 0.6 * Math.sin(t * Math.PI));
    const y = gy + bandOffset * spread + wobble + wob;
    pts.push([q(gx), q(y)]);
  }
  return pts;
};

const pathFrom = (pts) =>
  "M" + pts[0][0] + "," + pts[0][1] +
  pts.slice(1).map(([x, y]) => "L" + x + "," + y).join("");

// ---------- layer builders ----------
const lerpHex = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

function ribbonSheet(rng, noise, sheet, uid) {
  const id = `g-${uid}`;
  const paths = [];
  for (let s = 0; s < sheet.strands; s++) {
    const bandOffset = (s - sheet.strands / 2) * (sheet.thickness / sheet.strands) + (rng() - 0.5) * 3;
    const pts = traceStrand(noise, sheet, bandOffset, 1, rng);
    const fadeIn = Math.sin((s / sheet.strands) * Math.PI);
    const opacity = q(Math.min(0.28, sheet.opacity * (0.35 + 0.65 * fadeIn) * (0.6 + rng() * 0.8)));
    const w = q(0.5 + rng() * 0.9);
    const colourMix = rng();
    const stroke = colourMix < 0.12 ? sheet.accent : lerpHex(sheet.from, sheet.to, rng());
    paths.push(
      `<path d="${pathFrom(pts)}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${w}"/>`
    );
  }
  const wash = `<path d="${pathFrom(traceStrand(noise, sheet, 0, 1, rng))}" stroke="${sheet.from}" stroke-opacity="0.10" stroke-width="${q(sheet.thickness * 1.6)}" stroke-linecap="round"/>`;
  return {
    wash,
    body:
      `<g id="${id}" fill="none" stroke-linecap="round"` +
      (sheet.drift ? ` class="drift drift-${uid}"` : "") +
      `>\n${paths.join("\n")}\n</g>`,
  };
}

function goldThreads(rng, noise, cfg, uid) {
  const paths = [];
  for (let i = 0; i < cfg.count; i++) {
    const offset = (rng() - 0.5) * cfg.thickness * 1.6;
    const pts = traceStrand(noise, cfg, offset, 1, rng);
    const opacity = q(0.35 + rng() * 0.5);
    const w = q(0.8 + rng() * 1.2);
    const stroke = rng() < 0.3 ? C.goldBright : C.gold;
    paths.push(`<path d="${pathFrom(pts)}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${w}"/>`);
  }
  return `<g id="gold-${uid}" fill="none" stroke-linecap="round">\n${paths.join("\n")}\n</g>`;
}

function nodeNetwork(rng, threads, cfg) {
  if (!threads?.length) return { links: "", nodes: "" };
  const flat = threads.map((pts) => pts[Math.floor(rng() * pts.length)]);
  const pts = [];
  for (let i = 0; i < cfg.count && flat.length; i++) pts.push(flat[Math.floor(rng() * flat.length)]);
  const links = [], dots = [], halos = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
      if (Math.hypot(dx, dy) < cfg.linkRadius) {
        links.push(`<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}"/>`);
      }
    }
    const r = q(2 + rng() * 3.5);
    halos.push(`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${q(r * 4)}" fill="url(#halo)" opacity="0.5"/>`);
    dots.push(`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${r}" fill="${C.goldBright}"/>`);
  }
  return {
    links: `<g stroke="${C.gold}" stroke-opacity="0.35" stroke-width="0.6">${links.join("")}</g>`,
    nodes: `<g>${halos.join("")}${dots.join("")}</g>`,
  };
}

function wifiGlyph(x, y, s, rot) {
  const arcs = [0.35, 0.65, 0.95]
    .map((r) => {
      const R = q(s * r), o = q(s * 0.28);
      return `<path d="M${q(x - R)},${q(y)} A${R},${R} 0 0 1 ${q(x + R)},${q(y)}" transform="rotate(${rot} ${x} ${y - o})" />`;
    })
    .join("");
  return `<g fill="none" stroke="${C.gold}" stroke-width="${q(s * 0.09)}" stroke-linecap="round" stroke-opacity="0.8">${arcs}<circle cx="${x}" cy="${q(y)}" r="${q(s * 0.07)}" fill="${C.goldBright}" stroke="none"/></g>`;
}

function glyphs(rng, cfg, W, H) {
  const out = [];
  for (let i = 0; i < cfg.wifiCount; i++) {
    out.push(wifiGlyph(q(W * (0.55 + rng() * 0.4)), q(H * (0.15 + rng() * 0.5)), q(34 + rng() * 30), q(-15 - rng() * 20)));
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

  const defs = `<defs>
<radialGradient id="vig" cx="38%" cy="38%" r="85%">
  <stop offset="0%" stop-color="${C.baseB}"/><stop offset="100%" stop-color="${C.baseA}"/>
</radialGradient>
<radialGradient id="halo"><stop offset="0%" stop-color="${C.goldBright}" stop-opacity="0.9"/><stop offset="100%" stop-color="${C.goldBright}" stop-opacity="0"/></radialGradient>
<radialGradient id="glowT"><stop offset="0%" stop-color="${C.teal}" stop-opacity="0.55"/><stop offset="100%" stop-color="${C.teal}" stop-opacity="0"/></radialGradient>
<radialGradient id="glowC"><stop offset="0%" stop-color="${C.crim}" stop-opacity="0.5"/><stop offset="100%" stop-color="${C.crim}" stop-opacity="0"/></radialGradient>
<filter id="blur60" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="60"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"/>
</filter>
</defs>`;

  const glowEls = glows
    .map(([cx, cy, rx, fill]) => `<ellipse cx="${q(cx * W)}" cy="${q(cy * H)}" rx="${q(rx * W)}" ry="${q(rx * W * 0.7)}" fill="${fill}" filter="url(#blur60)"/>`)
    .join("\n");

  const rendered = sheets.map((s, i) => ribbonSheet(rng, noise, s, `${preset.name}-${i}`));
  const washes = rendered.map((r) => r.wash).join("\n");
  const bodies = rendered.map((r) => r.body).join("\n");
  const threadPts = threads.map((t) => traceStrand(noise, t, 0, 1, rng));
  const threadEls = threads.map((t, i) => goldThreads(rng, noise, t, `${preset.name}-t${i}`)).join("\n");
  const net = nodeNetwork(rng, threadPts, nodes);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${preset.name} flow art">
${defs}
<rect width="${W}" height="${H}" fill="url(#vig)"/>
<g id="glows">${glowEls}</g>
<g id="washes" fill="none">${washes}</g>
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
  nodes: { count: 32, linkRadius: 150 },
});
const heroPreset = {
  name: "hero", ...base(1600, 900),
  sheets: [
    { guide: wave(-80, 1050, 1720, 190), strands: 110, thickness: 330, from: C.crimDeep, to: C.crim, accent: C.crimHot, opacity: 0.16, wobbleJitter: 26, noiseAmp: 30, noiseScale: 0.0016, drift: "slow" },
    { guide: wave(-80, 1150, 1720, 60),  strands: 130, thickness: 420, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.15, wobbleJitter: 26, noiseAmp: 30, noiseScale: 0.0016, drift: "slow" },
    { guide: wave(200, 980, 1680, -60),  strands: 60,  thickness: 150, from: C.tealDeep, to: C.tealBright, accent: C.tealBright, opacity: 0.14, wobbleJitter: 18, noiseAmp: 24, noiseScale: 0.002, drift: "slow" },
  ],
  threads: [
    { guide: wave(-60, 1080, 1700, 120), count: 14, thickness: 200, opacity: 1, wobbleJitter: 20, noiseAmp: 26, noiseScale: 0.0018 },
    { guide: wave(300, 900, 1700, -40),  count: 8,  thickness: 120, opacity: 1, wobbleJitter: 14, noiseAmp: 20, noiseScale: 0.002 },
  ],
};
const reportPreset = {
  name: "report", ...base(1200, 1600),
  glows: [[0.7, 0.3, 0.3, "url(#glowT)"], [0.4, 0.55, 0.26, "url(#glowC)"]],
  sheets: [
    { guide: wave(-80, 1250, 1300, 300), strands: 90, thickness: 300, from: C.crimDeep, to: C.crim, accent: C.crimHot, opacity: 0.15, wobbleJitter: 22, noiseAmp: 28, noiseScale: 0.0018 },
    { guide: wave(-80, 1350, 1300, 150), strands: 100, thickness: 380, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.14, wobbleJitter: 22, noiseAmp: 28, noiseScale: 0.0018 },
  ],
  threads: [{ guide: wave(-60, 1280, 1280, 220), count: 12, thickness: 180, opacity: 1, wobbleJitter: 18, noiseAmp: 24, noiseScale: 0.002 }],
  glyphCfg: { wifiCount: 2, sparkCount: 8 },
};
const workshopPreset = {
  name: "workshop", ...base(1600, 700),
  glows: [[0.65, 0.5, 0.28, "url(#glowC)"], [0.85, 0.3, 0.2, "url(#glowT)"]],
  sheets: [
    { guide: wave(-80, 800, 1720, 120), strands: 80, thickness: 260, from: C.crimDeep, to: C.crim, accent: C.crimHot, opacity: 0.14, wobbleJitter: 18, noiseAmp: 22, noiseScale: 0.0018 },
    { guide: wave(-80, 880, 1720, -20), strands: 95, thickness: 320, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.14, wobbleJitter: 18, noiseAmp: 22, noiseScale: 0.0018 },
  ],
  threads: [{ guide: wave(-60, 820, 1700, 60), count: 10, thickness: 150, opacity: 1, wobbleJitter: 16, noiseAmp: 20, noiseScale: 0.002 }],
  glyphCfg: { wifiCount: 1, sparkCount: 8 },
};
const footerPreset = {
  name: "footer", ...base(1600, 400),
  glows: [[0.5, 0.8, 0.3, "url(#glowT)"], [0.7, 0.7, 0.22, "url(#glowC)"]],
  glyphCfg: { wifiCount: 1, sparkCount: 6 },
  nodes: { count: 18, linkRadius: 130 },
  sheets: [
    { guide: wave(-80, 520, 1720, 40), strands: 70, thickness: 200, from: C.tealDeep, to: C.teal, accent: C.tealBright, opacity: 0.13, wobbleJitter: 14, noiseAmp: 18, noiseScale: 0.002 },
  ],
  threads: [{ guide: wave(-60, 480, 1700, 0), count: 8, thickness: 110, opacity: 1, wobbleJitter: 12, noiseAmp: 16, noiseScale: 0.0022 }],
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
