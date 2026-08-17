#!/usr/bin/env node
// Guards a file split. Moving code out of index.html is a mechanical operation with a
// nasty failure mode: a slice that takes one line too many, or one too few, still parses
// and still loads — it just quietly loses a function nobody calls until next Tuesday.
//
// This project has already been bitten once: a scripted replacement of trText() cut at
// the first "\n}" and swallowed catTr/trRank/setLang/DIFFICULTY whole. The smoke tests
// caught it, which was luck as much as coverage.
//
// So: record every top-level declaration before a move, and require the same set after.
// The set is the invariant — which FILE a name lives in is exactly what we are changing,
// so the check deliberately ignores that and looks only at the union.
//
//   node tools/verify-extraction.js --save     before you start
//   node tools/verify-extraction.js            after; non-zero exit if anything moved

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT = path.join(ROOT, 'tools', '.declarations.json');

// Everything in this codebase declares at column 0 inside one big script, so anchoring to
// the line start is what separates a real top-level declaration from a nested one.
const DECL = /^(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*))/;

function declarationsIn(source) {
  const names = new Set();
  for (const line of source.split('\n')) {
    const m = DECL.exec(line);
    if (m) names.add(m[1] || m[2] || m[3]);
  }
  return names;
}

// The inline <script> in index.html, plus every js/ file it loads. vendor/ is third-party
// and never part of a split.
function collect() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const names = new Set();

  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    for (const n of declarationsIn(m[1])) names.add(n);
  }

  const loaded = [...html.matchAll(/<script[^>]*\bsrc="(js\/[^"]+)"/g)].map(m => m[1]);
  for (const rel of loaded) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) throw new Error(`index.html loads ${rel}, which does not exist`);
    for (const n of declarationsIn(fs.readFileSync(file, 'utf8'))) names.add(n);
  }

  return { names: [...names].sort(), files: loaded };
}

function main() {
  const current = collect();

  if (process.argv.includes('--save')) {
    fs.writeFileSync(SNAPSHOT, JSON.stringify(current, null, 2) + '\n');
    console.log(`saved ${current.names.length} top-level declarations across index.html + ${current.files.length} js file(s)`);
    return;
  }

  if (!fs.existsSync(SNAPSHOT)) {
    console.error('No snapshot. Run `node tools/verify-extraction.js --save` BEFORE moving code.');
    process.exit(1);
  }

  const before = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const was = new Set(before.names), now = new Set(current.names);
  const lost = before.names.filter(n => !now.has(n));
  const gained = current.names.filter(n => !was.has(n));

  if (lost.length) console.error(`LOST ${lost.length}: ${lost.join(', ')}`);
  if (gained.length) console.log(`new ${gained.length}: ${gained.join(', ')}`);

  if (lost.length) {
    console.error('\nA declaration disappeared. A slice took too much — restore it before going on.');
    process.exit(1);
  }
  console.log(`ok — all ${before.names.length} declarations still present, now across ${current.files.length} js file(s)`);
}

if (require.main === module) main();
module.exports = { collect, declarationsIn };
