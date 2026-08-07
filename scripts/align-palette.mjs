#!/usr/bin/env node
/**
 * Normalise each slide's `:root` semantic colour variables to the canonical
 * Standard Life palette.
 *
 *   node scripts/align-palette.mjs          # report
 *   node scripts/align-palette.mjs --fix    # apply
 *
 * Why
 * ---
 * The deck grew three different definitions of red, green, gold and ink:
 *
 *   risk-appetite ×4      already canonical
 *   v2/v3/v4 + unified    ink #1B2A63  gold #F5B81D  red #C0334A  green #1A7A5E
 *   v5 ×2                 ink #162E67  gold #E2A321  red #CA3F58  green #1D8065
 *
 * Because almost every bar, chip, border and label resolves through these
 * variables, correcting them here brings the bulk of the deck onto the report
 * palette in one move — far more leverage than chasing individual literals.
 *
 * Mapping is by semantic intent, not nearest colour: `--amber` shades RAG bar
 * segments and status borders, a role the reports paint with brand gold
 * (#FFBB00), so it lands there alongside `--gold` rather than on the theme's
 * dark-yellow data colour (#DE4721), which serves a different purpose.
 *
 * Variables already holding a canonical value (--line #E2E8F2, --soft #E6ECF5,
 * --green-soft #E3F3EF, --bg #EDF1F7) are left untouched.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SLIDES = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'slides');
const FIX = process.argv.includes('--fix');

/** Semantic variable -> canonical hex. */
const CANONICAL = {
  ink: '#0a2f73',
  navy: '#0a2f73',
  'navy-deep': '#07235a',
  body: '#1f3458',
  muted: '#5b6b83',
  gold: '#ffbb00',
  amber: '#ffbb00',
  red: '#ca3f4c',
  green: '#006b5c',
  blue: '#2140ce',
  purple: '#681a38',
  'red-soft': '#fde2e4',
  line: '#d8e0ec',
};

/**
 * Never rewrite a value that is already a brand colour.
 *
 * Variable names do not mean the same thing in every slide family: the
 * risk-appetite slides use `--blue` for the heritage primary (#0A2F73) and
 * `--amber` for the theme's dark yellow (#DE4721), both canonical. Mapping
 * purely by name would "correct" those into vivid blue and gold and break
 * the one family that was already right. Only off-palette values are touched.
 */
const BRAND = new Set([
  '#0a2f73', '#17377f', '#2140ce', '#07235a', '#ffbb00', '#ffffb9', '#006b5c',
  '#02be98', '#9ae5d6', '#ca3f4c', '#fa6166', '#681a38', '#de4721', '#8f6200',
  '#1f3458', '#5b6b83', '#8294ae', '#69778c', '#d8e0ec', '#f7f9fc', '#f8fbff',
  '#edf1f7', '#e6ecf5', '#e2e8f2', '#dce4f0', '#eef2fb', '#c9d6ee', '#9fb2d8',
  '#fde2e4', '#f0a3aa', '#fff4d1', '#efd273', '#e6f5f1', '#8fd4bf', '#e3f3ef',
  '#ffffff', '#fff', '#000000',
]);

let totalChanged = 0;

for (const file of readdirSync(SLIDES).filter((f) => f.endsWith('.html'))) {
  const path = join(SLIDES, file);
  const text = readFileSync(path, 'utf8');
  const edits = [];

  let out = text.replace(
    /--([a-z-]+)\s*:\s*(#[0-9A-Fa-f]{3,6})/g,
    (match, name, value) => {
      const want = CANONICAL[name];
      if (!want) return match;
      const have = value.toLowerCase();
      if (have === want || BRAND.has(have)) return match;
      edits.push(`--${name} ${have} -> ${want}`);
      return `--${name}:${want}`;
    },
  );

  if (!edits.length) { console.log(`  ok    ${file}  (already canonical)`); continue; }

  console.log(`  ${FIX ? 'fix ' : 'would'}  ${file}`);
  edits.forEach((e) => console.log(`          ${e}`));
  if (FIX) { writeFileSync(path, out, 'utf8'); totalChanged += 1; }
}

console.log(FIX ? `\n${totalChanged} slide(s) normalised\n` : '\n(report only — re-run with --fix)\n');
