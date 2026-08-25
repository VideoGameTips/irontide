// Every line the game says to the player has to exist in both languages.
//
// 106 flashPrompt() calls carried a bare English literal — "Swim to dry land before building
// defenses", "Capture this position", "Not enough funds" — so a player with the game set to
// Chinese was told what had gone wrong in a language they had not asked for, at exactly the
// moment they were already stuck. Nothing failed loudly; the string simply came out English.
//
// A source scan, because that is the only way to catch the NEXT one: an untranslated prompt
// behaves perfectly right up until someone reads it.
//
// SCOPE, honestly: this checks the string a call OPENS with, which is the shape every one of
// those 106 had. A tail welded on later — flashPrompt(T(a,b) + x + '. And this bit.') — is not
// caught here. Pairing quotes across an argument list needs a parser, and the regex version of
// it invented enough false findings to be worse than nothing: a guard that cries wolf gets
// deleted by the next person in a hurry, and then there is no guard at all.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const CJK = /[一-鿿]/;
const SPEAKERS = ['flashPrompt', 'shopMsg'];

for (const fn of SPEAKERS) {
  test(`${fn}() never opens in one language only`, () => {
    const re = new RegExp(fn + "\\(\\s*'([^']{6,})'", 'g');
    const bare = [];
    let m;
    while ((m = re.exec(SRC))) {
      if (CJK.test(m[1])) continue;                       // the zh half of a T() pair
      bare.push(SRC.slice(0, m.index).split('\n').length + ': ' + m[1].slice(0, 60));
    }
    assert.deepEqual(bare, [],
      `${bare.length} ${fn}() call(s) open with a bare English string. Wrap each in T('en','中文'):\n  ` +
      bare.join('\n  '));
  });
}
