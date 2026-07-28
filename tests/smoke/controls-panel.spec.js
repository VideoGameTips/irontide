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
    // bosses are excluded: buildAIShipModel already places their full 16-gun arsenal, and
    // syncing the loadout on top of that put a second turret on eleven of their mounts
    const fleet = [...enemies, ...allies].filter(s => s.build && s.def.kind !== 'sub' && !s.proxy && !s.def.boss);
    const before = fleet.map(s => ({ guns: s.build.npcTurrets.length, load: s.loadout.length,
                                     planes: s.build.deckPlanes.length }));
    for (let i = 0; i < 600; i++) { t2 += 0.05; update(0.05, t2); }   // they buy more weapons over time
    const alive = [...enemies, ...allies].filter(s => s.build && s.def.kind !== 'sub' && !s.proxy && !s.def.boss && s.sinkT === 0);
    const boss = [...enemies].find(s => s.def.boss && s.build);
    return { count: fleet.length,
             bossExtraTurrets: boss ? boss.build.npcTurrets.length : 0,
             allArmed: before.every(b => b.guns === Math.min(b.load, 99)),
             allRanged: before.every(b => b.planes > 0),
             matchesLoadout: alive.every(s => s.build.npcTurrets.length === Math.min(s.loadout.length, s.build.mounts.length)),
             grew: alive.some(s => s.build.npcTurrets.length > 1) };
  });
  expect(r.count).toBeGreaterThan(1);   // enemy fleet composition is random; we just need a sample
  expect(r.bossExtraTurrets).toBe(0);   // the flagship must NOT get a second layer of guns
  expect(r.allArmed).toBe(true);
  expect(r.allRanged).toBe(true);
  expect(r.matchesLoadout).toBe(true);   // turrets keep tracking the loadout as it grows
  expect(r.grew).toBe(true);
});

// A key listed that refuses when you press it is exactly what this panel exists to prevent.
test('the panel never lists an action that would be refused', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    const keysOf = () => { for(let i=0;i<12;i++){ t2+=0.05; update(0.05,t2); }
      return [...document.querySelectorAll('#actList .actgrp.more .actrow')]
        .map(x => x.querySelector('.actkey').textContent); };
    currentSandboxIdx = -1;
    currentMapIdx = 1;  startGame('destroyer'); skipBanner(); const banned = keysOf();
    currentMapIdx = 14; startGame('destroyer'); skipBanner(); const naval  = keysOf();
    // and prove the refusals are real, not imagined
    promptMsg=''; const t0=tacticalOpen; currentMapIdx = 1; startGame('destroyer'); skipBanner();
    toggleTacticalMap(); const mapRefused = tacticalOpen === t0; if(tacticalOpen) toggleTacticalMap();
    currentMapIdx = 14; startGame('destroyer'); skipBanner();
    const b0 = buildOpen; toggleBuild(); const buildRefused = buildOpen === b0; if(buildOpen) toggleBuild();
    return { banned, naval, mapRefused, buildRefused };
  });
  expect(r.mapRefused).toBe(true);            // strategic weapons barred on that theatre
  expect(r.banned).not.toContain('N');        // ...so N is not offered there
  expect(r.naval).toContain('N');             // ...but is where it works
  expect(r.buildRefused).toBe(true);          // engineers need you ashore
  expect(r.naval).not.toContain('B');         // ...so B is not offered from the deck
});

// NPC aircraft are a real inventory now: the aircraft you can SEE ranged on the deck is the one
// that rolls out, and it comes back by flying home and landing rather than reappearing on a timer.
test('an NPC launches the aircraft on its deck, and that aircraft flies home and re-ranges', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof npcRecoverToDeck === 'function');
  const r = await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    currentMapIdx = 14; currentSandboxIdx = -1;
    startGame('battleship'); skipBanner();
    for (let i = 0; i < 8; i++) { t2 += 0.05; update(0.05, t2); }
    const ship = [...enemies, ...allies].find(x => x.build && x.build.deckPlanes && x.build.deckPlanes.length && !x.proxy);
    if (!ship) return { skipped: true };
    const ranged = ship.build.deckPlanes.length;
    const model = ship.build.deckPlanes[ship.build.deckPlanes.length - 1];
    launchFromDeck(ship);
    // the model that was parked is the model that is rolling — not a stand-in, and not hidden
    const roll = deckRolls[deckRolls.length - 1];
    const rolledTheRangedOne = roll && roll.group === model && roll.kind === 'launch';
    const stillVisible = model.visible;
    for (let i = 0; i < 300 && deckRolls.length; i++) { t2 += 0.05; update(0.05, t2); }
    const flown = aiPlanes.filter(x => x.homeShip === ship);
    flown.forEach(x => { x.fuel = 1; });            // send her home
    let sawRecovery = false, back = false;
    for (let i = 0; i < 2600; i++) {
      t2 += 0.05; update(0.05, t2);
      if (deckRolls.some(x => x.kind === 'recover')) sawRecovery = true;
      if (!ship.build || ship.sinkT > 0) break;
      if (ship.build.deckPlanes.length >= ranged) { back = true; break; }
    }
    return { ranged, rolledTheRangedOne, stillVisible, remembersHome: flown.length > 0, sawRecovery, back };
  });
  if (r.skipped) return;
  expect(r.ranged).toBeGreaterThan(0);
  expect(r.rolledTheRangedOne).toBe(true);   // the deck you see is the deck that is
  expect(r.stillVisible).toBe(true);         // ...and it never blinks out to taxi
  expect(r.remembersHome).toBe(true);
  expect(r.sawRecovery).toBe(true);          // it lands, rather than hovering to refuel
  expect(r.back).toBe(true);                 // and is ranged again afterwards
});

test('both new settings are reachable, in either language', async ({ page }) => {
  await boot(page);
  const read = lang => page.evaluate(l => {
    setLang(l); startGame('destroyer'); skipBanner(); toggleSettings();
    const r = [...document.querySelectorAll('#settingsList .setitem')].map(d => d.querySelector('span').textContent);
    toggleSettings(); return r;
  }, lang);
  const en = await read('en');
  expect(en.some(r => r.includes('Auto takeoff'))).toBe(true);      // the feature is reachable at all
  expect(en.some(r => r.includes('what can I do'))).toBe(true);
  const zh = await read('zh');
  expect(zh.some(r => r.includes('自动起飞'))).toBe(true);
  expect(zh.some(r => r.includes('现在能做什么'))).toBe(true);
  // every row translated — a half-Chinese settings panel is how the old rows were spotted
  expect(zh.filter(r => /[a-zA-Z]{4,}/.test(r))).toEqual([]);
});
