const { test, expect } = require('@playwright/test');

// The R-36M silo is removed from the game. It was a 9,999-damage warhead with a 900 m blast,
// launched from a screen that paused the war — one per side, and whoever fired first ended the
// fight. The nuclear AIRCRAFT are untouched; only the silo is gone.
test('nobody can build an R-36M, and the tactical map that aimed it stays shut', async ({ page }) => {
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

    // the targeting screen existed only for the silo, so it must not open on an empty chart
    tacticalOpen = false; toggleTacticalMap();
    const mapOpened = tacticalOpen;

    // nuclear AIRCRAFT are deliberately still in the game — this removal was the silo only
    const nukePlanes = Object.keys(PLANES).filter(k => isNuclear(PLANES[k])).length;
    return { inCatalogue, playerBuilt, enemySilos, enemyBuiltOtherThings, mapOpened, nukePlanes };
  });

  expect(r.inCatalogue).toBe(false);
  expect(r.playerBuilt).toBe(false);
  expect(r.enemySilos).toBe(0);
  expect(r.enemyBuiltOtherThings).toBeGreaterThan(10);   // the AI was building — 0 silos isn't 0 activity
  expect(r.mapOpened).toBe(false);
  expect(r.nukePlanes).toBeGreaterThan(0);               // aircraft untouched, as intended
});

// A war saved before the removal still lists a silo. Loading it must skip the structure rather
// than throw on STRUCTS['nukesilo'] being undefined and lose the whole save.
test('a save written when the R-36M still existed still loads', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof resumeWar === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0;
    startGame('destroyer'); skipBanner();

    const old = { sv: 3, mapIdx: 0, shipId: 'destroyer', money: 1000, sunk: 0,
      fh: { x: 0, z: 900, hp: 100, maxhp: 100, up: {} }, eh: { x: 0, z: -900, hp: 100, maxhp: 100, up: {} },
      islands: [{ x: 0, z: 0, r: 120, name: 'Test', rx: 120, rz: 120, angle: 0, seed: 1, cap: true, owner: 0 }],
      units: [{ k: 'nukesilo', t: 0, x: 0, y: 2, z: 0, isl: 0, hp: 100 },
              { k: 'coastal',  t: 0, x: 20, y: 2, z: 20, isl: 0, hp: 100 }] };
    try { localStorage.setItem('ironTideWar', JSON.stringify(old)); } catch (e) {}

    let err = null;
    try { resumeWar(); } catch (e) { err = e.message; }
    const dt = 1 / 30;
    for (let i = 0; i < 60 && phase === 'play'; i++) { t2 += dt; update(dt, t2); }
    // check the KIND, not the u.nukesilo flag: with the model branch gone that flag is never set,
    // so a save that still built something would leave a nameless phantom structure the flag misses
    return { err, silos: landUnits.filter(u => u.nukesilo || u.kind === 'nukesilo').length,
             coastalSurvived: landUnits.some(u => u.kind === 'coastal'), phase };
  });

  expect(r.err).toBeNull();            // the save loads at all
  expect(r.silos).toBe(0);             // the silo is dropped
  expect(r.coastalSurvived).toBe(true); // ...but the rest of the save is intact, not abandoned
  expect(r.phase).toBe('play');
});
