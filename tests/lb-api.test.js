// End-to-end tests for the leaderboard service.
//
// The point of this file is NOT that a good run gets recorded — that is the easy half.
// It is that every forged run is refused: no signature, a replayed session, a time that
// beats the wall clock, a kill count the spawner could not have produced, a star rating
// that does not match the fight, a career that teleports. Each of those has a test that
// fails if the check is removed.

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// better-sqlite3 is a native module installed under server-leaderboard/. A fresh clone
// that has not run `npm install` there should skip rather than fail the whole suite.
// Resolve from server-leaderboard/, not from here: require() walks up from the file
// that calls it, and the native module is installed next to the server, not next to
// the tests. Probing with a bare require() from this file would always "fail" and
// silently skip the entire suite.
let available = true;
try {
  require.resolve('better-sqlite3', { paths: [path.join(__dirname, '..', 'server-leaderboard')] });
} catch (e) { available = false; }

const SKIP = { skip: 'run `npm install` in server-leaderboard/ to exercise these' };
const suite = (name, fn) => test(name, available ? {} : SKIP, fn);

const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'it-lb-test-'));
process.env.DATA_DIR = DATA_DIR;
process.env.ADMIN_TOKEN = 'test-token';
process.env.IP_SALT = 'test-salt';

let srv, db, S, base;

const CLIENT_VER = 'test';
const PLAYER = 'test-player-0001';

function sign(nonce, bodyStr) {
  return crypto.createHmac('sha256', Buffer.from(nonce, 'utf8')).update(bodyStr).digest('hex');
}

async function post(url, obj, headers) {
  const body = JSON.stringify(obj);
  const res = await fetch(base + url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
    body,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function get(url) {
  const res = await fetch(base + url);
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function startRun(opts = {}) {
  const r = await post('/run/start', {
    player_id: opts.player || PLAYER,
    callsign: { a: 0, b: 0 },
    mode: opts.mode || 'campaign',
    map_idx: opts.map === undefined ? 0 : opts.map,
    difficulty: opts.difficulty || 'normal',
  });
  assert.equal(r.status, 200, 'handshake should succeed');
  return r.json;
}

// Pretend the war started `ago` seconds in the past. The alternative is a test that
// really sleeps past the 15-second floor; reaching into the database is the test's
// privilege and keeps the production path free of any "skip the clock" hook.
function backdate(sessionId, ago) {
  db.prepare('UPDATE sessions SET started_at = ? WHERE id = ?')
    .run(Math.floor(Date.now() / 1000) - ago, sessionId);
}

function goodRun(over = {}) {
  return Object.assign({
    won: true, duration_s: 300,
    sunk: 4, planes: 2, islands: 1, bosses: 0, ships_lost: 0,
    stars: 3,
    career: { sunk: 4, planes: 2, islands: 1, wins: 1, bosses: 0, score: 4 * 2 + 2 + 1 * 5 + 40 },
    stars_total: 3, medals: 1, completed: false,
    client_ver: CLIENT_VER,
  }, over);
}

async function finish(session, payload, opts = {}) {
  const body = Object.assign({ session_id: session.session_id, player_id: opts.player || PLAYER }, payload);
  const str = JSON.stringify(body);
  const sig = opts.badSig ? 'deadbeef'.repeat(8) : sign(session.nonce, str);
  const res = await fetch(base + '/run/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-IT-Sig': sig },
    body: str,
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

function runBySession(sid) {
  return db.prepare('SELECT * FROM runs WHERE session_id = ?').get(sid);
}

test.before(async () => {
  if (!available) return;
  const mod = require('../server-leaderboard/server.js');
  srv = mod.server; db = mod.db; S = mod.S;
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${srv.address().port}`;
});

test.after(() => {
  if (srv) srv.close();
  if (db) db.close();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

// ---- the happy path --------------------------------------------------------------

suite('a real run is accepted, scored on the server, and reaches the board', async () => {
  const s = await startRun();
  backdate(s.session_id, 400);
  const res = await finish(s, goodRun());

  assert.equal(res.status, 200);
  assert.equal(res.json.counted, true);
  // 4*10 + 2*3 + 1*15 + 100 win + 50 flawless + time bonus under par(240+2*80=400)
  assert.equal(res.json.war_score, 40 + 6 + 15 + 100 + 50 + Math.round((400 - 300) / 400 * 100));
  assert.equal(res.json.ranks.theater.rank, 1);

  const board = await get('/board?type=theater&map=0&diff=normal&player=' + PLAYER);
  assert.equal(board.status, 200);
  assert.equal(board.json.rows.length, 1);
  assert.equal(board.json.rows[0].value, 300);
  assert.equal(board.json.me.rank, 1);
});

suite('the client never gets to name its own score', async () => {
  const s = await startRun({ player: 'score-liar-0001' });
  backdate(s.session_id, 400);
  // A client that helpfully includes a war_score of a million is simply ignored:
  // the server computes from the facts and never reads that field.
  const res = await finish(s, goodRun({ war_score: 1000000, mastery: 999999 }),
    { player: 'score-liar-0001' });
  assert.equal(res.status, 200);
  assert.ok(res.json.war_score < 1000, 'server-computed score, not the client\'s');
});

// ---- forgery -----------------------------------------------------------------------

suite('an unsigned or wrongly signed submission is refused', async () => {
  const s = await startRun({ player: 'forger-0001' });
  backdate(s.session_id, 400);

  const bad = await finish(s, goodRun(), { badSig: true, player: 'forger-0001' });
  assert.equal(bad.status, 401);
  assert.equal(bad.json.error, 'bad-signature');

  // and the session survives a failed attempt, so an honest retry still works
  const good = await finish(s, goodRun(), { player: 'forger-0001' });
  assert.equal(good.status, 200);
});

suite('a session cannot be replayed', async () => {
  const s = await startRun({ player: 'replay-0001' });
  backdate(s.session_id, 400);
  const first = await finish(s, goodRun(), { player: 'replay-0001' });
  assert.equal(first.status, 200);

  const second = await finish(s, goodRun(), { player: 'replay-0001' });
  assert.equal(second.status, 409, 'the same war cannot be submitted twice');
});

suite('a submission signed for one session cannot be moved onto another', async () => {
  const a = await startRun({ player: 'swap-0001' });
  const b = await startRun({ player: 'swap-0001' });
  backdate(b.session_id, 400);
  // sign with session A's nonce but submit against session B
  const body = JSON.stringify(Object.assign(
    { session_id: b.session_id, player_id: 'swap-0001' }, goodRun()));
  const res = await fetch(base + '/run/finish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-IT-Sig': sign(a.nonce, body) },
    body,
  });
  assert.equal(res.status, 401);
});

suite('a session belonging to another player is refused', async () => {
  const s = await startRun({ player: 'owner-0001' });
  backdate(s.session_id, 400);
  const res = await finish(s, goodRun(), { player: 'thief-0001' });
  assert.equal(res.status, 400);
  assert.equal(res.json.error, 'session-mismatch');
});

// ---- the time lock -----------------------------------------------------------------

suite('you cannot claim to have played longer than the session was open', async () => {
  const s = await startRun({ player: 'timelord-0001' });
  // no backdating: the handshake was seconds ago, so a 300-second war is a lie
  const res = await finish(s, goodRun(), { player: 'timelord-0001' });
  assert.equal(res.status, 200, 'stored for review rather than rejected outright');
  assert.equal(res.json.counted, false, 'but it does not count');

  const row = runBySession(s.session_id);
  assert.equal(row.status, 'flagged');
  assert.match(row.flags, /duration-exceeds-wallclock/);
});

suite('an impossibly fast victory is flagged', async () => {
  const s = await startRun({ player: 'speedy-0001' });
  backdate(s.session_id, 400);
  const res = await finish(s, goodRun({ duration_s: 3, stars: 3 }), { player: 'speedy-0001' });
  assert.equal(res.json.counted, false);
  assert.match(runBySession(s.session_id).flags, /duration-floor/);
});

// ---- plausibility ------------------------------------------------------------------

suite('sinking more ships than the game could have spawned is flagged', async () => {
  const s = await startRun({ player: 'grinder-0001', map: 0 });
  backdate(s.session_id, 400);
  // Training Bay has 2 enemies; 400 seconds of maximal reinforcement cannot reach 500.
  const res = await finish(s, goodRun({ sunk: 500, career: { sunk: 500, planes: 2, islands: 1, wins: 1, bosses: 0, score: 500 * 2 + 2 + 5 + 40 } }), { player: 'grinder-0001' });
  assert.equal(res.json.counted, false);
  assert.match(runBySession(s.session_id).flags, /sunk/);
});

suite('a generous but real run on a small map still counts', async () => {
  const s = await startRun({ player: 'honest-0001', map: 0 });
  backdate(s.session_id, 900);
  // 900 seconds on Training Bay: 2 starting hulls plus reinforcements and offensives.
  // A player who fought the whole time and sank 30 is believable and must not be flagged.
  const res = await finish(s, goodRun({
    duration_s: 880, sunk: 30, planes: 10, islands: 2, ships_lost: 1, stars: 1,
    career: { sunk: 30, planes: 10, islands: 2, wins: 1, bosses: 0, score: 60 + 10 + 10 + 40 },
  }), { player: 'honest-0001' });
  assert.equal(res.json.counted, true, 'honest big run must not be flagged: ' +
    JSON.stringify(runBySession(s.session_id).flags));
});

suite('the star rating is computed by the server, not claimed by the client', async () => {
  const s = await startRun({ player: 'starliar-0001', map: 0 });
  backdate(s.session_id, 900);
  // Lost two ships and finished well over par (240 + 2*80 = 400s), so this is a
  // one-star run no matter what the client puts in the field.
  const res = await finish(s, goodRun({ duration_s: 880, ships_lost: 2, stars: 3 }), { player: 'starliar-0001' });
  assert.equal(res.json.counted, true, 'a real run, just not a three-star one');
  assert.equal(runBySession(s.session_id).stars, 1);
});

suite('sinking a fleet on a theater with no fleet is flagged', async () => {
  // map 1, "The Landing", is a pure land assault: enemies: 0
  const s = await startRun({ player: 'landlubber-0001', map: 1 });
  backdate(s.session_id, 600);
  const res = await finish(s, goodRun({
    duration_s: 500, sunk: 60, planes: 0, islands: 6, stars: 1, ships_lost: 1,
    career: { sunk: 60, planes: 0, islands: 6, wins: 1, bosses: 0, score: 120 + 30 + 40 },
  }), { player: 'landlubber-0001' });
  assert.equal(res.json.counted, false);
  assert.match(runBySession(s.session_id).flags, /sunk/);
});

suite('a quick battle win below the kill goal is flagged', async () => {
  const s = await startRun({ player: 'quickliar-0001', mode: 'quick', map: -1 });
  backdate(s.session_id, 300);
  const res = await finish(s, goodRun({ duration_s: 200, sunk: 1, stars: 0 }), { player: 'quickliar-0001' });
  assert.equal(res.json.counted, false);
  assert.match(runBySession(s.session_id).flags, /quick-goal/);
});

// ---- the career ladder -------------------------------------------------------------

suite('a career score that does not add up is kept off the career board', async () => {
  const p = 'careerliar-0001';
  const s = await startRun({ player: p });
  backdate(s.session_id, 400);
  // counters say ~53 points; the score field claims a million
  const res = await finish(s, goodRun({
    career: { sunk: 4, planes: 2, islands: 1, wins: 1, bosses: 0, score: 1000000 },
  }), { player: p });
  assert.equal(res.status, 200);

  const row = runBySession(s.session_id);
  assert.equal(row.career_ok, 0);
  assert.match(row.flags, /career-inconsistent/);

  const board = await get('/board?type=career&player=' + p);
  assert.ok(!board.json.rows.some((r) => r.value === 1000000), 'the faked total is not on the board');
});

suite('an edited save that teleports the career is caught on the next submission', async () => {
  const p = 'saveedit-0001';
  const s1 = await startRun({ player: p });
  backdate(s1.session_id, 400);
  await finish(s1, goodRun(), { player: p });

  // now the player edits localStorage: career.sunk becomes 99999
  const s2 = await startRun({ player: p });
  backdate(s2.session_id, 400);
  const cheated = { sunk: 99999, planes: 2, islands: 1, wins: 2, bosses: 0 };
  cheated.score = cheated.sunk * 2 + cheated.planes + cheated.islands * 5 + cheated.wins * 40;
  const res = await finish(s2, goodRun({ career: cheated }), { player: p });

  assert.equal(res.status, 200);
  const row = runBySession(s2.session_id);
  assert.equal(row.career_ok, 0, 'the jump is not believed');
  assert.match(row.flags, /career-jump/);
});

suite('honest career growth across a long offline gap is NOT flagged', async () => {
  const p = 'offline-0001';
  const s1 = await startRun({ player: p });
  backdate(s1.session_id, 400);
  await finish(s1, goodRun(), { player: p });

  // pretend that first run happened four hours ago, then come back having played
  // several wars in the meantime — this must not read as an edited save
  db.prepare('UPDATE runs SET created_at = created_at - 14400 WHERE player_id = ?').run(p);

  const s2 = await startRun({ player: p });
  backdate(s2.session_id, 400);
  const grown = { sunk: 60, planes: 30, islands: 12, wins: 6, bosses: 2 };
  grown.score = grown.sunk * 2 + grown.planes + grown.islands * 5 + grown.wins * 40 + grown.bosses * 25;
  const res = await finish(s2, goodRun({ career: grown }), { player: p });

  assert.equal(res.status, 200);
  const row = runBySession(s2.session_id);
  assert.equal(row.career_ok, 1, 'flags were: ' + row.flags);
});

// ---- practice, privacy, admin --------------------------------------------------------

suite('a practice run is recorded but never shown', async () => {
  const p = 'practice-0001';
  const s = await startRun({ player: p });
  backdate(s.session_id, 400);
  const res = await finish(s, goodRun({ practice: true, duration_s: 30 }), { player: p });

  assert.equal(res.status, 200);
  assert.equal(res.json.practice, true);
  assert.equal(res.json.counted, false);
  assert.equal(runBySession(s.session_id).status, 'practice');

  const board = await get('/board?type=theater&map=0&diff=normal&player=' + p);
  assert.equal(board.json.me, null, 'a practice run puts nobody on the board');
});

suite('forget hides every run a device ever submitted', async () => {
  const p = 'forgetme-0001';
  const s = await startRun({ player: p });
  backdate(s.session_id, 400);
  await finish(s, goodRun(), { player: p });

  let board = await get('/board?type=theater&map=0&diff=normal&player=' + p);
  assert.ok(board.json.me, 'on the board first');

  const res = await post('/forget', { player_id: p });
  assert.equal(res.status, 200);
  assert.ok(res.json.hidden >= 1);

  board = await get('/board?type=theater&map=0&diff=normal&player=' + p);
  assert.equal(board.json.me, null, 'gone afterwards');
});

suite('a banned device is shadow-banned, not told', async () => {
  const p = 'banned-0001';
  const s0 = await startRun({ player: p });
  backdate(s0.session_id, 400);
  await finish(s0, goodRun(), { player: p });
  db.prepare('UPDATE players SET banned = 1 WHERE player_id = ?').run(p);

  const s = await startRun({ player: p });
  backdate(s.session_id, 400);
  const res = await finish(s, goodRun({ duration_s: 100 }), { player: p });
  assert.equal(res.status, 200, 'the reply looks completely normal');
  assert.equal(runBySession(s.session_id).status, 'hidden');

  const board = await get('/board?type=theater&map=0&diff=normal');
  assert.ok(!board.json.rows.some((r) => r.value === 100), 'but nothing reaches the board');
});

suite('the wordlist is the only source of names', async () => {
  const res = await post('/run/start', {
    player_id: 'namehacker-001',
    callsign: { a: 9999, b: 0 },
    mode: 'campaign', map_idx: 0, difficulty: 'normal',
  });
  assert.equal(res.status, 400);
  assert.equal(res.json.error, 'bad-callsign');
});

suite('admin data needs the token', async () => {
  const anon = await fetch(base + '/admin/data');
  assert.equal(anon.status, 401);

  const authed = await fetch(base + '/admin/data', { headers: { 'X-Admin-Token': 'test-token' } });
  assert.equal(authed.status, 200);
  const data = await authed.json();
  assert.ok(data.stats.runs > 0);
  assert.ok(data.rows.length > 0);
  assert.ok(data.rows[0].callsign_en, 'admin view renders the callsign for a human');
});

suite('oversized and malformed bodies are refused', async () => {
  const big = await fetch(base + '/run/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: 'x'.repeat(20000) }),
  }).then((r) => r.status);
  assert.ok(big === 413 || big === 400, 'got ' + big);

  const junk = await fetch(base + '/run/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not json',
  });
  assert.equal(junk.status, 400);
});

suite('board queries reject junk parameters', async () => {
  assert.equal((await get('/board?type=nope')).status, 400);
  assert.equal((await get('/board?type=theater&map=999&diff=normal')).status, 400);
  assert.equal((await get('/board?type=war&diff=impossible')).status, 400);
});
