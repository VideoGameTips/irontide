// Drift guards.
//
// The leaderboard server judges submissions using constants that live in index.html —
// how many enemies a theater starts with, how fast reinforcements arrive, what the
// callsign wordlist contains. If the server's copy of any of that falls behind the
// game, nothing crashes: it just starts quietly mis-judging honest players, which is
// the worst kind of bug to have in an anti-cheat system.
//
// So the campaign constants are GENERATED (tools/extract-campaign.js) and the wordlist
// is SHARED (js/callsigns.js is loaded by the browser and required by the server), and
// these tests fail the moment either arrangement stops holding.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

test('campaign-facts.json still matches index.html', () => {
  const { build } = require('../tools/extract-campaign.js');
  const generated = build();
  const onDisk = JSON.parse(fs.readFileSync(path.join(ROOT, 'server-leaderboard', 'campaign-facts.json'), 'utf8'));
  assert.deepEqual(onDisk, generated,
    'theater constants changed — run: node tools/extract-campaign.js');
});

test('the extracted constants are the ones the game actually uses', () => {
  const facts = require('../server-leaderboard/campaign-facts.json');

  // Spot-check against the source text rather than against another copy of the numbers.
  assert.match(INDEX, new RegExp(`SPAWN_SLOW\\s*=\\s*${facts.spawnSlow}`));
  assert.match(INDEX, new RegExp(`QUICK_KILL_GOAL\\s*=\\s*${facts.quickKillGoal}`));

  // The par formula the server uses to award stars and time bonuses is written twice in
  // endGame(); if either instance is retuned this stops matching.
  assert.match(INDEX, new RegExp(`${facts.parBase}\\s*\\+\\s*\\(\\s*_?M\\.enemies\\|\\|3\\s*\\)\\s*\\*\\s*${facts.parPerEnemy}`),
    'par formula in index.html no longer matches parBase/parPerEnemy');

  assert.equal(facts.theaters.length, (INDEX.match(/\{name:'/g) || []).length > 0 ? facts.theaters.length : 0);
  assert.ok(facts.theaters.length >= 20, 'campaign should not have silently shrunk');
  assert.equal(facts.theaters[0].idx, 0);
});

test('the game and the server load the same callsign wordlist', () => {
  // Same file, not two copies — that is the whole design. Assert the browser really
  // pulls it in, because a missing <script> tag would leave the client generating
  // callsigns from an undefined list while the server happily validated indexes.
  assert.match(INDEX, /<script src="js\/callsigns\.js"><\/script>/,
    'index.html must load js/callsigns.js');

  const CS = require('../js/callsigns.js');
  assert.ok(CS.CALLSIGN_ADJ.length > 0 && CS.CALLSIGN_NOUN.length > 0);

  // Every entry is bilingual: a missing zh would render as undefined in the Chinese UI.
  for (const list of [CS.CALLSIGN_ADJ, CS.CALLSIGN_NOUN]) {
    for (const w of list) {
      assert.ok(typeof w.en === 'string' && w.en.length, 'missing en: ' + JSON.stringify(w));
      assert.ok(typeof w.zh === 'string' && w.zh.length, 'missing zh: ' + JSON.stringify(w));
    }
  }
});

test('callsign indexes are validated against the list bounds', () => {
  const CS = require('../js/callsigns.js');
  assert.ok(CS.callsignValid(0, 0));
  assert.ok(CS.callsignValid(CS.CALLSIGN_ADJ.length - 1, CS.CALLSIGN_NOUN.length - 1));
  assert.ok(!CS.callsignValid(CS.CALLSIGN_ADJ.length, 0));
  assert.ok(!CS.callsignValid(-1, 0));
  assert.ok(!CS.callsignValid(1.5, 0));
  assert.ok(!CS.callsignValid('0', 0));
});

test('no duplicate words, so no two indexes render the same name', () => {
  const CS = require('../js/callsigns.js');
  for (const [label, list] of [['adjectives', CS.CALLSIGN_ADJ], ['nouns', CS.CALLSIGN_NOUN]]) {
    for (const lang of ['en', 'zh']) {
      const seen = list.map((w) => w[lang]);
      assert.equal(new Set(seen).size, seen.length, `duplicate ${lang} ${label}`);
    }
  }
});

test('the callsign tag is stable and identical in both languages', () => {
  const CS = require('../js/callsigns.js');
  const id = 'abcdef-123456';
  assert.equal(CS.callsignTag(id), CS.callsignTag(id));
  assert.match(CS.callsignTag(id), /^[0-9A-F]{4}$/);
  assert.equal(CS.callsignText(0, 0, false, id).split('#')[1], CS.callsignText(0, 0, true, id).split('#')[1]);
});

test('the service worker lets API traffic past the cache', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /irontide-api/,
    'sw.js is cache-first — without a bypass the board would serve yesterday\'s standings');
  assert.match(sw, /js\/callsigns\.js/, 'callsigns.js must be precached for offline play');
});
