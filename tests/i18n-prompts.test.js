// Every line the game says to the player has to exist in both languages.
//
// The first pass here wrapped 106 bare flashPrompt() strings in T('en','中文') and guarded only
// the string a call OPENED with — which missed every tail welded on after a T() pair
// (`T(a,b) + name + '. Secure every island.'`) and every call that opens with a variable. A second
// sweep found 63 more, including the entire comms() radio script, which had never been translated
// at all. Nothing about any of them failed loudly: the string simply came out English, usually at
// the moment the player was already stuck.
//
// So this checks EVERY literal in the call, and decides coverage by span rather than by pattern:
// find each T()/keyPrompt()/trName()/trText()/campaignName()/campaignTheme() call by balanced
// parens, and flag any literal that falls outside all of them. The earlier regex version tried to
// pair quotes across an argument list, mismatched them, and invented findings — a guard that cries
// wolf gets deleted by the next person in a hurry, and then there is no guard at all.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAW = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
// Comments are not code: one of ours quotes the very English string it replaced.
const SRC = RAW.replace(/^([^\n'"`]*?)\/\/[^\n]*$/gm, '$1');

const CJK = /[一-鿿]/;
const SKIP = /^(#[0-9a-fA-F]{3,8}|ok|bad|good|warn|danger|capture|attack|regroup)$/;
const SENTENCE = /[A-Za-z]{3,}\s+[A-Za-z]{2,}|[A-Za-z]{6,}/;
const SPEAKERS = ['flashPrompt', 'shopMsg', 'comms', 'showBanner'];
const TRANSLATORS = ['T', 'keyPrompt', 'trText', 'trName', 'campaignName', 'campaignTheme'];

// Every `name(` in `s`, as [start, end) spans that respect nesting and string contents.
function spans(s, name) {
  const out = [];
  const re = new RegExp('(?<![A-Za-z_$])' + name + '\\(', 'g');
  let m;
  while ((m = re.exec(s))) {
    let i = m.end ? m.end : re.lastIndex, depth = 1, q = null, j = re.lastIndex;
    for (; j < s.length && depth > 0; j++) {
      const c = s[j];
      if (q) { if (c === '\\') j++; else if (c === q) q = null; }
      else if (c === "'" || c === '"' || c === '`') q = c;
      else if (c === '(') depth++;
      else if (c === ')') depth--;
    }
    out.push([m.index, j]);
  }
  return out;
}

// String literals in `s`, as [offset, text].
function literals(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const q = s[i];
    if (q !== "'" && q !== '"') continue;
    let j = i + 1, buf = '';
    for (; j < s.length && s[j] !== q; j++) { if (s[j] === '\\') { buf += s[++j] || ''; } else buf += s[j]; }
    out.push([i, buf]);
    i = j;
  }
  return out;
}

test('every player-facing string exists in both languages', () => {
  const bare = [];
  for (const fn of SPEAKERS) {
    for (const [s0, s1] of spans(SRC, fn)) {
      const argStart = SRC.indexOf('(', s0) + 1;
      const args = SRC.slice(argStart, s1 - 1);
      const covered = TRANSLATORS.flatMap(t => spans(args, t));
      for (const [pos, lit] of literals(args)) {
        const t = lit.trim();
        if (CJK.test(lit) || SKIP.test(t) || t.length < 6 || !SENTENCE.test(lit)) continue;
        if (covered.some(([a, b]) => pos >= a && pos < b)) continue;
        bare.push(`${SRC.slice(0, s0).split('\n').length}: ${fn}() — ${t.slice(0, 60)}`);
      }
    }
  }
  assert.deepEqual(bare, [],
    `${bare.length} player-facing string(s) exist in English only. Wrap each in T('en','中文'):\n  ` +
    bare.join('\n  '));
});
