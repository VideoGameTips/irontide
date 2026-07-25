// A burning player tank cooks off inside updatePlayerTankAI's own loop. destroyPlayerTank
// used to leave hp positive, so the `hp<=0` guard on the next line waved the wreck through
// to tk.group.position — and group had just been nulled. Reported from the live itch build:
//   TypeError: Cannot read properties of null (reading 'position') at updatePlayerTankAI
const { test, expect } = require('@playwright/test');

test('a tank cooking off mid-update does not crash the game loop', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/');
  await page.waitForFunction(() => typeof startGame === 'function');

  const res = await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    career.mapsUnlocked = 4; currentMapIdx = 2; currentSandboxIdx = -1;
    try { localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
    startGame('battleship'); if (typeof skipTutorial === 'function') skipTutorial(); skipBanner();
    window.updateAdaptiveQuality = () => {};
    money = 999999;
    for (let i = 0; i < 120; i++) { t2 += 1 / 60; update(1 / 60, t2); }

    // Put a tank on the deck and set it one tick away from cooking off.
    if (typeof buyTank === 'function') { try { buyTank('sherman'); } catch (e) {} }
    for (let i = 0; i < 60; i++) { t2 += 1 / 60; update(1 / 60, t2); }
    const tk = playerTanks[0];
    if (!tk) return { skipped: 'no tank could be bought' };
    tk.cook = 0.001;                       // ammunition cook-off fires on the next tick
    const hpBefore = tk.hp;

    let threw = null;
    try { for (let i = 0; i < 240; i++) { t2 += 1 / 60; update(1 / 60, t2); } }
    catch (e) { threw = String(e); }

    return { threw, hpBefore, hpAfter: tk.hp, destroyed: !!tk.destroyed,
             stillListed: playerTanks.includes(tk), groupNulled: tk.group === null };
  });

  expect(res.skipped, res.skipped || '').toBeUndefined();
  expect(res.threw).toBeNull();
  expect(errors).toEqual([]);
  // the wreck must read as dead to every `hp<=0` guard in the file
  expect(res.destroyed).toBe(true);
  expect(res.hpAfter).toBeLessThanOrEqual(0);
});
