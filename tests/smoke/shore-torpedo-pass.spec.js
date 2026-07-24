const { test, expect } = require('@playwright/test');
test('a shore-launched torpedo loses its home-island pass once it clears the island', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();
    const isl = islands[0];
    const mk = (x,z) => {
      const sh = { mesh:{ position:new THREE.Vector3(x,1,z), geometry:{type:'SphereGeometry'}, quaternion:{setFromUnitVectors(){}} },
        vel:new THREE.Vector3(0,0,-40), life:9, dist:0, team:0, dmg:10, spawnIsl:isl, water:true, detonated:false };
      return sh;
    };
    // 在岛上空：豁免仍在，不引爆
    shells.length = 0;
    const a = mk(isl.pos.x, isl.pos.z);
    shells.push(a); updateShells(0.016);
    const onIsland = { spawnIslKept: a.spawnIsl === isl, stillAlive: shells.includes(a) };
    // 飞到开阔水面：豁免应当作废
    shells.length = 0;
    const c = mk(isl.pos.x + isl.r + 900, isl.pos.z);
    shells.push(c); updateShells(0.016);
    const offIsland = { spawnIslCleared: c.spawnIsl === null };
    return { onIsland, offIsland };
  });
  expect(r.onIsland.spawnIslKept).toBe(true);      // 还在岛上 → 保留豁免
  expect(r.offIsland.spawnIslCleared).toBe(true);  // 离岛 → 豁免作废
});
