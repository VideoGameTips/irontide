// The harbour is the win condition, and for a long time nothing could touch it: ships
// parked alongside it dealt exactly zero damage. Three separate reasons, all fixed —
// this locks in the one that is cheap to assert end to end.
const { test, expect } = require('@playwright/test');

test('warships in range shell the enemy harbour instead of ignoring it', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const dealt = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    career.mapsUnlocked = 8; currentMapIdx = 4; currentSandboxIdx = -1;
    try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    startGame('battleship'); if (typeof skipTutorial === 'function') skipTutorial(); skipBanner();
    window.updateAdaptiveQuality = () => {};
    for (let i = 0; i < 60 * 20; i++) { t2 += 1 / 60; update(1 / 60, t2); }

    let dmg = 0;
    const orig = window.damageHarbor;
    window.damageHarbor = (h, d) => { if (h === enemyHarbor) dmg += d; return orig(h, d); };

    // Park a few of our ships within gun range and hold them on station. Both the live
    // path and the proxy resolver used to leave the harbour alone from here.
    const squad = allies.filter(a => a.sinkT === 0).slice(0, 3);
    const hp = enemyHarbor.pos;
    const station = (a, j) => a.pos.set(hp.x + 150 + j * 30, 0, hp.z + 150);
    squad.forEach(station);
    for (let i = 0; i < 60 * 90; i++) {
      t2 += 1 / 60; update(1 / 60, t2);
      // ...and keep them alive while they are parked in front of a harbour that shoots back.
      // This test is about whether ships in range ENGAGE the harbour, not whether they survive
      // doing it — letting the squad sink out was the whole reason it flaked roughly 1 run in 5.
      if (i % 20 === 0) squad.forEach((a, j) => { if (a.sinkT === 0) { station(a, j); a.hp = a.maxhp; } });
      if (phase !== 'play') break;
    }
    return Math.round(dmg);
  });
  expect(dealt).toBeGreaterThan(200);   // was exactly 0 before the fix
});
