// Core-loop smoke suite (#37): boots the real game in Chrome and walks the loop a child
// actually plays — menu → war → shop → install → autosave → resume → language toggle.
// State is driven/asserted via page.evaluate against the game's own globals, the same
// harness style used for manual verification throughout this repo's history. Pointer-lock
// and pixel-input plumbing are exercised by humans on real devices, not here.
const { test, expect } = require('@playwright/test');

const GAME = 'http://localhost:3000/';

async function boot(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(GAME);
  await page.waitForFunction(() => typeof startGame === 'function' && typeof SHIPS === 'object');
  // a fresh profile sees the prologue — dismiss it so the menu is interactive
  await page.evaluate(() => {
    const b = document.getElementById('storyBtn');
    const story = document.getElementById('story');
    if (b && story && story.style.display === 'flex') b.click();
  });
  return errors;
}

test('boots to the menu with all merged systems present and no console errors', async ({ page }) => {
  const errors = await boot(page);
  const probe = await page.evaluate(() => ({
    phase, hasLORE: typeof LORE !== 'undefined', hasMP: typeof MP !== 'undefined',
    hasMusic: typeof MUSIC !== 'undefined', terrain: typeof islandSurfaceY === 'function',
    composerLibs: typeof THREE.EffectComposer !== 'undefined',
    ships: Object.keys(SHIPS).length,
  }));
  expect(probe.phase).toBe('select');
  expect(probe.hasLORE && probe.hasMP && probe.hasMusic && probe.terrain && probe.composerLibs).toBe(true);
  expect(probe.ships).toBeGreaterThan(5);
  expect(errors).toEqual([]);
});

test('a war starts at the helm with starter guns, difficulty applied, and the war pauses in the armory', async ({ page }) => {
  const errors = await boot(page);
  const probe = await page.evaluate(() => {
    localStorage.setItem('ironTideDifficulty', 'easy');
    startGame('destroyer'); skipBanner();
    const atStart = { phase, driving, guns: placed.length, hp: player.hp, defHp: player.def.hp, music: MUSIC.playing };
    toggleShop();
    const paused = gamePaused();
    const t2Before = t2;
    for (let i = 0; i < 30; i++) update(0.033, t2); // paused: loop() would skip update, emulate its gate
    toggleShop();
    return { atStart, paused, t2Frozen: t2 === t2Before };
  });
  expect(probe.atStart.phase).toBe('play');
  expect(probe.atStart.driving).toBe(true);            // spawns at the helm
  expect(probe.atStart.guns).toBeGreaterThanOrEqual(2); // free starter guns
  expect(probe.atStart.hp).toBeGreaterThan(probe.atStart.defHp); // easy-mode hull bonus
  expect(probe.atStart.music).toBe(true);
  expect(probe.paused).toBe(true);
  expect(errors).toEqual([]);
});

test('selecting and installing a weapon spends money and mounts a turret', async ({ page }) => {
  const errors = await boot(page);
  const probe = await page.evaluate(() => {
    startGame('destroyer'); skipBanner();
    money = 99999;
    const before = placed.length;
    selectedWeapon = 'deckgun';
    const moneyBefore = money;
    tryPlace();
    return { before, after: placed.length, spent: moneyBefore - money };
  });
  expect(probe.after).toBe(probe.before + 1);
  expect(probe.spent).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('autosave round-trips: save a war, reload the page, resume it', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    startGame('destroyer'); skipBanner();
    money = 4321;
    for (let i = 0; i < 10; i++) update(0.033, t2 + i * 0.033);
    saveWar();
  });
  const saved = await page.evaluate(() => { const s = loadSave(); return s && { money: s.money, shipId: s.shipId }; });
  expect(saved).toEqual({ money: 4321, shipId: 'destroyer' });
  await page.reload();
  await page.waitForFunction(() => typeof resumeWar === 'function');
  const probe = await page.evaluate(() => {
    const story = document.getElementById('story');
    if (story && story.style.display === 'flex') document.getElementById('storyBtn').click();
    resumeWar();
    return { phase, money, music: MUSIC.playing, shipId: player.shipId };
  });
  expect(probe.phase).toBe('play');
  expect(probe.money).toBe(4321);
  expect(probe.music).toBe(true);                       // resumed wars get their music back
  expect(probe.shipId).toBe('destroyer');
  expect(errors).toEqual([]);
});

test('language toggle: the menu re-renders in Chinese and back', async ({ page }) => {
  const errors = await boot(page);
  const probe = await page.evaluate(() => {
    setLang('zh');
    const zhText = document.getElementById('menu').textContent;
    setLang('en');
    const enText = document.getElementById('menu').textContent;
    return { zhHasHan: /[一-鿿]/.test(zhText), enOk: isZh() === false, differs: zhText !== enText };
  });
  expect(probe.zhHasHan).toBe(true);
  expect(probe.enOk).toBe(true);
  expect(probe.differs).toBe(true);
  expect(errors).toEqual([]);
});

test('defeat offers a soft retry that restarts the same theater after reload', async ({ page }) => {
  const errors = await boot(page);
  await page.evaluate(() => {
    startGame('destroyer'); skipBanner();
    career.lossStreak = 1;           // second consecutive loss → streak encouragement copy
    endGame(false);
  });
  const over = await page.evaluate(() => ({
    retryShown: document.getElementById('overRetry').style.display !== 'none',
    hasCheer: document.getElementById('overText').innerHTML.includes('#8fd0a0'),
    streak: career.lossStreak,
  }));
  expect(over.retryShown).toBe(true);
  expect(over.hasCheer).toBe(true);
  expect(over.streak).toBe(2);
  await page.evaluate(() => setTimeout(retrySameWar, 0));   // reloads the page with the retry intent stashed
  await page.waitForFunction(() => typeof phase !== 'undefined' && phase === 'play');
  const probe = await page.evaluate(() => {
    for (let i = 0; i < 10; i++) update(0.033, t2 + i * 0.033);   // let the objective HUD tick once
    return { phase, ship: player.def.name, compass: (document.getElementById('obcompass') || {}).textContent || '' };
  });
  expect(probe.phase).toBe('play');
  expect(probe.ship).toBe('Destroyer');
  expect(probe.compass).toContain('🧭');
  expect(errors).toEqual([]);
});

test('shell detonates on island terrain; shore torpedo stays exempt', async ({ page }) => {
  const errors = await boot(page);
  const probe = await page.evaluate(() => {
    startGame('destroyer'); skipBanner();
    const isl = islands.find(i => i.r > 30 && i.name !== 'Northwatch' && i.name !== 'Southhaven');
    const edge = islandPoint(isl, 0, 1.3, 0.7);
    const dir = isl.pos.clone().setY(0.7).sub(edge).normalize();
    spawnShell(WEAPONS.deckgun, edge, dir, 0, null, false);
    const sh = shells[shells.length - 1]; sh.vel = dir.clone().multiplyScalar(60);
    for (let i = 0; i < 200 && shells.includes(sh); i++) updateShells(0.033);
    const shellDetonated = !shells.includes(sh);
    const inside = islandPoint(isl, 0, 0.3, 0.6);
    spawnShell({ dmg: 40, spd: 60, splash: 7, kind: 'torpedo', col: 0x9aa2aa }, inside, new THREE.Vector3(1, 0, 0), 0, null, false);
    const tp = shells[shells.length - 1];
    for (let i = 0; i < 40 && shells.includes(tp); i++) updateShells(0.033);
    return { shellDetonated, torpedoExempt: shells.includes(tp) };
  });
  expect(probe.shellDetonated).toBe(true);
  expect(probe.torpedoExempt).toBe(true);
  expect(errors).toEqual([]);
});
