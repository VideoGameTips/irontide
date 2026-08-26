const { test, expect } = require('@playwright/test');

// "Drive onto the flag and stop — standing still is what takes an island." Neither half was
// true: there was no flag (a 2 m bead 24 m up and a translucent ring at the island's centre,
// both invisible from the beach), and holding still is not a condition — being ashore at all
// is. So a player did the one thing the game asked and watched nothing happen. There is a real
// flag now, on both the island and the chart, and the hint describes what actually works.
const boot = (ship) => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
  difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 0; career.mapsUnlocked = 30;
  startGame(ship || 'destroyer'); skipBanner();
};

test('every island you can take flies a flag you can actually see', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const cap = islands.filter(i => i.capturable);
    const withFlag = cap.filter(i => i.capFlag);
    const isl = cap[0];
    const top = isl.capFlag.getWorldPosition(new THREE.Vector3()).y;
    // the flag has to be readable from the water, not just from directly overhead
    const beach = isl.pos.clone().add(new THREE.Vector3(isl.r + 40, 0, 0));
    const apparent = 7.2 / beach.distanceTo(isl.capFlag.getWorldPosition(new THREE.Vector3()));

    const hex = () => isl.capFlag.material.color.getHex();
    const neutral = hex();
    setIslandOwner(isl, 1, true); const enemy = hex();
    setIslandOwner(isl, 0, true); const mine = hex();
    setIslandOwner(isl, 1, true);
    // and it waves harder while the island is turning over
    isl.capture = 0; t2 = 1; updateIslandControl(0.016); const calm = isl.capFlag.rotation.y;
    isl.capture = 5;  t2 = 1; updateIslandControl(0.016); const busy = isl.capFlag.rotation.y;
    // the two HQ islands are capturable:false — a flag there would promise something impossible
    const hq = islands.filter(i => !i.capturable);
    const hqFlying = hq.filter(i => i.capMast && i.capMast.visible).length;
    return { hq: hq.length, hqFlying, cap: cap.length, withFlag: withFlag.length, top: +top.toFixed(1),
             apparent: +apparent.toFixed(3), neutral, enemy, mine, calm: +calm.toFixed(4), busy: +busy.toFixed(4) };
  }, [boot.toString()]);
  console.log('FLAGPROBE ' + JSON.stringify(r));

  expect(r.cap, 'no capturable islands in the fixture').toBeGreaterThan(0);
  expect(r.withFlag, 'an island you can take has no flag on it').toBe(r.cap);
  expect(r.hq, 'the fixture has no HQ islands to check').toBe(2);
  expect(r.hqFlying, 'an island nobody can capture is flying a capture flag').toBe(0);
  expect(r.top, 'the flag sits too low to see over the terrain').toBeGreaterThan(15);
  // a 7 m panel seen from just off the beach — comfortably bigger than the old 2 m bead
  expect(r.apparent, 'the flag is a speck from the shoreline').toBeGreaterThan(0.03);
  expect(r.neutral).not.toBe(r.enemy);
  expect(r.mine, 'a captured island keeps flying the enemy colour').not.toBe(r.enemy);
  expect(r.calm).not.toBe(r.busy);      // it waves, and the wave changes while contested
});

test('the flag is on the minimap and the tactical map, and one is marked as next', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof drawTacticalMap === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    islands.filter(i => i.capturable).forEach(i => setIslandOwner(i, 1, true));
    for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
    // #ffd050 is used for one thing only: the ring and label on the island you are being sent to
    const gold = (cv) => { const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0; for (let i = 0; i < d.length; i += 4)
        if (d[i + 3] > 40 && Math.abs(d[i] - 255) < 26 && Math.abs(d[i + 1] - 208) < 26 && Math.abs(d[i + 2] - 80) < 40) n++;
      return n; };
    const objective = (nextIslandTarget() || {}).isl;
    toggleTacticalMap(true); drawTacticalMap();
    const tac = gold(document.getElementById('tacticalCanvas'));
    toggleTacticalMap(false);
    // put the objective inside minimap range so it has something to draw
    if (objective) player.pos.set(objective.pos.x, 0, objective.pos.z + 200);
    drawMinimap();
    return { objective: !!objective, tacGold: tac, miniGold: gold(document.getElementById('minimap')) };
  }, [boot.toString()]);
  console.log('MAPFLAG ' + JSON.stringify(r));

  expect(r.objective, 'nothing left to take — the fixture proves nothing').toBe(true);
  expect(r.tacGold, 'the tactical map does not mark the island you are sent to').toBeGreaterThan(20);
  expect(r.miniGold, 'the minimap does not mark the island you are sent to').toBeGreaterThan(8);
});

test('the hint says what actually takes an island', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof nextStepHint === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    const isl = islands.filter(i => i.capturable)[0];
    setIslandOwner(isl, 1, true);
    landUnits.filter(u => u.island === isl).forEach(u => u.dead = true);
    const spot = isl.pos.clone(); spot.y = groundHeightAt(spot, isl);
    buildGroundPlayerTank(spot, 'sherman', isl);
    const tk = playerTanks[playerTanks.length - 1]; mountTank(tk);
    for (let i = 0; i < 10; i++) updateTank(1 / 60);
    const ashore = nextStepHint();

    // ...and with the guns still up it says to deal with them, not to stand somewhere
    const p = isl.pos.clone().add(new THREE.Vector3(6, 0, 6)); p.y = groundHeightAt(p, isl);
    buildAndPushLand('coastal', 1, p, undefined, isl, undefined, true);
    const defended = nextStepHint();

    // holding still was never a condition; being ashore was, and still is
    const beforeCapture = islandCaptureForce(isl, 0);
    tk.pos.x += 30; tk.island = isl;
    const whileMoving = islandCaptureForce(isl, 0);
    return { ashore, defended, beforeCapture, whileMoving, island: isl.name };
  }, [boot.toString()]);
  console.log('HINTPROBE ' + JSON.stringify(r));

  expect(r.ashore).toContain(r.island);
  expect(r.ashore, 'the hint still sends you looking for a spot to stand on').not.toMatch(/onto the flag|hold still|standing still/i);
  expect(r.defended, 'a defended island gives no reason why nothing is happening').toMatch(/guns|defen/i);
  // the mechanic the old text described backwards: moving does not stop a capture
  expect(r.beforeCapture).toBeGreaterThan(0);
  expect(r.whileMoving, 'moving cancelled the capture — the old hint would have been right').toBeGreaterThan(0);
});

// resumeWar rebuilds islands with buildIsland() and sets `capturable` itself — it never calls
// buildTheater(). Hiding the HQ flags at theatre-build time therefore covered a fresh war and
// missed every save, so a loaded game flew capture flags over both headquarters.
//
// This drives the game's OWN save path. An earlier version of this test hand-wrote a save under
// the key `ironTideWar` with `sv:3` — but the key is `ironTideSave` and validWarSave() demands
// `v:1`, so resumeWar() bailed on line one and the test was really just watching a fresh
// startGame. It passed either way, which is worse than failing.
test('a loaded save does not fly capture flags over the two headquarters', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof resumeWar === 'function' && typeof saveWar === 'function');
  const r = await page.evaluate(([SRC]) => {
    eval('(' + SRC + ')()');
    career.wins = 5;                       // past the first war, so this theatre is savable
    try { localStorage.removeItem('ironTideSave'); } catch (e) {}
    for (let i = 0; i < 60; i++) { t2 += 0.05; update(0.05, t2); }
    saveWar();
    const savedBytes = (localStorage.getItem('ironTideSave') || '').length;

    // dirty the world so a resume that loads nothing cannot pass: hand the HQ islands away and
    // show every mast, which is the state the bug produced
    islands.forEach(i => { if (i.capMast) i.capMast.visible = true; if (i.capRing) i.capRing.visible = true; });
    const dirtyMasts = islands.filter(i => !i.capturable && i.capMast.visible).length;

    let err = null; try { resumeWar(); } catch (e) { err = e.message; }
    for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
    const hq = islands.filter(i => !i.capturable), cap = islands.filter(i => i.capturable);
    return { err, savedBytes, dirtyMasts, hqCount: hq.length, capCount: cap.length,
             hqFlying: hq.filter(i => i.capMast && i.capMast.visible).length,
             hqRings: hq.filter(i => i.capRing && i.capRing.visible).length,
             capFlying: cap.filter(i => i.capMast && i.capMast.visible).length };
  }, [boot.toString()]);
  console.log('RESUMEFLAG ' + JSON.stringify(r));

  expect(r.err).toBeNull();
  expect(r.savedBytes, 'nothing was saved, so nothing was resumed').toBeGreaterThan(100);
  expect(r.dirtyMasts, 'the fixture never raised the flags it is meant to check get lowered').toBeGreaterThan(0);
  expect(r.hqCount, 'the save did not restore two uncapturable islands').toBe(2);
  expect(r.hqFlying, 'a loaded save flies a capture flag over a headquarters').toBe(0);
  expect(r.hqRings, 'a loaded save draws a capture ring on a headquarters').toBe(0);
  expect(r.capFlying, 'the island you CAN take lost its flag on load').toBe(r.capCount);
});
