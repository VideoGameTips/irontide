const { test, expect } = require('@playwright/test');
test('joining multiplayer mid-war is refused instead of stacking a second theatre', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();

    const fresh = { islands: islands.length, phase };          // nothing built yet
    startGame('destroyer'); skipBanner();
    const inWar = { islands: islands.length, phase };

    // the reachable path: the mid-war replacement-ship menu
    showRespawnMenu('test');
    const atRespawn = { islands: islands.length, phase };
    const before = islands.length;
    MP.pendingShip = null;
    mpJoinRoom('irontide-test', 'destroyer');                   // would have called applyMap()+buildTheater()
    // the guard returns before `MP.pendingShip = shipId`, so an untouched pendingShip proves it fired
    const after = { islands: islands.length, pendingShip: MP.pendingShip, active: MP.active };

    return { fresh, inWar, atRespawn, before, after };
  });
  expect(r.fresh.islands).toBe(0);
  expect(r.inWar.islands).toBeGreaterThan(0);
  expect(r.atRespawn.phase).toBe('respawn');          // the state the old guard missed
  expect(r.after.islands).toBe(r.before);             // no second theatre built on top
  expect(r.after.pendingShip).toBe(null);             // bailed before touching MP state
  expect(r.after.active).toBeFalsy();
});
