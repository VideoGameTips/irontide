const { test, expect } = require('@playwright/test');
test('a kill kicks the camera, flies its bounty to the wallet, and scales for a boss', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof bountyFly === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    startGame('battleship'); skipBanner();
    const clear = () => document.querySelectorAll('.bounty').forEach(e => e.remove());

    // ordinary kill by the player
    let foe = enemies.find(e => !e.proxy && e.sinkT===0);
    clear(); cameraShake = 0;
    const money0 = money;
    foe.hp = 1; damageTarget(foe, 999, null, foe.pos.clone());
    const normal = { paid: money - money0, shake: +cameraShake.toFixed(2),
                     el: [...document.querySelectorAll('.bounty')].map(e => e.textContent),
                     boss: !!document.querySelector('.bounty.boss') };

    // a boss pays far more and should read bigger
    foe = enemies.find(e => !e.proxy && e.sinkT===0);
    clear(); cameraShake = 0;
    foe.def = Object.assign({}, foe.def, { boss: true });
    const money1 = money;
    foe.hp = 1; damageTarget(foe, 999, null, foe.pos.clone());
    const boss = { paid: money - money1, shake: +cameraShake.toFixed(2),
                   boss: !!document.querySelector('.bounty.boss') };

    // an ALLY's kill pays the player but must not kick the captain's camera
    foe = enemies.find(e => !e.proxy && e.sinkT===0);
    const ally = allies.find(a => !a.proxy);
    clear(); cameraShake = 0;
    const money2 = money;
    if (foe) { foe.hp = 1; damageTarget(foe, 999, ally, foe.pos.clone()); }
    const byAlly = { paid: money - money2, shake: +cameraShake.toFixed(2) };

    // and the setting still turns it off
    clear(); cameraShake = 0; gameSettings.cameraShake = false;
    foe = enemies.find(e => !e.proxy && e.sinkT===0);
    if (foe) { foe.hp = 1; damageTarget(foe, 999, null, foe.pos.clone()); }
    const settingOff = { shake: +cameraShake.toFixed(2) };
    gameSettings.cameraShake = true;

    return { normal, boss, byAlly, settingOff };
  });
  expect(r.normal.paid).toBeGreaterThan(0);
  expect(r.normal.el.length).toBe(1);
  expect(r.normal.el[0]).toMatch(/^\+\$\d+$/);
  expect(r.normal.shake).toBeGreaterThan(0);        // always kicks, even at range
  expect(r.normal.boss).toBe(false);
  expect(r.boss.paid).toBeGreaterThan(r.normal.paid);   // $30,000 vs a few hundred
  expect(r.boss.boss).toBe(true);                       // and renders the larger variant
  expect(r.boss.shake).toBeGreaterThan(r.normal.shake);
  expect(r.byAlly.shake).toBe(0);                  // an ally's kill does not shake your camera
  expect(r.settingOff.shake).toBe(0);              // the K-panel toggle still wins
  expect(errors).toEqual([]);
});
