// ===== LEADERBOARD STORAGE =====
//
// SQLite via better-sqlite3: one file, no daemon, synchronous API. The whole dataset
// is a few thousand rows of a kid's naval game, so the boards are computed by querying
// live rather than by maintaining rollup tables — there is nothing here worth the bugs
// that denormalization would buy.
//
// WHERE THE FILE LIVES MATTERS. It must sit outside the git checkout, because the
// deploy path on the VPS is `git reset --hard`, which would take the database with it.
// DATA_DIR is set by the systemd unit to /var/lib/irontide-leaderboard.

const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const SCHEMA_VERSION = 1;

function open(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, 'leaderboard.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

function migrate(db) {
  const have = db.pragma('user_version', { simple: true });
  if (have >= SCHEMA_VERSION) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      player_id   TEXT PRIMARY KEY,
      callsign_a  INTEGER NOT NULL,
      callsign_b  INTEGER NOT NULL,
      banned      INTEGER NOT NULL DEFAULT 0,
      first_seen  INTEGER NOT NULL,
      last_seen   INTEGER NOT NULL,
      last_run_at INTEGER,
      best_career INTEGER NOT NULL DEFAULT 0
    );

    -- One row per handshake. The server's own timestamp here is what makes a fast
    -- time expensive to fake: to claim 40 seconds you have to actually wait 40.
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      player_id   TEXT NOT NULL,
      nonce       TEXT NOT NULL,
      map_idx     INTEGER,
      mode        TEXT NOT NULL,
      difficulty  TEXT NOT NULL,
      started_at  INTEGER NOT NULL,
      used        INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);

    CREATE TABLE IF NOT EXISTS runs (
      id           INTEGER PRIMARY KEY,
      player_id    TEXT NOT NULL,
      session_id   TEXT NOT NULL UNIQUE,
      mode         TEXT NOT NULL,
      map_idx      INTEGER,
      difficulty   TEXT NOT NULL,
      won          INTEGER NOT NULL,
      duration_s   INTEGER NOT NULL,
      sunk         INTEGER NOT NULL,
      planes       INTEGER NOT NULL,
      islands      INTEGER NOT NULL,
      bosses       INTEGER NOT NULL,
      ships_lost   INTEGER NOT NULL,
      stars        INTEGER NOT NULL,
      war_score    INTEGER NOT NULL,
      career_score INTEGER NOT NULL,
      career_ok    INTEGER NOT NULL DEFAULT 1,
      stars_total  INTEGER NOT NULL DEFAULT 0,
      medals       INTEGER NOT NULL DEFAULT 0,
      completed    INTEGER NOT NULL DEFAULT 0,
      mastery      INTEGER NOT NULL DEFAULT 0,
      client_ver   TEXT NOT NULL,
      elapsed_s    INTEGER NOT NULL,
      status       TEXT NOT NULL DEFAULT 'ok',
      flags        TEXT,
      ip_hash      TEXT,
      created_at   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_runs_theater ON runs(mode, map_idx, difficulty, won, status);
    CREATE INDEX IF NOT EXISTS idx_runs_war     ON runs(difficulty, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_runs_player  ON runs(player_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at);
  `);
  db.pragma(`user_version = ${SCHEMA_VERSION}`);
}

// ---- statements ------------------------------------------------------------------

function prepare(db) {
  const S = {
    upsertPlayer: db.prepare(`
      INSERT INTO players (player_id, callsign_a, callsign_b, first_seen, last_seen)
      VALUES (@player_id, @a, @b, @now, @now)
      ON CONFLICT(player_id) DO UPDATE SET
        callsign_a = @a, callsign_b = @b, last_seen = @now
    `),
    getPlayer: db.prepare(`SELECT * FROM players WHERE player_id = ?`),
    banPlayer: db.prepare(`UPDATE players SET banned = ? WHERE player_id = ?`),

    insertSession: db.prepare(`
      INSERT INTO sessions (id, player_id, nonce, map_idx, mode, difficulty, started_at)
      VALUES (@id, @player_id, @nonce, @map_idx, @mode, @difficulty, @started_at)
    `),
    getSession: db.prepare(`SELECT * FROM sessions WHERE id = ?`),
    useSession: db.prepare(`UPDATE sessions SET used = 1 WHERE id = ? AND used = 0`),

    insertRun: db.prepare(`
      INSERT INTO runs (player_id, session_id, mode, map_idx, difficulty, won, duration_s,
                        sunk, planes, islands, bosses, ships_lost, stars, war_score,
                        career_score, career_ok, stars_total, medals, completed, mastery,
                        client_ver, elapsed_s, status, flags, ip_hash, created_at)
      VALUES (@player_id, @session_id, @mode, @map_idx, @difficulty, @won, @duration_s,
              @sunk, @planes, @islands, @bosses, @ships_lost, @stars, @war_score,
              @career_score, @career_ok, @stars_total, @medals, @completed, @mastery,
              @client_ver, @elapsed_s, @status, @flags, @ip_hash, @created_at)
    `),
    touchPlayerRun: db.prepare(`
      UPDATE players SET last_run_at = @now,
                         best_career = MAX(best_career, @career)
      WHERE player_id = @player_id
    `),

    forgetPlayer: db.prepare(`UPDATE runs SET status = 'hidden' WHERE player_id = ? AND status != 'hidden'`),

    // retention: an ip hash is only useful for the rate-limit window it was taken in
    purgeIps: db.prepare(`UPDATE runs SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < ?`),
    purgeSessions: db.prepare(`DELETE FROM sessions WHERE started_at < ?`),

    recentRuns: db.prepare(`
      SELECT * FROM runs WHERE player_id = ? ORDER BY created_at DESC LIMIT ?
    `),
    countRecentByPlayer: db.prepare(`
      SELECT COUNT(*) AS n FROM runs WHERE player_id = ? AND created_at > ?
    `),
    lastRunAt: db.prepare(`
      SELECT MAX(created_at) AS t FROM runs WHERE player_id = ?
    `),

    // ---- boards ----
    // Bare columns alongside MIN()/MAX() are well-defined in SQLite: they come from the
    // row that produced the extreme value. The callsign deliberately comes from players
    // rather than the run, so renaming your captain updates the whole board.
    boardTheater: db.prepare(`
      SELECT r.player_id, p.callsign_a, p.callsign_b,
             MIN(r.duration_s) AS value, r.stars, r.ships_lost, r.created_at
      FROM runs r JOIN players p ON p.player_id = r.player_id
      WHERE r.status = 'ok' AND p.banned = 0 AND r.mode = 'campaign'
        AND r.map_idx = @map AND r.difficulty = @diff AND r.won = 1
        AND r.created_at >= @since
      GROUP BY r.player_id
      ORDER BY value ASC, r.created_at ASC
      LIMIT @limit
    `),
    boardWar: db.prepare(`
      SELECT r.player_id, p.callsign_a, p.callsign_b,
             MAX(r.war_score) AS value, r.map_idx, r.sunk, r.created_at
      FROM runs r JOIN players p ON p.player_id = r.player_id
      WHERE r.status = 'ok' AND p.banned = 0 AND r.difficulty = @diff
        AND r.created_at >= @since
      GROUP BY r.player_id
      ORDER BY value DESC, r.created_at ASC
      LIMIT @limit
    `),
    boardCareer: db.prepare(`
      SELECT r.player_id, p.callsign_a, p.callsign_b,
             MAX(r.career_score) AS value, r.created_at
      FROM runs r JOIN players p ON p.player_id = r.player_id
      WHERE r.status = 'ok' AND r.career_ok = 1 AND p.banned = 0
        AND r.created_at >= @since
      GROUP BY r.player_id
      ORDER BY value DESC, r.created_at ASC
      LIMIT @limit
    `),
    boardMastery: db.prepare(`
      SELECT r.player_id, p.callsign_a, p.callsign_b,
             MAX(r.mastery) AS value, r.stars_total, r.medals, r.completed, r.created_at
      FROM runs r JOIN players p ON p.player_id = r.player_id
      WHERE r.status = 'ok' AND r.career_ok = 1 AND p.banned = 0
        AND r.created_at >= @since
      GROUP BY r.player_id
      ORDER BY value DESC, r.created_at ASC
      LIMIT @limit
    `),

    // ---- admin ----
    adminRecent: db.prepare(`
      SELECT r.id, r.player_id, r.status, r.flags, r.mode, r.map_idx, r.difficulty,
             r.won, r.duration_s, r.sunk, r.war_score, r.career_score, r.created_at,
             p.callsign_a, p.callsign_b, p.banned
      FROM runs r LEFT JOIN players p ON p.player_id = r.player_id
      ORDER BY r.created_at DESC LIMIT ?
    `),
    adminFlagged: db.prepare(`
      SELECT r.id, r.player_id, r.status, r.flags, r.mode, r.map_idx, r.difficulty,
             r.won, r.duration_s, r.sunk, r.war_score, r.career_score, r.created_at,
             p.callsign_a, p.callsign_b, p.banned
      FROM runs r LEFT JOIN players p ON p.player_id = r.player_id
      WHERE r.status != 'ok' ORDER BY r.created_at DESC LIMIT ?
    `),
    setRunStatus: db.prepare(`UPDATE runs SET status = ? WHERE id = ?`),
    stats: db.prepare(`
      SELECT (SELECT COUNT(*) FROM runs) AS runs,
             (SELECT COUNT(*) FROM runs WHERE status = 'ok') AS ok_runs,
             (SELECT COUNT(*) FROM runs WHERE status = 'flagged') AS flagged,
             (SELECT COUNT(*) FROM runs WHERE status = 'practice') AS practice,
             (SELECT COUNT(*) FROM players) AS players,
             (SELECT COUNT(*) FROM players WHERE banned = 1) AS banned
    `),
  };
  return S;
}

module.exports = { open, prepare, migrate, SCHEMA_VERSION };
