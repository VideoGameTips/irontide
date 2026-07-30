const { test, expect } = require('@playwright/test');
// Starting a battle used to build a new world without striking the old one, so the second sortie
// still had the first one's fleets sailing, its islands standing and its garrisons being simulated
// underneath. Six replays took the scene from ~2.5k meshes to ~20k and the frame rate with it.
test('replaying a battle strikes the previous one instead of stacking on it', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof clearBattle === 'function');
  const r = await page.evaluate(async () => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    const meshes = () => { let m = 0; scene.traverse(x => { if (x.isMesh || x.isSprite || x.isPoints) m++; }); return m; };
    const frame = () => new Promise(r => requestAnimationFrame(r));
    currentSandboxIdx = -1; currentMapIdx = 0;
    const runs = [];
    for (let i = 0; i < 4; i++) {
      startGame('destroyer'); skipBanner();
      for (let f = 0; f < 30; f++) await frame();   // let the fleets open fire, so shells and FX are live at the next restart
      runs.push({ enemies: enemies.length, allies: allies.length, islands: islands.length,
                  landUnits: landUnits.length, meshes: meshes() });
    }
    return runs;
  });
  const first = r[0];
  expect(first.landUnits).toBeGreaterThan(20);   // the theater really did populate — otherwise "flat" proves nothing
  expect(first.islands).toBeGreaterThan(2);
  for (const run of r.slice(1)) {
    // fleet sizes are fixed per map, so these must be identical, not merely bounded
    expect(run.enemies).toBe(first.enemies);
    expect(run.allies).toBe(first.allies);
    expect(run.islands).toBe(first.islands);
    // garrisons vary a little with the island shapes each map rolls, but must not compound
    expect(run.landUnits).toBeLessThan(first.landUnits * 1.35);
    // mesh count swings with those same rolls and with live FX; a leak shows up as growth per run
    expect(run.meshes).toBeLessThan(first.meshes * 1.6);
  }
});
