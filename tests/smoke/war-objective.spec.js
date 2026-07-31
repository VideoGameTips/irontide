const { test, expect } = require('@playwright/test');

// Every test here drives update(dt,t2) directly instead of waiting on frames — a 20-minute
// battle runs in about 20 seconds that way, which is the only reason these are testable at all.
const boot = async page => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof update === 'function');
};
const PRELUDE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

// A quick battle ends at `sunk >= QUICK_KILL_GOAL`, and `sunk` was only ever set where it was
// declared — once per page load. So the second battle of a session started with the first one's
// kill count already banked, and a quick battle opened by declaring victory.
test('war tallies start from zero each battle, so a quick battle cannot open already won', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(PRELUDE_SRC => {
    eval('(' + PRELUDE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;   // a theater with ships on both sides
    quickMode = false; startGame('battleship'); skipBanner();
    const dt = 1 / 30;
    // run until the fleets have banked MORE kills than a quick battle needs — a fixed six
    // minutes only managed two on some rolls, which would make this pass without proving anything
    for (let i = 0; i < 30 * 60 * 15 && sunk <= QUICK_KILL_GOAL; i++) { t2 += dt; update(dt, t2); if (phase !== 'play') break; }
    const carried = sunk;
    let won = null; const real = window.endGame;
    window.endGame = (w, m) => { if (won === null) won = !!w; real(w, m); };
    startQuickBattle(); skipBanner();
    const atStart = sunk;
    for (let i = 0; i < 30 * 3; i++) { t2 += dt; update(dt, t2); if (phase !== 'play') break; }
    window.endGame = real;
    return { carried, atStart, goal: QUICK_KILL_GOAL, wonInstantly: won === true, phase };
  }, PRELUDE.toString());

  expect(r.carried).toBeGreaterThan(r.goal);   // the first battle really did bank more kills than the goal
  expect(r.atStart).toBe(0);                   // ...and none of them carried in
  expect(r.wonInstantly).toBe(false);
  expect(r.phase).toBe('play');
});

// "ALL SHIPS ATTACK" used to assign role='attack', which is already every ally's fallback — the
// order was indistinguishable from giving none, and the fleet never went near the one thing that
// ends a war.
test('the fleet order sends the fleet at the enemy HQ', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(PRELUDE_SRC => {
    eval('(' + PRELUDE_SRC + ')()');
    difficulty = 'easy'; quickMode = false; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    const dt = 1 / 30;
    const closest = () => Math.min(...allies.filter(a => a.sinkT === 0 && !a.def.support)
      .map(a => a.pos.distanceTo(enemyHarbor.pos)));
    for (let i = 0; i < 30 * 30; i++) { t2 += dt; update(dt, t2); }   // settle into normal patrol
    const before = closest();
    fleetOrder = -1; fleetOrderCmd();
    const striking = allies.filter(a => a.role === 'strike').length;
    for (let i = 0; i < 30 * 120; i++) { t2 += dt; update(dt, t2); if (phase !== 'play') break; }
    return { before, after: closest(), striking, stillStriking: allies.filter(a => a.role === 'strike').length };
  }, PRELUDE.toString());

  expect(r.striking).toBeGreaterThan(0);            // the order actually assigned the role
  expect(r.stillStriking).toBeGreaterThan(0);       // ...and it isn't washed out a frame later
  expect(r.after).toBeLessThan(r.before - 200);     // and the fleet closed real distance on the HQ
});

// spawnEnemy() puts fresh hulls 90-250 m in front of the enemy harbor, so assaulting the
// objective used to mean charging into their spawn point forever.
test('holding a warship on the enemy HQ pins their shipyards', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(PRELUDE_SRC => {
    eval('(' + PRELUDE_SRC + ')()');
    const dt = 1 / 30;
    const run = pin => {
      difficulty = 'hard';           // grace 0: reinforcements from the first second
      quickMode = false; currentSandboxIdx = -1; currentMapIdx = 4;
      startGame('battleship'); skipBanner();
      // Count SPAWNS, not net fleet size. enemies.length is births minus deaths, and the
      // immortal probe ship parked in the theater grinds hulls down faster than the yards
      // replace them — the control run finished with fewer ships than it started and looked
      // like the yards had stopped when they hadn't.
      let spawns = 0;
      const realSpawn = window.spawnEnemy;
      window.spawnEnemy = (...a) => { spawns++; return realSpawn(...a); };
      const start = enemies.length;
      for (let i = 0; i < 30 * 240; i++) {
        // hold the whole fleet clear so only the player's position decides the outcome
        for (const a of allies) a.pos.z = friendlyHarbor.pos.z;
        player.pos.copy(enemyHarbor.pos).add(new THREE.Vector3(0, 0, pin ? 300 : 2000));
        player.hp = player.maxhp;    // this measures shipyards, not survivability
        // The announced surges ("ENEMY OFFENSIVE", "Dominion reinforcements") are deliberately
        // NOT pinned — a telegraphed counter-attack when you're on their doorstep is the good
        // kind of pressure. Hold them off here so this measures only the silent trickle.
        offensiveT = 9e9; _eventT = 9e9;
        t2 += dt; update(dt, t2);
        if (phase !== 'play') break;
      }
      window.spawnEnemy = realSpawn;
      return { start, end: enemies.length, spawns };
    };
    return { pinned: run(true), free: run(false) };
  }, PRELUDE.toString());

  expect(r.free.spawns).toBeGreaterThan(3);   // control: the yards really are turning out hulls
  expect(r.pinned.spawns).toBe(0);            // pinned: not one new hull
});

// Replacements always sailed from home, and home is 4.4 km from the objective on the full-size
// theaters — a player who kept pressing the HQ spent most of the war commuting.
test('an island you hold becomes the forward base you respawn from', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(PRELUDE_SRC => {
    eval('(' + PRELUDE_SRC + ')()');
    difficulty = 'easy'; quickMode = false; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    const foe = enemyHarbor.pos;
    const spawnDist = player.pos.distanceTo(foe);   // where a fresh battle puts you
    // nothing held yet -> home waters, exactly as before
    respawnPlayer('destroyer');
    const withoutIsland = player.pos.distanceTo(foe);
    // take the island nearest the enemy and try again
    const ahead = islands.filter(i => i.capturable && Math.abs(i.pos.z - foe.z) < Math.abs(friendlyHarbor.pos.z - foe.z))
      .sort((a, b) => a.pos.distanceTo(foe) - b.pos.distanceTo(foe))[0];
    if (!ahead) return { skip: true };
    setIslandOwner(ahead, 0, true);
    respawnPlayer('destroyer');
    return {
      spawnDist, withoutIsland, withIsland: player.pos.distanceTo(foe),
      // and pointed at the enemy, not left facing the beach
      facingFoe: Math.cos(player.heading - Math.atan2(foe.x - player.pos.x, foe.z - player.pos.z)) > 0.7,
    };
  }, PRELUDE.toString());

  test.skip(!!r.skip, 'this theater has no island ahead of home');
  expect(Math.abs(r.withoutIsland - r.spawnDist)).toBeLessThan(60);   // hold nothing -> home waters, as before
  expect(r.withIsland).toBeLessThan(r.withoutIsland - 300);  // a held island really is closer in
  expect(r.facingFoe).toBe(true);
});

// The enemy HQ is the entire win condition, and it was a flat 2600 hp on every map — the
// "barely any resistance" warm-up had the same one as the last mission of the campaign — while
// fortifying itself past 5000 within a couple of minutes.
test('the warm-up theaters have a softer HQ that does not grow', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(PRELUDE_SRC => {
    eval('(' + PRELUDE_SRC + ')()');
    const dt = 1 / 30;
    const probe = idx => {
      difficulty = 'easy'; quickMode = false; currentSandboxIdx = -1; currentMapIdx = idx;
      startGame('destroyer'); skipBanner();
      const at0 = enemyHarbor.maxhp;
      for (let i = 0; i < 30 * 300; i++) { t2 += dt; update(dt, t2); if (phase !== 'play') break; }
      // count upgrades bought, not maxhp: only 'walls' moves maxhp and it's one of eight in the
      // pool, so a five-minute window often rolls none — that made this assertion a coin flip
      const ups = enemyHarbor ? Object.values(enemyHarbor.up).reduce((a, b) => a + b, 0) : 0;
      return { at0, at5: enemyHarbor ? enemyHarbor.maxhp : 0, ups, name: CAMPAIGN[idx].name };
    };
    return { warmup: probe(0), late: probe(14) };
  }, PRELUDE.toString());

  expect(r.warmup.name).toBe('Training Bay');
  expect(r.warmup.at0).toBeLessThan(r.late.at0);     // the warm-up starts softer than a late theater
  expect(r.warmup.at5).toBe(r.warmup.at0);           // ...and the goal does not run away from you
  expect(r.warmup.ups).toBe(0);                     // the warm-up HQ buys nothing at all
  expect(r.late.ups).toBeGreaterThan(0);            // the hard theaters still fortify themselves
});
