// Difficulty-curve measurement harness (#43). NOT part of the test suites — run manually:
//   node tests/sim/difficulty-sim.js            (full matrix: 6 theaters × 3 difficulties × N runs)
//   node tests/sim/difficulty-sim.js --pilot    (1 run, easy, theater 1 — sanity check)
//
// Methodology: boots the real game in headless Chrome and drives a scripted stand-in
// captain: buy 5 guns, sail WITH the allied fleet, circle broadside at gun range (never
// ram, never anchor), push the harbor once the sea fight is won. Fixed hull: battleship
// (tuning pilots showed a destroyer bot dies before producing comparable data). Each run
// gets a FRESH browser context (clean localStorage) so no career perk leaks between runs.
// Time advances by driving update(0.05) directly — a war resolves in seconds of wall clock.
// Outcomes: win (endGame true) / loss / death (first respawn-menu) / timeout.
//
// KNOWN LIMIT (and finding): the bot has every PASSIVE system — fleet screening, tender
// healing, auto-guns — but cannot use the two active player skills, manned long-range
// aimed fire and damage-control choices. Pilots show that without those, even easy
// Training Bay is unwinnable (fires stack 4 deep; all turrets get KO'd). Win-rate
// therefore reads near zero BY DESIGN; the comparable curve signal lives in survival
// time, ships sunk, and damage absorbed across theaters × difficulties.
//
// Theater note: index 1 (The Landing) is a pure ground assault — a foot-soldier bot is
// out of scope for harness v1, so the naval six measured are indices 0,2,3,4,5,6.
const { chromium } = require('@playwright/test');
const http = require('node:http');

const PILOT = process.argv.includes('--pilot');
const RUNS = PILOT ? 5 : 10;
const THEATERS = PILOT ? [0] : [0, 2, 3, 4, 5, 6];
const DIFFS = PILOT ? ['easy'] : ['easy', 'normal', 'hard'];
const MAX_SIM_SECONDS = 1500;
const GAME = 'http://localhost:3000/';
const SHIP = process.env.SIM_SHIP || 'battleship';  // fixed hull for the matrix — see methodology note

async function ensureServer() {
  const up = await new Promise(res => {
    http.get(GAME + 'health', r => res(r.statusCode === 200)).on('error', () => res(false));
  });
  if (!up) {
    const { spawn } = require('node:child_process');
    const p = spawn('node', ['server/server.js'], { stdio: 'ignore', detached: true });
    p.unref();
    await new Promise(r => setTimeout(r, 1200));
  }
}

/* eslint-disable no-undef */
const SIM_FN = async (cfg) => {
  setDifficulty(cfg.diff);
  currentMapIdx = cfg.mapIdx; currentSandboxIdx = -1;
  try{ localStorage.setItem('ironTideTutorialDone','1'); }catch(e){}
  let result = null;
  const _end = endGame;
  endGame = (w, m) => { if (!result) result = { outcome: w ? 'win' : 'loss', t: Math.round(t2 - warStartT2) }; _end(w, m); };
  const _resp = showRespawnMenu;
  showRespawnMenu = (...a) => { if (!result) result = { outcome: 'death', t: Math.round(t2 - warStartT2) }; _resp(...a); };
  startGame(cfg.ship||'destroyer'); skipBanner();
  // spend the war chest like a real captain: extra auto-firing deck guns are the
  // stand-in for the manned main battery a human brings to the fight
  for (const g of ['cannon', 'cannon', 'cannon', 'deckgun', 'deckgun']) { selectedWeapon = g; tryPlace(); }
  const t0 = t2;
  let lastHp = player.hp, hpLost = 0, peakGuns = placed.length;
  while (!result && t2 - t0 < cfg.maxT) {
    // --- scripted captain: pick a destination, steer the helm the way a thumb would ---
    let foe = null, bd = 1e9;
    enemies.forEach(e => { if (e.sinkT > 0 || e.proxy) return; const d = e.pos.distanceTo(player.pos); if (d < bd) { bd = d; foe = e; } });
    const huntingShip = foe && bd < 420;
    // sail WITH the escort, not ahead of it — the fleet screens, screens absorb, and the
    // game's own defeat tip ("stay close to your allies") is the policy here
    let fleet = null, fn = 0;
    allies.forEach(a => { if (a.sinkT > 0 || a.proxy || a.dead) return;
      if (!fleet) fleet = { x: 0, z: 0 }; fleet.x += a.pos.x; fleet.z += a.pos.z; fn++; });
    if (fleet) { fleet.x /= fn; fleet.z /= fn; }
    const farFromFleet = fleet && Math.hypot(fleet.x - player.pos.x, fleet.z - player.pos.z) > 300;
    // sea control achieved → press the objective even if the AI escort lingers behind
    const liveFoes = enemies.filter(e => !e.proxy && e.sinkT === 0 && !e.dead).length;
    const pushHarbor = enemyHarbor && (liveFoes === 0 || (liveFoes <= 2 && sunk >= 3));   // only after the sea fight is actually won
    const tgt = pushHarbor ? enemyHarbor.pos
      : (farFromFleet && !huntingShip) ? new THREE.Vector3(fleet.x, 0, fleet.z)
      : huntingShip ? foe.pos : (enemyHarbor ? enemyHarbor.pos : null);
    if (tgt && player) {
      const dx = tgt.x - player.pos.x, dz = tgt.z - player.pos.z, d = Math.hypot(dx, dz);
      let want = Math.atan2(dx, dz);
      // naval line tactics: close to gun range bow-on, then turn to circle broadside —
      // sim v1 charged straight in and died to ram detonations; v2 parked and got shot.
      const nearBand = pushHarbor ? 120 : 140, orbitBand = pushHarbor ? 235 : 260;
      if (d < nearBand) want += Math.PI;          // too close — open the range
      else if (d < orbitBand) want += Math.PI / 2; // circle broadside, don't ram or park
      // harbor orbit sits at ~180-230m, solidly inside autoGun's 260m shore-bombardment
      // range — orbiting at exactly 260 left the guns drifting in and out of range
      // (applies to the harbor too: autoGun bombards shore inside 260m, and a moving
      //  hull survives the harbor's return fire far longer than an anchored one)
      want = steerClearOfIslands(player.pos, player.def, want);   // same avoidance the NPC fleets use
      let err = want - player.heading;
      while (err > Math.PI) err -= 6.283185; while (err < -Math.PI) err += 6.283185;
      keys['KeyW'] = 1; keys['KeyS'] = 0;   // never anchor — motion is armor
      keys['KeyA'] = err > 0.12 ? 1 : 0;
      keys['KeyD'] = err < -0.12 ? 1 : 0;
    }
    for (let k = 0; k < 20 && !result; k++) {
      t2 += 0.05; update(0.05, t2);
      if (player) { if (player.hp < lastHp) hpLost += lastHp - player.hp; lastHp = Math.max(player.hp, 0); }
    }
    peakGuns = Math.max(peakGuns, placed.length);
    await new Promise(r => setTimeout(r, 0));
  }
  if (!result) result = { outcome: 'timeout', t: cfg.maxT };
  result.dmgTaken = Math.round(hpLost);
  result.sunk = sunk;
  return result;
};

(async () => {
  await ensureServer();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const rows = [];
  for (const diff of DIFFS) {
    for (const mapIdx of THEATERS) {
      const runs = [];
      for (let n = 0; n < RUNS; n++) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await ctx.newPage();
        try {
          await page.goto(GAME);
          await page.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object');
          await page.evaluate(() => { const b = document.getElementById('storyBtn'), s = document.getElementById('story');
            if (b && s && s.style.display === 'flex') b.click(); });
          const r = await page.evaluate(SIM_FN, { diff, mapIdx, maxT: MAX_SIM_SECONDS, ship: SHIP });
          runs.push(r);
          process.stdout.write(`${diff} T${mapIdx + 1} run${n + 1}: ${r.outcome} t=${r.t}s sunk=${r.sunk} dmg=${r.dmgTaken}\n`);
        } catch (e) {
          runs.push({ outcome: 'error', t: 0, dmgTaken: 0, sunk: 0 });
          process.stdout.write(`${diff} T${mapIdx + 1} run${n + 1}: ERROR ${String(e).slice(0, 120)}\n`);
        }
        await ctx.close();
      }
      const wins = runs.filter(r => r.outcome === 'win');
      rows.push({
        diff, theater: mapIdx + 1,
        winRate: Math.round(wins.length / runs.length * 100),
        avgSurvivalT: Math.round(runs.reduce((s, r) => s + r.t, 0) / runs.length),
        avgDmg: Math.round(runs.reduce((s, r) => s + r.dmgTaken, 0) / runs.length),
        avgSunk: (runs.reduce((s, r) => s + r.sunk, 0) / runs.length).toFixed(1),
        outcomes: runs.map(r => r.outcome[0]).join(''),
      });
    }
  }
  await browser.close();
  console.log('\n== difficulty × theater summary ==');
  console.table(rows);
  require('node:fs').writeFileSync('tests/sim/results.json', JSON.stringify(rows, null, 2));
  console.log('written tests/sim/results.json');
})();
