const { test, expect } = require('@playwright/test');
test('the D-pad reaches the map, harbour, build menu and sonar', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('destroyer'); skipBanner();

    const seen = [];
    const orig = window.dispatchEvent.bind(window);
    window.dispatchEvent = (e) => { if (e instanceof KeyboardEvent) seen.push(e.code); return orig(e); };

    const fakePad = (pressedIdx) => ({
      connected: true, axes: [0,0,0,0],
      buttons: Array.from({length:16}, (_,i) => ({ pressed: pressedIdx.includes(i) })),
    });
    const origGet = navigator.getGamepads.bind(navigator);
    let pad = fakePad([]);
    navigator.getGamepads = () => [pad];

    pollGamepad(0.016);                       // settle the edge detector with nothing pressed
    const out = {};
    for (const [idx, label] of [[12,'up'],[13,'down'],[14,'left'],[15,'right']]) {
      seen.length = 0;
      pad = fakePad([idx]); pollGamepad(0.016);
      pad = fakePad([]);    pollGamepad(0.016);
      out[label] = seen.slice();
    }
    navigator.getGamepads = origGet; window.dispatchEvent = orig;
    return out;
  });
  expect(r.up).toContain('KeyN');       // tactical map
  expect(r.down).toContain('KeyR');     // sonar
  expect(r.left).toContain('KeyH');     // harbour
  expect(r.right).toContain('KeyB');    // build
});
