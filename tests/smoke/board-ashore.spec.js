const { test, expect } = require('@playwright/test');
// The checklist item the suite never covered: G actually takes you ashore and back aboard.
// Everything else about G in the suite is a NEGATIVE assertion (that it does nothing through
// an open panel), so a regression that broke going ashore entirely would have gone unnoticed.
test('G puts the captain ashore beside land and G again re-boards the ship', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();

    // park the ship alongside the nearest landable spot, the way a player would sail up to it
    const spots = landSpots();
    const isl = spots[0];
    player.pos.set(isl.pos.x, 0, isl.pos.z + isl.r + 30);
    player.submerged = false;

    const before = { onFoot, driving };
    toggleFoot();                                   // G — go ashore
    const ashore = { onFoot, footPos: { x: +footPos.x.toFixed(1), z: +footPos.z.toFixed(1) } };

    // the game tells you to walk back to the hull first, so do that — landing puts you on the
    // island, which is deliberately outside boardRange()
    const farFromHull = { dist: +Math.hypot(footPos.x-player.pos.x, footPos.z-player.pos.z).toFixed(1), range: +boardRange().toFixed(1) };
    toggleFoot();
    const refusedFromIsland = { onFoot };            // too far — must refuse
    footPos.set(player.pos.x + 2, footPos.y, player.pos.z + 2);   // walk back alongside
    toggleFoot();
    const reboarded = { onFoot };

    // and from far away it must refuse rather than teleport
    toggleFoot();                                   // ashore again
    footPos.set(player.pos.x + 5000, footPos.y, player.pos.z + 5000);
    toggleFoot();                                   // too far — should stay ashore
    const tooFar = { onFoot };
    return { before, ashore, farFromHull, refusedFromIsland, reboarded, tooFar, spots: spots.length };
  });
  expect(r.spots).toBeGreaterThan(0);
  expect(r.before.onFoot).toBe(false);
  expect(r.ashore.onFoot).toBe(true);        // G took us ashore
  expect(r.farFromHull.dist).toBeGreaterThan(r.farFromHull.range);   // landing really is out of range
  expect(r.refusedFromIsland.onFoot).toBe(true);                     // and G refuses from there
  expect(r.reboarded.onFoot).toBe(false);    // walk back alongside, then G brings us aboard
  expect(r.tooFar.onFoot).toBe(true);        // refused to teleport us aboard from 7km away
  expect(errors).toEqual([]);
});
