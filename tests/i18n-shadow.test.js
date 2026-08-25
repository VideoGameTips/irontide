// Nothing may shadow T() in a scope that then calls it.
//
// buyTank() opened with `const T = TANKS[id]`, and a bulk pass that wrapped player-facing strings
// in T('en','中文') put four of them inside it — where T is a tank definition, not the translator.
// Every one of those calls threw. They sat on the paths that refuse a purchase (broke, wrong
// ground, no room), so the failure only appeared when something had ALREADY gone wrong for the
// player: press Tab, try to buy a tank you cannot afford, and the game raises instead of saying no.
//
// Shadowing T is legal and three places do it harmlessly. The rule is narrower and exact: shadow
// it, or call it — not both in the same scope.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const LINES = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split('\n');
const DECLARES_T = /\b(?:const|let|var)\s+T\s*=/;
const CALLS_T = /\bT\(\s*'/g;
const TRANSLATOR_LINE = LINES.findIndex(l => l.includes("const T=(en,zh)=>")) + 1;

test('nothing shadows the translator in a scope that calls it', () => {
  const clashes = [];
  LINES.forEach((line, i) => {
    if (!DECLARES_T.test(line)) return;
    if (i + 1 <= TRANSLATOR_LINE) return;              // the translator's own definition
    let end = LINES.length;                            // to the end of the enclosing function
    for (let j = i + 1; j < LINES.length; j++) if (LINES[j].startsWith('}')) { end = j + 1; break; }
    const body = LINES.slice(i, end).join('\n');
    const calls = body.match(CALLS_T);
    if (calls) clashes.push(`${i + 1}: shadows T and calls it ${calls.length}×  — ${line.trim().slice(0, 70)}`);
  });
  assert.deepEqual(clashes, [],
    'T() here is whatever the local T is, not the translator, and calling it throws:\n  ' +
    clashes.join('\n  '));
});
