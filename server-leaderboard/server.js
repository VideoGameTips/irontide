// ===== IRON TIDE LEADERBOARD SERVER =====
//
// Plain node:http — no framework. The whole surface is six endpoints and the
// dependency list is one native module, which is the right trade for something that
// runs unattended on a small VPS next to nine other games.
//
// THREAT MODEL, STATED HONESTLY
// The game is a client-authoritative browser game. Nothing here can make cheating
// impossible, and any design that claims otherwise is lying. What this server does:
//
//   · the score formula lives on the server, so "POST 999999" is not a thing        (L0)
//   · every run needs a handshake, and the server times it — to claim a 40-second
//     victory you must actually wait 40 seconds after the handshake                 (L1)
//   · every submission is HMAC-signed with a server-issued, single-use nonce, so a
//     replayed or hand-rolled request fails without reading and reimplementing the
//     client's signing code                                                          (L2)
//   · what a run claims is checked against what the game's own spawn constants make
//     possible in that much wall-clock time                                          (L3)
//   · anything that fails is stored but never shown, and a parent can hide runs or
//     shadow-ban a device from the admin page                                        (L5)
//
// The goal is that casual cheating fails outright, serious cheating costs more than
// it is worth, and the honest kid at the top of the board stays there.
//
// PRIVACY
// Stored per run: a random device UUID, two wordlist indexes, and game numbers.
// No account, no email, no free-text name, no IP address in the clear — only a
// salted hash used for rate limiting, wiped after IP_RETENTION_DAYS.

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DB = require('./db');
const SC = require('./scoring');
const CS = require('../js/callsigns.js');

// ---- config ----------------------------------------------------------------------

const PORT = Number(process.env.PORT || 7781);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '.data');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const IP_SALT = process.env.IP_SALT || 'dev-only-salt-change-me';
const WEEK_TZ_OFFSET_MIN = Number(process.env.WEEK_TZ_OFFSET_MIN || -480);  // Pacific
const IP_RETENTION_DAYS = Number(process.env.IP_RETENTION_DAYS || 30);
const DEV_CORS = process.env.DEV_CORS === '1';

const MAX_BODY = 8 * 1024;
const SESSION_MAX_AGE_S = 4 * 3600;      // a war left open longer than this is abandoned
const BOARD_SCAN_LIMIT = 5000;           // rows pulled to compute "your rank"
const API_PREFIX = '/irontide-api';

const db = DB.open(DATA_DIR);
const S = DB.prepare(db);

// ---- small helpers ---------------------------------------------------------------

const nowSec = () => Math.floor(Date.now() / 1000);

function hashIp(ip) {
  return crypto.createHmac('sha256', IP_SALT).update(String(ip || '')).digest('hex').slice(0, 16);
}

// We bind to loopback, so the only thing that can reach us is Caddy on the same host.
// That is what makes X-Forwarded-For trustworthy here — nothing else can set it.
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket.remoteAddress || '';
}

function json(res, code, body, extraHeaders) {
  const payload = JSON.stringify(body);
  res.writeHead(code, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }, extraHeaders || {}));
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0, over = false;
    const chunks = [];
    req.on('data', (c) => {
      if (over) return;
      size += c.length;
      if (size > MAX_BODY) {
        // Drain rather than destroy. Tearing the socket down here means the caller
        // gets a connection reset instead of the 413 we are trying to tell them about.
        over = true;
        chunks.length = 0;
        req.resume();
        reject(new Error('body-too-large'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => { if (!over) resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function intOr(v, dflt) {
  return Number.isFinite(v) && Number.isInteger(v) ? v : dflt;
}

// ---- rate limiting ---------------------------------------------------------------
// In-memory sliding windows. Restarting the process forgives everyone, which is fine:
// these limits exist to stop a script hammering the box, not to punish anyone.

const buckets = new Map();

function rateLimit(key, limit, windowS) {
  const t = nowSec();
  let hits = buckets.get(key);
  if (!hits) { hits = []; buckets.set(key, hits); }
  while (hits.length && hits[0] <= t - windowS) hits.shift();
  if (hits.length >= limit) return false;
  hits.push(t);
  return true;
}

setInterval(() => {
  const cutoff = nowSec() - 3600;
  for (const [k, hits] of buckets) {
    while (hits.length && hits[0] <= cutoff) hits.shift();
    if (!hits.length) buckets.delete(k);
  }
}, 10 * 60 * 1000).unref();

// ---- retention -------------------------------------------------------------------

function runRetention() {
  try {
    S.purgeIps.run(nowSec() - IP_RETENTION_DAYS * 86400);
    S.purgeSessions.run(nowSec() - 7 * 86400);
  } catch (e) {
    console.error('[retention]', e.message);
  }
}
runRetention();
setInterval(runRetention, 6 * 3600 * 1000).unref();

// ---- board helpers ---------------------------------------------------------------

function sinceFor(window) {
  return window === 'week' ? SC.weekStart(Date.now(), WEEK_TZ_OFFSET_MIN) : 0;
}

function runBoard(type, opts) {
  const args = { since: sinceFor(opts.window), limit: BOARD_SCAN_LIMIT };
  if (type === 'theater') return S.boardTheater.all(Object.assign({ map: opts.map, diff: opts.diff }, args));
  if (type === 'war') return S.boardWar.all(Object.assign({ diff: opts.diff }, args));
  if (type === 'career') return S.boardCareer.all(args);
  if (type === 'mastery') return S.boardMastery.all(args);
  return null;
}

function shapeRows(rows, offset) {
  return rows.map((r, i) => ({
    rank: offset + i + 1,
    a: r.callsign_a, b: r.callsign_b,
    tag: CS.callsignTag(r.player_id),
    value: r.value,
    stars: r.stars,
    shipsLost: r.ships_lost,
    map: r.map_idx,
    sunk: r.sunk,
    starsTotal: r.stars_total,
    medals: r.medals,
    completed: r.completed,
    // Deliberately no timestamp. The UI never showed one, and /board is public, so
    // including it would publish when each child sits down to play.
  }));
}

function rankOf(rows, playerId) {
  if (!playerId) return null;
  const i = rows.findIndex((r) => r.player_id === playerId);
  if (i < 0) return null;
  return { rank: i + 1, value: rows[i].value };
}

// ---- routes ----------------------------------------------------------------------

async function handleStart(req, res, ipHash) {
  const body = parseJson(await readBody(req));
  if (!body) return json(res, 400, { error: 'bad-json' });

  const playerId = String(body.player_id || '');
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(playerId)) return json(res, 400, { error: 'bad-player-id' });

  const a = intOr(body.callsign && body.callsign.a, -1);
  const b = intOr(body.callsign && body.callsign.b, -1);
  if (!CS.callsignValid(a, b)) return json(res, 400, { error: 'bad-callsign' });

  if (!SC.MODES.includes(body.mode)) return json(res, 400, { error: 'bad-mode' });
  if (!SC.DIFFICULTIES.includes(body.difficulty)) return json(res, 400, { error: 'bad-difficulty' });
  const mapIdx = intOr(body.map_idx, -1);

  if (!rateLimit(`start:${playerId}`, 40, 3600)) return json(res, 429, { error: 'rate' });
  if (!rateLimit(`start:ip:${ipHash}`, 120, 3600)) return json(res, 429, { error: 'rate' });

  const t = nowSec();
  S.upsertPlayer.run({ player_id: playerId, a, b, now: t });

  const id = crypto.randomUUID();
  const nonce = crypto.randomBytes(16).toString('hex');
  S.insertSession.run({
    id, player_id: playerId, nonce,
    map_idx: mapIdx, mode: body.mode, difficulty: body.difficulty, started_at: t,
  });

  return json(res, 200, { session_id: id, nonce, server_time: t });
}

async function handleFinish(req, res, ipHash) {
  const raw = await readBody(req);
  const body = parseJson(raw);
  if (!body) return json(res, 400, { error: 'bad-json' });

  const sessionId = String(body.session_id || '');
  const sess = S.getSession.get(sessionId);
  if (!sess) return json(res, 400, { error: 'no-session' });

  const playerId = String(body.player_id || '');
  if (playerId !== sess.player_id) return json(res, 400, { error: 'session-mismatch' });

  if (!rateLimit(`finish:${playerId}`, 40, 3600)) return json(res, 429, { error: 'rate' });

  const t = nowSec();
  if (t - sess.started_at > SESSION_MAX_AGE_S) return json(res, 400, { error: 'session-expired' });

  // L2 — signature over the exact bytes we received, keyed by the nonce this session
  // was issued. No shared secret is committed anywhere: the key is minted per war and
  // dies with it, so a replayed body fails and a hand-rolled one has to reproduce the
  // client's signing to get anywhere.
  const sig = String(req.headers['x-it-sig'] || '');
  const expect = crypto.createHmac('sha256', Buffer.from(sess.nonce, 'utf8')).update(raw).digest('hex');
  if (!safeEqual(sig, expect)) return json(res, 401, { error: 'bad-signature' });

  // Single-use, claimed before any further work so two racing requests cannot both win.
  if (S.useSession.run(sessionId).changes !== 1) return json(res, 409, { error: 'session-used' });

  const elapsed = t - sess.started_at;

  const r = {
    player_id: playerId,
    session_id: sessionId,
    mode: sess.mode,                 // taken from the handshake, not from this body:
    map_idx: sess.map_idx,           // otherwise you could start an easy war and
    difficulty: sess.difficulty,     // finish it as a hard one
    won: body.won ? 1 : 0,
    duration_s: intOr(body.duration_s, -1),
    sunk: intOr(body.sunk, -1),
    planes: intOr(body.planes, -1),
    islands: intOr(body.islands, -1),
    bosses: intOr(body.bosses, -1),
    ships_lost: intOr(body.ships_lost, -1),
  };
  // Derived here, never accepted from the client — see the note in validateRun().
  r.stars = SC.starsFor(r);

  const check = SC.validateRun(r, elapsed);

  // ---- career snapshot ----
  const career = body.career || {};
  const careerScore = intOr(career.score, -1);
  const player = S.getPlayer.get(playerId);
  const lastAt = (S.lastRunAt.get(playerId) || {}).t || 0;
  const gap = lastAt ? Math.max(0, t - lastAt) : 0;

  let careerOk = 1;
  const careerFlags = [];
  if (careerScore < 0) { careerOk = 0; careerFlags.push('career-missing'); }
  else if (SC.careerScoreOf(career) !== careerScore) { careerOk = 0; careerFlags.push('career-inconsistent'); }
  else if (player && careerScore > player.best_career) {
    const delta = careerScore - player.best_career;
    if (delta > SC.maxCareerDelta(elapsed, gap)) { careerOk = 0; careerFlags.push('career-jump'); }
  }

  const starsTotal = Math.max(0, intOr(body.stars_total, 0));
  const medals = Math.max(0, intOr(body.medals, 0));
  const completed = body.completed ? 1 : 0;

  // ---- status ----
  // A run that used the money cheat is recorded rather than dropped: career score is
  // cumulative and the delta check above would otherwise flag the NEXT honest run for
  // the growth that happened while we were not looking.
  let status = 'ok';
  const flags = check.reasons.concat(careerFlags);
  if (body.practice) status = 'practice';
  else if (!check.ok) status = 'flagged';
  if (player && player.banned) status = 'hidden';   // shadow-ban: they see a normal reply

  const row = Object.assign({}, r, {
    war_score: check.ok ? SC.warScore(r) : 0,
    career_score: Math.max(0, careerScore),
    career_ok: careerOk && status === 'ok' ? 1 : 0,
    stars_total: starsTotal,
    medals,
    completed,
    mastery: SC.masteryScore(starsTotal, medals, completed),
    client_ver: String(body.client_ver || '').slice(0, 32),
    elapsed_s: elapsed,
    status,
    flags: flags.length ? flags.join(',') : null,
    ip_hash: ipHash,
    created_at: t,
  });

  try {
    S.insertRun.run(row);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return json(res, 409, { error: 'duplicate' });
    throw e;
  }
  S.touchPlayerRun.run({
    player_id: playerId, now: t,
    career: row.career_ok ? row.career_score : 0,
  });

  // Ranks for the screen the player is looking at right now.
  const ranks = {};
  if (status === 'ok') {
    if (r.mode === 'campaign' && r.won) {
      const rows = runBoard('theater', { map: r.map_idx, diff: r.difficulty, window: 'all' });
      ranks.theater = rankOf(rows, playerId);
    }
    ranks.war = rankOf(runBoard('war', { diff: r.difficulty, window: 'all' }), playerId);
    if (row.career_ok) {
      ranks.career = rankOf(runBoard('career', { window: 'all' }), playerId);
      ranks.mastery = rankOf(runBoard('mastery', { window: 'all' }), playerId);
    }
  }

  return json(res, 200, {
    ok: true,
    counted: status === 'ok',
    practice: status === 'practice',
    war_score: row.war_score,
    ranks,
  });
}

function handleBoard(req, res, url) {
  const q = url.searchParams;
  const type = q.get('type') || 'theater';
  if (!['theater', 'war', 'career', 'mastery'].includes(type)) return json(res, 400, { error: 'bad-type' });

  const diff = q.get('diff') || 'normal';
  if (!SC.DIFFICULTIES.includes(diff)) return json(res, 400, { error: 'bad-difficulty' });

  const map = Number(q.get('map'));
  if (type === 'theater' && !SC.theaterOf(map)) return json(res, 400, { error: 'bad-map' });

  const window = q.get('window') === 'week' ? 'week' : 'all';
  const limit = Math.min(50, Math.max(1, Number(q.get('limit')) || 10));

  // The device id travels in a header, NEVER in the query string. Caddy logs full
  // request URIs, so a `?player=` parameter would write this pseudonymous identifier
  // into the access log next to the client IP — precisely the pairing that hashing the
  // IP in our own database was meant to prevent.
  const player = String(req.headers['x-it-player'] || '');

  const rows = runBoard(type, { map, diff, window });
  const me = rankOf(rows, player);

  const out = { type, diff, window, total: rows.length, rows: shapeRows(rows.slice(0, limit), 0), me: null };
  // If the player is on the board but below the cut, hand back their own line too —
  // being 47th and able to see it beats not appearing at all.
  if (me) {
    out.me = Object.assign({ rank: me.rank }, shapeRows([rows[me.rank - 1]], me.rank - 1)[0]);
  }
  return json(res, 200, out);
}

async function handleForget(req, res) {
  const body = parseJson(await readBody(req));
  if (!body) return json(res, 400, { error: 'bad-json' });
  const playerId = String(body.player_id || '');
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(playerId)) return json(res, 400, { error: 'bad-player-id' });
  if (!rateLimit(`forget:${playerId}`, 5, 3600)) return json(res, 429, { error: 'rate' });
  const n = S.forgetPlayer.run(playerId).changes;
  return json(res, 200, { ok: true, hidden: n });
}

// ---- admin -----------------------------------------------------------------------

function adminAuthed(req) {
  if (!ADMIN_TOKEN) return false;
  return safeEqual(req.headers['x-admin-token'] || '', ADMIN_TOKEN);
}

async function handleAdmin(req, res, url) {
  // The page itself is inert HTML — it asks for the token and sends it as a header, so
  // the token never lands in a URL and therefore never lands in Caddy's access log.
  if (req.method === 'GET' && url.pathname === '/admin') {
    const html = fs.readFileSync(path.join(__dirname, 'admin.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }
  if (!adminAuthed(req)) return json(res, 401, { error: 'unauthorized' });

  if (req.method === 'GET' && url.pathname === '/admin/data') {
    const which = url.searchParams.get('which') === 'flagged' ? 'adminFlagged' : 'adminRecent';
    const rows = S[which].all(200).map((r) => Object.assign({}, r, {
      callsign_en: CS.callsignText(r.callsign_a, r.callsign_b, false, r.player_id),
      callsign_zh: CS.callsignText(r.callsign_a, r.callsign_b, true, r.player_id),
    }));
    return json(res, 200, { rows, stats: S.stats.get() });
  }

  if (req.method === 'POST' && url.pathname === '/admin/action') {
    const body = parseJson(await readBody(req));
    if (!body) return json(res, 400, { error: 'bad-json' });
    if (body.action === 'status' && ['ok', 'hidden', 'flagged'].includes(body.status)) {
      S.setRunStatus.run(body.status, Number(body.id));
      return json(res, 200, { ok: true });
    }
    if (body.action === 'ban') {
      S.banPlayer.run(body.banned ? 1 : 0, String(body.player_id));
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: 'bad-action' });
  }
  return json(res, 404, { error: 'not-found' });
}

// ---- plumbing --------------------------------------------------------------------

function parseJson(buf) {
  try {
    const v = JSON.parse(buf.toString('utf8'));
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null;
  } catch (e) { return null; }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  // Caddy strips the prefix with handle_path; stripping it again here means the same
  // URLs work whether you go through the proxy or hit the port directly.
  if (url.pathname.startsWith(API_PREFIX)) url.pathname = url.pathname.slice(API_PREFIX.length) || '/';

  if (DEV_CORS) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    // Every custom header the client sends must be listed, or the browser's preflight
    // rejects the request before it is ever made. Production is same-origin and never
    // preflights, so a gap here only ever shows up in local development.
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-IT-Sig, X-IT-Player, X-Admin-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  }

  const ipHash = hashIp(clientIp(req));

  Promise.resolve()
    .then(() => {
      if (url.pathname === '/health') return json(res, 200, { ok: true, schema: DB.SCHEMA_VERSION });

      if (url.pathname.startsWith('/admin')) return handleAdmin(req, res, url);

      if (req.method === 'POST' && url.pathname === '/run/start') return handleStart(req, res, ipHash);
      if (req.method === 'POST' && url.pathname === '/run/finish') return handleFinish(req, res, ipHash);
      if (req.method === 'POST' && url.pathname === '/forget') return handleForget(req, res);

      if (req.method === 'GET' && url.pathname === '/board') {
        if (!rateLimit(`board:ip:${ipHash}`, 240, 300)) return json(res, 429, { error: 'rate' });
        return handleBoard(req, res, url);
      }
      return json(res, 404, { error: 'not-found' });
    })
    .catch((e) => {
      if (e && e.message === 'body-too-large') return json(res, 413, { error: 'too-large' }, { Connection: 'close' });
      console.error('[error]', req.method, url.pathname, e && e.stack || e);
      if (!res.headersSent) json(res, 500, { error: 'server' });
    });
});

if (require.main === module) {
  if (!ADMIN_TOKEN) console.warn('[warn] ADMIN_TOKEN unset — the admin page is disabled');
  if (IP_SALT === 'dev-only-salt-change-me') console.warn('[warn] IP_SALT is the default — set a real one in production');
  server.listen(PORT, HOST, () => console.log(`iron tide leaderboard on http://${HOST}:${PORT}`));
}

module.exports = { server, db, S };
