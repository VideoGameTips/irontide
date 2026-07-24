const { test, expect } = require('@playwright/test');
test('time spent in the armory does not count against the under-par star', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(async () => {
    const frames = n => new Promise(res => { let i=0; const t=()=>{ if(++i>=n) return res(); requestAnimationFrame(t); }; requestAnimationFrame(t); });
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();
    const t0 = t2, a0 = armoryT;
    // let the war run a bit with the armory shut
    await frames(12);
    const fightingOnly = { elapsed: t2 - t0, banked: armoryT - a0 };
    // now shop for a while — the clock keeps running (by design) but must be banked
    toggleShop();
    const tShopStart = t2, aShopStart = armoryT;
    await frames(20);
    const shopping = { elapsed: t2 - tShopStart, banked: armoryT - aShopStart };
    toggleShop();
    return { fightingOnly, shopping };
  });
  // fighting time is never banked
  expect(r.fightingOnly.elapsed).toBeGreaterThan(0);
  expect(r.fightingOnly.banked).toBe(0);
  // shopping time is banked ~1:1 with the clock, so it comes straight back off the par
  expect(r.shopping.elapsed).toBeGreaterThan(0);
  expect(r.shopping.banked).toBeCloseTo(r.shopping.elapsed, 5);
});
