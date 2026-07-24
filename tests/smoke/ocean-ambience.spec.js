const { test, expect } = require('@playwright/test');
test('the sea is audible, rises with sea state, and the bow wash follows speed', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(async () => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    sfxResume();
    startGame('battleship'); skipBanner();
    if (!SFX.seaGain) return { built: false };
    const settle = async (n) => { for(let i=0;i<n;i++){ t2+=0.05; update(0.05,t2); sfxEngine(); }
      await new Promise(r=>setTimeout(r,150)); };
    const read = () => ({ sea: SFX.seaGain.gain.value, wash: SFX.washGain.gain.value });

    weather.sea = 1; keys['KeyW']=0; await settle(40);
    const calmStopped = read();
    keys['KeyW']=1; await settle(60);
    const calmUnderway = read();
    weather.sea = 3; await settle(40);
    const heavy = read();
    keys['KeyW']=0;
    return { built: true, calmStopped, calmUnderway, heavy };
  });
  expect(r.built).toBe(true);
  expect(r.calmStopped.sea).toBeGreaterThan(0);                   // the sea is always there
  expect(r.calmStopped.wash).toBeLessThan(r.calmUnderway.wash);   // bow wash opens up with way on
  expect(r.heavy.sea).toBeGreaterThan(r.calmUnderway.sea);        // heavier sea, louder swell
});
