// Every script the page loads must also be cached for offline play.
//
// The game is installable and is meant to work with no network at all. A new js/ file
// added to index.html but forgotten in sw.js ASSETS breaks that in the quietest way
// possible: online it is perfect, offline it half-loads and the game dies on a missing
// global — and only for people who installed it, which is nobody testing it.
//
// This matters more the more the single file gets split up, so it belongs next to the
// splitting.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

const scriptSrcs = [...html.matchAll(/<script[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);

test('every script index.html loads actually exists', () => {
  assert.ok(scriptSrcs.length > 0, 'expected index.html to load some scripts');
  for (const src of scriptSrcs) {
    assert.ok(fs.existsSync(path.join(ROOT, src)), `index.html loads ${src}, which is not on disk`);
  }
});

test('every script is precached, so the game still works offline', () => {
  const assets = sw.slice(sw.indexOf('const ASSETS'), sw.indexOf('];', sw.indexOf('const ASSETS')));
  for (const src of scriptSrcs) {
    assert.ok(assets.includes(`'${src}'`),
      `${src} is loaded by index.html but missing from sw.js ASSETS — offline play would break`);
  }
});

test('the cache version is bumped past the last release', () => {
  // Not a version check so much as a reminder in test form: index.html changes are
  // invisible to anyone who already has the old one cached until this string moves.
  const m = /const CACHE = 'irontide-v(\d+)'/.exec(sw);
  assert.ok(m, 'sw.js should declare a versioned cache name');
  assert.ok(Number(m[1]) >= 88, `cache version went backwards: v${m[1]}`);
});

test('scripts load in an order that can work', () => {
  // No module system: these are plain scripts sharing one global scope, so load order IS
  // the dependency graph. vendor/three.min.js has to come first because the geometry
  // helpers construct THREE objects, and the inline script comes last because it uses
  // everything else.
  const three = scriptSrcs.indexOf('vendor/three.min.js');
  const terrain = scriptSrcs.indexOf('js/terrain.js');
  assert.ok(three >= 0 && terrain >= 0);
  assert.ok(three < terrain, 'js/terrain.js builds THREE.Vector3 and must load after three.min.js');

  const lastSrc = html.lastIndexOf('<script src=');
  const inlineStart = html.indexOf('<script>', lastSrc);
  assert.ok(inlineStart > lastSrc, 'the inline game script must come after every external one');
});
