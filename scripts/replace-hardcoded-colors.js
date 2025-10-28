#!/usr/bin/env node
/**
 * Replace hard-coded color literals with OKLCH palette tokens or inline OKLCH.
 * - Maps brand/neutral hexes to Tailwind v4 color tokens (bg-primary-600, text-neutral-800, etc.)
 * - Converts unmatched color literals to oklch(l c h / a) inline to avoid hex/hsl/rgba
 * - Preserves alpha for rgba/hsla
 *
 * Safe-by-default: Only changes files under src/** by default.
 */

const fs = require('fs');
const path = require('path');
const { globby } = require('globby');
const { converter, parse } = require('culori');

const ROOT = process.cwd();
const SRC_GLOB = ['src/**/*.{ts,tsx,js,jsx,css}'];

// Palette triples must match globals.css
const TOKENS = {
  primary: {
    50: [0.98, 0.02, 215],
    100: [0.96, 0.03, 215],
    200: [0.92, 0.05, 215],
    300: [0.86, 0.07, 215],
    400: [0.78, 0.09, 215],
    500: [0.72, 0.10, 215],
    600: [0.66, 0.11, 215],
    700: [0.58, 0.11, 215],
    800: [0.50, 0.10, 215],
    900: [0.42, 0.08, 215],
  },
  secondary: {
    50: [0.98, 0.01, 250],
    100: [0.95, 0.01, 250],
    200: [0.90, 0.01, 250],
    300: [0.82, 0.01, 250],
    400: [0.72, 0.01, 250],
    500: [0.62, 0.01, 250],
    600: [0.52, 0.01, 250],
    700: [0.44, 0.01, 250],
    800: [0.36, 0.01, 250],
    900: [0.28, 0.01, 250],
  },
  neutral: {
    50: [0.99, 0.0, 0],
    100: [0.97, 0.0, 0],
    200: [0.92, 0.0, 0],
    300: [0.86, 0.0, 0],
    400: [0.72, 0.0, 0],
    500: [0.62, 0.0, 0],
    600: [0.52, 0.0, 0],
    700: [0.44, 0.0, 0],
    800: [0.34, 0.0, 0],
    900: [0.24, 0.0, 0],
  },
};

const BRAND_MAP = new Map([
  ['#078fa5', { token: 'primary-600' }],
  ['#065a6b', { token: 'primary-700' }],
  ['#2d3748', { token: 'secondary-600' }],
  ['#4a5568', { token: 'secondary-500' }],
  ['#e2e8f0', { token: 'neutral-200' }],
  ['#1a202c', { token: 'secondary-700' }],
  ['#718096', { token: 'neutral-600' }],
  ['#edf2f7', { token: 'neutral-100' }],
  ['#fafafa', { token: 'neutral-50' }],
  ['#d1d5db', { token: 'neutral-300' }],
  ['#f9fafb', { token: 'neutral-50' }],
  ['#6b7280', { token: 'neutral-700' }],
  ['#94a3b8', { token: 'neutral-400' }],
  ['#111827', { token: 'neutral-900' }],
  ['#e5e7eb', { token: 'neutral-200' }],
]);

const toOKLCH = converter('oklch');

/** Compute distance in OKLCH */
function dist(a, b) {
  const dl = a.l - b.l;
  const dc = (a.c || 0) - (b.c || 0);
  // Hue distance on circle
  const ha = (a.h || 0);
  const hb = (b.h || 0);
  let dh = Math.abs(ha - hb);
  if (dh > 180) dh = 360 - dh;
  // Weight hue distance by chroma so neutrals don't skew
  const hueWeight = Math.max(a.c || 0, b.c || 0);
  return Math.sqrt(dl*dl + dc*dc + (hueWeight * (dh/180))**2);
}

function nearestToken(ok) {
  let best = { name: null, d: Infinity };
  const families = Object.entries(TOKENS);
  for (const [family, scale] of families) {
    for (const [step, triple] of Object.entries(scale)) {
      const cand = { l: triple[0], c: triple[1], h: triple[2] };
      const d = dist(ok, cand);
      if (d < best.d) best = { name: `${family}-${step}`, d };
    }
  }
  return best; // includes distance for optional thresholding
}

function colorLiteralToOKLCH(literal) {
  try {
    const parsed = parse(literal);
    if (!parsed) return null;
    const ok = toOKLCH(parsed);
    if (!ok) return null;
    const a = typeof parsed.alpha === 'number' ? parsed.alpha : 1;
    const l = +(ok.l || 0).toFixed(4);
    const c = +(ok.c || 0).toFixed(4);
    const h = +(ok.h || 0).toFixed(2);
    return { l, c, h, a };
  } catch {
    return null;
  }
}

function oklchString({ l, c, h, a = 1 }) {
  // Use percentages for L to be explicit
  const L = (l <= 1 ? `${(l*100).toFixed(2)}%` : `${l}`);
  return `oklch(${L} ${c} ${h}${a !== 1 ? ` / ${a}` : ''})`;
}

function replaceInClasses(source) {
  // Replace arbitrary color classes like bg-[#xxxxxx] or text-[rgb(...)]
  return source.replace(/(bg|text|border|ring|fill|stroke|outline|decoration|from|via|to)-\[(#?[a-zA-Z0-9(),. %]+)\]/g, (m, util, value) => {
    const lower = value.toLowerCase();
    if (lower.startsWith('#') && BRAND_MAP.has(lower)) {
      const { token } = BRAND_MAP.get(lower);
      return `${util}-${token}`;
    }
    // Convert to inline oklch
    const ok = colorLiteralToOKLCH(value);
    if (ok) {
      return `${util}-[${oklchString(ok)}]`;
    }
    return m; // fallback if parse failed
  });
}

function replaceInStyles(source) {
  // Replace style={{ color: '#xxxxxx' }} or 'color: "#xxxxxx"'
  return source
    // JS/TSX style objects
    .replace(/(['"])#([0-9a-fA-F]{3,8})(['"])/g, (m, q1, hex, q2) => {
      const lit = `#${hex}`;
      const key = lit.toLowerCase();
      if (BRAND_MAP.has(key)) {
        const { token } = BRAND_MAP.get(key);
        return `${q1}var(--color-${token})${q2}`;
      }
      const ok = colorLiteralToOKLCH(lit);
      if (!ok) return m;
      return `${q1}${oklchString(ok)}${q2}`;
    })
    // CSS blocks inside files
    .replace(/:\s*#([0-9a-fA-F]{3,8})/g, (m, hex) => {
      const lit = `#${hex}`;
      const key = lit.toLowerCase();
      if (BRAND_MAP.has(key)) {
        const { token } = BRAND_MAP.get(key);
        return `: var(--color-${token})`;
      }
      const ok = colorLiteralToOKLCH(lit);
      if (!ok) return m;
      return `: ${oklchString(ok)}`;
    })
    // rgba()/hsl() etc in styles
    .replace(/(rgba?|hsla?)\([^\)]+\)/g, (m) => {
      const ok = colorLiteralToOKLCH(m);
      if (!ok) return m;
      return oklchString(ok);
    })
    // rgba(r,g,b, ${alphaVar}) with template alpha -> preserve ${...}
    .replace(/rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\$\{[^}]+\})\s*\)/g, (m, r, g, b, alphaTpl) => {
      const rgb = `rgb(${r}, ${g}, ${b})`;
      const ok = colorLiteralToOKLCH(rgb);
      if (!ok) return m;
      const { l, c, h } = ok;
      const L = (l <= 1 ? `${(l*100).toFixed(2)}%` : `${l}`);
      return `oklch(${L} ${c} ${h} / ${alphaTpl})`;
    });
}

function replaceBrandHexes(source) {
  // Replace brand hexes in classes that aren't arbitrary brackets (e.g., focus:ring-[#078FA5]) is handled above.
  // This handles plain text occurrences of brand hex literals in strings and CSS.
  for (const [hex, { token }] of BRAND_MAP.entries()) {
    const re = new RegExp(hex, 'gi');
    source = source.replace(re, (m) => `var(--color-${token})`);
  }
  return source;
}

function replaceLooseHex(source) {
  // Replace any remaining hex literals with inline OKLCH to eliminate hex usage
  return source.replace(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g, (m) => {
    const key = m.toLowerCase();
    if (BRAND_MAP.has(key)) return `var(--color-${BRAND_MAP.get(key).token})`;
    const ok = colorLiteralToOKLCH(m);
    if (!ok) return m;
    return oklchString(ok);
  });
}

async function run() {
  const paths = await globby(SRC_GLOB, { cwd: ROOT, absolute: true });
  let changed = 0;
  for (const fp of paths) {
    const orig = fs.readFileSync(fp, 'utf8');
    let next = orig;
    next = replaceInClasses(next);
    next = replaceInStyles(next);
  next = replaceBrandHexes(next);
  next = replaceLooseHex(next);
    if (next !== orig) {
      fs.writeFileSync(fp, next, 'utf8');
      changed++;
      console.log(`Updated colors in: ${path.relative(ROOT, fp)}`);
    }
  }
  console.log(`Color migration complete. Files changed: ${changed}`);
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
