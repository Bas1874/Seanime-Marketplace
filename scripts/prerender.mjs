// Prerenders the extension catalog into index.html so search engines
// (and users, before JS loads) see the full list instead of a spinner.
//
// It extracts the site's own JavaScript from index.html and reuses its
// card()/buildCatalogHtml() functions, so the static HTML is identical
// to what the browser renders at runtime — no visual flash, no drift.
//
// Usage:  node scripts/prerender.mjs
//         FEED_FILE=path/to/Main.json node scripts/prerender.mjs   (offline test)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// works whether the site lives at the repo root or in /docs
const FILE  = existsSync('docs/index.html') ? 'docs/index.html' : 'index.html';
const FEED  = 'https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/main/Marketplace/Main.json';
const LOCAL = 'Marketplace/Main.json';
const START = '<!-- PRERENDER:START -->';
const END   = '<!-- PRERENDER:END -->';

const html = readFileSync(FILE, 'utf8');

// 1. Extract the site's main script (the one defining MAIN)
const m = html.match(/<script>\n(const MAIN[\s\S]*?)<\/script>/);
if (!m) throw new Error('Main script not found in index.html');

// 2. Keep only the pure part (everything before DOM wiring)
const cut = m[1].indexOf('// ---------------- wiring');
if (cut < 0) throw new Error('Wiring marker not found in script');
const core = m[1].slice(0, cut);

// 3. Read the feed. Prefer the file from this checkout - it is the EXACT
//    version that triggered this workflow run. Fetching it over
//    raw.githubusercontent.com instead hits a ~5-minute CDN cache, which
//    serves the PREVIOUS version right after a push and makes the
//    prerendered catalog lag one update behind. Remote fetch is kept
//    only as a fallback for running the script outside the repo.
let data;
if (process.env.FEED_FILE) {
  data = JSON.parse(readFileSync(process.env.FEED_FILE, 'utf8'));
} else if (existsSync(LOCAL)) {
  data = JSON.parse(readFileSync(LOCAL, 'utf8'));
  console.log('Feed: local checkout (' + LOCAL + ')');
} else {
  const res = await fetch(FEED, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error('Feed fetch failed: HTTP ' + res.status);
  data = await res.json();
  console.log('Feed: remote fetch (fallback)');
}
if (!Array.isArray(data) || data.length === 0) throw new Error('Feed is empty or not an array — refusing to prerender');

// 4. Run the site's own render code against the data (default view/sort)
const run = new Function('DATA', core + '\nallData = DATA;\nreturn buildCatalogHtml(getFiltered());');
const generated = run(data);
if (!generated || !generated.includes('xcard')) throw new Error('Generated HTML looks wrong — aborting');

// 5. Replace the content between the prerender markers
const s = html.indexOf(START);
const e = html.indexOf(END);
if (s < 0 || e < 0 || e < s) throw new Error('Prerender markers not found in index.html');
const out = html.slice(0, s + START.length) + '\n' + generated + '\n    ' + html.slice(e);

writeFileSync(FILE, out);
console.log(`Prerendered ${data.length} extensions into ${FILE} (${(generated.length / 1024).toFixed(1)} KB)`);