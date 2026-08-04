const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// The whole game is one inline <script> of ~12,000 lines, so a single stray character takes the
// entire page down — nothing defines, nothing boots, every screen is blank. What made that
// expensive was the SHAPE of the failure, not the failure: the browser tests all sit on
// page.waitForFunction until they time out, so a typo reads as five unrelated 60-second hangs
// with no mention of syntax anywhere. It cost real time to trace one back to an unescaped
// apostrophe inside a single-quoted string — desc:'... a Tomahawk's ...' — which closed the
// string early and left the rest of the line as loose identifiers.
//
// This turns that into an instant, precise failure with a line number, in well under a second,
// before a browser is ever launched. new Function() parses without executing, which is exactly
// what is wanted here: the file is full of top-level `new THREE.…` that cannot run under node.
// Classic scripts only — what the browser actually loads. server/server.js is left out on
// purpose: it is dev tooling, an ES module, and new Function() cannot parse `import` at all.
const files = ['js/terrain.js', 'sw.js'];

test('every inline script in index.html parses', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const blocks = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(blocks.length > 0, 'found no inline <script> at all — has the page been restructured?');

  const errors = [];
  for (const m of blocks) {
    const startLine = src.slice(0, m.index).split('\n').length;
    try { new Function(m[1]); }
    catch (e) { errors.push(`inline <script> opening at index.html:${startLine} — ${e.message}`); }
  }
  assert.deepStrictEqual(errors, [], errors.join('\n'));
});

test('every shipped .js file parses', () => {
  const errors = [];
  assert.ok(files.length > 0);
  for (const rel of files) {
    const p = path.join(__dirname, '..', rel);
    if (!fs.existsSync(p)) continue;
    try { new Function(fs.readFileSync(p, 'utf8')); }
    catch (e) { errors.push(`${rel} — ${e.message}`); }
  }
  assert.deepStrictEqual(errors, [], errors.join('\n'));
});
