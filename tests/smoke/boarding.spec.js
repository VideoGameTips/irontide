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

// The rule CHANGED on a player's suggestion: health is no longer what makes a ship boardable —
// her GUNS are. Board a full-health battleship if you can shoot every turret off her first; a
// crippled hull with one working gun still fights you off. The white flag was kept but re-aimed:
// it now marks "silenced", which is the one thing a player needs to spot across a battle.
test('a ship is boardable when her guns are dead, at any health', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    const e = enemies[0];
    // drag her alongside so her model — and therefore her turrets — actually exist
    for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2);
      e.pos.copy(player.pos).add(new THREE.Vector3(120, 0, 0)); }
    if (!e.loadout || !e.loadout.length) e.loadout = [WEAPONS.deckgun, WEAPONS.deckgun];
    syncNPCDeck(e);
    const guns = shipTurrets(e).length;

    // FULL health, guns intact: not boardable. This is the half that stops it being a freebie.
    e.hp = e.maxhp;
    const healthy = { alive: shipGunsAlive(e), silenced: shipSilenced(e), flag: (updateSurrenderFlags(), !!e._whiteFlag) };

    // ...and CRIPPLED with guns intact is still not boardable, which is the old rule inverted
    e.hp = e.maxhp * 0.05;
    const crippledButArmed = { silenced: shipSilenced(e) };

    // now shoot the guns off, at FULL health
    e.hp = e.maxhp;
    const wp = new THREE.Vector3();
    for (const t of shipTurrets(e)) { t.getWorldPosition(wp); damageShipTurret(e, 9999, wp.clone()); }
    updateSurrenderFlags();
    const silenced = { alive: shipGunsAlive(e), silenced: shipSilenced(e), flag: !!e._whiteFlag,
                       hpFraction: e.hp / e.maxhp };
    return { guns, healthy, crippledButArmed, silenced };
  });

  expect(r.guns, 'she had no turrets to shoot off').toBeGreaterThan(0);
  // guns up = not boardable, however healthy or hurt she is
  expect(r.healthy.alive).toBe(r.guns);
  expect(r.healthy.silenced).toBe(false);
  expect(r.healthy.flag).toBe(false);
  expect(r.crippledButArmed.silenced, 'a crippled ship with working guns must still fight you off').toBe(false);
  // guns gone = boardable, at FULL health
  expect(r.silenced.alive).toBe(0);
  expect(r.silenced.silenced).toBe(true);
  expect(r.silenced.flag).toBe(true);
  expect(r.silenced.hpFraction, 'she should be at full health and still takeable').toBeGreaterThan(0.9);
});

// Shooting her guns off has to MEAN something beyond unlocking the boarding prompt, or
// "destroy her defences" is a cosmetic errand.
test('a silenced ship stops shooting back', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    const e = enemies[0];
    for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2);
      e.pos.copy(player.pos).add(new THREE.Vector3(150, 0, 0)); }
    if (!e.loadout || !e.loadout.length) e.loadout = [WEAPONS.deckgun, WEAPONS.deckgun];
    // Freeze her armament. growLoadout runs all battle long and buying a gun mid-measurement made
    // this flaky — she really was firing, from a battery she had just bought. The game handles
    // that now (a silenced ship stops upgrading); this pins the fixture so the test measures the
    // firing rule and not the shop.
    e.upgT = 1e9;
    // ...and keep her afloat. Over a 20-second live battle the rest of your fleet was sinking her
    // mid-measurement, and a ship on the bottom is silent for reasons that have nothing to do with
    // the rule under test. Probed it: loadout 1, turrets 0, sunk. This measures gunnery, not death.
    e.hp = e.maxhp = 1e9;
    syncNPCDeck(e);

    // Count the SHELLS she actually puts in the water, not calls to a function we stubbed —
    // wrapping window.aiShipFire did not reliably intercept the call site, and a spy that does
    // not spy reports a silent ship whatever the rule says.
    let fired = 0;
    const realSpawn = window.spawnShell;
    window.spawnShell = (w, pos, dir, team, owner, ...rest) => {
      if (owner === e) fired++; return realSpawn(w, pos, dir, team, owner, ...rest); };
    const run = secs => { fired = 0; e.fireT = 0;
      for (let i = 0; i < secs * 30; i++) { t2 += 1/30; update(1/30, t2);
        e.pos.copy(player.pos).add(new THREE.Vector3(150, 0, 0)); }
      return fired; };

    // Three seconds, not twenty. run() zeroes fireT, so a ship that is ALLOWED to fire does so on
    // the first frame — a long window adds no signal and twenty seconds of live battle is twenty
    // seconds of chances to sink her, proxy her model or change her loadout underneath the test.
    const armed = run(3);
    const wp = new THREE.Vector3();
    for (let i = 0; i < 40 && shipGunsAlive(e) > 0; i++) {
      const ts = shipTurrets(e); if (!ts.length) break;
      for (const t of ts) { t.getWorldPosition(wp); damageShipTurret(e, 9999, wp.clone()); }
    }
    const silenced = run(3);
    window.spawnShell = realSpawn;
    return { armed, silenced, alive: shipGunsAlive(e), afloat: (e.sinkT||0)===0 && e.hp>0 };
  });

  expect(r.armed, 'she never fired even with her guns intact — the fixture is broken').toBeGreaterThan(0);
  expect(r.afloat, 'she sank — this measured death, not gunnery').toBe(true);
  expect(r.alive).toBe(0);
  expect(r.silenced, 'a ship with every gun wrecked kept firing').toBe(0);
});

// The guns have to die from being SHOT. Every test above knocks them out by calling
// damageShipTurret directly, which leaves the one line that wires it into the damage path —
// damageTarget — completely uncovered. Removing that line passed every other test in this file.
test('shells landing on a ship are what wreck her guns', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    const e = enemies[0];
    for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2);
      e.pos.copy(player.pos).add(new THREE.Vector3(120, 0, 0)); }
    if (!e.loadout || !e.loadout.length) e.loadout = [WEAPONS.deckgun, WEAPONS.deckgun];
    syncNPCDeck(e);
    e.hp = e.maxhp * 1000;                       // keep her afloat so this measures guns, not sinking
    e.maxhp = e.hp;
    const before = shipGunsAlive(e), total = shipTurrets(e).length;

    // pour real damage in through the ordinary damage path, aimed at each gun in turn
    const wp = new THREE.Vector3();
    for (const t of shipTurrets(e)) {
      t.getWorldPosition(wp);
      for (let i = 0; i < 40 && !t.userData.ko; i++) damageTarget(e, 60, null, wp.clone());
    }
    return { before, total, after: shipGunsAlive(e), silenced: shipSilenced(e),
             stillFloating: e.hp > 0 };
  });

  expect(r.total, 'she had no turrets').toBeGreaterThan(0);
  expect(r.before).toBe(r.total);
  expect(r.stillFloating, 'she sank — this measured sinking, not gunnery').toBe(true);
  expect(r.after, 'shells hitting the ship did not wreck a single gun').toBe(0);
  expect(r.silenced).toBe(true);
});

// Ships beyond a certain range have their models DELETED and rebuilt when they sail back into
// view. The first version of this stored gun damage on the turret meshes, so shooting every gun
// off a battleship was quietly undone the moment she went out of sight — probed it and got
// "silenced, proxied, back again = one gun alive and firing". The state lives on the ship now.
test('guns you have shot off stay off when her model is rebuilt', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    const e = enemies[0];
    for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2);
      e.pos.copy(player.pos).add(new THREE.Vector3(120, 0, 0)); }
    if (!e.loadout || !e.loadout.length) e.loadout = [WEAPONS.deckgun, WEAPONS.deckgun];
    e.upgT = 1e9; syncNPCDeck(e);
    const wp = new THREE.Vector3();
    for (let i = 0; i < 40 && shipGunsAlive(e) > 0; i++)
      for (const t of shipTurrets(e)) { t.getWorldPosition(wp); damageShipTurret(e, 9999, wp.clone()); }
    const silenced = { alive: shipGunsAlive(e), silenced: shipSilenced(e) };

    // she sails out of range and the proxy system bins her model...
    destroyShipVisual(e);
    const proxied = { turrets: shipTurrets(e).length, alive: shipGunsAlive(e), silenced: shipSilenced(e) };

    // ...and comes back
    e.build = buildAIShipModel(e.def, 1); scene.add(e.build.group); syncNPCDeck(e);
    const back = { turrets: shipTurrets(e).length, alive: shipGunsAlive(e), silenced: shipSilenced(e),
                   allDroop: shipTurrets(e).every(t => !!t.userData.ko) };
    return { silenced, proxied, back };
  });

  expect(r.silenced.alive).toBe(0);
  expect(r.silenced.silenced).toBe(true);
  // even with NO model at all she is still a silenced ship — the answer cannot depend on meshes
  expect(r.proxied.turrets).toBe(0);
  expect(r.proxied.alive).toBe(0);
  expect(r.proxied.silenced, 'she un-silenced herself by sailing out of view').toBe(true);
  // and when her model comes back, the guns come back WRECKED
  expect(r.back.turrets).toBeGreaterThan(0);
  expect(r.back.alive, 'her guns grew back when the model was rebuilt').toBe(0);
  expect(r.back.silenced).toBe(true);
  expect(r.back.allDroop, 'the rebuilt turrets look undamaged').toBe(true);
});

// You can come at her on foot, in a tank, or out of an aircraft — the only difference is where
// "you" are, and an aircraft has to actually be down at deck height rather than passing over.
test('you can board from a tank or an aircraft, not just on foot', async ({ page }) => {
  await boot(page);
  const r = await page.evaluate(() => {
    career.mapsUnlocked = 30; currentSandboxIdx = -1; currentMapIdx = 14;
    startGame('destroyer'); skipBanner();
    const e = enemies[0];
    for (let i = 0; i < 40; i++) { t2 += 0.05; update(0.05, t2);
      e.pos.copy(player.pos).add(new THREE.Vector3(120, 0, 0)); }
    if (!e.loadout || !e.loadout.length) e.loadout = [WEAPONS.deckgun, WEAPONS.deckgun];
    syncNPCDeck(e);
    const wp = new THREE.Vector3();
    for (const t of shipTurrets(e)) { t.getWorldPosition(wp); damageShipTurret(e, 9999, wp.clone()); }

    const clear = () => { onFoot = false; drivingTank = null; piloting = null; };
    const at = v => e.pos.clone().add(new THREE.Vector3(v, 0, 0));

    clear(); onFoot = true; footPos.copy(at(6));
    const byFoot = !!boardableEnemyShip();

    clear(); drivingTank = { pos: at(6) };
    const byTank = !!boardableEnemyShip();

    clear(); piloting = { pos: at(6).setY(8) };
    const byPlaneLow = !!boardableEnemyShip();
    piloting = { pos: at(6).setY(120) };
    const byPlaneHigh = !!boardableEnemyShip();

    clear(); onFoot = true; footPos.copy(at(900));
    const tooFar = !!boardableEnemyShip();
    clear();
    return { byFoot, byTank, byPlaneLow, byPlaneHigh, tooFar };
  });

  expect(r.byFoot).toBe(true);
  expect(r.byTank, 'a tank alongside cannot board').toBe(true);
  expect(r.byPlaneLow, 'an aircraft down at deck height cannot board').toBe(true);
  expect(r.byPlaneHigh, 'an aircraft at 120 m should NOT be able to board').toBe(false);
  expect(r.tooFar).toBe(false);
});

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
    if (!foe.loadout || !foe.loadout.length) foe.loadout = [WEAPONS.deckgun, WEAPONS.deckgun];
    syncNPCDeck(foe);
    out.healthyEnemyOffered = (() => { const s = foreignLandingSite(); return !!(s && s.kind === 'prize'); })();
    // Health is no longer what opens a hull up — silencing her guns is. She stays at FULL health
    // here on purpose: under the old rule this line read foe.hp = foe.maxhp * 0.2.
    const wp = new THREE.Vector3();
    for (const t of shipTurrets(foe)) { t.getWorldPosition(wp); damageShipTurret(foe, 9999, wp.clone()); }
    out.silencedEnemyHp = foe.hp / foe.maxhp;
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
  expect(r.healthyEnemyOffered).toBe(false); // shoot her guns off first
  expect(r.surrenderedEnemyOffered).toBe(true);
  expect(r.silencedEnemyHp, 'she should be takeable at full health now').toBeGreaterThan(0.9);
});
