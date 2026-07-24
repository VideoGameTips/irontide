const { test, expect } = require('@playwright/test');
test('kid-safe mode hides every nuclear payload and the one-way airframes', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();

    // every plane the data itself marks as nuclear must be filtered
    const nuclearIds = Object.keys(PLANES).filter(k => PLANES[k].nuke);
    const unfilteredNuclear = nuclearIds.filter(k => !FILTERED_PLANES.has(k));

    // what the shop actually offers with the filter on
    SETTINGS.contentFilter = true;
    buildShopUI();
    const offered = [...document.querySelectorAll('#shopList .witem')].map(e => e.dataset.plane || e.dataset.tank || e.dataset.id).filter(Boolean);
    const leakedNuclear = offered.filter(id => PLANES[id] && PLANES[id].nuke);
    const leakedOneWay  = offered.filter(id => id === 'switchblade' || id === 'mhkl235');

    // and the ram is not narrated as a suicide run
    const kidWording = { on: null, off: null };
    const cap = (msg) => { kidWording.last = msg; };
    SETTINGS.contentFilter = true;  kidWording.on  = contentFilterOn();
    SETTINGS.contentFilter = false; kidWording.off = contentFilterOn();
    return { nuclearIds, unfilteredNuclear, offeredCount: offered.length, leakedNuclear, leakedOneWay, kidWording };
  });
  expect(r.nuclearIds.length).toBeGreaterThan(0);   // the data really does flag nuclear planes
  expect(r.unfilteredNuclear).toEqual([]);          // none of them escape the filter list
  expect(r.offeredCount).toBeGreaterThan(0);        // the shop did render
  expect(r.leakedNuclear).toEqual([]);              // none reach the kid-safe shop
  expect(r.leakedOneWay).toEqual([]);
});
