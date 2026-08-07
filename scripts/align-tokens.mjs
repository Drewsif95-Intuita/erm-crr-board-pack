#!/usr/bin/env node
/**
 * Design-token alignment for the CRR board pack.
 *
 *   node scripts/align-tokens.mjs            # report only
 *   node scripts/align-tokens.mjs --fix      # collapse near-duplicate colours + set the font
 *   CRR_THEME=<path to StandardLifeBoard-*.json> node scripts/align-tokens.mjs
 *
 * Why this exists
 * ---------------
 * The board pack, the CRR_DeepDive React prototype and the Power BI reports all
 * draw on the same Standard Life palette, but each kept its own copy. The copies
 * drifted: the deck accumulated a set of colours a hair away from the canonical
 * ones (#F6F8FB vs #F7F9FC, #D7DEE8 vs #D8E0EC, ...) that are indistinguishable
 * on screen but make the three sources look inconsistent when compared as text.
 *
 * docs/design-tokens.json is the single source of truth. This script measures
 * every hex literal in the deck against it in CIELAB, collapses the ones that
 * are perceptually identical, and reports the ones that are genuinely different
 * so a human decides rather than a regex.
 *
 * It deliberately does NOT touch layout, geometry or the 16:9 slide format —
 * those are the board pack's archetype, not drift.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const FIX = process.argv.includes('--fix');

/**
 * Collapse anything at or below this CIELAB distance; report anything above.
 *
 * Default 2.0 is the just-noticeable-difference threshold — below it the two
 * colours are indistinguishable to the eye, so collapsing is provably safe.
 * Raise it deliberately (`--threshold 3`) to sweep up more of the drift once
 * someone has eyeballed the tier report.
 */
const thresholdArg = process.argv.indexOf('--threshold');
const COLLAPSE_THRESHOLD = thresholdArg > -1 ? Number(process.argv[thresholdArg + 1]) : 2;

/* ----------------------------------------------------------------- colour --- */

const srgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function lab(hex) {
  const [r, g, b] = srgb(hex.toUpperCase()).map(linear);
  let x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  let y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [x, y, z] = [f(x), f(y), f(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

const deltaE = (a, b) => {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

/* ------------------------------------------------------------- canonical --- */

const tokens = JSON.parse(readFileSync(join(REPO, 'docs', 'design-tokens.json'), 'utf8'));

/** Flatten every hex in the token file into name -> hex. */
function canonicalPalette() {
  const out = {};
  Object.entries(tokens.colors).forEach(([k, v]) => { out[k] = v.toUpperCase(); });
  Object.entries(tokens.rag).forEach(([state, roles]) => {
    Object.entries(roles).forEach(([role, v]) => { out[`rag.${state}.${role}`] = v.toUpperCase(); });
  });
  return out;
}

const CANON = canonicalPalette();
const CANON_HEXES = new Set(Object.values(CANON));

/* ---------------------------------------------------------------- theme ---- */

/**
 * The Power BI theme is the ultimate authority for the shared colours, because
 * it is what the reports actually render from. Verify the token file agrees.
 */
function verifyAgainstTheme() {
  const themePath = process.env.CRR_THEME;
  if (!themePath) return null;
  if (!existsSync(themePath)) {
    console.log(`\ntheme check skipped — CRR_THEME not found at ${themePath}`);
    return null;
  }
  const theme = JSON.parse(readFileSync(themePath, 'utf8'));
  const roles = {
    heritageBlue: theme.foreground,
    ink2: theme.foregroundNeutralSecondary,
    muted: theme.foregroundNeutralTertiary,
    white: theme.background,
    panelSoft: theme.backgroundLight,
    line: theme.backgroundNeutral,
    coreTeal: theme.good,
    heritageYellow: theme.neutral,
    coreCoral: theme.bad,
    darkCoral: theme.maximum,
    vibrantTeal: theme.minimum,
    vibrantBlue: theme.hyperlink,
  };

  const problems = [];
  Object.entries(roles).forEach(([token, themeHex]) => {
    if (!themeHex) return;
    const ours = CANON[token];
    if (!ours) { problems.push(`  token "${token}" missing from design-tokens.json (theme has ${themeHex})`); return; }
    if (ours !== themeHex.toUpperCase()) {
      problems.push(`  ${token}: tokens say ${ours}, PBI theme says ${themeHex.toUpperCase()}`);
    }
  });

  console.log(`\nPBI theme check (${basename(themePath)})`);
  console.log(problems.length ? problems.join('\n') : '  ok — every shared colour matches the report theme');
  return problems.length === 0;
}

/* ----------------------------------------------------------------- files --- */

/** node:fs globSync needs Node 22; this repo runs on 20. */
const htmlIn = (...parts) => {
  const dir = join(REPO, ...parts);
  return existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => join(dir, f))
    : [];
};

const targets = [
  join(REPO, 'index.html'),
  ...htmlIn('public', 'slides'),
  ...htmlIn('public', 'powerapp'),
].filter(existsSync);

const rel = (p) => p.slice(REPO.length + 1).replace(/\\/g, '/');

/* ------------------------------------------------------------------ font --- */

const FONT_STACK = tokens.font.body;
const MONO_STACK = tokens.font.mono;
/** Any Aptos-led body stack, however it is spaced or quoted. */
const APTOS_STACK = /Aptos\s*,\s*["']?Segoe UI["']?\s*,\s*Arial\s*,\s*sans-serif/gi;
/** The matching monospace stack, which is a separate token. */
const APTOS_MONO = /["']?Aptos Mono["']?\s*,\s*["']?Cascadia Mono["']?\s*,\s*Consolas\s*,\s*monospace/gi;

/* ------------------------------------------------------------------ main --- */

verifyAgainstTheme();

const drift = new Map(); // hex -> { count, files:Set, nearest, dE }
let fontHits = 0;

for (const file of targets) {
  const text = readFileSync(file, 'utf8');

  fontHits += (text.match(APTOS_STACK) ?? []).length + (text.match(APTOS_MONO) ?? []).length;

  for (const m of text.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
    const hex = m[0].toUpperCase();
    if (CANON_HEXES.has(hex)) continue;
    if (!drift.has(hex)) {
      let nearest = null;
      for (const [name, c] of Object.entries(CANON)) {
        const d = deltaE(hex, c);
        if (!nearest || d < nearest.d) nearest = { name, hex: c, d };
      }
      drift.set(hex, { count: 0, files: new Set(), nearest });
    }
    const rec = drift.get(hex);
    rec.count += 1;
    rec.files.add(rel(file));
  }
}

const sorted = [...drift.entries()].sort((a, b) => a[1].nearest.d - b[1].nearest.d);
const collapsible = sorted.filter(([, r]) => r.nearest.d <= COLLAPSE_THRESHOLD);
const distinct = sorted.filter(([, r]) => r.nearest.d > COLLAPSE_THRESHOLD);

console.log(`\nFont: ${fontHits} Aptos-led stack(s) -> "${FONT_STACK}"`);

/* Tier the drift by perceptibility so the size of each decision is visible. */
const TIERS = [
  [0, 2, 'invisible        — indistinguishable to the eye, safe to collapse'],
  [2, 3.5, 'barely visible   — same colour, a shade off'],
  [3.5, 6, 'noticeable       — clearly the same family, visibly different'],
  [6, Infinity, 'distinct         — a different colour, decide by hand'],
];

console.log('\nOff-palette colour drift, by perceptibility');
for (const [lo, hi, label] of TIERS) {
  const band = sorted.filter(([, r]) => r.nearest.d >= lo && r.nearest.d < hi);
  const uses = band.reduce((a, [, r]) => a + r.count, 0);
  const range = hi === Infinity ? `dE >= ${lo}` : `dE ${lo}-${hi}`;
  console.log(`  ${range.padEnd(11)} ${label}  ${String(band.length).padStart(3)} colours, ${String(uses).padStart(4)} uses`);
}
console.log(`  ---> collapsing at dE <= ${COLLAPSE_THRESHOLD}: `
  + `${collapsible.length} colours, ${collapsible.reduce((a, [, r]) => a + r.count, 0)} uses`);

const SHOW = 12;
console.log(`\nLargest remaining after the collapse (top ${SHOW} by usage)`);
distinct
  .slice()
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, SHOW)
  .forEach(([hex, r]) => {
    console.log(`  ${hex} x${String(r.count).padStart(3)}  nearest ${r.nearest.hex} (${r.nearest.name}) dE=${r.nearest.d.toFixed(1)}`);
  });

if (!FIX) {
  console.log('\n(report only — re-run with --fix to apply)\n');
  process.exit(0);
}

const replacements = new Map(collapsible.map(([hex, r]) => [hex, r.nearest.hex]));
let filesChanged = 0;
let colourEdits = 0;
let fontEdits = 0;

for (const file of targets) {
  const before = readFileSync(file, 'utf8');
  let after = before.replace(APTOS_STACK, FONT_STACK).replace(APTOS_MONO, MONO_STACK);
  fontEdits += (before.match(APTOS_STACK) ?? []).length + (before.match(APTOS_MONO) ?? []).length;

  after = after.replace(/#[0-9A-Fa-f]{6}\b/g, (hex) => {
    const to = replacements.get(hex.toUpperCase());
    if (!to) return hex;
    colourEdits += 1;
    // Preserve the surrounding case convention of the file (these files use lowercase).
    return hex === hex.toLowerCase() ? to.toLowerCase() : to;
  });

  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    filesChanged += 1;
  }
}

console.log(`\napplied: ${fontEdits} font stack(s), ${colourEdits} colour literal(s), across ${filesChanged} file(s)\n`);
