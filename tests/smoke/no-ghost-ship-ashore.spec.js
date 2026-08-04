const { test, expect } = require('@playwright/test');

// A ground theatre has no ship. deployLandCampaignStart hides the hull and parks it below the
// world — but the per-frame transform hauled it straight back out to the player anchor, and in
// land mode that anchor follows the SOLDIER. So an invisible warship trailed the player across
// the battlefield, and its auto-gunners went on hunting from inside him.
//
// Measured before the fix, holding station 170 m off an enemy position: two invisible turrets
// fired 88 shells in 25 seconds and killed nine enemy units by themselves. Free artillery that
// could not be seen, aimed, blocked or lost.
test('no invisible warship follows you ashore, and no ship guns fire in a ground theatre', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof CAMPAIGN !== 'undefined');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();

    const idx = CAMPAIGN.findIndex(m => m.ground);
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = idx;
    startGame('destroyer'); skipBanner();

    // Stand where a player pushing the assault would: well inside the 260 m the deck guns
    // bombard shore from. This is the exact position that produced the 88 shells.
    const foe = landUnits.find(u => u.team === 1 && !u.dead);
    const hold = () => { footPos.copy(foe.pos).add(new THREE.Vector3(120, 0, 120)); footPos.y = foe.pos.y + 2; };
    hold();

    let fired = 0;
    const real = window.spawnShell;
    window.spawnShell = (w, pos, dir, team, owner, ...rest) => {
      if (team === 0 && owner == null) fired++;      // owner null = a turret on the player's own hull
      return real(w, pos, dir, team, owner, ...rest);
    };
    const before = landUnits.filter(u => u.team === 1 && !u.dead).length;
    const dt = 1 / 30;
    for (let i = 0; i < 30 * 25; i++) { hold(); t2 += dt; update(dt, t2); }
    const firedNormally = fired;
    const after = landUnits.filter(u => u.team === 1 && !u.dead).length;
    const g = player.build.group;
    const parked = { visible: g.visible, y: Math.round(g.position.y),
                     dist: Math.round(Math.hypot(g.position.x - footPos.x, g.position.z - footPos.z)) };

    // SECOND LAYER, tested on its own. Parking the hull below the world already puts every target
    // out of the 260 m the auto-gunners reach, so it alone hides the bug — which would leave the
    // "don't run autoGun ashore" guard permanently unexercised and free to rot. Drag the hull
    // back onto the soldier by hand, exactly as the old transform did, and require silence anyway.
    let firedWithHullForced = 0;
    fired = 0;
    for (let i = 0; i < 30 * 12; i++) {
      hold();
      g.position.set(footPos.x, 0, footPos.z);        // put it right back on top of the enemy
      t2 += dt; update(dt, t2);
    }
    firedWithHullForced = fired;
    window.spawnShell = real;

    return { landMode: landCampaignMode, mapName: CAMPAIGN[idx].name,
             turrets: placed.length, enemiesNearby: before,
             fired: firedNormally, killed: before - after, firedWithHullForced,
             hullVisible: parked.visible, hullY: parked.y, hullDistFromSoldier: parked.dist };
  });

  // the fixture has to be the real thing, or "0 shots" proves nothing
  expect(r.landMode).toBe(true);
  expect(r.turrets).toBeGreaterThan(0);              // the hull really does carry guns
  expect(r.enemiesNearby).toBeGreaterThan(20);       // ...and there really were targets in reach

  expect(r.fired, 'ship guns must not fire in a theatre with no ship').toBe(0);
  // ...and still not, even with the hull forcibly dragged back on top of the fighting — so the
  // guard is doing real work rather than being masked by the parked hull being out of range
  expect(r.firedWithHullForced, 'ship guns fired once the hull was moved back into range').toBe(0);
  // NOT asserting on enemy losses: the ground battle is running on its own and your allied tanks
  // and infantry kill things regardless, so attributing every casualty to the ship guns would be
  // wrong. `fired` counts shells from the player's own hull directly, which is the actual claim.
  // and the hull itself stays hidden and parked below the world rather than riding on the soldier
  expect(r.hullVisible).toBe(false);
  expect(r.hullY).toBeLessThan(-1000);
  expect(r.hullDistFromSoldier).toBeGreaterThan(500);
});

// The same guns must still work everywhere else — this fix is "no ship, no deck guns", not
// "deck guns are off".
test('deck guns still fire normally in a sea theatre', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();

    let fired = 0;
    const real = window.spawnShell;
    window.spawnShell = (w, pos, dir, team, owner, ...rest) => {
      if (team === 0 && owner == null) fired++;
      return real(w, pos, dir, team, owner, ...rest);
    };
    // park the ship right on top of the enemy fleet so the auto-gunners have work
    const foe = enemies.find(e => e.sinkT === 0);
    const dt = 1 / 30;
    for (let i = 0; i < 30 * 20; i++) {
      if (foe && foe.sinkT === 0) player.pos.copy(foe.pos).add(new THREE.Vector3(90, 0, 90));
      t2 += dt; update(dt, t2);
    }
    window.spawnShell = real;
    const g = player.build.group;
    return { landMode: landCampaignMode, turrets: placed.length, fired,
             hullVisible: g.visible,
             hullTracksShip: Math.round(Math.hypot(g.position.x - player.pos.x, g.position.z - player.pos.z)) };
  });

  expect(r.landMode).toBe(false);
  expect(r.turrets).toBeGreaterThan(0);
  expect(r.fired, 'deck guns must still shoot at sea').toBeGreaterThan(10);
  expect(r.hullVisible).toBe(true);
  expect(r.hullTracksShip).toBeLessThan(3);          // and the hull still follows the ship at sea
});
