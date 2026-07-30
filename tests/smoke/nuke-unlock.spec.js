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

// The lock has to bind the enemy too, or levels 1-5 just mean "only THEY get nukes". The AI's one
// nuclear path is the island silo (nuclear aircraft are player-only by AI_PLANE_POOL); it goes
// through the same nukesBannedHere() gate, and this proves it rather than trusting the read.
test('the enemy cannot build a nuclear silo on operations 1-5 either', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof aiIslandBuild === 'function');
  const r = await page.evaluate(() => {
    try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    difficulty = 'easy'; quickMode = false;

    const siloCount = () => landUnits.filter(u => !u.dead && u.team === 1 && u.kind === 'nukesilo').length;
    const probe = idx => {
      currentSandboxIdx = -1; currentMapIdx = idx;
      startGame('battleship'); skipBanner();
      // hand the enemy islands big enough to build on, or the AI has nowhere to put anything
      let usable = 0;
      for (const i of islands) { if (i.r >= 70) { setIslandOwner(i, 1, true); usable++; } }
      let built = 0;
      for (let n = 0; n < 600; n++) { _islandBuildT = 0; aiIslandBuild(0.1); }
      built = siloCount();
      return { usable, built, structures: landUnits.filter(u => !u.dead && u.team === 1).length };
    };
    // level 5 is the last barred one; level 6 the first allowed. Both have a real fleet.
    return { lv1: probe(0), lv5: probe(4), lv6: probe(5) };
  });

  // the AI really was building — otherwise "no silos" proves nothing
  expect(r.lv1.usable).toBeGreaterThan(0);
  expect(r.lv6.structures).toBeGreaterThan(10);
  expect(r.lv1.built).toBe(0);      // operation 1: no enemy silo
  expect(r.lv5.built).toBe(0);      // operation 5: still none
  expect(r.lv6.built).toBeGreaterThan(0);   // operation 6: the enemy gets them too
});
