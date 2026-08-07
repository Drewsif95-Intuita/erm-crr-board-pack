#!/usr/bin/env node
/**
 * Give every board pack slide the CRR report masthead.
 *
 *   node scripts/align-masthead.mjs          # report what would change
 *   node scripts/align-masthead.mjs --fix    # apply
 *
 * The reports open with a white band carrying a gold rule, the Standard Life
 * wordmark, a small-caps eyebrow and a heritage-blue title. The deck opened
 * with a thin white brand strip above a navy title band. This replaces the
 * latter with the former.
 *
 * The critical invariant is height: each slide is a fixed 720px grid, so the
 * merged masthead must occupy exactly what the two bands it replaces did, or
 * the body grid reflows and content clips. Each pattern below preserves it.
 *
 * Two slide families, plus one deliberate exclusion:
 *   A  executive-summary-*  .brandbar (20px) + header (50|56px)
 *   B  risk-appetite*       .brand (36px) + .head (68px), inside a .slide grid
 *   -  appendix-header      a section divider / title card, not a content
 *                           slide; it has no header band to convert and its
 *                           full-bleed treatment is intentional.
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SLIDES = resolve(HERE, '..', 'public', 'slides');
const FIX = process.argv.includes('--fix');

const EYEBROW = 'Enterprise Risk Management &middot; Board Pack';

/* ---------------------------------------------------------------- pattern A */

/** CSS for the merged masthead. `h` is the total height being preserved. */
const mastheadCssA = (h) => `  /* Masthead — CRR report signature (white band, gold rule, wordmark,
     small-caps eyebrow, heritage-blue title). Replaces the brandbar + navy
     header; total height is preserved at ${h}px so the body grid and footer
     still add up to the 720px page. */
  .masthead{height:${h}px;padding:0 32px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center}
  .mh-brand{display:flex;align-items:center;gap:12px;flex:0 0 168px}
  .mh-rule{width:4px;height:24px;border-radius:2px;background:var(--gold)}
  .mh-word{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.01em;white-space:nowrap}
  .mh-titles{display:flex;flex-direction:column;justify-content:center;min-width:0;flex:1 1 auto}
  .mh-eyebrow{font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted-2);line-height:1.2}
  h1{margin:0;font-size:${h >= 70 ? 21 : 19}px;line-height:1.12;font-weight:700;color:var(--ink);letter-spacing:-.005em}
  .subtitle{margin-top:1px;color:var(--muted);font-size:10.6px;line-height:1.2}
  .header-tools{margin-left:auto;display:flex;align-items:center;gap:10px;text-align:right}
  .period-label,.concept{font-size:7.8px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:var(--muted-2)}
  /* Works for both shapes: a bare .period span, and a .period div wrapping
     <span>Period</span><b>Q1 2026</b>. */
  .period{display:inline-flex;align-items:center;gap:6px;color:var(--ink);border:1px solid var(--line);border-bottom:2px solid var(--gold);border-radius:6px;background:#fff;padding:5px 12px;font-size:10.8px;font-weight:800;white-space:nowrap}
  .period span{font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;color:var(--muted-2)}
  .period b{font-weight:800;color:var(--ink)}`;

function patternA(text) {
  const bb = text.match(/\.brandbar\s*\{[^}]*height\s*:\s*([\d.]+)px[^}]*\}/);
  const hd = text.match(/(?:^|\n)(\s*)header\s*\{[^}]*height\s*:\s*([\d.]+)px[^}]*\}/);
  if (!bb || !hd) return null;

  const total = Number(bb[1]) + Number(hd[2]);
  let out = text;

  /* Some slides lay the page out as an explicit row grid whose first two rows
   * are the brandbar and the header. Merging them into one element leaves the
   * grid a child short, so every subsequent row shifts up and the footer lands
   * mid-slide. Collapse those two track sizes into one. */
  out = out.replace(
    /(grid-template-rows\s*:\s*)([\d.]+)px\s+([\d.]+)px/,
    (m, head, r1, r2) => (Number(r1) === Number(bb[1]) && Number(r2) === Number(hd[2])
      ? `${head}${total}px`
      : m),
  );

  /* Order matters: the masthead block below re-declares h1, .subtitle,
   * .period and friends, so the old rules must be removed BEFORE it is
   * inserted. Doing it the other way round deletes the new rules and leaves
   * the originals — which still style for a navy band. */
  out = out.replace(/\s*\.brandbar\s*\{[^}]*\}/g, '');
  out = out.replace(/\s*\.brandbar strong\s*\{[^}]*\}/g, '');
  out = out.replace(/\s*\.mark\s*\{[^}]*\}/g, '');
  // `\.sub\s*\{` will not match `.subtitle{`, so both shapes' rules are cleared.
  ['h1', '\\.subtitle', '\\.sub', '\\.header-tools', '\\.period-label', '\\.period', '\\.concept']
    .forEach((sel) => {
      out = out.replace(new RegExp(`\\n\\s*${sel}\\s*\\{[^}]*\\}`), '');
    });

  out = out.replace(/(?:^|\n)\s*header\s*\{[^}]*\}/, `\n${mastheadCssA(total)}`);

  // Rewrite the markup: brandbar div + <header>…</header> -> one .masthead.
  out = out.replace(
    /\s*<div class="brandbar">[\s\S]*?<\/div>\s*<header>([\s\S]*?)<\/header>/,
    (_m, inner) => {
      /* Two inner shapes exist:
       *   v5        <div><h1/><div class="subtitle"/></div> + <div class="header-tools">…
       *   v2/v3/v4  <div><h1/><div class="sub"/></div>      + <div class="period">…
       * Pull the title group out by its structure (a div opening with <h1>
       * and closing two </div> later), and treat whatever remains as tools —
       * that keeps the period chip whatever form it takes. */
      const h1 = inner.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? '';
      const sub = inner.match(/<div class="sub(?:title)?">([\s\S]*?)<\/div>/)?.[1] ?? '';
      const titleGroup = inner.match(/<div>\s*<h1>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? '';
      const tools = inner.replace(titleGroup, '').trim();
      return `
  <div class="masthead">
    <div class="mh-brand"><span class="mh-rule"></span><span class="mh-word">Standard Life</span></div>
    <div class="mh-titles">
      <span class="mh-eyebrow">${EYEBROW}</span>
      <h1>${h1}</h1>
      ${sub ? `<div class="subtitle">${sub}</div>` : ''}
    </div>
    ${tools}
  </div>`;
    },
  );

  return out === text ? null : { text: out, note: `merged brandbar+header -> ${total}px masthead` };
}

/* ---------------------------------------------------------------- pattern B */

function patternB(text) {
  if (!/\.head\s*\{[^}]*background\s*:\s*var\(--blue\)/.test(text)) return null;
  let out = text;

  /* The title, subtitle and quarter selector live inside `.head`, so this
   * restyles the two bands to white rather than merging them — the 36px+68px
   * grid is left exactly as it was. The gold-led rule under `.head` is kept:
   * it is the same gold accent the report masthead uses. */

  // Brand strip: white, gold rule replacing the rotated triangle.
  out = out.replace(
    /\.brand\s*\{[^}]*\}/,
    '.brand{display:flex;align-items:center;justify-content:space-between;padding:0 32px;'
    + 'background:#fff;border-top:0}',
  );
  out = out.replace(
    /\.logo\s*\{[^}]*\}/,
    '.logo{font-weight:800;font-size:17px;color:var(--ink);letter-spacing:-.01em;'
    + 'display:flex;align-items:center;gap:12px;position:relative}',
  );
  out = out.replace(
    /\.logo:after\s*\{[^}]*\}/,
    '.logo:before{content:"";width:4px;height:24px;border-radius:2px;background:var(--gold);flex:0 0 auto}',
  );

  // Title band: white with heritage-blue type instead of navy with white type.
  out = out.replace(
    /\.head\s*\{[^}]*\}/,
    '.head{background:#fff;color:var(--ink);display:grid;grid-template-columns:auto 1fr auto;'
    + 'align-items:center;gap:16px;padding:0 32px;position:relative}',
  );
  out = out.replace(/\.title\s*\{[^}]*\}/, '.title{font-size:24px;font-weight:700;letter-spacing:-.01em;color:var(--ink)}');
  out = out.replace(/\.sub\s*\{[^}]*\}/, '.sub{font-size:13px;color:var(--muted)}');

  // Tools were styled for a dark band: translucent white on navy.
  out = out.replace(
    /\.quarter\s*\{[^}]*\}/,
    '.quarter{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--line);'
    + 'border-bottom:2px solid var(--gold);border-radius:4px;padding:4px 6px}',
  );
  out = out.replace(
    /\.quarter span\s*\{[^}]*\}/,
    '.quarter span{font-size:8px;text-transform:uppercase;font-weight:800;letter-spacing:.08em;color:var(--muted-2)}',
  );
  /* `.page` is the page counter here. Anchor on the preceding `}` and put it
   * back — a non-capturing group still consumes, which previously ate the
   * closing brace of the rule before it and cascaded through the stylesheet. */
  out = out.replace(
    /\}\.page\s*\{[^}]*\}/,
    '}.page{font-size:12px;font-weight:800;color:var(--ink);border-left:1px solid var(--line);padding-left:14px}',
  );

  return out === text ? null : { text: out, note: 'brand + head restyled white (36+68 grid kept)' };
}

/* -------------------------------------------------------------------- main */

const files = readdirSync(SLIDES).filter((f) => f.endsWith('.html'));
let changed = 0;

for (const f of files) {
  const path = join(SLIDES, f);
  const text = readFileSync(path, 'utf8');

  if (/class="masthead"/.test(text)) { console.log(`  skip  ${f}  (already converted)`); continue; }
  if (f === 'appendix-header.html') { console.log(`  skip  ${f}  (section divider, no header band)`); continue; }

  const result = patternA(text) ?? patternB(text);
  if (!result) { console.log(`  MISS  ${f}  (no recognised header pattern)`); continue; }

  console.log(`  ${FIX ? 'fix ' : 'would'}  ${f}  — ${result.note}`);
  if (FIX) { writeFileSync(path, result.text, 'utf8'); changed += 1; }
}

console.log(FIX ? `\n${changed} slide(s) converted\n` : '\n(report only — re-run with --fix)\n');
