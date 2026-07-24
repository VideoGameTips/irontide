// Hero clip: 45s cinematic — helm POV, chase combat, orbiting photo-mode passes.
const { chromium } = require('@playwright/test');
const OUT = require('path').join(__dirname, '..', 'promo', 'assets', 'hero-video');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1600, height: 900 } },
  });
  const page = await ctx.newPage();
  await page.goto('https://game.boobank.com/irontide/', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function');
  await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();
    setLang('en');
    try { localStorage.setItem(TUT_DONE_KEY, '1'); } catch (e) {}
    localStorage.setItem('ironTideDifficulty', 'normal');
  });
  await page.waitForTimeout(2500);              // 0-2.5s  menu

  await page.evaluate(() => {
    startGame('battleship'); skipBanner();
    if (typeof skipTutorial === 'function') skipTutorial();
    money = 99999;
    for (const w of ['deckgun','deckgun','twin','bofors','oerlikon','aa']) { selectedWeapon = w; try { tryPlace(); } catch(e){} }
    selectedWeapon = null;
    for (let i = 0; i < 4; i++) { try { spawnEnemy(); } catch(e){} }
    const h = player.heading, f = {x:Math.sin(h),z:Math.cos(h)}, r = {x:Math.cos(h),z:-Math.sin(h)};
    const spread = [-34,-11,12,32,50,-50];
    enemies.forEach((e,i) => {
      const brg = spread[i%spread.length]*Math.PI/180, d = 175 + (i%3)*40;
      e.pos.set(player.pos.x + (f.x*Math.cos(brg)+r.x*Math.sin(brg))*d, 0,
                player.pos.z + (f.z*Math.cos(brg)+r.z*Math.sin(brg))*d);
      e.heading = h + Math.PI; e.fireT = 0.3 + i*0.4;
    });
  });
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(7000);              // 2.5-9.5s  helm POV, closing on the enemy line

  await page.evaluate(() => { fpv = true; });   // chase view
  await page.waitForTimeout(9000);              // 9.5-18.5s chase-view broadside exchange

  // Cinematic orbit in photo mode while the battle continues
  await page.evaluate(() => {
    photoMode = true;
    document.getElementById('hud').style.display = 'none';
    let a = 0;
    window._orbit = setInterval(() => {
      a += 0.0075;
      const p = player.pos, R = 78, H = 13 + Math.sin(a * 0.7) * 5;
      photoPos.set(p.x + Math.sin(a) * R, H, p.z + Math.cos(a) * R);
      const dx = p.x - photoPos.x, dz = p.z - photoPos.z, dy = 5 - photoPos.y;
      camYaw.v = Math.atan2(dx, dz);
      camPitch.v = Math.atan2(dy, Math.hypot(dx, dz));
    }, 33);
  });
  await page.waitForTimeout(14000);             // 18.5-32.5s orbit

  // Golden-hour beauty pass
  await page.evaluate(() => { weather.tod = 0.16; if (window._MAP) window._MAP.tod = 0.16; });
  await page.waitForTimeout(8000);              // 32.5-40.5s dawn orbit

  await page.evaluate(() => {
    clearInterval(window._orbit);
    photoMode = false;
    document.getElementById('hud').style.display = 'block';
    weather.tod = 0.32; if (window._MAP) window._MAP.tod = 0.32;
    if (typeof updateMode === 'function') updateMode();
    toggleShop();
  });
  await page.waitForTimeout(4000);              // 40.5-44.5s armory panel
  await page.keyboard.up('KeyW');
  await ctx.close(); await browser.close();
  console.log('hero video done');
})();
