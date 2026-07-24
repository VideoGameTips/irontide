const { test, expect } = require('@playwright/test');
test('a device that is still slow at minimum resolution gets its effect budget cut, and gets it back', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();

    const slowFrame = () => { frameEMA = 40; qualitySlowT = 5; updateAdaptiveQuality(0.05); };
    const fastFrame = () => { frameEMA = 10; qualityFastT = 13; updateAdaptiveQuality(0.05); };

    const start = { pr: renderer.getPixelRatio(), fx: MAX_FX, gfx: gfxQuality };
    for (let i = 0; i < 8; i++) slowFrame();          // grind all the way down
    const bottom = { pr: +renderer.getPixelRatio().toFixed(2), fx: MAX_FX, gfx: gfxQuality };

    for (let i = 0; i < 6; i++) fastFrame();          // now it has headroom again
    const recovered = { pr: +renderer.getPixelRatio().toFixed(2), fx: MAX_FX };
    return { start, bottom, recovered, FX_FULL, FX_LEAN };
  });
  expect(r.start.fx).toBe(r.FX_FULL);
  expect(r.bottom.pr).toBeLessThanOrEqual(0.75);   // resolution really did hit the floor
  expect(r.bottom.gfx).toBe(0);                    // and bloom/AO went off
  expect(r.bottom.fx).toBe(r.FX_LEAN);             // the new rung fired
  expect(r.recovered.fx).toBe(r.FX_FULL);          // effects come back first
});
