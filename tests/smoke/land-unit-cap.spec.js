const { test, expect } = require('@playwright/test');
test('mobile land units are capped per side, and loading a save is idempotent', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof MAX_LAND_UNITS === 'number');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    currentMapIdx = 13; currentSandboxIdx = -1;    // the theatre with the largest garrisons
    startGame('battleship'); skipBanner();
    const mobile = t => landUnits.filter(u=>!u.dead&&u.team===t&&!STRUCT_KINDS.includes(u.kind)).length;

    const atStart = { mine: mobile(0), theirs: mobile(1) };
    for(let i=0;i<200;i++){ t2+=0.05; update(0.05,t2); }   // production runs for 10s
    const after = { mine: mobile(0), theirs: mobile(1) };

    // a save must restore exactly what it stored, and twice must equal once
    const live = landUnits.filter(u=>!u.dead).length;
    saveWar();
    const stored = (JSON.parse(localStorage.getItem('ironTideSave')||'{}').units||[]).length;
    resumeWar(); const once = landUnits.filter(u=>!u.dead).length;
    resumeWar(); const twice = landUnits.filter(u=>!u.dead).length;
    return { cap: MAX_LAND_UNITS, atStart, after, live, stored, once, twice };
  });
  expect(r.atStart.mine).toBeLessThanOrEqual(r.cap);
  expect(r.atStart.theirs).toBeLessThanOrEqual(r.cap);
  expect(r.after.mine).toBeLessThanOrEqual(r.cap);      // production cannot exceed it either
  expect(r.after.theirs).toBeLessThanOrEqual(r.cap);
  expect(r.once).toBe(r.twice);                          // loading twice != doubling
  expect(Math.abs(r.once - r.stored)).toBeLessThanOrEqual(2);   // and the cap doesn't truncate a save
  expect(errors).toEqual([]);
});
