const { test, expect } = require('@playwright/test');
const boot = async page => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof takeCommandOf === 'function');
  await page.evaluate(() => {
    const b=document.getElementById('storyBtn'), s=document.getElementById('story');
    if(b&&s&&s.style.display==='flex') b.click();
    try { localStorage.setItem('ironTideTutorialDone','1'); } catch(e) {}
  });
};

// "Keep shooting them until a white flag shows." The 28% boardable threshold already existed but
// the only sign of it was a line of text you had to be standing next to her to read.
test('an enemy strikes her colours below the boarding threshold, and can lose the flag again', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    const e = enemies[0];
    // drag her alongside so her model is loaded — a proxied hull has nothing to fly a flag from
    for (let i = 0; i < 20; i++) { t2 += 0.05; update(0.05, t2);
      e.pos.copy(player.pos).add(new THREE.Vector3(120, 0, 0)); }
    const loaded = !!e.build;
    e.hp = e.maxhp * 0.5; updateSurrenderFlags();
    const half = { flag: !!e._whiteFlag, boardable: hasStruckColours(e) };
    e.hp = e.maxhp * 0.2; updateSurrenderFlags();
    const struck = { flag: !!e._whiteFlag, boardable: hasStruckColours(e) };
    e.hp = e.maxhp * 0.9; updateSurrenderFlags();
    const repaired = { flag: !!e._whiteFlag };
    // out of range and back: the flag hangs off the hull model, which the proxy system deletes
    e.hp = e.maxhp * 0.2; updateSurrenderFlags();
    destroyShipVisual(e);
    const proxied = { build: !!e.build, ref: !!e._whiteFlag };
    e.build = buildAIShipModel(e.def, 1); scene.add(e.build.group);
    updateSurrenderFlags();
    return { loaded, half, struck, repaired, proxied, backAgain: !!e._whiteFlag };
  });
  expect(r.loaded).toBe(true);
  expect(r.half.flag).toBe(false);       // still fighting
  expect(r.half.boardable).toBe(false);
  expect(r.struck.flag).toBe(true);      // shoot her down to 28% and she gives up
  expect(r.struck.boardable).toBe(true);
  expect(r.repaired.flag).toBe(false);   // patched up, back in the fight
  expect(r.proxied.ref).toBe(false);     // reference dropped with the model...
  expect(r.backAgain).toBe(true);        // ...so she can fly it again on the way back in
});

// "If it's a friendly ship, it's now yours."
test('boarding a friendly hull takes command of it, and your old ship joins the fleet', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    for (let i = 0; i < 12; i++) { t2 += 0.05; update(0.05, t2); }
    const oldHull = player.build, oldName = player.def.name;
    const target = allies.find(a => a.build && (a.sinkT || 0) === 0);
    const beforeAllies = allies.length;
    const ok = takeCommandOf(target);
    const nowMine = player === target;
    const oldHanded = allies.some(a => a.build === oldHull);
    // count the swap where the swap happens: three more seconds of war is long enough for a
    // reinforcement to turn up on its own, which made "one out, one in" fail about one run in six
    const afterAllies = allies.length;
    // and the swap has to survive actually being played
    for (let i = 0; i < 60; i++) { t2 += 0.05; update(0.05, t2); }
    return { ok, oldName, nowMine, oldHanded, beforeAllies, afterAllies,
             newName: player.def.name, alive: phase, hp: Math.round(player.hp),
             notDoubleCounted: allies.indexOf(player) < 0 };
  });
  expect(r.ok).toBe(true);
  expect(r.nowMine).toBe(true);
  expect(r.oldHanded).toBe(true);              // your old hull sails on with the AI, not deleted
  expect(r.afterAllies).toBe(r.beforeAllies);  // one out, one in
  expect(r.notDoubleCounted).toBe(true);       // the ship you command is not also an ally
  expect(r.alive).toBe('play');
  expect(r.hp).toBeGreaterThan(0);
});

// "Land on any ship" — and on airstrips and helipads ashore.
test('an aircraft can set down on a friendly deck, a surrendered enemy, or a shore pad', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('carrier'); skipBanner(); money = 99999;
    for (let i = 0; i < 12; i++) { t2 += 0.05; update(0.05, t2); }
    const out = {};
    const fly = () => { gameSettings.autoTakeoff = true;
      if (!planes.length) buyPlane('fighter');
      flyPlane(planes[0]);
      for (let i = 0; i < 320 && piloting && piloting.phase !== 'fly'; i++) { t2 += 0.05; update(0.05, t2); }
      gameSettings.autoTakeoff = false; return piloting && piloting.phase; };

    // over a friendly hull
    out.airborne = fly();
    const ally = allies.find(a => a.build && (a.sinkT || 0) === 0);
    piloting.pos.set(ally.pos.x, ally.def.deckY + 25, ally.pos.z);
    const site = foreignLandingSite();
    out.siteKind = site && site.kind;
    const took = site ? setDownAt(site) : false;
    out.tookCommand = took && player === ally;
    out.noLongerFlying = !piloting;

    // too high to set down
    startGame('carrier'); skipBanner(); money = 99999;
    for (let i = 0; i < 12; i++) { t2 += 0.05; update(0.05, t2); }
    fly();
    const a2 = allies.find(a => a.build && (a.sinkT || 0) === 0);
    piloting.pos.set(a2.pos.x, a2.def.deckY + 400, a2.pos.z);
    const s2 = foreignLandingSite();
    out.refusedWhenHigh = s2 ? (setDownAt(s2) === false) : 'no-site';
    out.stillFlying = !!piloting;

    // A healthy enemy is not a landing site; a surrendered one is. She needs a loaded model —
    // you cannot put an aircraft down on a point-cloud proxy, and in play a hull you are flying
    // over is never proxied anyway.
    const foe = enemies[0];
    if (!foe.build) { foe.build = buildAIShipModel(foe.def, 1); scene.add(foe.build.group); }
    foe.hp = foe.maxhp; foe.pos.copy(piloting.pos).setY(0);
    allies.forEach(a => { a.pos.x += 6000; });   // keep an ally from being the nearer site
    out.healthyEnemyOffered = (() => { const s = foreignLandingSite(); return !!(s && s.kind === 'prize'); })();
    foe.hp = foe.maxhp * 0.2;
    out.surrenderedEnemyOffered = (() => { const s = foreignLandingSite(); return !!(s && s.kind === 'prize'); })();
    if (piloting) piloting = null;
    return out;
  });
  expect(r.airborne).toBe('fly');
  expect(r.siteKind).toBe('ally');
  expect(r.tookCommand).toBe(true);
  expect(r.noLongerFlying).toBe(true);
  expect(r.refusedWhenHigh).toBe(true);      // you have to actually come down
  expect(r.stillFlying).toBe(true);
  expect(r.healthyEnemyOffered).toBe(false); // shoot her first
  expect(r.surrenderedEnemyOffered).toBe(true);
});
