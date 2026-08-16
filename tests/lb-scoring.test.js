// Pure scoring and plausibility tests — no database, so these run on a fresh clone.
//
// The bounds these check are deliberately loose. That is the design: a bound tight
// enough to catch every cheater is also tight enough to flag the kid who had the run
// of their life, and of those two failures only one is worth avoiding.

const test = require('node:test');
const assert = require('node:assert');
const SC = require('../server-leaderboard/scoring.js');

const war = (over = {}) => Object.assign({
  mode: 'campaign', map_idx: 0, difficulty: 'normal',
  won: 1, duration_s: 300, sunk: 4, planes: 2, islands: 1, bosses: 0,
  ships_lost: 0, stars: 3,
}, over);

test('war score rewards the fight, not the grind', () => {
  const parT = SC.parSeconds(0);                       // 240 + 2*80 = 400
  assert.equal(parT, 400);

  const base = SC.warScore(war());
  assert.equal(base, 4 * 10 + 2 * 3 + 1 * 15 + 100 + 50 + Math.round((400 - 300) / 400 * 100));

  // slower run scores lower...
  assert.ok(SC.warScore(war({ duration_s: 390 })) < base);
  // ...and past par there is simply no bonus rather than a penalty
  assert.equal(SC.warScore(war({ duration_s: 500 })), SC.warScore(war({ duration_s: 9999 })));
});

test('losing fast earns no time or flawless bonus', () => {
  const lost = SC.warScore(war({ won: 0, duration_s: 20 }));
  assert.equal(lost, 4 * 10 + 2 * 3 + 1 * 15, 'only the fighting counts on a loss');
});

test('stars mirror the rule the game shows the player', () => {
  assert.equal(SC.starsFor(war({ duration_s: 300, ships_lost: 0 })), 3);   // under par, flawless
  assert.equal(SC.starsFor(war({ duration_s: 300, ships_lost: 2 })), 2);   // under par only
  assert.equal(SC.starsFor(war({ duration_s: 500, ships_lost: 2 })), 1);   // just the win
  assert.equal(SC.starsFor(war({ won: 0 })), 0);
  assert.equal(SC.starsFor(war({ mode: 'quick' })), 0, 'quick battles are not rated');
});

test('career score mirrors the games own careerScore()', () => {
  // index.html: sunk*2 + planes + islands*5 + wins*40 + bosses*25
  assert.equal(SC.careerScoreOf({ sunk: 10, planes: 5, islands: 3, wins: 2, bosses: 1 }),
    20 + 5 + 15 + 80 + 25);
  assert.equal(SC.careerScoreOf({}), 0);
});

test('the hull ceiling grows with time and never shrinks', () => {
  let prev = -1;
  for (const s of [0, 60, 200, 400, 900, 1800, 3600]) {
    const n = SC.maxHullsSpawned(s, 0);
    assert.ok(n > prev, `ceiling must be monotonic: ${s}s gave ${n} after ${prev}`);
    prev = n;
  }
  // Training Bay starts with 2 hulls, so a zero-second war can involve at most those.
  assert.equal(SC.maxHullsSpawned(0, 0), 2);
});

test('the ceiling is generous enough for a genuinely great run', () => {
  // 15 minutes on the smallest theater: reinforcements every ~55s plus offensives.
  // A player who sank 30 is exceptional, not impossible, and must pass.
  const check = SC.validateRun(war({ duration_s: 880, sunk: 30, planes: 10, islands: 2, ships_lost: 1, stars: 1 }), 900);
  assert.ok(check.ok, 'flagged an honest run: ' + check.reasons.join(','));
});

test('the ceiling still refuses the absurd', () => {
  const check = SC.validateRun(war({ duration_s: 880, sunk: 5000, stars: 1, ships_lost: 1 }), 900);
  assert.ok(!check.ok);
  assert.ok(check.reasons.includes('sunk'));
});

test('a duration longer than the wall clock is impossible', () => {
  assert.ok(SC.validateRun(war({ duration_s: 300 }), 10).reasons.includes('duration-exceeds-wallclock'));
  // small overruns are tolerated — clocks drift
  assert.ok(!SC.validateRun(war({ duration_s: 300 }), 298).reasons.includes('duration-exceeds-wallclock'));
});

test('a ground theater has no fleet to sink', () => {
  const M = SC.theaterOf(1);
  assert.equal(M.ground, true);
  assert.equal(M.enemies, 0);
  const check = SC.validateRun(
    war({ map_idx: 1, duration_s: 500, sunk: 60, islands: 6, stars: 1, ships_lost: 1 }), 600);
  assert.ok(check.reasons.includes('sunk-on-ground-map') || check.reasons.includes('sunk'));
});

test('career headroom scales with how long the player was away', () => {
  const short = SC.maxCareerDelta(300, 0);
  const long = SC.maxCareerDelta(300, 4 * 3600);
  assert.ok(long > short * 5, 'an afternoon offline must not read as an edited save');
  assert.ok(short > 0);
});

test('the weekly board resets on Monday local midnight', () => {
  const tz = -480;                                   // Pacific
  // 2026-08-13 is a Thursday. 10:00 local -> the week started Monday the 10th.
  const thu = Date.UTC(2026, 7, 13, 18, 0, 0);       // 10:00 PDT-ish in fixed -480 terms
  const start = SC.weekStart(thu, tz);
  const asLocal = new Date((start + tz * -60 * -1) * 1000);
  assert.equal(new Date(start * 1000 + tz * 60000).getUTCDay(), 1, 'lands on a Monday');
  assert.ok(start * 1000 <= thu, 'the week starts before now');
  assert.ok(thu - start * 1000 < 7 * 86400000, 'and within the last seven days');
  assert.ok(asLocal instanceof Date);

  // Two moments in the same week share a boundary; the next week does not.
  const fri = Date.UTC(2026, 7, 14, 18, 0, 0);
  const nextTue = Date.UTC(2026, 7, 18, 18, 0, 0);
  assert.equal(SC.weekStart(fri, tz), start);
  assert.notEqual(SC.weekStart(nextTue, tz), start);
});

test('modes and difficulties are closed sets', () => {
  assert.ok(SC.validateRun(war({ mode: 'god' }), 900).reasons.includes('mode'));
  assert.ok(SC.validateRun(war({ difficulty: 'baby' }), 900).reasons.includes('difficulty'));
  assert.ok(SC.validateRun(war({ map_idx: 999 }), 900).reasons.includes('map'));
});

test('negative and fractional counts are rejected', () => {
  for (const bad of [-1, 1.5, NaN, Infinity]) {
    const check = SC.validateRun(war({ sunk: bad, duration_s: 880, stars: 1, ships_lost: 1 }), 900);
    assert.ok(check.reasons.includes('sunk'), `${bad} should not pass as a kill count`);
  }
});
