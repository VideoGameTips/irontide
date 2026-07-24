const { test, expect } = require('@playwright/test');
test('going down on the bridge costs the no-ship-lost star', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();

    // the usual way to lose a hull: at the helm, not ashore
    startGame('destroyer'); skipBanner();
    const atStart = shipsLostThisWar;
    const away = { onFoot, drivingTank: !!drivingTank, piloting: !!piloting };
    player.hp = 0; playerSunk();
    const onBridge = shipsLostThisWar;

    // and the path that always did count: sunk while ashore
    startGame('destroyer'); skipBanner();
    const freshCount = shipsLostThisWar;
    onFoot = true;
    player.hp = 0; playerSunk();
    const ashore = shipsLostThisWar;
    onFoot = false;

    return { atStart, away, onBridge, freshCount, ashore };
  });
  expect(r.atStart).toBe(0);
  expect(r.away.onFoot || r.away.drivingTank || r.away.piloting).toBe(false); // really was on the bridge
  expect(r.onBridge).toBe(1);      // the case that used to score 0
  expect(r.freshCount).toBe(0);    // counter resets per war
  expect(r.ashore).toBe(1);        // the case that always worked still works
});
