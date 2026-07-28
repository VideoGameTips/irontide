const { test, expect } = require('@playwright/test');
const GAME = 'http://localhost:3000/';

async function boot(page) {
  await page.goto(GAME);
  await page.waitForFunction(() => typeof renderActions === 'function');
  await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
  });
}
const readPanel = page => page.evaluate(() => {
  for(let i=0;i<12;i++){ t2+=0.05; update(0.05,t2); }
  const rows = sel => [...document.querySelectorAll(sel)].map(r =>
    r.querySelector('.actkey').textContent + '|' + r.querySelector('span').textContent);
  return { title: document.getElementById('actTitle').textContent,
           now: rows('#actList .actgrp:not(.more) .actrow'),
           always: rows('#actList .actgrp.more .actrow') };
});

// The whole point of the panel is that it tells the truth about the CURRENT situation. A key
// listed that does nothing here is worse than one you never knew about.
test('the action list follows what you are actually doing', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { startGame('destroyer'); skipBanner(); money = 99999; });
  const helm = await readPanel(page);
  expect(helm.now.some(r => r.startsWith('E|'))).toBe(true);
  expect(helm.now.some(r => r.startsWith('F|'))).toBe(false);   // you cannot install a gun from the helm
  expect(helm.always.length).toBeGreaterThan(5);

  await page.evaluate(() => toggleMan());                        // step off the helm onto the deck
  const deck = await readPanel(page);
  expect(deck.title).not.toBe(helm.title);
  expect(deck.now.some(r => r.startsWith('F|'))).toBe(true);
  expect(deck.now.some(r => r.startsWith('Y|'))).toBe(false);    // no aircraft aboard yet

  await page.evaluate(() => buyPlane('fighter'));
  const withPlane = await readPanel(page);
  expect(withPlane.now.some(r => r.startsWith('Y|'))).toBe(true);   // ...now Y does something

  await page.evaluate(() => flyPlane(planes[0]));
  const taxi = await readPanel(page);
  expect(taxi.now.some(r => r.startsWith('Q|'))).toBe(true);
  expect(taxi.now.some(r => r.startsWith('S|'))).toBe(true);        // brake / reverse
  expect(taxi.always.length).toBe(0);                              // no shopping while taxiing
});

test('a submarine is never told to dive when it cannot, and a sub captain is', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { startGame('destroyer'); skipBanner(); });
  const surface = await readPanel(page);
  await page.evaluate(() => { startGame('submarine'); skipBanner(); });
  const sub = await readPanel(page);
  expect(surface.now.some(r => r.startsWith('C|'))).toBe(false);
  expect(sub.now.some(r => r.startsWith('C|'))).toBe(true);
});

test('the panel hides and remembers it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { startGame('destroyer'); skipBanner(); toggleActions(); });
  const hidden = await page.evaluate(() => ({
    cls: document.getElementById('actions').className,
    saved: JSON.parse(localStorage.getItem('ironTideSettings')).hideActions }));
  expect(hidden.cls).toContain('hidden');
  expect(hidden.saved).toBe(true);
  await page.evaluate(() => toggleActions());
  expect(await page.evaluate(() => document.getElementById('actions').className)).not.toContain('hidden');
});

// Auto takeoff has to actually fly the aircraft off with no input at all, and has to get out of
// the way the instant the player touches anything.
test('auto takeoff flies you off unaided, and hands back the moment you touch a control', async ({ page }) => {
  await boot(page);
  const off = await page.evaluate(() => {
    gameSettings.autoTakeoff = false;
    startGame('destroyer'); skipBanner(); money = 99999;
    buyPlane('fighter'); flyPlane(planes[0]);
    for (let i = 0; i < 200 && piloting && piloting.phase !== 'fly'; i++) { t2 += 0.05; update(0.05, t2); }
    const p = piloting && piloting.phase; piloting = null; return p;
  });
  expect(off).toBe('taxi');            // hands off with it disabled = you sit there

  for (const hull of ['destroyer', 'carrier', 'scout']) {
    const r = await page.evaluate(h => {
      gameSettings.autoTakeoff = true;
      startGame(h); skipBanner(); money = 99999;
      buyPlane('fighter'); flyPlane(planes[0]);
      for (let i = 0; i < 320 && piloting && piloting.phase !== 'fly'; i++) { t2 += 0.05; update(0.05, t2); }
      const p = piloting && piloting.phase; piloting = null; return p;
    }, hull);
    expect(r, hull).toBe('fly');
  }

  const takeover = await page.evaluate(() => {
    gameSettings.autoTakeoff = true;
    startGame('destroyer'); skipBanner(); money = 99999;
    buyPlane('fighter'); flyPlane(planes[0]);
    for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2); }
    keys['KeyA'] = 1; for (let i = 0; i < 3; i++) { t2 += 0.05; update(0.05, t2); } delete keys['KeyA'];
    for (let i = 0; i < 60 && piloting; i++) { t2 += 0.05; update(0.05, t2); }
    const r = { manual: !!(piloting && piloting.manualTaxi), speed: piloting ? piloting.speed : -1 };
    piloting = null; gameSettings.autoTakeoff = false; return r;
  });
  expect(takeover.manual).toBe(true);
  expect(takeover.speed).toBeLessThan(1);   // released, it coasts to a stop instead of auto-throttling
});

// Enemy and allied ships used to fight with invisible weapons and an invisible air wing.
test('NPC ships show the guns and aircraft they actually have', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    currentMapIdx = 14; currentSandboxIdx = -1;
    startGame('battleship'); skipBanner();
    for (let i = 0; i < 6; i++) { t2 += 0.05; update(0.05, t2); }
    const fleet = [...enemies, ...allies].filter(s => s.build && s.def.kind !== 'sub' && !s.proxy);
    const before = fleet.map(s => ({ guns: s.build.npcTurrets.length, load: s.loadout.length,
                                     planes: s.build.deckPlanes.length }));
    for (let i = 0; i < 600; i++) { t2 += 0.05; update(0.05, t2); }   // they buy more weapons over time
    const alive = [...enemies, ...allies].filter(s => s.build && s.def.kind !== 'sub' && !s.proxy && s.sinkT === 0);
    return { count: fleet.length,
             allArmed: before.every(b => b.guns === Math.min(b.load, 99)),
             allRanged: before.every(b => b.planes > 0),
             matchesLoadout: alive.every(s => s.build.npcTurrets.length === Math.min(s.loadout.length, s.build.mounts.length)),
             grew: alive.some(s => s.build.npcTurrets.length > 1) };
  });
  expect(r.count).toBeGreaterThan(3);
  expect(r.allArmed).toBe(true);
  expect(r.allRanged).toBe(true);
  expect(r.matchesLoadout).toBe(true);   // turrets keep tracking the loadout as it grows
  expect(r.grew).toBe(true);
});
