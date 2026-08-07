#!/usr/bin/env node
/**
 * Apply the report masthead to the slides embedded in index.html.
 *
 *   node scripts/align-masthead-srcdoc.mjs          # report
 *   node scripts/align-masthead-srcdoc.mjs --fix    # apply
 *
 * Sixteen of this deck's slides are not files — they live as
 * `srcdoc="<html>…"` attributes inside index.html, which is why
 * align-masthead.mjs (which walks public/slides) never touched them.
 *
 * Those slides use a third header architecture: a white `.brand` strip over a
 * navy `.section` band, inside a `.slide` grid of `36px 56px 1fr 32px`. As
 * with the risk-appetite family, this restyles the band white in place rather
 * than merging rows, so the fixed 720px grid is untouched. The gold rule under
 * `.section` is kept — it is the same gold accent the report masthead uses.
 *
 * CRITICAL: every replacement string here must be free of double quotes.
 * These rules live inside a double-quoted HTML attribute; a single stray `"`
 * terminates it and destroys the slide.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(REPO, 'index.html');
const FIX = process.argv.includes('--fix');

/** [description, pattern, replacement] — replacements must contain no `"`. */
const RULES = [
  [
    'navy .section band -> white, heritage type',
    /\.section\{height:56px;background:#17377f;color:#fff;/g,
    '.section{height:56px;background:#fff;color:var(--ink);',
  ],
  [
    'navy .section-head band -> white, heritage type',
    /\.section-head\{height:56px;background:#17377f;color:#fff;/g,
    '.section-head{height:56px;background:#fff;color:var(--ink);',
  ],
  [
    '.section-head .sub -> muted on a light band',
    /\.section-head \.sub\{font-size:12px;opacity:\.86;color:#fff\}/g,
    '.section-head .sub{font-size:12px;color:var(--muted)}',
  ],
  [
    '.page-marker (no margin-left variant) for a light band',
    /\.page-marker\{font-size:13px;font-weight:700;border-left:1px solid rgba\(255,255,255,\.28\);padding-left:14px\}/g,
    '.page-marker{font-size:13px;font-weight:700;color:var(--ink);border-left:1px solid var(--line);padding-left:14px}',
  ],
  [
    '.page-marker divider and colour for a light band',
    /\.page-marker\{margin-left:auto;font-size:13px;font-weight:700;border-left:1px solid rgba\(255,255,255,\.28\);padding-left:16px\}/g,
    '.page-marker{margin-left:auto;font-size:13px;font-weight:700;color:var(--ink);border-left:1px solid var(--line);padding-left:16px}',
  ],
  [
    'gold triangle -> gold rule, wordmark to report weight',
    /\.logo:after\{content:'';display:inline-block;margin-left:10px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:18px solid var\(--gold\);transform:skewX\(-15deg\) translateY\(3px\)\}/g,
    // JS double-quoted so the CSS can carry single quotes; the emitted string
    // contains no double quote, which the guard below re-checks.
    ".logo{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:800;color:var(--ink)}"
    + ".logo:before{content:'';width:4px;height:24px;border-radius:2px;background:var(--gold)}",
  ],
];

const text = readFileSync(INDEX, 'utf8');
let out = text;
let applied = 0;

for (const [label, pattern, replacement] of RULES) {
  if (replacement.includes('"')) {
    console.error(`REFUSING: replacement for "${label}" contains a double quote, which would break srcdoc.`);
    process.exit(1);
  }
  const hits = (out.match(pattern) ?? []).length;
  console.log(`  ${hits === 0 ? 'none ' : FIX ? 'fix  ' : 'would'}  ${String(hits).padStart(2)}x  ${label}`);
  if (hits && FIX) { out = out.replace(pattern, replacement); applied += hits; }
}

if (!FIX) { console.log('\n(report only — re-run with --fix)\n'); process.exit(0); }

writeFileSync(INDEX, out, 'utf8');

/* Re-verify every embedded document still parses as a whole HTML file. */
const re = /<iframe[^>]*?id="frame-([a-z0-9]+)"[^>]*?srcdoc="([\s\S]*?)"><\/iframe>/g;
let m; let ok = 0; const bad = [];
while ((m = re.exec(out))) {
  const doc = m[2].trim();
  if (/^<!doctype html>/i.test(doc) && /<\/html>$/i.test(doc)) ok += 1; else bad.push(m[1]);
}
console.log(`\napplied ${applied} replacement(s); ${ok} srcdoc slides well-formed`
  + (bad.length ? `, MALFORMED: ${bad.join(', ')}` : ''));
if (bad.length) process.exit(1);
