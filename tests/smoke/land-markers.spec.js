const { test, expect } = require('@playwright/test');
// A land theatre reveals everything within 1700m, but a tank at that range is a couple of
// pixels — so the old code drew a row of red triangles over apparently empty ground, which
// reads as "invisible boats spawning on land levels".
test('distant land units do not leave floating markers over empty ground', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof MARKER_FAR === 'number');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    currentSandboxIdx = SANDBOX_MAPS.findIndex(m=>m.ground);   // a pure-land sandbox
    startGame('battleship'); skipBanner();
    for(let i=0;i<60;i++){ t2+=0.05; update(0.05,t2); }

    const ppos = activePlayerWorldPos();
    const marked = landUnits.filter(u=>!u.dead && u.team===1 && u.marker);
    const far = marked.filter(u=>u.pos.distanceTo(ppos) >= MARKER_FAR);
    const farVisible = far.filter(u=>u.marker.visible);
    return {
      ground: !!(window._MAP && window._MAP.ground),
      enemyShips: enemies.filter(e=>!e.proxy).length,   // land theatres field no fleet at all
      farTotal: far.length,
      farVisible: farVisible.length,
      allFarVisibleAreRevealed: farVisible.every(u => u.revealT > 0),
      markerFar: MARKER_FAR,
    };
  });
  expect(r.ground).toBe(true);
  expect(r.enemyShips).toBe(0);            // no ships at all on a land map
  expect(r.farTotal).toBeGreaterThan(20);  // there really are distant units to test against
  // only units that just fired / were just detected may show a marker at range
  expect(r.allFarVisibleAreRevealed).toBe(true);
  expect(r.farVisible).toBeLessThan(r.farTotal * 0.2);
  expect(r.markerFar).toBeLessThan(1700);
});
