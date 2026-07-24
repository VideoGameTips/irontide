// Captures the promotion screenshot set straight from the live game.
//
// Output lands in promo/assets/final/ under the canonical names the launch kits
// reference (docs/promo/channels/*.md), so this runs end to end with no manual
// picking in between:
//
//   01-menu.png       English main menu — 31 theaters, sandbox maps, ship market
//   02-combat-hud.png chase view mid-battle, enemy line + hit feed + full HUD
//   03-broadside.png  close broadside pass, daylight, HUD hidden (hero shot)
//   04-armory.png     the categorised armory with its firepower comparison
//   05-night.png      night engagement, moonlit water, HUD hidden
//   06-briefing.png   the theater briefing card
//
// Then: node tools/render-covers.js  (title-card covers built from these)
const { chromium } = require('@playwright/test');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, '..', 'promo', 'assets', 'final');
const GAME = process.env.IRONTIDE_URL || 'https://game.boobank.com/irontide/';

// Photo mode flies a free camera with the HUD hidden. Offsets are (forward, height,
// starboard) relative to the player ship, so a composition survives any heading.
async function compose(page, { forward, height, side, tod }) {
  await page.evaluate(({ forward, height, side, tod }) => {
    photoMode = true;
    document.getElementById('hud').style.display = 'none';
    if (tod != null) { weather.tod = tod; if (window._MAP) window._MAP.tod = tod; }
    const h = player.heading, p = player.pos;
    const f = { x: Math.sin(h), z: Math.cos(h) };
    const r = { x: Math.cos(h), z: -Math.sin(h) };
    photoPos.set(p.x + f.x * forward + r.x * side, height, p.z + f.z * forward + r.z * side);
    const dx = p.x - photoPos.x, dz = p.z - photoPos.z, dy = 5 - photoPos.y;
    camYaw.v = Math.atan2(dx, dz);
    camPitch.v = Math.atan2(dy, Math.hypot(dx, dz));
  }, { forward, height, side, tod });
  await page.waitForTimeout(1000);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0, 160)));

  await page.goto(GAME, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object');
  await page.evaluate(() => {
    const b = document.getElementById('storyBtn'), s = document.getElementById('story');
    if (b && s && s.style.display === 'flex') b.click();   // dismiss the prologue
    setLang('en');
    for (const k of ['ironTideTutorialDone', 'ironTidePlaneTutDone', 'ironTideTankTutDone']) {
      try { localStorage.setItem(k, '1'); } catch (e) {}   // tutorial banners would cover the frame
    }
    localStorage.setItem('ironTideDifficulty', 'normal');
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/01-menu.png` });
  console.log('01-menu');

  await page.evaluate(() => startGame('battleship'));
  await page.waitForTimeout(1600);                          // briefing card is on screen
  await page.screenshot({ path: `${OUT}/06-briefing.png` });
  console.log('06-briefing');

  // Arm the ship like a mid-campaign player and stage the engagement in front of it:
  // spawnEnemy() drops ships near the enemy harbour, which is too far to photograph.
  await page.evaluate(() => {
    skipBanner();
    if (typeof skipTutorial === 'function') skipTutorial();
    money = 99999;
    for (const w of ['deckgun', 'deckgun', 'twin', 'bofors', 'oerlikon', 'aa']) {
      selectedWeapon = w;
      try { tryPlace(); } catch (e) {}
    }
    selectedWeapon = null;
    for (let i = 0; i < 4; i++) { try { spawnEnemy(); } catch (e) {} }
    const h = player.heading;
    const f = { x: Math.sin(h), z: Math.cos(h) };
    const r = { x: Math.cos(h), z: -Math.sin(h) };
    const bearings = [-34, -11, 12, 32, 50, -50];
    enemies.forEach((e, i) => {
      const brg = bearings[i % bearings.length] * Math.PI / 180;
      const dist = 175 + (i % 3) * 40;
      e.pos.set(player.pos.x + (f.x * Math.cos(brg) + r.x * Math.sin(brg)) * dist, 0,
                player.pos.z + (f.z * Math.cos(brg) + r.z * Math.sin(brg)) * dist);
      e.heading = h + Math.PI;
      e.fireT = 0.3 + i * 0.4;                              // stagger so the volleys overlap
    });
    fpv = true;                                             // external chase view
  });
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(9000);                          // let the exchange build up
  await page.screenshot({ path: `${OUT}/02-combat-hud.png` });
  console.log('02-combat-hud');

  await compose(page, { forward: 8, height: 11, side: 62 });
  await page.screenshot({ path: `${OUT}/03-broadside.png` });
  console.log('03-broadside');

  await compose(page, { forward: 8, height: 11, side: 62, tod: 0.85 });
  await page.screenshot({ path: `${OUT}/05-night.png` });
  console.log('05-night');

  await page.evaluate(() => {                               // back to daylight, HUD on
    photoMode = false;
    weather.tod = 0.32; if (window._MAP) window._MAP.tod = 0.32;
    document.getElementById('hud').style.display = 'block';
    if (typeof updateMode === 'function') updateMode();
  });
  await page.keyboard.up('KeyW');
  await page.evaluate(() => toggleShop());
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/04-armory.png` });
  console.log('04-armory');
  await page.evaluate(() => toggleShop());

  await browser.close();
  console.log(`\n6 screenshots written to ${OUT}`);
})();
