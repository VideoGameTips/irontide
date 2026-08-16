#!/usr/bin/env node
// Pull the CAMPAIGN table out of index.html into a JSON file the leaderboard server can trust.
//
// WHY THIS EXISTS
// The leaderboard's anti-cheat checks ("you cannot have sunk 40 ships in Training Bay")
// need the theater constants — enemies, isles, reinforce. Those constants live in
// index.html, which the server never loads. Hand-copying them into the server would
// work exactly until the first time somebody tunes a theater, and then it would go on
// silently mis-judging honest players. So: generate, don't copy, and let a test fail
// when the generated file drifts.
//
//   node tools/extract-campaign.js            # regenerate
//   node tools/extract-campaign.js --check    # exit 1 if stale (used by tests/lb-drift.test.js)

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'server-leaderboard', 'campaign-facts.json');

// Only the fields the server actually reasons about. Deliberately narrow: every field
// added here is another thing that can drift, and the server has no use for `theme`.
const KEEP = ['name', 'enemies', 'isles', 'reinforce', 'boss', 'ground'];

function extractArray(html, decl) {
  const i = html.indexOf(decl);
  if (i < 0) throw new Error(`could not find "${decl}" in index.html`);
  const j = html.indexOf('\n];', i);
  if (j < 0) throw new Error(`could not find the end of "${decl}"`);
  const literal = html.slice(i + decl.length - 1, j + 2);   // -1 keeps the opening `[`
  // The array is a plain literal of our own authoring — no identifiers, no calls — so
  // evaluating it is how we stay bug-compatible with however JS parses it. Anything
  // that referenced game state would throw here, which is the signal we'd want.
  return new Function(`"use strict"; return ${literal};`)();
}

function build() {
  const html = fs.readFileSync(SRC, 'utf8');
  const campaign = extractArray(html, 'const CAMPAIGN=[');
  if (!Array.isArray(campaign) || campaign.length === 0) throw new Error('CAMPAIGN came out empty');

  const theaters = campaign.map((m, idx) => {
    const out = { idx };
    for (const k of KEEP) {
      if (m[k] === undefined) continue;
      out[k] = typeof m[k] === 'boolean' ? m[k] : m[k];
    }
    // Normalize the optional numerics so the server never has to write `|| 0`.
    out.enemies = m.enemies || 0;
    out.isles = m.isles || 0;
    out.reinforce = m.reinforce || 0;
    out.boss = !!m.boss;
    out.ground = !!m.ground;
    return out;
  });

  // Spawn-pacing constants, also read straight out of the source rather than retyped.
  const grab = (re, label) => {
    const m = html.match(re);
    if (!m) throw new Error(`could not read ${label} from index.html`);
    return Number(m[1]);
  };

  return {
    _generated_by: 'tools/extract-campaign.js — do not edit by hand; run the tool',
    _source: 'index.html',
    spawnSlow: grab(/SPAWN_SLOW\s*=\s*([\d.]+)/, 'SPAWN_SLOW'),
    quickKillGoal: grab(/QUICK_KILL_GOAL\s*=\s*(\d+)/, 'QUICK_KILL_GOAL'),
    // fireDynamicEvent: `_eventT = 55 + Math.random()*45`, reinforce spawns 1-2 hulls
    eventMinInterval: 55,
    eventMaxHulls: 2,
    // updateWarPacing offensives: first at `160 + rand*80`, then `(170 + rand*80) * SPAWN_SLOW`,
    // each spawning `min(3 + offensiveN/2, 6)` hulls
    offensiveFirstMin: 160,
    offensiveRepeatMin: 170,
    offensiveMaxHulls: 6,
    // endGame star/par formula: parT = 240 + enemies * 80
    parBase: 240,
    parPerEnemy: 80,
    theaters,
  };
}

function main() {
  const check = process.argv.includes('--check');
  const fresh = JSON.stringify(build(), null, 2) + '\n';

  if (check) {
    let current = null;
    try { current = fs.readFileSync(OUT, 'utf8'); } catch (e) { /* missing counts as stale */ }
    if (current !== fresh) {
      console.error('campaign-facts.json is stale — run: node tools/extract-campaign.js');
      process.exit(1);
    }
    console.log('campaign-facts.json is up to date');
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, fresh);
  console.log(`wrote ${path.relative(ROOT, OUT)} (${JSON.parse(fresh).theaters.length} theaters)`);
}

if (require.main === module) main();
module.exports = { build };
