const { test, expect } = require('@playwright/test');

// Strategic weapons stay locked for the first five operations. Levels 1-5 are where you're still
// learning to steer and bolt guns on; a 9,999-damage warhead on tap skips all of it.
test('nukes are locked for operations 1-5 and available from 6', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof nukesBannedHere === 'function' && typeof startGame === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; quickMode = false;

    const byLevel = {}, buildable = {}; let droneIsNuclear = null;
    for (let i = 0; i < 8; i++) {
      currentSandboxIdx = -1; currentMapIdx = i;
      startGame('battleship'); skipBanner();
      byLevel[i + 1] = nukesLockedByLevel();
      // and the arsenal really is gated, not just the flag. The shop hides the silo by key and
      // the atomic drone by isNuclear(), and both hang off nukesBannedHere() — so check that the
      // ban reaches it, and separately that isNuclear still recognises the drone at all.
      buildable[i + 1] = !nukesBannedHere();
      droneIsNuclear = isNuclear(PLANES.nukedrone);
    }
    // a nuclear-themed sandbox is chosen deliberately — it stays exempt
    const sandboxIdx = SANDBOX_MAPS.findIndex(m => m.name === 'Hiroshima');
    let sandboxLocked = null;
    if (sandboxIdx >= 0) { currentSandboxIdx = sandboxIdx; startGame('battleship'); skipBanner(); sandboxLocked = nukesLockedByLevel(); }

    currentSandboxIdx = -1; currentMapIdx = 0; startGame('battleship'); skipBanner();
    const msgEarly = nukeBanMessage();
    currentMapIdx = 7; startGame('battleship'); skipBanner();
    const msgLate = nukeBanMessage();
    return { byLevel, buildable, sandboxLocked, droneIsNuclear, unlockAt: NUKE_UNLOCK_LEVEL, msgEarly, msgLate };
  });

  expect(r.unlockAt).toBe(6);
  expect(r.droneIsNuclear).toBe(true);   // else the drone half of the gate is vacuous
  for (const lvl of [1, 2, 3, 4, 5]) {
    expect(r.byLevel[lvl], `level ${lvl} must be locked`).toBe(true);
    expect(r.buildable[lvl], `level ${lvl} must not offer the silo`).toBe(false);
  }
  for (const lvl of [6, 7, 8]) expect(r.byLevel[lvl], `level ${lvl} must be unlocked`).toBe(false);
  expect(r.sandboxLocked).toBe(false);               // sandbox is picked on purpose, not gated
  // the two refusals explain different things — "not on this theater" is baffling when the real
  // answer is "not yet"
  expect(r.msgEarly).not.toBe(r.msgLate);
  expect(r.msgEarly).toMatch(/6|６/);
});

// The enemy's ONLY nuclear route was the R-36M silo, and that has been removed from the game
// outright — nuclear aircraft were always player-only via AI_PLANE_POOL. So the enemy now has no
// path to a nuclear weapon at any level, which is a stronger guarantee than the old level gate.
test('the enemy has no nuclear weapon at any level, because the silo is gone', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof aiIslandBuild === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; quickMode = false;
    const probe = idx => {
      currentSandboxIdx = -1; currentMapIdx = idx;
      startGame('battleship'); skipBanner();
      for (const i of islands) if (i.r >= 70) setIslandOwner(i, 1, true);
      for (let n = 0; n < 600; n++) { _islandBuildT = 0; aiIslandBuild(0.1); }
      return { silos: landUnits.filter(u => !u.dead && u.team === 1 && (u.nukesilo || u.kind === 'nukesilo')).length,
               structures: landUnits.filter(u => !u.dead && u.team === 1).length };
    };
    // low, mid and high — the level gate is irrelevant now, but check across it anyway
    return { lv1: probe(0), lv6: probe(5), lv15: probe(14),
             nukePlanesInAiPool: AI_PLANE_POOL.filter(k => PLANES[k] && isNuclear(PLANES[k])).length };
  });

  expect(r.lv15.structures).toBeGreaterThan(10);   // the AI really was building
  expect(r.lv1.silos).toBe(0);
  expect(r.lv6.silos).toBe(0);                     // ...even past the old unlock level
  expect(r.lv15.silos).toBe(0);
  expect(r.nukePlanesInAiPool).toBe(0);            // and it never flies a nuclear aircraft either
});
