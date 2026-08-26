const { test, expect } = require('@playwright/test');

// The R-36M silo is removed from the game. It was a 9,999-damage warhead with a 900 m blast,
// launched from a screen that paused the war — one per side, and whoever fired first ended the
// fight. The nuclear AIRCRAFT are untouched; only the silo is gone.
test('nobody can build an R-36M, and nothing can launch one', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof STRUCTS !== 'undefined' && typeof aiIslandBuild === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    const inCatalogue = 'nukesilo' in STRUCTS;
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 8;
    startGame('battleship'); skipBanner();

    // the player cannot raise one, even asked directly with force
    const isl = islands.find(i => i.r >= 70);
    setIslandOwner(isl, 0, true);
    const playerBuilt = !!buildAndPushLand('nukesilo', 0, isl.pos.clone(), undefined, isl, undefined, true);

    // ...and neither can the enemy, across a lot of build rolls
    for (const i of islands) if (i.r >= 70) setIslandOwner(i, 1, true);
    for (let n = 0; n < 800; n++) { _islandBuildT = 0; aiIslandBuild(0.1); }
    const enemySilos = landUnits.filter(u => !u.dead && u.nukesilo).length;
    const enemyBuiltOtherThings = landUnits.filter(u => !u.dead && u.team === 1).length;

    // The panel that USED to aim the silo is now a plain chart of the theater (see
    // tests/smoke/tactical-map.spec.js), so "does it open" says nothing about the removal.
    // What matters here is that nothing can still fire: no silo exists to launch from, and
    // no nuclear shell is in the water however long the battle runs.
    for (let n = 0; n < 200; n++) { t2 += 0.1; update(0.1, t2); }
    const nukeShells = shells.filter(m => m.nuclear).length;
    const liveSilos = landUnits.filter(u => !u.dead && (u.nukesilo || u.kind === 'nukesilo')).length;

    // nuclear AIRCRAFT are deliberately still in the game — this removal was the silo only
    const nukePlanes = Object.keys(PLANES).filter(k => isNuclear(PLANES[k])).length;
    return { inCatalogue, playerBuilt, enemySilos, enemyBuiltOtherThings, nukeShells, liveSilos, nukePlanes };
  });

  expect(r.inCatalogue).toBe(false);
  expect(r.playerBuilt).toBe(false);
  expect(r.enemySilos).toBe(0);
  expect(r.enemyBuiltOtherThings).toBeGreaterThan(10);   // the AI was building — 0 silos isn't 0 activity
  expect(r.nukeShells, 'something put a strategic warhead in the water').toBe(0);
  expect(r.liveSilos, 'a silo exists after 20 s of live battle').toBe(0);
  expect(r.nukePlanes).toBeGreaterThan(0);               // aircraft untouched, as intended
});

// A war saved before the removal still lists a silo. Loading it must skip the structure rather
// than throw on STRUCTS['nukesilo'] being undefined and lose the whole save.
//
// The save below has to be shaped the way the game actually stores one, or this proves nothing:
// the key is `ironTideSave` (not `ironTideWar`) and validWarSave() requires `v:1` (not `sv`).
// Written the old way, resumeWar() returned on its first line and this test was quietly watching
// the startGame above it — passing whether or not the silo was ever handled.
test('a save written when the R-36M still existed still loads', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof resumeWar === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner();

    const old = { v: 1, mapIdx: 0, shipId: 'destroyer', money: 1000, sunk: 0,
      hp: 100, px: 0, pz: 600, hd: 0,          // the captain's own hull — validWarSave requires these
      fh: { x: 0, z: 900, hp: 100, maxhp: 100, up: {} }, eh: { x: 0, z: -900, hp: 100, maxhp: 100, up: {} },
      islands: [{ x: 0, z: 0, r: 120, name: 'Test', rx: 120, rz: 120, angle: 0, seed: 1, cap: true, owner: 0 }],
      units: [{ k: 'nukesilo', t: 0, x: 0, y: 2, z: 0, isl: 0, hp: 100 },
              { k: 'coastal',  t: 0, x: 20, y: 2, z: 20, isl: 0, hp: 100 }] };
    try { localStorage.setItem('ironTideSave', JSON.stringify(old)); } catch (e) {}

    let err = null;
    try { resumeWar(); } catch (e) { err = e.message; }
    const dt = 1 / 30;
    for (let i = 0; i < 60 && phase === 'play'; i++) { t2 += dt; update(dt, t2); }
    // check the KIND, not the u.nukesilo flag: with the model branch gone that flag is never set,
    // so a save that still built something would leave a nameless phantom structure the flag misses
    return { err, silos: landUnits.filter(u => u.nukesilo || u.kind === 'nukesilo').length,
             coastalSurvived: landUnits.some(u => u.kind === 'coastal'), phase,
             // proof the save was really consumed: it lists exactly one island, called Test
             islandCount: islands.length, islandName: islands[0] && islands[0].name };
  });

  expect(r.err).toBeNull();            // the save loads at all
  expect(r.islandCount, 'resumeWar ignored the save — this test would pass either way').toBe(1);
  expect(r.islandName).toBe('Test');
  expect(r.silos).toBe(0);             // the silo is dropped
  expect(r.coastalSurvived).toBe(true); // ...but the rest of the save is intact, not abandoned
  expect(r.phase).toBe('play');
});

// validWarSave's job is "unknown/ancient shape → treat as no save (never crash on it)". A save
// that is missing the captain's own position or health used to pass that check and then NaN the
// whole world — player, every enemy and every ally, because the escort fleets spawn relative to
// player.pos — and throw out of positional audio on the first frame. It must be refused instead.
test('a save missing the captain\'s own hull is refused, not resumed into a NaN world', async ({ page }) => {
  const thrown = [];
  page.on('pageerror', e => thrown.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof resumeWar === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner();
    const base = { v: 1, mapIdx: 0, shipId: 'destroyer', money: 1000, sunk: 0, hp: 100, px: 0, pz: 600, hd: 0,
      fh: { x: 0, z: 900, hp: 100, maxhp: 100, up: {} }, eh: { x: 0, z: -900, hp: 100, maxhp: 100, up: {} },
      islands: [{ x: 0, z: 0, r: 120, name: 'Test', rx: 120, rz: 120, angle: 0, seed: 1, cap: true, owner: 0 }],
      units: [] };
    const out = {};
    for (const missing of ['px', 'pz', 'hp']) {
      const bad = JSON.parse(JSON.stringify(base)); delete bad[missing];
      try { localStorage.setItem('ironTideSave', JSON.stringify(bad)); } catch (e) {}
      out['valid_without_' + missing] = validWarSave(bad);
      out['load_without_' + missing] = loadSave() !== null;
    }
    // the complete one still loads, and the world it builds is finite
    try { localStorage.setItem('ironTideSave', JSON.stringify(base)); } catch (e) {}
    out.validComplete = validWarSave(base);
    let err = null;
    try { resumeWar(); for (let i = 0; i < 30; i++) { t2 += 1 / 30; update(1 / 30, t2); } } catch (e) { err = e.message; }
    out.err = err;
    out.finite = Number.isFinite(player.pos.x) && Number.isFinite(player.hp)
      && enemies.every(e => Number.isFinite(e.pos.x)) && allies.every(a => Number.isFinite(a.pos.x));
    out.fleet = [enemies.length, allies.length];
    return out;
  });
  console.log('BADSAVE ' + JSON.stringify(r));

  ['px', 'pz', 'hp'].forEach(k => {
    expect(r['valid_without_' + k], 'a save with no ' + k + ' was accepted').toBe(false);
    expect(r['load_without_' + k], 'a save with no ' + k + ' was handed to resumeWar').toBe(false);
  });
  expect(r.validComplete, 'a complete save stopped being accepted').toBe(true);
  expect(r.err, 'resuming a complete save threw').toBeNull();
  expect(r.finite, 'the resumed world contains a non-finite position').toBe(true);
  expect(r.fleet[0] + r.fleet[1], 'no fleet was rebuilt — nothing was really exercised').toBeGreaterThan(0);
  expect(thrown, 'an error escaped to the page').toEqual([]);
});
